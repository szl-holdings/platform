import { randomUUID } from 'node:crypto';
import { computePriorityScore } from './scorer.js';
import { type BusinessImpact, type DecisionEngineResult, type RankingWeights, type Recommendation, type Signal, type SignalBatch, RankingWeightsSchema } from './types.js';

const DEFAULT_WEIGHTS = RankingWeightsSchema.parse({});

function deriveUrgency(priority: number): Recommendation['urgency'] {
  if (priority >= 80) return 'critical';
  if (priority >= 60) return 'urgent';
  if (priority >= 35) return 'moderate';
  return 'routine';
}

export interface SignalGroup {
  domain: string;
  signals: Signal[];
  businessImpact: BusinessImpact;
  confidence: number;
  suggestedAction: string;
  suggestedOwner?: string;
  estimatedCostUsd?: number;
  evidence?: Recommendation['evidence'];
  customTitle?: string;
  customSummary?: string;
  customReasoning?: string;
}

export function rankSignalGroups(
  groups: SignalGroup[],
  weights: Partial<RankingWeights> = {},
): Recommendation[] {
  const resolvedWeights = RankingWeightsSchema.parse({ ...DEFAULT_WEIGHTS, ...weights });

  const recs: Recommendation[] = groups.map((group) => {
    const priority = computePriorityScore({
      businessImpact: group.businessImpact,
      urgency: 'routine',
      confidence: group.confidence,
      signals: group.signals,
      weights: resolvedWeights,
    });

    const urgency = deriveUrgency(priority);

    const title =
      group.customTitle ??
      `${urgency === 'critical' ? 'CRITICAL: ' : urgency === 'urgent' ? 'URGENT: ' : ''}${group.suggestedAction}`;

    const summary =
      group.customSummary ??
      `${group.signals.length} signal(s) from ${group.domain} require attention. Recommended action: ${group.suggestedAction}.`;

    const reasoning = group.customReasoning ?? buildReasoning(group, priority);

    return {
      id: randomUUID(),
      title,
      summary,
      reasoning,
      domain: group.domain,
      sourceSignals: group.signals,
      confidence: group.confidence,
      urgency,
      priority,
      businessImpact: group.businessImpact,
      suggestedAction: group.suggestedAction,
      suggestedOwner: group.suggestedOwner,
      estimatedCostUsd: group.estimatedCostUsd,
      evidence:
        group.evidence && group.evidence.length > 0
          ? group.evidence
          : group.signals.length > 0
            ? group.signals
                .slice(0, 3)
                .map((s) => ({ label: s.source, value: s.type, source: s.source }))
            : [{ label: 'system', value: 'no source signals available — review required' }],
      policyState: 'unchecked',
      approvalState: 'none',
      executionStatus: 'none',
      createdAt: Date.now(),
    };
  });

  return recs.sort((a, b) => b.priority - a.priority);
}

function buildReasoning(group: SignalGroup, priority: number): string {
  const lines: string[] = [`Priority score: ${priority}/100.`];

  if (group.businessImpact.financialExposureUsd !== undefined) {
    lines.push(
      `Financial exposure: $${group.businessImpact.financialExposureUsd.toLocaleString()}.`,
    );
  }
  if (group.businessImpact.regulatoryExposure) {
    lines.push('Regulatory exposure detected — legal review may be required.');
  }
  if ((group.businessImpact.crossDomainBlastRadius?.length ?? 0) > 0) {
    lines.push(
      `Cross-domain impact detected in: ${group.businessImpact.crossDomainBlastRadius?.join(', ')}.`,
    );
  }
  if (group.signals.length > 0) {
    lines.push(`Based on ${group.signals.length} signal(s) from domain '${group.domain}'.`);
    const sources = [...new Set(group.signals.map((s) => s.source))];
    lines.push(`Signal sources: ${sources.join(', ')}.`);
  }
  lines.push(`Confidence: ${Math.round(group.confidence * 100)}%.`);

  return lines.join(' ');
}

export function evaluateSignalBatch(
  batch: SignalBatch,
  buildGroups: (signals: Signal[]) => SignalGroup[],
  weights?: Partial<RankingWeights>,
): DecisionEngineResult {
  const groups = buildGroups(batch.signals);
  const recommendations = rankSignalGroups(groups, weights);

  return {
    recommendations,
    totalSignalsEvaluated: batch.signals.length,
    evaluatedAt: Date.now(),
    engineVersion: '1.0.0',
  };
}
