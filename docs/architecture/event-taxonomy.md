# Event Taxonomy — SZL Holdings Platform

> Naming conventions and definitions for all analytics events across the SZL Holdings platform.

---

## Naming Convention

Events follow the pattern: `noun_verb` or `object_action`

```
{object}_{action}
```

All event names are:
- Lowercase with underscores
- Descriptive but concise (max 3 words)
- Consistent across all products and pages

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

**CTA Location Values:**
- `hero` — page hero section
- `nav` — navigation bar
- `footer` — page footer
- `section_[name]` — named mid-page section
- `trust_banner` — trust/security callout
- `pricing_card` — pricing section card
- `product_feature` — feature card or callout

---

### Product Page Events

| Event Name | Trigger | Properties | Priority |
|-----------|---------|-----------|---------|
| `product_page_viewed` | Product/solution page load | `product`, `page_variant` | High |
| `product_feature_viewed` | Feature section scrolled into view | `product`, `feature_name` | Medium |
| `product_demo_cta` | "Demo" or "Try" CTA on product page | `product`, `cta_location` | High |
| `solution_trust_visited` | User visits a solution trust page | `product` | High |

**Product Values:**
- `lyte` — Lyte Command Center
- `alloy` — Alloy Fabric
- `aegis` — Aegis / Firestorm
- `vessels` — Vessels Maritime
- `terra` — Terra Real Estate
- `prism_counsel` — PRISM Counsel
- `carlota_jo` — Carlota Jo Advisory

---

### Trust Center Events

| Event Name | Trigger | Properties | Priority |
|-----------|---------|-----------|---------|
| `trust_center_visited` | User lands on `/trust-center` | `referrer_page`, `referrer_type` | High |
| `trust_section_viewed` | User views a specific trust section | `trust_section`, `time_spent_sec` | High |
| `trust_cta_clicked` | CTA from trust page | `trust_section`, `cta_label` | High |
| `trust_doc_downloaded` | A trust document is downloaded | `doc_name`, `trust_section` | Medium |

**Trust Section Values:**
- `security` — Security posture
- `governance` — Governance model
- `architecture` — Technical architecture
- `ai_governance` — AI governance
- `approvals` — Approval framework
- `operations` — Operational trust
- `exports` — Data exports

---

### Documentation Events

| Event Name | Trigger | Properties | Priority |
|-----------|---------|-----------|---------|
| `docs_page_viewed` | Any `/docs/*` page | `doc_section`, `doc_page` | Medium |
| `docs_search_performed` | User searches docs | `query`, `results_count` | Medium |
| `api_docs_visited` | OpenAPI / developer docs | `endpoint_viewed` | Low |
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
| `cta_location` | string | Where on page | `hero`, `nav`, `pricing_card` |
| `form_key` | string | Form identifier | `szl_contact`, `demo_request` |
| `trust_section` | string | Trust page section | `security`, `governance` |
| `doc_section` | string | Docs section | `architecture`, `control-plane` |
| `time_spent_sec` | number | Time in seconds | `45` |
| `depth_pct` | number | Scroll depth % | `25`, `50`, `75`, `100` |

---

## Privacy Rules

1. **No PII.** Never include names, emails, IP addresses, or other personally identifiable information in event properties.
2. **No session IDs.** Do not pass internal session or user IDs to third-party analytics tools.
3. **Aggregate only.** Analytics should provide aggregate behavior insights, not individual user tracking.
4. **Consent first.** Analytics events only fire after user consent (where required by applicable privacy law).

---

## Implementation Notes

Events should be fired using a wrapper function to ensure consistency:

```typescript
trackEvent('cta_clicked', {
  cta_label: 'Request Demo',
  cta_location: 'hero',
  page_path: window.location.pathname,
});
```

Wrapper handles:
- Null-checking analytics availability
- Batching for performance
- Consent gate check
- Development mode logging (no real events in dev)
