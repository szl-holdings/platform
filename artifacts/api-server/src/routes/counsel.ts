import {
  db,
  pcGcAuditEntriesTable,
  pcGcMattersTable,
  pcGcObligationsTable,
  pcGcProofChainEntriesTable,
} from '@szl-holdings/db';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import {
  counselAuditTrailQuerySchema,
  counselDeleteMatterBodySchema,
  counselProofChainQuerySchema,
  validateBody,
  validateQuery,
} from '../lib/validation';

const router: IRouter = Router();

type PartyRole =
  | 'client'
  | 'opposing-counsel'
  | 'regulator'
  | 'third-party'
  | 'expert'
  | 'co-counsel';
type MatterStatus = 'active' | 'pending' | 'closed' | 'escalated' | 'on-hold';
type MatterType =
  | 'litigation'
  | 'transaction'
  | 'regulatory'
  | 'employment'
  | 'ip'
  | 'real-estate'
  | 'contract';
type PrivilegeLevel = 'public' | 'confidential' | 'privileged' | 'restricted';
type ObligationStatus = 'pending' | 'in-progress' | 'complete' | 'overdue' | 'at-risk';
type AuditAction =
  | 'viewed'
  | 'edited'
  | 'exported'
  | 'redacted'
  | 'accessed-wall'
  | 'escalated'
  | 'deadline-updated'
  | 'privilege-changed';
type ProofEventType =
  | 'filing'
  | 'communication'
  | 'discovery'
  | 'order'
  | 'settlement'
  | 'hearing'
  | 'deadline'
  | 'expert-report';


/**
 * Resolves the org scope for a request from the authenticated session.
 * Returns null when the caller has no org membership; callers MUST surface
 * a 403 in that case so cross-org data is never leaked.
 */
function getOrgId(req: Request): string | null {
  const orgId = req.user?.orgs?.[0]?.orgId;
  if (orgId != null) return String(orgId);
  return null;
}

function requireOrgId(req: Request, res: Response): string | null {
  const orgId = getOrgId(req);
  if (!orgId) {
    sendForbidden(res, 'Organization membership required to access Counsel matters');
    return null;
  }
  return orgId;
}

async function loadMatter(matterId: string, orgId: string) {
  const [matter] = await db
    .select()
    .from(pcGcMattersTable)
    .where(and(eq(pcGcMattersTable.id, matterId), eq(pcGcMattersTable.orgId, orgId)));
  if (!matter) return null;
  const obligations = await db
    .select()
    .from(pcGcObligationsTable)
    .where(eq(pcGcObligationsTable.matterId, matterId))
    .orderBy(asc(pcGcObligationsTable.sortOrder));
  const auditTrail = await db
    .select()
    .from(pcGcAuditEntriesTable)
    .where(eq(pcGcAuditEntriesTable.matterId, matterId))
    .orderBy(asc(pcGcAuditEntriesTable.timestamp));
  const proofChain = await db
    .select()
    .from(pcGcProofChainEntriesTable)
    .where(eq(pcGcProofChainEntriesTable.matterId, matterId))
    .orderBy(asc(pcGcProofChainEntriesTable.timestamp));
  return {
    id: matter.id,
    name: matter.name,
    clientName: matter.clientName,
    matterNumber: matter.matterNumber,
    type: matter.type,
    status: matter.status,
    privilegeLevel: matter.privilegeLevel,
    pressureScore: matter.pressureScore,
    complexityScore: matter.complexityScore,
    openedDate: matter.openedDate,
    trialDate: matter.trialDate,
    closingDate: matter.closingDate,
    nextDeadline: matter.nextDeadline,
    nextDeadlineLabel: matter.nextDeadlineLabel,
    leadCounsel: matter.leadCounsel,
    jurisdiction: matter.jurisdiction,
    estimatedExposure:
      matter.estimatedExposure != null ? Number(matter.estimatedExposure) : undefined,
    summary: matter.summary,
    tags: matter.tags as string[],
    parties: matter.parties as unknown[],
    wall: matter.wall as unknown,
    obligations: obligations.map((o) => ({
      id: o.id,
      matterId: o.matterId,
      title: o.title,
      description: o.description,
      dueDate: o.dueDate,
      status: o.status,
      assignee: o.assignee,
      dependencies: o.dependencies as string[],
      privilegeLevel: o.privilegeLevel,
      filingRequired: o.filingRequired,
      courtId: o.courtId ?? undefined,
      consequence: o.consequence ?? undefined,
      completedDate: o.completedDate ?? undefined,
    })),
    auditTrail: auditTrail.map((a) => ({
      id: a.id,
      matterId: a.matterId,
      timestamp: a.timestamp.toISOString(),
      user: a.user,
      role: a.role,
      action: a.action,
      detail: a.detail,
      ip: a.ip,
    })),
    proofChain: proofChain.map((p) => ({
      id: p.id,
      matterId: p.matterId,
      timestamp: p.timestamp.toISOString(),
      eventType: p.eventType,
      title: p.title,
      summary: p.summary,
      privilegeLevel: p.privilegeLevel,
      author: p.author,
      parties: p.parties as string[],
      documentRef: p.documentRef ?? undefined,
      hash: p.hash ?? undefined,
      redacted: p.redacted,
    })),
  };
}

router.get('/counsel/matters', async (req: Request, res: Response) => {
  try {
    const orgId = requireOrgId(req, res);
    if (!orgId) return;
    const ids = await db
      .select({ id: pcGcMattersTable.id })
      .from(pcGcMattersTable)
      .where(eq(pcGcMattersTable.orgId, orgId));
    const matters = [];
    for (const { id } of ids) {
      const m = await loadMatter(id, orgId);
      if (m) matters.push(m);
    }
    sendSuccess(res, { matters, provenance: 'live' });
  } catch (err) {
    handleRouteError(res, err, 'GET /counsel/matters');
  }
});

const wallSchema = z.object({
  enabled: z.boolean(),
  reason: z.string(),
  blockedRoles: z.array(z.string()),
  approvedUsers: z.array(z.string()),
  createdAt: z.string(),
  createdBy: z.string(),
});
const partySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(['client', 'opposing-counsel', 'regulator', 'third-party', 'expert', 'co-counsel']),
  counsel: z.string().optional(),
  jurisdiction: z.string().optional(),
});
const matterCreateSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1),
  clientName: z.string().optional().default(''),
  matterNumber: z.string().min(1),
  type: z
    .enum(['litigation', 'transaction', 'regulatory', 'employment', 'ip', 'real-estate', 'contract'])
    .optional()
    .default('litigation'),
  status: z.enum(['active', 'pending', 'closed', 'escalated', 'on-hold']).optional().default('active'),
  privilegeLevel: z
    .enum(['public', 'confidential', 'privileged', 'restricted'])
    .optional()
    .default('confidential'),
  pressureScore: z.number().int().min(0).max(100).optional().default(50),
  complexityScore: z.number().int().min(0).max(100).optional().default(50),
  openedDate: z.string().min(1).optional(),
  trialDate: z.string().nullable().optional(),
  closingDate: z.string().nullable().optional(),
  nextDeadline: z.string().min(1).optional(),
  nextDeadlineLabel: z.string().min(1).optional().default('Upcoming Deadline'),
  leadCounsel: z.string().min(1),
  jurisdiction: z.string().min(1),
  estimatedExposure: z
    .union([
      z.number().refine((n) => Number.isFinite(n), { message: 'estimatedExposure must be a finite number' }),
      z
        .string()
        .transform((v) => (v === '' ? null : Number(v)))
        .refine((n) => n === null || Number.isFinite(n), { message: 'estimatedExposure must be a finite number' }),
    ])
    .nullable()
    .optional(),
  summary: z.string().min(1),
  tags: z.array(z.string()).optional().default([]),
  wall: wallSchema.optional(),
  parties: z.array(partySchema).optional().default([]),
});
const matterPatchSchema = matterCreateSchema.partial().omit({ id: true });

function genMatterId(): string {
  const yr = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  return `M-${yr}-${rand}`;
}

router.post(
  '/counsel/matters',
  validateBody(matterCreateSchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = requireOrgId(req, res);
      if (!orgId) return;
      const body = req.body as z.infer<typeof matterCreateSchema>;
      const id = body.id ?? genMatterId();
      const existing = await db
        .select({ id: pcGcMattersTable.id })
        .from(pcGcMattersTable)
        .where(and(eq(pcGcMattersTable.id, id), eq(pcGcMattersTable.orgId, orgId)))
        .limit(1);
      if (existing.length > 0) {
        sendBadRequest(res, 'Matter with this id already exists');
        return;
      }
      const todayStr = new Date().toISOString().split('T')[0] as string;
      const thirtyDaysStr = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] as string;
      const defaultWall = {
        enabled: false,
        reason: '',
        blockedRoles: [],
        approvedUsers: [],
        createdAt: '',
        createdBy: '',
      };
      await db.insert(pcGcMattersTable).values({
        id,
        orgId,
        name: body.name,
        clientName: body.clientName ?? '',
        matterNumber: body.matterNumber,
        type: body.type ?? 'litigation',
        status: body.status ?? 'active',
        privilegeLevel: body.privilegeLevel ?? 'confidential',
        pressureScore: body.pressureScore ?? 50,
        complexityScore: body.complexityScore ?? 50,
        openedDate: body.openedDate ?? todayStr,
        trialDate: body.trialDate ?? null,
        closingDate: body.closingDate ?? null,
        nextDeadline: body.nextDeadline ?? thirtyDaysStr,
        nextDeadlineLabel: body.nextDeadlineLabel ?? 'Upcoming Deadline',
        leadCounsel: body.leadCounsel,
        jurisdiction: body.jurisdiction,
        estimatedExposure: body.estimatedExposure != null ? String(body.estimatedExposure) : null,
        summary: body.summary,
        tags: body.tags ?? [],
        wall: body.wall ?? defaultWall,
        parties: body.parties ?? [],
      } as never);
      const m = await loadMatter(id, orgId);
      sendSuccess(res, m);
    } catch (err) {
      handleRouteError(res, err, 'POST /counsel/matters');
    }
  },
);

router.patch(
  '/counsel/matters/:id',
  validateBody(matterPatchSchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = requireOrgId(req, res);
      if (!orgId) return;
      const id = req.params.id as string;
      const body = req.body as z.infer<typeof matterPatchSchema>;
      const patch: Record<string, unknown> = { updatedAt: new Date() };
      for (const k of [
        'name',
        'clientName',
        'matterNumber',
        'type',
        'status',
        'privilegeLevel',
        'pressureScore',
        'complexityScore',
        'openedDate',
        'trialDate',
        'closingDate',
        'nextDeadline',
        'nextDeadlineLabel',
        'leadCounsel',
        'jurisdiction',
        'summary',
        'tags',
        'wall',
        'parties',
      ] as const) {
        if ((body as Record<string, unknown>)[k] !== undefined)
          patch[k] = (body as Record<string, unknown>)[k];
      }
      if (body.estimatedExposure !== undefined) {
        patch.estimatedExposure =
          body.estimatedExposure != null ? String(body.estimatedExposure) : null;
      }
      const [updated] = await db
        .update(pcGcMattersTable)
        .set(patch as never)
        .where(and(eq(pcGcMattersTable.id, id), eq(pcGcMattersTable.orgId, orgId)))
        .returning();
      if (!updated) {
        sendNotFound(res, 'Matter');
        return;
      }
      const m = await loadMatter(id, orgId);
      sendSuccess(res, m);
    } catch (err) {
      handleRouteError(res, err, 'PATCH /counsel/matters/:id');
    }
  },
);

router.delete(
  '/counsel/matters/:id',
  validateBody(counselDeleteMatterBodySchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = requireOrgId(req, res);
      if (!orgId) return;
      const id = req.params.id as string;
      const [deleted] = await db
        .delete(pcGcMattersTable)
        .where(and(eq(pcGcMattersTable.id, id), eq(pcGcMattersTable.orgId, orgId)))
        .returning();
      if (!deleted) {
        sendNotFound(res, 'Matter');
        return;
      }
      await db.delete(pcGcObligationsTable).where(eq(pcGcObligationsTable.matterId, id));
      await db.delete(pcGcAuditEntriesTable).where(eq(pcGcAuditEntriesTable.matterId, id));
      await db
        .delete(pcGcProofChainEntriesTable)
        .where(eq(pcGcProofChainEntriesTable.matterId, id));
      sendSuccess(res, { id, deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'DELETE /counsel/matters/:id');
    }
  },
);

router.get('/counsel/obligations', async (req: Request, res: Response) => {
  try {
    const orgId = requireOrgId(req, res);
    if (!orgId) return;
    const matterRows = await db
      .select({ id: pcGcMattersTable.id })
      .from(pcGcMattersTable)
      .where(eq(pcGcMattersTable.orgId, orgId));
    const matterIds = matterRows.map((r) => r.id);
    if (matterIds.length === 0) {
      sendSuccess(res, { obligations: [], provenance: 'live' });
      return;
    }
    const obligations = await db
      .select()
      .from(pcGcObligationsTable)
      .where(inArray(pcGcObligationsTable.matterId, matterIds))
      .orderBy(asc(pcGcObligationsTable.dueDate));
    sendSuccess(res, {
      obligations: obligations.map((o) => ({
        id: o.id,
        matterId: o.matterId,
        title: o.title,
        description: o.description,
        dueDate: o.dueDate,
        status: o.status,
        assignee: o.assignee,
        dependencies: o.dependencies as string[],
        privilegeLevel: o.privilegeLevel,
        filingRequired: o.filingRequired,
        courtId: o.courtId ?? undefined,
        consequence: o.consequence ?? undefined,
        completedDate: o.completedDate ?? undefined,
      })),
      provenance: 'live',
    });
  } catch (err) {
    handleRouteError(res, err, 'GET /counsel/obligations');
  }
});

router.get('/counsel/matters/:id', async (req: Request, res: Response) => {
  try {
    const orgId = requireOrgId(req, res);
    if (!orgId) return;
    const m = await loadMatter(req.params.id as string, orgId);
    if (!m) {
      sendNotFound(res, 'Matter');
      return;
    }
    sendSuccess(res, m);
  } catch (err) {
    handleRouteError(res, err, 'GET /counsel/matters/:id');
  }
});

const obligationPatchSchema = z.object({
  matterId: z.string().min(1),
  status: z.enum(['pending', 'in-progress', 'complete', 'overdue', 'at-risk']).optional(),
  completedDate: z.string().optional(),
  assignee: z.string().optional(),
  dueDate: z.string().optional(),
});

router.patch(
  '/counsel/obligations/:id',
  validateBody(obligationPatchSchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = requireOrgId(req, res);
      if (!orgId) return;
      const obligationId = req.params.id as string;
      const body = req.body as z.infer<typeof obligationPatchSchema>;
      const [matter] = await db
        .select({ id: pcGcMattersTable.id })
        .from(pcGcMattersTable)
        .where(and(eq(pcGcMattersTable.id, body.matterId), eq(pcGcMattersTable.orgId, orgId)));
      if (!matter) {
        sendNotFound(res, 'Matter');
        return;
      }
      const patch: Record<string, unknown> = { updatedAt: new Date() };
      if (body.status !== undefined) patch.status = body.status;
      if (body.completedDate !== undefined) patch.completedDate = body.completedDate;
      if (body.assignee !== undefined) patch.assignee = body.assignee;
      if (body.dueDate !== undefined) patch.dueDate = body.dueDate;
      const [updated] = await db
        .update(pcGcObligationsTable)
        .set(patch as never)
        .where(
          and(
            eq(pcGcObligationsTable.id, obligationId),
            eq(pcGcObligationsTable.matterId, body.matterId),
          ),
        )
        .returning();
      if (!updated) {
        sendNotFound(res, 'Obligation');
        return;
      }
      sendSuccess(res, {
        id: updated.id,
        matterId: updated.matterId,
        title: updated.title,
        description: updated.description,
        dueDate: updated.dueDate,
        status: updated.status,
        assignee: updated.assignee,
        dependencies: updated.dependencies as string[],
        privilegeLevel: updated.privilegeLevel,
        filingRequired: updated.filingRequired,
        courtId: updated.courtId ?? undefined,
        consequence: updated.consequence ?? undefined,
        completedDate: updated.completedDate ?? undefined,
      });
    } catch (err) {
      handleRouteError(res, err, 'PATCH /counsel/obligations/:id');
    }
  },
);

const auditAppendSchema = z.object({
  matterId: z.string().min(1),
  user: z.string().min(1),
  role: z.string().min(1),
  action: z.enum([
    'viewed',
    'edited',
    'exported',
    'redacted',
    'accessed-wall',
    'escalated',
    'deadline-updated',
    'privilege-changed',
  ]),
  detail: z.string().min(1).max(2000),
  ip: z.string().max(64).optional(),
});

router.post(
  '/counsel/audit-trail',
  validateBody(auditAppendSchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = requireOrgId(req, res);
      if (!orgId) return;
      const body = req.body as z.infer<typeof auditAppendSchema>;
      const [matter] = await db
        .select({ id: pcGcMattersTable.id })
        .from(pcGcMattersTable)
        .where(and(eq(pcGcMattersTable.id, body.matterId), eq(pcGcMattersTable.orgId, orgId)));
      if (!matter) {
        sendNotFound(res, 'Matter');
        return;
      }
      const id = `a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const [entry] = await db
        .insert(pcGcAuditEntriesTable)
        .values({
          id,
          matterId: body.matterId,
          timestamp: new Date(),
          user: body.user,
          role: body.role,
          action: body.action,
          detail: body.detail,
          ip: body.ip ?? '',
        })
        .returning();
      sendSuccess(
        res,
        {
          id: entry.id,
          matterId: entry.matterId,
          timestamp: entry.timestamp.toISOString(),
          user: entry.user,
          role: entry.role,
          action: entry.action,
          detail: entry.detail,
          ip: entry.ip,
        },
        201,
      );
    } catch (err) {
      handleRouteError(res, err, 'POST /counsel/audit-trail');
    }
  },
);

router.get(
  '/counsel/audit-trail',
  validateQuery(counselAuditTrailQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = requireOrgId(req, res);
      if (!orgId) return;
      const matterId = typeof req.query.matterId === 'string' ? req.query.matterId : null;
      const matterIds = await db
        .select({ id: pcGcMattersTable.id })
        .from(pcGcMattersTable)
        .where(eq(pcGcMattersTable.orgId, orgId));
      const allowed = new Set(matterIds.map((r) => r.id));
      if (matterId && !allowed.has(matterId)) {
        sendNotFound(res, 'Matter');
        return;
      }
      const rows = matterId
        ? await db
            .select()
            .from(pcGcAuditEntriesTable)
            .where(eq(pcGcAuditEntriesTable.matterId, matterId))
            .orderBy(desc(pcGcAuditEntriesTable.timestamp))
        : (
            await Promise.all(
              [...allowed].map((mid) =>
                db
                  .select()
                  .from(pcGcAuditEntriesTable)
                  .where(eq(pcGcAuditEntriesTable.matterId, mid)),
              ),
            )
          )
            .flat()
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      const entries = rows.map((a) => ({
        id: a.id,
        matterId: a.matterId,
        timestamp: a.timestamp.toISOString(),
        user: a.user,
        role: a.role,
        action: a.action,
        detail: a.detail,
        ip: a.ip,
      }));
      sendSuccess(res, { entries });
    } catch (err) {
      handleRouteError(res, err, 'GET /counsel/audit-trail');
    }
  },
);

const proofAppendSchema = z.object({
  matterId: z.string().min(1),
  eventType: z.enum([
    'filing',
    'communication',
    'discovery',
    'order',
    'settlement',
    'hearing',
    'deadline',
    'expert-report',
  ]),
  title: z.string().min(1).max(500),
  summary: z.string().min(1).max(5000),
  privilegeLevel: z.enum(['public', 'confidential', 'privileged', 'restricted']),
  author: z.string().min(1),
  parties: z.array(z.string()).default([]),
  documentRef: z.string().optional(),
  hash: z.string().optional(),
  redacted: z.boolean().optional(),
});

router.post(
  '/counsel/proof-chain',
  validateBody(proofAppendSchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = requireOrgId(req, res);
      if (!orgId) return;
      const body = req.body as z.infer<typeof proofAppendSchema>;
      const [matter] = await db
        .select({ id: pcGcMattersTable.id })
        .from(pcGcMattersTable)
        .where(and(eq(pcGcMattersTable.id, body.matterId), eq(pcGcMattersTable.orgId, orgId)));
      if (!matter) {
        sendNotFound(res, 'Matter');
        return;
      }
      const id = `pc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const [entry] = await db
        .insert(pcGcProofChainEntriesTable)
        .values({
          id,
          matterId: body.matterId,
          timestamp: new Date(),
          eventType: body.eventType,
          title: body.title,
          summary: body.summary,
          privilegeLevel: body.privilegeLevel,
          author: body.author,
          parties: body.parties,
          documentRef: body.documentRef ?? null,
          hash: body.hash ?? null,
          redacted: body.redacted ?? false,
        })
        .returning();
      sendSuccess(
        res,
        {
          id: entry.id,
          matterId: entry.matterId,
          timestamp: entry.timestamp.toISOString(),
          eventType: entry.eventType,
          title: entry.title,
          summary: entry.summary,
          privilegeLevel: entry.privilegeLevel,
          author: entry.author,
          parties: entry.parties as string[],
          documentRef: entry.documentRef ?? undefined,
          hash: entry.hash ?? undefined,
          redacted: entry.redacted,
        },
        201,
      );
    } catch (err) {
      handleRouteError(res, err, 'POST /counsel/proof-chain');
    }
  },
);

router.get(
  '/counsel/proof-chain',
  validateQuery(counselProofChainQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = requireOrgId(req, res);
      if (!orgId) return;
      const matterId = typeof req.query.matterId === 'string' ? req.query.matterId : null;
      if (!matterId) {
        sendBadRequest(res, 'matterId query parameter is required');
        return;
      }
      const [matter] = await db
        .select({ id: pcGcMattersTable.id })
        .from(pcGcMattersTable)
        .where(and(eq(pcGcMattersTable.id, matterId), eq(pcGcMattersTable.orgId, orgId)));
      if (!matter) {
        sendNotFound(res, 'Matter');
        return;
      }
      const rows = await db
        .select()
        .from(pcGcProofChainEntriesTable)
        .where(eq(pcGcProofChainEntriesTable.matterId, matterId))
        .orderBy(asc(pcGcProofChainEntriesTable.timestamp));
      const entries = rows.map((p) => ({
        id: p.id,
        matterId: p.matterId,
        timestamp: p.timestamp.toISOString(),
        eventType: p.eventType,
        title: p.title,
        summary: p.summary,
        privilegeLevel: p.privilegeLevel,
        author: p.author,
        parties: p.parties as string[],
        documentRef: p.documentRef ?? undefined,
        hash: p.hash ?? undefined,
        redacted: p.redacted,
      }));
      sendSuccess(res, { matterId, entries });
    } catch (err) {
      handleRouteError(res, err, 'GET /counsel/proof-chain');
    }
  },
);

const FORECAST_HEADS = [
  {
    headName: 'counsel:deadline-slippage',
    label: 'Deadline Slippage Risk',
    intervals: [
      { horizon: '7d', point: 0.42, lower: 0.27, upper: 0.59, confidence: 0.84, unit: 'score' },
      { horizon: '14d', point: 0.56, lower: 0.39, upper: 0.73, confidence: 0.78, unit: 'score' },
      { horizon: '30d', point: 0.67, lower: 0.49, upper: 0.83, confidence: 0.71, unit: 'score' },
    ],
    provenance: {
      modelId: 'safe-default-counsel:deadline-slippage',
      modelVersion: '0.1.0',
      adapterId: 'safe-default',
      generatedAt: new Date().toISOString(),
    },
    alertThreshold: 0.65,
    thresholdBreached: true,
  },
  {
    headName: 'counsel:filing-defect',
    label: 'Filing Defect Probability',
    intervals: [
      { horizon: '1d', point: 0.19, lower: 0.08, upper: 0.34, confidence: 0.91, unit: 'score' },
      { horizon: '7d', point: 0.31, lower: 0.18, upper: 0.46, confidence: 0.85, unit: 'score' },
      { horizon: '30d', point: 0.44, lower: 0.29, upper: 0.61, confidence: 0.78, unit: 'score' },
    ],
    provenance: {
      modelId: 'safe-default-counsel:filing-defect',
      modelVersion: '0.1.0',
      adapterId: 'safe-default',
      generatedAt: new Date().toISOString(),
    },
    alertThreshold: 0.5,
    thresholdBreached: false,
  },
  {
    headName: 'counsel:recovery',
    label: 'Recovery Likelihood',
    intervals: [
      { horizon: '30d', point: 0.52, lower: 0.37, upper: 0.67, confidence: 0.83, unit: 'score' },
      { horizon: '90d', point: 0.64, lower: 0.47, upper: 0.81, confidence: 0.77, unit: 'score' },
      { horizon: '180d', point: 0.72, lower: 0.54, upper: 0.88, confidence: 0.70, unit: 'score' },
    ],
    provenance: {
      modelId: 'safe-default-counsel:recovery',
      modelVersion: '0.1.0',
      adapterId: 'safe-default',
      generatedAt: new Date().toISOString(),
    },
    thresholdBreached: false,
  },
  {
    headName: 'counsel:staffing-pressure',
    label: 'Staffing Pressure Score',
    intervals: [
      { horizon: '7d', point: 0.58, lower: 0.43, upper: 0.73, confidence: 0.82, unit: 'score' },
      { horizon: '14d', point: 0.65, lower: 0.48, upper: 0.81, confidence: 0.76, unit: 'score' },
      { horizon: '30d', point: 0.74, lower: 0.56, upper: 0.90, confidence: 0.69, unit: 'score' },
    ],
    provenance: {
      modelId: 'safe-default-counsel:staffing-pressure',
      modelVersion: '0.1.0',
      adapterId: 'safe-default',
      generatedAt: new Date().toISOString(),
    },
    alertThreshold: 0.7,
    thresholdBreached: true,
  },
];

router.get('/counsel/forecast', (_req: Request, res: Response) => {
  sendSuccess(res, {
    heads: FORECAST_HEADS,
    generatedAt: new Date().toISOString(),
    adapter: 'safe-default',
    domain: 'counsel',
  });
});

export default router;
