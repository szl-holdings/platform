/**
 * Vessels A11oy — Fleet (Anatomy) route (Task #5318).
 *
 * GET  /vessels/fleet         — list fleets visible to the requesting org
 * POST /vessels/fleet         — create a new fleet (Anatomy instantiation)
 *
 * Each row in `vessels_a11oy_fleet` is an Anatomy in the A11oy primitive
 * model. The row's `anatomy_seal` is the receipt-hash binding all
 * subordinate Substance / Connection / Transformation rows back to this
 * Anatomy.
 */
import { db } from '@szl-holdings/db';
import { and, desc, eq } from 'drizzle-orm';
import { type IRouter, type Request, Router } from 'express';
import { z } from 'zod';
import { vesselsA11oyFleetTable } from '../db/schema/vessels';
import { handleRouteError, sendCreated, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

const router: IRouter = Router();

const createFleetSchema = z.object({
  fleetRef: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  operator: z.string().min(1).max(200).optional(),
  vesselCount: z.number().int().nonnegative().optional(),
  anatomySeal: z.string().min(1).max(128).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

router.get(
  '/vessels/fleet',
  authMiddleware({ required: false }),
  tenantScope({ required: false }),
  async (req: Request, res) => {
    try {
      const where =
        req.tenantOrgId !== undefined
          ? eq(vesselsA11oyFleetTable.orgId, req.tenantOrgId)
          : undefined;
      const rows = where
        ? await db
            .select()
            .from(vesselsA11oyFleetTable)
            .where(where)
            .orderBy(desc(vesselsA11oyFleetTable.createdAt))
        : await db
            .select()
            .from(vesselsA11oyFleetTable)
            .orderBy(desc(vesselsA11oyFleetTable.createdAt));
      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list A11oy fleets');
    }
  },
);

router.post(
  '/vessels/fleet',
  authMiddleware(),
  tenantScope({ required: true }),
  requireRole('ops', 'exec', 'admin', 'editor'),
  validateBody(createFleetSchema),
  async (req: Request, res) => {
    try {
      const data = createFleetSchema.parse(req.body);
      const condition = and(
        eq(vesselsA11oyFleetTable.fleetRef, data.fleetRef),
        eq(vesselsA11oyFleetTable.orgId, req.tenantOrgId as number),
      );
      const [existing] = await db
        .select()
        .from(vesselsA11oyFleetTable)
        .where(condition);
      if (existing) {
        sendSuccess(res, existing);
        return;
      }
      const [row] = await db
        .insert(vesselsA11oyFleetTable)
        .values({
          fleetRef: data.fleetRef,
          name: data.name,
          operator: data.operator,
          vesselCount: data.vesselCount ?? 0,
          anatomySeal: data.anatomySeal,
          metadata: data.metadata ?? null,
          orgId: req.tenantOrgId ?? null,
        })
        .returning();
      sendCreated(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create A11oy fleet');
    }
  },
);

export default router;
