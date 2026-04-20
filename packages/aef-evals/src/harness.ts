/**
 * AEF Retrieval Evaluation Harness
 *
 * Executes named evals against a profile by dispatching to mock or live
 * retrieval adapters, collecting per-query metrics, and returning a
 * structured EvalHarnessResult. All latency measurements use
 * performance.now() for sub-millisecond precision on Replit CPU.
 */

import type { DomainProfile } from "@workspace/aef-domain-profiles/schema";
import {
  computeAllMetrics,
  aggregateMetrics,
  type GoldenQuery,
  type RetrievedResult,
  type MetricResult,
} from "./metrics.js";

export interface RetrievalAdapter {
  retrieve(
    query: string,
    profileId: string,
    topK: number,
    metadata?: Record<string, unknown>,
  ): Promise<RetrievedResult[]>;
}

export interface EvalHarnessRequest {
  evalId: string;
  profile: DomainProfile;
  queries: GoldenQuery[];
  adapter: RetrievalAdapter;
  topK?: number;
}

export interface PerQueryResult {
  queryId: string;
  query: string;
  retrieved: RetrievedResult[];
  metrics: MetricResult[];
  latencyMs: number;
  error?: string;
}

export interface EvalHarnessResult {
  evalId: string;
  profileId: string;
  profileVersion: string;
  queryCount: number;
  successCount: number;
  errorCount: number;
  perQuery: PerQueryResult[];
  aggregateMetrics: MetricResult[];
  totalLatencyMs: number;
  avgLatencyMs: number;
  throughputQps: number;
  ranAt: string;
}

export async function runRetrievalEval(
  request: EvalHarnessRequest,
): Promise<EvalHarnessResult> {
  const { evalId, profile, queries, adapter } = request;
  const topK = request.topK ?? profile.topK;

  const perQuery: PerQueryResult[] = [];
  const harnessStart = performance.now();

  for (const golden of queries) {
    const queryStart = performance.now();
    try {
      const retrieved = await adapter.retrieve(
        golden.query,
        profile.profileId,
        topK,
        golden.metadata,
      );
      const latencyMs = performance.now() - queryStart;
      const metrics = computeAllMetrics(retrieved, golden, topK);
      perQuery.push({ queryId: golden.queryId, query: golden.query, retrieved, metrics, latencyMs });
    } catch (err) {
      const latencyMs = performance.now() - queryStart;
      perQuery.push({
        queryId: golden.queryId,
        query: golden.query,
        retrieved: [],
        metrics: [],
        latencyMs,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const totalLatencyMs = performance.now() - harnessStart;
  const successes = perQuery.filter((q) => !q.error);
  const agg = aggregateMetrics(successes.map((q) => q.metrics).filter((m) => m.length > 0));

  return {
    evalId,
    profileId: profile.profileId,
    profileVersion: profile.version,
    queryCount: queries.length,
    successCount: successes.length,
    errorCount: perQuery.length - successes.length,
    perQuery,
    aggregateMetrics: agg,
    totalLatencyMs,
    avgLatencyMs: perQuery.length > 0 ? totalLatencyMs / perQuery.length : 0,
    throughputQps: perQuery.length > 0 ? (perQuery.length / totalLatencyMs) * 1000 : 0,
    ranAt: new Date().toISOString(),
  };
}

export interface LatencyBenchmarkResult {
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  minMs: number;
  maxMs: number;
  avgMs: number;
  samples: number;
  throughputQps: number;
}

export function computeLatencyPercentiles(latencies: number[]): LatencyBenchmarkResult {
  if (latencies.length === 0) {
    return { p50Ms: 0, p95Ms: 0, p99Ms: 0, minMs: 0, maxMs: 0, avgMs: 0, samples: 0, throughputQps: 0 };
  }
  const sorted = [...latencies].sort((a, b) => a - b);
  const idx = (pct: number) => Math.min(Math.ceil((pct / 100) * sorted.length) - 1, sorted.length - 1);
  const total = sorted.reduce((a, b) => a + b, 0);
  return {
    p50Ms: sorted[idx(50)]!,
    p95Ms: sorted[idx(95)]!,
    p99Ms: sorted[idx(99)]!,
    minMs: sorted[0]!,
    maxMs: sorted[sorted.length - 1]!,
    avgMs: total / sorted.length,
    samples: sorted.length,
    throughputQps: sorted.length > 0 ? (sorted.length / total) * 1000 : 0,
  };
}
