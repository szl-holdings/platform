import { index, pgTable, serial, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const emailSuppressionsTable = pgTable(
  'email_suppressions',
  {
    id: serial('id').primaryKey(),
    email: text('email').notNull(),
    reason: text('reason', { enum: ['bounce', 'complaint', 'unsubscribe', 'manual'] }).notNull(),
    providerEventId: text('provider_event_id'),
    provider: text('provider'),
    detail: text('detail'),
    suppressedAt: timestamp('suppressed_at').notNull().defaultNow(),
  },
  (t) => [
    unique('email_suppressions_email_unique').on(t.email),
    index('email_suppressions_email_idx').on(t.email),
  ],
);

export const insertEmailSuppressionSchema = createInsertSchema(emailSuppressionsTable);
export const selectEmailSuppressionSchema = createSelectSchema(emailSuppressionsTable);

export type EmailSuppression = z.infer<typeof selectEmailSuppressionSchema>;
export type InsertEmailSuppression = z.infer<typeof insertEmailSuppressionSchema>;
