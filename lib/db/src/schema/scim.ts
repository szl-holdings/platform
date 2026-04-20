import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { usersTable } from './auth';
import { azureTenantsTable } from './azure_tenants';
import { organizationsTable } from './organizations';

export const scimTokensTable = pgTable(
  'scim_tokens',
  {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id')
      .notNull()
      .references(() => azureTenantsTable.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    tokenPrefix: text('token_prefix').notNull(),
    label: text('label').notNull().default('default'),
    isActive: boolean('is_active').notNull().default(true),
    lastUsedAt: timestamp('last_used_at'),
    expiresAt: timestamp('expires_at'),
    createdByUserId: integer('created_by_user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('scim_tokens_hash_idx').on(table.tokenHash)],
);

export const scimGroupsTable = pgTable(
  'scim_groups',
  {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id')
      .notNull()
      .references(() => azureTenantsTable.id, { onDelete: 'cascade' }),
    externalId: text('external_id'),
    displayName: text('display_name').notNull(),
    platformRole: text('platform_role').notNull().default('viewer'),
    meta: jsonb('meta').default('{}'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('scim_groups_tenant_external_idx').on(table.tenantId, table.externalId)],
);

export const scimGroupMembersTable = pgTable(
  'scim_group_members',
  {
    id: serial('id').primaryKey(),
    groupId: integer('group_id')
      .notNull()
      .references(() => scimGroupsTable.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('scim_group_member_unique').on(table.groupId, table.userId)],
);

export const scimProvisionedUsersTable = pgTable(
  'scim_provisioned_users',
  {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id')
      .notNull()
      .references(() => azureTenantsTable.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    externalId: text('external_id'),
    scimUserName: text('scim_user_name').notNull(),
    active: boolean('active').notNull().default(true),
    provisionedRole: text('provisioned_role').notNull().default('viewer'),
    lastSyncAt: timestamp('last_sync_at'),
    syncErrors: jsonb('sync_errors').default('[]'),
    meta: jsonb('meta').default('{}'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('scim_provisioned_users_tenant_user_idx').on(table.tenantId, table.userId),
  ],
);

export const scimSyncLogsTable = pgTable('scim_sync_logs', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id')
    .notNull()
    .references(() => azureTenantsTable.id, { onDelete: 'cascade' }),
  operation: text('operation', {
    enum: [
      'create_user',
      'update_user',
      'delete_user',
      'create_group',
      'update_group',
      'delete_group',
      'patch_user',
      'patch_group',
    ],
  }).notNull(),
  resourceType: text('resource_type', { enum: ['User', 'Group'] }).notNull(),
  externalId: text('external_id'),
  userId: integer('user_id').references(() => usersTable.id, { onDelete: 'set null' }),
  status: text('status', { enum: ['success', 'error', 'skipped'] }).notNull(),
  errorMessage: text('error_message'),
  requestBody: jsonb('request_body'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const insertScimTokenSchema = createInsertSchema(scimTokensTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertScimToken = z.infer<typeof insertScimTokenSchema>;
export type ScimToken = typeof scimTokensTable.$inferSelect;

export const insertScimGroupSchema = createInsertSchema(scimGroupsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertScimGroup = z.infer<typeof insertScimGroupSchema>;
export type ScimGroup = typeof scimGroupsTable.$inferSelect;

export const insertScimProvisionedUserSchema = createInsertSchema(scimProvisionedUsersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertScimProvisionedUser = z.infer<typeof insertScimProvisionedUserSchema>;
export type ScimProvisionedUser = typeof scimProvisionedUsersTable.$inferSelect;

export const insertScimSyncLogSchema = createInsertSchema(scimSyncLogsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertScimSyncLog = z.infer<typeof insertScimSyncLogSchema>;
export type ScimSyncLog = typeof scimSyncLogsTable.$inferSelect;
