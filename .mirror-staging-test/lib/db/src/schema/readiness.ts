import { pgTable, text, serial, timestamp, integer, numeric, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const readinessProgramsTable = pgTable("readiness_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  overallScore: numeric("overall_score", { precision: 5, scale: 2 }),
  targetScore: numeric("target_score", { precision: 5, scale: 2 }).default("85"),
  status: text("status", { enum: ["active", "paused", "completed", "archived"] }).notNull().default("active"),
  owner: text("owner"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const readinessDimensionsTable = pgTable("readiness_dimensions", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => readinessProgramsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category", { enum: ["operational", "security", "compliance", "financial", "technical", "strategic", "people", "process"] }).notNull(),
  weight: numeric("weight", { precision: 5, scale: 2 }).default("1"),
  currentScore: numeric("current_score", { precision: 5, scale: 2 }),
  targetScore: numeric("target_score", { precision: 5, scale: 2 }).default("85"),
  maxScore: numeric("max_score", { precision: 5, scale: 2 }).default("100"),
  assessorName: text("assessor_name"),
  lastAssessedAt: timestamp("last_assessed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const readinessScoreHistoryTable = pgTable("readiness_score_history", {
  id: serial("id").primaryKey(),
  dimensionId: integer("dimension_id").notNull().references(() => readinessDimensionsTable.id, { onDelete: "cascade" }),
  programId: integer("program_id").notNull().references(() => readinessProgramsTable.id, { onDelete: "cascade" }),
  score: numeric("score", { precision: 5, scale: 2 }).notNull(),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const readinessMilestonesTable = pgTable("readiness_milestones", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => readinessProgramsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["pending", "in_progress", "completed", "overdue", "canceled"] }).notNull().default("pending"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  owner: text("owner"),
  dependencies: jsonb("dependencies"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const readinessRisksTable = pgTable("readiness_risks", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => readinessProgramsTable.id, { onDelete: "cascade" }),
  dimensionId: integer("dimension_id").references(() => readinessDimensionsTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity", { enum: ["critical", "high", "medium", "low"] }).notNull(),
  likelihood: text("likelihood", { enum: ["very_likely", "likely", "possible", "unlikely"] }).notNull().default("possible"),
  status: text("status", { enum: ["open", "mitigating", "resolved", "accepted"] }).notNull().default("open"),
  mitigation: text("mitigation"),
  owner: text("owner"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const readinessAlertsTable = pgTable("readiness_alerts", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => readinessProgramsTable.id, { onDelete: "cascade" }),
  dimensionId: integer("dimension_id").references(() => readinessDimensionsTable.id, { onDelete: "set null" }),
  type: text("type", { enum: ["score_drop", "milestone_overdue", "risk_escalation", "target_missed", "improvement", "general"] }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity", { enum: ["critical", "warning", "info"] }).notNull().default("info"),
  isRead: boolean("is_read").notNull().default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReadinessProgramSchema = createInsertSchema(readinessProgramsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReadinessProgram = z.infer<typeof insertReadinessProgramSchema>;
export type ReadinessProgram = typeof readinessProgramsTable.$inferSelect;

export const insertReadinessDimensionSchema = createInsertSchema(readinessDimensionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReadinessDimension = z.infer<typeof insertReadinessDimensionSchema>;
export type ReadinessDimension = typeof readinessDimensionsTable.$inferSelect;

export const insertReadinessScoreHistorySchema = createInsertSchema(readinessScoreHistoryTable).omit({ id: true, createdAt: true });
export type InsertReadinessScoreHistory = z.infer<typeof insertReadinessScoreHistorySchema>;
export type ReadinessScoreHistory = typeof readinessScoreHistoryTable.$inferSelect;

export const insertReadinessMilestoneSchema = createInsertSchema(readinessMilestonesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReadinessMilestone = z.infer<typeof insertReadinessMilestoneSchema>;
export type ReadinessMilestone = typeof readinessMilestonesTable.$inferSelect;

export const insertReadinessRiskSchema = createInsertSchema(readinessRisksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReadinessRisk = z.infer<typeof insertReadinessRiskSchema>;
export type ReadinessRisk = typeof readinessRisksTable.$inferSelect;

export const insertReadinessAlertSchema = createInsertSchema(readinessAlertsTable).omit({ id: true, createdAt: true });
export type InsertReadinessAlert = z.infer<typeof insertReadinessAlertSchema>;
export type ReadinessAlert = typeof readinessAlertsTable.$inferSelect;
