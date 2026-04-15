import { pgTable, text, serial, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const pushNotificationHistoryTable = pgTable("push_notification_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  appId: text("app_id").notNull(),
  templateId: text("template_id"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: jsonb("data"),
  target: text("target", { enum: ["user", "app", "broadcast", "scheduled"] }).notNull(),
  tokensSent: integer("tokens_sent").notNull().default(0),
  tokensFailed: integer("tokens_failed").notNull().default(0),
  tokensDelivered: integer("tokens_delivered").notNull().default(0),
  deliveryStatus: text("delivery_status", { enum: ["sent", "partial", "failed", "pending"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pushReceiptsTable = pgTable("push_receipts", {
  id: serial("id").primaryKey(),
  ticketId: text("ticket_id").notNull().unique(),
  historyId: integer("history_id").references(() => pushNotificationHistoryTable.id, { onDelete: "set null" }),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  token: text("token").notNull(),
  appId: text("app_id").notNull(),
  templateId: text("template_id"),
  status: text("status", { enum: ["pending", "processing", "ok", "error"] }).notNull().default("pending"),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  checkedAt: timestamp("checked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const scheduledNotificationsTable = pgTable("scheduled_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  appId: text("app_id"),
  target: text("target", { enum: ["user", "app", "broadcast"] }).notNull(),
  template: text("template"),
  vars: jsonb("vars"),
  title: text("title"),
  body: text("body"),
  data: jsonb("data"),
  sendAt: timestamp("send_at").notNull(),
  status: text("status", { enum: ["pending", "processing", "sent", "failed", "cancelled"] }).notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  processedAt: timestamp("processed_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pushNotificationPreferencesTable = pgTable("push_notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  appId: text("app_id").notNull(),
  category: text("category").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PushReceipt = typeof pushReceiptsTable.$inferSelect;
export type PushNotificationHistory = typeof pushNotificationHistoryTable.$inferSelect;
export type ScheduledNotification = typeof scheduledNotificationsTable.$inferSelect;
export type PushNotificationPreference = typeof pushNotificationPreferencesTable.$inferSelect;
