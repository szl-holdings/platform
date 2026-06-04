-- Adds an explicit owning team to each registered app so the deployments
-- panel (and any other operator surface) can resolve "who do I page" from
-- the database instead of a hardcoded map in the API server.

ALTER TABLE "apps_registry"
  ADD COLUMN IF NOT EXISTS "owner_team" text;
--> statement-breakpoint

-- Backfill known apps with their current owning teams (matches the previous
-- APP_OWNER_TEAMS constant in artifacts/api-server/src/routes/deployments.ts).
-- Uses INSERT ... ON CONFLICT so freshly-provisioned databases that don't yet
-- have these slugs still get them registered with the correct team.
INSERT INTO "apps_registry" (slug, name, status, owner_team) VALUES
  ('api-server',          'API Server',                 'active', 'Platform'),
  ('command',             'Unified Command',            'active', 'Platform'),
  ('szl-holdings',        'SZL Holdings Dashboard',     'active', 'Platform'),
  ('szl-holdings-mobile', 'SZL Holdings Mobile',        'active', 'Platform'),
  ('pulse',               'Pulse',                      'active', 'Pulse'),
  ('aegis',               'Aegis',                      'active', 'Aegis'),
  ('vessels',             'Vessels',                    'active', 'Vessels'),
  ('terra',               'Terra',                      'active', 'Terra'),
  ('sentra',              'Sentra',                     'active', 'Sentra'),
  ('counsel',             'Counsel',                    'active', 'PRISM Counsel'),
  ('prism-counsel',       'PRISM Counsel',              'active', 'PRISM Counsel'),
  ('lyte',                'Lyte',                       'active', 'Lyte'),
  ('lyte-command-center', 'Lyte Command Center',        'active', 'Lyte'),
  ('carlota-jo',          'Carlota Jo Consulting',      'active', 'Advisory'),
  ('szl-demo-video',      'SZL Demo Video',             'active', 'Marketing'),
  ('mockup-sandbox',      'NEXUS Mockup Sandbox',       'active', 'Design')
ON CONFLICT (slug) DO UPDATE SET
  owner_team = COALESCE("apps_registry"."owner_team", EXCLUDED.owner_team);
