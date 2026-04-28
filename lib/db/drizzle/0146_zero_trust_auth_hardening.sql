-- Zero-trust auth hardening: magic links, device fingerprinting, login attempts

CREATE TABLE IF NOT EXISTS magic_links (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  email        TEXT    NOT NULL,
  token        TEXT    NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ,
  ip_address   TEXT,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS magic_links_token_idx      ON magic_links (token);
CREATE INDEX IF NOT EXISTS magic_links_email_idx      ON magic_links (email);
CREATE INDEX IF NOT EXISTS magic_links_expires_at_idx ON magic_links (expires_at);

CREATE TABLE IF NOT EXISTS user_devices (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fingerprint_hash TEXT    NOT NULL,
  display_name     TEXT,
  user_agent       TEXT,
  last_ip_hash     TEXT,
  is_trusted       BOOLEAN NOT NULL DEFAULT false,
  first_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at       TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS user_devices_user_fingerprint_unique ON user_devices (user_id, fingerprint_hash);
CREATE INDEX IF NOT EXISTS user_devices_user_id_idx ON user_devices (user_id);

CREATE TABLE IF NOT EXISTS login_attempts (
  id                      SERIAL PRIMARY KEY,
  email                   TEXT NOT NULL,
  ip_address              TEXT,
  success                 BOOLEAN NOT NULL DEFAULT false,
  failure_reason          TEXT,
  device_fingerprint_hash TEXT,
  risk_score              INTEGER,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS login_attempts_email_idx      ON login_attempts (email);
CREATE INDEX IF NOT EXISTS login_attempts_ip_idx         ON login_attempts (ip_address);
CREATE INDEX IF NOT EXISTS login_attempts_created_at_idx ON login_attempts (created_at DESC);
