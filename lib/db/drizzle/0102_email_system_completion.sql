-- 0102: Email system completion
-- Adds notification_audit_log, digest_emails_sent, support_notification_settings,
-- cooldown columns on platform_alert_rules, email_opt_out on contact_submissions,
-- and notification_sent_at on lead_status.

-- ── Notification audit log ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_audit_log (
  id            BIGSERIAL PRIMARY KEY,
  template      TEXT NOT NULL,
  recipient     TEXT NOT NULL,
  subject       TEXT,
  entity_type   TEXT,
  entity_id     TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'sent',
  message_id    TEXT,
  provider      TEXT,
  error         TEXT,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notification_audit_log_recipient_idx ON notification_audit_log (recipient);
CREATE INDEX IF NOT EXISTS notification_audit_log_sent_at_idx   ON notification_audit_log (sent_at DESC);
CREATE INDEX IF NOT EXISTS notification_audit_log_template_idx  ON notification_audit_log (template);

-- ── Digest emails sent dedup table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS digest_emails_sent (
  id          BIGSERIAL PRIMARY KEY,
  digest_type TEXT NOT NULL,
  recipient   TEXT NOT NULL,
  digest_key  TEXT NOT NULL,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS digest_emails_sent_unique_idx ON digest_emails_sent (digest_type, recipient, digest_key);
CREATE INDEX IF NOT EXISTS digest_emails_sent_sent_at_idx ON digest_emails_sent (sent_at DESC);

-- ── Support notification settings ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_notification_settings (
  id                  SERIAL PRIMARY KEY,
  notification_email  TEXT NOT NULL,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by          TEXT
);
INSERT INTO support_notification_settings (notification_email)
  SELECT 'team@szlholdings.com'
  WHERE NOT EXISTS (SELECT 1 FROM support_notification_settings);

-- ── Alert rule cooldown & last-sent timestamp ─────────────────────────────────
ALTER TABLE platform_alert_rules
  ADD COLUMN IF NOT EXISTS cooldown_minutes INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ;

-- ── Contact submission email opt-out ─────────────────────────────────────────
ALTER TABLE contact_submissions
  ADD COLUMN IF NOT EXISTS email_opt_out BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_opt_out_at TIMESTAMPTZ;

-- ── Lead status notification tracking ────────────────────────────────────────
ALTER TABLE lead_status
  ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ;
