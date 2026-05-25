/**
 * Vessels A11oy — Coexistence (Connection-level Transformation) route
 * (Task #5318).
 *
 * GET  /vessels/coexistence          — list persisted coexistence reports
 *      ?fleetRef=... | ?routeId=...
 * POST /vessels/coexistence          — compute + persist a new report
 *
 * Applies the Phase-2 null-space-projection lemma: given an RF utilization
 * vector u and a set of band weights w, the projection onto the null space
 * of w yields a residual interference vector r, and the scalar
 * interference score is ‖r‖₂ / ‖u‖₂ ∈ [0,1]. Reports persist the bands,
 * the projection, and the score so the Vessels frontend can render a
 * coexistence verdict per-route.
 */
import { createHash } from 'node:crypto';
import { db } from '@szl-holdings/db';
import { and, desc, eq, type SQL } from 'drizzle-orm';
import { type IRouter, type Request, Router } from 'express';
import { z } from 'zod';
import {
  type CoexistenceBand,
  vesselsA11oyCoexistenceReportTable,
} from '../db/schema/vessels';
import { handleRouteError, sendCreated, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

const router: IRouter = Router();

const bandSchema = z.object({
  band: z.string().min(1).max(40),
  utilization: z.number().min(0).max(1),
});

const coexistenceInputSchema = z.object({
  fleetRef: z.string().min(1).max(80),
  routeId: z.number().int().positive().optional(),
  bands: z.array(bandSchema).min(1).max(32),
  bandWeights: z.array(z.number().min(0).max(1)).optional(),
});

export type CoexistenceComputeResult = {
  projection: number[];
  interferenceScore: number;
  receiptHash: string;
};

/**
 * Null-space projection: r = u − ((u·w)/(w·w)) · w. Returns the residual
 * (rejection of u onto w) and the scalar interference score ‖r‖₂ / ‖u‖₂.
 * When all weights are zero, the residual equals u and the score is 1.
 */
export function nullSpaceProject(
  bands: CoexistenceBand[],
  weights?: number[],
): CoexistenceComputeResult {
  const u = bands.map((b) => b.utilization);
  const w = weights && weights.length === u.length ? weights : u.map(() => 1 / u.length);
  const ww = w.reduce((s, x) => s + x * x, 0);
  const uw = u.reduce((s, x, i) => s + x * w[i], 0);
  const proj = ww > 0 ? uw / ww : 0;
  const residual = u.map((x, i) => x - proj * w[i]);
  const uNorm = Math.sqrt(u.reduce((s, x) => s + x * x, 0));
  const rNorm = Math.sqrt(residual.reduce((s, x) => s + x * x, 0));
  const score = uNorm > 0 ? Math.min(1, Math.max(0, rNorm / uNorm)) : 0;
  const receiptHash = createHash('sha256')
    .update(JSON.stringify({ u, w, residual, score }))
    .digest('hex');
  return { projection: residual, interferenceScore: score, receiptHash };
}

router.get(
  '/vessels/coexistence',
  authMiddleware({ required: false }),
  tenantScope({ required: false }),
  async (req: Request, res) => {
    try {
      const fleetRef = typeof req.query.fleetRef === 'string' ? req.query.fleetRef : undefined;
      const routeIdRaw = req.query.routeId ? Number(req.query.routeId) : undefined;
      const routeId =
        routeIdRaw !== undefined && Number.isInteger(routeIdRaw) && routeIdRaw > 0
          ? routeIdRaw
          : undefined;

      const filters: SQL[] = [];
      if (req.tenantOrgId !== undefined)
        filters.push(eq(vesselsA11oyCoexistenceReportTable.orgId, req.tenantOrgId));
      if (fleetRef) filters.push(eq(vesselsA11oyCoexistenceReportTable.fleetRef, fleetRef));
      if (routeId !== undefined)
        filters.push(eq(vesselsA11oyCoexistenceReportTable.routeId, routeId));

      const where = filters.length > 0 ? and(...filters) : undefined;
      const rows = where
        ? await db
            .select()
            .from(vesselsA11oyCoexistenceReportTable)
            .where(where)
            .orderBy(desc(vesselsA11oyCoexistenceReportTable.computedAt))
            .limit(200)
        : await db
            .select()
            .from(vesselsA11oyCoexistenceReportTable)
            .orderBy(desc(vesselsA11oyCoexistenceReportTable.computedAt))
            .limit(200);
      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list A11oy coexistence reports');
    }
  },
);

router.post(
  '/vessels/coexistence',
  authMiddleware(),
  tenantScope({ required: true }),
  requireRole('ops', 'exec', 'admin', 'editor'),
  validateBody(coexistenceInputSchema),
  async (req: Request, res) => {
    try {
      const data = coexistenceInputSchema.parse(req.body);
      const result = nullSpaceProject(data.bands, data.bandWeights);
      const [row] = await db
        .insert(vesselsA11oyCoexistenceReportTable)
        .values({
          fleetRef: data.fleetRef,
          routeId: data.routeId ?? null,
          rfBands: data.bands,
          nullSpaceProjection: result.projection,
          interferenceScore: result.interferenceScore,
          receiptHash: result.receiptHash,
          orgId: req.tenantOrgId ?? null,
        })
        .returning();
      sendCreated(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to compute A11oy coexistence report');
    }
  },
);

export default router;
