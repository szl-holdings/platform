/**
 * Vessels A11oy — Positions (Substance state-log) route (Task #5318).
 *
 * GET  /vessels/positions               — list latest positions (org-scoped)
 *      ?fleetRef=...    — narrow to a fleet
 *      ?vesselImo=...   — narrow to a single vessel
 *      ?limit=N         — cap rows (default 200, max 2000)
 * POST /vessels/positions               — append a position to the state-log
 *
 * Each row records a Substance (vessel) state observation under its
 * Anatomy (fleet). The log is append-only; mutations are not exposed.
 */
import { db } from '@szl-holdings/db';
import { and, desc, eq, type SQL } from 'drizzle-orm';
import { type IRouter, type Request, Router } from 'express';
import { z } from 'zod';
import { vesselsA11oyPositionLogTable } from '../db/schema/vessels';
import { handleRouteError, sendCreated, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

const router: IRouter = Router();

const positionInsertSchema = z.object({
  fleetRef: z.string().min(1).max(80),
  vesselImo: z.string().min(1).max(32),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speedKnots: z.number().min(0).max(80).optional(),
  headingDeg: z.number().min(0).max(360).optional(),
  source: z.string().min(1).max(40).optional(),
  recordedAt: z.string().datetime().optional(),
});

router.get(
  '/vessels/positions',
  authMiddleware({ required: false }),
  tenantScope({ required: false }),
  async (req: Request, res) => {
    try {
      const fleetRef = typeof req.query.fleetRef === 'string' ? req.query.fleetRef : undefined;
      const vesselImo = typeof req.query.vesselImo === 'string' ? req.query.vesselImo : undefined;
      const rawLimit = Number(req.query.limit);
      const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 2000) : 200;

      const filters: SQL[] = [];
      if (req.tenantOrgId !== undefined)
        filters.push(eq(vesselsA11oyPositionLogTable.orgId, req.tenantOrgId));
      if (fleetRef) filters.push(eq(vesselsA11oyPositionLogTable.fleetRef, fleetRef));
      if (vesselImo) filters.push(eq(vesselsA11oyPositionLogTable.vesselImo, vesselImo));

      const where = filters.length > 0 ? and(...filters) : undefined;
      const rows = where
        ? await db
            .select()
            .from(vesselsA11oyPositionLogTable)
            .where(where)
            .orderBy(desc(vesselsA11oyPositionLogTable.recordedAt))
            .limit(limit)
        : await db
            .select()
            .from(vesselsA11oyPositionLogTable)
            .orderBy(desc(vesselsA11oyPositionLogTable.recordedAt))
            .limit(limit);
      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list A11oy positions');
    }
  },
);

router.post(
  '/vessels/positions',
  authMiddleware(),
  tenantScope({ required: true }),
  requireRole('ops', 'exec', 'admin', 'editor'),
  validateBody(positionInsertSchema),
  async (req: Request, res) => {
    try {
      const data = positionInsertSchema.parse(req.body);
      const [row] = await db
        .insert(vesselsA11oyPositionLogTable)
        .values({
          fleetRef: data.fleetRef,
          vesselImo: data.vesselImo,
          latitude: data.latitude,
          longitude: data.longitude,
          speedKnots: data.speedKnots,
          headingDeg: data.headingDeg,
          source: data.source ?? 'ais',
          recordedAt: data.recordedAt ? new Date(data.recordedAt) : new Date(),
          orgId: req.tenantOrgId ?? null,
        })
        .returning();
      sendCreated(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to record A11oy position');
    }
  },
);

export default router;
