// Canonical schema — single source of truth for all cross-product platform tables.
import { pgTable, text, serial, timestamp, integer, numeric, boolean, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";
import { usersTable } from "./auth";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category", { enum: ["platform", "ops", "intelligence", "maritime", "security", "analytics"] }).notNull().default("platform"),
  isActive: boolean("is_active").notNull().default(true),
  config: jsonb("config"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const platformSignalsTable = pgTable("platform_signals", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  workflowId: integer("workflow_id").references(() => workflowsTable.id, { onDelete: "set null" }),
  source: text("source").notNull(),
  sourceType: text("source_type", { enum: ["connector", "webhook", "api", "manual", "scheduled", "monitoring"] }).notNull(),
  severity: text("severity", { enum: ["critical", "high", "medium", "low", "info"] }).notNull().default("info"),
  title: text("title").notNull(),
  body: text("body"),
  status: text("status", { enum: ["new", "processing", "processed", "failed", "ignored"] }).notNull().default("new"),
  normalizedScore: numeric("normalized_score", { precision: 5, scale: 2 }),
  valueAtRisk: numeric("value_at_risk", { precision: 15, scale: 2 }),
  metadata: jsonb("metadata"),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("signals_org_idx").on(t.orgId),
  index("signals_status_idx").on(t.status),
  index("signals_severity_idx").on(t.severity),
  index("signals_received_idx").on(t.receivedAt),
]);

export const actionsTable = pgTable("actions", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  signalId: integer("signal_id").references(() => platformSignalsTable.id, { onDelete: "set null" }),
  product: text("product").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  actionType: text("action_type", { enum: ["investigation", "remediation", "escalation", "approval", "notification", "playbook", "manual"] }).notNull().default("manual"),
  status: text("status", { enum: ["pending", "in_progress", "completed", "deferred", "cancelled", "blocked"] }).notNull().default("pending"),
  priority: text("priority", { enum: ["critical", "high", "medium", "low"] }).notNull().default("medium"),
  assignedTo: integer("assigned_to").references(() => usersTable.id, { onDelete: "set null" }),
  ownerId: integer("owner_id").references(() => usersTable.id, { onDelete: "set null" }),
  dueAt: timestamp("due_at"),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("actions_org_idx").on(t.orgId),
  index("actions_status_idx").on(t.status),
  index("actions_signal_idx").on(t.signalId),
  index("actions_owner_idx").on(t.ownerId),
  index("actions_created_idx").on(t.createdAt),
]);

export const workflowsTable = pgTable("workflows", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  product: text("product").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type", { enum: ["signal", "schedule", "manual", "webhook", "action"] }).notNull().default("manual"),
  triggerConfig: jsonb("trigger_config"),
  steps: jsonb("steps").$type<Array<{ id: string; name: string; type: string; config: Record<string, unknown> }>>().default([]),
  status: text("status", { enum: ["active", "inactive", "draft", "archived"] }).notNull().default("draft"),
  ownerId: integer("owner_id").references(() => usersTable.id, { onDelete: "set null" }),
  runCount: integer("run_count").notNull().default(0),
  lastRunAt: timestamp("last_run_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("workflows_org_idx").on(t.orgId),
  index("workflows_status_idx").on(t.status),
  index("workflows_product_idx").on(t.product),
]);

export const workflowRunsTable = pgTable("workflow_runs", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  workflowId: integer("workflow_id").notNull().references(() => workflowsTable.id, { onDelete: "cascade" }),
  signalId: integer("signal_id").references(() => platformSignalsTable.id, { onDelete: "set null" }),
  status: text("status", { enum: ["queued", "running", "completed", "failed", "cancelled", "retrying"] }).notNull().default("queued"),
  triggeredBy: integer("triggered_by").references(() => usersTable.id, { onDelete: "set null" }),
  input: jsonb("input"),
  output: jsonb("output"),
  stepResults: jsonb("step_results").$type<Array<{ stepId: string; status: string; output?: unknown; error?: string; startedAt: string; completedAt?: string }>>().default([]),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("workflow_runs_org_idx").on(t.orgId),
  index("workflow_runs_workflow_idx").on(t.workflowId),
  index("workflow_runs_status_idx").on(t.status),
  index("workflow_runs_created_idx").on(t.createdAt),
]);

export const approvalsTable = pgTable("approvals", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  product: text("product").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  requestedBy: integer("requested_by").references(() => usersTable.id, { onDelete: "set null" }),
  approverId: integer("approver_id").references(() => usersTable.id, { onDelete: "set null" }),
  status: text("status", { enum: ["pending", "approved", "rejected", "cancelled", "expired"] }).notNull().default("pending"),
  decision: text("decision"),
  decidedAt: timestamp("decided_at"),
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("approvals_org_idx").on(t.orgId),
  index("approvals_status_idx").on(t.status),
  index("approvals_entity_idx").on(t.entityType, t.entityId),
]);

export const artifactsTable = pgTable("artifacts", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  signalId: integer("signal_id").references(() => platformSignalsTable.id, { onDelete: "set null" }),
  workflowRunId: integer("workflow_run_id").references(() => workflowRunsTable.id, { onDelete: "set null" }),
  product: text("product").notNull(),
  name: text("name").notNull(),
  artifactType: text("artifact_type", { enum: ["report", "export", "snapshot", "evidence", "playbook", "template", "other"] }).notNull().default("report"),
  status: text("status", { enum: ["pending", "generating", "ready", "approved", "rejected", "archived"] }).notNull().default("pending"),
  generatedBy: integer("generated_by").references(() => usersTable.id, { onDelete: "set null" }),
  approvedBy: integer("approved_by").references(() => usersTable.id, { onDelete: "set null" }),
  url: text("url"),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),
  content: text("content"),
  metadata: jsonb("metadata"),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("artifacts_org_idx").on(t.orgId),
  index("artifacts_signal_idx").on(t.signalId),
  index("artifacts_status_idx").on(t.status),
  index("artifacts_created_idx").on(t.createdAt),
]);

export const eventLogTable = pgTable("event_log", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "set null" }),
  product: text("product"),
  actorId: integer("actor_id").references(() => usersTable.id, { onDelete: "set null" }),
  actorName: text("actor_name"),
  eventType: text("event_type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  before: jsonb("before"),
  after: jsonb("after"),
  metadata: jsonb("metadata"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("event_log_org_idx").on(t.orgId),
  index("event_log_entity_idx").on(t.entityType, t.entityId),
  index("event_log_actor_idx").on(t.actorId),
  index("event_log_created_idx").on(t.createdAt),
  index("event_log_event_type_idx").on(t.eventType),
]);

export const readinessItemsTable = pgTable("readiness_items", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  product: text("product").notNull(),
  category: text("category", { enum: ["operational", "security", "compliance", "financial", "technical", "strategic", "people", "process", "maritime"] }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["not_started", "in_progress", "completed", "blocked", "not_applicable"] }).notNull().default("not_started"),
  priority: text("priority", { enum: ["critical", "high", "medium", "low"] }).notNull().default("medium"),
  score: numeric("score", { precision: 5, scale: 2 }),
  targetScore: numeric("target_score", { precision: 5, scale: 2 }).default("100"),
  ownerId: integer("owner_id").references(() => usersTable.id, { onDelete: "set null" }),
  dueAt: timestamp("due_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("readiness_items_org_idx").on(t.orgId),
  index("readiness_items_status_idx").on(t.status),
  index("readiness_items_product_idx").on(t.product),
  index("readiness_items_created_idx").on(t.createdAt),
]);

export const savedViewsTable = pgTable("saved_views", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  product: text("product").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  filters: jsonb("filters"),
  columns: jsonb("columns"),
  sortBy: text("sort_by"),
  sortOrder: text("sort_order", { enum: ["asc", "desc"] }).default("desc"),
  isDefault: boolean("is_default").notNull().default(false),
  isShared: boolean("is_shared").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("saved_views_org_idx").on(t.orgId),
  index("saved_views_user_idx").on(t.userId),
]);

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;

export const insertPlatformSignalSchema = createInsertSchema(platformSignalsTable).omit({ id: true, createdAt: true });
export type InsertPlatformSignal = z.infer<typeof insertPlatformSignalSchema>;
export type PlatformSignal = typeof platformSignalsTable.$inferSelect;

export const insertActionSchema = createInsertSchema(actionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAction = z.infer<typeof insertActionSchema>;
export type Action = typeof actionsTable.$inferSelect;

export const insertWorkflowSchema = createInsertSchema(workflowsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflowsTable.$inferSelect;

export const insertWorkflowRunSchema = createInsertSchema(workflowRunsTable).omit({ id: true, createdAt: true });
export type InsertWorkflowRun = z.infer<typeof insertWorkflowRunSchema>;
export type WorkflowRun = typeof workflowRunsTable.$inferSelect;

export const insertApprovalSchema = createInsertSchema(approvalsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertApproval = z.infer<typeof insertApprovalSchema>;
export type Approval = typeof approvalsTable.$inferSelect;

export const insertArtifactSchema = createInsertSchema(artifactsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertArtifact = z.infer<typeof insertArtifactSchema>;
export type Artifact = typeof artifactsTable.$inferSelect;

export const insertEventLogSchema = createInsertSchema(eventLogTable).omit({ id: true, createdAt: true });
export type InsertEventLog = z.infer<typeof insertEventLogSchema>;
export type EventLog = typeof eventLogTable.$inferSelect;

export const insertReadinessItemSchema = createInsertSchema(readinessItemsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReadinessItem = z.infer<typeof insertReadinessItemSchema>;
export type ReadinessItem = typeof readinessItemsTable.$inferSelect;

export const insertSavedViewSchema = createInsertSchema(savedViewsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSavedView = z.infer<typeof insertSavedViewSchema>;
export type SavedView = typeof savedViewsTable.$inferSelect;
