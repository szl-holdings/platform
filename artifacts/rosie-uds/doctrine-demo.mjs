#!/usr/bin/env node
// ROSIE.UDS — 30-second post-deploy harness.
// Exercises every invariant: admission, contradiction detection,
// governed emit, hash-chained receipts, coverage witness.
import {
  admit,
  detectContradictions,
  emit,
  chainReceipts,
  verifyChain,
  coverage,
} from "./lib/index.mjs";

const policies = [
  { id: "P1", subject: "operator", action: "read", effect: "allow", reason: "operators may read" },
  { id: "P2", subject: "operator", action: "write", effect: "allow", reason: "operators may write" },
  { id: "P3", subject: "guest",    action: "read", effect: "allow", reason: "guests may read" },
  { id: "P4", subject: "guest",    action: "write", effect: "deny",  reason: "guests may not write" },
];

const events = [
  { subject: "operator", action: "read" },
  { subject: "operator", action: "write" },
  { subject: "guest",    action: "read" },
  { subject: "guest",    action: "write" },
  { subject: "stranger", action: "read" },
];

console.log("========================================================================");
console.log("  ROSIE.UDS doctrine-demo");
console.log("========================================================================");

console.log("\n[1] Admission gate (deny-by-default):");
for (const e of events) {
  const d = admit(e, policies);
  console.log(`  ${e.subject.padEnd(9)} ${e.action.padEnd(6)} -> ${d.effect.toUpperCase().padEnd(5)} ${d.reason}`);
}

console.log("\n[2] Contradictions:");
const c = detectContradictions(policies);
console.log(`  ${c.length} contradiction(s)`);
if (c.length > 0) process.exit(1);

console.log("\n[3] Governed emit:");
const decisions = events.map((e) => emit(e, policies));
for (const d of decisions) {
  console.log(`  ${d.ts}  ${d.event.subject}/${d.event.action} -> ${d.decision.toUpperCase()}  (${d.witness.policy_id})`);
}

console.log("\n[4] Hash-chained receipts:");
const chain = chainReceipts(decisions);
console.log(`  links=${chain.links.length}  head=${chain.head.slice(0, 12)}…`);
console.log(`  verifyChain = ${verifyChain(chain)}`);
if (!verifyChain(chain)) process.exit(1);

console.log("\n[5] Coverage witness:");
const cov = coverage(events, policies);
console.log(`  total=${cov.total}  uncovered=${cov.uncovered.length} (${cov.uncovered.map((e) => e.subject + "/" + e.action).join(", ")})`);

console.log("\n========================================================================");
console.log("  ROSIE.UDS doctrine-demo: COMPLETE");
console.log("========================================================================");
console.log("  Posture = deny-by-default | witness = mandatory | chain = sha256");
console.log("  Exit code: 0");
