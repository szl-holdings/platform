/**
 * The Lutar Invariant — live demo of the runtime-trust scalar.
 *
 *   tsx examples/lutar-invariant-demo.ts
 */

import {
  lutarInvariant,
  defaultWeights,
  inspectableWeight,
  verifyLutarBound,
  type LutarAxes,
  type LutarWeights,
} from "../src/lutar-invariant.ts";

console.log("\n=== The Lutar Invariant Λ ===\n");

// Default Egyptian weights {1/4, 1/4, 1/4, 1/4}
const axes: LutarAxes = {
  cleanliness: 0.99,
  horizon: 0.85,
  resonance: 0.72,
  frustum: 0.95,
};

const r1 = lutarInvariant(axes);
console.log("Default weights {1/4, 1/4, 1/4, 1/4}");
console.log("  axes:", axes);
console.log("  Λ =", r1.invariant.toFixed(6));
console.log("  formula:", r1.proof.formula);
console.log("  bound: 0 ≤ Λ ≤", r1.proof.bound.upper);
console.log("  weight sum exact:", r1.proof.weightSumExact);
console.log("  bound theorem holds:", verifyLutarBound(r1));

// Rhind-style alternative {1/2, 1/4, 1/8, 1/8}
const rhind: LutarWeights = {
  cleanliness: inspectableWeight(1, 2),
  horizon: inspectableWeight(1, 4),
  resonance: inspectableWeight(1, 8),
  frustum: inspectableWeight(1, 8),
};
const r2 = lutarInvariant(axes, rhind);
console.log("\nRhind weights {1/2, 1/4, 1/8, 1/8} (cleanliness-dominant)");
console.log("  Λ =", r2.invariant.toFixed(6));
console.log("  formula:", r2.proof.formula);

// Zero-pinning demonstration
const zeroFrustum: LutarAxes = { ...axes, frustum: 0 };
const r3 = lutarInvariant(zeroFrustum);
console.log("\nZero-pinning (axiom A2): one axis = 0");
console.log("  Λ =", r3.invariant, "(must be exactly 0)");

// Concavity along a release trajectory
console.log("\nPage-curve concavity along release:");
for (let t = 0; t <= 10; t++) {
  const x = t / 10;
  const r = lutarInvariant({ cleanliness: x, horizon: x, resonance: x, frustum: x });
  console.log(`  t=${t.toString().padStart(2, " ")}  Λ = ${r.invariant.toFixed(4)}`);
}

console.log("\n=== Done ===\n");
