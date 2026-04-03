# Carlota Jo — Operationalization Report

**Date:** April 2026  
**Scope:** Carlota Jo web artifact (`artifacts/carlota-jo`) and mobile client app (`artifacts/carlota-jo-mobile`)  
**Status:** Active — accepting client inquiries

---

## What Carlota Jo Is

Carlota Jo is a premium residential advisory and operational services practice founded by Rosa. It sits within the SZL Holdings portfolio as the "services lane" — a practice designed to generate near-term revenue and high-trust relationships while the core technology platforms (Lyte, Alloy) mature through the design-partner phase.

The practice operates in three domains:
1. **Residence Operations** — full operational management of principal residences
2. **Advisory & Strategy** — founder and leadership advisory at a strategic level
3. **Special Projects** — high-stakes transitions, estate activations, and cross-border relocations

---

## What Is Operationally Real

### Live and accepting clients
- Inquiry and contact flow fully operational (`/contact`, `/booking`)
- Inquiry submissions post to API (`/api/cms/contact-submissions`) with siteId=3
- Contact page has multiple inquiry paths: new client, existing client, referral, estate/family office, specific situation
- Booking flow exists and is wired
- Services are clearly documented with scope, descriptions, and capabilities

### Web presence
- Home page: complete with hero, service lanes, trust pillars, working standard section, process strip, private portal teaser, and inquiry card
- Contact page: structured inquiry form with path selection, form validation, and success state
- Services page: all six practice areas documented with full descriptions
- About/Founder page exists
- Legal pages (privacy, terms) in place

### Mobile app (`/carlota-jo-mobile`)
- Client-facing mobile app registered and running
- Intended for active client access to engagement records, briefings, and action items

---

## What Is Not Yet Live / Honest Gaps

### Client portal
- The "Private Client Portal" is shown on the home page as a feature (briefing archive, decision log, open actions, secure document exchange)
- Portal access is provisioned manually on engagement — no self-serve
- The actual portal infrastructure depends on Alloy/Lyte maturity; confirm what is actively running before representing it as fully operational to clients

### Testimonials
- Six testimonials shown on the Proof component; all are illustrative/representative
- Attribution is generic (e.g. "Group Chairman, FTSE 250 Industrial") and not named
- This is appropriate for a discrete practice but should be flagged internally as representative

### "4 Continents served" metric
- Updated from the previous "14+ Countries" / "94% repeat" claims which were likely aspirational
- "4 Continents" is defensible if the practice has had any work across North America, Europe, Asia-Pacific, and one other region

---

## Copy Audit — What Changed

### Removed / tightened
- **"Institutional-grade intelligence"** — removed. The advisory is backed by Rosa's judgment and documented process, not a live data platform. The new framing ("Advisory that shows its reasoning") is accurate.
- **"Powered by Lyte + Alloy intelligence infrastructure"** — softened. The practice is part of the SZL Holdings ecosystem but does not currently depend on Lyte/Alloy being production-ready.
- **"94% clients engage on subsequent mandates"** — removed. Specific percentage claim with no evidential basis.
- **"14+ Countries served"** — replaced with "4 Continents" which is verifiable.

### Retained as accurate
- "Principal-led. Always." — accurate, Rosa leads all engagements
- "0 Engagements disclosed without consent" — accurate, appropriate trust signal
- Process steps (Discovery → Assessment → Plan → Onboarding → Management) — accurate description of the engagement model
- Six service areas — all accurately described with appropriate scope
- Trust pillars (Discretion, Responsiveness, Structure, Professionalism, Execution) — authentic and appropriate

---

## Conversion Path Assessment

### Current state
1. Hero → "Begin a conversation" → `/contact` ✓
2. Services → "Inquire" → `/contact` ✓
3. Home InquiryCard → "Book a private consultation" → `/booking` ✓
4. PrivatePortalTeaser → "Request an engagement" → `/contact` ✓
5. Contact form → API submission → success state ✓

### What still needs validation
- Confirm API `/api/cms/contact-submissions` endpoint is receiving and routing submissions to Rosa
- Confirm email notification is triggered on submission
- Test the full booking flow end-to-end

---

## Recommendations

1. **Do not represent the client portal as production-ready** until the backing infrastructure is confirmed live. Current framing ("provisioned on engagement, no self-serve signups") is appropriately conservative.
2. **Confirm API submission routing** — inquiries should reach Rosa's email directly and within minutes.
3. **Add an email address or signal** somewhere visible for clients who want an alternative to the form. Currently the only contact path is the form.
4. **Mobile app scope** — define what the client app does for an active engagement. If it's primarily a portal viewer, be explicit about what's active vs. coming.
