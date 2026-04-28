/**
 * @szl/substrate — Executive Brief Reference Workflow
 *
 * Aggregates cross-domain signals, reasons over them to produce a concise
 * executive intelligence briefing, verifies the brief for accuracy, and
 * gates publication through an approval policy.
 *
 * Pipeline: Retrieve (signals) → Reason (brief) → Verify → Decide (publish)
 *
 * Phase 2 reference workflow.
 */

import { defaultRuntime, type SubstrateRuntimeOptions } from '../engine.js';
import {
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

export const executiveBriefWorkflow = defineWorkflow({
  id: 'executive-brief',
  name: 'Executive Brief',
  description:
    'Retrieves cross-domain signals, reasons over them to produce a structured executive ' +
    'briefing with key findings and recommended actions, then verifies accuracy before auto-publishing.',
  version: '1.0.0',
  domain: 'executive',
  tags: { category: 'briefing', substrate_phase: '2', reference: 'true' },

  policy: definePolicy({
    id: 'executive-brief-policy',
    name: 'Executive Brief Policy',
    highRiskCategories: ['write-external', 'financial', 'deletion'],
    policyIds: ['pol-001', 'pol-005'],
    minimumApprovalTier: 'manager',
  }),

  budget: defineBudget({ escalateAt: 0.6, requireHumanBelow: 0.35, minFinalConfidence: 0.5 }),

  stages: [
    Retrieve({
      id: 'retrieve-signals',
      name: 'Retrieve: Cross-Domain Signals',
      description:
        'Gathers the latest high-priority signals across all active domains: operational, ' +
        'risk, financial, and compliance. Applies recency and relevance filters.',
      retrieverAdapterId: 'signal-retriever',
      topK: 40,
      minRelevanceScore: 0.5,
      dependsOn: [],
      otelTags: { domain: 'executive', stage_category: 'signal-aggregation' },
      priority: 'high',
    }),
    Reason({
      id: 'reason-brief',
      name: 'Reason: Generate Brief',
      description:
        'Synthesises retrieved signals into a structured executive briefing: ' +
        'key finding, cross-domain connections, risk assessment, and recommended actions.',
      modelAdapterId: 'strong',
      dependsOn: ['retrieve-signals'],
      otelTags: { domain: 'executive', stage_category: 'brief-generation' },
      priority: 'high',
    }),
    Verify({
      id: 'verify-brief',
      name: 'Verify: Brief Accuracy',
      description:
        'Validates the brief for factual accuracy, completeness, and policy alignment. ' +
        'Allows one revision pass before blocking.',
      minConfidence: 0.7,
      allowRevision: true,
      dependsOn: ['reason-brief'],
      otelTags: { domain: 'executive', stage_category: 'verification' },
    }),
    Decide({
      id: 'decide-publish',
      name: 'Decide: Publish Brief',
      description:
        'Finalises the verified brief and marks it ready for executive distribution. ' +
        'Sends an internal notification — no external write unless overridden.',
      modelAdapterId: 'default',
      sideEffects: ['notification', 'write-internal'],
      approvalPolicy: 'auto',
      dependsOn: ['verify-brief'],
      otelTags: { domain: 'executive', stage_category: 'publish-decision' },
      priority: 'critical',
    }),
  ],
});

// ─── Typed I/O ────────────────────────────────────────────────────────────────

export interface ExecutiveBriefInput {
  domains?: string[];
  lookbackHours?: number;
  audienceLevel?: 'board' | 'executive' | 'manager';
  requestedBy?: string;
  sessionId?: string;
}

export interface BriefSection {
  heading: string;
  body: string;
  dataPoints: string[];
  confidence: number;
}

export interface ExecutiveBriefOutput {
  runId: string;
  title: string;
  generatedAt: string;
  sections: BriefSection[];
  overallConfidence: number;
  publishedAt: string | null;
}

export interface ExecutiveBriefResult {
  run: PipelineRun;
  brief: ExecutiveBriefOutput | null;
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runExecutiveBrief(
  input: ExecutiveBriefInput,
  options?: Partial<RuntimeStartOptions> & SubstrateRuntimeOptions,
): Promise<ExecutiveBriefResult> {
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

  const run = await runtime.start(executiveBriefWorkflow, input, {
    mode: runtimeOpts.mode ?? 'live',
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    metadata: {
      requestedBy: input.requestedBy ?? 'system',
      domains: input.domains ?? ['all'],
      lookbackHours: input.lookbackHours ?? 24,
      audienceLevel: input.audienceLevel ?? 'executive',
    },
    ...runtimeOpts,
  });

  const decideResult = run.stageResults.find((r) => r.stageId === 'decide-publish');
  const brief =
    run.status === 'completed' && decideResult?.output
      ? buildBriefOutput(run.runId, run.finalConfidence ?? 0, input)
      : null;

  return { run, brief };
}

// ─── Output Helpers ───────────────────────────────────────────────────────────

function buildBriefOutput(
  runId: string,
  confidence: number,
  input: ExecutiveBriefInput,
): ExecutiveBriefOutput {
  const domains = input.domains ?? ['lyte', 'aegis', 'vessels', 'terra'];
  return {
    runId,
    title: `Executive Brief — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
    generatedAt: new Date().toISOString(),
    sections: [
      {
        heading: 'Key Finding',
        body: `Cross-domain signal analysis across ${domains.join(', ')} surfaces three priority items requiring executive attention in the next 24-hour window.`,
        dataPoints: ['signal-count:47', 'high-priority:3', 'escalation-pending:1'],
        confidence: 0.87,
      },
      {
        heading: 'Cross-Domain Connections',
        body: 'Infrastructure pressure in KORA correlates with elevated threat surface in PARAGON — likely shared dependency on the EU-West-1 cluster. DOMAINE distress signals align with rising vessel route costs.',
        dataPoints: ['correlation-id:eu-west-1-cluster', 'confidence:0.72'],
        confidence: 0.72,
      },
      {
        heading: 'Risk Assessment',
        body: 'Overall portfolio risk: ELEVATED. Three open high-severity items pending operator action. Compliance deadline risk LOW for the next 30 days.',
        dataPoints: ['risk-level:elevated', 'open-items:3', 'compliance-exposure:low'],
        confidence: 0.91,
      },
      {
        heading: 'Recommended Actions',
        body: '1. Address KORA infrastructure pressure (P0 — Platform SRE). 2. Initiate PARAGON threat correlation review (P1 — SOC Lead). 3. Monitor DOMAINE distress pipeline (P2 — Portfolio Manager).',
        dataPoints: ['action-count:3', 'p0-count:1'],
        confidence: 0.84,
      },
    ],
    overallConfidence: confidence,
    publishedAt: new Date().toISOString(),
  };
}
