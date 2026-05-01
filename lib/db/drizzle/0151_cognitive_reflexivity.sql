-- Cognitive Reflexivity Engine (#4570–#4572) — durable storage for reflexive
-- strategies and per-decision traces. Idempotent, safe to re-run.
--
-- Why this exists:
--   The engine generates reflexive strategies (router constraints, retrieval
--   biases, detection-confidence-floor adjustments) from cognitive signals.
--   Until now those strategies lived only in process memory — a restart of
--   api-server lost every operator-approved strategy, every dialectical
--   trace, every health-score datapoint. That broke the "self-observing,
--   self-improving cognition" promise the moment a deploy happened.
--
-- What this stores:
--   1. cognitive_reflexive_strategies — strategy registry rows (proposed /
--      approved / active / rejected / retired) keyed by strategy_id, with
--      the dialectical provenance and tier/confidence kept as JSONB so the
--      schema does not have to mirror every engine-side field change.
--   2. cognitive_reflexive_decision_traces — per-router-decision audit log:
--      which strategies were applied, which dimensions they moved, what
--      lane/model/confidence-floor was finally chosen.
--
-- Both tables are append-mostly with light updates on strategy state
-- transitions; small indexes are sufficient for the working-set size.

CREATE TABLE IF NOT EXISTS cognitive_reflexive_strategies (
  strategy_id TEXT PRIMARY KEY,
  class TEXT NOT NULL,
  status TEXT NOT NULL,
  tier TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  applicable_contexts JSONB NOT NULL DEFAULT '[]'::jsonb,
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  approval JSONB,
  rejection_reason TEXT,
  reinforcement JSONB NOT NULL DEFAULT '{"hits":0,"misses":0}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Full strategy payload kept verbatim so the engine can rehydrate without
  -- column-level coupling. The structured columns above are denormalized
  -- copies for indexed queries (status, class, tier, agent filter).
  payload JSONB NOT NULL
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS cognitive_reflexive_strategies_status_idx
  ON cognitive_reflexive_strategies (status);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS cognitive_reflexive_strategies_class_idx
  ON cognitive_reflexive_strategies (class);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS cognitive_reflexive_strategies_tier_idx
  ON cognitive_reflexive_strategies (tier);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS cognitive_reflexive_strategies_created_at_idx
  ON cognitive_reflexive_strategies (created_at DESC);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS cognitive_reflexive_decision_traces (
  decision_id TEXT PRIMARY KEY,
  agent_id TEXT,
  applied_strategy_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  influenced_dimensions JSONB NOT NULL DEFAULT '[]'::jsonb,
  resolved JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS cognitive_reflexive_decision_traces_agent_idx
  ON cognitive_reflexive_decision_traces (agent_id);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS cognitive_reflexive_decision_traces_occurred_at_idx
  ON cognitive_reflexive_decision_traces (occurred_at DESC);
