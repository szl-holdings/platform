/**
 * ROSIE Reasoning Surface — Graph Planner / CTM-Loop / Time-R1 / MARBLE.
 *
 * Mounted at /api/rosie/* alongside the existing rosie router. Every
 * capability emits its own Λ-receipt (Doctrine V6) on a SHA-256-linked
 * append-only chain — `RECEIPT_LAMBDA_STORE` — and high-stakes flows
 * (drone-oversight) also write a PendingApprovalRequest into the
 * shared approvals-inbox so operators see them in the same surface as
 * every other governed approval.
 */

import { createHash, randomUUID } from 'node:crypto';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendError, sendSuccess } from '../lib/api-response';
import { authMiddleware } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';
import { guardianPolicyCheck } from '../middlewares/guardian-policy';
import {
  type ActionNode,
  type PlanDag,
  PlanCycleError,
  planDag,
  UnreachablePreconditionError,
} from '@workspace/planner';
import {
  type CtmLoopResult,
  defaultProcessors,
  runCtmLoop,
} from '@szl-holdings/ai-engine';
import {
  NonMonotonicSeriesError,
  type TemporalForecast,
  scoreBuckets,
} from '@workspace/forecast-fabric';
import {
  builtInScenarios,
  type MarbleResult,
  runMarbleProfile,
} from '@workspace/agents-evals';
import { submitPendingApprovalRequest } from '@workspace/approvals-inbox';
import { EvidenceLedger } from '@szl-holdings/evidence-ledger';
import { step as verletStep, type Particle } from '@szl-holdings/sim-kit';
import { detectPeaks, type Peak } from '@workspace/anomaly-fabric/peak-detector';
import { StagedPipeline, type StageArtefact } from '@szl-holdings/sequence-pipeline';
import {
  generate as proceduralGenerate,
  makePartLibrary,
  rootNode,
  partGraphHash,
  type Scene,
  type Part,
} from '@szl-holdings/procedural-kit';
import { fromPartGraph, serializeToUsda } from '@szl-holdings/openusd-export';

const router: IRouter = Router();

/**
 * Shared evidence-ledger instance for the reasoning surface. Appends fan out
 * to `defaultEvidenceLedgerStore` (in-memory by default; Postgres-backed in
 * production once `defaultEvidenceLedgerStore.setBackend(...)` is called at
 * api-server startup). This is the durable source of truth for Λ-receipts;
 * the in-memory hash chain below mirrors them only to preserve link semantics
 * (prevHash / receiptHash) and to support fast inspection queries.
 */
const reasoningLedger = new EvidenceLedger();

function ledgerActionForKind(kind: LambdaKind): string {
  switch (kind) {
    case 'plan.dag.v1': return 'plan-dag-sealed';
    case 'consciousness.broadcast.v1': return 'ctm-broadcast-sealed';
    case 'anomaly.time-r1.v1': return 'time-r1-drift-sealed';
    case 'bench.marble.v1': return 'marble-bench-sealed';
    case 'drone.oversight.v1': return 'drone-oversight-sealed';
  }
}

router.use(
  '/rosie',
  authMiddleware({ required: false }),
  tenantScope({ required: false }),
  guardianPolicyCheck({ category: 'decisions' }),
);

// ──────────────────────────────────────────────────────────────────────────
// Λ-receipt chain (Doctrine V6). Separate from the optimizer's solve chain
// so reasoning receipts do not interleave with numeric solve receipts.
// ──────────────────────────────────────────────────────────────────────────

type LambdaKind =
  | 'plan.dag.v1'
  | 'consciousness.broadcast.v1'
  | 'anomaly.time-r1.v1'
  | 'bench.marble.v1'
  | 'drone.oversight.v1';

interface LambdaReceipt {
  receiptId: string;
  kind: LambdaKind;
  inputHash: string;
  outputHash: string;
  prevHash: string;
  receiptHash: string;
  createdAt: string;
  governance: {
    standard: 'doctrine-v6';
    pillar: 'governed-autonomy' | 'evidence-first' | 'policy-aware' | 'operational-ontology';
    authority: string;
  };
  payload: unknown;
}

const RECEIPT_LAMBDA_STORE: LambdaReceipt[] = [];
const LAMBDA_RING_CAP = 1000;

function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function lambdaHead(): string {
  return RECEIPT_LAMBDA_STORE.length === 0
    ? 'GENESIS-LAMBDA'
    : RECEIPT_LAMBDA_STORE[RECEIPT_LAMBDA_STORE.length - 1].receiptHash;
}

function sealLambda(
  draft: Omit<LambdaReceipt, 'prevHash' | 'receiptHash' | 'createdAt'>,
): LambdaReceipt {
  const prevHash = lambdaHead();
  const createdAt = new Date().toISOString();
  const receiptHash = sha256Hex(
    [draft.kind, draft.receiptId, draft.inputHash, draft.outputHash, prevHash, createdAt].join('|'),
  );
  const full: LambdaReceipt = { ...draft, prevHash, receiptHash, createdAt };

  // Durable append via the shared evidence ledger. Fan-out to the configured
  // backend (in-memory → Postgres in prod) happens inside .append(); failures
  // are surfaced through setLedgerPersistFailureHandler, not silently dropped.
  reasoningLedger.append({
    entityType: 'rosie-reasoning',
    entityId: full.receiptId,
    action: ledgerActionForKind(full.kind),
    actor: full.governance.authority,
    actorRole: full.governance.pillar,
    envelope: {
      traceId: full.receiptId,
      sources: [],
      toolCalls: [],
      confidence: 'high',
      freshness: 'fresh',
      policyVerdict: 'allow',
      policyReason: `doctrine-v6 / ${full.governance.pillar} / ${full.governance.authority}`,
    },
  });

  // In-memory mirror used only for chain-link semantics + fast inspection.
  RECEIPT_LAMBDA_STORE.push(full);
  if (RECEIPT_LAMBDA_STORE.length > LAMBDA_RING_CAP) {
    RECEIPT_LAMBDA_STORE.shift();
  }
  return full;
}

// ──────────────────────────────────────────────────────────────────────────
// /rosie/plan — Graph Planner (DAG)
// ──────────────────────────────────────────────────────────────────────────

const ActionNodeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  preconditions: z.array(z.string()).default([]),
  effects: z.array(z.string()).min(1),
  actor: z.string().optional(),
  cost: z.number().nonnegative().optional(),
});

const PlanBodySchema = z.object({
  goal: z.array(z.string()).min(1),
  initialState: z.array(z.string()).default([]),
  actions: z.array(ActionNodeSchema).min(1).max(64),
  planId: z.string().optional(),
});

router.get('/rosie/plan/templates', (_req, res) => {
  sendSuccess(res, {
    templates: PLAN_TEMPLATES.map(({ id, title, description }) => ({ id, title, description })),
  });
});

router.post('/rosie/plan', (req: Request, res: Response) => {
  try {
    const body = PlanBodySchema.parse(req.body);
    const inputHash = sha256Hex(JSON.stringify({ g: body.goal, s: body.initialState, a: body.actions }));
    const dag = planDag({
      planId: body.planId,
      goal: body.goal,
      initialState: body.initialState,
      actions: body.actions as ActionNode[],
    });
    const outputHash = sha256Hex(JSON.stringify({ planId: dag.planId, nodes: dag.executionOrder, cp: dag.criticalPath }));
    const receipt = sealLambda({
      receiptId: `lr_${randomUUID()}`,
      kind: 'plan.dag.v1',
      inputHash,
      outputHash,
      governance: { standard: 'doctrine-v6', pillar: 'governed-autonomy', authority: 'graph-planner' },
      payload: { planId: dag.planId, criticalPath: dag.criticalPath, parallelBranches: dag.parallelBranches },
    });
    sendSuccess(res, { dag, receipt });
  } catch (err) {
    if (err instanceof UnreachablePreconditionError || err instanceof PlanCycleError) {
      sendError(res, err.message, 422, 'PLAN_REJECTED', {
        missing: (err as UnreachablePreconditionError).missing,
        cycle: (err as PlanCycleError).cycle,
      });
      return;
    }
    handleRouteError(res, err, 'plan_dag_failed');
  }
});

// ──────────────────────────────────────────────────────────────────────────
// /rosie/ctm — CTM-Loop arbitration (one-shot JSON + SSE stream)
// ──────────────────────────────────────────────────────────────────────────

const CtmBodySchema = z.object({
  input: z.string().min(1).max(2000),
  ticks: z.number().int().min(1).max(12).default(4),
  seed: z.number().int().optional(),
});

function runDefaultCtm(input: string, ticks: number, seed?: number): CtmLoopResult {
  return runCtmLoop({ input, ticks, seed, processors: defaultProcessors() });
}

router.post('/rosie/ctm', (req: Request, res: Response) => {
  try {
    const body = CtmBodySchema.parse(req.body);
    const result = runDefaultCtm(body.input, body.ticks, body.seed);
    const receipt = sealLambda({
      receiptId: `lr_${randomUUID()}`,
      kind: 'consciousness.broadcast.v1',
      inputHash: sha256Hex(JSON.stringify({ input: body.input, ticks: body.ticks, seed: body.seed ?? null })),
      outputHash: sha256Hex(JSON.stringify({ loopId: result.loopId, finalSynthesis: result.finalSynthesis })),
      governance: { standard: 'doctrine-v6', pillar: 'governed-autonomy', authority: 'ctm-loop' },
      payload: {
        loopId: result.loopId,
        ticks: result.ticks.length,
        totalSuppressed: result.totalSuppressed,
        finalSynthesis: result.finalSynthesis,
      },
    });
    sendSuccess(res, { result, receipt });
  } catch (err) {
    handleRouteError(res, err, 'ctm_failed');
  }
});

router.get('/rosie/ctm/stream', (req: Request, res: Response) => {
  const input = String(req.query.input ?? 'monitor drone trajectory for policy breaches');
  const ticks = Math.min(12, Math.max(1, Number(req.query.ticks ?? 4)));
  const seed = req.query.seed != null ? Number(req.query.seed) : undefined;
  res.set({
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
  });
  res.flushHeaders?.();
  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
  try {
    const result = runDefaultCtm(input, ticks, seed);
    send('hello', { loopId: result.loopId, totalTicks: result.ticks.length });
    let i = 0;
    const handle = setInterval(() => {
      if (i >= result.ticks.length) {
        send('done', { finalSynthesis: result.finalSynthesis, totalSuppressed: result.totalSuppressed });
        clearInterval(handle);
        res.end();
        return;
      }
      send('tick', result.ticks[i]);
      i++;
    }, 280);
    req.on('close', () => clearInterval(handle));
  } catch (err) {
    send('error', { message: String((err as Error).message ?? err) });
    res.end();
  }
});

// ──────────────────────────────────────────────────────────────────────────
// /rosie/temporal — Time-R1 bucket-drift scoring
// ──────────────────────────────────────────────────────────────────────────

const TemporalBodySchema = z.object({
  seriesId: z.string().optional(),
  series: z
    .array(z.object({ t: z.number(), v: z.number(), label: z.string().optional() }))
    .min(2)
    .max(5000),
  bucketWindowMs: z.number().positive().optional(),
  baselineBuckets: z.number().int().positive().max(50).optional(),
  allowNonMonotonic: z.boolean().default(false),
});

router.post('/rosie/temporal', (req: Request, res: Response) => {
  try {
    const body = TemporalBodySchema.parse(req.body);
    const forecast: TemporalForecast = scoreBuckets(body.series, {
      seriesId: body.seriesId,
      bucketWindowMs: body.bucketWindowMs,
      baselineBuckets: body.baselineBuckets,
      allowNonMonotonic: body.allowNonMonotonic,
    });
    const receipt = sealLambda({
      receiptId: `lr_${randomUUID()}`,
      kind: 'anomaly.time-r1.v1',
      inputHash: sha256Hex(JSON.stringify({ n: body.series.length, w: body.bucketWindowMs ?? 'auto' })),
      outputHash: sha256Hex(JSON.stringify({ id: forecast.seriesId, peak: forecast.peakBucket?.bucketIndex ?? -1 })),
      governance: { standard: 'doctrine-v6', pillar: 'evidence-first', authority: 'time-r1' },
      payload: {
        seriesRef: forecast.seriesId,
        bucketWindow: forecast.bucketWindowMs,
        peakDrift: forecast.peakBucket?.driftScore ?? 0,
        baseline: forecast.baseline,
        causalPriorViolations: forecast.causalPriorViolations,
      },
    });
    sendSuccess(res, { forecast, receipt });
  } catch (err) {
    if (err instanceof NonMonotonicSeriesError) {
      sendError(res, err.message, 422, 'CAUSAL_PRIOR_VIOLATION', { violations: err.violations });
      return;
    }
    handleRouteError(res, err, 'temporal_failed');
  }
});

// ──────────────────────────────────────────────────────────────────────────
// /rosie/marble — MARBLE multi-agent bench
// ──────────────────────────────────────────────────────────────────────────

router.get('/rosie/marble/scenarios', (_req, res) => {
  sendSuccess(res, {
    scenarios: builtInScenarios().map((s) => ({
      scenarioId: s.scenarioId,
      teamGoal: s.teamGoal,
      ticks: s.ticks,
      agentCount: s.agents.length,
      hasAdversarial: s.agents.some((a) => a.adversarial),
      expectedPolicyDenials: s.expectedPolicyDenials,
    })),
  });
});

const MarbleBodySchema = z.object({
  scenarioId: z.string().min(1),
  seed: z.number().int().optional(),
});

router.post('/rosie/marble/run', (req: Request, res: Response) => {
  try {
    const body = MarbleBodySchema.parse(req.body);
    const scenario = builtInScenarios().find((s) => s.scenarioId === body.scenarioId);
    if (!scenario) {
      sendError(res, `unknown scenario: ${body.scenarioId}`, 404, 'NOT_FOUND');
      return;
    }
    const result: MarbleResult = runMarbleProfile(scenario, { seed: body.seed });
    const receipt = sealLambda({
      receiptId: `lr_${randomUUID()}`,
      kind: 'bench.marble.v1',
      inputHash: sha256Hex(JSON.stringify({ s: body.scenarioId, seed: body.seed ?? null })),
      outputHash: sha256Hex(JSON.stringify({ score: result.score, cost: result.coordinationCost })),
      governance: { standard: 'doctrine-v6', pillar: 'governed-autonomy', authority: 'marble-bench' },
      payload: {
        scenarioId: result.scenarioId,
        score: result.score,
        coordinationCost: result.coordinationCost,
        policyDenialsObserved: result.policyDenialsObserved,
        expectedDenialsMissed: result.expectedDenialsMissed,
        teamGoalReached: result.teamGoalReached,
        adversarialGoalsAchieved: result.adversarialGoalsAchieved,
      },
    });
    sendSuccess(res, { result, receipt });
  } catch (err) {
    handleRouteError(res, err, 'marble_failed');
  }
});

// ──────────────────────────────────────────────────────────────────────────
// /rosie/demos/drone-oversight — composed flow (Graph + CTM + Time-R1)
//
// This endpoint is intentionally anonymous (it powers the public demo page),
// but it writes into the shared approvals-inbox on a requires-hitl verdict.
// To prevent unauthenticated callers from flooding the operator surface, we
//   1. namespace every demo write to a dedicated `rosie-demo` domain so
//      production operator queries can filter or hide demo entries, and
//   2. enforce a small fixed-window rate limit (DEMO_RL_PER_MINUTE per
//      client IP) on the endpoint itself, returning 429 once the bucket
//      is exhausted.
// ──────────────────────────────────────────────────────────────────────────

const DEMO_RL_PER_MINUTE = 6;
const DEMO_RL_WINDOW_MS = 60_000;
const DEMO_RL_MAX_BUCKETS = 4096;
const DEMO_RL_TRUST_XFF = process.env.DEMO_RL_TRUST_XFF === '1';
const _demoRateBuckets = new Map<string, { windowStart: number; count: number }>();

/**
 * Resolve the rate-limit key.
 *
 * Default: trust only the socket peer (req.ip with Express trust-proxy, falling
 * back to socket.remoteAddress). Arbitrary X-Forwarded-For values are NOT
 * trusted because the api-server may be reached directly inside the Replit
 * network — an anonymous caller could otherwise spoof a fresh XFF on every
 * request and bypass the bucket entirely.
 *
 * Opt-in: when the deployment is behind a trusted reverse proxy that strips
 * client-supplied XFF and appends the real client IP, set DEMO_RL_TRUST_XFF=1
 * to use the left-most XFF entry instead.
 */
function demoRateLimitKey(req: Request): string {
  if (DEMO_RL_TRUST_XFF) {
    const xff = req.headers['x-forwarded-for'];
    const first = Array.isArray(xff) ? xff[0] : xff?.toString().split(',')[0];
    const trimmed = first?.trim();
    if (trimmed) return trimmed;
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function demoRateLimitOk(req: Request): boolean {
  const key = demoRateLimitKey(req);
  const now = Date.now();
  const bucket = _demoRateBuckets.get(key);
  if (!bucket || now - bucket.windowStart >= DEMO_RL_WINDOW_MS) {
    // Bounded eviction: when the table gets full, drop the oldest entries so
    // a high-cardinality attacker (rotating IPs) cannot grow the map without
    // bound. Insertion order in Map matches keys() iteration order.
    if (_demoRateBuckets.size >= DEMO_RL_MAX_BUCKETS) {
      const evictCount = Math.ceil(DEMO_RL_MAX_BUCKETS / 8);
      let i = 0;
      for (const k of _demoRateBuckets.keys()) {
        if (i++ >= evictCount) break;
        _demoRateBuckets.delete(k);
      }
    }
    _demoRateBuckets.set(key, { windowStart: now, count: 1 });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= DEMO_RL_PER_MINUTE;
}

interface DroneTelemetryPoint {
  t: number;
  altitude: number;
  speed: number;
  inGeofence: boolean;
}

/**
 * Deterministic 2D trajectory under real Verlet physics (sim-kit). One
 * particle representing the drone, accelerated by a small lateral wind
 * field whose intensity is seeded; same seed always yields the same
 * `(x, y)` path. Used by the drone-oversight viz so trajectories are
 * physics-driven, not faked tweens. Returns the recorded positions.
 */
function simulatePhysicsTrajectory(
  seed: number,
  telemetry: DroneTelemetryPoint[],
): Array<{ t: number; x: number; y: number; vx: number; vy: number }> {
  let s = (seed * 0x9e3779b1) >>> 0;
  const rng = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // Wind acceleration: small steady force + a gust window aligned to the
  // synthetic geofence breach so the visualisation tracks the anomaly.
  const baseGustX = (rng() - 0.5) * 0.4;
  const baseGustY = (rng() - 0.5) * 0.4;

  const dt = 1; // unit timestep per telemetry sample
  let particle: Particle = {
    id: 'drone',
    position: [0, 0],
    prevPosition: [-0.5 - rng() * 0.2, -0.1 - rng() * 0.05],
    radius: 1,
    label: 'drone',
  };
  const trace: Array<{ t: number; x: number; y: number; vx: number; vy: number }> = [];
  for (let i = 0; i < telemetry.length; i++) {
    const p = telemetry[i]!;
    const inBreachWindow = !p.inGeofence;
    const ax = baseGustX + (inBreachWindow ? 0.6 : 0) + (rng() - 0.5) * 0.04;
    const ay = baseGustY + (inBreachWindow ? 0.4 : 0) + (rng() - 0.5) * 0.04;
    const next = verletStep([particle], dt, {
      acceleration: [ax, ay],
      damping: 0.04,
    });
    const np = next[0]!;
    trace.push({
      t: p.t,
      x: np.position[0],
      y: np.position[1],
      vx: np.position[0] - np.prevPosition[0],
      vy: np.position[1] - np.prevPosition[1],
    });
    particle = np;
  }
  return trace;
}

function syntheticDroneTelemetry(seed: number): DroneTelemetryPoint[] {
  let s = seed >>> 0;
  const rng = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const start = Date.now() - 60 * 60_000;
  const pts: DroneTelemetryPoint[] = [];
  for (let i = 0; i < 90; i++) {
    const breach = i > 60 && i < 72; // a clear anomaly window
    pts.push({
      t: start + i * 60_000,
      altitude: 120 + rng() * 8 + (breach ? 40 : 0),
      speed: 14 + rng() * 2 + (breach ? 6 : 0),
      inGeofence: !breach,
    });
  }
  return pts;
}

const DroneBodySchema = z.object({
  seed: z.number().int().default(7),
  scenario: z.string().default('default-perimeter'),
});

const DRONE_ACTIONS: ActionNode[] = [
  { id: 'ingest-telemetry', title: 'Ingest drone telemetry', preconditions: ['mission:active'], effects: ['telemetry:available'], actor: 'sensor', cost: 1 },
  { id: 'score-temporal', title: 'Score temporal drift (Time-R1)', preconditions: ['telemetry:available'], effects: ['drift:scored'], actor: 'time-r1', cost: 2 },
  { id: 'arbitrate-broadcast', title: 'Arbitrate broadcast (CTM-Loop)', preconditions: ['telemetry:available'], effects: ['broadcast:winner'], actor: 'ctm-loop', cost: 2 },
  { id: 'compose-assessment', title: 'Compose assessment', preconditions: ['drift:scored', 'broadcast:winner'], effects: ['assessment:ready'], actor: 'rosie', cost: 1 },
  { id: 'gate-policy', title: 'Run policy gate', preconditions: ['assessment:ready'], effects: ['gate:cleared'], actor: 'policy', cost: 1 },
  { id: 'request-hitl', title: 'Request HITL approval', preconditions: ['gate:cleared'], effects: ['hitl:requested', 'oversight:logged'], actor: 'operator', cost: 3 },
];

router.post('/rosie/demos/drone-oversight', async (req: Request, res: Response) => {
  try {
    if (!demoRateLimitOk(req)) {
      sendError(
        res,
        `demo rate limit exceeded — ${DEMO_RL_PER_MINUTE}/min per client.`,
        429,
        'DEMO_RATE_LIMITED',
        { retryAfterMs: DEMO_RL_WINDOW_MS },
      );
      return;
    }
    const body = DroneBodySchema.parse(req.body);
    const telemetry = syntheticDroneTelemetry(body.seed);

    // Wrap the whole oversight flow in a sequence-pipeline trace so every
    // stage emits a hashed artefact for the evidence-ledger UI.
    const pipelineStages: StageArtefact<string>[] = [];
    const stagedPipeline = new StagedPipeline({
      pipelineId: `drone-oversight-${body.seed}`,
      tooling: {
        'sim-kit': '0.1.0',
        'forecast-fabric/time-r1': '1.0.0',
        'anomaly-fabric/peak-detector': '0.1.0',
        'ai-engine/ctm-loop': '0.1.0',
      },
      hash: (value) => sha256Hex(JSON.stringify(value ?? null)),
    });

    // Physics trajectory (sim-kit Verlet) — deterministic from seed.
    const trajectory = simulatePhysicsTrajectory(body.seed, telemetry);

    // 1. Plan
    const dag = planDag({
      goal: ['hitl:requested', 'oversight:logged'],
      initialState: ['mission:active'],
      actions: DRONE_ACTIONS,
    });
    const planReceipt = sealLambda({
      receiptId: `lr_${randomUUID()}`,
      kind: 'plan.dag.v1',
      inputHash: sha256Hex('drone-oversight:plan'),
      outputHash: sha256Hex(dag.planId),
      governance: { standard: 'doctrine-v6', pillar: 'governed-autonomy', authority: 'graph-planner' },
      payload: { planId: dag.planId, criticalPath: dag.criticalPath },
    });

    // 2. Time-R1 on altitude
    const altSeries = telemetry.map((p) => ({ t: p.t, v: p.altitude, label: p.inGeofence ? 'in' : 'breach' }));
    const altForecast = scoreBuckets(altSeries, { seriesId: `drone-alt-${body.seed}`, baselineBuckets: 5 });

    // 2b. Peak-detector cross-confirmation on the altitude surface — a
    // second-opinion on Time-R1's anomaly window. If the peak-detector
    // independently surfaces a peak inside Time-R1's peak bucket, that
    // counts as a cross-confirmation and is surfaced in the response.
    const altSurface = telemetry.map((p, i) => ({ x: i, intensity: p.altitude }));
    const detectedPeaks: Peak[] = detectPeaks(altSurface, {
      minProminence: 8,
      minSnRatio: 2,
      halfWindow: 4,
    });
    const peakBucket = altForecast.peakBucket;
    const crossConfirmedPeaks = detectedPeaks.filter((peak) => {
      if (!peakBucket) return false;
      const tAtPeak = telemetry[peak.index]?.t ?? -1;
      return tAtPeak >= peakBucket.startT && tAtPeak <= peakBucket.endT;
    });
    const tempReceipt = sealLambda({
      receiptId: `lr_${randomUUID()}`,
      kind: 'anomaly.time-r1.v1',
      inputHash: sha256Hex(`drone-oversight:temporal:${body.seed}`),
      outputHash: sha256Hex(`${altForecast.seriesId}:${altForecast.peakBucket?.bucketIndex ?? -1}`),
      governance: { standard: 'doctrine-v6', pillar: 'evidence-first', authority: 'time-r1' },
      payload: {
        seriesRef: altForecast.seriesId,
        peakDrift: altForecast.peakBucket?.driftScore ?? 0,
        breachWindow: telemetry.filter((p) => !p.inGeofence).length,
      },
    });

    // 3. CTM-Loop on a synthesised situation string
    const situation = altForecast.peakBucket && Math.abs(altForecast.peakBucket.driftScore) > 1.5
      ? 'drone altitude spike outside geofence — possible policy breach'
      : 'drone trajectory nominal — monitor only';
    const ctm = runCtmLoop({ input: situation, ticks: 4, seed: body.seed, processors: defaultProcessors() });

    // Record the staged pipeline trace — one StageArtefact per stage,
    // each carrying inputsHash / paramsHash / outputsHash for the
    // evidence-ledger UI. We use the StagedPipeline runner so the
    // hashing strategy is uniform with every other sequence-pipeline
    // caller in the platform.
    try {
      const pipelineResult = await stagedPipeline.run<
        'ingest-telemetry' | 'simulate-physics' | 'time-r1' | 'peak-detector' | 'ctm-arbitration',
        { seed: number; scenario: string },
        unknown
      >(
        { seed: body.seed, scenario: body.scenario },
        [
          {
            name: 'ingest-telemetry',
            params: { samples: telemetry.length },
            run: () => ({ telemetry }),
          },
          {
            name: 'simulate-physics',
            params: { kernel: 'verlet', damping: 0.04 },
            run: () => ({ trajectory }),
          },
          {
            name: 'time-r1',
            params: { baselineBuckets: 5 },
            run: () => ({ forecast: altForecast }),
          },
          {
            name: 'peak-detector',
            params: { minProminence: 8, minSnRatio: 2, halfWindow: 4 },
            run: () => ({ peaks: detectedPeaks, crossConfirmed: crossConfirmedPeaks.length }),
          },
          {
            name: 'ctm-arbitration',
            params: { ticks: 4 },
            run: () => ({ loopId: ctm.loopId, finalSynthesis: ctm.finalSynthesis }),
          },
        ],
      );
      pipelineStages.push(...pipelineResult.stages);
    } catch (pipelineErr) {
      // The trace is observational and must never block the oversight
      // flow, but a silent swallow violates the "every decision run
      // produces a sequence-pipeline trace" invariant. Log structurally
      // and stamp a single fallback artefact so the absence is observable
      // in the evidence-ledger UI instead of looking like success.
      console.warn(
        '[drone-oversight] sequence-pipeline trace failed; surfacing fallback stage',
        { err: pipelineErr instanceof Error ? pipelineErr.message : String(pipelineErr), seed: body.seed },
      );
      pipelineStages.push({
        stageName: 'pipeline-trace-unavailable',
        stageOrdinal: 0,
        parentPipelineId: `drone-oversight-${body.seed}`,
        inputsHash: sha256Hex(`drone-oversight:${body.seed}`),
        paramsHash: sha256Hex('fallback'),
        outputsHash: sha256Hex(pipelineErr instanceof Error ? pipelineErr.message : String(pipelineErr)),
        tooling: { reason: 'staged-pipeline.run threw' },
        receiptClass: 'pipeline.stage.v1',
      } as StageArtefact<string>);
    }
    const ctmReceipt = sealLambda({
      receiptId: `lr_${randomUUID()}`,
      kind: 'consciousness.broadcast.v1',
      inputHash: sha256Hex(`drone-oversight:ctm:${body.seed}`),
      outputHash: sha256Hex(ctm.loopId),
      governance: { standard: 'doctrine-v6', pillar: 'governed-autonomy', authority: 'ctm-loop' },
      payload: { loopId: ctm.loopId, finalSynthesis: ctm.finalSynthesis, totalSuppressed: ctm.totalSuppressed },
    });

    // 4. Compose final assessment + Λ-receipt + (high-stakes) approvals-inbox entry
    const breach = !!altForecast.peakBucket && Math.abs(altForecast.peakBucket.driftScore) > 1.5;
    const verdict: 'auto-cleared' | 'requires-hitl' = breach ? 'requires-hitl' : 'auto-cleared';
    const droneReceipt = sealLambda({
      receiptId: `lr_${randomUUID()}`,
      kind: 'drone.oversight.v1',
      inputHash: sha256Hex(JSON.stringify({ seed: body.seed, scenario: body.scenario })),
      outputHash: sha256Hex(JSON.stringify({ verdict, planId: dag.planId, loopId: ctm.loopId, peak: altForecast.peakBucket?.bucketIndex ?? -1 })),
      governance: { standard: 'doctrine-v6', pillar: 'policy-aware', authority: 'rosie-drone-oversight' },
      payload: {
        verdict,
        scenario: body.scenario,
        seed: body.seed,
        planReceiptId: planReceipt.receiptId,
        temporalReceiptId: tempReceipt.receiptId,
        ctmReceiptId: ctmReceipt.receiptId,
        peakDrift: altForecast.peakBucket?.driftScore ?? 0,
        ctmFinal: ctm.finalSynthesis,
      },
    });

    // Fail-CLOSED on requires-hitl: a high-stakes verdict that cannot place
    // an approval record into the operator inbox must not be returned as a
    // success. The operator inbox is the consent surface; without an entry
    // the autonomous flow has no governed escape hatch.
    let pendingApproval: { id: string; submittedAt: number } | null = null;
    if (verdict === 'requires-hitl') {
      let pending: { id: string; submittedAt: number } | undefined;
      try {
        pending = submitPendingApprovalRequest({
          runId: dag.planId,
          stepId: 'request-hitl',
          stepName: 'ROSIE drone oversight — HITL approval',
          action: 'authorise continued drone monitoring after policy-breach drift signal',
          justification: `Time-R1 peak drift ${altForecast.peakBucket?.driftScore.toFixed(2)} σ at bucket ${altForecast.peakBucket?.bucketIndex}. CTM winner: ${ctm.ticks.at(-1)?.winner.processorId}.`,
          projectedImpact: 'continued autonomous operation in contested airspace',
          projectedRisk: 'high — geofence breach detected, policy gate flagged',
          requestedBy: 'rosie-drone-oversight',
          // Demo-scoped namespacing: production operator queries should
          // filter `domain='rosie-demo'` out of the live inbox view. This
          // is the second layer of protection alongside the per-IP rate
          // limit above so that anonymous demo traffic cannot pollute the
          // real approvals queue.
          domain: 'rosie-demo',
          surface: 'reasoning-demo',
        });
      } catch (submitErr) {
        sendError(
          res,
          `HITL approval inbox unavailable: ${(submitErr as Error).message ?? String(submitErr)}`,
          503,
          'HITL_INBOX_UNAVAILABLE',
          { receiptId: droneReceipt.receiptId },
        );
        return;
      }
      if (!pending || !pending.id) {
        sendError(
          res,
          'HITL approval inbox returned no pending record; refusing to proceed.',
          503,
          'HITL_INBOX_EMPTY_RESPONSE',
          { receiptId: droneReceipt.receiptId },
        );
        return;
      }
      pendingApproval = { id: pending.id, submittedAt: pending.submittedAt };
    }

    sendSuccess(res, {
      verdict,
      telemetry,
      trajectory,
      plan: dag,
      temporal: altForecast,
      ctm,
      peaks: {
        detected: detectedPeaks,
        crossConfirmedCount: crossConfirmedPeaks.length,
        timeR1PeakBucket: peakBucket?.bucketIndex ?? -1,
      },
      pipeline: {
        pipelineId: `drone-oversight-${body.seed}`,
        stages: pipelineStages,
      },
      receipts: {
        plan: planReceipt,
        temporal: tempReceipt,
        ctm: ctmReceipt,
        oversight: droneReceipt,
      },
      pendingApproval,
    });
  } catch (err) {
    handleRouteError(res, err, 'drone_oversight_failed');
  }
});

// ──────────────────────────────────────────────────────────────────────────
// /rosie/planner/usd-export — procedural-kit → openusd-export round-trip
//
// Turns a planner DAG (or a seeded synthetic scene) into a procedural-kit
// `Scene`, exports it through openusd-export, and returns both the USD
// stage descriptor and the serialised `.usda`. The deterministic seed
// guarantees the same scene every time, and the part-graph hash is
// included so callers can prove round-trip identity.
// ──────────────────────────────────────────────────────────────────────────

const PlannerNodeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
});

const UsdExportBodySchema = z.object({
  seed: z.number().int().default(1),
  /** Optional planner DAG nodes — when supplied, used as parts; otherwise a
   *  small synthetic library is generated. */
  nodes: z.array(PlannerNodeSchema).max(64).optional(),
});

function plannerScene(seed: number, nodes?: { id: string; title?: string }[]): { scene: Scene; library: ReturnType<typeof makePartLibrary> } {
  const partList: Part[] = (nodes && nodes.length > 0
    ? nodes
    : [
        { id: 'plan-root' },
        { id: 'ingest' },
        { id: 'score' },
        { id: 'arbitrate' },
        { id: 'gate' },
      ]
  ).map((n, i) => ({
    partId: n.id,
    meshRef: `mesh://planner/${n.id}.usd`,
    tags: i === 0 ? ['planner-root'] : ['planner-step'],
    attachmentFrame: { translation: [0, 0, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1] },
    slots:
      i === 0
        ? [{ slotId: 'children', allowedPartTags: ['planner-step'], localTransform: { translation: [0, 1, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1] } }]
        : [],
  }));
  const library = makePartLibrary(`planner-lib-${seed}`, partList);
  const scene = proceduralGenerate(seed, library, {
    rootTag: 'planner-root',
    maxDepth: 2,
    fillProbability: 1.0,
  });
  return { scene, library };
}

router.post('/rosie/planner/usd-export', (req: Request, res: Response) => {
  try {
    const body = UsdExportBodySchema.parse(req.body);
    const { scene, library } = plannerScene(body.seed, body.nodes);
    const graphHash = partGraphHash(scene, (v) => sha256Hex(JSON.stringify(v)));
    const usdStage = fromPartGraph(
      { libraryRef: scene.libraryRef, root: scene.root as never },
      (partId) => library.parts.get(partId)?.meshRef,
    );
    // Build the serializer-shape stage (one root Xform with children).
    const usda = serializeToUsda({
      defaultPrim: 'world',
      upAxis: 'Y',
      metersPerUnit: 1,
      prims: [
        {
          path: '/world',
          typeName: 'Xform',
          attributes: [
            { name: 'libraryRef', type: 'string', value: scene.libraryRef, custom: true },
            { name: 'partGraphHash', type: 'string', value: graphHash, custom: true },
          ],
          children: usdStage.prims
            .filter((p) => p.primPath !== '/world')
            .map((p) => ({
              path: p.primPath,
              typeName: p.typeName,
              attributes: [
                ...(p.meshRef ? [{ name: 'meshRef', type: 'asset' as const, value: p.meshRef }] : []),
                { name: 'translation', type: 'float3' as const, value: [...p.transform.translation] },
                { name: 'rotation', type: 'quatf' as const, value: [...p.transform.rotation] },
                { name: 'scale', type: 'float3' as const, value: [...p.transform.scale] },
              ],
            })),
        },
      ],
    });
    sendSuccess(res, {
      libraryRef: scene.libraryRef,
      partGraphHash: graphHash,
      stage: usdStage,
      usda,
    });
  } catch (err) {
    handleRouteError(res, err, 'usd_export_failed');
  }
});

// ──────────────────────────────────────────────────────────────────────────
// /rosie/reasoning/receipts — Λ-receipt chain inspection
// ──────────────────────────────────────────────────────────────────────────

router.get('/rosie/reasoning/receipts', (req, res) => {
  const kind = req.query.kind ? String(req.query.kind) : null;
  const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50)));
  const items = (kind ? RECEIPT_LAMBDA_STORE.filter((r) => r.kind === kind) : RECEIPT_LAMBDA_STORE)
    .slice(-limit)
    .reverse();
  sendSuccess(res, {
    receipts: items,
    chainHead: lambdaHead(),
    total: RECEIPT_LAMBDA_STORE.length,
  });
});

router.get('/rosie/reasoning/receipts/:id', (req, res) => {
  const r = RECEIPT_LAMBDA_STORE.find((x) => x.receiptId === req.params.id);
  if (!r) {
    sendError(res, 'receipt not found', 404, 'NOT_FOUND');
    return;
  }
  sendSuccess(res, r);
});

// ──────────────────────────────────────────────────────────────────────────
// Built-in plan templates (the planner UI uses these to seed forms)
// ──────────────────────────────────────────────────────────────────────────

const PLAN_TEMPLATES = [
  {
    id: 'drone-oversight',
    title: 'Drone oversight monitor',
    description: 'Ingest telemetry → Time-R1 → CTM → policy gate → HITL.',
    body: {
      goal: ['hitl:requested', 'oversight:logged'],
      initialState: ['mission:active'],
      actions: DRONE_ACTIONS,
    },
  },
  {
    id: 'evidence-disclosure',
    title: 'Evidence disclosure package',
    description: 'Gather receipts → verify chain → seal package → notify counsel.',
    body: {
      goal: ['disclosure:sealed', 'counsel:notified'],
      initialState: ['case:open'],
      actions: [
        { id: 'gather', title: 'Gather receipts', preconditions: ['case:open'], effects: ['receipts:gathered'], cost: 1 },
        { id: 'verify', title: 'Verify chain', preconditions: ['receipts:gathered'], effects: ['chain:verified'], cost: 2 },
        { id: 'seal', title: 'Seal disclosure package', preconditions: ['chain:verified'], effects: ['disclosure:sealed'], cost: 1 },
        { id: 'notify', title: 'Notify counsel', preconditions: ['disclosure:sealed'], effects: ['counsel:notified'], cost: 1 },
      ],
    },
  },
];

router.get('/rosie/plan/templates/:id', (req, res) => {
  const tpl = PLAN_TEMPLATES.find((t) => t.id === req.params.id);
  if (!tpl) {
    sendError(res, 'template not found', 404, 'NOT_FOUND');
    return;
  }
  sendSuccess(res, tpl);
});

export default router;
