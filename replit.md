# SZL Holdings Platform

## Overview
The SZL Holdings Platform is a pnpm monorepo encompassing an operational intelligence platform across 8 industry verticals. It includes 10 production web apps (React + Vite), 2 unified mobile command centers (Expo/React Native), 1 API server (Express 5 + PostgreSQL 16), 37 shared libraries, 644 database tables, 2,331 API endpoints, and over 450,000 lines of TypeScript. Key products deliver business observability, defense intelligence, maritime fleet command, real estate intelligence, legal matter command, premium advisory, cloud sovereignty, and unified mobile command. The ecosystem is interconnected by PRISM Bus (cross-domain event bus), Forge Runtime (agent execution engine), and Alloy (workflow orchestration with approval gates and audit trails). The platform aims to provide a comprehensive, governed, and intelligent ecosystem for various business and defense applications.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

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

### Core Technologies
The platform is built as a pnpm monorepo using Node.js 24 and TypeScript 5.9.
- **Frontend:** React, Vite, TanStack React Query, Wouter, Tailwind CSS, Framer Motion, Lucide React, Recharts. Supports internationalization with RTL.
- **Backend:** Express 5, Drizzle ORM, Zod validation, pino logging.
- **Database:** PostgreSQL 16 with Drizzle ORM managing 644 tables across various domains.
- **Authentication:** Replit Auth (OIDC/PKCE), session-based with cookie+Bearer token, 7-role RBAC.
- **API Codegen:** Orval from OpenAPI specification.
- **Bundling:** esbuild (CJS) and Vite.

### UI/UX Design System
A premium, SZL-branded design system, dark-first aesthetics (except Carlota Jo), purposeful motion, and sharp corners. Typography includes Space Grotesk, Inter, and JetBrains Mono. Applications maintain unique visual identities within the overarching brand hierarchy, ensuring consistency and a high-quality user experience. Carlota Jo features a luxury light-mode theme with warm ivory and gold accents.

### Object Storage
Replit's GCS-backed object storage (App Storage) handles all file uploads and generated documents, secured by ACL metadata and accessible via presigned URLs.

### API Layers
- **REST API:** Modular Express routes using Zod and Drizzle, located in `artifacts/api-server`, with robust security.
- **GraphQL API:** A unified API mounted at `/api/graphql` using Apollo Server v5 and `graphql-ws` for subscriptions across 9 domain modules.
- **MCP Server:** Model Context Protocol server at `/api/mcp` for AI tool orchestration, exposing 20 tools, 4 resources, and 5 prompt templates via HTTP+SSE.

### Platform Architecture & Features
The platform comprises 13 interconnected applications sharing authentication and design.
- **Authentication & RBAC:** Middleware with an 11-role RBAC system.
- **Service Adapters:** Integrates 29 third-party services with environment variable detection and mock fallbacks.
- **Multi-Tenant Provisioning & Branding:** Supports Azure AD multi-tenant onboarding, SCIM 2.0 user provisioning, and white-label branding.
- **Intelligence Layer:** Over 40 REST endpoints provide cross-platform intelligence, including government data feeds and AI services.
- **Alloy AI Decision Engine:** HuggingFace-powered AI execution fabric with schema-validated decision types, a model registry, and policy-gated tool execution.
- **AI Models & Agents:** Primarily Qwen3-8B (HuggingFace) with OpenAI and Anthropic fallbacks. Includes 12 specialized domain AI agents and domain-specific AI copilots with SSE streaming and voice I/O.
- **Unified AI Copilot Interface:** Persistent `AgentCopilot` drawer integrated into all web apps and mobile apps with domain-aware routing and conversation history.
- **SZL Holdings Innovation Layer:** Cross-domain natural language query engine, ambient signal ranker, and autonomous signal chain engine with new API routes and Command Portal components.
- **Ecosystem Innovation Engine:** Cross-portfolio ambient intelligence layer with shared components and domain-specific breakthrough pages.
- **Nuro Mesh Intelligence Layer:** Cross-domain causal reasoning engine with proactive agent activation, Bayesian confidence calibration, structured conflict resolution, and agent performance telemetry.
- **Observability:** Structured logging via pino and an 8-pillar domain-native observability framework.
- **Feature Gating:** Entitlement-based access control.
- **Admin Panel CMS:** Centralized administration for 16 CMS tables, media assets, and site settings.
- **Collaboration & Notifications:** In-app collaboration via `comments` table and a universal notification/real-time alerting system with multi-channel dispatch and Expo Push Notifications.
- **Real-Time WebSocket & Event Streaming:** Persistent, multiplexed WebSocket layer at `/ws` with SSE fallback, Prism Bus Bridge, message history, presence tracking, and backpressure handling.
- **Mobile Shared Library (`@szl-holdings/mobile-shared`):** Shared React Native components and hooks used across all 7 mobile apps, including BiometricProvider, Push Notifications, Deep Linking, and Offline-First features.
- **Offline-First & Edge Infrastructure (`@szl-holdings/offline-engine`):** Universal offline-first data layer with storage abstraction, command queue, conflict resolution, delta-sync client, and Service Worker infrastructure.
- **Email Delivery:** Triple-failover email chain (SendGrid → Resend → SMTP nodemailer).
- **Alloy Platform Core:** Orchestration engine with canonical shared data model, ingestion, normalization, and workflow orchestration.
- **CORTEX Unified Mobile Command:** Single Expo app (`artifacts/szl-holdings-mobile`) consolidating all vertical mobile apps into a unified command surface with a Workspace Switcher, adaptive tab navigation, and cross-domain Navigator AI.
- **Nuro Mesh Graph Intelligence:** Production-grade graph capabilities and OSINT feed integration extending the Nuro Mesh AI engine, including new feed adapters, enhanced ontology engine with graph algorithms, and GraphRAG for context injection.
- **Strategic Ecosystem Gap Fill:** Seven new end-to-end capabilities: CORTEX Voice, Morning Briefing Engine, Revenue Intelligence Fusion, What-If Simulation Engine, Compliance & Audit Provenance Chain, White-Label Client Portals, and Multiplayer Command Sessions.
- **Platform Hardening:** Includes CI/CD pipelines (GitHub Actions), Dependabot, unit tests, APM, disaster recovery, feature flags, API versioning, rate limiting, and multi-environment configuration.

## External Dependencies
- **Database:** PostgreSQL
- **Authentication:** Replit Auth
- **Payment Processing:** Stripe
- **AI/NLP:** HuggingFace Inference API, Replit's OpenAI proxy, OpenAI, Anthropic, Elevenlabs
- **Communication:** Slack, Twilio, Resend
- **Productivity/Collaboration:** Google APIs, Notion, Confluence, HubSpot, Dropbox, OneDrive
- **Analytics:** Plausible, Posthog
- **Government Data Feeds:** CISA KEV, NVD CVE, MITRE ATT&CK, FedRAMP, Census Bureau ACS, BLS Construction Employment, FEMA NRI, USAspending.gov, NOAA, arXiv, Semantic Scholar, PapersWithCode, HuggingFace Hub, SEC EDGAR, NYC Open Data, FRED, HUD Fair Market Rents
- **Maritime Data:** MarineTraffic REST API, AISHub public feed, Digitraffic AIS, BarentsWatch AIS, Open-Meteo Marine Weather API
- **Threat Intelligence:** Shodan InternetDB, GreyNoise Community API, MalwareBazaar, URLhaus, STIX/TAXII, AlienVault OTX, MISP OSINT, OFAC SDN, EU Consolidated List, UN Security Council
- **Legal Data:** CourtListener REST API
- **Other:** GitHub Public API, AbuseIPDB, Figma