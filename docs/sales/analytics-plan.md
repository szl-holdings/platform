# Analytics Plan — SZL Holdings Platform

> Event taxonomy, tracking strategy, and measurement objectives for the SZL Holdings platform.

---

## Analytics Objectives

1. **Lead quality** — Understand which pages and CTAs drive qualified demo requests
2. **Trust engagement** — Measure Trust Center and security documentation visits
3. **Product interest** — Track which product pages and verticals attract the most engagement
4. **Demo conversion** — Track the full funnel from visit → demo request → qualified pipeline
5. **Content performance** — Identify highest-performing documentation and blog content

---

## Analytics Tools

| Tool | Purpose | Status |
|------|---------|--------|
| Google Analytics 4 | Page views, user sessions, traffic attribution | Configured |
| PostHog | Event tracking, funnels, session recordings | Planned |

Configure via environment variables:
- `VITE_GA_MEASUREMENT_ID` — Google Analytics Measurement ID
- `VITE_POSTHOG_KEY` — PostHog project key

---

## Key Metrics

### Business Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| Demo requests | Submissions of the demo request form | Track trend |
| Contact form submissions | Any `/contact` form submission | Track trend |
| Trust Center visits | Unique sessions on `/trust-center` and `/trust/*` | Track trend |
| Investor page visits | Sessions on `/investors/*` | Track trend |
| Design partner inquiries | Submissions tagged `design_partner` | Track count |

### Engagement Metrics

| Metric | Definition |
|--------|-----------|
| Product page time-on-page | Average time on `/lyte`, `/alloy-fabric`, `/solutions/*` |
| Docs engagement | Page views on `/docs/*` |
| Trust Center depth | How far users navigate through `/trust/*` pages |
| CTA click-through rate | CTAs clicked / page views |

---

## Event Taxonomy

See [EVENT_TAXONOMY.md](../architecture/event-taxonomy.md) for complete naming conventions.

### Priority Events to Implement

| Event Name | Trigger | Properties |
|-----------|---------|-----------|
| `cta_clicked` | Any CTA button click | `cta_label`, `cta_location`, `page_path` |
| `demo_requested` | Demo request form submitted | `product`, `form_key`, `company_size` |
| `contact_submitted` | Contact form submitted | `form_key`, `inquiry_type` |
| `trust_center_visited` | User visits `/trust-center` | `referrer_page` |
| `trust_page_viewed` | Any `/trust/*` page viewed | `trust_section`, `time_spent` |
| `product_page_viewed` | Product/solution page viewed | `product`, `section` |
| `docs_page_viewed` | Any `/docs/*` page viewed | `doc_section` |
| `investor_page_viewed` | Any `/investors/*` page viewed | `section` |
| `design_partner_cta` | Design partner CTA clicked | `cta_location` |
| `demo_flow_started` | User clicks into `/demo` or a demo CTA | `product`, `source` |

---

## What to Track Per Product Page

### Lyte (`/lyte`)
- Time on page
- CTA: "Request Lyte Demo" clicks
- Scroll depth (do they reach the feature breakdown?)
- `/lyte/use-cases` visits

### Alloy (`/alloy-fabric`)
- Time on page
- CTA: "Explore Alloy" clicks
- `/docs/control-plane` visits from this page

### Solutions Pages (`/solutions/*`)
- Which vertical is most visited
- Trust page visits from solutions pages (conversion from interest → trust review)
- CTA clicks per vertical

### Trust Center (`/trust-center`, `/trust/*`)
- Time on page per trust section
- Which trust topics are most-read (security, governance, AI, operations)
- Exit rate (do users leave, or continue to a CTA?)
- Trust → demo request funnel

### Docs (`/docs/*`)
- Most-read documentation sections
- Time on page
- Return visits (are docs users returning?)

---

## Funnel Tracking

### Demo Request Funnel

```
Landing Page Visit
        │
        ▼
Product Page Visit (Lyte / Solutions / etc.)
        │
        ▼
Trust Center or Docs Visit (qualification)
        │
        ▼
CTA Click (demo request / contact)
        │
        ▼
Form Submission (demo_requested event)
        │
        ▼
[Offline: qualification call]
```

Track each step as a named funnel step in PostHog.

---

## Privacy & Compliance

- **No PII in analytics events.** Never send names, emails, or IP addresses to analytics tools.
- **Cookie consent.** Analytics only loads after consent (if cookie banner is active).
- **Data residency.** Verify GA4 and PostHog data residency meets applicable privacy requirements.
- **Retention.** Google Analytics data retention set to 14 months. PostHog per configuration.

---

## Reporting Cadence

| Report | Frequency | Audience |
|--------|-----------|---------|
| Demo request volume | Weekly | Founder |
| Top pages and CTAs | Monthly | Product + Marketing |
| Trust Center engagement | Monthly | Product |
| Funnel conversion rates | Monthly | Founder + Sales |
| Full analytics review | Quarterly | All |
