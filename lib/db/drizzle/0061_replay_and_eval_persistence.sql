CREATE TABLE IF NOT EXISTS replay_scenarios (
  id SERIAL PRIMARY KEY,
  scenario_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  snapshot_count INTEGER NOT NULL DEFAULT 0,
  last_replayed TIMESTAMPTZ,
  last_outcome TEXT,
  ground_truth_match_rate REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS replay_scenarios_domain_idx ON replay_scenarios (domain);
CREATE INDEX IF NOT EXISTS replay_scenarios_updated_at_idx ON replay_scenarios (updated_at);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS replay_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_id TEXT NOT NULL UNIQUE,
  scenario_id TEXT NOT NULL,
  label TEXT NOT NULL,
  domain TEXT NOT NULL,
  snapshot_type TEXT NOT NULL,
  historical_context JSONB NOT NULL DEFAULT '{}',
  agent_inputs JSONB NOT NULL DEFAULT '[]',
  ground_truth JSONB,
  sanitized BOOLEAN NOT NULL DEFAULT TRUE,
  version TEXT NOT NULL DEFAULT '1.0',
  tags TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS replay_snapshots_scenario_id_idx ON replay_snapshots (scenario_id);
CREATE INDEX IF NOT EXISTS replay_snapshots_domain_idx ON replay_snapshots (domain);
CREATE INDEX IF NOT EXISTS replay_snapshots_type_idx ON replay_snapshots (snapshot_type);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS replay_runs (
  id SERIAL PRIMARY KEY,
  run_id TEXT NOT NULL UNIQUE,
  scenario_id TEXT NOT NULL,
  scenario_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  total_snapshots INTEGER NOT NULL DEFAULT 0,
  successful INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  avg_latency_ms REAL NOT NULL DEFAULT 0,
  ground_truth_match_rate REAL NOT NULL DEFAULT 0,
  total_cost_usd REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS replay_runs_scenario_id_idx ON replay_runs (scenario_id);
CREATE INDEX IF NOT EXISTS replay_runs_started_at_idx ON replay_runs (started_at);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS eval_baselines (
  id SERIAL PRIMARY KEY,
  suite_id TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'default',
  pass_rate REAL NOT NULL DEFAULT 0,
  avg_score REAL NOT NULL DEFAULT 0,
  avg_latency_ms REAL NOT NULL DEFAULT 0,
  total_cost_usd REAL NOT NULL DEFAULT 0,
  version TEXT NOT NULL DEFAULT '1.0',
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS eval_baselines_suite_model_idx ON eval_baselines (suite_id, model);
CREATE INDEX IF NOT EXISTS eval_baselines_recorded_at_idx ON eval_baselines (recorded_at);
