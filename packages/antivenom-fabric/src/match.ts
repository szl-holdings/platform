import {
  type AttackEntry,
  type AntivenomSeverity,
  ANTIVENOM_CATALOGUE,
  SEVERITY_PENALTY,
} from './catalogue.js';

export interface MatchHit {
  attackId: string;
  family: string;
  severity: AntivenomSeverity;
  layer: AttackEntry['layer'];
  antidote: string;
  description: string;
  matchedText: string;
}

export interface MatchResult {
  matches: MatchHit[];
  suggestedAntidotes: string[];
  /** Adversarial Resistance multiplier for AMI v2 (A ∈ [0.10, 1.00]).
   *  Product of severity penalties across all matched families. */
  adversarialResistance: number;
  /** Worst severity observed; undefined when no matches. */
  topSeverity?: AntivenomSeverity;
}

/**
 * Match an input string against the antivenom catalogue.
 * Layered application: scans every pattern; consumer can filter by layer.
 *
 * Deterministic, no allocations beyond the result envelope when no matches —
 * safe to call on the AMI hot path.
 */
export function match(
  input: string,
  catalogue: readonly AttackEntry[] = ANTIVENOM_CATALOGUE,
): MatchResult {
  if (!input || typeof input !== 'string') {
    return { matches: [], suggestedAntidotes: [], adversarialResistance: 1 };
  }

  const matches: MatchHit[] = [];
  const seenFamilies = new Set<string>();
  let resistance = 1;
  let topSeverity: AntivenomSeverity | undefined;

  for (const entry of catalogue) {
    const m = entry.attackPattern.exec(input);
    if (!m) continue;
    matches.push({
      attackId: entry.id,
      family: entry.family,
      severity: entry.severity,
      layer: entry.layer,
      antidote: entry.antidote,
      description: entry.description,
      matchedText: m[0],
    });
    // Only penalise once per family so two patterns from the same family don't
    // multiply against each other.
    if (!seenFamilies.has(entry.family)) {
      seenFamilies.add(entry.family);
      resistance *= SEVERITY_PENALTY[entry.severity];
    }
    if (
      !topSeverity ||
      SEVERITY_PENALTY[entry.severity] < SEVERITY_PENALTY[topSeverity]
    ) {
      topSeverity = entry.severity;
    }
  }

  return {
    matches,
    suggestedAntidotes: Array.from(new Set(matches.map((m) => m.antidote))),
    adversarialResistance: Number(resistance.toFixed(6)),
    topSeverity,
  };
}
