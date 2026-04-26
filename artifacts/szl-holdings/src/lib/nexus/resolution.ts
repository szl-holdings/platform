/**
 * PRAXIS Entity Resolution Engine
 * Fuzzy name matching, shared identifier resolution, and confidence-scored entity linking.
 */

import { type EntityRecord, KNOWLEDGE_GRAPH, type KnowledgeGraph } from './graph';

export interface ResolutionMatch {
  entity: EntityRecord;
  confidence: number; // 0–100
  matchMethod: MatchMethod;
  matchedOn: string; // what field matched
}

export type MatchMethod =
  | 'exact_id'
  | 'identifier_match'
  | 'exact_label'
  | 'alias_match'
  | 'fuzzy_label'
  | 'fuzzy_alias'
  | 'keyword_label'
  | 'keyword_alias';

/**
 * Jaro-Winkler similarity — industry standard for name matching.
 * Returns 0–1 where 1 = identical.
 */
function jaroSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  const s1l = s1.length;
  const s2l = s2.length;
  if (s1l === 0 || s2l === 0) return 0;

  const matchDistance = Math.floor(Math.max(s1l, s2l) / 2) - 1;
  const s1Matches = new Array(s1l).fill(false);
  const s2Matches = new Array(s2l).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < s1l; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, s2l);
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let k = 0;
  for (let i = 0; i < s1l; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (matches / s1l + matches / s2l + (matches - transpositions / 2) / matches) / 3;
}

function jaroWinklerSimilarity(s1: string, s2: string, prefixScale: number = 0.1): number {
  const jaro = jaroSimilarity(s1, s2);
  const prefixLength = Math.min(
    4,
    [...s1].findIndex((c, i) => c !== s2[i]) === -1
      ? Math.min(s1.length, s2.length)
      : [...s1].findIndex((c, i) => c !== s2[i]),
  );
  return jaro + prefixLength * prefixScale * (1 - jaro);
}

/** Normalize a string for comparison: lowercase, remove punctuation, collapse whitespace. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolve an arbitrary query string to matching entities.
 * Returns sorted matches by confidence (highest first).
 */
export function resolveEntity(
  query: string,
  graph: KnowledgeGraph = KNOWLEDGE_GRAPH,
  minConfidence: number = 40,
): ResolutionMatch[] {
  const q = query.trim();
  const qNorm = normalize(q);
  const matches: ResolutionMatch[] = [];

  for (const entity of graph.entities) {
    let bestMatch: ResolutionMatch | null = null;

    // 1. Exact ID match (100%)
    if (entity.id === q || entity.id === qNorm.replace(/\s+/g, '-')) {
      bestMatch = { entity, confidence: 100, matchMethod: 'exact_id', matchedOn: 'id' };
    }

    // 2. Identifier match — IMO, LEI, matter IDs, etc. (100%)
    if (!bestMatch) {
      for (const [key, val] of Object.entries(entity.identifiers)) {
        if (
          val &&
          (normalize(val) === qNorm ||
            val.toLowerCase().includes(qNorm) ||
            qNorm.includes(val.toLowerCase()))
        ) {
          bestMatch = {
            entity,
            confidence: 98,
            matchMethod: 'identifier_match',
            matchedOn: `identifier:${key}=${val}`,
          };
          break;
        }
      }
    }

    // 3. Exact label match (95%)
    if (!bestMatch && normalize(entity.label) === qNorm) {
      bestMatch = { entity, confidence: 95, matchMethod: 'exact_label', matchedOn: 'label' };
    }

    // 4. Alias exact match (90%)
    if (!bestMatch) {
      for (const alias of entity.aliases) {
        if (normalize(alias) === qNorm) {
          bestMatch = {
            entity,
            confidence: 90,
            matchMethod: 'alias_match',
            matchedOn: `alias:${alias}`,
          };
          break;
        }
      }
    }

    // 5. Fuzzy label match — Jaro-Winkler >= 0.85
    if (!bestMatch) {
      const sim = jaroWinklerSimilarity(qNorm, normalize(entity.label));
      if (sim >= 0.85) {
        bestMatch = {
          entity,
          confidence: Math.round(sim * 100),
          matchMethod: 'fuzzy_label',
          matchedOn: `label:${entity.label} (sim=${sim.toFixed(2)})`,
        };
      }
    }

    // 6. Fuzzy alias match — Jaro-Winkler >= 0.82
    if (!bestMatch) {
      for (const alias of entity.aliases) {
        const sim = jaroWinklerSimilarity(qNorm, normalize(alias));
        if (sim >= 0.82) {
          bestMatch = {
            entity,
            confidence: Math.round(sim * 95),
            matchMethod: 'fuzzy_alias',
            matchedOn: `alias:${alias} (sim=${sim.toFixed(2)})`,
          };
          break;
        }
      }
    }

    // 7. Keyword substring in label or alias (confidence based on coverage)
    if (!bestMatch) {
      const qWords = qNorm.split(' ').filter((w) => w.length > 2);
      const labelNorm = normalize(entity.label);
      const _labelWords = labelNorm.split(' ');
      const labelHits = qWords.filter((w) => labelNorm.includes(w)).length;
      const aliasHits = entity.aliases.reduce((max, alias) => {
        const hits = qWords.filter((w) => normalize(alias).includes(w)).length;
        return Math.max(max, hits);
      }, 0);

      const hits = Math.max(labelHits, aliasHits);
      if (hits > 0 && qWords.length > 0) {
        const coverage = hits / qWords.length;
        const confidence = Math.round(coverage * 70); // max 70% for keyword match
        if (confidence >= minConfidence) {
          bestMatch = {
            entity,
            confidence,
            matchMethod: labelHits >= aliasHits ? 'keyword_label' : 'keyword_alias',
            matchedOn: `${hits}/${qWords.length} keywords matched`,
          };
        }
      }

      // Additional: check if query contains entity type keywords
      if (!bestMatch) {
        const typeKeywords: Record<string, string[]> = {
          vessel: ['vessel', 'ship', 'imo', 'tanker', 'bulk carrier', 'panamax'],
          person: ['person', 'individual', 'principal', 'owner'],
          organization: ['company', 'corp', 'ltd', 'llc', 'organization', 'maritime'],
          property: ['property', 'real estate', 'loft', 'plaza', 'building', 'address'],
          matter: ['matter', 'litigation', 'case', 'dispute', 'fraud', 'lawsuit'],
          threat: ['threat', 'sanctions', 'ofac', 'apt', 'cyber', 'indicator'],
          asset: ['asset', 'deal', 'facility', 'credit'],
        };
        const typeKws = typeKeywords[entity.type] || [];
        const typeHit = typeKws.some((kw) => qNorm.includes(kw));
        if (typeHit && labelHits > 0) {
          bestMatch = {
            entity,
            confidence: Math.max(minConfidence, 45),
            matchMethod: 'keyword_label',
            matchedOn: `type:${entity.type} + keyword`,
          };
        }
      }
    }

    if (bestMatch && bestMatch.confidence >= minConfidence) {
      matches.push(bestMatch);
    }
  }

  // Deduplicate by entity ID, keeping highest confidence
  const deduped = new Map<string, ResolutionMatch>();
  for (const m of matches) {
    const existing = deduped.get(m.entity.id);
    if (!existing || m.confidence > existing.confidence) {
      deduped.set(m.entity.id, m);
    }
  }

  return [...deduped.values()].sort((a, b) => b.confidence - a.confidence);
}

/**
 * Resolve all cross-domain entity links for an entity.
 * Scans the graph for all entities that share identifiers with the target.
 */
export function findLinkedEntities(
  entityId: string,
  graph: KnowledgeGraph = KNOWLEDGE_GRAPH,
): Array<{ entity: EntityRecord; sharedIdentifiers: string[] }> {
  const target = graph.entities.find((e) => e.id === entityId);
  if (!target) return [];

  const results: Array<{ entity: EntityRecord; sharedIdentifiers: string[] }> = [];

  for (const candidate of graph.entities) {
    if (candidate.id === entityId) continue;
    const shared: string[] = [];

    for (const [key, val] of Object.entries(target.identifiers)) {
      if (val && candidate.identifiers[key] === val) {
        shared.push(`${key}:${val}`);
      }
    }

    // Also check if candidate labels/aliases appear in target's domainData strings
    const targetDataStr = JSON.stringify(target.domainData).toLowerCase();
    for (const alias of [candidate.label, ...candidate.aliases]) {
      if (targetDataStr.includes(alias.toLowerCase()) && alias.length > 4) {
        shared.push(`mention:${alias}`);
      }
    }

    if (shared.length > 0) {
      results.push({ entity: candidate, sharedIdentifiers: [...new Set(shared)] });
    }
  }

  return results;
}

/**
 * Compute a confidence score for whether two entities should be merged/linked.
 * Used for cross-domain entity deduplication.
 */
export function computeLinkConfidence(a: EntityRecord, b: EntityRecord): number {
  if (a.id === b.id) return 100;

  let score = 0;

  // Same type = prerequisite for merging
  if (a.type !== b.type) return 0;

  // Exact identifier overlap
  for (const [key, val] of Object.entries(a.identifiers)) {
    if (val && b.identifiers[key] === val) score += 40;
  }

  // Label similarity
  const labelSim = jaroWinklerSimilarity(normalize(a.label), normalize(b.label));
  score += labelSim * 30;

  // Alias overlap
  for (const aliasA of a.aliases) {
    for (const aliasB of b.aliases) {
      const sim = jaroWinklerSimilarity(normalize(aliasA), normalize(aliasB));
      if (sim > 0.9) score += 20;
    }
  }

  return Math.min(100, Math.round(score));
}
