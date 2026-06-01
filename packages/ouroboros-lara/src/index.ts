/**
 * @workspace/ouroboros-lara — Limits-aware reconstruction assertion.
 * Source: Jamneshan, Shalom, Tao,
 *   "A Host–Kra F_2^ω-system of order 5 that is not Abramov of order 5,
 *    and non-measurability of the inverse theorem for the U^6(F_2^n) norm."
 *   Mathematische Annalen 394:11 (2026).
 *   https://doi.org/10.1007/s00208-026-03344-5
 *
 * Primitive map:
 *   33 — Gowers-norm gate U^{k+1}                ./gowers-norm
 *   34 — Abramov-order gate                       ./abramov-gate
 *   35 — Measurability assertion                  ./measurability
 *   36 — Lara-gap declaration                     ./lara-gap
 *
 * Adds Λ axis N (non-measurability honesty) used in Λ₉.
 */

export * from "./gowers-norm.js";
export * from "./abramov-gate.js";
export * from "./measurability.js";
export * from "./lara-gap.js";
