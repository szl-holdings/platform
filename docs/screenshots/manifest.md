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

*Last updated: 2026-04-21 — Task #2850*
