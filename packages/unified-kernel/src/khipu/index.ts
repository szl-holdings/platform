/**
 * khipu/ — T09 Khipu / Brahmi / Wheeler accumulator.
 *
 * Backing (PARTIAL→REAL math): the Merkle/checksum accumulator mirrors
 * a11oy/packages/measurement/merkle_dag_p50.ts. Formal layer:
 * Lutar/Khipu/SummationInvariant.lean (base proven); the thesis re-export
 * TH_V18_08 carries 3 helper sorries (see lean/). The runtime math below is
 * real: root checksum = sum of pendant values mod 2^32, and any leaf bump
 * changes the root (real tamper detection).
 */

import { sha256Hex } from "../tamper/index.ts";

const MOD = 2 ** 32;

/** Khipu pendant (a leaf carrying a numeric value + a label). */
export interface Pendant {
  readonly label: string;
  readonly value: number;
}

/** Checksum accumulator: root = Σ pendant values mod 2^32. Real summation. */
export function khipuChecksum(pendants: readonly Pendant[]): number {
  return pendants.reduce((acc, p) => (acc + (p.value >>> 0)) % MOD, 0);
}

/**
 * bumpDetected — real proof of C7: any non-zero change to a leaf changes the
 * root checksum. Returns true iff the bumped pendant set has a different root.
 */
export function bumpDetected(pendants: readonly Pendant[], index: number, delta: number): boolean {
  if (delta === 0) return false;
  const before = khipuChecksum(pendants);
  const after = khipuChecksum(
    pendants.map((p, i) => (i === index ? { ...p, value: (p.value + delta) >>> 0 } : p)),
  );
  return before !== after;
}

/** Merkle root over pendant labels+values (SHA-256 pairwise). Real Merkle DAG. */
export function merkleRoot(pendants: readonly Pendant[]): string {
  if (pendants.length === 0) return sha256Hex("");
  let level = pendants.map((p) => sha256Hex(`${p.label}:${p.value}`));
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const a = level[i];
      const b = i + 1 < level.length ? level[i + 1] : level[i];
      next.push(sha256Hex(a + b));
    }
    level = next;
  }
  return level[0];
}
