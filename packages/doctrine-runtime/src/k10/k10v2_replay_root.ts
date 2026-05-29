/**
 * k10v2_replay_root.ts — K10_v2 Replay Root (R6)
 * Deterministic replay engine for K10 protocol version 2.
 * Reconstructs final state from an ordered event log by applying
 * events sequentially with snapshot-based fast-forward.
 *
 * References
 * ----------
 * [1] Lamport, L. (1978). Time, clocks, and the ordering of events in a
 *     distributed system. Communications of the ACM, 21(7), 558–565.
 *     doi:10.1145/359545.359563
 * [2] Helland, P. (2015). Immutability Changes Everything.
 *     acmqueue, 13(9). https://queue.acm.org/detail.cfm?id=2884038
 * [3] Kreps, J., Narkhede, N., & Rao, J. (2011). Kafka: A distributed
 *     messaging system for log processing. NetDB 2011.
 *     https://notes.stephenholiday.com/Kafka.pdf
 * [4] Doctrine v6 §11 "K10_v2 Replay Protocol"
 */

import { createHash } from "node:crypto";

// ─────────────────────────────────────────────────────────────────────────────
// K10_v2 event types
// ─────────────────────────────────────────────────────────────────────────────

/** Monotone Lamport timestamp [1] */
export type LamportTs = bigint;

export type K10EventType =
  | "policy_create"
  | "policy_update"
  | "policy_delete"
  | "composition_run"
  | "gate_decision"
  | "scitt_notarised"
  | "a15_check"
  | "snapshot";

export interface K10Event {
  /** Monotone sequence number (Lamport clock [1]) */
  seqNo: LamportTs;
  /** Event type */
  type: K10EventType;
  /** Originating node */
  nodeId: string;
  /** Unix ms wall clock (informational only — ordering uses seqNo [1]) */
  wallClockMs: number;
  /** Opaque JSON payload */
  payload: unknown;
  /** SHA-256 of (seqNo + type + nodeId + JSON(payload)) */
  digest: string;
}

export interface K10Snapshot {
  /** seqNo of the last event included in this snapshot */
  atSeqNo: LamportTs;
  /** Serialised state */
  state: K10ReplayState;
  /** SHA-256 of the serialised state */
  stateDigest: string;
}

/** The reconstructed state after replay */
export interface K10ReplayState {
  policies: Record<string, unknown>;
  compositionLog: Array<{ seqNo: string; outputId: string; mode: string; lambda: number }>;
  gateDecisions: Array<{ seqNo: string; principal: string; resource: string; decision: string }>;
  scittReceipts: Array<{ seqNo: string; statementHash: string; logIndex: number }>;
  a15Checks: Array<{ seqNo: string; betti0: number; satisfied: boolean }>;
  lastSeqNo: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Event digest
// ─────────────────────────────────────────────────────────────────────────────

function computeEventDigest(event: Omit<K10Event, "digest">): string {
  const canonical = `${event.seqNo}:${event.type}:${event.nodeId}:${JSON.stringify(event.payload)}`;
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function makeEvent(
  seqNo: LamportTs,
  type: K10EventType,
  nodeId: string,
  wallClockMs: number,
  payload: unknown
): K10Event {
  const partial = { seqNo, type, nodeId, wallClockMs, payload };
  return { ...partial, digest: computeEventDigest(partial) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Event validator
// ─────────────────────────────────────────────────────────────────────────────

export class EventValidator {
  validate(event: K10Event): void {
    if (typeof event.seqNo !== "bigint") throw new TypeError("seqNo must be bigint");
    if (!event.type) throw new TypeError("event.type is required");
    if (!event.nodeId) throw new TypeError("event.nodeId is required");

    const expected = computeEventDigest({
      seqNo: event.seqNo,
      type: event.type,
      nodeId: event.nodeId,
      wallClockMs: event.wallClockMs,
      payload: event.payload,
    });
    if (event.digest !== expected) {
      throw new Error(
        `Event seqNo=${event.seqNo} digest mismatch: expected ${expected} got ${event.digest}`
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// State reducer (pure function per [2])
// ─────────────────────────────────────────────────────────────────────────────

function emptyState(): K10ReplayState {
  return {
    policies: {},
    compositionLog: [],
    gateDecisions: [],
    scittReceipts: [],
    a15Checks: [],
    lastSeqNo: "0",
  };
}

function applyEvent(state: K10ReplayState, event: K10Event): K10ReplayState {
  const s = structuredClone(state);
  const seqStr = String(event.seqNo);
  s.lastSeqNo = seqStr;

  switch (event.type) {
    case "policy_create":
    case "policy_update": {
      const p = event.payload as { id: string };
      s.policies[p.id] = event.payload;
      break;
    }
    case "policy_delete": {
      const p = event.payload as { id: string };
      delete s.policies[p.id];
      break;
    }
    case "composition_run": {
      const p = event.payload as { outputId: string; mode: string; lambda: number };
      s.compositionLog.push({ seqNo: seqStr, outputId: p.outputId, mode: p.mode, lambda: p.lambda });
      break;
    }
    case "gate_decision": {
      const p = event.payload as { principal: string; resource: string; decision: string };
      s.gateDecisions.push({ seqNo: seqStr, ...p });
      break;
    }
    case "scitt_notarised": {
      const p = event.payload as { statementHash: string; logIndex: number };
      s.scittReceipts.push({ seqNo: seqStr, ...p });
      break;
    }
    case "a15_check": {
      const p = event.payload as { betti0: number; satisfied: boolean };
      s.a15Checks.push({ seqNo: seqStr, betti0: p.betti0, satisfied: p.satisfied });
      break;
    }
    case "snapshot":
      // Snapshot events are handled by the replay root; no state mutation
      break;
    default:
      // Unknown event types are accepted but ignored (forward-compatible [3])
      break;
  }

  return s;
}

// ─────────────────────────────────────────────────────────────────────────────
// K10ReplayRoot — main class
// ─────────────────────────────────────────────────────────────────────────────

export class K10ReplayRoot {
  private events: K10Event[] = [];
  private snapshots: K10Snapshot[] = [];
  private readonly validator = new EventValidator();

  /**
   * Appends an event to the log.
   * Validates digest and enforces monotone seqNo ordering [1].
   */
  append(event: K10Event): void {
    this.validator.validate(event);
    if (this.events.length > 0) {
      const last = this.events[this.events.length - 1];
      if (event.seqNo <= last.seqNo) {
        throw new RangeError(
          `Out-of-order event: seqNo=${event.seqNo} ≤ last=${last.seqNo} (Lamport [doi:10.1145/359545.359563])`
        );
      }
    }
    this.events.push(event);
  }

  /**
   * Loads a snapshot for fast-forward replay.
   * Snapshot stateDigest is verified before use.
   */
  loadSnapshot(snapshot: K10Snapshot): void {
    const expected = computeStateDigest(snapshot.state);
    if (snapshot.stateDigest !== expected) {
      throw new Error(`Snapshot stateDigest mismatch at seqNo=${snapshot.atSeqNo}`);
    }
    this.snapshots.push(snapshot);
    // Sort snapshots by atSeqNo desc so we can quickly find the latest usable
    this.snapshots.sort((a, b) => (b.atSeqNo > a.atSeqNo ? 1 : -1));
  }

  /**
   * Replays the event log (or a suffix of it from the latest snapshot) to
   * reconstruct state at the given target seqNo.
   *
   * Fast-forward: if a snapshot exists at or before targetSeqNo, start from
   * that snapshot's state and apply only the subsequent events [2][3].
   *
   * @param targetSeqNo  Replay up to (inclusive) this seqNo.  Defaults to last.
   */
  replay(targetSeqNo?: LamportTs): K10ReplayState {
    const target = targetSeqNo ?? (
      this.events.length > 0 ? this.events[this.events.length - 1].seqNo : 0n
    );

    // Find best snapshot ≤ target
    const bestSnap = this.snapshots.find((s) => s.atSeqNo <= target) ?? null;
    let state: K10ReplayState = bestSnap ? structuredClone(bestSnap.state) : emptyState();
    const startSeqNo = bestSnap ? bestSnap.atSeqNo + 1n : 0n;

    // Apply events in [startSeqNo, target]
    for (const event of this.events) {
      if (event.seqNo < startSeqNo) continue;
      if (event.seqNo > target) break;
      state = applyEvent(state, event);
    }

    return state;
  }

  /**
   * Takes a snapshot of the current replayed state and stores it.
   */
  takeSnapshot(): K10Snapshot {
    const state = this.replay();
    const snap: K10Snapshot = {
      atSeqNo: this.events.length > 0
        ? this.events[this.events.length - 1].seqNo
        : 0n,
      state,
      stateDigest: computeStateDigest(state),
    };
    this.snapshots.unshift(snap);
    return snap;
  }

  get eventCount(): number { return this.events.length; }
  get snapshotCount(): number { return this.snapshots.length; }
}

function computeStateDigest(state: K10ReplayState): string {
  return createHash("sha256")
    .update(JSON.stringify(state), "utf8")
    .digest("hex");
}
