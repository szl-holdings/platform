export type VesselStatus =
  | 'underway'
  | 'in_port'
  | 'anchored'
  | 'maintenance'
  | 'laid_up'
  | 'distress';

export type VoyageStatus =
  | 'planned'
  | 'active'
  | 'deviating'
  | 'completed'
  | 'cancelled'
  | 'exception';

export type RouteRiskLevel = 'low' | 'moderate' | 'elevated' | 'critical';

export type ComplianceStatus =
  | 'compliant'
  | 'minor_deficiency'
  | 'major_deficiency'
  | 'non_compliant';

export interface VesselTwin {
  id: string;
  imo: string;
  name: string;
  flag: string;
  vesselType: string;
  grossTonnage: number;
  deadweightTonnage: number;
  yearBuilt: number;
  classification: string;
  currentStatus: VesselStatus;
  currentPort?: string;
  currentLat?: number;
  currentLon?: number;
  lastPortOfCall?: string;
  nextPortOfCall?: string;
  eta?: string;
  speed?: number;
  heading?: number;
  crewCount: number;
  readinessScore: number;
  maintenanceDue: boolean;
  certExpiries: Array<{
    cert: string;
    expiresAt: string;
    status: 'valid' | 'expiring_soon' | 'expired';
  }>;
  complianceStatus: ComplianceStatus;
  flagStateInspectionDue?: string;
  lastPscInspectionAt?: string;
  pscDeficiencies: number;
  anomalyFlags: string[];
  externalDataConnectors: Array<{
    name: string;
    type: 'ais' | 'weather' | 'port_state' | 'sanctions' | 'cargo_manifest';
    status: 'not_connected' | 'connected' | 'error';
    lastSyncAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface VoyageTwin {
  id: string;
  vesselId: string;
  vesselName: string;
  voyageNumber: string;
  status: VoyageStatus;
  originPort: string;
  destinationPort: string;
  departureDate: string;
  estimatedArrival: string;
  actualArrival?: string;
  cargo: string;
  cargoValueUsd?: number;
  charterParty: string;
  freightRate?: number;
  routeRisk: RouteRiskLevel;
  routeRiskFactors: string[];
  weatherRisk: 'low' | 'moderate' | 'high' | 'severe';
  sanctionsExposure: boolean;
  portCongestionRisk: 'low' | 'moderate' | 'high';
  economics: {
    voyageRevenue: number;
    voyageCosts: number;
    tcEquivalent: number;
    bunkerCost: number;
    portDisbursements: number;
    profitMarginPct: number;
  };
  deviations: Array<{
    detectedAt: string;
    type: string;
    description: string;
    resolved: boolean;
  }>;
  approvals: VoyageApproval[];
  auditTrail: VoyageAuditEntry[];
  externalDataConnectors: Array<{
    name: string;
    type: 'weather_api' | 'port_authority' | 'cargo_tracker' | 'fuel_price';
    status: 'not_connected' | 'connected' | 'error';
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface VoyageApproval {
  id: string;
  voyageId: string;
  voyageNumber: string;
  vesselName: string;
  actionClass:
    | 'route_deviation'
    | 'port_clearance'
    | 'cargo_override'
    | 'exception_escalation'
    | 'export_packet';
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'withdrawn';
  priority: 'low' | 'medium' | 'high' | 'critical';
  requestedBy: string;
  requestedAt: string;
  approver?: string;
  approvedAt?: string;
  comments: Array<{ author: string; body: string; at: string }>;
}

export interface VoyageAuditEntry {
  id: string;
  voyageId: string;
  action: string;
  actor: string;
  actorRole: string;
  at: string;
  details?: Record<string, unknown>;
}

export interface FleetWhatChangedEvent {
  id: string;
  vesselId?: string;
  voyageId?: string;
  entityName: string;
  eventType:
    | 'route_deviation'
    | 'weather_alert'
    | 'port_delay'
    | 'sanctions_flag'
    | 'ais_gap'
    | 'cert_expiry'
    | 'approval_action'
    | 'exception_raised'
    | 'readiness_change'
    | 'voyage_status_change';
  summary: string;
  detail?: string;
  severity: 'info' | 'warning' | 'critical';
  source: string;
  occurredAt: string;
  actor?: string;
}

export interface FleetException {
  id: string;
  vesselId?: string;
  voyageId?: string;
  entityName: string;
  type:
    | 'ais_gap'
    | 'route_deviation'
    | 'sanctions_exposure'
    | 'psc_deficiency'
    | 'cert_expired'
    | 'port_detention'
    | 'weather_diversion'
    | 'cargo_discrepancy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  description: string;
  detectedAt: string;
  resolvedAt?: string;
  assignedTo?: string;
  notes?: string;
}

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
const hoursAgo = (n: number) => new Date(now.getTime() - n * 3600000).toISOString();

export const vesselTwins: VesselTwin[] = [
  {
    id: 'vessel-001',
    imo: 'IMO9876543',
    name: 'MV Avalon Spirit',
    flag: 'Marshall Islands',
    vesselType: 'Bulk Carrier',
    grossTonnage: 43200,
    deadweightTonnage: 76500,
    yearBuilt: 2018,
    classification: 'DNV GL',
    currentStatus: 'underway',
    currentPort: undefined,
    currentLat: 14.5,
    currentLon: 55.2,
    lastPortOfCall: 'Singapore',
    nextPortOfCall: 'Port of Rotterdam',
    eta: daysAgo(-8),
    speed: 12.4,
    heading: 312,
    crewCount: 21,
    readinessScore: 91,
    maintenanceDue: false,
    certExpiries: [
      { cert: 'SOLAS Safety Equipment', expiresAt: daysAgo(-90), status: 'valid' },
      { cert: 'ISM DOC', expiresAt: daysAgo(-30), status: 'expiring_soon' },
      { cert: 'MARPOL Annex VI EIAPP', expiresAt: daysAgo(-180), status: 'valid' },
    ],
    complianceStatus: 'compliant',
    lastPscInspectionAt: daysAgo(45),
    pscDeficiencies: 0,
    anomalyFlags: [],
    externalDataConnectors: [
      { name: 'MarineTraffic AIS', type: 'ais', status: 'not_connected' },
      { name: 'StormGeo Weather', type: 'weather', status: 'not_connected' },
      { name: 'Paris MOU PSC', type: 'port_state', status: 'not_connected' },
      { name: 'OFAC Sanctions', type: 'sanctions', status: 'not_connected' },
    ],
    createdAt: daysAgo(365),
    updatedAt: hoursAgo(2),
  },
  {
    id: 'vessel-002',
    imo: 'IMO7654321',
    name: 'MT Zenith Carrier',
    flag: 'Liberia',
    vesselType: 'Crude Oil Tanker',
    grossTonnage: 62800,
    deadweightTonnage: 115000,
    yearBuilt: 2015,
    classification: "Lloyd's Register",
    currentStatus: 'in_port',
    currentPort: 'Port of Fujairah',
    currentLat: 25.1,
    currentLon: 56.3,
    crewCount: 26,
    readinessScore: 74,
    maintenanceDue: true,
    certExpiries: [
      { cert: 'ISPS SSAS', expiresAt: daysAgo(-5), status: 'expiring_soon' },
      { cert: 'MLC 2006 DMLC', expiresAt: daysAgo(-60), status: 'valid' },
    ],
    complianceStatus: 'minor_deficiency',
    lastPscInspectionAt: daysAgo(120),
    pscDeficiencies: 2,
    anomalyFlags: ['maintenance_overdue', 'cert_expiring'],
    externalDataConnectors: [
      { name: 'MarineTraffic AIS', type: 'ais', status: 'not_connected' },
      { name: 'StormGeo Weather', type: 'weather', status: 'not_connected' },
      { name: 'Paris MOU PSC', type: 'port_state', status: 'not_connected' },
      { name: 'OFAC Sanctions', type: 'sanctions', status: 'not_connected' },
    ],
    createdAt: daysAgo(400),
    updatedAt: hoursAgo(1),
  },
  {
    id: 'vessel-003',
    imo: 'IMO5432198',
    name: 'MV Pacific Resolve',
    flag: 'Panama',
    vesselType: 'Container Ship',
    grossTonnage: 89400,
    deadweightTonnage: 102000,
    yearBuilt: 2020,
    classification: 'Bureau Veritas',
    currentStatus: 'underway',
    currentLat: -5.2,
    currentLon: 112.8,
    lastPortOfCall: 'Port Klang',
    nextPortOfCall: 'Port of Shanghai',
    eta: daysAgo(-3),
    speed: 18.2,
    heading: 25,
    crewCount: 24,
    readinessScore: 96,
    maintenanceDue: false,
    certExpiries: [{ cert: 'SOLAS Safety', expiresAt: daysAgo(-200), status: 'valid' }],
    complianceStatus: 'compliant',
    lastPscInspectionAt: daysAgo(14),
    pscDeficiencies: 0,
    anomalyFlags: [],
    externalDataConnectors: [
      { name: 'MarineTraffic AIS', type: 'ais', status: 'not_connected' },
      { name: 'StormGeo Weather', type: 'weather', status: 'not_connected' },
      { name: 'Paris MOU PSC', type: 'port_state', status: 'not_connected' },
      { name: 'OFAC Sanctions', type: 'sanctions', status: 'not_connected' },
    ],
    createdAt: daysAgo(200),
    updatedAt: hoursAgo(4),
  },
];

export const voyageTwins: VoyageTwin[] = [
  {
    id: 'voyage-001',
    vesselId: 'vessel-001',
    vesselName: 'MV Avalon Spirit',
    voyageNumber: 'VOY-2026-042',
    status: 'active',
    originPort: 'Singapore',
    destinationPort: 'Rotterdam',
    departureDate: daysAgo(12),
    estimatedArrival: daysAgo(-8),
    cargo: 'Iron Ore',
    cargoValueUsd: 8200000,
    charterParty: 'Voyage Charter — EuroBulk AG',
    freightRate: 18.5,
    routeRisk: 'moderate',
    routeRiskFactors: ['Gulf of Aden piracy advisory', 'Suez Canal congestion'],
    weatherRisk: 'low',
    sanctionsExposure: false,
    portCongestionRisk: 'moderate',
    economics: {
      voyageRevenue: 1414500,
      voyageCosts: 980000,
      tcEquivalent: 24800,
      bunkerCost: 412000,
      portDisbursements: 68000,
      profitMarginPct: 30.7,
    },
    deviations: [
      {
        detectedAt: hoursAgo(36),
        type: 'speed_reduction',
        description: 'Reduced speed to 10.2 kn due to adverse swell. ETA pushed 18 hours.',
        resolved: false,
      },
    ],
    approvals: [
      {
        id: 'vapr-001',
        voyageId: 'voyage-001',
        voyageNumber: 'VOY-2026-042',
        vesselName: 'MV Avalon Spirit',
        actionClass: 'route_deviation',
        title: 'ETA Delay — Adverse Weather',
        description:
          'Speed reduction due to 3m swell. Requesting ETA extension acknowledgment from charterer.',
        status: 'pending',
        priority: 'medium',
        requestedBy: 'Ops Controller',
        requestedAt: hoursAgo(30),
        comments: [],
      },
    ],
    auditTrail: [
      {
        id: 'vaud-001',
        voyageId: 'voyage-001',
        action: 'voyage_created',
        actor: 'ops.system',
        actorRole: 'system',
        at: daysAgo(12),
      },
      {
        id: 'vaud-002',
        voyageId: 'voyage-001',
        action: 'deviation_detected',
        actor: 'system',
        actorRole: 'automation',
        at: hoursAgo(36),
      },
    ],
    externalDataConnectors: [
      { name: 'StormGeo Weather', type: 'weather_api', status: 'not_connected' },
      { name: 'Rotterdam Port Authority', type: 'port_authority', status: 'not_connected' },
      { name: 'Bunker Prices Feed', type: 'fuel_price', status: 'not_connected' },
    ],
    createdAt: daysAgo(14),
    updatedAt: hoursAgo(1),
  },
  {
    id: 'voyage-002',
    vesselId: 'vessel-002',
    vesselName: 'MT Zenith Carrier',
    voyageNumber: 'VOY-2026-037',
    status: 'exception',
    originPort: 'Ras Tanura',
    destinationPort: 'Busan',
    departureDate: daysAgo(8),
    estimatedArrival: daysAgo(-5),
    cargo: 'Crude Oil',
    cargoValueUsd: 42000000,
    charterParty: 'Time Charter — AsiaPetro Corp',
    routeRisk: 'elevated',
    routeRiskFactors: ['Strait of Hormuz transit', 'Maintenance overdue — risk of breakdown'],
    weatherRisk: 'moderate',
    sanctionsExposure: false,
    portCongestionRisk: 'low',
    economics: {
      voyageRevenue: 2100000,
      voyageCosts: 1820000,
      tcEquivalent: 19200,
      bunkerCost: 680000,
      portDisbursements: 42000,
      profitMarginPct: 13.3,
    },
    deviations: [
      {
        detectedAt: hoursAgo(12),
        type: 'unplanned_port_call',
        description:
          'Vessel diverted to Fujairah for emergency maintenance inspection. Voyage status: Exception.',
        resolved: false,
      },
    ],
    approvals: [
      {
        id: 'vapr-002',
        voyageId: 'voyage-002',
        voyageNumber: 'VOY-2026-037',
        vesselName: 'MT Zenith Carrier',
        actionClass: 'exception_escalation',
        title: 'Emergency Port Call — Maintenance',
        description:
          'MT Zenith Carrier diverted to Fujairah for emergency inspection. Charterer notification required. Delay 3-5 days estimated.',
        status: 'pending',
        priority: 'critical',
        requestedBy: 'Fleet Ops Lead',
        requestedAt: hoursAgo(10),
        comments: [
          {
            author: 'Ops Controller',
            body: 'Technical superintendent notified. Surveyor en route.',
            at: hoursAgo(8),
          },
        ],
      },
    ],
    auditTrail: [
      {
        id: 'vaud-010',
        voyageId: 'voyage-002',
        action: 'voyage_created',
        actor: 'ops.system',
        actorRole: 'system',
        at: daysAgo(8),
      },
      {
        id: 'vaud-011',
        voyageId: 'voyage-002',
        action: 'exception_raised',
        actor: 'system',
        actorRole: 'automation',
        at: hoursAgo(12),
        details: { type: 'unplanned_port_call' },
      },
    ],
    externalDataConnectors: [
      { name: 'StormGeo Weather', type: 'weather_api', status: 'not_connected' },
      { name: 'Fujairah Port Authority', type: 'port_authority', status: 'not_connected' },
    ],
    createdAt: daysAgo(10),
    updatedAt: hoursAgo(1),
  },
];

export const fleetWhatChanged: FleetWhatChangedEvent[] = [
  {
    id: 'fwc-001',
    vesselId: 'vessel-002',
    voyageId: 'voyage-002',
    entityName: 'MT Zenith Carrier / VOY-2026-037',
    eventType: 'exception_raised',
    summary: 'EXCEPTION: Emergency port call — Fujairah',
    detail:
      'MT Zenith Carrier diverted to Fujairah for emergency maintenance. Voyage status set to Exception. Approval request pending.',
    severity: 'critical',
    source: 'Fleet Ops',
    occurredAt: hoursAgo(10),
  },
  {
    id: 'fwc-002',
    vesselId: 'vessel-001',
    voyageId: 'voyage-001',
    entityName: 'MV Avalon Spirit / VOY-2026-042',
    eventType: 'route_deviation',
    summary: 'ETA delay — adverse swell, speed reduced',
    detail: 'Speed reduced from 12.4 to 10.2 kn. ETA to Rotterdam pushed by 18 hours.',
    severity: 'warning',
    source: 'AIS Monitor',
    occurredAt: hoursAgo(36),
  },
  {
    id: 'fwc-003',
    vesselId: 'vessel-002',
    entityName: 'MT Zenith Carrier',
    eventType: 'readiness_change',
    summary: 'Readiness score degraded: 74 (↓ from 88)',
    detail:
      'Maintenance overdue + 2 PSC deficiencies + ISPS cert expiring. Score dropped 14 points.',
    severity: 'warning',
    source: 'Readiness Engine',
    occurredAt: hoursAgo(24),
  },
  {
    id: 'fwc-004',
    vesselId: 'vessel-002',
    entityName: 'MT Zenith Carrier',
    eventType: 'cert_expiry',
    summary: 'ISPS SSAS certificate expiring in 5 days',
    detail:
      'International Ship and Port Facility Security — Shipboard Security Alert System cert expiring. Action required.',
    severity: 'warning',
    source: 'Compliance Engine',
    occurredAt: daysAgo(2),
  },
  {
    id: 'fwc-005',
    vesselId: 'vessel-003',
    voyageId: undefined,
    entityName: 'MV Pacific Resolve',
    eventType: 'voyage_status_change',
    summary: 'PSC inspection completed — zero deficiencies',
    detail:
      'Port of Shanghai PSC inspection completed with zero deficiencies. Vessel cleared for departure.',
    severity: 'info',
    source: 'PSC Records',
    occurredAt: daysAgo(14),
  },
];

export interface PortTwin {
  id: string;
  name: string;
  congestionLevel: 'low' | 'moderate' | 'high';
  waitHours: number;
  status: 'open' | 'congested' | 'restricted';
}

export interface RegulatoryZone {
  id: string;
  name: string;
  riskLevel: RouteRiskLevel;
  alertType: string;
  activeRestrictions: string[];
}

export interface RouteTwin {
  id: string;
  name: string;
  vesselId: string;
  status: 'normal' | 'disrupted';
  recommendedReroute?: string;
}

export const portTwins: PortTwin[] = [
  {
    id: 'port-fujairah',
    name: 'Fujairah',
    congestionLevel: 'high',
    waitHours: 28,
    status: 'congested',
  },
  {
    id: 'port-rotterdam',
    name: 'Rotterdam',
    congestionLevel: 'moderate',
    waitHours: 12,
    status: 'open',
  },
];

export const regulatoryZones: RegulatoryZone[] = [
  {
    id: 'zone-gulf-aden',
    name: 'Gulf of Aden',
    riskLevel: 'critical',
    alertType: 'Piracy Advisory',
    activeRestrictions: ['Armed Guard Required', 'Night Transit Restricted'],
  },
  {
    id: 'zone-strait-hormuz',
    name: 'Strait of Hormuz',
    riskLevel: 'elevated',
    alertType: 'Geopolitical Tension',
    activeRestrictions: ['Pre-entry Reporting Required'],
  },
  {
    id: 'zone-english-channel',
    name: 'English Channel',
    riskLevel: 'low',
    alertType: 'Traffic Separation',
    activeRestrictions: ['TSS Compliance'],
  },
];

export const routeTwins: RouteTwin[] = [
  { id: 'route-001', name: 'Asia-Europe Express', vesselId: 'vessel-001', status: 'normal' },
  { id: 'route-002', name: 'Gulf-Far East Lane', vesselId: 'vessel-002', status: 'normal' },
  { id: 'route-003', name: 'Indo-Pacific Route', vesselId: 'vessel-003', status: 'normal' },
];

export const fleetExceptions: FleetException[] = [
  {
    id: 'exc-001',
    vesselId: 'vessel-001',
    entityName: 'MV Avalon Spirit',
    type: 'ais_gap',
    severity: 'high',
    status: 'open',
    description:
      'AIS signal lost for 6 hours in Gulf of Aden — possible transponder interference or intentional deactivation.',
    detectedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    assignedTo: 'Maritime Intelligence',
  },
  {
    id: 'exc-002',
    vesselId: 'vessel-002',
    entityName: 'MV Orion Tide',
    type: 'route_deviation',
    severity: 'medium',
    status: 'investigating',
    description:
      'Vessel deviated 42 nautical miles from planned route near Strait of Hormuz without prior notification.',
    detectedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    assignedTo: 'Operations',
  },
  {
    id: 'exc-003',
    entityName: 'Fujairah Port',
    type: 'port_detention',
    severity: 'critical',
    status: 'escalated',
    description:
      'Port State Control detained vessel pending deficiency rectification — 3 structural deficiencies cited.',
    detectedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    assignedTo: 'Fleet Compliance',
  },
  {
    id: 'exc-004',
    vesselId: 'vessel-003',
    entityName: 'MV Pacific Vanguard',
    type: 'cert_expired',
    severity: 'medium',
    status: 'open',
    description:
      'SOLAS safety certificate expired 4 days ago. Renewal documentation submitted but not yet processed.',
    detectedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];
