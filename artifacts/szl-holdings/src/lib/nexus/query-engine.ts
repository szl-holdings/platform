/**
 * PRAXIS "Follow the Thread" Natural Language Query Engine
 * Parses natural language queries, resolves entities, and traverses the knowledge graph
 * to return relevant subgraphs with highlighted paths.
 */

import {
  type Domain,
  type EntityRecord,
  type EntityType,
  getEntity,
  KNOWLEDGE_GRAPH,
  type KnowledgeGraph,
  traverseGraph,
} from './graph';
import { type ResolutionMatch, resolveEntity } from './resolution';

export interface QueryIntent {
  type:
    | 'entity_focus'
    | 'relationship_explore'
    | 'domain_filter'
    | 'risk_scan'
    | 'identifier_lookup';
  entityRefs: string[]; // extracted entity names / identifiers from query
  entityTypes?: EntityType[]; // type filters if query specifies them
  domains?: Domain[]; // domain filters
  relationshipFilters?: string[];
  depth: number; // how many hops to traverse
  riskThreshold?: number; // min risk score filter
}

export interface QueryResult {
  query: string;
  intent: QueryIntent;
  resolvedEntities: ResolutionMatch[];
  subgraphEntityIds: Set<string>;
  subgraphEdgeIds: Set<string>;
  highlightedEntityIds: Set<string>; // primary matches (vs. neighborhood)
  summary: string;
  confidence: number; // 0–100 — how confident we are in query interpretation
}

/**
 * Intent extraction patterns — ordered by specificity.
 * Each pattern extracts intent type and adjusts traversal depth.
 */
const INTENT_PATTERNS: Array<{
  pattern: RegExp;
  type: QueryIntent['type'];
  depth: number;
  extract: (match: RegExpMatchArray, query: string) => Partial<QueryIntent>;
}> = [
  // "show everything connected to X" / "all connections to X"
  {
    pattern:
      /\b(everything|all|connections?|network|web)\b.{0,30}\b(connected|related|linked|tied|about)\b.{0,30}(to|for|with)\b/i,
    type: 'entity_focus',
    depth: 3,
    extract: (_, _query) => ({ depth: 3 }),
  },
  // "follow the thread on X" / "trace X"
  {
    pattern: /\b(follow|trace|track|thread)\b.{0,20}\b(the\b.{0,10})?(thread|chain|path|trail)?\b/i,
    type: 'relationship_explore',
    depth: 3,
    extract: () => ({ depth: 3 }),
  },
  // "who owns X" / "ownership of X"
  {
    pattern: /\b(who\s+owns?|ownership\s+of|beneficial\s+owner|owner\s+of)\b/i,
    type: 'relationship_explore',
    depth: 2,
    extract: () => ({ depth: 2, relationshipFilters: ['owns', 'controls', 'holds', 'subsidiary'] }),
  },
  // "show me IMO X" / "vessel IMO NNNNNNN"
  {
    pattern: /\b(imo|mmsi)\s*[:\s]?\s*(\d{7,9})\b/i,
    type: 'identifier_lookup',
    depth: 2,
    extract: (match) => ({ entityRefs: [match[2]], depth: 2 }),
  },
  // "show me matter #PR-XXXX" / "case PR-2024-XXXX"
  {
    pattern: /\b(matter|case|claim|dispute)\s*#?\s*(PR-[\d-]+)\b/i,
    type: 'identifier_lookup',
    depth: 2,
    extract: (match) => ({ entityRefs: [match[2]], depth: 2 }),
  },
  // "sanctions" / "OFAC" / "SDN"
  {
    pattern: /\b(sanctions?|ofac|sdn|restricted\s+party)\b/i,
    type: 'risk_scan',
    depth: 2,
    extract: () => ({ entityTypes: ['threat' as EntityType], riskThreshold: 70 }),
  },
  // "threat" / "APT" / "cyber"
  {
    pattern: /\b(threat|apt|cyber|malware|indicator|attack)\b/i,
    type: 'risk_scan',
    depth: 2,
    extract: () => ({ entityTypes: ['threat' as EntityType] }),
  },
  // "vessel" / "ship" / "fleet"
  {
    pattern: /\b(vessel|ship|fleet|maritime|cargo|tanker|bulk\s+carrier)\b/i,
    type: 'domain_filter',
    depth: 2,
    extract: () => ({ entityTypes: ['vessel' as EntityType], domains: ['vessels' as Domain] }),
  },
  // "real estate" / "property" / "distress"
  {
    pattern: /\b(real\s+estate|property|properties|distress|loft|plaza|NOI|cap\s+rate)\b/i,
    type: 'domain_filter',
    depth: 2,
    extract: () => ({ entityTypes: ['property' as EntityType], domains: ['property' as Domain] }),
  },
  // "legal" / "litigation" / "matter" / "PRISM"
  {
    pattern: /\b(legal|litigation|matter|case|PRISM|counsel|lawsuit|dispute|arbitration)\b/i,
    type: 'domain_filter',
    depth: 2,
    extract: () => ({ entityTypes: ['matter' as EntityType], domains: ['legal' as Domain] }),
  },
  // "high risk" / "critical" / "risk score"
  {
    pattern: /\b(high\s*risk|critical|risk\s*score|at\s*risk|dangerous)\b/i,
    type: 'risk_scan',
    depth: 2,
    extract: () => ({ riskThreshold: 70 }),
  },
];

/**
 * Extract entity references from a query string.
 * Uses quoted strings, proper nouns heuristics, and domain-specific patterns.
 */
function extractEntityRefs(query: string): string[] {
  const refs: string[] = [];

  // 1. Quoted strings (most reliable)
  const quoted = query.match(/["'"]([^"'"]+)["'"]/g);
  if (quoted) {
    refs.push(...quoted.map((q) => q.replace(/^["'"]|["'"]$/g, '').trim()));
  }

  // 2. IMO numbers
  const imoMatch = query.match(/\bIMO\s*:?\s*(\d{7,9})\b/i);
  if (imoMatch) refs.push(imoMatch[1]);

  // 3. Matter IDs (PR-XXXX-XXXX)
  const matterMatch = query.match(/\bPR-[\d-]+\b/g);
  if (matterMatch) refs.push(...matterMatch);

  // 4. Capitalized phrases (2-3 word proper nouns, excluding common words)
  const stopWords = new Set([
    'show',
    'me',
    'everything',
    'the',
    'all',
    'connected',
    'to',
    'about',
    'for',
    'with',
    'in',
    'find',
    'get',
    'what',
    'who',
    'from',
    'and',
    'or',
    'is',
    'are',
    'follow',
    'thread',
    'vessel',
    'ship',
    'matter',
    'legal',
    'real',
    'estate',
    'high',
    'risk',
  ]);
  const capitalizedPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b/g;
  let m;
  while ((m = capitalizedPattern.exec(query)) !== null) {
    const phrase = m[1];
    const words = phrase.split(' ');
    if (words.some((w) => !stopWords.has(w.toLowerCase()) && w.length > 2)) {
      refs.push(phrase);
    }
  }

  // 5. "MV [name]" vessel pattern
  const mvMatch = query.match(/\bMV\s+([A-Z][a-zA-Z\s]+)\b/);
  if (mvMatch) refs.push(mvMatch[0]);

  return [...new Set(refs)].filter((r) => r.length > 2);
}

/**
 * Parse a natural language query into a structured intent.
 */
export function parseQueryIntent(query: string): QueryIntent {
  const defaults: QueryIntent = {
    type: 'entity_focus',
    entityRefs: extractEntityRefs(query),
    depth: 2,
  };

  // Apply patterns to determine intent and adjust parameters
  for (const { pattern, type, depth, extract } of INTENT_PATTERNS) {
    const match = query.match(pattern);
    if (match) {
      const extracted = extract(match, query);
      return {
        ...defaults,
        type,
        depth: extracted.depth ?? depth,
        ...extracted,
        entityRefs: extracted.entityRefs ?? defaults.entityRefs,
      };
    }
  }

  return defaults;
}

/**
 * Execute a PRAXIS query against the knowledge graph.
 * Returns a subgraph result with entity/edge IDs to highlight.
 */
export function executeQuery(
  queryText: string,
  graph: KnowledgeGraph = KNOWLEDGE_GRAPH,
): QueryResult {
  const intent = parseQueryIntent(queryText);

  // Resolve entities from extracted refs
  const resolvedEntities: ResolutionMatch[] = [];
  for (const ref of intent.entityRefs) {
    const matches = resolveEntity(ref, graph, 35);
    if (matches.length > 0) {
      resolvedEntities.push(matches[0]); // take best match
    }
  }

  // If no entity refs found, try resolving the full query
  if (resolvedEntities.length === 0 && intent.entityRefs.length === 0) {
    const matches = resolveEntity(queryText, graph, 35);
    resolvedEntities.push(...matches.slice(0, 3));
  }

  // Apply type/domain filters for scan intents
  let seedEntities: EntityRecord[] = [];

  if (intent.type === 'risk_scan') {
    // Risk scan: find entities matching risk threshold or type
    seedEntities = graph.entities.filter((e) => {
      const typeMatch = !intent.entityTypes || intent.entityTypes.includes(e.type);
      const riskMatch = !intent.riskThreshold || e.riskScore >= intent.riskThreshold;
      const domainMatch = !intent.domains || intent.domains.some((d) => e.domains.includes(d));
      return typeMatch && riskMatch && domainMatch;
    });
  } else if (intent.type === 'domain_filter') {
    // Domain filter: entities of specific type/domain
    seedEntities = graph.entities
      .filter((e) => {
        const typeMatch = !intent.entityTypes || intent.entityTypes.includes(e.type);
        const domainMatch = !intent.domains || intent.domains.some((d) => e.domains.includes(d));
        return typeMatch && domainMatch;
      })
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 6);
  } else {
    // Entity focus / relationship explore: use resolved entities as seeds
    seedEntities = resolvedEntities.map((r) => r.entity);
  }

  // Traverse from all seed entities
  const allReachable = new Set<string>();
  const highlighted = new Set<string>();

  for (const entity of seedEntities) {
    highlighted.add(entity.id);
    const reachable = traverseGraph(entity.id, intent.depth, graph);
    for (const id of reachable) allReachable.add(id);
  }

  // Also include directly resolved entities in highlight
  for (const r of resolvedEntities) {
    highlighted.add(r.entity.id);
  }

  // Filter edges to subgraph
  const subgraphEdgeIds = new Set<string>(
    graph.edges
      .filter((e) => allReachable.has(e.sourceId) && allReachable.has(e.targetId))
      .map((e) => e.id),
  );

  // Build summary
  const entityNames = [...highlighted].map((id) => getEntity(id, graph)?.label).filter(Boolean);
  let summary = '';
  if (resolvedEntities.length > 0) {
    summary = `Found ${highlighted.size} primary entities (${entityNames.slice(0, 3).join(', ')}${highlighted.size > 3 ? '…' : ''}) with ${allReachable.size} total connected nodes across ${subgraphEdgeIds.size} edges.`;
  } else if (intent.type === 'risk_scan') {
    summary = `Risk scan across ${intent.entityTypes?.join(', ') || 'all types'}: ${highlighted.size} entities with risk score ≥ ${intent.riskThreshold ?? 0}, ${allReachable.size} total in expanded view.`;
  } else if (intent.type === 'domain_filter') {
    summary = `Domain filter (${intent.domains?.join(', ') || intent.entityTypes?.join(', ')}): ${highlighted.size} primary entities, ${allReachable.size} connected.`;
  } else {
    summary = `Query matched ${allReachable.size} entities and ${subgraphEdgeIds.size} relationships.`;
  }

  const confidence =
    resolvedEntities.length > 0
      ? Math.max(...resolvedEntities.map((r) => r.confidence))
      : intent.type === 'domain_filter' || intent.type === 'risk_scan'
        ? 80
        : 40;

  return {
    query: queryText,
    intent,
    resolvedEntities,
    subgraphEntityIds: allReachable,
    subgraphEdgeIds,
    highlightedEntityIds: highlighted,
    summary,
    confidence,
  };
}
