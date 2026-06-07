/**
 * @workspace/sentra-runtime
 * =========================
 * Cyber-resilience command runtime for SZL Holdings' Sentra surface.
 *
 * Sentra composes the Ouroboros spine with two purpose-built primitives:
 *
 *   1. Gauss multi-sensor fusion — fuses N noisy linear sensors (IDS, EDR,
 *      WAF, honeypot, SIEM) into a maximum-likelihood threat-state estimate
 *      x̂, with per-sensor residuals, χ²/dof goodness-of-fit, and a
 *      "drop sensor" / "reject fusion" verdict.
 *
 *   2. Kuramoto defender-coupling — models defender agents as a phase
 *      population, scores their order parameter r ∈ [0, 1], and simulates
 *      counter-orientation against attacker phase under self-coupling.
 *
 * The Λ-gate over Sentra uses Λ₉ on the standard axes, but the
 * `gaussClosure` axis is fed *directly* from the fusion goodness-of-fit
 * — so the spine's admit decision is informed by, not parallel to, the
 * sensor evidence.
 *
 * Public API:
 *   sentra.verify(input)         — spine + fusion + defender score
 *   sentra.fuseSensors(obs)      — Gauss multi-sensor fusion
 *   sentra.scoreDefenders(reads) — Kuramoto order parameter
 *   sentra.simulateDefence(...)  — Euler-coupled defender/attacker
 */
export * from "./gauss-fusion.js";
export * from "./kuramoto-defender.js";
export * from "./verify.js";
export { lutarInvariant9, verifyLutarBoundN } from "@workspace/ouroboros-invariant";
