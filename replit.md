# SZL Holdings Platform

## Overview
The SZL Holdings Platform is a pnpm monorepo that develops **Lyte**, a business observability platform, powered by **Alloy**, its execution fabric and audit layer. The project encompasses five product platforms (Lyte, Vessels, Aegis, Terra, Carlota Jo), a parent company site (SZL Holdings), and a founder identity site (Stephen Lutar). The core vision is to establish Lyte + Alloy as the commercial foundation for an expanding ecosystem, leveraging a shared PostgreSQL database, a unified authentication system, and a command-grade design system. The platform aims to provide advanced observability, governed execution, and intelligent automation capabilities across various business domains, with a strong emphasis on verifiable outcomes and operational readiness.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### Core Technologies
The platform is built as a pnpm monorepo utilizing Node.js 24 and TypeScript 5.9.
- **Frontend:** React, Vite, TanStack React Query, Wouter, Tailwind CSS, Framer Motion, Lucide React, Recharts. Internationalization is handled by `react-i18next` with RTL support.
- **Backend:** Express 5, Drizzle ORM, Zod validation, pino logging.
- **Database:** PostgreSQL with Drizzle ORM (over 120 tables) managing multiple schemas including CMS, product, client portal, and organization membership.
- **Authentication:** Replit Auth (OIDC/PKCE), session-based with cookie+Bearer token, 7-role RBAC.
- **API Codegen:** Orval from OpenAPI specification.
- **Bundling:** esbuild (CJS) and Vite.

### UI/UX Design System
A premium, SZL-branded design system inspired by Palantir Foundry/Anduril Lattice, featuring dark-first aesthetics (except for Carlota Jo), purposeful motion, and sharp corners. Typography includes Space Grotesk, Inter, and JetBrains Mono. Applications maintain unique visual identities within the overarching brand hierarchy. Key shared components and design tokens ensure consistency and a high-quality user experience. The Carlota Jo platform specifically features a luxury light-mode theme with warm ivory backgrounds and gold accents.

#### Brand Hierarchy & Visuals
Each platform has a distinct visual identity:
- **SZL Holdings:** Platinum/silver/graphite, incorporating the Alloy module.
- **Lyte:** Burnished amber, focused on business observability.
- **Vessels:** Deep ocean blue, for maritime command intelligence.
- **Terra:** Obsidian/graphite/deep forest, for real-estate portfolio intelligence.
- **Carlota Jo:** Warm ivory/brushed gold, for UHNW residential advisory.
- **Aegis:** Navy/amber/red, for unified defense and intelligence.
- **PRISM Counsel:** A standalone artifact focusing on legal matter observability with specialized data products and an NY insurance observability layer.
- **SZL Distribution OS:** A content publishing and distribution platform with a dedicated admin panel and public-facing content.

### API Layers
- **REST API:** Modular Express routes using Zod and Drizzle, located in `artifacts/api-server`. Includes robust security features.
- **GraphQL API:** A unified API mounted at `/api/graphql` using Apollo Server v5 and `graphql-ws` for subscriptions, with 9 domain modules.
- **MCP Server:** Model Context Protocol server at `/api/mcp` for AI tool orchestration, exposing 20 tools, 4 resources, and 5 prompt templates via HTTP+SSE.

### Platform Architecture & Features
The platform consists of 13 interconnected applications sharing authentication and design.
- **Authentication & RBAC:** Middleware with an 11-role RBAC system.
- **Service Adapters:** Integrates 29 third-party services with environment variable detection and mock fallbacks.
- **Multi-Tenant Provisioning & Branding:** Supports Azure AD multi-tenant onboarding, SCIM 2.0 user provisioning, and white-label branding for enterprise tenants.
- **Intelligence Layer:** Over 40 REST endpoints providing cross-platform intelligence, including government data feeds and AI services.
- **Core Command Center:** A unified cross-platform dashboard at `/core`.
- **Alloy AI Decision Engine:** HuggingFace-powered AI execution fabric with schema-validated decision types, a model registry, and policy-gated tool execution.
- **AI Models & Agents:** Utilizes Qwen3-8B (HuggingFace) primarily, with OpenAI and Anthropic as fallbacks. Includes 12 specialized domain AI agents (Alloy, Helmsman, Sentinel, INCA, Muse, Beacon, Zeus, Compass, Lexis, Atlas, Terra, Nexus) and domain-specific AI copilots with SSE streaming and voice input/output.
- **Nuro Mesh Intelligence Layer:** Cross-domain causal reasoning engine (18 causal patterns), proactive agent activation via signal correlation, Bayesian confidence calibration, structured conflict resolution between agents, and agent performance telemetry. Hybrid semantic+keyword routing with cross-domain affinity, pre-turn agent consultation pattern, and maker-checker validation for high-stakes outputs.
- **AlloyChat:** A multi-model AI operations assistant.
- **Observability:** Structured logging via pino and an 8-pillar domain-native observability framework.
- **Feature Gating:** Entitlement-based access control using `checkFeatureAccess`.
- **Admin Panel CMS:** Centralized administration for 16 CMS tables, media assets, and site settings.
- **Collaboration & Notifications:** In-app collaboration layer via `comments` table and a universal notification/real-time alerting system with multi-channel dispatch (Slack, MS Teams) and Expo Push Notifications for mobile.
- **Mobile Shared Library (`lib/mobile-shared`, `@szl-holdings/mobile-shared`):** Shared React Native components and hooks used across all 7 mobile apps: `ErrorBoundary`, `SkeletonLoader`, `KeyboardAwareScrollViewCompat`, and `useApiStatus`. Each mobile app's metro.config.js includes this package in its watchFolders.
- **Email Delivery:** Triple-failover email chain (SendGrid → Resend → SMTP nodemailer).
- **Alloy Platform Core:** Orchestration engine with canonical shared data model, ingestion, normalization, and workflow orchestration.
- **Alloy Unified Command Surface:** Features a Global Command Bar, Workspace Home, Decision Objects, Skill Registry, and Operator Control Center.
- **Alloy Enterprise Governance:** A comprehensive governance system with policies, model routing, cost controls, and incident management.
- **Outcome Graph & Atlas Artifacts:** Decision memory and learning loop engine, and branded document/report generation with provenance and versioning.
- **HELM Console:** Operator control plane providing platform health, agent stats, outcome metrics, and trust receipt anomalies.
- **Platform Marketing Readiness:** Includes feature flags, analytics integration, elite layer pages (`/academy`, `/help`, `/demos`), robust demo data, and full Open Graph/Twitter Card meta tags.
- **Cross-App Compounding:** Implements cross-app handoff contracts, notification relay, and a family dashboard in HELM for visualizing cross-platform KPIs and health.
- **Platform Pulse:** Real-time ecosystem intelligence dashboard at `/pulse` showing animated constellation of all 16 platform apps, live agent neural mesh activity, cross-domain intelligence flow visualization, domain health matrix, and animated platform metrics (16 apps, 446 DB tables, 1,618+ endpoints, 12 active agents, 9 domains).
- **Commercialization:** Includes dedicated pages for commercial packaging (`/packages`), ROI calculation (`/roi`), and relief-based messaging (`/relief`).

## Financial Compliance & CRM Intelligence Infrastructure (Task #486)
- **New Financial Data Adapters** (`lib/services/src/adapters/`): `edgar.ts` (SEC EDGAR XBRL/FilingsAPI, no key required), `fred.ts` (FRED economic indicators, `FRED_API_KEY`), `market-data.ts` (Alpha Vantage / Polygon.io with auto-provider detection). All adapters fall back to realistic demo data when API keys are absent.
- **Compliance DB Schema** (`lib/db/src/schema/compliance.ts`): 5 new tables — `compliance_suitability` (Reg BI suitability docs), `compliance_archival` (Rule 17a-4 immutable write-once with SHA-256 hash chains), `compliance_supervision_queue` (supervision workflow), `compliance_calendar` (Form ADV/CRS/exam deadlines), `compliance_risk_scores`.
- **Compliance API** (`artifacts/api-server/src/routes/compliance.ts`): Full CRUD for suitability (with approve/reject review workflow), archival (hash-chained immutable entries), supervision queue (escalate/resolve/assign actions), compliance calendar, market-context, and intelligence-fusion endpoints. Mounted at `/compliance/*`.
- **CRM API** (`artifacts/api-server/src/routes/crm.ts`): Routes for `/salesforce/opportunities`, `/salesforce/accounts`, `/salesforce/leads`, `/hubspot/deals`, `/hubspot/contacts`, `/dynamics/opportunities`, and `/crm/sync/:type` (bidirectional sync trigger). All routes return realistic demo data when live CRM APIs are not configured.
- **Firestorm SEC/FINRA Compliance Page** (`artifacts/firestorm/src/pages/compliance/financial-compliance.tsx`): 5-tab command page — Compliance Posture (score gauges), Supervision Queue (action buttons), Compliance Calendar (regulatory deadlines), Rule 17a-4 Archival panel, Intelligence Fusion (market × CRM × compliance cross-domain insights). Accessible at `/cr/financial-compliance` with nav item added.
- **SZL Holdings CRM Intelligence Dashboard** (`artifacts/szl-holdings/src/pages/crm-intelligence.tsx`): Unified pipeline across Salesforce/HubSpot/Dynamics 365 (4 tabs: Pipeline, Accounts, Leads, Sync Status). Accessible at `/crm-intelligence`.
- **ServiceRegistry** updated with `secEdgar`, `fred`, `marketData` adapters in properties, constructor, and adapters health array.

## Ecosystem Audit Notes (Task #474)
- All 9 web app Vite configs have `process.env.GOMAXPROCS = "2"` (limits esbuild threads per process) and `optimizeDeps.holdUntilCrawlEnd: true` to prevent OS thread exhaustion when 18+ dev servers run simultaneously.
- `artifacts/alloy-mobile/` (ghost directory — only node_modules, no source) removed.
- `artifacts/forge/` and `artifacts/inca-lab/` (unregistered dev experiments) removed.
- All 7 Expo mobile apps standardized to `expo-notifications ~0.32.16` and `expo-device ~8.0.10`.
- `artifacts/api-server/src/lib/startup-validation.ts` hardened: replaced `require("crypto")` with ESM `import { randomBytes }`, production now errors on missing/short `ALLOY_INTERNAL_TOKEN`.
- `artifacts/api-server/src/lib/distribution-os-migrations.ts` created to apply `next_follow_up` column to `dos_leads` table (schema-to-DB drift fix).
- `.npmrc` updated to use `${NODE_AUTH_TOKEN:-}` (empty fallback) to suppress NODE_AUTH_TOKEN warning when not set.

## Ecosystem Gap Closure (Task #502)
- Orphaned directories physically deleted: `artifacts/alloy-mobile/`, `artifacts/forge/`, `artifacts/inca-lab/` (all had no package.json or source code; content was previously merged into existing apps).
- Orphaned `artifacts/forge: web` workflow removed — only 16 workflows remain (none auto-started, all on-demand).
- `.npmrc` simplified: removed `@szl-holdings:registry=https://npm.pkg.github.com` — all `@szl-holdings/*` packages are workspace-local; registry line was triggering NODE_AUTH_TOKEN auth warnings.
- Sentry DSN missing fallback changed from `console.warn` to `console.debug` in `lib/observability/src/react/sentry.ts` to reduce noise (Sentry without DSN is expected in dev).
- Database schema dead table audit: 88 schema files, 577 total table definitions, 462 with direct api-server references, 115 with no direct references documented in `docs/schema-audit-2025-04.md`.
- Post-merge integration verified: A2A (`/a2a`), RAG Knowledge (`/rag`), Connector Hub (`/connector-hub`), and Nuro Mesh (`/nuro-mesh`) routes are all registered in routes/index.ts with source files present.
- PRISM Counsel (`artifacts/prism-counsel`) verified working: full source tree with `prism-counsel-app.tsx`, pages, components, hooks, lib directories — no App.tsx needed, uses direct main.tsx entry.
- All 7 mobile apps already had correct package versions: expo-notifications ~0.32.16, @types/react ~19.1.10, @types/react-dom ~19.1.7.
- SZL Holdings web app confirmed loading cleanly with no unexpected browser console errors.

## External Dependencies
- **Database:** PostgreSQL
- **Authentication:** Replit Auth
- **Payment Processing:** Stripe
- **AI/NLP:** HuggingFace Inference API, Replit's OpenAI proxy, OpenAI, Anthropic, Elevenlabs (for voice synthesis)
- **Communication:** Slack, Twilio, Resend (for email)
- **Productivity/Collaboration:** Google APIs, Notion, Confluence, HubSpot, Dropbox, OneDrive
- **Analytics:** Plausible, Posthog
- **Government Data Feeds:** CISA KEV, NVD CVE, MITRE ATT&CK, FedRAMP, Census Bureau ACS, BLS Construction Employment, FEMA NRI, USAspending.gov, NOAA, arXiv, Semantic Scholar, PapersWithCode, HuggingFace Hub, SEC EDGAR, NYC Open Data, FRED, HUD Fair Market Rents
- **Maritime Data:** Digitraffic AIS, BarentsWatch AIS, Open-Meteo Marine Weather API
- **Threat Intelligence:** Shodan InternetDB, GreyNoise Community API, MalwareBazaar, URLhaus
- **Other:** GitHub Public API, AbuseIPDB, Figma