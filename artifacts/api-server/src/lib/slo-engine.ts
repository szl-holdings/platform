/**
 * SLO Engine — background job that computes SLO compliance, error budget
 * burn rate, and fires Prism Bus alerts when burn rate exceeds thresholds.
 *
 * Burn-rate model (Google SRE Book §5 — multi-window):
 *   burnRate = actualErrorFraction / allowedErrorFraction
 *   where "error fraction" is defined per metric type:
 *
 *   availability : actualErrorFraction = errorRatePct/100
 *                  allowedErrorFraction = (100 - targetValue)/100
 *
 *   error_rate   : actualErrorFraction = errorRatePct/100
 *                  allowedErrorFraction = targetValue/100  (target IS the allowed rate)
 *
 *   latency_p95  : actualErrorFraction = count(latency > targetMs) / totalRequests
 *                  allowedErrorFraction = 0.05  (5 % of requests may exceed target)
 *   latency_p99  : allowedErrorFraction = 0.01
 *   latency_p50  : allowedErrorFraction = 0.50
 *
 * Alert thresholds:
 *   burnRate in 1h window  > 14.4 → page (fast burn)
 *   burnRate in 6h window  >  6.0 → page
 *   burnRate in 24h window >  3.0 → ticket
 */

import { db, sloDefinitionsTable, sloMeasurementsTable } from '@szl-holdings/db';
import { prismBus } from '@szl-holdings/prism-bus';
import { eq } from 'drizzle-orm';
import { logger } from './logger';
import {
  getAllGroupStats,
  pruneOldSamples,
  type WindowStats,
  type ServiceGroup,
} from './sli-collector';

export interface SloComplianceResult {
  serviceGroup: string;
  metricType: string;
  target: number;
  windowHours: number;
  compliancePct: number;
  errorBudgetRemainingPct: number;
  burnRate1h: number | null;
  burnRate6h: number | null;
  burnRate24h: number | null;
  requestCount: number;
  errorCount: number;
  p50Ms: number | null;
  p95Ms: number | null;
  p99Ms: number | null;
  alertFired: boolean;
  measuredAt: string;
}

const BURN_RATE_PAGE_1H = 14.4;
const BURN_RATE_PAGE_6H = 6.0;
const BURN_RATE_TICKET_24H = 3.0;

/**
 * Returns the allowed error fraction for this SLO type.
 * This is the fraction of requests allowed to "fail" the SLO per the target.
 */
function allowedErrorFraction(metricType: string, targetValue: number): number {
  switch (metricType) {
    case 'availability':
      // targetValue = 99.9 → allowed = 0.1% = 0.001
      return Math.max(0, (100 - targetValue) / 100);
    case 'error_rate':
      // targetValue = 0.1 → allowed error rate = 0.1% = 0.001
      return Math.max(0, targetValue / 100);
    case 'latency_p50':
      return 0.5;
    case 'latency_p95':
      return 0.05;
    case 'latency_p99':
      return 0.01;
    default:
      return 0;
  }
}

/**
 * Returns the actual error fraction observed in the given stats window.
 */
function actualErrorFraction(metricType: string, targetValue: number, stats: WindowStats): number {
  if (stats.requestCount === 0) return 0;

  if (metricType === 'availability' || metricType === 'error_rate') {
    return stats.errorRatePct / 100;
  }

  if (metricType.startsWith('latency_')) {
    const lats = stats.sortedLatencies;
    if (lats.length === 0) return 0;
    const slowCount = lats.reduce((n, l) => n + (l > targetValue ? 1 : 0), 0);
    return slowCount / lats.length;
  }

  return 0;
}

/**
 * Burn rate = actual / allowed error fraction.
 * burnRate < 1 → consuming budget slower than expected (healthy)
 * burnRate = 1 → exactly on pace (will exhaust budget in exactly windowHours)
 * burnRate > 14.4 in 1h → fast-burn page alert
 */
function burnRate(metricType: string, targetValue: number, stats: WindowStats | null): number | null {
  if (!stats || stats.requestCount === 0) return null;
  const allowed = allowedErrorFraction(metricType, targetValue);
  if (allowed <= 0) return null;
  return actualErrorFraction(metricType, targetValue, stats) / allowed;
}

interface MetricSnapshot {
  compliancePct: number;
  errorBudgetRemainingPct: number;
  burnRate1h: number | null;
  burnRate6h: number | null;
  burnRate24h: number | null;
}

function computeSnapshot(
  def: { metricType: string; targetValue: number },
  stats1h: WindowStats | null,
  stats6h: WindowStats | null,
  stats24h: WindowStats | null,
): MetricSnapshot {
  const br1h = burnRate(def.metricType, def.targetValue, stats1h);
  const br6h = burnRate(def.metricType, def.targetValue, stats6h);
  const br24h = burnRate(def.metricType, def.targetValue, stats24h);

  // compliancePct: human-readable SLO compliance score, 0-100
  let compliancePct = 100;
  if (stats24h && stats24h.requestCount > 0) {
    if (def.metricType === 'availability') {
      // Direct availability percentage
      compliancePct = stats24h.availabilityPct;
    } else if (def.metricType === 'error_rate') {
      // 100 = at or under the error rate target; approaches 0 as rate grows above target
      const actualRate = stats24h.errorRatePct;
      compliancePct = actualRate <= def.targetValue
        ? 100
        : Math.max(0, (def.targetValue / actualRate) * 100);
    } else if (def.metricType.startsWith('latency_')) {
      // Fraction of requests that meet the latency target, normalized to 0-100
      const lats = stats24h.sortedLatencies;
      if (lats.length > 0) {
        const underTarget = lats.reduce((n, l) => n + (l <= def.targetValue ? 1 : 0), 0);
        compliancePct = (underTarget / lats.length) * 100;
      }
    }
  }

  // errorBudgetRemainingPct: 100 = no budget consumed, 0 = fully consumed/exceeded
  // Uses the 24h burn rate as a proxy; if no data, full budget remains.
  const br24hForBudget = br24h ?? 0;
  const errorBudgetRemainingPct = Math.max(0, Math.min(100, (1 - br24hForBudget) * 100));

  return {
    compliancePct: Math.max(0, Math.min(100, compliancePct)),
    errorBudgetRemainingPct,
    burnRate1h: br1h,
    burnRate6h: br6h,
    burnRate24h: br24h,
  };
}

export async function runSloComputation(): Promise<{ computed: number; alertsFired: number }> {
  pruneOldSamples();

  let computed = 0;
  let alertsFired = 0;

  try {
    const definitions = await db
      .select()
      .from(sloDefinitionsTable)
      .where(eq(sloDefinitionsTable.enabled, true));

    if (definitions.length === 0) return { computed: 0, alertsFired: 0 };

    const allStats = getAllGroupStats();
    const now = new Date();

    for (const def of definitions) {
      try {
        const group = def.serviceGroup as ServiceGroup;
        const stats24h = allStats[group]?.h24 ?? null;
        const stats1h = allStats[group]?.h1 ?? null;
        const stats6h = allStats[group]?.h6 ?? null;

        if (!stats24h || stats24h.requestCount === 0) {
          // No data: persist a no-data snapshot and continue
          await db.insert(sloMeasurementsTable).values({
            sloDefinitionId: def.id,
            serviceGroup: def.serviceGroup,
            metricType: def.metricType,
            windowHours: 24,
            compliancePct: 100,
            errorBudgetRemainingPct: 100,
            requestCount: 0,
            errorCount: 0,
            alertFired: false,
            measuredAt: now,
          });
          computed++;
          continue;
        }

        const snap = computeSnapshot(def, stats1h, stats6h, stats24h);

        const alertFired =
          (snap.burnRate1h !== null && snap.burnRate1h > BURN_RATE_PAGE_1H) ||
          (snap.burnRate6h !== null && snap.burnRate6h > BURN_RATE_PAGE_6H) ||
          (snap.burnRate24h !== null && snap.burnRate24h > BURN_RATE_TICKET_24H);

        await db.insert(sloMeasurementsTable).values({
          sloDefinitionId: def.id,
          serviceGroup: def.serviceGroup,
          metricType: def.metricType,
          windowHours: 24,
          compliancePct: snap.compliancePct,
          errorBudgetRemainingPct: snap.errorBudgetRemainingPct,
          burnRate1h: snap.burnRate1h ?? undefined,
          burnRate6h: snap.burnRate6h ?? undefined,
          burnRate24h: snap.burnRate24h ?? undefined,
          requestCount: stats24h.requestCount,
          errorCount: stats24h.errorCount,
          p50Ms: stats24h.p50Ms ?? undefined,
          p95Ms: stats24h.p95Ms ?? undefined,
          p99Ms: stats24h.p99Ms ?? undefined,
          alertFired,
          measuredAt: now,
        });

        computed++;

        if (alertFired) {
          alertsFired++;
          fireBurnRateAlert({
            serviceGroup: def.serviceGroup,
            metricType: def.metricType,
            target: def.targetValue,
            compliancePct: snap.compliancePct,
            errorBudgetRemainingPct: snap.errorBudgetRemainingPct,
            burnRate1h: snap.burnRate1h,
            burnRate6h: snap.burnRate6h,
            burnRate24h: snap.burnRate24h,
          });
        }
      } catch (err) {
        logger.warn({ err, sloId: def.id, service: def.serviceGroup }, '[slo-engine] Failed to compute SLO measurement (non-fatal)');
      }
    }

    // After all 24h snapshots, compute 30-day rolling compliance from persisted DB records.
    // This is durable across process restarts and reflects the true SLO window.
    await computeAndStore30dRollingCompliance(definitions, now);

    await pruneOldMeasurements();
  } catch (err) {
    logger.error({ err }, '[slo-engine] SLO computation run failed');
  }

  return { computed, alertsFired };
}

/**
 * Compute a 30-day rolling compliance snapshot from persisted slo_measurements.
 * Stores window_hours=720 records that survive process restarts — these are the
 * authoritative 30-day SLO compliance values shown on the dashboard.
 */
async function computeAndStore30dRollingCompliance(
  definitions: { id: number; serviceGroup: string; metricType: string; targetValue: number }[],
  now: Date,
): Promise<void> {
  try {
    const { pool } = await import('@szl-holdings/db');

    for (const def of definitions) {
      try {
        const result = await pool.query<{
          avg_compliance: number;
          avg_budget_remaining: number;
          avg_burn_rate_24h: number | null;
          sample_count: number;
          min_compliance: number;
        }>(`
          SELECT
            ROUND(AVG(compliance_pct)::numeric, 4)            AS avg_compliance,
            ROUND(AVG(error_budget_remaining_pct)::numeric, 4) AS avg_budget_remaining,
            ROUND(AVG(burn_rate_24h)::numeric, 4)             AS avg_burn_rate_24h,
            COUNT(*)                                          AS sample_count,
            ROUND(MIN(compliance_pct)::numeric, 4)            AS min_compliance
          FROM slo_measurements
          WHERE slo_definition_id = $1
            AND window_hours = 24
            AND measured_at > NOW() - INTERVAL '30 days'
        `, [def.id]);

        const row = result.rows[0];
        if (!row || Number(row.sample_count) === 0) continue;

        await db.insert(sloMeasurementsTable).values({
          sloDefinitionId: def.id,
          serviceGroup: def.serviceGroup,
          metricType: def.metricType,
          windowHours: 720,
          compliancePct: Number(row.avg_compliance),
          errorBudgetRemainingPct: Number(row.avg_budget_remaining),
          burnRate24h: row.avg_burn_rate_24h !== null ? Number(row.avg_burn_rate_24h) : undefined,
          requestCount: 0,
          errorCount: 0,
          alertFired: false,
          measuredAt: now,
        });
      } catch {
        // Non-fatal: 30d snapshot failure must not break the 24h cycle
      }
    }
  } catch (err) {
    logger.warn({ err }, '[slo-engine] Failed to compute 30-day rolling compliance (non-fatal)');
  }
}

function fireBurnRateAlert(params: {
  serviceGroup: string;
  metricType: string;
  target: number;
  compliancePct: number;
  errorBudgetRemainingPct: number;
  burnRate1h: number | null;
  burnRate6h: number | null;
  burnRate24h: number | null;
}): void {
  try {
    const severity: 'critical' | 'high' =
      (params.burnRate1h !== null && params.burnRate1h > BURN_RATE_PAGE_1H) ||
      (params.burnRate6h !== null && params.burnRate6h > BURN_RATE_PAGE_6H)
        ? 'critical'
        : 'high';

    prismBus.publish({
      id: `slo-burn-${params.serviceGroup}-${params.metricType}-${Date.now()}`,
      type: 'domain_signal',
      domain: 'global',
      sourceId: 'slo-engine',
      severity,
      timestamp: Date.now(),
      payload: {
        alertType: 'slo_burn_rate',
        serviceGroup: params.serviceGroup,
        metricType: params.metricType,
        target: params.target,
        compliancePct: params.compliancePct,
        errorBudgetRemainingPct: params.errorBudgetRemainingPct,
        burnRate1h: params.burnRate1h,
        burnRate6h: params.burnRate6h,
        burnRate24h: params.burnRate24h,
        message: `SLO burn rate alert: ${params.serviceGroup}/${params.metricType} — error budget at ${params.errorBudgetRemainingPct.toFixed(1)}%`,
      },
    });

    logger.warn(
      {
        serviceGroup: params.serviceGroup,
        metricType: params.metricType,
        compliancePct: params.compliancePct,
        errorBudgetRemainingPct: params.errorBudgetRemainingPct,
        burnRate1h: params.burnRate1h,
        burnRate6h: params.burnRate6h,
        burnRate24h: params.burnRate24h,
        severity,
      },
      '[slo-engine] SLO burn rate alert fired',
    );
  } catch {
    // Non-fatal
  }
}

async function pruneOldMeasurements(): Promise<void> {
  try {
    const { pool } = await import('@szl-holdings/db');
    await pool.query(
      `DELETE FROM slo_measurements WHERE measured_at < NOW() - INTERVAL '90 days'`,
    );
  } catch (err) {
    logger.warn({ err }, '[slo-engine] Failed to prune old SLO measurements (non-fatal)');
  }
}

export function startSloComputationScheduler(intervalMs = 5 * 60 * 1000): NodeJS.Timeout {
  logger.info({ intervalMs }, '[slo-engine] Starting SLO computation scheduler');
  const timer = setInterval(() => {
    runSloComputation()
      .then(({ computed, alertsFired }) => {
        logger.info({ computed, alertsFired }, '[slo-engine] SLO computation cycle complete');
      })
      .catch((err) => {
        logger.warn({ err }, '[slo-engine] SLO computation cycle failed (non-fatal)');
      });
  }, intervalMs);
  timer.unref();
  return timer;
}
