# DreamStack Platform

## Overview
SZL Command Systems — a pnpm monorepo containing a suite of 13 interconnected applications built with TypeScript, sharing a common PostgreSQL database, authentication system, and design system. Built for Stephen Lutar — founder of SZL Holdings. Organised as a strict brand hierarchy: **SZL Holdings** (parent) → **Alloy** (shared intelligence engine) → **Lyte / Vessels / Terra** (command platforms) → **Carlota Jo** (premium service) → **Stephen Lutar** (founder identity). Non-core apps (Nimbus/Dreamscape, INCA, Firestorm, MSP/Rosie) remain internally operational but are hidden from all public-facing surfaces and app switchers.

### Brand Hierarchy (Task #147 — enforced)
- **SZL Holdings** — dark-first, platinum/silver/graphite, Space Grotesk display
- **Alloy** — cool steel / signal blue (hsl 210 80% 50%), positioned as infrastructure engine, not a competing product
- **Lyte** — signal cyan (hsl 192 84% 46%), business observability / risk detection
- **Vessels** — deep ocean blue (hsl 205 72% 38%), maritime command intelligence
- **Terra** — stone/slate (hsl 26 40% 42%), elite real estate broker platform
- **Carlota Jo** — warm ivory/brushed gold (hsl 32 40% 48%), discreet premium services
- **Stephen Lutar** — near-monochrome (hsl 220 10% 55%), founder identity

### Public Surfaces (approved)
- Ecosystem Nav app switcher shows only: SZL Holdings, Alloy, Lyte, Vessels, Terra, Carlota Jo, Stephen Lutar
- Non-core apps removed from ECOSYSTEM_APPS in `lib/shared-ui/src/ecosystem-nav.tsx`
- DOCTRINE_APP_MAP updated in `lib/shared-ui/src/doctrine-layer.ts`

### Shared Components (Task #147)
- `lib/shared-ui/src/command-mode.tsx` — Command Mode surface: `CommandModeSurface`, `CommandModeSignalCard`, `StatusBadge`, APPROVED_CTAS, APPROVED_STATUSES
- Status labels: Live, Pilot Ready, In Build, Strategic, Internal, Private Demo
- Approved CTAs defined in `APPROVED_CTAS` export

### Role-Aware UI Enforcement (Task #137 Phase 6-8)
`lib/shared-ui/src/use-role.tsx` — `useRole()` hook and `RoleGate` component. Fetches `/api/auth/roles`. Provides `isAdmin`, `isInvestor`, `isSecurity`, `isOperator`, `hasRole()`.

Role gates applied:
- **Terra `/ir-module`** — investor + admin only (lock screen for others)
- **Terra `/investment-analysis`** — investor + admin only (lock screen for others)
- **Firestorm `/simulation-runner`** — security + admin only (lock screen for others)
- **SZL Holdings `/investor-relations`** — investor + admin only (lock screen for others); route added to App.tsx
- **SZL Holdings `/admin`** — auth-required (existing) + PIN gate (existing)

### Carlota Jo Overhaul (Task #137 Phase 6-8)
Rebuilt as Rosa Lutar's residential advisory brand.
- **Brand identity:** Light luxury, serif + clean sans, warm ivory/taupe/brushed gold palette (`var(--color-gold): #9a7d52`, `var(--color-cream-warm): #f9f7f3`, `var(--color-ink-900): #1c1a17`). Light cream background, NOT dark.
- **Rosa Lutar persona:** Fractional Director of Properties and Residence. Tone: elegant, warm, discreet, capable. CTA: "Request a Confidential Consultation".
- **6 services:** Residence Operations Support, Property Coordination, Household Systems Oversight, Vendor & Service Coordination, Lifestyle & Administrative Support, Transitional & Special Project Support.
- **Pages:** Home (Hero + services overview), Services (`/services`), Who We Serve (`/who-we-serve`, 5 client profiles), Founder (`/founder`, Rosa Lutar bio), Contact (`/contact`, 5 conversation paths).
- **Nav updated:** Services, Who We Serve, About Rosa, Contact.
- **SZL Holdings FeaturedPlatforms:** Carlota Jo copy updated to "A refined advisory brand for high-trust private client operations" (status: Pilot Ready).

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
- **Database:** PostgreSQL with Drizzle ORM (120+ tables). Includes full CMS schema (sites, pages, sections, ventures, services, features, use_cases, roadmap_items, updates, testimonials, faqs, ctas, articles, case_studies, downloads, navigation_items, site_settings, media_assets, forms, contact_submissions, lead_status, redirects), product tables (fleets, vessels_assets, journeys, vessel_events, vessel_alerts, vessel_reports, signals, findings, investigations, investigation_items, inca_alerts, inca_reports), Carlota Jo client portal tables (client_accounts, client_documents, client_updates, client_messages), and organization_memberships with a 7-role CMS model (public, authenticated, member, client, editor, admin, super_admin).
- **Authentication:** Real Replit Auth (OIDC/PKCE), session-based with cookie+Bearer token, 7-role RBAC. Fallback to DevAuthProvider in local dev (when REPL_ID is absent).
- **API Codegen:** Orval from OpenAPI specification.
- **Bundling:** esbuild (CJS) and Vite.

### UI/UX Design System
A premium command-grade design system — Palantir Foundry / Anduril Lattice aesthetic DNA, entirely SZL-branded. Each app has a **unique visual identity** matching its market lane. Typography system-wide: **Space Grotesk** (display/headings), **Inter** (body), **JetBrains Mono** (data/metrics/code). Common components include KPI ribbons, chart containers, data table shells, `AgentCopilot`, and advanced form elements. Demo Mode banners and loading states with skeleton placeholders are integrated.

**Command-Grade Design Language (Task #133 — fully implemented):**
- **5-level depth surface system** in SZL Holdings CSS: `--color-szl-bg` → `--color-szl-base` → `--color-szl-surface` → `--color-szl-elevated` → `--color-szl-overlay`
- **Domain accent tokens**: `--color-szl-lyte` (cyan), `--color-szl-vessels` (ocean blue), `--color-szl-alloy` (slate blue), `--color-szl-carlota` (warm gold), `--color-szl-inca` (violet), `--color-szl-firestorm` (amber), `--color-szl-rosie` (crimson), `--color-szl-terra` (emerald)
- **Hover glow micro-interactions** added to all artifacts via `box-shadow` on hover — domain-accent colored, restrained luminosity
- **Particle/constellation hero** in SZL Holdings via `HeroParticles` canvas component

**Per-artifact identity:**
- **Alloy:** Cool electric steel (hsl 226 72% 60%), `.alloy-surface`, `.alloy-kpi`, `.arch-node` — glow hover applied
- **Lyte:** Signal cyan (hsl 192 85% 46%), `.signal-panel`, `.kpi-tile`, `.insight-rail` — glow hover applied
- **Vessels:** Deep ocean blue (hsl 202 80% 48%), `.vessel-panel`, `.vessel-card` — glow hover applied
- **Carlota Jo:** Light mode — warm ivory/cream, Cormorant Garamond serif, brushed gold. NOT dark command theme.
- **Stephen Lutar:** Near-monochrome dark, Instrument Serif + Inter editorial design, warm silver accent
- **INCA:** Steel indigo (hsl 248 58% 58%), `.evidence-card`, `.research-panel`, `.model-card` — glow hover applied
- **Firestorm:** Operational amber (hsl 32 88% 52%), `.soc-panel`, `.threat-card` — glow hover applied
- **MSP (Rosie):** Crimson/enterprise blue (hsl 214 88% 52%), `.noc-panel`, `.client-card` — glow hover applied
- **Terra:** Forest green palette, `.deal-card`, `.property-panel`, `.map-panel` — glow hover applied
- **Dreamscape:** Premium violet (hsl 262 62% 56%), `.studio-card`, `.project-card` — glow hover applied
- **SZL Holdings:** Full command overhaul. Dark carbon base, particle hero, glassmorphic nav, Space Grotesk headlines, JetBrains Mono data labels, domain-accented platform cards with glow hover

**Design principles enforced:** No neon gradients, no gamer colors, no neural-network backgrounds. Dark-first (except Carlota Jo), command-surface aesthetic, purposeful motion only (fade/lift/panel reveal/node pulse). Reduced motion support in all apps. Sharp corners (`border-radius: 4px`) — not large rounded corners.

**Bug fixed in `lib/shared-ui/src/tokens.ts`:** Added missing `_legacy.glassmorphism`, `_legacyGlass`, and `status` token objects that `components.ts` was referencing (caused Firestorm crash).

### Admin Panel CMS (Sprint 3)
The admin panel now includes full CRUD for all 16 CMS tables via 4 new pages:
- **`/cms`** — Full CRUD for all CMS tables (sites, ventures, articles, testimonials, etc.) with list/create/edit/delete modal dialogs
- **`/media`** — Media asset browser with upload (file type/size validation), preview, and delete
- **`/site-settings`** — Per-brand site settings management (branding, contact, social, feature flags, analytics)
- **`/analytics-overview`** — Plausible analytics event tracking overview for all 12 event types

New API routes added to `artifacts/api-server/src/routes/cms.ts`:
- `GET /cms/site-settings` — list all site settings (with optional `?site_id=` filter)
- `POST /cms/site-settings` — upsert a site setting (create or update)
- `DELETE /cms/site-settings/:id` — delete a site setting

### Analytics (Plausible) — Sprint 3
`@workspace/analytics` is now wired into all 10 frontend apps via `configurePlausible()` in `main.tsx`:
- Domain defaults are set per-app (e.g. `szlholdings.com`, `alloyscape.io`, etc.)
- Overrideable via `VITE_PLAUSIBLE_DOMAIN` environment variable
- Debug mode enabled in development; localhost tracking disabled
- 12 analytics events: `page_view`, `cta_click`, `form_submit`, `demo_request`, `access_request`, `private_inquiry_submit`, `sign_in`, `sign_up`, `dashboard_view`, `article_view`, `checkout_started`, `checkout_completed`

### Email Templates (Resend) — Sprint 3
`artifacts/api-server/src/lib/email.ts` now exports 10 full HTML email templates:
1. `buildInquiryAckEmail` — contact form acknowledgment
2. `buildLeadNotificationEmail` — internal lead notification
3. `buildWelcomeEmail` — new user welcome
4. `buildBookingAckEmail` — booking/meeting confirmation
5. `buildVerifyEmailTemplate` — email address verification
6. `buildPasswordResetEmail` — password reset with 1-hour expiry
7. `buildDemoConfirmationEmail` — demo session scheduling confirmation
8. `buildAccessRequestConfirmationEmail` — product access request acknowledgment
9. `buildClientPortalInviteEmail` — client portal invite with one-time link
10. `buildBillingNotificationEmail` — billing events (invoice paid/due, payment failed, renewal, cancellation, trial ending)

### Platform Architecture & Features
DreamStack comprises 13 applications sharing a PostgreSQL database, authentication, and design system.
- **Authentication & RBAC:** Middleware manages Bearer token sessions and Replit Auth, with an 11-role RBAC system.
- **API Server:** Modular routes in `artifacts/api-server` use Zod for validation and Drizzle for persistence, including security features like `helmet`, `express-rate-limit`, CORS, and structured error handling.
- **Service Adapters:** `lib/services` provides a pattern for integrating 27 third-party services with environment variable detection and mock fallbacks, including health checks.
- **Stripe Billing:** Full integration for checkout, subscriptions, and webhooks.
- **Intelligence Layer:** Over 40 REST endpoints provide cross-platform intelligence, including government data feeds (CISA KEV, NVD CVE, MITRE ATT&CK, FedRAMP, Census Bureau, BLS, FEMA, USAspending.gov, NOAA, arXiv, Semantic Scholar, PapersWithCode, HuggingFace Hub, SEC EDGAR) with TTL caching and AI-powered endpoints (chat, summarize, sentiment, image-gen, threat-briefing).
- **Live AI Models:** All AI inference uses GPT-5.2 (primary, OpenAI via Replit proxy) and Claude Sonnet 4.6 (Anthropic via Replit proxy). Configured in `artifacts/api-server/src/lib/model-registry.ts` and `lib/services/src/adapters/ai.ts`. Zero mock/setTimeout fakes.
- **Nimbus AI Evolution (Task #153):** Production intelligence layer with 6 core modules:
  - `inference-telemetry.ts` — In-memory telemetry store capturing every AI inference (provider, model, latency, tokens, cost, success/fail, per-agent stats, percentile latencies)
  - `ai-gateway.ts` — Unified inference router with 4 routing strategies (fastest/cheapest/preferred/fallback), automatic retry with exponential backoff, provider failover, task-type detection
  - `provider-health.ts` — Real-time provider health monitoring with auto-degradation (healthy→degraded→down), configurable thresholds, latency tracking
  - `model-registry.ts` — Enhanced with real model cards (purpose, capabilities, context window, cost rates, live performance from telemetry)
  - `multi-agent-orchestrator.ts` — Multi-agent orchestration: NLP planner → parallel domain agents (vessels/firestorm/terra/lyte/inca/msp/dreamscape) → synthesizer pattern
  - `intelligence-pipelines.ts` — 4 composable multi-step AI pipelines (ingest→classify→score→recommend): Terra property scoring, Firestorm threat assessment, Vessels maritime risk, INCA research synthesis
  - `ai-model-observability.ts` — Upgraded from synthetic metrics to real telemetry-backed inference metrics and drift detection
  - API routes at `/api/nimbus/*`: health, status, gateway/infer, gateway/status, registry, registry/models, telemetry, telemetry/providers, telemetry/models, telemetry/records, providers/health, orchestrate, orchestrate/capabilities, pipelines, pipelines/:id/execute, recommendations
- **Domain AI Agents:** 10 specialized agents in `intelligence.ts`: Helmsman (maritime), Sentinel (security), INCA (research), Muse (creative), Beacon (ops), Terra AI (real estate), MSP Ops (ticketing), Compass (compliance), Carlota AI (strategy), Alloy (platform). All accessible via POST `/api/intelligence/ai/domain-agent` with `agentId` parameter, supports SSE streaming.
- **AI Feature Routes:** `/api/intelligence/ai/campaign-copy` (SSE), `/api/intelligence/ai/advisory` (SSE), `/api/intelligence/ai/readiness-summary` (SSE), `/api/intelligence/ai/ticket-triage`, `/api/intelligence/ai/dark-vessel-analysis`, `/api/intelligence/ai/threat-triage`, `/api/intelligence/ai/risk-assessment`.
- **AI Copilots:** Domain-specific AI copilots (`AgentCopilot` component) are present in all applications, offering SSE streaming, markdown rendering, suggested questions, voice input/output, and mobile optimization.
- **Advisory-Only Architecture:** Infrastructure agents are designed as advisory-only, preventing direct execution of changes and logging recommendations for human approval.
- **Agent Training Studio (Admin Panel):** A dedicated studio allows per-agent training with Q&A pairs, behavioral customization, and performance monitoring.
- **AlloyChat (Admin Panel):** A production multi-model AI operations assistant routes queries to Claude or GPT-5.2 based on task, providing SSE streaming and conversation history persistence.
- **Observability:** Structured logging via pino and a system health endpoint monitor DB, storage, auth, connectors, and app routes. The `@workspace/observability` framework offers 8-pillar domain-native observability (Performance, Business, User Experience, Predictive Health, Operational Awareness, Strategic Insight, Security Posture, Innovation Velocity) across all applications.
- **Feature Gating:** `checkFeatureAccess(orgId, featureKey)` controls access based on entitlements and usage limits. Feature flag middleware (`requireFeatureFlag`) in `artifacts/api-server/src/middleware/feature-flags.ts` gates routes by flag key with per-org override support.
- **Admin Panel:** Centralized administration for health monitoring, app registry, connectors, user roles, audit logs, webhooks, feature flags, billing, and a Developer Portal.

### SZL Productization Layer (Task #126)
Converts SZL from premium concept to real governed software with canonical schemas, platform APIs, and frontend connections.

**Canonical DB Schemas:**
- `lib/db/src/schema/alloy_platform.ts` — `platform_signals`, `platform_workflows`, `platform_workflow_runs`, `platform_artifacts`, `platform_approvals`, `platform_audit_log` (all `alloy*Table` exports)
- `lib/db/src/schema/szl_canonical.ts` — `szlProductsTable` (slug/productType/parentSlug), `szlModulesTable`, `szlCapabilitiesTable`, `szlRoadmapTable`, `szlEnvironmentsTable`, `szlHealthChecksTable`
- `lib/db/src/schema/lyte_product.ts` — `lyteSignalCommentsTable`, `lyteSignalTimelineTable` (unique Lyte tables; other Lyte tables in HEAD's `lyte.ts`)
- `lib/db/src/schema/vessels_intelligence.ts` — `fleetExceptionsTable`, `vesselMaintenanceTable` (unique Vessels tables; other maritime tables in HEAD's `maritime.ts`)
- `lib/db/src/schema/feature_flags.ts` — `featureFlagsTable`, `featureFlagOverridesTable`

**Alloy Platform Core API** (`artifacts/api-server/src/routes/alloy.ts`):
- Signal ingestion (`POST /alloy/signals/ingest`)
- Workflow CRUD with state machine: `queued→running→waiting_approval→completed/failed/canceled`
- Workflow runs, artifacts, approvals (approve/reject), audit log, dashboard summary
- Admin endpoints: flag management, seed trigger, system stats

**Lyte Extended API** (`artifacts/api-server/src/routes/lyte-extended.ts`):
- Executive dashboard, signal state transitions (acknowledge/assign/escalate/resolve/override)
- Actions with state machine, readiness items, saved views, signal comments/timeline

**Vessels Extended API** (`artifacts/api-server/src/routes/vessels-extended.ts`):
- Fleet dashboard, map payload, vessel detail, voyage listing
- Exception queue with state transitions (acknowledge/investigate/mitigate/resolve/dismiss)

**Frontend:**
- Alloy `ConsolePage` (`artifacts/alloy/src/pages/ConsolePage.tsx`) — 6-tab admin console (Signals, Workflows, Artifacts, Flags, Audit, Dashboard)
- Lyte `ReadinessPage` (`artifacts/lyte-command-center/src/pages/ReadinessPage.tsx`) — readiness gate management
- Lyte routes: `/readiness`, `/readiness-module`, `/action-queue`

**Seed Data:** `artifacts/api-server/src/lib/seed-platform.ts` seeds products, feature flags, Alloy workflows/signals/artifacts/runs, Lyte signals/actions/readiness, Vessels fleets/vessels/ports/corridors/voyages/exceptions.

#### Application Portfolio (13 apps — Task #76 consolidation, visual identities from Task #87)
- **Alloy (NEW):** Unified AI Command Center at `/alloy/`. Bloomberg Terminal-meets-ChatGPT flagship interface. Features: Agent Switcher (10 domain agents), cross-ecosystem chat with SSE streaming, Knowledge Base (RAG), Real-Time Feeds sidebar, Voice input/output, Model Arena (multi-model comparison), Advisory feed, and image generation. Port 25500. Dark theme with cyan (`hsl(195,100%,50%)`) accent.
- **SZL Holdings (`szl-holdings`, route: `/`):** Luxury operating ecosystem flagship. Multi-page architecture with cinematic Aurora hero, interactive Constellation (canvas), venture detail pages, founder page, audience-segmented contact routing, and analytics instrumentation. Pages: `/` (home), `/portfolio` (filtered venture grid), `/founder`, `/ventures/:id` (reusable detail template), `/contact`, `/insights`, `/insights/:slug`, `/changelog`, `/roadmap`. Content model: `src/data/ventures.ts` (8 ventures with KPIs, capabilities, case studies, timeline, use cases). Components: SiteNav, SiteFooter, StatusTag, SectionHeader, KPIStrip, VentureCard, CTAModule, TimelineBlock, CaseStudyBlock, InquiryForm (investor/client/partner/recruiter/general). Analytics abstraction: `src/lib/analytics.ts`. Premium design: Plus Jakarta Sans display, szl-* CSS variables, dark-first with light mode.
- **Stephen Site (`stephen-site`, route: `/stephen/`):** Sharp personal authority platform. High-contrast near-black (#0d0d0d) with amber (#e8a029) signature accent. Instrument Serif serif. Hero: "Systems operator" positioning with "View selected work" / "Read the thesis" CTAs. Sections: Hero, About (career arc + stats), Case Studies (tabular outcomes), Services, Contact.
- **Vessels (`vessels`, route: `/vessels/`):** Maritime intelligence command center — dark navy, icon-rail sidebar (hover-expand), map-dominant layout (MarineTraffic-style). 18 realistic vessels, CII emissions, chokepoint intelligence, port analytics, sanctions monitoring.
- **Firestorm (`firestorm`, route: `/firestorm/`):** SOC Operations Center — dark cybersecurity theme, orange-red accents (CrowdStrike-style). Incidents (Kanban), MITRE ATT&CK, compliance (NIST CSF, FedRAMP), SENTINEL watch, watchlists, forensics timeline. **Compliance & Readiness** at `/cr/*` (absorbed from Readiness Report). **Asset Inventory** at `/asset-inventory` — risk-scored asset catalog with vulnerability workflow action triggers wired into Alloy.
- **Lyte Command Center (`lyte-command-center`, route: `/lyte-command-center/`):** Business Observability Command Center — dark with amber-400 accents. Monitors approval latency, stalled workflows, ownership gaps, forecast drift, handoff failures, pipeline hygiene, and revenue leakage. Features: Command Overview, Signal Feed, **Action Queue** (role-aware Exec/Ops/Delivery views, state transitions acknowledge→assign→escalate→resolve, VAR display), **Readiness Module** (launch gates, blockers, dependencies, readiness score), Approvals Center, Ownership Map, Escalation Center, Intervention Workspace. Role-based views: Executive, Operations, Delivery. API: `/lyte/actions`, `/lyte/views`, `/lyte/readiness`.
- **INCA (`inca`, route: `/inca/`):** AI Research — deep dark violet sidebar (#0d0a1a), 6-item primary nav, W&B-style (Weights & Biases). 10 programs, 25 experiments, neural architecture explorer, benchmarking, GPU monitoring.
- **Terra (`terra`, route: `/terra/`):** Full brokerage command platform — complete brokerage operating system. Dark, data-dense. Terra green (#5e9a32), terra-bg (#0b1220), terra-surface (#111c2d). Branding: "Terra Brokerage OS". Pages: Command Center, Listings (grid/table, DOM, risk), Leads + CRM (pipeline, scoring, timeline), Deal Pipeline (15-stage kanban/table, probability, bottleneck detection), Offers + Negotiation (comparison, expiry, broker approval), Transactions (11-step workflow, blockers, audit), Documents + Compliance (missing-doc detection, category matrix, readiness scoring), Team Performance (agent cards, coaching flags, bar/radar charts), Nimbus Intelligence (close likelihood, pricing confidence, stall risk, deal health with explainability), AlloyScape (automation catalog, run history, retry queue, failure management). Data: `src/data/brokerage.ts`. Components: `src/components/brokerage-ui.tsx`.
  - **Distress Engine Data Pipeline (Task #129):** Production-grade PostgreSQL-backed distress engine. Schema: `lib/db/src/schema/terra.ts` (3 tables: `terra_distress_properties`, `terra_distress_alerts`, `terra_ingestion_runs`). Service layer: `artifacts/api-server/src/lib/terra-distress-service.ts`. CSV ingestion: `artifacts/api-server/src/lib/terra-csv-ingestion.ts`. NYC Open Data SODA ingestion (ACRIS foreclosures, DOF tax liens, HPD violations): `artifacts/api-server/src/lib/terra-nyc-ingestion.ts`. New endpoints: `POST /api/terra/distress/ingest/csv` (multipart file upload, auth required), `POST /api/terra/distress/ingest/nyc-open-data` (triggers scheduled pull job, super_admin/ops), `GET /api/terra/distress/ingestion/stats`. Scheduled ingestion every 6h (configurable via `TERRA_INGESTION_INTERVAL_MS`). Seed script: `artifacts/api-server/src/scripts/seed-terra-distress.ts` (run: `pnpm seed:terra`). All existing search/property/alerts/score routes now query PostgreSQL with full SQL filtering, sorting, pagination.
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

### Alloy Platform Core — Orchestration Engine (Task #123)
The canonical shared data model and orchestration engine powering all platform apps.

#### Canonical Data Model (`lib/db/src/schema/alloy.ts`)
7 new Drizzle tables: `alloy_owners`, `alloy_signals`, `alloy_workflows`, `alloy_workflow_runs`, `alloy_approvals`, `alloy_actions`, `alloy_artifacts`, plus `alloy_audit_log`. Full relations defined. Schema auto-migrated on server startup via `ensureAlloyTables()`.

#### Alloy Ingestion Layer (`/api/alloy/signals/*`)
- `POST /alloy/signals/webhook` — public webhook receiver (dedup via sha256 key)
- `POST /alloy/signals/batch` — batch import up to 100 signals (requires ops/analyst role)
- `POST /alloy/signals/manual` — admin manual input (requires ops/operator)
- `POST /alloy/signals/demo` — test/demo seeder (requires ops)

#### Alloy Normalization Pipeline (`src/lib/alloy-normalization.ts`)
Keyword-based severity classification, domain category assignment, confidence scoring, tag enrichment, and rules engine output (score, valueAtRisk, workflowType, priority, escalationRequired, anomalyFlag).

#### Alloy Workflow Orchestration Engine (`src/lib/alloy-orchestration.ts`)
- `processSignalIntoWorkflow()` — auto-routes signals to typed workflows
- `startWorkflowRun()` / `completeWorkflowRun()` — run history tracking
- `requestApproval()` / `reviewApproval()` — approval gate management
- `generateArtifact()` — output artifact creation (summary, alert, proposal, brief, etc.)
- `writeAuditLog()` — immutable audit trail on all state changes
- Extends existing job queue with ALLOY job types

#### Alloy API Routes (`/api/alloy/*`)
- Signals: GET list/detail, POST webhook/batch/manual/demo
- Workflows: GET list/detail, POST create/run, GET history
- Approvals: GET list (ops+), POST review decision
- Artifacts: GET list, POST create
- Audit: GET log (super_admin/compliance)
- Actions: GET list
- Owners: GET list, POST create
- Status: GET (public health check)

#### Auth Hardening
- `adminGuard` middleware (`src/middlewares/admin-guard.ts`): Protects all `/admin/*` routes. Allows internal server-to-server calls (localhost). External requests require valid Bearer token + admin role (super_admin/ops/exec).
- All Alloy routes use `authMiddleware()` + `requireRole()` for least-privilege enforcement.

#### Environment Discipline (`src/lib/env-config.ts`)
Centralized `ENV_CONFIG` object: environment detection, Alloy feature flags (`FEATURE_ALLOY_ORCHESTRATION`, `FEATURE_ALLOY_GOVERNANCE`, `FEATURE_ALLOY_WEBHOOKS`, `FEATURE_AUDIT_LOGGING`), and auth config.

#### Nimbus Absorption
Nimbus (`/nimbus` routes) removed as public-facing entity. Predictive intelligence capabilities remain in Dreamscape/Alloy. `/nimbus` API alias removed from route index.

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

### SZL Platform Layer (Task #126 — Governed Software System)
SZL has been converted from a premium concept into a real governed software system with canonical data models, backend workflow logic, platform APIs, feature flag gating, and admin controls.

**New canonical DB tables (`lib/db/src/schema/`):**
- `alloy_workflows` — workflow definitions with trigger, steps, output type, approval requirements
- `alloy_signals` — ingested signals with severity, source type, status, value-at-risk
- `alloy_workflow_runs` — run lifecycle (queued→running→waiting_approval→completed/failed/canceled) with state history, duration, output
- `alloy_artifacts` — generated artifacts with approval status (pending/approved/rejected), content, review notes
- `alloy_audit_log` — immutable audit trail of all platform actions (userId, action, resourceType, before/after snapshots)
- `feature_flags` — feature flag registry with `isEnabled`, `rolloutPercentage`, `conditions` JSONB
- `ports` — maritime port directory with lat/lng, country, zone
- `voyages` — voyage records linking vessel → origin/destination ports, ETA drift, economics
- `vessel_exceptions` — exception queue with type, severity, status (open/acknowledged/escalated/resolved)
- `vessel_corridors` — corridor route definitions with risk score, traffic density, revenue potential
- `lyte_readiness_items` — readiness tracking linked to workspaces with owner, due date, completion status
- `lyte_actions` — assignable action items with type, assignee, signal/workspace linkage
- `lyte_saved_views` — saved filter/view configurations per workspace

**New API routes (`artifacts/api-server/src/routes/`):**
- `alloy.ts` — `/alloy/*`: dashboard, workflow CRUD + run trigger, signal ingestion + batch, workflow runs, artifacts (approve/reject), audit log, feature flag admin (CRUD + toggle), workflow state machine
- `vessels-extended.ts` — `/vessels/*`: fleet summary, map payload, vessel detail, voyage economics, exception state transitions (acknowledge/escalate/resolve), corridor analytics, maintenance-readiness. Write routes gated by `vessels_command_mode_enabled` feature flag.
- `lyte-extended.ts` — `/lyte/*`: signal state transitions (acknowledge/assign/escalate/resolve/override), signal timeline, comments, action CRUD, saved views, readiness CRUD. Readiness routes gated by `lyte_readiness_enabled` feature flag.
- `admin-users.ts` — `/admin/users`, `/admin/system-health`: user list (Drizzle users table) and system health check

**Feature Flag Middleware:**
- `artifacts/api-server/src/middlewares/feature-flag.ts` — `requireFeatureFlag(key)` middleware with 30s cache. Returns 403 if flag is disabled or not found. Applied to 4 lyte readiness routes and 5 vessels write routes.

**Seeded feature flags:** `lyte_readiness_enabled`, `lyte_value_at_risk_enabled`, `vessels_command_mode_enabled`, `alloy_admin_enabled`, `pilot_customer_portal_enabled`

**Alloy Control Plane (ConsolePage):**
- 6-tab admin console: Workflows (trigger/expand runs), Signals (severity/status feed), Artifacts (approve/reject inline), Feature Flags (live toggle), Audit Log (last 100 events), Users (role/status table)
- API client (`artifacts/alloy/src/lib/api.ts`) uses `unwrapList()` helper to handle paginated `{ data, meta }` responses
- Console accessible at `/alloy/console` with "Console" nav button in the desktop header
- PAGE_META and ROUTE_MAP both registered for the "console" page in App.tsx

**Frontend connections:**
- Vessels `corridor-routes.tsx` — fetches from `/vessels/corridors` with `getNum()` string→number adapters (delayRate, profitabilityIndex, avgTransitDays), Live badge, loading skeletons, mock fallback when DB is empty
- Vessels `maintenance-readiness.tsx` — fetches from `/vessels/assets` + `/vessels/maintenance`, `daysToDue()` adapter, dynamic readiness scores, "Coming Due 30 days" panel, mock fallback

### Database Schema
90+ tables across 20+ schema files in `lib/db/src/schema/`:
- **Auth:** users, sessions, roles, user_roles, organizations, org_members
- **Billing:** billing_plans, subscriptions, invoices, entitlements, usage_events
- **Vessels:** vessels, fleets, positions, routes, alerts, cargo, simulations, weather, alert_rules, ports, voyages, vessel_exceptions, vessel_corridors
- **Firestorm:** scenarios, assessments, simulation_runs, findings, risk_scores, incidents, compliance_controls, alerts, campaigns, leads, analytics
- **Lyte:** workspaces, signals, command_cards, incidents, playbooks, recommendations, lyte_readiness_items, lyte_actions, lyte_saved_views
- **Alloy Platform:** alloy_workflows, alloy_signals, alloy_workflow_runs, alloy_artifacts, alloy_audit_log, feature_flags
- **Dreamscape:** campaigns, scripts, storyboards, voice_assets, campaign_assets, reviews
- **Readiness:** programs, dimensions, score_history, milestones, risks, alerts
- **Stephen/Holdings:** content_blocks, case studies, booking_requests, site_contacts, testimonials, portfolio_items
- **Alloy Chat:** conversations, messages
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
