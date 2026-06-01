-- Migration: Add email_suppressions table for bounce/complaint/unsubscribe suppression
-- Applied via: drizzle-kit push (db:push)
--
-- Purpose: Prevent email delivery to addresses that have bounced, complained,
--          or unsubscribed. The sendEmail() function checks this table before
--          dispatching to any provider and refuses to send to suppressed addresses.

CREATE TABLE IF NOT EXISTS email_suppressions (
  id              SERIAL PRIMARY KEY,
  email           TEXT NOT NULL,
  reason          TEXT NOT NULL CHECK (reason IN ('bounce', 'complaint', 'unsubscribe', 'manual')),
  provider_event_id TEXT,
  provider        TEXT,
  detail          TEXT,
  suppressed_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT email_suppressions_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS email_suppressions_email_idx ON email_suppressions (email);
