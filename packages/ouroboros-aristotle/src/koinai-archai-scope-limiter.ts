/**
 * Primitive 89 — Koinai archai scope limiter (κοιναὶ ἀρχαί / ἴδια)
 *
 * Posterior Analytics I.10, 76a36–41: common axioms apply across
 * sciences by analogy; proper principles (idia) are genus-specific.
 * Posterior Analytics I.11, 77a26–31: all sciences share common
 * principles for demonstration; PNC and excluded middle as examples.
 * Metaphysics Γ.3, 1005a21–29: common axioms belong to first
 * philosophy; mathematics uses them only as the genus requires.
 *
 * The limiter detects two failure modes:
 *   (1) under-scoping: applying a common axiom outside its analogical
 *       instantiation in the target genus.
 *   (2) over-scoping: treating a common axiom as if it were a proper
 *       principle of one genus, or treating a proper principle of
 *       another genus as universal.
 */

export type AxiomKind = "common" | "proper";

export interface AxiomUse {
  axiomId: string;
  declaredKind: AxiomKind;
  /** For proper axioms: the genus this axiom belongs to */
  homeGenus?: string;
  /** The genus the axiom is being applied within */
  applicationGenus: string;
  /** What the use claims the axiom asserts */
  assertedClaim: string;
  /** Whether the use treats the axiom as making a substantive claim about the genus's specific objects */
  treatedAsProperOfApplicationGenus: boolean;
}

export interface ScopeResult {
  ok: boolean;
  reason: string;
  warning?: "treated-common-as-proper" | "wrong-genus";
}

export function koinaiArchaiScopeLimiter(use: AxiomUse): ScopeResult {
  if (use.declaredKind === "common") {
    if (use.treatedAsProperOfApplicationGenus) {
      return {
        ok: false,
        reason: "common axiom misused as if it were a proper principle of the target genus",
        warning: "treated-common-as-proper",
      };
    }
    return { ok: true, reason: "common axiom applied within genus by analogy" };
  }
  // proper
  if (!use.homeGenus) {
    return { ok: false, reason: "proper axiom missing homeGenus declaration" };
  }
  if (use.homeGenus !== use.applicationGenus) {
    return {
      ok: false,
      reason: `proper axiom of ${use.homeGenus} cannot be asserted in ${use.applicationGenus}`,
      warning: "wrong-genus",
    };
  }
  return { ok: true, reason: "proper axiom applied within its home genus" };
}
