# Regression Risk Register — SZL Holdings Platform

**Last updated:** 2026-04-16  
**Owner:** Engineering / QA Lead  
**Purpose:** Identifies high-risk logic that requires regression coverage before any release

---

## Purpose

This register identifies code paths where a regression would cause:
- Security vulnerabilities (auth bypass, data leak)
- Data loss or corruption
- Critical user-facing failures (platform unusable)
- Compliance violations

Each item is rated by **Risk Level** (P0–P2), **Current Test Coverage**, and **Recommended Action**.

---

## Risk Register

### P0 — Regression Would Be Critical / Security-Impacting

| ID | Component | Risk Description | Current Test Coverage | Recommended Action |
|----|-----------|-----------------|----------------------|-------------------|
| RR-001 | `lib/auth/src/` — Auth middleware | Auth bypass could expose all tenant data | ✅ Unit tests in `tests/api/auth.test.ts` | Add negative tests: forged tokens, expired sessions |
| RR-002 | `lib/ai-engine/src/retrieval/alloy-retrieval.ts` — Tenant isolation | Cross-tenant RAG data leak | ✅ Tenant scoping enforced; no isolated regression test | Add explicit cross-tenant retrieval rejection test |
| RR-003 | `artifacts/api-server/src/middlewares/api-version.ts` | Version spoofing / 400 bypass | ✅ Unit tests added Apr-2026 | Monitor for message format changes |
| RR-004 | `lib/db/src/schema/` — `tenant_id` column | Missing tenant_id allows cross-tenant queries | ✅ Migration `0001_add_tenant_id...` applied | Add DB migration regression test |
| RR-005 | `artifacts/api-server/src/middlewares/auth.ts` — `requireRole` | Role escalation could expose admin APIs | ✅ Mock in tests | Add real-role enforcement integration test |
| RR-006 | `artifacts/api-server/src/lib/` — Internal token comparison | Timing attack on service tokens | ✅ Resolved with `timingSafeEqual` | Regression test: timing-safe comparison enforced |
| RR-007 | `lib/policy-engine/src/` — Policy evaluation | Policy bypass in concurrent requests | ⚠️ No dedicated test | Add concurrent policy evaluation test |
| RR-008 | `lib/proof-chain/` — Proof Chain integrity | Proof records mutated or deleted improperly | ⚠️ No dedicated test | Add immutability regression test |

---

### P1 — Regression Would Be Operationally Impacting

| ID | Component | Risk Description | Current Test Coverage | Recommended Action |
|----|-----------|-----------------|----------------------|-------------------|
| RR-009 | `artifacts/api-server/src/routes/approvals.ts` | Approval bypass or double-approval | ⚠️ No dedicated test | Add approval state machine test |
| RR-010 | `lib/workflow-engine/src/` — Workflow execution | Silent workflow failure / infinite loop | ⚠️ No dedicated test | Add execution state regression tests |
| RR-011 | `lib/forge-runtime/src/` — Action execution | Partial execution with no rollback | ⚠️ No dedicated test | Add execution atomicity test |
| RR-012 | `artifacts/api-server/src/routes/alloy-chat.ts` | AI response contains cross-tenant context | ✅ Retrieval scoped by tenant | Add end-to-end chat isolation test |
| RR-013 | `lib/db/migrations/` — Migration scripts | Migration failure on upgrade | ⚠️ Manual only | Add migration idempotency test to CI |
| RR-014 | `lib/observability/src/` — Structured logging | PII or secrets in logs | ⚠️ No test | Add log scrubbing regression test |
| RR-015 | `artifacts/api-server/src/routes/admin/` — Admin routes | Admin operations accessible without admin role | ⚠️ Partial | Expand auth test to cover all admin routes |
| RR-016 | WebSocket connection handling | WebSocket message delivered to wrong tenant | ⚠️ `websocket-stress.test.ts` tests volume, not isolation | Add WebSocket tenant isolation test |

---

### P2 — Regression Would Be Degrading (Not Breaking)

| ID | Component | Risk Description | Current Test Coverage | Recommended Action |
|----|-----------|-----------------|----------------------|-------------------|
| RR-017 | `lib/shared-ui/src/` — Command Palette | Search returns empty or crashes | ✅ `command-palette.test.tsx` | Extend with edge case inputs |
| RR-018 | `artifacts/api-server/src/routes/cortex.ts` — Intelligence feed | Feed returns stale or empty data silently | ✅ `cortex-inca-smoke.test.ts` (integration) | Add data-freshness assertion |
| RR-019 | Bundle size — all web artifacts | Vendor bundle exceeds 2 MB causing slow load | ⚠️ No automated guard | Add Lighthouse CI budget check (KG019) |
| RR-020 | `lib/analytics/` — Event tracking | Analytics events stop firing silently | ⚠️ No test | Add integration test for event emission |
| RR-021 | Rate limiting (`express-rate-limit`) | Removal of rate limit exposes DDoS surface | ⚠️ No test | Add rate-limit enforcement test |

---

## Flaky Test Tracker

Tests that have exhibited intermittent failures in CI:

| Test File | Failure Mode | Frequency | Status |
|-----------|-------------|-----------|--------|
| `tests/api/stress.test.ts` | Timeout under load | Occasional | ⚠️ Monitor — concurrency-dependent |
| `tests/api/websocket-stress.test.ts` | Connection teardown race | Occasional | ⚠️ Monitor — timing-dependent |

---

## High-Risk Code Files (No or Minimal Test Coverage)

The following files contain business-critical logic with no dedicated test coverage:

| File | Risk | Priority |
|------|------|----------|
| `lib/policy-engine/src/index.ts` | Policy bypass | P1 |
| `lib/proof-chain/src/index.ts` | Audit integrity | P1 |
| `lib/workflow-engine/src/index.ts` | Workflow correctness | P1 |
| `lib/forge-runtime/src/index.ts` | Execution safety | P1 |
| `lib/decision-engine/src/index.ts` | Decision correctness | P1 |
| `artifacts/api-server/src/routes/admin/` | Admin security | P1 |
| `artifacts/api-server/src/routes/billing*.ts` | Billing accuracy | P1 |
| `lib/approvals/src/` | Approval integrity | P1 |

---

## Regression Coverage Improvement Plan

| Sprint | Target | Actions |
|--------|--------|---------|
| Sprint 3 | Auth / admin coverage | Add admin route auth tests; service token regression |
| Sprint 3 | Approval workflow | Add approval state machine tests |
| Sprint 4 | Policy / Proof / Forge | Add policy bypass, proof immutability, execution atomicity tests |
| Sprint 4 | Tenant isolation sweep | Cross-tenant tests for WebSocket, object storage, GraphQL |
| Sprint 5 | Analytics / billing | Add billing event and analytics emission tests |

---

*See also: TEST_STRATEGY.md, KNOWN-GAPS.md, QA_SIGNOFF_CHECKLIST.md*
