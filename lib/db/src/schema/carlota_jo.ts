import { pgTable, text, serial, timestamp, integer, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const carlotaInquiriesTable = pgTable("carlota_inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  phone: text("phone"),
  service: text("service"),
  message: text("message").notNull(),
  status: text("status", { enum: ["new", "contacted", "in_progress", "closed"] }).notNull().default("new"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const carlotaReservationsTable = pgTable("carlota_reservations", {
  id: serial("id").primaryKey(),
  confirmationId: text("confirmation_id").notNull().unique(),
  service: text("service").notNull(),
  tier: text("tier").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  phone: text("phone"),
  notes: text("notes"),
  status: text("status", { enum: ["pending", "confirmed", "completed", "canceled"] }).notNull().default("pending"),
  amount: numeric("amount", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  paymentStatus: text("payment_status", { enum: ["unpaid", "paid", "refunded"] }).notNull().default("unpaid"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const carlotaServicesTable = pgTable("carlota_services", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  summary: text("summary"),
  description: text("description"),
  icon: text("icon"),
  category: text("category"),
  capabilities: jsonb("capabilities"),
  isActive: text("is_active").default("true"),
  sortOrder: integer("sort_order").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const carlotaClientProfilesTable = pgTable("carlota_client_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  phone: text("phone"),
  industry: text("industry"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCarlotaInquirySchema = createInsertSchema(carlotaInquiriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCarlotaInquiry = z.infer<typeof insertCarlotaInquirySchema>;
export type CarlotaInquiry = typeof carlotaInquiriesTable.$inferSelect;

export const insertCarlotaReservationSchema = createInsertSchema(carlotaReservationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCarlotaReservation = z.infer<typeof insertCarlotaReservationSchema>;
export type CarlotaReservation = typeof carlotaReservationsTable.$inferSelect;

export const insertCarlotaServiceSchema = createInsertSchema(carlotaServicesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCarlotaService = z.infer<typeof insertCarlotaServiceSchema>;
export type CarlotaService = typeof carlotaServicesTable.$inferSelect;

export const insertCarlotaClientProfileSchema = createInsertSchema(carlotaClientProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCarlotaClientProfile = z.infer<typeof insertCarlotaClientProfileSchema>;
export type CarlotaClientProfile = typeof carlotaClientProfilesTable.$inferSelect;
