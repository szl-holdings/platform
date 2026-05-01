/**
 * Three-product integration demo — A11oy, Amaru, Sentra.
 *
 *   tsx examples/three-product-demo.ts
 */

import { reconcileHandoff, auditFleetHandoffs } from "../src/a11oy.ts";
import { AmaruFleetMonitor, auditThreshold } from "../src/amaru.ts";
import { SentraHSMAnchor } from "../src/sentra.ts";

console.log("\n=== Ouroboros v3.1 — A11oy / Amaru / Sentra Demo ===\n");

// A11oy
console.log("A11oy: agent fleet handoff");
const a11 = reconcileHandoff({
  handoffId: "h1",
  fromAgent: "claude",
  toAgent: "gpt5",
  observerAgent: "perplexity",
  fromLeaves: ["task1", "task2", "task3"],
  toLeaves: ["task1", "task2", "task3"],
  observerLeaves: ["task1", "task2", "task3"],
  timestamp: Date.now(),
});
console.log("  verdict:", a11.verdict, "→", a11.action);
console.log("  formula:", a11.formula);

const fleet = auditFleetHandoffs([
  {
    handoffId: "h1",
    fromAgent: "a",
    toAgent: "b",
    observerAgent: "c",
    fromLeaves: ["x"],
    toLeaves: ["x"],
    observerLeaves: ["x"],
    timestamp: 1,
  },
  {
    handoffId: "h2",
    fromAgent: "a",
    toAgent: "b",
    observerAgent: "c",
    fromLeaves: ["x", "y"],
    toLeaves: ["x"],
    observerLeaves: ["x"],
    timestamp: 2,
  },
]);
console.log(
  `  fleet: ${fleet.stats.reconciled}/${fleet.stats.total} reconciled (${(fleet.stats.reconciliationRate * 100).toFixed(0)}%)`
);

// Amaru
console.log("\nAmaru: fleet seked + threshold inspection");
const monitor = new AmaruFleetMonitor();
for (let t = 0; t < 5; t++) {
  const sig = monitor.observe({ metricId: "cpu", horizontal: 1, vertical: 2, timestamp: t });
  if (t === 4) console.log("  cpu signal:", sig.recommendation, `(${sig.degrees.toFixed(2)}°)`);
}
const audit = auditThreshold(2, 7);
console.log("  threshold 2/7:", audit.explanation, "inspectable:", audit.inspectable);

// Sentra
console.log("\nSentra: HSM-anchored governance accumulator");
const anchor = new SentraHSMAnchor();
const events = Array.from({ length: 10 }, (_, i) => ({
  eventId: `e${i}`,
  leafHash: BigInt(i + 1) * 100n,
  timestamp: i,
}));
anchor.appendBatch(events);
const snap = anchor.snapshot();
console.log(`  accumulator after ${snap.eventCount} events: 0x${snap.accumulator.toString(16).slice(0, 32)}…`);
const reDerived = SentraHSMAnchor.reDerive(events);
console.log("  re-derivation matches HSM:", reDerived === snap.accumulator);

console.log("\n=== Done ===\n");
