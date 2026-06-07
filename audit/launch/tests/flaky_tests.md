# Flaky Tests Register
**Phase:** 8 + 11  
**Date:** April 19, 2026  
**Auditor:** Series A Launch Readiness Program (Task #2068)

---

## Known Flaky Tests

### FT001 — Integration Tests on Missing DB Tables

| Test | `test:integration` suite — routes testing eval forge and platform settings |
|---|---|
| Symptom | Some integration tests return 500 or empty when `platform_settings`, `eval_forge_suites`, `eval_forge_runs` tables not present |
| Frequency | Reproducible in fresh dev environment; rare after full migration |
| Fix | Run `pnpm db:migrate && pnpm seed:all` before integration test suite |
| Status | ⚠️ Open — pre-migration environment only |
| Priority | P2 — not a CI blocker after migration |

---

### FT002 — Playwright Auth Race Condition

| Test | `tests/e2e/auth.spec.ts` — auth gate checks |
|---|---|
| Symptom | Occasional auth redirect race condition in Playwright when OIDC callback is slow |
| Frequency | ~5% of CI runs |
| Fix | Added `waitForURL` timeout increase; `playwright.config.ts` timeout set to 30s |
| Status | ⚠️ Partial fix — still intermittent on slow CI |
| Priority | P2 |

---

### FT003 — Vitest Misconfigured Test (Resolved)

| Test | `cortex-inca-smoke.test.ts` |
|---|---|
| Symptom | Test was in wrong runner config; causing false failures |
| Resolution | Moved to correct config in Phase 4–5 audit (AF-T findings) |
| Status | ✅ Resolved |

---

### FT004 — API Version Contract Mismatch (Resolved)

| Test | `api-version.ts` error message contract tests |
|---|---|
| Symptom | Error message format in test did not match implementation |
| Resolution | Fixed in Phase 4–5 audit |
| Status | ✅ Resolved |

---

## Flaky Test Mitigation Strategy

1. **Integration tests:** Always run `pnpm db:migrate && pnpm seed:demo` before CI integration test job
2. **Playwright:** Use `--retries=2` flag in CI to handle transient auth race conditions
3. **PRISM Counsel seed:** Fix `scripts/seed-prism-counsel.ts` to match schema (DI007)
4. **Monitoring:** Track test failure rate by suite in CI dashboard; alert if > 5% failure rate on any suite

---

## Test Stability Score

| Suite | Failure Rate | Target |
|---|---|---|
| Unit (Vitest) | < 1% | < 1% ✅ |
| Component (Vitest) | < 1% | < 1% ✅ |
| Proof chain | 0% | < 1% ✅ |
| Integration | ~5% (pre-migration) | < 2% ⚠️ |
| Playwright E2E | ~5% (auth race) | < 2% ⚠️ |
| Smoke routes | 0% | 0% ✅ |
