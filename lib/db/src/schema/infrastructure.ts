import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  jsonb,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobQueueTable = pgTable("job_queue", {
  id: serial("id").primaryKey(),
  jobId: text("job_id").notNull().unique(),
  type: text("type").notNull(),
  payload: jsonb("payload").notNull().default({}),
  status: text("status", { enum: ["pending", "running", "completed", "failed"] }).notNull().default("pending"),
  priority: integer("priority").notNull().default(0),
  retryCount: integer("retry_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),
  error: text("error"),
  scheduledAt: timestamp("scheduled_at").notNull().defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("job_queue_status_idx").on(t.status),
  index("job_queue_type_idx").on(t.type),
  index("job_queue_scheduled_idx").on(t.scheduledAt),
  index("job_queue_created_idx").on(t.createdAt),
]);

export const deadLetterJobsTable = pgTable("dead_letter_jobs", {
  id: serial("id").primaryKey(),
  jobId: text("job_id").notNull().unique(),
  type: text("type").notNull(),
  payload: jsonb("payload").notNull().default({}),
  errorHistory: jsonb("error_history").notNull().default([]),
  finalError: text("final_error"),
  retryCount: integer("retry_count").notNull().default(0),
  replayedAt: timestamp("replayed_at"),
  replayJobId: text("replay_job_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("dlq_type_idx").on(t.type),
  index("dlq_created_idx").on(t.createdAt),
]);

export const scheduledJobRunsTable = pgTable("scheduled_job_runs", {
  id: serial("id").primaryKey(),
  jobName: text("job_name").notNull().unique(),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  status: text("status", { enum: ["pending", "running", "completed", "failed"] }).notNull().default("pending"),
  lastError: text("last_error"),
  runCount: integer("run_count").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("sched_job_name_idx").on(t.jobName),
]);

export const webhookEndpointsTable = pgTable("webhook_endpoints", {
  id: serial("id").primaryKey(),
  endpointId: text("endpoint_id").notNull().unique(),
  orgId: integer("org_id"),
  url: text("url").notNull(),
  secret: text("secret").notNull(),
  eventTypes: jsonb("event_types").notNull().default("*"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  failureCount: integer("failure_count").notNull().default(0),
  lastDeliveredAt: timestamp("last_delivered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("webhook_endpoints_active_idx").on(t.isActive),
  index("webhook_endpoints_org_idx").on(t.orgId),
]);

export const webhookDeliveriesTable = pgTable("webhook_deliveries", {
  id: serial("id").primaryKey(),
  deliveryId: text("delivery_id").notNull().unique(),
  endpointId: text("endpoint_id").notNull(),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull().default({}),
  status: text("status", { enum: ["pending", "delivered", "failed"] }).notNull().default("pending"),
  statusCode: integer("status_code"),
  attempt: integer("attempt").notNull().default(1),
  error: text("error"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("webhook_deliveries_endpoint_idx").on(t.endpointId),
  index("webhook_deliveries_status_idx").on(t.status),
  index("webhook_deliveries_created_idx").on(t.createdAt),
]);

export const agentEventsTable = pgTable("agent_events", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  sourceAgent: text("source_agent").notNull(),
  sourceDomain: text("source_domain").notNull(),
  severity: text("severity", { enum: ["info", "low", "medium", "high", "critical"] }).notNull().default("info"),
  dataJson: jsonb("data_json").notNull().default({}),
  correlationId: text("correlation_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("agent_events_type_idx").on(t.eventType),
  index("agent_events_source_agent_idx").on(t.sourceAgent),
  index("agent_events_domain_idx").on(t.sourceDomain),
  index("agent_events_severity_idx").on(t.severity),
  index("agent_events_created_idx").on(t.createdAt),
  index("agent_events_correlation_idx").on(t.correlationId),
]);

export const insertJobQueueSchema = createInsertSchema(jobQueueTable).omit({ id: true, createdAt: true });
export type InsertJobQueue = z.infer<typeof insertJobQueueSchema>;
export type JobQueueRow = typeof jobQueueTable.$inferSelect;

export const insertDeadLetterJobSchema = createInsertSchema(deadLetterJobsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDeadLetterJob = z.infer<typeof insertDeadLetterJobSchema>;
export type DeadLetterJobRow = typeof deadLetterJobsTable.$inferSelect;

export const insertScheduledJobRunSchema = createInsertSchema(scheduledJobRunsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertScheduledJobRun = z.infer<typeof insertScheduledJobRunSchema>;
export type ScheduledJobRunRow = typeof scheduledJobRunsTable.$inferSelect;

export const insertWebhookEndpointSchema = createInsertSchema(webhookEndpointsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWebhookEndpoint = z.infer<typeof insertWebhookEndpointSchema>;
export type WebhookEndpointRow = typeof webhookEndpointsTable.$inferSelect;

export const insertWebhookDeliverySchema = createInsertSchema(webhookDeliveriesTable).omit({ id: true, createdAt: true });
export type InsertWebhookDelivery = z.infer<typeof insertWebhookDeliverySchema>;
export type WebhookDeliveryRow = typeof webhookDeliveriesTable.$inferSelect;

export const insertAgentEventSchema = createInsertSchema(agentEventsTable).omit({ id: true, createdAt: true });
export type InsertAgentEvent = z.infer<typeof insertAgentEventSchema>;
export type AgentEventRow = typeof agentEventsTable.$inferSelect;
