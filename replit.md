# DreamStack Platform

## Overview
DreamStack is a pnpm monorepo containing a suite of 14 interconnected applications built with TypeScript, sharing a common PostgreSQL database, authentication system, and design system. Built for "Stephen L" — technology consultant and founder of SZL Holdings. The platform provides an integrated ecosystem for maritime intelligence, cybersecurity operations, AI research, creative production, organizational readiness, operations command, real estate intelligence, strategic advisory, and corporate/personal portfolios.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### Core Technologies
- **Monorepo:** pnpm workspaces, Node.js 24, TypeScript 5.9.
- **Frontend:** React, Vite, TanStack React Query, Wouter, Tailwind CSS, Framer Motion, Lucide React, Recharts.
- **Backend:** Express 5, Drizzle ORM, Zod validation, pino logging.
- **Database:** PostgreSQL with Drizzle ORM (90+ tables).
- **Authentication:** Session-based with Replit Auth fallback, 7-role RBAC.
- **API Codegen:** Orval from OpenAPI specification.
- **Bundling:** esbuild (CJS) and Vite.

### UI/UX Design System
Premium dark-mode-forward design via `@workspace/shared-ui`. Unified dark background `222 20% 5%` across all dashboard apps (card: `222 18% 8%`, border: `220 15% 14%`, sidebar: `222 20% 4%`). Each app keeps its own primary/accent color. Plus Jakarta Sans display font, Inter body font. Glassmorphism effects, gradients, shadows, and Framer Motion animations. Military/NASA command center aesthetic on operational apps (Vessels, Firestorm, Lyte, INCA, Readiness). Components include KPI ribbon, chart container, data table shell, AgentCopilot, and advanced form elements. All dashboard sidebars show "SZL Holdings Platform" footer. Demo Mode banners use Server icon (amber) for demo mode and WifiOff icon (red) for unconfigured integrations. Loading states use skeleton placeholders (not spinners). API hooks catch 401 errors and return mock/fallback data to prevent infinite loading.

### Applications & Technical Implementation

#### Platform Overview
DreamStack is a pnpm monorepo containing 14 interconnected applications built with TypeScript, sharing a common PostgreSQL database, authentication system, and design system. All apps use real PostgreSQL via Drizzle ORM (90+ tables) — no mock data.

#### Core Infrastructure & Features
- **Authentication & RBAC:** Middleware handles Bearer token sessions and Replit Auth. Eleven roles (`super_admin`, `exec`, `ops`, `compliance`, `maintenance`, `analyst`, `viewer`, `operator`, `seller`, `client_viewer`, `creative_user`) control access.
- **API Server:** Modular routes in `artifacts/api-server`, utilizing Zod for validation and Drizzle for persistence. Includes `helmet`, `express-rate-limit`, CORS, and structured error handling.
- **Service Adapters:** `lib/services` provides a consistent pattern for integrating 24 third-party services with auto environment variable detection and mock fallback.
- **Stripe Billing Integration:** Full checkout/subscription/webhook pipeline for managing billing flows.
- **Intelligence Layer:** 25+ REST endpoints for cross-platform intelligence (threats, geopolitical events, maritime data) and AI-powered endpoints (chat, summarize, sentiment).
- **AI Copilots:** Domain-specific AI copilots (`AgentCopilot` component) in all applications, offering SSE streaming, markdown rendering, and suggested questions.
- **Observability:** Structured logging via pino and system health monitoring (DB, storage, auth, connectors).
- **Feature Gating:** `checkFeatureAccess(orgId, featureKey)` manages access based on entitlements and usage limits.
- **Admin Panel (`admin-panel`, route: `/admin/`):** System administration — health monitoring, app registry, connectors, user roles, audit logs, webhooks, feature flags, billing, environment readiness, and Developer Portal (7-page API documentation: Getting Started, API Explorer, API Keys, Webhooks, Rate Limits, SDK Guide, Plugins).

#### Application Portfolio
- **Project List (`project-list`, route: `/`):** Clean Linear/Vercel-inspired app directory with search, category filtering (Security, AI/ML, Intelligence, Operations, Creative, Platform), grid/list view toggle, app cards with colored icons, status badges (live/beta), feature tags, and launch links. Links to Corporate Site and Stephen Lutar. Spectrum analytics at `/spectrum`.
- **Stephen Site (`stephen-site`, route: `/stephen/`):** Editorial dark-luxury executive portfolio. Sections: Hero (parallax, gold accent, stats bar), About (bio, domain expertise tags, career arc, stats grid), Services (6 engagement models with pricing), Case Studies (4 detailed client outcomes), Thought Leadership (essays/talks/theses), Testimonials (3 client quotes), Contact (form with engagement types). Dark charcoal + gold/amber palette. Playfair Display + Plus Jakarta Sans.
- **SZL Holdings (`szl-holdings`, route: `/szl-holdings/`):** Premium a16z-inspired corporate portal. Sections: Navbar, Hero (animated counters, dual CTAs), Portfolio (filterable grid with metrics), Innovation Pillars (5 verticals with metrics), Timeline (alternating milestones), Leadership (blockquote + values), Contact (validated form), Footer. Deep navy/slate + indigo palette. Plus Jakarta Sans + Inter.
- **Vessels (`vessels`, route: `/vessels/`):** Maritime intelligence command center — 18 realistic vessels, CII emissions (IMO MEPC.352(78)), chokepoint intelligence, port analytics (`/port-analytics`), and sanctions monitoring.
- **Firestorm (`firestorm`, route: `/firestorm/`):** SOC Operations Center — incidents (Kanban), MITRE ATT&CK mapping, compliance frameworks (NIST CSF, FedRAMP), real-time NVD CVE proxy, SENTINEL threat watch (`/sentinel`), watchlists (`/watchlists`), and forensics timeline (`/forensics`).
- **Lyte Command Center (`lyte-command-center`, route: `/lyte-command-center/`):** Operations command — real-time infrastructure telemetry (4 regions, 12 K8s clusters), 24 realistic signals, infrastructure topology (`/topology`), Meridian analytics (`/meridian-analytics`), and cost optimization.
- **INCA (`inca`, route: `/inca/`):** AI Research Command Center — 10 programs (TITAN LLM, AEGIS Nav), 25 experiments with ML hyperparameters, neural architecture explorer (`/neural-explorer`), benchmarking (`/benchmarking`), and compute utilization (A100/H100).
- **Readiness Report (`readiness-report`, route: `/readiness-report/`):** Organizational readiness — NIST CSF/ISO 27001/CMMC frameworks, vital signs dashboard (`/vital-signs`), and Zero-Trust Architecture Migration programs.
- **Terra (`terra`, route: `/terra/`):** Real estate intelligence — portfolio dashboard (8 properties), market intelligence, deal pipeline, investment analysis (`/investment-analysis`), and revenue/occupancy analytics.
- **Dreamscape (`dreamscape`, route: `/dreamscape/`):** Creative production platform — 6 campaigns, AI tools (SDXL, RunwayML), Aurora generative effects gallery (`/aurora`), and department-based approval workflows.
- **Carlota Jo (`carlota-jo`, route: `/carlota-jo/`):** Strategic advisory — "Counsel for Consequential Decisions" for Fortune 500/sovereign wealth. Porter's Five Forces, BCG matrix, COSO ERM frameworks, and advisory intel page (`/advisory`).
- **MSP Command Center (`msp`, route: `/msp/`):** Managed Service Provider platform — client management, service desk, device inventory, contract/SLA tracking, NOC operations, revenue analytics, and technician dispatch.

### Database Schema
90+ tables across 20+ schema files in `lib/db/src/schema/`:
- **Auth:** users, sessions, roles, user_roles, organizations, org_members
- **Billing:** billing_plans, subscriptions, invoices, entitlements, usage_events
- **Vessels:** vessels, fleets, positions, routes, alerts, cargo, simulations, weather, alert_rules
- **Firestorm:** scenarios, assessments, simulation_runs, findings, risk_scores, incidents, compliance_controls, alerts, campaigns, leads, analytics
- **Lyte:** workspaces, signals, command_cards, incidents, playbooks, recommendations
- **Dreamscape:** campaigns, scripts, storyboards, voice_assets, campaign_assets, reviews
- **Readiness:** programs, dimensions, score_history, milestones, risks, alerts
- **Stephen/Holdings:** content_blocks, case studies, booking_requests, site_contacts, testimonials, portfolio_items

### Technical Implementations & Feature Specifications
- **Authentication & RBAC:** Middleware handles Bearer token sessions and Replit Auth. Seven roles (`super_admin`, `exec`, `ops`, `compliance`, `maintenance`, `analyst`, `viewer`) control access.
- **Service Adapters:** `lib/services` provides a consistent pattern for integrating 24 third-party services with auto environment variable detection and mock fallback, including health check mechanisms.
- **Stripe Billing Integration:** Full checkout/subscription/webhook pipeline with API routes for managing billing flows and webhook verification.
- **Intelligence Layer:** Provides 25+ REST endpoints for cross-platform intelligence (threats, geopolitical events, maritime data, news, tech trends) and AI-powered endpoints (chat, summarize, sentiment, image-gen, threat-briefing). Features in-memory caching and demo data fallback.
- **AI Copilots:** Domain-specific AI copilots (`AgentCopilot` component) in all 8 applications, offering a floating button, slide-out chat panel with SSE streaming, markdown rendering, and suggested questions. Supports Replit proxy, OpenAI, and Anthropic providers.
- **AlloyChat (Admin Panel `/alloy-chat`):** Production multi-model AI operations assistant. Routes to Claude (claude-sonnet-4-6) for analysis/reasoning/code tasks and GPT-5.2 for general ops queries. SSE streaming with real-time typing effect. Conversation history persisted in PostgreSQL `conversations`+`messages` tables. Dynamic system prompt assembler pulls live state from admin API endpoints (overview, system-health, connectors, feature-flags) before every call. Contextual suggested prompts based on current health alerts. In-page markdown renderer with code blocks, tables, copy buttons. Model selector (Auto/Claude/GPT-5.2) with per-message model badge. Backend at `artifacts/api-server/src/routes/alloy-chat.ts`, frontend at `artifacts/admin-panel/src/pages/alloy-chat.tsx`.
- **Observability (DreamStack Intelligence):** Structured logging via pino and a system health endpoint monitoring DB, storage, auth, connectors, and app routes. The DreamStack Intelligence framework (`@workspace/observability`) provides **8-pillar** domain-native observability (Performance Intelligence, Business Observability, User Experience Intelligence, Predictive Health, Operational Awareness, Strategic Insight, **Security Posture**, **Innovation Velocity**) across all 11 apps. Inspired by New Relic Business Observability, Dynatrace Davis AI/Smartscape, Datadog Watchdog/APM, and DORA metrics. Each app has domain-specific metrics, KPIs, and health signals with an `/observability` page. Lyte Command Center aggregates cross-portfolio health. Admin Panel provides system-wide observability. API endpoints at `/api/observability/:appSlug`. Philosophy component at `@workspace/shared-ui/intelligence-philosophy`. 5-level maturity model (Reactive → Proactive → Predictive → Intelligent → Autonomous).
- **Feature Gating:** `checkFeatureAccess(orgId, featureKey)` manages access based on entitlements and usage limits.

### Performance Optimizations
- **Shared UI:** 56 shadcn/ui components consolidated in `@workspace/shared-ui` (no local `src/components/ui/` in apps)
- **Code Splitting:** All 13 routed apps use `React.lazy()` + `Suspense` for route-level code splitting
- **Framer Motion:** szl-holdings uses `LazyMotion` + `m` components (lighter than `motion`); all apps split framer-motion into `vendor-motion` chunk
- **Recharts:** Lazy-loaded via route-level code splitting + isolated in `vendor-charts` chunk
- **Dependency Catalog:** recharts, react-hook-form, framer-motion, lucide-react normalized via pnpm catalog
- **Vite Build:** `manualChunks` splits vendor code into recharts/d3, framer-motion, radix-ui, tanstack, lucide-react, and react chunks; `cssCodeSplit` enabled

### Shared Libraries
- `lib/shared-ui`: Design system (56 UI components), AgentCopilot, copilot configs, AI components, premium components, IntelligencePhilosophy, `ErrorBoundary`, `useRealtimeChannel`, `useFeatureFlag` hooks
- `lib/db`: Drizzle ORM schemas, connection pool (min/max/idle timeout/statement timeout), slow-query logging in dev (includes `conversations` + `messages` tables for AlloyChat)
- `lib/config`: Application-to-connector dependency mapping
- `lib/services`: 24 service adapters with health checks and mock fallback
- `lib/api-spec`: OpenAPI 3.1 specification
- `lib/api-zod`: Generated Zod schemas
- `lib/api-client-react`: Generated React Query hooks
- `lib/integrations-openai-ai-server`: OpenAI server-side integration via Replit AI Integrations
- `lib/integrations-openai-ai-react`: OpenAI React client hooks
- `lib/integrations-anthropic-ai`: Anthropic server-side integration via Replit AI Integrations

### Infrastructure Hardening (Task #58)
- **Graceful Shutdown:** SIGTERM/SIGINT handlers drain HTTP connections, flush job queue, and close DB pool within 10s
- **Response Compression:** `compression` middleware (gzip) on all responses ≥1KB
- **WebSocket Layer:** `/ws` endpoint with channel-based pub/sub (`WS_CHANNELS`), heartbeat/reconnect logic
- **API Documentation:** Swagger UI at `/api/docs`, raw OpenAPI JSON at `/api/docs.json`
- **Error Code Taxonomy:** `lib/error-codes.ts` — structured codes (AUTH_001, BILLING_002, etc.)
- **CI/CD Pipeline:** `.github/workflows/ci.yml` (typecheck, lint, build, security audit, migration check) and `.github/workflows/security.yml` (weekly dep scan, secret detection)
- **Error Boundaries:** `ErrorBoundary` from `@workspace/shared-ui/error-boundary` wraps all 13 React apps
- **Feature Flags Runtime:** `/api/feature-flags/check/:key` endpoint for client-side flag evaluation; `useFeatureFlag` React hook
- **Background Job Queue:** In-process `jobQueue` with retry backoff for WEBHOOK_DELIVERY, REPORT_GENERATION, NOTIFICATION_DISPATCH, EMAIL_SEND; API at `/api/jobs/stats`, `/api/jobs/recent`, `/api/jobs/enqueue`
- **DB Pool Tuning:** Configurable via `DB_POOL_MIN`, `DB_POOL_MAX`, `DB_IDLE_TIMEOUT_MS`, `DB_CONNECT_TIMEOUT_MS`, `DB_STATEMENT_TIMEOUT_MS`

### Post-Merge Script
`scripts/post-merge.sh` runs `pnpm install --frozen-lockfile` then `yes '' | pnpm --filter db push || true` to handle interactive drizzle-kit prompts automatically.

- `lib/observability`: DreamStack Intelligence framework with metric collectors, 8-pillar interfaces (incl. Security Posture + Innovation Velocity), domain configs for all 11 apps (vessels, firestorm, inca, dreamscape, carlota-jo, szl-holdings, readiness-report, stephen-site, lyte-command-center, msp, terra), React provider/hooks, and ObservabilityPanel component.

### Consolidated Content (from GitHub repos)
- **`social-content/`**: 24 banners (LinkedIn/X/Instagram/YouTube + 8-week campaign), 16 hero screenshots, 7 PDF guides (marketing playbook, carousels, profile kit), content calendar, hackajob profile, Lyte logos
- **`infra/`**: Azure Bicep IaC — 9 modules (containerapp, frontdoor, postgres, redis, keyvault, vnet, storage, alerting, staticwebapp) + main.bicep + parameters.json
- **`docs/reports/`**: Platform smoke test and stress test reports
- **`exports/`**: Lyte logo SVG

### Applications Count
15 apps total: Project List, Stephen Site, SZL Holdings, Vessels, Firestorm, Lyte Command Center, INCA, Readiness Report, Terra, Dreamscape, Carlota Jo, Admin Panel, MSP Command Center, API Server, Mockup Sandbox

## External Dependencies
- **Database:** PostgreSQL
- **Authentication:** Replit Auth
- **Payment Processing:** Stripe
- **AI/NLP:** HuggingFace Inference API, Replit's OpenAI proxy, OpenAI, Anthropic
- **Weather Data:** Stormglass
- **Communication:** Slack, Twilio
- **Productivity/Collaboration:** Google APIs (Calendar, Docs, Drive, Gmail), Notion, Confluence, HubSpot
- **Cloud Storage:** Dropbox, OneDrive
- **Analytics:** Posthog
- **Voice Synthesis:** Elevenlabs
- **Design Collaboration:** Figma
- **Azure Services (Stubs):** Key Vault, Blob Storage, Redis, PostgreSQL, App Insights
