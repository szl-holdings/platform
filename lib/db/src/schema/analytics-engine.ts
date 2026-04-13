import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  boolean,
  jsonb,
  real,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { dosSessionsTable } from "./email-marketing";

export const sessionRecordingsTable = pgTable("session_recordings", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => dosSessionsTable.sessionId, { onDelete: "cascade" }),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  durationMs: integer("duration_ms"),
  pageCount: integer("page_count").notNull().default(0),
  chunkCount: integer("chunk_count").notNull().default(0),
  totalSizeBytes: integer("total_size_bytes").notNull().default(0),
  deviceType: text("device_type"),
  userAgent: text("user_agent"),
  country: text("country"),
  entryPage: text("entry_page"),
  didConvert: boolean("did_convert").notNull().default(false),
  conversionEvent: text("conversion_event"),
  sampled: boolean("sampled").notNull().default(true),
  status: text("status", { enum: ["recording", "complete", "truncated"] }).notNull().default("recording"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("session_recordings_session_id_idx").on(table.sessionId),
  index("session_recordings_started_at_idx").on(table.startedAt),
  index("session_recordings_did_convert_idx").on(table.didConvert),
]);

export const sessionRecordingChunksTable = pgTable("session_recording_chunks", {
  id: serial("id").primaryKey(),
  recordingId: integer("recording_id").notNull().references(() => sessionRecordingsTable.id, { onDelete: "cascade" }),
  sequence: integer("sequence").notNull(),
  events: jsonb("events").$type<unknown[]>().notNull().default([]),
  sizeBytes: integer("size_bytes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("session_recording_chunks_recording_id_idx").on(table.recordingId),
  index("session_recording_chunks_sequence_idx").on(table.sequence),
]);

export const heatmapEventsTable = pgTable("heatmap_events", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id"),
  pagePath: text("page_path").notNull(),
  eventType: text("event_type", { enum: ["click", "move", "scroll"] }).notNull(),
  x: real("x"),
  y: real("y"),
  xPct: real("x_pct"),
  yPct: real("y_pct"),
  scrollDepthPct: real("scroll_depth_pct"),
  elementTag: text("element_tag"),
  elementClass: text("element_class"),
  elementText: text("element_text"),
  viewportWidth: integer("viewport_width"),
  viewportHeight: integer("viewport_height"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("heatmap_events_page_path_idx").on(table.pagePath),
  index("heatmap_events_event_type_idx").on(table.eventType),
  index("heatmap_events_created_at_idx").on(table.createdAt),
]);

export const experimentsTable = pgTable("experiments", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  hypothesis: text("hypothesis"),
  description: text("description"),
  status: text("status", { enum: ["draft", "running", "paused", "completed", "archived"] }).notNull().default("draft"),
  primaryMetricEvent: text("primary_metric_event").notNull(),
  metricType: text("metric_type", { enum: ["conversion", "continuous"] }).notNull().default("conversion"),
  mutualExclusionGroup: text("mutual_exclusion_group"),
  flagId: integer("flag_id"),
  trafficAllocation: real("traffic_allocation").notNull().default(100),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  winnerVariantId: integer("winner_variant_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("experiments_key_idx").on(table.key),
  index("experiments_status_idx").on(table.status),
]);

export const experimentVariantsTable = pgTable("experiment_variants", {
  id: serial("id").primaryKey(),
  experimentId: integer("experiment_id").notNull().references(() => experimentsTable.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  weight: real("weight").notNull().default(50),
  isControl: boolean("is_control").notNull().default(false),
  sampleSize: integer("sample_size").notNull().default(0),
  conversions: integer("conversions").notNull().default(0),
  totalValue: real("total_value").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("experiment_variants_experiment_id_idx").on(table.experimentId),
]);

export const experimentAssignmentsTable = pgTable("experiment_assignments", {
  id: serial("id").primaryKey(),
  experimentId: integer("experiment_id").notNull().references(() => experimentsTable.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").notNull().references(() => experimentVariantsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
}, (table) => [
  index("experiment_assignments_experiment_user_idx").on(table.experimentId, table.userId),
]);

export const consentAuditLogTable = pgTable("consent_audit_log", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id"),
  anonymousId: text("anonymous_id"),
  consentVersion: text("consent_version").notNull().default("1.0"),
  essential: boolean("essential").notNull().default(true),
  analytics: boolean("analytics").notNull().default(false),
  marketing: boolean("marketing").notNull().default(false),
  functional: boolean("functional").notNull().default(false),
  action: text("action", { enum: ["granted", "declined", "updated", "withdrawn"] }).notNull(),
  ipCountry: text("ip_country"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("consent_audit_log_session_id_idx").on(table.sessionId),
  index("consent_audit_log_created_at_idx").on(table.createdAt),
]);

export type SessionRecording = typeof sessionRecordingsTable.$inferSelect;
export type NewSessionRecording = typeof sessionRecordingsTable.$inferInsert;
export type SessionRecordingChunk = typeof sessionRecordingChunksTable.$inferSelect;
export type HeatmapEvent = typeof heatmapEventsTable.$inferSelect;
export type Experiment = typeof experimentsTable.$inferSelect;
export type ExperimentVariant = typeof experimentVariantsTable.$inferSelect;
export type ExperimentAssignment = typeof experimentAssignmentsTable.$inferSelect;
export type ConsentAuditLog = typeof consentAuditLogTable.$inferSelect;
