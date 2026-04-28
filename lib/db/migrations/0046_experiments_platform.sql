-- Experimentation platform: experiments, variants, assignments, events, snapshots

CREATE TABLE IF NOT EXISTS experiments (
  id                    SERIAL PRIMARY KEY,
  key                   TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  description           TEXT,
  hypothesis            TEXT,
  type                  TEXT NOT NULL DEFAULT 'product',
  status                TEXT NOT NULL DEFAULT 'draft',
  primary_metric        TEXT NOT NULL DEFAULT 'conversion_rate',
  guard_rail_metrics    JSONB,
  traffic_allocation    INTEGER NOT NULL DEFAULT 100,
  is_bandit             BOOLEAN NOT NULL DEFAULT FALSE,
  min_sample_size       INTEGER NOT NULL DEFAULT 100,
  significance_threshold NUMERIC(5,4) NOT NULL DEFAULT 0.05,
  created_by            INTEGER,
  started_at            TIMESTAMP,
  concluded_at          TIMESTAMP,
  winner_id             INTEGER,
  stop_reason           TEXT,
  metadata              JSONB,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS experiments_status_idx     ON experiments (status);
CREATE INDEX IF NOT EXISTS experiments_type_idx       ON experiments (type);
CREATE INDEX IF NOT EXISTS experiments_created_at_idx ON experiments (created_at DESC);

CREATE TABLE IF NOT EXISTS experiment_variants (
  id              SERIAL PRIMARY KEY,
  experiment_id   INTEGER NOT NULL REFERENCES experiments (id) ON DELETE CASCADE,
  key             TEXT NOT NULL,
  name            TEXT NOT NULL,
  is_control      BOOLEAN NOT NULL DEFAULT FALSE,
  traffic_weight  INTEGER NOT NULL DEFAULT 50,
  config          JSONB,
  ml_model_version_id TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS experiment_variants_experiment_id_idx ON experiment_variants (experiment_id);
CREATE UNIQUE INDEX IF NOT EXISTS experiment_variants_experiment_key_idx ON experiment_variants (experiment_id, key);

CREATE TABLE IF NOT EXISTS experiment_assignments (
  id              SERIAL PRIMARY KEY,
  experiment_id   INTEGER NOT NULL REFERENCES experiments (id) ON DELETE CASCADE,
  variant_id      INTEGER NOT NULL REFERENCES experiment_variants (id) ON DELETE CASCADE,
  entity_type     TEXT NOT NULL DEFAULT 'user',
  entity_id       TEXT NOT NULL,
  assigned_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS experiment_assignments_experiment_entity_idx ON experiment_assignments (experiment_id, entity_id);
CREATE UNIQUE INDEX IF NOT EXISTS experiment_assignments_unique_entity_idx ON experiment_assignments (experiment_id, entity_id);

CREATE TABLE IF NOT EXISTS experiment_events (
  id              SERIAL PRIMARY KEY,
  experiment_id   INTEGER NOT NULL REFERENCES experiments (id) ON DELETE CASCADE,
  variant_id      INTEGER NOT NULL REFERENCES experiment_variants (id) ON DELETE CASCADE,
  entity_id       TEXT NOT NULL,
  event_type      TEXT NOT NULL DEFAULT 'exposure',
  metric_key      TEXT,
  metric_value    NUMERIC(18,6),
  properties      JSONB,
  occurred_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS experiment_events_experiment_id_idx ON experiment_events (experiment_id);
CREATE INDEX IF NOT EXISTS experiment_events_variant_id_idx    ON experiment_events (variant_id);
CREATE INDEX IF NOT EXISTS experiment_events_entity_id_idx     ON experiment_events (entity_id);
CREATE INDEX IF NOT EXISTS experiment_events_event_type_idx    ON experiment_events (event_type);
CREATE INDEX IF NOT EXISTS experiment_events_occurred_at_idx   ON experiment_events (occurred_at DESC);

CREATE TABLE IF NOT EXISTS experiment_snapshots (
  id              SERIAL PRIMARY KEY,
  experiment_id   INTEGER NOT NULL REFERENCES experiments (id) ON DELETE CASCADE,
  snapshot_data   JSONB NOT NULL,
  triggered_by    TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS experiment_snapshots_experiment_id_idx ON experiment_snapshots (experiment_id);
CREATE INDEX IF NOT EXISTS experiment_snapshots_created_at_idx    ON experiment_snapshots (created_at DESC);
