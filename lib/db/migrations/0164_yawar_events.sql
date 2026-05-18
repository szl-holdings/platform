-- yawar-bus: durable event log for the yawar-bus HTTP surface (task #5173).
-- Each row is a SHA-256 chain link for its topic. `receipt_id` is the
-- canonical primary key (matches the chain-link identity exposed by
-- GET /api/yawar/receipt/:id and by the ReceiptChain library); `seq` is
-- a monotonic ordering column used for sub-linear replay/subscribe.
CREATE TABLE IF NOT EXISTS "yawar_events" (
  "receipt_id" text PRIMARY KEY,
  "seq" bigserial NOT NULL UNIQUE,
  "topic" text NOT NULL,
  "ts" timestamp with time zone NOT NULL DEFAULT now(),
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "prev_hash" text NOT NULL,
  "hash" text NOT NULL,
  "signer" text
);

CREATE INDEX IF NOT EXISTS "yawar_events_topic_seq_idx"
  ON "yawar_events" ("topic", "seq");
CREATE INDEX IF NOT EXISTS "yawar_events_topic_ts_idx"
  ON "yawar_events" ("topic", "ts");
CREATE INDEX IF NOT EXISTS "yawar_events_topic_hash_idx"
  ON "yawar_events" ("topic", "hash");
