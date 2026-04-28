CREATE TABLE IF NOT EXISTS scheduled_job_runs (
  id SERIAL PRIMARY KEY,
  job_type TEXT NOT NULL,
  started_at TIMESTAMP NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
  duration_ms INTEGER,
  result JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scheduled_job_runs_job_type_started_at_idx
  ON scheduled_job_runs (job_type, started_at);
