/**
 * Primitive 75 — Axiom / posit separator
 *
 * Aristotle distinguishes:
 *   - axioms (κοιναί ἀρχαί): common, indemonstrable, used across
 *     sciences. NCN (non-contradiction), EM (excluded middle),
 *     "equals from equals are equal."
 *   - posits (θέσεις) split into:
 *       - definitions (ὁρισμοί): what a thing is — no existence
 *         claim
 *       - hypotheses (ὑποθέσεις): existence claims — "there is a
 *         unit," "there is a point"
 *
 * Mixing the three is the silent fault behind most bad inference.
 * The separator forces every premise to declare its kind.
 */

export type PremiseKind = "axiom" | "definition" | "hypothesis" | "unknown";

export interface Premise {
  id: string;
  text: string;
  kind: PremiseKind;
}

export interface SeparationReport {
  axioms: Premise[];
  definitions: Premise[];
  hypotheses: Premise[];
  unknowns: Premise[];
  ok: boolean; // ok iff no unknowns
  reason: string;
}

export function separate(premises: Premise[]): SeparationReport {
  const axioms: Premise[] = [];
  const definitions: Premise[] = [];
  const hypotheses: Premise[] = [];
  const unknowns: Premise[] = [];
  for (const p of premises) {
    switch (p.kind) {
      case "axiom":
        axioms.push(p);
        break;
      case "definition":
        definitions.push(p);
        break;
      case "hypothesis":
        hypotheses.push(p);
        break;
      default:
        unknowns.push(p);
    }
  }
  const ok = unknowns.length === 0;
  return {
    axioms,
    definitions,
    hypotheses,
    unknowns,
    ok,
    reason: ok ? "all premises classified" : `${unknowns.length} unclassified`,
  };
}

// Aristotle: definitions never assert existence. Refuse a definition
// that smuggles "there is" / "exists" inside it.
export function definitionIsHonest(d: Premise): boolean {
  if (d.kind !== "definition") return false;
  const t = d.text.toLowerCase();
  return !/\b(there is|there exists|exists)\b/.test(t);
}
