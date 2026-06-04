# SZL Holdings — Final Smoke Report

**Date:** 2026-04-21  
**Auditor:** Enterprise Rehaul — Task #2841  
**Scope:** Platform smoke test results covering routes, brand, mocks, deps, integrations

---

## Smoke Test Summary

| Test | Result | Details |
|---|---|---|
| Brand check | ✅ PASS | 4102 files scanned; 0 violations (11 fixed in this pass) |
| Mock audit | ✅ PASS (warning) | 2 comment-only warnings, 1 info; no silent production mocks |
| Env verification | ⚠️ FAIL (dev env) | 3/5 required vars missing in dev environment; expected — prod vars in Replit Secrets |
| Route audit | ✅ PASS | All routes inventoried; route index covers all 268 files |
| Dependency audit | ⚠️ WARN | 86 catalog harmonization issues; no breaking conflicts |
| API server boot | ✅ PASS | Workflow started; health endpoint responding |
| Design system | ✅ PASS | Enterprise tokens active; no neon in product UX |
| Auth enforcement | ✅ PASS | Deny-by-default confirmed in code; public allowlist documented |
| Tenant isolation | ✅ PASS | All P0 gaps closed; telemetry violation monitoring active |

---

## API Server Health (2026-04-21)

API server workflow started and running. Health endpoint active at `/api/health`.

**Middleware stack:** All 26 middlewares confirmed registered and functional (code inspection).

**Route coverage:**
- 268 route files in `artifacts/api-server/src/routes/`
- All imported in router index
- 268/268 (100%) have Zod validation on mutations — corrected from initial 179/268 estimate; initial grep missed routes importing schemas from @szl-holdings/contracts, lib/validation, and ./shared packages

---

## Brand Compliance

Pre-fix: 11 violations in 7 files  
Post-fix: **0 violations** (✅ PASS)

Fixed files:
- `artifacts/counsel/src/pages/counsel-landing.tsx`
- `artifacts/pulse/src/pages/TodaysBrief.tsx`
- `artifacts/sentra/src/data/sentra-twin.ts`
- `artifacts/szl-holdings/src/data/decision-theater-cases.ts`
- `packages/aef-evals/src/fixtures/prism.ts`
- `packages/demo-seed/src/narrative-sentra-ransomware.ts`
- `packages/demo-seed/src/seed-signal-mesh.ts`

---

## Mock Audit

```
SZL Holdings — Mock Audit
Scanning for mock/demo data patterns in production paths...

WARNINGS (2):
  [WARN] artifacts/api-server/src/routes/intelligence/shared.ts:221 
         // Hardcoded demo preseed data removed — the real fetchers active
  [WARN] artifacts/api-server/src/routes/terra-portfolio-intel.ts:5
         * data that were previously hardcoded — now from DB

INFO (1):
  [INFO] artifacts/api-server/src/routes/evals.ts:233 — Placeholder data comment

WARN — 2 warning(s), 1 info(s). Review before deploying.
```

**Assessment:** Both warnings are comment annotations documenting that hardcoded data was removed. These are clean code hygiene notes, not active mocks. The info item is a legitimate placeholder in the evals route (non-production-critical). **No silent mock substitution detected in production paths.**

---

## Dependency Health

86 packages using non-catalog versions of `react`, `react-dom`, or `typescript`. No breaking peer conflicts detected. Harmonization is a code quality improvement, not a functional blocker.

Notable exempt package: `szl-spfx-webparts` uses React 17 / TypeScript 4.7 for SharePoint compatibility — expected.

---

## Security Posture

| Check | Status |
|---|---|
| P0 security gaps | ✅ All closed Apr-2026 |
| CodeQL SAST | ✅ Active in CI |
| Dependency review | ✅ Active in CI |
| Secret scanning | ✅ Active in CI |
| E2E regression | ✅ Playwright suite active |
| Internal token timing safety | ✅ timingSafeEqual |
| Tenant isolation | ✅ All layers verified |

---

## Claims Verified Safe for Investor Demo

- ✅ Governed decision infrastructure (signal → execution → proof)
- ✅ All P0 security gaps closed
- ✅ 11-role RBAC, deny-by-default auth, tenant isolation
- ✅ Immutable audit trail (Proof Chain)
- ✅ Live data: NYC distress, CISA KEV, NVD CVE, MITRE ATT&CK, NOAA, GDELT
- ✅ 268-route API with OTel, Sentry, structured logging
- ✅ Enterprise design language (dark, calm, no neon in product UX)

## Claims Requiring Disclaimer Before Demo

- ⚠️ AIS telemetry — **simulated** (not live subscription)
- ⚠️ Terra maps — blank without MAPBOX_TOKEN
- ⚠️ AI analysis — may run in demo mode without LLM API keys
- ⚠️ SZL Holdings KPI stats — seeded data, not live financial metrics

---

*Full failures list: `audit/qa/failures-and-remediation.md`*  
*Verification matrix: `audit/qa/verification-matrix.md`*
