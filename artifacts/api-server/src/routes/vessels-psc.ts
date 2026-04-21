import {
  db,
  vesselsPscChecklistItemsTable,
  vesselsPscInspectionsTable,
  vesselsTable,
} from '@szl-holdings/db';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { type IRouter, type Request, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendCreated,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { authMiddleware, parseIdParam } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

const router: IRouter = Router();

// Org scoping helpers (match patterns in vessels-extended.ts).

async function getOrgVesselIds(orgId: number | undefined): Promise<number[] | null> {
  if (orgId === undefined) return null;
  const rows = await db
    .select({ id: vesselsTable.id })
    .from(vesselsTable)
    .where(eq(vesselsTable.orgId, orgId));
  return rows.map((r) => r.id);
}

async function getVesselInOrg(vesselId: number, orgId: number | undefined) {
  const condition =
    orgId !== undefined
      ? and(eq(vesselsTable.id, vesselId), eq(vesselsTable.orgId, orgId))
      : eq(vesselsTable.id, vesselId);
  const [vessel] = await db.select().from(vesselsTable).where(condition);
  return vessel ?? null;
}

function riskLevelFromScore(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 85) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// ── Fleet PSC profile (aggregate per vessel) ────────────────────────────────

router.get('/vessels/psc/profiles', authMiddleware(), tenantScope(), async (req, res) => {
  try {
    const orgVesselIds = await getOrgVesselIds(req.tenantOrgId);
    if (orgVesselIds !== null && orgVesselIds.length === 0) {
      sendSuccess(res, []);
      return;
    }

    const vesselsWhere =
      orgVesselIds === null ? undefined : inArray(vesselsTable.id, orgVesselIds);

    const vessels = await db
      .select({
        id: vesselsTable.id,
        name: vesselsTable.name,
        imo: vesselsTable.imo,
        flag: vesselsTable.flag,
      })
      .from(vesselsTable)
      .where(vesselsWhere)
      .orderBy(vesselsTable.name);

    if (vessels.length === 0) {
      sendSuccess(res, []);
      return;
    }

    const vesselIds = vessels.map((v) => v.id);

    // Pull all inspections for these vessels and aggregate in JS so the
    // response can carry derived fields (risk score, last inspection,
    // counts in time windows) without a heavy SQL window stack.
    const inspections = await db
      .select()
      .from(vesselsPscInspectionsTable)
      .where(inArray(vesselsPscInspectionsTable.vesselId, vesselIds))
      .orderBy(desc(vesselsPscInspectionsTable.inspectionDate));

    const now = Date.now();
    const ms90 = 90 * 86400_000;
    const ms365 = 365 * 86400_000;

    const byVessel = new Map<number, typeof inspections>();
    for (const insp of inspections) {
      const list = byVessel.get(insp.vesselId);
      if (list) list.push(insp);
      else byVessel.set(insp.vesselId, [insp]);
    }

    const profiles = vessels.map((v) => {
      const vinsp = byVessel.get(v.id) ?? [];
      const recent90 = vinsp.filter(
        (i) => now - new Date(i.inspectionDate).getTime() <= ms90,
      );
      const recent365 = vinsp.filter(
        (i) => now - new Date(i.inspectionDate).getTime() <= ms365,
      );
      const inspections90d = recent90.length;
      const deficiencies90d = recent90.reduce((a, i) => a + (i.deficienciesCount ?? 0), 0);
      const detentions12m = recent365.filter((i) => i.detained).length;
      const last = vinsp[0];

      // Risk score: blend of recent deficiency density and detention history.
      const detentionWeight = Math.min(detentions12m * 35, 70);
      const defWeight = Math.min(deficiencies90d * 5, 30);
      const baseRisk = Math.min(detentionWeight + defWeight, 100);
      // Add a small flag-state penalty for known higher-risk MOU regimes.
      const flagPenalty = ['Marshall Islands', 'Liberia', 'Panama'].includes(v.flag ?? '')
        ? 5
        : 0;
      const detentionRisk = Math.min(baseRisk + flagPenalty, 100);

      return {
        vesselId: v.id,
        vessel: v.name,
        imo: v.imo,
        flag: v.flag,
        detentionRisk,
        detentionRiskLevel: riskLevelFromScore(detentionRisk),
        inspections90d,
        deficiencies90d,
        detentions12m,
        lastInspection: last?.inspectionDate ?? null,
        lastInspectionPort: last?.port ?? null,
        lastInspectionResult: last?.result ?? null,
        lastInspectionRegime: last?.mouRegime ?? null,
      };
    });

    // Sort highest risk first to match how operators read the list.
    profiles.sort((a, b) => b.detentionRisk - a.detentionRisk);

    sendSuccess(res, profiles);
  } catch (err) {
    handleRouteError(res, err, 'Failed to load PSC profiles');
  }
});

// ── Per-vessel inspection history ───────────────────────────────────────────

router.get(
  '/vessels/:id/psc/inspections',
  authMiddleware(),
  tenantScope(),
  async (req, res) => {
    try {
      const vesselId = parseIdParam(req.params.id);
      const vessel = await getVesselInOrg(vesselId, req.tenantOrgId);
      if (!vessel) {
        sendNotFound(res, 'Vessel');
        return;
      }
      const rows = await db
        .select()
        .from(vesselsPscInspectionsTable)
        .where(eq(vesselsPscInspectionsTable.vesselId, vesselId))
        .orderBy(desc(vesselsPscInspectionsTable.inspectionDate))
        .limit(50);
      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, 'Failed to load PSC inspections');
    }
  },
);

// ── Per-vessel checklist (for next port call) ───────────────────────────────

const DEFAULT_CHECKLIST: Array<{ category: string; status: 'pass' | 'fail' | 'action_required' }> =
  [
    { category: 'ISM Code — SMS Manual', status: 'pass' },
    { category: 'Fire Detection System', status: 'pass' },
    { category: 'MARPOL — Oil Record Book current', status: 'pass' },
    { category: 'Life Saving Appliances', status: 'pass' },
    { category: 'ISPS Documentation', status: 'pass' },
    { category: 'Navigation Equipment', status: 'pass' },
    { category: 'Crew Certificates', status: 'pass' },
  ];

async function ensureChecklistForVessel(vesselId: number, orgId: number | null | undefined) {
  const existing = await db
    .select({ id: vesselsPscChecklistItemsTable.id })
    .from(vesselsPscChecklistItemsTable)
    .where(eq(vesselsPscChecklistItemsTable.vesselId, vesselId))
    .limit(1);
  if (existing.length > 0) return;
  await db.insert(vesselsPscChecklistItemsTable).values(
    DEFAULT_CHECKLIST.map((item, idx) => ({
      vesselId,
      orgId: orgId ?? null,
      category: item.category,
      status: item.status,
      sortOrder: idx,
    })),
  );
}

router.get('/vessels/:id/psc/checklist', authMiddleware(), tenantScope(), async (req, res) => {
  try {
    const vesselId = parseIdParam(req.params.id);
    const vessel = await getVesselInOrg(vesselId, req.tenantOrgId);
    if (!vessel) {
      sendNotFound(res, 'Vessel');
      return;
    }
    await ensureChecklistForVessel(vesselId, vessel.orgId ?? null);
    const rows = await db
      .select()
      .from(vesselsPscChecklistItemsTable)
      .where(eq(vesselsPscChecklistItemsTable.vesselId, vesselId))
      .orderBy(asc(vesselsPscChecklistItemsTable.sortOrder), asc(vesselsPscChecklistItemsTable.id));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, 'Failed to load PSC checklist');
  }
});

const patchChecklistSchema = z
  .object({
    status: z.enum(['pass', 'fail', 'action_required']).optional(),
    note: z.string().max(2000).nullable().optional(),
  })
  .strict();

const createChecklistSchema = z
  .object({
    category: z.string().min(1).max(200),
    status: z.enum(['pass', 'fail', 'action_required']).default('pass'),
    note: z.string().max(2000).nullable().optional(),
  })
  .strict();

router.patch(
  '/vessels/psc/checklist/:itemId',
  authMiddleware(),
  tenantScope(),
  async (req: Request, res) => {
    try {
      const itemId = parseIdParam(req.params.itemId);
      const parse = patchChecklistSchema.safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({
          error: `Validation error: ${parse.error.issues
            .map((i) => `${(i.path ?? []).join('.') || '(root)'}: ${i.message}`)
            .join('; ')}`,
        });
        return;
      }
      const patch = parse.data;
      if (Object.keys(patch).length === 0) {
        res.status(400).json({ error: 'At least one field is required for update' });
        return;
      }
      const [existing] = await db
        .select()
        .from(vesselsPscChecklistItemsTable)
        .where(eq(vesselsPscChecklistItemsTable.id, itemId));
      if (!existing) {
        sendNotFound(res, 'Checklist item');
        return;
      }
      const vessel = await getVesselInOrg(existing.vesselId, req.tenantOrgId);
      if (!vessel) {
        sendNotFound(res, 'Checklist item');
        return;
      }
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (patch.status !== undefined) updateData.status = patch.status;
      if (patch.note !== undefined) updateData.note = patch.note;
      const userId = (req as Request & { user?: { id?: number } }).user?.id;
      if (typeof userId === 'number') updateData.updatedBy = userId;

      const [row] = await db
        .update(vesselsPscChecklistItemsTable)
        .set(updateData)
        .where(eq(vesselsPscChecklistItemsTable.id, itemId))
        .returning();
      sendSuccess(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update checklist item');
    }
  },
);

router.post(
  '/vessels/:id/psc/checklist',
  authMiddleware(),
  tenantScope(),
  validateBody(createChecklistSchema),
  async (req: Request, res) => {
    try {
      const vesselId = parseIdParam(req.params.id);
      const vessel = await getVesselInOrg(vesselId, req.tenantOrgId);
      if (!vessel) {
        sendNotFound(res, 'Vessel');
        return;
      }
      const body = req.body as z.infer<typeof createChecklistSchema>;
      const [maxRow] = await db
        .select({ maxOrder: sql<number>`coalesce(max(${vesselsPscChecklistItemsTable.sortOrder}), -1)::int` })
        .from(vesselsPscChecklistItemsTable)
        .where(eq(vesselsPscChecklistItemsTable.vesselId, vesselId));
      const nextOrder = (maxRow?.maxOrder ?? -1) + 1;
      const userId = (req as Request & { user?: { id?: number } }).user?.id;
      const [row] = await db
        .insert(vesselsPscChecklistItemsTable)
        .values({
          vesselId,
          orgId: vessel.orgId ?? null,
          category: body.category,
          status: body.status,
          note: body.note ?? null,
          sortOrder: nextOrder,
          updatedBy: typeof userId === 'number' ? userId : null,
        })
        .returning();
      sendCreated(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create checklist item');
    }
  },
);

export default router;
