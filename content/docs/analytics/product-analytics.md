# Product Analytics — SZL Holdings

## Overview
Product analytics at SZL measures how users interact with the platform to inform product decisions. We track meaningful events — not vanity metrics.

## What We Track
See the full [Event Taxonomy](/analytics/events/event-taxonomy.md) for complete event definitions.

### Core Categories
- **Authentication**: Sign in/out, session lifecycle
- **Navigation**: Page views, search, filters
- **Entity Interactions**: Create, view, update, delete records
- **Workflows**: Trigger, approve, reject, complete
- **AI Actions**: Propose, approve, reject, evidence retrieval
- **Content**: Publish, view, click CTA, capture lead
- **Errors**: API failures, form validation, 404s

## Dashboards

### Weekly Product Review Dashboard
- Active users (WAU)
- Feature adoption rates
- Error rates
- Funnel conversion rates
- Content performance

### Per-Product Dashboard
Each product (Lyte, Terra, Vessels, Aegis, Carlota Jo) has its own dashboard tracking domain-specific KPIs.

## Experimentation
Before running experiments:
1. Define hypothesis
2. Define success metric
3. Set sample size
4. Configure feature flag for variant
5. Measure for minimum 2 weeks
6. Analyze results
7. Ship winner or iterate

## Privacy
- No PII in event properties
- Session IDs are anonymous
- Data retained for 90 days
- No third-party analytics services
- All data stored in platform database (dos_analytics_events, dos_page_views)

## Review Process
- **Weekly**: Product team reviews dashboards
- **Monthly**: Executive review of KPIs
- **Quarterly**: Deep dive on funnels and retention
