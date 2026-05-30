-- Cognitive Runtime — complete schema migration
-- Creates all enum types, tables, and indexes for the cognitive runtime foundation

-- Enum types
CREATE TYPE "public"."cog_sensitivity_tier" AS ENUM('public', 'internal', 'confidential', 'restricted', 'top-secret');--> statement-breakpoint
CREATE TYPE "public"."cog_provenance_method" AS ENUM('api', 'manual', 'agent', 'import', 'derived');--> statement-breakpoint
CREATE TYPE "public"."self_model_status" AS ENUM('draft', 'active', 'archived', 'deprecated');--> statement-breakpoint
CREATE TYPE "public"."cog_skill_status" AS ENUM('draft', 'active', 'deprecated', 'retired');--> statement-breakpoint
CREATE TYPE "public"."cog_skill_run_status" AS ENUM('pending', 'running', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."cog_plan_status" AS ENUM('draft', 'pending', 'running', 'completed', 'failed', 'aborted', 'rolled-back');--> statement-breakpoint
CREATE TYPE "public"."cog_plan_step_status" AS ENUM('pending', 'running', 'completed', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."cog_verifier_outcome" AS ENUM('pass', 'fail', 'warn', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."cog_reflection_type" AS ENUM('post-task', 'periodic', 'error-triggered', 'human-initiated', 'goal-review', 'policy-breach');--> statement-breakpoint
CREATE TYPE "public"."cog_policy_effect" AS ENUM('allow', 'deny', 'require-approval', 'log', 'redact', 'escalate');--> statement-breakpoint
CREATE TYPE "public"."cog_action_status" AS ENUM('pending', 'approved', 'running', 'completed', 'failed', 'rolled-back', 'denied');--> statement-breakpoint
CREATE TYPE "public"."cog_rollback_trigger" AS ENUM('agent', 'verifier', 'guardian', 'human', 'policy', 'timeout', 'cascade-failure');--> statement-breakpoint
CREATE TYPE "public"."cog_entity_edge_type" AS ENUM('relates-to', 'depends-on', 'triggers', 'mitigates', 'owns', 'managed-by', 'derived-from', 'affects', 'linked-trace', 'similar-to', 'supersedes', 'alias-of', 'custom');--> statement-breakpoint

-- self_models
CREATE TABLE "self_models" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "agent_id" text NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "status" "self_model_status" NOT NULL DEFAULT 'active',
  "capabilities" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "goals" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "constraints" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "beliefs" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "identity" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "performance_profile" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "confidence" real NOT NULL DEFAULT 1,
  "sensitivity_tier" "cog_sensitivity_tier" NOT NULL DEFAULT 'internal',
  "provenance_source" text NOT NULL DEFAULT 'agent',
  "provenance_method" "cog_provenance_method" NOT NULL DEFAULT 'agent',
  "provenance_author" text,
  "freshness_last_updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "freshness_ttl_seconds" integer,
  "freshness_is_stale" boolean NOT NULL DEFAULT false,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);--> statement-breakpoint
CREATE INDEX "self_models_agent_id_idx" ON "self_models" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "self_models_status_idx" ON "self_models" USING btree ("status");--> statement-breakpoint
CREATE INDEX "self_models_version_idx" ON "self_models" USING btree ("agent_id", "version");--> statement-breakpoint

-- self_model_snapshots
CREATE TABLE "self_model_snapshots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "self_model_id" uuid NOT NULL REFERENCES "self_models"("id") ON DELETE CASCADE,
  "agent_id" text NOT NULL,
  "version" integer NOT NULL,
  "snapshot_data" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "change_reason" text,
  "triggered_by" text,
  "trace_id" text,
  "confidence" real NOT NULL DEFAULT 1,
  "sensitivity_tier" "cog_sensitivity_tier" NOT NULL DEFAULT 'internal',
  "provenance_source" text NOT NULL DEFAULT 'agent',
  "provenance_method" "cog_provenance_method" NOT NULL DEFAULT 'agent',
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);--> statement-breakpoint
CREATE INDEX "self_model_snapshots_model_idx" ON "self_model_snapshots" USING btree ("self_model_id");--> statement-breakpoint
CREATE INDEX "self_model_snapshots_agent_id_idx" ON "self_model_snapshots" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "self_model_snapshots_version_idx" ON "self_model_snapshots" USING btree ("self_model_id", "version");--> statement-breakpoint
CREATE INDEX "self_model_snapshots_created_at_idx" ON "self_model_snapshots" USING btree ("created_at");--> statement-breakpoint

-- entity_aliases
CREATE TABLE "entity_aliases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "entity_id" text NOT NULL,
  "alias" text NOT NULL,
  "alias_type" text NOT NULL DEFAULT 'display',
  "provenance_source" text NOT NULL DEFAULT 'agent',
  "provenance_method" "cog_provenance_method" NOT NULL DEFAULT 'agent',
  "confidence" real NOT NULL DEFAULT 1,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);--> statement-breakpoint
CREATE INDEX "entity_aliases_entity_idx" ON "entity_aliases" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "entity_aliases_alias_idx" ON "entity_aliases" USING btree ("alias");--> statement-breakpoint
CREATE INDEX "entity_aliases_type_idx" ON "entity_aliases" USING btree ("alias_type");--> statement-breakpoint

-- entity_edges
CREATE TABLE "entity_edges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "from_entity_id" text NOT NULL,
  "to_entity_id" text NOT NULL,
  "edge_type" "cog_entity_edge_type" NOT NULL DEFAULT 'relates-to',
  "label" text,
  "weight" real NOT NULL DEFAULT 1,
  "bidirectional" boolean NOT NULL DEFAULT false,
  "provenance_source" text NOT NULL DEFAULT 'agent',
  "provenance_method" "cog_provenance_method" NOT NULL DEFAULT 'agent',
  "provenance_author" text,
  "confidence" real NOT NULL DEFAULT 1,
  "sensitivity_tier" "cog_sensitivity_tier" NOT NULL DEFAULT 'internal',
  "freshness_last_updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "freshness_ttl_seconds" integer,
  "freshness_is_stale" boolean NOT NULL DEFAULT false,
  "linked_traces" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "properties" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);--> statement-breakpoint
CREATE INDEX "entity_edges_from_idx" ON "entity_edges" USING btree ("from_entity_id");--> statement-breakpoint
CREATE INDEX "entity_edges_to_idx" ON "entity_edges" USING btree ("to_entity_id");--> statement-breakpoint
CREATE INDEX "entity_edges_type_idx" ON "entity_edges" USING btree ("edge_type");--> statement-breakpoint
CREATE INDEX "entity_edges_pair_idx" ON "entity_edges" USING btree ("from_entity_id", "to_entity_id");--> statement-breakpoint

-- skills
CREATE TABLE "skills" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "skill_id" text NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "latest_version" integer NOT NULL DEFAULT 1,
  "name" text NOT NULL,
  "description" text,
  "domain" text NOT NULL DEFAULT 'general',
  "capability" text NOT NULL,
  "status" "cog_skill_status" NOT NULL DEFAULT 'active',
  "input_schema" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "output_schema" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "implementation" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "trigger_conditions" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "policy_class" text,
  "estimated_latency_ms" integer,
  "tags" text[] NOT NULL DEFAULT '{}',
  "is_builtin" boolean NOT NULL DEFAULT false,
  "confidence" real NOT NULL DEFAULT 1,
  "sensitivity_tier" "cog_sensitivity_tier" NOT NULL DEFAULT 'internal',
  "provenance_source" text NOT NULL DEFAULT 'agent',
  "provenance_method" "cog_provenance_method" NOT NULL DEFAULT 'agent',
  "provenance_author" text,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);--> statement-breakpoint
CREATE INDEX "skills_skill_id_idx" ON "skills" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "skills_domain_idx" ON "skills" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "skills_status_idx" ON "skills" USING btree ("status");--> statement-breakpoint
CREATE INDEX "skills_version_idx" ON "skills" USING btree ("skill_id", "version");--> statement-breakpoint
CREATE INDEX "skills_capability_idx" ON "skills" USING btree ("capability");--> statement-breakpoint

-- skill_runs
CREATE TABLE "skill_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "skill_id" text NOT NULL,
  "skill_version" integer NOT NULL DEFAULT 1,
  "agent_id" text,
  "trace_id" text,
  "plan_id" uuid,
  "plan_step_id" uuid,
  "status" "cog_skill_run_status" NOT NULL DEFAULT 'pending',
  "inputs" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "outputs" jsonb,
  "latency_ms" real,
  "tokens_used" integer,
  "cost_usd" real,
  "error_code" text,
  "error_message" text,
  "retries" integer NOT NULL DEFAULT 0,
  "approval_id" text,
  "confidence" real NOT NULL DEFAULT 1,
  "provenance_source" text NOT NULL DEFAULT 'agent',
  "provenance_method" "cog_provenance_method" NOT NULL DEFAULT 'agent',
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);--> statement-breakpoint
CREATE INDEX "skill_runs_skill_id_idx" ON "skill_runs" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "skill_runs_agent_id_idx" ON "skill_runs" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "skill_runs_trace_id_idx" ON "skill_runs" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "skill_runs_plan_id_idx" ON "skill_runs" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "skill_runs_status_idx" ON "skill_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "skill_runs_created_at_idx" ON "skill_runs" USING btree ("created_at");--> statement-breakpoint

-- plans
CREATE TABLE "plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "plan_id" text NOT NULL,
  "agent_id" text,
  "session_id" text,
  "workflow_id" text,
  "trace_id" text,
  "title" text NOT NULL,
  "description" text,
  "goal" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "status" "cog_plan_status" NOT NULL DEFAULT 'draft',
  "total_steps" integer NOT NULL DEFAULT 0,
  "completed_steps" integer NOT NULL DEFAULT 0,
  "failed_steps" integer NOT NULL DEFAULT 0,
  "fallback_plan_id" text,
  "parent_plan_id" text,
  "confidence" real NOT NULL DEFAULT 1,
  "sensitivity_tier" "cog_sensitivity_tier" NOT NULL DEFAULT 'internal',
  "provenance_source" text NOT NULL DEFAULT 'agent',
  "provenance_method" "cog_provenance_method" NOT NULL DEFAULT 'agent',
  "provenance_author" text,
  "freshness_last_updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "freshness_is_stale" boolean NOT NULL DEFAULT false,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "plans_plan_id_unique" UNIQUE("plan_id")
);--> statement-breakpoint
CREATE INDEX "plans_plan_id_idx" ON "plans" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "plans_agent_id_idx" ON "plans" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "plans_session_id_idx" ON "plans" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "plans_workflow_id_idx" ON "plans" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "plans_status_idx" ON "plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "plans_created_at_idx" ON "plans" USING btree ("created_at");--> statement-breakpoint

-- plan_steps
CREATE TABLE "plan_steps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "plan_id" uuid NOT NULL REFERENCES "plans"("id") ON DELETE CASCADE,
  "step_index" integer NOT NULL,
  "parent_step_id" uuid,
  "title" text NOT NULL,
  "description" text,
  "skill_id" text,
  "skill_version" integer,
  "skill_run_id" uuid,
  "status" "cog_plan_step_status" NOT NULL DEFAULT 'pending',
  "depends_on_step_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "inputs" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "outputs" jsonb,
  "approval_required" boolean NOT NULL DEFAULT false,
  "approval_id" text,
  "verifier_result_id" uuid,
  "confidence" real NOT NULL DEFAULT 1,
  "error_code" text,
  "error_message" text,
  "retries" integer NOT NULL DEFAULT 0,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);--> statement-breakpoint
CREATE INDEX "plan_steps_plan_id_idx" ON "plan_steps" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "plan_steps_status_idx" ON "plan_steps" USING btree ("status");--> statement-breakpoint
CREATE INDEX "plan_steps_step_index_idx" ON "plan_steps" USING btree ("plan_id", "step_index");--> statement-breakpoint

-- verifier_results
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
  "checks" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "overall_score" real,
  "blocker_count" integer NOT NULL DEFAULT 0,
  "warning_count" integer NOT NULL DEFAULT 0,
  "pass_count" integer NOT NULL DEFAULT 0,
  "reasoning" text,
  "confidence" real NOT NULL DEFAULT 1,
  "sensitivity_tier" "cog_sensitivity_tier" NOT NULL DEFAULT 'internal',
  "provenance_source" text NOT NULL DEFAULT 'agent',
  "provenance_method" "cog_provenance_method" NOT NULL DEFAULT 'agent',
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);--> statement-breakpoint
CREATE INDEX "verifier_results_target_idx" ON "verifier_results" USING btree ("target_type", "target_id");--> statement-breakpoint
CREATE INDEX "verifier_results_trace_id_idx" ON "verifier_results" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "verifier_results_outcome_idx" ON "verifier_results" USING btree ("outcome");--> statement-breakpoint
CREATE INDEX "verifier_results_plan_id_idx" ON "verifier_results" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "verifier_results_created_at_idx" ON "verifier_results" USING btree ("created_at");--> statement-breakpoint

-- reflections
CREATE TABLE "reflections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "reflection_id" text NOT NULL,
  "agent_id" text NOT NULL,
  "type" "cog_reflection_type" NOT NULL DEFAULT 'post-task',
  "trace_id" text,
  "plan_id" uuid,
  "session_id" text,
  "triggering_event" text,
  "summary" text NOT NULL,
  "observations" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "improvements" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "policy_breaches" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "confidence_adjustment" real NOT NULL DEFAULT 0,
  "overall_health" text NOT NULL DEFAULT 'good',
  "actionable" boolean NOT NULL DEFAULT false,
  "suggested_actions" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "confidence" real NOT NULL DEFAULT 1,
  "sensitivity_tier" "cog_sensitivity_tier" NOT NULL DEFAULT 'internal',
  "provenance_source" text NOT NULL DEFAULT 'agent',
  "provenance_method" "cog_provenance_method" NOT NULL DEFAULT 'agent',
  "freshness_last_updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "reflections_reflection_id_unique" UNIQUE("reflection_id")
);--> statement-breakpoint
CREATE INDEX "reflections_reflection_id_idx" ON "reflections" USING btree ("reflection_id");--> statement-breakpoint
CREATE INDEX "reflections_agent_id_idx" ON "reflections" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "reflections_type_idx" ON "reflections" USING btree ("type");--> statement-breakpoint
CREATE INDEX "reflections_trace_id_idx" ON "reflections" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "reflections_created_at_idx" ON "reflections" USING btree ("created_at");--> statement-breakpoint

-- policies
CREATE TABLE "policies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "policy_id" text NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "latest_version" integer NOT NULL DEFAULT 1,
  "name" text NOT NULL,
  "description" text,
  "domain" text NOT NULL DEFAULT 'general',
  "scope" text NOT NULL DEFAULT 'global',
  "effect" "cog_policy_effect" NOT NULL DEFAULT 'allow',
  "conditions" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "priority" integer NOT NULL DEFAULT 100,
  "enabled" boolean NOT NULL DEFAULT true,
  "owner" text,
  "tags" text[] NOT NULL DEFAULT '{}',
  "confidence" real NOT NULL DEFAULT 1,
  "sensitivity_tier" "cog_sensitivity_tier" NOT NULL DEFAULT 'internal',
  "provenance_source" text NOT NULL DEFAULT 'agent',
  "provenance_method" "cog_provenance_method" NOT NULL DEFAULT 'agent',
  "provenance_author" text,
  "freshness_last_updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "freshness_is_stale" boolean NOT NULL DEFAULT false,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);--> statement-breakpoint
CREATE INDEX "policies_policy_id_idx" ON "policies" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "policies_domain_idx" ON "policies" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "policies_enabled_idx" ON "policies" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "policies_priority_idx" ON "policies" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "policies_version_idx" ON "policies" USING btree ("policy_id", "version");--> statement-breakpoint

-- cog_actions
CREATE TABLE "cog_actions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "action_id" text NOT NULL,
  "agent_id" text,
  "trace_id" text,
  "plan_id" uuid,
  "plan_step_id" uuid,
  "skill_run_id" uuid,
  "domain" text NOT NULL DEFAULT 'general',
  "action_type" text NOT NULL,
  "description" text NOT NULL,
  "status" "cog_action_status" NOT NULL DEFAULT 'pending',
  "inputs" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "outputs" jsonb,
  "policy_id" text,
  "policy_version" integer,
  "approval_id" text,
  "verifier_result_id" uuid,
  "rollback_event_id" uuid,
  "is_reversible" boolean NOT NULL DEFAULT true,
  "rollback_procedure" jsonb,
  "business_impact" jsonb,
  "confidence" real NOT NULL DEFAULT 1,
  "sensitivity_tier" "cog_sensitivity_tier" NOT NULL DEFAULT 'internal',
  "provenance_source" text NOT NULL DEFAULT 'agent',
  "provenance_method" "cog_provenance_method" NOT NULL DEFAULT 'agent',
  "provenance_author" text,
  "freshness_last_updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "executed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "cog_actions_action_id_unique" UNIQUE("action_id")
);--> statement-breakpoint
CREATE INDEX "cog_actions_action_id_idx" ON "cog_actions" USING btree ("action_id");--> statement-breakpoint
CREATE INDEX "cog_actions_agent_id_idx" ON "cog_actions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "cog_actions_trace_id_idx" ON "cog_actions" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "cog_actions_plan_id_idx" ON "cog_actions" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "cog_actions_status_idx" ON "cog_actions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cog_actions_domain_idx" ON "cog_actions" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "cog_actions_created_at_idx" ON "cog_actions" USING btree ("created_at");--> statement-breakpoint

-- rollback_events
CREATE TABLE "rollback_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "rollback_id" text NOT NULL,
  "agent_id" text,
  "trace_id" text,
  "plan_id" uuid,
  "action_id" text,
  "trigger" "cog_rollback_trigger" NOT NULL DEFAULT 'agent',
  "reason" text NOT NULL,
  "target_type" text NOT NULL,
  "target_id" text NOT NULL,
  "state_before_rollback" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "state_after_rollback" jsonb,
  "success" boolean NOT NULL DEFAULT false,
  "error_code" text,
  "error_message" text,
  "confidence" real NOT NULL DEFAULT 1,
  "sensitivity_tier" "cog_sensitivity_tier" NOT NULL DEFAULT 'internal',
  "provenance_source" text NOT NULL DEFAULT 'agent',
  "provenance_method" "cog_provenance_method" NOT NULL DEFAULT 'agent',
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "initiated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "rollback_events_rollback_id_unique" UNIQUE("rollback_id")
);--> statement-breakpoint
CREATE INDEX "rollback_events_rollback_id_idx" ON "rollback_events" USING btree ("rollback_id");--> statement-breakpoint
CREATE INDEX "rollback_events_agent_id_idx" ON "rollback_events" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "rollback_events_trace_id_idx" ON "rollback_events" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "rollback_events_target_idx" ON "rollback_events" USING btree ("target_type", "target_id");--> statement-breakpoint
CREATE INDEX "rollback_events_trigger_idx" ON "rollback_events" USING btree ("trigger");--> statement-breakpoint
CREATE INDEX "rollback_events_created_at_idx" ON "rollback_events" USING btree ("created_at");
