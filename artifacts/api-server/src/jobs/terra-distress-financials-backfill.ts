import { logger } from '../lib/logger';
import {
  buildEstimateProvenance,
  estimateEncumbrance,
  type DistressType,
} from '../lib/terra-distress-encumbrance-estimator';

export interface BackfillRunResult {
  scanned: number;
  estimated: number;
  skipped: number;
  failed: number;
  encumbrancesAfterCoverage: number;
  totalActiveRows: number;
  durationMs: number;
}

interface BackfillRowSnapshot {
  id: number;
  distressType: string;
  estimatedValue: number;
  opportunityScore: number;
  connectorSource: string | null;
  daysInDistress: number | null;
  debtAmount: number | null;
  lienAmount: number | null;
  rawData: Record<string, unknown> | null;
}

const VALID_DISTRESS_TYPES: ReadonlySet<DistressType> = new Set([
  'pre-foreclosure',
  'foreclosure',
  'auction',
  'reo',
  'tax-lien',
  'expired-listing',
]);

function isDistressType(s: string): s is DistressType {
  return VALID_DISTRESS_TYPES.has(s as DistressType);
}

/**
 * Walks active terra_distress_properties rows whose debt+lien is missing or
 * zero, applies the heuristic encumbrance estimator, and persists the values
 * back to the row. Estimate provenance is recorded in rawData.financialsEstimate
 * so later real-filing ingestion can override without losing audit history.
 */
export async function runDistressFinancialsBackfill(): Promise<BackfillRunResult> {
  const start = Date.now();
  const { db, terraDistressPropertiesTable } = await import('@szl-holdings/db');
  const { and, eq, or, isNull, sql } = await import('drizzle-orm');

  const candidates = (await db
    .select({
      id: terraDistressPropertiesTable.id,
      distressType: terraDistressPropertiesTable.distressType,
      estimatedValue: terraDistressPropertiesTable.estimatedValue,
      opportunityScore: terraDistressPropertiesTable.opportunityScore,
      connectorSource: terraDistressPropertiesTable.connectorSource,
      daysInDistress: terraDistressPropertiesTable.daysInDistress,
      debtAmount: terraDistressPropertiesTable.debtAmount,
      lienAmount: terraDistressPropertiesTable.lienAmount,
      rawData: terraDistressPropertiesTable.rawData,
    })
    .from(terraDistressPropertiesTable)
    .where(
      and(
        eq(terraDistressPropertiesTable.isActive, true),
        or(
          isNull(terraDistressPropertiesTable.debtAmount),
          isNull(terraDistressPropertiesTable.lienAmount),
          sql`(COALESCE(${terraDistressPropertiesTable.debtAmount}, 0) + COALESCE(${terraDistressPropertiesTable.lienAmount}, 0)) = 0`,
        ),
      ),
    )) as unknown as BackfillRowSnapshot[];

  let estimated = 0;
  let skipped = 0;
  let failed = 0;
  const now = new Date();

  for (const row of candidates) {
    try {
      const distressType = String(row.distressType);
      if (!isDistressType(distressType)) {
        skipped++;
        continue;
      }
      const value = Number(row.estimatedValue);
      const score = Number(row.opportunityScore);
      const estimate = estimateEncumbrance({
        distressType,
        estimatedValue: value,
        opportunityScore: score,
        connectorSource: row.connectorSource,
        daysInDistress: row.daysInDistress,
      });
      if (!estimate) {
        skipped++;
        continue;
      }
      const provenance = buildEstimateProvenance(
        {
          distressType,
          estimatedValue: value,
          opportunityScore: score,
          connectorSource: row.connectorSource,
          daysInDistress: row.daysInDistress,
        },
        estimate,
        now,
      );
      const nextRaw = {
        ...(row.rawData ?? {}),
        financialsEstimate: provenance,
      };
      await db
        .update(terraDistressPropertiesTable)
        .set({
          debtAmount: String(estimate.debtAmount),
          lienAmount: String(estimate.lienAmount),
          rawData: nextRaw,
          updatedAt: new Date(),
        })
        .where(eq(terraDistressPropertiesTable.id, row.id));
      estimated++;
    } catch (err) {
      failed++;
      logger.warn({ err, rowId: row.id }, 'terra_distress_financials_backfill: row failed');
    }
  }

  // Coverage: how many active rows now carry encumbrance data.
  const [{ total = 0, covered = 0 } = { total: 0, covered: 0 }] = (await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      covered: sql<number>`SUM(CASE WHEN COALESCE(${terraDistressPropertiesTable.debtAmount}, 0) + COALESCE(${terraDistressPropertiesTable.lienAmount}, 0) > 0 THEN 1 ELSE 0 END)::int`,
    })
    .from(terraDistressPropertiesTable)
    .where(eq(terraDistressPropertiesTable.isActive, true))) as unknown as Array<{
    total: number;
    covered: number;
  }>;

  return {
    scanned: candidates.length,
    estimated,
    skipped,
    failed,
    encumbrancesAfterCoverage: Number(covered) || 0,
    totalActiveRows: Number(total) || 0,
    durationMs: Date.now() - start,
  };
}
