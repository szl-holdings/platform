import { bigint, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

// ---------------------------------------------------------------------------
// Page View Events
// Captures anonymous pre-login site traffic for funnel visitor-stage counting.
// Records are written by the lightweight /api/track/page-view endpoint and are
// intentionally minimal — no PII, no auth required.
// ---------------------------------------------------------------------------

export const pageViewEventsTable = pgTable(
  'page_view_events',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    sessionId: text('session_id').notNull(),
    path: text('path').notNull(),
    referrer: text('referrer'),
    userAgent: text('user_agent'),
    ipHash: text('ip_hash'),
    country: text('country'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('pve_session_idx').on(t.sessionId),
    index('pve_occurred_idx').on(t.occurredAt),
    index('pve_path_idx').on(t.path),
  ],
);

export const insertPageViewEventSchema = createInsertSchema(pageViewEventsTable);
export type InsertPageViewEvent = z.infer<typeof insertPageViewEventSchema>;
export type PageViewEvent = typeof pageViewEventsTable.$inferSelect;
