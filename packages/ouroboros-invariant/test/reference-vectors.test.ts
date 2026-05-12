/**
 * reference-vectors.test.ts — bit-exact / within-tolerance assertions for
 * the Λ₉ golden vectors used by the Lean kernel proof, the platform
 * runtimes (a11oy / amaru / sentra), and any out-of-tree consumer.
 *
 * The same JSON file is consumed by Lean (`lake exe ref_vectors`) so that
 * the kernel-verified definition and the production TypeScript runtime
 * compute identical values on every CI build.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { lutarInvariant9 } from "../src/lutar-invariant-9.js";

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
  generatedAt: string;
  source: string;
  toleranceAbs: number;
  toleranceRel: number;
  vectors: RefVector[];
}

const path = resolve(__dirname, "..", "reference-vectors", "reference-vectors.json");
const data = JSON.parse(readFileSync(path, "utf8")) as RefFile;

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

describe("Λ₉ reference vectors — TS canonical reproducibility", () => {
  it(`has the expected schema (k=${data.k}, formula=${data.formula})`, () => {
    expect(data.k).toBe(9);
    expect(data.formula).toBe("Λ_k(x) = (∏ xᵢ)^(1/k)");
    expect(data.vectors.length).toBeGreaterThanOrEqual(10);
  });

  for (const v of data.vectors) {
    it(`vector "${v.id}" — bit-exact Λ₉ reproduction`, () => {
      const out = lutarInvariant9(axesFromArray(v.axes));
      // Bit-exact (same Math.exp(Σ log) ⇒ same IEEE-754 result)
      expect(out.invariant).toBe(v.lambda);
      expect(out.bound.lower).toBe(v.bound.lower);
      expect(out.bound.upper).toBe(v.bound.upper);
    });
  }

  it("every vector lies within its bound (Λ-bound theorem holds empirically)", () => {
    for (const v of data.vectors) {
      expect(v.lambda).toBeGreaterThanOrEqual(v.bound.lower - 1e-12);
      expect(v.lambda).toBeLessThanOrEqual(v.bound.upper + 1e-12);
    }
  });
});
