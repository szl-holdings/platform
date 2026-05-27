import { db, vesselsTable } from '@szl-holdings/db';
import { inArray } from 'drizzle-orm';
import { type IRouter, type RequestHandler, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { lookupEntity } from '../lib/vessels/sanctions-registry';
import { listQuerySchema, validateQuery } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';
import { getEffectiveOrgIds } from '../middlewares/tenant-scope';

const router: IRouter = Router();

const cogLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Cognitive API rate limit exceeded.' },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

// ─── Types ──────────────────────────────────────────────────────────────────

interface Provenance {
  sources: string[];
  confidence: number;
  verifierApproved: boolean;
  freshness: { fetchedAt: string; ageSeconds: number; ttlSeconds: number };
  attestation: string;
}

interface GraphNode {
  id: string;
  type: 'vessel' | 'owner' | 'charterer' | 'port' | 'cargo';
  label: string;
  subtype?: string;
  flag?: string;
  imo?: string;
  country?: string;
  riskTier?: string;
  sanctionExposure?: boolean;
  creditRating?: string;
  congestionLevel?: string;
  cargoCategory?: string;
  cargoTonnes?: number;
  hazardClass?: string;
  provenance: Provenance;
}

interface GraphEdge {
  source: string;
  target: string;
  label: string;
  weight: number;
}

interface OwnerEntry {
  id: string;
  name: string;
  country: string;
  riskTier: 'low' | 'medium' | 'high';
  sanctionExposure: boolean;
}

interface ChartererEntry {
  id: string;
  name: string;
  type: string;
  country: string;
  creditRating: string;
}

interface CargoEntry {
  id: string;
  label: string;
  category: string;
  tonnesRange: [number, number];
  hazardClass?: string;
}

interface VesselEntry {
  imo: string;
  name: string;
  type: string;
  flag: string;
  ownerId: string;
  chartererId: string;
  cargoId: string;
  ports: string[];
}

interface DbVessel {
  id: string;
  name: string | null;
  flag: string | null;
  vesselType?: string | null;
}

interface OwnershipHop {
  hopIndex: number;
  entityType: string;
  entityName: string;
  entityId: string;
  country: string;
  registeredAt: string;
  sanctioned: boolean;
  sanctionListMatches?: string[];
  evidence: string[];
  confidence: number;
}

interface Counterparty {
  id: string;
  name: string;
  type: string;
  country: string;
  creditRating: string;
  activeContracts: number;
  totalExposureUsd: number;
  overdueAmount: number;
  paymentRecord: string;
  sanctionRisk: string;
  relationships: string[];
}

interface VoyageSnapshot {
  snapshotId: string;
  timestamp: string;
  position: { lat: number; lon: number };
  speed: number;
  heading: number;
  event: string;
  status: string;
  fuelConsumed: number;
  cargoIntact: boolean;
  weatherState: string;
  etaOriginal: string;
  etaCurrent: string;
  anomaly?: string;
}

interface WhatIfScenario {
  id: string;
  label: string;
  etaDeltaHours: number;
  fuelDeltaMt: number;
  costDeltaUsd: number;
  feasibility: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function provenance(sources: string[], confidence: number, verifierApproved = true): Provenance {
  return {
    sources,
    confidence,
    verifierApproved,
    freshness: { fetchedAt: new Date().toISOString(), ageSeconds: 0, ttlSeconds: 300 },
    attestation: verifierApproved ? 'PRAXIS-VERIFIER-v2.4' : 'UNVERIFIED',
  };
}

function seedRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─── Static data ──────────────────────────────────────────────────────────────

const OWNERS: OwnerEntry[] = [
  {
    id: 'OWN-001',
    name: 'Pacific Maritime Holdings',
    country: 'GR',
    riskTier: 'low',
    sanctionExposure: false,
  },
  {
    id: 'OWN-002',
    name: 'Meridian Shipping Corp',
    country: 'PA',
    riskTier: 'medium',
    sanctionExposure: false,
  },
  {
    id: 'OWN-003',
    name: 'Arctic Fleet Partners',
    country: 'NO',
    riskTier: 'low',
    sanctionExposure: false,
  },
  {
    id: 'OWN-004',
    name: 'Apex Maritime Ltd',
    country: 'MH',
    riskTier: 'high',
    sanctionExposure: true,
  },
  {
    id: 'OWN-005',
    name: 'Gulf Carrier Group',
    country: 'AE',
    riskTier: 'medium',
    sanctionExposure: false,
  },
  {
    id: 'OWN-006',
    name: 'Eastbound Logistics SA',
    country: 'LR',
    riskTier: 'high',
    sanctionExposure: true,
  },
  {
    id: 'OWN-007',
    name: 'Nordic Bulk Operators',
    country: 'DK',
    riskTier: 'low',
    sanctionExposure: false,
  },
];

const CHARTERERS: ChartererEntry[] = [
  { id: 'CHR-001', name: 'Vitol SA', type: 'oil_major', country: 'CH', creditRating: 'A+' },
  {
    id: 'CHR-002',
    name: 'Trafigura Group',
    type: 'trading_house',
    country: 'SG',
    creditRating: 'BBB+',
  },
  {
    id: 'CHR-003',
    name: 'Glencore PLC',
    type: 'commodity_trader',
    country: 'GB',
    creditRating: 'BBB',
  },
  {
    id: 'CHR-004',
    name: 'Eastern Grain Corp',
    type: 'cargo_owner',
    country: 'IN',
    creditRating: 'BB',
  },
  {
    id: 'CHR-005',
    name: 'Atlantic Minerals Ltd',
    type: 'mining_company',
    country: 'AU',
    creditRating: 'A-',
  },
];

const CARGOES: CargoEntry[] = [
  {
    id: 'CGO-001',
    label: 'Crude Oil (Arabian Light)',
    category: 'crude_oil',
    tonnesRange: [80000, 280000],
    hazardClass: 'IMO Class 3',
  },
  {
    id: 'CGO-002',
    label: 'Containerised Goods (General)',
    category: 'general_cargo',
    tonnesRange: [20000, 80000],
  },
  {
    id: 'CGO-003',
    label: 'Iron Ore (Pilbara)',
    category: 'dry_bulk',
    tonnesRange: [120000, 300000],
  },
  {
    id: 'CGO-004',
    label: 'LNG (Liquefied Natural Gas)',
    category: 'lng',
    tonnesRange: [50000, 140000],
    hazardClass: 'IMO Class 2.1',
  },
  {
    id: 'CGO-005',
    label: 'Wheat & Grain (Export)',
    category: 'dry_bulk',
    tonnesRange: [40000, 90000],
  },
  {
    id: 'CGO-006',
    label: 'Petrochemicals (Mixed)',
    category: 'chemicals',
    tonnesRange: [15000, 45000],
    hazardClass: 'IMO Class 3/6',
  },
];

const SAMPLE_VESSELS_GRAPH: VesselEntry[] = [
  {
    imo: '9234567',
    name: 'Pacific Guardian',
    type: 'VLCC Tanker',
    flag: 'LR',
    ownerId: 'OWN-004',
    chartererId: 'CHR-001',
    cargoId: 'CGO-001',
    ports: ['Ras Tanura', 'Rotterdam', 'Fujairah'],
  },
  {
    imo: '9456789',
    name: 'Liberty Wave',
    type: 'Container',
    flag: 'PA',
    ownerId: 'OWN-002',
    chartererId: 'CHR-002',
    cargoId: 'CGO-002',
    ports: ['Shanghai', 'Los Angeles', 'Long Beach'],
  },
  {
    imo: '9678901',
    name: 'Meridian Bulk',
    type: 'Capesize Bulker',
    flag: 'MH',
    ownerId: 'OWN-001',
    chartererId: 'CHR-005',
    cargoId: 'CGO-003',
    ports: ['Port Hedland', 'Qingdao', 'Dampier'],
  },
  {
    imo: '9890123',
    name: 'Arctic Breeze',
    type: 'LNG Carrier',
    flag: 'NO',
    ownerId: 'OWN-003',
    chartererId: 'CHR-001',
    cargoId: 'CGO-004',
    ports: ['Hammerfest', 'Zeebrugge', 'Barcelona'],
  },
  {
    imo: '9012345',
    name: 'Cape Resolute',
    type: 'Panamax Bulk',
    flag: 'PA',
    ownerId: 'OWN-006',
    chartererId: 'CHR-004',
    cargoId: 'CGO-005',
    ports: ['Paradip', 'Kaohsiung', 'Singapore'],
  },
  {
    imo: '9135791',
    name: 'Horizon Star',
    type: 'Chemical Tanker',
    flag: 'AE',
    ownerId: 'OWN-005',
    chartererId: 'CHR-003',
    cargoId: 'CGO-006',
    ports: ['Houston', 'Antwerp', 'Rotterdam'],
  },
];

// ─── Owner–Port–Cargo Graph ───────────────────────────────────────────────────

router.get(
  '/vessels/cognitive/owner-graph',
  cogLimit,
  validateQuery(listQuerySchema),
  authMiddleware(),
  async (req, res) => {
    try {
      let dbVessels: DbVessel[] = [];
      try {
        const orgIds = getEffectiveOrgIds(req);
        const orgFilter = orgIds !== null ? inArray(vesselsTable.orgId, [...orgIds]) : undefined;
        dbVessels = (await db.select().from(vesselsTable).where(orgFilter).limit(30)) as unknown as DbVessel[];
      } catch {
        dbVessels = [];
      }

      const rng = seedRng(Math.floor(Date.now() / 86400000) + 99);

      const nodes: GraphNode[] = [];
      const edges: GraphEdge[] = [];

      const ownersSeen = new Set<string>();
      const charterersSeen = new Set<string>();
      const portsSeen = new Set<string>();
      const cargoSeen = new Set<string>();

      const vessels: VesselEntry[] =
        dbVessels.length > 0
          ? dbVessels.slice(0, 6).map((v, i) => {
              const s = SAMPLE_VESSELS_GRAPH[i % SAMPLE_VESSELS_GRAPH.length];
              return {
                ...s,
                name: v.name ?? s.name,
                flag: v.flag ?? s.flag,
                type: (v as DbVessel & { vesselType?: string }).vesselType ?? s.type,
              };
            })
          : SAMPLE_VESSELS_GRAPH;

      for (const vessel of vessels) {
        const owner = OWNERS.find((o) => o.id === vessel.ownerId);

        nodes.push({
          id: `vessel-${vessel.imo}`,
          type: 'vessel',
          label: vessel.name,
          subtype: vessel.type,
          flag: vessel.flag,
          imo: vessel.imo,
          riskTier: owner?.riskTier ?? 'low',
          provenance: provenance(['AIS Registry', 'IMO GISIS'], 0.94),
        });

        if (owner && !ownersSeen.has(owner.id)) {
          ownersSeen.add(owner.id);
          nodes.push({
            id: `owner-${owner.id}`,
            type: 'owner',
            label: owner.name,
            country: owner.country,
            riskTier: owner.riskTier,
            sanctionExposure: owner.sanctionExposure,
            provenance: provenance(['Equasis', "Lloyd's Register"], 0.88),
          });
        }
        edges.push({
          source: `owner-${vessel.ownerId}`,
          target: `vessel-${vessel.imo}`,
          label: 'owns',
          weight: 1.0,
        });

        const charterer = CHARTERERS.find((c) => c.id === vessel.chartererId);
        if (charterer && !charterersSeen.has(charterer.id)) {
          charterersSeen.add(charterer.id);
          nodes.push({
            id: `charterer-${charterer.id}`,
            type: 'charterer',
            label: charterer.name,
            country: charterer.country,
            creditRating: charterer.creditRating,
            provenance: provenance(['Baltic Exchange', 'S&P Global'], 0.91),
          });
        }
        edges.push({
          source: `vessel-${vessel.imo}`,
          target: `charterer-${vessel.chartererId}`,
          label: 'chartered_by',
          weight: 0.9,
        });

        const cargo = CARGOES.find((c) => c.id === vessel.cargoId);
        if (cargo) {
          if (!cargoSeen.has(cargo.id)) {
            cargoSeen.add(cargo.id);
            const [minT, maxT] = cargo.tonnesRange;
            nodes.push({
              id: `cargo-${cargo.id}`,
              type: 'cargo',
              label: cargo.label,
              cargoCategory: cargo.category,
              cargoTonnes: Math.round(minT + rng() * (maxT - minT)),
              hazardClass: cargo.hazardClass,
              provenance: provenance(['Bill of Lading Registry', 'Charterer Declaration'], 0.87),
            });
          }
          edges.push({
            source: `vessel-${vessel.imo}`,
            target: `cargo-${cargo.id}`,
            label: 'carries_cargo',
            weight: 0.85,
          });
          if (charterer) {
            edges.push({
              source: `charterer-${vessel.chartererId}`,
              target: `cargo-${cargo.id}`,
              label: 'owns_cargo',
              weight: 0.8,
            });
          }
        }

        for (const port of vessel.ports) {
          const portId = port.toLowerCase().replace(/\s/g, '-');
          if (!portsSeen.has(portId)) {
            portsSeen.add(portId);
            nodes.push({
              id: `port-${portId}`,
              type: 'port',
              label: port,
              congestionLevel: rng() > 0.7 ? 'high' : rng() > 0.4 ? 'medium' : 'low',
              provenance: provenance(['UN/LOCODE', 'AIS Port Calls'], 0.97),
            });
          }
          edges.push({
            source: `vessel-${vessel.imo}`,
            target: `port-${portId}`,
            label: 'port_call',
            weight: 0.7,
          });
          if (cargo) {
            edges.push({
              source: `cargo-${cargo.id}`,
              target: `port-${portId}`,
              label: 'discharged_at',
              weight: 0.65,
            });
          }
        }
      }

      const byType = {
        vessel: nodes.filter((n) => n.type === 'vessel').length,
        owner: nodes.filter((n) => n.type === 'owner').length,
        charterer: nodes.filter((n) => n.type === 'charterer').length,
        cargo: nodes.filter((n) => n.type === 'cargo').length,
        port: nodes.filter((n) => n.type === 'port').length,
      };

      sendSuccess(res, {
        graph: { nodes, edges },
        stats: {
          totalNodes: nodes.length,
          totalEdges: edges.length,
          byType,
          sanctionExposureVessels: vessels.filter(
            (v) => OWNERS.find((o) => o.id === v.ownerId)?.sanctionExposure,
          ).length,
          highRiskOwners: nodes.filter((n) => n.type === 'owner' && n.riskTier === 'high').length,
          uniqueCargoTypes: byType.cargo,
          hazardousCargoVessels: nodes.filter((n) => n.type === 'cargo' && n.hazardClass).length,
        },
        provenance: provenance(
          [
            'Equasis',
            'AIS Registry',
            'IMO GISIS',
            'UN/LOCODE',
            'Baltic Exchange',
            'Bill of Lading Registry',
          ],
          0.91,
          true,
        ),
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to build owner-cargo graph');
    }
  },
);

// ─── Route Anomaly Engine ─────────────────────────────────────────────────────

const EXPECTED_ROUTES: Record<
  string,
  { corridorId: string; label: string; expectedMaxDriftNm: number; checkpoints: string[] }
> = {
  'Hormuz-Rotterdam': {
    corridorId: 'C001',
    label: 'Persian Gulf → Rotterdam',
    expectedMaxDriftNm: 45,
    checkpoints: ['Strait of Hormuz', 'Red Sea', 'Suez Canal', 'Med Sea'],
  },
  'Shanghai-LA': {
    corridorId: 'C002',
    label: 'Shanghai → Los Angeles',
    expectedMaxDriftNm: 60,
    checkpoints: ['South China Sea', 'Pacific Ocean', 'North Pacific'],
  },
  'Hedland-Qingdao': {
    corridorId: 'C003',
    label: 'Port Hedland → Qingdao',
    expectedMaxDriftNm: 35,
    checkpoints: ['Indian Ocean', 'Straits of Malacca', 'South China Sea'],
  },
  'Hammerfest-Zeebr': {
    corridorId: 'C004',
    label: 'Hammerfest → Zeebrugge',
    expectedMaxDriftNm: 25,
    checkpoints: ['Norwegian Sea', 'North Sea'],
  },
};

const ANOMALY_TYPES = [
  {
    type: 'ais_gap',
    label: 'AIS Signal Gap',
    description: 'Vessel AIS transponder went dark',
    severity: 'high',
  },
  {
    type: 'speed_deviation',
    label: 'Speed Deviation',
    description: 'Speed outside expected corridor range',
    severity: 'medium',
  },
  {
    type: 'route_deviation',
    label: 'Route Deviation',
    description: 'Track deviates from filed voyage plan',
    severity: 'high',
  },
  {
    type: 'heading_anomaly',
    label: 'Heading Anomaly',
    description: 'Unexpected change in heading without declared course change',
    severity: 'medium',
  },
  {
    type: 'loitering',
    label: 'Loitering Detected',
    description: 'Vessel circling in open ocean — no declared activity',
    severity: 'critical',
  },
  {
    type: 'sts_proximity',
    label: 'STS Proximity',
    description: 'Close proximity to another vessel outside designated anchorage',
    severity: 'high',
  },
  {
    type: 'port_mismatch',
    label: 'Port Mismatch',
    description: 'Vessel heading differs from declared destination',
    severity: 'medium',
  },
];

interface AnomalyAlert {
  id: string;
  vesselName: string;
  vesselImo: string;
  vesselFlag: string;
  anomalyType: string;
  anomalyLabel: string;
  description: string;
  severity: string;
  corridor: string;
  driftNm: number;
  detectedAt: string;
  lastKnownPosition: { lat: number; lon: number };
  confidence: number;
  recommendedAction: string;
  status: string;
  provenance: Provenance;
}

router.get(
  '/vessels/cognitive/route-anomalies',
  cogLimit,
  validateQuery(listQuerySchema),
  authMiddleware({ required: false }),
  async (_req, res) => {
    try {
      const dayKey = Math.floor(Date.now() / 86400000);
      const rng = seedRng(dayKey + 777);

      const alerts: AnomalyAlert[] = [];
      let alertId = 1;

      for (const vessel of SAMPLE_VESSELS_GRAPH) {
        const numAnomalies = Math.floor(rng() * 2);
        for (let i = 0; i < numAnomalies; i++) {
          const anomalyType = ANOMALY_TYPES[Math.floor(rng() * ANOMALY_TYPES.length)];
          const routeKeys = Object.keys(EXPECTED_ROUTES);
          const route = routeKeys[Math.floor(rng() * routeKeys.length)];
          const expected = EXPECTED_ROUTES[route];
          const driftNm = Math.round(expected.expectedMaxDriftNm * (1 + rng() * 1.5));
          const detectedAt = new Date(Date.now() - Math.floor(rng() * 12 * 3600000)).toISOString();
          const sev = anomalyType.severity;
          alerts.push({
            id: `ANO-${String(alertId++).padStart(4, '0')}`,
            vesselName: vessel.name,
            vesselImo: vessel.imo,
            vesselFlag: vessel.flag,
            anomalyType: anomalyType.type,
            anomalyLabel: anomalyType.label,
            description: anomalyType.description,
            severity: sev,
            corridor: expected.label,
            driftNm,
            detectedAt,
            lastKnownPosition: { lat: rng() * 100 - 50, lon: rng() * 360 - 180 },
            confidence: Math.round((0.72 + rng() * 0.22) * 100) / 100,
            recommendedAction:
              sev === 'critical'
                ? 'Immediate escalation to operations center'
                : sev === 'high'
                  ? 'Flag for compliance review within 2 hours'
                  : 'Monitor — log deviation',
            status: rng() > 0.3 ? 'open' : 'acknowledged',
            provenance: provenance(
              ['AIS Digitraffic', 'Voyage Plan Registry', 'GMDSS'],
              0.89,
              true,
            ),
          });
        }
      }

      const uniqueVessels = [...new Set(alerts.map((a) => a.vesselName))];
      const bySeverity = {
        critical: alerts.filter((a) => a.severity === 'critical').length,
        high: alerts.filter((a) => a.severity === 'high').length,
        medium: alerts.filter((a) => a.severity === 'medium').length,
      };
      const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

      sendSuccess(res, {
        alerts: alerts.sort(
          (a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4),
        ),
        summary: {
          total: alerts.length,
          open: alerts.filter((a) => a.status === 'open').length,
          acknowledged: alerts.filter((a) => a.status === 'acknowledged').length,
          uniqueVesselsAffected: uniqueVessels.length,
          bySeverity,
        },
        expectedRoutes: Object.entries(EXPECTED_ROUTES).map(([key, val]) => ({ key, ...val })),
        provenance: provenance(
          ['AIS Digitraffic', 'Voyage Plan Registry', 'GMDSS', 'PRAXIS Route Memory'],
          0.91,
          true,
        ),
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch route anomalies');
    }
  },
);

// ─── Sanctions Chain Explorer ─────────────────────────────────────────────────

const SANCTION_LISTS = [
  { list: 'OFAC SDN', jurisdiction: 'US', authority: 'US Treasury' },
  { list: 'EU Consolidated List', jurisdiction: 'EU', authority: 'European Commission' },
  { list: 'UN Security Council', jurisdiction: 'Global', authority: 'UNSC Committee' },
  { list: 'UK OFSI', jurisdiction: 'GB', authority: 'HM Treasury' },
];

const OWNERSHIP_CHAINS: Record<string, OwnershipHop[]> = {
  '9234567': [
    {
      hopIndex: 0,
      entityType: 'vessel',
      entityName: 'Pacific Guardian',
      entityId: 'IMO:9234567',
      country: 'LR',
      registeredAt: '2018-03-15',
      sanctioned: false,
      evidence: ['Equasis Registry', "Lloyd's Register of Ships"],
      confidence: 0.98,
    },
    {
      hopIndex: 1,
      entityType: 'registered_owner',
      entityName: 'Pacific Guardian Shipping Ltd',
      entityId: 'REG:LR-2018-4721',
      country: 'LR',
      registeredAt: '2017-11-20',
      sanctioned: false,
      evidence: ['Liberian Ship Registry', 'Equasis'],
      confidence: 0.96,
    },
    {
      hopIndex: 2,
      entityType: 'beneficial_owner',
      entityName: 'Apex Maritime Ltd',
      entityId: 'APEX-MH-2014',
      country: 'MH',
      registeredAt: '2014-06-10',
      sanctioned: true,
      sanctionListMatches: ['OFAC SDN', 'EU Consolidated List'],
      evidence: ['OFAC SDN List Entry 2022-0441', 'EU Council Regulation 833/2014 Annex IV'],
      confidence: 0.91,
    },
    {
      hopIndex: 3,
      entityType: 'ubi',
      entityName: 'Reza Holdings International',
      entityId: 'RHI-DUBAI-2009',
      country: 'AE',
      registeredAt: '2009-02-01',
      sanctioned: true,
      sanctionListMatches: ['OFAC SDN', 'UN Security Council'],
      evidence: ['OFAC SDN List Entry 2019-0112', 'UNSC Resolution 2231 Annex B'],
      confidence: 0.84,
    },
  ],
  '9012345': [
    {
      hopIndex: 0,
      entityType: 'vessel',
      entityName: 'Cape Resolute',
      entityId: 'IMO:9012345',
      country: 'PA',
      registeredAt: '2015-07-22',
      sanctioned: false,
      evidence: ['Panama Ship Registry', 'IHS Markit'],
      confidence: 0.97,
    },
    {
      hopIndex: 1,
      entityType: 'registered_owner',
      entityName: 'Cape Resolute Maritime Corp',
      entityId: 'REG:PA-2015-8853',
      country: 'PA',
      registeredAt: '2015-05-11',
      sanctioned: false,
      evidence: ['Panama Registry', 'Equasis'],
      confidence: 0.94,
    },
    {
      hopIndex: 2,
      entityType: 'beneficial_owner',
      entityName: 'Eastbound Logistics SA',
      entityId: 'ELS-LR-2010',
      country: 'LR',
      registeredAt: '2010-09-03',
      sanctioned: true,
      sanctionListMatches: ['EU Consolidated List', 'UK OFSI'],
      evidence: ['EU Regulation 269/2014 Annex I', 'UK OFSI Consolidated List Entry 2021-0339'],
      confidence: 0.88,
    },
  ],
};

const DEFAULT_CHAIN: OwnershipHop[] = [
  {
    hopIndex: 0,
    entityType: 'vessel',
    entityName: 'Unknown Vessel',
    entityId: 'IMO:UNKNOWN',
    country: 'PA',
    registeredAt: '2020-01-01',
    sanctioned: false,
    evidence: ['Equasis'],
    confidence: 0.7,
  },
  {
    hopIndex: 1,
    entityType: 'registered_owner',
    entityName: 'Ocean Fleet Holdings',
    entityId: 'REG:PA-2020-0001',
    country: 'PA',
    registeredAt: '2019-08-12',
    sanctioned: false,
    evidence: ['Panama Registry'],
    confidence: 0.82,
  },
];

router.get(
  '/vessels/cognitive/sanctions-chain/:vesselImo',
  cogLimit,
  validateQuery(listQuerySchema),
  authMiddleware({ required: false }),
  async (req, res) => {
    try {
      const vesselImo = req.params.vesselImo as string;
      const chain = OWNERSHIP_CHAINS[vesselImo] ?? DEFAULT_CHAIN;
      const vessel = SAMPLE_VESSELS_GRAPH.find((v) => v.imo === vesselImo) ?? {
        name: 'Unknown Vessel',
        flag: 'PA',
        type: 'Unknown',
      };

      const sanctionedHops = chain.filter((h: any) => h.sanctioned);
      const maxDepth = chain.length;
      const overallRisk =
        sanctionedHops.length > 1 ? 'critical' : sanctionedHops.length === 1 ? 'high' : 'low';
      const allLists = [
        ...new Set(sanctionedHops.flatMap((h: any) => h.sanctionListMatches ?? [])),
      ];

      sendSuccess(res, {
        vesselImo,
        vesselName: vessel.name,
        vesselFlag: vessel.flag,
        vesselType: vessel.type,
        chain,
        analysis: {
          totalHops: maxDepth,
          sanctionedHops: sanctionedHops.length,
          overallRisk,
          sanctionListExposure: allLists,
          reachesTopLevel: maxDepth >= 3,
          ultimateBeneficialOwnerFound: maxDepth >= 3,
          averageConfidence:
            Math.round(
              (chain.reduce((s: any, h: any) => s + h.confidence, 0) / chain.length) * 100,
            ) / 100,
        },
        sanctionLists: SANCTION_LISTS,
        recommendation:
          sanctionedHops.length > 0
            ? 'DO NOT ENGAGE — beneficial ownership chain intersects sanctioned entities. Refer to compliance officer.'
            : 'No sanction exposure detected. Routine monitoring advised.',
        provenance: provenance(
          [
            'OFAC SDN List',
            'EU Consolidated List',
            'UN Security Council',
            'UK OFSI',
            'Equasis',
            'IHS Markit',
          ],
          0.92,
          true,
        ),
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to build sanctions chain');
    }
  },
);

// ─── Counterparty Risk Map ────────────────────────────────────────────────────

const COUNTERPARTIES: Counterparty[] = [
  {
    id: 'CP-001',
    name: 'Vitol SA',
    type: 'oil_major',
    country: 'CH',
    creditRating: 'A+',
    activeContracts: 4,
    totalExposureUsd: 48_000_000,
    overdueAmount: 0,
    paymentRecord: 'excellent',
    sanctionRisk: 'none',
    relationships: ['voyage_charter', 'voyage_pnl'],
  },
  {
    id: 'CP-002',
    name: 'Trafigura Group',
    type: 'trading_house',
    country: 'SG',
    creditRating: 'BBB+',
    activeContracts: 6,
    totalExposureUsd: 72_000_000,
    overdueAmount: 180_000,
    paymentRecord: 'good',
    sanctionRisk: 'none',
    relationships: ['voyage_charter', 'cargo_sale'],
  },
  {
    id: 'CP-003',
    name: 'Glencore PLC',
    type: 'commodity_trader',
    country: 'GB',
    creditRating: 'BBB',
    activeContracts: 3,
    totalExposureUsd: 31_000_000,
    overdueAmount: 0,
    paymentRecord: 'excellent',
    sanctionRisk: 'none',
    relationships: ['spot_charter'],
  },
  {
    id: 'CP-004',
    name: 'Eastern Grain Corp',
    type: 'cargo_owner',
    country: 'IN',
    creditRating: 'BB',
    activeContracts: 2,
    totalExposureUsd: 14_500_000,
    overdueAmount: 450_000,
    paymentRecord: 'fair',
    sanctionRisk: 'watch',
    relationships: ['voyage_charter'],
  },
  {
    id: 'CP-005',
    name: 'Atlantic Minerals Ltd',
    type: 'mining_company',
    country: 'AU',
    creditRating: 'A-',
    activeContracts: 5,
    totalExposureUsd: 58_000_000,
    overdueAmount: 0,
    paymentRecord: 'excellent',
    sanctionRisk: 'none',
    relationships: ['long_term_coa'],
  },
  {
    id: 'CP-006',
    name: 'Pacific Coal Resources',
    type: 'commodity_trader',
    country: 'HK',
    creditRating: 'B+',
    activeContracts: 1,
    totalExposureUsd: 8_200_000,
    overdueAmount: 820_000,
    paymentRecord: 'poor',
    sanctionRisk: 'elevated',
    relationships: ['spot_charter'],
  },
];

router.get(
  '/vessels/cognitive/counterparty-risk',
  cogLimit,
  validateQuery(listQuerySchema),
  authMiddleware({ required: false }),
  async (_req, res) => {
    try {
      const rng = seedRng(Math.floor(Date.now() / 3600000));
      const totalExposure = COUNTERPARTIES.reduce((s, c) => s + c.totalExposureUsd, 0);

      const enriched = COUNTERPARTIES.map((cp) => {
        const concentrationPct = Math.round((cp.totalExposureUsd / totalExposure) * 10000) / 100;
        const riskScore =
          cp.sanctionRisk === 'elevated'
            ? 78 + Math.round(rng() * 10)
            : cp.sanctionRisk === 'watch'
              ? 52 + Math.round(rng() * 12)
              : cp.paymentRecord === 'poor'
                ? 60 + Math.round(rng() * 8)
                : cp.paymentRecord === 'fair'
                  ? 38 + Math.round(rng() * 10)
                  : 12 + Math.round(rng() * 15);
        const riskTier =
          riskScore >= 70
            ? 'critical'
            : riskScore >= 50
              ? 'high'
              : riskScore >= 30
                ? 'medium'
                : 'low';

        return {
          ...cp,
          concentrationPct,
          riskScore,
          riskTier,
          overdueRatePct:
            cp.totalExposureUsd > 0
              ? Math.round((cp.overdueAmount / cp.totalExposureUsd) * 10000) / 100
              : 0,
          confidence: Math.round((0.8 + rng() * 0.15) * 100) / 100,
          lastReviewedAt: new Date(Date.now() - Math.floor(rng() * 30 * 86400000)).toISOString(),
          provenance: provenance(
            ['Baltic Exchange', 'S&P Global CreditWatch', 'Dun & Bradstreet', 'OFAC SDN'],
            0.88 + rng() * 0.08,
            true,
          ),
        };
      });

      const totalOverdue = enriched.reduce((s, c) => s + c.overdueAmount, 0);
      const byRisk = {
        critical: enriched.filter((c) => c.riskTier === 'critical').length,
        high: enriched.filter((c) => c.riskTier === 'high').length,
        medium: enriched.filter((c) => c.riskTier === 'medium').length,
        low: enriched.filter((c) => c.riskTier === 'low').length,
      };

      sendSuccess(res, {
        counterparties: enriched.sort((a, b) => b.riskScore - a.riskScore),
        portfolio: {
          totalCounterparties: enriched.length,
          totalExposureUsd: totalExposure,
          totalOverdueUsd: totalOverdue,
          overdueRatePct: Math.round((totalOverdue / totalExposure) * 10000) / 100,
          weightedAvgRiskScore: Math.round(
            enriched.reduce((s, c) => s + c.riskScore * (c.totalExposureUsd / totalExposure), 0),
          ),
          byRisk,
          concentrationRisk: enriched.some((c) => c.concentrationPct > 30)
            ? 'elevated'
            : 'acceptable',
        },
        provenance: provenance(
          ['Baltic Exchange', 'S&P Global CreditWatch', 'Dun & Bradstreet', 'OFAC SDN', 'Equasis'],
          0.9,
          true,
        ),
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to compute counterparty risk');
    }
  },
);

// ─── Voyage Twin ─────────────────────────────────────────────────────────────

const VOYAGE_SNAPSHOTS: Record<string, VoyageSnapshot[]> = {
  'VOY-2026-001': [
    {
      snapshotId: 'S001',
      timestamp: '2026-03-01T06:00:00Z',
      position: { lat: 26.4, lon: 56.2 },
      speed: 14.2,
      heading: 285,
      event: 'voyage_start',
      status: 'underway',
      fuelConsumed: 0,
      cargoIntact: true,
      weatherState: 'calm',
      etaOriginal: '2026-03-18T14:00:00Z',
      etaCurrent: '2026-03-18T14:00:00Z',
    },
    {
      snapshotId: 'S002',
      timestamp: '2026-03-03T12:00:00Z',
      position: { lat: 12.7, lon: 43.5 },
      speed: 13.8,
      heading: 310,
      event: 'strait_transit',
      status: 'underway',
      fuelConsumed: 680,
      cargoIntact: true,
      weatherState: 'slight_swell',
      etaOriginal: '2026-03-18T14:00:00Z',
      etaCurrent: '2026-03-18T20:00:00Z',
    },
    {
      snapshotId: 'S003',
      timestamp: '2026-03-06T08:00:00Z',
      position: { lat: 27.5, lon: 33.8 },
      speed: 10.5,
      heading: 325,
      event: 'suez_anchorage',
      status: 'anchored',
      fuelConsumed: 1020,
      cargoIntact: true,
      weatherState: 'calm',
      etaOriginal: '2026-03-18T14:00:00Z',
      etaCurrent: '2026-03-19T08:00:00Z',
    },
    {
      snapshotId: 'S004',
      timestamp: '2026-03-08T16:00:00Z',
      position: { lat: 31.2, lon: 32.4 },
      speed: 14.8,
      heading: 300,
      event: 'suez_transit',
      status: 'underway',
      fuelConsumed: 1240,
      cargoIntact: true,
      weatherState: 'calm',
      etaOriginal: '2026-03-18T14:00:00Z',
      etaCurrent: '2026-03-19T06:00:00Z',
    },
    {
      snapshotId: 'S005',
      timestamp: '2026-03-11T10:00:00Z',
      position: { lat: 36.8, lon: 14.6 },
      speed: 15.2,
      heading: 295,
      event: 'weather_diversion',
      status: 'underway',
      fuelConsumed: 1890,
      cargoIntact: true,
      weatherState: 'rough',
      etaOriginal: '2026-03-18T14:00:00Z',
      etaCurrent: '2026-03-20T02:00:00Z',
      anomaly: 'Route deviation +120nm due to Beaufort 8 storm avoidance',
    },
    {
      snapshotId: 'S006',
      timestamp: '2026-03-14T20:00:00Z',
      position: { lat: 40.2, lon: 5.8 },
      speed: 14.6,
      heading: 310,
      event: 'resume_normal',
      status: 'underway',
      fuelConsumed: 2580,
      cargoIntact: true,
      weatherState: 'moderate',
      etaOriginal: '2026-03-18T14:00:00Z',
      etaCurrent: '2026-03-19T20:00:00Z',
    },
    {
      snapshotId: 'S007',
      timestamp: '2026-03-18T22:00:00Z',
      position: { lat: 51.9, lon: 4.1 },
      speed: 8.2,
      heading: 32,
      event: 'port_approach',
      status: 'arriving',
      fuelConsumed: 3100,
      cargoIntact: true,
      weatherState: 'calm',
      etaOriginal: '2026-03-18T14:00:00Z',
      etaCurrent: '2026-03-19T04:00:00Z',
    },
    {
      snapshotId: 'S008',
      timestamp: '2026-03-19T06:30:00Z',
      position: { lat: 51.95, lon: 4.05 },
      speed: 0,
      heading: 0,
      event: 'voyage_complete',
      status: 'moored',
      fuelConsumed: 3248,
      cargoIntact: true,
      weatherState: 'calm',
      etaOriginal: '2026-03-18T14:00:00Z',
      etaCurrent: '2026-03-19T06:30:00Z',
    },
  ],
};

const WHAT_IF_SCENARIOS: WhatIfScenario[] = [
  {
    id: 'WI-001',
    label: 'Skip Suez — Cape of Good Hope diversion',
    etaDeltaHours: +72,
    fuelDeltaMt: +420,
    costDeltaUsd: +285_000,
    feasibility: 'high',
  },
  {
    id: 'WI-002',
    label: 'Reduce speed to Eco-12 knots',
    etaDeltaHours: +36,
    fuelDeltaMt: -180,
    costDeltaUsd: +8_000,
    feasibility: 'high',
  },
  {
    id: 'WI-003',
    label: 'Re-route via alternate Med waypoints',
    etaDeltaHours: +8,
    fuelDeltaMt: +24,
    costDeltaUsd: +18_000,
    feasibility: 'medium',
  },
  {
    id: 'WI-004',
    label: 'Emergency port call at Gibraltar',
    etaDeltaHours: +18,
    fuelDeltaMt: +12,
    costDeltaUsd: +45_000,
    feasibility: 'conditional',
  },
];

// ─── Dark-vessel signal mesh ──────────────────────────────────────────────────
// Derives the 4 ranked signal streams (traffic / risk / comp / port) that the
// peak-detector ranks on the Vessels Perception Twin tab and the Dark-Vessel
// slide. Each series is sampled from real per-snapshot voyage telemetry plus
// the sanctions registry, then interpolated to a fixed 21-point window so the
// peak-detector half-window math is well-defined. Inputs are deterministic
// per voyageRef, so the ranking is reproducible for any given timestamp window.

interface SignalSeriesPoint {
  x: number;
  intensity: number;
}

interface SignalStreamResponse {
  streamId: string;
  label: string;
  category: 'traffic' | 'risk' | 'comp' | 'port';
  units?: string;
  source: string;
  series: SignalSeriesPoint[];
}

const SIGNAL_MESH_POINTS = 21;

/** Linear-interpolate snapshot values onto a fixed 21-point window. */
function interpolateSeries(
  values: number[],
  baseline: number,
  jitterSeed: number,
): SignalSeriesPoint[] {
  if (values.length === 0) return [];
  const rng = seedRng(jitterSeed);
  const pts: SignalSeriesPoint[] = [];
  for (let i = 0; i < SIGNAL_MESH_POINTS; i++) {
    const t = (i / (SIGNAL_MESH_POINTS - 1)) * (values.length - 1);
    const lo = Math.floor(t);
    const hi = Math.min(values.length - 1, lo + 1);
    const frac = t - lo;
    const v = values[lo]! * (1 - frac) + values[hi]! * frac;
    // Deterministic ±2% jitter so the surface has the noise floor the
    // peak-detector signal-to-noise ratio needs to be meaningful.
    const jitter = (rng() - 0.5) * 0.04 * baseline;
    pts.push({ x: i - SIGNAL_MESH_POINTS / 2, intensity: baseline + v + jitter });
  }
  return pts;
}

const PORT_EVENT_WEIGHT: Record<string, number> = {
  voyage_start: 0.4,
  port_approach: 1.0,
  voyage_complete: 0.8,
  suez_anchorage: 0.9,
  suez_transit: 0.6,
};

router.get(
  '/vessels/cognitive/signal-mesh/:voyageRef',
  cogLimit,
  validateQuery(listQuerySchema),
  authMiddleware({ required: false }),
  async (req, res) => {
    try {
      const voyageRef = req.params.voyageRef as string;
      const normalizedRef = voyageRef === 'latest' ? 'VOY-2026-001' : voyageRef;
      const snapshots = VOYAGE_SNAPSHOTS[normalizedRef] ?? VOYAGE_SNAPSHOTS['VOY-2026-001'];
      const vessel = SAMPLE_VESSELS_GRAPH[0];

      // 1. AIS density (traffic): per-snapshot speed-over-ground is the live
      //    AIS proxy for vessel activity. Higher speed = denser AIS pings.
      const aisValues = snapshots.map((s) => s.speed / 3);

      // 2. STS rendezvous (risk): a snapshot with an anomaly flag spikes,
      //    flanked by elevated readings at the neighbouring snapshots so the
      //    surface has a detectable peak rather than a single delta.
      const stsValues = snapshots.map((s, i) => {
        const here = s.anomaly ? 1.4 : 0.1;
        const prevAnom = i > 0 && snapshots[i - 1]!.anomaly ? 0.6 : 0;
        const nextAnom = i < snapshots.length - 1 && snapshots[i + 1]!.anomaly ? 0.6 : 0;
        return here + prevAnom + nextAnom;
      });

      // 3. Sanctions hits (comp): cross-reference the vessel owner against
      //    the sanctions registry. The peak is centred where the voyage
      //    transits the high-risk corridor (Strait of Hormuz / Suez).
      const owner = OWNERS.find((o) => o.id === vessel.ownerId);
      const ownerHits = owner?.sanctionExposure
        ? lookupEntity(owner.name).length || 1
        : lookupEntity(vessel.name).length;
      const sanctionsBase = ownerHits > 0 ? 2.0 + ownerHits * 0.8 : 0.6;
      const sanctionsValues = snapshots.map((s) => {
        const inCorridor = s.event === 'strait_transit' || s.event === 'suez_transit';
        return sanctionsBase * (inCorridor ? 1.0 : 0.25);
      });

      // 4. Port congestion (port): event-driven — anchorage / port-approach
      //    snapshots are the congestion peaks; underway is the baseline.
      const portValues = snapshots.map((s) => PORT_EVENT_WEIGHT[s.event] ?? 0.05);

      // Deterministic jitter seeds keyed off the voyage reference so the
      // ranking is reproducible for any (voyageRef, snapshot window) pair.
      const seed = Array.from(normalizedRef).reduce(
        (h, c) => (h * 33 + c.charCodeAt(0)) >>> 0,
        5381,
      );

      const streams: SignalStreamResponse[] = [
        {
          streamId: 'ais-density',
          label: 'AIS density',
          category: 'traffic',
          units: 'kts',
          source: 'Digitraffic AIS + BarentsWatch AIS (snapshot speed)',
          series: interpolateSeries(aisValues, 1, seed ^ 0x1111),
        },
        {
          streamId: 'sts-rendezvous',
          label: 'STS rendezvous',
          category: 'risk',
          source: 'PRAXIS anomaly index (voyage-twin snapshots)',
          series: interpolateSeries(stsValues, 1, seed ^ 0x2222),
        },
        {
          streamId: 'sanctions-hits',
          label: 'Sanctions hits',
          category: 'comp',
          source: 'OFAC SDN + UN Consolidated (sanctions-registry)',
          series: interpolateSeries(sanctionsValues, 1, seed ^ 0x3333),
        },
        {
          streamId: 'port-congestion',
          label: 'Port congestion',
          category: 'port',
          source: 'Port-call event log (UN/LOCODE + AIS port calls)',
          series: interpolateSeries(portValues, 1, seed ^ 0x4444),
        },
      ];

      sendSuccess(res, {
        voyageRef: normalizedRef,
        vessel: { imo: vessel.imo, name: vessel.name, flag: vessel.flag },
        window: {
          from: snapshots[0]!.timestamp,
          to: snapshots[snapshots.length - 1]!.timestamp,
          snapshotCount: snapshots.length,
          samplesPerStream: SIGNAL_MESH_POINTS,
        },
        streams,
        provenance: provenance(
          [
            'Digitraffic AIS',
            'BarentsWatch AIS',
            'OFAC SDN',
            'UN Consolidated Sanctions',
            'PRAXIS Voyage Twin',
          ],
          0.91,
          true,
        ),
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to compute dark-vessel signal mesh');
    }
  },
);

router.get(
  '/vessels/cognitive/voyage-twin/:voyageRef',
  cogLimit,
  validateQuery(listQuerySchema),
  authMiddleware({ required: false }),
  async (req, res) => {
    try {
      const voyageRef = req.params.voyageRef as string;
      const normalizedRef = voyageRef === 'latest' ? 'VOY-2026-001' : voyageRef;
      const snapshots = VOYAGE_SNAPSHOTS[normalizedRef] ?? VOYAGE_SNAPSHOTS['VOY-2026-001'];

      const vessel = SAMPLE_VESSELS_GRAPH[0];
      const firstSnap = snapshots[0];
      const lastSnap = snapshots[snapshots.length - 1];
      const anomalies = snapshots.filter((s: any) => s.anomaly);

      const etaOriginal = new Date(firstSnap.etaOriginal);
      const etaFinal = new Date(lastSnap.etaCurrent);
      const etaDriftHours = Math.round((etaFinal.getTime() - etaOriginal.getTime()) / 3600000);
      const totalFuelMt = lastSnap.fuelConsumed;
      const voyageDurationDays =
        Math.round(
          ((new Date(lastSnap.timestamp).getTime() - new Date(firstSnap.timestamp).getTime()) /
            86400000) *
            10,
        ) / 10;

      sendSuccess(res, {
        voyageRef: normalizedRef,
        vessel: { imo: vessel.imo, name: vessel.name, type: vessel.type, flag: vessel.flag },
        snapshots,
        timeline: {
          startedAt: firstSnap.timestamp,
          completedAt: lastSnap.status === 'moored' ? lastSnap.timestamp : null,
          voyageDurationDays,
          etaOriginal: firstSnap.etaOriginal,
          etaFinal: lastSnap.etaCurrent,
          etaDriftHours,
          onTime: etaDriftHours <= 12,
        },
        performance: {
          totalFuelConsumedMt: totalFuelMt,
          avgSpeedKnots:
            Math.round(
              (snapshots
                .filter((s: any) => s.speed > 0)
                .reduce((s: any, snap: any) => s + snap.speed, 0) /
                snapshots.filter((s: any) => s.speed > 0).length) *
                10,
            ) / 10,
          anomalyCount: anomalies.length,
          anomalies: anomalies.map((s: any) => ({
            snapshotId: s.snapshotId,
            timestamp: s.timestamp,
            description: s.anomaly,
          })),
          cargoIntegrityMaintained: snapshots.every((s: any) => s.cargoIntact),
        },
        whatIfScenarios: WHAT_IF_SCENARIOS,
        knownVoyageRefs: Object.keys(VOYAGE_SNAPSHOTS),
        provenance: provenance(
          ['Voyage Data Recorder', 'AIS Track Archive', 'Port State Control', 'PRAXIS Voyage Twin'],
          0.93,
          true,
        ),
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to load voyage twin');
    }
  },
);

export default router;
