-- Capital Readiness OS & Certification Readiness OS tables
-- Migration 0004

-- ─── CAPITAL READINESS ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "capital_artifacts" (
  "id" serial PRIMARY KEY NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "artifact_type" text DEFAULT 'other' NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "owned_by" text,
  "notes" text,
  "file_url" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "capital_artifacts_type_idx" ON "capital_artifacts" ("artifact_type");
CREATE INDEX IF NOT EXISTS "capital_artifacts_status_idx" ON "capital_artifacts" ("status");

CREATE TABLE IF NOT EXISTS "lender_packets" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "lender_type" text DEFAULT 'bank' NOT NULL,
  "target_amount" text,
  "use_of_funds" text,
  "status" text DEFAULT 'drafting' NOT NULL,
  "completion_pct" integer DEFAULT 0 NOT NULL,
  "target_submit_date" timestamp,
  "submitted_at" timestamp,
  "notes" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "lender_packet_deliverables" (
  "id" serial PRIMARY KEY NOT NULL,
  "packet_id" integer NOT NULL REFERENCES "lender_packets"("id") ON DELETE CASCADE,
  "deliverable_key" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "status" text DEFAULT 'not_started' NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "content" text,
  "artifact_id" integer REFERENCES "capital_artifacts"("id") ON DELETE SET NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "lender_deliverables_packet_idx" ON "lender_packet_deliverables" ("packet_id");

CREATE TABLE IF NOT EXISTS "investor_packets" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "investor_type" text DEFAULT 'angel' NOT NULL,
  "target_amount" text,
  "raise_structure" text,
  "status" text DEFAULT 'drafting' NOT NULL,
  "completion_pct" integer DEFAULT 0 NOT NULL,
  "target_close_date" timestamp,
  "notes" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "investor_packet_deliverables" (
  "id" serial PRIMARY KEY NOT NULL,
  "packet_id" integer NOT NULL REFERENCES "investor_packets"("id") ON DELETE CASCADE,
  "deliverable_key" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "status" text DEFAULT 'not_started' NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "content" text,
  "artifact_id" integer REFERENCES "capital_artifacts"("id") ON DELETE SET NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "investor_deliverables_packet_idx" ON "investor_packet_deliverables" ("packet_id");

CREATE TABLE IF NOT EXISTS "fundraising_milestones" (
  "id" serial PRIMARY KEY NOT NULL,
  "packet_type" text NOT NULL,
  "packet_id" integer,
  "title" text NOT NULL,
  "description" text,
  "milestone_type" text DEFAULT 'preparation' NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "target_date" timestamp,
  "completed_at" timestamp,
  "owner" text,
  "notes" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "financial_models" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "model_type" text DEFAULT '12_month_operating' NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "assumptions" text,
  "notes" text,
  "artifact_id" integer REFERENCES "capital_artifacts"("id") ON DELETE SET NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "use_of_funds_versions" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "packet_type" text NOT NULL,
  "packet_id" integer,
  "version" integer DEFAULT 1 NOT NULL,
  "total_amount" text,
  "allocation_json" jsonb,
  "rationale" text,
  "status" text DEFAULT 'draft' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "diligence_checklists" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "checklist_type" text NOT NULL,
  "packet_type" text DEFAULT 'general' NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "completion_pct" integer DEFAULT 0 NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "diligence_checklist_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "checklist_id" integer NOT NULL REFERENCES "diligence_checklists"("id") ON DELETE CASCADE,
  "item_key" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "category" text,
  "is_required" boolean DEFAULT true NOT NULL,
  "status" text DEFAULT 'not_started' NOT NULL,
  "artifact_id" integer REFERENCES "capital_artifacts"("id") ON DELETE SET NULL,
  "artifact_url" text,
  "notes" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "diligence_items_checklist_idx" ON "diligence_checklist_items" ("checklist_id");

CREATE TABLE IF NOT EXISTS "cap_table_placeholders" (
  "id" serial PRIMARY KEY NOT NULL,
  "holder_name" text NOT NULL,
  "holder_type" text DEFAULT 'founder' NOT NULL,
  "share_class" text DEFAULT 'Common' NOT NULL,
  "shares_placeholder" text,
  "ownership_pct" text,
  "vesting_schedule" text,
  "notes" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- ─── CERTIFICATION READINESS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "certification_programs" (
  "id" serial PRIMARY KEY NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "short_name" text,
  "administered_by" text,
  "program_type" text DEFAULT 'state' NOT NULL,
  "target_demographic" text,
  "description" text,
  "eligibility_summary" text,
  "application_url" text,
  "renewal_interval_months" integer,
  "is_active" boolean DEFAULT true NOT NULL,
  "requires_attorney_review" boolean DEFAULT false NOT NULL,
  "requires_cpa_review" boolean DEFAULT false NOT NULL,
  "notes" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "certification_requirements" (
  "id" serial PRIMARY KEY NOT NULL,
  "program_id" integer NOT NULL REFERENCES "certification_programs"("id") ON DELETE CASCADE,
  "requirement_key" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "category" text DEFAULT 'other' NOT NULL,
  "is_required" boolean DEFAULT true NOT NULL,
  "requires_review" boolean DEFAULT false NOT NULL,
  "review_type" text DEFAULT 'none' NOT NULL,
  "notes" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "cert_reqs_program_idx" ON "certification_requirements" ("program_id");

CREATE TABLE IF NOT EXISTS "certification_status" (
  "id" serial PRIMARY KEY NOT NULL,
  "program_id" integer NOT NULL REFERENCES "certification_programs"("id") ON DELETE CASCADE,
  "overall_status" text DEFAULT 'not_started' NOT NULL,
  "readiness_score" integer DEFAULT 0 NOT NULL,
  "applied_at" timestamp,
  "approved_at" timestamp,
  "expires_at" timestamp,
  "renewal_due_at" timestamp,
  "certification_number" text,
  "certification_body" text,
  "blockers" jsonb,
  "next_actions" jsonb,
  "notes" text,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "cert_status_program_idx" ON "certification_status" ("program_id");

CREATE TABLE IF NOT EXISTS "certification_tasks" (
  "id" serial PRIMARY KEY NOT NULL,
  "program_id" integer NOT NULL REFERENCES "certification_programs"("id") ON DELETE CASCADE,
  "requirement_id" integer REFERENCES "certification_requirements"("id") ON DELETE SET NULL,
  "title" text NOT NULL,
  "description" text,
  "task_type" text DEFAULT 'other' NOT NULL,
  "priority" text DEFAULT 'medium' NOT NULL,
  "status" text DEFAULT 'open' NOT NULL,
  "assigned_to" text,
  "due_date" timestamp,
  "completed_at" timestamp,
  "artifact_url" text,
  "flags_review" boolean DEFAULT false NOT NULL,
  "review_type" text,
  "notes" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "cert_tasks_program_idx" ON "certification_tasks" ("program_id");
CREATE INDEX IF NOT EXISTS "cert_tasks_status_idx" ON "certification_tasks" ("status");

CREATE TABLE IF NOT EXISTS "ownership_scenarios" (
  "id" serial PRIMARY KEY NOT NULL,
  "scenario_name" text NOT NULL,
  "description" text,
  "ownership_structure_json" jsonb,
  "program_eligibility_json" jsonb,
  "flagged_issues" jsonb,
  "requires_attorney_review" boolean DEFAULT false NOT NULL,
  "requires_cpa_review" boolean DEFAULT false NOT NULL,
  "legal_disclaimer_acknowledged" boolean DEFAULT false NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "application_artifacts" (
  "id" serial PRIMARY KEY NOT NULL,
  "program_id" integer NOT NULL REFERENCES "certification_programs"("id") ON DELETE CASCADE,
  "task_id" integer REFERENCES "certification_tasks"("id") ON DELETE SET NULL,
  "title" text NOT NULL,
  "artifact_type" text DEFAULT 'other' NOT NULL,
  "status" text DEFAULT 'needed' NOT NULL,
  "file_url" text,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "app_artifacts_program_idx" ON "application_artifacts" ("program_id");

CREATE TABLE IF NOT EXISTS "opportunity_pipeline" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "opportunity_type" text DEFAULT 'other' NOT NULL,
  "source" text DEFAULT 'federal' NOT NULL,
  "agency_name" text,
  "solicitation_number" text,
  "naics_codes" jsonb,
  "set_aside_type" text,
  "estimated_value" text,
  "posted_at" timestamp,
  "due_date" timestamp,
  "status" text DEFAULT 'tracking' NOT NULL,
  "fit_score" integer,
  "fit_notes" text,
  "required_certifications" jsonb,
  "contact_name" text,
  "contact_email" text,
  "opportunity_url" text,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "opportunity_status_idx" ON "opportunity_pipeline" ("status");
CREATE INDEX IF NOT EXISTS "opportunity_source_idx" ON "opportunity_pipeline" ("source");

CREATE TABLE IF NOT EXISTS "procurement_contacts" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "title" text,
  "agency" text,
  "agency_type" text,
  "email" text,
  "phone" text,
  "linkedin_url" text,
  "contact_type" text DEFAULT 'other' NOT NULL,
  "relationship_status" text DEFAULT 'cold' NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "certification_calendar" (
  "id" serial PRIMARY KEY NOT NULL,
  "program_id" integer REFERENCES "certification_programs"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "event_type" text DEFAULT 'other' NOT NULL,
  "event_date" timestamp NOT NULL,
  "reminder_days" integer DEFAULT 14 NOT NULL,
  "status" text DEFAULT 'upcoming' NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "cert_calendar_date_idx" ON "certification_calendar" ("event_date");
