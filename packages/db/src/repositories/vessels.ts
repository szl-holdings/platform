/**
 * SEXTANT maritime intelligence repository — typed query helpers.
 * Uses @szl-holdings/db as the single relational entry point.
 */
import { db } from '@szl-holdings/db';

export const vesselsRepo = {
  async getVesselCount(orgId?: number): Promise<number> {
    const query = orgId
      ? `SELECT COUNT(*) AS count FROM vessels_vessels WHERE org_id = ${orgId}`
      : 'SELECT COUNT(*) AS count FROM vessels_vessels';
    const result = await db.execute<{ count: string }>(query);
    return Number(result.rows[0]?.count ?? 0);
  },

  async getActiveVesselIds(orgId?: number, limit = 50): Promise<number[]> {
    const query = orgId
      ? `SELECT id FROM vessels_vessels WHERE org_id = ${orgId} AND is_active = true ORDER BY id LIMIT ${limit}`
      : `SELECT id FROM vessels_vessels WHERE is_active = true ORDER BY id LIMIT ${limit}`;
    const result = await db.execute<{ id: number }>(query);
    return result.rows.map((r) => r.id);
  },

  async getRecentAnomalyCount(orgId?: number): Promise<number> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const query = orgId
      ? `SELECT COUNT(*) AS count FROM vessels_anomalies WHERE org_id = ${orgId} AND detected_at >= '${since}'`
      : `SELECT COUNT(*) AS count FROM vessels_anomalies WHERE detected_at >= '${since}'`;
    const result = await db.execute<{ count: string }>(query);
    return Number(result.rows[0]?.count ?? 0);
  },
};
