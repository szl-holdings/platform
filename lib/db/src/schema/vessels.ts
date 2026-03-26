import { pgTable, text, serial, timestamp, integer, numeric, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vesselsFleetsTable = pgTable("vessels_fleets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  region: text("region"),
  status: text("status", { enum: ["active", "inactive", "maintenance"] }).notNull().default("active"),
  vesselCount: integer("vessel_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const vesselsTable = pgTable("vessels", {
  id: serial("id").primaryKey(),
  fleetId: integer("fleet_id").references(() => vesselsFleetsTable.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  imo: text("imo").unique(),
  mmsi: text("mmsi"),
  vesselType: text("vessel_type", { enum: ["cargo", "tanker", "container", "bulk", "passenger", "fishing", "other"] }).notNull(),
  flag: text("flag"),
  yearBuilt: integer("year_built"),
  grossTonnage: numeric("gross_tonnage", { precision: 12, scale: 2 }),
  status: text("status", { enum: ["active", "in_port", "at_sea", "anchored", "maintenance", "decommissioned"] }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const vesselsPositionsTable = pgTable("vessels_positions", {
  id: serial("id").primaryKey(),
  vesselId: integer("vessel_id").notNull().references(() => vesselsTable.id, { onDelete: "cascade" }),
  latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
  heading: numeric("heading", { precision: 5, scale: 2 }),
  speed: numeric("speed", { precision: 6, scale: 2 }),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});

export const vesselsCargoTable = pgTable("vessels_cargo", {
  id: serial("id").primaryKey(),
  vesselId: integer("vessel_id").notNull().references(() => vesselsTable.id, { onDelete: "cascade" }),
  cargoType: text("cargo_type").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 2 }),
  unit: text("unit"),
  origin: text("origin"),
  destination: text("destination"),
  eta: timestamp("eta"),
  status: text("status", { enum: ["loading", "in_transit", "delivered", "delayed"] }).notNull().default("loading"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vesselsRoutesTable = pgTable("vessels_routes", {
  id: serial("id").primaryKey(),
  vesselId: integer("vessel_id").notNull().references(() => vesselsTable.id, { onDelete: "cascade" }),
  originPort: text("origin_port").notNull(),
  destinationPort: text("destination_port").notNull(),
  departureAt: timestamp("departure_at"),
  arrivalAt: timestamp("arrival_at"),
  waypoints: jsonb("waypoints"),
  distanceNm: numeric("distance_nm", { precision: 10, scale: 2 }),
  status: text("status", { enum: ["planned", "active", "completed", "canceled"] }).notNull().default("planned"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vesselsAlertRulesTable = pgTable("vessels_alert_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ruleType: text("rule_type", { enum: ["speed", "geofence", "weather", "schedule", "cargo", "maintenance"] }).notNull(),
  conditions: jsonb("conditions").notNull(),
  severity: text("severity", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vesselsAlertsTable = pgTable("vessels_alerts", {
  id: serial("id").primaryKey(),
  ruleId: integer("rule_id").references(() => vesselsAlertRulesTable.id, { onDelete: "set null" }),
  vesselId: integer("vessel_id").references(() => vesselsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity", { enum: ["low", "medium", "high", "critical"] }).notNull(),
  status: text("status", { enum: ["active", "acknowledged", "resolved", "dismissed"] }).notNull().default("active"),
  metadata: jsonb("metadata"),
  triggeredAt: timestamp("triggered_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const vesselsWeatherSnapshotsTable = pgTable("vessels_weather_snapshots", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id").references(() => vesselsRoutesTable.id, { onDelete: "cascade" }),
  location: text("location").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  temperature: numeric("temperature", { precision: 5, scale: 2 }),
  windSpeed: numeric("wind_speed", { precision: 6, scale: 2 }),
  windDirection: text("wind_direction"),
  waveHeight: numeric("wave_height", { precision: 5, scale: 2 }),
  visibility: numeric("visibility", { precision: 6, scale: 2 }),
  description: text("description"),
  riskLevel: text("risk_level", { enum: ["low", "moderate", "high", "severe"] }).notNull().default("low"),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});

export const vesselsSimulationsTable = pgTable("vessels_simulations", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id").references(() => vesselsRoutesTable.id, { onDelete: "cascade" }),
  vesselId: integer("vessel_id").references(() => vesselsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  simulationType: text("simulation_type", { enum: ["route_risk", "weather_impact", "fuel_optimization", "schedule_analysis"] }).notNull(),
  status: text("status", { enum: ["pending", "running", "completed", "failed"] }).notNull().default("pending"),
  parameters: jsonb("parameters"),
  results: jsonb("results"),
  riskScore: numeric("risk_score", { precision: 5, scale: 2 }),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVesselFleetSchema = createInsertSchema(vesselsFleetsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVesselFleet = z.infer<typeof insertVesselFleetSchema>;
export type VesselFleet = typeof vesselsFleetsTable.$inferSelect;

export const insertVesselSchema = createInsertSchema(vesselsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVessel = z.infer<typeof insertVesselSchema>;
export type Vessel = typeof vesselsTable.$inferSelect;

export const insertVesselPositionSchema = createInsertSchema(vesselsPositionsTable).omit({ id: true });
export type InsertVesselPosition = z.infer<typeof insertVesselPositionSchema>;
export type VesselPosition = typeof vesselsPositionsTable.$inferSelect;

export const insertVesselCargoSchema = createInsertSchema(vesselsCargoTable).omit({ id: true, createdAt: true });
export type InsertVesselCargo = z.infer<typeof insertVesselCargoSchema>;
export type VesselCargo = typeof vesselsCargoTable.$inferSelect;

export const insertVesselRouteSchema = createInsertSchema(vesselsRoutesTable).omit({ id: true, createdAt: true });
export type InsertVesselRoute = z.infer<typeof insertVesselRouteSchema>;
export type VesselRoute = typeof vesselsRoutesTable.$inferSelect;

export const insertVesselAlertRuleSchema = createInsertSchema(vesselsAlertRulesTable).omit({ id: true, createdAt: true });
export type InsertVesselAlertRule = z.infer<typeof insertVesselAlertRuleSchema>;
export type VesselAlertRule = typeof vesselsAlertRulesTable.$inferSelect;

export const insertVesselAlertSchema = createInsertSchema(vesselsAlertsTable).omit({ id: true });
export type InsertVesselAlert = z.infer<typeof insertVesselAlertSchema>;
export type VesselAlert = typeof vesselsAlertsTable.$inferSelect;

export const insertVesselWeatherSnapshotSchema = createInsertSchema(vesselsWeatherSnapshotsTable).omit({ id: true });
export type InsertVesselWeatherSnapshot = z.infer<typeof insertVesselWeatherSnapshotSchema>;
export type VesselWeatherSnapshot = typeof vesselsWeatherSnapshotsTable.$inferSelect;

export const insertVesselSimulationSchema = createInsertSchema(vesselsSimulationsTable).omit({ id: true, createdAt: true });
export type InsertVesselSimulation = z.infer<typeof insertVesselSimulationSchema>;
export type VesselSimulation = typeof vesselsSimulationsTable.$inferSelect;
