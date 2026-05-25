#!/usr/bin/env node
// ---------------------------------------------------------------------------
// measure-evaluator-cpu.mjs
//
// Hardware-portable microbenchmark for the *CPU portion* of the lambda-floor
// admission gate — i.e. the pure `evaluateLambdaFloor()` function the Pepr
// Validate handler calls per AdmissionReview.
//
// Why this is meaningful even without a real cluster
// --------------------------------------------------
// The §05 acceptance criterion (p95 ≤ 50 ms, end-to-end including webhook
// RTT) decomposes into three additive components:
//
//   T_admission = T_apiserver + T_network + T_gate_cpu
//
// * T_apiserver and T_network are well-bounded by upstream Pepr's own nightly
//   load test on ubuntu-latest (a 2 vCPU runner, the closest GitHub-hosted
//   analogue to t3.medium); see PR_DESCRIPTION.md for the linked artifact.
// * T_gate_cpu is what *we* added in this PR. It is the only component that
//   is sensitive to changes in this capability, and it is fully portable
//   across x86_64 hardware in the t3.medium class.
//
// This script measures T_gate_cpu directly with the same evaluator the
// webhook runs, on the same payload constants the webhook bundles. The
// number it produces is an upper bound on T_gate_cpu on any host with
// equivalent or better single-thread performance to the measurement host.
//
// Output: $OUT_DIR/{evaluator-samples.ndjson, evaluator-summary.json,
//                   evaluator-summary.md, host.json}
// ---------------------------------------------------------------------------
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { cpus, hostname, totalmem, arch, platform, release } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODULE_DIR = resolve(__dirname, "..");

const SAMPLES = Number(process.env.SAMPLES ?? 100_000);
const WARMUP = Number(process.env.WARMUP ?? 5_000);
const OUT_DIR =
  process.env.OUT_DIR ?? join(MODULE_DIR, "artifacts/lambda-floor-latency");
mkdirSync(OUT_DIR, { recursive: true });

// ---- Evaluator (direct port of capabilities/lambda-floor.ts — same algorithm,
// same payload, no transitive deps so it runs on plain node without tsx/pepr).
const payload = JSON.parse(
  readFileSync(
    join(MODULE_DIR, "payload/lambda-floor-payload.json"),
    "utf8",
  ),
);
const LAMBDA_CONJUNCTIVE_FLOOR = payload.lambda_conjunctive_floor;
const AXIS_FLOORS = payload.axes;

function clamp01(v) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}
function lambdaConjunctive(axes) {
  const vals = AXIS_FLOORS.map(({ id }) => clamp01(axes[id] ?? 0));
  if (vals.some((v) => v <= 0)) return 0;
  let s = 0;
  for (const v of vals) s += Math.log(v);
  return Math.exp(s / vals.length);
}
function evaluateLambdaFloor(axes) {
  const failures = [];
  for (const { id, floor } of AXIS_FLOORS) {
    const v = clamp01(axes[id] ?? 0);
    if (v < floor) failures.push({ axis: id, value: v, floor });
  }
  const lc = lambdaConjunctive(axes);
  if (lc < LAMBDA_CONJUNCTIVE_FLOOR)
    failures.push({
      axis: "lambdaConjunctive",
      value: lc,
      floor: LAMBDA_CONJUNCTIVE_FLOOR,
    });
  return { admitted: failures.length === 0, lambdaConjunctive: lc, failures };
}

// ---- Inputs: same all-pass Λ-vector as the in-cluster harness so the two
// measurements line up apples-to-apples on the admit path.
const PASS_LAMBDA = {
  moralGrounding: 0.97,
  measurabilityHonesty: 0.97,
  temporalConsistency: 0.93,
  informationIntegrity: 0.93,
  actionReversibility: 0.93,
  scopeContainment: 0.93,
  stakeholderAlignment: 0.93,
  evidenceAdequacy: 0.93,
  consentBoundary: 0.93,
};

// ---- Warmup
for (let i = 0; i < WARMUP; i++) evaluateLambdaFloor(PASS_LAMBDA);

// ---- Measurement
const samples = new Float64Array(SAMPLES);
const lines = [];
for (let i = 0; i < SAMPLES; i++) {
  const t0 = process.hrtime.bigint();
  const r = evaluateLambdaFloor(PASS_LAMBDA);
  const t1 = process.hrtime.bigint();
  const ms = Number(t1 - t0) / 1e6;
  samples[i] = ms;
  if (!r.admitted) throw new Error("evaluator regressed: PASS_LAMBDA denied");
  // Don't NDJSON-stringify every record (would distort the loop) — emit
  // a sparse trace (every 1000th sample) for offline inspection.
  if (i % 1000 === 0) lines.push(JSON.stringify({ idx: i, ms }));
}
writeFileSync(join(OUT_DIR, "evaluator-samples.ndjson"), lines.join("\n") + "\n");

// ---- Summary
const sorted = Array.from(samples).sort((a, b) => a - b);
const pct = (p) =>
  sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;

const c0 = cpus()[0] || {};
// Some Linux containers report cpus()[0].speed === 0; fall back to /proc/cpuinfo.
let cpuMhz = c0.speed || 0;
if (!cpuMhz) {
  try {
    const m = readFileSync("/proc/cpuinfo", "utf8").match(/cpu MHz\s*:\s*([0-9.]+)/);
    if (m) cpuMhz = Math.round(parseFloat(m[1]));
  } catch {}
}
const collectedAt = new Date().toISOString();
const host = {
  hostname: hostname(),
  arch: arch(),
  platform: platform(),
  release: release(),
  cpu_model: c0.model,
  cpu_mhz: cpuMhz,
  cpu_count: cpus().length,
  total_mem_bytes: totalmem(),
  node_version: process.version,
  collected_at: collectedAt,
};
writeFileSync(join(OUT_DIR, "host.json"), JSON.stringify(host, null, 2) + "\n");

const summary = {
  measured: "T_gate_cpu (pure evaluator only — NOT end-to-end)",
  n: SAMPLES,
  warmup: WARMUP,
  p50_ms: +pct(50).toFixed(6),
  p95_ms: +pct(95).toFixed(6),
  p99_ms: +pct(99).toFixed(6),
  max_ms: +sorted[sorted.length - 1].toFixed(6),
  mean_ms: +mean.toFixed(6),
  collected_at: collectedAt,
  doctrine_version: payload.doctrine_version,
  replay_root: payload.replay_root,
  host,
  note:
    "End-to-end p95 (apiserver + webhook RTT + this evaluator) is bounded " +
    "above by the in-cluster harness in scripts/run-cluster-latency.sh. " +
    "Run that on a t3.medium for the §05 acceptance number.",
};
writeFileSync(
  join(OUT_DIR, "evaluator-summary.json"),
  JSON.stringify(summary, null, 2) + "\n",
);

const md = `# lambda-floor — CPU-portion microbenchmark (T_gate_cpu)

> **Scope.** This measures only the pure \`evaluateLambdaFloor()\` function
> that the Pepr Validate handler calls per AdmissionReview. It does **not**
> include kube-apiserver request handling or the webhook network RTT. For
> the full §05 end-to-end p95, run \`scripts/run-cluster-latency.sh\` on a
> reference t3.medium (see \`PR_DESCRIPTION.md\` row 4).

| metric | value |
| --- | --- |
| samples | ${summary.n.toLocaleString()} (warmup: ${summary.warmup.toLocaleString()}) |
| p50 | ${summary.p50_ms} ms |
| **p95** | **${summary.p95_ms} ms** |
| p99 | ${summary.p99_ms} ms |
| max | ${summary.max_ms} ms |
| mean | ${summary.mean_ms} ms |
| host CPU | ${host.cpu_model} @ ${host.cpu_mhz} MHz |
| host arch | ${host.arch} / ${host.platform} ${host.release} |
| node | ${host.node_version} |
| doctrine | ${summary.doctrine_version} (replay-root ${summary.replay_root.slice(0, 12)}…) |
| collected | ${summary.collected_at} |

Raw samples: \`evaluator-samples.ndjson\` (1-in-1000 trace).
Host record: \`host.json\`.
`;
writeFileSync(join(OUT_DIR, "evaluator-summary.md"), md);
process.stdout.write(md);
