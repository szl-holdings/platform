-- Conduit (Amaru) data integration tables.
-- Idempotent — safe to re-run; matches the schema in lib/db/src/schema/conduit.ts.
-- Resolves the production log spam: "relation conduit_syncs does not exist" / "conduit_sync_runs does not exist".

DO $$ BEGIN
  CREATE TYPE conduit_connection_status AS ENUM ('active', 'error', 'untested');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE conduit_sync_run_mode AS ENUM ('manual', 'scheduled', 'on_change');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE conduit_sync_semantics AS ENUM ('insert', 'upsert', 'mirror');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE conduit_sync_status AS ENUM ('active', 'paused', 'draft', 'error');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE conduit_sync_run_status AS ENUM ('running', 'success', 'failed', 'partial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE conduit_mapping_transform AS ENUM (
    'uppercase','lowercase','concat','split','format_date','lookup','json_extract','constant','conditional'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS conduit_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'default',
  name text NOT NULL,
  destination text NOT NULL,
  status conduit_connection_status NOT NULL DEFAULT 'untested',
  credential_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  tested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS conduit_syncs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'default',
  name text NOT NULL,
  source_type text NOT NULL DEFAULT 'postgres',
  source_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  connection_id uuid NOT NULL REFERENCES conduit_connections(id) ON DELETE CASCADE,
  object_type text NOT NULL,
  run_mode conduit_sync_run_mode NOT NULL DEFAULT 'manual',
  schedule_expr text,
  semantics conduit_sync_semantics NOT NULL DEFAULT 'upsert',
  upsert_key text,
  status conduit_sync_status NOT NULL DEFAULT 'draft',
  last_run_id uuid,
  last_run_at timestamptz,
  last_run_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS conduit_sync_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_id uuid NOT NULL REFERENCES conduit_syncs(id) ON DELETE CASCADE,
  source_field text NOT NULL,
  destination_field text NOT NULL,
  transform conduit_mapping_transform,
  transform_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS conduit_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_id uuid NOT NULL REFERENCES conduit_syncs(id) ON DELETE CASCADE,
  status conduit_sync_run_status NOT NULL DEFAULT 'running',
  rows_read integer NOT NULL DEFAULT 0,
  rows_written integer NOT NULL DEFAULT 0,
  rows_failed integer NOT NULL DEFAULT 0,
  duration_ms integer,
  error_message text,
  triggered_by text NOT NULL DEFAULT 'manual',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS conduit_sync_run_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES conduit_sync_runs(id) ON DELETE CASCADE,
  row_index integer NOT NULL,
  source_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  retried boolean NOT NULL DEFAULT false,
  retried_at timestamptz
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS conduit_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source_type text NOT NULL,
  destination text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  icon text NOT NULL DEFAULT 'zap',
  mappings jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_builtin boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_conduit_connections_tenant ON conduit_connections(tenant_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_conduit_syncs_tenant ON conduit_syncs(tenant_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_conduit_syncs_connection ON conduit_syncs(connection_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_conduit_sync_runs_sync ON conduit_sync_runs(sync_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_conduit_sync_runs_started ON conduit_sync_runs(started_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_conduit_sync_run_rows_run ON conduit_sync_run_rows(run_id);
