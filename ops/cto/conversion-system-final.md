# Conversion System — Final
Generated: 2026-04-16

## Purpose
A complete map of the SZL commercial conversion funnel — from first site visit to contact submission — with CTA instrumentation plan, client-side vs. server-side logging strategy, and escalation path for each stage.

---

## Full Funnel Map

```
Organic / Referral Traffic
  └─> Landing Page (/, /platform, /lyte)                     [AWARENESS]
       └─> Audience Path Selection (/platform, /architecture, /trust, /design-partner, /investor)
            └─> Product Exploration (/platform, /architecture, /docs)  [INTEREST]
                 └─> Trust Visit (/trust, /trust/security, /trust/governance)  [CONSIDERATION]
                      └─> Demo Intent (/demo)                          [INTENT]
                           └─> Partner Interest (/design-partner)      [PARTNER PATH]
                                └─> Contact Submission (/contact, /demo form submit)  [ACTION]
```

---

## Funnel Stages & Instrumentation

### Stage 1: Awareness — Landing

**Pages:** `/`, `/platform`, `/lyte`  
**Goal:** Visitor understands what SZL does and selects a path

| CTA | Event Name | Properties |
|-----|-----------|------------|
| "Request a demo" (hero) | `demo_cta_clicked` | `{ location: "hero", page: "/" }` |
| "Explore the platform" (hero) | `platform_explored` | `{ location: "hero" }` |
| "Become a design partner" (hero) | `design_partner_cta_clicked` | `{ location: "hero" }` |
| Audience path card click | `audience_path_selected` | `{ path: "executive|technical|security|partner|investor" }` |

**Instrumentation:** Client-side (browser event on click)  
**Priority:** P0

---

### Stage 2: Interest — Product Exploration

**Pages:** `/platform`, `/architecture`, `/docs`, `/solutions/*`  
**Goal:** Visitor engages with product depth; technical or business evaluator mode

| CTA | Event Name | Properties |
|-----|-----------|------------|
| Any nav link click | `nav_link_clicked` | `{ from: page, to: href }` |
| Domain pack card click | `domain_pack_viewed` | `{ domain: "prism-counsel|vessels|aegis|terra" }` |
| Architecture section scroll | `architecture_section_reached` | `{ section: string }` |
| Docs page visit | `docs_page_viewed` | `{ path: string }` |

**Instrumentation:** Client-side (click + scroll depth via IntersectionObserver)  
**Priority:** P1

---

### Stage 3: Consideration — Trust Visit

**Pages:** `/trust`, `/trust/security`, `/trust/governance`, `/case-studies`, `/company`  
**Goal:** Visitor is validating credibility before committing to a conversation

| CTA | Event Name | Properties |
|-----|-----------|------------|
| Trust Center page view | `trust_center_viewed` | `{ sub_page: "security|governance|overview" }` |
| Case study click | `case_study_viewed` | `{ title: string }` |
| Company/leadership page view | `company_page_viewed` | `{}` |
| Security details section scroll | `security_detail_reached` | `{ section: string }` |

**Instrumentation:** Client-side (page view + scroll depth)  
**Priority:** P1

---

### Stage 4: Intent — Demo Request

**Pages:** `/demo`  
**Goal:** Visitor fills out and submits the demo request form

| CTA | Event Name | Properties |
|-----|-----------|------------|
| Demo page view | `demo_page_viewed` | `{ referrer: previous_page }` |
| Demo form start (first field focused) | `demo_form_started` | `{ referrer: previous_page }` |
| Demo form submit (success) | `demo_request_submitted` | `{ org: string, domain_interest: string }` |
| Demo form submit (error) | `demo_form_error` | `{ error: string }` |

**Instrumentation:** Client-side for form interactions; server-side for successful submit  
**Priority:** P0

---

### Stage 5: Partner Interest

**Pages:** `/design-partner`  
**Goal:** Visitor understands the design-partner offer and moves toward contact

| CTA | Event Name | Properties |
|-----|-----------|------------|
| Design partner page view | `design_partner_page_viewed` | `{ referrer: previous_page }` |
| "Apply" or "Get in touch" click | `design_partner_interest_clicked` | `{ cta_label: string }` |
| Scroll to qualification criteria | `dp_criteria_reached` | `{}` |

**Instrumentation:** Client-side  
**Priority:** P1

---

### Stage 6: Action — Contact Submission

**Pages:** `/contact`  
**Goal:** Visitor submits a contact form and becomes a lead

| CTA | Event Name | Properties |
|-----|-----------|------------|
| Contact page view | `contact_page_viewed` | `{ referrer: previous_page }` |
| Contact form start | `contact_form_started` | `{}` |
| Contact form submit (success) | `contact_form_submitted` | `{ type: "demo|partner|general", org: string }` |
| Contact form submit (error) | `contact_form_error` | `{ error: string }` |

**Instrumentation:** Client-side for interactions; **server-side for successful submit**  
**Priority:** P0

---

## Client-Side vs. Server-Side Logging

### Principle
Use client-side tracking for visibility and intent signals. Use server-side tracking for commercial events and lead records. Never rely on client-side alone for anything that feeds a CRM or founder dashboard.

| Event Category | Where to Log | Reason |
|----------------|-------------|--------|
| Page views | Client-side (PostHog auto-capture) | Coverage is sufficient; duplicates are OK |
| CTA clicks | Client-side (manual event) | Measures intent, not outcome |
| Scroll depth / section reach | Client-side (IntersectionObserver) | Performance signal |
| Form starts | Client-side | Funnel dropout measurement |
| Form submissions (success) | **Both** — client fires first, server confirms | Commercial event — must not be lost to ad blockers |
| Demo request submitted | Server-side (API endpoint) + client-side | CRM handoff; must be reliable |
| Contact form submitted | Server-side (API endpoint) + client-side | CRM handoff; must be reliable |
| Newsletter signup | Server-side (API endpoint) + client-side | Email list accuracy |

### Implementation Notes
- Client-side: PostHog SDK initialized in `szl-holdings` app; `window.posthog.capture(eventName, props)`
- Server-side: Existing `/api/contact/submit` and `/api/demo/submit` endpoints should emit a server-side analytics event on successful write to DB
- Ad blocker consideration: critical commercial events (form submits) must be server-confirmed; do not rely on client for CRM data

---

## Funnel Drop-Off Targets

| Transition | Funnel Stage | Target Drop-Off |
|------------|-------------|----------------|
| Landing → Exploration | Awareness → Interest | ≤ 70% |
| Exploration → Trust visit | Interest → Consideration | ≤ 60% |
| Trust visit → Demo page | Consideration → Intent | ≤ 75% |
| Demo page → Form start | Intent → Engaged | ≤ 40% |
| Form start → Submit | Engaged → Converted | ≤ 30% |

These are initial targets for the design-partner stage. Recalibrate after 30 days of data.

---

## CRM Handoff Path (Current State)

1. Contact form submitted → `/api/contact/submit` POST
2. Record written to database
3. Email notification to founders (via existing notification hook)
4. **Manual**: Founder reviews new lead and moves to qualification queue
5. **Future**: Automated push to HubSpot or Pipedrive via integration

---

## Support & Escalation Path for Design Partners

This applies during and after the onboarding phase.

| Issue Type | Channel | Response Target | Escalation |
|------------|---------|-----------------|-----------|
| Access / login issue | Slack (shared partner channel) | 2 hours | Founder within 4 hours |
| Data ingestion failure | Slack + email | 4 hours | P0 if blocking pilot progress |
| Feature not working as shown | Slack | 24 hours | Triage call within 48 hours |
| Feature request | Weekly review log | Reviewed weekly | Roadmap consideration within 2 weeks |
| Contract / commercial question | Email to founder | 48 hours | Do not handle async — schedule a call |
| Data security or privacy concern | Email to founder (direct) | 4 hours | Mandatory escalation; log in incident tracker |

**P0 Definition:** Issue that blocks the partner from using the platform at all, or that involves a data security event.  
**P0 Response:** Founder engaged within 2 hours; resolution or workaround within 24 hours; written summary to partner within 48 hours.

---

## Version History
- 2026-04-16: Initial draft, CTO Pass Phase G
