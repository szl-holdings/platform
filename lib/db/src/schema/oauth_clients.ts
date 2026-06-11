import { boolean, index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { organizationsTable } from './organizations.js';

export const oauthClientsTable = pgTable(
  'oauth_clients',
  {
    id: serial('id').primaryKey(),
    clientId: text('client_id').notNull().unique(),
    clientSecretHash: text('client_secret_hash').notNull(),
    name: text('name').notNull(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    allowedScopes: text('allowed_scopes').array().notNull().default([]),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('oauth_clients_client_id_idx').on(t.clientId),
    index('oauth_clients_org_id_idx').on(t.orgId),
  ],
);

export const insertOauthClientSchema = createInsertSchema(oauthClientsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOauthClient = z.infer<typeof insertOauthClientSchema>;
export type OauthClient = typeof oauthClientsTable.$inferSelect;
