/**
 * Persisted state for the Command portal's directive cascade, coalition
 * partners, and strategic reserve drawdowns.
 *
 * Previously these surfaces stored data in the browser's localStorage so a
 * user opening the Command center on another device or browser saw none of
 * their changes. These tables back the same surfaces with PostgreSQL so the
 * data is durable and shared across any device.
 *
 * Tenant scoping mirrors the convention from `command_inbox_alert_states`:
 * the row carries a `tenant_id` text column that defaults to the
 * GLOBAL_TENANT_SENTINEL string for unauthenticated / demo callers, so the
 * unique index works without Postgres NULL semantics.
 */

import { index, integer, jsonb, pgTable, real, text, timestamp } from 'drizzle-orm/pg-core';
import { GLOBAL_TENANT_SENTINEL } from './command_inbox_alert_states.js';

export const commandDirectivesTable = pgTable(
  'command_directives',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull().default(GLOBAL_TENANT_SENTINEL),
    title: text('title').notNull(),
    body: text('body').notNull(),
    priority: text('priority').notNull(),
    status: text('status').notNull(),
    classification: text('classification').notNull(),
    issuedBy: text('issued_by').notNull(),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull(),
    cascadedTo: jsonb('cascaded_to').notNull().$type<string[]>().default([]),
    tags: jsonb('tags').notNull().$type<string[]>().default([]),
    cascadeCount: integer('cascade_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('command_directives_tenant_idx').on(t.tenantId),
  }),
);

export const commandCoalitionPartnersTable = pgTable(
  'command_coalition_partners',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull().default(GLOBAL_TENANT_SENTINEL),
    name: text('name').notNull(),
    role: text('role').notNull(),
    domain: text('domain').notNull(),
    trustScore: integer('trust_score').notNull(),
    status: text('status').notNull(),
    classification: text('classification').notNull(),
    lastContact: timestamp('last_contact', { withTimezone: true }).notNull(),
    notes: text('notes').notNull().default(''),
    alerts: integer('alerts').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('command_coalition_partners_tenant_idx').on(t.tenantId),
  }),
);

export const commandReservePoolsTable = pgTable(
  'command_reserve_pools',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull().default(GLOBAL_TENANT_SENTINEL),
    name: text('name').notNull(),
    category: text('category').notNull(),
    totalCapacity: real('total_capacity').notNull(),
    currentLevel: real('current_level').notNull(),
    unit: text('unit').notNull(),
    status: text('status').notNull(),
    classification: text('classification').notNull(),
    lastDrawdown: timestamp('last_drawdown', { withTimezone: true }),
    notes: text('notes').notNull().default(''),
    trendHistory: jsonb('trend_history')
      .notNull()
      .$type<{ date: string; level: number }[]>()
      .default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('command_reserve_pools_tenant_idx').on(t.tenantId),
  }),
);

export const commandDrawdownRequestsTable = pgTable(
  'command_drawdown_requests',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull().default(GLOBAL_TENANT_SENTINEL),
    poolId: text('pool_id').notNull(),
    amount: real('amount').notNull(),
    justification: text('justification').notNull(),
    requestedBy: text('requested_by').notNull(),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull(),
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('command_drawdown_requests_tenant_idx').on(t.tenantId),
    poolIdx: index('command_drawdown_requests_pool_idx').on(t.poolId),
  }),
);

export type CommandDirective = typeof commandDirectivesTable.$inferSelect;
export type CommandCoalitionPartner = typeof commandCoalitionPartnersTable.$inferSelect;
export type CommandReservePool = typeof commandReservePoolsTable.$inferSelect;
export type CommandDrawdownRequest = typeof commandDrawdownRequestsTable.$inferSelect;
