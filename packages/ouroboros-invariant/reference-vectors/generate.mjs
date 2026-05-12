#!/usr/bin/env node
/**
 * Generate reference vectors for Λ₉.
 *
 * Output:
 *   reference-vectors.json — { vectors: [{ id, axes: [9 numbers], lambda: number }, ...] }
 *
 * The TS / Python / Lean implementations must all reproduce `lambda` for the
 * given `axes` to bit precision (or within the documented epsilon for any
 * runtime that legitimately differs in floating-point semantics).
 *
 * Generated from the canonical implementation at
 *   ../src/lutar-invariant-9.ts  (computeLambda → exp((1/k) Σ log xᵢ))
 *
 * which is mathematically Λ_k(x) = (∏ xᵢ)^(1/k).
 */
import { lutarInvariant9 } from "../src/lutar-invariant-9.ts";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const A = (cleanliness, horizon, resonance, frustum, gaussClosure, invariance, moralGrounding, ontologicalGrounding, measurabilityHonesty) => ({
  cleanliness, horizon, resonance, frustum, gaussClosure, invariance, moralGrounding, ontologicalGrounding, measurabilityHonesty,
});

const cases = [
  { id: "uniform-0_9", axes: A(0.9,0.9,0.9,0.9,0.9,0.9,0.9,0.9,0.9) },
  { id: "uniform-0_5", axes: A(0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5) },
  { id: "uniform-0_1", axes: A(0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1) },
  { id: "ascending", axes: A(0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9) },
  { id: "descending", axes: A(0.9,0.8,0.7,0.6,0.5,0.4,0.3,0.2,0.1) },
  { id: "one-zero", axes: A(0.9,0.9,0.9,0.9,0.0,0.9,0.9,0.9,0.9) },
  { id: "all-ones", axes: A(1,1,1,1,1,1,1,1,1) },
  { id: "tiny-perturbation", axes: A(0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.500001) },
  { id: "ground-truth-mirror-eval", axes: A(0.95,0.95,0.95,0.95,0.95,0.95,0.98,0.99,0.96) },
  { id: "noisy-borderline", axes: A(0.45,0.46,0.47,0.48,0.49,0.5,0.51,0.52,0.53) },
];

const vectors = cases.map((c) => {
  const r = lutarInvariant9(c.axes);
  return {
    id: c.id,
    axes: [
      c.axes.cleanliness,
      c.axes.horizon,
      c.axes.resonance,
      c.axes.frustum,
      c.axes.gaussClosure,
      c.axes.invariance,
      c.axes.moralGrounding,
      c.axes.ontologicalGrounding,
      c.axes.measurabilityHonesty,
    ],
    lambda: r.invariant,
    bound: r.bound,
  };
});

const out = {
  schema: "https://szlholdings.com/schemas/lutar-reference-vectors-v1.json",
  formula: "Λ_k(x) = (∏ xᵢ)^(1/k)",
  k: 9,
  generatedAt: new Date().toISOString(),
  source: "@workspace/ouroboros-invariant lutarInvariant9 (TS canonical)",
  // The TS implementation uses exp((1/k) Σ log xᵢ) which agrees with the
  // mathematical formula to within IEEE-754 floating-point precision.
  toleranceAbs: 1e-12,
  toleranceRel: 1e-9,
  vectors,
};

const path = resolve(__dirname, "reference-vectors.json");
writeFileSync(path, JSON.stringify(out, null, 2) + "\n");
console.log(`wrote ${path} — ${vectors.length} vectors`);
