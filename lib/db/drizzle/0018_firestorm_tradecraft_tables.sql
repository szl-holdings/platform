CREATE TABLE IF NOT EXISTS "firestorm_tradecraft_decisions" (
  "id" serial PRIMARY KEY NOT NULL,
  "object_id" text NOT NULL UNIQUE,
  "tenant_id" text NOT NULL DEFAULT 'default',
  "case_id" text,
  "incident_id" text,
  "signal_id" text,
  "decision_type" text NOT NULL,
  "policy_class" text NOT NULL DEFAULT '',
  "schema_version" text NOT NULL DEFAULT '2.0.0',
  "summary" text NOT NULL,
  "issue_statement" text NOT NULL DEFAULT '',
  "evidence_refs" jsonb NOT NULL DEFAULT '[]',
  "evidence_quality" text NOT NULL DEFAULT 'low',
  "assumptions" jsonb NOT NULL DEFAULT '[]',
  "alternatives" jsonb NOT NULL DEFAULT '[]',
  "confidence" numeric(4,3) NOT NULL DEFAULT 0,
  "confidence_label" text NOT NULL DEFAULT 'low',
  "confidence_statement" text,
  "gaps_and_unknowns" jsonb NOT NULL DEFAULT '[]',
  "impact_level" text NOT NULL DEFAULT 'medium',
  "urgency" text NOT NULL DEFAULT 'standard',
  "recommended_action" text NOT NULL,
  "owner_suggestion" text,
  "approval_required" boolean NOT NULL DEFAULT false,
  "approval_reason" text,
  "human_review_required" boolean NOT NULL DEFAULT true,
  "human_review_reason" text,
  "model_route" text NOT NULL DEFAULT 'unknown',
  "raw_output" text,
  "decision_payload" jsonb DEFAULT '{}',
  "status" text NOT NULL DEFAULT 'active',
  "approved_by" text,
  "approved_at" timestamptz,
  "rejected_by" text,
  "rejected_at" timestamptz,
  "rejection_reason" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "tenant_id" text NOT NULL DEFAULT 'default';
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "signal_id" text;
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "policy_class" text NOT NULL DEFAULT '';
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "schema_version" text NOT NULL DEFAULT '2.0.0';
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "issue_statement" text NOT NULL DEFAULT '';
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "confidence_statement" text;
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "owner_suggestion" text;
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "approval_reason" text;
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "human_review_required" boolean NOT NULL DEFAULT true;
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "human_review_reason" text;
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "model_route" text NOT NULL DEFAULT 'unknown';
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "raw_output" text;
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "decision_payload" jsonb DEFAULT '{}';
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'active';
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "approved_by" text;
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "approved_at" timestamptz;
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "rejected_by" text;
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "rejected_at" timestamptz;
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "rejection_reason" text;
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "evidence_refs" jsonb NOT NULL DEFAULT '[]';
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "evidence_quality" text NOT NULL DEFAULT 'low';
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "assumptions" jsonb NOT NULL DEFAULT '[]';
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "alternatives" jsonb NOT NULL DEFAULT '[]';
ALTER TABLE "firestorm_tradecraft_decisions" ADD COLUMN IF NOT EXISTS "gaps_and_unknowns" jsonb NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS "ftd_case_id_idx" ON "firestorm_tradecraft_decisions"("case_id");
CREATE INDEX IF NOT EXISTS "ftd_incident_id_idx" ON "firestorm_tradecraft_decisions"("incident_id");
CREATE INDEX IF NOT EXISTS "ftd_tenant_id_idx" ON "firestorm_tradecraft_decisions"("tenant_id");
CREATE INDEX IF NOT EXISTS "ftd_decision_type_idx" ON "firestorm_tradecraft_decisions"("decision_type");
CREATE INDEX IF NOT EXISTS "ftd_created_at_idx" ON "firestorm_tradecraft_decisions"("created_at" DESC);

CREATE TABLE IF NOT EXISTS "firestorm_case_memory" (
  "id" serial PRIMARY KEY NOT NULL,
  "case_id" text NOT NULL UNIQUE,
  "incident_id" text,
  "phase" text NOT NULL DEFAULT 'detection',
  "phase_history" jsonb NOT NULL DEFAULT '[]',
  "decisions" jsonb NOT NULL DEFAULT '[]',
  "evidence_snapshots" jsonb NOT NULL DEFAULT '[]',
  "analyst_notes" jsonb NOT NULL DEFAULT '[]',
  "change_log" jsonb NOT NULL DEFAULT '[]',
  "summary" jsonb NOT NULL DEFAULT '{}',
  "opened_at" timestamptz NOT NULL DEFAULT now(),
  "last_updated_at" timestamptz NOT NULL DEFAULT now(),
  "closed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "firestorm_case_memory" ADD COLUMN IF NOT EXISTS "analyst_notes" jsonb NOT NULL DEFAULT '[]';
ALTER TABLE "firestorm_case_memory" ADD COLUMN IF NOT EXISTS "evidence_snapshots" jsonb NOT NULL DEFAULT '[]';
ALTER TABLE "firestorm_case_memory" ADD COLUMN IF NOT EXISTS "change_log" jsonb NOT NULL DEFAULT '[]';
ALTER TABLE "firestorm_case_memory" ADD COLUMN IF NOT EXISTS "closed_at" timestamptz;
ALTER TABLE "firestorm_case_memory" ADD COLUMN IF NOT EXISTS "opened_at" timestamptz NOT NULL DEFAULT now();
ALTER TABLE "firestorm_case_memory" ADD COLUMN IF NOT EXISTS "last_updated_at" timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS "fcm_incident_id_idx" ON "firestorm_case_memory"("incident_id");
CREATE INDEX IF NOT EXISTS "fcm_phase_idx" ON "firestorm_case_memory"("phase");

CREATE TABLE IF NOT EXISTS "firestorm_analyst_notebook" (
  "id" serial PRIMARY KEY NOT NULL,
  "note_id" text NOT NULL UNIQUE,
  "case_id" text,
  "incident_id" text,
  "decision_object_id" text,
  "content" text NOT NULL,
  "author" text NOT NULL DEFAULT 'system',
  "note_type" text NOT NULL DEFAULT 'general',
  "tags" jsonb NOT NULL DEFAULT '[]',
  "note_references" jsonb NOT NULL DEFAULT '[]',
  "is_key" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "firestorm_analyst_notebook" ADD COLUMN IF NOT EXISTS "decision_object_id" text;
ALTER TABLE "firestorm_analyst_notebook" ADD COLUMN IF NOT EXISTS "is_key" boolean NOT NULL DEFAULT false;
ALTER TABLE "firestorm_analyst_notebook" ADD COLUMN IF NOT EXISTS "tags" jsonb NOT NULL DEFAULT '[]';
ALTER TABLE "firestorm_analyst_notebook" ADD COLUMN IF NOT EXISTS "note_references" jsonb NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS "fan_case_id_idx" ON "firestorm_analyst_notebook"("case_id");
CREATE INDEX IF NOT EXISTS "fan_incident_id_idx" ON "firestorm_analyst_notebook"("incident_id");
CREATE INDEX IF NOT EXISTS "fan_is_key_idx" ON "firestorm_analyst_notebook"("is_key");

CREATE TABLE IF NOT EXISTS "firestorm_tradecraft_validation_audit" (
  "id" serial PRIMARY KEY NOT NULL,
  "audit_id" text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  "decision_type" text NOT NULL,
  "tenant_id" text NOT NULL DEFAULT 'default',
  "case_id" text,
  "incident_id" text,
  "validation_errors" jsonb NOT NULL DEFAULT '[]',
  "raw_output" text,
  "raw_payload" jsonb NOT NULL DEFAULT '{}',
  "model_route" text NOT NULL DEFAULT 'unknown',
  "error_class" text NOT NULL DEFAULT 'schema_validation',
  "resolved" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ftva_decision_type_idx" ON "firestorm_tradecraft_validation_audit"("decision_type");
CREATE INDEX IF NOT EXISTS "ftva_case_id_idx" ON "firestorm_tradecraft_validation_audit"("case_id");
CREATE INDEX IF NOT EXISTS "ftva_created_at_idx" ON "firestorm_tradecraft_validation_audit"("created_at" DESC);
