# Infrastructure Audit — 2026-05-27

Scope: monorepo-wide. Pass: Series-A push, ROSIE/Jarvis as the command surface.

## Snapshot
- **Workflows running:** 8 artifacts (a11oy / api-server / conduit / rosie / rosie-mobile / sentra / vessels / vessels-pitch). All green.
- **Lean:** `lean` workflow completed (pure-Lean-4 build, mathlib dropped per `lean-formulas-pure-core` memo).
- **Database:** 947 public tables, 1,120 receipts in `proof_ledger`, 55 vessels seeded, 12 drizzle migrations applied.
- **GitHub org:** 20 repos, 19 active, 1 archived. See `github-org-audit-2026-05-27.md`.

## Findings

### G1 · Port-binding pattern is now consistent (✓)
Every artifact's `vite.config.ts` either binds `::` (IPv6 dual-stack) or `0.0.0.0` and reads `VITE_PORT` (with `PORT` fallback). This matches `replit-workflow-port-prober` + `artifact-direct-bind-port-pattern-broken` memos — no artifact still uses the broken "direct-bind" pattern. **No fix needed.**

### G2 · `rosie` workflow uses `kill-stale-vite-ports.sh` (✓)
The dependency-free port releaser is prepended to the rosie `run` command, defusing the EADDRINUSE-on-restart class of bugs. `vessels-pitch` uses it too. Consider applying to all 8 artifacts for consistency.

**Recommendation (low-risk):** add the kill-stale-vite-ports prefix to remaining artifacts. Deferring — current restarts are clean.

### G3 · Drizzle migrations: 12 applied, no drift signal
Migrations 0000 → 0011 in `lib/db/drizzle/`. Last one is `0009_firestorm_hardening_platform.sql`-class. `drizzle-kit check` not run this pass (would need its own workflow). **Recommend:** add a `drizzle:check` step to CI.

### G4 · `risk-formula-drift` workflow not started this session
Per session plan, this check is intentionally one-shot during validation. The pre-existing drift on `packages/ising-calibration-kit/src/noise-model.ts` (noted in prior pass) is out of scope for this Series-A push; flag for next sprint.

### G5 · Doctrine v6 scanner — not triggered this pass
`scripts/check-originality.sh`, `check-zod-coverage.sh`, `check-generic-empty-states.sh`, `check-python-sidecar-bootstraps.sh` all present. Run before merging the Jarvis surface to catch any drift.

### G6 · ROSIE web Jarvis aggregator (✓ shipped this pass)
New `/api/rosie/jarvis/overview` endpoint fans across 6 slices (vessels / a11oy / sentra / conduit / uds / proofChain) with per-slice try/catch graceful degradation. Per-call cost: ~410ms wall (dominated by sentra's 386ms count query — acceptable for a 30s-polled summary). All 6 slices return `status: ok` against real data:
- 1,114 sealed receipts, +181 in last 24h
- 55 vessels across 4 fleets, 60 open exceptions over 220 voyages
- 1,453 open incidents, 235 alerts/24h on Sentra
- 5 UDS bundles cosigned + registered

### G7 · ROSIE mobile expansion (✓ shipped this pass)
Tabs went from 1 (Approvals) to 4 (Jarvis / Approvals / Optimizer / Receipts). All four hit live api-server routes; no mock data. Web preview returns 200 on every tab path.

### G8 · A11oy bundle integrity reviewer wiring intact
Per `a11oy-perception-reviewer-wiring` memo, the perception-loop privacy invariant is enforced by a serialization test (raw frame bytes must never appear in the envelope). Not modified this pass. No drift.

### G9 · Secret hygiene
3 env secrets present: `GH_WORKFLOW_TOKEN`, `VITE_OTEL_ENDPOINT`, `VITE_OTEL_HEADERS`. All used; none leaked into source per a quick `rg`. Memory: never log values.

## Applied this pass
- ROSIE web: new `/api/rosie/jarvis/overview` aggregator (6-slice fanout, all green on real data).
- ROSIE web: `Jarvis.tsx` becomes the landing at `/`; Identity demoted to `/identity`; Shell nav updated.
- ROSIE mobile: 3 new tab screens (`jarvis.tsx`, `optimizer.tsx`, `receipts.tsx`); `_layout.tsx` updated for both NativeTabs (iOS 26 liquid glass) and ClassicTabLayout (web/Android/older iOS) paths.

## Top-10 next upgrades (ranked by value/risk ratio)
1. **CI for `rosie` repo** — copy Scorecard/CodeQL/Docs-CI from `vessels`. 1-commit fix. (See GitHub audit F1.)
2. **Web-UI org actions** — 2FA enforcement + Code security config to all public repos + branch protection on 8 core repos. ~10 min. (See GitHub audit F2-F4.)
3. **Drizzle check in CI** — add `pnpm --filter @workspace/db run check` to a workflow on schema changes.
4. **risk-formula-drift fix** — resolve the `noise-model.ts` drift in `packages/ising-calibration-kit/` (out of this pass).
5. **Per-slice latency budget on `/jarvis/overview`** — sentra's 386ms is 90% of the call. Add a 50-row LIMIT + index audit on `sentra_alerts` / `sentra_incidents` aggregates.
6. **Push protection on private repo `platform`** — needs GitHub Advanced Security (paid). Cost/risk decision.
7. **Add port-kill prefix to remaining artifacts** (4 of 8 still bare). Defensive against EADDRINUSE restart flakes.
8. **`drizzle-kit generate` smoke** in pre-push to catch unmigrated schema edits.
9. **OTEL endpoint health probe** — `VITE_OTEL_ENDPOINT` set but no liveness check in CI.
10. **ROSIE mobile push notifications** — wire `expo-notifications` to api-server `/rosie/solve/queue` events so field operators get HITL pings instead of polling.

## What's NOT in this audit
- AGI Forecast Status sidecar deep-dive (separate workflow, last reviewed in `api-server-auth-middleware-is-factory` pass).
- Lean mathlib restoration (per `lean-mathlib-build-cost` — explicitly deferred).
- Production database schema for the deployed app (this audit covers dev; prod uses `database` skill with `environment: "production"`).
