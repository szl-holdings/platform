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
-   **569 DB tables**, 116 schema files in `lib/db/src/schema/`

### Canonical Artifacts (Active)
| Artifact | Path | Files | Purpose |
|----------|------|-------|---------|
| szl-holdings | `/` | 402 | Corporate, marketing, trust center, investor hub |
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
