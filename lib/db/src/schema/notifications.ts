import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { usersTable } from './auth.js';

export const notificationsTable = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    type: text('type', {
      enum: ['info', 'success', 'warning', 'error', 'action_required'],
    }).notNull(),
    channel: text('channel', { enum: ['in_app', 'email', 'sms', 'slack'] })
      .notNull()
      .default('in_app'),
    title: text('title').notNull(),
    message: text('message').notNull(),
    actionUrl: text('action_url'),
    isRead: boolean('is_read').notNull().default(false),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('notifications_user_read_idx').on(t.userId, t.isRead),
    index('notifications_user_created_idx').on(t.userId, sql`${t.createdAt} DESC`),
  ],
);

export const notificationPreferencesTable = pgTable('notification_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' })
    .unique(),
  emailEnabled: boolean('email_enabled').notNull().default(true),
  smsEnabled: boolean('sms_enabled').notNull().default(false),
  slackEnabled: boolean('slack_enabled').notNull().default(false),
  inAppEnabled: boolean('in_app_enabled').notNull().default(true),
  digestConfig: jsonb('digest_config'),
  lastDigestSentAt: timestamp('last_digest_sent_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const emailSendLogTable = pgTable(
  'email_send_log',
  {
    id: serial('id').primaryKey(),
    notificationId: integer('notification_id'),
    channel: text('channel').notNull().default('email'),
    provider: text('provider'),
    messageId: text('message_id'),
    recipient: text('recipient').notNull(),
    subject: text('subject'),
    status: text('status', { enum: ['sent', 'failed', 'bounced'] })
      .notNull()
      .default('sent'),
    error: text('error'),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('email_send_log_notification_idx').on(t.notificationId),
    index('email_send_log_status_idx').on(t.status),
    index('email_send_log_sent_at_idx').on(t.sentAt),
  ],
);

export const insertEmailSendLogSchema = createInsertSchema(emailSendLogTable).omit({
  id: true,
  sentAt: true,
});
export type InsertEmailSendLog = z.infer<typeof insertEmailSendLogSchema>;
export type EmailSendLog = typeof emailSendLogTable.$inferSelect;

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;

export const insertNotificationPreferencesSchema = createInsertSchema(
  notificationPreferencesTable,
).omit({ id: true, updatedAt: true });
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type NotificationPreferences = typeof notificationPreferencesTable.$inferSelect;
