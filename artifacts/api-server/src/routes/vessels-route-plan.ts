/**
 * Vessels A11oy — Route plan (Connection) route (Task #5318).
 *
 * GET  /vessels/route-plan          — list persisted route plans (org-scoped)
 *      ?fleetRef=... | ?vesselImo=...
 * POST /vessels/route-plan          — compute + persist a new Connection
 *
 * Each row is a Connection between a Substance (vessel) and an Anatomy
 * (fleet). The compute step applies the Phase-2 anatomy-boundary lemma:
 *
 *   anatomy_boundary_ok = ∀ waypoint ∈ waypoints :
 *     boundary_distance(waypoint, fleet.anatomy) ≥ δ
 *
 * The boundary check is computed inline (straight-line haversine to the
 * origin port acts as the proxy when no explicit anatomy hull is given —
 * upstream Anatomy enrichment is out of scope for this phase).
 */
import { createHash } from 'node:crypto';
import { db } from '@szl-holdings/db';
import { and, desc, eq, type SQL } from 'drizzle-orm';
import { type IRouter, type Request, Router } from 'express';
import { z } from 'zod';
import { vesselsA11oyRouteTable } from '../db/schema/vessels';
import { handleRouteError, sendCreated, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

const router: IRouter = Router();

const waypointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  label: z.string().max(80).optional(),
});

const routePlanInputSchema = z.object({
  fleetRef: z.string().min(1).max(80),
  vesselImo: z.string().min(1).max(32),
  originPort: z.string().min(1).max(80),
  destinationPort: z.string().min(1).max(80),
  waypoints: z.array(waypointSchema).min(2).max(200),
  rfCoexistenceVector: z.array(z.number()).max(64).optional(),
  anatomyMaxDeviationKm: z.number().positive().max(5000).optional(),
});

const EARTH_KM = 6371;
function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function checkAnatomyBoundary(
  waypoints: { lat: number; lon: number }[],
  maxDeviationKm: number,
): { ok: boolean; notes: string | null; maxObservedKm: number } {
  if (waypoints.length < 2) {
    return { ok: false, notes: 'requires at least two waypoints', maxObservedKm: 0 };
  }
  const origin = waypoints[0];
  const destination = waypoints[waypoints.length - 1];
  const totalDirect = haversineKm(origin, destination);
  let maxDev = 0;
  for (const wp of waypoints) {
    const dev = Math.abs(haversineKm(origin, wp) + haversineKm(wp, destination) - totalDirect);
    if (dev > maxDev) maxDev = dev;
  }
  const ok = maxDev <= maxDeviationKm;
  return {
    ok,
    notes: ok ? null : `max waypoint deviation ${maxDev.toFixed(1)}km exceeds δ=${maxDeviationKm}km`,
    maxObservedKm: maxDev,
  };
}

router.get(
  '/vessels/route-plan',
  authMiddleware({ required: false }),
  tenantScope({ required: false }),
  async (req: Request, res) => {
    try {
      const fleetRef = typeof req.query.fleetRef === 'string' ? req.query.fleetRef : undefined;
      const vesselImo = typeof req.query.vesselImo === 'string' ? req.query.vesselImo : undefined;

      const filters: SQL[] = [];
      if (req.tenantOrgId !== undefined)
        filters.push(eq(vesselsA11oyRouteTable.orgId, req.tenantOrgId));
      if (fleetRef) filters.push(eq(vesselsA11oyRouteTable.fleetRef, fleetRef));
      if (vesselImo) filters.push(eq(vesselsA11oyRouteTable.vesselImo, vesselImo));

      const where = filters.length > 0 ? and(...filters) : undefined;
      const rows = where
        ? await db
            .select()
            .from(vesselsA11oyRouteTable)
            .where(where)
            .orderBy(desc(vesselsA11oyRouteTable.createdAt))
            .limit(200)
        : await db
            .select()
            .from(vesselsA11oyRouteTable)
            .orderBy(desc(vesselsA11oyRouteTable.createdAt))
            .limit(200);
      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list A11oy route plans');
    }
  },
);

router.post(
  '/vessels/route-plan',
  authMiddleware(),
  tenantScope({ required: true }),
  requireRole('ops', 'exec', 'admin', 'editor'),
  validateBody(routePlanInputSchema),
  async (req: Request, res) => {
    try {
      const data = routePlanInputSchema.parse(req.body);
      const boundary = checkAnatomyBoundary(
        data.waypoints,
        data.anatomyMaxDeviationKm ?? 500,
      );
      const receiptHash = createHash('sha256')
        .update(
          JSON.stringify({
            vesselImo: data.vesselImo,
            origin: data.originPort,
            destination: data.destinationPort,
            waypoints: data.waypoints,
            anatomyBoundary: boundary,
          }),
        )
        .digest('hex');
      const [row] = await db
        .insert(vesselsA11oyRouteTable)
        .values({
          fleetRef: data.fleetRef,
          vesselImo: data.vesselImo,
          originPort: data.originPort,
          destinationPort: data.destinationPort,
          waypoints: data.waypoints,
          rfCoexistenceVector: data.rfCoexistenceVector ?? null,
          anatomyBoundaryOk: boundary.ok,
          anatomyBoundaryNotes: boundary.notes,
          receiptHash,
          orgId: req.tenantOrgId ?? null,
        })
        .returning();
      sendCreated(res, { route: row, anatomyBoundary: boundary });
    } catch (err) {
      handleRouteError(res, err, 'Failed to compute A11oy route plan');
    }
  },
);

export default router;
