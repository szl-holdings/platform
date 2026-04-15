import { pgTable, serial, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

export const platformStatusChecks = pgTable("platform_status_checks", {
  id: serial("id").primaryKey(),
  serviceId: text("service_id").notNull(),
  status: text("status").notNull().default("operational"),
  latencyMs: integer("latency_ms"),
  checkedAt: timestamp("checked_at").notNull().defaultNow(),
});

export const platformPublicIncidents = pgTable("platform_incidents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status").notNull().default("investigating"),
  severity: text("severity").notNull().default("minor"),
  affectedServices: text("affected_services").array().notNull().default([]),
  description: text("description").notNull(),
  resolvedAt: timestamp("resolved_at"),
  postedBy: text("posted_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const platformIncidentUpdates = pgTable("platform_incident_updates", {
  id: serial("id").primaryKey(),
  incidentId: integer("incident_id").notNull().references(() => platformPublicIncidents.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const platformStatusSubscriptions = pgTable("platform_status_subscriptions", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  subscribedAt: timestamp("subscribed_at").notNull().defaultNow(),
  active: boolean("active").notNull().default(true),
});

export const platformContactRequests = pgTable("platform_contact_requests", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("general"),
  app: text("app").notNull().default("unknown"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  role: text("role"),
  message: text("message"),
  metadata: jsonb("metadata"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
