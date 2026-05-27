/**
 * CTM (Consciousness/Continuous Thought Machine) — twin surfaces.
 *
 * This file exports two independently-used capabilities that both share
 * the "CTM" lineage:
 *
 *   1. `CtmBroadcastBus` (Sentra Detector Council, #5503)
 *      — an in-process pub/sub bus for cross-detector broadcasts so a
 *      credential-stuffing spike, a baseline-shift on auth-failure
 *      rate, and a prompt-injection antivenom hit on the same minute
 *      can be fused by the Detector Council before any handoff fires.
 *
 *   2. `runCtmLoop` / `arbitrate` (ROSIE Reasoning, drone-oversight demo)
 *      — a Consciousness Turing Machine arbitration loop. N specialist
 *      processors each emit a candidate broadcast for the current
 *      tick; the arbiter picks ONE winner; every loser is logged as a
 *      suppressed alternative (audit trail). The winning broadcast is
 *      fed back to every processor as the next tick's input.
 *
 * Both surfaces are pure-ts, deterministic given seed, no I/O. Receipts
 * and persistence are layered above by the caller.
 */

// ──────────────────────────────────────────────────────────────────────
// 1. CtmBroadcastBus — Sentra Detector Council (#5503)
// ──────────────────────────────────────────────────────────────────────

/**
 * Distilled from the AGI-stack synthesis §8. Sentra detectors emit
 * findings independently; without a shared bus, a credential-stuffing
 * spike, a baseline-shift on auth-failure rate, and a prompt-injection
 * antivenom hit on the same minute all reach the operator as three
 * unrelated rows. The CTM bus is the formal channel through which
 * detectors broadcast a normalised "thought" and *subscribe* to the
 * stream so a downstream detector (typically the Detector Council) can
 * fuse them before any handoff fires.
 *
 * Design constraints:
 *
 *   - **In-process only.** Cross-process fan-out belongs to a11oy /
 *     yawar; this is the tight inner loop the Detector Council
 *     deliberates inside.
 *   - **Bounded.** A rolling window keeps the bus from drifting into a
 *     log. Default 256 thoughts × 5 minutes — enough for
 *     within-incident correlation, not enough to retain history.
 *   - **Pure pub/sub.** Subscribers get a synchronous handle to every
 *     thought; they MUST NOT republish from within their callback
 *     (re-entrancy guard throws). Fusion belongs in the Council, not
 *     the bus.
 *   - **Receipt-friendly.** Every broadcast carries the originating
 *     detector id, the finding-shaped payload, and a monotonically
 *     increasing `sequenceId` so the Council's receipt can pin to a
 *     specific bus state.
 *
 * The bus is intentionally not a generic event emitter. The narrow
 * contract is what lets the Council audit "thought N was on the bus
 * when I deliberated, thought N+1 was not".
 */

export type CtmThoughtKind =
  | 'finding'
  | 'temporal-trajectory'
  | 'antivenom-match'
  | 'baseline-shift'
  | 'council-verdict';

export interface CtmThought<TPayload = unknown> {
  /** Monotonic per-bus counter. */
  sequenceId: number;
  /** ISO-8601 emission time. */
  emittedAt: string;
  /** Detector / module id that produced the thought. */
  source: string;
  kind: CtmThoughtKind;
  /** Free-form payload — typically a `Finding` or a temporal score. */
  payload: TPayload;
  /** Optional correlation key (incident id, asset, etc.). */
  correlationKey?: string;
  /** Optional pre-computed score 0..1 — Council uses it for arbitration. */
  score?: number;
}

export type CtmSubscriber = (thought: CtmThought) => void;

export interface CtmBusOptions {
  /** Max thoughts retained in the rolling window. Default 256. */
  maxThoughts?: number;
  /** Max retention age, milliseconds. Default 5 min. */
  maxAgeMs?: number;
  /** Replace `Date.now` for deterministic tests. */
  now?: () => number;
}

const DEFAULT_MAX_THOUGHTS = 256;
const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000;

export class CtmBroadcastBus {
  private thoughts: CtmThought[] = [];
  private subscribers = new Set<CtmSubscriber>();
  private nextSequenceId = 1;
  private readonly maxThoughts: number;
  private readonly maxAgeMs: number;
  private readonly now: () => number;
  /** Re-entrancy guard — broadcasting from a subscriber callback is a bug. */
  private inBroadcast = false;

  constructor(opts: CtmBusOptions = {}) {
    this.maxThoughts = opts.maxThoughts ?? DEFAULT_MAX_THOUGHTS;
    this.maxAgeMs = opts.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
    this.now = opts.now ?? (() => Date.now());
  }

  /** Subscribe to all future thoughts. Returns an unsubscribe handle. */
  subscribe(fn: CtmSubscriber): () => void {
    this.subscribers.add(fn);
    return () => {
      this.subscribers.delete(fn);
    };
  }

  /** Snapshot of the current window — used by the Detector Council. */
  snapshot(filter?: { correlationKey?: string; kinds?: CtmThoughtKind[] }): CtmThought[] {
    this.evict();
    let out = this.thoughts.slice();
    if (filter?.correlationKey) {
      out = out.filter((t) => t.correlationKey === filter.correlationKey);
    }
    if (filter?.kinds && filter.kinds.length > 0) {
      const kinds = new Set(filter.kinds);
      out = out.filter((t) => kinds.has(t.kind));
    }
    return out;
  }

  /**
   * Broadcast a thought. Returns the bus-assigned sequence id so the
   * caller can pin a receipt to it.
   */
  broadcast<T>(
    input: Omit<CtmThought<T>, 'sequenceId' | 'emittedAt'> & { emittedAt?: string },
  ): CtmThought<T> {
    if (this.inBroadcast) {
      // Republishing from a subscriber would let one detector's verdict
      // re-enter the Council's evidence set mid-deliberation. Fail loud.
      throw new Error('CtmBroadcastBus: re-entrant broadcast() from subscriber callback is forbidden');
    }
    const thought: CtmThought<T> = {
      sequenceId: this.nextSequenceId++,
      emittedAt: input.emittedAt ?? new Date(this.now()).toISOString(),
      source: input.source,
      kind: input.kind,
      payload: input.payload,
      correlationKey: input.correlationKey,
      score: input.score,
    };
    this.thoughts.push(thought as CtmThought);
    this.evict();
    this.inBroadcast = true;
    try {
      for (const sub of this.subscribers) {
        try {
          sub(thought as CtmThought);
        } catch {
          // Subscriber errors are isolated — a noisy detector must not
          // poison the bus for the Council.
        }
      }
    } finally {
      this.inBroadcast = false;
    }
    return thought;
  }

  /** Clear the rolling window — only used in tests. */
  reset(): void {
    this.thoughts = [];
    this.nextSequenceId = 1;
  }

  private evict(): void {
    const cutoffMs = this.now() - this.maxAgeMs;
    while (this.thoughts.length > 0) {
      const head = this.thoughts[0];
      if (!head) break;
      if (new Date(head.emittedAt).getTime() < cutoffMs) {
        this.thoughts.shift();
      } else {
        break;
      }
    }
    while (this.thoughts.length > this.maxThoughts) {
      this.thoughts.shift();
    }
  }
}

const _global = globalThis as { __ctm_bus__?: CtmBroadcastBus };
/**
 * Process-singleton CTM bus. Detectors should publish here; the Sentra
 * Detector Council reads its snapshot when arbitrating.
 */
export const ctmBus: CtmBroadcastBus =
  _global.__ctm_bus__ ?? (_global.__ctm_bus__ = new CtmBroadcastBus());

// ──────────────────────────────────────────────────────────────────────
// 2. CTM-Loop — ROSIE arbitration loop (drone-oversight)
// ──────────────────────────────────────────────────────────────────────

/**
 * Re-expression of the ctm-ai broadcast model against SZL primitives.
 * N specialist processors each emit a candidate broadcast for the
 * current tick; the arbiter picks ONE winner; every loser is logged as
 * a suppressed alternative (NOT dropped — that's the audit trail).
 *
 * The winning broadcast is fed back to every processor as the input
 * for the next tick. After K ticks we return the trace plus a final
 * synthesis from the last winner.
 *
 * Pure-ts, deterministic given seed. Callers wrap in a receipt
 * (`consciousness.broadcast.v1`) for governance.
 */

export interface ProcessorCandidate {
  processorId: string;
  /** what this specialist proposes the system attend to */
  content: string;
  /** salience self-score in [0,1] — the arbiter biases on this */
  salience: number;
  /** ad-hoc tags downstream consumers may want */
  tags?: string[];
}

export interface Processor {
  id: string;
  /** plain-english specialty (e.g. "policy gate", "trajectory drift") */
  specialty: string;
  /** the actual function — pure, deterministic on (input, tick, prevWinner) */
  propose: (ctx: ProcessorContext) => ProcessorCandidate;
}

export interface ProcessorContext {
  tick: number;
  input: string;
  prevWinner: ProcessorCandidate | null;
  rng: () => number;
}

export interface BroadcastTick {
  tick: number;
  candidates: ProcessorCandidate[];
  winner: ProcessorCandidate;
  suppressed: ProcessorCandidate[];
  arbitrationRationale: string;
}

export interface CtmLoopResult {
  loopId: string;
  ticks: BroadcastTick[];
  finalSynthesis: string;
  totalSuppressed: number;
}

export interface CtmLoopOptions {
  input: string;
  processors: Processor[];
  ticks?: number;
  seed?: number;
  /** salience boost for the prior winner — keeps the loop coherent */
  coherenceBias?: number;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Arbitrate a single tick: pick the highest-salience candidate, with a
 * small coherence bias for the prior winner so the loop doesn't thrash.
 * Ties are broken by processor id to keep this deterministic.
 */
export function arbitrate(
  candidates: ProcessorCandidate[],
  prevWinnerId: string | null,
  coherenceBias = 0.05,
): { winner: ProcessorCandidate; suppressed: ProcessorCandidate[]; rationale: string } {
  if (candidates.length === 0) {
    throw new Error('arbitrate: no candidates');
  }
  const scored = candidates.map((c) => ({
    c,
    score: c.salience + (c.processorId === prevWinnerId ? coherenceBias : 0),
  }));
  scored.sort((a, b) => b.score - a.score || a.c.processorId.localeCompare(b.c.processorId));
  const winner = scored[0].c;
  const suppressed = scored.slice(1).map((s) => s.c);
  const margin = scored[1] ? scored[0].score - scored[1].score : scored[0].score;
  const rationale =
    `winner=${winner.processorId} (salience=${winner.salience.toFixed(3)}` +
    (winner.processorId === prevWinnerId ? `, coherence-bias=+${coherenceBias.toFixed(3)}` : '') +
    `) margin=${margin.toFixed(3)} over ${suppressed.length} suppressed`;
  return { winner, suppressed, rationale };
}

export function runCtmLoop(opts: CtmLoopOptions): CtmLoopResult {
  const ticks = opts.ticks ?? 4;
  const rng = mulberry32(opts.seed ?? 1);
  const bias = opts.coherenceBias ?? 0.05;
  const trace: BroadcastTick[] = [];
  let prev: ProcessorCandidate | null = null;
  let suppressedCount = 0;
  for (let t = 0; t < ticks; t++) {
    const ctx: ProcessorContext = { tick: t, input: opts.input, prevWinner: prev, rng };
    const candidates = opts.processors.map((p) => p.propose(ctx));
    const { winner, suppressed, rationale } = arbitrate(candidates, prev?.processorId ?? null, bias);
    trace.push({ tick: t, candidates, winner, suppressed, arbitrationRationale: rationale });
    suppressedCount += suppressed.length;
    prev = winner;
  }
  const finalSynthesis = prev
    ? `After ${ticks} broadcast ticks, the workspace converged on: ${prev.content}`
    : '(no broadcast)';
  return {
    loopId: `ctm_${Date.now().toString(36)}_${Math.floor(rng() * 1e9).toString(36)}`,
    ticks: trace,
    finalSynthesis,
    totalSuppressed: suppressedCount,
  };
}

/**
 * A small bank of default processors useful for the ROSIE drone-oversight
 * scenario and for unit tests. They are deliberately simple — production
 * code is expected to plug in domain-specific processors.
 */
export function defaultProcessors(): Processor[] {
  return [
    {
      id: 'policy-gate',
      specialty: 'Checks the proposed action against active policy.',
      propose: ({ input, tick, prevWinner }) => ({
        processorId: 'policy-gate',
        content: `Policy lens (t=${tick}): "${input.slice(0, 80)}" — ${
          prevWinner?.processorId === 'policy-gate' ? 'still nominal' : 'requires gate check'
        }.`,
        salience: 0.55 + (input.match(/violate|breach|override/i) ? 0.4 : 0),
        tags: ['policy'],
      }),
    },
    {
      id: 'trajectory-drift',
      specialty: 'Watches temporal drift against the baseline.',
      propose: ({ input, tick }) => ({
        processorId: 'trajectory-drift',
        content: `Drift lens (t=${tick}): no anomalous bucket yet — keeping baseline.`,
        salience: 0.4 + (input.match(/anomal|spike|drift/i) ? 0.35 : 0),
        tags: ['temporal'],
      }),
    },
    {
      id: 'risk-quantifier',
      specialty: 'Quantifies blast-radius if the action proceeds.',
      propose: ({ input, tick, rng }) => ({
        processorId: 'risk-quantifier',
        content: `Risk lens (t=${tick}): blast-radius score ${(rng() * 0.6 + 0.2).toFixed(2)}.`,
        salience: 0.5 + (input.match(/civilian|populated|critical/i) ? 0.35 : 0),
        tags: ['risk'],
      }),
    },
    {
      id: 'evidence-recall',
      specialty: 'Recalls prior similar situations from the ledger.',
      propose: ({ input, tick }) => ({
        processorId: 'evidence-recall',
        content: `Memory lens (t=${tick}): 3 similar incidents in last 90d — all required HITL approval.`,
        salience: 0.45,
        tags: ['memory'],
      }),
    },
  ];
}
