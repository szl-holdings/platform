import { boolean, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const appsRegistryTable = pgTable('apps_registry', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  color: text('color'),
  status: text('status', { enum: ['active', 'coming_soon', 'maintenance', 'deprecated'] })
    .notNull()
    .default('coming_soon'),
  version: text('version').notNull().default('0.1.0'),
  config: jsonb('config'),
  ownerTeam: text('owner_team'),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const insertAppsRegistrySchema = createInsertSchema(appsRegistryTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAppsRegistry = z.infer<typeof insertAppsRegistrySchema>;
export type AppsRegistry = typeof appsRegistryTable.$inferSelect;
