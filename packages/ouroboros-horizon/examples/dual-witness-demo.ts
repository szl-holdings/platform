/**
 * Dual-Witness Demo
 *
 * Simulates an A11oy agent invocation that produces both an internal
 * reasoning trace and an external auditor trace. Demonstrates a clean
 * close, then a forced complementarity violation. Run:
 *
 *   npm run demo:dual-witness
 */

import { WitnessChain, verifyDualWitness } from "../src/index.js";

console.log("== Scenario 1: clean dual-witness ==");
{
  const internal = new WitnessChain("internal");
  const external = new WitnessChain("external");

  internal.append({
    tick: 1,
    kind: "reasoning",
    payload: { thought: "user wants weather" },
    externallyObservable: false,
  });
  internal.append({
    tick: 2,
    kind: "tool_call",
    payload: { name: "weather.get", city: "SF" },
    externallyObservable: true,
  });

  external.append({
    tick: 2,
    kind: "tool_call",
    payload: { name: "weather.get", city: "SF", duration_ms: 142 },
    externallyObservable: true,
  });
  external.append({
    tick: 3,
    kind: "response_emit",
    payload: { tokens: 28 },
    externallyObservable: true,
  });

  const r = verifyDualWitness({ internal, external });
  console.log(`  consistent       = ${r.consistent}`);
  console.log(`  orphaned claims  = ${r.orphanedClaims.length}`);
  console.log(`  range            = [${r.range.from}, ${r.range.to}]`);
}

console.log("\n== Scenario 2: complementarity violation ==");
{
  const internal = new WitnessChain("internal");
  const external = new WitnessChain("external");

  // The agent claims it called a tool, but the auditor saw no such call.
  internal.append({
    tick: 5,
    kind: "tool_call",
    payload: { name: "secrets.read", path: "/etc/shadow" },
    externallyObservable: true,
  });
  // External chain has only innocuous activity.
  external.append({
    tick: 5,
    kind: "log_emit",
    payload: { line: "starting" },
    externallyObservable: true,
  });

  const r = verifyDualWitness({ internal, external });
  console.log(`  consistent       = ${r.consistent}`);
  console.log(`  orphaned claims  = ${r.orphanedClaims.length}`);
  for (const o of r.orphanedClaims) {
    console.log(
      `    orphan @tick=${o.tick} kind=${o.kind} payload=${JSON.stringify(o.payload)}`,
    );
  }
}
