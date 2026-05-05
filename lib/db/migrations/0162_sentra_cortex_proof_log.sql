CREATE TABLE IF NOT EXISTS "sentra_cortex_proof_log" (
  "id" SERIAL PRIMARY KEY,
  "proof_id" TEXT NOT NULL UNIQUE,
  "path_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "new_status" TEXT NOT NULL,
  "operator" TEXT NOT NULL DEFAULT 'sentra-operator',
  "constitutional_cite" TEXT,
  "alloy_workflow_id" INTEGER,
  "alloy_approval_id" INTEGER,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_sentra_cortex_proof_log_path" ON "sentra_cortex_proof_log" ("path_id");
CREATE INDEX IF NOT EXISTS "idx_sentra_cortex_proof_log_created" ON "sentra_cortex_proof_log" ("created_at" DESC);
