-- Migration 0017: Consolidated runtime ensure*Tables into Drizzle SQL
-- Covers: A2A protocol, cognitive learning, alloy skills, RMM tables, Distribution OS schema drift
-- All statements use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS for idempotency

-- ─── A2A PROTOCOL TABLES ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS a2a_agent_cards (
  id SERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  description TEXT NOT NULL DEFAULT '',
  capabilities TEXT[] NOT NULL DEFAULT '{}',
  input_schema JSONB,
  output_schema JSONB,
  preferred_model TEXT NOT NULL,
  preferred_provider TEXT NOT NULL,
  collaborates_with TEXT[] NOT NULL DEFAULT '{}',
  cost_per_call_usd REAL NOT NULL DEFAULT 0.001,
  avg_latency_ms INTEGER NOT NULL DEFAULT 2000,
  success_rate REAL NOT NULL DEFAULT 0.95,
  status TEXT NOT NULL DEFAULT 'online',
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_a2a_agent_cards_domain ON a2a_agent_cards (domain);
CREATE INDEX IF NOT EXISTS idx_a2a_agent_cards_status ON a2a_agent_cards (status);

CREATE TABLE IF NOT EXISTS a2a_delegation_tasks (
  id SERIAL PRIMARY KEY,
  task_id TEXT NOT NULL UNIQUE,
  requesting_agent_id TEXT NOT NULL,
  target_agent_id TEXT NOT NULL,
  query TEXT NOT NULL,
  context TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',
  result TEXT,
  result_confidence REAL,
  error_message TEXT,
  timeout_ms INTEGER NOT NULL DEFAULT 30000,
  requested_at BIGINT NOT NULL,
  accepted_at BIGINT,
  completed_at BIGINT,
  duration_ms INTEGER,
  retry_count INTEGER NOT NULL DEFAULT 0,
  orchestration_id TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_a2a_delegation_tasks_status ON a2a_delegation_tasks (status);
CREATE INDEX IF NOT EXISTS idx_a2a_delegation_tasks_agents ON a2a_delegation_tasks (requesting_agent_id, target_agent_id);

CREATE TABLE IF NOT EXISTS a2a_agent_heartbeats (
  id SERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'online',
  load REAL NOT NULL DEFAULT 0,
  active_tasks INTEGER NOT NULL DEFAULT 0,
  uptime_ms BIGINT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_a2a_heartbeats_agent_id ON a2a_agent_heartbeats (agent_id);

CREATE TABLE IF NOT EXISTS a2a_discovery_queries (
  id SERIAL PRIMARY KEY,
  query_id TEXT NOT NULL UNIQUE,
  requesting_agent_id TEXT NOT NULL,
  capability TEXT,
  domain TEXT,
  query_text TEXT,
  result_count INTEGER NOT NULL DEFAULT 0,
  top_match_agent_id TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── COGNITIVE LEARNING TABLES ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alloy_evidence_index (
  id TEXT PRIMARY KEY,
  case_id TEXT,
  incident_id TEXT,
  source TEXT NOT NULL,
  source_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  freshness TEXT NOT NULL DEFAULT 'current',
  entry_timestamp TEXT,
  object_id TEXT,
  relevance_boost REAL NOT NULL DEFAULT 1.0,
  embedding JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alloy_evidence_case ON alloy_evidence_index (case_id);
CREATE INDEX IF NOT EXISTS idx_alloy_evidence_incident ON alloy_evidence_index (incident_id);
CREATE INDEX IF NOT EXISTS idx_alloy_evidence_updated ON alloy_evidence_index (updated_at DESC);

CREATE TABLE IF NOT EXISTS alloy_case_memory (
  id SERIAL PRIMARY KEY,
  case_id TEXT NOT NULL UNIQUE,
  snapshot JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alloy_case_memory_case ON alloy_case_memory (case_id);

CREATE TABLE IF NOT EXISTS alloy_conversation_summaries (
  id SERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL UNIQUE,
  agent_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  topics TEXT[] NOT NULL DEFAULT '{}',
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alloy_conv_agent ON alloy_conversation_summaries (agent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS alloy_outcome_learning (
  id SERIAL PRIMARY KEY,
  decision_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  outcome TEXT NOT NULL,
  original_action TEXT NOT NULL,
  final_action TEXT,
  original_confidence REAL NOT NULL,
  topic TEXT NOT NULL,
  topic_keywords TEXT[] NOT NULL DEFAULT '{}',
  override_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alloy_outcome_agent ON alloy_outcome_learning (agent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS alloy_agent_corrections (
  id SERIAL PRIMARY KEY,
  source_agent_id TEXT NOT NULL,
  validator_agent_id TEXT NOT NULL,
  original_output TEXT NOT NULL,
  corrected_output TEXT NOT NULL,
  validation_notes TEXT,
  validation_status TEXT NOT NULL,
  topic_keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alloy_corrections_source ON alloy_agent_corrections (source_agent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS eval_runs (
  id SERIAL PRIMARY KEY,
  run_id TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  total_tests INTEGER NOT NULL,
  passed INTEGER NOT NULL,
  failed INTEGER NOT NULL,
  pass_rate TEXT NOT NULL,
  avg_latency_ms INTEGER NOT NULL,
  by_category JSONB NOT NULL DEFAULT '{}',
  results JSONB NOT NULL DEFAULT '[]',
  triggered_by TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eval_runs_created ON eval_runs (created_at DESC);

ALTER TABLE agent_memory_facts ADD COLUMN IF NOT EXISTS retrieval_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE alloy_outcome_learning ADD COLUMN IF NOT EXISTS org_id INTEGER;
ALTER TABLE alloy_agent_corrections ADD COLUMN IF NOT EXISTS org_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_alloy_outcome_org ON alloy_outcome_learning (org_id, agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alloy_corrections_org ON alloy_agent_corrections (org_id, source_agent_id, created_at DESC);

-- ─── ALLOY SKILLS & SELF-IMPROVEMENT TABLES ──────────────────────────────────

CREATE TABLE IF NOT EXISTS alloy_skill_registry (
  id SERIAL PRIMARY KEY,
  skill_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  capability TEXT NOT NULL,
  domain TEXT NOT NULL,
  description TEXT NOT NULL,
  trigger_conditions JSONB NOT NULL DEFAULT '[]',
  required_inputs JSONB NOT NULL DEFAULT '[]',
  optional_inputs JSONB NOT NULL DEFAULT '[]',
  output_schema JSONB NOT NULL DEFAULT '[]',
  output_decision_type TEXT NOT NULL,
  chain_metadata JSONB NOT NULL DEFAULT '{}',
  analytic_mode TEXT NOT NULL,
  policy_class TEXT NOT NULL,
  estimated_latency_ms INTEGER NOT NULL DEFAULT 10000,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_builtin BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  registered_by TEXT,
  org_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS alloy_skill_registry_capability_idx ON alloy_skill_registry (capability);
CREATE INDEX IF NOT EXISTS alloy_skill_registry_domain_idx ON alloy_skill_registry (domain);
CREATE INDEX IF NOT EXISTS alloy_skill_registry_active_idx ON alloy_skill_registry (is_active);

CREATE TABLE IF NOT EXISTS alloy_decision_outcomes (
  id SERIAL PRIMARY KEY,
  decision_id TEXT NOT NULL UNIQUE,
  agent_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  skill_id TEXT,
  capability TEXT,
  predicted_confidence REAL NOT NULL,
  actual_outcome TEXT NOT NULL,
  was_acted_on BOOLEAN NOT NULL DEFAULT false,
  was_overridden BOOLEAN NOT NULL DEFAULT false,
  override_reason TEXT,
  predicted_impact_level TEXT NOT NULL,
  actual_impact_level TEXT,
  recommended_action TEXT NOT NULL,
  final_action TEXT,
  execution_result TEXT,
  human_review_required BOOLEAN NOT NULL DEFAULT false,
  human_review_requested BOOLEAN NOT NULL DEFAULT false,
  decision_type TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS alloy_decision_outcomes_agent_idx ON alloy_decision_outcomes (agent_id);
CREATE INDEX IF NOT EXISTS alloy_decision_outcomes_tenant_idx ON alloy_decision_outcomes (tenant_id);
CREATE INDEX IF NOT EXISTS alloy_decision_outcomes_outcome_idx ON alloy_decision_outcomes (actual_outcome);
CREATE INDEX IF NOT EXISTS alloy_decision_outcomes_recorded_idx ON alloy_decision_outcomes (recorded_at);

CREATE TABLE IF NOT EXISTS alloy_agent_performance_snapshots (
  id SERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  window_days INTEGER NOT NULL,
  total_decisions INTEGER NOT NULL DEFAULT 0,
  acceptance_rate REAL NOT NULL DEFAULT 0,
  override_rate REAL NOT NULL DEFAULT 0,
  rejection_rate REAL NOT NULL DEFAULT 0,
  weighted_accuracy_score REAL NOT NULL DEFAULT 0,
  mean_predicted_confidence REAL NOT NULL DEFAULT 0,
  mean_actual_acceptance_rate REAL NOT NULL DEFAULT 0,
  calibration_bias REAL NOT NULL DEFAULT 0,
  calibration_verdict TEXT NOT NULL DEFAULT 'insufficient_data',
  overall_health_score REAL NOT NULL DEFAULT 0,
  health_label TEXT NOT NULL DEFAULT 'good',
  flags TEXT[] NOT NULL DEFAULT '{}',
  skill_effectiveness JSONB NOT NULL DEFAULT '[]',
  trend TEXT NOT NULL DEFAULT 'stable',
  snapshot_taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS alloy_perf_snapshots_agent_idx ON alloy_agent_performance_snapshots (agent_id);
CREATE INDEX IF NOT EXISTS alloy_perf_snapshots_tenant_idx ON alloy_agent_performance_snapshots (tenant_id);
CREATE INDEX IF NOT EXISTS alloy_perf_snapshots_taken_idx ON alloy_agent_performance_snapshots (snapshot_taken_at);

CREATE TABLE IF NOT EXISTS alloy_confidence_alerts (
  id SERIAL PRIMARY KEY,
  alert_id TEXT NOT NULL UNIQUE,
  agent_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  current_value REAL NOT NULL,
  threshold REAL NOT NULL,
  trend TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  requires_human_review BOOLEAN NOT NULL DEFAULT false,
  auto_resolvable BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

CREATE INDEX IF NOT EXISTS alloy_confidence_alerts_agent_idx ON alloy_confidence_alerts (agent_id);
CREATE INDEX IF NOT EXISTS alloy_confidence_alerts_tenant_idx ON alloy_confidence_alerts (tenant_id);
CREATE INDEX IF NOT EXISTS alloy_confidence_alerts_severity_idx ON alloy_confidence_alerts (severity);
CREATE INDEX IF NOT EXISTS alloy_confidence_alerts_resolved_idx ON alloy_confidence_alerts (resolved_at);

CREATE TABLE IF NOT EXISTS alloy_agent_reflections (
  id SERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  has_data BOOLEAN NOT NULL DEFAULT false,
  context_block TEXT NOT NULL,
  confidence_adjustment REAL NOT NULL DEFAULT 0,
  reasoning_adjustments JSONB NOT NULL DEFAULT '[]',
  urgent_flags TEXT[] NOT NULL DEFAULT '{}',
  overall_health TEXT NOT NULL DEFAULT 'good',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS alloy_agent_reflections_agent_idx ON alloy_agent_reflections (agent_id);
CREATE INDEX IF NOT EXISTS alloy_agent_reflections_tenant_idx ON alloy_agent_reflections (tenant_id);

CREATE TABLE IF NOT EXISTS alloy_self_improvement_config (
  id SERIAL PRIMARY KEY,
  agent_id TEXT,
  tenant_id TEXT NOT NULL,
  short_window_days INTEGER NOT NULL DEFAULT 7,
  long_window_days INTEGER NOT NULL DEFAULT 30,
  min_sample_size INTEGER NOT NULL DEFAULT 5,
  accuracy_decline_threshold REAL NOT NULL DEFAULT 0.1,
  override_rate_threshold REAL NOT NULL DEFAULT 0.3,
  low_acceptance_threshold REAL NOT NULL DEFAULT 0.5,
  calibration_drift_threshold REAL NOT NULL DEFAULT 0.15,
  self_reflection_enabled BOOLEAN NOT NULL DEFAULT true,
  alerts_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_escalate_on_critical BOOLEAN NOT NULL DEFAULT true,
  alert_cooldown_hours INTEGER NOT NULL DEFAULT 4,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS alloy_si_config_tenant_idx ON alloy_self_improvement_config (tenant_id);

-- ─── RMM TABLES ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS msp_rmm_connectors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'both',
  status TEXT NOT NULL DEFAULT 'pending',
  auth_type TEXT NOT NULL DEFAULT 'api_key',
  config JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error TEXT,
  sync_interval_minutes INTEGER DEFAULT 5,
  device_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS msp_rmm_device_metrics (
  id SERIAL PRIMARY KEY,
  device_id INTEGER REFERENCES msp_devices(id) ON DELETE CASCADE,
  device_db_id TEXT,
  connector_id INTEGER REFERENCES msp_rmm_connectors(id) ON DELETE SET NULL,
  provider_device_id TEXT,
  cpu INTEGER DEFAULT 0,
  memory INTEGER DEFAULT 0,
  disk INTEGER DEFAULT 0,
  network_in_kbps INTEGER DEFAULT 0,
  network_out_kbps INTEGER DEFAULT 0,
  agent_version TEXT,
  patch_status TEXT,
  services JSONB DEFAULT '[]',
  processes JSONB DEFAULT '[]',
  disk_fill_rate_gb_per_hour INTEGER,
  predicted_full_at TIMESTAMPTZ,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS msp_rmm_device_metrics_device_idx ON msp_rmm_device_metrics (device_id);
CREATE INDEX IF NOT EXISTS msp_rmm_device_metrics_snapshot_idx ON msp_rmm_device_metrics (snapshot_at);

CREATE TABLE IF NOT EXISTS msp_healing_playbooks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  execution_mode TEXT NOT NULL DEFAULT 'human_gated',
  detection_rules JSONB DEFAULT '[]',
  remediation_actions JSONB DEFAULT '[]',
  target_device_types JSONB DEFAULT '[]',
  target_client_ids JSONB DEFAULT '[]',
  confidence_threshold INTEGER DEFAULT 70,
  success_rate INTEGER DEFAULT 0,
  total_executions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS msp_healing_executions (
  id SERIAL PRIMARY KEY,
  playbook_id INTEGER REFERENCES msp_healing_playbooks(id) ON DELETE SET NULL,
  device_id INTEGER REFERENCES msp_devices(id) ON DELETE SET NULL,
  client_id INTEGER REFERENCES msp_clients(id) ON DELETE SET NULL,
  triggered_by TEXT NOT NULL DEFAULT 'auto',
  status TEXT NOT NULL DEFAULT 'pending_approval',
  approval_required BOOLEAN DEFAULT TRUE,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  detection_context JSONB DEFAULT '{}',
  before_metrics JSONB,
  after_metrics JSONB,
  actions_executed JSONB DEFAULT '[]',
  healing_confidence_score INTEGER DEFAULT 0,
  ticket_id INTEGER REFERENCES msp_tickets(id) ON DELETE SET NULL,
  psa_ticket_ref TEXT,
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS msp_healing_exec_playbook_idx ON msp_healing_executions (playbook_id);
CREATE INDEX IF NOT EXISTS msp_healing_exec_device_idx ON msp_healing_executions (device_id);

CREATE TABLE IF NOT EXISTS msp_remote_actions (
  id SERIAL PRIMARY KEY,
  device_id INTEGER REFERENCES msp_devices(id) ON DELETE SET NULL,
  connector_id INTEGER REFERENCES msp_rmm_connectors(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  target TEXT,
  parameters JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending_approval',
  requires_approval BOOLEAN DEFAULT TRUE,
  requested_by TEXT NOT NULL DEFAULT 'system',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  provider_job_id TEXT,
  result JSONB,
  error_message TEXT,
  executed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS msp_remote_actions_device_idx ON msp_remote_actions (device_id);

CREATE TABLE IF NOT EXISTS msp_psa_ticket_sync (
  id SERIAL PRIMARY KEY,
  internal_ticket_id INTEGER REFERENCES msp_tickets(id) ON DELETE CASCADE,
  connector_id INTEGER REFERENCES msp_rmm_connectors(id) ON DELETE SET NULL,
  psa_ticket_id TEXT,
  psa_url TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  last_sync_at TIMESTAMPTZ,
  sla_breach BOOLEAN DEFAULT FALSE,
  sla_timer_started_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE msp_devices ADD COLUMN IF NOT EXISTS connector_id INTEGER;
CREATE INDEX IF NOT EXISTS msp_devices_connector_idx ON msp_devices (connector_id);

CREATE TABLE IF NOT EXISTS msp_org_site_mappings (
  id SERIAL PRIMARY KEY,
  connector_id INTEGER NOT NULL REFERENCES msp_rmm_connectors(id) ON DELETE CASCADE,
  provider_org_id TEXT NOT NULL,
  provider_org_name TEXT,
  provider_site_id TEXT,
  provider_site_name TEXT,
  internal_client_id INTEGER REFERENCES msp_clients(id) ON DELETE SET NULL,
  sync_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS msp_org_site_connector_idx ON msp_org_site_mappings (connector_id);
CREATE INDEX IF NOT EXISTS msp_org_site_client_idx ON msp_org_site_mappings (internal_client_id);

-- ─── DISTRIBUTION OS SCHEMA DRIFT ────────────────────────────────────────────

ALTER TABLE dos_leads ADD COLUMN IF NOT EXISTS next_follow_up TIMESTAMPTZ;
ALTER TABLE dos_leads ADD COLUMN IF NOT EXISTS last_action TEXT;
