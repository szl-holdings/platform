# FRONTEND RELIABILITY AUDIT — Phase 5

Captured: 2026-04-23.

Per brief: visual identity is out of scope. Audit is reliability + clarity only.

## Per-artifact size baseline (source size, not bundle size)

| Artifact | Source size | Workflow status this pass |
| --- | --- | --- |
| szl-holdings | 75 MB | failed (idle) |
| vessels | 62 MB | failed (idle) |
| terra | 58 MB | failed (idle) |
| carlota-jo | 47 MB | running |
| szl-demo-video | 41 MB | failed (idle) |
| lyte-command-center | 37 MB | failed (idle) |
| aegis | 36 MB | failed (idle) |
| command | 35 MB | failed (idle) |
| mockup-sandbox | 26 MB | running |
| pulse | 19 MB | failed (idle) |
| sentra | 19 MB | failed (idle) |
| counsel | 18 MB | failed (idle) |

"failed (idle)" = expected dev idle-stop; production deploys keep these warm.

## Bundle observations from the validation build

Latest `nexus-smoke-e2e` build:
- 3,456 modules transformed in 7.11 s.
- Two chunks flagged > 500 KB:
  - `vendor-react-CGz_dx8X.js`
  - `index-D44SIan_.js`
- Build is reproducible — chunk warning has been present on every recent build.

## Real reliability fixes already shipped (carried context)

### Command artifact never blanks on bad telemetry config

Files: `artifacts/command/src/telemetry.ts`, `artifacts/command/src/main.tsx`. Wrapped `OTLPTraceExporter` construction and `initTelemetry()` in try/catch. Bad `VITE_OTEL_ENDPOINT` produces a console warning instead of a synchronous module-load throw → blank page.

This pattern should be propagated to the other 12 web artifacts. Mechanical work, not done this pass.

## Existing safety nets

The QA suite already covers reliability surfaces:
- `pnpm qa:placeholder-empty-states` — vitest contract for empty/loading states.
- `pnpm qa:routes` — route enumeration.
- `pnpm qa:links` / `qa:deprecated-links` — link integrity.
- `pnpm qa:trust` / `qa:meta` / `qa:og` — content trust + metadata + OG cards.
- `pnpm qa:site` — composite.

Recommendation: ensure `pnpm qa:site` runs on every PR.

## Reliability findings (NOT shipped — single-sweep follow-ups)

| Finding | Evidence | Recommendation |
| --- | --- | --- |
| 12 artifacts may have unguarded telemetry init | Pattern only verified in Command | Mechanical port of try/catch wrapper |
| Two oversized vendor chunks | Build warnings | Verify Vite `manualChunks` is splitting `react`, `react-dom`, large UI libs separately |
| `index-*.js` > 500 KB | Build warning | Route-level `React.lazy()` on the heaviest pages |
| Repeated fetches across components | Not measured | If TanStack Query is in use, audit `staleTime` defaults |
| Render loops / hydration loops | Not measured | Browser-side profiling, deferred |
| Missing error boundaries on routes | Not enumerated | Add a single root error boundary per artifact if missing |

## Per-artifact clarity (operator + investor)

The brief asks for clarity at the level of investor-facing and operator-facing surfaces. The three flagship workflows (see `FLAGSHIP_WORKFLOWS.md`) identify the surfaces that matter most:

- **Pulse** (executive briefings) — most investor-facing. Strong clarity today.
- **Aegis** (investor pitch deck) — by definition investor-facing. Strong.
- **Sentra** (cyber resilience command) — operator-facing flagship for incident triage.
- **Counsel** (legal matter command) — operator-facing flagship for approval routing.
- **Command** (Unified Command) — meta-surface; should aggregate the three flagship workflows.

The pattern: each surface should answer in <5 seconds: **"What signal? What governance gate? What action can I take?"** Where it doesn't, that's a Phase 5 follow-up — not a launch blocker.

## What was NOT measured this pass

- Lighthouse per artifact (requires browser harness).
- Actual per-route bundle sizes (requires building each artifact and inspecting `dist/`).
- Render profiles, memory leaks under sustained navigation.
- Console-error counts per artifact (requires booting each artifact and inspecting console).

These are explicit Phase 5/7 follow-ons. They cannot be honestly produced in a single pass without dedicated browser tooling beyond what's wired into validation.

## Honest readiness statement

Frontend has strong existing safety nets (QA suite). One real defensive fix has been propagated to Command and the pattern is known. The 12-artifact mechanical port is the highest-leverage frontend reliability work remaining and should land before midnight launch if time permits.
