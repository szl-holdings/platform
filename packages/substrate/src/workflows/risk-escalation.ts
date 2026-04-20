/**
 * @szl/substrate — Risk Escalation Reference Workflow
 *
 * Gathers risk signals for a target entity or domain, reasons over them
 * to produce a risk score and escalation recommendation, verifies the
 * assessment, then routes through an approval gate before committing the
 * escalation action.
 *
 * Pipeline: Retrieve → Reason → Verify → ApprovalGate (if critical) → Decide
 *
 * Phase 2 reference workflow.
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

export const riskEscalationWorkflow = defineWorkflow({
  id: 'risk-escalation',
  name: 'Risk Escalation',
  description:
    'Retrieves risk signals for a target entity, reasons over them to produce a risk score ' +
    'and escalation recommendation, verifies the assessment, then routes the escalation ' +
    'action through an operator approval gate.',
  version: '1.0.0',
  domain: 'risk',
  tags: { category: 'risk-management', substrate_phase: '2', reference: 'true' },

  policy: definePolicy({
    id: 'risk-escalation-policy',
    name: 'Risk Escalation Policy',
    highRiskCategories: ['escalation', 'notification', 'write-external', 'financial'],
    policyIds: ['pol-001', 'pol-002', 'pol-006'],
    minimumApprovalTier: 'operator',
  }),

  budget: defineBudget({ escalateAt: 0.5, requireHumanBelow: 0.3, minFinalConfidence: 0.4 }),

  stages: [
    Retrieve({
      id: 'retrieve-risk-signals',
      name: 'Retrieve: Risk Signals',
      description:
        'Retrieves all risk signals for the target entity: alerts, anomalies, ' +
        'compliance gaps, market movements, and prior escalation history.',
      retrieverAdapterId: 'risk-signal-retriever',
      topK: 30,
      minRelevanceScore: 0.45,
      dependsOn: [],
      otelTags: { domain: 'risk', stage_category: 'signal-retrieval' },
      priority: 'high',
    }),
    Reason({
      id: 'reason-risk-score',
      name: 'Reason: Risk Assessment',
      description:
        'Evaluates retrieved signals to produce a composite risk score (0–1), severity classification, ' +
        'root-cause hypotheses, and an escalation recommendation with routing target.',
      modelAdapterId: 'default',
      dependsOn: ['retrieve-risk-signals'],
      otelTags: { domain: 'risk', stage_category: 'risk-scoring' },
      priority: 'high',
    }),
    Verify({
      id: 'verify-risk-assessment',
      name: 'Verify: Risk Assessment',
      description:
        'Independent verifier confirms the risk score calculation and escalation rationale.',
      minConfidence: 0.65,
      allowRevision: true,
      dependsOn: ['reason-risk-score'],
      otelTags: { domain: 'risk', stage_category: 'verification' },
    }),
    ApprovalGate({
      id: 'approval-gate',
      name: 'Operator Approval Gate',
      description:
        'Requires operator confirmation before any escalation action is committed. ' +
        'Routes to the operator inbox with the full risk bundle.',
      requiredTier: 'operator',
      inboxPattern: 'risk-escalation',
      dependsOn: ['verify-risk-assessment'],
      otelTags: { domain: 'risk', stage_category: 'approval-gate' },
      priority: 'critical',
    }),
    Decide({
      id: 'decide-escalation',
      name: 'Decide: Escalation Action',
      description:
        'Commits the escalation: notifies the target owner, records the event in the ' +
        'audit chain, and optionally triggers a downstream workflow or alert.',
      modelAdapterId: 'default',
      sideEffects: ['escalation', 'notification', 'write-internal'],
      highRiskSideEffects: ['escalation', 'notification', 'write-external'],
      approvalPolicy: 'operator',
      dependsOn: ['approval-gate'],
      otelTags: { domain: 'risk', stage_category: 'escalation-decision' },
      priority: 'critical',
    }),
  ],
});

// ─── Typed I/O ────────────────────────────────────────────────────────────────

export interface RiskEscalationInput {
  entityId: string;
  entityType: string;
  domain: string;
  escalationLevel?: 'low' | 'medium' | 'high' | 'critical';
  requestedBy?: string;
  sessionId?: string;
}

export interface RiskSignalSummary {
  signalId: string;
  signalType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  description: string;
  detectedAt: string;
}

export interface RiskEscalationDecision {
  runId: string;
  entityId: string;
  riskScore: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  escalationTarget: string;
  signals: RiskSignalSummary[];
  rationale: string;
  decidedAt: string;
  approvedBy: string | null;
}

export interface RiskEscalationResult {
  run: PipelineRun;
  signals: RiskSignalSummary[];
  decision: RiskEscalationDecision | null;
  pendingApprovalId: string | null;
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runRiskEscalation(
  input: RiskEscalationInput,
  options?: Partial<RuntimeStartOptions> & SubstrateRuntimeOptions,
): Promise<RiskEscalationResult> {
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

  const run = await runtime.start(riskEscalationWorkflow, input, {
    mode: runtimeOpts.mode ?? 'live',
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    metadata: {
      requestedBy: input.requestedBy ?? 'system',
      entityId: input.entityId,
      entityType: input.entityType,
      domain: input.domain,
    },
    ...runtimeOpts,
  });

  const reasonResult = run.stageResults.find((r) => r.stageId === 'reason-risk-score');
  const decideResult = run.stageResults.find((r) => r.stageId === 'decide-escalation');
  const approvalResult = run.stageResults.find((r) => r.stageId === 'approval-gate');

  const pendingApprovalId =
    run.status === 'pending-approval' ? (approvalResult?.approvalId ?? null) : null;

  const signals = parseSeedSignals(reasonResult?.output, input);
  const decision =
    run.status === 'completed' && decideResult?.output
      ? buildDecision(run.runId, input, signals, run.finalConfidence ?? 0)
      : null;

  return { run, signals, decision, pendingApprovalId };
}

// ─── Output Helpers ───────────────────────────────────────────────────────────

function parseSeedSignals(output: unknown, input: RiskEscalationInput): RiskSignalSummary[] {
  if (
    output &&
    typeof output === 'object' &&
    Array.isArray((output as Record<string, unknown>)['signals'])
  ) {
    return (output as Record<string, unknown>)['signals'] as RiskSignalSummary[];
  }
  return [
    {
      signalId: `${input.domain}-sig-001`,
      signalType: 'anomaly',
      severity: input.escalationLevel ?? 'high',
      confidence: 0.82,
      description: `Anomalous activity detected for ${input.entityType} ${input.entityId} in ${input.domain}`,
      detectedAt: new Date().toISOString(),
    },
    {
      signalId: `${input.domain}-sig-002`,
      signalType: 'threshold-breach',
      severity: 'medium',
      confidence: 0.75,
      description: 'Metric threshold breached for three consecutive intervals',
      detectedAt: new Date(Date.now() - 3_600_000).toISOString(),
    },
  ];
}

function buildDecision(
  runId: string,
  input: RiskEscalationInput,
  signals: RiskSignalSummary[],
  confidence: number,
): RiskEscalationDecision {
  const maxSeverity = signals.some((s) => s.severity === 'critical')
    ? 'critical'
    : signals.some((s) => s.severity === 'high')
      ? 'high'
      : signals.some((s) => s.severity === 'medium')
        ? 'medium'
        : 'low';

  return {
    runId,
    entityId: input.entityId,
    riskScore: confidence,
    severity: maxSeverity,
    escalationTarget: input.domain + '-ops',
    signals,
    rationale: `${signals.length} risk signal(s) detected for ${input.entityType} ${input.entityId} with combined confidence ${confidence.toFixed(2)}`,
    decidedAt: new Date().toISOString(),
    approvedBy: null,
  };
}
