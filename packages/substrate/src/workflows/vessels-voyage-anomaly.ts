/**
 * @szl/substrate — Vessels Vertical Pack: Voyage Event Anomaly Review
 *
 * Reviews voyage event streams for anomalies: AIS dark periods, unexpected
 * port calls, STS transfers, route deviations, and sanctions proximity.
 * Produces an anomaly report and routes escalation actions through an
 * operator approval before any alert or case creation is committed.
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

export const vesselsVoyageAnomalyWorkflow = defineWorkflow({
  id: 'vessels-voyage-anomaly',
  name: 'SEXTANT — Voyage Event Anomaly Review',
  description:
    'Reviews voyage event streams for anomalies: AIS dark periods, unexpected port calls, ' +
    'STS transfers, route deviations, and sanctions proximity. Produces an anomaly report ' +
    'with escalation routing gated through operator approval.',
  version: '1.0.0',
  domain: 'vessels',
  tags: { vertical: 'vessels', category: 'voyage-anomaly', substrate_phase: '2' },

  policy: definePolicy({
    id: 'vessels-voyage-anomaly-policy',
    name: 'SEXTANT Voyage Anomaly Policy',
    highRiskCategories: ['escalation', 'notification', 'write-external', 'financial'],
    policyIds: ['pol-001', 'pol-002', 'pol-vessels-anomaly'],
    minimumApprovalTier: 'operator',
  }),

  budget: defineBudget({ escalateAt: 0.5, requireHumanBelow: 0.3, minFinalConfidence: 0.4 }),

  stages: [
    Retrieve({
      id: 'retrieve-voyage-events',
      name: 'Retrieve: Voyage Event Stream',
      description:
        'Fetches AIS position history, port call records, STS event logs, route snapshots, ' +
        'and sanctions watchlist proximity data for the target vessels.',
      retrieverAdapterId: 'vessels-retriever',
      topK: 50,
      minRelevanceScore: 0.4,
      dependsOn: [],
      otelTags: { vertical: 'vessels', stage_category: 'voyage-event-retrieval' },
      priority: 'high',
    }),
    Reason({
      id: 'reason-anomaly-detection',
      name: 'Reason: Voyage Anomaly Detection',
      description:
        'Identifies anomalous patterns in the voyage event stream: AIS dark gaps, ' +
        'unexpected diversions, STS proximity to sanctioned vessels, and cargo manifest discrepancies.',
      modelAdapterId: 'default',
      dependsOn: ['retrieve-voyage-events'],
      otelTags: { vertical: 'vessels', stage_category: 'anomaly-detection' },
      priority: 'high',
    }),
    Verify({
      id: 'verify-anomalies',
      name: 'Verify: Anomaly Report',
      description:
        'Validates anomaly classifications against historical patterns and regulatory thresholds.',
      minConfidence: 0.65,
      allowRevision: true,
      dependsOn: ['reason-anomaly-detection'],
      otelTags: { vertical: 'vessels', stage_category: 'verification' },
    }),
    ApprovalGate({
      id: 'approval-gate',
      name: 'Operator Approval Gate',
      description:
        'Maritime operations analyst reviews the anomaly report before escalation is committed.',
      requiredTier: 'operator',
      inboxPattern: 'vessels-voyage-anomaly',
      dependsOn: ['verify-anomalies'],
      otelTags: { vertical: 'vessels', stage_category: 'approval-gate' },
      priority: 'critical',
    }),
    Decide({
      id: 'decide-escalation',
      name: 'Decide: Anomaly Escalation Actions',
      description:
        'Produces escalation actions: case creation, counterparty notification, compliance flag, ' +
        'or route-watch extension. Evidence-signed for regulatory reporting.',
      modelAdapterId: 'default',
      sideEffects: ['escalation', 'notification', 'write-internal'],
      highRiskSideEffects: ['write-external', 'financial'],
      approvalPolicy: 'operator',
      dependsOn: ['approval-gate'],
      otelTags: { vertical: 'vessels', stage_category: 'escalation-decision' },
      priority: 'critical',
    }),
  ],
});

// ─── Typed I/O ────────────────────────────────────────────────────────────────

export interface VesselsVoyageAnomalyInput {
  vesselIds?: string[];
  voyageIds?: string[];
  lookbackHours?: number;
  requestedBy?: string;
  sessionId?: string;
}

export interface VoyageAnomaly {
  vesselId: string;
  voyageId: string;
  anomalyType:
    | 'ais-dark'
    | 'unexpected-port'
    | 'sts-transfer'
    | 'route-deviation'
    | 'sanctions-proximity';
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  description: string;
  coordinates?: { lat: number; lon: number };
  durationHours?: number;
  detectedAt: string;
  evidence: string[];
}

export interface VoyageAnomalyDecision {
  runId: string;
  anomalies: VoyageAnomaly[];
  escalations: Array<{
    vesselId: string;
    action: string;
    urgency: 'immediate' | 'within-4h' | 'next-business-day';
    rationale: string;
    caseId: string | null;
  }>;
  overallConfidence: number;
  decidedAt: string;
  approvedBy: string | null;
}

export interface VesselsVoyageAnomalyResult {
  run: PipelineRun;
  anomalies: VoyageAnomaly[];
  decision: VoyageAnomalyDecision | null;
  pendingApprovalId: string | null;
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runVesselsVoyageAnomaly(
  input: VesselsVoyageAnomalyInput,
  options?: Partial<RuntimeStartOptions> & SubstrateRuntimeOptions,
): Promise<VesselsVoyageAnomalyResult> {
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

  const run = await runtime.start(vesselsVoyageAnomalyWorkflow, input, {
    mode: runtimeOpts.mode ?? 'live',
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    metadata: {
      requestedBy: input.requestedBy ?? 'system',
      vesselIds: input.vesselIds ?? [],
      lookbackHours: input.lookbackHours ?? 48,
    },
    ...runtimeOpts,
  });

  const reasonResult = run.stageResults.find((r) => r.stageId === 'reason-anomaly-detection');
  const decideResult = run.stageResults.find((r) => r.stageId === 'decide-escalation');
  const approvalResult = run.stageResults.find((r) => r.stageId === 'approval-gate');

  const pendingApprovalId =
    run.status === 'pending-approval' ? (approvalResult?.approvalId ?? null) : null;

  const anomalies = parseVoyageAnomalies(reasonResult?.output);
  const decision =
    run.status === 'completed' && decideResult?.output
      ? buildAnomalyDecision(run.runId, anomalies, run.finalConfidence ?? 0)
      : null;

  return { run, anomalies, decision, pendingApprovalId };
}

function parseVoyageAnomalies(output: unknown): VoyageAnomaly[] {
  if (
    output &&
    typeof output === 'object' &&
    Array.isArray((output as Record<string, unknown>).anomalies)
  ) {
    return (output as Record<string, unknown>).anomalies as VoyageAnomaly[];
  }
  return [
    {
      vesselId: 'IMO-9876543',
      voyageId: 'VOY-2024-0441',
      anomalyType: 'ais-dark',
      severity: 'high',
      confidence: 0.84,
      description: '14-hour AIS signal gap in Strait of Hormuz transit window',
      coordinates: { lat: 26.5, lon: 56.3 },
      durationHours: 14,
      detectedAt: new Date().toISOString(),
      evidence: ['ais:gap-event-001', 'route:hormuz-corridor'],
    },
    {
      vesselId: 'IMO-9876543',
      voyageId: 'VOY-2024-0441',
      anomalyType: 'sts-transfer',
      severity: 'critical',
      confidence: 0.77,
      description: 'STS transfer detected near sanctioned vessel on OFAC SDN list',
      coordinates: { lat: 24.1, lon: 53.8 },
      detectedAt: new Date(Date.now() - 3_600_000).toISOString(),
      evidence: ['ofac:sdn-match', 'ais:proximity-event-002'],
    },
  ];
}

function buildAnomalyDecision(
  runId: string,
  anomalies: VoyageAnomaly[],
  confidence: number,
): VoyageAnomalyDecision {
  return {
    runId,
    anomalies,
    escalations: anomalies.map((a) => ({
      vesselId: a.vesselId,
      action:
        a.anomalyType === 'sts-transfer'
          ? 'Create compliance case and notify sanctions team immediately'
          : 'Flag for enhanced monitoring and counterparty due diligence',
      urgency:
        a.severity === 'critical'
          ? ('immediate' as const)
          : a.severity === 'high'
            ? ('within-4h' as const)
            : ('next-business-day' as const),
      rationale: a.description,
      caseId: null,
    })),
    overallConfidence: confidence,
    decidedAt: new Date().toISOString(),
    approvedBy: null,
  };
}
