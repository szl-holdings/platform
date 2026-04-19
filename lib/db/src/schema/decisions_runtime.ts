import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Decisions Runtime — governed decision system tables
 *
 * Six tables that back the Decision Center v1:
 *   decisions              — decision cards with full metadata
 *   decision_evidence      — evidence items attached to a card
 *   decision_validations   — adversarial validation results per card
 *   decision_runs          — run trace (model/tool/handoff calls) per card
 *   decision_audit_events  — immutable audit trail for every card lifecycle event
 *   workspace_constitutions — policy DSL per workspace
 */

// ─── Workspace Constitutions ─────────────────────────────────────────────────

export const workspaceConstitutionsTable = pgTable("workspace_constitutions", {
  id: serial("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  version: text("version").notNull().default("1.0"),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  requiredApprovals: jsonb("required_approvals").notNull().default({}),
  actionRedlines: jsonb("action_redlines").notNull().default([]),
  autonomyCeilings: jsonb("autonomy_ceilings").notNull().default({}),
  confidenceFloor: real("confidence_floor").notNull().default(0.75),
  freshnessMaxHours: integer("freshness_max_hours").notNull().default(24),
  extraRules: jsonb("extra_rules").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("wc_workspace_id_idx").on(t.workspaceId),
  index("wc_workspace_active_idx").on(t.workspaceId, t.isActive),
]);

export const insertWorkspaceConstitutionSchema = createInsertSchema(workspaceConstitutionsTable);
export const selectWorkspaceConstitutionSchema = createSelectSchema(workspaceConstitutionsTable);
export type WorkspaceConstitution = typeof workspaceConstitutionsTable.$inferSelect;
export type InsertWorkspaceConstitution = typeof workspaceConstitutionsTable.$inferInsert;

// ─── Decision Cards ───────────────────────────────────────────────────────────

export const decisionsRuntimeTable = pgTable("decisions_runtime", {
  id: serial("id").primaryKey(),
  cardId: text("card_id").notNull().unique(),
  workspaceId: text("workspace_id").notNull(),
  domain: text("domain", {
    enum: ["lyte", "aegis", "vessels", "terra", "counsel", "carlota", "cross_domain"],
  }).notNull().default("lyte"),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  severity: text("severity", {
    enum: ["critical", "high", "medium", "low"],
  }).notNull().default("medium"),
  autonomyMode: text("autonomy_mode", {
    enum: ["observe", "recommend", "draft", "execute-with-approval", "auto-execute"],
  }).notNull().default("recommend"),
  status: text("status", {
    enum: ["draft", "validation-pending", "ready-for-review", "approved", "rejected", "changes-requested", "executed", "superseded"],
  }).notNull().default("draft"),
  policyState: text("policy_state", {
    enum: ["cleared", "conditional", "blocked", "flagged", "pending"],
  }).notNull().default("pending"),
  freshness: text("freshness", {
    enum: ["live", "recent", "stale", "expired"],
  }).notNull().default("recent"),
  confidence: real("confidence").notNull().default(0.75),
  entityScope: jsonb("entity_scope").notNull().default([]),
  recommendedAction: text("recommended_action"),
  reasoning: text("reasoning"),
  owner: text("owner"),
  priority: integer("priority").notNull().default(50),
  constitutionId: integer("constitution_id"),
  policyEvaluation: jsonb("policy_evaluation").default({}),
  validationSummary: jsonb("validation_summary").default({}),
  auditEventId: text("audit_event_id"),
  metadata: jsonb("metadata").default({}),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by"),
  reviewNote: text("review_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("dr_card_id_idx").on(t.cardId),
  index("dr_workspace_id_idx").on(t.workspaceId),
  index("dr_domain_idx").on(t.domain),
  index("dr_severity_idx").on(t.severity),
  index("dr_status_idx").on(t.status),
  index("dr_autonomy_mode_idx").on(t.autonomyMode),
  index("dr_workspace_domain_idx").on(t.workspaceId, t.domain),
  index("dr_workspace_status_idx").on(t.workspaceId, t.status),
  index("dr_created_at_idx").on(t.createdAt),
]);

export const insertDecisionRuntimeSchema = createInsertSchema(decisionsRuntimeTable);
export const selectDecisionRuntimeSchema = createSelectSchema(decisionsRuntimeTable);
export type DecisionRuntime = typeof decisionsRuntimeTable.$inferSelect;
export type InsertDecisionRuntime = typeof decisionsRuntimeTable.$inferInsert;

// ─── Decision Evidence ────────────────────────────────────────────────────────

export const decisionEvidenceTable = pgTable("decision_evidence", {
  id: serial("id").primaryKey(),
  cardId: text("card_id").notNull(),
  workspaceId: text("workspace_id").notNull(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  source: text("source").notNull(),
  excerpt: text("excerpt"),
  sourceType: text("source_type", {
    enum: ["signal", "database", "document", "api", "human", "model"],
  }).notNull().default("signal"),
  freshness: text("freshness", {
    enum: ["live", "recent", "stale", "expired"],
  }).notNull().default("recent"),
  confidence: real("confidence").notNull().default(0.8),
  capturedAt: timestamp("captured_at").notNull().defaultNow(),
  orderIdx: integer("order_idx").notNull().default(0),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("de_card_id_idx").on(t.cardId),
  index("de_workspace_id_idx").on(t.workspaceId),
]);

export const insertDecisionEvidenceSchema = createInsertSchema(decisionEvidenceTable);
export type DecisionEvidence = typeof decisionEvidenceTable.$inferSelect;
export type InsertDecisionEvidence = typeof decisionEvidenceTable.$inferInsert;

// ─── Decision Validations ─────────────────────────────────────────────────────

export const decisionValidationsTable = pgTable("decision_validations", {
  id: serial("id").primaryKey(),
  cardId: text("card_id").notNull(),
  workspaceId: text("workspace_id").notNull(),
  checkType: text("check_type", {
    enum: ["contradiction", "stale-data", "missing-evidence", "policy", "confidence-floor", "falsification"],
  }).notNull(),
  passed: boolean("passed").notNull().default(false),
  explanation: text("explanation").notNull(),
  severity: text("severity", {
    enum: ["blocking", "warning", "info"],
  }).notNull().default("blocking"),
  metadata: jsonb("metadata").default({}),
  ranAt: timestamp("ran_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("dv_card_id_idx").on(t.cardId),
  index("dv_workspace_id_idx").on(t.workspaceId),
  index("dv_check_type_idx").on(t.checkType),
]);

export const insertDecisionValidationSchema = createInsertSchema(decisionValidationsTable);
export type DecisionValidation = typeof decisionValidationsTable.$inferSelect;
export type InsertDecisionValidation = typeof decisionValidationsTable.$inferInsert;

// ─── Decision Runs ────────────────────────────────────────────────────────────

export const decisionRunsTable = pgTable("decision_runs", {
  id: serial("id").primaryKey(),
  cardId: text("card_id").notNull(),
  workspaceId: text("workspace_id").notNull(),
  runId: text("run_id").notNull().unique(),
  steps: jsonb("steps").notNull().default([]),
  totalLatencyMs: integer("total_latency_ms"),
  totalInputTokens: integer("total_input_tokens"),
  totalOutputTokens: integer("total_output_tokens"),
  estimatedCostUsd: real("estimated_cost_usd"),
  modelsCalled: jsonb("models_called").notNull().default([]),
  toolsCalled: jsonb("tools_called").notNull().default([]),
  handoffs: jsonb("handoffs").notNull().default([]),
  status: text("status", {
    enum: ["completed", "failed", "partial"],
  }).notNull().default("completed"),
  metadata: jsonb("metadata").default({}),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("drn_card_id_idx").on(t.cardId),
  index("drn_workspace_id_idx").on(t.workspaceId),
  index("drn_run_id_idx").on(t.runId),
]);

export const insertDecisionRunSchema = createInsertSchema(decisionRunsTable);
export type DecisionRun = typeof decisionRunsTable.$inferSelect;
export type InsertDecisionRun = typeof decisionRunsTable.$inferInsert;

// ─── Decision Audit Events ────────────────────────────────────────────────────

export const decisionAuditEventsTable = pgTable("decision_audit_events", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().unique(),
  cardId: text("card_id").notNull(),
  workspaceId: text("workspace_id").notNull(),
  eventType: text("event_type", {
    enum: [
      "card.created",
      "validation.ran",
      "policy.evaluated",
      "card.promoted",
      "card.approved",
      "card.rejected",
      "card.changes_requested",
      "card.executed",
      "card.superseded",
    ],
  }).notNull(),
  actorId: text("actor_id").notNull(),
  actorType: text("actor_type", {
    enum: ["human", "agent", "system", "external"],
  }).notNull().default("system"),
  actorDisplay: text("actor_display"),
  reason: text("reason"),
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  metadata: jsonb("metadata").default({}),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("dae_event_id_idx").on(t.eventId),
  index("dae_card_id_idx").on(t.cardId),
  index("dae_workspace_id_idx").on(t.workspaceId),
  index("dae_event_type_idx").on(t.eventType),
  index("dae_occurred_at_idx").on(t.occurredAt),
]);

export const insertDecisionAuditEventSchema = createInsertSchema(decisionAuditEventsTable);
export type DecisionAuditEvent = typeof decisionAuditEventsTable.$inferSelect;
export type InsertDecisionAuditEvent = typeof decisionAuditEventsTable.$inferInsert;

// ─── Zod schemas for API boundaries ──────────────────────────────────────────

export const autonomyModeSchema = z.enum(["observe", "recommend", "draft", "execute-with-approval", "auto-execute"]);
export const severitySchema = z.enum(["critical", "high", "medium", "low"]);
export const decisionStatusSchema = z.enum(["draft", "validation-pending", "ready-for-review", "approved", "rejected", "changes-requested", "executed", "superseded"]);
export const domainSchema = z.enum(["lyte", "aegis", "vessels", "terra", "counsel", "carlota", "cross_domain"]);
