# What Remains Unverified

**Date:** 2026-04-27  
**Phase:** Rehaul 9/9 Closeout  
**Purpose:** Honest accounting of claims, features, and states that have NOT been independently verified in this audit cycle. Not confirmed broken — not confirmed working.

---

## Methodology

This document uses a strict standard: VERIFIED means we have direct evidence (logs, screenshots, API responses, test results, or code review). UNVERIFIED means we have code but no runtime evidence, or the state has not been checked against the running system in this cycle.

---

## Unverified Claims

### Runtime / API

| Claim | Status | Why Unverified | Risk |
|---|---|---|---|
| `/api/sentra/risks` returns valid data | ❌ UNVERIFIED | Route not registered in API server; API call will 404 | HIGH — demo-blocking |
| Terra Mapbox tiles render correctly | ❌ UNVERIFIED | Token not configured; maps are blank | MEDIUM |
| AIS telemetry is clearly labeled as simulated to end users | ⚠️ PARTIAL | Disclosed in docs; not verified in UI | MEDIUM |
| FORGE (Command) cross-domain badge counts are accurate | ❌ UNVERIFIED | Not wired to live API; showing static data | MEDIUM |
| Push notification deep links open the correct screen on mobile | ❌ UNVERIFIED | Notifications fire; deep link routing not verified | MEDIUM |
| Redis session store is active in production | ❌ UNVERIFIED | Not provisioned; in-memory sessions assumed | HIGH |
| Stripe billing is processing real transactions | ⚠️ PARTIAL | Infrastructure deployed; no confirmed live transaction | HIGH |
| CourtListener integration returns live case data | ❌ UNVERIFIED | Token not configured | LOW |

### CI & Security

| Claim | Status | Why Unverified | Risk |
|---|---|---|---|
| All 5 required status checks pass on every PR | ✅ Last verified 2026-04-26 | Check GitHub Actions tab for current state | LOW |
| No secrets present in full Git history | ⚠️ SCHEDULED | Daily Gitleaks scheduled scan runs; last result not inspected in this session | LOW |
| Container images successfully published to GHCR | ❌ UNVERIFIED | Workflow exists; no confirmed published image found | LOW |
| npm packages successfully published to GitHub Packages | ❌ UNVERIFIED | Workflow exists; no confirmed publish log found | LOW |
| Uptime monitor successfully opens GitHub incident issues | ⚠️ PARTIAL | Logic reviewed and correct; actual issue creation not tested | LOW |

### Infrastructure & Operations

| Claim | Status | Why Unverified | Risk |
|---|---|---|---|
| Nightly database backup completes without error | ❌ UNVERIFIED | Workflow exists; no Azure Blob Storage secrets confirmed | MEDIUM |
| Staging deployment succeeds on every push to main | ⚠️ PARTIAL | Workflow configured; no recent staging deployment log inspected | MEDIUM |
| Production deployment health check (`pnpm verify:health`) passes | ❌ UNVERIFIED | Script exists; not run in this audit cycle | MEDIUM |

### Product Features

| Claim | Status | Why Unverified | Risk |
|---|---|---|---|
| KORA `/lyte/` legacy path alias resolves correctly | ❌ UNVERIFIED | Route alias missing; known gap | LOW |
| A11oy proof chain produces valid SHA-256 hash chains in production | ✅ CODE-CONFIRMED | Engine tests verify hash stability (6 engine tests passing) | LOW |
| Multi-provider AI routing routes correctly under load | ❌ UNVERIFIED | No load test run in this cycle | MEDIUM |
| Covenant policy blocks prohibited actions at the fabric layer | ✅ CODE-CONFIRMED | Compiler tests (9 cases) verify policy rejection | LOW |
| Mobile push notifications are delivered to all active tokens | ⚠️ PARTIAL | Fan-out logic verified in 13 unit tests; production delivery not traced | MEDIUM |

---

## Items That Cannot Be Verified in This Environment

Some items require production environment access, paid third-party credentials, or physical device testing that is outside the scope of this audit:

- AIS live telemetry (requires paid AIS provider)
- Mapbox live tile rendering (requires Mapbox token)
- Full E2E test suite on physical iOS/Android devices
- SCIM 2.0 provisioning flow with an IdP
- SOC 2 evidence collection

These are not failures — they are known external dependencies. Each is documented with a roadmap entry.

---

## Action Required Before growth capital Diligence

| Item | Action | Estimated Effort |
|---|---|---|
| Verify Redis session store in production | Provision Redis; update deployment | 1 sprint |
| Verify FORGE badge counts or move to internal-only | Wire API or reclassify | 1–2 sprints |
| Verify Stripe live transaction processing | Confirm with test transaction | 2 hours |
| Verify staging deployment pipeline | Trigger staging deploy; inspect logs | 1 hour |
| Run `pnpm verify:health` against production | Run health check script | 30 minutes |
| Inspect last Gitleaks scheduled scan SARIF | GitHub Security tab | 15 minutes |

---

*This document must be reviewed and updated before every investor meeting or diligence session.*
