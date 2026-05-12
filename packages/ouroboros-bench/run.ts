/**
 * Ouroboros benchmark suite.
 * Run: `npm run bench`
 */

import { computeMerkleRoot } from "../anchor/src/index.ts";
import {
  computeImpedance,
  reflectionCoefficient,
  computeQFactor,
  orderParameter,
  stepKuramoto,
} from "../resonance/src/index.ts";

function bench(name: string, fn: () => void, iters = 1) {
  const t0 = performance.now();
  for (let i = 0; i < iters; i++) fn();
  const ms = performance.now() - t0;
  return { name, ms, opsPerSec: Math.round((iters / ms) * 1000) };
}

const results: Array<{ name: string; ms: number; opsPerSec: number }> = [];

const leaves = Array.from({ length: 100_000 }, (_, i) => `leaf-${i}`);
results.push(bench("merkle-root x 100k leaves (1 run)", () => computeMerkleRoot(leaves)));

const z1 = computeImpedance({ boundaryCardinality: 10, stateCardinality: 5 });
const z2 = computeImpedance({ boundaryCardinality: 12, stateCardinality: 4 });
results.push(bench("reflection-coefficient", () => reflectionCoefficient(z1, z2), 100_000));

results.push(
  bench(
    "q-factor",
    () => computeQFactor({ workUseful: 100 + Math.random(), residualEntropyBits: 10 + Math.random() }),
    100_000
  )
);

const oscs = Array.from({ length: 1000 }, (_, i) => ({
  id: `o${i}`,
  phase: Math.random() * 2 * Math.PI,
  naturalFrequency: 1 + Math.random() * 0.1,
}));
let state = { oscillators: oscs, couplingK: 4.0 } as const;
results.push(
  bench(
    "kuramoto-step n=1000",
    () => {
      state = stepKuramoto(state, 0.01) as any;
    },
    100
  )
);

results.push(bench("order-parameter n=1000", () => orderParameter(state.oscillators), 10_000));

console.log("\nOuroboros benchmark results");
console.log("============================");
for (const r of results) {
  console.log(
    `  ${r.name.padEnd(40)} ${r.ms.toFixed(1).padStart(8)} ms   ${r.opsPerSec.toLocaleString().padStart(12)} ops/s`
  );
}
console.log("");
