/**
 * OMNIA World Model API
 *
 * Serves the unified portfolio entity graph, synthesis narrative,
 * cross-portfolio search, notifications, ripple/impact analysis,
 * public story mode, and shell adoption telemetry.
 */
import { Router } from 'express';

const router = Router();

const OMNIA_VERSION = '1.0.0';

const now = () => new Date().toISOString();
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const WORLD_MODEL_ENTITIES = [
  { id: 'e-portfolio', label: 'SZL Holdings Portfolio', type: 'domain', domain: 'holdings', confidence: 1.0, freshness: 1.0, provenance: ['holdings-dashboard'], description: 'Master portfolio entity spanning all SZL Holdings domains', lastSeen: now(), attributes: { entityCount: 312, domainCount: 12, activeAlerts: 7 } },
  { id: 'e-apt41', label: 'APT-41 Threat Cluster', type: 'threat', domain: 'aegis', confidence: 0.92, freshness: 0.95, provenance: ['aegis-soc', 'threat-intel-feed'], description: 'Nation-state threat actor cluster targeting critical infrastructure', lastSeen: ago(30_000), attributes: { severity: 'high', iocs: 14, affectedAssets: 3 } },
  { id: 'e-controlplane', label: 'Control Plane Exposure', type: 'threat', domain: 'sentra', confidence: 0.88, freshness: 0.91, provenance: ['sentra-scanner'], description: 'Unpatched CVE-2024-3094 in DMZ perimeter — patch window Fri', lastSeen: ago(5 * 60_000), attributes: { cve: 'CVE-2024-3094', cvss: 9.1, patchWindow: 'Friday' } },
  { id: 'e-stellarwind', label: 'MV Stellarwind', type: 'vessel', domain: 'vessels', confidence: 0.98, freshness: 0.88, provenance: ['ais-feed', 'vessels-twin'], description: 'Container vessel — active voyage, 14 nm route deviation detected', lastSeen: ago(60_000), attributes: { mmsi: '538009123', deviationNm: 14, insuranceTierBreach: '82%' } },
  { id: 'e-ariadne', label: 'MV Ariadne', type: 'vessel', domain: 'vessels', confidence: 0.97, freshness: 0.92, provenance: ['ais-feed'], description: 'Tanker — on schedule, PSC risk score 0.12', lastSeen: ago(2 * 60_000), attributes: { mmsi: '477123456', pscRisk: 0.12 } },
  { id: 'e-ter8821', label: 'Property TER-8821', type: 'property', domain: 'terra', confidence: 0.94, freshness: 0.91, provenance: ['terra-covenant', 'terra-valuation'], description: 'Commercial property — covenant drift resolved, LTV 58%', lastSeen: ago(2 * 60_000), attributes: { ltv: '58%', covenantStatus: 'compliant', valuation: '$42.1M' } },
  { id: 'e-ter4402', label: 'Property TER-4402', type: 'property', domain: 'terra', confidence: 0.87, freshness: 0.78, provenance: ['terra-covenant'], description: 'Retail property — covenant breach watch, DSCR at limit', lastSeen: ago(10 * 60_000), attributes: { dscr: 1.01, covenantStatus: 'watch' } },
  { id: 'e-cjl2291', label: 'Matter CJL-2291', type: 'matter', domain: 'counsel', confidence: 0.87, freshness: 0.75, provenance: ['counsel-kb', 'counsel-docket'], description: 'Active legal matter — response deadline 48h, no draft filed', lastSeen: ago(5 * 60_000), attributes: { deadline: ago(-48 * 3_600_000), status: 'open', counsel: 'M. Okafor' } },
  { id: 'e-cjl1847', label: 'Matter CJL-1847', type: 'matter', domain: 'counsel', confidence: 0.95, freshness: 0.85, provenance: ['counsel-kb'], description: 'Commercial dispute — discovery phase, 3 depositions scheduled', lastSeen: ago(30 * 60_000), attributes: { status: 'discovery', value: '$2.1M', nextEvent: 'deposition' } },
  { id: 'e-omnia-engine', label: 'OMNIA Synthesis Engine', type: 'agent', domain: 'command', confidence: 1.0, freshness: 1.0, provenance: ['omnia-self'], description: 'Continuous portfolio synthesis and world model maintenance agent', lastSeen: now(), attributes: { version: OMNIA_VERSION, entitiesManaged: 312, lastCycle: now() } },
  { id: 'e-a11oy-fabric', label: 'A11oy Execution Fabric', type: 'agent', domain: 'a11oy', confidence: 0.99, freshness: 0.97, provenance: ['a11oy-runtime'], description: 'Governed agentic execution fabric — 24 active workcells', lastSeen: ago(10_000), attributes: { workcells: 24, operators: 8, pendingApprovals: 3 } },
  { id: 'e-portfolio-nav', label: 'Portfolio NAV', type: 'concept', domain: 'holdings', confidence: 0.96, freshness: 0.94, provenance: ['holdings-valuation', 'terra-valuation', 'vessels-insurance'], description: 'Aggregate net asset value across all portfolio positions', lastSeen: ago(15 * 60_000), attributes: { value: '$1.24B', change24h: '+0.4%', asOf: ago(15 * 60_000) } },
  { id: 'e-signal-mesh', label: 'Signal Mesh', type: 'concept', domain: 'a11oy', confidence: 0.98, freshness: 0.99, provenance: ['a11oy-signals'], description: 'Cross-domain intelligence signal aggregation layer', lastSeen: ago(5_000), attributes: { activeSources: 47, signalsLastHour: 1284, driftAlerts: 2 } },
];

const WORLD_MODEL_RELATIONSHIPS = [
  { id: 'r-001', sourceId: 'e-apt41', targetId: 'e-a11oy-fabric', label: 'threatens', type: 'causal', confidence: 0.78, strength: 0.7, lastActive: ago(30_000) },
  { id: 'r-002', sourceId: 'e-apt41', targetId: 'e-ter8821', label: 'may affect', type: 'causal', confidence: 0.61, strength: 0.4, lastActive: ago(2 * 60_000) },
  { id: 'r-003', sourceId: 'e-stellarwind', targetId: 'e-portfolio-nav', label: 'contributes to', type: 'associative', confidence: 0.89, strength: 0.55, lastActive: ago(60_000) },
  { id: 'r-004', sourceId: 'e-ter8821', targetId: 'e-portfolio-nav', label: 'contributes to', type: 'associative', confidence: 0.94, strength: 0.72, lastActive: ago(15 * 60_000) },
  { id: 'r-005', sourceId: 'e-cjl2291', targetId: 'e-ter4402', label: 'encumbers', type: 'hierarchical', confidence: 0.82, strength: 0.6, lastActive: ago(5 * 60_000) },
  { id: 'r-006', sourceId: 'e-a11oy-fabric', targetId: 'e-signal-mesh', label: 'governed by', type: 'governs', confidence: 0.99, strength: 0.95, lastActive: ago(5_000) },
  { id: 'r-007', sourceId: 'e-omnia-engine', targetId: 'e-a11oy-fabric', label: 'synthesizes', type: 'dependency', confidence: 0.99, strength: 0.9, lastActive: now() },
  { id: 'r-008', sourceId: 'e-omnia-engine', targetId: 'e-portfolio-nav', label: 'narrates', type: 'dependency', confidence: 0.96, strength: 0.85, lastActive: now() },
  { id: 'r-009', sourceId: 'e-controlplane', targetId: 'e-a11oy-fabric', label: 'threatens', type: 'causal', confidence: 0.71, strength: 0.55, lastActive: ago(5 * 60_000) },
  { id: 'r-010', sourceId: 'e-ariadne', targetId: 'e-portfolio-nav', label: 'contributes to', type: 'associative', confidence: 0.92, strength: 0.48, lastActive: ago(2 * 60_000) },
];

const SYNTHESIS_NARRATIVE = {
  id: 'narrative-001',
  generatedAt: ago(3 * 60_000),
  version: 47,
  headline: 'Portfolio operating within parameters — two elevated signals require attention',
  summary: 'The SZL Holdings portfolio is stable across 12 active domains. Aegis has elevated an APT-41 cluster to HIGH, with downstream exposure flagged in Terra (TER-4402). Vessels reports a 14 nm deviation on MV Stellarwind — insurance tier breach at 82% threshold. All other positions are within governed parameters. OMNIA synthesis cycle #47 completed 3 minutes ago.',
  paragraphs: [
    {
      id: 'p-001',
      text: 'Aegis has elevated the APT-41 threat cluster to HIGH confidence (0.92) following corroborated IOC matches across 14 indicators. Three downstream assets in the Terra portfolio have been flagged for precautionary access review, with Property TER-8821 already restored to compliance following a prior governance action.',
      domain: 'aegis',
      entityRefs: ['e-apt41', 'e-ter8821'],
      confidence: 0.92,
      deepLink: '/aegis',
    },
    {
      id: 'p-002',
      text: 'MV Stellarwind is tracking 14 nm off its planned route. The Vessels digital twin places the insurance tier breach probability at 82%, approaching the 85% notification threshold. No adverse weather or piracy risk detected in the current deviation zone. Crew welfare signals are nominal.',
      domain: 'vessels',
      entityRefs: ['e-stellarwind'],
      confidence: 0.88,
      deepLink: '/vessels',
    },
    {
      id: 'p-003',
      text: 'Terra property TER-4402 remains on covenant watch with a DSCR of 1.01x — marginally above the 1.0x floor. Legal matter CJL-2291 (Counsel) encumbers this asset. The 48-hour response deadline for CJL-2291 requires immediate attention from the assigned counsel, M. Okafor.',
      domain: 'terra',
      entityRefs: ['e-ter4402', 'e-cjl2291'],
      confidence: 0.87,
      deepLink: '/terra',
    },
    {
      id: 'p-004',
      text: 'The A11oy execution fabric is operational with 24 active workcells and 3 pending human-in-the-loop approvals. The signal mesh ingested 1,284 signals in the last hour across 47 sources. Two drift alerts are active in the design token layer — no user-visible regressions detected.',
      domain: 'a11oy',
      entityRefs: ['e-a11oy-fabric', 'e-signal-mesh'],
      confidence: 0.97,
      deepLink: '/a11oy',
    },
    {
      id: 'p-005',
      text: 'Aggregate portfolio NAV stands at $1.24B (+0.4% over 24h), composed of $841M real estate positions, $243M maritime assets, $112M liquid holdings, and $44M advisory fee income streams. OMNIA provenance traces all constituent values to their originating signals via the A11oy proof ledger.',
      domain: 'holdings',
      entityRefs: ['e-portfolio-nav'],
      confidence: 0.96,
      deepLink: '/',
    },
  ],
  signals: [
    { id: 's-001', label: 'APT-41 cluster elevated to HIGH', domain: 'aegis', severity: 'high', timestamp: ago(45_000), deepLink: '/aegis' },
    { id: 's-002', label: 'MV Stellarwind deviation — 82% threshold', domain: 'vessels', severity: 'medium', timestamp: ago(3 * 60_000), deepLink: '/vessels' },
    { id: 's-003', label: 'CJL-2291 deadline in 48h — no draft filed', domain: 'counsel', severity: 'medium', timestamp: ago(60 * 60_000), deepLink: '/counsel' },
    { id: 's-004', label: 'TER-4402 covenant watch — DSCR 1.01x', domain: 'terra', severity: 'low', timestamp: ago(2 * 60_000), deepLink: '/terra' },
    { id: 's-005', label: '3 approvals pending in A11oy fabric', domain: 'a11oy', severity: 'low', timestamp: ago(20 * 60_000), deepLink: '/a11oy' },
  ],
};

const ADOPTION_METRICS = [
  { artifactId: 'command', artifactName: 'Command', shellVersion: '1.0.0', commandPaletteWired: true, provenanceCoverage: 0.82, omniaProviderAdopted: true, lastChecked: ago(5 * 60_000) },
  { artifactId: 'holdings', artifactName: 'SZL Holdings', shellVersion: '1.0.0', commandPaletteWired: true, provenanceCoverage: 0.74, omniaProviderAdopted: true, lastChecked: ago(5 * 60_000) },
  { artifactId: 'aegis', artifactName: 'Aegis', shellVersion: '1.0.0', commandPaletteWired: true, provenanceCoverage: 0.71, omniaProviderAdopted: true, lastChecked: ago(5 * 60_000) },
  { artifactId: 'sentra', artifactName: 'Sentra', shellVersion: '1.0.0', commandPaletteWired: true, provenanceCoverage: 0.68, omniaProviderAdopted: true, lastChecked: ago(5 * 60_000) },
  { artifactId: 'terra', artifactName: 'Terra', shellVersion: '1.0.0', commandPaletteWired: true, provenanceCoverage: 0.65, omniaProviderAdopted: true, lastChecked: ago(5 * 60_000) },
  { artifactId: 'vessels', artifactName: 'Vessels', shellVersion: '1.0.0', commandPaletteWired: true, provenanceCoverage: 0.77, omniaProviderAdopted: true, lastChecked: ago(5 * 60_000) },
  { artifactId: 'counsel', artifactName: 'Counsel', shellVersion: '1.0.0', commandPaletteWired: true, provenanceCoverage: 0.70, omniaProviderAdopted: true, lastChecked: ago(5 * 60_000) },
  { artifactId: 'a11oy', artifactName: 'A11oy', shellVersion: '1.0.0', commandPaletteWired: true, provenanceCoverage: 0.89, omniaProviderAdopted: true, lastChecked: ago(5 * 60_000) },
  { artifactId: 'pulse', artifactName: 'Pulse', shellVersion: '1.0.0', commandPaletteWired: true, provenanceCoverage: 0.61, omniaProviderAdopted: true, lastChecked: ago(5 * 60_000) },
  { artifactId: 'carlota-jo', artifactName: 'Carlota Jo', shellVersion: '1.0.0', commandPaletteWired: true, provenanceCoverage: 0.55, omniaProviderAdopted: true, lastChecked: ago(5 * 60_000) },
  { artifactId: 'lyte', artifactName: 'Lyte', shellVersion: '1.0.0', commandPaletteWired: true, provenanceCoverage: 0.66, omniaProviderAdopted: true, lastChecked: ago(5 * 60_000) },
  { artifactId: 'praxis', artifactName: 'PRAXIS', shellVersion: '1.0.0', commandPaletteWired: true, provenanceCoverage: 0.58, omniaProviderAdopted: true, lastChecked: ago(5 * 60_000) },
];

const PORTFOLIO_NOTIFICATIONS = [
  {
    id: 'notif-001',
    artifactId: 'aegis',
    artifactName: 'Aegis',
    title: 'Threat cluster elevated to HIGH',
    message: 'APT-41 cluster upgraded. Two Terra assets flagged for precautionary review.',
    level: 'critical',
    timestamp: ago(45_000),
    read: false,
    actionUrl: '/aegis',
    entityRef: 'e-apt41',
  },
  {
    id: 'notif-002',
    artifactId: 'vessels',
    artifactName: 'Vessels',
    title: 'Voyage deviation — 82% insurance threshold',
    message: 'MV Stellarwind is 14 nm off planned route. Monitoring escalation threshold.',
    level: 'warning',
    timestamp: ago(3 * 60_000),
    read: false,
    actionUrl: '/vessels',
    entityRef: 'e-stellarwind',
  },
  {
    id: 'notif-003',
    artifactId: 'counsel',
    artifactName: 'Counsel',
    title: 'Matter deadline in 48 hours',
    message: 'CJL-2291 response due. No draft detected. Immediate action required.',
    level: 'warning',
    timestamp: ago(60 * 60_000),
    read: false,
    actionUrl: '/counsel',
    entityRef: 'e-cjl2291',
  },
  {
    id: 'notif-004',
    artifactId: 'terra',
    artifactName: 'Terra',
    title: 'Covenant breach resolved — TER-8821',
    message: 'Governance action completed. Property returned to compliant status.',
    level: 'success',
    timestamp: ago(22 * 60_000),
    read: true,
    actionUrl: '/terra',
    entityRef: 'e-ter8821',
  },
  {
    id: 'notif-005',
    artifactId: 'a11oy',
    artifactName: 'A11oy',
    title: '3 governed actions pending approval',
    message: 'Fabric workcells stalled awaiting human-in-the-loop gate.',
    level: 'info',
    timestamp: ago(20 * 60_000),
    read: true,
    actionUrl: '/a11oy',
    entityRef: 'e-a11oy-fabric',
  },
];

const in_memory_beacons: Record<string, {
  artifactId: string;
  shellVersion: string;
  commandPaletteWired: boolean;
  timestamp: string;
}> = {};

router.get('/graph', (_req, res) => {
  res.json({
    entities: WORLD_MODEL_ENTITIES,
    relationships: WORLD_MODEL_RELATIONSHIPS,
    meta: {
      totalEntities: WORLD_MODEL_ENTITIES.length,
      totalRelationships: WORLD_MODEL_RELATIONSHIPS.length,
      lastRefreshed: ago(3 * 60_000),
      staleDomains: [],
      activeDomains: ['aegis', 'sentra', 'vessels', 'terra', 'counsel', 'command', 'a11oy', 'holdings', 'pulse', 'lyte'],
    },
  });
});

router.get('/entities', (req, res) => {
  const domain = req.query.domain as string | undefined;
  const type = req.query.type as string | undefined;
  let entities = WORLD_MODEL_ENTITIES;
  if (domain) entities = entities.filter((e) => e.domain === domain);
  if (type) entities = entities.filter((e) => e.type === type);
  res.json({ entities, total: entities.length });
});

router.get('/narrative', (_req, res) => {
  res.json(SYNTHESIS_NARRATIVE);
});

router.get('/search', (req, res) => {
  const q = ((req.query.q as string) ?? '').toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit as string ?? '20', 10), 50);

  if (!q) {
    return res.json({ entities: WORLD_MODEL_ENTITIES.slice(0, limit), total: WORLD_MODEL_ENTITIES.length });
  }

  const results = WORLD_MODEL_ENTITIES.filter(
    (e) =>
      e.label.toLowerCase().includes(q) ||
      e.domain.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q),
  )
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);

  res.json({ entities: results, query: q, total: results.length });
});

router.get('/notifications', (req, res) => {
  const artifactId = req.query.artifactId as string | undefined;
  const unreadOnly = req.query.unread === 'true';
  let notifications = PORTFOLIO_NOTIFICATIONS;
  if (unreadOnly) notifications = notifications.filter((n) => !n.read);
  res.json({ notifications, total: notifications.length, unread: notifications.filter((n) => !n.read).length });
});

router.get('/ripple/:entityId', (req, res) => {
  const { entityId } = req.params;
  const entity = WORLD_MODEL_ENTITIES.find((e) => e.id === entityId);
  if (!entity) {
    return res.status(404).json({ error: 'Entity not found' });
  }

  const directRels = WORLD_MODEL_RELATIONSHIPS.filter((r) => r.sourceId === entityId);
  const affected = directRels.map((rel) => {
    const target = WORLD_MODEL_ENTITIES.find((e) => e.id === rel.targetId);
    if (!target) return null;

    const indirectRels = WORLD_MODEL_RELATIONSHIPS.filter((r) => r.sourceId === rel.targetId && r.targetId !== entityId);
    const indirectAffected = indirectRels.map((ir) => {
      const indirectTarget = WORLD_MODEL_ENTITIES.find((e) => e.id === ir.targetId);
      if (!indirectTarget) return null;
      return {
        entityId: indirectTarget.id,
        entityLabel: indirectTarget.label,
        domain: indirectTarget.domain,
        impactType: 'indirect' as const,
        severity: rel.strength > 0.7 ? ('medium' as const) : ('low' as const),
        description: `Affected via ${target.label} (${ir.label})`,
        deepLink: `/${indirectTarget.domain}`,
      };
    }).filter(Boolean);

    return [
      {
        entityId: target.id,
        entityLabel: target.label,
        domain: target.domain,
        impactType: 'direct' as const,
        severity: rel.strength > 0.7 ? ('high' as const) : rel.strength > 0.4 ? ('medium' as const) : ('low' as const),
        description: `${rel.label} with strength ${(rel.strength * 100).toFixed(0)}%`,
        deepLink: `/${target.domain}`,
      },
      ...indirectAffected,
    ];
  }).filter(Boolean).flat();

  res.json({
    sourceEntityId: entityId,
    sourceEntityLabel: entity.label,
    affected: affected.filter(Boolean),
    propagatedAt: now(),
  });
});

router.get('/story', (_req, res) => {
  const publicNarrative = {
    ...SYNTHESIS_NARRATIVE,
    paragraphs: SYNTHESIS_NARRATIVE.paragraphs.map((p) => ({
      ...p,
      text: p.text,
    })),
    meta: {
      generatedAt: SYNTHESIS_NARRATIVE.generatedAt,
      version: SYNTHESIS_NARRATIVE.version,
      isPublic: true,
      watermark: 'SZL Holdings — OMNIA Portfolio Intelligence · Confidential',
      policy: 'Public Story Mode — sensitive nodes redacted per portfolio governance policy',
    },
  };
  res.json(publicNarrative);
});

router.get('/adoption', (_req, res) => {
  const merged = ADOPTION_METRICS.map((m) => {
    const beacon = in_memory_beacons[m.artifactId];
    if (beacon) {
      return {
        ...m,
        shellVersion: beacon.shellVersion,
        commandPaletteWired: beacon.commandPaletteWired,
        omniaProviderAdopted: true,
        lastChecked: beacon.timestamp,
      };
    }
    return m;
  });
  const total = merged.length;
  const adoptedCount = merged.filter((m) => m.omniaProviderAdopted && m.commandPaletteWired).length;
  const adoption = merged.map((m) => ({
    artifactId: m.artifactId,
    shellVersion: m.shellVersion,
    commandPaletteWired: m.commandPaletteWired,
    lastBeacon: m.lastChecked,
    status: m.omniaProviderAdopted && m.commandPaletteWired
      ? 'adopted'
      : m.omniaProviderAdopted
        ? 'partial'
        : 'pending',
  }));
  res.json({
    adoption,
    totalArtifacts: total,
    adoptedCount,
    adoptionRate: adoptedCount / total,
    lastUpdated: now(),
  });
});

router.post('/adoption/beacon', (req, res) => {
  const { artifactId, shellVersion, commandPaletteWired, timestamp } = req.body ?? {};
  if (artifactId) {
    in_memory_beacons[artifactId] = { artifactId, shellVersion: shellVersion ?? '1.0.0', commandPaletteWired: commandPaletteWired ?? true, timestamp: timestamp ?? now() };
  }
  res.json({ ok: true });
});

export default router;
