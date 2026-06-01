/**
 * Dual-Witness — primitive #3 of Horizon.
 *
 * BACKGROUND
 * ----------
 * Black-hole complementarity (Susskind, 't Hooft, Thorne, ~1993) resolved
 * the original information paradox by accepting that an infalling observer
 * and an external observer have two valid, mutually contradictory descriptions
 * of the same physical event. The infalling astronaut sails through the
 * horizon; the external astronomer sees them slow, redden, and burn up on
 * it. Each picture is internally consistent. They cannot be reconciled
 * because no single observer can collect both.
 *
 * COMPUTATIONAL ANALOG
 * --------------------
 * Every A11oy agent invocation produces TWO parallel witness chains:
 *
 *   internal: the agent's own first-person reasoning trace, including
 *             considered options and counterfactuals
 *   external: the auditor's third-person trace — system calls, tool calls,
 *             token-level emissions, side effects, with timestamps
 *
 * The runtime never tries to merge them at runtime. At audit time, the
 * DualWitnessVerifier checks the consistency theorem:
 *
 *   For every internal claim that is externally-observable, there must
 *   exist a corresponding external witness entry that confirms it.
 *
 * The reverse need not hold: the external witness may show steps the agent
 * did not reason about (instrumentation noise, timing, system-level events).
 *
 * A failure of the consistency theorem is a COMPLEMENTARITY_VIOLATION and
 * is treated as proof of agent dishonesty or system tampering. This is the
 * primitive that powers genuine AI auditability — competitors collapse
 * the two views into one (usually external), losing reasoning fidelity, or
 * trust the agent's self-report alone, losing accountability. We keep both
 * and prove non-contradiction.
 */

import { createHash } from "node:crypto";
import type {
  DualWitnessResult,
  LoopTick,
  WitnessEntry,
  WitnessLevel,
} from "./types.js";

/**
 * A hash-chained append-only witness log. One per (loop, witness level).
 */
export class WitnessChain {
  private readonly entries: WitnessEntry[] = [];
  private readonly level: WitnessLevel;

  constructor(level: WitnessLevel) {
    this.level = level;
  }

  /**
   * Append an entry. Returns the new entry with prevHash and hash set.
   */
  append(args: {
    tick: LoopTick;
    kind: string;
    payload: Record<string, unknown>;
    externallyObservable: boolean;
  }): WitnessEntry {
    const prev = this.entries[this.entries.length - 1];
    const prevHash = prev?.hash ?? GENESIS_HASH;
    const entryWithoutHash = {
      tick: args.tick,
      level: this.level,
      kind: args.kind,
      payload: args.payload,
      externallyObservable: args.externallyObservable,
      prevHash,
    };
    const hash = computeEntryHash(prevHash, entryWithoutHash);
    const full: WitnessEntry = Object.freeze({ ...entryWithoutHash, hash });
    this.entries.push(full);
    return full;
  }

  /** Verify chain integrity end-to-end. */
  verify(): boolean {
    let prevHash = GENESIS_HASH;
    for (const e of this.entries) {
      if (e.prevHash !== prevHash) return false;
      const expected = computeEntryHash(prevHash, {
        tick: e.tick,
        level: e.level,
        kind: e.kind,
        payload: e.payload,
        externallyObservable: e.externallyObservable,
        prevHash,
      });
      if (e.hash !== expected) return false;
      prevHash = e.hash;
    }
    return true;
  }

  toArray(): readonly WitnessEntry[] {
    return [...this.entries];
  }

  get head(): string {
    return this.entries[this.entries.length - 1]?.hash ?? GENESIS_HASH;
  }

  get length(): number {
    return this.entries.length;
  }
}

const GENESIS_HASH =
  "0000000000000000000000000000000000000000000000000000000000000000";

function canonicalJSON(obj: unknown): string {
  // Stable, lexicographic JSON. Required for reproducible hashing across hosts.
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalJSON).join(",") + "]";
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const parts = keys.map(
    (k) =>
      JSON.stringify(k) +
      ":" +
      canonicalJSON((obj as Record<string, unknown>)[k]),
  );
  return "{" + parts.join(",") + "}";
}

function computeEntryHash(
  prevHash: string,
  body: Omit<WitnessEntry, "hash">,
): string {
  return createHash("sha256")
    .update(prevHash)
    .update("\u0001")
    .update(canonicalJSON(body))
    .digest("hex");
}

/**
 * Verify the dual-witness consistency theorem.
 *
 * For every internal claim that is externally-observable, an external entry
 * must exist that:
 *   (a) is at a tick within [internal.tick, internal.tick + windowTicks]
 *   (b) has a `kind` that matches the internal claim's `kind` (or a
 *       configured equivalence class)
 *   (c) has a payload that satisfies the matcher
 *
 * Orphaned internal claims (no matching external witness) constitute a
 * complementarity violation.
 */
export function verifyDualWitness(args: {
  internal: WitnessChain;
  external: WitnessChain;
  /** Maximum tick distance allowed between internal claim and external confirmation. */
  windowTicks?: number;
  /**
   * Optional matcher. Returns true iff `ext` is a valid confirmation of `int`.
   * Default: equal `kind` AND every primitive value in int.payload appears
   * somewhere in ext.payload.
   */
  matcher?: (int: WitnessEntry, ext: WitnessEntry) => boolean;
}): DualWitnessResult {
  const windowTicks = args.windowTicks ?? 100;
  const matcher = args.matcher ?? defaultMatcher;
  const intEntries = args.internal.toArray();
  const extEntries = args.external.toArray();

  if (!args.internal.verify()) {
    throw new Error("dual-witness: internal chain integrity broken");
  }
  if (!args.external.verify()) {
    throw new Error("dual-witness: external chain integrity broken");
  }

  const orphans: WitnessEntry[] = [];
  for (const int of intEntries) {
    if (!int.externallyObservable) continue;
    const found = extEntries.some(
      (ext) =>
        ext.tick >= int.tick &&
        ext.tick <= int.tick + windowTicks &&
        matcher(int, ext),
    );
    if (!found) orphans.push(int);
  }

  const ticks = [...intEntries, ...extEntries].map((e) => e.tick);
  const range = {
    from: ticks.length ? Math.min(...ticks) : 0,
    to: ticks.length ? Math.max(...ticks) : 0,
  };
  return {
    consistent: orphans.length === 0,
    orphanedClaims: orphans,
    range,
  };
}

function defaultMatcher(int: WitnessEntry, ext: WitnessEntry): boolean {
  if (int.kind !== ext.kind) return false;
  for (const [k, v] of Object.entries(int.payload)) {
    if (
      v === null ||
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      const extVal = ext.payload[k];
      if (extVal !== v) return false;
    }
  }
  return true;
}
