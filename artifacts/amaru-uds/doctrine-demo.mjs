#!/usr/bin/env node
// Amaru.UDS — doctrine-demo.mjs
// Post-deploy harness. Imports the shipped lib/index.mjs and exercises every
// doctrine pillar end-to-end. ~30 seconds, no infra, zero deps.
//
// Usage:
//   node doctrine-demo.mjs <lib-dir>
// where <lib-dir> contains index.mjs from the unpacked Zarf package.

import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const libDir = (process.argv[2] || "./lib").replace(/\/$/, "");
const m = await import(pathToFileURL(resolve(libDir, "index.mjs")).href);
const {
  lutarSigma, lutarEnvelope, LAMBDA_FLOOR, normalizedRisk, klDivergence,
  bekensteinAdmit, boundedLoop, V6_AXES, nineAxisGate,
  appendReceipt, verifyChain, sha256Hex, DOCTRINE,
} = m;

const banner = (s) => console.log("\n" + "=".repeat(72) + "\n  " + s + "\n" + "=".repeat(72));
const ok = (n, d = "") => console.log(`  PASS ${n}${d ? " -- " + d : ""}`);
const bad = (n, d = "") => { console.log(`  FAIL ${n}${d ? " -- " + d : ""}`); process.exitCode = 1; };

banner("Amaru.UDS doctrine-demo  |  V6  |  Andean Ouroboros convergent sync");
console.log("  doctrine =", JSON.stringify(DOCTRINE));

banner("1. LUTAR SIGMA  (canonical composition P^1/2 · K^1/4 · Φ^1/8 · C^1/8)");
const sig = lutarSigma({ P: 0.98, K: 0.95, Phi: 0.92, C: 0.90 });
sig > 0 && sig <= 1 ? ok(`Σ = ${sig.toFixed(4)}  in (0,1]`) : bad("Σ out of range");
const env = lutarEnvelope({ P: 0.98, K: 0.95, Phi: 0.92, C: 0.90 });
env.lo <= sig && sig <= env.hi ? ok(`envelope encloses Σ`, `[${env.lo.toFixed(4)}, ${env.hi.toFixed(4)}]`)
                                : bad(`envelope does not enclose Σ=${sig}`);
try { lutarSigma({ P: -0.1, K: 0.5, Phi: 0.5, C: 0.5 }); bad("negative P should throw"); }
catch (e) { ok("negative axis throws", e.message); }

banner("2. NORMALIZED RISK Lambda  (floor " + LAMBDA_FLOOR + ", HUKLLA halt)");
const L_hi = normalizedRisk({ severity: 1.0,  likelihood: 1.0,  valueAtRisk: 950_000 });
const L_lo = normalizedRisk({ severity: 0.5,  likelihood: 0.5,  valueAtRisk: 100_000 });
L_hi >= LAMBDA_FLOOR ? ok(`Λ=${L_hi.toFixed(3)} ≥ floor → HALT-eligible (HUKLLA)`)
                      : bad(`Λ=${L_hi.toFixed(3)} should be ≥ floor`);
L_lo <  LAMBDA_FLOOR ? ok(`Λ=${L_lo.toFixed(3)} < floor → ADMIT`)
                      : bad(`Λ=${L_lo.toFixed(3)} should be < floor`);

banner("3. KL DIVERGENCE  (drift detector, asymmetric)");
const d_pp = klDivergence([0.5, 0.5], [0.5, 0.5]);
Math.abs(d_pp) < 1e-9 ? ok(`D(p‖p) ≈ 0`, `${d_pp.toExponential(2)}`) : bad("D(p‖p) not zero");
const d_shift = klDivergence([0.7, 0.3], [0.3, 0.7]);
const d_rev   = klDivergence([0.3, 0.7], [0.7, 0.3]);
d_shift > 0 && d_rev > 0 ? ok(`D > 0 on shift`, `D(p‖q)=${d_shift.toFixed(3)}  D(q‖p)=${d_rev.toFixed(3)}`)
                          : bad("KL not positive on shift");

banner("4. BEKENSTEIN ADMISSION GATE  (S ≤ 2π R E / ℏc, scaled)");
const small = bekensteinAdmit({ infoBits: 8, radius: 1.0, energy: 4.0 });
small.admit ? ok(`8 bits @ R=1 E=4 → ADMIT`, `bitsAllowed=${small.bitsAllowed}`)
            : bad("small payload should admit");
const big = bekensteinAdmit({ infoBits: 1_000_000, radius: 1.0, energy: 4.0 });
!big.admit ? ok(`1M bits @ R=1 E=4 → REFUSE`, `bitsAllowed=${big.bitsAllowed}`)
           : bad("big payload should refuse");

banner("5. BOUNDED-LOOP CONVERGENCE  (monotone-score + max-depth)");
const conv = boundedLoop({
  initial: 100,
  step: (s) => ({ next: s / 2, score: s }),
  maxDepth: 64, tol: 1e-9,
});
conv.status === "converged" ? ok(`converged at depth ${conv.depth}`, `score=${conv.score.toExponential(2)}`)
                             : bad(`expected converged, got ${conv.status}`);
const div = boundedLoop({
  initial: 1,
  step: (s) => ({ next: s * 2, score: s * 2 }),
  maxDepth: 8,
});
div.status === "diverged" ? ok(`diverged correctly at depth ${div.depth}`)
                           : bad(`expected diverged, got ${div.status}`);

banner("6. 9-AXIS AND GATE  (V6: every axis must pass)");
const allPass = Object.fromEntries(V6_AXES.map(a => [a, { pass: true, score: 1.0, floor: 0.9 }]));
const r1 = nineAxisGate(allPass);
r1.pass ? ok("all 9 axes pass → ALLOW") : bad("9-axis gate failed when all pass");
const oneFail = { ...allPass, lambda_risk: { pass: false, score: 0.5, floor: 0.9 } };
const r2 = nineAxisGate(oneFail);
!r2.pass && r2.failingAxes.includes("lambda_risk")
  ? ok("single-axis failure → BLOCK", `failing=${r2.failingAxes.join(",")}`)
  : bad("9-axis gate did not block on lambda_risk failure");

banner("7. HASH-CHAINED PROOF RECEIPTS  (sha256 chain over delta-logs)");
let chain = [];
chain = appendReceipt(chain, { ts: "2026-05-26T00:00:00Z", source: "ledger-A", deltaLog: ["+row:42"] });
chain = appendReceipt(chain, { ts: "2026-05-26T00:00:01Z", source: "ledger-B", deltaLog: ["+row:43", "-row:9"] });
chain = appendReceipt(chain, { ts: "2026-05-26T00:00:02Z", source: "ledger-A", deltaLog: ["update:42→42.1"] });
const v = verifyChain(chain);
v.valid ? ok(`chain valid, length=${v.length}`, `head=${chain[chain.length-1].hash.slice(0,16)}…`)
        : bad(`chain invalid at ${v.brokenAt}: ${v.reason}`);
const tampered = chain.map(r => ({ ...r }));
tampered[1].deltaLog = ["+row:43", "-row:8"]; // tamper without rehashing
const vT = verifyChain(tampered);
!vT.valid ? ok(`tamper detected at index ${vT.brokenAt}`, `reason=${vT.reason}`)
          : bad("tamper not detected");

banner("8. LIVE SYNC VERDICT TABLE  (5 synthetic source-priority reconciliations)");
const cases = [
  { src: "ledger-A", action: "merge",   sev: 0.3, lik: 0.4, var: 20_000 },
  { src: "ledger-B", action: "merge",   sev: 0.9, lik: 0.9, var: 950_000 },
  { src: "ledger-C", action: "promote", sev: 0.5, lik: 0.7, var: 200_000 },
  { src: "ledger-D", action: "rollback",sev: 0.95,lik: 0.95,var: 990_000 },
  { src: "ledger-E", action: "merge",   sev: 0.1, lik: 0.2, var: 5_000 },
];
console.log("\n  source       action    Λ        verdict      reason");
console.log("  " + "-".repeat(64));
for (const c of cases) {
  const L = normalizedRisk({ severity: c.sev, likelihood: c.lik, valueAtRisk: c.var });
  const verdict = L >= LAMBDA_FLOOR ? "HALT (HUKLLA)" : "ADMIT";
  console.log(`  ${c.src.padEnd(12)} ${c.action.padEnd(9)} ${L.toFixed(3).padEnd(8)} ${verdict.padEnd(12)} Λ ${L >= LAMBDA_FLOOR ? "≥" : "<"} ${LAMBDA_FLOOR}`);
}

banner("Amaru.UDS doctrine-demo: COMPLETE");
console.log("  Doctrine =", DOCTRINE.version, "| Λ floor =", LAMBDA_FLOOR, "| halt authority =", DOCTRINE.haltAuthority);
console.log("  All pillars exercised. Exit code:", process.exitCode || 0);
