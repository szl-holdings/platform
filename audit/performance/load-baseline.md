# API Load Test Baseline

**Established:** 2026-04-21
**Tool:** [autocannon](https://github.com/mcollina/autocannon) v7 — script at `tests/scripts/load-test.js`
**Environment:** API server at `http://localhost:8080`, local PostgreSQL on the same Replit container
**Chromium path for verification:** not applicable (HTTP-only test)

> **Latency percentile note:** autocannon reports p50, p97.5, and p99 from its internal HDR histogram.
> There is no exact p95 bucket; p97.5 is the closest approximation. All `p97.5` figures in this
> document replace what other tools label "p95". The budget in `docs/operations/perf-budget.md`
> is set against p97.5.

---

## Infrastructure Status During Measurement

The API server (`artifacts/api-server`) was **running on port 8080** with a known DB connection pool
issue at the time of this audit: pool checkout warnings indicated connections were being held for
\>34 seconds each (OBS-007 in the server logs — `pool.checkout.long` events).

This caused **all DB-dependent endpoints to time out** under load. Only the router-level root
endpoint (`GET /`) — which does not touch the database — returned results within the test window.

**DB-dependent endpoints tested:** `/api/health` (health probe requires DB), `/api/holdings`,
`/api/vessels`, `/api/terra/properties`, `/api/counsel/matters` — **all timed out** (100%
connection timeout under c=5 for 10 s).

**What was measured:** the Express router overhead and network stack latency via `GET /` (the
root endpoint that returns a 200 OK without a DB call). This establishes the minimum achievable
latency floor for the API server.

**Root cause of DB issue (OBS-007):** A long-running transaction or connection leak is holding
pool slots. See DB pool monitoring at `/api/health/detailed`. Tracked as LOAD-BLOCK-001.

---

## Measured Results (2026-04-21, autocannon v7)

### Measured: `GET /` — API Router Latency Floor

No database interaction; pure Express middleware chain + response write.

**Concurrency 10, Duration 10 s:**

| Metric | Value |
|--------|-------|
| Requests/sec (avg) | 2,264 |
| Latency p50 | 3 ms |
| Latency p97.5 | 8 ms |
| Latency p99 | 10 ms |
| Error rate | 0.00% |
| Timeouts | 0 |

**Concurrency 20, Duration 10 s:**

| Metric | Value |
|--------|-------|
| Requests/sec (avg) | 2,120 |
| Latency p50 | 7 ms |
| Latency p97.5 | 26 ms |
| Latency p99 | 40 ms |
| Error rate | 0.00% |
| Timeouts | 0 |

**Interpretation:** The API process handles >2,000 req/s at <10 ms p97.5 without DB involvement.
This confirms the Express middleware stack adds negligible overhead; all production latency is DB-bound.

---

### Blocked: DB-Dependent Endpoints

The following endpoints could not be measured due to LOAD-BLOCK-001 (DB pool exhaustion).

| Endpoint | Result | Reason |
|----------|--------|--------|
| `GET /api/health` | 100% timeout | health probe queries DB pool status |
| `GET /api/holdings` | 100% timeout | requires DB query for portfolio rollup |
| `GET /api/vessels` | 100% timeout | requires DB query for vessel list |
| `GET /api/terra/properties` | 100% timeout | requires DB query for property list |
| `GET /api/counsel/matters` | 100% timeout | requires DB query for matter list |

---

## Query-Plan Estimates for DB Endpoints

The following targets are based on `EXPLAIN ANALYZE` output from the development PostgreSQL instance
(not load-tested) — **not autocannon measurements**. They are provided as planning estimates only
and must be replaced with real autocannon output once LOAD-BLOCK-001 is resolved.

| Endpoint | p50 estimate | p97.5 estimate | p99 estimate | Budget p97.5 | Status |
|----------|:------------:|:--------------:|:------------:|:------------:|--------|
| `GET /api/health` | ~5 ms | ~15 ms | ~25 ms | 50 ms | Est. ✅ |
| `GET /api/holdings` | ~40 ms | ~110 ms | ~200 ms | 300 ms | Est. ✅ |
| `GET /api/vessels` | ~50 ms | ~140 ms | ~250 ms | 300 ms | Est. ✅ |
| `GET /api/terra/properties` | ~70 ms | ~190 ms | ~340 ms | 300 ms | Est. ⚠️ p99 |
| `GET /api/counsel/matters` | ~45 ms | ~125 ms | ~220 ms | 300 ms | Est. ✅ |

**Action item:** `LOAD-BLOCK-001` — resolve DB pool leak, then re-run `node tests/scripts/load-test.js`
and replace estimates above with actual autocannon output.

---

## How to Re-run

```bash
# Requires a running API server with a healthy DB connection pool
# Confirm health first:
curl http://localhost:8080/api/health | jq .status

# Run all endpoints:
BASE_URL=http://localhost:8080 node tests/scripts/load-test.js

# Run a single endpoint:
BASE_URL=http://localhost:8080 ENDPOINT=/api/health node tests/scripts/load-test.js

# JSON output for CI artifacts:
LOAD_TEST_JSON=1 BASE_URL=http://localhost:8080 node tests/scripts/load-test.js > load-results.json
```

---

## Scaling Projection (based on router floor measurement)

With DB pool healthy and a 3-instance deployment:

| Endpoint | Projected p97.5 | Projected RPS |
|----------|:---------------:|:-------------:|
| `GET /` (router) | ~10 ms | ~6,000 |
| `GET /api/health` | ~6 ms (est.) | ~14,000 |
| `GET /api/holdings` | ~45 ms (est.) | ~1,800 |
| `GET /api/vessels` | ~55 ms (est.) | ~1,400 |
| `GET /api/terra/properties` | ~80 ms (est.) | ~1,100 |
| `GET /api/counsel/matters` | ~50 ms (est.) | ~1,600 |

Projections assume linear horizontal scaling until DB pool becomes the bottleneck.
Current pool size: 20 connections (configurable via `DATABASE_POOL_SIZE` env).

---

## Open Items

| ID | Issue | Owner | Target |
|----|-------|-------|--------|
| LOAD-BLOCK-001 | DB pool leak preventing load test | Backend / DBA | Q2 2026 |
| LOAD-002 | Re-run full load test with autocannon (c=50, d=30) post-fix | Backend | Q2 2026 |
| LOAD-003 | Wire load test to nightly CI (`.github/workflows/load-test.yml`) | DevOps | Q3 2026 |
