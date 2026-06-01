# STRESS TEST RESULTS — Phase 7

Captured: 2026-04-23.

## What was actually run this pass

| Suite | Status | Result |
| --- | --- | --- |
| `nexus-smoke-e2e` | RUN (validation pipeline) | **PASS** — 22/22 Playwright tests, 15.6 s wall, 28.8 s incl. setup |
| `brand-strings` (`pnpm brand:strings`) | RUN | **PASS** — 0 violations beyond baseline; 3,892 stale baseline entries flagged for refresh |
| `pnpm --filter @szl-holdings/connectors run typecheck` | RUN (after fix) | **PASS** — was previously failing |
| `pnpm --filter @szl-holdings/lib-domain-claims run typecheck` | RUN (after fix) | **PASS** — was previously failing |
| `lp-portal-uploads.test.ts` | last task validation | **13/13 PASS** |
| `mobile-auth-token-exchange.test.ts` | last task validation | **8/8 PASS** |
| `carlota-metrics.test.ts` | last task validation | **5/5 PASS** |
| `brand-names.test.ts` (Task #1439 regression) | last task validation | **3/3 PASS** |
| All 14 web/mobile workflow boots | OBSERVED multiple times | restart cleanly when triggered; otherwise idle-stop on inactivity |

## What was NOT run this pass (and why)

| Test type | Why not | When to add |
| --- | --- | --- |
| API load test (k6 / autocannon) at sustained 50–500 RPS | No load harness wired in; cannot fabricate timings | Pre-launch follow-on; budget 1 day |
| Soak test (1+ hour sustained traffic) | Same as above | Same |
| Failure-injection (DB stall, upstream timeout, memory pressure) | Requires fault-injection harness | Same |
| Lighthouse per artifact | Requires Chromium-driven run; not part of validation pipeline | Same |
| Restart/recovery rehearsal at scale | Manual restarts demonstrated runtime recovery; formal rehearsal needs runbook (see `GO_LIVE_RUNBOOK.md`) | Pre-launch |

## Existing tests already covering reliability surface

- `health-pool-saturation.test.ts` — pins the regression where `/api/health` was getting blocked behind the main pool. Real Postgres, no mock.
- `db-pool-instrumentation.test.ts` — verifies OBS-007 stack capture and warning thresholds.
- `boot-orchestrator.test.ts` — guards startup ordering under DB_POOL_MAX=10.
- `rate-limit.test.ts` — throttle behaviour.
- `mobile-auth-token-exchange.test.ts` — full OIDC token-exchange path including nonce, missing fields, OIDC-not-configured.
- 22 Playwright e2e specs in `tests/e2e/nexus-smoke.spec.ts`.

## Findings worth noting

1. **Recurring API-server crash under post-merge storm.** Cause is DB pool exhaustion. Mitigated this pass by lowering `DB_POOL_MAX` default from 100 → 12. Needs to be observed across the next 5+ post-merges to confirm fix.

2. **`drizzle-kit push` times out (60s SIGTERM) every post-merge.** Documented as non-fatal but it accumulates risk — schema changes silently don't apply. Needs Phase 4 follow-up.

3. **All workflow apps shut down on idle** in the development environment. This is expected on Replit and **not** a production concern (production deployment uses the Replit deploy system, which keeps its own warm).

## Honest readiness statement

The pass added one real reliability fix (DB pool default) and one observability/UX fix (Command telemetry try/catch). It did not run a formal load test. **Do not claim "stress-tested" in the executive summary** — claim "instrumentation pinned by integration tests; load-test rehearsal still required pre-launch". Truthfulness is part of the brief.
