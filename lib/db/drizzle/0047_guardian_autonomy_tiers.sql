-- Guardian Autonomy Governor: 6-tier system migration
-- Adds guardian_actions, rollback_events, guardian_approval_requests tables
-- Updates guardian_policies and tool_mesh_tools to use 6-tier enum

-- Add new columns to guardian_policies for allowlists
ALTER TABLE guardian_policies
  ADD COLUMN IF NOT EXISTS allowed_models jsonb,
  ADD COLUMN IF NOT EXISTS allowed_tools jsonb;

-- Update the tier column to accept new 6-tier values (text type allows any value)
-- Existing rows with old tier names will remain but be treated as legacy

-- Create guardian_actions table
CREATE TABLE IF NOT EXISTS guardian_actions (
  id serial PRIMARY KEY,
  request_id text NOT NULL UNIQUE,
  agent_id text,
  session_id text,
  workflow_id text,
  org_id integer REFERENCES organizations(id) ON DELETE CASCADE,
  tier text NOT NULL,
  action text NOT NULL,
  tool_id text,
  model text,
  environment text,
  outcome text NOT NULL,
  matched_rule_id text,
  reason text NOT NULL,
  rollback_required boolean NOT NULL DEFAULT false,
  rollback_token text,
  redact_applied boolean NOT NULL DEFAULT false,
  control_violations jsonb NOT NULL DEFAULT '[]',
  payload jsonb NOT NULL DEFAULT '{}',
  decided_at timestamp NOT NULL DEFAULT now(),
  executed_at timestamp,
  rolled_back_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS guardian_actions_agent_idx ON guardian_actions(agent_id);
CREATE INDEX IF NOT EXISTS guardian_actions_session_idx ON guardian_actions(session_id);
CREATE INDEX IF NOT EXISTS guardian_actions_tier_idx ON guardian_actions(tier);
CREATE INDEX IF NOT EXISTS guardian_actions_outcome_idx ON guardian_actions(outcome);
CREATE INDEX IF NOT EXISTS guardian_actions_org_idx ON guardian_actions(org_id);
CREATE INDEX IF NOT EXISTS guardian_actions_created_idx ON guardian_actions(created_at);

-- Create rollback_events table
CREATE TABLE IF NOT EXISTS rollback_events (
  id serial PRIMARY KEY,
  action_id text NOT NULL,
  request_id text NOT NULL,
  agent_id text,
  org_id integer REFERENCES organizations(id) ON DELETE CASCADE,
  tier text NOT NULL,
  triggered_by text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  metadata jsonb NOT NULL DEFAULT '{}',
  completed_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rollback_events_action_idx ON rollback_events(action_id);
CREATE INDEX IF NOT EXISTS rollback_events_request_idx ON rollback_events(request_id);
CREATE INDEX IF NOT EXISTS rollback_events_org_idx ON rollback_events(org_id);
CREATE INDEX IF NOT EXISTS rollback_events_status_idx ON rollback_events(status);
CREATE INDEX IF NOT EXISTS rollback_events_created_idx ON rollback_events(created_at);

-- Create guardian_approval_requests table
CREATE TABLE IF NOT EXISTS guardian_approval_requests (
  id serial PRIMARY KEY,
  request_id text NOT NULL UNIQUE,
  agent_id text,
  session_id text,
  workflow_id text,
  org_id integer REFERENCES organizations(id) ON DELETE CASCADE,
  tier text NOT NULL,
  action text NOT NULL,
  tool_id text,
  approval_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  required_approvers jsonb NOT NULL DEFAULT '[]',
  approvals jsonb NOT NULL DEFAULT '[]',
  payload jsonb NOT NULL DEFAULT '{}',
  expires_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS guardian_approval_requests_agent_idx ON guardian_approval_requests(agent_id);
CREATE INDEX IF NOT EXISTS guardian_approval_requests_tier_idx ON guardian_approval_requests(tier);
CREATE INDEX IF NOT EXISTS guardian_approval_requests_status_idx ON guardian_approval_requests(status);
CREATE INDEX IF NOT EXISTS guardian_approval_requests_org_idx ON guardian_approval_requests(org_id);
CREATE INDEX IF NOT EXISTS guardian_approval_requests_created_idx ON guardian_approval_requests(created_at);
