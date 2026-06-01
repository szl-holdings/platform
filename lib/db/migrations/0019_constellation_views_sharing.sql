-- Task #1218: Share saved Constellation views with teammates.
-- Adds visibility + org_id columns so saved views can be promoted from
-- per-user ("private") to org-wide ("org") and discovered by every member of
-- the owning org. Uniqueness is split into two partial indexes so a private
-- view named "Distressed properties" can coexist with a same-named org view.

ALTER TABLE constellation_saved_views
  ADD COLUMN IF NOT EXISTS org_id integer REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE constellation_saved_views
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private';

-- Drop the legacy single-uniqueness covering all rows; replace with partial
-- uniques scoped per visibility so org-shared rows don't collide with the
-- owner's same-named private rows (and vice versa).
DROP INDEX IF EXISTS constellation_saved_views_user_domain_name_uq;

CREATE UNIQUE INDEX IF NOT EXISTS constellation_saved_views_user_domain_name_uq
  ON constellation_saved_views (user_id, domain, name)
  WHERE visibility = 'private';

CREATE UNIQUE INDEX IF NOT EXISTS constellation_saved_views_org_domain_name_uq
  ON constellation_saved_views (org_id, domain, name)
  WHERE visibility = 'org';

CREATE INDEX IF NOT EXISTS constellation_saved_views_org_domain_idx
  ON constellation_saved_views (org_id, domain);
