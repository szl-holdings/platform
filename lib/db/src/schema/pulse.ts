import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  serial,
  index,
} from "drizzle-orm/pg-core";

export const pulseBriefs = pgTable("pulse_briefs", {
  id: serial("id").primaryKey(),
  briefId: text("brief_id").notNull().unique(),
  date: text("date").notNull(),
  classification: text("classification").notNull().default("OPERATOR SENSITIVE // NURO MESH"),
  headline: text("headline").notNull(),
  executiveSummary: text("executive_summary").notNull(),
  riskLevel: text("risk_level", { enum: ["critical", "high", "medium", "low"] }).notNull().default("medium"),
  overallConfidence: integer("overall_confidence").notNull().default(0),
  sections: jsonb("sections").notNull().default([]),
  recommendedActions: jsonb("recommended_actions").notNull().default([]),
  tags: jsonb("tags").notNull().default([]),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  generationDurationMs: integer("generation_duration_ms").notNull().default(0),
  agentsContributed: jsonb("agents_contributed").notNull().default([]),
  status: text("status", { enum: ["generating", "complete", "archived"] }).notNull().default("complete"),
  briefType: text("brief_type", { enum: ["daily", "custom"] }).notNull().default("daily"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("pulse_briefs_date_idx").on(t.date),
  index("pulse_briefs_risk_level_idx").on(t.riskLevel),
  index("pulse_briefs_brief_type_idx").on(t.briefType),
]);

export const pulseDissents = pgTable("pulse_dissents", {
  id: serial("id").primaryKey(),
  dissentId: text("dissent_id").notNull().unique(),
  briefId: text("brief_id").notNull(),
  sectionId: text("section_id"),
  claim: text("claim").notNull(),
  dissentingView: text("dissenting_view").notNull(),
  basis: text("basis").notNull(),
  submittedBy: text("submitted_by").notNull().default("Analyst"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  status: text("status", { enum: ["open", "under_review", "resolved", "withdrawn"] }).notNull().default("open"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  impactOnConfidence: integer("impact_on_confidence").notNull().default(-10),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("pulse_dissents_brief_id_idx").on(t.briefId),
  index("pulse_dissents_status_idx").on(t.status),
]);

export const pulseCustomRequests = pgTable("pulse_custom_requests", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().unique(),
  topic: text("topic").notNull(),
  entities: jsonb("entities").notNull().default([]),
  domains: jsonb("domains").notNull().default([]),
  agents: jsonb("agents").notNull().default([]),
  requestedBy: text("requested_by").notNull().default("Operator"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  status: text("status", { enum: ["queued", "generating", "complete", "failed"] }).notNull().default("queued"),
  briefId: text("brief_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("pulse_custom_requests_status_idx").on(t.status),
]);

export const pulseSettings = pgTable("pulse_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: jsonb("setting_value").notNull().default({}),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PulseBrief = typeof pulseBriefs.$inferSelect;
export type InsertPulseBrief = typeof pulseBriefs.$inferInsert;
export type PulseDissent = typeof pulseDissents.$inferSelect;
export type InsertPulseDissent = typeof pulseDissents.$inferInsert;
export type PulseCustomRequest = typeof pulseCustomRequests.$inferSelect;
export type InsertPulseCustomRequest = typeof pulseCustomRequests.$inferInsert;
