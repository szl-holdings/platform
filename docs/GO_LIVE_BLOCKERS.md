# GO-LIVE BLOCKERS — Brutally honest

Captured: 2026-05-06 (Task #4367 stabilization pass).

This file does not spin. If a launch happens with the items below unresolved, here is exactly what will go wrong.

## Status delta since 2026-04-23

- Task #4362 (Helios → A11oy/Frontier consolidation) MERGED. `/api/a11oy/frontier/*` is the primary surface; `/api/helios/*` retained as deprecated alias. Estate manifest marks `helios` removed. 7 frontier pages repointed.
- The `.replit` `Project` runButton currently auto-starts only two web tasks (`artifacts/counsel: web`, `artifacts/conduit: web`). The other 7 workflows (a11oy, api-server x2, carlota-jo, sentra, terra, vessels) are defined as registered workflow definitions and are managed individually by the Replit workspace; they were observed running cleanly during this pass but are NOT part of the auto-start `Project` group. Whether the production deploy needs all 9 vs. only the api-server fronting path-based proxies is the open decision in §B5 below.
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

### B5. `.replit` Project runButton vs deployed surface ambiguity
- **Status:** `.replit` `[workflows.workflow] name="Project"` only includes `counsel` and `conduit` as auto-start tasks. Production deploy uses `deploymentTarget=autoscale` with the api-server as the entry point (path-based proxy serves all 9 web artifacts at `/`, `/counsel/`, etc.); the workspace-level `Project` group is a dev convenience.
- **What goes wrong:** If an operator interprets the `Project` button as the production topology, they will under-deploy.
- **Resolution before launch:** Confirm with the platform team that production routing is api-server-fronted (as stated in `userenv.production`). If correct, no `.replit` change is required. If not, expand the `Project` workflow to include all artifacts.
- **Owner:** main agent (this task #4367).

### S1. Sibling tasks in flight at deploy-cut time
- **Status:** Tasks #4385 (vertical-embed), #4596 (AI gateway contract), #4608 (governance panels wiring), #4621 (rate-limiter `getConfig`), #4622 (feature-flag tests) are open in isolated environments and will merge asynchronously.
- **Owners:** Each task has its own assigned task agent in an isolated environment. Refer to the project_tasks list.
- **Mitigation:** Cut the deploy from `main` at a known-green commit. Rolling subsequent merges into the live deploy is supported by Replit autoscale; verify each merge against `/api/health` post-merge.

### S6. `governance-restart-process.test.ts` carries an open failure
- **Status:** POST `/api/guardrail-configs` returns 500 inside the spawned production-bundle child process during the OS-level restart smoke test. Test was not skipped to make CI pass — it is catalogued as a known carried failure per the task contract.
- **Owner:** Task #4622 (feature-flag and runtime config API regression coverage) is the closest open task touching guardrail-configs surface; if that task does not resolve it, file a follow-up against the api-server route owner of `/api/guardrail-configs`.
- **What goes wrong:** A production restart could leave the guardrail-configs write path silently broken — but only if the bug exists at runtime, not just in the spawned-bundle path the test exercises. Manual smoke of `POST /api/guardrail-configs` against the deployed instance is required at T+5 minutes per the verification runbook.

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

- Several oversized route handlers (e.g. `command.ts` at 3,504 LOC, `prism-counsel-ops.ts` at 1,135 LOC, plus ~12 other handlers >1,000 LOC). Splitting is rewrite-shaped — defer.
- ~118k lines of docs across 172 files. Not a runtime risk.
- `attached_assets/` weight. Should be cleaned up but doesn't ship.
- Two ontology packages (`lib/ontology` vs `packages/ontology`). Plan consolidation post-launch.

## Recommended go/no-go

**Conditional go.** Launch only if B1, B3, and B4 are resolved (or the affected surfaces are hidden behind a feature flag). B2 is mitigatable with a "soft launch" — deploy at low traffic, watch metrics via `/api/health`, ramp up.

**No-go** if any of B1–B4 are open at T-30 minutes.
