/**
 * Demo Narrative: Counsel — Deadline + Dependency Conflict
 *
 * Scenario: Regulatory filing deadline in 11 days. Two obligations depend on a
 * discovery request that has gone unanswered for 18 days. Outside counsel on
 * the matter has 3 deliverables overdue. $4.1M exposure if deadline missed.
 * Signal mesh clusters into escalation + parallel track recommendation.
 */

import type { Signal } from '@workspace/ontology/signal';
import type { EvidenceItem, Recommendation } from '@workspace/ontology';
import { createSignal, createEvidenceItem, createRecommendation } from '@workspace/ontology';

export type CounselDeadlineNarrative = typeof COUNSEL_DEADLINE_NARRATIVE;

export const COUNSEL_DEADLINE_NARRATIVE = {
  id: 'counsel-deadline',
  title: 'Counsel — Looming Deadline + Dependency Conflict',
  domain: 'legal' as const,
  org: 'Meridian Group',
  personas: ['general-counsel', 'legal-ops-manager'],
  duration: '8 minutes',

  scenario: {
    name: 'Regulatory Filing Deadline Risk Cluster',
    summary:
      'A regulatory filing deadline is 11 days away. Two critical obligations are blocked by a discovery request that is 18 days overdue. Additionally, the assigned outside counsel has three other deliverables overdue. Total financial exposure is estimated at $4.1M if the deadline is missed.',
    clusterSize: 4,
    estimatedSavingsPerDayUsd: 0,
    peakRiskExposureUsd: 4_100_000,
  },

  entities: {
    matter: {
      entityId: 'matter-meridian-compliance-v3',
      entityType: 'matter' as const,
      displayName: 'Meridian Compliance v.3',
      domain: 'legal' as const,
    },
    outsideCounsel: {
      entityId: 'firm-morrison-vance',
      entityType: 'counsel_firm' as const,
      displayName: 'Morrison & Vance LLP',
      domain: 'legal' as const,
    },
    discoveryRequest: {
      entityId: 'obl-discovery-001',
      entityType: 'obligation' as const,
      displayName: 'Discovery Request #001',
      domain: 'legal' as const,
    },
    filingDeadline: {
      entityId: 'obl-filing-001',
      entityType: 'obligation' as const,
      displayName: 'Regulatory Filing Filing',
      domain: 'legal' as const,
    },
  },

  buildSignals(): Signal[] {
    const now = Date.now();

    return [
      createSignal({
        source: 'connector',
        type: 'threshold-breach',
        domain: 'legal',
        occurredAt: new Date(now - 1 * 60_000).toISOString(),
        freshness: 0.95,
        confidence: 1.0,
        severity: 'high',
        entityRefs: [this.entities.filingDeadline as any],
        rawPayload: {
          eventType: 'deadline_proximity',
          daysRemaining: 11,
          deadlineDate: new Date(now + 11 * 24 * 60 * 60_000).toISOString(),
        },
        tags: ['deadline', 'regulatory', 'filing'],
        provenance: { connectorId: 'demo-clm', sourceService: 'signal-mesh-seed' },
      }),

      createSignal({
        source: 'connector',
        type: 'anomaly',
        domain: 'legal',
        occurredAt: new Date(now - 30 * 60_000).toISOString(),
        freshness: 0.9,
        confidence: 0.98,
        severity: 'critical',
        entityRefs: [this.entities.discoveryRequest as any],
        rawPayload: {
          eventType: 'unanswered_dependency',
          daysOverdue: 18,
          blockerFor: ['obl-filing-001', 'obl-compliance-002'],
        },
        tags: ['dependency', 'blocker', 'discovery'],
        provenance: { connectorId: 'demo-clm', sourceService: 'signal-mesh-seed' },
      }),

      createSignal({
        source: 'connector',
        type: 'threshold-breach',
        domain: 'legal',
        occurredAt: new Date(now - 120 * 60_000).toISOString(),
        freshness: 0.85,
        confidence: 0.95,
        severity: 'medium',
        entityRefs: [this.entities.outsideCounsel as any],
        rawPayload: {
          eventType: 'counsel_performance_drift',
          overdueDeliverables: 3,
          averageResponseTimeHours: 72,
        },
        tags: ['counsel-performance', 'overdue'],
        provenance: { connectorId: 'demo-billing-legal', sourceService: 'signal-mesh-seed' },
      }),

      createSignal({
        source: 'connector',
        type: 'market-signal',
        domain: 'legal',
        occurredAt: new Date(now - 180 * 60_000).toISOString(),
        freshness: 0.8,
        confidence: 0.9,
        severity: 'high',
        entityRefs: [this.entities.matter as any],
        rawPayload: {
          eventType: 'exposure_assessment',
          estimatedPenaltyUsd: 4_100_000,
          riskType: 'regulatory_non_compliance',
        },
        tags: ['risk', 'exposure', 'financial'],
        provenance: { connectorId: 'demo-risk-engine', sourceService: 'signal-mesh-seed' },
      }),
    ];
  },

  buildEvidenceItems(signals: Signal[]): EvidenceItem[] {
    return [
      createEvidenceItem({
        type: 'regulatory-rule',
        domain: 'legal',
        signalId: (signals[0] as any).signalId,
        entityRefs: [this.entities.filingDeadline as any],
        summary: 'Regulatory filing deadline is 11 days away — high urgency',
        confidence: 1.0,
        freshness: 0.95,
        weight: 0.3,
        observedAt: (signals[0] as any).occurredAt,
        tags: ['deadline'],
      }),
      createEvidenceItem({
        type: 'signal',
        domain: 'legal',
        signalId: (signals[1] as any).signalId,
        entityRefs: [this.entities.discoveryRequest as any],
        summary: 'Discovery Request #001 is 18 days overdue, blocking 2 critical obligations',
        confidence: 0.98,
        freshness: 0.9,
        weight: 0.4,
        observedAt: (signals[1] as any).occurredAt,
        tags: ['dependency', 'blocker'],
      }),
      createEvidenceItem({
        type: 'threshold-trigger',
        domain: 'legal',
        signalId: (signals[2] as any).signalId,
        entityRefs: [this.entities.outsideCounsel as any],
        summary: 'Morrison & Vance LLP has 3 overdue deliverables — systemic performance risk',
        confidence: 0.95,
        freshness: 0.85,
        weight: 0.15,
        observedAt: (signals[2] as any).occurredAt,
        tags: ['performance'],
      }),
      createEvidenceItem({
        type: 'market-data',
        domain: 'legal',
        signalId: (signals[3] as any).signalId,
        entityRefs: [this.entities.matter as any],
        summary: '$4.1M estimated financial exposure from regulatory non-compliance',
        confidence: 0.9,
        freshness: 0.8,
        weight: 0.15,
        observedAt: (signals[3] as any).occurredAt,
        tags: ['exposure'],
      }),
    ];
  },

  buildRecommendation(signals: Signal[], evidenceItems: EvidenceItem[]): Recommendation {
    return createRecommendation({
      domain: 'legal',
      title: 'Escalate Discovery + Initiate Parallel Filing Track',
      summary:
        'Looming deadline (11d) combined with an 18-day discovery blockage and counsel performance drift requires immediate intervention to avoid $4.1M exposure.',
      rationale:
        'Critical cluster: 11-day filing deadline is hard-blocked by an 18-day overdue discovery request. ' +
        'Assigned counsel shows performance lag (3 overdue items). ' +
        'Aggregate confidence 0.94. Financial exposure $4.1M.',
      suggestedAction: 'escalate',
      actionPayload: {
        matterId: 'matter-meridian-compliance-v3',
        escalationTarget: 'Managing Partner, Morrison & Vance',
        parallelTrack: 'Prepare filing with placeholder data (Draft B)',
        estimatedRiskReductionUsd: 4_100_000,
      },
      confidence: 0.94,
      freshness: 0.92,
      projectedImpact:
        'Parallel filing track eliminates deadline breach risk and preserves $4.1M litigation position over the next 11 days.',
      projectedRisk:
        'Discovery blockage plus counsel performance lag leaves zero defense coverage in 11 days — $4.1M exposure crystallises on missed filing deadline.',
      projectedImpactUsd: 4_100_000,
      projectedRiskReductionPct: 85,
      policyEvaluation: { outcome: 'pending', policyIds: [] },
      evidenceIds: evidenceItems.map((e) => e.evidenceId),
      signalIds: signals.map((s) => (s as any).signalId),
      entityRefs: [
        this.entities.matter as any,
        this.entities.outsideCounsel as any,
        this.entities.filingDeadline as any,
      ],
      generatedBy: 'signal-pipeline/legal-risk-correlator',
      provenance: { sourceService: 'signal-mesh-seed' },
      generatedAt: new Date().toISOString(),
      tags: ['legal', 'deadline', 'risk', 'escalation'],
    });
  },
} as const;
