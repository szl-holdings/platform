/**
 * Demo Narrative: Vessels — Port Congestion + Route Exception Cluster
 *
 * Scenario: Three vessels (MV Soltana, MV Horizon Star, MV Atlantic Carrier)
 * face a compound crisis — Fujairah port at 28-hour wait time, MV Soltana in an
 * AIS dark period near a sanctions corridor, and charter rates spiking +21%.
 * The signal mesh correlates all three signals, generates a route-diversion
 * recommendation with OFAC clearance gate, and estimates $185K daily cost savings.
 *
 * Flow: AIS dark signal → port congestion breach → charter rate spike →
 *       correlation cluster → reroute recommendation → operator approval gate
 */

import type { Signal } from '@workspace/ontology/signal';
import { type EvidenceItem, type Recommendation, createSignal, createEvidenceItem, createRecommendation } from '@workspace/ontology';

export type VesselsPortCongestionNarrative = typeof VESSELS_PORT_CONGESTION_NARRATIVE;

export const VESSELS_PORT_CONGESTION_NARRATIVE = {
  id: 'vessels-port-congestion',
  title: 'Vessels — Port Congestion + Route Exception Cluster',
  domain: 'maritime' as const,
  org: 'Arcturus Shipping',
  personas: ['fleet-operator', 'compliance-auditor'],
  duration: '10 minutes',

  scenario: {
    name: 'Fujairah Congestion Crisis + MV Soltana AIS Dark Event',
    summary:
      'Three vessels face compounding delays at Fujairah (28h wait). MV Soltana simultaneously went dark for 134 minutes near an OFAC-sensitive corridor. Charter rates spiked +21%. The signal mesh correlates all three signals into a single reroute recommendation worth $185K/day in savings.',
    clusterSize: 3,
    estimatedSavingsPerDayUsd: 185_000,
    peakRiskExposureUsd: 3_200_000,
  },

  entities: {
    soltana: {
      entityId: 'vessel-soltana',
      entityType: 'vessel' as const,
      displayName: 'MV Soltana',
      domain: 'maritime' as const,
      externalIds: { mmsi: '538009241', imo: '9812347' },
    },
    horizonStar: {
      entityId: 'vessel-horizon-star',
      entityType: 'vessel' as const,
      displayName: 'MV Horizon Star',
      domain: 'maritime' as const,
      externalIds: { mmsi: '477123456', imo: '9654321' },
    },
    atlanticCarrier: {
      entityId: 'vessel-atlantic-carrier',
      entityType: 'vessel' as const,
      displayName: 'MV Atlantic Carrier',
      domain: 'maritime' as const,
      externalIds: { mmsi: '636091234', imo: '9100234' },
    },
    portFujairah: {
      entityId: 'port-fujairah',
      entityType: 'port' as const,
      displayName: 'Fujairah Port, UAE',
      domain: 'maritime' as const,
    },
  },

  buildSignals(): Signal[] {
    const now = Date.now();

    return [
      createSignal({
        source: 'connector',
        type: 'anomaly',
        domain: 'maritime',
        occurredAt: new Date(now - 134 * 60_000).toISOString(),
        freshness: 0.9,
        confidence: 0.95,
        severity: 'high',
        entityRefs: [this.entities.soltana],
        rawPayload: {
          eventType: 'ais_dark_period',
          durationMinutes: 134,
          lat: 25.6,
          lon: 57.2,
          corridor: 'Strait of Hormuz proximity',
          cargoValue: 3_200_000,
        },
        tags: ['ais', 'dark-period', 'sanctions-adjacent', 'vessels'],
        provenance: { connectorId: 'demo-ais-maritime', sourceService: 'signal-mesh-seed' },
      }),

      createSignal({
        source: 'connector',
        type: 'threshold-breach',
        domain: 'maritime',
        occurredAt: new Date(now - 90 * 60_000).toISOString(),
        freshness: 0.85,
        confidence: 0.88,
        severity: 'high',
        entityRefs: [
          this.entities.portFujairah,
          this.entities.soltana,
          this.entities.horizonStar,
          this.entities.atlanticCarrier,
        ],
        rawPayload: {
          eventType: 'port_congestion_alert',
          portName: 'Fujairah, UAE',
          waitTimeHours: 28,
          queueLength: 12,
          financialImpactUsd: 185_000,
        },
        tags: ['port', 'congestion', 'delay', 'vessels'],
        provenance: { connectorId: 'demo-ais-maritime', sourceService: 'signal-mesh-seed' },
      }),

      createSignal({
        source: 'connector',
        type: 'market-signal',
        domain: 'maritime',
        occurredAt: new Date(now - 60 * 60_000).toISOString(),
        freshness: 0.88,
        confidence: 0.92,
        severity: 'medium',
        entityRefs: [],
        rawPayload: {
          eventType: 'charter_rate_spike',
          route: 'TD3C',
          currentRate: 38_200,
          previousRate: 31_500,
          changePercent: 21.3,
        },
        tags: ['charter-rate', 'market', 'vessels'],
        provenance: { connectorId: 'demo-webhooks', sourceService: 'signal-mesh-seed' },
      }),

      createSignal({
        source: 'connector',
        type: 'sanctions-match',
        domain: 'maritime',
        occurredAt: new Date(now - 120 * 60_000).toISOString(),
        freshness: 0.88,
        confidence: 0.78,
        severity: 'critical',
        entityRefs: [this.entities.soltana],
        rawPayload: {
          eventType: 'ofac_proximity_alert',
          screeningResult: 'proximity_match',
          matchedList: 'OFAC SDN',
          riskScore: 0.78,
        },
        tags: ['ofac', 'sanctions', 'vessels'],
        provenance: { connectorId: 'demo-ais-maritime', sourceService: 'signal-mesh-seed' },
      }),
    ];
  },

  buildEvidenceItems(signals: Signal[]): EvidenceItem[] {
    return [
      createEvidenceItem({
        type: 'signal',
        domain: 'maritime',
        signalId: signals[0]?.signalId,
        entityRefs: [this.entities.soltana],
        summary: 'MV Soltana AIS dark for 134 minutes near Strait of Hormuz — sanctions corridor',
        confidence: 0.95,
        freshness: 0.9,
        weight: 0.4,
        observedAt: signals[0]?.occurredAt ?? new Date().toISOString(),
        tags: ['ais', 'dark-period'],
      }),
      createEvidenceItem({
        type: 'threshold-trigger',
        domain: 'maritime',
        signalId: signals[1]?.signalId,
        entityRefs: [this.entities.portFujairah],
        summary: 'Fujairah port congestion: 28h wait time, 12 vessels queued — $185K/day exposure',
        confidence: 0.88,
        freshness: 0.85,
        weight: 0.35,
        observedAt: signals[1]?.occurredAt ?? new Date().toISOString(),
        tags: ['port', 'congestion'],
      }),
      createEvidenceItem({
        type: 'market-data',
        domain: 'maritime',
        signalId: signals[2]?.signalId,
        entityRefs: [],
        summary:
          'TD3C charter rates spiked +21% ($31,500 → $38,200/day) — alternative route cost-effective',
        confidence: 0.92,
        freshness: 0.88,
        weight: 0.15,
        observedAt: signals[2]?.occurredAt ?? new Date().toISOString(),
        tags: ['charter-rate', 'market'],
      }),
      createEvidenceItem({
        type: 'regulatory-rule',
        domain: 'maritime',
        signalId: signals[3]?.signalId,
        entityRefs: [this.entities.soltana],
        summary: 'OFAC SDN proximity match — mandatory compliance gate before cargo discharge',
        confidence: 0.78,
        freshness: 0.88,
        weight: 0.1,
        observedAt: signals[3]?.occurredAt ?? new Date().toISOString(),
        tags: ['ofac', 'sanctions'],
      }),
    ];
  },

  buildRecommendation(signals: Signal[], evidenceItems: EvidenceItem[]): Recommendation {
    return createRecommendation({
      domain: 'maritime',
      title: 'Reroute MV Soltana Fleet — Fujairah Bypass via Khor Fakkan',
      summary:
        'Port congestion, AIS dark event, and OFAC proximity combine into a critical cluster. ' +
        'Diverting MV Soltana and MV Horizon Star via Khor Fakkan saves $185K/day and resolves the compliance gate.',
      rationale:
        '3-signal correlation cluster (AIS dark + port congestion + OFAC proximity) in 74-minute window. ' +
        'Aggregate confidence 0.88. Financial exposure $3.2M cargo + $185K/day delay costs. ' +
        'OFAC screening required before sanctions corridor transit.',
      suggestedAction: 'reroute',
      actionPayload: {
        vessels: ['vessel-soltana', 'vessel-horizon-star'],
        alternatePort: 'Khor Fakkan',
        estimatedSavingsPerDayUsd: 185_000,
        ofacClearanceRequired: true,
      },
      confidence: 0.88,
      freshness: 0.9,
      projectedImpact:
        'Khor Fakkan bypass saves $185K/day in demurrage and clears the OFAC compliance gate, protecting $3.2M cargo value.',
      projectedRisk:
        'Without reroute, fleet faces continued port congestion ($185K/day exposure), OFAC screening failure, and potential vessel detention at Fujairah.',
      projectedImpactUsd: 185_000,
      projectedRiskReductionPct: 72,
      policyEvaluation: { outcome: 'pending', policyIds: [] },
      evidenceIds: evidenceItems.map((e) => e.evidenceId),
      signalIds: signals.map((s) => s.signalId),
      entityRefs: [this.entities.soltana, this.entities.horizonStar, this.entities.portFujairah],
      generatedBy: 'signal-pipeline/correlate-score-recommend',
      provenance: { sourceService: 'signal-mesh-seed' },
      generatedAt: new Date().toISOString(),
      tags: ['vessels', 'maritime', 'reroute', 'port-congestion', 'sanctions'],
    });
  },
} as const;
