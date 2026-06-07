# Inbound Routing Model

Last updated: 2026-04-16

## Purpose

This document defines how all inbound leads, demo requests, and contact inquiries are captured, routed, and tracked. It ensures no lead falls through the cracks and every touchpoint is attributable.

---

## Inbound Entry Points

| Entry Point | Path | Form/CTA | Backend Route |
|------------|------|---------|--------------|
| Demo Request | `/demo` | "Request access" form | `POST /api/holdings/inquiries` |
| Contact Form | `/contact` | General contact form | `POST /api/holdings/inquiries` |
| Newsletter | Various | Email capture | `POST /api/holdings/newsletter` (if exists) |
| Investor Inquiry | `/investor` | Private inquiry form | `POST /api/holdings/inquiries` (investor type) |
| Design Partner | `/design-partners` | Design partner form | `POST /api/holdings/inquiries` |
| Solutions CTA | `/solutions/*` | "Get a demo" buttons | Redirects to `/demo` |
| Trust Center | `/trust` | "Talk to a human" links | Redirects to `/contact` |

---

## Routing Logic

### Current (Manual)

All `POST /api/holdings/inquiries` submissions:
1. Are validated server-side
2. Are stored in the database (`inquiries` table)
3. Trigger an email notification to the founder
4. Are visible in the admin dashboard (`/admin`)

**No automated CRM routing is currently in place.** All follow-up is manual by the founder.

### Target (Phased)

**Phase 1** (Now): Email notification to founder. Manual CRM entry.

**Phase 2** (Q2 2026): Webhook from inquiry handler → HubSpot or Notion database → automatic lead record creation.

**Phase 3** (Q3 2026): Lead scoring based on:
- Company size (parsed from email domain)
- Product interest (which domain pack selected)
- Source page (demo vs. investor vs. design partner)

---

## Lead Qualification Criteria

| Signal | Score | Source |
|--------|-------|--------|
| Enterprise email domain (not Gmail/Yahoo) | +20 | Email field |
| Specific product selected | +15 | Pack selector |
| Message contains budget/timeline language | +10 | Message field |
| Came from `/solutions/*` pages | +10 | Referrer analytics |
| Repeat visit (Plausible session) | +5 | Analytics |
| Investor inquiry type | +25 | Inquiry type field |

**MQL threshold**: Score ≥ 30 → Marketing Qualified Lead → Prioritize founder follow-up.

---

## Response SLAs

| Inquiry Type | Target Response Time |
|-------------|---------------------|
| Demo request | 1 business day |
| General contact | 2 business days |
| Investor inquiry | 1 business day |
| Security disclosure | 2 business days |
| Support | 1 business day |

---

## Analytics Attribution

Every inbound lead should be attributable to a source. Ensure:

1. UTM parameters are preserved through the demo/contact funnel
2. Plausible referrer data is matched to inquiry submissions
3. Form submissions fire `demo_request` or `contact_form_submit` events

**UTM parameters to track**:
- `utm_source` — traffic source (linkedin, twitter, direct, google)
- `utm_medium` — channel (organic, paid, social, email)
- `utm_campaign` — campaign name
- `utm_content` — specific CTA or creative

**Implementation**: Capture UTM params from URL on page load; pass as hidden fields in inquiry form submission.

---

## CRM Placeholder Handoff

Until a CRM is integrated, the following manual process applies:

1. New inquiry email arrives → founder reviews
2. Qualified leads (score ≥ 30) → Create Notion record in "Pipeline" database
3. Follow-up meeting booked → Mark "Demo Scheduled" in Notion
4. Post-demo → Mark outcome: "Closed Won", "Nurture", "Not a Fit"

**Notion pipeline fields**:
- Name, Company, Email, Product Interest
- Lead Score, Lead Source
- Status: New → Contacted → Demo Scheduled → Proposal → Closed
- Notes (founder call notes)

---

## Spam / Abuse Handling

- Server-side email validation on all inquiry submissions
- Rate limiting: max 3 submissions per IP per hour (configurable in `rate-limiters.ts`)
- Honeypot field on contact forms (hidden input that bots fill; humans don't)
- Blocked domain list for known spam domains (implement in inquiry handler)
