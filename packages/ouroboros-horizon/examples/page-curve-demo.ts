/**
 * Page Curve Demo
 *
 * Simulates a bounded loop closing cleanly. Prints the entropy series
 * tick-by-tick and the final PageCurveResult. Run:
 *
 *   npm run demo:page-curve
 */

import { PageCurveTracker, asLoopId } from "../src/index.js";

const tracker = new PageCurveTracker(asLoopId("demo:bounded:1"), {
  epsilon: 0.1,
});

console.log("tick\tloop_state\tenv_state\tentropy_bits");

// Phase 1: rising — loop and environment exchange information.
for (let t = 1; t <= 32; t++) {
  const loopState = t % 2 === 0 ? "even" : "odd";
  const envState = loopState; // perfectly correlated → high MI
  const point = tracker.observe(t, loopState, envState);
  console.log(`${t}\t${loopState}\t\t${envState}\t\t${point.entropy.toFixed(4)}`);
}

// Phase 2: falling — loop converges to a canonical "closed" state. The
// environment also reduces to a single observable. Entanglement → 0.
for (let t = 33; t <= 96; t++) {
  const loopState = "closed";
  const envState = "void";
  const point = tracker.observe(t, loopState, envState);
  if (t % 8 === 0) {
    console.log(`${t}\t${loopState}\t\t${envState}\t\t${point.entropy.toFixed(4)}`);
  }
}

const result = tracker.close();
console.log("\nResult:");
console.log(`  clean              = ${result.clean}`);
console.log(`  page tick          = ${result.pageTick}`);
console.log(`  page entropy bits  = ${result.pageEntropy.toFixed(4)}`);
console.log(`  residual entropy   = ${result.residualEntropy.toFixed(4)} bits`);
console.log(`  monotonic rise     = ${result.monotonicRise}`);
console.log(`  monotonic fall     = ${result.monotonicFall}`);
console.log(`  ε threshold        = ${result.epsilon}`);
