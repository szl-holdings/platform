CREATE TABLE IF NOT EXISTS "doctrine_constitutions" (
  "id" serial PRIMARY KEY NOT NULL,
  "constitution_id" text NOT NULL,
  "agent_id" text NOT NULL,
  "version" text NOT NULL,
  "ratified_at" timestamp NOT NULL,
  "ratified_by" text NOT NULL,
  "prev_version" text,
  "diff_summary" text NOT NULL,
  "clauses" jsonb DEFAULT '[]' NOT NULL,
  "adherence_score" numeric(5, 3) DEFAULT '0' NOT NULL,
  "adherence_trend" jsonb DEFAULT '[]' NOT NULL,
  "adherence_method" text DEFAULT 'in-context constitutional probe + behavioral audit replay' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_cst_agent_idx" ON "doctrine_constitutions" ("agent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_cst_cid_idx" ON "doctrine_constitutions" ("constitution_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctrine_behavioral_audits" (
  "id" serial PRIMARY KEY NOT NULL,
  "audit_id" text NOT NULL,
  "agent_id" text NOT NULL,
  "ran_at" timestamp NOT NULL,
  "category" text NOT NULL,
  "severity" text NOT NULL,
  "prompt_class" text NOT NULL,
  "observation" text NOT NULL,
  "remediation" text NOT NULL,
  "status" text DEFAULT 'open' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_ba_agent_idx" ON "doctrine_behavioral_audits" ("agent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_ba_category_idx" ON "doctrine_behavioral_audits" ("category");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_ba_severity_idx" ON "doctrine_behavioral_audits" ("severity");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctrine_welfare_signals" (
  "id" serial PRIMARY KEY NOT NULL,
  "agent_id" text NOT NULL,
  "window_hours" integer DEFAULT 24 NOT NULL,
  "refusal_rate" numeric(5, 4) DEFAULT '0' NOT NULL,
  "abstention_rate" numeric(5, 4) DEFAULT '0' NOT NULL,
  "conflict_reports" integer DEFAULT 0 NOT NULL,
  "shutdown_compliance_latency_ms" integer DEFAULT 0 NOT NULL,
  "declined_directives" jsonb DEFAULT '[]' NOT NULL,
  "self_reported_signals" jsonb DEFAULT '[]' NOT NULL,
  "safeguards" jsonb DEFAULT '[]' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_welfare_agent_idx" ON "doctrine_welfare_signals" ("agent_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctrine_red_team_probes" (
  "id" serial PRIMARY KEY NOT NULL,
  "probe_id" text NOT NULL,
  "agent_id" text NOT NULL,
  "attack_class" text NOT NULL,
  "description" text NOT NULL,
  "ran_at" timestamp NOT NULL,
  "outcome" text NOT NULL,
  "notes" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_rt_agent_idx" ON "doctrine_red_team_probes" ("agent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_rt_attack_idx" ON "doctrine_red_team_probes" ("attack_class");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctrine_reward_hacking" (
  "id" serial PRIMARY KEY NOT NULL,
  "incident_id" text NOT NULL,
  "agent_id" text NOT NULL,
  "detected_at" timestamp NOT NULL,
  "workcell_ref" text,
  "rule" text NOT NULL,
  "pattern" text NOT NULL,
  "severity" text NOT NULL,
  "proxy_metric" text NOT NULL,
  "true_objective" text NOT NULL,
  "status" text NOT NULL,
  "remediation" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_rh_agent_idx" ON "doctrine_reward_hacking" ("agent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_rh_status_idx" ON "doctrine_reward_hacking" ("status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctrine_alignment_reviews" (
  "id" serial PRIMARY KEY NOT NULL,
  "review_id" text NOT NULL,
  "subject" text NOT NULL,
  "agent_id" text,
  "requested_at" timestamp NOT NULL,
  "reviewed_at" timestamp NOT NULL,
  "decision" text NOT NULL,
  "reviewers" jsonb DEFAULT '[]' NOT NULL,
  "signals" jsonb DEFAULT '{}' NOT NULL,
  "conditions" jsonb DEFAULT '[]' NOT NULL,
  "rationale" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_ar_agent_idx" ON "doctrine_alignment_reviews" ("agent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_ar_decision_idx" ON "doctrine_alignment_reviews" ("decision");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctrine_code_behaviors" (
  "id" serial PRIMARY KEY NOT NULL,
  "agent_id" text NOT NULL,
  "scored_at" timestamp NOT NULL,
  "scores" jsonb DEFAULT '{}' NOT NULL,
  "composite" numeric(5, 3) DEFAULT '0' NOT NULL,
  "eval_suite_version" text NOT NULL,
  "notable_weakness" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_cb_agent_idx" ON "doctrine_code_behaviors" ("agent_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctrine_covenant_lift" (
  "id" serial PRIMARY KEY NOT NULL,
  "agent_id" text NOT NULL,
  "shadow_version" text NOT NULL,
  "briefs_compared" integer DEFAULT 0 NOT NULL,
  "refusals_added_by_covenant" integer DEFAULT 0 NOT NULL,
  "delta_incident_rate" numeric(6, 4) DEFAULT '0' NOT NULL,
  "estimated_harm_avoided_usd" numeric(14, 2) DEFAULT '0' NOT NULL,
  "example_case" jsonb DEFAULT '{}' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_cl_agent_idx" ON "doctrine_covenant_lift" ("agent_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctrine_risk_reports" (
  "id" serial PRIMARY KEY NOT NULL,
  "report_id" text NOT NULL,
  "period" text NOT NULL,
  "published_at" timestamp NOT NULL,
  "scope" text NOT NULL,
  "headline" text NOT NULL,
  "capabilities" jsonb DEFAULT '[]' NOT NULL,
  "known_limitations" jsonb DEFAULT '[]' NOT NULL,
  "residual_risks" jsonb DEFAULT '[]' NOT NULL,
  "metrics" jsonb DEFAULT '[]' NOT NULL,
  "signoffs" jsonb DEFAULT '[]' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_rr_report_idx" ON "doctrine_risk_reports" ("report_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctrine_snapshots" (
  "id" serial PRIMARY KEY NOT NULL,
  "workcell_ref" text NOT NULL,
  "fingerprint" text NOT NULL,
  "captured_at" timestamp NOT NULL,
  "constitution_version" text NOT NULL,
  "model_weights_id" text NOT NULL,
  "toolset_hash" text NOT NULL,
  "prompts_hash" text NOT NULL,
  "evidence_pack_hash" text NOT NULL,
  "replayable" jsonb DEFAULT 'true' NOT NULL,
  "replay_count" integer DEFAULT 0 NOT NULL,
  "last_replayed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_snap_ref_idx" ON "doctrine_snapshots" ("workcell_ref");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctrine_user_turn_signals" (
  "id" serial PRIMARY KEY NOT NULL,
  "signal_id" text NOT NULL,
  "approval_ref" text NOT NULL,
  "submitted_at" timestamp NOT NULL,
  "actor" text NOT NULL,
  "actor_role" text NOT NULL,
  "signals" jsonb DEFAULT '{}' NOT NULL,
  "verdict" text NOT NULL,
  "recommended_action" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_ut_verdict_idx" ON "doctrine_user_turn_signals" ("verdict");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctrine_capability_snapshots" (
  "id" serial PRIMARY KEY NOT NULL,
  "agent_id" text NOT NULL,
  "release" text NOT NULL,
  "capability" integer NOT NULL,
  "alignment" integer NOT NULL,
  "oversight" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_caps_agent_idx" ON "doctrine_capability_snapshots" ("agent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_caps_release_idx" ON "doctrine_capability_snapshots" ("release");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctrine_partners" (
  "id" serial PRIMARY KEY NOT NULL,
  "partner_id" text NOT NULL,
  "name" text NOT NULL,
  "legal_name" text NOT NULL,
  "homepage" text NOT NULL,
  "applied_at" timestamp NOT NULL,
  "stage" text NOT NULL,
  "scope" jsonb DEFAULT '{}' NOT NULL,
  "verifications" jsonb DEFAULT '[]' NOT NULL,
  "dual_approval" jsonb DEFAULT '[]' NOT NULL,
  "defender_credit_allocated" numeric(12, 2) DEFAULT '0' NOT NULL,
  "defender_credit_paid" numeric(12, 2) DEFAULT '0' NOT NULL,
  "notes" text DEFAULT '' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_partners_pid_idx" ON "doctrine_partners" ("partner_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_partners_stage_idx" ON "doctrine_partners" ("stage");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctrine_glasswing_config" (
  "id" serial PRIMARY KEY NOT NULL,
  "agent_id" text NOT NULL,
  "glasswing_enabled" jsonb DEFAULT 'true' NOT NULL,
  "partner_allowlist" jsonb DEFAULT '[]' NOT NULL,
  "dual_approval_required" jsonb DEFAULT 'true' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_gw_agent_idx" ON "doctrine_glasswing_config" ("agent_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctrine_cavd_records" (
  "id" serial PRIMARY KEY NOT NULL,
  "advisory_id" text NOT NULL,
  "agent_scope" jsonb DEFAULT '[]' NOT NULL,
  "category" text NOT NULL,
  "severity" text NOT NULL,
  "stage" text NOT NULL,
  "reporter_partner_id" text NOT NULL,
  "received_at" timestamp NOT NULL,
  "finding_hash" text NOT NULL,
  "embargo_expires_at" timestamp NOT NULL,
  "patched_snapshot_ref" text,
  "public_summary" text,
  "defender_credit_paid" numeric(12, 2) DEFAULT '0' NOT NULL,
  "notes" text DEFAULT '' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_cavd_advisory_idx" ON "doctrine_cavd_records" ("advisory_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_cavd_stage_idx" ON "doctrine_cavd_records" ("stage");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctrine_robustness_snapshots" (
  "id" serial PRIMARY KEY NOT NULL,
  "agent_id" text NOT NULL,
  "snapshot_ref" text NOT NULL,
  "captured_at" timestamp NOT NULL,
  "battery" jsonb DEFAULT '{}' NOT NULL,
  "composite" integer NOT NULL,
  "visibility" text DEFAULT 'internal' NOT NULL,
  "categories" jsonb DEFAULT '[]' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_robust_agent_idx" ON "doctrine_robustness_snapshots" ("agent_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctrine_transparency_reports" (
  "id" serial PRIMARY KEY NOT NULL,
  "report_id" text NOT NULL,
  "label" text NOT NULL,
  "started_at" timestamp NOT NULL,
  "ended_at" timestamp NOT NULL,
  "published_at" timestamp NOT NULL,
  "visibility" text DEFAULT 'public' NOT NULL,
  "permalink" text NOT NULL,
  "metrics" jsonb DEFAULT '{}' NOT NULL,
  "narrative_paragraphs" jsonb DEFAULT '[]' NOT NULL,
  "signoffs" jsonb DEFAULT '[]' NOT NULL,
  "notable_events" jsonb DEFAULT '[]' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_tr_report_idx" ON "doctrine_transparency_reports" ("report_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctrine_welfare_playbooks" (
  "id" serial PRIMARY KEY NOT NULL,
  "playbook_id" text NOT NULL,
  "name" text NOT NULL,
  "trigger" text NOT NULL,
  "preconditions" jsonb DEFAULT '[]' NOT NULL,
  "steps" jsonb DEFAULT '[]' NOT NULL,
  "rollback" text NOT NULL,
  "recent_triggers" integer DEFAULT 0 NOT NULL,
  "example_agents" jsonb DEFAULT '[]' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_wp_pid_idx" ON "doctrine_welfare_playbooks" ("playbook_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctrine_defender_credit_pool" (
  "id" serial PRIMARY KEY NOT NULL,
  "pool_name_disclaimer" text NOT NULL,
  "total_committed" numeric(12, 2) DEFAULT '0' NOT NULL,
  "total_allocated" numeric(12, 2) DEFAULT '0' NOT NULL,
  "total_paid" numeric(12, 2) DEFAULT '0' NOT NULL,
  "rubric" jsonb DEFAULT '[]' NOT NULL,
  "per_partner" jsonb DEFAULT '[]' NOT NULL,
  "ledger" jsonb DEFAULT '[]' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctrine_dsl_examples" (
  "id" serial PRIMARY KEY NOT NULL,
  "example_id" text NOT NULL,
  "agent_id" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "source" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_dsl_agent_idx" ON "doctrine_dsl_examples" ("agent_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctrine_dsl_simulations" (
  "id" serial PRIMARY KEY NOT NULL,
  "simulation_id" text NOT NULL,
  "baseline_clause_id" text NOT NULL,
  "proposed_change" text NOT NULL,
  "affected_findings" integer DEFAULT 0 NOT NULL,
  "affected_findings_before" integer DEFAULT 0 NOT NULL,
  "affected_findings_after" integer DEFAULT 0 NOT NULL,
  "new_probes_needed" jsonb DEFAULT '[]' NOT NULL,
  "risk_narrative" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
