#!/usr/bin/env node
/**
 * audit-full.js — Runtime Audit Harness
 *
 * Runs the full audit pipeline end-to-end, streams logs in real time, captures
 * structured evidence per-step, and generates a human-readable summary report.
 *
 * Priority semantics
 *   P0 — Blocking: boot failure, typecheck, lint, unit tests, build, broken core
 *        public routes, runtime readiness, and API-key enforcement. Pipeline
 *        aborts on first P0 failure. Exit code 1.
 *   P1 — Advisory: mocks, copy, deps, design-system, broken links, a11y, brand,
 *        docs claims, E2E. Recorded but do NOT block. Exit code 0.
 *
 * Evidence layout
 *   artifacts/audit/evidence/<timestamp>/<step>/
 *     stdout.txt  stderr.txt  result.json  [artifacts/]
 *   artifacts/audit/evidence/latest/
 *     summary.md  index.json
 *
 * Usage
 *   pnpm audit:full                          # full pipeline
 *   pnpm audit:full:fast                     # --skip-install --skip-e2e
 *   pnpm audit:full:ci                       # --skip-install --skip-e2e (CI, P0-blocking only)
 *   node scripts/audit-full.js [flags]
 *
 * Flags
 *   --skip-install   skip pnpm install step
 *   --skip-e2e       skip Playwright E2E
 *   --json           suppress prose; emit a single JSON summary to stdout
 *   --artifacts-dir  extra directory whose contents are copied into evidence (optional)
 */

import { spawn } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SKIP_INSTALL = process.argv.includes('--skip-install');
const SKIP_E2E = process.argv.includes('--skip-e2e');
const JSON_OUTPUT = process.argv.includes('--json');

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);

const EVIDENCE_ROOT = join(ROOT, 'artifacts/audit/evidence');
const RUN_DIR = join(EVIDENCE_ROOT, TIMESTAMP);
const LATEST_DIR = join(EVIDENCE_ROOT, 'latest');

mkdirSync(RUN_DIR, { recursive: true });
mkdirSync(LATEST_DIR, { recursive: true });

// ─── Step registry ────────────────────────────────────────────────────────────
// P0 = merge-blocking (exit 1 on failure; pipeline aborts immediately)
// P1 = advisory only  (always recorded; never block the exit code)
//
// "artifacts" lists directories produced by the step that should be
// mirrored into the evidence tree (e.g. playwright-report, lighthouse).
const STEPS = [
  {
    id: 'install',
    label: 'Install dependencies',
    cmd: 'pnpm install --frozen-lockfile',
    priority: 'P0',
    skip: SKIP_INSTALL,
  },
  {
    id: 'typecheck',
    label: 'Typecheck',
    cmd: 'pnpm run typecheck',
    priority: 'P0',
  },
  {
    id: 'lint',
    label: 'Lint',
    cmd: 'pnpm run lint',
    priority: 'P0',
  },
  {
    id: 'test',
    label: 'Unit tests',
    cmd: 'pnpm run test',
    priority: 'P0',
  },
  {
    id: 'build',
    label: 'Build all packages',
    cmd: 'pnpm -r --if-present run build',
    priority: 'P0',
  },
  // Core public route checks are P0 — a broken public route is a boot-level
  // failure that must block merges per the task requirement.
  {
    id: 'audit-routes',
    label: 'Audit: route registry & classification',
    cmd: 'pnpm run audit:routes',
    priority: 'P0',
  },
  {
    id: 'qa-site',
    label: 'QA: site (routes + links + trust + meta + empty-states + og)',
    cmd: 'pnpm run qa:site',
    priority: 'P0',
  },
  {
    id: 'smoke-product-mode',
    label: 'Smoke: product mode',
    cmd: 'pnpm run smoke:product-mode',
    priority: 'P0',
  },
  // Advisory checks — failures recorded and reported, but do not block merges.
  {
    id: 'audit-mocks',
    label: 'Audit: mocks',
    cmd: 'pnpm run audit:mocks',
    priority: 'P1',
  },
  {
    id: 'audit-copy',
    label: 'Audit: copy',
    cmd: 'pnpm run audit:copy',
    priority: 'P1',
  },
  {
    id: 'audit-deps',
    label: 'Audit: deps',
    cmd: 'pnpm run audit:deps',
    priority: 'P1',
  },
  {
    id: 'audit-design-system',
    label: 'Audit: design system',
    cmd: 'pnpm run audit:design-system',
    priority: 'P1',
  },
  {
    id: 'audit-broken-links',
    label: 'Audit: broken links',
    cmd: 'pnpm run audit:broken-links',
    priority: 'P1',
  },
  {
    id: 'qa-a11y',
    label: 'QA: accessibility',
    cmd: 'pnpm run qa:a11y',
    priority: 'P1',
  },
  {
    id: 'brand-check',
    label: 'Brand check',
    cmd: 'pnpm run brand:check',
    priority: 'P1',
  },
  {
    id: 'docs-claims-check',
    label: 'Docs: claims check',
    cmd: 'pnpm run docs:claims-check',
    priority: 'P1',
  },
  ...(SKIP_E2E
    ? []
    : [
        {
          id: 'e2e',
          label: 'E2E tests (Playwright)',
          cmd: 'pnpm run test:e2e',
          priority: 'P1',
          // Playwright writes reports here by default; mirror into evidence
          artifactDirs: ['playwright-report', 'test-results'],
        },
      ]),
];

// ─── Streaming runner ─────────────────────────────────────────────────────────
function log(msg) {
  if (!JSON_OUTPUT) process.stdout.write(`${msg}\n`);
}

/**
 * Run a single step, streaming stdout/stderr in real time while also
 * buffering them for evidence capture.
 */
async function runStep(step) {
  if (step.skip) {
    log(`\n⏭  [SKIP] ${step.label}`);
    return {
      ...step,
      status: 'skipped',
      exitCode: null,
      durationMs: 0,
      stdout: '',
      stderr: '',
    };
  }

  log(`\n▶  [${step.priority}] ${step.label}`);
  log(`   cmd: ${step.cmd}`);

  const stepDir = join(RUN_DIR, step.id);
  mkdirSync(stepDir, { recursive: true });

  const start = Date.now();

  const stdoutChunks = [];
  const stderrChunks = [];

  const exitCode = await new Promise((resolve) => {
    const child = spawn(step.cmd, {
      shell: true,
      cwd: ROOT,
      env: { ...process.env, CI: '1', FORCE_COLOR: '0' },
    });

    child.stdout.on('data', (chunk) => {
      stdoutChunks.push(chunk);
      if (!JSON_OUTPUT) process.stdout.write(chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderrChunks.push(chunk);
      if (!JSON_OUTPUT) process.stderr.write(chunk);
    });

    child.on('close', (code) => resolve(code ?? 1));
    child.on('error', (err) => {
      stderrChunks.push(Buffer.from(err.message));
      resolve(1);
    });
  });

  const durationMs = Date.now() - start;
  const stdout = Buffer.concat(stdoutChunks).toString();
  const stderr = Buffer.concat(stderrChunks).toString();
  const passed = exitCode === 0;

  // Write evidence
  writeFileSync(join(stepDir, 'stdout.txt'), stdout);
  writeFileSync(join(stepDir, 'stderr.txt'), stderr);
  writeFileSync(
    join(stepDir, 'result.json'),
    JSON.stringify(
      {
        id: step.id,
        label: step.label,
        cmd: step.cmd,
        priority: step.priority,
        exitCode,
        passed,
        durationMs,
        timestamp: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  // Mirror any declared artifact directories into evidence
  if (step.artifactDirs) {
    const artifactsDir = join(stepDir, 'artifacts');
    mkdirSync(artifactsDir, { recursive: true });
    for (const relDir of step.artifactDirs) {
      const src = join(ROOT, relDir);
      if (existsSync(src)) {
        try {
          cpSync(src, join(artifactsDir, relDir), { recursive: true });
        } catch {
          // best-effort copy
        }
      }
    }
  }

  const icon = passed ? '✅' : '❌';
  const secs = (durationMs / 1000).toFixed(1);
  log(`   ${icon} exit ${exitCode}  (${secs}s)`);

  return {
    ...step,
    status: passed ? 'pass' : 'fail',
    exitCode,
    durationMs,
    stdout,
    stderr,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
log(`\n╔═══════════════════════════════════════════════════════╗`);
log(`║  Runtime Audit Harness  —  ${TIMESTAMP}  ║`);
log(`╚═══════════════════════════════════════════════════════╝`);
log(`   Evidence dir: ${RUN_DIR}`);
log(
  `   Steps: ${STEPS.filter((s) => !s.skip).length}  (${STEPS.filter((s) => s.skip).length} skipped)`,
);

const results = [];

for (const step of STEPS) {
  const r = await runStep(step);
  results.push(r);

  // Abort immediately on P0 failure — downstream steps are meaningless if
  // build/typecheck/routes are broken.
  if (r.status === 'fail' && r.priority === 'P0') {
    log(`\n🛑  P0 failure in "${r.label}" — aborting pipeline.`);
    break;
  }
}

// ─── Summary generation ───────────────────────────────────────────────────────
const p0Results = results.filter((r) => r.priority === 'P0' && r.status !== 'skipped');
const p1Results = results.filter((r) => r.priority === 'P1' && r.status !== 'skipped');
const p0Failures = p0Results.filter((r) => r.status === 'fail');
const p1Failures = p1Results.filter((r) => r.status === 'fail');
const totalMs = results.reduce((s, r) => s + (r.durationMs || 0), 0);
const nowIso = new Date().toISOString();

// ─── Parse per-product route counts from qa:site/qa-routes stdout ─────────────
// smoke-routes.js prints lines like:
//   "  ── SZL Holdings (12 routes) @ http://..."
//   "    passed: 11  failed: 1"
// and the domain summary JSON block. We do a best-effort extraction.
function extractRouteTable(steps) {
  const siteStep = steps.find((r) => r.id === 'qa-site');
  if (!siteStep || siteStep.status === 'skipped') return null;

  const output = `${siteStep.stdout}\n${siteStep.stderr}`;
  const lines = output.split('\n');
  const products = [];

  // Match domain headers like "  ── SZL Holdings (12 routes) @ http://..."
  const domainRe = /──\s+(.+?)\s+\((\d+)\s+routes?\)/;
  // Match trailing pass/fail counts: "passed: 11  failed: 1" or "11 passed, 1 failed"
  const countRe1 = /passed[:\s]+(\d+)[^\d]+failed[:\s]+(\d+)/i;
  const countRe2 = /(\d+)\s+passed[,\s]+(\d+)\s+failed/i;

  let currentDomain = null;
  for (const line of lines) {
    const domainMatch = line.match(domainRe);
    if (domainMatch) {
      currentDomain = { name: domainMatch[1].trim(), total: parseInt(domainMatch[2], 10) };
      products.push(currentDomain);
      continue;
    }
    if (currentDomain && !currentDomain.passed) {
      const m1 = line.match(countRe1);
      const m2 = line.match(countRe2);
      if (m1) {
        currentDomain.passed = parseInt(m1[1], 10);
        currentDomain.failed = parseInt(m1[2], 10);
      } else if (m2) {
        currentDomain.passed = parseInt(m2[1], 10);
        currentDomain.failed = parseInt(m2[2], 10);
      }
    }
  }

  return products.length > 0 ? products : null;
}

const routeTable = extractRouteTable(results);

const summaryLines = [
  `# Runtime Audit Summary`,
  ``,
  `**Run:** \`${TIMESTAMP}\`  `,
  `**Generated:** ${nowIso}  `,
  `**Total duration:** ${(totalMs / 1000).toFixed(1)}s  `,
  `**Overall:** ${p0Failures.length === 0 ? '✅ PASS' : '❌ FAIL (P0 blocking)'}`,
  ``,
  `---`,
  ``,
  `## Product Status`,
  ``,
  routeTable
    ? [
        `| Product | Routes | Passed | Failed | Status |`,
        `|---------|--------|--------|--------|--------|`,
        ...routeTable.map((p) => {
          const passed = p.passed ?? '?';
          const failed = p.failed ?? '?';
          const status = p.failed === 0 ? '✅' : p.failed > 0 ? '❌' : '—';
          return `| ${p.name} | ${p.total} | ${passed} | ${failed} | ${status} |`;
        }),
      ].join('\n')
    : `_Route counts not available (qa:site step did not run or produced no parseable output)._`,
  ``,
  `---`,
  ``,
  `## Step Results`,
  ``,
  `| Priority | Step | Status | Duration | Evidence |`,
  `|----------|------|--------|----------|----------|`,
  ...results.map((r) => {
    const icon = r.status === 'pass' ? '✅ pass' : r.status === 'skipped' ? '⏭ skipped' : '❌ fail';
    const dur = r.durationMs ? `${(r.durationMs / 1000).toFixed(1)}s` : '—';
    const evidencePath =
      r.status !== 'skipped' ? `[\`${r.id}/\`](../evidence/${TIMESTAMP}/${r.id}/)` : '—';
    return `| ${r.priority || '—'} | ${r.label} | ${icon} | ${dur} | ${evidencePath} |`;
  }),
  ``,
  `---`,
  ``,
  `## P0 Failures (merge-blocking)`,
  ``,
  p0Failures.length === 0
    ? `_None — all P0 checks passed._`
    : p0Failures
        .map(
          (r) =>
            `### ❌ ${r.label}\n` + `\`\`\`\n${(r.stderr || r.stdout || '').slice(-2000)}\n\`\`\``,
        )
        .join('\n\n'),
  ``,
  `## P1 Failures (advisory — do not block merge)`,
  ``,
  p1Failures.length === 0
    ? `_None — all P1 checks passed._`
    : p1Failures
        .map(
          (r) =>
            `### ⚠️ ${r.label}\n` + `\`\`\`\n${(r.stderr || r.stdout || '').slice(-800)}\n\`\`\``,
        )
        .join('\n\n'),
  ``,
  `---`,
  ``,
  `## Evidence`,
  ``,
  `All step output is captured under \`artifacts/audit/evidence/${TIMESTAMP}/\`.  `,
  `Each step directory contains \`stdout.txt\`, \`stderr.txt\`, \`result.json\`,  `,
  `and an \`artifacts/\` subdirectory for any files the step produces  `,
  `(Playwright reports, Lighthouse JSON, HAR bundles, screenshots).`,
  ``,
  `Run locally:`,
  `\`\`\`bash`,
  `pnpm audit:full`,
  `# skip slow steps for local iteration:`,
  `pnpm audit:full:fast`,
  `\`\`\``,
];

const summaryMd = summaryLines.join('\n');

const indexJson = {
  timestamp: TIMESTAMP,
  generatedAt: nowIso,
  totalDurationMs: totalMs,
  passed: p0Failures.length === 0,
  p0Failures: p0Failures.map((r) => r.id),
  p1Failures: p1Failures.map((r) => r.id),
  steps: results.map((r) => ({
    id: r.id,
    label: r.label,
    priority: r.priority,
    status: r.status,
    exitCode: r.exitCode ?? null,
    durationMs: r.durationMs,
  })),
};

// Write to timestamped run directory
writeFileSync(join(RUN_DIR, 'summary.md'), summaryMd);
writeFileSync(join(RUN_DIR, 'index.json'), JSON.stringify(indexJson, null, 2));

// Update latest/ (stable path for CI artifacts and human reference)
writeFileSync(join(LATEST_DIR, 'summary.md'), summaryMd);
writeFileSync(
  join(LATEST_DIR, 'index.json'),
  JSON.stringify({ latestRun: TIMESTAMP, evidenceDir: RUN_DIR, ...indexJson }, null, 2),
);

// ─── Terminal summary ─────────────────────────────────────────────────────────
log(`\n${'─'.repeat(60)}`);
log(`Audit complete.`);
log(`  Steps run:    ${results.filter((r) => r.status !== 'skipped').length}`);
log(`  P0 failures:  ${p0Failures.length}  (${p0Failures.map((r) => r.id).join(', ') || 'none'})`);
log(`  P1 advisories: ${p1Failures.length}  (${p1Failures.map((r) => r.id).join(', ') || 'none'})`);
log(`  Duration:     ${(totalMs / 1000).toFixed(1)}s`);
log(`  Evidence:     ${RUN_DIR}`);
log(`  Summary:      ${join(LATEST_DIR, 'summary.md')}`);
log(`${'─'.repeat(60)}\n`);

if (JSON_OUTPUT) {
  process.stdout.write(
    `${JSON.stringify(
      {
        timestamp: TIMESTAMP,
        passed: p0Failures.length === 0,
        p0Failures: p0Failures.map((r) => r.id),
        p1Failures: p1Failures.map((r) => r.id),
        evidenceDir: RUN_DIR,
        summaryPath: join(LATEST_DIR, 'summary.md'),
      },
      null,
      2,
    )}\n`,
  );
}

// Exit 1 only on P0 failures. P1 advisories never block the exit code.
process.exit(p0Failures.length > 0 ? 1 : 0);
