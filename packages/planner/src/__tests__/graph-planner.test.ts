import { describe, expect, it } from 'vitest';
import { planDag, PlanCycleError, UnreachablePreconditionError, type ActionNode } from '../graph-planner.js';

const ACTIONS: ActionNode[] = [
  { id: 'a', title: 'A', preconditions: ['start'], effects: ['x'], cost: 1 },
  { id: 'b', title: 'B', preconditions: ['start'], effects: ['y'], cost: 2 },
  { id: 'c', title: 'C', preconditions: ['x', 'y'], effects: ['z'], cost: 1 },
];

describe('Graph Planner', () => {
  it('synthesises a DAG with critical path and parallel ranks', () => {
    const dag = planDag({ goal: ['z'], initialState: ['start'], actions: ACTIONS });
    expect(dag.nodes.map((n) => n.id).sort()).toEqual(['a', 'b', 'c']);
    expect(dag.criticalPath).toContain('c');
    expect(dag.totalCost).toBeGreaterThan(0);
    expect(dag.parallelBranches.length).toBeGreaterThan(0);
    expect(dag.parallelBranches[0].length).toBeGreaterThan(1);
    expect(dag.executionOrder.indexOf('c')).toBe(2);
  });

  it('rejects unreachable preconditions with the missing facts surfaced', () => {
    expect(() =>
      planDag({ goal: ['unreachable'], initialState: ['start'], actions: ACTIONS }),
    ).toThrow(UnreachablePreconditionError);
  });

  it('backtracks across alternate producers of the same goal fact', () => {
    // Goal `g` has two producers: `a1` needs unreachable `p`, `a2` needs `q`
    // (which `b` produces). A greedy one-shot pick of `a1` would reject the
    // problem as unreachable; the planner must instead back out of `a1` and
    // choose `a2` + `b`.
    const actions: ActionNode[] = [
      { id: 'a1', title: 'A1', preconditions: ['p'], effects: ['g'] },
      { id: 'a2', title: 'A2', preconditions: ['q'], effects: ['g'] },
      { id: 'b', title: 'B', preconditions: [], effects: ['q'] },
    ];
    const dag = planDag({ goal: ['g'], initialState: [], actions });
    const ids = dag.nodes.map((n) => n.id).sort();
    expect(ids).toEqual(['a2', 'b']);
    expect(dag.executionOrder).toEqual(['b', 'a2']);
  });

  it('detects cycles when both actions are pulled into the plan', () => {
    // Construct a plan where the goal requires both x AND y, x→needs y,
    // y→needs x — both actions get selected and a cycle appears.
    const cyclic: ActionNode[] = [
      { id: 'a', title: 'A', preconditions: ['s', 'y'], effects: ['x'] },
      { id: 'b', title: 'B', preconditions: ['s', 'x'], effects: ['y'] },
      { id: 'c', title: 'C', preconditions: ['x', 'y'], effects: ['final'] },
    ];
    expect(() => planDag({ goal: ['final'], initialState: ['s'], actions: cyclic })).toThrow(
      PlanCycleError,
    );
  });
});
