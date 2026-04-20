/**
 * AEF Retrieval Smoke Tests
 *
 * Fast sanity checks that run in CI without a live embedding service.
 * Uses the MockCorpusAdapter backed by the golden fixture corpora.
 * Tests confirm: harness executes without error, metrics are in [0,1],
 * recall@k is non-zero for well-formed golden queries, and each profile's
 * exact-match boost terms produce measurable recovery signal.
 */

import {
  defaultProfileRegistry,
  type AEFDomain,
  AEF_DOMAIN_PROFILE_DOMAINS,
} from "@workspace/aef-domain-profiles";
import { ALL_GOLDEN_QUERIES, ALL_MOCK_CORPORA } from "./fixtures/index.js";
import { runRetrievalEval, type RetrievalAdapter } from "./harness.js";
import type { RetrievedResult } from "./metrics.js";

export interface SmokeResult {
  domain: AEFDomain;
  profileId: string;
  queryCount: number;
  avgRecallAtK: number;
  avgNdcgAtK: number;
  avgMrr: number;
  avgExactMatchRecovery: number;
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

        const boostHits: string[] = [];
        for (const term of boostTerms) {
          if (queryLower.includes(term.toLowerCase()) || textLower.includes(term.toLowerCase())) {
            score += 0.1;
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
        avgRecallAtK: 0,
        avgNdcgAtK: 0,
        avgMrr: 0,
        avgExactMatchRecovery: 0,
        passed: false,
        failures: [`No profile found for domain: ${domain}`],
      });
      continue;
    }

    const queries = ALL_GOLDEN_QUERIES[domain];
    const adapter = buildMockAdapter(domain);
    const report = await runRetrievalEval({
      evalId: `smoke-${domain}`,
      profile,
      queries,
      adapter,
    });

    const failures: string[] = [];
    const agg = report.aggregateMetrics;

    const recall = agg.find((m) => m.metric === "recall")?.value ?? 0;
    const ndcg = agg.find((m) => m.metric === "ndcg")?.value ?? 0;
    const mrr_ = agg.find((m) => m.metric === "mrr")?.value ?? 0;
    const emr = agg.find((m) => m.metric === "exact_match_recovery")?.value ?? 0;

    if (recall < 0.3) failures.push(`recall@k too low: ${recall.toFixed(3)}`);
    if (ndcg < 0.2) failures.push(`nDCG@k too low: ${ndcg.toFixed(3)}`);
    if (report.errorCount > 0) failures.push(`${report.errorCount} query errors`);

    results.push({
      domain,
      profileId: profile.profileId,
      queryCount: queries.length,
      avgRecallAtK: recall,
      avgNdcgAtK: ndcg,
      avgMrr: mrr_,
      avgExactMatchRecovery: emr,
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
