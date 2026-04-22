import { bodyShape } from '@szl-holdings/contracts/common';
import {
  alloyAuditLogTable,
  db,
  selfHealingPatternsTable,
  selfHealingRunsTable,
  usersTable,
} from '@szl-holdings/db';
import { randomBytes } from 'node:crypto';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendNoContent,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import {
  approveRemediation,
  ensurePatternsSeeded,
  failRemediation,
  findActiveByRunKey,
  hasSeedMarker,
  setSeedMarker,
} from '../lib/self-healing-runtime';

import { anyQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { type AuthenticatedUser, authMiddleware, requireRole } from '../middlewares/auth';

const RUNS_SEED_NAMESPACE = 'self_healing';
const RUNS_SEED_MARKER_KEY = 'runs_demo_seeded';
const router: IRouter = Router();

type RemediationStatus = 'executing' | 'pending_approval' | 'completed' | 'failed' | 'queued';
type PatternType = 'restart' | 'scale' | 'failover' | 'clear_queue' | 'rollback';

interface RemediationStep {
  id: string;
  action: string;
  status: 'done' | 'running' | 'pending' | 'failed';
  durationMs?: number;
}

interface RemediationRun {
  id: string;
  patternId: string;
  patternName: string;
  patternType: PatternType;
  triggerSignal: string;
  service: string;
  detectedAt: number;
  startedAt?: number;
  completedAt?: number;
  status: RemediationStatus;
  steps: RemediationStep[];
  mttrSavedMins: number;
  approver?: string;
  auditRef: string;
}

interface FailurePattern {
  id: string;
  name: string;
  type: PatternType;
  matchCount: number;
  successRate: number;
  avgMttrSavedMins: number;
  enabled: boolean;
  trigger: string;
  runbook: string;
  lastEditedAt?: number;
  lastEditedBy?: string;
  lastEditedAction?: string;
}

interface SeedPattern {
  patternKey: string;
  name: string;
  type: PatternType;
  trigger: string;
  runbook: string;
  enabled: boolean;
}

interface SeedRun {
  runKey: string;
  patternKey: string;
  triggerSignal: string;
  service: string;
  detectedOffsetMs: number;
  startedOffsetMs?: number;
  completedOffsetMs?: number;
  status: RemediationStatus;
  steps: RemediationStep[];
  mttrSavedMins: number;
  approver?: string;
  auditRef: string;
}

const _SEED_PATTERNS: SeedPattern[] = [
  {
    patternKey: 'p1',
    name: 'Service Restart on OOM',
    type: 'restart',
    trigger: 'OOM kill detected on pod',
    runbook: 'RUNBOOK-001: Drain → Restart → Health-check → Reroute',
    enabled: true,
  },
  {
    patternKey: 'p2',
    name: 'Auto-Scale on CPU Saturation',
    type: 'scale',
    trigger: 'CPU > 85% for 5 consecutive minutes',
    runbook: 'RUNBOOK-002: Scale +2 replicas → Verify HPA → Alert',
    enabled: true,
  },
  {
    patternKey: 'p3',
    name: 'DB Failover on Primary Failure',
    type: 'failover',
    trigger: 'Primary DB health check failures > 3',
    runbook: 'RUNBOOK-003: Promote replica → Update DNS → Validate',
    enabled: true,
  },
  {
    patternKey: 'p4',
    name: 'Queue Drain on Backlog Overflow',
    type: 'clear_queue',
    trigger: 'Queue depth > 50k messages for 3 min',
    runbook: 'RUNBOOK-004: Pause producers → Drain → Flush DLQ → Resume',
    enabled: true,
  },
  {
    patternKey: 'p5',
    name: 'Canary Rollback on Error Spike',
    type: 'rollback',
    trigger: 'Error rate delta > 5% vs baseline on new deploy',
    runbook: 'RUNBOOK-005: Halt canary → Shift traffic → Rollback image',
    enabled: false,
  },
];

const SEED_RUNS: SeedRun[] = [
  {
    runKey: 'REM-4821',
    patternKey: 'p1',
    triggerSignal: 'api-gateway pod OOM kill — 3 restarts in 10m',
    service: 'api-gateway',
    detectedOffsetMs: 4 * 60_000,
    startedOffsetMs: 3.5 * 60_000,
    status: 'executing',
    steps: [
      { id: 's1', action: 'Drain existing connections', status: 'done', durationMs: 1240 },
      { id: 's2', action: 'Signal graceful shutdown', status: 'done', durationMs: 890 },
      { id: 's3', action: 'Restart pod & await ready state', status: 'running' },
      { id: 's4', action: 'Run health check suite', status: 'pending' },
      { id: 's5', action: 'Re-route traffic and verify', status: 'pending' },
    ],
    mttrSavedMins: 34,
    auditRef: 'AUD-2024-4821',
  },
  {
    runKey: 'REM-4819',
    patternKey: 'p4',
    triggerSignal: 'ml-inference queue depth 78k messages',
    service: 'ml-inference',
    detectedOffsetMs: 22 * 60_000,
    startedOffsetMs: 21 * 60_000,
    completedOffsetMs: 14 * 60_000,
    status: 'completed',
    steps: [
      { id: 's1', action: 'Pause message producers', status: 'done', durationMs: 320 },
      { id: 's2', action: 'Drain backlog queue', status: 'done', durationMs: 4100 },
      { id: 's3', action: 'Flush dead letter queue', status: 'done', durationMs: 880 },
      { id: 's4', action: 'Resume producers & validate', status: 'done', durationMs: 540 },
    ],
    mttrSavedMins: 12,
    auditRef: 'AUD-2024-4819',
  },
  {
    runKey: 'REM-4817',
    patternKey: 'p2',
    triggerSignal: 'auth-service CPU at 91% for 6 consecutive minutes',
    service: 'auth-service',
    detectedOffsetMs: 45 * 60_000,
    status: 'pending_approval',
    steps: [
      { id: 's1', action: 'Scale +2 replicas via HPA', status: 'pending' },
      { id: 's2', action: 'Verify pod readiness', status: 'pending' },
      { id: 's3', action: 'Alert on-call engineer', status: 'pending' },
    ],
    mttrSavedMins: 18,
    approver: 'ops-manager',
    auditRef: 'AUD-2024-4817',
  },
  {
    runKey: 'REM-4815',
    patternKey: 'p1',
    triggerSignal: 'data-pipeline OOM kill',
    service: 'data-pipeline',
    detectedOffsetMs: 3 * 3_600_000,
    startedOffsetMs: 3 * 3_600_000 - 30_000,
    completedOffsetMs: 3 * 3_600_000 - 95_000,
    status: 'completed',
    steps: [
      { id: 's1', action: 'Drain existing connections', status: 'done', durationMs: 980 },
      { id: 's2', action: 'Signal graceful shutdown', status: 'done', durationMs: 720 },
      { id: 's3', action: 'Restart pod & await ready state', status: 'done', durationMs: 28000 },
      { id: 's4', action: 'Run health check suite', status: 'done', durationMs: 3200 },
      { id: 's5', action: 'Re-route traffic and verify', status: 'done', durationMs: 1100 },
    ],
    mttrSavedMins: 34,
    auditRef: 'AUD-2024-4815',
  },
  {
    runKey: 'REM-4812',
    patternKey: 'p3',
    triggerSignal: 'postgres-primary health check failed 4 times',
    service: 'postgres-primary',
    detectedOffsetMs: 7 * 3_600_000,
    startedOffsetMs: 7 * 3_600_000 - 5_000,
    completedOffsetMs: 7 * 3_600_000 - 92_000,
    status: 'completed',
    steps: [
      { id: 's1', action: 'Promote replica to primary', status: 'done', durationMs: 18000 },
      { id: 's2', action: 'Update DNS records', status: 'done', durationMs: 4200 },
      { id: 's3', action: 'Validate connection pool', status: 'done', durationMs: 6700 },
    ],
    mttrSavedMins: 87,
    auditRef: 'AUD-2024-4812',
  },
];

// Demo seeding is intentionally gated behind a non-production environment
// (or an explicit SELF_HEALING_DEMO_SEED=1 opt-in) so production deployments
// only display real operational history written by the remediation runtime.
// In production, an empty table simply yields zero stats and an empty list.
let seedPromise: Promise<void> | null = null;

function shouldSeedDemoData(): boolean {
  if (process.env.SELF_HEALING_DEMO_SEED === '1') return true;
  if (process.env.SELF_HEALING_DEMO_SEED === '0') return false;
  return process.env.NODE_ENV !== 'production';
}

async function ensureSeeded(): Promise<void> {
  await ensurePatternsSeeded();
  if (!shouldSeedDemoData()) return;
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    // Once we've recorded that demo run history has been seeded for this
    // environment, never re-insert it — even if an operator has since
    // emptied the runs table. Conditioning only on "table is empty" caused
    // deleted demo runs to silently reappear in long-lived demo/pilot
    // environments.
    if (await hasSeedMarker(RUNS_SEED_NAMESPACE, RUNS_SEED_MARKER_KEY)) {
      return;
    }
    const existingRuns = await db
      .select({ id: selfHealingRunsTable.id })
      .from(selfHealingRunsTable)
      .limit(1);
    if (existingRuns.length === 0) {
      const now = Date.now();
      await db
        .insert(selfHealingRunsTable)
        .values(
          SEED_RUNS.map((r) => ({
            runKey: r.runKey,
            patternKey: r.patternKey,
            triggerSignal: r.triggerSignal,
            service: r.service,
            detectedAt: new Date(now - r.detectedOffsetMs),
            startedAt: r.startedOffsetMs !== undefined ? new Date(now - r.startedOffsetMs) : null,
            completedAt:
              r.completedOffsetMs !== undefined ? new Date(now - r.completedOffsetMs) : null,
            status: r.status,
            steps: r.steps,
            mttrSavedMins: r.mttrSavedMins,
            approver: r.approver ?? null,
            auditRef: r.auditRef,
          })),
        )
        .onConflictDoNothing();
    }
    // Whether we just seeded an empty table or detected a pre-existing
    // seeded environment, record the marker so future calls short-circuit.
    // Pre-existing seeded environments behave the same as before — they
    // simply gain the marker on the next request and never re-seed.
    await setSeedMarker(RUNS_SEED_NAMESPACE, RUNS_SEED_MARKER_KEY);
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });
  return seedPromise;
}

async function loadPatterns(): Promise<FailurePattern[]> {
  const patternRows = await db
    .select()
    .from(selfHealingPatternsTable)
    .orderBy(selfHealingPatternsTable.id);

  const aggRows = await db
    .select({
      patternKey: selfHealingRunsTable.patternKey,
      total: sql<number>`COUNT(*)::int`,
      completed: sql<number>`SUM(CASE WHEN ${selfHealingRunsTable.status} = 'completed' THEN 1 ELSE 0 END)::int`,
      eligible: sql<number>`SUM(CASE WHEN ${selfHealingRunsTable.status} NOT IN ('pending_approval','queued') THEN 1 ELSE 0 END)::int`,
      mttrSum: sql<number>`COALESCE(SUM(CASE WHEN ${selfHealingRunsTable.status} = 'completed' THEN ${selfHealingRunsTable.mttrSavedMins} ELSE 0 END), 0)::int`,
      mttrCount: sql<number>`SUM(CASE WHEN ${selfHealingRunsTable.status} = 'completed' THEN 1 ELSE 0 END)::int`,
    })
    .from(selfHealingRunsTable)
    .groupBy(selfHealingRunsTable.patternKey);

  const aggByKey = new Map<string, (typeof aggRows)[number]>();
  for (const a of aggRows) aggByKey.set(a.patternKey, a);

  const patternKeys = patternRows.map((p) => p.patternKey);
  type LastEdit = {
    action: string;
    createdAt: Date;
    displayName: string | null;
    email: string | null;
  };
  const lastEditByKey = new Map<string, LastEdit>();
  if (patternKeys.length > 0) {
    const auditRows = await db
      .select({
        resourceId: alloyAuditLogTable.resourceId,
        action: alloyAuditLogTable.action,
        createdAt: alloyAuditLogTable.createdAt,
        displayName: usersTable.displayName,
        email: usersTable.email,
      })
      .from(alloyAuditLogTable)
      .leftJoin(usersTable, eq(alloyAuditLogTable.userId, usersTable.id))
      .where(
        and(
          eq(alloyAuditLogTable.resourceType, 'self_healing_pattern'),
          inArray(alloyAuditLogTable.resourceId, patternKeys),
        ),
      )
      .orderBy(desc(alloyAuditLogTable.createdAt));
    for (const r of auditRows) {
      if (!r.resourceId) continue;
      if (lastEditByKey.has(r.resourceId)) continue;
      lastEditByKey.set(r.resourceId, {
        action: r.action,
        createdAt: r.createdAt,
        displayName: r.displayName,
        email: r.email,
      });
    }
  }

  return patternRows.map((p) => {
    const a = aggByKey.get(p.patternKey);
    const total = a?.total ?? 0;
    const eligible = a?.eligible ?? 0;
    const completed = a?.completed ?? 0;
    const mttrSum = a?.mttrSum ?? 0;
    const mttrCount = a?.mttrCount ?? 0;
    const successRate = eligible > 0 ? Math.round((completed / eligible) * 1000) / 10 : 0;
    const avgMttrSavedMins = mttrCount > 0 ? Math.round(mttrSum / mttrCount) : 0;
    const edit = lastEditByKey.get(p.patternKey);
    return {
      id: p.patternKey,
      name: p.name,
      type: p.type as PatternType,
      matchCount: total,
      successRate,
      avgMttrSavedMins,
      enabled: p.enabled,
      trigger: p.trigger,
      runbook: p.runbook,
      lastEditedAt: edit ? edit.createdAt.getTime() : undefined,
      lastEditedBy: edit ? (edit.displayName ?? edit.email ?? 'system') : undefined,
      lastEditedAction: edit?.action,
    };
  });
}

interface RunRowFilters {
  status?: string;
  patternKey?: string;
  runKey?: string;
  limit?: number;
}

async function countRuns(
  filters: Pick<RunRowFilters, 'status' | 'patternKey' | 'runKey'> = {},
): Promise<number> {
  const conditions = [];
  if (filters.status)
    conditions.push(eq(selfHealingRunsTable.status, filters.status as RemediationStatus));
  if (filters.patternKey) conditions.push(eq(selfHealingRunsTable.patternKey, filters.patternKey));
  if (filters.runKey) conditions.push(eq(selfHealingRunsTable.runKey, filters.runKey));

  const base = db.select({ count: sql<number>`COUNT(*)::int` }).from(selfHealingRunsTable);
  const rows = conditions.length > 0 ? await base.where(and(...conditions)) : await base;
  return rows[0]?.count ?? 0;
}

async function loadRuns(filters: RunRowFilters = {}): Promise<RemediationRun[]> {
  const patternRows = await db.select().from(selfHealingPatternsTable);
  const patternByKey = new Map(patternRows.map((p) => [p.patternKey, p]));

  const conditions = [];
  if (filters.status)
    conditions.push(eq(selfHealingRunsTable.status, filters.status as RemediationStatus));
  if (filters.patternKey) conditions.push(eq(selfHealingRunsTable.patternKey, filters.patternKey));
  if (filters.runKey) conditions.push(eq(selfHealingRunsTable.runKey, filters.runKey));

  const baseQuery = db.select().from(selfHealingRunsTable);
  const filteredQuery = conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;
  const orderedQuery = filteredQuery.orderBy(desc(selfHealingRunsTable.detectedAt));
  const rows = filters.limit ? await orderedQuery.limit(filters.limit) : await orderedQuery;

  return rows.map((r) => {
    const pattern = patternByKey.get(r.patternKey);
    return {
      id: r.runKey,
      patternId: r.patternKey,
      patternName: pattern?.name ?? r.patternKey,
      patternType: (pattern?.type as PatternType | undefined) ?? 'restart',
      triggerSignal: r.triggerSignal,
      service: r.service,
      detectedAt: r.detectedAt.getTime(),
      startedAt: r.startedAt ? r.startedAt.getTime() : undefined,
      completedAt: r.completedAt ? r.completedAt.getTime() : undefined,
      status: r.status as RemediationStatus,
      steps: (r.steps ?? []) as RemediationStep[],
      mttrSavedMins: r.mttrSavedMins,
      approver: r.approver ?? undefined,
      auditRef: r.auditRef,
    };
  });
}

router.get(
  '/self-healing/stats',
  authMiddleware({ required: false }),
  async (_req: Request, res: Response) => {
    try {
      await ensureSeeded();

      const statusAgg = await db
        .select({
          status: selfHealingRunsTable.status,
          count: sql<number>`COUNT(*)::int`,
          mttrSum: sql<number>`COALESCE(SUM(${selfHealingRunsTable.mttrSavedMins}), 0)::int`,
        })
        .from(selfHealingRunsTable)
        .groupBy(selfHealingRunsTable.status);

      let totalRuns = 0;
      let executing = 0;
      let pendingApproval = 0;
      let completed = 0;
      let totalMttrSaved = 0;
      let eligible = 0;
      for (const row of statusAgg) {
        totalRuns += row.count;
        if (row.status === 'executing') executing = row.count;
        if (row.status === 'pending_approval') pendingApproval = row.count;
        if (row.status === 'completed') {
          completed = row.count;
          totalMttrSaved = row.mttrSum;
        }
        if (row.status !== 'pending_approval' && row.status !== 'queued') eligible += row.count;
      }
      const successRate = eligible > 0 ? Math.round((completed / eligible) * 100) : 0;

      const patternCounts = await db
        .select({
          total: sql<number>`COUNT(*)::int`,
          active: sql<number>`SUM(CASE WHEN ${selfHealingPatternsTable.enabled} THEN 1 ELSE 0 END)::int`,
        })
        .from(selfHealingPatternsTable);
      const patternsTotal = patternCounts[0]?.total ?? 0;
      const patternsActive = patternCounts[0]?.active ?? 0;

      sendSuccess(res, {
        totalRuns,
        executing,
        pendingApproval,
        completed,
        totalMttrSavedMins: totalMttrSaved,
        successRate,
        patternsActive,
        patternsTotal,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch self-healing stats');
    }
  },
);

router.get(
  '/self-healing/policies',
  authMiddleware({ required: false }),
  async (req: Request, res: Response) => {
    try {
      await ensureSeeded();
      const policies = await loadPatterns();
      const user = (req as Request & { user?: AuthenticatedUser }).user;
      const responsePolicies = user
        ? policies
        : policies.map(
            ({ lastEditedBy: _lb, lastEditedAction: _la, lastEditedAt: _lt, ...rest }) => rest,
          );
      sendSuccess(res, { policies: responsePolicies });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch self-healing policies');
    }
  },
);

const PATTERN_TYPES = ['restart', 'scale', 'failover', 'clear_queue', 'rollback'] as const;

const createPatternSchema = z.object({
  patternKey: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-_]+$/i)
    .optional(),
  name: z.string().min(1).max(200).trim(),
  type: z.enum(PATTERN_TYPES),
  trigger: z.string().min(1).max(500).trim(),
  runbook: z.string().min(1).max(2000).trim(),
  enabled: z.boolean().optional().default(true),
});

const updatePatternSchema = z
  .object({
    name: z.string().min(1).max(200).trim().optional(),
    type: z.enum(PATTERN_TYPES).optional(),
    trigger: z.string().min(1).max(500).trim().optional(),
    runbook: z.string().min(1).max(2000).trim().optional(),
    enabled: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' });

async function writePatternAudit(params: {
  userId?: number | null;
  action: 'create' | 'update' | 'delete' | 'toggle';
  resourceId: string;
  before?: unknown;
  after?: unknown;
}) {
  try {
    await db.insert(alloyAuditLogTable).values({
      orgId: null,
      userId: params.userId ?? null,
      action: params.action,
      resourceType: 'self_healing_pattern',
      resourceId: params.resourceId,
      before: (params.before as Record<string, unknown>) ?? null,
      after: (params.after as Record<string, unknown>) ?? null,
    });
  } catch (err) {
    logger.warn({ err }, 'Failed to write audit log for self-healing pattern');
  }
}

function generatePatternKey(): string {
  return `p-${randomBytes(6).toString('hex')}`;
}

router.post(
  '/self-healing/policies',
  validateBody(
    bodyShape({
      enabled: z.unknown().optional(),
      name: z.unknown().optional(),
      patternKey: z.unknown().optional(),
      runbook: z.unknown().optional(),
      trigger: z.unknown().optional(),
      type: z.unknown().optional(),
    }),
  ),
  authMiddleware({ required: true }),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      await ensureSeeded();
      const parsed = createPatternSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, parsed.error.message);
        return;
      }
      const data = parsed.data;
      const user = req.user as AuthenticatedUser | undefined;

      const patternKey = data.patternKey ?? generatePatternKey();

      const existing = await db
        .select({ id: selfHealingPatternsTable.id })
        .from(selfHealingPatternsTable)
        .where(eq(selfHealingPatternsTable.patternKey, patternKey))
        .limit(1);
      if (existing.length > 0) {
        sendBadRequest(res, 'A pattern with that key already exists');
        return;
      }

      const [created] = await db
        .insert(selfHealingPatternsTable)
        .values({
          patternKey,
          name: data.name,
          type: data.type,
          trigger: data.trigger,
          runbook: data.runbook,
          enabled: data.enabled ?? true,
        })
        .returning();

      await writePatternAudit({
        userId: user?.id,
        action: 'create',
        resourceId: patternKey,
        after: created,
      });

      const policies = await loadPatterns();
      const policy = policies.find((p) => p.id === patternKey);
      sendCreated(res, { policy });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create self-healing pattern');
    }
  },
);

router.put(
  '/self-healing/policies/:id',
  validateBody(
    bodyShape({
      enabled: z.unknown().optional(),
      name: z.unknown().optional(),
      runbook: z.unknown().optional(),
      trigger: z.unknown().optional(),
      type: z.unknown().optional(),
    }),
  ),
  authMiddleware({ required: true }),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      await ensureSeeded();
      const { id } = req.params as { id: string };
      const parsed = updatePatternSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, parsed.error.message);
        return;
      }
      const user = req.user as AuthenticatedUser | undefined;

      const existing = await db
        .select()
        .from(selfHealingPatternsTable)
        .where(eq(selfHealingPatternsTable.patternKey, id))
        .limit(1);
      if (existing.length === 0) {
        sendNotFound(res, 'Pattern');
        return;
      }

      const updates: Partial<typeof selfHealingPatternsTable.$inferInsert> = {
        updatedAt: new Date(),
      };
      const data = parsed.data;
      if (data.name !== undefined) updates.name = data.name;
      if (data.type !== undefined) updates.type = data.type;
      if (data.trigger !== undefined) updates.trigger = data.trigger;
      if (data.runbook !== undefined) updates.runbook = data.runbook;
      if (data.enabled !== undefined) updates.enabled = data.enabled;

      const [updated] = await db
        .update(selfHealingPatternsTable)
        .set(updates)
        .where(eq(selfHealingPatternsTable.patternKey, id))
        .returning();

      await writePatternAudit({
        userId: user?.id,
        action: 'update',
        resourceId: id,
        before: existing[0],
        after: updated,
      });

      const policies = await loadPatterns();
      const policy = policies.find((p) => p.id === id);
      sendSuccess(res, { policy });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update self-healing pattern');
    }
  },
);

router.delete(
  '/self-healing/policies/:id',
  validateBody(bodyShape({})),
  authMiddleware({ required: true }),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      await ensureSeeded();
      const { id } = req.params as { id: string };

      const existing = await db
        .select()
        .from(selfHealingPatternsTable)
        .where(eq(selfHealingPatternsTable.patternKey, id))
        .limit(1);
      if (existing.length === 0) {
        sendNotFound(res, 'Pattern');
        return;
      }
      const user = req.user as AuthenticatedUser | undefined;

      await db.delete(selfHealingPatternsTable).where(eq(selfHealingPatternsTable.patternKey, id));

      await writePatternAudit({
        userId: user?.id,
        action: 'delete',
        resourceId: id,
        before: existing[0],
      });

      sendNoContent(res);
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete self-healing pattern');
    }
  },
);

router.get(
  '/self-healing/policies/:id/history',
  validateQuery(anyQuerySchema),
  authMiddleware({ required: true }),
  requireRole('admin', 'operator', 'ops_manager', 'platform_admin', 'founder_admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      await ensureSeeded();
      const { id } = req.params as { id: string };
      const limitRaw = (req.query as { limit?: string }).limit;
      const limit = Math.min(Math.max(parseInt(limitRaw ?? '20', 10) || 20, 1), 100);

      const exists = await db
        .select({ id: selfHealingPatternsTable.id })
        .from(selfHealingPatternsTable)
        .where(eq(selfHealingPatternsTable.patternKey, id))
        .limit(1);
      if (exists.length === 0) {
        sendNotFound(res, 'Pattern');
        return;
      }

      const rows = await db
        .select({
          id: alloyAuditLogTable.id,
          action: alloyAuditLogTable.action,
          createdAt: alloyAuditLogTable.createdAt,
          before: alloyAuditLogTable.before,
          after: alloyAuditLogTable.after,
          userId: alloyAuditLogTable.userId,
          displayName: usersTable.displayName,
          email: usersTable.email,
        })
        .from(alloyAuditLogTable)
        .leftJoin(usersTable, eq(alloyAuditLogTable.userId, usersTable.id))
        .where(
          and(
            eq(alloyAuditLogTable.resourceType, 'self_healing_pattern'),
            eq(alloyAuditLogTable.resourceId, id),
          ),
        )
        .orderBy(desc(alloyAuditLogTable.createdAt))
        .limit(limit);

      const entries = rows.map((r) => ({
        id: r.id,
        action: r.action,
        at: r.createdAt.getTime(),
        actor: r.displayName ?? r.email ?? (r.userId != null ? `user#${r.userId}` : 'system'),
        actorEmail: r.email ?? undefined,
        before: r.before ?? null,
        after: r.after ?? null,
      }));
      sendSuccess(res, { entries });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch self-healing pattern history');
    }
  },
);

router.patch(
  '/self-healing/policies/:id/toggle',
  validateBody(bodyShape({})),
  authMiddleware({ required: true }),
  async (req: Request, res: Response) => {
    try {
      await ensureSeeded();
      const { id } = req.params as { id: string };
      const existing = await db
        .select()
        .from(selfHealingPatternsTable)
        .where(eq(selfHealingPatternsTable.patternKey, id))
        .limit(1);
      if (existing.length === 0) {
        sendNotFound(res, 'Policy');
        return;
      }
      const next = !existing[0]?.enabled;
      await db
        .update(selfHealingPatternsTable)
        .set({ enabled: next, updatedAt: new Date() })
        .where(eq(selfHealingPatternsTable.patternKey, id));

      const policies = await loadPatterns();
      const policy = policies.find((p) => p.id === id);
      sendSuccess(res, { policy });
    } catch (err) {
      handleRouteError(res, err, 'Failed to toggle self-healing policy');
    }
  },
);

router.get(
  '/self-healing/runs',
  validateQuery(anyQuerySchema),
  authMiddleware({ required: false }),
  async (req: Request, res: Response) => {
    try {
      await ensureSeeded();
      const { status, patternId, limit } = req.query as {
        status?: string;
        patternId?: string;
        limit?: string;
      };
      const take = Math.min(parseInt(limit ?? '50', 10) || 50, 100);
      const filters = { status, patternKey: patternId };
      const [runs, total] = await Promise.all([
        loadRuns({ ...filters, limit: take }),
        countRuns(filters),
      ]);
      sendSuccess(res, { runs, total });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch self-healing runs');
    }
  },
);

router.post(
  '/self-healing/runs/:id/approve',
  validateBody(
    bodyShape({
      approver: z.unknown().optional(),
    }),
  ),
  authMiddleware({ required: true }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const body = (req.body ?? {}) as { approver?: string };
      const approver =
        (body.approver?.trim() ||
          (req as Request & { user?: { email?: string; id?: string } }).user?.email ||
          (req as Request & { user?: { email?: string; id?: string } }).user?.id) ??
        'operator';

      const active = findActiveByRunKey(id);
      if (!active) {
        const row = await db
          .select({ status: selfHealingRunsTable.status })
          .from(selfHealingRunsTable)
          .where(eq(selfHealingRunsTable.runKey, id))
          .limit(1);
        if (row.length === 0) {
          sendNotFound(res, 'Run');
          return;
        }
        res.status(409).json({
          success: false,
          error: {
            code: 'INVALID_STATE',
            message: `Run is ${row[0].status}; only pending_approval runs can be approved.`,
          },
        });
        return;
      }
      const ok = await approveRemediation(active.patternKey, active.service, approver);
      if (!ok) {
        res.status(409).json({
          success: false,
          error: { code: 'INVALID_STATE', message: 'Run is no longer pending approval.' },
        });
        return;
      }
      const runs = await loadRuns({ runKey: id, limit: 1 });
      sendSuccess(res, { run: runs[0] ?? null });
    } catch (err) {
      handleRouteError(res, err, 'Failed to approve self-healing run');
    }
  },
);

router.post(
  '/self-healing/runs/:id/reject',
  validateBody(
    bodyShape({
      reason: z.unknown().optional(),
    }),
  ),
  authMiddleware({ required: true }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const body = (req.body ?? {}) as { reason?: string };
      const reason = body.reason?.trim() || 'Rejected by operator';

      const active = findActiveByRunKey(id);
      if (!active) {
        const row = await db
          .select({ status: selfHealingRunsTable.status })
          .from(selfHealingRunsTable)
          .where(eq(selfHealingRunsTable.runKey, id))
          .limit(1);
        if (row.length === 0) {
          sendNotFound(res, 'Run');
          return;
        }
        res.status(409).json({
          success: false,
          error: {
            code: 'INVALID_STATE',
            message: `Run is ${row[0].status}; only active runs can be rejected.`,
          },
        });
        return;
      }
      await failRemediation(active.patternKey, active.service, reason);
      const runs = await loadRuns({ runKey: id, limit: 1 });
      sendSuccess(res, { run: runs[0] ?? null });
    } catch (err) {
      handleRouteError(res, err, 'Failed to reject self-healing run');
    }
  },
);

router.get(
  '/self-healing/runs/:id',
  authMiddleware({ required: false }),
  async (req: Request, res: Response) => {
    try {
      await ensureSeeded();
      const { id } = req.params as { id: string };
      const runs = await loadRuns({ runKey: id, limit: 1 });
      const run = runs[0];
      if (!run) {
        sendNotFound(res, 'Run');
        return;
      }
      sendSuccess(res, { run });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch self-healing run');
    }
  },
);

export default router;
