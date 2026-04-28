# SZL Holdings — Platform Inventory

**Version:** 1.0  
**Date:** 2026-04-28  
**Method:** Full filesystem walk — every `artifacts/*`, `apps/*`, `services/*`, `workers/*`, `packages/*`, `lib/*`, `infra/*`, `scripts/*`, `.github/workflows/*`  
**Status:** Authoritative baseline for Phase 1 platform engineering track

---

## 1. Registered Artifacts (Product Surfaces)

All artifacts live under `artifacts/`. Registered = has `.replit-artifact/artifact.toml` and appears in workspace registry.

| # | Name | Slug | Kind | Runtime | Preview Path | Domain | Owner Placeholder | Envs | Secrets Used | Health Endpoint | Telemetry | Deployment | Risk | Mod Priority |
|---|------|------|------|---------|-------------|--------|-------------------|------|-------------|----------------|-----------|-----------|------|--------------|
| 1 | SZL Holdings Dashboard | `szl-holdings` | web | React 19 + Vite 7 | `/` | Corporate / Investor | platform-team | all | VITE_APP_URL, MAPBOX_ACCESS_TOKEN, Stripe VITE keys | None (SPA) | Partial (Plausible) | Replit workflow → Vite dev | LOW | P2 |
| 2 | API Server | `api-server` | web (backend) | Node 22, Express 5 + Hono, PostgreSQL 16 | `/api/` | Platform | platform-team | all | DATABASE_URL, SESSION_SECRET, all AI keys, Stripe keys, all external API keys | `/api/health` | OTel spans, structured JSON logs | Replit workflow → `node dist/index.mjs` | HIGH | P1 |
| 3 | Unified Command | `command` | web | React 19 + Vite 7, react-leaflet | `/command/` | Operations | ops-team | all | VITE_APP_URL, MAPBOX_ACCESS_TOKEN | None (SPA) | OTel client-side traces | Replit workflow → Vite dev | MEDIUM | P1 |
| 4 | Terra — Real Estate Intelligence | `terra` | web | React 19 + Vite 7 | `/terra/` | Real Estate (domain pack) | domain-terra | all | VITE_APP_URL | None (SPA) | None | Replit workflow → Vite dev | LOW | P3 |
| 5 | Vessels — Maritime Intelligence | `vessels` | web | React 19 + Vite 7 | `/vessels/` | Maritime (domain pack) | domain-vessels | all | VITE_APP_URL, MARINE_TRAFFIC_API_KEY | None (SPA) | None | Replit workflow → Vite dev | LOW | P3 |
| 6 | Carlota Jo Consulting | `carlota-jo` | web | React 19 + Vite 7, i18next | `/carlota-jo/` | Advisory (domain pack) | domain-carlota | all | VITE_APP_URL, Stripe keys | None (SPA) | None | Replit workflow → Vite dev | LOW | P3 |
| 7 | Pulse — AI Executive Briefing | `pulse` | web | React 19 + Vite 7 | `/pulse/` | AI Briefing | platform-team | all | VITE_APP_URL | None (SPA) | None | Replit workflow → Vite dev | LOW | P2 |
| 8 | Sentra — Cyber Resilience Command | `sentra` | web | React 19 + Vite 7 | `/sentra/` | Cyber (domain pack) | domain-sentra | all | VITE_APP_URL | None (SPA) | None | Replit workflow → Vite dev | LOW | P2 |
| 9 | Counsel — Legal Matter Command | `counsel` | web | React 19 + Vite 7 | `/counsel/` | Legal (domain pack) | domain-counsel | all | VITE_APP_URL | None (SPA) | None | Replit workflow → Vite dev | LOW | P2 |
| 10 | Lyte — Decision Intelligence | `lyte-command-center` | web | React 19 + Vite 7 | `/lyte/` | Observability / Intelligence | lyte-team | all | VITE_APP_URL | None (SPA) | None | Replit workflow → Vite dev | MEDIUM | P1 |
| 11 | A11oy — Brand Orchestration Layer | `a11oy` | web | React 19 + Vite 7 | `/a11oy/` | Brand / Platform Substrate | platform-team | all | VITE_APP_URL | None (SPA) | None | Replit workflow → Vite dev | MEDIUM | P1 |
| 12 | Conduit — Reverse ETL | `conduit` | web | React 19 + Vite 7 | `/conduit/` | Data / Integration | platform-team | all | VITE_APP_URL | None (SPA) | None | Replit workflow → Vite dev | LOW | P2 |
| 13 | SZL Holdings — Mobile Command (APEX) | `szl-holdings-mobile` | mobile | Expo 53 / React Native | `/szl-holdings-mobile/` | Mobile | mobile-team | all | EXPO_PUBLIC_DOMAIN, EXPO_PUBLIC_REPL_ID, Firebase credentials via EAS | None | None | EAS Build → Expo Go / standalone | MEDIUM | P2 |
| 14 | SZL Holdings — Governed Autonomy Demo | `szl-demo-video` | video | React Three Fiber + Lottie | `/szl-demo-video/` | Marketing | marketing-team | all | None | None | None | Replit workflow → Vite dev | LOW | P4 |
| 15 | PRAXIS — Unified Agentic AI Layer | `mockup-sandbox` | design | React 19 + Vite 7, Radix UI | `/nexus/` | Design / Internal | platform-team | dev | None | None | None | Replit workflow → Vite dev | LOW | P4 |

### On-Disk Artifacts (Not Currently Registered)

| Directory | Notes |
|-----------|-------|
| `artifacts/aegis/` | Investor pitch deck surface; on disk, not registered; API routes still live under `/api/aegis` |
| `artifacts/helios/` | React + Vite surface; purpose unclear from current state; deferred for triage |
| `artifacts/pluginmesh/` | Plugin mesh surface; registered in workflow but not in current artifact.toml registry |
| `artifacts/imperium/` | Archived (merged into Command); no artifact.toml |
| `artifacts/firestorm/` | Archived (security defense UI); API routes live under `/api/firestorm` |
| `artifacts/prism-counsel/` | Archived; PRISM Counsel UI; API routes still live |
| `artifacts/cortex-mobile/` | Concept only; no active development |
| `artifacts/internal-audit/` | Internal audit tooling; not a product |

---

## 2. Backend Applications (`apps/`)

| Name | Path | Runtime | Purpose | Secrets | Health | Telemetry | Deployment | Risk | Priority |
|------|------|---------|---------|---------|--------|-----------|-----------|------|----------|
| alloy-embedding-api | `apps/alloy-embedding-api` | Node 22 / TypeScript | AEF REST gateway — embed, rerank, hybrid search | ALLOY_API_KEY, DATABASE_URL | Presumed `/health` | None confirmed | Replit workflow | MEDIUM | P1 |
| alloy-ingestion-orchestrator | `apps/alloy-ingestion-orchestrator` | Node 22 / TypeScript | Data ingestion pipeline into Alloy fabric | DATABASE_URL, OPENAI keys | Presumed `/health` | None confirmed | Replit workflow | MEDIUM | P1 |
| alloy-runtime-api | `apps/alloy-runtime-api` | Node 22 / TypeScript | AEEP runtime API — v1 inference endpoints | SUBSTRATE_INFERENCE_URL, AI keys | Presumed `/health` | None confirmed | Replit workflow | HIGH | P1 |
| substrate-inference | `apps/substrate-inference` | Python 3 / FastAPI | Air-gapped local GPU inference (oLLM); stub mode in dev | SUBSTRATE_API_KEY, SUBSTRATE_MODELS_DIR | `/v1/health` (FastAPI) | None confirmed | Replit workflow; EAS for prod GPU | HIGH | P1 |

---

## 3. Services (`services/`)

| Name | Path | Runtime | Purpose | Secrets | Health | Telemetry | Deployment | Risk | Priority |
|------|------|---------|---------|---------|--------|-----------|-----------|------|----------|
| alloy-fabric-api | `services/alloy-fabric-api` | Node 22 / TypeScript | Alloy fabric REST API layer | DATABASE_URL, ALLOY keys | `src/server.ts` — unclear | None confirmed | Replit workflow | MEDIUM | P1 |
| alloy-fabric-ingest-control | `services/alloy-fabric-ingest-control` | Node 22 / TypeScript | Ingestion control — triggers, fan-out | DATABASE_URL | `src/server.ts` — unclear | None confirmed | Replit workflow | MEDIUM | P1 |
| lyte-metrics-store | `services/lyte-metrics-store` | Python 3 | Lyte metrics persistence backend | DATABASE_URL | Unclear (Python) | None confirmed | Replit workflow | MEDIUM | P1 |
| substrate-mcp-gateway | `services/substrate-mcp-gateway` | Node 22 / TypeScript | MCP (Model Context Protocol) gateway for Substrate | SUBSTRATE_API_KEY | Unclear | None confirmed | Replit workflow | HIGH | P1 |
| substrate-py-workers | `services/substrate-py-workers` | Python 3 | Python substrate workers | SUBSTRATE_API_KEY | Unclear | None confirmed | Replit workflow | MEDIUM | P1 |
| verticals | `services/verticals/` | Python 3 | Domain-specific vertical sub-modules (finance, maritime, marketing, Lyte/KORA, Forge, firestorm ops, platform) | DATABASE_URL | Unclear | None confirmed | Replit workflow | MEDIUM | P2 |
| meridian_control_plane | `services/meridian_control_plane/` | Python 3 | Meridian control plane — flight recorder, model policy | MERIDIAN keys | Unclear | None confirmed | Replit workflow | HIGH | P1 |
| meridian_forecast_lab | `services/meridian_forecast_lab/` | Python 3 | Meridian forecast and simulation lab | DATABASE_URL | Unclear | None confirmed | Replit workflow | MEDIUM | P2 |

---

## 4. Workers (`workers/`)

| Name | Path | Runtime | Purpose | Secrets | Telemetry | Deployment | Risk | Priority |
|------|------|---------|---------|---------|-----------|-----------|------|----------|
| alloy-embed-worker | `workers/alloy-embed-worker` | Node 22 / TypeScript | Embedding worker (5 provider backends) | OPENAI keys, ANTHROPIC keys | None confirmed | Replit / queue | MEDIUM | P1 |
| alloy-rank-worker | `workers/alloy-rank-worker` | Node 22 / TypeScript | Ranking worker for AEF | ALLOY keys | None confirmed | Replit / queue | MEDIUM | P1 |
| alloy-rerank-worker | `workers/alloy-rerank-worker` | Node 22 / TypeScript | Cross-encoder reranking worker | AI keys | None confirmed | Replit / queue | MEDIUM | P1 |
| alloy-vector-worker | `workers/alloy-vector-worker` | Node 22 / TypeScript | Vector index writer | DATABASE_URL, AI keys | None confirmed | Replit / queue | MEDIUM | P1 |
| substrate-python | `workers/substrate-python` | Python 3 / FastAPI + Pydantic v2 | Python substrate worker pool | SUBSTRATE_API_KEY | None confirmed | Replit / queue | MEDIUM | P1 |

---

## 5. Shared Packages (`packages/` — 103 directories)

### Core Platform Substrate

| Package | Scope | Purpose | Consumers | Priority |
|---------|-------|---------|-----------|----------|
| `packages/env` | `@workspace/env` | Zod-validated environment contract; canonical env loading | All services/artifacts | P1 |
| `packages/config` | `@workspace/config` | Platform registry, claims, feature flags | All | P1 |
| `packages/contracts` | `@workspace/contracts` | Cross-service type contracts | All | P1 |
| `packages/shared-contracts` | `@workspace/shared-contracts` | Shared contract types | Many | P1 |
| `packages/aef-contracts` | `@workspace/aef-contracts` | AEF-specific contracts | AEF stack | P1 |
| `packages/ontology` | `@workspace/ontology` | Platform domain ontology (36 consumers) | Many | P1 |

### Observability & Telemetry

| Package | Scope | Purpose | Priority |
|---------|-------|---------|----------|
| `packages/observability-core` | `@workspace/observability-core` | OTel instrumentation core | P1 |
| `packages/otel` | `@workspace/otel` | OpenTelemetry SDK wrappers | P1 |
| `packages/cognitive-observability` | `@workspace/cognitive-observability` | AI trace and cognitive layer telemetry | P1 |
| `packages/telemetry-standards` | `@workspace/telemetry-standards` | Schema and standards for telemetry events | P1 |

### Security & Policy

| Package | Scope | Purpose | Priority |
|---------|-------|---------|----------|
| `packages/auth-shared` | `@workspace/auth-shared` | Auth primitives shared across surfaces | P1 |
| `packages/security-headers` | `@workspace/security-headers` | HTTP security header middleware | P1 |
| `packages/policy-engine` | `@workspace/policy-engine` | Platform policy engine | P1 |
| `packages/policy-guard` | `@workspace/policy-guard` | Policy guard middleware | P1 |
| `packages/aef-policy-guard` | `@workspace/aef-policy-guard` | AEF-scoped policy guard | P1 |

### AI / Agent Fabric

| Package | Scope | Purpose | Priority |
|---------|-------|---------|----------|
| `packages/ai-engine` | — (lib) | Core AI routing, control plane | P1 |
| `packages/agents-core` | `@workspace/agents-core` | Agent runtime core | P1 |
| `packages/agents-sdk-bridge` | `@workspace/agents-sdk-bridge` | SDK bridge for agent integrations | P1 |
| `packages/agents-prompts` | `@workspace/agents-prompts` | Prompt registry for agents | P1 |
| `packages/agents-tools` | `@workspace/agents-tools` | Tool definitions for agents | P1 |
| `packages/agents-evals` | `@workspace/agents-evals` | Agent evaluation harness | P2 |
| `packages/cognitive-runtime` | (lib) | Cognitive runtime for AI decisions | P1 |
| `packages/decision-engine` | `@workspace/decision-engine` | Decision engine | P1 |
| `packages/reflection-engine` | (lib) | Reflection and self-correction engine | P2 |
| `packages/prompt-registry` | `@workspace/prompt-registry` | Centralized prompt registry | P2 |
| `packages/tool-registry` | (lib) | Tool registry for agents | P2 |

### Data / Proof

| Package | Scope | Purpose | Priority |
|---------|-------|---------|----------|
| `packages/proof-chain` | (lib) | Cryptographic proof chain | P1 |
| `packages/evidence-graph` | (lib) | Evidence graph for audit | P1 |
| `packages/evidence-ledger` | (lib) | Immutable evidence ledger | P1 |
| `packages/outcome-graph` | (lib) | Outcome graph modeling | P1 |
| `packages/run-ledger` | (lib) | Run-level ledger | P1 |
| `packages/domain-claims` | (lib) | Domain claim verification | P1 |

### Infrastructure / Integration

| Package | Scope | Purpose | Priority |
|---------|-------|---------|----------|
| `packages/connectors` | `@workspace/connectors` | External service connectors | P2 |
| `packages/integrations` | (lib) | Integration adapters | P2 |
| `packages/mcp-client` | `@workspace/mcp-client` | MCP client library | P2 |
| `packages/data-connectors` | `@workspace/data-connectors` | Data pipeline connectors | P2 |
| `packages/object-storage-web` | `@workspace/object-storage-web` | Object storage abstraction | P2 |

### UI / Design System

| Package | Scope | Purpose | Priority |
|---------|-------|---------|----------|
| `packages/design-system` | (lib) | Shared design system tokens | P2 |
| `packages/ui-command` | (lib) | Command surface UI components | P2 |
| `packages/omnia-shell` | (lib) | Shell layout component | P2 |
| `packages/storybook` | (lib) | Storybook for component development | P3 |

### Workflow / Orchestration

| Package | Scope | Purpose | Priority |
|---------|-------|---------|----------|
| `packages/forge-runtime` | (lib) | Forge workflow orchestration runtime | P1 |
| `packages/workflow-runtime` | (lib) | Generic workflow runtime | P1 |
| `packages/action-engine` | (lib) | Action execution engine | P1 |
| `packages/approvals-inbox` | (lib) | Human-gated approval inbox | P1 |

### Evaluation / Quality

| Package | Scope | Purpose | Priority |
|---------|-------|---------|----------|
| `packages/aef-evals` | `@workspace/aef-evals` | AEF evaluation pipeline | P2 |
| `packages/eval-os` | `@workspace/eval-os` | Eval operating system | P2 |
| `packages/evals-core` | (lib) | Core eval primitives | P2 |
| `packages/pulse-evals` | (lib) | Pulse-specific evaluations | P2 |
| `packages/drift-eval` | (lib) | Drift detection evaluation | P2 |

---

## 6. Shared Libraries (`lib/` — 53 directories)

Key `lib/` packages that predate or duplicate `packages/` entries:

| Library | Name | Purpose | Duplication Risk |
|---------|------|---------|-----------------|
| `lib/db` | `@szl-holdings/db` | Central PostgreSQL client (Drizzle ORM, 730 tables, 170 schema files) | None — canonical |
| `lib/ai-engine` | `@szl-holdings/ai-engine` | AI model router, control plane, provider adapters | May overlap `packages/ai-control-plane` |
| `lib/a11oy-fabric` | `@szl-holdings/a11oy-fabric` | A11oy brand orchestration runtime | None |
| `lib/audit` | `@szl-holdings/audit` | Audit log utilities, IP hash | None |
| `lib/auth` | `@szl-holdings/auth` | Auth utilities | May overlap `packages/auth-shared` |
| `lib/config` | `@szl-holdings/config` | Config primitives | May overlap `packages/config` |
| `lib/cognitive-observability` | (see packages) | Cognitive OBS layer | Tracked in CONSOLIDATION_DECISIONS.md |
| `lib/ontology` | `@szl-holdings/ontology` | Domain ontology (3 consumers, duplicate of `packages/ontology` which has 36 consumers) | **DUPLICATE — consolidation tracked** |
| `lib/domain-claims` | `@szl-holdings/domain-claims` | Domain claim contracts | Review against `packages/domain-claims` |
| `lib/proof-chain` | `@szl-holdings/proof-chain` | Proof chain implementation | Review against `packages/proof-chain` |
| `lib/forge-runtime` | `@szl-holdings/forge-runtime` | Forge runtime impl | Review against `packages/forge-runtime` |
| `lib/intelligence-feeds` | (lib) | External intel feed adapters | None |
| `lib/analytics` | (lib) | Platform analytics utilities | None |
| `lib/api-client-react` | `@szl-holdings/api-client-react` | Generated React Query API client | None — canonical |
| `lib/api-spec` | `@szl-holdings/api-spec` | OpenAPI spec package | None |
| `lib/api-zod` | `@szl-holdings/api-zod` | Zod-typed API response validators | None |
| `lib/mobile-shared` | `@szl-holdings/mobile-shared` | Shared mobile utilities | None |
| `lib/i18n` | `@szl-holdings/i18n` | i18n utilities | None |

---

## 7. Infrastructure (`infra/`)

| Asset | Path | Purpose | Stack | Status |
|-------|------|---------|-------|--------|
| Main Bicep | `infra/main.bicep` | Azure Landing Zone root template | Azure Bicep / ARM | Draft — not deployed |
| Parameters | `infra/parameters.json` | Deployment parameters | JSON | Draft |
| modules/alerting.bicep | `infra/modules/alerting.bicep` | Azure Monitor alerts | Bicep | Draft |
| modules/blobstorage.bicep | `infra/modules/blobstorage.bicep` | Azure Blob Storage | Bicep | Draft |
| modules/containerapp.bicep | `infra/modules/containerapp.bicep` | Azure Container Apps | Bicep | Draft |
| modules/docintell.bicep | `infra/modules/docintell.bicep` | Azure Document Intelligence | Bicep | Draft |
| modules/eval-runner.bicep | `infra/modules/eval-runner.bicep` | Eval runner compute | Bicep | Draft |
| modules/frontdoor.bicep | `infra/modules/frontdoor.bicep` | Azure Front Door CDN/WAF | Bicep | Draft |
| modules/keyvault.bicep | `infra/modules/keyvault.bicep` | Azure Key Vault | Bicep | Draft |
| modules/postgres.bicep | `infra/modules/postgres.bicep` | Azure Database for PostgreSQL | Bicep | Draft |
| modules/redis.bicep | `infra/modules/redis.bicep` | Azure Cache for Redis | Bicep | Draft |
| modules/servicebus.bicep | `infra/modules/servicebus.bicep` | Azure Service Bus | Bicep | Draft |
| modules/staticwebapp.bicep | `infra/modules/staticwebapp.bicep` | Azure Static Web Apps | Bicep | Draft |
| modules/storage.bicep | `infra/modules/storage.bicep` | Azure Storage | Bicep | Draft |
| modules/vnet.bicep | `infra/modules/vnet.bicep` | Azure Virtual Network | Bicep | Draft |
| Runbooks | `infra/runbooks/` | Operational runbooks | Markdown | Active |

**Current state:** All Bicep files are authored and parameterized but not yet deployed. No live Azure resources are provisioned from this repo. Current runtime is Replit-managed.

---

## 8. CI/CD (`.github/workflows/`)

28 GitHub Actions workflows, all pinned to full commit SHAs (verified).

| Workflow | File | Purpose |
|----------|------|---------|
| Accessibility Checks | `a11y.yml` | axe/WCAG 2.1 AA scan across 11 web artifacts |
| API Spec Drift | `api-spec-drift.yml` | Route files vs OpenAPI spec consistency |
| Runtime Audit | `audit-full.yml` | Full audit pipeline evidence |
| Database Backup | `backup.yml` | pg_dump + Azure upload |
| Build | `build.yml` | pnpm build across workspace |
| CI | `ci.yml` | Primary CI gate |
| CodeQL | `codeql.yml` | GitHub SAST scan |
| Commitlint | `commitlint.yml` | Conventional commit enforcement |
| Container Publish | `container-publish.yml` | OCI image push to ACR |
| Dependabot Auto-merge | `dependabot-auto-merge.yml` | Minor/patch auto-merge |
| Dependency Review | `dependency-review.yml` | New dependency license/vuln review |
| Deploy Production | `deploy-production.yml` | Production deployment gate |
| Deploy Staging | `deploy-staging.yml` | Staging deployment |
| E2E | `e2e.yml` | Playwright end-to-end tests |
| Eval Gate | `eval-gate.yml` | AI evaluation gate |
| Lighthouse | `lighthouse.yml` | Lighthouse performance/a11y |
| Visual Regression | `nexus-visual-regression.yml` | Visual snapshot comparison |
| Nightly Smoke | `nightly-smoke.yml` | Nightly smoke test run |
| NPM Publish | `npm-publish.yml` | Package publishing |
| Operational Audit | `operational-audit.yml` | Runtime operational audit |
| Post-deploy Smoke | `post-deploy-smoke.yml` | Post-deployment verification |
| README QA | `readme-qa.yml` | README asset validation |
| Release | `release.yml` | Release automation |
| Secret Scan (scheduled) | `secret-scan-scheduled.yml` | Nightly secret scanning |
| Secret Scan (PR) | `secret-scan.yml` | Per-PR secret scanning |
| Security | `security.yml` | Security scan gate |
| Uptime Monitor | `uptime-monitor.yml` | Endpoint uptime monitoring |
| Source of Truth Verify | `verify-source-of-truth.yml` | Platform facts verification |

---

## 9. External Integrations & Dependencies

| Category | Provider | Used By | Secret(s) | Notes |
|----------|----------|---------|-----------|-------|
| Database | PostgreSQL 16 (Replit-managed dev, Azure Flexible Server target) | api-server, all apps | `DATABASE_URL` | 730 live tables |
| AI Inference | OpenAI (GPT-4o, Embeddings) | api-server, alloy stack | `OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_*` | Primary AI provider |
| AI Inference | Anthropic (Claude) | api-server, alloy stack | `ANTHROPIC_API_KEY`, `AI_INTEGRATIONS_ANTHROPIC_*` | Secondary AI provider |
| AI Inference | Gemini | api-server | `AI_INTEGRATIONS_GEMINI_*` | Tertiary AI provider |
| Local Inference | Substrate (oLLM) | substrate-inference | `SUBSTRATE_API_KEY`, `SUBSTRATE_INFERENCE_URL` | Air-gapped / fallback |
| Payments | Stripe | api-server, carlota-jo | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, multiple price IDs | |
| Email | Resend | api-server | `RESEND_API_KEY` | Primary email |
| Email (alt) | SendGrid | api-server | `SENDGRID_API_KEY` | Fallback |
| Email (SMTP) | Generic SMTP | api-server | `SMTP_HOST/PORT/USER/PASS/FROM` | |
| Mapping | Mapbox | szl-holdings, command | `MAPBOX_ACCESS_TOKEN` | |
| Maritime Data | Marine Traffic | vessels | `MARINE_TRAFFIC_API_KEY` | |
| Weather | Weather API | vessels/platform | `WEATHER_API_KEY` | |
| Comms | Slack | ops/api-server | `SLACK_WEBHOOK_URL`, `SLACK_BOT_TOKEN`, `SLACK_ALERT_CHANNEL` | |
| Comms | Microsoft Teams | ops | `MICROSOFT_TEAMS_WEBHOOK_URL` | |
| Comms | Twilio | api-server | `TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER` | |
| Analytics | Plausible | szl-holdings | `VITE_PLAUSIBLE_DOMAIN` | Privacy-respecting analytics |
| Mobile Push | Expo Server SDK | api-server | EAS secrets | Push notifications |
| CI/CD | GitHub Actions | `.github/workflows/` | GitHub token | All pinned to SHA |
| Secret Store | Azure Key Vault (planned) | infra target | Key Vault URI | Not yet deployed |
| Container Registry | Azure Container Registry | container-publish.yml | ACR credentials | Target for image pushes |

---

## 10. Auth Boundaries

| Boundary | Mechanism | Location | Status |
|----------|-----------|---------|--------|
| Web SPA auth | Replit Auth (OIDC/PKCE) | `packages/replit-auth-web`, `lib/auth` | Active |
| API auth | Session cookies + JWT | `artifacts/api-server/src/middlewares/` | Active |
| Mobile auth | Expo Auth Session | `packages/mobile-shared` | Active |
| Tenant scoping | Tenant-scope middleware | `artifacts/api-server/src/middlewares/tenant-scope.ts` | Active |
| Rate limiting | express-rate-limit | `artifacts/api-server/src/middlewares/rate-limiters.ts` | Active |
| Internal token | `[INTERNAL_TOKEN_VAR]` (see .env.example) | api-server ↔ internal services | Active |
| Aegis policy | `packages/policy-engine` + `policy-guard` | All | Partial |

---

## 11. Telemetry / Logging Current State

| Area | Status | Notes |
|------|--------|-------|
| Structured JSON logging | **Partial** — api-server yes; frontend SPAs no | No standard log schema enforced across all surfaces |
| OpenTelemetry traces | **Partial** — api-server has OTel spans; `packages/otel` and `packages/observability-core` exist; frontend partial | No collector endpoint configured for Replit dev |
| Metrics | **Partial** — `services/lyte-metrics-store`, `packages/cognitive-observability` | No unified metrics scrape target |
| Alerting | **Partial** — `infra/modules/alerting.bicep` drafted; no live Azure Monitor | Replit uptime-monitor workflow only |
| Distributed tracing | **None** — no Tempo/Jaeger/Zipkin running | Target: OTel → OTLP → Azure Monitor or Grafana |
| Error tracking | **None** — no Sentry or equivalent | Target: OTel error spans |
| Audit log | **Active** — `lib/audit`, IP hashing in place, 4 audit tables | Canonical |

---

## 12. Secret Handling Current State

| Mechanism | Status |
|-----------|--------|
| `.env.example` with safe placeholders | ✅ Active |
| `.env` gitignored | ✅ Active |
| Replit Secrets (dev) | ✅ Active |
| Azure Key Vault (prod target) | 🔲 Drafted in Bicep — not deployed |
| Secret scanning CI (every push/PR) | ✅ Active (`secret-scan.yml`, `secret-scan-scheduled.yml`) |
| Gitleaks config | ✅ Active (`.gitleaks.toml`) |
| EAS secrets for mobile credentials | ✅ Active |

---

## 13. Deployment Assumptions

| Assumption | Current State | Target State |
|------------|-------------|--------------|
| Dev runtime | Replit-managed workflows | Same (Replit dev env) |
| Prod runtime | Not deployed (Replit Deployments if any) | Azure Container Apps behind Front Door |
| Database | Replit-managed PostgreSQL 16 | Azure Database for PostgreSQL Flexible Server |
| Secret store | Replit Secrets | Azure Key Vault |
| Container registry | None active | Azure Container Registry |
| CDN/WAF | None | Azure Front Door |
| Redis cache | None | Azure Cache for Redis |
| Message bus | None live | Azure Service Bus |
| Node version | Node 24 (Replit dev, platform-managed), Node 22 (CI, Dockerfiles) | Node 22 LTS everywhere |

---

## 14. Duplicated Patterns / Dead Code Findings

| Finding | Location | Action |
|---------|----------|--------|
| `lib/ontology` (3 consumers) duplicates `packages/ontology` (36 consumers) | `lib/ontology/`, `packages/ontology/` | Consolidate — tracked in `CONSOLIDATION_DECISIONS.md` |
| Multiple `lib/` packages may overlap `packages/` equivalents | `lib/config`, `lib/auth`, `lib/proof-chain`, `lib/forge-runtime` | Audit each pair; consolidate in Backstage catalog phase |
| `artifacts/firestorm`, `artifacts/imperium`, `artifacts/prism-counsel` on disk but not registered | `artifacts/` | Verify API routes still needed; archive dirs if safe |
| 14 route files in api-server > 1,900 LOC (splitting deferred per brief) | `artifacts/api-server/src/routes/` | Document in tech debt; split in later phase |
| Stale screenshots in `screenshots/` and `launch-shots/` | Root-level | Document in hygiene report; remove safely where not referenced |
| `docs/` contains 172+ markdown files with significant bloat | `docs/` | Document; consolidation deferred |
| `.archive/` and `archive/` both exist at root | Root | Consolidate into single archive dir in later pass |
| Large zip files at root (LINKEDIN-LAUNCH.zip 12.5 MB, X-LAUNCH-SERIES.zip 1.4 MB, etc.) | Root | Review for gitignore; these are tracked in git |

---

## 15. Risk Score Summary

| Risk Level | Count | Key Items |
|-----------|-------|-----------|
| HIGH | 3 | api-server (357 routes, critical backend), substrate-inference (GPU inference, complex env), meridian_control_plane (AI policy) |
| MEDIUM | 12 | alloy stack (5 apps/services/workers), lyte surfaces, command, mobile, substrate-mcp-gateway, auth-shared |
| LOW | 12 | Marketing surfaces, domain pack SPAs, design tooling, video |
