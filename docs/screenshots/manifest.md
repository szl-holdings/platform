# SZL Holdings — Screenshot Manifest

**Last updated:** 2026-04-21  
**Task:** #2850 — Proof, Trust Layer, ROI Docs & Clean Publishable Commit  
**Capture environment:** Replit development workspace; szl-holdings, sentra, vessels, terra, carlota-jo, szl-holdings-mobile workflows running

---

## Stale Screenshots Deleted

The following pre-repositioning screenshots were deleted as part of Task #2850 (as flagged in `audit/06-repo-cleanup-report.md`):

| File | Reason for deletion |
|------|---------------------|
| `aegis-marketing.jpg` | Pre-repositioning gaming aesthetic |
| `lyte-marketing.jpg` | Pre-repositioning gaming aesthetic |
| `lyte-prism-pulse.jpg` | Pre-repositioning gaming aesthetic |
| `szl-holdings-home.jpg` | Homepage rebuilt — replaced by `platform/szl-holdings-home.jpg` |
| `terra-marketing.jpg` | Pre-repositioning |
| `vessels-dashboard.jpg` | Pre-repositioning |
| `aegis-soc-dashboard.jpg` | Pre-repositioning |
| `stephen-site.jpg` | Removed artifact; content moved to `/founder` route |

---

## Current Screenshots

### platform/ — Public marketing + trust surface (szl-holdings artifact)

Captured: 2026-04-21 | Workflow: `artifacts/szl-holdings: web` | Viewport: 1280×720

| File | Page | Description |
|------|------|-------------|
| `platform/szl-holdings-home.jpg` | `/` | Homepage hero — "One platform. Every AI action requires human approval." Post-repositioning institutional design. |
| `platform/szl-holdings-trust.jpg` | `/trust` | Trust Center landing — "Trust is part of the product, not a slide at the end." |
| `platform/szl-holdings-trust-security.jpg` | `/trust/security` | **Security Posture** — live trust sub-page: "This page documents the current security controls in place for Lyte + Alloy — the honest current state, not aspirational certifications." |
| `platform/szl-holdings-trust-architecture.jpg` | `/trust/architecture` | **Platform Architecture** — live trust sub-page: "The signal → interpretation → recommendation → approval → action → audit pipeline, tenant-aware architecture." |
| `platform/szl-holdings-trust-ai.jpg` | `/trust/ai` | **AI Policy** — live trust sub-page: "Every AI capability operates within a governance framework that enforces source grounding, human approval, complete decision lineage, and hard boundaries on autonomous action." |
| `platform/szl-holdings-trust-approvals.jpg` | `/trust/approvals` | **Approval Model** — live trust sub-page: "Every consequential action passes through a tiered approval path — enforced at the workflow execution layer." |
| `platform/szl-holdings-trust-operations.jpg` | `/trust/operations` | **Operations** — live trust sub-page: health monitoring, retry policies, documented runbooks, incident response targets (99.9% uptime, < 4 hr response, 30-day replay). |
| `platform/szl-holdings-solutions.jpg` | `/solutions` | Domain Packs page — "One governed decision system. Four domain packs." |
| `platform/szl-holdings-platform.jpg` | `/platform` | Platform depth page — "Platform → Primitives → Domain Packs." |
| `platform/szl-holdings-architecture.jpg` | `/architecture` | Architecture page — "Ten layers. One governed pipeline. Built to be defensible." |
| `platform/szl-holdings-company.jpg` | `/company` | Company page — "One governed decision loop. Every high-consequence domain." |

### solutions/ — Domain pack public surfaces

Captured: 2026-04-21 | Viewport: 1280×720

| File | Artifact | Description |
|------|----------|-------------|
| `solutions/sentra-cyber-resilience.jpg` | `artifacts/sentra: web` | Sentra Cyber Resilience Command — "Turn cyber posture, recovery readiness, and live incidents into command." |
| `solutions/vessels-maritime-intelligence.jpg` | `artifacts/vessels: web` | Vessels Maritime Intelligence — "Fleet operations. Decided faster." Note: "214 VESSELS TRACKED" is simulated AIS data. |
| `solutions/terra-real-estate.jpg` | `artifacts/terra: web` | Terra Property Intelligence — "The operating surface for serious real estate." |
| `solutions/carlota-jo.jpg` | `artifacts/carlota-jo: web` | Carlota Jo Private Advisory — "Where life's complexity finds quiet clarity." |
| `solutions/szl-holdings-solutions.jpg` | `artifacts/szl-holdings: web` | Solutions overview page (same surface as platform/szl-holdings-solutions.jpg). |

### mobile/ — Mobile command surface

Captured: 2026-04-21 | Workflow: `artifacts/szl-holdings-mobile: expo`

| File | Description |
|------|-------------|
| `mobile/cortex-mobile-home.jpg` | CORTEX Expo mobile workflow running. Web preview renders SZL Holdings homepage (the Expo app uses a WebView wrapper for the web preview). Native mobile experience requires Expo Go on a physical device or TestFlight/Play Internal build. |

### admin/ — Admin surface access control verification

Captured: 2026-04-21 | Workflow: `artifacts/szl-holdings: web`

| File | Page | Description |
|------|------|-------------|
| `admin/szl-holdings-admin.jpg` | `/admin` | Admin route correctly enforces authentication — "Authentication Required. Sign in to access this section." Proves deny-by-default access control is working at the UI layer. |
| `admin/szl-holdings-admin-command-center.jpg` | `/admin/command-center` | Admin command center route also correctly enforces authentication. Same auth-gated behavior. |

**Note:** Admin screenshots show the auth-gated state because no user session is authenticated in this environment. The screenshots confirm the correct security behavior: admin routes are properly protected. Authenticated admin views (user management, role assignment, system configuration, audit log review) require a provisioned database and an authenticated session with admin-role access.

---

## Trust Pages Confirmed Live on Public Surface

The following trust sub-pages are confirmed accessible and rendering correctly as of 2026-04-21:

| Route | Page | Screenshot |
|-------|------|-----------|
| `/trust` | Trust Center hub | `platform/szl-holdings-trust.jpg` |
| `/trust/security` | Security Posture | `platform/szl-holdings-trust-security.jpg` |
| `/trust/architecture` | Platform Architecture | `platform/szl-holdings-trust-architecture.jpg` |
| `/trust/ai` | AI Policy | `platform/szl-holdings-trust-ai.jpg` |
| `/trust/approvals` | Approval Model | `platform/szl-holdings-trust-approvals.jpg` |
| `/trust/operations` | Operations & Reliability | `platform/szl-holdings-trust-operations.jpg` |

Additional trust routes in the route tree (not yet captured):
- `/trust/governance` — confirmed in QA route tree
- `/status` — platform status page
- `/legal/privacy` — privacy policy
- `/legal/terms` — terms of service
- `/accessibility` — accessibility statement

---

## Screenshots Not Yet Captured

The following authenticated product surfaces require the API server (`DATABASE_URL` + running DB) and a seeded user session.

| Surface | Artifact | Blocker | Priority |
|---------|----------|---------|---------|
| Lyte/PRISM command surface (authenticated) | `artifacts/lyte-command-center` | API server not running — requires `DATABASE_URL` | High |
| Command portal (authenticated) | `artifacts/command` | Workflow startup timeout + API server dependency | High |
| Sentra cyber command dashboard (authenticated) | `artifacts/sentra` | API server not running | Medium |
| Vessels fleet dashboard (authenticated) | `artifacts/vessels` | API server not running | Medium |
| Terra property dashboard (authenticated) | `artifacts/terra` | API server not running + `MAPBOX_TOKEN` missing | Medium |
| Counsel legal matter command (authenticated) | `artifacts/counsel` | API server not running | Medium |
| Admin command center (authenticated) | `artifacts/szl-holdings` `/admin/command-center` | Requires API server + admin-role session | Medium |
| Pulse AI briefing (authenticated) | `artifacts/pulse` | Workflow not started | Low |
| Aegis pitch deck | `artifacts/aegis` | Workflow not started | Low |
| CORTEX native mobile (device) | `artifacts/szl-holdings-mobile` | Requires Expo Go / TestFlight on physical device | Low |

---

## Screenshot Standards

- **Viewport:** 1280×720 (standard desktop)
- **Format:** JPEG (`.jpg`)
- **Naming:** `{surface}-{page-slug}.jpg` — all lowercase, hyphens
- **Capture tool:** Replit screenshot (browser render)
- **Freshness:** Screenshots should be retaken after any significant UI change

---

## 2026-04-22 update — Task #2892 (superseded by #2898)

### AIS disclosure shipped across the public surface

| File | Change |
|------|--------|
| `artifacts/vessels/src/pages/vessels-home.tsx` | Hero map badge now reads `AIS FEED · SIMULATED` / `DEMO`; "Live AIS position tracking" bullet rephrased to "Simulated AIS position tracking and historical trail (live public-feed integrations available)". |
| `artifacts/vessels/src/pages/marketing-home.tsx` | Feature card relabeled "Real-time AIS ingestion (live + simulated)" with explanatory copy; Fleet Snapshot block tagged "Simulated · Demo data" (amber pulse); onboarding step body explains the live-vs-simulated split. |
| `artifacts/vessels/src/pages/marketing-platform.tsx` | "Live AIS vessel positions" → "AIS vessel positions (live public feeds plus simulated demo data)". |
| `artifacts/vessels/src/pages/marketing-capabilities.tsx` | "Live AIS Fleet Map" → "AIS Fleet Map (live + simulated)". |
| `artifacts/vessels/src/pages/marketing-pricing.tsx` | "Real-time AIS tracking" → "AIS tracking (live public feeds + simulated demo data)". |
| `artifacts/vessels/src/pages/billing-panel.tsx` | "Real-time AIS fleet tracking" → "AIS fleet tracking (live public feeds + simulated demo data)". |
| `artifacts/vessels/src/pages/intelligence.tsx` | "Live AIS tracking and port congestion signals" → simulated qualifier added. |
| `artifacts/vessels/src/pages/fleet-assessment.tsx` | "Real-time AIS feed" → "AIS feed (live public sources + simulated demo data)". |
| `artifacts/vessels/src/pages/fleet-dashboard.tsx` | Demo-overlay copy now says "AIS tracking (live public feeds plus simulated demo data)". |
| `artifacts/szl-holdings/src/pages/solutions-vessels.tsx` | Page meta description discloses public AIS feeds (Digitraffic, BarentsWatch) integration vs simulated demo data. |
| `artifacts/szl-holdings/src/pages/landing.tsx` | Vessels capability chip "Real-time AIS telemetry" → "AIS telemetry (live + simulated)". |
| `artifacts/szl-holdings/src/pages/leadership.tsx` | Case-study outcome rewritten to disclose simulated demo data. |
| `artifacts/szl-holdings/src/pages/founder/FounderArchitecture.tsx` | Vessels architecture bullet rewritten with the live + simulated qualifier. |
| `artifacts/szl-holdings/src/pages/pilot-vessels.tsx` | Pilot prerequisite reworded — AIS data may be live public feeds or simulated for the pilot. |
| `artifacts/vessels/src/lib/voyage-export.ts` | Footer now uses canonical brand "SEXTANT Maritime Intelligence" (brand:strings fix). |

The `/api/vessels/live/ais` and `/api/vessels/live/ais/combined` endpoints
continue to call real Digitraffic + BarentsWatch feeds with cached
fallbacks; the wording above clarifies which surfaces are demo-backed.

### Disclosure regression test

Added `scripts/check-ais-disclosure.ts` (wired up as `pnpm ais:disclosure`).
It scans the eight public-surface files above and fails CI if any of them
mention AIS without a "simulated" qualifier — preventing regression to the
old "Live AIS" / "Real-time AIS" marketing copy.

### authenticated/ — Authenticated-surface screenshots

Captured: 2026-04-22 | Viewport: 1280×720 | API server not provisioned in
this environment, so most non-public routes either render their auth gate
or fall back to the marketing landing. The Lyte/PRISM workspace renders a
seeded demo without requiring an API session.

| File | Artifact / Route | What it shows |
|------|------------------|---------------|
| `authenticated/lyte-prism-command.jpg` | `artifacts/lyte-command-center` `/` | KORA Decision Intelligence dashboard — left rail (Now/Next/Links signal queue), Vantex Acquisition workspace with KPI tiles (Active Signals, Stalled Approvals, Workflow Health, Decision Backlog, Evidence Coverage), critical-signals list. Live demo data, no API required. |
| `authenticated/sentra-command-center.jpg` | `artifacts/sentra` `/command-center` | TENAX Cyber Resilience Command shell — OS Layer / Core / Agent Mesh navigation, signal feed (CVE-2024-21412, control drift, resilience score, incident IC-2409). Center pane returns "Page not found" because the API is offline; navigation chrome confirms the post-auth shell renders. |
| `authenticated/sentra-threat-command.jpg` | `artifacts/sentra` `/` | TENAX marketing landing with the post-redesign red/dark palette and SANDBOX badge. Confirms the workflow boots and the public hero is intact. |
| `authenticated/terra-distress-pipeline.jpg` | `artifacts/terra` `/` | DOMAINE Property Intelligence landing — "The operating surface for serious real estate." Cookie banner present. Distress pipeline route falls back to landing without the API. |
| `authenticated/terra-dashboard.jpg` | `artifacts/terra` `/dashboard` | Same landing fallback as above for the dashboard route — confirms the workflow runs and the unauthenticated experience is consistent. |
| `authenticated/vessels-fleet-dashboard.jpg` | `artifacts/vessels` `/fleet-dashboard` | "Authentication required — Sign in to access SEXTANT." Proves the fleet dashboard is correctly auth-gated. |
| `authenticated/vessels-ais-live-tracking.jpg` | `artifacts/vessels` `/ais-live-tracking` | Marketing landing (Vessels falls back here when the AIS workspace isn't authenticated) showing the "Fleet operations. Decided faster." hero and live-fleet table preview. |

### Outstanding items folded into superseding task #2898

`DATABASE_URL`, `REPL_ID`, and `MFA_SECRET_ENCRYPTION_KEY` are still unset
in this environment, so a fully authenticated walkthrough of Lyte, Sentra,
Terra, Vessels, Counsel, and Command portals cannot be captured here. Task
#2898 supersedes this work and owns those captures once secrets/database
are provisioned. The Command artifact additionally fails to start (port
5000 timeout — pre-existing blocker) and is not in the list above.

---

*Last updated: 2026-04-22 — Task #2892 (superseded by #2898)*
