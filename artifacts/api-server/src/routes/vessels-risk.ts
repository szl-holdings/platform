/**
 * Vessels A11oy — Risk snapshot (Transformation) route (Task #5318).
 *
 * GET  /vessels/risk             — latest risk snapshots per fleet/vessel
 *      ?fleetRef=...   — narrow to a fleet
 *      ?vesselImo=...  — narrow to a single vessel
 * POST /vessels/risk             — compute + persist a perturbation-bound
 *                                  snapshot for a fleet (or single vessel)
 *
 * Uses the Phase-2 perturbation-bound formula:
 *
 *   perturbationBound = clamp( Σ factor_i · weight_i , 0, 1 )
 *
 * `factors` is an arbitrary JSON map of {key → number in [0,1]} provided by
 * the caller (signal layer is upstream of this endpoint). Severity is
 * derived from the bound: ≥0.75 critical, ≥0.5 elevated, ≥0.25 watch,
 * else normal. Snapshots are append-only.
 */
import { createHash } from 'node:crypto';
import { db } from '@szl-holdings/db';
import { and, desc, eq, type SQL } from 'drizzle-orm';
import { type IRouter, type Request, Router } from 'express';
import { z } from 'zod';
import { vesselsA11oyRiskSnapshotTable } from '../db/schema/vessels';
import { handleRouteError, sendCreated, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

const router: IRouter = Router();

const riskInputSchema = z.object({
  fleetRef: z.string().min(1).max(80),
  vesselImo: z.string().min(1).max(32).optional(),
  factors: z.record(z.string(), z.number().min(0).max(1)).default({}),
  weights: z.record(z.string(), z.number().min(0).max(1)).optional(),
});

export type RiskComputeResult = {
  perturbationBound: number;
  severity: 'normal' | 'watch' | 'elevated' | 'critical';
  receiptHash: string;
};

export function computePerturbationBound(
  factors: Record<string, number>,
  weights?: Record<string, number>,
): RiskComputeResult {
  let weighted = 0;
  let totalWeight = 0;
  for (const [k, v] of Object.entries(factors)) {
    const w = weights?.[k] ?? 1;
    weighted += v * w;
    totalWeight += w;
  }
  const bound = totalWeight > 0 ? Math.min(1, Math.max(0, weighted / totalWeight)) : 0;
  const severity: RiskComputeResult['severity'] =
    bound >= 0.75 ? 'critical' : bound >= 0.5 ? 'elevated' : bound >= 0.25 ? 'watch' : 'normal';
  const receiptHash = createHash('sha256')
    .update(JSON.stringify({ factors, weights: weights ?? null, bound }))
    .digest('hex');
  return { perturbationBound: bound, severity, receiptHash };
}

router.get(
  '/vessels/risk',
  authMiddleware({ required: false }),
  tenantScope({ required: false }),
  async (req: Request, res) => {
    try {
      const fleetRef = typeof req.query.fleetRef === 'string' ? req.query.fleetRef : undefined;
      const vesselImo = typeof req.query.vesselImo === 'string' ? req.query.vesselImo : undefined;

      const filters: SQL[] = [];
      if (req.tenantOrgId !== undefined)
        filters.push(eq(vesselsA11oyRiskSnapshotTable.orgId, req.tenantOrgId));
      if (fleetRef) filters.push(eq(vesselsA11oyRiskSnapshotTable.fleetRef, fleetRef));
      if (vesselImo) filters.push(eq(vesselsA11oyRiskSnapshotTable.vesselImo, vesselImo));

      const where = filters.length > 0 ? and(...filters) : undefined;
      const rows = where
        ? await db
            .select()
            .from(vesselsA11oyRiskSnapshotTable)
            .where(where)
            .orderBy(desc(vesselsA11oyRiskSnapshotTable.computedAt))
            .limit(500)
        : await db
            .select()
            .from(vesselsA11oyRiskSnapshotTable)
            .orderBy(desc(vesselsA11oyRiskSnapshotTable.computedAt))
            .limit(500);
      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list A11oy risk snapshots');
    }
  },
);

router.post(
  '/vessels/risk',
  authMiddleware(),
  tenantScope({ required: true }),
  requireRole('ops', 'exec', 'admin', 'editor'),
  validateBody(riskInputSchema),
  async (req: Request, res) => {
    try {
      const data = riskInputSchema.parse(req.body);
      const result = computePerturbationBound(data.factors, data.weights);
      const [row] = await db
        .insert(vesselsA11oyRiskSnapshotTable)
        .values({
          fleetRef: data.fleetRef,
          vesselImo: data.vesselImo,
          perturbationBound: result.perturbationBound,
          severity: result.severity,
          factors: { factors: data.factors, weights: data.weights ?? null },
          receiptHash: result.receiptHash,
          orgId: req.tenantOrgId ?? null,
        })
        .returning();
      sendCreated(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to compute A11oy risk snapshot');
    }
  },
);

export default router;
