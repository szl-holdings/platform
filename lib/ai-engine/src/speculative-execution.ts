/**
 * Speculative Multi-Path Execution
 *
 * For high-stakes queries, fires the query to 2-3 models in parallel.
 * A judge function scores each result on coherence, completeness, safety,
 * and domain accuracy, then returns the winner.
 * Tracks which model wins most often per domain to feed back into routing priors.
 */

import type { HFChatMessage } from './providers/hf-client.js';

export interface SpeculativeCandidate {
  model: string;
  provider: string;
  content: string;
  latencyMs: number;
  tokensUsed: number;
  error?: string;
}

export interface JudgeScores {
  coherence: number;
  completeness: number;
  safety: number;
  domainAccuracy: number;
  overallScore: number;
}

export interface ScoredCandidate extends SpeculativeCandidate {
  scores: JudgeScores;
  rank: number;
}

export interface SpeculativeExecutionResult {
  executionId: string;
  query: string;
  domain: string;
  candidates: ScoredCandidate[];
  winner: ScoredCandidate;
  judgeRationale: string;
  totalLatencyMs: number;
  parallelSpeedup: number;
}

type ModelCaller = (
  model: string,
  provider: string,
  messages: HFChatMessage[],
) => Promise<{ content: string; latencyMs: number; tokensUsed: number }>;

let _modelCaller: ModelCaller | null = null;

export function setSpeculativeModelCaller(fn: ModelCaller): void {
  _modelCaller = fn;
}

const _winnerTracker: Record<string, Record<string, number>> = {};

export function recordWinner(domain: string, model: string): void {
  if (!_winnerTracker[domain]) _winnerTracker[domain] = {};
  _winnerTracker[domain]![model] = (_winnerTracker[domain]![model] ?? 0) + 1;
}

export function getDomainWinnerStats(): Record<string, Record<string, number>> {
  return structuredClone(_winnerTracker);
}

export function getBestModelForDomain(domain: string): string | null {
  const stats = _winnerTracker[domain];
  if (!stats) return null;
  const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}

function scoreCandidate(
  candidate: SpeculativeCandidate,
  query: string,
  domain: string,
): JudgeScores {
  if (candidate.error) {
    return { coherence: 0, completeness: 0, safety: 0, domainAccuracy: 0, overallScore: 0 };
  }

  const content = candidate.content.toLowerCase();
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);

  const queryWordCoverage = queryWords.length > 0
    ? queryWords.filter((w) => content.includes(w)).length / queryWords.length
    : 0.5;

  const hasStructure =
    content.includes('\n') ||
    content.includes('- ') ||
    content.includes('1.') ||
    content.includes('##');

  const coherence = Math.min(
    1,
    queryWordCoverage * 0.5 +
    (hasStructure ? 0.2 : 0) +
    Math.min(0.3, candidate.content.length / 3000),
  );

  const hasConcreteInfo =
    /\d+/.test(candidate.content) ||
    content.includes('because') ||
    content.includes('therefore') ||
    content.includes('analysis');
  const completeness = Math.min(
    1,
    (candidate.content.length / 800) * 0.5 +
    (hasConcreteInfo ? 0.3 : 0) +
    queryWordCoverage * 0.2,
  );

  const safetyFlags = ['unsafe', 'illegal', 'harmful', 'dangerous action', 'exploit'];
  const safetyPenalty = safetyFlags.filter((f) => content.includes(f)).length * 0.15;
  const safety = Math.max(0, 1 - safetyPenalty);

  const domainKeywords: Record<string, string[]> = {
    maritime: ['vessel', 'ship', 'port', 'route', 'cargo', 'maritime'],
    security: ['threat', 'vulnerability', 'cve', 'attack', 'breach'],
    legal: ['compliance', 'regulation', 'contract', 'statute', 'liability'],
    financial: ['portfolio', 'irr', 'nav', 'return', 'capital', 'fund'],
    real_estate: ['property', 'cap rate', 'noi', 'zoning', 'leasing'],
    research: ['model', 'paper', 'benchmark', 'dataset', 'training'],
  };

  const domainKws = domainKeywords[domain] ?? [];
  const domainHits = domainKws.filter((kw) => content.includes(kw)).length;
  const domainAccuracy = domainKws.length > 0
    ? Math.min(1, 0.4 + (domainHits / domainKws.length) * 0.6)
    : 0.5;

  const overallScore =
    coherence * 0.3 +
    completeness * 0.3 +
    safety * 0.2 +
    domainAccuracy * 0.2;

  return { coherence, completeness, safety, domainAccuracy, overallScore };
}

export async function runSpeculativeExecution(
  query: string,
  domain: string,
  modelList: Array<{ model: string; provider: string }>,
  messages: HFChatMessage[],
): Promise<SpeculativeExecutionResult> {
  const executionId = `spec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const startAll = Date.now();

  const modelsToUse = modelList.slice(0, 3);

  let candidates: SpeculativeCandidate[];

  if (!_modelCaller) {
    candidates = modelsToUse.map((m) => ({
      model: m.model,
      provider: m.provider,
      content: `[Speculative execution unavailable — model caller not registered for ${m.model}]`,
      latencyMs: 0,
      tokensUsed: 0,
      error: 'Model caller not registered',
    }));
  } else {
    const promises = modelsToUse.map(async (m): Promise<SpeculativeCandidate> => {
      try {
        const result = await _modelCaller!(m.model, m.provider, messages);
        return {
          model: m.model,
          provider: m.provider,
          content: result.content,
          latencyMs: result.latencyMs,
          tokensUsed: result.tokensUsed,
        };
      } catch (err) {
        return {
          model: m.model,
          provider: m.provider,
          content: '',
          latencyMs: 0,
          tokensUsed: 0,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    });

    candidates = await Promise.all(promises);
  }

  const scoredCandidates: ScoredCandidate[] = candidates
    .map((c) => ({ ...c, scores: scoreCandidate(c, query, domain), rank: 0 }))
    .sort((a, b) => b.scores.overallScore - a.scores.overallScore)
    .map((c, i) => ({ ...c, rank: i + 1 }));

  const winner = scoredCandidates[0]!;
  recordWinner(domain, winner.model);

  const totalLatencyMs = Date.now() - startAll;
  const maxIndividualLatency = Math.max(...candidates.map((c) => c.latencyMs), 1);
  const parallelSpeedup = candidates.reduce((s, c) => s + c.latencyMs, 0) / Math.max(1, totalLatencyMs);

  const judgeRationale = [
    `Winner: ${winner.model} (score: ${(winner.scores.overallScore * 100).toFixed(0)}%)`,
    `Coherence: ${(winner.scores.coherence * 100).toFixed(0)}%`,
    `Completeness: ${(winner.scores.completeness * 100).toFixed(0)}%`,
    `Safety: ${(winner.scores.safety * 100).toFixed(0)}%`,
    `Domain accuracy: ${(winner.scores.domainAccuracy * 100).toFixed(0)}%`,
    scoredCandidates.length > 1
      ? `Runner-up: ${scoredCandidates[1]!.model} (${(scoredCandidates[1]!.scores.overallScore * 100).toFixed(0)}%)`
      : '',
  ]
    .filter(Boolean)
    .join(' | ');

  return {
    executionId,
    query: query.slice(0, 200),
    domain,
    candidates: scoredCandidates,
    winner,
    judgeRationale,
    totalLatencyMs,
    parallelSpeedup,
  };
}

export function shouldUseSpeculativeExecution(
  isHighStakes: boolean,
  stakesLevel: 'low' | 'medium' | 'high' | 'critical',
): boolean {
  return isHighStakes || stakesLevel === 'critical' || stakesLevel === 'high';
}
