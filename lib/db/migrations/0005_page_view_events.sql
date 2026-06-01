-- Migration: page_view_events
-- Adds a dedicated table for anonymous pre-login page-view tracking so the
-- investor funnel Visitor stage counts real anonymous sessions rather than
-- proxying from audit_events (authenticated sessions only).

CREATE TABLE IF NOT EXISTS page_view_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  country TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pve_session_idx ON page_view_events (session_id);
CREATE INDEX IF NOT EXISTS pve_occurred_idx ON page_view_events (occurred_at);
CREATE INDEX IF NOT EXISTS pve_path_idx ON page_view_events (path);
