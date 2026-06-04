ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "password_reset_token" text UNIQUE,
  ADD COLUMN IF NOT EXISTS "password_reset_token_expires_at" timestamptz;
