# Analytics Events — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026

> This is the canonical analytics reference, merging `ANALYTICS_PLAN.md` and `EVENT_TAXONOMY.md` into one document. The source files remain in place.

---

## Analytics Stack

| Tool | Purpose | Status |
|------|---------|--------|
| Google Analytics 4 | Page views, user sessions, traffic attribution | Configured |
| PostHog | Event tracking, funnels, session recordings | Planned |

**Configuration:**
- `VITE_GA_MEASUREMENT_ID` — Google Analytics 4 Measurement ID
- `VITE_POSTHOG_KEY` — PostHog project key

---

## Analytics Objectives

1. **Lead quality** — Which pages and CTAs drive qualified demo requests
2. **Trust engagement** — Trust Center and security documentation visits
3. **Product interest** — Which product pages and verticals attract the most engagement
4. **Demo conversion** — Full funnel from visit → demo request → qualified pipeline
5. **Content performance** — Highest-performing documentation and blog content

---

## Key Business Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| Demo requests | Submissions of the demo request form | Track trend |
| Contact form submissions | Any `/contact` form submission | Track trend |
| Trust Center visits | Unique sessions on `/trust-center` and `/trust/*` | Track trend |
| Investor page visits | Sessions on `/investors/*` | Track trend |
| Design partner inquiries | Submissions tagged `design_partner` | Track count |

---

## Naming Convention

Events follow the pattern: `{object}_{action}` — all lowercase with underscores, descriptive but concise (max 3 words), consistent across all products and pages.

---

## Event Registry

### Navigation & Engagement

| Event Name | Trigger | Properties | Priority |
|-----------|---------|-----------|---------|
| `page_viewed` | Page load / route change | `page_path`, `page_title`, `referrer` | High |
| `section_scrolled` | User scrolls into a named section | `section_id`, `page_path` | Medium |
| `scroll_depth_reached` | User scrolls to 25%, 50%, 75%, 100% | `depth_pct`, `page_path` | Medium |
| `external_link_clicked` | Click on an external link | `link_url`, `link_label`, `page_path` | Low |

---

### CTA Events

| Event Name | Trigger | Properties | Priority |
|-----------|---------|-----------|---------|
| `cta_clicked` | Any CTA button or link click | `cta_label`, `cta_variant`, `cta_location`, `page_path` | **Critical** |
| `demo_requested` | Demo request form submitted | `product`, `form_key`, `source_page` | **Critical** |
| `design_partner_cta` | Design partner CTA specifically | `cta_location`, `page_path` | High |
| `contact_form_started` | User focuses on any form field | `form_key`, `page_path` | Medium |
| `contact_submitted` | Any contact form successfully submitted | `form_key`, `inquiry_type`, `page_path` | **Critical** |

**`cta_location` Values:**

| Value | Context |
|-------|---------|
| `hero` | Page hero section |
| `nav` | Navigation bar |
| `footer` | Page footer |
| `section_[name]` | Named mid-page section |
| `trust_banner` | Trust/security callout |
| `pricing_card` | Pricing section card |
| `product_feature` | Feature card or callout |

---

### Product Page Events

| Event Name | Trigger | Properties | Priority |
|-----------|---------|-----------|---------|
| `product_page_viewed` | Product/solution page load | `product`, `page_variant` | High |
| `product_feature_viewed` | Feature section scrolled into view | `product`, `feature_name` | Medium |
| `product_demo_cta` | "Demo" or "Try" CTA on product page | `product`, `cta_location` | High |
| `solution_trust_visited` | User visits a solution trust page | `product` | High |

**`product` Values:**

| Value | Product |
|-------|---------|
| `lyte` | Lyte Command Center |
| `alloy` | Alloy Execution Fabric |
| `aegis` | Aegis / Firestorm |
| `vessels` | Vessels Maritime |
| `terra` | Terra Real Estate |
| `prism_counsel` | PRISM Counsel |
| `carlota_jo` | Carlota Jo Advisory |
| `imperium` | IMPERIUM |
| `command` | Command Portal |

---

### Trust Center Events

| Event Name | Trigger | Properties | Priority |
|-----------|---------|-----------|---------|
| `trust_center_visited` | User lands on `/trust-center` | `referrer_page`, `referrer_type` | High |
| `trust_section_viewed` | User views a specific trust section | `trust_section`, `time_spent_sec` | High |
| `trust_cta_clicked` | CTA from trust page | `trust_section`, `cta_label` | High |
| `trust_doc_downloaded` | A trust document is downloaded | `doc_name`, `trust_section` | Medium |

**`trust_section` Values:**

| Value | Section |
|-------|---------|
| `security` | Security posture |
| `governance` | Governance model |
| `architecture` | Technical architecture |
| `ai_governance` | AI governance |
| `approvals` | Approval framework |
| `operations` | Operational trust |
| `exports` | Data exports |

---

### Documentation Events

| Event Name | Trigger | Properties | Priority |
|-----------|---------|-----------|---------|
| `docs_page_viewed` | Any `/docs/*` page | `doc_section`, `doc_page` | Medium |
| `docs_search_performed` | User searches docs | `query`, `results_count` | Medium |
| `api_docs_visited` | OpenAPI / developer docs visited | `endpoint_viewed` | Low |
| `github_link_clicked` | GitHub repo link from docs | `link_location` | Low |

---

### Investor Events

| Event Name | Trigger | Properties | Priority |
|-----------|---------|-----------|---------|
| `investor_page_viewed` | Any `/investors/*` page | `investor_section` | High |
| `investor_cta_clicked` | Investment inquiry CTA | `cta_location` | High |
| `data_room_accessed` | `/investors/data-room` visit | — | **Critical** |

---

### Demo & Pipeline Events

| Event Name | Trigger | Properties | Priority |
|-----------|---------|-----------|---------|
| `demo_flow_started` | User clicks into a demo experience | `product`, `demo_type`, `source_cta` | **Critical** |
| `demo_completed` | User completes a demo flow | `product`, `demo_type`, `duration_sec` | **Critical** |
| `pilot_inquiry_submitted` | Pilot/design partner form submitted | `product`, `company_type` | **Critical** |

---

## Properties Reference

| Property | Type | Description | Example Values |
|----------|------|-------------|---------------|
| `page_path` | string | URL path of current page | `/lyte`, `/trust/security` |
| `page_title` | string | Page title | `Lyte — Business Observability` |
| `referrer` | string | Previous page path | `/`, `/lyte` |
| `product` | string | Product name | `lyte`, `vessels`, `aegis` |
| `cta_label` | string | Text on the CTA | `Request Demo`, `Explore Lyte` |
| `cta_variant` | string | Visual variant | `primary`, `secondary`, `ghost` |
| `cta_location` | string | Where on page | `hero`, `nav`, `pricing_card` |
| `form_key` | string | Form identifier | `szl_contact`, `demo_request` |
| `inquiry_type` | string | Inquiry category | `enterprise`, `demo`, `partnership` |
| `trust_section` | string | Trust page section | `security`, `governance` |
| `doc_section` | string | Docs section | `architecture`, `control-plane` |
| `investor_section` | string | Investor page section | `overview`, `data-room`, `roadmap` |
| `time_spent_sec` | number | Time in seconds | `45` |
| `depth_pct` | number | Scroll depth % | `25`, `50`, `75`, `100` |
| `demo_type` | string | Demo type | `live`, `recorded`, `interactive` |
| `company_type` | string | Company classification | `enterprise`, `smb`, `government` |

---

## Per-Product Tracking Guide

### Lyte (`/lyte`)
- Time on page
- CTA: "Request Lyte Demo" clicks
- Scroll depth (do users reach the feature breakdown?)
- `/lyte/use-cases` visits

### Alloy (`/alloy-fabric`)
- Time on page
- CTA: "Explore Alloy" clicks
- `/docs/control-plane` visits from this page

### Solutions Pages (`/solutions/*`)
- Which vertical is most visited
- Trust page visits from solutions pages (interest → trust review conversion)
- CTA clicks per vertical

### Trust Center (`/trust-center`, `/trust/*`)
- Time on page per trust section
- Which trust topics are most-read (security, governance, AI, operations)
- Exit rate (do users leave, or continue to a CTA?)
- Trust → demo request funnel conversion

### Docs (`/docs/*`)
- Most-read documentation sections
- Time on page
- Return visits (are docs users returning?)

---

## Demo Request Funnel

```
Landing Page Visit
        │
        ▼
Product Page Visit (Lyte / Solutions / etc.)
        │
        ▼
Trust Center or Docs Visit (qualification stage)
        │
        ▼
CTA Click (demo request / contact)
        │
        ▼
Form Submission → demo_requested event fires
        │
        ▼
[Offline: qualification call]
```

Track each step as a named funnel step in PostHog.

---

## Reporting Cadence

| Report | Frequency | Audience |
|--------|-----------|---------|
| Demo request volume | Weekly | Founder |
| Top pages and CTAs | Monthly | Product + Marketing |
| Trust Center engagement | Monthly | Product |
| Funnel conversion rates | Monthly | Founder + Sales |
| Full analytics review | Quarterly | All |

---

## Implementation

Events should be fired using a wrapper function:

```typescript
trackEvent('cta_clicked', {
  cta_label: 'Request Demo',
  cta_location: 'hero',
  page_path: window.location.pathname,
});
```

The wrapper handles:
- Null-checking analytics availability
- Batching for performance
- Consent gate check
- Development mode logging (no real events fired in dev)

---

## Privacy Rules

1. **No PII.** Never send names, emails, IP addresses, or other personally identifiable information in event properties.
2. **No session IDs.** Do not pass internal session or user IDs to third-party analytics tools.
3. **Aggregate only.** Analytics should provide aggregate behavior insights, not individual user tracking.
4. **Consent first.** Analytics events only fire after user consent (where required by applicable privacy law).
5. **Data retention.** GA4 data retention set to 14 months. PostHog per configuration.
6. **Data residency.** Verify GA4 and PostHog data residency meets applicable privacy requirements.

---

## Related Documents

| Document | Path |
|----------|------|
| Analytics plan (source) | `ANALYTICS_PLAN.md` |
| Event taxonomy (source) | `EVENT_TAXONOMY.md` |
| Route inventory | `ROUTE_INVENTORY.md` |
| Product surfaces | `PRODUCT-SURFACES.md` |
