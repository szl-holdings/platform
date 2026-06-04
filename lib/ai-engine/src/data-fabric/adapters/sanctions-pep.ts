import type {
  AdapterHealthStatus,
  DataFabricAdapter,
  Domain,
  NormalizedEntity,
  OntologyMapping,
  RefreshSchedule,
} from '../adapter-registry.js';

const SANCTIONS_ONTOLOGY_MAPPINGS: OntologyMapping[] = [
  {
    entityType: 'vessel',
    domain: 'vessels',
    fieldMap: {
      imoNumber: 'imo',
      sanctionsStatus: 'status',
    },
  },
  {
    entityType: 'matter',
    domain: 'counsel',
    fieldMap: {
      matterType: 'regulatory',
      status: 'complianceStatus',
    },
  },
];

const REFRESH_SCHEDULE: RefreshSchedule = {
  intervalMs: 4 * 60 * 60 * 1000,
  retryBackoffMs: 60_000,
  maxRetries: 3,
};

interface SanctionsHit {
  id: string;
  entityName: string;
  entityType: 'vessel' | 'company' | 'individual' | 'port';
  matchScore: number;
  sanctionsList: string;
  listingDate: string;
  sanctionProgram: string;
  jurisdiction: string;
  reason: string;
  aliases: string[];
  identifiers: Record<string, string>;
  associatedEntities: string[];
  status: 'active' | 'delisted' | 'pending_review';
}

interface PepScreeningResult {
  id: string;
  personName: string;
  country: string;
  position: string;
  pepLevel: 'head_of_state' | 'senior_official' | 'family_member' | 'close_associate';
  riskScore: number;
  associatedCompanies: string[];
  sourceList: string;
  lastUpdated: string;
  relatedSanctions: string[];
}

const SEED_SANCTIONS_HITS: SanctionsHit[] = [
  { id: 'SNC-001', entityName: 'MT Suez Glory', entityType: 'vessel', matchScore: 98, sanctionsList: 'OFAC-SDN', listingDate: '2025-11-15', sanctionProgram: 'Iran Sanctions', jurisdiction: 'US', reason: 'Involvement in Iranian oil shipments', aliases: ['Suez Victory', 'Golden Star'], identifiers: { imo: '9456789', mmsi: '636098765' }, associatedEntities: ['Petroline Shipping Ltd', 'Gulf Maritime Intl'], status: 'active' },
  { id: 'SNC-002', entityName: 'Petroline Shipping Ltd', entityType: 'company', matchScore: 95, sanctionsList: 'EU-Consolidated', listingDate: '2025-09-01', sanctionProgram: 'Russia Energy Sanctions', jurisdiction: 'EU', reason: 'Russian-origin crude oil transport network', aliases: ['Petroline Maritime', 'PL Shipping'], identifiers: { lei: 'PLSHIP2025EU001' }, associatedEntities: ['MT Volga Trader', 'MT Arctic Wave', 'OOO Nefteprodukt'], status: 'active' },
  { id: 'SNC-003', entityName: 'MT Volga Trader', entityType: 'vessel', matchScore: 92, sanctionsList: 'UK-OFSI', listingDate: '2026-01-20', sanctionProgram: 'Russia Maritime Services', jurisdiction: 'UK', reason: 'Transport of Russian-origin oil above price cap', aliases: ['Volga Spirit'], identifiers: { imo: '9567890', mmsi: '273456789' }, associatedEntities: ['Petroline Shipping Ltd'], status: 'active' },
  { id: 'SNC-004', entityName: 'Port of Tartus', entityType: 'port', matchScore: 88, sanctionsList: 'OFAC-SDN', listingDate: '2024-06-15', sanctionProgram: 'Syria Sanctions', jurisdiction: 'US', reason: 'Controlled by designated Syrian military entities', aliases: ['Tartous Port', 'Tartus Naval Facility'], identifiers: { unlocode: 'SYTAR' }, associatedEntities: ['Syrian Navy', 'Syrian Arab Shipping'], status: 'active' },
  { id: 'SNC-005', entityName: 'Omega Maritime Holdings', entityType: 'company', matchScore: 78, sanctionsList: 'UN-1718-Committee', listingDate: '2025-03-10', sanctionProgram: 'DPRK Sanctions', jurisdiction: 'UN', reason: 'Ship-to-ship transfer network supporting DPRK coal exports', aliases: ['Omega Ship Management'], identifiers: { lei: 'OMH2025UN001' }, associatedEntities: ['MV Pacific Star', 'MV East Wind'], status: 'active' },
  { id: 'SNC-006', entityName: 'Dmitri Volkov', entityType: 'individual', matchScore: 96, sanctionsList: 'OFAC-SDN', listingDate: '2025-08-22', sanctionProgram: 'Russia-Related Sanctions', jurisdiction: 'US', reason: 'Beneficial owner of sanctioned maritime fleet', aliases: ['D. Volkov', 'Dmitry Volkov'], identifiers: { passport: 'RU-VLK-2025' }, associatedEntities: ['Petroline Shipping Ltd', 'Black Sea Navigation Co'], status: 'active' },
];

const SEED_PEP_RESULTS: PepScreeningResult[] = [
  { id: 'PEP-001', personName: 'Ahmad Al-Rashid', country: 'UAE', position: 'Director General, Federal Maritime Authority', pepLevel: 'senior_official', riskScore: 72, associatedCompanies: ['Emirates Maritime Group', 'Gulf Ports Authority'], sourceList: 'Dow Jones PEP', lastUpdated: '2026-04-01', relatedSanctions: [] },
  { id: 'PEP-002', personName: 'Chen Wei', country: 'China', position: 'Deputy Minister, Ministry of Transport', pepLevel: 'senior_official', riskScore: 68, associatedCompanies: ['COSCO Shipping Holdings', 'China Merchants Port'], sourceList: 'World-Check', lastUpdated: '2026-03-15', relatedSanctions: [] },
  { id: 'PEP-003', personName: 'Viktor Petrov', country: 'Russia', position: 'Former Deputy Energy Minister (2019-2023)', pepLevel: 'senior_official', riskScore: 91, associatedCompanies: ['Gazprom Neft Marine', 'Sovcomflot'], sourceList: 'Dow Jones PEP', lastUpdated: '2026-04-10', relatedSanctions: ['OFAC-SDN:RU-2024-0045'] },
  { id: 'PEP-004', personName: 'Maria Volkov', country: 'Cyprus', position: 'Family member of Dmitri Volkov', pepLevel: 'family_member', riskScore: 85, associatedCompanies: ['Volkov Shipping Cyprus Ltd'], sourceList: 'World-Check', lastUpdated: '2026-03-28', relatedSanctions: ['EU-Consolidated:RU-2025-0012'] },
];

export const sanctionsPepAdapter: DataFabricAdapter = {
  id: 'sanctions-pep',
  displayName: 'Sanctions & PEP Screening Feeds',
  domain: 'vessels',
  category: 'compliance',
  costPerQueryUsd: 0.25,
  ontologyMappings: SANCTIONS_ONTOLOGY_MAPPINGS,
  refreshSchedule: REFRESH_SCHEDULE,

  isConfigured(): boolean {
    return true;
  },

  async fetch(params?: Record<string, unknown>): Promise<NormalizedEntity[]> {
    const entityName = params?.entityName as string | undefined;
    const entityType = params?.entityType as string | undefined;
    const now = new Date().toISOString();
    const entities: NormalizedEntity[] = [];

    let hits = SEED_SANCTIONS_HITS;
    if (entityName) hits = hits.filter((h) => h.entityName.toLowerCase().includes(entityName.toLowerCase()) || h.aliases.some((a) => a.toLowerCase().includes(entityName.toLowerCase())));
    if (entityType) hits = hits.filter((h) => h.entityType === entityType);

    for (const hit of hits) {
      const domain = hit.entityType === 'vessel' ? 'vessels' as const : 'counsel' as const;
      entities.push({
        id: `sanctions-${hit.id}`,
        entityType: hit.entityType === 'vessel' ? 'vessel' : 'matter',
        domain,
        label: `${hit.sanctionsList}: ${hit.entityName} (${hit.matchScore}% match)`,
        confidence: hit.matchScore / 100,
        freshness: 'recent',
        sourceRef: `sanctions-pep:${hit.id}`,
        provenance: {
          sourceId: hit.id,
          adapterId: 'sanctions-pep',
          confidence: hit.matchScore / 100,
          freshness: 'recent',
          fetchedAt: now,
          costUsd: 0.05,
          rawRecordCount: 1,
        },
        data: { ...hit, dataType: 'sanctions_hit' },
        createdAt: hit.listingDate,
        updatedAt: now,
      });
    }

    const pepScreenName = params?.pepScreenName as string | undefined;
    let pepResults = SEED_PEP_RESULTS;
    if (pepScreenName) pepResults = pepResults.filter((p) => p.personName.toLowerCase().includes(pepScreenName.toLowerCase()));

    for (const pep of pepResults) {
      entities.push({
        id: `pep-${pep.id}`,
        entityType: 'matter',
        domain: 'counsel',
        label: `PEP: ${pep.personName} — ${pep.position} (Risk: ${pep.riskScore}/100)`,
        confidence: pep.riskScore / 100,
        freshness: 'recent',
        sourceRef: `sanctions-pep:pep:${pep.id}`,
        provenance: {
          sourceId: pep.id,
          adapterId: 'sanctions-pep',
          confidence: pep.riskScore / 100,
          freshness: 'recent',
          fetchedAt: now,
          costUsd: 0.03,
          rawRecordCount: 1,
        },
        data: { ...pep, dataType: 'pep_screening' },
        createdAt: pep.lastUpdated,
        updatedAt: now,
      });
    }

    return entities;
  },

  async healthCheck(): Promise<AdapterHealthStatus> {
    return {
      adapterId: 'sanctions-pep',
      status: 'healthy',
      lastSuccessAt: new Date().toISOString(),
      lastErrorAt: null,
      lastError: null,
      totalQueries: 0,
      totalErrors: 0,
      avgLatencyMs: 80,
    };
  },
};

export type { SanctionsHit, PepScreeningResult };
export { SEED_SANCTIONS_HITS, SEED_PEP_RESULTS };
