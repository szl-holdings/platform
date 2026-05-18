import { db, vesselsTable, vesselsEventsTable } from '@szl-holdings/db';
import { desc, eq } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendNotFound, sendSuccess } from '../lib/api-response';
import { broadcastWs, pubsub, VESSELS_EVENTS } from '../lib/pubsub-bridge.js';
import { authMiddleware } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';
import {
  SANCTIONED_ENTITIES,
  HIGH_RISK_FLAG_REGISTRIES,
  SANCTIONED_PORT_CORRIDORS,
  lookupEntity,
  isHighRiskFlag,
  isSanctionedPortCorridor,
  registryStats,
  type SanctionedEntity,
} from '../lib/vessels/sanctions-registry';

const router: IRouter = Router();

type SanctionsTier = 'clear' | 'watch' | 'high' | 'critical';

interface NetworkNode {
  id: string;
  type: string;
  label: string;
  country: string;
  sanctioned: boolean;
  sanctionLists?: string[];
  riskTier: SanctionsTier;
  confidence: number;
  details?: string;
  imo?: string;
}

interface NetworkEdge {
  source: string;
  target: string;
  type: string;
  label: string;
  confidence: number;
  since?: string;
}

interface SanctionsRule {
  id: string;
  ruleCode: string;
  description: string;
  list: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  triggered: boolean;
  score: number;
  evidence?: string;
}

const RULES_LIBRARY: Omit<SanctionsRule, 'triggered'>[] = [
  { id: 'r01', ruleCode: 'OFAC-DFA-001', description: 'Registered owner appears on OFAC SDN list', list: 'OFAC_SDN', severity: 'critical', score: 40 },
  { id: 'r02', ruleCode: 'OFAC-DFA-002', description: 'Beneficial owner domiciled in sanctioned jurisdiction', list: 'OFAC_SDN', severity: 'high', score: 30 },
  { id: 'r03', ruleCode: 'EU-CONS-011', description: 'Ship manager entity flagged on EU Consolidated list', list: 'EU_CONSOLIDATED', severity: 'high', score: 25 },
  { id: 'r04', ruleCode: 'DARK-AIS-001', description: 'AIS transponder dark for >8 hours in sanctioned corridor', list: 'INTERNAL', severity: 'high', score: 20 },
  { id: 'r05', ruleCode: 'PORT-SAN-003', description: 'Prior call at sanctioned port within 12 months', list: 'INTERNAL', severity: 'medium', score: 15 },
  { id: 'r06', ruleCode: 'FLAG-FOC-007', description: 'Flag-of-convenience jurisdiction with elevated evasion risk', list: 'INTERNAL', severity: 'medium', score: 10 },
  { id: 'r07', ruleCode: 'UK-OFSI-014', description: 'Charterer linked to UK OFSI-designated entity', list: 'UK_OFSI', severity: 'high', score: 28 },
  { id: 'r08', ruleCode: 'INSURER-SAN-002', description: 'P&I Club cover withdrawn due to sanctions exposure', list: 'INTERNAL', severity: 'critical', score: 35 },
  { id: 'r09', ruleCode: 'STS-TRANS-001', description: 'Ship-to-ship transfer detected in sanctioned waters', list: 'INTERNAL', severity: 'high', score: 22 },
  { id: 'r10', ruleCode: 'CARGO-ORI-005', description: 'Cargo origin linked to sanctioned commodity corridor', list: 'INTERNAL', severity: 'medium', score: 12 },
];

// Sanctioned-jurisdiction inferred ownership risk (programme-state flags):
const HIGH_RISK_FLAGS = new Set(['KP', 'IR', 'SY', 'CU', 'VE', 'RU']);
// Flag-of-convenience risk derived from the registry's FoC table.
const FOC_FLAGS = new Set(HIGH_RISK_FLAG_REGISTRIES.map((r) => r.code));
// Port-call corridor risk derived from the registry's curated list.
const SANCTIONED_PORTS = new Set(SANCTIONED_PORT_CORRIDORS.map((p) => p.toLowerCase()));
// Owner / manager alias indices derived from the curated entity registry —
// no more hard-coded keyword arrays; every match is traceable to a
// concrete OFAC / EU / UK / UN designation.
const SDN_OWNER_ENTITIES: SanctionedEntity[] = SANCTIONED_ENTITIES.filter(
  (e) => e.lists.includes('OFAC_SDN'),
);
const EU_MANAGER_ENTITIES: SanctionedEntity[] = SANCTIONED_ENTITIES.filter(
  (e) => e.lists.includes('EU_CONSOLIDATED'),
);
const UK_OFSI_ENTITIES: SanctionedEntity[] = SANCTIONED_ENTITIES.filter(
  (e) => e.lists.includes('UK_OFSI'),
);

interface VesselRow {
  id: number;
  name?: string | null;
  imoNumber?: string | null;
  flagState?: string | null;
  registeredOwner?: string | null;
  shipManager?: string | null;
  charterer?: string | null;
  currentPort?: string | null;
  lastPort?: string | null;
  aisBlackoutHours?: number | string | null;
  [key: string]: unknown;
}

function evaluateRules(vessel: VesselRow): { rules: SanctionsRule[]; triggeredIds: string[] } {
  const triggeredIds: string[] = [];
  const evidence: Record<string, string> = {};
  const flag = (typeof vessel.flagState === 'string' ? vessel.flagState : '') || '';
  const owner = (typeof vessel.registeredOwner === 'string' ? vessel.registeredOwner : '') || '';
  const manager = (typeof vessel.shipManager === 'string' ? vessel.shipManager : '') || '';
  const charterer = (typeof vessel.charterer === 'string' ? vessel.charterer : '') || '';
  const currentPort = (typeof vessel.currentPort === 'string' ? vessel.currentPort : '') || '';
  const lastPort = (typeof vessel.lastPort === 'string' ? vessel.lastPort : '') || '';
  const aisBlackout = Number(vessel.aisBlackoutHours ?? 0);
  const ownerLower = owner.toLowerCase();
  const managerLower = manager.toLowerCase();
  const chartererLower = charterer.toLowerCase();
  const currentPortLower = currentPort.toLowerCase();
  const lastPortLower = lastPort.toLowerCase();

  // R01 — Registered owner appears on OFAC SDN list (registry-backed lookup)
  const ownerSdnMatch = lookupEntity(owner).find((m) =>
    m.entity.lists.includes('OFAC_SDN') && m.confidence >= 0.55,
  );
  if (ownerSdnMatch) {
    triggeredIds.push('r01');
    evidence['r01'] = `Owner "${owner}" matches ${ownerSdnMatch.entity.name} — ${ownerSdnMatch.entity.programme} (${ownerSdnMatch.entity.designatedAt}); confidence ${(ownerSdnMatch.confidence * 100).toFixed(0)}%`;
  }

  // R02 — Beneficial owner domiciled in sanctioned jurisdiction (programme-state)
  if (HIGH_RISK_FLAGS.has(flag)) {
    triggeredIds.push('r02');
    evidence['r02'] = `Flag state ${flag} is subject to active sanctions programme — owner jurisdiction inferred high-risk`;
  }

  // R03 — Ship manager on EU Consolidated list
  const managerEuMatch = lookupEntity(manager).find((m) =>
    m.entity.lists.includes('EU_CONSOLIDATED') && m.confidence >= 0.55,
  );
  if (managerEuMatch) {
    triggeredIds.push('r03');
    evidence['r03'] = `Manager "${manager}" matches ${managerEuMatch.entity.name} on EU Consolidated list — ${managerEuMatch.entity.programme}`;
  }

  // R04 — AIS dark behaviour
  if (aisBlackout > 8) {
    triggeredIds.push('r04');
    evidence['r04'] = `AIS blackout recorded: ${aisBlackout.toFixed(1)}h in potentially sanctioned corridor`;
  }

  // R05 — Prior call at sanctioned-corridor port (registry-backed)
  const currentPortHit = isSanctionedPortCorridor(currentPort);
  const lastPortHit = isSanctionedPortCorridor(lastPort);
  if (currentPortHit.hit || lastPortHit.hit) {
    triggeredIds.push('r05');
    evidence['r05'] = `Port call at sanctioned-corridor terminal: ${currentPortHit.port ?? lastPortHit.port}`;
  }

  // R06 — Flag of convenience (registry-backed)
  const flagCheck = isHighRiskFlag(flag);
  if (flagCheck.hit) {
    triggeredIds.push('r06');
    evidence['r06'] = `Flag state ${flagCheck.registry ?? flag}: ${flagCheck.rationale}`;
  }

  // R07 — Charterer on UK OFSI list (registry-backed)
  const chartererUkMatch = lookupEntity(charterer).find((m) =>
    m.entity.lists.includes('UK_OFSI') && m.confidence >= 0.55,
  );
  if (chartererUkMatch) {
    triggeredIds.push('r07');
    evidence['r07'] = `Charterer "${charterer}" matches ${chartererUkMatch.entity.name} on UK OFSI Consolidated list`;
  }

  const rules = RULES_LIBRARY.map((r) => ({
    ...r,
    triggered: triggeredIds.includes(r.id),
    evidence: triggeredIds.includes(r.id) ? evidence[r.id] : undefined,
  }));

  return { rules, triggeredIds };
}

function computeTier(score: number): SanctionsTier {
  if (score >= 80) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 20) return 'watch';
  return 'clear';
}

function buildSummary(vessel: VesselRow, rules: SanctionsRule[], score: number): string {
  const triggered = rules.filter((r) => r.triggered);
  if (triggered.length === 0) {
    return `No direct sanctions exposure detected for ${vessel.name ?? 'this vessel'}. All evaluated ownership chain indicators are clear.`;
  }
  const top = triggered.slice(0, 2).map((r) => r.description.toLowerCase()).join('; ');
  return `Score ${score}/100 — ${triggered.length} rule(s) triggered: ${top}. Review entity network for full ownership chain.`;
}

function buildNetworkFromVessel(vessel: VesselRow, rules: SanctionsRule[]): { nodes: NetworkNode[]; edges: NetworkEdge[] } {
  const flag = (typeof vessel.flagState === 'string' ? vessel.flagState : '') || 'UN';
  const owner = (typeof vessel.registeredOwner === 'string' ? vessel.registeredOwner : '') || 'Unknown Owner';
  const manager = (typeof vessel.shipManager === 'string' ? vessel.shipManager : '') || '';
  const charterer = (typeof vessel.charterer === 'string' ? vessel.charterer : '') || '';
  const ownerSanctioned = rules.some((r) => r.id === 'r01' && r.triggered);
  const managerSanctioned = rules.some((r) => r.id === 'r03' && r.triggered);
  const ownerRisk = ownerSanctioned ? 'critical' : rules.some((r) => r.id === 'r02' && r.triggered) ? 'high' : 'clear';
  const flagRisk = FOC_FLAGS.has(flag) ? 'watch' : 'clear';

  const nodes: NetworkNode[] = [
    {
      id: `v${vessel.id}`,
      type: 'vessel',
      label: vessel.name ?? `Vessel #${vessel.id}`,
      country: flag,
      sanctioned: false,
      riskTier: computeTier(rules.filter((r) => r.triggered).reduce((s, r) => s + r.score, 0)),
      confidence: 1,
      imo: vessel.imoNumber ?? undefined,
    },
    {
      id: `ro${vessel.id}`,
      type: 'registered_owner',
      label: owner,
      country: flag,
      sanctioned: ownerSanctioned,
      sanctionLists: ownerSanctioned ? ['OFAC_SDN'] : undefined,
      riskTier: ownerRisk,
      confidence: 0.9,
    },
    {
      id: `fl${vessel.id}`,
      type: 'flag_state',
      label: `${flag} Flag Registry`,
      country: flag,
      sanctioned: false,
      riskTier: flagRisk,
      confidence: 1,
      details: FOC_FLAGS.has(flag) ? 'Recognised flag-of-convenience jurisdiction' : undefined,
    },
  ];

  const edges: NetworkEdge[] = [
    { source: `v${vessel.id}`, target: `ro${vessel.id}`, type: 'owned_by', label: 'Registered owner', confidence: 0.9 },
    { source: `v${vessel.id}`, target: `fl${vessel.id}`, type: 'flagged_under', label: 'Flag state', confidence: 1 },
  ];

  if (manager) {
    nodes.push({
      id: `sm${vessel.id}`,
      type: 'ship_manager',
      label: manager,
      country: 'UN',
      sanctioned: managerSanctioned,
      sanctionLists: managerSanctioned ? ['EU_CONSOLIDATED'] : undefined,
      riskTier: managerSanctioned ? 'critical' : 'clear',
      confidence: 0.88,
    });
    edges.push({ source: `v${vessel.id}`, target: `sm${vessel.id}`, type: 'managed_by', label: 'Ship manager', confidence: 0.88 });
  }

  if (charterer) {
    const chartererRisk = rules.some((r) => r.id === 'r07' && r.triggered) ? 'watch' : 'clear';
    nodes.push({
      id: `ch${vessel.id}`,
      type: 'charterer',
      label: charterer,
      country: 'UN',
      sanctioned: false,
      riskTier: chartererRisk,
      confidence: 0.78,
    });
    edges.push({ source: `v${vessel.id}`, target: `ch${vessel.id}`, type: 'chartered_to', label: 'Charterer', confidence: 0.78 });
  }

  return { nodes, edges };
}

// Demo network templates retained ONLY for vessel IDs that have no row in the
// registry yet (used by the storyboard/sample-data flow). Real vessels always
// flow through the registry-backed evaluateRules() path above.
const DEMO_OVERRIDES: Record<string, { score: number; nodes: NetworkNode[]; edges: NetworkEdge[]; summary?: string }> = {
  '1': {
    score: 78,
    summary: 'Registered owner Meridian Bulk Holdings Ltd has direct linkage to an OFAC SDN-listed entity via a 62%-owned subsidiary. Flag state (Comoros) is a recognised high-evasion jurisdiction.',
    nodes: [
      { id: 'v1', type: 'vessel', label: 'Pacific Guardian', country: 'KM', sanctioned: false, riskTier: 'high', confidence: 1, imo: '9234567' },
      { id: 'ro1', type: 'registered_owner', label: 'Meridian Bulk Holdings Ltd', country: 'CY', sanctioned: false, riskTier: 'high', confidence: 0.95, details: '62% subsidiary linked to SDN list' },
      { id: 'bo1', type: 'beneficial_owner', label: 'Silk Road Maritime Group', country: 'IR', sanctioned: true, sanctionLists: ['OFAC_SDN'], riskTier: 'critical', confidence: 0.78, details: 'OFAC SDN entry 2023-11-08' },
      { id: 'sm1', type: 'ship_manager', label: 'GlobalShip Management SA', country: 'GR', sanctioned: false, riskTier: 'clear', confidence: 0.99 },
      { id: 'fl1', type: 'flag_state', label: 'Comoros Flag Registry', country: 'KM', sanctioned: false, riskTier: 'watch', confidence: 1, details: 'Flag-of-convenience; elevated evasion risk' },
      { id: 'ch1', type: 'charterer', label: 'Eagle Commodities FZE', country: 'AE', sanctioned: false, riskTier: 'watch', confidence: 0.82 },
    ],
    edges: [
      { source: 'v1', target: 'ro1', type: 'owned_by', label: 'Registered owner', confidence: 0.95 },
      { source: 'ro1', target: 'bo1', type: 'owned_by', label: 'Beneficial interest (62%)', confidence: 0.78, since: '2021-03' },
      { source: 'v1', target: 'sm1', type: 'managed_by', label: 'Technical manager', confidence: 0.99 },
      { source: 'v1', target: 'fl1', type: 'flagged_under', label: 'Flag state', confidence: 1 },
      { source: 'v1', target: 'ch1', type: 'chartered_to', label: 'Time charterer', confidence: 0.82 },
    ],
  },
  '3': {
    score: 91,
    summary: 'CRITICAL: Ship manager directly named on EU Consolidated sanctions list (March 2025). AIS-dark transit in Red Sea. Port call at Bandar Abbas 47 days ago. P&I Club cover withdrawn.',
    nodes: [
      { id: 'v3', type: 'vessel', label: 'Meridian Bulk', country: 'KM', sanctioned: false, riskTier: 'critical', confidence: 1, imo: '9678901' },
      { id: 'ro3', type: 'registered_owner', label: 'Caspian Marine Holdings LLC', country: 'AZ', sanctioned: false, riskTier: 'high', confidence: 0.87 },
      { id: 'sm3', type: 'ship_manager', label: 'Bosphorus Maritime Services', country: 'TR', sanctioned: true, sanctionLists: ['EU_CONSOLIDATED'], riskTier: 'critical', confidence: 0.94 },
      { id: 'cp3', type: 'counterparty', label: 'Black Sea Petroleum Traders', country: 'RU', sanctioned: true, sanctionLists: ['OFAC_SDN', 'EU_CONSOLIDATED', 'UK_OFSI'], riskTier: 'critical', confidence: 0.89 },
      { id: 'fl3', type: 'flag_state', label: 'Comoros Flag Registry', country: 'KM', sanctioned: false, riskTier: 'watch', confidence: 1 },
      { id: 'ins3', type: 'insurer', label: 'Britannia P&I Club', country: 'GB', sanctioned: false, riskTier: 'clear', confidence: 1, details: 'Cover withdrawal notice issued 2026-04-01' },
    ],
    edges: [
      { source: 'v3', target: 'ro3', type: 'owned_by', label: 'Registered owner', confidence: 0.87 },
      { source: 'v3', target: 'sm3', type: 'managed_by', label: 'Ship manager', confidence: 0.94 },
      { source: 'v3', target: 'cp3', type: 'contracted_with', label: 'Cargo counterparty', confidence: 0.89 },
      { source: 'v3', target: 'fl3', type: 'flagged_under', label: 'Flag state', confidence: 1 },
      { source: 'v3', target: 'ins3', type: 'insured_by', label: 'P&I cover (withdrawn)', confidence: 1 },
    ],
  },
};

const DEMO_RULES: Record<string, string[]> = {
  '1': ['r02', 'r04', 'r06'],
  '3': ['r03', 'r04', 'r05', 'r08', 'r09'],
};

router.get('/sanctions/score/:vesselId', authMiddleware(), tenantScope({ required: false }), async (req, res) => {
  try {
    const vesselIdStr = req.params.vesselId ?? '';
    const vesselId = parseInt(vesselIdStr, 10);
    if (Number.isNaN(vesselId)) {
      return sendSuccess(res, { error: 'Invalid vessel ID', score: 0, tier: 'clear', rules: [] });
    }

    let vessel: VesselRow | null = null;
    try {
      const [row] = await db.select().from(vesselsTable).where(eq(vesselsTable.id, vesselId)).limit(1);
      vessel = (row as VesselRow | undefined) ?? null;
    } catch {
    }

    let rules: SanctionsRule[];
    let score: number;
    let networkNodes: NetworkNode[];
    let networkEdges: NetworkEdge[];
    let dataSource: 'live' | 'simulated';
    let summary: string;

    const demoOverride = DEMO_OVERRIDES[vesselIdStr];

    if (vessel) {
      // Always prefer the registry-backed real evaluation when we have a
      // vessel row, even for demo IDs — every signal becomes traceable.
      const result = evaluateRules(vessel);
      rules = result.rules;
      score = Math.min(100, result.rules.filter((r) => r.triggered).reduce((s, r) => s + r.score, 0));
      const network = buildNetworkFromVessel(vessel, rules);
      networkNodes = network.nodes;
      networkEdges = network.edges;
      dataSource = 'live';
      summary = buildSummary(vessel, rules, score);
    } else if (demoOverride && !vessel) {
      const triggeredIds = DEMO_RULES[vesselIdStr] ?? [];
      rules = RULES_LIBRARY.map((r) => ({ ...r, triggered: triggeredIds.includes(r.id) }));
      score = demoOverride.score;
      networkNodes = demoOverride.nodes;
      networkEdges = demoOverride.edges;
      dataSource = 'simulated';
      summary = demoOverride.summary ?? '';
    } else {
      rules = RULES_LIBRARY.map((r) => ({ ...r, triggered: false }));
      score = 0;
      networkNodes = [];
      networkEdges = [];
      dataSource = 'simulated';
      summary = 'Vessel not found in registry. Score defaulted to 0.';
    }

    const tier = computeTier(score);
    if (tier === 'high' || tier === 'critical') {
      const triggeredLists = [...new Set(rules.filter((r) => r.triggered).map((r) => r.list))];
      void pubsub.publish(VESSELS_EVENTS.SANCTIONS_HIT, {
        vesselSanctionsHit: {
          vesselId: String(vesselId),
          vesselName: vessel?.name ?? null,
          imo: (vessel as VesselRow | null)?.imoNumber ?? null,
          matchedLists: triggeredLists.length > 0 ? triggeredLists : ['OFAC SDN'],
          severity: tier,
          detectedAt: new Date().toISOString(),
          notes: summary,
        },
      });
      broadcastWs('vessel-sanctions', 'sanctions-hit', { vesselId, tier, score, detectedAt: new Date().toISOString() });
    }
    return sendSuccess(res, {
      vesselId,
      score,
      tier,
      dataSource,
      computedAt: new Date().toISOString(),
      rules,
      networkNodes,
      networkEdges,
      summary,
    });
  } catch (err) {
    return handleRouteError(res, err, 'Failed to compute sanctions score');
  }
});

router.get('/sanctions/portfolio', authMiddleware(), tenantScope({ required: false }), async (req, res) => {
  try {
    let vessels: VesselRow[] = [];
    try {
      vessels = (await db.select().from(vesselsTable).limit(50)) as VesselRow[];
    } catch {
    }

    const holdings = vessels.map((vessel) => {
      // Mirror the score endpoint: live DB row always wins over the demo
      // template; demo only fires when there is no row whatsoever.
      const result = evaluateRules(vessel);
      const score = Math.min(
        100,
        result.rules.filter((r) => r.triggered).reduce((s, r) => s + r.score, 0),
      );
      const tier = computeTier(score);
      const dataSource: 'live' | 'simulated' = 'live';
      const { nodes } = buildNetworkFromVessel(vessel, result.rules);
      const sanctionedNetworkNodes = nodes.filter((n) => n.sanctioned).length;

      return {
        vesselId: vessel.id,
        vesselName: vessel.name ?? `Vessel #${vessel.id}`,
        imo: vessel.imoNumber ?? '',
        flag: typeof vessel.flagState === 'string' ? vessel.flagState : 'UN',
        score,
        tier,
        dataSource,
        sanctionedNetworkNodes,
        lastUpdated: new Date().toISOString(),
      };
    });

    return sendSuccess(res, { holdings, computedAt: new Date().toISOString(), totalVessels: holdings.length });
  } catch (err) {
    return handleRouteError(res, err, 'Failed to compute portfolio sanctions heat');
  }
});

router.get('/sanctions/network/:vesselId', authMiddleware(), tenantScope({ required: false }), async (req, res) => {
  try {
    const vesselIdStr = req.params.vesselId ?? '';
    const vesselId = parseInt(vesselIdStr, 10);
    if (Number.isNaN(vesselId)) return sendNotFound(res, 'Vessel');

    // Live DB row always wins; demo template only when there is no row.
    let vessel: VesselRow | null = null;
    try {
      const [row] = await db.select().from(vesselsTable).where(eq(vesselsTable.id, vesselId)).limit(1);
      vessel = (row as VesselRow | undefined) ?? null;
    } catch {
    }

    if (vessel) {
      const { rules } = evaluateRules(vessel);
      const { nodes, edges } = buildNetworkFromVessel(vessel, rules);
      return sendSuccess(res, { vesselId, networkNodes: nodes, networkEdges: edges, computedAt: new Date().toISOString(), dataSource: 'live' });
    }

    const demoOverride = DEMO_OVERRIDES[vesselIdStr];
    if (demoOverride) {
      return sendSuccess(res, {
        vesselId,
        networkNodes: demoOverride.nodes,
        networkEdges: demoOverride.edges,
        computedAt: new Date().toISOString(),
        dataSource: 'simulated',
      });
    }

    return sendNotFound(res, 'Vessel');
  } catch (err) {
    return handleRouteError(res, err, 'Failed to fetch vessel network');
  }
});

const publishHitsSchema = z.object({
  vesselId: z.union([z.string(), z.number()]),
  vesselName: z.string().optional(),
  score: z.number().min(0).max(100),
  tier: z.enum(['clear', 'watch', 'high', 'critical']),
  triggeredRules: z.array(z.string()).optional(),
});

router.post('/sanctions/publish-hits', authMiddleware(), async (req, res) => {
  try {
    const body = publishHitsSchema.parse(req.body);
    const { vesselId, vesselName, score, tier, triggeredRules } = body;

    const alertPayload = {
      id: `sanctions-hit-${vesselId}-${Date.now()}`,
      type: 'sanctions_match' as const,
      severity: tier === 'critical' ? 'critical' : tier === 'high' ? 'high' : 'watch',
      title: `Sanctions Exposure: ${tier.toUpperCase()} (score ${score})`,
      description: `Vessel ${vesselName ?? vesselId} sanctions exposure score reached ${score}/100 (${tier} tier). Triggered rules: ${(triggeredRules ?? []).join(', ') || 'none'}.`,
      vesselId: String(vesselId),
      vesselName: vesselName ?? String(vesselId),
      triggeredAt: new Date().toISOString(),
      counselMatterCandidate: score >= 85,
    };

    broadcastWs('vessel-positions', 'sanctions-hit', alertPayload);
    void pubsub.publish(VESSELS_EVENTS.SANCTIONS_HIT, { vesselSanctionsHit: alertPayload });

    const counselMatterOpened = score >= 85;
    if (counselMatterOpened) {
      void pubsub.publish(VESSELS_EVENTS.SANCTIONS_HIT, {
        vesselSanctionsHit: { ...alertPayload, counselAction: 'auto_open_matter' },
      });
    }

    return sendSuccess(res, {
      published: true,
      alert: alertPayload,
      counselMatterOpened,
      publishedTo: ['vessel-positions:sanctions-hit', VESSELS_EVENTS.SANCTIONS_HIT],
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return sendSuccess(res, { published: false, error: 'Validation failed', issues: err.issues });
    }
    return handleRouteError(res, err, 'Failed to publish sanctions hits');
  }
});

export default router;
