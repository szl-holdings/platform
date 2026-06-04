-- MCP Gateway persistence (task #2377). Persists containment-rule
-- enforcement state and gateway-decision history that previously lived
-- only in process memory. Mode changes survive restarts; pending Guardian
-- approvals flow through the existing approval_requests queue and blocked
-- decisions create real agent_mesh_exposures rows linked by id.

ALTER TABLE agent_mesh_containment_rules
  ADD COLUMN IF NOT EXISTS enforcement_mode text NOT NULL DEFAULT 'log-only';

ALTER TABLE agent_mesh_containment_rules
  ADD COLUMN IF NOT EXISTS pending_mode_change jsonb;

CREATE TABLE IF NOT EXISTS agent_mesh_gateway_events (
  id text PRIMARY KEY,
  org_id integer,
  rule_id text NOT NULL,
  agent_class text NOT NULL,
  mcp_server_id text NOT NULL,
  tool text NOT NULL,
  egress_domain text,
  decision text NOT NULL,
  reason text NOT NULL DEFAULT '',
  enforcement_mode text NOT NULL,
  linked_exposure_id text,
  occurred_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_mesh_gateway_events_occurred_at_idx
  ON agent_mesh_gateway_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS agent_mesh_gateway_events_rule_idx
  ON agent_mesh_gateway_events (rule_id);
CREATE INDEX IF NOT EXISTS agent_mesh_gateway_events_decision_idx
  ON agent_mesh_gateway_events (decision);
