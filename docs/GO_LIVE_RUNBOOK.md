# GO-LIVE RUNBOOK

Captured: 2026-04-23.

## Pre-launch checklist (T-60 minutes)

1. **Run the validation pipeline.** `pnpm test:api && pnpm brand:strings && pnpm exec playwright test tests/e2e/nexus-smoke.spec.ts --project=chromium` should be green.
2. **Confirm `DB_POOL_MAX`** is appropriate for the production Postgres tier. Default is now 12 (Phase 4 fix). If the production DB has a higher connection budget, set the env var explicitly.
3. **Verify Sentry DSN** is set for every artifact that has Sentry wired (Task #1412).
4. **Rotate `SESSION_SECRET`** if not done in the last 90 days.
5. **Confirm `attached_assets/`** has not been accidentally committed.
6. **Snapshot the database** — see `scripts/backup-db.sh`.
7. **Cleanup test records** — `pnpm cleanup:test-records`.

## Launch sequence

1. **Deploy.** Use Replit's deploy flow (`suggest_deploy` → user confirms in UI).
2. **Wait for `/api/health` and `/api/health/detailed`** to return 200 with all probe statuses non-error. The dedicated `healthPool` ensures these probes are independent of main-pool pressure.
3. **Smoke-test** the top investor-facing surfaces: `/`, `/counsel/`, `/terra/`, `/aegis/`, `/vessels/`, `/pulse/`, `/sentra/`.
4. **Tail Sentry for 15 minutes.** Watch for any new error fingerprint above noise floor.

## Operational runbook — common failure modes

### "sorry, too many clients already" on api-server boot
- **Cause:** DB connection budget exceeded. With the Phase 4 fix this should be rare. If it recurs:
- **Action:** Restart `artifacts/api-server: api` workflow. Investigate whether `DB_POOL_MAX` is being overridden upward in production env.
- **Long-term:** Move to a dedicated Postgres tier with higher max_connections.

### Workflow shows running but `/api/health` 502s
- **Cause:** Likely DB pool stuck (long-checkout leak). The OBS-007 sweeper logs structured warnings every 5s once a checkout exceeds `DB_CHECKOUT_WARN_THRESHOLD_MS` (default 30s).
- **Action:** Check logs for `event: "db.pool.checkout.long"`. The `stack` field will name the originating route handler.
- **Recovery:** Restart api-server workflow. Open an incident if it reproduces within an hour.

### Drizzle-kit push times out (post-merge)
- **Cause:** Known issue, non-fatal in dev. In production, schema migrations should be run as a discrete deploy step, **not** via post-merge push.
- **Action:** If a migration file lands in production, run it manually via `pnpm db:migrate` and confirm `pg_dump` schema after.

### A web artifact shows blank screen
- **Cause:** Most common is a misconfigured `VITE_*` env var causing a synchronous module-load throw (the Command artifact had this; fixed by wrapping `initTelemetry()` in try/catch).
- **Action:** Check browser console. Check workflow logs for the artifact's vite output. Restart the artifact workflow.
- **Long-term:** Apply the same try/catch defence pattern (used in `artifacts/command/src/main.tsx`) to other artifacts' bootstrap code.

### Mobile login fails (CORTEX)
- **Cause:** Either CSRF allowlist drift or OIDC config drift. The token-exchange flow is regression-tested by 8 vitest cases.
- **Action:** Run `pnpm --filter @workspace/api-server test src/routes/__tests__/mobile-auth-token-exchange.test.ts` first. If green, the bug is on the device side. If red, server-side regression — see Task #1425 changelog for the canonical fix.

## Post-launch (T+24 hours)

- Tail Sentry; triage any new fingerprints.
- Run `pnpm qa:site` and confirm all checks pass.
- Review `OBS-007` warnings for any consistently-leaking handler.
- Check `pg_stat_statements` (if enabled) for endpoints whose p95 latency exceeds expectations — schedule index work for the next iteration.
