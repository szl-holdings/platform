# SZL Holdings Platform

## Overview
The SZL Holdings Platform is a pnpm monorepo developing **Lyte**, a business observability platform, powered by **Alloy**, its execution fabric and audit layer. The ecosystem includes five product platforms (Lyte, Vessels, Aegis, Terra, Carlota Jo), a parent company site (SZL Holdings), and a founder identity site (Stephen Lutar). Lyte + Alloy serve as the commercial foundation, with other platforms positioned for future expansion. The platform leverages a common PostgreSQL database, authentication system, and a command-grade design system.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### Core Technologies
The platform is a pnpm monorepo using Node.js 24 and TypeScript 5.9.
- **Frontend:** React, Vite, TanStack React Query, Wouter, Tailwind CSS, Framer Motion, Lucide React, Recharts.
- **Internationalization (i18n):** react-i18next + i18next, with language detection via querystring, cookie, localStorage, and browser navigator. Supports RTL.
- **Backend:** Express 5, Drizzle ORM, Zod validation, pino logging.
- **Database:** PostgreSQL with Drizzle ORM (over 120 tables), including CMS, product, client portal, and organization membership schemas.
- **Authentication:** Replit Auth (OIDC/PKCE), session-based with cookie+Bearer token, 7-role RBAC.
- **API Codegen:** Orval from OpenAPI specification.
- **Bundling:** esbuild (CJS) and Vite.

### UI/UX Design System
A premium, SZL-branded design system inspired by Palantir Foundry/Anduril Lattice. Applications feature unique visual identities, dark-first aesthetics (except Carlota Jo), purposeful motion, and sharp corners. Typography includes Space Grotesk, Inter, and JetBrains Mono.

**Omega Phase 1 — Design System Premium Unification (Task #299):** Complete token system with confidence/pressure/reviewState band colors, focus/hover/active interaction states. New shared primitives: `MetricCard`, `WatchlistTable`, `ConfidenceBadge`, `PressureBadge`, `ReviewStateBadge`, `ApprovalStack`, `AuditDrawer`, `EvidenceDrawer`, `ChartContainer`, `ExportPanel`. Updated `DashboardShell` supports theme object (`DashboardShellTheme`) for pack-specific sidebar/header/page background. Updated `SidebarNav` uses design tokens for active state (accent-tinted bg, border). Updated `KPIStrip` uses token HSL values instead of hardcoded slate/neutral classes. `PackBanner` now references token system lane accent colors. `carlotaJoLuxuryTheme` added to themes.ts with full luxury light-mode expression (warm ivory backgrounds, gold text/borders, Cormorant Garamond display font). `LANE_ACCENT_HEX` constants in `lane-colors.ts` provide canonical hex values for apps to import instead of using magic strings.

#### Brand Hierarchy & Visuals
- **SZL Holdings:** Dark-first, platinum/silver/graphite. Includes the Alloy execution fabric module at `/alloy/*`.
- **Lyte:** Burnished amber, Business Observability Platform using the PRISM framework. Split architecture for editorial website and operational app.
- **Vessels:** Deep ocean blue, maritime command intelligence. Mobile app for fleet command.
- **Terra:** Obsidian/graphite/deep forest/slate emerald/muted brass for real-estate portfolio intelligence. Hard website/app split.
- **Carlota Jo:** Warm ivory/brushed gold, UHNW residential advisory platform with a public marketing site, private Client Portal, and a native mobile app.
- **SZL Holdings Mobile:** Executive Command + Alloy Orchestration mobile app.
- **Stephen Lutar:** Near-monochrome, founder identity, with a native mobile app for digital card and portfolio showcase.
- **Aegis:** Navy/amber/red, Unified Defense & Intelligence Command, consolidating Security Operations, Managed Operations, and Intelligence Engine. Includes a native mobile SOC command center app.
- **PRISM Counsel:** Legal matter observability and governed execution vertical — full command center for plaintiff-side NY insurance litigation teams. ~30-table DB schema, 3 demo matters (auto/FL, premises/NJ, coverage/NY), 17 pages (Dashboard, Watchlist, Matters, Matter Detail with 7 tabs, Forecast, Deadlines, Discovery, Playbooks, Approvals, Copilot, Parties, Trust with 6 tabs, Admin, Insurer Intel with 3 tabs, Venue Intel, No-Fault/PIP Claims with clock rules, NY Litigation Command). Uses 6-pillar PRISM scoring (Posture, Readiness, Integrity, Strategy, Money, Governance). NY insurance wedge includes Regulation 68 compliance clocks, insurer behavior profiling, venue intelligence, and no-fault claim tracking. Sidebar organized into Command, Operations, Intelligence, New York, and System sections. Routes at `/prism-counsel/*` within SZL Holdings app. Marketing page at `/solutions/prism-counsel`.
  - **Section 31 (M365 + Copilot + Model Mesh + Worldline):** 16 new tables (`pc_model_lanes`, `pc_model_requests`, `pc_hf_endpoints`, `pc_worldline_sources/signals/features`, `pc_pressure_scores`, `pc_proof_chain_entries`, `pc_copilot_sessions/messages`, `pc_matter_twin_snapshots`, `pc_forecast_diffs`, `pc_data_product_scores`, `pc_m365_subscriptions/delta_cursors`, `pc_cost_tracking`). 7 backend services (Model Router with 7 lanes, HF Gateway, Worldline Engine with 7 real public API sources, Pressure Graph with 12 dimensions, Proof Chain with SHA-256 integrity, Matter Twin with 14-domain snapshots, Copilot Workbench with 5 modes). API routes at `/api/prism-counsel/s31/*`. 9 frontend pages (Copilot Workbench, Worldline Dashboard, Pressure Graph, Data Products, Matter Twin, Proof Chain, Forecast Diff, Model Mesh Admin, Cost Tracking). 6 original data products (Insurer Pressure Index, Venue Velocity Index, Incident Context Layer, No-Fault Friction Score, Settlement Friction Map, AI Defensibility Index). Sidebar organized with new Section 31 nav group and System additions (Model Mesh, Costs).
  - **NY Insurance Observability Layer (Task #283):** 13-page extension at `/prism-counsel/ny/*` with 28 Drizzle tables (full governance metadata: orgId, matterId, actorId, sourceLineage, exportFlag, isPrivileged on every table), migration 0015, 45+ API routes with auth, 8-type forecast engine (deadline_breach_risk, settlement_probability, venue_velocity, insurer_behavior, ai_defensibility_score, silence_risk, demand_readiness, bad_faith_indicator), demo seed for 3 matters (Vasquez/Queens, Okafor/Bronx, Kensington/NY County) including appeals/external appeals, per-matter idempotency. All 13 pages fully API-backed with live hooks (no static demo data).
  - **Pilot Zero (Daily Workflow):** 9 DB tables, 5 backend services (ingestion, change-tracker, review, signoff, export), 20+ API endpoints at `/api/prism-counsel/pilot/*`, 7 frontend pages (Today, What Changed, Review Before Send, Sign-Off Queue, Word Export, Matter Desk, Pilot Admin). Sidebar "Daily" nav group at top.

### Section 25 — Operational Proof & Readiness Surfaces
- **Trust Center Expansion:** `/trust/ai` (AI governance), `/trust/exports` (export safety), `/trust/operations` (operational trust). Added to Trust dropdown in SiteNav.
- **Investor Data Room:** `/investors/overview`, `/investors/architecture`, `/investors/moat`, `/investors/founder`. Replaces old `/investor-relations` as `/investors` default. Added to More dropdown.
- **Pilot Landing Pages:** `/pilot/prism-counsel`, `/pilot/terra`, `/pilot/vessels`, `/pilot/aegis`. Each includes flagship workflow, required integrations, 30/60/90 day outcomes, trust governance summary.
- **SiteNav Updated:** Trust dropdown now shows all 6 trust pages. More dropdown shows investor pages, pilot programs, demo, and docs.
- **Pack Trust Pages:** `/solutions/prism-counsel/trust`, `/solutions/terra/trust`, `/solutions/vessels/trust`, `/solutions/aegis/trust`, `/solutions/lyte/trust`. Each covers governance controls, verified data sources, and domain-specific compliance posture.
- **How It Works Page:** `/how-it-works` — six-layer stack walkthrough (Signal Ingestion → Intelligence → State Observation → Decision Surface → Governed Execution → Proof & Audit), four vertical mappings, differentiators.

### GraphQL API Layer
A unified GraphQL API is mounted at `/api/graphql` using Apollo Server v5 and `graphql-ws` for subscriptions. It includes 9 domain modules and a shared client library (`@workspace/graphql-client`) for frontends. REST endpoints remain active.

### Developer Documentation Portal
Located at `/developers` within the SZL Holdings app, it includes an OpenAPI interactive explorer, GraphQL playground, authentication guide, code samples, rate limit documentation, error code reference, and versioning strategy.

### Platform Architecture & Features
The platform comprises 13 applications sharing authentication and design.
- **Authentication & RBAC:** Middleware with an 11-role RBAC system.
- **API Server:** Modular routes in `artifacts/api-server` with Zod and Drizzle, including security features like `helmet`, `express-rate-limit`, and CORS.
- **Service Adapters:** `lib/services` integrates 29 third-party services with environment variable detection and mock fallbacks.
- **Azure AD Multi-Tenant Provisioning:** Admin panel API for customer Azure AD tenant onboarding and multi-tenant SSO.
- **White-Label Tenant Branding:** Custom branding for each enterprise tenant.
- **SCIM 2.0 User Provisioning:** RFC-compliant SCIM server for Users and Groups CRUD, with group-to-role mapping.
- **Dynamics 365 / Dataverse Integration:** `DataverseAdapter` for connecting to customer Dynamics 365 environments.
- **Stripe Billing:** Full integration for checkout, subscriptions, and webhooks.
- **Intelligence Layer:** Over 40 REST endpoints providing cross-platform intelligence, including government data feeds and AI-powered services.
- **Core Command Center:** Unified cross-platform dashboard at `/core`.
- **Alloy AI Decision Engine (`@workspace/ai-engine`):** HuggingFace-powered AI execution fabric with 9 schema-validated decision types, a model registry, evidence-backed hybrid retrieval, and policy-gated tool execution.
- **Live AI Models:** Primarily Qwen3-8B (HuggingFace), with OpenAI and Anthropic as fallbacks.
- **Nimbus AI Evolution:** Production intelligence layer with core modules for inference telemetry, a unified AI gateway, real-time provider health monitoring, and multi-agent orchestration.
- **Domain AI Agents:** 10 specialized advisory-only agents.
- **AI Copilots:** Domain-specific AI copilots (`AgentCopilot` component) in all applications with SSE streaming, markdown rendering, and voice input/output.
- **AlloyChat:** Multi-model AI operations assistant.
- **Observability:** Structured logging via pino and an 8-pillar domain-native observability framework.
- **Feature Gating:** `checkFeatureAccess(orgId, featureKey)` for entitlement-based access control.
- **Admin Panel CMS:** Centralized administration for 16 CMS tables, media assets, and site settings.
- **In-App Collaboration Layer:** Platform-wide system for team discussions via a `comments` table.
- **Universal Notification & Real-Time Alerting System:** `useNotificationCenter` hook and WebSocket integration for real-time pushes, with multi-channel dispatch to Slack and Microsoft Teams.
- **Expo Push Notifications (Mobile):** End-to-end push notification system for Carlota Jo, with 15 domain-specific templates.
- **Email Delivery System:** Triple-failover email chain (SendGrid → Resend → SMTP nodemailer) with brand templates.
- **Alloy Platform Core — Orchestration Engine:** Canonical shared data model, ingestion layer, normalization pipeline, and workflow orchestration.
- **Alloy Unified Command Surface:** Transformed into a unified command platform with features like a Global Command Bar, Workspace Home, Decision Objects, Skill Registry, and Operator Control Center.
- **Alloy Enterprise Governance (Task #271):** Full governance system with 5 DB tables (`alloy_policies`, `model_routing_policies`, `cost_budgets`, `cost_events`, `governance_incidents`), CRUD API at `/api/governance/*` (uses `authMiddleware()` + `requireRole` for write ops, org-scoped), and premium tabbed UI at `/alloy/enterprise-governance` (Overview, Policies, Model Routing, Cost Controls, Incidents). Seeded with compliance templates (SOC 2, HIPAA, etc.) and model routing policies. Trust UX components: `DataSourceIndicator`, `DemoModeBanner`, `CapabilityBadge` in `src/components/DataSourceIndicator.tsx`.
- **Aegis — Consolidated Defense & Intelligence Platform:** Unifies Security Operations, Managed Operations, and Intelligence Engine with modules for SOAR Playbook Engine, STIX/TAXII Protocol Layer, Unified XDR Console, Threat Intel Feed, Sentinel Watch, and Framework Scorecards.
- **NPS & Contextual Feedback System:** Full in-app feedback collection system with DB schema, API routes, shared UI components, and admin dashboard.
- **MCP Server (Task #297):** Model Context Protocol server at `/api/mcp` exposing 20 tools, 4 resources, and 5 prompt templates. Implements MCP spec 2024-11-05 via HTTP+SSE transport. Domain tools: `vessels_fleet_status`, `vessels_weather_risk`, `firestorm_threat_scan`, `firestorm_compliance_check`, `terra_property_search`, `terra_market_signals`, `lyte_health_check`, `lyte_executive_summary`, `inca_experiment_status`. Platform tools: `alloy_launch_workflow`, `alloy_workflow_status`, `alloy_create_artifact`, `alloy_research`, `alloy_decision_status`, `alloy_approve_decision`, `alloy_skill_list`, `alloy_skill_invoke`. Data tools: `query_holdings_ecosystem`, `query_audit_log`, `query_notifications`. Resources: platform schema, agent system prompts, skill catalog, workflow templates. Prompt templates: `research_brief`, `threat_assessment`, `property_analysis`, `fleet_report`, `executive_digest`. All invocations are audit-logged, approval-class-enforced, and respect tenant isolation. SSE transport at `/api/mcp/sse`. Health check at `/api/mcp/health`.

### Omega Phase 3 — Executive Polish & Premium Views (Task #302)
- **Lyte Command Center — Executive Layer:** 7 new pages added to `/lyte-command-center/src/pages/`:
  - `executive-command.tsx` — Portfolio health pack cards (Revenue Velocity, Approval Overwatch, Ownership Pressure, Trust Integrity), Pressure Board, Movement Board, live Approval Overwatch table, cross-pack aggregate KPIs.
  - `blocker-board.tsx` — Cross-portfolio blocker tracking with status, severity, owner, and linked pack columns; unblock action UI.
  - `digest-center.tsx` — Digest inbox with filter controls, daily/weekly digest cards, and inline expansion.
  - `alloy-action-console.tsx` — Action queue table with retry/cancel/approve inline actions, status filters, and action detail drawers.
  - `alloy-workflow-templates.tsx` — Template library with category filter, preview cards, and launch confirmation.
  - `alloy-write-back.tsx` — Write-back gate controls, export gate toggles, and gate configuration panel.
  - (Trust & Audit — pre-existing page wired to sidebar)
  - Sidebar `lyte-layout.tsx` updated with **Executive** section (Blocker Board, Digest Center, Approvals, Trust & Audit) and expanded **Alloy Engine** section (Action Console, Templates, Write-Back Gates).
  - Command palette updated to include all new Executive and Alloy routes with grouped navigation.
- **Carlota Jo — Luxury Rebuild:**
  - `PremiumHome.tsx` — Full luxury homepage rebuild with animated gold-dust canvas particles, Cormorant Garamond serif display, split hero with live services panel (stats: 98% retention, 24h SLA), 6-service grid, 5-pillar DiscreetApproach section, Rosa Carlota Jo principal intro, dark ClientExperienceStrip with portal feature cards, SZL platform attribution note, and closing CTA. All sections use Framer Motion `whileInView` animations with proper reduced-motion fallback.
  - App.tsx updated to serve `PremiumHome` as the root `/` route.

### Outcome Graph, Atlas Artifacts & HELM Console (Task #337)
- **Outcome Graph (`lib/outcome-graph`):** Decision memory and learning loop engine. DB tables: `outcome_graph` (recommendations, decisions, outcomes with confidence calibration), `outcome_graph_learning_jobs` (periodic calibration runs). API routes at `/api/outcome-graph/*` for recording recommendations, capturing decisions, tracking outcomes, and triggering learning calibration.
- **Atlas Artifacts (`lib/atlas-artifacts`):** Branded document/report generation with provenance, versioning, compare-diff, share-link, and export pipeline. DB tables: `atlas_artifacts` (versioned artifacts with domain/template/sections), `atlas_export_jobs` (PDF/HTML/JSON export queue). API routes at `/api/atlas/*` for artifact CRUD, regeneration, version comparison, sharing, and export jobs. Proof-chain integration via `tagAIContent` for provenance tagging.
- **HELM Console:** Operator control plane at `/helm` in SZL Holdings. 6 tabs: Overview (platform health, agent stats, outcome metrics), Agents (agent run history), Outcomes (outcome graph dashboard), Artifacts (atlas artifact stats), Worldline (data source health), Proof Chain (trust receipt anomalies). Admin-only access via `requireRole(["admin", "super_admin"])`.
- **Domain Atlas Pages:** Each domain app has an `/atlas-artifacts` route — Aegis (incident packets, threat assessments), Vessels (voyage reports, fleet briefs), Terra (property briefs, market analyses), Lyte (ops runbooks, post-mortems).
- **Shared UI Components:** `OutcomeFeedbackBar`, `OutcomeFeedbackCard`, `OutcomeDashboard` (outcome-feedback.tsx), `AtlasArtifactCard`, `AtlasArtifactViewer`, `AtlasArtifactPanel` (atlas-artifact-panel.tsx) in `lib/shared-ui`.
- **Migration:** `0016_outcome_graph_atlas_artifacts.sql` — 4 tables with indexes and foreign keys.

### Platform Marketing Readiness — P0 Gap Closure
- **Feature Flags:** `useFeatureFlag(flagKey)` hook in `lib/shared-ui/src/hooks.tsx`, `FeatureFlagGate` component in `lib/shared-ui/src/feature-flag-gate.tsx`. API at `/api/feature-flags/check/:key`. 26 flags in DB.
- **Analytics Provider:** `AnalyticsProvider` and `useAnalytics` in `lib/shared-ui/src/analytics-provider.tsx`. Wired into all 8 web apps. Batched event flush to `/api/telemetry/events`.
- **Elite Layer Pages:** `/academy` (6 learning paths), `/help` (support center with FAQs), `/demos` (live product showcase with links to all domain apps). All routed in SZL Holdings App.tsx.
- **Demo Data:** 10 firestorm incidents, 7 lyte incidents, 18 DOS articles (6 flagship essays + 6 case studies), 10 leads, 6 newsletters, 17 MSP clients, 6 terra listings, 5 scenarios, 6 campaigns. All seeded via psql.
- **OG Meta Tags:** All 8 web apps have full Open Graph and Twitter Card meta tags in index.html.
- **DB Stats:** 446 tables, 1,618+ API endpoints, 26 feature flags.

### SZL Distribution OS — Content Publishing & Distribution Platform
22 database tables (`dos_*` prefix), full CRUD API at `/api/distribution-os/*`, public pages, and admin panel. Auth-protected write routes.
- **DB Schema:** `lib/db/src/schema/distribution-os.ts` — articles, article_versions, newsletters, carousel_projects, carousel_slides, x_posts, campaigns, campaign_links, leads, lead_notes, editorial_pillars, cta_blocks, content_calendar_items, distribution_targets, distribution_runs, publication_urls, author_profiles, site_settings, integration_status, automation_runs, linktree_config, page_views, analytics_events.
- **API Routes:** `artifacts/api-server/src/routes/distribution-os.ts` — full CRUD with auth middleware on all write operations. Public endpoints: `POST /leads` (lead capture), `POST /analytics/*` (tracking). Read endpoints open for public content.
- **Public Pages:** `/link-in-bio` (mobile Linktree), `/newsletter` (subscription landing). Existing `/insights` and `/insights/:slug` pages retained.
- **Admin Panel:** `/admin/distribution/*` with 11 sub-pages (dashboard, articles CMS, newsletters, carousel lab, X studio, leads, campaigns/UTM builder, content calendar, analytics, automations, settings/integrations). All gated with RequireAuth.
- **Seed Data:** 6 editorial pillars, 1 author profile (Stephen Lutar), 3 campaigns, 12 article drafts, 4 newsletters, 12 calendar items, 10 linktree items, 5 integrations (X, Medium, Substack, LinkedIn, AI Carousels), 12 site settings.
- **Connected Profiles:** X (`@szlholdings`), Medium (`@stephen_38454`), AI Carousels (connected).
- **Import:** Always `import { db } from "@szl-holdings/db"` — NOT `@workspace/db`.

## External Dependencies
- **Database:** PostgreSQL
- **Authentication:** Replit Auth
- **Payment Processing:** Stripe
- **AI/NLP:** HuggingFace Inference API, Replit's OpenAI proxy, OpenAI, Anthropic
- **Communication:** Slack, Twilio, Resend
- **Productivity/Collaboration:** Google APIs, Notion, Confluence, HubSpot, Dropbox, OneDrive
- **Analytics:** Plausible, Posthog
- **Voice Synthesis:** Elevenlabs
- **Government Data Feeds:** CISA KEV, NVD CVE, MITRE ATT&CK, FedRAMP, Census Bureau ACS, BLS Construction Employment, FEMA NRI, USAspending.gov, NOAA, arXiv, Semantic Scholar, PapersWithCode, HuggingFace Hub, SEC EDGAR, NYC Open Data, FRED, HUD Fair Market Rents
- **Maritime Data:** Digitraffic AIS, BarentsWatch AIS, Open-Meteo Marine Weather API
- **Threat Intelligence (keyless):** Shodan InternetDB, GreyNoise Community API, MalwareBazaar, URLhaus
- **Other:** GitHub Public API, AbuseIPDB, Figma