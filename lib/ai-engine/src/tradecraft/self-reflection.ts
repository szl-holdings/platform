/**
 * Self-Reflection Engine
 *
 * Before generating new decisions, agents run a self-reflection step that
 * reviews recent performance metrics and adjusts reasoning weights accordingly.
 * This context is injected into agent prompts to guide calibration.
 */

import { type AgentPerformanceProfile, scoringEngine } from './scoring-engine.js';

export interface SelfReflectionContext {
  agentId: string;
  hasData: boolean;
  contextBlock: string;
  reasoningAdjustments: ReasoningAdjustment[];
  confidenceAdjustment: number;
  urgentFlags: string[];
  generatedAt: string;
}

export interface ReasoningAdjustment {
  dimension:
    | 'confidence'
    | 'evidence_weighting'
    | 'alternative_generation'
    | 'escalation_threshold'
    | 'human_review_trigger';
  direction: 'increase' | 'decrease' | 'maintain';
  magnitude: 'minor' | 'moderate' | 'significant';
  rationale: string;
}

export interface SelfReflectionConfig {
  windowDays: number;
  includeSkillBreakdown: boolean;
  includeCalibrationDetails: boolean;
  maxContextLength: number;
  forceReflectionIfFlagsExist: boolean;
}

const DEFAULT_REFLECTION_CONFIG: SelfReflectionConfig = {
  windowDays: 30,
  includeSkillBreakdown: true,
  includeCalibrationDetails: true,
  maxContextLength: 2000,
  forceReflectionIfFlagsExist: true,
};

function buildReasoningAdjustments(profile: AgentPerformanceProfile): ReasoningAdjustment[] {
  const adjustments: ReasoningAdjustment[] = [];

  if (profile.calibration.calibrationVerdict === 'overconfident') {
    adjustments.push({
      dimension: 'confidence',
      direction: 'decrease',
      magnitude: profile.calibration.calibrationError > 0.2 ? 'significant' : 'moderate',
      rationale:
        `Historical data shows you are overconfident by ${Math.round(Math.abs(profile.calibration.calibrationBias) * 100)}%. ` +
        `Your stated confidence exceeds actual acceptance rate. Apply more conservative confidence bounds.`,
    });
    adjustments.push({
      dimension: 'alternative_generation',
      direction: 'increase',
      magnitude: 'moderate',
      rationale:
        'Overconfidence bias detected — explicitly generate and weigh more alternative hypotheses before concluding.',
    });
  }

  if (profile.calibration.calibrationVerdict === 'underconfident') {
    adjustments.push({
      dimension: 'confidence',
      direction: 'increase',
      magnitude: 'minor',
      rationale:
        `Historical data shows you underestimate confidence by ${Math.round(Math.abs(profile.calibration.calibrationBias) * 100)}%. ` +
        `Your recommendations are accepted more often than your confidence reflects.`,
    });
  }

  if (profile.accuracy.overrideRate > 0.3) {
    adjustments.push({
      dimension: 'evidence_weighting',
      direction: 'increase',
      magnitude: 'moderate',
      rationale:
        `High override rate (${Math.round(profile.accuracy.overrideRate * 100)}%). ` +
        `Human reviewers are frequently modifying your decisions. Weight evidence more conservatively and expand your gap statements.`,
    });
    adjustments.push({
      dimension: 'human_review_trigger',
      direction: 'increase',
      magnitude: 'moderate',
      rationale:
        'Given recent override patterns, lower your threshold for flagging decisions as requiring human review.',
    });
  }

  if (profile.accuracy.acceptanceRate < 0.5 && profile.accuracy.totalDecisions >= 5) {
    adjustments.push({
      dimension: 'escalation_threshold',
      direction: 'decrease',
      magnitude: 'significant',
      rationale:
        `Low acceptance rate (${Math.round(profile.accuracy.acceptanceRate * 100)}%). ` +
        `Reduce the threshold for escalating decisions to human review.`,
    });
  }

  const decliningSkills = profile.skillEffectiveness.filter(
    (s) => s.trend === 'declining' && s.totalUsages >= 5,
  );
  if (decliningSkills.length > 0) {
    adjustments.push({
      dimension: 'evidence_weighting',
      direction: 'increase',
      magnitude: 'minor',
      rationale:
        `Skills showing declining effectiveness: ${decliningSkills.map((s) => s.capability).join(', ')}. ` +
        `Be more conservative and thorough in evidence collection for these capability areas.`,
    });
  }

  return adjustments;
}

function buildContextBlock(
  profile: AgentPerformanceProfile,
  adjustments: ReasoningAdjustment[],
  config: SelfReflectionConfig,
): string {
  if (!profile.accuracy.totalDecisions || profile.accuracy.totalDecisions < 3) {
    return 'SELF-REFLECTION: Insufficient historical data for performance-based calibration. Apply standard analytic tradecraft standards.';
  }

  const lines: string[] = [
    '═══ SELF-REFLECTION: PERFORMANCE-BASED CALIBRATION NOTICE ═══',
    '',
    `Agent performance summary (last ${config.windowDays} days, ${profile.accuracy.totalDecisions} decisions):`,
    `• Acceptance rate: ${Math.round(profile.accuracy.acceptanceRate * 100)}% | Override rate: ${Math.round(profile.accuracy.overrideRate * 100)}% | Health: ${profile.healthLabel.toUpperCase()}`,
  ];

  if (
    config.includeCalibrationDetails &&
    profile.calibration.calibrationVerdict !== 'insufficient_data'
  ) {
    lines.push(
      `• Confidence calibration: ${profile.calibration.calibrationVerdict.replace('_', ' ')} ` +
        `(predicted avg: ${Math.round(profile.calibration.meanPredictedConfidence * 100)}%, ` +
        `actual acceptance: ${Math.round(profile.calibration.meanActualAcceptanceRate * 100)}%)`,
    );
  }

  if (profile.flags.length > 0) {
    lines.push('', '⚠️  Active performance flags:');
    for (const flag of profile.flags) {
      lines.push(`  - ${flag}`);
    }
  }

  if (adjustments.length > 0) {
    lines.push('', 'Reasoning adjustments for this decision:');
    for (const adj of adjustments) {
      lines.push(
        `• [${adj.dimension.replace(/_/g, ' ').toUpperCase()}] → ${adj.direction.toUpperCase()} (${adj.magnitude}): ${adj.rationale}`,
      );
    }
  }

  if (config.includeSkillBreakdown && profile.skillEffectiveness.length > 0) {
    const declining = profile.skillEffectiveness.filter(
      (s) => s.trend === 'declining' && s.totalUsages >= 3,
    );
    if (declining.length > 0) {
      lines.push('', 'Declining skill effectiveness — apply extra scrutiny:');
      for (const s of declining) {
        lines.push(
          `  - ${s.capability}: acceptance rate ${Math.round(s.acceptanceRate * 100)}%, trend ↓`,
        );
      }
    }
  }

  lines.push(
    '',
    'Apply these calibration adjustments to your reasoning before producing the decision.',
    '═══════════════════════════════════════════════════════════════',
  );

  const block = lines.join('\n');
  return block.length > config.maxContextLength
    ? block.slice(0, config.maxContextLength) + '\n[truncated]'
    : block;
}

export async function buildSelfReflectionContext(
  agentId: string,
  config: Partial<SelfReflectionConfig> = {},
): Promise<SelfReflectionContext> {
  const effectiveConfig = { ...DEFAULT_REFLECTION_CONFIG, ...config };

  await scoringEngine.loadFromDb(agentId).catch(() => {});

  const profile = scoringEngine.computeAgentProfile(agentId, effectiveConfig.windowDays);
  const hasData = profile.accuracy.totalDecisions >= 3;
  const adjustments = hasData ? buildReasoningAdjustments(profile) : [];
  const contextBlock = buildContextBlock(profile, adjustments, effectiveConfig);
  const urgentFlags = profile.flags.filter(
    (f) =>
      f.toLowerCase().includes('high override') ||
      f.toLowerCase().includes('low acceptance') ||
      f.toLowerCase().includes('overconfident'),
  );

  const confidenceAdjustment = profile.calibration.recommendedAdjustment;

  return {
    agentId,
    hasData,
    contextBlock,
    reasoningAdjustments: adjustments,
    confidenceAdjustment,
    urgentFlags,
    generatedAt: new Date().toISOString(),
  };
}

export function applyConfidenceAdjustment(rawConfidence: number, adjustment: number): number {
  const adjusted = rawConfidence + adjustment;
  return Math.max(0.05, Math.min(0.95, adjusted));
}

export function injectReflectionIntoPrompt(
  systemPrompt: string,
  reflectionContext: SelfReflectionContext,
): string {
  if (!reflectionContext.hasData && reflectionContext.urgentFlags.length === 0) {
    return systemPrompt;
  }
  return `${systemPrompt}\n\n${reflectionContext.contextBlock}`;
}

export async function persistReflectionSnapshot(
  agentId: string,
  context: SelfReflectionContext,
  tenantId: string,
): Promise<void> {
  try {
    const { db, alloyAgentReflections } = await import('@szl-holdings/db');
    await db.insert(alloyAgentReflections).values({
      agentId,
      tenantId,
      hasData: context.hasData,
      contextBlock: context.contextBlock,
      confidenceAdjustment: context.confidenceAdjustment,
      reasoningAdjustments: context.reasoningAdjustments as unknown as Record<string, unknown>[],
      urgentFlags: context.urgentFlags,
      overallHealth: (await scoringEngine.computeAgentProfile(agentId)).healthLabel,
    });
  } catch {}
}
