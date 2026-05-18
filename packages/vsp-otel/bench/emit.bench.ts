/**
 * Micro-benchmark for `LambdaSpanEmitter.emit` against a no-op tracer.
 *
 * Run with: `pnpm --filter @szl-holdings/vsp-otel bench`
 *
 * Methodology
 * -----------
 * - Uses `tinybench` with 1s warmup + 3s measured time per case.
 * - The tracer is the default OTel no-op tracer (`trace.getTracer(...)`
 *   with no registered SDK), so what we measure is the emitter's own
 *   work: license check, hash slicing, traceId derivation, parent-context
 *   construction, span start (no-op), attribute stamping, and span.end().
 * - Two cases: a minimal receipt (hash + license only) and a full one
 *   (all 9 Λ-axes + replayCount + ingestionPolicy).
 * - Reports p50 / p75 / p99 in microseconds and prints a markdown row
 *   suitable for pasting into the README results table.
 */

import * as os from 'node:os';
import { performance } from 'node:perf_hooks';
import { Bench } from 'tinybench';

import { LambdaSpanEmitter, type VspReceipt } from '../src/lambda-span-emitter.js';

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

const emitter = new LambdaSpanEmitter();

const bench = new Bench({
  name: 'LambdaSpanEmitter.emit (no-op tracer)',
  warmupTime: 1000,
  time: 3000,
});

bench
  .add('emit(minimal)', () => {
    emitter.emit(minimal, { endImmediately: true });
  })
  .add('emit(full: 9 axes + metadata)', () => {
    emitter.emit(full, { endImmediately: true });
  });

function reportRow(name: string, task: NonNullable<ReturnType<Bench['getTask']>>): void {
  const samplesMs = task.result?.samples ?? [];
  if (samplesMs.length === 0) {
    console.log(`| ${name} | n/a | n/a | n/a | n/a |`);
    return;
  }
  const samplesUs = samplesMs.map((s) => s * 1000).sort((a, b) => a - b);
  const pct = (p: number): number => {
    const idx = Math.min(samplesUs.length - 1, Math.floor((p / 100) * samplesUs.length));
    return samplesUs[idx]!;
  };
  const mean = samplesUs.reduce((a, b) => a + b, 0) / samplesUs.length;
  const fmt = (v: number): string => v.toFixed(2);
  console.log(
    `| ${name} | ${fmt(mean)} | ${fmt(pct(50))} | ${fmt(pct(75))} | ${fmt(pct(99))} | ${samplesUs.length} |`,
  );
}

async function main(): Promise<void> {
  const nodeVersion = process.version;
  const arch = `${process.platform}/${process.arch}`;
  const cpu = os.cpus()[0]?.model ?? 'unknown';

  console.log(`# vsp-otel emit benchmark`);
  console.log(`Node: ${nodeVersion}  Platform: ${arch}`);
  console.log(`CPU:  ${cpu}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('');

  const t0 = performance.now();
  await bench.run();
  const elapsed = ((performance.now() - t0) / 1000).toFixed(1);

  console.log(`Run completed in ${elapsed}s.`);
  console.log('');
  console.log('| case | mean (µs) | p50 (µs) | p75 (µs) | p99 (µs) | samples |');
  console.log('| --- | ---: | ---: | ---: | ---: | ---: |');
  for (const task of bench.tasks) {
    reportRow(task.name, task);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
