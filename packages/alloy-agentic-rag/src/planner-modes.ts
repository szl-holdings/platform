/**
 * Dual Planner Mode implementation for the Alloy Agentic RAG Aggregator.
 *
 * - `react`:          ReAct-style interleaved Thought → Tool → Observation loop.
 * - `cot-decompose`:  Chain-of-Thought decomposition: plan-then-execute.
 *
 * Both modes:
 *  1. Call @workspace/planner.createPlan to build a governed PlanGraph with
 *     full risk estimation, model routing, and fallback generation.
 *  2. Adapt the result to AgenticPlanGraph so downstream code has a single
 *     branch-free interface regardless of mode.
 *
 * The sync `buildPlan` is retained for tests; production code should call
 * `buildPlanAsync` which invokes the real planner.
 */
import type { AgenticPlanGraph, AgenticPlanStep, PlannerMode } from '@szl-holdings/contracts/agentic-rag';
import { createPlan } from '@workspace/planner';
import { randomUUID } from 'node:crypto';

export interface PlannerInput {
  query: string;
  specialists: string[];
  sessionId?: string;
  domain?: string;
}

export interface PlannerOutput {
  plan: AgenticPlanGraph;
  thoughts: string[];
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

function mapRiskLevel(level?: string): AgenticPlanStep['riskLevel'] {
  if (level === 'high' || level === 'critical') return 'high';
  if (level === 'medium') return 'medium';
  return 'low';
}

/**
 * Adapt a @workspace/planner PlanGraph to the AgenticPlanGraph schema.
 * Overlays specialist metadata for agentic RAG steps.
 */
function adaptPlannerOutput(
  plannerGraph: Awaited<ReturnType<typeof createPlan>>,
  input: PlannerInput,
  mode: PlannerMode,
): AgenticPlanGraph {
  const now = new Date().toISOString();

  // Map planner steps to agentic steps, injecting specialist assignments
  const specialistAssignments = new Map<number, string>();
  const actPhaseCount = plannerGraph.steps.filter(
    (s) => (s.metadata?.['phase'] ?? '') === 'act' || (s.metadata?.['phase'] ?? '') === 'Act',
  ).length;
  if (actPhaseCount === 0) {
    // For each "Act" position in specialist list, record specialist
    plannerGraph.steps.forEach((s, i) => {
      const specialist = input.specialists[i - 1];
      if (specialist && String(s.metadata?.['phase'] ?? '').toLowerCase().includes('act')) {
        specialistAssignments.set(i, specialist);
      }
    });
  }

  const steps: AgenticPlanStep[] = plannerGraph.steps.map((s, idx) => {
    const specialist = input.specialists[idx] ?? undefined;
    return {
      stepId: s.stepId,
      title: s.title,
      description: s.description,
      specialistAgent: specialist,
      dependencies: s.dependsOn ?? [],
      estimatedCostUsd: s.route?.estimatedCostUsd ?? 0.001,
      riskLevel: mapRiskLevel(s.riskLevel),
      metadata: {
        ...(s.metadata ?? {}),
        phase: s.metadata?.['phase'] ?? 'execute',
        routeClass: s.route?.routeClass,
        model: s.route?.model,
      },
    };
  });

  const executionOrder = plannerGraph.executionOrder.length > 0
    ? plannerGraph.executionOrder
    : steps.map((s) => s.stepId);

  return {
    planId: plannerGraph.planId,
    objective: input.query,
    plannerMode: mode,
    steps,
    executionOrder,
    estimatedCostUsd: steps.reduce((sum, s) => sum + s.estimatedCostUsd, 0),
    confidence: 0.8,
    createdAt: now,
  };
}

// ─── Async implementation — uses @workspace/planner ───────────────────────────

/**
 * Build an AgenticPlanGraph by delegating to @workspace/planner.createPlan.
 * The planner performs: objective decomposition → step routing →
 * risk estimation → topological sort → fallback plan generation.
 * The resulting PlanGraph is then adapted to AgenticPlanGraph format.
 */
export async function buildPlanAsync(
  mode: PlannerMode,
  input: PlannerInput,
): Promise<PlannerOutput> {
  const thoughts: string[] = [];

  thoughts.push(
    `[${mode === 'react' ? 'ReAct' : 'CoT'}] Decomposing query via @workspace/planner: "${input.query.slice(0, 120)}"`,
  );

  // Compose the real @workspace/planner.createPlan call.
  // context.seeds = [] means the planner uses heuristic decomposition.
  const plannerGraph = await createPlan(
    `Agentic RAG (${mode}): ${input.query}`,
    {
      sessionId: input.sessionId,
      seeds: [],
    },
    {
      persist: false, // no DB write needed; trace-graph handles persistence
    },
  );

  thoughts.push(
    `[${mode === 'react' ? 'ReAct' : 'CoT'}] Planner produced ${plannerGraph.steps.length} steps; adapting to AgenticPlanGraph`,
  );

  // Adapt planner output to AgenticPlanGraph, then overlay mode-specific structure
  const adapted = adaptPlannerOutput(plannerGraph, input, mode);

  // Overlay mode-specific specialist fan-out structure on top of planner graph
  const agenticPlan = overlayModeStructure(adapted, input, mode);

  return { plan: agenticPlan, thoughts };
}

/**
 * Overlay mode-specific agentic RAG structure (specialist steps, merge, generate)
 * on top of the adapted planner graph. Ensures the plan always has the correct
 * phases regardless of how the planner decomposed the objective.
 */
function overlayModeStructure(
  plannerPlan: AgenticPlanGraph,
  input: PlannerInput,
  mode: PlannerMode,
): AgenticPlanGraph {
  const now = plannerPlan.createdAt;
  const steps: AgenticPlanStep[] = [];
  const thoughts: string[] = [];

  if (mode === 'react') {
    // ReAct: think → act (specialist per step) → observe → generate
    const thinkStepId = randomUUID();
    steps.push({
      stepId: thinkStepId,
      title: 'Think: analyse query intent and memory context',
      description: `Read short-term and long-term memory for context relevant to: ${input.query}`,
      dependencies: [],
      estimatedCostUsd: 0.001,
      riskLevel: 'low',
      metadata: { phase: 'think', plannerBasis: plannerPlan.planId },
    });

    const specialistStepIds: string[] = [];
    for (const specialist of input.specialists) {
      const stepId = randomUUID();
      specialistStepIds.push(stepId);
      steps.push({
        stepId,
        title: `Act: ${specialist} — retrieve evidence`,
        description: `Fan-out to ${specialist} agent via its MCP server class`,
        specialistAgent: specialist,
        dependencies: [thinkStepId],
        estimatedCostUsd: 0.002,
        riskLevel: 'low',
        metadata: { phase: 'act', specialist, plannerBasis: plannerPlan.planId },
      });
    }

    const observeStepId = randomUUID();
    steps.push({
      stepId: observeStepId,
      title: 'Observe: merge and rerank evidence from all specialists',
      description: 'Apply Reciprocal Rank Fusion then cross-encoder reranking',
      dependencies: specialistStepIds,
      estimatedCostUsd: 0.001,
      riskLevel: 'low',
      metadata: { phase: 'observe', plannerBasis: plannerPlan.planId },
    });

    const generateStepId = randomUUID();
    steps.push({
      stepId: generateStepId,
      title: 'Generate: synthesise answer via AI Control Plane',
      description: 'Route merged evidence context to ModelRouter for final answer generation',
      dependencies: [observeStepId],
      estimatedCostUsd: plannerPlan.estimatedCostUsd,
      riskLevel: 'low',
      metadata: { phase: 'generate', plannerBasis: plannerPlan.planId },
    });

    return {
      planId: plannerPlan.planId,
      objective: input.query,
      plannerMode: 'react',
      steps,
      executionOrder: [thinkStepId, ...specialistStepIds, observeStepId, generateStepId],
      estimatedCostUsd: steps.reduce((s, st) => s + st.estimatedCostUsd, 0),
      confidence: 0.8,
      createdAt: now,
    };
  }

  // CoT-decompose: decompose → execute (parallel per specialist) → merge → generate
  const decomposeStepId = randomUUID();
  steps.push({
    stepId: decomposeStepId,
    title: 'Decompose: break query into specialist sub-tasks',
    description: `CoT decomposition of the query into ${input.specialists.length} parallel retrieval tasks`,
    dependencies: [],
    estimatedCostUsd: 0.002,
    riskLevel: 'low',
    metadata: { phase: 'decompose', plannerBasis: plannerPlan.planId },
  });

  const specialistStepIds: string[] = [];
  for (const specialist of input.specialists) {
    const stepId = randomUUID();
    specialistStepIds.push(stepId);
    steps.push({
      stepId,
      title: `Execute: ${specialist}`,
      description: `Parallel specialist execution — ${specialist} retrieves evidence via its MCP class`,
      specialistAgent: specialist,
      dependencies: [decomposeStepId],
      estimatedCostUsd: 0.002,
      riskLevel: 'low',
      metadata: { phase: 'execute', specialist, parallel: true, plannerBasis: plannerPlan.planId },
    });
  }

  const mergeStepId = randomUUID();
  steps.push({
    stepId: mergeStepId,
    title: 'Merge: aggregate and rerank all specialist evidence',
    description: 'Reciprocal Rank Fusion + cross-encoder reranking',
    dependencies: specialistStepIds,
    estimatedCostUsd: 0.001,
    riskLevel: 'low',
    metadata: { phase: 'merge', plannerBasis: plannerPlan.planId },
  });

  const generateStepId = randomUUID();
  steps.push({
    stepId: generateStepId,
    title: 'Generate: final answer via AI Control Plane',
    description: 'Route fused evidence to ModelRouter (GPT / Claude / Gemini with fallback)',
    dependencies: [mergeStepId],
    estimatedCostUsd: plannerPlan.estimatedCostUsd,
    riskLevel: 'low',
    metadata: { phase: 'generate', plannerBasis: plannerPlan.planId },
  });

  return {
    planId: plannerPlan.planId,
    objective: input.query,
    plannerMode: 'cot-decompose',
    steps,
    executionOrder: [decomposeStepId, ...specialistStepIds, mergeStepId, generateStepId],
    estimatedCostUsd: steps.reduce((s, st) => s + st.estimatedCostUsd, 0),
    confidence: 0.85,
    createdAt: now,
  };
}

// ─── Sync implementation — used by tests ──────────────────────────────────────

/**
 * Synchronous plan builder for unit tests.
 * Production code must call buildPlanAsync.
 */
export function buildPlan(mode: PlannerMode, input: PlannerInput): PlannerOutput {
  const now = new Date().toISOString();
  const planId = randomUUID();
  const thoughts: string[] = [
    mode === 'react'
      ? `[ReAct] Building sync plan for: "${input.query.slice(0, 80)}"`
      : `[CoT] Building sync plan for: "${input.query.slice(0, 80)}"`,
  ];

  if (mode === 'react') {
    const thinkStepId = randomUUID();
    const specialistStepIds = input.specialists.map(() => randomUUID());
    const observeStepId = randomUUID();
    const generateStepId = randomUUID();

    const steps: AgenticPlanStep[] = [
      {
        stepId: thinkStepId,
        title: 'Think: analyse query intent and memory context',
        description: `Read short-term and long-term memory for: ${input.query}`,
        dependencies: [],
        estimatedCostUsd: 0.001,
        riskLevel: 'low',
        metadata: { phase: 'think' },
      },
      ...input.specialists.map((specialist, i) => ({
        stepId: specialistStepIds[i]!,
        title: `Act: ${specialist} — retrieve evidence`,
        description: `Fan-out to ${specialist} agent via its MCP server class`,
        specialistAgent: specialist,
        dependencies: [thinkStepId],
        estimatedCostUsd: 0.002,
        riskLevel: 'low' as const,
        metadata: { phase: 'act', specialist },
      })),
      {
        stepId: observeStepId,
        title: 'Observe: merge and rerank evidence',
        description: 'RRF + cross-encoder reranking',
        dependencies: specialistStepIds,
        estimatedCostUsd: 0.001,
        riskLevel: 'low' as const,
        metadata: { phase: 'observe' },
      },
      {
        stepId: generateStepId,
        title: 'Generate: synthesise answer via AI Control Plane',
        description: 'Final answer generation',
        dependencies: [observeStepId],
        estimatedCostUsd: 0.01,
        riskLevel: 'low' as const,
        metadata: { phase: 'generate' },
      },
    ];

    const plan: AgenticPlanGraph = {
      planId,
      objective: input.query,
      plannerMode: 'react',
      steps,
      executionOrder: [thinkStepId, ...specialistStepIds, observeStepId, generateStepId],
      estimatedCostUsd: steps.reduce((s, st) => s + st.estimatedCostUsd, 0),
      confidence: 0.8,
      createdAt: now,
    };
    return { plan, thoughts };
  }

  // cot-decompose
  const decomposeStepId = randomUUID();
  const specialistStepIds = input.specialists.map(() => randomUUID());
  const mergeStepId = randomUUID();
  const generateStepId = randomUUID();

  const steps: AgenticPlanStep[] = [
    {
      stepId: decomposeStepId,
      title: 'Decompose: break query into specialist sub-tasks',
      description: `CoT decomposition into ${input.specialists.length} tasks`,
      dependencies: [],
      estimatedCostUsd: 0.002,
      riskLevel: 'low',
      metadata: { phase: 'decompose' },
    },
    ...input.specialists.map((specialist, i) => ({
      stepId: specialistStepIds[i]!,
      title: `Execute: ${specialist}`,
      description: `Parallel specialist execution — ${specialist}`,
      specialistAgent: specialist,
      dependencies: [decomposeStepId],
      estimatedCostUsd: 0.002,
      riskLevel: 'low' as const,
      metadata: { phase: 'execute', specialist, parallel: true },
    })),
    {
      stepId: mergeStepId,
      title: 'Merge: aggregate and rerank evidence',
      description: 'RRF + cross-encoder',
      dependencies: specialistStepIds,
      estimatedCostUsd: 0.001,
      riskLevel: 'low' as const,
      metadata: { phase: 'merge' },
    },
    {
      stepId: generateStepId,
      title: 'Generate: final answer via AI Control Plane',
      description: 'Answer generation',
      dependencies: [mergeStepId],
      estimatedCostUsd: 0.01,
      riskLevel: 'low' as const,
      metadata: { phase: 'generate' },
    },
  ];

  const plan: AgenticPlanGraph = {
    planId,
    objective: input.query,
    plannerMode: 'cot-decompose',
    steps,
    executionOrder: [decomposeStepId, ...specialistStepIds, mergeStepId, generateStepId],
    estimatedCostUsd: steps.reduce((s, st) => s + st.estimatedCostUsd, 0),
    confidence: 0.85,
    createdAt: now,
  };
  return { plan, thoughts };
}
