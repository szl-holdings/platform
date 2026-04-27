-- SZL Decisioning persistence tables
-- Stores Action Engine execution runs, Decision Engine recommendations, and
-- Policy Engine violations for cross-session audit trails and historical analytics.

CREATE TABLE IF NOT EXISTS szl_decisioning_runs (
  id                    SERIAL PRIMARY KEY,
  run_id                TEXT NOT NULL UNIQUE,
  workflow_id           TEXT NOT NULL,
  workflow_name         TEXT NOT NULL,
  domain                TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'completed',
  initiated_by          TEXT,
  approved_by           TEXT,
  tenant_id             TEXT,
  recommendation_id     TEXT,
  is_dry_run            BOOLEAN NOT NULL DEFAULT FALSE,
  is_simulation         BOOLEAN NOT NULL DEFAULT FALSE,
  requires_approval     BOOLEAN NOT NULL DEFAULT FALSE,
  duration_ms           INTEGER,
  steps                 JSONB NOT NULL DEFAULT '[]',
  audit_trail           JSONB NOT NULL DEFAULT '[]',
  policy_evaluation     JSONB DEFAULT '{}',
  cost                  JSONB DEFAULT '{}',
  outcome               TEXT,
  outcome_summary       TEXT,
  outcome_impact        JSONB DEFAULT '{}',
  outcome_recorded_at   TIMESTAMPTZ,
  outcome_recorded_by   TEXT,
  metadata              JSONB DEFAULT '{}',
  started_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS szl_dr_run_id_idx         ON szl_decisioning_runs (run_id);
CREATE INDEX IF NOT EXISTS szl_dr_workflow_id_idx    ON szl_decisioning_runs (workflow_id);
CREATE INDEX IF NOT EXISTS szl_dr_status_idx         ON szl_decisioning_runs (status);
CREATE INDEX IF NOT EXISTS szl_dr_domain_idx         ON szl_decisioning_runs (domain);
CREATE INDEX IF NOT EXISTS szl_dr_tenant_idx         ON szl_decisioning_runs (tenant_id);
CREATE INDEX IF NOT EXISTS szl_dr_recommendation_idx ON szl_decisioning_runs (recommendation_id);
CREATE INDEX IF NOT EXISTS szl_dr_started_at_idx     ON szl_decisioning_runs (started_at DESC);

CREATE TABLE IF NOT EXISTS szl_decisioning_recommendations (
  id                      SERIAL PRIMARY KEY,
  session_id              TEXT NOT NULL,
  recommendation_id       TEXT NOT NULL,
  title                   TEXT NOT NULL,
  description             TEXT,
  domain                  TEXT NOT NULL,
  action                  TEXT,
  priority_score          REAL NOT NULL DEFAULT 0,
  confidence              REAL NOT NULL DEFAULT 0.5,
  urgency                 TEXT NOT NULL DEFAULT 'routine',
  business_impact         JSONB NOT NULL DEFAULT '{}',
  signals                 JSONB NOT NULL DEFAULT '[]',
  evidence                JSONB NOT NULL DEFAULT '[]',
  reasoning               TEXT,
  policy_state            TEXT NOT NULL DEFAULT 'unchecked',
  policy_evaluation       JSONB DEFAULT '{}',
  required_roles          JSONB NOT NULL DEFAULT '[]',
  estimated_effort_hours  REAL,
  estimated_cost_usd      REAL,
  suggested_owner         TEXT,
  is_actionable           BOOLEAN NOT NULL DEFAULT TRUE,
  tenant_id               TEXT,
  initiated_by            TEXT,
  metadata                JSONB DEFAULT '{}',
  evaluated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS szl_drec_session_idx      ON szl_decisioning_recommendations (session_id);
CREATE INDEX IF NOT EXISTS szl_drec_rec_id_idx       ON szl_decisioning_recommendations (recommendation_id);
CREATE INDEX IF NOT EXISTS szl_drec_domain_idx       ON szl_decisioning_recommendations (domain);
CREATE INDEX IF NOT EXISTS szl_drec_policy_state_idx ON szl_decisioning_recommendations (policy_state);
CREATE INDEX IF NOT EXISTS szl_drec_tenant_idx       ON szl_decisioning_recommendations (tenant_id);
CREATE INDEX IF NOT EXISTS szl_drec_evaluated_at_idx ON szl_decisioning_recommendations (evaluated_at DESC);

CREATE TABLE IF NOT EXISTS szl_policy_violations (
  id                  SERIAL PRIMARY KEY,
  policy_id           TEXT NOT NULL,
  policy_name         TEXT,
  rule_name           TEXT,
  effect              TEXT NOT NULL DEFAULT 'block',
  action              TEXT NOT NULL,
  domain              TEXT,
  subject_id          TEXT,
  subject_roles       JSONB NOT NULL DEFAULT '[]',
  resource_type       TEXT,
  resource_id         TEXT,
  reason              TEXT,
  estimated_cost_usd  REAL,
  confidence          REAL,
  run_id              TEXT,
  recommendation_id   TEXT,
  tenant_id           TEXT,
  metadata            JSONB DEFAULT '{}',
  occurred_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS szl_pv_policy_id_idx   ON szl_policy_violations (policy_id);
CREATE INDEX IF NOT EXISTS szl_pv_domain_idx      ON szl_policy_violations (domain);
CREATE INDEX IF NOT EXISTS szl_pv_effect_idx      ON szl_policy_violations (effect);
CREATE INDEX IF NOT EXISTS szl_pv_run_id_idx      ON szl_policy_violations (run_id);
CREATE INDEX IF NOT EXISTS szl_pv_tenant_idx      ON szl_policy_violations (tenant_id);
CREATE INDEX IF NOT EXISTS szl_pv_occurred_at_idx ON szl_policy_violations (occurred_at DESC);
