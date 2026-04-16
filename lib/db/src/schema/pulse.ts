import { pgTable, text, serial, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";

export const pulseBriefingsTable = pgTable("pulse_briefings", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  edition: text("edition").notNull(),
  classification: text("classification").notNull(),
  status: text("status", { enum: ["published", "draft", "archived"] }).notNull().default("published"),
  overallRisk: text("overall_risk").notNull(),
  overallConfidence: numeric("overall_confidence").notNull(),
  headline: text("headline").notNull(),
  leadSentence: text("lead_sentence").notNull(),
  domains: jsonb("domains").notNull().$type<string[]>(),
  sections: jsonb("sections").notNull().$type<unknown[]>(),
  recommendedActions: jsonb("recommended_actions").notNull().$type<unknown[]>(),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pulseDissentsTable = pgTable("pulse_dissents", {
  id: serial("id").primaryKey(),
  dissentId: text("dissent_id").notNull().unique(),
  briefingId: text("briefing_id").notNull(),
  sectionId: text("section_id").notNull(),
  sectionTitle: text("section_title").notNull(),
  dissentingView: text("dissenting_view").notNull(),
  basis: text("basis").notNull(),
  impactIfCorrect: text("impact_if_correct").notNull().default(""),
  filedBy: text("filed_by").notNull(),
  filedAt: timestamp("filed_at").notNull().defaultNow(),
  status: text("status", { enum: ["open", "under_review", "acknowledged", "resolved"] }).notNull().default("open"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pulseCustomBriefsTable = pgTable("pulse_custom_briefs", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().unique(),
  topic: text("topic").notNull(),
  entity: text("entity"),
  scenario: text("scenario"),
  domains: jsonb("domains").$type<string[]>(),
  agents: jsonb("agents").$type<string[]>(),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  status: text("status", { enum: ["pending", "generating", "complete", "failed"] }).notNull().default("pending"),
  briefingId: text("briefing_id"),
});
