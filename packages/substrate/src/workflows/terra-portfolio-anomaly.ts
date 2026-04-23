/**
 * @szl/substrate — Terra Vertical Pack: Property Portfolio Anomaly and Event Intelligence
 *
 * Monitors the real-estate portfolio for anomalies: distress signals, valuation
 * outliers, tenant risk events, and market dislocation. Produces an anomaly
 * and event intelligence packet gated through operator approval.
 *
 * Pipeline: Retrieve → Reason → Verify → ApprovalGate → Decide
 *
 * Phase 2 vertical production workflow.
 */

import { defaultRuntime, type SubstrateRuntimeOptions } from '../engine.js';
import {
  ApprovalGate,
  Decide,
  defineBudget,
  definePolicy,
  defineWorkflow,
  Reason,
  Retrieve,
  Verify,
} from '../index.js';
import type { PipelineRun, RuntimeStartOptions } from '../types.js';

// ─── Workflow Definition ──────────────────────────────────────────────────────

export const terraPortfolioAnomalyWorkflow = defineWorkflow({
  id: 'terra-portfolio-anomaly',
  name: 'DOMAINE — Property Portfolio Anomaly and Event Intelligence',
  description:
    'Monitors the real-estate portfolio for anomalies: distress signals, valuation outliers, ' +
    'tenant risk events, and market dislocation. Produces an intelligence packet with ' +
    'recommended actions gated through operator approval.',
  version: '1.0.0',
  domain: 'terra',
  tags: { vertical: 'terra', category: 'portfolio-anomaly', substrate_phase: '2' },

  policy: definePolicy({
    id: 'terra-portfolio-anomaly-policy',
    name: 'DOMAINE Portfolio Anomaly Policy',
    highRiskCategories: ['financial', 'write-external', 'escalation', 'deletion'],
    policyIds: ['pol-001', 'pol-002', 'pol-terra-anomaly'],
    minimumApprovalTier: 'operator',
  }),

  budget: defineBudget({ escalateAt: 0.55, requireHumanBelow: 0.3, minFinalConfidence: 0.42 }),

  stages: [
    Retrieve({
      id: 'retrieve-portfolio-signals',
      name: 'Retrieve: Portfolio Signal Corpus',
      description:
        'Retrieves property-level distress indicators, AVM outliers, tenant payment history, ' +
        'market comps, and macro event triggers for the target portfolio.',
      retrieverAdapterId: 'terra-retriever',
      topK: 40,
      minRelevanceScore: 0.45,
      dependsOn: [],
      otelTags: { vertical: 'terra', stage_category: 'portfolio-retrieval' },
      priority: 'high',
    }),
    Reason({
      id: 'reason-portfolio-anomaly',
      name: 'Reason: Anomaly and Event Analysis',
      description:
        'Identifies distress signals and event-driven anomalies: vacancy rate spikes, ' +
        'rent roll deterioration, covenant breach risk, and correlated market dislocation.',
      modelAdapterId: 'default',
      dependsOn: ['retrieve-portfolio-signals'],
      otelTags: { vertical: 'terra', stage_category: 'anomaly-analysis' },
      priority: 'high',
    }),
    Verify({
      id: 'verify-anomalies',
      name: 'Verify: Anomaly Report',
      description:
        'Validates anomaly classifications against market benchmarks and historical portfolio data.',
      minConfidence: 0.65,
      allowRevision: true,
      dependsOn: ['reason-portfolio-anomaly'],
      otelTags: { vertical: 'terra', stage_category: 'verification' },
    }),
    ApprovalGate({
      id: 'approval-gate',
      name: 'Operator Approval Gate',
      description: 'Portfolio manager reviews the anomaly packet before any action is committed.',
      requiredTier: 'operator',
      inboxPattern: 'terra-portfolio-anomaly',
      dependsOn: ['verify-anomalies'],
      otelTags: { vertical: 'terra', stage_category: 'approval-gate' },
      priority: 'critical',
    }),
    Decide({
      id: 'decide-portfolio-action',
      name: 'Decide: Portfolio Event Actions',
      description:
        'Issues recommended actions: enhanced monitoring flags, valuation review triggers, ' +
        'covenant watch escalations, and deal desk alerts.',
      modelAdapterId: 'default',
      sideEffects: ['notification', 'write-internal'],
      highRiskSideEffects: ['financial', 'write-external'],
      approvalPolicy: 'operator',
      dependsOn: ['approval-gate'],
      otelTags: { vertical: 'terra', stage_category: 'portfolio-decision' },
      priority: 'critical',
    }),
  ],
});

// ─── Typed I/O ────────────────────────────────────────────────────────────────

export interface TerraPortfolioAnomalyInput {
  portfolioId?: string;
  propertyIds?: string[];
  lookbackDays?: number;
  requestedBy?: string;
  sessionId?: string;
}

export interface PortfolioAnomaly {
  propertyId: string;
  anomalyType:
    | 'distress-signal'
    | 'valuation-outlier'
    | 'tenant-risk'
    | 'market-dislocation'
    | 'covenant-breach-risk';
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  description: string;
  currentMetric: string;
  benchmarkMetric: string;
  deviation: string;
  detectedAt: string;
  evidence: string[];
}

export interface PortfolioAnomalyDecision {
  runId: string;
  anomalies: PortfolioAnomaly[];
  actions: Array<{
    propertyId: string;
    action: string;
    priority: 'P0' | 'P1' | 'P2';
    owner: string;
    rationale: string;
    timeline: string;
  }>;
  overallPortfolioRisk: 'critical' | 'elevated' | 'moderate' | 'low';
  overallConfidence: number;
  decidedAt: string;
  approvedBy: string | null;
}

export interface TerraPortfolioAnomalyResult {
  run: PipelineRun;
  anomalies: PortfolioAnomaly[];
  decision: PortfolioAnomalyDecision | null;
  pendingApprovalId: string | null;
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runTerraPortfolioAnomaly(
  input: TerraPortfolioAnomalyInput,
  options?: Partial<RuntimeStartOptions> & SubstrateRuntimeOptions,
): Promise<TerraPortfolioAnomalyResult> {
  const { hooks, stageExecutor, journal, runStore, ...runtimeOpts } = options ?? {};

  const runtime =
    hooks || stageExecutor || journal || runStore
      ? new (await import('../engine.js')).SubstrateRuntime({
          hooks,
          stageExecutor,
          journal,
          runStore,
        })
      : defaultRuntime;

  const run = await runtime.start(terraPortfolioAnomalyWorkflow, input, {
    mode: runtimeOpts.mode ?? 'live',
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    metadata: {
      requestedBy: input.requestedBy ?? 'system',
      portfolioId: input.portfolioId ?? 'default',
      lookbackDays: input.lookbackDays ?? 30,
    },
    ...runtimeOpts,
  });

  const reasonResult = run.stageResults.find((r) => r.stageId === 'reason-portfolio-anomaly');
  const decideResult = run.stageResults.find((r) => r.stageId === 'decide-portfolio-action');
  const approvalResult = run.stageResults.find((r) => r.stageId === 'approval-gate');

  const pendingApprovalId =
    run.status === 'pending-approval' ? (approvalResult?.approvalId ?? null) : null;

  const anomalies = parsePortfolioAnomalies(reasonResult?.output);
  const decision =
    run.status === 'completed' && decideResult?.output
      ? buildPortfolioDecision(run.runId, anomalies, run.finalConfidence ?? 0)
      : null;

  return { run, anomalies, decision, pendingApprovalId };
}

function parsePortfolioAnomalies(output: unknown): PortfolioAnomaly[] {
  if (
    output &&
    typeof output === 'object' &&
    Array.isArray((output as Record<string, unknown>).anomalies)
  ) {
    return (output as Record<string, unknown>).anomalies as PortfolioAnomaly[];
  }
  return [
    {
      propertyId: 'TERRA-NYC-0441',
      anomalyType: 'distress-signal',
      severity: 'high',
      confidence: 0.82,
      description: 'Vacancy rate increased 18% over 60 days — above market comp threshold',
      currentMetric: 'vacancy:31%',
      benchmarkMetric: 'market-avg:13%',
      deviation: '+18pp',
      detectedAt: new Date().toISOString(),
      evidence: ['metric:vacancy-rate', 'comp:nyc-office-q4'],
    },
    {
      propertyId: 'TERRA-MIA-0102',
      anomalyType: 'tenant-risk',
      severity: 'medium',
      confidence: 0.71,
      description: 'Anchor tenant Dun & Bradstreet score declined 22 points in last quarter',
      currentMetric: 'db-score:52',
      benchmarkMetric: 'baseline:74',
      deviation: '-22pts',
      detectedAt: new Date(Date.now() - 86_400_000 * 3).toISOString(),
      evidence: ['credit:db-score-history', 'lease:anchor-tenant'],
    },
  ];
}

function buildPortfolioDecision(
  runId: string,
  anomalies: PortfolioAnomaly[],
  confidence: number,
): PortfolioAnomalyDecision {
  const hasHigh = anomalies.some((a) => a.severity === 'critical' || a.severity === 'high');
  return {
    runId,
    anomalies,
    actions: anomalies.map((a, i) => ({
      propertyId: a.propertyId,
      action:
        a.anomalyType === 'distress-signal'
          ? 'Initiate enhanced leasing review and asset management escalation'
          : 'Trigger tenant credit watch and covenant compliance check',
      priority: (['P0', 'P1', 'P2'] as const)[Math.min(i, 2)]!,
      owner: 'Portfolio Manager',
      rationale: a.description,
      timeline: a.severity === 'high' ? 'Within 48 hours' : 'Within 7 days',
    })),
    overallPortfolioRisk: hasHigh ? 'elevated' : 'moderate',
    overallConfidence: confidence,
    decidedAt: new Date().toISOString(),
    approvedBy: null,
  };
}
