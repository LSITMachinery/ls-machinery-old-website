CREATE TABLE IF NOT EXISTS cms_site_settings (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  settings jsonb NOT NULL DEFAULT '{"navigation":{},"footer":{},"contact":{},"metadata":{}}'::jsonb,
  updated_by uuid REFERENCES cms_users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO cms_site_settings(singleton) VALUES(true) ON CONFLICT(singleton) DO NOTHING;

CREATE TABLE IF NOT EXISTS cms_publication_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL CHECK (status IN ('queued','building','validating','active','failed')),
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  message text NOT NULL DEFAULT '',
  candidate_content_id uuid REFERENCES cms_content_items(id) ON DELETE SET NULL,
  candidate_revision_id uuid REFERENCES cms_content_revisions(id) ON DELETE SET NULL,
  release_id uuid REFERENCES cms_publication_releases(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES cms_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS cms_publication_jobs_created_idx ON cms_publication_jobs(created_at DESC);

CREATE TABLE IF NOT EXISTS cms_migration_previews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES cms_users(id) ON DELETE CASCADE,
  source_format text NOT NULL CHECK (source_format IN ('wordpress-wxr','cpanel-tar')),
  file_name text NOT NULL,
  source_checksum char(64) NOT NULL,
  preview jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS cms_migration_previews_expiry_idx ON cms_migration_previews(expires_at);

CREATE TABLE IF NOT EXISTS cms_migration_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  preview_id uuid NOT NULL REFERENCES cms_migration_previews(id),
  status text NOT NULL CHECK (status IN ('queued','importing','completed','failed')),
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  message text NOT NULL DEFAULT '',
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL REFERENCES cms_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS cms_migration_jobs_created_idx ON cms_migration_jobs(created_at DESC);

CREATE TABLE IF NOT EXISTS cms_import_records (
  source_key text PRIMARY KEY,
  source_checksum char(64) NOT NULL,
  source_url text,
  source_platform text NOT NULL CHECK (source_platform IN ('wordpress','cpanel-wordpress')),
  content_id uuid REFERENCES cms_content_items(id) ON DELETE SET NULL,
  curated boolean NOT NULL DEFAULT false,
  imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cms_redirects (
  source_path text PRIMARY KEY,
  target_path text NOT NULL,
  source_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (source_path LIKE '/%' AND target_path LIKE '/%' AND source_path <> target_path)
);
