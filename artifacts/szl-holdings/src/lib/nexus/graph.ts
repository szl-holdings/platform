/**
 * NEXUS Knowledge Graph — Core Data Model
 * Entity types, relationship types, and the base graph with domain-cross-referenced records.
 */

export type EntityType =
  | 'person'
  | 'organization'
  | 'vessel'
  | 'property'
  | 'matter'
  | 'threat'
  | 'asset';

export type RelationshipType =
  | 'owns'
  | 'operates'
  | 'controls'
  | 'litigates'
  | 'threatens'
  | 'invests'
  | 'subsidiary'
  | 'associated_with'
  | 'co_invests'
  | 'finances'
  | 'flagged_by'
  | 'holds';

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';

export type Domain = 'vessels' | 'legal' | 'property' | 'threat' | 'financial' | 'operations';

export interface EntityRecord {
  id: string;
  label: string;
  type: EntityType;
  subtitle: string;
  risk: RiskLevel;
  riskScore: number; // 0–100 composite risk
  domains: Domain[];
  identifiers: Record<string, string>; // e.g. { imo: "9234567", lei: "...", cik: "..." }
  aliases: string[]; // alternate names for entity resolution
  domainData: DomainData;
  createdAt: string;
  updatedAt: string;
}

export interface DomainData {
  vessels?: VesselsData;
  legal?: LegalData;
  property?: PropertyData;
  threat?: ThreatData;
  financial?: FinancialData;
}

export interface VesselsData {
  imoNumber?: string;
  vesselType?: string;
  currentPosition?: string;
  lastKnownRoute?: string;
  aisGapHours?: number;
  routeRisk?: 'RED' | 'AMBER' | 'GREEN';
  transitCount30d?: number;
  charterValuePerDay?: number;
}

export interface LegalData {
  matterIds?: string[];
  matterStatus?: string;
  aggregateExposure?: number;
  activeArbitrations?: number;
  settlementForecast?: number;
}

export interface PropertyData {
  addresses?: string[];
  totalAUM?: number;
  distressScore?: number; // 0–100
  capRate?: number;
  ltv?: number;
  dscr?: number;
  noi?: number;
}

export interface ThreatData {
  indicators?: string[];
  ofacMatchConfidence?: number; // 0–100
  aptAssociations?: string[];
  ipOverlap?: boolean;
  sanctionsPrograms?: string[];
}

export interface FinancialData {
  aum?: number;
  activePositions?: number;
  irr?: number;
  facilitySize?: number;
  facilityStatus?: string;
}

export interface EdgeRecord {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: RelationshipType;
  confidence: number; // 0–100, how confident we are this edge is real
  strength: number; // 0–1, how strong/direct the relationship is
  inferred: boolean; // true = NEXUS-inferred, false = directly evidenced
  evidenceSources: string[]; // where this edge was derived from
  discoveredAt: string;
}

export interface KnowledgeGraph {
  entities: EntityRecord[];
  edges: EdgeRecord[];
  version: string;
  lastRefreshed: string;
}

/**
 * Raw entity data — the canonical NEXUS knowledge base.
 * All cross-domain enrichment lives here.
 */
export const NEXUS_ENTITIES: EntityRecord[] = [
  {
    id: 'viktor-sorokin',
    label: 'Viktor Sorokin',
    type: 'person',
    subtitle: 'Principal · Sorokin Maritime Ltd',
    risk: 'critical',
    riskScore: 94,
    domains: ['vessels', 'legal', 'threat', 'financial', 'property'],
    identifiers: { sanctionsWatchId: 'SDN-CAND-2024-0091' },
    aliases: ['Victor Sorokin', 'V. Sorokin', 'Viktor A. Sorokin'],
    domainData: {
      vessels: { imoNumber: undefined, transitCount30d: 3 },
      legal: { matterIds: ['PR-2024-0892'], aggregateExposure: 8400000, activeArbitrations: 1 },
      threat: {
        ofacMatchConfidence: 87,
        sanctionsPrograms: ['Iran', 'Russia', 'Global Terrorism'],
      },
      property: { totalAUM: 11300000, distressScore: 58 },
      financial: { facilitySize: 12000000, facilityStatus: 'Under litigation' },
    },
    createdAt: '2024-01-15',
    updatedAt: '2026-04-12',
  },
  {
    id: 'sorokin-maritime',
    label: 'Sorokin Maritime Ltd',
    type: 'organization',
    subtitle: 'Maritime operator · Registered BVI',
    risk: 'high',
    riskScore: 81,
    domains: ['vessels', 'financial'],
    identifiers: { lei: 'SOROK-BVI-2019-443', bvi: 'BC0712934' },
    aliases: ['Sorokin Maritime', 'Sorokin Maritime Limited', 'SML BVI'],
    domainData: {
      vessels: { vesselType: 'Panamax bulk carrier operator', transitCount30d: 3 },
      financial: { facilitySize: 12000000, facilityStatus: 'Dispute pending' },
    },
    createdAt: '2024-02-01',
    updatedAt: '2026-04-12',
  },
  {
    id: 'mv-arctic-eagle',
    label: 'MV Arctic Eagle',
    type: 'vessel',
    subtitle: 'IMO 9234567 · Panamax bulk carrier',
    risk: 'critical',
    riskScore: 91,
    domains: ['vessels', 'threat'],
    identifiers: { imo: '9234567', mmsi: '311056700', flag: 'Panama' },
    aliases: ['Arctic Eagle', 'MV Arctic Eagle', 'Arctic Eagle IMO 9234567'],
    domainData: {
      vessels: {
        imoNumber: '9234567',
        vesselType: 'Panamax bulk carrier',
        currentPosition: '21.4°N, 38.8°E · Red Sea · Northbound',
        lastKnownRoute: 'Red Sea corridor',
        aisGapHours: 18,
        routeRisk: 'RED',
        transitCount30d: 3,
        charterValuePerDay: 42000,
      },
      threat: {
        ofacMatchConfidence: 87,
        sanctionsPrograms: ['Iran', 'Russia', 'Global Terrorism'],
        indicators: ['OFAC SDN candidate', 'AIS dark period Apr 9'],
      },
    },
    createdAt: '2024-03-10',
    updatedAt: '2026-04-12',
  },
  {
    id: 'shell-delta',
    label: 'Shell Co. Delta',
    type: 'organization',
    subtitle: 'Beneficial owner entity · Nassau, Bahamas',
    risk: 'high',
    riskScore: 76,
    domains: ['financial', 'legal'],
    identifiers: { bahamasReg: 'BS-2021-7734' },
    aliases: ['Delta Holdings', 'Shell Co Delta', 'SCD Nassau'],
    domainData: {
      financial: { facilitySize: 12000000, facilityStatus: 'Intermediate holding' },
      legal: { matterIds: ['PR-2024-0892'], aggregateExposure: 8400000 },
    },
    createdAt: '2024-06-01',
    updatedAt: '2026-04-08',
  },
  {
    id: 'ofac-flag-sorokin',
    label: 'OFAC Sanctions Flag',
    type: 'threat',
    subtitle: 'SDN candidate match · 87% confidence',
    risk: 'critical',
    riskScore: 95,
    domains: ['threat', 'vessels'],
    identifiers: { flagId: 'OFAC-SDN-CAND-2024-0091' },
    aliases: ['OFAC SDN Match', 'Sorokin Sanctions Flag'],
    domainData: {
      threat: {
        ofacMatchConfidence: 87,
        sanctionsPrograms: ['Iran', 'Russia', 'Global Terrorism'],
        indicators: ['Name match', 'Route pattern match', 'Ownership pattern match'],
      },
    },
    createdAt: '2026-03-18',
    updatedAt: '2026-04-08',
  },
  {
    id: 'trade-finance-dispute',
    label: 'Trade Finance Dispute',
    type: 'matter',
    subtitle: 'PRISM matter #PR-2024-0892',
    risk: 'medium',
    riskScore: 62,
    domains: ['legal'],
    identifiers: { matterId: 'PR-2024-0892' },
    aliases: ['PR-2024-0892', 'Trade Finance Arbitration', 'Sorokin Trade Dispute'],
    domainData: {
      legal: {
        matterIds: ['PR-2024-0892'],
        matterStatus: 'Arbitration — panel selection due Apr 22',
        aggregateExposure: 8400000,
        activeArbitrations: 1,
        settlementForecast: 0,
      },
    },
    createdAt: '2024-02-14',
    updatedAt: '2026-04-01',
  },
  {
    id: 'northport-properties',
    label: 'Northport Properties LLC',
    type: 'organization',
    subtitle: 'RE holding entity · Newark, NJ',
    risk: 'high',
    riskScore: 71,
    domains: ['property', 'financial'],
    identifiers: { einEstimate: 'XX-XXXXXXX', njReg: 'NJ-LLC-2018-9841' },
    aliases: ['Northport Properties', 'Northport LLC', 'NPT LLC'],
    domainData: {
      property: { addresses: ['Newark NJ', 'Brooklyn NY'], totalAUM: 11300000, distressScore: 65 },
      financial: { activePositions: 2 },
    },
    createdAt: '2024-05-20',
    updatedAt: '2026-04-14',
  },
  {
    id: 'bayview-plaza',
    label: 'Bayview Plaza',
    type: 'property',
    subtitle: 'Newark NJ · $4.2M · Cap 6.8%',
    risk: 'medium',
    riskScore: 48,
    domains: ['property'],
    identifiers: { parcelId: 'NJ-ESS-0012-BVP', address: '1244 Bayview Ave, Newark NJ' },
    aliases: ['Bayview Plaza Newark', '1244 Bayview', 'Bayview Apartments'],
    domainData: {
      property: {
        addresses: ['1244 Bayview Ave, Newark NJ 07104'],
        totalAUM: 4200000,
        distressScore: 48,
        capRate: 6.8,
        ltv: 62,
        dscr: 1.22,
        noi: 285600,
      },
    },
    createdAt: '2024-05-22',
    updatedAt: '2026-04-14',
  },
  {
    id: 'ironside-lofts',
    label: 'Ironside Lofts',
    type: 'property',
    subtitle: 'Brooklyn NY · $7.1M · Distress 82',
    risk: 'high',
    riskScore: 68,
    domains: ['property', 'financial'],
    identifiers: { parcelId: 'NY-KINGS-0448-IRL', address: '87 Ironside St, Brooklyn NY' },
    aliases: ['Ironside Lofts Brooklyn', '87 Ironside', 'Ironside Mixed-Use'],
    domainData: {
      property: {
        addresses: ['87 Ironside St, Brooklyn NY 11201'],
        totalAUM: 7100000,
        distressScore: 82,
        capRate: 5.1,
        ltv: 74,
        dscr: 1.08,
        noi: 361100,
      },
    },
    createdAt: '2024-02-28',
    updatedAt: '2026-04-14',
  },
  {
    id: 'marcus-chen',
    label: 'Marcus Chen',
    type: 'person',
    subtitle: 'Principal · Chen Capital Partners',
    risk: 'medium',
    riskScore: 72,
    domains: ['financial', 'legal', 'property', 'threat'],
    identifiers: {},
    aliases: ['Marc Chen', 'M. Chen', 'Marcus T. Chen'],
    domainData: {
      legal: { matterIds: ['PR-2024-1143'], aggregateExposure: 2100000, activeArbitrations: 1 },
      financial: { aum: 47000000, activePositions: 14 },
      property: { distressScore: 72 },
      threat: { ipOverlap: true, aptAssociations: ['APT-23'] },
    },
    createdAt: '2024-07-01',
    updatedAt: '2026-04-10',
  },
  {
    id: 'chen-capital',
    label: 'Chen Capital Partners',
    type: 'organization',
    subtitle: 'RE investment fund · New York, NY',
    risk: 'medium',
    riskScore: 66,
    domains: ['financial', 'property'],
    identifiers: { lei: 'CHEN-CAP-NYC-2017' },
    aliases: ['Chen Capital', 'CCP', 'Chen Capital Partners LLC'],
    domainData: {
      financial: { aum: 47000000, activePositions: 14 },
      property: { distressScore: 67, addresses: ['Brooklyn NY', 'Queens NY'] },
    },
    createdAt: '2024-07-02',
    updatedAt: '2026-04-14',
  },
  {
    id: 'apt23-indicator',
    label: 'APT-23 Indicator',
    type: 'threat',
    subtitle: 'Cyber threat actor association',
    risk: 'high',
    riskScore: 73,
    domains: ['threat', 'financial'],
    identifiers: { indicatorId: 'AEG-THREAT-2026-0410' },
    aliases: ['APT23', 'APT 23', 'APT-23 IP Overlap'],
    domainData: {
      threat: {
        aptAssociations: ['APT-23'],
        ipOverlap: true,
        indicators: [
          'IP range overlap with Chen Capital external infrastructure',
          '3 /24 subnets matched',
        ],
      },
    },
    createdAt: '2026-04-10',
    updatedAt: '2026-04-10',
  },
  {
    id: 'construction-fraud',
    label: 'Construction Fraud Matter',
    type: 'matter',
    subtitle: 'PRISM matter #PR-2024-1143',
    risk: 'high',
    riskScore: 74,
    domains: ['legal'],
    identifiers: { matterId: 'PR-2024-1143' },
    aliases: ['PR-2024-1143', 'Chen Construction Fraud', 'Construction Fraud #1143'],
    domainData: {
      legal: {
        matterIds: ['PR-2024-1143'],
        matterStatus: 'Escalated to arbitration Apr 1',
        aggregateExposure: 2100000,
        activeArbitrations: 1,
      },
    },
    createdAt: '2024-08-15',
    updatedAt: '2026-04-10',
  },
  {
    id: 'trade-asset',
    label: 'Trade Finance Deal',
    type: 'asset',
    subtitle: '$12M · Structured credit facility',
    risk: 'medium',
    riskScore: 55,
    domains: ['financial'],
    identifiers: { facilityRef: 'TF-2023-SML-001' },
    aliases: ['Sorokin Trade Finance', '$12M Credit Facility', 'TF-2023-SML-001'],
    domainData: {
      financial: { facilitySize: 12000000, facilityStatus: 'Under litigation', activePositions: 1 },
    },
    createdAt: '2023-11-01',
    updatedAt: '2026-04-01',
  },
];

export const NEXUS_EDGES: EdgeRecord[] = [
  {
    id: 'e001',
    sourceId: 'viktor-sorokin',
    targetId: 'sorokin-maritime',
    relationship: 'controls',
    confidence: 98,
    strength: 0.95,
    inferred: false,
    evidenceSources: ['BVI registry', 'vessel registration'],
    discoveredAt: '2024-01-15',
  },
  {
    id: 'e002',
    sourceId: 'sorokin-maritime',
    targetId: 'mv-arctic-eagle',
    relationship: 'operates',
    confidence: 95,
    strength: 0.9,
    inferred: false,
    evidenceSources: ['AIS operator record', "Lloyd's register"],
    discoveredAt: '2024-03-10',
  },
  {
    id: 'e003',
    sourceId: 'sorokin-maritime',
    targetId: 'shell-delta',
    relationship: 'subsidiary',
    confidence: 82,
    strength: 0.75,
    inferred: false,
    evidenceSources: ['BVI incorporation docs', 'beneficial ownership filing'],
    discoveredAt: '2024-06-01',
  },
  {
    id: 'e004',
    sourceId: 'mv-arctic-eagle',
    targetId: 'ofac-flag-sorokin',
    relationship: 'flagged_by',
    confidence: 87,
    strength: 0.95,
    inferred: false,
    evidenceSources: ['OFAC SDN screening', 'Helmsman route correlation'],
    discoveredAt: '2026-03-18',
  },
  {
    id: 'e005',
    sourceId: 'viktor-sorokin',
    targetId: 'trade-finance-dispute',
    relationship: 'litigates',
    confidence: 91,
    strength: 0.85,
    inferred: false,
    evidenceSources: ['PRISM case file', 'court filing'],
    discoveredAt: '2024-02-14',
  },
  {
    id: 'e006',
    sourceId: 'viktor-sorokin',
    targetId: 'northport-properties',
    relationship: 'owns',
    confidence: 89,
    strength: 0.85,
    inferred: false,
    evidenceSources: ['NJ LLC registry', 'title records'],
    discoveredAt: '2024-05-20',
  },
  {
    id: 'e007',
    sourceId: 'northport-properties',
    targetId: 'bayview-plaza',
    relationship: 'holds',
    confidence: 95,
    strength: 0.95,
    inferred: false,
    evidenceSources: ['Essex County title records'],
    discoveredAt: '2024-05-22',
  },
  {
    id: 'e008',
    sourceId: 'northport-properties',
    targetId: 'ironside-lofts',
    relationship: 'holds',
    confidence: 95,
    strength: 0.9,
    inferred: false,
    evidenceSources: ['Kings County title records'],
    discoveredAt: '2024-02-28',
  },
  {
    id: 'e009',
    sourceId: 'sorokin-maritime',
    targetId: 'trade-asset',
    relationship: 'invests',
    confidence: 76,
    strength: 0.7,
    inferred: false,
    evidenceSources: ['Trade finance agreement TF-2023-SML-001'],
    discoveredAt: '2023-11-01',
  },
  {
    id: 'e010',
    sourceId: 'shell-delta',
    targetId: 'trade-asset',
    relationship: 'finances',
    confidence: 71,
    strength: 0.65,
    inferred: true,
    evidenceSources: ['Wire transfer pattern', 'PRAXIS correlation'],
    discoveredAt: '2024-06-15',
  },
  {
    id: 'e011',
    sourceId: 'marcus-chen',
    targetId: 'chen-capital',
    relationship: 'controls',
    confidence: 99,
    strength: 0.99,
    inferred: false,
    evidenceSources: ['Delaware LLC filing', 'SEC Form D'],
    discoveredAt: '2024-07-01',
  },
  {
    id: 'e012',
    sourceId: 'chen-capital',
    targetId: 'ironside-lofts',
    relationship: 'co_invests',
    confidence: 63,
    strength: 0.5,
    inferred: false,
    evidenceSources: ['Kings County title records — 40% interest'],
    discoveredAt: '2024-02-28',
  },
  {
    id: 'e013',
    sourceId: 'chen-capital',
    targetId: 'apt23-indicator',
    relationship: 'associated_with',
    confidence: 68,
    strength: 0.68,
    inferred: true,
    evidenceSources: ['Aegis IP correlation', 'ASN routing overlap'],
    discoveredAt: '2026-04-10',
  },
  {
    id: 'e014',
    sourceId: 'marcus-chen',
    targetId: 'construction-fraud',
    relationship: 'litigates',
    confidence: 94,
    strength: 0.9,
    inferred: false,
    evidenceSources: ['PRISM case file PR-2024-1143', 'arbitration filing'],
    discoveredAt: '2024-08-15',
  },
  {
    id: 'e015',
    sourceId: 'marcus-chen',
    targetId: 'ironside-lofts',
    relationship: 'invests',
    confidence: 77,
    strength: 0.65,
    inferred: true,
    evidenceSources: ['Inferred via Chen Capital controlling interest'],
    discoveredAt: '2024-02-28',
  },
  {
    id: 'e016',
    sourceId: 'viktor-sorokin',
    targetId: 'marcus-chen',
    relationship: 'associated_with',
    confidence: 55,
    strength: 0.4,
    inferred: true,
    evidenceSources: ['PRAXIS co-investment discovery at Ironside Lofts'],
    discoveredAt: '2026-02-28',
  },
];

export const KNOWLEDGE_GRAPH: KnowledgeGraph = {
  entities: NEXUS_ENTITIES,
  edges: NEXUS_EDGES,
  version: '2026-0414-r22',
  lastRefreshed: '2026-04-14T22:15:00Z',
};

/** Get all edges connected to an entity (in either direction). */
export function getConnectedEdges(
  entityId: string,
  graph: KnowledgeGraph = KNOWLEDGE_GRAPH,
): EdgeRecord[] {
  return graph.edges.filter((e) => e.sourceId === entityId || e.targetId === entityId);
}

/** Get all direct neighbor entity IDs for a given entity. */
export function getNeighborIds(
  entityId: string,
  graph: KnowledgeGraph = KNOWLEDGE_GRAPH,
): string[] {
  return getConnectedEdges(entityId, graph).map((e) =>
    e.sourceId === entityId ? e.targetId : e.sourceId,
  );
}

/** BFS traversal from a starting entity up to maxDepth hops. Returns visited entity IDs. */
export function traverseGraph(
  startEntityId: string,
  maxDepth: number = 2,
  graph: KnowledgeGraph = KNOWLEDGE_GRAPH,
): Set<string> {
  const visited = new Set<string>([startEntityId]);
  const queue: Array<{ id: string; depth: number }> = [{ id: startEntityId, depth: 0 }];

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (depth >= maxDepth) continue;
    for (const neighborId of getNeighborIds(id, graph)) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push({ id: neighborId, depth: depth + 1 });
      }
    }
  }
  return visited;
}

/** Get entity by ID. */
export function getEntity(
  id: string,
  graph: KnowledgeGraph = KNOWLEDGE_GRAPH,
): EntityRecord | undefined {
  return graph.entities.find((e) => e.id === id);
}

/** Get entities by type. */
export function getEntitiesByType(
  type: EntityType,
  graph: KnowledgeGraph = KNOWLEDGE_GRAPH,
): EntityRecord[] {
  return graph.entities.filter((e) => e.type === type);
}

/** Get entities by domain. */
export function getEntitiesByDomain(
  domain: Domain,
  graph: KnowledgeGraph = KNOWLEDGE_GRAPH,
): EntityRecord[] {
  return graph.entities.filter((e) => e.domains.includes(domain));
}

// ─── Cross-Domain Entity Resolution ──────────────────────────────────────────
//
// Uses the existing `aliases` array and `identifiers` map on each EntityRecord
// to deduplicate entities that appear under different names or IDs across
// multiple domains (e.g. a vessel owner who is also a real estate investor).

export interface EntityResolutionMatch {
  entity: EntityRecord;
  matchType: 'exact-id' | 'alias-name' | 'identifier-value';
  matchedOn: string;
  confidence: number; // 0–100
}

/**
 * Resolve a free-text query or identifier string to matching entities.
 *
 * Searches in order:
 *   1. Exact entity ID match (confidence 100)
 *   2. Identifier value match across all identifier types (confidence 95)
 *   3. Canonical label exact match (confidence 90)
 *   4. Alias exact match (confidence 85)
 *   5. Partial alias / label match (confidence proportional to overlap, min 40)
 *
 * Returns results ranked by confidence descending.
 */
export function resolveEntityByQuery(
  query: string,
  graph: KnowledgeGraph = KNOWLEDGE_GRAPH,
): EntityResolutionMatch[] {
  const q = query.trim();
  if (!q) return [];

  const lower = q.toLowerCase();
  const results: EntityResolutionMatch[] = [];

  for (const entity of graph.entities) {
    // 1. Exact entity ID
    if (entity.id === q) {
      results.push({ entity, matchType: 'exact-id', matchedOn: entity.id, confidence: 100 });
      continue;
    }

    // 2. Identifier value match (IMO, LEI, MMSI, bahamasReg, etc.)
    let identifierHit = false;
    for (const [idKey, idVal] of Object.entries(entity.identifiers)) {
      if (idVal.toLowerCase() === lower) {
        results.push({
          entity,
          matchType: 'identifier-value',
          matchedOn: `${idKey}:${idVal}`,
          confidence: 95,
        });
        identifierHit = true;
        break;
      }
    }
    if (identifierHit) continue;

    // 3. Canonical label exact match
    if (entity.label.toLowerCase() === lower) {
      results.push({ entity, matchType: 'alias-name', matchedOn: entity.label, confidence: 90 });
      continue;
    }

    // 4. Alias exact match
    const exactAlias = entity.aliases.find((a) => a.toLowerCase() === lower);
    if (exactAlias) {
      results.push({ entity, matchType: 'alias-name', matchedOn: exactAlias, confidence: 85 });
      continue;
    }

    // 5. Partial label / alias match
    const candidates = [entity.label, ...entity.aliases];
    let bestPartial = 0;
    let bestMatchedOn = '';
    for (const candidate of candidates) {
      const candLower = candidate.toLowerCase();
      if (candLower.includes(lower) || lower.includes(candLower)) {
        const overlap = Math.min(lower.length, candLower.length) / Math.max(lower.length, candLower.length);
        const score = Math.round(40 + overlap * 40);
        if (score > bestPartial) {
          bestPartial = score;
          bestMatchedOn = candidate;
        }
      }
    }
    if (bestPartial >= 40) {
      results.push({
        entity,
        matchType: 'alias-name',
        matchedOn: bestMatchedOn,
        confidence: bestPartial,
      });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

export interface DuplicateCluster {
  canonicalId: string; // highest-confidence / highest-risk entity in the cluster
  members: EntityRecord[];
  sharedIdentifiers: Record<string, string[]>; // identifierKey → [values]
  sharedAliases: string[];
  crossDomains: Domain[];
  resolutionConfidence: number;
}

/**
 * Find entities that likely represent the same real-world entity across domains.
 *
 * Detection heuristics (in order of weight):
 *   - Shared identifier values (e.g. same LEI, same IMO number) → strong signal
 *   - Alias overlap (≥1 alias in common after normalisation) → medium signal
 *   - Name similarity above threshold → weak signal
 *
 * Returns clusters of ≥2 entities that are probable duplicates.
 */
export function findCrossdomainDuplicates(
  graph: KnowledgeGraph = KNOWLEDGE_GRAPH,
  options: { minConfidence?: number } = {},
): DuplicateCluster[] {
  const { minConfidence = 70 } = options;
  const entities = graph.entities;
  const visited = new Set<string>();
  const clusters: DuplicateCluster[] = [];

  for (let i = 0; i < entities.length; i++) {
    const a = entities[i]!;
    if (visited.has(a.id)) continue;

    const cluster: EntityRecord[] = [a];

    for (let j = i + 1; j < entities.length; j++) {
      const b = entities[j]!;
      if (visited.has(b.id)) continue;

      let confidence = 0;
      const sharedIdentifierKeys: string[] = [];

      // Shared identifier value check
      for (const [keyA, valA] of Object.entries(a.identifiers)) {
        for (const [keyB, valB] of Object.entries(b.identifiers)) {
          if (valA.toLowerCase() === valB.toLowerCase() && valA.length > 2) {
            confidence += 40;
            sharedIdentifierKeys.push(`${keyA}=${valA}`);
          }
        }
      }

      // Alias overlap check
      const normA = [a.label, ...a.aliases].map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const normB = [b.label, ...b.aliases].map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const aliasOverlap = normA.filter((s) => normB.includes(s) && s.length > 3);
      if (aliasOverlap.length > 0) {
        confidence += 30 * Math.min(aliasOverlap.length, 2);
      }

      // Name similarity (token overlap)
      const tokA = a.label.toLowerCase().split(/\s+/);
      const tokB = b.label.toLowerCase().split(/\s+/);
      const tokenOverlap = tokA.filter((t) => t.length > 3 && tokB.includes(t));
      if (tokenOverlap.length >= 2) {
        confidence += 20;
      }

      if (confidence >= minConfidence) {
        cluster.push(b);
      }
    }

    if (cluster.length >= 2) {
      // Mark all cluster members as visited so they don't start new clusters
      for (const member of cluster) visited.add(member.id);

      // Determine canonical entity: highest riskScore, or first if tied
      const canonical = cluster.reduce((best, e) => (e.riskScore > best.riskScore ? e : best));

      // Collect shared identifiers and aliases
      const allIdentifiers: Record<string, Set<string>> = {};
      const allAliases = new Set<string>();
      const allDomains = new Set<Domain>();

      for (const member of cluster) {
        for (const [k, v] of Object.entries(member.identifiers)) {
          if (!allIdentifiers[k]) allIdentifiers[k] = new Set();
          allIdentifiers[k].add(v);
        }
        for (const alias of member.aliases) allAliases.add(alias);
        for (const domain of member.domains) allDomains.add(domain);
      }

      const sharedIdentifiers: Record<string, string[]> = {};
      for (const [k, vs] of Object.entries(allIdentifiers)) {
        if (vs.size > 0) sharedIdentifiers[k] = [...vs];
      }

      // Confidence = average pairwise similarity capped at 100
      const resolutionConfidence = Math.min(100, Math.round(
        cluster.slice(1).reduce((sum) => sum + minConfidence, 0) / Math.max(cluster.length - 1, 1),
      ));

      clusters.push({
        canonicalId: canonical.id,
        members: cluster,
        sharedIdentifiers,
        sharedAliases: [...allAliases],
        crossDomains: [...allDomains],
        resolutionConfidence,
      });
    }
  }

  return clusters;
}

/**
 * Resolve a specific entity across all domains by any known identifier or alias.
 * Returns the entity and all related entities it might be duplicated with.
 */
export function resolveEntityCrossdom(
  entityIdOrQuery: string,
  graph: KnowledgeGraph = KNOWLEDGE_GRAPH,
): {
  primary: EntityRecord | null;
  relatedEntities: EntityRecord[];
  sharedIdentifiers: Record<string, string>;
  confidence: number;
} {
  const matches = resolveEntityByQuery(entityIdOrQuery, graph);
  if (matches.length === 0) return { primary: null, relatedEntities: [], sharedIdentifiers: {}, confidence: 0 };

  const primary = matches[0]!.entity;
  const confidence = matches[0]!.confidence;

  // Find other entities that share identifiers or aliases with the primary
  const relatedEntities: EntityRecord[] = [];
  const sharedIdentifiers: Record<string, string> = { ...primary.identifiers };

  for (const entity of graph.entities) {
    if (entity.id === primary.id) continue;

    let isRelated = false;

    // Share any identifier value
    for (const [, val] of Object.entries(primary.identifiers)) {
      for (const [, eVal] of Object.entries(entity.identifiers)) {
        if (val.toLowerCase() === eVal.toLowerCase() && val.length > 2) {
          isRelated = true;
        }
      }
    }

    // Share any alias
    if (!isRelated) {
      const primaryNorm = [primary.label, ...primary.aliases].map((s) => s.toLowerCase());
      const entityNorm = [entity.label, ...entity.aliases].map((s) => s.toLowerCase());
      if (primaryNorm.some((a) => entityNorm.includes(a))) {
        isRelated = true;
      }
    }

    if (isRelated) {
      relatedEntities.push(entity);
      Object.assign(sharedIdentifiers, entity.identifiers);
    }
  }

  return { primary, relatedEntities, sharedIdentifiers, confidence };
}
