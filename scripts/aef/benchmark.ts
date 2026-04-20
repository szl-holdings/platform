#!/usr/bin/env tsx
/**
 * scripts/aef/benchmark.ts — AEF Throughput & Latency Benchmark
 *
 * Measures embed throughput, hybrid-search p50/p95/p99 latency, and
 * rerank throughput against a running AEF API instance.
 *
 * Usage:
 *   tsx scripts/aef/benchmark.ts
 *   AEF_API_URL=http://localhost:4200 AEF_API_KEY=dev-insecure-key tsx scripts/aef/benchmark.ts
 *
 * Environment:
 *   AEF_API_URL   — base URL of the AEF API (default: http://localhost:4200)
 *   AEF_API_KEY   — bearer token (default: empty = no auth header)
 *   BENCH_ROUNDS  — number of repetitions per benchmark (default: 20)
 *   TENANT_ID     — tenant to use (default: smoke-test-tenant)
 */

const BASE_URL = process.env["AEF_API_URL"] ?? "http://localhost:4200";
const API_KEY = process.env["AEF_API_KEY"] ?? "";
const ROUNDS = parseInt(process.env["BENCH_ROUNDS"] ?? "20", 10);
const TENANT_ID = process.env["TENANT_ID"] ?? "smoke-test-tenant";

const headers: Record<string, string> = {
  "Content-Type": "application/json",
  "x-tenant-id": TENANT_ID,
  ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)]!;
}

function stats(samples: number[]): { min: number; p50: number; p95: number; p99: number; max: number; avg: number } {
  const sorted = [...samples].sort((a, b) => a - b);
  const avg = samples.reduce((s, v) => s + v, 0) / samples.length;
  return {
    min: sorted[0]!,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    max: sorted[sorted.length - 1]!,
    avg: Math.round(avg * 100) / 100,
  };
}

async function post(path: string, body: unknown): Promise<{ statusCode: number; json: unknown; elapsedMs: number }> {
  const t0 = Date.now();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { statusCode: res.status, json, elapsedMs: Date.now() - t0 };
}

function row(label: string, s: ReturnType<typeof stats>, unit = "ms"): string {
  return `  ${label.padEnd(22)} min=${s.min}${unit}  p50=${s.p50}${unit}  p95=${s.p95}${unit}  p99=${s.p99}${unit}  max=${s.max}${unit}  avg=${s.avg}${unit}`;
}

// ---------------------------------------------------------------------------
// Benchmark suites
// ---------------------------------------------------------------------------

async function benchEmbed(): Promise<void> {
  console.log("\n── Embed Throughput ──────────────────────────────────────");
  const INPUTS = [
    "Quarterly risk summary for maritime shipping lanes",
    "DORA compliance gap analysis for financial institutions",
  ];

  const latencies: number[] = [];
  let failures = 0;

  for (let i = 0; i < ROUNDS; i++) {
    const { statusCode, elapsedMs } = await post("/v1/embed", {
      requestId: `bench-embed-${i}`,
      tenantId: TENANT_ID,
      texts: INPUTS,
    });
    if (statusCode === 200) {
      latencies.push(elapsedMs);
    } else {
      failures++;
    }
  }

  const s = stats(latencies);
  console.log(row("embed (2 inputs)", s));
  if (failures > 0) console.warn(`  WARN: ${failures}/${ROUNDS} requests failed`);
  const throughput = Math.round((ROUNDS * INPUTS.length * 1000) / latencies.reduce((a, b) => a + b, 0));
  console.log(`  throughput              ≈${throughput} vectors/sec (${ROUNDS} rounds × ${INPUTS.length} inputs)`);
}

async function benchSearch(): Promise<void> {
  console.log("\n── Hybrid Search Latency ─────────────────────────────────");

  const QUERIES = [
    "container vessel detention risk Red Sea",
    "cyber incident response playbook zero-day",
    "commercial real estate cap rate compression",
    "governance policy board fiduciary obligations",
    "private equity deal flow LP compliance",
  ];

  const latencies: number[] = [];
  let failures = 0;

  for (let i = 0; i < ROUNDS; i++) {
    const q = QUERIES[i % QUERIES.length]!;
    const { statusCode, elapsedMs, json } = await post("/v1/hybrid-search", {
      requestId: `bench-search-${i}`,
      tenantId: TENANT_ID,
      query: q,
      topK: 5,
      candidatePool: 20,
    });
    if (statusCode === 200) {
      latencies.push(elapsedMs);
      const resp = json as { retrievalPath?: string[] };
      // Validate 13-stage canonical pipeline is present
      if (resp.retrievalPath?.length !== 13) {
        console.warn(`  WARN round ${i}: expected 13 retrieval stages, got ${resp.retrievalPath?.length}`);
      }
    } else {
      failures++;
    }
  }

  const s = stats(latencies);
  console.log(row("hybrid-search (topK=5)", s));
  if (failures > 0) console.warn(`  WARN: ${failures}/${ROUNDS} requests failed`);
}

async function benchRerank(): Promise<void> {
  console.log("\n── Rerank Latency ────────────────────────────────────────");

  const CANDIDATES = [
    { id: "c1", text: "Tanker detention at Suez Canal due to revised IMO SOLAS requirements" },
    { id: "c2", text: "Compliance audit findings for AIS transponder reporting regulations" },
    { id: "c3", text: "Port state control inspection failure rates Q1 2026" },
  ];

  const latencies: number[] = [];
  let failures = 0;

  for (let i = 0; i < ROUNDS; i++) {
    const { statusCode, elapsedMs } = await post("/v1/rerank", {
      requestId: `bench-rerank-${i}`,
      tenantId: TENANT_ID,
      query: "maritime vessel compliance risk",
      candidates: CANDIDATES,
      topK: 2,
    });
    if (statusCode === 200) {
      latencies.push(elapsedMs);
    } else {
      failures++;
    }
  }

  const s = stats(latencies);
  console.log(row("rerank (3 candidates)", s));
  if (failures > 0) console.warn(`  WARN: ${failures}/${ROUNDS} requests failed`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(`\nAEF Benchmark — ${BASE_URL}  (${ROUNDS} rounds per suite)`);
  console.log(`Tenant: ${TENANT_ID}`);

  // Health check before benchmarking
  const health = await fetch(`${BASE_URL}/health`, { headers });
  if (!health.ok) {
    console.error(`ERROR: /health returned ${health.status} — is the server running?`);
    process.exit(1);
  }

  await benchEmbed();
  await benchSearch();
  await benchRerank();

  console.log("\n── Summary ───────────────────────────────────────────────");
  console.log("  All benchmark suites complete. Review p95/p99 for SLA targets.");
  console.log("  CPU-only backend — production GPU/Azure backends will be significantly faster.\n");
}

main().catch((err) => {
  console.error("Benchmark crashed:", err);
  process.exit(1);
});
