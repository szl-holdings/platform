import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const intelligenceCacheTable = pgTable("intelligence_cache", {
  key: text("key").primaryKey(),
  data: jsonb("data").notNull(),
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export type IntelligenceCache = typeof intelligenceCacheTable.$inferSelect;
