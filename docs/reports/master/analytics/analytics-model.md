# SZL Holdings — Analytics Model

## Data Sources

### In-Platform (Built)
| Source | Table | Metrics Available |
|--------|-------|-------------------|
| Page Views | dos_page_views | path, referrer, user_agent, timestamp |
| Analytics Events | dos_analytics_events | category, action, label, value |
| Lead Captures | dos_leads | source, campaign, stage, conversion |
| Campaign Links | dos_campaign_links | utm_source, utm_medium, utm_campaign, clicks |
| Newsletter Subs | dos_newsletters | subscriber count, send status |

### External (Needs Integration)
| Source | Status | Metrics Available |
|--------|--------|-------------------|
| X Analytics | ❌ Not connected | impressions, clicks, engagement, followers |
| LinkedIn Analytics | ❌ Not connected | impressions, clicks, engagement, connections |
| Medium Stats | ❌ Not connected | reads, claps, followers |
| Substack Stats | ❌ Not connected | opens, clicks, subscribers |
| Google Analytics | ❌ Not connected | sessions, bounces, conversions |

## Tracking Dimensions

| Dimension | Implementation |
|-----------|---------------|
| Platform | utm_source (x, linkedin, medium, substack, site, linktree) |
| Campaign | utm_campaign → dos_campaigns.slug |
| Lane | editorial_pillar → dos_editorial_pillars |
| Asset type | article, thread, post, pdf, carousel, newsletter |
| CTA | dos_cta_blocks.id |
| Hook style | Tags on articles/posts |
| Visual style | Tags on carousels/PDFs |
| Publish time | created_at timestamps |
| Conversion target | lead stage progression |

## UTM System

```
Base URL: https://szlholdings.com/insights/{slug}

utm_source: x | linkedin | medium | substack | linktree | newsletter | direct
utm_medium: social | article | newsletter | pdf | carousel | thread
utm_campaign: {campaign-slug} (from dos_campaigns)
utm_content: {variant-label} (A/B test tracking)
```

## Reports

### Weekly Performance Report
- Total page views by path
- Top content by views
- Lead captures by source
- Campaign link clicks
- Newsletter growth
- Top referrers

### Monthly Performance Report
- All weekly metrics aggregated
- Month-over-month trends
- Platform-specific performance
- Conversion funnel analysis
- Top-performing content types
- Hook/visual style analysis
- Recommendations for next month

### Top Hook Report
- Which article titles/X hooks drive most clicks
- A/B test results on CTA copy
- Engagement rates by hook style

## Dashboard Location
Admin panel at `/admin/distribution/analytics`
