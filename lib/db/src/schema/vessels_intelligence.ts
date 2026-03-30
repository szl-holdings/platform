import { pgTable, text, serial, timestamp, integer, numeric, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";
import { usersTable } from "./auth";
import { vesselsTable } from "./vessels";
import { voyagesTable } from "./maritime";

export const fleetExceptionsTable = pgTable("fleet_exceptions", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  vesselId: integer("vessel_id").references(() => vesselsTable.id, { onDelete: "cascade" }),
  voyageId: integer("voyage_id").references(() => voyagesTable.id, { onDelete: "set null" }),
  exceptionRef: text("exception_ref").notNull(),
  exceptionType: text("exception_type", { enum: ["route_deviation", "delay_risk", "port_congestion", "weather_disruption", "maintenance_risk", "fuel_anomaly", "schedule_variance", "security_alert"] }).notNull(),
  severity: text("severity", { enum: ["critical", "high", "watch", "normal"] }).notNull().default("watch"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  whyItMatters: text("why_it_matters"),
  recommendedResponse: text("recommended_response"),
  businessConsequence: text("business_consequence"),
  owner: text("owner"),
  ownerFunction: text("owner_function"),
  estimatedImpactUsd: numeric("estimated_impact_usd", { precision: 15, scale: 2 }),
  status: text("status", { enum: ["active", "acknowledged", "resolved", "dismissed"] }).notNull().default("active"),
  acknowledgedAt: timestamp("acknowledged_at"),
  acknowledgedBy: integer("acknowledged_by").references(() => usersTable.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => usersTable.id, { onDelete: "set null" }),
  resolutionNotes: text("resolution_notes"),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("fleet_exceptions_org_idx").on(table.orgId),
  index("fleet_exceptions_vessel_idx").on(table.vesselId),
  index("fleet_exceptions_status_idx").on(table.status),
  index("fleet_exceptions_severity_idx").on(table.severity),
  index("fleet_exceptions_detected_idx").on(table.detectedAt),
]);

export const vesselMaintenanceTable = pgTable("vessel_maintenance", {
  id: serial("id").primaryKey(),
  vesselId: integer("vessel_id").notNull().references(() => vesselsTable.id, { onDelete: "cascade" }),
  component: text("component").notNull(),
  maintenanceType: text("maintenance_type", { enum: ["preventive", "corrective", "scheduled", "predictive"] }).notNull(),
  description: text("description"),
  status: text("status", { enum: ["overdue", "due_soon", "scheduled", "in_progress", "completed"] }).notNull().default("scheduled"),
  priority: text("priority", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  estimatedCost: numeric("estimated_cost", { precision: 12, scale: 2 }),
  riskOfServiceIssue: numeric("risk_of_service_issue", { precision: 5, scale: 2 }),
  impactsVoyageAvailability: boolean("impacts_voyage_availability").notNull().default(false),
  assetHealth: numeric("asset_health", { precision: 5, scale: 2 }),
  technician: text("technician"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("vessel_maintenance_vessel_idx").on(table.vesselId),
  index("vessel_maintenance_status_idx").on(table.status),
  index("vessel_maintenance_due_idx").on(table.dueDate),
]);

export const insertFleetExceptionSchema = createInsertSchema(fleetExceptionsTable).omit({ id: true, createdAt: true, updatedAt: true, detectedAt: true });
export type InsertFleetException = z.infer<typeof insertFleetExceptionSchema>;
export type FleetException = typeof fleetExceptionsTable.$inferSelect;

export const insertVesselMaintenanceSchema = createInsertSchema(vesselMaintenanceTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVesselMaintenance = z.infer<typeof insertVesselMaintenanceSchema>;
export type VesselMaintenance = typeof vesselMaintenanceTable.$inferSelect;
