# Top 25 Risks and Gaps

**Date:** 2026-04-27  
**Phase:** Rehaul 9/9 Closeout  
**Purpose:** Brutally honest enumeration of the 25 highest-risk items for investors, technical diligence, and enterprise buyers. Ranked by severity × likelihood of being raised in diligence.

---

## Severity Scale

| Level | Definition |
|---|---|
| **CRITICAL** | Blocks investment or deal if unresolved; misrepresents the platform |
| **HIGH** | Will be raised in diligence; requires clear mitigation or timeline |
| **MEDIUM** | Noted in diligence; explainable with roadmap |
| **LOW** | Cosmetic or minor; acceptable at alpha stage |

---

## Risk Register

| # | Risk / Gap | Severity | Status | Mitigation / Plan |
|---|---|---|---|---|
| 1 | **No production customers** | HIGH | Open | Expected at pre-Series A. Design partner conversations in progress. Frame as intentional: building with diligence before scale. |
| 2 | **A11oy Phase 2 incomplete** (workcell engine) | HIGH | In Progress | Core product roadmap. Phase 1 shipped and demo-able. Phase 2 timeline: v1.2.0. |
| 3 | **`/api/sentra/risks` missing route** | HIGH | Open | TENAX demo-breaking. Fix estimated at 2–4 hours. Prioritize before next demo. |
| 4 | **No live AIS telemetry (SEXTANT)** | MEDIUM | Known | AIS requires $15–40K/year provider. Disclosed in docs. Not misrepresented. |
| 5 | **Terra maps blank (Mapbox token)** | MEDIUM | Open | Mapbox token provisioning pending. Add graceful placeholder UI. |
| 6 | **Redis session store not in production** | MEDIUM | Open | Running in-memory sessions in production. Security and scalability risk. Provision before Series A. |
| 7 | **No enterprise SSO / SCIM 2.0** | MEDIUM | Roadmap | Required for regulated-industry enterprise buyers. Target: v1.2.0. |
| 8 | **Integration tests not in CI** | MEDIUM | Open | Tests written but not registered as CI steps. Reduces automated confidence. Fix: register `pnpm test:integration` in CI. |
| 9 | **Sentry error tracking not active in production** | LOW | Open | No production error visibility. Risk: silent failures undetected. Provision before Series A. |
| 10 | **FORGE badge counts not wired** | MEDIUM | Open | FORGE (Command) feels broken to a demo viewer. Move to internal-only classification pending fix. |
| 11 | **SOC 2 Type 1 not started** | HIGH | Roadmap | Required for regulated-industry customers. 6+ months evidence collection. Start immediately post-Series A. |
| 12 | **No revenue activated (most domain packs)** | HIGH | Roadmap | Stripe infrastructure exists. Carlota Jo and Counsel are the revenue path. Activate post-design partner. |
| 13 | **Stripe billing not GA for all surfaces** | MEDIUM | In Progress | Active for subset (Vessels, Lyte, Terra, Carlota Jo). Full rollout pending. |
| 14 | **Seeded/demo data in most surfaces** | MEDIUM | Known | Disclosed in `docs/APP_STATUS.md`. Not misrepresented. Acceptable at alpha. |
| 15 | **KORA legacy `/lyte/` path alias missing** | LOW | Open | Minor routing issue. User-facing: broken URL if accessed via old path. 1-hour fix. |
| 16 | **Mobile splash screen and icon pending** | LOW | Open | Cosmetic only. Does not affect functionality. Fix before App Store submission. |
| 17 | **Push notification deep linking incomplete** | MEDIUM | Open | Approval push notifications fire correctly. Deep link routing to approval screen pending for mobile. |
| 18 | **CourtListener token not configured** | LOW | Open | Counsel live case data pending. UI functional with seeded data. Disclose in demos. |
| 19 | **`command` and `mockup-sandbox` workflow monitoring false-negatives** | LOW | Known | Apps serve correctly; platform marks FAILED due to `waitForPort` mismatch. Documented. |
| 20 | **No OpenAPI developer portal** | MEDIUM | Roadmap | API spec exists. Portal not shipped. Required for ecosystem/partner play. |
| 21 | **Expo package version warnings** | LOW | Known | netinfo, expo-glass-effect, expo-image-picker have version warnings. Non-breaking. Fix before App Store submission. |
| 22 | **No formal incident response tested** | MEDIUM | Open | `INCIDENT_RESPONSE.md` and runbooks exist. No actual incident drill run. Schedule a tabletop before Series A close. |
| 23 | **Brand screenshot freshness** | LOW | Managed | Screenshots verified 2026-04-25. Catalog in `audit/screenshot-catalog.md`. Must re-capture after any major UI change. |
| 24 | **Source-of-truth.json metric drift** | LOW | Monitored | `verify-source-of-truth.yml` workflow catches drift. Manual verification required after large refactors. |
| 25 | **Team composition not publicly stated** | MEDIUM | Strategic | Founder-led. No public team page. Investors will ask. Prepare team section before Series A pitch. |

---

## Risk Clusters

**Most likely to be raised in a Series A technical diligence call:**
- Risks #3, #6, #8, #11, #1 (no customers)

**Most likely to surface in an enterprise security review:**
- Risks #6, #7, #11, #22, #12

**Most likely to block a demo:**
- Risks #3 (TENAX), #5 (Terra maps), #10 (FORGE)

**Acceptable at alpha / not diligence-blocking:**
- Risks #9, #15, #16, #17, #18, #19, #21, #23, #24

---

*Review and update this register before every investor meeting, diligence session, or major demo.*
