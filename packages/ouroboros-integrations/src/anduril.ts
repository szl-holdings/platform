/**
 * Anduril integration — wires primitives 80-83 into a11oy, sentra, amaru.
 *
 * Source primitives (license-clean, pattern-only — no Anduril code):
 *   80  entity-data-mesh         — Lattice open-data-model lift
 *   81  c2-tasking-receipt       — Lattice Tasks API lift
 *   82  edge-aggregation         — Menace edge-compute lift
 *   83  autonomy-authority-ladder — A-GRA reference architecture lift
 *
 * Mapping (decided at integration time):
 *   a11oy  ← entity-data-mesh + c2-tasking-receipt + autonomy-authority-ladder
 *           (fleets need typed entity claims, refusal-aware tasking,
 *            and authority-bounded autonomy across heterogeneous agents)
 *
 *   sentra ← c2-tasking-receipt + autonomy-authority-ladder
 *           (HSM-anchored governance must record refusal receipts and
 *            promotion ledger entries — every action is signed authority)
 *
 *   amaru  ← edge-aggregation + autonomy-authority-ladder
 *           (fleet coordination at the edge needs trust-aware aggregation
 *            and bounded autonomy per agent)
 *
 * The rationale: amaru runs distributed; sentra runs custodial; a11oy
 * runs heterogeneous. Each gets the slice of Anduril discipline that
 * matches its threat model.
 */

import {
  EntityDataMesh,
  evaluateTask,
  stdRefusals,
  aggregateEdge,
  emitGate,
  checkAuthority,
  promote,
  type EntityClaim,
  type EntityRecord,
  type ProducerPrecedence,
  type Task,
  type TaskContext,
  type TaskAcceptance,
  type RefusalCondition,
  type EdgeSample,
  type EdgeAggregate,
  type Connectivity,
  type AgentState,
  type ActionRequest,
  type AuthorityVerdict,
  type AutonomyLevel,
  type PromotionEvent,
} from "@workspace/ouroboros-anduril";

// ─────────────────────────────────────────────────────────────────────────────
// A11oy extensions — entity mesh + tasking + authority for heterogeneous fleets
// ─────────────────────────────────────────────────────────────────────────────

export interface A11oyFleetEntity {
  readonly entityId: string;
  readonly record: EntityRecord;
}

export class A11oyEntityFleet {
  private mesh: EntityDataMesh;
  private agents = new Map<string, AgentState>();

  constructor(precedence?: ProducerPrecedence) {
    this.mesh = new EntityDataMesh(precedence);
  }

  /** Apply an entity claim from one agent to the fleet's shared mesh. */
  publish(claim: EntityClaim): { applied: boolean; reason: string } {
    return this.mesh.apply(claim);
  }

  /** Resolve current view of an entity. Returns undefined if no claims received. */
  resolve(entityId: string): EntityRecord | undefined {
    return this.mesh.read(entityId);
  }

  lineageOf(entityId: string): EntityClaim[] {
    return this.mesh.lineageOf(entityId);
  }

  /** Register an agent into the fleet at a starting autonomy level. */
  registerAgent(agentId: string, level: AutonomyLevel): AgentState {
    const state: AgentState = { agentId, currentLevel: level, promotionLedger: [] };
    this.agents.set(agentId, state);
    return state;
  }

  getAgent(agentId: string): AgentState | undefined {
    return this.agents.get(agentId);
  }

  /** Promote/demote an agent — every change requires a named authority. */
  changeAuthority(
    agentId: string,
    toLevel: AutonomyLevel,
    authorizedBy: string,
    timestamp: string,
    reason: string
  ): AgentState {
    const cur = this.agents.get(agentId);
    if (!cur) throw new Error(`unknown agent ${agentId}`);
    const next = promote(cur, toLevel, authorizedBy, timestamp, reason);
    this.agents.set(agentId, next);
    return next;
  }

  /**
   * Dispatch a task to an agent. The task is checked against the agent's
   * autonomy level AND against the standard + custom refusal conditions.
   * Both gates must pass before the task is accepted.
   */
  dispatch(
    agentId: string,
    task: Task,
    ctx: TaskContext,
    requiredLevel: AutonomyLevel,
    reversible = true
  ): {
    authority: AuthorityVerdict;
    acceptance: TaskAcceptance;
    dispatched: boolean;
  } {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`unknown agent ${agentId}`);
    const action: ActionRequest = {
      id: task.id,
      description: `dispatch ${task.kind} to ${task.target}`,
      requiredLevel,
      reversible,
    };
    const authority = checkAuthority(action, agent);
    const acceptance = evaluateTask(task, ctx);
    return {
      authority,
      acceptance,
      dispatched: authority.permitted && acceptance.accepted,
    };
  }
}

export { stdRefusals as a11oyStdRefusals };

// ─────────────────────────────────────────────────────────────────────────────
// Sentra extensions — refusal receipts + promotion ledger anchored to HSM
// ─────────────────────────────────────────────────────────────────────────────

export interface SentraTaskingReceipt {
  readonly taskId: string;
  readonly accepted: boolean;
  readonly refusedBy: string[];
  readonly reason: string;
  readonly authorityChain: string[];
  readonly timestamp: number;
}

/**
 * Convert a tasking evaluation into a Sentra-ready governance receipt
 * (the leafHash for the HSM accumulator is the caller's responsibility —
 *  this adapter only produces the structured payload).
 */
export function sentraTaskingReceipt(
  task: Task,
  ctx: TaskContext,
  timestamp: number,
  customRefusals: RefusalCondition[] = []
): SentraTaskingReceipt {
  const merged: Task = {
    ...task,
    refusalConditions: [...task.refusalConditions, ...customRefusals],
  };
  const acc = evaluateTask(merged, ctx);
  return {
    taskId: acc.taskId,
    accepted: acc.accepted,
    refusedBy: [...acc.refusedBy],
    reason: acc.reason,
    authorityChain: [...task.authorityChain],
    timestamp,
  };
}

export interface SentraPromotionReceipt {
  readonly agentId: string;
  readonly fromLevel: AutonomyLevel;
  readonly toLevel: AutonomyLevel;
  readonly authorizedBy: string;
  readonly timestamp: string;
  readonly reason: string;
  readonly ledgerLength: number;
}

/**
 * Capture a promotion event and produce a Sentra receipt. The receipt is
 * what gets folded into the HSM accumulator on the governance path.
 */
export function sentraPromotionReceipt(
  agent: AgentState,
  toLevel: AutonomyLevel,
  authorizedBy: string,
  timestamp: string,
  reason: string
): { next: AgentState; receipt: SentraPromotionReceipt } {
  const next = promote(agent, toLevel, authorizedBy, timestamp, reason);
  const last = next.promotionLedger[next.promotionLedger.length - 1] as PromotionEvent;
  return {
    next,
    receipt: {
      agentId: last.agentId,
      fromLevel: last.fromLevel,
      toLevel: last.toLevel,
      authorizedBy: last.authorizedBy,
      timestamp: last.timestamp,
      reason: last.reason,
      ledgerLength: next.promotionLedger.length,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Amaru extensions — edge-aggregation + bounded autonomy at the tactical edge
// ─────────────────────────────────────────────────────────────────────────────

export interface AmaruEdgeSignal {
  readonly metricId: string;
  readonly aggregate: EdgeAggregate;
  readonly emit: boolean;
  readonly reason: string;
  readonly recommendation: "EMIT" | "BUFFER" | "DROP";
}

/**
 * Take a window of edge samples and produce an Amaru emit-decision signal.
 * Combines aggregate stats with the disconnection-tolerance gate.
 */
export function amaruEdgeSignal(
  metricId: string,
  samples: EdgeSample[],
  trustFloor: number,
  failClosed: boolean
): AmaruEdgeSignal {
  const aggregate = aggregateEdge(samples);
  const gate = emitGate(aggregate, trustFloor, failClosed);
  const recommendation: AmaruEdgeSignal["recommendation"] = gate.emit
    ? "EMIT"
    : failClosed
      ? "BUFFER"
      : "DROP";
  return {
    metricId,
    aggregate,
    emit: gate.emit,
    reason: gate.reason,
    recommendation,
  };
}

/**
 * Bounded-autonomy gate for an Amaru fleet action: action must be permitted
 * by both the autonomy ladder AND the edge-trust signal. Either failure
 * blocks the action; both must pass.
 */
export function amaruBoundedAction(
  agent: AgentState,
  action: ActionRequest,
  signal: AmaruEdgeSignal,
  edgeTrustFloor: number
): { permitted: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const auth = checkAuthority(action, agent);
  if (!auth.permitted) reasons.push(`authority: ${auth.reason}`);
  if (signal.aggregate.trustScore < edgeTrustFloor) {
    reasons.push(`edge trust ${signal.aggregate.trustScore.toFixed(3)} < ${edgeTrustFloor}`);
  }
  return { permitted: reasons.length === 0, reasons };
}

// Re-exports for downstream convenience.
export type {
  EntityClaim,
  EntityRecord,
  Task,
  TaskContext,
  TaskAcceptance,
  RefusalCondition,
  EdgeSample,
  EdgeAggregate,
  Connectivity,
  AgentState,
  ActionRequest,
  AuthorityVerdict,
  AutonomyLevel,
  PromotionEvent,
};
