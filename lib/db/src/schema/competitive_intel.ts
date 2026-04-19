/**
 * Competitive Intel — persistent store for the SZL Competitive Atlas monitor.
 *
 * Replaces the legacy single-instance JSON file at `.data/competitive-intel.json`
 * (see api-server/src/jobs/competitive-intel-monitor.ts). Moves the store onto
 * the shared Postgres so dismiss state, feed config, and feed health are
 * unified across api-server replicas and queryable from BI.
 *
 * Tables:
 *   - competitive_intel_feeds   — champion feed config + per-feed health (poll metadata)
 *   - competitive_intel_alerts  — dedup'd Intel Update alerts (seed + RSS)
 *   - competitive_intel_state   — singleton row (id=1) for global poll state
 */

import { pgTable, text, boolean, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";

export const competitiveIntelFeedsTable = pgTable(
  "competitive_intel_feeds",
  {
    id: text("id").primaryKey(),
    laneId: text("lane_id").notNull(),
    champion: text("champion").notNull(),
    feedUrl: text("feed_url").notNull(),
    homeUrl: text("home_url").notNull(),
    paused: boolean("paused").notNull().default(false),
    recommendationHint: text("recommendation_hint", { enum: ["adopt", "counter", "monitor"] }),
    lastPolledAt: timestamp("last_polled_at", { withTimezone: true }),
    lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
    lastError: text("last_error"),
    itemsSeen: integer("items_seen").notNull().default(0),
    alertsCreated: integer("alerts_created").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("competitive_intel_feeds_lane_id_idx").on(t.laneId),
  ],
);

export type CompetitiveIntelFeed = typeof competitiveIntelFeedsTable.$inferSelect;
export type InsertCompetitiveIntelFeed = typeof competitiveIntelFeedsTable.$inferInsert;

export const competitiveIntelAlertsTable = pgTable(
  "competitive_intel_alerts",
  {
    id: text("id").primaryKey(),
    laneId: text("lane_id").notNull(),
    champion: text("champion").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    link: text("link").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
    recommendation: text("recommendation", { enum: ["adopt", "counter", "monitor"] }).notNull(),
    recommendationReason: text("recommendation_reason").notNull(),
    dismissed: boolean("dismissed").notNull().default(false),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
    dismissedBy: text("dismissed_by"),
    source: text("source", { enum: ["rss", "seed"] }).notNull(),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
  },
  (t) => [
    index("competitive_intel_alerts_lane_id_idx").on(t.laneId),
    index("competitive_intel_alerts_published_at_idx").on(t.publishedAt),
    index("competitive_intel_alerts_dismissed_idx").on(t.dismissed),
  ],
);

export type CompetitiveIntelAlert = typeof competitiveIntelAlertsTable.$inferSelect;
export type InsertCompetitiveIntelAlert = typeof competitiveIntelAlertsTable.$inferInsert;

/**
 * Singleton row table (id always = 1) holding global monitor state that does
 * not belong on a single feed: last poll metadata, seed flags, JSON-migration
 * marker.
 */
export const competitiveIntelStateTable = pgTable("competitive_intel_state", {
  id: integer("id").primaryKey(),
  lastFullPollAt: timestamp("last_full_poll_at", { withTimezone: true }),
  pollRunCount: integer("poll_run_count").notNull().default(0),
  alertsSeededAt: timestamp("alerts_seeded_at", { withTimezone: true }),
  feedsSeededAt: timestamp("feeds_seeded_at", { withTimezone: true }),
  jsonMigratedAt: timestamp("json_migrated_at", { withTimezone: true }),
  meta: jsonb("meta"),
});

export type CompetitiveIntelState = typeof competitiveIntelStateTable.$inferSelect;
export type InsertCompetitiveIntelState = typeof competitiveIntelStateTable.$inferInsert;
