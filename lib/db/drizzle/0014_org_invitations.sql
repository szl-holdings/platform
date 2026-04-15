-- Migration: 0010_org_invitations
-- Adds the org_invitations table for the invited-user onboarding flow.
-- Tracks pending, accepted, expired, and revoked invitations per organization.

CREATE TABLE IF NOT EXISTS "org_invitations" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "invited_by_user_id" integer NOT NULL,
  "accepted_by_user_id" integer,
  "email" text NOT NULL,
  "role" text NOT NULL DEFAULT 'member',
  "token" text NOT NULL UNIQUE,
  "status" text NOT NULL DEFAULT 'pending',
  "expires_at" timestamp NOT NULL,
  "accepted_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "org_invitations_role_check" CHECK ("role" IN ('admin', 'member', 'viewer')),
  CONSTRAINT "org_invitations_status_check" CHECK ("status" IN ('pending', 'accepted', 'expired', 'revoked')),
  CONSTRAINT "org_invitations_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "org_invitations_invited_by_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "org_invitations_accepted_by_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "org_invitations_org_id_idx" ON "org_invitations" ("org_id");
CREATE INDEX IF NOT EXISTS "org_invitations_email_idx" ON "org_invitations" ("email");
CREATE INDEX IF NOT EXISTS "org_invitations_status_idx" ON "org_invitations" ("status");
CREATE UNIQUE INDEX IF NOT EXISTS "org_invitations_token_idx" ON "org_invitations" ("token");
