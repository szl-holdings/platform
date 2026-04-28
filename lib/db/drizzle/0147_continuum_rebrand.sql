-- Migration: 0147_continuum_rebrand
-- Renames all Alloy-prefixed tables and enums to Continuum equivalents.
-- This migration is additive — historical migrations (0004_alloy_canonical_schema.sql,
-- 0016_alloy_governance_policies.sql, etc.) are NOT modified.
-- Date: 2026-04-28
-- Task: #3196 — Rebrand Alloy to Continuum (Business Observability Fabric)

--> statement-breakpoint

-- Core Alloy → Continuum table renames
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alloy_owners') THEN
    ALTER TABLE alloy_owners RENAME TO continuum_owners;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alloy_signals') THEN
    ALTER TABLE alloy_signals RENAME TO continuum_signals;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alloy_workflows') THEN
    ALTER TABLE alloy_workflows RENAME TO continuum_workflows;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alloy_workflow_steps') THEN
    ALTER TABLE alloy_workflow_steps RENAME TO continuum_workflow_steps;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alloy_workflow_runs') THEN
    ALTER TABLE alloy_workflow_runs RENAME TO continuum_workflow_runs;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alloy_actions') THEN
    ALTER TABLE alloy_actions RENAME TO continuum_actions;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alloy_artifacts') THEN
    ALTER TABLE alloy_artifacts RENAME TO continuum_artifacts;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alloy_audit_log') THEN
    ALTER TABLE alloy_audit_log RENAME TO continuum_audit_log;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alloy_approvals') THEN
    ALTER TABLE alloy_approvals RENAME TO continuum_approvals;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alloy_policies') THEN
    ALTER TABLE alloy_policies RENAME TO continuum_policies;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alloy_governance_policies') THEN
    ALTER TABLE alloy_governance_policies RENAME TO continuum_governance_policies;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alloy_chat_conversations') THEN
    ALTER TABLE alloy_chat_conversations RENAME TO continuum_chat_conversations;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alloy_chat_messages') THEN
    ALTER TABLE alloy_chat_messages RENAME TO continuum_chat_messages;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alloy_runtime_agents') THEN
    ALTER TABLE alloy_runtime_agents RENAME TO continuum_runtime_agents;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alloy_runtime_agent_versions') THEN
    ALTER TABLE alloy_runtime_agent_versions RENAME TO continuum_runtime_agent_versions;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alloy_ai_decisions') THEN
    ALTER TABLE alloy_ai_decisions RENAME TO continuum_ai_decisions;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alloy_autonomy_modes') THEN
    ALTER TABLE alloy_autonomy_modes RENAME TO continuum_autonomy_modes;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alloy_policy_versions') THEN
    ALTER TABLE alloy_policy_versions RENAME TO continuum_policy_versions;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alloy_run_notifications') THEN
    ALTER TABLE alloy_run_notifications RENAME TO continuum_run_notifications;
  END IF;
END $$;
--> statement-breakpoint

-- Rename any alloy_* enum types to continuum_* equivalents
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alloy_workflow_status') THEN
    ALTER TYPE alloy_workflow_status RENAME TO continuum_workflow_status;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alloy_priority') THEN
    ALTER TYPE alloy_priority RENAME TO continuum_priority;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alloy_severity') THEN
    ALTER TYPE alloy_severity RENAME TO continuum_severity;
  END IF;
END $$;
