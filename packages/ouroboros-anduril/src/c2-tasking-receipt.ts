/**
 * Primitive 81 — C2 tasking receipt
 *
 * Inspired by Lattice's "Task" open data model: a task is a request
 * to a manned or unmanned agent to perform a purposeful activity
 * (move, sense, act). The receipt lift: every task carries an
 * authority chain (who authorized it) AND a refusal-condition list
 * (what must be true for the agent to refuse).
 *
 * The agent that accepts a task without checking refusal conditions
 * is unaccountable. The agent that refuses without recording why is
 * silent failure. The C2 tasking receipt forces both to be explicit.
 *
 * Source pattern: anduril.com/lattice/lattice-sdk Tasks API.
 * No Anduril code lifted.
 */

export type TaskKind = "move" | "sense" | "act" | "report";

export interface RefusalCondition {
  id: string;
  describe: string;
  predicate: (ctx: TaskContext) => boolean; // true => refuse
}

export interface TaskContext {
  battery: number; // 0..1
  withinAuthority: boolean;
  rulesOfEngagement: string[];
  collateralRiskScore: number; // 0..1
}

export interface Task {
  id: string;
  kind: TaskKind;
  target: string;
  authorityChain: string[]; // ordered: issuer, supervisor, commander
  refusalConditions: RefusalCondition[];
}

export interface TaskAcceptance {
  taskId: string;
  accepted: boolean;
  refusedBy: string[]; // condition ids that fired
  reason: string;
}

export function evaluateTask(task: Task, ctx: TaskContext): TaskAcceptance {
  if (task.authorityChain.length === 0) {
    return { taskId: task.id, accepted: false, refusedBy: [], reason: "empty authority chain" };
  }
  const fired = task.refusalConditions.filter((c) => c.predicate(ctx));
  if (fired.length > 0) {
    return {
      taskId: task.id,
      accepted: false,
      refusedBy: fired.map((c) => c.id),
      reason: `refused: ${fired.map((c) => c.describe).join("; ")}`,
    };
  }
  return { taskId: task.id, accepted: true, refusedBy: [], reason: "all refusal conditions pass" };
}

// Standard refusal-condition library (every task should consider these).
export const stdRefusals: RefusalCondition[] = [
  {
    id: "low-battery",
    describe: "battery below 15%",
    predicate: (ctx) => ctx.battery < 0.15,
  },
  {
    id: "out-of-authority",
    describe: "task outside delegated authority",
    predicate: (ctx) => !ctx.withinAuthority,
  },
  {
    id: "high-collateral-risk",
    describe: "collateral risk above 0.7",
    predicate: (ctx) => ctx.collateralRiskScore > 0.7,
  },
];
