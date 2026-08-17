# Runtime Audit Harness

## Overview

The runtime audit harness provides a single command that runs the workspace's
P0 and P1 quality checks, captures evidence, and produces a human-readable
summary report. Its hosted workflow is fail-closed for P0 failures, but it is
not currently a required branch-protection status check.

## Quick start

```bash
# Full pipeline (includes install + all checks)
pnpm audit:full

# Fast local iteration (skip install + E2E)
pnpm audit:full:fast

# CI mode — skips install + E2E; exits 1 on P0 and records P1 as advisory
pnpm audit:full:ci
```

## What runs

| Priority | Step | Description |
|----------|------|-------------|
| P0 | install | `pnpm install --frozen-lockfile` |
| P0 | typecheck | TypeScript compilation across all packages |
| P0 | lint | Biome lint across the full workspace |
| P0 | test | Unit + proof-chain tests |
| P0 | build | Full recursive build of all artifacts |
| P0 | audit:routes | Route registry completeness and classification |
| P0 | qa:site | Public routes + links + trust pages + meta + empty-states |
| P0 | smoke:product-mode | Runtime identity, readiness, API-key rejection, and tenant-scoped read |
| P1 | audit:mocks | Detect real API calls leaking through mock boundaries |
| P1 | audit:copy | UI copy consistency (no placeholder text) |
| P1 | audit:deps | Dependency health (missing/circular/unused) |
| P1 | audit:design-system | Component token compliance |
| P1 | audit:broken-links | Internal hyperlink integrity |
| P1 | qa:a11y | Accessibility audit (axe-core) |
| P1 | brand:check | Brand token and copy compliance |
| P1 | docs:claims-check | Documented claims vs. codebase reality |
| P1 | e2e | Playwright end-to-end tests (skipped with `--skip-e2e`) |

**P0 failures are harness-blocking.** A failure in any P0 step aborts the
pipeline immediately, exits with code 1, and fails the hosted Runtime Audit
job. P1 failures are always recorded as advisory warnings and never affect the
exit code — they appear in the summary report so they can be tracked and
resolved over time.

## Evidence

Every run writes structured evidence under:

```
artifacts/audit/evidence/
  <YYYY-MM-DD_HH-MM-SS>/
    index.json          ← machine-readable summary
    summary.md          ← human-readable summary
    <step-id>/
      stdout.txt
      stderr.txt
      result.json
  latest/
    index.json          ← points to the most recent run
    summary.md          ← copy of the latest summary (stable path)
```

The `latest/summary.md` file is the canonical place to check results. It lists
per-step boot status, pass/fail, and duration. A founder or investor can scan
it in under 60 seconds.

## CI integration

The harness runs in the `Runtime Audit (audit:full)` job of the
`Runtime Audit Harness` workflow (`.github/workflows/audit-full.yml`) on pull
requests and pushes to `master`/`main` (pushes changing only
`replit-sync/**` are ignored), and by manual dispatch. The job:

1. Installs dependencies.
2. Builds the workspace artifacts and boots the local product/runtime targets.
3. Runs `pnpm audit:full:ci` (the harness marks install and E2E skipped; exits 1
   on P0 failure only).
4. Uploads the entire `artifacts/audit/evidence/` tree as a GitHub Actions
   artifact named `audit-evidence-<run-id>`, retained for 30 days.
5. Prints the `latest/summary.md` to the job log regardless of pass/fail.

P0 failures cause the job to exit non-zero. P1 failures remain advisory and
appear in the summary report. Under the current live branch-protection rules,
Runtime Audit is hosted evidence but is not a required status context, so its
failure does not mechanically prevent a merge. The existing jobs in `ci.yml`
remain unchanged; this workflow is an additive, standalone check.

## Interpreting the summary

```
## Step Results

| Priority | Step                  | Status    | Duration |
|----------|-----------------------|-----------|----------|
| P0       | Typecheck             | ✅ pass   | 12.3s    |
| P1       | Audit: mocks          | ❌ fail   | 1.8s     |
```

- **✅ pass** — step exited 0.
- **❌ fail** — step exited non-zero. Truncated stderr is printed in the
  `## P0 Failures` / `## P1 Failures` sections below the table.
- **⏭ skipped** — step was excluded via a CLI flag.

To drill into a failure: open the evidence directory for that step and read
`stderr.txt` in full, or download the GitHub Actions artifact.

## Adding a new step

1. Open `scripts/audit-full.js`.
2. Add an entry to the `STEPS` array with `id`, `label`, `cmd`, and
   `priority` (`"P0"` or `"P1"`).
3. That is all — evidence capture and summary generation are automatic.

## Flags

| Flag | Effect |
|------|--------|
| `--skip-install` | Skip the `pnpm install` step (use when deps are already installed) |
| `--skip-e2e` | Skip the Playwright E2E step |
| `--json` | Suppress prose output; write a single JSON object to stdout |
