-- Add DB-level constraint to ensure current_step only holds valid wizard step values
ALTER TABLE onboarding_wizard_state
  ADD CONSTRAINT chk_onboarding_wizard_current_step
  CHECK (current_step IN ('profile', 'team', 'notifications', 'integrations', 'complete'));
