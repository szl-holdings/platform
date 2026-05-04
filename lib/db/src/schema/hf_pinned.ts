import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const hfPinnedItemsTable = pgTable(
  'hf_pinned_items',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    orgId: text('org_id'),
    kind: text('kind', { enum: ['model', 'dataset', 'space'] }).notNull(),
    hfId: text('hf_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    task: text('task'),
    downloads: integer('downloads'),
    likes: integer('likes'),
    pinnedAt: timestamp('pinned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('hf_pinned_items_user_idx').on(t.userId),
    index('hf_pinned_items_org_idx').on(t.orgId),
    index('hf_pinned_items_kind_idx').on(t.kind),
    index('hf_pinned_items_user_hfid_idx').on(t.userId, t.kind, t.hfId),
  ],
);
