/**
 * DOMAINE real estate intelligence repository — typed query helpers.
 * Uses @szl-holdings/db as the single relational entry point.
 */
import { db } from '@szl-holdings/db';

export const terraRepo = {
  async getPropertyCount(orgId?: number): Promise<number> {
    const query = orgId
      ? `SELECT COUNT(*) AS count FROM terra_properties WHERE org_id = ${orgId}`
      : 'SELECT COUNT(*) AS count FROM terra_properties';
    const result = await db.execute<{ count: string }>(query);
    return Number(result.rows[0]?.count ?? 0);
  },

  async getOpenDealCount(orgId?: number): Promise<number> {
    const query = orgId
      ? `SELECT COUNT(*) AS count FROM terra_deals WHERE org_id = ${orgId} AND stage NOT IN ('closed', 'lost')`
      : "SELECT COUNT(*) AS count FROM terra_deals WHERE stage NOT IN ('closed', 'lost')";
    const result = await db.execute<{ count: string }>(query);
    return Number(result.rows[0]?.count ?? 0);
  },
};
