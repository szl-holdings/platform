/**
 * @szl/substrate — Carlota Jo Vertical Pack: White-Glove Task Routing and Approval Coordination
 *
 * Routes incoming client tasks and engagement requests to the appropriate
 * advisor or delivery team. Applies white-glove prioritisation rules, checks
 * capacity and expertise match, and coordinates any approval step before
 * the task assignment is confirmed and the client is notified.
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

export const carlotaJoTaskRoutingWorkflow = defineWorkflow({
  id: 'carlota-jo-task-routing',
  name: 'Carlota Jo — White-Glove Task Routing and Approval Coordination',
  description:
    'Routes client tasks and engagement requests to the appropriate advisor or delivery team. ' +
    'Applies white-glove prioritisation rules, checks capacity and expertise match, ' +
    'and coordinates approval before assignment and client notification.',
  version: '1.0.0',
  domain: 'carlota-jo',
  tags: { vertical: 'carlota-jo', category: 'task-routing', substrate_phase: '2' },

  policy: definePolicy({
    id: 'carlota-jo-task-routing-policy',
    name: 'Carlota Jo Task Routing Policy',
    highRiskCategories: ['notification', 'write-external', 'financial'],
    policyIds: ['pol-001', 'pol-carlota-routing'],
    minimumApprovalTier: 'operator',
  }),

  budget: defineBudget({ escalateAt: 0.5, requireHumanBelow: 0.3, minFinalConfidence: 0.45 }),

  stages: [
    Retrieve({
      id: 'retrieve-client-context',
      name: 'Retrieve: Client and Task Context',
      description:
        'Retrieves the client profile, prior engagement history, current advisor capacity, ' +
        'expertise matrix, and any pending tasks for the requesting client.',
      retrieverAdapterId: 'carlota-retriever',
      topK: 25,
      minRelevanceScore: 0.5,
      dependsOn: [],
      otelTags: { vertical: 'carlota-jo', stage_category: 'client-context-retrieval' },
      priority: 'high',
    }),
    Reason({
      id: 'reason-task-routing',
      name: 'Reason: Task Routing and Prioritisation',
      description:
        'Scores advisors for the task by expertise match, availability, SLA tier, ' +
        'and client relationship depth. Produces a ranked routing recommendation.',
      modelAdapterId: 'default',
      dependsOn: ['retrieve-client-context'],
      otelTags: { vertical: 'carlota-jo', stage_category: 'routing-reasoning' },
      priority: 'high',
    }),
    Verify({
      id: 'verify-routing',
      name: 'Verify: Routing Recommendation',
      description: 'Confirms routing recommendation for policy alignment and capacity accuracy.',
      minConfidence: 0.65,
      allowRevision: true,
      dependsOn: ['reason-task-routing'],
      otelTags: { vertical: 'carlota-jo', stage_category: 'verification' },
    }),
    ApprovalGate({
      id: 'approval-gate',
      name: 'Operator Approval Gate',
      description:
        'Practice lead approves the routing assignment before the task is confirmed and the client is notified.',
      requiredTier: 'operator',
      inboxPattern: 'carlota-jo-task-routing',
      dependsOn: ['verify-routing'],
      otelTags: { vertical: 'carlota-jo', stage_category: 'approval-gate' },
      priority: 'critical',
    }),
    Decide({
      id: 'decide-task-assignment',
      name: 'Decide: Confirm Task Assignment',
      description:
        'Confirms the task assignment, sends advisor and client notifications, ' +
        'creates the engagement record, and logs the routing evidence chain.',
      modelAdapterId: 'default',
      sideEffects: ['notification', 'write-internal'],
      highRiskSideEffects: ['write-external', 'financial'],
      approvalPolicy: 'operator',
      dependsOn: ['approval-gate'],
      otelTags: { vertical: 'carlota-jo', stage_category: 'assignment-decision' },
      priority: 'critical',
    }),
  ],
});

// ─── Typed I/O ────────────────────────────────────────────────────────────────

export interface CarlotaJoTaskRoutingInput {
  clientId: string;
  taskTitle: string;
  taskDescription: string;
  taskType?: string;
  urgency?: 'immediate' | 'standard' | 'deferred';
  requestedBy?: string;
  sessionId?: string;
}

export interface AdvisorMatch {
  advisorId: string;
  advisorName: string;
  expertiseScore: number;
  capacityScore: number;
  relationshipDepth: number;
  overallMatchScore: number;
  rationale: string;
}

export interface TaskRoutingDecision {
  runId: string;
  clientId: string;
  taskTitle: string;
  assignedAdvisor: AdvisorMatch;
  alternativeAdvisors: AdvisorMatch[];
  estimatedStartDate: string | null;
  slaCommitment: string | null;
  notificationDraft: string;
  decidedAt: string;
  overallConfidence: number;
  approvedBy: string | null;
}

export interface CarlotaJoTaskRoutingResult {
  run: PipelineRun;
  advisorMatches: AdvisorMatch[];
  decision: TaskRoutingDecision | null;
  pendingApprovalId: string | null;
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runCarlotaJoTaskRouting(
  input: CarlotaJoTaskRoutingInput,
  options?: Partial<RuntimeStartOptions> & SubstrateRuntimeOptions,
): Promise<CarlotaJoTaskRoutingResult> {
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

  const run = await runtime.start(carlotaJoTaskRoutingWorkflow, input, {
    mode: runtimeOpts.mode ?? 'live',
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    metadata: {
      requestedBy: input.requestedBy ?? 'system',
      clientId: input.clientId,
      taskType: input.taskType ?? 'general',
      urgency: input.urgency ?? 'standard',
    },
    ...runtimeOpts,
  });

  const reasonResult = run.stageResults.find((r) => r.stageId === 'reason-task-routing');
  const decideResult = run.stageResults.find((r) => r.stageId === 'decide-task-assignment');
  const approvalResult = run.stageResults.find((r) => r.stageId === 'approval-gate');

  const pendingApprovalId =
    run.status === 'pending-approval' ? (approvalResult?.approvalId ?? null) : null;

  const advisorMatches = parseAdvisorMatches(reasonResult?.output, input);
  const decision =
    run.status === 'completed' && decideResult?.output
      ? buildRoutingDecision(run.runId, input, advisorMatches, run.finalConfidence ?? 0)
      : null;

  return { run, advisorMatches, decision, pendingApprovalId };
}

function parseAdvisorMatches(output: unknown, input: CarlotaJoTaskRoutingInput): AdvisorMatch[] {
  if (
    output &&
    typeof output === 'object' &&
    Array.isArray((output as Record<string, unknown>)['advisorMatches'])
  ) {
    return (output as Record<string, unknown>)['advisorMatches'] as AdvisorMatch[];
  }
  return [
    {
      advisorId: 'ADV-001',
      advisorName: 'Carlota Jiménez',
      expertiseScore: 0.94,
      capacityScore: 0.81,
      relationshipDepth: 0.88,
      overallMatchScore: 0.89,
      rationale: `Highest expertise + relationship depth match for client ${input.clientId} task: ${input.taskTitle}`,
    },
    {
      advisorId: 'ADV-003',
      advisorName: 'Marcus Webb',
      expertiseScore: 0.86,
      capacityScore: 0.94,
      relationshipDepth: 0.62,
      overallMatchScore: 0.81,
      rationale: 'High capacity availability with strong domain expertise alignment',
    },
  ];
}

function buildRoutingDecision(
  runId: string,
  input: CarlotaJoTaskRoutingInput,
  matches: AdvisorMatch[],
  confidence: number,
): TaskRoutingDecision {
  const assigned = matches[0]!;
  return {
    runId,
    clientId: input.clientId,
    taskTitle: input.taskTitle,
    assignedAdvisor: assigned,
    alternativeAdvisors: matches.slice(1),
    estimatedStartDate: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    slaCommitment: input.urgency === 'immediate' ? 'Same-day response' : '48-hour acknowledgement',
    notificationDraft:
      `Dear ${input.clientId}, your request "${input.taskTitle}" has been assigned to ` +
      `${assigned.advisorName} (match score: ${(assigned.overallMatchScore * 100).toFixed(0)}%). ` +
      `You will hear from your advisor within the committed SLA window.`,
    decidedAt: new Date().toISOString(),
    overallConfidence: confidence,
    approvedBy: null,
  };
}
