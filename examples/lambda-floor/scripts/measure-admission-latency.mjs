#!/usr/bin/env node
// ---------------------------------------------------------------------------
// measure-admission-latency.mjs
//
// Applies $SAMPLES AgentInvocation CRs against the currently-targeted
// kube-apiserver (kubeconfig from $KUBECONFIG / ~/.kube/config) and records
// the wall-clock round-trip time per request as observed by `kubectl create`.
//
// Why this measures the right thing
// ---------------------------------
// The `lambda-floor` Pepr capability registers a ValidatingWebhookConfiguration
// against kube-apiserver. When `kubectl create` POSTs an AgentInvocation, the
// apiserver synchronously calls the webhook before returning to the client.
// Therefore the wall-clock RTT observed here is exactly the §05 acceptance
// metric: end-to-end admission latency including the webhook round trip.
//
// Inputs (env): SAMPLES, P95_BUDGET_MS, OUT_DIR
// Outputs ($OUT_DIR):
//   - samples.ndjson     one JSON record per request {idx, ms, ok}
//   - summary.json       {n, p50, p95, p99, max, mean, budget_ms, pass,
//                         node, runner, kubectl_version, doctrine_version}
//   - summary.md         human-readable table for the PR comment
//
// Exit status:
//   0  p95 ≤ budget AND every request was admitted
//   1  budget exceeded
//   2  any request failed (means the deployed webhook is broken, not slow)
// ---------------------------------------------------------------------------
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const SAMPLES = Number(process.env.SAMPLES ?? 200);
const P95_BUDGET_MS = Number(process.env.P95_BUDGET_MS ?? 50);
const OUT_DIR = process.env.OUT_DIR ?? "./artifacts/lambda-floor-latency";
mkdirSync(OUT_DIR, { recursive: true });

// ---- payload ---------------------------------------------------------------
// A single all-pass Λ-vector. We deliberately exercise the admit path so that
// the measured RTT reflects the steady-state cost (deny would early-return
// from the validator and underestimate the worst case the budget covers).
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

function manifest(name) {
  return {
    apiVersion: "doctrine.szl.io/v1alpha1",
    kind: "AgentInvocation",
    metadata: { name, namespace: "default" },
    spec: {
      agent: "bench.lambda-floor",
      invocationId: name,
      lambda: PASS_LAMBDA,
    },
  };
}

function kubectlApply(path) {
  // -f - via stdin would also work, but writing a file keeps the timing
  // honest by excluding our own JSON-encoding step from the measured RTT.
  const t0 = process.hrtime.bigint();
  const r = spawnSync("kubectl", ["create", "-f", path], {
    encoding: "utf8",
    timeout: 15_000,
  });
  const t1 = process.hrtime.bigint();
  const ms = Number(t1 - t0) / 1e6;
  return { ms, ok: r.status === 0, stderr: r.stderr };
}

// ---- warmup (excluded from samples; kicks the webhook out of cold start) ---
const WARMUP = 5;
const tmp = tmpdir();
for (let i = 0; i < WARMUP; i++) {
  const name = `bench-warm-${i}-${randomUUID().slice(0, 8)}`;
  const p = join(tmp, `${name}.json`);
  writeFileSync(p, JSON.stringify(manifest(name)));
  kubectlApply(p);
}

// ---- measurement -----------------------------------------------------------
const samples = [];
let failed = 0;
const ndjsonLines = [];
for (let i = 0; i < SAMPLES; i++) {
  const name = `bench-${String(i).padStart(4, "0")}-${randomUUID().slice(0, 8)}`;
  const p = join(tmp, `${name}.json`);
  writeFileSync(p, JSON.stringify(manifest(name)));
  const { ms, ok, stderr } = kubectlApply(p);
  if (!ok) {
    failed++;
    process.stderr.write(`[fail] ${name}: ${stderr.trim()}\n`);
  }
  samples.push(ms);
  ndjsonLines.push(JSON.stringify({ idx: i, ms, ok }));
}

writeFileSync(join(OUT_DIR, "samples.ndjson"), ndjsonLines.join("\n") + "\n");

// ---- summary ---------------------------------------------------------------
const sorted = [...samples].sort((a, b) => a - b);
const pct = (p) => sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
const mean = samples.reduce((a, b) => a + b, 0) / samples.length;

function tryCmd(argv) {
  try {
    return spawnSync(argv[0], argv.slice(1), { encoding: "utf8" }).stdout.trim();
  } catch {
    return null;
  }
}

const payload = JSON.parse(
  readFileSync(new URL("../payload/lambda-floor-payload.json", import.meta.url)),
);

const summary = {
  n: samples.length,
  warmup: WARMUP,
  p50_ms: +pct(50).toFixed(3),
  p95_ms: +pct(95).toFixed(3),
  p99_ms: +pct(99).toFixed(3),
  max_ms: +sorted[sorted.length - 1].toFixed(3),
  mean_ms: +mean.toFixed(3),
  budget_ms: P95_BUDGET_MS,
  failures: failed,
  pass: failed === 0 && pct(95) <= P95_BUDGET_MS,
  node_version: process.version,
  runner: process.env.RUNNER_NAME || process.env.HOSTNAME || "unknown",
  kubectl_version: tryCmd(["kubectl", "version", "--client=true", "-o=json"]),
  doctrine_version: payload.doctrine_version,
  replay_root: payload.replay_root,
  collected_at: new Date().toISOString(),
};

writeFileSync(join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2) + "\n");

const md = `# lambda-floor — in-cluster admission latency

| metric | value |
| --- | --- |
| samples | ${summary.n} (warmup: ${summary.warmup}) |
| p50 | ${summary.p50_ms} ms |
| **p95** | **${summary.p95_ms} ms** (budget: ${summary.budget_ms} ms) |
| p99 | ${summary.p99_ms} ms |
| max | ${summary.max_ms} ms |
| mean | ${summary.mean_ms} ms |
| failures | ${summary.failures} |
| pass | ${summary.pass ? "✅" : "❌"} |
| runner | ${summary.runner} |
| node | ${summary.node_version} |
| doctrine | ${summary.doctrine_version} (replay-root ${summary.replay_root.slice(0, 12)}…) |
| collected | ${summary.collected_at} |

Raw samples: \`samples.ndjson\` (one JSON record per request).
`;
writeFileSync(join(OUT_DIR, "summary.md"), md);

process.stdout.write(md);

if (failed > 0) process.exit(2);
if (summary.p95_ms > P95_BUDGET_MS) {
  process.stderr.write(
    `p95 ${summary.p95_ms} ms exceeds budget ${P95_BUDGET_MS} ms\n`,
  );
  process.exit(1);
}
