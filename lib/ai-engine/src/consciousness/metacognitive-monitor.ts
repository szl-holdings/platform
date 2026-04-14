import { randomUUID } from "crypto";

export type CertaintyLevel = "very_high" | "high" | "moderate" | "low" | "very_low";
export type ReasoningQuality = "rigorous" | "adequate" | "uncertain" | "confused" | "degraded";
export type CognitiveLoad = "minimal" | "light" | "moderate" | "heavy" | "overloaded";

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

export interface MetacognitiveState {
  currentAssessment: MetacognitiveAssessment | null;
  recentAssessments: MetacognitiveAssessment[];
  rollingCertainty: number;
  rollingQuality: number;
  confusionStreak: number;
  totalAssessments: number;
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

function classifyCertainty(confidence: number, agentCount: number, conflictCount: number): CertaintyLevel {
  const conflictPenalty = conflictCount * 0.1;
  const multiAgentBonus = agentCount > 2 ? 0.05 : 0;
  const adjusted = (confidence / 100) - conflictPenalty + multiAgentBonus;

  if (adjusted >= 0.9) return "very_high";
  if (adjusted >= 0.7) return "high";
  if (adjusted >= 0.5) return "moderate";
  if (adjusted >= 0.3) return "low";
  return "very_low";
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

  if (score >= 0.8) return "rigorous";
  if (score >= 0.6) return "adequate";
  if (score >= 0.4) return "uncertain";
  if (score >= 0.2) return "confused";
  return "degraded";
}

function classifyLoad(agentCount: number, tokensBurned: number, toolCallCount: number): CognitiveLoad {
  const agentLoad = Math.min(1, agentCount / 8);
  const tokenLoad = Math.min(1, tokensBurned / 50000);
  const toolLoad = Math.min(1, toolCallCount / 20);
  const combined = agentLoad * 0.4 + tokenLoad * 0.35 + toolLoad * 0.25;

  if (combined >= 0.85) return "overloaded";
  if (combined >= 0.65) return "heavy";
  if (combined >= 0.4) return "moderate";
  if (combined >= 0.2) return "light";
  return "minimal";
}

function detectConfusionSignals(
  agentResponses: Array<{ confidence: number; response: string }>,
  conflictCount: number,
): string[] {
  const signals: string[] = [];
  const lowConfAgents = agentResponses.filter(r => r.confidence < 40);
  if (lowConfAgents.length > 0) {
    signals.push(`${lowConfAgents.length} agent(s) below 40% confidence — low-certainty zone`);
  }

  if (conflictCount >= 2) {
    signals.push(`${conflictCount} inter-agent conflicts detected — contradictory reasoning paths`);
  }

  const confSpread = agentResponses.length > 1
    ? Math.max(...agentResponses.map(r => r.confidence)) - Math.min(...agentResponses.map(r => r.confidence))
    : 0;
  if (confSpread > 50) {
    signals.push(`Confidence spread of ${confSpread}% across agents — high disagreement`);
  }

  const shortResponses = agentResponses.filter(r => r.response.length < 100);
  if (shortResponses.length > agentResponses.length / 2) {
    signals.push("Majority of agents produced thin responses — possible knowledge gap");
  }

  return signals;
}

function detectKnowledgeGaps(
  query: string,
  agentResponses: Array<{ response: string; domain: string }>,
): string[] {
  const gaps: string[] = [];
  const queryTerms = query.toLowerCase().split(/\s+/).filter(w => w.length > 4);

  for (const resp of agentResponses) {
    const respLower = resp.response.toLowerCase();
    const hedgingPhrases = ["unclear", "uncertain", "insufficient data", "not enough information", "cannot determine", "limited visibility"];
    const hedges = hedgingPhrases.filter(h => respLower.includes(h));
    if (hedges.length > 0) {
      gaps.push(`${resp.domain}: expressed uncertainty — "${hedges[0]}"`);
    }
  }

  const uncoveredTerms = queryTerms.filter(term =>
    !agentResponses.some(r => r.response.toLowerCase().includes(term))
  );
  if (uncoveredTerms.length > queryTerms.length * 0.4 && uncoveredTerms.length >= 2) {
    gaps.push(`Query terms not addressed: ${uncoveredTerms.slice(0, 4).join(", ")}`);
  }

  return gaps;
}

class MetacognitiveMonitor {
  private assessments: MetacognitiveAssessment[] = [];
  private rollingCertainty = 0.75;
  private rollingQuality = 0.75;
  private confusionStreak = 0;
  private static readonly MAX_HISTORY = 500;
  private static readonly EMA_ALPHA = 0.15;

  assess(input: {
    query: string;
    agentResponses: Array<{ confidence: number; response: string; domain: string }>;
    conflictCount: number;
    validationPassed: boolean;
    tokensBurned: number;
    latencyMs: number;
    toolCallCount: number;
  }): MetacognitiveAssessment {
    const avgConfidence = input.agentResponses.length > 0
      ? input.agentResponses.reduce((s, r) => s + r.confidence, 0) / input.agentResponses.length
      : 50;

    const agentAgreement = input.agentResponses.length > 1
      ? 1 - (Math.max(...input.agentResponses.map(r => r.confidence)) - Math.min(...input.agentResponses.map(r => r.confidence))) / 100
      : 0.7;

    const hasEvidence = input.agentResponses.some(r => r.response.length > 500);

    const certaintyLevel = classifyCertainty(avgConfidence, input.agentResponses.length, input.conflictCount);
    const reasoningQuality = classifyQuality(input.validationPassed, agentAgreement, hasEvidence, input.latencyMs);
    const cognitiveLoad = classifyLoad(input.agentResponses.length, input.tokensBurned, input.toolCallCount);

    const confusionSignals = detectConfusionSignals(input.agentResponses, input.conflictCount);
    const knowledgeGaps = detectKnowledgeGaps(input.query, input.agentResponses);

    const certScore = CERTAINTY_SCORES[certaintyLevel];
    const qualScore = QUALITY_SCORES[reasoningQuality];

    this.rollingCertainty = this.rollingCertainty * (1 - MetacognitiveMonitor.EMA_ALPHA) + certScore * MetacognitiveMonitor.EMA_ALPHA;
    this.rollingQuality = this.rollingQuality * (1 - MetacognitiveMonitor.EMA_ALPHA) + qualScore * MetacognitiveMonitor.EMA_ALPHA;

    const isConfused = certaintyLevel === "low" || certaintyLevel === "very_low" || confusionSignals.length >= 2;
    this.confusionStreak = isConfused ? this.confusionStreak + 1 : 0;

    const calibrationDrift = Math.abs(this.rollingCertainty - (avgConfidence / 100));

    const shouldSeekClarification = confusionSignals.length >= 2 || knowledgeGaps.length >= 2 || certaintyLevel === "very_low";
    const shouldDeferToHuman = this.confusionStreak >= 3 || (certaintyLevel === "very_low" && cognitiveLoad === "overloaded");
    const confidenceInConfidence = Math.max(0, Math.min(1, 1 - calibrationDrift - (confusionSignals.length * 0.1)));

    let introspectionNotes = "";
    if (confusionSignals.length === 0 && knowledgeGaps.length === 0) {
      introspectionNotes = `Clear reasoning path. ${input.agentResponses.length} agents converged with ${certaintyLevel} certainty.`;
    } else {
      const parts: string[] = [];
      if (confusionSignals.length > 0) parts.push(`Confusion detected: ${confusionSignals[0]}`);
      if (knowledgeGaps.length > 0) parts.push(`Knowledge gap: ${knowledgeGaps[0]}`);
      if (this.confusionStreak > 1) parts.push(`Confusion streak: ${this.confusionStreak} consecutive uncertain orchestrations`);
      introspectionNotes = parts.join(". ");
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

  getState(): MetacognitiveState {
    return {
      currentAssessment: this.assessments.length > 0 ? this.assessments[this.assessments.length - 1]! : null,
      recentAssessments: this.assessments.slice(-10).reverse(),
      rollingCertainty: this.rollingCertainty,
      rollingQuality: this.rollingQuality,
      confusionStreak: this.confusionStreak,
      totalAssessments: this.assessments.length,
    };
  }

  preFlightCheck(agentId: string, agentDomain: string, queryComplexity: number): {
    proceed: boolean;
    adjustments: string[];
    riskLevel: "low" | "medium" | "high";
  } {
    const adjustments: string[] = [];
    let riskLevel: "low" | "medium" | "high" = "low";

    if (this.confusionStreak > 2) {
      adjustments.push("increase_reasoning_transparency");
      riskLevel = "high";
    }
    if (this.rollingCertainty < 0.4) {
      adjustments.push("request_evidence_citations");
      riskLevel = riskLevel === "low" ? "medium" : riskLevel;
    }
    if (this.rollingQuality < 0.5) {
      adjustments.push("simplify_query_decomposition");
      riskLevel = "high";
    }

    const lastAssessment = this.assessments.length > 0 ? this.assessments[this.assessments.length - 1] : null;
    if (lastAssessment?.cognitiveLoad === "overloaded") {
      adjustments.push("reduce_context_window");
      riskLevel = riskLevel === "low" ? "medium" : riskLevel;
    }
    if (lastAssessment?.knowledgeGaps.some(g => g.toLowerCase().includes(agentDomain))) {
      adjustments.push("flag_domain_knowledge_gap");
      riskLevel = "high";
    }

    const proceed = riskLevel !== "high" || this.confusionStreak < 5;
    return { proceed, adjustments, riskLevel };
  }

  buildMetacognitiveContext(): string {
    if (this.assessments.length === 0) return "";

    const current = this.assessments[this.assessments.length - 1]!;
    const lines: string[] = [
      `## Metacognitive State`,
      `Certainty: ${current.certaintyLevel} | Quality: ${current.reasoningQuality} | Load: ${current.cognitiveLoad}`,
      `Rolling certainty: ${(this.rollingCertainty * 100).toFixed(0)}% | Calibration drift: ${(current.calibrationDrift * 100).toFixed(1)}%`,
    ];

    if (current.confusionSignals.length > 0) {
      lines.push(`⚠ Confusion signals: ${current.confusionSignals.join("; ")}`);
    }
    if (current.knowledgeGaps.length > 0) {
      lines.push(`⚠ Knowledge gaps: ${current.knowledgeGaps.join("; ")}`);
    }
    if (current.shouldSeekClarification) {
      lines.push(`→ Recommend seeking clarification before proceeding`);
    }
    if (current.shouldDeferToHuman) {
      lines.push(`→ Recommend deferring to human judgment (confusion streak: ${this.confusionStreak})`);
    }

    return lines.join("\n");
  }
}

export const metacognitiveMonitor = new MetacognitiveMonitor();
