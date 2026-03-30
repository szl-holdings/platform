import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  numeric,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const RECOMMENDATION_ENTITY_TYPES = [
  "distress_property",
  "lead",
  "deal",
  "vulnerability",
  "incident",
  "asset",
  "vessel",
  "signal",
  "workflow",
  "general",
] as const;

export type RecommendationEntityType = (typeof RECOMMENDATION_ENTITY_TYPES)[number];

export const recommendationsTable = pgTable(
  "recommendations",
  {
    id: serial("id").primaryKey(),
    entityType: text("entity_type", { enum: RECOMMENDATION_ENTITY_TYPES }).notNull(),
    entityId: text("entity_id"),
    domain: text("domain").notNull().default("general"),
    score: numeric("score", { precision: 5, scale: 2 }).notNull(),
    confidence: numeric("confidence", { precision: 5, scale: 4 }).notNull(),
    severity: text("severity", {
      enum: ["info", "low", "medium", "high", "critical"],
    })
      .notNull()
      .default("medium"),
    title: text("title").notNull(),
    reasoning: text("reasoning").notNull(),
    recommendedAction: text("recommended_action").notNull(),
    timeframe: text("timeframe"),
    context: jsonb("context"),
    model: text("model"),
    provider: text("provider"),
    latencyMs: integer("latency_ms"),
    telemetryId: text("telemetry_id"),
    generatedAt: timestamp("generated_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("recommendations_entity_type_idx").on(t.entityType),
    index("recommendations_entity_id_idx").on(t.entityId),
    index("recommendations_domain_idx").on(t.domain),
    index("recommendations_score_idx").on(t.score),
    index("recommendations_created_idx").on(t.createdAt),
  ],
);

export const insertRecommendationSchema = createInsertSchema(
  recommendationsTable,
).omit({ id: true, createdAt: true });
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Recommendation = typeof recommendationsTable.$inferSelect;
