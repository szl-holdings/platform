# Canonical Testing Matrix — SZL Holdings Platform

**Version:** 1.0
**Date:** April 16, 2026
**Maintained by:** Engineering / QA

This document is the authoritative mapping of every test type, coverage area, and explicit exclusions across the platform. It supersedes any conflicting statements in other docs.

---

## Testing Stack

| Layer | Framework | Config |
|-------|-----------|--------|
| Unit / API integration | Vitest | `vitest.config.ts` |
| Component (React) | Vitest + happy-dom | `vitest.components.config.ts` |
| Integration (DB-live) | Vitest | `vitest.integration.config.ts` |
| End-to-end | Playwright | `playwright.config.ts` |
| Route smoke (CI-free) | Node.js scripts | `scripts/qa/smoke-routes.js` |
| Product-mode smoke | Node.js script | `scripts/qa/smoke-product-mode.js` |
| Accessibility | axe-core via Playwright | `tests/e2e/a11y.spec.ts` |
| Security audit | SBOM + npm audit | `scripts/qa/generate-sbom.js` |

---

## 1. Unit Tests (`tests/unit/`)

Run via: `pnpm test:api`

| Test File | Coverage Area | Type | Notes |
|-----------|--------------|------|-------|
| `tests/unit/api-version/api-version.test.ts` | API version header format | Unit | Pure function |
| `tests/unit/config/index.test.ts` | Config module — env var parsing, defaults | Unit | Pure function |
| `tests/unit/observability/telemetry.test.ts` | Telemetry event shape, tagging, enrichment | Unit | Mocks telemetry sinks |

---

## 2. API / Integration Tests (`tests/api/`)

Run via: `pnpm test:api` (subset) and `pnpm test:integration` (DB-live subset)

| Test File | Coverage Area | Type | Requires DB | CI Mode |
|-----------|--------------|------|------------|---------|
| `tests/api/auth.test.ts` | Auth middleware — session, token validation | API integration | No | Included in `test:api` |
| `tests/api/health.test.ts` | Health endpoint shape and dependency reporting | API integration | No | Included in `test:api` |
| `tests/api/integrations.test.ts` | Third-party connector wiring | API integration | No | Included in `test:api` |
| `tests/api/cortex-inca-smoke.test.ts` | CORTEX INCA module smoke | API integration | No | Included in `test:api` |
| `tests/api/stress.test.ts` | Load/concurrency stress — basic | Load | No | Included in `test:api` |
| `tests/api/websocket-stress.test.ts` | WebSocket connection stress | Load | No | Included in `test:api` |
| `tests/api/cross-app-smoke.test.ts` | Cross-app route smoke (live server) | Integration | Yes | `test:integration` only |
| `tests/api/db-integration.test.ts` | DB schema integrity, seed round-trip | Integration | Yes | `test:integration` only |
| `tests/api/graphql-schema.test.ts` | GraphQL schema shape contract | Contract | Yes | `test:integration` only |
| `tests/api/openapi-contract.test.ts` | OpenAPI spec contract compliance | Contract | Yes | `test:integration` only |
| `tests/api/server-live.test.ts` | Full server boot + route matrix (live) | Integration | Yes | `test:integration` only |

**DB-live tests excluded from standard `test:api`** to prevent flaky CI failures in environments without a Postgres service. They run in `integration-test` CI job which spins up a Postgres 16 service container.

---

## 3. Component Tests (`tests/components/`)

Run via: `pnpm test:components`

| Test File | Coverage Area | Notes |
|-----------|--------------|-------|
| `tests/components/command-palette.test.tsx` | Command palette UI — keyboard, search, items | React Testing Library |
| `tests/components/ecosystem-nav.test.tsx` | Ecosystem navigation component | React Testing Library |
| `tests/components/powerbi-embed.test.tsx` | Power BI embed wrapper | React Testing Library |
| `tests/components/user-button.test.tsx` | User button / avatar dropdown | React Testing Library |
| `tests/components/utils.test.ts` | Shared UI utility functions | Pure functions |

---

## 4. E2E Tests (`tests/e2e/`)

Run via: `pnpm test:e2e` (full) or per-spec in CI `e2e.yml`

### 4a. Included in CI E2E Matrix (`e2e.yml`)

| Spec | App Under Test | CI Build Target | CI Port |
|------|---------------|----------------|---------|
| `szl-holdings.spec.ts` | SZL Holdings Dashboard | `@workspace/szl-holdings` | 3000 |
| `forge.spec.ts` | Nuro Forge (within SZL Holdings at `/nuro-forge`) | `@workspace/szl-holdings` | 3000 |
| `lyte.spec.ts` | Lyte Command Center (within SZL Holdings at `/lyte`) | `@workspace/szl-holdings` | 3000 |
| `aegis.spec.ts` | Aegis — Defense & Intelligence | `@workspace/aegis` | 3001 |
| `terra.spec.ts` | Terra — Real Estate Intelligence | `@workspace/terra` | 3002 | _RETIRED 2026-07-05: standalone app superseded by the a11oy `realestate` vertical; dropped from the active E2E matrix (see `artifacts/terra/DEPRECATED.md`)._ |
| `vessels.spec.ts` | Vessels Maritime Intelligence | `@workspace/vessels` | 3003 | _RETIRED 2026-07-08: standalone app superseded — maritime functionality consolidated into killinchu (`/api/killinchu/v1/fleet/*` + `/api/killinchu/v1/maritime/*`) and the a11oy `vessels` vertical; dropped from the active E2E matrix (see `artifacts/vessels/DEPRECATED.md`)._ |
| `counsel.spec.ts` | Counsel — Legal Matter Command | `@workspace/counsel` | 3008 | _RETIRED 2026-07-08: standalone app superseded by the a11oy `legal` vertical (GET /api/a11oy/v1/vert/legal -> consolidated_from:"Counsel"); dropped from the active E2E matrix (see `artifacts/counsel/DEPRECATED.md`)._ |
| `sentra.spec.ts` | Sentra — Cyber Resilience Command | `@workspace/sentra` | 3007 | _RETIRED 2026-07-08: standalone app superseded by the a11oy `cyber` vertical (GET /api/a11oy/v1/vert/cyber -> consolidated_from:"Sentra"); dropped from the active E2E matrix (see `artifacts/sentra/DEPRECATED.md`)._ |
| `carlota-jo.spec.ts` | Carlota Jo Consulting | `@workspace/carlota-jo` | 3004 |
| `command.spec.ts` | Unified Command | `@workspace/command` | 3005 |
| `governed-decision-loop.spec.ts` | Governed Decision Loop (within Command at `/operations/governed-decision-loop`) | `@workspace/command` | 3005 |
| `imperium.spec.ts` | IMPERIUM Infrastructure Map (within Command at `/infrastructure/imperium-map`) | `@workspace/command` | 3005 |
| `prism-counsel.spec.ts` | PRISM Counsel — Legal Command | `@workspace/prism-counsel` | 3006 |
| `stephen-site.spec.ts` | Stephen Lutar personal site (within SZL Holdings at `/stephen`) | `@workspace/szl-holdings` | 3000 |
| `auth.spec.ts` | SZL Holdings (session-level auth flow) | `@workspace/szl-holdings` | 3000 |
| `a11y.spec.ts` | SZL Holdings (accessibility) | `@workspace/szl-holdings` | 3000 |

### 4b. Not Registered in CI E2E Matrix

| Spec | Reason | Status |
|------|--------|--------|
| `correlation-deeplinks.spec.ts` | Cross-app deep-link spec; spans multiple artifacts and has no single-artifact CI build target | Run locally via `pnpm test:e2e` |
| `decision-theater.spec.ts` | Decision Theater walkthrough; targets a not-yet-shipped UX surface still under construction | Run locally via `pnpm test:e2e` |

All app-level smoke specs (`<app>.spec.ts`) are registered in §4a above.

Previously excluded specs that have since been promoted to the CI matrix:
- `imperium.spec.ts` — promoted April 2026; runs against `@workspace/command` build
- `lyte.spec.ts` — promoted April 2026; runs against `@workspace/szl-holdings` build
- `prism-counsel.spec.ts` — promoted April 2026; runs against standalone `@workspace/prism-counsel` build
- `stephen-site.spec.ts` — promoted April 2026; runs against `@workspace/szl-holdings` build at `/stephen`

---

## 5. QA Script Coverage (`scripts/qa/`)

| Script | Purpose | Run Command |
|--------|---------|------------|
| `smoke-routes.js` | HTTP smoke test all public routes | `pnpm qa:routes` |
| `smoke-product-mode.js` | Product-mode boot/auth/env readiness | `pnpm smoke:product-mode` |
| `check-links.js` | Broken link detection | `pnpm qa:links` |
| `check-a11y.js` | Accessibility baseline (axe-core) | `pnpm qa:a11y` |
| `check-trust.js` | Trust and legal page checks | `pnpm qa:trust` |
| `check-demo-seed.js` | Demo data integrity | `pnpm qa:demo` |
| `check-metadata.js` | SEO/OG metadata validation | `pnpm qa:meta` |
| `health-check.js` | Health endpoint verification | `pnpm health:check` |
| `audit-mocks.js` | Mock/placeholder leakage detection | `pnpm audit:mocks` |
| `audit-routes.js` | Route security matrix | `pnpm audit:routes` |
| `audit-copy.js` | Placeholder copy detection | `pnpm audit:copy` |
| `audit-deps.js` | Dependency freshness | `pnpm audit:deps` |
| `audit-design-system.js` | Design system compliance | `pnpm audit:design-system` |
| `audit-broken-links.js` | Deep broken link audit | `pnpm audit:broken-links` |
| `generate-sbom.js` | Security SBOM + npm audit | `pnpm security:audit` |
| `post-merge-verify.js` | Post-merge readiness gate | `pnpm qa:verify` |

---

## 6. Readiness Gate Commands

| Command | Orchestrates | Use Case |
|---------|-------------|---------|
| `pnpm smoke:product-mode` | `scripts/qa/smoke-product-mode.js` | Product-mode boot + env validation |
| `pnpm readiness:gate` | typecheck → test → qa:routes → audit:mocks → audit:deps → audit:copy → smoke:product-mode → build | CI-free release gate (blocks on Sev 0/1) |
| `pnpm audit:series-a` | typecheck → test → audit:mocks → audit:routes → audit:deps → audit:copy → security:audit → smoke:product-mode → build | Series A investor readiness (includes all dependency and placeholder audits) |

---

## 7. Coverage Gaps (Acknowledged)

| Gap | Severity | Notes |
|-----|---------|-------|
| No mobile E2E coverage (CORTEX) | Sev 2 | Expo app; Playwright cannot target RN; manual + unit coverage only |
| No cross-browser E2E (only Chromium in CI) | Sev 3 | Firefox/WebKit excluded for CI speed |
| No performance regression testing | Sev 3 | Lighthouse is manual only |

---

## 8. CI Job Mapping

| CI Job | Runs | Triggered By |
|--------|------|-------------|
| `lint` | ESLint | PR + push to main |
| `typecheck` | `pnpm typecheck` | PR + push to main |
| `test` | `pnpm test:api` + `pnpm test:components` | PR + push to main |
| `build` | `pnpm -r build` | PR + push to main |
| `integration-test` | `pnpm test:integration` (DB-live) | PR + push to main |
| `e2e-app` (matrix) | Playwright per-app specs | PR + push to main |
| `a11y` | `tests/e2e/a11y.spec.ts` | PR + push to main |
| `ci-gate` | Aggregates all CI jobs | PR + push to main |
| `e2e` (gate) | Aggregates E2E jobs | PR + push to main |
