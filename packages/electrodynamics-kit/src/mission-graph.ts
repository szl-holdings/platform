/**
 * Mission graph — compile-once-sign-once envelope wrapping a typed DAG of
 * mission nodes. Re-expressed from Anduril Lattice's public posture +
 * ROS2 BT.CPP / PX4 Mission DSL fallback semantics. See
 * docs/research/electrodynamics-synthesis-2026.md §4.
 *
 *   "A mission is not a sequence of commands but a graph compiled once,
 *    signed, and replayed against telemetry to prove what the system
 *    *intended* vs. what it *did*."
 *
 * The fallback policy is a typed enum — never implicit:
 *   - 'retry'      — re-attempt the failed branch up to retryLimit times
 *   - 'skip-once'  — log the failure and proceed past the failed node
 *   - 'abort'      — terminate the mission with a typed abort receipt
 *
 * This module is pure: it produces a hashed `MissionGraph` envelope from
 * a plan-graph and a signer. It does not execute the mission.
 */

export type FallbackPolicy = 'retry' | 'skip-once' | 'abort';

export interface MissionNode {
  readonly nodeId: string;
  /** Typed action class (e.g. `'sense'`, `'classify'`, `'engage'`). */
  readonly action: string;
  readonly preconditions: readonly string[];
  readonly postconditions: readonly string[];
  readonly fallbackPolicy: FallbackPolicy;
  /** Only meaningful when fallbackPolicy === 'retry'. */
  readonly retryLimit?: number;
}

export interface MissionEdge {
  readonly from: string;
  readonly to: string;
  readonly condition?: string;
}

export interface MissionGraph {
  readonly missionHash: string;
  readonly planDagRef: string;
  readonly nodes: readonly MissionNode[];
  readonly edges: readonly MissionEdge[];
  readonly fallbackPolicyByNode: Readonly<Record<string, FallbackPolicy>>;
  readonly compiledBy: string;
  readonly signature: string;
}

export interface MissionGraphInput {
  readonly planDagRef: string;
  readonly nodes: readonly MissionNode[];
  readonly edges: readonly MissionEdge[];
  readonly compiledBy: string;
}

export type Signer = (canonicalPayload: string) => string;
export type Hasher = (canonicalPayload: string) => string;

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',')}}`;
}

/**
 * Pure validator: every node referenced by an edge must exist, no
 * cycles, every node's fallbackPolicy is one of the typed values.
 * Throws on violation; returns void on success.
 */
export function validateMissionGraphShape(input: MissionGraphInput): void {
  const ids = new Set(input.nodes.map((n) => n.nodeId));
  if (ids.size !== input.nodes.length) {
    throw new Error('mission-graph: duplicate nodeId');
  }
  for (const e of input.edges) {
    if (!ids.has(e.from)) throw new Error(`mission-graph: edge.from ${e.from} not in nodes`);
    if (!ids.has(e.to)) throw new Error(`mission-graph: edge.to ${e.to} not in nodes`);
  }
  // Cycle check (DFS).
  const adj = new Map<string, string[]>();
  for (const n of input.nodes) adj.set(n.nodeId, []);
  for (const e of input.edges) adj.get(e.from)!.push(e.to);
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const colour = new Map<string, number>();
  for (const n of input.nodes) colour.set(n.nodeId, WHITE);
  const stack: Array<{ node: string; iter: Iterator<string> }> = [];
  for (const n of input.nodes) {
    if (colour.get(n.nodeId) !== WHITE) continue;
    stack.push({ node: n.nodeId, iter: adj.get(n.nodeId)![Symbol.iterator]() });
    colour.set(n.nodeId, GRAY);
    while (stack.length) {
      const top = stack[stack.length - 1]!;
      const next = top.iter.next();
      if (next.done) {
        colour.set(top.node, BLACK);
        stack.pop();
        continue;
      }
      const child = next.value;
      const c = colour.get(child);
      if (c === GRAY) throw new Error(`mission-graph: cycle through ${child}`);
      if (c === WHITE) {
        colour.set(child, GRAY);
        stack.push({ node: child, iter: adj.get(child)![Symbol.iterator]() });
      }
    }
  }
  for (const n of input.nodes) {
    if (n.fallbackPolicy === 'retry' && (n.retryLimit ?? 0) <= 0) {
      throw new Error(`mission-graph: node ${n.nodeId} has fallbackPolicy 'retry' but no positive retryLimit`);
    }
  }
}

/**
 * Compile a mission-graph input into a hashed, signed envelope. Pure
 * function of (input, hasher, signer); identical inputs produce
 * identical envelopes.
 */
export function compileMission(
  input: MissionGraphInput,
  hasher: Hasher,
  signer: Signer,
): MissionGraph {
  validateMissionGraphShape(input);
  const fallbackPolicyByNode: Record<string, FallbackPolicy> = {};
  for (const n of input.nodes) fallbackPolicyByNode[n.nodeId] = n.fallbackPolicy;
  const payload = canonicalJson({
    planDagRef: input.planDagRef,
    nodes: input.nodes,
    edges: input.edges,
    compiledBy: input.compiledBy,
  });
  const missionHash = hasher(payload);
  const signature = signer(missionHash);
  return {
    missionHash,
    planDagRef: input.planDagRef,
    nodes: input.nodes,
    edges: input.edges,
    fallbackPolicyByNode,
    compiledBy: input.compiledBy,
    signature,
  };
}
