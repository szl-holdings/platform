# SZL Holdings — System Inventory
**Audit date:** April 18, 2026  
**Auditor:** Automated code audit (task-1786)  
**Scope:** All registered artifacts, packages, lib, API routes, DB, env vars, integrations  
**Tagging key:** `real` = wired to live data or real logic | `demo-fixture` = seed/hardcoded data, clearly labeled | `stub` = placeholder wiring, partial impl | `dead` = no active wiring

---

## 1. Artifacts

| Artifact | Kind | Status | Auth | Data classification |
|---|---|---|---|---|
| `szl-holdings` | web | Beta | Replit OIDC | dashboard KPIs: **demo-fixture**; public feed integrations: **real**; hardcoded claims (52K vessels, 2.4M signals, 31,200 sims): **stub** |
| `carlota-jo` | web | GA | Replit OIDC | public site: **real** content; Consulting OS ops data: **demo-fixture**; 98% retention / 18-yr claim: **stub** (hardcoded, unverifiable) |
| `pulse` | web | Beta | Replit OIDC | AI briefing with live LLM call: **real**; fallback synthesis when model unavailable: **demo-fixture**; Dissents/custom brief DB writes: **real** |
| `aegis` | web | Beta | Replit OIDC | CISA KEV / NVD / MITRE ATT&CK feeds: **real**; scenario event data: **demo-fixture**; 8 new modules unwired to API: **stub** |
| `terra` | web | Beta | Replit OIDC | NYC Open Data distress pipeline, Census ACS, BLS, FEMA, SEC EDGAR: **real**; portfolio/CRM data: **demo-fixture**; Mapbox maps (no token): **dead** |
| `vessels` | web | Partial | Replit OIDC | NOAA CO-OPS, Open-Meteo Marine, GDELT: **real**; AIS telemetry: **demo-fixture** (no live subscription); 3 commercial modules (insurance, trading, platform): **stub** |
| `command` | web | Partial | Replit OIDC | Governed Decision Loop UI: **real** (wired to api-server); all dashboard KPIs and badge counts: **demo-fixture**; push notification deep links: **dead** |
| `szl-holdings-mobile` | mobile | Beta | Replit OIDC | Core screens: **real**; push notification deep linking: **stub**; custom splash/icon: **dead** |
| `mockup-sandbox` (NEXUS) | design | Internal | None | AI research/ingestion prototype: **stub**; not customer-facing |
| `szl-demo-video` | video | Internal | None | Static video artifact: **real** (no live data dependency) |
| `api-server` | web/API | GA | Replit OIDC | 170 top-level route files; PostgreSQL CRUD: **real**; Zod validation: 21/170 routes (**stub** for remaining 149); integration tests in CI: **dead** |

### Archived / Deprecated Artifacts (do not deploy)
- `firestorm` → functionality merged into `aegis` / `api-server`
- `prism-counsel` → deregistered; DB data retained in api-server
- legacy lyte command center → merged into `command`
- `imperium` → merged into `command`
- legacy founder site → content at `/founder` in `szl-holdings`
- `cortex-mobile` → Concept; no build system; `app/` directory present, no `package.json`

---

## 2. Packages (core engines)

| Package | Location | Classification |
|---|---|---|
| `action-engine` | `packages/action-engine` | **real** — orchestrates task execution |
| `decision-engine` | `packages/decision-engine` | **real** — evaluates signals; some forecasting is heuristic stub |
| `policy-engine` | `packages/policy-engine` | **real** — Covenant Policy enforcement (approval gates) |
| `cognitive-runtime` | `packages/cognitive-runtime` | **real** — multi-phase AI agent orchestration |
| `design-system` | `packages/design-system` | **real** — shared Tailwind UI components |
| `brand-registry` | `packages/brand-registry` | **real** — brand token registry |
| `ontology` | `packages/ontology` | **real** — operational entity definitions |
| `prompt-registry` | `packages/prompt-registry` | **real** — centralized prompt templates |
| `eval-forge` / `evals-core` | `packages/eval-*` | **stub** — evaluation scaffolding, not in CI |
| `nvidia-adapters` | `packages/nvidia-adapters` | **stub** — GPU inference adapters, not active |
| `demo-seed` | `packages/demo-seed` | **demo-fixture** — standardized seed tooling |
| `executive-briefing` | `packages/executive-briefing` | **real** — Pulse briefing generation logic |
| `memory-fabric` | `packages/memory-fabric` | **real** — agent long-term memory store |
| `planner` | `packages/planner` | **real** — multi-step execution planning |
| `reflection-engine` | `packages/reflection-engine` | **stub** — self-evaluation hooks, early-stage |
| `skill-library` | `packages/skill-library` | **stub** — agent skill catalog, partially wired |

---

## 3. Lib (shared infrastructure)

| Library | Location | Classification |
|---|---|---|
| `db` | `lib/db` | **real** — Drizzle ORM schema + PostgreSQL migrations |
| `auth` | `lib/auth` | **real** — OIDC/PKCE auth middleware |
| `ai-engine` | `lib/ai-engine` | **real** — OpenAI/Anthropic/Gemini gateway; keys via env |
| `proof-chain` | `lib/proof-chain` | **real** — immutable audit trail |
| `outcome-graph` | `lib/outcome-graph` | **real** — decision-to-outcome graph tracking |
| `config` | `lib/config` | **real** — integration registry and runtime mode config |
| `api-client-react` | `lib/api-client-react` | **real** — typed React query hooks |
| `analytics` | `lib/analytics` | **stub** — PostHog/Sentry wired; conversion events not flowing |
| `offline-engine` | `lib/offline-engine` | **real** — IndexedDB adapter for offline-first mobile |
| `covenant-policy` | `lib/covenant-policy` | **real** — policy enforcement primitives |
| `intelligence-feeds` | `lib/intelligence-feeds` | **real** — live feed adapters (CISA, NVD, BLS, NYC Open Data) |
| `data-connectors` | `lib/data-connectors` | **stub** — HubSpot, Salesforce, PowerBI connectors; partially wired |
| `mcp-client` | `lib/mcp-client` | **stub** — MCP protocol client, not active in production |
| `replit-auth-web` | `lib/replit-auth-web` | **real** — Replit OIDC web integration |
| `mobile-shared` | `lib/mobile-shared` | **real** — shared types/utils for mobile |

---

## 4. Database

| Aspect | State | Classification |
|---|---|---|
| Engine | PostgreSQL 16 (Drizzle ORM) | **real** |
| Session store | PostgreSQL (not in-memory) — closed gap | **real** |
| Schema migrations | Via Drizzle push | **real** |
| Seed data | `pnpm seed` via scripts/ | **demo-fixture** |
| Tenant isolation | `tenantScope({ required: true })` on all domain route families | **real** |
| `pulse_briefings` table | Real writes for AI briefings and dissents | **real** |
| Cross-org isolation | All queries scoped by `org_id`; cross-org returns 404 | **real** |

---

## 5. API Routes (api-server)

| Route family | Endpoint count (approx) | Auth enforced | Zod validated | Classification |
|---|---|---|---|---|
| `/api/health` | 3 | No (public) | N/A | **real** |
| `/api/vessels/*` | ~18 | Yes | Partial | **real** (CRUD) + **demo-fixture** (AIS positions) |
| `/api/terra/*` | ~20 | Yes | Partial | **real** (distress/pipeline) + **demo-fixture** (portfolio) |
| `/api/alloy/*` | ~24 | Yes | Partial | **real** |
| `/api/firestorm/*` | ~15 | Yes | Partial | **real** (incident CRUD) |
| `/api/lyte/*` | ~12 | Yes | Partial | **real** |
| `/api/prism-counsel/*` | ~10 | Yes | Partial | **real** + heuristic stub (settlement forecast) |
| `/api/pulse/*` | ~8 | Yes | Partial | **real** (AI gen) + **demo-fixture** (fallback) |
| `/api/ai/*` | ~5 | Yes | Partial | **real** (LLM calls conditional on keys) |
| `/api/graphql` | 1 | Yes | Via schema | **real** |
| `/api/admin/seed` | 1 | Admin only | Yes | **demo-fixture** — **RISK**: no production guard confirmed |
| **Totals** | ~170 top-level | 155/170 (91%) | 21/170 (12%) | |

---

## 6. Scheduled Jobs / Queues

| Job | Status | Classification |
|---|---|---|
| Background job queue (`forge-runtime`) | Implemented in-process; no persistent MQ | **stub** (no Redis/Service Bus in prod) |
| AIS position refresh | Simulated via pubsub-bridge | **demo-fixture** |
| Intelligence feed refresh (CISA, NVD, BLS) | Wired; refresh cadence not confirmed in CI | **real** |
| Pulse briefing auto-generation | Trigger endpoint exists; no cron wired | **stub** |
| Demo data reset (`scripts/demo-reset/`) | CLI-only; no in-app trigger | **stub** |

---

## 7. Environment Variables

| Variable | Purpose | Status |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection | **real** — required |
| `SESSION_SECRET` | Session encryption | **real** — required |
| `RUNTIME_MODE` | local-dev / demo / production | **real** |
| `DEMO_MODE` | Enables mock fallbacks | **real** |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI via Replit proxy | **real** (Replit-managed) |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Anthropic via Replit proxy | **real** (Replit-managed) |
| `MAPBOX_TOKEN` | Maps in terra | **dead** — not configured, maps blank |
| `SENTRY_DSN` | Error telemetry | **stub** — SDK present, external uptime monitor not confirmed live |
| `EXPO_ACCESS_TOKEN` | Mobile push | **stub** — deep linking not wired |
| `STRIPE_SECRET_KEY` | Payments | **stub** — wired in config but no live payment flow |
| `SERVICE_ROLE_KEY` | M2M admin bypass | **real** |
| `ALLOY_INTERNAL_TOKEN` | Agent access | **real** |
| `CONNECTOR_ENCRYPTION_KEY` | Credential AES-256 | **real** |
| `ENABLE_DEMO_SEED` | Auto-seed on startup | **real** — risk in prod if set |

---

## 8. Integrations (external data feeds — live)

| Integration | Domain | Status |
|---|---|---|
| CISA KEV | Aegis/security | **real** |
| NVD (CVE) | Aegis/security | **real** |
| MITRE ATT&CK v14 | Aegis/security | **real** |
| AbuseIPDB | Aegis/security | **real** |
| NYC Open Data (distress) | Terra | **real** |
| Census ACS | Terra | **real** |
| BLS (unemployment) | Terra / Carlota Jo | **real** |
| FEMA | Terra | **real** |
| SEC EDGAR | Terra | **real** |
| NOAA CO-OPS | Vessels | **real** |
| Open-Meteo Marine | Vessels | **real** |
| GDELT | Vessels / Aegis | **real** |
| World Bank | Carlota Jo | **real** |
| HBR RSS | Carlota Jo | **real** |
| Microsoft Outlook/Calendar | Carlota Jo | **real** |
| GitHub (repo integration) | Platform | **real** |
| VesselFinder / Marine Traffic / AIS | Vessels | **dead** — no subscription; positions simulated |
| Mapbox | Terra | **dead** — no token |
| PostHog | Analytics | **stub** — SDK present, no confirmed event flow |
| Sentry | Error monitoring | **stub** — DSN required, not confirmed active |
| Stripe | Payments | **stub** — not live |
| HubSpot / Salesforce | CRM | **stub** — connector built, not wired |
| PowerBI | Reporting | **stub** — client-side simulation |
| Zillow / Redfin / CoStar | Real estate market data | **dead** — no live connection |

---

## 9. Authentication & Security

| Control | Status |
|---|---|
| OIDC / PKCE (Replit) | **real** |
| 11-role RBAC | **real** |
| Deny-by-default global enforcer | **real** |
| Tenant isolation (org_id scope) | **real** — closed April 2026 |
| Input validation (Zod) | **stub** — 12% coverage (21/170 routes) |
| Integration test CI | **dead** — not running on merge |
| SOC 2 Type II audit engagement | **stub** — planned, not started |

---

*End of system inventory. See `mock-and-gap-report.md` for prioritized remediation.*
