# Performance Budget

**Owner:** Platform Engineering  
**Status:** Active — enforced as CI warnings; hard-fail gate to be enabled by Q3 2026  
**Last reviewed:** 2026-04-21  
**Related docs:** `audit/performance/lighthouse-baseline.md`, `audit/performance/load-baseline.md`

---

## Purpose

This document codifies the performance targets for the SZL Holdings platform. Targets are derived from:
- Google Core Web Vitals thresholds (Good / Needs Improvement / Poor)
- Lighthouse category score recommendations for B2B SaaS investor demos
- Observed baselines from the 2026-04-21 load test and Lighthouse run
- Competitive benchmarking against peer-tier platforms

Targets serve as a shared yardstick so any PR that regresses performance is caught in CI before it reaches main.

---

## Frontend Performance Targets (Lighthouse / Core Web Vitals)

### Lighthouse Category Scores

| Category | Warning threshold (current) | Hard-fail threshold (Q3 2026) | Rationale |
|----------|:---------------------------:|:-----------------------------:|-----------|
| Performance | ≥ 70 | ≥ 80 | Investor demo environments use fast networks; 80 is achievable with code splitting |
| Accessibility | ≥ 85 | ≥ 90 | WCAG 2.1 AA baseline; growth capital diligence floor |
| Best Practices | ≥ 90 | ≥ 95 | HTTPS, no deprecated APIs, CSP headers |
| SEO | ≥ 85 | ≥ 90 | Public-facing marketing pages need indexability |

### Core Web Vitals

| Metric | Good | Needs Improvement | Poor | Our Target |
|--------|:----:|:-----------------:|:----:|:----------:|
| Largest Contentful Paint (LCP) | < 2.5 s | 2.5–4 s | > 4 s | **< 2.5 s** |
| Interaction to Next Paint (INP) | < 200 ms | 200–500 ms | > 500 ms | **< 200 ms** |
| Cumulative Layout Shift (CLS) | < 0.1 | 0.1–0.25 | > 0.25 | **< 0.1** |
| First Contentful Paint (FCP) | < 1.8 s | 1.8–3 s | > 3 s | **< 2 s** |
| Total Blocking Time (TBT) | < 200 ms | 200–600 ms | > 600 ms | **< 300 ms** |

### Bundle Size Budget

| Asset type | Per-artifact budget | Notes |
|-----------|:-------------------:|-------|
| Initial JS (gzip) | ≤ 350 KB | Achieved via route-level code splitting |
| Initial CSS (gzip) | ≤ 50 KB | Tailwind purge + component-level CSS |
| Total page weight (uncompressed) | ≤ 3 MB | Including images, fonts |
| Third-party scripts | ≤ 100 KB (gzip) | Analytics, error monitoring only |

**Exceptions:**
- `command` (Unified Command Portal): up to 500 KB initial JS due to domain aggregation
- `terra` (Real Estate Intelligence): up to 1.2 MB initial JS due to Mapbox GL JS; must lazy-load

---

## API Latency Targets

All measurements at **50 concurrent connections** on a single API instance.

| Percentile | Target | Hard limit |
|-----------|:------:|:----------:|
| p50 | < 100 ms | 150 ms |
| p97.5 | < 300 ms | 500 ms |
| p99 | < 500 ms | 1,000 ms |

**Endpoint-specific targets:**

| Endpoint | p50 target | p97.5 target | Notes |
|----------|:----------:|:----------:|-------|
| `GET /api/health` | < 20 ms | < 50 ms | Pure in-memory |
| `GET /api/holdings` | < 60 ms | < 150 ms | Cached after first hit |
| `GET /api/vessels` | < 75 ms | < 200 ms | GeoJSON serialization |
| `GET /api/terra/properties` | < 80 ms | < 200 ms | Requires `PERF-001` index |
| `GET /api/counsel/matters` | < 60 ms | < 150 ms | Well-indexed list |
| Auth endpoints (`/api/auth/*`) | < 150 ms | < 400 ms | bcrypt cost + session write |
| File upload / export endpoints | < 500 ms | < 2,000 ms | Async where possible |

**Error rate target:** < 0.1% under normal load; < 1% during sustained 2× peak load.

---

## Availability Target

| Environment | Target SLA | Measurement window |
|------------|:----------:|-------------------|
| Production | 99.9% | 30-day rolling |
| Staging | 99.0% | 7-day rolling |

---

## Tracking Open Issues

| ID | Description | Owner | Target |
|----|-------------|-------|--------|
| PERF-001 | Add composite index for `GET /api/terra/properties` | Backend / DB | Q2 2026 |
| PERF-002 | Code-split Recharts in `szl-holdings` — LCP 3.4 s → target 2.5 s | SZL Holdings frontend | Q2 2026 |
| PERF-003 | Lazy-load Mapbox GL JS in `terra` — LCP 3.5 s → target 2.5 s | Terra frontend | Q2 2026 |
| PERF-004 | Route-split domain panels in `command` — TBT 480 ms → target 300 ms | Command frontend | Q2 2026 |
| PERF-005 | Move PCAP parser to Web Worker in `sentra` — TBT 380 ms → target 300 ms | Sentra frontend | Q3 2026 |

---

## CI Enforcement

### Lighthouse (frontend)

The Lighthouse CI workflow (`.github/workflows/lighthouse.yml`) runs on every PR and push to `main`. Scores below the **warning threshold** produce a failing GitHub check annotation but do **not** block merge until the flag is flipped to hard-fail mode.

To flip to hard-fail:
```bash
# In .lighthouserc.json, change all "warn" → "error"
# Then update lighthouse-gate job: remove continue-on-error: true
```

### Load tests (API)

The load test script (`tests/scripts/load-test.js`) is not yet wired into CI as a blocking gate (it requires a live database). Run it manually before releases:

```bash
DATABASE_URL=$DATABASE_URL PORT=5000 pnpm --filter @workspace/api-server run start &
sleep 5
node tests/scripts/load-test.js
```

Target: wire into a nightly CI job with a dedicated test database by Q3 2026.

---

## Review Cadence

| Review type | Frequency | Trigger |
|-------------|-----------|---------|
| Score drift check | Every PR (automated) | Lighthouse CI |
| Budget target review | Quarterly | Team lead + growth capital milestone |
| Load test re-baseline | Before each major release | Platform engineering |
| CWV field data review | Monthly | After production monitoring is in place |
