-- Migration 0018: Simulation persistence tables
-- Covers: Firestorm security scenarios, Vessels fleet simulations,
--         Terra market models, Lyte incident simulations
-- Uses a domain discriminator column to serve all simulation types

CREATE TABLE IF NOT EXISTS simulation_sessions (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  parameters JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sim_sessions_domain_idx ON simulation_sessions (domain);
CREATE INDEX IF NOT EXISTS sim_sessions_status_idx ON simulation_sessions (status);
CREATE INDEX IF NOT EXISTS sim_sessions_created_idx ON simulation_sessions (created_at DESC);

CREATE TABLE IF NOT EXISTS simulation_snapshots (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES simulation_sessions(session_id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  sequence_number INTEGER NOT NULL DEFAULT 0,
  state JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  snapshotted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sim_snapshots_session_idx ON simulation_snapshots (session_id);
CREATE INDEX IF NOT EXISTS sim_snapshots_domain_idx ON simulation_snapshots (domain);

CREATE TABLE IF NOT EXISTS simulation_results (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES simulation_sessions(session_id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  result_type TEXT NOT NULL DEFAULT 'final',
  metrics JSONB NOT NULL DEFAULT '{}',
  summary TEXT,
  risk_score NUMERIC(5, 2),
  confidence REAL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sim_results_session_idx ON simulation_results (session_id);
CREATE INDEX IF NOT EXISTS sim_results_domain_idx ON simulation_results (domain);
CREATE INDEX IF NOT EXISTS sim_results_computed_idx ON simulation_results (computed_at DESC);

CREATE TABLE IF NOT EXISTS simulation_replay_state (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES simulation_sessions(session_id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  replay_cursor INTEGER NOT NULL DEFAULT 0,
  total_frames INTEGER NOT NULL DEFAULT 0,
  playback_speed REAL NOT NULL DEFAULT 1.0,
  is_paused BOOLEAN NOT NULL DEFAULT false,
  loop_enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS sim_replay_session_uniq ON simulation_replay_state (session_id);
CREATE INDEX IF NOT EXISTS sim_replay_domain_idx ON simulation_replay_state (domain);
