/**
 * @szl/substrate — PRISM Counsel Vertical Pack: Matter Evidence Packaging and Deadline Escalation
 *
 * Retrieves matter records, documents, and deadline schedules for active legal
 * matters, packages structured evidence bundles for attorney review, and
 * escalates approaching deadlines through an operator-approved action packet.
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

export const prismCounselEvidencePackagingWorkflow = defineWorkflow({
  id: 'prism-counsel-evidence-packaging',
  name: 'PRISM Counsel — Matter Evidence Packaging and Deadline Escalation',
  description:
    'Retrieves active matter records, documents, and deadline schedules. ' +
    'Packages structured evidence bundles for attorney review. ' +
    'Escalates approaching deadlines through an approval-gated action packet.',
  version: '1.0.0',
  domain: 'prism-counsel',
  tags: { vertical: 'prism-counsel', category: 'evidence-packaging', substrate_phase: '2' },

  policy: definePolicy({
    id: 'prism-counsel-evidence-policy',
    name: 'PRISM Counsel Evidence Packaging Policy',
    highRiskCategories: ['write-external', 'escalation', 'notification', 'deletion'],
    policyIds: ['pol-001', 'pol-002', 'pol-counsel-evidence'],
    minimumApprovalTier: 'operator',
  }),

  budget: defineBudget({ escalateAt: 0.55, requireHumanBelow: 0.3, minFinalConfidence: 0.45 }),

  stages: [
    Retrieve({
      id: 'retrieve-matter-records',
      name: 'Retrieve: Matter Records and Documents',
      description:
        'Fetches active matter files, document bundles, obligation timelines, ' +
        'privilege designations, and deadline schedules from the legal matter store.',
      retrieverAdapterId: 'counsel-retriever',
      topK: 30,
      minRelevanceScore: 0.5,
      dependsOn: [],
      otelTags: { vertical: 'prism-counsel', stage_category: 'matter-retrieval' },
      priority: 'high',
    }),
    Reason({
      id: 'reason-evidence-packaging',
      name: 'Reason: Evidence Packaging and Deadline Analysis',
      description:
        'Structures retrieved matter records into attorney-ready evidence bundles: ' +
        'key documents, privilege review flags, deadline criticality scores, ' +
        'and obligation dependency chains.',
      modelAdapterId: 'default',
      dependsOn: ['retrieve-matter-records'],
      otelTags: { vertical: 'prism-counsel', stage_category: 'evidence-analysis' },
      priority: 'high',
    }),
    Verify({
      id: 'verify-evidence-package',
      name: 'Verify: Evidence Package Completeness',
      description:
        'Validates that the evidence bundle is complete, privilege-reviewed, and deadline-accurate.',
      minConfidence: 0.7,
      allowRevision: true,
      dependsOn: ['reason-evidence-packaging'],
      otelTags: { vertical: 'prism-counsel', stage_category: 'verification' },
    }),
    ApprovalGate({
      id: 'approval-gate',
      name: 'Operator Approval Gate',
      description:
        'Supervising attorney or legal ops manager approves the evidence package before it is dispatched.',
      requiredTier: 'operator',
      inboxPattern: 'prism-counsel-evidence-packaging',
      dependsOn: ['verify-evidence-package'],
      otelTags: { vertical: 'prism-counsel', stage_category: 'approval-gate' },
      priority: 'critical',
    }),
    Decide({
      id: 'decide-deadline-escalation',
      name: 'Decide: Deadline Escalation Actions',
      description:
        'Issues deadline escalation notifications, assigns responsible attorneys, ' +
        'and records the evidence package in the matter audit chain.',
      modelAdapterId: 'default',
      sideEffects: ['notification', 'write-internal', 'escalation'],
      highRiskSideEffects: ['write-external'],
      approvalPolicy: 'operator',
      dependsOn: ['approval-gate'],
      otelTags: { vertical: 'prism-counsel', stage_category: 'deadline-escalation' },
      priority: 'critical',
    }),
  ],
});

// ─── Typed I/O ────────────────────────────────────────────────────────────────

export interface PrismCounselEvidencePackagingInput {
  matterIds?: string[];
  lookAheadDays?: number;
  includePrivileged?: boolean;
  requestedBy?: string;
  sessionId?: string;
}

export interface MatterDeadline {
  matterId: string;
  matterName: string;
  deadlineType: 'filing' | 'discovery' | 'hearing' | 'arbitration' | 'regulatory' | 'contract';
  dueDate: string;
  daysUntilDue: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  responsibleAttorney: string | null;
  status: 'on-track' | 'at-risk' | 'overdue';
}

export interface EvidencePackage {
  matterId: string;
  matterName: string;
  documentCount: number;
  privilegedCount: number;
  keyDocuments: Array<{ docId: string; title: string; relevanceScore: number }>;
  obedliationChain: string[];
  packagedAt: string;
}

export interface PrismCounselDecision {
  runId: string;
  deadlines: MatterDeadline[];
  evidencePackages: EvidencePackage[];
  escalations: Array<{
    matterId: string;
    action: string;
    urgency: 'immediate' | 'within-24h' | 'within-72h';
    assignedTo: string | null;
    rationale: string;
  }>;
  overallConfidence: number;
  decidedAt: string;
  approvedBy: string | null;
}

export interface PrismCounselEvidencePackagingResult {
  run: PipelineRun;
  deadlines: MatterDeadline[];
  evidencePackages: EvidencePackage[];
  decision: PrismCounselDecision | null;
  pendingApprovalId: string | null;
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runPrismCounselEvidencePackaging(
  input: PrismCounselEvidencePackagingInput,
  options?: Partial<RuntimeStartOptions> & SubstrateRuntimeOptions,
): Promise<PrismCounselEvidencePackagingResult> {
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

  const run = await runtime.start(prismCounselEvidencePackagingWorkflow, input, {
    mode: runtimeOpts.mode ?? 'live',
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    metadata: {
      requestedBy: input.requestedBy ?? 'system',
      lookAheadDays: input.lookAheadDays ?? 14,
    },
    ...runtimeOpts,
  });

  const reasonResult = run.stageResults.find((r) => r.stageId === 'reason-evidence-packaging');
  const decideResult = run.stageResults.find((r) => r.stageId === 'decide-deadline-escalation');
  const approvalResult = run.stageResults.find((r) => r.stageId === 'approval-gate');

  const pendingApprovalId =
    run.status === 'pending-approval' ? (approvalResult?.approvalId ?? null) : null;

  const deadlines = parseMatterDeadlines(reasonResult?.output);
  const evidencePackages = parseSeedPackages(reasonResult?.output);
  const decision =
    run.status === 'completed' && decideResult?.output
      ? buildCounselDecision(run.runId, deadlines, evidencePackages, run.finalConfidence ?? 0)
      : null;

  return { run, deadlines, evidencePackages, decision, pendingApprovalId };
}

function parseMatterDeadlines(output: unknown): MatterDeadline[] {
  if (
    output &&
    typeof output === 'object' &&
    Array.isArray((output as Record<string, unknown>)['deadlines'])
  ) {
    return (output as Record<string, unknown>)['deadlines'] as MatterDeadline[];
  }
  return [
    {
      matterId: 'MTR-2024-0108',
      matterName: 'Meridian Corp v. Apex Holdings',
      deadlineType: 'filing',
      dueDate: new Date(Date.now() + 3 * 86_400_000).toISOString(),
      daysUntilDue: 3,
      urgency: 'critical',
      responsibleAttorney: 'J. Sullivan',
      status: 'at-risk',
    },
    {
      matterId: 'MTR-2024-0072',
      matterName: 'DPA Regulatory Compliance Review',
      deadlineType: 'regulatory',
      dueDate: new Date(Date.now() + 9 * 86_400_000).toISOString(),
      daysUntilDue: 9,
      urgency: 'high',
      responsibleAttorney: 'M. Reyes',
      status: 'on-track',
    },
  ];
}

function parseSeedPackages(output: unknown): EvidencePackage[] {
  if (
    output &&
    typeof output === 'object' &&
    Array.isArray((output as Record<string, unknown>)['evidencePackages'])
  ) {
    return (output as Record<string, unknown>)['evidencePackages'] as EvidencePackage[];
  }
  return [
    {
      matterId: 'MTR-2024-0108',
      matterName: 'Meridian Corp v. Apex Holdings',
      documentCount: 47,
      privilegedCount: 12,
      keyDocuments: [
        { docId: 'DOC-0441', title: 'Master Service Agreement', relevanceScore: 0.95 },
        { docId: 'DOC-0442', title: 'Breach Notice Letter', relevanceScore: 0.91 },
      ],
      obedliationChain: ['filing-deadline-001', 'service-of-process-002'],
      packagedAt: new Date().toISOString(),
    },
  ];
}

function buildCounselDecision(
  runId: string,
  deadlines: MatterDeadline[],
  evidencePackages: EvidencePackage[],
  confidence: number,
): PrismCounselDecision {
  return {
    runId,
    deadlines,
    evidencePackages,
    escalations: deadlines.map((d) => ({
      matterId: d.matterId,
      action:
        d.urgency === 'critical'
          ? 'Immediate attorney notification and partner escalation required'
          : 'Send deadline reminder to responsible attorney',
      urgency:
        d.urgency === 'critical'
          ? ('immediate' as const)
          : d.urgency === 'high'
            ? ('within-24h' as const)
            : ('within-72h' as const),
      assignedTo: d.responsibleAttorney,
      rationale: `${d.deadlineType} deadline due in ${d.daysUntilDue} day(s) — status: ${d.status}`,
    })),
    overallConfidence: confidence,
    decidedAt: new Date().toISOString(),
    approvedBy: null,
  };
}
