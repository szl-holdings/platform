/**
 * No-Hair Contract — primitive #2 of Horizon.
 *
 * BACKGROUND
 * ----------
 * The no-hair theorem (Israel, Carter, Robinson, 1967-1975) states that a
 * stationary classical black hole is fully characterized by exactly three
 * externally observable parameters: mass M, charge Q, and angular momentum J.
 * Wheeler summarized this as "black holes have no hair" — every other piece
 * of information about the matter that fell in is invisible from outside.
 *
 * This is operationally beautiful: it is a maximally compressed canonical
 * description. Two black holes with the same (M, Q, J) are indistinguishable
 * from outside — perfect interface uniformity.
 *
 * COMPUTATIONAL ANALOG
 * --------------------
 * Every Ouroboros loop, once closed, exposes its state as exactly four scalars
 * and one hash:
 *
 *   mass:   total bounded work done in normalized cost units (>= 0)
 *   charge: net policy obligation discharged (-) or accrued (+) (signed)
 *   spin:   adversariality of inputs encountered, in bits of Shannon entropy
 *   tier:   risk-tier-gate level at close (1..4)
 *   hash:   sha-256 of the closed witness chain
 *
 * No other field is exposed across the loop boundary. A11oy can compose any
 * two loops by reading these five values from each. Internal refactors do not
 * break composition — they cannot, because consumers cannot see internal state.
 *
 * This replaces the current ad-hoc cross-product adapter pattern with a
 * uniform canonical interface. Counsel can hand off to Sentra hand off to
 * Amaru without bespoke glue, because every closed loop speaks no-hair.
 */

import { createHash } from "node:crypto";
import type { NoHairState, RiskTier, WitnessEntry } from "./types.js";

/**
 * Compute a canonical no-hair state from a sequence of observed work units
 * and a closed witness chain.
 *
 * @param work       array of cost units consumed
 * @param obligations array of signed policy obligation deltas (positive = accrued, negative = discharged)
 * @param inputDistribution distribution of distinguishable input categories observed
 * @param tier       final risk tier at close
 * @param witnessChain hash-chained witness entries
 */
export function computeNoHair(args: {
  work: readonly number[];
  obligations: readonly number[];
  inputDistribution: ReadonlyMap<string, number>;
  tier: RiskTier;
  witnessChain: readonly WitnessEntry[];
}): NoHairState {
  const mass = args.work.reduce((acc, w) => acc + Math.max(0, w), 0);
  const charge = args.obligations.reduce((acc, o) => acc + o, 0);
  const spin = inputEntropy(args.inputDistribution);
  const hash = witnessChainHash(args.witnessChain);
  return Object.freeze({
    mass,
    charge,
    spin,
    tier: args.tier,
    hash,
  });
}

function inputEntropy(dist: ReadonlyMap<string, number>): number {
  if (dist.size === 0) return 0;
  let total = 0;
  for (const v of dist.values()) total += v;
  if (total <= 0) return 0;
  let h = 0;
  const ln2 = Math.log(2);
  for (const v of dist.values()) {
    if (v <= 0) continue;
    const p = v / total;
    h -= p * (Math.log(p) / ln2);
  }
  return h;
}

function witnessChainHash(chain: readonly WitnessEntry[]): string {
  if (chain.length === 0) {
    return createHash("sha256").update("EMPTY_CHAIN").digest("hex");
  }
  // Verify chain integrity, then hash the head.
  for (let i = 1; i < chain.length; i++) {
    const prev = chain[i - 1]!;
    const cur = chain[i]!;
    if (cur.prevHash !== prev.hash) {
      throw new Error(
        `no-hair: witness chain broken at index ${i} ` +
          `(expected prevHash=${prev.hash}, got ${cur.prevHash})`,
      );
    }
  }
  return chain[chain.length - 1]!.hash;
}

/**
 * Canonical serialization of a no-hair state. Stable byte representation
 * suitable for hashing, signing, on-the-wire transmission, and audit logs.
 *
 * Field order is fixed. Numbers are serialized at full IEEE-754 double
 * precision via Number.prototype.toString(). The hash is appended last.
 *
 * Example output:
 *   "nohair/v1|mass=12.5|charge=-3|spin=2.31|tier=2|hash=ab12..."
 */
export function serializeNoHair(s: NoHairState): string {
  return [
    "nohair/v1",
    `mass=${s.mass}`,
    `charge=${s.charge}`,
    `spin=${s.spin}`,
    `tier=${s.tier}`,
    `hash=${s.hash}`,
  ].join("|");
}

/**
 * Parse a serialized no-hair state. Throws if malformed.
 */
export function parseNoHair(serialized: string): NoHairState {
  const parts = serialized.split("|");
  if (parts.length !== 6 || parts[0] !== "nohair/v1") {
    throw new Error(`no-hair: malformed serialization: ${serialized}`);
  }
  const fields = new Map<string, string>();
  for (let i = 1; i < parts.length; i++) {
    const [k, v] = parts[i]!.split("=");
    if (k === undefined || v === undefined) {
      throw new Error(`no-hair: malformed field: ${parts[i]}`);
    }
    fields.set(k, v);
  }
  const mass = Number(fields.get("mass"));
  const charge = Number(fields.get("charge"));
  const spin = Number(fields.get("spin"));
  const tier = Number(fields.get("tier")) as RiskTier;
  const hash = fields.get("hash");
  if (
    !Number.isFinite(mass) ||
    !Number.isFinite(charge) ||
    !Number.isFinite(spin) ||
    !(tier === 1 || tier === 2 || tier === 3 || tier === 4) ||
    typeof hash !== "string" ||
    hash.length !== 64
  ) {
    throw new Error(`no-hair: invalid field values: ${serialized}`);
  }
  return Object.freeze({ mass, charge, spin, tier, hash });
}

/**
 * Equality up to numerical tolerance. Two states are equivalent under
 * the no-hair contract iff their (tier, hash) match exactly and the
 * scalar fields agree within tolerance.
 *
 * The hash field provides the strict equality check; the scalars exist for
 * reasoning, debugging, and routing decisions.
 */
export function noHairEquivalent(
  a: NoHairState,
  b: NoHairState,
  tol = 1e-9,
): boolean {
  return (
    a.tier === b.tier &&
    a.hash === b.hash &&
    Math.abs(a.mass - b.mass) <= tol &&
    Math.abs(a.charge - b.charge) <= tol &&
    Math.abs(a.spin - b.spin) <= tol
  );
}
