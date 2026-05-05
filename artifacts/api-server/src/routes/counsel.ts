import {
  db,
  pcGcAuditEntriesTable,
  pcGcMattersTable,
  pcGcObligationsTable,
  pcGcProofChainEntriesTable,
} from '@szl-holdings/db';
import { PRISM_LITIGATION_OUTCOME, runSimulation } from '@szl-holdings/monte-carlo';
import { prismBus } from '@szl-holdings/prism-bus';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import {
  runPCEGate,
} from '../a11oy/runtime/governance/pce-gate.js';
import {
  counselAuditTrailQuerySchema,
  counselDeleteMatterBodySchema,
  counselProofChainQuerySchema,
  validateBody,
  validateQuery,
} from '../lib/validation';
import { defaultToolRegistry } from '@workspace/tool-mesh';
import { COUNSEL_TOOL_MANIFEST, dispatchCounselTool } from '../a11oy/tools/counsel-tools';
import {
  ForecastOutputSchema,
  type ForecastInput,
  type ForecastOutput,
  type HeadDefinition,
  type ModelAdapter,
  globalForecastServiceWithHeads,
} from '@workspace/forecast-fabric';
import { globalEvalRegistry, startDriftEvalScheduler } from '@workspace/drift-eval';

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Register Counsel tools in the A11oy tool mesh at module load time.
// Each entry in COUNSEL_TOOL_MANIFEST is mapped to the ToolManifest schema
// so it is discoverable via GET /tool-mesh/catalog/list and BM25 catalog search.
// ---------------------------------------------------------------------------
for (const tool of COUNSEL_TOOL_MANIFEST) {
  defaultToolRegistry.register({
    id: tool.toolId,
    name: tool.displayName,
    version: '1.0.0',
    description: tool.description,
    domainTags: ['legal'],
    policyTier: 'internal-workflow',
    allowedEnvironments: ['development', 'staging', 'production'],
    enabled: true,
  });
}

// ---------------------------------------------------------------------------
// COUNSEL_DEMO_ORG_ID — org used by GET /counsel/matters when unauthenticated.
// The seed route writes to this org so the demo investor journey works without login.
// ---------------------------------------------------------------------------
const COUNSEL_DEMO_ORG_ID = 'demo-org';

// ---------------------------------------------------------------------------
// Rate limiters — applied to write/mutate routes (POST/PATCH/DELETE) to
// prevent brute-force and abuse. Read-only GET routes are protected at the
// global-auth-enforcer level (UNAUTHORIZED for unregistered paths).
// ---------------------------------------------------------------------------
const counselWriteLimiter = rateLimit({
  windowMs: 60_000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: 'Too many requests. Slow down.' },
});

const counselSeedLimiter = rateLimit({
  windowMs: 300_000, // 5 min
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: 'Seed endpoint rate limited.' },
});

// MonteCarloLitigationAdapter — model adapter backing the three Counsel
// forecast heads via PRISM Monte Carlo simulation.
const MonteCarloLitigationAdapter: ModelAdapter = {
  id: 'monte-carlo-litigation',
  name: 'Monte Carlo Litigation Outcome (PRISM)',
  async invoke(input: ForecastInput, head: HeadDefinition): Promise<ForecastOutput> {
    let simResult: Awaited<ReturnType<typeof runSimulation>> | null = null;
    try {
      simResult = await runSimulation(PRISM_LITIGATION_OUTCOME, { iterations: 500, timeoutMs: 10_000 });
    } catch {
      throw new Error(`monte-carlo-litigation adapter: PRISM simulation failed for ${head.name}`);
    }

    const horizons = input.requestedHorizons?.length ? input.requestedHorizons : head.horizons;
    const generatedAt = new Date().toISOString();
    const totalIterations = simResult?.totalIterations ?? 0;

    let intervals: ForecastOutput['intervals'];

    if (head.name === 'counsel:settlement-likelihood') {
      const s = simResult?.results?.['settlementProbability'];
      const mean = (s?.stats?.mean ?? 0) / 100;
      const std = (s?.stats?.stdDev ?? 0) / 100;
      intervals = horizons.map((horizon, i) => ({
        point: parseFloat(Math.min(0.99, mean + i * 0.02).toFixed(3)),
        lower: parseFloat(Math.max(0, mean - std).toFixed(3)),
        upper: parseFloat(Math.min(0.99, mean + std).toFixed(3)),
        confidence: parseFloat((0.88 - i * 0.06).toFixed(2)),
        horizon,
        unit: 'probability',
      }));
    } else if (head.name === 'counsel:risk-exposure') {
      const e = simResult?.results?.['totalExposure'];
      const mean = e?.stats?.mean ?? 0;
      const std = e?.stats?.stdDev ?? 0;
      intervals = horizons.map((horizon, i) => ({
        point: parseFloat((mean * (1 + i * 0.1)).toFixed(2)),
        lower: parseFloat(Math.max(0, mean - std).toFixed(2)),
        upper: parseFloat((mean + std * (1 + i * 0.2)).toFixed(2)),
        confidence: parseFloat((0.87 - i * 0.07).toFixed(2)),
        horizon,
        unit: '$M',
      }));
    } else {
      // counsel:obligation-cascade — cascade probability derived from settlement posterior
      const s = simResult?.results?.['settlementProbability'];
      const settlementMean = (s?.stats?.mean ?? 50) / 100;
      const cascadeBase = Math.min(0.95, Math.max(0.05, 1 - settlementMean + 0.1));
      intervals = horizons.map((horizon, i) => ({
        point: parseFloat(Math.min(0.95, cascadeBase * (0.7 + i * 0.1)).toFixed(3)),
        lower: parseFloat(Math.max(0, cascadeBase * 0.5).toFixed(3)),
        upper: parseFloat(Math.min(0.99, cascadeBase * (0.9 + i * 0.1)).toFixed(3)),
        confidence: parseFloat((0.86 - i * 0.06).toFixed(2)),
        horizon,
        unit: 'score',
      }));
    }

    const output: ForecastOutput = {
      headName: head.name,
      lane: head.lane,
      label: head.label,
      intervals,
      provenance: {
        headName: head.name,
        modelId: `monte-carlo-litigation/${PRISM_LITIGATION_OUTCOME.id}@500i`,
        modelVersion: '1.0.0',
        adapterId: 'monte-carlo-litigation',
        generatedAt,
      },
      signals: { ...input.context, scenarioId: PRISM_LITIGATION_OUTCOME.id, totalIterations },
      alertThreshold: head.alertThreshold,
      thresholdBreached:
        head.alertThreshold !== undefined
          ? intervals.some((iv) => iv.upper > (head.alertThreshold ?? Infinity))
          : undefined,
    };

    return ForecastOutputSchema.parse(output);
  },
};

globalForecastServiceWithHeads.registerAdapter(MonteCarloLitigationAdapter);

// ---------------------------------------------------------------------------
// Drift-eval scheduler — monitor counsel forecast heads for distribution shift.
// Runs in-process; drift results are persisted to globalEvalRegistry.
// ---------------------------------------------------------------------------
const COUNSEL_DRIFT_HEADS = [
  'counsel:obligation-cascade',
  'counsel:settlement-likelihood',
  'counsel:risk-exposure',
];

startDriftEvalScheduler(
  COUNSEL_DRIFT_HEADS.map((headName) => ({
    headName,
    driftIntervalMs: 5 * 60 * 1000,
    ccIntervalMs: 15 * 60 * 1000,
  })),
  globalEvalRegistry,
);

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

// DEMO_MATTERS — same DTO as loadMatter(), seeded with M-XJSEC-2026-001.
const _demoBuildDate = new Date();
const _demoD30 = new Date(_demoBuildDate.getTime() + 30 * 86400000).toISOString().split('T')[0];
const _demoD60 = new Date(_demoBuildDate.getTime() + 60 * 86400000).toISOString().split('T')[0];
const _demoD90 = new Date(_demoBuildDate.getTime() + 90 * 86400000).toISOString().split('T')[0];
const _demoD270 = new Date(_demoBuildDate.getTime() + 270 * 86400000).toISOString().split('T')[0];

const DEMO_MATTERS = [
  {
    id: 'M-XJSEC-2026-001',
    name: 'Cross-jurisdictional securities matter — 90 days to first hearing',
    clientName: 'Axiom Capital Partners LP',
    matterNumber: 'XJSEC-2026-001',
    type: 'litigation' as const,
    status: 'escalated',
    privilegeLevel: 'restricted' as const,
    pressureScore: 91,
    complexityScore: 88,
    openedDate: _demoBuildDate.toISOString().split('T')[0],
    trialDate: _demoD270,
    closingDate: null,
    nextDeadline: _demoD90,
    nextDeadlineLabel: 'First Hearing — SDNY',
    leadCounsel: 'Sarah Chen, Partner',
    jurisdiction: 'US-FEDERAL',
    estimatedExposure: 47_500_000,
    summary: 'Coordinated securities fraud and market manipulation claim spanning US (SDNY), UK (FCA enforcement referral), and Singapore (MAS investigation). Plaintiff class alleges insider trading in structured products tied to a cross-border SPV. Three parallel regulatory inquiries active.',
    tags: ['securities', 'cross-jurisdictional', 'class-action', 'regulatory', 'fca', 'mas', 'sdny', 'insider-trading'],
    parties: [
      { id: 'p1', name: 'Axiom Capital Partners LP', role: 'client', counsel: 'Sarah Chen', jurisdiction: 'US-FEDERAL' },
      { id: 'p2', name: 'Meridian Class Plaintiffs', role: 'opposing-counsel', counsel: 'Davis & Polk LLP', jurisdiction: 'US-FEDERAL' },
      { id: 'p3', name: 'FCA', role: 'regulator', counsel: null, jurisdiction: 'UK' },
      { id: 'p4', name: 'MAS', role: 'regulator', counsel: null, jurisdiction: 'SG' },
    ],
    wall: {
      enabled: true,
      reason: 'FCA cross-border referral — access limited to matter team',
      blockedRoles: ['associate', 'paralegal'],
      approvedUsers: ['sarah.chen@firm.com', 'james.okafor@firm.com', 'mei.lin@firm.com'],
      createdAt: _demoBuildDate.toISOString(),
      createdBy: 'sarah.chen@firm.com',
    },
    obligations: [
      {
        id: 'ob-demo-001', matterId: 'M-XJSEC-2026-001',
        title: 'Discovery production — SDNY Rule 26', description: 'Initial disclosures and ESI protocol submission',
        dueDate: _demoD30, status: 'in-progress' as const, assignee: 'James Okafor',
        dependencies: [], privilegeLevel: 'confidential' as const, filingRequired: true,
        courtId: 'SDNY-1:26-cv-00417', consequence: 'Adverse inference instruction risk', completedDate: undefined,
      },
      {
        id: 'ob-demo-002', matterId: 'M-XJSEC-2026-001',
        title: 'Expert witness designation — damages', description: 'Designate damages expert under FRCP 26(a)(2)',
        dueDate: _demoD60, status: 'pending' as const, assignee: 'Mei Lin',
        dependencies: ['ob-demo-001'], privilegeLevel: 'confidential' as const, filingRequired: true,
        courtId: 'SDNY-1:26-cv-00417', consequence: 'Expert excluded if missed', completedDate: undefined,
      },
      {
        id: 'ob-demo-003', matterId: 'M-XJSEC-2026-001',
        title: 'First hearing — SDNY', description: 'Preliminary injunction hearing, courtroom 14B',
        dueDate: _demoD90, status: 'pending' as const, assignee: 'Sarah Chen',
        dependencies: ['ob-demo-001', 'ob-demo-002'], privilegeLevel: 'public' as const, filingRequired: false,
        courtId: 'SDNY-1:26-cv-00417', consequence: 'Default judgment risk', completedDate: undefined,
      },
      {
        id: 'ob-demo-004', matterId: 'M-XJSEC-2026-001',
        title: 'FCA response — cross-border privilege memo', description: 'Prepare common-law privilege analysis memo for FCA',
        dueDate: _demoD60, status: 'at-risk' as const, assignee: 'James Okafor',
        dependencies: [], privilegeLevel: 'privileged' as const, filingRequired: false,
        courtId: undefined, consequence: 'Regulatory sanction; privilege waiver risk', completedDate: undefined,
      },
    ],
    auditTrail: [
      { id: 'aud-demo-001', matterId: 'M-XJSEC-2026-001', timestamp: new Date(_demoBuildDate.getTime() - 7200000).toISOString(), user: 'sarah.chen@firm.com', role: 'partner', action: 'viewed' as const, detail: 'Matter dashboard accessed', ip: '[REDACTED]' },
      { id: 'aud-demo-002', matterId: 'M-XJSEC-2026-001', timestamp: new Date(_demoBuildDate.getTime() - 3600000).toISOString(), user: 'james.okafor@firm.com', role: 'associate', action: 'edited' as const, detail: 'Obligation ob-demo-001 status updated to in-progress', ip: '[REDACTED]' },
    ],
    proofChain: [
      { id: 'pf-demo-001', matterId: 'M-XJSEC-2026-001', timestamp: new Date(_demoBuildDate.getTime() - 86400000 * 14).toISOString(), eventType: 'filing' as const, title: 'Complaint filed — SDNY', summary: 'Class action complaint filed alleging §10(b) and Rule 10b-5 violations', privilegeLevel: 'public' as const, author: 'Sarah Chen', parties: ['Axiom Capital Partners LP', 'Meridian Class Plaintiffs'], documentRef: 'SDNY-1:26-cv-00417-001', hash: undefined, redacted: false },
      { id: 'pf-demo-002', matterId: 'M-XJSEC-2026-001', timestamp: new Date(_demoBuildDate.getTime() - 86400000 * 7).toISOString(), eventType: 'communication' as const, title: 'FCA referral notice received', summary: 'FCA issued a cross-border referral notice under FSMA 2000 s.354', privilegeLevel: 'restricted' as const, author: 'James Okafor', parties: ['FCA', 'Axiom Capital Partners LP'], documentRef: 'FCA-REF-2026-0041', hash: undefined, redacted: false },
      { id: 'pf-demo-003', matterId: 'M-XJSEC-2026-001', timestamp: new Date(_demoBuildDate.getTime() - 86400000).toISOString(), eventType: 'order' as const, title: 'SDNY Case Management Order', summary: 'Court set discovery schedule, expert deadlines, and first hearing date', privilegeLevel: 'public' as const, author: 'SDNY Clerk', parties: ['Axiom Capital Partners LP', 'Meridian Class Plaintiffs'], documentRef: 'SDNY-CMO-2026-0417', hash: undefined, redacted: false },
    ],
    provenance: 'demo',
  },
];

router.get('/counsel/matters', async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);

    // Unauthenticated callers get embedded demo matters so the investor/demo
    // journey (dashboard → matters → AEF search → decision center) works
    // end-to-end without requiring a seed call or DB access.
    if (!orgId) {
      return sendSuccess(res, { matters: DEMO_MATTERS, provenance: 'demo' });
    }

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
  counselWriteLimiter,
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
  counselWriteLimiter,
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
  counselWriteLimiter,
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
  counselWriteLimiter,
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
  counselWriteLimiter,
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

// ---------------------------------------------------------------------------
// ML Forecast heads — Monte Carlo backed
// Three heads: obligation-cascade, settlement-likelihood, risk-exposure
// ---------------------------------------------------------------------------

let _forecastCache: { heads: unknown[]; generatedAt: string } | null = null;
let _forecastCacheMs = 0;
const FORECAST_TTL_MS = 5 * 60 * 1000;

async function buildMLForecastHeads() {
  const now = Date.now();
  if (_forecastCache && now - _forecastCacheMs < FORECAST_TTL_MS) return _forecastCache;

  const generatedAt = new Date().toISOString();

  // Run Monte Carlo simulation — results are used as context passed into each registered
  // forecast head, enriching provenance with per-scenario distribution stats.
  // Failure is non-fatal: the fabric's safe-default adapter generates fallback intervals.
  let simResult: Awaited<ReturnType<typeof runSimulation>> | null = null;
  try {
    simResult = await runSimulation(PRISM_LITIGATION_OUTCOME, { iterations: 500, timeoutMs: 10_000 });
  } catch {
    // Non-fatal — fabric heads run without Monte Carlo enrichment context
  }

  const settlement = simResult?.results?.['settlementProbability'];
  const exposure = simResult?.results?.['totalExposure'];
  const expectedLoss = simResult?.results?.['expectedLoss'];
  const totalIterations = simResult?.totalIterations ?? 0;

  // Shared Monte Carlo posterior context passed to each head as provenance.
  const mcContext = {
    monteCarloScenarioId: PRISM_LITIGATION_OUTCOME.id,
    monteCarloIterations: totalIterations,
    settlementProbabilityMean: settlement?.stats.mean,
    settlementProbabilityStd: settlement?.stats.stdDev,
    settlementP10: settlement?.stats.p10,
    settlementP50: settlement?.stats.p50,
    settlementP90: settlement?.stats.p90,
    totalExposureMeanM: exposure?.stats.mean,
    totalExposureStdM: exposure?.stats.stdDev,
    exposureP10: exposure?.stats.p10,
    exposureP50: exposure?.stats.p50,
    exposureP90: exposure?.stats.p90,
    expectedLossMean: expectedLoss?.stats.mean,
  };

  // --- Invoke the three required Counsel forecast heads from the model registry ---
  // Each head is registered in forecast-fabric (packages/forecast-fabric/src/heads/index.ts)
  // and served via globalForecastServiceWithHeads. Monte Carlo context enriches provenance.
  const REQUIRED_COUNSEL_HEADS = [
    'counsel:obligation-cascade',
    'counsel:settlement-likelihood',
    'counsel:risk-exposure',
  ] as const;

  const fabricOutputs = await Promise.allSettled(
    REQUIRED_COUNSEL_HEADS.map((headName) =>
      globalForecastServiceWithHeads.forecast({ headName, context: mcContext }),
    ),
  );

  const heads = fabricOutputs.map((result, i) => {
    const headName = REQUIRED_COUNSEL_HEADS[i];
    if (result.status === 'rejected') {
      // Explicit failure signal — no silent static-prior fallback
      return {
        headName,
        lane: 'counsel',
        label: headName,
        intervals: [],
        provenance: {
          adapterId: 'safe-default',
          generatedAt,
          error: 'forecast-fabric invocation failed',
          monteCarloContext: mcContext,
        },
        alertThreshold: null,
        thresholdBreached: false,
        fabricError: true,
      };
    }
    const out = result.value;
    // Guard: adapter returned null (e.g. mocked or degraded) — surface explicit error
    if (!out) {
      return {
        headName,
        lane: 'counsel',
        label: headName,
        intervals: [],
        provenance: {
          adapterId: 'safe-default',
          generatedAt,
          error: 'adapter returned null output',
          monteCarloContext: mcContext,
        },
        alertThreshold: null,
        thresholdBreached: false,
        fabricError: true,
      };
    }
    return {
      ...out,
      provenance: {
        ...out.provenance,
        // Layer Monte Carlo distribution stats into provenance for full traceability
        monteCarloScenarioId: mcContext.monteCarloScenarioId,
        monteCarloIterations: mcContext.monteCarloIterations,
        ...(headName === 'counsel:settlement-likelihood' && {
          outputMetric: 'settlementProbability',
          p10: mcContext.settlementP10,
          p50: mcContext.settlementP50,
          p90: mcContext.settlementP90,
        }),
        ...(headName === 'counsel:risk-exposure' && {
          outputMetric: 'totalExposure',
          p10: mcContext.exposureP10,
          p50: mcContext.exposureP50,
          p90: mcContext.exposureP90,
          expectedLossMean: mcContext.expectedLossMean,
        }),
      },
    };
  });

  _forecastCache = { heads, generatedAt };
  _forecastCacheMs = now;
  return _forecastCache;
}

router.get('/counsel/forecast', async (_req: Request, res: Response) => {
  try {
    const { heads, generatedAt } = await buildMLForecastHeads();
    prismBus.publish({ type: 'domain_signal', domain: 'prism', sourceId: 'counsel-forecast', payload: { signal: 'forecast_refreshed', headCount: heads.length, generatedAt }, severity: 'info' });
    sendSuccess(res, {
      heads,
      generatedAt,
      adapter: 'monte-carlo',
      domain: 'counsel',
      scenario: { id: PRISM_LITIGATION_OUTCOME.id, title: PRISM_LITIGATION_OUTCOME.title },
    });
  } catch (err) {
    handleRouteError(res, err, 'GET /counsel/forecast');
  }
});

// ---------------------------------------------------------------------------
// A11oy tool mesh — execution endpoint
// Accepts tool invocations from the A11oy agent mesh and dispatches them to
// dispatchCounselTool, which is wired to all four Counsel domain tools.
// ---------------------------------------------------------------------------

const toolDispatchSchema = z.object({
  toolName: z.enum(['matter-lookup', 'settlement-reforecast', 'citation-search', 'draft-obligation']),
  params: z.record(z.unknown()).default({}),
  userId: z.string().optional(),
});

router.post(
  '/counsel/tools/dispatch',
  counselWriteLimiter,
  validateBody(toolDispatchSchema),
  async (req: Request, res: Response) => {
    try {
      // Require authenticated org context — tool execution is a mutating operation
      // that emits Prism Bus signals and may write audit records. No anonymous/demo access.
      const orgId = requireOrgId(req, res);
      if (!orgId) return;

      const body = req.body as z.infer<typeof toolDispatchSchema>;
      const userId = body.userId ?? req.user?.id?.toString();

      const result = await dispatchCounselTool({
        toolName: body.toolName,
        params: body.params,
        orgId,
        userId,
      });

      if (!result.success) {
        res.status(422).json({ error: result.error, code: 'TOOL_EXECUTION_FAILED', result });
        return;
      }
      return sendSuccess(res, { result });
    } catch (err) {
      return handleRouteError(res, err, 'POST /counsel/tools/dispatch');
    }
  },
);

// Tool manifest is auth-gated — callers must have a valid session.
// The manifest lists tool IDs and param schemas (no execution, no data).
router.get('/counsel/tools', (req: Request, res: Response) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  return sendSuccess(res, { tools: COUNSEL_TOOL_MANIFEST });
});

// ---------------------------------------------------------------------------
// Decision Center — PCE gate execution
// ---------------------------------------------------------------------------

const decisionExecuteSchema = z.object({
  matterId: z.string().min(1),
  actionId: z.string().min(1),
  actionDescription: z.string().min(1),
  signalIds: z.array(z.string()).default([]),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

router.post(
  '/counsel/decision-center/execute',
  counselWriteLimiter,
  validateBody(decisionExecuteSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof decisionExecuteSchema>;
      const orgId = getOrgId(req);
      // Demo mode: no org context. PCE gate still runs for a functional Decision
      // Center in the investor walkthrough, but audit writes and Prism Bus signals
      // are suppressed so unauthenticated callers produce no tenant-side effects.
      const isDemo = !orgId;

      const pceResult = await runPCEGate({
        actionId: body.actionId,
        vertical: 'legal',
        riskLevel: body.riskLevel,
        isDestructive: false,
        originSignalIds: body.signalIds.length > 0 ? body.signalIds : [`counsel:${body.matterId}:decision`],
        actionDescription: body.actionDescription,
        policyViolations: [],
      });

      if (!isDemo) {
        const auditId = `a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const [matter] = await db
          .select({ id: pcGcMattersTable.id })
          .from(pcGcMattersTable)
          .where(and(eq(pcGcMattersTable.id, body.matterId), eq(pcGcMattersTable.orgId, orgId!)));
        if (matter) {
          await db.insert(pcGcAuditEntriesTable).values({
            id: auditId,
            matterId: body.matterId,
            timestamp: new Date(),
            user: req.user?.email ?? 'system',
            role: 'decision-center',
            action: 'escalated',
            detail: `PCE gate executed: ${body.actionDescription} — ${pceResult.allowed ? 'ALLOWED' : 'BLOCKED'}${pceResult.requiresApproval ? ' (requires approval)' : ''}`,
            ip: req.ip ?? '',
          });
        }
        // Signal only on live (authenticated) executions
        prismBus.publish({ type: 'domain_signal', domain: 'prism', sourceId: 'counsel-decision-center', payload: { signal: 'pce_gate_executed', matterId: body.matterId, actionId: body.actionId, allowed: pceResult.allowed, requiresApproval: pceResult.requiresApproval ?? false, approvalTier: pceResult.approvalTier }, severity: 'info' });
      }

      sendSuccess(res, {
        allowed: pceResult.allowed,
        requiresApproval: pceResult.requiresApproval ?? false,
        approvalTier: pceResult.approvalTier,
        blockedReason: pceResult.blockedReason,
        contractId: pceResult.contract?.contractId,
        executedAt: new Date().toISOString(),
        mode: isDemo ? 'demo' : 'live',
      });
    } catch (err) {
      handleRouteError(res, err, 'POST /counsel/decision-center/execute');
    }
  },
);

// ---------------------------------------------------------------------------
// Cross-pollination: Obligation export (Conduit-style)
// ---------------------------------------------------------------------------

router.get('/counsel/obligations/export', async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const format = typeof req.query.format === 'string' ? req.query.format : 'json';
    if (!orgId) {
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=obligations.csv');
        return res.send('matterId,matterName,id,title,status,dueDate,assignee,consequence\n');
      }
      return sendSuccess(res, { obligations: [], format, exportedAt: new Date().toISOString(), note: 'No session — seed a case study then sign in to export' });
    }
    const matterRows = await db
      .select({ id: pcGcMattersTable.id, name: pcGcMattersTable.name })
      .from(pcGcMattersTable)
      .where(eq(pcGcMattersTable.orgId, orgId));
    const matterIds = matterRows.map((r) => r.id);
    const matterName = Object.fromEntries(matterRows.map((r) => [r.id, r.name]));
    if (matterIds.length === 0) {
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=obligations.csv');
        return res.send('matterId,matterName,id,title,status,dueDate,assignee,consequence\n');
      }
      return sendSuccess(res, { obligations: [], format, exportedAt: new Date().toISOString() });
    }
    const rows = await db
      .select()
      .from(pcGcObligationsTable)
      .where(inArray(pcGcObligationsTable.matterId, matterIds))
      .orderBy(asc(pcGcObligationsTable.dueDate));
    const obligations = rows.map((o) => ({
      matterId: o.matterId,
      matterName: matterName[o.matterId] ?? '',
      id: o.id,
      title: o.title,
      status: o.status,
      dueDate: o.dueDate,
      assignee: o.assignee,
      consequence: o.consequence ?? '',
      filingRequired: o.filingRequired,
    }));
    if (format === 'csv') {
      const header = 'matterId,matterName,id,title,status,dueDate,assignee,consequence,filingRequired';
      const csvRows = obligations.map((o) =>
        [o.matterId, `"${o.matterName}"`, o.id, `"${o.title}"`, o.status, o.dueDate, `"${o.assignee}"`, `"${o.consequence}"`, o.filingRequired].join(','),
      );
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=obligations.csv');
      return res.send([header, ...csvRows].join('\n'));
    }
    prismBus.publish({ type: 'domain_signal', domain: 'prism', sourceId: 'counsel-obligations', payload: { signal: 'obligations_exported', orgId, count: obligations.length, format }, severity: 'info' });
    sendSuccess(res, { obligations, format, exportedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, 'GET /counsel/obligations/export');
  }
});

// ---------------------------------------------------------------------------
// Cross-pollination: Pulse-style daily matter brief
// ---------------------------------------------------------------------------

router.get('/counsel/matter-brief', async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      // Demo / unauthenticated mode — return an empty brief so the dashboard widget renders cleanly.
      return sendSuccess(res, {
        date: new Date().toISOString().split('T')[0],
        headline: 'No active session — seed a case study to populate your matter brief',
        metrics: { totalMatters: 0, activeMatters: 0, escalatedMatters: 0, totalExposureM: 0, overdueObligations: 0, atRiskObligations: 0 },
        topRisks: [],
        aegisRiskBadge: { level: 'low', score: 0, signals: [] },
        generatedAt: new Date().toISOString(),
        source: 'counsel:pulse-brief:demo',
      });
    }
    const matters = await db
      .select()
      .from(pcGcMattersTable)
      .where(eq(pcGcMattersTable.orgId, orgId));
    const totalExposure = matters.reduce((acc, m) => acc + (m.estimatedExposure != null ? Number(m.estimatedExposure) : 0), 0);
    const escalated = matters.filter((m) => m.status === 'escalated');
    const highPressure = matters.filter((m) => m.pressureScore > 75);
    const allObligs = matters.length > 0
      ? await db.select().from(pcGcObligationsTable).where(inArray(pcGcObligationsTable.matterId, matters.map((m) => m.id)))
      : [];
    const overdue = allObligs.filter((o) => o.status === 'overdue');
    const atRisk = allObligs.filter((o) => o.status === 'at-risk');

    const today = new Date();
    const brief = {
      date: today.toISOString().split('T')[0],
      headline: escalated.length > 0
        ? `${escalated.length} matter${escalated.length > 1 ? 's' : ''} escalated — immediate partner review required`
        : highPressure.length > 0
          ? `${highPressure.length} high-pressure matter${highPressure.length > 1 ? 's' : ''} require attention`
          : 'Portfolio pressure stable — no immediate escalations',
      metrics: {
        totalMatters: matters.length,
        activeMatters: matters.filter((m) => m.status === 'active').length,
        escalatedMatters: escalated.length,
        totalExposureM: +(totalExposure / 1_000_000).toFixed(2),
        overdueObligations: overdue.length,
        atRiskObligations: atRisk.length,
      },
      topRisks: highPressure.slice(0, 3).map((m) => ({
        matterId: m.id,
        name: m.name,
        pressureScore: m.pressureScore,
        estimatedExposureM: m.estimatedExposure != null ? +(Number(m.estimatedExposure) / 1_000_000).toFixed(2) : null,
        jurisdiction: m.jurisdiction,
        nextDeadline: m.nextDeadline,
      })),
      aegisRiskBadge: {
        level: escalated.length > 0 ? 'critical' : highPressure.length > 1 ? 'high' : overdue.length > 0 ? 'medium' : 'low',
        score: Math.min(100, Math.round((escalated.length * 30 + highPressure.length * 15 + overdue.length * 10))),
        signals: [
          ...(escalated.length > 0 ? [`${escalated.length} escalated matter${escalated.length > 1 ? 's' : ''}`] : []),
          ...(overdue.length > 0 ? [`${overdue.length} overdue obligation${overdue.length > 1 ? 's' : ''}`] : []),
          ...(totalExposure > 5_000_000 ? [`$${(totalExposure / 1_000_000).toFixed(1)}M total exposure`] : []),
        ],
      },
      generatedAt: new Date().toISOString(),
      source: 'counsel:pulse-brief',
    };
    prismBus.publish({ type: 'domain_signal', domain: 'prism', sourceId: 'counsel-matter-brief', payload: { signal: 'matter_brief_generated', orgId, riskLevel: brief.aegisRiskBadge.level }, severity: 'info' });
    sendSuccess(res, brief);
  } catch (err) {
    handleRouteError(res, err, 'GET /counsel/matter-brief');
  }
});

// ---------------------------------------------------------------------------
// Named case study seed: Cross-jurisdictional securities matter
// ---------------------------------------------------------------------------

router.post('/counsel/seed/cross-jurisdictional-securities', counselSeedLimiter, async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req) ?? 'demo-org';

    const matterId = 'M-XJSEC-2026-001';
    const existing = await db
      .select({ id: pcGcMattersTable.id })
      .from(pcGcMattersTable)
      .where(and(eq(pcGcMattersTable.id, matterId), eq(pcGcMattersTable.orgId, orgId)))
      .limit(1);

    if (existing.length > 0) {
      sendSuccess(res, { seeded: false, reason: 'Case study already seeded', matterId });
      return;
    }

    const today = new Date();
    const d90 = new Date(today.getTime() + 90 * 86400000);
    const trialDate = new Date(today.getTime() + 270 * 86400000);

    await db.insert(pcGcMattersTable).values({
      id: matterId,
      orgId,
      name: 'Cross-jurisdictional securities matter — 90 days to first hearing',
      clientName: 'Axiom Capital Partners LP',
      matterNumber: 'XJSEC-2026-001',
      type: 'litigation',
      status: 'escalated',
      privilegeLevel: 'restricted',
      pressureScore: 91,
      complexityScore: 88,
      openedDate: today.toISOString().split('T')[0] as string,
      trialDate: trialDate.toISOString().split('T')[0] as string,
      closingDate: null,
      nextDeadline: d90.toISOString().split('T')[0] as string,
      nextDeadlineLabel: 'First Hearing — SDNY',
      leadCounsel: 'Sarah Chen, Partner',
      jurisdiction: 'US-FEDERAL',
      estimatedExposure: '47500000',
      summary: 'Coordinated securities fraud and market manipulation claim spanning US (SDNY), UK (FCA enforcement referral), and Singapore (MAS investigation). Plaintiff class alleges insider trading in structured products tied to a cross-border SPV. Three parallel regulatory inquiries active. Discovery opens in 45 days. Expert witness designation due 60 days. First hearing in SDNY 90 days. Coordination with UK silk required for privilege analysis across common-law jurisdictions.',
      tags: ['securities', 'cross-jurisdictional', 'class-action', 'regulatory', 'fca', 'mas', 'sdny', 'insider-trading'],
      wall: {
        enabled: true,
        reason: 'FCA cross-border referral — access limited to matter team',
        blockedRoles: ['associate', 'paralegal'],
        approvedUsers: ['sarah.chen@firm.com', 'james.okafor@firm.com', 'mei.lin@firm.com'],
        createdAt: today.toISOString(),
        createdBy: 'sarah.chen@firm.com',
      },
      parties: [
        { id: 'p1', name: 'Axiom Capital Partners LP', role: 'client', counsel: 'Sarah Chen', jurisdiction: 'US-FEDERAL' },
        { id: 'p2', name: 'Meridian Class Plaintiffs', role: 'opposing-counsel', counsel: 'Davis & Polk LLP', jurisdiction: 'US-FEDERAL' },
        { id: 'p3', name: 'Financial Conduct Authority', role: 'regulator', jurisdiction: 'UK' },
        { id: 'p4', name: 'Monetary Authority of Singapore', role: 'regulator', jurisdiction: 'SG' },
        { id: 'p5', name: 'Dr. Elena Vasquez, PhD Economics', role: 'expert', jurisdiction: 'US-FEDERAL' },
        { id: 'p6', name: 'Clifford Chance LLP', role: 'co-counsel', counsel: 'James Blackwood QC', jurisdiction: 'UK' },
      ],
    } as never);

    const obligationBase = [
      { title: 'SDNY First Hearing preparation — witness prep and pre-hearing brief', dueDate: d90.toISOString().split('T')[0] as string, status: 'in-progress', assignee: 'Sarah Chen', consequence: 'Default judgment risk if unprepared', filingRequired: true, courtId: 'SDNY-2026-CV-4471' },
      { title: 'Discovery opens — produce all SPV communications Q1-Q2 2024', dueDate: new Date(today.getTime() + 45 * 86400000).toISOString().split('T')[0] as string, status: 'pending', assignee: 'James Okafor', consequence: 'Adverse inference instruction if incomplete', filingRequired: false, courtId: 'SDNY-2026-CV-4471' },
      { title: 'Expert witness designation — Dr. Vasquez damages methodology', dueDate: new Date(today.getTime() + 60 * 86400000).toISOString().split('T')[0] as string, status: 'pending', assignee: 'Mei Lin', consequence: 'Expert exclusion under Daubert', filingRequired: true, courtId: 'SDNY-2026-CV-4471' },
      { title: 'FCA regulatory response — cross-border privilege analysis memo', dueDate: new Date(today.getTime() + 21 * 86400000).toISOString().split('T')[0] as string, status: 'at-risk', assignee: 'Sarah Chen', consequence: 'FCA enforcement action escalation', filingRequired: false, courtId: undefined },
      { title: 'MAS investigation response — Singapore counsel coordination call', dueDate: new Date(today.getTime() + 14 * 86400000).toISOString().split('T')[0] as string, status: 'pending', assignee: 'James Okafor', consequence: 'MAS fine exposure — SGD 500K', filingRequired: false, courtId: undefined },
      { title: 'Privilege log — 47 disputed documents, US-UK dual assertion', dueDate: new Date(today.getTime() + 30 * 86400000).toISOString().split('T')[0] as string, status: 'in-progress', assignee: 'Mei Lin', consequence: 'In-camera review order', filingRequired: true, courtId: 'SDNY-2026-CV-4471' },
    ];

    for (let i = 0; i < obligationBase.length; i++) {
      const o = obligationBase[i]!;
      await db.insert(pcGcObligationsTable).values({
        id: `o-xjsec-${i + 1}`,
        matterId,
        title: o.title,
        description: o.title,
        dueDate: o.dueDate,
        status: o.status as ObligationStatus,
        assignee: o.assignee,
        dependencies: i > 0 ? [`o-xjsec-${i}`] : [],
        privilegeLevel: 'restricted',
        filingRequired: o.filingRequired,
        courtId: o.courtId ?? null,
        consequence: o.consequence,
        completedDate: null,
        sortOrder: i,
      } as never);
    }

    const proofEvents = [
      { eventType: 'filing', title: 'Complaint filed — SDNY securities fraud', summary: 'Class action complaint alleging coordinated securities fraud and market manipulation across SDNY, FCA, and MAS jurisdictions. 47 named defendants including Axiom Capital Partners LP.', author: 'SDNY Clerk', privilegeLevel: 'public', parties: ['Meridian Class Plaintiffs', 'Axiom Capital Partners LP'] },
      { eventType: 'order', title: 'Scheduling order entered — SDNY CMC', summary: 'Case management conference order establishes: discovery opens 45 days, expert designation 60 days, first hearing 90 days, trial date 270 days from filing.', author: 'Hon. Katherine Sullivan, SDNY', privilegeLevel: 'public', parties: ['All Parties'] },
      { eventType: 'communication', title: 'FCA enforcement referral received', summary: 'Financial Conduct Authority issued formal enforcement referral under FSMA 2000 s.168. Cross-border privilege analysis required within 21 days.', author: 'FCA Division of Enforcement', privilegeLevel: 'confidential', parties: ['Axiom Capital Partners LP', 'Clifford Chance LLP'] },
    ];

    for (let i = 0; i < proofEvents.length; i++) {
      const pe = proofEvents[i]!;
      await db.insert(pcGcProofChainEntriesTable).values({
        id: `pc-xjsec-${i + 1}`,
        matterId,
        timestamp: new Date(today.getTime() - (proofEvents.length - i) * 86400000),
        eventType: pe.eventType as ProofEventType,
        title: pe.title,
        summary: pe.summary,
        privilegeLevel: pe.privilegeLevel as PrivilegeLevel,
        author: pe.author,
        parties: pe.parties,
        documentRef: null,
        hash: null,
        redacted: false,
      } as never);
    }

    prismBus.publish({ type: 'domain_signal', domain: 'prism', sourceId: 'counsel-seed', payload: { signal: 'seed_cross_jurisdictional_securities', orgId, matterId }, severity: 'info' });
    sendSuccess(res, { seeded: true, matterId, obligationsSeeded: obligationBase.length, proofEventsSeeded: proofEvents.length }, 201);
  } catch (err) {
    handleRouteError(res, err, 'POST /counsel/seed/cross-jurisdictional-securities');
  }
});

export default router;
