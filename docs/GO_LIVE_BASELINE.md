# GO-LIVE BASELINE

Captured: 2026-04-23 (Phase 0 of go-live hardening pass)
Branch: `master` (working directly on main per project policy)
HEAD: `50293181d` — Fix: forward OIDC nonce in mobile token exchange to unblock end-to-end login

## Repo scale

| Metric | Value |
| --- | --- |
| TypeScript source files (.ts/.tsx, excl. deps/build) | **5,144** |
| Total files in repo (excl. deps/build) | ~130,755 |
| Workspace projects | **143** (pnpm) |
| Web/mobile/video artifacts | **17** (15 in `artifacts/`, 2 not yet split) |
| `artifacts/api-server/src` LOC | **365,713** |
| Docs files (`docs/*.md`) | **172**, **~118,973 lines** |
| `attached_assets/` size | **129 MB** (user uploads — gitignore-eligible) |

## Largest single files in `artifacts/api-server/src`

| LOC | File |
| --- | --- |
| 3,973 | `routes/guardian.ts` |
| 3,764 | `routes/carlota-jo.ts` |
| 3,591 | `routes/command.ts` |
| 3,555 | `routes/terra-cognitive.ts` |
| 3,072 | `routes/nexus.ts` |
| 2,883 | `scripts/seed-aegis.ts` |
| 2,660 | `routes/pulse.ts` |
| 2,303 | `routes/cortex.ts` |
| 2,137 | `routes/firestorm/assets-cases.ts` |
| 2,077 | `routes/terra-modules.ts` |
| 2,014 | `lib/scheduled-jobs.ts` |
| 1,979 | `lib/email.ts` |
| 1,948 | `routes/vessels-modules.ts` |
| 1,946 | `routes/cms.ts` |

These 14 files alone account for ~36k LOC. Top-priority candidates for Phase 8 consolidation (split by feature, extract shared primitives) — **but must not be rewritten** per the brief.

## Build / typecheck baseline (after Phase 0 fixes)

| Check | Before | After fixes |
| --- | --- | --- |
| `pnpm -r typecheck` — `packages/connectors` | **FAIL** (missing module `@workspace/ontology/signal`) | **PASS** |
| `pnpm -r typecheck` — `lib/domain-claims` | **FAIL** (TS6305: `lib/config` not built) | **PASS** |
| `pnpm brand:strings` | PASS (3,892 stale baseline entries — should refresh) | unchanged |
| `pnpm -r typecheck` — full sweep | not run end-to-end this pass (140+ projects, ~10 min) | partial — run in Phase 7 |

**Two real typecheck blockers were fixed in this baseline pass** (see `docs/GO_LIVE_AUDIT.md` for fix details).

## Lint baseline

| Tool | Result |
| --- | --- |
| `oxlint .` | **842 warnings, 4 errors** across 5,154 files (1.3s) |
| `biome lint .` | not re-run this pass |

The 4 oxlint errors are go-live blockers and must be triaged in Phase 5/8.

## Test baseline

| Suite | Result |
| --- | --- |
| `nexus-smoke-e2e` (validation) | **PASS** — 22/22 Playwright tests, 15.6s, 28.8s wall |
| `security-tests` (api-server vitest) | run via task validation, **PASS** historically; latest run interrupted by post-merge storm |
| Skipped / `.todo` tests across repo | **114 instances** — owners must justify or delete |
| `lp-portal-uploads.test.ts` | **13/13 PASS** (Task #1388) |
| `mobile-auth-token-exchange.test.ts` | **8/8 PASS** (Task #1425) |
| `carlota-metrics.test.ts` | **5/5 PASS** (Task #1420) |

## Workflow / runtime baseline

All 14 web/mobile workflows are currently `running` after explicit restart. Recurring failure mode:

- **`artifacts/api-server: api`** crashes during post-merge storms with PostgreSQL `sorry, too many clients already`. Restart restores it. Tracked as a recurring operational toil — must be fixed in Phase 4 (DB pool sizing / queueing) before launch.
- **Drizzle-kit push times out** on every post-merge (`SIGTERM` after 60s). Documented as non-fatal; schema changes proceed via manual migrations.
- **Command artifact port-detection** has been observed to time out at workflow start despite Vite reporting `ready in <500ms`. Underlying cause is Replit platform timing, not application code.

## Database

- Engine: PostgreSQL (Replit-managed, `DATABASE_URL` provided)
- Schema source of truth: `lib/db/src/schema/` (drizzle-orm)
- Most recent migrations: `0028_carlota_team_members.sql` (Task #1420), `0043_firestorm_tool_audit_log.sql`
- Snapshots in `lib/db/drizzle/meta/`: 8+ files >200 KB (`0001`, `0045`, `0046`, `0054`) — normal but worth verifying none are orphaned

## Known platform issues (carried forward)

Documented in `replit.md` "Known Platform Issues":
1. Command port detection timing
2. Expo CORS for mobile previews
3. Vite WS HMR drift on sub-path apps (Pulse fix landed in Task #1423)
4. API server DB-pool exhaustion under merge-storm load **(blocker — Phase 4)**

## What this baseline does NOT yet cover

- Full `pnpm -r typecheck` clean run (interrupted by parallel work; will re-run in Phase 7)
- `biome lint .` clean run
- Lighthouse audit on each artifact's primary page
- Actual k6/autocannon load test under sustained traffic
- Soak / stress / failure-injection runs

These are the explicit scope of Phases 5–7 and will be added incrementally.
