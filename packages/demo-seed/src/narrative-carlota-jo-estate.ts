/**
 * Demo Narrative: Carlota Jo — Estate Readiness Gap Before VIP Arrival
 *
 * Scenario: The Marchetti Family arrives at Castellano Estate in 18 hours.
 * Four checklist items are incomplete: pool heating, wine cellar temperature,
 * master suite linen change, and security access code reset.
 * Two are critical (pool + wine cellar have sensor breaches). The signal mesh
 * clusters all four into a single estate-readiness recommendation with a
 * priority dispatch order and $45K guest satisfaction value at risk.
 *
 * Flow: maintenance alert × 2 → overdue checklist × 2 → VIP arrival signal →
 *       correlation cluster → estate-readiness recommendation → ops dispatch
 */

import type { EvidenceItem, Recommendation, Signal } from '@workspace/ontology';
import { createEvidenceItem, createRecommendation, createSignal } from '@workspace/ontology';

export type CarlotaJoEstateNarrative = typeof CARLOTA_JO_ESTATE_NARRATIVE;

export const CARLOTA_JO_ESTATE_NARRATIVE = {
  id: 'carlota-jo-estate',
  title: 'Carlota Jo — Estate Readiness Gap Before VIP Arrival',
  domain: 'real-estate' as const,
  org: 'Carlota Jo Estate Management',
  personas: ['estate-manager', 'ops-lead'],
  duration: '8 minutes',

  scenario: {
    name: 'Castellano Estate — Marchetti VIP Arrival T-18h Readiness Gap',
    summary:
      'The Marchetti Family arrives in 18 hours. Pool heating is offline, wine cellar is 3°C above threshold, linen change and access code reset are unconfirmed. The estate readiness score is 60%. ' +
      '$45K guest satisfaction value at risk.',
    openChecklistItems: 4,
    criticalItems: 2,
    estateReadinessPct: 60,
    valueAtRiskUsd: 45_000,
  },

  entities: {
    property: {
      entityId: 'property-castellano',
      entityType: 'property' as const,
      displayName: 'Castellano Estate',
      domain: 'real-estate' as const,
    },
    guest: {
      entityId: 'guest-marchetti',
      entityType: 'contact' as const,
      displayName: 'The Marchetti Family',
      domain: 'real-estate' as const,
    },
  },

  buildSignals(): Signal[] {
    const now = Date.now();

    return [
      createSignal({
        source: 'connector',
        type: 'anomaly',
        domain: 'real-estate',
        occurredAt: new Date(now - 2 * 3600_000).toISOString(),
        freshness: 0.92,
        confidence: 0.98,
        severity: 'high',
        entityRefs: [this.entities.property],
        rawPayload: {
          eventType: 'maintenance_alert',
          unit: 'Pool House',
          issue: 'Pool heating system not responding',
          vipArrivalHours: 18,
          financialImpactUsd: 45_000,
        },
        tags: ['maintenance', 'pool', 'vip-prep', 'carlota-jo'],
        provenance: { connectorId: 'demo-property-ops', sourceService: 'signal-mesh-seed' },
      }),

      createSignal({
        source: 'connector',
        type: 'threshold-breach',
        domain: 'real-estate',
        occurredAt: new Date(now - 1 * 3600_000).toISOString(),
        freshness: 0.95,
        confidence: 0.99,
        severity: 'high',
        entityRefs: [this.entities.property],
        rawPayload: {
          eventType: 'temperature_breach',
          unit: 'Wine Cellar',
          currentTemp: 16,
          targetTemp: 13,
          threshold: 14.5,
          vipArrivalHours: 18,
        },
        tags: ['temperature', 'wine-cellar', 'breach', 'carlota-jo'],
        provenance: { connectorId: 'demo-property-ops', sourceService: 'signal-mesh-seed' },
      }),

      createSignal({
        source: 'connector',
        type: 'deadline',
        domain: 'real-estate',
        occurredAt: new Date(now - 30 * 60_000).toISOString(),
        freshness: 0.97,
        confidence: 0.99,
        severity: 'high',
        entityRefs: [this.entities.property, this.entities.guest],
        rawPayload: {
          eventType: 'vip_arrival_imminent',
          guestName: 'The Marchetti Family',
          arrivalAt: new Date(now + 18 * 3600_000).toISOString(),
          openChecklistItems: 4,
          openItems: [
            'Pool heating activation',
            'Wine cellar temperature',
            'Master suite linen change',
            'Security access codes reset',
          ],
        },
        tags: ['vip', 'arrival', 'readiness', 'carlota-jo'],
        provenance: { connectorId: 'demo-email-calendar', sourceService: 'signal-mesh-seed' },
      }),

      createSignal({
        source: 'connector',
        type: 'escalation',
        domain: 'real-estate',
        occurredAt: new Date(now - 15 * 60_000).toISOString(),
        freshness: 0.97,
        confidence: 0.95,
        severity: 'medium',
        entityRefs: [this.entities.property],
        rawPayload: {
          eventType: 'checklist_overdue',
          items: ['Master suite linen change', 'Security access codes reset'],
          assignee: 'ops-team@castellano.estate',
          noResponseMinutes: 60,
        },
        tags: ['checklist', 'overdue', 'carlota-jo'],
        provenance: { connectorId: 'demo-email-calendar', sourceService: 'signal-mesh-seed' },
      }),
    ];
  },

  buildEvidenceItems(signals: Signal[]): EvidenceItem[] {
    return [
      createEvidenceItem({
        type: 'signal',
        domain: 'real-estate',
        signalId: signals[0]?.signalId,
        entityRefs: [this.entities.property],
        summary:
          'Pool heating system offline — T-18h before VIP arrival. Guest comfort critically at risk.',
        confidence: 0.98,
        freshness: 0.92,
        weight: 0.35,
        observedAt: signals[0]?.occurredAt ?? new Date().toISOString(),
        tags: ['pool', 'maintenance'],
      }),
      createEvidenceItem({
        type: 'threshold-trigger',
        domain: 'real-estate',
        signalId: signals[1]?.signalId,
        entityRefs: [this.entities.property],
        summary:
          'Wine cellar at 16°C — 3°C above 13°C target. Rare wine collection quality at risk.',
        confidence: 0.99,
        freshness: 0.95,
        weight: 0.3,
        observedAt: signals[1]?.occurredAt ?? new Date().toISOString(),
        tags: ['temperature', 'wine-cellar'],
      }),
      createEvidenceItem({
        type: 'signal',
        domain: 'real-estate',
        signalId: signals[2]?.signalId,
        entityRefs: [this.entities.guest],
        summary:
          'VIP arrival confirmed T-18h. 4 open checklist items. Estate readiness score: 60%.',
        confidence: 0.99,
        freshness: 0.97,
        weight: 0.25,
        observedAt: signals[2]?.occurredAt ?? new Date().toISOString(),
        tags: ['vip', 'arrival'],
      }),
      createEvidenceItem({
        type: 'signal',
        domain: 'real-estate',
        signalId: signals[3]?.signalId,
        entityRefs: [this.entities.property],
        summary: '2 checklist items unacknowledged after 60 minutes — ops team non-responsive.',
        confidence: 0.95,
        freshness: 0.97,
        weight: 0.1,
        observedAt: signals[3]?.occurredAt ?? new Date().toISOString(),
        tags: ['checklist', 'escalation'],
      }),
    ];
  },

  buildRecommendation(signals: Signal[], evidenceItems: EvidenceItem[]): Recommendation {
    return createRecommendation({
      domain: 'real-estate',
      title: 'Emergency Estate Readiness Dispatch — Castellano / Marchetti Arrival T-18h',
      summary:
        '4 open checklist items, 2 critical sensor breaches, VIP arrival in 18 hours. ' +
        'Immediate dispatch required: pool technician (4h ETA), cellar HVAC engineer (2h ETA), ' +
        'housekeeping for linen, security for access code reset.',
      rationale:
        '4-signal correlation in 2-hour window: pool offline + wine cellar breach + VIP arrival + escalation timeout. ' +
        'Aggregate confidence 0.98. $45K guest satisfaction value at risk. ' +
        'Estate readiness at 60% with 18h window.',
      suggestedAction: 'execute',
      actionPayload: {
        dispatchOrders: [
          {
            vendor: 'Pool Systems UAE',
            service: 'Pool heating repair',
            etaHours: 4,
            priority: 'critical',
          },
          {
            vendor: 'ColdChain HVAC',
            service: 'Wine cellar temperature correction',
            etaHours: 2,
            priority: 'critical',
          },
          { service: 'Housekeeping — Master suite linen change', etaHours: 1, priority: 'high' },
          { service: 'Security — Access code reset', etaHours: 0.5, priority: 'high' },
        ],
        propertyId: 'property-castellano',
        guestId: 'guest-marchetti',
      },
      confidence: 0.97,
      freshness: 0.95,
      projectedImpact:
        'Dispatch resolves all 4 open items before VIP arrival, restoring estate readiness to 100% and protecting $45K guest-satisfaction revenue.',
      projectedRisk:
        'Without action, estate readiness remains at 60% — pool offline, cellar breach unresolved, and access codes unrotated — putting $45K of revenue at risk within 18 hours.',
      projectedImpactUsd: 45_000,
      projectedRiskReductionPct: 90,
      policyEvaluation: { outcome: 'pending', policyIds: [] },
      evidenceIds: evidenceItems.map((e) => e.evidenceId),
      signalIds: signals.map((s) => s.signalId),
      entityRefs: [this.entities.property, this.entities.guest],
      generatedBy: 'signal-pipeline/correlate-score-recommend',
      provenance: { sourceService: 'signal-mesh-seed' },
      generatedAt: new Date().toISOString(),
      tags: ['carlota-jo', 'estate-readiness', 'vip', 'dispatch'],
    });
  },
} as const;
