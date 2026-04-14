import { pool } from "@szl-holdings/db";
import { logger } from "./logger";

const SKILLS_MIGRATION_SQL = [
  `CREATE TABLE IF NOT EXISTS "alloy_skill_registry" (
    "id" serial PRIMARY KEY NOT NULL,
    "skill_id" text NOT NULL UNIQUE,
    "name" text NOT NULL,
    "version" text NOT NULL DEFAULT '1.0.0',
    "capability" text NOT NULL,
    "domain" text NOT NULL,
    "description" text NOT NULL,
    "trigger_conditions" jsonb NOT NULL DEFAULT '[]',
    "required_inputs" jsonb NOT NULL DEFAULT '[]',
    "optional_inputs" jsonb NOT NULL DEFAULT '[]',
    "output_schema" jsonb NOT NULL DEFAULT '[]',
    "output_decision_type" text NOT NULL,
    "chain_metadata" jsonb NOT NULL DEFAULT '{}',
    "analytic_mode" text NOT NULL,
    "policy_class" text NOT NULL,
    "estimated_latency_ms" integer NOT NULL DEFAULT 10000,
    "tags" text[] NOT NULL DEFAULT '{}',
    "is_builtin" boolean NOT NULL DEFAULT false,
    "is_active" boolean NOT NULL DEFAULT true,
    "registered_by" text,
    "org_id" integer,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS "alloy_skill_registry_capability_idx" ON "alloy_skill_registry" ("capability")`,
  `CREATE INDEX IF NOT EXISTS "alloy_skill_registry_domain_idx" ON "alloy_skill_registry" ("domain")`,
  `CREATE INDEX IF NOT EXISTS "alloy_skill_registry_active_idx" ON "alloy_skill_registry" ("is_active")`,

  `CREATE TABLE IF NOT EXISTS "alloy_decision_outcomes" (
    "id" serial PRIMARY KEY NOT NULL,
    "decision_id" text NOT NULL UNIQUE,
    "agent_id" text NOT NULL,
    "tenant_id" text NOT NULL,
    "skill_id" text,
    "capability" text,
    "predicted_confidence" real NOT NULL,
    "actual_outcome" text NOT NULL,
    "was_acted_on" boolean NOT NULL DEFAULT false,
    "was_overridden" boolean NOT NULL DEFAULT false,
    "override_reason" text,
    "predicted_impact_level" text NOT NULL,
    "actual_impact_level" text,
    "recommended_action" text NOT NULL,
    "final_action" text,
    "execution_result" text,
    "human_review_required" boolean NOT NULL DEFAULT false,
    "human_review_requested" boolean NOT NULL DEFAULT false,
    "decision_type" text NOT NULL,
    "recorded_at" timestamptz NOT NULL DEFAULT now(),
    "resolved_at" timestamptz
  )`,
  `CREATE INDEX IF NOT EXISTS "alloy_decision_outcomes_agent_idx" ON "alloy_decision_outcomes" ("agent_id")`,
  `CREATE INDEX IF NOT EXISTS "alloy_decision_outcomes_tenant_idx" ON "alloy_decision_outcomes" ("tenant_id")`,
  `CREATE INDEX IF NOT EXISTS "alloy_decision_outcomes_outcome_idx" ON "alloy_decision_outcomes" ("actual_outcome")`,
  `CREATE INDEX IF NOT EXISTS "alloy_decision_outcomes_recorded_idx" ON "alloy_decision_outcomes" ("recorded_at")`,

  `CREATE TABLE IF NOT EXISTS "alloy_agent_performance_snapshots" (
    "id" serial PRIMARY KEY NOT NULL,
    "agent_id" text NOT NULL,
    "tenant_id" text NOT NULL,
    "window_days" integer NOT NULL,
    "total_decisions" integer NOT NULL DEFAULT 0,
    "acceptance_rate" real NOT NULL DEFAULT 0,
    "override_rate" real NOT NULL DEFAULT 0,
    "rejection_rate" real NOT NULL DEFAULT 0,
    "weighted_accuracy_score" real NOT NULL DEFAULT 0,
    "mean_predicted_confidence" real NOT NULL DEFAULT 0,
    "mean_actual_acceptance_rate" real NOT NULL DEFAULT 0,
    "calibration_bias" real NOT NULL DEFAULT 0,
    "calibration_verdict" text NOT NULL DEFAULT 'insufficient_data',
    "overall_health_score" real NOT NULL DEFAULT 0,
    "health_label" text NOT NULL DEFAULT 'good',
    "flags" text[] NOT NULL DEFAULT '{}',
    "skill_effectiveness" jsonb NOT NULL DEFAULT '[]',
    "trend" text NOT NULL DEFAULT 'stable',
    "snapshot_taken_at" timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS "alloy_perf_snapshots_agent_idx" ON "alloy_agent_performance_snapshots" ("agent_id")`,
  `CREATE INDEX IF NOT EXISTS "alloy_perf_snapshots_tenant_idx" ON "alloy_agent_performance_snapshots" ("tenant_id")`,
  `CREATE INDEX IF NOT EXISTS "alloy_perf_snapshots_taken_idx" ON "alloy_agent_performance_snapshots" ("snapshot_taken_at")`,

  `CREATE TABLE IF NOT EXISTS "alloy_confidence_alerts" (
    "id" serial PRIMARY KEY NOT NULL,
    "alert_id" text NOT NULL UNIQUE,
    "agent_id" text NOT NULL,
    "tenant_id" text NOT NULL,
    "alert_type" text NOT NULL,
    "severity" text NOT NULL,
    "title" text NOT NULL,
    "description" text NOT NULL,
    "current_value" real NOT NULL,
    "threshold" real NOT NULL,
    "trend" text NOT NULL,
    "recommended_action" text NOT NULL,
    "requires_human_review" boolean NOT NULL DEFAULT false,
    "auto_resolvable" boolean NOT NULL DEFAULT true,
    "metadata" jsonb NOT NULL DEFAULT '{}',
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "resolved_at" timestamptz,
    "resolved_by" text
  )`,
  `CREATE INDEX IF NOT EXISTS "alloy_confidence_alerts_agent_idx" ON "alloy_confidence_alerts" ("agent_id")`,
  `CREATE INDEX IF NOT EXISTS "alloy_confidence_alerts_tenant_idx" ON "alloy_confidence_alerts" ("tenant_id")`,
  `CREATE INDEX IF NOT EXISTS "alloy_confidence_alerts_severity_idx" ON "alloy_confidence_alerts" ("severity")`,
  `CREATE INDEX IF NOT EXISTS "alloy_confidence_alerts_resolved_idx" ON "alloy_confidence_alerts" ("resolved_at")`,

  `CREATE TABLE IF NOT EXISTS "alloy_agent_reflections" (
    "id" serial PRIMARY KEY NOT NULL,
    "agent_id" text NOT NULL,
    "tenant_id" text NOT NULL,
    "has_data" boolean NOT NULL DEFAULT false,
    "context_block" text NOT NULL,
    "confidence_adjustment" real NOT NULL DEFAULT 0,
    "reasoning_adjustments" jsonb NOT NULL DEFAULT '[]',
    "urgent_flags" text[] NOT NULL DEFAULT '{}',
    "overall_health" text NOT NULL DEFAULT 'good',
    "created_at" timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS "alloy_agent_reflections_agent_idx" ON "alloy_agent_reflections" ("agent_id")`,
  `CREATE INDEX IF NOT EXISTS "alloy_agent_reflections_tenant_idx" ON "alloy_agent_reflections" ("tenant_id")`,

  `CREATE TABLE IF NOT EXISTS "alloy_self_improvement_config" (
    "id" serial PRIMARY KEY NOT NULL,
    "agent_id" text,
    "tenant_id" text NOT NULL,
    "short_window_days" integer NOT NULL DEFAULT 7,
    "long_window_days" integer NOT NULL DEFAULT 30,
    "min_sample_size" integer NOT NULL DEFAULT 5,
    "accuracy_decline_threshold" real NOT NULL DEFAULT 0.1,
    "override_rate_threshold" real NOT NULL DEFAULT 0.3,
    "low_acceptance_threshold" real NOT NULL DEFAULT 0.5,
    "calibration_drift_threshold" real NOT NULL DEFAULT 0.15,
    "self_reflection_enabled" boolean NOT NULL DEFAULT true,
    "alerts_enabled" boolean NOT NULL DEFAULT true,
    "auto_escalate_on_critical" boolean NOT NULL DEFAULT true,
    "alert_cooldown_hours" integer NOT NULL DEFAULT 4,
    "updated_by" text,
    "updated_at" timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS "alloy_si_config_tenant_idx" ON "alloy_self_improvement_config" ("tenant_id")`,
];

let migrated = false;

export async function ensureAlloySkillsTables(): Promise<void> {
  if (migrated) return;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const sql of SKILLS_MIGRATION_SQL) {
      await client.query(sql);
    }
    await client.query("COMMIT");
    migrated = true;
    logger.info("Alloy skills and self-improvement tables ensured");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    logger.warn({ err }, "Alloy skills table migration failed (non-fatal)");
  } finally {
    client.release();
  }
}
