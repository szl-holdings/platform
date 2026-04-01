CREATE TABLE IF NOT EXISTS export_jobs (
  id serial PRIMARY KEY,
  export_id text NOT NULL UNIQUE,
  name text NOT NULL,
  data_source text NOT NULL,
  format text NOT NULL DEFAULT 'csv' CHECK (format IN ('csv', 'pdf')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  triggered_by_user_id integer REFERENCES users(id) ON DELETE SET NULL,
  triggered_by_email text,
  filter_params text,
  row_count integer,
  file_size_bytes bigint,
  download_token text,
  expires_at timestamp,
  error_message text,
  schedule_frequency text NOT NULL DEFAULT 'once' CHECK (schedule_frequency IN ('once', 'daily', 'weekly')),
  next_run_at timestamp,
  completed_at timestamp,
  created_at timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS export_jobs_triggered_by_user_id_idx ON export_jobs(triggered_by_user_id);
CREATE INDEX IF NOT EXISTS export_jobs_data_source_idx ON export_jobs(data_source);
CREATE INDEX IF NOT EXISTS export_jobs_status_idx ON export_jobs(status);
CREATE INDEX IF NOT EXISTS export_jobs_created_at_idx ON export_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS export_jobs_download_token_idx ON export_jobs(download_token);
