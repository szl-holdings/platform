# Test Status
**SZL Holdings — Governed Operational Intelligence**  
**Audit Date:** April 19, 2026

---

## Test Coverage Summary

| Category | Status | Notes |
|---|---|---|
| API integration tests | ✅ Partial pass | Domain execution tests pass; governance persistence skipped |
| Component tests | ✅ Configured | Vitest components config |
| E2E tests | ⚠️ Configured | Playwright configured; not run in this audit |
| Proof chain tests | ✅ Pass | scripts/check-proof-chain.js |
| Smoke tests | ✅ Pass (8/8) | smoke-test-integrations workflow |
| Link checks | ✅ Pass | check-deprecated-links workflow |
| Domain execution | ✅ Pass (4/4) | Vessels, Terra, Carlota Jo, Aegis workflows |

---

## API Integration Test Detail

**Config:** `vitest.config.ts`  
**Command:** `pnpm run test:api`

### Passing Suites

| Test | Domain | Status | Description |
|---|---|---|---|
| domain-atlas:execute vessels-voyage-risk | Vessels | ✅ Pass | Voyage risk workflow completes |
| domain-atlas:execute terra-deal-underwriting | Terra | ✅ Pass | Deal underwriting workflow completes |
| domain-atlas:execute carlota-concierge-workflow | Carlota Jo | ✅ Pass | Concierge workflow completes |
| domain-atlas:execute aegis-incident-response | Aegis | ✅ Pass | Incident response workflow completes |

### Skipped Suites

| Test | Reason | Resolution |
|---|---|---|
| governance-persistence (3 tests) | `platform_settings` table missing | Run `pnpm seed:all` after migration |

---

## Critical Path Test Coverage

The following investor-demo-critical paths have been manually verified as working:

| Path | Verified | Method |
|---|---|---|
| Decision Twin simulation loop | ✅ | Route loads, seed data renders |
| Policy Compiler NLP→policy compilation | ✅ | Route loads, compiler functional |
| Why This Property Now thesis generation | ✅ | Route loads, rankings render |
| Adversary Narrative Engine incident storyline | ✅ | Route loads, dual modes functional |
| Voyage Risk Twin risk + compliance | ✅ | Route loads, risk factors render |
| White-Glove Command concierge | ✅ | Route loads, client dossiers render |
| Demo Launchpad (new) | ✅ | Route loads, all stops linked |
| Cross-domain evidence registry | ✅ | Route loads, evidence items render |
| Alloy audit trail receipts | ✅ | Route loads, receipts render |

---

## Test Infrastructure

| Tool | Purpose | Status |
|---|---|---|
| Vitest | Unit + integration + component tests | ✅ Configured |
| Playwright | E2E browser tests | ✅ Configured; not run in this audit |
| Vitest Coverage | Test coverage reports | ✅ Configured |
| Vitest Integration | Integration test config | ✅ Configured |

---

## Recommended Test Additions

| Gap | Priority | Effort |
|---|---|---|
| Decision Twin simulation outcomes | P2 | Medium |
| Policy Compiler compilation correctness | P2 | Medium |
| Alloy approval gate enforcement | P1 | Medium |
| Terra property scoring consistency | P2 | Low |
| Proof chain integrity (cross-domain) | P1 | Low |
