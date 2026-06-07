/**
 * Full Pipeline Demo
 *
 * Combines every Horizon primitive in one run, simulating a single
 * A11oy agent invocation:
 *   1. Open a PageCurveTracker
 *   2. Open internal+external WitnessChains
 *   3. Compute capacity horizon and recommendation
 *   4. Compute no-hair state at close
 *   5. Verify dual-witness
 *   6. Emit everything as OTel attributes (via stub)
 *
 *   npm run demo:full
 */

import {
  PageCurveTracker,
  WitnessChain,
  asLoopId,
  computeCapacityHorizon,
  computeNoHair,
  recommendFromHorizon,
  serializeNoHair,
  verifyDualWitness,
} from "../src/index.js";

const loopId = asLoopId("a11oy:agent:research-1");

// 1. Page-curve tracker
const tracker = new PageCurveTracker(loopId, { epsilon: 0.08 });
const internal = new WitnessChain("internal");
const external = new WitnessChain("external");

const work: number[] = [];
const obligations: number[] = [];
const inputCounts = new Map<string, number>();

// Open phase: high coupling
for (let t = 1; t <= 24; t++) {
  const s = t % 2 === 0 ? "explore" : "synthesize";
  tracker.observe(t, s, s);
  internal.append({
    tick: t,
    kind: "reasoning",
    payload: { phase: "open", note: s },
    externallyObservable: false,
  });
  if (t % 4 === 0) {
    internal.append({
      tick: t,
      kind: "tool_call",
      payload: { name: "search", q: `q${t}` },
      externallyObservable: true,
    });
    external.append({
      tick: t,
      kind: "tool_call",
      payload: { name: "search", q: `q${t}`, duration_ms: 100 + t },
      externallyObservable: true,
    });
    work.push(1.0);
    inputCounts.set(s, (inputCounts.get(s) ?? 0) + 1);
  }
  obligations.push(t % 8 === 0 ? -0.25 : 0); // discharge a quarter-unit every 8 ticks
}

// Close phase: convergence
for (let t = 25; t <= 96; t++) {
  tracker.observe(t, "closed", "void");
  if (t === 25) {
    internal.append({
      tick: t,
      kind: "close_signal",
      payload: { reason: "complete" },
      externallyObservable: true,
    });
    external.append({
      tick: t,
      kind: "close_signal",
      payload: { reason: "complete" },
      externallyObservable: true,
    });
  }
}

const pageCurve = tracker.close();
const dual = verifyDualWitness({ internal, external });
const capacity = computeCapacityHorizon(loopId, {
  boundaryCardinality: 4, // search, write, sentra-check, amaru-trace
  throughputPerSec: 8,
  minThroughputPerSec: 1,
});
const recommendation = recommendFromHorizon(capacity, tracker.current());
const noHair = computeNoHair({
  work,
  obligations,
  inputDistribution: inputCounts,
  tier: 2,
  witnessChain: internal.toArray(),
});

console.log("=== Page Curve ===");
console.log(`  clean        = ${pageCurve.clean}`);
console.log(`  peak bits    = ${pageCurve.pageEntropy.toFixed(4)} @ tick ${pageCurve.pageTick}`);
console.log(`  residual     = ${pageCurve.residualEntropy.toFixed(4)} bits (\u03b5=${pageCurve.epsilon})`);

console.log("\n=== Dual Witness ===");
console.log(`  consistent   = ${dual.consistent}`);
console.log(`  orphans      = ${dual.orphanedClaims.length}`);

console.log("\n=== Capacity Horizon ===");
console.log(`  C(\u2113)         = ${capacity.capacityBits.toFixed(4)} bits/tick`);
console.log(`  recommend    = ${recommendation}`);

console.log("\n=== No-Hair State ===");
console.log(`  ${serializeNoHair(noHair)}`);
