-- 0017: Simulation persistence, cognitive learning, A2A, alloy-comms, platform-status
-- Consolidates all inline DDL into tracked Drizzle migrations and adds new
-- covenant_simulation_runs and policy_sim_scenarios tables.

--> statement-breakpoint
-- A2A Protocol Tables
CREATE TABLE IF NOT EXISTS "a2a_agent_cards" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "agent_id" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "version" TEXT NOT NULL DEFAULT '1.0.0',
  "description" TEXT NOT NULL DEFAULT '',
  "capabilities" TEXT[] NOT NULL DEFAULT '{}',
  "input_schema" JSONB,
  "output_schema" JSONB,
  "preferred_model" TEXT NOT NULL,
  "preferred_provider" TEXT NOT NULL,
  "collaborates_with" TEXT[] NOT NULL DEFAULT '{}',
  "cost_per_call_usd" REAL NOT NULL DEFAULT 0.001,
  "avg_latency_ms" INTEGER NOT NULL DEFAULT 2000,
  "success_rate" REAL NOT NULL DEFAULT 0.95,
  "status" TEXT NOT NULL DEFAULT 'online',
  "last_heartbeat_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "registered_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "metadata" JSONB
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "a2a_delegation_tasks" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "task_id" TEXT NOT NULL UNIQUE,
  "requesting_agent_id" TEXT NOT NULL,
  "target_agent_id" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "context" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "result" TEXT,
  "result_confidence" REAL,
  "error_message" TEXT,
  "timeout_ms" INTEGER NOT NULL DEFAULT 30000,
  "requested_at" BIGINT NOT NULL,
  "accepted_at" BIGINT,
  "completed_at" BIGINT,
  "duration_ms" INTEGER,
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "orchestration_id" TEXT,
  "metadata" JSONB
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "a2a_agent_heartbeats" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "agent_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'online',
  "load" REAL NOT NULL DEFAULT 0,
  "active_tasks" INTEGER NOT NULL DEFAULT 0,
  "uptime_ms" BIGINT,
  "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "a2a_discovery_queries" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "query_id" TEXT NOT NULL UNIQUE,
  "requesting_agent_id" TEXT NOT NULL,
  "capability" TEXT,
  "domain" TEXT,
  "query_text" TEXT,
  "result_count" INTEGER NOT NULL DEFAULT 0,
  "top_match_agent_id" TEXT,
  "executed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_a2a_agent_cards_domain" ON "a2a_agent_cards" ("domain");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_a2a_agent_cards_status" ON "a2a_agent_cards" ("status");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_a2a_delegation_tasks_status" ON "a2a_delegation_tasks" ("status");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_a2a_delegation_tasks_agents" ON "a2a_delegation_tasks" ("requesting_agent_id", "target_agent_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_a2a_heartbeats_agent_id" ON "a2a_agent_heartbeats" ("agent_id");

--> statement-breakpoint
-- Alloy Skills Tables
CREATE TABLE IF NOT EXISTS "alloy_skill_registry" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "skill_id" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "version" TEXT NOT NULL DEFAULT '1.0.0',
  "capability" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "trigger_conditions" JSONB NOT NULL DEFAULT '[]',
  "required_inputs" JSONB NOT NULL DEFAULT '[]',
  "optional_inputs" JSONB NOT NULL DEFAULT '[]',
  "output_schema" JSONB NOT NULL DEFAULT '[]',
  "output_decision_type" TEXT NOT NULL,
  "chain_metadata" JSONB NOT NULL DEFAULT '{}',
  "analytic_mode" TEXT NOT NULL,
  "policy_class" TEXT NOT NULL,
  "estimated_latency_ms" INTEGER NOT NULL DEFAULT 10000,
  "tags" TEXT[] NOT NULL DEFAULT '{}',
  "is_builtin" BOOLEAN NOT NULL DEFAULT FALSE,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "registered_by" TEXT,
  "org_id" INTEGER,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_decision_outcomes" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "decision_id" TEXT NOT NULL UNIQUE,
  "agent_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "skill_id" TEXT,
  "capability" TEXT,
  "predicted_confidence" REAL NOT NULL,
  "actual_outcome" TEXT NOT NULL,
  "was_acted_on" BOOLEAN NOT NULL DEFAULT FALSE,
  "was_overridden" BOOLEAN NOT NULL DEFAULT FALSE,
  "override_reason" TEXT,
  "predicted_impact_level" TEXT NOT NULL,
  "actual_impact_level" TEXT,
  "recommended_action" TEXT NOT NULL,
  "final_action" TEXT,
  "execution_result" TEXT,
  "human_review_required" BOOLEAN NOT NULL DEFAULT FALSE,
  "human_review_requested" BOOLEAN NOT NULL DEFAULT FALSE,
  "decision_type" TEXT NOT NULL,
  "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "resolved_at" TIMESTAMPTZ
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_agent_performance_snapshots" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "agent_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "window_days" INTEGER NOT NULL,
  "total_decisions" INTEGER NOT NULL DEFAULT 0,
  "acceptance_rate" REAL NOT NULL DEFAULT 0,
  "override_rate" REAL NOT NULL DEFAULT 0,
  "rejection_rate" REAL NOT NULL DEFAULT 0,
  "weighted_accuracy_score" REAL NOT NULL DEFAULT 0,
  "mean_predicted_confidence" REAL NOT NULL DEFAULT 0,
  "mean_actual_acceptance_rate" REAL NOT NULL DEFAULT 0,
  "calibration_bias" REAL NOT NULL DEFAULT 0,
  "calibration_verdict" TEXT NOT NULL DEFAULT 'insufficient_data',
  "overall_health_score" REAL NOT NULL DEFAULT 0,
  "health_label" TEXT NOT NULL DEFAULT 'good',
  "flags" TEXT[] NOT NULL DEFAULT '{}',
  "skill_effectiveness" JSONB NOT NULL DEFAULT '[]',
  "trend" TEXT NOT NULL DEFAULT 'stable',
  "snapshot_taken_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_confidence_alerts" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "alert_id" TEXT NOT NULL UNIQUE,
  "agent_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "alert_type" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "current_value" REAL NOT NULL,
  "threshold" REAL NOT NULL,
  "trend" TEXT NOT NULL,
  "recommended_action" TEXT NOT NULL,
  "requires_human_review" BOOLEAN NOT NULL DEFAULT FALSE,
  "auto_resolvable" BOOLEAN NOT NULL DEFAULT TRUE,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "resolved_at" TIMESTAMPTZ,
  "resolved_by" TEXT
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_agent_reflections" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "agent_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "has_data" BOOLEAN NOT NULL DEFAULT FALSE,
  "context_block" TEXT NOT NULL,
  "confidence_adjustment" REAL NOT NULL DEFAULT 0,
  "reasoning_adjustments" JSONB NOT NULL DEFAULT '[]',
  "urgent_flags" TEXT[] NOT NULL DEFAULT '{}',
  "overall_health" TEXT NOT NULL DEFAULT 'good',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_self_improvement_config" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "agent_id" TEXT,
  "tenant_id" TEXT NOT NULL,
  "short_window_days" INTEGER NOT NULL DEFAULT 7,
  "long_window_days" INTEGER NOT NULL DEFAULT 30,
  "min_sample_size" INTEGER NOT NULL DEFAULT 5,
  "accuracy_decline_threshold" REAL NOT NULL DEFAULT 0.1,
  "override_rate_threshold" REAL NOT NULL DEFAULT 0.3,
  "low_acceptance_threshold" REAL NOT NULL DEFAULT 0.5,
  "calibration_drift_threshold" REAL NOT NULL DEFAULT 0.15,
  "self_reflection_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "alerts_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "auto_escalate_on_critical" BOOLEAN NOT NULL DEFAULT TRUE,
  "alert_cooldown_hours" INTEGER NOT NULL DEFAULT 4,
  "updated_by" TEXT,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_skill_registry_capability_idx" ON "alloy_skill_registry" ("capability");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_skill_registry_domain_idx" ON "alloy_skill_registry" ("domain");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_skill_registry_active_idx" ON "alloy_skill_registry" ("is_active");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_decision_outcomes_agent_idx" ON "alloy_decision_outcomes" ("agent_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_decision_outcomes_tenant_idx" ON "alloy_decision_outcomes" ("tenant_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_decision_outcomes_outcome_idx" ON "alloy_decision_outcomes" ("actual_outcome");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_decision_outcomes_recorded_idx" ON "alloy_decision_outcomes" ("recorded_at");

--> statement-breakpoint
-- Cognitive Learning Tables
CREATE TABLE IF NOT EXISTS "alloy_evidence_index" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "case_id" TEXT,
  "incident_id" TEXT,
  "source" TEXT NOT NULL,
  "source_type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "tags" TEXT[] NOT NULL DEFAULT '{}',
  "freshness" TEXT NOT NULL DEFAULT 'current',
  "entry_timestamp" TEXT,
  "object_id" TEXT,
  "relevance_boost" REAL NOT NULL DEFAULT 1.0,
  "embedding" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_case_memory" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "case_id" TEXT NOT NULL UNIQUE,
  "snapshot" JSONB NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_conversation_summaries" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "conversation_id" TEXT NOT NULL UNIQUE,
  "agent_id" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "topics" TEXT[] NOT NULL DEFAULT '{}',
  "message_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_outcome_learning" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "decision_id" TEXT NOT NULL,
  "agent_id" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "original_action" TEXT NOT NULL,
  "final_action" TEXT,
  "original_confidence" REAL NOT NULL,
  "topic" TEXT NOT NULL,
  "topic_keywords" TEXT[] NOT NULL DEFAULT '{}',
  "override_reason" TEXT,
  "org_id" INTEGER,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_agent_corrections" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "source_agent_id" TEXT NOT NULL,
  "validator_agent_id" TEXT NOT NULL,
  "original_output" TEXT NOT NULL,
  "corrected_output" TEXT NOT NULL,
  "validation_notes" TEXT,
  "validation_status" TEXT NOT NULL,
  "topic_keywords" TEXT[] NOT NULL DEFAULT '{}',
  "org_id" INTEGER,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "eval_runs" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "run_id" TEXT NOT NULL UNIQUE,
  "model" TEXT NOT NULL,
  "total_tests" INTEGER NOT NULL,
  "passed" INTEGER NOT NULL,
  "failed" INTEGER NOT NULL,
  "pass_rate" TEXT NOT NULL,
  "avg_latency_ms" INTEGER NOT NULL,
  "by_category" JSONB NOT NULL DEFAULT '{}',
  "results" JSONB NOT NULL DEFAULT '[]',
  "triggered_by" TEXT NOT NULL DEFAULT 'scheduled',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_alloy_evidence_case" ON "alloy_evidence_index" ("case_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_alloy_evidence_incident" ON "alloy_evidence_index" ("incident_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_alloy_evidence_updated" ON "alloy_evidence_index" ("updated_at" DESC);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_alloy_case_memory_case" ON "alloy_case_memory" ("case_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_alloy_conv_agent" ON "alloy_conversation_summaries" ("agent_id", "created_at" DESC);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_alloy_outcome_agent" ON "alloy_outcome_learning" ("agent_id", "created_at" DESC);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_alloy_outcome_org" ON "alloy_outcome_learning" ("org_id", "agent_id", "created_at" DESC);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_alloy_corrections_source" ON "alloy_agent_corrections" ("source_agent_id", "created_at" DESC);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_alloy_corrections_org" ON "alloy_agent_corrections" ("org_id", "source_agent_id", "created_at" DESC);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_eval_runs_created" ON "eval_runs" ("created_at" DESC);

--> statement-breakpoint
-- Distribution OS schema drift (idempotent ALTER TABLE)
ALTER TABLE "dos_leads" ADD COLUMN IF NOT EXISTS "next_follow_up" TIMESTAMPTZ;

--> statement-breakpoint
ALTER TABLE "dos_leads" ADD COLUMN IF NOT EXISTS "last_action" TEXT;

--> statement-breakpoint
-- agent_memory_facts retrieval_count column (cognitive learning migration)
ALTER TABLE "agent_memory_facts" ADD COLUMN IF NOT EXISTS "retrieval_count" INTEGER NOT NULL DEFAULT 0;

--> statement-breakpoint
-- Alloy Communications Tables (channels, email, digest, integrations, meetings, research, voice, chat)
CREATE TABLE IF NOT EXISTS "alloy_channel_configs" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "channel_type" TEXT NOT NULL DEFAULT 'slack',
  "channel_id" TEXT NOT NULL,
  "channel_name" TEXT,
  "workspace_id" TEXT,
  "trust_level" TEXT NOT NULL DEFAULT 'standard',
  "allowed_skills" JSONB DEFAULT '[]',
  "approval_class" TEXT NOT NULL DEFAULT 'standard',
  "is_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("channel_type", "channel_id")
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_channel_audit" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "channel_type" TEXT NOT NULL,
  "channel_id" TEXT NOT NULL,
  "channel_name" TEXT,
  "user_id" TEXT,
  "user_name" TEXT,
  "message" TEXT,
  "skill_invoked" TEXT,
  "workflow_id" TEXT,
  "approval_status" TEXT,
  "outcome" TEXT,
  "outcome_detail" TEXT,
  "trust_level" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_pending_approvals_chat" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "channel_type" TEXT NOT NULL,
  "channel_id" TEXT NOT NULL,
  "message_ts" TEXT,
  "workflow_id" TEXT,
  "approval_id" TEXT,
  "requester_user_id" TEXT,
  "requester_name" TEXT,
  "action_description" TEXT,
  "approval_class" TEXT NOT NULL DEFAULT 'standard',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "reviewed_by" TEXT,
  "review_note" TEXT,
  "expires_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_daily_digests" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "digest_date" DATE NOT NULL DEFAULT CURRENT_DATE,
  "role_scope" TEXT NOT NULL DEFAULT 'executive',
  "user_id" INTEGER,
  "content" JSONB NOT NULL DEFAULT '{}',
  "markdown_content" TEXT,
  "key_decisions" JSONB DEFAULT '[]',
  "pending_approvals" JSONB DEFAULT '[]',
  "workflow_summary" JSONB DEFAULT '{}',
  "signals_summary" JSONB DEFAULT '{}',
  "metrics" JSONB DEFAULT '{}',
  "suggested_priorities" JSONB DEFAULT '[]',
  "delivery_channels" JSONB DEFAULT '["in_app"]',
  "delivered_at" JSONB DEFAULT '{}',
  "status" TEXT NOT NULL DEFAULT 'draft',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("digest_date", "role_scope", "user_id")
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_email_triage" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "subject" TEXT NOT NULL,
  "sender_email" TEXT NOT NULL,
  "sender_name" TEXT,
  "recipient_email" TEXT,
  "body_text" TEXT,
  "body_html" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "category" TEXT NOT NULL DEFAULT 'general',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "ai_summary" TEXT,
  "ai_intent" TEXT,
  "ai_priority_score" INTEGER DEFAULT 50,
  "auto_draft" TEXT,
  "draft_approved" BOOLEAN DEFAULT FALSE,
  "routed_to_workflow" TEXT,
  "routed_at" TIMESTAMP,
  "labels" JSONB DEFAULT '[]',
  "alloy_signal_id" TEXT,
  "metadata" JSONB DEFAULT '{}',
  "received_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "processed_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_email_rules" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "is_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "conditions" JSONB NOT NULL DEFAULT '[]',
  "action" TEXT NOT NULL,
  "action_params" JSONB DEFAULT '{}',
  "priority" INTEGER NOT NULL DEFAULT 50,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_integration_connections" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "integration_type" TEXT NOT NULL,
  "integration_name" TEXT NOT NULL,
  "display_name" TEXT,
  "tenant_id" TEXT,
  "auth_type" TEXT NOT NULL DEFAULT 'webhook',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "is_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "scope" JSONB DEFAULT '[]',
  "approval_class" TEXT NOT NULL DEFAULT 'standard',
  "config" JSONB DEFAULT '{}',
  "rate_limit_rpm" INTEGER DEFAULT 60,
  "rate_limit_rph" INTEGER DEFAULT 1000,
  "failure_count" INTEGER DEFAULT 0,
  "last_failure_at" TIMESTAMP,
  "last_success_at" TIMESTAMP,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_integration_events" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "connection_id" TEXT NOT NULL,
  "integration_type" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "direction" TEXT NOT NULL DEFAULT 'inbound',
  "payload" JSONB,
  "status" TEXT NOT NULL DEFAULT 'received',
  "error_message" TEXT,
  "processed_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_webhook_endpoints" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "secret" TEXT NOT NULL,
  "is_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "allowed_events" JSONB DEFAULT '["*"]',
  "target_skill" TEXT,
  "target_workflow_type" TEXT,
  "headers_to_capture" JSONB DEFAULT '[]',
  "metadata" JSONB DEFAULT '{}',
  "event_count" INTEGER DEFAULT 0,
  "last_received_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_meetings" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "meeting_date" TIMESTAMP,
  "duration_minutes" INTEGER,
  "attendees" JSONB DEFAULT '[]',
  "transcript" TEXT,
  "recording_url" TEXT,
  "structured_notes" JSONB DEFAULT '{}',
  "decisions" JSONB DEFAULT '[]',
  "action_items" JSONB DEFAULT '[]',
  "follow_up_draft" TEXT,
  "summary" TEXT,
  "status" TEXT NOT NULL DEFAULT 'processing',
  "context_compiled" JSONB DEFAULT '{}',
  "workflow_ids" JSONB DEFAULT '[]',
  "metadata" JSONB DEFAULT '{}',
  "created_by" INTEGER,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_meeting_action_items" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "meeting_id" TEXT NOT NULL REFERENCES "alloy_meetings"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "assignee" TEXT,
  "assignee_email" TEXT,
  "due_date" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "status" TEXT NOT NULL DEFAULT 'open',
  "alloy_task_id" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_meeting_decisions" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "meeting_id" TEXT NOT NULL REFERENCES "alloy_meetings"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "decided_by" TEXT,
  "impact" TEXT,
  "rationale" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_research_spaces" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'idle',
  "findings" JSONB NOT NULL DEFAULT '[]',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "last_run_at" TIMESTAMP,
  "metadata" JSONB DEFAULT '{}'
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_browser_tasks" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "start_url" TEXT NOT NULL,
  "objective" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'idle',
  "actions" JSONB NOT NULL DEFAULT '[]',
  "planned_actions" JSONB,
  "error" TEXT,
  "duration_ms" INTEGER,
  "started_at" TIMESTAMP,
  "completed_at" TIMESTAMP,
  "metadata" JSONB DEFAULT '{}'
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_url_allowlist" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "pattern" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'read',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_voice_notes" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT,
  "transcription" TEXT,
  "ai_summary" TEXT,
  "detected_intent" TEXT,
  "converted_to" TEXT,
  "converted_id" TEXT,
  "duration_seconds" REAL,
  "language" TEXT DEFAULT 'en',
  "audio_size_bytes" INTEGER,
  "audio_mime_type" TEXT,
  "status" TEXT NOT NULL DEFAULT 'processing',
  "metadata" JSONB DEFAULT '{}',
  "created_by" INTEGER,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_chat_kb_documents" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "source_type" TEXT NOT NULL,
  "source_url" TEXT,
  "content" TEXT NOT NULL,
  "chunk_index" INTEGER NOT NULL DEFAULT 0,
  "total_chunks" INTEGER NOT NULL DEFAULT 1,
  "embedding" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_chat_advisories" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'info',
  "is_read" BOOLEAN NOT NULL DEFAULT FALSE,
  "metadata" JSONB,
  "generated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_chat_comparisons" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "prompt" TEXT NOT NULL,
  "results" JSONB NOT NULL,
  "ratings" JSONB,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
-- Platform Status & Contact Tables
CREATE TABLE IF NOT EXISTS "platform_status_checks" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "service_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'operational',
  "latency_ms" INTEGER,
  "checked_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_status_checks_service" ON "platform_status_checks" ("service_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_status_checks_checked" ON "platform_status_checks" ("checked_at" DESC);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "platform_incidents" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'investigating',
  "severity" TEXT NOT NULL DEFAULT 'minor',
  "affected_services" TEXT[] NOT NULL DEFAULT '{}',
  "description" TEXT NOT NULL,
  "resolved_at" TIMESTAMP,
  "posted_by" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_incidents_created" ON "platform_incidents" ("created_at" DESC);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_incidents_status" ON "platform_incidents" ("status");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "platform_incident_updates" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "incident_id" INTEGER NOT NULL REFERENCES "platform_incidents"("id") ON DELETE CASCADE,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_incident_updates_incident" ON "platform_incident_updates" ("incident_id");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "platform_status_subscriptions" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "subscribed_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "active" BOOLEAN NOT NULL DEFAULT TRUE
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_status_subs_email" ON "platform_status_subscriptions" ("email");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "platform_contact_requests" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'general',
  "app" TEXT NOT NULL DEFAULT 'unknown',
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "company" TEXT,
  "role" TEXT,
  "message" TEXT,
  "metadata" JSONB,
  "status" TEXT NOT NULL DEFAULT 'new',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contact_requests_app" ON "platform_contact_requests" ("app");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contact_requests_status" ON "platform_contact_requests" ("status");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contact_requests_created" ON "platform_contact_requests" ("created_at" DESC);

--> statement-breakpoint
-- Covenant Policy Simulation Persistence
CREATE TABLE IF NOT EXISTS "covenant_simulation_runs" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "request_id" TEXT NOT NULL UNIQUE,
  "subject_roles" TEXT[] NOT NULL DEFAULT '{}',
  "subject_user_id" TEXT,
  "subject_tenant_id" TEXT,
  "resource_type" TEXT NOT NULL,
  "resource_id" TEXT,
  "resource_domain" TEXT,
  "action" TEXT NOT NULL,
  "effect" TEXT NOT NULL,
  "allowed" INTEGER NOT NULL DEFAULT 0,
  "matched_policies" TEXT[] NOT NULL DEFAULT '{}',
  "denied_by" TEXT,
  "reason" TEXT,
  "explanation" TEXT[] NOT NULL DEFAULT '{}',
  "context" JSONB,
  "evaluated_at" BIGINT NOT NULL,
  "duration_ms" INTEGER NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_covenant_sim_effect" ON "covenant_simulation_runs" ("effect");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_covenant_sim_action" ON "covenant_simulation_runs" ("action");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_covenant_sim_created" ON "covenant_simulation_runs" ("created_at" DESC);

--> statement-breakpoint
-- Policy Sim Console Scenarios
CREATE TABLE IF NOT EXISTS "policy_sim_scenarios" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "subject_roles" TEXT[] NOT NULL DEFAULT '{}',
  "subject_user_id" TEXT,
  "subject_tenant_id" TEXT,
  "resource_type" TEXT NOT NULL,
  "resource_id" TEXT,
  "resource_domain" TEXT,
  "action" TEXT NOT NULL,
  "context" JSONB,
  "last_result" JSONB,
  "last_run_at" TIMESTAMP,
  "run_count" INTEGER NOT NULL DEFAULT 0,
  "created_by" TEXT,
  "org_id" INTEGER,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_policy_sim_org" ON "policy_sim_scenarios" ("org_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_policy_sim_created" ON "policy_sim_scenarios" ("created_at" DESC);

--> statement-breakpoint
-- AI Decision Store Tables
CREATE TABLE IF NOT EXISTS "alloy_ai_decisions" (
  "decision_id" TEXT PRIMARY KEY NOT NULL,
  "org_id" INTEGER,
  "workflow_id" TEXT,
  "signal_ids" JSONB NOT NULL DEFAULT '[]',
  "recommended_action" TEXT NOT NULL,
  "rationale_summary" TEXT NOT NULL,
  "evidence_refs" JSONB NOT NULL DEFAULT '[]',
  "confidence" REAL NOT NULL DEFAULT 0.5,
  "owner_suggestion" TEXT,
  "approval_required" BOOLEAN NOT NULL DEFAULT FALSE,
  "risk_level" TEXT NOT NULL,
  "fallback_plan" TEXT,
  "model_route" TEXT NOT NULL,
  "schema_version" TEXT NOT NULL DEFAULT '2.0.0',
  "status" TEXT NOT NULL DEFAULT 'proposed',
  "approved_by" TEXT,
  "approved_at" TIMESTAMPTZ,
  "rejected_by" TEXT,
  "rejected_at" TIMESTAMPTZ,
  "rejection_reason" TEXT,
  "executed_at" TIMESTAMPTZ,
  "execution_outcome" TEXT,
  "raw_input" TEXT,
  "raw_output" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_ai_decisions_org_id_idx" ON "alloy_ai_decisions" ("org_id");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_ai_audit_log" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "decision_id" TEXT,
  "org_id" INTEGER,
  "endpoint" TEXT NOT NULL,
  "model" TEXT,
  "route_class" TEXT,
  "confidence" REAL,
  "latency_ms" INTEGER,
  "approver_user_id" INTEGER,
  "approver_roles" JSONB,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_ai_audit_log_org_id_idx" ON "alloy_ai_audit_log" ("org_id");

--> statement-breakpoint
-- RAG Knowledge Chunks (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rag_knowledge_chunks" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "content" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "source_type" TEXT NOT NULL,
  "domain" TEXT NOT NULL DEFAULT 'general',
  "sensitivity_level" TEXT NOT NULL DEFAULT 'internal',
  "object_id" TEXT,
  "chunk_index" INTEGER NOT NULL DEFAULT 0,
  "chunk_hash" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "embedding" vector(1536),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rag_chunks_source_type_idx" ON "rag_knowledge_chunks" ("source_type");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rag_chunks_domain_idx" ON "rag_knowledge_chunks" ("domain");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rag_chunks_sensitivity_idx" ON "rag_knowledge_chunks" ("sensitivity_level");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rag_chunks_object_id_idx" ON "rag_knowledge_chunks" ("object_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rag_chunks_created_idx" ON "rag_knowledge_chunks" ("created_at");

--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rag_knowledge_chunks' AND column_name = 'embedding'
    AND udt_name = 'vector'
  ) THEN
    CREATE INDEX IF NOT EXISTS rag_chunks_embedding_hnsw_idx
      ON rag_knowledge_chunks USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
  END IF;
END $$;

--> statement-breakpoint
-- Agent Self-Improvement tables
CREATE TABLE IF NOT EXISTS "agent_performance_snapshots" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "agent_id" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "total_decisions" INTEGER NOT NULL DEFAULT 0,
  "accepted_decisions" INTEGER NOT NULL DEFAULT 0,
  "rejected_decisions" INTEGER NOT NULL DEFAULT 0,
  "overridden_decisions" INTEGER NOT NULL DEFAULT 0,
  "avg_confidence" REAL NOT NULL DEFAULT 0.5,
  "calibration_bias" REAL NOT NULL DEFAULT 0,
  "accuracy_score" REAL NOT NULL DEFAULT 0.5,
  "confidence_trend" TEXT NOT NULL DEFAULT 'stable',
  "flagged_for_review" BOOLEAN NOT NULL DEFAULT FALSE,
  "review_reason" TEXT,
  "computed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_perf_snapshots_agent_idx" ON "agent_performance_snapshots" ("agent_id");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agent_self_reflections" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "agent_id" TEXT NOT NULL,
  "reflection_period" TEXT NOT NULL,
  "key_observations" JSONB NOT NULL DEFAULT '[]',
  "adjustment_recommendations" JSONB NOT NULL DEFAULT '[]',
  "confidence_adjustment" REAL NOT NULL DEFAULT 0,
  "should_request_human_review" BOOLEAN NOT NULL DEFAULT FALSE,
  "human_review_reason" TEXT,
  "performance_score" REAL NOT NULL DEFAULT 0.5,
  "computed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_self_reflections_agent_idx" ON "agent_self_reflections" ("agent_id");

--> statement-breakpoint
-- RAG Knowledge Documents
CREATE TABLE IF NOT EXISTS "rag_knowledge_documents" (
  "doc_id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "domain" TEXT NOT NULL DEFAULT 'general',
  "source_type" TEXT NOT NULL DEFAULT 'document',
  "tags" JSONB NOT NULL DEFAULT '[]',
  "importance" INTEGER NOT NULL DEFAULT 5,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rag_docs_domain_idx" ON "rag_knowledge_documents" ("domain");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rag_docs_source_type_idx" ON "rag_knowledge_documents" ("source_type");
