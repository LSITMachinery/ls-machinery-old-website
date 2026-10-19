import { Pool } from 'pg';
import { PgRepository } from './repository.mjs';
import { hashPassword } from './security.mjs';
import { collectSiteBaseline } from './baseline-import.mjs';

if (process.env.CMS_LOCAL_PREVIEW !== '1' || process.env.CMS_SECURE_COOKIE === '1') throw new Error('Local preview setup must be explicitly enabled.');
let input = '';
for await (const chunk of process.stdin) input += chunk;
const details = JSON.parse(input);
input = '';
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email) || typeof details.password !== 'string' || details.password.length < 10 || details.password.length > 256) throw new Error('Supply the approved local login details through standard input.');
const pool = new Pool({ host:process.env.CMS_DB_HOST, port:Number(process.env.CMS_DB_PORT || 5432), database:process.env.CMS_DB_NAME, user:process.env.CMS_DB_USER, password:process.env.CMS_DB_PASSWORD });
try {
  const repository = new PgRepository(pool);
  await repository.migrate();
  let administrator = (await repository.listStaff()).find(account => account.email === details.email && account.role === 'admin' && !account.disabled);
  if (!administrator) {
    administrator = await repository.bootstrapAdmin({ email:details.email, displayName:'LS Local Administrator', passwordHash:await hashPassword(details.password), localPreviewOnly:true });
  }
  details.password = '';
  // Existing content stays untouched. Baseline copies enter drafts and never create a public release.
  const existing = new Set((await repository.listContent()).map(record => record.route));
  let imported = 0;
  for (const record of await collectSiteBaseline()) {
    if (existing.has(record.route)) continue;
    await repository.createContent({ type:record.type, slug:record.slug, route:record.route, actorId:administrator.id, validated:{ fields:record.fields, mediaIds:[], internalNotes:'Imported from the local website for staff review. No technical approval or publication is implied.', sourceEvidence:record.sourceEvidence } });
    imported++;
  }
  console.log(JSON.stringify({ administrator:administrator.email, importedDrafts:imported, published:false }));
} finally { await pool.end(); }
