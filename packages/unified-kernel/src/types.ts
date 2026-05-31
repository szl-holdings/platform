/**
 * types.ts — shared types for @szl-holdings/unified-kernel.
 *
 * Author: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> (ORCID 0009-0001-0110-4173)
 *
 * Base note: the orchestrator's plan calls for these types to extend
 * `@szl-holdings/anatomy-contracts` (shipped by a parallel crew). That package
 * is not present in this checkout. To keep the kernel bootable today, the
 * contracts below are defined locally and kept structurally compatible with the
 * anatomy-contracts shape (Receipt / CheckResult / module registry). When
 * anatomy-contracts lands, re-export from it and delete the local copies.
 * See HONEST_GAPS.md item "types: anatomy-contracts base".
 */

/** Pass/fail outcome of a single kernel invariant check. */
export interface CheckResult {
  /** Thesis id this check belongs to, e.g. "T01". */
  readonly thesis: ThesisId;
  /** Short machine name for the check. */
  readonly name: string;
  /** Real outcome — never fabricated. */
  readonly pass: boolean;
  /** Human-readable detail (computed values, error message, etc.). */
  readonly detail: string;
  /** Wall-clock duration of the check in milliseconds. */
  readonly durationMs: number;
}

/** A signed, hash-chained kernel receipt (T04 / T18 substrate). */
export interface KernelReceipt {
  readonly schema: "szl.unified-kernel.receipt/v1";
  readonly receiptId: string;
  readonly kind: "kernel-init";
  readonly timestampIso: string;
  /** SHA-256 over the canonical receipt body (excluding signature + selfHash). */
  readonly bodyHash: string;
  /** Previous receipt hash for chaining; null for genesis. */
  readonly prevHash: string | null;
  /** Ed25519 signature (hex) over bodyHash, or a documented fallback marker. */
  readonly signature: string;
  /** Ed25519 public key (hex) the signature verifies against. */
  readonly publicKey: string;
  /** Signature algorithm actually used. */
  readonly sigAlg: "ed25519";
  /** Every check's real outcome. */
  readonly checks: readonly CheckResult[];
  /** Module registry snapshot at boot. */
  readonly modules: readonly ModuleDescriptor[];
}

export type KernelStatus = "PASS" | "DEGRADED" | "FAIL";

/** Describes one wired thesis module in the runtime registry. */
export interface ModuleDescriptor {
  readonly thesis: ThesisId;
  /** Directory under src/. */
  readonly dir: string;
  /** Census status copied from the thesis census (REAL | PARTIAL). */
  readonly censusStatus: "REAL" | "PARTIAL";
  /** "wired" = real code runs; "needs" = honest stub that throws with a gap ref. */
  readonly backing: "wired" | "needs";
  /** Exposed runtime API names. */
  readonly api: readonly string[];
  /** If backing === "needs", the component this module depends on. */
  readonly needs?: string;
}

/** Handle returned by kernel.start(). */
export interface KernelHandle {
  readonly status: KernelStatus;
  readonly initReceipt: KernelReceipt;
  readonly modules: ModuleRegistry;
}

/** Runtime registry: every thesis's exposed API, keyed by thesis id. */
export type ModuleRegistry = Readonly<Record<ThesisId, ModuleHandle>>;

export interface ModuleHandle {
  readonly descriptor: ModuleDescriptor;
  /** The module's live exports (functions / data). */
  readonly exports: Record<string, unknown>;
}

/** The 19 thesis ids (product cut, per THESIS_CENSUS_REPORT.md). */
export type ThesisId =
  | "T01" | "T02" | "T03" | "T04" | "T05" | "T06" | "T07" | "T08" | "T09" | "T10"
  | "T11" | "T12" | "T13" | "T14" | "T15" | "T16" | "T17" | "T18" | "T19";

/**
 * NotYetError — thrown by modules that have no real backing code anywhere in
 * szl-holdings. Doctrine v7 §2: no fake `() => true`. A module that is not ready
 * exports a clearly-named NOT_YET function that throws this, naming the gap.
 */
export class NotYetError extends Error {
  readonly thesis: ThesisId;
  readonly needs: string;
  constructor(thesis: ThesisId, needs: string, tracking?: string) {
    super(
      `[${thesis}] not yet wired — depends on: ${needs}` +
        (tracking ? ` (tracking ${tracking})` : ""),
    );
    this.name = "NotYetError";
    this.thesis = thesis;
    this.needs = needs;
  }
}
