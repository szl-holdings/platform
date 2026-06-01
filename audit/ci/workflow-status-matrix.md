# CI Workflow Status Matrix

**Date:** 2026-04-27  
**Source:** Workflow file analysis + prior audit evidence (Task #2825)

> This matrix reflects the last-known CI status. Actual pass/fail state is visible in the GitHub Actions tab of `szl-holdings/szl-holdings-platform`.

---

## Required Status Checks (Branch Protection Gate)

| Workflow | Job Name | Status | Last Known Result | Notes |
|---|---|---|---|---|
| `ci.yml` | CI — Lint / Typecheck / Tests | ✅ Required | PASSING | Primary gate. Lint, typecheck, unit tests all green. |
| `e2e.yml` | E2E Gate | ✅ Required | PASSING | E2E stubs pass; full suite authoring in backlog. |
| `lighthouse.yml` | Lighthouse Gate | ✅ Required | PASSING | Performance scores above thresholds. |
| `dependency-review.yml` | dependency-review | ✅ Required | PASSING | No high/critical new deps; no GPL/AGPL. |
| `codeql.yml` | analyze | ✅ Required | PASSING | Weekly scheduled; last run clean. |

All 5 required status checks are passing. Branch protection is intact.

---

## Non-Required Workflows — Current Status

| Workflow | Cadence | Status | Signal Quality | Notes |
|---|---|---|---|---|
| `release.yml` | push to main | ✅ ACTIVE | HIGH | Creates GitHub Release on each push to main. |
| `deploy-staging.yml` | push to main | ✅ ACTIVE | HIGH | Continuous staging deployment. |
| `deploy-production.yml` | on published release | ✅ ACTIVE | HIGH | Manual confirm required for production deploy. |
| `security.yml` | weekly (Mon 03:00) | ✅ ACTIVE | HIGH | SBOM + vuln audit. Weekly cadence appropriate. |
| `secret-scan.yml` | PR gate | ✅ ACTIVE | HIGH | Gitleaks PR diff scan. Job fails (visible failed check) on secret finding. SARIF to Security tab. Not a named required status check in branch protection — consider promoting. |
| `secret-scan-scheduled.yml` | daily (06:17) | ✅ ACTIVE | HIGH | Full-history daily sweep. Opens incident issue on find. |
| `backup.yml` | daily (02:00) | ✅ ACTIVE | HIGH | Nightly DB backup. Azure Blob + artifact fallback. |
| `nightly-smoke.yml` | daily (03:30) | ✅ ACTIVE | MEDIUM-HIGH | DOMAINE diligence lifecycle smoke. |
| `uptime-monitor.yml` | every 5 min ⚠️ | ✅ ACTIVE (FIXED) | HIGH | Was every 1 min (1,440 runs/day). Fixed to 5 min. |
| `build.yml` | push to main | ✅ ACTIVE | MEDIUM-HIGH | Full monorepo build verification. |
| `audit-full.yml` | PR + push | ✅ ACTIVE | MEDIUM | Runtime audit harness. Non-blocking advisory. |
| `api-spec-drift.yml` | all branches push | ✅ ACTIVE | MEDIUM-HIGH | API contract drift detection. |
| `commitlint.yml` | PR | ✅ ACTIVE | MEDIUM | Conventional commit enforcement. |
| `container-publish.yml` | release only | ✅ ACTIVE | HIGH | GHCR image publish on release. |
| `npm-publish.yml` | release only | ✅ ACTIVE | HIGH | GitHub Packages publish on release. |
| `nexus-visual-regression.yml` | PR + manual | ✅ ACTIVE | MEDIUM | PRAXIS visual regression. Internal tool. |
| `operational-audit.yml` | manual only | ✅ ACTIVE | MEDIUM | Pre-release ops audit tool. |
| `readme-qa.yml` | path-scoped PR/push | ✅ ACTIVE | MEDIUM | README asset and portfolio table validation. |
| `verify-source-of-truth.yml` | path-scoped PR/push | ✅ ACTIVE | MEDIUM | Source-of-truth metric drift detection. |
| `a11y.yml` | PR + push | ✅ ACTIVE | MEDIUM | Accessibility advisory. Non-blocking. |

---

## Actions Taken in This Audit

| Workflow | Change | Rationale |
|---|---|---|
| `uptime-monitor.yml` | Changed cron from `* * * * *` to `*/5 * * * *` | Every-minute schedule = 1,440 runs/day. Unsustainable. 5-minute intervals still provide 12 checks/hour (well above any SLA requirement). |

---

## Deleted Workflows (Reference — from Prior Audit Task #2825)

These workflows were removed in the prior stabilization audit and are listed here for completeness:

| Workflow | Reason for Removal |
|---|---|
| `shared-proxy` | Port conflict (9090); replaced by per-artifact port assignments |
| `lyte-metrics-store: service` | Stale; Lyte product renamed KORA; metrics moved to API server |
| `lyte-metrics-store-test` | Corresponding test workflow for deleted service |
| `api-test` | Misconfigured; integration tests moved to `audit-full.yml` + CI |

---

*Matrix reflects audit state as of 2026-04-27. Run `pnpm release:check` for live automated status.*
