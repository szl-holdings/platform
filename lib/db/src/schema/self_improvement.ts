import { pgTable, serial, text, integer, real, boolean, jsonb, timestamp, index } from "drizzle-orm/pg-core";

export const agentPerformanceSnapshots = pgTable(
  "agent_performance_snapshots",
  {
    id: serial("id").primaryKey(),
    agentId: text("agent_id").notNull(),
    period: text("period").notNull(),
    totalDecisions: integer("total_decisions").notNull().default(0),
    acceptedDecisions: integer("accepted_decisions").notNull().default(0),
    rejectedDecisions: integer("rejected_decisions").notNull().default(0),
    overriddenDecisions: integer("overridden_decisions").notNull().default(0),
    avgConfidence: real("avg_confidence").notNull().default(0.5),
    calibrationBias: real("calibration_bias").notNull().default(0),
    accuracyScore: real("accuracy_score").notNull().default(0.5),
    confidenceTrend: text("confidence_trend").notNull().default("stable"),
    flaggedForReview: boolean("flagged_for_review").notNull().default(false),
    reviewReason: text("review_reason"),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("agent_perf_snapshots_agent_idx").on(t.agentId)],
);

export const agentSelfReflections = pgTable(
  "agent_self_reflections",
  {
    id: serial("id").primaryKey(),
    agentId: text("agent_id").notNull(),
    reflectionPeriod: text("reflection_period").notNull(),
    keyObservations: jsonb("key_observations").notNull().default([]),
    adjustmentRecommendations: jsonb("adjustment_recommendations").notNull().default([]),
    confidenceAdjustment: real("confidence_adjustment").notNull().default(0),
    shouldRequestHumanReview: boolean("should_request_human_review").notNull().default(false),
    humanReviewReason: text("human_review_reason"),
    performanceScore: real("performance_score").notNull().default(0.5),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("agent_self_reflections_agent_idx").on(t.agentId)],
);
