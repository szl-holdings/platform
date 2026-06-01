-- Task #2484: Add operator rollback fields to agent_mesh_drift_snapshots so
-- the Sentra Mesh Drift "Roll Back" button can record who reverted a drift
-- change and when. Both columns are nullable (no default) since pre-existing
-- snapshots have not been rolled back.

ALTER TABLE "agent_mesh_drift_snapshots"
  ADD COLUMN IF NOT EXISTS "rolled_back_by" TEXT;

ALTER TABLE "agent_mesh_drift_snapshots"
  ADD COLUMN IF NOT EXISTS "rolled_back_at" TIMESTAMPTZ;
