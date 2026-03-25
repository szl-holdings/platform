import { pgTable, text, serial, timestamp, integer, numeric, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vesselsTable = pgTable("vessels", {
  id: serial("id").primaryKey(),
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
  status: text("status", { enum: ["planned", "active", "completed", "canceled"] }).notNull().default("planned"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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
