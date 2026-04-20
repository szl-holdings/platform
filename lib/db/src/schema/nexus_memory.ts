import {
  pgTable,
  text,
  timestamp,
  numeric,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const NEXUS_MEMORY_TYPES = [
  "fact",
  "preference",
  "entity",
  "claim",
  "context",
] as const;

export const NEXUS_MEMORY_TIERS = [
  "working",
  "session",
  "episodic",
  "semantic",
] as const;

export type NexusMemoryType = (typeof NEXUS_MEMORY_TYPES)[number];
export type NexusMemoryTier = (typeof NEXUS_MEMORY_TIERS)[number];

/**
 * Dedicated NEXUS Memory Fabric store. Persists items created via the
 * /api/nexus/memory routes (and auto-written by the Research Swarm) so
 * memory accumulates across api-server restarts. The AI summarization
 * pipeline writes its summary into `source` and adds the "ai-summarized"
 * tag, both of which are preserved here.
 */
export const nexusMemoryTable = pgTable(
  "nexus_memory",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(),
    value: text("value").notNull(),
    type: text("type", { enum: NEXUS_MEMORY_TYPES }).notNull().default("fact"),
    tier: text("tier", { enum: NEXUS_MEMORY_TIERS })
      .notNull()
      .default("session"),
    pinned: boolean("pinned").notNull().default(false),
    confidence: numeric("confidence", { precision: 5, scale: 4 })
      .notNull()
      .default("0.8"),
    source: text("source"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("nexus_memory_key_idx").on(t.key),
    index("nexus_memory_type_idx").on(t.type),
    index("nexus_memory_tier_idx").on(t.tier),
    index("nexus_memory_pinned_idx").on(t.pinned),
    index("nexus_memory_updated_idx").on(t.updatedAt),
  ],
);

export const insertNexusMemorySchema = createInsertSchema(nexusMemoryTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertNexusMemory = z.infer<typeof insertNexusMemorySchema>;
export type NexusMemoryRow = typeof nexusMemoryTable.$inferSelect;
