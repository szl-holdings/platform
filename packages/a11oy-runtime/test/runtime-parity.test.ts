/**
 * runtime-parity.test.ts — Λ₉ bit-exact parity across the three runtimes.
 *
 * a11oy / amaru / sentra all consume @workspace/ouroboros-invariant
 * (re-exported from their own entry points). This test asserts that the
 * Λ₉ value computed via each runtime's *own* re-exported binding agrees
 * bit-for-bit with the canonical source AND with the Lean-verified
 * reference vectors in
 *   ../../ouroboros-invariant/reference-vectors/reference-vectors.json
 *
 * The point is not novelty — it is a continuously enforced invariant:
 * if any runtime ever forks Λ₉ (replaces with an approximation, swaps
 * weighting, etc.) this test fails immediately.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { lutarInvariant9 as a11oyLambda } from "@workspace/ouroboros-invariant";
import { lutarInvariant9 as amaruLambda } from "@workspace/amaru-runtime";
import { lutarInvariant9 as sentraLambda } from "@workspace/sentra-runtime";

interface RefVector {
  id: string;
  axes: number[];
  lambda: number;
  bound: { lower: number; upper: number };
}
interface RefFile {
  schema: string;
  formula: string;
  k: number;
  vectors: RefVector[];
}

const refPath = resolve(
  __dirname,
  "..",
  "..",
  "ouroboros-invariant",
  "reference-vectors",
  "reference-vectors.json",
);
const data = JSON.parse(readFileSync(refPath, "utf8")) as RefFile;

function axesFromArray(a: number[]) {
  return {
    cleanliness: a[0]!,
    horizon: a[1]!,
    resonance: a[2]!,
    frustum: a[3]!,
    gaussClosure: a[4]!,
    invariance: a[5]!,
    moralGrounding: a[6]!,
    ontologicalGrounding: a[7]!,
    measurabilityHonesty: a[8]!,
  };
}

describe("Λ₉ runtime-parity — a11oy / amaru / sentra agree bit-exact", () => {
  for (const v of data.vectors) {
    it(`vector "${v.id}" — three runtimes return the same Λ₉ as the golden value`, () => {
      const axes = axesFromArray(v.axes);
      const a = a11oyLambda(axes).invariant;
      const b = amaruLambda(axes).invariant;
      const c = sentraLambda(axes).invariant;
      // All three runtimes share one symbol — must agree bit-exact.
      expect(a).toBe(b);
      expect(b).toBe(c);
      // And must equal the golden value (generated from the same symbol).
      expect(a).toBe(v.lambda);
    });
  }

  it(`registry-sealing: each runtime re-exports lutarInvariant9 from @workspace/ouroboros-invariant`, () => {
    // Reference identity check — they ARE the same function object.
    expect(amaruLambda).toBe(a11oyLambda);
    expect(sentraLambda).toBe(a11oyLambda);
  });
});
