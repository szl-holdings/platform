-- Proof Ledger — durable persistence for the A11oy fabric proof stream
-- (task #4879). Mirrors lib/db/src/schema/proof_ledger.ts. Every appendProof
-- call in artifacts/api-server/src/services/orchestration-store.ts is
-- written here so governance audit trail survives restarts; the in-memory
-- ring is rehydrated from the most recent rows on boot.

CREATE TABLE IF NOT EXISTS "proof_ledger" (
    "id" text PRIMARY KEY NOT NULL,
    "product" text NOT NULL,
    "kind" text NOT NULL,
    "summary" text NOT NULL,
    "deep_link" text,
    "related_product" text,
    "model_used" text,
    "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "ts" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "proof_ledger_product_idx" ON "proof_ledger" ("product");
CREATE INDEX IF NOT EXISTS "proof_ledger_ts_idx" ON "proof_ledger" ("ts");
