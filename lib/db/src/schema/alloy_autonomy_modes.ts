import { sql } from 'drizzle-orm';
import { index, integer, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

/**
 * Per-tenant + per-domain autonomy mode for Alloy side-effecting workflow steps.
 *
 * Backs the Express routes:
 *   - GET   /api/alloy/autonomy-mode
 *   - PATCH /api/alloy/autonomy-mode
 *   - POST  /api/alloy/autonomy-mode/evaluate
 *
 * NULL `tenantOrgId` represents a global/default mode (no specific tenant).
 * Two partial unique indexes are used because Postgres treats NULLs as distinct
 * in a regular UNIQUE constraint.
 */
export const alloyAutonomyModesTable = pgTable(
  'alloy_autonomy_modes',
  {
    id: serial('id').primaryKey(),
    // Intentionally not a foreign key to organizations: this is a denormalized
    // settings store and we want it to remain queryable even when an org row
    // is missing (e.g. test fixtures, tenant-less callers).
    tenantOrgId: integer('tenant_org_id'),
    domain: text('domain').notNull(),
    mode: text('mode', {
      enum: ['observe', 'recommend', 'draft', 'ask-to-act', 'approved-act'],
    })
      .notNull()
      .default('ask-to-act'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text('updated_by'),
    reason: text('reason'),
  },
  (table) => [
    uniqueIndex('alloy_autonomy_modes_tenant_domain_uniq')
      .on(table.tenantOrgId, table.domain)
      .where(sql`tenant_org_id IS NOT NULL`),
    uniqueIndex('alloy_autonomy_modes_global_domain_uniq')
      .on(table.domain)
      .where(sql`tenant_org_id IS NULL`),
    index('alloy_autonomy_modes_tenant_idx').on(table.tenantOrgId),
  ],
);
