# SZL Holdings Platform

## Overview
The SZL Holdings Platform is a pnpm monorepo designed to provide command and intelligence systems across various sectors including maritime, cybersecurity, AI, real estate, and enterprise operations. It integrates five product platforms (Lyte, Vessels, Aegis, Terra, Carlota Jo), a parent company site (SZL Holdings), and a founder identity site (Stephen Lutar). The platform uses a common PostgreSQL database, authentication system, and a command-grade design system to deliver specialized solutions for business observability, maritime intelligence, unified defense, real estate portfolio management, and UHNW residential advisory.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### Core Technologies
The platform is a pnpm monorepo utilizing Node.js 24 and TypeScript 5.9.
- **Frontend:** React, Vite, TanStack React Query, Wouter, Tailwind CSS, Framer Motion, Lucide React, Recharts.
- **Internationalization (i18n):** react-i18next + i18next + i18next-browser-languagedetector. Shared i18n library at `lib/i18n/`. Each public-facing artifact (carlota-jo, szl-holdings, stephen-site) has its own `src/i18n.ts` setup and `src/locales/<lang>/translation.json` files. Language detection order: querystring (`?lang=`), cookie, localStorage, browser navigator. Carlota Jo supports English + Spanish (full translation), szl-holdings and stephen-site have English with framework ready for future languages. A `LanguageSwitcher` component is exported from `@workspace/shared-ui` and renders in the Carlota Jo header. Locale-aware date/number/currency formatting uses `Intl` APIs via `src/hooks/use-locale.ts` hooks. RTL support: CSS logical properties used throughout (`inset-inline-0`, `margin-inline-*`, `padding-inline-*`, `start/end`), with a `[dir="rtl"]` CSS rule prepared.
- **Backend:** Express 5, Drizzle ORM, Zod validation, pino logging.
- **Database:** PostgreSQL with Drizzle ORM (over 120 tables), including comprehensive CMS, product-specific, client portal, and organization membership schemas with a 7-role CMS model.
- **Authentication:** Replit Auth (OIDC/PKCE), session-based with cookie+Bearer token, 7-role RBAC.
- **API Codegen:** Orval from OpenAPI specification.
- **Bundling:** esbuild (CJS) and Vite.

### UI/UX Design System
A premium, command-grade, SZL-branded design system inspired by Palantir Foundry/Anduril Lattice. Each application features a unique visual identity aligned with its market focus, with a dark-first aesthetic (except Carlota Jo), purposeful motion, and sharp corners. Typography includes Space Grotesk, Inter, and JetBrains Mono.

#### Brand Hierarchy & Visuals
- **SZL Holdings:** Dark-first, platinum/silver/graphite. Includes the Alloy execution fabric module at `/alloy/*`.
- **Lyte:** Burnished amber (#d4a054), Business Observability Platform using the PRISM framework. Premium color palette: amber #d4a054, risk #c45a4a, intelligence #8b7ac8, signals #c8953c, motion #4a90b8, background #0a0d14. Split architecture: editorial website (marketing-landing.tsx) and operational app (dashboard.tsx + lyte-layout.tsx). Website sections: hero, category framing, PRISM, 7 Pillars, Capabilities, Evidence, Why Now, Trust/Governance, CTA close. App: dense operational surface with exposure strip, PRISM cards, Priority Action Queue, Signal Timeline, Correlations, Platform Health, System State, ActionLoop.
- **Vessels:** Deep ocean blue, maritime command intelligence.
- **Terra:** Obsidian/graphite/deep forest/slate emerald/muted brass real-estate portfolio intelligence. Rebuilt color system (no neon green): bg `#0a0c10`, primary `#2d6a4f`, accent `#40856a`, brass `#9a7840/#b8943c`. Hard website/app split: marketing-landing.tsx (signed-out) renders full marketing site with Terra doctrine strip (Foundation→Watch→Pipeline→Intelligence→Action); App.tsx routes signed-in users to `/dashboard`. App shell (terra-layout.tsx) has restructured sidebar: Core (Overview/Map/Market), Intelligence (Watchlists/Ownership), Pipeline (Pipeline/Brokers/Portfolio), Admin (Approvals/Documents/Admin). Dashboard is dense enterprise operating surface: KPI strip, doctrine module nav, opportunity queue, deal pipeline, market signal timeline, broker scorecards, and spatial map panel.
- **Carlota Jo:** Warm ivory/brushed gold, UHNW residential advisory platform with a public marketing site, private Client Portal, and a native mobile app (`artifacts/carlota-jo-mobile`, Expo/React Native, port 8082).
- **Vessels Mobile:** Ocean-dark fleet command mobile app (`artifacts/vessels-mobile`, Expo/React Native, port 8083). Features: Fleet Command map/list, Vessel Detail (position, voyage, maintenance, sanctions), Alerts & Anomalies feed, Voyage Economics with mini charts, Compliance Dashboard, Offline AsyncStorage caching. Design: #020d18 bg, #0ea5e9 primary, Inter fonts. Note: Registered as workspace package but lacks Replit artifact/workflow registration due to platform 10-artifact/10-workflow limit.
- **SZL Holdings Mobile:** Executive Command + Alloy Orchestration mobile app (`artifacts/szl-holdings-mobile`, Expo/React Native, port 8083). Workflow: "SZL Holdings Mobile". Screens: Command Center (ecosystem health, KPIs), Portfolio (venture cards + detail), Alloy Monitor (workflow runs + approvals), Investor Relations (cap table, letters, docs), Profile/Trust Center (compliance frameworks, certifications, security policies, biometric auth). Dark theme: bg `#090810`, gold `#c9a84c`.
- **Stephen Lutar:** Near-monochrome, founder identity. Includes a native mobile app (`artifacts/stephen-mobile`, Expo/React Native, port 8083) — a founder digital card and portfolio showcase with sections: Digital Card, Portfolio, Thesis, Career Timeline, and Contact. Dark monochrome theme (#0a0a0a) with warm silver accent (#c4a97e). Workflow: `artifacts/stephen-mobile: expo`.
- **Aegis:** Navy #080B12 / amber #F97316 / red #EF4444, Unified Defense & Intelligence Command, consolidating Security Operations (Firestorm), Managed Operations (Rosie/MSP), and Intelligence Engine (INCA). Includes a native mobile SOC command center app (`artifacts/aegis-mobile`, Expo/React Native, port 8083, preview `/aegis-mobile/`) with real-time incident feed, threat dashboard (KPIs: active incidents, open findings, MTTD, MTTR, compliance score), MITRE ATT&CK heatmap, findings browser, biometric auth (Face ID/fingerprint), swipe gesture triage, bulk triage mode, and push notifications.

### GraphQL API Layer
A unified GraphQL API is mounted at `/api/graphql` using Apollo Server v5 with `@as-integrations/express5` and `graphql-ws` for subscriptions. It features 9 domain modules covering all platform areas. A shared client library (`@workspace/graphql-client`) provides Apollo Client integration and typed hooks for all frontends. REST endpoints remain active alongside GraphQL.

### Developer Documentation Portal
A comprehensive developer documentation portal is available at `/developers` within the SZL Holdings app. It includes:
- OpenAPI 3.1.0 interactive explorer (links to `/api/docs` Swagger UI)
- GraphQL playground documentation (links to `/api/graphql`)
- Authentication guide: Bearer tokens, OAuth 2.0 PKCE, API keys, SCIM tokens, webhook signatures
- Code samples in JavaScript, Python, and cURL for auth, projects, vessels, and Alloy signals
- Rate limit documentation (Global, Auth, Read, Write, Webhook Ingest tiers)
- Error code reference (HTTP status codes + application error codes)
- Versioning strategy with non-breaking/breaking change policy and deprecation policy
- The API server's Helmet config was updated from `frameguard: deny` to `frameguard: sameorigin` to allow same-origin embedding

### Platform Architecture & Features
The platform comprises 13 applications sharing authentication and design.
- **Authentication & RBAC:** Middleware manages Replit Auth with an 11-role RBAC system.
- **API Server:** Modular routes in `artifacts/api-server` use Zod and Drizzle, with security features like `helmet`, `express-rate-limit`, and CORS.
- **Service Adapters:** `lib/services` provides a pattern for integrating 29 third-party services with environment variable detection and mock fallbacks.
- **Azure AD Multi-Tenant Provisioning:** Admin panel API at `/api/admin/tenants` manages customer Azure AD tenant onboarding and multi-tenant SSO.
- **SCIM 2.0 User Provisioning:** Full RFC 7643/7644-compliant SCIM server at `/api/scim/v2/*`. Supports Users and Groups CRUD (GET list+filter, GET by ID, POST, PUT, PATCH, DELETE). Bearer token authentication per tenant (tokens stored as SHA-256 hashes). Group→role mapping maps IdP groups to platform roles. Deprovisioning (soft-delete via active=false) on user DELETE. Admin dashboard at `/admin/scim` with per-tenant: provisioned users list, SCIM token management, sync activity log, and manual sync trigger. Tables: `scim_tokens`, `scim_groups`, `scim_group_members`, `scim_provisioned_users`, `scim_sync_logs`.
- **Dynamics 365 / Dataverse Integration:** `DataverseAdapter` connects to customer Dynamics 365 environments, supporting various entities and signal ingestion for Lyte, Vessels, Terra, Alloy, and Aegis.
- **Stripe Billing:** Full integration for checkout, subscriptions, and webhooks.
- **Intelligence Layer:** Over 40 REST endpoints provide cross-platform intelligence, including government data feeds and AI-powered services (chat, summarize, sentiment, image-gen, threat-briefing).
- **Core Command Center:** Unified cross-platform dashboard at `/core` for live summaries, recommendations, audit, and service health.
- **Live AI Models:** AI inference primarily uses GPT-5.2 (OpenAI) and Claude Sonnet 4.6 (Anthropic).
- **Nimbus AI Evolution:** Production intelligence layer with core modules for inference telemetry, a unified AI gateway, real-time provider health monitoring, an enhanced model registry, multi-agent orchestration, and composable multi-step AI pipelines.
- **Domain AI Agents:** 10 specialized advisory-only agents (e.g., Helmsman, Sentinel, INCA) with specialized system prompts and tool definitions.
- **AI Copilots:** Domain-specific AI copilots (`AgentCopilot` component) in all applications, featuring SSE streaming, markdown rendering, suggested questions, voice input/output, and mobile optimization.
- **AlloyChat:** Multi-model AI operations assistant.
- **Observability:** Structured logging via pino and an 8-pillar domain-native observability framework.
- **Feature Gating:** `checkFeatureAccess(orgId, featureKey)` controls access based on entitlements.
- **Admin Panel CMS:** Centralized administration for 16 CMS tables, media assets, site settings, and analytics.
- **In-App Collaboration Layer:** Platform-wide system for team discussions via a `comments` table and shared UI components.
- **Universal Notification & Real-Time Alerting System:** `useNotificationCenter` hook and WebSocket integration for real-time pushes. Multi-channel dispatch (`lib/notification-dispatch.ts`) routes critical/warning domain alerts to Slack (via webhook or bot token) and Microsoft Teams (via webhook). When `SLACK_WEBHOOK_URL`, `SLACK_BOT_TOKEN`, or `MICROSOFT_TEAMS_WEBHOOK_URL` are configured, notifications route automatically. Slack and Teams dispatch are gated on severity (`warning`/`critical`); email alerts (to internal team) are gated on `critical` only.
- **Expo Push Notifications (Mobile):** End-to-end push notification system for the Carlota Jo mobile app using Expo's push service. Token registration stored in `push_tokens` DB table (per-user, per-device, per-app). API routes: `POST /api/push-tokens` (register device), `DELETE /api/push-tokens/:token` (deregister), `POST /api/push-notifications/send` (send — ops role required; targets: user/app/broadcast). 15 domain-specific notification templates across 5 products (Aegis, Vessels, Terra, Carlota Jo, Lyte) in `lib/push-templates.ts`. Mobile app: `usePushNotifications` hook handles permission requests, token registration, and deep-link response. `NotificationCenter` component (modal) displays in-app notification history with read/unread status, badge count, and swipe-to-dismiss. Admin endpoints at `GET /api/admin/push-tokens/stats` and `POST /api/admin/push-notifications/broadcast`.
- **Email Delivery System:** Triple-failover email chain in `artifacts/api-server/src/lib/email.ts` — SendGrid → Resend → SMTP nodemailer. Provider selected via `EMAIL_PROVIDER` env var or auto-detected. Contact form submissions from Stephen Site (`/api/stephen/booking-requests`) and Carlota Jo (`/api/booking/inquiries`) fire dual emails: confirmation to submitter + admin notification. Email brand templates exist for both properties. Configure via `SENDGRID_API_KEY`, `RESEND_API_KEY`, or `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`. Admin inboxes configurable via `STEPHEN_ADMIN_EMAIL` and `CARLOTA_ADMIN_EMAIL` env vars.
- **Alloy Platform Core — Orchestration Engine:** Canonical shared data model, ingestion layer, normalization pipeline, and workflow orchestration engine.

### Database Schema
Over 97 tables across 21+ schema files, covering authentication, billing, various application-specific data, Alloy Chat, Collaboration, and MSP, including Azure/Dataverse specific tables.

### Aegis — Consolidated Defense & Intelligence Platform
Aegis (artifact slug `firestorm`, path `/firestorm/`) unifies Security Operations (SOC), Managed Operations (Ops), and Intelligence Engine (Intel) into a single platform with distinct modules and API routes.

**SOC Capabilities (as of latest update):**
- **SOAR Playbook Engine** (`/soar-playbooks`): 6 pre-built templates (Phishing, Malware, Account Compromise, Ransomware, DDoS, Data Exfil), execution history, analytics (MTTR, automation rate, false positives), conditional logic display. CrowdStrike Falcon Fusion / Palo Alto XSOAR-inspired.
- **STIX/TAXII Protocol Layer** (`/stix-taxii`): STIX 2.1 object library browser (7 object types), TAXII 2.1 feed management, bundle export. Includes APT29 / Operation Darkwing objects.
- **Unified XDR Console** (`/xdr-console`): Cross-source telemetry correlation across endpoint, network, identity, and cloud. Operation Darkwing campaign phase timeline, 5 correlated APT29 alerts with MITRE mapping, entity risk scoring.
- **Threat Intel Feed** (`/threat-feed`): Live NVD/CISA KEV/news feeds with Operation Darkwing APT29 banner overlay. STIX references, IOC tracking, TLP classification.
- **Sentinel Watch** (`/sentinel`): MITRE ATT&CK v14 detection coverage across 12 tactics, Operation Darkwing live alerts, zone monitoring (5 network zones), Intel feed aggregation (FS-ISAC, CrowdStrike, CISA KEV).
- **Framework Scorecards** (`/cr/scorecards`): 7 government frameworks — NIST 800-53 Rev 5, NIST CSF 2.0, SOC 2 Type II, CMMC 2.0, FedRAMP Moderate, ISO 27001:2022, NIS2/BSI. Control family drill-down, cross-framework mapping, SSP/POA&M export.
- **Executive Risk Dashboard** (`/executive-risk`): 8 board-level KPIs, Active Incident banner, Risk Score trend, MTTD/MTTR trend, Risk Register with 5 enterprise risks (inherent/residual scoring), Board Reports library (8 documents including FedRAMP SSP, CMMC readiness, NIS2 notification).
- **APT Scenario**: Operation Darkwing (APT29 / Cozy Bear / SVR) targeting SZL Holdings — 5 phases: Initial Access (T1566.001) → Credential Harvest (T1003.001) → Lateral Movement (T1021.002) → Data Staging (T1074) → Exfiltration Prevented (T1567.002). This scenario is used consistently across XDR, Sentinel, Threat Feed, STIX, Forensics, and Executive Risk pages.
- **Auth Bridge**: `authMiddleware.ts` now populates both `req.oidcUser` (legacy) and `req.user` (new) from a single session lookup, resolving the dual-middleware conflict.

## External Dependencies
- **Database:** PostgreSQL
- **Authentication:** Replit Auth
- **Payment Processing:** Stripe (infrastructure built; requires manual secret configuration — see Stripe Setup below)
- **AI/NLP:** HuggingFace Inference API, Replit's OpenAI proxy, OpenAI, Anthropic
- **Communication:** Slack, Twilio, Resend
- **Productivity/Collaboration:** Google APIs, Notion, Confluence, HubSpot, Dropbox, OneDrive
- **Analytics:** Plausible, Posthog
- **Voice Synthesis:** Elevenlabs
- **Government Data Feeds:** CISA KEV, NVD CVE, MITRE ATT&CK, FedRAMP, Census Bureau ACS, BLS Construction Employment, FEMA NRI, USAspending.gov, NOAA, arXiv, Semantic Scholar, PapersWithCode, HuggingFace Hub, SEC EDGAR, NYC Open Data, FRED, HUD Fair Market Rents
- **Maritime Data:** Digitraffic AIS, BarentsWatch AIS, Open-Meteo Marine Weather API
- **Threat Intelligence (keyless):** Shodan InternetDB, GreyNoise Community API, MalwareBazaar, URLhaus
- **Other:** GitHub Public API, AbuseIPDB, Figma

## Stripe Setup (Required to activate payments)

The Stripe payment infrastructure is fully built but requires API keys to go live. Currently runs in mock mode.

### Step 1: Set secrets in Replit Secrets tab

Add these two secrets:
- `STRIPE_SECRET_KEY` — Your Stripe secret key (`sk_test_...` for test, `sk_live_...` for production). Found in Stripe Dashboard → Developers → API keys.
- `STRIPE_WEBHOOK_SECRET` — Your Stripe webhook signing secret (`whsec_...`). Create a webhook endpoint in Stripe Dashboard → Developers → Webhooks, pointing to `https://[your-domain]/api/billing/webhooks`, then copy the signing secret.

### Step 2: Create products in Stripe, then set price ID env vars

After creating products in your Stripe dashboard, set these environment variables (Secrets tab or env vars):

| Env Var | Purpose |
|---|---|
| `STRIPE_PRICE_STRATEGY_SESSION` | Carlota Jo — Executive Strategy Session ($4,500) |
| `STRIPE_PRICE_PORTFOLIO_REVIEW` | Carlota Jo — Strategic Engagement ($45,000) |
| `STRIPE_PRICE_ADVISORY_RETAINER` | Carlota Jo — Senior Advisory Retainer ($18,000/mo) |
| `STRIPE_PRICE_TERRA_STARTER_MONTHLY` | Terra Starter plan (monthly) |
| `STRIPE_PRICE_TERRA_STARTER_ANNUAL` | Terra Starter plan (annual) |
| `STRIPE_PRICE_TERRA_PRO_MONTHLY` | Terra Pro plan (monthly) |
| `STRIPE_PRICE_TERRA_PRO_ANNUAL` | Terra Pro plan (annual) |
| `STRIPE_PRICE_TERRA_ENTERPRISE_MONTHLY` | Terra Enterprise plan (monthly) |
| `STRIPE_PRICE_TERRA_ENTERPRISE_ANNUAL` | Terra Enterprise plan (annual) |
| `STRIPE_PRICE_FIRESTORM_ENTERPRISE` | Aegis/Firestorm Enterprise subscription |

### Step 3: Verify connection

After setting secrets and restarting the API server, check: `GET /api/billing/stripe-config` — should show `stripeConnected: true`.

### What works once configured
- Carlota Jo booking flow → real Stripe Checkout sessions (one-time payment)
- Terra subscribe → real Stripe subscription checkout
- Firestorm enterprise quote → creates Stripe customer + sends invoice
- Lyte Commerce page → shows real Stripe product catalog with checkout buttons
- Webhooks → `POST /api/billing/webhooks` processes live Stripe events and updates DB
- Customer portal → `POST /api/billing/customer-portal` lets subscribers manage billing

### Note on Replit Stripe Integration
The Replit Stripe OAuth integration (connector) was dismissed. This project uses direct API keys via `STRIPE_SECRET_KEY` instead. The `lib/services/src/adapters/stripe.ts` adapter handles all Stripe API calls and automatically switches from mock to live mode when `STRIPE_SECRET_KEY` is set.

## Testing

### Test Suite Overview
A comprehensive automated testing suite is configured across the full stack using Vitest (unit/integration) and Playwright (E2E).

### Running Tests
```sh
pnpm test              # Run all unit + component tests
pnpm test:api          # API integration tests (Vitest, node env)
pnpm test:components   # Component tests (Vitest, happy-dom env)
pnpm test:coverage     # API tests with coverage report
pnpm test:e2e          # E2E tests (Playwright, requires browser + running apps)
```

### Test Structure
```
tests/
├── api/
│   ├── auth.test.ts         # Auth routes: login, providers, /me, roles, users, sessions
│   ├── health.test.ts       # Health check endpoint
│   └── integrations.test.ts # Salesforce + Jira integration routes
├── components/
│   ├── command-palette.test.tsx  # CommandPalette filtering, keyboard, groups
│   ├── ecosystem-nav.test.tsx    # EcosystemNav rendering
│   ├── powerbi-embed.test.tsx    # PowerBiEmbed states and callbacks
│   ├── user-button.test.tsx      # UserButton auth states
│   └── utils.test.ts            # cn, formatDate, formatCurrency, formatNumber
├── e2e/
│   ├── szl-holdings.spec.ts  # SZL Holdings homepage E2E flow
│   ├── aegis.spec.ts         # Aegis SOC dashboard navigation
│   └── terra.spec.ts         # Terra portfolio overview
└── utils/
    ├── setup.ts              # API test mocks (db, auth, services)
    ├── setup-dom.ts          # Component test DOM setup + mocks
    └── test-app.ts           # Express test app factory helper
```

### Config Files
- `vitest.config.ts` — API/unit tests (node environment), workspace package aliases
- `vitest.components.config.ts` — Component tests (happy-dom), React plugin, workspace aliases
- `playwright.config.ts` — E2E tests via Playwright (chromium), uses `PLAYWRIGHT_BASE_URL` env var

### E2E Notes
Playwright E2E tests require running apps and system-level glib/gtk libraries. In the Replit dev environment, the browser binary downloads successfully but lacks system libs. These tests are designed to run in CI (GitHub Actions etc.) with `pnpm test:e2e`.

---

## Recent Work (Task #233 — Competitive Gap Closure)

### Completed
1. **Dreamscape/Nimbus purge** — All `DreamscapeCampaign/*` interfaces renamed to `AlloyCampaign/*` in creative-api.ts and use-campaigns.ts. milestones.json updated. core.ts engine label renamed. API URL paths kept for backward compat.

2. **Universal ContactModal** — `lib/shared-ui/src/contact-modal.tsx` — reusable `<ContactModal>` component supporting `demo`, `consultation`, `trial`, `general` types. Exported from `@workspace/shared-ui`. Wired to CTA buttons in: vessels (landing), lyte (landing), firestorm/aegis-home, terra (marketing-landing). SZL Holdings has a dedicated `/contact` page already wired to `/api/holdings/inquiries`.

3. **Contact API** — `artifacts/api-server/src/routes/contact.ts` — `POST /api/contact/submit` inserts to `platform_contact_requests` table (auto-created). `GET /api/contact/requests` for admin access. Rate-limited. Registered in `index.ts`.

4. **Case Studies** — Added Aegis ("Ransomware Lateral Movement Contained in 9 Minutes") and Carlota Jo ("Estate Transition Across 4 Jurisdictions in 18 Days") case studies to `szl-holdings/src/data/case-studies.ts`. Filter tabs updated to show all 6 products.

5. **OpenGraph/JSON-LD** — terra, lyte-command-center, firestorm index.html all updated with: `<link rel="canonical">`, `og:site_name`, `og:image:width/height`, `twitter:image`, JSON-LD `SoftwareApplication` structured data.

6. **Favicons** — Created `terra/public/favicon.svg` and `carlota-jo/public/favicon.svg`. Updated terra's index.html to reference the SVG favicon. Carlota-jo index.html updated with favicon link.

7. **API stub audit** — `MOCK_BILLING` in admin.ts: intentional fallback defaults for when Stripe is disconnected. `cap_table_placeholder` in capital-readiness.ts: audit log identifiers (not mocks). `MOCKED_DEMO_MODE` status strings: real connector status values. No broken stubs found requiring changes.