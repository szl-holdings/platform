import { pgTable, text, serial, timestamp, integer, numeric, boolean, jsonb, real, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const lyteWorkspacesTable = pgTable("lyte_workspaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: text("owner_id"),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const lyteSignalsTable = pgTable("lyte_signals", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => lyteWorkspacesTable.id, { onDelete: "cascade" }),
  source: text("source").notNull(),
  sourceType: text("source_type", { enum: ["connector", "webhook", "manual", "monitoring", "scheduler"] }).notNull(),
  severity: text("severity", { enum: ["critical", "high", "medium", "low", "info"] }).notNull().default("info"),
  title: text("title").notNull(),
  body: text("body"),
  status: text("status", { enum: ["new", "acknowledged", "resolved", "dismissed"] }).notNull().default("new"),
  metadata: jsonb("metadata"),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const lyteCommandCardsTable = pgTable("lyte_command_cards", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => lyteWorkspacesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category", { enum: ["operations", "finance", "growth", "risk", "compliance", "strategy"] }).notNull(),
  priority: text("priority", { enum: ["critical", "high", "medium", "low"] }).notNull().default("medium"),
  status: text("status", { enum: ["pending", "in_progress", "completed", "deferred"] }).notNull().default("pending"),
  assignee: text("assignee"),
  dueDate: timestamp("due_date"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const lyteIncidentsTable = pgTable("lyte_incidents", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => lyteWorkspacesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity", { enum: ["critical", "high", "medium", "low"] }).notNull(),
  status: text("status", { enum: ["open", "investigating", "mitigating", "resolved", "closed"] }).notNull().default("open"),
  assignee: text("assignee"),
  impactArea: text("impact_area"),
  rootCause: text("root_cause"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const lytePlaybooksTable = pgTable("lyte_playbooks", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => lyteWorkspacesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category", { enum: ["incident_response", "operations", "compliance", "onboarding", "escalation", "general"] }).notNull(),
  content: text("content").notNull(),
  version: integer("version").notNull().default(1),
  isPublished: boolean("is_published").notNull().default(false),
  tags: jsonb("tags"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const lyteRecommendationsTable = pgTable("lyte_recommendations", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => lyteWorkspacesTable.id, { onDelete: "cascade" }),
  signalId: integer("signal_id").references(() => lyteSignalsTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category", { enum: ["cost_optimization", "risk_mitigation", "growth", "compliance", "operational", "strategic"] }).notNull(),
  impact: text("impact", { enum: ["high", "medium", "low"] }).notNull().default("medium"),
  effort: text("effort", { enum: ["high", "medium", "low"] }).notNull().default("medium"),
  status: text("status", { enum: ["suggested", "accepted", "in_progress", "completed", "dismissed"] }).notNull().default("suggested"),
  actionItems: jsonb("action_items"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const lyteActionsTable = pgTable("lyte_actions", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => lyteWorkspacesTable.id, { onDelete: "cascade" }),
  signalId: integer("signal_id").references(() => lyteSignalsTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  signalCategory: text("signal_category", { enum: [
    "approval_latency", "ownership_gap", "forecast_drift", "stalled_workflow",
    "handoff_failure", "status_conflict", "readiness_blocker", "pipeline_hygiene"
  ] }).notNull(),
  state: text("state", { enum: ["new", "acknowledged", "assigned", "escalated", "resolved", "dismissed"] }).notNull().default("new"),
  priority: text("priority", { enum: ["urgent", "high", "medium", "low"] }).notNull().default("medium"),
  owner: text("owner"),
  assignedTo: text("assigned_to"),
  valueAtRisk: numeric("value_at_risk", { precision: 14, scale: 2 }),
  dueAt: timestamp("due_at"),
  resolvedAt: timestamp("resolved_at"),
  notes: text("notes"),
  stateHistory: jsonb("state_history"),
  roleVisibility: jsonb("role_visibility"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const lyteSavedViewsTable = pgTable("lyte_saved_views", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => lyteWorkspacesTable.id, { onDelete: "cascade" }),
  userId: text("user_id"),
  name: text("name").notNull(),
  description: text("description"),
  role: text("role", { enum: ["executive", "operations", "delivery"] }),
  filters: jsonb("filters").notNull().default({}),
  sortBy: text("sort_by"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const lyteReadinessItemsTable = pgTable("lyte_readiness_items", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => lyteWorkspacesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  itemType: text("item_type", { enum: ["launch_gate", "blocker", "dependency", "milestone", "owner_check"] }).notNull(),
  status: text("status", { enum: ["not_started", "in_progress", "blocked", "complete", "waived"] }).notNull().default("not_started"),
  owner: text("owner"),
  dueAt: timestamp("due_at"),
  readinessScore: integer("readiness_score"),
  blockedBy: jsonb("blocked_by"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLyteActionSchema = createInsertSchema(lyteActionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLyteAction = z.infer<typeof insertLyteActionSchema>;
export type LyteAction = typeof lyteActionsTable.$inferSelect;

export const insertLyteSavedViewSchema = createInsertSchema(lyteSavedViewsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLyteSavedView = z.infer<typeof insertLyteSavedViewSchema>;
export type LyteSavedView = typeof lyteSavedViewsTable.$inferSelect;

export const insertLyteReadinessItemSchema = createInsertSchema(lyteReadinessItemsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLyteReadinessItem = z.infer<typeof insertLyteReadinessItemSchema>;
export type LyteReadinessItem = typeof lyteReadinessItemsTable.$inferSelect;

export const insertLyteWorkspaceSchema = createInsertSchema(lyteWorkspacesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLyteWorkspace = z.infer<typeof insertLyteWorkspaceSchema>;
export type LyteWorkspace = typeof lyteWorkspacesTable.$inferSelect;

export const insertLyteSignalSchema = createInsertSchema(lyteSignalsTable).omit({ id: true, createdAt: true });
export type InsertLyteSignal = z.infer<typeof insertLyteSignalSchema>;
export type LyteSignal = typeof lyteSignalsTable.$inferSelect;

export const insertLyteCommandCardSchema = createInsertSchema(lyteCommandCardsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLyteCommandCard = z.infer<typeof insertLyteCommandCardSchema>;
export type LyteCommandCard = typeof lyteCommandCardsTable.$inferSelect;

export const insertLyteIncidentSchema = createInsertSchema(lyteIncidentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLyteIncident = z.infer<typeof insertLyteIncidentSchema>;
export type LyteIncident = typeof lyteIncidentsTable.$inferSelect;

export const insertLytePlaybookSchema = createInsertSchema(lytePlaybooksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLytePlaybook = z.infer<typeof insertLytePlaybookSchema>;
export type LytePlaybook = typeof lytePlaybooksTable.$inferSelect;

export const insertLyteRecommendationSchema = createInsertSchema(lyteRecommendationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLyteRecommendation = z.infer<typeof insertLyteRecommendationSchema>;
export type LyteRecommendation = typeof lyteRecommendationsTable.$inferSelect;

export const lytePrismScoresTable = pgTable("lyte_prism_scores", {
  id: serial("id").primaryKey(),
  lens: text("lens", { enum: ["financial_health", "operational_risk", "growth_velocity", "customer_sentiment", "compliance_drift", "talent_stability", "market_position"] }).notNull(),
  score: integer("score").notNull(),
  previousScore: integer("previous_score"),
  trend: text("trend", { enum: ["up", "down", "flat"] }).notNull().default("flat"),
  trendDelta: real("trend_delta"),
  topSignals: jsonb("top_signals"),
  summary: text("summary"),
  scoredAt: timestamp("scored_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("lyte_prism_scores_lens_idx").on(table.lens),
  index("lyte_prism_scores_scored_at_idx").on(table.scoredAt),
]);

export const lyteMetricsTable = pgTable("lyte_metrics", {
  id: serial("id").primaryKey(),
  service: text("service").notNull(),
  metricName: text("metric_name").notNull(),
  metricType: text("metric_type", { enum: ["latency", "error_rate", "throughput", "queue_depth", "cpu", "memory", "availability", "revenue", "churn_rate", "nps"] }).notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull().default("ms"),
  tags: jsonb("tags"),
  anomaly: boolean("anomaly").notNull().default(false),
  anomalyScore: real("anomaly_score"),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("lyte_metrics_service_idx").on(table.service),
  index("lyte_metrics_name_idx").on(table.metricName),
  index("lyte_metrics_recorded_at_idx").on(table.recordedAt),
]);

export const lyteAlertsTable = pgTable("lyte_alerts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  alertType: text("alert_type", { enum: ["threshold", "anomaly", "composite"] }).notNull().default("threshold"),
  service: text("service").notNull(),
  metricName: text("metric_name").notNull(),
  condition: text("condition", { enum: ["gt", "lt", "gte", "lte", "eq", "anomaly"] }).notNull(),
  threshold: real("threshold"),
  severity: text("severity", { enum: ["critical", "high", "medium", "low"] }).notNull().default("medium"),
  status: text("status", { enum: ["active", "firing", "resolved", "silenced", "draft"] }).notNull().default("active"),
  notificationChannels: jsonb("notification_channels"),
  firingCount: integer("firing_count").notNull().default(0),
  lastFiredAt: timestamp("last_fired_at"),
  lastResolvedAt: timestamp("last_resolved_at"),
  compositeQuery: jsonb("composite_query"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("lyte_alerts_service_idx").on(table.service),
  index("lyte_alerts_status_idx").on(table.status),
]);

export const lyteAlertEventsTable = pgTable("lyte_alert_events", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id").references(() => lyteAlertsTable.id, { onDelete: "cascade" }),
  eventType: text("event_type", { enum: ["fired", "resolved", "silenced", "acknowledged"] }).notNull(),
  triggerValue: real("trigger_value"),
  message: text("message"),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("lyte_alert_events_alert_idx").on(table.alertId),
  index("lyte_alert_events_occurred_at_idx").on(table.occurredAt),
]);

export const lyteEscalationsTable = pgTable("lyte_escalations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  signalId: integer("signal_id").references(() => lyteSignalsTable.id, { onDelete: "set null" }),
  alertId: integer("alert_id").references(() => lyteAlertsTable.id, { onDelete: "set null" }),
  severity: text("severity", { enum: ["critical", "high", "medium", "low"] }).notNull().default("high"),
  status: text("status", { enum: ["open", "in_progress", "escalated", "resolved", "closed"] }).notNull().default("open"),
  stage: integer("stage").notNull().default(1),
  maxStage: integer("max_stage").notNull().default(3),
  owner: text("owner"),
  assignedTo: text("assigned_to"),
  escalationPath: jsonb("escalation_path"),
  slaDeadlineAt: timestamp("sla_deadline_at"),
  resolvedAt: timestamp("resolved_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("lyte_escalations_status_idx").on(table.status),
  index("lyte_escalations_severity_idx").on(table.severity),
]);

export const insertLytePrismScoreSchema = createInsertSchema(lytePrismScoresTable).omit({ id: true, createdAt: true });
export type InsertLytePrismScore = z.infer<typeof insertLytePrismScoreSchema>;
export type LytePrismScore = typeof lytePrismScoresTable.$inferSelect;

export const insertLyteMetricSchema = createInsertSchema(lyteMetricsTable).omit({ id: true, createdAt: true });
export type InsertLyteMetric = z.infer<typeof insertLyteMetricSchema>;
export type LyteMetric = typeof lyteMetricsTable.$inferSelect;

export const insertLyteAlertSchema = createInsertSchema(lyteAlertsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLyteAlert = z.infer<typeof insertLyteAlertSchema>;
export type LyteAlert = typeof lyteAlertsTable.$inferSelect;

export const insertLyteAlertEventSchema = createInsertSchema(lyteAlertEventsTable).omit({ id: true, createdAt: true });
export type InsertLyteAlertEvent = z.infer<typeof insertLyteAlertEventSchema>;
export type LyteAlertEvent = typeof lyteAlertEventsTable.$inferSelect;

export const insertLyteEscalationSchema = createInsertSchema(lyteEscalationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLyteEscalation = z.infer<typeof insertLyteEscalationSchema>;
export type LyteEscalation = typeof lyteEscalationsTable.$inferSelect;
