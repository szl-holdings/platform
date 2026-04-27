-- Session Lifecycle Hardening (Task #1914)
-- Adds session_version to users + sessions to enable instant invalidation on
-- role/org-membership change, and adds rotating refresh-token columns to
-- support single-use refresh tokens with replay detection.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "session_version" INTEGER NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "session_version" INTEGER NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "refresh_token" TEXT;
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "refresh_token_expires_at" TIMESTAMP;
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "refresh_token_used_at" TIMESTAMP;
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "replaced_by_session_id" INTEGER;
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "revoked_at" TIMESTAMP;
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "revoked_reason" TEXT;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_refresh_token_unique" ON "sessions" ("refresh_token");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" ("user_id");
