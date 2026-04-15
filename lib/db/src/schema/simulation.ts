import { pgTable, text, serial, timestamp, integer, numeric, jsonb, boolean, real, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const simulationSessionsTable = pgTable("simulation_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  domain: text("domain").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status", { enum: ["pending", "running", "completed", "failed", "aborted"] }).notNull().default("pending"),
  parameters: jsonb("parameters").notNull().default({}),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("sim_sessions_domain_idx").on(t.domain),
  index("sim_sessions_status_idx").on(t.status),
  index("sim_sessions_created_idx").on(t.createdAt),
]);

export const simulationSnapshotsTable = pgTable("simulation_snapshots", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => simulationSessionsTable.sessionId, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  sequenceNumber: integer("sequence_number").notNull().default(0),
  state: jsonb("state").notNull().default({}),
  metadata: jsonb("metadata").default({}),
  snapshottedAt: timestamp("snapshotted_at").notNull().defaultNow(),
}, (t) => [
  index("sim_snapshots_session_idx").on(t.sessionId),
  index("sim_snapshots_domain_idx").on(t.domain),
]);

export const simulationResultsTable = pgTable("simulation_results", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => simulationSessionsTable.sessionId, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  resultType: text("result_type").notNull().default("final"),
  metrics: jsonb("metrics").notNull().default({}),
  summary: text("summary"),
  riskScore: numeric("risk_score", { precision: 5, scale: 2 }),
  confidence: real("confidence"),
  computedAt: timestamp("computed_at").notNull().defaultNow(),
}, (t) => [
  index("sim_results_session_idx").on(t.sessionId),
  index("sim_results_domain_idx").on(t.domain),
  index("sim_results_computed_idx").on(t.computedAt),
]);

export const simulationReplayStateTable = pgTable("simulation_replay_state", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => simulationSessionsTable.sessionId, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  replayCursor: integer("replay_cursor").notNull().default(0),
  totalFrames: integer("total_frames").notNull().default(0),
  playbackSpeed: real("playback_speed").notNull().default(1.0),
  isPaused: boolean("is_paused").notNull().default(false),
  loopEnabled: boolean("loop_enabled").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("sim_replay_session_uniq").on(t.sessionId),
  index("sim_replay_domain_idx").on(t.domain),
]);

export const insertSimulationSessionSchema = createInsertSchema(simulationSessionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSimulationSession = z.infer<typeof insertSimulationSessionSchema>;
export type SimulationSession = typeof simulationSessionsTable.$inferSelect;

export const insertSimulationSnapshotSchema = createInsertSchema(simulationSnapshotsTable).omit({ id: true });
export type InsertSimulationSnapshot = z.infer<typeof insertSimulationSnapshotSchema>;
export type SimulationSnapshot = typeof simulationSnapshotsTable.$inferSelect;

export const insertSimulationResultSchema = createInsertSchema(simulationResultsTable).omit({ id: true });
export type InsertSimulationResult = z.infer<typeof insertSimulationResultSchema>;
export type SimulationResult = typeof simulationResultsTable.$inferSelect;

export const insertSimulationReplayStateSchema = createInsertSchema(simulationReplayStateTable).omit({ id: true });
export type InsertSimulationReplayState = z.infer<typeof insertSimulationReplayStateSchema>;
export type SimulationReplayState = typeof simulationReplayStateTable.$inferSelect;
