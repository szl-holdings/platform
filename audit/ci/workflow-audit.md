# CI Workflow Audit

**Date:** 2026-04-27  
**Phase:** Rehaul 9/9 — CI Cleanup & Investor Readiness Closeout  
**Scope:** All 25 workflows under `.github/workflows/`  
**Cross-checked against:** `ls .github/workflows/` output and branch protection settings documented in `RELEASE_NOTES.md` (Task #2825)  
**Auditor:** Task #2944

---

## Audit Summary

| Classification | Count | Workflows |
|---|---|---|
| KEEP — no changes needed | 24 | All except uptime-monitor |
| FIX — corrected in this audit | 1 | `uptime-monitor.yml` |
| MERGE — consolidated | 0 | — |
| DELETE — removed | 0 | — |

**Branch protection required status checks (confirmed from Task #2825):** `CI`, `E2E Gate`, `Lighthouse Gate`, `dependency-review`, `analyze`. These five are blocking gates. All other workflows are advisory or non-blocking even if they fail.

All 25 workflows provide real signal or serve a documented operational purpose. One workflow (`uptime-monitor.yml`) had a critical cost footgun: a `* * * * *` cron schedule (1,440 GitHub Actions runs per day). Fixed to `*/5 * * * *` (288 runs/day, still 12 checks/hour).

---

## Per-Workflow Classification

### 1. `a11y.yml` — Accessibility Checks

| Field | Value |
|---|---|
| **Purpose** | axe-based accessibility audit per artifact surface — WCAG 2.1 AA coverage |
| **Triggers** | `pull_request` → main/master; `push` → main/master; `workflow_dispatch` |
| **Signal Quality** | MEDIUM — advisory only; catches ARIA and alt-text regressions |
| **Required Status** | No — advisory; does not block merge |
| **Action** | KEEP |
| **Notes** | Non-blocking. Valuable signal for enterprise buyers with accessibility requirements. |

---

### 2. `api-spec-drift.yml` — API Spec Drift

| Field | Value |
|---|---|
| **Purpose** | Detects drift between API implementation and the OpenAPI spec |
| **Triggers** | `push` → all branches; `workflow_dispatch` |
| **Signal Quality** | MEDIUM-HIGH — catches contract violations that break downstream clients |
| **Required Status** | No — advisory |
| **Action** | KEEP |
| **Notes** | Broad trigger (all branches) ensures drift is caught early. Scope to main/PR in a future cleanup if it becomes noisy. |

---

### 3. `audit-full.yml` — Runtime Audit Harness

| Field | Value |
|---|---|
| **Purpose** | Runs `pnpm audit:full` — route coverage, mock register, dependency audit, env validation |
| **Triggers** | `pull_request` → main/master; `push` → main/master; `workflow_dispatch` |
| **Signal Quality** | MEDIUM — catches drift in route coverage and mock registers; complements CI |
| **Required Status** | No — advisory |
| **Action** | KEEP |
| **Notes** | Failures are non-blocking but should be investigated. Useful for the investor diligence audit trail. |

---

### 4. `backup.yml` — Database Backup

| Field | Value |
|---|---|
| **Purpose** | Nightly PostgreSQL backup to Azure Blob Storage (primary) + GitHub Actions artifact (fallback, 7-day retention) |
| **Triggers** | `schedule` (02:00 UTC daily); `workflow_dispatch` |
| **Signal Quality** | HIGH — critical operational continuity; job fails if Azure upload fails when secrets are configured |
| **Required Status** | No — scheduled operational job |
| **Action** | KEEP |
| **Notes** | Gracefully degrades to artifact-only mode when Azure secrets not set (safe for forks/preview envs). |

---

### 5. `build.yml` — Build Check

| Field | Value |
|---|---|
| **Purpose** | Full monorepo build verification (all artifacts) |
| **Triggers** | `push` → main/master; `workflow_dispatch` |
| **Signal Quality** | MEDIUM-HIGH — catches build regressions that TypeScript typecheck misses |
| **Required Status** | No — advisory |
| **Action** | KEEP |
| **Notes** | Consider adding `pull_request` trigger in a future pass so build breaks are caught pre-merge, not post-merge. |

---

### 6. `ci.yml` — CI ⭐ Required

| Field | Value |
|---|---|
| **Purpose** | Primary quality gate: lint, TypeScript typecheck, unit tests |
| **Triggers** | `pull_request` → main/master; `workflow_dispatch` |
| **Signal Quality** | HIGH — the single most important workflow |
| **Required Status** | **Yes** — status check name `CI`; registered in branch protection; blocks merge on failure |
| **Action** | KEEP |
| **Notes** | All PRs must pass CI before merge. This is the gating workflow for the entire PR flow. |

---

### 7. `codeql.yml` — CodeQL Analysis ⭐ Required

| Field | Value |
|---|---|
| **Purpose** | Static Application Security Testing (SAST) via GitHub CodeQL semantic analysis |
| **Triggers** | `schedule` (Monday 06:00 UTC); `workflow_dispatch` |
| **Signal Quality** | HIGH — SARIF uploaded to Security tab; catches semantic vulnerabilities |
| **Required Status** | **Yes** — status check name `analyze`; registered in branch protection |
| **Action** | KEEP |
| **Notes** | Pinned full-length SHA (`codeql-action@v3`). Weekly cadence appropriate for prerelease. Runs on schedule, not per-PR — the required status check is evaluated on the scheduled run result. |

---

### 8. `commitlint.yml` — Commitlint

| Field | Value |
|---|---|
| **Purpose** | Enforces conventional commit message format on PRs |
| **Triggers** | `pull_request` → main/master; `workflow_dispatch` |
| **Signal Quality** | MEDIUM — enables auto-release bump detection in `release.yml`; maintains changelog quality |
| **Required Status** | No — advisory; failure is visible but does not block merge |
| **Action** | KEEP |
| **Notes** | Prerequisite for `release.yml` auto-version detection from commit messages. |

---

### 9. `container-publish.yml` — Build and Publish Container Images

| Field | Value |
|---|---|
| **Purpose** | Builds and pushes Docker images to GitHub Container Registry (`ghcr.io/szl-holdings`) on release |
| **Triggers** | `release` (published); `push` → `v*.*.*` tags; `workflow_dispatch` |
| **Signal Quality** | HIGH — real artifact publication; release-only trigger means zero noise on daily development |
| **Required Status** | No — post-release trigger |
| **Action** | KEEP |
| **Notes** | Runs only on real releases. No risk of spurious runs. |

---

### 10. `dependency-review.yml` — Dependency Review ⭐ Required

| Field | Value |
|---|---|
| **Purpose** | Blocks PRs that introduce high/critical vulnerability-scored dependencies or GPL/AGPL licensed packages |
| **Triggers** | `pull_request` → main/master |
| **Signal Quality** | HIGH — required status check; actionable on every dependency bump |
| **Required Status** | **Yes** — status check name `dependency-review`; registered in branch protection; blocks merge on failure |
| **Action** | KEEP |
| **Notes** | Deny-list: GPL-3.0, AGPL-3.0. Fail threshold: `high`. Pinned SHA. |

---

### 11. `deploy-production.yml` — Deploy — Production

| Field | Value |
|---|---|
| **Purpose** | Deploy to the production Replit environment on a published GitHub Release |
| **Triggers** | `release` (published); `workflow_dispatch` (requires `confirm: "deploy"` input) |
| **Signal Quality** | HIGH — the canonical production deployment gate |
| **Required Status** | No — post-release trigger |
| **Action** | KEEP |
| **Notes** | Confirm gate prevents accidental manual deploys. Critical workflow — do not modify triggers without a deployment review. |

---

### 12. `deploy-staging.yml` — Deploy — Staging

| Field | Value |
|---|---|
| **Purpose** | Deploy to the staging environment on every push to main/master |
| **Triggers** | `push` → main/master |
| **Signal Quality** | HIGH — continuous staging deployment provides fast post-merge feedback |
| **Required Status** | No — post-merge trigger |
| **Action** | KEEP |
| **Notes** | Concurrency group cancels in-progress runs on fast-follow pushes. `environment: staging`. |

---

### 13. `e2e.yml` — E2E Tests ⭐ Required

| Field | Value |
|---|---|
| **Purpose** | End-to-end test suite across artifact surfaces |
| **Triggers** | `pull_request` → main/master; `push` → main/master; `workflow_dispatch` |
| **Signal Quality** | MEDIUM-HIGH — catches startup/crash regressions even with minimal test coverage |
| **Required Status** | **Yes** — status check name `E2E Gate`; registered in branch protection; blocks merge on failure |
| **Action** | KEEP |
| **Notes** | Full E2E test authoring is in the backlog. Even minimal stubs catch server startup failures. Full suite authoring tracked in follow-up task #4119. |

---

### 14. `lighthouse.yml` — Lighthouse CI ⭐ Required

| Field | Value |
|---|---|
| **Purpose** | Performance, accessibility, and best-practice scoring per artifact surface via Lighthouse CI |
| **Triggers** | `pull_request` → main/master; `push` → main/master; `workflow_dispatch` |
| **Signal Quality** | MEDIUM-HIGH — required status check; catches performance regressions and a11y score drops |
| **Required Status** | **Yes** — status check name `Lighthouse Gate`; registered in branch protection; blocks merge on failure |
| **Action** | KEEP |
| **Notes** | Thresholds should be tightened post-beta. Current advisory-mode thresholds are appropriate for alpha. |

---

### 15. `nexus-visual-regression.yml` — PRAXIS Visual Regression

| Field | Value |
|---|---|
| **Purpose** | Visual regression snapshot comparison for PRAXIS (mockup-sandbox) design system components |
| **Triggers** | `pull_request` → main/master; `workflow_dispatch` (with baseline update option) |
| **Signal Quality** | MEDIUM — catches design system regressions; manual baseline update flow is correctly gated |
| **Required Status** | No — advisory |
| **Action** | KEEP |
| **Notes** | Filename (`nexus-visual-regression.yml`) predates the NEXUS → PRAXIS product rename; the workflow `name:` field reflects the current name ("PRAXIS Visual Regression"). Cosmetic-only mismatch — update filename in a future housekeeping pass. |

---

### 16. `nightly-smoke.yml` — Nightly Smoke — DOMAINE Diligence Lifecycle

| Field | Value |
|---|---|
| **Purpose** | Nightly smoke test of the DOMAINE (Terra) diligence lifecycle API flow |
| **Triggers** | `schedule` (03:30 UTC daily); `workflow_dispatch` |
| **Signal Quality** | MEDIUM-HIGH — validates the most critical data pipeline nightly against production/staging |
| **Required Status** | No — scheduled |
| **Action** | KEEP |
| **Notes** | Extend to cover SEXTANT and TENAX lifecycle flows in a future sprint. |

---

### 17. `npm-publish.yml` — Publish npm packages

| Field | Value |
|---|---|
| **Purpose** | Publishes internal shared packages to GitHub Packages on release |
| **Triggers** | `release` (published); `push` → `v*.*.*` tags; `workflow_dispatch` |
| **Signal Quality** | HIGH — real package publication for downstream internal consumers |
| **Required Status** | No — post-release trigger |
| **Action** | KEEP |
| **Notes** | Requires `packages: write` permission. Release-only trigger means zero noise on daily development. |

---

### 18. `operational-audit.yml` — Operational Audit

| Field | Value |
|---|---|
| **Purpose** | Manual operational audit: route crawl, stress test, health checks against a specified target URL |
| **Triggers** | `workflow_dispatch` only (requires `target_url` input) |
| **Signal Quality** | MEDIUM — manual-only trigger means zero noise; useful for pre-release ops reviews |
| **Required Status** | No — manual-only |
| **Action** | KEEP |
| **Notes** | Good pre-release diligence tool. Use before investor demos and major releases via `operational-audit.yml` dispatch. |

---

### 19. `readme-qa.yml` — README QA

| Field | Value |
|---|---|
| **Purpose** | Validates README image paths, portfolio table sync with artifact registry, and profile README assets |
| **Triggers** | `pull_request` → main/master (path-scoped: README, docs, assets, workflow files); `push` → main/master (same paths) |
| **Signal Quality** | MEDIUM — path-scoped so it runs only when relevant; catches broken asset references before they ship |
| **Required Status** | No — advisory |
| **Action** | KEEP |
| **Notes** | Excellent scoping discipline — zero noise on code-only PRs. |

---

### 20. `release.yml` — Release

| Field | Value |
|---|---|
| **Purpose** | Automatic version bump detection and GitHub Release creation on push to main/master; manual dispatch with explicit bump type option |
| **Triggers** | `push` → main/master; `workflow_dispatch` (with version_bump choice input) |
| **Signal Quality** | HIGH — the canonical release creation path |
| **Required Status** | No — post-merge trigger |
| **Action** | KEEP |
| **Notes** | Auto-detects bump type from conventional commit messages (major/minor/patch). `pnpm release:alpha` / `scripts/release/alpha.sh` are the pre-release gate; this workflow runs post-merge. |

---

### 21. `secret-scan.yml` — Secret Scan — PR Gate

| Field | Value |
|---|---|
| **Purpose** | Gitleaks scan of the commits introduced by each PR — catches secrets before they reach `main` |
| **Triggers** | `pull_request` → main/master |
| **Signal Quality** | HIGH — the job fails and blocks the PR merge UI when Gitleaks finds a secret |
| **Required Status** | No — not registered as a named required status check in branch protection (confirmed: the 5 required checks are CI, E2E Gate, Lighthouse Gate, dependency-review, analyze). However, a Gitleaks failure causes the job to exit 1, which shows as a failed check on the PR and requires dismissal or fix before merge under the current flow. |
| **Action** | KEEP |
| **Notes** | Consider registering as a required status check in a future branch protection update for stricter enforcement. SARIF uploaded to Security tab. Triage runbook: `ops/github/secret-scanning-runbook.md`. |

---

### 22. `secret-scan-scheduled.yml` — Secret Scan (Scheduled — default branch)

| Field | Value |
|---|---|
| **Purpose** | Daily Gitleaks full-history sweep of the default branch; opens/comments on a GitHub incident issue on positive finding |
| **Triggers** | `schedule` (06:17 UTC daily); `workflow_dispatch`; `push` to workflow file or `.gitleaks.toml` |
| **Signal Quality** | HIGH — catches historical secrets not caught by PR gate or GitHub native pattern-based scanning |
| **Required Status** | No — scheduled |
| **Action** | KEEP |
| **Notes** | Odd-minute schedule (`:17`) reduces GitHub runner contention vs. top-of-hour jobs. Issue lifecycle (open/update/close) is well-implemented. |

---

### 23. `security.yml` — Security Audit & SBOM

| Field | Value |
|---|---|
| **Purpose** | Weekly dependency vulnerability audit (npm audit), SBOM generation, and license report |
| **Triggers** | `schedule` (Monday 03:00 UTC); `workflow_dispatch` |
| **Signal Quality** | HIGH — catches supply-chain CVEs that post-date the last `dependency-review.yml` scan |
| **Required Status** | No — scheduled |
| **Action** | KEEP |
| **Notes** | Complements `dependency-review.yml` (which only checks additions in a given PR). Weekly cadence appropriate. |

---

### 24. `uptime-monitor.yml` — Uptime Monitor ⚠️ FIXED

| Field | Value |
|---|---|
| **Purpose** | Polls `/api/health/live` endpoint every N minutes; opens/closes GitHub incident issues and sends Slack alerts on status change |
| **Triggers** | `schedule` **WAS:** `* * * * *` (every 1 minute = 1,440 runs/day) → **FIXED:** `*/5 * * * *` (every 5 minutes = 288 runs/day); `workflow_dispatch` |
| **Signal Quality** | HIGH — genuine uptime monitoring with automated incident issue lifecycle and Slack alerting |
| **Required Status** | No — scheduled operational job |
| **Action** | **FIX** — cron corrected in this audit |
| **Notes** | The every-minute schedule was consuming ~1,440 GitHub Actions runs/day — 5× more than needed with zero SLA benefit (12 checks/hour = 5-min detection lag is well within any reasonable SLA). Alert implementation (Slack webhook + issue open/update/close lifecycle) is well-designed and correct. No other changes. |

---

### 25. `verify-source-of-truth.yml` — Verify Source-of-Truth Metrics

| Field | Value |
|---|---|
| **Purpose** | Detects metric drift between `audit/source-of-truth.json` (investor-facing claim file) and the actual codebase counts |
| **Triggers** | `pull_request` → main/master (path-scoped: source-of-truth.json, verify.sh, api routes, packages, lib, screenshots); `push` → main/master; `workflow_dispatch` |
| **Signal Quality** | MEDIUM — prevents stale investor claim files from diverging from reality |
| **Required Status** | No — advisory |
| **Action** | KEEP |
| **Notes** | Critical for investor diligence claim accuracy. Must be run after any large route refactor or package restructure. |

---

## Branch Protection — Required Status Checks

The following five status checks are registered as **required** in branch protection on `main`/`master`. Confirmed from Task #2825 audit.

| Status Check Name | Workflow File | Blocks Merge |
|---|---|---|
| `CI` | `ci.yml` | Yes |
| `E2E Gate` | `e2e.yml` | Yes |
| `Lighthouse Gate` | `lighthouse.yml` | Yes |
| `dependency-review` | `dependency-review.yml` | Yes |
| `analyze` | `codeql.yml` | Yes |
| Code-owner review | CODEOWNERS | Yes — 1 approval minimum |

All other workflows are advisory or operational — they may fail and show as failed checks on a PR, but they do not prevent merge by branch protection policy. Consider registering `secret-scan.yml` as a required status check in a future branch protection update.

---

## Naming & Trigger Standardization

All 25 workflows use consistent conventions:
- `name:` is human-readable and consistent with filename
- `concurrency:` groups present on all PR/push workflows to prevent redundant parallel runs (`uptime-monitor` correctly sets `cancel-in-progress: false` to preserve the alert-on-recovery path)
- Permissions follow least-privilege (`contents: read` default; elevated only where required and documented)
- All third-party actions use pinned full-length SHAs where security-sensitive

**One cosmetic inconsistency noted:** `nexus-visual-regression.yml` filename predates the NEXUS → PRAXIS product rename. The `name:` field already says "PRAXIS Visual Regression". Filename update deferred to a future housekeeping pass — no functional impact.

---

## Workflow File Inventory (Verified 2026-04-27)

Verified against `ls .github/workflows/` output:

```
a11y.yml                    dependency-review.yml       readme-qa.yml
api-spec-drift.yml          deploy-production.yml       release.yml
audit-full.yml              deploy-staging.yml          secret-scan-scheduled.yml
backup.yml                  e2e.yml                     secret-scan.yml
build.yml                   lighthouse.yml              security.yml
ci.yml                      nexus-visual-regression.yml uptime-monitor.yml
codeql.yml                  nightly-smoke.yml           verify-source-of-truth.yml
commitlint.yml              npm-publish.yml
container-publish.yml       operational-audit.yml
```

Total: 25 files. All 25 classified above. ✅

---

## Previously Deleted Workflows (Reference — Task #2825)

| Workflow | Reason for Removal |
|---|---|
| `shared-proxy` | Port 9090 conflict; replaced by per-artifact port assignments |
| `lyte-metrics-store: service` | Stale; product renamed KORA; metrics moved to API server |
| `lyte-metrics-store-test` | Corresponding test for deleted service |
| `api-test` | Misconfigured; integration tests moved to `audit-full.yml` + CI |

---

*Audit complete as of 2026-04-27. 24 workflows retained unchanged, 1 fixed (uptime-monitor cron). No workflows deleted in this phase.*
