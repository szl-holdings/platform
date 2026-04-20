/**
 * Outcome-to-Learning Feedback Loop
 *
 * When decisions are accepted, rejected, overridden, or deferred:
 * 1. Store the outcome in the DB
 * 2. Surface relevant past outcomes as prompt context for future decisions
 * 3. Compute per-agent confidence calibration scores
 */
import { alloyOutcomeLearning, db } from '@szl-holdings/db';
import { desc, eq, sql } from 'drizzle-orm';

const logger = {
  warn: (obj: Record<string, unknown>, msg: string) => console.warn('[outcome-learning]', msg, obj),
};

export type OutcomeType = 'accepted' | 'rejected' | 'overridden' | 'deferred';

export interface OutcomeRecord {
  decisionId: string;
  agentId: string;
  outcome: OutcomeType;
  originalAction: string;
  finalAction?: string;
  originalConfidence: number;
  topic: string;
  topicKeywords?: string[];
  overrideReason?: string;
}

export interface ConfidenceCalibration {
  agentId: string;
  totalDecisions: number;
  acceptedCount: number;
  rejectedCount: number;
  overriddenCount: number;
  acceptanceRate: number;
  calibrationBias: number;
  recommendedConfidenceAdjustment: number;
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'is',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'and',
    'or',
    'but',
    'with',
  ]);
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .slice(0, 10);
}

export async function recordOutcome(
  record: OutcomeRecord & { orgId?: number | null },
): Promise<void> {
  try {
    const keywords =
      record.topicKeywords ?? extractKeywords(`${record.topic} ${record.originalAction}`);
    await db.insert(alloyOutcomeLearning).values({
      decisionId: record.decisionId,
      agentId: record.agentId,
      orgId: record.orgId ?? null,
      outcome: record.outcome,
      originalAction: record.originalAction,
      finalAction: record.finalAction ?? null,
      originalConfidence: record.originalConfidence,
      topic: record.topic,
      topicKeywords: keywords,
      overrideReason: record.overrideReason ?? null,
    });
  } catch (err) {
    logger.warn({ err }, 'recordOutcome DB write failed — outcome not persisted');
  }
}

export async function getRelevantOutcomes(
  agentId: string,
  topic: string,
  limit = 5,
): Promise<string> {
  try {
    const keywords = extractKeywords(topic);
    const recent = await db
      .select()
      .from(alloyOutcomeLearning)
      .where(eq(alloyOutcomeLearning.agentId, agentId))
      .orderBy(desc(alloyOutcomeLearning.createdAt))
      .limit(50);

    const scored = recent
      .map((r) => {
        const overlap = keywords.filter((kw) => r.topicKeywords.includes(kw)).length;
        return { record: r, score: overlap };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    if (scored.length === 0) return '';

    const lines = scored.map(({ record: r }) => {
      const prefix =
        r.outcome === 'accepted'
          ? '✓ ACCEPTED'
          : r.outcome === 'rejected'
            ? '✗ REJECTED'
            : r.outcome === 'overridden'
              ? '△ OVERRIDDEN'
              : '⏸ DEFERRED';
      return `${prefix}: "${r.originalAction.slice(0, 120)}"${r.overrideReason ? ` — Reason: ${r.overrideReason}` : ''}`;
    });

    return `## Past Decision Outcomes (Similar Context)\n${lines.join('\n')}`;
  } catch (err) {
    logger.warn({ err }, 'getRelevantOutcomes DB read failed — returning empty context');
    return '';
  }
}

/**
 * Builds a calibration instruction string that is injected into the agent's
 * system prompt to adjust its confidence output based on historical acceptance
 * rates. Returns an empty string when there is not enough data (< 10 decisions)
 * to form a meaningful calibration signal.
 */
export async function buildCalibrationInstruction(agentId: string): Promise<string> {
  try {
    const calibration = await getConfidenceCalibration(agentId);
    if (calibration.totalDecisions < 10) return '';

    const { calibrationBias, recommendedConfidenceAdjustment, acceptanceRate } = calibration;
    if (Math.abs(recommendedConfidenceAdjustment) < 0.02) return '';

    const direction = calibrationBias > 0 ? 'overestimates' : 'underestimates';
    const pct = Math.round(Math.abs(calibrationBias) * 100);
    const adjPct = Math.round(Math.abs(recommendedConfidenceAdjustment) * 100);
    const sign = recommendedConfidenceAdjustment > 0 ? '+' : '-';
    return [
      `## Confidence Calibration Notice`,
      `Historical data (${calibration.totalDecisions} decisions, ${Math.round(acceptanceRate * 100)}% accepted) shows`,
      `this agent ${direction} its confidence by ~${pct}%. Recommended adjustment: ${sign}${adjPct}% to reported CONFIDENCE scores.`,
      `Apply this offset when deciding your CONFIDENCE: [score] line.`,
    ].join(' ');
  } catch (err) {
    logger.warn({ err }, 'buildCalibrationInstruction failed — no calibration applied');
    return '';
  }
}

export async function getConfidenceCalibration(agentId: string): Promise<ConfidenceCalibration> {
  try {
    const rows = await db
      .select({
        outcome: alloyOutcomeLearning.outcome,
        count: sql<number>`count(*)::int`,
        avgConfidence: sql<number>`avg(original_confidence)::float`,
      })
      .from(alloyOutcomeLearning)
      .where(eq(alloyOutcomeLearning.agentId, agentId))
      .groupBy(alloyOutcomeLearning.outcome);

    let total = 0;
    let accepted = 0;
    let rejected = 0;
    let overridden = 0;
    let avgReportedConfidence = 0;
    let confWeightedTotal = 0;

    for (const row of rows) {
      total += row.count;
      if (row.outcome === 'accepted') {
        accepted = row.count;
        avgReportedConfidence += row.avgConfidence * row.count;
        confWeightedTotal += row.count;
      }
      if (row.outcome === 'rejected') rejected = row.count;
      if (row.outcome === 'overridden') overridden = row.count;
    }

    const acceptanceRate = total > 0 ? accepted / total : 1.0;
    const avgConf = confWeightedTotal > 0 ? avgReportedConfidence / confWeightedTotal : 0.75;
    const calibrationBias = avgConf - acceptanceRate;
    const recommendedAdjustment = total >= 10 ? -calibrationBias * 0.5 : 0;

    return {
      agentId,
      totalDecisions: total,
      acceptedCount: accepted,
      rejectedCount: rejected,
      overriddenCount: overridden,
      acceptanceRate,
      calibrationBias,
      recommendedConfidenceAdjustment: recommendedAdjustment,
    };
  } catch (err) {
    logger.warn(
      { err },
      'getConfidenceCalibration DB read failed — returning baseline calibration',
    );
    return {
      agentId,
      totalDecisions: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      overriddenCount: 0,
      acceptanceRate: 1.0,
      calibrationBias: 0,
      recommendedConfidenceAdjustment: 0,
    };
  }
}
