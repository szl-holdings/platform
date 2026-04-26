export type EntityNodeType =
  | 'vessel'
  | 'beneficial_owner'
  | 'registered_owner'
  | 'ship_manager'
  | 'flag_state'
  | 'counterparty'
  | 'port_agent'
  | 'insurer'
  | 'charterer';

export type EdgeType =
  | 'owned_by'
  | 'managed_by'
  | 'flagged_under'
  | 'contracted_with'
  | 'insured_by'
  | 'crewed_by'
  | 'chartered_to'
  | 'agent_in';

export type SanctionList = 'OFAC_SDN' | 'EU_CONSOLIDATED' | 'UK_OFSI' | 'UN_SECURITY_COUNCIL';

export interface EntityNode {
  id: string;
  type: EntityNodeType;
  label: string;
  country: string;
  sanctioned: boolean;
  sanctionLists?: SanctionList[];
  riskTier: 'clear' | 'watch' | 'high' | 'critical';
  confidence: number;
  details?: string;
  imo?: string;
}

export interface RelationshipEdge {
  source: string;
  target: string;
  type: EdgeType;
  label: string;
  confidence: number;
  since?: string;
}

export interface SanctionsRule {
  id: string;
  ruleCode: string;
  description: string;
  list: SanctionList | 'INTERNAL';
  severity: 'critical' | 'high' | 'medium' | 'low';
  triggered: boolean;
  score: number;
  evidence?: string;
  entityId?: string;
  entityName?: string;
}

export interface SanctionsExposureScore {
  vesselId: string | number;
  score: number;
  tier: 'clear' | 'watch' | 'high' | 'critical';
  dataSource: 'live' | 'simulated';
  computedAt: string;
  rules: SanctionsRule[];
  networkNodes: EntityNode[];
  networkEdges: RelationshipEdge[];
  summary: string;
}

export interface PortfolioSanctionsHolding {
  vesselId: string | number;
  vesselName: string;
  imo: string;
  flag: string;
  vesselType: string;
  score: number;
  tier: 'clear' | 'watch' | 'high' | 'critical';
  dataSource: 'live' | 'simulated';
  topRules: SanctionsRule[];
  owner: string;
  hullValue: number;
  sanctionedNetworkNodes: number;
  lastUpdated: string;
}

const ALL_RULES: SanctionsRule[] = [
  {
    id: 'r01',
    ruleCode: 'OFAC-DFA-001',
    description: 'Registered owner appears on OFAC SDN list',
    list: 'OFAC_SDN',
    severity: 'critical',
    triggered: false,
    score: 40,
  },
  {
    id: 'r02',
    ruleCode: 'OFAC-DFA-002',
    description: 'Beneficial owner domiciled in sanctioned jurisdiction',
    list: 'OFAC_SDN',
    severity: 'high',
    triggered: false,
    score: 30,
  },
  {
    id: 'r03',
    ruleCode: 'EU-CONS-011',
    description: 'Ship manager entity flagged on EU Consolidated list',
    list: 'EU_CONSOLIDATED',
    severity: 'high',
    triggered: false,
    score: 25,
  },
  {
    id: 'r04',
    ruleCode: 'DARK-AIS-001',
    description: 'AIS transponder dark for >8 hours in sanctioned corridor',
    list: 'INTERNAL',
    severity: 'high',
    triggered: false,
    score: 20,
  },
  {
    id: 'r05',
    ruleCode: 'PORT-SAN-003',
    description: 'Prior call at sanctioned port within 12 months',
    list: 'INTERNAL',
    severity: 'medium',
    triggered: false,
    score: 15,
  },
  {
    id: 'r06',
    ruleCode: 'FLAG-FOC-007',
    description: 'Flag-of-convenience jurisdiction with elevated evasion risk',
    list: 'INTERNAL',
    severity: 'medium',
    triggered: false,
    score: 10,
  },
  {
    id: 'r07',
    ruleCode: 'UK-OFSI-014',
    description: 'Charterer linked to UK OFSI-designated entity',
    list: 'UK_OFSI',
    severity: 'high',
    triggered: false,
    score: 28,
  },
  {
    id: 'r08',
    ruleCode: 'INSURER-SAN-002',
    description: 'P&I Club cover withdrawn due to sanctions exposure',
    list: 'INTERNAL',
    severity: 'critical',
    triggered: false,
    score: 35,
  },
  {
    id: 'r09',
    ruleCode: 'STS-TRANS-001',
    description: 'Ship-to-ship transfer detected in sanctioned waters',
    list: 'INTERNAL',
    severity: 'high',
    triggered: false,
    score: 22,
  },
  {
    id: 'r10',
    ruleCode: 'CARGO-ORI-005',
    description: 'Cargo origin linked to sanctioned commodity corridor',
    list: 'INTERNAL',
    severity: 'medium',
    triggered: false,
    score: 12,
  },
];

function makeRules(triggeredIds: string[]): SanctionsRule[] {
  return ALL_RULES.map((r) => ({
    ...r,
    triggered: triggeredIds.includes(r.id),
  }));
}

export const VESSEL_SANCTIONS_SCORES: Record<string, SanctionsExposureScore> = {
  '1': {
    vesselId: 1,
    score: 78,
    tier: 'high',
    dataSource: 'simulated',
    computedAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    summary:
      'Registered owner Meridian Bulk Holdings Ltd has direct linkage to an OFAC SDN-listed entity via a 62%-owned subsidiary. Flag state (Comoros) is a recognised high-evasion jurisdiction. AIS dark event recorded in Persian Gulf corridor 11 days ago.',
    rules: makeRules(['r02', 'r04', 'r06']),
    networkNodes: [
      {
        id: 'v1',
        type: 'vessel',
        label: 'Pacific Guardian',
        country: 'KM',
        sanctioned: false,
        riskTier: 'high',
        confidence: 1,
        imo: '9234567',
      },
      {
        id: 'ro1',
        type: 'registered_owner',
        label: 'Meridian Bulk Holdings Ltd',
        country: 'CY',
        sanctioned: false,
        riskTier: 'high',
        confidence: 0.95,
        details: 'Cyprus-registered; 62% subsidiary linked to SDN list',
      },
      {
        id: 'bo1',
        type: 'beneficial_owner',
        label: 'Silk Road Maritime Group',
        country: 'IR',
        sanctioned: true,
        sanctionLists: ['OFAC_SDN'],
        riskTier: 'critical',
        confidence: 0.78,
        details: 'Iranian beneficial interest — OFAC SDN entry 2023-11-08',
      },
      {
        id: 'sm1',
        type: 'ship_manager',
        label: 'GlobalShip Management SA',
        country: 'GR',
        sanctioned: false,
        riskTier: 'clear',
        confidence: 0.99,
        details: 'Piraeus-based technical manager',
      },
      {
        id: 'fl1',
        type: 'flag_state',
        label: 'Comoros Flag Registry',
        country: 'KM',
        sanctioned: false,
        riskTier: 'watch',
        confidence: 1,
        details: 'Flag-of-convenience; elevated evasion risk per FATF',
      },
      {
        id: 'ch1',
        type: 'charterer',
        label: 'Eagle Commodities FZE',
        country: 'AE',
        sanctioned: false,
        riskTier: 'watch',
        confidence: 0.82,
        details: 'Dubai-registered; trade routes overlap with sanctioned cargoes',
      },
    ],
    networkEdges: [
      { source: 'v1', target: 'ro1', type: 'owned_by', label: 'Registered owner', confidence: 0.95 },
      { source: 'ro1', target: 'bo1', type: 'owned_by', label: 'Beneficial interest (62%)', confidence: 0.78, since: '2021-03' },
      { source: 'v1', target: 'sm1', type: 'managed_by', label: 'Technical manager', confidence: 0.99 },
      { source: 'v1', target: 'fl1', type: 'flagged_under', label: 'Flag state', confidence: 1 },
      { source: 'v1', target: 'ch1', type: 'chartered_to', label: 'Time charterer', confidence: 0.82 },
    ],
  },
  '2': {
    vesselId: 2,
    score: 22,
    tier: 'clear',
    dataSource: 'live',
    computedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    summary:
      'No direct sanctions matches detected. Owner and manager entities are EU-registered with clean compliance histories. Flag state (Marshall Islands) is low-risk. All counterparties clear.',
    rules: makeRules([]),
    networkNodes: [
      {
        id: 'v2',
        type: 'vessel',
        label: 'Liberty Wave',
        country: 'MH',
        sanctioned: false,
        riskTier: 'clear',
        confidence: 1,
        imo: '9456789',
      },
      {
        id: 'ro2',
        type: 'registered_owner',
        label: 'Atlantic Container Lines BV',
        country: 'NL',
        sanctioned: false,
        riskTier: 'clear',
        confidence: 0.99,
      },
      {
        id: 'bo2',
        type: 'beneficial_owner',
        label: 'Nordic Shipping Partners AS',
        country: 'NO',
        sanctioned: false,
        riskTier: 'clear',
        confidence: 0.97,
      },
      {
        id: 'sm2',
        type: 'ship_manager',
        label: 'Wilhelmsen Ship Management',
        country: 'NO',
        sanctioned: false,
        riskTier: 'clear',
        confidence: 1,
      },
      {
        id: 'fl2',
        type: 'flag_state',
        label: 'Marshall Islands Registry',
        country: 'MH',
        sanctioned: false,
        riskTier: 'clear',
        confidence: 1,
      },
    ],
    networkEdges: [
      { source: 'v2', target: 'ro2', type: 'owned_by', label: 'Registered owner', confidence: 0.99 },
      { source: 'ro2', target: 'bo2', type: 'owned_by', label: 'Beneficial owner', confidence: 0.97 },
      { source: 'v2', target: 'sm2', type: 'managed_by', label: 'Ship manager', confidence: 1 },
      { source: 'v2', target: 'fl2', type: 'flagged_under', label: 'Flag state', confidence: 1 },
    ],
  },
  '3': {
    vesselId: 3,
    score: 91,
    tier: 'critical',
    dataSource: 'simulated',
    computedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    summary:
      'CRITICAL: Ship manager directly named on EU Consolidated sanctions list (March 2025 update). Vessel conducted AIS-dark transit in Red Sea corridor and completed port call at Bandar Abbas 47 days ago. P&I Club has served notice of withdrawal of cover.',
    rules: makeRules(['r03', 'r04', 'r05', 'r08', 'r09']),
    networkNodes: [
      {
        id: 'v3',
        type: 'vessel',
        label: 'Meridian Bulk',
        country: 'KM',
        sanctioned: false,
        riskTier: 'critical',
        confidence: 1,
        imo: '9678901',
      },
      {
        id: 'ro3',
        type: 'registered_owner',
        label: 'Caspian Marine Holdings LLC',
        country: 'AZ',
        sanctioned: false,
        riskTier: 'high',
        confidence: 0.87,
      },
      {
        id: 'bo3',
        type: 'beneficial_owner',
        label: '[UNDISCLOSED]',
        country: 'Unknown',
        sanctioned: false,
        riskTier: 'high',
        confidence: 0.41,
        details: 'UBO not determined despite six-hop ownership chain',
      },
      {
        id: 'sm3',
        type: 'ship_manager',
        label: 'Bosphorus Maritime Services',
        country: 'TR',
        sanctioned: true,
        sanctionLists: ['EU_CONSOLIDATED'],
        riskTier: 'critical',
        confidence: 0.94,
        details: 'EU Consolidated designation March 2025 — Russia-linked services',
      },
      {
        id: 'fl3',
        type: 'flag_state',
        label: 'Comoros Flag Registry',
        country: 'KM',
        sanctioned: false,
        riskTier: 'watch',
        confidence: 1,
      },
      {
        id: 'cp3',
        type: 'counterparty',
        label: 'Black Sea Petroleum Traders',
        country: 'RU',
        sanctioned: true,
        sanctionLists: ['OFAC_SDN', 'EU_CONSOLIDATED', 'UK_OFSI'],
        riskTier: 'critical',
        confidence: 0.89,
        details: 'Russian crude counterparty; triple-listed',
      },
      {
        id: 'ins3',
        type: 'insurer',
        label: 'Britannia P&I Club',
        country: 'GB',
        sanctioned: false,
        riskTier: 'clear',
        confidence: 1,
        details: 'Cover withdrawal notice issued 2026-04-01',
      },
    ],
    networkEdges: [
      { source: 'v3', target: 'ro3', type: 'owned_by', label: 'Registered owner', confidence: 0.87 },
      { source: 'ro3', target: 'bo3', type: 'owned_by', label: 'Beneficial owner (opaque)', confidence: 0.41 },
      { source: 'v3', target: 'sm3', type: 'managed_by', label: 'Ship manager', confidence: 0.94 },
      { source: 'v3', target: 'fl3', type: 'flagged_under', label: 'Flag state', confidence: 1 },
      { source: 'v3', target: 'cp3', type: 'contracted_with', label: 'Cargo counterparty', confidence: 0.89 },
      { source: 'v3', target: 'ins3', type: 'insured_by', label: 'P&I cover (withdrawn)', confidence: 1 },
    ],
  },
  '4': {
    vesselId: 4,
    score: 38,
    tier: 'watch',
    dataSource: 'live',
    computedAt: new Date(Date.now() - 1000 * 60 * 31).toISOString(),
    summary:
      'Charterer Eagle Gas Transport FZE operates from a jurisdiction with elevated sanctions evasion risk. Flag state (Bahamas) is compliant. No direct SDN or list matches. Elevated due to trade route overlap.',
    rules: makeRules(['r06', 'r10']),
    networkNodes: [
      {
        id: 'v4',
        type: 'vessel',
        label: 'Arctic Breeze',
        country: 'BS',
        sanctioned: false,
        riskTier: 'watch',
        confidence: 1,
        imo: '9890123',
      },
      {
        id: 'ro4',
        type: 'registered_owner',
        label: 'Fjord Shipping AS',
        country: 'NO',
        sanctioned: false,
        riskTier: 'clear',
        confidence: 0.99,
      },
      {
        id: 'sm4',
        type: 'ship_manager',
        label: 'Stena Ship Management',
        country: 'SE',
        sanctioned: false,
        riskTier: 'clear',
        confidence: 0.99,
      },
      {
        id: 'fl4',
        type: 'flag_state',
        label: 'Bahamas Maritime Authority',
        country: 'BS',
        sanctioned: false,
        riskTier: 'clear',
        confidence: 1,
      },
      {
        id: 'ch4',
        type: 'charterer',
        label: 'Eagle Gas Transport FZE',
        country: 'AE',
        sanctioned: false,
        riskTier: 'watch',
        confidence: 0.76,
        details: 'DMCC entity; trade routes include Hormuz corridor',
      },
    ],
    networkEdges: [
      { source: 'v4', target: 'ro4', type: 'owned_by', label: 'Registered owner', confidence: 0.99 },
      { source: 'v4', target: 'sm4', type: 'managed_by', label: 'Ship manager', confidence: 0.99 },
      { source: 'v4', target: 'fl4', type: 'flagged_under', label: 'Flag state', confidence: 1 },
      { source: 'v4', target: 'ch4', type: 'chartered_to', label: 'Time charterer', confidence: 0.76 },
    ],
  },
};

export const PORTFOLIO_SANCTIONS_HOLDINGS: PortfolioSanctionsHolding[] = [
  {
    vesselId: 3,
    vesselName: 'Meridian Bulk',
    imo: '9678901',
    flag: 'KM',
    vesselType: 'Capesize Bulker',
    score: 91,
    tier: 'critical',
    dataSource: 'simulated',
    topRules: makeRules(['r03', 'r05', 'r08']).filter((r) => r.triggered),
    owner: 'Caspian Marine Holdings LLC',
    hullValue: 48000000,
    sanctionedNetworkNodes: 2,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    vesselId: 1,
    vesselName: 'Pacific Guardian',
    imo: '9234567',
    flag: 'KM',
    vesselType: 'VLCC Tanker',
    score: 78,
    tier: 'high',
    dataSource: 'simulated',
    topRules: makeRules(['r02', 'r04']).filter((r) => r.triggered),
    owner: 'Meridian Bulk Holdings Ltd',
    hullValue: 85000000,
    sanctionedNetworkNodes: 1,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
  },
  {
    vesselId: 4,
    vesselName: 'Arctic Breeze',
    imo: '9890123',
    flag: 'BS',
    vesselType: 'LNG Carrier',
    score: 38,
    tier: 'watch',
    dataSource: 'live',
    topRules: makeRules(['r06', 'r10']).filter((r) => r.triggered),
    owner: 'Fjord Shipping AS',
    hullValue: 210000000,
    sanctionedNetworkNodes: 0,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 31).toISOString(),
  },
  {
    vesselId: 5,
    vesselName: 'Cape Resolute',
    imo: '9012345',
    flag: 'PA',
    vesselType: 'Panamax Bulk',
    score: 12,
    tier: 'clear',
    dataSource: 'live',
    topRules: [],
    owner: 'Atlantica Bulk Carriers SA',
    hullValue: 32000000,
    sanctionedNetworkNodes: 0,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 62).toISOString(),
  },
  {
    vesselId: 2,
    vesselName: 'Liberty Wave',
    imo: '9456789',
    flag: 'MH',
    vesselType: 'Container',
    score: 22,
    tier: 'clear',
    dataSource: 'live',
    topRules: [],
    owner: 'Atlantic Container Lines BV',
    hullValue: 125000000,
    sanctionedNetworkNodes: 0,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    vesselId: 6,
    vesselName: 'Horizon Star',
    imo: '9135791',
    flag: 'AE',
    vesselType: 'Chemical Tanker',
    score: 55,
    tier: 'watch',
    dataSource: 'simulated',
    topRules: makeRules(['r06', 'r05']).filter((r) => r.triggered),
    owner: 'Gulf Chemical Carriers FZE',
    hullValue: 28000000,
    sanctionedNetworkNodes: 0,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 19).toISOString(),
  },
];

export function getSanctionsScore(vesselId: string | number): SanctionsExposureScore | null {
  const key = String(vesselId);
  return VESSEL_SANCTIONS_SCORES[key] ?? null;
}

export const TIER_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  clear: {
    label: 'Clear',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    dot: '#22c55e',
  },
  watch: {
    label: 'Watch',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    dot: '#f59e0b',
  },
  high: {
    label: 'High Exposure',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    dot: '#f97316',
  },
  critical: {
    label: 'Critical',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    dot: '#ef4444',
  },
};

export const ENTITY_TYPE_CONFIG: Record<
  EntityNodeType,
  { label: string; color: string; abbr: string }
> = {
  vessel: { label: 'Vessel', color: '#0ea5e9', abbr: 'VSL' },
  beneficial_owner: { label: 'Beneficial Owner', color: '#a78bfa', abbr: 'UBO' },
  registered_owner: { label: 'Registered Owner', color: '#818cf8', abbr: 'REG' },
  ship_manager: { label: 'Ship Manager', color: '#34d399', abbr: 'MGR' },
  flag_state: { label: 'Flag State', color: '#94a3b8', abbr: 'FLAG' },
  counterparty: { label: 'Counterparty', color: '#fb923c', abbr: 'CPY' },
  port_agent: { label: 'Port Agent', color: '#64748b', abbr: 'AGT' },
  insurer: { label: 'Insurer / P&I', color: '#06b6d4', abbr: 'INS' },
  charterer: { label: 'Charterer', color: '#f59e0b', abbr: 'CHT' },
};
