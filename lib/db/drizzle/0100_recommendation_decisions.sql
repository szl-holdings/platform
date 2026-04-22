CREATE TABLE IF NOT EXISTS "mesh_recommendation_decisions" (
  "decision_id" UUID PRIMARY KEY,
  "recommendation_id" UUID NOT NULL,
  "actor_id" TEXT NOT NULL,
  "actor_role" TEXT,
  "org_id" TEXT,
  "decision" TEXT NOT NULL,
  "justification" TEXT,
  "policy_outcome" TEXT NOT NULL,
  "previous_status" TEXT NOT NULL,
  "new_status" TEXT NOT NULL,
  "source_surface" TEXT,
  "decided_at" TIMESTAMPTZ NOT NULL,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_recommendation_decisions_recommendation_id_idx" ON "mesh_recommendation_decisions" ("recommendation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_recommendation_decisions_actor_id_idx" ON "mesh_recommendation_decisions" ("actor_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_recommendation_decisions_org_id_idx" ON "mesh_recommendation_decisions" ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_recommendation_decisions_decided_at_idx" ON "mesh_recommendation_decisions" ("decided_at");
