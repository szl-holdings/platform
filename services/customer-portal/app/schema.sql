-- schema.sql — SZL customer-portal API key store (SQLite, WAL in prod)
-- Author: Yachay (CTO authority) 2026-06-01. Doctrine v12 / v11 LOCKED preserved. No mock.
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE accounts (
    account_id   TEXT PRIMARY KEY,
    email        TEXT NOT NULL UNIQUE,
    oauth_sub    TEXT NOT NULL UNIQUE,
    tier         TEXT NOT NULL DEFAULT 'demo'
                 CHECK (tier IN ('demo','builder','professional','enterprise','dod_ic')),
    greene_network INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended'))
);

CREATE TABLE api_keys (
    key_id       TEXT PRIMARY KEY,
    account_id   TEXT NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    key_hash     TEXT NOT NULL UNIQUE,
    fingerprint  TEXT NOT NULL,
    cosign_sig   TEXT NOT NULL,
    env          TEXT NOT NULL CHECK (env IN ('live','test')),
    scope        TEXT NOT NULL DEFAULT 'read' CHECK (scope IN ('read','write','admin')),
    flagships    TEXT NOT NULL DEFAULT 'a11oy,amaru,sentra,killinchu,rosie',
    status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','expired')),
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at   TEXT,
    rotated_from TEXT REFERENCES api_keys(key_id),
    last_used_at TEXT
);
CREATE INDEX idx_keys_account ON api_keys(account_id);
CREATE INDEX idx_keys_hash    ON api_keys(key_hash);

CREATE TABLE key_flagship_scope (
    key_id   TEXT NOT NULL REFERENCES api_keys(key_id) ON DELETE CASCADE,
    flagship TEXT NOT NULL CHECK (flagship IN ('a11oy','amaru','sentra','killinchu','rosie')),
    scope    TEXT NOT NULL CHECK (scope IN ('read','write','admin')),
    PRIMARY KEY (key_id, flagship)
);

CREATE TABLE usage_counters (
    account_id   TEXT NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    period       TEXT NOT NULL,
    calls        INTEGER NOT NULL DEFAULT 0,
    over_quota   INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (account_id, period)
);

CREATE TABLE call_receipts (
    receipt_id     TEXT PRIMARY KEY,
    account_id     TEXT NOT NULL REFERENCES accounts(account_id),
    key_id         TEXT REFERENCES api_keys(key_id),   -- NULL for portal-action receipts
    flagship       TEXT NOT NULL,
    operation_id   TEXT NOT NULL,
    chain_verified INTEGER NOT NULL,
    continuum_hash TEXT NOT NULL,
    tripwire       TEXT,
    over_quota     INTEGER NOT NULL DEFAULT 0,
    ts             TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_receipts_account_ts ON call_receipts(account_id, ts);

CREATE TABLE audit_log (
    audit_id   TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    action     TEXT NOT NULL,
    detail     TEXT,
    actor_ip   TEXT,
    ts         TEXT NOT NULL DEFAULT (datetime('now'))
);
