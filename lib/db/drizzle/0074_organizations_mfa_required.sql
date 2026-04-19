-- Migration: Organization-level MFA enforcement (Task 2166)
-- Adds mfa_required column to organizations so admins can require all members
-- of their org to use MFA. When true, the login flow forces users without
-- MFA enabled to set up MFA before a session is issued.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS mfa_required BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN organizations.mfa_required IS
  'When true, all members of this organization must have MFA enabled. Users without MFA are redirected to MFA setup before a session is issued. Toggled by org admins via PATCH /api/orgs/:slug/mfa-required.';
