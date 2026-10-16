CREATE TABLE IF NOT EXISTS cms_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','editor','technical_reviewer','publisher')),
  password_hash text NOT NULL,
  disabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cms_sessions (
  token_hash char(64) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES cms_users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cms_sessions_user_idx ON cms_sessions(user_id);
CREATE INDEX IF NOT EXISTS cms_sessions_expiry_idx ON cms_sessions(expires_at);

CREATE TABLE IF NOT EXISTS cms_login_limits (
  key_hash char(64) PRIMARY KEY,
  window_started_at timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cms_content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('home','machine','food','segment','solution','service','faq','company','insight','career','contact','partnership')),
  slug text NOT NULL,
  route text NOT NULL,
  head_revision_id uuid,
  published_revision_id uuid,
  lock_version integer NOT NULL DEFAULT 1 CHECK (lock_version > 0),
  created_by uuid NOT NULL REFERENCES cms_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_type, slug),
  UNIQUE (route)
);

CREATE TABLE IF NOT EXISTS cms_content_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES cms_content_items(id) ON DELETE CASCADE,
  revision_number integer NOT NULL CHECK (revision_number > 0),
  parent_revision_id uuid REFERENCES cms_content_revisions(id),
  fields jsonb NOT NULL,
  internal_notes text NOT NULL DEFAULT '',
  source_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  workflow_status text NOT NULL CHECK (workflow_status IN ('draft','review_requested','ready_to_publish','changes_requested','published')),
  changed_by uuid NOT NULL REFERENCES cms_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, revision_number)
);
CREATE INDEX IF NOT EXISTS cms_revisions_item_idx ON cms_content_revisions(item_id, revision_number DESC);
ALTER TABLE cms_content_items DROP CONSTRAINT IF EXISTS cms_items_head_revision_fk;
ALTER TABLE cms_content_items ADD CONSTRAINT cms_items_head_revision_fk FOREIGN KEY(head_revision_id) REFERENCES cms_content_revisions(id);
ALTER TABLE cms_content_items DROP CONSTRAINT IF EXISTS cms_items_published_revision_fk;
ALTER TABLE cms_content_items ADD CONSTRAINT cms_items_published_revision_fk FOREIGN KEY(published_revision_id) REFERENCES cms_content_revisions(id);

CREATE TABLE IF NOT EXISTS cms_technical_reviews (
  revision_id uuid PRIMARY KEY REFERENCES cms_content_revisions(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES cms_users(id),
  decision text NOT NULL CHECK (decision IN ('approved','changes_requested')),
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cms_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_key text NOT NULL UNIQUE,
  mime_type text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size > 0),
  sha256 char(64) NOT NULL,
  source_url text NOT NULL DEFAULT '',
  permission_status text NOT NULL CHECK (permission_status IN ('ls_owned','licensed','permission_pending','unknown')),
  match_status text NOT NULL CHECK (match_status IN ('exact','category','illustrative','unverified')),
  alt_texts jsonb NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES cms_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cms_revision_media (
  revision_id uuid NOT NULL REFERENCES cms_content_revisions(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES cms_media(id),
  PRIMARY KEY (revision_id, media_id)
);

CREATE TABLE IF NOT EXISTS cms_audit_events (
  id bigserial PRIMARY KEY,
  actor_id uuid REFERENCES cms_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cms_audit_entity_idx ON cms_audit_events(entity_type, entity_id, created_at DESC);
