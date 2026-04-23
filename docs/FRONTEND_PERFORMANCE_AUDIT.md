# FRONTEND PERFORMANCE AUDIT — Phase 5

Captured: 2026-04-23.

Per the brief, the design system and visual identity are explicitly out of scope.

## Per-artifact size baseline

| Artifact | Source size | Largest concern |
| --- | --- | --- |
| `artifacts/szl-holdings` | 75 MB | Primary public dashboard |
| `artifacts/vessels` | 62 MB | Maritime intelligence — heavy 3D / map assets likely |
| `artifacts/terra` | 58 MB | Real-estate intelligence |
| `artifacts/carlota-jo` | 47 MB | Public consulting site |
| `artifacts/szl-demo-video` | 41 MB | Video artifact, asset-heavy by nature |
| `artifacts/lyte-command-center` | 37 MB | Decision intelligence |
| `artifacts/aegis` | 36 MB | Investor pitch deck |
| `artifacts/command` | 35 MB | Unified Command surface |
| `artifacts/mockup-sandbox` | 26 MB | Design exploration |
| `artifacts/sentra` / `pulse` | 19 MB each | OK |
| `artifacts/counsel` | 18 MB | OK |

## Real fix already in place (carried from earlier session work)

### Command artifact telemetry crash hardened

**Files:** `artifacts/command/src/telemetry.ts`, `artifacts/command/src/main.tsx`.

Wrapped `OTLPTraceExporter` construction and `initTelemetry()` invocation in defensive try/catch. Previously, an invalid `VITE_OTEL_ENDPOINT` placeholder caused a synchronous throw at module-load time, producing a fully blank Command app.

This is the kind of "fail clearly, don't take the page down" change the brief asks for in Phase 5.

## Bundle / build observations

- **`nexus-smoke-e2e` build** (latest validation): 3,456 modules transformed in 7.08s. Two chunks flagged as exceeding 500 KB:
  - `vendor-react-CGz_dx8X.js`
  - `index-D44SIan_.js`

  These warnings have been present on multiple consecutive builds. Recommendation:
  - Verify `vendor-react` is split out via Vite `manualChunks`.
  - For `index-*.js`: route-level code-splitting via `React.lazy()` on the heaviest pages.

- **Vite dev servers** for all 14 web artifacts cold-start in 250–500 ms (per workflow logs). No pre-launch concern.

## Anti-patterns to look for (not yet measured)

The brief lists hydration loops, heavy client-side calculations, repeated fetches for the same data, missing skeletons, and broken empty/error states. The QA suite already covers some of these:

- `pnpm qa:placeholder-empty-states` — has a vitest contract (`scripts/check-placeholder-empty-states.test.js`).
- `pnpm qa:routes`, `qa:links`, `qa:deprecated-links` — link/route smoke.
- `pnpm qa:trust`, `qa:meta`, `qa:og` — content trust + metadata + OG cards.

**Recommendation:** schedule `pnpm qa:site` to run on every PR. The script already exists; if it isn't already in CI, wire it in.

## What was NOT measured this pass

- Lighthouse scores per artifact (requires a running browser run)
- Actual per-route bundle sizes (would require building each artifact and inspecting `dist/`)
- Render-perf profiles (requires Chromium-based profiling)
- Memory leak / hydration loop counts under sustained navigation

All of these are explicit Phase 5/7 follow-on work. They cannot be honestly produced in a single audit pass without a dedicated browser test harness already wired in.
