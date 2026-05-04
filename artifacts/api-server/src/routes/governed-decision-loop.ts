/**
 * Governed Decision Loop — Demonstration Endpoint
 *
 * POST /governed-decision-loop/run
 *   Runs a simulated end-to-end governed decision cycle:
 *     1. SENSE   — ingest a synthetic signal
 *     2. ORIENT  — pull recalled context from the memory fabric
 *     3. DECIDE  — evaluate against the active policy mode
 *     4. ACT     — record the outcome and write an audit entry
 *
 *   Returns a step-by-step trace so frontend dashboards can animate the loop.
 *
 * GET /governed-decision-loop/trace/:runId
 *   Retrieve the stored trace for a previous run.
 *
 * GET /governed-decision-loop/traces
 *   List recent runs (latest 50).
 */

import { defaultMemoryStore } from '@workspace/memory-fabric/store';
import { buildPolicyEvaluation, defaultPolicyModeRegistry } from '@szl-holdings/policy-engine';
import { randomUUID } from 'node:crypto';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import { authMiddleware } from '../middlewares/auth';
import { getCorrelations } from '../lib/cross-domain-correlator.js';
import type { TagAIContentParams } from '@szl-holdings/proof-chain';

const router: IRouter = Router();

// ─── In-memory trace store (demo — bounded to 200 entries) ──────────────────

interface LoopStep {
  phase: 'sense' | 'orient' | 'recommend' | 'simulate' | 'decide' | 'act' | 'outcome';
  label: string;
  durationMs: number;
  outputs: Record<string, unknown>;
}

interface LoopTrace {
  runId: string;
  scenario: string;
  startedAt: string;
  completedAt: string;
  totalMs: number;
  outcome: 'approved' | 'rejected' | 'escalated' | 'pending_approval';
  steps: LoopStep[];
  crossDomainCorrelations: number;
  /** orgId of the operator who triggered the run — used for tenant isolation. */
  orgId: number | null;
}

const MAX_TRACES = 200;
const traces: LoopTrace[] = [];

const ELEVATED_ROLES_GDL = new Set(['super_admin', 'admin']);

/** Returns true when the caller has an elevated platform role (super_admin or admin). */
function callerIsElevated(req: Request): boolean {
  return req.user?.roles?.some((r) => ELEVATED_ROLES_GDL.has(r)) ?? false;
}

/** Resolve the caller's primary numeric orgId for tenant isolation.
 *  Returns null ONLY for elevated users (super_admin / admin) who should
 *  have platform-wide read access. Non-elevated users with no org membership
 *  return -1 as a sentinel that will never match any real orgId. */
function resolveCallerOrg(req: Request): number | null {
  if (callerIsElevated(req)) return null; // elevated → see all
  const orgs = req.user?.orgs;
  if (!orgs || orgs.length === 0) return -1; // no org → see nothing
  const raw = orgs[0]?.orgId;
  return typeof raw === 'number' ? raw : -1;
}

// ─── Request schema ──────────────────────────────────────────────────────────

const runSchema = z.object({
  scenario: z
    .enum([
      'vessel-sanctions-match',
      'cyber-critical-cve',
      'property-distress',
      'legal-matter-opened',
      'portfolio-risk-threshold',
    ])
    .default('vessel-sanctions-match'),
  forceOutcome: z.enum(['approved', 'rejected', 'escalated']).optional(),
});

// ─── Scenario definitions ────────────────────────────────────────────────────

const SCENARIOS: Record<
  string,
  {
    domain: string;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    actionType: string;
    product: string;
    estimatedCostUsd: number;
    confidence: number;
  }
> = {
  'vessel-sanctions-match': {
    domain: 'maritime',
    type: 'sanctions-hit',
    severity: 'critical',
    title: 'OFAC Sanctions Match — MV Atlantic Pioneer',
    actionType: 'vessel.reroute',
    product: 'vessels',
    estimatedCostUsd: 42000,
    confidence: 0.97,
  },
  'cyber-critical-cve': {
    domain: 'security',
    type: 'cve',
    severity: 'critical',
    title: 'CVE-2025-0x1A — OT Remote-Code Execution',
    actionType: 'security.quarantine',
    product: 'sentra',
    estimatedCostUsd: 0,
    confidence: 0.91,
  },
  'property-distress': {
    domain: 'real-estate',
    type: 'distress-signal',
    severity: 'high',
    title: 'Distressed Asset — 220 Broadwick St, Portfolio Sector 4',
    actionType: 'property.flag',
    product: 'terra',
    estimatedCostUsd: 150000,
    confidence: 0.88,
  },
  'legal-matter-opened': {
    domain: 'legal',
    type: 'matter-opened',
    severity: 'medium',
    title: 'New Matter — Counterparty Dispute, Ref LGL-2025-0412',
    actionType: 'matter.assign-counsel',
    product: 'counsel',
    estimatedCostUsd: 25000,
    confidence: 0.93,
  },
  'portfolio-risk-threshold': {
    domain: 'finance',
    type: 'risk-threshold-breach',
    severity: 'high',
    title: 'Portfolio VaR Breach — Threshold Exceeded by 12%',
    actionType: 'portfolio.rebalance',
    product: 'terra',
    estimatedCostUsd: 500000,
    confidence: 0.82,
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function runSensePhase(
  scenario: (typeof SCENARIOS)[string],
): Promise<{ step: LoopStep; signalId: string }> {
  const t0 = Date.now();
  const signalId = randomUUID();

  const step: LoopStep = {
    phase: 'sense',
    label: 'Ingest Signal',
    durationMs: Date.now() - t0 + 12,
    outputs: {
      signalId,
      domain: scenario.domain,
      type: scenario.type,
      severity: scenario.severity,
      title: scenario.title,
      source: 'prism-signal-bus',
      receivedAt: new Date().toISOString(),
    },
  };
  return { step, signalId };
}

async function runOrientPhase(
  scenario: (typeof SCENARIOS)[string],
  signalId: string,
  callerOrgId?: number | null,
): Promise<{ step: LoopStep; recalledCount: number; correlationCount: number }> {
  const t0 = Date.now();

  // Pull recalled context from memory fabric — scoped to caller's org.
  // defaultMemoryStore is a process-local in-memory store; entries are
  // written during previous loop runs with metadata.orgId set to the
  // triggering operator's org. We enforce per-tenant isolation here:
  //   callerOrgId === null  → elevated: see all entries
  //   callerOrgId === -1   → no-org: guarded above (returns early)
  //   callerOrgId > 0      → regular tenant: only entries owned by this org
  const memoryEntries = defaultMemoryStore
    .list({ includeStale: false })
    .filter((m) => {
      // Org isolation gate: elevated (null) sees all; others filter by orgId.
      const entryOrg = typeof m.metadata?.orgId === 'number' ? m.metadata.orgId : null;
      const orgAllowed = callerOrgId === null || entryOrg === null || entryOrg === callerOrgId;
      if (!orgAllowed) return false;
      return (
        m.domain === scenario.domain ||
        m.tags?.includes(scenario.type) ||
        m.tags?.includes('operator-feedback')
      );
    })
    .slice(0, 5);

  // Pull cross-domain correlations scoped to the caller's org.
  // - callerOrgId === null  → elevated (super_admin/admin): pass orgId=undefined
  //   so getCorrelations() applies NO filter and returns all entries.
  // - callerOrgId === -1   → authenticated but no org membership: return empty
  //   immediately — do NOT call getCorrelations with undefined (would leak all).
  // - callerOrgId > 0      → regular tenant: filter to this org's entries only.
  if (callerOrgId === -1) {
    // No-org non-elevated caller: refuse to expose any correlation data.
    return {
      step: {
        phase: 'orient' as const,
        label: 'Build World Model',
        durationMs: Date.now() - t0 + 18,
        outputs: {
          signalId,
          recalledMemoryEntries: memoryEntries.length,
          memorySummaries: [],
          crossDomainCorrelations: 0,
          correlations: [],
          worldModelRiskScore: scenario.severity === 'critical' ? 0.95 : 0.52,
          noveltyScore: 0.6,
          note: 'Org membership required for correlation access',
        },
      },
      recalledCount: 0,
      correlationCount: 0,
    };
  }

  // Elevated (null) → undefined (no filter); regular org → string key.
  const corrOrgFilter = callerOrgId === null ? undefined : String(callerOrgId);
  const correlations = getCorrelations({ sourceDomain: scenario.domain, limit: 5, orgId: corrOrgFilter });

  const step: LoopStep = {
    phase: 'orient',
    label: 'Build World Model',
    durationMs: Date.now() - t0 + 18,
    outputs: {
      signalId,
      recalledMemoryEntries: memoryEntries.length,
      memorySummaries: memoryEntries.map((m) => ({
        tier: m.tier,
        key: m.key,
        summary: m.summary ?? String(m.value).slice(0, 80),
        confidence: m.confidence,
      })),
      crossDomainCorrelations: correlations.length,
      correlations: correlations.slice(0, 3).map((c) => ({
        impactedDomain: c.impactedDomain,
        impactType: c.impactType,
        strength: c.strength,
        recommendedAction: c.recommendedAction,
      })),
      worldModelRiskScore: scenario.severity === 'critical' ? 0.95 : scenario.severity === 'high' ? 0.78 : 0.52,
      noveltyScore: 0.6,
    },
  };

  return { step, recalledCount: memoryEntries.length, correlationCount: correlations.length };
}

// ── Recommend phase: synthesise recommendations from memory + correlations ───
async function runRecommendPhase(
  scenario: (typeof SCENARIOS)[string],
  memorySummaries: Array<{ tier: string; key: string; summary: string; confidence: number }>,
  correlations: Array<{ impactedDomain: string; impactType: string; recommendedAction: string }>,
): Promise<{ step: LoopStep; topRecommendation: string }> {
  const t0 = Date.now();

  // Build a ranked recommendation list.  Memory entries with high confidence
  // take priority; cross-domain correlations add supporting actions.
  const recommendations: Array<{ rank: number; source: string; action: string; confidence: number }> = [];

  // Recommendations derived from recalled memory
  if (memorySummaries.length > 0) {
    memorySummaries.forEach((m, i) => {
      recommendations.push({
        rank: i + 1,
        source: `memory-fabric:${m.tier}`,
        action: m.summary.slice(0, 120),
        confidence: m.confidence,
      });
    });
  }

  // Recommendations derived from cross-domain correlations
  correlations.forEach((c, i) => {
    recommendations.push({
      rank: memorySummaries.length + i + 1,
      source: `correlator:${c.impactedDomain}`,
      action: c.recommendedAction,
      confidence: 0.75,
    });
  });

  // Fallback scenario-level recommendation if nothing recalled
  if (recommendations.length === 0) {
    recommendations.push({
      rank: 1,
      source: 'policy-engine',
      action: `Execute ${scenario.actionType} — no prior context; policy defaults apply.`,
      confidence: scenario.confidence,
    });
  }

  const topRecommendation = recommendations[0]!.action;

  const step: LoopStep = {
    phase: 'recommend',
    label: 'Generate Recommendations',
    durationMs: Date.now() - t0 + 8,
    outputs: {
      recommendations: recommendations.slice(0, 5),
      topRecommendation,
      memoryInfluenced: memorySummaries.length > 0,
      correlationInfluenced: correlations.length > 0,
      recommendationCount: recommendations.length,
    },
  };

  return { step, topRecommendation };
}

// ── Simulate phase: risk/cost simulation before policy gate ──────────────────
async function runSimulatePhase(
  scenario: (typeof SCENARIOS)[string],
  outcome: 'approved' | 'rejected' | 'escalated' | 'pending_approval',
): Promise<LoopStep> {
  const t0 = Date.now();

  const riskScore = scenario.severity === 'critical' ? 0.92 : scenario.severity === 'high' ? 0.75 : 0.45;
  const complianceRisk = scenario.domain === 'maritime' || scenario.domain === 'legal' ? 0.88 : 0.55;
  const costImpact = scenario.estimatedCostUsd;
  const simulationPassed = riskScore < 0.95 && outcome !== 'rejected';

  const step: LoopStep = {
    phase: 'simulate',
    label: 'Risk & Cost Simulation',
    durationMs: Date.now() - t0 + 15,
    outputs: {
      riskScore,
      complianceRisk,
      costImpact,
      simulationPassed,
      simulationModel: 'szl-risk-v2',
      breakdown: {
        operationalRisk: riskScore * 0.6,
        regulatoryRisk: complianceRisk * 0.4,
        financialExposureUsd: costImpact,
      },
      verdict: simulationPassed ? 'proceed' : 'halt',
    },
  };

  return step;
}

// ── Outcome phase: persist outcome memory for future recall ──────────────────
async function runOutcomePhase(
  scenario: (typeof SCENARIOS)[string],
  outcome: LoopTrace['outcome'],
  runId: string,
  callerOrgId?: number | null,
): Promise<LoopStep> {
  const t0 = Date.now();

  // Write an outcome memory entry so future orient phases can recall it.
  // metadata.orgId is set to the caller's numeric orgId so the orient-phase
  // org-scoping filter can enforce per-tenant isolation on recall.
  defaultMemoryStore.set({
    key: `outcome:${scenario.type}:${runId.slice(0, 8)}`,
    value: `outcome:${outcome}`,
    tier: 'episodic',
    confidence: 0.9,
    domain: scenario.domain,
    tags: ['governed-loop-outcome', scenario.type, outcome],
    summary: `Governed loop outcome for ${scenario.title}: ${outcome}`,
    metadata: {
      orgId: typeof callerOrgId === 'number' && callerOrgId > 0 ? callerOrgId : undefined,
      runId,
    },
  });

  const step: LoopStep = {
    phase: 'outcome',
    label: 'Outcome Tracking',
    durationMs: Date.now() - t0 + 5,
    outputs: {
      outcome,
      runId,
      memorized: true,
      memoryKey: `outcome:${scenario.type}:${runId.slice(0, 8)}`,
      outcomeTracking: {
        domain: scenario.domain,
        actionType: scenario.actionType,
        product: scenario.product,
        finalState: outcome,
        trackedAt: new Date().toISOString(),
      },
    },
  };

  return step;
}

async function runDecidePhase(
  scenario: (typeof SCENARIOS)[string],
  forceOutcome?: 'approved' | 'rejected' | 'escalated',
): Promise<{ step: LoopStep; outcome: LoopTrace['outcome'] }> {
  const t0 = Date.now();

  // Find an applicable policy mode or fall back to defaults
  const allModes = defaultPolicyModeRegistry.list();
  const applicableMode = allModes.find(
    (m) =>
      m.scope.product === scenario.product ||
      m.scope.actionType === scenario.actionType ||
      m.scope.product === '*',
  );

  let policyMode = applicableMode?.mode ?? 'approval-required';
  let policyEval: ReturnType<typeof buildPolicyEvaluation> | null = null;

  if (applicableMode) {
    policyEval = buildPolicyEvaluation({
      decisionId: randomUUID(),
      actionType: scenario.actionType,
      product: scenario.product,
      confidence: scenario.confidence,
      estimatedCostUsd: scenario.estimatedCostUsd,
      mode: applicableMode,
    });
    policyMode = policyEval.result;
  }

  let outcome: LoopTrace['outcome'];
  if (forceOutcome) {
    outcome = forceOutcome;
  } else if (policyMode === 'autonomous') {
    outcome = scenario.confidence >= 0.9 ? 'approved' : 'escalated';
  } else if (policyMode === 'blocked') {
    outcome = 'rejected';
  } else {
    // approval-required or advisory → escalate to human
    outcome = 'pending_approval';
  }

  const step: LoopStep = {
    phase: 'decide',
    label: 'Policy Evaluation',
    durationMs: Date.now() - t0 + 24,
    outputs: {
      actionType: scenario.actionType,
      product: scenario.product,
      confidence: scenario.confidence,
      estimatedCostUsd: scenario.estimatedCostUsd,
      policyMode,
      appliedModeId: applicableMode?.id ?? null,
      policyEvalResult: policyEval
        ? {
            result: policyEval.result,
            reason: policyEval.reason,
            requiresApproval: policyEval.requiresApproval,
          }
        : null,
      outcome,
    },
  };

  return { step, outcome };
}

async function runActPhase(
  scenario: (typeof SCENARIOS)[string],
  outcome: LoopTrace['outcome'],
  callerCtx: { orgId: number | null; userId: number | null; runId: string },
): Promise<LoopStep & { proofId?: number }> {
  const t0 = Date.now();
  const receiptId = randomUUID();

  const actionsTaken: string[] = [];
  let proofId: number | undefined;

  // Write a real proof-chain record for the governed decision outcome.
  // This is the non-repudiation anchor — it persists the decision signal,
  // policy evaluation result, actor identity, and timestamp in the DB.
  try {
    const { tagAIContent } = await import('@szl-holdings/proof-chain');
    const params: TagAIContentParams = {
      orgId: callerCtx.orgId,
      contentId: callerCtx.runId,
      contentType: 'governed-decision-loop-outcome',
      sourceClass: 'system_computed',
      confidenceScore: scenario.confidence,
      modelLane: 'policy-engine',
      serviceAttribution: 'governed-decision-loop',
      generatedByUserId: callerCtx.userId,
      correlationId: receiptId,
      metadata: {
        actionType: scenario.actionType,
        product: scenario.product,
        domain: scenario.domain,
        outcome,
        estimatedCostUsd: scenario.estimatedCostUsd,
        severity: scenario.severity,
      },
    };
    const proof = await tagAIContent(params);
    proofId = proof.proofId;
    actionsTaken.push(`Proof-chain record written — proofId: ${proofId}`);
  } catch (err) {
    logger.warn({ err, runId: callerCtx.runId }, '[governed-decision-loop] proof-chain write failed');
    actionsTaken.push('Proof-chain write attempted (DB write failed — check connection)');
  }

  if (outcome === 'approved') {
    actionsTaken.push(`Executed: ${scenario.actionType}`);
    actionsTaken.push('Memory entry queued for future recall');
  } else if (outcome === 'rejected') {
    actionsTaken.push('Action blocked by policy');
    actionsTaken.push('Rejection recorded in proof-chain');
  } else if (outcome === 'escalated') {
    actionsTaken.push('Escalated to on-call operator via push notification');
    actionsTaken.push('Decision card created in Decision Center');
    actionsTaken.push('SLA timer started');
  } else {
    actionsTaken.push('Approval request queued in Decision Center');
    actionsTaken.push('Approvers notified via push');
  }

  const step: LoopStep & { proofId?: number } = {
    phase: 'act',
    label: 'Execute Governed Action',
    durationMs: Date.now() - t0,
    outputs: {
      outcome,
      receiptId,
      proofId: proofId ?? null,
      actionsTaken,
      proofChainEntry: {
        actor: 'cognitive-runtime',
        action: scenario.actionType,
        outcome,
        timestamp: new Date().toISOString(),
        proofId: proofId ?? null,
        contentType: 'governed-decision-loop-outcome',
      },
    },
    proofId,
  };

  return step;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

router.post(
  '/governed-decision-loop/run',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const parsed = runSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, 'Invalid request body', parsed.error.errors);
        return;
      }

      const { scenario: scenarioKey, forceOutcome } = parsed.data;
      const scenario = SCENARIOS[scenarioKey];

      const runId = randomUUID();
      const startedAt = new Date().toISOString();
      const t0 = Date.now();

      const callerOrgId = resolveCallerOrg(req);
      const callerUserId = req.user?.id ?? null;

      const { step: senseStep, signalId } = await runSensePhase(scenario);
      const { step: orientStep, correlationCount, recalledCount } = await runOrientPhase(scenario, signalId, callerOrgId);

      // Extract memory summaries and correlations from orient outputs for recommend phase
      const memorySummaries = (orientStep.outputs.memorySummaries as Array<{ tier: string; key: string; summary: string; confidence: number }>) ?? [];
      const orientCorrelations = (orientStep.outputs.correlations as Array<{ impactedDomain: string; impactType: string; recommendedAction: string }>) ?? [];

      const { step: recommendStep } = await runRecommendPhase(scenario, memorySummaries, orientCorrelations);
      const { step: decideStep, outcome } = await runDecidePhase(scenario, forceOutcome);
      const simulateStep = await runSimulatePhase(scenario, outcome);
      const actStep = await runActPhase(scenario, outcome, {
        orgId: typeof callerOrgId === 'number' ? callerOrgId : null,
        userId: typeof callerUserId === 'number' ? callerUserId : null,
        runId,
      });
      const outcomeStep = await runOutcomePhase(scenario, outcome, runId, callerOrgId);

      const completedAt = new Date().toISOString();
      const totalMs = Date.now() - t0;

      const trace: LoopTrace = {
        runId,
        scenario: scenarioKey,
        startedAt,
        completedAt,
        totalMs,
        outcome,
        steps: [senseStep, orientStep, recommendStep, simulateStep, decideStep, actStep, outcomeStep],
        crossDomainCorrelations: correlationCount,
        orgId: callerOrgId,
      };

      traces.unshift(trace);
      if (traces.length > MAX_TRACES) traces.splice(MAX_TRACES);

      logger.info(
        { runId, scenario: scenarioKey, outcome, totalMs },
        '[governed-decision-loop] Loop run completed',
      );

      sendSuccess(res, trace);
    } catch (err) {
      handleRouteError(res, err, 'POST /governed-decision-loop/run');
    }
  },
);

router.get(
  '/governed-decision-loop/trace/:runId',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const callerOrg = resolveCallerOrg(req);
      const trace = traces.find(
        (t) =>
          t.runId === req.params.runId &&
          // Elevated users (callerOrg===null) see all traces.
          // Regular org users see ONLY their own org — null-orgId traces are
          // never exposed to non-elevated callers (would leak platform data).
          (callerOrg === null ? true : t.orgId === callerOrg),
      );
      if (!trace) {
        sendNotFound(res, `Trace ${req.params.runId} not found`);
        return;
      }
      sendSuccess(res, trace);
    } catch (err) {
      handleRouteError(res, err, 'GET /governed-decision-loop/trace/:runId');
    }
  },
);

router.get(
  '/governed-decision-loop/traces',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const callerOrg = resolveCallerOrg(req);
      // Elevated (callerOrg===null): unrestricted.
      // Regular org users: strict equality match — null-orgId traces are NOT
      // visible to non-elevated callers to prevent platform data exposure.
      const filtered = traces.filter(
        (t) => callerOrg === null ? true : t.orgId === callerOrg,
      );
      sendSuccess(res, {
        traces: filtered.slice(0, 50).map((t) => ({
          runId: t.runId,
          scenario: t.scenario,
          startedAt: t.startedAt,
          completedAt: t.completedAt,
          totalMs: t.totalMs,
          outcome: t.outcome,
          crossDomainCorrelations: t.crossDomainCorrelations,
        })),
        total: filtered.length,
      });
    } catch (err) {
      handleRouteError(res, err, 'GET /governed-decision-loop/traces');
    }
  },
);

export default router;
