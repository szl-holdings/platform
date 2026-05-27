#!/usr/bin/env node
// Vessels.UDS — vessels-demo.mjs
// Post-deploy harness. Imports the shipped lib/index.mjs and exercises every
// maritime-intelligence primitive end-to-end. ~30 seconds, no infra, zero deps.
//
// Usage:
//   node vessels-demo.mjs <lib-dir>
// where <lib-dir> contains index.mjs from the unpacked Zarf package.

import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const libDir = (process.argv[2] || "./lib").replace(/\/$/, "");
const m = await import(pathToFileURL(resolve(libDir, "index.mjs")).href);
const {
  haversineNm, closestPointOfApproach, inCollisionCone,
  aisGapLambda, LAMBDA_FLOOR, sanctionsScreen,
  appendReceipt, verifyChain, sha256Hex, DOCTRINE,
} = m;

const banner = (s) => console.log("\n" + "=".repeat(72) + "\n  " + s + "\n" + "=".repeat(72));
const ok = (n, d = "") => console.log(`  PASS ${n}${d ? " -- " + d : ""}`);
const bad = (n, d = "") => { console.log(`  FAIL ${n}${d ? " -- " + d : ""}`); process.exitCode = 1; };

banner("Vessels.UDS vessels-demo  |  V6  |  Maritime Intelligence kernel");
console.log("  doctrine =", JSON.stringify(DOCTRINE));

banner("1. HAVERSINE  (great-circle range, nm)");
// Singapore Strait to Strait of Hormuz, approx 3,130nm great-circle.
const sgToHormuz = haversineNm({ lat1: 1.27, lon1: 103.85, lat2: 26.5, lon2: 56.25 });
sgToHormuz > 3000 && sgToHormuz < 3300
  ? ok(`Singapore→Hormuz ≈ ${sgToHormuz.toFixed(0)}nm  (expected ~3130)`)
  : bad(`out-of-range: ${sgToHormuz.toFixed(0)}nm`);
// Same point — must be 0.
const zero = haversineNm({ lat1: 0, lon1: 0, lat2: 0, lon2: 0 });
Math.abs(zero) < 1e-9 ? ok("identical points → 0nm") : bad(`expected 0, got ${zero}`);
try { haversineNm({ lat1: NaN, lon1: 0, lat2: 0, lon2: 0 }); bad("NaN should throw"); }
catch (e) { ok("non-finite throws", e.message); }

banner("2. CPA + COLLISION CONE  (Bowditch flat-Earth tangent)");
// Two vessels on converging headings, 10nm apart at t=0.
const own  = { lat: 25.00, lon: 55.00, courseDeg:  90, speedKn: 12 };
const cont = { lat: 25.00, lon: 55.20, courseDeg: 270, speedKn: 12 }; // ~11nm east, heading west
const cpa = closestPointOfApproach(own, cont);
cpa.rangeNm < 0.5 && cpa.tCpaSec > 0
  ? ok(`head-on CPA = ${cpa.rangeNm.toFixed(3)}nm in ${(cpa.tCpaSec/60).toFixed(1)}min`)
  : bad(`unexpected CPA: ${JSON.stringify(cpa)}`);
const cone = inCollisionCone(own, cont, { dangerNm: 0.5, withinSec: 1800 });
cone.triggered ? ok("collision cone TRIGGERED (within 30min)") : bad("cone should have triggered");
// Diverging case — must not trigger.
const safe = { lat: 25.00, lon: 55.20, courseDeg: 90, speedKn: 12 };
const safeCone = inCollisionCone(own, safe, { dangerNm: 0.5, withinSec: 1800 });
!safeCone.triggered ? ok("diverging contact does NOT trigger") : bad("diverging should not trigger");

banner("3. AIS-GAP Λ DETECTOR  (floor " + LAMBDA_FLOOR + ", HUKLLA halt)");
// Long gap + large potential draw + high context risk → HALT.
const dark = aisGapLambda({ gapSec: 4 * 3600, expectedSec: 60, drawNm: 50, contextRisk: 0.95 });
dark.haltEligible
  ? ok(`Λ=${dark.lambda.toFixed(3)} ≥ floor → HALT (dark-vessel review)`)
  : bad(`expected HALT, got Λ=${dark.lambda.toFixed(3)}`);
// Normal heartbeat → ADMIT.
const live = aisGapLambda({ gapSec: 70, expectedSec: 60, drawNm: 0.3, contextRisk: 0.05 });
!live.haltEligible
  ? ok(`Λ=${live.lambda.toFixed(3)} < floor → ADMIT`)
  : bad(`expected ADMIT, got Λ=${live.lambda.toFixed(3)}`);

banner("4. SANCTIONS SCREEN  (OFAC/EU/UK/UN list shapes)");
const list = [
  { id: "OFAC-12345", list: "OFAC-SDN", name: "Apex Voyages DMCC", aliases: ["Apex Voyages"], country: "AE" },
  { id: "EU-2024-0881", list: "EU-Consolidated", name: "Apex Voyages DMCC Ltd", aliases: ["Apex Voyages DMCC"], country: "AE" },
  { id: "UK-HMT-7", list: "UK-OFSI", name: "Northstar Maritime", country: "RU" },
  { id: "UN-1718-22", list: "UN-1718", name: "Pyongyang Shipping Co", country: "KP" },
];
const hits = sanctionsScreen({ query: "apex voyages dmcc", list });
hits.length === 2 && hits[0].confidence === 1
  ? ok(`2 hits, top confidence 1.00 (${hits[0].list})`)
  : bad(`unexpected hits: ${JSON.stringify(hits)}`);
const clear = sanctionsScreen({ query: "Aurora Ocean Tankers", list });
clear.length === 0 ? ok("clean counterparty → 0 hits (CLEAR)") : bad(`unexpected clear-hits: ${JSON.stringify(clear)}`);

banner("5. VOYAGE Λ-RECEIPT CHAIN  (sha256-chained provenance)");
let chain = [];
chain = appendReceipt(chain, { kind: "depart", port: "Ras Tanura, SA", imo: "9876541" });
chain = appendReceipt(chain, { kind: "ais.ping", at: "01:22N 104:44E", speedKn: 14.2 });
chain = appendReceipt(chain, { kind: "sanctions.screen", result: "CLEAR", checked: 3 });
chain = appendReceipt(chain, { kind: "ais.gap", gapSec: 14_400, lambda: dark.lambda });
chain = appendReceipt(chain, { kind: "arrive", port: "Rotterdam, NL" });
const v = verifyChain(chain);
v.ok && v.length === 5 ? ok(`chain verified, length=${v.length}`) : bad(`chain verify failed: ${JSON.stringify(v)}`);
// Tamper test — flip a byte in the middle and re-verify.
const tampered = chain.map((r, i) => i === 2 ? { ...r, event: { ...r.event, result: "MATCH" } } : r);
const t = verifyChain(tampered);
!t.ok ? ok(`tampered chain rejected at link ${t.brokenAt}`) : bad("tampered chain should not verify");

banner("6. LIVE VERDICT TABLE  (synthetic fixture scoring)");
const fixtures = [
  { vessel: "AURORA OCEAN",  imo: "9876541", q: "Aurora Ocean Tankers", gapSec:    60, ctx: 0.05 },
  { vessel: "MV ACHILLES",   imo: "9765432", q: "Apex Voyages DMCC",    gapSec: 14400, ctx: 0.95 },
  { vessel: "STELLA MARIS",  imo: "9432198", q: "Northstar Maritime",   gapSec:   600, ctx: 0.70 },
  { vessel: "NORTHWIND BAY", imo: "9543210", q: "Pacific Shipping",     gapSec:    90, ctx: 0.10 },
  { vessel: "BLACK ORCHID",  imo: "9111222", q: "Pyongyang Shipping Co",gapSec:  7200, ctx: 0.90 },
];
console.log("\n  " + ["vessel".padEnd(15), "Λ".padStart(5), "sanctions".padStart(11), "verdict".padStart(8)].join("  "));
console.log("  " + "-".repeat(48));
for (const f of fixtures) {
  const lam = aisGapLambda({ gapSec: f.gapSec, expectedSec: 60, drawNm: (f.gapSec/3600)*14, contextRisk: f.ctx });
  const sHits = sanctionsScreen({ query: f.q, list });
  const halted = lam.haltEligible || sHits.length > 0;
  console.log("  " + [
    f.vessel.padEnd(15),
    lam.lambda.toFixed(2).padStart(5),
    (sHits[0]?.confidence.toFixed(2) ?? "—").padStart(11),
    (halted ? "HALT" : "ADMIT").padStart(8),
  ].join("  "));
}

banner("DONE");
console.log("  exitCode =", process.exitCode || 0);
console.log("  bundle    =", DOCTRINE.product, DOCTRINE.version);
console.log("  receipt   =", sha256Hex(chain).slice(0, 16) + "…");
