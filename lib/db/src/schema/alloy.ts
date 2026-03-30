import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
  serial,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { usersTable } from "./auth";

// ─── Owner ────────────────────────────────────────────────────────────────────

export const alloyOwners = pgTable("alloy_owners", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  name: text("name").notNull(),
  type: text("type", { enum: ["user", "team", "system", "external"] }).notNull().default("user"),
  email: text("email"),
  domain: text("domain"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("alloy_owners_domain_idx").on(t.domain),
  index("alloy_owners_type_idx").on(t.type),
]);

// ─── Signal ───────────────────────────────────────────────────────────────────

export const alloySignals = pgTable("alloy_signals", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  source: text("source").notNull(),
  sourceType: text("source_type", {
    enum: ["webhook", "batch", "manual", "scheduled", "demo", "api"],
  }).notNull().default("api"),
  domain: text("domain").notNull(),
  rawPayload: jsonb("raw_payload"),
  title: text("title").notNull(),
  summary: text("summary"),
  category: text("category"),
  severity: text("severity", {
    enum: ["info", "low", "medium", "high", "critical"],
  }).notNull().default("medium"),
  score: real("score").default(0),
  confidence: real("confidence").default(0.5),
  tags: jsonb("tags").default([]),
  ownerId: integer("owner_id").references(() => alloyOwners.id),
  ownerUserId: integer("owner_user_id").references(() => usersTable.id),
  status: text("status", {
    enum: ["raw", "normalized", "scored", "triaged", "archived"],
  }).notNull().default("raw"),
  normalizedAt: timestamp("normalized_at"),
  scoredAt: timestamp("scored_at"),
  dedupeKey: text("dedupe_key"),
  environment: text("environment", { enum: ["development", "staging", "production"] }).default("production"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("alloy_signals_domain_idx").on(t.domain),
  index("alloy_signals_severity_idx").on(t.severity),
  index("alloy_signals_status_idx").on(t.status),
  index("alloy_signals_source_type_idx").on(t.sourceType),
  index("alloy_signals_owner_idx").on(t.ownerId),
  index("alloy_signals_created_idx").on(t.createdAt),
  index("alloy_signals_dedupe_idx").on(t.dedupeKey),
]);

// ─── Workflow ──────────────────────────────────────────────────────────────────

export const alloyWorkflows = pgTable("alloy_workflows", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["investigation", "remediation", "escalation", "review", "notification", "report", "custom"],
  }).notNull().default("investigation"),
  domain: text("domain").notNull(),
  triggerId: integer("trigger_signal_id").references(() => alloySignals.id),
  triggerType: text("trigger_type", { enum: ["signal", "schedule", "manual", "escalation"] }).notNull().default("signal"),
  status: text("status", {
    enum: ["pending", "running", "waiting_approval", "approved", "rejected", "completed", "failed", "cancelled"],
  }).notNull().default("pending"),
  priority: text("priority", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  ownerId: integer("owner_id").references(() => alloyOwners.id),
  ownerUserId: integer("owner_user_id").references(() => usersTable.id),
  assignedUserId: integer("assigned_user_id").references(() => usersTable.id),
  steps: jsonb("steps").default([]),
  currentStep: integer("current_step").default(0),
  inputs: jsonb("inputs").default({}),
  outputs: jsonb("outputs").default({}),
  context: jsonb("context").default({}),
  retryCount: integer("retry_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  approvalState: text("approval_state", { enum: ["none", "pending", "approved", "rejected"] }).default("none"),
  confidenceScore: real("confidence_score").default(0.5),
  errorMessage: text("error_message"),
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  environment: text("environment", { enum: ["development", "staging", "production"] }).default("production"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("alloy_workflows_domain_idx").on(t.domain),
  index("alloy_workflows_status_idx").on(t.status),
  index("alloy_workflows_type_idx").on(t.type),
  index("alloy_workflows_owner_idx").on(t.ownerId),
  index("alloy_workflows_priority_idx").on(t.priority),
  index("alloy_workflows_created_idx").on(t.createdAt),
]);

// ─── Workflow Run History ─────────────────────────────────────────────────────

export const alloyWorkflowRuns = pgTable("alloy_workflow_runs", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => alloyWorkflows.id, { onDelete: "cascade" }),
  runNumber: integer("run_number").notNull().default(1),
  status: text("status", {
    enum: ["started", "completed", "failed", "cancelled"],
  }).notNull().default("started"),
  trigger: text("trigger"),
  inputs: jsonb("inputs").default({}),
  outputs: jsonb("outputs").default({}),
  stepsExecuted: jsonb("steps_executed").default([]),
  ownerUserId: integer("owner_user_id").references(() => usersTable.id),
  approvalState: text("approval_state", { enum: ["none", "pending", "approved", "rejected"] }).default("none"),
  approvedByUserId: integer("approved_by_user_id").references(() => usersTable.id),
  retryCount: integer("retry_count").notNull().default(0),
  errorMessage: text("error_message"),
  durationMs: integer("duration_ms"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata").default({}),
}, (t) => [
  index("alloy_workflow_runs_workflow_idx").on(t.workflowId),
  index("alloy_workflow_runs_status_idx").on(t.status),
  index("alloy_workflow_runs_started_idx").on(t.startedAt),
]);

// ─── Approval ─────────────────────────────────────────────────────────────────

export const alloyApprovals = pgTable("alloy_approvals", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => alloyWorkflows.id, { onDelete: "cascade" }),
  runId: integer("run_id").references(() => alloyWorkflowRuns.id),
  requestedByUserId: integer("requested_by_user_id").references(() => usersTable.id),
  reviewerUserId: integer("reviewer_user_id").references(() => usersTable.id),
  status: text("status", {
    enum: ["pending", "approved", "rejected", "expired"],
  }).notNull().default("pending"),
  reason: text("reason"),
  reviewNote: text("review_note"),
  requiredRoles: jsonb("required_roles").default([]),
  expiresAt: timestamp("expires_at"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("alloy_approvals_workflow_idx").on(t.workflowId),
  index("alloy_approvals_status_idx").on(t.status),
  index("alloy_approvals_reviewer_idx").on(t.reviewerUserId),
]);

// ─── Action ───────────────────────────────────────────────────────────────────

export const alloyActions = pgTable("alloy_actions", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  workflowId: integer("workflow_id").references(() => alloyWorkflows.id),
  signalId: integer("signal_id").references(() => alloySignals.id),
  type: text("type", {
    enum: ["alert", "notify", "escalate", "assign", "resolve", "suppress", "review", "remediate", "report", "custom"],
  }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", {
    enum: ["queued", "in_progress", "completed", "failed", "cancelled", "skipped"],
  }).notNull().default("queued"),
  priority: text("priority", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  assignedUserId: integer("assigned_user_id").references(() => usersTable.id),
  ownerId: integer("owner_id").references(() => alloyOwners.id),
  payload: jsonb("payload").default({}),
  result: jsonb("result"),
  errorMessage: text("error_message"),
  dueAt: timestamp("due_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("alloy_actions_workflow_idx").on(t.workflowId),
  index("alloy_actions_signal_idx").on(t.signalId),
  index("alloy_actions_status_idx").on(t.status),
  index("alloy_actions_type_idx").on(t.type),
  index("alloy_actions_assigned_idx").on(t.assignedUserId),
]);

// ─── Artifact (Output) ────────────────────────────────────────────────────────

export const alloyArtifacts = pgTable("alloy_artifacts", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  workflowId: integer("workflow_id").references(() => alloyWorkflows.id),
  signalId: integer("signal_id").references(() => alloySignals.id),
  type: text("type", {
    enum: ["summary", "alert", "proposal", "brief", "action_queue", "readiness", "report", "note", "custom"],
  }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  format: text("format", { enum: ["text", "markdown", "json", "html"] }).notNull().default("markdown"),
  confidenceScore: real("confidence_score").default(0.5),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  approvalState: text("approval_state", { enum: ["none", "pending", "approved", "rejected"] }).default("none"),
  approvedByUserId: integer("approved_by_user_id").references(() => usersTable.id),
  version: integer("version").notNull().default(1),
  parentArtifactId: integer("parent_artifact_id"),
  tags: jsonb("tags").default([]),
  domain: text("domain").notNull(),
  ownerId: integer("owner_id").references(() => alloyOwners.id),
  ownerUserId: integer("owner_user_id").references(() => usersTable.id),
  metadata: jsonb("metadata").default({}),
  publishedAt: timestamp("published_at"),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("alloy_artifacts_workflow_idx").on(t.workflowId),
  index("alloy_artifacts_signal_idx").on(t.signalId),
  index("alloy_artifacts_type_idx").on(t.type),
  index("alloy_artifacts_domain_idx").on(t.domain),
  index("alloy_artifacts_owner_idx").on(t.ownerId),
  index("alloy_artifacts_approval_idx").on(t.approvalState),
]);

// ─── Audit Log ────────────────────────────────────────────────────────────────

export const alloyAuditLog = pgTable("alloy_audit_log", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type", {
    enum: ["signal", "workflow", "action", "artifact", "approval", "owner"],
  }).notNull(),
  entityId: integer("entity_id").notNull(),
  action: text("action").notNull(),
  actorUserId: integer("actor_user_id").references(() => usersTable.id),
  actorType: text("actor_type", { enum: ["user", "system", "agent"] }).notNull().default("system"),
  previousState: jsonb("previous_state"),
  newState: jsonb("new_state"),
  diff: jsonb("diff"),
  notes: text("notes"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  correlationId: text("correlation_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("alloy_audit_log_entity_idx").on(t.entityType, t.entityId),
  index("alloy_audit_log_actor_idx").on(t.actorUserId),
  index("alloy_audit_log_created_idx").on(t.createdAt),
  index("alloy_audit_log_action_idx").on(t.action),
]);

// ─── Relations ────────────────────────────────────────────────────────────────

export const alloySignalsRelations = relations(alloySignals, ({ one, many }) => ({
  owner: one(alloyOwners, { fields: [alloySignals.ownerId], references: [alloyOwners.id] }),
  ownerUser: one(usersTable, { fields: [alloySignals.ownerUserId], references: [usersTable.id] }),
  workflows: many(alloyWorkflows),
  actions: many(alloyActions),
  artifacts: many(alloyArtifacts),
}));

export const alloyWorkflowsRelations = relations(alloyWorkflows, ({ one, many }) => ({
  triggerSignal: one(alloySignals, { fields: [alloyWorkflows.triggerId], references: [alloySignals.id] }),
  owner: one(alloyOwners, { fields: [alloyWorkflows.ownerId], references: [alloyOwners.id] }),
  ownerUser: one(usersTable, { fields: [alloyWorkflows.ownerUserId], references: [usersTable.id] }),
  assignedUser: one(usersTable, { fields: [alloyWorkflows.assignedUserId], references: [usersTable.id] }),
  runs: many(alloyWorkflowRuns),
  approvals: many(alloyApprovals),
  actions: many(alloyActions),
  artifacts: many(alloyArtifacts),
}));

export const alloyWorkflowRunsRelations = relations(alloyWorkflowRuns, ({ one }) => ({
  workflow: one(alloyWorkflows, { fields: [alloyWorkflowRuns.workflowId], references: [alloyWorkflows.id] }),
  ownerUser: one(usersTable, { fields: [alloyWorkflowRuns.ownerUserId], references: [usersTable.id] }),
  approvedByUser: one(usersTable, { fields: [alloyWorkflowRuns.approvedByUserId], references: [usersTable.id] }),
}));

export const alloyApprovalsRelations = relations(alloyApprovals, ({ one }) => ({
  workflow: one(alloyWorkflows, { fields: [alloyApprovals.workflowId], references: [alloyWorkflows.id] }),
  run: one(alloyWorkflowRuns, { fields: [alloyApprovals.runId], references: [alloyWorkflowRuns.id] }),
  requestedByUser: one(usersTable, { fields: [alloyApprovals.requestedByUserId], references: [usersTable.id] }),
  reviewerUser: one(usersTable, { fields: [alloyApprovals.reviewerUserId], references: [usersTable.id] }),
}));

export const alloyActionsRelations = relations(alloyActions, ({ one }) => ({
  workflow: one(alloyWorkflows, { fields: [alloyActions.workflowId], references: [alloyWorkflows.id] }),
  signal: one(alloySignals, { fields: [alloyActions.signalId], references: [alloySignals.id] }),
  assignedUser: one(usersTable, { fields: [alloyActions.assignedUserId], references: [usersTable.id] }),
  owner: one(alloyOwners, { fields: [alloyActions.ownerId], references: [alloyOwners.id] }),
}));

export const alloyArtifactsRelations = relations(alloyArtifacts, ({ one }) => ({
  workflow: one(alloyWorkflows, { fields: [alloyArtifacts.workflowId], references: [alloyWorkflows.id] }),
  signal: one(alloySignals, { fields: [alloyArtifacts.signalId], references: [alloySignals.id] }),
  approvedByUser: one(usersTable, { fields: [alloyArtifacts.approvedByUserId], references: [usersTable.id] }),
  owner: one(alloyOwners, { fields: [alloyArtifacts.ownerId], references: [alloyOwners.id] }),
  ownerUser: one(usersTable, { fields: [alloyArtifacts.ownerUserId], references: [usersTable.id] }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlloySignal = typeof alloySignals.$inferSelect;
export type InsertAlloySignal = typeof alloySignals.$inferInsert;
export type AlloyWorkflow = typeof alloyWorkflows.$inferSelect;
export type InsertAlloyWorkflow = typeof alloyWorkflows.$inferInsert;
export type AlloyWorkflowRun = typeof alloyWorkflowRuns.$inferSelect;
export type InsertAlloyWorkflowRun = typeof alloyWorkflowRuns.$inferInsert;
export type AlloyApproval = typeof alloyApprovals.$inferSelect;
export type InsertAlloyApproval = typeof alloyApprovals.$inferInsert;
export type AlloyAction = typeof alloyActions.$inferSelect;
export type InsertAlloyAction = typeof alloyActions.$inferInsert;
export type AlloyArtifact = typeof alloyArtifacts.$inferSelect;
export type InsertAlloyArtifact = typeof alloyArtifacts.$inferInsert;
export type AlloyAuditLogEntry = typeof alloyAuditLog.$inferSelect;
export type InsertAlloyAuditLogEntry = typeof alloyAuditLog.$inferInsert;
export type AlloyOwner = typeof alloyOwners.$inferSelect;
export type InsertAlloyOwner = typeof alloyOwners.$inferInsert;
