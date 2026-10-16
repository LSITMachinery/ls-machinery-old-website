CREATE TABLE IF NOT EXISTS cms_publication_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL CHECK (status IN ('active','superseded')),
  pages jsonb NOT NULL,
  localized_pages jsonb NOT NULL,
  search_index jsonb NOT NULL,
  manifest jsonb NOT NULL,
  created_by uuid NOT NULL REFERENCES cms_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cms_publication_releases_created_idx ON cms_publication_releases(created_at DESC);

CREATE TABLE IF NOT EXISTS cms_publication_state (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  active_release_id uuid REFERENCES cms_publication_releases(id)
);
INSERT INTO cms_publication_state(singleton,active_release_id)
VALUES(true,NULL)
ON CONFLICT(singleton) DO NOTHING;
