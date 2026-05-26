// Amaru.UDS — pure-ESM doctrine kernel.
// No runtime dependencies. Imports nothing. All formulas implemented from
// the cited primary sources. This file IS the operational core that ships
// inside the signed Zarf payload.
//
// Doctrine V6 invariants enforced here:
//   1. Lutar Σ canonical composition  (intelligence.ts → math)
//   2. Lutar Envelope (Σ_lo, Σ_hi)    (axis-dispersion bounds)
//   3. Normalized Risk Λ (clamp + floor 0.90)
//   4. KL divergence drift detector
//   5. Bekenstein admission gate     (S ≤ 2π R E / ℏ c, scaled)
//   6. Bounded-loop convergence       (monotone-score + max-depth)
//   7. 9-axis AND decision gate
//   8. Hash-chained proof receipts    (sha256 chain over delta-logs)

import { createHash } from "node:crypto";

// ───────────────────────────────────────────────────────────────────────────
// 1.  Lutar Σ canonical composition
//   Σ = P^(1/2) · K^(1/4) · Φ^(1/8) · C^(1/8)
//   P = Provenance, K = Containment, Φ = Coherence, C = Convergence
//   All inputs in (0, 1]; output in (0, 1].
// ───────────────────────────────────────────────────────────────────────────
export function lutarSigma({ P, K, Phi, C }) {
  for (const [k, v] of Object.entries({ P, K, Phi, C })) {
    if (!(v > 0 && v <= 1)) {
      throw new RangeError(`lutarSigma: ${k}=${v} out of (0,1]`);
    }
  }
  return Math.pow(P, 1 / 2) * Math.pow(K, 1 / 4) * Math.pow(Phi, 1 / 8) * Math.pow(C, 1 / 8);
}

// ───────────────────────────────────────────────────────────────────────────
// 2.  Lutar Envelope — geometric dispersion bound around Σ.
//   Σ_lo = ∏ (axis_i − |axis_i − mean|)^w_i
//   Σ_hi = ∏ (axis_i + |axis_i − mean|)^w_i
//   Returns {lo, hi}; lo ≤ Σ ≤ hi by construction (modulo clamp at 0).
// ───────────────────────────────────────────────────────────────────────────
export function lutarEnvelope({ P, K, Phi, C }) {
  const axes = [P, K, Phi, C];
  const weights = [0.5, 0.25, 0.125, 0.125];
  const mean = axes.reduce((a, b) => a + b, 0) / axes.length;
  let lo = 1, hi = 1;
  for (let i = 0; i < axes.length; i++) {
    const dev = Math.abs(axes[i] - mean);
    lo *= Math.pow(Math.max(1e-12, axes[i] - dev), weights[i]);
    hi *= Math.pow(axes[i] + dev, weights[i]);
  }
  return { lo, hi };
}

// ───────────────────────────────────────────────────────────────────────────
// 3.  Normalized Risk Λ — clamp(severity · likelihood · VaR / cap, 0, 1)
//   Doctrine V6 floor: any sync action with Λ < 0.90 is HALT-eligible by HUKLLA.
// ───────────────────────────────────────────────────────────────────────────
export const LAMBDA_FLOOR = 0.90;
export function normalizedRisk({ severity, likelihood, valueAtRisk, cap = 1_000_000 }) {
  const raw = (severity * likelihood * valueAtRisk) / cap;
  return Math.max(0, Math.min(1, raw));
}

// ───────────────────────────────────────────────────────────────────────────
// 4.  KL divergence  D_KL(p ‖ q) = Σ p_i · log(p_i / q_i)
//   Smoothed with epsilon to avoid log(0). Asymmetric by construction.
// ───────────────────────────────────────────────────────────────────────────
export function klDivergence(p, q, eps = 1e-12) {
  if (p.length !== q.length) throw new Error("klDivergence: length mismatch");
  let d = 0;
  for (let i = 0; i < p.length; i++) {
    const pi = p[i] + eps, qi = q[i] + eps;
    d += pi * Math.log(pi / qi);
  }
  return d;
}

// ───────────────────────────────────────────────────────────────────────────
// 5.  Bekenstein admission gate.
//   Bekenstein 1981: S ≤ (2π · k_B · R · E) / (ℏ · c)
//   Operational form: a sync admission carrying `infoBits` bits over a
//   handoff of radius R (config) and energy budget E (config) is ADMITTED
//   iff infoBits ≤ floor(S/ln(2)). Scaled units; ℏc set so the bound is
//   meaningful at the byte scale used in the sync fabric.
// ───────────────────────────────────────────────────────────────────────────
export const BEKENSTEIN_HBAR_C_SCALED = 1.0; // operational unit
export function bekensteinAdmit({ infoBits, radius, energy }) {
  const S = (2 * Math.PI * radius * energy) / BEKENSTEIN_HBAR_C_SCALED; // nats
  const bitsAllowed = Math.floor(S / Math.LN2);
  return { admit: infoBits <= bitsAllowed, bitsAllowed, entropyNats: S };
}

// ───────────────────────────────────────────────────────────────────────────
// 6.  Bounded-loop convergence.
//   Run a reducer step. Each iteration must (a) not exceed maxDepth, and
//   (b) strictly DECREASE the score (monotone convergence). Halt with
//   `converged: true` when |Δscore| < tol, `bounded-out` when depth hits
//   maxDepth, `diverged` if score ever increases.
// ───────────────────────────────────────────────────────────────────────────
export function boundedLoop({ step, initial, maxDepth = 64, tol = 1e-9 }) {
  let state = initial;
  let prev = Infinity;
  for (let depth = 1; depth <= maxDepth; depth++) {
    const { next, score } = step(state, depth);
    if (score > prev + tol) {
      return { status: "diverged", depth, state, score };
    }
    if (Math.abs(prev - score) < tol) {
      return { status: "converged", depth, state: next, score };
    }
    prev = score; state = next;
  }
  return { status: "bounded-out", depth: maxDepth, state, score: prev };
}

// ───────────────────────────────────────────────────────────────────────────
// 7.  9-axis AND decision gate (V6).
//   Every axis must report `pass: true` AND its score must be ≥ its floor.
//   Single-failure → block. Returns {pass, failingAxes}.
// ───────────────────────────────────────────────────────────────────────────
export const V6_AXES = [
  "provenance", "containment", "coherence", "convergence",
  "moral_grounding", "lambda_risk", "bekenstein_admission",
  "loop_boundedness", "byline_canonicality",
];
export function nineAxisGate(axisReports) {
  const failing = [];
  for (const axis of V6_AXES) {
    const r = axisReports[axis];
    if (!r || r.pass !== true || r.score < r.floor) failing.push(axis);
  }
  return { pass: failing.length === 0, failingAxes: failing };
}

// ───────────────────────────────────────────────────────────────────────────
// 8.  Hash-chained proof receipts.
//   Each receipt embeds the previous receipt's sha256 → tamper-evident.
//   Receipt schema: {ts, source, deltaLog, sigma, lambda, prevHash}.
//   appendReceipt is pure; the chain is the array.
// ───────────────────────────────────────────────────────────────────────────
export function sha256Hex(input) {
  return createHash("sha256").update(typeof input === "string" ? input : JSON.stringify(input)).digest("hex");
}
export function appendReceipt(chain, body) {
  const prevHash = chain.length ? chain[chain.length - 1].hash : "0".repeat(64);
  const receipt = { ...body, prevHash };
  receipt.hash = sha256Hex(receipt);
  return [...chain, receipt];
}
export function verifyChain(chain) {
  for (let i = 0; i < chain.length; i++) {
    const r = chain[i];
    const expectedPrev = i === 0 ? "0".repeat(64) : chain[i - 1].hash;
    if (r.prevHash !== expectedPrev) return { valid: false, brokenAt: i, reason: "prev-hash-mismatch" };
    const { hash, ...body } = r;
    if (hash !== sha256Hex(body)) return { valid: false, brokenAt: i, reason: "body-hash-mismatch" };
  }
  return { valid: true, length: chain.length };
}

// ───────────────────────────────────────────────────────────────────────────
// Doctrine V6 metadata
// ───────────────────────────────────────────────────────────────────────────
export const DOCTRINE = Object.freeze({
  version: "V6",
  lambdaFloor: LAMBDA_FLOOR,
  moralGroundingFloor: 0.95,
  byline: "Stephen P. Lutar Jr.",
  license: "Apache-2.0 / NOTICE (V6 allowlist)",
  haltAuthority: "HUKLLA",
});
