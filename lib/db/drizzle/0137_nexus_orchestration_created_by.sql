-- Task #3569: Add created_by to nexus_orchestration_plans for ownership enforcement.
-- NULL for rows created before this migration; those are treated as admin-only.
ALTER TABLE nexus_orchestration_plans
  ADD COLUMN IF NOT EXISTS created_by text;

CREATE INDEX IF NOT EXISTS nexus_orchestration_plans_created_by_idx
  ON nexus_orchestration_plans (created_by);
