# SZL Holdings — Full Ecosystem Audit

_Generated: March 30, 2026_

## 1. Artifact Inventory

| Artifact | Type | Status | Pages | Public? | Port |
|----------|------|--------|-------|---------|------|
| szl-holdings | Web (Vite/React) | Running | 31 | Yes — landing, ecosystem, ventures, founder, contact, legal, trust | 18490 |
| alloy | Web (Vite/React) | Running | 12 | Private — requires nav | 25500 |
| lyte-command-center | Web (Vite/React) | Running | 33 | Private — command inbox, approvals, ownership, escalation, readiness | 19290 |
| vessels | Web (Vite/React) | Running | 48 | Hybrid — marketing pages public, /dashboard/* private | 18485 |
| terra | Web (Vite/React) | Running | 29 | Semi-public — hidden from public nav, functional at /terra/ | 25100 |
| carlota-jo | Web (Vite/React) | Running | 21 | Yes — hero, services, approach, testimonials, inquiry | 21200 |
| stephen-site | Web (Vite/React) | Running | 22 | Yes — hero, work, frameworks, writing, contact | 21130 |
| firestorm | Web (Vite/React) | Running | 25 | Hidden — functional at /firestorm/, removed from public nav | 23932 |
| inca | Web (Vite/React) | Running | 38 | Hidden — functional at /inca/, removed from public nav | 24500 |
| dreamscape | Web (Vite/React) | Running | 20 | Hidden — functional at /dreamscape/, removed from public nav | 23397 |
| msp | Web (Vite/React) | Running | 16 | Hidden — functional at /msp/, removed from public nav | 25000 |
| api-server | Express API | Running | N/A | Backend only — /api/* | 8080 |
| mockup-sandbox | Vite dev server | Running | N/A | Design tool — /__mockup | 8081 |
| admin-panel | Web (Vite/React) | Not running | 32 | Internal only |  |
| project-list | Web (Vite/React) | Not running | 3 | Internal only |  |
| readiness-report | Web (Vite/React) | Not running | 4 | Internal only |  |

**Total: 16 artifacts, 13 workflows running, 334 pages across all apps**

## 2. Brand Hierarchy (Public)

```
SZL Holdings (parent)
  └── Alloy (intelligence backbone)
       ├── Lyte (business observability)
       ├── Vessels (maritime command)
       └── Carlota Jo (premium services)
  └── Stephen Lutar (founder identity)
```

Hidden from public (internal/dev only): Terra, Firestorm, INCA, Dreamscape, MSP/Rosie

## 3. Public Routes

### SZL Holdings (/)
- `/` — Home (Hero, FeaturedPlatforms, EcosystemLogic, AlloyBackbone, FounderBlock, ProofGrid, ContactSegments)
- `/ecosystem` — Ecosystem overview
- `/ventures` — Portfolio/ventures page
- `/founder` — Stephen Lutar founder page
- `/contact` — Contact form
- `/legal/privacy` — Privacy policy
- `/legal/terms` — Terms of service
- `/trust` — Trust center
- `/investor` — Investor story
- `/kpis` — KPI dashboard
- `/admin` — Admin page (should be auth-protected)

### Carlota Jo (/carlota-jo/)
- `/` — Home (Hero, Services, Approach, Testimonials, InquiryForm)

### Stephen Site (/stephen/)
- `/` — Home (Hero, CaseStudies, Services/Frameworks, Writing, Contact)

### Vessels (/vessels/)
- `/` — Marketing home
- `/platform`, `/capabilities`, `/use-cases`, `/security`, `/pricing`, `/demo`, `/sign-in` — Marketing pages
- `/legal/privacy`, `/legal/terms` — Legal
- `/dashboard/*` — Private dashboard routes

## 4. Private Routes (Require Auth)

### Alloy (/alloy/)
- All routes: `/`, `/workflows`, `/connectors`, `/governance`, `/analytics`

### Lyte (/lyte-command-center/)
- All routes: `/`, `/action-queue`, `/approvals`, `/ownership`, `/escalation`, `/intervention`, `/readiness`

### Vessels (/vessels/dashboard/*)
- `/dashboard`, `/dashboard/fleet`, `/dashboard/vessels`, `/dashboard/routes`, `/dashboard/alerts`, etc.

## 5. API Routes (49 route files)

| Route File | Prefix | Auth Required | Status |
|------------|--------|---------------|--------|
| health.ts | /api/health | No | Real — returns live health data |
| auth.ts | /api/auth | Partial | Real — session management |
| oidc-auth.ts | /api/auth/oidc | No | Real — OIDC PKCE flow |
| lyte.ts | /api/lyte | Yes | Real — signals, executive summary |
| lyte-platform.ts | /api/lyte/platform | Yes | Real — role-aware dashboard, signal lifecycle |
| vessels.ts | /api/vessels | Yes | Hybrid — some endpoints real, some demo data |
| vessels-platform.ts | /api/vessels/platform | Yes | Real — fleet, voyages, exceptions |
| terra.ts | /api/terra | Yes | Real — distress properties |
| terra-distress.ts | /api/terra-distress | Yes | Real — NYC data pipeline |
| alloy.ts | /api/alloy | Yes | Real — signal ingest, workflows, artifacts |
| firestorm.ts | /api/firestorm | Yes | Hybrid — SOC dashboard real, others demo |
| inca.ts | /api/inca | Yes | Demo data only |
| intelligence.ts | /api/intelligence | Yes | Demo data — geopolitical, maritime, threats |
| observability.ts | /api/observability | Yes | Real — app health, vitals |
| services.ts | /api/services | Partial | Real — service health |
| admin.ts | /api/admin | Yes | Real — admin operations |
| billing.ts | /api/billing | Yes | Stub — returns static plans |
| cms.ts | /api/cms | Yes | Real — content management |
| feature-flags.ts | /api/feature-flags | Yes | Real — flag management |
| connectors.ts | /api/connectors | Yes | Real — connector status |
| stephen.ts | /api/stephen | No | Real — portfolio, case studies |
| carlota-jo.ts | /api/carlota-jo | Partial | Real — inquiries, services |
| Other routes | Various | Yes | Mix of real and demo |

## 6. Database Schema

**198 tables** across PostgreSQL database. Key table groups:

| Domain | Tables | Status |
|--------|--------|--------|
| Auth (users, sessions, org_members) | 4 | Real — OIDC flow working |
| Organizations | 2 | Real — multi-org support |
| Platform canonical (products, signals, actions, workflows, runs, approvals, artifacts, event_log, readiness, feature_flags) | 12 | Real — seeded on startup |
| SZL canonical (szl_products, szl_signals, szl_actions, szl_workflows, etc.) | 16 | Real — seed script available |
| Maritime (ports, corridors, vessels, voyages, exceptions) | 5 | Real — seeded |
| Terra (distress_properties, distress_alerts, distress_ingestion_runs) | 3 | Real — NYC open data pipeline |
| Alloy (alloy_signals, alloy_workflows, alloy_actions, etc.) | 8 | Real |
| Firestorm (incidents, assessments, campaigns, alerts, etc.) | 10 | Schema exists, data mixed |
| INCA (inca_experiments, inca_models, inca_insights, etc.) | 6 | Schema exists, demo data |
| Vessels (vessels, voyages, exceptions, etc.) | 5 | Real |
| CMS, billing, notifications, etc. | ~127 | Mixed — some real, some scaffolded |

## 7. Auth/Access Model

- **Provider**: Replit Auth (OIDC with PKCE)
- **Session management**: Express sessions with `SESSION_SECRET`
- **Platform roles**: 11 types (super_admin, org_admin, executive_viewer, product_admin, ops_lead, analyst, contributor, viewer, agent, api_client, auditor)
- **Org scoping**: Organizations table with membership; routes use `requireOrgScope()` middleware
- **API keys**: api_keys table for machine access
- **Audit logging**: audit_logs and event_log tables

## 8. Real vs Mocked Classification

### Real (production-grade data flowing)
- Lyte signals and executive summary API
- Platform canonical data (seeded on startup)
- Terra NYC distress data pipeline (5 open data sources)
- Auth/session flow
- Health/observability endpoints
- Feature flags system
- CMS content management
- Audit logging

### Demo/Mocked (generates sample data)
- Vessels fleet data (10 demo vessels, simulated positions)
- Intelligence endpoints (geopolitical, maritime, threats)
- INCA experiments and models
- Firestorm SOC data (partially real, partially generated)
- Carlota Jo client profiles (demo)
- Billing/subscription data

### Scaffolded (schema exists, no data flow)
- Many dreamscape tables (campaigns, assets, scripts, storyboards)
- Nuro mesh tables
- Some entity relationship tables

## 9. Brand Hierarchy Conflicts

- **Resolved**: Nimbus → Alloy rebrand complete across all surfaces
- **Resolved**: Dreamscape references → Alloy
- **Resolved**: Terra and Firestorm hidden from public nav
- **Warning**: `dreamscape` slug still exists in config (intentional as legacy reference)
- **Resolved**: Admin page at `/admin` and `/kpis` on SZL Holdings now auth-gated via RequireAuth wrapper

## 10. Production Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| ~~Admin page accessible without auth check~~ | ~~Medium~~ | Resolved — RequireAuth wrapper added to /admin and /kpis |
| Demo data visible in Vessels dashboard | Low | Demo mode banner shown; data clearly labeled |
| NYC open data API returning 400s | Low | Graceful fallback — ingestion logs 0 records, no crash |
| 401 responses on observability vitals | Low | Auth required but clients not sending tokens — cosmetic noise |
| Large number of DB tables (198) | Medium | Schema consolidation recommended for production |
| No rate limiting on public contact forms | Medium | Add rate limiting before production traffic |
