# GO-LIVE BLOCKERS — Brutally honest

Captured: 2026-04-23.

This file does not spin. If a midnight launch happens with the items below unresolved, here is exactly what will go wrong.

## Hard blockers (do NOT launch with these open)

### B1. Production Postgres connection budget unverified
- **Status:** Phase 4 fix lowered `DB_POOL_MAX` default to 12 to survive the dev-environment merge storm. Whether production Postgres can accommodate even that under traffic has not been load-tested.
- **What goes wrong:** First sustained traffic burst → connection acquisition queue → cascading 503s.
- **Resolution before launch:** Confirm production Postgres `max_connections`. Run a 5-minute load test at expected peak RPS and watch pool checkout depth.

### B2. No load test has been run end-to-end
- **Status:** Validation pipeline (`nexus-smoke-e2e`, brand-strings, security tests) is green. **No autocannon / k6 / wrk run** at any RPS.
- **What goes wrong:** First real traffic spike reveals an unknown bottleneck — could be DB, could be a single oversized handler.
- **Resolution before launch:** Run `autocannon -c 50 -d 60 https://<prod-host>/api/health/detailed` and the top 5 read endpoints. Capture p50/p95/p99.

### B3. Drizzle-kit push silently times out
- **Status:** Every post-merge run shows `drizzle-kit exited code=null signal=SIGTERM` (60s hard timeout). Documented as non-fatal.
- **What goes wrong:** A migration that requires schema reflection (e.g. drift detection) will silently not apply. The next deploy could find the prod schema out of sync with the code's expectations.
- **Resolution before launch:** Manually verify the prod schema matches `lib/db/src/schema/` via `drizzle-kit introspect` or `pg_dump --schema-only`.

### B4. `firestorm` brand still present in URLs, DB schema, and audit logs
- **Status:** Tasks #1437 (route rename), #1438 (directory cleanup), #3419 (API path migration) are filed but not all merged. 25 source files + 10 build artifacts still carry the deprecated name.
- **What goes wrong:** A customer or investor hits `/billing/firestorm/invoice` or sees `firestorm_*` table names in an export → brand confusion at exactly the wrong moment.
- **Resolution before launch:** Land the renames or hide the affected surfaces behind a flag.

## Soft blockers (launch is possible but mitigations should be live)

### S1. 4 oxlint errors not yet triaged
- **Status:** `oxlint .` reports 4 errors among 842 warnings. Specific rule names could not be extracted from the reporter output in this pass (the JSON output was truncated).
- **Mitigation:** Run `pnpm exec oxlint . 2>&1 | grep -B 5 "× error"` locally and fix or `// oxlint-disable-next-line` with rationale.

### S2. 114 skipped / `.todo` tests
- **Status:** Counted by ripgrep; not triaged.
- **Mitigation:** Owner-by-owner triage. Each skipped test must either be unskipped, deleted, or annotated with a tracking task.

### S3. 3,892 stale entries in `banned-brand-strings.baseline.json`
- **Status:** The baseline is masking past violations. New violations are still caught, but the baseline carries dead weight.
- **Mitigation:** `pnpm brand:strings -- --update-baseline` after a manual scan.

### S4. Recurring API-server crash under post-merge storm
- **Status:** Mitigated this pass by lowering `DB_POOL_MAX` default. **Not yet observed across enough post-merges to confirm fix.**
- **Mitigation:** Continue manual restarts if crash recurs in the next 24 hours. If 5+ consecutive post-merges are clean, declare the fix verified.

### S5. Two ontology packages
- **Status:** `lib/ontology` (3 consumers) and `packages/ontology` (36 consumers) both define overlapping types. Risk of drift.
- **Mitigation:** Don't change either before launch. Plan consolidation post-launch.

## Non-blockers (file for post-launch but won't kill the launch)

- 14 oversized route handlers (>1,900 LOC each). Splitting is rewrite-shaped — defer.
- ~118k lines of docs across 172 files. Not a runtime risk.
- `attached_assets/` at 129 MB. Should be cleaned up but doesn't ship.
- Skipped tests, lint warnings, code duplication generally.

## Recommended go/no-go

**Conditional go.** Launch only if B1, B3, and B4 are resolved (or the affected surfaces are hidden behind a feature flag). B2 is mitigatable with a "soft launch" — deploy at low traffic, watch metrics, ramp up.

**No-go** if any of B1–B4 are open at T-30 minutes.
