-- PRISM Counsel NY Insurance Observability Layer — Migration 0015
-- Creates all 28 NY-specific tables for signal model, clock intelligence,
-- insurer/venue intel, forecast engine, appeals, and trust governance.

CREATE TABLE IF NOT EXISTS "pc_clock_rules" (
  "id" serial PRIMARY KEY NOT NULL,
  "rule_id" text NOT NULL UNIQUE,
  "clock_type" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "day_limit" integer NOT NULL,
  "trigger_event" text NOT NULL,
  "consequence" text,
  "citation" text,
  "is_mandatory" boolean DEFAULT true,
  "applies_to" text NOT NULL DEFAULT 'all',
  "is_active" boolean DEFAULT true,
  "source_lineage" text,
  "actor_id" integer,
  "is_privileged" boolean DEFAULT false,
  "export_flag" boolean DEFAULT false,
  "last_reviewed" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_matter_clocks" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "matter_id" integer NOT NULL REFERENCES "pc_matters"("id") ON DELETE CASCADE,
  "clock_type" text NOT NULL,
  "started_at" timestamp NOT NULL,
  "deadline_at" timestamp NOT NULL,
  "status" text NOT NULL DEFAULT 'running',
  "days_remaining" integer,
  "is_breached" boolean DEFAULT false,
  "breached_at" timestamp,
  "rule_ref" text,
  "notes" text,
  "source_lineage" text,
  "actor_id" integer,
  "is_privileged" boolean DEFAULT false,
  "export_flag" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_clock_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "matter_id" integer NOT NULL REFERENCES "pc_matters"("id") ON DELETE CASCADE,
  "clock_id" integer NOT NULL REFERENCES "pc_matter_clocks"("id") ON DELETE CASCADE,
  "event_type" text NOT NULL,
  "occurred_at" timestamp NOT NULL,
  "description" text,
  "source_document" text,
  "source_lineage" text,
  "actor_id" integer,
  "is_privileged" boolean DEFAULT false,
  "export_flag" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_ny_rule_profiles" (
  "id" serial PRIMARY KEY NOT NULL,
  "rule_id" text NOT NULL UNIQUE,
  "category" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "day_limit" integer,
  "consequence" text,
  "citation" text,
  "last_reviewed" timestamp,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_no_fault_claims" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "matter_id" integer NOT NULL REFERENCES "pc_matters"("id") ON DELETE CASCADE,
  "claimant_name" text NOT NULL,
  "carrier_id" integer,
  "carrier_name" text,
  "assignor_name" text,
  "date_of_loss" timestamp NOT NULL,
  "notice_sent_at" timestamp,
  "notice_due_date" timestamp,
  "notice_status" text NOT NULL DEFAULT 'pending',
  "bill_status" text NOT NULL DEFAULT 'open',
  "total_billed" numeric(14,2),
  "total_paid" numeric(14,2),
  "total_denied" numeric(14,2),
  "arbitration_status" text NOT NULL DEFAULT 'not_filed',
  "arbitration_filed_at" timestamp,
  "award_amount" numeric(14,2),
  "evidence_lock_risk" integer,
  "source_lineage" text,
  "actor_id" integer,
  "is_privileged" boolean DEFAULT false,
  "export_flag" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_verification_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "matter_id" integer NOT NULL REFERENCES "pc_matters"("id") ON DELETE CASCADE,
  "no_fault_claim_id" integer REFERENCES "pc_no_fault_claims"("id"),
  "request_type" text NOT NULL,
  "requested_by" text,
  "requested_at" timestamp NOT NULL,
  "due_date" timestamp,
  "response_at" timestamp,
  "status" text NOT NULL DEFAULT 'pending',
  "outcome" text,
  "suspension_trigger" boolean DEFAULT false,
  "notes" text,
  "source_lineage" text,
  "actor_id" integer,
  "is_privileged" boolean DEFAULT false,
  "export_flag" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_denials" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "matter_id" integer NOT NULL REFERENCES "pc_matters"("id") ON DELETE CASCADE,
  "no_fault_claim_id" integer REFERENCES "pc_no_fault_claims"("id"),
  "denial_type" text NOT NULL,
  "denied_by" text,
  "denied_at" timestamp NOT NULL,
  "denial_reason" text,
  "denial_code" text,
  "amount_denied" numeric(14,2),
  "appeal_status" text NOT NULL DEFAULT 'not_appealed',
  "appeal_deadline" timestamp,
  "source_lineage" text,
  "actor_id" integer,
  "is_privileged" boolean DEFAULT false,
  "export_flag" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_appeals" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "matter_id" integer NOT NULL REFERENCES "pc_matters"("id") ON DELETE CASCADE,
  "denial_id" integer REFERENCES "pc_denials"("id"),
  "no_fault_claim_id" integer REFERENCES "pc_no_fault_claims"("id"),
  "appeal_type" text NOT NULL,
  "filed_at" timestamp,
  "deadline_at" timestamp,
  "status" text NOT NULL DEFAULT 'not_filed',
  "outcome" text,
  "decision_date" timestamp,
  "decision_notes" text,
  "appealing_party" text,
  "grounds_for_appeal" text,
  "source_lineage" text,
  "actor_id" integer,
  "is_privileged" boolean DEFAULT true,
  "export_flag" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_external_appeals" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "matter_id" integer NOT NULL REFERENCES "pc_matters"("id") ON DELETE CASCADE,
  "appeal_id" integer REFERENCES "pc_appeals"("id"),
  "tribunal" text NOT NULL,
  "tribunal_case_no" text,
  "panel_composition" text,
  "hearing_date" timestamp,
  "filing_deadline" timestamp,
  "status" text NOT NULL DEFAULT 'pending',
  "award_amount" numeric(14,2),
  "outcome" text,
  "representing_counsel" text,
  "notes" text,
  "source_lineage" text,
  "actor_id" integer,
  "is_privileged" boolean DEFAULT true,
  "export_flag" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_disclaimers" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "matter_id" integer NOT NULL REFERENCES "pc_matters"("id") ON DELETE CASCADE,
  "issued_by" text,
  "issued_at" timestamp NOT NULL,
  "due_date" timestamp,
  "is_timely" boolean,
  "days_from_loss" integer,
  "basis" text,
  "policy_exclusion" text,
  "vulnerability_score" integer,
  "challenge_status" text NOT NULL DEFAULT 'unchallenged',
  "notes" text,
  "source_lineage" text,
  "actor_id" integer,
  "is_privileged" boolean DEFAULT false,
  "export_flag" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_coverage_positions" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "matter_id" integer NOT NULL REFERENCES "pc_matters"("id") ON DELETE CASCADE,
  "position_type" text NOT NULL,
  "carrier_name" text,
  "position_date" timestamp NOT NULL,
  "coverage_amount" numeric(14,2),
  "reservation_basis" text,
  "policy_ref" text,
  "analysis_notes" text,
  "dispute_strength" text,
  "source_lineage" text,
  "actor_id" integer,
  "is_privileged" boolean DEFAULT true,
  "export_flag" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_medical_bill_cycles" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "matter_id" integer NOT NULL REFERENCES "pc_matters"("id") ON DELETE CASCADE,
  "no_fault_claim_id" integer REFERENCES "pc_no_fault_claims"("id"),
  "provider_name" text NOT NULL,
  "service_date" timestamp NOT NULL,
  "submitted_date" timestamp,
  "billed_amount" numeric(12,2),
  "paid_amount" numeric(12,2),
  "denied_amount" numeric(12,2),
  "status" text NOT NULL DEFAULT 'submitted',
  "denial_reason" text,
  "days_to_response" integer,
  "is_late" boolean DEFAULT false,
  "source_lineage" text,
  "actor_id" integer,
  "export_flag" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_offer_movements" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "matter_id" integer NOT NULL REFERENCES "pc_matters"("id") ON DELETE CASCADE,
  "offer_type" text NOT NULL,
  "amount" numeric(14,2) NOT NULL,
  "offering_party" text,
  "offered_at" timestamp NOT NULL,
  "expires_at" timestamp,
  "delta_from_previous" numeric(14,2),
  "delta_pct" numeric(7,2),
  "movement_signal" text,
  "notes" text,
  "source_lineage" text,
  "actor_id" integer,
  "is_privileged" boolean DEFAULT true,
  "export_flag" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_reserve_movements" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "matter_id" integer NOT NULL REFERENCES "pc_matters"("id") ON DELETE CASCADE,
  "carrier_id" integer,
  "carrier_name" text,
  "reserve_amount" numeric(14,2) NOT NULL,
  "prior_reserve" numeric(14,2),
  "delta" numeric(14,2),
  "reserve_date" timestamp NOT NULL,
  "movement_type" text NOT NULL,
  "inferred_signal" text,
  "source_lineage" text,
  "actor_id" integer,
  "is_privileged" boolean DEFAULT true,
  "export_flag" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_mediation_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "matter_id" integer NOT NULL REFERENCES "pc_matters"("id") ON DELETE CASCADE,
  "mediator_name" text,
  "scheduled_at" timestamp,
  "location" text,
  "session_type" text NOT NULL DEFAULT 'court_ordered',
  "status" text NOT NULL DEFAULT 'pending',
  "pre_readiness_score" integer,
  "conversion_probability" numeric(5,2),
  "settlement_amount" numeric(14,2),
  "opening_demand" numeric(14,2),
  "opening_offer" numeric(14,2),
  "outcome" text,
  "notes" text,
  "source_lineage" text,
  "actor_id" integer,
  "is_privileged" boolean DEFAULT true,
  "export_flag" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_venue_profiles" (
  "id" serial PRIMARY KEY NOT NULL,
  "county" text NOT NULL,
  "court_name" text NOT NULL,
  "court_type" text NOT NULL,
  "average_cycle_months" integer,
  "median_verdict_auto" numeric(14,2),
  "median_verdict_premises" numeric(14,2),
  "median_verdict_coverage" numeric(14,2),
  "plaintiff_friendliness" text,
  "adr_availability" text,
  "conference_frequency" text,
  "typical_parts_assigned" text,
  "special_rules" jsonb,
  "filing_expectations" text,
  "velocity_score" integer,
  "source_lineage" text,
  "actor_id" integer,
  "is_privileged" boolean DEFAULT false,
  "export_flag" boolean DEFAULT false,
  "last_updated" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_part_profiles" (
  "id" serial PRIMARY KEY NOT NULL,
  "venue_id" integer REFERENCES "pc_venue_profiles"("id"),
  "part_name" text NOT NULL,
  "judge_name" text,
  "track_type" text,
  "conference_rules" text,
  "discovery_timeline" text,
  "mediation_policy" text,
  "disposition_history" jsonb,
  "velocity_score" integer,
  "notes" text,
  "source_lineage" text,
  "actor_id" integer,
  "is_privileged" boolean DEFAULT false,
  "export_flag" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_insurer_profiles" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "carrier_name" text NOT NULL,
  "claim_office" text,
  "region" text,
  "reserving_style" text,
  "denial_pattern" text,
  "median_first_offer" numeric(14,2),
  "average_response_days" integer,
  "mediation_behavior" text,
  "escalation_threshold" numeric(14,2),
  "litigation_tolerance" text,
  "notes" text,
  "source_lineage" text,
  "actor_id" integer,
  "export_flag" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_adjuster_profiles" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "insurer_profile_id" integer REFERENCES "pc_insurer_profiles"("id"),
  "name" text NOT NULL,
  "email" text,
  "phone" text,
  "claim_office" text,
  "negotiation_style" text,
  "average_response_days" integer,
  "decision_authority" numeric(14,2),
  "historical_notes" text,
  "source_lineage" text,
  "actor_id" integer,
  "export_flag" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_communication_windows" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "matter_id" integer NOT NULL REFERENCES "pc_matters"("id") ON DELETE CASCADE,
  "party_name" text NOT NULL,
  "party_role" text NOT NULL,
  "last_contact_at" timestamp,
  "days_silent" integer,
  "silence_risk" text NOT NULL DEFAULT 'none',
  "expected_response_days" integer,
  "outstanding_items" jsonb,
  "escalation_status" text NOT NULL DEFAULT 'none',
  "source_lineage" text,
  "actor_id" integer,
  "is_privileged" boolean DEFAULT false,
  "export_flag" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_demand_packets" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "matter_id" integer NOT NULL REFERENCES "pc_matters"("id") ON DELETE CASCADE,
  "version" integer NOT NULL DEFAULT 1,
  "status" text NOT NULL DEFAULT 'draft',
  "demand_amount" numeric(14,2),
  "readiness_score" integer,
  "missing_items" jsonb,
  "included_items" jsonb,
  "sent_at" timestamp,
  "approved_by" integer,
  "approved_at" timestamp,
  "response_at" timestamp,
  "response_amount" numeric(14,2),
  "notes" text,
  "source_lineage" text,
  "actor_id" integer,
  "is_privileged" boolean DEFAULT true,
  "export_flag" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_demand_readiness_snapshots" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "matter_id" integer NOT NULL REFERENCES "pc_matters"("id") ON DELETE CASCADE,
  "overall_score" integer NOT NULL,
  "medical_chronology_score" integer,
  "liability_score" integer,
  "damages_score" integer,
  "lien_score" integer,
  "photographic_score" integer,
  "witness_score" integer,
  "expert_score" integer,
  "missing_items" jsonb,
  "blocking_items" jsonb,
  "computed_at" timestamp NOT NULL DEFAULT now(),
  "actor_id" integer,
  "export_flag" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "pc_forecast_runs" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "matter_id" integer NOT NULL REFERENCES "pc_matters"("id") ON DELETE CASCADE,
  "forecast_type" text NOT NULL,
  "score" numeric(7,2) NOT NULL,
  "confidence" numeric(5,2),
  "weekly_delta" numeric(7,2),
  "next_best_action" text,
  "model_version" text,
  "run_at" timestamp NOT NULL DEFAULT now(),
  "actor_id" integer,
  "export_flag" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "pc_forecast_drivers" (
  "id" serial PRIMARY KEY NOT NULL,
  "forecast_run_id" integer NOT NULL REFERENCES "pc_forecast_runs"("id") ON DELETE CASCADE,
  "org_id" integer NOT NULL,
  "matter_id" integer NOT NULL REFERENCES "pc_matters"("id") ON DELETE CASCADE,
  "actor_id" integer,
  "driver_name" text NOT NULL,
  "driver_value" text,
  "impact" text NOT NULL,
  "weight" numeric(5,2),
  "explanation" text,
  "source_ref" text,
  "source_lineage" text,
  "export_flag" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_forecast_explanations" (
  "id" serial PRIMARY KEY NOT NULL,
  "forecast_run_id" integer NOT NULL REFERENCES "pc_forecast_runs"("id") ON DELETE CASCADE,
  "org_id" integer NOT NULL,
  "matter_id" integer NOT NULL REFERENCES "pc_matters"("id") ON DELETE CASCADE,
  "actor_id" integer,
  "headline" text,
  "detail" text,
  "recommendations" jsonb,
  "citations" jsonb,
  "is_privileged" boolean DEFAULT false,
  "source_lineage" text,
  "export_flag" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_ai_review_packets" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "matter_id" integer NOT NULL REFERENCES "pc_matters"("id") ON DELETE CASCADE,
  "review_type" text NOT NULL,
  "generated_content" text,
  "source_references" jsonb,
  "grounding_score" integer,
  "flagged_assertions" jsonb,
  "status" text NOT NULL DEFAULT 'draft',
  "reviewed_by" integer,
  "reviewed_at" timestamp,
  "approved_by" integer,
  "approved_at" timestamp,
  "model_route" text,
  "is_privileged" boolean DEFAULT true,
  "export_flag" boolean DEFAULT false,
  "actor_id" integer,
  "source_lineage" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "pc_defensibility_scores" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL,
  "matter_id" integer NOT NULL REFERENCES "pc_matters"("id") ON DELETE CASCADE,
  "overall_score" integer NOT NULL,
  "grounding_score" integer,
  "human_approval_score" integer,
  "privilege_score" integer,
  "audit_completeness" integer,
  "source_attribution_score" integer,
  "open_flags" integer DEFAULT 0,
  "flag_details" jsonb,
  "computed_at" timestamp NOT NULL DEFAULT now(),
  "actor_id" integer,
  "export_flag" boolean DEFAULT false
);
