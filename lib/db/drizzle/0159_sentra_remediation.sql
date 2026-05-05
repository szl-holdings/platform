-- Sentra Governed Vulnerability Remediation Pipeline
-- Tracks vulnerability findings through the canonical nine-step decision loop:
-- ingested → contextualized → recommended → simulated → policy-gated → approved
-- → executing → verifying → resolved (or failed). Every transition is recorded
-- in the timeline jsonb column with actor + timestamp; high-trust transitions
-- additionally bind a proof_chain entry id (proof_chain_ids[]).

CREATE TABLE IF NOT EXISTS "sentra_remediation_cases" (
  "id" text PRIMARY KEY,
  "cve_id" text,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "severity" text NOT NULL,
  "source" text NOT NULL DEFAULT 'manual',
  "source_ref" text,
  "affected_asset" text,
  "affected_assets" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "stage" text NOT NULL DEFAULT 'ingested',
  "outcome" text NOT NULL DEFAULT 'pending',
  "context" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "recommendation" jsonb,
  "simulation" jsonb,
  "policy" jsonb,
  "execution" jsonb,
  "verification" jsonb,
  "proof_chain_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "timeline" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "assigned_to" text,
  "detected_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "resolved_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "sentra_remediation_stage_idx" ON "sentra_remediation_cases" ("stage");
CREATE INDEX IF NOT EXISTS "sentra_remediation_severity_idx" ON "sentra_remediation_cases" ("severity");
CREATE INDEX IF NOT EXISTS "sentra_remediation_detected_at_idx" ON "sentra_remediation_cases" ("detected_at");
CREATE INDEX IF NOT EXISTS "sentra_remediation_cve_idx" ON "sentra_remediation_cases" ("cve_id");
