/**
 * End-to-end emit-latency benchmark for `LambdaSpanEmitter` running under a
 * **real** NodeSDK + BatchSpanProcessor + OTLPHttpExporter pipeline pointed
 * at an in-process HTTP catcher that ack's like a real OTLP/HTTP collector.
 *
 * Run with: `pnpm --filter @szl-holdings/vsp-otel bench:e2e`
 *
 * Why a separate harness
 * ----------------------
 * The companion `emit.bench.ts` measures only the emitter's own work
 * against a no-op tracer (~0.5 µs p50). The number users actually care
 * about when budgeting capacity is end-to-end latency once a real
 * BatchSpanProcessor + OTLP exporter is on the path — that cost is
 * dominated by protobuf/JSON serialization and the HTTP round-trip,
 * not by `emit` itself. This file measures that.
 *
 * Methodology
 * -----------
 * - Boots a local HTTP server on 127.0.0.1 that responds 200 to every
 *   POST (acting as an OTLP/HTTP collector). Tracks how many bytes hit
 *   the wire so we can report a payload size alongside the timings.
 * - Boots `startVspNodeSdk` against that catcher with the standard
 *   BatchSpanProcessor → OTLPHttpExporter pipeline (no special tweaks —
 *   identical wiring to what real users get).
 * - Case A — per-receipt flush: emit one span, `await sdk.forceFlush()`
 *   so the BatchSpanProcessor drains and the exporter's HTTP POST
 *   completes. Wall-clock around that pair is the single-span
 *   end-to-end cost (worst case: no batching).
 * - Case B — amortized under batching: emit N=100 spans synchronously,
 *   then a single `forceFlush()`. Divide total wall-clock by N to get
 *   per-receipt amortized cost when the BatchSpanProcessor is actually
 *   allowed to do its job.
 * - Each case collects samples for ~3s after a ~500ms warmup, sorts,
 *   and reports mean / p50 / p75 / p99 in microseconds plus a markdown
 *   row suitable for pasting into the README.
 */

import * as os from 'node:os';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { performance } from 'node:perf_hooks';

import { trace } from '@opentelemetry/api';

import { startVspNodeSdk, type VspNodeSdk } from '../src/node-sdk-bootstrap.js';
import type { VspReceipt } from '../src/lambda-span-emitter.js';

/**
 * NodeSDK doesn't expose its underlying `TracerProvider` publicly, so to
 * flush the BatchSpanProcessor we resolve the globally-registered provider
 * via the OTel API. `NodeTracerProvider` (and its `ProxyTracerProvider`
 * wrapper) both implement `forceFlush()`.
 */
async function forceFlushGlobal(): Promise<void> {
  const provider = trace.getTracerProvider() as {
    forceFlush?: () => Promise<void>;
    getDelegate?: () => { forceFlush?: () => Promise<void> };
  };
  if (typeof provider.forceFlush === 'function') {
    await provider.forceFlush();
    return;
  }
  const delegate = provider.getDelegate?.();
  if (delegate && typeof delegate.forceFlush === 'function') {
    await delegate.forceFlush();
    return;
  }
  // Fail loudly — a silent no-op flush would make the entire benchmark
  // meaningless (we'd be timing in-memory queueing, not the exporter).
  // This is the canary if an OTel SDK upgrade reshapes the provider API.
  throw new Error(
    '[bench:e2e] no forceFlush() found on global TracerProvider — benchmark would silently degrade to measuring queueing only. Aborting.',
  );
}

const RECEIPT_HASH =
  'a'.repeat(8) + 'b'.repeat(8) + 'c'.repeat(8) + 'd'.repeat(8) +
  'e'.repeat(8) + 'f'.repeat(8) + '0'.repeat(8) + '1'.repeat(8);

const minimal: VspReceipt = {
  hash: RECEIPT_HASH,
  license: 'Apache-2.0',
};

const full: VspReceipt = {
  hash: RECEIPT_HASH,
  license: 'Apache-2.0',
  endpoint: 'lambda.bench.full',
  replayCount: 3,
  ingestionPolicy: 'doctrine-v6',
  lambdaAxes: {
    cleanliness: 0.95,
    horizon: 0.9,
    resonance: 0.88,
    frustum: 0.91,
    gaussClosure: 0.97,
    invariance: 0.93,
    moralGrounding: 0.89,
    ontologicalGrounding: 0.92,
    measurabilityHonesty: 0.96,
  },
};

interface CollectorStats {
  posts: number;
  totalBytes: number;
}

async function startCatcher(stats: CollectorStats): Promise<{ server: Server; port: number }> {
  const server = createServer((req, res) => {
    let bytes = 0;
    req.on('data', (chunk: Buffer) => {
      bytes += chunk.length;
    });
    req.on('end', () => {
      stats.posts += 1;
      stats.totalBytes += bytes;
      res.writeHead(200, { 'content-type': 'application/x-protobuf' });
      res.end();
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  return { server, port };
}

interface CaseResult {
  name: string;
  samplesUs: number[];
  perReceipt: boolean;
}

function summarize(samples: number[]): {
  mean: number;
  p50: number;
  p75: number;
  p99: number;
} {
  const sorted = [...samples].sort((a, b) => a - b);
  const pct = (p: number): number => {
    const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    return sorted[idx]!;
  };
  const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  return { mean, p50: pct(50), p75: pct(75), p99: pct(99) };
}

function fmt(v: number): string {
  return v.toFixed(2);
}

async function runPerReceiptCase(
  booted: VspNodeSdk,
  receipt: VspReceipt,
  name: string,
  warmupMs: number,
  measureMs: number,
): Promise<CaseResult> {
  // Warmup
  const warmupEnd = performance.now() + warmupMs;
  while (performance.now() < warmupEnd) {
    const span = booted.emitter.emit(receipt);
    span.end();
    // eslint-disable-next-line no-await-in-loop
    await forceFlushGlobal();
  }

  const samplesUs: number[] = [];
  const measureEnd = performance.now() + measureMs;
  while (performance.now() < measureEnd) {
    const t0 = performance.now();
    const span = booted.emitter.emit(receipt);
    span.end();
    // eslint-disable-next-line no-await-in-loop
    await forceFlushGlobal();
    const t1 = performance.now();
    samplesUs.push((t1 - t0) * 1000);
  }
  return { name, samplesUs, perReceipt: true };
}

async function runBatchedCase(
  booted: VspNodeSdk,
  receipt: VspReceipt,
  name: string,
  batchSize: number,
  warmupMs: number,
  measureMs: number,
): Promise<CaseResult> {
  const warmupEnd = performance.now() + warmupMs;
  while (performance.now() < warmupEnd) {
    for (let i = 0; i < batchSize; i++) {
      const span = booted.emitter.emit(receipt);
      span.end();
    }
    // eslint-disable-next-line no-await-in-loop
    await forceFlushGlobal();
  }

  const samplesUs: number[] = [];
  const measureEnd = performance.now() + measureMs;
  while (performance.now() < measureEnd) {
    const t0 = performance.now();
    for (let i = 0; i < batchSize; i++) {
      const span = booted.emitter.emit(receipt);
      span.end();
    }
    // eslint-disable-next-line no-await-in-loop
    await forceFlushGlobal();
    const t1 = performance.now();
    samplesUs.push(((t1 - t0) * 1000) / batchSize);
  }
  return { name, samplesUs, perReceipt: true };
}

async function main(): Promise<void> {
  const nodeVersion = process.version;
  const arch = `${process.platform}/${process.arch}`;
  const cpu = os.cpus()[0]?.model ?? 'unknown';

  console.log(`# vsp-otel emit end-to-end benchmark (real OTLP/HTTP pipeline)`);
  console.log(`Node: ${nodeVersion}  Platform: ${arch}`);
  console.log(`CPU:  ${cpu}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('');

  const stats: CollectorStats = { posts: 0, totalBytes: 0 };
  const { server, port } = await startCatcher(stats);

  const booted = startVspNodeSdk({
    endpoint: `http://127.0.0.1:${port}/v1/traces`,
    protocol: 'http/protobuf',
    serviceName: 'vsp-otel-e2e-bench',
    vendor: 'none',
  });

  const warmupMs = 500;
  const measureMs = 3000;
  const batchSize = 100;

  const results: CaseResult[] = [];
  const t0 = performance.now();

  try {
    results.push(
      await runPerReceiptCase(
        booted,
        minimal,
        'emit(minimal) + forceFlush per receipt',
        warmupMs,
        measureMs,
      ),
    );
    results.push(
      await runPerReceiptCase(
        booted,
        full,
        'emit(full) + forceFlush per receipt',
        warmupMs,
        measureMs,
      ),
    );
    results.push(
      await runBatchedCase(
        booted,
        minimal,
        `emit(minimal) amortized (batch=${batchSize})`,
        batchSize,
        warmupMs,
        measureMs,
      ),
    );
    results.push(
      await runBatchedCase(
        booted,
        full,
        `emit(full) amortized (batch=${batchSize})`,
        batchSize,
        warmupMs,
        measureMs,
      ),
    );
  } finally {
    await booted.shutdown();
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  }

  const elapsed = ((performance.now() - t0) / 1000).toFixed(1);
  console.log(`Run completed in ${elapsed}s.`);
  console.log(
    `Collector saw ${stats.posts} POST(s), ${stats.totalBytes} total bytes ` +
      `(avg ${stats.posts ? Math.round(stats.totalBytes / stats.posts) : 0} bytes/POST).`,
  );
  // Smoke assertion: if zero POSTs reached the catcher, the benchmark
  // was timing in-memory queueing only and every number above is a lie.
  // Better to fail the run than to publish meaningless figures.
  if (stats.posts === 0) {
    throw new Error(
      '[bench:e2e] collector received 0 POSTs — exporter pipeline did not fire. Numbers above are invalid.',
    );
  }
  console.log('');
  console.log('| case | mean (µs) | p50 (µs) | p75 (µs) | p99 (µs) | samples |');
  console.log('| --- | ---: | ---: | ---: | ---: | ---: |');
  for (const r of results) {
    if (r.samplesUs.length === 0) {
      console.log(`| ${r.name} | n/a | n/a | n/a | n/a | 0 |`);
      continue;
    }
    const s = summarize(r.samplesUs);
    console.log(
      `| ${r.name} | ${fmt(s.mean)} | ${fmt(s.p50)} | ${fmt(s.p75)} | ${fmt(s.p99)} | ${r.samplesUs.length} |`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
