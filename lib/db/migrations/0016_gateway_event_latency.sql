-- Task #2471: Record per-call latency on gateway decisions so the
-- Containment Rules "Avg latency" tile can show real numbers instead of
-- a placeholder. Nullable so legacy rows (recorded before this column
-- existed) are preserved and the average ignores them.
--
-- The agent_mesh_gateway_events table itself was previously created via
-- drizzle-kit push and never had a migration; create it here defensively
-- so this migration can populate the column on a fresh database too.
CREATE TABLE IF NOT EXISTS "agent_mesh_gateway_events" (
  "id" TEXT PRIMARY KEY,
  "org_id" INTEGER,
  "rule_id" TEXT NOT NULL,
  "agent_class" TEXT NOT NULL,
  "mcp_server_id" TEXT NOT NULL,
  "tool" TEXT NOT NULL,
  "egress_domain" TEXT,
  "decision" TEXT NOT NULL,
  "reason" TEXT NOT NULL DEFAULT '',
  "enforcement_mode" TEXT NOT NULL,
  "linked_exposure_id" TEXT,
  "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "agent_mesh_gateway_events_occurred_at_idx"
  ON "agent_mesh_gateway_events" ("occurred_at");
CREATE INDEX IF NOT EXISTS "agent_mesh_gateway_events_rule_idx"
  ON "agent_mesh_gateway_events" ("rule_id");
CREATE INDEX IF NOT EXISTS "agent_mesh_gateway_events_decision_idx"
  ON "agent_mesh_gateway_events" ("decision");

ALTER TABLE "agent_mesh_gateway_events"
  ADD COLUMN IF NOT EXISTS "latency_ms" INTEGER;
