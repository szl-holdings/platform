/**
 * Command portal sync state — durable backing store for the directive cascade,
 * coalition partner roster, and strategic reserve dashboard.
 *
 * Previously each surface stored its working state in the browser's
 * localStorage, which meant a user opening the Command center on another
 * device or browser saw none of their changes. These endpoints back the same
 * surfaces with PostgreSQL so changes persist across devices/browsers.
 *
 * Routes are mounted at `/api/command/sync/...` from
 * `routes/groups/operations.ts`. On the first read for a tenant the table is
 * seeded from the canonical demo dataset baked into the code below so the
 * surface is never empty.
 */

import {
  commandCoalitionPartnersTable,
  commandDirectivesTable,
  commandDrawdownRequestsTable,
  commandReservePoolsTable,
  db,
  GLOBAL_TENANT_SENTINEL,
} from '@szl-holdings/db';
import { and, asc, desc, eq } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendCreated, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { requireAnyAuth } from '../middlewares/auth';

const router: IRouter = Router();

function tenantKey(req: Request): string {
  const tid = (req as Request & { authUser?: { orgId?: string | null } }).authUser?.orgId;
  return tid && tid.trim() !== '' ? tid : GLOBAL_TENANT_SENTINEL;
}

// ────────────────────────────────────────────────────────────────────────────
// Seed datasets — baked-in demo content. Persisted on the first read for a
// tenant so cross-device users see the same starting state regardless of
// which device first hit the API.
// ────────────────────────────────────────────────────────────────────────────

const HOUR = 3_600_000;
const MIN = 60_000;

interface DirectiveSeed {
  id: string;
  title: string;
  body: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ACTIVE' | 'CASCADING' | 'SUSPENDED' | 'ARCHIVED';
  classification: 'OPEN' | 'RESTRICTED' | 'CONFIDENTIAL' | 'SOVEREIGN';
  issuedBy: string;
  issuedHoursAgo: number;
  cascadedTo: string[];
  tags: string[];
  cascadeCount: number;
}

const DIRECTIVE_SEEDS: DirectiveSeed[] = [
  {
    id: 'dir-001',
    title: 'ELEVATED PROTOCOL — Elevated WAF Posture',
    body: 'All API endpoints must operate under heightened WAF scrutiny. Rate limits reduced to 500 req/min. Security perimeter Centurions report anomalies immediately.',
    priority: 'CRITICAL',
    status: 'ACTIVE',
    classification: 'SOVEREIGN',
    issuedBy: 'Praetorianus — Security Center',
    issuedHoursAgo: 4,
    cascadedTo: ['GROUP — SECURITY', 'GROUP — COMPUTE', 'GROUP — DATA'],
    tags: ['WAF', 'SECURITY', 'PROTOCOL'],
    cascadeCount: 3,
  },
  {
    id: 'dir-002',
    title: 'REDIS WATCH — Memory Threshold Alert at 70%',
    body: 'Cache tier must page Centurion AI when Redis memory utilization exceeds 70%. Prepare Premium P1 upgrade request for senate review if threshold is breached.',
    priority: 'HIGH',
    status: 'ACTIVE',
    classification: 'CONFIDENTIAL',
    issuedBy: 'Centurion AI — Cache Monitor',
    issuedHoursAgo: 12,
    cascadedTo: ['GROUP — DATA'],
    tags: ['REDIS', 'CAPACITY', 'ALERT'],
    cascadeCount: 1,
  },
  {
    id: 'dir-003',
    title: 'COST CONTAINMENT — Q2 Spend Cap',
    body: 'Monthly cloud spend must not exceed $4,500 without senate approval. All scaling proposals require cost-impact analysis. AI Ops recommendations must include projected cost delta.',
    priority: 'MEDIUM',
    status: 'CASCADING',
    classification: 'RESTRICTED',
    issuedBy: 'Executive Console — CFO Directive',
    issuedHoursAgo: 72,
    cascadedTo: ['GROUP — COMPUTE', 'GROUP — FRONTEND'],
    tags: ['COST', 'Q2', 'GOVERNANCE'],
    cascadeCount: 2,
  },
  {
    id: 'dir-004',
    title: 'DR READINESS — Failover Drill Scheduled',
    body: 'Standby region (West US 2) must be warm-tested within 7 days. RTO target < 15 minutes. All Centurion agents must confirm readiness status.',
    priority: 'MEDIUM',
    status: 'SUSPENDED',
    classification: 'RESTRICTED',
    issuedBy: 'Legatus Console — CTO Office',
    issuedHoursAgo: 96,
    cascadedTo: [],
    tags: ['DR', 'FAILOVER', 'READINESS'],
    cascadeCount: 0,
  },
];

interface PartnerSeed {
  id: string;
  name: string;
  role: string;
  domain: string;
  trustScore: number;
  status: 'ACTIVE' | 'OBSERVING' | 'SUSPENDED' | 'TERMINATED';
  classification: 'OPEN' | 'RESTRICTED' | 'CONFIDENTIAL' | 'SOVEREIGN';
  contactMinutesAgo: number;
  notes: string;
  alerts: number;
}

const PARTNER_SEEDS: PartnerSeed[] = [
  {
    id: 'cp-001',
    name: 'Azure Security Center',
    role: 'Threat Intelligence Feed',
    domain: 'Security',
    trustScore: 98,
    status: 'ACTIVE',
    classification: 'SOVEREIGN',
    contactMinutesAgo: 5,
    notes: 'Primary threat feed. Feeds WAF and Praetorian. SLA: 99.99%.',
    alerts: 2,
  },
  {
    id: 'cp-002',
    name: 'Aegis SIEM',
    role: 'Security Information & Event Management',
    domain: 'Security',
    trustScore: 95,
    status: 'ACTIVE',
    classification: 'CONFIDENTIAL',
    contactMinutesAgo: 2,
    notes: 'SIEM ingesting WAF logs, App Insights, and PostgreSQL audit stream.',
    alerts: 0,
  },
  {
    id: 'cp-003',
    name: 'Aegis — Risk Engine',
    role: 'Real-Time Risk Scoring',
    domain: 'Finance',
    trustScore: 87,
    status: 'ACTIVE',
    classification: 'CONFIDENTIAL',
    contactMinutesAgo: 30,
    notes: 'Cross-domain risk signals from Firestorm integrated via Service Bus.',
    alerts: 1,
  },
  {
    id: 'cp-004',
    name: 'Vessels — Maritime Intelligence',
    role: 'Operational Domain Signal',
    domain: 'Operations',
    trustScore: 82,
    status: 'OBSERVING',
    classification: 'RESTRICTED',
    contactMinutesAgo: 120,
    notes: 'Fleet telemetry aggregated. Observing mode pending API upgrade.',
    alerts: 0,
  },
  {
    id: 'cp-005',
    name: 'Counsel',
    role: 'Legal & Compliance Advisory',
    domain: 'Legal',
    trustScore: 91,
    status: 'ACTIVE',
    classification: 'CONFIDENTIAL',
    contactMinutesAgo: 60,
    notes: 'SOC-2 compliance reports and GDPR advisory integrated.',
    alerts: 0,
  },
  {
    id: 'cp-006',
    name: 'Entra ID — Identity Provider',
    role: 'Zero Trust Identity Fabric',
    domain: 'Security',
    trustScore: 99,
    status: 'ACTIVE',
    classification: 'SOVEREIGN',
    contactMinutesAgo: 1,
    notes: 'Conditional Access + MFA enforcement for all admin sessions.',
    alerts: 0,
  },
];

interface ReserveSeed {
  id: string;
  name: string;
  category: string;
  totalCapacity: number;
  currentLevel: number;
  unit: string;
  status: 'NOMINAL' | 'REDUCED' | 'CRITICAL' | 'DEPLETED';
  classification: 'OPEN' | 'RESTRICTED' | 'CONFIDENTIAL' | 'SOVEREIGN';
  lastDrawdownHoursAgo?: number;
  notes: string;
  trendHistory: { date: string; level: number }[];
}

const RESERVE_SEEDS: ReserveSeed[] = [
  {
    id: 'res-compute',
    name: 'COMPUTE RESERVE',
    category: 'Infrastructure',
    totalCapacity: 20,
    currentLevel: 10,
    unit: 'replicas',
    status: 'NOMINAL',
    classification: 'RESTRICTED',
    lastDrawdownHoursAgo: 48,
    notes: 'Container App max-replica headroom. Current burst capacity available.',
    trendHistory: [
      { date: '2026-04-15', level: 14 },
      { date: '2026-04-16', level: 14 },
      { date: '2026-04-17', level: 12 },
      { date: '2026-04-18', level: 13 },
      { date: '2026-04-19', level: 11 },
      { date: '2026-04-20', level: 10 },
      { date: '2026-04-21', level: 10 },
    ],
  },
  {
    id: 'res-budget',
    name: 'CONTINGENCY BUDGET',
    category: 'Finance',
    totalCapacity: 10000,
    currentLevel: 7400,
    unit: 'USD/mo',
    status: 'NOMINAL',
    classification: 'CONFIDENTIAL',
    notes: 'Monthly cloud spend contingency above baseline $4,280 cap.',
    trendHistory: [
      { date: '2026-04-15', level: 8200 },
      { date: '2026-04-16', level: 8100 },
      { date: '2026-04-17', level: 7900 },
      { date: '2026-04-18', level: 7900 },
      { date: '2026-04-19', level: 7700 },
      { date: '2026-04-20', level: 7550 },
      { date: '2026-04-21', level: 7400 },
    ],
  },
  {
    id: 'res-storage',
    name: 'STORAGE HEADROOM',
    category: 'Infrastructure',
    totalCapacity: 128,
    currentLevel: 83,
    unit: 'GB',
    status: 'NOMINAL',
    classification: 'CONFIDENTIAL',
    lastDrawdownHoursAgo: 24,
    notes: 'PostgreSQL storage pool. Auto-grow enabled.',
    trendHistory: [
      { date: '2026-04-15', level: 89 },
      { date: '2026-04-16', level: 88 },
      { date: '2026-04-17', level: 87 },
      { date: '2026-04-18', level: 86 },
      { date: '2026-04-19', level: 85 },
      { date: '2026-04-20', level: 84 },
      { date: '2026-04-21', level: 83 },
    ],
  },
  {
    id: 'res-redis',
    name: 'CACHE CAPACITY',
    category: 'Infrastructure',
    totalCapacity: 6,
    currentLevel: 2.28,
    unit: 'GB',
    status: 'REDUCED',
    classification: 'CONFIDENTIAL',
    notes: 'Redis C1 Standard headroom. 62% consumed. Upgrade to P1 queued.',
    trendHistory: [
      { date: '2026-04-15', level: 3.9 },
      { date: '2026-04-16', level: 3.6 },
      { date: '2026-04-17', level: 3.2 },
      { date: '2026-04-18', level: 2.95 },
      { date: '2026-04-19', level: 2.75 },
      { date: '2026-04-20', level: 2.5 },
      { date: '2026-04-21', level: 2.28 },
    ],
  },
  {
    id: 'res-waf',
    name: 'WAF RATE HEADROOM',
    category: 'Security',
    totalCapacity: 1000,
    currentLevel: 153,
    unit: 'req/min blocked',
    status: 'NOMINAL',
    classification: 'SOVEREIGN',
    lastDrawdownHoursAgo: 1,
    notes: 'WAF rate-limit buffer. Current blocks well within tolerance.',
    trendHistory: [
      { date: '2026-04-15', level: 310 },
      { date: '2026-04-16', level: 280 },
      { date: '2026-04-17', level: 205 },
      { date: '2026-04-18', level: 490 },
      { date: '2026-04-19', level: 175 },
      { date: '2026-04-20', level: 220 },
      { date: '2026-04-21', level: 153 },
    ],
  },
  {
    id: 'res-oncall',
    name: 'ON-CALL CAPACITY',
    category: 'Personnel',
    totalCapacity: 4,
    currentLevel: 3,
    unit: 'engineers',
    status: 'NOMINAL',
    classification: 'RESTRICTED',
    notes: 'On-call roster headroom. One engineer on approved leave.',
    trendHistory: [
      { date: '2026-04-15', level: 4 },
      { date: '2026-04-16', level: 4 },
      { date: '2026-04-17', level: 4 },
      { date: '2026-04-18', level: 3 },
      { date: '2026-04-19', level: 3 },
      { date: '2026-04-20', level: 3 },
      { date: '2026-04-21', level: 3 },
    ],
  },
];

interface DrawdownSeed {
  id: string;
  poolId: string;
  amount: number;
  justification: string;
  requestedBy: string;
  requestedHoursAgo: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const DRAWDOWN_SEEDS: DrawdownSeed[] = [
  {
    id: 'dd-001',
    poolId: 'res-compute',
    amount: 4,
    justification: 'Q2 load test required additional burst replicas for 48h window.',
    requestedBy: 'Centurion AI — Compute Monitor',
    requestedHoursAgo: 48,
    status: 'APPROVED',
  },
  {
    id: 'dd-002',
    poolId: 'res-budget',
    amount: 600,
    justification: 'Senate proposal: VNet-inject Service Bus (Premium SKU) pending approval.',
    requestedBy: 'Security Perimeter — Network Hardening',
    requestedHoursAgo: 6,
    status: 'PENDING',
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Lazy seeding helpers — insert canonical demo data on first read for a tenant
// ────────────────────────────────────────────────────────────────────────────

async function seedDirectivesIfEmpty(tenantId: string): Promise<void> {
  const existing = await db
    .select({ id: commandDirectivesTable.id })
    .from(commandDirectivesTable)
    .where(eq(commandDirectivesTable.tenantId, tenantId))
    .limit(1);
  if (existing.length > 0) return;
  const now = Date.now();
  await db
    .insert(commandDirectivesTable)
    .values(
      DIRECTIVE_SEEDS.map((s) => ({
        id: `${s.id}-${tenantId}`,
        tenantId,
        title: s.title,
        body: s.body,
        priority: s.priority,
        status: s.status,
        classification: s.classification,
        issuedBy: s.issuedBy,
        issuedAt: new Date(now - s.issuedHoursAgo * HOUR),
        cascadedTo: s.cascadedTo,
        tags: s.tags,
        cascadeCount: s.cascadeCount,
      })),
    )
    .onConflictDoNothing();
}

async function seedPartnersIfEmpty(tenantId: string): Promise<void> {
  const existing = await db
    .select({ id: commandCoalitionPartnersTable.id })
    .from(commandCoalitionPartnersTable)
    .where(eq(commandCoalitionPartnersTable.tenantId, tenantId))
    .limit(1);
  if (existing.length > 0) return;
  const now = Date.now();
  await db
    .insert(commandCoalitionPartnersTable)
    .values(
      PARTNER_SEEDS.map((s) => ({
        id: `${s.id}-${tenantId}`,
        tenantId,
        name: s.name,
        role: s.role,
        domain: s.domain,
        trustScore: s.trustScore,
        status: s.status,
        classification: s.classification,
        lastContact: new Date(now - s.contactMinutesAgo * MIN),
        notes: s.notes,
        alerts: s.alerts,
      })),
    )
    .onConflictDoNothing();
}

async function seedReservesIfEmpty(tenantId: string): Promise<void> {
  const existing = await db
    .select({ id: commandReservePoolsTable.id })
    .from(commandReservePoolsTable)
    .where(eq(commandReservePoolsTable.tenantId, tenantId))
    .limit(1);
  if (existing.length === 0) {
    const now = Date.now();
    await db
      .insert(commandReservePoolsTable)
      .values(
        RESERVE_SEEDS.map((s) => ({
          id: `${s.id}-${tenantId}`,
          tenantId,
          name: s.name,
          category: s.category,
          totalCapacity: s.totalCapacity,
          currentLevel: s.currentLevel,
          unit: s.unit,
          status: s.status,
          classification: s.classification,
          lastDrawdown: s.lastDrawdownHoursAgo
            ? new Date(now - s.lastDrawdownHoursAgo * HOUR)
            : null,
          notes: s.notes,
          trendHistory: s.trendHistory,
        })),
      )
      .onConflictDoNothing();
  }

  const existingDrawdowns = await db
    .select({ id: commandDrawdownRequestsTable.id })
    .from(commandDrawdownRequestsTable)
    .where(eq(commandDrawdownRequestsTable.tenantId, tenantId))
    .limit(1);
  if (existingDrawdowns.length === 0) {
    const now = Date.now();
    await db
      .insert(commandDrawdownRequestsTable)
      .values(
        DRAWDOWN_SEEDS.map((s) => ({
          id: `${s.id}-${tenantId}`,
          tenantId,
          poolId: `${s.poolId}-${tenantId}`,
          amount: s.amount,
          justification: s.justification,
          requestedBy: s.requestedBy,
          requestedAt: new Date(now - s.requestedHoursAgo * HOUR),
          status: s.status,
        })),
      )
      .onConflictDoNothing();
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Schemas
// ────────────────────────────────────────────────────────────────────────────

const directivePrioritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
const directiveStatusSchema = z.enum(['ACTIVE', 'CASCADING', 'SUSPENDED', 'ARCHIVED']);
const classificationSchema = z.enum(['OPEN', 'RESTRICTED', 'CONFIDENTIAL', 'SOVEREIGN']);

const createDirectiveSchema = z.object({
  id: z.string().min(1).max(128),
  title: z.string().min(1).max(512),
  body: z.string().min(1),
  priority: directivePrioritySchema,
  status: directiveStatusSchema,
  classification: classificationSchema,
  issuedBy: z.string().min(1).max(256),
  issuedAt: z.string().datetime().optional(),
  cascadedTo: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  cascadeCount: z.number().int().nonnegative().default(0),
});

const patchDirectiveSchema = z
  .object({
    title: z.string().min(1).max(512).optional(),
    body: z.string().min(1).optional(),
    priority: directivePrioritySchema.optional(),
    status: directiveStatusSchema.optional(),
    classification: classificationSchema.optional(),
    cascadedTo: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    cascadeCount: z.number().int().nonnegative().optional(),
  })
  .strict();

const coalitionStatusSchema = z.enum(['ACTIVE', 'OBSERVING', 'SUSPENDED', 'TERMINATED']);

const createPartnerSchema = z.object({
  id: z.string().min(1).max(128),
  name: z.string().min(1).max(256),
  role: z.string().min(1).max(256),
  domain: z.string().min(1).max(64),
  trustScore: z.number().int().min(0).max(100),
  status: coalitionStatusSchema,
  classification: classificationSchema,
  lastContact: z.string().datetime().optional(),
  notes: z.string().default(''),
  alerts: z.number().int().nonnegative().default(0),
});

const patchPartnerSchema = z
  .object({
    name: z.string().min(1).max(256).optional(),
    role: z.string().min(1).max(256).optional(),
    domain: z.string().min(1).max(64).optional(),
    trustScore: z.number().int().min(0).max(100).optional(),
    status: coalitionStatusSchema.optional(),
    classification: classificationSchema.optional(),
    notes: z.string().optional(),
    alerts: z.number().int().nonnegative().optional(),
  })
  .strict();

const createDrawdownSchema = z.object({
  id: z.string().min(1).max(128),
  poolId: z.string().min(1).max(128),
  amount: z.number().positive(),
  justification: z.string().min(1),
  requestedBy: z.string().min(1).max(256),
  requestedAt: z.string().datetime().optional(),
});

// ────────────────────────────────────────────────────────────────────────────
// Serialisation — strip tenantId from responses, return ISO dates so the
// frontend's date-aware reviver continues to round-trip Date instances.
// ────────────────────────────────────────────────────────────────────────────

function serialiseDirective(row: typeof commandDirectivesTable.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    priority: row.priority,
    status: row.status,
    classification: row.classification,
    issuedBy: row.issuedBy,
    issuedAt: row.issuedAt.toISOString(),
    cascadedTo: row.cascadedTo,
    tags: row.tags,
    cascadeCount: row.cascadeCount,
  };
}

function serialisePartner(row: typeof commandCoalitionPartnersTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    domain: row.domain,
    trustScore: row.trustScore,
    status: row.status,
    classification: row.classification,
    lastContact: row.lastContact.toISOString(),
    notes: row.notes,
    alerts: row.alerts,
  };
}

function serialisePool(row: typeof commandReservePoolsTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    totalCapacity: row.totalCapacity,
    currentLevel: row.currentLevel,
    unit: row.unit,
    status: row.status,
    classification: row.classification,
    lastDrawdown: row.lastDrawdown ? row.lastDrawdown.toISOString() : undefined,
    notes: row.notes,
    trendHistory: row.trendHistory,
  };
}

function serialiseDrawdown(row: typeof commandDrawdownRequestsTable.$inferSelect) {
  return {
    id: row.id,
    poolId: row.poolId,
    amount: row.amount,
    justification: row.justification,
    requestedBy: row.requestedBy,
    requestedAt: row.requestedAt.toISOString(),
    status: row.status,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Routes — mounted at /api/command/sync/*
// All routes require an authenticated session (org or user). Tenant scoping
// uses the caller's orgId, falling back to the GLOBAL_TENANT_SENTINEL for
// callers without an org context.
// ────────────────────────────────────────────────────────────────────────────

router.use('/sync', requireAnyAuth());

// ── Directives ──────────────────────────────────────────────────────────────

router.get('/sync/directives', async (req: Request, res: Response) => {
  try {
    const tid = tenantKey(req);
    await seedDirectivesIfEmpty(tid);
    const rows = await db
      .select()
      .from(commandDirectivesTable)
      .where(eq(commandDirectivesTable.tenantId, tid))
      .orderBy(desc(commandDirectivesTable.issuedAt));
    sendSuccess(res, { data: rows.map(serialiseDirective) });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load directives');
  }
});

router.post(
  '/sync/directives',
  validateBody(createDirectiveSchema),
  async (req: Request, res: Response) => {
    try {
      const tid = tenantKey(req);
      const body = req.body as z.infer<typeof createDirectiveSchema>;
      const issuedAt = body.issuedAt ? new Date(body.issuedAt) : new Date();
      const [row] = await db
        .insert(commandDirectivesTable)
        .values({
          id: body.id,
          tenantId: tid,
          title: body.title,
          body: body.body,
          priority: body.priority,
          status: body.status,
          classification: body.classification,
          issuedBy: body.issuedBy,
          issuedAt,
          cascadedTo: body.cascadedTo,
          tags: body.tags,
          cascadeCount: body.cascadeCount,
        })
        .returning();
      sendCreated(res, { data: serialiseDirective(row!) });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create directive');
    }
  },
);

router.patch(
  '/sync/directives/:id',
  validateBody(patchDirectiveSchema),
  async (req: Request, res: Response) => {
    try {
      const tid = tenantKey(req);
      const id = req.params.id;
      const body = req.body as z.infer<typeof patchDirectiveSchema>;
      const [row] = await db
        .update(commandDirectivesTable)
        .set({ ...body, updatedAt: new Date() })
        .where(
          and(eq(commandDirectivesTable.id, id), eq(commandDirectivesTable.tenantId, tid)),
        )
        .returning();
      if (!row) {
        res.status(404).json({ error: 'directive_not_found' });
        return;
      }
      sendSuccess(res, { data: serialiseDirective(row) });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update directive');
    }
  },
);

router.post('/sync/directives/reset', async (req: Request, res: Response) => {
  try {
    const tid = tenantKey(req);
    await db
      .delete(commandDirectivesTable)
      .where(eq(commandDirectivesTable.tenantId, tid));
    await seedDirectivesIfEmpty(tid);
    const rows = await db
      .select()
      .from(commandDirectivesTable)
      .where(eq(commandDirectivesTable.tenantId, tid))
      .orderBy(desc(commandDirectivesTable.issuedAt));
    sendSuccess(res, { data: rows.map(serialiseDirective) });
  } catch (err) {
    handleRouteError(res, err, 'Failed to reset directives');
  }
});

router.delete('/sync/directives/:id', async (req: Request, res: Response) => {
  try {
    const tid = tenantKey(req);
    const id = req.params.id;
    const result = await db
      .delete(commandDirectivesTable)
      .where(
        and(eq(commandDirectivesTable.id, id), eq(commandDirectivesTable.tenantId, tid)),
      )
      .returning({ id: commandDirectivesTable.id });
    if (result.length === 0) {
      res.status(404).json({ error: 'directive_not_found' });
      return;
    }
    sendSuccess(res, { data: { id } });
  } catch (err) {
    handleRouteError(res, err, 'Failed to delete directive');
  }
});

// ── Coalition partners ──────────────────────────────────────────────────────

router.get('/sync/coalition', async (req: Request, res: Response) => {
  try {
    const tid = tenantKey(req);
    await seedPartnersIfEmpty(tid);
    const rows = await db
      .select()
      .from(commandCoalitionPartnersTable)
      .where(eq(commandCoalitionPartnersTable.tenantId, tid))
      .orderBy(asc(commandCoalitionPartnersTable.createdAt));
    sendSuccess(res, { data: rows.map(serialisePartner) });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load coalition partners');
  }
});

router.post(
  '/sync/coalition',
  validateBody(createPartnerSchema),
  async (req: Request, res: Response) => {
    try {
      const tid = tenantKey(req);
      const body = req.body as z.infer<typeof createPartnerSchema>;
      const lastContact = body.lastContact ? new Date(body.lastContact) : new Date();
      const [row] = await db
        .insert(commandCoalitionPartnersTable)
        .values({
          id: body.id,
          tenantId: tid,
          name: body.name,
          role: body.role,
          domain: body.domain,
          trustScore: body.trustScore,
          status: body.status,
          classification: body.classification,
          lastContact,
          notes: body.notes,
          alerts: body.alerts,
        })
        .returning();
      sendCreated(res, { data: serialisePartner(row!) });
    } catch (err) {
      handleRouteError(res, err, 'Failed to add coalition partner');
    }
  },
);

router.patch(
  '/sync/coalition/:id',
  validateBody(patchPartnerSchema),
  async (req: Request, res: Response) => {
    try {
      const tid = tenantKey(req);
      const id = req.params.id;
      const body = req.body as z.infer<typeof patchPartnerSchema>;
      const [row] = await db
        .update(commandCoalitionPartnersTable)
        .set({ ...body, updatedAt: new Date() })
        .where(
          and(
            eq(commandCoalitionPartnersTable.id, id),
            eq(commandCoalitionPartnersTable.tenantId, tid),
          ),
        )
        .returning();
      if (!row) {
        res.status(404).json({ error: 'partner_not_found' });
        return;
      }
      sendSuccess(res, { data: serialisePartner(row) });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update coalition partner');
    }
  },
);

router.post('/sync/coalition/reset', async (req: Request, res: Response) => {
  try {
    const tid = tenantKey(req);
    await db
      .delete(commandCoalitionPartnersTable)
      .where(eq(commandCoalitionPartnersTable.tenantId, tid));
    await seedPartnersIfEmpty(tid);
    const rows = await db
      .select()
      .from(commandCoalitionPartnersTable)
      .where(eq(commandCoalitionPartnersTable.tenantId, tid))
      .orderBy(asc(commandCoalitionPartnersTable.createdAt));
    sendSuccess(res, { data: rows.map(serialisePartner) });
  } catch (err) {
    handleRouteError(res, err, 'Failed to reset coalition partners');
  }
});

router.delete('/sync/coalition/:id', async (req: Request, res: Response) => {
  try {
    const tid = tenantKey(req);
    const id = req.params.id;
    const result = await db
      .delete(commandCoalitionPartnersTable)
      .where(
        and(
          eq(commandCoalitionPartnersTable.id, id),
          eq(commandCoalitionPartnersTable.tenantId, tid),
        ),
      )
      .returning({ id: commandCoalitionPartnersTable.id });
    if (result.length === 0) {
      res.status(404).json({ error: 'partner_not_found' });
      return;
    }
    sendSuccess(res, { data: { id } });
  } catch (err) {
    handleRouteError(res, err, 'Failed to remove coalition partner');
  }
});

// ── Strategic reserves & drawdowns ──────────────────────────────────────────

router.get('/sync/reserves', async (req: Request, res: Response) => {
  try {
    const tid = tenantKey(req);
    await seedReservesIfEmpty(tid);
    const [pools, drawdowns] = await Promise.all([
      db
        .select()
        .from(commandReservePoolsTable)
        .where(eq(commandReservePoolsTable.tenantId, tid))
        .orderBy(asc(commandReservePoolsTable.createdAt)),
      db
        .select()
        .from(commandDrawdownRequestsTable)
        .where(eq(commandDrawdownRequestsTable.tenantId, tid))
        .orderBy(desc(commandDrawdownRequestsTable.requestedAt)),
    ]);
    sendSuccess(res, {
      data: {
        pools: pools.map(serialisePool),
        drawdowns: drawdowns.map(serialiseDrawdown),
      },
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load strategic reserves');
  }
});

router.post('/sync/reserves/reset', async (req: Request, res: Response) => {
  try {
    const tid = tenantKey(req);
    await db
      .delete(commandDrawdownRequestsTable)
      .where(eq(commandDrawdownRequestsTable.tenantId, tid));
    await db
      .delete(commandReservePoolsTable)
      .where(eq(commandReservePoolsTable.tenantId, tid));
    await seedReservesIfEmpty(tid);
    const [pools, drawdowns] = await Promise.all([
      db
        .select()
        .from(commandReservePoolsTable)
        .where(eq(commandReservePoolsTable.tenantId, tid))
        .orderBy(asc(commandReservePoolsTable.createdAt)),
      db
        .select()
        .from(commandDrawdownRequestsTable)
        .where(eq(commandDrawdownRequestsTable.tenantId, tid))
        .orderBy(desc(commandDrawdownRequestsTable.requestedAt)),
    ]);
    sendSuccess(res, {
      data: {
        pools: pools.map(serialisePool),
        drawdowns: drawdowns.map(serialiseDrawdown),
      },
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to reset strategic reserves');
  }
});

router.post(
  '/sync/reserves/drawdowns',
  validateBody(createDrawdownSchema),
  async (req: Request, res: Response) => {
    try {
      const tid = tenantKey(req);
      const body = req.body as z.infer<typeof createDrawdownSchema>;
      const requestedAt = body.requestedAt ? new Date(body.requestedAt) : new Date();
      const [row] = await db
        .insert(commandDrawdownRequestsTable)
        .values({
          id: body.id,
          tenantId: tid,
          poolId: body.poolId,
          amount: body.amount,
          justification: body.justification,
          requestedBy: body.requestedBy,
          requestedAt,
          status: 'PENDING',
        })
        .returning();
      sendCreated(res, { data: serialiseDrawdown(row!) });
    } catch (err) {
      handleRouteError(res, err, 'Failed to submit drawdown request');
    }
  },
);

router.post(
  '/sync/reserves/drawdowns/:id/approve',
  async (req: Request, res: Response) => {
    try {
      const tid = tenantKey(req);
      const id = req.params.id;
      const result = await db.transaction(async (tx) => {
        const [request] = await tx
          .select()
          .from(commandDrawdownRequestsTable)
          .where(
            and(
              eq(commandDrawdownRequestsTable.id, id),
              eq(commandDrawdownRequestsTable.tenantId, tid),
            ),
          )
          .limit(1);
        if (!request) return { notFound: true } as const;
        if (request.status !== 'PENDING') {
          return { conflict: true, request } as const;
        }

        const [pool] = await tx
          .select()
          .from(commandReservePoolsTable)
          .where(
            and(
              eq(commandReservePoolsTable.id, request.poolId),
              eq(commandReservePoolsTable.tenantId, tid),
            ),
          )
          .limit(1);

        const [updatedRequest] = await tx
          .update(commandDrawdownRequestsTable)
          .set({ status: 'APPROVED', updatedAt: new Date() })
          .where(eq(commandDrawdownRequestsTable.id, id))
          .returning();

        let updatedPool = pool;
        if (pool) {
          const newLevel = Math.max(0, pool.currentLevel - request.amount);
          const pctLeft = (newLevel / pool.totalCapacity) * 100;
          const newStatus =
            pctLeft === 0
              ? 'DEPLETED'
              : pctLeft < 15
                ? 'CRITICAL'
                : pctLeft < 35
                  ? 'REDUCED'
                  : 'NOMINAL';
          // Append a new datapoint to the trend so the chart immediately
          // reflects the impact of the approval. If today's date is already
          // present (e.g. multiple drawdowns in the same day), replace it
          // rather than stacking duplicate entries.
          const today = new Date().toISOString().slice(0, 10);
          const prevHistory = pool.trendHistory ?? [];
          const lastPoint = prevHistory[prevHistory.length - 1];
          const newTrendHistory =
            lastPoint && lastPoint.date === today
              ? [...prevHistory.slice(0, -1), { date: today, level: newLevel }]
              : [...prevHistory, { date: today, level: newLevel }];
          const [pp] = await tx
            .update(commandReservePoolsTable)
            .set({
              currentLevel: newLevel,
              status: newStatus,
              lastDrawdown: new Date(),
              trendHistory: newTrendHistory,
              updatedAt: new Date(),
            })
            .where(eq(commandReservePoolsTable.id, pool.id))
            .returning();
          updatedPool = pp;
        }
        return { request: updatedRequest, pool: updatedPool } as const;
      });

      if ('notFound' in result) {
        res.status(404).json({ error: 'drawdown_not_found' });
        return;
      }
      if ('conflict' in result) {
        res.status(409).json({
          error: 'drawdown_already_decided',
          status: result.request.status,
        });
        return;
      }
      sendSuccess(res, {
        data: {
          drawdown: serialiseDrawdown(result.request!),
          pool: result.pool ? serialisePool(result.pool) : null,
        },
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to approve drawdown');
    }
  },
);

router.post(
  '/sync/reserves/drawdowns/:id/reject',
  async (req: Request, res: Response) => {
    try {
      const tid = tenantKey(req);
      const id = req.params.id;
      const [row] = await db
        .update(commandDrawdownRequestsTable)
        .set({ status: 'REJECTED', updatedAt: new Date() })
        .where(
          and(
            eq(commandDrawdownRequestsTable.id, id),
            eq(commandDrawdownRequestsTable.tenantId, tid),
            eq(commandDrawdownRequestsTable.status, 'PENDING'),
          ),
        )
        .returning();
      if (!row) {
        res.status(404).json({ error: 'drawdown_not_found_or_decided' });
        return;
      }
      sendSuccess(res, { data: serialiseDrawdown(row) });
    } catch (err) {
      handleRouteError(res, err, 'Failed to reject drawdown');
    }
  },
);

export default router;
