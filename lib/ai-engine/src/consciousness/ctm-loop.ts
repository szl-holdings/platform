/**
 * CTM (Continuous Thought Machine) cross-detector broadcast bus (#5503).
 *
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
