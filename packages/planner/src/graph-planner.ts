/**
 * Graph Planner — DAG plan synthesis (GraphPlanner-inspired, re-expressed for SZL).
 *
 * The classic linear planner in this package chains steps end-to-end. The
 * graph planner reasons over a DAG of typed actions and detects:
 *   - cycles (rejected)
 *   - unmet preconditions (rejected, with the unreachable set surfaced)
 *   - parallelisable branches (returned as an explicit parallel set)
 *   - the critical path (longest-cost path through the DAG)
 *
 * Pure-ts, no I/O. Receipts and persistence are layered above by the
 * caller (see `artifacts/api-server/src/routes/rosie-reasoning.ts`).
 */

export type StateFact = string;

export interface ActionNode {
  /** stable id; the planner uses this as the DAG node key */
  id: string;
  /** short human label */
  title: string;
  /** what the action requires before it can run */
  preconditions: StateFact[];
  /** what becomes true after the action runs */
  effects: StateFact[];
  /** abstract actor (human, drone, model, …) — informational */
  actor?: string;
  /** monotonic cost weight used for critical-path scoring */
  cost?: number;
}

export interface PlanDag {
  planId: string;
  goal: StateFact[];
  initialState: StateFact[];
  /** nodes that were selected to satisfy the goal */
  nodes: ActionNode[];
  /** dependency edges: `from` must complete before `to` */
  edges: Array<{ from: string; to: string }>;
  /** topological order — used by executors */
  executionOrder: string[];
  /** longest-cost path through the DAG (sequential bottleneck) */
  criticalPath: string[];
  /** sets of nodes that can run in parallel (each set is a topological "rank") */
  parallelBranches: string[][];
  /** preconditions never satisfied by any chosen action (empty in a valid plan) */
  unmetPreconditions: StateFact[];
  /** total cost along the critical path */
  totalCost: number;
}

export class UnreachablePreconditionError extends Error {
  constructor(
    public readonly missing: StateFact[],
    public readonly goal: StateFact[],
  ) {
    super(
      `Plan rejected: preconditions never satisfied: [${missing.join(', ')}] for goal [${goal.join(', ')}]`,
    );
    this.name = 'UnreachablePreconditionError';
  }
}

export class PlanCycleError extends Error {
  constructor(public readonly cycle: string[]) {
    super(`Plan rejected: cycle detected: ${cycle.join(' → ')}`);
    this.name = 'PlanCycleError';
  }
}

export interface PlanDagInput {
  planId?: string;
  goal: StateFact[];
  initialState: StateFact[];
  actions: ActionNode[];
}

/**
 * Backward-chain from goal facts to a set of actions whose effects cover
 * the goal, then forward-walk to compute dependency edges via fact production.
 */
export function planDag(input: PlanDagInput): PlanDag {
  const planId =
    input.planId ?? `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const facts = new Set<StateFact>(input.initialState);

  // 1. Backward search — DFS over alternate producers of each open fact,
  //    with memoization on the chosen-set signature so a poor first choice
  //    (e.g. an action whose preconditions are unreachable) can be undone
  //    in favour of an alternate producer for the same goal fact. Returns
  //    the lowest-total-cost reachable plan, or `null` if none exists.
  //
  //    A pure greedy pass over remaining facts cannot do this — it commits
  //    to the first producer it picks for a goal fact and never revisits.
  const initialFactSet = new Set<StateFact>(input.initialState);
  const initialRemaining = input.goal.filter((f) => !initialFactSet.has(f));
  // Pre-index producers per fact for O(1) lookup during the search.
  const producersOf = new Map<StateFact, ActionNode[]>();
  for (const a of input.actions) {
    for (const e of a.effects) {
      const arr = producersOf.get(e) ?? [];
      arr.push(a);
      producersOf.set(e, arr);
    }
  }
  const actionIndex = new Map<string, number>();
  input.actions.forEach((a, i) => actionIndex.set(a.id, i));
  const sigOf = (set: Set<string>) =>
    [...set].map((id) => actionIndex.get(id)!).sort((x, y) => x - y).join(',');
  const visited = new Set<string>();
  // Track the best (lowest-cost) plan and the deepest unreachable witness
  // for a useful error message when no plan exists.
  let bestChosen: Map<string, ActionNode> | null = null;
  let bestCost = Infinity;
  let bestUnreachable: StateFact[] = [];

  const SEARCH_BUDGET = Math.max(2048, input.actions.length * input.actions.length * 16);
  let steps = 0;

  function search(chosen: Map<string, ActionNode>, remaining: StateFact[]): void {
    if (steps++ > SEARCH_BUDGET) return;
    // Filter out facts already produced by the current chosen set (a later
    // choice may have produced an earlier-open fact for free).
    const produced = new Set<StateFact>(initialFactSet);
    for (const a of chosen.values()) a.effects.forEach((e) => produced.add(e));
    const open = remaining.filter((f) => !produced.has(f));
    if (open.length === 0) {
      let total = 0;
      for (const a of chosen.values()) total += a.cost ?? 1;
      if (total < bestCost) {
        bestCost = total;
        bestChosen = new Map(chosen);
      }
      return;
    }
    // Pick the fact with the fewest producers first (fail-fast heuristic).
    let target = open[0];
    let fewest = Infinity;
    for (const f of open) {
      const n = producersOf.get(f)?.length ?? 0;
      if (n < fewest) {
        fewest = n;
        target = f;
      }
    }
    const producers = producersOf.get(target) ?? [];
    if (producers.length === 0) {
      // Dead-end branch — remember the witness for the eventual error.
      if (bestUnreachable.length === 0) bestUnreachable = [target];
      return;
    }
    // Order producers by cost so we discover a cheap plan early and
    // can prune higher-cost branches against bestCost.
    const ordered = [...producers].sort((a, b) => (a.cost ?? 1) - (b.cost ?? 1));
    for (const producer of ordered) {
      if (chosen.has(producer.id)) continue;
      chosen.set(producer.id, producer);
      const sig = sigOf(new Set(chosen.keys()));
      if (!visited.has(sig)) {
        visited.add(sig);
        // Lower bound: current cost + just-added cost (admissible since
        // every additional action has cost ≥ 0). If already ≥ bestCost,
        // prune this branch.
        let lower = 0;
        for (const a of chosen.values()) lower += a.cost ?? 1;
        if (lower < bestCost) {
          const nextRemaining = open.filter((f) => f !== target);
          for (const p of producer.preconditions) {
            if (!produced.has(p) && !producer.effects.includes(p) && !nextRemaining.includes(p)) {
              nextRemaining.push(p);
            }
          }
          search(chosen, nextRemaining);
        }
      }
      chosen.delete(producer.id);
    }
  }

  search(new Map(), initialRemaining);

  if (!bestChosen) {
    // No reachable plan — surface a useful unmet-precondition witness.
    const witness = bestUnreachable.length > 0 ? bestUnreachable : initialRemaining;
    throw new UnreachablePreconditionError(witness, input.goal);
  }
  const chosen: Map<string, ActionNode> = bestChosen;
  for (const a of chosen.values()) a.effects.forEach((e) => facts.add(e));

  // 3. Build edges: for each chosen action's preconditions, draw an edge
  //    from each producer of that fact.
  const factProducers = new Map<StateFact, string[]>();
  for (const a of chosen.values()) {
    for (const e of a.effects) {
      const arr = factProducers.get(e) ?? [];
      arr.push(a.id);
      factProducers.set(e, arr);
    }
  }
  const edges: Array<{ from: string; to: string }> = [];
  const adj = new Map<string, Set<string>>();
  const indeg = new Map<string, number>();
  for (const id of chosen.keys()) {
    adj.set(id, new Set());
    indeg.set(id, 0);
  }
  for (const a of chosen.values()) {
    for (const p of a.preconditions) {
      if (input.initialState.includes(p)) continue;
      const producers = factProducers.get(p) ?? [];
      for (const prodId of producers) {
        if (prodId === a.id) continue;
        if (!adj.get(prodId)!.has(a.id)) {
          adj.get(prodId)!.add(a.id);
          indeg.set(a.id, (indeg.get(a.id) ?? 0) + 1);
          edges.push({ from: prodId, to: a.id });
        }
      }
    }
  }

  // 4. Cycle detection + topological order via Kahn.
  const order: string[] = [];
  const ranks: string[][] = [];
  const queue: string[] = [];
  for (const [id, d] of indeg) if (d === 0) queue.push(id);
  while (queue.length) {
    const rank: string[] = queue.slice();
    ranks.push(rank);
    const next: string[] = [];
    for (const id of queue) {
      order.push(id);
      for (const dst of adj.get(id) ?? []) {
        const d = (indeg.get(dst) ?? 0) - 1;
        indeg.set(dst, d);
        if (d === 0) next.push(dst);
      }
    }
    queue.length = 0;
    queue.push(...next);
  }
  if (order.length < chosen.size) {
    // there is a cycle — recover a witness for the error
    const visited = new Set(order);
    const cycle = [...chosen.keys()].filter((id) => !visited.has(id));
    throw new PlanCycleError(cycle);
  }

  // 5. Critical path via longest-path on the DAG (cost-weighted).
  const cost = (id: string) => chosen.get(id)?.cost ?? 1;
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  for (const id of order) {
    dist.set(id, cost(id));
    prev.set(id, null);
  }
  for (const id of order) {
    for (const dst of adj.get(id) ?? []) {
      const cand = (dist.get(id) ?? 0) + cost(dst);
      if (cand > (dist.get(dst) ?? 0)) {
        dist.set(dst, cand);
        prev.set(dst, id);
      }
    }
  }
  let tail: string | null = null;
  let tailDist = -1;
  for (const [id, d] of dist) {
    if (d > tailDist) {
      tailDist = d;
      tail = id;
    }
  }
  const criticalPath: string[] = [];
  while (tail) {
    criticalPath.unshift(tail);
    tail = prev.get(tail) ?? null;
  }

  return {
    planId,
    goal: input.goal,
    initialState: input.initialState,
    nodes: [...chosen.values()],
    edges,
    executionOrder: order,
    criticalPath,
    parallelBranches: ranks.filter((r) => r.length > 1),
    unmetPreconditions: [],
    totalCost: tailDist > 0 ? tailDist : 0,
  };
}
