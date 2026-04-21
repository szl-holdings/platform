/**
 * Correlation Map
 *
 * Returns entity relationship graph data — nodes (entities across domains)
 * and edges (correlations/connections) for rendering as an interactive
 * network diagram in the Command Portal.
 *
 * Routes:
 *   GET /correlation-map          — full graph data (nodes + edges)
 *   GET /correlation-map/live     — live-updating snapshot with scoring
 */

import {
  db,
  firestormAlertsTable,
  firestormIncidentsTable,
  fundNavRecordsTable,
  holdingsVenturesTable,
  kgEntities,
  kgRelationships,
  pcMattersTable,
  terraDistressPropertiesTable,
  vesselsAlertsTable,
  vesselsEventsTable,
} from '@szl-holdings/db';
import { and, desc, eq, ne, sql } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { logger } from '../lib/logger';
import { authMiddleware } from '../middlewares/auth';
import { perUserApiSlidingLimiter } from '../middlewares/sliding-window-limiter';

const router: IRouter = Router();

interface GraphNode {
  id: string;
  label: string;
  type: 'domain' | 'entity' | 'signal';
  domain: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  value?: number;
  description?: string;
  live?: boolean;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  strength: number;
  type: 'causal' | 'correlative' | 'escalation' | 'dependency';
  description: string;
  lastActive: number;
}

interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  criticalNodes: number;
  highNodes: number;
  activeEdges: number;
  strongCorrelations: number;
  generatedAt: number;
  liveEntities?: number;
}

interface KgEntityRow {
  id: string;
  name: string;
  entityType: string;
  domain: string;
  description: string | null;
  confidence: number | null;
}

interface KgRelationshipRow {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  relationshipType: string;
  strength: number | null;
  fromDomain: string;
  toDomain: string;
  isCrossDomain: boolean | null;
}

interface LiveEntityData {
  criticalIncident: { title: string; id: number } | null;
  openIncidentCount: number;
  criticalAlertCount: number;
  vesselHighAlertCount: number;
  vesselDelayTitle: string | null;
  distressCount: number;
  distressRecentAddress: string | null;
  prismOpenMatters: number;
  prismLowHealthMatters: number;
  prismRecentMatterTitle: string | null;
  holdingsActiveVentures: number;
  holdingsTotalVentures: number;
  holdingsSunsetVentures: number;
  holdingsLatestNavCents: number | null;
  kgEntityNodes: KgEntityRow[];
  kgEdges: KgRelationshipRow[];
}

async function fetchLiveEntityData(): Promise<LiveEntityData> {
  const [
    incidents,
    alerts,
    vesselAlerts,
    vesselDelays,
    distress,
    matterRows,
    ventureRows,
    navRows,
    entityRows,
    edgeRows,
  ] = await Promise.all([
    db
      .select({
        id: firestormIncidentsTable.id,
        title: firestormIncidentsTable.title,
        severity: firestormIncidentsTable.severity,
      })
      .from(firestormIncidentsTable)
      .where(ne(firestormIncidentsTable.status, 'closed'))
      .orderBy(desc(firestormIncidentsTable.createdAt))
      .limit(5),
    db
      .select({ severity: firestormAlertsTable.severity })
      .from(firestormAlertsTable)
      .where(
        and(
          ne(firestormAlertsTable.status, 'resolved'),
          ne(firestormAlertsTable.status, 'dismissed'),
        ),
      )
      .limit(30),
    db
      .select({ severity: vesselsAlertsTable.severity })
      .from(vesselsAlertsTable)
      .where(ne(vesselsAlertsTable.status, 'resolved'))
      .limit(20),
    db
      .select({ title: vesselsEventsTable.title })
      .from(vesselsEventsTable)
      .where(
        and(
          eq(vesselsEventsTable.eventType, 'delay_event'),
          ne(vesselsEventsTable.status, 'resolved'),
        ),
      )
      .orderBy(desc(vesselsEventsTable.id))
      .limit(3),
    db
      .select({
        address: terraDistressPropertiesTable.address,
        borough: terraDistressPropertiesTable.borough,
      })
      .from(terraDistressPropertiesTable)
      .where(eq(terraDistressPropertiesTable.isActive, true))
      .limit(20),
    db
      .select({
        title: pcMattersTable.title,
        status: pcMattersTable.status,
        healthScore: pcMattersTable.healthScore,
      })
      .from(pcMattersTable)
      .where(sql`${pcMattersTable.status} NOT IN ('closed', 'archived')`)
      .orderBy(desc(pcMattersTable.updatedAt))
      .limit(50),
    db.select({ status: holdingsVenturesTable.status }).from(holdingsVenturesTable).limit(100),
    db
      .select({ totalNavCents: fundNavRecordsTable.totalNavCents })
      .from(fundNavRecordsTable)
      .orderBy(desc(fundNavRecordsTable.navDate))
      .limit(1),
    db
      .select({
        id: kgEntities.id,
        name: kgEntities.name,
        entityType: kgEntities.entityType,
        domain: kgEntities.domain,
        description: kgEntities.description,
        confidence: kgEntities.confidence,
      })
      .from(kgEntities)
      .where(eq(kgEntities.isActive, true))
      .orderBy(desc(kgEntities.updatedAt))
      .limit(20),
    db
      .select({
        id: kgRelationships.id,
        fromEntityId: kgRelationships.fromEntityId,
        toEntityId: kgRelationships.toEntityId,
        relationshipType: kgRelationships.relationshipType,
        strength: kgRelationships.strength,
        fromDomain: kgRelationships.fromDomain,
        toDomain: kgRelationships.toDomain,
        isCrossDomain: kgRelationships.isCrossDomain,
      })
      .from(kgRelationships)
      .orderBy(desc(kgRelationships.updatedAt))
      .limit(30),
  ]);

  const criticalIncident = incidents.find((i) => i.severity === 'critical') ?? incidents[0] ?? null;

  return {
    criticalIncident: criticalIncident
      ? { title: criticalIncident.title, id: criticalIncident.id }
      : null,
    openIncidentCount: incidents.length,
    criticalAlertCount: alerts.filter((a) => a.severity === 'critical' || a.severity === 'high')
      .length,
    vesselHighAlertCount: vesselAlerts.filter(
      (a) => a.severity === 'high' || a.severity === 'critical',
    ).length,
    vesselDelayTitle: vesselDelays[0]?.title ?? null,
    distressCount: distress.length,
    distressRecentAddress: distress[0]?.address ?? null,
    prismOpenMatters: matterRows.length,
    prismLowHealthMatters: matterRows.filter(
      (m) => typeof m.healthScore === 'number' && m.healthScore < 60,
    ).length,
    prismRecentMatterTitle: matterRows[0]?.title ?? null,
    holdingsActiveVentures: ventureRows.filter(
      (v) => v.status === 'active' || v.status === 'growth',
    ).length,
    holdingsTotalVentures: ventureRows.length,
    holdingsSunsetVentures: ventureRows.filter((v) => v.status === 'sunset').length,
    holdingsLatestNavCents: navRows[0]?.totalNavCents ?? null,
    kgEntityNodes: entityRows,
    kgEdges: edgeRows,
  };
}

/**
 * Map KG entity confidence to a graph severity for visual display.
 */
function kgConfidenceToSeverity(confidence: number | null): GraphNode['severity'] | undefined {
  if (confidence == null) return undefined;
  if (confidence >= 0.9) return 'critical';
  if (confidence >= 0.7) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

function buildGraph(live?: LiveEntityData) {
  const hasKgData = live && live.kgEntityNodes.length > 0;
  const liveEntitiesCount = live
    ? (live.criticalIncident ? 1 : 0) +
      (live.vesselHighAlertCount > 0 ? 1 : 0) +
      (live.distressCount > 0 ? 1 : 0) +
      live.kgEntityNodes.length
    : 0;

  const nodes: GraphNode[] = [
    {
      id: 'domain-vessels',
      label: 'SEXTANT',
      type: 'domain',
      domain: 'vessels',
      value: live ? Math.min(1, 0.3 + live.vesselHighAlertCount * 0.1) : 0.75,
      description: 'Maritime intelligence & fleet tracking',
    },
    {
      id: 'domain-aegis',
      label: 'PARAGON',
      type: 'domain',
      domain: 'aegis',
      severity: live?.openIncidentCount ? 'critical' : 'high',
      value: live
        ? Math.min(1, 0.5 + live.openIncidentCount * 0.1 + live.criticalAlertCount * 0.05)
        : 0.91,
      description: 'Cyber security operations',
    },
    {
      id: 'domain-terra',
      label: 'DOMAINE',
      type: 'domain',
      domain: 'terra',
      severity: live?.distressCount ? (live.distressCount >= 10 ? 'high' : 'medium') : 'high',
      value: live ? Math.min(1, 0.3 + live.distressCount * 0.02) : 0.68,
      description: 'Real estate intelligence',
    },
    {
      id: 'domain-prism',
      label: 'PRISM',
      type: 'domain',
      domain: 'prism',
      severity: live && live.prismLowHealthMatters >= 3 ? 'critical' : 'high',
      value: live
        ? Math.min(1, 0.4 + live.prismOpenMatters * 0.02 + live.prismLowHealthMatters * 0.03)
        : 0.72,
      description: live
        ? `Legal & counsel operations — ${live.prismOpenMatters} open matter(s), ${live.prismLowHealthMatters} low-health`
        : 'Legal & counsel operations',
    },
    {
      id: 'domain-lyte',
      label: 'KORA',
      type: 'domain',
      domain: 'lyte',
      value: 0.35,
      description: 'Infrastructure & observability',
    },
    {
      id: 'domain-holdings',
      label: 'Holdings',
      type: 'domain',
      domain: 'szl-holdings',
      severity: live && live.holdingsSunsetVentures > 0 ? 'high' : 'medium',
      value: live
        ? Math.min(1, 0.4 + live.openIncidentCount * 0.05 + live.holdingsSunsetVentures * 0.05)
        : 0.62,
      description: live
        ? `Portfolio & fund management — ${live.holdingsActiveVentures}/${live.holdingsTotalVentures} active venture(s)${live.holdingsSunsetVentures > 0 ? `, ${live.holdingsSunsetVentures} sunset` : ''}`
        : 'Portfolio & fund management',
    },
    {
      id: 'domain-carlota',
      label: 'Carlota Jo',
      type: 'domain',
      domain: 'carlota',
      value: 0.2,
      description: 'Consulting & advisory',
    },

    ...(live?.criticalIncident
      ? [
          {
            id: 'entity-live-incident',
            label: live.criticalIncident.title.slice(0, 40),
            type: 'entity' as const,
            domain: 'aegis',
            severity: 'critical' as const,
            description: `Live incident #${live.criticalIncident.id} — open and under investigation`,
            live: true,
          },
        ]
      : [
          {
            id: 'entity-incident-0412',
            label: 'INC-2026-0412',
            type: 'entity' as const,
            domain: 'aegis',
            severity: 'critical' as const,
            description: 'Critical cyber incident — 47 assets affected',
          },
        ]),
    {
      id: 'entity-apt41',
      label: 'APT-41 Campaign',
      type: 'entity',
      domain: 'aegis',
      severity: 'critical',
      description: 'Nation-state threat actor — active lateral movement',
    },

    ...(live?.vesselHighAlertCount
      ? [
          {
            id: 'entity-live-vessel-alert',
            label: `${live.vesselHighAlertCount} High-Severity Fleet Alert(s)`,
            type: 'entity' as const,
            domain: 'vessels',
            severity: 'high' as const,
            description:
              live.vesselDelayTitle ??
              `${live.vesselHighAlertCount} high/critical vessel alerts active`,
            live: true,
          },
        ]
      : [
          {
            id: 'entity-vessel-pacific',
            label: 'MV Pacific Star',
            type: 'entity' as const,
            domain: 'vessels',
            severity: 'high' as const,
            description: 'IMO 9876543 — delayed 32h at Shanghai',
          },
        ]),
    {
      id: 'entity-port-shanghai',
      label: 'Port of Shanghai',
      type: 'entity',
      domain: 'vessels',
      severity: 'high',
      description: 'Congestion index +18%; 5 vessels queued',
    },

    ...(live?.distressCount
      ? [
          {
            id: 'entity-live-distress',
            label: `${live.distressCount} Distressed Propert${live.distressCount === 1 ? 'y' : 'ies'}`,
            type: 'entity' as const,
            domain: 'terra',
            severity: live.distressCount >= 10 ? ('high' as const) : ('medium' as const),
            description: live.distressRecentAddress
              ? `${live.distressCount} active distress records. Recent: ${live.distressRecentAddress.slice(0, 50)}`
              : `${live.distressCount} active distress records in portfolio`,
            live: true,
          },
        ]
      : [
          {
            id: 'entity-pudong-props',
            label: 'Pudong Properties',
            type: 'entity' as const,
            domain: 'terra',
            severity: 'high' as const,
            description: '12 properties with active construction timelines',
          },
        ]),

    live && live.prismOpenMatters > 0
      ? {
          id: 'entity-contracts-mm',
          label: live.prismRecentMatterTitle
            ? live.prismRecentMatterTitle.slice(0, 40)
            : `${live.prismOpenMatters} Active Matter(s)`,
          type: 'entity' as const,
          domain: 'prism',
          severity: live.prismLowHealthMatters >= 3 ? ('critical' as const) : ('high' as const),
          description: `${live.prismOpenMatters} open legal matter(s); ${live.prismLowHealthMatters} below health threshold`,
          live: true,
        }
      : {
          id: 'entity-contracts-mm',
          label: '8 Maritime Contracts',
          type: 'entity' as const,
          domain: 'prism',
          severity: 'high' as const,
          description: 'Contracts with delivery milestone clauses — force-majeure review',
        },
    {
      id: 'entity-legal-hold',
      label: 'Legal Hold — Cyber',
      type: 'entity',
      domain: 'prism',
      severity: 'critical',
      description: '23 artifact sets under legal hold',
    },
    {
      id: 'entity-fund3-lps',
      label: 'Fund III LPs',
      type: 'entity',
      domain: 'szl-holdings',
      description: '87% LP confidence score — monitoring',
    },
    live && (live.holdingsLatestNavCents !== null || live.holdingsTotalVentures > 0)
      ? {
          id: 'entity-nav',
          label:
            live.holdingsLatestNavCents !== null
              ? `Portfolio NAV $${(live.holdingsLatestNavCents / 100 / 1_000_000).toFixed(0)}M`
              : `${live.holdingsTotalVentures} Ventures Tracked`,
          type: 'entity' as const,
          domain: 'szl-holdings',
          severity: live.holdingsSunsetVentures > 0 ? ('high' as const) : ('medium' as const),
          description: `${live.holdingsActiveVentures}/${live.holdingsTotalVentures} active venture(s)${live.holdingsSunsetVentures > 0 ? `; ${live.holdingsSunsetVentures} sunset` : ''}${live.holdingsLatestNavCents !== null ? `; NAV $${(live.holdingsLatestNavCents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : ''}`,
          live: true,
        }
      : {
          id: 'entity-nav',
          label: 'Portfolio NAV',
          type: 'entity' as const,
          domain: 'szl-holdings',
          severity: 'medium' as const,
          description: '$2.3B NAV — compound risk scenario active',
        },

    ...(live?.vesselHighAlertCount
      ? [
          {
            id: 'signal-fleet-alert',
            label: `Fleet Alerts: ${live.vesselHighAlertCount} High+`,
            type: 'signal' as const,
            domain: 'vessels',
            severity: 'high' as const,
            description: `${live.vesselHighAlertCount} high/critical vessel alerts active — signal chain evaluation pending`,
            live: true,
          },
        ]
      : [
          {
            id: 'signal-port-delay',
            label: 'Port Delay +32h',
            type: 'signal' as const,
            domain: 'vessels',
            severity: 'high' as const,
            description: 'Threshold exceeded — signal chain active',
          },
        ]),
    ...(live?.criticalIncident
      ? [
          {
            id: 'signal-live-incident',
            label: `${live.openIncidentCount} Open Incident(s)`,
            type: 'signal' as const,
            domain: 'aegis',
            severity: 'critical' as const,
            description: `${live.openIncidentCount} open incident(s); ${live.criticalAlertCount} critical/high alert(s) — legal cascade active`,
            live: true,
          },
        ]
      : [
          {
            id: 'signal-apt-detected',
            label: 'APT-41 Detected',
            type: 'signal' as const,
            domain: 'aegis',
            severity: 'critical' as const,
            description: 'Critical threshold crossed — legal cascade triggered',
          },
        ]),
    {
      id: 'signal-volatility',
      label: 'Volatility 0.72',
      type: 'signal',
      domain: 'szl-holdings',
      severity: 'medium',
      description: 'Market volatility above rebalance threshold',
    },
    ...(live?.distressCount
      ? [
          {
            id: 'signal-live-distress',
            label: `${live.distressCount} Properties Distressed`,
            type: 'signal' as const,
            domain: 'terra',
            severity: live.distressCount >= 10 ? ('high' as const) : ('medium' as const),
            description: `${live.distressCount} active distress records tracked in live portfolio`,
            live: true,
          },
        ]
      : [
          {
            id: 'signal-distress-spike',
            label: '18 Properties Distressed',
            type: 'signal' as const,
            domain: 'terra',
            severity: 'high' as const,
            description: 'Distress score spike from rate sensitivity',
          },
        ]),

    // Live KG entity nodes from knowledge graph — supplement static nodes with DB-backed entities
    ...(live?.kgEntityNodes.map((kg) => ({
      id: `kg-entity-${kg.id}`,
      label: kg.name.length > 40 ? kg.name.slice(0, 37) + '…' : kg.name,
      type: 'entity' as const,
      domain: kg.domain,
      severity: kgConfidenceToSeverity(kg.confidence),
      description: kg.description
        ? `[KG] ${kg.description.slice(0, 100)}`
        : `[KG] ${kg.entityType} entity in ${kg.domain} domain`,
      value: kg.confidence ?? 0.7,
      live: true,
    })) ?? []),
  ];

  const vesselEntityId = live?.vesselHighAlertCount
    ? 'entity-live-vessel-alert'
    : 'entity-vessel-pacific';
  const incidentEntityId = live?.criticalIncident ? 'entity-live-incident' : 'entity-incident-0412';
  const distressEntityId = live?.distressCount ? 'entity-live-distress' : 'entity-pudong-props';
  const vesselSignalId = live?.vesselHighAlertCount ? 'signal-fleet-alert' : 'signal-port-delay';
  const incidentSignalId = live?.criticalIncident ? 'signal-live-incident' : 'signal-apt-detected';
  const distressSignalId = live?.distressCount ? 'signal-live-distress' : 'signal-distress-spike';

  const staticEdges: GraphEdge[] = [
    {
      id: 'e1',
      source: vesselEntityId,
      target: 'entity-port-shanghai',
      label: 'delayed at',
      strength: 0.95,
      type: 'dependency',
      description: 'High-severity vessel activity correlates with port congestion events',
      lastActive: Date.now() - 3600000,
    },
    {
      id: 'e2',
      source: 'entity-port-shanghai',
      target: distressEntityId,
      label: 'supply chain risk →',
      strength: 0.87,
      type: 'causal',
      description: 'Port congestion delays construction materials for port-adjacent properties',
      lastActive: Date.now() - 3600000,
    },
    {
      id: 'e3',
      source: 'entity-port-shanghai',
      target: 'entity-contracts-mm',
      label: 'triggers review →',
      strength: 0.82,
      type: 'causal',
      description: 'Delay above threshold triggers force-majeure review in maritime contracts',
      lastActive: Date.now() - 3600000,
    },
    {
      id: 'e4',
      source: vesselSignalId,
      target: 'domain-terra',
      label: 'cascades to',
      strength: live?.vesselHighAlertCount ? 0.88 : 0.84,
      type: 'escalation',
      description: 'Maritime delay signal propagates to Terra domain via signal chain',
      lastActive: Date.now() - 3600000,
    },
    {
      id: 'e5',
      source: vesselSignalId,
      target: 'domain-prism',
      label: 'cascades to',
      strength: 0.8,
      type: 'escalation',
      description: 'Maritime delay signal triggers legal review chain in PRISM',
      lastActive: Date.now() - 3600000,
    },

    {
      id: 'e6',
      source: 'entity-apt41',
      target: incidentEntityId,
      label: 'caused',
      strength: 0.99,
      type: 'causal',
      description: 'APT-41 is the attributed threat actor for the active incident',
      lastActive: Date.now() - 1800000,
    },
    {
      id: 'e7',
      source: incidentEntityId,
      target: 'entity-legal-hold',
      label: 'triggered',
      strength: 0.95,
      type: 'escalation',
      description: 'Cyber incident triggered legal hold on all forensic artifacts',
      lastActive: Date.now() - 7200000,
    },
    {
      id: 'e8',
      source: incidentSignalId,
      target: 'domain-prism',
      label: 'legal cascade →',
      strength: live?.criticalIncident ? 0.94 : 0.91,
      type: 'escalation',
      description: 'Security incident detection triggered security→legal signal chain',
      lastActive: Date.now() - 1800000,
    },
    {
      id: 'e9',
      source: incidentSignalId,
      target: 'entity-nav',
      label: 'risk impact →',
      strength: 0.73,
      type: 'correlative',
      description: 'Cyber incident elevated portfolio risk score',
      lastActive: Date.now() - 1800000,
    },

    {
      id: 'e10',
      source: 'signal-volatility',
      target: 'domain-terra',
      label: 'distress trigger →',
      strength: 0.78,
      type: 'causal',
      description: 'Market volatility triggered accelerated distress scoring refresh',
      lastActive: Date.now() - 3600000,
    },
    {
      id: 'e11',
      source: 'signal-volatility',
      target: 'domain-vessels',
      label: 'voyage economics →',
      strength: 0.65,
      type: 'correlative',
      description: 'Rate environment impacts trade route economics for fleet',
      lastActive: Date.now() - 3600000,
    },
    {
      id: 'e12',
      source: distressSignalId,
      target: 'entity-fund3-lps',
      label: 'sentiment risk →',
      strength: 0.6,
      type: 'correlative',
      description: 'Property distress levels may affect LP confidence in real estate thesis',
      lastActive: Date.now() - 7200000,
    },

    {
      id: 'e13',
      source: 'domain-lyte',
      target: 'domain-aegis',
      label: 'supports defense →',
      strength: 0.72,
      type: 'dependency',
      description: 'Lyte infrastructure health underpins Aegis SOC tooling and detection pipeline',
      lastActive: Date.now() - 14400000,
    },
    {
      id: 'e14',
      source: 'domain-aegis',
      target: 'entity-nav',
      label: 'risk factor →',
      strength: 0.68,
      type: 'correlative',
      description: 'Security posture is a direct input to portfolio risk scoring',
      lastActive: Date.now() - 3600000,
    },
    {
      id: 'e15',
      source: 'domain-prism',
      target: 'entity-fund3-lps',
      label: 'protects →',
      strength: 0.55,
      type: 'dependency',
      description: 'Legal team manages LP agreement compliance and dispute resolution',
      lastActive: Date.now() - 86400000,
    },
    {
      id: 'e16',
      source: 'domain-carlota',
      target: 'entity-nav',
      label: 'advisory alpha →',
      strength: 0.42,
      type: 'correlative',
      description: 'Consulting insights from Carlota Jo inform strategic portfolio decisions',
      lastActive: Date.now() - 86400000,
    },
  ];

  // When the knowledge graph has live entity relationships, supplement the graph
  // with live KG edges (relationships that connect nodes we have in the graph).
  // Build a Set of all known node IDs for fast lookup.
  const knownNodeIds = new Set(nodes.map((n) => n.id));
  const kgEdgesToAdd: GraphEdge[] = [];

  if (hasKgData && live) {
    for (const kg of live.kgEdges) {
      const srcId = `kg-entity-${kg.fromEntityId}`;
      const tgtId = `kg-entity-${kg.toEntityId}`;
      if (!knownNodeIds.has(srcId) || !knownNodeIds.has(tgtId)) continue;

      const relTypeToEdgeType = (rt: string): GraphEdge['type'] => {
        if (rt.includes('cause') || rt.includes('trigger')) return 'causal';
        if (rt.includes('escalat') || rt.includes('cascade')) return 'escalation';
        if (rt.includes('depend') || rt.includes('support')) return 'dependency';
        return 'correlative';
      };

      kgEdgesToAdd.push({
        id: `kg-rel-${kg.id.slice(0, 8)}`,
        source: srcId,
        target: tgtId,
        label: kg.relationshipType.replace(/_/g, ' '),
        strength: kg.strength ?? 0.5,
        type: relTypeToEdgeType(kg.relationshipType),
        description: `KG relationship: ${kg.relationshipType} (${kg.fromDomain} → ${kg.toDomain})`,
        lastActive: Date.now() - 1800000,
      });
    }
  }

  const edges: GraphEdge[] = [...staticEdges, ...kgEdgesToAdd];

  const stats: GraphStats = {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    criticalNodes: nodes.filter((n) => n.severity === 'critical').length,
    highNodes: nodes.filter((n) => n.severity === 'high').length,
    activeEdges: edges.filter((e) => e.lastActive > Date.now() - 86400000).length,
    strongCorrelations: edges.filter((e) => e.strength > 0.8).length,
    generatedAt: Date.now(),
    liveEntities: liveEntitiesCount,
  };

  return { nodes, edges, stats };
}

router.get(
  '/correlation-map',
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  async (_req, res) => {
    let live: LiveEntityData | undefined;
    try {
      live = await fetchLiveEntityData();
      logger.info(
        {
          incidents: live.openIncidentCount,
          vesselAlerts: live.vesselHighAlertCount,
          distress: live.distressCount,
          kgEntities: live.kgEntityNodes.length,
          kgEdges: live.kgEdges.length,
        },
        '[CorrelationMap] Live entity data fetched',
      );
    } catch (err) {
      logger.warn({ err }, '[CorrelationMap] Live entity fetch failed, using static graph');
    }
    const graph = buildGraph(live);
    res.json({ success: true, ...graph, live: live !== undefined });
  },
);

router.get(
  '/correlation-map/live',
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  async (_req, res) => {
    let live: LiveEntityData | undefined;
    try {
      live = await fetchLiveEntityData();
    } catch {
      /* use static */
    }
    const graph = buildGraph(live);

    const jitter = () => (Math.random() - 0.5) * 0.04;
    graph.edges = graph.edges.map((e) => ({
      ...e,
      strength: Math.min(1, Math.max(0.1, e.strength + jitter())),
    }));

    res.json({ success: true, ...graph, live: live !== undefined });
  },
);

export default router;
