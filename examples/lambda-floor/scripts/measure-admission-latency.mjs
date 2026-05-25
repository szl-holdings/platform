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
// We run two batches:
//   - admit batch: all-pass Λ-vector. Steady-state cost of the validator.
//   - deny batch:  one axis deliberately below the floor. Exercises the
//                  failure-message construction path, which historically has
//                  been the regression vector (string templating in the hot
//                  path can blow the budget without touching the admit path).
// The §05 budget applies to both paths; we check them independently.
//
// Inputs (env): SAMPLES, P95_BUDGET_MS, OUT_DIR
// Outputs ($OUT_DIR):
//   - samples.ndjson     one JSON record per request {idx, batch, ms, ok}
//   - summary.json       {admit:{...}, deny:{...}, budget_ms, pass, ...}
//   - summary.md         human-readable table for the PR comment
//
// Exit status:
//   0  both p95s ≤ budget AND every request had its expected outcome
//   1  budget exceeded on either path
//   2  any request had the wrong outcome (admit denied or deny admitted —
//      either means the deployed webhook is broken, not slow)
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

// ---- payloads --------------------------------------------------------------
// All-pass Λ-vector — exercises the admit path.
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

// Same vector with moralGrounding pulled below the §05 floor (0.95). This
// forces the validator down the deny branch and through the failure-message
// construction path we want to keep honest.
const FAIL_LAMBDA = { ...PASS_LAMBDA, moralGrounding: 0.92 };

function manifest(name, lambda) {
  return {
    apiVersion: "doctrine.szl.io/v1alpha1",
    kind: "AgentInvocation",
    metadata: { name, namespace: "default" },
    spec: {
      agent: "bench.lambda-floor",
      invocationId: name,
      lambda,
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

const tmp = tmpdir();

// ---- warmup (excluded from samples; kicks the webhook out of cold start) ---
// Warm both branches so the first measured sample on each path doesn't pay
// for any branch-specific JIT/cache effects in the validator.
const WARMUP = 5;
for (const [tag, lambda] of [
  ["warm-admit", PASS_LAMBDA],
  ["warm-deny", FAIL_LAMBDA],
]) {
  for (let i = 0; i < WARMUP; i++) {
    const name = `bench-${tag}-${i}-${randomUUID().slice(0, 8)}`;
    const p = join(tmp, `${name}.json`);
    writeFileSync(p, JSON.stringify(manifest(name, lambda)));
    kubectlApply(p);
  }
}

// ---- measurement -----------------------------------------------------------
// `expectAdmit` tells us which outcome counts as "right" for this batch. For
// the admit batch, ok=false is a webhook regression. For the deny batch,
// ok=true means the webhook failed to enforce the floor — equally bad.
function runBatch({ tag, lambda, expectAdmit }) {
  const samples = [];
  let wrongOutcome = 0;
  const lines = [];
  for (let i = 0; i < SAMPLES; i++) {
    const name = `bench-${tag}-${String(i).padStart(4, "0")}-${randomUUID().slice(0, 8)}`;
    const p = join(tmp, `${name}.json`);
    writeFileSync(p, JSON.stringify(manifest(name, lambda)));
    const { ms, ok, stderr } = kubectlApply(p);
    const correct = ok === expectAdmit;
    if (!correct) {
      wrongOutcome++;
      process.stderr.write(
        `[${tag}:wrong-outcome] ${name} ok=${ok} expected=${expectAdmit}: ${stderr.trim()}\n`,
      );
    }
    samples.push(ms);
    lines.push(JSON.stringify({ idx: i, batch: tag, ms, ok, correct }));
  }
  return { samples, wrongOutcome, lines };
}

const admit = runBatch({ tag: "admit", lambda: PASS_LAMBDA, expectAdmit: true });
const deny = runBatch({ tag: "deny", lambda: FAIL_LAMBDA, expectAdmit: false });

writeFileSync(
  join(OUT_DIR, "samples.ndjson"),
  [...admit.lines, ...deny.lines].join("\n") + "\n",
);

// ---- summary ---------------------------------------------------------------
function stats(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const pct = (p) =>
    sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  return {
    n: samples.length,
    p50_ms: +pct(50).toFixed(3),
    p95_ms: +pct(95).toFixed(3),
    p99_ms: +pct(99).toFixed(3),
    max_ms: +sorted[sorted.length - 1].toFixed(3),
    mean_ms: +mean.toFixed(3),
  };
}

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

const admitStats = stats(admit.samples);
const denyStats = stats(deny.samples);
const admitPass = admit.wrongOutcome === 0 && admitStats.p95_ms <= P95_BUDGET_MS;
const denyPass = deny.wrongOutcome === 0 && denyStats.p95_ms <= P95_BUDGET_MS;

const summary = {
  budget_ms: P95_BUDGET_MS,
  warmup_per_path: WARMUP,
  admit: {
    ...admitStats,
    wrong_outcome: admit.wrongOutcome,
    pass: admitPass,
  },
  deny: {
    ...denyStats,
    wrong_outcome: deny.wrongOutcome,
    pass: denyPass,
  },
  pass: admitPass && denyPass,
  node_version: process.version,
  runner: process.env.RUNNER_NAME || process.env.HOSTNAME || "unknown",
  kubectl_version: tryCmd(["kubectl", "version", "--client=true", "-o=json"]),
  doctrine_version: payload.doctrine_version,
  replay_root: payload.replay_root,
  collected_at: new Date().toISOString(),
};

writeFileSync(join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2) + "\n");

const row = (label, s, wrong, pass) =>
  `| ${label} | ${s.n} | ${s.p50_ms} | **${s.p95_ms}** | ${s.p99_ms} | ${s.max_ms} | ${s.mean_ms} | ${wrong} | ${pass ? "✅" : "❌"} |`;

const md = `# lambda-floor — in-cluster admission latency

Budget: **p95 ≤ ${P95_BUDGET_MS} ms** on both admit and deny paths. Warmup: ${WARMUP} per path.

| path | n | p50 | p95 | p99 | max | mean | wrong-outcome | pass |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | :---: |
${row("admit", admitStats, admit.wrongOutcome, admitPass)}
${row("deny", denyStats, deny.wrongOutcome, denyPass)}

Overall: ${summary.pass ? "✅" : "❌"}

| field | value |
| --- | --- |
| runner | ${summary.runner} |
| node | ${summary.node_version} |
| doctrine | ${summary.doctrine_version} (replay-root ${summary.replay_root.slice(0, 12)}…) |
| collected | ${summary.collected_at} |

Raw samples: \`samples.ndjson\` (one JSON record per request, tagged by batch).
`;
writeFileSync(join(OUT_DIR, "summary.md"), md);

process.stdout.write(md);

if (admit.wrongOutcome > 0 || deny.wrongOutcome > 0) process.exit(2);
if (admitStats.p95_ms > P95_BUDGET_MS) {
  process.stderr.write(
    `admit p95 ${admitStats.p95_ms} ms exceeds budget ${P95_BUDGET_MS} ms\n`,
  );
  process.exit(1);
}
if (denyStats.p95_ms > P95_BUDGET_MS) {
  process.stderr.write(
    `deny p95 ${denyStats.p95_ms} ms exceeds budget ${P95_BUDGET_MS} ms\n`,
  );
  process.exit(1);
}
