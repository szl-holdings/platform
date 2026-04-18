# Web Go-Live Checklist — Tier 1 Surfaces

**Version:** 1.0  
**Last Updated:** April 2026  
**Applies to:** SZL Holdings (`szlholdings.com`) · Aegis (`/aegis/`) · Terra (`/terra/`) · Vessels (`/vessels/`) · Carlota Jo (`/carlota-jo/`) · Command (`/command/`)
**Note:** The standalone Lyte artifact is ARCHIVED — Lyte is now embedded in szl-holdings at `/lyte/` and Command at `/command/`.  
**Owner:** Founder / Engineering

---

## How to Use

Work through each section before declaring a surface production-ready. Mark each item `[x]` when confirmed. Any `[ ]` remaining is a known gap — document the risk and owner before going live.

---

## 1. Route Integrity

### SZL Holdings

- [ ] All routes in `sitemap.xml` resolve to real pages (no 404)
- [ ] All redirect routes (`/ecosystem`, `/founder`, `/insights`, etc.) redirect correctly
- [ ] `/lyte/demo` → redirects to `/lyte/` (Lyte is embedded in szl-holdings at `/lyte/`)
- [ ] `/vessels/demo` → redirects to `/vessels/`
- [ ] `/terra/demo` → redirects to `/terra/`
- [ ] `/investors` → redirects to `/investor-relations`
- [ ] `/alloy` → loads the Alloy factory floor (authenticated) or alloy-fabric (public)
- [ ] 404 catch-all → redirects to `/` gracefully
- [ ] Admin routes (`/admin/*`) require auth and return 403 for unauthorized users

### Lyte (in SZL Holdings)

- [ ] `/lyte/` → loads Dashboard (authenticated) or marketing landing (unauthenticated)
- [ ] `/lyte/signals` → Signal feed loads with data
- [ ] `/lyte/prism` → PRISM Dashboard loads
- [ ] `/lyte/alloy/intelligence` → Alloy Intelligence loads (Triage, Evidence, Audit tabs)
- [ ] `/lyte/approvals` → Approvals Center loads with demo data
- [ ] `/lyte/actions` → Action Center loads with demo data
- [ ] `/lyte/readiness` → Readiness Module loads
- [ ] `/lyte/admin/*` → gated to admin/ops roles only
- [ ] `/lyte/pricing` → Pricing page loads

---

## 2. Metadata & SEO

### SZL Holdings

- [ ] `index.html` has correct `<title>` (≤60 chars)
- [ ] `index.html` has `<meta name="description">` (≤160 chars)
- [ ] `<link rel="canonical">` present and correct
- [ ] OG tags: `og:title`, `og:description`, `og:url`, `og:image` all present
- [ ] `og:image` points to a real image (`/opengraph.jpg` — 1200×630)
- [ ] Twitter card meta tags present (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)
- [ ] `robots.txt` present and correct (`Allow: /`, `Disallow: /app/`, `Disallow: /admin`)
- [ ] `sitemap.xml` present, all URLs resolve, no stale/redirect-only URLs
- [ ] `sitemap.xml` referenced in `robots.txt`
- [ ] Pages with `usePageMeta` hook set correct per-page title and description

---

## 3. Forms — Validation, Success, Failure, Spam

### Contact Form (`/contact`)

- [ ] Name field: required, min 2 chars
- [ ] Email field: required, valid email format validated client-side
- [ ] Message field: required, min 20 chars
- [ ] Inquiry type selector: has default, all options functional
- [ ] Submit button disabled during submission
- [ ] Success state shown after submission (not just a toast)
- [ ] Error state shown on API failure with a retry prompt
- [ ] Honeypot field or rate-limit in API to block spam (`/api/contact/submit`)
- [ ] Form does not re-submit on page refresh (clear form on success)

### Demo Request Form (`/demo` or `/design-partners`)

- [ ] Same validation as contact form
- [ ] Inquiry type pre-selected as relevant ("Design Partner" or "Pilot")
- [ ] Confirmation email sent to submitter (or documented as deferred)

---

## 4. CTAs — All Links Have Real Destinations

### SZL Holdings

- [ ] "Get Early Access" / "Book a session" → `/contact` or `/design-partners`
- [ ] "See the Demo" → `/demo` (links to the integrated Lyte workspace at `/lyte/`)
- [ ] "Read the investor story" → `/investor-story`
- [ ] "Trust Center" → `/trust`
- [ ] "Privacy Policy" → `/legal/privacy`
- [ ] "Terms" → `/legal/terms`
- [ ] External links: GitHub, LinkedIn — open in new tab with `rel="noopener noreferrer"`
- [ ] No dead `href="#"` or `href="javascript:void(0)"` links in production paths
- [ ] Mobile nav: all items match desktop nav destinations

---

## 5. Cookie & Privacy Notice

- [ ] Cookie banner appears on first visit to SZL Holdings (not shown after consent stored)
- [ ] Cookie banner has "Accept" and "Decline" options
- [ ] Cookie banner links to `/legal/privacy`
- [ ] Consent state persisted in `localStorage` — banner does not re-appear after choice
- [ ] Lyte Command Center: cookie banner present with correct privacy URL
- [ ] `/legal/privacy` page loads and contains accurate data practices description
- [ ] `/legal/terms` page loads and contains terms of service

---

## 6. Status & Maintenance Banner

- [ ] `SZL_STATUS_CONFIG` and `LYTE_STATUS_CONFIG` in respective App.tsx files
- [ ] `active: false` confirmed for go-live (no banner shown by default)
- [ ] Banner activation tested: set `active: true` and verify it renders correctly
- [ ] Banner is dismissible (× button works)
- [ ] Status banner links to `/status` page
- [ ] `/status` page in SZL Holdings loads (route exists)
- [ ] Process documented: who can activate a status banner and how

---

## 7. Demo / Seeded Data Labels

- [ ] Lyte PRISM Dashboard shows "DEMO — SEEDED DATA" label when `?demo=true` or sandbox active
- [ ] Lyte Signals Feed shows demo label
- [ ] Lyte Dashboard shows demo label
- [ ] Sandbox mode banner visible in Lyte when sandbox active (yellow bar at top)
- [ ] Demo labels are NOT shown in production/live-data mode
- [ ] Presenters briefed: always show demo label to audience during demos

---

## 8. Performance & Security

- [ ] Lighthouse performance score ≥ 75 on mobile (run against production URL)
- [ ] No blocking synchronous scripts in `<head>`
- [ ] Images have `alt` text (accessibility)
- [ ] No console errors or warnings in production build
- [ ] CSP headers set (check response headers from server)
- [ ] HTTPS enforced — no mixed content
- [ ] API endpoints require authentication where applicable
- [ ] Admin routes protected by role check (not just UI-level)
- [ ] No secrets in client-side code (`grep -r "SECRET\|API_KEY\|password" src/`)
- [ ] Dependency audit: `pnpm audit --audit-level=high` passes

---

## 9. Observability

- [ ] Error boundary components wrap all pages (prevent white-screen crashes)
- [ ] 404 / unhandled routes display a graceful fallback, not a blank page
- [ ] API errors handled with user-facing messages (not raw error objects)
- [ ] Structured logging enabled in API server for production

---

## 10. Pre-Launch Sign-off

| Item | Owner | Status |
|------|-------|--------|
| Route integrity confirmed | Engineering | — |
| All forms tested end-to-end | Engineering | — |
| All CTAs verified | Founder | — |
| Cookie banner verified | Engineering | — |
| Sitemap submitted to Google Search Console | Founder | — |
| robots.txt confirmed | Engineering | — |
| OG image verified (preview with opengraph.xyz) | Founder | — |
| Admin routes access-tested | Engineering | — |
| Demo flow rehearsed post-deploy | Founder | — |
| Status banner activation process tested | Engineering | — |

---

## Known Gaps at Go-Live

Document any `[ ]` items that are knowingly deferred:

| Gap | Risk | Owner | Target Date |
|-----|------|-------|-------------|
| SOC 2 certification | Enterprise sales friction | Founder | TBD |
| Confirmation email on form submit | Submitter UX gap | Engineering | TBD |

---

*Internal document. Update this checklist each time a major feature ships.*
