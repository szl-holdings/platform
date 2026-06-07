-- Migration 0072: Register previously-orphaned SZL SaaS self-service layer tables
--
-- The file lib/db/drizzle/0010_szl_saas_layer_tables.sql was never registered
-- in the Drizzle journal (_journal.json). It may or may not have been applied
-- manually. All statements use IF NOT EXISTS so re-application is idempotent.
--
-- Tables: onboarding_wizard_state, org_notification_settings

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS onboarding_wizard_state (
  org_id INTEGER PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  current_step TEXT NOT NULL DEFAULT 'profile',
  completed_steps JSONB NOT NULL DEFAULT '[]',
  step_data JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS org_notification_settings (
  org_id INTEGER PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  slack_enabled BOOLEAN NOT NULL DEFAULT false,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_onboarding_wizard_state_org ON onboarding_wizard_state (org_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_org_notification_settings_org ON org_notification_settings (org_id);
