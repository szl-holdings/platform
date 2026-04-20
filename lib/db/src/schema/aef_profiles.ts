import { boolean, jsonb, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * profile_registry_pointers
 *
 * Persists the active AEF domain-profile pointer per (tenantId, domain) so that
 * tenant-scoped profile rotations and rollbacks performed via
 * `DomainProfileRegistry.rotate_profile_version` / `rollback` survive API server
 * restarts. Without this table the in-memory registry silently resets every
 * tenant back to the default profile version on each reboot.
 *
 * The full rotation history is stored as JSON so that `rollback` can deterministically
 * restore the previous version after a process restart, mirroring the in-memory
 * `TenantProfilePointer.history` shape.
 */
export const profileRegistryPointersTable = pgTable(
  'profile_registry_pointers',
  {
    tenantId: text('tenant_id').notNull(),
    domain: text('domain').notNull(),
    activeProfileId: text('active_profile_id').notNull(),
    activeVersion: text('active_version').notNull(),
    history: jsonb('history').notNull().default([]),
    rollbackAvailable: boolean('rollback_available').notNull().default(false),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.tenantId, t.domain] }),
  }),
);

export type ProfileRegistryPointerRow = typeof profileRegistryPointersTable.$inferSelect;
export type InsertProfileRegistryPointer = typeof profileRegistryPointersTable.$inferInsert;
