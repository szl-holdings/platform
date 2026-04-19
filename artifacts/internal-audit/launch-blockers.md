# Top 10 Launch Blockers
**SZL Holdings — Governed Operational Intelligence**  
**Audit Date:** April 19, 2026  
**Priority:** P1 = blocks investor demo, P2 = blocks design partner, P3 = blocks GA

---

## 1. [P1] Email delivery not activated
**Blocker:** Contact forms, approval notifications, and digest emails cannot send.
**Root cause:** RESEND_API_KEY (or SENDGRID_API_KEY) not set in secrets panel.
**Fix:** Add `RESEND_API_KEY` to secrets panel. Estimated time: 5 minutes.
**Impact if not fixed:** Demo can't show notification flow. Contact form submissions silently fail.

---

## 2. [P1] Stripe billing not wired to Carlota Jo checkout
**Blocker:** Stripe is configured in test mode but no checkout UI is connected.
**Root cause:** Checkout page not built; Stripe session creation not linked to frontend.
**Fix:** Build a simple `/checkout` page in Carlota Jo that calls `/api/stripe/create-session`.
**Impact if not fixed:** Billing demo path broken. Premium service vertical lacks revenue proof.

---

## 3. [P1] AIS live feed absent — Vessels shows demo AIS
**Blocker:** Vessels maritime intelligence shows labeled demo AIS data, not live vessel positions.
**Root cause:** MARINETRAFFIC_API_KEY not set; BarentsWatch/AISHub alternatives not configured.
**Fix:** Add MarineTraffic API key OR configure free AISHub feed.
**Impact if not fixed:** Can still demo (clearly labeled DEMO AIS), but reduces credibility for maritime buyers.

---

## 4. [P2] DB migration tables incomplete
**Blocker:** `platform_settings`, `eval_forge_suites`, `eval_forge_runs` tables missing.
**Root cause:** Migrations not fully applied; non-fatal in current state.
**Fix:** Run `pnpm seed:all` after DB migration.
**Impact if not fixed:** Self-healing runtime and eval forge won't persist data.

---

## 5. [P2] SSO / SCIM not activated
**Blocker:** Enterprise buyers will require SSO as a baseline.
**Root cause:** OIDC scaffold exists but no IdP credentials configured.
**Fix:** Configure Okta, Azure AD, or Auth0. Set `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`.
**Impact if not fixed:** Blocks enterprise procurement. Not needed for seed/Series A demo.

---

## 6. [P2] Pulse briefings not AI-generated live
**Blocker:** Pulse shows seeded briefings, not AI-generated from live signals.
**Root cause:** AI provider not connected to briefing generation pipeline.
**Fix:** Connect OPENAI_API_KEY to Pulse briefing generator. Wire to live signal feed.
**Impact if not fixed:** Pulse reads as static demo content rather than a live AI briefing.

---

## 7. [P2] Terra NYC Open Data ETL has no health monitor UI
**Blocker:** ETL scripts run but there is no operator-visible health monitor.
**Root cause:** No dedicated ETL health page in Terra.
**Fix:** Add a simple ingestion status page to Terra (last run, row count, error count).
**Impact if not fixed:** Can't prove data freshness to a real estate operator.

---

## 8. [P2] SIEM connectors stubbed — Aegis shows seeded incidents only
**Blocker:** Aegis cannot ingest from real SIEM/XDR (Splunk, Elastic, Microsoft Sentinel).
**Root cause:** Connector abstraction exists but no live vendor credentials configured.
**Fix:** Wire one reference connector (e.g., Microsoft Sentinel REST API).
**Impact if not fixed:** Aegis reads as a security-themed dashboard, not a live SOC.

---

## 9. [P3] No self-serve Terra or Vessels demo mode
**Blocker:** Prospects must have a presenter to explore Terra and Vessels.
**Root cause:** No guided onboarding or interactive walkthrough in Terra/Vessels.
**Fix:** Build a "Start Demo" button that launches a scripted walkthrough.
**Impact if not fixed:** Reduces self-serve conversion. Not urgent for investor demo.

---

## 10. [P3] OpenAPI portal not hosted
**Blocker:** Developer/technical buyers can't explore the API without requesting access.
**Root cause:** API spec exists but no hosted Swagger/Redoc portal.
**Fix:** Mount Swagger UI at `/api/docs` using existing OpenAPI spec.
**Impact if not fixed:** Slows technical diligence. Not urgent for investor demo.

---

## Summary by Priority

| Priority | Count | Blockers |
|---|---|---|
| P1 (investor demo) | 3 | Email, Stripe checkout UI, AIS live feed |
| P2 (design partner) | 5 | DB migration, SSO, Pulse live AI, Terra ETL health, SIEM |
| P3 (GA) | 2 | Self-serve demo, OpenAPI portal |
