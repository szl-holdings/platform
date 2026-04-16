# Analytics & Funnel Plan

Last updated: 2026-04-16

## Stack

| Layer | Tool | Status |
|-------|------|--------|
| Web Analytics | Plausible | Configured in `main.tsx` (`configurePlausible`) |
| Error Tracking | Sentry | Initialized in `main.tsx` (`initSentry`) |
| Web Vitals (RUM) | `@szl-holdings/observability` | Initialized in `main.tsx` (`initWebVitals`) |
| Product Events | `@szl-holdings/analytics` | Implemented; events tracked to `window.gtag` |
| Google Analytics 4 | GA4 | Add VITE_GA_ID to env + snippet to index.html |
| Server-side | Pino structured logs | Running; see structured log format |

## Event Taxonomy (Core Events)

### Acquisition
| Event | Trigger | Properties |
|-------|---------|-----------|
| `page_view` | Every route change | `site`, `page`, `referrer` |
| `hero_cta_click` | Hero CTA buttons | `cta_label` |
| `nav_link_click` | Navigation links | `label`, `href` |

### Activation / Demo Funnel
| Event | Trigger | Properties |
|-------|---------|-----------|
| `contact_funnel_start` | Demo form focus | `inquiry_type` |
| `cta_click` (request_access_submit) | Demo form submit button | `cta_label`, `page`, `section` |
| `demo_request` | Successful demo form POST | `site` |
| `form_submit` (demo_access_request) | After 201 response | `form_key`, `page` |
| `contact_form_submit` | Contact form submit | `form_key`, `site` |

### Engagement
| Event | Trigger | Properties |
|-------|---------|-----------|
| `scroll_depth` | 25/50/75/90% scroll | `page`, `depth` |
| `ecosystem_node_click` | Ecosystem diagram click | `node_id` |
| `article_view` | Insights article open | `content_slug` |
| `case_study_view` | Case study open | `content_slug` |
| `venture_card_click` | Portfolio card click | `venture_id`, `venture_name` |

### Conversion
| Event | Trigger | Properties |
|-------|---------|-----------|
| `pricing_viewed` | Pricing page visit | `page` |
| `checkout_started` | Plan selection CTA | `plan_key` |
| `checkout_completed` | Successful checkout | `plan_key` |

## Conversion Funnel Stages

```
Stage 1: Acquisition
  Landing page visit → [page_view, site=szl-holdings, page=/]

Stage 2: Interest
  Solutions or Product page → [page_view, page=/solutions or /platform or /lyte]
  Pricing page visit → [pricing_viewed]

Stage 3: Intent
  Demo page visit → [page_view, page=/demo]
  Form focus → [contact_funnel_start, inquiry_type=demo]
  Form submit → [cta_click, request_access_submit]

Stage 4: Conversion
  Successful submission → [demo_request] + [form_submit, demo_access_request]

Stage 5: Follow-up (offline)
  Founder schedules call → tracked in CRM (placeholder)
  Call occurs → tracked in CRM (placeholder)
```

## Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Plausible page views | Done | Configured in main.tsx |
| Sentry error tracking | Done | Configured in main.tsx |
| Web Vitals RUM | Done | Configured in main.tsx |
| Demo funnel events | Done | `demo_request`, `form_submit` on success |
| CTA click tracking | Done | `analytics.ctaClick` on form submit |
| Scroll depth tracking | Implemented | `initScrollDepthTracking` available |
| GA4 initialization | Pending | Add `VITE_GA_ID` env var + snippet |

## GA4 Setup (Next Steps)

1. Create GA4 property at analytics.google.com
2. Add measurement ID to env secrets as `VITE_GA_ID`
3. The analytics lib already calls `window.gtag()` — it will work once GA4 is initialized
4. Alternatively, PostHog can replace GA4 for richer funnel analysis

## CRM Placeholder

When a demo request is successfully submitted:
- **Short-term**: email routed to founder directly via `/api/holdings/inquiries` endpoint
- **Medium-term**: connect to CRM (HubSpot/Notion) via webhook from the inquiry handler
- **Event hook**: the `demo_request` analytics event can trigger a Zapier/Make workflow

## Privacy Considerations

- Plausible is cookieless and GDPR-compliant by default
- GA4 requires cookie consent banner if deployed in EU — add `@szl-holdings/analytics` consent gate
- Sentry PII scrubbing: verify no PII in error payloads (email, names)
