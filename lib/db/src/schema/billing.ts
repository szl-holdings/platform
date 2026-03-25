import { pgTable, text, serial, timestamp, integer, numeric, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";

export const billingPlansTable = pgTable("billing_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  priceMonthly: numeric("price_monthly", { precision: 10, scale: 2 }).notNull(),
  priceYearly: numeric("price_yearly", { precision: 10, scale: 2 }),
  features: jsonb("features"),
  stripePriceId: text("stripe_price_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  planId: integer("plan_id").notNull().references(() => billingPlansTable.id),
  status: text("status", { enum: ["active", "trialing", "past_due", "canceled", "paused"] }).notNull().default("active"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  canceledAt: timestamp("canceled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  subscriptionId: integer("subscription_id").references(() => subscriptionsTable.id),
  stripeInvoiceId: text("stripe_invoice_id"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("usd"),
  status: text("status", { enum: ["draft", "open", "paid", "void", "uncollectible"] }).notNull().default("draft"),
  paidAt: timestamp("paid_at"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBillingPlanSchema = createInsertSchema(billingPlansTable).omit({ id: true, createdAt: true });
export type InsertBillingPlan = z.infer<typeof insertBillingPlanSchema>;
export type BillingPlan = typeof billingPlansTable.$inferSelect;

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({ id: true, createdAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
