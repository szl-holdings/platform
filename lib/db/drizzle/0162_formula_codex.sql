-- Migration: Formula Codex — A11oy /formulas Codex surface
-- Adds canonical formula registry, version history, invocation log,
-- and ROSIE tuning-proposal queue.
-- Source: lib/formulas/, docs/audits/formulas.md, docs/thesis/v10-canonical.md.

CREATE TABLE IF NOT EXISTS formulas (
  id SERIAL PRIMARY KEY,
  formula_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN (
    'governance','risk','scoring','optimization','embedding',
    'routing','evolution','invariant','physics','arbitrage'
  )),
  current_version TEXT NOT NULL,
  description TEXT,
  provenance JSONB,
  parameters JSONB DEFAULT '{}'::jsonb,
  consumers JSONB DEFAULT '[]'::jsonb,
  input_shape TEXT,
  output_shape TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS formulas_domain_idx ON formulas(domain);

CREATE TABLE IF NOT EXISTS formula_versions (
  id SERIAL PRIMARY KEY,
  formula_id TEXT NOT NULL,
  version TEXT NOT NULL,
  parameters JSONB NOT NULL,
  note TEXT,
  promoted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS formula_versions_formula_idx
  ON formula_versions(formula_id, created_at);

CREATE TABLE IF NOT EXISTS formula_invocations (
  id SERIAL PRIMARY KEY,
  formula_id TEXT NOT NULL,
  version TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  output_hash TEXT NOT NULL,
  caller TEXT,
  duration_ms NUMERIC(12,3),
  metadata JSONB,
  invoked_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS formula_invocations_formula_idx
  ON formula_invocations(formula_id, invoked_at);
CREATE INDEX IF NOT EXISTS formula_invocations_caller_idx
  ON formula_invocations(caller);

CREATE TABLE IF NOT EXISTS formula_tuning_proposals (
  id SERIAL PRIMARY KEY,
  formula_id TEXT NOT NULL,
  from_version TEXT NOT NULL,
  parameter TEXT NOT NULL,
  old_value NUMERIC(20,10) NOT NULL,
  new_value NUMERIC(20,10) NOT NULL,
  proposal_score NUMERIC(12,6) NOT NULL,
  rationale TEXT NOT NULL,
  evidence JSONB NOT NULL,
  proposed_by TEXT NOT NULL DEFAULT 'rosie',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','superseded')),
  decided_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  decided_at TIMESTAMP,
  decision_note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS formula_tuning_status_idx
  ON formula_tuning_proposals(status);
CREATE INDEX IF NOT EXISTS formula_tuning_formula_idx
  ON formula_tuning_proposals(formula_id, created_at);
