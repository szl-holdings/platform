/**
 * QEC lineage scaffold. Full implementation roadmap. Reference: Doctrine v12 (781/14/194).
 *
 * qec_lineage.ts — runtime counterpart of Lutar/QEC/{HammingFoundations,
 * ShorReceiptCode, CSSBridge, KitaevSurface}.lean.
 *
 * Status: SCAFFOLD. This file restores the module that `src/index.ts`
 * re-exports via `export * as qec from './qec/qec_lineage'`. It was lost in an
 * incomplete prior commit, leaving the project graph referencing a missing
 * source (TS6305: "Output file has not been built from source file"). This
 * scaffold provides the minimal, honest, well-typed export surface needed for
 * `tsc --build` to succeed. It is intentionally NOT a full QEC implementation;
 * the machine-checked, fully-decoded REAL implementation already lives at
 * `packages/unified-kernel/src/qec/index.ts` and is the canonical port of the
 * Lean modules. Consolidating the two onto a single source is tracked in the
 * roadmap below.
 *
 * Roadmap (additive, no behaviour change to existing callers):
 *   R-QEC-1  Hamming foundations (distance / weight / min-distance) — Hamming 1950.
 *   R-QEC-2  Shor [[9,1,3]] receipt replication + majority decode — Shor 1995.
 *   R-QEC-3  CSS classical→stabilizer bridge — Calderbank–Shor–Steane 1996.
 *   R-QEC-4  Kitaev surface-code vertex parity — Kitaev 2003.
 *   R-QEC-5  Reconcile with unified-kernel/src/qec/index.ts (single source of truth).
 *
 * Citations (DOIs):
 *   • Hamming 1950 — 10.1002/j.1538-7305.1950.tb00463.x
 *   • Shor 1995 — 10.1103/PhysRevA.52.R2493
 *   • Steane 1996 — 10.1098/rspa.1996.0136
 *   • Calderbank–Shor 1996 — 10.1103/PhysRevA.54.1098
 *   • Kitaev 2003 — 10.1016/S0003-4916(02)00018-0
 *
 * Λ remains Conjecture 1 (NOT a theorem). SLSA L1 (honest).
 *
 * Sign: Yachay <yachay@szlholdings.dev> — DCO · ADDITIVE · SPDX: Apache-2.0
 */

/** Roadmap stage identifier for the QEC lineage build-out (see file header). */
export type QecStage = 'R-QEC-1' | 'R-QEC-2' | 'R-QEC-3' | 'R-QEC-4' | 'R-QEC-5';

/** Implementation status of a QEC lineage stage in this runtime package. */
export type QecStatus = 'scaffold' | 'partial' | 'implemented';

/** A single entry in the QEC lineage roadmap. */
export interface QecLineageEntry {
  readonly stage: QecStage;
  /** Short human label, e.g. "Hamming foundations". */
  readonly label: string;
  /** Primary attribution DOI for the construction. */
  readonly doi: string;
  readonly status: QecStatus;
}

/**
 * Canonical source of the REAL, machine-checked QEC implementation.
 * The full decoder (Hamming/Shor/CSS/Kitaev) lives here; this runtime module
 * is a scaffold pending R-QEC-5 reconciliation.
 */
export const QEC_CANONICAL_SOURCE =
  'packages/unified-kernel/src/qec/index.ts' as const;

/** Doctrine version this scaffold is pinned to (LOCKED internal). */
export const QEC_DOCTRINE_REFERENCE = 'v12 (781/14/194)' as const;

/** The QEC lineage roadmap, in build order. */
export const QEC_LINEAGE: readonly QecLineageEntry[] = [
  { stage: 'R-QEC-1', label: 'Hamming foundations', doi: '10.1002/j.1538-7305.1950.tb00463.x', status: 'scaffold' },
  { stage: 'R-QEC-2', label: 'Shor [[9,1,3]] receipt code', doi: '10.1103/PhysRevA.52.R2493', status: 'scaffold' },
  { stage: 'R-QEC-3', label: 'CSS classical→stabilizer bridge', doi: '10.1103/PhysRevA.54.1098', status: 'scaffold' },
  { stage: 'R-QEC-4', label: 'Kitaev surface-code vertex parity', doi: '10.1016/S0003-4916(02)00018-0', status: 'scaffold' },
  { stage: 'R-QEC-5', label: 'Reconcile with unified-kernel canonical source', doi: '', status: 'scaffold' },
] as const;

/** True once every roadmap stage reports `implemented`. Currently false (scaffold). */
export function isFullyImplemented(): boolean {
  return QEC_LINEAGE.every((e) => e.status === 'implemented');
}
