-- Task #2433: Persist a team paging audit history so on-call can spot noisy
-- alerts in the deployments operator console (TeamDetailModal "Recent pages"
-- section). The notifications table is per-recipient and gets pruned —
-- it cannot answer "show the last 10 pages for team Platform" from a
-- third-party operator's seat.
--
-- Self-paged no-ops (actor IS the on-call) short-circuit before insert in
-- the route handler, so they never appear in this table.
--
-- actor_id and recipient_id are nullable so ON DELETE SET NULL preserves
-- the audit row even if the referenced user is deleted later.

CREATE TABLE IF NOT EXISTS "team_pages" (
  "id" SERIAL PRIMARY KEY,
  "team" TEXT NOT NULL,
  "actor_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "recipient_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "urgency" TEXT NOT NULL DEFAULT 'warning',
  "message" TEXT,
  "in_app_delivered" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "team_pages_team_created_at_idx"
  ON "team_pages" ("team", "created_at");

CREATE INDEX IF NOT EXISTS "team_pages_created_at_idx"
  ON "team_pages" ("created_at");
