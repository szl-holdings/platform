import { pool } from "@workspace/db";
import { logger } from "./logger";

const GOVERNANCE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "platform_alloy_policies" (
    "id" serial PRIMARY KEY NOT NULL,
    "org_id" integer REFERENCES "organizations"("id") ON DELETE cascade,
    "name" text NOT NULL,
    "slug" text NOT NULL,
    "kind" text NOT NULL,
    "status" text DEFAULT 'draft' NOT NULL,
    "rules" jsonb DEFAULT '{}' NOT NULL,
    "description" text,
    "created_by" integer REFERENCES "users"("id") ON DELETE set null,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "platform_policies_org_idx" ON "platform_alloy_policies" ("org_id")`,
  `CREATE INDEX IF NOT EXISTS "platform_policies_kind_idx" ON "platform_alloy_policies" ("kind")`,
  `CREATE INDEX IF NOT EXISTS "platform_policies_status_idx" ON "platform_alloy_policies" ("status")`,
  `CREATE TABLE IF NOT EXISTS "platform_governance_incidents" (
    "id" serial PRIMARY KEY NOT NULL,
    "org_id" integer REFERENCES "organizations"("id") ON DELETE cascade,
    "policy_id" integer REFERENCES "platform_alloy_policies"("id") ON DELETE set null,
    "workflow_run_id" integer REFERENCES "platform_workflow_runs"("id") ON DELETE set null,
    "severity" text DEFAULT 'medium' NOT NULL,
    "type" text NOT NULL,
    "description" text NOT NULL,
    "resolution" text,
    "resolved_by" integer REFERENCES "users"("id") ON DELETE set null,
    "resolved_at" timestamp,
    "metadata" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "platform_incidents_org_idx" ON "platform_governance_incidents" ("org_id")`,
  `CREATE INDEX IF NOT EXISTS "platform_incidents_policy_idx" ON "platform_governance_incidents" ("policy_id")`,
  `CREATE INDEX IF NOT EXISTS "platform_incidents_severity_idx" ON "platform_governance_incidents" ("severity")`,
  `CREATE INDEX IF NOT EXISTS "platform_incidents_created_idx" ON "platform_governance_incidents" ("created_at")`,
  `CREATE TABLE IF NOT EXISTS "platform_usage_events" (
    "id" serial PRIMARY KEY NOT NULL,
    "org_id" integer REFERENCES "organizations"("id") ON DELETE cascade,
    "workflow_run_id" integer REFERENCES "platform_workflow_runs"("id") ON DELETE set null,
    "event_type" text NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "model" text,
    "agent_id" text,
    "skill_slug" text,
    "cost_cents" integer DEFAULT 0 NOT NULL,
    "billed_at" timestamp,
    "metadata" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "platform_usage_org_idx" ON "platform_usage_events" ("org_id")`,
  `CREATE INDEX IF NOT EXISTS "platform_usage_event_type_idx" ON "platform_usage_events" ("event_type")`,
  `CREATE INDEX IF NOT EXISTS "platform_usage_created_idx" ON "platform_usage_events" ("created_at")`,
  // Add workflow_run_id column to incidents table if it was created without it (idempotent)
  `DO $$ BEGIN
    ALTER TABLE "platform_governance_incidents" ADD COLUMN IF NOT EXISTS "workflow_run_id" integer REFERENCES "platform_workflow_runs"("id") ON DELETE set null;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END $$`,
  // Add workflow_run_id column to usage events table if it was created without it (idempotent)
  `DO $$ BEGIN
    ALTER TABLE "platform_usage_events" ADD COLUMN IF NOT EXISTS "workflow_run_id" integer REFERENCES "platform_workflow_runs"("id") ON DELETE set null;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END $$`,
];

export async function ensureAlloyGovernanceTables(): Promise<void> {
  let applied = 0;
  let skipped = 0;

  for (const statement of GOVERNANCE_STATEMENTS) {
    try {
      await pool.query(statement);
      applied++;
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      const benign = ["42P07", "42701", "42703", "42710", "23505"];
      if (pgErr.code && benign.includes(pgErr.code)) {
        skipped++;
      } else {
        logger.warn({ err, statement: statement.slice(0, 120) }, "Governance migration statement failed (non-fatal)");
        skipped++;
      }
    }
  }

  logger.info({ applied, skipped }, "Alloy governance migration complete");
}
