import { pgTable, text, serial, timestamp, numeric, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const revenueEventsTable = pgTable("revenue_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type", {
    enum: [
      "checkout.completed",
      "subscription.activated",
      "subscription.trialing",
      "subscription.past_due",
      "subscription.canceled",
      "invoice.paid",
      "invoice.payment_failed",
      "pilot.created",
      "pilot.converted",
      "pilot.churned",
      "payment.succeeded",
      "refund.issued",
    ],
  }).notNull(),
  product: text("product").notNull().default("lyte"),
  customerId: text("customer_id"),
  subscriptionId: text("subscription_id"),
  invoiceId: text("invoice_id"),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  currency: text("currency").notNull().default("usd"),
  idempotencyKey: text("idempotency_key").unique(),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
}, (table) => [
  index("revenue_events_product_idx").on(table.product),
  index("revenue_events_event_type_idx").on(table.eventType),
  index("revenue_events_customer_idx").on(table.customerId),
  index("revenue_events_occurred_at_idx").on(table.occurredAt),
]);

export const insertRevenueEventSchema = createInsertSchema(revenueEventsTable).omit({ id: true, occurredAt: true });
export type InsertRevenueEvent = z.infer<typeof insertRevenueEventSchema>;
export type RevenueEvent = typeof revenueEventsTable.$inferSelect;
