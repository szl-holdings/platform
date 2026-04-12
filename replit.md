# SZL Holdings Platform

## Overview
The SZL Holdings Platform is a pnpm monorepo that develops **Lyte**, a business observability platform, powered by **Alloy**, its execution fabric and audit layer. The project encompasses **six product platforms** (Lyte, Vessels, Aegis, Terra, PRISM Counsel, Carlota Jo), a parent company site (SZL Holdings), and a founder identity site (Stephen Lutar). The core vision is to establish Lyte + Alloy as the commercial foundation for an expanding ecosystem, leveraging a shared PostgreSQL database, a unified authentication system, and a command-grade design system. The platform aims to provide advanced observability, governed execution, and intelligent automation capabilities across various business domains, with a strong emphasis on verifiable outcomes and operational readiness.

## Key Pages & Features

### Nerve Center — Unified Command Surface (`/nerve-center`)
A new executive command surface built within the SZL Holdings app (`artifacts/szl-holdings/src/pages/nerve-center.tsx`). Key capabilities:
- **Operational Timeline**: Live, scrolling feed of cross-domain events from all 6 domains (Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo, Alloy), rendered chronologically with domain-colored lane indicators, severity badges, timestamps, and inline expansion showing full context with deep-links to domain apps.
- **Universal Action Bar**: Cross-domain pending actions with approve/reject/escalate/delegate flows, AI recommendations per action, and two-step confirmation.
- **AI Synthesis Stream**: Continuously generated cross-domain intelligence connections narrated in natural language using the multi-agent orchestrator pattern, with streaming animation.
- **Stakeholder Pulse**: Prioritized decision points ranked by urgency × business impact × time sensitivity, with one-click action routing.
- **Filtering**: Domain filter (all 6 domains), severity filter, and action-required toggle with instant feedback.
- **Domain Status Sidebar**: Per-domain event/critical/high counters with latest event preview and deep-link to each domain app.
- **Simulated Live WebSocket**: Events stream in every 12–20 seconds simulating the real WebSocket channels (aegis-incidents, vessel-positions, terra-signals, workflow-runs, bookings).
- Route: `/nerve-center` in SZL Holdings app.

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
- **Database:** PostgreSQL with Drizzle ORM (560+ tables), pgvector extension for AI embeddings, managing multiple schemas including CMS, product, client portal, organization membership, and AI agent state.
- **Investor Dashboard:** `/stephen/investor` route on stephen-site — acquisition-grade due diligence surface with live DB metrics, defensibility scoring, TAM analysis, and CTA for Acquire.com. API endpoint: `GET /api/stephen/acquisition-metrics`.
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

### Alloy AI Engines (Four-Lane Architecture)
Production-grade AI engines powering Alloy's self-evolving Four-Lane intelligence platform:
- **Genetic Evolution Engine** (`api-server/src/lib/alloy-evolution-engine.ts`): Real genetic algorithm with 4 selection strategies (tournament, roulette, rank, elitist), crossover operators (single-point, two-point, uniform), Gaussian mutation, and multi-dimensional fitness evaluation. Persists populations, genomes, and evolution events to `alloy_populations`, `alloy_genomes`, `alloy_evolution_events` tables.
- **Expert Router (MoE)** (`api-server/src/lib/alloy-expert-router.ts`): Mixture-of-Experts inspired router with 9 domain experts, learned domain affinity matrix, 4 routing strategies (affinity-weighted, cascade, ensemble, least-loaded), confidence scoring, and structured routing logs via `alloy_expert_routing_log` and `alloy_experts` tables.
- **Threat Engine (STRIDE + Kill Chain)** (`api-server/src/lib/alloy-threat-engine.ts`): STRIDE threat modeling framework combined with Lockheed Martin Cyber Kill Chain analysis. Includes real APT profiles (APT-29 Cozy Bear, APT-28 Fancy Bear, FIN7), vulnerability assessment, counter-intelligence indicators, and risk matrix calculation. Persists to `alloy_threat_models` table.
- **Capability Gap Detector** (`api-server/src/lib/capability-gap-detector.ts`): Analyzes tool failures, agent skill gaps, domain fallbacks, and cross-domain patterns. Detects 5 gap types (tool_missing, agent_skill, domain_coverage, pipeline_gap, cross_domain). Persists to `alloy_capability_gaps` table.
- **Innovation Proposal Engine** (`api-server/src/lib/innovation-proposal-engine.ts`): Synthesizes gaps into typed proposals (new_tool, new_agent_skill, mesh_connection, new_pipeline, app_feature). Generates additional proposals via AI. Stores in `alloy_innovation_proposals` table with approve/dismiss support. Includes Ecosystem Alert generation.
- **Adaptive Learning Recorder** (`api-server/src/lib/adaptive-learning-recorder.ts`): Unified learning event store (agent executions, RAG, tool calls, A2A, feedback, proposal actions). Computes behavior updates for evolution engine. Persists to `alloy_learning_records` table.
- **Four-Lane Coordinator** (`api-server/src/lib/four-lane-coordinator.ts`): Orchestrates all four intelligence lanes in a single coordinated flow: (1) RAG context pull, (2) MCP tool discovery/execution, (3) A2A delegation, (4) LLM inference. Per-lane metrics reported.
- **API Routes** (`api-server/src/routes/alloy-evolution.ts`): Full REST endpoints at `/api/alloy/evolution/*` including `/gaps`, `/proposals`, `/proposals/:id/approve`, `/proposals/:id/dismiss`, `/learning/aggregates`, `/learning/feedback`, `/ecosystem/alerts`, `/evolution/radar`, `/evolution/audit-trail`, `/four-lane/execute`.
- **Innovation Radar UI** (`szl-holdings/src/alloy/pages/evolution-radar.tsx`): Six-tab dashboard at `/alloy/evolution` — Innovation Radar (overview), Capability Gaps, Innovation Proposals (with Approve/Dismiss), Audit Trail, Ecosystem Alerts, Four-Lane Coordinator testing.
- **LLM ML Training Engine** (`api-server/src/lib/alloy-ml-engine.ts`): Zero-infrastructure ML using LLM-based reasoning instead of custom models. Trains "models" by evolving prompt strategies through genetic algorithms. 5 training strategies: evolutionary optimization, few-shot optimization, chain-of-thought tuning, ensemble distillation, reinforcement from feedback. 6 model types: classifier, predictor, anomaly_detector, forecaster, ranker, recommender. Epoch metrics with early stopping and convergence detection. Persists to `alloy_ml_models`, `alloy_ml_training_runs` tables.
- **Historical Backtesting Engine** (`api-server/src/lib/alloy-ml-engine.ts`): Replays historical predictions through current model configurations. Measures accuracy, precision, recall, F1, calibration score. Time-series accuracy tracking, confusion matrix, feature importance ranking, and automatic drift detection. Persists to `alloy_backtest_sessions` table.
- **Forecasting Engine** (`api-server/src/lib/alloy-ml-engine.ts`): Multi-horizon forecasting (1d to 365d) with confidence intervals, seasonal decomposition, and causal reasoning chains. 5 methodologies: trend extrapolation, seasonal decomposition, causal reasoning, ensemble forecast, anomaly-adjusted. Persists to `alloy_forecasts` table.
- **Prediction Store** (`api-server/src/lib/alloy-ml-engine.ts`): Full prediction lifecycle — generate, store, resolve against actual outcomes, track accuracy over time. Input hashing for deduplication, reasoning chain preservation, confidence calibration feedback. Persists to `alloy_predictions` table.
- **ML API Routes** (`api-server/src/routes/alloy-ml.ts`): Full REST endpoints at `/api/alloy/ml/*` including models CRUD, training runs, predictions, backtests, forecasts, and aggregated dashboard. Domain-specific training data generators for maritime, legal, defense, real estate, consulting.

### Compound Intelligence (One-of-One Capabilities)
Production-grade compound intelligence engine (`api-server/src/lib/alloy-compound-intelligence.ts`) — features that go beyond Palantir, Anduril, Windward, Datadog, Litify, and Reonomy combined:
- **Cross-Domain Ontology Fusion**: Real-time entity linking across 5 industries with 8 entity types per domain, 22 link types, graph traversal up to depth 4, inferred relationships, and behavioral DNA integration. No competitor links entities across maritime, legal, defense, real estate, AND advisory in one graph.
- **Behavioral Genome Profiling**: Builds behavioral DNA fingerprints for every entity — temporal patterns, action entropy, Shannon information theory, anomaly scoring, domain-specific risk factors (AIS gaps, privilege escalation, missed deadlines, distress signals), and pattern signatures.
- **Predictive Cascade Engine**: Predicts how events cascade across domains — a vessel sanctions violation automatically generates legal liability prediction, property value impact, client advisory needs, and platform health alerts. Time-to-impact estimation and mitigation actions.
- **Anticipatory Intelligence**: Domain-specific prediction rules that anticipate events BEFORE they happen — settlement windows, APT campaigns, distress opportunities, weather disruptions, client needs shifts — with evidence chains and recommended actions.
- **Cross-Domain Correlation Detection**: Scans ontology entities, behavioral genomes, and cascade predictions to detect hidden multi-domain relationships — shared entity properties, multi-domain risk convergence, and cascade convergence patterns.
- **Competitive Moat Analysis**: Live competitive positioning against Palantir, Anduril, Windward, Datadog, Litify, and Reonomy/Cherre with capability-by-capability comparison, moat scoring, and one-of-one uniqueness assessment.
- **Compound Intelligence Dashboard**: Aggregated metrics across all 7 subsystems — ontology entities/links, behavioral genomes, cascade predictions, anticipatory signals, cross-domain correlations, and competitive moat.
- **API Routes**: 15+ endpoints at `/api/alloy/ontology/*`, `/api/alloy/behavioral/*`, `/api/alloy/cascade/*`, `/api/alloy/anticipatory/*`, `/api/alloy/correlations/*`, `/api/alloy/competitive/*`, `/api/alloy/compound/*`.
- **Schema**: 22+ Alloy tables — original 14 + `alloy_ontology_entities`, `alloy_ontology_links`, `alloy_behavioral_genomes`, `alloy_decision_mesh_nodes`, `alloy_cascade_predictions`, `alloy_anticipatory_signals`, `alloy_cross_domain_correlations`, `alloy_competitive_moat`.

### Agentic AI Infrastructure
The platform includes a full agentic AI stack:
- **LLM Gateway:** Multi-provider AI gateway with intelligent routing across OpenAI GPT-5.2, Anthropic Claude, Google Gemini, and Mixtral. Supports routing strategies (fastest, cheapest, preferred, fallback), provider health tracking, and inference telemetry.
- **7 Domain-Specific Agents:** Vessels (maritime intelligence), Aegis (cybersecurity defense), Lyte (AIOps command), Terra (real estate analysis), PRISM (legal counsel), Carlota Jo (advisory), and SZL Orchestrator (cross-platform command).
- **Mastra Agent Engine:** Production-grade agent framework with Zod-validated tool calling, input/output guardrails (prompt injection defense, PII redaction), and automatic quality evaluation.
- **Three-Tier Memory:** In-context (session window), short-term (PostgresStore cross-turn persistence), long-term (pgvector semantic recall with similarity search).
- **Knowledge Graph:** Entity-relation store for structured agent memory across domains, with graph traversal and semantic search.
- **A2A Protocol (v0.3):** Agent-to-Agent protocol implementation with Agent Cards, task lifecycle management, and cross-agent discovery/invocation.
- **AgentOps Observability:** Full trace spans (agent_run, tool_call, llm_inference, delegation, workflow_step, memory_recall, rag_query), auto-evaluation (quality, latency, cost), SLO monitoring.
- **Durable Workflows:** Checkpoint-based workflow engine with DAG execution, parallel steps, retry logic, pause/cancel, and PostgreSQL-backed durability.
- **Tool Safety:** All agent tools use Zod schemas for input validation, rate limiting, and permission scoping. Output schemas for contract enforcement.
- **RAG Pipeline:** Document ingestion, chunking, vector embedding (pgvector), and semantic similarity search for knowledge retrieval.
- **Cross-Platform Tools:** 6 Zod-validated tools: portfolio metrics, executive briefing, knowledge graph search, cross-domain analysis, agent delegation, semantic memory search.
- **Eval Engine (Promptfoo-pattern):** Production eval suite runner with 7 assertion types (contains, not-contains, similarity, llm-judge, regex, factuality, toxicity/relevance). Supports custom test suites with configurable thresholds and LLM-as-judge evaluation. Located at `src/lib/mastra/eval-engine.ts`.
- **Red Team Engine (Gray Swan-pattern):** Automated adversarial testing framework with 20-attack threat catalog covering prompt injection, jailbreaks, data exfiltration, privilege escalation, toxicity, bias, hallucination pressure, social engineering, cross-agent impersonation, and supply chain poisoning. Each attack has severity classification and expected defense behavior. Results scored and stored in agentops_evals.
- **Hallucination Detection (Vectara HHEM-pattern):** Factual grounding scorer that decomposes responses into claims, evaluates each against source context, and produces a grounding percentage + confidence score. Verdicts: grounded/partially-grounded/ungrounded.
- **Compound AI Pipelines (Fireworks-pattern):** DAG-based compound AI pipeline engine supporting llm, tool, branch, parallel, aggregate, transform, and search step types. Template resolution for step chaining. Includes pre-built cross-domain analysis pipeline. Routing strategies: fastest/cheapest/quality.
- **Database Tables:** ai_embeddings, ai_conversations, ai_messages, ai_agent_configs, ai_tool_executions, ai_workflows, agent_knowledge, agent_runs, agent_memory_threads, agent_memory_messages, agent_knowledge_entities, agent_knowledge_relations, agentops_traces, agentops_evals, agentops_slos, durable_workflows, durable_workflow_steps, a2a_agent_cards, a2a_tasks.
- **API Routes:** `/api/ai/mastra/` — agents, chat, tools, memory (threads/recall), knowledge (entities/graph), agentops (metrics/traces), a2a (agents/tasks/.well-known), workflows (create/pause/cancel), eval (red-team/catalog, red-team/run, suite/run, hallucination), compound (pipeline, analyze), stats.
- **NVIDIA Inception Capabilities:** Integrated patterns from Promptfoo (eval suites), Vectara (hallucination detection), Gray Swan (red teaming + I/O security), Fireworks (compound AI), Okareo (synthetic user simulation), Tavily (agent web search readiness), Twelve Labs (multimodal architecture readiness).
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