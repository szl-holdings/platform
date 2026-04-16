# SZL Holdings Platform

## Overview
The SZL Holdings Platform is a **governed operational intelligence platform** — connecting what is observable to what is executable, under governance, with full attribution. It is a pnpm monorepo with 15 active artifacts (10 web, 2 mobile, 1 API, 1 design system, 1 dev sandbox), 51 shared packages, 685 database tables, 2,331 API endpoints, and over 450,000 lines of TypeScript.

**Core architecture:** Every consequential decision follows the same governed loop — Signal → Context → Recommendation → Simulation → Policy → Approval → Execution → Proof → Outcome.

**Five platform primitives** power this loop across all surfaces:
- **Outcome Graph** (`lib/outcome-graph/`) — decision lifecycle tracking (recommendation → decision → outcome)
- **Proof Chain** (`lib/proof-chain/`) — immutable audit trail with provenance
- **Covenant Policy** (`lib/covenant-policy/`) — permission and human-in-the-loop approval gates
- **Monte Carlo** (`lib/monte-carlo/`) — probabilistic risk simulation before action
- **Workflow Engine** (`lib/workflow-engine/`) — durable process orchestration

**Command surfaces:** Lyte (web command), CORTEX (mobile command), Command Portal (ecosystem hub)
**Execution fabric:** Alloy (workflow orchestration, approval gates, audit trail)
**Domain packs:** Aegis (security), Vessels (maritime), Terra (real estate), PRISM Counsel (legal), Carlota Jo (advisory), IMPERIUM (cloud sovereignty)
**Cross-domain:** PRISM Bus (event bus), Forge Runtime (agent execution), AI Engine (multi-provider with fallback)

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## Demo Day
See `DEMO.md` for the full demo runbook including credentials, walkthrough script, and troubleshooting.
- **Seed command:** `pnpm seed` creates 5 demo users with PBKDF2-hashed passwords
- **Health endpoint:** `GET /api/health` returns full service matrix (database, auth, AI, storage, uptime)
- **Login:** `POST /api/auth/login-password` — admin@szlholdings.com / DemoAdmin2026!, or alex/jordan/morgan/casey@szlholdings.com / DemoUser2026!

## Demo Assets
A full investor showcase package lives in `demo-assets/`:
- `screenshots/` — 9 high-quality app screenshots (szl-holdings, carlota-jo, terra, vessels, lyte, prism-counsel, stephen-site, command, firestorm-placeholder)
- `linkedin-carousel.md` — 10-slide carousel design brief for Canva/Figma production
- `linkedin-post-longform.md` — ~1,100-word long-form post targeting Series A investors
- `linkedin-series.md` — 7-post series scheduled across 2-3 weeks
- `README.md` — full ecosystem index and campaign instructions

## Routing Architecture — Shared Gateway (April 2026)
All sub-path web artifacts (aegis, terra, carlota-jo, vessels, command) share a single `localPort = 9090` via a distributed reusePort gateway pattern.

**How it works:**
- The `artifacts/aegis` Vite process starts first and binds port 9090 with `reusePort: true` (establishing the reusePort group that Replit monitors).
- Each other sub-path app (terra, carlota-jo, vessels, command) also binds port 9090 with `reusePort: true` in their `configureServer` gateway plugin — this joins the existing reusePort group so Replit detects them as RUNNING.
- Each app runs its own Vite instance on a separate internal port: aegis=23933, terra=21100, carlota-jo=21200, vessels=18485, command=25200.
- The gateway proxy on each process is path-aware: `/terra/*` → 21100, `/carlota-jo/*` → 21200, `/vessels/*` → 18485, `/command/*` → 25200, `/aegis/*`+`/firestorm/*` → 23933.
- The API server (port 8080) runs as a subprocess of the command Vite process via `apiServerPlugin()`. The standalone `artifacts/api-server: api` workflow is therefore expected to fail (port already in use).
- `artifacts/szl-holdings` runs independently at `localPort = 21130` (previewPath="/", no gateway needed).

**Key files:** Each app's `vite.config.ts` contains the `gatewayPlugin()` function and the routing table.
## System Architecture

### Technology Stack
The platform is built as a pnpm monorepo using Node.js 24 and TypeScript 5.9.
- **Frontend:** React 19, Vite, TanStack React Query, Wouter, Tailwind CSS v4, Framer Motion, Lucide React, Recharts
- **Backend:** Express 5, Drizzle ORM, Zod validation, pino logging
- **Database:** PostgreSQL 16 with Drizzle ORM managing 685 tables across 112 schema files
- **Authentication:** OIDC/PKCE, session-based with cookie+Bearer token, 11-role RBAC with org-scoped tenant isolation
- **Mobile:** Expo / React Native, NativeWind
- **AI:** Multi-provider (OpenAI, Anthropic, Gemini) with fallback. 9 schema-validated decision types.
- **Real-time:** WebSocket (HMAC-signed tickets), SSE, push notifications
- **Bundling:** esbuild (CJS) and Vite

### Platform Capabilities
The platform comprises 15 active artifacts sharing governance infrastructure:
- **Authentication & RBAC:** 11-role hierarchy with deny-by-default global auth enforcer
- **Alloy Execution Fabric:** Workflow orchestration with Covenant Policy approval gates, Proof Chain audit trail, and Outcome Graph decision tracking
- **AI Agents:** 12 specialized domain AI agents (advisory only — governed by Covenant Policy)
- **PRISM Bus:** Cross-domain event bus with correlation IDs for multi-domain signal routing
- **Monte Carlo Engine:** Probabilistic simulation with domain-specific scenario libraries
- **Real-Time:** Multiplexed WebSocket layer at `/ws` with SSE fallback and Prism Bus Bridge
- **CORTEX Unified Mobile Command:** Single Expo app consolidating all domain pack mobile experiences
- **Admin Panel CMS:** Centralized administration for CMS tables, media assets, and site settings
- **Multi-Tenant Provisioning:** Azure AD multi-tenant SSO, SCIM 2.0 user provisioning, white-label branding

### API Layers
- **REST API:** Modular Express routes using Zod and Drizzle, located in `artifacts/api-server`, with robust security
- **GraphQL API:** Unified API at `/api/graphql` using Apollo Server v5 and `graphql-ws` for subscriptions across 9 domain modules
- **MCP Server:** Model Context Protocol server at `/api/mcp` for AI tool orchestration, exposing 23 tools, 4 resources, and 5 prompt templates via HTTP+SSE

### Design System
Premium, SZL-branded dark-first design system (except Carlota Jo luxury light-mode). Typography: Space Grotesk, Inter, JetBrains Mono. Domain packs maintain unique visual identities within the overarching brand hierarchy.

### Object Storage
Replit's GCS-backed object storage (App Storage) handles file uploads and generated documents, secured by ACL metadata and accessible via presigned URLs.

## Dev Server Port Architecture

All Vite-based web apps use a **shared routing proxy** pattern on port 9090 (the only port registered in `.replit` for web apps, mapped to external port 3000). Each app's `vite.config.ts` includes a `sharedProxyPlugin` that:

1. Binds an HTTP proxy to port 9090 with `reusePort: true` (Linux socket sharing)
2. Routes incoming requests to the correct Vite dev server by URL path prefix
3. Returns HTTP 200 for health-check paths (`/`, `/health`, `/__health`)

The routing table embedded in every app's `vite.config.ts`:
- `/aegis/` → port 23933
- `/firestorm/` → port 23931
- `/carlota-jo/` → port 21200
- `/command/` → port 25200
- `/terra/` → port 25100
- `/vessels/` → port 18485

All 6 artifact.toml files use `localPort = 9090`. The Replit workflow health check detects port 9090 as open (whichever app started first contributes). This is necessary because `.replit` port registration cannot be modified by the agent, and only port 9090 (plus 8080 for the API server and 21130 for szl-holdings) are registered.

**Limitation:** HMR (Hot Module Replacement) WebSocket connections fail because the shared HTTP proxy does not handle WebSocket upgrades. Developers must manually refresh the browser after code changes.

## External Dependencies
- **Database:** PostgreSQL 16
- **Authentication:** Replit Auth (OIDC/PKCE)
- **Payment Processing:** Stripe
- **AI:** OpenAI, Anthropic, Gemini, HuggingFace Inference API, Elevenlabs
- **Communication:** Slack, Twilio, Resend, SendGrid
- **Maritime Data:** MarineTraffic, AISHub, Digitraffic AIS, BarentsWatch AIS, Open-Meteo Marine Weather
- **Threat Intelligence:** STIX/TAXII, AlienVault OTX, MISP OSINT, OFAC SDN, EU Consolidated List, UN Security Council, Shodan, GreyNoise, MalwareBazaar
- **Government Data:** CISA KEV, NVD CVE, MITRE ATT&CK, Census/BLS, FEMA NRI, NYC Open Data, SEC EDGAR
- **Legal Data:** CourtListener REST API
- **Other:** GitHub API, Figma, Google APIs, HubSpot