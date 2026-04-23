CREATE TABLE IF NOT EXISTS contact_submission_replies (
  id SERIAL PRIMARY KEY,
  contact_submission_id INTEGER NOT NULL REFERENCES contact_submissions(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_by TEXT NOT NULL DEFAULT 'Admin',
  email_success BOOLEAN NOT NULL DEFAULT TRUE,
  message_id TEXT,
  sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_submission_replies_submission_id
  ON contact_submission_replies(contact_submission_id);

CREATE TABLE IF NOT EXISTS alert_evaluation_runs (
  id SERIAL PRIMARY KEY,
  evaluated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  rules_checked INTEGER NOT NULL DEFAULT 0,
  rules_fired INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  errors TEXT,
  metrics JSONB,
  triggered_by TEXT NOT NULL DEFAULT 'scheduled'
);

CREATE INDEX IF NOT EXISTS idx_alert_evaluation_runs_evaluated_at
  ON alert_evaluation_runs(evaluated_at DESC);
