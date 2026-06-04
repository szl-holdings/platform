-- Migration: MFA Secrets — TOTP Multi-Factor Authentication (P1-007)
-- Adds mfa_secrets table to support TOTP-based MFA per user.
-- Related gap: P1-007 (gap-register.md) — MFA not implemented.

CREATE TABLE IF NOT EXISTS mfa_secrets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  enabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mfa_secrets_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_mfa_secrets_user_id ON mfa_secrets(user_id);

COMMENT ON TABLE mfa_secrets IS 'TOTP MFA secret storage. One row per user. enabled=false means setup started but not confirmed.';
COMMENT ON COLUMN mfa_secrets.secret IS 'Base32-encoded TOTP shared secret. Encrypted at rest via application-layer key when FIELD_ENCRYPTION_KEY is set.';
COMMENT ON COLUMN mfa_secrets.enabled IS 'True only after the user has confirmed a valid TOTP code via POST /auth/mfa/enable.';
