import { pgTable, text, timestamp, integer, numeric, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const carlotaTimeEntriesTable = pgTable("carlota_time_entries", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  engagement: text("engagement").notNull(),
  phase: text("phase").notNull(),
  deliverable: text("deliverable").notNull(),
  hours: numeric("hours", { precision: 6, scale: 2 }).notNull(),
  rateType: text("rate_type", { enum: ["standard", "premium", "fixed", "non-billable"] }).notNull(),
  rate: integer("rate").notNull().default(0),
  description: text("description").notNull().default(""),
  billable: boolean("billable").notNull().default(true),
  approved: boolean("approved").notNull().default(false),
  invoiceId: text("invoice_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const carlotaInvoicesTable = pgTable("carlota_invoices", {
  id: text("id").primaryKey(),
  client: text("client").notNull(),
  engagement: text("engagement").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status", { enum: ["draft", "sent", "paid", "overdue"] }).notNull().default("draft"),
  dueDate: text("due_date").notNull(),
  issuedDate: text("issued_date").notNull(),
  items: integer("items").notNull().default(0),
  entryIds: jsonb("entry_ids").$type<string[]>().notNull().default([]),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCarlotaTimeEntrySchema = createInsertSchema(carlotaTimeEntriesTable).omit({ createdAt: true, updatedAt: true });
export type InsertCarlotaTimeEntry = z.infer<typeof insertCarlotaTimeEntrySchema>;
export type CarlotaTimeEntry = typeof carlotaTimeEntriesTable.$inferSelect;

export const insertCarlotaInvoiceSchema = createInsertSchema(carlotaInvoicesTable).omit({ createdAt: true, updatedAt: true });
export type InsertCarlotaInvoice = z.infer<typeof insertCarlotaInvoiceSchema>;
export type CarlotaInvoice = typeof carlotaInvoicesTable.$inferSelect;
