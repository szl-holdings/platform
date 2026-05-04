# CI Security Review — Series-A Reset (Phase 9)

**Date:** 2026-04-20
**Scope:** All GitHub Actions workflows in `.github/workflows/`
**Reviewer:** growth capital Hardening — Phase 9 Security Hardening & Sign-On Consolidation
**Methodology:** Static review of workflow YAML files, job configurations, permission grants, secret handling, and action pinning.

---

## 1. Workflow Inventory

| File | Trigger | Gate? | Purpose |
|------|---------|-------|---------|
| `ci.yml` | push/PR to main | Yes — `ci-gate` job | Lint, typecheck, test, build, integration tests, docs claims, secret scan, readiness gate, proof-chain, route security matrix |
| `security.yml` | push/PR/weekly/manual | Yes — `security-gate` | Dependency scan + SBOM, Gitleaks secret scan, lockfile integrity, license compliance |
| `secret-scan-scheduled.yml` | Daily (06:17 UTC)/manual | Yes | Full-history Gitleaks scan of `main`, SARIF upload, auto-opens triage issue |
| `codeql.yml` | push/PR/weekly | Yes | GitHub CodeQL static analysis (JavaScript/TypeScript) |
| `build.yml` | push/PR | Advisory | Turbo-orchestrated full build |
| `e2e.yml` | push/PR | Advisory | Playwright end-to-end tests |
| `deploy-production.yml` | Manual / tag | Production gate | Deploy to production environment |
| `deploy-staging.yml` | push to main | Staging gate | Deploy to staging environment |
| `dependency-review.yml` | PR only | Yes | GitHub Dependency Review (new vulnerable packages) |
| `prism-counsel-ci.yml` | push/PR | Advisory | Domain-specific CI for Counsel artifact |
| `lighthouse.yml` | push/PR | Advisory | Performance audits |
| `readme-qa.yml` | push/PR | Advisory | README quality checks |
| `backup.yml` | Scheduled | No | Database backup |
| `container-publish.yml` | Tag push | No | Container image publishing |
| `release.yml` | Manual | No | Release management |
| `npm-publish.yml` | Tag push | No | NPM package publishing |
| `uptime-monitor.yml` | Scheduled | No | Uptime checks |

---

## 2. CI Gate Analysis

### Primary CI Gate (`ci.yml` → `ci-gate`)

The `ci-gate` job requires **all** of the following to succeed before a PR can merge:

| Job | What It Checks |
|-----|---------------|
| `lint` | ESLint / code style across all packages |
| `typecheck` | TypeScript type safety (`pnpm typecheck`) |
| `test` | Unit and fast integration tests (`pnpm test`) |
| `build` | Full monorepo build including `command`, `aegis`, `pulse` artifacts |
| `integration-test` | Database-backed integration tests (Postgres 16 service container) |
| `docs-claims-check` | Documented claims (roles, CSRF, routes, files, tables) match code |
| `secret-scan` | Gitleaks PR-diff scan (blocks on any detected credential) |
| `readiness-gate` | Smoke tests against a live API server in CI |
| `proof-chain-checks` | Policy engine, action engine, trace graph, connectors, telemetry unit tests |
| `route-security-matrix` | Every API route is auth-classified — no route may be `UNCLASSIFIED` |

**Verdict: Strong.** Ten independent quality gates must pass in parallel before merge. The route-security-matrix gate and docs-claims-check are particularly notable — they prevent security regressions in route protection from slipping through undetected.

### Security Gate (`security.yml` → `security-gate`)

Runs on push/PR and weekly. All four jobs must pass:

| Job | What It Checks |
|-----|---------------|
| `dependency-scan` | `pnpm audit` + SBOM generation; fails on known high/critical CVEs |
| `secret-scan` | Gitleaks + internal `scan-secrets.js` belt-and-suspenders |
| `lockfile-integrity` | `pnpm install --frozen-lockfile --dry-run` — detects uncommitted lockfile drift |
| `license-report` | License compliance; generates a machine-readable report |

---

## 3. Action Pinning Assessment

All actions in the reviewed workflows are pinned to **full commit SHAs**, not mutable tags. This is the correct approach — it prevents supply-chain attacks via tag moving.

**Sample verified pins:**

| Action | Tag | Pinned SHA |
|--------|-----|-----------|
| `actions/checkout` | v4.2.2 | `11bd71901bbe5b1630ceea73d27597364c9af683` |
| `pnpm/action-setup` | v4.0.0 | `fe52bf0ad0164d2310b5e4d5d7bfec47b67e3f9d` |
| `actions/setup-node` | v4.4.0 | `49933ea5288caeca8642d1e84afbd3f7d6820020` |
| `actions/upload-artifact` | v4.6.2 | `ea165f8d65b6e75b540449e92b4886f43607fa02` |
| `github/codeql-action/init` | v3.35.2 | `ce64ddcb0d8d890d2df4a9d1c04ff297367dea2a` |
| `github/codeql-action/upload-sarif` | v3.28.13 | `1b549b9259bda1cb5ddde3b41741a82a2d15a841` |
| `actions/github-script` | v7.0.1 | `60a0d83039c74a4aee543508d2ffcb1c3799cdea` |

**Verdict: Correct.** All critical actions are SHA-pinned.

---

## 4. Permission Grants

### Principle of Least Privilege

The workflows use granular permission grants:

- **Top-level `permissions: {}`** in `codeql.yml` sets the default to none; each job overrides only what it needs.
- Most jobs request `contents: read` only.
- SARIF upload jobs additionally request `security-events: write`.
- Issue-creation jobs additionally request `issues: write`.
- No workflow requests `contents: write` during normal CI (only in release/publish workflows, which are manual-trigger only).

**Verdict: Correct.** Jobs do not over-request permissions.

### Secret Usage

- `INTEGRATION_TEST_TOKEN` is passed via `${{ secrets.INTEGRATION_TEST_TOKEN }}` to the integration test job only.
- No workflow inlines secrets as environment variables available to all steps.
- Build and test jobs that do not require secrets receive no secret injection.
- The CI Postgres service container uses a hardcoded test password (`postgres`) which is appropriate — it is a transient, isolated container accessible only within the workflow runner.

---

## 5. Secret Scanning in CI

Three complementary layers:

1. **Gitleaks PR-diff scan** (in `ci.yml` and `security.yml`): scans the commits of every PR using `.gitleaks.toml` config. Blocks merge on any finding.
2. **Gitleaks full-history scheduled scan** (`secret-scan-scheduled.yml`): runs daily against all of `main`'s history. Uploads SARIF to GitHub Security tab and auto-opens a triage issue if anything is found.
3. **Internal belt-and-suspenders scan** (`scripts/qa/scan-secrets.js`): project-specific regex patterns; runs in both `security.yml` and `ci.yml` as a secondary check.

**Verdict: Strong multi-layer posture.** PR-time detection prevents new leaks; scheduled scans catch anything that might slip through; SARIF upload enables centralized alerting via the Security tab.

---

## 6. Dependency Audit

- `pnpm audit` runs in `security.yml` on every push/PR/weekly.
- `dependency-review.yml` uses GitHub Dependency Review to block PRs that introduce new packages with known vulnerabilities.
- License report generated per run and archived as a workflow artifact (90-day retention).
- SBOM generated in CycloneDX format (`security/sbom-latest.json`) and archived.

---

## 7. CodeQL Static Analysis

- Runs on push, PR, and weekly.
- Language: `javascript-typescript`.
- Uses `autobuild` to handle monorepo build.
- Results uploaded to GitHub's Security tab (Code scanning alerts).
- `concurrency` group configured to cancel redundant runs.

---

## 8. Integration Test Database

The integration tests and readiness gate both use an **ephemeral Postgres 16-alpine service container** with:

- Isolated database (`szl_test`, not the production database).
- Fixed test credentials (`postgres:postgres`) — acceptable in an isolated runner context.
- Health check configured so the container is ready before tests start.
- `DATABASE_URL` injected only into jobs that need it.

---

## 9. Identified Gaps and Recommendations

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| CI-01 | Low | `docs-sync-check` job runs with `continue-on-error: true` (advisory only). If doc drift becomes a compliance risk, promote this to blocking. | Open — advisory by design |
| CI-02 | Low | `e2e.yml` Playwright tests are advisory (separate workflow, not included in `ci-gate`). Consider promoting to required once flakiness is managed. | Open |
| CI-03 | Low | `lighthouse.yml` and `readme-qa.yml` are advisory. No action required unless regulatory baseline requires them to be blocking. | Open — advisory by design |
| CI-04 | Informational | The `ci.yml` readiness-gate uses `SESSION_SECRET: ci-test-session-secret-not-for-production` as an explicit, clearly-labeled non-production value. Correct. | Resolved |
| CI-05 | Informational | Gitleaks version is pinned to `8.21.2` and downloaded via direct GitHub release URL with SHA-pinned workflow action. Consider adding a checksum verification step for the binary. | Open — low risk |
| CI-06 | Resolved | `backup.yml`, `uptime-monitor.yml`, and `container-publish.yml` all have explicit `permissions` blocks: `backup.yml` → `contents: read`; `uptime-monitor.yml` → `contents: read, issues: write`; `container-publish.yml` (job-level) → `contents: read, packages: write`. All auxiliary workflows follow least-privilege. | Resolved |

---

## 10. Summary

| Category | Verdict |
|----------|---------|
| Action pinning | Strong — all actions SHA-pinned |
| Least-privilege permissions | Good — job-level scoping, mostly read-only |
| Secret handling | Good — secrets injected minimally, not broadcast to all steps |
| Secret scanning coverage | Strong — PR diff + scheduled full-history + internal regex |
| Dependency auditing | Good — `pnpm audit` + GitHub Dependency Review + SBOM |
| Static analysis (CodeQL) | Present — JavaScript/TypeScript, PR + weekly |
| Gate strength | Strong — 10-job CI gate; no merge without all checks passing |
| Route auth enforcement | Strong — `route-security-matrix` blocks any unclassified route |

**Overall CI Security Posture: GOOD — meets Series-A production bar.**

The two open items (CI-01, CI-02) are advisory-only gaps with no immediate security impact. CI-06 was resolved upon verification — all auxiliary workflows already have explicit permissions blocks.
