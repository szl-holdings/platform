-- Migration: Firestorm Hardening & Vulnerability Platform Extensions
-- Adds firestorm_hardening_controls table and extends firestorm_findings

-- Add remediation tracking columns to firestorm_findings
ALTER TABLE firestorm_findings
  ADD COLUMN IF NOT EXISTS remediation_owner TEXT,
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS audit_trail JSONB DEFAULT '[]';

-- Create firestorm_hardening_controls table
CREATE TABLE IF NOT EXISTS firestorm_hardening_controls (
  id SERIAL PRIMARY KEY,
  control_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('mfa_credential', 'application_hardening', 'config_hardening', 'dependency_supply_chain', 'vulnerability_assessment')),
  status TEXT NOT NULL DEFAULT 'not_implemented' CHECK (status IN ('implemented', 'partial', 'not_implemented')),
  priority TEXT NOT NULL DEFAULT 'high' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  owner TEXT,
  linked_assets JSONB DEFAULT '[]',
  recommended_action TEXT,
  due_date TIMESTAMP,
  audit_trail JSONB DEFAULT '[]',
  last_reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for category lookups
CREATE INDEX IF NOT EXISTS idx_hardening_controls_category ON firestorm_hardening_controls (category);
CREATE INDEX IF NOT EXISTS idx_hardening_controls_status ON firestorm_hardening_controls (status);
CREATE INDEX IF NOT EXISTS idx_hardening_controls_priority ON firestorm_hardening_controls (priority);

-- Extend firestorm_compliance_controls with owner, due_date, audit_trail for gap tracking
ALTER TABLE firestorm_compliance_controls
  ADD COLUMN IF NOT EXISTS owner TEXT,
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS audit_trail JSONB DEFAULT '[]';
