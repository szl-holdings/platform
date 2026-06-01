/**
 * Aegis / Aegis security operations repository — typed query helpers.
 * Uses @szl-holdings/db as the single relational entry point.
 */
import { db } from '@szl-holdings/db';

export const firestormRepo = {
  async getOpenIncidentCount(orgId?: number): Promise<number> {
    const query = orgId
      ? `SELECT COUNT(*) AS count FROM firestorm_incidents WHERE org_id = ${orgId} AND status NOT IN ('resolved', 'post_mortem')`
      : "SELECT COUNT(*) AS count FROM firestorm_incidents WHERE status NOT IN ('resolved', 'post_mortem')";
    const result = await db.execute<{ count: string }>(query);
    return Number(result.rows[0]?.count ?? 0);
  },

  async getCriticalThreatCount(orgId?: number): Promise<number> {
    const query = orgId
      ? `SELECT COUNT(*) AS count FROM firestorm_threats WHERE org_id = ${orgId} AND severity = 'critical' AND status = 'active'`
      : "SELECT COUNT(*) AS count FROM firestorm_threats WHERE severity = 'critical' AND status = 'active'";
    const result = await db.execute<{ count: string }>(query);
    return Number(result.rows[0]?.count ?? 0);
  },
};
