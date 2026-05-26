#!/usr/bin/env node
// Excluded-Repo Promotion Probe
//
// Task #5273 — `vsp-otel` (and any future placeholder) is suppressed from
// the org-intelligence audit via the hardcoded `EXCLUDED_REPOS` set in
// `artifacts/api-server/src/routes/org-intelligence.ts`. The intended
// re-promotion trigger is "≥3 source files exist in real source dirs on
// the public repo," but that has been a manual check. This probe runs
// against the live GitHub API and surfaces a clear "ready to promote"
// signal so the suppression never silently becomes permanent.
//
// Outputs:
//   - Human-readable summary to stdout.
//   - A JSON line per repo to stderr (machine-parseable).
//   - If running under GitHub Actions: writes a markdown summary to
//     $GITHUB_STEP_SUMMARY and exports `ready_slugs` to $GITHUB_OUTPUT
//     so the workflow can open/update a per-repo tracking issue.
//
// Exit code: 0 on success regardless of promotion verdict. Non-zero only
// if the GitHub API itself is unreachable for every probed repo (i.e.
// the probe itself failed, not a verdict). This is informational tooling,
// not a CI gate.
//
// Token: GH_WORKFLOW_TOKEN (preferred) or GITHUB_TOKEN (Actions default).
// Org: szl-holdings.
//
// MUST stay in sync with `computeShippedSignals` in
// artifacts/api-server/src/routes/org-intelligence.ts — specifically the
// source-extension regex, the real-source-dir regex, and the OPERATIONAL
// threshold (≥3). If those drift, this probe will tell engineers to
// promote a repo the server still classifies as THEATER.

import { appendFileSync } from "node:fs";
import { env, exit, stderr, stdout } from "node:process";

const ORG = "szl-holdings";
const EXCLUDED_REPOS = ["vsp-otel"];
const OPERATIONAL_THRESHOLD = 3;
const SOURCE_EXTS = /\.(ts|tsx|js|mjs|cjs|py|lean|rs|go|java)$/i;
const REAL_SOURCE_DIRS = /^(src\/|runtime\/|agentic\/|packages\/|papers\/|runs\/|Lutar\/|skills\/)/;

const token = env.GH_WORKFLOW_TOKEN || env.GITHUB_TOKEN;
if (!token) {
  stderr.write("ERROR: GH_WORKFLOW_TOKEN or GITHUB_TOKEN must be set\n");
  exit(2);
}

async function ghJson(path) {
  const r = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "szl-excluded-repo-promotion-probe",
      Accept: "application/vnd.github+json",
    },
    signal: AbortSignal.timeout(15_000),
  });
  return { ok: r.ok, status: r.status, body: r.ok ? await r.json() : null };
}

async function probeRepo(slug) {
  const tree = await ghJson(`/repos/${ORG}/${slug}/git/trees/HEAD?recursive=1`);
  if (!tree.ok) {
    return { slug, ok: false, error: `tree_unreachable_http_${tree.status}` };
  }
  const entries = Array.isArray(tree.body?.tree) ? tree.body.tree : [];
  const sourceFiles = entries.filter(
    (t) => t.type === "blob" && SOURCE_EXTS.test(t.path) && REAL_SOURCE_DIRS.test(t.path),
  );
  const ready = sourceFiles.length >= OPERATIONAL_THRESHOLD;
  return {
    slug,
    ok: true,
    ready,
    source_files: sourceFiles.length,
    threshold: OPERATIONAL_THRESHOLD,
    tree_total: entries.length,
    sample_paths: sourceFiles.slice(0, 5).map((s) => s.path),
    url: `https://github.com/${ORG}/${slug}`,
  };
}

const results = await Promise.all(EXCLUDED_REPOS.map(probeRepo));

for (const r of results) stderr.write(JSON.stringify(r) + "\n");

const reachable = results.filter((r) => r.ok);
const unreachable = results.filter((r) => !r.ok);
const ready = reachable.filter((r) => r.ready);

stdout.write(`\nExcluded-Repo Promotion Probe — org=${ORG}\n`);
stdout.write(`Threshold: ≥${OPERATIONAL_THRESHOLD} source files in real source dirs.\n\n`);
for (const r of results) {
  if (!r.ok) {
    stdout.write(`  ${r.slug}: PROBE FAILED (${r.error})\n`);
    continue;
  }
  const tag = r.ready ? "READY TO PROMOTE" : "still suppressed";
  stdout.write(`  ${r.slug}: ${tag} — ${r.source_files} source file(s) of ${r.threshold} required (${r.tree_total} total tree entries)\n`);
  if (r.sample_paths.length > 0) {
    for (const p of r.sample_paths) stdout.write(`      · ${p}\n`);
  }
}
stdout.write(`\nSummary: ${ready.length} ready, ${reachable.length - ready.length} still suppressed, ${unreachable.length} probe failure(s).\n`);

if (env.GITHUB_STEP_SUMMARY) {
  const lines = [];
  lines.push(`# Excluded-Repo Promotion Probe`);
  lines.push("");
  lines.push(`Org: \`${ORG}\` · Threshold: \`≥${OPERATIONAL_THRESHOLD}\` source files in real source dirs.`);
  lines.push("");
  lines.push(`| Repo | Source files | Status |`);
  lines.push(`| --- | --- | --- |`);
  for (const r of results) {
    if (!r.ok) {
      lines.push(`| [${r.slug}](https://github.com/${ORG}/${r.slug}) | — | ⚠️ probe failed: \`${r.error}\` |`);
    } else if (r.ready) {
      lines.push(`| [${r.slug}](${r.url}) | **${r.source_files}** / ${r.threshold} | ✅ **READY TO PROMOTE** — drop from \`EXCLUDED_REPOS\` |`);
    } else {
      lines.push(`| [${r.slug}](${r.url}) | ${r.source_files} / ${r.threshold} | ⏸ still suppressed |`);
    }
  }
  lines.push("");
  lines.push(`Re-promotion path: edit \`EXCLUDED_REPOS\` in \`artifacts/api-server/src/routes/org-intelligence.ts\` and delete the slug.`);
  appendFileSync(env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
}

if (env.GITHUB_OUTPUT) {
  const readySlugs = ready.map((r) => r.slug).join(",");
  appendFileSync(env.GITHUB_OUTPUT, `ready_slugs=${readySlugs}\n`);
  appendFileSync(env.GITHUB_OUTPUT, `ready_count=${ready.length}\n`);
}

if (unreachable.length === results.length) {
  stderr.write("ERROR: every probed repo was unreachable — probe itself failed.\n");
  exit(1);
}
exit(0);
