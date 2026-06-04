# QA Sign-Off Checklist — SZL Holdings Platform

**Last updated:** 2026-04-16  
**Owner:** QA Lead / Engineering Lead  
**Purpose:** Defines what must pass before any release is approved for production deployment

---

## Release Types

This checklist applies to all release types. Items marked **[BLOCKING]** must pass before release. Items marked **[ADVISORY]** should pass but may be waived with documented justification.

| Release Type | Full Checklist | Abbreviated |
|-------------|----------------|-------------|
| Production release | Required | — |
| Hotfix (critical bug) | Abbreviated (Sections 1–3) | Sections 1–3 |
| Design partner preview | Sections 1–3 + 6 | — |
| Internal demo | Section 1 only | — |

---

## Section 1 — Automated Test Gate [BLOCKING]

**All items must show green before any release.**

- [ ] **[BLOCKING]** `pnpm test` passes with **0 test failures**
  - Covers: API unit tests, component tests
  - Acceptable: Skipped tests with documented reason
- [ ] **[BLOCKING]** `pnpm test:integration` passes with **0 test failures**
  - Covers: DB integration, GraphQL schema, cross-app smoke, cortex/inca smoke
  - Prerequisite: Staging DB and Redis must be running
- [ ] **[BLOCKING]** `pnpm playwright test` passes with **0 spec failures**
  - Covers: All artifact E2E smoke specs
  - Acceptable: Tests tagged `@flaky` with documented reason in REGRESSION_RISK_REGISTER.md
- [ ] **[BLOCKING]** `pnpm run lint` produces **0 lint errors**
  - Warnings are acceptable and do not block release
  - Current warning count: ~4,519 (all warnings, no errors) — documented baseline

---

## Section 2 — Build Integrity [BLOCKING]

- [ ] **[BLOCKING]** All artifact builds complete without errors
  - `pnpm --filter "./artifacts/*" run build` (where build script exists)
- [ ] **[BLOCKING]** TypeScript (`pnpm tsc --noEmit`) produces **0 type errors**
- [ ] **[BLOCKING]** No `console.error` output in normal test runs
- [ ] **[ADVISORY]** Bundle sizes reviewed — no artifact exceeds 2 MB vendor chunk without justification

---

## Section 3 — Security Gate [BLOCKING]

- [ ] **[BLOCKING]** No new P0 security items added to KNOWN-GAPS.md without remediation plan
- [ ] **[BLOCKING]** All P0 items in KNOWN-GAPS.md are either ✅ Resolved or have an owner + sprint target
- [ ] **[BLOCKING]** No secrets, credentials, or API keys committed to the repository
  - Verify: `node scripts/qa/scan-secrets.js`
- [ ] **[BLOCKING]** Auth middleware is active on all non-public API routes (verify via ROUTE_INVENTORY.md)
- [ ] **[BLOCKING]** Cross-tenant isolation verified — alloy-retrieval.ts tenant scoping confirmed active
- [ ] **[ADVISORY]** SSRF validation added to webhook delivery (KG020b) — open item, must be remediated before public launch

---

## Section 4 — Data & Migration Gate [BLOCKING]

- [ ] **[BLOCKING]** All pending DB migrations have been applied to staging before release
- [ ] **[BLOCKING]** `lib/db/migrations/` — each migration script is idempotent and rollback-capable
- [ ] **[BLOCKING]** Seed data scripts verified for intended environments:
  - `scripts/seed-prism-counsel.ts` — fix verified (TD-002)
  - `scripts/seed-demo-canonical.sh` — smoke test verified
- [ ] **[ADVISORY]** Staging data consistent with schema (no orphaned rows after migration)

---

## Section 5 — Observability & Monitoring Gate [ADVISORY for v1 / BLOCKING for GA]

- [ ] **[ADVISORY]** OTEL exporter configured for production target (KG009) — must be resolved before GA
- [ ] **[ADVISORY]** Sentry DSN configured for production (KG028)
- [ ] **[ADVISORY]** External uptime monitoring configured (KG027)
- [ ] **[ADVISORY]** Structured logging active on all API routes — Pino logger in use ✅

---

## Section 6 — Product Readiness Gate [BLOCKING for Design Partner]

- [ ] **[BLOCKING]** All flows in FLOW_AUDIT_MATRIX.md reviewed — no new ❌ (broken) items without documented workaround
- [ ] **[BLOCKING]** FIRST_10_MINUTES.md walk-through completed by at least one non-engineer
- [ ] **[BLOCKING]** CUSTOMER_SETUP_CHECKLIST.md verified end-to-end for target design partner
- [ ] **[ADVISORY]** Empty states reviewed for all primary flows
- [ ] **[ADVISORY]** Error messages reviewed — no raw stack traces exposed to end users

---

## Section 7 — Documentation Gate [ADVISORY]

- [ ] **[ADVISORY]** KNOWN-GAPS.md updated with any new gaps discovered during this release cycle
- [ ] **[ADVISORY]** CHANGELOG.md updated with this release's changes
- [ ] **[ADVISORY]** TRUST_CENTER_INDEX.md model reference updated (TD-004 — open item)
- [ ] **[ADVISORY]** Any new environment variables documented in ENV_MATRIX.md

---

## Section 8 — Pre-Deploy Final Checks [BLOCKING]

- [ ] **[BLOCKING]** Staging environment smoke test passed within 24 hours of production deploy
- [ ] **[BLOCKING]** `node scripts/qa/health-check.js` passes against staging
- [ ] **[BLOCKING]** Database connection verified on staging
- [ ] **[BLOCKING]** At least one QA engineer has manually verified the critical path (login → first action)
- [ ] **[BLOCKING]** GO_NO_GO_CHECKLIST.md reviewed and signed off by Engineering Lead

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Engineering Lead | | | |
| Product Manager | | | |
| Security / Compliance | | | |

---

## Waiver Process

If a **[BLOCKING]** item must be waived for a release:
1. Document the reason in this checklist under the item
2. Get explicit sign-off from Engineering Lead AND one of: CTO, Product, Security
3. Create a tracking issue with a deadline for remediation
4. Add the waived item to KNOWN-GAPS.md with P1 or higher severity

---

*See also: SMOKE_TEST_PLAN.md, TEST_STRATEGY.md, REGRESSION_RISK_REGISTER.md, LAUNCH_BLOCKERS.md, GO_NO_GO_CHECKLIST.md*
