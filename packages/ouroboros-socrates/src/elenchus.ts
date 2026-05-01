/**
 * Primitive 31 — Elenchus (reductio / refutation gate)
 *
 * Source: Plato, Republic 349a10–354, Sophist 230, Theaetetus 197a;
 *         characterised at Republic 533c8 as anairousa — taking up.
 * Working summary: Eva Brann, op. cit.
 *
 * An elenchus runs a candidate claim against contraries derivable from the
 * same hypothesis set. Verdicts:
 *   WITHSTOOD — no contradiction reachable in maxSteps; claim admitted
 *   REFUTED   — explicit contradiction reached (claim ∧ ¬claim derivable)
 *   APORIA    — neither claim nor contradiction reachable; perplexity logged
 */

export type ElenchusVerdict = "WITHSTOOD" | "REFUTED" | "APORIA";

export interface Proposition {
  id: string;
  text: string;
  /** Optional negation pointer; if both p and ¬p reachable from same hypothesis set, REFUTED. */
  negationOf?: string;
}

export interface Inference {
  fromIds: string[];
  toId: string;
  hypothesisIds: string[]; // hypotheses required for this inference
}

export interface ElenchusInput {
  claimId: string;
  hypothesisIds: string[];
  propositions: Proposition[];
  inferences: Inference[];
  maxSteps?: number;
}

export interface ElenchusResult {
  claimId: string;
  verdict: ElenchusVerdict;
  reachedIds: string[];
  contradictionPair: [string, string] | null;
  steps: number;
  reason: string;
}

export function runElenchus(input: ElenchusInput): ElenchusResult {
  const { claimId, hypothesisIds, propositions, inferences, maxSteps = 64 } = input;
  const propIndex = new Map(propositions.map((p) => [p.id, p]));
  const hypSet = new Set(hypothesisIds);

  // BFS forward closure under inferences whose hypotheses are all in hypSet.
  const reached = new Set<string>(hypothesisIds);
  let steps = 0;
  let advanced = true;
  while (advanced && steps < maxSteps) {
    advanced = false;
    steps += 1;
    for (const inf of inferences) {
      if (reached.has(inf.toId)) continue;
      const hypsOk = inf.hypothesisIds.every((h) => hypSet.has(h));
      const fromsOk = inf.fromIds.every((f) => reached.has(f));
      if (hypsOk && fromsOk) {
        reached.add(inf.toId);
        advanced = true;
      }
    }
  }

  // Check for explicit contradiction: any prop p with negationOf q where both reached.
  for (const p of propositions) {
    if (p.negationOf && reached.has(p.id) && reached.has(p.negationOf)) {
      return {
        claimId,
        verdict: "REFUTED",
        reachedIds: [...reached],
        contradictionPair: [p.id, p.negationOf],
        steps,
        reason: `Contradiction: ${p.id} and ${p.negationOf} both reachable from declared hypotheses.`,
      };
    }
  }

  if (reached.has(claimId)) {
    return {
      claimId,
      verdict: "WITHSTOOD",
      reachedIds: [...reached],
      contradictionPair: null,
      steps,
      reason: "Claim derivable; no contradiction reached (Republic elenchus passed).",
    };
  }

  // Sanity: claim must exist.
  if (!propIndex.has(claimId)) {
    return {
      claimId,
      verdict: "APORIA",
      reachedIds: [...reached],
      contradictionPair: null,
      steps,
      reason: "Claim id absent from proposition set; perplexity (aporia) logged.",
    };
  }

  return {
    claimId,
    verdict: "APORIA",
    reachedIds: [...reached],
    contradictionPair: null,
    steps,
    reason: "Neither claim nor contradiction reachable; aporia (Theaetetus 197a).",
  };
}
