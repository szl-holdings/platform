# Phase 4 — Vessels real backend

## Goal
Replace every fixture / in-memory mock in Vessels with a real persisted
backend that uses the Phase-2 formulas and the A11oy primitive model.

## Audit (must run first)
- `rg -n "TODO|MOCK|fixture|sample-?data" artifacts/vessels/ artifacts/api-server/src/routes/vessels*`
- For each hit, decide: keep / wire to DB / drop.

## New / refactored routes (`artifacts/api-server/src/routes/`)

| Route                                   | Verb | Source of truth                          | Formula used                        |
|-----------------------------------------|------|------------------------------------------|-------------------------------------|
| `/api/vessels/fleet`                    | GET  | `vessels.fleet` table                    | none                                |
| `/api/vessels/positions`                | GET  | `vessels.position_log` table             | none                                |
| `/api/vessels/risk`                     | GET  | `vessels.risk_snapshot` table            | Phase-2 perturbation bound          |
| `/api/vessels/route-plan`               | POST | computed; persists to `vessels.route`    | Phase-2 anatomy-boundary lemma      |
| `/api/vessels/coexistence`              | POST | computed; persists `coexistence_report`  | Phase-2 null-space projection lemma |

All routes use the existing `sendSuccess` / `sendError` envelope and the
existing `authMiddleware` where appropriate.

## Database
- New Drizzle (or whatever the project uses — confirm in audit) schema file
  `artifacts/api-server/src/db/schema/vessels.ts` with the five tables above.
- Migration generated via existing tooling; checked in under `db/migrations/`.

## A11oy primitive mapping
- Each `fleet` row instantiates an **Anatomy**.
- Each `vessel` row instantiates a **Substance**.
- Each `route` row instantiates a **Connection** (with a null-space-projected
  RF coexistence vector).
- Each `port-call` instantiates a **Transformation**.
- Lutar Readiness is computed per-fleet from `risk_snapshot` aggregates and
  surfaced on the existing `/api/agi-forecast/status` payload under
  `summary.derived.vesselsLutar`.

## Frontend rewire
- `artifacts/vessels/src/lib/api.ts` swaps fixture imports for `apiFetch`
  calls against the new routes.
- Every page that currently renders fixture data adds loading / empty / error
  states; no silent fallbacks.

## Done looks like
- `pnpm --filter @artifact/vessels test` and
  `pnpm --filter @artifact/api-server test` both green.
- Playwright smoke (Phase 6) shows fleet → vessel → route → coexistence flow
  end-to-end against the real DB.
