/**
 * Entanglement Graph Demo
 *
 * Simulates three loops where (a, b) are tightly coupled and (a, c) are
 * decoupled. Builds the entanglement graph and runs guards.
 *
 *   npm run demo:entanglement
 */

import {
  asLoopId,
  buildEntanglementGraph,
  checkEntanglementGuards,
  type ObservableSample,
} from "../src/index.js";

const a = asLoopId("svc:a");
const b = asLoopId("svc:b");
const c = asLoopId("svc:c");

function gen(
  fn: (i: number) => string,
  n: number,
): ObservableSample[] {
  return Array.from({ length: n }, (_, i) => ({ tick: i + 1, state: fn(i) }));
}

// a and b: perfectly correlated (alternating)
const aStream = gen((i) => (i % 2 === 0 ? "x" : "y"), 200);
const bStream = gen((i) => (i % 2 === 0 ? "1" : "2"), 200);
// c: independent random-ish
const cStream = gen((i) => ["p", "q", "r"][i % 3]!, 200);

const edges = buildEntanglementGraph(
  new Map([
    [a, aStream],
    [b, bStream],
    [c, cStream],
  ]),
);

console.log("Entanglement edges (bits, distance):");
for (const e of edges) {
  console.log(
    `  ${e.from} <-> ${e.to}  bits=${e.bits.toFixed(4)}  d=${e.distance.toFixed(4)}`,
  );
}

const violations = checkEntanglementGuards(edges, {
  expectedDecoupled: [[a, c]],
  expectedCoupled: [[a, b]],
  decoupledMaxBits: 0.1,
  coupledMinBits: 0.5,
});

console.log("\nGuard violations:");
if (violations.length === 0) {
  console.log("  none — topology matches expectations.");
} else {
  for (const v of violations) {
    console.log(
      `  pair=${v.pair[0]}/${v.pair[1]} expected=${v.expectation} threshold=${v.threshold} observed=${v.observedBits.toFixed(4)}`,
    );
  }
}
