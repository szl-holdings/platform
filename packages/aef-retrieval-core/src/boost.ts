import type { DenseHit } from "./adapters.js";
import type { FusedHit } from "./fusion.js";

export type BoostRuleKind =
  | "imo-number"
  | "mmsi"
  | "vessel-name"
  | "sanctions-name"
  | "docket-id"
  | "case-number"
  | "citation-code"
  | "parcel-id"
  | "property-address"
  | "cve-id"
  | "incident-id"
  | "compliance-term"
  | "regulation-code"
  | "control-id"
  | "entity-id"
  | "custom";

export interface BoostRule {
  ruleId: string;
  kind: BoostRuleKind;
  pattern: RegExp;
  scoreMultiplier: number;
  metadataField?: string;
}

export interface BoostedHit extends FusedHit {
  boostApplied: boolean;
  boostRuleId?: string;
  boostedScore: number;
}

const DEFAULT_RULES: BoostRule[] = [
  {
    ruleId: "imo-number",
    kind: "imo-number",
    pattern: /\bimo\s*\d{7}\b/i,
    scoreMultiplier: 2.0,
    metadataField: "imo",
  },
  {
    ruleId: "mmsi",
    kind: "mmsi",
    pattern: /\bmmsi\s*\d{9}\b/i,
    scoreMultiplier: 1.8,
    metadataField: "mmsi",
  },
  {
    ruleId: "cve-id",
    kind: "cve-id",
    pattern: /\bcve-\d{4}-\d{4,}\b/i,
    scoreMultiplier: 2.0,
    metadataField: "cveId",
  },
  {
    ruleId: "docket-id",
    kind: "docket-id",
    pattern: /\b\d{1,2}[-:]\d{2,5}[-:][a-z]{2,4}\b/i,
    scoreMultiplier: 1.9,
    metadataField: "docketId",
  },
  {
    ruleId: "case-number",
    kind: "case-number",
    pattern: /\bcase\s*(?:no\.?|number)?\s*[a-z0-9\-]+/i,
    scoreMultiplier: 1.7,
    metadataField: "caseNumber",
  },
  {
    ruleId: "parcel-id",
    kind: "parcel-id",
    pattern: /\b\d{3}-\d{3}-\d{3,}\b/,
    scoreMultiplier: 1.9,
    metadataField: "parcelId",
  },
  {
    ruleId: "regulation-code",
    kind: "regulation-code",
    pattern: /\b(?:iso|nist|soc2?|pci[\s-]?dss|gdpr|ccpa|hipaa)\b/i,
    scoreMultiplier: 1.6,
    metadataField: "regulationCode",
  },
  {
    ruleId: "incident-id",
    kind: "incident-id",
    pattern: /\binc[-_]\d{4,}\b/i,
    scoreMultiplier: 1.8,
    metadataField: "incidentId",
  },
];

function extractMatchedTerm(query: string, rule: BoostRule): string | null {
  const match = rule.pattern.exec(query);
  return match ? (match[0] ?? null) : null;
}

function hitContainsTerm(
  hit: FusedHit,
  rule: BoostRule,
  matchedTerm: string,
): boolean {
  const needle = matchedTerm.toLowerCase();

  if (rule.metadataField !== undefined) {
    const fieldVal = hit.metadata[rule.metadataField];
    if (typeof fieldVal === "string") {
      return fieldVal.toLowerCase().includes(needle);
    }
    return false;
  }

  for (const val of Object.values(hit.metadata)) {
    if (typeof val === "string" && val.toLowerCase().includes(needle)) {
      return true;
    }
  }
  return false;
}

/**
 * Pre-fusion boost: adjusts DenseHit.score BEFORE reciprocal rank fusion.
 * This ensures exact-match signals influence the fusion ranking rather than
 * only post-fusion re-scoring. Returns the same DenseHit array with scores
 * multiplied by the best matching boost rule.
 */
export function applyPreFusionBoosts(
  hits: DenseHit[],
  query: string,
  customRules: BoostRule[] = [],
): DenseHit[] {
  const rules = [...DEFAULT_RULES, ...customRules];

  const matchedRulesToTerms: Array<{ rule: BoostRule; term: string }> = [];
  for (const rule of rules) {
    const term = extractMatchedTerm(query, rule);
    if (term !== null) {
      matchedRulesToTerms.push({ rule, term });
    }
  }

  if (matchedRulesToTerms.length === 0) return hits;

  return hits.map((hit): DenseHit => {
    let bestMultiplier = 0;

    for (const { rule, term } of matchedRulesToTerms) {
      if (rule.scoreMultiplier > bestMultiplier) {
        const needle = term.toLowerCase();
        for (const val of Object.values(hit.metadata)) {
          if (typeof val === "string" && val.toLowerCase().includes(needle)) {
            bestMultiplier = rule.scoreMultiplier;
            break;
          }
        }
      }
    }

    return bestMultiplier > 0
      ? { ...hit, score: hit.score * bestMultiplier }
      : hit;
  });
}

/**
 * wrapAsBoosted — type-level adaptor only.
 * Converts FusedHit[] → BoostedHit[] without re-applying any boost rules.
 * Use when exact-match boost was already incorporated into dense scores before fusion
 * (via applyPreFusionBoosts), so the boost signal is already reflected in fusedScore.
 * boostedScore is set to fusedScore as the downstream canonical score.
 */
export function wrapAsBoosted(hits: FusedHit[]): BoostedHit[] {
  return hits.map((hit): BoostedHit => ({
    ...hit,
    boostApplied: false, // exact-match boost was applied pre-fusion; not re-applied here
    boostedScore: hit.fusedScore,
  }));
}

export function applyExactMatchBoosts(
  hits: FusedHit[],
  query: string,
  customRules: BoostRule[] = [],
): BoostedHit[] {
  const rules = [...DEFAULT_RULES, ...customRules];

  const matchedRulesToTerms: Array<{ rule: BoostRule; term: string }> = [];
  for (const rule of rules) {
    const term = extractMatchedTerm(query, rule);
    if (term !== null) {
      matchedRulesToTerms.push({ rule, term });
    }
  }

  return hits.map((hit): BoostedHit => {
    if (matchedRulesToTerms.length === 0) {
      return { ...hit, boostApplied: false, boostedScore: hit.fusedScore };
    }

    let bestRule: BoostRule | undefined;
    let bestMultiplier = 0;

    for (const { rule, term } of matchedRulesToTerms) {
      if (
        rule.scoreMultiplier > bestMultiplier &&
        hitContainsTerm(hit, rule, term)
      ) {
        bestRule = rule;
        bestMultiplier = rule.scoreMultiplier;
      }
    }

    if (bestRule === undefined) {
      return { ...hit, boostApplied: false, boostedScore: hit.fusedScore };
    }

    return {
      ...hit,
      boostApplied: true,
      boostRuleId: bestRule.ruleId,
      boostedScore: hit.fusedScore * bestMultiplier,
    };
  });
}
