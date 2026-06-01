-- Migration: Add email_hash column to platform_contact_requests
-- Enables deterministic GDPR erasure of contact submissions without decrypting all rows.
-- The hash is computed as HMAC-SHA256(email.toLowerCase(), FIELD_ENCRYPTION_KEY),
-- stored at submission time, and used in POST /gdpr/erasure to purge matching rows.

ALTER TABLE platform_contact_requests
  ADD COLUMN IF NOT EXISTS email_hash text;

CREATE INDEX IF NOT EXISTS platform_contact_requests_email_hash_idx
  ON platform_contact_requests (email_hash)
  WHERE email_hash IS NOT NULL;

-- Also create the sliding-window rate limiter log table if not already present
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id       bigserial PRIMARY KEY,
  key      text        NOT NULL,
  endpoint text        NOT NULL,
  hit_at   timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rate_limit_log_lookup_idx
  ON rate_limit_log (key, endpoint, hit_at);
