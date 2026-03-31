import { pgTable, text, serial, timestamp, integer, numeric, boolean, jsonb, index } from "drizzle-orm/pg-core";

export const mspClientsTable = pgTable("msp_clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  industry: text("industry"),
  status: text("status", { enum: ["active", "inactive", "at-risk", "churned"] }).notNull().default("active"),
  healthScore: integer("health_score").default(80),
  deviceCount: integer("device_count").default(0),
  openTickets: integer("open_tickets").default(0),
  mrr: integer("mrr").default(0),
  costToServe: integer("cost_to_serve").default(0),
  churnRisk: integer("churn_risk").default(10),
  tickets30d: integer("tickets_30d").default(0),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  city: text("city"),
  state: text("state"),
  slaTarget: integer("sla_target").default(99),
  slaActual: integer("sla_actual").default(99),
  tags: jsonb("tags").$type<string[]>().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const mspTechniciansTable = pgTable("msp_technicians", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  status: text("status", { enum: ["available", "on-site", "traveling", "off-duty"] }).notNull().default("available"),
  specialties: jsonb("specialties").$type<string[]>().default([]),
  currentJob: text("current_job"),
  location: text("location"),
  eta: text("eta"),
  completedToday: integer("completed_today").default(0),
  rating: numeric("rating", { precision: 3, scale: 1 }).default("4.8"),
  certifications: jsonb("certifications").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const mspTicketsTable = pgTable("msp_tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: text("ticket_number").notNull().unique(),
  subject: text("subject").notNull(),
  description: text("description"),
  clientId: integer("client_id").references(() => mspClientsTable.id, { onDelete: "set null" }),
  clientName: text("client_name"),
  priority: text("priority", { enum: ["critical", "high", "medium", "low"] }).notNull().default("medium"),
  status: text("status", { enum: ["open", "in-progress", "waiting", "resolved", "closed"] }).notNull().default("open"),
  assigneeId: integer("assignee_id").references(() => mspTechniciansTable.id, { onDelete: "set null" }),
  assigneeName: text("assignee_name"),
  category: text("category"),
  slaDeadline: timestamp("sla_deadline"),
  slaStatus: text("sla_status", { enum: ["on-track", "at-risk", "breached"] }).notNull().default("on-track"),
  aiTriage: text("ai_triage"),
  resolvedAt: timestamp("resolved_at"),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("msp_tickets_client_idx").on(t.clientId),
  index("msp_tickets_assignee_idx").on(t.assigneeId),
  index("msp_tickets_status_idx").on(t.status),
]);

export const mspDevicesTable = pgTable("msp_devices", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull().unique(),
  hostname: text("hostname").notNull(),
  clientId: integer("client_id").references(() => mspClientsTable.id, { onDelete: "set null" }),
  clientName: text("client_name"),
  type: text("type", { enum: ["server", "workstation", "network", "printer", "mobile", "firewall"] }).notNull().default("workstation"),
  os: text("os"),
  ipAddress: text("ip_address"),
  macAddress: text("mac_address"),
  site: text("site"),
  status: text("status", { enum: ["online", "warning", "critical", "offline"] }).notNull().default("online"),
  cpu: integer("cpu").default(0),
  memory: integer("memory").default(0),
  disk: integer("disk").default(0),
  alerts: integer("alerts").default(0),
  patchesPending: integer("patches_pending").default(0),
  threats: integer("threats").default(0),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("msp_devices_client_idx").on(t.clientId),
]);

export const mspContractsTable = pgTable("msp_contracts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  clientId: integer("client_id").references(() => mspClientsTable.id, { onDelete: "set null" }),
  clientName: text("client_name"),
  type: text("type", { enum: ["managed-services", "break-fix", "project", "security", "cloud"] }).notNull().default("managed-services"),
  status: text("status", { enum: ["active", "expiring", "expired", "pending-renewal"] }).notNull().default("active"),
  value: integer("value").notNull().default(0),
  mrr: integer("mrr").default(0),
  startDate: text("start_date"),
  endDate: text("end_date"),
  slaTarget: integer("sla_target").default(99),
  slaActual: integer("sla_actual").default(99),
  renewalProbability: integer("renewal_probability").default(80),
  notes: text("notes"),
  terms: jsonb("terms").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("msp_contracts_client_idx").on(t.clientId),
]);

export type MspClient = typeof mspClientsTable.$inferSelect;
export type InsertMspClient = typeof mspClientsTable.$inferInsert;
export type MspTechnician = typeof mspTechniciansTable.$inferSelect;
export type InsertMspTechnician = typeof mspTechniciansTable.$inferInsert;
export type MspTicket = typeof mspTicketsTable.$inferSelect;
export type InsertMspTicket = typeof mspTicketsTable.$inferInsert;
export type MspDevice = typeof mspDevicesTable.$inferSelect;
export type InsertMspDevice = typeof mspDevicesTable.$inferInsert;
export type MspContract = typeof mspContractsTable.$inferSelect;
export type InsertMspContract = typeof mspContractsTable.$inferInsert;
