/**
 * @szl/substrate — Policy-Shaped Graph Compiler
 *
 * Takes a WorkflowDefinition (stage list + policy profile) and produces a
 * verified CompiledGraph. Rejects at compile time any workflow where a
 * high-risk side-effect can be reached without traversing a matching
 * ApprovalGate in the ancestor chain.
 *
 * This is enforced by topology, not runtime checks. A non-compliant path is
 * unreachable because the compiler refuses to produce a graph for it.
 */

import type {
  AnyStage,
  CompiledGraph,
  CompiledStageNode,
  PolicyProfile,
  SideEffectCategory,
  WorkflowDefinition,
} from './types.js';

export class SubstrateCompilerError extends Error {
  constructor(
    message: string,
    public readonly violations: string[],
  ) {
    super(`[SubstrateCompiler] ${message}\n${violations.map((v) => `  • ${v}`).join('\n')}`);
    this.name = 'SubstrateCompilerError';
  }
}

// ─── Topological Sort (Kahn's Algorithm) ─────────────────────────────────────

function topoSort(stages: AnyStage[]): string[] {
  const stageIds = new Set(stages.map((s) => s.id));
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const stage of stages) {
    inDegree.set(stage.id, 0);
    adj.set(stage.id, []);
  }

  for (const stage of stages) {
    for (const dep of stage.dependsOn) {
      if (!stageIds.has(dep)) {
        throw new SubstrateCompilerError(`Stage '${stage.id}' depends on unknown stage '${dep}'`, [
          `Undeclared dependency: '${stage.id}' → '${dep}'`,
        ]);
      }
      adj.get(dep)!.push(stage.id);
      inDegree.set(stage.id, (inDegree.get(stage.id) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    sorted.push(id);
    for (const next of adj.get(id) ?? []) {
      inDegree.set(next, (inDegree.get(next) ?? 0) - 1);
      if (inDegree.get(next) === 0) queue.push(next);
    }
  }

  if (sorted.length !== stages.length) {
    throw new SubstrateCompilerError('Workflow graph contains a cycle', [
      'Cycle detected in stage dependency graph — substrate does not support cyclic workflows',
    ]);
  }

  return sorted;
}

// ─── Ancestor/Descendant Computation ─────────────────────────────────────────

function computeAncestors(stageId: string, stageMap: Map<string, AnyStage>): Set<string> {
  const visited = new Set<string>();
  const stack = [...(stageMap.get(stageId)?.dependsOn ?? [])];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const dep of stageMap.get(id)?.dependsOn ?? []) {
      if (!visited.has(dep)) stack.push(dep);
    }
  }
  return visited;
}

function computeDescendants(stageId: string, stageMap: Map<string, AnyStage>): Set<string> {
  const reverseAdj = new Map<string, string[]>();
  for (const stage of stageMap.values()) {
    for (const dep of stage.dependsOn) {
      if (!reverseAdj.has(dep)) reverseAdj.set(dep, []);
      reverseAdj.get(dep)!.push(stage.id);
    }
  }

  const visited = new Set<string>();
  const stack = [...(reverseAdj.get(stageId) ?? [])];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const child of reverseAdj.get(id) ?? []) {
      if (!visited.has(child)) stack.push(child);
    }
  }
  return visited;
}

// ─── Approval Gate Reachability ───────────────────────────────────────────────

/**
 * Returns true if there exists an ApprovalGate in the set of ancestors
 * whose requiredTier satisfies the policy's minimumApprovalTier.
 */
function hasApprovalGateAncestor(
  ancestors: Set<string>,
  stageMap: Map<string, AnyStage>,
  policy: PolicyProfile,
): boolean {
  const tierOrder: Record<string, number> = {
    operator: 0,
    manager: 1,
    executive: 2,
    board: 3,
  };
  const requiredTierNum = tierOrder[policy.minimumApprovalTier] ?? 0;

  for (const ancestorId of ancestors) {
    const ancestor = stageMap.get(ancestorId);
    if (ancestor?.type === 'ApprovalGate') {
      const gateTierNum =
        tierOrder[(ancestor as { requiredTier?: string }).requiredTier ?? 'operator'] ?? 0;
      if (gateTierNum >= requiredTierNum) return true;
    }
  }
  return false;
}

// ─── High-Risk Side Effect Check ─────────────────────────────────────────────

function stageHasHighRiskSideEffect(stage: AnyStage, policy: PolicyProfile): boolean {
  let sideEffects: SideEffectCategory[] = [];

  if (stage.type === 'ToolCall') {
    sideEffects = stage.sideEffects;
  } else if (stage.type === 'Decide') {
    // DecideStage declares high-risk side effects in BOTH sideEffects (general) and
    // highRiskSideEffects (governance-explicit). The union must be checked; a workflow
    // author who populates only highRiskSideEffects must not silently bypass gate
    // enforcement.
    sideEffects = [...stage.sideEffects, ...stage.highRiskSideEffects];
  }

  return sideEffects.some((se) => policy.highRiskCategories.includes(se));
}

// ─── Compiler ─────────────────────────────────────────────────────────────────

/**
 * Compile a WorkflowDefinition into a verified CompiledGraph.
 *
 * Throws SubstrateCompilerError if:
 * - The stage dependency graph contains a cycle.
 * - A stage references an unknown dependency.
 * - A Decide or ToolCall stage with a high-risk side effect is not preceded
 *   by a reachable ApprovalGate matching the policy's minimumApprovalTier.
 */
export function compile(workflow: WorkflowDefinition): CompiledGraph {
  const { stages, policy } = workflow;

  if (stages.length === 0) {
    throw new SubstrateCompilerError('Workflow must have at least one stage', [
      'Empty stage list is not allowed',
    ]);
  }

  const stageMap = new Map<string, AnyStage>(stages.map((s) => [s.id, s]));

  // 1. Check for duplicate stage IDs
  if (stageMap.size !== stages.length) {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const s of stages) {
      if (seen.has(s.id)) duplicates.push(s.id);
      seen.add(s.id);
    }
    throw new SubstrateCompilerError(
      'Duplicate stage IDs detected',
      duplicates.map((d) => `Duplicate ID: '${d}'`),
    );
  }

  // 2. Topological sort (also validates deps and detects cycles)
  const executionOrder = topoSort(stages);

  // 3. Build node metadata
  const nodes = new Map<string, CompiledStageNode>();
  for (const stage of stages) {
    const ancestors = computeAncestors(stage.id, stageMap);
    const descendants = computeDescendants(stage.id, stageMap);
    const depth =
      ancestors.size === 0
        ? 0
        : Math.max(...[...ancestors].map((a) => nodes.get(a)?.depth ?? 0)) + 1;
    const hasApprovalGate = hasApprovalGateAncestor(ancestors, stageMap, policy);

    nodes.set(stage.id, {
      stage,
      depth,
      ancestors,
      descendants,
      hasApprovalGateAncestor: hasApprovalGate,
    });
  }

  // 4. Policy violation check — the PRIMARY control
  const violations: string[] = [];
  const warnings: string[] = [];

  for (const stage of stages) {
    if (!stageHasHighRiskSideEffect(stage, policy)) continue;

    const node = nodes.get(stage.id)!;

    if (!node.hasApprovalGateAncestor) {
      const allEffects: string[] = [
        ...((stage as { sideEffects?: SideEffectCategory[] }).sideEffects ?? []),
        ...((stage as { highRiskSideEffects?: SideEffectCategory[] }).highRiskSideEffects ?? []),
      ];
      violations.push(
        `Stage '${stage.id}' (${stage.type}) has high-risk side effects ` +
          `[${[...new Set(allEffects)].join(', ')}] ` +
          `but no matching ApprovalGate (tier ≥ '${policy.minimumApprovalTier}') is reachable in its ancestor chain. ` +
          `Add an ApprovalGate before '${stage.id}' in the stage dependency chain.`,
      );
    }
  }

  if (violations.length > 0) {
    throw new SubstrateCompilerError(
      `Policy '${policy.id}' compliance failure in workflow '${workflow.id}'`,
      violations,
    );
  }

  // 5. Warnings (non-fatal policy observations)
  const decideStages = stages.filter((s) => s.type === 'Decide');
  if (decideStages.length === 0) {
    warnings.push(
      'Workflow has no Decide stage — consider adding one if this workflow produces decisions',
    );
  }
  const verifyStages = stages.filter((s) => s.type === 'Verify');
  if (verifyStages.length === 0) {
    warnings.push('Workflow has no Verify stage — output quality is unverified');
  }

  return {
    workflowId: workflow.id,
    workflowName: workflow.name,
    policyProfileId: policy.id,
    nodes,
    executionOrder,
    compiledAt: new Date().toISOString(),
    warnings,
  };
}
