-- Task #2281: Decision Runtime tables for Decision Center v1.
-- Backs the governed decision system: cards, evidence, validations, run traces,
-- audit events, and workspace constitutions.

-- ─── Workspace Constitutions ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "workspace_constitutions" (
  "id" SERIAL PRIMARY KEY,
  "workspace_id" TEXT NOT NULL,
  "version" TEXT NOT NULL DEFAULT '1.0',
  "name" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "required_approvals" JSONB NOT NULL DEFAULT '{}',
  "action_redlines" JSONB NOT NULL DEFAULT '[]',
  "autonomy_ceilings" JSONB NOT NULL DEFAULT '{}',
  "confidence_floor" REAL NOT NULL DEFAULT 0.75,
  "freshness_max_hours" INTEGER NOT NULL DEFAULT 24,
  "extra_rules" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "wc_workspace_id_idx" ON "workspace_constitutions" ("workspace_id");
CREATE INDEX IF NOT EXISTS "wc_workspace_active_idx" ON "workspace_constitutions" ("workspace_id", "is_active");

-- ─── Decision Cards ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "decisions_runtime" (
  "id" SERIAL PRIMARY KEY,
  "card_id" TEXT NOT NULL UNIQUE,
  "workspace_id" TEXT NOT NULL,
  "domain" TEXT NOT NULL DEFAULT 'lyte',
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'medium',
  "autonomy_mode" TEXT NOT NULL DEFAULT 'recommend',
  "status" TEXT NOT NULL DEFAULT 'draft',
  "policy_state" TEXT NOT NULL DEFAULT 'pending',
  "freshness" TEXT NOT NULL DEFAULT 'recent',
  "confidence" REAL NOT NULL DEFAULT 0.75,
  "entity_scope" JSONB NOT NULL DEFAULT '[]',
  "recommended_action" TEXT,
  "reasoning" TEXT,
  "owner" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 50,
  "constitution_id" INTEGER,
  "policy_evaluation" JSONB DEFAULT '{}',
  "validation_summary" JSONB DEFAULT '{}',
  "audit_event_id" TEXT,
  "metadata" JSONB DEFAULT '{}',
  "generated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "reviewed_at" TIMESTAMP WITH TIME ZONE,
  "reviewed_by" TEXT,
  "review_note" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "dr_card_id_idx" ON "decisions_runtime" ("card_id");
CREATE INDEX IF NOT EXISTS "dr_workspace_id_idx" ON "decisions_runtime" ("workspace_id");
CREATE INDEX IF NOT EXISTS "dr_domain_idx" ON "decisions_runtime" ("domain");
CREATE INDEX IF NOT EXISTS "dr_severity_idx" ON "decisions_runtime" ("severity");
CREATE INDEX IF NOT EXISTS "dr_status_idx" ON "decisions_runtime" ("status");
CREATE INDEX IF NOT EXISTS "dr_autonomy_mode_idx" ON "decisions_runtime" ("autonomy_mode");
CREATE INDEX IF NOT EXISTS "dr_workspace_domain_idx" ON "decisions_runtime" ("workspace_id", "domain");
CREATE INDEX IF NOT EXISTS "dr_workspace_status_idx" ON "decisions_runtime" ("workspace_id", "status");
CREATE INDEX IF NOT EXISTS "dr_created_at_idx" ON "decisions_runtime" ("created_at");

-- ─── Decision Evidence ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "decision_evidence" (
  "id" SERIAL PRIMARY KEY,
  "card_id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "excerpt" TEXT,
  "source_type" TEXT NOT NULL DEFAULT 'signal',
  "freshness" TEXT NOT NULL DEFAULT 'recent',
  "confidence" REAL NOT NULL DEFAULT 0.8,
  "captured_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "order_idx" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "de_card_id_idx" ON "decision_evidence" ("card_id");
CREATE INDEX IF NOT EXISTS "de_workspace_id_idx" ON "decision_evidence" ("workspace_id");

-- ─── Decision Validations ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "decision_validations" (
  "id" SERIAL PRIMARY KEY,
  "card_id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "check_type" TEXT NOT NULL,
  "passed" BOOLEAN NOT NULL DEFAULT FALSE,
  "explanation" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'blocking',
  "metadata" JSONB DEFAULT '{}',
  "ran_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "dv_card_id_idx" ON "decision_validations" ("card_id");
CREATE INDEX IF NOT EXISTS "dv_workspace_id_idx" ON "decision_validations" ("workspace_id");
CREATE INDEX IF NOT EXISTS "dv_check_type_idx" ON "decision_validations" ("check_type");

-- ─── Decision Runs ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "decision_runs" (
  "id" SERIAL PRIMARY KEY,
  "card_id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "run_id" TEXT NOT NULL UNIQUE,
  "steps" JSONB NOT NULL DEFAULT '[]',
  "total_latency_ms" INTEGER,
  "total_input_tokens" INTEGER,
  "total_output_tokens" INTEGER,
  "estimated_cost_usd" REAL,
  "models_called" JSONB NOT NULL DEFAULT '[]',
  "tools_called" JSONB NOT NULL DEFAULT '[]',
  "handoffs" JSONB NOT NULL DEFAULT '[]',
  "status" TEXT NOT NULL DEFAULT 'completed',
  "metadata" JSONB DEFAULT '{}',
  "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "completed_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "drn_card_id_idx" ON "decision_runs" ("card_id");
CREATE INDEX IF NOT EXISTS "drn_workspace_id_idx" ON "decision_runs" ("workspace_id");
CREATE INDEX IF NOT EXISTS "drn_run_id_idx" ON "decision_runs" ("run_id");

-- ─── Decision Audit Events ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "decision_audit_events" (
  "id" SERIAL PRIMARY KEY,
  "event_id" TEXT NOT NULL UNIQUE,
  "card_id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "actor_id" TEXT NOT NULL,
  "actor_type" TEXT NOT NULL DEFAULT 'system',
  "actor_display" TEXT,
  "reason" TEXT,
  "previous_status" TEXT,
  "new_status" TEXT,
  "metadata" JSONB DEFAULT '{}',
  "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "dae_event_id_idx" ON "decision_audit_events" ("event_id");
CREATE INDEX IF NOT EXISTS "dae_card_id_idx" ON "decision_audit_events" ("card_id");
CREATE INDEX IF NOT EXISTS "dae_workspace_id_idx" ON "decision_audit_events" ("workspace_id");
CREATE INDEX IF NOT EXISTS "dae_event_type_idx" ON "decision_audit_events" ("event_type");
CREATE INDEX IF NOT EXISTS "dae_occurred_at_idx" ON "decision_audit_events" ("occurred_at");
