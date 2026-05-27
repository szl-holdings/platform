// Vessels.UDS — pure-ESM maritime-intelligence kernel.
// No runtime dependencies. Imports nothing outside node:* standard library.
// All formulas implemented from cited primary sources. This file IS the
// operational core that ships inside the signed Zarf payload.
//
// Primitives shipped here:
//   1. Closest Point of Approach (CPA)          — collision math, two vessels
//   2. Collision-cone / time-to-CPA              — heading-relative cone test
//   3. Great-circle distance (haversine)         — bearing-independent range
//   4. AIS-gap dark-vessel detector              — Doctrine V6 Λ-floor 0.90
//   5. Sanctions screen (OFAC/EU/UK/UN shapes)   — exact + token match
//   6. Voyage Λ-receipt chain                    — sha256-chained provenance

import { createHash } from "node:crypto";

export const DOCTRINE = Object.freeze({
  version: "V6",
  product: "vessels-uds",
  primitives: [
    "cpa", "collision-cone", "haversine",
    "ais-gap-detector", "sanctions-screen", "lambda-receipt-chain",
  ],
});

export const LAMBDA_FLOOR = 0.90;
export const EARTH_RADIUS_NM = 3440.065; // nautical miles, mean Earth radius

// ───────────────────────────────────────────────────────────────────────────
// 1. Haversine — great-circle distance in nautical miles between two
//    (lat, lon) pairs given in degrees.
// ───────────────────────────────────────────────────────────────────────────
export function haversineNm({ lat1, lon1, lat2, lon2 }) {
  for (const [k, v] of Object.entries({ lat1, lon1, lat2, lon2 })) {
    if (!Number.isFinite(v)) throw new RangeError(`haversineNm: ${k}=${v} not finite`);
  }
  const toRad = (d) => (d * Math.PI) / 180;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const dφ = toRad(lat2 - lat1), dλ = toRad(lon2 - lon1);
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 2 * EARTH_RADIUS_NM * Math.asin(Math.min(1, Math.sqrt(a)));
}

// ───────────────────────────────────────────────────────────────────────────
// 2. Closest Point of Approach (CPA) — two vessels with current
//    (lat, lon, course-deg, speed-kn). Returns minimum range and time-to-CPA
//    in seconds under the constant-velocity approximation (local tangent plane).
//    Reference: Bowditch — American Practical Navigator, Vol II, §35.
// ───────────────────────────────────────────────────────────────────────────
export function closestPointOfApproach(a, b) {
  // Local flat-Earth tangent plane around a's position (adequate for
  // sub-50nm tactical separation; the doctrine receipt records the
  // tangent-plane approximation explicitly).
  const cosLat = Math.cos((a.lat * Math.PI) / 180);
  const nmPerDegLat = 60;            // exact at mean-Earth radius
  const nmPerDegLon = 60 * cosLat;
  const dx = (b.lon - a.lon) * nmPerDegLon;
  const dy = (b.lat - a.lat) * nmPerDegLat;
  const courseToVec = (c, s) => {
    const θ = (c * Math.PI) / 180;
    return { vx: s * Math.sin(θ), vy: s * Math.cos(θ) };
  };
  const va = courseToVec(a.courseDeg, a.speedKn);
  const vb = courseToVec(b.courseDeg, b.speedKn);
  const dvx = vb.vx - va.vx, dvy = vb.vy - va.vy;
  const dvSq = dvx * dvx + dvy * dvy;
  if (dvSq < 1e-9) {
    // Parallel and same speed — range is constant.
    return { rangeNm: Math.hypot(dx, dy), tCpaSec: 0, parallel: true };
  }
  const tCpaHr = -(dx * dvx + dy * dvy) / dvSq;
  const cx = dx + dvx * tCpaHr, cy = dy + dvy * tCpaHr;
  return {
    rangeNm: Math.hypot(cx, cy),
    tCpaSec: tCpaHr * 3600,
    parallel: false,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// 3. Collision-cone test — is contact `b` inside the cone of headings
//    that would intercept own-ship `a` within `withinSec` seconds and
//    a forbidden range `dangerNm`?  Returns boolean + the resolved CPA.
// ───────────────────────────────────────────────────────────────────────────
export function inCollisionCone(a, b, { dangerNm = 0.5, withinSec = 1800 } = {}) {
  const cpa = closestPointOfApproach(a, b);
  const inDanger = cpa.rangeNm <= dangerNm;
  const inHorizon = cpa.tCpaSec >= 0 && cpa.tCpaSec <= withinSec;
  return { triggered: inDanger && inHorizon, ...cpa };
}

// ───────────────────────────────────────────────────────────────────────────
// 4. AIS-gap dark-vessel detector.
//    Inputs:
//      gapSec       — observed gap between AIS pings (s)
//      expectedSec  — expected ping cadence for this vessel class (s)
//      drawNm       — distance the vessel could have travelled in the gap
//                     at last-known speed (nautical miles)
//      contextRisk  — area/voyage risk multiplier in [0, 1]
//                     (e.g., proximity to sanctioned waters, STS hotspot)
//    Λ score:
//      ratio = clamp(gapSec / (expectedSec * 6), 0, 1)
//      Λ     = clamp(0.5 * ratio + 0.3 * drawScore + 0.2 * contextRisk, 0, 1)
//    Λ ≥ LAMBDA_FLOOR (0.90) ⇒ HALT-eligible review per Doctrine V6.
// ───────────────────────────────────────────────────────────────────────────
export function aisGapLambda({ gapSec, expectedSec, drawNm = 0, contextRisk = 0 }) {
  if (!(gapSec >= 0) || !(expectedSec > 0)) {
    throw new RangeError(`aisGapLambda: gapSec=${gapSec} expectedSec=${expectedSec}`);
  }
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const ratio = clamp(gapSec / (expectedSec * 6));
  const drawScore = clamp(drawNm / 50);           // 50nm "draw" saturates
  const lam = clamp(0.5 * ratio + 0.3 * drawScore + 0.2 * clamp(contextRisk));
  return {
    lambda: lam,
    haltEligible: lam >= LAMBDA_FLOOR,
    floor: LAMBDA_FLOOR,
    factors: { ratio, drawScore, contextRisk: clamp(contextRisk) },
  };
}

// ───────────────────────────────────────────────────────────────────────────
// 5. Sanctions screen — exact + token-overlap match against OFAC/EU/UK/UN
//    list shapes. Designed to be deterministic and offline. The list shape
//    is a flat array of records `{ id, list, name, aliases?, country? }`.
//    Output is the matching set with confidence in [0, 1].
// ───────────────────────────────────────────────────────────────────────────
function normalizeName(s) {
  return String(s ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanctionsScreen({ query, list }) {
  const q = normalizeName(query);
  if (!q) return [];
  const qTokens = new Set(q.split(" "));
  const hits = [];
  for (const entry of list) {
    const candidates = [entry.name, ...(entry.aliases ?? [])].map(normalizeName);
    let best = 0, matchedOn = null;
    for (const c of candidates) {
      if (!c) continue;
      if (c === q) { best = 1; matchedOn = c; break; }
      const cTokens = new Set(c.split(" "));
      const inter = [...qTokens].filter((t) => cTokens.has(t)).length;
      const denom = Math.max(qTokens.size, cTokens.size);
      const conf = denom > 0 ? inter / denom : 0;
      if (conf > best) { best = conf; matchedOn = c; }
    }
    if (best >= 0.5) {
      hits.push({ id: entry.id, list: entry.list, name: entry.name, matchedOn, confidence: best });
    }
  }
  return hits.sort((a, b) => b.confidence - a.confidence);
}

// ───────────────────────────────────────────────────────────────────────────
// 6. Voyage Λ-receipt chain — hash-chained provenance over a sequence of
//    voyage events (departure, AIS pings, sanctions screen result, port
//    call, etc.). Each receipt commits to its event + previous-hash, giving
//    an offline-verifiable tamper-evident chain. Mirrors Amaru's receipt
//    chain so a single verifier shape covers both products.
// ───────────────────────────────────────────────────────────────────────────
export function sha256Hex(input) {
  const h = createHash("sha256");
  h.update(typeof input === "string" ? input : JSON.stringify(input));
  return h.digest("hex");
}

export function appendReceipt(chain, event) {
  const prev = chain.length > 0 ? chain[chain.length - 1].hash : "0".repeat(64);
  const payload = { seq: chain.length, prev, event, ts: new Date().toISOString() };
  const hash = sha256Hex(payload);
  return [...chain, { ...payload, hash }];
}

export function verifyChain(chain) {
  let prev = "0".repeat(64);
  for (let i = 0; i < chain.length; i++) {
    const r = chain[i];
    if (r.seq !== i) return { ok: false, brokenAt: i, reason: `seq mismatch: ${r.seq} != ${i}` };
    if (r.prev !== prev) return { ok: false, brokenAt: i, reason: `prev mismatch at ${i}` };
    const recomputed = sha256Hex({ seq: r.seq, prev: r.prev, event: r.event, ts: r.ts });
    if (recomputed !== r.hash) return { ok: false, brokenAt: i, reason: `hash mismatch at ${i}` };
    prev = r.hash;
  }
  return { ok: true, length: chain.length };
}
