/**
 * Row-Level Security (RLS) Helpers
 *
 * Provides utility functions for multi-tenant data isolation using
 * PostgreSQL Row-Level Security combined with application-level guards.
 *
 * Strategy:
 *  1. Application-layer filtering (all Drizzle queries add org/tenant conditions)
 *  2. RLS policy helpers that generate consistent WHERE clauses
 *  3. Session variable injection for pg-native RLS policies (when configured)
 *  4. Audit trail for cross-tenant access attempts
 *
 * Usage:
 *   // Apply tenant filter to a query
 *   const rows = await db.select().from(table).where(tenantFilter(table, orgId));
 *
 *   // Verify a resource belongs to a tenant before mutating
 *   await assertTenantOwnership('vessel', vesselId, orgId);
 */

import { eq, and, type SQL, sql } from 'drizzle-orm';
import { logger } from './logger.js';

export type TenantId = number | string;

export interface TenantContext {
  orgId: TenantId;
  userId?: TenantId;
  roles?: string[];
}

/**
 * Returns true if the user context is a super_admin — bypasses all tenant filters.
 */
export function isSuperAdmin(ctx: TenantContext): boolean {
  return ctx.roles?.some((r) => r === 'super_admin') ?? false;
}

/**
 * Generates a Drizzle-compatible tenant filter for tables with an `orgId` column.
 *
 * Example:
 *   const rows = await db.select().from(myTable).where(
 *     tenantWhere(myTable.orgId, ctx.orgId)
 *   );
 */
export function tenantWhere(
  orgIdColumn: Parameters<typeof eq>[0],
  orgId: TenantId,
): SQL {
  return eq(orgIdColumn, typeof orgId === 'string' ? parseInt(orgId, 10) : orgId);
}

/**
 * Combines a tenant filter with additional conditions.
 *
 * Example:
 *   const rows = await db.select().from(vessels).where(
 *     withTenantFilter(vessels.orgId, ctx.orgId, eq(vessels.status, 'active'))
 *   );
 */
export function withTenantFilter(
  orgIdColumn: Parameters<typeof eq>[0],
  orgId: TenantId,
  ...additionalConditions: (SQL | undefined)[]
): SQL {
  const tenantCondition = tenantWhere(orgIdColumn, orgId);
  const extras = additionalConditions.filter(Boolean) as SQL[];
  return extras.length > 0 ? and(tenantCondition, ...extras)! : tenantCondition;
}

/**
 * Sets PostgreSQL session variables for RLS policies.
 * Call within a transaction before executing tenant-scoped queries.
 *
 * Requires: SET app.current_org_id = $1; SET app.current_user_id = $1;
 * These are consumed by pg RLS policies: USING (org_id = current_setting('app.current_org_id')::int)
 */
export async function setSessionTenantContext(
  db: { execute: (query: SQL) => Promise<unknown> },
  ctx: TenantContext,
): Promise<void> {
  const orgId = typeof ctx.orgId === 'string' ? parseInt(ctx.orgId, 10) : ctx.orgId;
  const userId = ctx.userId
    ? typeof ctx.userId === 'string'
      ? parseInt(ctx.userId, 10)
      : ctx.userId
    : null;

  await db.execute(
    sql`SELECT set_config('app.current_org_id', ${String(orgId)}, true),
               set_config('app.current_user_id', ${userId !== null ? String(userId) : ''}, true),
               set_config('app.is_super_admin', ${isSuperAdmin(ctx) ? 'true' : 'false'}, true)`,
  );
}

/**
 * Verifies that a resource belongs to a tenant before allowing mutation.
 * Throws an error if ownership cannot be confirmed.
 *
 * This is a defence-in-depth check — the primary enforcement is the
 * WHERE clause on the query. This function is for explicit verification
 * before destructive operations (deletes, bulk updates).
 */
export async function assertTenantOwnership(
  resourceType: string,
  resourceId: TenantId,
  orgId: TenantId,
  fetchFn: () => Promise<{ orgId?: number | null } | null>,
): Promise<void> {
  const resource = await fetchFn();

  if (!resource) {
    throw Object.assign(new Error(`${resourceType} not found`), { statusCode: 404 });
  }

  const resolvedOrgId = typeof orgId === 'string' ? parseInt(orgId, 10) : orgId;

  if (resource.orgId !== null && resource.orgId !== undefined && resource.orgId !== resolvedOrgId) {
    logger.warn(
      {
        resourceType,
        resourceId,
        attemptedOrgId: orgId,
        actualOrgId: resource.orgId,
      },
      '[rls] Cross-tenant access attempt blocked',
    );
    throw Object.assign(
      new Error(`Access denied: ${resourceType} does not belong to the requesting organization`),
      { statusCode: 403, code: 'TENANT_ISOLATION_VIOLATION' },
    );
  }
}

/**
 * Wraps a database operation with RLS context injection and error classification.
 * Logs cross-tenant access attempts and converts them to 403 errors.
 */
export async function withTenantGuard<T>(
  ctx: TenantContext,
  operation: string,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message.includes('rls') ||
        err.message.includes('row-level security') ||
        (err as { code?: string }).code === 'TENANT_ISOLATION_VIOLATION')
    ) {
      logger.error(
        { orgId: ctx.orgId, userId: ctx.userId, operation, error: err.message },
        '[rls] RLS violation detected',
      );
      throw Object.assign(new Error('Access denied'), { statusCode: 403, code: 'FORBIDDEN' });
    }
    throw err;
  }
}

/**
 * Generates a placeholder SQL fragment for RLS-aware queries.
 * Used for tables that don't have a direct orgId column but are
 * linked through a parent entity.
 *
 * Example: assessments.id IN (SELECT id FROM assessments WHERE org_id = $1)
 */
export function buildTenantSubquery(
  parentTable: string,
  parentIdColumn: string,
  orgIdColumn: string,
  orgId: TenantId,
): SQL {
  const resolvedOrgId = typeof orgId === 'string' ? parseInt(orgId, 10) : orgId;
  return sql`${sql.raw(parentIdColumn)} IN (
    SELECT id FROM ${sql.raw(parentTable)}
    WHERE ${sql.raw(orgIdColumn)} = ${resolvedOrgId}
  )`;
}
