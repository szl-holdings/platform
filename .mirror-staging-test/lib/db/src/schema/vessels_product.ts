import { pgTable, text, serial, timestamp, integer, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";

export const fleetsTable = pgTable("fleets", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const vesselsAssetsTable = pgTable("vessels_assets", {
  id: serial("id").primaryKey(),
  fleetId: integer("fleet_id").references(() => fleetsTable.id, { onDelete: "set null" }),
  organizationId: integer("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  assetType: text("asset_type"),
  imoOrIdentifier: text("imo_or_identifier"),
  status: text("status", { enum: ["active", "in_port", "at_sea", "anchored", "maintenance", "decommissioned"] }).notNull().default("active"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  metadataJson: jsonb("metadata_json"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const journeysTable = pgTable("journeys", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  vesselAssetId: integer("vessel_asset_id").references(() => vesselsAssetsTable.id, { onDelete: "set null" }),
  originLabel: text("origin_label"),
  destinationLabel: text("destination_label"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  routeGeojson: jsonb("route_geojson"),
  status: text("status", { enum: ["planned", "active", "completed", "canceled"] }).notNull().default("planned"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const vesselEventsTable = pgTable("vessel_events", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  vesselAssetId: integer("vessel_asset_id").references(() => vesselsAssetsTable.id, { onDelete: "set null" }),
  eventType: text("event_type").notNull(),
  severity: text("severity", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  title: text("title").notNull(),
  description: text("description"),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  metadataJson: jsonb("metadata_json"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vesselAlertsTable = pgTable("vessel_alerts", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  vesselAssetId: integer("vessel_asset_id").references(() => vesselsAssetsTable.id, { onDelete: "set null" }),
  journeyId: integer("journey_id").references(() => journeysTable.id, { onDelete: "set null" }),
  alertType: text("alert_type").notNull(),
  severity: text("severity", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["active", "acknowledged", "resolved", "dismissed"] }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const vesselReportsTable = pgTable("vessel_reports", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  reportType: text("report_type").notNull(),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  reportUrl: text("report_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFleetSchema = createInsertSchema(fleetsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFleet = z.infer<typeof insertFleetSchema>;
export type Fleet = typeof fleetsTable.$inferSelect;

export const insertVesselAssetSchema = createInsertSchema(vesselsAssetsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVesselAsset = z.infer<typeof insertVesselAssetSchema>;
export type VesselAsset = typeof vesselsAssetsTable.$inferSelect;

export const insertJourneySchema = createInsertSchema(journeysTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJourney = z.infer<typeof insertJourneySchema>;
export type Journey = typeof journeysTable.$inferSelect;

export const insertVesselEventSchema = createInsertSchema(vesselEventsTable).omit({ id: true, createdAt: true });
export type InsertVesselEvent = z.infer<typeof insertVesselEventSchema>;
export type VesselEvent = typeof vesselEventsTable.$inferSelect;

export const insertVesselAlertSchema2 = createInsertSchema(vesselAlertsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVesselAlert2 = z.infer<typeof insertVesselAlertSchema2>;
export type VesselAlert2 = typeof vesselAlertsTable.$inferSelect;

export const insertVesselReportSchema = createInsertSchema(vesselReportsTable).omit({ id: true, createdAt: true });
export type InsertVesselReport = z.infer<typeof insertVesselReportSchema>;
export type VesselReport = typeof vesselReportsTable.$inferSelect;
