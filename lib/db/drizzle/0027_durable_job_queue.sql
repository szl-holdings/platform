CREATE TABLE IF NOT EXISTS durable_jobs (
  id SERIAL PRIMARY KEY,
  job_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  queue TEXT NOT NULL DEFAULT 'default',
  priority INTEGER NOT NULL DEFAULT 50,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  retry_delay_ms INTEGER NOT NULL DEFAULT 1000,
  scheduled_at TIMESTAMP NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  last_heartbeat_at TIMESTAMP,
  error TEXT,
  result JSONB,
  worker_id TEXT,
  parent_job_id TEXT,
  depends_on JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS durable_jobs_status_priority_scheduled_idx ON durable_jobs (status, priority ASC, scheduled_at ASC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS durable_jobs_queue_status_idx ON durable_jobs (queue, status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS durable_jobs_type_idx ON durable_jobs (type);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS durable_jobs_parent_idx ON durable_jobs (parent_job_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS durable_jobs_created_at_idx ON durable_jobs (created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS job_runs (
  id SERIAL PRIMARY KEY,
  job_id TEXT NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  worker_id TEXT,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'running',
  error TEXT,
  duration_ms BIGINT,
  metadata JSONB NOT NULL DEFAULT '{}'
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS job_runs_job_id_idx ON job_runs (job_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS job_runs_started_at_idx ON job_runs (started_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS job_schedules (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  job_type TEXT NOT NULL,
  queue TEXT NOT NULL DEFAULT 'default',
  priority INTEGER NOT NULL DEFAULT 50,
  cron_expression TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  max_retries INTEGER NOT NULL DEFAULT 3,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  last_status TEXT,
  run_count INTEGER NOT NULL DEFAULT 0,
  fail_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS job_schedules_enabled_next_run_idx ON job_schedules (enabled, next_run_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS job_schedules_job_type_idx ON job_schedules (job_type);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS dead_letter_queue (
  id SERIAL PRIMARY KEY,
  original_job_id TEXT NOT NULL,
  type TEXT NOT NULL,
  queue TEXT NOT NULL DEFAULT 'default',
  payload JSONB NOT NULL DEFAULT '{}',
  error TEXT NOT NULL,
  failed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  first_failed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by TEXT,
  resolution TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS dlq_type_idx ON dead_letter_queue (type);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS dlq_failed_at_idx ON dead_letter_queue (failed_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS dlq_resolved_idx ON dead_letter_queue (resolved_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS agent_execution_contexts (
  id SERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL UNIQUE,
  state JSONB NOT NULL DEFAULT '{}',
  last_run_at TIMESTAMP,
  last_run_id TEXT,
  run_count INTEGER NOT NULL DEFAULT 0,
  total_duration_ms BIGINT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS agent_exec_agent_id_idx ON agent_execution_contexts (agent_id);
