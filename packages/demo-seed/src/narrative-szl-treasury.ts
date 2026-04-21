/**
 * Demo Narrative: SZL Holdings — Treasury Risk Cluster
 *
 * Scenario: SZL Holdings CFO faces a compound treasury risk event:
 * FX hedge ratio drifted beyond 15% threshold, a liquidity covenant
 * breach warning on the revolving credit facility, and an unrealized
 * MTM loss of $2.8M on the commodity derivative book.
 * The signal mesh correlates three signals into a single treasury-action
 * recommendation with a board-level approval gate.
 *
 * Flow: FX drift signal → covenant breach warning → MTM loss breach →
 *       correlation cluster → treasury action recommendation → CFO approval
 */

import type { Signal } from '@workspace/ontology/signal';
import type { EvidenceItem, Recommendation } from '@workspace/ontology';
import { createSignal, createEvidenceItem, createRecommendation } from '@workspace/ontology';

export type SzlTreasuryNarrative = typeof SZL_TREASURY_NARRATIVE;

export const SZL_TREASURY_NARRATIVE = {
  id: 'szl-treasury',
  title: 'SZL Holdings — Treasury Risk Cluster',
  domain: 'finance' as const,
  org: 'SZL Holdings',
  personas: ['cfo', 'treasury-analyst'],
  duration: '8 minutes',

  scenario: {
    name: 'Treasury Risk Trifecta — FX Drift + Covenant Warning + MTM Loss',
    summary:
      'FX hedge ratio at 18% (threshold 15%). Revolving credit facility liquidity covenant within 3% of breach. ' +
      'Commodity derivative book showing $2.8M unrealized MTM loss. ' +
      'Aggregate treasury exposure: $14.2M. Board-level notification required.',
    aggregateExposureUsd: 14_200_000,
    boardApprovalRequired: true,
  },

  entities: {
    org: {
      entityId: 'org-szl-holdings',
      entityType: 'organization' as const,
      displayName: 'SZL Holdings',
      domain: 'finance' as const,
    },
    rcf: {
      entityId: 'facility-rcf-001',
      entityType: 'custom' as const,
      displayName: 'Revolving Credit Facility #001',
      domain: 'finance' as const,
    },
    derivativeBook: {
      entityId: 'book-commodity-derivatives',
      entityType: 'custom' as const,
      displayName: 'Commodity Derivative Book',
      domain: 'finance' as const,
    },
  },

  buildSignals(): Signal[] {
    const now = Date.now();

    return [
      createSignal({
        source: 'connector',
        type: 'threshold-breach',
        domain: 'finance',
        occurredAt: new Date(now - 45 * 60_000).toISOString(),
        freshness: 0.9,
        confidence: 0.99,
        severity: 'high',
        entityRefs: [this.entities.org],
        rawPayload: {
          eventType: 'fx_hedge_drift',
          metric: 'hedge_ratio',
          currentValue: 18.2,
          threshold: 15,
          delta: 3.2,
          currency: 'USD',
          exposureUsd: 4_800_000,
        },
        tags: ['fx', 'hedge', 'treasury', 'szl-holdings'],
        provenance: { connectorId: 'demo-messaging', sourceService: 'signal-mesh-seed' },
      }),

      createSignal({
        source: 'connector',
        type: 'risk',
        domain: 'finance',
        occurredAt: new Date(now - 30 * 60_000).toISOString(),
        freshness: 0.92,
        confidence: 0.96,
        severity: 'high',
        entityRefs: [this.entities.rcf],
        rawPayload: {
          eventType: 'covenant_breach_warning',
          facilityId: 'facility-rcf-001',
          facilityName: 'Revolving Credit Facility #001',
          covenantType: 'minimum_liquidity_ratio',
          currentRatio: 1.23,
          minimumRatio: 1.2,
          headroomPct: 2.5,
          facilityAmountUsd: 50_000_000,
          drawnUsd: 38_000_000,
        },
        tags: ['covenant', 'liquidity', 'credit', 'treasury', 'szl-holdings'],
        provenance: { connectorId: 'demo-messaging', sourceService: 'signal-mesh-seed' },
      }),

      createSignal({
        source: 'connector',
        type: 'threshold-breach',
        domain: 'finance',
        occurredAt: new Date(now - 20 * 60_000).toISOString(),
        freshness: 0.94,
        confidence: 0.98,
        severity: 'high',
        entityRefs: [this.entities.derivativeBook],
        rawPayload: {
          eventType: 'mtm_loss_breach',
          bookId: 'book-commodity-derivatives',
          unrealizedLossUsd: 2_800_000,
          threshold: 2_000_000,
          underlyings: ['Brent Crude', 'Natural Gas', 'Copper'],
          valuationDate: new Date(now - 20 * 60_000).toISOString(),
        },
        tags: ['mtm', 'derivatives', 'commodity', 'treasury', 'szl-holdings'],
        provenance: { connectorId: 'demo-messaging', sourceService: 'signal-mesh-seed' },
      }),
    ];
  },

  buildEvidenceItems(signals: Signal[]): EvidenceItem[] {
    return [
      createEvidenceItem({
        type: 'threshold-trigger',
        domain: 'finance',
        signalId: signals[0]?.signalId,
        entityRefs: [this.entities.org],
        summary:
          'FX hedge ratio at 18.2% — 3.2 percentage points beyond 15% policy limit. $4.8M unhedged exposure.',
        confidence: 0.99,
        freshness: 0.9,
        weight: 0.35,
        observedAt: signals[0]?.occurredAt ?? new Date().toISOString(),
        tags: ['fx', 'hedge'],
      }),
      createEvidenceItem({
        type: 'regulatory-rule',
        domain: 'finance',
        signalId: signals[1]?.signalId,
        entityRefs: [this.entities.rcf],
        summary:
          'Liquidity covenant headroom at 2.5% — breaching at 1.2x ratio. $50M facility at risk.',
        confidence: 0.96,
        freshness: 0.92,
        weight: 0.4,
        observedAt: signals[1]?.occurredAt ?? new Date().toISOString(),
        tags: ['covenant', 'credit-facility'],
      }),
      createEvidenceItem({
        type: 'signal',
        domain: 'finance',
        signalId: signals[2]?.signalId,
        entityRefs: [this.entities.derivativeBook],
        summary: '$2.8M unrealized MTM loss on commodity derivative book — exceeds $2M threshold.',
        confidence: 0.98,
        freshness: 0.94,
        weight: 0.25,
        observedAt: signals[2]?.occurredAt ?? new Date().toISOString(),
        tags: ['mtm', 'derivatives'],
      }),
    ];
  },

  buildRecommendation(signals: Signal[], evidenceItems: EvidenceItem[]): Recommendation {
    return createRecommendation({
      domain: 'finance',
      title: 'Treasury Risk Trifecta — CFO Action Required: Hedge Rebalance + Covenant Cure',
      summary:
        'Three concurrent treasury risk signals exceed policy thresholds. ' +
        'Recommended actions: (1) Rebalance FX hedge to 13% ratio, (2) Draw $5M on RCF to restore liquidity headroom, ' +
        '(3) Partial unwind of commodity derivative positions to crystallize loss and reduce MTM exposure.',
      rationale:
        '3-signal correlation in 45-minute window: FX drift + covenant warning + MTM loss. ' +
        'Aggregate treasury exposure $14.2M. Board-level notification policy triggered. ' +
        'Covenant breach would trigger cross-default on $120M total debt.',
      suggestedAction: 'approve',
      actionPayload: {
        actions: [
          { action: 'FX hedge rebalance to 13%', urgency: 'today', approver: 'cfo' },
          {
            action: 'Draw $5M on RCF #001 to restore liquidity ratio to 1.28x',
            urgency: 'today',
            approver: 'cfo',
          },
          {
            action: 'Unwind 40% of Brent Crude positions — crystallize $1.1M loss',
            urgency: 'this-week',
            approver: 'board',
          },
        ],
        aggregateExposureUsd: 14_200_000,
        boardNotificationRequired: true,
      },
      confidence: 0.96,
      freshness: 0.92,
      projectedImpact:
        'Hedge rebalance and RCF draw restore liquidity ratio to 1.28x and prevent $14.2M covenant breach before board notification threshold.',
      projectedRisk:
        'Inaction triggers cross-default on $120M total debt and board notification requirement within 24 hours if covenant threshold is breached.',
      projectedImpactUsd: 14_200_000,
      projectedRiskReductionPct: 68,
      projectedRiskIncreaseUsd: 1_100_000,
      policyEvaluation: { outcome: 'pending', policyIds: [] },
      evidenceIds: evidenceItems.map((e) => e.evidenceId),
      signalIds: signals.map((s) => s.signalId),
      entityRefs: [this.entities.org, this.entities.rcf, this.entities.derivativeBook],
      generatedBy: 'signal-pipeline/correlate-score-recommend',
      provenance: { sourceService: 'signal-mesh-seed' },
      generatedAt: new Date().toISOString(),
      tags: ['szl-holdings', 'treasury', 'finance', 'board-gate'],
    });
  },
} as const;
