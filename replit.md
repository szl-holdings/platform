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
- **Stephen Lutar:** Near-monochrome, founder identity. Includes a native mobile app (`artifacts/stephen-mobile`, Expo/React Native, port 8083) — a founder digital card and portfolio showcase with sections: Digital Card, Portfolio, Thesis, Career Timeline, and Contact. Dark monochrome theme (#0a0a0a) with warm silver accent (#c4a97e). Workflow: `artifacts/stephen-mobile: expo`.
- **Aegis:** Indigo/violet, Unified Defense & Intelligence Command, consolidating Security Operations (Firestorm), Managed Operations (Rosie/MSP), and Intelligence Engine (INCA).

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
- **Email Delivery System:** Triple-failover email chain in `artifacts/api-server/src/lib/email.ts` — SendGrid → Resend → SMTP nodemailer. Provider selected via `EMAIL_PROVIDER` env var or auto-detected. Contact form submissions from Stephen Site (`/api/stephen/booking-requests`) and Carlota Jo (`/api/booking/inquiries`) fire dual emails: confirmation to submitter + admin notification. Email brand templates exist for both properties. Configure via `SENDGRID_API_KEY`, `RESEND_API_KEY`, or `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`. Admin inboxes configurable via `STEPHEN_ADMIN_EMAIL` and `CARLOTA_ADMIN_EMAIL` env vars.
- **Alloy Platform Core — Orchestration Engine:** Canonical shared data model, ingestion layer, normalization pipeline, and workflow orchestration engine.

### Database Schema
Over 97 tables across 21+ schema files, covering authentication, billing, various application-specific data, Alloy Chat, Collaboration, and MSP, including Azure/Dataverse specific tables.

### Aegis — Consolidated Defense & Intelligence Platform
Aegis (artifact slug `firestorm`, path `/firestorm/`) unifies Security Operations (SOC), Managed Operations (Ops), and Intelligence Engine (Intel) into a single platform with distinct modules and API routes.

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