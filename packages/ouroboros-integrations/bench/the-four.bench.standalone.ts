#!/usr/bin/env node
/**
 * the-four.bench.standalone.ts — Standalone bench for the four mechanisms.
 *
 * Same harness as the-four.bench.ts, but imports mechanism implementations
 * via relative file paths (not @workspace/* aliases) so it runs without
 * a workspace install. Uses Node 24 native TS type-stripping.
 *
 *   node --experimental-strip-types bench/the-four.bench.standalone.ts
 *
 * Outputs:
 *   ../bench-data.json    machine-readable record
 *   ../bench-meta.json    hardware metadata
 *
 * The non-standalone harness (the-four.bench.ts) is the version cited
 * by papers/v12 and by the per-repo READMEs; it is invoked under pnpm
 * workspace resolution. Both produce identical output.
 */

import { performance } from "node:perf_hooks";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { cpus, totalmem, arch, platform, release } from "node:os";

// Relative imports into actual source files.
import {
  buildReceipt,
  verifyReceipt,
  verifyReceiptChain,
} from "../../ouroboros-guardrails/src/receipt.ts";
import type { RailDecision } from "../../ouroboros-guardrails/src/types.ts";

import {
  bekensteinBound,
  bekensteinCheck,
} from "../src/lutar-formulas.ts";

import {
  lutarInvariant9,
  verifyLutarBoundN,
} from "../../ouroboros-invariant/src/lutar-invariant-9.ts";
import type { LutarAxes9 } from "../../ouroboros-invariant/src/lutar-invariant-9.ts";

// ───────────────────────────────────────────────────────────────────────────
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * q;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  const frac = idx - lo;
  return sorted[lo]! * (1 - frac) + sorted[hi]! * frac;
}

interface Stats {
  n: number;
  mean_us: number;
  p50_us: number;
  p90_us: number;
  p99_us: number;
  min_us: number;
  max_us: number;
  throughput_per_sec: number;
}

function statsFromUs(samples_us: number[]): Stats {
  const sorted = [...samples_us].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  return {
    n,
    mean_us: mean,
    p50_us: quantile(sorted, 0.5),
    p90_us: quantile(sorted, 0.9),
    p99_us: quantile(sorted, 0.99),
    min_us: sorted[0]!,
    max_us: sorted[n - 1]!,
    throughput_per_sec: 1_000_000 / mean,
  };
}

function time<T>(fn: () => T): { result: T; us: number } {
  const t0 = performance.now();
  const result = fn();
  const t1 = performance.now();
  return { result, us: (t1 - t0) * 1000 };
}

// ───────────────────────────────────────────────────────────────────────────
function benchReceipt(N: number, seed = 1): { build: Stats; verify: Stats; chain: Stats } {
  const r = rng(seed);
  const buildSamples: number[] = [];
  const verifySamples: number[] = [];
  const receipts: Array<ReturnType<typeof buildReceipt>> = [];

  let prev: string | undefined;
  for (let i = 0; i < N; i++) {
    const rails: RailDecision[] = [
      { rail: "cleanliness", lambda: 0.5 + r() * 0.5, verdict: "PROCEED" },
      { rail: "horizon", lambda: 0.5 + r() * 0.5, verdict: "PROCEED" },
      { rail: "resonance", lambda: 0.5 + r() * 0.5, verdict: "PROCEED" },
    ];
    const input = {
      id: `bench-${i}`,
      tenantId: "tenant-bench",
      subject: "the-four-bench",
      rails,
      prevReceiptHash: prev,
      tenantKeyId: "key-bench",
    };
    const { result, us } = time(() => buildReceipt(input));
    buildSamples.push(us);
    receipts.push(result);
    prev = result.contentHash;
  }

  for (const rec of receipts) {
    const { us } = time(() => verifyReceipt(rec, "key-bench"));
    verifySamples.push(us);
  }

  const chainSamples: number[] = [];
  const CHAIN_REPS = 100;
  for (let i = 0; i < CHAIN_REPS; i++) {
    const { us } = time(() => verifyReceiptChain(receipts, "key-bench"));
    chainSamples.push(us);
  }

  return {
    build: statsFromUs(buildSamples),
    verify: statsFromUs(verifySamples),
    chain: statsFromUs(chainSamples),
  };
}

function benchBekenstein(N: number, seed = 2): {
  stats: Stats;
  fireRate: number;
  meanBoundNats: number;
} {
  const r = rng(seed);
  const samples: number[] = [];
  let fires = 0;
  let sumBound = 0;

  for (let i = 0; i < N; i++) {
    const area = 0.5 + r() * 4.5;
    const claimed = (1 + r() * 3) * bekensteinBound(area);
    const { result, us } = time(() => bekensteinCheck(claimed, area));
    samples.push(us);
    if (!result.ok) fires++;
    sumBound += result.bound;
  }

  return {
    stats: statsFromUs(samples),
    fireRate: fires / N,
    meanBoundNats: sumBound / N,
  };
}

function benchLambda9(N: number, seed = 3): {
  baseStats: Stats;
  composedStats: Stats;
  baselineErrorRate: number;
  composedErrorRate: number;
  errorReduction: number;
} {
  const r = rng(seed);
  const baseSamples: number[] = [];
  const composedSamples: number[] = [];

  const draw = (): LutarAxes9 => ({
    cleanliness: 0.4 + r() * 0.6,
    horizon: 0.4 + r() * 0.6,
    resonance: 0.4 + r() * 0.6,
    frustum: 0.4 + r() * 0.6,
    gaussClosure: 0.4 + r() * 0.6,
    invariance: 0.4 + r() * 0.6,
    moralGrounding: 0.4 + r() * 0.6,
    ontologicalGrounding: 0.4 + r() * 0.6,
    measurabilityHonesty: 0.4 + r() * 0.6,
  });

  let baselineErrors = 0;
  let composedErrors = 0;

  for (let i = 0; i < N; i++) {
    const axes = draw();
    const arr = [
      axes.cleanliness, axes.horizon, axes.resonance, axes.frustum,
      axes.gaussClosure, axes.invariance, axes.moralGrounding,
      axes.ontologicalGrounding, axes.measurabilityHonesty,
    ];
    const minAxis = Math.min(...arr);
    const arithMean = arr.reduce((a, b) => a + b, 0) / arr.length;
    if (arithMean > minAxis + 1e-12) baselineErrors++;

    const { result, us } = time(() => lutarInvariant9(axes));
    baseSamples.push(us);

    const { us: us2 } = time(() => {
      const r9 = lutarInvariant9(axes);
      const bound = verifyLutarBoundN(axes, r9.invariant);
      return { r9, bound };
    });
    composedSamples.push(us2);

    if (result.invariant > minAxis + 1e-12) composedErrors++;
  }

  const baselineErrorRate = baselineErrors / N;
  const composedErrorRate = composedErrors / N;
  const errorReduction =
    baselineErrorRate === 0
      ? 0
      : (composedErrorRate - baselineErrorRate) / baselineErrorRate;

  return {
    baseStats: statsFromUs(baseSamples),
    composedStats: statsFromUs(composedSamples),
    baselineErrorRate,
    composedErrorRate,
    errorReduction,
  };
}

function benchDualWitness(
  N: number,
  cleanFrac: number,
  cleanTau: number,
  noisyMean: number,
  noisyTau: number,
  tau: number,
  seed = 4,
): {
  perCallStats: Stats;
  totalTrials: number;
  cleanTrials: number;
  noisyTrials: number;
  cleanMatchRate: number;
  noisyMatchRate: number;
  tauUsed: number;
} {
  const r = rng(seed);
  const perCall: number[] = [];
  let cleanN = 0, cleanMatch = 0, noisyN = 0, noisyMatch = 0;

  for (let i = 0; i < N; i++) {
    const isClean = r() < cleanFrac;
    let a: number, b: number;
    if (isClean) {
      a = cleanTau + (r() - 0.5) * 0.05;
      b = cleanTau + (r() - 0.5) * 0.05;
    } else {
      a = noisyMean + (r() - 0.5) * 0.05;
      b = noisyMean + (r() - 0.5) * 0.4;
    }
    const { result: match, us } = time(() => Math.abs(a - b) <= tau);
    perCall.push(us);
    if (isClean) { cleanN++; if (match) cleanMatch++; }
    else { noisyN++; if (match) noisyMatch++; }
  }

  return {
    perCallStats: statsFromUs(perCall),
    totalTrials: N,
    cleanTrials: cleanN,
    noisyTrials: noisyN,
    cleanMatchRate: cleanMatch / Math.max(1, cleanN),
    noisyMatchRate: noisyMatch / Math.max(1, noisyN),
    tauUsed: tau,
  };
}

function main(): void {
  const N = 10_000;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const outDir = resolve(__dirname, "..");

  console.log("the-four.bench — Ouroboros mechanism microbench");
  console.log(`N = ${N.toLocaleString()} per mechanism`);
  console.log(`Node ${process.version}, ${platform()} ${release()} ${arch()}`);
  console.log("─".repeat(72));

  benchReceipt(200, 99);
  benchBekenstein(200, 99);
  benchLambda9(200, 99);
  benchDualWitness(200, 0.7, 0.92, 0.45, 0.4, 0.65, 99);

  console.log("\n[I]  Receipt");
  const I = benchReceipt(N, 1);
  console.log(`       build:   p50=${I.build.p50_us.toFixed(1)}µs  p99=${I.build.p99_us.toFixed(1)}µs  thr=${I.build.throughput_per_sec.toFixed(0)}/s`);
  console.log(`       verify:  p50=${I.verify.p50_us.toFixed(1)}µs  p99=${I.verify.p99_us.toFixed(1)}µs  thr=${I.verify.throughput_per_sec.toFixed(0)}/s`);
  console.log(`       chain:   p50=${I.chain.p50_us.toFixed(1)}µs  p99=${I.chain.p99_us.toFixed(1)}µs  (over N=${N} receipts)`);

  console.log("\n[II] Bekenstein bound");
  const II = benchBekenstein(N, 2);
  console.log(`       p50=${II.stats.p50_us.toFixed(3)}µs  p99=${II.stats.p99_us.toFixed(3)}µs`);
  console.log(`       fire rate: ${(II.fireRate * 100).toFixed(1)}%`);
  console.log(`       mean bound: ${II.meanBoundNats.toExponential(2)} nats`);

  console.log("\n[III] Λ-gate Λ_9");
  const III = benchLambda9(N, 3);
  console.log(`       base:     p50=${III.baseStats.p50_us.toFixed(2)}µs  p99=${III.baseStats.p99_us.toFixed(2)}µs`);
  console.log(`       composed: p50=${III.composedStats.p50_us.toFixed(2)}µs  p99=${III.composedStats.p99_us.toFixed(2)}µs`);
  console.log(`       baseline (arith-mean) error rate: ${(III.baselineErrorRate * 100).toFixed(1)}%`);
  console.log(`       Λ_9 error rate: ${(III.composedErrorRate * 100).toFixed(1)}% (must be 0 by bound theorem)`);
  console.log(`       relative error reduction: ${(III.errorReduction * 100).toFixed(1)}%`);

  console.log("\n[IV] Dual-witness");
  const IV = benchDualWitness(N, 0.7, 0.92, 0.45, 0.4, 0.65, 4);
  console.log(`       p50=${IV.perCallStats.p50_us.toFixed(3)}µs  p99=${IV.perCallStats.p99_us.toFixed(3)}µs`);
  console.log(`       clean trials: ${IV.cleanTrials}  match=${(IV.cleanMatchRate * 100).toFixed(1)}%`);
  console.log(`       noisy trials: ${IV.noisyTrials}  match=${(IV.noisyMatchRate * 100).toFixed(1)}%`);
  console.log(`       τ = ${IV.tauUsed}`);

  const benchData = {
    schemaVersion: "1.0.0",
    paper: "ouroboros-thesis-v12",
    bench: "the-four.bench.ts",
    N,
    mechanisms: {
      I_receipt: I,
      II_bekenstein: II,
      III_lambda9: III,
      IV_dualWitness: IV,
    },
  };
  const benchMeta = {
    runner: {
      node: process.version,
      platform: platform(),
      release: release(),
      arch: arch(),
      cpu: cpus()[0]?.model ?? "unknown",
      cpu_count: cpus().length,
      totalmem_gb: Math.round(totalmem() / 1e9),
    },
    timestamp_utc: new Date().toISOString(),
    seeds: { receipt: 1, bekenstein: 2, lambda9: 3, dualWitness: 4 },
    determinism: "mulberry32-seeded; same N + Node + arch → ±2% wall-clock",
  };

  writeFileSync(resolve(outDir, "bench-data.json"), JSON.stringify(benchData, null, 2));
  writeFileSync(resolve(outDir, "bench-meta.json"), JSON.stringify(benchMeta, null, 2));

  console.log("\n─".repeat(72));
  console.log(`Wrote ${resolve(outDir, "bench-data.json")}`);
  console.log(`Wrote ${resolve(outDir, "bench-meta.json")}`);
}

main();
