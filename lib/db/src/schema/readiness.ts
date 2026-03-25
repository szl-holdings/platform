import { pgTable, text, serial, timestamp, integer, numeric, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const readinessAssessmentsTable = pgTable("readiness_assessments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category", { enum: ["operational", "security", "compliance", "financial", "technical", "strategic"] }).notNull(),
  status: text("status", { enum: ["draft", "in_progress", "completed", "expired"] }).notNull().default("draft"),
  overallScore: numeric("overall_score", { precision: 5, scale: 2 }),
  maxScore: numeric("max_score", { precision: 5, scale: 2 }).default("100"),
  assessorName: text("assessor_name"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const readinessChecklistsTable = pgTable("readiness_checklists", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => readinessAssessmentsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  isCompleted: boolean("is_completed").notNull().default(false),
  priority: text("priority", { enum: ["critical", "high", "medium", "low"] }).notNull().default("medium"),
  evidence: text("evidence"),
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const readinessFindingsTable = pgTable("readiness_findings", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => readinessAssessmentsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity", { enum: ["critical", "high", "medium", "low", "info"] }).notNull(),
  status: text("status", { enum: ["open", "in_progress", "resolved", "accepted", "wont_fix"] }).notNull().default("open"),
  recommendation: text("recommendation"),
  metadata: jsonb("metadata"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReadinessAssessmentSchema = createInsertSchema(readinessAssessmentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReadinessAssessment = z.infer<typeof insertReadinessAssessmentSchema>;
export type ReadinessAssessment = typeof readinessAssessmentsTable.$inferSelect;

export const insertReadinessChecklistSchema = createInsertSchema(readinessChecklistsTable).omit({ id: true, createdAt: true });
export type InsertReadinessChecklist = z.infer<typeof insertReadinessChecklistSchema>;
export type ReadinessChecklist = typeof readinessChecklistsTable.$inferSelect;

export const insertReadinessFindingSchema = createInsertSchema(readinessFindingsTable).omit({ id: true, createdAt: true });
export type InsertReadinessFinding = z.infer<typeof insertReadinessFindingSchema>;
export type ReadinessFinding = typeof readinessFindingsTable.$inferSelect;
