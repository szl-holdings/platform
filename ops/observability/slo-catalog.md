# SLO Catalog

Generated: 2026-04-15

## API Server SLOs

| SLO | Target | Measurement | Alert Threshold |
|-----|--------|-------------|-----------------|
| Availability | 99.9% | % of /health/live returning 200 | < 99.5% over 5m |
| API Latency (p95) | < 500ms | 95th percentile response time | > 750ms over 5m |
| API Latency (p99) | < 2000ms | 99th percentile response time | > 3000ms over 5m |
| Error Rate | < 1% | % of 5xx responses | > 2% over 5m |
| Auth Failure Rate | < 5% | % of 401/403 on auth endpoints | > 10% over 5m (brute force signal) |
| DB Query Latency | < 100ms | Average query execution time | > 250ms over 5m |

## Web App SLOs

| SLO | Target | Measurement |
|-----|--------|-------------|
| Page Load (LCP) | < 2.5s | Largest Contentful Paint |
| Interactivity (FID) | < 100ms | First Input Delay |
| Visual Stability (CLS) | < 0.1 | Cumulative Layout Shift |
| Time to Interactive | < 3.5s | TTI for flagship pages |

## AI Feature SLOs

| SLO | Target | Measurement |
|-----|--------|-------------|
| AI Response Time | < 10s | Time from request to complete response |
| AI Availability | 99% | % of AI requests that return valid responses |
| AI Fallback Rate | < 5% | % of requests falling back to cached/default |

## Mobile SLOs

| SLO | Target | Measurement |
|-----|--------|-------------|
| App Launch Time | < 2s | Cold start to interactive |
| Crash Rate | < 1% | Sessions with crashes / total sessions |
| Offline Sync | < 30s | Time to sync when connectivity restored |

## Monitoring Dashboard Spec

### Primary Dashboard Panels
1. Request rate (rpm) — time series
2. Error rate (%) — time series with threshold line
3. Latency distribution (p50/p95/p99) — time series
4. Active sessions — gauge
5. Database connection pool — gauge
6. AI provider health — status indicators
7. Top 10 slowest routes — table
8. Recent errors — log stream
