# GO-LIVE BLOCKERS — Brutally honest

Captured: 2026-05-06 (Task #4367 stabilization pass).

This file does not spin. If a launch happens with the items below unresolved, here is exactly what will go wrong.

## Status delta since 2026-04-23

- Task #4362 (Helios → A11oy/Frontier consolidation) MERGED. `/api/a11oy/frontier/*` is the primary surface; `/api/helios/*` retained as deprecated alias. Estate manifest marks `helios` removed. 7 frontier pages repointed.
- All 9 workspace workflows boot cleanly under the current `.replit` (a11oy, api-server x2, carlota-jo, conduit, counsel, sentra, terra, vessels). No port-collision crashes observed in this pass.
- `/api/health` returns rich live liveness (server, database+latency, job_queue depth, storage mode, auth mode, ai+latency, huggingface gate). Wired into A11oy SLO surface via existing data fetchers.

## Hard blockers (do NOT launch with these open)

### B1. Production Postgres connection budget unverified
- **Status:** `DB_POOL_MAX` shared default = 40 in `.replit`. Production Postgres `max_connections` not validated against expected concurrent-instance count under autoscale.
- **What goes wrong:** First sustained traffic burst → connection acquisition queue → cascading 503s.
- **Resolution before launch:** Confirm production Postgres `max_connections`. Run a 5-minute load test at expected peak RPS and watch pool checkout depth via `/api/health/detailed`.

### B2. No load test has been run end-to-end
- **Status:** Validation pipeline (`nexus-smoke-e2e`, brand-strings, security-tests) is green. **No autocannon / k6 / wrk run** at any RPS.
- **What goes wrong:** First real traffic spike reveals an unknown bottleneck — could be DB, could be a single oversized handler.
- **Resolution before launch:** Run `autocannon -c 50 -d 60 https://<prod-host>/api/health` and the top 5 read endpoints. Capture p50/p95/p99.

### B3. HuggingFace inference gate failing in production posture
- **Status:** `/api/health` reports `huggingface.failedGates = ["live_inference_enabled","production_approved"]`. This is intentional in dev; in prod the gate must be flipped or the surface must be hidden.
- **What goes wrong:** Any A11oy / Frontier page that requires HF inference will degrade to "unconfigured" cards in production.
- **Resolution before launch:** Either set `HF_LIVE_INFERENCE_ENABLED=true` and `HF_PRODUCTION_APPROVED=true` with a valid token in production secrets, or hide HF-dependent panels behind the existing feature flag.

### B4. Drizzle-kit push silently times out (legacy)
- **Status:** Every post-merge run still shows `drizzle-kit exited code=null signal=SIGTERM` (60s hard timeout). Documented as non-fatal.
- **What goes wrong:** A migration that requires schema reflection (e.g. drift detection) silently does not apply. The next deploy could find the prod schema out of sync with the code's expectations.
- **Resolution before launch:** Manually verify the prod schema matches `lib/db/src/schema/` via `drizzle-kit introspect` or `pg_dump --schema-only`.

## Soft blockers (launch is possible but mitigations should be live)

### S1. Sibling tasks in flight at deploy-cut time
- **Status:** Tasks #4385 (vertical-embed), #4596 (AI gateway contract), #4608 (governance panels wiring), #4621 (rate-limiter `getConfig`), #4622 (feature-flag tests) are open in isolated environments and will merge asynchronously.
- **Mitigation:** Cut the deploy from `main` at a known-green commit. Rolling subsequent merges into the live deploy is supported by Replit autoscale; verify each merge against `/api/health` post-merge.

### S2. `firestorm` brand still present in some legacy URLs and audit logs
- **Status:** Tasks #1437 / #1438 / #3419 partial. Some source files still carry the deprecated name.
- **Mitigation:** Surface check before launch — grep production routes for `firestorm` and either redirect or hide.

### S3. Recurring drizzle-kit + post-merge storm crash (low recurrence)
- **Status:** Mitigated by the lowered pool default. Has not recurred in the current pass across multiple post-merges.
- **Mitigation:** Continue to watch. If 5+ consecutive post-merges are clean, declare the fix verified.

### S4. 4 oxlint errors not yet triaged (carry-over)
- **Status:** Unchanged from 2026-04-23 baseline.
- **Mitigation:** `pnpm exec oxlint . 2>&1 | grep -B 5 "× error"` and fix or annotate.

### S5. 114 skipped / `.todo` tests (carry-over)
- **Status:** Counted by ripgrep; not triaged. NEVER skipped to make CI pass — these are pre-existing.
- **Mitigation:** Owner-by-owner triage post-launch. Each must be unskipped, deleted, or annotated with a tracking task.

## Non-blockers (file for post-launch but won't kill the launch)

- 14 oversized route handlers (>1,900 LOC each, e.g. `command.ts` at 3,504 LOC, `prism-counsel-ops.ts` at 1,135 LOC). Splitting is rewrite-shaped — defer.
- ~118k lines of docs across 172 files. Not a runtime risk.
- `attached_assets/` weight. Should be cleaned up but doesn't ship.
- Two ontology packages (`lib/ontology` vs `packages/ontology`). Plan consolidation post-launch.

## Recommended go/no-go

**Conditional go.** Launch only if B1, B3, and B4 are resolved (or the affected surfaces are hidden behind a feature flag). B2 is mitigatable with a "soft launch" — deploy at low traffic, watch metrics via `/api/health`, ramp up.

**No-go** if any of B1–B4 are open at T-30 minutes.
