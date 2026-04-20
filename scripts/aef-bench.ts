#!/usr/bin/env tsx
/**
 * AEF Benchmark
 *
 * Measures end-to-end retrieval performance for all six SZL domain profiles.
 *
 * Two modes:
 *
 *   Fixture mode (default, no-GPU, no external services):
 *     Scores queries against the golden fixture corpus using text-overlap.
 *     Use this for CI validation and local regression tracking.
 *
 *   Live mode (--live):
 *     Calls the running AEF hybrid-search endpoint (embed + hybrid + rerank
 *     stack). Use this for production stack profiling. Requires the API server
 *     to be running locally or AEF_API_URL to point at a live instance.
 *
 * Usage:
 *   pnpm tsx scripts/aef-bench.ts                          # fixture mode
 *   pnpm tsx scripts/aef-bench.ts --iterations 200 --warmup 20
 *   pnpm tsx scripts/aef-bench.ts --live                   # live AEF stack
 *   AEF_API_URL=https://... pnpm tsx scripts/aef-bench.ts --live
 */

import { randomUUID } from "crypto";
import {
  AEF_DOMAIN_PROFILE_DOMAINS,
  defaultProfileRegistry,
  type AEFDomain,
} from "@workspace/aef-domain-profiles";
import {
  ALL_GOLDEN_QUERIES,
  ALL_MOCK_CORPORA,
  computeAllMetrics,
  aggregateMetrics,
  computeLatencyPercentiles,
  runRetrievalEval,
  type RetrievalAdapter,
  type GoldenQuery,
  type RetrievedResult,
} from "@workspace/aef-evals";

const args = process.argv.slice(2);

function getArg(name: string, fallback: number): number {
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && args[idx + 1]) return parseInt(args[idx + 1]!, 10);
  return fallback;
}

const ITERATIONS = getArg("iterations", 100);
const WARMUP = getArg("warmup", 10);
const LIVE_MODE = args.includes("--live");

const AEF_BASE_URL = (process.env["AEF_API_URL"] ?? "http://localhost:5000/alloy-embedding-api").replace(/\/$/, "");
const AEF_TENANT_ID = process.env["AEF_BENCH_TENANT_ID"] ?? "bench-tenant";

function buildLiveAdapter(): RetrievalAdapter {
  return {
    async retrieve(query: string, _profileId: string, topK: number): Promise<RetrievedResult[]> {
      const response = await fetch(`${AEF_BASE_URL}/v1/hybrid-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": AEF_TENANT_ID },
        body: JSON.stringify({
          requestId: randomUUID(),
          tenantId: AEF_TENANT_ID,
          query,
          topK,
          candidatePool: Math.max(topK * 3, 20),
          denseWeight: 0.6,
          keywordWeight: 0.4,
          includeProvenance: false,
        }),
      });
      if (!response.ok) {
        throw new Error(`AEF hybrid-search returned HTTP ${response.status}: ${await response.text()}`);
      }
      const data = await response.json() as {
        hits?: Array<{ chunkId: string; finalScore: number }>;
      };
      return (data.hits ?? []).slice(0, topK).map((h) => ({
        chunkId: h.chunkId,
        score: h.finalScore,
      }));
    },
  };
}

function buildMockAdapter(domain: AEFDomain): RetrievalAdapter {
  const corpus = ALL_MOCK_CORPORA[domain];
  return {
    async retrieve(query: string, _profileId: string, topK: number): Promise<RetrievedResult[]> {
      const qLower = query.toLowerCase();
      const scored: Array<{ chunkId: string; score: number; boostTermsMatched: string[] }> = [];

      for (const [chunkId, { text, boostTerms }] of corpus.entries()) {
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
        if (score > 0) scored.push({ chunkId, score, boostTermsMatched: boostHits });
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

function fmt(n: number, digits = 2): string {
  return n.toFixed(digits);
}

function pad(s: string, width: number): string {
  return s.padEnd(width);
}

async function benchDomain(domain: AEFDomain): Promise<{
  domain: AEFDomain;
  latencies: ReturnType<typeof computeLatencyPercentiles>;
  rawLatencies: number[];
  recall: number;
  ndcg: number;
  mrr: number;
}> {
  const profile = defaultProfileRegistry.getProfileForDomain(domain)!;
  const goldenQueries = ALL_GOLDEN_QUERIES[domain];
  const adapter = LIVE_MODE ? buildLiveAdapter() : buildMockAdapter(domain);

  const cycleQueries: GoldenQuery[] = [];
  for (let i = 0; i < Math.ceil(ITERATIONS / goldenQueries.length); i++) {
    cycleQueries.push(...goldenQueries);
  }
  const queryBatch = cycleQueries.slice(0, ITERATIONS);

  for (let i = 0; i < WARMUP; i++) {
    const q = goldenQueries[i % goldenQueries.length]!;
    await adapter.retrieve(q.query, profile.profileId, profile.topK);
  }

  const rawLatencies: number[] = [];
  let totalRecall = 0;
  let totalNdcg = 0;
  let totalMrr = 0;

  for (const q of queryBatch) {
    const start = performance.now();
    const retrieved = await adapter.retrieve(q.query, profile.profileId, profile.topK);
    const elapsed = performance.now() - start;
    rawLatencies.push(elapsed);

    const metrics = computeAllMetrics(retrieved, q, profile.topK);
    totalRecall += metrics.find((m) => m.metric === "recall")?.value ?? 0;
    totalNdcg += metrics.find((m) => m.metric === "ndcg")?.value ?? 0;
    totalMrr += metrics.find((m) => m.metric === "mrr")?.value ?? 0;
  }

  const n = queryBatch.length;
  return {
    domain,
    latencies: computeLatencyPercentiles(rawLatencies),
    rawLatencies,
    recall: totalRecall / n,
    ndcg: totalNdcg / n,
    mrr: totalMrr / n,
  };
}

async function main(): Promise<void> {
  const line = "─".repeat(100);

  console.log("\n" + line);
  console.log("  AEF BENCHMARK");
  console.log(`  Mode     : ${LIVE_MODE ? `LIVE  (${AEF_BASE_URL})` : "FIXTURE (mock corpus, no-GPU)"}`);
  console.log(`  Platform : ${process.platform}  Node: ${process.version}`);
  console.log(`  Iterations: ${ITERATIONS} per domain  Warmup: ${WARMUP}`);
  console.log(`  Profiles: ${AEF_DOMAIN_PROFILE_DOMAINS.length} domains`);
  console.log(line + "\n");

  const domainW = 30;
  const numW = 10;
  const header =
    pad("Domain", domainW) +
    pad("p50 ms", numW) +
    pad("p95 ms", numW) +
    pad("p99 ms", numW) +
    pad("avg ms", numW) +
    pad("QPS", numW) +
    pad("recall@k", numW) +
    pad("nDCG@k", numW) +
    "MRR";
  console.log(header);
  console.log("─".repeat(header.length + 3));

  const allLatencies: number[] = [];
  let globalRecall = 0;
  let globalNdcg = 0;
  let globalMrr = 0;

  for (const domain of AEF_DOMAIN_PROFILE_DOMAINS) {
    process.stdout.write(`  benchmarking ${domain}...`);
    const result = await benchDomain(domain);
    process.stdout.write("\r");

    allLatencies.push(...result.rawLatencies);
    globalRecall += result.recall;
    globalNdcg += result.ndcg;
    globalMrr += result.mrr;

    const l = result.latencies;
    const row =
      pad(domain, domainW) +
      pad(fmt(l.p50Ms), numW) +
      pad(fmt(l.p95Ms), numW) +
      pad(fmt(l.p99Ms), numW) +
      pad(fmt(l.avgMs), numW) +
      pad(fmt(l.throughputQps, 0), numW) +
      pad(fmt(result.recall, 3), numW) +
      pad(fmt(result.ndcg, 3), numW) +
      fmt(result.mrr, 3);
    console.log(row);
  }

  const n = AEF_DOMAIN_PROFILE_DOMAINS.length;
  const overall = computeLatencyPercentiles(allLatencies);
  console.log("─".repeat(header.length + 3));
  const summaryRow =
    pad("OVERALL", domainW) +
    pad(fmt(overall.p50Ms), numW) +
    pad(fmt(overall.p95Ms), numW) +
    pad(fmt(overall.p99Ms), numW) +
    pad(fmt(overall.avgMs), numW) +
    pad(fmt(overall.throughputQps, 0), numW) +
    pad(fmt(globalRecall / n, 3), numW) +
    pad(fmt(globalNdcg / n, 3), numW) +
    fmt(globalMrr / n, 3);
  console.log(summaryRow);

  console.log("\n" + line);
  if (LIVE_MODE) {
    console.log("  Benchmark complete. Ran against live AEF hybrid-search stack.");
  } else {
    console.log("  Benchmark complete (fixture mode). All operations ran on CPU without GPU.");
    console.log("  Use --live to benchmark the live embed + hybrid-search + rerank stack.");
  }
  console.log(line + "\n");
}

main().catch((err) => {
  console.error("[aef-bench] Fatal error:", err);
  process.exit(1);
});
