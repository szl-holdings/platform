# Surface Visibility Map — SZL Holdings Platform

**Date:** April 18, 2026  
**Auditor:** Platform Engineering  
**Purpose:** For each capability, confirm it is reachable from navigation on the correct surface (web/mobile/admin/exports/marketing)

**Legend:**
- ✅ Reachable via navigation / direct URL
- ⚠️ Exists but no nav entry / requires direct URL
- ❌ Not reachable (broken link, missing route, hidden)
- 🔒 Auth-gated (requires login)
- 🔷 Demo-mode only

---

## 1. SZL Holdings Dashboard (`/`)

| Surface | Route | Nav Entry | Status | Notes |
|---------|-------|----------|--------|-------|
| Landing page | `/` | Yes (root) | ✅ | Public |
| Platform overview | `/platform` | Yes (nav) | ✅ | Public |
| Lyte module | `/lyte` | Yes (nav) | ✅ 🔒 | Auth required |
| Solutions | `/solutions` | Yes (nav) | ✅ | Public |
| Contact | `/contact` | Yes (footer) | ✅ | Public |
| Trust Center | `/trust-center` | Yes (nav) | ✅ | Public |
| Privacy Policy | `/legal/privacy` | Yes (footer) | ✅ | Public |
| Terms of Service | `/legal/terms` | Yes (footer) | ✅ | Public |
| Decision Theater | `/decision-center` | Yes (dashboard nav) | ✅ 🔒 | Auth required |
| Nuro Forge | `/nuro-forge` | Yes (dashboard nav) | ✅ 🔒 | Auth required |
| Founder page | `/founder` | ⚠️ | ⚠️ | In nav at /about, route exists |
| Autopilot header | Part of dashboard | N/A (always visible) | ⚠️ | Hardcoded values — stub |
| ATLAS observability | `/atlas` | Yes (dashboard nav) | ✅ 🔒 | |

---

## 2. Unified Command (`/command/`)

| Surface | Route | Nav Entry | Status | Notes |
|---------|-------|----------|--------|-------|
| Command root | `/command/` | ✅ | ✅ 🔒 | |
| Strategy | `/command/strategy` | Yes (sidebar) | ✅ 🔒 | |
| Executive Briefing | `/command/strategy/executive-briefing` | Yes (sidebar) | ✅ 🔒 | |
| Operations | `/command/operations` | Yes (sidebar) | ✅ 🔒 | |
| Approvals | `/command/operations/approvals` | Yes (sidebar) | ✅ 🔒 | |
| Blocker Board | `/command/operations/blocker-board` | Yes (sidebar) | ✅ 🔒 | |
| Alloy Canvas | `/command/operations/alloy/canvas` | Yes (sidebar) | ✅ 🔒 | |
| Infrastructure/IMPERIUM | `/command/infrastructure` | Yes (sidebar) | ✅ 🔒 | |
| Governed Decision Loop | `/command/operations/governed-decision-loop` | Yes (sidebar) | ✅ 🔒 | |
| Analytics | `/command/analytics` | Yes (sidebar) | ✅ 🔒 | |
| Cognitive Command Center | `/command/cognitive` | Yes (Strategy sidebar) | ✅ 🔒 | |
| Self Model Console | `/command/cognitive/self-model` | Yes (Cognitive nav) | ✅ 🔒 | |
| World Model Explorer | `/command/cognitive/world-model` | Yes (Cognitive nav) | ✅ 🔒 | |
| CORTEX badge counts | Sidebar indicator | N/A | ⚠️ | Stub — not wired to live counts |

---

## 3. Vessels Maritime Intelligence (`/vessels/`)

| Surface | Route | Nav Entry | Status | Notes |
|---------|-------|----------|--------|-------|
| Vessels root | `/vessels/` | ✅ | ✅ 🔒 | |
| Fleet management | `/vessels/fleet` | Yes (sidebar) | ✅ 🔒 | |
| Vessel tracking | `/vessels/tracking` | Yes (sidebar) | ⚠️ | Map view blank without Mapbox token |
| Maritime intelligence | `/vessels/intelligence` | Yes (sidebar) | ✅ 🔒 | |
| Port analysis | `/vessels/ports` | Yes (sidebar) | ✅ 🔒 | |
| Decision Center | `/vessels/decision-center` | Yes (sidebar) | ✅ 🔒 | |
| Insurance module | `/vessels/insurance` | Yes (sidebar) | ❌ | UI exists; not connected to DB/API |
| Trading module | `/vessels/trading` | Yes (sidebar) | ❌ | UI exists; not connected |
| Platform module | `/vessels/platform` | Yes (sidebar) | ❌ | UI exists; not connected |

---

## 4. Terra Real Estate Intelligence (`/terra/`)

| Surface | Route | Nav Entry | Status | Notes |
|---------|-------|----------|--------|-------|
| Terra root | `/terra/` | ✅ | ✅ 🔒 | |
| Properties | `/terra/properties` | Yes (sidebar) | ✅ 🔒 | |
| Portfolio | `/terra/portfolio` | Yes (sidebar) | ✅ 🔒 | |
| Market analysis | `/terra/market` | Yes (sidebar) | ✅ 🔒 | NYC Open Data live |
| Valuation tools | `/terra/valuation` | Yes (sidebar) | ✅ 🔒 | |
| Map view | Part of routes | ⚠️ | ⚠️ | Blank without Mapbox token |
| Decision Center | `/terra/decision-center` | Yes (sidebar) | ✅ 🔒 | |

---

## 5. Aegis Investor Pitch Deck / Defense Intelligence (`/aegis/`)

| Surface | Route | Nav Entry | Status | Notes |
|---------|-------|----------|--------|-------|
| Aegis root / slides | `/aegis/` | ✅ | ✅ | Investor pitch deck |
| Threat intelligence | `/aegis/threats` | Yes (nav) | ✅ 🔒 | |
| Vulnerabilities | `/aegis/vulnerabilities` | Yes (nav) | ✅ 🔒 | |
| Network security | `/aegis/network` | Yes (nav) | ✅ 🔒 | |
| Compliance | `/aegis/compliance` | Yes (nav) | ✅ 🔒 | |
| Incidents | `/aegis/incidents` | Yes (nav) | ✅ 🔒 | |
| CISO Executive Dashboard | `/aegis/ciso-dashboard` | Yes (nav) | ⚠️ | UI built; KPIs not wired |
| 8 new security modules | Various | Yes (nav) | ⚠️ | UI exists; not connected to APIs |

---

## 6. Carlota Jo Consulting (`/carlota-jo/`)

| Surface | Route | Nav Entry | Status | Notes |
|---------|-------|----------|--------|-------|
| Carlota Jo root | `/carlota-jo/` | ✅ | ✅ | Public |
| Services | `/carlota-jo/services` | Yes (nav) | ✅ | |
| About | `/carlota-jo/about` | Yes (nav) | ✅ | |
| Contact | `/carlota-jo/contact` | Yes (nav) | ✅ | Form wired |
| Client portal | `/carlota-jo/clients` | ⚠️ | ✅ 🔒 | Auth required |
| Advisory sessions | `/carlota-jo/sessions` | ⚠️ | ✅ 🔒 | Auth required |
| Decision Center | `/carlota-jo/decision-center` | Yes (sidebar) | ✅ 🔒 | |

---

## 7. Pulse AI Executive Briefing (`/pulse/`)

| Surface | Route | Nav Entry | Status | Notes |
|---------|-------|----------|--------|-------|
| Pulse root | `/pulse/` | ✅ | ✅ | |
| Demo mode | `/pulse/?demo` | N/A (URL param) | ✅ 🔷 | Works without sign-in |
| Briefing reader | `/pulse/briefing` | Yes (nav) | ✅ | Demo content |
| Decisions | `/pulse/decisions` | Yes (nav) | ✅ 🔒 | |
| Live AI generation | N/A | N/A | ❌ | Not implemented |
| PDF export | N/A | N/A | ❌ | Not implemented |
| Email subscription | N/A | N/A | ❌ | Not implemented |

---

## 8. API Server (`/api/`)

| Surface | Route | Status | Notes |
|---------|-------|--------|-------|
| Health check | `GET /api/health` | ✅ | |
| Health variants | `GET /api/health/live`, `/ready`, `/detailed`, `/ai`, `/integrations`, `/external-feeds` | ✅ | |
| Auth flow | `GET /api/login`, `/callback`, `/logout` | ✅ | |
| GraphQL | `POST /api/graphql` | ✅ 🔒 | |
| Platform status | `GET /api/status` | ✅ | Public |
| Contact form | `POST /api/contact` | ✅ | Public |
| Demo request | `POST /api/demo` | ✅ | Public |
| Admin panel | `/api/admin/*` | ✅ 🔒 | Super admin only |
| Firestorm seed | `POST /api/firestorm/seed` | 🚫 prod | Route is NOT registered when `NODE_ENV=production` or `APP_ENV=production` (see `artifacts/api-server/src/routes/firestorm/assets-cases.ts` → `registerSeedRouteIfNonProd`). Production requests receive a generic Express 404. Available in dev/test only. |
| NEXUS endpoints | `/api/nexus/*` | ✅ 🔒 | |

---

## 9. Mobile (szl-holdings-mobile)

| Surface | Screen | Nav Entry | Status |
|---------|--------|----------|--------|
| Dashboard | `app/(shell)/index.tsx` | Tab | ✅ |
| Intelligence/Decisions | `app/(shell)/intelligence/decisions.tsx` | Sidebar | ✅ |
| Push notifications | N/A | N/A | ❌ Stub |

---

## 10. Gaps Summary

| Type | Count | Notes |
|------|-------|-------|
| Hidden (reachable by URL, no nav) | 4 | Carlota sessions, client portal, Aegis CISO dash, Founder page |
| Broken (nav entry, not connected) | 6 | Vessels insurance/trading/platform, Pulse live AI/PDF/email |
| Blank without credentials | 2 | Map views (Mapbox token missing) |
| Intentionally demo-only | 3 | Pulse demo mode, Cognitive Console fallback data, Command demo mode |
| **Total gaps** | **15** | |

---

*See also: `docs/audit/CAPABILITY_INVENTORY.md`, `docs/audit/MOCK_AND_STUB_REGISTER.md`*
