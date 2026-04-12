CREATE TABLE IF NOT EXISTS "pc_citation_audit_reports" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "matter_id" integer REFERENCES "pc_matters"("id") ON DELETE set null,
  "review_item_id" integer,
  "audit_id" text NOT NULL UNIQUE,
  "document_id" text NOT NULL,
  "document_title" text NOT NULL,
  "document_type" text,
  "total_citations" integer NOT NULL DEFAULT 0,
  "verified_count" integer NOT NULL DEFAULT 0,
  "unverified_count" integer NOT NULL DEFAULT 0,
  "suspicious_count" integer NOT NULL DEFAULT 0,
  "average_confidence" real NOT NULL DEFAULT 0,
  "overall_status" text NOT NULL,
  "citations" jsonb NOT NULL DEFAULT '[]',
  "blocking_citations" jsonb NOT NULL DEFAULT '[]',
  "rag_verification_notes" jsonb NOT NULL DEFAULT '{}',
  "sealed_at" timestamp,
  "sealed_by" integer,
  "sealed_note" text,
  "proof_chain_id" integer,
  "verification_duration_ms" integer,
  "verified_at" timestamp NOT NULL DEFAULT now(),
  "created_by" integer,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "pc_car_org_idx" ON "pc_citation_audit_reports" ("org_id");
CREATE INDEX IF NOT EXISTS "pc_car_matter_idx" ON "pc_citation_audit_reports" ("matter_id");
CREATE INDEX IF NOT EXISTS "pc_car_review_item_idx" ON "pc_citation_audit_reports" ("review_item_id");
CREATE INDEX IF NOT EXISTS "pc_car_audit_id_idx" ON "pc_citation_audit_reports" ("audit_id");
CREATE INDEX IF NOT EXISTS "pc_car_status_idx" ON "pc_citation_audit_reports" ("overall_status");
