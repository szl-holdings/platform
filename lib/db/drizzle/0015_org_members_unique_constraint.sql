-- Add unique constraint on (org_id, user_id) in org_members
-- This enables onConflictDoNothing() in seed scripts to be idempotent.
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_org_user_uq" UNIQUE ("org_id", "user_id");
