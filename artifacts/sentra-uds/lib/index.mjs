// Sentra.UDS — pure-ESM doctrine kernel.
// No runtime dependencies. All formulas implemented from primary sources.
// This file IS the operational core that ships inside the signed Zarf payload.
//
// Defensive containment doctrine enforced here:
//   1. Asset-scoped Safety Gate (fail-closed by construction)
//   2. Offensive-action null surface (no callable code path exists)
//   3. Risk score:        r = severity · likelihood · valueAtRisk  (capped)
//   4. Financial exposure: E = 1.4M + openIncidents·350k + compromisedAssets·700k
//   5. Z-score anomaly detector (|z| > 2.5σ default)
//   6. KL drift score
//   7. Ising-style allocation (simulated annealing) under constitutional caps
//   8. NIST CSF 2.0 / NIST SP 800-61r2 / CISA CIRCIA / MITRE D3FEND mapping
//   9. Proof-Chain: hash-chained gate evaluations

import { createHash } from "node:crypto";

// ───────────────────────────────────────────────────────────────────────────
// 1. Asset-scoped Safety Gate — fail-closed.
//   An action runs ONLY IF action.class ∈ ALLOWED_ACTION_CLASSES AND
//   asset.ownership ∈ ALLOWED_OWNERSHIP. Anything else → BLOCK with reason.
// ───────────────────────────────────────────────────────────────────────────
export const ALLOWED_OWNERSHIP = Object.freeze(["owned", "authorized", "contracted_scope", "lab"]);
export const ALLOWED_ACTION_CLASSES = Object.freeze([
  "observe", "alert", "contain", "quarantine", "revoke_credential",
  "rotate_key", "patch", "isolate_segment", "snapshot_evidence", "notify_irt",
]);
export const DENIED_ACTION_CLASSES = Object.freeze([
  "attack", "exploit", "ddos", "hack_back", "offensive_recon", "implant",
]);

// 2. Offensive-action null surface — these throw at the boundary if you
// even try to *name* them. No call site in this kernel can invoke them.
export function runAction(action, asset) {
  if (DENIED_ACTION_CLASSES.includes(action.class)) {
    throw new Error(`SENTRA_OFFENSIVE_ACTION_BLOCKED: class=${action.class} has no code path`);
  }
  return runPolicyGate(action, asset);
}

export function runPolicyGate(action, asset) {
  const reasons = [];
  if (!ALLOWED_ACTION_CLASSES.includes(action.class)) reasons.push(`action.class=${action.class} not on allowlist`);
  if (!ALLOWED_OWNERSHIP.includes(asset.ownership)) reasons.push(`asset.ownership=${asset.ownership} not on allowlist`);
  if (asset.ownership === undefined) reasons.push("asset.ownership undefined (fail-closed)");
  if (reasons.length) return { decision: "BLOCK", reasons };
  return { decision: "ALLOW", reasons: [] };
}

// ───────────────────────────────────────────────────────────────────────────
// 3. Risk score (capped).
// ───────────────────────────────────────────────────────────────────────────
export function riskScore({ severity, likelihood, valueAtRisk, cap = 1_000_000 }) {
  for (const [k, v] of Object.entries({ severity, likelihood })) {
    if (!(v >= 0 && v <= 1)) throw new RangeError(`riskScore: ${k}=${v} out of [0,1]`);
  }
  if (!(valueAtRisk >= 0)) throw new RangeError("riskScore: valueAtRisk must be ≥ 0");
  return Math.min(cap, severity * likelihood * valueAtRisk);
}

// ───────────────────────────────────────────────────────────────────────────
// 4. Financial exposure.
//   E = baseline + openIncidents·perIncident + compromisedAssets·perAsset
// ───────────────────────────────────────────────────────────────────────────
export const EXPOSURE_BASELINE = 1_400_000;
export const EXPOSURE_PER_INCIDENT = 350_000;
export const EXPOSURE_PER_COMPROMISED_ASSET = 700_000;
export function financialExposure({ openIncidents, compromisedAssets }) {
  return EXPOSURE_BASELINE + openIncidents * EXPOSURE_PER_INCIDENT + compromisedAssets * EXPOSURE_PER_COMPROMISED_ASSET;
}

// ───────────────────────────────────────────────────────────────────────────
// 5. Z-score anomaly detector.
//   Returns z = (x − μ) / σ; anomaly iff |z| > threshold.
// ───────────────────────────────────────────────────────────────────────────
export function zScore(sample, history, { threshold = 2.5 } = {}) {
  if (history.length < 2) return { z: 0, anomaly: false, mu: 0, sigma: 0 };
  const mu = history.reduce((a, b) => a + b, 0) / history.length;
  const variance = history.reduce((a, b) => a + (b - mu) ** 2, 0) / (history.length - 1);
  const sigma = Math.sqrt(variance);
  if (sigma === 0) return { z: 0, anomaly: sample !== mu, mu, sigma };
  const z = (sample - mu) / sigma;
  return { z, anomaly: Math.abs(z) > threshold, mu, sigma };
}

// ───────────────────────────────────────────────────────────────────────────
// 6. KL drift score.
// ───────────────────────────────────────────────────────────────────────────
export function klDrift(p, q, eps = 1e-12) {
  if (p.length !== q.length) throw new Error("klDrift: length mismatch");
  let d = 0;
  for (let i = 0; i < p.length; i++) {
    const pi = p[i] + eps, qi = q[i] + eps;
    d += pi * Math.log(pi / qi);
  }
  return d;
}

// ───────────────────────────────────────────────────────────────────────────
// 7. Ising-style allocation (simulated annealing).
//   Minimizes `energy(state)` under constitutional caps. seed is for
//   reproducible runs (a deterministic PRNG, not Math.random).
// ───────────────────────────────────────────────────────────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function isingAnneal({ initial, energy, neighbor, steps = 1000, t0 = 1.0, tEnd = 0.01, seed = 1 }) {
  const rand = mulberry32(seed);
  let state = initial; let e = energy(state);
  let best = state; let bestE = e;
  for (let i = 0; i < steps; i++) {
    const T = t0 * Math.pow(tEnd / t0, i / steps);
    const cand = neighbor(state, rand);
    const eC = energy(cand);
    const dE = eC - e;
    if (dE < 0 || rand() < Math.exp(-dE / T)) {
      state = cand; e = eC;
      if (e < bestE) { best = state; bestE = e; }
    }
  }
  return { state: best, energy: bestE, steps };
}

// ───────────────────────────────────────────────────────────────────────────
// 8. Framework mapping invariant.
//   Every shipped action class MUST map to at least one row in
//   NIST CSF 2.0, NIST SP 800-61r2, CISA CIRCIA, MITRE D3FEND. CI enforces.
// ───────────────────────────────────────────────────────────────────────────
export const FRAMEWORK_MAP = Object.freeze({
  observe:            { csf: "DE.CM-01", nist80061: "Detection", circia: "Triage",     d3fend: "D3-NTA"  },
  alert:              { csf: "DE.AE-02", nist80061: "Detection", circia: "Triage",     d3fend: "D3-NTA"  },
  contain:            { csf: "RS.MI-01", nist80061: "Containment", circia: "Response", d3fend: "D3-NI"   },
  quarantine:         { csf: "RS.MI-02", nist80061: "Containment", circia: "Response", d3fend: "D3-NI"   },
  revoke_credential:  { csf: "PR.AA-05", nist80061: "Containment", circia: "Response", d3fend: "D3-AR"   },
  rotate_key:         { csf: "PR.DS-01", nist80061: "Eradication", circia: "Response", d3fend: "D3-CR"   },
  patch:              { csf: "ID.RA-06", nist80061: "Eradication", circia: "Response", d3fend: "D3-AH"   },
  isolate_segment:    { csf: "PR.IR-01", nist80061: "Containment", circia: "Response", d3fend: "D3-NI"   },
  snapshot_evidence:  { csf: "DE.AE-05", nist80061: "Detection",   circia: "Reporting", d3fend: "D3-FA"  },
  notify_irt:         { csf: "RS.CO-02", nist80061: "Detection",   circia: "Reporting", d3fend: "D3-NTA" },
});
export function frameworkCoverage() {
  const missing = ALLOWED_ACTION_CLASSES.filter(c => !FRAMEWORK_MAP[c]);
  return { complete: missing.length === 0, missing, totalActions: ALLOWED_ACTION_CLASSES.length };
}

// ───────────────────────────────────────────────────────────────────────────
// 9. Proof-Chain — hash-chained gate evaluations.
// ───────────────────────────────────────────────────────────────────────────
export function sha256Hex(x) {
  return createHash("sha256").update(typeof x === "string" ? x : JSON.stringify(x)).digest("hex");
}
export function appendProof(chain, body) {
  const prevHash = chain.length ? chain[chain.length - 1].hash : "0".repeat(64);
  const entry = { ...body, prevHash };
  entry.hash = sha256Hex(entry);
  return [...chain, entry];
}
export function verifyProofChain(chain) {
  for (let i = 0; i < chain.length; i++) {
    const e = chain[i];
    const expectedPrev = i === 0 ? "0".repeat(64) : chain[i - 1].hash;
    if (e.prevHash !== expectedPrev) return { valid: false, brokenAt: i, reason: "prev-hash-mismatch" };
    const { hash, ...body } = e;
    if (hash !== sha256Hex(body)) return { valid: false, brokenAt: i, reason: "body-hash-mismatch" };
  }
  return { valid: true, length: chain.length };
}

export const DOCTRINE = Object.freeze({
  version: "Sentra-V1",
  posture: "strictly defensive containment",
  failClosed: true,
  exposureBaseline: EXPOSURE_BASELINE,
  frameworks: ["NIST CSF 2.0", "NIST SP 800-61r2", "CISA CIRCIA", "MITRE D3FEND"],
});
