-- Open Evaluation Layer — database schema
-- Tables: eval_benchmarks, eval_results, eval_verification_tokens, eval_community_submissions

CREATE TABLE IF NOT EXISTS eval_benchmarks (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_id         VARCHAR(256) NOT NULL,
  name                 TEXT NOT NULL,
  description          TEXT,
  domain               VARCHAR(128) NOT NULL,
  evaluation_framework VARCHAR(64) NOT NULL,
  tasks                JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags                 TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  paper_url            TEXT,
  is_cross_cutting     BOOLEAN NOT NULL DEFAULT FALSE,
  source               VARCHAR(32) NOT NULL DEFAULT 'tenant',
  org_id               INTEGER,
  archived_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS eval_benchmarks_benchmark_id_org_idx
  ON eval_benchmarks (benchmark_id, org_id);
CREATE INDEX IF NOT EXISTS eval_benchmarks_domain_idx          ON eval_benchmarks (domain);
CREATE INDEX IF NOT EXISTS eval_benchmarks_cross_cutting_idx   ON eval_benchmarks (is_cross_cutting);
CREATE INDEX IF NOT EXISTS eval_benchmarks_source_idx          ON eval_benchmarks (source);

CREATE TABLE IF NOT EXISTS eval_results (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_id            VARCHAR(256) NOT NULL,
  benchmark_name          TEXT,
  task_id                 VARCHAR(256) NOT NULL,
  entity_id               VARCHAR(256) NOT NULL,
  entity_label            TEXT NOT NULL,
  entity_type             VARCHAR(64) NOT NULL,
  domain                  VARCHAR(128) NOT NULL,
  metric                  VARCHAR(128) NOT NULL,
  value                   TEXT NOT NULL,
  unit                    VARCHAR(32),
  higher_is_better        BOOLEAN NOT NULL DEFAULT TRUE,
  numeric_value           NUMERIC(20, 8),
  evaluation_framework    VARCHAR(64),
  badge_state             VARCHAR(32) NOT NULL DEFAULT 'community',
  verify_token            VARCHAR(512),
  eval_date               VARCHAR(32),
  source_url              TEXT,
  notes                   TEXT,
  tags                    TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  raw_yaml                JSONB,
  submitted_by            VARCHAR(256),
  org_id                  INTEGER,
  submission_id           UUID,
  verification_token_id   UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS eval_results_benchmark_task_idx    ON eval_results (benchmark_id, task_id);
CREATE INDEX IF NOT EXISTS eval_results_entity_idx            ON eval_results (entity_id, entity_type);
CREATE INDEX IF NOT EXISTS eval_results_domain_idx            ON eval_results (domain);
CREATE INDEX IF NOT EXISTS eval_results_badge_state_idx       ON eval_results (badge_state);
CREATE INDEX IF NOT EXISTS eval_results_numeric_value_idx     ON eval_results (numeric_value);
CREATE INDEX IF NOT EXISTS eval_results_org_idx               ON eval_results (org_id);
CREATE INDEX IF NOT EXISTS eval_results_submitted_by_idx      ON eval_results (submitted_by);
CREATE INDEX IF NOT EXISTS eval_results_eval_date_idx         ON eval_results (eval_date);

CREATE TABLE IF NOT EXISTS eval_verification_tokens (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id            UUID NOT NULL,
  status               VARCHAR(32) NOT NULL DEFAULT 'pending',
  verify_token         VARCHAR(512) NOT NULL,
  proof                TEXT,
  rerun_numeric_value  NUMERIC(20, 8),
  delta                NUMERIC(20, 8),
  verified_by          VARCHAR(32),
  notes                TEXT,
  rerun_report         JSONB,
  expires_at           TIMESTAMPTZ,
  verified_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS eval_verification_tokens_result_id_idx ON eval_verification_tokens (result_id);
CREATE INDEX IF NOT EXISTS eval_verification_tokens_status_idx    ON eval_verification_tokens (status);

CREATE TABLE IF NOT EXISTS eval_community_submissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  status            VARCHAR(32) NOT NULL DEFAULT 'open',
  yaml_payload      JSONB NOT NULL,
  pr_description    TEXT,
  github_pr_number  INTEGER,
  github_pr_url     TEXT,
  branch_name       VARCHAR(256),
  submitted_by      VARCHAR(256) NOT NULL,
  org_id            INTEGER,
  reviewed_by       VARCHAR(256),
  reviewed_at       TIMESTAMPTZ,
  review_notes      TEXT,
  result_count      INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS eval_community_submissions_status_idx       ON eval_community_submissions (status);
CREATE INDEX IF NOT EXISTS eval_community_submissions_org_idx          ON eval_community_submissions (org_id);
CREATE INDEX IF NOT EXISTS eval_community_submissions_submitted_by_idx ON eval_community_submissions (submitted_by);
