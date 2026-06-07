/**
 * Training Data Quality Gate
 *
 * Before any fine-tuning submission, runs automated quality checks:
 * - Contamination detection: training/eval overlap
 * - Category distribution analysis and imbalance detection
 * - Source diversity enforcement (no single source >70%)
 * - Per-sample quality scoring
 * - Blocks submission if thresholds are not met
 */

import { GOLDEN_SET } from '../evals/golden-set.js';

export interface QualityCheckResult {
  passed: boolean;
  score: number;
  contamination: {
    overlapCount: number;
    overlapPct: number;
    contaminated: boolean;
  };
  diversity: {
    sourceBreakdown: Record<string, number>;
    dominantSourcePct: number;
    diversityViolation: boolean;
    dominantSource?: string;
  };
  distribution: {
    categoryBreakdown: Record<string, number>;
    imbalanceRatio: number;
    imbalanced: boolean;
  };
  minimumSamples: {
    required: number;
    actual: number;
    met: boolean;
  };
  blockedReasons: string[];
  warnings: string[];
}

const CONTAMINATION_THRESHOLD = 0.05;
const MAX_SINGLE_SOURCE_PCT = 0.70;
const MAX_IMBALANCE_RATIO = 5.0;
const MIN_SAMPLES_QUALITY = 10;

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

function extractSampleText(sample: unknown): string {
  if (typeof sample === 'object' && sample !== null) {
    const s = sample as Record<string, unknown>;

    // OpenAI JSONL shape: { messages: [{role, content}] }
    if (Array.isArray(s.messages)) {
      return (s.messages as Array<{ content: string }>)
        .map((m) => m.content ?? '')
        .join(' ');
    }

    // DPO shape (OpenAI export): { input: { messages }, preferred_output: [{content}], non_preferred_output: [{content}] }
    // DPO shape (open-source): { input: { messages }, chosen: '...', rejected: '...' }
    if (typeof s.input === 'object' && s.input !== null) {
      const inputObj = s.input as Record<string, unknown>;
      if (Array.isArray(inputObj.messages)) {
        const inputText = (inputObj.messages as Array<{ content: string }>)
          .map((m) => m.content ?? '')
          .join(' ');

        // OpenAI DPO format: preferred_output / non_preferred_output (arrays of message objects)
        const prefArr = Array.isArray(s.preferred_output) ? s.preferred_output as Array<{ content?: string }> : null;
        const nonPrefArr = Array.isArray(s.non_preferred_output) ? s.non_preferred_output as Array<{ content?: string }> : null;
        if (prefArr || nonPrefArr) {
          const preferred = prefArr?.map((m) => m.content ?? '').join(' ') ?? '';
          const nonPreferred = nonPrefArr?.map((m) => m.content ?? '').join(' ') ?? '';
          return `${inputText} ${preferred} ${nonPreferred}`.trim();
        }

        // Open-source DPO format: chosen / rejected (plain strings)
        const chosen = typeof s.chosen === 'string' ? s.chosen : '';
        const rejected = typeof s.rejected === 'string' ? s.rejected : '';
        return `${inputText} ${chosen} ${rejected}`.trim();
      }
    }

    // Flat string shape: { input: '...', output: '...' }
    if (typeof s.input === 'string') return `${s.input} ${s.output ?? ''}`;
  }
  return '';
}

function detectContamination(
  samples: unknown[],
): { overlapCount: number; overlapPct: number; contaminated: boolean } {
  const goldenTexts = GOLDEN_SET.map((t) => normalizeText(t.input)).filter((t) => t.length > 5);
  let overlapCount = 0;

  for (const sample of samples) {
    const text = normalizeText(extractSampleText(sample));
    if (text.length < 5) continue;
    const hasOverlap = goldenTexts.some((golden) => {
      const goldenWords = golden.split(' ').filter((w) => w.length > 4);
      const matchingWords = goldenWords.filter((w) => text.includes(w));
      return matchingWords.length >= 5 && matchingWords.length / goldenWords.length > 0.6;
    });
    if (hasOverlap) overlapCount++;
  }

  const overlapPct = samples.length > 0 ? overlapCount / samples.length : 0;
  return {
    overlapCount,
    overlapPct,
    contaminated: overlapPct > CONTAMINATION_THRESHOLD,
  };
}

function analyzeSourceDiversity(sourceBreakdown: Record<string, number>): {
  dominantSourcePct: number;
  diversityViolation: boolean;
  dominantSource?: string;
} {
  const total = Object.values(sourceBreakdown).reduce((s, v) => s + v, 0);
  if (total === 0) return { dominantSourcePct: 0, diversityViolation: false };

  let maxCount = 0;
  let dominantSource: string | undefined;
  for (const [source, count] of Object.entries(sourceBreakdown)) {
    if (count > maxCount) {
      maxCount = count;
      dominantSource = source;
    }
  }

  const dominantSourcePct = maxCount / total;
  return {
    dominantSourcePct,
    diversityViolation: dominantSourcePct > MAX_SINGLE_SOURCE_PCT,
    dominantSource,
  };
}

function analyzeCategoryDistribution(samples: unknown[]): {
  categoryBreakdown: Record<string, number>;
  imbalanceRatio: number;
  imbalanced: boolean;
} {
  const counts: Record<string, number> = {};

  for (const sample of samples) {
    const s = sample as Record<string, unknown>;
    let category = 'general';
    if (typeof s.domain === 'string') category = s.domain;
    else if (Array.isArray(s.messages)) {
      const msgs = s.messages as Array<{ role: string; content: string }>;
      const sysMsg = msgs.find((m) => m.role === 'system');
      if (sysMsg?.content) {
        const content = sysMsg.content.toLowerCase();
        if (content.includes('maritime')) category = 'maritime';
        else if (content.includes('security') || content.includes('cyber')) category = 'security';
        else if (content.includes('research') || content.includes('ai/ml')) category = 'research';
        else if (content.includes('analytics')) category = 'analytics';
        else if (content.includes('infrastructure')) category = 'infrastructure';
        else if (content.includes('creative') || content.includes('content')) category = 'creative';
      }
    }
    counts[category] = (counts[category] ?? 0) + 1;
  }

  const values = Object.values(counts);
  const maxCount = Math.max(...values, 1);
  const minCount = Math.min(...values, 1);
  const imbalanceRatio = minCount > 0 ? maxCount / minCount : maxCount;

  return {
    categoryBreakdown: counts,
    imbalanceRatio,
    imbalanced: imbalanceRatio > MAX_IMBALANCE_RATIO && Object.keys(counts).length > 1,
  };
}

function computePerSampleQualityScore(sample: unknown): number {
  const s = sample as Record<string, unknown>;
  let score = 0.5;

  if (Array.isArray(s.messages)) {
    const msgs = s.messages as Array<{ role: string; content: string }>;
    const hasSystem = msgs.some((m) => m.role === 'system' && m.content.length > 20);
    const hasUser = msgs.some((m) => m.role === 'user' && m.content.length > 10);
    const hasAssistant = msgs.some((m) => m.role === 'assistant' && m.content.length > 20);

    if (hasSystem) score += 0.1;
    if (hasUser) score += 0.2;
    if (hasAssistant) score += 0.2;

    const assistantMsg = msgs.find((m) => m.role === 'assistant');
    if (assistantMsg && assistantMsg.content.length > 100) score += 0.1;
    if (assistantMsg && assistantMsg.content.length > 300) score += 0.05;
  } else if (typeof s.quality === 'number') {
    score = s.quality;
  }

  return Math.min(1.0, Math.max(0.0, score));
}

export async function runDataQualityGate(
  samples: unknown[],
  sourceBreakdown: Record<string, number>,
  options?: {
    minSamples?: number;
    maxContaminationPct?: number;
    maxSourceDominancePct?: number;
    maxImbalanceRatio?: number;
  },
): Promise<QualityCheckResult> {
  const minSamples = options?.minSamples ?? MIN_SAMPLES_QUALITY;
  const maxContaminationPct = options?.maxContaminationPct ?? CONTAMINATION_THRESHOLD;
  const maxSourceDominancePct = options?.maxSourceDominancePct ?? MAX_SINGLE_SOURCE_PCT;
  const maxImbalanceRatio = options?.maxImbalanceRatio ?? MAX_IMBALANCE_RATIO;

  const contamination = detectContamination(samples);
  const diversity = analyzeSourceDiversity(sourceBreakdown);
  const distribution = analyzeCategoryDistribution(samples);

  const meetsMinSamples = samples.length >= minSamples;

  const qualityScores = samples.map(computePerSampleQualityScore);
  const avgQualityScore =
    qualityScores.length > 0
      ? qualityScores.reduce((s, v) => s + v, 0) / qualityScores.length
      : 0;

  const blockedReasons: string[] = [];
  const warnings: string[] = [];

  if (!meetsMinSamples) {
    blockedReasons.push(
      `Insufficient samples: ${samples.length} < ${minSamples} required`,
    );
  }

  if (contamination.overlapPct > maxContaminationPct) {
    blockedReasons.push(
      `Training/eval contamination too high: ${(contamination.overlapPct * 100).toFixed(1)}% overlap (max ${(maxContaminationPct * 100).toFixed(1)}%)`,
    );
  }

  if (diversity.diversityViolation && diversity.dominantSourcePct > maxSourceDominancePct) {
    blockedReasons.push(
      `Source diversity violation: '${diversity.dominantSource}' represents ${(diversity.dominantSourcePct * 100).toFixed(1)}% of data (max ${(maxSourceDominancePct * 100).toFixed(1)}%)`,
    );
  }

  if (distribution.imbalanced && distribution.imbalanceRatio > maxImbalanceRatio) {
    warnings.push(
      `Category imbalance detected: ${distribution.imbalanceRatio.toFixed(1)}x ratio between largest and smallest category`,
    );
  }

  if (avgQualityScore < 0.4) {
    warnings.push(`Low average sample quality score: ${avgQualityScore.toFixed(2)}`);
  }

  const passed = blockedReasons.length === 0;
  const score = passed
    ? Math.max(
        0,
        avgQualityScore -
          contamination.overlapPct * 0.5 -
          (diversity.diversityViolation ? 0.1 : 0),
      )
    : 0;

  return {
    passed,
    score,
    contamination,
    diversity: {
      sourceBreakdown,
      dominantSourcePct: diversity.dominantSourcePct,
      diversityViolation: diversity.diversityViolation,
      ...(diversity.dominantSource !== undefined ? { dominantSource: diversity.dominantSource } : {}),
    },
    distribution,
    minimumSamples: {
      required: minSamples,
      actual: samples.length,
      met: meetsMinSamples,
    },
    blockedReasons,
    warnings,
  };
}
