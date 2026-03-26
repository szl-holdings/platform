# DreamStack Platform

## Overview
The SZL Holdings DreamStack is a pnpm monorepo built with TypeScript, designed as a comprehensive suite of seven applications sharing a common PostgreSQL database, a unified authentication system, and a consistent design system. DreamStack aims to provide a robust and integrated platform for various business operations, including maritime intelligence, security simulation, creative project management, readiness assessment, and incident command. The platform also includes a premium corporate portal for SZL Holdings and a personal portfolio site for Stephen L. The business vision is to offer a scalable, secure, and highly integrated solution that streamlines operations and enhances decision-making across diverse domains.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### Core Technologies

**Frontend:**
- **Framework:** React
- **Build Tool:** Vite
- **Data Fetching:** TanStack React Query
- **Routing:** Wouter
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion for UI animations (fade-ins, parallax, scroll-triggered reveals, hover effects).
- **Icons:** Lucide React
- **Design System (`@workspace/shared-ui`):** Premium dark-mode-forward theme with a specific color palette (navy/indigo/violet), typography (Plus Jakarta Sans, Inter), spacing, glassmorphism effects, gradients, and shadows. Includes premium components like KPI ribbon, chart container, data table shell, status pill, alert banner, modal/drawer, skeleton loader, and premium form elements. Fully responsive with reduced-motion accessibility support.

**Monorepo Management:** pnpm workspaces, Node.js 24, TypeScript 5.9.
**Backend:** Express 5, Drizzle ORM, Zod validation, pino logging.
**Database:** PostgreSQL with Drizzle ORM for data persistence across 40+ tables.
**Authentication:** Session-based with Replit Auth fallback, implementing 7-role RBAC (`super_admin`, `exec`, `ops`, `compliance`, `maintenance`, `analyst`, `viewer`). `super_admin` bypasses all checks.
**API Codegen:** Orval from OpenAPI specification.
**Bundling:** esbuild (CJS) and Vite.

**Schema files** (`lib/db/src/schema/`):
- `auth.ts` — users, roles, user_roles, sessions
- `organizations.ts` — organizations, org_members
- `connectors.ts` — connectors, connector_logs
- `notifications.ts` — notifications, notification_preferences
- `activity.ts` — activity_log, audit_events
- `api_keys.ts` — api_keys
- `feature_flags.ts` — feature_flags, feature_flag_overrides
- `billing.ts` — billing_plans, subscriptions, invoices, entitlements, usage_events
- `files.ts` — files, assets
- `health_checks.ts` — health_checks
- `webhook_events.ts` — webhook_events
- `apps_registry.ts` — apps_registry
- `projects.ts` — projects
- `stephen_site.ts` — stephen_site_testimonials, stephen_site_case_studies, stephen_site_contacts
- `stephen.ts` — stephen_content_blocks, stephen_case_studies, stephen_booking_requests
- `vessels.ts` — vessels_fleets, vessels, vessels_positions, vessels_cargo, vessels_routes, vessels_alert_rules, vessels_alerts, vessels_weather_snapshots, vessels_simulations
- `firestorm.ts` — firestorm_scenarios, firestorm_assessments, firestorm_simulation_runs, firestorm_findings, firestorm_risk_scores, firestorm_campaigns, firestorm_leads, firestorm_analytics
- `lyte.ts` — lyte_workspaces, lyte_signals, lyte_command_cards, lyte_incidents, lyte_playbooks, lyte_recommendations
- `dreamscape.ts` — dreamscape_campaigns, dreamscape_scripts, dreamscape_storyboards, dreamscape_voice_assets, dreamscape_campaign_assets, dreamscape_reviews
- `readiness.ts` — readiness_programs, readiness_dimensions, readiness_score_history, readiness_milestones, readiness_risks, readiness_alerts

**System Design Choices:**
- **Monorepo Structure:** pnpm workspaces for managing multiple applications and shared libraries.
- **Database Schema:** Over 40 tables across 18 schema files (`lib/db`), organized by domain.
- **Service Adapters (`lib/services`):** Consistent pattern for integrating 24 third-party services with auto environment variable detection and mock fallback. Includes health check mechanisms.
- **Intelligence Layer:** Provides 25+ REST endpoints for cross-platform intelligence (threats, geopolitical events, maritime data, news, tech trends, anomalies) and AI-powered endpoints (chat, summarize, sentiment, NER, classify, translate, image-gen, threat-briefing, situation-report, risk-prediction, content-ideas). Utilizes in-memory caching and demo data fallback.
- **AI Copilots:** Domain-specific AI copilots in all 8 apps via `AgentCopilot` component. Each copilot offers a floating button, slide-out chat panel with SSE streaming, markdown rendering, and suggested questions. Supports Replit proxy, OpenAI, and Anthropic providers.
- **Admin Panel (`artifacts/admin-panel`):** A dark-mode operational dashboard with animated health indicators, loading skeletons, and empty states. Provides management for system health, app registry, connectors, user roles, audit logs, webhooks, feature flags, billing, file browsing, environment readiness, and a seed manager.
- **Application Structure:**
    - **SZL Holdings (`szl-holdings`):** Corporate umbrella portal with animated hero, interactive portfolio visualization, filterable catalog, milestone timeline, innovation pillars, leadership section, and contact form. Content is config-driven via JSON files.
    - **Portfolio Site (`project-list`):** Stephen L.'s personal portfolio with particle animations, project showcases, testimonials, and contact information. Optimized for SEO.
    - **Vessels:** Maritime intelligence application.
    - **Firestorm:** Security simulation platform.
    - **Dreamscape:** Creative project management and studio application.
    - **Readiness Report:** Readiness assessment application.
    - **Lyte Command Center:** Incident and signal command center.
    - **Stephen-site:** Additional personal portfolio site.
    - **INCA:** AI Research Command Center for managing AI/ML research projects, experiments, models, and insights. Features executive dashboard with health score, kanban project pipeline, and experiment tracking.

**TypeScript & Composite Projects:**
All packages extend a base `tsconfig.json` with `composite: true` and are listed as project references in the root `tsconfig.json`. This enables cross-package type-checking and efficient incremental builds. Type-checking (`tsc --build --emitDeclarationOnly`) is performed from the root, emitting only `.d.ts` files, with actual JS bundling handled by esbuild/Vite.

**UI/UX Decisions:**
A premium dark-mode-forward design system is implemented via `@workspace/shared-ui`. This includes a specific color palette (navy/indigo/violet), typography (Plus Jakarta Sans, Inter), spacing, glassmorphism effects, gradients, and shadows. Animations leverage Framer Motion for fade-ins, parallax, scroll-triggered reveals, and hover effects. All applications are designed to be fully responsive and support reduced-motion accessibility. Includes `cn()` for class merging.

**Technical Implementations & Feature Specifications:**
- **Database:** Over 40 tables across 18 schema files in `lib/db`, organized by domain (auth, organizations, billing, projects, and app-specific schemas like `vessels`, `firestorm`, `lyte`, `dreamscape`, `readiness`).
- **Authentication & RBAC:** Middleware handles Bearer token sessions and Replit Auth. Seven roles control access (`super_admin`, `exec`, `ops`, `compliance`, `maintenance`, `analyst`, `viewer`), with `super_admin` bypassing all checks.
- **API Server:** Modular routes in `artifacts/api-server`, one file per domain (e.g., `health.ts`, `projects.ts`, `auth.ts`, `connectors.ts`, `vessels.ts`, `inca.ts`, `booking.ts`, `holdings.ts`), utilizing Zod for request/response validation and Drizzle for persistence. Binds to 0.0.0.0 for deployment readiness. Hardened with `helmet` security headers (HSTS, frameguard, referrer-policy), per-route-group `express-rate-limit` (global, auth, write, read), request correlation IDs via `x-correlation-id`, fail-closed CORS in production (requires `CORS_ORIGINS` env var), structured error handling middleware, startup config validation with fail-fast, and health endpoints (`/api/health`, `/api/health/live`, `/api/health/ready`) with DB connectivity and service status checks.
- **Service Adapters:** `lib/services` provides a consistent pattern for integrating 24 third-party services (AI, HuggingFace, weather, shipping, Stripe, Slack, Twilio, Google, etc.), with automatic environment variable detection and fallback to mock modes. ServiceAdapter base includes `runHealthCheck()`, health metrics tracking (lastChecked, errorCount, responseTimeMs, lastSuccessfulCheck, consecutiveFailures, retryState). ServiceRegistry exposes per-app health matrix, connection testing, and unhealthy/demo mode counts. HuggingFace adapter (`lib/services/src/adapters/huggingface.ts`) provides text-gen, summarization, classification, NER, translation, zero-shot, sentiment, Q&A, and image-gen via HuggingFace Inference API. AI adapter prioritizes Replit's OpenAI proxy (`AI_INTEGRATIONS_OPENAI_BASE_URL`), then falls back to `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`/mock.
- **Stripe Billing Integration:** Full checkout/subscription/webhook pipeline in `StripeAdapter` (`lib/services/src/adapters/stripe.ts`) with methods: `createCustomer`, `getCustomerByEmail`, `createCheckoutSession`, `createCustomerPortalSession`, `getSubscription`, `listCustomerSubscriptions`, `listInvoices`, `getCheckoutSession`, `verifyWebhookPayload` (HMAC signature verification). API routes in `artifacts/api-server/src/routes/billing.ts`: `POST /billing/checkout`, `GET /billing/subscription-status`, `POST /billing/customer-portal`, `GET /billing/checkout-session/:sessionId`, `GET /billing/stripe-invoices`, `POST /billing/webhooks` (handles 6 event types: checkout.session.completed, customer.subscription.created/updated/deleted, invoice.paid/payment_failed, payment_intent.succeeded). All methods gracefully fall back to mock data when `STRIPE_SECRET_KEY` is not set. Webhook verification uses Stripe's `v1` HMAC-SHA256 signature scheme with 5-minute timestamp tolerance. Frontend wiring: Stephen site PremiumSection calls checkout API with success/cancel pages; Lyte Commerce page displays live product catalog; Dreamscape campaign billing tab for payment links; Project List pricing section; Admin billing page shows real Stripe data when connected.
- **Intelligence Layer:** `artifacts/api-server/src/routes/intelligence.ts` provides 25+ REST endpoints for cross-platform intelligence (threats, CVEs, geopolitical events, maritime vessels/chokepoints/weather/sanctions, news, tech trends, anomalies, ops heatmap, platform stats, benchmarks, ecosystem health, cultural calendar, daily digest, data flows) plus AI-powered endpoints (chat, summarize, sentiment, NER, classify, translate, image-gen, threat-briefing, situation-report, risk-prediction, content-ideas). Includes in-memory caching with TTL and graceful fallback to rich demo data. Intelligence UI pages integrated across all 8 frontend apps: Firestorm `/threat-intel`, Vessels `/intelligence`, Lyte `/intelligence`, Readiness `/ai-insights`, Dreamscape `/ai-studio`, Stephen Site `IntelligenceSection`, Project List `IntelligenceBar`, Admin Panel `/intelligence`.
- **Observability:** Structured logging via pino. System health endpoint (`/api/admin/system-health`) monitors DB (real probes), storage, auth, connectors, webhooks, notifications, billing status, and parallelized HTTP app route probes via REPLIT_DEV_DOMAIN with 5s timeouts.
- **Feature Gating:** `checkFeatureAccess(orgId, featureKey)` in `artifacts/api-server/src/lib/feature-gate.ts` to manage access based on entitlements (org-level) and usage limits.
- **Admin Panel:** A premium dark-mode ops dashboard (`artifacts/admin-panel`) with animated health indicators (pulsing status dots, sparkline SVG charts, animated counters), loading skeletons, and empty states across all pages. Provides management for System Health (grouped checks, auto-refresh), App Registry, Connectors, Integration Health (unified dashboard with per-connector enable/disable, test buttons, retry state badges, and alerting), Integration Activity Feed (4 filter dropdowns: connector, app, type, status), Users & Roles (gradient avatars, presence dots, search), Audit Log (sortable/filterable, color-coded event types), Webhooks, Feature Flags (spring-physics animated toggles, search), Billing (plans/subscriptions/invoices/entitlements/usage), File browsing, Environment readiness, and a Seed Manager with integrity checking (validating 63 tables). Includes a demo mode top banner and sidebar health warning badges.
- **Portfolio Site (`project-list`):** A React + Vite single-page portfolio for Stephen L., featuring a hero section with particle animations, gradient text, professional summary, services, project portfolio, testimonials, and contact information. Optimized for SEO with Open Graph, Twitter Card, and JSON-LD.
- **Vessels:** Maritime intelligence app with Fleet Dashboard, Vessel Detail, Route Planning, Weather, Simulations, and Alert Center. Includes demo mode banner and integration status sidebar footer.
- **Firestorm:** Security simulation app with Assessment Dashboard, Scenario Library, Simulation Runner, Findings, Risk Scoring, and Executive Reports. Includes demo mode banner and integration status sidebar footer.
- **Dreamscape:** Creative project management/studio app with demo mode banner and integration status sidebar footer.
- **Readiness Report:** Readiness assessment app with demo mode banner and integration status sidebar footer.
- **Lyte Command Center:** Incident/Signal command center with demo mode banner and integration status sidebar footer.
- **Stephen-site:** Additional portfolio/personal site with demo mode banner and integration status sidebar footer.
- **INCA:** AI Research Command Center for managing AI/ML research projects, experiments, models, and insights. Features executive dashboard with health score, kanban project pipeline (Research/Development/Testing/Deployed) with grid/list view toggles, experiment tracking with expandable hypothesis/results panels and training curves, model comparison with radar/spider charts and architecture tables, and categorized insight cards. Uses Space Grotesk + IBM Plex Sans typography with a cerebral violet/indigo color palette. API routes at `/api/inca/*`. Port 24500.
- **SZL Holdings (`szl-holdings`):** Premium corporate umbrella portal at `/szl-holdings/` serving as the investor/client-facing entry point for the SZL ecosystem. Features: animated hero section, interactive constellation/network canvas visualization of portfolio companies, filterable portfolio catalog with status badges (Live/Beta/In Development), animated milestone timeline, innovation pillars section (AI/ML, Cybersecurity, Maritime, Creative Tech, Consulting), leadership/vision section, validated inquiry contact form (posts to `/api/holdings/inquiries`), and full footer. All content is config-driven via JSON files in `src/data/` (portfolio.json, milestones.json, pillars.json, site.json). Uses Framer Motion for scroll-triggered animations. Fully mobile responsive with hamburger navigation. Open Graph and social preview metadata configured.
- **Carlota Jo (`carlota-jo`):** Luxury advisory consulting site for Carlota Jo Consulting. Features: elegant hero with serif typography (Cormorant Garamond) and muted gold/navy palette, 6-service portfolio with expand/collapse details, 4 case study cards, 5-client testimonial display, 3-tier pricing cards (Strategy Session $4,500, Portfolio Review $45,000, Advisory Retainer $18,000), validated contact/inquiry form posting to `/api/booking/inquiries`, multi-step consultation booking flow (service → tier → schedule → details → confirmation), Stripe-ready checkout boundary calling `/api/stripe/checkout` with graceful fallback, success/cancel payment pages. Backend routes in `artifacts/api-server/src/routes/carlota-jo.ts`: `POST /api/booking/inquiries`, `POST /api/booking/reservations`, `GET /api/booking/availability`, `POST /api/stripe/checkout` (returns 503 when Stripe not configured). Seed data in JSON config files under `src/data/`.

**TypeScript & Composite Projects:**
All packages extend a base `tsconfig.json` with `composite: true` and are listed as project references in the root `tsconfig.json`. This enables cross-package type-checking and efficient incremental builds. Type-checking (`tsc --build --emitDeclarationOnly`) is performed from the root, emitting only `.d.ts` files, with actual JS bundling handled by esbuild/Vite.

### UI/UX Design System

A premium dark-mode-forward design system is implemented via `@workspace/shared-ui`.
-   **Theming:** Brand-specific theme tokens (SZL Holdings, Vessels, INCA, Carlota Jo) including a navy/indigo/violet color palette, Plus Jakarta Sans/Inter typography, spacing, glassmorphism effects, gradients, and shadows.
-   **Components:** Premium components include KPI ribbon, chart container, data table shell, status pill, alert banner, modal/drawer, skeleton loader, and advanced form elements.
-   **Animations:** Framer Motion for fade-ins, parallax, scroll-triggered reveals, and hover effects.
-   **Accessibility:** Fully responsive design with support for reduced-motion accessibility.
-   **Utilities:** `cn()` for efficient class merging.

**Technical Implementations & Feature Specifications:**
- **Database:** Over 40 tables across 18 schema files in `lib/db`, organized by domain (auth, organizations, billing, projects, and app-specific schemas like `vessels`, `firestorm`, `lyte`, `dreamscape`, `readiness`).
- **Authentication & RBAC:** Middleware handles Bearer token sessions and Replit Auth. Seven roles control access (`super_admin`, `exec`, `ops`, `compliance`, `maintenance`, `analyst`, `viewer`), with `super_admin` bypassing all checks.
- **API Server:** Modular routes in `artifacts/api-server`, one file per domain (e.g., `health.ts`, `projects.ts`, `auth.ts`, `connectors.ts`, `vessels.ts`, `inca.ts`, `booking.ts`, `holdings.ts`), utilizing Zod for request/response validation and Drizzle for persistence. Binds to 0.0.0.0 for deployment readiness. Hardened with `helmet` security headers (HSTS, frameguard, referrer-policy), per-route-group `express-rate-limit` (global, auth, write, read), request correlation IDs via `x-correlation-id`, fail-closed CORS in production (requires `CORS_ORIGINS` env var), structured error handling middleware, startup config validation with fail-fast, and health endpoints (`/api/health`, `/api/health/live`, `/api/health/ready`) with DB connectivity and service status checks.
- **Service Adapters:** `lib/services` provides a consistent pattern for integrating 24 third-party services (AI, HuggingFace, weather, shipping, Stripe, Slack, Twilio, Google, etc.), with automatic environment variable detection and fallback to mock modes. ServiceAdapter base includes `runHealthCheck()`, health metrics tracking (lastChecked, errorCount, responseTimeMs, lastSuccessfulCheck, consecutiveFailures, retryState). ServiceRegistry exposes per-app health matrix, connection testing, and unhealthy/demo mode counts. HuggingFace adapter (`lib/services/src/adapters/huggingface.ts`) provides text-gen, summarization, classification, NER, translation, zero-shot, sentiment, Q&A, and image-gen via HuggingFace Inference API. AI adapter prioritizes Replit's OpenAI proxy (`AI_INTEGRATIONS_OPENAI_BASE_URL`), then falls back to `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`/mock.
- **Stripe Billing Integration:** Full checkout/subscription/webhook pipeline in `StripeAdapter` (`lib/services/src/adapters/stripe.ts`) with methods: `createCustomer`, `getCustomerByEmail`, `createCheckoutSession`, `createCustomerPortalSession`, `getSubscription`, `listCustomerSubscriptions`, `listInvoices`, `getCheckoutSession`, `verifyWebhookPayload` (HMAC signature verification). API routes in `artifacts/api-server/src/routes/billing.ts`: `POST /billing/checkout`, `GET /billing/subscription-status`, `POST /billing/customer-portal`, `GET /billing/checkout-session/:sessionId`, `GET /billing/stripe-invoices`, `POST /billing/webhooks` (handles 6 event types: checkout.session.completed, customer.subscription.created/updated/deleted, invoice.paid/payment_failed, payment_intent.succeeded). All methods gracefully fall back to mock data when `STRIPE_SECRET_KEY` is not set. Webhook verification uses Stripe's `v1` HMAC-SHA256 signature scheme with 5-minute timestamp tolerance. Frontend wiring: Stephen site PremiumSection calls checkout API with success/cancel pages; Lyte Commerce page displays live product catalog; Dreamscape campaign billing tab for payment links; Project List pricing section; Admin billing page shows real Stripe data when connected.
- **Intelligence Layer:** `artifacts/api-server/src/routes/intelligence.ts` provides 25+ REST endpoints for cross-platform intelligence (threats, CVEs, geopolitical events, maritime vessels/chokepoints/weather/sanctions, news, tech trends, anomalies, ops heatmap, platform stats, benchmarks, ecosystem health, cultural calendar, daily digest, data flows) plus AI-powered endpoints (chat, summarize, sentiment, NER, classify, translate, image-gen, threat-briefing, situation-report, risk-prediction, content-ideas). Includes in-memory caching with TTL and graceful fallback to rich demo data. Intelligence UI pages integrated across all 8 frontend apps: Firestorm `/threat-intel`, Vessels `/intelligence`, Lyte `/intelligence`, Readiness `/ai-insights`, Dreamscape `/ai-studio`, Stephen Site `IntelligenceSection`, Project List `IntelligenceBar`, Admin Panel `/intelligence`.
- **AI Copilots:** Domain-specific AI copilots in all 8 apps via `AgentCopilot` component (`lib/shared-ui/src/copilot.tsx`). Each copilot has a floating FAB button + slide-out glassmorphism chat panel with SSE streaming AI responses, inline markdown rendering, typing indicators, abort support, and suggested questions. Copilot configs (`lib/shared-ui/src/copilot-configs.ts`) define 8 personas: Navigator (Project List), Stephen AI (Stephen Site), Helmsman (Vessels), Sentinel (Firestorm), Beacon (Lyte Command Center), Compass (Readiness Report), Muse (Dreamscape), Nexus (Admin Panel). Streaming endpoint: `POST /api/intelligence/ai/chat/stream` (SSE). AI adapter supports Replit proxy, OpenAI, and Anthropic streaming providers with automatic fallback.
- **Observability:** Structured logging via pino. System health endpoint (`/api/admin/system-health`) monitors DB (real probes), storage, auth, connectors, webhooks, notifications, billing status, and parallelized HTTP app route probes via REPLIT_DEV_DOMAIN with 5s timeouts.
- **Feature Gating:** `checkFeatureAccess(orgId, featureKey)` in `artifacts/api-server/src/lib/feature-gate.ts` to manage access based on entitlements (org-level) and usage limits.
- **Admin Panel:** A premium dark-mode ops dashboard (`artifacts/admin-panel`) with animated health indicators (pulsing status dots, sparkline SVG charts, animated counters), loading skeletons, and empty states across all pages. Provides management for System Health (grouped checks, auto-refresh), App Registry, Connectors, Integration Health (unified dashboard with per-connector enable/disable, test buttons, retry state badges, and alerting), Integration Activity Feed (4 filter dropdowns: connector, app, type, status), Users & Roles (gradient avatars, presence dots, search), Audit Log (sortable/filterable, color-coded event types), Webhooks, Feature Flags (spring-physics animated toggles, search), Billing (plans/subscriptions/invoices/entitlements/usage), File browsing, Environment readiness, and a Seed Manager with integrity checking (validating 63 tables). Includes a demo mode top banner and sidebar health warning badges.
- **Portfolio Site (`project-list`):** A React + Vite single-page portfolio for Stephen L., featuring a hero section with particle animations, gradient text, professional summary, services, project portfolio, testimonials, and contact information. Optimized for SEO with Open Graph, Twitter Card, and JSON-LD.
- **Vessels:** Full maritime intelligence command center with 13 views: Command Center (KPI ribbon, fleet health pillars, live alert feed), Maritime Intel, Fleet APM (TCE/utilization charts), Infrastructure (engine/hull health), Route Planning, Weather Impact, Simulations, Logs Explorer (filterable event stream), Alert Center, Digital Experience (shipment tracking), Synthetics/Compliance (certificate tracker, PSC deficiencies, sanctions), CO2 & Emissions (CII ratings, compliance pathways), and Applied Intelligence (AI briefings, predictive maintenance, forecasts). Role-aware UI with 4 profiles (Exec/Ops/Compliance/Maintenance) via `src/contexts/auth-context.tsx`. Mock data layer (`src/data/mock-data.ts` + `src/data/data-provider.ts`) provides 18 vessels with full profiles, emissions records, maintenance logs, compliance certificates, PSC deficiencies, shipment records, event logs, AI briefings, and forecasts. Sectioned sidebar navigation (Overview/Operations/Monitoring/Compliance & Environment/Intelligence) with role-filtered visibility. Includes demo mode banner and integration status sidebar footer.
- **Firestorm:** Security simulation app with Assessment Dashboard, Scenario Library, Simulation Runner, Findings, Risk Scoring, and Executive Reports. Includes demo mode banner and integration status sidebar footer.
- **Dreamscape:** Creative project management/studio app with demo mode banner and integration status sidebar footer.
- **Readiness Report:** Readiness assessment app with demo mode banner and integration status sidebar footer.
- **Lyte Command Center:** Incident/Signal command center with demo mode banner and integration status sidebar footer.
- **Stephen-site:** Additional portfolio/personal site with demo mode banner and integration status sidebar footer.
- **SZL Holdings (`szl-holdings`):** Premium corporate umbrella portal at `/szl-holdings/` serving as the investor/client-facing entry point for the SZL ecosystem. Features: animated hero section, interactive constellation/network canvas visualization of portfolio companies, filterable portfolio catalog with status badges (Live/Beta/In Development), animated milestone timeline, innovation pillars section (AI/ML, Cybersecurity, Maritime, Creative Tech, Consulting), leadership/vision section, validated inquiry contact form (posts to `/api/holdings/inquiries`), and full footer. All content is config-driven via JSON files in `src/data/` (portfolio.json, milestones.json, pillars.json, site.json). Uses Framer Motion for scroll-triggered animations. Fully mobile responsive with hamburger navigation. Open Graph and social preview metadata configured.


**Shared Libraries:**
- `lib/config`: Maps applications to their connector dependencies.
- `lib/api-spec`: OpenAPI 3.1 specification.
- `lib/api-zod`: Generated Zod schemas from the OpenAPI spec.
- `lib/api-client-react`: Generated React Query hooks and fetch client.

## External Dependencies
- **Database:** PostgreSQL
- **Authentication:** Replit Auth (fallback)
- **Payment Processing:** Stripe (full checkout/subscription/webhook pipeline)
- **AI/NLP:** HuggingFace Inference API (text-gen, summarization, classification, NER, translation, zero-shot, sentiment, Q&A, image-gen), Replit's OpenAI proxy, OpenAI, Anthropic.
- **Weather Data:** Stormglass
- **Shipping Services:** (General adapter)
- **Communication:** Slack, Twilio
- **Productivity/Collaboration:** Google APIs (Calendar, Docs, Drive, Gmail), Notion, Confluence, HubSpot
- **Cloud Storage:** (General adapter for various providers)
- **Monitoring:** (General adapter)
- **Version Control:** GitHub
- **File Storage:** Dropbox, OneDrive
- **Analytics:** Posthog
- **Voice Synthesis:** Elevenlabs
- **Design Collaboration:** Figma
- **Azure Services (Stubs):** Key Vault, Blob Storage, Redis, PostgreSQL, App Insights
