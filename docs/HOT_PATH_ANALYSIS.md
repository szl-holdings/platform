# HOT PATH ANALYSIS — Phase 3

Captured: 2026-04-23.

A "hot path" here is any code path that runs on every authenticated request, every privileged write, every SSE event, or every scheduled job tick. These are the places where a small inefficiency becomes a large bill or a user-facing latency spike.

## Identified hot paths

### HP1. `pool.connect()` → `client.release()` lifecycle (`lib/db/src/index.ts`)

- **Per-call overhead:** stack capture (Error().stack), Map insert, Map delete on release, OBS-007 timer arm.
- **Frequency:** every DB checkout — i.e. nearly every authenticated request.
- **Verdict:** Necessary cost. Stack capture is intentional (debugging value > nanoseconds saved). Map operations are O(1). No optimisation needed.
- **Watch:** if checkout count grows >1k/sec, consider sampling stack capture (1 in N).

### HP2. `pool.query()` slow-query timer (`lib/db/src/index.ts`)

- **Per-call overhead:** `performance.now()` × 2, dynamic `import()` of observability package on slow path.
- **Frequency:** every query.
- **Verdict:** Acceptable. The dynamic import is cached after first call (Node caches ESM imports).
- **Cleanup opportunity:** the two ad-hoc fallback `import()` blocks should be deduped into one helper (`recordQueryLatencySafe`). Named in `CONSOLIDATION_DECISIONS.md`.

### HP3. Global auth enforcer (`middlewares/global-auth-enforcer.ts`)

- **Per-call overhead:** path-allowlist check (Set lookup or array scan) + session lookup.
- **Frequency:** every request.
- **Verdict:** Allowlist must be a Set, not an Array, for O(1) lookup. **Not verified this pass — single inspection is a 5-minute follow-up.**

### HP4. Guardian privileged-action gate (`routes/guardian.ts`)

- **Per-call overhead:** policy lookup + audit log insert + signal capture.
- **Frequency:** every privileged write.
- **Verdict:** Audit log insert is the dominant cost. **Recommend:** verify the insert is async fire-and-forget (or at minimum, batched) where the action is read-after-write idempotent. Risk is data loss on crash; mitigation is queue + retry. **Not verified this pass.**

### HP5. SSE / streaming event paths (`routes/nexus.ts`)

- **Per-event overhead:** JSON serialisation + write to socket + optional DB insert per event.
- **Frequency:** N events per stream × M concurrent streams.
- **Verdict:** Per-event DB inserts are the worst case. **Recommend:** batch inserts every 50ms or every 50 events, whichever first. **Not verified this pass.**

### HP6. Background scheduled jobs (`lib/scheduled-jobs.ts`, 2,014 LOC)

- **Per-tick overhead:** spawn N job runners, each acquires a DB connection.
- **Frequency:** per tick (configurable).
- **Verdict:** With `DB_POOL_MAX=12` and a healthy worker concurrency cap, this is bounded. **Recommend:** map worker concurrency × job count to pool budget — confirm the worst case fits in 12 minus the request-path budget.

### HP7. Frontend telemetry init (every artifact's `main.tsx`)

- **Per-app boot overhead:** OTel exporter construction + endpoint wire-up.
- **Frequency:** once per page load.
- **Verdict:** Already hardened in Command (try/catch around `initTelemetry()`). **Recommend:** apply the same defensive pattern to the other 12 artifacts. **Not done this pass** — but the pattern is in place to copy.

## Findings ranked by impact × effort

| # | Finding | Impact | Effort | Recommendation |
| --- | --- | --- | --- | --- |
| 1 | Verify global auth allowlist is a Set | LOW (correctness, micro-perf) | TINY | 5-minute sweep |
| 2 | Confirm Guardian audit insert is fire-and-forget where safe | MEDIUM (user-visible latency on every privileged action) | SMALL | Single sweep + targeted change |
| 3 | Apply Command's telemetry try/catch to other 12 artifacts | MEDIUM (any one of them can blank the page on bad config) | SMALL × 12 | Mechanical |
| 4 | Verify SSE-per-event DB inserts are batched | MEDIUM-HIGH at scale | MEDIUM | Inspect; batch if not |
| 5 | Map worker concurrency to pool budget | LOW (mitigated by `DB_POOL_MAX=12`) | SMALL | Doc + maybe lower worker concurrency |
| 6 | Dedupe `recordQueryLatencySafe` | TINY | TINY | Named in consolidation doc |
| 7 | Sample stack capture on `pool.connect` if traffic grows | LOW now | SMALL | Watch metric first |

## What was NOT measured

- Actual nanosecond costs of any of the above — would require microbenchmarks in a controlled environment.
- Real-world hot-path frequency under production traffic — Phase 7 work.
- Memory retention across long-lived sessions — heap profile, not part of this pass.

## Posture

The hot paths are well-instrumented but not all yet optimised. The most important fix (DB pool exhaustion) shipped this pass. The next-most-important fixes are mechanical (telemetry try/catch propagation) or single-sweep inspections (allowlist Set, Guardian audit fire-and-forget). None require domain-logic changes.
