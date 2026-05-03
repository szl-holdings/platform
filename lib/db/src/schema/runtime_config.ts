import {
  boolean,
  index,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const runtimeConfigTable = pgTable(
  'runtime_config',
  {
    id: serial('id').primaryKey(),
    key: text('key').notNull().unique(),
    value: text('value').notNull(),
    valueType: text('value_type', { enum: ['string', 'number', 'boolean', 'json'] })
      .notNull()
      .default('string'),
    description: text('description'),
    defaultValue: text('default_value'),
    category: text('category').notNull().default('general'),
    isSensitive: boolean('is_sensitive').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('runtime_config_key_idx').on(t.key),
    index('runtime_config_category_idx').on(t.category),
  ],
);

export const insertRuntimeConfigSchema = createInsertSchema(runtimeConfigTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRuntimeConfig = z.infer<typeof insertRuntimeConfigSchema>;
export type RuntimeConfig = typeof runtimeConfigTable.$inferSelect;
