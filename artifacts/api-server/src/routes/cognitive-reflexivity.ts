/**
 * Cognitive Reflexivity API
 * ----------------------------------------------------------------------------
 * HTTP surface for the @workspace/cognitive-reflexivity engine. Provides:
 *
 *  - GET  /cognitive-reflexivity/strategies      — list strategies (filterable)
 *  - GET  /cognitive-reflexivity/strategies/:id  — strategy detail + provenance
 *  - POST /cognitive-reflexivity/strategies/:id/approve  — operator approval
 *  - POST /cognitive-reflexivity/strategies/:id/reject   — operator rejection
 *  - GET  /cognitive-reflexivity/traces          — recent decision traces
 *  - GET  /cognitive-reflexivity/health          — health score + components
 *  - POST /cognitive-reflexivity/observations    — emit a cognitive signal
 *  - GET  /cognitive-reflexivity/recent-signals  — last N signals
 *
 * SECURITY POSTURE
 *   - /health is public (top-bar widget; no PII, only aggregated scalars).
 *   - All other endpoints require an authenticated session AND one of the
 *     reflexivity operator roles. Strategy provenance carries operator
 *     identity (proposedBy/approvedBy) and originating signal IDs — both
 *     are sensitive (operator email + correlation surface) and MUST NOT
 *     be exposed unauthenticated.
 *
 * RESPONSE CONTRACT
 *   The engine's internal model uses descriptive field names
 *   (`computedAt`, `decisionId`, `reinforcedCount`). The dashboard
 *   contract uses dashboard-friendly aliases (`asOf`, `traceId`,
 *   `usageCount`). We translate at the API boundary so the engine model
 *   stays stable and the dashboard stays declarative. See
 *   `shapeHealthForDashboard`, `shapeStrategyForDashboard`,
 *   `shapeTraceForDashboard` below.
 *
 * The engine is bootstrapped once in `index.ts` via getReflexivityRuntime().
 */

import { Router, type IRouter, type Request, type Response } from 'express';
import { z } from 'zod';
import { getReflexivityRuntime } from '../lib/cognitive-reflexivity-runtime';
import { authMiddleware, requireRole } from '../middlewares/auth';
import type {
  CognitiveHealthScore,
  ReflexiveStrategy,
  StrategyDecisionTrace,
  CognitiveTelemetrySample,
} from '@workspace/cognitive-reflexivity';
import { bridgeTelemetryToReflexivity } from '@workspace/cognitive-reflexivity';

const router: IRouter = Router();

/**
 * Operator gate for reflexivity write endpoints.
 * Roles allowed to approve/reject reflexive strategies or emit cognitive
 * observations into the engine. We deliberately do NOT trust any
 * `operator` field in the request body — operator identity is derived
 * from the authenticated session.
 */
const REFLEXIVITY_OPERATOR_ROLES = [
  'super_admin',
  'admin',
  'ops',
  'analyst',
] as const;

/**
 * Read gate. Strategy/trace/signal payloads expose operator identity and
 * causal chains, so the read endpoints require the same role set as the
 * writes. Read-only public consumption is satisfied by /health.
 */
const REFLEXIVITY_READ_ROLES = REFLEXIVITY_OPERATOR_ROLES;

/**
 * Build a stable operator identifier from the authenticated principal.
 * Falls back to `internal_agent:<name>` for service-to-service calls and
 * `operator:unknown` only as a last resort (which can't happen once
 * authMiddleware is enforced — kept defensively).
 */
function operatorIdFromRequest(req: Request): string {
  if (req.user?.id) {
    const email = req.user.email ?? `user-${req.user.id}`;
    return `user:${req.user.id}:${email}`;
  }
  if (req.internalAgent?.name) return `internal_agent:${req.internalAgent.name}`;
  return 'operator:unknown';
}

// ---------------------------------------------------------------------------
// Dashboard contract shapers
// ---------------------------------------------------------------------------

/**
 * Map the engine's `tier` enum to the dashboard's softer vocabulary. The
 * engine uses clinical terms (critical / at_risk) that read poorly to
 * operators; the dashboard uses recovery-oriented language.
 */
function mapHealthTier(
  tier: CognitiveHealthScore['tier'],
): 'fragile' | 'recovering' | 'healthy' | 'flourishing' {
  switch (tier) {
    case 'critical':
      return 'fragile';
    case 'at_risk':
      return 'recovering';
    case 'healthy':
      return 'healthy';
    case 'flourishing':
      return 'flourishing';
    default:
      return 'recovering';
  }
}

function shapeHealthForDashboard(score: CognitiveHealthScore) {
  return {
    score: score.score,
    tier: mapHealthTier(score.tier),
    components: {
      monologueCadence: score.components.monologueCadence,
      strategyPromotionRate: score.components.strategyPromotionRate,
      dialecticAgreement: score.components.dialecticAgreement,
      // Dashboard-friendly aliases for the two component names that
      // changed during design review.
      consolidationHealth: score.components.memoryConsolidationHealth,
      actionRatio: score.components.governanceGoodStanding,
    },
    // Composite (cognitive-quality) dimensions — only present when
    // telemetry was supplied to computeHealthScore. Surfaced raw so
    // the A11oy dashboard can render the four-dimension radar.
    ...(score.composite ? { composite: score.composite } : {}),
    asOf: score.computedAt,
    windowMinutes: score.windowMinutes,
  };
}

/**
 * Compute usage stats for a strategy from the in-memory trace ring.
 * `usageCount` is the number of traces whose appliedStrategyIds include
 * this strategy; `lastUsedAt` is the most recent of those decisions. The
 * registry tracks `reinforcedCount` for promotion logic, but the dashboard
 * needs an "applied to a real decision" count — they are NOT the same.
 */
function computeStrategyUsage(
  strategyId: string,
  traces: ReadonlyArray<StrategyDecisionTrace>,
): { usageCount: number; lastUsedAt?: string } {
  let usageCount = 0;
  let lastUsedAt: string | undefined;
  for (const t of traces) {
    if (!t.appliedStrategyIds.includes(strategyId)) continue;
    usageCount++;
    if (!lastUsedAt || t.occurredAt > lastUsedAt) lastUsedAt = t.occurredAt;
  }
  return lastUsedAt ? { usageCount, lastUsedAt } : { usageCount };
}

/**
 * Map the engine's strategy `status` to the dashboard's lifecycle
 * vocabulary. The engine has 'proposed' (awaiting approval) which the
 * dashboard renders as 'pending-approval' to make the operator action
 * obvious in the UI.
 */
function mapStrategyStatus(s: ReflexiveStrategy): string {
  if (s.status === 'proposed' && s.tier !== 'advisory') return 'pending-approval';
  return s.status;
}

function shapeStrategyForDashboard(
  s: ReflexiveStrategy,
  traces: ReadonlyArray<StrategyDecisionTrace>,
) {
  const usage = computeStrategyUsage(s.strategyId, traces);
  return {
    strategyId: s.strategyId,
    class: s.class,
    description: s.description,
    params: s.params,
    applicableContexts: s.applicableContexts,
    confidence: s.confidence,
    tier: s.tier,
    status: mapStrategyStatus(s),
    provenance: s.provenance,
    createdAt: s.createdAt,
    approvedAt: s.approvedAt,
    approvedBy: s.approvedBy,
    retiredAt: s.retiredAt,
    rejectionReason: s.rejectionReason,
    successRate: s.successRate,
    // Dashboard-required fields.
    usageCount: usage.usageCount,
    ...(usage.lastUsedAt !== undefined ? { lastUsedAt: usage.lastUsedAt } : {}),
    // Internal field still present for parity with engine model.
    reinforcedCount: s.reinforcedCount,
  };
}

/**
 * Map a decision trace to the dashboard contract. The dashboard wants
 * `traceId`/`decisionAt`/`routeClass`. The engine model uses
 * `decisionId`/`occurredAt` and stores route class inside `resolved.lane`
 * (or, if a strategy reassigned the lane, `resolved.effectiveLane`).
 */
function shapeTraceForDashboard(t: StrategyDecisionTrace) {
  const r = t.resolved as Record<string, unknown>;
  const routeClass =
    typeof r.effectiveLane === 'string'
      ? r.effectiveLane
      : typeof r.lane === 'string'
        ? r.lane
        : typeof r.routeClass === 'string'
          ? r.routeClass
          : undefined;
  return {
    traceId: t.decisionId,
    decisionAt: t.occurredAt,
    ...(routeClass !== undefined ? { routeClass } : {}),
    ...(t.agentId !== undefined ? { agentId: t.agentId } : {}),
    appliedStrategyIds: t.appliedStrategyIds,
    influencedDimensions: t.influencedDimensions,
    resolved: t.resolved,
  };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// IMPORTANT: keep these enums in lockstep with
// packages/cognitive-reflexivity/src/types.ts (StrategyStatusSchema /
// StrategyTierSchema). Sending an enum value not in the engine model would
// silently match nothing and look like a bug to operators.
const StrategyFilterSchema = z.object({
  status: z.enum(['proposed', 'approved', 'active', 'rejected', 'retired']).optional(),
  klass: z.string().optional(),
  tier: z.enum(['advisory', 'supervised', 'operator-approved', 'dual-approved']).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
});

router.get(
  '/cognitive-reflexivity/strategies',
  authMiddleware(),
  requireRole(...REFLEXIVITY_READ_ROLES),
  (req: Request, res: Response) => {
    const parsed = StrategyFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_query', issues: parsed.error.issues });
    }
    const runtime = getReflexivityRuntime();
    const all = runtime.registry.list({
      status: parsed.data.status,
      klass: parsed.data.klass,
      tier: parsed.data.tier,
    });
    const traces = runtime.registry.recentTraces();
    const shaped = all
      .slice(0, parsed.data.limit)
      .map((s) => shapeStrategyForDashboard(s, traces));
    res.json({ strategies: shaped, total: all.length });
  },
);

router.get(
  '/cognitive-reflexivity/strategies/:id',
  authMiddleware(),
  requireRole(...REFLEXIVITY_READ_ROLES),
  (req: Request, res: Response) => {
    const runtime = getReflexivityRuntime();
    const s = runtime.registry.get(req.params.id);
    if (!s) return res.status(404).json({ error: 'not_found' });
    const traces = runtime.registry.recentTraces();
    res.json({ strategy: shapeStrategyForDashboard(s, traces) });
  },
);

router.post(
  '/cognitive-reflexivity/strategies/:id/approve',
  authMiddleware(),
  requireRole(...REFLEXIVITY_OPERATOR_ROLES),
  (req: Request, res: Response) => {
    const runtime = getReflexivityRuntime();
    const operator = operatorIdFromRequest(req);
    try {
      const result = runtime.registry.approve(req.params.id, operator);
      if (!result.ok) {
        // Surface dual-approval / status-violation reasons to the operator.
        const status = result.reason === 'NOT_FOUND' ? 404 : 409;
        return res.status(status).json({
          error: result.reason,
          message: dualApprovalMessage(result.reason),
          strategy: result.strategy
            ? shapeStrategyForDashboard(result.strategy, runtime.registry.recentTraces())
            : null,
        });
      }
      const traces = runtime.registry.recentTraces();
      res.json({ strategy: shapeStrategyForDashboard(result.strategy, traces) });
    } catch (e) {
      res.status(404).json({ error: 'not_found_or_invalid', message: (e as Error).message });
    }
  },
);

function dualApprovalMessage(reason: string): string {
  switch (reason) {
    case 'NOT_FOUND':
      return 'Strategy not found.';
    case 'DUAL_APPROVAL_REQUIRES_DISTINCT_OPERATOR':
      return 'This strategy is dual-approval gated. The first signature was already recorded by you; a second, distinct operator must co-sign.';
    case 'STRATEGY_REJECTED':
      return 'Strategy was rejected and cannot be approved.';
    case 'STRATEGY_RETIRED':
      return 'Strategy is retired and cannot be re-approved.';
    default:
      return `Approval refused (${reason}).`;
  }
}

router.post(
  '/cognitive-reflexivity/strategies/:id/reject',
  authMiddleware(),
  requireRole(...REFLEXIVITY_OPERATOR_ROLES),
  (req: Request, res: Response) => {
    const runtime = getReflexivityRuntime();
    const operator = operatorIdFromRequest(req);
    const reason =
      (req.body && typeof req.body.reason === 'string' && req.body.reason) || 'rejected';
    try {
      const s = runtime.registry.reject(req.params.id, operator, reason);
      const traces = runtime.registry.recentTraces();
      res.json({ strategy: shapeStrategyForDashboard(s, traces) });
    } catch (e) {
      res.status(404).json({ error: 'not_found_or_invalid', message: (e as Error).message });
    }
  },
);

router.get(
  '/cognitive-reflexivity/traces',
  authMiddleware(),
  requireRole(...REFLEXIVITY_READ_ROLES),
  (req: Request, res: Response) => {
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100));
    const runtime = getReflexivityRuntime();
    const traces = runtime.registry.recentTraces().slice(0, limit).map(shapeTraceForDashboard);
    res.json({ traces });
  },
);

// /health stays public — only aggregated scalars, no PII or correlation IDs.
router.get('/cognitive-reflexivity/health', (_req: Request, res: Response) => {
  const runtime = getReflexivityRuntime();
  const score = runtime.computeHealth();
  res.json(shapeHealthForDashboard(score));
});

const ObservationSchema = z.object({
  subtype: z.string().min(1).max(80),
  observation: z.string().min(1).max(2000),
  intensity: z.number().min(0).max(1).optional().default(0.5),
  evidenceRefs: z.array(z.string()).max(50).optional().default([]),
  data: z.record(z.string(), z.unknown()).optional(),
  source: z.string().optional(),
});

router.post(
  '/cognitive-reflexivity/observations',
  authMiddleware(),
  requireRole(...REFLEXIVITY_OPERATOR_ROLES),
  (req: Request, res: Response) => {
    const parsed = ObservationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_payload', issues: parsed.error.issues });
    }
    const runtime = getReflexivityRuntime();
    try {
      runtime.engine.emit({
        subtype: parsed.data.subtype,
        observation: parsed.data.observation,
        intensity: parsed.data.intensity,
        evidenceRefs: parsed.data.evidenceRefs,
        data: parsed.data.data,
        source: parsed.data.source,
      });
    } catch (err) {
      return res.status(400).json({
        error: 'invalid_subtype',
        message: err instanceof Error ? err.message : String(err),
        hint: 'subtype must be one of the cognitive-reflexive enum values (router.*, detection.*, sync.*, cognition.*, memory.*).',
      });
    }
    res.status(202).json({ status: 'accepted' });
  },
);

router.get(
  '/cognitive-reflexivity/recent-signals',
  authMiddleware(),
  requireRole(...REFLEXIVITY_READ_ROLES),
  (_req: Request, res: Response) => {
    const runtime = getReflexivityRuntime();
    res.json({ signals: runtime.recentSignals() });
  },
);

// ---------------------------------------------------------------------------
// Telemetry-bridge: cognitive metrics → cognitive-reflexive signals
// ---------------------------------------------------------------------------

const TELEMETRY_METRICS = [
  'hallucination_rate',
  'retrieval_quality_score',
  'confidence',
  'citation_coverage',
  'approval_bottleneck_ms',
  'value_at_risk_usd',
] as const;

const TelemetrySampleSchema = z.object({
  metric: z.enum(TELEMETRY_METRICS),
  value: z.number().finite(),
  observedAt: z.string().datetime().optional(),
  tenantId: z.string().min(1).max(128).optional(),
  agentId: z.string().min(1).max(128).optional(),
  // Cap labels to keep payloads bounded — defends against operator
  // pushing a huge label-bag through the bridge.
  labels: z.record(z.string().max(64), z.string().max(256)).optional(),
  evidenceRefs: z.array(z.string().max(128)).max(50).optional(),
});

const TelemetryBatchSchema = z.object({
  // 200 samples per batch is a reasonable upper bound for one polling
  // tick; anything larger should be split.
  samples: z.array(TelemetrySampleSchema).min(1).max(200),
});

router.post(
  '/cognitive-reflexivity/telemetry',
  authMiddleware(),
  requireRole(...REFLEXIVITY_OPERATOR_ROLES),
  (req: Request, res: Response) => {
    const parsed = TelemetryBatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_payload', issues: parsed.error.issues });
    }
    const runtime = getReflexivityRuntime();
    // Schema validates `metric` against an exact union, so the cast
    // below is safe; the explicit cast is purely to satisfy the
    // CognitiveTelemetrySample shape.
    const samples = parsed.data.samples as CognitiveTelemetrySample[];
    const result = bridgeTelemetryToReflexivity(runtime.engine, samples);
    res.status(202).json({
      status: 'accepted',
      emitted: result.emitted,
      skipped: result.skipped,
    });
  },
);

export default router;
