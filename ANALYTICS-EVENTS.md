# Analytics Events — SZL Holdings Platform

**Date:** April 2026 | **Audience:** Product, engineering, growth, and data teams

**Related:** [PRODUCT-SURFACES.md](PRODUCT-SURFACES.md) · [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)

---

## Overview

This document defines the canonical analytics event taxonomy for the SZL Holdings platform. It consolidates and extends the existing `EVENT_TAXONOMY.md` with implementation context, tool configuration, and funnel definitions.

**Source files:** `EVENT_TAXONOMY.md` · `ANALYTICS_PLAN.md`

---

## Analytics Tools

| Tool | Purpose | Status |
|------|---------|--------|
| Google Analytics 4 | Page views, sessions, traffic attribution | Configured |
| PostHog | Custom event tracking, funnels, session recordings | Planned |

**Environment variables:**
- `VITE_GA_MEASUREMENT_ID` — Google Analytics Measurement ID
- `VITE_POSTHOG_KEY` — PostHog project key

---

## Naming Convention

All events follow `{object}_{action}` pattern — lowercase with underscores, max 3 words.

```typescript
trackEvent('cta_clicked', {
  cta_label: 'Request Demo',
  cta_location: 'hero',
  page_path: window.location.pathname,
});
```

The `trackEvent` wrapper handles: consent gate check, null-checking, dev-mode suppression, and batching.

---

## Event Registry

### Navigation & Engagement

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `page_viewed` | Page load / route change | `page_path`, `page_title`, `referrer` | High |
| `section_scrolled` | User scrolls into named section | `section_id`, `page_path` | Medium |
| `scroll_depth_reached` | User hits 25% / 50% / 75% / 100% scroll | `depth_pct`, `page_path` | Medium |
| `external_link_clicked` | Click on external link | `link_url`, `link_label`, `page_path` | Low |

---

### CTA Events

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `cta_clicked` | Any CTA button or link | `cta_label`, `cta_variant`, `cta_location`, `page_path` | **Critical** |
| `demo_requested` | Demo request form submitted | `product`, `form_key`, `source_page` | **Critical** |
| `design_partner_cta` | Design partner CTA clicked | `cta_location`, `page_path` | High |
| `contact_form_started` | User focuses on any form field | `form_key`, `page_path` | Medium |
| `contact_submitted` | Contact form successfully submitted | `form_key`, `inquiry_type`, `page_path` | **Critical** |

**`cta_location` values:** `hero` · `nav` · `footer` · `section_[name]` · `trust_banner` · `pricing_card` · `product_feature`

---

### Product Page Events

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `product_page_viewed` | Product/solution page load | `product`, `page_variant` | High |
| `product_feature_viewed` | Feature section scrolled into view | `product`, `feature_name` | Medium |
| `product_demo_cta` | "Demo" or "Try" CTA on product page | `product`, `cta_location` | High |
| `solution_trust_visited` | User visits a solution trust page | `product` | High |

**`product` values:** `lyte` · `alloy` · `aegis` · `vessels` · `terra` · `prism_counsel` · `carlota_jo` · `imperium` · `cortex` · `command_portal`

---

### Trust Center Events

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `trust_center_visited` | User lands on `/trust-center` | `referrer_page`, `referrer_type` | High |
| `trust_section_viewed` | User views a specific trust section | `trust_section`, `time_spent_sec` | High |
| `trust_cta_clicked` | CTA from trust page | `trust_section`, `cta_label` | High |
| `trust_doc_downloaded` | Trust document downloaded | `doc_name`, `trust_section` | Medium |

**`trust_section` values:** `security` · `governance` · `architecture` · `ai_governance` · `approvals` · `operations` · `exports`

---

### Documentation Events

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `docs_page_viewed` | Any `/docs/*` page | `doc_section`, `doc_page` | Medium |
| `docs_search_performed` | User searches docs | `query`, `results_count` | Medium |
| `api_docs_visited` | OpenAPI / developer docs | `endpoint_viewed` | Low |
| `github_link_clicked` | GitHub repo link from docs | `link_location` | Low |

---

### Investor Events

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `investor_page_viewed` | Any `/investors/*` page | `investor_section` | High |
| `investor_cta_clicked` | Investment inquiry CTA clicked | `cta_location` | High |
| `data_room_accessed` | `/investors/data-room` visit | — | **Critical** |

---

### Demo & Pipeline Events

| Event | Trigger | Properties | Priority |
|-------|---------|-----------|---------|
| `demo_flow_started` | User enters a demo experience | `product`, `demo_type`, `source_cta` | **Critical** |
| `demo_completed` | User completes a demo flow | `product`, `demo_type`, `duration_sec` | **Critical** |
| `pilot_inquiry_submitted` | Pilot / design partner form submitted | `product`, `company_type` | **Critical** |

---

## Properties Reference

| Property | Type | Description | Example Values |
|----------|------|-------------|---------------|
| `page_path` | string | URL path of current page | `/lyte`, `/trust/security` |
| `page_title` | string | Page `<title>` | `Lyte — Business Observability` |
| `referrer` | string | Previous page path | `/`, `/lyte` |
| `product` | string | Product identifier | `lyte`, `vessels`, `aegis` |
| `cta_label` | string | Text on the CTA | `Request Demo`, `Explore Lyte` |
| `cta_location` | string | Position on page | `hero`, `nav`, `pricing_card` |
| `form_key` | string | Form identifier | `szl_contact`, `demo_request` |
| `trust_section` | string | Trust page section | `security`, `governance` |
| `doc_section` | string | Docs section | `architecture`, `control-plane` |
| `time_spent_sec` | number | Time in seconds | `45` |
| `depth_pct` | number | Scroll depth % | `25`, `50`, `75`, `100` |
| `company_type` | string | Type of company | `enterprise`, `smb`, `startup` |
| `demo_type` | string | Demo flow type | `product_walkthrough`, `live_demo` |

---

## Key Business Metrics

| Metric | Definition | Reporting Frequency |
|--------|-----------|---------------------|
| Demo requests | `demo_requested` event count | Weekly (Founder) |
| Contact form submissions | `contact_submitted` event count | Weekly |
| Trust Center visits | Unique sessions on `/trust-center`, `/trust/*` | Monthly |
| Investor page visits | Sessions on `/investors/*` | Monthly |
| Design partner inquiries | `pilot_inquiry_submitted` with `company_type = 'design_partner'` | Monthly |
| Data room accesses | `data_room_accessed` event count | Monthly (Founder, restricted) |
| CTA click-through rate | `cta_clicked` count / `page_viewed` count | Monthly |
| Demo conversion funnel | Step drop-off from `demo_flow_started` → `demo_completed` | Monthly |

---

## Demo Request Funnel

```
Landing Page Visit (page_viewed)
        │
        ▼
Product Page Visit (product_page_viewed)
        │
        ▼
Trust Center / Docs Visit (trust_center_visited / docs_page_viewed)
        │
        ▼
CTA Click (cta_clicked / product_demo_cta)
        │
        ▼
Form Submission (demo_requested)
        │
        ▼
[Offline: qualification call → pilot inquiry → closed deal]
```

Track each step as a named funnel in PostHog to measure step-to-step conversion.

---

## Privacy Rules

1. **No PII.** Never include names, emails, IP addresses, or phone numbers in event properties.
2. **No internal IDs.** Do not pass session IDs or user database IDs to third-party analytics tools.
3. **Consent first.** Analytics events only fire after user consent where required by applicable privacy law (GDPR, CCPA).
4. **Aggregate only.** Analytics provides behavior insights at aggregate level, not individual user tracking.
5. **Data retention.** GA4 retention set to 14 months. PostHog per project configuration.

---

## Reporting Cadence

| Report | Frequency | Audience |
|--------|-----------|---------|
| Demo request volume | Weekly | Founder |
| Top pages and CTAs | Monthly | Product + Growth |
| Trust Center engagement | Monthly | Product |
| Funnel conversion rates | Monthly | Founder + Sales |
| Full analytics review | Quarterly | All stakeholders |

---

*See also: [EVENT_TAXONOMY.md](EVENT_TAXONOMY.md) · [ANALYTICS_PLAN.md](ANALYTICS_PLAN.md) · [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)*

---

*Last verified against source code: 2026-04-15. Re-verify against `artifacts/api-server/src/`, `lib/db/src/schema/`, and `lib/auth/src/` after significant code changes.*
