import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { organizationsTable } from './organizations.js';
import { usersTable } from './auth.js';

export const pluginsTable = pgTable(
  'plugins',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    version: text('version').notNull().default('1.0.0'),
    description: text('description'),
    author: text('author'),
    category: text('category', {
      enum: ['domain', 'data-connector', 'ui-extension', 'workflow', 'analytics'],
    })
      .notNull()
      .default('domain'),
    entryPoint: text('entry_point'),
    manifestUrl: text('manifest_url'),
    capabilities: jsonb('capabilities').notNull().default('[]'),
    governanceInherited: boolean('governance_inherited').notNull().default(true),
    proofChainEnabled: boolean('proof_chain_enabled').notNull().default(true),
    designSystemVersion: text('design_system_version').default('1.0'),
    billingEnabled: boolean('billing_enabled').notNull().default(false),
    pricingModel: text('pricing_model', { enum: ['free', 'flat', 'usage'] }),
    isPublished: boolean('is_published').notNull().default(false),
    isCorePlugin: boolean('is_core_plugin').notNull().default(false),
    createdById: integer('created_by_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('plugins_slug_idx').on(t.slug),
    index('plugins_category_idx').on(t.category),
    index('plugins_published_idx').on(t.isPublished),
  ],
);

export const pluginInstallationsTable = pgTable(
  'plugin_installations',
  {
    id: serial('id').primaryKey(),
    pluginId: integer('plugin_id')
      .notNull()
      .references(() => pluginsTable.id, { onDelete: 'cascade' }),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    installedById: integer('installed_by_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    status: text('status', { enum: ['active', 'disabled', 'error'] })
      .notNull()
      .default('active'),
    config: jsonb('config').notNull().default('{}'),
    installedAt: timestamp('installed_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    unique('plugin_installations_plugin_org_unique').on(t.pluginId, t.orgId),
    index('plugin_installs_org_id_idx').on(t.orgId),
    index('plugin_installs_plugin_id_idx').on(t.pluginId),
  ],
);

export const insertPluginSchema = createInsertSchema(pluginsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPluginInstallationSchema = createInsertSchema(pluginInstallationsTable).omit({
  id: true,
  installedAt: true,
  updatedAt: true,
});

export type Plugin = typeof pluginsTable.$inferSelect;
export type PluginInstallation = typeof pluginInstallationsTable.$inferSelect;
export type InsertPlugin = z.infer<typeof insertPluginSchema>;
export type InsertPluginInstallation = z.infer<typeof insertPluginInstallationSchema>;
