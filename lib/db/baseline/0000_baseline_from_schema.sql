CREATE TYPE "public"."analytics_anomaly_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."analytics_attribution_model" AS ENUM('first_touch', 'last_touch', 'linear', 'time_decay');--> statement-breakpoint
CREATE TYPE "public"."analytics_granularity" AS ENUM('minute', 'hour', 'day', 'week', 'month');--> statement-breakpoint
CREATE TYPE "public"."cog_action_status" AS ENUM('pending', 'approved', 'running', 'completed', 'failed', 'rolled-back', 'denied');--> statement-breakpoint
CREATE TYPE "public"."cog_entity_edge_type" AS ENUM('relates-to', 'depends-on', 'triggers', 'mitigates', 'owns', 'managed-by', 'derived-from', 'affects', 'linked-trace', 'similar-to', 'supersedes', 'alias-of', 'custom');--> statement-breakpoint
CREATE TYPE "public"."cog_plan_status" AS ENUM('draft', 'pending', 'running', 'completed', 'failed', 'aborted', 'rolled-back');--> statement-breakpoint
CREATE TYPE "public"."cog_plan_step_status" AS ENUM('pending', 'running', 'completed', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."cog_policy_effect" AS ENUM('allow', 'deny', 'require-approval', 'log', 'redact', 'escalate');--> statement-breakpoint
CREATE TYPE "public"."cog_provenance_method" AS ENUM('api', 'manual', 'agent', 'import', 'derived');--> statement-breakpoint
CREATE TYPE "public"."cog_reflection_type" AS ENUM('post-task', 'periodic', 'error-triggered', 'human-initiated', 'goal-review', 'policy-breach');--> statement-breakpoint
CREATE TYPE "public"."cog_rollback_trigger" AS ENUM('agent', 'verifier', 'guardian', 'human', 'policy', 'timeout', 'cascade-failure');--> statement-breakpoint
CREATE TYPE "public"."self_model_status" AS ENUM('draft', 'active', 'archived', 'deprecated');--> statement-breakpoint
CREATE TYPE "public"."cog_sensitivity_tier" AS ENUM('public', 'internal', 'confidential', 'restricted', 'top-secret');--> statement-breakpoint
CREATE TYPE "public"."cog_skill_run_status" AS ENUM('pending', 'running', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."cog_skill_status" AS ENUM('draft', 'active', 'deprecated', 'retired');--> statement-breakpoint
CREATE TYPE "public"."cog_verifier_outcome" AS ENUM('pass', 'fail', 'warn', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."cst_sensitivity_tier" AS ENUM('public', 'internal', 'confidential', 'restricted', 'top_secret');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('person', 'organization', 'asset', 'vessel', 'port', 'workflow', 'task', 'alert', 'case', 'incident', 'control', 'risk_item', 'recommendation');--> statement-breakpoint
CREATE TYPE "public"."eval_domain" AS ENUM('terra', 'prism-counsel', 'vessels', 'aegis', 'lyte', 'carlota-jo', 'imperium', 'platform', 'pulse', 'cross-domain');--> statement-breakpoint
CREATE TYPE "public"."eval_grader_type" AS ENUM('prompt-eval', 'model-routing-eval', 'tool-reliability', 'agent-workflow-eval', 'policy-adherence', 'citation-quality', 'hallucination', 'bias-safety', 'latency-cost', 'trace-grading', 'human-review', 'exact-match', 'semantic-similarity', 'custom');--> statement-breakpoint
CREATE TYPE "public"."eval_severity" AS ENUM('none', 'minor', 'major', 'critical');--> statement-breakpoint
CREATE TYPE "public"."eval_status" AS ENUM('pending', 'running', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."insurance_claim_status" AS ENUM('filed', 'under_review', 'investigation', 'negotiation', 'settled', 'rejected', 'closed');--> statement-breakpoint
CREATE TYPE "public"."insurance_coverage_type" AS ENUM('marine_cargo', 'hull_machinery', 'protection_indemnity', 'freight_demurrage', 'war_risk', 'pollution_liability');--> statement-breakpoint
CREATE TYPE "public"."insurance_policy_status" AS ENUM('quote', 'bound', 'active', 'expired', 'cancelled', 'claim_in_progress');--> statement-breakpoint
CREATE TYPE "public"."insurance_risk_rating" AS ENUM('low', 'moderate', 'high', 'very_high', 'uninsurable');--> statement-breakpoint
CREATE TYPE "public"."event_action" AS ENUM('created', 'updated', 'deleted', 'detected', 'resolved', 'escalated', 'routed', 'recommended', 'executed', 'triggered', 'scored', 'forecasted');--> statement-breakpoint
CREATE TYPE "public"."event_severity" AS ENUM('info', 'low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."span_status" AS ENUM('ok', 'error', 'pending');--> statement-breakpoint
CREATE TYPE "public"."trace_event_kind" AS ENUM('tool_call', 'retrieval', 'memory_read', 'memory_write', 'memory_evict', 'model_call', 'guardrail', 'approval', 'policy_decision', 'error', 'retry', 'rollback', 'custom');--> statement-breakpoint
CREATE TYPE "public"."trace_status" AS ENUM('running', 'completed', 'failed', 'rolled-back');--> statement-breakpoint
CREATE TYPE "public"."trading_instrument_type" AS ENUM('freight_futures', 'bunker_fuel', 'dry_bulk', 'wet_bulk', 'container_rate', 'lng_spot', 'iron_ore_swap');--> statement-breakpoint
CREATE TYPE "public"."trading_order_side" AS ENUM('buy', 'sell');--> statement-breakpoint
CREATE TYPE "public"."trading_order_status" AS ENUM('pending', 'open', 'partially_filled', 'filled', 'cancelled', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."trading_order_type" AS ENUM('market', 'limit');--> statement-breakpoint
CREATE TYPE "public"."conduit_connection_status" AS ENUM('active', 'error', 'untested');--> statement-breakpoint
CREATE TYPE "public"."conduit_mapping_transform" AS ENUM('uppercase', 'lowercase', 'concat', 'split', 'format_date', 'lookup', 'json_extract', 'constant', 'conditional');--> statement-breakpoint
CREATE TYPE "public"."conduit_sync_run_mode" AS ENUM('manual', 'scheduled', 'on_change');--> statement-breakpoint
CREATE TYPE "public"."conduit_sync_run_status" AS ENUM('running', 'success', 'failed', 'partial');--> statement-breakpoint
CREATE TYPE "public"."conduit_sync_semantics" AS ENUM('insert', 'upsert', 'mirror');--> statement-breakpoint
CREATE TYPE "public"."conduit_sync_status" AS ENUM('active', 'paused', 'draft', 'error');--> statement-breakpoint
CREATE TABLE "a11oy_defense_payloads" (
	"slug" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "a2a_agent_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"capabilities" text[] DEFAULT '{}' NOT NULL,
	"input_schema" jsonb,
	"output_schema" jsonb,
	"preferred_model" text NOT NULL,
	"preferred_provider" text NOT NULL,
	"collaborates_with" text[] DEFAULT '{}' NOT NULL,
	"cost_per_call_usd" real DEFAULT 0.001 NOT NULL,
	"avg_latency_ms" integer DEFAULT 2000 NOT NULL,
	"success_rate" real DEFAULT 0.95 NOT NULL,
	"status" text DEFAULT 'online' NOT NULL,
	"last_heartbeat_at" timestamp with time zone DEFAULT now() NOT NULL,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "a2a_agent_cards_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "a2a_agent_heartbeats" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"status" text DEFAULT 'online' NOT NULL,
	"load" real DEFAULT 0 NOT NULL,
	"active_tasks" integer DEFAULT 0 NOT NULL,
	"uptime_ms" bigint,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "a2a_delegation_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"requesting_agent_id" text NOT NULL,
	"target_agent_id" text NOT NULL,
	"query" text NOT NULL,
	"context" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"result" text,
	"result_confidence" real,
	"error_message" text,
	"timeout_ms" integer DEFAULT 30000 NOT NULL,
	"requested_at" bigint NOT NULL,
	"accepted_at" bigint,
	"completed_at" bigint,
	"duration_ms" integer,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"orchestration_id" text,
	"metadata" jsonb,
	CONSTRAINT "a2a_delegation_tasks_task_id_unique" UNIQUE("task_id")
);
--> statement-breakpoint
CREATE TABLE "a2a_discovery_queries" (
	"id" serial PRIMARY KEY NOT NULL,
	"query_id" text NOT NULL,
	"requesting_agent_id" text NOT NULL,
	"capability" text,
	"domain" text,
	"query_text" text,
	"result_count" integer DEFAULT 0 NOT NULL,
	"top_match_agent_id" text,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "a2a_discovery_queries_query_id_unique" UNIQUE("query_id")
);
--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resource_id" text,
	"description" text,
	"metadata" jsonb,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" text,
	"user_agent" text,
	"decision" text,
	"policy_evaluation_id" text,
	"resolved_mode" text,
	"confidence" real,
	"blocked_reason" text,
	"projected_impact" jsonb,
	"product" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_registry_pointers" (
	"tenant_id" text NOT NULL,
	"domain" text NOT NULL,
	"active_profile_id" text NOT NULL,
	"active_version" text NOT NULL,
	"history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rollback_available" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profile_registry_pointers_tenant_id_domain_pk" PRIMARY KEY("tenant_id","domain")
);
--> statement-breakpoint
CREATE TABLE "aegis_action_queue_items" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"assigned_to" text,
	"due_at" timestamp,
	"incident_id" text,
	"source" text DEFAULT 'system' NOT NULL,
	"playbook_ref" text,
	"audit_trail" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aegis_deception_honeypots" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"ip" text NOT NULL,
	"os" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"interactions" integer DEFAULT 0 NOT NULL,
	"iocs_pushed" integer DEFAULT 0 NOT NULL,
	"deception_score" integer DEFAULT 0 NOT NULL,
	"last_hit" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aegis_soar_playbooks" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"trigger" text NOT NULL,
	"description" text NOT NULL,
	"nodes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"run_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aegis_soar_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"playbook_id" text NOT NULL,
	"playbook_name" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"triggered_by" text DEFAULT 'manual' NOT NULL,
	"duration" text,
	"steps_completed" integer DEFAULT 0 NOT NULL,
	"steps_failed" integer DEFAULT 0 NOT NULL,
	"outcome" text,
	"incident_id" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "aegis_twin_nodes" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"type" text NOT NULL,
	"zone" text NOT NULL,
	"tier" text DEFAULT 'tier-2' NOT NULL,
	"status" text DEFAULT 'synced' NOT NULL,
	"ip" text,
	"os" text,
	"vulnerabilities" integer DEFAULT 0 NOT NULL,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_mesh_containment_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" integer,
	"name" text NOT NULL,
	"agent_class" text NOT NULL,
	"allowed_mcp_servers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allowed_tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allowed_read_paths" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allowed_egress_domains" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tier" text DEFAULT 'standard' NOT NULL,
	"enforcement_mode" text DEFAULT 'log-only' NOT NULL,
	"pending_mode_change" jsonb,
	"violation_count" integer DEFAULT 0 NOT NULL,
	"last_evaluated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_mesh_drift_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" integer,
	"config_file" text NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"changed_by" text DEFAULT 'unknown' NOT NULL,
	"policy_approved" boolean DEFAULT false NOT NULL,
	"approved_by" text,
	"rolled_back_by" text,
	"rolled_back_at" timestamp with time zone,
	"diff" jsonb DEFAULT '{"removed":[],"added":[]}'::jsonb NOT NULL,
	"linked_exposure_ids" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_mesh_edges" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" integer,
	"agent_id" text NOT NULL,
	"mcp_server_id" text NOT NULL,
	"tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"data_read_paths" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_mesh_exposures" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" integer,
	"title" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"affected_agent_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"affected_secret_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"affected_mcp_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"explanation" text DEFAULT '' NOT NULL,
	"owasp_category" text DEFAULT '' NOT NULL,
	"owasp_ref" text DEFAULT '' NOT NULL,
	"cve_refs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"fix_type" text DEFAULT 'scope-token' NOT NULL,
	"fix_label" text DEFAULT '' NOT NULL,
	"proof_hash" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_mesh_gateway_events" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" integer,
	"rule_id" text NOT NULL,
	"agent_class" text NOT NULL,
	"mcp_server_id" text NOT NULL,
	"tool" text NOT NULL,
	"egress_domain" text,
	"decision" text NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"enforcement_mode" text NOT NULL,
	"linked_exposure_id" text,
	"latency_ms" integer,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_mesh_mcp_servers" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" integer,
	"name" text NOT NULL,
	"package_ref" text DEFAULT '' NOT NULL,
	"version" text DEFAULT 'unknown' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"source_registry" text DEFAULT 'unknown' NOT NULL,
	"trust_state" text DEFAULT 'unverified' NOT NULL,
	"runtime_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allowed_egress_domains" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"detected_egress_domains" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_mesh_resilience_index" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"overall" integer NOT NULL,
	"grade" text NOT NULL,
	"secret_hygiene" integer NOT NULL,
	"permission_surface" integer NOT NULL,
	"supply_chain" integer NOT NULL,
	"egress_containment" integer NOT NULL,
	"schedule_hygiene" integer NOT NULL,
	"instruction_tampering_risk" integer NOT NULL,
	"cross_agent_blast_radius" integer NOT NULL,
	"open_exposures" integer DEFAULT 0 NOT NULL,
	"pending_approvals" integer DEFAULT 0 NOT NULL,
	"top_exposure" text,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_mesh_runtimes" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" integer,
	"name" text NOT NULL,
	"version" text DEFAULT 'unknown' NOT NULL,
	"source_registry" text DEFAULT 'unknown' NOT NULL,
	"trust_state" text DEFAULT 'unverified' NOT NULL,
	"config_files" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active_agent_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_mesh_secrets" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" integer,
	"label" text NOT NULL,
	"format" text DEFAULT 'env-var' NOT NULL,
	"found_in_file" text NOT NULL,
	"entropy" double precision DEFAULT 0 NOT NULL,
	"reachable_by_agent_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reachable_by_mcp_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_knowledge" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_id" text NOT NULL,
	"type" text NOT NULL,
	"domain" text NOT NULL,
	"source_agent" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"confidence" real DEFAULT 0.8 NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"related_entry_ids" text[] DEFAULT '{}' NOT NULL,
	"data" jsonb,
	"timestamp" bigint NOT NULL,
	"expires_at" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_knowledge_entry_id_unique" UNIQUE("entry_id")
);
--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"domain" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"started_at" bigint NOT NULL,
	"completed_at" bigint,
	"duration_ms" integer,
	"summary" text,
	"error" text,
	"knowledge_entry_ids" text[] DEFAULT '{}' NOT NULL,
	"events_published" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_runs_run_id_unique" UNIQUE("run_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_agent_performance_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"window_days" integer NOT NULL,
	"total_decisions" integer DEFAULT 0 NOT NULL,
	"acceptance_rate" real DEFAULT 0 NOT NULL,
	"override_rate" real DEFAULT 0 NOT NULL,
	"rejection_rate" real DEFAULT 0 NOT NULL,
	"weighted_accuracy_score" real DEFAULT 0 NOT NULL,
	"mean_predicted_confidence" real DEFAULT 0 NOT NULL,
	"mean_actual_acceptance_rate" real DEFAULT 0 NOT NULL,
	"calibration_bias" real DEFAULT 0 NOT NULL,
	"calibration_verdict" text DEFAULT 'insufficient_data' NOT NULL,
	"overall_health_score" real DEFAULT 0 NOT NULL,
	"health_label" text DEFAULT 'good' NOT NULL,
	"flags" text[] DEFAULT '{}' NOT NULL,
	"skill_effectiveness" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"trend" text DEFAULT 'stable' NOT NULL,
	"snapshot_taken_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_agent_reflections" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"has_data" boolean DEFAULT false NOT NULL,
	"context_block" text NOT NULL,
	"confidence_adjustment" real DEFAULT 0 NOT NULL,
	"reasoning_adjustments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"urgent_flags" text[] DEFAULT '{}' NOT NULL,
	"overall_health" text DEFAULT 'good' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_confidence_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"alert_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"alert_type" text NOT NULL,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"current_value" real NOT NULL,
	"threshold" real NOT NULL,
	"trend" text NOT NULL,
	"recommended_action" text NOT NULL,
	"requires_human_review" boolean DEFAULT false NOT NULL,
	"auto_resolvable" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" text,
	CONSTRAINT "alloy_confidence_alerts_alert_id_unique" UNIQUE("alert_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_decision_outcomes" (
	"id" serial PRIMARY KEY NOT NULL,
	"decision_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"skill_id" text,
	"capability" text,
	"predicted_confidence" real NOT NULL,
	"actual_outcome" text NOT NULL,
	"was_acted_on" boolean DEFAULT false NOT NULL,
	"was_overridden" boolean DEFAULT false NOT NULL,
	"override_reason" text,
	"predicted_impact_level" text NOT NULL,
	"actual_impact_level" text,
	"recommended_action" text NOT NULL,
	"final_action" text,
	"execution_result" text,
	"human_review_required" boolean DEFAULT false NOT NULL,
	"human_review_requested" boolean DEFAULT false NOT NULL,
	"decision_type" text NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "alloy_decision_outcomes_decision_id_unique" UNIQUE("decision_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_self_improvement_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text,
	"tenant_id" text NOT NULL,
	"short_window_days" integer DEFAULT 7 NOT NULL,
	"long_window_days" integer DEFAULT 30 NOT NULL,
	"min_sample_size" integer DEFAULT 5 NOT NULL,
	"accuracy_decline_threshold" real DEFAULT 0.1 NOT NULL,
	"override_rate_threshold" real DEFAULT 0.3 NOT NULL,
	"low_acceptance_threshold" real DEFAULT 0.5 NOT NULL,
	"calibration_drift_threshold" real DEFAULT 0.15 NOT NULL,
	"self_reflection_enabled" boolean DEFAULT true NOT NULL,
	"alerts_enabled" boolean DEFAULT true NOT NULL,
	"auto_escalate_on_critical" boolean DEFAULT true NOT NULL,
	"alert_cooldown_hours" integer DEFAULT 4 NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_skill_registry" (
	"id" serial PRIMARY KEY NOT NULL,
	"skill_id" text NOT NULL,
	"name" text NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"capability" text NOT NULL,
	"domain" text NOT NULL,
	"description" text NOT NULL,
	"trigger_conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"required_inputs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"optional_inputs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"output_schema" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"output_decision_type" text NOT NULL,
	"chain_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"analytic_mode" text NOT NULL,
	"policy_class" text NOT NULL,
	"estimated_latency_ms" integer DEFAULT 10000 NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"is_builtin" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"registered_by" text,
	"org_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "alloy_skill_registry_skill_id_unique" UNIQUE("skill_id")
);
--> statement-breakpoint
CREATE TABLE "advisory_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"recommendation_type" text NOT NULL,
	"risk_level" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"runbook" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"actioned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_behavior_prefs" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"tone" text DEFAULT 'professional',
	"detail_level" text DEFAULT 'balanced',
	"domain_jargon" boolean DEFAULT true NOT NULL,
	"response_length" text DEFAULT 'medium',
	"custom_instructions" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_behavior_prefs_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "agent_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"rating" integer NOT NULL,
	"message_content" text,
	"response_content" text,
	"feedback_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_training_pairs" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" text DEFAULT 'general',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_review_queue" (
	"review_id" varchar(128) PRIMARY KEY NOT NULL,
	"trace_id" varchar(128) NOT NULL,
	"org_id" integer,
	"domain" varchar(80) NOT NULL,
	"recommendation_type" varchar(80) NOT NULL,
	"model" varchar(200) NOT NULL,
	"confidence" numeric(6, 4) DEFAULT '1' NOT NULL,
	"risk_level" varchar(20),
	"review_reason" text NOT NULL,
	"priority" varchar(20) DEFAULT 'low' NOT NULL,
	"input_summary" text,
	"output_summary" text,
	"cost_estimate_usd" numeric(14, 8) DEFAULT '0' NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"eval_score" numeric(6, 4),
	"eval_passed" boolean,
	"verdict" varchar(30),
	"reviewed_by" integer,
	"review_notes" text,
	"escalated_to" varchar(200),
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"enqueued_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "ai_traces" (
	"trace_id" varchar(128) PRIMARY KEY NOT NULL,
	"correlation_id" varchar(128),
	"org_id" integer,
	"agent_id" varchar(128),
	"model" varchar(200) NOT NULL,
	"model_provider" varchar(100) NOT NULL,
	"model_version" varchar(100),
	"route_class" varchar(100),
	"domain" varchar(80) NOT NULL,
	"recommendation_type" varchar(80) NOT NULL,
	"prompt_hash" varchar(32) NOT NULL,
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"cost_estimate_usd" numeric(14, 8) DEFAULT '0' NOT NULL,
	"confidence" numeric(6, 4) DEFAULT '1' NOT NULL,
	"risk_level" varchar(20),
	"requires_review" boolean DEFAULT false NOT NULL,
	"review_reason" text,
	"proof_chain_id" integer,
	"outcome_graph_id" integer,
	"input_summary" text,
	"output_summary" text,
	"tools_used" jsonb,
	"eval_score" numeric(6, 4),
	"eval_passed" boolean,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"workflow_id" integer,
	"signal_id" integer,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"assigned_user_id" integer,
	"owner_id" integer,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"result" jsonb,
	"error_message" text,
	"due_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alloy_actions_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"run_id" integer,
	"requested_by_user_id" integer,
	"reviewer_user_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"reason" text,
	"review_note" text,
	"required_roles" jsonb DEFAULT '[]'::jsonb,
	"expires_at" timestamp,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_artifacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"workflow_id" integer,
	"signal_id" integer,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"format" text DEFAULT 'markdown' NOT NULL,
	"confidence_score" real DEFAULT 0.5,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"approval_state" text DEFAULT 'none',
	"approved_by_user_id" integer,
	"version" integer DEFAULT 1 NOT NULL,
	"parent_artifact_id" integer,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"domain" text NOT NULL,
	"owner_id" integer,
	"owner_user_id" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"published_at" timestamp,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alloy_artifacts_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer NOT NULL,
	"action" text NOT NULL,
	"actor_user_id" integer,
	"actor_type" text DEFAULT 'system' NOT NULL,
	"previous_state" jsonb,
	"new_state" jsonb,
	"diff" jsonb,
	"notes" text,
	"ip_address" text,
	"user_agent" text,
	"correlation_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_decisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"verdict" text,
	"confidence" integer,
	"approval_status" text DEFAULT 'propose_only' NOT NULL,
	"evidence" jsonb DEFAULT '[]'::jsonb,
	"agent_id" text,
	"agent_name" text,
	"model_used" text,
	"workflow_run_id" integer,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_owners" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"name" text NOT NULL,
	"type" text DEFAULT 'user' NOT NULL,
	"email" text,
	"domain" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alloy_owners_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"source" text NOT NULL,
	"source_type" text DEFAULT 'api' NOT NULL,
	"domain" text NOT NULL,
	"raw_payload" jsonb,
	"title" text NOT NULL,
	"summary" text,
	"category" text,
	"severity" text DEFAULT 'medium' NOT NULL,
	"score" real DEFAULT 0,
	"confidence" real DEFAULT 0.5,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"owner_id" integer,
	"owner_user_id" integer,
	"status" text DEFAULT 'raw' NOT NULL,
	"normalized_at" timestamp,
	"scored_at" timestamp,
	"dedupe_key" text,
	"environment" text DEFAULT 'production',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alloy_signals_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_skill_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"skill_id" integer NOT NULL,
	"workflow_run_id" integer,
	"agent_id" text,
	"input" jsonb,
	"output" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"duration_ms" integer,
	"error_message" text,
	"model_used" text,
	"cost_cents" integer,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"approval_class" text DEFAULT 'auto' NOT NULL,
	"is_internal" boolean DEFAULT true NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"dry_run_supported" boolean DEFAULT false NOT NULL,
	"input_schema" jsonb,
	"output_schema" jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp,
	"deprecated_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_workflow_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"run_number" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'started' NOT NULL,
	"trigger" text,
	"inputs" jsonb DEFAULT '{}'::jsonb,
	"outputs" jsonb DEFAULT '{}'::jsonb,
	"steps_executed" jsonb DEFAULT '[]'::jsonb,
	"owner_user_id" integer,
	"approval_state" text DEFAULT 'none',
	"approved_by_user_id" integer,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"duration_ms" integer,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "alloy_workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"name" text NOT NULL,
	"type" text DEFAULT 'investigation' NOT NULL,
	"domain" text NOT NULL,
	"trigger_signal_id" integer,
	"trigger_type" text DEFAULT 'signal' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"owner_id" integer,
	"owner_user_id" integer,
	"assigned_user_id" integer,
	"steps" jsonb DEFAULT '[]'::jsonb,
	"current_step" integer DEFAULT 0,
	"inputs" jsonb DEFAULT '{}'::jsonb,
	"outputs" jsonb DEFAULT '{}'::jsonb,
	"context" jsonb DEFAULT '{}'::jsonb,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"approval_state" text DEFAULT 'none',
	"confidence_score" real DEFAULT 0.5,
	"error_message" text,
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"environment" text DEFAULT 'production',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alloy_workflows_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_ai_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"decision_id" text,
	"org_id" integer,
	"endpoint" text NOT NULL,
	"model" text,
	"route_class" text,
	"confidence" real,
	"latency_ms" integer,
	"approver_user_id" integer,
	"approver_roles" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_ai_decisions" (
	"decision_id" text PRIMARY KEY NOT NULL,
	"org_id" integer,
	"workflow_id" text,
	"signal_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommended_action" text NOT NULL,
	"rationale_summary" text NOT NULL,
	"evidence_refs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"owner_suggestion" text,
	"approval_required" boolean DEFAULT false NOT NULL,
	"risk_level" text NOT NULL,
	"fallback_plan" text,
	"model_route" text NOT NULL,
	"schema_version" text DEFAULT '2.0.0' NOT NULL,
	"status" text DEFAULT 'proposed' NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"rejected_by" text,
	"rejected_at" timestamp with time zone,
	"rejection_reason" text,
	"executed_at" timestamp with time zone,
	"execution_outcome" text,
	"raw_input" text,
	"raw_output" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_autonomy_modes" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_org_id" integer,
	"domain" text NOT NULL,
	"mode" text DEFAULT 'ask-to-act' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "alloy_chat_advisories" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" integer,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_chat_comparisons" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" integer,
	"prompt" text NOT NULL,
	"results" jsonb NOT NULL,
	"ratings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_chat_kb_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" integer,
	"title" text NOT NULL,
	"source_type" text NOT NULL,
	"source_url" text,
	"content" text NOT NULL,
	"chunk_index" integer DEFAULT 0 NOT NULL,
	"total_chunks" integer DEFAULT 1 NOT NULL,
	"embedding" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_browser_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_url" text NOT NULL,
	"objective" text NOT NULL,
	"status" text DEFAULT 'idle' NOT NULL,
	"actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"planned_actions" jsonb,
	"error" text,
	"duration_ms" integer,
	"started_at" timestamp,
	"completed_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "alloy_channel_audit" (
	"id" text PRIMARY KEY NOT NULL,
	"channel_type" text NOT NULL,
	"channel_id" text NOT NULL,
	"channel_name" text,
	"user_id" text,
	"user_name" text,
	"message" text,
	"skill_invoked" text,
	"workflow_id" text,
	"approval_status" text,
	"outcome" text,
	"outcome_detail" text,
	"trust_level" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_channel_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"channel_type" text DEFAULT 'slack' NOT NULL,
	"channel_id" text NOT NULL,
	"channel_name" text,
	"workspace_id" text,
	"trust_level" text DEFAULT 'standard' NOT NULL,
	"allowed_skills" jsonb DEFAULT '[]'::jsonb,
	"approval_class" text DEFAULT 'standard' NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alloy_channel_configs_type_id_unique" UNIQUE("channel_type","channel_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_daily_digests" (
	"id" text PRIMARY KEY NOT NULL,
	"digest_date" date DEFAULT CURRENT_DATE NOT NULL,
	"role_scope" text DEFAULT 'executive' NOT NULL,
	"user_id" integer,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"markdown_content" text,
	"key_decisions" jsonb DEFAULT '[]'::jsonb,
	"pending_approvals" jsonb DEFAULT '[]'::jsonb,
	"workflow_summary" jsonb DEFAULT '{}'::jsonb,
	"signals_summary" jsonb DEFAULT '{}'::jsonb,
	"metrics" jsonb DEFAULT '{}'::jsonb,
	"suggested_priorities" jsonb DEFAULT '[]'::jsonb,
	"delivery_channels" jsonb DEFAULT '["in_app"]'::jsonb,
	"delivered_at" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alloy_daily_digests_date_scope_user_unique" UNIQUE("digest_date","role_scope","user_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_email_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"action" text NOT NULL,
	"action_params" jsonb DEFAULT '{}'::jsonb,
	"priority" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_email_triage" (
	"id" text PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"sender_email" text NOT NULL,
	"sender_name" text,
	"recipient_email" text,
	"body_text" text,
	"body_html" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"ai_summary" text,
	"ai_intent" text,
	"ai_priority_score" integer DEFAULT 50,
	"auto_draft" text,
	"draft_approved" boolean DEFAULT false,
	"routed_to_workflow" text,
	"routed_at" timestamp,
	"labels" jsonb DEFAULT '[]'::jsonb,
	"alloy_signal_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_integration_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"integration_type" text NOT NULL,
	"integration_name" text NOT NULL,
	"display_name" text,
	"tenant_id" text,
	"auth_type" text DEFAULT 'webhook' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"scope" jsonb DEFAULT '[]'::jsonb,
	"approval_class" text DEFAULT 'standard' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"rate_limit_rpm" integer DEFAULT 60,
	"rate_limit_rph" integer DEFAULT 1000,
	"failure_count" integer DEFAULT 0,
	"last_failure_at" timestamp,
	"last_success_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_integration_events" (
	"id" text PRIMARY KEY NOT NULL,
	"connection_id" text NOT NULL,
	"integration_type" text NOT NULL,
	"event_type" text NOT NULL,
	"direction" text DEFAULT 'inbound' NOT NULL,
	"payload" jsonb,
	"status" text DEFAULT 'received' NOT NULL,
	"error_message" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_meeting_action_items" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"assignee" text,
	"assignee_email" text,
	"due_date" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"alloy_task_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_meeting_decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"decided_by" text,
	"impact" text,
	"rationale" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_meetings" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"meeting_date" timestamp,
	"duration_minutes" integer,
	"attendees" jsonb DEFAULT '[]'::jsonb,
	"transcript" text,
	"recording_url" text,
	"structured_notes" jsonb DEFAULT '{}'::jsonb,
	"decisions" jsonb DEFAULT '[]'::jsonb,
	"action_items" jsonb DEFAULT '[]'::jsonb,
	"follow_up_draft" text,
	"summary" text,
	"status" text DEFAULT 'processing' NOT NULL,
	"context_compiled" jsonb DEFAULT '{}'::jsonb,
	"workflow_ids" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_pending_approvals_chat" (
	"id" text PRIMARY KEY NOT NULL,
	"channel_type" text NOT NULL,
	"channel_id" text NOT NULL,
	"message_ts" text,
	"workflow_id" text,
	"approval_id" text,
	"requester_user_id" text,
	"requester_name" text,
	"action_description" text,
	"approval_class" text DEFAULT 'standard' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"review_note" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_research_spaces" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"query" text NOT NULL,
	"status" text DEFAULT 'idle' NOT NULL,
	"findings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_run_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "alloy_url_allowlist" (
	"id" text PRIMARY KEY NOT NULL,
	"pattern" text NOT NULL,
	"scope" text DEFAULT 'read' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_voice_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text,
	"transcription" text,
	"ai_summary" text,
	"detected_intent" text,
	"converted_to" text,
	"converted_id" text,
	"duration_seconds" real,
	"language" text DEFAULT 'en',
	"audio_size_bytes" integer,
	"audio_mime_type" text,
	"status" text DEFAULT 'processing' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_webhook_endpoints" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"secret" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"allowed_events" jsonb DEFAULT '["*"]'::jsonb,
	"target_skill" text,
	"target_workflow_type" text,
	"headers_to_capture" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"event_count" integer DEFAULT 0,
	"last_received_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_run_id" integer NOT NULL,
	"artifact_id" integer,
	"requested_from" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"decision" text,
	"decision_by" integer,
	"decision_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_artifacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_run_id" integer,
	"workflow_id" integer,
	"org_id" integer,
	"title" text NOT NULL,
	"artifact_type" text NOT NULL,
	"content" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"approval_status" text DEFAULT 'not_required' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"user_id" integer,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"before" jsonb,
	"after" jsonb,
	"correlation_id" text,
	"service_attribution" text,
	"admin_action_class" text,
	"ip_address" text,
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_governance_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"policy_id" integer,
	"workflow_run_id" integer,
	"severity" text DEFAULT 'medium' NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"resolution" text,
	"resolved_by" integer,
	"resolved_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_alloy_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"kind" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"rules" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"description" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"workflow_id" integer,
	"source" text NOT NULL,
	"source_type" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"status" text DEFAULT 'new' NOT NULL,
	"normalized_score" numeric(5, 2),
	"value_at_risk" numeric(15, 2),
	"metadata" jsonb,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_usage_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"workflow_run_id" integer,
	"event_type" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"model" text,
	"agent_id" text,
	"skill_slug" text,
	"cost_cents" integer DEFAULT 0 NOT NULL,
	"billed_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_workflow_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"signal_id" integer,
	"triggered_by" integer,
	"state" text DEFAULT 'queued' NOT NULL,
	"state_history" jsonb,
	"input" jsonb,
	"output" jsonb,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"duration_ms" integer,
	"queued_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"name" text NOT NULL,
	"description" text,
	"trigger" text DEFAULT 'manual' NOT NULL,
	"trigger_config" jsonb,
	"steps" jsonb,
	"output_type" text DEFAULT 'artifact' NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"approver_role" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"run_count" integer DEFAULT 0 NOT NULL,
	"last_run_at" timestamp,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_policy_test_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"studio_id" text DEFAULT 'default' NOT NULL,
	"name" text NOT NULL,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expected_outcome" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alloy_policy_test_cases_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_policy_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"studio_id" text DEFAULT 'default' NOT NULL,
	"version_number" integer NOT NULL,
	"input" text NOT NULL,
	"policy" jsonb NOT NULL,
	"author" text NOT NULL,
	"author_id" text NOT NULL,
	"message" text NOT NULL,
	"signers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"saved_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alloy_policy_versions_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_run_failure_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_runtime_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"action_id" text NOT NULL,
	"run_id" text,
	"step_id" text,
	"org_id" integer,
	"actor_id" integer,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"domain" text DEFAULT 'general' NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"is_immutable" boolean DEFAULT true NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"executed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alloy_runtime_actions_action_id_unique" UNIQUE("action_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_runtime_agent_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"version" text NOT NULL,
	"changelog" text,
	"snapshot" jsonb NOT NULL,
	"is_deployed" boolean DEFAULT false NOT NULL,
	"deployed_at" timestamp,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_runtime_agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"org_id" integer,
	"name" text NOT NULL,
	"description" text,
	"domain" text DEFAULT 'general' NOT NULL,
	"policy_tier" text DEFAULT 'internal-workflow' NOT NULL,
	"default_model" text,
	"capabilities" jsonb DEFAULT '[]'::jsonb,
	"tool_access" jsonb DEFAULT '[]'::jsonb,
	"max_cost_per_run_usd" numeric(10, 4),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alloy_runtime_agents_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_runtime_model_routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"route_id" text NOT NULL,
	"name" text NOT NULL,
	"match_tier" text,
	"match_domain" text,
	"match_task" text,
	"preferred_model_id" text,
	"fallback_model_id" text,
	"max_latency_ms" integer,
	"max_cost_usd" numeric(10, 4),
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alloy_runtime_model_routes_route_id_unique" UNIQUE("route_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_runtime_model_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"version" text NOT NULL,
	"release_notes" text,
	"snapshot" jsonb NOT NULL,
	"is_deployed" boolean DEFAULT false NOT NULL,
	"deployed_at" timestamp,
	"deprecated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_runtime_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"model_family" text,
	"context_window" integer,
	"cost_per_input_token" numeric(12, 8),
	"cost_per_output_token" numeric(12, 8),
	"avg_latency_ms" integer,
	"capabilities" jsonb DEFAULT '[]'::jsonb,
	"supported_tiers" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alloy_runtime_models_model_id_unique" UNIQUE("model_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_runtime_prompt_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"prompt_id" text NOT NULL,
	"version" text NOT NULL,
	"template" text NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb,
	"changelog" text,
	"is_deployed" boolean DEFAULT false NOT NULL,
	"deployed_at" timestamp,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_runtime_prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"prompt_id" text NOT NULL,
	"org_id" integer,
	"name" text NOT NULL,
	"description" text,
	"domain" text DEFAULT 'general' NOT NULL,
	"template" text NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alloy_runtime_prompts_prompt_id_unique" UNIQUE("prompt_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_runtime_signal_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"signal_id" text NOT NULL,
	"scorer_model" text,
	"normalized_score" numeric(5, 4),
	"urgency_score" numeric(5, 4),
	"confidence_score" numeric(5, 4),
	"impact_score" numeric(5, 4),
	"reasoning" text,
	"scored_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_runtime_signal_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"org_id" integer,
	"name" text NOT NULL,
	"description" text,
	"source_type" text DEFAULT 'api' NOT NULL,
	"domain" text DEFAULT 'general' NOT NULL,
	"endpoint" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alloy_runtime_signal_sources_source_id_unique" UNIQUE("source_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_runtime_signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"signal_id" text NOT NULL,
	"org_id" integer,
	"domain" text DEFAULT 'general' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"severity" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alloy_runtime_signals_signal_id_unique" UNIQUE("signal_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_runtime_workflow_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"workflow_id" text NOT NULL,
	"org_id" integer,
	"initiated_by" integer,
	"execution_mode" text DEFAULT 'manual' NOT NULL,
	"status" text DEFAULT 'pending_approval' NOT NULL,
	"is_dry_run" boolean DEFAULT false NOT NULL,
	"is_simulation" boolean DEFAULT false NOT NULL,
	"current_step_index" integer DEFAULT 0 NOT NULL,
	"approval_state" text DEFAULT 'none' NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"steps" jsonb DEFAULT '[]'::jsonb,
	"audit_trail" jsonb DEFAULT '[]'::jsonb,
	"policy_evaluation" jsonb,
	"trace_id" text,
	"recommendation_id" text,
	"estimated_cost_usd" numeric(10, 4),
	"actual_cost_usd" numeric(10, 4),
	"error_message" text,
	"output" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alloy_runtime_workflow_runs_run_id_unique" UNIQUE("run_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_runtime_workflow_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"step_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"handler" text NOT NULL,
	"step_order" integer DEFAULT 0 NOT NULL,
	"execution_mode" text DEFAULT 'manual' NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"approver_role" text,
	"parameters" jsonb DEFAULT '{}'::jsonb,
	"rollback_handler" text,
	"timeout_ms" integer,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_runtime_workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"org_id" integer,
	"name" text NOT NULL,
	"description" text,
	"domain" text DEFAULT 'general' NOT NULL,
	"execution_mode" text DEFAULT 'manual' NOT NULL,
	"policy_tier" text,
	"steps_definition" jsonb DEFAULT '[]'::jsonb,
	"rollback_policy" text DEFAULT 'step' NOT NULL,
	"requires_explicit_approval" boolean DEFAULT true NOT NULL,
	"is_dry_run_capable" boolean DEFAULT true NOT NULL,
	"estimated_cost_usd" numeric(10, 4),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alloy_runtime_workflows_workflow_id_unique" UNIQUE("workflow_id")
);
--> statement-breakpoint
CREATE TABLE "inference_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"model" text NOT NULL,
	"agent_id" text,
	"action" text DEFAULT 'inference' NOT NULL,
	"entity_type" text DEFAULT 'llm-call' NOT NULL,
	"entity_id" text,
	"actor" text DEFAULT 'system' NOT NULL,
	"platform" text DEFAULT 'Internal' NOT NULL,
	"confidence" numeric(5, 4),
	"latency_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_anomalies" (
	"id" serial PRIMARY KEY NOT NULL,
	"anomaly_id" text NOT NULL,
	"metric_id" text NOT NULL,
	"domain" text NOT NULL,
	"anomaly_type" text NOT NULL,
	"severity" "analytics_anomaly_severity" NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"observed_value" real NOT NULL,
	"expected_value" real NOT NULL,
	"deviation_percent" real NOT NULL,
	"z_score" real,
	"context" jsonb DEFAULT '{}'::jsonb,
	"potential_causes" jsonb DEFAULT '[]'::jsonb,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp with time zone,
	"is_suppressed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "analytics_anomalies_anomaly_id_unique" UNIQUE("anomaly_id")
);
--> statement-breakpoint
CREATE TABLE "analytics_attribution_outcomes" (
	"id" serial PRIMARY KEY NOT NULL,
	"journey_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"domain" text NOT NULL,
	"outcome_type" text NOT NULL,
	"outcome_value" real,
	"occurred_at" timestamp with time zone NOT NULL,
	"attribution_computed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_attribution_touchpoints" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "analytics_attribution_touchpoints_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"journey_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"domain" text NOT NULL,
	"touchpoint_type" text NOT NULL,
	"channel" text,
	"content" text,
	"campaign_id" text,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"position" integer NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_cohort_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"cohort_id" text NOT NULL,
	"domain" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"entity_type" text NOT NULL,
	"entry_conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"entry_event_name" text,
	"analysis_type" text DEFAULT 'retention' NOT NULL,
	"window_days" integer DEFAULT 30 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "analytics_cohort_definitions_cohort_id_unique" UNIQUE("cohort_id")
);
--> statement-breakpoint
CREATE TABLE "analytics_dashboards" (
	"id" serial PRIMARY KEY NOT NULL,
	"dashboard_id" text NOT NULL,
	"domain" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"layout" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"default_time_range" text DEFAULT '7d' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "analytics_dashboards_dashboard_id_unique" UNIQUE("dashboard_id")
);
--> statement-breakpoint
CREATE TABLE "analytics_events_cold" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "analytics_events_cold_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"event_id" text NOT NULL,
	"event_name" text NOT NULL,
	"domain" text NOT NULL,
	"source_app" text NOT NULL,
	"session_id" text,
	"user_id" text,
	"organization_id" integer,
	"tenant_id" text,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"dimensions" jsonb DEFAULT '{}'::jsonb,
	"occurred_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"archived_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archive_batch" text,
	CONSTRAINT "analytics_events_cold_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "analytics_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"event_id" text NOT NULL,
	"event_name" text NOT NULL,
	"domain" text NOT NULL,
	"source_app" text NOT NULL,
	"session_id" text,
	"user_id" text,
	"organization_id" integer,
	"tenant_id" text,
	"device_type" text,
	"platform" text,
	"url" text,
	"referrer" text,
	"user_agent" text,
	"ip_hash" text,
	"country" text,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"dimensions" jsonb DEFAULT '{}'::jsonb,
	"numeric_value" real,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"server_side" boolean DEFAULT false NOT NULL,
	CONSTRAINT "analytics_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "analytics_export_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"export_id" text NOT NULL,
	"domain" text NOT NULL,
	"export_type" text NOT NULL,
	"format" text DEFAULT 'csv' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"filter_params" jsonb DEFAULT '{}'::jsonb,
	"row_count" integer,
	"file_size_bytes" bigint,
	"download_token" text,
	"expires_at" timestamp with time zone,
	"error_message" text,
	"schedule_frequency" text DEFAULT 'once' NOT NULL,
	"next_run_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"triggered_by_user_id" integer,
	"webhook_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "analytics_export_jobs_export_id_unique" UNIQUE("export_id")
);
--> statement-breakpoint
CREATE TABLE "analytics_funnel_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"funnel_id" text NOT NULL,
	"domain" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"window_hours" integer DEFAULT 168 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "analytics_funnel_definitions_funnel_id_unique" UNIQUE("funnel_id")
);
--> statement-breakpoint
CREATE TABLE "analytics_metric_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_id" text NOT NULL,
	"domain" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"calculation_type" text NOT NULL,
	"event_name" text,
	"numeric_field" text,
	"filter_conditions" jsonb DEFAULT '[]'::jsonb,
	"dimensions" jsonb DEFAULT '[]'::jsonb,
	"unit" text,
	"granularities" jsonb DEFAULT '["hour","day","week","month"]'::jsonb,
	"visualization_type" text DEFAULT 'line' NOT NULL,
	"threshold_warning" real,
	"threshold_critical" real,
	"threshold_direction" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "analytics_metric_definitions_metric_id_unique" UNIQUE("metric_id")
);
--> statement-breakpoint
CREATE TABLE "analytics_metric_snapshots" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "analytics_metric_snapshots_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"metric_id" text NOT NULL,
	"granularity" "analytics_granularity" NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"value" real NOT NULL,
	"sample_count" integer DEFAULT 0 NOT NULL,
	"dimensions" jsonb DEFAULT '{}'::jsonb,
	"domain" text NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"org_id" integer,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"scopes" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "approval_audit_trail" (
	"id" serial PRIMARY KEY NOT NULL,
	"approval_id" integer NOT NULL,
	"org_id" integer,
	"actor_id" integer,
	"actor_role" text,
	"action" text NOT NULL,
	"from_status" text,
	"to_status" text,
	"note" text,
	"correlation_id" text,
	"service_attribution" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"approval_id" integer NOT NULL,
	"org_id" integer,
	"author_id" integer,
	"author_role" text,
	"body" text NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"action_class" text DEFAULT 'general' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_by_id" integer,
	"requested_by_role" text,
	"assigned_approver_id" integer,
	"required_approver_role" text,
	"approved_by_id" integer,
	"approved_at" timestamp,
	"rejected_by_id" integer,
	"rejected_at" timestamp,
	"escalated_at" timestamp,
	"escalated_to_id" integer,
	"escalation_reason" text,
	"expires_at" timestamp,
	"correlation_id" text,
	"service_attribution" text,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apps_registry" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"color" text,
	"status" text DEFAULT 'coming_soon' NOT NULL,
	"version" text DEFAULT '0.1.0' NOT NULL,
	"config" jsonb,
	"owner_team" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "apps_registry_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "atlas_artifacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"template_type" text NOT NULL,
	"domain" text DEFAULT 'general' NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"parent_artifact_id" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb,
	"sections" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"proof_chain_id" integer,
	"outcome_graph_id" integer,
	"correlation_id" text,
	"generated_by" text,
	"generated_by_user_id" integer,
	"reviewed_by_user_id" integer,
	"reviewed_at" timestamp,
	"approved_by_user_id" integer,
	"approved_at" timestamp,
	"expires_at" timestamp,
	"is_latest" boolean DEFAULT true NOT NULL,
	"share_token" text,
	"share_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atlas_export_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"artifact_id" integer NOT NULL,
	"format" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"file_url" text,
	"file_size_bytes" integer,
	"error_message" text,
	"requested_by_user_id" integer,
	"started_at" timestamp,
	"completed_at" timestamp,
	"expires_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atlas_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" text NOT NULL,
	"workflow_id" text NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"source" text NOT NULL,
	"captured_by" text NOT NULL,
	"immutable" boolean DEFAULT false NOT NULL,
	"tenant_id" text,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atlas_outcomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" text NOT NULL,
	"workflow_id" text NOT NULL,
	"signal_id" text,
	"recommendation_id" text,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"status" text NOT NULL,
	"financial_impact_usd" real,
	"operational_severity" text,
	"entities_affected" integer,
	"recorded_by" text NOT NULL,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"tenant_id" text,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atlas_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" text NOT NULL,
	"workflow_id" text NOT NULL,
	"workflow_name" text NOT NULL,
	"trigger_signal_id" text,
	"replayable" boolean DEFAULT true NOT NULL,
	"signal_snapshot" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"run_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"latency_ms" integer,
	"steps_completed" integer,
	"steps_failed" integer,
	"policy_checks" integer,
	"policies_blocked" integer,
	"evidence_count" integer,
	"tenant_id" text,
	"snapshot_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "atlas_runs_workflow_id_unique" UNIQUE("workflow_id")
);
--> statement-breakpoint
CREATE TABLE "atlas_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" text NOT NULL,
	"signal_type" text NOT NULL,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"source" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'raw' NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"workflow_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "digital_twins" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" integer,
	"entity_id" text NOT NULL,
	"entity_name" text NOT NULL,
	"twin_type" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"current_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"predicted_states" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"alerts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"confidence_score" real DEFAULT 0.5 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drift_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"twin_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"twin_category" text NOT NULL,
	"current_snapshot_id" integer,
	"approved_snapshot_id" integer,
	"drift_status" text DEFAULT 'stable' NOT NULL,
	"drift_score" real DEFAULT 0 NOT NULL,
	"divergent_fields" jsonb DEFAULT '[]'::jsonb,
	"trusted_source_deltas" jsonb DEFAULT '[]'::jsonb,
	"confidence_downgrade_reason" text,
	"original_confidence" real,
	"adjusted_confidence" real,
	"blocked_reason" text,
	"assessed_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenario_branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"branch_id" text NOT NULL,
	"twin_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"twin_category" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"baseline_snapshot_id" integer,
	"branch_snapshot_id" integer,
	"parameters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"delta_metrics" jsonb DEFAULT '{}'::jsonb,
	"risk_assessment" text,
	"recommended_actions" jsonb DEFAULT '[]'::jsonb,
	"confidence_score" real DEFAULT 0.5 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"proof_chain_id" integer,
	"correlation_id" text,
	"created_by_user_id" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scenario_branches_branch_id_unique" UNIQUE("branch_id")
);
--> statement-breakpoint
CREATE TABLE "scene_memory_index" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"twin_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"twin_category" text NOT NULL,
	"snapshot_id" integer,
	"overlap_score" real DEFAULT 0 NOT NULL,
	"recency_score" real DEFAULT 0 NOT NULL,
	"trust_weight" real DEFAULT 0.7 NOT NULL,
	"causal_relevance_score" real DEFAULT 0 NOT NULL,
	"composite_rank_score" real DEFAULT 0 NOT NULL,
	"retrieval_tags" jsonb DEFAULT '[]'::jsonb,
	"spatial_overlap" jsonb DEFAULT '{}'::jsonb,
	"causal_links" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"indexed_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "spatial_twin_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"twin_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"twin_category" text NOT NULL,
	"sequence_number" integer DEFAULT 0 NOT NULL,
	"state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"predicted_states" jsonb DEFAULT '[]'::jsonb,
	"alerts" jsonb DEFAULT '[]'::jsonb,
	"confidence_score" real DEFAULT 0.5 NOT NULL,
	"parent_snapshot_id" integer,
	"derived_branch_id" text,
	"proof_chain_id" integer,
	"model_lane" text,
	"prompt_hash" text,
	"rendered_artifact_hash" text,
	"source_evidence_list" jsonb DEFAULT '[]'::jsonb,
	"coordinates" jsonb,
	"spatial_context" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"snapshot_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "twin_simulation_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"twin_id" text NOT NULL,
	"scenario_name" text NOT NULL,
	"scenario_parameters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"original_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"simulated_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"delta_metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"risk_assessment" text,
	"recommended_actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"confidence_score" real DEFAULT 0.5 NOT NULL,
	"monte_carlo_result" jsonb,
	"run_duration_ms" integer,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worldline_signal_overlays" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"overlay_id" text NOT NULL,
	"signal_type" text NOT NULL,
	"source_id" integer,
	"source_trust_class" text DEFAULT 'inferred' NOT NULL,
	"signal_timestamp" timestamp NOT NULL,
	"expires_at" timestamp,
	"coordinates" jsonb,
	"bounding_region" jsonb,
	"affected_entity_ids" jsonb DEFAULT '[]'::jsonb,
	"affected_twin_categories" jsonb DEFAULT '[]'::jsonb,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"confidence_score" real DEFAULT 0.7 NOT NULL,
	"causal_linkage" jsonb DEFAULT '[]'::jsonb,
	"severity" text DEFAULT 'info' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "worldline_signal_overlays_overlay_id_unique" UNIQUE("overlay_id")
);
--> statement-breakpoint
CREATE TABLE "audit_chain_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"actor_user_id" integer,
	"actor_label" text NOT NULL,
	"action" text NOT NULL,
	"action_type" text NOT NULL,
	"domain" text NOT NULL,
	"entity_id" text,
	"entity_type" text,
	"risk_level" text DEFAULT 'low' NOT NULL,
	"compliance_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"outcome" text DEFAULT 'success' NOT NULL,
	"details" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"prev_hash" text DEFAULT 'genesis' NOT NULL,
	"event_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"site_id" integer,
	"actor_user_id" integer,
	"action_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"payload_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "biometric_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"nonce" text NOT NULL,
	"used_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "biometric_challenges_nonce_unique" UNIQUE("nonce")
);
--> statement-breakpoint
CREATE TABLE "device_biometric_bindings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"device_id" text NOT NULL,
	"binding_token" text NOT NULL,
	"device_name" text,
	"platform" text,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_reason" text,
	CONSTRAINT "device_biometric_bindings_binding_token_unique" UNIQUE("binding_token")
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"ip_address" text,
	"success" boolean DEFAULT false NOT NULL,
	"failure_reason" text,
	"device_fingerprint_hash" text,
	"risk_score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magic_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "magic_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "mfa_secrets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"secret" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"enabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"session_version" integer DEFAULT 1 NOT NULL,
	"refresh_token" text,
	"refresh_token_expires_at" timestamp,
	"refresh_token_used_at" timestamp,
	"replaced_by_session_id" integer,
	"revoked_at" timestamp,
	"revoked_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token"),
	CONSTRAINT "sessions_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE "step_up_assertions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"session_token" text NOT NULL,
	"binding_id" integer,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "step_up_assertions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"fingerprint_hash" text NOT NULL,
	"user_agent" text,
	"display_name" text,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_ip_hash" text,
	"is_trusted" boolean DEFAULT false NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"replit_id" text,
	"email" text,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"bio" text,
	"platform_role" text,
	"team" text,
	"password_hash" text,
	"email_verification_token" text,
	"email_verification_token_expires_at" timestamp with time zone,
	"email_verified_at" timestamp with time zone,
	"password_reset_token" text,
	"password_reset_token_expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"session_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_replit_id_unique" UNIQUE("replit_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_email_verification_token_unique" UNIQUE("email_verification_token"),
	CONSTRAINT "users_password_reset_token_unique" UNIQUE("password_reset_token")
);
--> statement-breakpoint
CREATE TABLE "azure_tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"azure_tenant_id" text NOT NULL,
	"display_name" text NOT NULL,
	"domain" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_consent_granted" text DEFAULT 'pending' NOT NULL,
	"organization_id" integer,
	"config" jsonb DEFAULT '{}',
	"provisioned_at" timestamp,
	"provisioned_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "azure_tenants_azure_tenant_id_unique" UNIQUE("azure_tenant_id")
);
--> statement-breakpoint
CREATE TABLE "dataverse_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"azure_tenant_id" text NOT NULL,
	"org_url" text NOT NULL,
	"org_name" text,
	"auth_method" text DEFAULT 'client_credentials' NOT NULL,
	"client_id" text,
	"client_secret" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"sync_config" jsonb DEFAULT '{}',
	"last_sync_at" timestamp,
	"last_sync_status" text,
	"last_sync_error" text,
	"entity_sync_counts" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_branding" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"company_name" text,
	"tagline" text,
	"logo_url" text,
	"favicon_url" text,
	"primary_color" text,
	"accent_color" text,
	"sidebar_header_text" text,
	"custom_domain_label" text,
	"email_from_name" text,
	"email_footer_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_branding_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "billing_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"actor_id" integer,
	"actor_email" text,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resource_id" text,
	"before" jsonb,
	"after" jsonb,
	"stripe_event_id" text,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_invoice_id" text,
	"idempotency_key" text,
	"ip_address" text,
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"stripe_payment_method_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"type" text DEFAULT 'card' NOT NULL,
	"brand" text,
	"last4" text,
	"exp_month" integer,
	"exp_year" integer,
	"is_default" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_payment_methods_stripe_pm_id_unique" UNIQUE("stripe_payment_method_id")
);
--> statement-breakpoint
CREATE TABLE "billing_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"price_monthly" numeric(10, 2) NOT NULL,
	"price_yearly" numeric(10, 2),
	"features" jsonb,
	"stripe_price_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "billing_rail_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"rail" text DEFAULT 'card' NOT NULL,
	"external_account_id" text,
	"account_label" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_refund_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"stripe_charge_id" text,
	"stripe_refund_id" text,
	"stripe_payment_intent_id" text,
	"amount" numeric(10, 2),
	"currency" text DEFAULT 'usd' NOT NULL,
	"reason" text DEFAULT 'requested_by_customer' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_by" integer,
	"approved_by" integer,
	"notes" text,
	"idempotency_key" text,
	"metadata" jsonb,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_refund_requests_org_idempotency_key" UNIQUE("org_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "billing_tax_calculations" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"stripe_invoice_id" text,
	"stripe_tax_calculation_id" text,
	"tax_amount_exclusive" numeric(10, 2),
	"tax_amount_inclusive" numeric(10, 2),
	"currency" text DEFAULT 'usd' NOT NULL,
	"jurisdiction" text,
	"tax_type" text,
	"tax_rate" numeric(6, 4),
	"input_snapshot" jsonb,
	"basis_amount" numeric(10, 2),
	"exemption_applied" text,
	"source" text DEFAULT 'stripe_tax' NOT NULL,
	"reverse_charge" boolean DEFAULT false NOT NULL,
	"override_reason" text,
	"tamper_hash" text,
	"metadata" jsonb,
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"stripe_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	"org_id" integer,
	"status" text DEFAULT 'processing' NOT NULL,
	"error_message" text,
	"metadata" jsonb,
	CONSTRAINT "billing_webhook_events_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
CREATE TABLE "entitlement_overrides" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"feature_key" text NOT NULL,
	"granted" boolean DEFAULT true NOT NULL,
	"reason" text,
	"granted_by" integer,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entitlements" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"feature_key" text NOT NULL,
	"feature_name" text NOT NULL,
	"type" text DEFAULT 'boolean' NOT NULL,
	"limit_value" integer,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fulfillments" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"stripe_session_id" text,
	"stripe_payment_intent_id" text,
	"product" text NOT NULL,
	"tier_id" text NOT NULL,
	"tier_name" text NOT NULL,
	"customer_email" text,
	"amount" numeric(10, 2),
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"metadata" jsonb,
	"fulfilled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fulfillments_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"subscription_id" integer,
	"stripe_invoice_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"paid_at" timestamp,
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_credits" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"subscription_id" integer,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"type" text DEFAULT 'refund_partial' NOT NULL,
	"source_refund_id" integer,
	"applied_to_invoice_id" integer,
	"created_by" integer,
	"note" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"stripe_subscription_id" text,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"canceled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_category_overrides" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"scope" text NOT NULL,
	"scope_ref" text NOT NULL,
	"jurisdiction" text NOT NULL,
	"tax_behavior" text DEFAULT 'taxable' NOT NULL,
	"tax_code" text,
	"tax_rate" numeric(6, 4),
	"reason_code" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"applied_by" integer,
	"expires_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_exemption_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"certificate_number" text,
	"jurisdiction" text NOT NULL,
	"exemption_type" text DEFAULT 'resale' NOT NULL,
	"file_url" text,
	"issued_at" timestamp,
	"expires_at" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_ids" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"tax_id_type" text NOT NULL,
	"tax_id_value" text NOT NULL,
	"jurisdiction" text NOT NULL,
	"validated_at" timestamp,
	"validation_status" text DEFAULT 'pending' NOT NULL,
	"validation_response" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"feature_key" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"metadata" jsonb,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "net30_aging_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"snapshot_date" timestamp NOT NULL,
	"current" numeric(14, 2) DEFAULT '0' NOT NULL,
	"bucket_1_30" numeric(14, 2) DEFAULT '0' NOT NULL,
	"bucket_31_60" numeric(14, 2) DEFAULT '0' NOT NULL,
	"bucket_61_90" numeric(14, 2) DEFAULT '0' NOT NULL,
	"bucket_90_plus" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_outstanding" numeric(14, 2) DEFAULT '0' NOT NULL,
	"invoice_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "net30_credit_memos" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"org_id" integer NOT NULL,
	"memo_number" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"reason" text DEFAULT 'other' NOT NULL,
	"description" text,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "net30_dunning_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"cadence_days" jsonb DEFAULT '[3,7,14,21]'::jsonb NOT NULL,
	"template_name" text DEFAULT 'standard_reminder' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "net30_dunning_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"org_id" integer NOT NULL,
	"step" integer NOT NULL,
	"days_overdue" integer NOT NULL,
	"recipient" text NOT NULL,
	"template" text DEFAULT 'standard_reminder' NOT NULL,
	"subject" text,
	"success" boolean DEFAULT false NOT NULL,
	"error" text,
	"message_id" text,
	"dispatched_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "net30_invoice_line_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"description" text NOT NULL,
	"product_code" text,
	"quantity" numeric(12, 4) DEFAULT '1' NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"line_total" numeric(14, 2) NOT NULL,
	"taxable" boolean DEFAULT false NOT NULL,
	"tax_category" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "net30_invoice_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"method" text DEFAULT 'stripe' NOT NULL,
	"reference" text,
	"stripe_payment_intent_id" text,
	"stripe_charge_id" text,
	"paid_at" timestamp NOT NULL,
	"recorded_by" integer,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "net30_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"invoice_number" text NOT NULL,
	"external_customer_id" text,
	"customer_name" text NOT NULL,
	"customer_email" text,
	"terms" text DEFAULT 'NET-30' NOT NULL,
	"custom_terms_days" integer,
	"po_number" text,
	"billing_address" jsonb,
	"shipping_address" jsonb,
	"subtotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"discount_percent" numeric(5, 2),
	"tax_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"paid_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"credit_applied" numeric(14, 2) DEFAULT '0' NOT NULL,
	"outstanding_balance" numeric(14, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"due_date" timestamp,
	"issued_date" timestamp,
	"sent_at" timestamp,
	"paid_at" timestamp,
	"stripe_invoice_id" text,
	"stripe_hosted_invoice_url" text,
	"stripe_pdf_url" text,
	"dunning_enabled" boolean DEFAULT true NOT NULL,
	"dunning_paused_at" timestamp,
	"last_dunning_at" timestamp,
	"next_dunning_at" timestamp,
	"dunning_step" integer DEFAULT 0 NOT NULL,
	"collections_at" timestamp,
	"collections_packet_url" text,
	"notes" text,
	"internal_notes" text,
	"attachments" jsonb,
	"approved_by" integer,
	"approved_at" timestamp,
	"sent_by" integer,
	"metadata" jsonb,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"signal_id" integer,
	"product" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"action_type" text DEFAULT 'manual' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"assigned_to" integer,
	"owner_id" integer,
	"due_at" timestamp,
	"completed_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"product" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"requested_by" integer,
	"approver_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"decision" text,
	"decided_at" timestamp,
	"expires_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artifacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"signal_id" integer,
	"workflow_run_id" integer,
	"product" text NOT NULL,
	"name" text NOT NULL,
	"artifact_type" text DEFAULT 'report' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"generated_by" integer,
	"approved_by" integer,
	"url" text,
	"mime_type" text,
	"size_bytes" integer,
	"content" text,
	"metadata" jsonb,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"product" text,
	"actor_id" integer,
	"actor_name" text,
	"event_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"before" jsonb,
	"after" jsonb,
	"metadata" jsonb,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'platform' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "readiness_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"product" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'not_started' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"score" numeric(5, 2),
	"target_score" numeric(5, 2) DEFAULT '100',
	"owner_id" integer,
	"due_at" timestamp,
	"completed_at" timestamp,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"user_id" integer,
	"product" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"filters" jsonb,
	"columns" jsonb,
	"sort_by" text,
	"sort_order" text DEFAULT 'desc',
	"is_default" boolean DEFAULT false NOT NULL,
	"is_shared" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"workflow_id" integer NOT NULL,
	"signal_id" integer,
	"status" text DEFAULT 'queued' NOT NULL,
	"triggered_by" integer,
	"input" jsonb,
	"output" jsonb,
	"step_results" jsonb DEFAULT '[]'::jsonb,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"product" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"trigger_type" text DEFAULT 'manual' NOT NULL,
	"trigger_config" jsonb,
	"steps" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"owner_id" integer,
	"run_count" integer DEFAULT 0 NOT NULL,
	"last_run_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cap_table_placeholders" (
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
--> statement-breakpoint
CREATE TABLE "capital_artifacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"artifact_type" text DEFAULT 'other' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"owned_by" text,
	"notes" text,
	"file_url" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "capital_artifacts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "diligence_checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"checklist_id" integer NOT NULL,
	"item_key" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"is_required" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"artifact_id" integer,
	"artifact_url" text,
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diligence_checklists" (
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
--> statement-breakpoint
CREATE TABLE "financial_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"model_type" text DEFAULT '12_month_operating' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"assumptions" text,
	"notes" text,
	"artifact_id" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fundraising_milestones" (
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
--> statement-breakpoint
CREATE TABLE "investor_packet_deliverables" (
	"id" serial PRIMARY KEY NOT NULL,
	"packet_id" integer NOT NULL,
	"deliverable_key" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'not_started' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"content" text,
	"artifact_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investor_packets" (
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
--> statement-breakpoint
CREATE TABLE "lender_packet_deliverables" (
	"id" serial PRIMARY KEY NOT NULL,
	"packet_id" integer NOT NULL,
	"deliverable_key" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'not_started' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"content" text,
	"artifact_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lender_packets" (
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
--> statement-breakpoint
CREATE TABLE "use_of_funds_versions" (
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
--> statement-breakpoint
CREATE TABLE "carlota_advisory_clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"name" text NOT NULL,
	"industry" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "carlota_advisory_clients_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "carlota_client_competitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_external_id" text NOT NULL,
	"name" text NOT NULL,
	"score" integer DEFAULT 50 NOT NULL,
	"trend" text DEFAULT 'flat' NOT NULL,
	"share" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carlota_client_margin_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_external_id" text NOT NULL,
	"month" text NOT NULL,
	"margin" real DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carlota_client_market_trend" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_external_id" text NOT NULL,
	"month" text NOT NULL,
	"you" integer DEFAULT 0 NOT NULL,
	"market" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carlota_client_radar_signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_external_id" text NOT NULL,
	"competitor" text NOT NULL,
	"event" text NOT NULL,
	"impact" text DEFAULT 'medium' NOT NULL,
	"direction" text DEFAULT 'neutral' NOT NULL,
	"signal_date" text DEFAULT '' NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carlota_client_roi_benchmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_external_id" text NOT NULL,
	"avg_roi" integer DEFAULT 0 NOT NULL,
	"avg_payback_months" integer DEFAULT 0 NOT NULL,
	"avg_rate_realisation_pct" integer DEFAULT 100 NOT NULL,
	"blended_margin_pct" integer DEFAULT 0 NOT NULL,
	"client_retention_pct" integer DEFAULT 0 NOT NULL,
	"nps_score" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "carlota_client_roi_benchmarks_client_external_id_unique" UNIQUE("client_external_id")
);
--> statement-breakpoint
CREATE TABLE "carlota_client_roi_trend" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_external_id" text NOT NULL,
	"month" text NOT NULL,
	"avg_roi" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"display_name" text NOT NULL,
	"primary_contact_user_id" integer,
	"status" text DEFAULT 'onboarding' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"client_account_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_url" text,
	"file_type" text,
	"visibility" text DEFAULT 'client' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"client_account_id" integer NOT NULL,
	"sender_user_id" integer,
	"subject" text,
	"body_richtext" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"client_account_id" integer NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"body_richtext" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carlota_chat_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"name" text,
	"email" text,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"qualification_score" integer DEFAULT 0 NOT NULL,
	"signals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"qualified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "carlota_chat_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "carlota_client_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text,
	"phone" text,
	"industry" text,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carlota_diagnostics" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"organization_id" integer,
	"client_account_id" integer,
	"created_by_user_id" integer,
	"company_name" text NOT NULL,
	"industry" text DEFAULT '' NOT NULL,
	"stage" text DEFAULT '' NOT NULL,
	"report" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "carlota_diagnostics_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "carlota_engagements" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"organization_id" integer,
	"client_account_id" integer,
	"created_by_user_id" integer,
	"client" text NOT NULL,
	"engagement" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"fee_type" text DEFAULT 'fixed' NOT NULL,
	"contracted_value" numeric(12, 2) DEFAULT '0' NOT NULL,
	"invoiced" numeric(12, 2) DEFAULT '0' NOT NULL,
	"collected" numeric(12, 2) DEFAULT '0' NOT NULL,
	"cost_to_date" numeric(12, 2) DEFAULT '0' NOT NULL,
	"forecasted_cost" numeric(12, 2) DEFAULT '0' NOT NULL,
	"margin_target" integer DEFAULT 40 NOT NULL,
	"phase" text DEFAULT '' NOT NULL,
	"rate_realisation_pct" integer DEFAULT 100 NOT NULL,
	"write_offs" numeric(12, 2) DEFAULT '0' NOT NULL,
	"scope_creep_hours" integer DEFAULT 0 NOT NULL,
	"start_date" text DEFAULT '' NOT NULL,
	"end_date" text DEFAULT '' NOT NULL,
	"alerts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "carlota_engagements_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "carlota_experts" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"created_by_user_id" integer,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"tier" text DEFAULT 'specialist' NOT NULL,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"industries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"availability" text DEFAULT 'available' NOT NULL,
	"day_rate" integer DEFAULT 0 NOT NULL,
	"rating" numeric(3, 1) DEFAULT '5.0' NOT NULL,
	"engagements" integer DEFAULT 0 NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"recent_work" text,
	"is_seeded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carlota_inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text,
	"phone" text,
	"service" text,
	"message" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carlota_knowledge_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"created_by_user_id" integer,
	"type" text DEFAULT 'framework' NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"industries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"engagements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"uses" integer DEFAULT 0 NOT NULL,
	"rating" numeric(3, 1) DEFAULT '4.5' NOT NULL,
	"last_updated" text DEFAULT '' NOT NULL,
	"author" text DEFAULT 'Carlota Jo' NOT NULL,
	"is_seeded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carlota_proposal_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"created_by_user_id" integer,
	"client_external_id" text,
	"title" text NOT NULL,
	"prospect_name" text DEFAULT '' NOT NULL,
	"prospect_company" text DEFAULT '' NOT NULL,
	"template" text DEFAULT 'standard' NOT NULL,
	"form_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"generated_proposal" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carlota_radar_competitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"user_id" integer,
	"client_id" text,
	"competitors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carlota_radar_notif_prefs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"organization_id" integer,
	"enabled" boolean DEFAULT true NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"email" text,
	"frequency" text DEFAULT 'instant' NOT NULL,
	"competitors" jsonb DEFAULT 'null'::jsonb,
	"pending_digest" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_digest_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "carlota_radar_notif_prefs_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "carlota_radar_seen_signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"signal_hash" text NOT NULL,
	"competitor" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carlota_reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"confirmation_id" text NOT NULL,
	"service" text NOT NULL,
	"tier" text NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text,
	"phone" text,
	"notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"amount" numeric(10, 2),
	"currency" text DEFAULT 'USD',
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "carlota_reservations_confirmation_id_unique" UNIQUE("confirmation_id")
);
--> statement-breakpoint
CREATE TABLE "carlota_scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"organization_id" integer,
	"client_account_id" integer,
	"created_by_user_id" integer,
	"label" text NOT NULL,
	"details" text DEFAULT '' NOT NULL,
	"context" text,
	"result" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "carlota_scenarios_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "carlota_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"summary" text,
	"description" text,
	"icon" text,
	"category" text,
	"capabilities" jsonb,
	"is_active" text DEFAULT 'true',
	"sort_order" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "carlota_services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "carlota_team_members" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allocations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"utilisation" integer DEFAULT 0 NOT NULL,
	"capacity" integer DEFAULT 100 NOT NULL,
	"status" text DEFAULT 'optimal' NOT NULL,
	"day_rate" integer DEFAULT 0 NOT NULL,
	"is_seeded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carlota_invoice_email_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"recipient" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"message_id" text
);
--> statement-breakpoint
CREATE TABLE "carlota_invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"client" text NOT NULL,
	"engagement" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"due_date" text NOT NULL,
	"issued_date" text NOT NULL,
	"items" integer DEFAULT 0 NOT NULL,
	"entry_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sent_at" timestamp,
	"sent_to" text,
	"last_send_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carlota_time_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"engagement" text NOT NULL,
	"phase" text NOT NULL,
	"deliverable" text NOT NULL,
	"hours" numeric(6, 2) NOT NULL,
	"rate_type" text NOT NULL,
	"rate" integer DEFAULT 0 NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"billable" boolean DEFAULT true NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"invoice_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_artifacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"task_id" integer,
	"title" text NOT NULL,
	"artifact_type" text DEFAULT 'other' NOT NULL,
	"status" text DEFAULT 'needed' NOT NULL,
	"file_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certification_calendar" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer,
	"title" text NOT NULL,
	"event_type" text DEFAULT 'other' NOT NULL,
	"event_date" timestamp NOT NULL,
	"reminder_days" integer DEFAULT 14 NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certification_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"slug" text NOT NULL,
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
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "certification_programs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "certification_requirements" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "certification_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "certification_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"requirement_id" integer,
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
--> statement-breakpoint
CREATE TABLE "legal_review_checkpoints" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer,
	"task_id" integer,
	"title" text NOT NULL,
	"description" text,
	"review_type" text DEFAULT 'attorney' NOT NULL,
	"trigger_condition" text,
	"is_mandatory" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewer_name" text,
	"scheduled_at" timestamp,
	"completed_at" timestamp,
	"outcome_notes" text,
	"legal_disclaimer_acknowledged" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "naics_code_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"naics_code" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"business_line" text,
	"is_set_aside_eligible" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "naics_code_mapping_naics_code_unique" UNIQUE("naics_code")
);
--> statement-breakpoint
CREATE TABLE "opportunity_pipeline" (
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
--> statement-breakpoint
CREATE TABLE "procurement_contacts" (
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
--> statement-breakpoint
CREATE TABLE "change_events" (
	"cursor" bigserial PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"actor_id" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"delta" jsonb NOT NULL,
	"crdt_clock" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"app_source" text
);
--> statement-breakpoint
CREATE TABLE "changelog_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"title" text NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"category" text DEFAULT 'feature' NOT NULL,
	"body" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"published" text DEFAULT 'true' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"body_richtext_or_mdx" text,
	"author_name" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"cover_image_url" text,
	"meta_title" text,
	"meta_description" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_studies" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"challenge" text,
	"approach" text,
	"outcome" text,
	"takeaway" text,
	"cover_image_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text,
	"excerpt" text,
	"content_type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"featured_image" text,
	"meta_description" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cms_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "contact_submission_replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_submission_id" integer NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"sent_by" text DEFAULT 'Admin' NOT NULL,
	"email_success" boolean DEFAULT true NOT NULL,
	"message_id" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer,
	"form_key" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"company" text,
	"message" text,
	"preferred_timeline" text,
	"metadata_json" jsonb,
	"status" text DEFAULT 'open' NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"email_opt_out" boolean DEFAULT false NOT NULL,
	"email_opt_out_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ctas" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"variant" text,
	"helper_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "downloads" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"file_url" text,
	"file_type" text,
	"requires_form" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"question" text NOT NULL,
	"answer_richtext" text NOT NULL,
	"category" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "features" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"group_key" text,
	"icon_key" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"form_key" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"success_message" text,
	"notify_email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_submission_id" integer NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"owner_user_id" integer,
	"notes" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"notification_sent_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"alt_text" text,
	"mime_type" text,
	"width" integer,
	"height" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "navigation_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"nav_group" text NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_external" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"requires_auth" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"page_type" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"template_key" text,
	"meta_title" text,
	"meta_description" text,
	"og_title" text,
	"og_description" text,
	"canonical_url" text,
	"noindex" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "redirects" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_path" text NOT NULL,
	"to_path" text NOT NULL,
	"status_code" integer DEFAULT 301 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "redirects_from_path_unique" UNIQUE("from_path")
);
--> statement-breakpoint
CREATE TABLE "roadmap_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"phase_label" text,
	"status" text DEFAULT 'planned' NOT NULL,
	"target_quarter" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_id" integer NOT NULL,
	"section_key" text NOT NULL,
	"section_type" text,
	"heading" text,
	"subheading" text,
	"body_richtext" text,
	"eyebrow" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"style_variant" text,
	"data_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"short_description" text,
	"full_description" text,
	"category" text,
	"icon_key" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"key" text NOT NULL,
	"value_json" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"brand_label" text,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sites_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "support_email_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_submission_id" integer NOT NULL,
	"recipient" text NOT NULL,
	"subject" text NOT NULL,
	"template" text NOT NULL,
	"previous_status" text,
	"new_status" text,
	"delivery_status" text NOT NULL,
	"provider" text,
	"message_id" text,
	"error" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"quote" text NOT NULL,
	"attribution_name" text,
	"attribution_title" text,
	"attribution_company" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"body_richtext" text,
	"slug" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"featured_image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "use_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"audience" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ventures" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_description" text,
	"long_description" text,
	"status_badge" text,
	"stage" text,
	"category" text,
	"primary_cta_label" text,
	"primary_cta_url" text,
	"secondary_cta_label" text,
	"secondary_cta_url" text,
	"accent_token" text,
	"featured_image_url" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ventures_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cog_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action_id" text NOT NULL,
	"agent_id" text,
	"trace_id" text,
	"plan_id" uuid,
	"plan_step_id" uuid,
	"skill_run_id" uuid,
	"domain" text DEFAULT 'general' NOT NULL,
	"action_type" text NOT NULL,
	"description" text NOT NULL,
	"status" "cog_action_status" DEFAULT 'pending' NOT NULL,
	"inputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"outputs" jsonb,
	"policy_id" text,
	"policy_version" integer,
	"approval_id" text,
	"verifier_result_id" uuid,
	"rollback_event_id" uuid,
	"is_reversible" boolean DEFAULT true NOT NULL,
	"rollback_procedure" jsonb,
	"business_impact" jsonb,
	"confidence" real DEFAULT 1 NOT NULL,
	"sensitivity_tier" "cog_sensitivity_tier" DEFAULT 'internal' NOT NULL,
	"provenance_source" text DEFAULT 'agent' NOT NULL,
	"provenance_method" "cog_provenance_method" DEFAULT 'agent' NOT NULL,
	"provenance_author" text,
	"freshness_last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"executed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cog_actions_action_id_unique" UNIQUE("action_id")
);
--> statement-breakpoint
CREATE TABLE "rollback_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"action_id" text NOT NULL,
	"request_id" text NOT NULL,
	"agent_id" text,
	"org_id" integer,
	"tier" text NOT NULL,
	"triggered_by" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" text NOT NULL,
	"alias" text NOT NULL,
	"alias_type" text DEFAULT 'display' NOT NULL,
	"provenance_source" text DEFAULT 'agent' NOT NULL,
	"provenance_method" "cog_provenance_method" DEFAULT 'agent' NOT NULL,
	"confidence" real DEFAULT 1 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_entity_id" text NOT NULL,
	"to_entity_id" text NOT NULL,
	"edge_type" "cog_entity_edge_type" DEFAULT 'relates-to' NOT NULL,
	"label" text,
	"weight" real DEFAULT 1 NOT NULL,
	"bidirectional" boolean DEFAULT false NOT NULL,
	"provenance_source" text DEFAULT 'agent' NOT NULL,
	"provenance_method" "cog_provenance_method" DEFAULT 'agent' NOT NULL,
	"provenance_author" text,
	"confidence" real DEFAULT 1 NOT NULL,
	"sensitivity_tier" "cog_sensitivity_tier" DEFAULT 'internal' NOT NULL,
	"freshness_last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"freshness_ttl_seconds" integer,
	"freshness_is_stale" boolean DEFAULT false NOT NULL,
	"linked_traces" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orchestration_checkpoints" (
	"ref" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"objective" text NOT NULL,
	"phase" text NOT NULL,
	"step_index" integer DEFAULT 0 NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "plan_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"step_index" integer NOT NULL,
	"parent_step_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"skill_id" text,
	"skill_version" integer,
	"skill_run_id" uuid,
	"status" "cog_plan_step_status" DEFAULT 'pending' NOT NULL,
	"depends_on_step_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"inputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"outputs" jsonb,
	"approval_required" boolean DEFAULT false NOT NULL,
	"approval_id" text,
	"verifier_result_id" uuid,
	"confidence" real DEFAULT 1 NOT NULL,
	"error_code" text,
	"error_message" text,
	"retries" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" text NOT NULL,
	"agent_id" text,
	"session_id" text,
	"workflow_id" text,
	"trace_id" text,
	"title" text NOT NULL,
	"description" text,
	"goal" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "cog_plan_status" DEFAULT 'draft' NOT NULL,
	"total_steps" integer DEFAULT 0 NOT NULL,
	"completed_steps" integer DEFAULT 0 NOT NULL,
	"failed_steps" integer DEFAULT 0 NOT NULL,
	"fallback_plan_id" text,
	"parent_plan_id" text,
	"confidence" real DEFAULT 1 NOT NULL,
	"sensitivity_tier" "cog_sensitivity_tier" DEFAULT 'internal' NOT NULL,
	"provenance_source" text DEFAULT 'agent' NOT NULL,
	"provenance_method" "cog_provenance_method" DEFAULT 'agent' NOT NULL,
	"provenance_author" text,
	"freshness_last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"freshness_is_stale" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_plan_id_unique" UNIQUE("plan_id")
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"latest_version" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"domain" text DEFAULT 'general' NOT NULL,
	"scope" text DEFAULT 'global' NOT NULL,
	"effect" "cog_policy_effect" DEFAULT 'allow' NOT NULL,
	"conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"owner" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"confidence" real DEFAULT 1 NOT NULL,
	"sensitivity_tier" "cog_sensitivity_tier" DEFAULT 'internal' NOT NULL,
	"provenance_source" text DEFAULT 'agent' NOT NULL,
	"provenance_method" "cog_provenance_method" DEFAULT 'agent' NOT NULL,
	"provenance_author" text,
	"freshness_last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"freshness_is_stale" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reflections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reflection_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"type" "cog_reflection_type" DEFAULT 'post-task' NOT NULL,
	"trace_id" text,
	"plan_id" uuid,
	"session_id" text,
	"triggering_event" text,
	"summary" text NOT NULL,
	"observations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"improvements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"policy_breaches" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"confidence_adjustment" real DEFAULT 0 NOT NULL,
	"overall_health" text DEFAULT 'good' NOT NULL,
	"actionable" boolean DEFAULT false NOT NULL,
	"suggested_actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"confidence" real DEFAULT 1 NOT NULL,
	"sensitivity_tier" "cog_sensitivity_tier" DEFAULT 'internal' NOT NULL,
	"provenance_source" text DEFAULT 'agent' NOT NULL,
	"provenance_method" "cog_provenance_method" DEFAULT 'agent' NOT NULL,
	"freshness_last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reflections_reflection_id_unique" UNIQUE("reflection_id")
);
--> statement-breakpoint
CREATE TABLE "self_model_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"self_model_id" uuid NOT NULL,
	"agent_id" text NOT NULL,
	"version" integer NOT NULL,
	"snapshot_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"change_reason" text,
	"triggered_by" text,
	"trace_id" text,
	"confidence" real DEFAULT 1 NOT NULL,
	"sensitivity_tier" "cog_sensitivity_tier" DEFAULT 'internal' NOT NULL,
	"provenance_source" text DEFAULT 'agent' NOT NULL,
	"provenance_method" "cog_provenance_method" DEFAULT 'agent' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "self_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "self_model_status" DEFAULT 'active' NOT NULL,
	"capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"goals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"constraints" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"beliefs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"identity" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"performance_profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"confidence" real DEFAULT 1 NOT NULL,
	"sensitivity_tier" "cog_sensitivity_tier" DEFAULT 'internal' NOT NULL,
	"provenance_source" text DEFAULT 'agent' NOT NULL,
	"provenance_method" "cog_provenance_method" DEFAULT 'agent' NOT NULL,
	"provenance_author" text,
	"freshness_last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"freshness_ttl_seconds" integer,
	"freshness_is_stale" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" text NOT NULL,
	"skill_version" integer DEFAULT 1 NOT NULL,
	"agent_id" text,
	"trace_id" text,
	"plan_id" uuid,
	"plan_step_id" uuid,
	"status" "cog_skill_run_status" DEFAULT 'pending' NOT NULL,
	"inputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"outputs" jsonb,
	"latency_ms" real,
	"tokens_used" integer,
	"cost_usd" real,
	"error_code" text,
	"error_message" text,
	"retries" integer DEFAULT 0 NOT NULL,
	"approval_id" text,
	"confidence" real DEFAULT 1 NOT NULL,
	"provenance_source" text DEFAULT 'agent' NOT NULL,
	"provenance_method" "cog_provenance_method" DEFAULT 'agent' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"latest_version" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"domain" text DEFAULT 'general' NOT NULL,
	"capability" text NOT NULL,
	"status" "cog_skill_status" DEFAULT 'active' NOT NULL,
	"input_schema" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output_schema" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"implementation" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"trigger_conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"policy_class" text,
	"estimated_latency_ms" integer,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"is_builtin" boolean DEFAULT false NOT NULL,
	"confidence" real DEFAULT 1 NOT NULL,
	"sensitivity_tier" "cog_sensitivity_tier" DEFAULT 'internal' NOT NULL,
	"provenance_source" text DEFAULT 'agent' NOT NULL,
	"provenance_method" "cog_provenance_method" DEFAULT 'agent' NOT NULL,
	"provenance_author" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifier_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"verifier_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"trace_id" text,
	"plan_id" uuid,
	"plan_step_id" uuid,
	"skill_run_id" uuid,
	"outcome" "cog_verifier_outcome" NOT NULL,
	"checks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"overall_score" real,
	"blocker_count" integer DEFAULT 0 NOT NULL,
	"warning_count" integer DEFAULT 0 NOT NULL,
	"pass_count" integer DEFAULT 0 NOT NULL,
	"reasoning" text,
	"confidence" real DEFAULT 1 NOT NULL,
	"sensitivity_tier" "cog_sensitivity_tier" DEFAULT 'internal' NOT NULL,
	"provenance_source" text DEFAULT 'agent' NOT NULL,
	"provenance_method" "cog_provenance_method" DEFAULT 'agent' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "command_inbox_alert_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"alert_id" text NOT NULL,
	"tenant_id" text DEFAULT '_global_' NOT NULL,
	"action" text NOT NULL,
	"snoozed_until" timestamp with time zone,
	"actor_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "command_inbox_alert_states" (
	"id" serial PRIMARY KEY NOT NULL,
	"alert_id" text NOT NULL,
	"tenant_id" text DEFAULT '_global_' NOT NULL,
	"state" text NOT NULL,
	"snoozed_until" timestamp with time zone,
	"updated_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "command_coalition_partners" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT '_global_' NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"domain" text NOT NULL,
	"trust_score" integer NOT NULL,
	"status" text NOT NULL,
	"classification" text NOT NULL,
	"last_contact" timestamp with time zone NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"alerts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "command_directives" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT '_global_' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"priority" text NOT NULL,
	"status" text NOT NULL,
	"classification" text NOT NULL,
	"issued_by" text NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"cascaded_to" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cascade_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "command_drawdown_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT '_global_' NOT NULL,
	"pool_id" text NOT NULL,
	"amount" real NOT NULL,
	"justification" text NOT NULL,
	"requested_by" text NOT NULL,
	"requested_at" timestamp with time zone NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "command_reserve_pools" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT '_global_' NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"total_capacity" real NOT NULL,
	"current_level" real NOT NULL,
	"unit" text NOT NULL,
	"status" text NOT NULL,
	"classification" text NOT NULL,
	"last_drawdown" timestamp with time zone,
	"notes" text DEFAULT '' NOT NULL,
	"trend_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"author_id" integer,
	"author_name" text DEFAULT 'Anonymous' NOT NULL,
	"author_initials" text DEFAULT '??' NOT NULL,
	"content" text NOT NULL,
	"mentions" jsonb DEFAULT '[]'::jsonb,
	"parent_id" integer,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitive_intel_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"lane_id" text NOT NULL,
	"champion" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"link" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"recommendation" text NOT NULL,
	"recommendation_reason" text NOT NULL,
	"dismissed" boolean DEFAULT false NOT NULL,
	"dismissed_at" timestamp with time zone,
	"dismissed_by" text,
	"source" text NOT NULL,
	"notified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "competitive_intel_feeds" (
	"id" text PRIMARY KEY NOT NULL,
	"lane_id" text NOT NULL,
	"champion" text NOT NULL,
	"feed_url" text NOT NULL,
	"home_url" text NOT NULL,
	"paused" boolean DEFAULT false NOT NULL,
	"recommendation_hint" text,
	"last_polled_at" timestamp with time zone,
	"last_success_at" timestamp with time zone,
	"last_error" text,
	"items_seen" integer DEFAULT 0 NOT NULL,
	"alerts_created" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitive_intel_state" (
	"id" integer PRIMARY KEY NOT NULL,
	"last_full_poll_at" timestamp with time zone,
	"poll_run_count" integer DEFAULT 0 NOT NULL,
	"alerts_seeded_at" timestamp with time zone,
	"feeds_seeded_at" timestamp with time zone,
	"json_migrated_at" timestamp with time zone,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "compliance_archival" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"entry_id" text NOT NULL,
	"prev_hash" text,
	"content_hash" text NOT NULL,
	"communication_type" text NOT NULL,
	"participants" jsonb NOT NULL,
	"subject" text,
	"content_summary" text,
	"content_ref" text,
	"retention_policy" text DEFAULT 'rule_17a4_3year' NOT NULL,
	"retention_expires_at" timestamp NOT NULL,
	"is_immutable" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"archived_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_archival_entry_id_unique" UNIQUE("entry_id")
);
--> statement-breakpoint
CREATE TABLE "compliance_calendar" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_at" timestamp NOT NULL,
	"reminder_at" timestamp,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"assigned_to_id" text,
	"assigned_to_name" text,
	"regulatory_body" text,
	"filing_reference" text,
	"completed_at" timestamp,
	"notes" text,
	"recurrence" text DEFAULT 'none' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_calendar_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "compliance_risk_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"score_date" timestamp DEFAULT now() NOT NULL,
	"overall_score" numeric(5, 2) NOT NULL,
	"reg_bi_score" numeric(5, 2),
	"archival_score" numeric(5, 2),
	"supervision_score" numeric(5, 2),
	"open_supervision_items" integer DEFAULT 0 NOT NULL,
	"critical_items" integer DEFAULT 0 NOT NULL,
	"overdue_calendar_items" integer DEFAULT 0 NOT NULL,
	"pending_suitability_reviews" integer DEFAULT 0 NOT NULL,
	"breakdown" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_suitability" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"client_id" text NOT NULL,
	"client_name" text NOT NULL,
	"advisor_id" text NOT NULL,
	"advisor_name" text NOT NULL,
	"recommendation_id" text NOT NULL,
	"recommendation_type" text NOT NULL,
	"recommendation_summary" text NOT NULL,
	"rationale_text" text NOT NULL,
	"client_profile" jsonb NOT NULL,
	"risk_tolerance" text NOT NULL,
	"investment_objective" text NOT NULL,
	"time_horizon_years" integer,
	"liquidity_needs" text,
	"financial_situation" jsonb,
	"conflicts" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"reviewer_id" text,
	"reviewed_at" timestamp,
	"review_notes" text,
	"regulatory_basis" text DEFAULT 'Regulation Best Interest (Reg BI)' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_suitability_recommendation_id_unique" UNIQUE("recommendation_id")
);
--> statement-breakpoint
CREATE TABLE "compliance_supervision_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"item_id" text NOT NULL,
	"category" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"assigned_to_id" text,
	"assigned_to_name" text,
	"submitted_by_id" text,
	"submitted_by_name" text,
	"related_entities" jsonb,
	"escalation_level" integer DEFAULT 0 NOT NULL,
	"escalation_chain" jsonb,
	"risk_score" numeric(5, 2),
	"due_at" timestamp,
	"resolved_at" timestamp,
	"resolution" text,
	"attachments" jsonb,
	"audit_trail" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_supervision_queue_item_id_unique" UNIQUE("item_id")
);
--> statement-breakpoint
CREATE TABLE "connector_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"connector_id" integer NOT NULL,
	"level" text NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connectors" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"sync_status" text DEFAULT 'idle',
	"last_sync_error" text,
	"sync_stats" jsonb,
	"oauth_data" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"config" jsonb,
	"last_sync_at" timestamp,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consciousness_agent_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"domain" text NOT NULL,
	"success_rate" real DEFAULT 0.5 NOT NULL,
	"avg_confidence" real DEFAULT 50 NOT NULL,
	"total_invocations" integer DEFAULT 0 NOT NULL,
	"recent_trend" text DEFAULT 'stable' NOT NULL,
	"strengths" text[] DEFAULT '{}' NOT NULL,
	"weaknesses" text[] DEFAULT '{}' NOT NULL,
	"snapshot_data" jsonb,
	"captured_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "consciousness_agent_profiles_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "consciousness_emotional_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"orchestration_id" text NOT NULL,
	"dominant_emotion" text NOT NULL,
	"positive_valence" real NOT NULL,
	"negative_valence" real NOT NULL,
	"arousal" real NOT NULL,
	"stability" real NOT NULL,
	"mood_trajectory" text DEFAULT 'stable' NOT NULL,
	"triggered_validation" integer DEFAULT 0 NOT NULL,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consciousness_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"goal_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"progress" real DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"source" text DEFAULT 'orchestration' NOT NULL,
	"related_domains" text[] DEFAULT '{}' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "consciousness_goals_goal_id_unique" UNIQUE("goal_id")
);
--> statement-breakpoint
CREATE TABLE "consciousness_monologue" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_id" text NOT NULL,
	"type" text NOT NULL,
	"thought" text NOT NULL,
	"triggering_event" text NOT NULL,
	"emotional_tone" text NOT NULL,
	"confidence" real NOT NULL,
	"related_agents" text[] DEFAULT '{}' NOT NULL,
	"related_domains" text[] DEFAULT '{}' NOT NULL,
	"actionable" integer DEFAULT 0 NOT NULL,
	"suggested_action" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "consciousness_monologue_entry_id_unique" UNIQUE("entry_id")
);
--> statement-breakpoint
CREATE TABLE "consciousness_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"orchestration_id" text NOT NULL,
	"metacognition" jsonb NOT NULL,
	"self_model" jsonb NOT NULL,
	"emotions" jsonb NOT NULL,
	"goals" jsonb NOT NULL,
	"temporal" jsonb NOT NULL,
	"avg_confidence" real NOT NULL,
	"confusion_streak" integer DEFAULT 0 NOT NULL,
	"overall_health" text DEFAULT 'good' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consciousness_temporal_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"domain" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"avg_success_rate" real NOT NULL,
	"avg_confidence" real NOT NULL,
	"avg_latency_ms" real NOT NULL,
	"total_invocations" integer DEFAULT 0 NOT NULL,
	"trend" text DEFAULT 'stable' NOT NULL,
	"self_reflection" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cst_edge_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"edge_id" uuid NOT NULL,
	"evidence_type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"source_id" text,
	"source_label" text,
	"confidence" real DEFAULT 1 NOT NULL,
	"recorded_by" text,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cst_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_node_id" uuid NOT NULL,
	"to_node_id" uuid NOT NULL,
	"relationship_type" text NOT NULL,
	"confidence" real DEFAULT 1 NOT NULL,
	"source_id" text,
	"source_type" text,
	"source_label" text,
	"active" boolean DEFAULT true NOT NULL,
	"extensions" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cst_node_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"alias_type" text NOT NULL,
	"alias_value" text NOT NULL,
	"source_system" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cst_node_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" text NOT NULL,
	"type_key" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"default_sensitivity" "cst_sensitivity_tier" DEFAULT 'internal' NOT NULL,
	"extension_schema" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cst_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"domain" text NOT NULL,
	"entity_type" text NOT NULL,
	"labels" text[] DEFAULT '{}',
	"name" text NOT NULL,
	"description" text,
	"provenance_source_id" text,
	"provenance_source_type" text,
	"provenance_source_label" text,
	"freshness" timestamp with time zone DEFAULT now() NOT NULL,
	"confidence" real DEFAULT 1 NOT NULL,
	"owner_id" text,
	"owner_type" text,
	"owner_org_id" text,
	"sensitivity_tier" "cst_sensitivity_tier" DEFAULT 'internal' NOT NULL,
	"related_action_ids" jsonb DEFAULT '[]'::jsonb,
	"related_document_ids" jsonb DEFAULT '[]'::jsonb,
	"related_execution_ids" jsonb DEFAULT '[]'::jsonb,
	"related_risk_ids" jsonb DEFAULT '[]'::jsonb,
	"extensions" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cst_nodes_canonical_id_unique" UNIQUE("canonical_id")
);
--> statement-breakpoint
CREATE TABLE "constellation_saved_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"org_id" integer,
	"visibility" text DEFAULT 'private' NOT NULL,
	"domain" text NOT NULL,
	"name" text NOT NULL,
	"filters" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cortex_action_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"draft_uuid" text NOT NULL,
	"org_id" integer,
	"alert_id" text NOT NULL,
	"alert_title" text NOT NULL,
	"domain" text NOT NULL,
	"draft_type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"recipient" text,
	"priority" text DEFAULT 'normal' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"approved_by" text,
	"dismissed_at" timestamp,
	"dismissed_by" text,
	CONSTRAINT "cortex_action_drafts_draft_uuid_unique" UNIQUE("draft_uuid")
);
--> statement-breakpoint
CREATE TABLE "cortex_graph_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_uuid" text NOT NULL,
	"org_id" integer,
	"label" text,
	"nodes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"edges" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"retention_days" integer DEFAULT 30 NOT NULL,
	"snapshot_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "cortex_graph_snapshots_snapshot_uuid_unique" UNIQUE("snapshot_uuid")
);
--> statement-breakpoint
CREATE TABLE "covenant_simulation_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"subject_roles" text[] DEFAULT '{}' NOT NULL,
	"subject_user_id" text,
	"subject_tenant_id" text,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"resource_domain" text,
	"action" text NOT NULL,
	"effect" text NOT NULL,
	"allowed" integer DEFAULT 0 NOT NULL,
	"matched_policies" text[] DEFAULT '{}' NOT NULL,
	"denied_by" text,
	"reason" text,
	"explanation" text[] DEFAULT '{}' NOT NULL,
	"context" jsonb,
	"evaluated_at" bigint NOT NULL,
	"duration_ms" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "covenant_simulation_runs_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "policy_sim_scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"subject_roles" text[] DEFAULT '{}' NOT NULL,
	"subject_user_id" text,
	"subject_tenant_id" text,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"resource_domain" text,
	"action" text NOT NULL,
	"context" jsonb,
	"last_result" jsonb,
	"last_run_at" timestamp,
	"run_count" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"org_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_briefings" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"briefing_date" text NOT NULL,
	"headline" text NOT NULL,
	"executive_summary" text NOT NULL,
	"signals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"domain_scores" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"total_alerts" integer DEFAULT 0 NOT NULL,
	"critical_count" integer DEFAULT 0 NOT NULL,
	"high_count" integer DEFAULT 0 NOT NULL,
	"overall_health" text DEFAULT 'nominal' NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_retention_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"policy_id" integer,
	"org_id" integer,
	"table_name" text NOT NULL,
	"action" text NOT NULL,
	"actor_id" integer,
	"actor_name" text,
	"affected_rows" integer,
	"details" jsonb,
	"status" text DEFAULT 'success' NOT NULL,
	"error_message" text,
	"executed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_retention_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"table_name" text NOT NULL,
	"retention_days" integer NOT NULL,
	"purge_strategy" text DEFAULT 'delete' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp,
	"next_run_at" timestamp,
	"description" text,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decision_fabric_correlation_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"correlation_id" text NOT NULL,
	"primitive" text NOT NULL,
	"primitive_id" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"workflow_run_id" text,
	"domain" text DEFAULT 'general' NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "decision_fabric_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"domain" text DEFAULT 'general' NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"title" text NOT NULL,
	"rationale" text,
	"context" jsonb DEFAULT '{}'::jsonb,
	"decided_by_user_id" integer,
	"decided_by_role" text,
	"owner_user_id" integer,
	"outcome_graph_id" integer,
	"proof_chain_id" integer,
	"policy_version_id" integer,
	"simulation_snapshot_id" integer,
	"approval_id" integer,
	"workflow_run_id" text,
	"recommendation_id" text,
	"predicted_outcome" jsonb DEFAULT '{}'::jsonb,
	"actual_outcome" jsonb DEFAULT '{}'::jsonb,
	"prediction_error" real,
	"status" text DEFAULT 'executed' NOT NULL,
	"correlation_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"decided_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decision_fabric_simulation_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"domain" text DEFAULT 'general' NOT NULL,
	"scenario_id" text NOT NULL,
	"scenario_name" text NOT NULL,
	"inputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"parameters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"results" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"confidence_interval" jsonb DEFAULT '{}'::jsonb,
	"iterations" integer,
	"seed" text,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decision_fabric_playbook_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"domain" text DEFAULT 'general' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"trigger_signature" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"recommended_actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"supporting_decision_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sample_size" integer DEFAULT 0 NOT NULL,
	"success_rate" real,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"status" text DEFAULT 'proposed' NOT NULL,
	"reviewed_by_user_id" integer,
	"reviewed_at" timestamp,
	"promoted_workflow_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decision_fabric_policy_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"policy_id" text NOT NULL,
	"version" text NOT NULL,
	"policy_name" text NOT NULL,
	"effect" text NOT NULL,
	"body" jsonb NOT NULL,
	"authored_by_user_id" integer,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decision_receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"receipt_id" text NOT NULL,
	"domain" text NOT NULL,
	"action_type" text NOT NULL,
	"action_label" text NOT NULL,
	"actor_user_id" integer,
	"actor_name" text,
	"actor_role" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"data_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ai_recommendation" jsonb,
	"alternatives_considered" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rationale" text,
	"outcome" text NOT NULL,
	"risk_level" text,
	"confidence" real,
	"decision_id" text,
	"workflow_id" text,
	"approval_id" integer,
	"non_repudiation_hash" text NOT NULL,
	"hash_algorithm" text DEFAULT 'sha256' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "decision_receipts_receipt_id_unique" UNIQUE("receipt_id")
);
--> statement-breakpoint
CREATE TABLE "decision_audit_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"card_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"event_type" text NOT NULL,
	"actor_id" text NOT NULL,
	"actor_type" text DEFAULT 'system' NOT NULL,
	"actor_display" text,
	"reason" text,
	"previous_status" text,
	"new_status" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "decision_audit_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "decision_evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"source" text NOT NULL,
	"excerpt" text,
	"source_type" text DEFAULT 'signal' NOT NULL,
	"freshness" text DEFAULT 'recent' NOT NULL,
	"confidence" real DEFAULT 0.8 NOT NULL,
	"captured_at" timestamp DEFAULT now() NOT NULL,
	"order_idx" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decision_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"run_id" text NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_latency_ms" integer,
	"total_input_tokens" integer,
	"total_output_tokens" integer,
	"estimated_cost_usd" real,
	"models_called" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tools_called" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"handoffs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "decision_runs_run_id_unique" UNIQUE("run_id")
);
--> statement-breakpoint
CREATE TABLE "decision_validations" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"check_type" text NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"explanation" text NOT NULL,
	"severity" text DEFAULT 'blocking' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"ran_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decisions_runtime" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"domain" text DEFAULT 'lyte' NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"autonomy_mode" text DEFAULT 'recommend' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"policy_state" text DEFAULT 'pending' NOT NULL,
	"freshness" text DEFAULT 'recent' NOT NULL,
	"confidence" real DEFAULT 0.75 NOT NULL,
	"entity_scope" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommended_action" text,
	"reasoning" text,
	"owner" text,
	"priority" integer DEFAULT 50 NOT NULL,
	"constitution_id" integer,
	"policy_evaluation" jsonb DEFAULT '{}'::jsonb,
	"validation_summary" jsonb DEFAULT '{}'::jsonb,
	"audit_event_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by" text,
	"review_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "decisions_runtime_card_id_unique" UNIQUE("card_id")
);
--> statement-breakpoint
CREATE TABLE "workspace_constitutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"required_approvals" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"action_redlines" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"autonomy_ceilings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"confidence_floor" real DEFAULT 0.75 NOT NULL,
	"freshness_max_hours" integer DEFAULT 24 NOT NULL,
	"extra_rules" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployments" (
	"id" serial PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"app_name" text NOT NULL,
	"version" text NOT NULL,
	"environment" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"deployed_at" timestamp DEFAULT now() NOT NULL,
	"deployed_by" text DEFAULT 'system' NOT NULL,
	"commit_sha" text,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dos_ab_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"content_id" integer,
	"content_type" text DEFAULT 'article' NOT NULL,
	"test_type" text DEFAULT 'headline' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"variants" jsonb,
	"traffic_split" jsonb,
	"winner_variant_id" text,
	"significance_level" integer DEFAULT 95 NOT NULL,
	"current_significance" integer DEFAULT 0 NOT NULL,
	"total_impressions" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"concluded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dos_analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"path" text,
	"target" text,
	"value" text,
	"session_id" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dos_article_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"version_number" integer DEFAULT 1 NOT NULL,
	"title" text,
	"body_markdown" text,
	"change_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dos_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"slug" text NOT NULL,
	"pillar_id" integer,
	"author_id" integer,
	"article_type" text DEFAULT 'flagship-essay' NOT NULL,
	"target_audience" text,
	"thesis" text,
	"summary" text,
	"excerpt" text,
	"body_markdown" text,
	"body_html" text,
	"cover_image_url" text,
	"read_time_minutes" integer,
	"seo_title" text,
	"seo_description" text,
	"og_title" text,
	"og_description" text,
	"og_image_url" text,
	"canonical_url" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"keywords" jsonb DEFAULT '[]'::jsonb,
	"cta_type" text,
	"cta_text" text,
	"cta_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"site_status" text DEFAULT 'draft' NOT NULL,
	"x_status" text DEFAULT 'none' NOT NULL,
	"medium_status" text DEFAULT 'none' NOT NULL,
	"substack_status" text DEFAULT 'none' NOT NULL,
	"approved_for_auto_send" boolean DEFAULT false NOT NULL,
	"review_required" boolean DEFAULT true NOT NULL,
	"external_url_site" text,
	"external_url_x" text,
	"external_url_medium" text,
	"external_url_substack" text,
	"published_site_at" timestamp,
	"published_x_at" timestamp,
	"published_medium_at" timestamp,
	"published_substack_at" timestamp,
	"publish_target_date" timestamp,
	"next_recommended_action" text,
	"campaign_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dos_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "dos_audience_segments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"size" integer DEFAULT 0 NOT NULL,
	"growth_rate" integer DEFAULT 0 NOT NULL,
	"engagement_score" integer DEFAULT 0 NOT NULL,
	"psychographics" jsonb,
	"top_content_types" jsonb,
	"top_topics" jsonb,
	"peak_engagement_hour" integer,
	"preferred_platforms" jsonb,
	"avg_read_time" integer,
	"conversion_rate" integer DEFAULT 0 NOT NULL,
	"revenue_contribution" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dos_audience_segments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "dos_author_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"title" text,
	"bio_short" text,
	"bio_long" text,
	"avatar_url" text,
	"linkedin_url" text,
	"x_url" text,
	"website_url" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dos_author_profiles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "dos_automation_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_name" text NOT NULL,
	"job_type" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"summary" text,
	"output" jsonb,
	"items_created" integer DEFAULT 0 NOT NULL,
	"items_failed" integer DEFAULT 0 NOT NULL,
	"error_log" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dos_campaign_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"name" text NOT NULL,
	"source" text NOT NULL,
	"medium" text NOT NULL,
	"campaign" text NOT NULL,
	"content" text,
	"term" text,
	"destination" text NOT NULL,
	"full_url" text NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"owner" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dos_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"owner" text,
	"notes" text,
	"total_clicks" integer DEFAULT 0 NOT NULL,
	"total_conversions" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dos_campaigns_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "dos_carousel_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"topic" text,
	"hook" text,
	"pillar_id" integer,
	"linkedin_short_caption" text,
	"linkedin_long_caption" text,
	"x_thread_adaptation" text,
	"instagram_caption" text,
	"newsletter_teaser" text,
	"article_excerpt" text,
	"visual_direction_notes" text,
	"ai_carousels_import_block" text,
	"cta_text" text,
	"cta_url" text,
	"status" text DEFAULT 'idea' NOT NULL,
	"article_id" integer,
	"newsletter_id" integer,
	"campaign_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dos_carousel_projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "dos_carousel_slides" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"slide_number" integer NOT NULL,
	"slide_type" text DEFAULT 'content' NOT NULL,
	"tagline" text,
	"title" text,
	"paragraph" text,
	"call_to_action" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dos_content_calendar_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content_type" text NOT NULL,
	"content_id" integer,
	"pillar_id" integer,
	"campaign_id" integer,
	"channel" text,
	"status" text DEFAULT 'idea' NOT NULL,
	"scheduled_date" timestamp,
	"owner" text,
	"notes" text,
	"destination_url" text,
	"target_audience" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dos_content_lifecycle" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer,
	"content_title" text NOT NULL,
	"lifecycle_stage" text DEFAULT 'ideation' NOT NULL,
	"content_health_score" integer DEFAULT 0 NOT NULL,
	"is_evergreen" boolean DEFAULT false NOT NULL,
	"total_views" integer DEFAULT 0 NOT NULL,
	"monthly_views" integer DEFAULT 0 NOT NULL,
	"last_viewed_at" timestamp,
	"redistribution_count" integer DEFAULT 0 NOT NULL,
	"last_redistributed_at" timestamp,
	"recommended_action" text DEFAULT 'none' NOT NULL,
	"revenue_generated" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dos_cta_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"headline" text,
	"body" text,
	"button_text" text,
	"button_url" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dos_distribution_targets" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_type" text NOT NULL,
	"content_id" integer NOT NULL,
	"channel" text NOT NULL,
	"planned_date" timestamp,
	"actual_date" timestamp,
	"status" text DEFAULT 'planned' NOT NULL,
	"external_url" text,
	"owner" text,
	"notes" text,
	"performance_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dos_editorial_pillars" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"color" text,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dos_editorial_pillars_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "dos_integration_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"auth_mode" text NOT NULL,
	"status" text DEFAULT 'disconnected' NOT NULL,
	"last_success" timestamp,
	"last_failure" timestamp,
	"last_error" text,
	"config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dos_integration_status_provider_unique" UNIQUE("provider")
);
--> statement-breakpoint
CREATE TABLE "dos_lead_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"note" text NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dos_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"company" text,
	"role" text,
	"interest_area" text,
	"budget" text,
	"message" text,
	"consent" boolean DEFAULT false NOT NULL,
	"source" text,
	"medium" text,
	"campaign" text,
	"content" text,
	"landing_page" text,
	"stage" text DEFAULT 'new' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"owner" text,
	"next_follow_up" timestamp,
	"last_action" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dos_linktree_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"destination" text NOT NULL,
	"campaign_tag" text,
	"content_tag" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dos_monetization_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"rule_type" text DEFAULT 'sponsorship' NOT NULL,
	"target_segment_id" integer,
	"base_rate" integer DEFAULT 0 NOT NULL,
	"current_rate" integer DEFAULT 0 NOT NULL,
	"demand_score" integer DEFAULT 50 NOT NULL,
	"placement_config" jsonb,
	"revenue_attributed" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_adjusted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dos_newsletters" (
	"id" serial PRIMARY KEY NOT NULL,
	"issue_number" integer,
	"title" text NOT NULL,
	"subtitle" text,
	"slug" text NOT NULL,
	"template_type" text DEFAULT 'weekly-briefing' NOT NULL,
	"pillar_id" integer,
	"author_id" integer,
	"intro_note" text,
	"main_story_markdown" text,
	"main_story_html" text,
	"secondary_links" jsonb DEFAULT '[]'::jsonb,
	"cta_block" text,
	"founder_signoff" text,
	"email_version" text,
	"web_version" text,
	"summary_version" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"substack_status" text DEFAULT 'none' NOT NULL,
	"substack_url" text,
	"published_at" timestamp,
	"campaign_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dos_newsletters_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "dos_page_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"referrer" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"utm_term" text,
	"session_id" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dos_publication_urls" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_type" text NOT NULL,
	"content_id" integer NOT NULL,
	"platform" text NOT NULL,
	"external_url" text NOT NULL,
	"published_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dos_seo_keywords" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyword" text NOT NULL,
	"search_volume" integer DEFAULT 0 NOT NULL,
	"difficulty" integer DEFAULT 0 NOT NULL,
	"current_rank" integer,
	"target_rank" integer,
	"trend" text DEFAULT 'stable' NOT NULL,
	"category" text DEFAULT 'target' NOT NULL,
	"opportunity_score" integer DEFAULT 0 NOT NULL,
	"linked_article_id" integer,
	"competitor_ranks" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dos_site_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text,
	"category" text DEFAULT 'company' NOT NULL,
	"label" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dos_site_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "dos_trend_signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic" text NOT NULL,
	"platform" text DEFAULT 'x' NOT NULL,
	"velocity_score" integer DEFAULT 0 NOT NULL,
	"sentiment_score" integer DEFAULT 50 NOT NULL,
	"hours_to_mainstream" integer,
	"content_opportunity" text,
	"related_keywords" jsonb,
	"sample_posts" jsonb,
	"status" text DEFAULT 'emerging' NOT NULL,
	"action_taken" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dos_virality_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer,
	"content_title" text NOT NULL,
	"content_type" text DEFAULT 'article' NOT NULL,
	"predicted_score" integer DEFAULT 0 NOT NULL,
	"engagement_probability" integer DEFAULT 0 NOT NULL,
	"reach_estimate" integer DEFAULT 0 NOT NULL,
	"conversion_probability" integer DEFAULT 0 NOT NULL,
	"trend_alignment" integer DEFAULT 0 NOT NULL,
	"audience_resonance" integer DEFAULT 0 NOT NULL,
	"competitive_gap" integer DEFAULT 0 NOT NULL,
	"recommendations" jsonb,
	"signals" jsonb,
	"scored_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dos_x_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_type" text,
	"source_id" integer,
	"post_type" text DEFAULT 'single' NOT NULL,
	"body" text NOT NULL,
	"thread_json" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_for" timestamp,
	"sent_at" timestamp,
	"external_post_id" text,
	"external_post_url" text,
	"campaign_id" integer,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_library_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text DEFAULT 'custom' NOT NULL,
	"app_source" text DEFAULT 'general' NOT NULL,
	"content_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"author_id" integer,
	"author_name" text NOT NULL,
	"section_ref" text,
	"content" text NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"app_source" text DEFAULT 'general' NOT NULL,
	"document_type" text DEFAULT 'general' NOT NULL,
	"content_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"merge_fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "document_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"content_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"change_note" text,
	"saved_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"type" text DEFAULT 'general' NOT NULL,
	"template_id" text,
	"content_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"owner_id" integer,
	"app_source" text DEFAULT 'general' NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"merge_field_values" jsonb DEFAULT '{}'::jsonb,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pdf_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" text NOT NULL,
	"title" text NOT NULL,
	"template_id" text NOT NULL,
	"app_source" text DEFAULT 'general' NOT NULL,
	"total_jobs" integer DEFAULT 0 NOT NULL,
	"completed_jobs" integer DEFAULT 0 NOT NULL,
	"failed_jobs" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"zip_url" text,
	"requested_by_id" integer,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pdf_batches_batch_id_unique" UNIQUE("batch_id")
);
--> statement-breakpoint
CREATE TABLE "pdf_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" text NOT NULL,
	"template_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_data" jsonb DEFAULT '{}'::jsonb,
	"app_source" text DEFAULT 'general' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"output_url" text,
	"output_filename" text,
	"error" text,
	"scheduled_for" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"requested_by_id" integer,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signatures" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"signer_email" text NOT NULL,
	"signer_name" text NOT NULL,
	"signing_order" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"signature_data" text,
	"signature_type" text,
	"signed_at" timestamp,
	"viewed_at" timestamp,
	"declined_at" timestamp,
	"expires_at" timestamp,
	"ip_address" text,
	"user_agent" text,
	"browser_fingerprint" text,
	"consent_given" boolean DEFAULT false NOT NULL,
	"audit_hash" text,
	"signing_token" text,
	"reminder_sent_at" timestamp,
	"docusign_envelope_id" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "signatures_signing_token_unique" UNIQUE("signing_token")
);
--> statement-breakpoint
CREATE TABLE "dreamscape_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"file_url" text,
	"thumbnail_url" text,
	"width" integer,
	"height" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dreamscape_campaign_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"file_url" text,
	"thumbnail_url" text,
	"file_size" integer,
	"mime_type" text,
	"tags" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dreamscape_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"client_name" text,
	"status" text DEFAULT 'concept' NOT NULL,
	"category" text NOT NULL,
	"target_audience" text,
	"deadline" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dreamscape_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"client_name" text,
	"type" text NOT NULL,
	"status" text DEFAULT 'concept' NOT NULL,
	"mood" text,
	"color_palette" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dreamscape_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"campaign_id" integer,
	"asset_id" integer,
	"reviewer_name" text NOT NULL,
	"comment" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dreamscape_scripts" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dreamscape_storyboards" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"script_id" integer,
	"title" text NOT NULL,
	"description" text,
	"scene_number" integer NOT NULL,
	"visual_description" text,
	"dialogue" text,
	"duration" text,
	"thumbnail_url" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dreamscape_voice_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"name" text NOT NULL,
	"voice_id" text,
	"provider" text DEFAULT 'placeholder' NOT NULL,
	"text" text,
	"audio_url" text,
	"duration" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drift_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"measured_at" timestamp DEFAULT now() NOT NULL,
	"overall_drift_score" real NOT NULL,
	"status" text NOT NULL,
	"summary" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_suppressions" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"reason" text NOT NULL,
	"provider_event_id" text,
	"provider" text,
	"detail" text,
	"suppressed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_suppressions_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"name" text NOT NULL,
	"source_app" text NOT NULL,
	"external_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"tags" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "entity_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"key" text NOT NULL,
	"value" jsonb,
	"source_app" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_entity_id" uuid NOT NULL,
	"to_entity_id" uuid NOT NULL,
	"relationship_type" text NOT NULL,
	"strength" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"tag" text NOT NULL,
	"tagged_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enterprise_idp_registry" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"issuer_url" text NOT NULL,
	"jwks_uri" text NOT NULL,
	"expected_audience" text NOT NULL,
	"allowed_redirect_uris" jsonb DEFAULT '[]',
	"claims_to_role_mapping" jsonb DEFAULT '{}',
	"auto_provision_users" boolean DEFAULT false NOT NULL,
	"default_role" text DEFAULT 'viewer' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"jwks_cache_ttl_seconds" integer DEFAULT 3600 NOT NULL,
	"require_email_verified" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_enterprise_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer,
	"idp_id" integer,
	"event_type" text NOT NULL,
	"issuer" text,
	"subject" text,
	"email" text,
	"mapped_role" text,
	"mcp_scope" text,
	"user_id" integer,
	"error_code" text,
	"error_message" text,
	"metadata" jsonb DEFAULT '{}',
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_revoked_subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer,
	"idp_id" integer,
	"issuer" text NOT NULL,
	"subject" text NOT NULL,
	"revoked_at" timestamp DEFAULT now() NOT NULL,
	"revoked_by" text,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "eval_forge_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"suite_id" text NOT NULL,
	"suite_name" text,
	"domain" text,
	"eval_type" text,
	"model" text,
	"triggered_by" text DEFAULT 'api' NOT NULL,
	"total_cases" integer DEFAULT 0 NOT NULL,
	"passed" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"pass_rate" real DEFAULT 0 NOT NULL,
	"avg_score" real DEFAULT 0 NOT NULL,
	"avg_latency_ms" real DEFAULT 0 NOT NULL,
	"total_cost_usd" real DEFAULT 0 NOT NULL,
	"total_tokens_used" integer DEFAULT 0 NOT NULL,
	"metrics" jsonb,
	"case_results" jsonb,
	"has_regression" boolean DEFAULT false,
	"regression_severity" text,
	"regression_notes" text[] DEFAULT '{}' NOT NULL,
	"improvement_notes" text[] DEFAULT '{}' NOT NULL,
	"baseline_run_id" text,
	"run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "eval_forge_runs_run_id_unique" UNIQUE("run_id")
);
--> statement-breakpoint
CREATE TABLE "eval_forge_suites" (
	"id" serial PRIMARY KEY NOT NULL,
	"suite_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"domain" text NOT NULL,
	"eval_type" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"case_count" integer DEFAULT 0 NOT NULL,
	"red_team_count" integer DEFAULT 0 NOT NULL,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "eval_forge_suites_suite_id_unique" UNIQUE("suite_id")
);
--> statement-breakpoint
CREATE TABLE "eval_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"suite_id" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"domain" "eval_domain" NOT NULL,
	"grader_type" "eval_grader_type" NOT NULL,
	"input" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ground_truth" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expected_outcome" text DEFAULT 'pass' NOT NULL,
	"policies" text[] DEFAULT '{}' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"is_red_team" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"weight" real DEFAULT 1 NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "eval_cases_case_id_unique" UNIQUE("case_id")
);
--> statement-breakpoint
CREATE TABLE "eval_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"model" text NOT NULL,
	"total_tests" integer NOT NULL,
	"passed" integer NOT NULL,
	"failed" integer NOT NULL,
	"pass_rate" text NOT NULL,
	"avg_latency_ms" integer NOT NULL,
	"by_category" jsonb NOT NULL,
	"results" jsonb NOT NULL,
	"triggered_by" text DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "eval_runs_run_id_unique" UNIQUE("run_id")
);
--> statement-breakpoint
CREATE TABLE "eval_scores" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "eval_scores_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"score_id" text NOT NULL,
	"run_id" text NOT NULL,
	"case_id" text NOT NULL,
	"suite_id" text NOT NULL,
	"domain" "eval_domain" NOT NULL,
	"grader_type" "eval_grader_type" NOT NULL,
	"passed" boolean NOT NULL,
	"score" real NOT NULL,
	"expected_outcome" text DEFAULT 'pass' NOT NULL,
	"input" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ground_truth" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"latency_ms" real DEFAULT 0 NOT NULL,
	"tokens_used" integer DEFAULT 0 NOT NULL,
	"cost_usd" real DEFAULT 0 NOT NULL,
	"model" text,
	"trace_id" text,
	"human_label" text,
	"human_notes" text,
	"human_labeled_by" text,
	"human_labeled_at" timestamp,
	"failure_reason" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "eval_scores_score_id_unique" UNIQUE("score_id")
);
--> statement-breakpoint
CREATE TABLE "eval_suites" (
	"id" serial PRIMARY KEY NOT NULL,
	"suite_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"domain" "eval_domain" NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"latest_version" integer DEFAULT 1 NOT NULL,
	"grader_types" text[] DEFAULT '{}' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "eval_suites_suite_id_unique" UNIQUE("suite_id")
);
--> statement-breakpoint
CREATE TABLE "export_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"export_id" text NOT NULL,
	"name" text NOT NULL,
	"data_source" text NOT NULL,
	"format" text DEFAULT 'csv' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"triggered_by_user_id" integer,
	"triggered_by_email" text,
	"filter_params" text,
	"row_count" integer,
	"file_size_bytes" bigint,
	"download_token" text,
	"expires_at" timestamp,
	"error_message" text,
	"schedule_frequency" text DEFAULT 'once' NOT NULL,
	"next_run_at" timestamp,
	"completed_at" timestamp,
	"download_url" text,
	"storage_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "export_jobs_export_id_unique" UNIQUE("export_id")
);
--> statement-breakpoint
CREATE TABLE "feature_flag_overrides" (
	"id" serial PRIMARY KEY NOT NULL,
	"flag_id" integer NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"is_enabled" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"rollout_percentage" integer DEFAULT 0 NOT NULL,
	"conditions" jsonb,
	"scope" text DEFAULT 'global' NOT NULL,
	"targeting_json" jsonb,
	"product" text,
	"required_platform_role" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "flag_check_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"flag_key" text NOT NULL,
	"user_id" integer,
	"org_id" integer,
	"result" boolean NOT NULL,
	"source" text NOT NULL,
	"caller_tag" text,
	"checked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_survey_prefs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"last_nps_survey_at" timestamp,
	"nps_snoozed_until" timestamp,
	"nps_opt_out" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_survey_prefs_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"type" text NOT NULL,
	"score" integer,
	"sentiment" text,
	"comment" text,
	"app_name" text,
	"page_url" text,
	"user_role" text,
	"dismissed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tags" text[],
	"linked_entity" text,
	"linked_entity_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"org_id" integer,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" bigint NOT NULL,
	"storage_url" text NOT NULL,
	"storage_key" text NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"scan_status" text DEFAULT 'pending' NOT NULL,
	"quarantined_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fine_tuned_model_registry" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"job_id" text NOT NULL,
	"base_model" text NOT NULL,
	"provider" text NOT NULL,
	"dataset_version" text NOT NULL,
	"lifecycle" text DEFAULT 'staging' NOT NULL,
	"eval_pass_rate" real,
	"eval_scores" jsonb,
	"base_model_eval_scores" jsonb,
	"cost_per_1k_input" real,
	"cost_per_1k_output" real,
	"is_active" boolean DEFAULT true NOT NULL,
	"canary_traffic_pct" integer DEFAULT 10,
	"canary_requests_total" integer DEFAULT 0,
	"canary_requests_success" integer DEFAULT 0,
	"canary_started_at" timestamp with time zone,
	"canary_promote_threshold" integer DEFAULT 100,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"promoted_at" timestamp with time zone,
	"deprecated_at" timestamp with time zone,
	CONSTRAINT "fine_tuned_model_registry_model_id_unique" UNIQUE("model_id")
);
--> statement-breakpoint
CREATE TABLE "fine_tuning_datasets" (
	"id" serial PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"agent_id" text NOT NULL,
	"domain" text NOT NULL,
	"format" text DEFAULT 'openai-jsonl' NOT NULL,
	"sample_count" integer DEFAULT 0 NOT NULL,
	"source_breakdown" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"quality_report" jsonb,
	"exported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fine_tuning_datasets_version_unique" UNIQUE("version")
);
--> statement-breakpoint
CREATE TABLE "fine_tuning_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"provider" text NOT NULL,
	"base_model" text NOT NULL,
	"fine_tuned_model_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"dataset_version" text NOT NULL,
	"dataset_size" integer DEFAULT 0 NOT NULL,
	"hyperparameters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"eval_scores" jsonb,
	"base_model_eval_scores" jsonb,
	"promoted_to_lifecycle" text,
	"training_cost_usd" real,
	"error_message" text,
	"triggered_by" text DEFAULT 'manual',
	"quality_gate_passed" boolean,
	"quality_report" jsonb,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"validated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fine_tuning_jobs_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "fine_tuning_trigger_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"correction_threshold" integer DEFAULT 50 NOT NULL,
	"eval_score_drop_threshold" real DEFAULT 0.05 NOT NULL,
	"calibration_bias_threshold" real DEFAULT 0.15 NOT NULL,
	"cooldown_hours" integer DEFAULT 24 NOT NULL,
	"last_triggered_at" timestamp with time zone,
	"last_checked_at" timestamp with time zone,
	"last_decision" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fine_tuning_trigger_configs_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "firestorm_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"severity" text DEFAULT 'medium' NOT NULL,
	"source" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"related_cve" text,
	"related_incident_id" integer,
	"metadata" jsonb,
	"acknowledged_at" timestamp,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firestorm_analyst_notebook" (
	"id" serial PRIMARY KEY NOT NULL,
	"note_id" text NOT NULL,
	"case_id" text,
	"incident_id" text,
	"decision_object_id" text,
	"content" text NOT NULL,
	"author" text NOT NULL,
	"note_type" text DEFAULT 'general' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"note_references" jsonb DEFAULT '[]'::jsonb,
	"is_key" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "firestorm_analyst_notebook_note_id_unique" UNIQUE("note_id")
);
--> statement-breakpoint
CREATE TABLE "firestorm_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"spend" numeric(10, 2) DEFAULT '0',
	"revenue" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firestorm_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"assessment_type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"scope" text,
	"target_environment" text,
	"assessor_name" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"overall_risk_score" numeric(5, 2),
	"executive_summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firestorm_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"asset_type" text NOT NULL,
	"owner" text NOT NULL,
	"team" text,
	"environment" text DEFAULT 'production' NOT NULL,
	"exposure_level" text DEFAULT 'internal' NOT NULL,
	"risk_score" numeric(4, 1) DEFAULT '0' NOT NULL,
	"critical_findings" integer DEFAULT 0 NOT NULL,
	"high_findings" integer DEFAULT 0 NOT NULL,
	"last_scanned_at" timestamp,
	"tags" jsonb,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firestorm_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"budget" numeric(12, 2),
	"spent" numeric(12, 2) DEFAULT '0',
	"start_date" timestamp,
	"end_date" timestamp,
	"target_audience" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firestorm_case_memory" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"incident_id" text,
	"phase" text DEFAULT 'detection' NOT NULL,
	"phase_history" jsonb DEFAULT '[]'::jsonb,
	"decisions" jsonb DEFAULT '[]'::jsonb,
	"evidence_snapshots" jsonb DEFAULT '[]'::jsonb,
	"analyst_notes" jsonb DEFAULT '[]'::jsonb,
	"change_log" jsonb DEFAULT '[]'::jsonb,
	"summary" jsonb DEFAULT '{}'::jsonb,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"last_updated_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "firestorm_case_memory_case_id_unique" UNIQUE("case_id")
);
--> statement-breakpoint
CREATE TABLE "firestorm_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_number" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'p3_medium' NOT NULL,
	"assigned_analyst" text,
	"related_incident_ids" jsonb DEFAULT '[]'::jsonb,
	"related_finding_ids" jsonb DEFAULT '[]'::jsonb,
	"sla_triage_minutes" integer DEFAULT 60 NOT NULL,
	"sla_resolve_minutes" integer DEFAULT 1440 NOT NULL,
	"triaged_at" timestamp,
	"resolved_at" timestamp,
	"notes" jsonb DEFAULT '[]'::jsonb,
	"evidence" jsonb DEFAULT '[]'::jsonb,
	"audit_trail" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "firestorm_cases_case_number_unique" UNIQUE("case_number")
);
--> statement-breakpoint
CREATE TABLE "firestorm_compliance_controls" (
	"id" serial PRIMARY KEY NOT NULL,
	"framework" text NOT NULL,
	"category" text NOT NULL,
	"control_id" text NOT NULL,
	"control_name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'not_implemented' NOT NULL,
	"evidence_notes" text,
	"owner" text,
	"due_date" timestamp,
	"audit_trail" jsonb DEFAULT '[]'::jsonb,
	"last_assessed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firestorm_findings" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer NOT NULL,
	"simulation_run_id" integer,
	"title" text NOT NULL,
	"description" text,
	"severity" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"category" text,
	"affected_asset" text,
	"impact" text,
	"recommendation" text,
	"cvss_score" numeric(4, 2),
	"evidence" jsonb,
	"remediation_owner" text,
	"due_date" timestamp,
	"audit_trail" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firestorm_hardening_controls" (
	"id" serial PRIMARY KEY NOT NULL,
	"control_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"status" text DEFAULT 'not_implemented' NOT NULL,
	"priority" text DEFAULT 'high' NOT NULL,
	"owner" text,
	"linked_assets" jsonb DEFAULT '[]'::jsonb,
	"recommended_action" text,
	"due_date" timestamp,
	"audit_trail" jsonb DEFAULT '[]'::jsonb,
	"last_reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "firestorm_hardening_controls_control_id_unique" UNIQUE("control_id")
);
--> statement-breakpoint
CREATE TABLE "firestorm_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"severity" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'detection' NOT NULL,
	"assigned_analyst" text,
	"affected_assets" jsonb,
	"related_finding_ids" jsonb,
	"attack_technique" text,
	"timeline" jsonb,
	"notes" text,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firestorm_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"company" text,
	"title" text,
	"phone" text,
	"source" text,
	"score" integer DEFAULT 0,
	"status" text DEFAULT 'new' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firestorm_mitre_detections" (
	"id" serial PRIMARY KEY NOT NULL,
	"technique_id" text NOT NULL,
	"technique_name" text NOT NULL,
	"tactic" text NOT NULL,
	"detection_count" integer DEFAULT 0 NOT NULL,
	"incident_count" integer DEFAULT 0 NOT NULL,
	"last_detected_at" timestamp,
	"coverage_status" text DEFAULT 'not_covered' NOT NULL,
	"related_incident_ids" jsonb DEFAULT '[]'::jsonb,
	"related_finding_ids" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firestorm_risk_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer NOT NULL,
	"category" text NOT NULL,
	"likelihood" integer NOT NULL,
	"impact" integer NOT NULL,
	"current_score" numeric(5, 2) NOT NULL,
	"residual_score" numeric(5, 2),
	"trend" text DEFAULT 'stable' NOT NULL,
	"notes" text,
	"calculated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firestorm_scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"complexity" text DEFAULT 'intermediate' NOT NULL,
	"attack_vector" text,
	"mitre_technique" text,
	"prerequisites" jsonb,
	"expected_duration" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firestorm_simulation_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer,
	"scenario_id" integer,
	"name" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"mode" text DEFAULT 'controlled' NOT NULL,
	"parameters" jsonb,
	"results" jsonb,
	"duration_seconds" integer,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firestorm_tool_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"log_id" text NOT NULL,
	"tool_name" text NOT NULL,
	"called_by" text DEFAULT 'alloy' NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"execution_mode" text DEFAULT 'propose_only' NOT NULL,
	"policy_checked" boolean DEFAULT true NOT NULL,
	"approval_required" boolean DEFAULT false NOT NULL,
	"approval_status" text DEFAULT 'not_required' NOT NULL,
	"result" text NOT NULL,
	"arguments" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output" jsonb DEFAULT 'null'::jsonb,
	"error" text,
	"related_decision_id" text,
	"related_case_id" text,
	"related_incident_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "firestorm_tool_audit_log_log_id_unique" UNIQUE("log_id")
);
--> statement-breakpoint
CREATE TABLE "firestorm_tradecraft_decisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"object_id" text NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"case_id" text,
	"incident_id" text,
	"signal_id" text,
	"decision_type" text NOT NULL,
	"policy_class" text NOT NULL,
	"schema_version" text DEFAULT '2.0.0' NOT NULL,
	"summary" text NOT NULL,
	"issue_statement" text NOT NULL,
	"evidence_refs" jsonb DEFAULT '[]'::jsonb,
	"evidence_quality" text DEFAULT 'low' NOT NULL,
	"assumptions" jsonb DEFAULT '[]'::jsonb,
	"alternatives" jsonb DEFAULT '[]'::jsonb,
	"confidence" numeric(4, 3) DEFAULT '0' NOT NULL,
	"confidence_label" text DEFAULT 'low' NOT NULL,
	"confidence_statement" text,
	"gaps_and_unknowns" jsonb DEFAULT '[]'::jsonb,
	"impact_level" text DEFAULT 'medium' NOT NULL,
	"urgency" text DEFAULT 'standard' NOT NULL,
	"recommended_action" text NOT NULL,
	"owner_suggestion" text,
	"approval_required" boolean DEFAULT false NOT NULL,
	"approval_reason" text,
	"human_review_required" boolean DEFAULT true NOT NULL,
	"human_review_reason" text,
	"model_route" text DEFAULT 'unknown' NOT NULL,
	"raw_output" text,
	"decision_payload" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"rejected_by" text,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "firestorm_tradecraft_decisions_object_id_unique" UNIQUE("object_id")
);
--> statement-breakpoint
CREATE TABLE "firestorm_tradecraft_validation_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"audit_id" text NOT NULL,
	"decision_type" text NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"case_id" text,
	"incident_id" text,
	"validation_errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"raw_output" text,
	"raw_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"model_route" text DEFAULT 'unknown' NOT NULL,
	"error_class" text DEFAULT 'schema_validation' NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "firestorm_tradecraft_validation_audit_audit_id_unique" UNIQUE("audit_id")
);
--> statement-breakpoint
CREATE TABLE "firestorm_workflow_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer NOT NULL,
	"action_type" text NOT NULL,
	"assigned_to" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"triggered_by" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forge_agent_tool_permissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar NOT NULL,
	"tool_id" varchar NOT NULL,
	"env_tier" varchar(40) NOT NULL,
	"allowed" boolean DEFAULT true NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forge_agent_versions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar NOT NULL,
	"version" integer NOT NULL,
	"model_id" varchar,
	"prompt_version_id" varchar,
	"tool_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"system_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"evals_passed" boolean DEFAULT false NOT NULL,
	"observability_hook_configured" boolean DEFAULT false NOT NULL,
	"provenance_complete" boolean DEFAULT false NOT NULL,
	"created_by" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forge_agents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"domain" varchar(80) DEFAULT 'general' NOT NULL,
	"risk_tier" varchar(40) DEFAULT 'standard' NOT NULL,
	"owner_user_id" integer,
	"org_id" integer,
	"status" varchar(40) DEFAULT 'draft' NOT NULL,
	"current_env" varchar(40) DEFAULT 'dev' NOT NULL,
	"active_version_id" varchar,
	"policy_pack_id" varchar,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_seed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "forge_agents_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "forge_audit_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar,
	"actor_user_id" integer,
	"actor_role" varchar(80),
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(80) NOT NULL,
	"resource_id" varchar,
	"before" jsonb,
	"after" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forge_deployment_targets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" text NOT NULL,
	"kind" varchar(60) NOT NULL,
	"region" varchar(80),
	"compute_profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"package_lock" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"required_secrets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"storage_deps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"compliance_notes" text,
	"allowed_integrations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "forge_deployment_targets_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "forge_drift_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar NOT NULL,
	"env_id" varchar NOT NULL,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"drift_score" numeric(5, 2) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"dimension" varchar(40) NOT NULL,
	"expected_fingerprint" text,
	"observed_fingerprint" text,
	"findings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"remediation" text,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "forge_environment_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" text NOT NULL,
	"tier" varchar(40) NOT NULL,
	"target_id" varchar,
	"observability_hook" varchar(200),
	"require_approval" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "forge_environment_profiles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "forge_environment_snapshots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"env_id" varchar NOT NULL,
	"captured_at" timestamp DEFAULT now() NOT NULL,
	"agent_inventory" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"model_inventory" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tool_inventory" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"secrets_fingerprint" text,
	"hash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forge_execution_artifacts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_id" varchar NOT NULL,
	"kind" varchar(40) NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forge_execution_runs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar NOT NULL,
	"version_id" varchar NOT NULL,
	"env_tier" varchar(40) NOT NULL,
	"model_id" varchar,
	"prompt_version_id" varchar,
	"status" varchar(40) NOT NULL,
	"outcome" varchar(80),
	"latency_ms" integer,
	"input_tokens" integer,
	"output_tokens" integer,
	"tool_calls" integer DEFAULT 0 NOT NULL,
	"tool_failures" integer DEFAULT 0 NOT NULL,
	"policy_outcome" varchar(40),
	"human_override" boolean DEFAULT false NOT NULL,
	"value_at_risk_usd" numeric(14, 2),
	"provenance" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_seed" boolean DEFAULT false NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "forge_model_versions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" varchar NOT NULL,
	"version" varchar(80) NOT NULL,
	"released_at" timestamp,
	"notes" text,
	"approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forge_models" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" text NOT NULL,
	"provider" varchar(80) NOT NULL,
	"family" varchar(80),
	"context_window" integer,
	"input_cost_per_1k" numeric(12, 6),
	"output_cost_per_1k" numeric(12, 6),
	"approved" boolean DEFAULT false NOT NULL,
	"risk_tier" varchar(40) DEFAULT 'standard' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "forge_models_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "forge_policy_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_pack_id" varchar NOT NULL,
	"agent_id" varchar NOT NULL,
	"env_tier" varchar(40) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forge_policy_packs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"risk_tier" varchar(40) NOT NULL,
	"rules" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "forge_policy_packs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "forge_promotion_approvals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promotion_id" varchar NOT NULL,
	"approver_user_id" integer,
	"approver_role" varchar(80),
	"decision" varchar(20) NOT NULL,
	"note" text,
	"decided_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forge_promotions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar NOT NULL,
	"from_version_id" varchar,
	"to_version_id" varchar NOT NULL,
	"from_env" varchar(40) NOT NULL,
	"to_env" varchar(40) NOT NULL,
	"status" varchar(40) DEFAULT 'requested' NOT NULL,
	"requested_by" integer,
	"blockers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"validation_report" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"promoted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forge_prompt_versions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_id" varchar NOT NULL,
	"version" integer NOT NULL,
	"body" text NOT NULL,
	"evals_passed" boolean DEFAULT false NOT NULL,
	"eval_score" numeric(5, 2),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forge_prompts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" text NOT NULL,
	"purpose" text,
	"owner_user_id" integer,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "forge_prompts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "forge_rollback_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar NOT NULL,
	"from_version_id" varchar,
	"to_version_id" varchar,
	"env_tier" varchar(40) NOT NULL,
	"reason" text,
	"triggered_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forge_tools" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" varchar(80),
	"risk_level" varchar(40) DEFAULT 'low' NOT NULL,
	"schema" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "forge_tools_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "fusion_cortex_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"alert_id" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"severity" text NOT NULL,
	"category" text NOT NULL,
	"confidence" numeric(5, 4) NOT NULL,
	"affected_domains" text[] DEFAULT '{}' NOT NULL,
	"affected_entities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evidence_chain" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommended_actions" text[] DEFAULT '{}' NOT NULL,
	"advisory_context" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"pattern_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"generated_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fusion_cortex_alerts_alert_id_unique" UNIQUE("alert_id")
);
--> statement-breakpoint
CREATE TABLE "fund_inbound_deals" (
	"id" serial PRIMARY KEY NOT NULL,
	"pipeline_id" text NOT NULL,
	"company" text NOT NULL,
	"website" text,
	"sector" text NOT NULL,
	"stage" text NOT NULL,
	"ask_size" text,
	"valuation" text,
	"arr" text,
	"growth" text,
	"founder_name" text NOT NULL,
	"founder_email" text NOT NULL,
	"founder_background" text,
	"founder_education" text,
	"founder_prior_exits" text,
	"summary" text NOT NULL,
	"deck_url" text,
	"conviction_score" integer NOT NULL,
	"score_team" integer NOT NULL,
	"score_market" integer NOT NULL,
	"score_product" integer NOT NULL,
	"score_traction" integer NOT NULL,
	"score_competitive" integer NOT NULL,
	"score_financials" integer NOT NULL,
	"status" text DEFAULT 'screening' NOT NULL,
	"strengths" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"risks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source" text DEFAULT 'inbound' NOT NULL,
	"notes" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fund_inbound_deals_pipeline_id_unique" UNIQUE("pipeline_id")
);
--> statement-breakpoint
CREATE TABLE "fund_accredited_investors" (
	"id" serial PRIMARY KEY NOT NULL,
	"lp_name" text NOT NULL,
	"lp_type" text DEFAULT 'individual' NOT NULL,
	"accreditation_basis" text DEFAULT 'net_worth_1m' NOT NULL,
	"verification_method" text DEFAULT 'self_certification' NOT NULL,
	"verified_at" timestamp,
	"verification_expires_at" timestamp,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"contact_email" text,
	"contact_phone" text,
	"jurisdiction" text,
	"qualified_eligible_person" boolean DEFAULT false NOT NULL,
	"notes_internal" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_cap_table_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"action_type" text NOT NULL,
	"summary" text NOT NULL,
	"changed_by" text,
	"previous_state" jsonb,
	"new_state" jsonb,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_cap_table_holders" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"holder_type" text DEFAULT 'founder' NOT NULL,
	"email" text,
	"linked_lp_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_cap_table_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"holder_id" integer NOT NULL,
	"share_class_id" integer NOT NULL,
	"transaction_type" text NOT NULL,
	"shares" numeric(18, 0) NOT NULL,
	"price_per_share_cents" integer,
	"total_consideration_cents" integer,
	"transaction_date" text NOT NULL,
	"vesting_schedule_id" integer,
	"from_holder_id" integer,
	"notes" text,
	"document_reference" text,
	"is_audit_locked" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_capital_call_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"capital_call_id" integer NOT NULL,
	"lp_id" integer NOT NULL,
	"requested_cents" integer NOT NULL,
	"received_cents" integer DEFAULT 0 NOT NULL,
	"received_at" timestamp,
	"payment_reference" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_capital_calls" (
	"id" serial PRIMARY KEY NOT NULL,
	"call_number" integer NOT NULL,
	"call_date" text NOT NULL,
	"due_date" text NOT NULL,
	"total_amount_cents" integer NOT NULL,
	"purpose" text NOT NULL,
	"purpose_detail" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"funded_amount_cents" integer DEFAULT 0 NOT NULL,
	"notices_sent_at" timestamp,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_distribution_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"distribution_id" integer NOT NULL,
	"lp_id" integer NOT NULL,
	"amount_cents" integer NOT NULL,
	"return_of_capital_cents" integer DEFAULT 0 NOT NULL,
	"gain_cents" integer DEFAULT 0 NOT NULL,
	"carried_interest_cents" integer DEFAULT 0 NOT NULL,
	"payment_date" text,
	"payment_reference" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_distributions" (
	"id" serial PRIMARY KEY NOT NULL,
	"distribution_number" integer NOT NULL,
	"distribution_date" text NOT NULL,
	"total_amount_cents" integer NOT NULL,
	"distribution_type" text DEFAULT 'realized_gain' NOT NULL,
	"source" text,
	"status" text DEFAULT 'planned' NOT NULL,
	"waterfall_applied" boolean DEFAULT false NOT NULL,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_form_d_filings" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_name" text NOT NULL,
	"cik_number" text,
	"filing_type" text DEFAULT 'initial' NOT NULL,
	"exemption" text DEFAULT 'rule_506b' NOT NULL,
	"offering_amount" numeric(18, 2),
	"amount_sold" numeric(18, 2),
	"investor_count" integer,
	"date_of_first_sale" text,
	"filed_at" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"reg_d_status" text DEFAULT 'review_needed' NOT NULL,
	"edgar_link" text,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_lp_activity_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"lp_id" integer NOT NULL,
	"action" text NOT NULL,
	"target" text NOT NULL,
	"document_id" integer,
	"report_id" integer,
	"ip_address" text,
	"user_agent" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_lp_capital_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"lp_id" integer NOT NULL,
	"commitment_cents" integer DEFAULT 0 NOT NULL,
	"called_cents" integer DEFAULT 0 NOT NULL,
	"uncalled_cents" integer DEFAULT 0 NOT NULL,
	"distributions_cents" integer DEFAULT 0 NOT NULL,
	"current_nav_cents" integer DEFAULT 0 NOT NULL,
	"ownership_pct" numeric(8, 6),
	"management_fees_paid_cents" integer DEFAULT 0 NOT NULL,
	"carried_interest_paid_cents" integer DEFAULT 0 NOT NULL,
	"vintage" text,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_lp_data_room_docs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"folder" text NOT NULL,
	"file_type" text DEFAULT 'pdf' NOT NULL,
	"size_label" text DEFAULT '0 MB' NOT NULL,
	"uploaded_at" text NOT NULL,
	"permission_tier" text DEFAULT 'all_lp' NOT NULL,
	"watermarked" boolean DEFAULT false NOT NULL,
	"source_uri" text,
	"uploaded_by" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_lp_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"lp_id" integer NOT NULL,
	"from_role" text NOT NULL,
	"author_name" text NOT NULL,
	"body" text NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_lp_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_type" text DEFAULT 'quarterly' NOT NULL,
	"reporting_period" text NOT NULL,
	"period_start" text NOT NULL,
	"period_end" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"gross_irr" numeric(8, 4),
	"net_irr" numeric(8, 4),
	"tvpi" numeric(8, 4),
	"dpi" numeric(8, 4),
	"rvpi" numeric(8, 4),
	"pme" numeric(8, 4),
	"fund_nav" numeric(18, 2),
	"total_commitments" numeric(18, 2),
	"called_capital" numeric(18, 2),
	"distributed_capital" numeric(18, 2),
	"unrealized_value" numeric(18, 2),
	"management_fees_accrued" numeric(18, 2),
	"management_fees_paid" numeric(18, 2),
	"carried_interest_accrued" numeric(18, 2),
	"carried_interest_paid" numeric(18, 2),
	"preferred_return_accrued" numeric(18, 2),
	"preferred_return_rate" numeric(6, 4),
	"carry_rate" numeric(6, 4),
	"management_fee_rate" numeric(6, 4),
	"narrative_summary" text,
	"disclosures" text,
	"disclaimers" text,
	"approved_by" text,
	"approved_at" timestamp,
	"distributed_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_lp_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"lp_id" integer NOT NULL,
	"uploaded_by_user_id" integer,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text DEFAULT 'application/octet-stream' NOT NULL,
	"size" bigint DEFAULT 0 NOT NULL,
	"storage_key" text NOT NULL,
	"doc_type" text DEFAULT 'other' NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"notes" text,
	"reviewed_by_user_id" integer,
	"reviewed_at" timestamp with time zone,
	"is_demo" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_nav_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"nav_date" text NOT NULL,
	"total_nav_cents" bigint NOT NULL,
	"called_capital_cents" bigint NOT NULL,
	"uncalled_commitments_cents" bigint DEFAULT 0 NOT NULL,
	"distributed_cents" bigint DEFAULT 0 NOT NULL,
	"unrealized_value_cents" bigint DEFAULT 0 NOT NULL,
	"management_fees_paid_cents" bigint DEFAULT 0 NOT NULL,
	"carry_accrued_cents" bigint DEFAULT 0 NOT NULL,
	"gross_irr" numeric(8, 4),
	"net_irr" numeric(8, 4),
	"tvpi" numeric(8, 4),
	"dpi" numeric(8, 4),
	"rvpi" numeric(8, 4),
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_portfolio_financials" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_slug" text NOT NULL,
	"company_name" text NOT NULL,
	"period_type" text DEFAULT 'quarterly' NOT NULL,
	"period_label" text NOT NULL,
	"period_start" text NOT NULL,
	"period_end" text NOT NULL,
	"reporting_status" text DEFAULT 'draft' NOT NULL,
	"revenue" numeric(18, 2),
	"revenue_prior_period" numeric(18, 2),
	"gross_profit" numeric(18, 2),
	"gross_margin_pct" numeric(8, 4),
	"operating_expenses" numeric(18, 2),
	"ebitda" numeric(18, 2),
	"net_income" numeric(18, 2),
	"cogs" numeric(18, 2),
	"sales_marketing_expense" numeric(18, 2),
	"rd_expense" numeric(18, 2),
	"ga_expense" numeric(18, 2),
	"cash_and_equivalents" numeric(18, 2),
	"total_assets" numeric(18, 2),
	"total_liabilities" numeric(18, 2),
	"total_equity" numeric(18, 2),
	"accounts_receivable" numeric(18, 2),
	"accounts_payable" numeric(18, 2),
	"deferred_revenue" numeric(18, 2),
	"operating_cash_flow" numeric(18, 2),
	"investing_cash_flow" numeric(18, 2),
	"financing_cash_flow" numeric(18, 2),
	"free_cash_flow" numeric(18, 2),
	"burn_rate" numeric(18, 2),
	"runway_months" numeric(6, 1),
	"capital_raised" numeric(18, 2),
	"notes" text,
	"metadata" jsonb,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_portfolio_kpis" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_slug" text NOT NULL,
	"company_name" text NOT NULL,
	"period_label" text NOT NULL,
	"period_start" text NOT NULL,
	"period_end" text NOT NULL,
	"mrr" numeric(18, 2),
	"arr" numeric(18, 2),
	"mrr_growth_pct" numeric(8, 4),
	"total_customers" integer,
	"new_customers" integer,
	"churned_customers" integer,
	"churn_rate_pct" numeric(8, 4),
	"net_revenue_retention_pct" numeric(8, 4),
	"cac" numeric(18, 2),
	"ltv" numeric(18, 2),
	"ltv_cac_ratio" numeric(8, 4),
	"magic_number" numeric(8, 4),
	"payback_period_months" numeric(6, 1),
	"avg_contract_value" numeric(18, 2),
	"headcount" integer,
	"revenue_per_employee" numeric(18, 2),
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_share_classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"class_type" text DEFAULT 'common' NOT NULL,
	"issued_shares" numeric(18, 0),
	"authorized_shares" numeric(18, 0),
	"par_value_cents" integer DEFAULT 0,
	"liquidation_preference_pct" numeric(8, 4),
	"liquidation_multiple" numeric(6, 2),
	"participation_cap" text,
	"is_participating" boolean DEFAULT false NOT NULL,
	"anti_dilution_provision" text DEFAULT 'none' NOT NULL,
	"conversion_ratio" numeric(8, 4) DEFAULT '1',
	"votes_per_share" numeric(8, 4) DEFAULT '1',
	"dividend_rate_pct" numeric(8, 4),
	"seniority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_vesting_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"holder_id" integer NOT NULL,
	"share_class_id" integer,
	"grant_date" text NOT NULL,
	"total_shares" numeric(18, 0) NOT NULL,
	"vested_shares" numeric(18, 0) DEFAULT '0' NOT NULL,
	"vesting_period_months" integer DEFAULT 48 NOT NULL,
	"cliff_months" integer DEFAULT 12 NOT NULL,
	"acceleration_trigger" text DEFAULT 'none' NOT NULL,
	"last_calculated_at" timestamp,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geo_intel_pins" (
	"id" text PRIMARY KEY NOT NULL,
	"layer" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"label" text NOT NULL,
	"sublabel" text NOT NULL,
	"classification" text NOT NULL,
	"threat" text NOT NULL,
	"stale" boolean DEFAULT false NOT NULL,
	"detail_summary" text NOT NULL,
	"detail_source" text NOT NULL,
	"detail_timestamp" text NOT NULL,
	"detail_confidence" integer NOT NULL,
	"detail_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"name" text NOT NULL,
	"description" text,
	"policy_type" text NOT NULL,
	"scope" text DEFAULT 'tenant' NOT NULL,
	"rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"compliance_framework" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cost_budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"name" text NOT NULL,
	"budget_type" text DEFAULT 'monthly' NOT NULL,
	"limit_amount" numeric(12, 2) NOT NULL,
	"current_spend" numeric(12, 2) DEFAULT '0' NOT NULL,
	"warn_threshold" numeric(5, 2) DEFAULT '0.80' NOT NULL,
	"hard_stop_threshold" numeric(5, 2) DEFAULT '1.00' NOT NULL,
	"alert_sent_80" boolean DEFAULT false NOT NULL,
	"alert_sent_100" boolean DEFAULT false NOT NULL,
	"period_start" timestamp DEFAULT now() NOT NULL,
	"period_end" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cost_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"budget_id" integer,
	"event_type" text NOT NULL,
	"resource_id" text,
	"resource_name" text,
	"model_provider" text,
	"model_id" text,
	"tokens_in" integer DEFAULT 0,
	"tokens_out" integer DEFAULT 0,
	"cost_usd" numeric(10, 6) DEFAULT '0' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governance_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"policy_id" integer,
	"severity" text DEFAULT 'medium' NOT NULL,
	"incident_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"agent_id" text,
	"user_id" text,
	"resource_type" text,
	"resource_id" text,
	"resolution" text,
	"resolved_by" text,
	"resolved_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_routing_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"name" text NOT NULL,
	"model_provider" text NOT NULL,
	"model_id" text NOT NULL,
	"task_categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"max_cost_per_call" numeric(10, 4),
	"is_allowed" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"environment" text DEFAULT 'production' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guardian_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"agent_id" text,
	"session_id" text,
	"workflow_id" text,
	"org_id" integer,
	"tier" text NOT NULL,
	"action" text NOT NULL,
	"tool_id" text,
	"model" text,
	"environment" text,
	"outcome" text NOT NULL,
	"matched_rule_id" text,
	"reason" text NOT NULL,
	"rollback_required" boolean DEFAULT false NOT NULL,
	"rollback_token" text,
	"redact_applied" boolean DEFAULT false NOT NULL,
	"control_violations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"decided_at" timestamp DEFAULT now() NOT NULL,
	"executed_at" timestamp,
	"rolled_back_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guardian_actions_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "guardian_approval_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"agent_id" text,
	"session_id" text,
	"workflow_id" text,
	"org_id" integer,
	"tier" text NOT NULL,
	"action" text NOT NULL,
	"tool_id" text,
	"approval_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"required_approvers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"approvals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guardian_approval_requests_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "guardian_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"name" text NOT NULL,
	"description" text,
	"tier" text NOT NULL,
	"conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"action" text NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"owner" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allowed_models" jsonb,
	"allowed_tools" jsonb,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guardian_policy_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"policy_id" integer NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" text NOT NULL,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"granted_by_id" integer,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guardian_tiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"tier" text NOT NULL,
	"tier_number" integer NOT NULL,
	"description" text NOT NULL,
	"risk_level" integer NOT NULL,
	"controls" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guardrail_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"guardrail_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"guardrail_type" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"applies_to_tier" text,
	"enforcement" text DEFAULT 'enforce' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_by_id" integer,
	"updated_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_mesh_action_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"tool_id" text NOT NULL,
	"action" text NOT NULL,
	"agent_id" text,
	"session_id" text,
	"workflow_id" text,
	"org_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"policy_id" integer,
	"decision_reason" text,
	"requested_by_id" integer,
	"approved_by_id" integer,
	"approved_at" timestamp,
	"rejected_by_id" integer,
	"rejected_at" timestamp,
	"expires_at" timestamp,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tool_mesh_action_approvals_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "tool_mesh_tool_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tool_db_id" integer NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" text NOT NULL,
	"permission" text DEFAULT 'invoke' NOT NULL,
	"granted_by_id" integer,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_mesh_tool_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tool_db_id" integer NOT NULL,
	"version" text NOT NULL,
	"changelog" text,
	"schema_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_mesh_tools" (
	"id" serial PRIMARY KEY NOT NULL,
	"tool_id" text NOT NULL,
	"name" text NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"description" text NOT NULL,
	"domain_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"policy_tier" text NOT NULL,
	"allowed_environments" jsonb DEFAULT '["development","staging","production"]'::jsonb NOT NULL,
	"input_schema" jsonb,
	"output_schema" jsonb,
	"rate_limits" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"timeout_ms" integer DEFAULT 30000 NOT NULL,
	"failure_modes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"approval_required" boolean DEFAULT false NOT NULL,
	"owner" text,
	"observability_hooks" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tool_mesh_tools_tool_id_unique" UNIQUE("tool_id")
);
--> statement-breakpoint
CREATE TABLE "health_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"service" text NOT NULL,
	"status" text NOT NULL,
	"response_time_ms" integer,
	"details" jsonb,
	"checked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holdings_inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holdings_leadership" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"bio" text,
	"image_url" text,
	"linked_in" text,
	"sort_order" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holdings_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"venture_id" integer,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"change" text,
	"period" text,
	"category" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holdings_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"venture_id" integer,
	"title" text NOT NULL,
	"description" text,
	"date" text,
	"category" text,
	"icon" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holdings_ventures" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sector" text,
	"status" text DEFAULT 'active' NOT NULL,
	"stage" text,
	"founded" text,
	"website" text,
	"logo" text,
	"color" text,
	"metrics" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "holdings_ventures_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "inca_datasets" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"name" text NOT NULL,
	"description" text,
	"size" text,
	"format" text,
	"source" text,
	"record_count" integer,
	"status" text DEFAULT 'raw' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inca_experiments" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"hypothesis" text,
	"results" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"hyperparameters" jsonb,
	"start_date" text,
	"end_date" text,
	"duration" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inca_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"source_experiment" text,
	"confidence" integer,
	"impact" text DEFAULT 'medium' NOT NULL,
	"date" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inca_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"architecture" text,
	"version" text,
	"accuracy" numeric(5, 2),
	"speed" integer,
	"cost" integer,
	"robustness" integer,
	"interpretability" integer,
	"parameters" text,
	"training_data" text,
	"status" text DEFAULT 'training' NOT NULL,
	"last_trained" text,
	"performance_history" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inca_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'research' NOT NULL,
	"domain" text,
	"accuracy" numeric(5, 2),
	"loss" numeric(8, 6),
	"inference_time" integer,
	"start_date" text,
	"last_updated" text,
	"progress" integer DEFAULT 0,
	"team" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "findings" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"signal_id" integer,
	"title" text NOT NULL,
	"summary" text,
	"confidence_score" numeric(5, 2),
	"severity" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inca_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"finding_id" integer,
	"title" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"triggered_at" timestamp DEFAULT now() NOT NULL,
	"metadata_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inca_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"title" text NOT NULL,
	"report_type" text NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"report_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investigation_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"investigation_id" integer NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investigations" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'open' NOT NULL,
	"owner_user_id" integer,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"source_key" text,
	"title" text NOT NULL,
	"description" text,
	"severity" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"metadata_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intelligence_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"invited_by_user_id" integer NOT NULL,
	"accepted_by_user_id" integer,
	"email" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"token" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "org_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "agent_execution_contexts" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_run_at" timestamp,
	"last_run_id" text,
	"run_count" integer DEFAULT 0 NOT NULL,
	"total_duration_ms" bigint DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_execution_contexts_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "dead_letter_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"original_job_id" text NOT NULL,
	"type" text NOT NULL,
	"queue" text DEFAULT 'default' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error" text NOT NULL,
	"failed_at" timestamp DEFAULT now() NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"first_failed_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"resolved_by" text,
	"resolution" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "durable_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"type" text NOT NULL,
	"queue" text DEFAULT 'default' NOT NULL,
	"priority" integer DEFAULT 50 NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"retry_delay_ms" integer DEFAULT 1000 NOT NULL,
	"scheduled_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"last_heartbeat_at" timestamp,
	"error" text,
	"result" jsonb,
	"worker_id" text,
	"parent_job_id" text,
	"depends_on" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "durable_jobs_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "job_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"worker_id" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"status" text DEFAULT 'running' NOT NULL,
	"error" text,
	"duration_ms" bigint,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"job_type" text NOT NULL,
	"queue" text DEFAULT 'default' NOT NULL,
	"priority" integer DEFAULT 50 NOT NULL,
	"cron_expression" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp,
	"next_run_at" timestamp,
	"last_status" text,
	"run_count" integer DEFAULT 0 NOT NULL,
	"fail_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_schedules_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "embedding_model_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" text NOT NULL,
	"provider" text NOT NULL,
	"display_name" text NOT NULL,
	"dimensions" integer NOT NULL,
	"max_input_tokens" integer DEFAULT 8192,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"version" integer DEFAULT 1,
	"api_endpoint" text,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "embedding_model_registry_model_id_unique" UNIQUE("model_id")
);
--> statement-breakpoint
CREATE TABLE "embedding_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_table" text NOT NULL,
	"target_id" text NOT NULL,
	"target_column" text DEFAULT 'embedding',
	"content_column" text DEFAULT 'content',
	"model_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 5,
	"attempts" integer DEFAULT 0,
	"max_attempts" integer DEFAULT 3,
	"error_message" text,
	"scheduled_at" timestamp with time zone DEFAULT now(),
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kg_cross_domain_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"relationship_id" uuid,
	"from_domain" text NOT NULL,
	"to_domain" text NOT NULL,
	"link_type" text NOT NULL,
	"detected_by" text,
	"trigger_event" text,
	"trigger_entity_id" text,
	"detected_at" timestamp with time zone DEFAULT now(),
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "kg_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"entity_type" text NOT NULL,
	"domain" text NOT NULL,
	"sub_domain" text,
	"description" text,
	"canonical_id" text,
	"source_ids" jsonb DEFAULT '[]'::jsonb,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"embedding" vector(1024),
	"embedding_model" text,
	"embedding_at" timestamp with time zone,
	"tenant_id" text,
	"confidence" real DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kg_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_entity_id" uuid NOT NULL,
	"to_entity_id" uuid NOT NULL,
	"relationship_type" text NOT NULL,
	"strength" real DEFAULT 1,
	"confidence" real DEFAULT 1,
	"from_domain" text NOT NULL,
	"to_domain" text NOT NULL,
	"is_cross_domain" boolean DEFAULT false,
	"direction" text DEFAULT 'directed',
	"properties" jsonb DEFAULT '{}'::jsonb,
	"evidence_ids" jsonb DEFAULT '[]'::jsonb,
	"detected_by" text,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" integer,
	"signal_id" integer,
	"title" text NOT NULL,
	"description" text,
	"signal_category" text NOT NULL,
	"state" text DEFAULT 'new' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"owner" text,
	"assigned_to" text,
	"value_at_risk" numeric(14, 2),
	"due_at" timestamp,
	"resolved_at" timestamp,
	"notes" text,
	"state_history" jsonb,
	"role_visibility" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_alert_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"alert_id" integer,
	"event_type" text NOT NULL,
	"trigger_value" real,
	"message" text,
	"metadata" jsonb,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"alert_type" text DEFAULT 'threshold' NOT NULL,
	"service" text NOT NULL,
	"metric_name" text NOT NULL,
	"condition" text NOT NULL,
	"threshold" real,
	"severity" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"notification_channels" jsonb,
	"firing_count" integer DEFAULT 0 NOT NULL,
	"last_fired_at" timestamp,
	"last_resolved_at" timestamp,
	"composite_query" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_command_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" integer,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"assignee" text,
	"due_date" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_escalations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"signal_id" integer,
	"alert_id" integer,
	"severity" text DEFAULT 'high' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"stage" integer DEFAULT 1 NOT NULL,
	"max_stage" integer DEFAULT 3 NOT NULL,
	"owner" text,
	"assigned_to" text,
	"escalation_path" jsonb,
	"sla_deadline_at" timestamp,
	"resolved_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" integer,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"severity" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"assignee" text,
	"impact_area" text,
	"root_cause" text,
	"resolution" text,
	"metadata" jsonb,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"service" text NOT NULL,
	"metric_name" text NOT NULL,
	"metric_type" text NOT NULL,
	"value" real NOT NULL,
	"unit" text DEFAULT 'ms' NOT NULL,
	"tags" jsonb,
	"anomaly" boolean DEFAULT false NOT NULL,
	"anomaly_score" real,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_playbooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" integer,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"content" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"tags" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_priority_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" integer,
	"campaign_id" integer,
	"title" text NOT NULL,
	"description" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"owner" text,
	"due_at" timestamp,
	"resolved_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_prism_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"lens" text NOT NULL,
	"score" integer NOT NULL,
	"previous_score" integer,
	"trend" text DEFAULT 'flat' NOT NULL,
	"trend_delta" real,
	"top_signals" jsonb,
	"summary" text,
	"scored_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_readiness_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" integer,
	"title" text NOT NULL,
	"description" text,
	"item_type" text NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"owner" text,
	"due_at" timestamp,
	"readiness_score" integer,
	"blocked_by" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" integer,
	"signal_id" integer,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"impact" text DEFAULT 'medium' NOT NULL,
	"effort" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'suggested' NOT NULL,
	"action_items" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_saved_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" integer,
	"user_id" text,
	"name" text NOT NULL,
	"description" text,
	"role" text,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_by" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" integer,
	"source" text NOT NULL,
	"source_type" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"status" text DEFAULT 'new' NOT NULL,
	"metadata" jsonb,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_workspaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner_id" text,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_dashboards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"widgets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"template" text,
	"is_shared" boolean DEFAULT false NOT NULL,
	"share_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_signal_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"signal_id" integer,
	"author_id" integer,
	"author_name" text NOT NULL,
	"body" text NOT NULL,
	"comment_type" text DEFAULT 'comment' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_signal_timeline" (
	"id" serial PRIMARY KEY NOT NULL,
	"signal_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"from_state" text,
	"to_state" text,
	"actor_name" text,
	"actor_id" integer,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_board_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"delta" text,
	"trend" text NOT NULL,
	"context" text NOT NULL,
	"good" text NOT NULL,
	"order_idx" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "lyte_board_metrics_label_unique" UNIQUE("label")
);
--> statement-breakpoint
CREATE TABLE "lyte_board_risks" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"severity" text NOT NULL,
	"domain" text NOT NULL,
	"signal" text NOT NULL,
	"recommendation" text NOT NULL,
	"proof_ref" text NOT NULL,
	"intervention_owner" text NOT NULL,
	"deadline" text NOT NULL,
	"order_idx" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_debt_items" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"team" text NOT NULL,
	"owner" text NOT NULL,
	"type" text NOT NULL,
	"score" integer NOT NULL,
	"age_days" integer NOT NULL,
	"escalations" integer NOT NULL,
	"program" text NOT NULL,
	"evidence" jsonb NOT NULL,
	"proof_ref" text NOT NULL,
	"status" text NOT NULL,
	"order_idx" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_debt_score_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"critical" integer NOT NULL,
	"high" integer NOT NULL,
	"medium" integer NOT NULL,
	"order_idx" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_drift_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"count" integer NOT NULL,
	"order_idx" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_drift_items" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"program" text NOT NULL,
	"team" text NOT NULL,
	"stale_days" integer NOT NULL,
	"owners" jsonb NOT NULL,
	"evidence" jsonb NOT NULL,
	"status" text NOT NULL,
	"last_activity" text NOT NULL,
	"impact" text NOT NULL,
	"proof_ref" text NOT NULL,
	"order_idx" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_entity_edges" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"target_id" text NOT NULL,
	"label" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"strength" text DEFAULT 'normal' NOT NULL,
	"proof_ref" text,
	"order_idx" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_entity_nodes" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"sublabel" text,
	"policy_state" text NOT NULL,
	"confidence" double precision DEFAULT 1 NOT NULL,
	"freshness" text DEFAULT 'live' NOT NULL,
	"x" double precision DEFAULT 0 NOT NULL,
	"y" double precision DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"order_idx" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_interventions" (
	"id" text PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"item_kind" text NOT NULL,
	"item_title" text NOT NULL,
	"type" text NOT NULL,
	"actor" text NOT NULL,
	"notes" text,
	"new_owner" text,
	"proof_ref" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lyte_pressure_cells" (
	"id" serial PRIMARY KEY NOT NULL,
	"team" text NOT NULL,
	"workflow" text NOT NULL,
	"account" text NOT NULL,
	"program" text NOT NULL,
	"sponsor" text NOT NULL,
	"open_count" integer NOT NULL,
	"overdue" integer NOT NULL,
	"blocked" integer NOT NULL,
	"escalated" integer NOT NULL,
	"score" integer NOT NULL,
	"order_idx" integer DEFAULT 0 NOT NULL,
	"acknowledged_by" text,
	"acknowledged_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "lyte_replay_scenarios" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"decision" text NOT NULL,
	"outcome" text NOT NULL,
	"date_range" text NOT NULL,
	"events" jsonb NOT NULL,
	"order_idx" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marine_insurance_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer DEFAULT 1,
	"policy_id" integer,
	"claim_ref" text NOT NULL,
	"vessel_mmsi" text,
	"vessel_name" text,
	"incident_type" text,
	"incident_description" text,
	"incident_at" timestamp,
	"incident_location" text,
	"claimed_amount_usd" numeric(20, 2),
	"approved_amount_usd" numeric(20, 2),
	"settled_amount_usd" numeric(20, 2),
	"deductible_applied" numeric(15, 2),
	"status" "insurance_claim_status" DEFAULT 'filed',
	"linked_exception_id" integer,
	"supporting_documents" jsonb,
	"adjustor_notes" text,
	"surveyor_report" text,
	"subrogation_potential" boolean DEFAULT false,
	"reserve_amount_usd" numeric(20, 2),
	"filed_at" timestamp DEFAULT now(),
	"settled_at" timestamp,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "marine_insurance_claims_claim_ref_unique" UNIQUE("claim_ref")
);
--> statement-breakpoint
CREATE TABLE "marine_insurance_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer DEFAULT 1,
	"quote_id" integer,
	"policy_number" text NOT NULL,
	"vessel_mmsi" text,
	"vessel_imo" text,
	"vessel_name" text NOT NULL,
	"coverage_type" "insurance_coverage_type" DEFAULT 'marine_cargo' NOT NULL,
	"coverage_limit_usd" numeric(20, 2),
	"deductible_usd" numeric(15, 2),
	"premium_usd" numeric(15, 2),
	"status" "insurance_policy_status" DEFAULT 'active',
	"effective_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"carrier" text DEFAULT 'Lloyd''s of London Syndicate',
	"syndicate_code" text,
	"policy_terms" jsonb,
	"exclusions" jsonb,
	"endorsements" jsonb,
	"claims_count" integer DEFAULT 0,
	"total_claims_usd" numeric(20, 2) DEFAULT '0',
	"bound_at" timestamp,
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "marine_insurance_policies_policy_number_unique" UNIQUE("policy_number")
);
--> statement-breakpoint
CREATE TABLE "marine_insurance_quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer DEFAULT 1,
	"quote_ref" text NOT NULL,
	"vessel_mmsi" text,
	"vessel_imo" text,
	"vessel_name" text NOT NULL,
	"vessel_type" text,
	"vessel_age" integer,
	"vessel_gross_tonnage" numeric(12, 2),
	"vessel_flag" text,
	"cargo_type" text,
	"cargo_value_usd" numeric(20, 2),
	"cargo_hazard_class" text,
	"voyage_origin" text,
	"voyage_destination" text,
	"route_chokepoints" jsonb,
	"coverage_type" "insurance_coverage_type" DEFAULT 'marine_cargo' NOT NULL,
	"coverage_limit_usd" numeric(20, 2),
	"deductible_usd" numeric(15, 2) DEFAULT '0',
	"coverage_period_days" integer DEFAULT 30,
	"risk_rating" "insurance_risk_rating" DEFAULT 'moderate',
	"risk_score" numeric(5, 2),
	"risk_factors" jsonb,
	"base_rate_percent" numeric(8, 5),
	"vessel_age_factor" numeric(6, 4) DEFAULT '1.0',
	"route_factor" numeric(6, 4) DEFAULT '1.0',
	"cargo_hazard_factor" numeric(6, 4) DEFAULT '1.0',
	"claims_history_factor" numeric(6, 4) DEFAULT '1.0',
	"flag_state_factor" numeric(6, 4) DEFAULT '1.0',
	"final_rate_percent" numeric(8, 5),
	"annual_premium_usd" numeric(15, 2),
	"premium_usd" numeric(15, 2),
	"expires_at" timestamp,
	"binding_notes" text,
	"underwriter_notes" text,
	"status" "insurance_policy_status" DEFAULT 'quote',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "marine_insurance_quotes_quote_ref_unique" UNIQUE("quote_ref")
);
--> statement-breakpoint
CREATE TABLE "corridors" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"name" text NOT NULL,
	"description" text,
	"origin_port_id" integer,
	"destination_port_id" integer,
	"distance_nm" numeric(10, 2),
	"avg_transit_days" numeric(5, 2),
	"risk_level" text DEFAULT 'low' NOT NULL,
	"active_conflicts" jsonb DEFAULT '[]'::jsonb,
	"waypoints" jsonb,
	"geopolitical_risk" integer DEFAULT 0,
	"weather_risk" integer DEFAULT 0,
	"pirate_risk" integer DEFAULT 0,
	"status" text DEFAULT 'operational' NOT NULL,
	"controlled_by_nation" text,
	"sanctioned_territory" integer DEFAULT 0 NOT NULL,
	"alternative_route_ids" jsonb DEFAULT '[]'::jsonb,
	"insurance_premium_modifier" numeric(5, 4) DEFAULT '1.0000',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maritime_exceptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"voyage_id" integer,
	"vessel_id" integer,
	"signal_id" integer,
	"exception_type" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'new' NOT NULL,
	"assigned_to" integer,
	"value_at_risk_usd" numeric(15, 2),
	"eta_impact_hours" numeric(7, 2),
	"cost_impact_usd" numeric(12, 2),
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp,
	"resolved_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maritime_vessels" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"name" text NOT NULL,
	"imo" text,
	"mmsi" text,
	"call_sign" text,
	"flag" text,
	"vessel_type" text DEFAULT 'container' NOT NULL,
	"year_built" integer,
	"gross_tonnage" numeric(12, 2),
	"deadweight_tonnage" numeric(12, 2),
	"length_m" numeric(8, 2),
	"beam_m" numeric(7, 2),
	"max_speed_knots" numeric(5, 2),
	"fuel_type_main" text,
	"status" text DEFAULT 'active' NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"heading" numeric(5, 2),
	"speed_over_ground" numeric(6, 2),
	"last_position_at" timestamp,
	"current_port_id" integer,
	"destination_port_id" integer,
	"eta_at" timestamp,
	"scheduled_eta_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ports" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"name" text NOT NULL,
	"locode" text,
	"country" text NOT NULL,
	"region" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"port_type" text DEFAULT 'multipurpose' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"timezone" text,
	"avg_congestion_days" numeric(5, 2),
	"weekly_capacity_teu" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ports_locode_unique" UNIQUE("locode")
);
--> statement-breakpoint
CREATE TABLE "voyages" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"vessel_id" integer NOT NULL,
	"voyage_number" text,
	"origin_port_id" integer,
	"destination_port_id" integer,
	"cargo_type" text,
	"cargo_description" text,
	"cargo_tonnage" numeric(12, 2),
	"cargo_value_usd" numeric(15, 2),
	"status" text DEFAULT 'planned' NOT NULL,
	"scheduled_departure_at" timestamp,
	"actual_departure_at" timestamp,
	"scheduled_arrival_at" timestamp,
	"estimated_arrival_at" timestamp,
	"actual_arrival_at" timestamp,
	"distance_nm" numeric(10, 2),
	"fuel_consumed_mt" numeric(10, 2),
	"fuel_cost_usd" numeric(12, 2),
	"port_costs_usd" numeric(12, 2),
	"revenue_usd" numeric(15, 2),
	"charter_rate_per_day" numeric(12, 2),
	"eta_drift_hours" numeric(7, 2),
	"corridor_id" integer,
	"waypoints" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_record_id" text NOT NULL,
	"target_record_id" text NOT NULL,
	"link_type" text DEFAULT 'references' NOT NULL,
	"strength" numeric(5, 4) DEFAULT '1',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"tier" text NOT NULL,
	"key" text NOT NULL,
	"value" jsonb,
	"scope_id" text,
	"confidence" numeric(5, 4) DEFAULT '1' NOT NULL,
	"sensitivity" text DEFAULT 'internal' NOT NULL,
	"retention_policy" text DEFAULT 'persistent' NOT NULL,
	"expires_at" timestamp,
	"max_age_days" integer,
	"is_stale" boolean DEFAULT false NOT NULL,
	"provenance_source" text NOT NULL,
	"provenance_source_id" text,
	"provenance_author" text,
	"provenance_method" text DEFAULT 'agent' NOT NULL,
	"linked_entities" jsonb DEFAULT '[]'::jsonb,
	"linked_traces" jsonb DEFAULT '[]'::jsonb,
	"linked_actions" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"last_accessed_at" timestamp,
	"last_updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "memory_records_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"org_id" integer,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_line_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"invoice_id" integer,
	"stripe_invoice_id" text,
	"feature_key" text NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(18, 6) NOT NULL,
	"unit_amount" numeric(12, 6) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"rate_card_id" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_line_items_overage_uq" UNIQUE("org_id","feature_key","period_start","status")
);
--> statement-breakpoint
CREATE TABLE "billing_meter_allotments" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"meter_id" integer NOT NULL,
	"included_units" numeric(18, 6) DEFAULT '0' NOT NULL,
	"stripe_price_id" text,
	"overage_unit_amount" numeric(12, 6),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_meter_allotments_plan_meter_uq" UNIQUE("plan_id","meter_id")
);
--> statement-breakpoint
CREATE TABLE "billing_meters" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"display_name" text NOT NULL,
	"unit" text DEFAULT 'unit' NOT NULL,
	"aggregation" text DEFAULT 'sum' NOT NULL,
	"billing_window" text DEFAULT 'month' NOT NULL,
	"stripe_price_id" text,
	"stripe_meter_id" text,
	"pricing_model" text DEFAULT 'per_unit' NOT NULL,
	"included_units" numeric(18, 6) DEFAULT '0' NOT NULL,
	"unit_amount" numeric(12, 6),
	"product" text DEFAULT 'platform' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_meters_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "cost_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"feature_key" text NOT NULL,
	"product" text DEFAULT 'platform' NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"infra_cost" numeric(12, 4) DEFAULT '0' NOT NULL,
	"billed_amount" numeric(12, 4) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"cost_driver" text,
	"notes" text,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metering_corrections" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"meter_key" text NOT NULL,
	"quantity" numeric(18, 6) NOT NULL,
	"reason_code" text DEFAULT 'other' NOT NULL,
	"reason" text,
	"applied_to_period_start" timestamp with time zone,
	"applied_to_period_end" timestamp with time zone,
	"created_by" integer,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "metering_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"user_id" integer,
	"event_type" text NOT NULL,
	"feature_key" text NOT NULL,
	"product" text DEFAULT 'platform' NOT NULL,
	"quantity" numeric(18, 6) DEFAULT '1' NOT NULL,
	"unit_label" text DEFAULT 'unit' NOT NULL,
	"dimensions" jsonb,
	"idempotency_key" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "metering_events_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "quota_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"feature_key" text NOT NULL,
	"product" text DEFAULT 'platform' NOT NULL,
	"period_type" text DEFAULT 'month' NOT NULL,
	"soft_limit" numeric(18, 2),
	"hard_limit" numeric(18, 2),
	"soft_limit_action" text DEFAULT 'notify' NOT NULL,
	"hard_limit_action" text DEFAULT 'block' NOT NULL,
	"overage_unit_amount" numeric(12, 6),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quota_configs_org_feature_period_uq" UNIQUE("org_id","feature_key","period_type")
);
--> statement-breakpoint
CREATE TABLE "quota_violations" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"feature_key" text NOT NULL,
	"violation_type" text NOT NULL,
	"action" text NOT NULL,
	"current_usage" numeric(18, 6),
	"limit_value" numeric(18, 6),
	"metadata" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_card_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"rate_card_id" integer NOT NULL,
	"feature_key" text NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"assigned_by" text,
	"notes" text,
	CONSTRAINT "rate_card_assign_org_feature_uq" UNIQUE("org_id","feature_key","is_active")
);
--> statement-breakpoint
CREATE TABLE "rate_card_tiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"rate_card_id" integer NOT NULL,
	"from_unit" integer NOT NULL,
	"to_unit" integer,
	"unit_amount" numeric(12, 6) NOT NULL,
	"flat_amount" numeric(12, 6),
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"feature_key" text NOT NULL,
	"product" text DEFAULT 'platform' NOT NULL,
	"pricing_model" text DEFAULT 'per_unit' NOT NULL,
	"unit_label" text DEFAULT 'unit' NOT NULL,
	"flat_amount" numeric(12, 6),
	"unit_amount" numeric(12, 6),
	"free_units" integer DEFAULT 0 NOT NULL,
	"billing_interval" text DEFAULT 'monthly' NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rate_cards_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "usage_aggregates" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"feature_key" text NOT NULL,
	"product" text DEFAULT 'platform' NOT NULL,
	"period_type" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"total_quantity" numeric(20, 6) DEFAULT '0' NOT NULL,
	"event_count" integer DEFAULT 0 NOT NULL,
	"unique_users" integer DEFAULT 0 NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "usage_agg_org_feature_period_uq" UNIQUE("org_id","feature_key","period_type","period_start")
);
--> statement-breakpoint
CREATE TABLE "usage_threshold_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"meter_key" text NOT NULL,
	"threshold" integer NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"notified_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usage_threshold_notif_uq" UNIQUE("org_id","meter_key","threshold","period_start")
);
--> statement-breakpoint
CREATE TABLE "ml_ab_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" text NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"description" text,
	"control_model_version_id" text NOT NULL,
	"treatment_model_version_id" text NOT NULL,
	"traffic_split_pct" real DEFAULT 0.5 NOT NULL,
	"primary_metric" text NOT NULL,
	"significance_threshold" real DEFAULT 0.05 NOT NULL,
	"min_sample_size" integer DEFAULT 100 NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"winner" text,
	"p_value" real,
	"effect_size" real,
	"control_metrics" jsonb,
	"treatment_metrics" jsonb,
	"sample_count" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"concluded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ml_ab_tests_test_id_unique" UNIQUE("test_id")
);
--> statement-breakpoint
CREATE TABLE "ml_datasets" (
	"id" serial PRIMARY KEY NOT NULL,
	"dataset_id" text NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"version" text NOT NULL,
	"description" text,
	"split_strategy" text DEFAULT 'temporal' NOT NULL,
	"train_fraction" real DEFAULT 0.8 NOT NULL,
	"val_fraction" real DEFAULT 0.1 NOT NULL,
	"test_fraction" real DEFAULT 0.1 NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"feature_count" integer DEFAULT 0 NOT NULL,
	"feature_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"label_column" text NOT NULL,
	"quality_score" real,
	"bias_metrics" jsonb,
	"missing_value_pct" real,
	"class_distribution" jsonb,
	"temporal_range" jsonb,
	"privacy_controls" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"storage_uri" text,
	"checksum" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"refreshed_at" timestamp with time zone,
	CONSTRAINT "ml_datasets_dataset_id_unique" UNIQUE("dataset_id")
);
--> statement-breakpoint
CREATE TABLE "ml_feature_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"feature_id" text NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"description" text,
	"data_type" text NOT NULL,
	"computation_query" text,
	"dependencies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"freshness_interval_seconds" integer DEFAULT 3600 NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ml_feature_definitions_feature_id_unique" UNIQUE("feature_id")
);
--> statement-breakpoint
CREATE TABLE "ml_feature_values" (
	"id" serial PRIMARY KEY NOT NULL,
	"feature_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"value" jsonb NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"is_stale" boolean DEFAULT false NOT NULL,
	"pipeline_run_id" text
);
--> statement-breakpoint
CREATE TABLE "ml_model_monitoring_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_id" text NOT NULL,
	"model_version_id" text NOT NULL,
	"domain" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"window_end" timestamp with time zone NOT NULL,
	"prediction_count" integer DEFAULT 0 NOT NULL,
	"accuracy_metrics" jsonb,
	"data_drift_scores" jsonb,
	"prediction_distribution" jsonb,
	"feature_stats" jsonb,
	"drift_detected" boolean DEFAULT false NOT NULL,
	"performance_degraded" boolean DEFAULT false NOT NULL,
	"retraining_triggered" boolean DEFAULT false NOT NULL,
	"alerts_sent" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ml_model_monitoring_snapshots_snapshot_id_unique" UNIQUE("snapshot_id")
);
--> statement-breakpoint
CREATE TABLE "ml_model_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_version_id" text NOT NULL,
	"model_name" text NOT NULL,
	"domain" text NOT NULL,
	"version" text NOT NULL,
	"algorithm_family" text NOT NULL,
	"run_id" text NOT NULL,
	"dataset_id" text NOT NULL,
	"dataset_version" text NOT NULL,
	"feature_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"hyperparameters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"train_metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"test_metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"feature_importance" jsonb,
	"lifecycle" text DEFAULT 'experimental' NOT NULL,
	"is_production" boolean DEFAULT false NOT NULL,
	"artifact_uri" text,
	"serialized_model" jsonb,
	"promoted_at" timestamp with time zone,
	"deprecated_at" timestamp with time zone,
	"promoted_by" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ml_model_versions_model_version_id_unique" UNIQUE("model_version_id")
);
--> statement-breakpoint
CREATE TABLE "ml_predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"prediction_id" text NOT NULL,
	"model_version_id" text NOT NULL,
	"domain" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"input_features" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"prediction" jsonb NOT NULL,
	"confidence" real,
	"explanation" jsonb,
	"ab_test_id" text,
	"ab_test_variant" text,
	"latency_ms" integer,
	"cache_hit" boolean DEFAULT false NOT NULL,
	"is_batch" boolean DEFAULT false NOT NULL,
	"actual" jsonb,
	"actual_recorded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ml_predictions_prediction_id_unique" UNIQUE("prediction_id")
);
--> statement-breakpoint
CREATE TABLE "ml_training_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"domain" text NOT NULL,
	"model_type" text NOT NULL,
	"algorithm_family" text NOT NULL,
	"dataset_id" text NOT NULL,
	"feature_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"hyperparameters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"stage" text DEFAULT 'data_extraction' NOT NULL,
	"train_metrics" jsonb,
	"val_metrics" jsonb,
	"test_metrics" jsonb,
	"feature_importance" jsonb,
	"artifact_uri" text,
	"error_message" text,
	"duration_seconds" real,
	"triggered_by" text DEFAULT 'manual' NOT NULL,
	"parent_run_id" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ml_training_runs_run_id_unique" UNIQUE("run_id")
);
--> statement-breakpoint
CREATE TABLE "msp_clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"industry" text,
	"status" text DEFAULT 'active' NOT NULL,
	"health_score" integer DEFAULT 80,
	"device_count" integer DEFAULT 0,
	"open_tickets" integer DEFAULT 0,
	"mrr" integer DEFAULT 0,
	"cost_to_serve" integer DEFAULT 0,
	"churn_risk" integer DEFAULT 10,
	"tickets_30d" integer DEFAULT 0,
	"contact_name" text,
	"contact_email" text,
	"city" text,
	"state" text,
	"sla_target" integer DEFAULT 99,
	"sla_actual" integer DEFAULT 99,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "msp_contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"client_id" integer,
	"client_name" text,
	"type" text DEFAULT 'managed-services' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"mrr" integer DEFAULT 0,
	"start_date" text,
	"end_date" text,
	"sla_target" integer DEFAULT 99,
	"sla_actual" integer DEFAULT 99,
	"renewal_probability" integer DEFAULT 80,
	"notes" text,
	"terms" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "msp_devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"hostname" text NOT NULL,
	"client_id" integer,
	"client_name" text,
	"connector_id" integer,
	"type" text DEFAULT 'workstation' NOT NULL,
	"os" text,
	"ip_address" text,
	"mac_address" text,
	"site" text,
	"status" text DEFAULT 'online' NOT NULL,
	"cpu" integer DEFAULT 0,
	"memory" integer DEFAULT 0,
	"disk" integer DEFAULT 0,
	"alerts" integer DEFAULT 0,
	"patches_pending" integer DEFAULT 0,
	"threats" integer DEFAULT 0,
	"last_seen" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "msp_devices_device_id_unique" UNIQUE("device_id")
);
--> statement-breakpoint
CREATE TABLE "msp_technicians" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"status" text DEFAULT 'available' NOT NULL,
	"specialties" jsonb DEFAULT '[]'::jsonb,
	"current_job" text,
	"location" text,
	"eta" text,
	"completed_today" integer DEFAULT 0,
	"rating" numeric(3, 1) DEFAULT '4.8',
	"certifications" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "msp_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_number" text NOT NULL,
	"subject" text NOT NULL,
	"description" text,
	"client_id" integer,
	"client_name" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"assignee_id" integer,
	"assignee_name" text,
	"category" text,
	"sla_deadline" timestamp,
	"sla_status" text DEFAULT 'on-track' NOT NULL,
	"ai_triage" text,
	"resolved_at" timestamp,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "msp_tickets_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
CREATE TABLE "msp_healing_executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"playbook_id" integer,
	"device_id" integer,
	"client_id" integer,
	"triggered_by" text DEFAULT 'auto' NOT NULL,
	"status" text DEFAULT 'pending_approval' NOT NULL,
	"approval_required" boolean DEFAULT true,
	"approved_by" text,
	"approved_at" timestamp,
	"detection_context" jsonb DEFAULT '{}'::jsonb,
	"before_metrics" jsonb,
	"after_metrics" jsonb,
	"actions_executed" jsonb DEFAULT '[]'::jsonb,
	"healing_confidence_score" integer DEFAULT 0,
	"ticket_id" integer,
	"psa_ticket_ref" text,
	"notes" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "msp_healing_playbooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"execution_mode" text DEFAULT 'human_gated' NOT NULL,
	"detection_rules" jsonb DEFAULT '[]'::jsonb,
	"remediation_actions" jsonb DEFAULT '[]'::jsonb,
	"target_device_types" jsonb DEFAULT '[]'::jsonb,
	"target_client_ids" jsonb DEFAULT '[]'::jsonb,
	"confidence_threshold" integer DEFAULT 70,
	"success_rate" integer DEFAULT 0,
	"total_executions" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "msp_org_site_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"connector_id" integer NOT NULL,
	"provider_org_id" text NOT NULL,
	"provider_org_name" text,
	"provider_site_id" text,
	"provider_site_name" text,
	"internal_client_id" integer,
	"sync_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "msp_psa_ticket_sync" (
	"id" serial PRIMARY KEY NOT NULL,
	"internal_ticket_id" integer,
	"connector_id" integer,
	"psa_ticket_id" text,
	"psa_url" text,
	"sync_status" text DEFAULT 'pending' NOT NULL,
	"last_sync_at" timestamp,
	"sla_breach" boolean DEFAULT false,
	"sla_timer_started_at" timestamp,
	"closed_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "msp_remote_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"device_id" integer,
	"connector_id" integer,
	"action_type" text NOT NULL,
	"target" text,
	"parameters" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'pending_approval' NOT NULL,
	"requires_approval" boolean DEFAULT true,
	"requested_by" text DEFAULT 'system' NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"provider_job_id" text,
	"result" jsonb,
	"error_message" text,
	"executed_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "msp_rmm_connectors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"mode" text DEFAULT 'both' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"auth_type" text DEFAULT 'api_key' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"last_sync_at" timestamp,
	"last_error_at" timestamp,
	"last_error" text,
	"sync_interval_minutes" integer DEFAULT 5,
	"device_count" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "msp_rmm_device_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"device_id" integer,
	"device_db_id" text,
	"connector_id" integer,
	"provider_device_id" text,
	"cpu" integer DEFAULT 0,
	"memory" integer DEFAULT 0,
	"disk" integer DEFAULT 0,
	"network_in_kbps" integer DEFAULT 0,
	"network_out_kbps" integer DEFAULT 0,
	"agent_version" text,
	"patch_status" text,
	"services" jsonb DEFAULT '[]'::jsonb,
	"processes" jsonb DEFAULT '[]'::jsonb,
	"disk_fill_rate_gb_per_hour" integer,
	"predicted_full_at" timestamp,
	"snapshot_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "command_session_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"author_user_id" integer,
	"author_label" text NOT NULL,
	"entity_id" text,
	"entity_type" text,
	"body" text NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "command_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"org_id" integer,
	"created_by_user_id" integer,
	"title" text DEFAULT 'Command Session' NOT NULL,
	"app_id" text DEFAULT 'command' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"participant_user_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	CONSTRAINT "command_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "nexus_memory" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"type" text DEFAULT 'fact' NOT NULL,
	"tier" text DEFAULT 'session' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"confidence" numeric(5, 4) DEFAULT '0.8' NOT NULL,
	"source" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nexus_edges" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_uri" text NOT NULL,
	"to_uri" text NOT NULL,
	"relation" text NOT NULL,
	"org_id" integer,
	"attributes" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nexus_entities" (
	"id" serial PRIMARY KEY NOT NULL,
	"uri" text NOT NULL,
	"kind" text NOT NULL,
	"org_id" integer,
	"source_table" text NOT NULL,
	"source_id" text NOT NULL,
	"display_name" text NOT NULL,
	"attributes" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nexus_ingest_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"repo_url" text NOT NULL,
	"repo_name" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"skills_generated" integer DEFAULT 0 NOT NULL,
	"patterns_found" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"log" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "nexus_orchestration_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"intent" text NOT NULL,
	"status" text DEFAULT 'planning' NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"stitched_output" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "nexus_protocol_tools" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"protocol" text NOT NULL,
	"domain" text DEFAULT '' NOT NULL,
	"input_schema" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	"last_modified_at" timestamp,
	"last_modified_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nexus_skills" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"source_repo" text DEFAULT '' NOT NULL,
	"source_url" text DEFAULT '' NOT NULL,
	"license" text DEFAULT '' NOT NULL,
	"pattern" text DEFAULT '' NOT NULL,
	"primitive_type" text DEFAULT 'Skill' NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"nexus_adaptation" text DEFAULT '' NOT NULL,
	"original_summary" text DEFAULT '' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	"last_modified_at" timestamp,
	"last_modified_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nexus_v1_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" integer,
	"user_id" integer,
	"domains_touched" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"context_summary" text DEFAULT '' NOT NULL,
	"decision_graph" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"turn_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "nexus_governed_workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"trigger_type" text DEFAULT 'manual' NOT NULL,
	"trigger_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"last_run_at" timestamp with time zone,
	"run_count" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"tenant_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nexus_mcp_anomalies" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text,
	"external_server_id" text,
	"anomaly_type" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"description" text NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"acknowledged" boolean DEFAULT false NOT NULL,
	"acknowledged_by" text,
	"acknowledged_at" timestamp with time zone,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nexus_mcp_external_servers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"endpoint_url" text NOT NULL,
	"auth_method" text DEFAULT 'none' NOT NULL,
	"auth_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"allowed_tenant_scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"discovered_tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"health_status" text DEFAULT 'unknown' NOT NULL,
	"latency_ms" integer,
	"error_rate" integer DEFAULT 0 NOT NULL,
	"circuit_breaker_state" text DEFAULT 'closed' NOT NULL,
	"circuit_breaker_trips" integer DEFAULT 0 NOT NULL,
	"last_health_check" timestamp with time zone,
	"last_tool_discovery" timestamp with time zone,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nexus_mcp_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"client_identity" text NOT NULL,
	"client_type" text DEFAULT 'internal' NOT NULL,
	"server_identity" text NOT NULL,
	"server_type" text DEFAULT 'internal' NOT NULL,
	"external_server_id" text,
	"tenant_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"risk_level" text DEFAULT 'low' NOT NULL,
	"tool_call_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"policy_violation_count" integer DEFAULT 0 NOT NULL,
	"pending_approval_count" integer DEFAULT 0 NOT NULL,
	"avg_latency_ms" integer,
	"proof_hash" text,
	"previous_proof_hash" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nexus_mcp_tool_calls" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"tool_name" text NOT NULL,
	"tool_source" text DEFAULT 'internal' NOT NULL,
	"external_server_id" text,
	"input_params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output_summary" text,
	"output_raw" jsonb,
	"latency_ms" integer,
	"outcome" text DEFAULT 'success' NOT NULL,
	"policy_result" text DEFAULT 'pass' NOT NULL,
	"policy_reason" text,
	"approval_status" text DEFAULT 'not_required' NOT NULL,
	"approval_id" text,
	"error_message" text,
	"sequence_index" integer DEFAULT 0 NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_send_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_id" integer,
	"channel" text DEFAULT 'email' NOT NULL,
	"provider" text,
	"message_id" text,
	"recipient" text NOT NULL,
	"subject" text,
	"status" text DEFAULT 'sent' NOT NULL,
	"error" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"sms_enabled" boolean DEFAULT false NOT NULL,
	"slack_enabled" boolean DEFAULT false NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"digest_config" jsonb,
	"last_digest_sent_at" timestamp with time zone,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"channel" text DEFAULT 'in_app' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"action_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "a2a_task_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"input_query" text NOT NULL,
	"input_context" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"output" text,
	"error" text,
	"caller_agent_id" text,
	"caller_platform" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "a2a_task_log_task_id_unique" UNIQUE("task_id")
);
--> statement-breakpoint
CREATE TABLE "advisory_findings" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"agent_name" text NOT NULL,
	"analysis_type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"score" integer DEFAULT 75 NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"acknowledged" boolean DEFAULT false NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_decision_traces" (
	"id" serial PRIMARY KEY NOT NULL,
	"trace_id" text NOT NULL,
	"run_id" text NOT NULL,
	"query" text NOT NULL,
	"org_id" integer,
	"forks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"total_latency_ms" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"judge_evaluation" jsonb,
	"decision_tree" jsonb,
	"regression_flags" text[] DEFAULT '{}' NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_decision_traces_trace_id_unique" UNIQUE("trace_id")
);
--> statement-breakpoint
CREATE TABLE "agent_kernel_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_id" text NOT NULL,
	"previous_hash" text NOT NULL,
	"current_hash" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"agent_id" text NOT NULL,
	"tool_name" text NOT NULL,
	"arguments" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"validation_result" text NOT NULL,
	"validation_errors" text[] DEFAULT '{}' NOT NULL,
	"authorization_result" text NOT NULL,
	"authorization_reason" text NOT NULL,
	"execution_result" text NOT NULL,
	"compensation_applied" boolean DEFAULT false NOT NULL,
	"compensation_steps" text[] DEFAULT '{}' NOT NULL,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"called_by" text NOT NULL,
	"tenant_id" text,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_kernel_audit_log_entry_id_unique" UNIQUE("entry_id")
);
--> statement-breakpoint
CREATE TABLE "agent_memory_facts" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"domain" text NOT NULL,
	"fact_type" text NOT NULL,
	"content" text NOT NULL,
	"importance" integer DEFAULT 5 NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"retrieval_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_model_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"agent_name" text NOT NULL,
	"model" text NOT NULL,
	"provider" text NOT NULL,
	"token_budget" integer DEFAULT 100000 NOT NULL,
	"tokens_used_period" integer DEFAULT 0 NOT NULL,
	"period_reset_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_model_assignments_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "agent_prompt_evolution" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"agent_name" text NOT NULL,
	"current_prompt_hash" text NOT NULL,
	"refinement_type" text NOT NULL,
	"proposed_addition" text DEFAULT '' NOT NULL,
	"proposed_removal" text,
	"rationale" text DEFAULT '' NOT NULL,
	"risk_level" text DEFAULT 'medium' NOT NULL,
	"expected_confidence_impact" real DEFAULT 0 NOT NULL,
	"requires_human_review" boolean DEFAULT true NOT NULL,
	"avg_confidence_before" real DEFAULT 0 NOT NULL,
	"success_rate_before" real DEFAULT 0 NOT NULL,
	"total_invocations" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'proposed' NOT NULL,
	"applied_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_scope_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"allowed_tools" text[] DEFAULT '{}' NOT NULL,
	"max_risk_level" text DEFAULT 'medium' NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"issuer_signature" text NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_spend_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"org_id" integer,
	"model" text NOT NULL,
	"provider" text NOT NULL,
	"tokens_used" integer DEFAULT 0 NOT NULL,
	"cost_usd" double precision DEFAULT 0 NOT NULL,
	"agent_id" text NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_tool_calls" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"tool_name" text NOT NULL,
	"input" text NOT NULL,
	"output" text,
	"success" boolean DEFAULT true NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"called_at" timestamp with time zone DEFAULT now() NOT NULL,
	"governance_verdict" text,
	"trace_id" text
);
--> statement-breakpoint
CREATE TABLE "agent_trajectories" (
	"id" serial PRIMARY KEY NOT NULL,
	"trajectory_id" text NOT NULL,
	"content_hash" text NOT NULL,
	"query" text NOT NULL,
	"agent_routing" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tool_calls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"final_synthesis" text NOT NULL,
	"average_confidence" double precision DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"total_latency_ms" integer DEFAULT 0 NOT NULL,
	"is_high_stakes" boolean DEFAULT false NOT NULL,
	"validation_passed" boolean DEFAULT true NOT NULL,
	"user_feedback_score" double precision,
	"quality_score" double precision,
	"quality_dimensions" jsonb,
	"status" text DEFAULT 'captured' NOT NULL,
	"golden_run_rank" integer,
	"few_shot_example" text,
	"org_id" integer,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_trajectories_trajectory_id_unique" UNIQUE("trajectory_id")
);
--> statement-breakpoint
CREATE TABLE "agent_usage_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"agent_name" text NOT NULL,
	"domain" text NOT NULL,
	"tokens_used" integer DEFAULT 0 NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"success" boolean DEFAULT true NOT NULL,
	"model" text NOT NULL,
	"provider" text NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_safety_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"agent_id" text,
	"severity" text DEFAULT 'low' NOT NULL,
	"description" text NOT NULL,
	"blocked" boolean DEFAULT false NOT NULL,
	"input_sample" text,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_agent_corrections" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_agent_id" text NOT NULL,
	"validator_agent_id" text NOT NULL,
	"org_id" integer,
	"original_output" text NOT NULL,
	"corrected_output" text NOT NULL,
	"validation_notes" text,
	"validation_status" text NOT NULL,
	"topic_keywords" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alloy_case_memory" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "alloy_case_memory_case_id_unique" UNIQUE("case_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_conversation_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"summary" text NOT NULL,
	"topics" text[] DEFAULT '{}' NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "alloy_conversation_summaries_conversation_id_unique" UNIQUE("conversation_id")
);
--> statement-breakpoint
CREATE TABLE "alloy_evidence_index" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text,
	"incident_id" text,
	"source" text NOT NULL,
	"source_type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"freshness" text DEFAULT 'current' NOT NULL,
	"entry_timestamp" text,
	"object_id" text,
	"relevance_boost" real DEFAULT 1 NOT NULL,
	"embedding" jsonb
);
--> statement-breakpoint
CREATE TABLE "alloy_outcome_learning" (
	"id" serial PRIMARY KEY NOT NULL,
	"decision_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"org_id" integer,
	"outcome" text NOT NULL,
	"original_action" text NOT NULL,
	"final_action" text,
	"original_confidence" real NOT NULL,
	"topic" text NOT NULL,
	"topic_keywords" text[] DEFAULT '{}' NOT NULL,
	"override_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "multi_hypothesis_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"query" text NOT NULL,
	"hypothesis_count" integer DEFAULT 0 NOT NULL,
	"cluster_count" integer DEFAULT 0 NOT NULL,
	"top_cluster" jsonb,
	"all_clusters" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommendation" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orchestration_telemetry" (
	"id" serial PRIMARY KEY NOT NULL,
	"orchestration_id" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"selected_agents" text[] DEFAULT '{}' NOT NULL,
	"routing_scores" jsonb,
	"agent_performance" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"causal_chains" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"conflicts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"proactive_activations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_latency_ms" integer DEFAULT 0 NOT NULL,
	"tokens_burned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orchestration_telemetry_orchestration_id_unique" UNIQUE("orchestration_id")
);
--> statement-breakpoint
CREATE TABLE "predictive_precompute_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"cache_key" text NOT NULL,
	"original_query" text NOT NULL,
	"predicted_query" text NOT NULL,
	"likelihood" integer DEFAULT 50 NOT NULL,
	"domains" text[] DEFAULT '{}' NOT NULL,
	"synthesis" text DEFAULT '' NOT NULL,
	"agent_count" integer DEFAULT 0 NOT NULL,
	"avg_confidence" integer DEFAULT 0 NOT NULL,
	"hit_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "predictive_precompute_cache_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
CREATE TABLE "red_team_findings" (
	"id" serial PRIMARY KEY NOT NULL,
	"orchestration_id" text NOT NULL,
	"query" text NOT NULL,
	"findings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"overall_assessment" text DEFAULT '' NOT NULL,
	"challenges_raised" integer DEFAULT 0 NOT NULL,
	"critical_issues" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"org_id" integer,
	"budget_usd" double precision DEFAULT 5 NOT NULL,
	"warning_threshold" double precision DEFAULT 0.8 NOT NULL,
	"hard_cap_threshold" double precision DEFAULT 1 NOT NULL,
	"allow_model_downgrade" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_budgets_workflow_id_unique" UNIQUE("workflow_id")
);
--> statement-breakpoint
CREATE TABLE "on_call_handoff_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"team" text NOT NULL,
	"user_id" integer NOT NULL,
	"handoff_at" timestamp with time zone NOT NULL,
	"kind" text NOT NULL,
	"notification_id" integer,
	"in_app_delivered" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "on_call_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"team" text NOT NULL,
	"rotation_interval_hours" integer DEFAULT 168 NOT NULL,
	"member_order" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"handoff_anchor" timestamp with time zone DEFAULT now() NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"warning_minutes" integer DEFAULT 30 NOT NULL,
	"updated_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "on_call_shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"team" text NOT NULL,
	"user_id" integer NOT NULL,
	"kind" text DEFAULT 'override' NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"note" text,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "org_members_org_user_uq" UNIQUE("org_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"domain" text,
	"org_type" text,
	"status" text DEFAULT 'active' NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"billing_customer_id" text,
	"mfa_required" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ot_ics_anomaly_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"bucket_at" timestamp NOT NULL,
	"score" numeric(8, 2) NOT NULL,
	"baseline_snapshot" numeric(8, 2),
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ot_ics_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"name" text NOT NULL,
	"zone" text NOT NULL,
	"protocol" text NOT NULL,
	"baseline" numeric(8, 2) DEFAULT '10' NOT NULL,
	"baseline_window_days" integer DEFAULT 30 NOT NULL,
	"baseline_last_computed_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ot_ics_assets_asset_id_unique" UNIQUE("asset_id")
);
--> statement-breakpoint
CREATE TABLE "ot_ics_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"seq" integer NOT NULL,
	"observed_at" timestamp DEFAULT now() NOT NULL,
	"direction" text NOT NULL,
	"src" text NOT NULL,
	"dst" text NOT NULL,
	"protocol" text NOT NULL,
	"summary" text NOT NULL,
	"bytes" integer DEFAULT 0 NOT NULL,
	"anomalous" boolean DEFAULT false NOT NULL,
	"frame_id" text,
	"payload_hex" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ot_ics_decoded_frames" (
	"id" serial PRIMARY KEY NOT NULL,
	"frame_id" text NOT NULL,
	"observed_at" timestamp DEFAULT now() NOT NULL,
	"protocol" text NOT NULL,
	"src" text NOT NULL,
	"dst" text NOT NULL,
	"asset_id" text,
	"function_label" text NOT NULL,
	"summary" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"raw_hex" text NOT NULL,
	"fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"forensic_event_id" text,
	"conversation_session_id" text,
	"triage_status" text DEFAULT 'open' NOT NULL,
	"acknowledged_at" timestamp,
	"acknowledged_by" text,
	"incident_ref" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ot_ics_decoded_frames_frame_id_unique" UNIQUE("frame_id")
);
--> statement-breakpoint
CREATE TABLE "outcome_graph_learning_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"domain" text DEFAULT 'general' NOT NULL,
	"job_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"input_sample_size" integer,
	"output_summary" jsonb DEFAULT '{}'::jsonb,
	"changes_applied" jsonb DEFAULT '[]'::jsonb,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"triggered_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outcome_graph" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"domain" text DEFAULT 'general' NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"recommendation_id" text,
	"recommendation_text" text NOT NULL,
	"recommendation_action" text,
	"agent_id" text,
	"model_id" text,
	"model_provider" text,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"user_decision" text,
	"decided_by_user_id" integer,
	"decided_at" timestamp,
	"override_reason" text,
	"correction_reason" text,
	"action_executed" text,
	"action_executed_at" timestamp,
	"outcome_result" text,
	"outcome_notes" text,
	"outcome_recorded_at" timestamp,
	"time_to_outcome_ms" integer,
	"domain_conditions" jsonb DEFAULT '{}'::jsonb,
	"later_impact" jsonb DEFAULT '{}'::jsonb,
	"proof_chain_id" integer,
	"correlation_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capital_contributions" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" integer NOT NULL,
	"person_name" text NOT NULL,
	"contribution_type" text DEFAULT 'cash' NOT NULL,
	"amount_cents" integer,
	"description" text,
	"is_documented" boolean DEFAULT false NOT NULL,
	"document_reference" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certification_readiness_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" integer NOT NULL,
	"certification_name" text NOT NULL,
	"certification_body" text,
	"fit_level" text DEFAULT 'moderate' NOT NULL,
	"key_requirements" text,
	"gap_summary" text,
	"required_documents" jsonb,
	"estimated_readiness_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "control_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" integer NOT NULL,
	"person_name" text NOT NULL,
	"has_day_to_day_control" boolean DEFAULT false NOT NULL,
	"has_long_term_decision_authority" boolean DEFAULT false NOT NULL,
	"has_hiring_firing_authority" boolean DEFAULT false NOT NULL,
	"has_strategic_veto" boolean DEFAULT false NOT NULL,
	"control_description" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governance_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" integer NOT NULL,
	"document_type" text NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'missing' NOT NULL,
	"file_reference" text,
	"last_reviewed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_review_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" integer NOT NULL,
	"flag_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"assigned_to" text,
	"resolved_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manager_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" integer NOT NULL,
	"person_name" text NOT NULL,
	"management_area" text NOT NULL,
	"responsibility" text,
	"is_documented" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "officer_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" integer NOT NULL,
	"person_name" text NOT NULL,
	"title" text NOT NULL,
	"is_primary_officer" boolean DEFAULT false NOT NULL,
	"is_on_registration" boolean DEFAULT false NOT NULL,
	"is_on_bank_account" boolean DEFAULT false NOT NULL,
	"is_on_operating_agreement" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ownership_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" integer NOT NULL,
	"person_name" text NOT NULL,
	"role" text DEFAULT 'co_owner' NOT NULL,
	"equity_pct" numeric(6, 3) NOT NULL,
	"voting_rights_pct" numeric(6, 3),
	"is_controlling" boolean DEFAULT false NOT NULL,
	"is_majority_owner" boolean DEFAULT false NOT NULL,
	"citizenship_confirmed" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ownership_decision_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" integer NOT NULL,
	"decision_type" text NOT NULL,
	"summary" text NOT NULL,
	"made_by" text,
	"rationale" text,
	"metadata" jsonb,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ownership_scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_template" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"is_preferred" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"certification_fit_summary" text,
	"fundraising_fit_score" integer,
	"bank_fit_score" integer,
	"investor_clarity_score" integer,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signature_authority_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" integer NOT NULL,
	"person_name" text NOT NULL,
	"authority_type" text NOT NULL,
	"institution" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"documentation_status" text DEFAULT 'not_started' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voting_rights" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" integer NOT NULL,
	"person_name" text NOT NULL,
	"voting_pct" numeric(6, 3) NOT NULL,
	"has_veto_right" boolean DEFAULT false NOT NULL,
	"restrictions" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_view_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "page_view_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"session_id" text NOT NULL,
	"path" text NOT NULL,
	"referrer" text,
	"user_agent" text,
	"ip_hash" text,
	"country" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_pilots" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"organization_id" integer,
	"name" text NOT NULL,
	"product" text NOT NULL,
	"status" text DEFAULT 'prospect' NOT NULL,
	"tier" text DEFAULT 'design-partner' NOT NULL,
	"region" text,
	"industry" text,
	"primary_contact" text,
	"contact_email" text,
	"pilot_started_at" timestamp,
	"contract_value_usd" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "partner_pilots_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "org_branding" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"app_name" text,
	"tagline" text,
	"logo_url" text,
	"favicon_url" text,
	"primary_color" text DEFAULT '#6366f1' NOT NULL,
	"secondary_color" text DEFAULT '#7c3aed' NOT NULL,
	"accent_color" text DEFAULT '#06b6d4' NOT NULL,
	"background_color" text DEFAULT '#0f172a' NOT NULL,
	"surface_color" text DEFAULT '#1e293b' NOT NULL,
	"text_color" text DEFAULT '#f8fafc' NOT NULL,
	"custom_css" text,
	"email_from_name" text,
	"email_footer_text" text,
	"support_email" text,
	"support_url" text,
	"privacy_url" text,
	"terms_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "org_branding_org_id_unique" UNIQUE("org_id")
);
--> statement-breakpoint
CREATE TABLE "org_custom_domains" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"domain" text NOT NULL,
	"status" text DEFAULT 'pending_verification' NOT NULL,
	"verification_method" text DEFAULT 'dns_txt' NOT NULL,
	"verification_token" text NOT NULL,
	"verification_record" text,
	"ssl_status" text DEFAULT 'pending' NOT NULL,
	"ssl_provider" text,
	"ssl_expires_at" timestamp,
	"last_verified_at" timestamp,
	"last_check_at" timestamp,
	"failure_reason" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"owner_user_id" integer NOT NULL,
	"org_id" integer,
	"status" text DEFAULT 'pending_approval' NOT NULL,
	"tier" text DEFAULT 'reseller' NOT NULL,
	"commission_rate" text DEFAULT '0.20' NOT NULL,
	"max_managed_tenants" integer DEFAULT 10 NOT NULL,
	"contact_email" text,
	"contact_name" text,
	"website" text,
	"notes" text,
	"metadata" jsonb DEFAULT '{}',
	"approved_at" timestamp,
	"approved_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_org_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"partner_id" integer NOT NULL,
	"org_id" integer NOT NULL,
	"access_level" text DEFAULT 'manage' NOT NULL,
	"provisioned_by_user_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "partner_org_assignments_uq" UNIQUE("partner_id","org_id")
);
--> statement-breakpoint
CREATE TABLE "partner_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"partner_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"invited_by_user_id" integer,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "partner_users_uq" UNIQUE("partner_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "pipeline_deal_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" integer NOT NULL,
	"org_id" integer NOT NULL,
	"account_snapshot" text DEFAULT '' NOT NULL,
	"from_stage" text,
	"to_stage" text NOT NULL,
	"actor_user_id" integer,
	"actor_email" text,
	"actor_name" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_deals" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"account" text NOT NULL,
	"vertical" text NOT NULL,
	"champion" text DEFAULT '' NOT NULL,
	"champion_title" text DEFAULT '' NOT NULL,
	"stage" text DEFAULT 'Researched' NOT NULL,
	"fit_score" integer DEFAULT 7 NOT NULL,
	"next_step" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_by_user_id" integer,
	"updated_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"action" "event_action" NOT NULL,
	"source_app" text NOT NULL,
	"severity" "event_severity" DEFAULT 'info' NOT NULL,
	"confidence" real,
	"impacted_entity_ids" uuid[] DEFAULT '{}',
	"causal_factors" jsonb DEFAULT '[]'::jsonb,
	"suggested_action" text,
	"business_impact" text,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"actor_id" text,
	"trace_id" uuid,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "artifact_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"approval_id" text NOT NULL,
	"artifact_type" text NOT NULL,
	"artifact_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"domain" text NOT NULL,
	"summary" text NOT NULL,
	"requested_by_user_id" integer,
	"requested_by_label" text,
	"reviewed_by_user_id" integer,
	"reviewed_by_label" text,
	"review_note" text,
	"correlation_id" text,
	"workflow_run_id" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "artifact_approvals_approval_id_unique" UNIQUE("approval_id")
);
--> statement-breakpoint
CREATE TABLE "platform_job_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"workflow_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"domain" text NOT NULL,
	"triggered_by" text DEFAULT 'scheduler' NOT NULL,
	"triggered_by_user_id" integer,
	"payload" jsonb,
	"result" jsonb,
	"error" text,
	"retries" integer DEFAULT 0 NOT NULL,
	"correlation_id" text,
	"workflow_run_id" text,
	"signal_id" text,
	"artifact_id" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_job_runs_run_id_unique" UNIQUE("run_id")
);
--> statement-breakpoint
CREATE TABLE "alert_evaluation_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"evaluated_at" timestamp DEFAULT now() NOT NULL,
	"rules_checked" integer DEFAULT 0 NOT NULL,
	"rules_fired" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"errors" text,
	"metrics" jsonb,
	"triggered_by" text DEFAULT 'scheduled' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_alert_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" integer NOT NULL,
	"rule_name" text NOT NULL,
	"severity" text NOT NULL,
	"metric_name" text NOT NULL,
	"metric_value" real NOT NULL,
	"threshold" real NOT NULL,
	"condition" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'firing' NOT NULL,
	"resolved_at" timestamp,
	"acknowledged_at" timestamp,
	"acknowledged_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_alert_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"metric_name" text NOT NULL,
	"condition" text DEFAULT 'gt' NOT NULL,
	"threshold" real NOT NULL,
	"window_minutes" integer DEFAULT 5 NOT NULL,
	"severity" text DEFAULT 'warning' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"notify_in_app" boolean DEFAULT true NOT NULL,
	"notify_email" boolean DEFAULT false NOT NULL,
	"email_recipients" text[] DEFAULT '{}' NOT NULL,
	"runbook_id" integer,
	"last_evaluated_at" timestamp,
	"last_fired_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_contact_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text DEFAULT 'general' NOT NULL,
	"app" text DEFAULT 'unknown' NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_hash" text,
	"company" text,
	"role" text,
	"message" text,
	"metadata" jsonb,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_incident_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"incident_id" integer NOT NULL,
	"message" text NOT NULL,
	"status" text NOT NULL,
	"author" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'investigating' NOT NULL,
	"severity" text DEFAULT 'minor' NOT NULL,
	"affected_services" text[] DEFAULT '{}' NOT NULL,
	"description" text NOT NULL,
	"assignee" text,
	"postmortem" text,
	"resolved_at" timestamp,
	"posted_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_runbooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'general' NOT NULL,
	"content" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"alert_rule_ids" integer[] DEFAULT '{}' NOT NULL,
	"incident_categories" text[] DEFAULT '{}' NOT NULL,
	"affected_services" text[] DEFAULT '{}' NOT NULL,
	"severity" text DEFAULT 'any' NOT NULL,
	"author" text,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_service_deps" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"source_name" text NOT NULL,
	"source_category" text DEFAULT 'service' NOT NULL,
	"target_id" text NOT NULL,
	"target_name" text NOT NULL,
	"target_category" text DEFAULT 'service' NOT NULL,
	"dep_type" text DEFAULT 'depends_on' NOT NULL,
	"is_critical" boolean DEFAULT false NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_status_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_id" text NOT NULL,
	"status" text DEFAULT 'operational' NOT NULL,
	"latency_ms" integer,
	"checked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_status_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "platform_status_subscriptions_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "pc_ai_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"recommendation_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"confidence" numeric(5, 2),
	"citations" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"defensibility_score" integer,
	"model_route" text,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_approval_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"request_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"source_basis" jsonb,
	"requested_by" integer,
	"approved_by" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pc_audit_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer,
	"org_id" integer NOT NULL,
	"actor_id" integer,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" integer,
	"details" jsonb,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"claim_number" text,
	"policy_number" text,
	"carrier_name" text,
	"adjuster_id" integer,
	"coverage_type" text NOT NULL,
	"policy_limit" numeric(14, 2),
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_communications" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"direction" text NOT NULL,
	"channel" text NOT NULL,
	"from_party" text,
	"to_party" text,
	"subject" text,
	"summary" text,
	"extracted_asks" jsonb,
	"extracted_commitments" jsonb,
	"is_privileged" boolean DEFAULT false,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_connector_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"connector_type" text NOT NULL,
	"display_name" text NOT NULL,
	"status" text DEFAULT 'pending_auth' NOT NULL,
	"config" jsonb,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_connector_sync_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"connector_account_id" integer NOT NULL,
	"status" text NOT NULL,
	"records_synced" integer DEFAULT 0,
	"records_failed" integer DEFAULT 0,
	"error_details" jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pc_damages" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"amount" numeric(14, 2) NOT NULL,
	"is_projected" boolean DEFAULT false,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"source_document" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_deadlines" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"title" text NOT NULL,
	"deadline_type" text NOT NULL,
	"due_date" timestamp NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"assigned_to" integer,
	"clock_rule_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_depositions" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"deponent_name" text NOT NULL,
	"deponent_role" text NOT NULL,
	"scheduled_date" timestamp,
	"location" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"key_findings" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_discovery" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"discovery_type" text NOT NULL,
	"direction" text NOT NULL,
	"title" text NOT NULL,
	"served_date" timestamp,
	"due_date" timestamp,
	"status" text DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_document_chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"document_ref" text NOT NULL,
	"document_type" text NOT NULL,
	"chunk_index" integer DEFAULT 0,
	"content" text,
	"extracted_facts" jsonb,
	"privilege_flag" boolean DEFAULT false,
	"review_state" text DEFAULT 'unreviewed',
	"is_generated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_exports" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer,
	"org_id" integer NOT NULL,
	"export_type" text NOT NULL,
	"format" text NOT NULL,
	"scope" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"exported_by" integer,
	"approved_by" integer,
	"file_path" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_forecasts" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"forecast_type" text NOT NULL,
	"confidence" numeric(5, 2),
	"value_low" numeric(14, 2),
	"value_high" numeric(14, 2),
	"value_mid" numeric(14, 2),
	"signals" jsonb,
	"drivers" jsonb,
	"previous_snapshot" jsonb,
	"explanation" text,
	"requires_attorney_review" boolean DEFAULT false,
	"model_route" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_inconsistency_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"flag_type" text NOT NULL,
	"description" text NOT NULL,
	"source_a" text,
	"source_b" text,
	"severity" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolved_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_liens" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"lien_holder" text NOT NULL,
	"lien_type" text NOT NULL,
	"asserted_amount" numeric(14, 2) NOT NULL,
	"negotiated_amount" numeric(14, 2),
	"status" text DEFAULT 'asserted' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_matter_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"tag" text NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_matters" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"title" text NOT NULL,
	"case_number" text,
	"matter_type" text NOT NULL,
	"status" text DEFAULT 'intake' NOT NULL,
	"stage" text,
	"jurisdiction" text,
	"court_name" text,
	"venue_id" integer,
	"filing_date" timestamp,
	"stat_of_limitations" timestamp,
	"health_score" integer,
	"settlement_low" numeric(14, 2),
	"settlement_high" numeric(14, 2),
	"settlement_mid" numeric(14, 2),
	"total_damages" numeric(14, 2),
	"total_liens" numeric(14, 2),
	"assigned_attorney_id" integer,
	"assigned_paralegal_id" integer,
	"tags" jsonb,
	"notes" text,
	"source_lineage" text,
	"privilege_flag" boolean DEFAULT false,
	"export_safe" boolean DEFAULT true,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_medical_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"provider_name" text NOT NULL,
	"provider_type" text NOT NULL,
	"event_type" text NOT NULL,
	"description" text,
	"diagnosis" text,
	"event_date" timestamp NOT NULL,
	"billed_amount" numeric(12, 2),
	"paid_amount" numeric(12, 2),
	"outstanding_amount" numeric(12, 2),
	"document_ref" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"claim_id" integer,
	"offer_type" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"source" text,
	"notes" text,
	"offer_date" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_parties" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"role" text NOT NULL,
	"name" text NOT NULL,
	"organization" text,
	"email" text,
	"phone" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_playbooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"matter_type" text,
	"steps" jsonb,
	"required_artifacts" jsonb,
	"approval_checkpoints" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_privilege_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer NOT NULL,
	"flag_type" text NOT NULL,
	"flagged_by" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_readiness_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"pillar" text NOT NULL,
	"score" integer NOT NULL,
	"max_score" integer DEFAULT 100 NOT NULL,
	"details" jsonb,
	"computed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"playbook_id" integer,
	"title" text NOT NULL,
	"description" text,
	"assigned_to" integer,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"due_date" timestamp,
	"completed_at" timestamp,
	"source" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_witnesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"affiliation" text,
	"contact_info" text,
	"deposed" boolean DEFAULT false,
	"deposition_date" timestamp,
	"key_testimony" text,
	"credibility" text DEFAULT 'unknown',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_gc_audit_entries" (
	"id" text NOT NULL,
	"matter_id" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"action" text NOT NULL,
	"detail" text NOT NULL,
	"ip" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pc_gc_audit_entries_matter_id_id_pk" PRIMARY KEY("matter_id","id")
);
--> statement-breakpoint
CREATE TABLE "pc_gc_matters" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text DEFAULT 'demo' NOT NULL,
	"name" text NOT NULL,
	"client_name" text NOT NULL,
	"matter_number" text NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"privilege_level" text NOT NULL,
	"pressure_score" integer DEFAULT 0 NOT NULL,
	"complexity_score" integer DEFAULT 0 NOT NULL,
	"opened_date" text NOT NULL,
	"trial_date" text,
	"closing_date" text,
	"next_deadline" text NOT NULL,
	"next_deadline_label" text NOT NULL,
	"lead_counsel" text NOT NULL,
	"jurisdiction" text NOT NULL,
	"estimated_exposure" numeric(18, 2),
	"summary" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"parties" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"wall" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_gc_obligations" (
	"id" text NOT NULL,
	"matter_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"due_date" text NOT NULL,
	"status" text NOT NULL,
	"assignee" text NOT NULL,
	"dependencies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"privilege_level" text NOT NULL,
	"filing_required" boolean DEFAULT false NOT NULL,
	"court_id" text,
	"consequence" text,
	"completed_date" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pc_gc_obligations_matter_id_id_pk" PRIMARY KEY("matter_id","id")
);
--> statement-breakpoint
CREATE TABLE "pc_gc_proof_chain_entries" (
	"id" text NOT NULL,
	"matter_id" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"event_type" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"privilege_level" text NOT NULL,
	"author" text NOT NULL,
	"parties" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"document_ref" text,
	"hash" text,
	"redacted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pc_gc_proof_chain_entries_matter_id_id_pk" PRIMARY KEY("matter_id","id")
);
--> statement-breakpoint
CREATE TABLE "pc_adjuster_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"insurer_profile_id" integer,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"claim_office" text,
	"negotiation_style" text,
	"average_response_days" integer,
	"decision_authority" numeric(14, 2),
	"historical_notes" text,
	"source_lineage" text,
	"actor_id" integer,
	"export_flag" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_ai_review_packets" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"review_type" text NOT NULL,
	"generated_content" text,
	"source_references" jsonb,
	"grounding_score" integer,
	"flagged_assertions" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"approved_by" integer,
	"approved_at" timestamp,
	"model_route" text,
	"is_privileged" boolean DEFAULT true,
	"export_flag" boolean DEFAULT false,
	"actor_id" integer,
	"source_lineage" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_appeals" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"denial_id" integer,
	"no_fault_claim_id" integer,
	"appeal_type" text NOT NULL,
	"filed_at" timestamp,
	"deadline_at" timestamp,
	"status" text DEFAULT 'not_filed' NOT NULL,
	"outcome" text,
	"decision_date" timestamp,
	"decision_notes" text,
	"appealing_party" text,
	"grounds_for_appeal" text,
	"source_lineage" text,
	"actor_id" integer,
	"is_privileged" boolean DEFAULT true,
	"export_flag" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_clock_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"clock_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"occurred_at" timestamp NOT NULL,
	"description" text,
	"source_document" text,
	"source_lineage" text,
	"actor_id" integer,
	"is_privileged" boolean DEFAULT false,
	"export_flag" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_clock_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" text NOT NULL,
	"clock_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"day_limit" integer NOT NULL,
	"trigger_event" text NOT NULL,
	"consequence" text,
	"citation" text,
	"is_mandatory" boolean DEFAULT true,
	"applies_to" text DEFAULT 'all' NOT NULL,
	"is_active" boolean DEFAULT true,
	"source_lineage" text,
	"actor_id" integer,
	"is_privileged" boolean DEFAULT false,
	"export_flag" boolean DEFAULT false,
	"last_reviewed" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pc_clock_rules_rule_id_unique" UNIQUE("rule_id")
);
--> statement-breakpoint
CREATE TABLE "pc_communication_windows" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"party_name" text NOT NULL,
	"party_role" text NOT NULL,
	"last_contact_at" timestamp,
	"days_silent" integer,
	"silence_risk" text DEFAULT 'none' NOT NULL,
	"expected_response_days" integer,
	"outstanding_items" jsonb,
	"escalation_status" text DEFAULT 'none' NOT NULL,
	"source_lineage" text,
	"actor_id" integer,
	"is_privileged" boolean DEFAULT false,
	"export_flag" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_coverage_positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"position_type" text NOT NULL,
	"carrier_name" text,
	"position_date" timestamp NOT NULL,
	"coverage_amount" numeric(14, 2),
	"reservation_basis" text,
	"policy_ref" text,
	"analysis_notes" text,
	"dispute_strength" text,
	"source_lineage" text,
	"actor_id" integer,
	"is_privileged" boolean DEFAULT true,
	"export_flag" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_defensibility_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"overall_score" integer NOT NULL,
	"grounding_score" integer,
	"human_approval_score" integer,
	"privilege_score" integer,
	"audit_completeness" integer,
	"source_attribution_score" integer,
	"open_flags" integer DEFAULT 0,
	"flag_details" jsonb,
	"computed_at" timestamp DEFAULT now() NOT NULL,
	"actor_id" integer,
	"export_flag" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "pc_demand_packets" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"demand_amount" numeric(14, 2),
	"readiness_score" integer,
	"missing_items" jsonb,
	"included_items" jsonb,
	"sent_at" timestamp,
	"approved_by" integer,
	"approved_at" timestamp,
	"response_at" timestamp,
	"response_amount" numeric(14, 2),
	"notes" text,
	"source_lineage" text,
	"actor_id" integer,
	"is_privileged" boolean DEFAULT true,
	"export_flag" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_demand_readiness_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
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
	"computed_at" timestamp DEFAULT now() NOT NULL,
	"actor_id" integer,
	"export_flag" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "pc_denials" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"no_fault_claim_id" integer,
	"denial_type" text NOT NULL,
	"denied_by" text,
	"denied_at" timestamp NOT NULL,
	"denial_reason" text,
	"denial_code" text,
	"amount_denied" numeric(14, 2),
	"appeal_status" text DEFAULT 'not_appealed' NOT NULL,
	"appeal_deadline" timestamp,
	"source_lineage" text,
	"actor_id" integer,
	"is_privileged" boolean DEFAULT false,
	"export_flag" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_disclaimers" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"issued_by" text,
	"issued_at" timestamp NOT NULL,
	"due_date" timestamp,
	"is_timely" boolean,
	"days_from_loss" integer,
	"basis" text,
	"policy_exclusion" text,
	"vulnerability_score" integer,
	"challenge_status" text DEFAULT 'unchallenged' NOT NULL,
	"notes" text,
	"source_lineage" text,
	"actor_id" integer,
	"is_privileged" boolean DEFAULT false,
	"export_flag" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_external_appeals" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"appeal_id" integer,
	"tribunal" text NOT NULL,
	"tribunal_case_no" text,
	"panel_composition" text,
	"hearing_date" timestamp,
	"filing_deadline" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"award_amount" numeric(14, 2),
	"outcome" text,
	"representing_counsel" text,
	"notes" text,
	"source_lineage" text,
	"actor_id" integer,
	"is_privileged" boolean DEFAULT true,
	"export_flag" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_forecast_drivers" (
	"id" serial PRIMARY KEY NOT NULL,
	"forecast_run_id" integer NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"actor_id" integer,
	"driver_name" text NOT NULL,
	"driver_value" text,
	"impact" text NOT NULL,
	"weight" numeric(5, 2),
	"explanation" text,
	"source_ref" text,
	"source_lineage" text,
	"export_flag" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_forecast_explanations" (
	"id" serial PRIMARY KEY NOT NULL,
	"forecast_run_id" integer NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"actor_id" integer,
	"headline" text,
	"detail" text,
	"recommendations" jsonb,
	"citations" jsonb,
	"is_privileged" boolean DEFAULT false,
	"source_lineage" text,
	"export_flag" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_forecast_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"forecast_type" text NOT NULL,
	"score" numeric(7, 2) NOT NULL,
	"confidence" numeric(5, 2),
	"weekly_delta" numeric(7, 2),
	"next_best_action" text,
	"model_version" text,
	"run_at" timestamp DEFAULT now() NOT NULL,
	"actor_id" integer,
	"export_flag" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "pc_insurer_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"carrier_name" text NOT NULL,
	"claim_office" text,
	"region" text,
	"reserving_style" text,
	"denial_pattern" text,
	"median_first_offer" numeric(14, 2),
	"average_response_days" integer,
	"mediation_behavior" text,
	"escalation_threshold" numeric(14, 2),
	"litigation_tolerance" text,
	"notes" text,
	"source_lineage" text,
	"actor_id" integer,
	"export_flag" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_matter_clocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"clock_type" text NOT NULL,
	"started_at" timestamp NOT NULL,
	"deadline_at" timestamp NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"days_remaining" integer,
	"is_breached" boolean DEFAULT false,
	"breached_at" timestamp,
	"rule_ref" text,
	"notes" text,
	"source_lineage" text,
	"actor_id" integer,
	"is_privileged" boolean DEFAULT false,
	"export_flag" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_mediation_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"mediator_name" text,
	"scheduled_at" timestamp,
	"location" text,
	"session_type" text DEFAULT 'court_ordered' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"pre_readiness_score" integer,
	"conversion_probability" numeric(5, 2),
	"settlement_amount" numeric(14, 2),
	"opening_demand" numeric(14, 2),
	"opening_offer" numeric(14, 2),
	"outcome" text,
	"notes" text,
	"source_lineage" text,
	"actor_id" integer,
	"is_privileged" boolean DEFAULT true,
	"export_flag" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_medical_bill_cycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"no_fault_claim_id" integer,
	"provider_name" text NOT NULL,
	"service_date" timestamp NOT NULL,
	"submitted_date" timestamp,
	"billed_amount" numeric(12, 2),
	"paid_amount" numeric(12, 2),
	"denied_amount" numeric(12, 2),
	"status" text DEFAULT 'submitted' NOT NULL,
	"denial_reason" text,
	"days_to_response" integer,
	"is_late" boolean DEFAULT false,
	"source_lineage" text,
	"actor_id" integer,
	"export_flag" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_no_fault_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"claimant_name" text NOT NULL,
	"carrier_id" integer,
	"carrier_name" text,
	"assignor_name" text,
	"date_of_loss" timestamp NOT NULL,
	"notice_sent_at" timestamp,
	"notice_due_date" timestamp,
	"notice_status" text DEFAULT 'pending' NOT NULL,
	"bill_status" text DEFAULT 'open' NOT NULL,
	"total_billed" numeric(14, 2),
	"total_paid" numeric(14, 2),
	"total_denied" numeric(14, 2),
	"arbitration_status" text DEFAULT 'not_filed' NOT NULL,
	"arbitration_filed_at" timestamp,
	"award_amount" numeric(14, 2),
	"evidence_lock_risk" integer,
	"source_lineage" text,
	"actor_id" integer,
	"is_privileged" boolean DEFAULT false,
	"export_flag" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_ny_rule_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"day_limit" integer,
	"consequence" text,
	"citation" text,
	"last_reviewed" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pc_ny_rule_profiles_rule_id_unique" UNIQUE("rule_id")
);
--> statement-breakpoint
CREATE TABLE "pc_offer_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"offer_type" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"offering_party" text,
	"offered_at" timestamp NOT NULL,
	"expires_at" timestamp,
	"delta_from_previous" numeric(14, 2),
	"delta_pct" numeric(7, 2),
	"movement_signal" text,
	"notes" text,
	"source_lineage" text,
	"actor_id" integer,
	"is_privileged" boolean DEFAULT true,
	"export_flag" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_part_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"venue_id" integer,
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
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_reserve_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"carrier_id" integer,
	"carrier_name" text,
	"reserve_amount" numeric(14, 2) NOT NULL,
	"prior_reserve" numeric(14, 2),
	"delta" numeric(14, 2),
	"reserve_date" timestamp NOT NULL,
	"movement_type" text NOT NULL,
	"inferred_signal" text,
	"source_lineage" text,
	"actor_id" integer,
	"is_privileged" boolean DEFAULT true,
	"export_flag" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_venue_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"county" text NOT NULL,
	"court_name" text NOT NULL,
	"court_type" text NOT NULL,
	"average_cycle_months" integer,
	"median_verdict_auto" numeric(14, 2),
	"median_verdict_premises" numeric(14, 2),
	"median_verdict_coverage" numeric(14, 2),
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
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_verification_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"no_fault_claim_id" integer,
	"request_type" text NOT NULL,
	"requested_by" text,
	"requested_at" timestamp NOT NULL,
	"due_date" timestamp,
	"response_at" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"outcome" text,
	"suspension_trigger" boolean DEFAULT false,
	"notes" text,
	"source_lineage" text,
	"actor_id" integer,
	"is_privileged" boolean DEFAULT false,
	"export_flag" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_approval_evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"approval_request_id" integer NOT NULL,
	"evidence_type" text NOT NULL,
	"entity_ref" text,
	"entity_id" integer,
	"summary" text,
	"confidence" real,
	"source_class" text,
	"attached_at" timestamp DEFAULT now() NOT NULL,
	"attached_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_audit_packets" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer,
	"packet_type" text NOT NULL,
	"title" text NOT NULL,
	"contents" jsonb,
	"proof_chain_ids" jsonb,
	"export_safe" boolean DEFAULT false,
	"privilege_checked" boolean DEFAULT false,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"generated_by" integer,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"file_path" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_contradiction_panel" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"contradiction_type" text NOT NULL,
	"description" text NOT NULL,
	"source_a_ref" text,
	"source_a_type" text,
	"source_b_ref" text,
	"source_b_type" text,
	"severity" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution_notes" text,
	"detected_by_lane" text,
	"confidence" real,
	"resolved_by" integer,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_copilot_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer,
	"session_id" integer,
	"draft_type" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"source_references" jsonb,
	"grounding_score" real,
	"unsupported_claims_count" integer DEFAULT 0,
	"review_state" text DEFAULT 'draft' NOT NULL,
	"export_safe" boolean DEFAULT false,
	"privilege_flag" boolean DEFAULT true,
	"proof_chain_id" integer,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"approved_by" integer,
	"approved_at" timestamp,
	"model_lane" text,
	"model_provider" text,
	"model_version" text,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_dashboard_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"dashboard_type" text NOT NULL,
	"data" jsonb NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"computed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_graphql_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"user_id" integer,
	"operation_name" text,
	"operation_type" text,
	"field_path" text,
	"variables" jsonb,
	"errors" jsonb,
	"complexity" integer,
	"depth" integer,
	"latency_ms" integer,
	"persisted_query_id" text,
	"correlation_id" text,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_graphql_audit_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"audit_log_id" integer NOT NULL,
	"tag" text NOT NULL,
	"value" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"title" text NOT NULL,
	"severity" text NOT NULL,
	"service" text,
	"description" text,
	"status" text DEFAULT 'open' NOT NULL,
	"affected_matters" jsonb,
	"timeline" jsonb,
	"root_cause" text,
	"resolution" text,
	"assigned_to" integer,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"mitigated_at" timestamp,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_m365_calendar_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer,
	"calendar_event_id" text NOT NULL,
	"subject" text,
	"organizer" text,
	"attendees" jsonb,
	"start_time" timestamp,
	"end_time" timestamp,
	"location" text,
	"is_online_meeting" boolean DEFAULT false,
	"event_type" text,
	"prep_window_start" timestamp,
	"prep_window_end" timestamp,
	"linked_deadline_id" integer,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_m365_sharepoint_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer,
	"drive_item_id" text NOT NULL,
	"site_id" text,
	"library_id" text,
	"file_name" text NOT NULL,
	"file_path" text,
	"mime_type" text,
	"file_size" integer,
	"web_url" text,
	"e_tag" text,
	"last_modified_at" timestamp,
	"last_modified_by" text,
	"change_type" text,
	"acl_snapshot" jsonb,
	"mapped_to_binder_id" integer,
	"linked_document_id" integer,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_m365_teams_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer,
	"message_id" text NOT NULL,
	"channel_id" text,
	"chat_id" text,
	"from_user_id" text,
	"from_display_name" text,
	"body" text,
	"message_type" text DEFAULT 'standard' NOT NULL,
	"linked_approval_id" integer,
	"sent_at" timestamp,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_matter_twin_subpages" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"subpage" text NOT NULL,
	"last_computed_at" timestamp,
	"snapshot_data" jsonb,
	"staleness" text DEFAULT 'fresh',
	"computation_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_onboarding_checklist" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"step" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"completed_by" integer,
	"completed_at" timestamp,
	"blocker_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_operational_flow_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer,
	"flow_type" text NOT NULL,
	"status" text DEFAULT 'initiated' NOT NULL,
	"input_payload" jsonb,
	"output_payload" jsonb,
	"stages_completed" jsonb,
	"current_stage" text,
	"approval_id" integer,
	"proof_chain_id" integer,
	"error_details" text,
	"retry_count" integer DEFAULT 0,
	"triggered_by" integer,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_org_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text NOT NULL,
	"matter_id" integer,
	"granted_by" integer,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_persisted_queries" (
	"id" serial PRIMARY KEY NOT NULL,
	"query_id" text NOT NULL,
	"operation_name" text,
	"query_body" text NOT NULL,
	"allowed_roles" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pc_persisted_queries_query_id_unique" UNIQUE("query_id")
);
--> statement-breakpoint
CREATE TABLE "pc_pressure_graph_dimensions" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"dimension" text NOT NULL,
	"current_score" real NOT NULL,
	"prior_score" real,
	"movement_direction" text DEFAULT 'stable' NOT NULL,
	"top_drivers" jsonb,
	"source_mix" jsonb,
	"confidence" real,
	"affected_milestones" jsonb,
	"likely_consequence" text,
	"recommended_next_actions" jsonb,
	"computed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_pressure_watchlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"dimension" text NOT NULL,
	"threshold_score" real NOT NULL,
	"alert_on_exceed" boolean DEFAULT true,
	"assigned_to" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_schema_registry" (
	"id" serial PRIMARY KEY NOT NULL,
	"subgraph_name" text NOT NULL,
	"schema_version" text NOT NULL,
	"schema_body" text NOT NULL,
	"is_currently_active" boolean DEFAULT false NOT NULL,
	"published_by" text,
	"breaking_change" boolean DEFAULT false,
	"change_notes" text,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_service_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"service" text NOT NULL,
	"latency_p50_ms" real,
	"latency_p95_ms" real,
	"latency_p99_ms" real,
	"request_count" integer DEFAULT 0,
	"error_count" integer DEFAULT 0,
	"queue_depth" integer,
	"dlq_depth" integer,
	"sync_lag_ms" integer,
	"health_status" text DEFAULT 'healthy' NOT NULL,
	"measured_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_signal_forge_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"source_id" integer,
	"stage" text DEFAULT 'ingest' NOT NULL,
	"input_count" integer DEFAULT 0,
	"output_count" integer DEFAULT 0,
	"rejected_count" integer DEFAULT 0,
	"contradictions_found" integer DEFAULT 0,
	"quality_score_avg" real,
	"error_details" jsonb,
	"duration_ms" integer,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_signal_quality_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"signal_id" integer NOT NULL,
	"signal_table" text NOT NULL,
	"freshness_score" real,
	"provenance_score" real,
	"usefulness_score" real,
	"overall_score" real NOT NULL,
	"geolinked" boolean DEFAULT false,
	"jurisdiction_matched" boolean DEFAULT false,
	"normalized" boolean DEFAULT true,
	"flagged" boolean DEFAULT false,
	"flag_reason" text,
	"computed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_tenant_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"display_name" text NOT NULL,
	"slug" text NOT NULL,
	"oidc_issuer" text,
	"oidc_client_id" text,
	"allowed_domains" jsonb,
	"enabled_lanes" jsonb,
	"enabled_features" jsonb,
	"max_matters" integer DEFAULT 1000,
	"max_users" integer DEFAULT 50,
	"billing_plan" text DEFAULT 'trial' NOT NULL,
	"onboarding_status" text DEFAULT 'not_started' NOT NULL,
	"copilot_enabled" boolean DEFAULT false,
	"worldline_enabled" boolean DEFAULT false,
	"m365_tenant_id" text,
	"m365_consent_granted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pc_tenant_config_org_id_unique" UNIQUE("org_id"),
	CONSTRAINT "pc_tenant_config_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "pc_approval_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"approval_request_id" integer NOT NULL,
	"step_order" integer DEFAULT 1 NOT NULL,
	"approver_role" text NOT NULL,
	"approver_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"comments" text,
	"escalation_deadline" timestamp,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_background_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"job_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payload" jsonb,
	"result" jsonb,
	"error" text,
	"matter_id" integer,
	"connector_account_id" integer,
	"idempotency_key" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"next_retry_at" timestamp,
	"correlation_id" text,
	"actor_id" integer,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_dead_letter_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"source_job_id" integer,
	"job_type" text NOT NULL,
	"payload" jsonb,
	"error" text,
	"failed_at" timestamp DEFAULT now() NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"resolved_at" timestamp,
	"resolved_by" integer,
	"resolution" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer,
	"title" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"checksum" text,
	"storage_uri" text,
	"storage_container" text,
	"document_type" text,
	"source_system" text,
	"source_record_id" text,
	"source_confidence" numeric(5, 2),
	"is_generated" boolean DEFAULT false,
	"privilege_flag" boolean DEFAULT false,
	"review_state" text DEFAULT 'unreviewed',
	"uploaded_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer,
	"message_id" text,
	"conversation_id" text,
	"from_address" text,
	"to_addresses" jsonb,
	"cc_addresses" jsonb,
	"subject" text,
	"body_preview" text,
	"has_attachments" boolean DEFAULT false,
	"attachment_count" integer DEFAULT 0,
	"received_at" timestamp,
	"is_linked" boolean DEFAULT false,
	"source_system" text DEFAULT 'microsoft_graph',
	"source_record_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_extraction_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"document_id" integer NOT NULL,
	"extraction_provider" text DEFAULT 'azure_doc_intel' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"confidence" numeric(5, 2),
	"extracted_text" text,
	"extracted_tables" jsonb,
	"extracted_metadata" jsonb,
	"layout_data" jsonb,
	"error" text,
	"cost_cents" integer,
	"processing_time_ms" integer,
	"correlation_id" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_feature_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"flag_key" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_graph_subscription_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"connector_account_id" integer NOT NULL,
	"resource_path" text NOT NULL,
	"subscription_id" text NOT NULL,
	"change_type" text NOT NULL,
	"expiration_date_time" timestamp,
	"client_state" text,
	"status" text DEFAULT 'active' NOT NULL,
	"last_renewed_at" timestamp,
	"renewal_failure_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"user_id" integer,
	"matter_id" integer,
	"channel" text DEFAULT 'in_app' NOT NULL,
	"notification_type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"action_url" text,
	"metadata" jsonb,
	"is_read" boolean DEFAULT false,
	"sent_at" timestamp,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_source_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer,
	"source_system" text NOT NULL,
	"source_record_id" text NOT NULL,
	"source_type" text NOT NULL,
	"title" text,
	"metadata" jsonb,
	"last_synced_at" timestamp,
	"sync_cursor" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_webhook_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"connector_account_id" integer,
	"provider" text NOT NULL,
	"resource_type" text NOT NULL,
	"subscription_id" text,
	"notification_url" text,
	"expires_at" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"last_notification_at" timestamp,
	"renewal_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_change_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"change_type" text NOT NULL,
	"source_type" text NOT NULL,
	"source_ref" text,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"details" jsonb,
	"severity" text DEFAULT 'info' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"actor_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_ingestion_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"source_type" text NOT NULL,
	"source_ref" text,
	"matter_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"item_count" integer DEFAULT 0 NOT NULL,
	"processed_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"error_details" jsonb,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_matter_desk_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"summary" text,
	"last_changes" jsonb,
	"comms_summary" jsonb,
	"new_files" jsonb,
	"deadline_watch" jsonb,
	"missing_support" jsonb,
	"pressure_summary" jsonb,
	"forecast_summary" jsonb,
	"next_best_action" text,
	"signoff_status" text DEFAULT 'clear' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_morning_briefs" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"brief_date" timestamp NOT NULL,
	"matters_changed" jsonb,
	"deadlines_approaching" jsonb,
	"silence_windows" jsonb,
	"new_files_received" jsonb,
	"drafts_waiting" jsonb,
	"best_actions" jsonb,
	"quiet_risks" jsonb,
	"is_viewed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_next_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"action_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"impact_score" real DEFAULT 0 NOT NULL,
	"estimated_minutes" integer DEFAULT 15 NOT NULL,
	"blocks_items" jsonb,
	"status" text DEFAULT 'suggested' NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_quiet_risks" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"risk_type" text NOT NULL,
	"title" text NOT NULL,
	"explanation" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"days_silent" integer,
	"deadline_days_remaining" integer,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_review_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"review_type" text NOT NULL,
	"title" text NOT NULL,
	"draft_content" text,
	"source_support" jsonb,
	"unsupported_statements" jsonb,
	"contradiction_warnings" jsonb,
	"privilege_warnings" jsonb,
	"review_state" text DEFAULT 'pending' NOT NULL,
	"approval_state" text DEFAULT 'none' NOT NULL,
	"safe_to_send" boolean DEFAULT false NOT NULL,
	"reviewed_by" integer,
	"approved_by" integer,
	"proof_chain_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_signoff_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"request_type" text NOT NULL,
	"title" text NOT NULL,
	"reason" text NOT NULL,
	"support_summary" text,
	"risk_summary" text,
	"if_approved" text,
	"if_rejected" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_by" integer,
	"resolved_by" integer,
	"resolved_at" timestamp,
	"review_item_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_word_exports" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"export_type" text NOT NULL,
	"title" text NOT NULL,
	"file_path" text,
	"file_size" integer,
	"proof_chain_ref" text,
	"generated_by" integer,
	"access_log" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_carrier_behavior_patterns" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"carrier_name" text NOT NULL,
	"claim_office" text,
	"pattern_type" text NOT NULL,
	"description" text,
	"evidence_count" integer DEFAULT 1 NOT NULL,
	"last_seen" timestamp DEFAULT now() NOT NULL,
	"first_seen" timestamp DEFAULT now() NOT NULL,
	"confidence" real,
	"operational_implication" text,
	"tenant_id" integer,
	"provenance" text,
	"freshness_score" real,
	"generated_by_service" text DEFAULT 'insurer_pressure_engine',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_carrier_offer_behavior" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"carrier_name" text NOT NULL,
	"offer_amount" numeric(14, 2),
	"prior_offer_amount" numeric(14, 2),
	"movement_delta" numeric(14, 2),
	"movement_pct" real,
	"movement_signal" text DEFAULT 'new' NOT NULL,
	"days_since_last_offer" integer,
	"offer_date" timestamp DEFAULT now() NOT NULL,
	"tenant_id" integer,
	"provenance" text,
	"generated_by_service" text DEFAULT 'insurer_pressure_engine',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_carrier_reserve_behavior" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"carrier_name" text NOT NULL,
	"reserve_amount" numeric(14, 2),
	"prior_reserve" numeric(14, 2),
	"delta" numeric(14, 2),
	"movement_type" text NOT NULL,
	"inferred_signal" text,
	"pressure_impact" text,
	"reserve_date" timestamp DEFAULT now() NOT NULL,
	"tenant_id" integer,
	"provenance" text,
	"generated_by_service" text DEFAULT 'insurer_pressure_engine',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_carrier_response_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"carrier_name" text NOT NULL,
	"adjuster_id" integer,
	"event_type" text NOT NULL,
	"description" text,
	"days_since_last_contact" integer,
	"signal_strength" real,
	"pressure_impact" text,
	"source_ref" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" integer,
	"provenance" text,
	"generated_by_service" text DEFAULT 'insurer_pressure_engine',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_carrier_silence_windows" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"carrier_name" text NOT NULL,
	"adjuster_id" integer,
	"silence_start_at" timestamp NOT NULL,
	"silence_end_at" timestamp,
	"days_silent" integer DEFAULT 0 NOT NULL,
	"is_current" boolean DEFAULT true,
	"silence_risk" text DEFAULT 'low' NOT NULL,
	"outstanding_items" jsonb,
	"escalation_suggested" boolean DEFAULT false,
	"escalation_template_key" text,
	"tenant_id" integer,
	"provenance" text,
	"generated_by_service" text DEFAULT 'insurer_pressure_engine',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_insurer_pressure_drivers" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"snapshot_id" integer,
	"driver_name" text NOT NULL,
	"driver_category" text NOT NULL,
	"weight" real DEFAULT 0.5 NOT NULL,
	"impact" text NOT NULL,
	"raw_value" text,
	"explanation" text,
	"source_ref" text,
	"source_class" text,
	"confidence" real,
	"tenant_id" integer,
	"provenance" text,
	"generated_by_service" text DEFAULT 'insurer_pressure_engine',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_insurer_pressure_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"overall_score" real NOT NULL,
	"prior_score" real,
	"direction" text DEFAULT 'new' NOT NULL,
	"confidence" real DEFAULT 0.7 NOT NULL,
	"operational_meaning" text,
	"recommended_next_action" text,
	"carrier_name" text,
	"adjuster_id" integer,
	"recent_signals" jsonb,
	"computed_at" timestamp DEFAULT now() NOT NULL,
	"model_version" text DEFAULT 'v1',
	"requires_review" boolean DEFAULT false,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"tenant_id" integer,
	"provenance" text,
	"freshness_score" real,
	"generated_by_service" text DEFAULT 'insurer_pressure_engine',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_movement_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"recommendation_type" text NOT NULL,
	"title" text NOT NULL,
	"explanation" text NOT NULL,
	"estimated_impact" text,
	"confidence" real,
	"priority" text DEFAULT 'medium' NOT NULL,
	"estimated_minutes" integer,
	"status" text DEFAULT 'suggested' NOT NULL,
	"accepted_by" integer,
	"accepted_at" timestamp,
	"completed_at" timestamp,
	"source_ref" text,
	"source_class" text,
	"proof_chain_ref" text,
	"tenant_id" integer,
	"provenance" text,
	"generated_by_service" text,
	"requires_approval" boolean DEFAULT false,
	"approval_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_portfolio_action_effectiveness" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"action_type" text NOT NULL,
	"matter_type" text,
	"outcome_metric" text NOT NULL,
	"average_impact" real,
	"success_rate" real,
	"average_time_to_impact_days" real,
	"sample_size" integer DEFAULT 0,
	"contextual_note" text,
	"computed_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" integer,
	"provenance" text,
	"generated_by_service" text DEFAULT 'portfolio_learning',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_portfolio_benchmark_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"benchmark_type" text NOT NULL,
	"matter_type" text,
	"band" text NOT NULL,
	"metric_name" text NOT NULL,
	"metric_value" real NOT NULL,
	"sample_size" integer DEFAULT 0,
	"confidence_interval" real,
	"computed_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" integer,
	"provenance" text,
	"generated_by_service" text DEFAULT 'portfolio_learning',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_portfolio_matter_cohorts" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"cohort_type" text NOT NULL,
	"matter_id" integer NOT NULL,
	"cohort_score" real,
	"cohort_rank" integer,
	"cohort_percentile" real,
	"key_signals" jsonb,
	"computed_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" integer,
	"provenance" text,
	"generated_by_service" text DEFAULT 'portfolio_learning',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_portfolio_team_lag_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"metric_type" text NOT NULL,
	"team_role" text,
	"avg_days" real,
	"median_days" real,
	"p90_days" real,
	"sample_size" integer DEFAULT 0,
	"period_days" integer DEFAULT 90,
	"computed_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" integer,
	"provenance" text,
	"generated_by_service" text DEFAULT 'portfolio_learning',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_quiet_risk_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"risk_score" real NOT NULL,
	"prior_score" real,
	"deterioration_rate" real,
	"top_signals" jsonb,
	"silent_dimensions" jsonb,
	"days_without_activity" integer,
	"last_positive_event_at" timestamp,
	"recommended_action" text,
	"confidence" real,
	"requires_review" boolean DEFAULT false,
	"computed_at" timestamp DEFAULT now() NOT NULL,
	"model_version" text DEFAULT 'v1',
	"tenant_id" integer,
	"provenance" text,
	"generated_by_service" text DEFAULT 'portfolio_learning',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_settlement_friction_drivers" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"snapshot_id" integer,
	"driver_name" text NOT NULL,
	"blocker_category" text NOT NULL,
	"weight" real DEFAULT 0.5 NOT NULL,
	"impact" text NOT NULL,
	"raw_value" text,
	"explanation" text,
	"source_ref" text,
	"source_class" text,
	"confidence" real,
	"drag_estimate_days" integer,
	"tenant_id" integer,
	"provenance" text,
	"generated_by_service" text DEFAULT 'settlement_friction_engine',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_settlement_friction_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"overall_score" real NOT NULL,
	"prior_score" real,
	"direction" text DEFAULT 'new' NOT NULL,
	"confidence" real DEFAULT 0.7 NOT NULL,
	"readiness_drag_days" integer,
	"friction_class" text DEFAULT 'mixed' NOT NULL,
	"smallest_action" text,
	"requires_review" boolean DEFAULT false,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"computed_at" timestamp DEFAULT now() NOT NULL,
	"model_version" text DEFAULT 'v1',
	"tenant_id" integer,
	"provenance" text,
	"freshness_score" real,
	"generated_by_service" text DEFAULT 'settlement_friction_engine',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_worldline_county_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"county" text NOT NULL,
	"state" text DEFAULT 'NY' NOT NULL,
	"population" integer,
	"median_income" numeric(14, 2),
	"poverty_rate" real,
	"vehicle_ownership_rate" real,
	"uninsured_rate" real,
	"census_year" integer,
	"raw_data" jsonb,
	"legal_usefulness_score" real,
	"freshness_score" real,
	"tenant_id" integer,
	"provenance" text,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_worldline_recovery_markers" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer,
	"marker_type" text NOT NULL,
	"description" text,
	"claimant_identifier" text,
	"estimated_amount" numeric(14, 2),
	"msp_status" text,
	"requires_action" boolean DEFAULT false,
	"action_description" text,
	"raw_data" jsonb,
	"legal_usefulness_score" real,
	"freshness_score" real,
	"tenant_id" integer,
	"provenance" text,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_worldline_regulatory_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"source" text NOT NULL,
	"event_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"jurisdiction" text,
	"affected_carriers" jsonb,
	"effective_date" timestamp,
	"expires_date" timestamp,
	"citation" text,
	"raw_data" jsonb,
	"legal_usefulness_score" real,
	"freshness_score" real,
	"tenant_id" integer,
	"provenance" text,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_worldline_signal_overlays" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer,
	"signal_id" integer,
	"source_class" text NOT NULL,
	"overlay_type" text NOT NULL,
	"plain_language_summary" text NOT NULL,
	"confidence" real,
	"freshness_score" real,
	"provenance_score" real,
	"legal_usefulness_score" real,
	"published_to_pressure_graph" boolean DEFAULT false,
	"triggered_forecast_recompute" boolean DEFAULT false,
	"jurisdiction" text,
	"county" text,
	"geo_lat" real,
	"geo_lon" real,
	"tenant_id" integer,
	"provenance" text,
	"generated_by_service" text DEFAULT 'worldline_engine',
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_worldline_source_classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"class_key" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"pilot_one_enabled" boolean DEFAULT true,
	"legal_usefulness_baseline" real DEFAULT 0.7,
	"endpoint_template" text,
	"fetch_method" text,
	"total_fetches" integer DEFAULT 0,
	"last_fetch_at" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"tenant_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_worldline_weather_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"severity" text,
	"affected_area" text,
	"county" text,
	"state" text DEFAULT 'NY',
	"geo_lat" real,
	"geo_lon" real,
	"onset_at" timestamp,
	"expires_at" timestamp,
	"nws_alert_id" text,
	"raw_data" jsonb,
	"legal_usefulness_score" real,
	"freshness_score" real,
	"tenant_id" integer,
	"provenance" text,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_purview_case_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"ediscovery_case_id" text NOT NULL,
	"ediscovery_case_name" text,
	"purview_tenant_id" text,
	"link_status" text DEFAULT 'active' NOT NULL,
	"linked_by" integer,
	"link_notes" text,
	"provenance_source" text DEFAULT 'manual' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_purview_diagnostics" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"connector_account_id" integer,
	"check_type" text NOT NULL,
	"status" text NOT NULL,
	"details" jsonb,
	"required_scopes" jsonb,
	"granted_scopes" jsonb,
	"error_message" text,
	"recovery_hint" text,
	"replay_path" text,
	"checked_at" timestamp DEFAULT now() NOT NULL,
	"next_check_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_purview_export_handoffs" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"case_link_id" integer,
	"export_job_id" text,
	"export_name" text NOT NULL,
	"export_format" text NOT NULL,
	"export_status" text DEFAULT 'pending' NOT NULL,
	"document_count" integer,
	"size_bytes" integer,
	"handoff_destination" text,
	"handoff_method" text,
	"handoff_completed_at" timestamp,
	"handoff_completed_by" integer,
	"provenance_record" jsonb,
	"audit_tag" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_purview_hold_awareness" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"case_link_id" integer,
	"hold_id" text,
	"hold_name" text NOT NULL,
	"hold_scope" text,
	"hold_status" text DEFAULT 'active' NOT NULL,
	"custodians" jsonb,
	"content_sources" jsonb,
	"issued_by" text,
	"issued_at" timestamp,
	"released_at" timestamp,
	"provenance_source" text DEFAULT 'purview_api' NOT NULL,
	"audit_tag" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_purview_scope_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"case_link_id" integer,
	"content_source_type" text NOT NULL,
	"content_source_id" text NOT NULL,
	"content_source_name" text,
	"in_scope" boolean DEFAULT true NOT NULL,
	"review_set_id" text,
	"review_set_name" text,
	"review_set_status" text,
	"document_count" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_recovery_amount_markers" (
	"id" serial PRIMARY KEY NOT NULL,
	"recovery_item_id" integer NOT NULL,
	"org_id" integer NOT NULL,
	"marker_type" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"amount_status" text DEFAULT 'pending' NOT NULL,
	"source_document" text,
	"source_class" text,
	"confidence" numeric(5, 2),
	"marked_at" timestamp DEFAULT now() NOT NULL,
	"actor_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_recovery_dependency_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"recovery_item_id" integer NOT NULL,
	"org_id" integer NOT NULL,
	"dependency_type" text NOT NULL,
	"linked_entity_type" text NOT NULL,
	"linked_entity_id" integer NOT NULL,
	"notes" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_recovery_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"recovery_item_id" integer NOT NULL,
	"org_id" integer NOT NULL,
	"document_type" text NOT NULL,
	"title" text NOT NULL,
	"document_ref" text,
	"source_system" text,
	"confidence" numeric(5, 2),
	"privilege_flag" boolean DEFAULT false,
	"review_state" text DEFAULT 'unreviewed',
	"uploaded_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_recovery_followups" (
	"id" serial PRIMARY KEY NOT NULL,
	"recovery_item_id" integer NOT NULL,
	"org_id" integer NOT NULL,
	"followup_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp,
	"assigned_to" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp,
	"completed_by" integer,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_recovery_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"lien_category" text NOT NULL,
	"lien_holder" text NOT NULL,
	"lifecycle_state" text DEFAULT 'not_identified' NOT NULL,
	"asserted_amount" numeric(14, 2),
	"negotiated_amount" numeric(14, 2),
	"confirmed_amount" numeric(14, 2),
	"amount_status" text DEFAULT 'unknown' NOT NULL,
	"source_class" text DEFAULT 'manual_entry' NOT NULL,
	"confidence" numeric(5, 2),
	"blocks_settlement" boolean DEFAULT false,
	"blocks_export" boolean DEFAULT false,
	"is_stale" boolean DEFAULT false,
	"stale_since" timestamp,
	"last_activity_at" timestamp,
	"amount_last_updated_at" timestamp,
	"documentation_requested_at" timestamp,
	"response_deadline" timestamp,
	"notes" text,
	"provenance" jsonb,
	"assigned_to" integer,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_recovery_parties" (
	"id" serial PRIMARY KEY NOT NULL,
	"recovery_item_id" integer NOT NULL,
	"org_id" integer NOT NULL,
	"role" text NOT NULL,
	"name" text NOT NULL,
	"organization" text,
	"email" text,
	"phone" text,
	"contact_preference" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_recovery_risk_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"org_id" integer NOT NULL,
	"total_asserted" numeric(14, 2),
	"total_confirmed" numeric(14, 2),
	"total_pending" numeric(14, 2),
	"total_stale" integer DEFAULT 0,
	"total_blocking_settlement" integer DEFAULT 0,
	"total_awaiting_response" integer DEFAULT 0,
	"total_unresolved" integer DEFAULT 0,
	"export_blocked" boolean DEFAULT false,
	"overall_risk" text DEFAULT 'medium' NOT NULL,
	"signals" jsonb,
	"snapshot_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_recovery_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"recovery_item_id" integer NOT NULL,
	"org_id" integer NOT NULL,
	"from_state" text,
	"to_state" text NOT NULL,
	"actor_id" integer,
	"actor_role" text,
	"reason" text,
	"notes" text,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_settlement_blocker_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"blocker_id" integer NOT NULL,
	"org_id" integer NOT NULL,
	"action_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"assigned_to" integer,
	"due_date" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"completed_by" integer,
	"completed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_settlement_blocker_drivers" (
	"id" serial PRIMARY KEY NOT NULL,
	"blocker_id" integer NOT NULL,
	"org_id" integer NOT NULL,
	"driver_type" text NOT NULL,
	"description" text NOT NULL,
	"weight" numeric(5, 2),
	"source_entity_type" text,
	"source_entity_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_settlement_blocker_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" integer NOT NULL,
	"org_id" integer NOT NULL,
	"total_open" integer DEFAULT 0,
	"total_critical" integer DEFAULT 0,
	"total_high" integer DEFAULT 0,
	"total_internal" integer DEFAULT 0,
	"total_external" integer DEFAULT 0,
	"oldest_blocker_days" integer DEFAULT 0,
	"settlement_readiness" text DEFAULT 'partial' NOT NULL,
	"export_readiness" text DEFAULT 'partial' NOT NULL,
	"signals" jsonb,
	"snapshot_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_settlement_blockers" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"blocker_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"severity" text DEFAULT 'medium' NOT NULL,
	"confidence" numeric(5, 2),
	"is_internal" boolean DEFAULT true,
	"is_external" boolean DEFAULT false,
	"owner_id" integer,
	"owner_role" text,
	"status" text DEFAULT 'open' NOT NULL,
	"next_best_action" text,
	"consequences_if_ignored" text,
	"blocks_what" text,
	"days_open" integer DEFAULT 0,
	"last_assessed_at" timestamp,
	"resolved_at" timestamp,
	"resolved_by" integer,
	"recovery_item_id" integer,
	"provenance" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_managed_review_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"review_item_id" integer NOT NULL,
	"assigned_to" integer NOT NULL,
	"assigned_by" integer,
	"role" text DEFAULT 'primary' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"accepted_at" timestamp,
	"completed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_managed_review_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"review_work_type" text NOT NULL,
	"lifecycle_state" text DEFAULT 'new' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"source_entity_type" text,
	"source_entity_id" integer,
	"source_lineage" text,
	"is_generated" boolean DEFAULT false NOT NULL,
	"confidence" real,
	"confidence_flags" jsonb,
	"privilege_sensitive" boolean DEFAULT false NOT NULL,
	"privilege_type" text,
	"export_safe" boolean DEFAULT false NOT NULL,
	"send_safe" boolean DEFAULT false NOT NULL,
	"what_this_is" text,
	"why_its_here" text,
	"what_supports_it" jsonb,
	"whats_missing" jsonb,
	"what_risk_exists" text,
	"what_action_clears_it" text,
	"who_is_waiting" jsonb,
	"what_it_unblocks" jsonb,
	"priority_score" real DEFAULT 0 NOT NULL,
	"deadline_risk_score" real DEFAULT 0 NOT NULL,
	"settlement_friction_score" real DEFAULT 0 NOT NULL,
	"insurer_pressure_score" real DEFAULT 0 NOT NULL,
	"contradiction_severity_score" real DEFAULT 0 NOT NULL,
	"low_confidence_score" real DEFAULT 0 NOT NULL,
	"export_send_dependency_score" real DEFAULT 0 NOT NULL,
	"work_unblocked_score" real DEFAULT 0 NOT NULL,
	"partner_urgency_score" real DEFAULT 0 NOT NULL,
	"client_facing_impact_score" real DEFAULT 0 NOT NULL,
	"recovery_lien_dependency_score" real DEFAULT 0 NOT NULL,
	"assigned_to" integer,
	"assigned_at" timestamp,
	"assigned_by" integer,
	"due_by" timestamp,
	"sla_hours" integer DEFAULT 24 NOT NULL,
	"sla_breached_at" timestamp,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"approved_by" integer,
	"approved_at" timestamp,
	"rejected_by" integer,
	"rejected_at" timestamp,
	"proof_chain_id" integer,
	"audit_packet_ref" text,
	"blocked_reason" text,
	"escalated_to" text,
	"escalated_at" timestamp,
	"export_packet_ref" text,
	"exported_at" timestamp,
	"metadata" jsonb,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_managed_review_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"review_work_type" text,
	"assigned_to" integer,
	"total_items" integer DEFAULT 0 NOT NULL,
	"approved_items" integer DEFAULT 0 NOT NULL,
	"rejected_items" integer DEFAULT 0 NOT NULL,
	"revised_items" integer DEFAULT 0 NOT NULL,
	"blocked_items" integer DEFAULT 0 NOT NULL,
	"exported_items" integer DEFAULT 0 NOT NULL,
	"closed_items" integer DEFAULT 0 NOT NULL,
	"avg_review_age_hours" real,
	"throughput_per_day" real,
	"backlog_size" integer DEFAULT 0 NOT NULL,
	"sla_breach_count" integer DEFAULT 0 NOT NULL,
	"contradiction_resolution_hours" real,
	"low_confidence_resolution_hours" real,
	"export_ready_turnaround_hours" real,
	"approval_wait_time_hours" real,
	"review_to_movement_correlation" real,
	"computed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_managed_review_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"review_item_id" integer NOT NULL,
	"note_type" text DEFAULT 'general' NOT NULL,
	"content" text NOT NULL,
	"author_id" integer,
	"author_role" text,
	"is_privileged" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_managed_review_slas" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"review_work_type" text NOT NULL,
	"lifecycle_state" text NOT NULL,
	"sla_hours" integer NOT NULL,
	"warning_hours" integer NOT NULL,
	"escalation_hours" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_review_audit_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer,
	"review_item_id" integer,
	"actor_id" integer,
	"action" text NOT NULL,
	"from_state" text,
	"to_state" text,
	"details" jsonb,
	"proof_chain_preserved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_copilot_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"mode" text,
	"sources_used" jsonb,
	"proof_chain_id" integer,
	"model_lane" text,
	"model_provider" text,
	"latency_ms" integer,
	"action_suggested" boolean DEFAULT false,
	"approval_required" boolean DEFAULT false,
	"approval_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_copilot_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"matter_id" integer,
	"mode" text NOT NULL,
	"title" text,
	"message_count" integer DEFAULT 0,
	"last_message_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_cost_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer,
	"workflow" text NOT NULL,
	"cost_category" text NOT NULL,
	"amount" numeric(12, 6) NOT NULL,
	"units" integer DEFAULT 1,
	"provider" text,
	"model" text,
	"metadata" jsonb,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_data_product_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer,
	"product" text NOT NULL,
	"score" real NOT NULL,
	"prior_score" real,
	"movement" text DEFAULT 'new' NOT NULL,
	"components" jsonb,
	"top_drivers" jsonb,
	"confidence" real,
	"computed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_forecast_diffs" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"forecast_type" text NOT NULL,
	"current_score" real NOT NULL,
	"prior_score" real,
	"trend" text NOT NULL,
	"confidence" real,
	"top_drivers" jsonb,
	"source_classes_used" jsonb,
	"what_changed" text,
	"internal_drivers" jsonb,
	"worldline_drivers" jsonb,
	"highest_leverage_action" text,
	"approval_required" boolean DEFAULT false,
	"model_version" text,
	"last_refresh_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_hf_endpoints" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"name" text NOT NULL,
	"task" text NOT NULL,
	"endpoint_url" text NOT NULL,
	"model_id" text,
	"status" text DEFAULT 'healthy' NOT NULL,
	"auth_token" text,
	"timeout_ms" integer DEFAULT 15000,
	"max_retries" integer DEFAULT 3,
	"circuit_state" text DEFAULT 'closed' NOT NULL,
	"circuit_failures" integer DEFAULT 0,
	"circuit_opened_at" timestamp,
	"cost_per_call" numeric(10, 6),
	"total_calls" integer DEFAULT 0,
	"total_errors" integer DEFAULT 0,
	"avg_latency_ms" real DEFAULT 0,
	"last_health_check" timestamp,
	"config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_m365_delta_cursors" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"connector_account_id" integer,
	"resource_type" text NOT NULL,
	"resource_path" text NOT NULL,
	"delta_link" text,
	"last_sync_at" timestamp,
	"sync_status" text DEFAULT 'synced' NOT NULL,
	"items_synced" integer DEFAULT 0,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_m365_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"connector_account_id" integer,
	"resource_type" text NOT NULL,
	"resource_path" text NOT NULL,
	"subscription_id" text,
	"change_type" text DEFAULT 'created,updated,deleted' NOT NULL,
	"expiration_date_time" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"last_notification_at" timestamp,
	"renewal_count" integer DEFAULT 0,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_matter_twin_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"snapshot_type" text NOT NULL,
	"domains" jsonb,
	"pressure_scores" jsonb,
	"forecast_snapshot" jsonb,
	"worldline_overlays" jsonb,
	"communications_summary" jsonb,
	"documents_summary" jsonb,
	"approvals_summary" jsonb,
	"health_score" integer,
	"changes_since_prior" jsonb,
	"missing_artifacts" jsonb,
	"risk_factors" jsonb,
	"next_actions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_model_lanes" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"lane" text NOT NULL,
	"provider" text NOT NULL,
	"model_name" text NOT NULL,
	"model_version" text,
	"endpoint" text,
	"status" text DEFAULT 'active' NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL,
	"config" jsonb,
	"max_rps" integer DEFAULT 100,
	"timeout_ms" integer DEFAULT 30000,
	"cost_per_request" numeric(10, 6),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_model_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"lane_id" integer,
	"lane" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"task_type" text NOT NULL,
	"matter_id" integer,
	"input_tokens" integer,
	"output_tokens" integer,
	"latency_ms" integer,
	"cost" numeric(10, 6),
	"status" text NOT NULL,
	"error" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_pressure_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer NOT NULL,
	"dimension" text NOT NULL,
	"score" real NOT NULL,
	"prior_score" real,
	"movement" text DEFAULT 'new' NOT NULL,
	"confidence" real,
	"top_drivers" jsonb,
	"source_mix" jsonb,
	"affected_milestones" jsonb,
	"likely_consequence" text,
	"recommended_actions" jsonb,
	"computed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_proof_chain_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer,
	"output_type" text NOT NULL,
	"output_content" text,
	"output_hash" text,
	"source_references" jsonb,
	"source_class" text,
	"extraction_confidence" real,
	"model_lane" text,
	"model_provider" text,
	"model_version" text,
	"generation_timestamp" timestamp DEFAULT now() NOT NULL,
	"actor_type" text DEFAULT 'system' NOT NULL,
	"actor_id" integer,
	"review_state" text DEFAULT 'unreviewed' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"approval_state" text DEFAULT 'not_required' NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp,
	"privilege_state" text DEFAULT 'none' NOT NULL,
	"export_safe" boolean DEFAULT false,
	"audit_link" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_worldline_features" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"signal_id" integer,
	"matter_id" integer,
	"feature_name" text NOT NULL,
	"feature_value" real,
	"feature_text" text,
	"source_class" text NOT NULL,
	"confidence" real,
	"published_to_pressure_graph" boolean DEFAULT false,
	"triggered_forecast_recompute" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_worldline_signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"source_id" integer,
	"source_class" text NOT NULL,
	"event_type" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"raw_data" jsonb,
	"normalized_data" jsonb,
	"jurisdiction" text,
	"county" text,
	"geo_lat" real,
	"geo_lon" real,
	"freshness_score" real,
	"provenance_score" real,
	"legal_usefulness_score" real,
	"matched_matter_ids" jsonb,
	"features_published" boolean DEFAULT false,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pc_worldline_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"source_class" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"endpoint" text,
	"fetch_method" text NOT NULL,
	"schedule" text,
	"status" text DEFAULT 'active' NOT NULL,
	"last_fetch_at" timestamp,
	"last_fetch_status" text,
	"total_signals" integer DEFAULT 0,
	"config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proof_chain" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"content_id" text NOT NULL,
	"content_type" text NOT NULL,
	"source_class" text NOT NULL,
	"confidence_score" real DEFAULT 0.5 NOT NULL,
	"model_lane" text,
	"model_id" text,
	"model_provider" text,
	"model_version" text,
	"prompt_hash" text,
	"parent_proof_id" integer,
	"review_state" text DEFAULT 'unreviewed' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"review_note" text,
	"export_safety_state" text DEFAULT 'pending_review' NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"generated_by_user_id" integer,
	"correlation_id" text,
	"service_attribution" text,
	"input_sources" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pulse_briefing_publications" (
	"id" serial PRIMARY KEY NOT NULL,
	"publication_id" text NOT NULL,
	"briefing_id" text NOT NULL,
	"org_id" integer NOT NULL,
	"publisher_user_id" integer NOT NULL,
	"audience_type" text DEFAULT 'all' NOT NULL,
	"audience_roles" jsonb DEFAULT '[]'::jsonb,
	"channels" jsonb DEFAULT '["in_app","push"]'::jsonb NOT NULL,
	"headline_override" text,
	"message_override" text,
	"status" text DEFAULT 'publishing' NOT NULL,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"in_app_delivered" integer DEFAULT 0 NOT NULL,
	"push_sent" integer DEFAULT 0 NOT NULL,
	"push_failed" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pulse_briefing_publications_publication_id_unique" UNIQUE("publication_id")
);
--> statement-breakpoint
CREATE TABLE "pulse_briefings" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"edition" text NOT NULL,
	"classification" text NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"overall_risk" text NOT NULL,
	"overall_confidence" numeric NOT NULL,
	"headline" text NOT NULL,
	"lead_sentence" text NOT NULL,
	"domains" jsonb NOT NULL,
	"sections" jsonb NOT NULL,
	"recommended_actions" jsonb NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pulse_custom_briefs" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"topic" text NOT NULL,
	"entity" text,
	"scenario" text,
	"domains" jsonb,
	"agents" jsonb,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"briefing_id" text,
	CONSTRAINT "pulse_custom_briefs_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "pulse_dissents" (
	"id" serial PRIMARY KEY NOT NULL,
	"dissent_id" text NOT NULL,
	"briefing_id" text NOT NULL,
	"section_id" text NOT NULL,
	"section_title" text NOT NULL,
	"dissenting_view" text NOT NULL,
	"basis" text NOT NULL,
	"impact_if_correct" text DEFAULT '' NOT NULL,
	"filed_by" text NOT NULL,
	"filed_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution" text,
	"resolved_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pulse_dissents_dissent_id_unique" UNIQUE("dissent_id")
);
--> statement-breakpoint
CREATE TABLE "pulse_email_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"email" text NOT NULL,
	"domains" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"unsubscribe_token" text NOT NULL,
	"last_sent_briefing_id" text,
	"last_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pulse_email_subscriptions_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
CREATE TABLE "pulse_exec_briefs" (
	"id" text PRIMARY KEY NOT NULL,
	"briefing_id" text,
	"domain" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"headline" text NOT NULL,
	"situation" text NOT NULL,
	"autonomy_tier" text NOT NULL,
	"confidence" numeric NOT NULL,
	"overall_risk" text NOT NULL,
	"verifier_status" text DEFAULT 'pending' NOT NULL,
	"verifier_feedback" text,
	"what_we_believe" jsonb NOT NULL,
	"why_citations" jsonb NOT NULL,
	"what_we_recommend" jsonb NOT NULL,
	"source_trace_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"entity_provenance" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"scheduled" boolean DEFAULT false NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pulse_follow_ups" (
	"id" serial PRIMARY KEY NOT NULL,
	"follow_up_id" text NOT NULL,
	"briefing_id" text NOT NULL,
	"section_id" text,
	"user_id" integer NOT NULL,
	"question" text NOT NULL,
	"answer" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"provenance" jsonb,
	"asked_at" timestamp DEFAULT now() NOT NULL,
	"answered_at" timestamp,
	CONSTRAINT "pulse_follow_ups_follow_up_id_unique" UNIQUE("follow_up_id")
);
--> statement-breakpoint
CREATE TABLE "pulse_org_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"user_id" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pulse_org_channel_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"slack_webhook_url" text,
	"slack_channel" text,
	"teams_webhook_url" text,
	"sms_sender_id" text,
	"outbound_webhook_url" text,
	"outbound_webhook_secret" text,
	"email_from_name" text,
	"email_from_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pulse_org_channel_configs_org_id_unique" UNIQUE("org_id")
);
--> statement-breakpoint
CREATE TABLE "pulse_org_publication_deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"publication_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"channel" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"provider_message_id" text,
	"suppress_reason" text,
	"delivered_at" timestamp,
	"next_retry_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pulse_org_publications" (
	"id" serial PRIMARY KEY NOT NULL,
	"publication_id" text NOT NULL,
	"briefing_id" text NOT NULL,
	"domain" text DEFAULT 'consolidated' NOT NULL,
	"channels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"schedule_id" integer,
	"status" text DEFAULT 'queued' NOT NULL,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"delivered_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"suppressed_count" integer DEFAULT 0 NOT NULL,
	"published_by" integer,
	"audience_filter" jsonb,
	"metadata" jsonb,
	"enqueued_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pulse_org_publications_publication_id_unique" UNIQUE("publication_id")
);
--> statement-breakpoint
CREATE TABLE "pulse_org_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"schedule_id" text NOT NULL,
	"org_id" integer,
	"domain" text DEFAULT 'consolidated' NOT NULL,
	"channels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"pinned_briefing_id" text,
	"frequency" text NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"weekdays" jsonb DEFAULT '[]'::jsonb,
	"time_of_day" text DEFAULT '09:00' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"paused" boolean DEFAULT false NOT NULL,
	"next_run_at" timestamp,
	"last_run_at" timestamp,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pulse_org_schedules_schedule_id_unique" UNIQUE("schedule_id")
);
--> statement-breakpoint
CREATE TABLE "pulse_org_user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"email_opt_out" boolean DEFAULT false NOT NULL,
	"sms_opt_out" boolean DEFAULT false NOT NULL,
	"slack_dm_opt_out" boolean DEFAULT false NOT NULL,
	"push_opt_out" boolean DEFAULT false NOT NULL,
	"unsubscribe_token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pulse_org_user_preferences_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
CREATE TABLE "pulse_personalized_narratives" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date_key" text NOT NULL,
	"source_briefing_id" text,
	"narrative" text,
	"watched_domains" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"watched_entity_uris" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"filtered_section_count" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pulse_push_schedule" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"delivery_hour_utc" integer DEFAULT 7 NOT NULL,
	"last_delivered_at" timestamp,
	"last_briefing_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pulse_push_schedule_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "pulse_saved_briefings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"briefing_id" text NOT NULL,
	"saved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pulse_watchlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"entity_uri" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_label" text NOT NULL,
	"domain" text NOT NULL,
	"metadata" jsonb,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_notification_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"app_id" text NOT NULL,
	"template_id" text,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"target" text NOT NULL,
	"tokens_sent" integer DEFAULT 0 NOT NULL,
	"tokens_failed" integer DEFAULT 0 NOT NULL,
	"tokens_delivered" integer DEFAULT 0 NOT NULL,
	"delivery_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"app_id" text NOT NULL,
	"category" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" text NOT NULL,
	"history_id" integer,
	"user_id" integer,
	"token" text NOT NULL,
	"app_id" text NOT NULL,
	"template_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_code" text,
	"error_message" text,
	"checked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_receipts_ticket_id_unique" UNIQUE("ticket_id")
);
--> statement-breakpoint
CREATE TABLE "scheduled_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"app_id" text,
	"target" text NOT NULL,
	"template" text,
	"vars" jsonb,
	"title" text,
	"body" text,
	"data" jsonb,
	"send_at" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"processed_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"token" text NOT NULL,
	"platform" text DEFAULT 'ios' NOT NULL,
	"app_id" text DEFAULT 'carlota-jo-mobile' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "rag_knowledge_chunks" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text,
	"content" text NOT NULL,
	"source" text NOT NULL,
	"source_type" text NOT NULL,
	"domain" text DEFAULT 'general' NOT NULL,
	"sensitivity_level" text DEFAULT 'internal' NOT NULL,
	"object_id" text,
	"chunk_index" integer DEFAULT 0 NOT NULL,
	"chunk_hash" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"embedding" vector(1024),
	"embedding_model" text,
	"embedding_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rag_knowledge_documents" (
	"doc_id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"domain" text DEFAULT 'general' NOT NULL,
	"source_type" text DEFAULT 'document' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"importance" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readiness_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"dimension_id" integer,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readiness_dimensions" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"weight" numeric(5, 2) DEFAULT '1',
	"current_score" numeric(5, 2),
	"target_score" numeric(5, 2) DEFAULT '85',
	"max_score" numeric(5, 2) DEFAULT '100',
	"assessor_name" text,
	"last_assessed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readiness_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"due_date" timestamp,
	"completed_at" timestamp,
	"owner" text,
	"dependencies" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readiness_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"overall_score" numeric(5, 2),
	"target_score" numeric(5, 2) DEFAULT '85',
	"status" text DEFAULT 'active' NOT NULL,
	"owner" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readiness_risks" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"dimension_id" integer,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"severity" text NOT NULL,
	"likelihood" text DEFAULT 'possible' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"mitigation" text,
	"owner" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readiness_score_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"dimension_id" integer NOT NULL,
	"program_id" integer NOT NULL,
	"score" numeric(5, 2) NOT NULL,
	"notes" text,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"domain" text DEFAULT 'general' NOT NULL,
	"score" numeric(5, 2) NOT NULL,
	"confidence" numeric(5, 4) NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"reasoning" text NOT NULL,
	"recommended_action" text NOT NULL,
	"timeframe" text,
	"context" jsonb,
	"model" text,
	"provider" text,
	"latency_ms" integer,
	"telemetry_id" text,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eval_baselines" (
	"id" serial PRIMARY KEY NOT NULL,
	"suite_id" text NOT NULL,
	"model" text DEFAULT 'default' NOT NULL,
	"pass_rate" real DEFAULT 0 NOT NULL,
	"avg_score" real DEFAULT 0 NOT NULL,
	"avg_latency_ms" real DEFAULT 0 NOT NULL,
	"total_cost_usd" real DEFAULT 0 NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "replay_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"scenario_id" text NOT NULL,
	"scenario_name" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	"total_snapshots" integer DEFAULT 0 NOT NULL,
	"successful" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"avg_latency_ms" real DEFAULT 0 NOT NULL,
	"ground_truth_match_rate" real DEFAULT 0 NOT NULL,
	"total_cost_usd" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "replay_runs_run_id_unique" UNIQUE("run_id")
);
--> statement-breakpoint
CREATE TABLE "replay_scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" text NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"snapshot_count" integer DEFAULT 0 NOT NULL,
	"last_replayed" timestamp with time zone,
	"last_outcome" text,
	"ground_truth_match_rate" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "replay_scenarios_scenario_id_unique" UNIQUE("scenario_id")
);
--> statement-breakpoint
CREATE TABLE "replay_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_id" text NOT NULL,
	"scenario_id" text NOT NULL,
	"label" text NOT NULL,
	"domain" text NOT NULL,
	"snapshot_type" text NOT NULL,
	"historical_context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"agent_inputs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ground_truth" jsonb,
	"sanitized" boolean DEFAULT true NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "replay_snapshots_snapshot_id_unique" UNIQUE("snapshot_id")
);
--> statement-breakpoint
CREATE TABLE "report_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"approval_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"requested_by_user_id" integer,
	"reviewer_user_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"annotations" jsonb DEFAULT '[]'::jsonb,
	"comment" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "report_approvals_approval_id_unique" UNIQUE("approval_id")
);
--> statement-breakpoint
CREATE TABLE "report_distributions" (
	"id" serial PRIMARY KEY NOT NULL,
	"distribution_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"recipient_email" text NOT NULL,
	"recipient_name" text,
	"channel" text DEFAULT 'email' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp,
	"opened_at" timestamp,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"distributed_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "report_distributions_distribution_id_unique" UNIQUE("distribution_id")
);
--> statement-breakpoint
CREATE TABLE "report_generations" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid,
	"template_version" integer DEFAULT 1,
	"title" text NOT NULL,
	"domain" text DEFAULT 'general' NOT NULL,
	"report_type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"brand_theme" text DEFAULT 'szl' NOT NULL,
	"data_snapshot" jsonb,
	"snapshot_at" timestamp,
	"rendered_blocks" jsonb,
	"narrative_sections" jsonb,
	"pdf_buffer" text,
	"pdf_size_bytes" integer,
	"formats" jsonb DEFAULT '[]'::jsonb,
	"generation_duration_ms" integer,
	"scheduled_run_id" text,
	"parent_report_id" uuid,
	"version_number" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"generated_by_user_id" integer,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "report_generations_report_id_unique" UNIQUE("report_id")
);
--> statement-breakpoint
CREATE TABLE "report_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"schedule_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"template_id" uuid NOT NULL,
	"domain" text DEFAULT 'general' NOT NULL,
	"frequency" text DEFAULT 'weekly' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"data_config" jsonb DEFAULT '{}'::jsonb,
	"recipient_emails" jsonb DEFAULT '[]'::jsonb,
	"auto_approve" boolean DEFAULT false NOT NULL,
	"last_run_at" timestamp,
	"next_run_at" timestamp,
	"last_status" text,
	"run_count" integer DEFAULT 0 NOT NULL,
	"fail_count" integer DEFAULT 0 NOT NULL,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "report_schedules_schedule_id_unique" UNIQUE("schedule_id")
);
--> statement-breakpoint
CREATE TABLE "report_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"domain" text DEFAULT 'general' NOT NULL,
	"report_type" text NOT NULL,
	"blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"brand_theme" text DEFAULT 'szl' NOT NULL,
	"is_schedulable" boolean DEFAULT false NOT NULL,
	"conditional_rules" jsonb DEFAULT '[]'::jsonb,
	"data_requirements" jsonb DEFAULT '[]'::jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "report_templates_template_id_unique" UNIQUE("template_id")
);
--> statement-breakpoint
CREATE TABLE "revenue_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"product" text DEFAULT 'lyte' NOT NULL,
	"customer_id" text,
	"subscription_id" text,
	"invoice_id" text,
	"amount" numeric(12, 2),
	"currency" text DEFAULT 'usd' NOT NULL,
	"idempotency_key" text,
	"metadata" jsonb,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "revenue_events_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "scim_group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scim_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"external_id" text,
	"display_name" text NOT NULL,
	"platform_role" text DEFAULT 'viewer' NOT NULL,
	"meta" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scim_provisioned_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"external_id" text,
	"scim_user_name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"provisioned_role" text DEFAULT 'viewer' NOT NULL,
	"last_sync_at" timestamp,
	"sync_errors" jsonb DEFAULT '[]',
	"meta" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scim_sync_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"operation" text NOT NULL,
	"resource_type" text NOT NULL,
	"external_id" text,
	"user_id" integer,
	"status" text NOT NULL,
	"error_message" text,
	"request_body" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scim_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"token_hash" text NOT NULL,
	"token_prefix" text NOT NULL,
	"label" text DEFAULT 'default' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scim_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "self_healing_patterns" (
	"id" serial PRIMARY KEY NOT NULL,
	"pattern_key" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"trigger" text NOT NULL,
	"runbook" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "self_healing_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_key" text NOT NULL,
	"pattern_key" text NOT NULL,
	"trigger_signal" text NOT NULL,
	"service" text NOT NULL,
	"detected_at" timestamp NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"status" text NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"mttr_saved_mins" integer DEFAULT 0 NOT NULL,
	"approver" text,
	"audit_ref" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_performance_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"period" text NOT NULL,
	"total_decisions" integer DEFAULT 0 NOT NULL,
	"accepted_decisions" integer DEFAULT 0 NOT NULL,
	"rejected_decisions" integer DEFAULT 0 NOT NULL,
	"overridden_decisions" integer DEFAULT 0 NOT NULL,
	"avg_confidence" real DEFAULT 0.5 NOT NULL,
	"calibration_bias" real DEFAULT 0 NOT NULL,
	"accuracy_score" real DEFAULT 0.5 NOT NULL,
	"confidence_trend" text DEFAULT 'stable' NOT NULL,
	"flagged_for_review" boolean DEFAULT false NOT NULL,
	"review_reason" text,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_self_reflections" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"reflection_period" text NOT NULL,
	"key_observations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"adjustment_recommendations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"confidence_adjustment" real DEFAULT 0 NOT NULL,
	"should_request_human_review" boolean DEFAULT false NOT NULL,
	"human_review_reason" text,
	"performance_score" real DEFAULT 0.5 NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sentra_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"severity" text NOT NULL,
	"source" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"description" text NOT NULL,
	"asset" text,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"linked_incident_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sentra_incidents" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"severity" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"mitre_stage" text DEFAULT 'Initial Access' NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"assigned_to" text,
	"affected_assets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"timeline" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"namespace" text NOT NULL,
	"key" text NOT NULL,
	"value" jsonb,
	"value_type" text DEFAULT 'string' NOT NULL,
	"label" text,
	"description" text,
	"category" text DEFAULT 'general' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"tier" text NOT NULL,
	"setting_id" integer NOT NULL,
	"namespace" text NOT NULL,
	"key" text NOT NULL,
	"org_id" integer,
	"user_id" integer,
	"actor_id" integer,
	"action" text NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_health_scorecards" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"computed_at" timestamp DEFAULT now() NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"active_users" integer DEFAULT 0 NOT NULL,
	"total_users" integer DEFAULT 0 NOT NULL,
	"session_count" integer DEFAULT 0 NOT NULL,
	"feature_adoption_pct" real DEFAULT 0 NOT NULL,
	"support_ticket_volume" integer DEFAULT 0 NOT NULL,
	"sla_adherence_pct" real DEFAULT 100 NOT NULL,
	"billing_status" text DEFAULT 'unknown' NOT NULL,
	"api_call_count" integer DEFAULT 0 NOT NULL,
	"error_rate_pct" real DEFAULT 0 NOT NULL,
	"avg_response_time_ms" real,
	"health_score" real DEFAULT 0 NOT NULL,
	"health_tier" text DEFAULT 'healthy' NOT NULL,
	"health_score_delta" real,
	"active_users_delta" integer,
	"signal_breakdown" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"namespace" text NOT NULL,
	"key" text NOT NULL,
	"value" jsonb,
	"value_type" text DEFAULT 'string' NOT NULL,
	"label" text,
	"category" text DEFAULT 'general' NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"org_id" integer,
	"namespace" text NOT NULL,
	"key" text NOT NULL,
	"value" jsonb,
	"value_type" text DEFAULT 'string' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signal_chain_executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"chain_id" text NOT NULL,
	"trigger_domain" text NOT NULL,
	"payload_snapshot" jsonb,
	"outcomes" jsonb,
	"triggered_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mesh_entity_snapshots" (
	"entity_id" text PRIMARY KEY NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"domain" text NOT NULL,
	"display_name" text NOT NULL,
	"health" text DEFAULT 'unknown' NOT NULL,
	"tenant_id" text,
	"snapshot_at" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mesh_evidence_entity_links" (
	"evidence_id" uuid NOT NULL,
	"entity_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"domain" text NOT NULL,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mesh_evidence_entity_links_evidence_id_entity_id_pk" PRIMARY KEY("evidence_id","entity_id")
);
--> statement-breakpoint
CREATE TABLE "mesh_evidence_items" (
	"evidence_id" uuid PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"domain" text NOT NULL,
	"signal_id" uuid,
	"summary" text NOT NULL,
	"confidence" real NOT NULL,
	"freshness" real NOT NULL,
	"weight" real DEFAULT 1 NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mesh_recommendation_decisions" (
	"decision_id" uuid PRIMARY KEY NOT NULL,
	"recommendation_id" uuid NOT NULL,
	"actor_id" text NOT NULL,
	"actor_role" text,
	"org_id" text,
	"decision" text NOT NULL,
	"justification" text,
	"policy_outcome" text NOT NULL,
	"previous_status" text NOT NULL,
	"new_status" text NOT NULL,
	"source_surface" text,
	"decided_at" timestamp with time zone NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mesh_recommendations" (
	"recommendation_id" uuid PRIMARY KEY NOT NULL,
	"domain" text NOT NULL,
	"title" text NOT NULL,
	"suggested_action" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"confidence" real NOT NULL,
	"freshness" real NOT NULL,
	"tenant_id" text,
	"generated_by" text,
	"generated_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mesh_signals" (
	"signal_id" uuid PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"type" text NOT NULL,
	"domain" text NOT NULL,
	"severity" text,
	"stage" text NOT NULL,
	"tenant_id" text,
	"session_id" text,
	"freshness" real NOT NULL,
	"confidence" real NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"processed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signal_bus_dead_letters" (
	"dead_letter_id" uuid PRIMARY KEY NOT NULL,
	"rule_id" uuid,
	"source_signal_id" text NOT NULL,
	"source_domain" text NOT NULL,
	"source_type" text NOT NULL,
	"error_message" text NOT NULL,
	"payload" jsonb NOT NULL,
	"retry_count" text DEFAULT '0' NOT NULL,
	"org_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signal_bus_routed_events" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"rule_id" uuid NOT NULL,
	"rule_name" text NOT NULL,
	"source_signal_id" text NOT NULL,
	"source_domain" text NOT NULL,
	"source_type" text NOT NULL,
	"action_type" text NOT NULL,
	"action_result" jsonb NOT NULL,
	"status" text DEFAULT 'success' NOT NULL,
	"error_message" text,
	"org_id" text,
	"routed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signal_bus_rules" (
	"rule_id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"enabled" text DEFAULT 'true' NOT NULL,
	"source_domain" text NOT NULL,
	"source_type" text NOT NULL,
	"min_severity" text DEFAULT 'info' NOT NULL,
	"conditions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"action_type" text NOT NULL,
	"action_config" jsonb NOT NULL,
	"target_domain" text,
	"org_id" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_fired_at" timestamp with time zone,
	"fire_count" text DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_replay_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"domain" text NOT NULL,
	"replay_cursor" integer DEFAULT 0 NOT NULL,
	"total_frames" integer DEFAULT 0 NOT NULL,
	"playback_speed" real DEFAULT 1 NOT NULL,
	"is_paused" boolean DEFAULT false NOT NULL,
	"loop_enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"domain" text NOT NULL,
	"result_type" text DEFAULT 'final' NOT NULL,
	"metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"summary" text,
	"risk_score" numeric(5, 2),
	"confidence" real,
	"computed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"domain" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"parameters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "simulation_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "simulation_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"domain" text NOT NULL,
	"sequence_number" integer DEFAULT 0 NOT NULL,
	"state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"snapshotted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stephen_booking_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text,
	"role" text,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"preferred_date" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stephen_case_studies" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"cover_image_url" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"client" text,
	"duration" text,
	"outcome" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stephen_case_studies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "stephen_content_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"icon" text,
	"date" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stephen_site_case_studies" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"client" text NOT NULL,
	"industry" text,
	"summary" text NOT NULL,
	"content" text,
	"cover_image_url" text,
	"technologies" text[],
	"results" jsonb,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stephen_site_case_studies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "stephen_site_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text,
	"message" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stephen_site_testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_name" text NOT NULL,
	"client_title" text,
	"client_company" text,
	"client_avatar_url" text,
	"content" text NOT NULL,
	"rating" integer DEFAULT 5 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stream_data_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"endpoint" text,
	"auth_config" jsonb,
	"polling_interval_ms" integer DEFAULT 30000,
	"enabled" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'idle' NOT NULL,
	"last_health_at" timestamp,
	"last_error_at" timestamp,
	"last_error" text,
	"events_ingested" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stream_ingested_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"source_id" integer,
	"category" text NOT NULL,
	"type" text NOT NULL,
	"source" text NOT NULL,
	"severity" text,
	"payload" jsonb NOT NULL,
	"normalized_at" timestamp DEFAULT now() NOT NULL,
	"event_ts" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_canned_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"body" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_knowledge_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"summary" text NOT NULL,
	"body" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"deflection_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "support_knowledge_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "support_ticket_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"author_id" integer,
	"author_name" text NOT NULL,
	"author_role" text DEFAULT 'customer' NOT NULL,
	"body" text NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"canned_response_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_ref" text NOT NULL,
	"org_id" integer,
	"user_id" integer,
	"submitter_name" text NOT NULL,
	"submitter_email" text NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"assigned_to_id" integer,
	"assigned_to_name" text,
	"resolved_at" timestamp,
	"closed_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"sla_response_deadline" timestamp,
	"sla_resolution_deadline" timestamp,
	"first_response_at" timestamp,
	"sla_response_breached" boolean DEFAULT false NOT NULL,
	"sla_resolution_breached" boolean DEFAULT false NOT NULL,
	"escalated_at" timestamp,
	"escalation_count" integer DEFAULT 0 NOT NULL,
	"merged_into_id" integer,
	"merged_at" timestamp,
	"csat_rating" integer,
	"csat_comment" text,
	"csat_request_sent_at" timestamp,
	"csat_responded_at" timestamp,
	CONSTRAINT "support_tickets_ticket_ref_unique" UNIQUE("ticket_ref")
);
--> statement-breakpoint
CREATE TABLE "szl_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"signal_id" integer,
	"title" text NOT NULL,
	"description" text,
	"action_state" text DEFAULT 'open' NOT NULL,
	"escalation_state" text DEFAULT 'none' NOT NULL,
	"estimated_value_protected_cents" integer,
	"owner_id" integer,
	"due_at" timestamp,
	"completed_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "szl_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"workflow_run_id" integer,
	"requested_by" integer,
	"approved_by" integer,
	"state" text DEFAULT 'pending' NOT NULL,
	"request_note" text,
	"decision_note" text,
	"expires_at" timestamp,
	"decided_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "szl_artifacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"workflow_run_id" integer,
	"artifact_type" text NOT NULL,
	"title" text NOT NULL,
	"content_json" jsonb,
	"approved" boolean DEFAULT false NOT NULL,
	"created_by_system" boolean DEFAULT false NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "szl_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"entity_type" text NOT NULL,
	"entity_id" integer NOT NULL,
	"author_id" integer,
	"author_name" text,
	"is_system_comment" boolean DEFAULT false NOT NULL,
	"body" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "szl_event_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"actor_id" integer,
	"actor_type" text DEFAULT 'system' NOT NULL,
	"event_type" text NOT NULL,
	"entity_type" text,
	"entity_id" integer,
	"summary" text,
	"payload" jsonb,
	"correlation_id" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "szl_exceptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"entity_type" text NOT NULL,
	"entity_id" integer,
	"severity" text DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"why_it_matters" text,
	"estimated_impact_cents" integer,
	"status" text DEFAULT 'open' NOT NULL,
	"resolved_at" timestamp,
	"metadata" jsonb,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "szl_feature_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"rollout_percentage" integer DEFAULT 0 NOT NULL,
	"product" text,
	"conditions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "szl_feature_flags_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "szl_ports" (
	"id" serial PRIMARY KEY NOT NULL,
	"unlocode" text,
	"name" text NOT NULL,
	"country" text,
	"region" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"port_type" text DEFAULT 'commercial' NOT NULL,
	"risk_level" text DEFAULT 'low' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "szl_ports_unlocode_unique" UNIQUE("unlocode")
);
--> statement-breakpoint
CREATE TABLE "szl_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"product_type" text DEFAULT 'platform' NOT NULL,
	"parent_slug" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "szl_products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "szl_readiness_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"product_slug" text,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"owner_id" integer,
	"dependency_json" jsonb,
	"blocker_summary" text,
	"readiness_score" numeric(5, 2),
	"due_date" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "szl_routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"name" text NOT NULL,
	"origin_port_id" integer,
	"destination_port_id" integer,
	"distance_nm" numeric(10, 2),
	"avg_transit_days" numeric(6, 2),
	"risk_level" text DEFAULT 'low' NOT NULL,
	"waypoints" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "szl_signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"product_slug" text,
	"source" text NOT NULL,
	"source_type" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"why_it_matters" text,
	"value_at_risk_cents" integer,
	"confidence" text DEFAULT 'medium' NOT NULL,
	"owner_state" text DEFAULT 'unassigned' NOT NULL,
	"owner_id" integer,
	"status" text DEFAULT 'new' NOT NULL,
	"correlation_id" text,
	"metadata" jsonb,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "szl_vessels" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"imo" text,
	"mmsi" text,
	"name" text NOT NULL,
	"vessel_class" text,
	"vessel_type" text NOT NULL,
	"flag" text,
	"year_built" integer,
	"gross_tonnage_mt" numeric(12, 2),
	"utilization_pct" numeric(5, 2),
	"fuel_efficiency_score" numeric(5, 2),
	"maintenance_status" text DEFAULT 'ok' NOT NULL,
	"readiness_score" numeric(5, 2),
	"operational_status" text DEFAULT 'active' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "szl_vessels_imo_unique" UNIQUE("imo")
);
--> statement-breakpoint
CREATE TABLE "szl_voyages" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"vessel_id" integer,
	"route_id" integer,
	"voyage_number" text,
	"status" text DEFAULT 'planned' NOT NULL,
	"departed_at" timestamp,
	"estimated_arrival_at" timestamp,
	"actual_arrival_at" timestamp,
	"revenue_estimate_cents" integer,
	"cost_estimate_cents" integer,
	"margin_estimate_cents" integer,
	"delay_estimate_hours" numeric(6, 2),
	"cargo_description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "szl_workflow_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"org_id" integer,
	"state" text DEFAULT 'queued' NOT NULL,
	"approval_state" text DEFAULT 'pending',
	"input_json" jsonb,
	"output_json" jsonb,
	"error_json" jsonb,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "szl_workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"name" text NOT NULL,
	"description" text,
	"trigger_type" text DEFAULT 'manual' NOT NULL,
	"approval_required" boolean DEFAULT false NOT NULL,
	"config_json" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "szl_decisioning_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"recommendation_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"domain" text NOT NULL,
	"action" text,
	"priority_score" real DEFAULT 0 NOT NULL,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"urgency" text DEFAULT 'routine' NOT NULL,
	"business_impact" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"signals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reasoning" text,
	"policy_state" text DEFAULT 'unchecked' NOT NULL,
	"policy_evaluation" jsonb DEFAULT '{}'::jsonb,
	"required_roles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"estimated_effort_hours" real,
	"estimated_cost_usd" real,
	"suggested_owner" text,
	"is_actionable" boolean DEFAULT true NOT NULL,
	"tenant_id" text,
	"initiated_by" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"evaluated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "szl_decisioning_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"workflow_id" text NOT NULL,
	"workflow_name" text NOT NULL,
	"domain" text NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"initiated_by" text,
	"approved_by" text,
	"tenant_id" text,
	"recommendation_id" text,
	"is_dry_run" boolean DEFAULT false NOT NULL,
	"is_simulation" boolean DEFAULT false NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"duration_ms" integer,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"audit_trail" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"policy_evaluation" jsonb DEFAULT '{}'::jsonb,
	"cost" jsonb DEFAULT '{}'::jsonb,
	"outcome" text,
	"outcome_summary" text,
	"outcome_impact" jsonb DEFAULT '{}'::jsonb,
	"outcome_recorded_at" timestamp,
	"outcome_recorded_by" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "szl_decisioning_runs_run_id_unique" UNIQUE("run_id")
);
--> statement-breakpoint
CREATE TABLE "szl_policy_violations" (
	"id" serial PRIMARY KEY NOT NULL,
	"policy_id" text NOT NULL,
	"policy_name" text,
	"rule_name" text,
	"effect" text DEFAULT 'block' NOT NULL,
	"action" text NOT NULL,
	"domain" text,
	"subject_id" text,
	"subject_roles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"resource_type" text,
	"resource_id" text,
	"reason" text,
	"estimated_cost_usd" real,
	"confidence" real,
	"run_id" text,
	"recommendation_id" text,
	"tenant_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"team" text NOT NULL,
	"actor_id" integer,
	"recipient_id" integer,
	"urgency" text DEFAULT 'warning' NOT NULL,
	"message" text,
	"in_app_delivered" boolean DEFAULT true NOT NULL,
	"muted_as_duplicate" boolean DEFAULT false NOT NULL,
	"duplicate_of_page_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "terra_action_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"property_id" text NOT NULL,
	"issue" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"owner_name" text NOT NULL,
	"owner_role" text NOT NULL,
	"due_date" text,
	"status" text DEFAULT 'open' NOT NULL,
	"recommended_action" text,
	"resolved_at" timestamp,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "terra_action_items_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "terra_agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"brokerage_id" integer,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"license_number" text,
	"specialty" text DEFAULT 'office' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"active_listings" integer DEFAULT 0 NOT NULL,
	"closed_deals_ltm" integer DEFAULT 0 NOT NULL,
	"close_rate_pct" numeric(5, 2),
	"avg_days_to_contract" integer,
	"inquiry_conversion_pct" numeric(5, 2),
	"last_activity_at" timestamp,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "terra_agents_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "terra_brokerages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"license_number" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"specialty" text,
	"head_count" integer DEFAULT 1 NOT NULL,
	"active_listings" integer DEFAULT 0 NOT NULL,
	"closed_volume_ltm" numeric(16, 2),
	"status" text DEFAULT 'active' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "terra_brokerages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "terra_commercial_comps" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"source" text NOT NULL,
	"comp_type" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text,
	"property_type" text NOT NULL,
	"tenant_name" text,
	"tenant_industry" text,
	"transaction_type" text,
	"leased_sqft" integer,
	"rentable_area" integer,
	"starting_rent_per_sqft" numeric(8, 2),
	"effective_rent_per_sqft" numeric(8, 2),
	"sale_price" numeric(16, 2),
	"price_per_sqft" numeric(8, 2),
	"cap_rate" numeric(5, 2),
	"free_rent_months" integer,
	"tenant_improvement_allowance" numeric(8, 2),
	"lease_term_months" integer,
	"transaction_date" text NOT NULL,
	"lease_expiration_date" text,
	"floor_occupied" text,
	"building_class" text,
	"landlord_name" text,
	"buyer_name" text,
	"seller_name" text,
	"buyer_type" text,
	"finance_type" text,
	"submarket_name" text,
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "terra_commercial_comps_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "terra_commercial_properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"source" text NOT NULL,
	"property_name" text,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text,
	"county" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"property_type" text NOT NULL,
	"building_class" text,
	"rentable_area" integer,
	"year_built" integer,
	"stories" integer,
	"units" integer,
	"parking_spaces" integer,
	"occupancy_rate" numeric(5, 2),
	"market_vacancy_rate" numeric(5, 2),
	"asking_rent_per_sqft" numeric(8, 2),
	"effective_rent_per_sqft" numeric(8, 2),
	"cap_rate" numeric(5, 2),
	"last_sale_price" numeric(16, 2),
	"last_sale_date" text,
	"tenants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"submarket_name" text,
	"owner_name" text,
	"owner_type" text,
	"raw_data" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "terra_commercial_properties_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "terra_construction_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"name" text NOT NULL,
	"address" text,
	"type" text,
	"total_budget" numeric(16, 2),
	"total_spent" numeric(16, 2),
	"overall_pct" integer DEFAULT 0 NOT NULL,
	"start_date" text,
	"projected_completion" text,
	"revised_completion" text,
	"status" text DEFAULT 'on-track' NOT NULL,
	"gc" text,
	"architect" text,
	"milestones" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"budget_lines" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"owner_user_id" integer,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "terra_construction_projects_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "terra_covenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"external_id" text,
	"property_external_id" text NOT NULL,
	"property_address" text NOT NULL,
	"borough" text,
	"lender" text NOT NULL,
	"loan_agreement_id" text,
	"loan_agreement_url" text,
	"covenant_type" text NOT NULL,
	"label" text,
	"threshold_value" numeric(12, 4) NOT NULL,
	"comparator" text DEFAULT 'gte' NOT NULL,
	"remedy_period_days" integer DEFAULT 60 NOT NULL,
	"required_approvers" jsonb DEFAULT '["terra-risk-officer"]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_evaluated_at" timestamp,
	"last_status" text,
	"last_measured_value" numeric(12, 4),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "terra_covenants_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "terra_deals" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"address" text NOT NULL,
	"borough" text,
	"county" text,
	"zip_code" text,
	"stage" text DEFAULT 'lead' NOT NULL,
	"type" text DEFAULT 'acquisition' NOT NULL,
	"price" numeric(14, 2),
	"asking_price" numeric(14, 2),
	"arv" numeric(14, 2),
	"probability" integer DEFAULT 25 NOT NULL,
	"risk_level" text DEFAULT 'medium' NOT NULL,
	"owner_user_id" integer,
	"owner_name" text,
	"client_name" text,
	"distress_property_id" integer,
	"distress_property_external_id" text,
	"lead_id" integer,
	"stage_entered_at" timestamp DEFAULT now() NOT NULL,
	"estimated_close_date" text,
	"actual_close_date" text,
	"next_action" text,
	"notes" text,
	"timeline" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "terra_deals_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "terra_diligence_evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"matter_id" text NOT NULL,
	"category" text NOT NULL,
	"label" text NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"confidence" numeric(4, 3) DEFAULT '0.5' NOT NULL,
	"evidence_date" text,
	"document_url" text,
	"document_name" text,
	"document_size" integer,
	"document_mime_type" text,
	"document_sha256" text,
	"citations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reviewed_by_user_id" integer,
	"reviewed_by_name" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "terra_diligence_matters" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"property_id" integer,
	"property_external_id" text,
	"borough" text,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"stage" text DEFAULT 'pre_diligence' NOT NULL,
	"completion_pct" integer DEFAULT 0 NOT NULL,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"target_close_date" text,
	"owner_user_id" integer,
	"owner_name" text,
	"notes" text,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "terra_distress_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"property_id" integer,
	"property_external_id" text,
	"alert_type" text NOT NULL,
	"message" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"borough" text,
	"zip_code" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"triggered_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"metadata" jsonb,
	CONSTRAINT "terra_distress_alerts_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "terra_distress_properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"address" text NOT NULL,
	"borough" text NOT NULL,
	"county" text NOT NULL,
	"zip_code" text,
	"property_type" text DEFAULT 'unknown' NOT NULL,
	"distress_type" text NOT NULL,
	"stage" text NOT NULL,
	"estimated_value" numeric(14, 2) NOT NULL,
	"debt_amount" numeric(14, 2),
	"lien_amount" numeric(14, 2),
	"auction_date" text,
	"filing_date" text NOT NULL,
	"last_activity_date" text NOT NULL,
	"owner_name" text NOT NULL,
	"owner_type" text NOT NULL,
	"opportunity_score" integer DEFAULT 50 NOT NULL,
	"confidence_level" text DEFAULT 'medium' NOT NULL,
	"score_rationale" text DEFAULT '' NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"sqft" integer,
	"year_built" integer,
	"beds" integer,
	"baths" integer,
	"days_in_distress" integer DEFAULT 0 NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"timeline" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"price_history" jsonb,
	"connector_source" text DEFAULT '' NOT NULL,
	"notes" text,
	"linked_deal_id" text,
	"raw_data" jsonb,
	"ingest_source" text DEFAULT 'seed' NOT NULL,
	"ingest_run_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "terra_distress_properties_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "terra_exchanges_1031" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"relinquished_property" text NOT NULL,
	"relinquished_address" text,
	"sale_date" text,
	"sale_price" numeric(16, 2),
	"adjusted_basis" numeric(16, 2),
	"deferred_gain" numeric(16, 2),
	"qi" text,
	"qi_contact" text,
	"status" text DEFAULT 'identification' NOT NULL,
	"identification_deadline" text,
	"exchange_deadline" text,
	"identified_properties" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"compliance_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tax_savings" numeric(14, 2),
	"owner_user_id" integer,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "terra_exchanges_1031_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "terra_ingestion_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"records_fetched" integer DEFAULT 0 NOT NULL,
	"records_inserted" integer DEFAULT 0 NOT NULL,
	"records_skipped" integer DEFAULT 0 NOT NULL,
	"records_failed" integer DEFAULT 0 NOT NULL,
	"alerts_generated" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"metadata" jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "terra_inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer,
	"assigned_agent_id" integer,
	"buyer_name" text NOT NULL,
	"buyer_email" text,
	"buyer_phone" text,
	"buyer_type" text DEFAULT 'unknown' NOT NULL,
	"financing_status" text DEFAULT 'unknown' NOT NULL,
	"qualification_score" integer DEFAULT 50 NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"source" text DEFAULT 'other' NOT NULL,
	"message" text,
	"routing_reason" text,
	"last_contact_at" timestamp,
	"next_follow_up_at" timestamp,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "terra_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"type" text DEFAULT 'buyer' NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"stage" text DEFAULT 'new' NOT NULL,
	"score" integer DEFAULT 50 NOT NULL,
	"conversion_probability" numeric(5, 4) DEFAULT '0.5' NOT NULL,
	"owner_user_id" integer,
	"owner_name" text,
	"assigned_date" text,
	"last_contact" text,
	"next_follow_up" text,
	"distress_property_id" integer,
	"distress_property_external_id" text,
	"linked_deal_id" integer,
	"budget" jsonb,
	"desired_areas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"timeline" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"next_action" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "terra_leads_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "terra_leases" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"document_name" text NOT NULL,
	"tenant" text NOT NULL,
	"premises" text,
	"property_address" text,
	"lease_type" text,
	"commencement_date" text,
	"expiration_date" text,
	"base_rent" numeric(16, 2),
	"rent_per_sqft" numeric(10, 2),
	"sqft" integer,
	"escalations" text,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cam" numeric(14, 2),
	"ti_allowance" numeric(14, 2),
	"security_deposit" numeric(14, 2),
	"termination_option" text,
	"exclusive_use" text,
	"co_tenancy" text,
	"confidence" integer DEFAULT 85 NOT NULL,
	"flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"raw_data" jsonb,
	"owner_user_id" integer,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "terra_leases_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "terra_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"property_id" integer,
	"agent_id" integer,
	"brokerage_id" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"list_price" numeric(16, 2) NOT NULL,
	"price_per_sqft" numeric(10, 2),
	"original_list_price" numeric(16, 2),
	"cap_rate" numeric(5, 2),
	"noi" numeric(14, 2),
	"days_on_market" integer DEFAULT 0 NOT NULL,
	"inquiry_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"price_reductions" integer DEFAULT 0 NOT NULL,
	"list_date" text NOT NULL,
	"expiration_date" text,
	"closed_date" text,
	"closed_price" numeric(16, 2),
	"opportunity_score" integer DEFAULT 50 NOT NULL,
	"market_notes" text,
	"price_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "terra_listings_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "terra_loan_financials" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_agreement_id" text NOT NULL,
	"property_external_id" text NOT NULL,
	"statement_period" text NOT NULL,
	"statement_date" text NOT NULL,
	"source" text DEFAULT 'lender-portal' NOT NULL,
	"noi" numeric(16, 2),
	"debt_service" numeric(16, 2),
	"occupancy_rate" numeric(5, 4),
	"appraised_value" numeric(16, 2),
	"outstanding_balance" numeric(16, 2),
	"is_audited" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ingested_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "terra_mls_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_key" text NOT NULL,
	"listing_id" text,
	"mls_name" text NOT NULL,
	"standard_status" text DEFAULT 'Active' NOT NULL,
	"list_price" numeric(16, 2) NOT NULL,
	"original_list_price" numeric(16, 2),
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state_or_province" text NOT NULL,
	"postal_code" text,
	"county" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"property_type" text DEFAULT 'Residential' NOT NULL,
	"property_sub_type" text,
	"bedrooms_total" integer,
	"bathrooms_total_integer" integer,
	"living_area" integer,
	"lot_size_square_feet" integer,
	"year_built" integer,
	"days_on_market" integer DEFAULT 0 NOT NULL,
	"modification_timestamp" text NOT NULL,
	"listing_contract_date" text,
	"media" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"list_agent_full_name" text,
	"list_office_name" text,
	"public_remarks" text,
	"has_distress_cross_ref" boolean DEFAULT false NOT NULL,
	"distress_property_id" integer,
	"raw_data" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"ingest_source" text DEFAULT 'demo' NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "terra_mls_listings_listing_key_unique" UNIQUE("listing_key")
);
--> statement-breakpoint
CREATE TABLE "terra_pro_forma_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"project_name" text NOT NULL,
	"property_type" text,
	"inputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"results" jsonb,
	"owner_name" text,
	"owner_user_id" integer,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "terra_pro_forma_projects_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "terra_properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text,
	"submarket" text,
	"property_type" text NOT NULL,
	"sqft" integer,
	"year_built" integer,
	"floors" integer,
	"units" integer,
	"parking_spaces" integer,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"assessed_value" numeric(16, 2),
	"zoning" text,
	"owner_name" text,
	"owner_type" text DEFAULT 'unknown' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "terra_properties_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "terra_saved_opportunities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"distress_property_id" integer NOT NULL,
	"note" text,
	"saved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "terra_tax_appeals" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"name" text NOT NULL,
	"address" text,
	"property_type" text,
	"sqft" integer,
	"assessed_value" numeric(16, 2),
	"avm_value" numeric(16, 2),
	"tax_rate" numeric(8, 4),
	"over_assessed_pct" numeric(8, 2),
	"annual_tax" numeric(14, 2),
	"potential_savings" numeric(14, 2),
	"appeal_deadline" text,
	"appeal_status" text DEFAULT 'eligible' NOT NULL,
	"juris" text,
	"comparables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"appeal_strength" text DEFAULT 'moderate' NOT NULL,
	"notes" text,
	"owner_user_id" integer,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "terra_tax_appeals_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "terra_tenant_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"name" text NOT NULL,
	"type" text DEFAULT 'individual' NOT NULL,
	"target_unit" text,
	"proposed_rent" numeric(14, 2),
	"lease_term_months" integer,
	"submitted_date" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"overall_score" integer DEFAULT 50 NOT NULL,
	"recommendation" text DEFAULT 'conditional' NOT NULL,
	"credit_score" integer,
	"annual_income" numeric(14, 2),
	"income_verified" boolean DEFAULT false NOT NULL,
	"rent_to_income_ratio" numeric(6, 2),
	"prior_evictions" integer DEFAULT 0 NOT NULL,
	"background_clear" boolean DEFAULT true NOT NULL,
	"screening_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"owner_user_id" integer,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "terra_tenant_applications_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "terra_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer,
	"property_id" integer,
	"agent_id" integer,
	"brokerage_id" integer,
	"buyer_name" text,
	"seller_name" text,
	"sale_price" numeric(16, 2) NOT NULL,
	"list_price" numeric(16, 2),
	"commission" numeric(14, 2),
	"commission_pct" numeric(5, 2),
	"days_on_market" integer,
	"days_to_close" integer,
	"closed_date" text NOT NULL,
	"financing_type" text DEFAULT 'conventional' NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"notes" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "terra_waterfall_structures" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"name" text NOT NULL,
	"description" text,
	"inputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"results" jsonb,
	"owner_name" text,
	"owner_user_id" integer,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "terra_waterfall_structures_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "terra_portfolio_modules" (
	"module" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trace_entity_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"role" text DEFAULT 'touched' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trace_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" text NOT NULL,
	"span_id" text,
	"kind" "trace_event_kind" NOT NULL,
	"name" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"latency_ms" real,
	"tokens" integer,
	"cost_usd" real,
	"success" boolean,
	"error_code" text,
	"error_message" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trace_spans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" text NOT NULL,
	"span_id" text NOT NULL,
	"parent_span_id" text,
	"name" text NOT NULL,
	"status" "span_status" DEFAULT 'ok' NOT NULL,
	"latency_ms" real,
	"error_message" text,
	"attributes" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" text NOT NULL,
	"request_id" text,
	"session_id" text,
	"workflow_id" text,
	"agent_id" text,
	"user_id" text,
	"operator_id" text,
	"domain" text,
	"model" text,
	"prompt_version" text,
	"status" "trace_status" DEFAULT 'running' NOT NULL,
	"latency_ms" real,
	"total_tokens" integer,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"cost_usd" real,
	"retries" integer DEFAULT 0 NOT NULL,
	"rollback_id" text,
	"is_replay" boolean DEFAULT false NOT NULL,
	"replay_of_trace_id" text,
	"business_impact" jsonb,
	"outputs" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "traces_trace_id_unique" UNIQUE("trace_id")
);
--> statement-breakpoint
CREATE TABLE "vessels_alert_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"name" text NOT NULL,
	"description" text,
	"rule_type" text NOT NULL,
	"conditions" jsonb NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessels_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" integer,
	"vessel_id" integer,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"severity" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"metadata" jsonb,
	"triggered_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "vessels_cargo" (
	"id" serial PRIMARY KEY NOT NULL,
	"vessel_id" integer NOT NULL,
	"org_id" integer,
	"cargo_type" text NOT NULL,
	"quantity" numeric(12, 2),
	"unit" text,
	"origin" text,
	"destination" text,
	"eta" timestamp,
	"status" text DEFAULT 'loading' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessels_command_workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"vessel_id" integer,
	"event_id" integer,
	"workflow_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"assigned_to" text,
	"notes" text,
	"consequence_impact" jsonb,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessels_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"vessel_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"severity" text DEFAULT 'watch' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'open' NOT NULL,
	"assigned_to" text,
	"consequence_data" jsonb,
	"acknowledged_at" timestamp,
	"resolved_at" timestamp,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessels_fleets" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"name" text NOT NULL,
	"description" text,
	"region" text,
	"status" text DEFAULT 'active' NOT NULL,
	"vessel_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessels_positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"vessel_id" integer NOT NULL,
	"org_id" integer,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"heading" numeric(5, 2),
	"speed" numeric(6, 2),
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessels_routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"vessel_id" integer NOT NULL,
	"org_id" integer,
	"origin_port" text NOT NULL,
	"destination_port" text NOT NULL,
	"departure_at" timestamp,
	"arrival_at" timestamp,
	"waypoints" jsonb,
	"distance_nm" numeric(10, 2),
	"status" text DEFAULT 'planned' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessels_simulations" (
	"id" serial PRIMARY KEY NOT NULL,
	"route_id" integer,
	"vessel_id" integer,
	"name" text NOT NULL,
	"description" text,
	"simulation_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"parameters" jsonb,
	"results" jsonb,
	"risk_score" numeric(5, 2),
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessels" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"fleet_id" integer,
	"name" text NOT NULL,
	"imo" text,
	"mmsi" text,
	"vessel_type" text NOT NULL,
	"vessel_class" text,
	"flag" text,
	"year_built" integer,
	"gross_tonnage" numeric(12, 2),
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vessels_imo_unique" UNIQUE("imo")
);
--> statement-breakpoint
CREATE TABLE "vessels_weather_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"route_id" integer,
	"location" text NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"temperature" numeric(5, 2),
	"wind_speed" numeric(6, 2),
	"wind_direction" text,
	"wave_height" numeric(5, 2),
	"visibility" numeric(6, 2),
	"description" text,
	"risk_level" text DEFAULT 'low' NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessels_bills_of_lading" (
	"id" text PRIMARY KEY NOT NULL,
	"vessel_name" text NOT NULL,
	"imo" text DEFAULT '' NOT NULL,
	"voyage_id" text DEFAULT '' NOT NULL,
	"shipper" text NOT NULL,
	"consignee" text NOT NULL,
	"notify_party" text DEFAULT '' NOT NULL,
	"cargo" text NOT NULL,
	"quantity" text DEFAULT '' NOT NULL,
	"quantity_mt" numeric(16, 2) DEFAULT '0' NOT NULL,
	"unit" text DEFAULT 'MT' NOT NULL,
	"origin_port" text NOT NULL,
	"destination_port" text NOT NULL,
	"status" text DEFAULT 'issued' NOT NULL,
	"lc_ref" text DEFAULT '' NOT NULL,
	"lc_issuer" text DEFAULT '' NOT NULL,
	"lc_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"lc_status" text DEFAULT 'pending' NOT NULL,
	"auto_lc_release" boolean DEFAULT true NOT NULL,
	"transfer_count" integer DEFAULT 0 NOT NULL,
	"delivery_confirmed" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"inserted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessels_bol_chain_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"bol_id" text NOT NULL,
	"sequence" integer NOT NULL,
	"event_type" text NOT NULL,
	"actor" text NOT NULL,
	"event_timestamp" text NOT NULL,
	"confirmed" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fleet_exceptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"vessel_id" integer,
	"voyage_id" integer,
	"exception_ref" text NOT NULL,
	"exception_type" text NOT NULL,
	"severity" text DEFAULT 'watch' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"why_it_matters" text,
	"recommended_response" text,
	"business_consequence" text,
	"owner" text,
	"owner_function" text,
	"estimated_impact_usd" numeric(15, 2),
	"status" text DEFAULT 'active' NOT NULL,
	"acknowledged_at" timestamp,
	"acknowledged_by" integer,
	"resolved_at" timestamp,
	"resolved_by" integer,
	"resolution_notes" text,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessel_maintenance" (
	"id" serial PRIMARY KEY NOT NULL,
	"vessel_id" integer NOT NULL,
	"component" text NOT NULL,
	"maintenance_type" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"due_date" timestamp,
	"completed_at" timestamp,
	"estimated_cost" numeric(12, 2),
	"risk_of_service_issue" numeric(5, 2),
	"impacts_voyage_availability" boolean DEFAULT false NOT NULL,
	"asset_health" numeric(5, 2),
	"technician" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessel_port_calls" (
	"id" serial PRIMARY KEY NOT NULL,
	"vessel_id" integer NOT NULL,
	"port_name" text NOT NULL,
	"port_locode" text,
	"port_country" text,
	"arrival_at" timestamp,
	"departure_at" timestamp,
	"duration_hours" numeric(7, 2),
	"purpose" text DEFAULT 'loading',
	"cargo_loaded" numeric(12, 2),
	"cargo_discharged" numeric(12, 2),
	"port_cost_usd" numeric(12, 2),
	"bunkered_mt" numeric(8, 2),
	"canal_transit" boolean DEFAULT false,
	"canal_name" text,
	"canal_fee_usd" numeric(12, 2),
	"agent_name" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessel_sanctions_screening" (
	"id" serial PRIMARY KEY NOT NULL,
	"vessel_id" integer NOT NULL,
	"screening_date" timestamp DEFAULT now() NOT NULL,
	"ofac_status" text DEFAULT 'pending' NOT NULL,
	"eu_status" text DEFAULT 'pending' NOT NULL,
	"un_status" text DEFAULT 'pending' NOT NULL,
	"uk_status" text DEFAULT 'pending' NOT NULL,
	"matched_lists" jsonb DEFAULT '[]'::jsonb,
	"match_confidence" numeric(5, 2),
	"flag_registry_valid" boolean DEFAULT true,
	"flag_registry_notes" text,
	"psc_inspection_date" timestamp,
	"psc_result" text DEFAULT 'no_inspection',
	"psc_deficiencies" integer DEFAULT 0,
	"compliance_score" numeric(5, 2),
	"ownership_opaque" boolean DEFAULT false,
	"known_owner" text,
	"known_manager" text,
	"flag_state" text,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessel_voyage_economics" (
	"id" serial PRIMARY KEY NOT NULL,
	"vessel_id" integer NOT NULL,
	"voyage_ref" text NOT NULL,
	"origin_port" text NOT NULL,
	"destination_port" text NOT NULL,
	"cargo_type" text,
	"cargo_quantity_mt" numeric(12, 2),
	"cargo_value_usd" numeric(15, 2),
	"charter_type" text DEFAULT 'voyage_charter' NOT NULL,
	"charter_rate_per_day" numeric(12, 2),
	"gross_revenue" numeric(15, 2),
	"fuel_cost_usd" numeric(12, 2),
	"fuel_consumed_mt" numeric(10, 2),
	"port_costs_usd" numeric(12, 2),
	"canal_fees_usd" numeric(12, 2),
	"crew_costs_usd" numeric(12, 2),
	"maintenance_costs_usd" numeric(12, 2),
	"other_costs_usd" numeric(12, 2),
	"total_costs_usd" numeric(15, 2),
	"net_margin_usd" numeric(15, 2),
	"margin_pct" numeric(7, 4),
	"tce_per_day" numeric(12, 2),
	"distance_nm" numeric(10, 2),
	"duration_days" numeric(7, 2),
	"delay_hours" numeric(7, 2) DEFAULT '0',
	"delay_cost_usd" numeric(12, 2) DEFAULT '0',
	"status" text DEFAULT 'planned' NOT NULL,
	"scheduled_departure_at" timestamp,
	"actual_departure_at" timestamp,
	"scheduled_arrival_at" timestamp,
	"estimated_arrival_at" timestamp,
	"actual_arrival_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fleets" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journeys" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"vessel_asset_id" integer,
	"origin_label" text,
	"destination_label" text,
	"start_time" timestamp,
	"end_time" timestamp,
	"route_geojson" jsonb,
	"status" text DEFAULT 'planned' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessel_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"vessel_asset_id" integer,
	"journey_id" integer,
	"alert_type" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessel_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"vessel_asset_id" integer,
	"event_type" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"metadata_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessel_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"title" text NOT NULL,
	"report_type" text NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"report_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessels_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"fleet_id" integer,
	"organization_id" integer NOT NULL,
	"name" text NOT NULL,
	"asset_type" text,
	"imo_or_identifier" text,
	"status" text DEFAULT 'active' NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"metadata_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessels_psc_checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"vessel_id" integer NOT NULL,
	"org_id" integer,
	"category" text NOT NULL,
	"status" text DEFAULT 'pass' NOT NULL,
	"note" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessels_psc_inspections" (
	"id" serial PRIMARY KEY NOT NULL,
	"vessel_id" integer NOT NULL,
	"org_id" integer,
	"port" text NOT NULL,
	"port_country" text,
	"mou_regime" text NOT NULL,
	"inspection_date" timestamp NOT NULL,
	"result" text NOT NULL,
	"deficiencies_count" integer DEFAULT 0 NOT NULL,
	"deficiency_categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"detained" boolean DEFAULT false NOT NULL,
	"detention_days" integer,
	"inspector" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commodity_trading_fills" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"instrument_id" integer,
	"fill_ref" text NOT NULL,
	"side" "trading_order_side" NOT NULL,
	"quantity" numeric(15, 4) NOT NULL,
	"price" numeric(15, 4) NOT NULL,
	"commission" numeric(10, 2) DEFAULT '0',
	"execution_venue" text DEFAULT 'SZL-DEMO',
	"filled_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "commodity_trading_fills_fill_ref_unique" UNIQUE("fill_ref")
);
--> statement-breakpoint
CREATE TABLE "commodity_trading_instruments" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"name" text NOT NULL,
	"instrument_type" "trading_instrument_type" DEFAULT 'dry_bulk' NOT NULL,
	"exchange" text DEFAULT 'Baltic Exchange' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"unit" text DEFAULT '$/day' NOT NULL,
	"lot_size" numeric(15, 2) DEFAULT '1',
	"tick_size" numeric(10, 4) DEFAULT '0.01',
	"current_price" numeric(15, 4),
	"previous_close" numeric(15, 4),
	"day_high" numeric(15, 4),
	"day_low" numeric(15, 4),
	"volume" integer DEFAULT 0,
	"open_interest" integer DEFAULT 0,
	"description" text,
	"route_code" text,
	"is_active" boolean DEFAULT true,
	"last_updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "commodity_trading_instruments_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "commodity_trading_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer DEFAULT 1,
	"instrument_id" integer,
	"order_ref" text NOT NULL,
	"order_type" "trading_order_type" DEFAULT 'market' NOT NULL,
	"side" "trading_order_side" NOT NULL,
	"status" "trading_order_status" DEFAULT 'pending' NOT NULL,
	"quantity" numeric(15, 4) NOT NULL,
	"limit_price" numeric(15, 4),
	"avg_fill_price" numeric(15, 4),
	"filled_qty" numeric(15, 4) DEFAULT '0',
	"remaining_qty" numeric(15, 4),
	"notional_value" numeric(20, 2),
	"commission" numeric(10, 2) DEFAULT '0',
	"notes" text,
	"submitted_at" timestamp DEFAULT now(),
	"filled_at" timestamp,
	"cancelled_at" timestamp,
	"expires_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "commodity_trading_orders_order_ref_unique" UNIQUE("order_ref")
);
--> statement-breakpoint
CREATE TABLE "commodity_trading_positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer DEFAULT 1,
	"instrument_id" integer,
	"side" "trading_order_side" NOT NULL,
	"quantity" numeric(15, 4) DEFAULT '0' NOT NULL,
	"avg_entry_price" numeric(15, 4),
	"current_price" numeric(15, 4),
	"unrealized_pnl" numeric(20, 2) DEFAULT '0',
	"realized_pnl" numeric(20, 2) DEFAULT '0',
	"total_pnl" numeric(20, 2) DEFAULT '0',
	"notional_value" numeric(20, 2),
	"margin_used" numeric(20, 2) DEFAULT '0',
	"opened_at" timestamp DEFAULT now(),
	"last_updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_recipients" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"phone_number" text NOT NULL,
	"label" text,
	"sms_enabled" boolean DEFAULT true NOT NULL,
	"voice_enabled" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "web_push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"app_id" text DEFAULT 'unknown' NOT NULL,
	"user_agent" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"connector_id" integer,
	"source" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb,
	"status" text DEFAULT 'received' NOT NULL,
	"error_message" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worldline_fetch_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer NOT NULL,
	"org_id" integer,
	"status" text NOT NULL,
	"records_received" integer DEFAULT 0 NOT NULL,
	"records_normalized" integer DEFAULT 0 NOT NULL,
	"records_rejected" integer DEFAULT 0 NOT NULL,
	"confidence_score" real,
	"freshness_score" real,
	"latency_ms" integer,
	"error_message" text,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"correlation_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "worldline_signal_publications" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer NOT NULL,
	"fetch_log_id" integer,
	"org_id" integer,
	"target_pack" text NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"record_count" integer DEFAULT 0 NOT NULL,
	"payload_summary" jsonb DEFAULT '{}'::jsonb,
	"correlation_id" text
);
--> statement-breakpoint
CREATE TABLE "worldline_source_registry" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"source_type" text NOT NULL,
	"domain" text NOT NULL,
	"status" text DEFAULT 'pending_setup' NOT NULL,
	"freshness_cadence" text DEFAULT 'daily' NOT NULL,
	"confidence_baseline" real DEFAULT 0.7 NOT NULL,
	"connection_config" jsonb DEFAULT '{}'::jsonb,
	"normalization_config" jsonb DEFAULT '{}'::jsonb,
	"last_fetched_at" timestamp,
	"last_success_at" timestamp,
	"last_error_at" timestamp,
	"last_error_message" text,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"total_fetches" integer DEFAULT 0 NOT NULL,
	"total_records_ingested" integer DEFAULT 0 NOT NULL,
	"freshness_score" real DEFAULT 1,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crisis_arena_architect_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"display_name" text NOT NULL,
	"bio" text,
	"reputation_score" integer DEFAULT 0 NOT NULL,
	"accepted_count" integer DEFAULT 0 NOT NULL,
	"submission_count" integer DEFAULT 0 NOT NULL,
	"total_impact_usd" integer DEFAULT 0 NOT NULL,
	"badges" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"archetype_stats" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"top_scenario_titles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crisis_arena_architect_profiles_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "crisis_arena_engagements" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"owner_id" integer,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"scoped_assets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"scoped_domains" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"archetype_filter" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"payout_pool" integer DEFAULT 0 NOT NULL,
	"deadline" timestamp NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"submission_count" integer DEFAULT 0 NOT NULL,
	"accepted_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crisis_arena_reputation_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"architect_id" text NOT NULL,
	"delta" integer NOT NULL,
	"reason" text NOT NULL,
	"submission_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crisis_arena_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"engagement_id" text NOT NULL,
	"architect_id" text NOT NULL,
	"title" text NOT NULL,
	"narrative" text NOT NULL,
	"archetype" text NOT NULL,
	"business_impact_score" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reputation_awarded" integer DEFAULT 0 NOT NULL,
	"payout_awarded" integer DEFAULT 0 NOT NULL,
	"triage_justification" text,
	"graduated_incident_id" text,
	"impact_estimate" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"kill_chain" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crisis_arena_triage_events" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"engagement_id" text NOT NULL,
	"action" text NOT NULL,
	"actor" text NOT NULL,
	"justification" text NOT NULL,
	"payout_amount" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "per_calibration_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"run_id" text NOT NULL,
	"candidate_id" text NOT NULL,
	"run_type" text DEFAULT 'dataset' NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"dataset_id" text,
	"dataset_name" text,
	"calibration_samples" integer DEFAULT 0 NOT NULL,
	"pre_bias" real,
	"post_bias" real,
	"bias_reduction" real,
	"confidence_alignment" real,
	"safe_fallback_triggered" boolean DEFAULT false NOT NULL,
	"safe_fallback_reason" text,
	"simulated" boolean DEFAULT false NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "per_calibration_runs_run_id_unique" UNIQUE("run_id")
);
--> statement-breakpoint
CREATE TABLE "per_candidate_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"candidate_id" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"base_model_ref" text,
	"candidate_model_ref" text,
	"policy_version" text DEFAULT '0.1.0' NOT NULL,
	"state" text DEFAULT 'draft' NOT NULL,
	"precision_profile" text DEFAULT 'cpu_safe' NOT NULL,
	"inference_backend" text DEFAULT 'local_safe' NOT NULL,
	"training_backend" text DEFAULT 'local_safe' NOT NULL,
	"evaluation_backend" text DEFAULT 'local_safe' NOT NULL,
	"simulated" boolean DEFAULT false NOT NULL,
	"registered_by_id" integer,
	"activated_at" timestamp,
	"rolled_back_at" timestamp,
	"rollback_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "per_candidate_policies_candidate_id_unique" UNIQUE("candidate_id")
);
--> statement-breakpoint
CREATE TABLE "per_drift_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"candidate_id" text NOT NULL,
	"baseline_run_id" text,
	"candidate_run_id" text,
	"overall_drift_score" real NOT NULL,
	"status" text DEFAULT 'healthy' NOT NULL,
	"drift_response" real,
	"drift_reward" real,
	"drift_citation" real,
	"drift_structured_output" real,
	"drift_latency" real,
	"drift_cost" real,
	"drift_length" real,
	"drift_failure_rate" real,
	"drift_approval_rejection" real,
	"safe_fallback_triggered" boolean DEFAULT false NOT NULL,
	"safe_fallback_reason" text,
	"threshold_config" jsonb DEFAULT '{}'::jsonb,
	"simulated" boolean DEFAULT false NOT NULL,
	"measured_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "per_drift_reports_report_id_unique" UNIQUE("report_id")
);
--> statement-breakpoint
CREATE TABLE "per_evaluation_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"candidate_id" text NOT NULL,
	"case_id" text NOT NULL,
	"category" text NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"score_total" real,
	"latency_ms" integer,
	"cost_usd" numeric(10, 6),
	"input_hash" text,
	"output_summary" text,
	"failure_reason" text,
	"trace_id" text,
	"simulated" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "per_evaluation_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"run_id" text NOT NULL,
	"candidate_id" text NOT NULL,
	"suite_id" text,
	"suite_name" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"triggered_by" text DEFAULT 'api' NOT NULL,
	"total_cases" integer DEFAULT 0 NOT NULL,
	"passed" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"pass_rate" real,
	"avg_score_total" real,
	"avg_latency_ms" real,
	"total_cost_usd" numeric(10, 6),
	"has_regression" boolean DEFAULT false NOT NULL,
	"regression_severity" text DEFAULT 'none' NOT NULL,
	"coverage_threshold_met" boolean DEFAULT false NOT NULL,
	"simulated" boolean DEFAULT false NOT NULL,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "per_evaluation_runs_run_id_unique" UNIQUE("run_id")
);
--> statement-breakpoint
CREATE TABLE "per_promotion_decisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"decision_id" text NOT NULL,
	"candidate_id" text NOT NULL,
	"org_id" integer,
	"outcome" text DEFAULT 'pending_review' NOT NULL,
	"from_state" text NOT NULL,
	"to_state" text NOT NULL,
	"evaluation_run_id" text,
	"reward_score" real,
	"drift_score" real,
	"governance_passed_all" boolean DEFAULT false NOT NULL,
	"coverage_threshold_met" boolean DEFAULT false NOT NULL,
	"human_approval_required" boolean DEFAULT true NOT NULL,
	"approval_request_id" integer,
	"approved_by_id" integer,
	"approved_at" timestamp,
	"rejection_reason" text,
	"rollback_path" text,
	"rollback_verified" boolean DEFAULT false NOT NULL,
	"audit_chain_event_id" integer,
	"proof_content_id" text,
	"simulated" boolean DEFAULT false NOT NULL,
	"evidence_bundle" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "per_promotion_decisions_decision_id_unique" UNIQUE("decision_id")
);
--> statement-breakpoint
CREATE TABLE "per_reward_breakdowns" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"candidate_id" text NOT NULL,
	"score_total" real NOT NULL,
	"score_correctness" real,
	"score_citation_fidelity" real,
	"score_policy_compliance" real,
	"score_structured_output" real,
	"score_latency" real,
	"score_cost" real,
	"score_user_utility" real,
	"score_refusal_quality" real,
	"score_audit_completeness" real,
	"penalty_hallucination" real,
	"penalty_failure" real,
	"governance_findings" jsonb DEFAULT '[]'::jsonb,
	"recommendation" text DEFAULT 'review' NOT NULL,
	"promotion_eligible" boolean DEFAULT false NOT NULL,
	"simulated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "per_reward_breakdowns_run_id_unique" UNIQUE("run_id")
);
--> statement-breakpoint
CREATE TABLE "per_rollout_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"candidate_id" text NOT NULL,
	"evaluation_run_id" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"batch_size" integer DEFAULT 10 NOT NULL,
	"completed_batches" integer DEFAULT 0 NOT NULL,
	"total_batches" integer DEFAULT 0 NOT NULL,
	"deterministic_replay" boolean DEFAULT false NOT NULL,
	"replay_seed" text,
	"worker_node" text,
	"queue_depth" integer DEFAULT 0 NOT NULL,
	"simulated" boolean DEFAULT false NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "per_rollout_jobs_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "per_rollout_traces" (
	"id" serial PRIMARY KEY NOT NULL,
	"trace_id" text NOT NULL,
	"job_id" text NOT NULL,
	"candidate_id" text NOT NULL,
	"case_id" text NOT NULL,
	"input_hash" text,
	"output_hash" text,
	"tool_calls" jsonb DEFAULT '[]'::jsonb,
	"latency_ms" integer,
	"tokens_in" integer DEFAULT 0,
	"tokens_out" integer DEFAULT 0,
	"cost_usd" numeric(10, 6),
	"passed" boolean DEFAULT false NOT NULL,
	"score_total" real,
	"simulated" boolean DEFAULT false NOT NULL,
	"replayable" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "per_rollout_traces_trace_id_unique" UNIQUE("trace_id")
);
--> statement-breakpoint
CREATE TABLE "per_runtime_health_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_id" text NOT NULL,
	"precision_profile" text DEFAULT 'cpu_safe' NOT NULL,
	"environment_mode" text DEFAULT 'simulation' NOT NULL,
	"inference_backend" text DEFAULT 'local_safe' NOT NULL,
	"training_backend" text DEFAULT 'local_safe' NOT NULL,
	"evaluation_backend" text DEFAULT 'local_safe' NOT NULL,
	"device_info" jsonb DEFAULT '{}'::jsonb,
	"throughput_tokens_per_sec" real,
	"avg_latency_ms" real,
	"cache_strategy" text,
	"active_job_count" integer DEFAULT 0 NOT NULL,
	"queue_depth" integer DEFAULT 0 NOT NULL,
	"remote_backend_healthy" boolean,
	"drift_guard_active" boolean DEFAULT true NOT NULL,
	"simulated" boolean DEFAULT true NOT NULL,
	"measured_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "per_runtime_health_snapshots_snapshot_id_unique" UNIQUE("snapshot_id")
);
--> statement-breakpoint
CREATE TABLE "counsel_knowledge_chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"matter_id" text NOT NULL,
	"org_id" text DEFAULT 'default' NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"start_char" integer DEFAULT 0 NOT NULL,
	"end_char" integer DEFAULT 0 NOT NULL,
	"section_hint" text,
	"keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counsel_knowledge_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" text NOT NULL,
	"org_id" text DEFAULT 'default' NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer DEFAULT 0 NOT NULL,
	"text_content" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"entity_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"indexed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "counsel_knowledge_entities" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" text NOT NULL,
	"org_id" text DEFAULT 'default' NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"document_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"chunk_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"mention_count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counsel_knowledge_queries" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" text NOT NULL,
	"org_id" text DEFAULT 'default' NOT NULL,
	"question" text NOT NULL,
	"answer" text,
	"citations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"answered_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "counsel_knowledge_relations" (
	"id" serial PRIMARY KEY NOT NULL,
	"matter_id" text NOT NULL,
	"org_id" text DEFAULT 'default' NOT NULL,
	"subject_entity" text NOT NULL,
	"predicate" text NOT NULL,
	"object_entity" text NOT NULL,
	"description" text,
	"document_id" integer,
	"chunk_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"client_secret_hash" text NOT NULL,
	"name" text NOT NULL,
	"org_id" integer,
	"allowed_scopes" text[] DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_clients_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "mesh_call_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"principal_type" text NOT NULL,
	"principal_id" text NOT NULL,
	"principal_name" text NOT NULL,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"status_code" integer,
	"latency_ms" integer,
	"org_id" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "international_payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"type" text NOT NULL,
	"stripe_payment_method_id" text,
	"currency" text DEFAULT 'eur' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"last_four" text,
	"bank_name" text,
	"sort_code" text,
	"iban" text,
	"mandate_reference" text,
	"mandate_accepted_at" timestamp,
	"metadata" jsonb,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "international_payment_methods_stripe_payment_method_id_unique" UNIQUE("stripe_payment_method_id")
);
--> statement-breakpoint
CREATE TABLE "international_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"payment_method_id" integer,
	"stripe_payment_intent_id" text,
	"amount" numeric(14, 2) NOT NULL,
	"currency" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'initiated' NOT NULL,
	"settlement_date" timestamp,
	"failure_reason" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "international_payments_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "esignature_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"signatory_email" text,
	"signatory_name" text,
	"payload" jsonb,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "esignature_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer,
	"lifecycle_document_id" text,
	"requested_by_id" integer,
	"provider" text DEFAULT 'docusign' NOT NULL,
	"provider_envelope_id" text,
	"document_title" text NOT NULL,
	"document_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"signatories" jsonb DEFAULT '[]' NOT NULL,
	"completed_at" timestamp,
	"expires_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "esignature_requests_provider_envelope_id_unique" UNIQUE("provider_envelope_id")
);
--> statement-breakpoint
CREATE TABLE "plugin_installations" (
	"id" serial PRIMARY KEY NOT NULL,
	"plugin_id" integer NOT NULL,
	"org_id" integer NOT NULL,
	"installed_by_id" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"config" jsonb DEFAULT '{}' NOT NULL,
	"installed_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plugin_installations_plugin_org_unique" UNIQUE("plugin_id","org_id")
);
--> statement-breakpoint
CREATE TABLE "plugins" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"description" text,
	"author" text,
	"category" text DEFAULT 'domain' NOT NULL,
	"entry_point" text,
	"manifest_url" text,
	"capabilities" jsonb DEFAULT '[]' NOT NULL,
	"governance_inherited" boolean DEFAULT true NOT NULL,
	"proof_chain_enabled" boolean DEFAULT true NOT NULL,
	"design_system_version" text DEFAULT '1.0',
	"billing_enabled" boolean DEFAULT false NOT NULL,
	"pricing_model" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_core_plugin" boolean DEFAULT false NOT NULL,
	"created_by_id" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plugins_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "billing_dispute_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"dispute_id" integer NOT NULL,
	"action" text NOT NULL,
	"performed_by_id" integer,
	"notes" text,
	"metadata" jsonb,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_disputes" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"stripe_dispute_id" text NOT NULL,
	"stripe_charge_id" text,
	"stripe_payment_intent_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"reason" text,
	"status" text DEFAULT 'needs_response' NOT NULL,
	"is_chargeback" integer DEFAULT 1 NOT NULL,
	"stripe_evidence_due_by" timestamp,
	"evidence_submitted" jsonb,
	"response_notes" text,
	"responded_at" timestamp,
	"responded_by_id" integer,
	"closed_at" timestamp,
	"outcome" text,
	"stripe_raw_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_disputes_stripe_dispute_id_unique" UNIQUE("stripe_dispute_id")
);
--> statement-breakpoint
CREATE TABLE "treasury_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"provider" text DEFAULT 'coinbase_commerce' NOT NULL,
	"account_id" text,
	"label" text NOT NULL,
	"currency" text NOT NULL,
	"currency_type" text DEFAULT 'stablecoin' NOT NULL,
	"network" text,
	"wallet_address" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treasury_balance_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"org_id" integer NOT NULL,
	"balance" numeric(20, 8) NOT NULL,
	"balance_usd" numeric(20, 2),
	"exchange_rate" numeric(20, 8),
	"snapshot_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treasury_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"org_id" integer NOT NULL,
	"provider_tx_id" text,
	"tx_type" text DEFAULT 'credit' NOT NULL,
	"amount" numeric(20, 8) NOT NULL,
	"currency" text NOT NULL,
	"amount_usd" numeric(20, 2),
	"description" text,
	"counterparty" text,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"tx_hash" text,
	"metadata" jsonb,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "treasury_transactions_provider_tx_id_unique" UNIQUE("provider_tx_id")
);
--> statement-breakpoint
CREATE TABLE "court_filing_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"filing_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"description" text,
	"payload" jsonb,
	"performed_by_id" integer,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "court_filings" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"matter_id" integer,
	"submitted_by_id" integer,
	"filing_type" text DEFAULT 'other' NOT NULL,
	"jurisdiction" text NOT NULL,
	"court_name" text,
	"case_number" text,
	"document_title" text NOT NULL,
	"document_url" text,
	"electronic_filing_system" text DEFAULT 'manual' NOT NULL,
	"efs_confirmation_number" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"filing_fee_amount" text,
	"filing_fee_status" text,
	"due_date" timestamp,
	"submitted_at" timestamp,
	"accepted_at" timestamp,
	"rejection_reason" text,
	"electronically_supported_jurisdiction" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rf_anomalies" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"vessel_name" text NOT NULL,
	"imo_number" text NOT NULL,
	"anomaly_type" text NOT NULL,
	"severity" text NOT NULL,
	"lat" real NOT NULL,
	"lon" real NOT NULL,
	"drift_distance_nm" real,
	"last_known_lat" real,
	"last_known_lon" real,
	"gap_hours" real,
	"correlation_score" integer NOT NULL,
	"satellite_pass_id" text NOT NULL,
	"description" text NOT NULL,
	"predicted_heading" integer,
	"confidence_percent" integer NOT NULL,
	"tags" jsonb DEFAULT '[]' NOT NULL,
	"region" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rf_satellite_passes" (
	"id" text PRIMARY KEY NOT NULL,
	"satellite_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"vessel_name" text NOT NULL,
	"imo_number" text NOT NULL,
	"observed_lat" real NOT NULL,
	"observed_lon" real NOT NULL,
	"ais_reported_lat" real NOT NULL,
	"ais_reported_lon" real NOT NULL,
	"drift_distance_nm" real NOT NULL,
	"bearing_deviation_deg" real NOT NULL,
	"correlation_score" integer NOT NULL,
	"anomaly_flag" integer DEFAULT 0 NOT NULL,
	"anomaly_type" text,
	"pass_timestamp" timestamp DEFAULT now() NOT NULL,
	"coverage_quality" text DEFAULT 'good' NOT NULL,
	"confidence_percent" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counsel_clauses" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"clause_type" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"text" text NOT NULL,
	"matter_id" text,
	"matter_name" text,
	"document_ref" text,
	"jurisdiction" text,
	"risk_score" real DEFAULT 0 NOT NULL,
	"risk_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"taxonomy_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"provenance_envelope" jsonb,
	"confidence_band" jsonb,
	"precedent_links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"effective_date" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counsel_draft_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"clause_type" text NOT NULL,
	"context" text,
	"matter_id" text,
	"draft_text" text NOT NULL,
	"citations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"provenance_envelope" jsonb NOT NULL,
	"confidence_band" jsonb NOT NULL,
	"risk_diff" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counsel_playbook_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"clause_type" text NOT NULL,
	"rule_name" text NOT NULL,
	"description" text,
	"required_language" text,
	"prohibited_terms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"risk_threshold" real DEFAULT 0.5 NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbound_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"delivery_id" text,
	"action" text NOT NULL,
	"channel" text,
	"status" text,
	"metadata" jsonb,
	"org_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbound_channel_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"config_id" text NOT NULL,
	"org_id" text,
	"channel" text NOT NULL,
	"name" text NOT NULL,
	"enabled" text DEFAULT 'true' NOT NULL,
	"config" jsonb NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "outbound_channel_configs_config_id_unique" UNIQUE("config_id")
);
--> statement-breakpoint
CREATE TABLE "outbound_deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"delivery_id" text NOT NULL,
	"channel" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"source_domain" text NOT NULL,
	"source_event" text NOT NULL,
	"source_signal_id" text,
	"recipient" text,
	"payload" jsonb NOT NULL,
	"channel_config" jsonb,
	"provider_message_id" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"last_error" text,
	"next_retry_at" timestamp,
	"delivered_at" timestamp,
	"org_id" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "outbound_deliveries_delivery_id_unique" UNIQUE("delivery_id")
);
--> statement-breakpoint
CREATE TABLE "carlota_drip_engagement_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" text NOT NULL,
	"step_id" text NOT NULL,
	"event_type" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carlota_drip_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" text NOT NULL,
	"sequence_id" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_name" text,
	"contact_phone" text,
	"current_step_order" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"unsubscribe_token" text NOT NULL,
	"metadata" jsonb,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"last_sent_at" timestamp,
	"next_send_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "carlota_drip_enrollments_enrollment_id_unique" UNIQUE("enrollment_id"),
	CONSTRAINT "carlota_drip_enrollments_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
CREATE TABLE "carlota_drip_sequences" (
	"id" serial PRIMARY KEY NOT NULL,
	"sequence_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"practice_area" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_steps" integer DEFAULT 0 NOT NULL,
	"total_enrolled" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "carlota_drip_sequences_sequence_id_unique" UNIQUE("sequence_id")
);
--> statement-breakpoint
CREATE TABLE "carlota_drip_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"step_id" text NOT NULL,
	"sequence_id" text NOT NULL,
	"step_order" integer NOT NULL,
	"delay_days" integer DEFAULT 0 NOT NULL,
	"subject" text NOT NULL,
	"body_html" text NOT NULL,
	"body_text" text,
	"cta_url" text,
	"cta_label" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "carlota_drip_steps_step_id_unique" UNIQUE("step_id")
);
--> statement-breakpoint
CREATE TABLE "siem_export_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"connection_id" text NOT NULL,
	"name" text NOT NULL,
	"adapter_id" text NOT NULL,
	"config" jsonb NOT NULL,
	"enabled" text DEFAULT 'true' NOT NULL,
	"org_id" text,
	"last_export_at" timestamp,
	"total_exported" integer DEFAULT 0 NOT NULL,
	"total_failed" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "siem_export_connections_connection_id_unique" UNIQUE("connection_id")
);
--> statement-breakpoint
CREATE TABLE "siem_export_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"finding_id" text NOT NULL,
	"format" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"payload" jsonb,
	"error_message" text,
	"exported_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "siem_export_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "document_audit_trail" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"from_state" text,
	"to_state" text NOT NULL,
	"performed_by_id" integer,
	"performed_by_name" text,
	"role_used" text NOT NULL,
	"reason" text,
	"metadata" jsonb,
	"org_id" integer NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_lifecycle" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"org_id" integer NOT NULL,
	"title" text NOT NULL,
	"document_type" text NOT NULL,
	"lifecycle_state" text DEFAULT 'draft' NOT NULL,
	"domain" text DEFAULT 'counsel' NOT NULL,
	"matter_id" integer,
	"fund_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"signature_status" text DEFAULT 'none' NOT NULL,
	"jurisdiction_code" text,
	"frozen_metrics" jsonb,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "document_lifecycle_document_id_unique" UNIQUE("document_id")
);
--> statement-breakpoint
CREATE TABLE "lifecycle_workflow_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"domain" text NOT NULL,
	"document_type" text NOT NULL,
	"states" jsonb NOT NULL,
	"transitions" jsonb NOT NULL,
	"role_matrix" jsonb NOT NULL,
	"is_active" text DEFAULT 'true' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conduit_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"name" text NOT NULL,
	"destination" text NOT NULL,
	"status" "conduit_connection_status" DEFAULT 'untested' NOT NULL,
	"credential_meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tested_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conduit_sync_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sync_id" uuid NOT NULL,
	"source_field" text NOT NULL,
	"destination_field" text NOT NULL,
	"transform" "conduit_mapping_transform",
	"transform_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conduit_sync_run_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"row_index" integer NOT NULL,
	"source_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error_message" text,
	"retried" boolean DEFAULT false NOT NULL,
	"retried_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "conduit_sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sync_id" uuid NOT NULL,
	"status" "conduit_sync_run_status" DEFAULT 'running' NOT NULL,
	"rows_read" integer DEFAULT 0 NOT NULL,
	"rows_written" integer DEFAULT 0 NOT NULL,
	"rows_failed" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer,
	"error_message" text,
	"triggered_by" text DEFAULT 'manual' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "conduit_syncs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"name" text NOT NULL,
	"source_type" text DEFAULT 'postgres' NOT NULL,
	"source_meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"connection_id" uuid NOT NULL,
	"object_type" text NOT NULL,
	"run_mode" "conduit_sync_run_mode" DEFAULT 'manual' NOT NULL,
	"schedule_expr" text,
	"semantics" "conduit_sync_semantics" DEFAULT 'upsert' NOT NULL,
	"upsert_key" text,
	"status" "conduit_sync_status" DEFAULT 'draft' NOT NULL,
	"last_run_id" uuid,
	"last_run_at" timestamp with time zone,
	"last_run_status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conduit_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"source_type" text NOT NULL,
	"destination" text NOT NULL,
	"description" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"icon" text DEFAULT 'zap' NOT NULL,
	"mappings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_builtin" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_model_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" varchar(100) NOT NULL,
	"model" varchar(200) NOT NULL,
	"input_cost_per_1k_tokens" numeric(14, 8) DEFAULT '0' NOT NULL,
	"output_cost_per_1k_tokens" numeric(14, 8) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_tenant_budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" varchar(128) NOT NULL,
	"hourly_limit_usd" numeric(14, 4),
	"daily_limit_usd" numeric(14, 4),
	"monthly_limit_usd" numeric(14, 4),
	"alert_threshold_pct" numeric(6, 2) DEFAULT '80' NOT NULL,
	"hard_cap_enabled" boolean DEFAULT true NOT NULL,
	"last_alert_fired_at" timestamp,
	"alert_cooldown_minutes" integer DEFAULT 60 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_tenant_budgets_org_id_unique" UNIQUE("org_id")
);
--> statement-breakpoint
CREATE TABLE "ai_usage_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" varchar(128) NOT NULL,
	"org_id" varchar(128),
	"user_id" integer,
	"provider" varchar(100) NOT NULL,
	"model" varchar(200) NOT NULL,
	"surface" varchar(100) DEFAULT 'unknown' NOT NULL,
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"cost_usd" numeric(14, 8) DEFAULT '0' NOT NULL,
	"status" varchar(30) DEFAULT 'success' NOT NULL,
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eval_benchmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"benchmark_id" varchar(256) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"domain" varchar(128) NOT NULL,
	"evaluation_framework" varchar(64) NOT NULL,
	"tasks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"paper_url" text,
	"is_cross_cutting" boolean DEFAULT false NOT NULL,
	"source" varchar(32) DEFAULT 'tenant' NOT NULL,
	"org_id" integer,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eval_community_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"status" varchar(32) DEFAULT 'open' NOT NULL,
	"yaml_payload" jsonb NOT NULL,
	"pr_description" text,
	"github_pr_number" integer,
	"github_pr_url" text,
	"branch_name" varchar(256),
	"submitted_by" varchar(256) NOT NULL,
	"org_id" integer,
	"reviewed_by" varchar(256),
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"result_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eval_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"benchmark_id" varchar(256) NOT NULL,
	"benchmark_name" text,
	"task_id" varchar(256) NOT NULL,
	"entity_id" varchar(256) NOT NULL,
	"entity_label" text NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"domain" varchar(128) NOT NULL,
	"metric" varchar(128) NOT NULL,
	"value" text NOT NULL,
	"unit" varchar(32),
	"higher_is_better" boolean DEFAULT true NOT NULL,
	"numeric_value" numeric(20, 8),
	"evaluation_framework" varchar(64),
	"badge_state" varchar(32) DEFAULT 'community' NOT NULL,
	"verify_token" varchar(512),
	"eval_date" varchar(32),
	"source_url" text,
	"notes" text,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"raw_yaml" jsonb,
	"submitted_by" varchar(256),
	"org_id" integer,
	"submission_id" uuid,
	"verification_token_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eval_verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"result_id" uuid NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"verify_token" varchar(512) NOT NULL,
	"proof" text,
	"rerun_numeric_value" numeric(20, 8),
	"delta" numeric(20, 8),
	"verified_by" varchar(32),
	"notes" text,
	"rerun_report" jsonb,
	"expires_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aegis_soar_runs" ADD CONSTRAINT "aegis_soar_runs_playbook_id_aegis_soar_playbooks_id_fk" FOREIGN KEY ("playbook_id") REFERENCES "public"."aegis_soar_playbooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_actions" ADD CONSTRAINT "alloy_actions_workflow_id_alloy_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."alloy_workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_actions" ADD CONSTRAINT "alloy_actions_signal_id_alloy_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."alloy_signals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_actions" ADD CONSTRAINT "alloy_actions_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_actions" ADD CONSTRAINT "alloy_actions_owner_id_alloy_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."alloy_owners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_approvals" ADD CONSTRAINT "alloy_approvals_workflow_id_alloy_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."alloy_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_approvals" ADD CONSTRAINT "alloy_approvals_run_id_alloy_workflow_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."alloy_workflow_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_approvals" ADD CONSTRAINT "alloy_approvals_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_approvals" ADD CONSTRAINT "alloy_approvals_reviewer_user_id_users_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_artifacts" ADD CONSTRAINT "alloy_artifacts_workflow_id_alloy_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."alloy_workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_artifacts" ADD CONSTRAINT "alloy_artifacts_signal_id_alloy_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."alloy_signals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_artifacts" ADD CONSTRAINT "alloy_artifacts_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_artifacts" ADD CONSTRAINT "alloy_artifacts_owner_id_alloy_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."alloy_owners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_artifacts" ADD CONSTRAINT "alloy_artifacts_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_audit_log" ADD CONSTRAINT "alloy_audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_decisions" ADD CONSTRAINT "alloy_decisions_workflow_run_id_alloy_workflow_runs_id_fk" FOREIGN KEY ("workflow_run_id") REFERENCES "public"."alloy_workflow_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_signals" ADD CONSTRAINT "alloy_signals_owner_id_alloy_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."alloy_owners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_signals" ADD CONSTRAINT "alloy_signals_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_skill_runs" ADD CONSTRAINT "alloy_skill_runs_skill_id_alloy_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."alloy_skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_skill_runs" ADD CONSTRAINT "alloy_skill_runs_workflow_run_id_alloy_workflow_runs_id_fk" FOREIGN KEY ("workflow_run_id") REFERENCES "public"."alloy_workflow_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_workflow_runs" ADD CONSTRAINT "alloy_workflow_runs_workflow_id_alloy_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."alloy_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_workflow_runs" ADD CONSTRAINT "alloy_workflow_runs_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_workflow_runs" ADD CONSTRAINT "alloy_workflow_runs_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_workflows" ADD CONSTRAINT "alloy_workflows_trigger_signal_id_alloy_signals_id_fk" FOREIGN KEY ("trigger_signal_id") REFERENCES "public"."alloy_signals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_workflows" ADD CONSTRAINT "alloy_workflows_owner_id_alloy_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."alloy_owners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_workflows" ADD CONSTRAINT "alloy_workflows_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_workflows" ADD CONSTRAINT "alloy_workflows_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_meeting_action_items" ADD CONSTRAINT "alloy_meeting_action_items_meeting_id_alloy_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."alloy_meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_meeting_decisions" ADD CONSTRAINT "alloy_meeting_decisions_meeting_id_alloy_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."alloy_meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_approvals" ADD CONSTRAINT "platform_approvals_workflow_run_id_platform_workflow_runs_id_fk" FOREIGN KEY ("workflow_run_id") REFERENCES "public"."platform_workflow_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_approvals" ADD CONSTRAINT "platform_approvals_artifact_id_platform_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."platform_artifacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_approvals" ADD CONSTRAINT "platform_approvals_decision_by_users_id_fk" FOREIGN KEY ("decision_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_artifacts" ADD CONSTRAINT "platform_artifacts_workflow_run_id_platform_workflow_runs_id_fk" FOREIGN KEY ("workflow_run_id") REFERENCES "public"."platform_workflow_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_artifacts" ADD CONSTRAINT "platform_artifacts_workflow_id_platform_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."platform_workflows"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_artifacts" ADD CONSTRAINT "platform_artifacts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_artifacts" ADD CONSTRAINT "platform_artifacts_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_audit_log" ADD CONSTRAINT "platform_audit_log_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_audit_log" ADD CONSTRAINT "platform_audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_governance_incidents" ADD CONSTRAINT "platform_governance_incidents_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_governance_incidents" ADD CONSTRAINT "platform_governance_incidents_policy_id_platform_alloy_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."platform_alloy_policies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_governance_incidents" ADD CONSTRAINT "platform_governance_incidents_workflow_run_id_platform_workflow_runs_id_fk" FOREIGN KEY ("workflow_run_id") REFERENCES "public"."platform_workflow_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_governance_incidents" ADD CONSTRAINT "platform_governance_incidents_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_alloy_policies" ADD CONSTRAINT "platform_alloy_policies_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_alloy_policies" ADD CONSTRAINT "platform_alloy_policies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_signals" ADD CONSTRAINT "platform_signals_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_signals" ADD CONSTRAINT "platform_signals_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_usage_events" ADD CONSTRAINT "platform_usage_events_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_usage_events" ADD CONSTRAINT "platform_usage_events_workflow_run_id_platform_workflow_runs_id_fk" FOREIGN KEY ("workflow_run_id") REFERENCES "public"."platform_workflow_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_workflow_runs" ADD CONSTRAINT "platform_workflow_runs_workflow_id_platform_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."platform_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_workflow_runs" ADD CONSTRAINT "platform_workflow_runs_signal_id_platform_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."platform_signals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_workflow_runs" ADD CONSTRAINT "platform_workflow_runs_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_workflows" ADD CONSTRAINT "platform_workflows_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_workflows" ADD CONSTRAINT "platform_workflows_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_runtime_actions" ADD CONSTRAINT "alloy_runtime_actions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_runtime_actions" ADD CONSTRAINT "alloy_runtime_actions_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_runtime_agent_versions" ADD CONSTRAINT "alloy_runtime_agent_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_runtime_agents" ADD CONSTRAINT "alloy_runtime_agents_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_runtime_agents" ADD CONSTRAINT "alloy_runtime_agents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_runtime_prompt_versions" ADD CONSTRAINT "alloy_runtime_prompt_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_runtime_prompts" ADD CONSTRAINT "alloy_runtime_prompts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_runtime_prompts" ADD CONSTRAINT "alloy_runtime_prompts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_runtime_signal_sources" ADD CONSTRAINT "alloy_runtime_signal_sources_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_runtime_signals" ADD CONSTRAINT "alloy_runtime_signals_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_runtime_workflow_runs" ADD CONSTRAINT "alloy_runtime_workflow_runs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_runtime_workflow_runs" ADD CONSTRAINT "alloy_runtime_workflow_runs_initiated_by_users_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_runtime_workflow_runs" ADD CONSTRAINT "alloy_runtime_workflow_runs_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_runtime_workflows" ADD CONSTRAINT "alloy_runtime_workflows_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_runtime_workflows" ADD CONSTRAINT "alloy_runtime_workflows_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_cohort_definitions" ADD CONSTRAINT "analytics_cohort_definitions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_dashboards" ADD CONSTRAINT "analytics_dashboards_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_export_jobs" ADD CONSTRAINT "analytics_export_jobs_triggered_by_user_id_users_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_funnel_definitions" ADD CONSTRAINT "analytics_funnel_definitions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_metric_definitions" ADD CONSTRAINT "analytics_metric_definitions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_audit_trail" ADD CONSTRAINT "approval_audit_trail_approval_id_approval_requests_id_fk" FOREIGN KEY ("approval_id") REFERENCES "public"."approval_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_audit_trail" ADD CONSTRAINT "approval_audit_trail_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_audit_trail" ADD CONSTRAINT "approval_audit_trail_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_comments" ADD CONSTRAINT "approval_comments_approval_id_approval_requests_id_fk" FOREIGN KEY ("approval_id") REFERENCES "public"."approval_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_comments" ADD CONSTRAINT "approval_comments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_comments" ADD CONSTRAINT "approval_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_assigned_approver_id_users_id_fk" FOREIGN KEY ("assigned_approver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_rejected_by_id_users_id_fk" FOREIGN KEY ("rejected_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_escalated_to_id_users_id_fk" FOREIGN KEY ("escalated_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atlas_artifacts" ADD CONSTRAINT "atlas_artifacts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atlas_artifacts" ADD CONSTRAINT "atlas_artifacts_generated_by_user_id_users_id_fk" FOREIGN KEY ("generated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atlas_artifacts" ADD CONSTRAINT "atlas_artifacts_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atlas_artifacts" ADD CONSTRAINT "atlas_artifacts_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atlas_export_jobs" ADD CONSTRAINT "atlas_export_jobs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atlas_export_jobs" ADD CONSTRAINT "atlas_export_jobs_artifact_id_atlas_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."atlas_artifacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atlas_export_jobs" ADD CONSTRAINT "atlas_export_jobs_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_twins" ADD CONSTRAINT "digital_twins_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drift_assessments" ADD CONSTRAINT "drift_assessments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drift_assessments" ADD CONSTRAINT "drift_assessments_current_snapshot_id_spatial_twin_snapshots_id_fk" FOREIGN KEY ("current_snapshot_id") REFERENCES "public"."spatial_twin_snapshots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drift_assessments" ADD CONSTRAINT "drift_assessments_approved_snapshot_id_spatial_twin_snapshots_id_fk" FOREIGN KEY ("approved_snapshot_id") REFERENCES "public"."spatial_twin_snapshots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_branches" ADD CONSTRAINT "scenario_branches_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_branches" ADD CONSTRAINT "scenario_branches_baseline_snapshot_id_spatial_twin_snapshots_id_fk" FOREIGN KEY ("baseline_snapshot_id") REFERENCES "public"."spatial_twin_snapshots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_branches" ADD CONSTRAINT "scenario_branches_branch_snapshot_id_spatial_twin_snapshots_id_fk" FOREIGN KEY ("branch_snapshot_id") REFERENCES "public"."spatial_twin_snapshots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_branches" ADD CONSTRAINT "scenario_branches_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene_memory_index" ADD CONSTRAINT "scene_memory_index_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene_memory_index" ADD CONSTRAINT "scene_memory_index_snapshot_id_spatial_twin_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."spatial_twin_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spatial_twin_snapshots" ADD CONSTRAINT "spatial_twin_snapshots_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "twin_simulation_runs" ADD CONSTRAINT "twin_simulation_runs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "twin_simulation_runs" ADD CONSTRAINT "twin_simulation_runs_twin_id_digital_twins_id_fk" FOREIGN KEY ("twin_id") REFERENCES "public"."digital_twins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "twin_simulation_runs" ADD CONSTRAINT "twin_simulation_runs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worldline_signal_overlays" ADD CONSTRAINT "worldline_signal_overlays_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_chain_events" ADD CONSTRAINT "audit_chain_events_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_chain_events" ADD CONSTRAINT "audit_chain_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_biometric_bindings" ADD CONSTRAINT "device_biometric_bindings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magic_links" ADD CONSTRAINT "magic_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mfa_secrets" ADD CONSTRAINT "mfa_secrets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_replaced_by_session_id_sessions_id_fk" FOREIGN KEY ("replaced_by_session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_up_assertions" ADD CONSTRAINT "step_up_assertions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_up_assertions" ADD CONSTRAINT "step_up_assertions_binding_id_device_biometric_bindings_id_fk" FOREIGN KEY ("binding_id") REFERENCES "public"."device_biometric_bindings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "azure_tenants" ADD CONSTRAINT "azure_tenants_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_branding" ADD CONSTRAINT "tenant_branding_tenant_id_azure_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."azure_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_audit_log" ADD CONSTRAINT "billing_audit_log_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_payment_methods" ADD CONSTRAINT "billing_payment_methods_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_rail_accounts" ADD CONSTRAINT "billing_rail_accounts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_refund_requests" ADD CONSTRAINT "billing_refund_requests_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_tax_calculations" ADD CONSTRAINT "billing_tax_calculations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_webhook_events" ADD CONSTRAINT "billing_webhook_events_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlement_overrides" ADD CONSTRAINT "entitlement_overrides_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_plan_id_billing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."billing_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fulfillments" ADD CONSTRAINT "fulfillments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_credits" ADD CONSTRAINT "subscription_credits_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_credits" ADD CONSTRAINT "subscription_credits_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_credits" ADD CONSTRAINT "subscription_credits_source_refund_id_billing_refund_requests_id_fk" FOREIGN KEY ("source_refund_id") REFERENCES "public"."billing_refund_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_credits" ADD CONSTRAINT "subscription_credits_applied_to_invoice_id_invoices_id_fk" FOREIGN KEY ("applied_to_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_billing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."billing_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_category_overrides" ADD CONSTRAINT "tax_category_overrides_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_exemption_certificates" ADD CONSTRAINT "tax_exemption_certificates_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_ids" ADD CONSTRAINT "tax_ids_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "net30_aging_snapshots" ADD CONSTRAINT "net30_aging_snapshots_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "net30_credit_memos" ADD CONSTRAINT "net30_credit_memos_invoice_id_net30_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."net30_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "net30_credit_memos" ADD CONSTRAINT "net30_credit_memos_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "net30_dunning_config" ADD CONSTRAINT "net30_dunning_config_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "net30_dunning_log" ADD CONSTRAINT "net30_dunning_log_invoice_id_net30_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."net30_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "net30_dunning_log" ADD CONSTRAINT "net30_dunning_log_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "net30_invoice_line_items" ADD CONSTRAINT "net30_invoice_line_items_invoice_id_net30_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."net30_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "net30_invoice_payments" ADD CONSTRAINT "net30_invoice_payments_invoice_id_net30_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."net30_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "net30_invoices" ADD CONSTRAINT "net30_invoices_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_signal_id_platform_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."platform_signals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_signal_id_platform_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."platform_signals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_workflow_run_id_workflow_runs_id_fk" FOREIGN KEY ("workflow_run_id") REFERENCES "public"."workflow_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_log" ADD CONSTRAINT "event_log_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_log" ADD CONSTRAINT "event_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_items" ADD CONSTRAINT "readiness_items_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_items" ADD CONSTRAINT "readiness_items_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_signal_id_platform_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."platform_signals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diligence_checklist_items" ADD CONSTRAINT "diligence_checklist_items_checklist_id_diligence_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."diligence_checklists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diligence_checklist_items" ADD CONSTRAINT "diligence_checklist_items_artifact_id_capital_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."capital_artifacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_models" ADD CONSTRAINT "financial_models_artifact_id_capital_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."capital_artifacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_packet_deliverables" ADD CONSTRAINT "investor_packet_deliverables_packet_id_investor_packets_id_fk" FOREIGN KEY ("packet_id") REFERENCES "public"."investor_packets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_packet_deliverables" ADD CONSTRAINT "investor_packet_deliverables_artifact_id_capital_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."capital_artifacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lender_packet_deliverables" ADD CONSTRAINT "lender_packet_deliverables_packet_id_lender_packets_id_fk" FOREIGN KEY ("packet_id") REFERENCES "public"."lender_packets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lender_packet_deliverables" ADD CONSTRAINT "lender_packet_deliverables_artifact_id_capital_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."capital_artifacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_accounts" ADD CONSTRAINT "client_accounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_accounts" ADD CONSTRAINT "client_accounts_primary_contact_user_id_users_id_fk" FOREIGN KEY ("primary_contact_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_client_account_id_client_accounts_id_fk" FOREIGN KEY ("client_account_id") REFERENCES "public"."client_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_messages" ADD CONSTRAINT "client_messages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_messages" ADD CONSTRAINT "client_messages_client_account_id_client_accounts_id_fk" FOREIGN KEY ("client_account_id") REFERENCES "public"."client_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_messages" ADD CONSTRAINT "client_messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_updates" ADD CONSTRAINT "client_updates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_updates" ADD CONSTRAINT "client_updates_client_account_id_client_accounts_id_fk" FOREIGN KEY ("client_account_id") REFERENCES "public"."client_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_artifacts" ADD CONSTRAINT "application_artifacts_program_id_certification_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."certification_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_artifacts" ADD CONSTRAINT "application_artifacts_task_id_certification_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."certification_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certification_calendar" ADD CONSTRAINT "certification_calendar_program_id_certification_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."certification_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certification_programs" ADD CONSTRAINT "certification_programs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certification_requirements" ADD CONSTRAINT "certification_requirements_program_id_certification_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."certification_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certification_status" ADD CONSTRAINT "certification_status_program_id_certification_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."certification_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certification_tasks" ADD CONSTRAINT "certification_tasks_program_id_certification_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."certification_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certification_tasks" ADD CONSTRAINT "certification_tasks_requirement_id_certification_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."certification_requirements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_review_checkpoints" ADD CONSTRAINT "legal_review_checkpoints_program_id_certification_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."certification_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_review_checkpoints" ADD CONSTRAINT "legal_review_checkpoints_task_id_certification_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."certification_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_submission_replies" ADD CONSTRAINT "contact_submission_replies_contact_submission_id_contact_submissions_id_fk" FOREIGN KEY ("contact_submission_id") REFERENCES "public"."contact_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD CONSTRAINT "contact_submissions_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctas" ADD CONSTRAINT "ctas_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "features" ADD CONSTRAINT "features_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_status" ADD CONSTRAINT "lead_status_contact_submission_id_contact_submissions_id_fk" FOREIGN KEY ("contact_submission_id") REFERENCES "public"."contact_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "navigation_items" ADD CONSTRAINT "navigation_items_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_items" ADD CONSTRAINT "roadmap_items_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_email_log" ADD CONSTRAINT "support_email_log_contact_submission_id_contact_submissions_id_fk" FOREIGN KEY ("contact_submission_id") REFERENCES "public"."contact_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "updates" ADD CONSTRAINT "updates_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rollback_events" ADD CONSTRAINT "rollback_events_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_steps" ADD CONSTRAINT "plan_steps_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "self_model_snapshots" ADD CONSTRAINT "self_model_snapshots_self_model_id_self_models_id_fk" FOREIGN KEY ("self_model_id") REFERENCES "public"."self_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_archival" ADD CONSTRAINT "compliance_archival_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_calendar" ADD CONSTRAINT "compliance_calendar_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_risk_scores" ADD CONSTRAINT "compliance_risk_scores_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_suitability" ADD CONSTRAINT "compliance_suitability_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_supervision_queue" ADD CONSTRAINT "compliance_supervision_queue_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_logs" ADD CONSTRAINT "connector_logs_connector_id_connectors_id_fk" FOREIGN KEY ("connector_id") REFERENCES "public"."connectors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connectors" ADD CONSTRAINT "connectors_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cst_edge_evidence" ADD CONSTRAINT "cst_edge_evidence_edge_id_cst_edges_id_fk" FOREIGN KEY ("edge_id") REFERENCES "public"."cst_edges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cst_edges" ADD CONSTRAINT "cst_edges_from_node_id_cst_nodes_id_fk" FOREIGN KEY ("from_node_id") REFERENCES "public"."cst_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cst_edges" ADD CONSTRAINT "cst_edges_to_node_id_cst_nodes_id_fk" FOREIGN KEY ("to_node_id") REFERENCES "public"."cst_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cst_node_aliases" ADD CONSTRAINT "cst_node_aliases_node_id_cst_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."cst_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "constellation_saved_views" ADD CONSTRAINT "constellation_saved_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "constellation_saved_views" ADD CONSTRAINT "constellation_saved_views_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cortex_action_drafts" ADD CONSTRAINT "cortex_action_drafts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cortex_graph_snapshots" ADD CONSTRAINT "cortex_graph_snapshots_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_briefings" ADD CONSTRAINT "daily_briefings_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_retention_audit_log" ADD CONSTRAINT "data_retention_audit_log_policy_id_data_retention_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."data_retention_policies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_retention_audit_log" ADD CONSTRAINT "data_retention_audit_log_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_retention_audit_log" ADD CONSTRAINT "data_retention_audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_retention_policies" ADD CONSTRAINT "data_retention_policies_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_retention_policies" ADD CONSTRAINT "data_retention_policies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_retention_policies" ADD CONSTRAINT "data_retention_policies_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_fabric_correlation_links" ADD CONSTRAINT "decision_fabric_correlation_links_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_fabric_records" ADD CONSTRAINT "decision_fabric_records_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_fabric_records" ADD CONSTRAINT "decision_fabric_records_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_fabric_records" ADD CONSTRAINT "decision_fabric_records_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_fabric_records" ADD CONSTRAINT "decision_fabric_records_policy_version_id_decision_fabric_policy_versions_id_fk" FOREIGN KEY ("policy_version_id") REFERENCES "public"."decision_fabric_policy_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_fabric_records" ADD CONSTRAINT "decision_fabric_records_simulation_snapshot_id_decision_fabric_simulation_snapshots_id_fk" FOREIGN KEY ("simulation_snapshot_id") REFERENCES "public"."decision_fabric_simulation_snapshots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_fabric_simulation_snapshots" ADD CONSTRAINT "decision_fabric_simulation_snapshots_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_fabric_playbook_suggestions" ADD CONSTRAINT "decision_fabric_playbook_suggestions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_fabric_playbook_suggestions" ADD CONSTRAINT "decision_fabric_playbook_suggestions_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_fabric_policy_versions" ADD CONSTRAINT "decision_fabric_policy_versions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_fabric_policy_versions" ADD CONSTRAINT "decision_fabric_policy_versions_authored_by_user_id_users_id_fk" FOREIGN KEY ("authored_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dos_article_versions" ADD CONSTRAINT "dos_article_versions_article_id_dos_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."dos_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dos_articles" ADD CONSTRAINT "dos_articles_pillar_id_dos_editorial_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."dos_editorial_pillars"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dos_articles" ADD CONSTRAINT "dos_articles_author_id_dos_author_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."dos_author_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dos_articles" ADD CONSTRAINT "dos_articles_campaign_id_dos_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."dos_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dos_campaign_links" ADD CONSTRAINT "dos_campaign_links_campaign_id_dos_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."dos_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dos_carousel_projects" ADD CONSTRAINT "dos_carousel_projects_pillar_id_dos_editorial_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."dos_editorial_pillars"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dos_carousel_projects" ADD CONSTRAINT "dos_carousel_projects_article_id_dos_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."dos_articles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dos_carousel_projects" ADD CONSTRAINT "dos_carousel_projects_newsletter_id_dos_newsletters_id_fk" FOREIGN KEY ("newsletter_id") REFERENCES "public"."dos_newsletters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dos_carousel_projects" ADD CONSTRAINT "dos_carousel_projects_campaign_id_dos_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."dos_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dos_carousel_slides" ADD CONSTRAINT "dos_carousel_slides_project_id_dos_carousel_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."dos_carousel_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dos_content_calendar_items" ADD CONSTRAINT "dos_content_calendar_items_pillar_id_dos_editorial_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."dos_editorial_pillars"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dos_content_calendar_items" ADD CONSTRAINT "dos_content_calendar_items_campaign_id_dos_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."dos_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dos_content_lifecycle" ADD CONSTRAINT "dos_content_lifecycle_article_id_dos_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."dos_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dos_lead_notes" ADD CONSTRAINT "dos_lead_notes_lead_id_dos_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."dos_leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dos_monetization_rules" ADD CONSTRAINT "dos_monetization_rules_target_segment_id_dos_audience_segments_id_fk" FOREIGN KEY ("target_segment_id") REFERENCES "public"."dos_audience_segments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dos_newsletters" ADD CONSTRAINT "dos_newsletters_pillar_id_dos_editorial_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."dos_editorial_pillars"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dos_newsletters" ADD CONSTRAINT "dos_newsletters_author_id_dos_author_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."dos_author_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dos_newsletters" ADD CONSTRAINT "dos_newsletters_campaign_id_dos_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."dos_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dos_seo_keywords" ADD CONSTRAINT "dos_seo_keywords_linked_article_id_dos_articles_id_fk" FOREIGN KEY ("linked_article_id") REFERENCES "public"."dos_articles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dos_virality_scores" ADD CONSTRAINT "dos_virality_scores_article_id_dos_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."dos_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dos_x_posts" ADD CONSTRAINT "dos_x_posts_campaign_id_dos_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."dos_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_saved_by_id_users_id_fk" FOREIGN KEY ("saved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdf_batches" ADD CONSTRAINT "pdf_batches_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdf_jobs" ADD CONSTRAINT "pdf_jobs_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dreamscape_assets" ADD CONSTRAINT "dreamscape_assets_project_id_dreamscape_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."dreamscape_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dreamscape_campaign_assets" ADD CONSTRAINT "dreamscape_campaign_assets_campaign_id_dreamscape_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."dreamscape_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dreamscape_reviews" ADD CONSTRAINT "dreamscape_reviews_project_id_dreamscape_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."dreamscape_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dreamscape_reviews" ADD CONSTRAINT "dreamscape_reviews_campaign_id_dreamscape_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."dreamscape_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dreamscape_reviews" ADD CONSTRAINT "dreamscape_reviews_asset_id_dreamscape_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."dreamscape_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dreamscape_scripts" ADD CONSTRAINT "dreamscape_scripts_campaign_id_dreamscape_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."dreamscape_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dreamscape_storyboards" ADD CONSTRAINT "dreamscape_storyboards_campaign_id_dreamscape_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."dreamscape_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dreamscape_storyboards" ADD CONSTRAINT "dreamscape_storyboards_script_id_dreamscape_scripts_id_fk" FOREIGN KEY ("script_id") REFERENCES "public"."dreamscape_scripts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dreamscape_voice_assets" ADD CONSTRAINT "dreamscape_voice_assets_campaign_id_dreamscape_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."dreamscape_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_metadata" ADD CONSTRAINT "entity_metadata_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relationships" ADD CONSTRAINT "entity_relationships_from_entity_id_entities_id_fk" FOREIGN KEY ("from_entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relationships" ADD CONSTRAINT "entity_relationships_to_entity_id_entities_id_fk" FOREIGN KEY ("to_entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_tags" ADD CONSTRAINT "entity_tags_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_idp_registry" ADD CONSTRAINT "enterprise_idp_registry_tenant_id_azure_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."azure_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_enterprise_audit" ADD CONSTRAINT "mcp_enterprise_audit_tenant_id_azure_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."azure_tenants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_enterprise_audit" ADD CONSTRAINT "mcp_enterprise_audit_idp_id_enterprise_idp_registry_id_fk" FOREIGN KEY ("idp_id") REFERENCES "public"."enterprise_idp_registry"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_revoked_subjects" ADD CONSTRAINT "mcp_revoked_subjects_tenant_id_azure_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."azure_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_revoked_subjects" ADD CONSTRAINT "mcp_revoked_subjects_idp_id_enterprise_idp_registry_id_fk" FOREIGN KEY ("idp_id") REFERENCES "public"."enterprise_idp_registry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_triggered_by_user_id_users_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flag_overrides" ADD CONSTRAINT "feature_flag_overrides_flag_id_feature_flags_id_fk" FOREIGN KEY ("flag_id") REFERENCES "public"."feature_flags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_survey_prefs" ADD CONSTRAINT "feedback_survey_prefs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firestorm_alerts" ADD CONSTRAINT "firestorm_alerts_related_incident_id_firestorm_incidents_id_fk" FOREIGN KEY ("related_incident_id") REFERENCES "public"."firestorm_incidents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firestorm_analytics" ADD CONSTRAINT "firestorm_analytics_campaign_id_firestorm_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."firestorm_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firestorm_findings" ADD CONSTRAINT "firestorm_findings_assessment_id_firestorm_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."firestorm_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firestorm_findings" ADD CONSTRAINT "firestorm_findings_simulation_run_id_firestorm_simulation_runs_id_fk" FOREIGN KEY ("simulation_run_id") REFERENCES "public"."firestorm_simulation_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firestorm_leads" ADD CONSTRAINT "firestorm_leads_campaign_id_firestorm_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."firestorm_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firestorm_risk_scores" ADD CONSTRAINT "firestorm_risk_scores_assessment_id_firestorm_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."firestorm_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firestorm_simulation_runs" ADD CONSTRAINT "firestorm_simulation_runs_assessment_id_firestorm_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."firestorm_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firestorm_simulation_runs" ADD CONSTRAINT "firestorm_simulation_runs_scenario_id_firestorm_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."firestorm_scenarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_agent_tool_permissions" ADD CONSTRAINT "forge_agent_tool_permissions_agent_id_forge_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."forge_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_agent_tool_permissions" ADD CONSTRAINT "forge_agent_tool_permissions_tool_id_forge_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."forge_tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_agent_versions" ADD CONSTRAINT "forge_agent_versions_agent_id_forge_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."forge_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_agent_versions" ADD CONSTRAINT "forge_agent_versions_model_id_forge_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."forge_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_agent_versions" ADD CONSTRAINT "forge_agent_versions_prompt_version_id_forge_prompt_versions_id_fk" FOREIGN KEY ("prompt_version_id") REFERENCES "public"."forge_prompt_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_drift_events" ADD CONSTRAINT "forge_drift_events_agent_id_forge_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."forge_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_drift_events" ADD CONSTRAINT "forge_drift_events_env_id_forge_environment_profiles_id_fk" FOREIGN KEY ("env_id") REFERENCES "public"."forge_environment_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_environment_profiles" ADD CONSTRAINT "forge_environment_profiles_target_id_forge_deployment_targets_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."forge_deployment_targets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_environment_snapshots" ADD CONSTRAINT "forge_environment_snapshots_env_id_forge_environment_profiles_id_fk" FOREIGN KEY ("env_id") REFERENCES "public"."forge_environment_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_execution_artifacts" ADD CONSTRAINT "forge_execution_artifacts_execution_id_forge_execution_runs_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."forge_execution_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_execution_runs" ADD CONSTRAINT "forge_execution_runs_agent_id_forge_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."forge_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_execution_runs" ADD CONSTRAINT "forge_execution_runs_version_id_forge_agent_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."forge_agent_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_execution_runs" ADD CONSTRAINT "forge_execution_runs_model_id_forge_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."forge_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_execution_runs" ADD CONSTRAINT "forge_execution_runs_prompt_version_id_forge_prompt_versions_id_fk" FOREIGN KEY ("prompt_version_id") REFERENCES "public"."forge_prompt_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_model_versions" ADD CONSTRAINT "forge_model_versions_model_id_forge_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."forge_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_policy_assignments" ADD CONSTRAINT "forge_policy_assignments_policy_pack_id_forge_policy_packs_id_fk" FOREIGN KEY ("policy_pack_id") REFERENCES "public"."forge_policy_packs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_policy_assignments" ADD CONSTRAINT "forge_policy_assignments_agent_id_forge_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."forge_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_promotion_approvals" ADD CONSTRAINT "forge_promotion_approvals_promotion_id_forge_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."forge_promotions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_promotions" ADD CONSTRAINT "forge_promotions_agent_id_forge_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."forge_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_promotions" ADD CONSTRAINT "forge_promotions_from_version_id_forge_agent_versions_id_fk" FOREIGN KEY ("from_version_id") REFERENCES "public"."forge_agent_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_promotions" ADD CONSTRAINT "forge_promotions_to_version_id_forge_agent_versions_id_fk" FOREIGN KEY ("to_version_id") REFERENCES "public"."forge_agent_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_prompt_versions" ADD CONSTRAINT "forge_prompt_versions_prompt_id_forge_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."forge_prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_rollback_events" ADD CONSTRAINT "forge_rollback_events_agent_id_forge_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."forge_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_rollback_events" ADD CONSTRAINT "forge_rollback_events_from_version_id_forge_agent_versions_id_fk" FOREIGN KEY ("from_version_id") REFERENCES "public"."forge_agent_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge_rollback_events" ADD CONSTRAINT "forge_rollback_events_to_version_id_forge_agent_versions_id_fk" FOREIGN KEY ("to_version_id") REFERENCES "public"."forge_agent_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_cap_table_transactions" ADD CONSTRAINT "fund_cap_table_transactions_holder_id_fund_cap_table_holders_id_fk" FOREIGN KEY ("holder_id") REFERENCES "public"."fund_cap_table_holders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_cap_table_transactions" ADD CONSTRAINT "fund_cap_table_transactions_share_class_id_fund_share_classes_id_fk" FOREIGN KEY ("share_class_id") REFERENCES "public"."fund_share_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_capital_call_lines" ADD CONSTRAINT "fund_capital_call_lines_capital_call_id_fund_capital_calls_id_fk" FOREIGN KEY ("capital_call_id") REFERENCES "public"."fund_capital_calls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_capital_call_lines" ADD CONSTRAINT "fund_capital_call_lines_lp_id_fund_accredited_investors_id_fk" FOREIGN KEY ("lp_id") REFERENCES "public"."fund_accredited_investors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_distribution_lines" ADD CONSTRAINT "fund_distribution_lines_distribution_id_fund_distributions_id_fk" FOREIGN KEY ("distribution_id") REFERENCES "public"."fund_distributions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_distribution_lines" ADD CONSTRAINT "fund_distribution_lines_lp_id_fund_accredited_investors_id_fk" FOREIGN KEY ("lp_id") REFERENCES "public"."fund_accredited_investors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_lp_activity_events" ADD CONSTRAINT "fund_lp_activity_events_lp_id_fund_accredited_investors_id_fk" FOREIGN KEY ("lp_id") REFERENCES "public"."fund_accredited_investors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_lp_activity_events" ADD CONSTRAINT "fund_lp_activity_events_document_id_fund_lp_data_room_docs_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."fund_lp_data_room_docs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_lp_activity_events" ADD CONSTRAINT "fund_lp_activity_events_report_id_fund_lp_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."fund_lp_reports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_lp_capital_accounts" ADD CONSTRAINT "fund_lp_capital_accounts_lp_id_fund_accredited_investors_id_fk" FOREIGN KEY ("lp_id") REFERENCES "public"."fund_accredited_investors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_lp_messages" ADD CONSTRAINT "fund_lp_messages_lp_id_fund_accredited_investors_id_fk" FOREIGN KEY ("lp_id") REFERENCES "public"."fund_accredited_investors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_lp_uploads" ADD CONSTRAINT "fund_lp_uploads_lp_id_fund_accredited_investors_id_fk" FOREIGN KEY ("lp_id") REFERENCES "public"."fund_accredited_investors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_lp_uploads" ADD CONSTRAINT "fund_lp_uploads_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_lp_uploads" ADD CONSTRAINT "fund_lp_uploads_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_vesting_schedules" ADD CONSTRAINT "fund_vesting_schedules_holder_id_fund_cap_table_holders_id_fk" FOREIGN KEY ("holder_id") REFERENCES "public"."fund_cap_table_holders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_vesting_schedules" ADD CONSTRAINT "fund_vesting_schedules_share_class_id_fund_share_classes_id_fk" FOREIGN KEY ("share_class_id") REFERENCES "public"."fund_share_classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alloy_policies" ADD CONSTRAINT "alloy_policies_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_budgets" ADD CONSTRAINT "cost_budgets_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_events" ADD CONSTRAINT "cost_events_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_events" ADD CONSTRAINT "cost_events_budget_id_cost_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."cost_budgets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_incidents" ADD CONSTRAINT "governance_incidents_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_incidents" ADD CONSTRAINT "governance_incidents_policy_id_alloy_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."alloy_policies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_routing_policies" ADD CONSTRAINT "model_routing_policies_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_actions" ADD CONSTRAINT "guardian_actions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_approval_requests" ADD CONSTRAINT "guardian_approval_requests_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_policies" ADD CONSTRAINT "guardian_policies_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_policies" ADD CONSTRAINT "guardian_policies_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_policy_assignments" ADD CONSTRAINT "guardian_policy_assignments_policy_id_guardian_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."guardian_policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_policy_assignments" ADD CONSTRAINT "guardian_policy_assignments_granted_by_id_users_id_fk" FOREIGN KEY ("granted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_tiers" ADD CONSTRAINT "guardian_tiers_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_tiers" ADD CONSTRAINT "guardian_tiers_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardrail_configs" ADD CONSTRAINT "guardrail_configs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardrail_configs" ADD CONSTRAINT "guardrail_configs_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardrail_configs" ADD CONSTRAINT "guardrail_configs_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_mesh_action_approvals" ADD CONSTRAINT "tool_mesh_action_approvals_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_mesh_action_approvals" ADD CONSTRAINT "tool_mesh_action_approvals_policy_id_guardian_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."guardian_policies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_mesh_action_approvals" ADD CONSTRAINT "tool_mesh_action_approvals_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_mesh_action_approvals" ADD CONSTRAINT "tool_mesh_action_approvals_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_mesh_action_approvals" ADD CONSTRAINT "tool_mesh_action_approvals_rejected_by_id_users_id_fk" FOREIGN KEY ("rejected_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_mesh_tool_permissions" ADD CONSTRAINT "tool_mesh_tool_permissions_tool_db_id_tool_mesh_tools_id_fk" FOREIGN KEY ("tool_db_id") REFERENCES "public"."tool_mesh_tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_mesh_tool_permissions" ADD CONSTRAINT "tool_mesh_tool_permissions_granted_by_id_users_id_fk" FOREIGN KEY ("granted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_mesh_tool_versions" ADD CONSTRAINT "tool_mesh_tool_versions_tool_db_id_tool_mesh_tools_id_fk" FOREIGN KEY ("tool_db_id") REFERENCES "public"."tool_mesh_tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_mesh_tool_versions" ADD CONSTRAINT "tool_mesh_tool_versions_published_by_id_users_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holdings_metrics" ADD CONSTRAINT "holdings_metrics_venture_id_holdings_ventures_id_fk" FOREIGN KEY ("venture_id") REFERENCES "public"."holdings_ventures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holdings_milestones" ADD CONSTRAINT "holdings_milestones_venture_id_holdings_ventures_id_fk" FOREIGN KEY ("venture_id") REFERENCES "public"."holdings_ventures"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inca_datasets" ADD CONSTRAINT "inca_datasets_project_id_inca_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."inca_projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inca_experiments" ADD CONSTRAINT "inca_experiments_project_id_inca_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."inca_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inca_models" ADD CONSTRAINT "inca_models_project_id_inca_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."inca_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_signal_id_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."signals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inca_alerts" ADD CONSTRAINT "inca_alerts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inca_alerts" ADD CONSTRAINT "inca_alerts_finding_id_findings_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."findings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inca_reports" ADD CONSTRAINT "inca_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investigation_items" ADD CONSTRAINT "investigation_items_investigation_id_investigations_id_fk" FOREIGN KEY ("investigation_id") REFERENCES "public"."investigations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_invitations" ADD CONSTRAINT "org_invitations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_invitations" ADD CONSTRAINT "org_invitations_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_invitations" ADD CONSTRAINT "org_invitations_accepted_by_user_id_users_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kg_cross_domain_links" ADD CONSTRAINT "kg_cross_domain_links_relationship_id_kg_relationships_id_fk" FOREIGN KEY ("relationship_id") REFERENCES "public"."kg_relationships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kg_relationships" ADD CONSTRAINT "kg_relationships_from_entity_id_kg_entities_id_fk" FOREIGN KEY ("from_entity_id") REFERENCES "public"."kg_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kg_relationships" ADD CONSTRAINT "kg_relationships_to_entity_id_kg_entities_id_fk" FOREIGN KEY ("to_entity_id") REFERENCES "public"."kg_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyte_actions" ADD CONSTRAINT "lyte_actions_workspace_id_lyte_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."lyte_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyte_actions" ADD CONSTRAINT "lyte_actions_signal_id_lyte_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."lyte_signals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyte_alert_events" ADD CONSTRAINT "lyte_alert_events_alert_id_lyte_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."lyte_alerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyte_command_cards" ADD CONSTRAINT "lyte_command_cards_workspace_id_lyte_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."lyte_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyte_escalations" ADD CONSTRAINT "lyte_escalations_signal_id_lyte_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."lyte_signals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyte_escalations" ADD CONSTRAINT "lyte_escalations_alert_id_lyte_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."lyte_alerts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyte_incidents" ADD CONSTRAINT "lyte_incidents_workspace_id_lyte_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."lyte_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyte_playbooks" ADD CONSTRAINT "lyte_playbooks_workspace_id_lyte_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."lyte_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyte_priority_items" ADD CONSTRAINT "lyte_priority_items_workspace_id_lyte_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."lyte_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyte_readiness_items" ADD CONSTRAINT "lyte_readiness_items_workspace_id_lyte_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."lyte_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyte_recommendations" ADD CONSTRAINT "lyte_recommendations_workspace_id_lyte_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."lyte_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyte_recommendations" ADD CONSTRAINT "lyte_recommendations_signal_id_lyte_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."lyte_signals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyte_saved_views" ADD CONSTRAINT "lyte_saved_views_workspace_id_lyte_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."lyte_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyte_signals" ADD CONSTRAINT "lyte_signals_workspace_id_lyte_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."lyte_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyte_dashboards" ADD CONSTRAINT "lyte_dashboards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyte_signal_comments" ADD CONSTRAINT "lyte_signal_comments_signal_id_lyte_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."lyte_signals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyte_signal_comments" ADD CONSTRAINT "lyte_signal_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyte_signal_timeline" ADD CONSTRAINT "lyte_signal_timeline_signal_id_lyte_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."lyte_signals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyte_signal_timeline" ADD CONSTRAINT "lyte_signal_timeline_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marine_insurance_claims" ADD CONSTRAINT "marine_insurance_claims_policy_id_marine_insurance_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."marine_insurance_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marine_insurance_policies" ADD CONSTRAINT "marine_insurance_policies_quote_id_marine_insurance_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."marine_insurance_quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corridors" ADD CONSTRAINT "corridors_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corridors" ADD CONSTRAINT "corridors_origin_port_id_ports_id_fk" FOREIGN KEY ("origin_port_id") REFERENCES "public"."ports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corridors" ADD CONSTRAINT "corridors_destination_port_id_ports_id_fk" FOREIGN KEY ("destination_port_id") REFERENCES "public"."ports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maritime_exceptions" ADD CONSTRAINT "maritime_exceptions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maritime_exceptions" ADD CONSTRAINT "maritime_exceptions_voyage_id_voyages_id_fk" FOREIGN KEY ("voyage_id") REFERENCES "public"."voyages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maritime_exceptions" ADD CONSTRAINT "maritime_exceptions_vessel_id_maritime_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."maritime_vessels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maritime_exceptions" ADD CONSTRAINT "maritime_exceptions_signal_id_platform_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."platform_signals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maritime_exceptions" ADD CONSTRAINT "maritime_exceptions_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maritime_vessels" ADD CONSTRAINT "maritime_vessels_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maritime_vessels" ADD CONSTRAINT "maritime_vessels_current_port_id_ports_id_fk" FOREIGN KEY ("current_port_id") REFERENCES "public"."ports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maritime_vessels" ADD CONSTRAINT "maritime_vessels_destination_port_id_ports_id_fk" FOREIGN KEY ("destination_port_id") REFERENCES "public"."ports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ports" ADD CONSTRAINT "ports_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voyages" ADD CONSTRAINT "voyages_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voyages" ADD CONSTRAINT "voyages_vessel_id_maritime_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."maritime_vessels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voyages" ADD CONSTRAINT "voyages_origin_port_id_ports_id_fk" FOREIGN KEY ("origin_port_id") REFERENCES "public"."ports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voyages" ADD CONSTRAINT "voyages_destination_port_id_ports_id_fk" FOREIGN KEY ("destination_port_id") REFERENCES "public"."ports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voyages" ADD CONSTRAINT "voyages_corridor_id_corridors_id_fk" FOREIGN KEY ("corridor_id") REFERENCES "public"."corridors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_line_items" ADD CONSTRAINT "billing_line_items_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_line_items" ADD CONSTRAINT "billing_line_items_rate_card_id_rate_cards_id_fk" FOREIGN KEY ("rate_card_id") REFERENCES "public"."rate_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_meter_allotments" ADD CONSTRAINT "billing_meter_allotments_meter_id_billing_meters_id_fk" FOREIGN KEY ("meter_id") REFERENCES "public"."billing_meters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_allocations" ADD CONSTRAINT "cost_allocations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metering_corrections" ADD CONSTRAINT "metering_corrections_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metering_corrections" ADD CONSTRAINT "metering_corrections_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metering_events" ADD CONSTRAINT "metering_events_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metering_events" ADD CONSTRAINT "metering_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quota_configs" ADD CONSTRAINT "quota_configs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quota_violations" ADD CONSTRAINT "quota_violations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_card_assignments" ADD CONSTRAINT "rate_card_assignments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_card_assignments" ADD CONSTRAINT "rate_card_assignments_rate_card_id_rate_cards_id_fk" FOREIGN KEY ("rate_card_id") REFERENCES "public"."rate_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_card_tiers" ADD CONSTRAINT "rate_card_tiers_rate_card_id_rate_cards_id_fk" FOREIGN KEY ("rate_card_id") REFERENCES "public"."rate_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_aggregates" ADD CONSTRAINT "usage_aggregates_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_threshold_notifications" ADD CONSTRAINT "usage_threshold_notifications_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "msp_contracts" ADD CONSTRAINT "msp_contracts_client_id_msp_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."msp_clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "msp_devices" ADD CONSTRAINT "msp_devices_client_id_msp_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."msp_clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "msp_tickets" ADD CONSTRAINT "msp_tickets_client_id_msp_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."msp_clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "msp_tickets" ADD CONSTRAINT "msp_tickets_assignee_id_msp_technicians_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."msp_technicians"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "msp_healing_executions" ADD CONSTRAINT "msp_healing_executions_playbook_id_msp_healing_playbooks_id_fk" FOREIGN KEY ("playbook_id") REFERENCES "public"."msp_healing_playbooks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "msp_healing_executions" ADD CONSTRAINT "msp_healing_executions_device_id_msp_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."msp_devices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "msp_healing_executions" ADD CONSTRAINT "msp_healing_executions_client_id_msp_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."msp_clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "msp_healing_executions" ADD CONSTRAINT "msp_healing_executions_ticket_id_msp_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."msp_tickets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "msp_org_site_mappings" ADD CONSTRAINT "msp_org_site_mappings_connector_id_msp_rmm_connectors_id_fk" FOREIGN KEY ("connector_id") REFERENCES "public"."msp_rmm_connectors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "msp_org_site_mappings" ADD CONSTRAINT "msp_org_site_mappings_internal_client_id_msp_clients_id_fk" FOREIGN KEY ("internal_client_id") REFERENCES "public"."msp_clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "msp_psa_ticket_sync" ADD CONSTRAINT "msp_psa_ticket_sync_internal_ticket_id_msp_tickets_id_fk" FOREIGN KEY ("internal_ticket_id") REFERENCES "public"."msp_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "msp_psa_ticket_sync" ADD CONSTRAINT "msp_psa_ticket_sync_connector_id_msp_rmm_connectors_id_fk" FOREIGN KEY ("connector_id") REFERENCES "public"."msp_rmm_connectors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "msp_remote_actions" ADD CONSTRAINT "msp_remote_actions_device_id_msp_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."msp_devices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "msp_remote_actions" ADD CONSTRAINT "msp_remote_actions_connector_id_msp_rmm_connectors_id_fk" FOREIGN KEY ("connector_id") REFERENCES "public"."msp_rmm_connectors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "msp_rmm_device_metrics" ADD CONSTRAINT "msp_rmm_device_metrics_device_id_msp_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."msp_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "msp_rmm_device_metrics" ADD CONSTRAINT "msp_rmm_device_metrics_connector_id_msp_rmm_connectors_id_fk" FOREIGN KEY ("connector_id") REFERENCES "public"."msp_rmm_connectors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "command_session_comments" ADD CONSTRAINT "command_session_comments_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "command_sessions" ADD CONSTRAINT "command_sessions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "command_sessions" ADD CONSTRAINT "command_sessions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nexus_edges" ADD CONSTRAINT "nexus_edges_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nexus_entities" ADD CONSTRAINT "nexus_entities_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "on_call_handoff_notifications" ADD CONSTRAINT "on_call_handoff_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "on_call_schedules" ADD CONSTRAINT "on_call_schedules_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "on_call_shifts" ADD CONSTRAINT "on_call_shifts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "on_call_shifts" ADD CONSTRAINT "on_call_shifts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcome_graph_learning_jobs" ADD CONSTRAINT "outcome_graph_learning_jobs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcome_graph" ADD CONSTRAINT "outcome_graph_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcome_graph" ADD CONSTRAINT "outcome_graph_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capital_contributions" ADD CONSTRAINT "capital_contributions_scenario_id_ownership_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."ownership_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certification_readiness_records" ADD CONSTRAINT "certification_readiness_records_scenario_id_ownership_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."ownership_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_roles" ADD CONSTRAINT "control_roles_scenario_id_ownership_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."ownership_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_documents" ADD CONSTRAINT "governance_documents_scenario_id_ownership_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."ownership_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_review_flags" ADD CONSTRAINT "legal_review_flags_scenario_id_ownership_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."ownership_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_roles" ADD CONSTRAINT "manager_roles_scenario_id_ownership_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."ownership_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "officer_roles" ADD CONSTRAINT "officer_roles_scenario_id_ownership_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."ownership_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_allocations" ADD CONSTRAINT "ownership_allocations_scenario_id_ownership_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."ownership_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_decision_logs" ADD CONSTRAINT "ownership_decision_logs_scenario_id_ownership_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."ownership_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_authority_records" ADD CONSTRAINT "signature_authority_records_scenario_id_ownership_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."ownership_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_rights" ADD CONSTRAINT "voting_rights_scenario_id_ownership_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."ownership_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_branding" ADD CONSTRAINT "org_branding_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_branding" ADD CONSTRAINT "org_branding_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_custom_domains" ADD CONSTRAINT "org_custom_domains_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_custom_domains" ADD CONSTRAINT "org_custom_domains_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_accounts" ADD CONSTRAINT "partner_accounts_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_accounts" ADD CONSTRAINT "partner_accounts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_accounts" ADD CONSTRAINT "partner_accounts_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_org_assignments" ADD CONSTRAINT "partner_org_assignments_partner_id_partner_accounts_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partner_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_org_assignments" ADD CONSTRAINT "partner_org_assignments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_org_assignments" ADD CONSTRAINT "partner_org_assignments_provisioned_by_user_id_users_id_fk" FOREIGN KEY ("provisioned_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_users" ADD CONSTRAINT "partner_users_partner_id_partner_accounts_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partner_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_users" ADD CONSTRAINT "partner_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_users" ADD CONSTRAINT "partner_users_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_approvals" ADD CONSTRAINT "artifact_approvals_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_approvals" ADD CONSTRAINT "artifact_approvals_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_job_runs" ADD CONSTRAINT "platform_job_runs_triggered_by_user_id_users_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_alert_events" ADD CONSTRAINT "platform_alert_events_rule_id_platform_alert_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."platform_alert_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_incident_updates" ADD CONSTRAINT "platform_incident_updates_incident_id_platform_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."platform_incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_ai_recommendations" ADD CONSTRAINT "pc_ai_recommendations_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_approval_requests" ADD CONSTRAINT "pc_approval_requests_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_audit_events" ADD CONSTRAINT "pc_audit_events_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_audit_events" ADD CONSTRAINT "pc_audit_events_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_audit_events" ADD CONSTRAINT "pc_audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_claims" ADD CONSTRAINT "pc_claims_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_communications" ADD CONSTRAINT "pc_communications_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_connector_sync_runs" ADD CONSTRAINT "pc_connector_sync_runs_connector_account_id_pc_connector_accounts_id_fk" FOREIGN KEY ("connector_account_id") REFERENCES "public"."pc_connector_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_damages" ADD CONSTRAINT "pc_damages_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_deadlines" ADD CONSTRAINT "pc_deadlines_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_depositions" ADD CONSTRAINT "pc_depositions_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_discovery" ADD CONSTRAINT "pc_discovery_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_document_chunks" ADD CONSTRAINT "pc_document_chunks_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_exports" ADD CONSTRAINT "pc_exports_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_forecasts" ADD CONSTRAINT "pc_forecasts_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_inconsistency_flags" ADD CONSTRAINT "pc_inconsistency_flags_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_liens" ADD CONSTRAINT "pc_liens_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_matter_tags" ADD CONSTRAINT "pc_matter_tags_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_matters" ADD CONSTRAINT "pc_matters_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_matters" ADD CONSTRAINT "pc_matters_assigned_attorney_id_users_id_fk" FOREIGN KEY ("assigned_attorney_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_matters" ADD CONSTRAINT "pc_matters_assigned_paralegal_id_users_id_fk" FOREIGN KEY ("assigned_paralegal_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_matters" ADD CONSTRAINT "pc_matters_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_matters" ADD CONSTRAINT "pc_matters_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_medical_events" ADD CONSTRAINT "pc_medical_events_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_offers" ADD CONSTRAINT "pc_offers_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_offers" ADD CONSTRAINT "pc_offers_claim_id_pc_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."pc_claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_parties" ADD CONSTRAINT "pc_parties_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_privilege_flags" ADD CONSTRAINT "pc_privilege_flags_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_readiness_scores" ADD CONSTRAINT "pc_readiness_scores_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_tasks" ADD CONSTRAINT "pc_tasks_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_tasks" ADD CONSTRAINT "pc_tasks_playbook_id_pc_playbooks_id_fk" FOREIGN KEY ("playbook_id") REFERENCES "public"."pc_playbooks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_witnesses" ADD CONSTRAINT "pc_witnesses_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_gc_audit_entries" ADD CONSTRAINT "pc_gc_audit_entries_matter_id_pc_gc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_gc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_gc_obligations" ADD CONSTRAINT "pc_gc_obligations_matter_id_pc_gc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_gc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_gc_proof_chain_entries" ADD CONSTRAINT "pc_gc_proof_chain_entries_matter_id_pc_gc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_gc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_adjuster_profiles" ADD CONSTRAINT "pc_adjuster_profiles_insurer_profile_id_pc_insurer_profiles_id_fk" FOREIGN KEY ("insurer_profile_id") REFERENCES "public"."pc_insurer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_ai_review_packets" ADD CONSTRAINT "pc_ai_review_packets_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_appeals" ADD CONSTRAINT "pc_appeals_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_appeals" ADD CONSTRAINT "pc_appeals_denial_id_pc_denials_id_fk" FOREIGN KEY ("denial_id") REFERENCES "public"."pc_denials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_appeals" ADD CONSTRAINT "pc_appeals_no_fault_claim_id_pc_no_fault_claims_id_fk" FOREIGN KEY ("no_fault_claim_id") REFERENCES "public"."pc_no_fault_claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_clock_events" ADD CONSTRAINT "pc_clock_events_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_clock_events" ADD CONSTRAINT "pc_clock_events_clock_id_pc_matter_clocks_id_fk" FOREIGN KEY ("clock_id") REFERENCES "public"."pc_matter_clocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_communication_windows" ADD CONSTRAINT "pc_communication_windows_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_coverage_positions" ADD CONSTRAINT "pc_coverage_positions_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_defensibility_scores" ADD CONSTRAINT "pc_defensibility_scores_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_demand_packets" ADD CONSTRAINT "pc_demand_packets_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_demand_readiness_snapshots" ADD CONSTRAINT "pc_demand_readiness_snapshots_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_denials" ADD CONSTRAINT "pc_denials_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_denials" ADD CONSTRAINT "pc_denials_no_fault_claim_id_pc_no_fault_claims_id_fk" FOREIGN KEY ("no_fault_claim_id") REFERENCES "public"."pc_no_fault_claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_disclaimers" ADD CONSTRAINT "pc_disclaimers_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_external_appeals" ADD CONSTRAINT "pc_external_appeals_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_external_appeals" ADD CONSTRAINT "pc_external_appeals_appeal_id_pc_appeals_id_fk" FOREIGN KEY ("appeal_id") REFERENCES "public"."pc_appeals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_forecast_drivers" ADD CONSTRAINT "pc_forecast_drivers_forecast_run_id_pc_forecast_runs_id_fk" FOREIGN KEY ("forecast_run_id") REFERENCES "public"."pc_forecast_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_forecast_drivers" ADD CONSTRAINT "pc_forecast_drivers_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_forecast_explanations" ADD CONSTRAINT "pc_forecast_explanations_forecast_run_id_pc_forecast_runs_id_fk" FOREIGN KEY ("forecast_run_id") REFERENCES "public"."pc_forecast_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_forecast_explanations" ADD CONSTRAINT "pc_forecast_explanations_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_forecast_runs" ADD CONSTRAINT "pc_forecast_runs_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_matter_clocks" ADD CONSTRAINT "pc_matter_clocks_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_mediation_events" ADD CONSTRAINT "pc_mediation_events_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_medical_bill_cycles" ADD CONSTRAINT "pc_medical_bill_cycles_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_medical_bill_cycles" ADD CONSTRAINT "pc_medical_bill_cycles_no_fault_claim_id_pc_no_fault_claims_id_fk" FOREIGN KEY ("no_fault_claim_id") REFERENCES "public"."pc_no_fault_claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_no_fault_claims" ADD CONSTRAINT "pc_no_fault_claims_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_offer_movements" ADD CONSTRAINT "pc_offer_movements_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_part_profiles" ADD CONSTRAINT "pc_part_profiles_venue_id_pc_venue_profiles_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."pc_venue_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_reserve_movements" ADD CONSTRAINT "pc_reserve_movements_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_verification_requests" ADD CONSTRAINT "pc_verification_requests_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_verification_requests" ADD CONSTRAINT "pc_verification_requests_no_fault_claim_id_pc_no_fault_claims_id_fk" FOREIGN KEY ("no_fault_claim_id") REFERENCES "public"."pc_no_fault_claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_audit_packets" ADD CONSTRAINT "pc_audit_packets_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_contradiction_panel" ADD CONSTRAINT "pc_contradiction_panel_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_copilot_drafts" ADD CONSTRAINT "pc_copilot_drafts_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_graphql_audit_tags" ADD CONSTRAINT "pc_graphql_audit_tags_audit_log_id_pc_graphql_audit_logs_id_fk" FOREIGN KEY ("audit_log_id") REFERENCES "public"."pc_graphql_audit_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_m365_calendar_events" ADD CONSTRAINT "pc_m365_calendar_events_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_m365_sharepoint_files" ADD CONSTRAINT "pc_m365_sharepoint_files_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_m365_teams_messages" ADD CONSTRAINT "pc_m365_teams_messages_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_matter_twin_subpages" ADD CONSTRAINT "pc_matter_twin_subpages_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_operational_flow_runs" ADD CONSTRAINT "pc_operational_flow_runs_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_pressure_graph_dimensions" ADD CONSTRAINT "pc_pressure_graph_dimensions_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_pressure_watchlist" ADD CONSTRAINT "pc_pressure_watchlist_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_documents" ADD CONSTRAINT "pc_documents_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_emails" ADD CONSTRAINT "pc_emails_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_extraction_jobs" ADD CONSTRAINT "pc_extraction_jobs_document_id_pc_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."pc_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_source_items" ADD CONSTRAINT "pc_source_items_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_webhook_subscriptions" ADD CONSTRAINT "pc_webhook_subscriptions_connector_account_id_pc_connector_accounts_id_fk" FOREIGN KEY ("connector_account_id") REFERENCES "public"."pc_connector_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_carrier_offer_behavior" ADD CONSTRAINT "pc_carrier_offer_behavior_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_carrier_reserve_behavior" ADD CONSTRAINT "pc_carrier_reserve_behavior_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_carrier_response_events" ADD CONSTRAINT "pc_carrier_response_events_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_carrier_silence_windows" ADD CONSTRAINT "pc_carrier_silence_windows_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_insurer_pressure_drivers" ADD CONSTRAINT "pc_insurer_pressure_drivers_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_insurer_pressure_drivers" ADD CONSTRAINT "pc_insurer_pressure_drivers_snapshot_id_pc_insurer_pressure_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."pc_insurer_pressure_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_insurer_pressure_snapshots" ADD CONSTRAINT "pc_insurer_pressure_snapshots_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_movement_recommendations" ADD CONSTRAINT "pc_movement_recommendations_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_portfolio_matter_cohorts" ADD CONSTRAINT "pc_portfolio_matter_cohorts_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_quiet_risk_snapshots" ADD CONSTRAINT "pc_quiet_risk_snapshots_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_settlement_friction_drivers" ADD CONSTRAINT "pc_settlement_friction_drivers_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_settlement_friction_drivers" ADD CONSTRAINT "pc_settlement_friction_drivers_snapshot_id_pc_settlement_friction_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."pc_settlement_friction_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_settlement_friction_snapshots" ADD CONSTRAINT "pc_settlement_friction_snapshots_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_worldline_recovery_markers" ADD CONSTRAINT "pc_worldline_recovery_markers_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_worldline_signal_overlays" ADD CONSTRAINT "pc_worldline_signal_overlays_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_purview_case_links" ADD CONSTRAINT "pc_purview_case_links_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_purview_diagnostics" ADD CONSTRAINT "pc_purview_diagnostics_connector_account_id_pc_connector_accounts_id_fk" FOREIGN KEY ("connector_account_id") REFERENCES "public"."pc_connector_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_purview_export_handoffs" ADD CONSTRAINT "pc_purview_export_handoffs_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_purview_export_handoffs" ADD CONSTRAINT "pc_purview_export_handoffs_case_link_id_pc_purview_case_links_id_fk" FOREIGN KEY ("case_link_id") REFERENCES "public"."pc_purview_case_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_purview_hold_awareness" ADD CONSTRAINT "pc_purview_hold_awareness_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_purview_hold_awareness" ADD CONSTRAINT "pc_purview_hold_awareness_case_link_id_pc_purview_case_links_id_fk" FOREIGN KEY ("case_link_id") REFERENCES "public"."pc_purview_case_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_purview_scope_links" ADD CONSTRAINT "pc_purview_scope_links_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_purview_scope_links" ADD CONSTRAINT "pc_purview_scope_links_case_link_id_pc_purview_case_links_id_fk" FOREIGN KEY ("case_link_id") REFERENCES "public"."pc_purview_case_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_recovery_amount_markers" ADD CONSTRAINT "pc_recovery_amount_markers_recovery_item_id_pc_recovery_items_id_fk" FOREIGN KEY ("recovery_item_id") REFERENCES "public"."pc_recovery_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_recovery_dependency_links" ADD CONSTRAINT "pc_recovery_dependency_links_recovery_item_id_pc_recovery_items_id_fk" FOREIGN KEY ("recovery_item_id") REFERENCES "public"."pc_recovery_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_recovery_documents" ADD CONSTRAINT "pc_recovery_documents_recovery_item_id_pc_recovery_items_id_fk" FOREIGN KEY ("recovery_item_id") REFERENCES "public"."pc_recovery_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_recovery_followups" ADD CONSTRAINT "pc_recovery_followups_recovery_item_id_pc_recovery_items_id_fk" FOREIGN KEY ("recovery_item_id") REFERENCES "public"."pc_recovery_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_recovery_items" ADD CONSTRAINT "pc_recovery_items_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_recovery_parties" ADD CONSTRAINT "pc_recovery_parties_recovery_item_id_pc_recovery_items_id_fk" FOREIGN KEY ("recovery_item_id") REFERENCES "public"."pc_recovery_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_recovery_risk_snapshots" ADD CONSTRAINT "pc_recovery_risk_snapshots_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_recovery_status_history" ADD CONSTRAINT "pc_recovery_status_history_recovery_item_id_pc_recovery_items_id_fk" FOREIGN KEY ("recovery_item_id") REFERENCES "public"."pc_recovery_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_settlement_blocker_actions" ADD CONSTRAINT "pc_settlement_blocker_actions_blocker_id_pc_settlement_blockers_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."pc_settlement_blockers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_settlement_blocker_drivers" ADD CONSTRAINT "pc_settlement_blocker_drivers_blocker_id_pc_settlement_blockers_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."pc_settlement_blockers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_settlement_blocker_snapshots" ADD CONSTRAINT "pc_settlement_blocker_snapshots_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_settlement_blockers" ADD CONSTRAINT "pc_settlement_blockers_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_settlement_blockers" ADD CONSTRAINT "pc_settlement_blockers_recovery_item_id_pc_recovery_items_id_fk" FOREIGN KEY ("recovery_item_id") REFERENCES "public"."pc_recovery_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_managed_review_assignments" ADD CONSTRAINT "pc_managed_review_assignments_review_item_id_pc_managed_review_items_id_fk" FOREIGN KEY ("review_item_id") REFERENCES "public"."pc_managed_review_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_managed_review_items" ADD CONSTRAINT "pc_managed_review_items_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_managed_review_notes" ADD CONSTRAINT "pc_managed_review_notes_review_item_id_pc_managed_review_items_id_fk" FOREIGN KEY ("review_item_id") REFERENCES "public"."pc_managed_review_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_copilot_messages" ADD CONSTRAINT "pc_copilot_messages_session_id_pc_copilot_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."pc_copilot_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_copilot_messages" ADD CONSTRAINT "pc_copilot_messages_proof_chain_id_pc_proof_chain_entries_id_fk" FOREIGN KEY ("proof_chain_id") REFERENCES "public"."pc_proof_chain_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_copilot_sessions" ADD CONSTRAINT "pc_copilot_sessions_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_data_product_scores" ADD CONSTRAINT "pc_data_product_scores_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_forecast_diffs" ADD CONSTRAINT "pc_forecast_diffs_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_matter_twin_snapshots" ADD CONSTRAINT "pc_matter_twin_snapshots_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_model_requests" ADD CONSTRAINT "pc_model_requests_lane_id_pc_model_lanes_id_fk" FOREIGN KEY ("lane_id") REFERENCES "public"."pc_model_lanes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_pressure_scores" ADD CONSTRAINT "pc_pressure_scores_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_proof_chain_entries" ADD CONSTRAINT "pc_proof_chain_entries_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_worldline_features" ADD CONSTRAINT "pc_worldline_features_signal_id_pc_worldline_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."pc_worldline_signals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_worldline_features" ADD CONSTRAINT "pc_worldline_features_matter_id_pc_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."pc_matters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pc_worldline_signals" ADD CONSTRAINT "pc_worldline_signals_source_id_pc_worldline_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."pc_worldline_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_chain" ADD CONSTRAINT "proof_chain_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_chain" ADD CONSTRAINT "proof_chain_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_chain" ADD CONSTRAINT "proof_chain_generated_by_user_id_users_id_fk" FOREIGN KEY ("generated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_notification_history" ADD CONSTRAINT "push_notification_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_notification_preferences" ADD CONSTRAINT "push_notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_receipts" ADD CONSTRAINT "push_receipts_history_id_push_notification_history_id_fk" FOREIGN KEY ("history_id") REFERENCES "public"."push_notification_history"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_receipts" ADD CONSTRAINT "push_receipts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_notifications" ADD CONSTRAINT "scheduled_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_alerts" ADD CONSTRAINT "readiness_alerts_program_id_readiness_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."readiness_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_alerts" ADD CONSTRAINT "readiness_alerts_dimension_id_readiness_dimensions_id_fk" FOREIGN KEY ("dimension_id") REFERENCES "public"."readiness_dimensions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_dimensions" ADD CONSTRAINT "readiness_dimensions_program_id_readiness_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."readiness_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_milestones" ADD CONSTRAINT "readiness_milestones_program_id_readiness_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."readiness_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_risks" ADD CONSTRAINT "readiness_risks_program_id_readiness_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."readiness_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_risks" ADD CONSTRAINT "readiness_risks_dimension_id_readiness_dimensions_id_fk" FOREIGN KEY ("dimension_id") REFERENCES "public"."readiness_dimensions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_score_history" ADD CONSTRAINT "readiness_score_history_dimension_id_readiness_dimensions_id_fk" FOREIGN KEY ("dimension_id") REFERENCES "public"."readiness_dimensions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readiness_score_history" ADD CONSTRAINT "readiness_score_history_program_id_readiness_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."readiness_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_approvals" ADD CONSTRAINT "report_approvals_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_approvals" ADD CONSTRAINT "report_approvals_reviewer_user_id_users_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_distributions" ADD CONSTRAINT "report_distributions_distributed_by_user_id_users_id_fk" FOREIGN KEY ("distributed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_generations" ADD CONSTRAINT "report_generations_generated_by_user_id_users_id_fk" FOREIGN KEY ("generated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scim_group_members" ADD CONSTRAINT "scim_group_members_group_id_scim_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."scim_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scim_group_members" ADD CONSTRAINT "scim_group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scim_groups" ADD CONSTRAINT "scim_groups_tenant_id_azure_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."azure_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scim_provisioned_users" ADD CONSTRAINT "scim_provisioned_users_tenant_id_azure_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."azure_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scim_provisioned_users" ADD CONSTRAINT "scim_provisioned_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scim_sync_logs" ADD CONSTRAINT "scim_sync_logs_tenant_id_azure_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."azure_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scim_sync_logs" ADD CONSTRAINT "scim_sync_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scim_tokens" ADD CONSTRAINT "scim_tokens_tenant_id_azure_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."azure_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scim_tokens" ADD CONSTRAINT "scim_tokens_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sentra_alerts" ADD CONSTRAINT "sentra_alerts_linked_incident_id_sentra_incidents_id_fk" FOREIGN KEY ("linked_incident_id") REFERENCES "public"."sentra_incidents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings_audit_log" ADD CONSTRAINT "settings_audit_log_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings_audit_log" ADD CONSTRAINT "settings_audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings_audit_log" ADD CONSTRAINT "settings_audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_health_scorecards" ADD CONSTRAINT "tenant_health_scorecards_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulation_replay_state" ADD CONSTRAINT "simulation_replay_state_session_id_simulation_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."simulation_sessions"("session_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulation_results" ADD CONSTRAINT "simulation_results_session_id_simulation_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."simulation_sessions"("session_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulation_snapshots" ADD CONSTRAINT "simulation_snapshots_session_id_simulation_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."simulation_sessions"("session_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_ingested_events" ADD CONSTRAINT "stream_ingested_events_source_id_stream_data_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."stream_data_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_canned_responses" ADD CONSTRAINT "support_canned_responses_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_comments" ADD CONSTRAINT "support_ticket_comments_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_comments" ADD CONSTRAINT "support_ticket_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_actions" ADD CONSTRAINT "szl_actions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_actions" ADD CONSTRAINT "szl_actions_signal_id_szl_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."szl_signals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_actions" ADD CONSTRAINT "szl_actions_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_approvals" ADD CONSTRAINT "szl_approvals_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_approvals" ADD CONSTRAINT "szl_approvals_workflow_run_id_szl_workflow_runs_id_fk" FOREIGN KEY ("workflow_run_id") REFERENCES "public"."szl_workflow_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_approvals" ADD CONSTRAINT "szl_approvals_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_approvals" ADD CONSTRAINT "szl_approvals_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_artifacts" ADD CONSTRAINT "szl_artifacts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_artifacts" ADD CONSTRAINT "szl_artifacts_workflow_run_id_szl_workflow_runs_id_fk" FOREIGN KEY ("workflow_run_id") REFERENCES "public"."szl_workflow_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_artifacts" ADD CONSTRAINT "szl_artifacts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_comments" ADD CONSTRAINT "szl_comments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_comments" ADD CONSTRAINT "szl_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_event_log" ADD CONSTRAINT "szl_event_log_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_event_log" ADD CONSTRAINT "szl_event_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_exceptions" ADD CONSTRAINT "szl_exceptions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_products" ADD CONSTRAINT "szl_products_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_readiness_items" ADD CONSTRAINT "szl_readiness_items_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_readiness_items" ADD CONSTRAINT "szl_readiness_items_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_routes" ADD CONSTRAINT "szl_routes_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_routes" ADD CONSTRAINT "szl_routes_origin_port_id_szl_ports_id_fk" FOREIGN KEY ("origin_port_id") REFERENCES "public"."szl_ports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_routes" ADD CONSTRAINT "szl_routes_destination_port_id_szl_ports_id_fk" FOREIGN KEY ("destination_port_id") REFERENCES "public"."szl_ports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_signals" ADD CONSTRAINT "szl_signals_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_signals" ADD CONSTRAINT "szl_signals_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_vessels" ADD CONSTRAINT "szl_vessels_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_voyages" ADD CONSTRAINT "szl_voyages_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_voyages" ADD CONSTRAINT "szl_voyages_vessel_id_szl_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."szl_vessels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_voyages" ADD CONSTRAINT "szl_voyages_route_id_szl_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."szl_routes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_workflow_runs" ADD CONSTRAINT "szl_workflow_runs_workflow_id_szl_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."szl_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_workflow_runs" ADD CONSTRAINT "szl_workflow_runs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szl_workflows" ADD CONSTRAINT "szl_workflows_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_pages" ADD CONSTRAINT "team_pages_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_pages" ADD CONSTRAINT "team_pages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_agents" ADD CONSTRAINT "terra_agents_brokerage_id_terra_brokerages_id_fk" FOREIGN KEY ("brokerage_id") REFERENCES "public"."terra_brokerages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_construction_projects" ADD CONSTRAINT "terra_construction_projects_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_covenants" ADD CONSTRAINT "terra_covenants_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_deals" ADD CONSTRAINT "terra_deals_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_deals" ADD CONSTRAINT "terra_deals_distress_property_id_terra_distress_properties_id_fk" FOREIGN KEY ("distress_property_id") REFERENCES "public"."terra_distress_properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_deals" ADD CONSTRAINT "terra_deals_lead_id_terra_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."terra_leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_diligence_evidence" ADD CONSTRAINT "terra_diligence_evidence_matter_id_terra_diligence_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."terra_diligence_matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_diligence_evidence" ADD CONSTRAINT "terra_diligence_evidence_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_diligence_matters" ADD CONSTRAINT "terra_diligence_matters_property_id_terra_distress_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."terra_distress_properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_diligence_matters" ADD CONSTRAINT "terra_diligence_matters_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_distress_alerts" ADD CONSTRAINT "terra_distress_alerts_property_id_terra_distress_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."terra_distress_properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_inquiries" ADD CONSTRAINT "terra_inquiries_listing_id_terra_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."terra_listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_inquiries" ADD CONSTRAINT "terra_inquiries_assigned_agent_id_terra_agents_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."terra_agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_leads" ADD CONSTRAINT "terra_leads_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_leads" ADD CONSTRAINT "terra_leads_distress_property_id_terra_distress_properties_id_fk" FOREIGN KEY ("distress_property_id") REFERENCES "public"."terra_distress_properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_leads" ADD CONSTRAINT "terra_leads_linked_deal_id_terra_deals_id_fk" FOREIGN KEY ("linked_deal_id") REFERENCES "public"."terra_deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_listings" ADD CONSTRAINT "terra_listings_property_id_terra_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."terra_properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_listings" ADD CONSTRAINT "terra_listings_agent_id_terra_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."terra_agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_listings" ADD CONSTRAINT "terra_listings_brokerage_id_terra_brokerages_id_fk" FOREIGN KEY ("brokerage_id") REFERENCES "public"."terra_brokerages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_mls_listings" ADD CONSTRAINT "terra_mls_listings_distress_property_id_terra_distress_properties_id_fk" FOREIGN KEY ("distress_property_id") REFERENCES "public"."terra_distress_properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_saved_opportunities" ADD CONSTRAINT "terra_saved_opportunities_distress_property_id_terra_distress_properties_id_fk" FOREIGN KEY ("distress_property_id") REFERENCES "public"."terra_distress_properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_transactions" ADD CONSTRAINT "terra_transactions_listing_id_terra_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."terra_listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_transactions" ADD CONSTRAINT "terra_transactions_property_id_terra_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."terra_properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_transactions" ADD CONSTRAINT "terra_transactions_agent_id_terra_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."terra_agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_transactions" ADD CONSTRAINT "terra_transactions_brokerage_id_terra_brokerages_id_fk" FOREIGN KEY ("brokerage_id") REFERENCES "public"."terra_brokerages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terra_waterfall_structures" ADD CONSTRAINT "terra_waterfall_structures_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trace_entity_links" ADD CONSTRAINT "trace_entity_links_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels_alert_rules" ADD CONSTRAINT "vessels_alert_rules_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels_alerts" ADD CONSTRAINT "vessels_alerts_rule_id_vessels_alert_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."vessels_alert_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels_alerts" ADD CONSTRAINT "vessels_alerts_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels_cargo" ADD CONSTRAINT "vessels_cargo_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels_command_workflows" ADD CONSTRAINT "vessels_command_workflows_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels_command_workflows" ADD CONSTRAINT "vessels_command_workflows_event_id_vessels_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."vessels_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels_events" ADD CONSTRAINT "vessels_events_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels_fleets" ADD CONSTRAINT "vessels_fleets_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels_positions" ADD CONSTRAINT "vessels_positions_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels_routes" ADD CONSTRAINT "vessels_routes_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels_simulations" ADD CONSTRAINT "vessels_simulations_route_id_vessels_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."vessels_routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels_simulations" ADD CONSTRAINT "vessels_simulations_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels" ADD CONSTRAINT "vessels_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels" ADD CONSTRAINT "vessels_fleet_id_vessels_fleets_id_fk" FOREIGN KEY ("fleet_id") REFERENCES "public"."vessels_fleets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels_weather_snapshots" ADD CONSTRAINT "vessels_weather_snapshots_route_id_vessels_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."vessels_routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels_bol_chain_events" ADD CONSTRAINT "vessels_bol_chain_events_bol_id_vessels_bills_of_lading_id_fk" FOREIGN KEY ("bol_id") REFERENCES "public"."vessels_bills_of_lading"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_exceptions" ADD CONSTRAINT "fleet_exceptions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_exceptions" ADD CONSTRAINT "fleet_exceptions_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_exceptions" ADD CONSTRAINT "fleet_exceptions_voyage_id_voyages_id_fk" FOREIGN KEY ("voyage_id") REFERENCES "public"."voyages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_exceptions" ADD CONSTRAINT "fleet_exceptions_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_exceptions" ADD CONSTRAINT "fleet_exceptions_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessel_maintenance" ADD CONSTRAINT "vessel_maintenance_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessel_port_calls" ADD CONSTRAINT "vessel_port_calls_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessel_sanctions_screening" ADD CONSTRAINT "vessel_sanctions_screening_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessel_voyage_economics" ADD CONSTRAINT "vessel_voyage_economics_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleets" ADD CONSTRAINT "fleets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_vessel_asset_id_vessels_assets_id_fk" FOREIGN KEY ("vessel_asset_id") REFERENCES "public"."vessels_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessel_alerts" ADD CONSTRAINT "vessel_alerts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessel_alerts" ADD CONSTRAINT "vessel_alerts_vessel_asset_id_vessels_assets_id_fk" FOREIGN KEY ("vessel_asset_id") REFERENCES "public"."vessels_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessel_alerts" ADD CONSTRAINT "vessel_alerts_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessel_events" ADD CONSTRAINT "vessel_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessel_events" ADD CONSTRAINT "vessel_events_vessel_asset_id_vessels_assets_id_fk" FOREIGN KEY ("vessel_asset_id") REFERENCES "public"."vessels_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessel_reports" ADD CONSTRAINT "vessel_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels_assets" ADD CONSTRAINT "vessels_assets_fleet_id_fleets_id_fk" FOREIGN KEY ("fleet_id") REFERENCES "public"."fleets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels_assets" ADD CONSTRAINT "vessels_assets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels_psc_checklist_items" ADD CONSTRAINT "vessels_psc_checklist_items_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels_psc_checklist_items" ADD CONSTRAINT "vessels_psc_checklist_items_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels_psc_checklist_items" ADD CONSTRAINT "vessels_psc_checklist_items_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels_psc_inspections" ADD CONSTRAINT "vessels_psc_inspections_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels_psc_inspections" ADD CONSTRAINT "vessels_psc_inspections_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commodity_trading_fills" ADD CONSTRAINT "commodity_trading_fills_order_id_commodity_trading_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."commodity_trading_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commodity_trading_fills" ADD CONSTRAINT "commodity_trading_fills_instrument_id_commodity_trading_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."commodity_trading_instruments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commodity_trading_orders" ADD CONSTRAINT "commodity_trading_orders_instrument_id_commodity_trading_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."commodity_trading_instruments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commodity_trading_positions" ADD CONSTRAINT "commodity_trading_positions_instrument_id_commodity_trading_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."commodity_trading_instruments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "web_push_subscriptions" ADD CONSTRAINT "web_push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_connector_id_connectors_id_fk" FOREIGN KEY ("connector_id") REFERENCES "public"."connectors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worldline_fetch_logs" ADD CONSTRAINT "worldline_fetch_logs_source_id_worldline_source_registry_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."worldline_source_registry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worldline_fetch_logs" ADD CONSTRAINT "worldline_fetch_logs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worldline_signal_publications" ADD CONSTRAINT "worldline_signal_publications_source_id_worldline_source_registry_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."worldline_source_registry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worldline_signal_publications" ADD CONSTRAINT "worldline_signal_publications_fetch_log_id_worldline_fetch_logs_id_fk" FOREIGN KEY ("fetch_log_id") REFERENCES "public"."worldline_fetch_logs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worldline_signal_publications" ADD CONSTRAINT "worldline_signal_publications_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worldline_source_registry" ADD CONSTRAINT "worldline_source_registry_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worldline_source_registry" ADD CONSTRAINT "worldline_source_registry_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crisis_arena_engagements" ADD CONSTRAINT "crisis_arena_engagements_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crisis_arena_submissions" ADD CONSTRAINT "crisis_arena_submissions_engagement_id_crisis_arena_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."crisis_arena_engagements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "per_calibration_runs" ADD CONSTRAINT "per_calibration_runs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "per_candidate_policies" ADD CONSTRAINT "per_candidate_policies_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "per_candidate_policies" ADD CONSTRAINT "per_candidate_policies_registered_by_id_users_id_fk" FOREIGN KEY ("registered_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "per_evaluation_runs" ADD CONSTRAINT "per_evaluation_runs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "per_promotion_decisions" ADD CONSTRAINT "per_promotion_decisions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "per_promotion_decisions" ADD CONSTRAINT "per_promotion_decisions_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counsel_knowledge_chunks" ADD CONSTRAINT "counsel_knowledge_chunks_document_id_counsel_knowledge_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."counsel_knowledge_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_clients" ADD CONSTRAINT "oauth_clients_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "international_payment_methods" ADD CONSTRAINT "international_payment_methods_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "international_payments" ADD CONSTRAINT "international_payments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "international_payments" ADD CONSTRAINT "international_payments_payment_method_id_international_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."international_payment_methods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "esignature_events" ADD CONSTRAINT "esignature_events_request_id_esignature_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."esignature_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "esignature_requests" ADD CONSTRAINT "esignature_requests_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "esignature_requests" ADD CONSTRAINT "esignature_requests_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_installations" ADD CONSTRAINT "plugin_installations_plugin_id_plugins_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "public"."plugins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_installations" ADD CONSTRAINT "plugin_installations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_installations" ADD CONSTRAINT "plugin_installations_installed_by_id_users_id_fk" FOREIGN KEY ("installed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugins" ADD CONSTRAINT "plugins_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_dispute_audit" ADD CONSTRAINT "billing_dispute_audit_dispute_id_billing_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."billing_disputes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_dispute_audit" ADD CONSTRAINT "billing_dispute_audit_performed_by_id_users_id_fk" FOREIGN KEY ("performed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_disputes" ADD CONSTRAINT "billing_disputes_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_disputes" ADD CONSTRAINT "billing_disputes_responded_by_id_users_id_fk" FOREIGN KEY ("responded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury_accounts" ADD CONSTRAINT "treasury_accounts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury_balance_snapshots" ADD CONSTRAINT "treasury_balance_snapshots_account_id_treasury_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."treasury_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury_balance_snapshots" ADD CONSTRAINT "treasury_balance_snapshots_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury_transactions" ADD CONSTRAINT "treasury_transactions_account_id_treasury_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."treasury_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury_transactions" ADD CONSTRAINT "treasury_transactions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court_filing_events" ADD CONSTRAINT "court_filing_events_filing_id_court_filings_id_fk" FOREIGN KEY ("filing_id") REFERENCES "public"."court_filings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court_filing_events" ADD CONSTRAINT "court_filing_events_performed_by_id_users_id_fk" FOREIGN KEY ("performed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court_filings" ADD CONSTRAINT "court_filings_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court_filings" ADD CONSTRAINT "court_filings_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counsel_clauses" ADD CONSTRAINT "counsel_clauses_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counsel_draft_sessions" ADD CONSTRAINT "counsel_draft_sessions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counsel_playbook_rules" ADD CONSTRAINT "counsel_playbook_rules_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_audit_trail" ADD CONSTRAINT "document_audit_trail_performed_by_id_users_id_fk" FOREIGN KEY ("performed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_audit_trail" ADD CONSTRAINT "document_audit_trail_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_lifecycle" ADD CONSTRAINT "document_lifecycle_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_lifecycle" ADD CONSTRAINT "document_lifecycle_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lifecycle_workflow_config" ADD CONSTRAINT "lifecycle_workflow_config_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conduit_sync_mappings" ADD CONSTRAINT "conduit_sync_mappings_sync_id_conduit_syncs_id_fk" FOREIGN KEY ("sync_id") REFERENCES "public"."conduit_syncs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conduit_sync_run_rows" ADD CONSTRAINT "conduit_sync_run_rows_run_id_conduit_sync_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."conduit_sync_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conduit_sync_runs" ADD CONSTRAINT "conduit_sync_runs_sync_id_conduit_syncs_id_fk" FOREIGN KEY ("sync_id") REFERENCES "public"."conduit_syncs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conduit_syncs" ADD CONSTRAINT "conduit_syncs_connection_id_conduit_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."conduit_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "aegis_aq_status_idx" ON "aegis_action_queue_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "aegis_aq_priority_idx" ON "aegis_action_queue_items" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "aegis_honeypots_status_idx" ON "aegis_deception_honeypots" USING btree ("status");--> statement-breakpoint
CREATE INDEX "aegis_soar_pb_status_idx" ON "aegis_soar_playbooks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "aegis_soar_runs_pb_idx" ON "aegis_soar_runs" USING btree ("playbook_id");--> statement-breakpoint
CREATE INDEX "aegis_soar_runs_status_idx" ON "aegis_soar_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "aegis_twin_zone_idx" ON "aegis_twin_nodes" USING btree ("zone");--> statement-breakpoint
CREATE INDEX "aegis_twin_status_idx" ON "aegis_twin_nodes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_mesh_edges_agent_idx" ON "agent_mesh_edges" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_mesh_edges_mcp_idx" ON "agent_mesh_edges" USING btree ("mcp_server_id");--> statement-breakpoint
CREATE INDEX "agent_mesh_gateway_events_occurred_at_idx" ON "agent_mesh_gateway_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "agent_mesh_gateway_events_rule_idx" ON "agent_mesh_gateway_events" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "agent_mesh_gateway_events_decision_idx" ON "agent_mesh_gateway_events" USING btree ("decision");--> statement-breakpoint
CREATE INDEX "agent_mesh_resilience_index_computed_at_idx" ON "agent_mesh_resilience_index" USING btree ("computed_at");--> statement-breakpoint
CREATE INDEX "ai_review_queue_org_id_idx" ON "ai_review_queue" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "ai_review_queue_status_idx" ON "ai_review_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_review_queue_priority_idx" ON "ai_review_queue" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "ai_review_queue_domain_idx" ON "ai_review_queue" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "ai_review_queue_enqueued_at_idx" ON "ai_review_queue" USING btree ("enqueued_at");--> statement-breakpoint
CREATE INDEX "ai_review_queue_trace_id_idx" ON "ai_review_queue" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "ai_traces_org_id_idx" ON "ai_traces" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "ai_traces_domain_idx" ON "ai_traces" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "ai_traces_status_idx" ON "ai_traces" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_traces_requires_review_idx" ON "ai_traces" USING btree ("requires_review");--> statement-breakpoint
CREATE INDEX "ai_traces_captured_at_idx" ON "ai_traces" USING btree ("captured_at");--> statement-breakpoint
CREATE INDEX "ai_traces_org_domain_idx" ON "ai_traces" USING btree ("org_id","domain");--> statement-breakpoint
CREATE INDEX "alloy_actions_workflow_idx" ON "alloy_actions" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "alloy_actions_signal_idx" ON "alloy_actions" USING btree ("signal_id");--> statement-breakpoint
CREATE INDEX "alloy_actions_status_idx" ON "alloy_actions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "alloy_actions_type_idx" ON "alloy_actions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "alloy_actions_assigned_idx" ON "alloy_actions" USING btree ("assigned_user_id");--> statement-breakpoint
CREATE INDEX "alloy_approvals_workflow_idx" ON "alloy_approvals" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "alloy_approvals_status_idx" ON "alloy_approvals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "alloy_approvals_reviewer_idx" ON "alloy_approvals" USING btree ("reviewer_user_id");--> statement-breakpoint
CREATE INDEX "alloy_artifacts_workflow_idx" ON "alloy_artifacts" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "alloy_artifacts_signal_idx" ON "alloy_artifacts" USING btree ("signal_id");--> statement-breakpoint
CREATE INDEX "alloy_artifacts_type_idx" ON "alloy_artifacts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "alloy_artifacts_domain_idx" ON "alloy_artifacts" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "alloy_artifacts_owner_idx" ON "alloy_artifacts" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "alloy_artifacts_approval_idx" ON "alloy_artifacts" USING btree ("approval_state");--> statement-breakpoint
CREATE INDEX "alloy_audit_log_entity_idx" ON "alloy_audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "alloy_audit_log_actor_idx" ON "alloy_audit_log" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "alloy_audit_log_created_idx" ON "alloy_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "alloy_audit_log_action_idx" ON "alloy_audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "alloy_decisions_approval_status_idx" ON "alloy_decisions" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "alloy_decisions_agent_id_idx" ON "alloy_decisions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "alloy_decisions_created_idx" ON "alloy_decisions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "alloy_owners_domain_idx" ON "alloy_owners" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "alloy_owners_type_idx" ON "alloy_owners" USING btree ("type");--> statement-breakpoint
CREATE INDEX "alloy_signals_domain_idx" ON "alloy_signals" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "alloy_signals_severity_idx" ON "alloy_signals" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "alloy_signals_status_idx" ON "alloy_signals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "alloy_signals_source_type_idx" ON "alloy_signals" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "alloy_signals_owner_idx" ON "alloy_signals" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "alloy_signals_created_idx" ON "alloy_signals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "alloy_signals_dedupe_idx" ON "alloy_signals" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "alloy_skill_runs_skill_id_idx" ON "alloy_skill_runs" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "alloy_skill_runs_workflow_run_id_idx" ON "alloy_skill_runs" USING btree ("workflow_run_id");--> statement-breakpoint
CREATE INDEX "alloy_skill_runs_created_idx" ON "alloy_skill_runs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "alloy_skills_slug_version_idx" ON "alloy_skills" USING btree ("slug","version");--> statement-breakpoint
CREATE INDEX "alloy_skills_category_idx" ON "alloy_skills" USING btree ("category");--> statement-breakpoint
CREATE INDEX "alloy_skills_approval_class_idx" ON "alloy_skills" USING btree ("approval_class");--> statement-breakpoint
CREATE INDEX "alloy_skills_enabled_idx" ON "alloy_skills" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "alloy_workflow_runs_workflow_idx" ON "alloy_workflow_runs" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "alloy_workflow_runs_status_idx" ON "alloy_workflow_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "alloy_workflow_runs_started_idx" ON "alloy_workflow_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "alloy_workflows_domain_idx" ON "alloy_workflows" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "alloy_workflows_status_idx" ON "alloy_workflows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "alloy_workflows_type_idx" ON "alloy_workflows" USING btree ("type");--> statement-breakpoint
CREATE INDEX "alloy_workflows_owner_idx" ON "alloy_workflows" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "alloy_workflows_priority_idx" ON "alloy_workflows" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "alloy_workflows_created_idx" ON "alloy_workflows" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "alloy_autonomy_modes_tenant_domain_uniq" ON "alloy_autonomy_modes" USING btree ("tenant_org_id","domain") WHERE tenant_org_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "alloy_autonomy_modes_global_domain_uniq" ON "alloy_autonomy_modes" USING btree ("domain") WHERE tenant_org_id IS NULL;--> statement-breakpoint
CREATE INDEX "alloy_autonomy_modes_tenant_idx" ON "alloy_autonomy_modes" USING btree ("tenant_org_id");--> statement-breakpoint
CREATE INDEX "platform_approvals_run_idx" ON "platform_approvals" USING btree ("workflow_run_id");--> statement-breakpoint
CREATE INDEX "platform_approvals_status_idx" ON "platform_approvals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "platform_artifacts_run_idx" ON "platform_artifacts" USING btree ("workflow_run_id");--> statement-breakpoint
CREATE INDEX "platform_artifacts_org_idx" ON "platform_artifacts" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "platform_artifacts_status_idx" ON "platform_artifacts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "platform_audit_org_idx" ON "platform_audit_log" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "platform_audit_action_idx" ON "platform_audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "platform_audit_created_idx" ON "platform_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "platform_audit_correlation_idx" ON "platform_audit_log" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "platform_audit_service_idx" ON "platform_audit_log" USING btree ("service_attribution");--> statement-breakpoint
CREATE INDEX "platform_incidents_org_idx" ON "platform_governance_incidents" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "platform_incidents_policy_idx" ON "platform_governance_incidents" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "platform_incidents_severity_idx" ON "platform_governance_incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "platform_incidents_created_idx" ON "platform_governance_incidents" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "platform_policies_org_idx" ON "platform_alloy_policies" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "platform_policies_kind_idx" ON "platform_alloy_policies" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "platform_policies_status_idx" ON "platform_alloy_policies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "signals_org_idx" ON "platform_signals" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "signals_status_idx" ON "platform_signals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "signals_severity_idx" ON "platform_signals" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "signals_received_idx" ON "platform_signals" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "platform_usage_org_idx" ON "platform_usage_events" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "platform_usage_event_type_idx" ON "platform_usage_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "platform_usage_created_idx" ON "platform_usage_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "platform_runs_workflow_idx" ON "platform_workflow_runs" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "platform_runs_state_idx" ON "platform_workflow_runs" USING btree ("state");--> statement-breakpoint
CREATE INDEX "platform_runs_queued_idx" ON "platform_workflow_runs" USING btree ("queued_at");--> statement-breakpoint
CREATE INDEX "platform_workflows_org_idx" ON "platform_workflows" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "platform_workflows_active_idx" ON "platform_workflows" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "alloy_policy_test_cases_studio_idx" ON "alloy_policy_test_cases" USING btree ("studio_id");--> statement-breakpoint
CREATE INDEX "alloy_policy_versions_studio_idx" ON "alloy_policy_versions" USING btree ("studio_id","version_number");--> statement-breakpoint
CREATE INDEX "alloy_policy_versions_saved_idx" ON "alloy_policy_versions" USING btree ("saved_at");--> statement-breakpoint
CREATE UNIQUE INDEX "alloy_run_failure_notifications_dedup" ON "alloy_run_failure_notifications" USING btree ("run_id","user_id","kind");--> statement-breakpoint
CREATE INDEX "alloy_action_run_idx" ON "alloy_runtime_actions" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "alloy_action_type_idx" ON "alloy_runtime_actions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "alloy_action_org_idx" ON "alloy_runtime_actions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "alloy_action_actor_idx" ON "alloy_runtime_actions" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "alloy_action_domain_idx" ON "alloy_runtime_actions" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "alloy_action_executed_idx" ON "alloy_runtime_actions" USING btree ("executed_at");--> statement-breakpoint
CREATE INDEX "alloy_agent_ver_agent_idx" ON "alloy_runtime_agent_versions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "alloy_agent_ver_deployed_idx" ON "alloy_runtime_agent_versions" USING btree ("is_deployed");--> statement-breakpoint
CREATE INDEX "alloy_agent_org_idx" ON "alloy_runtime_agents" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "alloy_agent_domain_idx" ON "alloy_runtime_agents" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "alloy_agent_active_idx" ON "alloy_runtime_agents" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "alloy_model_route_tier_idx" ON "alloy_runtime_model_routes" USING btree ("match_tier");--> statement-breakpoint
CREATE INDEX "alloy_model_route_domain_idx" ON "alloy_runtime_model_routes" USING btree ("match_domain");--> statement-breakpoint
CREATE INDEX "alloy_model_route_priority_idx" ON "alloy_runtime_model_routes" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "alloy_model_route_active_idx" ON "alloy_runtime_model_routes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "alloy_model_ver_model_idx" ON "alloy_runtime_model_versions" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "alloy_model_ver_deployed_idx" ON "alloy_runtime_model_versions" USING btree ("is_deployed");--> statement-breakpoint
CREATE INDEX "alloy_model_provider_idx" ON "alloy_runtime_models" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "alloy_model_active_idx" ON "alloy_runtime_models" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "alloy_prompt_ver_prompt_idx" ON "alloy_runtime_prompt_versions" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "alloy_prompt_ver_deployed_idx" ON "alloy_runtime_prompt_versions" USING btree ("is_deployed");--> statement-breakpoint
CREATE INDEX "alloy_prompt_org_idx" ON "alloy_runtime_prompts" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "alloy_prompt_domain_idx" ON "alloy_runtime_prompts" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "alloy_prompt_active_idx" ON "alloy_runtime_prompts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "alloy_sig_score_signal_idx" ON "alloy_runtime_signal_scores" USING btree ("signal_id");--> statement-breakpoint
CREATE INDEX "alloy_sig_score_scored_idx" ON "alloy_runtime_signal_scores" USING btree ("scored_at");--> statement-breakpoint
CREATE INDEX "alloy_sig_source_org_idx" ON "alloy_runtime_signal_sources" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "alloy_sig_source_type_idx" ON "alloy_runtime_signal_sources" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "alloy_sig_source_active_idx" ON "alloy_runtime_signal_sources" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "alloy_signal_org_idx" ON "alloy_runtime_signals" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "alloy_signal_domain_idx" ON "alloy_runtime_signals" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "alloy_signal_severity_idx" ON "alloy_runtime_signals" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "alloy_signal_status_idx" ON "alloy_runtime_signals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "alloy_signal_entity_idx" ON "alloy_runtime_signals" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "alloy_signal_received_idx" ON "alloy_runtime_signals" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "alloy_run_workflow_idx" ON "alloy_runtime_workflow_runs" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "alloy_run_status_idx" ON "alloy_runtime_workflow_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "alloy_run_org_idx" ON "alloy_runtime_workflow_runs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "alloy_run_initiated_idx" ON "alloy_runtime_workflow_runs" USING btree ("initiated_by");--> statement-breakpoint
CREATE INDEX "alloy_run_approval_idx" ON "alloy_runtime_workflow_runs" USING btree ("approval_state");--> statement-breakpoint
CREATE INDEX "alloy_run_created_idx" ON "alloy_runtime_workflow_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "alloy_wf_step_wf_idx" ON "alloy_runtime_workflow_steps" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "alloy_wf_step_order_idx" ON "alloy_runtime_workflow_steps" USING btree ("workflow_id","step_order");--> statement-breakpoint
CREATE INDEX "alloy_wf_org_idx" ON "alloy_runtime_workflows" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "alloy_wf_domain_idx" ON "alloy_runtime_workflows" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "alloy_wf_mode_idx" ON "alloy_runtime_workflows" USING btree ("execution_mode");--> statement-breakpoint
CREATE INDEX "alloy_wf_active_idx" ON "alloy_runtime_workflows" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "alloy_wf_created_idx" ON "alloy_runtime_workflows" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "inf_log_model_idx" ON "inference_log" USING btree ("model");--> statement-breakpoint
CREATE INDEX "inf_log_agent_idx" ON "inference_log" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "inf_log_actor_idx" ON "inference_log" USING btree ("actor");--> statement-breakpoint
CREATE INDEX "inf_log_created_idx" ON "inference_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "analytics_anomaly_metric_idx" ON "analytics_anomalies" USING btree ("metric_id");--> statement-breakpoint
CREATE INDEX "analytics_anomaly_domain_idx" ON "analytics_anomalies" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "analytics_anomaly_detected_idx" ON "analytics_anomalies" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "analytics_anomaly_severity_idx" ON "analytics_anomalies" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "analytics_outcome_journey_idx" ON "analytics_attribution_outcomes" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "analytics_outcome_entity_idx" ON "analytics_attribution_outcomes" USING btree ("entity_id","entity_type");--> statement-breakpoint
CREATE INDEX "analytics_outcome_domain_idx" ON "analytics_attribution_outcomes" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "analytics_touch_journey_idx" ON "analytics_attribution_touchpoints" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "analytics_touch_entity_idx" ON "analytics_attribution_touchpoints" USING btree ("entity_id","entity_type");--> statement-breakpoint
CREATE INDEX "analytics_touch_domain_idx" ON "analytics_attribution_touchpoints" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "analytics_cohort_def_domain_idx" ON "analytics_cohort_definitions" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "analytics_dashboard_domain_idx" ON "analytics_dashboards" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "ae_cold_event_name_idx" ON "analytics_events_cold" USING btree ("event_name");--> statement-breakpoint
CREATE INDEX "ae_cold_domain_idx" ON "analytics_events_cold" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "ae_cold_user_idx" ON "analytics_events_cold" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ae_cold_org_idx" ON "analytics_events_cold" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ae_cold_occurred_idx" ON "analytics_events_cold" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "ae_cold_archived_idx" ON "analytics_events_cold" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "analytics_events_name_idx" ON "analytics_events" USING btree ("event_name");--> statement-breakpoint
CREATE INDEX "analytics_events_domain_idx" ON "analytics_events" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "analytics_events_source_idx" ON "analytics_events" USING btree ("source_app");--> statement-breakpoint
CREATE INDEX "analytics_events_user_idx" ON "analytics_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "analytics_events_org_idx" ON "analytics_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "analytics_events_tenant_idx" ON "analytics_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "analytics_events_occurred_idx" ON "analytics_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_events_session_idx" ON "analytics_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "analytics_events_domain_class_ts_idx" ON "analytics_events" USING btree ("domain","event_name","occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_export_domain_idx" ON "analytics_export_jobs" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "analytics_export_status_idx" ON "analytics_export_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "analytics_funnel_def_domain_idx" ON "analytics_funnel_definitions" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "analytics_metric_def_domain_idx" ON "analytics_metric_definitions" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "analytics_snap_metric_idx" ON "analytics_metric_snapshots" USING btree ("metric_id");--> statement-breakpoint
CREATE INDEX "analytics_snap_period_idx" ON "analytics_metric_snapshots" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "analytics_snap_domain_idx" ON "analytics_metric_snapshots" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "analytics_snap_gran_idx" ON "analytics_metric_snapshots" USING btree ("granularity");--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_snap_unique_idx" ON "analytics_metric_snapshots" USING btree ("metric_id","granularity","period_start");--> statement-breakpoint
CREATE INDEX "api_keys_user_id_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_keys_org_id_idx" ON "api_keys" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "approval_audit_approval_idx" ON "approval_audit_trail" USING btree ("approval_id");--> statement-breakpoint
CREATE INDEX "approval_audit_actor_idx" ON "approval_audit_trail" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "approval_audit_action_idx" ON "approval_audit_trail" USING btree ("action");--> statement-breakpoint
CREATE INDEX "approval_audit_created_idx" ON "approval_audit_trail" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "approval_comments_approval_idx" ON "approval_comments" USING btree ("approval_id");--> statement-breakpoint
CREATE INDEX "approval_comments_author_idx" ON "approval_comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "approval_requests_org_idx" ON "approval_requests" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "approval_requests_resource_idx" ON "approval_requests" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "approval_requests_status_idx" ON "approval_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "approval_requests_requested_by_idx" ON "approval_requests" USING btree ("requested_by_id");--> statement-breakpoint
CREATE INDEX "approval_requests_approver_idx" ON "approval_requests" USING btree ("assigned_approver_id");--> statement-breakpoint
CREATE INDEX "approval_requests_correlation_idx" ON "approval_requests" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "approval_requests_created_idx" ON "approval_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "atlas_artifacts_org_idx" ON "atlas_artifacts" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "atlas_artifacts_template_idx" ON "atlas_artifacts" USING btree ("template_type");--> statement-breakpoint
CREATE INDEX "atlas_artifacts_domain_idx" ON "atlas_artifacts" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "atlas_artifacts_entity_idx" ON "atlas_artifacts" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "atlas_artifacts_status_idx" ON "atlas_artifacts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "atlas_artifacts_slug_idx" ON "atlas_artifacts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "atlas_artifacts_share_token_idx" ON "atlas_artifacts" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "atlas_artifacts_created_idx" ON "atlas_artifacts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "atlas_export_artifact_idx" ON "atlas_export_jobs" USING btree ("artifact_id");--> statement-breakpoint
CREATE INDEX "atlas_export_status_idx" ON "atlas_export_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "atlas_export_org_idx" ON "atlas_export_jobs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "digital_twins_entity_idx" ON "digital_twins" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "digital_twins_type_idx" ON "digital_twins" USING btree ("twin_type");--> statement-breakpoint
CREATE INDEX "digital_twins_org_idx" ON "digital_twins" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "digital_twins_status_idx" ON "digital_twins" USING btree ("status");--> statement-breakpoint
CREATE INDEX "digital_twins_synced_idx" ON "digital_twins" USING btree ("last_synced_at");--> statement-breakpoint
CREATE INDEX "drift_assessments_twin_idx" ON "drift_assessments" USING btree ("twin_id");--> statement-breakpoint
CREATE INDEX "drift_assessments_entity_idx" ON "drift_assessments" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "drift_assessments_org_idx" ON "drift_assessments" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "drift_assessments_status_idx" ON "drift_assessments" USING btree ("drift_status");--> statement-breakpoint
CREATE INDEX "drift_assessments_assessed_idx" ON "drift_assessments" USING btree ("assessed_at");--> statement-breakpoint
CREATE INDEX "scenario_branches_twin_idx" ON "scenario_branches" USING btree ("twin_id");--> statement-breakpoint
CREATE INDEX "scenario_branches_entity_idx" ON "scenario_branches" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "scenario_branches_org_idx" ON "scenario_branches" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "scenario_branches_status_idx" ON "scenario_branches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scenario_branches_created_idx" ON "scenario_branches" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "scenario_branches_branch_id_idx" ON "scenario_branches" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "scene_memory_twin_idx" ON "scene_memory_index" USING btree ("twin_id");--> statement-breakpoint
CREATE INDEX "scene_memory_entity_idx" ON "scene_memory_index" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "scene_memory_org_idx" ON "scene_memory_index" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "scene_memory_rank_idx" ON "scene_memory_index" USING btree ("composite_rank_score");--> statement-breakpoint
CREATE INDEX "scene_memory_snapshot_idx" ON "scene_memory_index" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "scene_memory_indexed_idx" ON "scene_memory_index" USING btree ("indexed_at");--> statement-breakpoint
CREATE INDEX "spatial_snapshots_twin_idx" ON "spatial_twin_snapshots" USING btree ("twin_id");--> statement-breakpoint
CREATE INDEX "spatial_snapshots_entity_idx" ON "spatial_twin_snapshots" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "spatial_snapshots_category_idx" ON "spatial_twin_snapshots" USING btree ("twin_category");--> statement-breakpoint
CREATE INDEX "spatial_snapshots_org_idx" ON "spatial_twin_snapshots" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "spatial_snapshots_seq_idx" ON "spatial_twin_snapshots" USING btree ("twin_id","sequence_number");--> statement-breakpoint
CREATE INDEX "spatial_snapshots_at_idx" ON "spatial_twin_snapshots" USING btree ("snapshot_at");--> statement-breakpoint
CREATE INDEX "spatial_snapshots_branch_idx" ON "spatial_twin_snapshots" USING btree ("derived_branch_id");--> statement-breakpoint
CREATE INDEX "twin_sim_runs_twin_idx" ON "twin_simulation_runs" USING btree ("twin_id");--> statement-breakpoint
CREATE INDEX "twin_sim_runs_org_idx" ON "twin_simulation_runs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "twin_sim_runs_created_idx" ON "twin_simulation_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "twin_sim_runs_scenario_idx" ON "twin_simulation_runs" USING btree ("scenario_name");--> statement-breakpoint
CREATE INDEX "wl_overlays_signal_type_idx" ON "worldline_signal_overlays" USING btree ("signal_type");--> statement-breakpoint
CREATE INDEX "wl_overlays_org_idx" ON "worldline_signal_overlays" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "wl_overlays_timestamp_idx" ON "worldline_signal_overlays" USING btree ("signal_timestamp");--> statement-breakpoint
CREATE INDEX "wl_overlays_active_idx" ON "worldline_signal_overlays" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "wl_overlays_trust_idx" ON "worldline_signal_overlays" USING btree ("source_trust_class");--> statement-breakpoint
CREATE INDEX "wl_overlays_severity_idx" ON "worldline_signal_overlays" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "wl_overlays_overlay_id_idx" ON "worldline_signal_overlays" USING btree ("overlay_id");--> statement-breakpoint
CREATE INDEX "audit_chain_org_idx" ON "audit_chain_events" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "audit_chain_action_type_idx" ON "audit_chain_events" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "audit_chain_domain_idx" ON "audit_chain_events" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "audit_chain_risk_level_idx" ON "audit_chain_events" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "audit_chain_created_at_idx" ON "audit_chain_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at" DESC);--> statement-breakpoint
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_org_id_idx" ON "audit_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "biometric_challenges_device_id_idx" ON "biometric_challenges" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "biometric_challenges_nonce_idx" ON "biometric_challenges" USING btree ("nonce");--> statement-breakpoint
CREATE UNIQUE INDEX "device_biometric_user_device_unique" ON "device_biometric_bindings" USING btree ("user_id","device_id");--> statement-breakpoint
CREATE INDEX "device_biometric_bindings_user_id_idx" ON "device_biometric_bindings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "device_biometric_bindings_token_idx" ON "device_biometric_bindings" USING btree ("binding_token");--> statement-breakpoint
CREATE INDEX "login_attempts_email_idx" ON "login_attempts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "login_attempts_ip_idx" ON "login_attempts" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "login_attempts_created_at_idx" ON "login_attempts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "magic_links_token_idx" ON "magic_links" USING btree ("token");--> statement-breakpoint
CREATE INDEX "magic_links_email_idx" ON "magic_links" USING btree ("email");--> statement-breakpoint
CREATE INDEX "magic_links_expires_at_idx" ON "magic_links" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "mfa_secrets_user_unique" ON "mfa_secrets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "sessions_revoked_at_idx" ON "sessions" USING btree ("revoked_at");--> statement-breakpoint
CREATE INDEX "step_up_assertions_session_idx" ON "step_up_assertions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "step_up_assertions_token_idx" ON "step_up_assertions" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "user_devices_user_fingerprint_unique" ON "user_devices" USING btree ("user_id","fingerprint_hash");--> statement-breakpoint
CREATE INDEX "user_devices_user_id_idx" ON "user_devices" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_role_unique" ON "user_roles" USING btree ("user_id","role_id");--> statement-breakpoint
CREATE INDEX "billing_audit_log_org_id_idx" ON "billing_audit_log" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "billing_audit_log_action_idx" ON "billing_audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "billing_audit_log_created_at_idx" ON "billing_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "billing_audit_log_actor_id_idx" ON "billing_audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "billing_payment_methods_org_id_idx" ON "billing_payment_methods" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "billing_payment_methods_customer_id_idx" ON "billing_payment_methods" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "billing_rail_accounts_org_id_idx" ON "billing_rail_accounts" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "billing_rail_accounts_rail_idx" ON "billing_rail_accounts" USING btree ("rail");--> statement-breakpoint
CREATE INDEX "billing_refund_requests_org_id_idx" ON "billing_refund_requests" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "billing_refund_requests_status_idx" ON "billing_refund_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "billing_refund_requests_charge_id_idx" ON "billing_refund_requests" USING btree ("stripe_charge_id");--> statement-breakpoint
CREATE INDEX "billing_tax_calculations_org_id_idx" ON "billing_tax_calculations" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "billing_tax_calculations_invoice_id_idx" ON "billing_tax_calculations" USING btree ("stripe_invoice_id");--> statement-breakpoint
CREATE INDEX "billing_tax_calculations_source_idx" ON "billing_tax_calculations" USING btree ("source");--> statement-breakpoint
CREATE INDEX "billing_tax_calculations_jurisdiction_idx" ON "billing_tax_calculations" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX "billing_webhook_events_event_type_idx" ON "billing_webhook_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "billing_webhook_events_processed_at_idx" ON "billing_webhook_events" USING btree ("processed_at");--> statement-breakpoint
CREATE INDEX "entitlement_overrides_org_feature_idx" ON "entitlement_overrides" USING btree ("org_id","feature_key");--> statement-breakpoint
CREATE INDEX "fulfillments_org_id_idx" ON "fulfillments" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "fulfillments_session_id_idx" ON "fulfillments" USING btree ("stripe_session_id");--> statement-breakpoint
CREATE INDEX "fulfillments_product_idx" ON "fulfillments" USING btree ("product");--> statement-breakpoint
CREATE INDEX "invoices_org_id_idx" ON "invoices" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "invoices_stripe_id_idx" ON "invoices" USING btree ("stripe_invoice_id");--> statement-breakpoint
CREATE INDEX "subscription_credits_org_id_idx" ON "subscription_credits" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "subscription_credits_subscription_id_idx" ON "subscription_credits" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "subscription_credits_source_refund_id_idx" ON "subscription_credits" USING btree ("source_refund_id");--> statement-breakpoint
CREATE INDEX "subscriptions_org_id_idx" ON "subscriptions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_stripe_id_idx" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "tax_category_overrides_scope_ref_idx" ON "tax_category_overrides" USING btree ("scope","scope_ref");--> statement-breakpoint
CREATE INDEX "tax_category_overrides_org_id_idx" ON "tax_category_overrides" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "tax_category_overrides_jurisdiction_idx" ON "tax_category_overrides" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX "tax_exemption_certs_org_id_idx" ON "tax_exemption_certificates" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "tax_exemption_certs_jurisdiction_idx" ON "tax_exemption_certificates" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX "tax_exemption_certs_expires_at_idx" ON "tax_exemption_certificates" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "tax_exemption_certs_status_idx" ON "tax_exemption_certificates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tax_ids_org_id_idx" ON "tax_ids" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "tax_ids_jurisdiction_idx" ON "tax_ids" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX "tax_ids_type_idx" ON "tax_ids" USING btree ("tax_id_type");--> statement-breakpoint
CREATE INDEX "usage_events_org_feature_idx" ON "usage_events" USING btree ("org_id","feature_key","recorded_at" DESC);--> statement-breakpoint
CREATE INDEX "net30_aging_snapshots_org_id_idx" ON "net30_aging_snapshots" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "net30_aging_snapshots_snapshot_date_idx" ON "net30_aging_snapshots" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX "net30_credit_memos_invoice_id_idx" ON "net30_credit_memos" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "net30_credit_memos_org_id_idx" ON "net30_credit_memos" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "net30_dunning_config_org_id_idx" ON "net30_dunning_config" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "net30_dunning_log_invoice_id_idx" ON "net30_dunning_log" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "net30_dunning_log_dispatched_at_idx" ON "net30_dunning_log" USING btree ("dispatched_at");--> statement-breakpoint
CREATE INDEX "net30_line_items_invoice_id_idx" ON "net30_invoice_line_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "net30_payments_invoice_id_idx" ON "net30_invoice_payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "net30_payments_paid_at_idx" ON "net30_invoice_payments" USING btree ("paid_at");--> statement-breakpoint
CREATE UNIQUE INDEX "net30_payments_reference_uidx" ON "net30_invoice_payments" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "net30_invoices_org_id_idx" ON "net30_invoices" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "net30_invoices_status_idx" ON "net30_invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "net30_invoices_due_date_idx" ON "net30_invoices" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "net30_invoices_invoice_number_idx" ON "net30_invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "net30_invoices_next_dunning_idx" ON "net30_invoices" USING btree ("next_dunning_at");--> statement-breakpoint
CREATE INDEX "actions_org_idx" ON "actions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "actions_status_idx" ON "actions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "actions_signal_idx" ON "actions" USING btree ("signal_id");--> statement-breakpoint
CREATE INDEX "actions_owner_idx" ON "actions" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "actions_created_idx" ON "actions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "approvals_org_idx" ON "approvals" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "approvals_status_idx" ON "approvals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "approvals_entity_idx" ON "approvals" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "artifacts_org_idx" ON "artifacts" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "artifacts_signal_idx" ON "artifacts" USING btree ("signal_id");--> statement-breakpoint
CREATE INDEX "artifacts_status_idx" ON "artifacts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "artifacts_created_idx" ON "artifacts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "event_log_org_idx" ON "event_log" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "event_log_entity_idx" ON "event_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "event_log_actor_idx" ON "event_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "event_log_created_idx" ON "event_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "event_log_event_type_idx" ON "event_log" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "readiness_items_org_idx" ON "readiness_items" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "readiness_items_status_idx" ON "readiness_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "readiness_items_product_idx" ON "readiness_items" USING btree ("product");--> statement-breakpoint
CREATE INDEX "readiness_items_created_idx" ON "readiness_items" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "saved_views_org_idx" ON "saved_views" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "saved_views_user_idx" ON "saved_views" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workflow_runs_org_idx" ON "workflow_runs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "workflow_runs_workflow_idx" ON "workflow_runs" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "workflow_runs_status_idx" ON "workflow_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "workflow_runs_created_idx" ON "workflow_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "workflows_org_idx" ON "workflows" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "workflows_status_idx" ON "workflows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "workflows_product_idx" ON "workflows" USING btree ("product");--> statement-breakpoint
CREATE INDEX "capital_artifacts_type_idx" ON "capital_artifacts" USING btree ("artifact_type");--> statement-breakpoint
CREATE INDEX "capital_artifacts_status_idx" ON "capital_artifacts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "diligence_items_checklist_idx" ON "diligence_checklist_items" USING btree ("checklist_id");--> statement-breakpoint
CREATE INDEX "investor_deliverables_packet_idx" ON "investor_packet_deliverables" USING btree ("packet_id");--> statement-breakpoint
CREATE INDEX "lender_deliverables_packet_idx" ON "lender_packet_deliverables" USING btree ("packet_id");--> statement-breakpoint
CREATE UNIQUE INDEX "carlota_radar_seen_user_hash_idx" ON "carlota_radar_seen_signals" USING btree ("user_id","signal_hash");--> statement-breakpoint
CREATE INDEX "carlota_radar_seen_user_idx" ON "carlota_radar_seen_signals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "app_artifacts_program_idx" ON "application_artifacts" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "cert_calendar_date_idx" ON "certification_calendar" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "cert_programs_org_idx" ON "certification_programs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "cert_reqs_program_idx" ON "certification_requirements" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "cert_status_program_idx" ON "certification_status" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "cert_status_overall_status_idx" ON "certification_status" USING btree ("overall_status");--> statement-breakpoint
CREATE INDEX "cert_tasks_program_idx" ON "certification_tasks" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "cert_tasks_status_idx" ON "certification_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "legal_review_program_idx" ON "legal_review_checkpoints" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "legal_review_status_idx" ON "legal_review_checkpoints" USING btree ("status");--> statement-breakpoint
CREATE INDEX "opportunity_status_idx" ON "opportunity_pipeline" USING btree ("status");--> statement-breakpoint
CREATE INDEX "opportunity_source_idx" ON "opportunity_pipeline" USING btree ("source");--> statement-breakpoint
CREATE INDEX "change_events_entity_idx" ON "change_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "change_events_cursor_idx" ON "change_events" USING btree ("cursor");--> statement-breakpoint
CREATE INDEX "change_events_actor_idx" ON "change_events" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "change_events_timestamp_idx" ON "change_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "changelog_date_idx" ON "changelog_entries" USING btree ("date");--> statement-breakpoint
CREATE INDEX "changelog_category_idx" ON "changelog_entries" USING btree ("category");--> statement-breakpoint
CREATE INDEX "cog_actions_action_id_idx" ON "cog_actions" USING btree ("action_id");--> statement-breakpoint
CREATE INDEX "cog_actions_agent_id_idx" ON "cog_actions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "cog_actions_trace_id_idx" ON "cog_actions" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "cog_actions_plan_id_idx" ON "cog_actions" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "cog_actions_status_idx" ON "cog_actions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cog_actions_domain_idx" ON "cog_actions" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "cog_actions_created_at_idx" ON "cog_actions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "rollback_events_action_idx" ON "rollback_events" USING btree ("action_id");--> statement-breakpoint
CREATE INDEX "rollback_events_request_idx" ON "rollback_events" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "rollback_events_org_idx" ON "rollback_events" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "rollback_events_status_idx" ON "rollback_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rollback_events_created_idx" ON "rollback_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "entity_aliases_entity_idx" ON "entity_aliases" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "entity_aliases_alias_idx" ON "entity_aliases" USING btree ("alias");--> statement-breakpoint
CREATE INDEX "entity_aliases_type_idx" ON "entity_aliases" USING btree ("alias_type");--> statement-breakpoint
CREATE INDEX "entity_edges_from_idx" ON "entity_edges" USING btree ("from_entity_id");--> statement-breakpoint
CREATE INDEX "entity_edges_to_idx" ON "entity_edges" USING btree ("to_entity_id");--> statement-breakpoint
CREATE INDEX "entity_edges_type_idx" ON "entity_edges" USING btree ("edge_type");--> statement-breakpoint
CREATE INDEX "entity_edges_pair_idx" ON "entity_edges" USING btree ("from_entity_id","to_entity_id");--> statement-breakpoint
CREATE INDEX "orchestration_checkpoints_run_id_idx" ON "orchestration_checkpoints" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "orchestration_checkpoints_agent_id_idx" ON "orchestration_checkpoints" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "orchestration_checkpoints_created_at_idx" ON "orchestration_checkpoints" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orchestration_checkpoints_expires_at_idx" ON "orchestration_checkpoints" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "plan_steps_plan_id_idx" ON "plan_steps" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "plan_steps_status_idx" ON "plan_steps" USING btree ("status");--> statement-breakpoint
CREATE INDEX "plan_steps_step_index_idx" ON "plan_steps" USING btree ("plan_id","step_index");--> statement-breakpoint
CREATE INDEX "plans_plan_id_idx" ON "plans" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "plans_agent_id_idx" ON "plans" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "plans_session_id_idx" ON "plans" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "plans_workflow_id_idx" ON "plans" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "plans_status_idx" ON "plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "plans_created_at_idx" ON "plans" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "policies_policy_id_idx" ON "policies" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "policies_domain_idx" ON "policies" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "policies_enabled_idx" ON "policies" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "policies_priority_idx" ON "policies" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "policies_version_idx" ON "policies" USING btree ("policy_id","version");--> statement-breakpoint
CREATE INDEX "reflections_reflection_id_idx" ON "reflections" USING btree ("reflection_id");--> statement-breakpoint
CREATE INDEX "reflections_agent_id_idx" ON "reflections" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "reflections_type_idx" ON "reflections" USING btree ("type");--> statement-breakpoint
CREATE INDEX "reflections_trace_id_idx" ON "reflections" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "reflections_created_at_idx" ON "reflections" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "self_model_snapshots_model_idx" ON "self_model_snapshots" USING btree ("self_model_id");--> statement-breakpoint
CREATE INDEX "self_model_snapshots_agent_id_idx" ON "self_model_snapshots" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "self_model_snapshots_version_idx" ON "self_model_snapshots" USING btree ("self_model_id","version");--> statement-breakpoint
CREATE INDEX "self_model_snapshots_created_at_idx" ON "self_model_snapshots" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "self_models_agent_id_idx" ON "self_models" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "self_models_status_idx" ON "self_models" USING btree ("status");--> statement-breakpoint
CREATE INDEX "self_models_version_idx" ON "self_models" USING btree ("agent_id","version");--> statement-breakpoint
CREATE INDEX "skill_runs_skill_id_idx" ON "skill_runs" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "skill_runs_agent_id_idx" ON "skill_runs" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "skill_runs_trace_id_idx" ON "skill_runs" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "skill_runs_plan_id_idx" ON "skill_runs" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "skill_runs_status_idx" ON "skill_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "skill_runs_created_at_idx" ON "skill_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "skills_skill_id_idx" ON "skills" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "skills_domain_idx" ON "skills" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "skills_status_idx" ON "skills" USING btree ("status");--> statement-breakpoint
CREATE INDEX "skills_version_idx" ON "skills" USING btree ("skill_id","version");--> statement-breakpoint
CREATE INDEX "skills_capability_idx" ON "skills" USING btree ("capability");--> statement-breakpoint
CREATE INDEX "verifier_results_target_idx" ON "verifier_results" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "verifier_results_trace_id_idx" ON "verifier_results" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "verifier_results_outcome_idx" ON "verifier_results" USING btree ("outcome");--> statement-breakpoint
CREATE INDEX "verifier_results_plan_id_idx" ON "verifier_results" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "verifier_results_created_at_idx" ON "verifier_results" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "command_inbox_alert_audit_alert_idx" ON "command_inbox_alert_audit" USING btree ("alert_id");--> statement-breakpoint
CREATE INDEX "command_inbox_alert_audit_alert_tenant_idx" ON "command_inbox_alert_audit" USING btree ("alert_id","tenant_id");--> statement-breakpoint
CREATE INDEX "command_inbox_alert_audit_created_at_idx" ON "command_inbox_alert_audit" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "command_inbox_alert_states_alert_tenant_uq" ON "command_inbox_alert_states" USING btree ("alert_id","tenant_id");--> statement-breakpoint
CREATE INDEX "command_inbox_alert_states_alert_idx" ON "command_inbox_alert_states" USING btree ("alert_id");--> statement-breakpoint
CREATE INDEX "command_inbox_alert_states_tenant_idx" ON "command_inbox_alert_states" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "command_coalition_partners_tenant_idx" ON "command_coalition_partners" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "command_directives_tenant_idx" ON "command_directives" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "command_drawdown_requests_tenant_idx" ON "command_drawdown_requests" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "command_drawdown_requests_pool_idx" ON "command_drawdown_requests" USING btree ("pool_id");--> statement-breakpoint
CREATE INDEX "command_reserve_pools_tenant_idx" ON "command_reserve_pools" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "comments_entity_idx" ON "comments" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "comments_author_idx" ON "comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "comments_created_idx" ON "comments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "competitive_intel_alerts_lane_id_idx" ON "competitive_intel_alerts" USING btree ("lane_id");--> statement-breakpoint
CREATE INDEX "competitive_intel_alerts_published_at_idx" ON "competitive_intel_alerts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "competitive_intel_alerts_dismissed_idx" ON "competitive_intel_alerts" USING btree ("dismissed");--> statement-breakpoint
CREATE INDEX "competitive_intel_feeds_lane_id_idx" ON "competitive_intel_feeds" USING btree ("lane_id");--> statement-breakpoint
CREATE INDEX "cst_evidence_edge_idx" ON "cst_edge_evidence" USING btree ("edge_id");--> statement-breakpoint
CREATE INDEX "cst_evidence_type_idx" ON "cst_edge_evidence" USING btree ("evidence_type");--> statement-breakpoint
CREATE INDEX "cst_evidence_recorded_at_idx" ON "cst_edge_evidence" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "cst_edges_from_idx" ON "cst_edges" USING btree ("from_node_id");--> statement-breakpoint
CREATE INDEX "cst_edges_to_idx" ON "cst_edges" USING btree ("to_node_id");--> statement-breakpoint
CREATE INDEX "cst_edges_type_idx" ON "cst_edges" USING btree ("relationship_type");--> statement-breakpoint
CREATE INDEX "cst_edges_active_idx" ON "cst_edges" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX "cst_edges_from_to_type_uniq" ON "cst_edges" USING btree ("from_node_id","to_node_id","relationship_type");--> statement-breakpoint
CREATE INDEX "cst_aliases_node_idx" ON "cst_node_aliases" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "cst_aliases_value_idx" ON "cst_node_aliases" USING btree ("alias_value");--> statement-breakpoint
CREATE UNIQUE INDEX "cst_aliases_type_value_uniq" ON "cst_node_aliases" USING btree ("alias_type","alias_value");--> statement-breakpoint
CREATE UNIQUE INDEX "cst_node_types_domain_key_uniq" ON "cst_node_types" USING btree ("domain","type_key");--> statement-breakpoint
CREATE INDEX "cst_node_types_domain_idx" ON "cst_node_types" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "cst_nodes_domain_idx" ON "cst_nodes" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "cst_nodes_entity_type_idx" ON "cst_nodes" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "cst_nodes_canonical_id_idx" ON "cst_nodes" USING btree ("canonical_id");--> statement-breakpoint
CREATE INDEX "cst_nodes_active_idx" ON "cst_nodes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "cst_nodes_name_idx" ON "cst_nodes" USING btree ("name");--> statement-breakpoint
CREATE INDEX "cst_nodes_domain_type_idx" ON "cst_nodes" USING btree ("domain","entity_type");--> statement-breakpoint
CREATE INDEX "cst_nodes_sensitivity_idx" ON "cst_nodes" USING btree ("sensitivity_tier");--> statement-breakpoint
CREATE INDEX "cst_nodes_confidence_idx" ON "cst_nodes" USING btree ("confidence");--> statement-breakpoint
CREATE UNIQUE INDEX "constellation_saved_views_user_domain_name_uq" ON "constellation_saved_views" USING btree ("user_id","domain","name") WHERE "constellation_saved_views"."visibility" = 'private';--> statement-breakpoint
CREATE UNIQUE INDEX "constellation_saved_views_org_domain_name_uq" ON "constellation_saved_views" USING btree ("org_id","domain","name") WHERE "constellation_saved_views"."visibility" = 'org';--> statement-breakpoint
CREATE INDEX "constellation_saved_views_user_domain_idx" ON "constellation_saved_views" USING btree ("user_id","domain");--> statement-breakpoint
CREATE INDEX "constellation_saved_views_org_domain_idx" ON "constellation_saved_views" USING btree ("org_id","domain");--> statement-breakpoint
CREATE INDEX "cortex_action_drafts_alert_idx" ON "cortex_action_drafts" USING btree ("alert_id");--> statement-breakpoint
CREATE INDEX "cortex_action_drafts_status_idx" ON "cortex_action_drafts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cortex_action_drafts_domain_idx" ON "cortex_action_drafts" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "cortex_action_drafts_generated_at_idx" ON "cortex_action_drafts" USING btree ("generated_at");--> statement-breakpoint
CREATE INDEX "cortex_action_drafts_org_idx" ON "cortex_action_drafts" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "cortex_graph_snapshots_org_idx" ON "cortex_graph_snapshots" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "cortex_graph_snapshots_snapshot_at_idx" ON "cortex_graph_snapshots" USING btree ("snapshot_at");--> statement-breakpoint
CREATE INDEX "cortex_graph_snapshots_expires_at_idx" ON "cortex_graph_snapshots" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "daily_briefings_org_date_idx" ON "daily_briefings" USING btree ("org_id","briefing_date");--> statement-breakpoint
CREATE INDEX "daily_briefings_date_idx" ON "daily_briefings" USING btree ("briefing_date");--> statement-breakpoint
CREATE INDEX "daily_briefings_generated_at_idx" ON "daily_briefings" USING btree ("generated_at");--> statement-breakpoint
CREATE INDEX "df_corr_correlation_idx" ON "decision_fabric_correlation_links" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "df_corr_workflow_idx" ON "decision_fabric_correlation_links" USING btree ("workflow_run_id");--> statement-breakpoint
CREATE INDEX "df_corr_entity_idx" ON "decision_fabric_correlation_links" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "df_corr_primitive_idx" ON "decision_fabric_correlation_links" USING btree ("primitive");--> statement-breakpoint
CREATE INDEX "df_corr_org_idx" ON "decision_fabric_correlation_links" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "df_records_org_idx" ON "decision_fabric_records" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "df_records_domain_idx" ON "decision_fabric_records" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "df_records_entity_idx" ON "decision_fabric_records" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "df_records_owner_idx" ON "decision_fabric_records" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "df_records_workflow_idx" ON "decision_fabric_records" USING btree ("workflow_run_id");--> statement-breakpoint
CREATE INDEX "df_records_recommendation_idx" ON "decision_fabric_records" USING btree ("recommendation_id");--> statement-breakpoint
CREATE INDEX "df_records_correlation_idx" ON "decision_fabric_records" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "df_records_decided_at_idx" ON "decision_fabric_records" USING btree ("decided_at");--> statement-breakpoint
CREATE INDEX "df_simulation_org_idx" ON "decision_fabric_simulation_snapshots" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "df_simulation_scenario_idx" ON "decision_fabric_simulation_snapshots" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "df_simulation_domain_idx" ON "decision_fabric_simulation_snapshots" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "df_playbook_org_idx" ON "decision_fabric_playbook_suggestions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "df_playbook_domain_idx" ON "decision_fabric_playbook_suggestions" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "df_playbook_status_idx" ON "decision_fabric_playbook_suggestions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "df_policy_versions_org_idx" ON "decision_fabric_policy_versions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "df_policy_versions_policy_idx" ON "decision_fabric_policy_versions" USING btree ("policy_id","version");--> statement-breakpoint
CREATE INDEX "dae_event_id_idx" ON "decision_audit_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "dae_card_id_idx" ON "decision_audit_events" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "dae_workspace_id_idx" ON "decision_audit_events" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "dae_event_type_idx" ON "decision_audit_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "dae_occurred_at_idx" ON "decision_audit_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "de_card_id_idx" ON "decision_evidence" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "de_workspace_id_idx" ON "decision_evidence" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "drn_card_id_idx" ON "decision_runs" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "drn_workspace_id_idx" ON "decision_runs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "drn_run_id_idx" ON "decision_runs" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "dv_card_id_idx" ON "decision_validations" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "dv_workspace_id_idx" ON "decision_validations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "dv_check_type_idx" ON "decision_validations" USING btree ("check_type");--> statement-breakpoint
CREATE INDEX "dr_card_id_idx" ON "decisions_runtime" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "dr_workspace_id_idx" ON "decisions_runtime" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "dr_domain_idx" ON "decisions_runtime" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "dr_severity_idx" ON "decisions_runtime" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "dr_status_idx" ON "decisions_runtime" USING btree ("status");--> statement-breakpoint
CREATE INDEX "dr_autonomy_mode_idx" ON "decisions_runtime" USING btree ("autonomy_mode");--> statement-breakpoint
CREATE INDEX "dr_workspace_domain_idx" ON "decisions_runtime" USING btree ("workspace_id","domain");--> statement-breakpoint
CREATE INDEX "dr_workspace_status_idx" ON "decisions_runtime" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "dr_created_at_idx" ON "decisions_runtime" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "wc_workspace_id_idx" ON "workspace_constitutions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "wc_workspace_active_idx" ON "workspace_constitutions" USING btree ("workspace_id","is_active");--> statement-breakpoint
CREATE INDEX "deployments_app_env_idx" ON "deployments" USING btree ("app_id","environment");--> statement-breakpoint
CREATE INDEX "deployments_deployed_at_idx" ON "deployments" USING btree ("deployed_at");--> statement-breakpoint
CREATE INDEX "deployments_status_idx" ON "deployments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "dos_articles_status_idx" ON "dos_articles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "dos_articles_pillar_idx" ON "dos_articles" USING btree ("pillar_id");--> statement-breakpoint
CREATE INDEX "dos_articles_slug_idx" ON "dos_articles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "dos_leads_stage_idx" ON "dos_leads" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "dos_leads_email_idx" ON "dos_leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "dos_x_posts_status_idx" ON "dos_x_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "dos_x_posts_scheduled_idx" ON "dos_x_posts" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "content_blocks_category_idx" ON "content_library_blocks" USING btree ("category");--> statement-breakpoint
CREATE INDEX "content_blocks_app_idx" ON "content_library_blocks" USING btree ("app_source");--> statement-breakpoint
CREATE INDEX "doc_comments_doc_idx" ON "document_comments" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "doc_templates_slug_idx" ON "document_templates" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "doc_templates_app_idx" ON "document_templates" USING btree ("app_source");--> statement-breakpoint
CREATE INDEX "doc_versions_doc_idx" ON "document_versions" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "doc_versions_version_idx" ON "document_versions" USING btree ("document_id","version");--> statement-breakpoint
CREATE INDEX "documents_status_idx" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "documents_app_source_idx" ON "documents" USING btree ("app_source");--> statement-breakpoint
CREATE INDEX "documents_owner_idx" ON "documents" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "documents_entity_idx" ON "documents" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "documents_created_idx" ON "documents" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "pdf_batches_batch_id_idx" ON "pdf_batches" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "pdf_batches_status_idx" ON "pdf_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pdf_batches_app_idx" ON "pdf_batches" USING btree ("app_source");--> statement-breakpoint
CREATE INDEX "pdf_jobs_batch_idx" ON "pdf_jobs" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "pdf_jobs_status_idx" ON "pdf_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pdf_jobs_app_idx" ON "pdf_jobs" USING btree ("app_source");--> statement-breakpoint
CREATE INDEX "pdf_jobs_created_idx" ON "pdf_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "signatures_doc_idx" ON "signatures" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "signatures_status_idx" ON "signatures" USING btree ("status");--> statement-breakpoint
CREATE INDEX "signatures_signer_idx" ON "signatures" USING btree ("signer_email");--> statement-breakpoint
CREATE INDEX "signatures_token_idx" ON "signatures" USING btree ("signing_token");--> statement-breakpoint
CREATE INDEX "dreamscape_assets_project_idx" ON "dreamscape_assets" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "dreamscape_campaign_assets_campaign_idx" ON "dreamscape_campaign_assets" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "dreamscape_reviews_project_idx" ON "dreamscape_reviews" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "dreamscape_reviews_campaign_idx" ON "dreamscape_reviews" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "dreamscape_scripts_campaign_idx" ON "dreamscape_scripts" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "dreamscape_storyboards_campaign_idx" ON "dreamscape_storyboards" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "dreamscape_storyboards_script_idx" ON "dreamscape_storyboards" USING btree ("script_id");--> statement-breakpoint
CREATE INDEX "dreamscape_voice_assets_campaign_idx" ON "dreamscape_voice_assets" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "drift_snapshots_measured_at_idx" ON "drift_snapshots" USING btree ("measured_at");--> statement-breakpoint
CREATE INDEX "email_suppressions_email_idx" ON "email_suppressions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "entities_entity_type_idx" ON "entities" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "entities_source_app_idx" ON "entities" USING btree ("source_app");--> statement-breakpoint
CREATE INDEX "entities_external_id_idx" ON "entities" USING btree ("external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "entities_name_source_app_uniq" ON "entities" USING btree ("name","source_app");--> statement-breakpoint
CREATE INDEX "entity_metadata_entity_idx" ON "entity_metadata" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "entity_metadata_key_idx" ON "entity_metadata" USING btree ("key");--> statement-breakpoint
CREATE INDEX "entity_rel_from_idx" ON "entity_relationships" USING btree ("from_entity_id");--> statement-breakpoint
CREATE INDEX "entity_rel_to_idx" ON "entity_relationships" USING btree ("to_entity_id");--> statement-breakpoint
CREATE INDEX "entity_rel_type_idx" ON "entity_relationships" USING btree ("relationship_type");--> statement-breakpoint
CREATE INDEX "entity_tags_entity_idx" ON "entity_tags" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "entity_tags_tag_idx" ON "entity_tags" USING btree ("tag");--> statement-breakpoint
CREATE INDEX "eval_forge_runs_suite_idx" ON "eval_forge_runs" USING btree ("suite_id");--> statement-breakpoint
CREATE INDEX "eval_forge_runs_eval_type_idx" ON "eval_forge_runs" USING btree ("eval_type");--> statement-breakpoint
CREATE INDEX "eval_forge_runs_run_at_idx" ON "eval_forge_runs" USING btree ("run_at");--> statement-breakpoint
CREATE INDEX "eval_forge_runs_regression_idx" ON "eval_forge_runs" USING btree ("has_regression");--> statement-breakpoint
CREATE INDEX "eval_forge_suites_domain_idx" ON "eval_forge_suites" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "eval_forge_suites_eval_type_idx" ON "eval_forge_suites" USING btree ("eval_type");--> statement-breakpoint
CREATE INDEX "eval_cases_suite_idx" ON "eval_cases" USING btree ("suite_id");--> statement-breakpoint
CREATE INDEX "eval_cases_domain_idx" ON "eval_cases" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "eval_cases_grader_idx" ON "eval_cases" USING btree ("grader_type");--> statement-breakpoint
CREATE INDEX "eval_cases_red_team_idx" ON "eval_cases" USING btree ("is_red_team");--> statement-breakpoint
CREATE INDEX "eval_scores_run_idx" ON "eval_scores" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "eval_scores_case_idx" ON "eval_scores" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "eval_scores_suite_idx" ON "eval_scores" USING btree ("suite_id");--> statement-breakpoint
CREATE INDEX "eval_scores_domain_idx" ON "eval_scores" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "eval_scores_passed_idx" ON "eval_scores" USING btree ("passed");--> statement-breakpoint
CREATE INDEX "eval_scores_human_label_idx" ON "eval_scores" USING btree ("human_label");--> statement-breakpoint
CREATE INDEX "eval_suites_domain_idx" ON "eval_suites" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "eval_suites_active_idx" ON "eval_suites" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "flag_check_logs_key_idx" ON "flag_check_logs" USING btree ("flag_key");--> statement-breakpoint
CREATE INDEX "flag_check_logs_org_id_idx" ON "flag_check_logs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "flag_check_logs_checked_at_idx" ON "flag_check_logs" USING btree ("checked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "forge_agent_versions_uniq" ON "forge_agent_versions" USING btree ("agent_id","version");--> statement-breakpoint
CREATE INDEX "forge_agents_org_idx" ON "forge_agents" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "forge_agents_env_idx" ON "forge_agents" USING btree ("current_env");--> statement-breakpoint
CREATE INDEX "forge_audit_agent_idx" ON "forge_audit_events" USING btree ("agent_id","created_at");--> statement-breakpoint
CREATE INDEX "forge_audit_action_idx" ON "forge_audit_events" USING btree ("action");--> statement-breakpoint
CREATE INDEX "forge_drift_agent_idx" ON "forge_drift_events" USING btree ("agent_id","detected_at");--> statement-breakpoint
CREATE INDEX "forge_drift_sev_idx" ON "forge_drift_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "forge_env_snap_env_idx" ON "forge_environment_snapshots" USING btree ("env_id","captured_at");--> statement-breakpoint
CREATE INDEX "forge_exec_agent_idx" ON "forge_execution_runs" USING btree ("agent_id","started_at");--> statement-breakpoint
CREATE INDEX "forge_exec_env_idx" ON "forge_execution_runs" USING btree ("env_tier");--> statement-breakpoint
CREATE UNIQUE INDEX "forge_model_versions_uniq" ON "forge_model_versions" USING btree ("model_id","version");--> statement-breakpoint
CREATE INDEX "forge_promo_agent_idx" ON "forge_promotions" USING btree ("agent_id","created_at");--> statement-breakpoint
CREATE INDEX "forge_promo_status_idx" ON "forge_promotions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "forge_prompt_versions_uniq" ON "forge_prompt_versions" USING btree ("prompt_id","version");--> statement-breakpoint
CREATE INDEX "forge_rollback_agent_idx" ON "forge_rollback_events" USING btree ("agent_id","created_at");--> statement-breakpoint
CREATE INDEX "fusion_cortex_alerts_alert_id_idx" ON "fusion_cortex_alerts" USING btree ("alert_id");--> statement-breakpoint
CREATE INDEX "fusion_cortex_alerts_status_idx" ON "fusion_cortex_alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fusion_cortex_alerts_severity_idx" ON "fusion_cortex_alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "fusion_cortex_alerts_generated_at_idx" ON "fusion_cortex_alerts" USING btree ("generated_at");--> statement-breakpoint
CREATE INDEX "fusion_cortex_alerts_expires_at_idx" ON "fusion_cortex_alerts" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "fund_inbound_deals_pipeline_id_idx" ON "fund_inbound_deals" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "fund_inbound_deals_status_idx" ON "fund_inbound_deals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fund_inbound_deals_submitted_idx" ON "fund_inbound_deals" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "fund_investors_name_idx" ON "fund_accredited_investors" USING btree ("lp_name");--> statement-breakpoint
CREATE INDEX "fund_investors_status_idx" ON "fund_accredited_investors" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "fund_audit_entity_idx" ON "fund_cap_table_audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "fund_audit_occurred_idx" ON "fund_cap_table_audit_log" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "fund_holders_type_idx" ON "fund_cap_table_holders" USING btree ("holder_type");--> statement-breakpoint
CREATE INDEX "fund_cap_txn_holder_idx" ON "fund_cap_table_transactions" USING btree ("holder_id");--> statement-breakpoint
CREATE INDEX "fund_cap_txn_class_idx" ON "fund_cap_table_transactions" USING btree ("share_class_id");--> statement-breakpoint
CREATE INDEX "fund_cap_txn_date_idx" ON "fund_cap_table_transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "fund_cap_txn_type_idx" ON "fund_cap_table_transactions" USING btree ("transaction_type");--> statement-breakpoint
CREATE INDEX "fund_call_lines_call_idx" ON "fund_capital_call_lines" USING btree ("capital_call_id");--> statement-breakpoint
CREATE INDEX "fund_call_lines_lp_idx" ON "fund_capital_call_lines" USING btree ("lp_id");--> statement-breakpoint
CREATE INDEX "fund_capital_calls_status_idx" ON "fund_capital_calls" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fund_capital_calls_due_idx" ON "fund_capital_calls" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "fund_dist_lines_dist_idx" ON "fund_distribution_lines" USING btree ("distribution_id");--> statement-breakpoint
CREATE INDEX "fund_dist_lines_lp_idx" ON "fund_distribution_lines" USING btree ("lp_id");--> statement-breakpoint
CREATE INDEX "fund_distributions_status_idx" ON "fund_distributions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fund_distributions_date_idx" ON "fund_distributions" USING btree ("distribution_date");--> statement-breakpoint
CREATE INDEX "fund_form_d_entity_idx" ON "fund_form_d_filings" USING btree ("entity_name");--> statement-breakpoint
CREATE INDEX "fund_form_d_status_idx" ON "fund_form_d_filings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fund_lp_activity_lp_idx" ON "fund_lp_activity_events" USING btree ("lp_id");--> statement-breakpoint
CREATE INDEX "fund_lp_activity_occurred_idx" ON "fund_lp_activity_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "fund_lp_accounts_lp_idx" ON "fund_lp_capital_accounts" USING btree ("lp_id");--> statement-breakpoint
CREATE INDEX "fund_lp_docs_folder_idx" ON "fund_lp_data_room_docs" USING btree ("folder");--> statement-breakpoint
CREATE INDEX "fund_lp_docs_perm_idx" ON "fund_lp_data_room_docs" USING btree ("permission_tier");--> statement-breakpoint
CREATE INDEX "fund_lp_docs_demo_idx" ON "fund_lp_data_room_docs" USING btree ("is_demo");--> statement-breakpoint
CREATE INDEX "fund_lp_messages_lp_idx" ON "fund_lp_messages" USING btree ("lp_id");--> statement-breakpoint
CREATE INDEX "fund_lp_messages_sent_idx" ON "fund_lp_messages" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "fund_lp_reports_period_idx" ON "fund_lp_reports" USING btree ("reporting_period");--> statement-breakpoint
CREATE INDEX "fund_lp_reports_status_idx" ON "fund_lp_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fund_lp_reports_type_idx" ON "fund_lp_reports" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "fund_lp_uploads_lp_id_idx" ON "fund_lp_uploads" USING btree ("lp_id");--> statement-breakpoint
CREATE INDEX "fund_lp_uploads_status_idx" ON "fund_lp_uploads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fund_lp_uploads_doc_type_idx" ON "fund_lp_uploads" USING btree ("doc_type");--> statement-breakpoint
CREATE INDEX "fund_nav_date_idx" ON "fund_nav_records" USING btree ("nav_date");--> statement-breakpoint
CREATE INDEX "fund_financials_company_idx" ON "fund_portfolio_financials" USING btree ("company_slug");--> statement-breakpoint
CREATE INDEX "fund_financials_period_idx" ON "fund_portfolio_financials" USING btree ("period_label");--> statement-breakpoint
CREATE INDEX "fund_financials_status_idx" ON "fund_portfolio_financials" USING btree ("reporting_status");--> statement-breakpoint
CREATE INDEX "fund_kpis_company_idx" ON "fund_portfolio_kpis" USING btree ("company_slug");--> statement-breakpoint
CREATE INDEX "fund_kpis_period_idx" ON "fund_portfolio_kpis" USING btree ("period_label");--> statement-breakpoint
CREATE INDEX "fund_share_classes_type_idx" ON "fund_share_classes" USING btree ("class_type");--> statement-breakpoint
CREATE INDEX "fund_vesting_holder_idx" ON "fund_vesting_schedules" USING btree ("holder_id");--> statement-breakpoint
CREATE INDEX "geo_intel_pins_layer_idx" ON "geo_intel_pins" USING btree ("layer");--> statement-breakpoint
CREATE INDEX "geo_intel_pins_threat_idx" ON "geo_intel_pins" USING btree ("threat");--> statement-breakpoint
CREATE INDEX "alloy_policies_org_idx" ON "alloy_policies" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "alloy_policies_type_idx" ON "alloy_policies" USING btree ("policy_type");--> statement-breakpoint
CREATE INDEX "alloy_policies_active_idx" ON "alloy_policies" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "cost_budgets_org_idx" ON "cost_budgets" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "cost_budgets_active_idx" ON "cost_budgets" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "cost_events_org_idx" ON "cost_events" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "cost_events_budget_idx" ON "cost_events" USING btree ("budget_id");--> statement-breakpoint
CREATE INDEX "cost_events_type_idx" ON "cost_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "cost_events_created_idx" ON "cost_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "gov_incidents_org_idx" ON "governance_incidents" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "gov_incidents_severity_idx" ON "governance_incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "gov_incidents_type_idx" ON "governance_incidents" USING btree ("incident_type");--> statement-breakpoint
CREATE INDEX "gov_incidents_created_idx" ON "governance_incidents" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "model_routing_org_idx" ON "model_routing_policies" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "model_routing_provider_idx" ON "model_routing_policies" USING btree ("model_provider");--> statement-breakpoint
CREATE INDEX "guardian_actions_agent_idx" ON "guardian_actions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "guardian_actions_session_idx" ON "guardian_actions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "guardian_actions_tier_idx" ON "guardian_actions" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "guardian_actions_outcome_idx" ON "guardian_actions" USING btree ("outcome");--> statement-breakpoint
CREATE INDEX "guardian_actions_org_idx" ON "guardian_actions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "guardian_actions_created_idx" ON "guardian_actions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "guardian_approval_requests_agent_idx" ON "guardian_approval_requests" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "guardian_approval_requests_tier_idx" ON "guardian_approval_requests" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "guardian_approval_requests_status_idx" ON "guardian_approval_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "guardian_approval_requests_org_idx" ON "guardian_approval_requests" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "guardian_approval_requests_created_idx" ON "guardian_approval_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "guardian_policies_org_idx" ON "guardian_policies" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "guardian_policies_tier_idx" ON "guardian_policies" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "guardian_policies_enabled_idx" ON "guardian_policies" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "guardian_policies_priority_idx" ON "guardian_policies" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "guardian_policy_assignments_policy_idx" ON "guardian_policy_assignments" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "guardian_policy_assignments_subject_idx" ON "guardian_policy_assignments" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE UNIQUE INDEX "guardian_policy_assignments_unique_idx" ON "guardian_policy_assignments" USING btree ("policy_id","subject_type","subject_id");--> statement-breakpoint
CREATE UNIQUE INDEX "guardian_tiers_org_tier_idx" ON "guardian_tiers" USING btree ("org_id","tier");--> statement-breakpoint
CREATE INDEX "guardian_tiers_enabled_idx" ON "guardian_tiers" USING btree ("enabled");--> statement-breakpoint
CREATE UNIQUE INDEX "guardrail_configs_org_guardrail_idx" ON "guardrail_configs" USING btree ("org_id","guardrail_id");--> statement-breakpoint
CREATE INDEX "guardrail_configs_type_idx" ON "guardrail_configs" USING btree ("guardrail_type");--> statement-breakpoint
CREATE INDEX "guardrail_configs_tier_idx" ON "guardrail_configs" USING btree ("applies_to_tier");--> statement-breakpoint
CREATE INDEX "guardrail_configs_enabled_idx" ON "guardrail_configs" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "tool_mesh_action_approvals_tool_idx" ON "tool_mesh_action_approvals" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "tool_mesh_action_approvals_status_idx" ON "tool_mesh_action_approvals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tool_mesh_action_approvals_org_idx" ON "tool_mesh_action_approvals" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "tool_mesh_action_approvals_agent_idx" ON "tool_mesh_action_approvals" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "tool_mesh_action_approvals_created_idx" ON "tool_mesh_action_approvals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tool_mesh_tool_permissions_tool_idx" ON "tool_mesh_tool_permissions" USING btree ("tool_db_id");--> statement-breakpoint
CREATE INDEX "tool_mesh_tool_permissions_subject_idx" ON "tool_mesh_tool_permissions" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tool_mesh_tool_permissions_unique_idx" ON "tool_mesh_tool_permissions" USING btree ("tool_db_id","subject_type","subject_id","permission");--> statement-breakpoint
CREATE INDEX "tool_mesh_tool_versions_tool_idx" ON "tool_mesh_tool_versions" USING btree ("tool_db_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tool_mesh_tool_versions_tool_version_idx" ON "tool_mesh_tool_versions" USING btree ("tool_db_id","version");--> statement-breakpoint
CREATE INDEX "tool_mesh_tools_policy_tier_idx" ON "tool_mesh_tools" USING btree ("policy_tier");--> statement-breakpoint
CREATE INDEX "tool_mesh_tools_enabled_idx" ON "tool_mesh_tools" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "inca_datasets_project_idx" ON "inca_datasets" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "inca_experiments_project_idx" ON "inca_experiments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "inca_models_project_idx" ON "inca_models" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "org_invitations_email_idx" ON "org_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "org_invitations_org_id_idx" ON "org_invitations" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "org_invitations_status_idx" ON "org_invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_exec_agent_id_idx" ON "agent_execution_contexts" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "dlq_type_idx" ON "dead_letter_queue" USING btree ("type");--> statement-breakpoint
CREATE INDEX "dlq_failed_at_idx" ON "dead_letter_queue" USING btree ("failed_at");--> statement-breakpoint
CREATE INDEX "dlq_resolved_idx" ON "dead_letter_queue" USING btree ("resolved_at");--> statement-breakpoint
CREATE INDEX "durable_jobs_status_priority_scheduled_idx" ON "durable_jobs" USING btree ("status","priority","scheduled_at");--> statement-breakpoint
CREATE INDEX "durable_jobs_queue_status_idx" ON "durable_jobs" USING btree ("queue","status");--> statement-breakpoint
CREATE INDEX "durable_jobs_type_idx" ON "durable_jobs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "durable_jobs_parent_idx" ON "durable_jobs" USING btree ("parent_job_id");--> statement-breakpoint
CREATE INDEX "durable_jobs_created_at_idx" ON "durable_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "job_runs_job_id_idx" ON "job_runs" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_runs_started_at_idx" ON "job_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "job_schedules_enabled_next_run_idx" ON "job_schedules" USING btree ("enabled","next_run_at");--> statement-breakpoint
CREATE INDEX "job_schedules_job_type_idx" ON "job_schedules" USING btree ("job_type");--> statement-breakpoint
CREATE INDEX "emb_model_provider_idx" ON "embedding_model_registry" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "emb_model_active_idx" ON "embedding_model_registry" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "emb_tasks_status_idx" ON "embedding_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "emb_tasks_table_idx" ON "embedding_tasks" USING btree ("target_table");--> statement-breakpoint
CREATE INDEX "emb_tasks_scheduled_idx" ON "embedding_tasks" USING btree ("scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "emb_tasks_target_idx" ON "embedding_tasks" USING btree ("target_table","target_id","target_column");--> statement-breakpoint
CREATE INDEX "kg_xdomain_from_idx" ON "kg_cross_domain_links" USING btree ("from_domain");--> statement-breakpoint
CREATE INDEX "kg_xdomain_to_idx" ON "kg_cross_domain_links" USING btree ("to_domain");--> statement-breakpoint
CREATE INDEX "kg_xdomain_type_idx" ON "kg_cross_domain_links" USING btree ("link_type");--> statement-breakpoint
CREATE INDEX "kg_entities_type_idx" ON "kg_entities" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "kg_entities_domain_idx" ON "kg_entities" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "kg_entities_canonical_idx" ON "kg_entities" USING btree ("canonical_id");--> statement-breakpoint
CREATE INDEX "kg_entities_name_idx" ON "kg_entities" USING btree ("name");--> statement-breakpoint
CREATE INDEX "kg_entities_active_idx" ON "kg_entities" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "kg_rel_from_idx" ON "kg_relationships" USING btree ("from_entity_id");--> statement-breakpoint
CREATE INDEX "kg_rel_to_idx" ON "kg_relationships" USING btree ("to_entity_id");--> statement-breakpoint
CREATE INDEX "kg_rel_type_idx" ON "kg_relationships" USING btree ("relationship_type");--> statement-breakpoint
CREATE INDEX "kg_rel_cross_domain_idx" ON "kg_relationships" USING btree ("is_cross_domain");--> statement-breakpoint
CREATE INDEX "kg_rel_from_domain_idx" ON "kg_relationships" USING btree ("from_domain");--> statement-breakpoint
CREATE INDEX "kg_rel_to_domain_idx" ON "kg_relationships" USING btree ("to_domain");--> statement-breakpoint
CREATE UNIQUE INDEX "kg_rel_unique_idx" ON "kg_relationships" USING btree ("from_entity_id","to_entity_id","relationship_type");--> statement-breakpoint
CREATE INDEX "lyte_alert_events_alert_idx" ON "lyte_alert_events" USING btree ("alert_id");--> statement-breakpoint
CREATE INDEX "lyte_alert_events_occurred_at_idx" ON "lyte_alert_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "lyte_alerts_service_idx" ON "lyte_alerts" USING btree ("service");--> statement-breakpoint
CREATE INDEX "lyte_alerts_status_idx" ON "lyte_alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lyte_escalations_status_idx" ON "lyte_escalations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lyte_escalations_severity_idx" ON "lyte_escalations" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "lyte_metrics_service_idx" ON "lyte_metrics" USING btree ("service");--> statement-breakpoint
CREATE INDEX "lyte_metrics_name_idx" ON "lyte_metrics" USING btree ("metric_name");--> statement-breakpoint
CREATE INDEX "lyte_metrics_recorded_at_idx" ON "lyte_metrics" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "lyte_priority_items_workspace_idx" ON "lyte_priority_items" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "lyte_priority_items_campaign_idx" ON "lyte_priority_items" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "lyte_priority_items_status_idx" ON "lyte_priority_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lyte_prism_scores_lens_idx" ON "lyte_prism_scores" USING btree ("lens");--> statement-breakpoint
CREATE INDEX "lyte_prism_scores_scored_at_idx" ON "lyte_prism_scores" USING btree ("scored_at");--> statement-breakpoint
CREATE INDEX "lyte_dashboards_user_idx" ON "lyte_dashboards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "lyte_dashboards_share_token_idx" ON "lyte_dashboards" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "lyte_signal_comments_signal_idx" ON "lyte_signal_comments" USING btree ("signal_id");--> statement-breakpoint
CREATE INDEX "lyte_signal_timeline_signal_idx" ON "lyte_signal_timeline" USING btree ("signal_id");--> statement-breakpoint
CREATE INDEX "corridors_org_idx" ON "corridors" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "corridors_status_idx" ON "corridors" USING btree ("status");--> statement-breakpoint
CREATE INDEX "corridors_risk_level_idx" ON "corridors" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "maritime_exceptions_org_idx" ON "maritime_exceptions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "maritime_exceptions_status_idx" ON "maritime_exceptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "maritime_exceptions_severity_idx" ON "maritime_exceptions" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "maritime_exceptions_vessel_idx" ON "maritime_exceptions" USING btree ("vessel_id");--> statement-breakpoint
CREATE INDEX "maritime_exceptions_detected_idx" ON "maritime_exceptions" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "maritime_vessels_org_idx" ON "maritime_vessels" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "maritime_vessels_status_idx" ON "maritime_vessels" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ports_org_idx" ON "ports" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "ports_country_idx" ON "ports" USING btree ("country");--> statement-breakpoint
CREATE INDEX "voyages_org_idx" ON "voyages" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "voyages_vessel_idx" ON "voyages" USING btree ("vessel_id");--> statement-breakpoint
CREATE INDEX "voyages_status_idx" ON "voyages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "voyages_created_idx" ON "voyages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "memory_links_source_idx" ON "memory_links" USING btree ("source_record_id");--> statement-breakpoint
CREATE INDEX "memory_links_target_idx" ON "memory_links" USING btree ("target_record_id");--> statement-breakpoint
CREATE INDEX "memory_links_type_idx" ON "memory_links" USING btree ("link_type");--> statement-breakpoint
CREATE INDEX "memory_records_tier_idx" ON "memory_records" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "memory_records_key_idx" ON "memory_records" USING btree ("key");--> statement-breakpoint
CREATE INDEX "memory_records_scope_idx" ON "memory_records" USING btree ("scope_id");--> statement-breakpoint
CREATE INDEX "memory_records_sensitivity_idx" ON "memory_records" USING btree ("sensitivity");--> statement-breakpoint
CREATE INDEX "memory_records_expires_idx" ON "memory_records" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "memory_records_stale_idx" ON "memory_records" USING btree ("is_stale");--> statement-breakpoint
CREATE INDEX "memory_records_created_idx" ON "memory_records" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "billing_line_items_org_idx" ON "billing_line_items" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "billing_line_items_period_idx" ON "billing_line_items" USING btree ("org_id","period_start");--> statement-breakpoint
CREATE INDEX "billing_meter_allotments_plan_idx" ON "billing_meter_allotments" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "billing_meter_allotments_meter_idx" ON "billing_meter_allotments" USING btree ("meter_id");--> statement-breakpoint
CREATE INDEX "billing_meters_key_idx" ON "billing_meters" USING btree ("key");--> statement-breakpoint
CREATE INDEX "billing_meters_product_idx" ON "billing_meters" USING btree ("product");--> statement-breakpoint
CREATE INDEX "cost_alloc_org_period_idx" ON "cost_allocations" USING btree ("org_id","period_start");--> statement-breakpoint
CREATE INDEX "cost_alloc_product_idx" ON "cost_allocations" USING btree ("product");--> statement-breakpoint
CREATE INDEX "metering_corrections_org_idx" ON "metering_corrections" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "metering_corrections_meter_idx" ON "metering_corrections" USING btree ("org_id","meter_key");--> statement-breakpoint
CREATE INDEX "metering_corrections_applied_idx" ON "metering_corrections" USING btree ("applied_at");--> statement-breakpoint
CREATE INDEX "metering_events_org_feature_idx" ON "metering_events" USING btree ("org_id","feature_key");--> statement-breakpoint
CREATE INDEX "metering_events_org_occurred_idx" ON "metering_events" USING btree ("org_id","occurred_at");--> statement-breakpoint
CREATE INDEX "metering_events_product_idx" ON "metering_events" USING btree ("product");--> statement-breakpoint
CREATE INDEX "metering_events_occurred_at_idx" ON "metering_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "quota_configs_org_feature_idx" ON "quota_configs" USING btree ("org_id","feature_key");--> statement-breakpoint
CREATE INDEX "quota_violations_org_idx" ON "quota_violations" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "quota_violations_occurred_idx" ON "quota_violations" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "rate_card_assign_org_idx" ON "rate_card_assignments" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "rate_card_tiers_card_idx" ON "rate_card_tiers" USING btree ("rate_card_id");--> statement-breakpoint
CREATE INDEX "rate_cards_feature_active_idx" ON "rate_cards" USING btree ("feature_key","is_active");--> statement-breakpoint
CREATE INDEX "rate_cards_product_idx" ON "rate_cards" USING btree ("product");--> statement-breakpoint
CREATE INDEX "usage_agg_org_period_idx" ON "usage_aggregates" USING btree ("org_id","period_start");--> statement-breakpoint
CREATE INDEX "usage_agg_feature_idx" ON "usage_aggregates" USING btree ("feature_key");--> statement-breakpoint
CREATE INDEX "usage_threshold_notif_org_idx" ON "usage_threshold_notifications" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_ml_ab_domain" ON "ml_ab_tests" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_ml_ab_status" ON "ml_ab_tests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ml_dataset_domain" ON "ml_datasets" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_ml_feature_def_domain" ON "ml_feature_definitions" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_ml_feature_val_entity" ON "ml_feature_values" USING btree ("entity_id","entity_type");--> statement-breakpoint
CREATE INDEX "idx_ml_feature_val_feature" ON "ml_feature_values" USING btree ("feature_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ml_feature_val_entity_feature" ON "ml_feature_values" USING btree ("feature_id","entity_id","entity_type");--> statement-breakpoint
CREATE INDEX "idx_ml_monitor_model" ON "ml_model_monitoring_snapshots" USING btree ("model_version_id");--> statement-breakpoint
CREATE INDEX "idx_ml_monitor_domain" ON "ml_model_monitoring_snapshots" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_ml_model_domain" ON "ml_model_versions" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_ml_model_lifecycle" ON "ml_model_versions" USING btree ("lifecycle");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ml_model_name_version" ON "ml_model_versions" USING btree ("model_name","version");--> statement-breakpoint
CREATE INDEX "idx_ml_pred_model" ON "ml_predictions" USING btree ("model_version_id");--> statement-breakpoint
CREATE INDEX "idx_ml_pred_entity" ON "ml_predictions" USING btree ("entity_id","entity_type");--> statement-breakpoint
CREATE INDEX "idx_ml_pred_domain" ON "ml_predictions" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_ml_training_domain" ON "ml_training_runs" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_ml_training_status" ON "ml_training_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "msp_contracts_client_idx" ON "msp_contracts" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "msp_devices_client_idx" ON "msp_devices" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "msp_devices_connector_idx" ON "msp_devices" USING btree ("connector_id");--> statement-breakpoint
CREATE INDEX "msp_tickets_client_idx" ON "msp_tickets" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "msp_tickets_assignee_idx" ON "msp_tickets" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "msp_tickets_status_idx" ON "msp_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "msp_healing_exec_playbook_idx" ON "msp_healing_executions" USING btree ("playbook_id");--> statement-breakpoint
CREATE INDEX "msp_healing_exec_device_idx" ON "msp_healing_executions" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "msp_healing_exec_status_idx" ON "msp_healing_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "msp_org_site_connector_idx" ON "msp_org_site_mappings" USING btree ("connector_id");--> statement-breakpoint
CREATE INDEX "msp_org_site_client_idx" ON "msp_org_site_mappings" USING btree ("internal_client_id");--> statement-breakpoint
CREATE INDEX "msp_remote_actions_device_idx" ON "msp_remote_actions" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "msp_remote_actions_status_idx" ON "msp_remote_actions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "msp_rmm_device_metrics_device_idx" ON "msp_rmm_device_metrics" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "msp_rmm_device_metrics_snapshot_idx" ON "msp_rmm_device_metrics" USING btree ("snapshot_at");--> statement-breakpoint
CREATE INDEX "cmd_session_comments_session_idx" ON "command_session_comments" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "cmd_session_comments_entity_idx" ON "command_session_comments" USING btree ("entity_id","entity_type");--> statement-breakpoint
CREATE INDEX "command_sessions_session_id_idx" ON "command_sessions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "command_sessions_org_idx" ON "command_sessions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "command_sessions_app_idx" ON "command_sessions" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "command_sessions_active_idx" ON "command_sessions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "nexus_memory_key_idx" ON "nexus_memory" USING btree ("key");--> statement-breakpoint
CREATE INDEX "nexus_memory_type_idx" ON "nexus_memory" USING btree ("type");--> statement-breakpoint
CREATE INDEX "nexus_memory_tier_idx" ON "nexus_memory" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "nexus_memory_pinned_idx" ON "nexus_memory" USING btree ("pinned");--> statement-breakpoint
CREATE INDEX "nexus_memory_updated_idx" ON "nexus_memory" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "nexus_edges_from_to_rel_idx" ON "nexus_edges" USING btree ("from_uri","to_uri","relation");--> statement-breakpoint
CREATE INDEX "nexus_edges_from_idx" ON "nexus_edges" USING btree ("from_uri");--> statement-breakpoint
CREATE INDEX "nexus_edges_to_idx" ON "nexus_edges" USING btree ("to_uri");--> statement-breakpoint
CREATE INDEX "nexus_edges_org_idx" ON "nexus_edges" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "nexus_entities_uri_idx" ON "nexus_entities" USING btree ("uri");--> statement-breakpoint
CREATE INDEX "nexus_entities_kind_idx" ON "nexus_entities" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "nexus_entities_org_idx" ON "nexus_entities" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "nexus_entities_source_idx" ON "nexus_entities" USING btree ("source_table","source_id");--> statement-breakpoint
CREATE INDEX "nexus_ingest_jobs_status_idx" ON "nexus_ingest_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nexus_ingest_jobs_created_idx" ON "nexus_ingest_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "nexus_orchestration_plans_status_idx" ON "nexus_orchestration_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nexus_orchestration_plans_created_idx" ON "nexus_orchestration_plans" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "nexus_protocol_tools_protocol_idx" ON "nexus_protocol_tools" USING btree ("protocol");--> statement-breakpoint
CREATE INDEX "nexus_protocol_tools_domain_idx" ON "nexus_protocol_tools" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "nexus_protocol_tools_custom_idx" ON "nexus_protocol_tools" USING btree ("is_custom");--> statement-breakpoint
CREATE INDEX "nexus_skills_enabled_idx" ON "nexus_skills" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "nexus_skills_pattern_idx" ON "nexus_skills" USING btree ("pattern");--> statement-breakpoint
CREATE INDEX "nexus_skills_primitive_idx" ON "nexus_skills" USING btree ("primitive_type");--> statement-breakpoint
CREATE INDEX "nexus_skills_custom_idx" ON "nexus_skills" USING btree ("is_custom");--> statement-breakpoint
CREATE INDEX "nexus_v1_sessions_org_idx" ON "nexus_v1_sessions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "nexus_v1_sessions_user_idx" ON "nexus_v1_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nexus_v1_sessions_updated_idx" ON "nexus_v1_sessions" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "nexus_v1_sessions_expires_idx" ON "nexus_v1_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "nexus_governed_workflows_status_idx" ON "nexus_governed_workflows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nexus_mcp_anomalies_severity_idx" ON "nexus_mcp_anomalies" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "nexus_mcp_anomalies_detected_at_idx" ON "nexus_mcp_anomalies" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "nexus_mcp_anomalies_acknowledged_idx" ON "nexus_mcp_anomalies" USING btree ("acknowledged");--> statement-breakpoint
CREATE INDEX "nexus_mcp_servers_health_idx" ON "nexus_mcp_external_servers" USING btree ("health_status");--> statement-breakpoint
CREATE INDEX "nexus_mcp_servers_enabled_idx" ON "nexus_mcp_external_servers" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "nexus_mcp_sessions_status_idx" ON "nexus_mcp_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nexus_mcp_sessions_started_at_idx" ON "nexus_mcp_sessions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "nexus_mcp_sessions_client_idx" ON "nexus_mcp_sessions" USING btree ("client_identity");--> statement-breakpoint
CREATE INDEX "nexus_mcp_sessions_server_idx" ON "nexus_mcp_sessions" USING btree ("server_identity");--> statement-breakpoint
CREATE INDEX "nexus_mcp_tool_calls_session_idx" ON "nexus_mcp_tool_calls" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "nexus_mcp_tool_calls_occurred_at_idx" ON "nexus_mcp_tool_calls" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "nexus_mcp_tool_calls_tool_idx" ON "nexus_mcp_tool_calls" USING btree ("tool_name");--> statement-breakpoint
CREATE INDEX "email_send_log_notification_idx" ON "email_send_log" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "email_send_log_status_idx" ON "email_send_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_send_log_sent_at_idx" ON "email_send_log" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX "prompt_evolution_agent_idx" ON "agent_prompt_evolution" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "prompt_evolution_status_idx" ON "agent_prompt_evolution" USING btree ("status");--> statement-breakpoint
CREATE INDEX "prompt_evolution_created_idx" ON "agent_prompt_evolution" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "multi_hyp_created_idx" ON "multi_hypothesis_sessions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orch_telemetry_timestamp_idx" ON "orchestration_telemetry" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "orch_telemetry_id_idx" ON "orchestration_telemetry" USING btree ("orchestration_id");--> statement-breakpoint
CREATE INDEX "precompute_expires_idx" ON "predictive_precompute_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "precompute_key_idx" ON "predictive_precompute_cache" USING btree ("cache_key");--> statement-breakpoint
CREATE INDEX "red_team_orch_idx" ON "red_team_findings" USING btree ("orchestration_id");--> statement-breakpoint
CREATE INDEX "red_team_created_idx" ON "red_team_findings" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "on_call_handoff_notifications_dedup" ON "on_call_handoff_notifications" USING btree ("team","handoff_at","kind","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "on_call_schedules_team_unique" ON "on_call_schedules" USING btree ("team");--> statement-breakpoint
CREATE INDEX "on_call_shifts_team_range_idx" ON "on_call_shifts" USING btree ("team","start_at","end_at");--> statement-breakpoint
CREATE INDEX "org_members_org_id_idx" ON "org_members" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "org_members_user_id_idx" ON "org_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ot_ics_scores_asset_bucket_unique" ON "ot_ics_anomaly_scores" USING btree ("asset_id","bucket_at");--> statement-breakpoint
CREATE INDEX "ot_ics_scores_asset_idx" ON "ot_ics_anomaly_scores" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "ot_ics_scores_bucket_idx" ON "ot_ics_anomaly_scores" USING btree ("bucket_at");--> statement-breakpoint
CREATE INDEX "ot_ics_assets_zone_idx" ON "ot_ics_assets" USING btree ("zone");--> statement-breakpoint
CREATE INDEX "ot_ics_assets_protocol_idx" ON "ot_ics_assets" USING btree ("protocol");--> statement-breakpoint
CREATE UNIQUE INDEX "ot_ics_conv_session_seq_unique" ON "ot_ics_conversations" USING btree ("session_id","seq");--> statement-breakpoint
CREATE INDEX "ot_ics_conv_session_idx" ON "ot_ics_conversations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "ot_ics_frames_observed_at_idx" ON "ot_ics_decoded_frames" USING btree ("observed_at");--> statement-breakpoint
CREATE INDEX "ot_ics_frames_protocol_idx" ON "ot_ics_decoded_frames" USING btree ("protocol");--> statement-breakpoint
CREATE INDEX "ot_ics_frames_asset_idx" ON "ot_ics_decoded_frames" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "ot_ics_frames_triage_idx" ON "ot_ics_decoded_frames" USING btree ("triage_status");--> statement-breakpoint
CREATE INDEX "outcome_learning_org_idx" ON "outcome_graph_learning_jobs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "outcome_learning_domain_idx" ON "outcome_graph_learning_jobs" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "outcome_learning_status_idx" ON "outcome_graph_learning_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "outcome_graph_org_idx" ON "outcome_graph" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "outcome_graph_domain_idx" ON "outcome_graph" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "outcome_graph_entity_idx" ON "outcome_graph" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "outcome_graph_status_idx" ON "outcome_graph" USING btree ("status");--> statement-breakpoint
CREATE INDEX "outcome_graph_agent_idx" ON "outcome_graph" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "outcome_graph_created_idx" ON "outcome_graph" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "outcome_graph_correlation_idx" ON "outcome_graph" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "capital_contributions_scenario_idx" ON "capital_contributions" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "cert_readiness_scenario_idx" ON "certification_readiness_records" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "control_roles_scenario_idx" ON "control_roles" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "governance_documents_scenario_idx" ON "governance_documents" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "legal_review_flags_scenario_idx" ON "legal_review_flags" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "legal_review_flags_status_idx" ON "legal_review_flags" USING btree ("status");--> statement-breakpoint
CREATE INDEX "manager_roles_scenario_idx" ON "manager_roles" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "officer_roles_scenario_idx" ON "officer_roles" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "ownership_allocations_scenario_idx" ON "ownership_allocations" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "ownership_decision_logs_scenario_idx" ON "ownership_decision_logs" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "ownership_decision_logs_occurred_at_idx" ON "ownership_decision_logs" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "ownership_scenarios_status_idx" ON "ownership_scenarios" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ownership_scenarios_is_active_idx" ON "ownership_scenarios" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "signature_authority_scenario_idx" ON "signature_authority_records" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "voting_rights_scenario_idx" ON "voting_rights" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "pve_session_idx" ON "page_view_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "pve_occurred_idx" ON "page_view_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "pve_path_idx" ON "page_view_events" USING btree ("path");--> statement-breakpoint
CREATE INDEX "org_branding_org_id_idx" ON "org_branding" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_custom_domains_domain_idx" ON "org_custom_domains" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "org_custom_domains_org_id_idx" ON "org_custom_domains" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "org_custom_domains_status_idx" ON "org_custom_domains" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "partner_accounts_slug_idx" ON "partner_accounts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "partner_accounts_owner_idx" ON "partner_accounts" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "partner_accounts_status_idx" ON "partner_accounts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "partner_org_assignments_partner_idx" ON "partner_org_assignments" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "partner_org_assignments_org_idx" ON "partner_org_assignments" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "partner_users_partner_idx" ON "partner_users" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "partner_users_user_idx" ON "partner_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pipeline_deal_events_deal_idx" ON "pipeline_deal_events" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "pipeline_deal_events_org_idx" ON "pipeline_deal_events" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pipeline_deal_events_created_idx" ON "pipeline_deal_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "pipeline_deals_org_idx" ON "pipeline_deals" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pipeline_deals_stage_idx" ON "pipeline_deals" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "pipeline_deals_updated_idx" ON "pipeline_deals" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "platform_events_source_app_idx" ON "platform_events" USING btree ("source_app");--> statement-breakpoint
CREATE INDEX "platform_events_entity_type_idx" ON "platform_events" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "platform_events_severity_idx" ON "platform_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "platform_events_timestamp_idx" ON "platform_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "platform_events_trace_idx" ON "platform_events" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "idx_status_checks_svc_ts" ON "platform_status_checks" USING btree ("service_id","checked_at");--> statement-breakpoint
CREATE INDEX "pc_claims_matter_id_idx" ON "pc_claims" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_damages_matter_id_idx" ON "pc_damages" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_deadlines_matter_id_idx" ON "pc_deadlines" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_deadlines_due_date_idx" ON "pc_deadlines" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "pc_matters_org_id_idx" ON "pc_matters" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_matters_status_idx" ON "pc_matters" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pc_medical_events_matter_id_idx" ON "pc_medical_events" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_offers_matter_id_idx" ON "pc_offers" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_parties_matter_id_idx" ON "pc_parties" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_approval_evidence_req_idx" ON "pc_approval_evidence" USING btree ("approval_request_id");--> statement-breakpoint
CREATE INDEX "pc_audit_packets_matter_idx" ON "pc_audit_packets" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_audit_packets_type_idx" ON "pc_audit_packets" USING btree ("packet_type");--> statement-breakpoint
CREATE INDEX "pc_contradiction_matter_idx" ON "pc_contradiction_panel" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_contradiction_status_idx" ON "pc_contradiction_panel" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pc_copilot_drafts_matter_idx" ON "pc_copilot_drafts" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_copilot_drafts_org_idx" ON "pc_copilot_drafts" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_copilot_drafts_state_idx" ON "pc_copilot_drafts" USING btree ("review_state");--> statement-breakpoint
CREATE INDEX "pc_dash_snap_org_type_idx" ON "pc_dashboard_snapshots" USING btree ("org_id","dashboard_type");--> statement-breakpoint
CREATE INDEX "pc_dash_snap_computed_idx" ON "pc_dashboard_snapshots" USING btree ("computed_at");--> statement-breakpoint
CREATE INDEX "pc_gql_audit_org_idx" ON "pc_graphql_audit_logs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_gql_audit_op_idx" ON "pc_graphql_audit_logs" USING btree ("operation_name");--> statement-breakpoint
CREATE INDEX "pc_gql_audit_created_idx" ON "pc_graphql_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "pc_gql_tags_log_idx" ON "pc_graphql_audit_tags" USING btree ("audit_log_id");--> statement-breakpoint
CREATE INDEX "pc_incidents_org_idx" ON "pc_incidents" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_incidents_status_idx" ON "pc_incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pc_m365_cal_matter_idx" ON "pc_m365_calendar_events" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_m365_cal_event_id_idx" ON "pc_m365_calendar_events" USING btree ("calendar_event_id");--> statement-breakpoint
CREATE INDEX "pc_m365_sp_matter_idx" ON "pc_m365_sharepoint_files" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_m365_sp_drive_item_idx" ON "pc_m365_sharepoint_files" USING btree ("drive_item_id");--> statement-breakpoint
CREATE INDEX "pc_m365_teams_matter_idx" ON "pc_m365_teams_messages" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_m365_teams_msg_id_idx" ON "pc_m365_teams_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "pc_twin_sp_matter_idx" ON "pc_matter_twin_subpages" USING btree ("matter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pc_twin_sp_matter_subpage_idx" ON "pc_matter_twin_subpages" USING btree ("matter_id","subpage");--> statement-breakpoint
CREATE INDEX "pc_onboard_org_idx" ON "pc_onboarding_checklist" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pc_onboard_org_step_idx" ON "pc_onboarding_checklist" USING btree ("org_id","step");--> statement-breakpoint
CREATE INDEX "pc_ops_flow_matter_idx" ON "pc_operational_flow_runs" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_ops_flow_type_idx" ON "pc_operational_flow_runs" USING btree ("flow_type");--> statement-breakpoint
CREATE INDEX "pc_ops_flow_status_idx" ON "pc_operational_flow_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pc_org_roles_org_user_idx" ON "pc_org_roles" USING btree ("org_id","user_id");--> statement-breakpoint
CREATE INDEX "pc_org_roles_matter_idx" ON "pc_org_roles" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_pg_dim_matter_idx" ON "pc_pressure_graph_dimensions" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_pg_dim_type_idx" ON "pc_pressure_graph_dimensions" USING btree ("dimension");--> statement-breakpoint
CREATE INDEX "pc_pg_dim_computed_idx" ON "pc_pressure_graph_dimensions" USING btree ("computed_at");--> statement-breakpoint
CREATE INDEX "pc_pg_watchlist_matter_idx" ON "pc_pressure_watchlist" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_schema_reg_subgraph_idx" ON "pc_schema_registry" USING btree ("subgraph_name");--> statement-breakpoint
CREATE INDEX "pc_svc_metrics_service_idx" ON "pc_service_metrics" USING btree ("service");--> statement-breakpoint
CREATE INDEX "pc_svc_metrics_org_idx" ON "pc_service_metrics" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_svc_metrics_measured_idx" ON "pc_service_metrics" USING btree ("measured_at");--> statement-breakpoint
CREATE INDEX "pc_sf_runs_org_idx" ON "pc_signal_forge_runs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_sf_runs_stage_idx" ON "pc_signal_forge_runs" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "pc_sig_quality_signal_idx" ON "pc_signal_quality_scores" USING btree ("signal_id");--> statement-breakpoint
CREATE INDEX "pc_sig_quality_org_idx" ON "pc_signal_quality_scores" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_tenant_config_org_idx" ON "pc_tenant_config" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_bg_jobs_status_idx" ON "pc_background_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pc_bg_jobs_type_idx" ON "pc_background_jobs" USING btree ("job_type");--> statement-breakpoint
CREATE INDEX "pc_bg_jobs_org_idx" ON "pc_background_jobs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_bg_jobs_idempotency_idx" ON "pc_background_jobs" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "pc_docs_matter_idx" ON "pc_documents" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_docs_org_idx" ON "pc_documents" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_docs_checksum_idx" ON "pc_documents" USING btree ("checksum");--> statement-breakpoint
CREATE INDEX "pc_emails_matter_idx" ON "pc_emails" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_emails_msg_id_idx" ON "pc_emails" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "pc_extract_doc_idx" ON "pc_extraction_jobs" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "pc_extract_status_idx" ON "pc_extraction_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pc_notif_user_idx" ON "pc_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pc_notif_org_idx" ON "pc_notifications" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_source_system_idx" ON "pc_source_items" USING btree ("source_system","source_record_id");--> statement-breakpoint
CREATE INDEX "pc_webhook_status_idx" ON "pc_webhook_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pc_webhook_expires_idx" ON "pc_webhook_subscriptions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "pc_carrier_pat_org_idx" ON "pc_carrier_behavior_patterns" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_carrier_pat_name_idx" ON "pc_carrier_behavior_patterns" USING btree ("carrier_name");--> statement-breakpoint
CREATE INDEX "pc_carrier_pat_type_idx" ON "pc_carrier_behavior_patterns" USING btree ("pattern_type");--> statement-breakpoint
CREATE INDEX "pc_offer_beh_matter_idx" ON "pc_carrier_offer_behavior" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_offer_beh_org_idx" ON "pc_carrier_offer_behavior" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_reserve_beh_matter_idx" ON "pc_carrier_reserve_behavior" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_reserve_beh_org_idx" ON "pc_carrier_reserve_behavior" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_carrier_ev_matter_idx" ON "pc_carrier_response_events" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_carrier_ev_org_idx" ON "pc_carrier_response_events" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_carrier_ev_type_idx" ON "pc_carrier_response_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "pc_silence_matter_idx" ON "pc_carrier_silence_windows" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_silence_org_idx" ON "pc_carrier_silence_windows" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_silence_current_idx" ON "pc_carrier_silence_windows" USING btree ("is_current");--> statement-breakpoint
CREATE INDEX "pc_ip_drivers_matter_idx" ON "pc_insurer_pressure_drivers" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_ip_drivers_snap_idx" ON "pc_insurer_pressure_drivers" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "pc_ip_snap_matter_idx" ON "pc_insurer_pressure_snapshots" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_ip_snap_org_idx" ON "pc_insurer_pressure_snapshots" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_ip_snap_computed_idx" ON "pc_insurer_pressure_snapshots" USING btree ("computed_at");--> statement-breakpoint
CREATE INDEX "pc_mv_rec_matter_idx" ON "pc_movement_recommendations" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_mv_rec_org_idx" ON "pc_movement_recommendations" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_mv_rec_status_idx" ON "pc_movement_recommendations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pc_pa_effect_org_idx" ON "pc_portfolio_action_effectiveness" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_pa_effect_action_idx" ON "pc_portfolio_action_effectiveness" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "pc_pb_snap_org_idx" ON "pc_portfolio_benchmark_snapshots" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_pb_snap_type_idx" ON "pc_portfolio_benchmark_snapshots" USING btree ("benchmark_type");--> statement-breakpoint
CREATE INDEX "pc_pm_cohort_org_idx" ON "pc_portfolio_matter_cohorts" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_pm_cohort_type_idx" ON "pc_portfolio_matter_cohorts" USING btree ("cohort_type");--> statement-breakpoint
CREATE INDEX "pc_pm_cohort_matter_idx" ON "pc_portfolio_matter_cohorts" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_ptl_metrics_org_idx" ON "pc_portfolio_team_lag_metrics" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_ptl_metrics_type_idx" ON "pc_portfolio_team_lag_metrics" USING btree ("metric_type");--> statement-breakpoint
CREATE INDEX "pc_qr_snap_matter_idx" ON "pc_quiet_risk_snapshots" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_qr_snap_org_idx" ON "pc_quiet_risk_snapshots" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_sf_drivers_matter_idx" ON "pc_settlement_friction_drivers" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_sf_drivers_snap_idx" ON "pc_settlement_friction_drivers" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "pc_sf_snap_matter_idx" ON "pc_settlement_friction_snapshots" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_sf_snap_org_idx" ON "pc_settlement_friction_snapshots" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_sf_snap_computed_idx" ON "pc_settlement_friction_snapshots" USING btree ("computed_at");--> statement-breakpoint
CREATE INDEX "pc_wl_county_org_idx" ON "pc_worldline_county_profiles" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_wl_county_name_idx" ON "pc_worldline_county_profiles" USING btree ("county");--> statement-breakpoint
CREATE INDEX "pc_wl_recovery_org_idx" ON "pc_worldline_recovery_markers" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_wl_recovery_matter_idx" ON "pc_worldline_recovery_markers" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_wl_reg_org_idx" ON "pc_worldline_regulatory_events" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_wl_reg_source_idx" ON "pc_worldline_regulatory_events" USING btree ("source");--> statement-breakpoint
CREATE INDEX "pc_wl_reg_effective_idx" ON "pc_worldline_regulatory_events" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "pc_wl_overlay_matter_idx" ON "pc_worldline_signal_overlays" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_wl_overlay_org_idx" ON "pc_worldline_signal_overlays" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_wl_overlay_class_idx" ON "pc_worldline_signal_overlays" USING btree ("source_class");--> statement-breakpoint
CREATE INDEX "pc_wl_sc_org_idx" ON "pc_worldline_source_classes" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_wl_sc_class_idx" ON "pc_worldline_source_classes" USING btree ("class_key");--> statement-breakpoint
CREATE INDEX "pc_wl_weather_org_idx" ON "pc_worldline_weather_events" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_wl_weather_onset_idx" ON "pc_worldline_weather_events" USING btree ("onset_at");--> statement-breakpoint
CREATE INDEX "pc_wl_weather_county_idx" ON "pc_worldline_weather_events" USING btree ("county");--> statement-breakpoint
CREATE INDEX "pc_purview_case_links_matter_idx" ON "pc_purview_case_links" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_purview_case_links_org_idx" ON "pc_purview_case_links" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_purview_case_links_ediscovery_idx" ON "pc_purview_case_links" USING btree ("ediscovery_case_id");--> statement-breakpoint
CREATE INDEX "pc_purview_diag_org_idx" ON "pc_purview_diagnostics" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_purview_diag_status_idx" ON "pc_purview_diagnostics" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pc_purview_diag_check_idx" ON "pc_purview_diagnostics" USING btree ("check_type");--> statement-breakpoint
CREATE INDEX "pc_purview_export_matter_idx" ON "pc_purview_export_handoffs" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_purview_export_org_idx" ON "pc_purview_export_handoffs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_purview_export_status_idx" ON "pc_purview_export_handoffs" USING btree ("export_status");--> statement-breakpoint
CREATE INDEX "pc_purview_hold_matter_idx" ON "pc_purview_hold_awareness" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_purview_hold_org_idx" ON "pc_purview_hold_awareness" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_purview_hold_status_idx" ON "pc_purview_hold_awareness" USING btree ("hold_status");--> statement-breakpoint
CREATE INDEX "pc_purview_scope_matter_idx" ON "pc_purview_scope_links" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_purview_scope_org_idx" ON "pc_purview_scope_links" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_recovery_dep_item_idx" ON "pc_recovery_dependency_links" USING btree ("recovery_item_id");--> statement-breakpoint
CREATE INDEX "pc_recovery_followup_item_idx" ON "pc_recovery_followups" USING btree ("recovery_item_id");--> statement-breakpoint
CREATE INDEX "pc_recovery_followup_status_idx" ON "pc_recovery_followups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pc_recovery_matter_idx" ON "pc_recovery_items" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_recovery_org_idx" ON "pc_recovery_items" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_recovery_state_idx" ON "pc_recovery_items" USING btree ("lifecycle_state");--> statement-breakpoint
CREATE INDEX "pc_recovery_blocks_idx" ON "pc_recovery_items" USING btree ("blocks_settlement");--> statement-breakpoint
CREATE INDEX "pc_recovery_risk_matter_idx" ON "pc_recovery_risk_snapshots" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_recovery_hist_item_idx" ON "pc_recovery_status_history" USING btree ("recovery_item_id");--> statement-breakpoint
CREATE INDEX "pc_blocker_actions_blocker_idx" ON "pc_settlement_blocker_actions" USING btree ("blocker_id");--> statement-breakpoint
CREATE INDEX "pc_blocker_snap_matter_idx" ON "pc_settlement_blocker_snapshots" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_blockers_matter_idx" ON "pc_settlement_blockers" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_blockers_org_idx" ON "pc_settlement_blockers" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_blockers_severity_idx" ON "pc_settlement_blockers" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "pc_blockers_status_idx" ON "pc_settlement_blockers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pc_mra_item_idx" ON "pc_managed_review_assignments" USING btree ("review_item_id");--> statement-breakpoint
CREATE INDEX "pc_mra_assigned_idx" ON "pc_managed_review_assignments" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "pc_mri_org_idx" ON "pc_managed_review_items" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_mri_matter_idx" ON "pc_managed_review_items" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_mri_state_idx" ON "pc_managed_review_items" USING btree ("lifecycle_state");--> statement-breakpoint
CREATE INDEX "pc_mri_worktype_idx" ON "pc_managed_review_items" USING btree ("review_work_type");--> statement-breakpoint
CREATE INDEX "pc_mri_priority_idx" ON "pc_managed_review_items" USING btree ("priority_score");--> statement-breakpoint
CREATE INDEX "pc_mri_assigned_idx" ON "pc_managed_review_items" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "pc_mrmet_org_idx" ON "pc_managed_review_metrics" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_mrmet_period_idx" ON "pc_managed_review_metrics" USING btree ("period_start");--> statement-breakpoint
CREATE INDEX "pc_mrmet_type_idx" ON "pc_managed_review_metrics" USING btree ("review_work_type");--> statement-breakpoint
CREATE INDEX "pc_mrn_item_idx" ON "pc_managed_review_notes" USING btree ("review_item_id");--> statement-breakpoint
CREATE INDEX "pc_mrs_org_idx" ON "pc_managed_review_slas" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_mrs_type_idx" ON "pc_managed_review_slas" USING btree ("review_work_type");--> statement-breakpoint
CREATE INDEX "pc_rae_org_idx" ON "pc_review_audit_events" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_rae_item_idx" ON "pc_review_audit_events" USING btree ("review_item_id");--> statement-breakpoint
CREATE INDEX "pc_rae_matter_idx" ON "pc_review_audit_events" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_copilot_msgs_session_idx" ON "pc_copilot_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "pc_copilot_sessions_user_idx" ON "pc_copilot_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pc_copilot_sessions_matter_idx" ON "pc_copilot_sessions" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_copilot_sessions_org_idx" ON "pc_copilot_sessions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_cost_org_idx" ON "pc_cost_tracking" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_cost_category_idx" ON "pc_cost_tracking" USING btree ("cost_category");--> statement-breakpoint
CREATE INDEX "pc_cost_period_idx" ON "pc_cost_tracking" USING btree ("period_start");--> statement-breakpoint
CREATE INDEX "pc_data_product_matter_idx" ON "pc_data_product_scores" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_data_product_type_idx" ON "pc_data_product_scores" USING btree ("product");--> statement-breakpoint
CREATE INDEX "pc_data_product_org_idx" ON "pc_data_product_scores" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_forecast_diff_matter_idx" ON "pc_forecast_diffs" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_forecast_diff_type_idx" ON "pc_forecast_diffs" USING btree ("forecast_type");--> statement-breakpoint
CREATE INDEX "pc_forecast_diff_org_idx" ON "pc_forecast_diffs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_hf_endpoints_task_idx" ON "pc_hf_endpoints" USING btree ("task");--> statement-breakpoint
CREATE INDEX "pc_hf_endpoints_org_idx" ON "pc_hf_endpoints" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_m365_delta_org_idx" ON "pc_m365_delta_cursors" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_m365_delta_resource_idx" ON "pc_m365_delta_cursors" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "pc_m365_sub_org_idx" ON "pc_m365_subscriptions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_m365_sub_status_idx" ON "pc_m365_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pc_twin_snap_matter_idx" ON "pc_matter_twin_snapshots" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_twin_snap_org_idx" ON "pc_matter_twin_snapshots" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_twin_snap_created_idx" ON "pc_matter_twin_snapshots" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "pc_model_lanes_lane_idx" ON "pc_model_lanes" USING btree ("lane");--> statement-breakpoint
CREATE INDEX "pc_model_lanes_org_idx" ON "pc_model_lanes" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_model_req_lane_idx" ON "pc_model_requests" USING btree ("lane");--> statement-breakpoint
CREATE INDEX "pc_model_req_org_idx" ON "pc_model_requests" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_model_req_created_idx" ON "pc_model_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "pc_pressure_matter_idx" ON "pc_pressure_scores" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_pressure_dim_idx" ON "pc_pressure_scores" USING btree ("dimension");--> statement-breakpoint
CREATE INDEX "pc_pressure_org_idx" ON "pc_pressure_scores" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_proof_chain_matter_idx" ON "pc_proof_chain_entries" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_proof_chain_type_idx" ON "pc_proof_chain_entries" USING btree ("output_type");--> statement-breakpoint
CREATE INDEX "pc_proof_chain_org_idx" ON "pc_proof_chain_entries" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_proof_chain_review_idx" ON "pc_proof_chain_entries" USING btree ("review_state");--> statement-breakpoint
CREATE INDEX "pc_wl_features_matter_idx" ON "pc_worldline_features" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "pc_wl_features_org_idx" ON "pc_worldline_features" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_wl_signals_class_idx" ON "pc_worldline_signals" USING btree ("source_class");--> statement-breakpoint
CREATE INDEX "pc_wl_signals_org_idx" ON "pc_worldline_signals" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "pc_wl_signals_created_idx" ON "pc_worldline_signals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "pc_wl_sources_class_idx" ON "pc_worldline_sources" USING btree ("source_class");--> statement-breakpoint
CREATE INDEX "pc_wl_sources_org_idx" ON "pc_worldline_sources" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "proof_chain_org_idx" ON "proof_chain" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "proof_chain_content_idx" ON "proof_chain" USING btree ("content_id","content_type");--> statement-breakpoint
CREATE INDEX "proof_chain_review_state_idx" ON "proof_chain" USING btree ("review_state");--> statement-breakpoint
CREATE INDEX "proof_chain_source_class_idx" ON "proof_chain" USING btree ("source_class");--> statement-breakpoint
CREATE INDEX "proof_chain_generated_at_idx" ON "proof_chain" USING btree ("generated_at");--> statement-breakpoint
CREATE INDEX "proof_chain_correlation_idx" ON "proof_chain" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "pulse_briefing_pubs_org_briefing_idx" ON "pulse_briefing_publications" USING btree ("org_id","briefing_id");--> statement-breakpoint
CREATE INDEX "pulse_briefing_pubs_org_created_idx" ON "pulse_briefing_publications" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pulse_org_deliveries_pub_user_channel_unique" ON "pulse_org_publication_deliveries" USING btree ("publication_id","user_id","channel");--> statement-breakpoint
CREATE INDEX "pulse_org_deliveries_pub_status_idx" ON "pulse_org_publication_deliveries" USING btree ("publication_id","status");--> statement-breakpoint
CREATE INDEX "pulse_org_deliveries_retry_idx" ON "pulse_org_publication_deliveries" USING btree ("next_retry_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pulse_org_user_prefs_user_unique" ON "pulse_org_user_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pulse_personalized_narratives_user_date_unique" ON "pulse_personalized_narratives" USING btree ("user_id","date_key");--> statement-breakpoint
CREATE UNIQUE INDEX "pulse_saved_briefings_user_briefing_unique" ON "pulse_saved_briefings" USING btree ("user_id","briefing_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pulse_watchlist_user_entity_unique" ON "pulse_watchlist" USING btree ("user_id","entity_uri");--> statement-breakpoint
CREATE INDEX "rag_chunks_tenant_id_idx" ON "rag_knowledge_chunks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "rag_chunks_source_type_idx" ON "rag_knowledge_chunks" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "rag_chunks_domain_idx" ON "rag_knowledge_chunks" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "rag_chunks_sensitivity_idx" ON "rag_knowledge_chunks" USING btree ("sensitivity_level");--> statement-breakpoint
CREATE INDEX "rag_chunks_object_id_idx" ON "rag_knowledge_chunks" USING btree ("object_id");--> statement-breakpoint
CREATE INDEX "rag_chunks_created_idx" ON "rag_knowledge_chunks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "rag_docs_domain_idx" ON "rag_knowledge_documents" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "rag_docs_source_type_idx" ON "rag_knowledge_documents" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "recommendations_entity_type_idx" ON "recommendations" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "recommendations_entity_id_idx" ON "recommendations" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "recommendations_domain_idx" ON "recommendations" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "recommendations_score_idx" ON "recommendations" USING btree ("score");--> statement-breakpoint
CREATE INDEX "recommendations_created_idx" ON "recommendations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "eval_baselines_suite_model_idx" ON "eval_baselines" USING btree ("suite_id","model");--> statement-breakpoint
CREATE INDEX "eval_baselines_recorded_at_idx" ON "eval_baselines" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "replay_runs_scenario_id_idx" ON "replay_runs" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "replay_runs_started_at_idx" ON "replay_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "replay_scenarios_domain_idx" ON "replay_scenarios" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "replay_scenarios_updated_at_idx" ON "replay_scenarios" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "replay_snapshots_scenario_id_idx" ON "replay_snapshots" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "replay_snapshots_domain_idx" ON "replay_snapshots" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "replay_snapshots_type_idx" ON "replay_snapshots" USING btree ("snapshot_type");--> statement-breakpoint
CREATE INDEX "revenue_events_product_idx" ON "revenue_events" USING btree ("product");--> statement-breakpoint
CREATE INDEX "revenue_events_event_type_idx" ON "revenue_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "revenue_events_customer_idx" ON "revenue_events" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "revenue_events_occurred_at_idx" ON "revenue_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "scim_group_member_unique" ON "scim_group_members" USING btree ("group_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scim_groups_tenant_external_idx" ON "scim_groups" USING btree ("tenant_id","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scim_provisioned_users_tenant_user_idx" ON "scim_provisioned_users" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "self_healing_patterns_key_idx" ON "self_healing_patterns" USING btree ("pattern_key");--> statement-breakpoint
CREATE INDEX "self_healing_patterns_enabled_idx" ON "self_healing_patterns" USING btree ("enabled");--> statement-breakpoint
CREATE UNIQUE INDEX "self_healing_runs_key_idx" ON "self_healing_runs" USING btree ("run_key");--> statement-breakpoint
CREATE INDEX "self_healing_runs_pattern_idx" ON "self_healing_runs" USING btree ("pattern_key");--> statement-breakpoint
CREATE INDEX "self_healing_runs_status_idx" ON "self_healing_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "self_healing_runs_detected_idx" ON "self_healing_runs" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "agent_perf_snapshots_agent_idx" ON "agent_performance_snapshots" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_self_reflections_agent_idx" ON "agent_self_reflections" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "sentra_alerts_status_idx" ON "sentra_alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sentra_alerts_severity_idx" ON "sentra_alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "sentra_alerts_detected_at_idx" ON "sentra_alerts" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "sentra_incidents_status_idx" ON "sentra_incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sentra_incidents_severity_idx" ON "sentra_incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "sentra_incidents_detected_at_idx" ON "sentra_incidents" USING btree ("detected_at");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_settings_ns_key_uq" ON "platform_settings" USING btree ("namespace","key");--> statement-breakpoint
CREATE INDEX "settings_audit_tier_setting_idx" ON "settings_audit_log" USING btree ("tier","setting_id");--> statement-breakpoint
CREATE INDEX "settings_audit_actor_idx" ON "settings_audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "settings_audit_org_idx" ON "settings_audit_log" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "settings_audit_created_at_idx" ON "settings_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_health_org_period_uq" ON "tenant_health_scorecards" USING btree ("org_id","period_start");--> statement-breakpoint
CREATE INDEX "tenant_health_org_idx" ON "tenant_health_scorecards" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "tenant_health_score_idx" ON "tenant_health_scorecards" USING btree ("health_score");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_settings_org_ns_key_uq" ON "tenant_settings" USING btree ("org_id","namespace","key");--> statement-breakpoint
CREATE INDEX "tenant_settings_org_idx" ON "tenant_settings" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_settings_user_org_ns_key_uq" ON "user_settings" USING btree ("user_id","org_id","namespace","key");--> statement-breakpoint
CREATE INDEX "user_settings_user_idx" ON "user_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mesh_entity_snapshots_domain_idx" ON "mesh_entity_snapshots" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "mesh_entity_snapshots_entity_type_idx" ON "mesh_entity_snapshots" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "mesh_entity_snapshots_health_idx" ON "mesh_entity_snapshots" USING btree ("health");--> statement-breakpoint
CREATE INDEX "mesh_entity_snapshots_tenant_id_idx" ON "mesh_entity_snapshots" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "mesh_evidence_entity_links_entity_id_idx" ON "mesh_evidence_entity_links" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "mesh_evidence_entity_links_evidence_id_idx" ON "mesh_evidence_entity_links" USING btree ("evidence_id");--> statement-breakpoint
CREATE INDEX "mesh_evidence_items_domain_idx" ON "mesh_evidence_items" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "mesh_evidence_items_type_idx" ON "mesh_evidence_items" USING btree ("type");--> statement-breakpoint
CREATE INDEX "mesh_evidence_items_signal_id_idx" ON "mesh_evidence_items" USING btree ("signal_id");--> statement-breakpoint
CREATE INDEX "mesh_evidence_items_observed_at_idx" ON "mesh_evidence_items" USING btree ("observed_at");--> statement-breakpoint
CREATE INDEX "mesh_recommendation_decisions_recommendation_id_idx" ON "mesh_recommendation_decisions" USING btree ("recommendation_id");--> statement-breakpoint
CREATE INDEX "mesh_recommendation_decisions_actor_id_idx" ON "mesh_recommendation_decisions" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "mesh_recommendation_decisions_org_id_idx" ON "mesh_recommendation_decisions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "mesh_recommendation_decisions_decided_at_idx" ON "mesh_recommendation_decisions" USING btree ("decided_at");--> statement-breakpoint
CREATE INDEX "mesh_recommendations_domain_idx" ON "mesh_recommendations" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "mesh_recommendations_status_idx" ON "mesh_recommendations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mesh_recommendations_tenant_id_idx" ON "mesh_recommendations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "mesh_recommendations_generated_at_idx" ON "mesh_recommendations" USING btree ("generated_at");--> statement-breakpoint
CREATE INDEX "mesh_signals_domain_idx" ON "mesh_signals" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "mesh_signals_type_idx" ON "mesh_signals" USING btree ("type");--> statement-breakpoint
CREATE INDEX "mesh_signals_tenant_id_idx" ON "mesh_signals" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "mesh_signals_occurred_at_idx" ON "mesh_signals" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "mesh_signals_received_at_idx" ON "mesh_signals" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "signal_bus_dead_letters_rule_id_idx" ON "signal_bus_dead_letters" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "signal_bus_dead_letters_created_at_idx" ON "signal_bus_dead_letters" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "signal_bus_routed_events_rule_id_idx" ON "signal_bus_routed_events" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "signal_bus_routed_events_source_signal_idx" ON "signal_bus_routed_events" USING btree ("source_signal_id");--> statement-breakpoint
CREATE INDEX "signal_bus_routed_events_routed_at_idx" ON "signal_bus_routed_events" USING btree ("routed_at");--> statement-breakpoint
CREATE INDEX "signal_bus_routed_events_status_idx" ON "signal_bus_routed_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "signal_bus_routed_events_org_id_idx" ON "signal_bus_routed_events" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "signal_bus_rules_domain_type_idx" ON "signal_bus_rules" USING btree ("source_domain","source_type");--> statement-breakpoint
CREATE INDEX "signal_bus_rules_enabled_idx" ON "signal_bus_rules" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "signal_bus_rules_org_id_idx" ON "signal_bus_rules" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sim_replay_session_uniq" ON "simulation_replay_state" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "sim_replay_domain_idx" ON "simulation_replay_state" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "sim_results_session_idx" ON "simulation_results" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "sim_results_domain_idx" ON "simulation_results" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "sim_results_computed_idx" ON "simulation_results" USING btree ("computed_at");--> statement-breakpoint
CREATE INDEX "sim_sessions_domain_idx" ON "simulation_sessions" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "sim_sessions_status_idx" ON "simulation_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sim_sessions_created_idx" ON "simulation_sessions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sim_snapshots_session_idx" ON "simulation_snapshots" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "sim_snapshots_domain_idx" ON "simulation_snapshots" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "szl_actions_org_idx" ON "szl_actions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "szl_actions_owner_idx" ON "szl_actions" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "szl_actions_state_idx" ON "szl_actions" USING btree ("action_state");--> statement-breakpoint
CREATE INDEX "szl_actions_created_at_idx" ON "szl_actions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "szl_approvals_org_idx" ON "szl_approvals" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "szl_approvals_state_idx" ON "szl_approvals" USING btree ("state");--> statement-breakpoint
CREATE INDEX "szl_approvals_created_at_idx" ON "szl_approvals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "szl_artifacts_org_idx" ON "szl_artifacts" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "szl_artifacts_created_at_idx" ON "szl_artifacts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "szl_comments_entity_idx" ON "szl_comments" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "szl_comments_org_idx" ON "szl_comments" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "szl_comments_created_at_idx" ON "szl_comments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "szl_event_log_org_idx" ON "szl_event_log" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "szl_event_log_actor_idx" ON "szl_event_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "szl_event_log_occurred_at_idx" ON "szl_event_log" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "szl_event_log_entity_idx" ON "szl_event_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "szl_exceptions_org_idx" ON "szl_exceptions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "szl_exceptions_status_idx" ON "szl_exceptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "szl_exceptions_severity_idx" ON "szl_exceptions" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "szl_exceptions_detected_at_idx" ON "szl_exceptions" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "szl_exceptions_created_at_idx" ON "szl_exceptions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "szl_feature_flags_key_idx" ON "szl_feature_flags" USING btree ("key");--> statement-breakpoint
CREATE INDEX "szl_products_org_idx" ON "szl_products" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "szl_readiness_items_org_idx" ON "szl_readiness_items" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "szl_readiness_items_owner_idx" ON "szl_readiness_items" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "szl_readiness_items_status_idx" ON "szl_readiness_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "szl_readiness_items_created_at_idx" ON "szl_readiness_items" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "szl_routes_org_idx" ON "szl_routes" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "szl_signals_org_idx" ON "szl_signals" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "szl_signals_owner_idx" ON "szl_signals" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "szl_signals_status_idx" ON "szl_signals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "szl_signals_severity_idx" ON "szl_signals" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "szl_signals_detected_at_idx" ON "szl_signals" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "szl_signals_created_at_idx" ON "szl_signals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "szl_vessels_org_idx" ON "szl_vessels" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "szl_vessels_status_idx" ON "szl_vessels" USING btree ("operational_status");--> statement-breakpoint
CREATE INDEX "szl_voyages_org_idx" ON "szl_voyages" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "szl_voyages_vessel_idx" ON "szl_voyages" USING btree ("vessel_id");--> statement-breakpoint
CREATE INDEX "szl_voyages_status_idx" ON "szl_voyages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "szl_voyages_created_at_idx" ON "szl_voyages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "szl_workflow_runs_workflow_idx" ON "szl_workflow_runs" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "szl_workflow_runs_org_idx" ON "szl_workflow_runs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "szl_workflow_runs_state_idx" ON "szl_workflow_runs" USING btree ("state");--> statement-breakpoint
CREATE INDEX "szl_workflow_runs_created_at_idx" ON "szl_workflow_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "szl_workflows_org_idx" ON "szl_workflows" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "szl_workflows_created_at_idx" ON "szl_workflows" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "szl_drec_session_idx" ON "szl_decisioning_recommendations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "szl_drec_rec_id_idx" ON "szl_decisioning_recommendations" USING btree ("recommendation_id");--> statement-breakpoint
CREATE INDEX "szl_drec_domain_idx" ON "szl_decisioning_recommendations" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "szl_drec_policy_state_idx" ON "szl_decisioning_recommendations" USING btree ("policy_state");--> statement-breakpoint
CREATE INDEX "szl_drec_tenant_idx" ON "szl_decisioning_recommendations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "szl_drec_evaluated_at_idx" ON "szl_decisioning_recommendations" USING btree ("evaluated_at");--> statement-breakpoint
CREATE INDEX "szl_dr_run_id_idx" ON "szl_decisioning_runs" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "szl_dr_workflow_id_idx" ON "szl_decisioning_runs" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "szl_dr_status_idx" ON "szl_decisioning_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "szl_dr_domain_idx" ON "szl_decisioning_runs" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "szl_dr_tenant_idx" ON "szl_decisioning_runs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "szl_dr_recommendation_idx" ON "szl_decisioning_runs" USING btree ("recommendation_id");--> statement-breakpoint
CREATE INDEX "szl_dr_started_at_idx" ON "szl_decisioning_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "szl_pv_policy_id_idx" ON "szl_policy_violations" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "szl_pv_domain_idx" ON "szl_policy_violations" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "szl_pv_effect_idx" ON "szl_policy_violations" USING btree ("effect");--> statement-breakpoint
CREATE INDEX "szl_pv_run_id_idx" ON "szl_policy_violations" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "szl_pv_tenant_idx" ON "szl_policy_violations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "szl_pv_occurred_at_idx" ON "szl_policy_violations" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "team_pages_team_created_at_idx" ON "team_pages" USING btree ("team","created_at");--> statement-breakpoint
CREATE INDEX "team_pages_created_at_idx" ON "team_pages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "terra_action_property_idx" ON "terra_action_items" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "terra_action_status_idx" ON "terra_action_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "terra_action_severity_idx" ON "terra_action_items" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "terra_action_created_idx" ON "terra_action_items" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "terra_agent_brokerage_idx" ON "terra_agents" USING btree ("brokerage_id");--> statement-breakpoint
CREATE INDEX "terra_agent_status_idx" ON "terra_agents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "terra_agent_specialty_idx" ON "terra_agents" USING btree ("specialty");--> statement-breakpoint
CREATE INDEX "terra_agent_created_idx" ON "terra_agents" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "terra_brokerage_slug_idx" ON "terra_brokerages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "terra_brokerage_status_idx" ON "terra_brokerages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "terra_brokerage_created_idx" ON "terra_brokerages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "terra_comps_type_idx" ON "terra_commercial_comps" USING btree ("comp_type");--> statement-breakpoint
CREATE INDEX "terra_comps_source_idx" ON "terra_commercial_comps" USING btree ("source");--> statement-breakpoint
CREATE INDEX "terra_comps_prop_type_idx" ON "terra_commercial_comps" USING btree ("property_type");--> statement-breakpoint
CREATE INDEX "terra_comps_date_idx" ON "terra_commercial_comps" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "terra_comps_zip_idx" ON "terra_commercial_comps" USING btree ("zip_code");--> statement-breakpoint
CREATE INDEX "terra_comm_type_idx" ON "terra_commercial_properties" USING btree ("property_type");--> statement-breakpoint
CREATE INDEX "terra_comm_source_idx" ON "terra_commercial_properties" USING btree ("source");--> statement-breakpoint
CREATE INDEX "terra_comm_zip_idx" ON "terra_commercial_properties" USING btree ("zip_code");--> statement-breakpoint
CREATE INDEX "terra_comm_class_idx" ON "terra_commercial_properties" USING btree ("building_class");--> statement-breakpoint
CREATE INDEX "terra_comm_active_idx" ON "terra_commercial_properties" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "terra_comm_submarket_idx" ON "terra_commercial_properties" USING btree ("submarket_name");--> statement-breakpoint
CREATE INDEX "terra_construction_status_idx" ON "terra_construction_projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "terra_construction_created_idx" ON "terra_construction_projects" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "terra_covenant_property_idx" ON "terra_covenants" USING btree ("property_external_id");--> statement-breakpoint
CREATE INDEX "terra_covenant_lender_idx" ON "terra_covenants" USING btree ("lender");--> statement-breakpoint
CREATE INDEX "terra_covenant_type_idx" ON "terra_covenants" USING btree ("covenant_type");--> statement-breakpoint
CREATE INDEX "terra_covenant_active_idx" ON "terra_covenants" USING btree ("active");--> statement-breakpoint
CREATE INDEX "terra_covenant_org_idx" ON "terra_covenants" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "terra_covenant_org_property_type_uq" ON "terra_covenants" USING btree ("org_id","property_external_id","covenant_type");--> statement-breakpoint
CREATE INDEX "terra_deals_stage_idx" ON "terra_deals" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "terra_deals_active_idx" ON "terra_deals" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "terra_deals_distress_idx" ON "terra_deals" USING btree ("distress_property_id");--> statement-breakpoint
CREATE INDEX "terra_deals_lead_idx" ON "terra_deals" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "terra_diligence_evidence_matter_idx" ON "terra_diligence_evidence" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "terra_diligence_evidence_status_idx" ON "terra_diligence_evidence" USING btree ("status");--> statement-breakpoint
CREATE INDEX "terra_diligence_evidence_category_idx" ON "terra_diligence_evidence" USING btree ("category");--> statement-breakpoint
CREATE INDEX "terra_diligence_matter_status_idx" ON "terra_diligence_matters" USING btree ("status");--> statement-breakpoint
CREATE INDEX "terra_diligence_matter_stage_idx" ON "terra_diligence_matters" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "terra_diligence_matter_property_idx" ON "terra_diligence_matters" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "terra_diligence_matter_active_idx" ON "terra_diligence_matters" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "terra_alert_property_idx" ON "terra_distress_alerts" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "terra_alert_severity_idx" ON "terra_distress_alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "terra_alert_type_idx" ON "terra_distress_alerts" USING btree ("alert_type");--> statement-breakpoint
CREATE INDEX "terra_alert_borough_idx" ON "terra_distress_alerts" USING btree ("borough");--> statement-breakpoint
CREATE INDEX "terra_distress_borough_idx" ON "terra_distress_properties" USING btree ("borough");--> statement-breakpoint
CREATE INDEX "terra_distress_zip_idx" ON "terra_distress_properties" USING btree ("zip_code");--> statement-breakpoint
CREATE INDEX "terra_distress_type_idx" ON "terra_distress_properties" USING btree ("distress_type");--> statement-breakpoint
CREATE INDEX "terra_distress_score_idx" ON "terra_distress_properties" USING btree ("opportunity_score");--> statement-breakpoint
CREATE INDEX "terra_distress_active_idx" ON "terra_distress_properties" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "terra_distress_auction_idx" ON "terra_distress_properties" USING btree ("auction_date");--> statement-breakpoint
CREATE INDEX "terra_exchange_status_idx" ON "terra_exchanges_1031" USING btree ("status");--> statement-breakpoint
CREATE INDEX "terra_exchange_created_idx" ON "terra_exchanges_1031" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "terra_ingestion_source_idx" ON "terra_ingestion_runs" USING btree ("source");--> statement-breakpoint
CREATE INDEX "terra_ingestion_status_idx" ON "terra_ingestion_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "terra_inquiry_listing_idx" ON "terra_inquiries" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "terra_inquiry_agent_idx" ON "terra_inquiries" USING btree ("assigned_agent_id");--> statement-breakpoint
CREATE INDEX "terra_inquiry_status_idx" ON "terra_inquiries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "terra_inquiry_created_idx" ON "terra_inquiries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "terra_inquiry_score_idx" ON "terra_inquiries" USING btree ("qualification_score");--> statement-breakpoint
CREATE INDEX "terra_leads_stage_idx" ON "terra_leads" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "terra_leads_source_idx" ON "terra_leads" USING btree ("source");--> statement-breakpoint
CREATE INDEX "terra_leads_score_idx" ON "terra_leads" USING btree ("score");--> statement-breakpoint
CREATE INDEX "terra_leads_active_idx" ON "terra_leads" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "terra_leads_distress_idx" ON "terra_leads" USING btree ("distress_property_id");--> statement-breakpoint
CREATE INDEX "terra_lease_tenant_idx" ON "terra_leases" USING btree ("tenant");--> statement-breakpoint
CREATE INDEX "terra_lease_created_idx" ON "terra_leases" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "terra_lease_expiration_idx" ON "terra_leases" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "terra_listing_status_idx" ON "terra_listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "terra_listing_agent_idx" ON "terra_listings" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "terra_listing_brokerage_idx" ON "terra_listings" USING btree ("brokerage_id");--> statement-breakpoint
CREATE INDEX "terra_listing_property_idx" ON "terra_listings" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "terra_listing_created_idx" ON "terra_listings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "terra_listing_score_idx" ON "terra_listings" USING btree ("opportunity_score");--> statement-breakpoint
CREATE INDEX "terra_loan_fin_loan_idx" ON "terra_loan_financials" USING btree ("loan_agreement_id");--> statement-breakpoint
CREATE INDEX "terra_loan_fin_property_idx" ON "terra_loan_financials" USING btree ("property_external_id");--> statement-breakpoint
CREATE INDEX "terra_loan_fin_period_idx" ON "terra_loan_financials" USING btree ("statement_period");--> statement-breakpoint
CREATE INDEX "terra_loan_fin_date_idx" ON "terra_loan_financials" USING btree ("statement_date");--> statement-breakpoint
CREATE UNIQUE INDEX "terra_loan_fin_loan_period_uniq" ON "terra_loan_financials" USING btree ("loan_agreement_id","statement_period");--> statement-breakpoint
CREATE INDEX "terra_mls_status_idx" ON "terra_mls_listings" USING btree ("standard_status");--> statement-breakpoint
CREATE INDEX "terra_mls_postal_idx" ON "terra_mls_listings" USING btree ("postal_code");--> statement-breakpoint
CREATE INDEX "terra_mls_mls_name_idx" ON "terra_mls_listings" USING btree ("mls_name");--> statement-breakpoint
CREATE INDEX "terra_mls_property_type_idx" ON "terra_mls_listings" USING btree ("property_type");--> statement-breakpoint
CREATE INDEX "terra_mls_price_idx" ON "terra_mls_listings" USING btree ("list_price");--> statement-breakpoint
CREATE INDEX "terra_mls_active_idx" ON "terra_mls_listings" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "terra_mls_modification_idx" ON "terra_mls_listings" USING btree ("modification_timestamp");--> statement-breakpoint
CREATE INDEX "terra_mls_distress_idx" ON "terra_mls_listings" USING btree ("distress_property_id");--> statement-breakpoint
CREATE INDEX "terra_pro_forma_name_idx" ON "terra_pro_forma_projects" USING btree ("project_name");--> statement-breakpoint
CREATE INDEX "terra_pro_forma_created_idx" ON "terra_pro_forma_projects" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "terra_property_type_idx" ON "terra_properties" USING btree ("property_type");--> statement-breakpoint
CREATE INDEX "terra_property_submarket_idx" ON "terra_properties" USING btree ("submarket");--> statement-breakpoint
CREATE INDEX "terra_property_zip_idx" ON "terra_properties" USING btree ("zip_code");--> statement-breakpoint
CREATE INDEX "terra_property_active_idx" ON "terra_properties" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "terra_property_owner_idx" ON "terra_properties" USING btree ("owner_name");--> statement-breakpoint
CREATE INDEX "terra_property_owner_type_idx" ON "terra_properties" USING btree ("owner_type");--> statement-breakpoint
CREATE INDEX "terra_property_created_idx" ON "terra_properties" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "terra_property_address_city_state_uniq" ON "terra_properties" USING btree ("address","city","state");--> statement-breakpoint
CREATE INDEX "terra_saved_user_idx" ON "terra_saved_opportunities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "terra_saved_property_idx" ON "terra_saved_opportunities" USING btree ("distress_property_id");--> statement-breakpoint
CREATE INDEX "terra_tax_appeal_status_idx" ON "terra_tax_appeals" USING btree ("appeal_status");--> statement-breakpoint
CREATE INDEX "terra_tax_appeal_created_idx" ON "terra_tax_appeals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "terra_tenant_status_idx" ON "terra_tenant_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "terra_tenant_recommendation_idx" ON "terra_tenant_applications" USING btree ("recommendation");--> statement-breakpoint
CREATE INDEX "terra_tenant_created_idx" ON "terra_tenant_applications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "terra_transaction_agent_idx" ON "terra_transactions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "terra_transaction_brokerage_idx" ON "terra_transactions" USING btree ("brokerage_id");--> statement-breakpoint
CREATE INDEX "terra_transaction_property_idx" ON "terra_transactions" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "terra_transaction_closed_idx" ON "terra_transactions" USING btree ("closed_date");--> statement-breakpoint
CREATE INDEX "terra_transaction_status_idx" ON "terra_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "terra_waterfall_name_idx" ON "terra_waterfall_structures" USING btree ("name");--> statement-breakpoint
CREATE INDEX "terra_waterfall_created_idx" ON "terra_waterfall_structures" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "trace_entity_links_trace_id_idx" ON "trace_entity_links" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "trace_entity_links_entity_id_idx" ON "trace_entity_links" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "trace_events_trace_id_idx" ON "trace_events" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "trace_events_span_id_idx" ON "trace_events" USING btree ("span_id");--> statement-breakpoint
CREATE INDEX "trace_events_kind_idx" ON "trace_events" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "trace_events_occurred_at_idx" ON "trace_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "trace_spans_trace_id_idx" ON "trace_spans" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "trace_spans_span_id_idx" ON "trace_spans" USING btree ("span_id");--> statement-breakpoint
CREATE INDEX "trace_spans_parent_span_id_idx" ON "trace_spans" USING btree ("parent_span_id");--> statement-breakpoint
CREATE INDEX "trace_spans_started_at_idx" ON "trace_spans" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "traces_trace_id_idx" ON "traces" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "traces_request_id_idx" ON "traces" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "traces_agent_id_idx" ON "traces" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "traces_workflow_id_idx" ON "traces" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "traces_session_id_idx" ON "traces" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "traces_domain_idx" ON "traces" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "traces_status_idx" ON "traces" USING btree ("status");--> statement-breakpoint
CREATE INDEX "traces_started_at_idx" ON "traces" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "traces_user_id_idx" ON "traces" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "vessels_alerts_vessel_id_idx" ON "vessels_alerts" USING btree ("vessel_id");--> statement-breakpoint
CREATE INDEX "vessels_alerts_status_idx" ON "vessels_alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vessels_cargo_org_id_idx" ON "vessels_cargo" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "vessels_events_vessel_id_occurred_idx" ON "vessels_events" USING btree ("vessel_id","occurred_at" DESC);--> statement-breakpoint
CREATE INDEX "vessels_events_status_idx" ON "vessels_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vessels_positions_vessel_recorded_idx" ON "vessels_positions" USING btree ("vessel_id","recorded_at" DESC);--> statement-breakpoint
CREATE INDEX "vessels_positions_org_id_idx" ON "vessels_positions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "vessels_routes_org_id_idx" ON "vessels_routes" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "vessels_status_idx" ON "vessels" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vessels_org_id_idx" ON "vessels" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vessels_bol_chain_events_bol_seq_idx" ON "vessels_bol_chain_events" USING btree ("bol_id","sequence");--> statement-breakpoint
CREATE INDEX "vessels_bol_chain_events_bol_idx" ON "vessels_bol_chain_events" USING btree ("bol_id");--> statement-breakpoint
CREATE INDEX "fleet_exceptions_org_idx" ON "fleet_exceptions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "fleet_exceptions_vessel_idx" ON "fleet_exceptions" USING btree ("vessel_id");--> statement-breakpoint
CREATE INDEX "fleet_exceptions_status_idx" ON "fleet_exceptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fleet_exceptions_severity_idx" ON "fleet_exceptions" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "fleet_exceptions_detected_idx" ON "fleet_exceptions" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "vessel_maintenance_vessel_idx" ON "vessel_maintenance" USING btree ("vessel_id");--> statement-breakpoint
CREATE INDEX "vessel_maintenance_status_idx" ON "vessel_maintenance" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vessel_maintenance_due_idx" ON "vessel_maintenance" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "vessel_port_calls_vessel_idx" ON "vessel_port_calls" USING btree ("vessel_id");--> statement-breakpoint
CREATE INDEX "vessel_port_calls_arrival_idx" ON "vessel_port_calls" USING btree ("arrival_at");--> statement-breakpoint
CREATE INDEX "vessel_port_calls_port_idx" ON "vessel_port_calls" USING btree ("port_name");--> statement-breakpoint
CREATE INDEX "vessel_sanctions_vessel_idx" ON "vessel_sanctions_screening" USING btree ("vessel_id");--> statement-breakpoint
CREATE INDEX "vessel_sanctions_ofac_idx" ON "vessel_sanctions_screening" USING btree ("ofac_status");--> statement-breakpoint
CREATE INDEX "vessel_sanctions_date_idx" ON "vessel_sanctions_screening" USING btree ("screening_date");--> statement-breakpoint
CREATE INDEX "vessel_voyage_econ_vessel_idx" ON "vessel_voyage_economics" USING btree ("vessel_id");--> statement-breakpoint
CREATE INDEX "vessel_voyage_econ_status_idx" ON "vessel_voyage_economics" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vessel_voyage_econ_created_idx" ON "vessel_voyage_economics" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "vessels_psc_checklist_vessel_idx" ON "vessels_psc_checklist_items" USING btree ("vessel_id");--> statement-breakpoint
CREATE INDEX "vessels_psc_checklist_org_idx" ON "vessels_psc_checklist_items" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "vessels_psc_inspections_vessel_idx" ON "vessels_psc_inspections" USING btree ("vessel_id");--> statement-breakpoint
CREATE INDEX "vessels_psc_inspections_org_idx" ON "vessels_psc_inspections" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "vessels_psc_inspections_date_idx" ON "vessels_psc_inspections" USING btree ("inspection_date");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_recipients_phone_idx" ON "notification_recipients" USING btree ("phone_number");--> statement-breakpoint
CREATE UNIQUE INDEX "web_push_subscriptions_endpoint_idx" ON "web_push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "worldline_fetch_source_idx" ON "worldline_fetch_logs" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "worldline_fetch_org_idx" ON "worldline_fetch_logs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "worldline_fetch_status_idx" ON "worldline_fetch_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "worldline_fetch_at_idx" ON "worldline_fetch_logs" USING btree ("fetched_at");--> statement-breakpoint
CREATE INDEX "worldline_pub_source_idx" ON "worldline_signal_publications" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "worldline_pub_pack_idx" ON "worldline_signal_publications" USING btree ("target_pack");--> statement-breakpoint
CREATE INDEX "worldline_pub_org_idx" ON "worldline_signal_publications" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "worldline_pub_at_idx" ON "worldline_signal_publications" USING btree ("published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "worldline_source_org_slug_idx" ON "worldline_source_registry" USING btree ("org_id","slug");--> statement-breakpoint
CREATE INDEX "worldline_source_domain_idx" ON "worldline_source_registry" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "worldline_source_status_idx" ON "worldline_source_registry" USING btree ("status");--> statement-breakpoint
CREATE INDEX "worldline_source_type_idx" ON "worldline_source_registry" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "crisis_arena_profile_handle_idx" ON "crisis_arena_architect_profiles" USING btree ("handle");--> statement-breakpoint
CREATE INDEX "crisis_arena_profile_rep_idx" ON "crisis_arena_architect_profiles" USING btree ("reputation_score");--> statement-breakpoint
CREATE INDEX "crisis_arena_eng_tenant_idx" ON "crisis_arena_engagements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "crisis_arena_eng_owner_idx" ON "crisis_arena_engagements" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "crisis_arena_eng_status_idx" ON "crisis_arena_engagements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "crisis_arena_rep_architect_idx" ON "crisis_arena_reputation_events" USING btree ("architect_id");--> statement-breakpoint
CREATE INDEX "crisis_arena_rep_created_idx" ON "crisis_arena_reputation_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "crisis_arena_sub_eng_idx" ON "crisis_arena_submissions" USING btree ("engagement_id");--> statement-breakpoint
CREATE INDEX "crisis_arena_sub_architect_idx" ON "crisis_arena_submissions" USING btree ("architect_id");--> statement-breakpoint
CREATE INDEX "crisis_arena_sub_status_idx" ON "crisis_arena_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "crisis_arena_triage_sub_idx" ON "crisis_arena_triage_events" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "crisis_arena_triage_eng_idx" ON "crisis_arena_triage_events" USING btree ("engagement_id");--> statement-breakpoint
CREATE INDEX "per_calibration_org_idx" ON "per_calibration_runs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "per_calibration_candidate_idx" ON "per_calibration_runs" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "per_calibration_type_idx" ON "per_calibration_runs" USING btree ("run_type");--> statement-breakpoint
CREATE INDEX "per_calibration_created_idx" ON "per_calibration_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "per_candidates_org_idx" ON "per_candidate_policies" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "per_candidates_state_idx" ON "per_candidate_policies" USING btree ("state");--> statement-breakpoint
CREATE INDEX "per_candidates_profile_idx" ON "per_candidate_policies" USING btree ("precision_profile");--> statement-breakpoint
CREATE INDEX "per_candidates_created_idx" ON "per_candidate_policies" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "per_drift_candidate_idx" ON "per_drift_reports" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "per_drift_status_idx" ON "per_drift_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "per_drift_measured_idx" ON "per_drift_reports" USING btree ("measured_at");--> statement-breakpoint
CREATE INDEX "per_eval_results_run_idx" ON "per_evaluation_results" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "per_eval_results_candidate_idx" ON "per_evaluation_results" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "per_eval_results_category_idx" ON "per_evaluation_results" USING btree ("category");--> statement-breakpoint
CREATE INDEX "per_eval_runs_org_idx" ON "per_evaluation_runs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "per_eval_runs_candidate_idx" ON "per_evaluation_runs" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "per_eval_runs_status_idx" ON "per_evaluation_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "per_eval_runs_created_idx" ON "per_evaluation_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "per_promo_candidate_idx" ON "per_promotion_decisions" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "per_promo_org_idx" ON "per_promotion_decisions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "per_promo_outcome_idx" ON "per_promotion_decisions" USING btree ("outcome");--> statement-breakpoint
CREATE INDEX "per_promo_created_idx" ON "per_promotion_decisions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "per_reward_run_idx" ON "per_reward_breakdowns" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "per_reward_candidate_idx" ON "per_reward_breakdowns" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "per_reward_recommendation_idx" ON "per_reward_breakdowns" USING btree ("recommendation");--> statement-breakpoint
CREATE INDEX "per_rollout_candidate_idx" ON "per_rollout_jobs" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "per_rollout_status_idx" ON "per_rollout_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "per_rollout_created_idx" ON "per_rollout_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "per_traces_job_idx" ON "per_rollout_traces" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "per_traces_candidate_idx" ON "per_rollout_traces" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "per_traces_created_idx" ON "per_rollout_traces" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "per_health_profile_idx" ON "per_runtime_health_snapshots" USING btree ("precision_profile");--> statement-breakpoint
CREATE INDEX "per_health_env_idx" ON "per_runtime_health_snapshots" USING btree ("environment_mode");--> statement-breakpoint
CREATE INDEX "per_health_measured_idx" ON "per_runtime_health_snapshots" USING btree ("measured_at");--> statement-breakpoint
CREATE INDEX "counsel_knowledge_chunks_document_idx" ON "counsel_knowledge_chunks" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "counsel_knowledge_chunks_matter_idx" ON "counsel_knowledge_chunks" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "counsel_knowledge_documents_matter_idx" ON "counsel_knowledge_documents" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "counsel_knowledge_documents_org_idx" ON "counsel_knowledge_documents" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "counsel_knowledge_entities_matter_idx" ON "counsel_knowledge_entities" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "counsel_knowledge_entities_name_idx" ON "counsel_knowledge_entities" USING btree ("name");--> statement-breakpoint
CREATE INDEX "counsel_knowledge_queries_matter_idx" ON "counsel_knowledge_queries" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "counsel_knowledge_relations_matter_idx" ON "counsel_knowledge_relations" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "counsel_knowledge_relations_subject_idx" ON "counsel_knowledge_relations" USING btree ("subject_entity");--> statement-breakpoint
CREATE INDEX "oauth_clients_client_id_idx" ON "oauth_clients" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "oauth_clients_org_id_idx" ON "oauth_clients" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "mesh_call_log_principal_type_idx" ON "mesh_call_log" USING btree ("principal_type");--> statement-breakpoint
CREATE INDEX "mesh_call_log_principal_id_idx" ON "mesh_call_log" USING btree ("principal_id");--> statement-breakpoint
CREATE INDEX "mesh_call_log_timestamp_idx" ON "mesh_call_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "mesh_call_log_path_idx" ON "mesh_call_log" USING btree ("path");--> statement-breakpoint
CREATE INDEX "intl_payment_methods_org_id_idx" ON "international_payment_methods" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "intl_payment_methods_type_idx" ON "international_payment_methods" USING btree ("type");--> statement-breakpoint
CREATE INDEX "intl_payment_methods_status_idx" ON "international_payment_methods" USING btree ("status");--> statement-breakpoint
CREATE INDEX "intl_payments_org_id_idx" ON "international_payments" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "intl_payments_status_idx" ON "international_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "intl_payments_stripe_pi_idx" ON "international_payments" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "esig_events_request_id_idx" ON "esignature_events" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "esig_events_type_idx" ON "esignature_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "esig_requests_org_id_idx" ON "esignature_requests" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "esig_requests_matter_id_idx" ON "esignature_requests" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "esig_requests_status_idx" ON "esignature_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "esig_requests_envelope_id_idx" ON "esignature_requests" USING btree ("provider_envelope_id");--> statement-breakpoint
CREATE INDEX "esig_requests_lifecycle_doc_idx" ON "esignature_requests" USING btree ("lifecycle_document_id");--> statement-breakpoint
CREATE INDEX "plugin_installs_org_id_idx" ON "plugin_installations" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "plugin_installs_plugin_id_idx" ON "plugin_installations" USING btree ("plugin_id");--> statement-breakpoint
CREATE INDEX "plugins_slug_idx" ON "plugins" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "plugins_category_idx" ON "plugins" USING btree ("category");--> statement-breakpoint
CREATE INDEX "plugins_published_idx" ON "plugins" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "dispute_audit_dispute_id_idx" ON "billing_dispute_audit" USING btree ("dispute_id");--> statement-breakpoint
CREATE INDEX "billing_disputes_org_id_idx" ON "billing_disputes" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "billing_disputes_status_idx" ON "billing_disputes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "billing_disputes_stripe_dispute_id_idx" ON "billing_disputes" USING btree ("stripe_dispute_id");--> statement-breakpoint
CREATE INDEX "treasury_accounts_org_id_idx" ON "treasury_accounts" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "treasury_accounts_provider_idx" ON "treasury_accounts" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "treasury_snapshots_account_id_idx" ON "treasury_balance_snapshots" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "treasury_snapshots_org_id_idx" ON "treasury_balance_snapshots" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "treasury_snapshots_snapshot_at_idx" ON "treasury_balance_snapshots" USING btree ("snapshot_at");--> statement-breakpoint
CREATE INDEX "treasury_txns_account_id_idx" ON "treasury_transactions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "treasury_txns_org_id_idx" ON "treasury_transactions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "treasury_txns_occurred_at_idx" ON "treasury_transactions" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "treasury_txns_provider_tx_id_idx" ON "treasury_transactions" USING btree ("provider_tx_id");--> statement-breakpoint
CREATE INDEX "court_filing_events_filing_id_idx" ON "court_filing_events" USING btree ("filing_id");--> statement-breakpoint
CREATE INDEX "court_filings_org_id_idx" ON "court_filings" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "court_filings_matter_id_idx" ON "court_filings" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "court_filings_status_idx" ON "court_filings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "court_filings_jurisdiction_idx" ON "court_filings" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX "rf_anomalies_entity_idx" ON "rf_anomalies" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "rf_anomalies_type_idx" ON "rf_anomalies" USING btree ("anomaly_type");--> statement-breakpoint
CREATE INDEX "rf_anomalies_status_idx" ON "rf_anomalies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rf_anomalies_detected_idx" ON "rf_anomalies" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "rf_passes_entity_idx" ON "rf_satellite_passes" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "rf_passes_timestamp_idx" ON "rf_satellite_passes" USING btree ("pass_timestamp");--> statement-breakpoint
CREATE INDEX "rf_passes_anomaly_idx" ON "rf_satellite_passes" USING btree ("anomaly_flag");--> statement-breakpoint
CREATE INDEX "cc_org_type_idx" ON "counsel_clauses" USING btree ("org_id","clause_type");--> statement-breakpoint
CREATE INDEX "cc_matter_idx" ON "counsel_clauses" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "cc_risk_idx" ON "counsel_clauses" USING btree ("risk_score");--> statement-breakpoint
CREATE INDEX "cds_org_type_idx" ON "counsel_draft_sessions" USING btree ("org_id","clause_type");--> statement-breakpoint
CREATE INDEX "cds_matter_idx" ON "counsel_draft_sessions" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "cds_created_idx" ON "counsel_draft_sessions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "cpr_org_type_idx" ON "counsel_playbook_rules" USING btree ("org_id","clause_type");--> statement-breakpoint
CREATE INDEX "cpr_severity_idx" ON "counsel_playbook_rules" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "outbound_audit_log_delivery_idx" ON "outbound_audit_log" USING btree ("delivery_id");--> statement-breakpoint
CREATE INDEX "outbound_audit_log_org_idx" ON "outbound_audit_log" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "outbound_channel_configs_org_idx" ON "outbound_channel_configs" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "outbound_channel_configs_org_channel_name_idx" ON "outbound_channel_configs" USING btree ("org_id","channel","name");--> statement-breakpoint
CREATE INDEX "outbound_deliveries_status_idx" ON "outbound_deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "outbound_deliveries_channel_idx" ON "outbound_deliveries" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "outbound_deliveries_source_domain_idx" ON "outbound_deliveries" USING btree ("source_domain");--> statement-breakpoint
CREATE INDEX "outbound_deliveries_org_idx" ON "outbound_deliveries" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "outbound_deliveries_retry_idx" ON "outbound_deliveries" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "carlota_drip_engagement_enrollment_idx" ON "carlota_drip_engagement_events" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "carlota_drip_engagement_step_idx" ON "carlota_drip_engagement_events" USING btree ("step_id");--> statement-breakpoint
CREATE INDEX "carlota_drip_engagement_type_idx" ON "carlota_drip_engagement_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "carlota_drip_enrollments_sequence_idx" ON "carlota_drip_enrollments" USING btree ("sequence_id");--> statement-breakpoint
CREATE INDEX "carlota_drip_enrollments_status_idx" ON "carlota_drip_enrollments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "carlota_drip_enrollments_next_send_idx" ON "carlota_drip_enrollments" USING btree ("next_send_at");--> statement-breakpoint
CREATE UNIQUE INDEX "carlota_drip_enrollments_seq_email_idx" ON "carlota_drip_enrollments" USING btree ("sequence_id","contact_email");--> statement-breakpoint
CREATE INDEX "carlota_drip_sequences_status_idx" ON "carlota_drip_sequences" USING btree ("status");--> statement-breakpoint
CREATE INDEX "carlota_drip_steps_sequence_idx" ON "carlota_drip_steps" USING btree ("sequence_id");--> statement-breakpoint
CREATE UNIQUE INDEX "carlota_drip_steps_sequence_order_idx" ON "carlota_drip_steps" USING btree ("sequence_id","step_order");--> statement-breakpoint
CREATE INDEX "siem_export_connections_org_idx" ON "siem_export_connections" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "siem_export_connections_adapter_idx" ON "siem_export_connections" USING btree ("adapter_id");--> statement-breakpoint
CREATE INDEX "siem_export_events_connection_idx" ON "siem_export_events" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "siem_export_events_status_idx" ON "siem_export_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "doc_audit_document_id_idx" ON "document_audit_trail" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "doc_audit_org_id_idx" ON "document_audit_trail" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "doc_audit_occurred_at_idx" ON "document_audit_trail" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "doc_audit_performed_by_idx" ON "document_audit_trail" USING btree ("performed_by_id");--> statement-breakpoint
CREATE INDEX "doc_lifecycle_org_id_idx" ON "document_lifecycle" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "doc_lifecycle_document_id_idx" ON "document_lifecycle" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "doc_lifecycle_state_idx" ON "document_lifecycle" USING btree ("lifecycle_state");--> statement-breakpoint
CREATE INDEX "doc_lifecycle_domain_idx" ON "document_lifecycle" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "doc_lifecycle_type_idx" ON "document_lifecycle" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "doc_lifecycle_matter_id_idx" ON "document_lifecycle" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "doc_lifecycle_fund_id_idx" ON "document_lifecycle" USING btree ("fund_id");--> statement-breakpoint
CREATE INDEX "lifecycle_wf_org_id_idx" ON "lifecycle_workflow_config" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "lifecycle_wf_domain_idx" ON "lifecycle_workflow_config" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "lifecycle_wf_type_idx" ON "lifecycle_workflow_config" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "ai_model_prices_provider_model_idx" ON "ai_model_prices" USING btree ("provider","model");--> statement-breakpoint
CREATE INDEX "ai_tenant_budgets_org_id_idx" ON "ai_tenant_budgets" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "ai_usage_org_id_idx" ON "ai_usage_records" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "ai_usage_org_created_idx" ON "ai_usage_records" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_provider_idx" ON "ai_usage_records" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "ai_usage_model_idx" ON "ai_usage_records" USING btree ("model");--> statement-breakpoint
CREATE INDEX "ai_usage_surface_idx" ON "ai_usage_records" USING btree ("surface");--> statement-breakpoint
CREATE INDEX "ai_usage_created_at_idx" ON "ai_usage_records" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_request_id_idx" ON "ai_usage_records" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "eval_benchmarks_benchmark_id_org_idx" ON "eval_benchmarks" USING btree ("benchmark_id","org_id");--> statement-breakpoint
CREATE INDEX "eval_benchmarks_domain_idx" ON "eval_benchmarks" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "eval_benchmarks_cross_cutting_idx" ON "eval_benchmarks" USING btree ("is_cross_cutting");--> statement-breakpoint
CREATE INDEX "eval_benchmarks_source_idx" ON "eval_benchmarks" USING btree ("source");--> statement-breakpoint
CREATE INDEX "eval_community_submissions_status_idx" ON "eval_community_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "eval_community_submissions_org_idx" ON "eval_community_submissions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "eval_community_submissions_submitted_by_idx" ON "eval_community_submissions" USING btree ("submitted_by");--> statement-breakpoint
CREATE INDEX "eval_results_benchmark_task_idx" ON "eval_results" USING btree ("benchmark_id","task_id");--> statement-breakpoint
CREATE INDEX "eval_results_entity_idx" ON "eval_results" USING btree ("entity_id","entity_type");--> statement-breakpoint
CREATE INDEX "eval_results_domain_idx" ON "eval_results" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "eval_results_badge_state_idx" ON "eval_results" USING btree ("badge_state");--> statement-breakpoint
CREATE INDEX "eval_results_numeric_value_idx" ON "eval_results" USING btree ("numeric_value");--> statement-breakpoint
CREATE INDEX "eval_results_org_idx" ON "eval_results" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "eval_results_submitted_by_idx" ON "eval_results" USING btree ("submitted_by");--> statement-breakpoint
CREATE INDEX "eval_results_eval_date_idx" ON "eval_results" USING btree ("eval_date");--> statement-breakpoint
CREATE INDEX "eval_verification_tokens_result_id_idx" ON "eval_verification_tokens" USING btree ("result_id");--> statement-breakpoint
CREATE INDEX "eval_verification_tokens_status_idx" ON "eval_verification_tokens" USING btree ("status");