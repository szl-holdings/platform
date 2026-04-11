# SZL Holdings Platform

## Overview
The SZL Holdings Platform is a pnpm monorepo that develops **Lyte**, a business observability platform, powered by **Alloy**, its execution fabric and audit layer. The project encompasses **six product platforms** (Lyte, Vessels, Aegis, Terra, PRISM Counsel, Carlota Jo), a parent company site (SZL Holdings), and a founder identity site (Stephen Lutar). The core vision is to establish Lyte + Alloy as the commercial foundation for an expanding ecosystem, leveraging a shared PostgreSQL database, a unified authentication system, and a command-grade design system. The platform aims to provide advanced observability, governed execution, and intelligent automation capabilities across various business domains, with a strong emphasis on verifiable outcomes and operational readiness.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### Core Technologies
The platform is built as a pnpm monorepo utilizing Node.js 24 and TypeScript 5.9.
- **Frontend:** React, Vite, TanStack React Query, Wouter, Tailwind CSS, Framer Motion, Lucide React, Recharts. Internationalization is handled by `react-i18next` with RTL support.
- **Backend:** Express 5, Drizzle ORM, Zod validation, pino logging.
- **Database:** PostgreSQL with Drizzle ORM (375 tables), pgvector extension for AI embeddings, managing multiple schemas including CMS, product, client portal, organization membership, and AI agent state.
- **Authentication:** Replit Auth (OIDC/PKCE), session-based with cookie+Bearer token, 7-role RBAC.
- **API Codegen:** Orval from OpenAPI specification.
- **Bundling:** esbuild (CJS) and Vite.

### UI/UX Design System
A premium, SZL-branded design system inspired by Palantir Foundry/Anduril Lattice, featuring dark-first aesthetics (except for Carlota Jo), purposeful motion, and sharp corners. Typography includes Space Grotesk, Inter, and JetBrains Mono. Applications maintain unique visual identities within the overarching brand hierarchy. Key shared components and design tokens ensure consistency and a high-quality user experience. The Carlota Jo platform specifically features a luxury light-mode theme with warm ivory backgrounds and gold accents.

#### Brand Hierarchy & Visuals
Each platform has a distinct visual identity:
- **SZL Holdings:** Platinum/silver/graphite, incorporating the Alloy module.
- **Lyte:** Burnished amber, focused on business observability.
- **Vessels:** Deep ocean blue, for maritime command intelligence.
- **Terra:** Obsidian/graphite/deep forest, for real-estate portfolio intelligence.
- **Carlota Jo:** Warm ivory/brushed gold, for UHNW residential advisory.
- **Aegis:** Navy/amber/red, for unified defense and intelligence.
- **PRISM Counsel:** A standalone artifact focusing on legal matter observability with specialized data products and an NY insurance observability layer.
- **SZL Distribution OS:** A content publishing and distribution platform with a dedicated admin panel and public-facing content.

### API Layers
- **REST API:** Modular Express routes using Zod and Drizzle, located in `artifacts/api-server`. Includes robust security features.
- **GraphQL API:** A unified API mounted at `/api/graphql` using Apollo Server v5 and `graphql-ws` for subscriptions, with 9 domain modules.
- **MCP Server:** Model Context Protocol server at `/api/mcp` for AI tool orchestration, exposing 20 tools, 4 resources, and 5 prompt templates via HTTP+SSE.
- **AI Orchestrator API:** Multi-agent orchestration endpoints at `/api/ai/orchestrator/` including chat, agent runs, RAG knowledge base, multi-step workflows, and cross-platform intelligence.

### Agentic AI Infrastructure
The platform includes a full agentic AI stack:
- **LLM Gateway:** Multi-provider AI gateway with intelligent routing across OpenAI GPT-5.2, Anthropic Claude, Google Gemini, and Mixtral. Supports routing strategies (fastest, cheapest, preferred, fallback), provider health tracking, and inference telemetry.
- **7 Domain-Specific Agents:** Vessels (maritime intelligence), Aegis (cybersecurity defense), Lyte (AIOps command), Terra (real estate analysis), PRISM (legal counsel), Carlota Jo (advisory), and SZL Orchestrator (cross-platform command).
- **Agent Orchestrator:** Multi-agent execution engine with tool calling, delegation between agents, conversation memory, and multi-step workflow orchestration.
- **RAG Pipeline:** Document ingestion, chunking, vector embedding (pgvector), and semantic similarity search for knowledge retrieval.
- **Cross-Platform Tools:** Agents can delegate tasks, query across platforms, generate executive briefings, and access portfolio-wide intelligence.
- **Database Tables:** ai_embeddings (vector store), ai_conversations, ai_messages, ai_agent_configs, ai_tool_executions, ai_workflows, agent_knowledge, agent_runs.
- **AI Integrations:** OpenAI and Anthropic provisioned via Replit AI Integrations proxy (no API keys required).

### Platform Architecture & Features
The platform consists of 13 interconnected applications sharing authentication and design.
- **Authentication & RBAC:** Middleware with an 11-role RBAC system.
- **Service Adapters:** Integrates 29 third-party services with environment variable detection and mock fallbacks.
- **Multi-Tenant Provisioning & Branding:** Supports Azure AD multi-tenant onboarding, SCIM 2.0 user provisioning, and white-label branding for enterprise tenants.
- **Intelligence Layer:** Over 40 REST endpoints providing cross-platform intelligence, including government data feeds and AI services.
- **Core Command Center:** A unified cross-platform dashboard at `/core`.
- **Alloy AI Decision Engine:** HuggingFace-powered AI execution fabric with schema-validated decision types, a model registry, and policy-gated tool execution.
- **AI Models & Agents:** Utilizes Qwen3-8B (HuggingFace) primarily, with OpenAI and Anthropic as fallbacks. Includes 10 specialized advisory-only domain AI agents and domain-specific AI copilots with SSE streaming and voice input/output.
- **AlloyChat:** A multi-model AI operations assistant.
- **Observability:** Structured logging via pino and an 8-pillar domain-native observability framework.
- **Feature Gating:** Entitlement-based access control using `checkFeatureAccess`.
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
- **Seed Data:** 6 editorial pillars, 1 author profile (Stephen Lutar), 3 campaigns, 20 articles (all status=ready), 8 newsletters (all approved), 14 X posts (all ready), 2 carousel projects (ready), 12 linktree items (absolute HTTPS URLs), 12 calendar items, 5 integrations (X, Medium, Substack, LinkedIn, AI Carousels), 12 site settings.
- **Connected Profiles:** X (`@szlholdings`), Medium (`@stephen_38454`), Substack (`szlholdings.substack.com`), LinkedIn (`linkedin.com/in/stephenlutar`).
- **Export Folder:** `export/` directory with 20 Medium articles, 8 Substack newsletters, 14 X tweets, 5 LinkedIn posts, 3 carousel PDFs, 3 brand images — all ready to copy-paste-publish.
- **Import:** Always `import { db } from "@szl-holdings/db"` — NOT `@workspace/db`.

### Task #341 — Aegis Gap Closure & Tradecraft Differentiators
Five intelligence tradecraft feature pages added to Aegis and Aegis Mobile. All features use seeded/demo data consistent with the broader Aegis demo posture — no backend persistence is added. They are designed to illustrate tradecraft workflows for demo and prototype evaluation.

**New Web Pages (artifacts/firestorm):**
- **Alternative Hypothesis Engine** (`/tradecraft/hypothesis-engine`): Full ACH matrix with side-by-side hypothesis cards, evidence consistency ratings (consistent/neutral/inconsistent), net score ranking, assumptions checklist, and mirror test (devil's advocacy). Two seeded scenarios: Ransomware Patient Zero and Insider Threat Intent.
- **Confidence Challenge Mode** (`/tradecraft/confidence-challenge`): Three seeded analyst assessments with evidence quality breakdowns. A `calibrateConfidence()` function algorithmically computes a calibrated confidence score from evidence quality weights, source diversity/count, gap and assumption penalties, and an alternatives-considered bonus. After submitting their own slider estimate, the analyst sees the computed calibration alongside a Confidence Basis Breakdown (showing each penalty/bonus component) and the expert rationale. Overconfidence patterns tracked across sessions.
- **Executive Board Brief Generator** (`/tradecraft/board-brief`): One-click structured brief from incident data. Sections: Situation Summary, Key Assumptions (Explicit), Gaps & Unknowns, Alternative Scenarios, Recommended Board Actions, Posture Impact. Uses live incident API with MOCK_INCIDENTS fallback. Copy-to-clipboard as formatted text.
- **Resilience Drill Simulator** (`/tradecraft/resilience-drill`): Five timed, scored scenarios — Ransomware Crisis, Insider Threat, Supply Chain Compromise, APT Intrusion, Data Breach. Each scenario has 2-3 decision points with 4 options, time limit (90s), scoring rubric, rationale reveal, and structured After-Action Review with tradecraft recommendations.
- **Analyst Tradecraft Scorecard** (`/tradecraft/analyst-scorecard`): Team performance dashboard tracking Hypothesis Accuracy (25%), Evidence Usage Quality (20%), False Positive Rate (20%), Escalation Decision Accuracy (20%), Drill Score (15%). Weighted composite score with trend indicator, expandable recent activity per analyst.

**Navigation:**
- New sidebar section "Intelligence Tradecraft" in the Security module nav
- Five command palette entries in the "Intelligence Tradecraft" group
- All 5 routes registered in AppRouter

**Aegis Mobile (artifacts/aegis-mobile):**
- **Board Brief tab** (`app/(tabs)/board-brief.tsx`): Incident selector with severity/status indicators, one-tap brief generation (situation, assumptions, unknowns, recommended actions), regeneration flow.
- **Drill Summary tab** (`app/(tabs)/drill-summary.tsx`): Team stats (avg score, drills completed, avg duration), per-drill cards with score/grade/progress bar, expandable step-by-step decision breakdown, tradecraft recommendations. Seeded with 3 completed drill results.
- `_layout.tsx` updated: Both tabs registered in NativeTabLayout (iOS native) and ClassicTabLayout (Android/web). mcp-tools moved to hidden. Tab order: Dashboard, Incidents, Approvals, Brief, Drills, Digest, Profile.

### Task #338 — SZL Platform Moats: Cross-App Compounding & Commercialization
- **Cross-App Handoff Contracts (PRISM BUS typed contracts):** 5 formal typed handoff contracts defined as `HandoffContractType`: Lyte→FORGE RUNTIME (priority signals), Aegis→COVENANT (threat enforcement), Vessels→FORGE (voyage anomalies), Terra→Carlota Jo (deal blockers), Holdings→ATLAS (investor events). API route at `artifacts/api-server/src/routes/cross-app-handoffs.ts`, endpoints: `GET /api/cross-app/handoffs/contracts`, `GET /api/cross-app/handoffs/history`, `GET /api/cross-app/handoffs/stats`, `POST /api/cross-app/handoffs/trigger`, `GET /api/cross-app/family/health`. Each handoff publishes a `cross_domain_correlation` event to PRISM BUS.
- **Cross-App Notification Relay:** `artifacts/api-server/src/lib/cross-app-notification-relay.ts` — in-process service that listens on the agent event bus for domain signals and dispatches them to all relevant target apps via WebSocket. Subscribed to `anomaly_detected`, `threat_identified`, `alert_raised`, `metric_spike`, `cross_domain_signal` event types. Auto-initialized on server startup.
- **HELM CONSOLE — Family Dashboard:** `/helm` route in SZL Holdings. Shows cross-app KPI stats (handoffs, success rate, active contracts, PRISM events), tabbed view with App Overview (6 apps with handoff targets and status), Handoff Contracts (5 contracts with source/target/trigger/action), Signal Feed (live cross-app signals with severity), and Platform Systems (all 8 named systems). API-backed via React Query with fallback values.
- **Commercial Packaging Page:** `/packages` in SZL Holdings — 5 relief-based tiers: Clarity (stop flying blind), Triage (right thing first), Readiness (know what's coming), Governed Execution (action accountably), White-Glove Orchestration (embedded partnership). Add-ons: Enterprise Governance, Artifact & Export, Integration & API, Pilot Bundle. Interactive tier selector updates detail panel dynamically.
- **ROI Proof Calculator:** `/roi` in SZL Holdings — interactive slider-based calculator with 7 inputs (team size, salary, approval hours, cycle time, missed signals, incident response, decisions challenged). Calculates 5 recovery streams using PULSE EVALS benchmark constants. Shows annual recovery ($1.3M default), hours recovered/week, payback estimate, recovery breakdown with bar chart, and platform benchmarks.
- **Relief-Based Messaging Pack:** `/relief` in SZL Holdings — 6 relief sections mapping symptoms to relief (Stop finding out last, Stop triaging threats by Slack, Stop burning hours on approval theater, Stop dreading the audit, Stop operating in silos, Stop guessing at what's working). Platform proof stats: 8.4min signal-to-action, 62% approval reduction, 98% handoff success, <2min audit reconstruction.
- **SiteNav Updated:** Platform dropdown now includes "HELM CONSOLE — Family Command" link; Resources dropdown now includes "What SZL Relieves", "ROI Calculator", "Platform Packages".
- **Routes added to SZL Holdings App.tsx:** `/helm`, `/packages`, `/roi`, `/relief`.

### Distribution OS & Social Presence
- **DB Author Profile:** `dos_author_profiles` id=1 — upgraded bio, websiteUrl=`szlholdings.com`, xUrl, linkedinUrl.
- **X Posts (DB):** 11 rows in `dos_x_posts` — 1 pinned thread (5-tweet), 6 platform spotlights, 4 founder authority tweets. All draft status, ready for scheduling.
- **Medium Articles (DB):** 20 rows in `dos_articles` — flagship article + domain spotlights.
- **Substack Newsletters (DB):** 8 rows in `dos_newsletters` — "Signal Over Noise" series.
- **Social Media Kit:** `social-media-kit/` directory with platform-specific copy files (X, Medium, Substack, Linktree).
- **GitHub Profile:** `profile-readme/README.md` with metrics table, ASCII architecture, founder-card SVG.
- **Brand Mark:** Gold-gradient SZL monogram (`#d4a054→#b8862c`) used across all founder/about pages; no face photo.

### Task #351 — Competitor-Grade Marketing Pages Across All 6 Product Apps
All 6 product marketing pages elevated to competitor-grade quality with consistent structure.

**PRISM Counsel (`artifacts/prism-counsel`):**
- New full marketing landing at `/prism-counsel/marketing` (`pages/marketing-landing.tsx`)
- Sections: hero, PRISM 6-lens framework (P/R/I/S/M/G), 8 capabilities, 4 practice modules (No-Fault/PI/Commercial/Mass Tort), 3 use cases, proof metrics, trust/governance, 3 pricing tiers, SZL cross-links
- Route registered in `prism-counsel-app.tsx`

**Aegis / Firestorm (`artifacts/firestorm`):**
- New `pages/aegis-use-cases.tsx` at `/use-cases`: 4 customer segments (Enterprise/MSSP/Government/Cloud-Native) with tabbed layout, outcome metrics per segment, and testimonials
- New `pages/aegis-trust.tsx` at `/security`: SOC 2, ISO 27001, CMMC compliance frameworks, 6 security control categories, pen testing process, shared responsibility model
- Both routes added to `MARKETING_ROUTES` array and the public Switch block in App.tsx (no auth gate required)

**Carlota Jo (`artifacts/carlota-jo`):**
- Rewrote `components/Proof.tsx`: 4 outcome pillars (< 6 weeks clarity, 4 continents, 100% principal-led, 0 disclosed), 4 documented anonymized engagement outcomes with quantified results, 6 testimonials
- Footer updated with SZL Trust Center and PRISM Counsel cross-links

**Terra (`artifacts/terra`):**
- Added social proof section to `pages/marketing-landing.tsx` before footer: 4 outcome metrics (3×, 18%, $2.4M, <30 min), 3 client testimonials, SZL cross-links (Trust Center, Architecture)

**Lyte Command Center (`artifacts/lyte-command-center`):**
- Added social proof section to `pages/marketing-landing.tsx`: 4 outcome metrics, 3 testimonials, SZL cross-links (Holdings, Trust Center, Architecture, cross-product links)

**Vessels (`artifacts/vessels`):**
- Added social proof section to marketing page: 4 outcome metrics, 3 testimonials, SZL social proof callout panel, SZL cross-links

**Cross-link standard (all products link to):**
- `/szl-holdings/` — SZL Holdings home
- `/szl-holdings/trust` — Trust Center  
- `/szl-holdings/architecture` — Architecture page

## External Dependencies
- **Database:** PostgreSQL
- **Authentication:** Replit Auth
- **Payment Processing:** Stripe
- **AI/NLP:** HuggingFace Inference API, Replit's OpenAI proxy, OpenAI, Anthropic, Elevenlabs (for voice synthesis)
- **Communication:** Slack, Twilio, Resend (for email)
- **Productivity/Collaboration:** Google APIs, Notion, Confluence, HubSpot, Dropbox, OneDrive
- **Analytics:** Plausible, Posthog
- **Government Data Feeds:** CISA KEV, NVD CVE, MITRE ATT&CK, FedRAMP, Census Bureau ACS, BLS Construction Employment, FEMA NRI, USAspending.gov, NOAA, arXiv, Semantic Scholar, PapersWithCode, HuggingFace Hub, SEC EDGAR, NYC Open Data, FRED, HUD Fair Market Rents
- **Maritime Data:** Digitraffic AIS, BarentsWatch AIS, Open-Meteo Marine Weather API
- **Threat Intelligence:** Shodan InternetDB, GreyNoise Community API, MalwareBazaar, URLhaus
- **Other:** GitHub Public API, AbuseIPDB, Figma