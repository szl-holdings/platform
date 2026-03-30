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
A premium design system via `@workspace/shared-ui` ensures consistent aesthetics. Each app has a **unique visual identity** matching its market lane. Common components include KPI ribbons, chart containers, data table shells, `AgentCopilot`, and advanced form elements. Demo Mode banners and loading states with skeleton placeholders are integrated. Typography: Plus Jakarta Sans (display), Inter (body), Source Serif 4 (luxury/editorial apps).

### Platform Architecture & Features
DreamStack comprises 13 applications sharing a PostgreSQL database, authentication, and design system.
- **Authentication & RBAC:** Middleware manages Bearer token sessions and Replit Auth, with an 11-role RBAC system.
- **API Server:** Modular routes in `artifacts/api-server` use Zod for validation and Drizzle for persistence, including security features like `helmet`, `express-rate-limit`, CORS, and structured error handling.
- **Service Adapters:** `lib/services` provides a pattern for integrating 27 third-party services with environment variable detection and mock fallbacks, including health checks.
- **Stripe Billing:** Full integration for checkout, subscriptions, and webhooks.
- **Intelligence Layer:** Over 40 REST endpoints provide cross-platform intelligence, including government data feeds (CISA KEV, NVD CVE, MITRE ATT&CK, FedRAMP, Census Bureau, BLS, FEMA, USAspending.gov, NOAA, arXiv, Semantic Scholar, PapersWithCode, HuggingFace Hub, SEC EDGAR) with TTL caching and AI-powered endpoints (chat, summarize, sentiment, image-gen, threat-briefing).
- **Live AI Models:** All AI inference uses GPT-5.2 (primary, OpenAI via Replit proxy) and Claude Sonnet 4.6 (Anthropic via Replit proxy). Configured in `artifacts/api-server/src/lib/model-registry.ts` and `lib/services/src/adapters/ai.ts`. Zero mock/setTimeout fakes.
- **Domain AI Agents:** 10 specialized agents in `intelligence.ts`: Helmsman (maritime), Sentinel (security), INCA (research), Muse (creative), Beacon (ops), Terra AI (real estate), MSP Ops (ticketing), Compass (compliance), Carlota AI (strategy), Alloy (platform). All accessible via POST `/api/intelligence/ai/domain-agent` with `agentId` parameter, supports SSE streaming.
- **AI Feature Routes:** `/api/intelligence/ai/campaign-copy` (SSE), `/api/intelligence/ai/advisory` (SSE), `/api/intelligence/ai/readiness-summary` (SSE), `/api/intelligence/ai/ticket-triage`, `/api/intelligence/ai/dark-vessel-analysis`, `/api/intelligence/ai/threat-triage`, `/api/intelligence/ai/risk-assessment`.
- **AI Copilots:** Domain-specific AI copilots (`AgentCopilot` component) are present in all applications, offering SSE streaming, markdown rendering, suggested questions, voice input/output, and mobile optimization.
- **Advisory-Only Architecture:** Infrastructure agents are designed as advisory-only, preventing direct execution of changes and logging recommendations for human approval.
- **Agent Training Studio (Admin Panel):** A dedicated studio allows per-agent training with Q&A pairs, behavioral customization, and performance monitoring.
- **AlloyChat (Admin Panel):** A production multi-model AI operations assistant routes queries to Claude or GPT-5.2 based on task, providing SSE streaming and conversation history persistence.
- **Observability:** Structured logging via pino and a system health endpoint monitor DB, storage, auth, connectors, and app routes. The `@workspace/observability` framework offers 8-pillar domain-native observability (Performance, Business, User Experience, Predictive Health, Operational Awareness, Strategic Insight, Security Posture, Innovation Velocity) across all applications.
- **Feature Gating:** `checkFeatureAccess(orgId, featureKey)` controls access based on entitlements and usage limits.
- **Admin Panel:** Centralized administration for health monitoring, app registry, connectors, user roles, audit logs, webhooks, feature flags, billing, and a Developer Portal.

#### Application Portfolio (13 apps — Task #76 consolidation, visual identities from Task #87)
- **Alloy (NEW):** Unified AI Command Center at `/alloy/`. Bloomberg Terminal-meets-ChatGPT flagship interface. Features: Agent Switcher (10 domain agents), cross-ecosystem chat with SSE streaming, Knowledge Base (RAG), Real-Time Feeds sidebar, Voice input/output, Model Arena (multi-model comparison), Advisory feed, and image generation. Port 25500. Dark theme with cyan (`hsl(195,100%,50%)`) accent.
- **SZL Holdings (`szl-holdings`, route: `/`):** Luxury operating ecosystem flagship. Multi-page architecture with cinematic Aurora hero, interactive Constellation (canvas), venture detail pages, founder page, audience-segmented contact routing, and analytics instrumentation. Pages: `/` (home), `/portfolio` (filtered venture grid), `/founder`, `/ventures/:id` (reusable detail template), `/contact`, `/insights`, `/insights/:slug`, `/changelog`, `/roadmap`. Content model: `src/data/ventures.ts` (8 ventures with KPIs, capabilities, case studies, timeline, use cases). Components: SiteNav, SiteFooter, StatusTag, SectionHeader, KPIStrip, VentureCard, CTAModule, TimelineBlock, CaseStudyBlock, InquiryForm (investor/client/partner/recruiter/general). Analytics abstraction: `src/lib/analytics.ts`. Premium design: Plus Jakarta Sans display, szl-* CSS variables, dark-first with light mode.
- **Stephen Site (`stephen-site`, route: `/stephen/`):** Sharp personal authority platform. High-contrast near-black (#0d0d0d) with amber (#e8a029) signature accent. Instrument Serif serif. Hero: "Systems operator" positioning with "View selected work" / "Read the thesis" CTAs. Sections: Hero, About (career arc + stats), Case Studies (tabular outcomes), Services, Contact.
- **Vessels (`vessels`, route: `/vessels/`):** Maritime intelligence command center — dark navy, icon-rail sidebar (hover-expand), map-dominant layout (MarineTraffic-style). 18 realistic vessels, CII emissions, chokepoint intelligence, port analytics, sanctions monitoring.
- **Firestorm (`firestorm`, route: `/firestorm/`):** SOC Operations Center — dark cybersecurity theme, orange-red accents (CrowdStrike-style). Incidents (Kanban), MITRE ATT&CK, compliance (NIST CSF, FedRAMP), SENTINEL watch, watchlists, forensics timeline. **Compliance & Readiness** at `/cr/*` (absorbed from Readiness Report).
- **Lyte Command Center (`lyte-command-center`, route: `/lyte-command-center/`):** Business Observability Command Center — dark with cyan-400 accents. Monitors approval latency, stalled workflows, ownership gaps, forecast drift, handoff failures, pipeline hygiene, and revenue leakage. Features: Command Overview, Signal Feed with Narrative Intelligence Rail, Action Center (role-aware), Workflow Latency visualization, Ownership Map, Value-at-Risk panel, 5 Use Case experiences, and marketing landing page. Demo mode with $17.6M total value at risk across 12 business signals. Role-based views: Executive, Operations, Delivery & Sales.
- **INCA (`inca`, route: `/inca/`):** AI Research — deep dark violet sidebar (#0d0a1a), 6-item primary nav, W&B-style (Weights & Biases). 10 programs, 25 experiments, neural architecture explorer, benchmarking, GPU monitoring.
- **Terra (`terra`, route: `/terra/`):** Real estate intelligence — earth tones (forest green bg #0e1209, green primary #6ca33a, gold accent, CoStar-inspired). Portfolio dashboard (8 properties), market intelligence, deal pipeline, investment analysis.
- **Dreamscape (`dreamscape`, route: `/dreamscape/`):** Creative production — light purple/white theme, gradient tool cards (Canva-style). 6 campaigns, AI tools (SDXL, RunwayML), Aurora gallery, approval workflows.
- **Carlota Jo (`carlota-jo`, route: `/carlota-jo/`):** Editorial luxury advisory brand — light warm neutral palette: stone-50 (#faf9f7), taupe, warm-gold (#9a7d52), ink-900 (#1c1a17). Cormorant Garamond serif. "Counsel for consequential decisions." CTAs: "Inquire privately" / "Book a discovery conversation." Sections: Hero, Services (grid), Case Studies (rows), Testimonials, ContactForm (minimalist underline inputs), Footer, Perspectives. Header: light bg, ink-colored nav.
- **MSP Command Center (`msp`, route: `/msp/`):** Managed IT services — dark with cyan accents (NinjaOne-style). MRR as hero stat ($184,200), client health table, NOC alerts, service desk, device inventory, contract/SLA tracking.
- **API Server (`api-server`):** Shared backend for all apps.
- **Component Preview Server (`mockup-sandbox`):** Design sandbox for UI component prototyping.

### In-App Collaboration Layer (Task #84)
A platform-wide collaboration system enabling team discussions directly inside each app.
- **`comments` table** (`lib/db/src/schema/comments.ts`): Central store for all comments. Fields: `entityType`, `entityId`, `authorId`, `authorName`, `authorInitials`, `content`, `mentions` (jsonb array), `parentId`, `isDeleted` (boolean), timestamps. Indexed by entity, author, and timestamp.
- **API Routes** (`artifacts/api-server/src/routes/comments.ts`):
  - `GET /api/comments/activity-feed` — cross-app activity feed, filterable by `entityType` (SQL-filtered at DB level)
  - `GET /api/comments/:entityType/:entityId` — comments for a specific item
  - `POST /api/comments/:entityType/:entityId` — create a comment (supports `authorName` for unauthenticated users)
  - `PATCH /api/comments/:id` — edit own comment (requires auth; 401 if unauthenticated; 403 if wrong owner or anon comment)
  - `DELETE /api/comments/:id` — soft-delete own comment (same strict auth rules)
- **Shared UI Components** (`lib/shared-ui/src/collaboration.tsx`, exported as `@workspace/shared-ui/collaboration`):
  - `CommentThread` — collapsible comment panel with avatar/initials, timestamps, @mention highlighting, delete button, and markdown-friendly input
  - `ActivityFeed` — chronological list of recent comments across entities, filterable by entity type, with entity links
- **Integration:** `CommentThread` and `ActivityFeed` components added to all major detail/list pages and dashboards: Vessels (fleet dashboard + vessel detail), Firestorm (SOC dashboard + incidents), MSP (dashboard + service desk tickets with AI triage), Terra (dashboard + property detail), INCA (dashboard + experiments), Dreamscape (workspace + campaign detail "Discussion" tab), Lyte (dashboard + incident expanded view), Readiness (risk register)

### Domain Agent System
AI-powered domain agents are implemented for each application, with specialized system prompts, tool definitions, and connections to existing API routes for data retrieval.

### Shared Libraries
- `lib/shared-ui`: Design system (56 UI components), AgentCopilot, copilot configs, AI components, premium components, IntelligencePhilosophy, `ErrorBoundary`, `useRealtimeChannel`, `useFeatureFlag`, `useNotificationCenter` hooks, `UserButton` (real auth sign-in/out), `AuthGate`
- `lib/replit-auth-web`: `useAuth()` React hook — fetches `/api/auth/user`, triggers login/logout via server-side OIDC redirects. Used by `UserButton` and `AuthGate`.
- `lib/db`: Drizzle ORM schemas, connection pool (min/max/idle timeout/statement timeout), slow-query logging in dev (includes `conversations` + `messages` tables for AlloyChat, and `agent_training_pairs`, `agent_behavior_prefs`, `agent_feedback`, `advisory_audit` for Agent Training Studio)
- `lib/config`: Application-to-connector dependency mapping
- `lib/services`: 27 service adapters with health checks and mock fallback
- `lib/api-spec`: OpenAPI 3.1 specification
- `lib/api-zod`: Generated Zod schemas
- `lib/api-client-react`: Generated React Query hooks
- `lib/integrations-openai-ai-server`: OpenAI server-side integration via Replit AI Integrations (exports `toFile` from openai)
- `lib/integrations-openai-ai-react`: OpenAI React client hooks
- `lib/integrations-anthropic-ai`: Anthropic server-side integration via Replit AI Integrations
- `lib/integrations-gemini-ai`: Gemini AI server-side integration via Replit AI Integrations
- `lib/observability`: DreamStack Intelligence framework

### TypeScript Fixes (Task #63)
- All Vite configs use `const port = Number(process.env.PORT) || 3000` (no runtime throws)
- All 7 Dreamscape pages have explicit `export default`
- `shared-ui` toast hook uses relative imports (not `@/`)
- SZL Holdings uses `domMax` (not `domAnimation`) for layout animations
- API server routes: `alloy-chat.ts`, `ai-safety.ts`, `agent-training.ts`, `gov-data.ts`, `msp-live.ts`, `nuro-mesh.ts`, `stephen.ts` all pass TS type checks

### Universal Notification & Real-Time Alerting System (Task #82)
- **NotificationCenter Hook (`lib/shared-ui/src/notification-center.tsx`):** `useNotificationCenter(appName)` hook auto-fetches from `GET /api/notifications` on mount (gracefully handles 401 for unauthenticated users), subscribes to the `notifications` WebSocket channel for real-time pushes, and exposes `markRead(id)`, `markAllRead()`, and `isConnected` state. Notifications are represented as `LiveNotification` objects with severity levels (`info`/`warning`/`critical`).
- **EcosystemNav Integration:** `EcosystemNav` is self-managing — it calls `useNotificationCenter` internally, requiring no prop changes from apps. The NotificationsPanel now shows: unread count badge, severity-colored dots, timestamps, per-item `actionUrl` navigation, "Mark all read" action, and up to 20 recent notifications.
- **API Endpoints:** `GET /notifications` (list for authenticated user), `POST /notifications` (create, ops-only), `PATCH /notifications/:id/read` (mark single read), `PATCH /notifications/read-all` (mark all read), `DELETE /notifications/:id`. All PATCH/DELETE endpoints publish via WebSocket on change.
- **Domain Notification Generators (`artifacts/api-server/src/lib/domain-notifications.ts`):** Periodic background generators produce realistic domain-specific notifications for 7 apps: Firestorm (threat alerts, SLA breaches, MITRE ATT&CK, compliance drift), Vessels (dark vessel alerts, route deviations, port congestion), MSP (SLA breaches, device offline, contract renewals, NOC escalations), Lyte (P1 incidents, SLO burn rate, anomalies, on-call escalations), Terra (lease expiry, vacancy spikes, market updates, investment alerts), INCA (model drift, training completion, GPU warnings, model registry), Dreamscape (campaign milestones, content approvals, brand voice deviations, social publishing). Notifications publish via WebSocket to all connected clients every ~45s with per-domain jitter. Started in `index.ts` after WebSocket init.
- **Graceful Fallback:** When unauthenticated, `useNotificationCenter` suppresses the 401 error and shows an empty notifications panel. WS notifications still flow to all connected clients regardless of auth state.

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

### Post-Merge Script
`scripts/post-merge.sh` runs `pnpm install --frozen-lockfile` then `yes '' | pnpm --filter db push || true` to handle interactive drizzle-kit prompts automatically.

### Consolidated Content (from GitHub repos)
- **`social-content/`**: 24 banners (LinkedIn/X/Instagram/YouTube + 8-week campaign), 16 hero screenshots, 7 PDF guides (marketing playbook, carousels, profile kit), content calendar, hackajob profile, Lyte logos
- **`infra/`**: Azure Bicep IaC — 9 modules (containerapp, frontdoor, postgres, redis, keyvault, vnet, storage, alerting, staticwebapp) + main.bicep + parameters.json
- **`docs/reports/`**: Platform smoke test and stress test reports
- **`exports/`**: Lyte logo SVG

### Applications Count
13 apps total (post-Alloy addition): Alloy (root `/alloy/`), SZL Holdings (root `/`, absorbs Project List), Stephen Site, Vessels, Firestorm (absorbs Readiness Report), Lyte Command Center (absorbs Admin Control Plane), INCA, Terra, Dreamscape, Carlota Jo, MSP Command Center, API Server, Mockup Sandbox

### Production Readiness
- **Environment Variables:** `NODE_ENV=production` and `LOG_LEVEL=info` set in Replit production environment. `SESSION_SECRET` and `DATABASE_URL` provided as secrets.
- **CORS:** `CORS_ORIGINS` set to `https://*.replit.app,https://*.replit.dev,https://*.repl.co` in production; CORS uses regex matching to support wildcard patterns while respecting `credentials: true`.
- **Security Headers:** Helmet configured with HSTS (in production), strict CSP, referrer policy, and X-Frame-Options deny.
- **Rate Limiting:** Global (200 req/15min), auth (30 req/15min), write (100 req/15min), read (300 req/15min) limiters in production.
- **Health Checks:** `/api/health`, `/api/health/live`, `/api/health/ready` endpoints. Startup check at `/api/healthz`.
- **Database:** Schema synced via drizzle-kit push. Seeded with comprehensive demo data via `scripts/src/seed.ts`.
- **Error Pages:** Branded 404 pages across all apps (styled with Tailwind, dark-mode aware). Global `ErrorBoundary` wraps all app roots for 500-level errors.
- **Live Route Stubs:** Created `readiness-live`, `firestorm-live`, `inca-live`, `vessels-live`, `lyte-live`, `dreamscape-live`, `carlota-live` route files that were imported in `routes/index.ts` but missing from the filesystem.
- **Project List:** Serves as primary landing page at `/` with app directory, category filters, search, and links to all apps.

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
- **Alloy:** conversations, messages (added for Alloy flagship)
- **Collaboration:** comments (entityType, entityId, authorId, authorName, authorInitials, content, mentions jsonb, parentId, isDeleted boolean)

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
