# SZL Holdings Platform

## Overview
The SZL Holdings Platform is a pnpm monorepo building **Lyte**, a business observability platform, powered by **Alloy**, its execution fabric and audit layer. The broader ecosystem includes five product platforms (Lyte, Vessels, Aegis, Terra, Carlota Jo), a parent company site (SZL Holdings), and a founder identity site (Stephen Lutar). **Lyte + Alloy is the commercial wedge**; all other platforms are staged expansion lanes. The platform uses a common PostgreSQL database, authentication system, and a command-grade design system.

## Company Narrative (Current)
- **Lyte** = market-facing software wedge (business observability)
- **Alloy** = execution fabric / workflow / signal / routing / audit engine
- **Vessels / Aegis / Terra / Carlota Jo** = staged expansion lanes and option value
- The public site (SZL Holdings) leads with Lyte + Alloy as the focused capital story
- Navigation: Platform > Design Partners > Trust > Investor Story > More (Platform Map, IR, Demo, Docs)

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
- **Vessels Mobile:** Ocean-dark fleet command mobile app (`artifacts/vessels-mobile`, Expo/React Native, port 8087, workflow: `artifacts/vessels-mobile: expo`). Features: Fleet Command map/list, Vessel Detail (position, voyage, maintenance, sanctions), Alerts & Anomalies feed, Voyage Economics with mini charts, Compliance Dashboard, Offline AsyncStorage caching. Design: #020d18 bg, #0ea5e9 primary, Inter fonts.
- **SZL Holdings Mobile:** Executive Command + Alloy Orchestration mobile app (`artifacts/szl-holdings-mobile`, Expo/React Native, port 8085, workflow: `artifacts/szl-holdings-mobile: expo`). Screens: Command Center (ecosystem health, KPIs), Portfolio (venture cards + detail), Alloy Monitor (workflow runs + approvals), Investor Relations (cap table, letters, docs), Profile/Trust Center (compliance frameworks, certifications, security policies, biometric auth). Dark theme: bg `#090810`, gold `#c9a84c`.
- **Stephen Lutar:** Near-monochrome, founder identity. Includes a native mobile app (`artifacts/stephen-mobile`, Expo/React Native, port 8086, preview `/stephen-mobile/`) — a founder digital card and portfolio showcase with sections: Digital Card, Portfolio, Thesis, Career Timeline, and Contact. Dark monochrome theme (#0a0a0a) with warm silver accent (#c4a97e). Workflow: `artifacts/stephen-mobile: expo`.
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
- **White-Label Tenant Branding:** Each enterprise tenant can have custom branding (logo URL, primary/accent colors, company name, tagline, sidebar header, email footer). Stored in `tenant_branding` table. API: `GET/PUT/DELETE /api/admin/tenants/:id/branding` (admin-only) and `GET /api/tenant-branding/:azureTenantId` (public). Admin UI at `/admin/tenant-branding/:id` in szl-holdings with live preview pane. `useTenantBrand()` hook and `TenantBrandProvider` in `@workspace/shared-ui` for runtime branding consumption. Tenant-branded email template functions (`buildTenantBrand`, `buildTenantWelcomeEmail`, `buildTenantInviteEmail`, `buildTenantNotificationEmail`) in `artifacts/api-server/src/lib/email.ts`. Fallback to SZL Holdings defaults when no branding configured.
- **SCIM 2.0 User Provisioning:** Full RFC 7643/7644-compliant SCIM server at `/api/scim/v2/*`. Supports Users and Groups CRUD (GET list+filter, GET by ID, POST, PUT, PATCH, DELETE). Bearer token authentication per tenant (tokens stored as SHA-256 hashes). Group→role mapping maps IdP groups to platform roles. Deprovisioning (soft-delete via active=false) on user DELETE. Admin dashboard at `/admin/scim` with per-tenant: provisioned users list, SCIM token management, sync activity log, and manual sync trigger. Tables: `scim_tokens`, `scim_groups`, `scim_group_members`, `scim_provisioned_users`, `scim_sync_logs`.
- **Dynamics 365 / Dataverse Integration:** `DataverseAdapter` connects to customer Dynamics 365 environments, supporting various entities and signal ingestion for Lyte, Vessels, Terra, Alloy, and Aegis.
- **Stripe Billing:** Full integration for checkout, subscriptions, and webhooks.
- **Intelligence Layer:** Over 40 REST endpoints provide cross-platform intelligence, including government data feeds and AI-powered services (chat, summarize, sentiment, image-gen, threat-briefing).
- **Core Command Center:** Unified cross-platform dashboard at `/core` for live summaries, recommendations, audit, and service health.
- **Alloy AI Decision Engine (`@workspace/ai-engine`):** HuggingFace-powered AI execution fabric with 9 schema-validated decision types (action, risk, triage, entity extraction, ownership assignment, escalation, approval recommendation, executive summary, resolution summary). Model registry: Qwen3-8B (primary LLM), Qwen3-0.6B (fallback), BGE-m3 (embeddings), BGE-reranker-v2-m3 (reranking). Evidence-backed hybrid retrieval. Policy-gated tool execution (9 tools, default `propose_only`). Eval harness (25+ golden tests, 9 categories). 14 API endpoints at `/api/ai/*`. Shared UI components: `DecisionCard`, `ConfidenceBand`, `EvidencePanel`, `ApprovalBadge`, `HumanReviewBadge`, `RiskBadge`, `PriorityBadge`, `ActionTypeBadge`, `EnvironmentLabel`, `DegradedModeBanner`, `SafeFallbackState`, `AuditTrailDrawer` in `@workspace/shared-ui`. Lyte Intelligence Fabric UI at `/alloy/intelligence` (5 tabs: overview, models, tools, retrieval, audit).
- **Live AI Models:** AI inference primarily uses Qwen3-8B (HuggingFace), with OpenAI and Anthropic as fallback providers.
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

## Recent Work (Task #232 — Capital Arsenal)

### Completed
1. **Capital Arsenal Data File** — `artifacts/szl-holdings/src/data/capital-arsenal.ts` — 20+ investor-grade capital documents across 5 channels. Includes:
   - Investor channel: SZL one-pager, investor memo, 12-slide pitch deck content, cap table/data room structure
   - Per-lane one-pagers: Lyte, Vessels, Aegis, Terra, Carlota Jo (each with market sizing, competition, revenue model)
   - Bank/SBA channel: Full bank-ready business plan, use-of-funds memo (12-month and 24-month), 12-month operating model, founder background summary, risk/mitigation sheet, entity/banking checklist
   - NY State channel: NY MWBE certification guide (full eligibility, checklist, application timeline), Excelsior Jobs Program, NYSTAR/Innovation Hot Spots, NYC SBS M/WBE, ESD lending programs
   - Federal channel: SBA 8(a) guide with full eligibility and checklist, WOSB/EDWOSB guide, SBIR/STTR guide with agency-specific alignment per product lane (NSF for Lyte, DoD/DHS for Vessels and Aegis), SAM.gov checklist, FedRAMP readiness assessment
   - Angel/equity channel: Angel investor narrative memo ("why now" story), commercial wedge strategy, traction narrative, milestone-based raise plan, use-of-proceeds investor breakdown

2. **Capital Arsenal Page** — `artifacts/szl-holdings/src/pages/capital-arsenal.tsx` — Full-featured admin page with:
   - Channel accordion navigation (Investor, Bank/SBA, Angel, NY State, Federal)
   - Document card grid with status badges, lane icons, printable indicators
   - Split-pane document viewer (right panel slides in, left panel remains scrollable)
   - Section expand/collapse with smooth animation
   - Full search across all documents
   - Print support (browser print, CSS @media print)
   - Internal-use disclaimer prominently displayed

3. **Routing** — Wired into `App.tsx` as `/admin/capital-arsenal` (RequireAuth protected route)

4. **Admin Integration** — Added "Capital Arsenal" to `ADMIN_SECTIONS` in `admin.tsx` with overview card grid and "Full Arsenal View" link to standalone page

---

## Recent Work (Task #253 — Investor-Grade Hardening & Public Credibility Build)

### Completed — 10-Phase program

1. **Audit & Canonicalization** — `docs/audit/public-surface-audit.md`, `docs/audit/repo-canonicalization-plan.md`. Canonical flagship: `stephenlutar2-hash/szl-holdings-platform`.

2. **Public Mirror Discipline** — `docs/public/public-mirror-policy.md`, `scripts/public-mirror/validate-mirror.sh` (pre-push validation script), `scripts/public-mirror/detect-noisy-folders.sh`. `.gitignore` updated with noisy directory patterns.

3. **Flagship Repo Trust Files** — Created: `CHANGELOG.md`, `SECURITY.md`, `CONTRIBUTING.md`, `LICENSE.md`, `CODEOWNERS`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/` (bug_report, feature_request, config.yml).

4. **Architecture & Trust Docs** — New canonical suites:
   - `docs/architecture/` — system-overview, platform-map, data-flow (supersede `docs/architecture.md`)
   - `docs/trust/` — trust-center, security-posture, deployment-model, privacy-boundaries (supersede `docs/trust-center.md`)

5. **README Rewrite** — `README.md` fully rewritten: platform hierarchy diagram, products with readiness labels (Functional Alpha / Public Beta Candidate), architecture at a glance, trust section, documentation map, Start Here tracks for Investors / Technical Reviewers / Design-Product / Enterprise Buyers.

6. **Profile README Package** — `profile-readme/README.md` (Stephen Lutar founder profile), `profile-readme/PROFILE_REPO_SETUP.md` (setup instructions for `stephenlutar2-hash/stephenlutar2-hash` repo).

7. **Release Discipline** — `docs/releases/release-strategy.md`, `docs/releases/versioning-policy.md`, `docs/releases/release-checklist.md`, `docs/releases/v0.1.0.md`.

8. **GitHub Automation** — `scripts/github/create-release.sh`, `scripts/github/update-repo-metadata.sh`, `scripts/github/bootstrap-labels.sh`, `ops/github/` directory with commands.sh, commands.ps1, manual-checklist.md, repo-settings.json, profile-values.md.

9. **Design System Audit** — `docs/design/design-audit.md`, `docs/design/design-system-tokens.md`, `docs/design/ui-remediation-plan.md`.

10. **Investor & Buyer Docs** — 10 investor docs + 5 buyer docs in `docs/investor/` and `docs/buyer/`.

11. **Final Proof Layer** — `docs/final/execution-summary.md`, `docs/final/what-changed.md`, `docs/final/manual-actions-remaining.md`, `docs/final/next-30-days.md`.

**Manual GitHub actions remaining:** ~55 minutes of work documented in `docs/final/manual-actions-remaining.md` (repo settings, release v0.1.0, labels, profile README, profile settings, branch protection).

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

8. **Public Status Page & Enterprise Trust Center** — Task #237:
   - **Status Page** (`/status`): New public-facing page at `szl-holdings/src/pages/status.tsx`. Shows overall platform health banner, per-service status cards with green/amber/red indicators, 30d/90d uptime badges (99.9%+), 90-day uptime bar visualization, active incident list with expandable timeline, resolved incident history, and email subscription form.
   - **Public Status API** (`/api/public/status`): New route at `api-server/src/routes/public-status.ts`. Self-polling every 5 minutes (DB-backed), stores results in `platform_status_checks` table. Calculates 30/90-day uptime percentages. Incident management via `platform_incidents` + `platform_incident_updates` tables. Admin incident CRUD at `POST/PATCH /api/admin/status/incidents`. Email subscriptions stored in `platform_status_subscriptions` table. All tables auto-created on startup.
   - **Trust Center Enhancements** (`/trust`): Added 4 new sections to existing page: (1) Platform Status live link, (2) Subprocessors table (7 vendors with DPA status, category, jurisdiction), (3) Penetration Testing Cadence (quarterly/monthly/continuous/ad-hoc schedule + remediation SLAs by CVSS severity), (4) Responsible Disclosure form with severity selector, submits via contact API. Existing compliance, SLA, and vendor docs sections preserved.
   - Footer nav updated to include "Status" link. Status page accessible without authentication.

10. **Baseline Inventory & Ecosystem Tiering** — Task #262 (Phase 0-1):
   - **System Inventory** (`docs/internal/operations/system-inventory.md`): Complete baseline for all 16 artifacts — name, route, platform, readiness label, environment label, auth status, payments status, analytics status, monitoring status, last build, tier assignment. Single source of truth for operational state.
   - **Tiering Plan** (`docs/internal/operations/tiering-plan.md`): Formal Tier 1/2/3 assignment for every artifact. Tier 1 (Flagship Now): Lyte, Alloy/API Server, SZL Holdings, Shared Libraries. Tier 2 (Pilot-Adjacent): Vessels (expansion vertical) + Lyte Mobile (sole designated mobile client). Tier 3 (Parked/Staged): Aegis, Terra, Carlota Jo, Stephen Site, SZL Holdings Mobile, and all remaining mobile apps. Includes tier advancement criteria and investment rules.
   - **Readiness Standard** (`docs/public/readiness-standard.md`): Updated to canonical 5-level scale — Concept → Prototype → Functional Alpha → Pilot Ready → Production. "Public Beta Candidate" intermediate level removed.
   - **Environment Labeling Standard** (`docs/public/environment-labeling-standard.md`): Confirmed and updated to 4-label model — Live / Pilot / Demo / Seeded Data. "Simulated Data" removed from canonical label table.
   - **ventures.tsx** (`artifacts/szl-holdings/src/pages/ventures.tsx`): Updated product data to include tier labels and readiness badges rendered in card UI. Tier 1 items show amber readiness chip; Tier 2/3 items show muted readiness chip.
   - **ROADMAP.md** and **README.md**: Updated to reference tiering plan, system inventory, readiness standard, and environment labeling standard with proper links.

11. **Phase 10–16 Operations, Security, CI/CD & Launch Readiness** — Operational backbone:
   - **Incident Response Runbook** — `docs/internal/ops/incident-response-runbook.md` — SEV-1 through SEV-4 severity model, escalation logic, founder on-call procedures, alert categories
   - **Support Runbook** — `docs/internal/ops/support-runbook.md` — Support channel routing, tiers, escalation path, on-call procedures, communication templates
   - **Known-Gap Policy & Backup Procedures** — `docs/internal/security/backup-restore.md` — Honest gap register (8 items), backup/restore procedures, diligence disclosure statement
   - **Release Governance** — `docs/releases/release-governance.md` — CI gates (typecheck, lint, audit, secret scan, build), branch strategy, preview environments, deployment matrix, smoke tests, migration gates, rollback procedures
   - **Deployment Matrix** — `docs/releases/deployment-matrix.md` — Per-artifact deployment details, environment config, rollback procedures for web, API, and mobile
   - **Go-Live Sequence** — `docs/internal/ops/go-live-sequence.md` — 8-phase ordered launch checklist with acceptance criteria and go/no-go sign-off table
   - **Analytics Event Taxonomy** — `docs/internal/analytics/event-taxonomy.md` — Canonical event schema, 30+ events across auth, dashboard, signals, workflow, billing, and AI categories
   - **Analytics Route** — `artifacts/api-server/src/routes/analytics.ts` — `POST /api/analytics/event` and `GET /api/analytics/summary` endpoints with event allowlist validation
   - **Analytics Client** — `artifacts/lyte-command-center/src/lib/analytics.ts` — Client-side analytics tracking utility with all core events
   - **Dashboard Analytics** — Dashboard page instrumented with `dashboard_viewed` event
   - **Admin Diagnostics Page** — `artifacts/lyte-command-center/src/pages/admin/diagnostics.tsx` — Real-time system health summary at `/admin/diagnostics` consuming `/api/admin/health-dashboard` and `/api/health/detailed`
   - **Notification Rate Limiting** — `notification-dispatch.ts` updated with per-severity-per-app rate limiting (buckets, window enforcement, suppression logging)
   - **Trust Center** — v4.0 refresh with analytics governance, CI gates, operational incident readiness, and known-gap policy sections
   - **Security Posture** — Refreshed with current state including notification rate-limiting, OTel, self-monitor, and CI gate information
   - **Investor Documents** — `product-readiness.md` updated with full operational readiness table; `data-room-index.md` created as canonical investor data room
   - **SECURITY.md** — Updated with CI security gates, formal security contact section, PGP disclosure

9. **NPS & Contextual Feedback System** — Full in-app feedback collection system:
   - **DB schema** — `lib/db/src/schema/feedback.ts` — `feedback` table (type, score, sentiment, comment, appName, pageUrl, userRole) and `feedback_survey_prefs` table (per-user last survey, snooze, opt-out). Migration: `lib/db/drizzle/0009_feedback_tables.sql`.
   - **API routes** — `artifacts/api-server/src/routes/feedback.ts` — `POST /api/feedback/nps`, `POST /api/feedback/contextual`, `POST /api/feedback/dismiss`, `GET /api/feedback/nps-eligibility`, `GET /api/admin/feedback/analytics`, `GET /api/admin/feedback/list`.
   - **Shared UI components** — `lib/shared-ui/src/nps-survey.tsx` (NpsSurvey, NpsSurveyOverlay, useNpsSurvey hook) and `lib/shared-ui/src/contextual-feedback.tsx` (ContextualFeedback, ContextualFeedbackBar). Exported from `@workspace/shared-ui`.
   - **Admin dashboard** — `FeedbackPanel` in `artifacts/szl-holdings/src/pages/admin.tsx` — NPS score gauge, promoter/passive/detractor breakdown, contextual sentiment breakdown, per-app NPS breakdown, recent comments feed, paginated full feedback table with type filter. Accessible via "Feedback & NPS" nav item in the admin sidebar.
   - **Non-intrusive UX** — 90-day cooldown per user, snooze/dismiss with configurable delay, surveys can be skipped without blocking workflow.
