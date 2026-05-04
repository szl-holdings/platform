import { index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const modelPassportLensesTable = pgTable(
  'model_passport_lenses',
  {
    lensId: text('lens_id').primaryKey(),
    tenantId: integer('tenant_id').notNull(),
    passportId: text('passport_id').notNull(),
    displayName: text('display_name').notNull(),
    description: text('description'),
    envelope: jsonb('envelope').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: text('created_by'),
  },
  (t) => [
    index('mpl_tenant_passport_idx').on(t.tenantId, t.passportId),
    index('mpl_passport_idx').on(t.passportId),
    index('mpl_tenant_idx').on(t.tenantId),
  ],
);

export type ModelPassportLensRow = typeof modelPassportLensesTable.$inferSelect;
export type InsertModelPassportLens = typeof modelPassportLensesTable.$inferInsert;
