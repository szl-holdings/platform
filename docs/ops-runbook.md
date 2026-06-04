# SZL Holdings — Operations Runbook & Architecture Guide

**Version:** 1.0  
**Date:** April 2026  
**Audience:** Engineers, operators, and on-call responders  
**Scope:** Internal operations reference — not user-facing documentation

---

## Table of Contents

1. [Ecosystem Overview](#1-ecosystem-overview)
2. [Application Registry](#2-application-registry)
3. [Architecture](#3-architecture)
4. [Shared Libraries](#4-shared-libraries)
5. [Environment Variable Reference](#5-environment-variable-reference)
6. [Health & Monitoring](#6-health--monitoring)
7. [Common Failure Modes & Recovery](#7-common-failure-modes--recovery)

---

## 1. Ecosystem Overview

SZL Holdings is a pnpm monorepo containing a unified ecosystem of command-grade platforms. Every platform shares one API server, one database, one design system, and one authentication model.

**Monorepo layout:**

```
/
├── artifacts/          # Deployable apps (web + mobile) + dev sandboxes
├── lib/                # ~30 shared TypeScript packages
├── scripts/            # QA, seeding, backup, and migration scripts
├── docs/               # All operator and architecture documentation
└── packages/           # Utility packages (if any)
```

**Platform layers:**

| Layer | Platforms |
|-------|-----------|
| Observe / Decide / Act | Lyte, Aegis, Terra, Vessels |
| Execute | Alloy (embedded in API server) |
| Advise | Carlota Jo, PRISM Counsel |
| Strategic Command | Imperium, Command Portal |
| Corporate / Personal | SZL Holdings, Stephen Lutar |

---

## 2. Application Registry

> **Terminology note:** The `.replit` file registers only two artifacts under `[[artifacts]]`: `artifacts/api-server` and `artifacts/mockup-sandbox`. All other web and mobile apps are managed as **Replit Workflows** (visible in the Replit workflow panel) — they are not in `.replit` `[[artifacts]]` but are still served via the platform's path-based routing. The term "app" below means a workflow-managed deployable unit, not a `.replit` artifact registration.

### Web Applications

#### `artifacts/szl-holdings` — SZL Holdings Dashboard
- **Preview path:** `/`
- **Purpose:** Investor and venture intelligence platform. Serves as the public/corporate face of SZL Holdings with portfolio health radar, cap table management, fund operations, and LP reporting.
- **Users:** Investors, fund managers, venture partners, design partners.
- **Key dependencies:** `@szl-holdings/db`, `@szl-holdings/shared-ui`, `@szl-holdings/api-zod`, `@szl-holdings/prism-bus`.

#### `artifacts/aegis` — Aegis — Unified Defense & Intelligence Command
- **Preview path:** `/aegis/`
- **Purpose:** SOC operations and autonomous cyber defense platform. Provides three unified workspaces: Defense (threat response, SOAR playbooks, deception grids), Command (managed services operations), and Intelligence (AI model governance, INCA analytics). Includes the Citadel crisis command war room.
- **Users:** CISOs, SOC analysts, managed security providers, compliance officers.
- **Key dependencies:** `@szl-holdings/ai-engine`, `@szl-holdings/intelligence-feeds`, `@szl-holdings/forge-runtime`, `@szl-holdings/proof-chain`, `@szl-holdings/shared-ui`.

#### `artifacts/terra` — Terra — Real Estate Intelligence
- **Preview path:** `/terra/`
- **Purpose:** Property intelligence for NYC brokers, investors, and portfolio managers. Surfaces distressed properties via AI scoring, tracks ownership structures, manages deal pipelines, and provides zoning and climate risk analysis.
- **Users:** Real estate brokers, institutional investors, portfolio managers.
- **Key dependencies:** `@szl-holdings/db`, `@szl-holdings/intelligence-feeds`, `@szl-holdings/monte-carlo`, `@szl-holdings/shared-ui`.

#### `artifacts/vessels` — Vessels Maritime Intelligence
- **Preview path:** `/vessels/`
- **Purpose:** Fleet command for maritime operators. Real-time AIS telemetry, voyage economics (fuel, P&L), dark vessel detection, sanctions screening, and digital twin per vessel.
- **Users:** Fleet executives, maritime operations teams, commercial directors, insurers.
- **Key dependencies:** `@szl-holdings/db`, `@szl-holdings/intelligence-feeds`, `@szl-holdings/worldline`, `@szl-holdings/shared-ui`.

#### `artifacts/carlota-jo` — Carlota Jo Consulting
- **Preview path:** `/carlota-jo/`
- **Purpose:** Premium advisory and strategic consulting platform. Provides strategic diagnostic engine, secure client portal, scenario simulator, and consulting OS for boutique advisory firms.
- **Users:** Consultants, boutique advisory firms, and their clients.
- **Key dependencies:** `@szl-holdings/ai-engine`, `@szl-holdings/shared-ui`, `@szl-holdings/db`.

#### `artifacts/command` — Ecosystem Command Portal
- **Preview path:** `/command/`
- **Purpose:** Central portal for ecosystem-wide management, cross-platform orchestration, and marketing. Acts as the internal operating system for the SZL ecosystem with simulation tools, briefing capabilities, and Cortex Voice AI assistant.
- **Users:** Internal administrators, ecosystem operators, prospective clients.
- **Key dependencies:** `@szl-holdings/shared-ui`, `@szl-holdings/prism-bus`.

#### `artifacts/api-server` — API Server
- **Preview path:** `/api/`
- **Purpose:** Centralized Express API server backing all platform frontends. Handles all authentication, business logic, data access, AI orchestration, and real-time WebSocket connections for the entire ecosystem.
- **Users:** All web and mobile frontends (internal service, not user-facing).
- **Key dependencies:** `@szl-holdings/db`, `@szl-holdings/auth`, `@szl-holdings/ai-engine`, `@szl-holdings/forge-runtime`, `@szl-holdings/observability`, `@szl-holdings/services`.

#### `artifacts/mockup-sandbox` — Component Preview Server
- **Preview path:** `/__mockup`
- **Purpose:** Design sandbox for iterating on shared UI components in isolation. Not a user-facing product.
- **Users:** Internal — design and frontend engineers only.
- **Key dependencies:** `@szl-holdings/shared-ui`.

---

### Unregistered Artifact Directories

The following directories exist under `artifacts/` but are **not registered as deployed artifacts**. They are development sandboxes or work-in-progress products:

| Directory | Notes |
|-----------|-------|
| `artifacts/partner-portal` | In-progress partner/channel portal |
| `artifacts/alloy-mobile` | Mobile companion for Alloy (not yet deployed) |
| `artifacts/cortex-mobile` | Cortex mobile app (`@workspace/cortex-mobile`) — WIP, no workflow configured |
| `artifacts/forge` | Internal forge/build tooling workspace |
| `artifacts/nexus` | Internal nexus integration/platform workspace |
| `artifacts/inca-lab` | Intelligence and analytics lab (Aegis research) |

---

### Mobile Applications (Expo / React Native)

| App | Preview Path | Platform counterpart | Users |
|-----|-------------|----------------------|-------|
| `artifacts/lyte-mobile` — Lyte Mobile — AIOps Command | `/lyte-mobile/` | Lyte Command Center | Ops leaders, executives |
| `artifacts/aegis-mobile` — Aegis Mobile — SOC Command Center | `/aegis-mobile/` | Firestorm (Aegis) | SOC analysts, CISOs |
| `artifacts/terra-mobile` — Terra Mobile — Field Intelligence | `/terra-mobile/` | Terra | Brokers, investors (field) |
| `artifacts/vessels-mobile` — Vessels — Fleet Command Mobile | `/vessels-mobile/` | Vessels | Fleet officers, port ops |
| `artifacts/carlota-jo-mobile` — Carlota Jo — Client App | `/carlota-jo-mobile/` | Carlota Jo | Advisory clients |
| `artifacts/szl-holdings-mobile` — SZL Holdings — Executive Command | `/szl-holdings-mobile/` | SZL Holdings | Investors, executives |
| `artifacts/stephen-mobile` — Stephen — Personal Command | `/stephen-mobile/` | Stephen Site | Stephen (personal) |

All mobile apps depend on `@szl-holdings/mobile-shared` (verified across lyte-mobile, aegis-mobile, terra-mobile, vessels-mobile, carlota-jo-mobile, szl-holdings-mobile, stephen-mobile package.json). `@szl-holdings/offline-engine` is available in lib/ but is **not** a universal mobile dependency — check individual app package.json files for current dependency declarations. API access is via `EXPO_PUBLIC_API_URL` which should point to the API server's base URL.

---

## 3. Architecture

### System Topology

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENTS                                                        │
│  Web (Vite + React)          Mobile (Expo + React Native)       │
│  szl-holdings  aegis         lyte-mobile  aegis-mobile          │
│  terra         vessels       terra-mobile vessels-mobile        │
│  carlota-jo    command       szl-mobile                         │
│  _(5 archived surfaces — see ops/frontier/disposition-matrix)_  │
└──────────────────┬──────────────────────┬───────────────────────┘
                   │  REST/JSON           │  REST/JSON
                   │  GraphQL             │  (EXPO_PUBLIC_API_URL)
                   ▼                      ▼
┌────────────────────────────────────────────────────────────────┐
│  API SERVER  (artifacts/api-server)                            │
│  Express 5 · TypeScript · pino logging                        │
│                                                                │
│  Global middleware (applied to all routes, in order):         │
│    correlationMiddleware → apiVersionMiddleware → helmet →    │
│    CORS → compression → globalLimiter → telemetryMiddleware → │
│    pinoHttp → cookieParser → JSON/urlencoded body → CSRF →   │
│    authMiddleware (session hydrator) → sessionRefreshPolicy   │
│                                                               │
│  /api prefix only: etagMiddleware (optimistic concurrency)    │
│  Note: /api/health*, /api/docs, /api/csrf-token are          │
│  registered before etagMiddleware and are not affected.       │
│                                                                │
│  Key route groups:                                             │
│    /api/auth          — Sessions, OIDC, WebSocket tickets      │
│    /api/alloy         — Workflow engine, approvals, audit      │
│    /api/aegis         — SOC/security ops (Aegis) [primary]     │
│    /api/firestorm     — Backward-compat alias → /api/aegis     │
│    /api/terra         — Property intelligence + CRM            │
│    /api/vessels       — Fleet tracking + maritime ops          │
│    /api/ai            — AI tool execution                      │
│    /api/intelligence  — External intel feeds                   │
│    /api/storage       — Object storage / file management       │
│    /api/billing       — Stripe billing operations              │
│    /api/admin         — Backup, tenant provisioning (guarded)  │
│    /api/notifications — Push notifications                     │
│    /api/graphql       — GraphQL endpoint (Apollo)              │
│    /api/health        — System health checks                   │
│    /api/docs          — Swagger UI (OpenAPI spec)              │
└──────────────┬─────────────────────────┬───────────────────────┘
               │                         │
               ▼                         ▼
┌──────────────────────┐    ┌────────────────────────────────────┐
│  PostgreSQL (Drizzle)│    │  External Services                 │
│  @szl-holdings/db    │    │  • AI providers (OpenAI, Anthropic,│
│                      │    │    Gemini) via Replit AI proxy     │
│  Schema domains:     │    │  • Stripe (billing)                │
│  • auth / sessions   │    │  • Resend / SMTP (email)           │
│  • organizations     │    │  • AIS feeds (maritime)            │
│  • alloy (workflows) │    │  • Legal data (CourtListener)      │
│  • vessels           │    │  • Mapbox / Google Maps            │
│  • projects          │    │  • Slack / Teams / Twilio          │
│  • audit logs        │    │  • Object storage (Replit / Azure) │
└──────────────────────┘    └────────────────────────────────────┘
```

### Authentication Flow

All platforms share a single DB-backed session model managed by the API server:

1. User authenticates via `POST /api/auth/login` (Replit OIDC) or `POST /api/auth/login-password` (email/password).
2. On success, a session record is written to the database. The session token (an opaque random identifier) is set on the client as a plain `sid` cookie — this cookie is **not** signed via cookie-parser. `SESSION_SECRET` is used elsewhere: as an encryption key in `lib/crypto.ts` and as the HMAC secret for WebSocket ticket signing in `lib/websocket.ts`.
3. On every subsequent request, the global `authMiddleware` (in `middlewares/authMiddleware.ts`) acts as a **session hydrator, not an enforcer**. It reads the token from the `sid` cookie or `Authorization: Bearer` header via `getSessionToken(req)`, looks up the session record in the database via `getSessionUser(token)`, and populates `req.oidcUser` and `req.user`. Requests without a valid token proceed as unauthenticated — no rejection at this layer.
4. Route-level access control is enforced by a separate `requireAuth()` / `authMiddleware()` helper from `middlewares/auth.ts`, applied per-route with `required: true` and role checks.
5. WebSocket connections use short-lived HMAC-signed tickets issued by `POST /api/auth/ws-ticket`. The HMAC key is `SESSION_SECRET` (with an ephemeral per-process fallback if `SESSION_SECRET` is unset — **not production-safe**).
6. CSRF protection is enforced for all mutating requests via the `csrf_token` cookie (double-submit pattern).

### Multi-Tenancy

Data is scoped to `organizations`. Users belong to one or more organizations via `org_members` (with roles: `owner`, `admin`, `member`, `viewer`). The `tenantScope` middleware is applied selectively to route groups that require org context — currently: `/api/audit`, `/api/jobs`, `/api/comments`, `/api/documents`, `/api/exports`, `/api/orgs`. Most domain routes (e.g., Alloy, Firestorm, Terra, Vessels) enforce org scope internally within their route handlers rather than via the global middleware. See `artifacts/api-server/src/routes/index.ts` for the current applied set.

### Real-Time

WebSocket connections are authenticated via HMAC-signed tickets. Per-channel access control is enforced. Live feeds power Firestorm alerts, Vessels AIS updates, and Lyte PRISM signals.

---

## 4. Shared Libraries

All shared packages live in `lib/` and are scoped to `@szl-holdings/*` or `@workspace/*`.

### Core Infrastructure

| Package | Purpose |
|---------|---------|
| `@szl-holdings/db` | Drizzle ORM + PostgreSQL schema. Exports: `.` (db client + pool), `./schema`, `./schema/canonical` |
| `@szl-holdings/auth` | Session management, OIDC logic, RBAC helpers |
| `@szl-holdings/config` | Centralized environment configuration with validation |
| `@szl-holdings/observability` | Pino logging, server telemetry snapshots, analytics. Exports: `.`, `./react`, `./configs`, `./analytics` |
| `@szl-holdings/api-spec` | OpenAPI specification (`openapi.yaml`). Served at `/api/docs` |
| `@szl-holdings/api-zod` | Zod validation schemas derived from the OpenAPI spec |
| `@szl-holdings/services` | Business logic layer and external service connectors |
| `@szl-holdings/forge-runtime` | Durable job queue, worker scheduling, execution runtime |

### UI & Frontend

| Package | Purpose |
|---------|---------|
| `@szl-holdings/shared-ui` | Design system: components, tokens, animations. Exports: `.`, `./design-system`, `./tokens`, `./animations`, `./components` |
| `@szl-holdings/mobile-shared` | React Native shared components and hooks. Exports: `.`, `./components`, `./hooks`, `./notifications` |
| `@szl-holdings/graphql-client` | Apollo GraphQL client, provider, and generated hooks |
| `@workspace/object-storage-web` | Web file upload utilities (Uppy-based) |
| `@szl-holdings/i18n` | Internationalization and date/number formatting |

### Domain Engines

| Package | Purpose |
|---------|---------|
| `@szl-holdings/ai-engine` | AI agent orchestration, Nuro Mesh architecture, skill registry |
| `@szl-holdings/prism-bus` | Event bus for intra-platform communication. Exports: `.`, `./context`, `./connectors`, `./bus`, `./hooks` |
| `@szl-holdings/worldline` | Timeline and event sequencing engine (Vessels, Terra) |
| `@szl-holdings/proof-chain` | Verifiable, immutable audit trail generation |
| `@szl-holdings/receipt-graph` | Graph-based receipt and evidence tracking (PRISM Counsel) |
| `@szl-holdings/monte-carlo` | Probabilistic simulation and risk analysis (Terra) |
| `@szl-holdings/covenant-policy` | Policy rules and enforcement engine (PRISM Counsel) |
| `@szl-holdings/outcome-graph` | Outcome dependency graph and impact modeling |
| `@szl-holdings/intelligence-feeds` | External data source adapters: AIS, STIX/TAXII, legal records |
| `@szl-holdings/offline-engine` | Offline support for mobile: storage, command queue, delta sync |
| `@szl-holdings/mcp-client` | Model Context Protocol (MCP) client |
| `@szl-holdings/crdt-sync` | Conflict-free replicated data types for collaborative editing |

### AI Provider Integrations

| Package | Provider |
|---------|----------|
| `@szl-holdings/integrations-openai-ai-server` | OpenAI (via Replit AI proxy by default) |
| `@szl-holdings/integrations-anthropic-ai` | Anthropic Claude (via Replit AI proxy by default) |
| `@szl-holdings/integrations-gemini-ai` | Google Gemini (via Replit AI proxy by default) |

---

## 5. Environment Variable Reference

All secrets are managed via Replit Secrets (development) and Azure Key Vault (production). **Never commit secrets to source control.**

### Critical — Required for All Environments

| Variable | Description | Notes |
|----------|-------------|-------|
| `DATABASE_URL` | PostgreSQL connection string | Provisioned automatically by Replit |
| `SECRET_ENCRYPTION_KEY` | **Primary** encryption key used by `lib/crypto.ts` for all symmetric encryption operations | Set this in production; if absent, crypto.ts falls back to a key derived from `SESSION_SECRET` |
| `SESSION_SECRET` | Fallback encryption key (used when `SECRET_ENCRYPTION_KEY` is absent) and HMAC key for WebSocket ticket signing | Required in production — if unset, WS tickets use an ephemeral per-process key; health reports `auth: "missing_secret"` |
| `NODE_ENV` | Runtime environment (`development` / `production`) | Set automatically in Replit deploys |
| `PORT` | Server port | Assigned automatically per artifact by Replit |

### Authentication & Security

| Variable | Description | Default / Notes |
|----------|-------------|-----------------|
| `ISSUER_URL` | OIDC issuer URL | `https://replit.com/oidc` |
| `AUTH_PROVIDER_URL` | OIDC provider discovery URL (alternative to `ISSUER_URL`) | Optional |
| `AUTH_PROVIDER_KEY` | OIDC client secret or API key for auth provider | Optional |
| `REPL_ID` | Replit deployment REPL_ID — used as OIDC client ID | Provided automatically by Replit |
| `OAUTH_STATE_SECRET` | Signs OAuth state parameters (auto-generated per-session if unset) | Set in Replit secrets for production |
| `SERVICE_ROLE_KEY` | Internal service role key for machine-to-machine calls (admin bypass) | Used for internal server-to-server requests |
| `ALLOY_INTERNAL_TOKEN` | Internal admin token for AlloyChat admin context (enables privileged agent access) | Also used by `/api/health/detailed` `X-Internal-Token` check — must be 32+ chars |
| `SESSION_TTL_MS` | Session TTL in milliseconds | Default: 604800000 (7 days) |
| `CORS_ORIGINS` | Comma-separated allowed origins (wildcard patterns supported) | **Must be set in production** — unset causes all credentialed cross-origin requests to fail |
| `REPLIT_DEV_DOMAIN` | Replit dev proxy domain | Provided automatically; used by mobile apps to construct API + WebSocket URLs |
| `PUBLIC_APP_URL` | Public-facing application URL | Used for OIDC redirects and email links |
| `APP_ENV` | Application environment label | `staging` / `production` / `demo` |
| `DEMO_MODE` | Enable demo mode | `true` mocks external services and disables destructive operations |

### Azure AD Authentication (Enterprise — Optional)

| Variable | Description |
|----------|-------------|
| `AZURE_AD_TENANT_ID` | Azure AD tenant ID for M365 integration |
| `AZURE_AD_CLIENT_ID` | Azure AD app client ID |
| `AZURE_AD_CLIENT_SECRET` | Azure AD app client secret |

### Database Pool Tuning (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_POOL_MIN` | `2` | Minimum connections in the pool |
| `DB_POOL_MAX` | `10` | Maximum connections in the pool |
| `DB_CONNECT_TIMEOUT_MS` | `5000` | Connection acquisition timeout |
| `DB_IDLE_TIMEOUT_MS` | `30000` | Idle connection release timeout |
| `DB_STATEMENT_TIMEOUT_MS` | `10000` | Per-statement execution timeout |
| `SLOW_QUERY_THRESHOLD_MS` | `500` | Threshold for slow query logging |

### AI Integrations

The API server checks for `AI_INTEGRATIONS_OPENAI_BASE_URL || OPENAI_API_KEY` to determine if AI is configured.

| Variable | Description | Notes |
|----------|-------------|-------|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API key (Replit proxy) | Primary AI provider |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI API base URL | Set to Replit proxy URL in dev |
| `OPENAI_API_KEY` | OpenAI API key (direct — fallback) | Used if `AI_INTEGRATIONS_OPENAI_API_KEY` is absent |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Anthropic API key (Replit proxy) | Optional — OpenAI is primary |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | Anthropic API base URL | Set to Replit proxy URL in dev |
| `ANTHROPIC_API_KEY` | Anthropic API key (direct — fallback) | Used if proxy key is absent |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Gemini API key (Replit proxy) | Optional |
| `AI_INTEGRATIONS_GEMINI_BASE_URL` | Gemini API base URL | Set to Replit proxy URL in dev |
| `AI_EXECUTION_MODE` | Controls AI execution autonomy | `propose_only` (default) — AI recommends, humans confirm |
| `ELEVENLABS_API_KEY` | ElevenLabs voice generation | Optional — voice asset features disabled if absent |

### Email

| Variable | Service | Required |
|----------|---------|---------|
| `RESEND_API_KEY` | Resend (primary email provider) | Optional — graceful fallback |
| `SENDGRID_API_KEY` | SendGrid (alternative email) | Optional — used if Resend absent |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | SMTP fallback | Optional |
| `SMTP_FROM` | Sender address for SMTP | Optional |
| `SZL_INTERNAL_EMAIL` | Internal team notification address | Optional |
| `STEPHEN_ADMIN_EMAIL` | Admin notifications for Stephen site | Optional |
| `CARLOTA_ADMIN_EMAIL` | Admin notifications for Carlota Jo | Optional |

### Payments — Stripe

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (server-side) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (client-side) |
| `STRIPE_WEBHOOK_SECRET` | Validates incoming Stripe webhooks |
| `STRIPE_PRICE_STRATEGY_SESSION` | Carlota Jo — Strategy Session |
| `STRIPE_PRICE_PORTFOLIO_REVIEW` | Carlota Jo — Portfolio Review |
| `STRIPE_PRICE_ADVISORY_RETAINER` | Carlota Jo — Advisory Retainer |
| `STRIPE_PRICE_TERRA_STARTER_MONTHLY` | Terra — Starter (Monthly) |
| `STRIPE_PRICE_TERRA_STARTER_ANNUAL` | Terra — Starter (Annual) |
| `STRIPE_PRICE_TERRA_PRO_MONTHLY` | Terra — Pro (Monthly) |
| `STRIPE_PRICE_TERRA_PRO_ANNUAL` | Terra — Pro (Annual) |
| `STRIPE_PRICE_TERRA_ENTERPRISE_MONTHLY` | Terra — Enterprise (Monthly) |
| `STRIPE_PRICE_TERRA_ENTERPRISE_ANNUAL` | Terra — Enterprise (Annual) |
| `STRIPE_PRICE_FIRESTORM_ENTERPRISE` | Aegis/Firestorm — Enterprise |
| `STRIPE_PRICE_COMMAND_PRO_MONTHLY` | Command — Pro (Monthly) |
| `STRIPE_PRICE_COMMAND_PRO_ANNUAL` | Command — Pro (Annual) |

Source: `artifacts/api-server/src/routes/billing.ts`. All Stripe vars are optional — billing features degrade gracefully when absent.

### Third-Party Data & Map Services

| Variable | Service | Impact if Missing |
|----------|---------|-------------------|
| `MAPBOX_ACCESS_TOKEN` | Mapbox (Terra property maps, Vessels fleet map) | Map views unavailable |
| `MARINE_TRAFFIC_API_KEY` | Marine Traffic AIS feed | Supplemental maritime data unavailable |
| `AIS_API_KEY` | Direct AIS data feed | Live vessel tracking unavailable |
| `WEATHER_API_KEY` | Weather data | Weather overlays unavailable |
| `COURTLISTENER_API_TOKEN` | CourtListener legal case data | Court data enrichment unavailable |

### Notifications

| Variable | Service | Notes |
|----------|---------|-------|
| `SLACK_WEBHOOK_URL` | Slack incoming webhook | Optional |
| `SLACK_BOT_TOKEN` | Slack bot token | Optional |
| `SLACK_ALERT_CHANNEL` | Target Slack channel for alerts | Default: `alerts` |
| `MICROSOFT_TEAMS_WEBHOOK_URL` | Teams incoming webhook | Optional |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Twilio SMS | Optional |
| `TWILIO_PHONE_NUMBER` | Sender phone number for Twilio | Optional |
| `VAPID_PUBLIC_KEY` | Web Push VAPID public key | Required for browser push notifications — if absent, push is disabled |
| `VAPID_PRIVATE_KEY` | Web Push VAPID private key | Required for browser push notifications |
| `VAPID_SUBJECT` | VAPID contact email | Default: `mailto:platform@szlholdings.com` |

### Cloud Object Storage

| Variable | Description | Notes |
|----------|-------------|-------|
| `OBJECT_STORAGE_BUCKET_ID` | Storage status key checked by `/api/health` | If absent, health reports `storage: "demo"`. Note: distinct from `DEFAULT_OBJECT_STORAGE_BUCKET_ID` below. |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | Replit GCS object storage bucket ID | Set automatically by Replit App Storage provisioning; used by the storage library for read/write operations |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Comma-separated GCS paths for public asset serving | Set by App Storage provisioning |
| `PRIVATE_OBJECT_DIR` | GCS path prefix for private object uploads | Set by App Storage provisioning |
| `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` | S3-compatible credentials | Alternative to Replit storage (AWS, Cloudflare R2) |
| `STORAGE_BUCKET` | S3 bucket name | Default: `szl-holdings-files` |
| `STORAGE_ENDPOINT` | S3-compatible endpoint URL | e.g., `https://s3.amazonaws.com` |

### Error Reporting & Observability

| Variable | Service | Notes |
|----------|---------|-------|
| `SENTRY_DSN` | Sentry error reporting | Optional — errors are still logged via pino if absent |

### Google APIs

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Service account JSON key (for server-side API access) |
| `GOOGLE_PROJECT_ID` | Google Cloud project ID |

All Google vars are optional.

### Third-Party Integrations

| Variable | Service |
|----------|---------|
| `NOTION_API_KEY` | Notion integration |
| `HUBSPOT_ACCESS_TOKEN` | HubSpot CRM |
| `GITHUB_TOKEN` | GitHub (dependency auditing, automation) |
| `SALESFORCE_CLIENT_ID` / `SALESFORCE_CLIENT_SECRET` | Salesforce AppExchange |
| `ATLASSIAN_APP_KEY` | Atlassian Connect (Jira integration) |

All optional — features that rely on them degrade or disable gracefully.

### Azure (Enterprise Multi-Tenant Deployments Only)

| Variable | Description |
|----------|-------------|
| `AZURE_APP_INSIGHTS_CONNECTION_STRING` | Azure Application Insights APM |
| `AZURE_KEY_VAULT_URL` | Azure Key Vault for secrets management |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob Storage |
| `AZURE_REDIS_CONNECTION_STRING` | Azure Cache for Redis |
| `AZURE_PG_CONNECTION_STRING` | Azure PostgreSQL Flexible Server |

### Mobile App (Expo — Prefix: `EXPO_PUBLIC_`)

| Variable | Description | Notes |
|----------|-------------|-------|
| `EXPO_PUBLIC_API_URL` | Base URL for API calls from mobile | Required for all mobile apps |
| `EXPO_PUBLIC_DOMAIN` | Domain for WebSocket URL construction | Typically set to `$REPLIT_DEV_DOMAIN` |
| `EXPO_PUBLIC_ENV` | App environment | `development` / `preview` / `production` |

### Web App (Vite — Prefix: `VITE_`)

| Variable | Description | Notes |
|----------|-------------|-------|
| `VITE_PLAUSIBLE_DOMAIN` | Plausible analytics domain | Optional |
| `VITE_APP_URL` | Public URL of the web app | Optional — used for canonical URLs |

### Feature Flags

| Variable | Default | Controls |
|----------|---------|---------|
| `FEATURE_ALLOY_ORCHESTRATION` | `true` | Alloy workflow orchestration subsystem |
| `FEATURE_ALLOY_GOVERNANCE` | `true` | Alloy governance and policy enforcement |
| `FEATURE_ALLOY_WEBHOOKS` | `true` | Alloy outbound webhook delivery |
| `FEATURE_AUDIT_LOGGING` | `true` | Audit log capture across all platforms |
| `ALLOY_WORKFLOW_AUTO_RUN` | `true` | Auto-start workflows on server startup |
| `ALLOY_REQUIRE_APPROVAL_CRITICAL` | `true` | Require human approval for critical operations |
| `ALLOY_MAX_BATCH_SIZE` | `100` | Max items per batch processing run |

### Logging

| Variable | Default | Options |
|----------|---------|---------|
| `LOG_LEVEL` | `info` | `fatal`, `error`, `warn`, `info`, `debug`, `trace` |

---

## 6. Health & Monitoring

### Health Endpoints

| Endpoint | Auth Required | Purpose |
|----------|--------------|---------|
| `GET /api/health/live` | None | Liveness probe — returns 200 if process is running |
| `GET /api/health/ready` | None | Readiness probe — checks database connectivity |
| `GET /api/health` | None | General health — DB, job queue, memory, auth, AI, storage |
| `GET /api/health/detailed` | Session or `X-Internal-Token` header (production only; unrestricted in dev) | Full diagnostics — DB pool, queue depth, telemetry, p95 latency |

**Health response statuses:**
- `healthy` (200) — all systems nominal
- `warning` (200) — degraded performance but serving requests (e.g., job queue backpressure, elevated error rate)
- `degraded` (503) — critical subsystem unreachable (usually database)

### Queue Health

The job queue (via `@szl-holdings/forge-runtime`) reports `pending + running` depth. Depth > 50 triggers `backpressure` status. Check `/api/health/detailed` for queue stats.

### Telemetry

The `@szl-holdings/observability` library tracks p95 latency and error rates. Error rate > 10% triggers `elevated_errors` in the detailed health report.

---

## 7. Common Failure Modes & Recovery

### Minimum On-Call Triage Sequence

When something is broken and you don't know where to start:

1. **Is the API alive?** → `GET /api/health/live` — if 503 or unreachable, see FM-2 (API crash).
2. **Is the database reachable?** → `GET /api/health/ready` — if 503, see FM-1 (database).
3. **Are subsystems degraded?** → `GET /api/health` — check `services` object for `degraded`/`missing_secret`/`not_configured` states.
4. **Is it a build/startup failure?** → Check workflow logs in Replit for `Error:` on startup — see FM-3.
5. **Is it an auth issue?** → Users can't log in or get 401s everywhere — see FM-4.
6. **Is it a specific feature?** → AI broken → FM-5, uploads failing → FM-8, mobile can't connect → FM-7, CORS errors → FM-10.

---

### FM-1: Database Unreachable

**Symptoms:** `GET /api/health/ready` returns 503. All data reads/writes fail. API returns 500 errors across all routes.

**Likely causes:**
- `DATABASE_URL` is not set or is incorrect.
- Replit's managed PostgreSQL is temporarily unavailable.
- Connection pool exhausted (high traffic or connection leak).

**Recovery steps:**
1. Check `/api/health` — confirm `services.database.status` is `degraded`.
2. Verify `DATABASE_URL` is set in Replit Secrets.
3. Check Replit's database status page for platform incidents.
4. If pool exhaustion is suspected, restart the API server workflow — this resets the connection pool.
5. For connection leaks, check `/api/health/detailed` — the `details` field shows `total=N idle=N waiting=N`. If `waiting` is high and `idle` is 0, the pool is exhausted.
6. Run a manual health check: `node -e "const {db} = require('@szl-holdings/db'); db.execute('SELECT 1').then(console.log)"`.

**Restore from backup (last resort):**
```bash
# Stop traffic, then restore from latest daily backup
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
gunzip -c backups/daily_<timestamp>.sql.gz | psql "$DATABASE_URL"
```
See `docs/disaster-recovery.md` for the full restore playbook.

---

### FM-2: API Server Workflow Crash / Not Starting

**Symptoms:** All frontends show network errors. `/api/health/live` is unreachable.

**Likely causes:**
- Syntax or runtime error introduced during a recent change.
- Missing required environment variable causing crash on startup.
- Port conflict (another process bound to the same port).

**Recovery steps:**
1. Check workflow logs via the Replit workflow panel.
2. Look for `Error:` or `Cannot find module` at startup.
3. If a missing env var, set it in Replit Secrets and restart the workflow.
4. If a code error, revert the most recent change or fix the error and restart.
5. Restart the workflow — this is always safe to do. The API server has no in-memory state that cannot be reconstructed.

**Quick check for missing env vars:** The `/api/health` endpoint reports `services.auth.status: "missing_secret"` when `SESSION_SECRET` is absent.

---

### FM-3: Build Failure (TypeScript / Vite)

**Symptoms:** A web artifact workflow fails to start after changes. The Vite dev server exits immediately.

**Likely causes:**
- TypeScript type error introduced in a shared library (changes to `lib/` affect all consumers).
- Import path error (wrong package name or missing export).
- Version mismatch between a shared library and an artifact.

**Recovery steps:**
1. Run `pnpm typecheck` from the workspace root to see all type errors across the monorepo.
2. For a specific artifact: `pnpm --filter <artifact-name> run typecheck`.
3. If the error is in a shared library (`lib/`), rebuild it: `pnpm --filter @szl-holdings/<lib-name> run build`.
4. TypeScript project references must be built in dependency order. Running `pnpm run typecheck:libs` (which runs `tsc --build`) handles this.
5. If the error is a missing export from a shared library, check that the `exports` field in that library's `package.json` includes the intended entry point.

---

### FM-4: Authentication Broken — Users Cannot Log In

**Symptoms:** Login redirects fail, `/api/auth/me` returns 401, or sessions expire immediately after login.

**Likely causes:**
- `SESSION_SECRET` is missing, rotated, or different between server restarts.
- `ISSUER_URL` is incorrect (OIDC issuer mismatch).
- `CORS_ORIGINS` is misconfigured in production, blocking cookie sending.
- Session cookie `sameSite` or `secure` flags are incompatible with the deployment domain.

**Recovery steps:**
1. Verify `SESSION_SECRET` is set in Replit Secrets and has not changed.
2. Verify `ISSUER_URL` is `https://replit.com/oidc` (default) or the correct OIDC provider URL.
3. In production, ensure `CORS_ORIGINS` includes the frontend domain(s) exactly (no trailing slash issues, wildcard patterns supported).
4. Check `GET /api/health` — `services.auth.status` should be `"configured"`, not `"missing_secret"`.
5. Note: rotating `SESSION_SECRET` does **not** invalidate existing DB-backed sessions (which are plain opaque tokens stored in the database, not cryptographically bound to `SESSION_SECRET`). However, all in-flight WebSocket tickets will be immediately invalidated (new tickets will be signed with the new key). To force all users to re-authenticate, delete all rows from the `sessions` table.

---

### FM-5: AI Features Not Working

**Symptoms:** AI recommendations, copilot features, or agent responses return errors or are absent. Console shows `AI not configured` or 500s from `/api/ai`.

**Likely causes:**
- AI provider environment variables are not set.
- Replit AI proxy is temporarily unavailable.
- `AI_EXECUTION_MODE` is misconfigured.

**Recovery steps:**
1. Check `/api/health` — `services.ai.status` should be `"configured"`.
2. If `"not_configured"`: set `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` in Replit Secrets (use the Replit AI proxy values).
3. If configured but failing: test the provider connection directly from the API server console.
4. Anthropic and Gemini are optional AI providers — the system falls back to OpenAI. Ensure OpenAI is configured first.
5. The `AI_EXECUTION_MODE=propose_only` flag prevents autonomous execution. AI will surface recommendations but will not execute actions without explicit human confirmation — this is the intended default.

---

### FM-6: Job Queue Backpressure

**Symptoms:** `/api/health` shows `services.job_queue.status: "backpressure"`. Background jobs (workflow runs, AI analysis, batch processing) are slow or stuck.

**Likely causes:**
- A large batch of jobs was enqueued simultaneously.
- A worker is blocked or crashing on a specific job type.
- Database is slow, causing jobs to take longer than normal.

**Recovery steps:**
1. Check `/api/health/detailed` — `job_queue.details` shows `pending=N running=N completed=N failed=N`.
2. If `failed` is increasing, a job type is crashing. Check API server logs for job execution errors.
3. If `running` is high but `completed` is not increasing, workers are stuck. Restart the API server to reset the queue worker threads.
4. If the database is slow (see FM-1), fix database first — job queue performance is directly tied to DB latency.
5. Reduce `ALLOY_MAX_BATCH_SIZE` temporarily if a specific batch job is flooding the queue.

---

### FM-7: Mobile App Cannot Connect to API

**Symptoms:** Mobile app shows "Network Error" or "Unable to connect". All API calls fail.

**Likely causes:**
- `EXPO_PUBLIC_API_URL` is not set or points to the wrong host.
- API server is not running (see FM-2).
- CORS policy is blocking the mobile app's origin.

**Recovery steps:**
1. Confirm the API server is running (`GET /api/health/live` returns 200).
2. Verify `EXPO_PUBLIC_API_URL` in the mobile app's environment — it should match the Replit dev domain or production URL.
3. In development, `EXPO_PUBLIC_DOMAIN` is used to dynamically construct the API URL. Confirm it matches the Replit dev domain (`$REPLIT_DEV_DOMAIN`).
4. For WebSocket failures specifically: confirm `SESSION_SECRET` is set. WebSocket tickets are HMAC-signed with `SESSION_SECRET` (if unset, an ephemeral per-process key is used — tickets will be invalid after any server restart).
5. Rebuild and restart the Expo development server after changing environment variables — Expo caches env values at bundle time.

---

### FM-8: Object Storage / File Uploads Failing

**Symptoms:** File uploads return errors. Documents, attachments, or media are not persisting.

**Likely causes:**
- `OBJECT_STORAGE_BUCKET_ID` is not set (the health endpoint checks this specific var — health shows `storage: "demo"` when absent).
- Storage credentials are expired or incorrect.

**Recovery steps:**
1. Check `/api/health` — `services.storage.status` will be `"demo"` if `OBJECT_STORAGE_BUCKET_ID` is not set (this is the specific env var the health endpoint checks, per `app.ts`).
2. If demo mode is acceptable for development, no action needed — uploads will fall back gracefully.
3. For production: Replit App Storage provisioning sets `DEFAULT_OBJECT_STORAGE_BUCKET_ID`, `PUBLIC_OBJECT_SEARCH_PATHS`, and `PRIVATE_OBJECT_DIR` (used by the storage library). Ensure `OBJECT_STORAGE_BUCKET_ID` is also set (or aliased) so the health check reports correctly. Reprovision via the Replit workspace Object Storage panel if missing.
4. For Azure production: set `AZURE_STORAGE_CONNECTION_STRING` in Key Vault.

---

### FM-9: Database Schema Out of Sync (Migration Missing)

**Symptoms:** API returns 500 errors with `column "X" does not exist` or `relation "Y" does not exist` errors in logs.

**Likely causes:**
- A new migration was added to `lib/db/drizzle/` but not applied to the database.
- A shared library schema change was not followed by a migration run.

**Recovery steps:**
1. Check `lib/db/drizzle/` for pending migration files (files newer than last deploy).
2. Run migrations:
   ```bash
   pnpm --filter @szl-holdings/db run db:migrate
   ```
3. If migrations are not idempotent and the schema is corrupted, restore from the most recent backup (see FM-1 restore procedure) and re-apply migrations from a clean state.
4. For development: `pnpm --filter @szl-holdings/db run db:push` applies schema changes without migration files (destructive — do not use on production data).

---

### FM-10: CORS Errors in Production

**Symptoms:** Browser console shows `CORS policy: No 'Access-Control-Allow-Origin' header`. Authenticated requests fail. API calls work without credentials but fail with credentials.

**Likely causes:**
- `CORS_ORIGINS` is not set in production (API server logs a warning at startup).
- The origin in `CORS_ORIGINS` does not exactly match the request origin (protocol, port, or subdomain mismatch).
- Wildcard pattern in `CORS_ORIGINS` is not matching correctly.

**Recovery steps:**
1. Set `CORS_ORIGINS` in Replit Secrets to a comma-separated list of allowed origins (e.g., `https://myapp.replit.app,https://myapp.com`).
2. Patterns support wildcards: `https://*.replit.app` is valid.
3. Restart the API server workflow after updating secrets.
4. Verify with: `curl -H "Origin: https://your-frontend.com" -I https://your-api/api/health` and check for `Access-Control-Allow-Origin` in the response.

---

## Maintenance & Drift Risk

This runbook reflects the codebase as of April 2026. The following areas drift most frequently and should be re-verified on any significant infrastructure or API change:

| Area | Drift risk | How to verify |
|------|-----------|---------------|
| Environment variables | High — new services add vars frequently | Compare tables against `startup-validation.ts` `ENV_SPECS` array and `.env.example` |
| Stripe price IDs | High — new products are added | Compare against `artifacts/api-server/src/routes/billing.ts` price ID maps |
| Artifact registry | Medium — new apps created regularly | Run `ls artifacts/` and compare to tables above; check Replit workflow panel |
| tenantScope routes | Low | Check `artifacts/api-server/src/routes/index.ts` for `tenantScope` calls |
| Shared library list | Low — new libs added occasionally | Run `ls lib/` and compare to Section 4 |

**Recommended review cadence:** After any significant infrastructure task or when a new platform product ships.

---

## Verification Provenance

This document was audited against the following source files. When a claim in this runbook conflicts with a source file, the source file is authoritative.

| Section | Source Files |
|---------|-------------|
| Artifact registration | `.replit` (`[[artifacts]]` section) |
| All workflow-managed apps | Replit workflow panel (separate from `.replit` artifact registration) |
| Middleware stack, health endpoints | `artifacts/api-server/src/app.ts` |
| Session cookie mechanics | `artifacts/api-server/src/lib/auth.ts` |
| Auth hydrator vs enforcer | `artifacts/api-server/src/middlewares/authMiddleware.ts` |
| WebSocket ticket signing | `artifacts/api-server/src/lib/websocket.ts` |
| Session/crypto encryption | `artifacts/api-server/src/lib/crypto.ts` |
| tenantScope applied routes | `artifacts/api-server/src/routes/index.ts` |
| ENV_SPECS catalog | `artifacts/api-server/src/lib/startup-validation.ts` |
| Stripe price IDs (exact names) | `artifacts/api-server/src/routes/billing.ts` |
| VAPID keys | `artifacts/api-server/src/lib/web-push-sender.ts` |
| Azure AD auth vars | `artifacts/api-server/src/lib/auth.ts` |
| Feature flags | `artifacts/api-server/src/lib/env-config.ts` |
| Third-party vars | `.env.example` |
| Shared library packages | `lib/*/package.json` (`exports` fields) |
| Database schema domains | `lib/db/src/schema/` |

**Last audited:** April 2026

---

## Google Search Console — Sitemap Submission

**Property:** `szlholdings.com`  
**Sitemap URL:** `https://szlholdings.com/sitemap.xml`  
**Sitemap file:** `artifacts/szl-holdings/public/sitemap.xml`  
**Robots file:** `artifacts/szl-holdings/public/robots.txt`

### Current State (April 2026)
- `sitemap.xml` is deployed and well-formed (validated against the sitemap 0.9 XSD schema)
- `robots.txt` references the sitemap at `Sitemap: https://szlholdings.com/sitemap.xml`
- All URLs in the sitemap are crawlable (not blocked by `robots.txt`)
- The `/investors/*` hub was intentionally excluded from the sitemap because `robots.txt` disallows that path

### Manual Submission Steps
The sitemap must be submitted once by a verified domain owner. This cannot be automated.

1. Sign in to [Google Search Console](https://search.google.com/search-console/) with the Google account associated with `szlholdings.com`
2. **Add property** → select "Domain" type → enter `szlholdings.com`
3. Follow the DNS TXT verification instructions (add the provided TXT record to the DNS host for `szlholdings.com`)
4. Once verified, navigate to **Indexing → Sitemaps** in the left sidebar
5. In the "Add a new sitemap" field, enter: `sitemap.xml`
6. Click **Submit**
7. Refresh after a few minutes — status should show "Success" with a URL count

### Ongoing Monitoring
- **Coverage report:** Check weekly for "Error" or "Excluded" URLs, especially after deploying new routes
- **Core Web Vitals:** Available ~28 days after initial crawl data; target "Good" status on mobile and desktop
- **Sitemap errors:** If new routes are added, ensure they are added to `sitemap.xml` and not blocked by `robots.txt`

### robots.txt — Intentionally Disallowed Paths
The following paths are blocked from indexing by design:

| Path | Reason |
|------|--------|
| `/admin` | Internal admin panel |
| `/ops` | Internal operations dashboard |
| `/kpi-dashboard` | Internal KPI view |
| `/investors` | Gated investor hub (access-controlled) |
| `/alloy` | Internal product surface |
| `/prism-counsel` | Deprecated product route |
| `/s31`, `/s32`, `/ny` | Internal staging/regional routes |
| `/__mockup`, `/forge`, `/nexus`, `/oracle`, `/control-tower`, `/analyst` | Internal tooling |

---

## Related Documentation

| Document | Location | Contents |
|----------|----------|---------|
| Architecture Overview | `docs/architecture/system-overview.md` | System design, monorepo structure, layer decisions |
| Platform Map | `docs/architecture/platform-map.md` | Platform-to-infrastructure mapping |
| Data Flow | `docs/architecture/data-flow.md` | Signal-to-action flows, entity model |
| Disaster Recovery | `docs/disaster-recovery.md` | Backup strategy, full restore playbook |
| Deployment Strategy | `docs/deployment.md` | Replit and Azure deployment procedures |
| Production Readiness | `docs/production-readiness.md` | Pre-deploy checklist, env var status table |
| Platform Overview | `docs/PLATFORM_OVERVIEW.md` | Executive-level platform description |
| API Reference | `/api/docs` (live) | OpenAPI specification via Swagger UI |
| Secrets Policy | `docs/SECRETS_POLICY.md` | Secret handling, rotation, and classification |
| Access Control | `docs/ACCESS_CONTROL.md` | RBAC model and permission boundaries |

> **Canonical reference doc freshness:** The eight root-level canonical docs (`ARCHITECTURE.md`, `API-SPEC.md`, `DATA-MODEL.md`, `PRODUCT-SURFACES.md`, `OPERATIONS-RUNBOOK.md`, `DEPLOYMENT-GUIDE.md`, `ACCESS-CONTROL-MATRIX.md`, `ANALYTICS-EVENTS.md`) are maintained at the repository root. Their freshness policy, drift risk table, and source verification commands are defined in `OPERATIONS-RUNBOOK.md` Section 10.
