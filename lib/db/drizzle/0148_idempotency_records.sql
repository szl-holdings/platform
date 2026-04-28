CREATE TABLE IF NOT EXISTS idempotency_records (
  id SERIAL PRIMARY KEY,
  store_key TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT 'anon',
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  body_fingerprint TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  body JSONB NOT NULL DEFAULT '{}',
  headers JSONB NOT NULL DEFAULT '{}',
  created_at BIGINT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_records_store_key ON idempotency_records(store_key);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_idempotency_records_expires_at ON idempotency_records(expires_at);
