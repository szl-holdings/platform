import { pgTable, text, serial, timestamp, integer, numeric, boolean, jsonb } from "drizzle-orm/pg-core";
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
