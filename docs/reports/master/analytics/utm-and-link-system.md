# SZL Holdings — UTM & Link Tracking System

## UTM Structure

### Base URL
All canonical content lives at `https://szlholdings.com/insights/{slug}`

### UTM Parameters

| Parameter | Values | Examples |
|-----------|--------|----------|
| utm_source | x, linkedin, medium, substack, linktree, newsletter, direct, organic | `utm_source=x` |
| utm_medium | social, article, newsletter, pdf, carousel, thread, post | `utm_medium=thread` |
| utm_campaign | {campaign-slug} from dos_campaigns | `utm_campaign=launch-week` |
| utm_content | {variant-label} for A/B testing | `utm_content=hook-a` |

### Full URL Format
```
https://szlholdings.com/insights/why-observability-needs-execution?utm_source=x&utm_medium=thread&utm_campaign=launch-week&utm_content=thread-1
```

## Campaign Link Templates

### Product Launch
```
?utm_source={platform}&utm_medium={format}&utm_campaign={product}-launch&utm_content={variant}
```

### Thesis/POV
```
?utm_source={platform}&utm_medium={format}&utm_campaign={thesis-slug}&utm_content={variant}
```

### Newsletter
```
?utm_source=newsletter&utm_medium=email&utm_campaign=szl-briefing-{issue-number}&utm_content={link-position}
```

## Database Integration

### dos_campaign_links
- Stores every UTM-tagged link
- Tracks click count
- Links to parent campaign (dos_campaigns)

### dos_analytics_events
- Captures utm_* params from URL on page load
- Category: "campaign", Action: "click", Label: campaign slug

### dos_page_views
- Records referrer (external platform)
- Records full path including UTM params

## Linktree Link Strategy

### Launch Stack (Day 0-7)
1. 🚀 Read the Launch Article → canonical URL + utm_source=linktree&utm_campaign=launch
2. 📧 Subscribe to The SZL Briefing → /newsletter + utm_source=linktree
3. 🏢 Explore the Platform → / + utm_source=linktree
4. 📄 Download the PDF → PDF URL + utm_source=linktree
5. 🐦 Follow on X → https://x.com/szlholdings

### Evergreen Stack
1. SZL Holdings Platform → /
2. Latest Insights → /insights
3. Subscribe → /newsletter
4. Follow on X → x.com/szlholdings
5. Read on Medium → medium.com/@stephen_38454
6. Read on Substack → szlholdings.substack.com

### Campaign Stack (Per Campaign)
Top 3 links updated to match active campaign, bottom links stay evergreen
