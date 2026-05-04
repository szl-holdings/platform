import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  decideCortexRoute,
  memoryLookup,
  memoryWrite,
  memoryInvalidate,
  memoryStats,
  buildSlaPlan,
  registerWorker,
  drainWorker,
  listWorkers,
  getWorker,
  getRegistryStats,
  checkOutputConstraints,
  createProofChain,
  getProofChain,
  listProofChains,
  EventPlane,
  executePhaseSequence,
  newId,
  ChecksumConflictError,
} from '../a11oy/cognitive/index.js';
import type { ScoringMode, SlaConstraints } from '../a11oy/cognitive/index.js';
import {
  dbInsertWorker,
  dbInsertRouteDecision,
  dbInsertPhaseRun,
  dbInsertProofChain,
  dbInsertRuntimeEvent,
  dbInsertGuardrailRejection,
  dbListProofChains,
  dbGetProofChain,
  dbListRuntimeEvents,
  dbGetRuntimeEventStats,
  dbListDeployments,
  dbInsertDeployment,
  dbListWorkers,
  dbGetWorker,
  dbListRouteDecisions,
} from '@szl-holdings/db';

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function ok<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  res.json({ ok: true, data, ...(meta ? { meta } : {}) });
}
function err(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ ok: false, error: { code, message } });
}

const DEMO_TENANT = 'tenant-demo';

/**
 * Resolve the caller's tenant identity with strict, fail-closed semantics:
 *
 *   1. Authenticated session (req.user.orgs[0].orgId) — most trusted, cannot
 *      be spoofed by a caller-supplied header.
 *   2. Internal agent request (req.isInternalAgent) — trusted server-to-server
 *      call; the X-Tenant-Id header is honored for cross-tenant system work.
 *   3. Unauthenticated / demo access — always scoped to DEMO_TENANT regardless
 *      of any supplied headers; this prevents IDOR via X-Tenant-Id injection.
 *
 * NOTE: The cognitive router is currently mounted without mandatory auth
 * middleware to support public read-only demo views. Write endpoints that
 * govern real tenant data should always be called with an authenticated session
 * so that path 1 is taken.
 */
function resolveTenant(req: Request): string {
  // Path 1: authenticated session — org identity is validated by auth middleware
  const sessionOrg = (req as unknown as { user?: { orgs?: Array<{ orgId?: number }> } })
    .user?.orgs?.[0]?.orgId;
  if (sessionOrg != null) return String(sessionOrg);

  // Path 2: internal agent call — X-Tenant-Id trusted for cross-tenant queries
  if ((req as unknown as { isInternalAgent?: boolean }).isInternalAgent) {
    const headerTenant = req.headers['x-tenant-id'] as string | undefined;
    if (headerTenant) return headerTenant;
  }

  // Path 3: unauthenticated/public — scope to demo tenant, no header accepted
  return DEMO_TENANT;
}

function validate<T>(schema: z.ZodSchema<T>, data: unknown, res: Response): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    err(res, 400, 'VALIDATION_ERROR', result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
    return null;
  }
  return result.data;
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------
const SlaConstraintsSchema = z.object({
  maxLatencyMs: z.number().positive().optional(),
  maxCostUsd: z.number().positive().optional(),
  minConfidence: z.number().min(0).max(1).optional(),
  sensitivityTier: z.string().optional(),
  requireApproval: z.boolean().optional(),
  preferredScoringMode: z.enum(['latency', 'cost', 'confidence', 'balanced', 'sla']).optional(),
}).optional().default({});

const RouteBodySchema = z.object({
  requestId: z.string().optional(),
  scoringMode: z.enum(['latency', 'cost', 'confidence', 'balanced', 'sla']).optional().default('balanced'),
  constraints: SlaConstraintsSchema,
  domain: z.string().optional(),
});

const ExecuteBodySchema = z.object({
  requestId: z.string().optional(),
  prompt: z.string().min(1, 'prompt cannot be empty'),
  domain: z.string().optional(),
  slaConstraints: SlaConstraintsSchema,
  outputConstraints: z.record(z.unknown()).optional().default({}),
});

const SlaPlanBodySchema = z.object({
  targetLatencyMs: z.number().positive().optional(),
  maxCostUsd: z.number().positive().optional(),
  minConfidenceScore: z.number().min(0).max(1).optional(),
  sensitivityTier: z.string().optional(),
  requireApproval: z.boolean().optional(),
  currentLoadFactor: z.number().min(0).max(2).optional(),
  domain: z.string().optional(),
});

const RegisterWorkerSchema = z.object({
  name: z.string().min(1),
  rolloutGroup: z.string().optional(),
  configChecksum: z.string().min(1),
  capabilities: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

const DrainWorkerSchema = z.object({ workerId: z.string().min(1) });

const MemoryLookupSchema = z.object({
  memoryKey: z.string().min(1),
  queryTags: z.array(z.string()).optional().default([]),
  workspaceId: z.string().optional(),
  domain: z.string().optional(),
});

const MemoryWriteSchema = z.object({
  memoryKey: z.string().min(1),
  data: z.unknown(),
  tags: z.array(z.string()).optional(),
  tokenCount: z.number().nonnegative().optional(),
  ttlMs: z.number().positive().optional(),
  workspaceId: z.string().optional(),
  domain: z.string().optional(),
});

const MemoryInvalidateSchema = z.object({
  memoryKey: z.string().min(1),
  workspaceId: z.string().optional(),
  domain: z.string().optional(),
});

const GuardCheckSchema = z.object({
  outputConstraints: z.record(z.unknown()),
  requestId: z.string().optional(),
  domain: z.string().optional(),
});

const ProofChainCreateSchema = z.object({
  requestId: z.string().min(1),
  routeDecisionId: z.string().optional(),
  workerId: z.string().optional(),
  model: z.string().optional(),
  provider: z.string().optional(),
  approvalStatus: z.string().optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  riskScore: z.number().min(0).max(1).optional(),
  latencyMs: z.number().nonnegative().optional(),
  costEstimateUsd: z.number().nonnegative().optional(),
  sourceCount: z.number().nonnegative().optional(),
  memoryHitCount: z.number().nonnegative().optional(),
  phases: z.array(z.record(z.unknown())).optional(),
  executionSucceeded: z.boolean().optional(),
  failureReason: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const DeploymentCreateSchema = z.object({
  name: z.string().min(1),
  deploymentType: z.string().min(1),
  targetRolloutGroup: z.string().optional().default('default'),
  newConfigChecksum: z.string().min(1),
  previousConfigChecksum: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const EventReplaySchema = z.object({
  fromEventId: z.string().optional(),
  eventType: z.string().optional(),
  limit: z.number().positive().max(200).optional().default(100),
});

// ---------------------------------------------------------------------------
// GET /api/a11oy/cognitive/health
// ---------------------------------------------------------------------------
router.get(['/a11oy/cognitive/health', '/a11oy/health'], (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const stats = getRegistryStats(tenantId);
  const memSummary = memoryStats(tenantId);
  const eventSummary = EventPlane.stats(tenantId);

  ok(res, {
    status: 'operational',
    checkedAt: new Date().toISOString(),
    modules: {
      cortexRouter: { status: 'operational', description: 'Multi-criteria scoring router' },
      memoryFabric: {
        status: 'operational',
        entries: memSummary.tenantEntries,
        avgContextReuseScore: memSummary.avgContextReuseScore,
      },
      phaseEngine: { status: 'operational', phases: 10 },
      slaPlanner: { status: 'operational', description: 'SLA-aware route planner' },
      workerRegistry: {
        status: stats.active > 0 ? 'operational' : 'degraded',
        activeWorkers: stats.active,
        drainingWorkers: stats.draining,
        rolloutGroups: stats.rolloutGroups,
      },
      guidedOutputGuard: {
        status: 'operational',
        limits: { jsonSchemaMb: 0.25, nestingDepth: 64, regexKb: 32, grammarKb: 64, whitespaceKb: 1 },
      },
      proofChain: { status: 'operational', description: 'Immutable append-only lineage' },
      eventPlane: { status: 'operational', eventCounts: eventSummary },
    },
  });
});

// ---------------------------------------------------------------------------
// POST /api/a11oy/cognitive/route
// ---------------------------------------------------------------------------
router.post(['/a11oy/cognitive/route', '/a11oy/route'], (req: Request, res: Response) => {
  const body = validate(RouteBodySchema, req.body, res);
  if (!body) return;

  const tenantId = resolveTenant(req);
  const requestId = body.requestId ?? newId('req');
  const workers = listWorkers(tenantId, { status: 'active' });
  const decision = decideCortexRoute({
    requestId,
    tenantId,
    scoringMode: body.scoringMode as ScoringMode,
    constraints: body.constraints as SlaConstraints,
    workers,
    domain: body.domain,
  });

  EventPlane.emit({
    tenantId,
    requestId,
    routeDecisionId: decision.routeDecisionId,
    eventType: 'route.decided',
    payload: {
      model: decision.selectedModel,
      provider: decision.selectedProvider,
      scoringMode: body.scoringMode,
      compositeScore: decision.compositeScore,
    },
  });

  ok(res, decision);
});

// ---------------------------------------------------------------------------
// POST /api/a11oy/cognitive/sla-plan
// ---------------------------------------------------------------------------
router.post(['/a11oy/cognitive/sla-plan', '/a11oy/sla-plan'], (req: Request, res: Response) => {
  const body = validate(SlaPlanBodySchema, req.body, res);
  if (!body) return;
  const plan = buildSlaPlan(body as Parameters<typeof buildSlaPlan>[0]);
  ok(res, plan);
});

// ---------------------------------------------------------------------------
// POST /api/a11oy/cognitive/execute
// ---------------------------------------------------------------------------
router.post(['/a11oy/cognitive/execute', '/a11oy/execute'], async (req: Request, res: Response) => {
  const body = validate(ExecuteBodySchema, req.body, res);
  if (!body) return;

  const tenantId = resolveTenant(req);
  const requestId = body.requestId ?? newId('req');
  const createdAt = new Date().toISOString();

  // Guard check
  if (Object.keys(body.outputConstraints).length > 0) {
    const guardResult = checkOutputConstraints(
      body.outputConstraints as Parameters<typeof checkOutputConstraints>[0],
      { requestId, tenantId, domain: body.domain },
    );
    if (!guardResult.passed) {
      const rejEvent = EventPlane.emit({ tenantId, requestId, eventType: 'guard.rejected', payload: { rejections: guardResult.rejections } });
      void dbInsertRuntimeEvent({ eventId: rejEvent.eventId, tenantId: rejEvent.tenantId, requestId: rejEvent.requestId ?? null, proofChainId: rejEvent.proofChainId ?? null, eventType: rejEvent.eventType, payload: rejEvent.payload });
      for (const r of guardResult.rejections) {
        void dbInsertGuardrailRejection({
          rejectionId: r.rejectionId,
          tenantId,
          requestId,
          guardRule: r.guardRule as import('@szl-holdings/db').InsertA11oyGuardrailRejection['guardRule'],
          violatedLimit: r.violatedLimit,
          actualSize: r.actualSize ?? null,
          maxAllowed: r.maxAllowed ?? null,
          redactedSnippet: r.redactedSnippet ?? null,
          domain: body.domain ?? null,
        });
      }
      return err(res, 422, 'GUARD_REJECTION', `Output constraints failed: ${guardResult.rejections.map((r) => r.guardRule).join(', ')}`);
    }
  }

  // Route
  const workers = listWorkers(tenantId, { status: 'active' });
  const decision = decideCortexRoute({
    requestId,
    tenantId,
    constraints: body.slaConstraints as SlaConstraints,
    workers,
    domain: body.domain,
  });
  void dbInsertRouteDecision({
    routeDecisionId: decision.routeDecisionId,
    requestId: decision.requestId,
    tenantId: decision.tenantId,
    selectedModel: decision.selectedModel,
    selectedProvider: decision.selectedProvider,
    workerId: decision.workerId ?? null,
    scoringMode: decision.scoringMode,
    latencyScore: decision.latencyScore ?? null,
    costScore: decision.costScore ?? null,
    confidenceScore: decision.confidenceScore ?? null,
    compositeScore: decision.compositeScore ?? null,
    isFallback: decision.isFallback,
    fallbackReason: decision.fallbackReason ?? null,
    candidatesEvaluated: decision.candidatesEvaluated,
    estimatedCostUsd: decision.estimatedCostUsd != null ? String(decision.estimatedCostUsd) : null,
    estimatedLatencyMs: decision.estimatedLatencyMs ?? null,
    domain: decision.domain ?? null,
    sensitivityTier: decision.sensitivityTier,
    slaConstraints: body.slaConstraints ?? null,
    decidedAt: new Date(decision.decidedAt),
  });

  const routeEvent = EventPlane.emit({
    tenantId,
    requestId,
    routeDecisionId: decision.routeDecisionId,
    workerId: decision.workerId,
    eventType: 'route.decided',
    payload: {
      routeDecisionId: decision.routeDecisionId,
      model: decision.selectedModel,
      provider: decision.selectedProvider,
      scoringMode: decision.scoringMode,
      compositeScore: decision.compositeScore,
      latencyScore: decision.latencyScore,
      costScore: decision.costScore,
      confidenceScore: decision.confidenceScore,
      isFallback: decision.isFallback,
      fallbackReason: decision.fallbackReason,
      candidatesEvaluated: decision.candidatesEvaluated,
      estimatedLatencyMs: decision.estimatedLatencyMs,
      estimatedCostUsd: decision.estimatedCostUsd,
      sensitivityTier: decision.sensitivityTier,
      domain: decision.domain,
      decidedAt: decision.decidedAt,
    },
  });
  void dbInsertRuntimeEvent({ eventId: routeEvent.eventId, tenantId: routeEvent.tenantId, requestId: routeEvent.requestId ?? null, proofChainId: routeEvent.proofChainId ?? null, routeDecisionId: routeEvent.routeDecisionId ?? null, workerId: routeEvent.workerId ?? null, correlationId: routeEvent.correlationId ?? null, causationId: routeEvent.causationId ?? null, eventType: routeEvent.eventType, payload: routeEvent.payload });

  // Execute phases — derive metadata from actual handler outputs
  let retrievedSourceCount = 0;
  let retrievedMemoryHitCount = 0;
  let reasonConfidence: number | undefined;

  const { phases, totalLatencyMs, succeeded, failedPhase } = await executePhaseSequence({
    requestId,
    tenantId,
    haltOnFailure: false,
    initialInput: { prompt: body.prompt, domain: body.domain, tenantId },
    handlers: {
      INGEST: async () => ({ ingested: true, prompt: body.prompt }),
      NORMALIZE: async () => ({ normalized: true }),
      RETRIEVE: async () => {
        const sources = body.domain === 'maritime' ? 5 : body.domain === 'legal' ? 4 : 3;
        retrievedSourceCount = sources;
        // Check memory fabric for a cached context entry for this domain/tenant
        const memKey = `ctx-${body.domain ?? 'general'}`;
        const memHit = memoryLookup({ tenantId, domain: body.domain }, memKey, [body.domain ?? 'general']);
        if (memHit.hit) retrievedMemoryHitCount++;
        return { retrieved: true, sourceCount: sources, memoryHit: memHit.hit, contextReuseScore: memHit.contextReuseScore };
      },
      PLAN: async () => ({ plan: 'Step 1: Analyze. Step 2: Respond.' }),
      REASON: async () => {
        const confidence = decision.confidenceScore ?? 0.75;
        reasonConfidence = confidence;
        return { reasoning: `Simulated reasoning for domain: ${body.domain ?? 'general'}`, confidence };
      },
      APPROVE: async () => ({ approved: true, approvalStatus: 'auto_approved' }),
      EXECUTE: async () => ({ executed: true, output: `[DEMO] Response to: ${body.prompt.slice(0, 60)}` }),
      VERIFY: async () => ({ verified: true }),
      AUDIT: async () => ({ audited: true }),
      DELIVER: async () => ({ delivered: true }),
    },
  });

  // Persist phase runs to DB (fire-and-forget)
  for (const phase of phases) {
    void dbInsertPhaseRun({
      phaseRunId: phase.phaseRunId,
      requestId: phase.requestId,
      tenantId: phase.tenantId,
      proofChainId: phase.proofChainId ?? null,
      phase: phase.phase,
      phaseIndex: phase.phaseIndex,
      status: phase.status,
      latencyMs: phase.latencyMs ?? null,
      retryCount: phase.retryCount,
      failureClass: phase.failureClass,
      failureDetail: phase.failureDetail ?? null,
      outputSnapshot: typeof phase.telemetry?.output === 'object' && phase.telemetry.output !== null ? phase.telemetry.output as Record<string, unknown> : {},
      telemetry: phase.telemetry,
      startedAt: phase.startedAt ? new Date(phase.startedAt) : null,
      completedAt: phase.completedAt ? new Date(phase.completedAt) : null,
    });
  }

  const completedAt = new Date().toISOString();
  const confidenceScore = reasonConfidence ?? decision.confidenceScore ?? null;
  const riskScore = confidenceScore != null ? Math.round((1 - confidenceScore) * 100) / 100 : null;
  const costEstimate = decision.estimatedCostUsd ?? null;
  const approvalStatus = 'auto_approved' as const;
  const sourceCount = retrievedSourceCount;
  const memoryHitCount = retrievedMemoryHitCount;

  // Proof chain (always created — even on failure)
  const proof = createProofChain({
    requestId,
    tenantId,
    routeDecisionId: decision.routeDecisionId,
    model: decision.selectedModel,
    provider: decision.selectedProvider,
    workerId: decision.workerId,
    approvalStatus,
    confidenceScore: confidenceScore ?? undefined,
    riskScore: riskScore ?? undefined,
    latencyMs: totalLatencyMs,
    sourceCount,
    memoryHitCount,
    phases,
    executionSucceeded: succeeded,
    failureReason: failedPhase ? `Phase ${failedPhase} failed` : undefined,
  });
  void dbInsertProofChain({
    proofChainId: proof.proofChainId,
    requestId: proof.requestId,
    tenantId: proof.tenantId,
    routeDecisionId: proof.routeDecisionId ?? null,
    workerId: proof.workerId ?? null,
    model: proof.model ?? null,
    provider: proof.provider ?? null,
    approvalStatus: proof.approvalStatus ?? 'not_required',
    confidenceScore: proof.confidenceScore ?? null,
    riskScore: proof.riskScore ?? null,
    latencyMs: proof.latencyMs ?? null,
    sourceCount: proof.sourceCount,
    memoryHitCount: proof.memoryHitCount,
    phaseCount: proof.phaseCount,
    completedPhases: proof.completedPhases,
    auditHash: proof.auditHash,
    lineage: proof.lineage,
    executionSucceeded: proof.executionSucceeded,
    failureReason: proof.failureReason ?? null,
    sealedAt: proof.sealedAt ? new Date(proof.sealedAt) : null,
  });

  const sealEvent = EventPlane.emit({
    tenantId,
    requestId,
    proofChainId: proof.proofChainId,
    routeDecisionId: decision.routeDecisionId,
    workerId: decision.workerId,
    eventType: 'proof.sealed',
    payload: { auditHash: proof.auditHash.slice(0, 12), succeeded },
  });
  void dbInsertRuntimeEvent({ eventId: sealEvent.eventId, tenantId: sealEvent.tenantId, requestId: sealEvent.requestId ?? null, proofChainId: sealEvent.proofChainId ?? null, routeDecisionId: sealEvent.routeDecisionId ?? null, workerId: sealEvent.workerId ?? null, correlationId: sealEvent.correlationId ?? null, causationId: sealEvent.causationId ?? null, eventType: sealEvent.eventType, payload: sealEvent.payload });

  ok(res, {
    requestId,
    routeDecisionId: decision.routeDecisionId,
    proofChainId: proof.proofChainId,
    model: decision.selectedModel,
    provider: decision.selectedProvider,
    workerId: decision.workerId ?? null,
    createdAt,
    completedAt,
    latencyMs: totalLatencyMs,
    costEstimate,
    confidenceScore,
    riskScore,
    approvalStatus,
    sourceCount,
    memoryHitCount,
    phases: phases.map((p) => ({ phase: p.phase, status: p.status, latencyMs: p.latencyMs })),
    executionSucceeded: succeeded,
    failedPhase: failedPhase ?? null,
    auditHash: proof.auditHash,
    isDemoMode: true,
  });
});

// ---------------------------------------------------------------------------
// GET /api/a11oy/cognitive/route-decisions
// ---------------------------------------------------------------------------
router.get(['/a11oy/cognitive/route-decisions', '/a11oy/route-decisions'], async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const { requestId, limit, offset } = req.query as Record<string, string>;
  try {
    const { records, total } = await dbListRouteDecisions(tenantId, {
      requestId,
      limit: limit ? Math.min(parseInt(limit, 10), 100) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    ok(res, records, { total });
  } catch {
    ok(res, [], { total: 0, source: 'unavailable' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/a11oy/cognitive/workers
// ---------------------------------------------------------------------------
router.get(['/a11oy/cognitive/workers', '/a11oy/workers'], async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const { rolloutGroup, status } = req.query as { rolloutGroup?: string; status?: string };
  const stats = getRegistryStats(tenantId);
  try {
    const workers = await dbListWorkers(tenantId, {
      rolloutGroup,
      status,
      limit: 200,
    });
    ok(res, workers, { stats, total: workers.length });
  } catch {
    const workers = listWorkers(tenantId, {
      rolloutGroup,
      status: status as Parameters<typeof listWorkers>[1]['status'],
    });
    ok(res, workers, { stats, total: workers.length, source: 'in_memory' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/a11oy/cognitive/workers/:workerId
// ---------------------------------------------------------------------------
router.get(['/a11oy/cognitive/workers/:workerId', '/a11oy/workers/:workerId'], async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const workerId = req.params.workerId!;
  try {
    const worker = await dbGetWorker(workerId, tenantId);
    if (!worker) {
      const mem = getWorker(workerId, tenantId);
      if (!mem) return err(res, 404, 'WORKER_NOT_FOUND', `Worker "${workerId}" not found`);
      return ok(res, mem);
    }
    return ok(res, worker);
  } catch {
    const mem = getWorker(workerId, tenantId);
    if (!mem) return err(res, 404, 'WORKER_NOT_FOUND', `Worker "${workerId}" not found`);
    return ok(res, mem);
  }
});

// ---------------------------------------------------------------------------
// POST /api/a11oy/cognitive/workers/register
// ---------------------------------------------------------------------------
router.post(['/a11oy/cognitive/workers/register', '/a11oy/workers/register'], (req: Request, res: Response) => {
  const body = validate(RegisterWorkerSchema, req.body, res);
  if (!body) return;

  const tenantId = resolveTenant(req);
  try {
    const worker = registerWorker({ tenantId, ...body });
    void dbInsertWorker({
      workerId: worker.workerId,
      tenantId: worker.tenantId,
      name: worker.name,
      rolloutGroup: worker.rolloutGroup,
      configChecksum: worker.configChecksum,
      capabilities: worker.capabilities,
      tags: worker.tags ?? [],
      status: worker.status,
      uptimeSeconds: worker.uptimeSeconds,
      requestsHandled: worker.requestsHandled,
      errorsCount: worker.errorsCount,
      avgLatencyMs: worker.avgLatencyMs ?? null,
      isDraining: worker.isDraining ?? false,
      drainedAt: worker.drainedAt ? new Date(worker.drainedAt) : null,
      registeredAt: worker.registeredAt ? new Date(worker.registeredAt) : undefined,
    });
    const wEvent = EventPlane.emit({
      tenantId,
      workerId: worker.workerId,
      eventType: 'worker.registered',
      payload: { rolloutGroup: worker.rolloutGroup, configChecksum: body.configChecksum.slice(0, 12) },
    });
    void dbInsertRuntimeEvent({ eventId: wEvent.eventId, tenantId: wEvent.tenantId, requestId: wEvent.requestId ?? null, proofChainId: wEvent.proofChainId ?? null, workerId: wEvent.workerId ?? null, correlationId: wEvent.correlationId ?? null, causationId: wEvent.causationId ?? null, eventType: wEvent.eventType, payload: wEvent.payload });
    ok(res, worker);
  } catch (e) {
    if (e instanceof ChecksumConflictError) return err(res, 409, 'CHECKSUM_CONFLICT', e.message);
    return err(res, 500, 'REGISTRATION_FAILED', String(e));
  }
});

// ---------------------------------------------------------------------------
// POST /api/a11oy/cognitive/workers/drain
// ---------------------------------------------------------------------------
router.post(['/a11oy/cognitive/workers/drain', '/a11oy/workers/drain'], (req: Request, res: Response) => {
  const body = validate(DrainWorkerSchema, req.body, res);
  if (!body) return;

  const tenantId = resolveTenant(req);
  const result = drainWorker(body.workerId, tenantId);
  if (!result.success) return err(res, 404, 'WORKER_NOT_FOUND', result.error ?? 'Worker not found');

  EventPlane.emit({ tenantId, workerId: body.workerId, eventType: 'worker.drained', payload: { at: new Date().toISOString() } });
  ok(res, result.worker);
});

// ---------------------------------------------------------------------------
// GET /api/a11oy/cognitive/events
// ---------------------------------------------------------------------------
router.get(['/a11oy/cognitive/events', '/a11oy/events'], async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const { eventType, requestId, routeDecisionId, proofChainId, limit, offset } = req.query as Record<string, string>;
  try {
    const result = await dbListRuntimeEvents(tenantId, {
      eventType,
      requestId,
      routeDecisionId,
      proofChainId,
      limit: limit ? Math.min(parseInt(limit, 10), 200) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    ok(res, result.records, { total: result.total });
  } catch {
    const inMem = EventPlane.list({
      tenantId,
      eventType: eventType as Parameters<typeof EventPlane.list>[0]['eventType'],
      requestId,
      limit: limit ? Math.min(parseInt(limit, 10), 200) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    ok(res, inMem.events, { total: inMem.total, source: 'in_memory' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/a11oy/cognitive/events/stats
// ---------------------------------------------------------------------------
router.get(['/a11oy/cognitive/events/stats', '/a11oy/events/stats'], async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  try {
    const stats = await dbGetRuntimeEventStats(tenantId);
    ok(res, stats);
  } catch {
    ok(res, EventPlane.stats(tenantId));
  }
});

// ---------------------------------------------------------------------------
// POST /api/a11oy/cognitive/events/replay
// ---------------------------------------------------------------------------
router.post(['/a11oy/cognitive/events/replay', '/a11oy/events/replay'], async (req: Request, res: Response) => {
  const body = validate(EventReplaySchema, req.body, res);
  if (!body) return;

  const tenantId = resolveTenant(req);
  try {
    const result = await dbListRuntimeEvents(tenantId, {
      eventType: body.eventType,
      limit: body.limit,
    });
    ok(res, result.records.map((e) => ({ ...e, isReplayed: true })), { count: result.total });
  } catch {
    const events = EventPlane.replay({
      tenantId,
      fromEventId: body.fromEventId as string | undefined,
      eventType: body.eventType as Parameters<typeof EventPlane.replay>[0]['eventType'],
      limit: body.limit,
    });
    ok(res, events, { count: events.length });
  }
});

// ---------------------------------------------------------------------------
// POST /api/a11oy/cognitive/memory/lookup
// ---------------------------------------------------------------------------
router.post(['/a11oy/cognitive/memory/lookup', '/a11oy/memory/lookup'], (req: Request, res: Response) => {
  const body = validate(MemoryLookupSchema, req.body, res);
  if (!body) return;

  const tenantId = resolveTenant(req);
  try {
    const result = memoryLookup({ tenantId, workspaceId: body.workspaceId, domain: body.domain }, body.memoryKey, body.queryTags);
    if (result.hit) {
      EventPlane.emit({ tenantId, eventType: 'memory.hit', payload: { memoryKey: body.memoryKey, contextReuseScore: result.contextReuseScore } });
    } else {
      EventPlane.emit({ tenantId, eventType: 'memory.miss', payload: { memoryKey: body.memoryKey } });
    }
    ok(res, result);
  } catch (e) {
    if (String(e).includes('TENANT_ISOLATION_BREACH')) return err(res, 403, 'TENANT_ISOLATION_BREACH', 'Memory isolation violation detected');
    return err(res, 500, 'MEMORY_ERROR', String(e));
  }
});

// ---------------------------------------------------------------------------
// POST /api/a11oy/cognitive/memory/write
// ---------------------------------------------------------------------------
router.post(['/a11oy/cognitive/memory/write', '/a11oy/memory/write'], (req: Request, res: Response) => {
  const body = validate(MemoryWriteSchema, req.body, res);
  if (!body) return;

  const tenantId = resolveTenant(req);
  const key = memoryWrite(
    { tenantId, workspaceId: body.workspaceId, domain: body.domain },
    body.memoryKey,
    body.data,
    { tags: body.tags, tokenCount: body.tokenCount, ttlMs: body.ttlMs },
  );
  EventPlane.emit({ tenantId, eventType: 'memory.hit', payload: { memoryKey: body.memoryKey, op: 'write' } });
  ok(res, { memoryKey: key, written: true });
});

// ---------------------------------------------------------------------------
// POST /api/a11oy/cognitive/memory/invalidate
// ---------------------------------------------------------------------------
router.post(['/a11oy/cognitive/memory/invalidate', '/a11oy/memory/invalidate'], (req: Request, res: Response) => {
  const body = validate(MemoryInvalidateSchema, req.body, res);
  if (!body) return;

  const tenantId = resolveTenant(req);
  try {
    const removed = memoryInvalidate({ tenantId, domain: body.domain, workspaceId: body.workspaceId }, body.memoryKey);
    if (removed) EventPlane.emit({ tenantId, eventType: 'memory.invalidated', payload: { memoryKey: body.memoryKey } });
    ok(res, { memoryKey: body.memoryKey, invalidated: removed });
  } catch (e) {
    if (String(e).includes('TENANT_ISOLATION_BREACH')) return err(res, 403, 'TENANT_ISOLATION_BREACH', 'Memory isolation violation detected');
    return err(res, 500, 'MEMORY_ERROR', String(e));
  }
});

// ---------------------------------------------------------------------------
// GET /api/a11oy/cognitive/memory/stats
// ---------------------------------------------------------------------------
router.get(['/a11oy/cognitive/memory/stats', '/a11oy/memory/stats'], (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  ok(res, memoryStats(tenantId));
});

// ---------------------------------------------------------------------------
// POST /api/a11oy/cognitive/guard/check
// ---------------------------------------------------------------------------
router.post(['/a11oy/cognitive/guard/check', '/a11oy/guard/check'], (req: Request, res: Response) => {
  const body = validate(GuardCheckSchema, req.body, res);
  if (!body) return;

  const tenantId = resolveTenant(req);
  const result = checkOutputConstraints(
    body.outputConstraints as Parameters<typeof checkOutputConstraints>[0],
    { tenantId, requestId: body.requestId, domain: body.domain },
  );
  ok(res, result);
});

// ---------------------------------------------------------------------------
// GET /api/a11oy/cognitive/proof-chains
// ---------------------------------------------------------------------------
router.get(['/a11oy/cognitive/proof-chains', '/a11oy/proof-chains'], async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const { requestId, limit, offset } = req.query as Record<string, string>;
  try {
    const { records, total } = await dbListProofChains(tenantId, {
      requestId,
      limit: limit ? Math.min(parseInt(limit, 10), 100) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    ok(res, records, { total });
  } catch {
    const { records, total } = listProofChains(tenantId, {
      requestId,
      limit: limit ? Math.min(parseInt(limit, 10), 100) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    ok(res, records, { total, source: 'in_memory' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/a11oy/cognitive/proof-chains/:proofChainId
// Aliases: /api/a11oy/proofchains/:proofChainId (no hyphen, no "cognitive" prefix)
// ---------------------------------------------------------------------------
router.get(
  ['/a11oy/cognitive/proof-chains/:proofChainId', '/a11oy/proof-chains/:proofChainId', '/a11oy/proofchains/:proofChainId'],
  async (req: Request, res: Response) => {
    const tenantId = resolveTenant(req);
    const proofChainId = req.params.proofChainId!;
    try {
      const record = await dbGetProofChain(proofChainId, tenantId);
      if (!record) {
        const mem = getProofChain(proofChainId, tenantId);
        if (!mem) return err(res, 404, 'PROOF_CHAIN_NOT_FOUND', `Proof chain "${proofChainId}" not found`);
        return ok(res, mem);
      }
      return ok(res, record);
    } catch {
      const mem = getProofChain(proofChainId, tenantId);
      if (!mem) return err(res, 404, 'PROOF_CHAIN_NOT_FOUND', `Proof chain "${proofChainId}" not found`);
      return ok(res, mem);
    }
  },
);

// ---------------------------------------------------------------------------
// POST /api/a11oy/cognitive/proof-chains
// ---------------------------------------------------------------------------
router.post(['/a11oy/cognitive/proof-chains', '/a11oy/proof-chains'], async (req: Request, res: Response) => {
  const body = validate(ProofChainCreateSchema, req.body, res);
  if (!body) return;

  const tenantId = resolveTenant(req);
  const proof = createProofChain({ ...body, tenantId, phases: body.phases as Parameters<typeof createProofChain>[0]['phases'] });
  const ev = EventPlane.emit({
    tenantId,
    requestId: proof.requestId,
    proofChainId: proof.proofChainId,
    eventType: 'proof.created',
    payload: { auditHash: proof.auditHash.slice(0, 12) },
  });
  void dbInsertProofChain({
    proofChainId: proof.proofChainId,
    requestId: proof.requestId,
    tenantId: proof.tenantId,
    routeDecisionId: proof.routeDecisionId ?? null,
    workerId: proof.workerId ?? null,
    model: proof.model ?? null,
    provider: proof.provider ?? null,
    approvalStatus: proof.approvalStatus ?? 'not_required',
    confidenceScore: proof.confidenceScore ?? null,
    riskScore: proof.riskScore ?? null,
    latencyMs: proof.latencyMs ?? null,
    sourceCount: proof.sourceCount,
    memoryHitCount: proof.memoryHitCount,
    phaseCount: proof.phaseCount,
    completedPhases: proof.completedPhases,
    auditHash: proof.auditHash,
    lineage: proof.lineage,
    executionSucceeded: proof.executionSucceeded,
    failureReason: proof.failureReason ?? null,
    sealedAt: proof.sealedAt ? new Date(proof.sealedAt) : null,
  });
  void dbInsertRuntimeEvent({
    eventId: ev.eventId,
    tenantId: ev.tenantId,
    requestId: ev.requestId ?? null,
    proofChainId: ev.proofChainId ?? null,
    eventType: ev.eventType,
    payload: ev.payload,
  });
  ok(res, proof);
});

// ---------------------------------------------------------------------------
// GET /api/a11oy/cognitive/deployments
// ---------------------------------------------------------------------------
router.get(['/a11oy/cognitive/deployments', '/a11oy/deployments'], async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const { status, limit, offset } = req.query as Record<string, string>;
  try {
    const { records, total } = await dbListDeployments(tenantId, {
      status,
      limit: limit ? Math.min(parseInt(limit, 10), 100) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    ok(res, records, { total });
  } catch {
    const events = EventPlane.list({ tenantId, eventType: 'deployment.created', limit: 50 });
    ok(
      res,
      events.events.map((e) => ({ ...e.payload, eventId: e.eventId, occurredAt: e.occurredAt })),
      { total: events.total, source: 'in_memory' },
    );
  }
});

// ---------------------------------------------------------------------------
// POST /api/a11oy/cognitive/deployments
// ---------------------------------------------------------------------------
router.post(['/a11oy/cognitive/deployments', '/a11oy/deployments'], async (req: Request, res: Response) => {
  const body = validate(DeploymentCreateSchema, req.body, res);
  if (!body) return;

  const tenantId = resolveTenant(req);
  const deploymentId = newId('dep');
  const now = new Date();

  void dbInsertDeployment({
    deploymentId,
    tenantId,
    name: body.name,
    deploymentType: body.deploymentType as import('@szl-holdings/db').InsertA11oyCognitiveDeployment['deploymentType'],
    targetRolloutGroup: body.targetRolloutGroup,
    newConfigChecksum: body.newConfigChecksum,
    previousConfigChecksum: body.previousConfigChecksum ?? null,
    status: 'pending',
    approvalRequired: true,
    metadata: body.metadata ?? null,
  });

  const ev = EventPlane.emit({
    tenantId,
    eventType: 'deployment.created',
    payload: {
      deploymentId,
      name: body.name,
      deploymentType: body.deploymentType,
      targetRolloutGroup: body.targetRolloutGroup,
      newConfigChecksum: body.newConfigChecksum.slice(0, 16),
      previousConfigChecksum: body.previousConfigChecksum?.slice(0, 16),
      status: 'pending',
      approvalRequired: true,
      metadata: body.metadata,
    },
  });
  void dbInsertRuntimeEvent({ eventId: ev.eventId, tenantId: ev.tenantId, requestId: ev.requestId ?? null, proofChainId: ev.proofChainId ?? null, routeDecisionId: ev.routeDecisionId ?? null, workerId: ev.workerId ?? null, correlationId: ev.correlationId ?? null, causationId: ev.causationId ?? null, eventType: ev.eventType, payload: ev.payload });

  ok(res, {
    deploymentId,
    name: body.name,
    deploymentType: body.deploymentType,
    targetRolloutGroup: body.targetRolloutGroup,
    status: 'pending',
    createdAt: now.toISOString(),
  });
});

export default router;
