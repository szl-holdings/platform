-- Migration: SZL SaaS Self-Service Layer Tables
-- Adds onboarding_wizard_state and org_notification_settings tables

CREATE TABLE IF NOT EXISTS onboarding_wizard_state (
  org_id INTEGER PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  current_step TEXT NOT NULL DEFAULT 'profile',
  completed_steps JSONB NOT NULL DEFAULT '[]',
  step_data JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_notification_settings (
  org_id INTEGER PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  slack_enabled BOOLEAN NOT NULL DEFAULT false,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_wizard_state_org ON onboarding_wizard_state (org_id);
CREATE INDEX IF NOT EXISTS idx_org_notification_settings_org ON org_notification_settings (org_id);
