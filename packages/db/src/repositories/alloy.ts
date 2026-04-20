/**
 * Alloy workflow engine repository — typed query helpers.
 * Uses @szl-holdings/db as the single relational entry point.
 *
 * Note: Full workflow/approval CRUD is handled in artifacts/api-server/src/routes/alloy.ts.
 * This repository exposes read-optimized helpers for cross-domain consumers.
 */
import { db } from '@szl-holdings/db';
import { and, desc, eq, inArray } from 'drizzle-orm';

// raw-sql: workflow tables were added via canonical.ts; use direct db access with typed selects
export const alloyRepo = {
  async getRecentWorkflowCount(orgId: number): Promise<number> {
    const result = await db.execute<{ count: string }>(
      `SELECT COUNT(*) AS count FROM workflows WHERE org_id = ${orgId}`,
    );
    const row = result.rows[0];
    return Number(row?.count ?? 0);
  },

  async getPendingApprovalCount(orgId: number): Promise<number> {
    const result = await db.execute<{ count: string }>(
      `SELECT COUNT(*) AS count FROM alloy_approvals WHERE org_id = ${orgId} AND status = 'pending'`,
    );
    const row = result.rows[0];
    return Number(row?.count ?? 0);
  },

  async getRecentFailedJobs(
    orgId: number,
    limitN = 10,
  ): Promise<Array<{ id: number; type: string; error: string | null; createdAt: Date }>> {
    const result = await db.execute<{
      id: number;
      type: string;
      error: string | null;
      created_at: Date;
    }>(
      `SELECT id, type, error, created_at FROM alloy_runs
       WHERE org_id = ${orgId} AND status = 'failed'
       ORDER BY created_at DESC
       LIMIT ${limitN}`,
    );
    return result.rows.map((r) => ({
      id: r.id,
      type: r.type,
      error: r.error,
      createdAt: r.created_at,
    }));
  },
};
