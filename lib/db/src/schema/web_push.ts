import { pgTable, text, serial, timestamp, integer, boolean, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const webPushSubscriptionsTable = pgTable("web_push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  appId: text("app_id").notNull().default("unknown"),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("web_push_subscriptions_endpoint_idx").on(table.endpoint),
]);

export type WebPushSubscription = typeof webPushSubscriptionsTable.$inferSelect;
export type NewWebPushSubscription = typeof webPushSubscriptionsTable.$inferInsert;

export const notificationRecipientsTable = pgTable("notification_recipients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  phoneNumber: text("phone_number").notNull(),
  label: text("label"),
  smsEnabled: boolean("sms_enabled").notNull().default(true),
  voiceEnabled: boolean("voice_enabled").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("notification_recipients_phone_idx").on(table.phoneNumber),
]);

export type NotificationRecipient = typeof notificationRecipientsTable.$inferSelect;
export type NewNotificationRecipient = typeof notificationRecipientsTable.$inferInsert;
