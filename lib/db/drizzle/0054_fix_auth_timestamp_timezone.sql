-- Add auth columns to users table (idempotent -- columns may already exist from prior manual SQL)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_token" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_token_expires_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp with time zone;
--> statement-breakpoint
-- Set correct type on timestamp columns (fix drift from manual SQL which used TIMESTAMPTZ)
ALTER TABLE "users" ALTER COLUMN "email_verification_token_expires_at" SET DATA TYPE timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email_verified_at" SET DATA TYPE timestamp with time zone;
--> statement-breakpoint
-- Add unique constraint on email_verification_token if not already present (check by column, not name)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'users'::regclass
      AND c.contype = 'u'
      AND a.attname = 'email_verification_token'
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_email_verification_token_unique" UNIQUE ("email_verification_token");
  END IF;
END $$;
