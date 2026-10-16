import { readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPublicRelease } from './publication.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

function userView(row) {
  if (!row) return null;
  return {
    id: row.id, email: row.email, displayName: row.display_name,
    role: row.role, disabled: row.disabled, createdAt: row.created_at
  };
}

function revisionView(row) {
  if (!row) return null;
  return {
    id: row.id, revisionNumber: row.revision_number,
    parentRevisionId: row.parent_revision_id, fields: row.fields,
    internalNotes: row.internal_notes, sourceEvidence: row.source_evidence,
    status: row.workflow_status, changedBy: row.changed_by,
    changedByName: row.changed_by_name || null, createdAt: row.created_at,
    technicalReview: row.review_decision ? {
      decision: row.review_decision, note: row.review_note,
      reviewerId: row.reviewer_id, reviewerName: row.reviewer_name,
      createdAt: row.reviewed_at
    } : null
  };
}

export class PgRepository {
  constructor(pool, { publicationBuilder = buildPublicRelease } = {}) {
    this.pool = pool;
    this.publicationBuilder = publicationBuilder;
  }

  async migrate() {
    const files = (await readdir(path.join(here, '..', 'migrations'))).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
    await this.pool.query('CREATE TABLE IF NOT EXISTS cms_schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    for (const name of files) {
      const exists = await this.pool.query('SELECT 1 FROM cms_schema_migrations WHERE name=$1', [name]);
      if (exists.rowCount) continue;
      const sql = await readFile(path.join(here, '..', 'migrations', name), 'utf8');
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO cms_schema_migrations(name) VALUES($1)', [name]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  }

  async userCount() {
    const { rows } = await this.pool.query('SELECT count(*)::int AS count FROM cms_users');
    return rows[0].count;
  }

  async bootstrapAdmin({ email, displayName, passwordHash }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT pg_advisory_xact_lock(hashtext('ls-cms-initial-admin'))");
      const count = await client.query('SELECT count(*)::int AS count FROM cms_users');
      if (count.rows[0].count !== 0) {
        const error = new Error('The initial administrator has already been created.');
        error.code = 'BOOTSTRAPPED';
        throw error;
      }
      const result = await client.query(
        `INSERT INTO cms_users(email,display_name,role,password_hash)
         VALUES($1,$2,'admin',$3) RETURNING *`, [email, displayName, passwordHash]
      );
      await client.query(
        `INSERT INTO cms_audit_events(actor_id,action,entity_type,entity_id,details)
         VALUES($1,'bootstrap_admin','staff',$2,'{}'::jsonb)`, [result.rows[0].id, String(result.rows[0].id)]
      );
      await client.query('COMMIT');
      return userView(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async seedBaselinePages(records, actorId) {
    if (!Array.isArray(records) || !records.length) throw new TypeError('Baseline route records are required.');
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT pg_advisory_xact_lock(hashtext('ls-cms-site-baseline'))");
      const existing = await client.query('SELECT count(*)::int AS count FROM cms_content_items');
      if (existing.rows[0].count) {
        const error = new Error('Baseline import only runs against an empty CMS content library.'); error.code = 'BASELINE_EXISTS'; throw error;
      }
      const releasePages = [];
      for (const record of records) {
        const itemResult = await client.query(
          `INSERT INTO cms_content_items(content_type,slug,route,created_by)
           VALUES($1,$2,$3,$4) RETURNING *`, [record.type, record.slug, record.route, actorId]
        );
        const revisionResult = await client.query(
          `INSERT INTO cms_content_revisions(item_id,revision_number,fields,internal_notes,source_evidence,workflow_status,changed_by)
           VALUES($1,1,$2::jsonb,$3,$4::jsonb,'published',$5) RETURNING *`,
          [itemResult.rows[0].id, JSON.stringify(record.fields), 'Baseline copied from the current local public preview. This records what the site displayed and does not add technical approval.', JSON.stringify(record.sourceEvidence || []), actorId]
        );
        await client.query(
          'UPDATE cms_content_items SET head_revision_id=$2,published_revision_id=$2 WHERE id=$1',
          [itemResult.rows[0].id, revisionResult.rows[0].id]
        );
        releasePages.push({
          id: itemResult.rows[0].id, type: record.type, slug: record.slug, route: record.route,
          revisionId: revisionResult.rows[0].id, revisionNumber: 1,
          fields: record.fields, publishedAt: revisionResult.rows[0].created_at
        });
      }
      const built = this.publicationBuilder(releasePages);
      await client.query("UPDATE cms_publication_releases SET status='superseded' WHERE status='active'");
      const releaseId = randomUUID();
      await client.query(
        `INSERT INTO cms_publication_releases(id,status,pages,localized_pages,search_index,manifest,created_by)
         VALUES($1,'active',$2::jsonb,$3::jsonb,$4::jsonb,$5::jsonb,$6)`,
        [releaseId, JSON.stringify(built.pages), JSON.stringify(built.localizedPages), JSON.stringify(built.searchIndex), JSON.stringify(built.manifest), actorId]
      );
      await client.query('UPDATE cms_publication_state SET active_release_id=$1 WHERE singleton=true', [releaseId]);
      await this.audit(client, actorId, 'site_baseline_imported', 'publication', releaseId, { routeCount: records.length, pageCount: built.manifest.localePageCounts });
      await client.query('COMMIT');
      return { releaseId, routeCount: records.length, pageCount: built.manifest.pageCount };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findUserByEmail(email) {
    const { rows } = await this.pool.query('SELECT * FROM cms_users WHERE email=$1', [email]);
    return rows[0] || null;
  }

  async getUserById(id) {
    const { rows } = await this.pool.query('SELECT * FROM cms_users WHERE id=$1', [id]);
    return userView(rows[0]);
  }

  async createSession({ tokenHash, userId, expiresAt }) {
    await this.pool.query('INSERT INTO cms_sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)', [tokenHash, userId, expiresAt]);
  }

  async getSession(tokenHash) {
    const { rows } = await this.pool.query(
      `SELECT s.user_id,s.expires_at,u.id,u.email,u.display_name,u.role,u.disabled,u.created_at
       FROM cms_sessions s JOIN cms_users u ON u.id=s.user_id
       WHERE s.token_hash=$1 AND s.expires_at>now()`, [tokenHash]
    );
    if (!rows[0] || rows[0].disabled) return null;
    await this.pool.query('UPDATE cms_sessions SET last_seen_at=now() WHERE token_hash=$1', [tokenHash]);
    return { user: userView(rows[0]), expiresAt: rows[0].expires_at };
  }

  async deleteSession(tokenHash) {
    await this.pool.query('DELETE FROM cms_sessions WHERE token_hash=$1', [tokenHash]);
  }

  async consumeLoginAttempt(keyHash, { limit, windowMinutes }) {
    const { rows } = await this.pool.query(
      `INSERT INTO cms_login_limits(key_hash,window_started_at,attempts)
       VALUES($1,now(),1)
       ON CONFLICT(key_hash) DO UPDATE SET
         attempts=CASE WHEN cms_login_limits.window_started_at < now() - ($3::text || ' minutes')::interval
                       THEN 1 ELSE cms_login_limits.attempts+1 END,
         window_started_at=CASE WHEN cms_login_limits.window_started_at < now() - ($3::text || ' minutes')::interval
                                THEN now() ELSE cms_login_limits.window_started_at END,
         updated_at=now()
       RETURNING attempts, attempts <= $2::int AS allowed, window_started_at`, [keyHash, limit, windowMinutes]
    );
    return { allowed: rows[0].allowed, attempts: rows[0].attempts, resetAt: rows[0].window_started_at };
  }

  async clearLoginAttempts(keyHash) {
    await this.pool.query('DELETE FROM cms_login_limits WHERE key_hash=$1', [keyHash]);
  }

  async listStaff() {
    const { rows } = await this.pool.query('SELECT * FROM cms_users ORDER BY created_at,email');
    return rows.map(userView);
  }

  async listAuditEvents() {
    const { rows } = await this.pool.query(
      `SELECT a.id,a.action,a.entity_type,a.entity_id,a.details,a.created_at,
       u.display_name AS actor_name,u.email AS actor_email
       FROM cms_audit_events a LEFT JOIN cms_users u ON u.id=a.actor_id
       ORDER BY a.created_at DESC LIMIT 300`
    );
    return rows;
  }

  async getDashboardMetrics(routeCount = 0) {
    const [content, media, recentActivity, activeRelease, publication] = await Promise.all([
      this.pool.query(`SELECT
        count(*)::int AS pages,
        count(*) FILTER (WHERE r.workflow_status IN ('draft','changes_requested'))::int AS drafts,
        count(*) FILTER (WHERE r.workflow_status='review_requested')::int AS reviews
        FROM cms_content_items i LEFT JOIN cms_content_revisions r ON r.id=i.head_revision_id`),
      this.pool.query('SELECT count(*)::int AS count,COALESCE(sum(byte_size),0)::bigint AS bytes FROM cms_media'),
      this.listAuditEvents(),
      this.getActivePublication(),
      this.pool.query('SELECT * FROM cms_publication_jobs ORDER BY created_at DESC LIMIT 1')
    ]);
    const job = publication.rows[0] ? this.publicationJobView(publication.rows[0]) : null;
    return {
      counts: {
        pages: Number(routeCount || content.rows[0].pages),
        drafts: content.rows[0].drafts,
        reviews: content.rows[0].reviews,
        media: media.rows[0].count,
        storageBytes: Number(media.rows[0].bytes)
      },
      recentActivity: recentActivity.slice(0, 8).map(event => ({
        action: event.action, actor: event.actor_name || event.actor_email || 'LS staff',
        entityType: event.entity_type, entityId: event.entity_id, createdAt: event.created_at
      })),
      publication: job || {
        status: activeRelease ? 'active' : 'idle', jobId: null, progress: activeRelease ? 100 : 0,
        updatedAt: activeRelease?.activatedAt || null,
        message: activeRelease ? 'The current public release is active.' : 'No CMS release has been activated yet.',
        activeReleaseId: activeRelease?.id || null
      }
    };
  }

  async getSiteSettings() {
    const { rows } = await this.pool.query('SELECT settings,updated_at FROM cms_site_settings WHERE singleton=true');
    return { settings: rows[0]?.settings || { navigation: {}, footer: {}, contact: {}, metadata: {} }, updatedAt: rows[0]?.updated_at || null };
  }

  async updateSiteSettings(settings, actorId) {
    const { rows } = await this.pool.query(
      `UPDATE cms_site_settings SET settings=$1::jsonb,updated_by=$2,updated_at=now()
       WHERE singleton=true RETURNING settings,updated_at`, [JSON.stringify(settings), actorId]
    );
    await this.pool.query(
      `INSERT INTO cms_audit_events(actor_id,action,entity_type,entity_id,details)
       VALUES($1,'settings_updated','settings','site','{}'::jsonb)`, [actorId]
    );
    return { settings: rows[0].settings, updatedAt: rows[0].updated_at };
  }

  publicationJobView(row) {
    return {
      id: row.id, status: row.status, progress: row.progress, message: row.message,
      actor: row.actor_name || null, createdAt: row.created_at, updatedAt: row.updated_at,
      completedAt: row.completed_at, releaseId: row.release_id || null,
      activeReleaseId: row.release_id || null
    };
  }

  async createPublicationJob({ actorId, contentId, revisionId }) {
    const { rows } = await this.pool.query(
      `INSERT INTO cms_publication_jobs(status,message,candidate_content_id,candidate_revision_id,created_by)
       VALUES('queued','Waiting to build the complete public release.',$1,$2,$3) RETURNING *`,
      [contentId, revisionId, actorId]
    );
    return this.publicationJobView(rows[0]);
  }

  async updatePublicationJob({ id, status, progress, message, releaseId = null }) {
    const { rows } = await this.pool.query(
      `UPDATE cms_publication_jobs SET status=$2,progress=$3,message=$4,release_id=COALESCE($5,release_id),
       updated_at=now(),completed_at=CASE WHEN $2 IN ('active','failed') THEN now() ELSE completed_at END
       WHERE id=$1 RETURNING *`, [id, status, progress, message, releaseId]
    );
    return rows[0] ? this.publicationJobView(rows[0]) : null;
  }

  async getPublicationJob(id) {
    const { rows } = await this.pool.query('SELECT * FROM cms_publication_jobs WHERE id=$1', [id]);
    return rows[0] ? this.publicationJobView(rows[0]) : null;
  }

  async listPublicationJobs(limit = 30) {
    const { rows } = await this.pool.query(
      `SELECT j.*,u.display_name AS actor_name FROM cms_publication_jobs j
       JOIN cms_users u ON u.id=j.created_by ORDER BY j.created_at DESC LIMIT $1`, [Math.min(100, Math.max(1, Number(limit) || 30))]
    );
    return rows.map(row => this.publicationJobView(row));
  }

  async getMediaDetails(id) {
    const { rows } = await this.pool.query('SELECT * FROM cms_media WHERE id=$1', [id]);
    if (!rows[0]) return null;
    const usage = await this.pool.query(
      `SELECT DISTINCT i.route,COALESCE(r.fields->'translations'->'en'->>'title',r.fields->'translations'->'en'->>'heading',i.route) AS title
       FROM cms_revision_media rm JOIN cms_content_revisions r ON r.id=rm.revision_id
       JOIN cms_content_items i ON i.id=r.item_id
       WHERE rm.media_id=$1 AND r.id IN (i.head_revision_id,i.published_revision_id) ORDER BY i.route`, [id]
    );
    return { ...this.mediaView(rows[0]), usage: usage.rows.map(row => ({ path: row.route, title: row.title })) };
  }

  async updateMediaMetadata(id, metadata, actorId) {
    const { rows } = await this.pool.query(
      `UPDATE cms_media SET source_url=$2,permission_status=$3,match_status=$4,alt_texts=$5::jsonb
       WHERE id=$1 RETURNING *`, [id, metadata.sourceUrl, metadata.permissionStatus, metadata.matchStatus, JSON.stringify(metadata.altTexts)]
    );
    if (!rows[0]) return null;
    await this.pool.query(
      `INSERT INTO cms_audit_events(actor_id,action,entity_type,entity_id,details)
       VALUES($1,'media_metadata_updated','media',$2,'{}'::jsonb)`, [actorId, id]
    );
    return this.mediaView(rows[0]);
  }

  async createMigrationPreview({ id, actorId, sourceFormat, fileName, sourceChecksum, preview, expiresAt }) {
    await this.pool.query(
      `INSERT INTO cms_migration_previews(id,created_by,source_format,file_name,source_checksum,preview,expires_at)
       VALUES($1,$2,$3,$4,$5,$6::jsonb,$7)`,
      [id, actorId, sourceFormat, fileName, sourceChecksum, JSON.stringify(preview), expiresAt]
    );
  }

  async getMigrationPreview(id, actorId) {
    const { rows } = await this.pool.query(
      'SELECT * FROM cms_migration_previews WHERE id=$1 AND created_by=$2 AND expires_at>now()', [id, actorId]
    );
    return rows[0] ? { id: rows[0].id, sourceFormat: rows[0].source_format, fileName: rows[0].file_name, sourceChecksum: rows[0].source_checksum, preview: rows[0].preview } : null;
  }

  async createMigrationJob({ previewId, actorId }) {
    const { rows } = await this.pool.query(
      `INSERT INTO cms_migration_jobs(preview_id,status,message,created_by)
       VALUES($1,'queued','Waiting to import the reviewed mapping.',$2) RETURNING *`, [previewId, actorId]
    );
    return this.migrationJobView(rows[0]);
  }

  migrationJobView(row) {
    return { id: row.id, status: row.status, progress: row.progress, message: row.message, result: row.result, createdAt: row.created_at, updatedAt: row.updated_at, completedAt: row.completed_at };
  }

  async updateMigrationJob({ id, status, progress, message, result }) {
    const { rows } = await this.pool.query(
      `UPDATE cms_migration_jobs SET status=$2,progress=$3,message=$4,result=COALESCE($5::jsonb,result),updated_at=now(),
       completed_at=CASE WHEN $2 IN ('completed','failed') THEN now() ELSE completed_at END WHERE id=$1 RETURNING *`,
      [id, status, progress, message, result ? JSON.stringify(result) : null]
    );
    return rows[0] ? this.migrationJobView(rows[0]) : null;
  }

  async getMigrationJob(id, actorId) {
    const { rows } = await this.pool.query('SELECT * FROM cms_migration_jobs WHERE id=$1 AND created_by=$2', [id, actorId]);
    return rows[0] ? this.migrationJobView(rows[0]) : null;
  }

  async recordImportedSource({ sourceKey, sourceChecksum, sourceUrl, platform, contentId, actorId }) {
    const { rows } = await this.pool.query(
      `INSERT INTO cms_import_records(source_key,source_checksum,source_url,source_platform,content_id)
       VALUES($1,$2,$3,$4,$5) ON CONFLICT(source_key) DO NOTHING RETURNING source_key`,
      [sourceKey, sourceChecksum, sourceUrl, platform, contentId]
    );
    if (rows[0]) await this.pool.query(
      `INSERT INTO cms_audit_events(actor_id,action,entity_type,entity_id,details)
       VALUES($1,'migration_draft_created','content',$2,$3::jsonb)`, [actorId, contentId, JSON.stringify({ sourceKey })]
    );
    return Boolean(rows[0]);
  }

  async createStaff({ email, displayName, role, passwordHash }, actorId) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        'INSERT INTO cms_users(email,display_name,role,password_hash) VALUES($1,$2,$3,$4) RETURNING *',
        [email, displayName, role, passwordHash]
      );
      await this.audit(client, actorId, 'staff_created', 'staff', rows[0].id, { role });
      await client.query('COMMIT');
      return userView(rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateStaff({ id, role, disabled, displayName }, actorId) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT pg_advisory_xact_lock(hashtext('ls-cms-admin-presence'))");
      const current = await client.query('SELECT role,disabled FROM cms_users WHERE id=$1 FOR UPDATE', [id]);
      if (!current.rowCount) {
        const error = new Error('Staff account not found.'); error.code = 'NOT_FOUND'; throw error;
      }
      const removesActiveAdmin = current.rows[0].role === 'admin' && !current.rows[0].disabled
        && ((role !== undefined && role !== 'admin') || disabled === true);
      if (removesActiveAdmin) {
        const activeAdmins = await client.query("SELECT count(*)::int AS count FROM cms_users WHERE role='admin' AND disabled=false");
        if (activeAdmins.rows[0].count <= 1) {
          const error = new Error('Keep at least one active administrator account.'); error.code = 'LAST_ADMIN'; throw error;
        }
      }
      const { rows } = await client.query(
        `UPDATE cms_users SET role=COALESCE($2,role),disabled=COALESCE($3,disabled),
         display_name=COALESCE($4,display_name),updated_at=now() WHERE id=$1 RETURNING *`,
        [id, role ?? null, disabled ?? null, displayName ?? null]
      );
      if (disabled === true) await client.query('DELETE FROM cms_sessions WHERE user_id=$1', [id]);
      await this.audit(client, actorId, 'staff_updated', 'staff', id, { role: rows[0].role, disabled: rows[0].disabled });
      await client.query('COMMIT');
      return userView(rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async listContent({ type } = {}) {
    const { rows } = await this.pool.query(
      `SELECT i.*,r.id AS revision_id,r.revision_number,r.parent_revision_id,r.fields,r.internal_notes,
       r.source_evidence,r.workflow_status,r.changed_by,r.created_at AS revision_created_at,
       u.display_name AS changed_by_name,tr.decision AS review_decision,tr.note AS review_note,
       tr.reviewer_id,ru.display_name AS reviewer_name,tr.created_at AS reviewed_at
       FROM cms_content_items i LEFT JOIN cms_content_revisions r ON r.id=i.head_revision_id
       LEFT JOIN cms_users u ON u.id=r.changed_by
       LEFT JOIN cms_technical_reviews tr ON tr.revision_id=r.id
       LEFT JOIN cms_users ru ON ru.id=tr.reviewer_id
       WHERE ($1::text IS NULL OR i.content_type=$1)
       ORDER BY i.updated_at DESC,i.route`, [type || null]
    );
    return rows.map((row) => this.itemView(row));
  }

  itemView(row) {
    if (!row) return null;
    return {
      id: row.id, type: row.content_type, slug: row.slug, route: row.route,
      version: row.lock_version, headRevisionId: row.head_revision_id,
      publishedRevisionId: row.published_revision_id,
      createdBy: row.created_by, createdAt: row.created_at, updatedAt: row.updated_at,
      revision: row.revision_id ? revisionView({
        ...row, id: row.revision_id, created_at: row.revision_created_at
      }) : null
    };
  }

  async getContent(id) {
    const { rows } = await this.pool.query(
      `SELECT i.*,r.id AS revision_id,r.revision_number,r.parent_revision_id,r.fields,r.internal_notes,
       r.source_evidence,r.workflow_status,r.changed_by,r.created_at AS revision_created_at,
       u.display_name AS changed_by_name,tr.decision AS review_decision,tr.note AS review_note,
       tr.reviewer_id,ru.display_name AS reviewer_name,tr.created_at AS reviewed_at
       FROM cms_content_items i LEFT JOIN cms_content_revisions r ON r.id=i.head_revision_id
       LEFT JOIN cms_users u ON u.id=r.changed_by
       LEFT JOIN cms_technical_reviews tr ON tr.revision_id=r.id
       LEFT JOIN cms_users ru ON ru.id=tr.reviewer_id WHERE i.id=$1`, [id]
    );
    return this.itemView(rows[0]);
  }

  async getContentByRoute(route) {
    const { rows } = await this.pool.query(
      `SELECT i.*,r.id AS revision_id,r.revision_number,r.parent_revision_id,r.fields,r.internal_notes,
       r.source_evidence,r.workflow_status,r.changed_by,r.created_at AS revision_created_at,
       u.display_name AS changed_by_name,tr.decision AS review_decision,tr.note AS review_note,
       tr.reviewer_id,ru.display_name AS reviewer_name,tr.created_at AS reviewed_at
       FROM cms_content_items i LEFT JOIN cms_content_revisions r ON r.id=i.head_revision_id
       LEFT JOIN cms_users u ON u.id=r.changed_by LEFT JOIN cms_technical_reviews tr ON tr.revision_id=r.id
       LEFT JOIN cms_users ru ON ru.id=tr.reviewer_id WHERE i.route=$1`, [route]
    );
    return this.itemView(rows[0]);
  }

  async getImportedSource(sourceKey) {
    const { rows } = await this.pool.query('SELECT source_checksum,content_id,source_url FROM cms_import_records WHERE source_key=$1', [sourceKey]);
    return rows[0] ? { sourceKey, sourceChecksum: rows[0].source_checksum, contentId: rows[0].content_id, sourceUrl: rows[0].source_url } : null;
  }

  async getRevisionHistory(id) {
    const { rows } = await this.pool.query(
      `SELECT r.*,u.display_name AS changed_by_name,tr.decision AS review_decision,
       tr.note AS review_note,tr.reviewer_id,ru.display_name AS reviewer_name,tr.created_at AS reviewed_at
       FROM cms_content_revisions r LEFT JOIN cms_users u ON u.id=r.changed_by
       LEFT JOIN cms_technical_reviews tr ON tr.revision_id=r.id
       LEFT JOIN cms_users ru ON ru.id=tr.reviewer_id WHERE r.item_id=$1 ORDER BY r.revision_number DESC`, [id]
    );
    return rows.map(revisionView);
  }

  async createContent({ type, slug, route, validated, actorId }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const item = await client.query(
        `INSERT INTO cms_content_items(content_type,slug,route,created_by)
         VALUES($1,$2,$3,$4) RETURNING *`, [type, slug, route, actorId]
      );
      const revision = await client.query(
        `INSERT INTO cms_content_revisions(item_id,revision_number,fields,internal_notes,source_evidence,workflow_status,changed_by)
         VALUES($1,1,$2::jsonb,$3,$4::jsonb,'draft',$5) RETURNING *`,
        [item.rows[0].id, JSON.stringify(validated.fields), validated.internalNotes, JSON.stringify(validated.sourceEvidence), actorId]
      );
      await this.setRevisionMedia(client, revision.rows[0].id, validated.mediaIds);
      const updated = await client.query('UPDATE cms_content_items SET head_revision_id=$2 WHERE id=$1 RETURNING *', [item.rows[0].id, revision.rows[0].id]);
      await this.audit(client, actorId, 'draft_created', 'content', updated.rows[0].id, { type, route, revisionId: revision.rows[0].id });
      await client.query('COMMIT');
      return this.getContent(updated.rows[0].id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateDraft({ id, expectedVersion, validated, actorId }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const locked = await client.query('SELECT * FROM cms_content_items WHERE id=$1 FOR UPDATE', [id]);
      if (!locked.rows[0]) { const error = new Error('Content record not found.'); error.code = 'NOT_FOUND'; throw error; }
      const item = locked.rows[0];
      if (item.lock_version !== expectedVersion) { const error = new Error('This record changed since it was opened. Reload it before saving.'); error.code = 'VERSION_CONFLICT'; throw error; }
      const parent = item.head_revision_id;
      const { rows: revCount } = await client.query('SELECT COALESCE(max(revision_number),0)::int AS n FROM cms_content_revisions WHERE item_id=$1', [id]);
      const revision = await client.query(
        `INSERT INTO cms_content_revisions(item_id,revision_number,parent_revision_id,fields,internal_notes,source_evidence,workflow_status,changed_by)
         VALUES($1,$2,$3,$4::jsonb,$5,$6::jsonb,'draft',$7) RETURNING *`,
        [id, revCount[0].n + 1, parent, JSON.stringify(validated.fields), validated.internalNotes, JSON.stringify(validated.sourceEvidence), actorId]
      );
      await this.setRevisionMedia(client, revision.rows[0].id, validated.mediaIds);
      const updated = await client.query(
        `UPDATE cms_content_items SET head_revision_id=$2,lock_version=lock_version+1,updated_at=now()
         WHERE id=$1 RETURNING *`, [id, revision.rows[0].id]
      );
      await this.audit(client, actorId, 'draft_saved', 'content', id, { revisionId: revision.rows[0].id, revisionNumber: revision.rows[0].revision_number, invalidatesTechnicalReviewOf: parent });
      await client.query('COMMIT');
      return this.getContent(updated.rows[0].id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async requestReview({ id, revisionId, expectedVersion, actorId }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query('SELECT * FROM cms_content_items WHERE id=$1 FOR UPDATE', [id]);
      if (!rows[0]) { const error = new Error('Content record not found.'); error.code = 'NOT_FOUND'; throw error; }
      const item = rows[0];
      if (item.lock_version !== expectedVersion) { const error = new Error('This record changed since it was opened. Reload it before saving.'); error.code = 'VERSION_CONFLICT'; throw error; }
      if (item.head_revision_id !== revisionId) { const error = new Error('Only the current draft revision can be submitted.'); error.code = 'VERSION_CONFLICT'; throw error; }
      const revision = await client.query("UPDATE cms_content_revisions SET workflow_status='review_requested' WHERE id=$1 AND workflow_status IN ('draft','changes_requested') RETURNING *", [revisionId]);
      if (!revision.rows[0]) { const error = new Error('This revision is not ready to be submitted.'); error.code = 'INVALID_STATE'; throw error; }
      await client.query('UPDATE cms_content_items SET lock_version=lock_version+1,updated_at=now() WHERE id=$1', [id]);
      await this.audit(client, actorId, 'review_requested', 'content', id, { revisionId });
      await client.query('COMMIT');
      return this.getContent(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async reviewTechnical({ id, revisionId, expectedVersion, decision, note, actorId }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `SELECT i.*,r.workflow_status FROM cms_content_items i JOIN cms_content_revisions r ON r.id=i.head_revision_id
         WHERE i.id=$1 FOR UPDATE`, [id]
      );
      if (!rows[0]) { const error = new Error('Content record not found.'); error.code = 'NOT_FOUND'; throw error; }
      const item = rows[0];
      if (item.lock_version !== expectedVersion || item.head_revision_id !== revisionId) { const error = new Error('The revision changed. Reload and review the current version.'); error.code = 'VERSION_CONFLICT'; throw error; }
      if (item.content_type !== 'machine') { const error = new Error('Technical review is only used for machine records.'); error.code = 'INVALID_STATE'; throw error; }
      if (item.workflow_status !== 'review_requested') { const error = new Error('This revision has not been submitted for review.'); error.code = 'INVALID_STATE'; throw error; }
      await client.query('DELETE FROM cms_technical_reviews WHERE revision_id=$1', [revisionId]);
      await client.query(
        `INSERT INTO cms_technical_reviews(revision_id,reviewer_id,decision,note) VALUES($1,$2,$3,$4)`,
        [revisionId, actorId, decision, note]
      );
      const status = decision === 'approved' ? 'ready_to_publish' : 'changes_requested';
      await client.query('UPDATE cms_content_revisions SET workflow_status=$2 WHERE id=$1', [revisionId, status]);
      await client.query('UPDATE cms_content_items SET lock_version=lock_version+1,updated_at=now() WHERE id=$1', [id]);
      await this.audit(client, actorId, `technical_${decision}`, 'content', id, { revisionId, note });
      await client.query('COMMIT');
      return this.getContent(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async publish({ id, revisionId, expectedVersion, confirmedRevisionId, actorId }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const publicationState = await client.query('SELECT active_release_id FROM cms_publication_state WHERE singleton=true FOR UPDATE');
      if (!publicationState.rowCount) throw new Error('The public release state is missing. Apply database migrations and retry.');
      const { rows } = await client.query(
        `SELECT i.*,r.id AS revision_id,r.revision_number,r.fields,r.workflow_status,r.created_at AS revision_created_at FROM cms_content_items i
         JOIN cms_content_revisions r ON r.id=i.head_revision_id WHERE i.id=$1 FOR UPDATE`, [id]
      );
      if (!rows[0]) { const error = new Error('Content record not found.'); error.code = 'NOT_FOUND'; throw error; }
      const item = rows[0];
      if (item.lock_version !== expectedVersion || item.head_revision_id !== revisionId || confirmedRevisionId !== revisionId) {
        const error = new Error('Publishing requires explicit confirmation of the current revision. Reload and confirm again.'); error.code = 'VERSION_CONFLICT'; throw error;
      }
      const requiredStatus = item.content_type === 'machine' ? 'ready_to_publish' : 'review_requested';
      if (item.workflow_status !== requiredStatus) { const error = new Error('This revision has not completed its required reviews.'); error.code = 'REVIEW_REQUIRED'; throw error; }
      if (item.content_type === 'machine') {
        const review = await client.query("SELECT 1 FROM cms_technical_reviews WHERE revision_id=$1 AND decision='approved'", [revisionId]);
        if (!review.rowCount) { const error = new Error('The technical reviewer must approve this exact revision before publishing.'); error.code = 'REVIEW_REQUIRED'; throw error; }
      }
      const mediaIds = item.fields.mediaIds || [];
      if (mediaIds.length) {
        const media = await client.query('SELECT id,permission_status,match_status FROM cms_media WHERE id=ANY($1::uuid[])', [mediaIds]);
        if (media.rows.length !== mediaIds.length) { const error = new Error('A linked media record is missing.'); error.code = 'MEDIA_NOT_READY'; throw error; }
        if (media.rows.some((record) => !['ls_owned','licensed'].includes(record.permission_status))) {
          const error = new Error('Confirm media ownership or license before publishing.'); error.code = 'MEDIA_NOT_READY'; throw error;
        }
        if (item.content_type === 'machine' && media.rows.some((record) => record.match_status !== 'exact')) {
          const error = new Error('Machine pages can only publish photographs verified as an exact model match.'); error.code = 'MEDIA_NOT_READY'; throw error;
        }
      }

      const existing = await client.query(
        `SELECT i.id,i.content_type,i.slug,i.route,r.id AS revision_id,r.revision_number,r.fields,r.created_at AS published_at
         FROM cms_content_items i JOIN cms_content_revisions r ON r.id=i.published_revision_id
         WHERE i.id<>$1 ORDER BY i.route`, [id]
      );
      const releasePages = existing.rows.map((row) => ({
        id: row.id, type: row.content_type, slug: row.slug, route: row.route,
        revisionId: row.revision_id, revisionNumber: row.revision_number,
        fields: row.fields, publishedAt: row.published_at
      }));
      releasePages.push({
        id: item.id, type: item.content_type, slug: item.slug, route: item.route,
        revisionId: item.revision_id, revisionNumber: item.revision_number,
        fields: item.fields, publishedAt: item.revision_created_at
      });

      // Build every localized page and search index before changing the public pointer.
      // Any build error aborts this transaction and leaves the previous release active.
      const builtRelease = this.publicationBuilder(releasePages);
      const releaseId = randomUUID();
      await client.query("UPDATE cms_publication_releases SET status='superseded' WHERE status='active'");
      await client.query(
        `INSERT INTO cms_publication_releases(id,status,pages,localized_pages,search_index,manifest,created_by)
         VALUES($1,'active',$2::jsonb,$3::jsonb,$4::jsonb,$5::jsonb,$6)`,
        [releaseId, JSON.stringify(builtRelease.pages), JSON.stringify(builtRelease.localizedPages), JSON.stringify(builtRelease.searchIndex), JSON.stringify(builtRelease.manifest), actorId]
      );
      await client.query('UPDATE cms_publication_state SET active_release_id=$1 WHERE singleton=true', [releaseId]);
      await client.query("UPDATE cms_content_revisions SET workflow_status='published' WHERE id=$1", [revisionId]);
      await client.query('UPDATE cms_content_items SET published_revision_id=$2,lock_version=lock_version+1,updated_at=now() WHERE id=$1', [id, revisionId]);
      await this.audit(client, actorId, 'published', 'content', id, { revisionId, route: item.route, confirmedRevisionId, releaseId, pageCount: builtRelease.manifest.pageCount });
      await client.query('COMMIT');
      return this.getContent(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getPrivateRevision(id, revisionId) {
    const { rows } = await this.pool.query(
      `SELECT i.id AS item_id,i.content_type,i.slug,i.route,i.lock_version,
       r.*,u.display_name AS changed_by_name,tr.decision AS review_decision,tr.note AS review_note,
       tr.reviewer_id,ru.display_name AS reviewer_name,tr.created_at AS reviewed_at
       FROM cms_content_items i JOIN cms_content_revisions r ON r.item_id=i.id
       LEFT JOIN cms_users u ON u.id=r.changed_by
       LEFT JOIN cms_technical_reviews tr ON tr.revision_id=r.id
       LEFT JOIN cms_users ru ON ru.id=tr.reviewer_id
       WHERE i.id=$1 AND ($2::uuid IS NULL OR r.id=$2) ORDER BY r.revision_number DESC LIMIT 1`, [id, revisionId || null]
    );
    if (!rows[0]) return null;
    const row = rows[0];
    return {
      item: { id: row.item_id, type: row.content_type, slug: row.slug, route: row.route, version: row.lock_version },
      revision: revisionView(row)
    };
  }

  async getPublished(route) {
    const release = await this.getActivePublication();
    return release?.pages.find((page) => page.route === route) || null;
  }

  async listPublished() {
    const release = await this.getActivePublication();
    return release?.pages || [];
  }

  async getPublishedSearchIndex(locale) {
    const release = await this.getActivePublication();
    return release?.searchIndex?.[locale] || [];
  }

  async getActivePublication() {
    const { rows } = await this.pool.query(
      `SELECT r.id,r.pages,r.localized_pages,r.search_index,r.manifest,r.created_at,r.activated_at
       FROM cms_publication_state s JOIN cms_publication_releases r ON r.id=s.active_release_id
       WHERE s.singleton=true`
    );
    if (!rows[0]) return null;
    const row = rows[0];
    return {
      id: row.id, pages: row.pages, localizedPages: row.localized_pages,
      searchIndex: row.search_index, manifest: row.manifest,
      createdAt: row.created_at, activatedAt: row.activated_at
    };
  }

  async addMedia(media, actorId) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO cms_media(storage_key,mime_type,byte_size,sha256,source_url,permission_status,match_status,alt_texts,uploaded_by)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9) RETURNING *`,
        [media.storageKey, media.mimeType, media.byteSize, media.sha256, media.sourceUrl, media.permissionStatus, media.matchStatus, JSON.stringify(media.altTexts), actorId]
      );
      await this.audit(client, actorId, 'media_uploaded', 'media', rows[0].id, { mimeType: media.mimeType, byteSize: media.byteSize, permissionStatus: media.permissionStatus, matchStatus: media.matchStatus });
      await client.query('COMMIT');
      return this.mediaView(rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  mediaView(row) {
    return {
      id: row.id, mimeType: row.mime_type, byteSize: Number(row.byte_size), sha256: row.sha256,
      sourceUrl: row.source_url, permissionStatus: row.permission_status,
      matchStatus: row.match_status, altTexts: row.alt_texts,
      uploadedBy: row.uploaded_by, createdAt: row.created_at
    };
  }

  async listMedia() {
    const { rows } = await this.pool.query('SELECT * FROM cms_media ORDER BY created_at DESC');
    return rows.map((row) => this.mediaView(row));
  }

  async getMedia(id) {
    const { rows } = await this.pool.query('SELECT * FROM cms_media WHERE id=$1', [id]);
    return rows[0] ? { ...this.mediaView(rows[0]), storageKey: rows[0].storage_key } : null;
  }

  async isPublishedMedia(id) {
    const release = await this.getActivePublication();
    if (!release?.pages.some((page) => page.fields?.mediaIds?.includes(id))) return null;
    const { rows } = await this.pool.query(
      "SELECT * FROM cms_media WHERE id=$1 AND permission_status IN ('ls_owned','licensed') LIMIT 1", [id]
    );
    return rows[0] ? { ...this.mediaView(rows[0]), storageKey: rows[0].storage_key } : null;
  }

  async setRevisionMedia(client, revisionId, mediaIds) {
    if (!mediaIds.length) return;
    const { rows } = await client.query('SELECT id FROM cms_media WHERE id=ANY($1::uuid[])', [mediaIds]);
    if (rows.length !== mediaIds.length) { const error = new Error('One or more media records do not exist.'); error.code = 'MEDIA_NOT_FOUND'; throw error; }
    await client.query('INSERT INTO cms_revision_media(revision_id,media_id) SELECT $1,unnest($2::uuid[])', [revisionId, mediaIds]);
  }

  async audit(client, actorId, action, entityType, entityId, details = {}) {
    await client.query(
      `INSERT INTO cms_audit_events(actor_id,action,entity_type,entity_id,details)
       VALUES($1,$2,$3,$4,$5::jsonb)`, [actorId, action, entityType, String(entityId), JSON.stringify(details)]
    );
  }
}
