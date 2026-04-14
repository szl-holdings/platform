import { pgTable, text, serial, timestamp, integer, real, jsonb, bigint } from "drizzle-orm/pg-core";

export const consciousnessSnapshotsTable = pgTable("consciousness_snapshots", {
  id: serial("id").primaryKey(),
  orchestrationId: text("orchestration_id").notNull(),
  metacognition: jsonb("metacognition").notNull(),
  selfModel: jsonb("self_model").notNull(),
  emotions: jsonb("emotions").notNull(),
  goals: jsonb("goals").notNull(),
  temporal: jsonb("temporal").notNull(),
  avgConfidence: real("avg_confidence").notNull(),
  confusionStreak: integer("confusion_streak").notNull().default(0),
  overallHealth: text("overall_health").notNull().default("good"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const consciousnessMonologueTable = pgTable("consciousness_monologue", {
  id: serial("id").primaryKey(),
  entryId: text("entry_id").notNull().unique(),
  type: text("type").notNull(),
  thought: text("thought").notNull(),
  triggeringEvent: text("triggering_event").notNull(),
  emotionalTone: text("emotional_tone").notNull(),
  confidence: real("confidence").notNull(),
  relatedAgents: text("related_agents").array().notNull().default([]),
  relatedDomains: text("related_domains").array().notNull().default([]),
  actionable: integer("actionable").notNull().default(0),
  suggestedAction: text("suggested_action"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const consciousnessGoalsTable = pgTable("consciousness_goals", {
  id: serial("id").primaryKey(),
  goalId: text("goal_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull().default("medium"),
  progress: real("progress").notNull().default(0),
  status: text("status").notNull().default("active"),
  source: text("source").notNull().default("orchestration"),
  relatedDomains: text("related_domains").array().notNull().default([]),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const consciousnessAgentProfilesTable = pgTable("consciousness_agent_profiles", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull().unique(),
  domain: text("domain").notNull(),
  successRate: real("success_rate").notNull().default(0.5),
  avgConfidence: real("avg_confidence").notNull().default(50),
  totalInvocations: integer("total_invocations").notNull().default(0),
  recentTrend: text("recent_trend").notNull().default("stable"),
  strengths: text("strengths").array().notNull().default([]),
  weaknesses: text("weaknesses").array().notNull().default([]),
  snapshotData: jsonb("snapshot_data"),
  capturedAt: timestamp("captured_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const consciousnessEmotionalHistoryTable = pgTable("consciousness_emotional_history", {
  id: serial("id").primaryKey(),
  orchestrationId: text("orchestration_id").notNull(),
  dominantEmotion: text("dominant_emotion").notNull(),
  positiveValence: real("positive_valence").notNull(),
  negativeValence: real("negative_valence").notNull(),
  arousal: real("arousal").notNull(),
  stability: real("stability").notNull(),
  moodTrajectory: text("mood_trajectory").notNull().default("stable"),
  triggeredValidation: integer("triggered_validation").notNull().default(0),
  capturedAt: timestamp("captured_at").notNull().defaultNow(),
});

export type ConsciousnessSnapshotRow = typeof consciousnessSnapshotsTable.$inferSelect;
export type ConsciousnessMonologueRow = typeof consciousnessMonologueTable.$inferSelect;
export type ConsciousnessGoalRow = typeof consciousnessGoalsTable.$inferSelect;
export type ConsciousnessAgentProfileRow = typeof consciousnessAgentProfilesTable.$inferSelect;
export type ConsciousnessEmotionalHistoryRow = typeof consciousnessEmotionalHistoryTable.$inferSelect;
