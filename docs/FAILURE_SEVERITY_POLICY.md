# Failure Severity Policy — SZL Holdings Platform

**Version:** 1.0
**Date:** April 16, 2026
**Applies to:** All CI failures, QA gate failures, smoke test failures, and production incidents

This document defines how platform failures are triaged, escalated, and resolved. Every failure surfaced by CI, readiness gates, QA scripts, or production monitoring maps to one of four severity levels.

---

## Severity Definitions

### Sev 0 — Security / Auth / Boot Blocker

**Definition:** The system cannot boot, authenticate, or protect user data.

**Examples:**
- Auth middleware bypass — unauthenticated requests reach protected routes
- Application fails to start (uncaught exception, missing required env var)
- Session secret missing or invalid in production
- Data leaked across tenant boundaries
- Database connection fully unavailable at boot
- Critical env var (`DATABASE_URL`, `SESSION_SECRET`) absent in non-local environment

**Required action:**
- Block deployment immediately
- Page on-call engineer
- Do not merge to main
- Resolve before any other work proceeds

**Acceptable resolution time:** < 2 hours

---

### Sev 1 — Mock Leakage / Deployment Ambiguity / Data Integrity

**Definition:** Production or demo environment is serving incorrect, mocked, or unvalidated data, OR the deployment state is ambiguous.

**Examples:**
- `audit:mocks` detects hardcoded mock data served from production API routes
- Demo org data appears in non-demo tenants
- Health endpoint reports `ok` when underlying DB is actually down
- Build artifact missing required env configuration
- OpenAPI contract test failure (schema drift)
- Route security matrix shows an unintended public route exposing authenticated data

**Required action:**
- Block release, do not push to production
- Assign fix within 24 hours
- Document in `docs/known-gaps.md` if deferring past 48 hours

**Acceptable resolution time:** < 24 hours

---

### Sev 2 — Stale Docs / Console Noise / Missing Coverage

**Definition:** Documentation, tests, or observability do not accurately reflect the system but no data or security is at risk.

**Examples:**
- `QA_SUMMARY.md` or `TESTING_MATRIX.md` contradicts actual test coverage
- E2E spec exists but is not included in the CI matrix (and not documented as excluded)
- Unstructured `console.log` in runtime-critical paths (not seed scripts)
- Health endpoint returns optimistic `ok` status without checking real dependencies
- Missing E2E coverage for a flagship product surface with no documented exclusion reason
- TypeScript `any` in a trust-critical route handler

**Required action:**
- Fix within the current sprint
- Add to `docs/known-gaps.md` immediately if deferring
- Document exclusion reason if deliberately skipping

**Acceptable resolution time:** < 1 sprint (2 weeks)

---

### Sev 3 — Cosmetic / Minor / Backlog

**Definition:** Non-blocking quality issues that do not affect security, data integrity, functionality, or investor confidence.

**Examples:**
- UI rendering glitch on non-critical page
- Lighthouse performance score drops < 5 points
- Missing test for a pure utility function
- Cross-browser visual inconsistency not affecting interaction
- Stale comment in code (no functional impact)
- Console warning from a third-party library

**Required action:**
- Add to backlog
- Fix in opportunistic cleanup cycles
- No escalation required

**Acceptable resolution time:** No SLA — backlog priority

---

## Gate Policy

| Gate | Blocks Merge | Blocks Release | Sev Required |
|------|-------------|---------------|-------------|
| `ci-gate` (CI.yml) | Yes | Yes | Sev 0 + Sev 1 |
| `e2e` gate (e2e.yml) | Yes | Yes | Sev 0 + Sev 1 |
| `pnpm readiness:gate` | No (local) | Yes | Sev 0 + Sev 1 |
| `pnpm smoke:product-mode` | No (local) | Yes | Sev 0 + Sev 1 |
| `pnpm audit:series-a` | No (local) | Yes (investor demo) | Sev 0 + Sev 1 + Sev 2 |
| `pnpm audit:mocks` | No | Yes | Sev 1 |
| Documentation drift | No | No | Sev 2 |

---

## Sev 0 Checklist (Boot + Auth)

These must pass in every environment before deployment:

- [ ] `SESSION_SECRET` is set and non-empty
- [ ] `DATABASE_URL` is set and connectable
- [ ] `/api/health/ready` returns `200` with `status: ready` and `checks.database: connected`
- [ ] Auth middleware rejects unauthenticated requests to protected routes
- [ ] Demo org sentinel check passes (no production data in demo context)
- [ ] No uncaught exceptions in server startup logs

---

## Sev 1 Checklist (Mock + Data Integrity)

These must pass before any production release:

- [ ] `pnpm audit:mocks` reports zero violations
- [ ] `pnpm audit:routes` shows no unexpected public routes
- [ ] `/api/health/ready` reflects actual DB state (not optimistic)
- [ ] OpenAPI contract tests pass (`tests/api/openapi-contract.test.ts`)
- [ ] Cross-app smoke tests pass (`tests/api/cross-app-smoke.test.ts`)

---

## Escalation Path

```
Sev 0  →  On-call engineer (immediate) → CTO notification within 30 min
Sev 1  →  Assigned engineer same day → Engineering lead notification within 4 hours
Sev 2  →  Sprint backlog → Engineering review in next standup
Sev 3  →  Backlog grooming → No notification required
```
