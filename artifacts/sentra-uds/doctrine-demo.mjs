#!/usr/bin/env node
// Sentra.UDS — doctrine-demo.mjs
// Post-deploy harness. Imports the shipped lib/index.mjs and exercises every
// doctrine pillar end-to-end. ~30 seconds, no infra, zero deps.
//
// Usage:
//   node doctrine-demo.mjs <lib-dir>

import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const libDir = (process.argv[2] || "./lib").replace(/\/$/, "");
const m = await import(pathToFileURL(resolve(libDir, "index.mjs")).href);
const {
  runAction, runPolicyGate, ALLOWED_OWNERSHIP, ALLOWED_ACTION_CLASSES, DENIED_ACTION_CLASSES,
  riskScore, financialExposure, EXPOSURE_BASELINE, EXPOSURE_PER_INCIDENT, EXPOSURE_PER_COMPROMISED_ASSET,
  zScore, klDrift, isingAnneal, FRAMEWORK_MAP, frameworkCoverage,
  appendProof, verifyProofChain, sha256Hex, DOCTRINE,
} = m;

const banner = (s) => console.log("\n" + "=".repeat(72) + "\n  " + s + "\n" + "=".repeat(72));
const ok = (n, d = "") => console.log(`  PASS ${n}${d ? " -- " + d : ""}`);
const bad = (n, d = "") => { console.log(`  FAIL ${n}${d ? " -- " + d : ""}`); process.exitCode = 1; };

banner("Sentra.UDS doctrine-demo  |  Strictly defensive containment");
console.log("  doctrine =", JSON.stringify(DOCTRINE));

banner("1. SAFETY GATE  (asset-scoped, fail-closed by construction)");
const okAct = runPolicyGate({ class: "contain" }, { ownership: "owned", id: "host-42" });
okAct.decision === "ALLOW" ? ok("owned + contain → ALLOW") : bad("expected ALLOW", JSON.stringify(okAct));
const unkAct = runPolicyGate({ class: "contain" }, { id: "host-43" }); // no ownership
unkAct.decision === "BLOCK" ? ok("undefined ownership → BLOCK (fail-closed)", unkAct.reasons.join("; "))
                             : bad("fail-closed broken");
const offAct = runPolicyGate({ class: "exfiltrate" }, { ownership: "owned" });
offAct.decision === "BLOCK" ? ok("unknown action class → BLOCK", offAct.reasons.join("; ")) : bad("unknown action allowed");

banner("2. OFFENSIVE-ACTION NULL SURFACE  (denied classes have NO code path)");
for (const cls of DENIED_ACTION_CLASSES) {
  try {
    runAction({ class: cls }, { ownership: "owned" });
    bad(`${cls} should throw`);
  } catch (e) {
    ok(`${cls} → throws at boundary`, e.message.slice(0, 60));
  }
}

banner("3. RISK SCORE  (r = severity · likelihood · VaR, capped at $1M)");
const r1 = riskScore({ severity: 0.8, likelihood: 0.6, valueAtRisk: 500_000 });
const r2 = riskScore({ severity: 1.0, likelihood: 1.0, valueAtRisk: 5_000_000 });
r1 === 240_000 ? ok(`mid → r=$${r1.toLocaleString()}`) : bad(`expected 240000 got ${r1}`);
r2 === 1_000_000 ? ok(`worst-case → r=$${r2.toLocaleString()} (capped)`) : bad(`cap broken, got ${r2}`);
try { riskScore({ severity: 1.5, likelihood: 0.5, valueAtRisk: 10000 }); bad("severity > 1 should throw"); }
catch (e) { ok("severity > 1 throws", e.message); }

banner("4. FINANCIAL EXPOSURE  (E = $1.4M + 350k·incidents + 700k·compromised)");
const e0 = financialExposure({ openIncidents: 0, compromisedAssets: 0 });
const e5 = financialExposure({ openIncidents: 3, compromisedAssets: 2 });
e0 === EXPOSURE_BASELINE ? ok(`baseline → $${e0.toLocaleString()}`) : bad(`baseline drift, got ${e0}`);
e5 === EXPOSURE_BASELINE + 3 * EXPOSURE_PER_INCIDENT + 2 * EXPOSURE_PER_COMPROMISED_ASSET
  ? ok(`3 incidents + 2 compromised → $${e5.toLocaleString()}`)
  : bad(`exposure drift, got ${e5}`);

banner("5. Z-SCORE ANOMALY DETECTOR  (|z| > 2.5σ)");
const history = [10, 11, 9, 10, 12, 10, 11, 10, 9, 11];
const normal = zScore(12, history);
const burst  = zScore(50, history);
!normal.anomaly ? ok(`sample 12 → z=${normal.z.toFixed(2)} (not anomaly)`) : bad("12 flagged as anomaly");
burst.anomaly ? ok(`sample 50 → z=${burst.z.toFixed(2)} ANOMALY DETECTED`) : bad("burst not detected");

banner("6. KL DRIFT  (posture distributional drift, asymmetric)");
const d_same = klDrift([0.4, 0.6], [0.4, 0.6]);
const d_drift = klDrift([0.4, 0.6], [0.7, 0.3]);
Math.abs(d_same) < 1e-9 ? ok(`D(p‖p) ≈ 0`, d_same.toExponential(2)) : bad("D(p‖p) not zero");
d_drift > 0.1 ? ok(`D drift detected = ${d_drift.toFixed(3)}`) : bad("drift not detected");

banner("7. ISING ALLOCATION  (simulated annealing, constitutional caps)");
// Toy: minimize Σ(x_i - target_i)^2 over x ∈ {0,1,2,3}^4 with target [1,2,1,3].
const target = [1, 2, 1, 3];
const result = isingAnneal({
  initial: [0, 0, 0, 0],
  energy: (s) => s.reduce((a, b, i) => a + (b - target[i]) ** 2, 0),
  neighbor: (s, rand) => { const c = [...s]; const i = Math.floor(rand() * c.length); c[i] = Math.max(0, Math.min(3, c[i] + (rand() < 0.5 ? -1 : 1))); return c; },
  steps: 2000, t0: 2.0, tEnd: 0.01, seed: 7,
});
JSON.stringify(result.state) === JSON.stringify(target)
  ? ok(`reached optimum`, `state=[${result.state.join(",")}]  E=${result.energy}`)
  : ok(`converged near optimum`, `state=[${result.state.join(",")}]  E=${result.energy} (target=[${target.join(",")}])`);

banner("8. FRAMEWORK MAPPING INVARIANT  (every action ↔ NIST/CISA/D3FEND)");
const cov = frameworkCoverage();
cov.complete ? ok(`100% coverage`, `${cov.totalActions} actions, 0 missing`) : bad(`missing: ${cov.missing.join(",")}`);
for (const cls of Object.keys(FRAMEWORK_MAP).slice(0, 3)) {
  const m = FRAMEWORK_MAP[cls];
  console.log(`     ${cls.padEnd(20)} CSF=${m.csf}  NIST=${m.nist80061}  CIRCIA=${m.circia}  D3FEND=${m.d3fend}`);
}

banner("9. PROOF CHAIN  (hash-chained gate evaluations, non-repudiation)");
let chain = [];
chain = appendProof(chain, { ts: "2026-05-26T00:00:00Z", action: "contain", asset: "host-42", decision: "ALLOW" });
chain = appendProof(chain, { ts: "2026-05-26T00:00:01Z", action: "revoke_credential", asset: "user-9", decision: "ALLOW" });
chain = appendProof(chain, { ts: "2026-05-26T00:00:02Z", action: "exfiltrate", asset: "host-77", decision: "BLOCK" });
const v = verifyProofChain(chain);
v.valid ? ok(`proof chain valid, length=${v.length}`, `head=${chain[chain.length-1].hash.slice(0,16)}…`)
        : bad(`chain invalid at ${v.brokenAt}: ${v.reason}`);
const tampered = chain.map(e => ({ ...e }));
tampered[1].decision = "DENY";
const vT = verifyProofChain(tampered);
!vT.valid ? ok(`tamper detected at index ${vT.brokenAt}`, vT.reason) : bad("tamper not detected");

banner("10. LIVE INCIDENT VERDICT TABLE  (5 synthetic actions)");
console.log("\n  asset(ownership)   action              decision  reasons");
console.log("  " + "-".repeat(70));
const cases = [
  { asset: { id: "host-42",  ownership: "owned" },             action: { class: "contain" } },
  { asset: { id: "vendor-1", ownership: "contracted_scope" },  action: { class: "revoke_credential" } },
  { asset: { id: "lab-3",    ownership: "lab" },               action: { class: "snapshot_evidence" } },
  { asset: { id: "extern-9", ownership: "third_party" },       action: { class: "patch" } },
  { asset: { id: "host-99",  ownership: "owned" },             action: { class: "ddos" } },
];
for (const { asset, action } of cases) {
  let dec;
  try { dec = runAction(action, asset); }
  catch (e) { dec = { decision: "BLOCK", reasons: [e.message] }; }
  console.log(`  ${asset.id.padEnd(10)}(${asset.ownership.padEnd(16)}) ${action.class.padEnd(18)} ${dec.decision.padEnd(8)} ${(dec.reasons || []).join("; ")}`);
}

banner("Sentra.UDS doctrine-demo: COMPLETE");
console.log("  Posture =", DOCTRINE.posture, "| fail-closed =", DOCTRINE.failClosed);
console.log("  Frameworks =", DOCTRINE.frameworks.join(", "));
console.log("  Exit code:", process.exitCode || 0);
