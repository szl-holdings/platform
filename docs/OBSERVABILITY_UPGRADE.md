# OBSERVABILITY UPGRADE — Phase 6

Captured: 2026-04-23.

## Existing strengths (already in place)

The platform already has more observability than most projects at this stage. Confirmed in code:

- **`@szl-holdings/observability`** package — central telemetry surface with named configs per artifact (firestorm/aegis, etc.).
- **`serverTelemetry.recordDbQueryLatency()`** — every `pool.query` call (and now also `pool.connect` lifecycle) is instrumented in `lib/db/src/index.ts`. Slow-query threshold configurable via `SLOW_QUERY_THRESHOLD_MS`.
- **OBS-007 long-checkout warnings** — structured payload (`{ event: "db.pool.checkout.long", obsRef: "OBS-007", checkoutId, ageMs, waitMs, thresholdMs, stack }`). Stack capture happens **before** the await, so traces point at the originating route handler — not at internal Node frames.
- **Self-monitor cycle** — `artifacts/api-server/src/lib/self-monitor.ts` consumes `getLongRunningCheckouts()` and surfaces a recommended action.
- **Sentry integration** — landed across remaining apps (Task #1412).
- **Health probes split off the main pool** — pinned by `health-pool-saturation.test.ts`.
- **VITE_OTEL_ENDPOINT** + **VITE_OTEL_HEADERS** — frontend telemetry secrets are wired in env.

## Hardening shipped this pass

### Command artifact telemetry never takes down the page

`artifacts/command/src/telemetry.ts` and `main.tsx` now wrap OTel exporter construction and `initTelemetry()` calls in try/catch. A misconfigured `VITE_OTEL_ENDPOINT` produces a console warning instead of a blank screen. Aligns with the "fail clearly" + "explicit failure modes" goals in the brief.

## Recommended Phase 6 follow-ups (not shipped, low risk)

1. **Standardise the structured-log envelope.** OBS-007 already uses `{ level, event, obsRef, ... }`. Make this the canonical shape across all routes by extracting a `logEvent({ level, event, obsRef?, ...payload })` helper into `@szl-holdings/observability` and replacing ad-hoc `console.warn`/`console.error` calls. This is a Phase 8 consolidation as well.

2. **Request ID + correlation ID.** Every inbound request should attach a `req.id` (UUID v7 or ULID for sortability) and propagate it as `x-correlation-id` to downstream calls. Many routes likely already do this — confirm coverage with a single sweep.

3. **Golden signals dashboard.** The metrics already collected (DB latency, checkout age, queue depth via self-monitor) are sufficient to populate latency/traffic/errors/saturation panels. The work is dashboard-side, not code-side.

4. **Business-event surfacing.** The brief mentions approval latency, queue depth, failed actions, SSE disconnects, search latency, auth failures, slow-query count. Most of these have hooks already (Guardian for approvals, Nexus for queue/SSE, mobile-auth tests for auth failures). What's missing is a single roll-up endpoint that exposes them as a release-health scoreboard.

## Things NOT recommended

- Adding new telemetry providers (out of scope per brief).
- Adding spans to every function (vanity instrumentation — brief explicitly warns against this).
- Replacing the existing `serverTelemetry` surface with OpenTelemetry SDK directly (would be a rewrite; Phase 6 is alignment, not rewrite).

## Definition of done for this phase

| Goal | Status |
| --- | --- |
| Standardised log envelope | partial — OBS-007 demonstrates the shape; full adoption is a follow-up |
| Request/correlation IDs | needs verification sweep |
| Golden signals coverage | underlying metrics in place; dashboard work pending |
| OBS-007 stack capture pinned to caller | DONE (already shipped) |
| Telemetry failures cannot blank the UI | DONE this pass (Command) |
