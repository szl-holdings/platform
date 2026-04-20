import type {
  GoldenFixtureSet,
  RetrievalResult,
  MetricResult,
  EvidenceCompletenessResult,
  EvalRunResult,
  RetrievalAdapter,
} from "./types.js";
import { computeNdcgAtK } from "./metrics/ndcg.js";
import { computeRecallAtK } from "./metrics/recall.js";
import { computePrecisionAtK } from "./metrics/precision.js";
import { computeMrr } from "./metrics/mrr.js";
import { computeLatencyPercentiles } from "./metrics/latency.js";

export type RequestedMetric = "ndcg" | "recall" | "precision" | "mrr";

export interface EvalRunOptions {
  topK?: number;
  metrics?: RequestedMetric[];
  evidenceCheckFn?: (queryId: string) => Partial<EvidenceCompletenessResult>;
}

export async function runEval(
  fixtureSet: GoldenFixtureSet,
  adapter: RetrievalAdapter,
  options: EvalRunOptions = {},
): Promise<EvalRunResult> {
  const {
    topK = 10,
    metrics = ["ndcg", "recall", "precision", "mrr"],
    evidenceCheckFn,
  } = options;

  const latenciesMs: number[] = [];
  const retrievalResults: RetrievalResult[] = [];

  for (const gq of fixtureSet.queries) {
    const result = await adapter.search(gq.query, topK);
    latenciesMs.push(result.latencyMs);
    retrievalResults.push(result);
  }

  const ndcgValues: number[] = [];
  const recallValues: number[] = [];
  const precisionValues: number[] = [];
  const mrrValues: number[] = [];

  for (let i = 0; i < fixtureSet.queries.length; i++) {
    const gq = fixtureSet.queries[i]!;
    const rr = retrievalResults[i]!;

    if (metrics.includes("ndcg")) ndcgValues.push(computeNdcgAtK(rr.retrievedChunkIds, gq.relevantChunkIds, topK));
    if (metrics.includes("recall")) recallValues.push(computeRecallAtK(rr.retrievedChunkIds, gq.relevantChunkIds, topK));
    if (metrics.includes("precision")) precisionValues.push(computePrecisionAtK(rr.retrievedChunkIds, gq.relevantChunkIds, topK));
    if (metrics.includes("mrr")) mrrValues.push(computeMrr(rr.retrievedChunkIds, gq.relevantChunkIds));
  }

  function avg(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((s, v) => s + v, 0) / arr.length;
  }

  const metricResults: MetricResult[] = [];
  if (metrics.includes("ndcg")) metricResults.push({ metric: "ndcg", atK: topK, value: avg(ndcgValues) });
  if (metrics.includes("recall")) metricResults.push({ metric: "recall", atK: topK, value: avg(recallValues) });
  if (metrics.includes("precision")) metricResults.push({ metric: "precision", atK: topK, value: avg(precisionValues) });
  if (metrics.includes("mrr")) metricResults.push({ metric: "mrr", atK: topK, value: avg(mrrValues) });

  const evidenceCompleteness: EvidenceCompletenessResult[] = fixtureSet.queries.map((gq) => {
    const provided = evidenceCheckFn ? evidenceCheckFn(gq.queryId) : {};
    const result: EvidenceCompletenessResult = {
      queryId: gq.queryId,
      hasSourceId: provided.hasSourceId ?? false,
      hasChunkId: provided.hasChunkId ?? false,
      hasDenseScore: provided.hasDenseScore ?? false,
      hasFusedScore: provided.hasFusedScore ?? false,
      hasPolicyDecision: provided.hasPolicyDecision ?? false,
      hasTraceId: provided.hasTraceId ?? false,
      complete: false,
    };
    result.complete =
      result.hasSourceId &&
      result.hasChunkId &&
      result.hasFusedScore &&
      result.hasPolicyDecision;
    return result;
  });

  const latencyStats = computeLatencyPercentiles(latenciesMs);
  const totalMs = latenciesMs.reduce((s, v) => s + v, 0);
  const throughputQps = totalMs > 0 ? (fixtureSet.queries.length / totalMs) * 1000 : 0;

  return {
    evalId: `eval-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    profileId: fixtureSet.profileId,
    datasetId: fixtureSet.fixtureSetId,
    queryCount: fixtureSet.queries.length,
    metrics: metricResults,
    evidenceCompleteness,
    latencyP50Ms: latencyStats.p50,
    latencyP95Ms: latencyStats.p95,
    latencyP99Ms: latencyStats.p99,
    throughputQps,
    completedAt: new Date().toISOString(),
  };
}
