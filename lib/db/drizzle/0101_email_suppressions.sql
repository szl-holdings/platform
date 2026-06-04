CREATE TABLE IF NOT EXISTS "email_suppressions" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "provider_event_id" TEXT,
  "provider" TEXT,
  "detail" TEXT,
  "suppressed_at" TIMESTAMP NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "email_suppressions_email_unique" ON "email_suppressions" ("email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_suppressions_email_idx" ON "email_suppressions" ("email");
