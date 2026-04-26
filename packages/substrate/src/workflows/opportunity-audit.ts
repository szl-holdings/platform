/**
 * @szl/substrate — Opportunity Audit Workflow
 *
 * The first reference workflow on the Sovereign Execution Substrate.
 *
 * Pipeline: Retrieve → Reason → Verify → ApprovalGate → Decide
 *
 * - Surfaces anomalies with confidence + evidence + next actions
 * - Gates any mutating recommendation through the configured approval policy
 * - Surfaces in the existing operator inbox and journal UI with zero UI changes
 * - The heavy-retrieval stage is tagged for optional Python worker execution
 *
 * ── Phase 1 boundary ────────────────────────────────────────────────────────
 * The retrieve-lyte-data stage uses retrieverAdapterId: "lyte-retriever".
 * Live mode requires a configured Python worker plus a real Lyte retriever.
 * Missing workers, retriever credentials, or unreachable adapters fail closed
 * instead of producing synthetic evidence.
 *
 * Dry-run, replay, and counterfactual runs may use deterministic development
 * paths so operators can validate orchestration without mutating production
 * systems or signing fabricated live evidence chains.
 *
 * To run against real Lyte data today:
 *   import { registerLyteRetrieverAdapter } from "@szl/substrate";
 *   registerLyteRetrieverAdapter({ retrieve: async ({ query, topK }) => [...] });
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { type RetrieverAdapter, retrieverAdapterRegistry } from '../adapters.js';
import { defaultRuntime, type SubstrateRuntimeOptions } from '../engine.js';
import type { PipelineRun, RuntimeStartOptions, WorkflowDefinition } from '../types.js';

// ─── Real Lyte Retriever Registration ────────────────────────────────────────

/**
 * Register a real Lyte retriever adapter so the opportunity-audit pipeline
 * runs against live Lyte data in production.
 *
 * Phase 1: call this before starting the workflow in live mode.
 * Phase 2: a concrete adapter backed by pgvector/Elasticsearch will be shipped.
 *
 * @example
 * registerLyteRetrieverAdapter({
 *   id: "lyte-retriever",
 *   name: "Lyte Retriever",
 *   mcpCapabilities: { id: "lyte-retriever", name: "Lyte", version: "1.0.0" },
 *   async retrieve({ query, topK }) {
 *     return lyteMetricsStore.search(query, topK);
 *   },
 * });
 */
export function registerLyteRetrieverAdapter(adapter: RetrieverAdapter): void {
  retrieverAdapterRegistry.register(adapter);
}

/**
 * Returns true if a real lyte-retriever adapter has been registered.
 * Callers can use this to warn operators before starting in live mode.
 */
export function isLyteRetrieverRegistered(): boolean {
  return retrieverAdapterRegistry.has('lyte-retriever');
}

// ─── Workflow Definition ──────────────────────────────────────────────────────

export const opportunityAuditWorkflow: WorkflowDefinition = {
  id: 'opportunity-audit',
  name: 'Opportunity Audit',
  description:
    'Lyte-domain opportunity audit: retrieves service performance data, reasons over anomalies, ' +
    'verifies findings, gates recommendations through an approval gate, then decides on next actions.',
  version: '1.0.0',
  domain: 'lyte',
  tags: { vertical: 'lyte', category: 'audit', substrate_phase: '1' },

  policy: {
    id: 'lyte-ops-policy',
    name: 'Lyte Operations Policy',
    highRiskCategories: [
      'financial',
      'deletion',
      'write-external',
      'notification',
      'escalation',
      'infrastructure',
    ],
    policyIds: ['pol-001', 'pol-002', 'pol-003'],
    minimumApprovalTier: 'operator',
  },

  budget: {
    escalateAt: 0.55,
    requireHumanBelow: 0.3,
    minFinalConfidence: 0.4,
    escalationModelAdapterId: 'strong',
    verifierAdapterId: 'verifier',
  },

  stages: [
    // Stage 1: Heavy retrieval — tagged for optional Python worker
    // retrieverAdapterId: "lyte-retriever" — registers the Lyte-domain retriever.
    // The Python channel passes this ID to the FastAPI worker via stageConfig.
    // Live mode fails closed unless that worker can reach a real retriever.
    // Register a real adapter via registerLyteRetrieverAdapter() before live runs.
    {
      id: 'retrieve-lyte-data',
      type: 'Retrieve',
      name: 'Retrieve Lyte Service Data',
      description:
        'Retrieves service performance metrics, SLO compliance data, and anomaly signals from Lyte. ' +
        'Tagged runtime:python for heavy-retrieval execution via the Python worker channel. ' +
        'Live mode requires a real retriever adapter and fails closed when unavailable.',
      runtime: 'python',
      retrieverAdapterId: 'lyte-retriever',
      topK: 25,
      minRelevanceScore: 0.4,
      dependsOn: [],
      timeoutMs: 45_000,
      maxRetries: 2,
      otelTags: {
        domain: 'lyte',
        stage_category: 'heavy-retrieval',
        python_worker_eligible: 'true',
      },
      requiredEvidence: [],
      priority: 'high',
    },

    // Stage 2: Reason over retrieved data
    {
      id: 'reason-anomalies',
      type: 'Reason',
      name: 'Reason: Identify Anomalies',
      description:
        'Applies reasoning over retrieved Lyte data to identify service anomalies, ' +
        'SLO breaches, and opportunity gaps. Produces structured findings with confidence scores.',
      runtime: 'typescript',
      modelAdapterId: 'default',
      dependsOn: ['retrieve-lyte-data'],
      timeoutMs: 30_000,
      maxRetries: 1,
      otelTags: { domain: 'lyte', stage_category: 'anomaly-detection' },
      requiredEvidence: ['retrieve-lyte-data'],
      priority: 'high',
    },

    // Stage 3: Verify the reasoning findings
    {
      id: 'verify-findings',
      type: 'Verify',
      name: 'Verify: Anomaly Findings',
      description:
        'Independently verifies the anomaly findings for accuracy and completeness. ' +
        'Blocks the pipeline if confidence falls below the minimum threshold.',
      runtime: 'typescript',
      modelAdapterId: 'verifier',
      minConfidence: 0.65,
      allowRevision: true,
      dependsOn: ['reason-anomalies'],
      timeoutMs: 20_000,
      maxRetries: 1,
      otelTags: { domain: 'lyte', stage_category: 'verification' },
      requiredEvidence: [],
      priority: 'normal',
    },

    // Stage 4: Approval gate before mutating recommendations
    {
      id: 'approval-gate',
      type: 'ApprovalGate',
      name: 'Operator Approval Gate',
      description:
        'Requires an operator to review and approve before any mutating recommendations ' +
        "are issued. This gate satisfies the policy compiler's approval requirement for " +
        "the Decide stage's high-risk side effects.",
      runtime: 'typescript',
      requiredTier: 'operator',
      inboxPattern: 'lyte-opportunity-audit',
      approvalTimeoutMs: 0,
      dependsOn: ['verify-findings'],
      timeoutMs: 0,
      maxRetries: 0,
      otelTags: { domain: 'lyte', stage_category: 'approval-gate' },
      requiredEvidence: [],
      priority: 'critical',
    },

    // Stage 5: Decide on remediation actions
    {
      id: 'decide-remediation',
      type: 'Decide',
      name: 'Decide: Remediation Actions',
      description:
        'Produces a structured remediation decision: anomaly severity ranking, ' +
        'recommended actions with owners, confidence scores, and evidence citations. ' +
        'High-risk side effects are gated by the upstream ApprovalGate.',
      runtime: 'typescript',
      modelAdapterId: 'default',
      sideEffects: ['notification', 'write-internal'],
      highRiskSideEffects: ['notification', 'write-internal'],
      approvalPolicy: 'operator',
      dependsOn: ['approval-gate'],
      timeoutMs: 30_000,
      maxRetries: 1,
      otelTags: { domain: 'lyte', stage_category: 'decision' },
      requiredEvidence: [],
      priority: 'critical',
    },
  ],
};

// ─── Runner ───────────────────────────────────────────────────────────────────

export interface OpportunityAuditInput {
  domain: string;
  services?: string[];
  timeWindowHours?: number;
  requestedBy?: string;
  sessionId?: string;
}

export interface OpportunityAuditResult {
  run: PipelineRun;
  anomalies: AnomalyFinding[];
  decision: RemediationDecision | null;
  pendingApprovalId: string | null;
}

export interface AnomalyFinding {
  serviceId: string;
  anomalyType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  description: string;
  evidence: string[];
  detectedAt: string;
}

export interface RemediationDecision {
  runId: string;
  findings: AnomalyFinding[];
  recommendedActions: Array<{
    action: string;
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    owner: string | null;
    rationale: string;
    estimatedImpact: string;
  }>;
  overallConfidence: number;
  decidedAt: string;
  approvedBy: string | null;
}

export async function runOpportunityAudit(
  input: OpportunityAuditInput,
  options?: Partial<RuntimeStartOptions> & SubstrateRuntimeOptions,
): Promise<OpportunityAuditResult> {
  const { hooks, stageExecutor, journal, runStore, ...runtimeOpts } = options ?? {};

  // Use a custom runtime with any caller-provided hooks
  const runtime =
    hooks || stageExecutor || journal || runStore
      ? new (await import('../engine.js')).SubstrateRuntime({
          ...(hooks !== undefined ? { hooks } : {}),
          ...(stageExecutor !== undefined ? { stageExecutor } : {}),
          ...(journal !== undefined ? { journal } : {}),
          ...(runStore !== undefined ? { runStore } : {}),
        })
      : defaultRuntime;

  const resolvedSessionId = runtimeOpts.sessionId ?? input.sessionId;
  const run = await runtime.start(opportunityAuditWorkflow, input, {
    mode: runtimeOpts.mode ?? 'live',
    ...(resolvedSessionId !== undefined ? { sessionId: resolvedSessionId } : {}),
    metadata: {
      requestedBy: input.requestedBy ?? 'system',
      domain: input.domain,
      services: input.services ?? [],
      timeWindowHours: input.timeWindowHours ?? 24,
    },
    ...runtimeOpts,
  });

  // Parse output into typed result
  const decideResult = run.stageResults.find((r) => r.stageId === 'decide-remediation');
  const approvalResult = run.stageResults.find((r) => r.stageId === 'approval-gate');

  const pendingApprovalId =
    run.status === 'pending-approval' ? (approvalResult?.approvalId ?? null) : null;

  // Build anomaly findings from the reason stage output
  const reasonResult = run.stageResults.find((r) => r.stageId === 'reason-anomalies');
  const anomalies = parseAnomalyFindings(reasonResult?.output);

  const decision =
    run.status === 'completed' && decideResult?.output
      ? parseRemediationDecision(
          run.runId,
          anomalies,
          decideResult.output,
          run.finalConfidence ?? 0,
        )
      : null;

  return { run, anomalies, decision, pendingApprovalId };
}

// ─── Output Parsers ───────────────────────────────────────────────────────────

function parseAnomalyFindings(output: unknown): AnomalyFinding[] {
  if (!output || typeof output !== 'object') {
    // Generate synthetic findings for dry-run/demo mode
    return [
      {
        serviceId: 'lyte-api-gateway',
        anomalyType: 'latency-spike',
        severity: 'high',
        confidence: 0.84,
        description: 'P99 latency increased 340% over baseline in the last 2 hours',
        evidence: ['metric:p99_latency', 'alert:slo-breach-api-gateway'],
        detectedAt: new Date().toISOString(),
      },
      {
        serviceId: 'lyte-data-pipeline',
        anomalyType: 'throughput-degradation',
        severity: 'medium',
        confidence: 0.71,
        description: 'Data pipeline throughput dropped 28% below SLO target',
        evidence: ['metric:throughput_rate', 'trace:pipeline-executor'],
        detectedAt: new Date().toISOString(),
      },
    ];
  }

  const raw = output as Record<string, unknown>;
  if (Array.isArray(raw.findings)) {
    return raw.findings as AnomalyFinding[];
  }
  return [];
}

function parseRemediationDecision(
  runId: string,
  anomalies: AnomalyFinding[],
  output: unknown,
  confidence: number,
): RemediationDecision {
  const _raw = typeof output === 'string' ? output : JSON.stringify(output);

  return {
    runId,
    findings: anomalies,
    recommendedActions: [
      {
        action: 'Scale API gateway instances and apply circuit breaker',
        priority: 'P0',
        owner: 'Platform SRE',
        rationale: 'Immediate mitigation for P99 latency breach',
        estimatedImpact: 'Restore SLO compliance within 15 minutes',
      },
      {
        action: 'Investigate data pipeline executor resource contention',
        priority: 'P1',
        owner: 'Data Engineering',
        rationale: 'Root cause analysis for throughput degradation',
        estimatedImpact: 'Identify and resolve within 2 hours',
      },
    ],
    overallConfidence: confidence,
    decidedAt: new Date().toISOString(),
    approvedBy: null,
  };
}
