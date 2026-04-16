# SZL Holdings Platform

## Overview
The SZL Holdings Platform is **governed decision infrastructure** — the structural layer between signal detection and action execution that enforces governance, attribution, and outcome tracking on every consequential decision. It is a pnpm monorepo encompassing web and mobile applications, an API, a design system, and a development sandbox. The platform's core architecture revolves around one canonical nine-step loop: Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning. This loop is powered by six platform primitives: Outcome Graph, Proof Chain, Covenant Policy, Decision Simulation, Workflow Engine, and Event Fabric.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### Core Architecture
The platform is built as a pnpm monorepo using TypeScript 5.9, React 19, Vite, and Node.js. It features a micro-frontend architecture for web applications, utilizing a shared gateway proxy pattern on port 9090 for routing sub-path artifacts.

**Six Platform Primitives:**
-   **Outcome Graph:** Tracks the decision lifecycle from recommendation to outcome.
-   **Proof Chain:** Provides an immutable audit trail with provenance.
-   **Covenant Policy:** Manages permissions and human-in-the-loop approval gates.
-   **Monte Carlo:** Offers probabilistic risk simulation before execution.
-   **Workflow Engine:** Orchestrates durable processes.
-   **Event Fabric (PRISM Bus):** Cross-domain event bus for signal routing.

### Monorepo Structure
-   **15 artifact dirs** in `artifacts/` — 7 canonical web, 1 canonical mobile, 1 internal, 5 archived, 1 shell
-   **34 lib packages** in `lib/` — shared infrastructure and platform primitives
-   **3 packages** in `packages/` — business observability fabric (observability-core, business-events, telemetry-standards)
-   **5 new platform packages** in `packages/` — AI Control Plane and NVIDIA-Ready Modules (see below)
-   **569 DB tables**, 116 schema files in `lib/db/src/schema/`

### Business Observability Fabric (packages/)

Three new packages implement the ATLAS business telemetry layer:

| Package | Path | Purpose |
|---------|------|---------|
| `@szl-holdings/observability-core` | `packages/observability-core` | OTEL setup, AsyncLocalStorage context, correlation ID propagation, Express middleware |
| `@szl-holdings/business-events` | `packages/business-events` | Typed ATLAS event emitters (11 event classes), domain KPI adapters, event bus |
| `@szl-holdings/telemetry-standards` | `packages/telemetry-standards` | GenAI semantic convention constants, business/HTTP attribute name contracts |

**Architecture docs:**
- `docs/observability/business-observability-spec.md` — ATLAS event contract, API endpoints, ingestion adapters
- `docs/observability/genai-observability-spec.md` — GenAI span types, OTel semantic conventions, prompt trace contract

**API server routes added:**
- `POST /api/business-events/kpi` — ingest batch KPI records → ATLAS events
- `POST /api/business-events/transactions` — ingest domain transactions → ATLAS events
- `POST /api/business-events/emit` — emit typed ATLAS events directly
- `GET /api/business-events/summary` — aggregated event counts by class/domain
- `GET /api/business-events/events` — recent raw events (ops/admin)

### Canonical Artifacts (Active)
| Artifact | Path | Files | Purpose |
|----------|------|-------|---------|
| szl-holdings | `/` | 403 | Corporate, marketing, trust center, investor hub, Decision Theater |
| api-server | `/api` | 395 | REST + GraphQL + WebSocket backend |
| command | `/command/` | 223 | Unified ops command (absorbed Lyte + IMPERIUM) |
| aegis | `/aegis/` | 166 | Defense & security intelligence |
| vessels | `/vessels/` | 103 | Maritime fleet command |
| terra | `/terra/` | 92 | Real estate intelligence |
| carlota-jo | `/carlota-jo/` | 70 | Premium advisory |
| szl-holdings-mobile | Expo | 167 | CORTEX mobile command |

### Archived Artifacts (Code Removed)
firestorm, lyte-command-center, imperium, prism-counsel, stephen-site — no app source (pages/components) remains; DEPRECATED.md/ARCHIVED.md markers, stale dist/node_modules, and residual config files may exist.

### Technology Stack
-   **Frontend:** React 19, Vite, TanStack React Query, Wouter, Tailwind CSS v4, Framer Motion.
-   **Backend:** Express 5, Drizzle ORM, Zod validation, pino logging.
-   **Database:** PostgreSQL 16 with Drizzle ORM (569 tables, 116 schema files).
-   **Authentication:** OIDC/PKCE, session-based with cookie+Bearer token, 11-role RBAC.
-   **Mobile:** Expo / React Native, NativeWind.
-   **AI:** Multi-provider (OpenAI, Anthropic, Gemini) with fallback, supporting 9 schema-validated decision types.
-   **AI Evaluation:** Trace capture (`lib/ai-engine/src/evals/trace-capture.ts`), evaluator hooks (`evaluator-hooks.ts`), and review queue (`review-queue.ts`) for every AI recommendation lifecycle.
-   **AI Ops Dashboard:** REST endpoints at `/api/ai/ops/*` for cost, latency, confidence, review queue, and evaluator stats.
-   **Real-time:** WebSocket (HMAC-signed tickets), Server-Sent Events (SSE), push notifications.
-   **Bundling:** esbuild (CJS) and Vite.

### AI Control Plane & NVIDIA-Ready Packages (`packages/`)

Five new packages in `packages/` provide provider-agnostic AI infrastructure:

| Package | Description |
|---------|-------------|
| `@szl-holdings/ai-control-plane` | Model routing, eval-aware selection, fallback engine, cost controls (budget policies + hard stops), PII redactor, prompt injection scanner, agent tier definitions (assistant/analyst/operator/autonomous), policy engine |
| `@szl-holdings/prompt-registry` | Versioned prompt management with eval metadata, A/B comparison, and promotion lifecycle |
| `@szl-holdings/tool-registry` | Tool management with approval classes, MCP bridging, dry-run execution, and audit trail |
| `@szl-holdings/nvidia-adapters` | Optional NVIDIA NIM endpoint adapter, NeMo eval hooks + observability events, agent profiler with performance grades |
| `@szl-holdings/openusd-export` | OpenUSD digital twin export for Vessels (route simulation), Terra (property scenarios), and Aegis (security scenario rehearsal) |

**Architecture docs:** `docs/ai/ai-control-plane.md`, `docs/ai/nvidia-optional-runtime.md`, `docs/platform/digital-twin-and-simulation-strategy.md`

### UI/UX and Design System
The platform utilizes a premium, SZL-branded, dark-first design system. Typography includes Space Grotesk, Inter, and JetBrains Mono. Domain packs maintain unique visual identities within the overarching brand.

### API Layers
-   **REST API:** Modular Express routes using Zod and Drizzle.
-   **GraphQL API:** Unified API at `/api/graphql` using Apollo Server v5 and `graphql-ws` for subscriptions.
-   **MCP Gateway:** Model Context Protocol server at `/api/mcp` (JSON-RPC 2.0 + SSE) with 26 tenant-scoped, role-enforced, approval-aware tools. See `MCP_GATEWAY_STRATEGY.md`.

### Key Features
-   **Reporting & Analytics Engine:** Includes an Investor Analytics Dashboard, Data Export Builder, and Scheduled Reports.
-   **Authentication & RBAC:** 11-role hierarchy with global auth enforcer.
-   **Alloy Execution Fabric:** Workflow orchestration with approval gates and decision tracking.
-   **AI Agents:** 12 specialized domain AI agents governed by Covenant Policy.
-   **PRISM Bus:** Cross-domain event bus for signal routing.
-   **Monte Carlo Engine:** Probabilistic simulation with domain-specific scenario libraries.
-   **Multi-Tenant Provisioning:** Azure AD multi-tenant SSO, SCIM 2.0, white-label branding.
-   **Object Storage:** Replit's GCS-backed storage for file uploads and documents, secured by ACLs and presigned URLs.

## Navigation Hierarchy
Three-tier model: Platform (Command, Alloy, CORTEX, SZL Holdings) → Primitives (invisible, surface through interactions) → Domain Packs (Aegis, Vessels, Terra, Carlota Jo).

See `NAVIGATION_STRATEGY.md`, `PRODUCT_SURFACE_MAP.md`, `ROUTE_INVENTORY.md` for full details.

## GitHub Enterprise Files
-   `.github/CODEOWNERS` — Code ownership for PR reviews
-   `.github/PULL_REQUEST_TEMPLATE.md` — PR template with quality checklist
-   `.github/ISSUE_TEMPLATE/` — Bug report, feature request, security report templates
-   `.github/dependabot.yml` — Dependency update schedule (weekly, grouped)
-   `.github/workflows/ci.yml` — CI pipeline (lint, typecheck, test, build)
-   `.github/workflows/release.yml` — Semantic versioning + GitHub Release
-   `.github/workflows/deploy-staging.yml` — Auto-deploy to staging on push to main
-   `.github/workflows/deploy-production.yml` — Deploy to production on release publish
-   `GITHUB_SETUP_CHECKLIST.md` — Manual GitHub UI settings for branch protection

## Operational Docs
-   `CONTRIBUTING.md` — Setup, branching, PR workflow, engineering standards
-   `DEPLOYMENT-GUIDE.md` — Replit + Azure deployment procedures
-   `OPERATIONS-RUNBOOK.md` — Environment, database, health checks, incident response
-   `SECRETS_SETUP.md` — Mobile credential provisioning guide
-   `RELEASE_CHECKLIST.md` — Pre-release checklist

## Replay, Eval & Trust Infrastructure

Three interlinked capabilities for measuring, replaying, and improving agent behavior:

| Package | Name | Purpose |
|---------|------|---------|
| `packages/replay-core` | `@szl-holdings/replay-core` | Incident/flow capture, sanitized snapshot generation, PII redaction, scenario registry, workflow/agent replay against historical context |
| `packages/evals-core` | `@szl-holdings/evals-core` | Evaluation runner, precision/recall, usefulness, policy compliance, operator override rate, cost/latency metrics, regression detection, strategy comparison |

UI surfaces (Command app):
- **Replay Lab** — `/operations/alloy/replay-lab` — Browse captured scenarios, replay, compare outcomes
- **Eval Lab** — `/operations/alloy/eval-lab` — Run eval suites, view benchmarks, track regressions
- **Trust Console** — `/operations/alloy/trust-console` — Production trust dashboard with all metrics

Seeded scenarios: `aegis-soc-threat-triage-v1` (3 snapshots, ground truth), `vessels-voyage-pnl-optimization-v1` (1 snapshot)

Framework docs: `docs/ai/agent-evaluation-framework.md`

## ATLAS Enterprise State Model

Three canonical packages define the shared entity vocabulary across all domain packs:

| Package | Name | Purpose |
|---------|------|---------|
| `packages/atlas-core` | `@szl-holdings/atlas-core` | Full ATLAS schema: 14 primitive types + 6 domain-specific types with Zod validation |
| `packages/atlas-types` | `@szl-holdings/atlas-types` | Convenience re-exports of all ATLAS TypeScript types |
| `packages/atlas-events` | `@szl-holdings/atlas-events` | Standardized event taxonomy (100+ named events) + envelope contract |

Architecture doc: `docs/architecture/atlas-enterprise-state-model.md`  
Env registry doc: `docs/architecture/env-registry.md`

ATLAS primitives: `Signal`, `Event`, `Risk`, `Opportunity`, `Control`, `Workflow`, `Recommendation`, `Action`, `Approval`, `Evidence`, `Outcome`, `Policy`, `KPI`, `SLO`  
ATLAS domain types: `Case`, `Matter`, `Mission`, `Deal`, `Voyage`, `Incident`

Event naming convention: `domain.subject.verb` (e.g., `security.incident.created`, `business.risk.detected`)

## External Dependencies
-   **Database:** PostgreSQL 16
-   **Authentication:** Replit Auth (OIDC/PKCE)
-   **Payment Processing:** Stripe
-   **AI Providers:** OpenAI, Anthropic, Gemini, HuggingFace Inference API, Elevenlabs
-   **Communication:** Slack, Twilio, Resend, SendGrid
-   **Maritime Data:** MarineTraffic, AISHub, Digitraffic AIS, BarentsWatch AIS, Open-Meteo Marine Weather
-   **Threat Intelligence:** STIX/TAXII, AlienVault OTX, MISP OSINT, OFAC SDN, EU Consolidated List, UN Security Council, Shodan, GreyNoise, MalwareBazaar
-   **Government Data:** CISA KEV, NVD CVE, MITRE ATT&CK, Census/BLS, FEMA NRI, NYC Open Data, SEC EDGAR
-   **Legal Data:** CourtListener REST API
-   **Other APIs/Services:** GitHub API, Figma, Google APIs, HubSpot

## Important Operational Notes
-   Demo credentials are stored in Replit Secrets — see SECRETS_SETUP.md
-   Strategy dashboard: `use-ecosystem-data.ts` DEMO_SNAPSHOT fallback on 401/403 only
-   SSE URL: root-relative `/api/command/snapshot/stream`
-   **Artifact limit:** 15 active — do NOT use createArtifact()
-   **Auth model:** `req.user.roles` is array; CSRF `/api/analytics/event` exempt
-   **`@lyte` alias:** maps to `src/operations` in vite.config.ts
-   **db:migrate:** Stuck on interactive drizzle-kit prompt for `firestorm_tool_audit_log` — use `--force` flag
