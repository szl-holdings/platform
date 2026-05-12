/**
 * Primitive 27 — Dual-use review (Bohr "open world" test).
 *
 * Source: J. Robert Oppenheimer Papers, Library of Congress, MSS35188,
 *   General Case File — Bohr / Frankfurter correspondence (1944–1945)
 *   on the open-world memorandum to Roosevelt.
 *
 * Niels Bohr's standing argument: a research artifact whose continued
 * secrecy yields net negative outcomes (proliferation race,
 * irreproducibility, public-trust collapse) should be openly published.
 *
 * Computable form: each artifact is scored on four ledgers:
 *   benignBenefit  ∈ [0,1]  — civilian / scientific upside
 *   harmPotential  ∈ [0,1]  — kinetic / coercive misuse
 *   reproducibility ∈ [0,1] — independent reconstructibility (anti-secrecy
 *                              pressure: if anyone else can recreate it,
 *                              secrecy is performative)
 *   verifiability   ∈ [0,1] — third-party inspectability of claims
 *
 * Verdicts:
 *   OPEN_PUBLISH    — Bohr-positive: net welfare maximised by open release
 *   PUBLISH_GUARDED — partial release with redaction or staged delivery
 *   HOLD            — internal only, with sunset date (no indefinite holds)
 *   SUPPRESS        — full suppression with explicit cause (rare; auditable)
 */

export interface DualUseInput {
  artifactId: string;
  benignBenefit: number;
  harmPotential: number;
  reproducibility: number;
  verifiability: number;
  sunsetDays?: number; // for HOLD
}

export type DualUseVerdict =
  | "OPEN_PUBLISH"
  | "PUBLISH_GUARDED"
  | "HOLD"
  | "SUPPRESS";

export interface DualUseResult {
  artifactId: string;
  verdict: DualUseVerdict;
  bohrScore: number;
  rationale: string;
}

export function dualUseReview(input: DualUseInput): DualUseResult {
  for (const k of [
    "benignBenefit",
    "harmPotential",
    "reproducibility",
    "verifiability",
  ] as const) {
    const v = input[k];
    if (!Number.isFinite(v) || v < 0 || v > 1) {
      throw new Error(`${k} must be in [0,1]; got ${v}.`);
    }
  }

  // Bohr score: openness pressure rises with benefit, reproducibility, verifiability;
  // falls with harm potential. Anchored in [-1, 1].
  const bohr =
    (input.benignBenefit + input.reproducibility + input.verifiability) / 3 -
    input.harmPotential;

  let verdict: DualUseVerdict;
  let rationale: string;
  if (bohr >= 0.4) {
    verdict = "OPEN_PUBLISH";
    rationale =
      "Bohr-positive: benefit/reproducibility/verifiability dominate; secrecy is performative.";
  } else if (bohr >= 0.0) {
    verdict = "PUBLISH_GUARDED";
    rationale = "Mixed: release with redaction or staged delivery.";
  } else if (bohr >= -0.4) {
    verdict = "HOLD";
    rationale = `Hold with sunset (${input.sunsetDays ?? 365} days). Re-review required.`;
  } else {
    verdict = "SUPPRESS";
    rationale = "Harm potential dominates; suppression authorised, cause auditable.";
  }
  return { artifactId: input.artifactId, verdict, bohrScore: bohr, rationale };
}
