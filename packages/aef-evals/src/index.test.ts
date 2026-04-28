import { AEF_DOMAIN_PROFILE_DOMAINS, defaultProfileRegistry } from '@workspace/aef-domain-profiles';
import { describe, expect, it } from 'vitest';
import { ALL_GOLDEN_QUERIES, LYTE_MOCK_CORPUS, VESSELS_MOCK_CORPUS } from './fixtures/index.js';
import { computeLatencyPercentiles, runRetrievalEval } from './harness.js';
import { computeLatencyPercentiles as computeLatencyPercentilesLegacy } from './metrics/latency.js';
import { computeMrr } from './metrics/mrr.js';
import { computeNdcgAtK } from './metrics/ndcg.js';
import { computePrecisionAtK } from './metrics/precision.js';
import { computeRecallAtK } from './metrics/recall.js';
import {
  aggregateMetrics,
  computeAllMetrics,
  exactMatchRecoveryRate,
  mrr,
  ndcgAtK,
  precisionAtK,
  recallAtK,
} from './metrics.js';
import { runEval } from './runner.js';
import { runSmoke } from './smoke.js';
import type { RetrievalAdapter, RetrievalResult } from './types.js';

describe('retrieval metrics — unit tests', () => {
  const perfect = [
    { chunkId: 'a', score: 1.0 },
    { chunkId: 'b', score: 0.9 },
    { chunkId: 'c', score: 0.8 },
  ];
  const relevant = ['a', 'b', 'c'];
  const none = [
    { chunkId: 'x', score: 1.0 },
    { chunkId: 'y', score: 0.9 },
  ];

  it('recall@k = 1 when all relevant retrieved within k', () => {
    expect(recallAtK(perfect, relevant, 3)).toBeCloseTo(1.0);
  });

  it('recall@k = 0 when none relevant retrieved', () => {
    expect(recallAtK(none, relevant, 2)).toBeCloseTo(0.0);
  });

  it('recall@k is partial when only some relevant retrieved', () => {
    const partial = [
      { chunkId: 'a', score: 1.0 },
      { chunkId: 'x', score: 0.8 },
    ];
    expect(recallAtK(partial, relevant, 2)).toBeCloseTo(1 / 3);
  });

  it('precision@k = 1 when all retrieved are relevant', () => {
    expect(precisionAtK(perfect, relevant, 3)).toBeCloseTo(1.0);
  });

  it('nDCG@k = 1 for perfect ranking', () => {
    expect(ndcgAtK(perfect, relevant, 3)).toBeCloseTo(1.0, 5);
  });

  it('nDCG@k = 0 when no relevant documents retrieved', () => {
    expect(ndcgAtK(none, relevant, 2)).toBe(0);
  });

  it('MRR = 1 when first result is relevant', () => {
    expect(mrr(perfect, relevant)).toBeCloseTo(1.0);
  });

  it('MRR = 0.5 when second result is first relevant', () => {
    const results = [
      { chunkId: 'x', score: 1.0 },
      { chunkId: 'a', score: 0.9 },
    ];
    expect(mrr(results, ['a'])).toBeCloseTo(0.5);
  });

  it('MRR = 0 when no relevant result found', () => {
    expect(mrr(none, relevant)).toBe(0);
  });

  it('exactMatchRecoveryRate = 1 when all boost terms matched', () => {
    const retrieved = [{ chunkId: 'a', score: 1.0, boostTermsMatched: ['IMO', 'sanctions'] }];
    expect(exactMatchRecoveryRate(retrieved, ['IMO', 'sanctions'], 1)).toBeCloseTo(1.0);
  });

  it('exactMatchRecoveryRate = 0 when no boost terms matched', () => {
    const retrieved = [{ chunkId: 'a', score: 1.0, boostTermsMatched: [] }];
    expect(exactMatchRecoveryRate(retrieved, ['IMO', 'sanctions'], 1)).toBe(0);
  });

  it('exactMatchRecoveryRate = 1 with empty boost term list', () => {
    const retrieved = [{ chunkId: 'a', score: 1.0 }];
    expect(exactMatchRecoveryRate(retrieved, [], 1)).toBe(1);
  });

  it('all metric values are within [0, 1]', () => {
    const golden = {
      queryId: 'test',
      query: 'test query',
      relevantChunkIds: ['a'],
      exactMatchBoostTerms: ['test'],
    };
    const retrieved = [{ chunkId: 'a', score: 0.9, boostTermsMatched: ['test'] }];
    const metrics = computeAllMetrics(retrieved, golden, 5);
    for (const m of metrics) {
      expect(m.value).toBeGreaterThanOrEqual(0);
      expect(m.value).toBeLessThanOrEqual(1);
    }
  });

  it('aggregateMetrics averages correctly across queries', () => {
    const q1 = [{ metric: 'recall', atK: 5, value: 0.8 }];
    const q2 = [{ metric: 'recall', atK: 5, value: 0.4 }];
    const agg = aggregateMetrics([q1, q2]);
    expect(agg[0]?.value).toBeCloseTo(0.6);
  });
});

describe('legacy metric functions — individual file imports', () => {
  it('computeNdcgAtK returns 1.0 for perfect retrieval', () => {
    const retrieved = ['c1', 'c2', 'c3'];
    const relevant = ['c1', 'c2', 'c3'];
    expect(computeNdcgAtK(retrieved, relevant, 10)).toBeCloseTo(1.0);
  });

  it('computeNdcgAtK returns 0.0 when no relevant items retrieved', () => {
    const retrieved = ['c4', 'c5'];
    const relevant = ['c1', 'c2'];
    expect(computeNdcgAtK(retrieved, relevant, 10)).toBeCloseTo(0.0);
  });

  it('computeNdcgAtK returns partial score for partial match', () => {
    const retrieved = ['c1', 'c4', 'c5'];
    const relevant = ['c1', 'c2'];
    const ndcg = computeNdcgAtK(retrieved, relevant, 10);
    expect(ndcg).toBeGreaterThan(0);
    expect(ndcg).toBeLessThan(1);
  });

  it('computeRecallAtK returns 1.0 when all relevant items retrieved', () => {
    expect(computeRecallAtK(['a', 'b', 'c'], ['a', 'b'], 3)).toBeCloseTo(1.0);
  });

  it('computeRecallAtK returns 0.5 when half retrieved', () => {
    expect(computeRecallAtK(['a', 'x'], ['a', 'b'], 2)).toBeCloseTo(0.5);
  });

  it('computePrecisionAtK returns 1.0 when all retrieved are relevant', () => {
    expect(computePrecisionAtK(['a', 'b'], ['a', 'b', 'c'], 2)).toBeCloseTo(1.0);
  });

  it('computeMrr returns 1.0 when first result is relevant', () => {
    expect(computeMrr(['c1', 'c2'], ['c1'])).toBeCloseTo(1.0);
  });

  it('computeMrr returns 0.5 when second result is first relevant', () => {
    expect(computeMrr(['c2', 'c1'], ['c1'])).toBeCloseTo(0.5);
  });
});

describe('legacy computeLatencyPercentiles — metrics/latency.js', () => {
  it('computes percentiles correctly for a known array', () => {
    const latencies = Array.from({ length: 100 }, (_, i) => i + 1);
    const stats = computeLatencyPercentilesLegacy(latencies);
    expect(stats.p50).toBe(50);
    expect(stats.p95).toBe(95);
    expect(stats.p99).toBe(99);
    expect(stats.min).toBe(1);
    expect(stats.max).toBe(100);
  });

  it('returns zeros for empty input', () => {
    const stats = computeLatencyPercentilesLegacy([]);
    expect(stats.p50).toBe(0);
    expect(stats.p95).toBe(0);
  });
});

describe('latency percentile computation — harness', () => {
  it('computes correct p50, p95, p99 from sorted sample', () => {
    const latencies = Array.from({ length: 100 }, (_, i) => i + 1);
    const result = computeLatencyPercentiles(latencies);
    expect(result.p50Ms).toBeGreaterThanOrEqual(49);
    expect(result.p50Ms).toBeLessThanOrEqual(51);
    expect(result.p95Ms).toBeGreaterThanOrEqual(93);
    expect(result.p99Ms).toBeGreaterThanOrEqual(97);
    expect(result.minMs).toBe(1);
    expect(result.maxMs).toBe(100);
  });

  it('handles single-element array', () => {
    const result = computeLatencyPercentiles([42]);
    expect(result.p50Ms).toBe(42);
    expect(result.p99Ms).toBe(42);
  });

  it('returns zeros for empty array', () => {
    const result = computeLatencyPercentiles([]);
    expect(result.p50Ms).toBe(0);
    expect(result.samples).toBe(0);
  });
});

describe('retrieval harness — integration with mock corpus', () => {
  it('harness runs lyte golden queries and returns non-zero recall', async () => {
    const profile = defaultProfileRegistry.getProfileForDomain('lyte_governance_ops')!;
    const queries = ALL_GOLDEN_QUERIES.lyte_governance_ops;

    const adapter = {
      async retrieve(query: string, _profileId: string, topK: number) {
        const results: Array<{ chunkId: string; score: number; boostTermsMatched: string[] }> = [];
        const qLower = query.toLowerCase();
        for (const [chunkId, { text, boostTerms }] of LYTE_MOCK_CORPUS.entries()) {
          const textLower = text.toLowerCase();
          let score = 0;
          const words = qLower.split(/\s+/).filter((w) => w.length > 3);
          let hits = 0;
          for (const w of words) {
            if (textLower.includes(w)) hits++;
          }
          score += (hits / Math.max(words.length, 1)) * 0.6;
          const boostHits: string[] = [];
          for (const term of boostTerms) {
            if (qLower.includes(term.toLowerCase()) || textLower.includes(term.toLowerCase())) {
              score += 0.1;
              boostHits.push(term);
            }
          }
          if (score > 0) results.push({ chunkId, score, boostTermsMatched: boostHits });
        }
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, topK);
      },
    };

    const result = await runRetrievalEval({ evalId: 'test-lyte', profile, queries, adapter });
    expect(result.errorCount).toBe(0);
    expect(result.queryCount).toBe(queries.length);

    const recall = result.aggregateMetrics.find((m) => m.metric === 'recall')?.value ?? 0;
    expect(recall).toBeGreaterThan(0);
  });

  it('harness sets latency and throughput fields', async () => {
    const profile = defaultProfileRegistry.getProfileForDomain('vessels_maritime_risk')!;
    const queries = ALL_GOLDEN_QUERIES.vessels_maritime_risk;

    const adapter = {
      async retrieve(query: string, _profileId: string, topK: number) {
        const results: Array<{ chunkId: string; score: number; boostTermsMatched: string[] }> = [];
        const qLower = query.toLowerCase();
        for (const [chunkId, { text, boostTerms }] of VESSELS_MOCK_CORPUS.entries()) {
          const textLower = text.toLowerCase();
          let score = 0;
          const boostHits: string[] = [];
          for (const term of boostTerms) {
            if (qLower.includes(term.toLowerCase())) {
              score += 0.3;
              boostHits.push(term);
            }
            if (textLower.includes(term.toLowerCase())) score += 0.1;
          }
          if (score > 0) results.push({ chunkId, score, boostTermsMatched: boostHits });
        }
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, topK);
      },
    };

    const result = await runRetrievalEval({ evalId: 'test-vessels', profile, queries, adapter });
    expect(result.totalLatencyMs).toBeGreaterThanOrEqual(0);
    expect(result.avgLatencyMs).toBeGreaterThanOrEqual(0);
    expect(result.throughputQps).toBeGreaterThanOrEqual(0);
  });
});

describe('smoke test — all six domains pass with mock corpus', () => {
  it('all domains produce non-zero recall from golden fixtures', async () => {
    const report = await runSmoke();
    expect(report.totalDomains).toBe(AEF_DOMAIN_PROFILE_DOMAINS.length);
    for (const result of report.results) {
      expect(result.queryCount, `${result.domain} has no queries`).toBeGreaterThan(0);
      expect(result.avgRecallAtK, `${result.domain} recall@k is 0`).toBeGreaterThan(0);
    }
  }, 30000);

  it('all fixture sets have at least 20 queries each', () => {
    for (const domain of AEF_DOMAIN_PROFILE_DOMAINS) {
      const queries = ALL_GOLDEN_QUERIES[domain];
      expect(queries.length, `${domain} has fewer than 20 golden queries`).toBeGreaterThanOrEqual(
        20,
      );
    }
  });

  it('every domain includes adversarial queries tagged with expectedRelevant: 0', () => {
    for (const domain of AEF_DOMAIN_PROFILE_DOMAINS) {
      const adversarial = ALL_GOLDEN_QUERIES[domain].filter((q) => q.expectedRelevant === 0);
      expect(
        adversarial.length,
        `${domain} has fewer than 2 adversarial queries`,
      ).toBeGreaterThanOrEqual(2);
      for (const q of adversarial) {
        expect(
          q.relevantChunkIds.length,
          `${domain} adversarial query ${q.queryId} should have empty relevantChunkIds`,
        ).toBe(0);
      }
    }
  });

  it('smoke run reports adversarial precision separately and meets threshold', async () => {
    const report = await runSmoke();
    for (const result of report.results) {
      expect(
        result.adversarialQueryCount,
        `${result.domain} has no adversarial queries`,
      ).toBeGreaterThan(0);
      expect(
        result.avgAdversarialPrecision,
        `${result.domain} adversarial precision below 0.66`,
      ).toBeGreaterThanOrEqual(0.66);
      expect(result.positiveQueryCount + result.adversarialQueryCount).toBe(result.queryCount);
    }
  }, 30000);

  it('smoke run passes tightened thresholds for all domains', async () => {
    const report = await runSmoke();
    for (const result of report.results) {
      expect(result.passed, `${result.domain} failed: ${result.failures.join('; ')}`).toBe(true);
    }
    expect(report.allPassed).toBe(true);
  }, 30000);
});

describe('legacy runEval runner', () => {
  it('produces well-formed eval results', async () => {
    const mockAdapter: RetrievalAdapter = {
      async search(query: string, topK: number): Promise<RetrievalResult> {
        void query;
        return {
          queryId: 'mock',
          retrievedChunkIds: Array.from({ length: topK }, (_, i) => `chunk-${i}`),
          latencyMs: 15 + Math.random() * 10,
        };
      },
    };

    const fixtures = ALL_GOLDEN_QUERIES.vessels_maritime_risk.map((q) => ({
      queryId: q.queryId,
      query: q.query,
      relevantChunkIds: q.relevantChunkIds,
      domain: 'vessels_maritime_risk' as const,
    }));

    const result = await runEval(
      {
        profileId: 'vessels_maritime_risk',
        queries: fixtures,
      },
      mockAdapter,
      {
        topK: 5,
        metrics: ['ndcg', 'recall', 'precision', 'mrr'],
      },
    );

    expect(result.profileId).toBe('vessels_maritime_risk');
    expect(result.queryCount).toBe(fixtures.length);
    expect(result.metrics.length).toBe(4);
    expect(result.latencyP50Ms).toBeGreaterThanOrEqual(0);
  });
});
