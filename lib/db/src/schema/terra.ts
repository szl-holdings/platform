import {
  pgTable, text, serial, timestamp, integer, numeric, boolean, jsonb, index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const terraDistressPropertiesTable = pgTable("terra_distress_properties", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  address: text("address").notNull(),
  borough: text("borough", { enum: ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"] }).notNull(),
  county: text("county").notNull(),
  zipCode: text("zip_code"),
  propertyType: text("property_type", { enum: ["multifamily", "single-family", "condo", "commercial", "mixed-use", "vacant-land", "unknown"] }).notNull().default("unknown"),
  distressType: text("distress_type", { enum: ["pre-foreclosure", "foreclosure", "auction", "reo", "tax-lien", "expired-listing"] }).notNull(),
  stage: text("stage").notNull(),
  estimatedValue: numeric("estimated_value", { precision: 14, scale: 2 }).notNull(),
  debtAmount: numeric("debt_amount", { precision: 14, scale: 2 }),
  lienAmount: numeric("lien_amount", { precision: 14, scale: 2 }),
  auctionDate: text("auction_date"),
  filingDate: text("filing_date").notNull(),
  lastActivityDate: text("last_activity_date").notNull(),
  ownerName: text("owner_name").notNull(),
  ownerType: text("owner_type", { enum: ["individual", "llc", "trust", "corporate"] }).notNull(),
  opportunityScore: integer("opportunity_score").notNull().default(50),
  confidenceLevel: text("confidence_level", { enum: ["low", "medium", "high"] }).notNull().default("medium"),
  scoreRationale: text("score_rationale").notNull().default(""),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  sqft: integer("sqft"),
  yearBuilt: integer("year_built"),
  beds: integer("beds"),
  baths: integer("baths"),
  daysInDistress: integer("days_in_distress").notNull().default(0),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  timeline: jsonb("timeline").$type<Array<{ date: string; type: string; description: string }>>().notNull().default([]),
  priceHistory: jsonb("price_history").$type<Array<{ date: string; price: number }>>(),
  connectorSource: text("connector_source").notNull().default(""),
  notes: text("notes"),
  linkedDealId: text("linked_deal_id"),
  rawData: jsonb("raw_data"),
  ingestSource: text("ingest_source", { enum: ["seed", "csv_upload", "nyc_open_data", "manual"] }).notNull().default("seed"),
  ingestRunId: integer("ingest_run_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_distress_borough_idx").on(t.borough),
  index("terra_distress_zip_idx").on(t.zipCode),
  index("terra_distress_type_idx").on(t.distressType),
  index("terra_distress_score_idx").on(t.opportunityScore),
  index("terra_distress_active_idx").on(t.isActive),
  index("terra_distress_auction_idx").on(t.auctionDate),
]);

export const terraDistressAlertsTable = pgTable("terra_distress_alerts", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  propertyId: integer("property_id").references(() => terraDistressPropertiesTable.id, { onDelete: "cascade" }),
  propertyExternalId: text("property_external_id"),
  alertType: text("alert_type", { enum: ["auction", "foreclosure", "lien", "reo", "signal", "price_drop"] }).notNull(),
  message: text("message").notNull(),
  severity: text("severity", { enum: ["critical", "high", "medium", "low", "info"] }).notNull().default("medium"),
  borough: text("borough"),
  zipCode: text("zip_code"),
  isRead: boolean("is_read").notNull().default(false),
  triggeredAt: timestamp("triggered_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata"),
}, (t) => [
  index("terra_alert_property_idx").on(t.propertyId),
  index("terra_alert_severity_idx").on(t.severity),
  index("terra_alert_type_idx").on(t.alertType),
  index("terra_alert_borough_idx").on(t.borough),
]);

export const terraIngestionRunsTable = pgTable("terra_ingestion_runs", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  status: text("status", { enum: ["running", "completed", "failed", "partial"] }).notNull().default("running"),
  recordsFetched: integer("records_fetched").notNull().default(0),
  recordsInserted: integer("records_inserted").notNull().default(0),
  recordsSkipped: integer("records_skipped").notNull().default(0),
  recordsFailed: integer("records_failed").notNull().default(0),
  alertsGenerated: integer("alerts_generated").notNull().default(0),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
}, (t) => [
  index("terra_ingestion_source_idx").on(t.source),
  index("terra_ingestion_status_idx").on(t.status),
]);

export const insertTerraDistressPropertySchema = createInsertSchema(terraDistressPropertiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerraDistressProperty = z.infer<typeof insertTerraDistressPropertySchema>;
export type TerraDistressProperty = typeof terraDistressPropertiesTable.$inferSelect;

export const insertTerraDistressAlertSchema = createInsertSchema(terraDistressAlertsTable).omit({ id: true });
export type InsertTerraDistressAlert = z.infer<typeof insertTerraDistressAlertSchema>;
export type TerraDistressAlert = typeof terraDistressAlertsTable.$inferSelect;

export const insertTerraIngestionRunSchema = createInsertSchema(terraIngestionRunsTable).omit({ id: true, startedAt: true });
export type InsertTerraIngestionRun = z.infer<typeof insertTerraIngestionRunSchema>;
export type TerraIngestionRun = typeof terraIngestionRunsTable.$inferSelect;
