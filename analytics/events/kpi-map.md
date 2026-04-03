# KPI Map — SZL Holdings

## Platform-Level KPIs

| KPI | Definition | Target | Source |
|-----|-----------|--------|--------|
| Weekly Active Users (WAU) | Users with auth.session.started in past 7 days | Growing | auth events |
| Monthly Active Users (MAU) | Users with auth.session.started in past 30 days | Growing | auth events |
| Lead Capture Rate | content.lead.captured / unique visitors | >2% | analytics events |
| Demo Request Rate | support.demo.requested / unique visitors | >0.5% | analytics events |
| User Activation Rate | Users completing first meaningful action / new signups | >60% | workflow events |
| Week-4 Retention | Users active in week 4 / users in week 1 | >40% | auth events |

## Per-Product KPIs

### Lyte
| KPI | Definition |
|-----|-----------|
| Signals Triaged / Week | lyte.signal.triaged events per week |
| Time to Triage | Average time from signal creation to triage |
| Executive Summary Views | lyte.executive.summary_viewed per week |

### Terra
| KPI | Definition |
|-----|-----------|
| Properties Viewed / Week | terra.property.viewed events per week |
| Deals Created / Month | terra.deal.created events per month |
| Distress Alerts Actioned | terra.distress.detected → deal/action rate |

### Vessels
| KPI | Definition |
|-----|-----------|
| Fleet Map Sessions / Week | vessels.fleet.map_viewed per week |
| Exceptions Resolved / Week | vessels.exception.triaged per week |
| Voyage Economics Reviews | vessels.voyage.economics_viewed per week |

### Aegis
| KPI | Definition |
|-----|-----------|
| Incidents / Month | aegis.incident.created per month |
| Mean Time to Investigate | aegis.case.investigated time from incident |
| Simulation Runs / Month | aegis.simulation.run per month |

## Content KPIs
| KPI | Definition | Target |
|-----|-----------|--------|
| Articles Published / Week | content.article.published per week | 1+ |
| Newsletter Sends / Month | content.newsletter.sent per month | 4+ |
| Lead Captures / Week | content.lead.captured per week | 5+ |
| Content → Lead Rate | leads from content / total content views | >1% |

## Review Cadence
- **Weekly**: WAU, lead captures, content output, error rates
- **Monthly**: MAU, retention, activation, demo requests, per-product KPIs
- **Quarterly**: Growth trends, funnel conversion rates, product-market fit signals
