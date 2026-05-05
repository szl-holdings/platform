CREATE TABLE IF NOT EXISTS "cps_runs" (
  "id" text PRIMARY KEY NOT NULL,
  "payload_id" text NOT NULL,
  "payload_version" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "maturity_mode" text NOT NULL,
  "detect" jsonb,
  "decide" jsonb,
  "actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "recover" jsonb,
  "proof_bundle" jsonb,
  "governance_checks" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "triggered_by" jsonb NOT NULL,
  "linked_case_id" text,
  "error" text,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "cps_approvals" (
  "id" text PRIMARY KEY NOT NULL,
  "run_id" text NOT NULL REFERENCES "cps_runs"("id") ON DELETE CASCADE,
  "tier" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "approver" text,
  "approver_role" text,
  "approver_id" text,
  "reason" text,
  "dual_approvals" jsonb DEFAULT '[]'::jsonb,
  "required_dual_count" integer,
  "deadline_at" timestamp with time zone NOT NULL,
  "requested_at" timestamp with time zone DEFAULT now() NOT NULL,
  "responded_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "cps_proof_bundles" (
  "id" text PRIMARY KEY NOT NULL,
  "run_id" text NOT NULL REFERENCES "cps_runs"("id") ON DELETE CASCADE,
  "payload_id" text NOT NULL,
  "payload_version" text NOT NULL,
  "signature" text NOT NULL,
  "sections" jsonb NOT NULL,
  "governance_checks" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "residual_risk" text,
  "classification" text DEFAULT 'internal-confidential' NOT NULL,
  "generated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "cps_runs_payload_id_idx" ON "cps_runs" ("payload_id");
CREATE INDEX IF NOT EXISTS "cps_runs_status_idx" ON "cps_runs" ("status");
CREATE INDEX IF NOT EXISTS "cps_runs_started_at_idx" ON "cps_runs" ("started_at");
CREATE INDEX IF NOT EXISTS "cps_approvals_run_id_idx" ON "cps_approvals" ("run_id");
CREATE INDEX IF NOT EXISTS "cps_approvals_status_idx" ON "cps_approvals" ("status");
CREATE INDEX IF NOT EXISTS "cps_proof_bundles_run_id_idx" ON "cps_proof_bundles" ("run_id");
CREATE INDEX IF NOT EXISTS "cps_proof_bundles_payload_id_idx" ON "cps_proof_bundles" ("payload_id");
