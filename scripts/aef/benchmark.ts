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

import {
  renderApiBenchmarkReport,
  type ApiBenchmarkRow,
  type ApiLatencyStats,
} from './benchmark-report.ts';

const BASE_URL = process.env.AEF_API_URL ?? 'http://localhost:4200';
const API_KEY = process.env.AEF_API_KEY ?? '';
const ROUNDS = parseInt(process.env.BENCH_ROUNDS ?? '20', 10);
const TENANT_ID = process.env.TENANT_ID ?? 'smoke-test-tenant';

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  'x-tenant-id': TENANT_ID,
  ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)]!;
}

function stats(samples: number[]): ApiLatencyStats | null {
  if (samples.length === 0) return null;
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

async function post(
  path: string,
  body: unknown,
): Promise<{ statusCode: number; json: unknown; elapsedMs: number }> {
  const t0 = Date.now();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  return { statusCode: res.status, json, elapsedMs: Date.now() - t0 };
}

function throughput(samples: number[], operationsPerRequest = 1): number | null {
  const totalMs = samples.reduce((sum, sample) => sum + sample, 0);
  if (samples.length === 0 || totalMs === 0) return null;
  return Math.round((samples.length * operationsPerRequest * 1000) / totalMs);
}

// ---------------------------------------------------------------------------
// Benchmark suites
// ---------------------------------------------------------------------------

async function benchEmbed(): Promise<ApiBenchmarkRow> {
  const INPUTS = [
    'Quarterly risk summary for maritime shipping lanes',
    'DORA compliance gap analysis for financial institutions',
  ];

  const latencies: number[] = [];
  let failures = 0;

  for (let i = 0; i < ROUNDS; i++) {
    const { statusCode, elapsedMs } = await post('/v1/embed', {
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

  return {
    suite: 'embed',
    succeeded: latencies.length,
    failed: failures,
    invalid: 0,
    latency: stats(latencies),
    throughputPerSecond: throughput(latencies, INPUTS.length),
  };
}

async function benchSearch(): Promise<ApiBenchmarkRow> {
  const QUERIES = [
    'container vessel detention risk Red Sea',
    'cyber incident response playbook zero-day',
    'commercial real estate cap rate compression',
    'governance policy board fiduciary obligations',
    'private equity deal flow LP compliance',
  ];

  const latencies: number[] = [];
  let failures = 0;
  let invalid = 0;

  for (let i = 0; i < ROUNDS; i++) {
    const q = QUERIES[i % QUERIES.length]!;
    const { statusCode, elapsedMs, json } = await post('/v1/hybrid-search', {
      requestId: `bench-search-${i}`,
      tenantId: TENANT_ID,
      query: q,
      topK: 5,
      candidatePool: 20,
    });
    if (statusCode === 200) {
      latencies.push(elapsedMs);
      const resp = json as { retrievalPath?: string[] } | null;
      // Validate 13-stage canonical pipeline is present
      if (resp?.retrievalPath?.length !== 13) {
        invalid++;
      }
    } else {
      failures++;
    }
  }

  return {
    suite: 'hybrid-search',
    succeeded: latencies.length,
    failed: failures,
    invalid,
    latency: stats(latencies),
    throughputPerSecond: throughput(latencies),
  };
}

async function benchRerank(): Promise<ApiBenchmarkRow> {
  const CANDIDATES = [
    { id: 'c1', text: 'Tanker detention at Suez Canal due to revised IMO SOLAS requirements' },
    { id: 'c2', text: 'Compliance audit findings for AIS transponder reporting regulations' },
    { id: 'c3', text: 'Port state control inspection failure rates Q1 2026' },
  ];

  const latencies: number[] = [];
  let failures = 0;

  for (let i = 0; i < ROUNDS; i++) {
    const { statusCode, elapsedMs } = await post('/v1/rerank', {
      requestId: `bench-rerank-${i}`,
      tenantId: TENANT_ID,
      query: 'maritime vessel compliance risk',
      candidates: CANDIDATES,
      topK: 2,
    });
    if (statusCode === 200) {
      latencies.push(elapsedMs);
    } else {
      failures++;
    }
  }

  return {
    suite: 'rerank',
    succeeded: latencies.length,
    failed: failures,
    invalid: 0,
    latency: stats(latencies),
    throughputPerSecond: throughput(latencies),
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Health check before benchmarking
  const health = await fetch(`${BASE_URL}/health`, { headers });
  if (!health.ok) {
    throw new Error('AEF benchmark health check failed');
  }

  const rows = [await benchEmbed(), await benchSearch(), await benchRerank()];
  process.stdout.write(renderApiBenchmarkReport({ roundsPerSuite: ROUNDS, rows }));
}

main().catch((_err) => {
  process.stderr.write('AEF API benchmark failed\n');
  process.exitCode = 1;
});
