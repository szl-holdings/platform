# SZL Holdings — Operational Audit Harness

Dependency-light Node scripts (no extra installs beyond what the monorepo already has) for smoke testing, crawling, and load-testing the entire SZL Holdings ecosystem.

## Scripts

| Script | npm alias | Description |
|---|---|---|
| `ops/audit/smoke.mjs` | `pnpm audit:smoke` | Hit every route in `routes.json`, assert HTTP 200 |
| `ops/audit/url-audit.mjs` | `pnpm audit:crawl` | Crawl pages up to `MAX_PAGES`, check links & structure |
| `ops/audit/stress.mjs` | `pnpm audit:stress` | Concurrent load test with p95 latency threshold |
| *(all three)* | `pnpm audit:operational` | Run smoke → crawl → stress in sequence |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `TARGET_URL` | `http://localhost:3000` | Base URL to test |
| `EXPECTED_TEXT` | *(empty)* | Text that must appear in every response body |
| `MAX_PAGES` | `50` | Max pages for URL crawl |
| `STRESS_REQUESTS` | `50` | Total requests for stress test |
| `STRESS_CONCURRENCY` | `5` | Concurrent requests per batch |
| `MAX_P95_MS` | `3000` | p95 latency threshold (ms); fail if exceeded |
| `REPORT_DIR` | `ops/reports/` | Directory for JSON reports |

## Quick Start

```bash
# Smoke test local dev server
pnpm audit:smoke

# Crawl staging, up to 100 pages
TARGET_URL=https://staging.szlholdings.com MAX_PAGES=100 pnpm audit:crawl

# Stress test production (read-only safe)
TARGET_URL=https://szlholdings.com STRESS_REQUESTS=200 STRESS_CONCURRENCY=10 pnpm audit:stress

# Run all three in sequence
TARGET_URL=https://staging.szlholdings.com pnpm audit:operational
```

## Route Manifest

`ops/audit/routes.json` is the single source of truth for all known app routes. It lists every artifact with its preview path and sub-routes. Update this file when new apps or routes are added.

## Reports

All scripts emit JSON reports to `ops/reports/`:
- `smoke-report.json`
- `url-audit-report.json`
- `stress-report.json`

Reports are uploaded as GitHub Actions artifacts by `.github/workflows/operational-audit.yml`.

## Shared Utilities (`lib.mjs`)

`ops/audit/lib.mjs` exports:
- `env` — resolved environment config
- `fetchWithTimeout(url, ms)` — fetch with abort controller timeout
- `validateResponse(res, opts)` — check status, body text, latency
- `loadRoutes()` — parse `routes.json` into flat route list
- `buildUrl(base, path)` — safely join base URL + path
- `stats(values)` — min/max/mean/p50/p95/p99 from number array
- `writeReport(filename, data)` — write JSON to `REPORT_DIR`
- `printSummary(label, results)` — console summary + pass/fail count
