/**
 * Signal Pipeline — 9-stage processing engine.
 *
 * Stages (in order):
 *   1. intake           — validate, stamp, assign signalId
 *   2. normalize        — canonical field mapping, unit conversion
 *   3. enrich           — attach contextual metadata from entity registry
 *   4. entity-resolve   — match entityRefs to known EntitySnapshots
 *   5. correlate        — cluster related signals, detect patterns
 *   6. score            — compute severity + freshness + opportunity scores
 *   7. recommend        — generate Recommendation if score threshold met
 *   8. policy-evaluate  — stub: mark allow/require-approval/block
 *   9. telemetry-writeback — publish final signal to bus, log telemetry
 */

import {
  createEvidenceItem,
  createRecommendation,
  createSignal,
  defaultEntityRegistry,
  type EvidenceItem,
  type Recommendation,
  type Signal,
  type SignalInput,
} from '@workspace/ontology';
import { defaultSignalBus, type SignalBus } from './bus.js';

export interface PipelineResult {
  signal: Signal;
  evidenceItems: EvidenceItem[];
  recommendation: Recommendation | null;
  stages: Array<{ stage: Signal['stage']; durationMs: number; notes?: string }>;
}

export interface PipelineConfig {
  bus?: SignalBus;
  scoreThreshold?: number;
  maxCorrelationWindow?: number;
}

export class SignalPipeline {
  private readonly bus: SignalBus;
  private readonly scoreThreshold: number;
  private readonly recentSignals: Signal[] = [];
  private readonly MAX_RECENT = 1_000;

  constructor(config: PipelineConfig = {}) {
    this.bus = config.bus ?? defaultSignalBus;
    this.scoreThreshold = config.scoreThreshold ?? 0.55;
  }

  async process(input: SignalInput): Promise<PipelineResult> {
    const stages: PipelineResult['stages'] = [];
    const evidenceItems: EvidenceItem[] = [];
    let recommendation: Recommendation | null = null;

    const t0 = Date.now();

    let signal = await this.stage_intake(input);
    stages.push({ stage: 'intake', durationMs: Date.now() - t0 });

    let t = Date.now();
    signal = await this.stage_normalize(signal);
    stages.push({ stage: 'normalize', durationMs: Date.now() - t });

    t = Date.now();
    signal = await this.stage_enrich(signal);
    stages.push({ stage: 'enrich', durationMs: Date.now() - t });

    t = Date.now();
    signal = await this.stage_entityResolve(signal);
    stages.push({ stage: 'entity-resolve', durationMs: Date.now() - t });

    t = Date.now();
    const { signal: correlatedSignal, correlated } = await this.stage_correlate(signal);
    signal = correlatedSignal;
    stages.push({
      stage: 'correlate',
      durationMs: Date.now() - t,
      notes: `${correlated.length} correlated`,
    });

    t = Date.now();
    const scored = await this.stage_score(signal, correlated);
    signal = scored.signal;
    stages.push({
      stage: 'score',
      durationMs: Date.now() - t,
      notes: `score=${scored.score.toFixed(2)}`,
    });

    if (scored.score >= this.scoreThreshold) {
      t = Date.now();
      const recResult = await this.stage_recommend(signal, correlated, scored.score);
      signal = recResult.signal;
      recommendation = recResult.recommendation;
      evidenceItems.push(...recResult.evidenceItems);
      stages.push({ stage: 'recommend', durationMs: Date.now() - t });

      t = Date.now();
      if (recommendation) {
        recommendation = await this.stage_policyEvaluate(recommendation, signal);
      }
      stages.push({ stage: 'policy-evaluate', durationMs: Date.now() - t });
    } else {
      stages.push({ stage: 'recommend', durationMs: 0, notes: 'skipped (score below threshold)' });
      stages.push({ stage: 'policy-evaluate', durationMs: 0, notes: 'skipped' });
    }

    t = Date.now();
    signal = await this.stage_telemetryWriteback(signal, recommendation);
    stages.push({ stage: 'telemetry-writeback', durationMs: Date.now() - t });

    this.recentSignals.push(signal);
    if (this.recentSignals.length > this.MAX_RECENT) this.recentSignals.shift();

    return { signal, evidenceItems, recommendation, stages };
  }

  private async stage_intake(input: SignalInput): Promise<Signal> {
    return createSignal(input);
  }

  private async stage_normalize(signal: Signal): Promise<Signal> {
    const normalized: Record<string, unknown> = { ...signal.rawPayload };

    if (typeof normalized.ts === 'number') {
      normalized.occurredAt = new Date(normalized.ts as number).toISOString();
    }
    if (typeof normalized.value === 'string' && !Number.isNaN(Number(normalized.value))) {
      normalized.value = Number(normalized.value);
    }

    return {
      ...signal,
      normalizedPayload: normalized,
      stage: 'normalize',
    };
  }

  private async stage_enrich(signal: Signal): Promise<Signal> {
    const entityRefs = [...signal.entityRefs];

    for (const ref of entityRefs) {
      const snapshot = defaultEntityRegistry.get(ref.entityId);
      if (snapshot) {
        Object.assign(ref, {
          displayName: ref.displayName ?? snapshot.displayName,
          domain: ref.domain ?? snapshot.domain,
        });
      }
    }

    const tags = [...signal.tags];
    if (signal.severity === 'critical' || signal.severity === 'high') {
      tags.push('high-priority');
    }

    return {
      ...signal,
      entityRefs,
      tags,
      stage: 'enrich',
    };
  }

  private async stage_entityResolve(signal: Signal): Promise<Signal> {
    const resolvedRefs = signal.entityRefs.map((ref) => {
      const snapshot = defaultEntityRegistry.get(ref.entityId);
      if (snapshot) {
        defaultEntityRegistry.linkSignal(ref.entityId, signal.signalId);
      }
      return snapshot
        ? {
            ...ref,
            displayName: snapshot.displayName,
            domain: snapshot.domain ?? ref.domain,
            externalIds: { ...snapshot.externalIds, ...ref.externalIds },
          }
        : ref;
    });

    return { ...signal, entityRefs: resolvedRefs, stage: 'entity-resolve' };
  }

  private async stage_correlate(signal: Signal): Promise<{ signal: Signal; correlated: Signal[] }> {
    const windowMs = 15 * 60 * 1_000;
    const now = new Date(signal.occurredAt).getTime();

    const correlated = this.recentSignals.filter((s) => {
      if (s.signalId === signal.signalId) return false;
      if (s.domain !== signal.domain) return false;
      const age = now - new Date(s.occurredAt).getTime();
      if (age > windowMs) return false;
      const sameEntity = s.entityRefs.some((ref) =>
        signal.entityRefs.some((r) => r.entityId === ref.entityId),
      );
      return sameEntity || s.type === signal.type;
    });

    return {
      signal: {
        ...signal,
        correlatedSignalIds: correlated.map((s) => s.signalId),
        stage: 'correlate',
      },
      correlated,
    };
  }

  private async stage_score(
    signal: Signal,
    correlated: Signal[],
  ): Promise<{ signal: Signal; score: number }> {
    const severityWeight: Record<string, number> = {
      critical: 1.0,
      high: 0.8,
      medium: 0.5,
      low: 0.3,
      info: 0.1,
    };

    const baseScore = severityWeight[signal.severity ?? 'info'] ?? 0.1;
    const correlationBoost = Math.min(correlated.length * 0.1, 0.3);
    const freshnessBoost = signal.freshness * 0.1;
    const confidenceBoost = signal.confidence * 0.1;

    const score = Math.min(baseScore + correlationBoost + freshnessBoost + confidenceBoost, 1.0);

    return {
      signal: {
        ...signal,
        opportunityScore: signal.type === 'opportunity' ? score : signal.opportunityScore,
        stage: 'score',
      },
      score,
    };
  }

  private async stage_recommend(
    signal: Signal,
    correlated: Signal[],
    score: number,
  ): Promise<{ signal: Signal; recommendation: Recommendation; evidenceItems: EvidenceItem[] }> {
    const primaryEntity = signal.entityRefs[0];

    const ev1 = createEvidenceItem({
      type: 'signal',
      domain: signal.domain,
      signalId: signal.signalId,
      entityRefs: signal.entityRefs,
      summary: `Primary signal: ${signal.type} detected in ${signal.domain}`,
      detail: JSON.stringify(signal.normalizedPayload ?? signal.rawPayload).slice(0, 500),
      confidence: signal.confidence,
      freshness: signal.freshness,
      weight: 0.6,
      observedAt: signal.occurredAt,
      provenance: signal.provenance,
      tags: ['primary-signal', signal.domain],
    });

    const evidenceItems: EvidenceItem[] = [ev1];

    if (correlated.length > 0) {
      const ev2 = createEvidenceItem({
        type: 'correlation-cluster',
        domain: signal.domain,
        entityRefs: signal.entityRefs,
        summary: `${correlated.length} correlated signal(s) within 15-minute window`,
        confidence: 0.8,
        freshness: signal.freshness,
        weight: 0.3,
        observedAt: signal.occurredAt,
        tags: ['correlation', signal.domain],
      });
      evidenceItems.push(ev2);
    }

    const action = recommendAction(signal);
    const impactUsd = estimateImpact(signal);

    const recommendation = createRecommendation({
      domain: signal.domain,
      title: buildRecommendationTitle(signal),
      summary: buildRecommendationSummary(signal, correlated),
      rationale: `Score ${score.toFixed(2)} — confidence ${signal.confidence.toFixed(2)}, severity ${signal.severity ?? 'unknown'}. ${correlated.length > 0 ? `Correlated with ${correlated.length} recent signal(s).` : ''}`,
      suggestedAction: action,
      actionPayload: {
        signalId: signal.signalId,
        entityId: primaryEntity?.entityId,
        domain: signal.domain,
        score,
      },
      confidence: Math.min(signal.confidence + score * 0.1, 1),
      freshness: signal.freshness,
      projectedImpact:
        impactUsd != null
          ? `Executing recommended action is estimated to protect or recover $${impactUsd.toLocaleString()} in ${signal.domain} domain value.`
          : `Executing recommended action addresses the ${signal.severity ?? 'elevated'}-severity signal and reduces operational exposure in ${signal.domain}.`,
      projectedRisk: `Without action, the ${signal.type} signal (severity: ${signal.severity ?? 'unknown'}, score: ${score.toFixed(2)}) remains unresolved and exposure escalates${correlated.length > 0 ? ` — correlated with ${correlated.length} additional signal(s)` : ''}.`,
      policyEvaluation: { outcome: 'pending', policyIds: [] },
      projectedImpactUsd: impactUsd,
      evidenceIds: evidenceItems.map((e) => e.evidenceId),
      signalIds: [signal.signalId, ...correlated.map((c) => c.signalId)],
      entityRefs: signal.entityRefs,
      generatedBy: 'signal-pipeline/score-recommend',
      provenance: signal.provenance,
      generatedAt: new Date().toISOString(),
      tags: [signal.domain, signal.type],
    });

    const updatedSignal: Signal = {
      ...signal,
      recommendationIds: [recommendation.recommendationId],
      evidenceItemIds: evidenceItems.map((e) => e.evidenceId),
      stage: 'recommend',
    };

    if (primaryEntity) {
      defaultEntityRegistry.linkRecommendation(
        primaryEntity.entityId,
        recommendation.recommendationId,
      );
    }

    return { signal: updatedSignal, recommendation, evidenceItems };
  }

  private async stage_policyEvaluate(rec: Recommendation, signal: Signal): Promise<Recommendation> {
    let outcome: Recommendation['policyEvaluation']['outcome'] = 'allow';

    if (signal.severity === 'critical') {
      outcome = 'require-approval';
    } else if (rec.projectedImpactUsd && rec.projectedImpactUsd > 500_000) {
      outcome = 'require-approval';
    } else if (signal.tags.includes('sanctions') || signal.tags.includes('blocked')) {
      outcome = 'block';
    }

    return {
      ...rec,
      policyEvaluation: {
        outcome,
        policyIds: ['policy-auto-approval-v1', 'policy-financial-threshold-v1'],
        reason:
          outcome === 'allow'
            ? 'Signal and impact within auto-execution parameters'
            : outcome === 'require-approval'
              ? 'Critical severity or high financial impact — operator approval required'
              : 'Signal matches block conditions',
        evaluatedAt: new Date().toISOString(),
      },
    };
  }

  private async stage_telemetryWriteback(
    signal: Signal,
    recommendation: Recommendation | null,
  ): Promise<Signal> {
    const final: Signal = {
      ...signal,
      processedAt: new Date().toISOString(),
      stage: 'telemetry-writeback',
    };
    this.bus.publish(final);
    if (recommendation) {
    }
    return final;
  }

  getRecentSignals(): Signal[] {
    return [...this.recentSignals];
  }
}

function recommendAction(signal: Signal): Recommendation['suggestedAction'] {
  const map: Partial<Record<Signal['type'], Recommendation['suggestedAction']>> = {
    anomaly: 'investigate',
    risk: 'escalate',
    opportunity: 'review',
    'threshold-breach': 'notify',
    'state-change': 'monitor',
    'position-update': 'monitor',
    'sanctions-match': 'quarantine',
    deadline: 'notify',
    escalation: 'approve',
    'market-signal': 'review',
    'compliance-flag': 'investigate',
  };
  return map[signal.type] ?? 'acknowledge';
}

function estimateImpact(signal: Signal): number | undefined {
  const raw = signal.rawPayload;
  if (typeof raw.financialImpactUsd === 'number') return raw.financialImpactUsd;
  if (typeof raw.cargoValue === 'number') return raw.cargoValue;
  if (typeof raw.dealValue === 'number') return raw.dealValue;
  return undefined;
}

function buildRecommendationTitle(signal: Signal): string {
  const entityName =
    signal.entityRefs[0]?.displayName ?? signal.entityRefs[0]?.entityId ?? signal.domain;
  const typeMap: Partial<Record<Signal['type'], string>> = {
    anomaly: 'Anomaly Detected',
    risk: 'Risk Escalation',
    opportunity: 'Opportunity Identified',
    'threshold-breach': 'Threshold Breach Alert',
    'sanctions-match': 'Sanctions Screening Alert',
    'compliance-flag': 'Compliance Flag',
    deadline: 'Deadline Alert',
    escalation: 'Escalation Required',
    'state-change': 'State Change Notification',
  };
  return `${typeMap[signal.type] ?? 'Signal Alert'} — ${entityName}`;
}

function buildRecommendationSummary(signal: Signal, correlated: Signal[]): string {
  const entityName = signal.entityRefs[0]?.displayName ?? 'unknown entity';
  const extra =
    correlated.length > 0 ? ` Correlated with ${correlated.length} related signal(s).` : '';
  return `${signal.type} signal detected for ${entityName} in the ${signal.domain} domain.${extra}`;
}

export const defaultPipeline = new SignalPipeline();
