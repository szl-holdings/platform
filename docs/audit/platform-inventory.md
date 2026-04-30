# SZL Holdings — Platform Inventory

**Date:** April 16, 2026
**Scope:** Full monorepo audit — all artifacts, libraries, routes, env vars, workflows, tests, integrations, and archived material
**Status:** Authoritative — supersedes all prior artifact listings in existing audit docs

---

## 1. Artifacts (15 total)

### 1.1 Registered Web Artifacts (Replit artifact.toml)

| Artifact Dir | Package Name | Preview Path | Workflow | Status |
|---|---|---|---|---|
| `artifacts/aegis` | `@workspace/aegis` | `/aegis/` | `artifacts/aegis: web` | Active |
| `artifacts/api-server` | `@workspace/api-server` | `/api/` | `artifacts/api-server: api` | Active |
| `artifacts/carlota-jo` | `@workspace/carlota-jo` | `/carlota-jo/` | `artifacts/carlota-jo: web` | Active |
| `artifacts/command` | `@workspace/command` | `/command/` | `artifacts/command: web` | Active |
| `artifacts/firestorm` | `@workspace/firestorm` | `/firestorm/` | `artifacts/firestorm: web` | Active |
| `artifacts/prism-counsel` | `@workspace/prism-counsel` | `/prism-counsel/` | `artifacts/prism-counsel: web` | Active |
| `artifacts/szl-holdings` | `@workspace/szl-holdings` | `/` | `artifacts/szl-holdings: web` | Active |
| `artifacts/terra` | `@workspace/terra` | `/terra/` | `artifacts/terra: web` | Active |
| `artifacts/vessels` | `@workspace/vessels` | `/vessels/` | `artifacts/vessels: web` | Active |

### 1.2 Registered Mobile Artifacts

| Artifact Dir | Package Name | Preview Path | Workflow | Status |
|---|---|---|---|---|
| `artifacts/szl-holdings-mobile` | `@workspace/szl-holdings-mobile` | `/szl-holdings-mobile/` | `artifacts/szl-holdings-mobile: expo` | Active |

### 1.3 Registered Internal/Tooling Artifacts

| Artifact Dir | Package Name | Preview Path | Workflow | Status |
|---|---|---|---|---|
| `artifacts/mockup-sandbox` | `@workspace/mockup-sandbox` | `/__mockup` | `artifacts/mockup-sandbox: Component Preview Server` | Internal dev tool |

### 1.4 Registered but Deprecated Artifacts

| Artifact Dir | Package Name | Workflow | Status |
|---|---|---|---|
| `artifacts/stephen-site` | `@workspace/stephen-site` | `artifacts/stephen-site: web` | **Deprecated** — `DEPRECATED.md` confirms content moved to `/founder` route in `szl-holdings`. Workflow still running; must be stopped and directory removed in Phase 2. |

### 1.5 Unregistered / Unscaffolded Artifact Directories

| Artifact Dir | Has package.json | Notes | Status |
|---|---|---|---|
| `artifacts/cortex-mobile` | No | `app/` subdir and Expo config present. CORTEX mobile — active development without full scaffold | **In-progress / unscaffolded** |
| `artifacts/imperium` | No | Only `node_modules` — no source, no package.json. Internal admin tool concept | **Skeleton / not started** |
| `artifacts/lyte-command-center` | No | Has `vite.config.ts`, `dist/`, and `node_modules` — previously built but deregistered. Lyte functionality now in `szl-holdings` | **Legacy build artifact — no active source** |

### 1.6 Scripts / Infrastructure Package

| Dir | Package Name | Purpose |
|---|---|---|
| `scripts/` | (scripts package) | Build, seed, QA, deploy, migration, and rollback scripts |

---

## 2. Shared Libraries (34 directories in lib/)

### 2.1 Libraries with package.json (33)

| Library Dir | Package Name | Dependencies | Role |
|---|---|---|---|
| `lib/ai-engine` | `@szl-holdings/ai-engine` | 9 | OpenAI / Anthropic / Gemini AI provider wrappers |
| `lib/analytics` | `@szl-holdings/analytics` | 0 | Analytics event tracking |
| `lib/api-client-react` | `@szl-holdings/api-client-react` | 1 | React query client hooks for API |
| `lib/api-spec` | `@szl-holdings/api-spec` | 0 | OpenAPI spec definitions |
| `lib/api-zod` | `@szl-holdings/api-zod` | 1 | Zod schemas for API request/response validation |
| `lib/atlas-artifacts` | `@szl-holdings/atlas-artifacts` | 4 | Artifact registration and metadata |
| `lib/audit` | `@szl-holdings/audit` | 3 | Immutable audit trail and event log |
| `lib/auth` | `@szl-holdings/auth` | 0 | Auth types and shared auth utilities |
| `lib/config` | `@szl-holdings/config` | 0 | Platform-wide constants, app registry, roles |
| `lib/covenant-policy` | `@szl-holdings/covenant-policy` | 4 | Policy enforcement and compliance rules |
| `lib/crdt-sync` | `@szl-holdings/crdt-sync` | 0 | CRDT-based real-time sync primitives |
| `lib/data-connectors` | `@szl-holdings/data-connectors` | 1 | External data source connector framework |
| `lib/db` | `@szl-holdings/db` | 4 | Drizzle ORM schema, migrations, PostgreSQL client |
| `lib/forge-runtime` | `@szl-holdings/forge-runtime` | 7 | Alloy workflow execution engine internals |
| `lib/graphql-client` | `@szl-holdings/graphql-client` | 3 | GraphQL client layer |
| `lib/i18n` | `@szl-holdings/i18n` | 3 | Internationalization framework |
| `lib/intelligence-feeds` | `@szl-holdings/intelligence-feeds` | 3 | Live data feed integration (NOAA, GDELT, BLS, etc.) |
| `lib/mcp-client` | `@szl-holdings/mcp-client` | 2 | Model Context Protocol client |
| `lib/mobile-shared` | `@szl-holdings/mobile-shared` | 3 | Shared primitives for Expo mobile apps |
| `lib/monte-carlo` | `@szl-holdings/monte-carlo` | 0 | Monte Carlo simulation engine |
| `lib/object-storage-web` | `@workspace/object-storage-web` | 4 | Replit Object Storage web client wrapper |
| `lib/observability` | `@szl-holdings/observability` | 2 | Pino structured logging, self-monitor |
| `lib/offline-engine` | `@szl-holdings/offline-engine` | 1 | Offline-capable data sync for mobile |
| `lib/outcome-graph` | `@szl-holdings/outcome-graph` | 3 | Outcome modeling and decision graph |
| `lib/prism-bus` | `@szl-holdings/prism-bus` | 1 | PRISM framework event bus |
| `lib/proof-chain` | `@szl-holdings/proof-chain` | 3 | Immutable action attribution / proof-of-work trail |
| `lib/pulse-evals` | `@szl-holdings/pulse-evals` | 1 | AI model evaluation and benchmarking |
| `lib/receipt-graph` | `@szl-holdings/receipt-graph` | 4 | Transaction receipt and billing graph |
| `lib/replit-auth-web` | `@szl-holdings/replit-auth-web` | 1 | Replit OIDC authentication client for frontend |
| `lib/services` | `@szl-holdings/services` | 1 | Shared service layer abstractions |
| `lib/shared-ui` | `@szl-holdings/shared-ui` | 55 | Design system — components, navigation, tokens |
| `lib/workflow-engine` | `@szl-holdings/workflow-engine` | 0 | Workflow DAG definitions and orchestrator |
| `lib/worldline` | `@szl-holdings/worldline` | 3 | Geospatial and mapping utilities |

### 2.2 Libraries without package.json (1)

| Library Dir | Contents | Status |
|---|---|---|
| `lib/approvals` | `dist/`, `node_modules/`, `tsconfig.tsbuildinfo` | Built artifact only — no source package.json; likely split from another lib or abandoned mid-refactor. **Investigate and regularize.** |

---

## 3. API Server Routes

**Total .ts files under `artifacts/api-server/src/routes/`:** 217
**Excluding all `index.ts` files (non-index total):** 205
**Top-level non-index route handlers** (directly in `routes/`, excluding `index.ts`): **170**
**Subdirectory non-index route files:** **35** (across 12 subdirectory groups)

Verification commands (run from workspace root):
```sh
ls artifacts/api-server/src/routes/*.ts | wc -l                             # 171 total top-level
ls artifacts/api-server/src/routes/*.ts | grep -v "/index.ts$" | wc -l     # 170 non-index top-level
find artifacts/api-server/src/routes -mindepth 2 -name "*.ts" ! -name "index.ts" | wc -l  # 35 subdirectory non-index
find artifacts/api-server/src/routes -name "*.ts" | wc -l                   # 217 total
```

**Subdirectory groups (12 subdirs, 35 non-index files total):**

| Subdirectory | Non-index .ts files |
|---|---|
| `routes/admin/` | 4 (`flags.ts`, `integrations.ts`, `system.ts`, `users.ts`) |
| `routes/control-tower/` | 1 (`routes.ts`) |
| `routes/distribution-os/` | 1 (`routes.ts`) |
| `routes/documents/` | 1 (`routes.ts`) |
| `routes/domain-agents/` | 3 (`a2a.ts`, `configs.ts`, `runner.ts`) |
| `routes/firestorm/` | 1 (`routes.ts`) |
| `routes/groups/` | 13 (route aggregators: `ai.ts`, `alloy.ts`, `billing.ts`, `core.ts`, `data-services.ts`, `lyte.ts`, `misc.ts`, `operations.ts`, `platform.ts`, `prism-counsel.ts`, `security.ts`, `terra.ts`, `vessels.ts`) |
| `routes/intelligence/` | 1 (`routes.ts`) |
| `routes/metering/` | 1 (`routes.ts`) |
| `routes/rmm/` | 1 (`routes.ts`) |
| `routes/tenant-provisioning/` | 1 (`routes.ts`) |
| `routes/terra-crm/` | 7 (multiple handler files) |

**Note:** The `known-gaps.md` figure of "170 top-level route files" is consistent with the current repo count. `known-gaps.md` also references "173 total route files" — this counted a different exclusion set; the current count using `find` yields 205 non-index files total (170 top-level + 35 subdirectory).

### Key Domain Route Groups

| Domain | Route Files (sample) |
|---|---|
| Alloy / Execution Fabric | `alloy.ts`, `alloy-channels.ts`, `alloy-chat.ts`, `alloy-cognitive-learning.ts`, `alloy-digest.ts`, `alloy-email.ts`, `alloy-governance.ts`, `alloy-integrations.ts`, `alloy-meetings.ts`, `alloy-research.ts`, `alloy-skills.ts`, `alloy-voice.ts` |
| Aegis / Security | `firestorm.ts`, `a2a.ts`, `agent-autonomy.ts`, `ai-safety.ts`, `agent-federation.ts`, `agent-os.ts`, `agent-training.ts`, `ai-engine.ts` |
| Vessels / Maritime | `vessels.ts`, `vessels-extended.ts`, `vessels-insurance.ts`, `vessels-live.ts`, `vessels-platform.ts`, `vessels-trading.ts` |
| Terra / Real Estate | `terra.ts`, `terra-broker.ts`, `terra-crm.ts`, `terra-distress.ts`, `terra-live.ts` |
| Counsel | `prism-counsel-core.ts`, `prism-counsel-court.ts`, `prism-counsel-ny.ts`, `prism-counsel-ops.ts`, `prism-counsel-purview.ts` |
| Analytics / Observability | `analytics.ts`, `analytics-engine.ts`, `apm.ts`, `telemetry.ts`, `usage.ts` |
| Auth / Identity | `auth.ts`, `scim.ts`, `invitations.ts` |
| Admin / Platform | `admin.ts`, `backup.ts`, `support.ts`, `webhooks.ts`, `tenant-provisioning.ts`, `tenant-health.ts` |
| Infrastructure | `audit.ts`, `audit-chain.ts`, `approvals.ts`, `notifications.ts`, `storage.ts`, `jobs.ts` |

**Auth enforcement:** 155 of 170 top-level route files import auth middleware. 15 are intentionally public (health, webhooks, public contact forms, demo requests).

**Zod validation coverage:** 21 of 170 top-level route files use `validateBody`/`validateQuery`/`validateParams`.

---

## 4. Environment Variables

**Total variables documented in `.env.example`:** 75+

See `docs/audit/env-canonical-map.md` for the full canonical map.

---

## 5. Workflows (Replit)

12 configured workflows (verified from `.replit` artifact configuration and Replit platform workflow registry, April 16, 2026):

| Workflow Name | Artifact | Notes |
|---|---|---|
| `artifacts/aegis: web` | Aegis | Active |
| `artifacts/api-server: api` | API Server | Active |
| `artifacts/carlota-jo: web` | Carlota Jo | Active |
| `artifacts/command: web` | Command | Active |
| `artifacts/firestorm: web` | Firestorm | Active |
| `artifacts/mockup-sandbox: Component Preview Server` | Mockup Sandbox | Internal only |
| `artifacts/prism-counsel: web` | Counsel | Active |
| `artifacts/stephen-site: web` | Stephen Site | **Registered but deprecated** — should be stopped and deregistered in Phase 2 |
| `artifacts/szl-holdings-mobile: expo` | Mobile | Active |
| `artifacts/szl-holdings: web` | SZL Holdings | Active |
| `artifacts/terra: web` | Terra | Active |
| `artifacts/vessels: web` | Vessels | Active |

**Note:** `artifacts/cortex-mobile` and `artifacts/imperium` have no registered workflow.

---

## 6. Tests

**Test files found:** ~27 (per `docs/known-gaps.md`; to be re-counted deterministically with `find` in Phase 2)
**Route handler files (non-index):** 205 total (170 top-level + 35 subdirectory; 13 of the 35 are group aggregators)
**Coverage ratio:** ~13% (27 test files / 205 handler files)

Test scripts available at root:
- `pnpm test` — general test suite
- `pnpm test:api` — API-level tests
- `pnpm test:integration` — integration tests (not wired to CI)
- `pnpm test:components` — component tests
- `pnpm test:e2e` — end-to-end (Playwright, no active suite)

---

## 7. Integrations (Live External Feeds)

See `lib/config/src/index.ts` (`APP_INTEGRATIONS`) for the authoritative connector map. Key live feeds by domain:

| Domain | Live Feeds |
|---|---|
| Vessels | NOAA CO-OPS, Open-Meteo Marine, GDELT, AIS (AISHub/MarineTraffic), OFAC Sanctions |
| Firestorm/Aegis | CISA KEV, NVD CVE, MITRE ATT&CK v14, AbuseIPDB, Hacker News RSS |
| Lyte | BLS Unemployment, GitHub Trending, TechCrunch RSS, The Verge RSS |
| Terra (beacon) | Census ACS, BLS Employment, FEMA Risk Index, SEC EDGAR REIT, Open-Meteo |
| INCA (AI Research) | arXiv, Semantic Scholar, PapersWithCode, HuggingFace Hub |
| Carlota Jo | World Bank Open Data, BLS Employment, HBR RSS, Microsoft Outlook/Calendar |
| Alloy | HuggingFace Hub, Microsoft SharePoint, Teams Webhooks |
| Rosie (MSP) | USAspending.gov, FedRAMP Products, SAM.gov |

---

## 8. Archived Material

| Location | Contents | Status |
|---|---|---|
| `.archive/alloy-archived/` | Archived Alloy subsystem code | Quarantined — excluded from public mirror |
| `.mirror-staging-test/artifacts/` | Mirror staging test artifacts | Internal — should be deleted post-use |
| `attached_assets/` | ~18 binary files (images, text payloads) + `nohup.out` | Excluded from public mirror; should be cleaned |
| `artifacts/stephen-site/` | Deprecated founder site | Deprecated — flagged for removal |
| `artifacts/lyte-command-center/` | Legacy build artifact (no active source) | Zombie — no source, has compiled dist; remove |
| `artifacts/imperium/` | Skeleton directory — no source | Empty shell — remove or scaffold |

---

## 9. Duplicated Functionality

| Duplication | Location | Notes |
|---|---|---|
| Legacy slugs for current apps | `lib/config/src/index.ts` `APP_INTEGRATIONS` | `stephen-site`, `terra`, `readiness`, `msp`, `dreamscape` are documented as legacy aliases |
| Dual AI key patterns | `.env.example` | Both direct keys (`OPENAI_API_KEY`) and proxy keys (`AI_INTEGRATIONS_OPENAI_API_KEY`) exist — proxy should be canonical |
| `artifacts/firestorm` registered twice | `artifact.toml` | Listed as both `artifacts/firestorm` (id: `artifacts/firestorm`) and `artifacts/aegis` (id: `artifacts/firestorm`) — requires canonicalization |
| `SendGrid` + `Resend` + `SMTP` | `.env.example` | Three email delivery paths; only one should be primary |
| `lib/approvals` vs `approvals.ts` route | lib and routes | Approvals lib has no package.json but has built artifacts — unclear if lib is actually used |

---

*This document is part of the Series A Cleanup — Phase 1: Platform Audit & Canonical Inventory. April 2026.*
