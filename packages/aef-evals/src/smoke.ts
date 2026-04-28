/**
 * AEF Retrieval Smoke Tests
 *
 * Fast sanity checks that run in CI without a live embedding service.
 * Uses the MockCorpusAdapter backed by the golden fixture corpora.
 *
 * Each domain fixture set contains a mix of positive queries (with known
 * relevant chunks) and adversarial queries (tagged `expectedRelevant: 0`)
 * which the retriever should refuse to answer. The smoke harness:
 *   - splits adversarial from positive queries before computing aggregates
 *     (positive recall/nDCG/MRR are not inflated by the always-1.0 score
 *     that empty relevant sets produce);
 *   - reports `avgAdversarialPrecision` separately — the fraction of
 *     adversarial queries for which the retriever returned no chunks; and
 *   - applies tightened pass thresholds suitable for ≥20-query fixture
 *     sets covering structured ID lookups, natural language, edge cases,
 *     multi-entity composites, and adversarial inputs.
 */

import {
  AEF_DOMAIN_PROFILE_DOMAINS,
  type AEFDomain,
  defaultProfileRegistry,
} from '@workspace/cf-domain-profiles';
import { ALL_GOLDEN_QUERIES, ALL_MOCK_CORPORA } from './fixtures/index.js';
import { type RetrievalAdapter, runRetrievalEval } from './harness.js';
import type { GoldenQuery, RetrievedResult } from './metrics.js';

export interface SmokeResult {
  domain: AEFDomain;
  profileId: string;
  queryCount: number;
  positiveQueryCount: number;
  adversarialQueryCount: number;
  avgRecallAtK: number;
  avgNdcgAtK: number;
  avgMrr: number;
  avgExactMatchRecovery: number;
  avgAdversarialPrecision: number;
  passed: boolean;
  failures: string[];
}

export interface SmokeRunReport {
  ranAt: string;
  totalDomains: number;
  passedDomains: number;
  failedDomains: number;
  results: SmokeResult[];
  allPassed: boolean;
}

/**
 * Tightened smoke thresholds. With ≥20 queries per domain spanning
 * structured ID lookups, natural language, edge cases, and ambiguous
 * phrasing, recall and nDCG should clear higher floors than the original
 * 6-query fixtures supported.
 */
export const SMOKE_THRESHOLDS = {
  minRecallAtK: 0.45,
  minNdcgAtK: 0.35,
  minAdversarialPrecision: 0.66,
  minPositiveQueries: 15,
  minAdversarialQueries: 2,
} as const;

function isAdversarial(q: GoldenQuery): boolean {
  return q.expectedRelevant === 0;
}

function buildMockAdapter(domain: AEFDomain): RetrievalAdapter {
  const corpus = ALL_MOCK_CORPORA[domain];

  return {
    async retrieve(query, _profileId, topK): Promise<RetrievedResult[]> {
      const queryLower = query.toLowerCase();
      const scored: Array<{ chunkId: string; score: number; boostTermsMatched: string[] }> = [];

      for (const [chunkId, { text, boostTerms }] of corpus.entries()) {
        const textLower = text.toLowerCase();
        let score = 0;

        const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 3);
        let wordHits = 0;
        for (const word of queryWords) {
          if (textLower.includes(word)) wordHits++;
        }
        score += (wordHits / Math.max(queryWords.length, 1)) * 0.6;

        // Only credit boost terms when both the query and the chunk text
        // mention them. Crediting purely on chunk text would give every
        // chunk a baseline score (boost terms are by definition in the
        // chunk text), which would prevent adversarial queries from ever
        // returning an empty result set.
        const boostHits: string[] = [];
        for (const term of boostTerms) {
          const t = term.toLowerCase();
          if (queryLower.includes(t) && textLower.includes(t)) {
            score += 0.15;
            boostHits.push(term);
          }
        }

        if (score > 0) {
          scored.push({ chunkId, score, boostTermsMatched: boostHits });
        }
      }

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, topK).map((s) => ({
        chunkId: s.chunkId,
        score: Math.min(s.score, 1),
        boostTermsMatched: s.boostTermsMatched,
      }));
    },
  };
}

export async function runSmoke(): Promise<SmokeRunReport> {
  const results: SmokeResult[] = [];

  for (const domain of AEF_DOMAIN_PROFILE_DOMAINS) {
    const profile = defaultProfileRegistry.getProfileForDomain(domain);
    if (!profile) {
      results.push({
        domain,
        profileId: domain,
        queryCount: 0,
        positiveQueryCount: 0,
        adversarialQueryCount: 0,
        avgRecallAtK: 0,
        avgNdcgAtK: 0,
        avgMrr: 0,
        avgExactMatchRecovery: 0,
        avgAdversarialPrecision: 0,
        passed: false,
        failures: [`No profile found for domain: ${domain}`],
      });
      continue;
    }

    const allQueries = ALL_GOLDEN_QUERIES[domain];
    const positiveQueries = allQueries.filter((q) => !isAdversarial(q));
    const adversarialQueries = allQueries.filter(isAdversarial);
    const adapter = buildMockAdapter(domain);

    // Run only the positive queries through the standard harness so the
    // aggregate recall/nDCG/MRR figures reflect retrieval quality on
    // queries that actually have a known relevant set.
    const report = await runRetrievalEval({
      evalId: `smoke-${domain}`,
      profile,
      queries: positiveQueries,
      adapter,
    });

    // Compute adversarial precision separately: fraction of adversarial
    // queries for which the adapter returned no chunks.
    let adversarialCorrect = 0;
    for (const q of adversarialQueries) {
      const retrieved = await adapter.retrieve(q.query, profile.profileId, profile.topK);
      if (retrieved.length === 0) adversarialCorrect++;
    }
    const adversarialPrecision =
      adversarialQueries.length === 0 ? 1 : adversarialCorrect / adversarialQueries.length;

    const failures: string[] = [];
    const agg = report.aggregateMetrics;

    const recall = agg.find((m) => m.metric === 'recall')?.value ?? 0;
    const ndcg = agg.find((m) => m.metric === 'ndcg')?.value ?? 0;
    const mrr_ = agg.find((m) => m.metric === 'mrr')?.value ?? 0;
    const emr = agg.find((m) => m.metric === 'exact_match_recovery')?.value ?? 0;

    if (positiveQueries.length < SMOKE_THRESHOLDS.minPositiveQueries) {
      failures.push(
        `positive query count too low: ${positiveQueries.length} (min ${SMOKE_THRESHOLDS.minPositiveQueries})`,
      );
    }
    if (adversarialQueries.length < SMOKE_THRESHOLDS.minAdversarialQueries) {
      failures.push(
        `adversarial query count too low: ${adversarialQueries.length} (min ${SMOKE_THRESHOLDS.minAdversarialQueries})`,
      );
    }
    if (recall < SMOKE_THRESHOLDS.minRecallAtK) {
      failures.push(
        `recall@k too low: ${recall.toFixed(3)} (min ${SMOKE_THRESHOLDS.minRecallAtK})`,
      );
    }
    if (ndcg < SMOKE_THRESHOLDS.minNdcgAtK) {
      failures.push(`nDCG@k too low: ${ndcg.toFixed(3)} (min ${SMOKE_THRESHOLDS.minNdcgAtK})`);
    }
    if (adversarialPrecision < SMOKE_THRESHOLDS.minAdversarialPrecision) {
      failures.push(
        `adversarial precision too low: ${adversarialPrecision.toFixed(3)} (min ${SMOKE_THRESHOLDS.minAdversarialPrecision})`,
      );
    }
    if (report.errorCount > 0) failures.push(`${report.errorCount} query errors`);

    results.push({
      domain,
      profileId: profile.profileId,
      queryCount: allQueries.length,
      positiveQueryCount: positiveQueries.length,
      adversarialQueryCount: adversarialQueries.length,
      avgRecallAtK: recall,
      avgNdcgAtK: ndcg,
      avgMrr: mrr_,
      avgExactMatchRecovery: emr,
      avgAdversarialPrecision: adversarialPrecision,
      passed: failures.length === 0,
      failures,
    });
  }

  const passed = results.filter((r) => r.passed).length;
  return {
    ranAt: new Date().toISOString(),
    totalDomains: results.length,
    passedDomains: passed,
    failedDomains: results.length - passed,
    results,
    allPassed: passed === results.length,
  };
}
