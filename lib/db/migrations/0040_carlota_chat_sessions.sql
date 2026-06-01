-- Carlota Jo AI Advisor Chat Sessions
-- Persists every advisor chat session (anonymous or identified) for
-- lead qualification tracking and CRM pipeline visibility.
-- All statements use IF NOT EXISTS guards for idempotency.

CREATE TABLE IF NOT EXISTS carlota_chat_sessions (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  messages JSONB NOT NULL DEFAULT '[]',
  qualification_score INTEGER NOT NULL DEFAULT 0,
  signals JSONB NOT NULL DEFAULT '[]',
  qualified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS carlota_chat_sessions_session_id_idx ON carlota_chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS carlota_chat_sessions_email_idx ON carlota_chat_sessions(email);
