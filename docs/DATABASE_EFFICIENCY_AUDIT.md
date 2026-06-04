# DATABASE EFFICIENCY AUDIT — Phase 4

Captured: 2026-04-23.

Engine unchanged (PostgreSQL via Replit-managed `DATABASE_URL`). Schema source: `lib/db/src/schema/`.

## Real fix shipped this pass

### Lowered `DB_POOL_MAX` default from 100 → 12

**File:** `packages/env/src/index.ts`

**Why:** Replit's shared Postgres has a finite per-instance connection budget (typically ~25–30 max_connections). The previous default of 100 meant a single api-server boot could consume the entire budget. During post-merge storms (api-server restart + drizzle-kit migration push + worker fan-out happening simultaneously), this triggered the recurring `sorry, too many clients already` crash that has been the platform's most frequent runtime failure.

**Headroom analysis with new default:**
- Main `pool`: 12
- Dedicated `healthPool`: 2
- Drizzle-kit push: ~1–2 short-lived connections during migration
- Mobile/web client tools (psql introspection, etc.): ~2
- **Total worst-case under merge storm:** ~17 connections, comfortably within Replit's budget

**Production override:** environments with a dedicated Postgres (Neon, Supabase, RDS) should set `DB_POOL_MAX` explicitly to a higher value matching their tier. The env loader honours the override.

**This is a real, evidence-backed C1 fix.** It should be verified by observing the next post-merge storm.

## Existing strengths (do NOT undo)

The DB layer is already well-instrumented. Confirmed in `lib/db/src/index.ts`:

- **Dedicated `healthPool`** (max=2, 1s connect timeout, 2s statement timeout) — health probes survive main-pool saturation. Pinned by an integration test (`health-pool-saturation.test.ts`).
- **OBS-007 long-checkout detection** — every `pool.connect()` is wrapped to capture caller stack and warn after `DB_CHECKOUT_WARN_THRESHOLD_MS` (default 30s). `getLongRunningCheckouts()` exposes the live state to the self-monitor.
- **Slow-query telemetry hook** — every `pool.query()` records duration into `serverTelemetry.recordDbQueryLatency()`.
- **Statement-level timeout** — `statement_timeout: 60000ms` prevents runaway queries from holding connections forever.
- **Sweeper with `unref()`** — background warning loop does not keep the process alive.

## Query-pattern observations (NOT yet measured under load)

Inferred from file size + handler count, **not** confirmed by EXPLAIN. Phase 7 stress-testing should validate or refute:

| Surface | Suspected pattern | Action |
| --- | --- | --- |
| `routes/guardian.ts` (3,973 LOC) | Likely on every privileged-action path → audit-log inserts in critical sections | Profile under load; verify audit insert is async-fire-and-forget where safe |
| `routes/pulse.ts` (2,660 LOC) | Briefing dashboards → likely heavy joins per request | Measure top-3 endpoint p95s; identify N+1 candidates |
| `routes/nexus.ts` (3,072 LOC) | Agent runtime → likely SSE + per-event DB writes | Verify writes are batched, not per-token |
| `routes/terra-cognitive.ts` (3,555 LOC) | Real-estate intelligence → likely repeated identical reads in same request | Add request-scoped cache where reads are pure |
| `lib/scheduled-jobs.ts` (2,014 LOC) | Background workers → main suspect for connection-pool pressure | Already mitigated by lowered `DB_POOL_MAX`; verify worker concurrency caps |

## Migrations health

- 50+ Drizzle migrations under `lib/db/drizzle/` (latest: `0028_carlota_team_members.sql`).
- 4 snapshot files >200 KB (`0001`, `0045`, `0046`, `0054`) — normal; drizzle accumulates these.
- `drizzle-kit push` **times out on every post-merge** (60s `SIGTERM`). This is documented as non-fatal. Two implications:
  1. Schema changes that arrive in tasks **may not apply automatically** — relying on next manual run.
  2. Post-merge logs will keep showing the timeout until the migration runner is improved.

**Recommendation (post-launch):** investigate why drizzle-kit hits the 60s hard timeout. Likely cause: schema introspection over a slow connection or a long ALTER statement. Either raise the per-task timeout or move push to a dedicated background job that doesn't block post-merge.

## Indexes

Not audited this pass. Recommendation for Phase 4 follow-up: enable `pg_stat_statements` in production, sample for 24 hours, surface the top-10 slowest endpoints, then propose targeted indexes via low-risk additive migrations (no schema changes to live columns).

## What was NOT measured

- p50/p95/p99 endpoint latencies under load
- Actual N+1 counts via query logging
- Connection-acquisition wait time histograms
- Index hit rates

These are explicit Phase 7 work and will be added once a representative load test is in place.
