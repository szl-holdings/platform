# Route Verification Matrix — SZL Holdings Platform

**Date:** 2026-04-26
**Method:** `pnpm qa:routes` (`scripts/qa/smoke-routes.js`, Node.js WHATWG fetch, port-direct) + source code inspection + API health probe
**Scope:** All active web artifacts + API server. Mobile (Expo) and video artifacts noted separately.
**Runner result:** 164 routes checked — 164 passed, 0 failed (see `audit/runtime/smoke-test-results.md`)
**Infrastructure note:** Terra dev-server port changed 6000 → 6100 (port 6000 is in the WHATWG Fetch blocked-port list)
**Legend:** Y = Yes / confirmed | N = No / missing | P = Partial / seeded | — = Not applicable | ? = Not verified in this run

---

## How to Read This Matrix

| Column | Meaning |
|---|---|
| **Route** | URL path as tested or inspected |
| **HTTP** | Response status code from smoke runner, or expected code from source inspection |
| **Source** | How the route was verified: `runner` = live HTTP smoke test via `pnpm qa:routes`; `source` = identified via React Router / source-code inspection only (not directly tested by runner) |
| **Layout** | Shell/chrome renders (nav, sidebar, page frame) |
| **Fatal JS Err** | Uncaught JS exception on page load |
| **Key CTA** | Primary call-to-action reachable and not broken |
| **Auth Redirect** | Unauthenticated request is properly redirected or 401'd |
| **API Deps** | API dependencies respond (200 or 401 when expected) |
| **Empty State** | Empty/zero-data state shows placeholder rather than blank/crash |
| **Mobile** | Layout usable at 375px mobile width |

> **Note:** Layout, Fatal JS Err, Key CTA, Empty State, and Mobile columns are assessed via source inspection and prior screenshot evidence — not live browser automation. Full Playwright e2e coverage is a follow-up task.

---

## 1. API Server (`/api/`)

| Route | HTTP | Source | Layout | Fatal JS Err | Key CTA | Auth Redirect | API Deps | Empty State | Mobile | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `GET /api/health` | 200 | runner | — | — | — | N/A | Y | — | — | Returns `{status:"ok", mode:"demo", db:ok, ai:live}` |
| `GET /api/health/live` | 200 | runner | — | — | — | N/A | Y | — | — | Liveness probe |
| `GET /api/health/ready` | 200 | runner | — | — | — | N/A | Y | — | — | Readiness probe |
| `GET /api/csrf-token` | 200 | runner | — | — | — | N/A | Y | — | — | CSRF token endpoint |
| `GET /api/docs` | 200 | runner | — | — | — | N/A | Y | — | — | API documentation |
| `GET /api/auth/me` | 401 | source | — | — | — | Y | — | — | — | Correctly auth-gated |
| `GET /api/companies` | 401 | source | — | — | — | Y | — | — | — | Correctly auth-gated |
| `GET /api/properties` | 401 | source | — | — | — | Y | — | — | — | Correctly auth-gated |
| `GET /api/vessels` | 401 | source | — | — | — | Y | — | — | — | Correctly auth-gated |
| `GET /api/alerts` | 401 | source | — | — | — | Y | — | — | — | Correctly auth-gated |
| `GET /api/terra/properties` | 401 | source | — | — | — | Y | — | — | — | Correctly auth-gated |
| `GET /api/terra/markets` | 401 | source | — | — | — | Y | — | — | — | Correctly auth-gated |
| `GET /api/aegis/threats` | 401 | source | — | — | — | Y | — | — | — | Correctly auth-gated |
| `GET /api/sentra/risks` | **404** | source | — | — | — | — | **N** | — | — | **BUG: route not registered** |
| `GET /api/pulse/briefings` | 401 | source | — | — | — | Y | — | — | — | Correctly auth-gated |
| `GET /api/counsel/matters` | 401 | source | — | — | — | Y | — | — | — | Correctly auth-gated |
| `GET /api/substrate` | 401 | source | — | — | — | Y | — | — | — | Correctly auth-gated |
| `GET /api/openai` | 401 | runner | — | — | — | Y | — | — | — | Voice/AI router; correctly auth-gated |

**Discovered API prefixes (runner, all 13/13 pass):** `/api/a11oy`, `/api/competitive-intel`, `/api/executive`, `/api/helios`, `/api/intelligence-economics`, `/api/mission-runbooks` (200), `/api/nexus`, `/api/ontology`, `/api/openai`, `/api/provenance`, `/api/pulse`, `/api/pulse/org`, `/api/signal-bus`

**Gap:** `/api/sentra/risks` returns 404 — the Sentra risk router is not mounted in `api-server/src/routes/index.ts`. Authenticated Sentra UI will receive 404 for its risk feed. **Follow-up required.**

---

## 2. SZL Holdings Dashboard (`/`)

| Route | HTTP | Source | Layout | Fatal JS Err | Key CTA | Auth Redirect | API Deps | Empty State | Mobile | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | 200 | runner | Y | N | Y | Y | P | P | Y | Investor dashboard; KPIs seeded |
| `/szl/` | 200 | source | Y | N | Y | Y | P | P | Y | Alternate mount path |
| `/szl/assets/index.js` | 200 | source | — | — | — | — | — | — | — | Asset serving confirmed |
| `/about` | 200 | runner | Y | N | Y | — | — | P | Y | Static marketing page |
| `/ecosystem` | 200 | runner | Y | N | Y | — | — | P | Y | Product ecosystem overview |
| `/platform` | 200 | runner | Y | N | Y | — | — | P | Y | Platform capability page |
| `/lyte` | 200 | runner | Y | N | Y | — | — | P | Y | Lyte business observability surface |
| `/alloy-fabric` | 200 | runner | Y | N | Y | — | — | P | Y | A11oy fabric overview |
| `/solutions` | 200 | runner | Y | N | Y | — | — | P | Y | Solutions index |
| `/solutions/aegis` | 200 | runner | Y | N | Y | — | — | P | Y | Aegis solution page |
| `/solutions/vessels` | 200 | runner | Y | N | Y | — | — | P | Y | Vessels solution page |
| `/solutions/terra` | 200 | runner | Y | N | Y | — | — | P | Y | Terra solution page |
| `/design-partners` | 200 | runner | Y | N | Y | — | — | P | Y | Design partner CTA |
| `/contact` | 200 | runner | Y | N | Y | — | — | P | Y | Contact form |
| `/pricing` | 200 | runner | Y | N | Y | — | — | P | Y | Pricing page |
| `/status` | 200 | runner | Y | N | Y | — | P | P | Y | Platform status page |
| `/how-it-works` | 200 | runner | Y | N | Y | — | — | P | Y | Product explainer |
| `/trust-center` | 200 | runner | Y | N | Y | — | — | P | Y | Trust and security hub |
| `/trust` | 200 | runner | Y | N | Y | — | — | P | Y | |
| `/trust/security` | 200 | runner | Y | N | Y | — | — | P | Y | |
| `/trust/governance` | 200 | runner | Y | N | Y | — | — | P | Y | |
| `/trust/architecture` | 200 | runner | Y | N | Y | — | — | P | Y | |
| `/trust/ai` | 200 | runner | Y | N | Y | — | — | P | Y | |
| `/trust/approvals` | 200 | runner | Y | N | Y | — | — | P | Y | |
| `/trust/operations` | 200 | runner | Y | N | Y | — | — | P | Y | |
| `/legal/privacy` | 200 | runner | Y | N | Y | — | — | P | Y | |
| `/legal/terms` | 200 | runner | Y | N | Y | — | — | P | Y | |
| `/accessibility` | 200 | runner | Y | N | Y | — | — | P | Y | |
| `/nuro-forge` | 200 | runner | Y | N | Y | — | — | P | Y | AI model forge surface |
| `/nuro-forge/arena` | 200 | runner | Y | N | Y | — | — | P | Y | |
| `/nuro-forge/governance` | 200 | runner | Y | N | Y | — | — | P | Y | |
| `/nuro-forge/composition` | 200 | runner | Y | N | Y | — | — | P | Y | |
| `/nuro-forge/fine-tuning` | 200 | runner | Y | N | Y | — | — | P | Y | |
| `/nuro-forge/multimodal` | 200 | runner | Y | N | Y | — | — | P | Y | |

**Gaps:** Autopilot header stats and genome score hardcoded. Empty states present (seeded fallback).

---

## 3. Aegis — Defense & Intelligence (`/aegis/`)

| Route | HTTP | Source | Layout | Fatal JS Err | Key CTA | Auth Redirect | API Deps | Empty State | Mobile | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/aegis/` | 200 | runner | Y | N | Y | Y | P | P | Y | Dashboard loads with seeded events |
| `/aegis/incidents` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/aegis/alerts` | 200 | runner | Y | N | Y | Y | P | P | Y | CISA KEV, AbuseIPDB active |
| `/aegis/cases` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/aegis/findings` | 200 | runner | Y | N | Y | Y | P | P | Y | NVD CVE active |
| `/aegis/executive-risk` | 200 | runner | Y | N | Y | Y | P | P | Y | CISO dashboard — not yet aggregated from live |
| `/aegis/asset-inventory` | 200 | runner | Y | N | Y | Y | P | P | Y | Runner slug: `asset-inventory` |
| `/aegis/command-home` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/aegis/simulation-panel` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/aegis/soc` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/aegis/threat-intel` | 200 | runner | Y | N | Y | Y | P | P | Y | Runner slug: `threat-intel` (not `threat-intelligence`) |
| `/aegis/compliance` | 200 | runner | Y | N | Y | Y | P | P | Y | MITRE ATT&CK v14 wired |
| `/aegis/adversary-emulation` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/aegis/operations` | 200 | source | Y | N | Y | Y | P | P | Y | Not in runner route list |

**Gaps:** 8 new security modules (adversary emulation, simulation panel, etc.) not wired to live API/case management.

---

## 4. Terra — Real Estate Intelligence (`/terra/`)

| Route | HTTP | Source | Layout | Fatal JS Err | Key CTA | Auth Redirect | API Deps | Empty State | Mobile | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/terra/` | 200 | runner | Y | N | Y | Y | P | P | Y | Portfolio overview loads |
| `/terra/dashboard` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/terra/deals` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/terra/documents` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/terra/analytics` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/terra/executive-overview` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/terra/climate-risk` | 200 | runner | Y | N | Y | Y | P | P | Y | FEMA active |
| `/terra/agents-command` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/terra/unified-command` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/terra/portfolio-scenario` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/terra/distress-engine` | 200 | runner | Y | N | Y | Y | P | P | Y | NYC distress pipeline live |
| `/terra/avm-engine` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/terra/markets` | 200 | source | Y | N | Y | Y | P | P | Y | NYC Open Data active |
| `/terra/map` | 200 | source | Y | N | Y | Y | **N** | Y | Y | **Map renders blank — Mapbox token not configured** |
| `/terra/portfolio` | 200 | source | Y | N | Y | Y | P | P | Y | |

**Gaps:** Map surface blank without Mapbox token — shows empty placeholder (not a crash). No live MLS/CoStar. Empty state is present (shows placeholder text) — not broken.

**Infrastructure fix:** Dev-server port changed 6000 → 6100 (port 6000 is in the WHATWG Fetch blocked-port list).

---

## 5. Vessels — Maritime Intelligence (`/vessels/`)

| Route | HTTP | Source | Layout | Fatal JS Err | Key CTA | Auth Redirect | API Deps | Empty State | Mobile | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/vessels/` | 200 | runner | Y | N | Y | Y | P | P | Y | Fleet overview with simulated AIS |
| `/vessels/fleet-dashboard` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/vessels/fleet-map` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/vessels/exceptions-center` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/vessels/alert-center` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/vessels/command-overview` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/vessels/document-engine` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/vessels/simulations-page` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/vessels/disruption-forecast` | 200 | runner | Y | N | Y | Y | P | P | Y | Open-Meteo Marine active |
| `/vessels/command-mode` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/vessels/voyage-desk` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/vessels/dark-vessel-detection` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/vessels/fleet` | 200 | source | Y | N | Y | Y | P | P | Y | Not in runner route list |
| `/vessels/tracking` | 200 | source | Y | N | Y | Y | **P** | Y | Y | AIS simulated — no live telemetry |
| `/vessels/intelligence` | 200 | source | Y | N | Y | Y | P | P | Y | GDELT active |

**Gaps:** 3 commercial modules (insurance, trading, platform) not connected to DB/API. AIS telemetry simulated.

---

## 6. Carlota Jo — Private Advisory (`/carlota-jo/`)

| Route | HTTP | Source | Layout | Fatal JS Err | Key CTA | Auth Redirect | API Deps | Empty State | Mobile | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/carlota-jo/` | 200 | runner | Y | N | Y | Y | Y | Y | Y | Most complete artifact |
| `/carlota-jo/about` | 200 | runner | Y | N | Y | Y | Y | Y | Y | |
| `/carlota-jo/approach` | 200 | runner | Y | N | Y | Y | Y | Y | Y | |
| `/carlota-jo/booking` | 200 | runner | Y | N | Y | Y | Y | Y | Y | Outlook Calendar integration active |
| `/carlota-jo/contact` | 200 | runner | Y | N | Y | Y | Y | Y | Y | |
| `/carlota-jo/founder` | 200 | runner | Y | N | Y | Y | Y | Y | Y | |
| `/carlota-jo/consulting-os` | 200 | runner | Y | N | Y | Y | Y | Y | Y | |
| `/carlota-jo/revenue-intelligence` | 200 | runner | Y | N | Y | Y | Y | Y | Y | World Bank, BLS active |
| `/carlota-jo/services` | 200 | source | Y | N | Y | Y | Y | Y | Y | Not in runner route list |
| `/carlota-jo/cases` | 200 | source | Y | N | Y | Y | Y | Y | Y | Not in runner route list |

**Gaps:** None blocking. Best candidate for first `live` promotion.

---

## 7. Command — Unified Command Portal (`/command/`)

| Route | HTTP | Source | Layout | Fatal JS Err | Key CTA | Auth Redirect | API Deps | Empty State | Mobile | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/command/` | 200 | runner | Y | N | Y | Y | P | P | Y | CORTEX hub |
| `/command/operations` | 200 | source | Y | N | Y | Y | P | P | Y | Not in runner route list |
| `/command/intel` | 200 | source | Y | N | Y | Y | P | P | Y | Not in runner route list |
| `/command/substrate` | 200 | source | Y | N | Y | Y | P | P | Y | Substrate MCP gateway; not in runner route list |

**Gaps:** CORTEX cross-domain badge counts not wired to live API. Push notification deep linking pending.

> **Note:** The runner tested only `/command/` (1/1). The additional routes above were identified via React Router source inspection. Runner route list for Command can be expanded in a follow-up.

---

## 8. Pulse — AI Executive Briefing (`/pulse/`)

| Route | HTTP | Source | Layout | Fatal JS Err | Key CTA | Auth Redirect | API Deps | Empty State | Mobile | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/pulse/` | 200 | runner | Y | N | Y | Y | P | P | Y | AI briefing dashboard |
| `/pulse/watchlist` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/pulse/library` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/pulse/confidence` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/pulse/custom` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/pulse/dissent` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/pulse/system` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/pulse/settings` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/pulse/constellation` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/pulse/engine` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/pulse/decisions` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/pulse/briefing` | 200 | source | Y | N | Y | Y | P | P | Y | Multi-provider AI active; not in runner route list |
| `/pulse/portfolio` | 200 | source | Y | N | Y | Y | P | P | Y | Not in runner route list |
| `/pulse/alerts` | 200 | source | Y | N | Y | Y | P | P | Y | Not in runner route list |

**Gaps:** Some signals use seeded data rather than live cross-domain aggregation.

---

## 9. Counsel — Legal Matter Command (`/counsel/`)

| Route | HTTP | Source | Layout | Fatal JS Err | Key CTA | Auth Redirect | API Deps | Empty State | Mobile | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/counsel/` | 200 | runner | Y | N | Y | Y | P | P | Y | Matter management dashboard |
| `/counsel/dashboard` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/counsel/matters` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/counsel/alerts` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/counsel/risk` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/counsel/approvals` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/counsel/evidence` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/counsel/forecast` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/counsel/knowledge` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/counsel/obligations` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/counsel/performance` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/counsel/decision-center` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/counsel/contracts` | 200 | source | Y | N | Y | Y | P | P | Y | Not in runner route list |
| `/counsel/calendar` | 200 | source | Y | N | Y | Y | P | P | Y | Not in runner route list |

**Gaps:** CourtListener API token not configured (requires `COURT_LISTENER_API_TOKEN`). Some obligation edges seeded.

---

## 10. Sentra — Cyber Resilience Command (`/sentra/`)

| Route | HTTP | Source | Layout | Fatal JS Err | Key CTA | Auth Redirect | API Deps | Empty State | Mobile | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/sentra/` | 200 | runner | Y | N | Y | Y | **P*** | P | Y | *Risk feed will 404 when authenticated |
| `/sentra/decision-center` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/sentra/dashboard` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/sentra/threats` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/sentra/assets` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/sentra/incident` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/sentra/exposure` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/sentra/controls` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/sentra/resilience` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/sentra/soc` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/sentra/alerts` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/sentra/incidents` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/sentra/investigations` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/sentra/threat-intelligence` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/sentra/compliance` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/sentra/mesh/map` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/sentra/risks` | 200 | source | Y | N | Y | Y | **N** | ? | Y | **UI loads but `/api/sentra/risks` → 404** |

**Critical gap:** `GET /api/sentra/risks` → 404. The UI page at `/sentra/risks` renders a shell, but the API dependency backing it has no registered route. Authenticated users will see an API error / empty state on that surface. **Must register `sentraRisksRouter` in api-server.**

---

## 11. Lyte — Decision Intelligence (`/lyte/`)

| Route | HTTP | Source | Layout | Fatal JS Err | Key CTA | Auth Redirect | API Deps | Empty State | Mobile | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/lyte/` | 200 | runner | Y | N | Y | Y | P | P | Y | Decision intelligence dashboard |
| `/lyte/overview` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/lyte/decisions` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/lyte/signals` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/lyte/brief` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/lyte/board` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/lyte/forecast` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/lyte/scenarios` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/lyte/causal` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/lyte/pressure-map` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/lyte/action-debt` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/lyte/entities` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/lyte/policies` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/lyte/models` | 200 | source | Y | N | Y | Y | P | P | Y | Not in runner route list |
| `/lyte-command-center/` | **404** | source | — | — | — | — | — | — | — | **Alias path not registered** |

**Gap:** `/lyte-command-center/` returns 404. Any external link or bookmark using the artifact directory name as the path will break. Decision metrics cross-domain wiring incomplete.

---

## 12. A11oy — Brand Orchestration Layer (`/a11oy/`)

| Route | HTTP | Source | Layout | Fatal JS Err | Key CTA | Auth Redirect | API Deps | Empty State | Mobile | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/a11oy/` | 200 | runner | Y | N | Y | Y | P | P | Y | Phase 1 complete |
| `/a11oy/now` | 200 | runner | Y | N | Y | Y | P | P | Y | Signal mesh |
| `/a11oy/recommendations` | 200 | runner | Y | N | Y | Y | P | P | Y | Governed AI active |
| `/a11oy/brief` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/a11oy/command` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/a11oy/signals` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/a11oy/actions` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/a11oy/proof` | 200 | runner | Y | N | Y | Y | P | P | Y | Proof ledger |
| `/a11oy/governance` | 200 | runner | Y | N | Y | Y | P | P | Y | Covenant policies |
| `/a11oy/agents` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/a11oy/workcells` | 200 | runner | Y | N | Y | Y | P | P | Y | Phase 2 in progress |
| `/a11oy/connectors` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/a11oy/sovereign` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/a11oy/verticals` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/a11oy/fabric` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/a11oy/tools` | 200 | runner | Y | N | Y | Y | P | P | Y | |
| `/a11oy/brands` | 200 | source | Y | N | Y | Y | P | P | Y | Not in runner route list |
| `/a11oy/campaigns` | 200 | source | Y | N | Y | Y | P | P | Y | Not in runner route list |
| `/a11oy/content` | 200 | source | Y | N | Y | Y | P | P | Y | Not in runner route list |
| `/a11oy/analytics` | 200 | source | Y | N | Y | Y | P | P | Y | Not in runner route list |

**Gaps:** Phase 2 (workcell live AI reasoning) in progress. Phase 3 (proof-carrying execution) planned.

---

## 13. Mockup Sandbox — PRAXIS (`/`)

| Route | HTTP | Source | Layout | Fatal JS Err | Key CTA | Auth Redirect | API Deps | Empty State | Mobile | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | 302 | source | — | — | — | — | — | — | — | Redirect to internal preview path |
| `/mockup-sandbox/` | **404** | source | — | — | — | — | — | — | — | Subpath not mounted (internal tool) |

**Note:** Internal tooling — 404 on subpath is not a product gap.

---

## 14. Mobile & Video (Non-HTTP)

| Artifact | Kind | HTTP Smoke | Status | Notes |
|---|---|---|---|---|
| `szl-holdings-mobile` | Expo/React Native | Not applicable | `alpha partial` | No HTTP smoke test; Expo workflow not running during test window |
| `szl-demo-video` | Remotion video | Not applicable | `demo-only` | Workflow not started; video artifact only |

---

## Consolidated Gap Register

| # | Artifact | Gap | Severity | Recommendation |
|---|---|---|---|---|
| G-01 | api-server | `GET /api/sentra/risks` → 404 — route not registered | **High** | Register `sentraRisksRouter` in `api-server/src/routes/index.ts` |
| G-02 | lyte | `/lyte-command-center/` → 404 — alias path missing | Medium | Add redirect rule or Vite history fallback alias |
| G-03 | terra | Map surface blank — Mapbox token not configured | Medium | Configure `MAPBOX_TOKEN` environment variable |
| G-04 | sentra | Risk feed surface shows no data for auth'd users | Medium | Depends on G-01 resolution |
| G-05 | vessels | AIS telemetry simulated — no live vessel positions | Medium | AIS provider integration (external dependency, budget required) |
| G-06 | command | CORTEX badge counts not wired to live API | Low | Wire badge count aggregation from api-server |
| G-07 | counsel | `COURT_LISTENER_API_TOKEN` not configured | Low | Set env var; legal data degrades gracefully |
| G-08 | mockup-sandbox | `/mockup-sandbox/` path 404 | Info | Internal tooling — no product impact |
| G-09 | szl-holdings | KPI widgets show hardcoded/seeded stats | Low | Wire live aggregation from api-server when data model stable |
| G-10 | api-server | Running in `demo` mode — no live production data | Low | Production mode activation is a deployment-phase concern |
| G-11 | health-and-404.spec.ts | Playwright spec hardcodes `localhost:5000` for API health check; API runs on port 8080 | Low | Fix spec to read `API_PORT` env var or use `PLAYWRIGHT_BASE_URL` |

---

*Matrix produced: 2026-04-26. Re-run smoke suite after each artifact deployment. Full Playwright browser automation is a follow-up task (Rehaul 7/9+).*
