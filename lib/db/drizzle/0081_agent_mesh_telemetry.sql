-- Agent Mesh telemetry tables. Persists the runtimes, MCP servers, secrets,
-- agent->tool edges, exposures, containment rules, drift snapshots and the
-- computed Mesh Resilience Index produced by the telemetry collector that
-- scans claude_desktop_config.json, mcp.json, settings.json and CLAUDE.md.

CREATE TABLE IF NOT EXISTS agent_mesh_runtimes (
  id text PRIMARY KEY,
  org_id integer,
  name text NOT NULL,
  version text NOT NULL DEFAULT 'unknown',
  source_registry text NOT NULL DEFAULT 'unknown',
  trust_state text NOT NULL DEFAULT 'unverified',
  config_files jsonb NOT NULL DEFAULT '[]'::jsonb,
  active_agent_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_seen timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_mesh_mcp_servers (
  id text PRIMARY KEY,
  org_id integer,
  name text NOT NULL,
  package_ref text NOT NULL DEFAULT '',
  version text NOT NULL DEFAULT 'unknown',
  pinned boolean NOT NULL DEFAULT false,
  source_registry text NOT NULL DEFAULT 'unknown',
  trust_state text NOT NULL DEFAULT 'unverified',
  runtime_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  allowed_egress_domains jsonb NOT NULL DEFAULT '[]'::jsonb,
  detected_egress_domains jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_seen timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_mesh_secrets (
  id text PRIMARY KEY,
  org_id integer,
  label text NOT NULL,
  format text NOT NULL DEFAULT 'env-var',
  found_in_file text NOT NULL,
  entropy double precision NOT NULL DEFAULT 0,
  reachable_by_agent_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  reachable_by_mcp_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_detected_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_mesh_edges (
  id text PRIMARY KEY,
  org_id integer,
  agent_id text NOT NULL,
  mcp_server_id text NOT NULL,
  tools jsonb NOT NULL DEFAULT '[]'::jsonb,
  data_read_paths jsonb NOT NULL DEFAULT '[]'::jsonb,
  detected_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_mesh_edges_agent_idx ON agent_mesh_edges (agent_id);
CREATE INDEX IF NOT EXISTS agent_mesh_edges_mcp_idx ON agent_mesh_edges (mcp_server_id);

CREATE TABLE IF NOT EXISTS agent_mesh_exposures (
  id text PRIMARY KEY,
  org_id integer,
  title text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  affected_agent_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  affected_secret_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  affected_mcp_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  explanation text NOT NULL DEFAULT '',
  owasp_category text NOT NULL DEFAULT '',
  owasp_ref text NOT NULL DEFAULT '',
  cve_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  fix_type text NOT NULL DEFAULT 'scope-token',
  fix_label text NOT NULL DEFAULT '',
  proof_hash text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  detected_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_mesh_containment_rules (
  id text PRIMARY KEY,
  org_id integer,
  name text NOT NULL,
  agent_class text NOT NULL,
  allowed_mcp_servers jsonb NOT NULL DEFAULT '[]'::jsonb,
  allowed_tools jsonb NOT NULL DEFAULT '[]'::jsonb,
  allowed_read_paths jsonb NOT NULL DEFAULT '[]'::jsonb,
  allowed_egress_domains jsonb NOT NULL DEFAULT '[]'::jsonb,
  tier text NOT NULL DEFAULT 'standard',
  violation_count integer NOT NULL DEFAULT 0,
  last_evaluated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_mesh_drift_snapshots (
  id text PRIMARY KEY,
  org_id integer,
  config_file text NOT NULL,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  changed_by text NOT NULL DEFAULT 'unknown',
  policy_approved boolean NOT NULL DEFAULT false,
  approved_by text,
  diff jsonb NOT NULL DEFAULT '{"removed":[],"added":[]}'::jsonb,
  linked_exposure_ids jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS agent_mesh_resilience_index (
  id serial PRIMARY KEY,
  org_id integer,
  overall integer NOT NULL,
  grade text NOT NULL,
  secret_hygiene integer NOT NULL,
  permission_surface integer NOT NULL,
  supply_chain integer NOT NULL,
  egress_containment integer NOT NULL,
  schedule_hygiene integer NOT NULL,
  instruction_tampering_risk integer NOT NULL,
  cross_agent_blast_radius integer NOT NULL,
  open_exposures integer NOT NULL DEFAULT 0,
  pending_approvals integer NOT NULL DEFAULT 0,
  top_exposure text,
  computed_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_mesh_resilience_index_computed_at_idx
  ON agent_mesh_resilience_index (computed_at DESC);
