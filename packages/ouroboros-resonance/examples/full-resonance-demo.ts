/**
 * Full Resonance Demo
 *
 * Runs all five Tesla-derived primitives end-to-end against a simulated
 * two-loop handoff, including a Kuramoto fan-out coherence sweep.
 *
 *   npm run demo:full --workspace=@workspace/ouroboros-resonance
 */

import {
  AlertRuleRegistry,
  checkCadenceMatch,
  classifyCoherence,
  computeImpedance,
  computeQFactor,
  decoherenceWindowLength,
  impedanceVerdict,
  measureCadence,
  reflectionCoefficient,
  runKuramoto,
} from "../src/index.js";

console.log("=== R1. Cadence ===");
const eventsA = Array.from({ length: 30 }, (_, i) => ({ tick: i * 4 }));
const eventsB = Array.from({ length: 30 }, (_, i) => ({ tick: i * 4 + (i % 7 === 0 ? 1 : 0) })); // jitter
const cadA = measureCadence(eventsA);
const cadB = measureCadence(eventsB);
const match = checkCadenceMatch(cadA, cadB);
console.log(`  loop A f = ${cadA.frequency.toFixed(4)}/tick, jitter = ${cadA.jitter.toFixed(4)}`);
console.log(`  loop B f = ${cadB.frequency.toFixed(4)}/tick, jitter = ${cadB.jitter.toFixed(4)}`);
console.log(`  match    = ${match.matched}, fractional diff = ${match.fractionalDifference.toFixed(4)}`);

console.log("\n=== R2. Impedance ===");
const zA = computeImpedance({ boundaryCardinality: 4, stateCardinality: 8 });
const zB = computeImpedance({ boundaryCardinality: 6, stateCardinality: 6 });
const refl = reflectionCoefficient(zA, zB);
console.log(`  Z_A = ${zA.impedance.toFixed(4)}  Z_B = ${zB.impedance.toFixed(4)}`);
console.log(`  |Γ| = ${refl.magnitude.toFixed(4)}, η = ${refl.efficiency.toFixed(4)}, VSWR = ${refl.vswr.toFixed(2)}`);
console.log(`  verdict  = ${impedanceVerdict(refl)}`);

console.log("\n=== R3. Q-factor ===");
const q = computeQFactor({
  workUseful: 12,
  residualEntropyBits: 0.5,
  retryWork: 1,
  orphanWork: 0,
});
console.log(`  Q = ${q.Q.toFixed(4)}  workUseful = ${q.workUseful}  workLost = ${q.workLost}`);
console.log(`  verdict = ${q.verdict}`);

console.log("\n=== R4. Kuramoto coherence (fan-out of 16 agents) ===");
const oscillators = Array.from({ length: 16 }, (_, i) => ({
  phase: (2 * Math.PI * i) / 16,
  omega: 1 + 0.05 * Math.sin(i),
}));
const { state, rTrace } = runKuramoto(
  { oscillators, couplingK: 3 },
  300,
  0.05,
);
const finalR = rTrace[rTrace.length - 1]!;
console.log(`  initial r ≈ ${rTrace[0]!.toFixed(4)}`);
console.log(`  final   r = ${finalR.toFixed(4)} → ${classifyCoherence(finalR)}`);
console.log(`  longest decoherence window = ${decoherenceWindowLength(rTrace)} ticks`);
console.log(`  oscillator count preserved = ${state.oscillators.length}`);

console.log("\n=== R5. Peak-vs-RMS alerting ===");
const reg = new AlertRuleRegistry();
reg.register({
  id: "page_curve.residual",
  invariantClass: "safety",
  aggregator: "peak",
  threshold: 0.05,
  direction: "above",
});
reg.register({
  id: "loops.throughput",
  invariantClass: "throughput",
  aggregator: "mean",
  threshold: 0.5,
  direction: "below",
});
console.log(`  rules registered: ${reg.size()}`);
console.log(`  page_curve.residual fires on [0,0,0,0,0.2]: ${reg.evaluate("page_curve.residual", [0, 0, 0, 0, 0.2])}`);
console.log(`  page_curve.residual fires on [0,0,0,0,0.01]: ${reg.evaluate("page_curve.residual", [0, 0, 0, 0, 0.01])}`);
try {
  reg.register({
    id: "bad.safety.with.mean",
    invariantClass: "safety",
    aggregator: "mean",
    threshold: 0,
    direction: "above",
  });
  console.log("  ERROR: should have rejected mean-aggregator safety rule");
} catch (e) {
  console.log(`  correctly rejected illegal rule: ${(e as Error).message.slice(0, 70)}...`);
}
