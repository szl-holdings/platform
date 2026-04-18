import { pgTable, text, serial, timestamp, integer, boolean, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const selfHealingPatternsTable = pgTable("self_healing_patterns", {
  id: serial("id").primaryKey(),
  patternKey: text("pattern_key").notNull(),
  name: text("name").notNull(),
  type: text("type", { enum: ["restart", "scale", "failover", "clear_queue", "rollback"] }).notNull(),
  trigger: text("trigger").notNull(),
  runbook: text("runbook").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("self_healing_patterns_key_idx").on(table.patternKey),
  index("self_healing_patterns_enabled_idx").on(table.enabled),
]);

export const selfHealingRunsTable = pgTable("self_healing_runs", {
  id: serial("id").primaryKey(),
  runKey: text("run_key").notNull(),
  patternKey: text("pattern_key").notNull(),
  triggerSignal: text("trigger_signal").notNull(),
  service: text("service").notNull(),
  detectedAt: timestamp("detected_at").notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  status: text("status", { enum: ["executing", "pending_approval", "completed", "failed", "queued"] }).notNull(),
  steps: jsonb("steps").notNull().default([]),
  mttrSavedMins: integer("mttr_saved_mins").notNull().default(0),
  approver: text("approver"),
  auditRef: text("audit_ref").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("self_healing_runs_key_idx").on(table.runKey),
  index("self_healing_runs_pattern_idx").on(table.patternKey),
  index("self_healing_runs_status_idx").on(table.status),
  index("self_healing_runs_detected_idx").on(table.detectedAt),
]);

export const insertSelfHealingPatternSchema = createInsertSchema(selfHealingPatternsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSelfHealingRunSchema = createInsertSchema(selfHealingRunsTable).omit({ id: true, createdAt: true });
export type InsertSelfHealingPattern = z.infer<typeof insertSelfHealingPatternSchema>;
export type InsertSelfHealingRun = z.infer<typeof insertSelfHealingRunSchema>;
export type SelfHealingPattern = typeof selfHealingPatternsTable.$inferSelect;
export type SelfHealingRun = typeof selfHealingRunsTable.$inferSelect;
