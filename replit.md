# DreamStack Platform

## Overview
DreamStack is a pnpm monorepo containing a suite of 12 interconnected applications built with TypeScript, sharing a common PostgreSQL database, authentication system, and design system. Built for "Stephen L" — technology consultant and founder of SZL Holdings. The platform provides an integrated ecosystem for maritime intelligence, cybersecurity operations, AI research, creative production, organizational readiness, operations command, real estate intelligence, strategic advisory, and corporate/personal portfolios.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### Core Technologies
The platform is built as a pnpm monorepo using Node.js 24 and TypeScript 5.9.
- **Frontend:** React, Vite, TanStack React Query, Wouter, Tailwind CSS, Framer Motion, Lucide React, Recharts.
- **Backend:** Express 5, Drizzle ORM, Zod validation, pino logging.
- **Database:** PostgreSQL with Drizzle ORM (90+ tables).
- **Authentication:** Real Replit Auth (OIDC/PKCE), session-based with cookie+Bearer token, 7-role RBAC. Fallback to DevAuthProvider in local dev (when REPL_ID is absent).
- **API Codegen:** Orval from OpenAPI specification.
- **Bundling:** esbuild (CJS) and Vite.

### UI/UX Design System
A premium, dark-mode-forward design system is implemented via `@workspace/shared-ui`, ensuring a unified aesthetic across all dashboard applications. This includes a consistent dark background, distinct card and border colors, and a sidebar. Each app retains its unique primary/accent color. Typography utilizes Plus Jakarta Sans for display and Inter for body text. Design elements incorporate glassmorphism effects, gradients, shadows, and Framer Motion animations. Operational applications (Vessels, Firestorm, Lyte, INCA, Readiness) adopt a military/NASA command center aesthetic. Common components include KPI ribbons, chart containers, data table shells, `AgentCopilot`, and advanced form elements. Demo Mode banners and loading states with skeleton placeholders are also integrated.

### Platform Architecture & Features
DreamStack comprises 14 applications sharing a PostgreSQL database, authentication, and design system.
- **Authentication & RBAC:** Middleware manages Bearer token sessions and Replit Auth, with an 11-role RBAC system.
- **API Server:** Modular routes in `artifacts/api-server` use Zod for validation and Drizzle for persistence, including security features like `helmet`, `express-rate-limit`, CORS, and structured error handling.
- **Service Adapters:** `lib/services` provides a pattern for integrating 27 third-party services with environment variable detection and mock fallbacks, including health checks.
- **Stripe Billing:** Full integration for checkout, subscriptions, and webhooks.
- **Intelligence Layer:** Over 40 REST endpoints provide cross-platform intelligence, including government data feeds (CISA KEV, NVD CVE, MITRE ATT&CK, FedRAMP, Census Bureau, BLS, FEMA, USAspending.gov, NOAA, arXiv, Semantic Scholar, PapersWithCode, HuggingFace Hub, SEC EDGAR) with TTL caching and AI-powered endpoints (chat, summarize, sentiment, image-gen, threat-briefing).
- **AI Copilots:** Domain-specific AI copilots (`AgentCopilot` component) are present in all applications, offering SSE streaming, markdown rendering, suggested questions, voice input/output, and mobile optimization.
- **Advisory-Only Architecture:** Infrastructure agents are designed as advisory-only, preventing direct execution of changes and logging recommendations for human approval.
- **Agent Training Studio (Admin Panel):** A dedicated studio allows per-agent training with Q&A pairs, behavioral customization, and performance monitoring.
- **AlloyChat (Admin Panel):** A production multi-model AI operations assistant routes queries to Claude or GPT-5.2 based on task, providing SSE streaming and conversation history persistence.
- **Observability:** Structured logging via pino and a system health endpoint monitor DB, storage, auth, connectors, and app routes. The `@workspace/observability` framework offers 8-pillar domain-native observability (Performance, Business, User Experience, Predictive Health, Operational Awareness, Strategic Insight, Security Posture, Innovation Velocity) across all applications.
- **Feature Gating:** `checkFeatureAccess(orgId, featureKey)` controls access based on entitlements and usage limits.
- **Admin Panel:** Centralized administration for health monitoring, app registry, connectors, user roles, audit logs, webhooks, feature flags, billing, and a Developer Portal.

#### Application Portfolio (12 apps — Task #76 consolidation)
- **SZL Holdings (`szl-holdings`, route: `/`):** Ecosystem root. App directory (absorbed from Project List) + premium corporate portal. App directory has search, category filtering, grid/list view, status badges, and launch links. Corporate site at `/corporate` (Navbar, Hero, Portfolio, Innovation Pillars, Timeline, Leadership, Contact, Footer). Spectrum analytics, Changelog, Roadmap pages. Absorbs: Project List.
- **Stephen Site (`stephen-site`, route: `/stephen/`):** Editorial dark-luxury executive portfolio. Sections: Hero (parallax, gold accent, stats bar), About (bio, domain expertise tags, career arc, stats grid), Services (6 engagement models with pricing), Case Studies (4 detailed client outcomes), Thought Leadership (essays/talks/theses), Testimonials (3 client quotes), Contact (form with engagement types). Dark charcoal + gold/amber palette. Playfair Display + Plus Jakarta Sans.
- **Vessels (`vessels`, route: `/vessels/`):** Maritime intelligence command center — 18 realistic vessels, CII emissions (IMO MEPC.352(78)), chokepoint intelligence, port analytics (`/port-analytics`), and sanctions monitoring.
- **Firestorm (`firestorm`, route: `/firestorm/`):** SOC Operations Center — incidents (Kanban), MITRE ATT&CK mapping, compliance frameworks (NIST CSF, FedRAMP), real-time NVD CVE proxy, SENTINEL threat watch (`/sentinel`), watchlists (`/watchlists`), forensics timeline (`/forensics`). **Compliance & Readiness** section at `/cr/*` (absorbed from Readiness Report): readiness dashboard, framework scorecards, compliance risks, vendor risk, milestones/trends, AI insights.
- **Lyte Command Center (`lyte-command-center`, route: `/lyte-command-center/`):** Operations command — real-time infrastructure telemetry (4 regions, 12 K8s clusters), 24 realistic signals, infrastructure topology (`/topology`), Meridian analytics (`/meridian-analytics`), and cost optimization. **Administration** section at `/admin/*` and **Developer** section at `/developer/*` (absorbed from Admin Control Plane): health monitoring, app registry, connectors, user roles, audit logs, webhooks, feature flags, billing, environment readiness, and Developer Portal (Getting Started, API Explorer, API Keys, Webhooks, Rate Limits, SDK Guide, Plugins).
- **INCA (`inca`, route: `/inca/`):** AI Research Command Center — 10 programs (TITAN LLM, AEGIS Nav), 25 experiments with ML hyperparameters, neural architecture explorer (`/neural-explorer`), benchmarking (`/benchmarking`), and compute utilization (A100/H100).
- **Terra (`terra`, route: `/terra/`):** Real estate intelligence — portfolio dashboard (8 properties), market intelligence, deal pipeline, investment analysis (`/investment-analysis`), and revenue/occupancy analytics.
- **Dreamscape (`dreamscape`, route: `/dreamscape/`):** Creative production platform — 6 campaigns, AI tools (SDXL, RunwayML), Aurora generative effects gallery (`/aurora`), and department-based approval workflows.
- **Carlota Jo (`carlota-jo`, route: `/carlota-jo/`):** Strategic advisory — "Counsel for Consequential Decisions" for Fortune 500/sovereign wealth. Porter's Five Forces, BCG matrix, COSO ERM frameworks, and advisory intel page (`/advisory`).
- **MSP Command Center (`msp`, route: `/msp/`):** Managed Service Provider platform — client management, service desk, device inventory, contract/SLA tracking, NOC operations, revenue analytics, and technician dispatch.
- **API Server (`api-server`):** Shared backend for all apps.
- **Component Preview Server (`mockup-sandbox`):** Design sandbox for UI component prototyping.

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
- **Service Adapters:** `lib/services` provides a consistent pattern for integrating 27 third-party services with auto environment variable detection and mock fallback, including health check mechanisms. New adapters: `CisaAdapter` (CISA KEV — free, no key), `ArxivAdapter` (arXiv XML API — free, no key), `AbuseIPDBAdapter` (IP reputation — free tier, optional key `ABUSEIPDB_API_KEY`).
- **Stripe Billing Integration:** Full checkout/subscription/webhook pipeline with API routes for managing billing flows and webhook verification.
- **Intelligence Layer (Live Government Data Hub):** Provides 40+ REST endpoints for cross-platform intelligence. Live government feeds include: CISA KEV (1,554 mandatory patch entries), NVD CVE database, MITRE ATT&CK techniques, FedRAMP Marketplace, Census Bureau ACS, BLS employment, FEMA National Risk Index, USAspending.gov federal contracts, NOAA marine buoys, arXiv research papers (XML API), Semantic Scholar citations, PapersWithCode benchmarks, HuggingFace Hub models, and SEC EDGAR REIT filings. All with TTL caching and enriched demo fallback. New route files: `gov-data.ts` (hub), `terra.ts` (real estate), `msp-live.ts` (MSP contracts), `readiness-live.ts` (NIST compliance). Includes AI-powered endpoints (chat, summarize, sentiment, image-gen, threat-briefing).
- **Cross-App Intelligence Mesh:** `/api/intelligence/cross-app-correlation` correlates data across all app lanes (maritime×security, research×security, real estate×risk, government×cyber). `/api/intelligence/unified-feed` aggregates 14 signals from 5 source types. `/api/intelligence/data-flow` maps 28 live data connections.
- **AI Copilots:** Domain-specific AI copilots (`AgentCopilot` component) in all 9 applications, offering a floating button, slide-out chat panel with SSE streaming, markdown rendering, and suggested questions. Supports Replit proxy, OpenAI, and Anthropic providers. Extended with voice input (Whisper STT), voice output (OpenAI TTS), push-to-talk recording, mobile optimization with safe-area/touch support, swipe-to-close gesture, thumbs up/down feedback, and advisory-mode safety layer with visual badges and runbook generation.
- **Agent Training Studio (Admin Panel `/agent-training`):** Per-agent training studio with curated Q&A pairs, behavioral preference customization (tone, detail level, jargon, response length, custom instructions), performance dashboard with ratings, and Advisory Audit Trail. Injected into agent system prompts at inference time. Backend at `artifacts/api-server/src/routes/agent-training.ts`. DB tables: `agent_training_pairs`, `agent_behavior_prefs`, `agent_feedback`, `advisory_audit`.
- **Advisory-Only Architecture:** Infrastructure agents (Helmsman, Sentinel, Beacon, Nexus) are marked `isAdvisoryAgent: true`. Copilot detects destructive/advisory keywords and shows colored badges (informational/advisory/action-required) on responses. Advisory Audit Trail logs all recommendations with risk level, runbook, and human approval status. Architecturally prevents agents from executing changes.
- **Voice API Endpoints:** `POST /api/agent-training/transcribe` — Whisper STT for copilot voice input. `POST /api/agent-training/tts` — OpenAI TTS for copilot voice responses. Each agent has a unique voice profile (alloy/echo/fable/onyx/nova/shimmer).
- **Per-agent Feedback:** Every assistant message in all copilots shows thumbs up/down buttons (visible on hover). Ratings POST to `/api/agent-training/feedback` and are tracked in `agent_feedback` table by `agentId`.
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
>>>>>>> 855a32d (Task #76: Ecosystem consolidation — 15 apps → 12 apps)

### Domain Agent System
AI-powered domain agents are implemented for each application, with specialized system prompts, tool definitions, and connections to existing API routes for data retrieval.

### Shared Libraries
<<<<<<< HEAD
Key shared libraries (`lib/`) provide:
- `shared-ui`: Design system, `AgentCopilot`, AI components, hooks, `ErrorBoundary`.
- `db`: Drizzle ORM schemas, connection pool.
- `config`: Application-to-connector dependency mapping.
- `services`: 27 service adapters.
- `api-spec`, `api-zod`, `api-client-react`: OpenAPI specification, Zod schemas, React Query hooks.
- `integrations-openai-ai-server`, `integrations-openai-ai-react`, `integrations-anthropic-ai`, `integrations-gemini-ai`: AI integration packages.
- `observability`: DreamStack Intelligence framework.
=======
- `lib/shared-ui`: Design system (56 UI components), AgentCopilot, copilot configs, AI components, premium components, IntelligencePhilosophy, `ErrorBoundary`, `useRealtimeChannel`, `useFeatureFlag` hooks, `UserButton` (real auth sign-in/out), `AuthGate`
- `lib/replit-auth-web`: `useAuth()` React hook — fetches `/api/auth/user`, triggers login/logout via server-side OIDC redirects. Used by `UserButton` and `AuthGate`.
- `lib/db`: Drizzle ORM schemas, connection pool (min/max/idle timeout/statement timeout), slow-query logging in dev (includes `conversations` + `messages` tables for AlloyChat, and `agent_training_pairs`, `agent_behavior_prefs`, `agent_feedback`, `advisory_audit` for Agent Training Studio)
- `lib/config`: Application-to-connector dependency mapping
- `lib/services`: 24 service adapters with health checks and mock fallback
- `lib/api-spec`: OpenAPI 3.1 specification
- `lib/api-zod`: Generated Zod schemas
- `lib/api-client-react`: Generated React Query hooks
- `lib/integrations-openai-ai-server`: OpenAI server-side integration via Replit AI Integrations (exports `toFile` from openai)
- `lib/integrations-openai-ai-react`: OpenAI React client hooks
- `lib/integrations-anthropic-ai`: Anthropic server-side integration via Replit AI Integrations
- `lib/integrations-gemini-ai`: Gemini AI server-side integration via Replit AI Integrations
>>>>>>> 1c7865d (feat: replace DevAuthProvider with real Replit Auth (OIDC/PKCE))

### TypeScript Fixes (Task #63)
- All Vite configs use `const port = Number(process.env.PORT) || 3000` (no runtime throws)
- All 7 Dreamscape pages have explicit `export default`
- `shared-ui` toast hook uses relative imports (not `@/`)
- SZL Holdings uses `domMax` (not `domAnimation`) for layout animations
- API server routes: `alloy-chat.ts`, `ai-safety.ts`, `agent-training.ts`, `gov-data.ts`, `msp-live.ts`, `nuro-mesh.ts`, `stephen.ts` all pass TS type checks
- Integration packages (`openai`, `anthropic`, `gemini`): replaced `pRetry.AbortError` with named `AbortError` import; replaced `types:["node"]` with `skipLibCheck:true`
- `stephen.ts` route: Zod schemas defined locally; `zod` added as api-server dependency
- `stephen-site/App.tsx`: Home lazy import fixed to use named export `m.Home`

### Infrastructure Hardening (Task #58)
- **Graceful Shutdown:** SIGTERM/SIGINT handlers drain HTTP connections, flush job queue, and close DB pool within 10s
- **Response Compression:** `compression` middleware (gzip) on all responses ≥1KB
- **WebSocket Layer:** `/ws` endpoint with channel-based pub/sub (`WS_CHANNELS`), heartbeat/reconnect logic
- **API Documentation:** Swagger UI at `/api/docs`, raw OpenAPI JSON at `/api/docs.json`
- **Error Code Taxonomy:** `lib/error-codes.ts` — structured codes (AUTH_001, BILLING_002, etc.)
- **CI/CD Pipeline:** `.github/workflows/ci.yml` (typecheck, lint, build, security audit, migration check) and `.github/workflows/security.yml` (weekly dep scan, secret detection)
- **Error Boundaries:** `ErrorBoundary` from `@workspace/shared-ui/error-boundary` wraps all React apps
- **Feature Flags Runtime:** `/api/feature-flags/check/:key` endpoint for client-side flag evaluation; `useFeatureFlag` React hook
- **Background Job Queue:** In-process `jobQueue` with retry backoff for WEBHOOK_DELIVERY, REPORT_GENERATION, NOTIFICATION_DISPATCH, EMAIL_SEND
- **DB Pool Tuning:** Configurable via `DB_POOL_MIN`, `DB_POOL_MAX`, `DB_IDLE_TIMEOUT_MS`, `DB_CONNECT_TIMEOUT_MS`, `DB_STATEMENT_TIMEOUT_MS`

### Post-Merge Script
`scripts/post-merge.sh` runs `pnpm install --frozen-lockfile` then `yes '' | pnpm --filter db push || true` to handle interactive drizzle-kit prompts automatically.

### Consolidated Content (from GitHub repos)
- **`social-content/`**: 24 banners (LinkedIn/X/Instagram/YouTube + 8-week campaign), 16 hero screenshots, 7 PDF guides (marketing playbook, carousels, profile kit), content calendar, hackajob profile, Lyte logos
- **`infra/`**: Azure Bicep IaC — 9 modules (containerapp, frontdoor, postgres, redis, keyvault, vnet, storage, alerting, staticwebapp) + main.bicep + parameters.json
- **`docs/reports/`**: Platform smoke test and stress test reports
- **`exports/`**: Lyte logo SVG

### Applications Count
12 apps total (post-Task #76 consolidation): SZL Holdings (root `/`, absorbs Project List), Stephen Site, Vessels, Firestorm (absorbs Readiness Report), Lyte Command Center (absorbs Admin Control Plane), INCA, Terra, Dreamscape, Carlota Jo, MSP Command Center, API Server, Mockup Sandbox

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
- **Azure Services:** Key Vault, Blob Storage, Redis, PostgreSQL, App Insights (used as stubs within the infrastructure).