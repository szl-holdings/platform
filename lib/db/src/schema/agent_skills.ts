import { boolean, integer, pgTable, real, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const alloySkillRegistryTable = pgTable("alloy_skill_registry", {
  id: serial("id").primaryKey(),
  skillId: text("skill_id").notNull().unique(),
  name: text("name").notNull(),
  version: text("version").notNull().default("1.0.0"),
  capability: text("capability").notNull(),
  domain: text("domain").notNull(),
  description: text("description").notNull(),
  triggerConditions: jsonb("trigger_conditions").notNull().default([]),
  requiredInputs: jsonb("required_inputs").notNull().default([]),
  optionalInputs: jsonb("optional_inputs").notNull().default([]),
  outputSchema: jsonb("output_schema").notNull().default([]),
  outputDecisionType: text("output_decision_type").notNull(),
  chainMetadata: jsonb("chain_metadata").notNull().default({}),
  analyticMode: text("analytic_mode").notNull(),
  policyClass: text("policy_class").notNull(),
  estimatedLatencyMs: integer("estimated_latency_ms").notNull().default(10000),
  tags: text("tags").array().notNull().default([]),
  isBuiltin: boolean("is_builtin").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  registeredBy: text("registered_by"),
  orgId: integer("org_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const alloyDecisionOutcomes = pgTable("alloy_decision_outcomes", {
  id: serial("id").primaryKey(),
  decisionId: text("decision_id").notNull().unique(),
  agentId: text("agent_id").notNull(),
  tenantId: text("tenant_id").notNull(),
  skillId: text("skill_id"),
  capability: text("capability"),
  predictedConfidence: real("predicted_confidence").notNull(),
  actualOutcome: text("actual_outcome").notNull(),
  wasActedOn: boolean("was_acted_on").notNull().default(false),
  wasOverridden: boolean("was_overridden").notNull().default(false),
  overrideReason: text("override_reason"),
  predictedImpactLevel: text("predicted_impact_level").notNull(),
  actualImpactLevel: text("actual_impact_level"),
  recommendedAction: text("recommended_action").notNull(),
  finalAction: text("final_action"),
  executionResult: text("execution_result"),
  humanReviewRequired: boolean("human_review_required").notNull().default(false),
  humanReviewRequested: boolean("human_review_requested").notNull().default(false),
  decisionType: text("decision_type").notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const alloyAgentPerformanceSnapshots = pgTable("alloy_agent_performance_snapshots", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull(),
  tenantId: text("tenant_id").notNull(),
  windowDays: integer("window_days").notNull(),
  totalDecisions: integer("total_decisions").notNull().default(0),
  acceptanceRate: real("acceptance_rate").notNull().default(0),
  overrideRate: real("override_rate").notNull().default(0),
  rejectionRate: real("rejection_rate").notNull().default(0),
  weightedAccuracyScore: real("weighted_accuracy_score").notNull().default(0),
  meanPredictedConfidence: real("mean_predicted_confidence").notNull().default(0),
  meanActualAcceptanceRate: real("mean_actual_acceptance_rate").notNull().default(0),
  calibrationBias: real("calibration_bias").notNull().default(0),
  calibrationVerdict: text("calibration_verdict").notNull().default("insufficient_data"),
  overallHealthScore: real("overall_health_score").notNull().default(0),
  healthLabel: text("health_label").notNull().default("good"),
  flags: text("flags").array().notNull().default([]),
  skillEffectiveness: jsonb("skill_effectiveness").notNull().default([]),
  trend: text("trend").notNull().default("stable"),
  snapshotTakenAt: timestamp("snapshot_taken_at", { withTimezone: true }).defaultNow().notNull(),
});

export const alloyConfidenceAlerts = pgTable("alloy_confidence_alerts", {
  id: serial("id").primaryKey(),
  alertId: text("alert_id").notNull().unique(),
  agentId: text("agent_id").notNull(),
  tenantId: text("tenant_id").notNull(),
  alertType: text("alert_type").notNull(),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  currentValue: real("current_value").notNull(),
  threshold: real("threshold").notNull(),
  trend: text("trend").notNull(),
  recommendedAction: text("recommended_action").notNull(),
  requiresHumanReview: boolean("requires_human_review").notNull().default(false),
  autoResolvable: boolean("auto_resolvable").notNull().default(true),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedBy: text("resolved_by"),
});

export const alloyAgentReflections = pgTable("alloy_agent_reflections", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull(),
  tenantId: text("tenant_id").notNull(),
  hasData: boolean("has_data").notNull().default(false),
  contextBlock: text("context_block").notNull(),
  confidenceAdjustment: real("confidence_adjustment").notNull().default(0),
  reasoningAdjustments: jsonb("reasoning_adjustments").notNull().default([]),
  urgentFlags: text("urgent_flags").array().notNull().default([]),
  overallHealth: text("overall_health").notNull().default("good"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const alloySelfImprovementConfig = pgTable("alloy_self_improvement_config", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id"),
  tenantId: text("tenant_id").notNull(),
  shortWindowDays: integer("short_window_days").notNull().default(7),
  longWindowDays: integer("long_window_days").notNull().default(30),
  minSampleSize: integer("min_sample_size").notNull().default(5),
  accuracyDeclineThreshold: real("accuracy_decline_threshold").notNull().default(0.1),
  overrideRateThreshold: real("override_rate_threshold").notNull().default(0.3),
  lowAcceptanceThreshold: real("low_acceptance_threshold").notNull().default(0.5),
  calibrationDriftThreshold: real("calibration_drift_threshold").notNull().default(0.15),
  selfReflectionEnabled: boolean("self_reflection_enabled").notNull().default(true),
  alertsEnabled: boolean("alerts_enabled").notNull().default(true),
  autoEscalateOnCritical: boolean("auto_escalate_on_critical").notNull().default(true),
  alertCooldownHours: integer("alert_cooldown_hours").notNull().default(4),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AlloySkillRegistryRow = typeof alloySkillRegistryTable.$inferSelect;
export type AlloyDecisionOutcome = typeof alloyDecisionOutcomes.$inferSelect;
export type AlloyAgentPerformanceSnapshot = typeof alloyAgentPerformanceSnapshots.$inferSelect;
export type AlloyConfidenceAlert = typeof alloyConfidenceAlerts.$inferSelect;
export type AlloyAgentReflection = typeof alloyAgentReflections.$inferSelect;
export type AlloySelfImprovementConfig = typeof alloySelfImprovementConfig.$inferSelect;
