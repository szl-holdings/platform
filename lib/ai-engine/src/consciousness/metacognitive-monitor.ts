import { randomUUID } from 'crypto';

export type CertaintyLevel = 'very_high' | 'high' | 'moderate' | 'low' | 'very_low';
export type ReasoningQuality = 'rigorous' | 'adequate' | 'uncertain' | 'confused' | 'degraded';
export type CognitiveLoad = 'minimal' | 'light' | 'moderate' | 'heavy' | 'overloaded';

export interface MetacognitiveAssessment {
  assessmentId: string;
  timestamp: string;
  certaintyLevel: CertaintyLevel;
  reasoningQuality: ReasoningQuality;
  cognitiveLoad: CognitiveLoad;
  confusionSignals: string[];
  knowledgeGaps: string[];
  calibrationDrift: number;
  introspectionNotes: string;
  shouldSeekClarification: boolean;
  shouldDeferToHuman: boolean;
  confidenceInConfidence: number;
}

export interface PredictiveUncertainty {
  predictionId: string;
  agentId: string;
  domain: string;
  predictedFailureProbability: number;
  queryComplexityScore: number;
  agentTrackRecord: number;
  knowledgeGapSignal: number;
  hallucinationRisk: HallucinationRisk;
  recommendation: 'proceed' | 'caution' | 'multi_hypothesis' | 'defer';
  timestamp: string;
}

export interface HallucinationRisk {
  overallScore: number;
  sourceDiversityIndex: number;
  claimGroundingRatio: number;
  confidenceEvidenceMismatch: number;
  flags: string[];
}

export interface MultiHypothesisBranch {
  branchId: string;
  hypothesis: string;
  confidence: number;
  evidenceSupport: number;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'active' | 'preferred' | 'rejected';
}

export interface MetacognitiveState {
  currentAssessment: MetacognitiveAssessment | null;
  recentAssessments: MetacognitiveAssessment[];
  rollingCertainty: number;
  rollingQuality: number;
  confusionStreak: number;
  totalAssessments: number;
  predictiveUncertainties: PredictiveUncertainty[];
  activeHypotheses: MultiHypothesisBranch[];
}

const CERTAINTY_SCORES: Record<CertaintyLevel, number> = {
  very_high: 0.95,
  high: 0.8,
  moderate: 0.6,
  low: 0.35,
  very_low: 0.15,
};

const QUALITY_SCORES: Record<ReasoningQuality, number> = {
  rigorous: 1.0,
  adequate: 0.75,
  uncertain: 0.5,
  confused: 0.25,
  degraded: 0.1,
};

const LOAD_SCORES: Record<CognitiveLoad, number> = {
  minimal: 0.1,
  light: 0.3,
  moderate: 0.5,
  heavy: 0.75,
  overloaded: 1.0,
};

function classifyCertainty(
  confidence: number,
  agentCount: number,
  conflictCount: number,
): CertaintyLevel {
  const conflictPenalty = conflictCount * 0.1;
  const multiAgentBonus = agentCount > 2 ? 0.05 : 0;
  const adjusted = confidence / 100 - conflictPenalty + multiAgentBonus;

  if (adjusted >= 0.9) return 'very_high';
  if (adjusted >= 0.7) return 'high';
  if (adjusted >= 0.5) return 'moderate';
  if (adjusted >= 0.3) return 'low';
  return 'very_low';
}

function classifyQuality(
  validationPassed: boolean,
  agentAgreement: number,
  hasEvidence: boolean,
  latencyMs: number,
): ReasoningQuality {
  let score = 0;
  if (validationPassed) score += 0.3;
  score += agentAgreement * 0.3;
  if (hasEvidence) score += 0.2;
  if (latencyMs < 10000) score += 0.1;
  else if (latencyMs > 30000) score -= 0.1;

  if (score >= 0.8) return 'rigorous';
  if (score >= 0.6) return 'adequate';
  if (score >= 0.4) return 'uncertain';
  if (score >= 0.2) return 'confused';
  return 'degraded';
}

function classifyLoad(
  agentCount: number,
  tokensBurned: number,
  toolCallCount: number,
): CognitiveLoad {
  const agentLoad = Math.min(1, agentCount / 8);
  const tokenLoad = Math.min(1, tokensBurned / 50000);
  const toolLoad = Math.min(1, toolCallCount / 20);
  const combined = agentLoad * 0.4 + tokenLoad * 0.35 + toolLoad * 0.25;

  if (combined >= 0.85) return 'overloaded';
  if (combined >= 0.65) return 'heavy';
  if (combined >= 0.4) return 'moderate';
  if (combined >= 0.2) return 'light';
  return 'minimal';
}

function detectConfusionSignals(
  agentResponses: Array<{ confidence: number; response: string }>,
  conflictCount: number,
): string[] {
  const signals: string[] = [];
  const lowConfAgents = agentResponses.filter((r) => r.confidence < 40);
  if (lowConfAgents.length > 0) {
    signals.push(`${lowConfAgents.length} agent(s) below 40% confidence — low-certainty zone`);
  }

  if (conflictCount >= 2) {
    signals.push(`${conflictCount} inter-agent conflicts detected — contradictory reasoning paths`);
  }

  const confSpread =
    agentResponses.length > 1
      ? Math.max(...agentResponses.map((r) => r.confidence)) -
        Math.min(...agentResponses.map((r) => r.confidence))
      : 0;
  if (confSpread > 50) {
    signals.push(`Confidence spread of ${confSpread}% across agents — high disagreement`);
  }

  const shortResponses = agentResponses.filter((r) => r.response.length < 100);
  if (shortResponses.length > agentResponses.length / 2) {
    signals.push('Majority of agents produced thin responses — possible knowledge gap');
  }

  return signals;
}

function detectKnowledgeGaps(
  query: string,
  agentResponses: Array<{ response: string; domain: string }>,
): string[] {
  const gaps: string[] = [];
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4);

  for (const resp of agentResponses) {
    const respLower = resp.response.toLowerCase();
    const hedgingPhrases = [
      'unclear',
      'uncertain',
      'insufficient data',
      'not enough information',
      'cannot determine',
      'limited visibility',
    ];
    const hedges = hedgingPhrases.filter((h) => respLower.includes(h));
    if (hedges.length > 0) {
      gaps.push(`${resp.domain}: expressed uncertainty — "${hedges[0]}"`);
    }
  }

  const uncoveredTerms = queryTerms.filter(
    (term) => !agentResponses.some((r) => r.response.toLowerCase().includes(term)),
  );
  if (uncoveredTerms.length > queryTerms.length * 0.4 && uncoveredTerms.length >= 2) {
    gaps.push(`Query terms not addressed: ${uncoveredTerms.slice(0, 4).join(', ')}`);
  }

  return gaps;
}

class MetacognitiveMonitor {
  private assessments: MetacognitiveAssessment[] = [];
  private rollingCertainty = 0.75;
  private rollingQuality = 0.75;
  private confusionStreak = 0;
  private predictiveHistory: PredictiveUncertainty[] = [];
  private hypotheses: MultiHypothesisBranch[] = [];
  private predictionOutcomes: Array<{ predicted: number; actual: number }> = [];
  private static readonly MAX_HISTORY = 500;
  private static readonly EMA_ALPHA = 0.15;
  private static readonly MAX_PREDICTIONS = 200;
  private static readonly MAX_HYPOTHESES = 10;

  assess(input: {
    query: string;
    agentResponses: Array<{ confidence: number; response: string; domain: string }>;
    conflictCount: number;
    validationPassed: boolean;
    tokensBurned: number;
    latencyMs: number;
    toolCallCount: number;
    tracerSignals?: { regressionRate: number; avgOverallScore: number; topWeaknesses: string[] };
    calibrationBias?: number;
  }): MetacognitiveAssessment {
    const avgConfidence =
      input.agentResponses.length > 0
        ? input.agentResponses.reduce((s, r) => s + r.confidence, 0) / input.agentResponses.length
        : 50;

    const agentAgreement =
      input.agentResponses.length > 1
        ? 1 -
          (Math.max(...input.agentResponses.map((r) => r.confidence)) -
            Math.min(...input.agentResponses.map((r) => r.confidence))) /
            100
        : 0.7;

    const hasEvidence = input.agentResponses.some((r) => r.response.length > 500);

    let effectiveConflicts = input.conflictCount;
    if (input.tracerSignals && input.tracerSignals.regressionRate > 0.15) {
      effectiveConflicts += Math.ceil(input.tracerSignals.regressionRate * 5);
    }

    let effectiveValidation = input.validationPassed;
    if (input.tracerSignals && input.tracerSignals.avgOverallScore < 0.4) {
      effectiveValidation = false;
    }

    const certaintyLevel = classifyCertainty(
      avgConfidence,
      input.agentResponses.length,
      effectiveConflicts,
    );
    const reasoningQuality = classifyQuality(
      effectiveValidation,
      agentAgreement,
      hasEvidence,
      input.latencyMs,
    );
    const cognitiveLoad = classifyLoad(
      input.agentResponses.length,
      input.tokensBurned,
      input.toolCallCount,
    );

    const confusionSignals = detectConfusionSignals(input.agentResponses, effectiveConflicts);
    if (input.tracerSignals) {
      for (const w of input.tracerSignals.topWeaknesses.slice(0, 2)) {
        confusionSignals.push(`Behavioral tracer weakness: ${w}`);
      }
    }
    if (input.calibrationBias !== undefined && Math.abs(input.calibrationBias) > 0.15) {
      confusionSignals.push(
        `Calibration drift: ${input.calibrationBias > 0 ? 'overconfident' : 'underconfident'} by ${(Math.abs(input.calibrationBias) * 100).toFixed(0)}%`,
      );
    }
    const knowledgeGaps = detectKnowledgeGaps(input.query, input.agentResponses);

    const certScore = CERTAINTY_SCORES[certaintyLevel];
    const qualScore = QUALITY_SCORES[reasoningQuality];

    this.rollingCertainty =
      this.rollingCertainty * (1 - MetacognitiveMonitor.EMA_ALPHA) +
      certScore * MetacognitiveMonitor.EMA_ALPHA;
    this.rollingQuality =
      this.rollingQuality * (1 - MetacognitiveMonitor.EMA_ALPHA) +
      qualScore * MetacognitiveMonitor.EMA_ALPHA;

    const isConfused =
      certaintyLevel === 'low' || certaintyLevel === 'very_low' || confusionSignals.length >= 2;
    this.confusionStreak = isConfused ? this.confusionStreak + 1 : 0;

    const calibrationDrift = Math.abs(this.rollingCertainty - avgConfidence / 100);

    const shouldSeekClarification =
      confusionSignals.length >= 2 || knowledgeGaps.length >= 2 || certaintyLevel === 'very_low';
    const shouldDeferToHuman =
      this.confusionStreak >= 3 ||
      (certaintyLevel === 'very_low' && cognitiveLoad === 'overloaded');
    const confidenceInConfidence = Math.max(
      0,
      Math.min(1, 1 - calibrationDrift - confusionSignals.length * 0.1),
    );

    let introspectionNotes = '';
    if (confusionSignals.length === 0 && knowledgeGaps.length === 0) {
      introspectionNotes = `Clear reasoning path. ${input.agentResponses.length} agents converged with ${certaintyLevel} certainty.`;
    } else {
      const parts: string[] = [];
      if (confusionSignals.length > 0) parts.push(`Confusion detected: ${confusionSignals[0]}`);
      if (knowledgeGaps.length > 0) parts.push(`Knowledge gap: ${knowledgeGaps[0]}`);
      if (this.confusionStreak > 1)
        parts.push(
          `Confusion streak: ${this.confusionStreak} consecutive uncertain orchestrations`,
        );
      introspectionNotes = parts.join('. ');
    }

    const assessment: MetacognitiveAssessment = {
      assessmentId: `meta_${Date.now()}_${randomUUID().slice(0, 6)}`,
      timestamp: new Date().toISOString(),
      certaintyLevel,
      reasoningQuality,
      cognitiveLoad,
      confusionSignals,
      knowledgeGaps,
      calibrationDrift,
      introspectionNotes,
      shouldSeekClarification,
      shouldDeferToHuman,
      confidenceInConfidence,
    };

    this.assessments.push(assessment);
    if (this.assessments.length > MetacognitiveMonitor.MAX_HISTORY) {
      this.assessments.splice(0, this.assessments.length - MetacognitiveMonitor.MAX_HISTORY);
    }

    return assessment;
  }

  predictUncertainty(input: {
    agentId: string;
    domain: string;
    queryComplexity: number;
    agentSuccessRate: number;
    agentAvgConfidence: number;
    knowledgeGapDomains: string[];
    queryLength: number;
    recentFailures: number;
  }): PredictiveUncertainty {
    const complexityFactor = Math.min(1, input.queryComplexity / 200);
    const trackRecordFactor = 1 - input.agentSuccessRate;
    const gapFactor = input.knowledgeGapDomains.includes(input.domain) ? 0.3 : 0;
    const recentFailureFactor = Math.min(0.4, input.recentFailures * 0.1);
    const confusionFactor =
      this.confusionStreak > 0 ? Math.min(0.2, this.confusionStreak * 0.05) : 0;

    const failureProbability = Math.min(
      1,
      Math.max(
        0,
        complexityFactor * 0.25 +
          trackRecordFactor * 0.3 +
          gapFactor +
          recentFailureFactor +
          confusionFactor,
      ),
    );

    const hallucinationRisk = this.computeHallucinationRisk(
      input.agentAvgConfidence,
      input.agentSuccessRate,
      input.queryLength,
      input.queryComplexity,
    );

    let recommendation: PredictiveUncertainty['recommendation'] = 'proceed';
    if (failureProbability > 0.7 || hallucinationRisk.overallScore > 0.7) {
      recommendation = 'defer';
    } else if (failureProbability > 0.5 || hallucinationRisk.overallScore > 0.5) {
      recommendation = 'multi_hypothesis';
    } else if (failureProbability > 0.3 || hallucinationRisk.overallScore > 0.3) {
      recommendation = 'caution';
    }

    const prediction: PredictiveUncertainty = {
      predictionId: `pred_${Date.now()}_${randomUUID().slice(0, 6)}`,
      agentId: input.agentId,
      domain: input.domain,
      predictedFailureProbability: failureProbability,
      queryComplexityScore: complexityFactor,
      agentTrackRecord: input.agentSuccessRate,
      knowledgeGapSignal: gapFactor,
      hallucinationRisk,
      recommendation,
      timestamp: new Date().toISOString(),
    };

    this.predictiveHistory.push(prediction);
    if (this.predictiveHistory.length > MetacognitiveMonitor.MAX_PREDICTIONS) {
      this.predictiveHistory.splice(
        0,
        this.predictiveHistory.length - MetacognitiveMonitor.MAX_PREDICTIONS,
      );
    }

    return prediction;
  }

  private computeHallucinationRisk(
    avgConfidence: number,
    successRate: number,
    queryLength: number,
    complexity: number,
  ): HallucinationRisk {
    const confidenceEvidence = avgConfidence > 85 && successRate < 0.6 ? 0.8 : 0;
    const sourceDiversity = Math.max(
      0,
      1 - (successRate * 0.8 + (1 - this.rollingCertainty) * 0.2),
    );
    const claimGrounding = successRate > 0.7 ? 0.8 : successRate > 0.5 ? 0.5 : 0.2;
    const lengthRisk = queryLength < 20 ? 0.2 : 0;
    const complexityRisk = complexity > 150 ? 0.3 : complexity > 100 ? 0.15 : 0;

    const flags: string[] = [];
    if (confidenceEvidence > 0.5)
      flags.push('High confidence despite low success rate — potential confabulation');
    if (sourceDiversity > 0.6) flags.push('Low source diversity — single-perspective risk');
    if (claimGrounding < 0.4) flags.push('Weak claim grounding — insufficient evidence base');
    if (lengthRisk > 0) flags.push('Very short query — ambiguity-driven hallucination risk');
    if (complexityRisk > 0.2) flags.push('High query complexity — reasoning chain breakdown risk');

    const overall = Math.min(
      1,
      Math.max(
        0,
        confidenceEvidence * 0.25 +
          (1 - claimGrounding) * 0.3 +
          sourceDiversity * 0.2 +
          lengthRisk +
          complexityRisk,
      ),
    );

    return {
      overallScore: overall,
      sourceDiversityIndex: 1 - sourceDiversity,
      claimGroundingRatio: claimGrounding,
      confidenceEvidenceMismatch: confidenceEvidence,
      flags,
    };
  }

  recordPredictionOutcome(predictedFailure: number, actualSuccess: boolean): void {
    this.predictionOutcomes.push({
      predicted: predictedFailure,
      actual: actualSuccess ? 0 : 1,
    });
    if (this.predictionOutcomes.length > 200) {
      this.predictionOutcomes.splice(0, this.predictionOutcomes.length - 200);
    }
  }

  getPredictiveAccuracy(): { accuracy: number; brierScore: number; sampleCount: number } {
    if (this.predictionOutcomes.length < 5) {
      return { accuracy: 0.5, brierScore: 0.25, sampleCount: this.predictionOutcomes.length };
    }
    let correct = 0;
    let brierSum = 0;
    for (const o of this.predictionOutcomes) {
      const predictedBinary = o.predicted > 0.5 ? 1 : 0;
      if (predictedBinary === o.actual) correct++;
      brierSum += (o.predicted - o.actual) ** 2;
    }
    return {
      accuracy: correct / this.predictionOutcomes.length,
      brierScore: brierSum / this.predictionOutcomes.length,
      sampleCount: this.predictionOutcomes.length,
    };
  }

  forkHypotheses(query: string, context: string): MultiHypothesisBranch[] {
    const interpretations = [
      { focus: 'literal', desc: `Direct interpretation: ${query.slice(0, 100)}` },
      {
        focus: 'intent',
        desc: `Underlying intent: What does the user actually need from "${query.slice(0, 60)}"?`,
      },
      {
        focus: 'adversarial',
        desc: `Adversarial check: What if the premise of "${query.slice(0, 60)}" is flawed?`,
      },
    ];

    this.hypotheses = interpretations.map((interp, i) => ({
      branchId: `hyp_${Date.now()}_${i}`,
      hypothesis: interp.desc,
      confidence: i === 0 ? 70 : i === 1 ? 60 : 40,
      evidenceSupport: i === 0 ? 0.7 : i === 1 ? 0.5 : 0.3,
      riskLevel: i === 2 ? ('high' as const) : i === 1 ? ('medium' as const) : ('low' as const),
      status: i === 0 ? ('preferred' as const) : ('active' as const),
    }));

    if (this.hypotheses.length > MetacognitiveMonitor.MAX_HYPOTHESES) {
      this.hypotheses = this.hypotheses.slice(0, MetacognitiveMonitor.MAX_HYPOTHESES);
    }

    return [...this.hypotheses];
  }

  resolveHypotheses(
    outcomes: Array<{ branchId: string; confidence: number; evidenceStrength: number }>,
  ): MultiHypothesisBranch | null {
    for (const outcome of outcomes) {
      const h = this.hypotheses.find((x) => x.branchId === outcome.branchId);
      if (h) {
        h.confidence = outcome.confidence;
        h.evidenceSupport = outcome.evidenceStrength;
      }
    }

    const sorted = [...this.hypotheses].sort(
      (a, b) =>
        b.confidence * 0.6 +
        b.evidenceSupport * 100 * 0.4 -
        (a.confidence * 0.6 + a.evidenceSupport * 100 * 0.4),
    );

    for (const h of this.hypotheses) h.status = 'rejected';
    if (sorted[0]) {
      sorted[0].status = 'preferred';
      return sorted[0];
    }
    return null;
  }

  getState(): MetacognitiveState {
    return {
      currentAssessment:
        this.assessments.length > 0 ? this.assessments[this.assessments.length - 1]! : null,
      recentAssessments: this.assessments.slice(-10).reverse(),
      rollingCertainty: this.rollingCertainty,
      rollingQuality: this.rollingQuality,
      confusionStreak: this.confusionStreak,
      totalAssessments: this.assessments.length,
      predictiveUncertainties: this.predictiveHistory.slice(-10).reverse(),
      activeHypotheses: [...this.hypotheses],
    };
  }

  preFlightCheck(
    agentId: string,
    agentDomain: string,
    queryComplexity: number,
  ): {
    proceed: boolean;
    adjustments: string[];
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const adjustments: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    if (this.confusionStreak > 2) {
      adjustments.push('increase_reasoning_transparency');
      riskLevel = 'high';
    }
    if (this.rollingCertainty < 0.4) {
      adjustments.push('request_evidence_citations');
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }
    if (this.rollingQuality < 0.5) {
      adjustments.push('simplify_query_decomposition');
      riskLevel = 'high';
    }

    const lastAssessment =
      this.assessments.length > 0 ? this.assessments[this.assessments.length - 1] : null;
    if (lastAssessment?.cognitiveLoad === 'overloaded') {
      adjustments.push('reduce_context_window');
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }
    if (lastAssessment?.knowledgeGaps.some((g) => g.toLowerCase().includes(agentDomain))) {
      adjustments.push('flag_domain_knowledge_gap');
      riskLevel = 'high';
    }

    const recentPredictions = this.predictiveHistory.filter((p) => p.agentId === agentId).slice(-3);
    const avgPredictedFailure =
      recentPredictions.length > 0
        ? recentPredictions.reduce((s, p) => s + p.predictedFailureProbability, 0) /
          recentPredictions.length
        : 0;
    if (avgPredictedFailure > 0.5) {
      adjustments.push('predictive_uncertainty_elevated');
      riskLevel = 'high';
    }

    const proceed = riskLevel !== 'high' || this.confusionStreak < 5;
    return { proceed, adjustments, riskLevel };
  }

  assessAgent(input: {
    agentId: string;
    domain: string;
    confidence: number;
    latencyMs: number;
    success: boolean;
    responseLength: number;
    tokensUsed: number;
  }): { certaintyLevel: CertaintyLevel; reasoningQuality: ReasoningQuality } {
    const certaintyLevel = classifyCertainty(input.confidence, 1, input.success ? 0 : 1);
    const hasEvidence = input.responseLength > 300;
    const reasoningQuality = classifyQuality(input.success, 0.7, hasEvidence, input.latencyMs);

    const certScore = CERTAINTY_SCORES[certaintyLevel];
    const qualScore = QUALITY_SCORES[reasoningQuality];
    this.rollingCertainty =
      this.rollingCertainty * (1 - MetacognitiveMonitor.EMA_ALPHA * 0.5) +
      certScore * (MetacognitiveMonitor.EMA_ALPHA * 0.5);
    this.rollingQuality =
      this.rollingQuality * (1 - MetacognitiveMonitor.EMA_ALPHA * 0.5) +
      qualScore * (MetacognitiveMonitor.EMA_ALPHA * 0.5);

    return { certaintyLevel, reasoningQuality };
  }

  buildMetacognitiveContext(): string {
    if (this.assessments.length === 0) return '';

    const current = this.assessments[this.assessments.length - 1]!;
    const lines: string[] = [
      `## Metacognitive State`,
      `Certainty: ${current.certaintyLevel} | Quality: ${current.reasoningQuality} | Load: ${current.cognitiveLoad}`,
      `Rolling certainty: ${(this.rollingCertainty * 100).toFixed(0)}% | Calibration drift: ${(current.calibrationDrift * 100).toFixed(1)}%`,
    ];

    if (current.confusionSignals.length > 0) {
      lines.push(`⚠ Confusion signals: ${current.confusionSignals.join('; ')}`);
    }
    if (current.knowledgeGaps.length > 0) {
      lines.push(`⚠ Knowledge gaps: ${current.knowledgeGaps.join('; ')}`);
    }
    if (current.shouldSeekClarification) {
      lines.push(`→ Recommend seeking clarification before proceeding`);
    }
    if (current.shouldDeferToHuman) {
      lines.push(
        `→ Recommend deferring to human judgment (confusion streak: ${this.confusionStreak})`,
      );
    }

    const predictiveAcc = this.getPredictiveAccuracy();
    if (predictiveAcc.sampleCount >= 5) {
      lines.push(
        `Predictive accuracy: ${(predictiveAcc.accuracy * 100).toFixed(0)}% (Brier: ${predictiveAcc.brierScore.toFixed(3)}, n=${predictiveAcc.sampleCount})`,
      );
    }

    if (this.hypotheses.length > 0) {
      const preferred = this.hypotheses.find((h) => h.status === 'preferred');
      if (preferred) {
        lines.push(
          `Active hypothesis: ${preferred.hypothesis.slice(0, 120)} (${preferred.confidence}%)`,
        );
      }
    }

    return lines.join('\n');
  }
}

export const metacognitiveMonitor = new MetacognitiveMonitor();
