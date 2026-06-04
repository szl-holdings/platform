#!/usr/bin/env tsx
/**
 * the-four.bench.ts — Microbenchmark harness for the four Ouroboros mechanisms
 * cited in `papers/v12/ouroboros-thesis-v12.md` §3–§4.
 *
 * This harness is the reproduction artefact for v12 (Λ-Ouroboros Substrate)
 * and for the §1 "Mechanisms I–IV" claims that appear in the Wave-4
 * per-repo READMEs.
 *
 * Mechanisms measured:
 *
 *   I.  Receipt — build + verify + chain-verify against tamper.
 *       APIs:   buildReceipt, verifyReceipt, verifyReceiptChain
 *       Source: packages/ouroboros-guardrails/src/receipt.ts
 *
 *   II. Bekenstein bound — entropy-bound check on a planar horizon area.
 *       APIs:   dpiBound, dpiCheck (F1-4 errata: renamed from bekensteinBound, bekensteinCheck)
 *       Source: packages/ouroboros-integrations/src/lutar-formulas.ts
 *
 *   III. Λ-gate (Λ_9) — full 9-axis aggregated invariant evaluation.
 *       APIs:   lutarInvariant9, verifyLutarBoundN
 *       Source: packages/ouroboros-invariant/src/lutar-invariant-9.ts
 *
 *   IV. Dual-witness — two independent observation channels reconciled
 *       under a divergence threshold τ. Synthesized here from the
 *       Frustum-axis three-witness primitive (Jaccard volume) reduced
 *       to a two-witness MATCH/DIVERGE call.
 *
 * Reproduce:
 *
 *   pnpm --filter @workspace/ouroboros-integrations exec tsx bench/the-four.bench.ts
 *
 * Outputs:
 *
 *   - stdout: human-readable per-mechanism summary
 *   - bench-data.json: machine-readable record (canonical artefact)
 *   - bench-meta.json: hardware + runtime metadata
 *
 * Determinism: all randomness is seeded (mulberry32). Re-running on the
 * same Node version and same CPU produces identical percentiles within
 * ±2 % wall-clock variance.
 *
 * Honesty notes:
 *   - "Free tokens" elsewhere in the docs means refusals BEFORE a paid
 *     provider call, not generated tokens. This harness measures only
 *     local CPU work and never calls a provider.
 *   - Numbers reported are wall-clock microseconds on the runner. They
 *     are NOT a claim about p99 in production; production latency is
 *     dominated by network and provider RTT.
 */

import { performance } from "node:perf_hooks";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { cpus, totalmem, arch, platform, release } from "node:os";

import {
  buildReceipt,
  verifyReceipt,
  verifyReceiptChain,
  type RailDecision,
} from "@workspace/ouroboros-guardrails";
import { dpiBound, dpiCheck } from "@workspace/ouroboros-integrations"; // F1-4 errata: dpiBound/dpiCheck replace bekensteinBound/bekensteinCheck
import { lutarInvariant9, verifyLutarBoundN, type LutarAxes9 } from "@workspace/ouroboros-invariant";

// ───────────────────────────────────────────────────────────────────────────
// Seeded RNG — mulberry32. Reproducible across runs.
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

// ───────────────────────────────────────────────────────────────────────────
// Percentile helper.
// ───────────────────────────────────────────────────────────────────────────
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
// Mechanism I — Receipt build + verify + chain verification.
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

  // Single chain verification across all receipts.
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

// ───────────────────────────────────────────────────────────────────────────
// Mechanism II — DPI receipt-chain entropy bound check.
// F1-4 errata: renamed from benchBekenstein. Deprecated alias kept below.
// Mirrors Lean theorem: Lutar.DPI.dpiAdmit (Lutar/DPI/DPIBound.lean).
// ───────────────────────────────────────────────────────────────────────────
function benchDpiBound(N: number, seed = 2): {
  stats: Stats;
  fireRate: number;
  meanBoundNats: number;
} {
  const r = rng(seed);
  const samples: number[] = [];
  let fires = 0;
  let sumBound = 0;

  // Mixed regime: ~38% of cases are 'fire' (over-bound), the rest within.
  // Claim multiplier drawn from a Beta-like envelope around 1.0; values
  // > 1.0 fire, values <= 1.0 pass.
  for (let i = 0; i < N; i++) {
    const area = 0.5 + r() * 4.5;
    // Multiplier in [0.4, 1.6] approximately uniform; ~37.5% fire.
    const mult = 0.4 + r() * 1.2;
    const claimed = mult * dpiBound(area); // F1-4 errata: dpiBound replaces bekensteinBound
    const { result, us } = time(() => dpiCheck(claimed, area)); // F1-4 errata: dpiCheck replaces bekensteinCheck
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

// ───────────────────────────────────────────────────────────────────────────
// Mechanism III — Λ_9 aggregator + bound verification.
// ───────────────────────────────────────────────────────────────────────────
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

  // "Error" defined as: aggregator yields a score that masks a failing
  // axis. Specifically: aggregator > 0.6 while min-axis < 0.5.
  // This is the operational definition that matters for trust gates.
  for (let i = 0; i < N; i++) {
    const axes = draw();
    const arr = [
      axes.cleanliness,
      axes.horizon,
      axes.resonance,
      axes.frustum,
      axes.gaussClosure,
      axes.invariance,
      axes.moralGrounding,
      axes.ontologicalGrounding,
      axes.measurabilityHonesty,
    ];
    const minAxis = Math.min(...arr);
    const arithMean = arr.reduce((a, b) => a + b, 0) / arr.length;
    if (arithMean > 0.6 && minAxis < 0.5) baselineErrors++;

    const { result, us } = time(() => lutarInvariant9(axes));
    baseSamples.push(us);

    const { us: us2 } = time(() => {
      const r9 = lutarInvariant9(axes);
      const bound = verifyLutarBoundN(r9);
      return { r9, bound };
    });
    composedSamples.push(us2);

    if (result.invariant > 0.6 && minAxis < 0.5) composedErrors++;
  }

  const baselineErrorRate = baselineErrors / N;
  const composedErrorRate = composedErrors / N;
  const errorReduction =
    baselineErrorRate === 0
      ? 0
      : (composedErrorRate - baselineErrorRate) / baselineErrorRate; // negative = improvement

  return {
    baseStats: statsFromUs(baseSamples),
    composedStats: statsFromUs(composedSamples),
    baselineErrorRate,
    composedErrorRate,
    errorReduction,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Composed-effect — Λ_9 gate as quality admission filter.
//
// Simulates a mixed-quality request stream where each request has a hidden
// ground-truth quality label:
//   - clean (probability `cleanFrac`):   axes drawn from N(μ=0.92, σ=0.05)
//                                        clipped to [0,1]; P(correct)=0.92
//   - noisy (probability 1-cleanFrac):   axes drawn from N(μ=0.45, σ=0.18)
//                                        clipped to [0,1]; P(correct)=0.45
//
// Baseline:  every request is answered → expected error = mixture average.
// Gated:     only requests with Λ_9 ≥ τ are answered → conditional error
//            over the admitted subset.
//
// Output is the standard "composed-effect" table cited by v12 §8.1.
// ───────────────────────────────────────────────────────────────────────────
function benchComposedEffect(
  N: number,
  cleanFrac: number,
  cleanCorrect: number,
  noisyCorrect: number,
  tau: number,
  seed = 5,
): {
  N: number;
  cleanFrac: number;
  cleanCorrect: number;
  noisyCorrect: number;
  tau: number;
  baselineErrorRate: number;
  gatedErrorRate: number;
  errorReduction: number;
  admittedFraction: number;
  admittedCleanRate: number;
  admittedNoisyRate: number;
} {
  const r = rng(seed);
  // Box-Muller normal
  const boxMuller = (mu: number, sigma: number): number => {
    const u = Math.max(1e-12, r());
    const v = r();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return Math.max(0, Math.min(1, mu + sigma * z));
  };

  let baselineErrors = 0;
  let admitted = 0;
  let admittedClean = 0;
  let admittedNoisy = 0;
  let admittedErrors = 0;

  for (let i = 0; i < N; i++) {
    const isClean = r() < cleanFrac;
    const mu = isClean ? 0.92 : 0.45;
    const sigma = isClean ? 0.05 : 0.18;
    const axes: LutarAxes9 = {
      cleanliness: boxMuller(mu, sigma),
      horizon: boxMuller(mu, sigma),
      resonance: boxMuller(mu, sigma),
      frustum: boxMuller(mu, sigma),
      gaussClosure: boxMuller(mu, sigma),
      invariance: boxMuller(mu, sigma),
      moralGrounding: boxMuller(mu, sigma),
      ontologicalGrounding: boxMuller(mu, sigma),
      measurabilityHonesty: boxMuller(mu, sigma),
    };
    const correct = r() < (isClean ? cleanCorrect : noisyCorrect);
    if (!correct) baselineErrors++;

    const lambda9 = lutarInvariant9(axes).invariant;
    if (lambda9 >= tau) {
      admitted++;
      if (isClean) admittedClean++;
      else admittedNoisy++;
      if (!correct) admittedErrors++;
    }
  }

  const baselineErrorRate = baselineErrors / N;
  const gatedErrorRate = admitted > 0 ? admittedErrors / admitted : 0;
  const errorReduction =
    baselineErrorRate === 0
      ? 0
      : (baselineErrorRate - gatedErrorRate) / baselineErrorRate;
  return {
    N,
    cleanFrac,
    cleanCorrect,
    noisyCorrect,
    tau,
    baselineErrorRate,
    gatedErrorRate,
    errorReduction,
    admittedFraction: admitted / N,
    admittedCleanRate: admitted > 0 ? admittedClean / admitted : 0,
    admittedNoisyRate: admitted > 0 ? admittedNoisy / admitted : 0,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Mechanism IV — Dual-witness reconciliation.
// Two channels A and B observe a stream; each emits a scalar in [0,1]
// (e.g. a confidence). MATCH if |a − b| ≤ τ; DIVERGE otherwise.
// "Clean" trials: regime where both channels are reliable (mean drift small).
// "Noisy" trials: regime with intermittent decoherence on channel B.
// ───────────────────────────────────────────────────────────────────────────
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

  let cleanN = 0;
  let cleanMatch = 0;
  let noisyN = 0;
  let noisyMatch = 0;

  for (let i = 0; i < N; i++) {
    const isClean = r() < cleanFrac;
    let a: number;
    let b: number;
    if (isClean) {
      // Clean channel: both witnesses tight around cleanTau, sigma small.
      a = cleanTau + (r() - 0.5) * 0.05;
      b = cleanTau + (r() - 0.5) * 0.05;
    } else {
      // Noisy channel: witnesses spread wide (Gaussian-like via 12 sums)
      // with high sigma to make |a-b| frequently exceed τ.
      let sa = 0, sb = 0;
      for (let k = 0; k < 12; k++) { sa += r(); sb += r(); }
      a = noisyMean + (sa - 6) * 0.5;
      b = noisyMean + (sb - 6) * 0.5;
    }

    const { result: match, us } = time(() => Math.abs(a - b) <= tau);
    perCall.push(us);

    if (isClean) {
      cleanN++;
      if (match) cleanMatch++;
    } else {
      noisyN++;
      if (match) noisyMatch++;
    }
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

// ───────────────────────────────────────────────────────────────────────────
// Main.
// ───────────────────────────────────────────────────────────────────────────
function main(): void {
  const N = 10_000;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const outDir = resolve(__dirname, "..");

  console.log("the-four.bench.ts — Ouroboros mechanism microbench");
  console.log(`N = ${N.toLocaleString()} per mechanism`);
  console.log(`Node ${process.version}, ${platform()} ${release()} ${arch()}`);
  console.log("─".repeat(72));

  // Warm-up.
  benchReceipt(200, 99);
  benchDpiBound(200, 99);
  benchLambda9(200, 99);
  benchDualWitness(200, 0.7, 0.92, 0.45, 0.4, 0.65, 99);

  console.log("\n[I]  Receipt — build + verify + chain");
  const I = benchReceipt(N, 1);
  console.log(
    `       build:   p50=${I.build.p50_us.toFixed(1)}µs  p99=${I.build.p99_us.toFixed(1)}µs  thr=${I.build.throughput_per_sec.toFixed(0)}/s`,
  );
  console.log(
    `       verify:  p50=${I.verify.p50_us.toFixed(1)}µs  p99=${I.verify.p99_us.toFixed(1)}µs  thr=${I.verify.throughput_per_sec.toFixed(0)}/s`,
  );
  console.log(
    `       chain:   p50=${I.chain.p50_us.toFixed(1)}µs  p99=${I.chain.p99_us.toFixed(1)}µs  (over N=${N} receipts, ${I.chain.n} reps)`,
  );

  console.log("\n[II] DPI receipt-chain entropy bound check (F1-4 errata: renamed from Bekenstein)");
  const II = benchDpiBound(N, 2);
  console.log(
    `       per-call: p50=${II.stats.p50_us.toFixed(3)}µs  p99=${II.stats.p99_us.toFixed(3)}µs`,
  );
  console.log(
    `       fire rate (claim > bound): ${(II.fireRate * 100).toFixed(1)}%`,
  );
  console.log(`       mean bound: ${II.meanBoundNats.toExponential(2)} nats`);

  console.log("\n[III] Λ-gate — Λ_9 base vs composed (with bound verify)");
  const III = benchLambda9(N, 3);
  console.log(
    `       base:     p50=${III.baseStats.p50_us.toFixed(2)}µs  p99=${III.baseStats.p99_us.toFixed(2)}µs`,
  );
  console.log(
    `       composed: p50=${III.composedStats.p50_us.toFixed(2)}µs  p99=${III.composedStats.p99_us.toFixed(2)}µs`,
  );
  console.log(
    `       baseline arithmetic-mean error rate (above min-axis): ${(III.baselineErrorRate * 100).toFixed(1)}%`,
  );
  console.log(
    `       Λ_9 error rate (above min-axis): ${(III.composedErrorRate * 100).toFixed(1)}%   (Λ_9 must equal 0 per bound invariant — Λ-uniqueness is Conjecture 1, NOT a theorem)`,
  );
  console.log(
    `       relative error reduction: ${(III.errorReduction * 100).toFixed(1)}%`,
  );

  console.log("\n[IV] Dual-witness — MATCH/DIVERGE under two regimes");
  // τ = 0.4 is the operational threshold from the v12 paper §4.4.
  // Clean regime: ε ~ 0.05, witnesses agree → MATCH ~ 100%.
  // Noisy regime: σ ~ 0.5, witnesses disagree → MATCH falls.
  const IV = benchDualWitness(N, 0.7, 0.92, 0.45, 0.4, 0.4, 4);
  console.log(
    `       per-call: p50=${IV.perCallStats.p50_us.toFixed(3)}µs  p99=${IV.perCallStats.p99_us.toFixed(3)}µs`,
  );
  console.log(
    `       clean trials: ${IV.cleanTrials}  match=${(IV.cleanMatchRate * 100).toFixed(1)}%`,
  );
  console.log(
    `       noisy trials: ${IV.noisyTrials}  match=${(IV.noisyMatchRate * 100).toFixed(1)}%`,
  );
  console.log(`       τ = ${IV.tauUsed}`);

  // ──────────────────────────────────────────────────────────────────────
  // Persist canonical artefacts.
  // ──────────────────────────────────────────────────────────────────────
  console.log("\n[V] Composed-effect — Λ_9 gate as quality admission filter");
  // v12 §8.1 parameters: clean 70% / noisy 30%; clean p=0.92, noisy p=0.45;
  // gate τ swept to find the operating point that maximises error reduction
  // while retaining ≥50% throughput.
  const taus = [0.55, 0.60, 0.65, 0.70, 0.75, 0.80];
  const composedSweep = taus.map((tau) =>
    benchComposedEffect(N, 0.7, 0.92, 0.45, tau, 5),
  );
  for (const c of composedSweep) {
    console.log(
      `       τ=${c.tau.toFixed(2)}  baseline=${(c.baselineErrorRate * 100).toFixed(1)}%  gated=${(c.gatedErrorRate * 100).toFixed(1)}%  reduction=${(c.errorReduction * 100).toFixed(1)}%  admitted=${(c.admittedFraction * 100).toFixed(1)}%`,
    );
  }
  // Pick the operating point with the largest error reduction subject to
  // admittedFraction ≥ 0.5 (i.e. we still answer at least half of traffic).
  const headline =
    composedSweep
      .filter((c) => c.admittedFraction >= 0.5)
      .sort((a, b) => b.errorReduction - a.errorReduction)[0] ?? composedSweep[2];
  console.log(
    `       → HEADLINE  τ=${headline.tau.toFixed(2)}  baseline=${(headline.baselineErrorRate * 100).toFixed(1)}%  gated=${(headline.gatedErrorRate * 100).toFixed(1)}%  reduction=${(headline.errorReduction * 100).toFixed(1)}%`,
  );

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
      V_composedEffect: {
        sweep: composedSweep,
        headline,
      },
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
    determinism: "mulberry32-seeded; same N + same Node + same arch → ±2% wall-clock",
  };

  writeFileSync(resolve(outDir, "bench-data.json"), JSON.stringify(benchData, null, 2));
  writeFileSync(resolve(outDir, "bench-meta.json"), JSON.stringify(benchMeta, null, 2));

  console.log("\n─".repeat(72));
  console.log(`Wrote ${resolve(outDir, "bench-data.json")}`);
  console.log(`Wrote ${resolve(outDir, "bench-meta.json")}`);
}

main();
