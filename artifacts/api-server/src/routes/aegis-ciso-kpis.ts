/**
 * Aegis CISO KPI aggregation
 *
 * Provides a single live endpoint for the CISO Executive Dashboard so
 * the four headline tiles (Aggregate Risk, Open Critical Findings, Mean
 * Time to Respond, Compliance Posture) render real numbers when the
 * underlying signals are available — and degrade to `null` per-metric
 * (rather than failing the whole panel) when an individual source is
 * unreachable.
 *
 * Source mapping:
 *   - openCriticals          -> aegis_action_queue_items: priority='critical'
 *                               AND status != 'complete'
 *   - meanTimeToRespondMin   -> aegis_soar_runs: AVG(completed - started)
 *                               over last 7d for status='completed'
 *   - activeThreats          -> aegis_deception_hotpots: status='active'
 *                               + status='compromised' (weighted)
 *   - aggregateRisk          -> heuristic blend of openCriticals (4x),
 *                               activeThreats (2x), capped 0..100
 *   - compliancePct          -> guardian_policies: enabled / total * 100
 */
import {
  aegisActionQueueItemsTable,
  aegisDeceptionHotpotsTable,
  aegisSoarRunsTable,
  db,
  guardianPoliciesTable,
} from '@szl-holdings/db';
import { and, eq, gte, ne, sql } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { requireAnyAuth } from '../middlewares/auth';

const router: IRouter = Router();

router.get('/ciso-kpis', requireAnyAuth(), async (_req: Request, res: Response) => {
  try {
    // 1. Open critical findings — count of action-queue items at
    //    priority='critical' that have not yet reached 'complete'.
    const openCriticalsP = (async (): Promise<number | null> => {
      try {
        const [row] = await db
          .select({ n: sql<number>`COUNT(*)::int` })
          .from(aegisActionQueueItemsTable)
          .where(
            and(
              eq(aegisActionQueueItemsTable.priority, 'critical'),
              ne(aegisActionQueueItemsTable.status, 'complete'),
            ),
          );
        return Number(row?.n ?? 0);
      } catch (err) {
        logger.warn({ err }, 'ciso-kpis: openCriticals query failed');
        return null;
      }
    })();

    // 2. Mean time to respond — average minutes between started_at and
    //    completed_at for SOAR runs that completed in the last 7 days.
    //    Returns null when no completed runs exist in the window so the
    //    UI can render its illustrative fallback.
    const meanTimeToRespondMinP = (async (): Promise<number | null> => {
      try {
        const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000);
        const [row] = await db
          .select({
            avgMin: sql<number | null>`AVG(EXTRACT(EPOCH FROM (${aegisSoarRunsTable.completedAt} - ${aegisSoarRunsTable.startedAt})) / 60)::float`,
            total: sql<number>`COUNT(*)::int`,
          })
          .from(aegisSoarRunsTable)
          .where(
            and(
              eq(aegisSoarRunsTable.status, 'completed'),
              gte(aegisSoarRunsTable.startedAt, since7d),
            ),
          );
        const total = Number(row?.total ?? 0);
        if (total === 0 || row?.avgMin == null) return null;
        return Math.round(Number(row.avgMin));
      } catch (err) {
        logger.warn({ err }, 'ciso-kpis: meanTimeToRespond query failed');
        return null;
      }
    })();

    // 3. Active threats — honeypots in 'active' or 'compromised' state.
    //    Compromised honeypots count double when blending into the
    //    aggregate-risk score below, since they represent confirmed
    //    intrusion paths rather than monitored decoys.
    const threatCountsP = (async (): Promise<{
      activeThreats: number | null;
      compromised: number;
    }> => {
      try {
        const [row] = await db
          .select({
            active: sql<number>`COUNT(*) FILTER (WHERE ${aegisDeceptionHotpotsTable.status} = 'active')::int`,
            compromised: sql<number>`COUNT(*) FILTER (WHERE ${aegisDeceptionHotpotsTable.status} = 'compromised')::int`,
          })
          .from(aegisDeceptionHotpotsTable);
        const active = Number(row?.active ?? 0);
        const compromised = Number(row?.compromised ?? 0);
        return { activeThreats: active + compromised, compromised };
      } catch (err) {
        logger.warn({ err }, 'ciso-kpis: activeThreats query failed');
        return { activeThreats: null, compromised: 0 };
      }
    })();

    // 4. Compliance posture — percentage of guardian policies that are
    //    currently enabled. Returns null when no policies exist so the
    //    UI does not render a misleading 0%/100% on an empty table.
    const compliancePctP = (async (): Promise<number | null> => {
      try {
        const [row] = await db
          .select({
            total: sql<number>`COUNT(*)::int`,
            enabled: sql<number>`COUNT(*) FILTER (WHERE ${guardianPoliciesTable.enabled} = true)::int`,
          })
          .from(guardianPoliciesTable);
        const total = Number(row?.total ?? 0);
        const enabled = Number(row?.enabled ?? 0);
        if (total === 0) return null;
        return Math.round((enabled / total) * 100);
      } catch (err) {
        logger.warn({ err }, 'ciso-kpis: compliancePct query failed');
        return null;
      }
    })();

    const [openCriticals, meanTimeToRespondMin, threatCounts, compliancePct] = await Promise.all([
      openCriticalsP,
      meanTimeToRespondMinP,
      threatCountsP,
      compliancePctP,
    ]);

    // 5. Aggregate risk — heuristic blend; cap at 100. Built only from
    //    available signals so a single nullable component does not
    //    poison the overall score.
    let aggregateRisk: number | null = null;
    {
      const components: number[] = [];
      if (typeof openCriticals === 'number') components.push(openCriticals * 4);
      if (typeof threatCounts.activeThreats === 'number') {
        components.push(threatCounts.activeThreats * 2 + threatCounts.compromised * 6);
      }
      if (components.length > 0) {
        aggregateRisk = Math.max(0, Math.min(100, components.reduce((a, b) => a + b, 0)));
      }
    }

    sendSuccess(res, {
      aggregateRisk,
      activeThreats: threatCounts.activeThreats,
      openCriticals,
      meanTimeToRespondMin,
      compliancePct,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, 'aegis ciso-kpis error');
    handleRouteError(res, err, 'Failed to aggregate CISO KPIs');
  }
});

export default router;
