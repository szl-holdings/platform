/**
 * Signal Mesh Seed Runner
 *
 * Seeds the signal mesh with believable live-ish scenarios for:
 *   - Vessels: Port Congestion + Route Exception Cluster
 *   - Carlota Jo: Estate Readiness Gap Before VIP Arrival
 *   - SZL Holdings: Treasury Risk Cluster
 *
 * Run via:
 *   pnpm --filter @workspace/demo-seed run seed:mesh
 *
 * Or as part of a full reset:
 *   pnpm --filter @workspace/demo-seed run seed:all
 *
 * The seed:
 *   1. Registers entity snapshots in the entity registry
 *   2. Runs signals through the 9-stage pipeline
 *   3. Stores evidence items and recommendations in the evidence graph
 *   4. Starts all connector adapters to emit a live signal stream
 */

import {
  AISMaritimeDemoAdapter,
  CrmProjectDemoAdapter,
  defaultConnectorRegistry,
  type DemoAdapterEvent,
  EmailCalendarDemoAdapter,
  LegalMatterDemoAdapter,
  MessagingDemoAdapter,
  PropertyOpsDemoAdapter,
  SecurityToolsDemoAdapter,
  StorageDocsDemoAdapter,
  WebhookDemoAdapter,
} from '@szl-holdings/connectors';
import { defaultEvidenceStore, defaultRecommendationStore } from '@szl-holdings/evidence-graph';
import { defaultPipeline, defaultSignalBus } from '@szl-holdings/signal-mesh';
import {
  createEntitySnapshot,
  defaultEntityRegistry,
  type SignalDomain,
  type SignalInput,
} from '@workspace/ontology';
import { CARLOTA_JO_ESTATE_NARRATIVE } from './narrative-carlota-jo-estate.js';
import { COUNSEL_DEADLINE_NARRATIVE } from './narrative-counsel-deadline.js';
import { clearNarrativeMeshIndex, registerNarrativeMeshEntry } from './narrative-mesh-index.js';
import { SENTRA_RANSOMWARE_NARRATIVE } from './narrative-sentra-ransomware.js';
import { SZL_TREASURY_NARRATIVE } from './narrative-szl-treasury.js';
import { VESSELS_PORT_CONGESTION_NARRATIVE } from './narrative-vessels-port-congestion.js';

/**
 * Demo adapters emit a lightweight {@link DemoAdapterEvent}; the signal-mesh
 * pipeline consumes a fully-shaped {@link SignalInput}. This maps one to the
 * other so the seeded connector stream flows through the real pipeline. The
 * domain is derived from each adapter's stable `source` id.
 */
const DEMO_SOURCE_DOMAINS: Record<string, SignalDomain> = {
  'ais-maritime-demo': 'maritime',
  'property-ops-demo': 'real-estate',
  'legal-matter-demo': 'legal',
  'security-tools-demo': 'security',
  'email-calendar-demo': 'workforce',
  'crm-project-demo': 'platform',
  'storage-docs-demo': 'platform',
  'webhook-demo': 'platform',
  'messaging-demo': 'platform',
};

function demoEventToSignalInput(event: DemoAdapterEvent): SignalInput {
  return {
    source: 'connector',
    type: 'connector-event',
    domain: DEMO_SOURCE_DOMAINS[event.source] ?? 'platform',
    occurredAt: event.occurredAt.toISOString(),
    freshness: 1,
    confidence: 0.9,
    entityRefs: [],
    rawPayload: { kind: event.kind, source: event.source, ...event.payload },
    tags: ['demo-connector', event.kind.split('.')[0] ?? 'event'],
    provenance: { sourceService: event.source },
  };
}

export async function seedSignalMesh(opts: { startConnectors?: boolean } = {}): Promise<{
  signalsSeeded: number;
  evidenceItemsSeeded: number;
  recommendationsSeeded: number;
  entitiesRegistered: number;
  connectorsStarted: number;
}> {
  // biome-ignore lint/suspicious/noConsole: seed script
  console.log("[seed-signal-mesh] Starting signal mesh seed...");

  registerEntities();
  clearNarrativeMeshIndex();

  let totalSignals = 0;
  let totalEvidence = 0;
  let totalRecs = 0;

  for (const narrative of [
    VESSELS_PORT_CONGESTION_NARRATIVE,
    CARLOTA_JO_ESTATE_NARRATIVE,
    SZL_TREASURY_NARRATIVE,
    SENTRA_RANSOMWARE_NARRATIVE,
    COUNSEL_DEADLINE_NARRATIVE,
  ]) {
    // biome-ignore lint/suspicious/noConsole: seed script
    console.log(`[seed-signal-mesh] Seeding narrative: ${narrative.title}`);

    const signals = narrative.buildSignals();
    const evidenceItems = narrative.buildEvidenceItems(signals);
    const recommendation = narrative.buildRecommendation(signals, evidenceItems);

    for (const s of signals) {
      defaultSignalBus.publish(s);
    }

    for (const ev of evidenceItems) {
      defaultEvidenceStore.save(ev);
    }

    defaultRecommendationStore.save(recommendation);

    for (const s of signals) {
      for (const ref of s.entityRefs) {
        defaultEntityRegistry.linkSignal(ref.entityId, s.signalId);
      }
    }

    for (const ref of recommendation.entityRefs) {
      defaultEntityRegistry.linkRecommendation(ref.entityId, recommendation.recommendationId);
    }

    registerNarrativeMeshEntry({
      narrativeId: narrative.id,
      recommendationId: recommendation.recommendationId,
      signalIds: signals.map((s) => s.signalId),
      evidenceItemIds: evidenceItems.map((e) => e.evidenceId),
      seededAt: new Date().toISOString(),
    });

    totalSignals += signals.length;
    totalEvidence += evidenceItems.length;
    totalRecs++;
  }

  let connectorsStarted = 0;

  if (opts.startConnectors !== false) {
    const adapters = [
      new AISMaritimeDemoAdapter(),
      new EmailCalendarDemoAdapter(),
      new MessagingDemoAdapter(),
      new CrmProjectDemoAdapter(),
      new StorageDocsDemoAdapter(),
      new WebhookDemoAdapter(),
      new PropertyOpsDemoAdapter(),
      new SecurityToolsDemoAdapter(),
      new LegalMatterDemoAdapter(),
    ];

    defaultConnectorRegistry.setEmitSignal(async (event) => {
      const result = await defaultPipeline.process(demoEventToSignalInput(event));
      if (result.recommendation) {
        for (const ev of result.evidenceItems) defaultEvidenceStore.save(ev);
        defaultRecommendationStore.save(result.recommendation);
      }
      return result.signal;
    });

    for (const adapter of adapters) {
      defaultConnectorRegistry.register(adapter);
    }

    await defaultConnectorRegistry.startAll();
    connectorsStarted = adapters.length;
  }

  const stats = {
    signalsSeeded: totalSignals,
    evidenceItemsSeeded: totalEvidence,
    recommendationsSeeded: totalRecs,
    entitiesRegistered: defaultEntityRegistry.count(),
    connectorsStarted,
  };

  // biome-ignore lint/suspicious/noConsole: seed script
  console.log('[seed-signal-mesh] ✓ Seed complete:', stats);
  return stats;
}

function registerEntities(): void {
  const now = new Date().toISOString();

  const entities: Parameters<typeof createEntitySnapshot>[0][] = [
    {
      entityId: 'vessel-soltana',
      entityType: 'vessel',
      domain: 'maritime',
      displayName: 'MV Soltana',
      health: 'at-risk',
      riskScore: 82,
      attributes: {
        imo: '9812347',
        mmsi: '538009241',
        flag: 'Marshall Islands',
        cargoValue: 3_200_000,
      },
      externalIds: { mmsi: '538009241', imo: '9812347' },
      snapshotAt: now,
    },
    {
      entityId: 'vessel-horizon-star',
      entityType: 'vessel',
      domain: 'maritime',
      displayName: 'MV Horizon Star',
      health: 'degraded',
      riskScore: 55,
      attributes: { imo: '9654321', mmsi: '477123456' },
      externalIds: { mmsi: '477123456', imo: '9654321' },
      snapshotAt: now,
    },
    {
      entityId: 'vessel-atlantic-carrier',
      entityType: 'vessel',
      domain: 'maritime',
      displayName: 'MV Atlantic Carrier',
      health: 'degraded',
      riskScore: 45,
      attributes: { imo: '9100234', mmsi: '636091234' },
      externalIds: { mmsi: '636091234', imo: '9100234' },
      snapshotAt: now,
    },
    {
      entityId: 'port-fujairah',
      entityType: 'port',
      domain: 'maritime',
      displayName: 'Fujairah Port, UAE',
      health: 'degraded',
      riskScore: 70,
      attributes: { country: 'UAE', waitTimeHours: 28, queueLength: 12 },
      snapshotAt: now,
    },
    {
      entityId: 'property-castellano',
      entityType: 'property',
      domain: 'real-estate',
      displayName: 'Castellano Estate',
      health: 'at-risk',
      riskScore: 75,
      attributes: { estateReadinessPct: 60, openChecklist: 4, vipArrivalHours: 18 },
      snapshotAt: now,
    },
    {
      entityId: 'guest-marchetti',
      entityType: 'contact',
      domain: 'real-estate',
      displayName: 'The Marchetti Family',
      health: 'unknown',
      attributes: { arrivalHours: 18, tier: 'VIP' },
      snapshotAt: now,
    },
    {
      entityId: 'org-szl-holdings',
      entityType: 'organization',
      domain: 'finance',
      displayName: 'SZL Holdings',
      health: 'at-risk',
      riskScore: 68,
      attributes: { treasuryExposureUsd: 14_200_000, boardApprovalRequired: true },
      snapshotAt: now,
    },
    {
      entityId: 'facility-rcf-001',
      entityType: 'custom',
      domain: 'finance',
      displayName: 'Revolving Credit Facility #001',
      health: 'at-risk',
      riskScore: 72,
      attributes: {
        facilityAmountUsd: 50_000_000,
        drawnUsd: 38_000_000,
        liquidityRatio: 1.23,
        minimumRatio: 1.2,
      },
      snapshotAt: now,
    },
    {
      entityId: 'book-commodity-derivatives',
      entityType: 'custom',
      domain: 'finance',
      displayName: 'Commodity Derivative Book',
      health: 'at-risk',
      riskScore: 65,
      attributes: { unrealizedLossUsd: 2_800_000, threshold: 2_000_000 },
      snapshotAt: now,
    },
    {
      entityId: 'matter-001',
      entityType: 'custom',
      domain: 'legal',
      displayName: 'Soltana Vessel Compliance Review',
      health: 'at-risk',
      attributes: { deadlineHours: 48, type: 'regulatory-filing' },
      snapshotAt: now,
    },
    {
      entityId: 'client-arcturus',
      entityType: 'organization',
      domain: 'legal',
      displayName: 'Arcturus Shipping',
      health: 'degraded',
      attributes: { retainerBalanceUsd: 8_500, threshold: 10_000 },
      snapshotAt: now,
    },
    // Sentra — OT ransomware narrative
    {
      entityId: 'asset-scada-01',
      entityType: 'custom',
      domain: 'security',
      displayName: 'SCADA Production Server',
      health: 'at-risk',
      riskScore: 92,
      attributes: { segment: 'OT', criticality: 'tier-1' },
      snapshotAt: now,
    },
    {
      entityId: 'asset-hmi-04',
      entityType: 'custom',
      domain: 'security',
      displayName: 'HMI Workstation - Line 4',
      health: 'at-risk',
      riskScore: 84,
      attributes: { segment: 'OT', criticality: 'tier-2' },
      snapshotAt: now,
    },
    {
      entityId: 'asset-plc-12',
      entityType: 'custom',
      domain: 'security',
      displayName: 'PLC Controller - Zone B',
      health: 'at-risk',
      riskScore: 80,
      attributes: { segment: 'OT', criticality: 'tier-2' },
      snapshotAt: now,
    },
    {
      entityId: 'threat-c2-99',
      entityType: 'custom',
      domain: 'security',
      displayName: 'Anomalous C2 Callback',
      health: 'degraded',
      attributes: { destinationIp: '185.220.101.42' },
      snapshotAt: now,
    },
    // Counsel — deadline narrative
    {
      entityId: 'matter-meridian-compliance-v3',
      entityType: 'custom',
      domain: 'legal',
      displayName: 'Meridian Compliance v.3',
      health: 'at-risk',
      riskScore: 78,
      attributes: { exposureUsd: 4_100_000, deadlineDays: 11 },
      snapshotAt: now,
    },
    {
      entityId: 'firm-morrison-vance',
      entityType: 'organization',
      domain: 'legal',
      displayName: 'Morrison & Vance LLP',
      health: 'degraded',
      attributes: { overdueDeliverables: 3 },
      snapshotAt: now,
    },
    {
      entityId: 'obl-discovery-001',
      entityType: 'custom',
      domain: 'legal',
      displayName: 'Discovery Request #001',
      health: 'at-risk',
      attributes: { daysOverdue: 18 },
      snapshotAt: now,
    },
    {
      entityId: 'obl-filing-001',
      entityType: 'custom',
      domain: 'legal',
      displayName: 'Regulatory Filing',
      health: 'at-risk',
      attributes: { daysRemaining: 11 },
      snapshotAt: now,
    },
  ];

  for (const input of entities) {
    defaultEntityRegistry.upsert(createEntitySnapshot(input));
  }
}
