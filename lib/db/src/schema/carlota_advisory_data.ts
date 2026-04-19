import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const carlotaAdvisoryClientsTable = pgTable("carlota_advisory_clients", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  name: text("name").notNull(),
  industry: text("industry").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const carlotaClientMarginHistoryTable = pgTable("carlota_client_margin_history", {
  id: serial("id").primaryKey(),
  clientExternalId: text("client_external_id").notNull(),
  month: text("month").notNull(),
  margin: real("margin").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const carlotaClientRoiBenchmarksTable = pgTable("carlota_client_roi_benchmarks", {
  id: serial("id").primaryKey(),
  clientExternalId: text("client_external_id").notNull().unique(),
  avgRoi: integer("avg_roi").notNull().default(0),
  avgPaybackMonths: integer("avg_payback_months").notNull().default(0),
  avgRateRealisationPct: integer("avg_rate_realisation_pct").notNull().default(100),
  blendedMarginPct: integer("blended_margin_pct").notNull().default(0),
  clientRetentionPct: integer("client_retention_pct").notNull().default(0),
  npsScore: integer("nps_score").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const carlotaClientRoiTrendTable = pgTable("carlota_client_roi_trend", {
  id: serial("id").primaryKey(),
  clientExternalId: text("client_external_id").notNull(),
  month: text("month").notNull(),
  avgRoi: integer("avg_roi").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const carlotaClientRadarSignalsTable = pgTable("carlota_client_radar_signals", {
  id: serial("id").primaryKey(),
  clientExternalId: text("client_external_id").notNull(),
  competitor: text("competitor").notNull(),
  event: text("event").notNull(),
  impact: text("impact", { enum: ["high", "medium", "low"] }).notNull().default("medium"),
  direction: text("direction", { enum: ["threat", "opportunity", "neutral"] }).notNull().default("neutral"),
  signalDate: text("signal_date").notNull().default(""),
  detail: text("detail").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const carlotaClientCompetitorsTable = pgTable("carlota_client_competitors", {
  id: serial("id").primaryKey(),
  clientExternalId: text("client_external_id").notNull(),
  name: text("name").notNull(),
  score: integer("score").notNull().default(50),
  trend: text("trend", { enum: ["up", "down", "flat"] }).notNull().default("flat"),
  share: integer("share").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const carlotaClientMarketTrendTable = pgTable("carlota_client_market_trend", {
  id: serial("id").primaryKey(),
  clientExternalId: text("client_external_id").notNull(),
  month: text("month").notNull(),
  you: integer("you").notNull().default(0),
  market: integer("market").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertCarlotaAdvisoryClientSchema = createInsertSchema(carlotaAdvisoryClientsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCarlotaAdvisoryClient = z.infer<typeof insertCarlotaAdvisoryClientSchema>;
export type CarlotaAdvisoryClient = typeof carlotaAdvisoryClientsTable.$inferSelect;

export type CarlotaClientMarginHistory = typeof carlotaClientMarginHistoryTable.$inferSelect;
export type CarlotaClientRoiBenchmarks = typeof carlotaClientRoiBenchmarksTable.$inferSelect;
export type CarlotaClientRoiTrend = typeof carlotaClientRoiTrendTable.$inferSelect;
export type CarlotaClientRadarSignal = typeof carlotaClientRadarSignalsTable.$inferSelect;
export type CarlotaClientCompetitor = typeof carlotaClientCompetitorsTable.$inferSelect;
export type CarlotaClientMarketTrend = typeof carlotaClientMarketTrendTable.$inferSelect;
