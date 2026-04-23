# OBSERVABILITY AND ROI SCORECARD — Phase 6

Captured: 2026-04-23.

## Telemetry strengths in place

- `@szl-holdings/observability` — central package with named configs per artifact.
- `serverTelemetry.recordDbQueryLatency` — every `pool.query` instrumented in `lib/db`.
- **OBS-007** long-checkout detection: structured payload `{ event: "db.pool.checkout.long", obsRef: "OBS-007", checkoutId, ageMs, waitMs, thresholdMs, stack }`. Stack capture happens **before** the await, pinning at the originating route handler.
- Self-monitor cycle (`artifacts/api-server/src/lib/self-monitor.ts`) consumes `getLongRunningCheckouts()` and surfaces a recommended action.
- Sentry across all artifacts (Task #1412 landed earlier).
- Health probes split off main pool (`healthPool`); regression pinned by `health-pool-saturation.test.ts`.
- `VITE_OTEL_ENDPOINT` + `VITE_OTEL_HEADERS` wired in env loader (Zod-validated).

## Hardening shipped this pass

Command artifact telemetry no longer takes the page down on bad config (try/catch around `initTelemetry()`).

## Recommended canonical event taxonomy (NOT shipped this pass)

Aligned to the three flagship workflows (`FLAGSHIP_WORKFLOWS.md`):

| Prefix | Used by | Examples |
| --- | --- | --- |
| `incident.*` | W1 incident triage | `incident.signal.received`, `incident.triage.latency_ms`, `incident.escalation.created`, `incident.resolution.latency_ms` |
| `approval.*` | W2 approval routing | `approval.requested`, `approval.queue_depth`, `approval.turnaround_ms`, `approval.failed_action_rate`, `approval.bypass_attempt` |
| `briefing.*` | W3 executive briefings | `briefing.generation_latency_ms`, `briefing.recommendation_count`, `briefing.action_taken`, `briefing.dismissed` |
| `db.*` | Infra (already partial) | `db.query.latency_ms`, `db.pool.checkout.long` (= OBS-007) |
| `auth.*` | Infra | `auth.failure`, `auth.token_exchange.success`, `auth.token_exchange.failure` |
| `sse.*` | Infra | `sse.connection.opened`, `sse.connection.closed`, `sse.disconnect.unexpected` |

Promotion to a single shared `logEvent({ level, event, obsRef?, ...payload })` helper in `@szl-holdings/observability` is named in `CONSOLIDATION_DECISIONS.md` and deferred.

## Golden signals — current coverage

| Signal | Coverage today | Gap |
| --- | --- | --- |
| Latency | DB-query latency YES; per-endpoint latency partial | Add per-route p50/p95/p99 histogram |
| Traffic | Request count via Sentry transactions | Sufficient |
| Errors | Sentry across all surfaces | Sufficient |
| Saturation | OBS-007 (DB pool); event-loop lag NOT instrumented | Add event-loop-lag and memory pressure |

## Workflow signals — current coverage

| Required signal | Today | Action |
| --- | --- | --- |
| Incident triage latency | Hooks exist in scheduled-jobs / sentra | Surface as named event `incident.triage.latency_ms` |
| Approval queue depth | Calculable from Guardian state | Surface as gauge `approval.queue_depth` |
| Approval turnaround time | Calculable from audit log | Surface as `approval.turnaround_ms` |
| Failed action rate | Logged but not aggregated | Roll up as `approval.failed_action_rate` |
| Search latency | Per-route latency would cover | Add per-route latency |
| SSE disconnect rate | Not instrumented | Add `sse.disconnect.unexpected` count |
| Auth failure rate | Logged in mobile-auth tests; aggregate exists in Sentry | Surface as `auth.failure` named event |
| Slow-query count | YES, via `serverTelemetry.recordDbQueryLatency` over `SLOW_QUERY_THRESHOLD_MS` | Sufficient |

## ROI scorecard (recommended structure — NOT yet implemented)

Single endpoint on api-server (e.g. `/api/release-health/scorecard`) returning:

```json
{
  "windowDays": 7,
  "incident": {
    "signalsReceived": <int>,
    "triageMedianMs": <int>,
    "resolutionMedianMs": <int>
  },
  "approval": {
    "queueDepth": <int>,
    "turnaroundMedianMs": <int>,
    "failedActionRate": <float>
  },
  "briefing": {
    "generationMedianMs": <int>,
    "actionsTaken": <int>,
    "dismissalRate": <float>
  },
  "roiProxies": {
    "operatorTouchesReducedPerWeek": <int>,
    "decisionCycleTimeReductionMs": <int>,
    "costPerSuccessfulWorkflowEstimate": "<currency-string>",
    "failureRecoveryMedianMs": <int>
  }
}
```

This becomes the public-facing release-health surface — investor-friendly, evidence-backed, and tied to the three flagship workflows.

## What this pass DID NOT do

- Did not implement the `logEvent` helper.
- Did not stand up the ROI scorecard endpoint.
- Did not propagate the telemetry try/catch to the other 12 artifacts.
- Did not build a release-health dashboard.

What it did do: catalogue the strengths, name the gaps, and fix the one place where bad telemetry config could blank the user-facing app (Command). The structural plan is here for the next iteration.
