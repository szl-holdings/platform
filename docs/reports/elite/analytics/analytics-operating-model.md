# Analytics Operating Model

## Purpose
Product analytics measures user behavior to inform product decisions. We track meaningful events — not vanity metrics.

## Infrastructure
- Events stored in dos_analytics_events table
- Page views stored in dos_page_views table
- Session tracking via anonymous session IDs
- No third-party analytics services

## Event Taxonomy
Full taxonomy in analytics/events/event-taxonomy.md with 50+ defined events across:
- Authentication, Navigation, Entity Interactions
- Workflows, AI Actions, Content/Distribution
- Support/Feedback, Export, Errors

## Naming Convention
`{domain}.{object}.{action}` — all lowercase, dot-separated

## Review Cadence
- **Weekly**: WAU, lead captures, content output, error rates
- **Monthly**: MAU, retention, activation, demo requests, per-product KPIs
- **Quarterly**: Growth trends, funnel conversion, product-market fit signals

## Dashboards
- Weekly Product Review Dashboard
- Per-Product Dashboards (Lyte, Terra, Vessels, Aegis, Carlota Jo)
- Content Performance Dashboard
- Error Rate Dashboard

## Current State
- Event taxonomy fully defined
- KPI map created
- Funnel definitions documented
- Naming conventions established
- **Not yet instrumented in application code** (P1 gap)
