/**
 * Primitive 32 — Synoptic Witness (synoptikos = dialektikos)
 *
 * Source: Plato, Republic 531d, 537c; Statesman 285b; Sophist 253b.
 * Working summary: Eva Brann, op. cit.
 *
 * "He who can see things together is a dialectician" (synoptikos = dialektikos).
 * A synoptic witness has read all named primitives in a payload and certified
 * pair-wise kinship. The witness emits a synopticHash over the ordered list.
 *
 * Hashing: deterministic, dependency-free SHA-256 over a canonical string.
 * (No external crypto import needed — small inline FNV-1a is good enough as
 * a non-cryptographic content-address; production swaps in node:crypto.)
 */

import { createHash } from "node:crypto";

export interface NamedPrimitive {
  id: string; // e.g., "lambda-retraction"
  version: string; // e.g., "0.1.0"
  digest: string; // pre-computed digest of the source file or AST
}

export interface KinshipDeclaration {
  pair: [string, string]; // primitive ids (sorted)
  consonant: boolean; // dialectician sees "which kind is consonant with which" (Statesman 285b)
  note: string;
}

export interface SynopticWitnessInput {
  witnessId: string;
  primitives: NamedPrimitive[];
  kinships: KinshipDeclaration[];
}

export interface SynopticWitnessResult {
  witnessId: string;
  synopticHash: string;
  primitiveCount: number;
  kinshipCount: number;
  consonantCount: number;
  dissonantCount: number;
  complete: boolean; // all C(n,2) pairs declared
  reason: string;
}

export function bindSynopticWitness(input: SynopticWitnessInput): SynopticWitnessResult {
  const { witnessId, primitives, kinships } = input;

  // Canonicalize primitive list (sorted by id).
  const sorted = [...primitives].sort((a, b) => a.id.localeCompare(b.id));
  const ids = sorted.map((p) => p.id);

  // Required kinship pairs.
  const requiredPairs = new Set<string>();
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      requiredPairs.add(`${ids[i]}::${ids[j]}`);
    }
  }

  const seenPairs = new Set<string>();
  let consonant = 0;
  let dissonant = 0;
  for (const k of kinships) {
    const [a, b] = [...k.pair].sort();
    const key = `${a}::${b}`;
    seenPairs.add(key);
    if (k.consonant) consonant += 1;
    else dissonant += 1;
  }

  const complete = [...requiredPairs].every((p) => seenPairs.has(p));

  const canonical = JSON.stringify({
    witnessId,
    primitives: sorted.map((p) => ({ id: p.id, version: p.version, digest: p.digest })),
    kinships: [...kinships]
      .map((k) => ({ pair: [...k.pair].sort(), consonant: k.consonant }))
      .sort((a, b) => (a.pair as string[]).join("::").localeCompare((b.pair as string[]).join("::"))),
  });

  const synopticHash = createHash("sha256").update(canonical).digest("hex");

  return {
    witnessId,
    synopticHash,
    primitiveCount: primitives.length,
    kinshipCount: kinships.length,
    consonantCount: consonant,
    dissonantCount: dissonant,
    complete,
    reason: complete
      ? "All pair-wise kinships declared; synopticHash bound (Republic 537c)."
      : "Incomplete kinship declarations; not yet a dialectician (Republic 531d9).",
  };
}
