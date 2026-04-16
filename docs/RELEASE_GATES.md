# Release Gates — SZL Holdings Platform

**Version:** 1.0  
**Date:** April 16, 2026  
**Authority:** Stephen Lutar, Founder

This document defines the minimum set of gates that must pass before a release can proceed to production. It is the canonical reference for "what does done look like for a release."

---

## Gate Tiers

| Tier | Description | Blocking? |
|------|-------------|----------|
| **REQUIRED** | Must pass. PR/merge blocked if any required gate fails. | ✅ Yes — blocks merge |
| **ADVISORY** | Should pass. Failures are visible and triaged but do not block merge. | ❌ No — informational |
| **MANUAL** | Human-in-the-loop approval required for production deploy. | ✅ Yes — blocks prod deploy |

---

## Required Gates (CI — `ci.yml`)

These four checks constitute the primary CI gate. All must pass before a PR can be merged.

### G-01: Lint

| Field | Value |
|-------|-------|
| **Check** | `pnpm run lint` |
| **Tool** | ESLint |
| **Scope** | All packages in the monorepo |
| **Failure means** | Merge blocked |
| **Pass criteria** | Zero ESLint errors (warnings allowed at team discretion) |

### G-02: Typecheck

| Field | Value |
|-------|-------|
| **Check** | `pnpm run typecheck` |
| **Tool** | TypeScript compiler (`tsc --noEmit`) |
| **Scope** | All packages |
| **Failure means** | Merge blocked |
| **Pass criteria** | Zero TypeScript errors |

### G-03: Test

| Field | Value |
|-------|-------|
| **Check** | `pnpm run test` |
| **Tool** | Vitest (`vitest.config.ts`) |
| **Scope** | Unit tests + component tests |
| **Failure means** | Merge blocked |
| **Pass criteria** | All tests pass; coverage report uploaded |
| **Excludes** | Integration tests (separate gate — see below) |

### G-04: Build

| Field | Value |
|-------|-------|
| **Check** | `pnpm -r --if-present run build` |
| **Tool** | Vite / tsc per package |
| **Scope** | All buildable artifacts in the monorepo |
| **Failure means** | Merge blocked |
| **Pass criteria** | Zero build errors across all packages |

---

### G-05: Integration Tests

| Field | Value |
|-------|-------|
| **Check** | `pnpm test:integration` |
| **Tool** | Vitest (`vitest.integration.config.ts`) |
| **Scope** | All 11 integration test files: cross-app smoke, OpenAPI contract, DB integration, GraphQL schema, live server, stress, websocket, auth, health, integrations, cortex-inca |
| **Failure means** | Merge blocked |
| **Pass criteria** | All integration tests pass; Postgres 16 service container provided in CI |
| **Added** | April 16, 2026 |

---

## Required Gates (Security — `security.yml`)

### G-06: Dependency Vulnerability Scan + SBOM

| Field | Value |
|-------|-------|
| **Check** | `node scripts/qa/generate-sbom.js` |
| **Tool** | npm advisory API |
| **Scope** | All packages in `pnpm-lock.yaml` |
| **Failure means** | Merge blocked |
| **Pass criteria** | No high or critical severity CVEs; SBOM artifact generated |
| **Exception process** | Document in `docs/audit/security-remediation-log.md`; requires founder approval |

### G-07: Secret Surface Scan

| Field | Value |
|-------|-------|
| **Check** | `node scripts/qa/scan-secrets.js .` |
| **Tool** | Custom scanner (`scripts/qa/scan-secrets.js`) |
| **Scope** | All tracked source files — checks for API keys, tokens, PEM keys, committed .env files, and database dumps |
| **Failure means** | Merge blocked |
| **Pass criteria** | Zero detected secrets; exit code 0 |
| **Added** | April 16, 2026 |

### G-08: Lockfile Integrity

| Field | Value |
|-------|-------|
| **Check** | `pnpm install --frozen-lockfile --dry-run` |
| **Tool** | pnpm |
| **Failure means** | Merge blocked |
| **Pass criteria** | Lockfile consistent with `package.json` files |

---

## Advisory Gates

These gates run on every PR and push but do not block merge. Failures are reviewed and triaged — they become blockers for the next release if not resolved.

### A-01: E2E Tests + a11y Checks (`e2e.yml`)

| Field | Value |
|-------|-------|
| **Check** | Playwright E2E across all apps + axe-core WCAG 2.0/2.1 a11y scan on SZL Holdings public routes |
| **Tool** | Playwright + `@axe-core/playwright` |
| **Advisory reason** | E2E tests can be environment-sensitive; transient failures should not block development velocity |
| **Escalation trigger** | More than 2 consecutive failures on the same spec → investigate and fix; any critical a11y violation → fix before customer-facing release |
| **Traces retained** | ✅ On failure — `playwright-traces-*` artifact; `playwright-report-a11y` artifact on every run |
| **Added** | a11y check added April 16, 2026 |

### A-02: Lighthouse Audit (`lighthouse.yml`)

| Field | Value |
|-------|-------|
| **Check** | Lighthouse CI on szl-holdings, lyte-command-center, firestorm, stephen-site |
| **Thresholds** | Performance > 80, Accessibility > 90, Best Practices > 90, SEO > 90 |
| **Advisory reason** | Score regressions are visible and reviewed; score fluctuations are acceptable in development |
| **Escalation trigger** | Accessibility drops below 85 on any public app → fix before release |

### A-03: CodeQL Static Analysis (`codeql.yml`)

| Field | Value |
|-------|-------|
| **Check** | GitHub CodeQL for JavaScript/TypeScript |
| **Advisory reason** | CodeQL findings are reviewed manually; not all findings are actionable immediately |
| **Escalation trigger** | Critical severity CodeQL finding → must be resolved before production deploy |

### A-04: Dependency Review (`dependency-review.yml`)

| Field | Value |
|-------|-------|
| **Check** | New dependency vulnerability and license check on PRs |
| **Blocking scope** | Fails on `high`-severity new dependencies; blocks `GPL-3.0` or `AGPL-3.0` licenses |
| **Note** | This check IS blocking for new dependency introductions via PR — it only runs on PRs, not pushes |

---

## Manual Gates (Production Deployment)

The following manual steps are required before any production deployment.

### M-01: Go/No-Go Sign-off

| Field | Value |
|-------|-------|
| **Owner** | Stephen Lutar (Founder) |
| **Checklist** | `elite-layer/release-governance/go-no-go-criteria.md` |
| **Required** | ✅ Yes — no production deploy without explicit approval |

### M-02: Release Checklist Complete

| Field | Value |
|-------|-------|
| **Owner** | Platform Engineering |
| **Checklist** | `elite-layer/release-governance/release-checklist.md` |
| **Required** | ✅ Yes |

### M-03: Smoke Test on Staging

| Field | Value |
|-------|-------|
| **Owner** | Platform Engineering |
| **Action** | Run `node scripts/qa/smoke-routes.js --strict` against staging URL |
| **Required** | ✅ Yes |
| **Pass criteria** | All public routes return 2xx/3xx; health endpoints return `200` |

### M-04: Health Check Validation

| Field | Value |
|-------|-------|
| **Owner** | Platform Engineering |
| **Action** | `node scripts/qa/health-check.js --strict` against staging/production |
| **Required** | ✅ Yes |
| **Pass criteria** | `/api/health` returns `200` with all services healthy |

---

## Gate Summary Matrix

| Gate | Tier | Workflow | Blocks Merge? | Blocks Prod Deploy? |
|------|------|---------|--------------|---------------------|
| G-01: Lint | REQUIRED | ci.yml | ✅ Yes | ✅ Implied |
| G-02: Typecheck | REQUIRED | ci.yml | ✅ Yes | ✅ Implied |
| G-03: Unit Tests | REQUIRED | ci.yml | ✅ Yes | ✅ Implied |
| G-04: Build | REQUIRED | ci.yml | ✅ Yes | ✅ Implied |
| G-05: Integration Tests | REQUIRED | ci.yml | ✅ Yes | ✅ Implied |
| G-06: Dep Scan + SBOM | REQUIRED | security.yml | ✅ Yes | ✅ Implied |
| G-07: Secret Surface Scan | REQUIRED | security.yml | ✅ Yes | ✅ Implied |
| G-08: Lockfile Integrity | REQUIRED | security.yml | ✅ Yes | ✅ Implied |
| A-01: E2E Tests + a11y | ADVISORY | e2e.yml | ❌ No | ⚠️ Triaged |
| A-02: Lighthouse | ADVISORY | lighthouse.yml | ❌ No | ⚠️ Triaged |
| A-03: CodeQL | ADVISORY | codeql.yml | ❌ No | ⚠️ Triaged |
| A-04: Dependency Review | ADVISORY (PR only) | dependency-review.yml | ⚠️ New deps only | ⚠️ Triaged |
| M-01: Go/No-Go | MANUAL | n/a | n/a | ✅ Yes |
| M-02: Release Checklist | MANUAL | n/a | n/a | ✅ Yes |
| M-03: Staging Smoke Test | MANUAL | n/a | n/a | ✅ Yes |
| M-04: Health Check | MANUAL | n/a | n/a | ✅ Yes |

---

## Escalation Paths

| Situation | Action |
|-----------|--------|
| Required gate fails on main | Do not proceed with release; fix the failure |
| Advisory gate fails repeatedly (3+ times same spec) | Escalate to required; fix before next release |
| CodeQL critical finding | Treat as required; fix before production deploy |
| Accessibility drops below 85 | Treat as required for any customer-facing release |
| High/critical CVE in dependency | Immediate remediation or documented exception |
| Production health check fails | Rollback immediately; do not proceed |

---

## Relationship to Other Documents

| Document | Relationship |
|----------|-------------|
| `docs/SECURITY_BASELINE.md` | Security requirements that gates enforce |
| `docs/SMOKE_TEST_MATRIX.md` | What M-03 smoke tests cover |
| `elite-layer/release-governance/go-no-go-criteria.md` | M-01 criteria detail |
| `elite-layer/release-governance/release-checklist.md` | M-02 checklist detail |
| `docs/audit/security-remediation-log.md` | Exception process for G-05 |

---

*Version 1.0 — April 16, 2026. Review and update before each major release milestone.*
