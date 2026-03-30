import {
  pgTable, text, serial, timestamp, integer, numeric, boolean, jsonb, index, uniqueIndex
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";
import { organizationsTable } from "./organizations";

// ─── ENUMS ─────────────────────────────────────────────────────────────────────

export const ROLES_ENUM = [
  "anonymous_visitor",
  "founder_admin",
  "platform_admin",
  "operator",
  "analyst",
  "executive_viewer",
  "ops_manager",
  "sales_delivery_user",
  "maritime_ops_user",
  "service_coordinator",
  "pilot_customer_user",
] as const;
export type SzlRole = (typeof ROLES_ENUM)[number];

export const WORKFLOW_STATES = ["queued", "running", "waiting_approval", "blocked", "failed", "completed", "canceled"] as const;
export const ACTION_STATES = ["open", "assigned", "acknowledged", "in_progress", "escalated", "resolved", "overridden", "archived"] as const;
export const OWNER_STATES = ["assigned", "unassigned", "ambiguous", "stale", "escalated"] as const;
export const SEVERITY_LEVELS = ["critical", "high", "medium", "low", "stable"] as const;
export const CONFIDENCE_LEVELS = ["low", "medium", "high", "human_validated"] as const;
export const APPROVAL_STATES = ["pending", "approved", "rejected", "escalated", "expired"] as const;
export const MAINTENANCE_STATUSES = ["ok", "scheduled", "overdue", "in_progress", "deferred"] as const;
export const READINESS_SCORES_ENUM = ["not_started", "at_risk", "on_track", "ready", "blocked"] as const;

export type WorkflowState = (typeof WORKFLOW_STATES)[number];
export type ActionState = (typeof ACTION_STATES)[number];
export type OwnerState = (typeof OWNER_STATES)[number];
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];
export type ApprovalState = (typeof APPROVAL_STATES)[number];

// ─── PRODUCTS ──────────────────────────────────────────────────────────────────

export const productsTable = pgTable("szl_products", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  productType: text("product_type", { enum: ["platform", "module", "service", "vertical"] }).notNull().default("platform"),
  parentSlug: text("parent_slug"),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("szl_products_org_idx").on(t.orgId),
]);

// ─── SIGNALS ───────────────────────────────────────────────────────────────────

export const szlSignalsTable = pgTable("szl_signals", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  productSlug: text("product_slug"),
  source: text("source").notNull(),
  sourceType: text("source_type", { enum: ["connector", "webhook", "manual", "monitoring", "scheduler", "ai"] }).notNull(),
  severity: text("severity", { enum: SEVERITY_LEVELS }).notNull().default("medium"),
  title: text("title").notNull(),
  body: text("body"),
  whyItMatters: text("why_it_matters"),
  valueAtRiskCents: integer("value_at_risk_cents"),
  confidence: text("confidence", { enum: CONFIDENCE_LEVELS }).notNull().default("medium"),
  ownerState: text("owner_state", { enum: OWNER_STATES }).notNull().default("unassigned"),
  ownerId: integer("owner_id").references(() => usersTable.id, { onDelete: "set null" }),
  status: text("status", { enum: ["new", "acknowledged", "in_progress", "resolved", "dismissed"] }).notNull().default("new"),
  correlationId: text("correlation_id"),
  metadata: jsonb("metadata"),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("szl_signals_org_idx").on(t.orgId),
  index("szl_signals_owner_idx").on(t.ownerId),
  index("szl_signals_status_idx").on(t.status),
  index("szl_signals_severity_idx").on(t.severity),
  index("szl_signals_detected_at_idx").on(t.detectedAt),
  index("szl_signals_created_at_idx").on(t.createdAt),
]);

// ─── ACTIONS ───────────────────────────────────────────────────────────────────

export const szlActionsTable = pgTable("szl_actions", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  signalId: integer("signal_id").references(() => szlSignalsTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  actionState: text("action_state", { enum: ACTION_STATES }).notNull().default("open"),
  escalationState: text("escalation_state", { enum: ["none", "pending", "escalated", "resolved"] }).notNull().default("none"),
  estimatedValueProtectedCents: integer("estimated_value_protected_cents"),
  ownerId: integer("owner_id").references(() => usersTable.id, { onDelete: "set null" }),
  dueAt: timestamp("due_at"),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("szl_actions_org_idx").on(t.orgId),
  index("szl_actions_owner_idx").on(t.ownerId),
  index("szl_actions_state_idx").on(t.actionState),
  index("szl_actions_created_at_idx").on(t.createdAt),
]);

// ─── WORKFLOWS ─────────────────────────────────────────────────────────────────

export const szlWorkflowsTable = pgTable("szl_workflows", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type", { enum: ["manual", "scheduled", "event", "signal", "webhook"] }).notNull().default("manual"),
  approvalRequired: boolean("approval_required").notNull().default(false),
  configJson: jsonb("config_json"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("szl_workflows_org_idx").on(t.orgId),
  index("szl_workflows_created_at_idx").on(t.createdAt),
]);

// ─── WORKFLOW RUNS ─────────────────────────────────────────────────────────────

export const szlWorkflowRunsTable = pgTable("szl_workflow_runs", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => szlWorkflowsTable.id, { onDelete: "cascade" }),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  state: text("state", { enum: WORKFLOW_STATES }).notNull().default("queued"),
  approvalState: text("approval_state", { enum: APPROVAL_STATES }).default("pending"),
  inputJson: jsonb("input_json"),
  outputJson: jsonb("output_json"),
  errorJson: jsonb("error_json"),
  retryCount: integer("retry_count").notNull().default(0),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("szl_workflow_runs_workflow_idx").on(t.workflowId),
  index("szl_workflow_runs_org_idx").on(t.orgId),
  index("szl_workflow_runs_state_idx").on(t.state),
  index("szl_workflow_runs_created_at_idx").on(t.createdAt),
]);

// ─── APPROVALS ─────────────────────────────────────────────────────────────────

export const szlApprovalsTable = pgTable("szl_approvals", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  workflowRunId: integer("workflow_run_id").references(() => szlWorkflowRunsTable.id, { onDelete: "cascade" }),
  requestedBy: integer("requested_by").references(() => usersTable.id, { onDelete: "set null" }),
  approvedBy: integer("approved_by").references(() => usersTable.id, { onDelete: "set null" }),
  state: text("state", { enum: APPROVAL_STATES }).notNull().default("pending"),
  requestNote: text("request_note"),
  decisionNote: text("decision_note"),
  expiresAt: timestamp("expires_at"),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("szl_approvals_org_idx").on(t.orgId),
  index("szl_approvals_state_idx").on(t.state),
  index("szl_approvals_created_at_idx").on(t.createdAt),
]);

// ─── ARTIFACTS ─────────────────────────────────────────────────────────────────

export const szlArtifactsTable = pgTable("szl_artifacts", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  workflowRunId: integer("workflow_run_id").references(() => szlWorkflowRunsTable.id, { onDelete: "set null" }),
  artifactType: text("artifact_type", { enum: ["report", "document", "analysis", "recommendation", "alert", "data_export"] }).notNull(),
  title: text("title").notNull(),
  contentJson: jsonb("content_json"),
  approved: boolean("approved").notNull().default(false),
  createdBySystem: boolean("created_by_system").notNull().default(false),
  createdBy: integer("created_by").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("szl_artifacts_org_idx").on(t.orgId),
  index("szl_artifacts_created_at_idx").on(t.createdAt),
]);

// ─── COMMENTS ──────────────────────────────────────────────────────────────────

export const szlCommentsTable = pgTable("szl_comments", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  entityType: text("entity_type", { enum: ["signal", "action", "workflow_run", "approval", "artifact", "exception"] }).notNull(),
  entityId: integer("entity_id").notNull(),
  authorId: integer("author_id").references(() => usersTable.id, { onDelete: "set null" }),
  authorName: text("author_name"),
  isSystemComment: boolean("is_system_comment").notNull().default(false),
  body: text("body").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("szl_comments_entity_idx").on(t.entityType, t.entityId),
  index("szl_comments_org_idx").on(t.orgId),
  index("szl_comments_created_at_idx").on(t.createdAt),
]);

// ─── EVENT LOG ─────────────────────────────────────────────────────────────────

export const szlEventLogTable = pgTable("szl_event_log", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  actorId: integer("actor_id").references(() => usersTable.id, { onDelete: "set null" }),
  actorType: text("actor_type", { enum: ["user", "system", "workflow", "agent"] }).notNull().default("system"),
  eventType: text("event_type").notNull(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  summary: text("summary"),
  payload: jsonb("payload"),
  correlationId: text("correlation_id"),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
}, (t) => [
  index("szl_event_log_org_idx").on(t.orgId),
  index("szl_event_log_actor_idx").on(t.actorId),
  index("szl_event_log_occurred_at_idx").on(t.occurredAt),
  index("szl_event_log_entity_idx").on(t.entityType, t.entityId),
]);

// ─── FEATURE FLAGS (canonical extensions) ─────────────────────────────────────

export const szlFeatureFlagsTable = pgTable("szl_feature_flags", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  isEnabled: boolean("is_enabled").notNull().default(false),
  rolloutPercentage: integer("rollout_percentage").notNull().default(0),
  product: text("product"),
  conditions: jsonb("conditions"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("szl_feature_flags_key_idx").on(t.key),
]);

// ─── VESSELS (canonical) ───────────────────────────────────────────────────────

export const szlVesselsTable = pgTable("szl_vessels", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  imo: text("imo").unique(),
  mmsi: text("mmsi"),
  name: text("name").notNull(),
  vesselClass: text("vessel_class"),
  vesselType: text("vessel_type", { enum: ["cargo", "tanker", "container", "bulk", "passenger", "fishing", "other"] }).notNull(),
  flag: text("flag"),
  yearBuilt: integer("year_built"),
  grossTonnageMt: numeric("gross_tonnage_mt", { precision: 12, scale: 2 }),
  utilizationPct: numeric("utilization_pct", { precision: 5, scale: 2 }),
  fuelEfficiencyScore: numeric("fuel_efficiency_score", { precision: 5, scale: 2 }),
  maintenanceStatus: text("maintenance_status", { enum: MAINTENANCE_STATUSES }).notNull().default("ok"),
  readinessScore: numeric("readiness_score", { precision: 5, scale: 2 }),
  operationalStatus: text("operational_status", { enum: ["active", "in_port", "at_sea", "anchored", "maintenance", "decommissioned"] }).notNull().default("active"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("szl_vessels_org_idx").on(t.orgId),
  index("szl_vessels_status_idx").on(t.operationalStatus),
]);

// ─── PORTS ─────────────────────────────────────────────────────────────────────

export const szlPortsTable = pgTable("szl_ports", {
  id: serial("id").primaryKey(),
  unlocode: text("unlocode").unique(),
  name: text("name").notNull(),
  country: text("country"),
  region: text("region"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  portType: text("port_type", { enum: ["commercial", "naval", "fishing", "ferry", "inland"] }).notNull().default("commercial"),
  riskLevel: text("risk_level", { enum: SEVERITY_LEVELS }).notNull().default("low"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── ROUTES ────────────────────────────────────────────────────────────────────

export const szlRoutesTable = pgTable("szl_routes", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  originPortId: integer("origin_port_id").references(() => szlPortsTable.id, { onDelete: "set null" }),
  destinationPortId: integer("destination_port_id").references(() => szlPortsTable.id, { onDelete: "set null" }),
  distanceNm: numeric("distance_nm", { precision: 10, scale: 2 }),
  avgTransitDays: numeric("avg_transit_days", { precision: 6, scale: 2 }),
  riskLevel: text("risk_level", { enum: SEVERITY_LEVELS }).notNull().default("low"),
  waypoints: jsonb("waypoints"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("szl_routes_org_idx").on(t.orgId),
]);

// ─── VOYAGES ───────────────────────────────────────────────────────────────────

export const szlVoyagesTable = pgTable("szl_voyages", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  vesselId: integer("vessel_id").references(() => szlVesselsTable.id, { onDelete: "cascade" }),
  routeId: integer("route_id").references(() => szlRoutesTable.id, { onDelete: "set null" }),
  voyageNumber: text("voyage_number"),
  status: text("status", { enum: ["planned", "active", "completed", "canceled", "delayed"] }).notNull().default("planned"),
  departedAt: timestamp("departed_at"),
  estimatedArrivalAt: timestamp("estimated_arrival_at"),
  actualArrivalAt: timestamp("actual_arrival_at"),
  revenueEstimateCents: integer("revenue_estimate_cents"),
  costEstimateCents: integer("cost_estimate_cents"),
  marginEstimateCents: integer("margin_estimate_cents"),
  delayEstimateHours: numeric("delay_estimate_hours", { precision: 6, scale: 2 }),
  cargoDescription: text("cargo_description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("szl_voyages_org_idx").on(t.orgId),
  index("szl_voyages_vessel_idx").on(t.vesselId),
  index("szl_voyages_status_idx").on(t.status),
  index("szl_voyages_created_at_idx").on(t.createdAt),
]);

// ─── EXCEPTIONS ────────────────────────────────────────────────────────────────

export const szlExceptionsTable = pgTable("szl_exceptions", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  entityType: text("entity_type", { enum: ["signal", "voyage", "vessel", "workflow_run", "action"] }).notNull(),
  entityId: integer("entity_id"),
  severity: text("severity", { enum: SEVERITY_LEVELS }).notNull().default("medium"),
  title: text("title").notNull(),
  whyItMatters: text("why_it_matters"),
  estimatedImpactCents: integer("estimated_impact_cents"),
  status: text("status", { enum: ["open", "acknowledged", "resolved", "dismissed"] }).notNull().default("open"),
  resolvedAt: timestamp("resolved_at"),
  metadata: jsonb("metadata"),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("szl_exceptions_org_idx").on(t.orgId),
  index("szl_exceptions_status_idx").on(t.status),
  index("szl_exceptions_severity_idx").on(t.severity),
  index("szl_exceptions_detected_at_idx").on(t.detectedAt),
  index("szl_exceptions_created_at_idx").on(t.createdAt),
]);

// ─── READINESS ITEMS ───────────────────────────────────────────────────────────

export const szlReadinessItemsTable = pgTable("szl_readiness_items", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  productSlug: text("product_slug"),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category", { enum: ["operational", "security", "compliance", "financial", "technical", "strategic", "people", "process"] }).notNull(),
  status: text("status", { enum: READINESS_SCORES_ENUM }).notNull().default("not_started"),
  ownerId: integer("owner_id").references(() => usersTable.id, { onDelete: "set null" }),
  dependencyJson: jsonb("dependency_json"),
  blockerSummary: text("blocker_summary"),
  readinessScore: numeric("readiness_score", { precision: 5, scale: 2 }),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("szl_readiness_items_org_idx").on(t.orgId),
  index("szl_readiness_items_owner_idx").on(t.ownerId),
  index("szl_readiness_items_status_idx").on(t.status),
  index("szl_readiness_items_created_at_idx").on(t.createdAt),
]);

// ─── INSERT SCHEMAS ────────────────────────────────────────────────────────────

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;

export const insertSzlSignalSchema = createInsertSchema(szlSignalsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSzlSignal = z.infer<typeof insertSzlSignalSchema>;
export type SzlSignal = typeof szlSignalsTable.$inferSelect;

export const insertSzlActionSchema = createInsertSchema(szlActionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSzlAction = z.infer<typeof insertSzlActionSchema>;
export type SzlAction = typeof szlActionsTable.$inferSelect;

export const insertSzlWorkflowSchema = createInsertSchema(szlWorkflowsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSzlWorkflow = z.infer<typeof insertSzlWorkflowSchema>;
export type SzlWorkflow = typeof szlWorkflowsTable.$inferSelect;

export const insertSzlWorkflowRunSchema = createInsertSchema(szlWorkflowRunsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSzlWorkflowRun = z.infer<typeof insertSzlWorkflowRunSchema>;
export type SzlWorkflowRun = typeof szlWorkflowRunsTable.$inferSelect;

export const insertSzlApprovalSchema = createInsertSchema(szlApprovalsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSzlApproval = z.infer<typeof insertSzlApprovalSchema>;
export type SzlApproval = typeof szlApprovalsTable.$inferSelect;

export const insertSzlArtifactSchema = createInsertSchema(szlArtifactsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSzlArtifact = z.infer<typeof insertSzlArtifactSchema>;
export type SzlArtifact = typeof szlArtifactsTable.$inferSelect;

export const insertSzlCommentSchema = createInsertSchema(szlCommentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSzlComment = z.infer<typeof insertSzlCommentSchema>;
export type SzlComment = typeof szlCommentsTable.$inferSelect;

export const insertSzlEventLogSchema = createInsertSchema(szlEventLogTable).omit({ id: true, occurredAt: true });
export type InsertSzlEventLog = z.infer<typeof insertSzlEventLogSchema>;
export type SzlEventLog = typeof szlEventLogTable.$inferSelect;

export const insertSzlFeatureFlagSchema = createInsertSchema(szlFeatureFlagsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSzlFeatureFlag = z.infer<typeof insertSzlFeatureFlagSchema>;
export type SzlFeatureFlag = typeof szlFeatureFlagsTable.$inferSelect;

export const insertSzlVesselSchema = createInsertSchema(szlVesselsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSzlVessel = z.infer<typeof insertSzlVesselSchema>;
export type SzlVessel = typeof szlVesselsTable.$inferSelect;

export const insertSzlPortSchema = createInsertSchema(szlPortsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSzlPort = z.infer<typeof insertSzlPortSchema>;
export type SzlPort = typeof szlPortsTable.$inferSelect;

export const insertSzlRouteSchema = createInsertSchema(szlRoutesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSzlRoute = z.infer<typeof insertSzlRouteSchema>;
export type SzlRoute = typeof szlRoutesTable.$inferSelect;

export const insertSzlVoyageSchema = createInsertSchema(szlVoyagesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSzlVoyage = z.infer<typeof insertSzlVoyageSchema>;
export type SzlVoyage = typeof szlVoyagesTable.$inferSelect;

export const insertSzlExceptionSchema = createInsertSchema(szlExceptionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSzlException = z.infer<typeof insertSzlExceptionSchema>;
export type SzlException = typeof szlExceptionsTable.$inferSelect;

export const insertSzlReadinessItemSchema = createInsertSchema(szlReadinessItemsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSzlReadinessItem = z.infer<typeof insertSzlReadinessItemSchema>;
export type SzlReadinessItem = typeof szlReadinessItemsTable.$inferSelect;
