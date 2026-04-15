# SZL Holdings Platform

## Overview
The SZL Holdings Platform is a pnpm monorepo that develops **Lyte**, a business observability platform, powered by **Alloy**, its execution fabric and audit layer. The project encompasses five product platforms (Lyte, Vessels, Aegis, Terra, Carlota Jo), a parent company site (SZL Holdings), and a founder identity site (Stephen Lutar). The core vision is to establish Lyte + Alloy as the commercial foundation for an expanding ecosystem, leveraging a shared PostgreSQL database, a unified authentication system, and a command-grade design system. The platform aims to provide advanced observability, governed execution, and intelligent automation capabilities across various business domains, with a strong emphasis on verifiable outcomes and operational readiness.

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
- **Database:** PostgreSQL with Drizzle ORM (over 120 tables) managing multiple schemas including CMS, product, client portal, and organization membership.
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
- **Terra:** Obsidian/graphite/deep forest, for real-estate portfolio intelligence. Features spatial computing, computer vision, and generative AI property analysis — includes Computer Vision (property photo analysis, condition scoring), Zoning Intelligence (generative zoning code analysis, massing models), AVM Engine (multi-approach automated valuation with ML comparables), Rent Roll (AI lease abstraction, rent comp analysis), Title Intelligence (chain-of-title, lien detection), Construction Cost (real-time estimation, Monte Carlo timelines), Spatial Walkthrough (3D property exploration, renovation viz), Deal Lifecycle (diligence checklists, 1031 exchange tracking), and Portfolio Stress Testing (6 economic scenarios, portfolio VaR).
- **Carlota Jo:** Warm ivory/brushed gold, for UHNW residential advisory.
- **Aegis:** Navy/amber/red, for unified defense and intelligence.
- **PRISM Counsel:** A standalone artifact focusing on legal matter observability with specialized data products and an NY insurance observability layer.
- **SZL Distribution OS:** A content publishing and distribution platform with a dedicated admin panel and public-facing content.

### Object Storage (GCS / App Storage)
The platform uses Replit's GCS-backed object storage (App Storage) for all file uploads and generated documents.

- **Bucket:** Provisioned via `setupObjectStorage()` — bucket ID stored in `DEFAULT_OBJECT_STORAGE_BUCKET_ID`.
- **Env vars:** `PRIVATE_OBJECT_DIR` (private uploads), `PUBLIC_OBJECT_SEARCH_PATHS` (public assets).
- **Server library:** `artifacts/api-server/src/lib/objectStorage.ts` — `ObjectStorageService` (GCS wrapper with presigned URL generation and direct buffer uploads), `objectAcl.ts` (ACL policy framework).
- **Storage routes:** `artifacts/api-server/src/routes/storage.ts` — `POST /api/storage/uploads/request-url` (presigned upload URL), `GET /api/storage/objects/*` (private objects), `GET /api/storage/public-objects/*` (public assets).
- **File registration:** `POST /api/files` registers a file record in `filesTable` after a presigned URL upload completes, storing `storageKey` (objectPath) and `storageUrl` (`/api/storage` + objectPath).
- **PDF pipeline:** Batch PDF jobs (`pdfJobsTable`) upload generated PDFs to GCS via `ObjectStorageService.uploadBuffer()` and serve via `/api/storage/objects/pdfs/*`. Falls back to base64-in-DB if storage is unavailable.
- **Client library:** `lib/object-storage-web` (`@workspace/object-storage-web`) — `ObjectUploader` (Uppy v5 modal) and `useUpload` hook for web app file upload UIs.
- **ACL policies:** Private objects protected by ACL metadata; public assets served unconditionally.

### API Layers
- **REST API:** Modular Express routes using Zod and Drizzle, located in `artifacts/api-server`. Includes robust security features.
- **GraphQL API:** A unified API mounted at `/api/graphql` using Apollo Server v5 and `graphql-ws` for subscriptions, with 9 domain modules.
- **MCP Server:** Model Context Protocol server at `/api/mcp` for AI tool orchestration, exposing 20 tools, 4 resources, and 5 prompt templates via HTTP+SSE.

### Platform Architecture & Features
The platform consists of 13 interconnected applications sharing authentication and design.
- **Authentication & RBAC:** Middleware with an 11-role RBAC system.
- **Service Adapters:** Integrates 29 third-party services with environment variable detection and mock fallbacks.
- **Multi-Tenant Provisioning & Branding:** Supports Azure AD multi-tenant onboarding, SCIM 2.0 user provisioning, and white-label branding for enterprise tenants.
- **Intelligence Layer:** Over 40 REST endpoints providing cross-platform intelligence, including government data feeds and AI services.
- **Core Command Center:** A unified cross-platform dashboard at `/core`.
- **Alloy AI Decision Engine:** HuggingFace-powered AI execution fabric with schema-validated decision types, a model registry, and policy-gated tool execution.
- **AI Models & Agents:** Utilizes Qwen3-8B (HuggingFace) primarily, with OpenAI and Anthropic as fallbacks. Includes 12 specialized domain AI agents (Alloy, Helmsman, Sentinel, INCA, Muse, Beacon, Zeus, Compass, Lexis, Atlas, Terra, Nexus) and domain-specific AI copilots with SSE streaming and voice input/output.
- **Unified AI Copilot Interface (Task #568):** Persistent `AgentCopilot` drawer wired into ALL web apps (vessels, firestorm, terra, lyte-command-center, command, szl-holdings, carlota-jo, stephen-site, prism-counsel). Domain-aware `/api/copilot/chat` endpoint with intelligent model routing (OpenAI GPT-5.2 for general queries, Anthropic Claude Sonnet for analysis/reasoning), SSE streaming, and non-streaming fallback. Named copilot personas: Helmsman (vessels), Sentinel (aegis/firestorm), Terrain (terra), Lyte Ops (lyte), Command AI (command), Navigator (szl-holdings), Carlota (carlota-jo), Stephen AI (stephen-site), Counsel (prism-counsel). Conversation history persisted to localStorage per `conversationKey`. Mobile `CopilotFab` (floating action button + modal chat) wired into all 7 mobile apps via `@szl-holdings/mobile-shared`. New configs in `lib/shared-ui/src/copilot-configs.ts`: `carlotaJoConfig`, `prismConfig`, `commandConfig`. New `CopilotConfig.conversationKey` field. API route: `artifacts/api-server/src/routes/copilot.ts`. Mobile component: `lib/mobile-shared/src/components/CopilotFab.tsx`.
- **Ecosystem Innovation Engine (Task #532):** Cross-portfolio ambient intelligence layer with 5 shared components (`AmbientBar`, `EnergyPulse`, `DecisionShieldPanel`, `StakeholderLensProvider`, `CorrelationFeed`) in `lib/shared-ui/src/`. 7 domain-specific breakthrough pages: Threat Cost Translator (Firestorm), Voyage Carbon Passport (Vessels), Self-Healing Confidence (Lyte), Judicial Pattern Intelligence (PRISM), LP Sentiment Pulse (SZL Holdings), Invisible Service Design (Carlota Jo), Thought Resonance Engine (Stephen Site). API endpoints at `/api/innovation-engine/*` (ambient-signals, energy-metrics, decision-items, correlations, stakeholder-views). Each page renders AmbientBar header + CorrelationFeed/EnergyPulse footer with domain-specific demo data.
- **Nuro Mesh Intelligence Layer:** Cross-domain causal reasoning engine (18 causal patterns), proactive agent activation via signal correlation, Bayesian confidence calibration, structured conflict resolution between agents, and agent performance telemetry. Hybrid semantic+keyword routing with cross-domain affinity, pre-turn agent consultation pattern, and maker-checker validation for high-stakes outputs.
- **AlloyChat:** A multi-model AI operations assistant.
- **Observability:** Structured logging via pino and an 8-pillar domain-native observability framework.
- **Feature Gating:** Entitlement-based access control using `checkFeatureAccess`.
- **Admin Panel CMS:** Centralized administration for 16 CMS tables, media assets, and site settings.
- **Collaboration & Notifications:** In-app collaboration layer via `comments` table and a universal notification/real-time alerting system with multi-channel dispatch (Slack, MS Teams) and Expo Push Notifications for mobile. Push infrastructure includes: receipt verification background job (polls Expo every 5 min, deactivates bad tokens), scheduled notifications queue (processed every 60 sec), per-user/app/category notification preferences, push notification history (paginated), and delivery analytics endpoints. All 7 mobile apps correctly register tokens with their specific `appId`.
- **Real-Time WebSocket & Event Streaming Infrastructure:** Persistent, multiplexed WebSocket layer at `/ws` serving all frontends. Key capabilities:
  - **Multiplexed channels** with topic-based routing (e.g., `aegis:alert-feed`, `vessels:fleet-positions`, `lyte:metrics-stream`, `nexus:intelligence-feed`) and per-channel RBAC authorization with tenant isolation.
  - **SSE Fallback** at `/api/realtime/sse?channel=<name>` — transparent API fallback for corporate proxies and restricted networks. `useRealtimeChannel` React hook automatically detects WS failure and falls back to SSE.
  - **Prism Bus Bridge** (`lib/prism-bus-bridge.ts`) — forwards all Prism Bus domain events to relevant WebSocket channels in real time. Started on server bootstrap, stopped on shutdown.
  - **Message History & Catch-Up** — 500-message rolling history buffer with sequence numbers. Clients send `sinceSeq` on subscribe to receive missed messages after reconnect.
  - **Presence Tracking** — per-channel user presence with `addPresence/removePresence` and `GET /api/realtime/presence/:channel` endpoint.
  - **Backpressure & Rate Limiting** — per-client 300 msg/min rate limiter, 100-message send buffer for slow consumers with background drain loop.
  - **Client SDKs:** `useRealtimeChannel` hook in `lib/shared-ui` (React, SSE fallback, sequence tracking, presence callbacks) and `useRealtimeChannel` hook in `lib/mobile-shared` (Expo/React Native, no SSE). `usePresence` hook polls `/api/realtime/presence/:channel`.
  - **Health Monitoring** at `GET /api/realtime/health` — live stats: connections, throughput (msg/min), total published, channel subscriptions, presence map, slow consumers, Prism Bus bridge status.
- **Mobile Shared Library (`lib/mobile-shared`, `@szl-holdings/mobile-shared`):** Shared React Native components and hooks used across all 7 mobile apps: `ErrorBoundary`, `SkeletonLoader`, `KeyboardAwareScrollViewCompat`, `useApiStatus`, `useWebSocket`, `useRealtimeChannel`, `useOfflineQueue`, `useOfflineSync`, and `CopilotFab` (AI copilot floating button + modal chat). Each mobile app's metro.config.js includes this package in its watchFolders.
- **Offline-First & Edge Infrastructure (`lib/offline-engine`, `@szl-holdings/offline-engine`):** Universal offline-first data layer for web and mobile. Key components:
  - **Storage Abstraction:** `IndexedDBAdapter` (web) and `AsyncStorageAdapter` (mobile) both implement a common `StorageAdapter` interface (get/put/delete/getAll/query/clear/count).
  - **Command Queue (`CommandQueue`):** Captures offline mutations as serialized `OfflineCommand` objects (with domain, method, URL, body, priority, retry metadata). Persists locally and replays on reconnection via `replay()`. Supports critical/high/normal/low priority ordering and capped queue size (200 commands).
  - **Conflict Resolution (`ConflictResolver`):** Detects server vs. local timestamp conflicts. Auto-resolves non-critical (low/medium severity) changes with last-write-wins server strategy. Surfaces high/critical conflicts as `ConflictRecord` entries for user review.
  - **Delta-Sync Client (`DeltaSyncClient`):** Watermark-based incremental sync — stores `lastSyncedAt` timestamp per domain; fetches only changes since that point from `/api/{domain}/sync`. Supports cursor-based pagination for large changesets.
  - **Service Worker Infrastructure:** `lib/offline-engine/src/service-worker/sw.ts` (TypeScript source), `register.ts` (registration helper). Static assets: cache-first. Dashboard API calls (incidents, vessels, signals): stale-while-revalidate. All other API calls: network-first with offline fallback (HTTP 503 + `X-Offline` header).
  - **Hooks:** `useOfflineSync` (sync state machine: synced/syncing/pending/conflict/error/offline, auto-triggers sync on reconnect, periodic sync interval) and extended `useOfflineQueue` — both in `lib/mobile-shared`.
  - **Sync Status UI:** `SyncStatusBadge` and `SyncStatusBar` components exported from `lib/shared-ui` — show animated sync state with pending count, conflict count, and last-synced time.
  - **Delta-Sync API Endpoints:** `GET /api/aegis/sync?since={timestamp}&limit={n}&cursor={cursor}` (incidents, alerts, findings, assets), `GET /api/vessels/sync?since={timestamp}` (fleets, vessels, positions, alerts, events), `GET /api/alloy/sync?since={timestamp}` (signals, workflows). All auth-protected, return cursor-based pagination with `serverTime` watermark. Registered in `artifacts/api-server/src/routes/delta-sync.ts`.
  - **Aegis Offline Mode:** `artifacts/firestorm/public/sw.js` Service Worker; `useAegisOfflineSync` hook in aegis-mobile (queues incident reports and triage decisions offline). SW registered in `artifacts/firestorm/src/main.tsx`.
  - **Vessels Offline Mode:** `artifacts/vessels/public/sw.js` Service Worker; `useVesselsOfflineSync` hook in vessels-mobile (queues AIS gap reports and compliance decisions offline). SW registered in `artifacts/vessels/src/main.tsx`.
- **Email Delivery:** Triple-failover email chain (SendGrid → Resend → SMTP nodemailer).
- **Alloy Platform Core:** Orchestration engine with canonical shared data model, ingestion, normalization, and workflow orchestration.
- **Alloy Unified Command Surface:** Features a Global Command Bar, Workspace Home, Decision Objects, Skill Registry, and Operator Control Center.
- **Alloy Enterprise Governance:** A comprehensive governance system with policies, model routing, cost controls, and incident management.
- **Outcome Graph & Atlas Artifacts:** Decision memory and learning loop engine, and branded document/report generation with provenance and versioning.
- **HELM Console:** Operator control plane providing platform health, agent stats, outcome metrics, and trust receipt anomalies.
- **Platform Marketing Readiness:** Includes feature flags, analytics integration, elite layer pages (`/academy`, `/help`, `/demos`), robust demo data, and full Open Graph/Twitter Card meta tags.
- **Cross-App Compounding:** Implements cross-app handoff contracts, notification relay, and a family dashboard in HELM for visualizing cross-platform KPIs and health.
- **Platform Pulse:** Real-time ecosystem intelligence dashboard at `/pulse` showing animated constellation of all 16 platform apps, live agent neural mesh activity, cross-domain intelligence flow visualization, domain health matrix, and animated platform metrics (16 apps, 446 DB tables, 1,618+ endpoints, 12 active agents, 9 domains).
- **Commercialization:** Includes dedicated pages for commercial packaging (`/packages`), ROI calculation (`/roi`), and relief-based messaging (`/relief`).

## Industrial Report Generation & Document Intelligence Pipeline (Task #563)
- **DB Schema** (`lib/db/src/schema/reports.ts`): 5 new tables — `report_templates` (composable block templates with brand/domain/conditional rules), `report_generations` (per-report snapshot with PDF buffer, narrative sections, versioning, status workflow), `report_approvals` (review workflow with annotations), `report_distributions` (per-recipient delivery tracking), `report_schedules` (cron-style schedule with frequency/auto-approve/recipient config). Migration at `lib/db/drizzle/0024_reports_pipeline.sql`.
- **Core Report Engine** (`artifacts/api-server/src/lib/report-engine.ts`): 8 brand themes (szl/carlota/aegis/terra/vessels/lyte/prism/neutral), 17 composable block types (cover, executive_summary, metrics_row, section_header, body_text, bullet_list, data_table, chart_bar, chart_line, chart_gauge, distress_indicator, status_grid, key_value_pairs, timeline, risk_matrix, signature_block, page_break), built-in domain template library for all 7 domains (8 templates), PDF rendering via PDFKit.
- **Report Store** (`artifacts/api-server/src/lib/report-store.ts`): Versioning with parent_report_id chain, data snapshots, approval workflow state machine, distribution tracking, schedule management, stats aggregation.
- **AI Narrative Generator** (`artifacts/api-server/src/lib/report-narrative.ts`): Domain-aware narrative generation with Anthropic Claude / OpenAI fallback / deterministic structured fallback. Produces per-section analysis + recommendations + confidence score.
- **Reports API** (`artifacts/api-server/src/routes/reports.ts`): Template CRUD, generate (POST /reports/generate), PDF download (GET /reports/:id/pdf), approval workflow (request-approval, review), distribution endpoint, AI narrative endpoint, schedule CRUD + run-due endpoint. Mounted at `/reports/*`.
- **Reports Hub UI** (`artifacts/szl-holdings/src/pages/reports-hub.tsx`): Full reports dashboard with stats cards, domain filter chips, status filter, search, report row cards with action menus (request approval / approve / distribute), detail drawer, generate modal with template selector, distribution modal with email list. Routed at `/reports`.
- **Report Builder UI** (`artifacts/szl-holdings/src/pages/report-builder.tsx`): Drag-and-drop report builder with 17-block palette, live canvas, block data editor panel, brand theme selector (8 themes with color dots), domain template loader, save-as-template and generate-PDF actions. Routed at `/reports/builder`.
- **Scheduled Reports Job** (`artifacts/api-server/src/lib/scheduled-jobs.ts`): `HOURLY_SCHEDULED_REPORTS` registered in the hourly cron loop — queries due schedules, generates reports, updates next_run_at, applies auto-approve rules.

## Financial Compliance & CRM Intelligence Infrastructure (Task #486)
- **New Financial Data Adapters** (`lib/services/src/adapters/`): `edgar.ts` (SEC EDGAR XBRL/FilingsAPI, no key required), `fred.ts` (FRED economic indicators, `FRED_API_KEY`), `market-data.ts` (Alpha Vantage / Polygon.io with auto-provider detection). All adapters fall back to realistic demo data when API keys are absent.
- **Compliance DB Schema** (`lib/db/src/schema/compliance.ts`): 5 new tables — `compliance_suitability` (Reg BI suitability docs), `compliance_archival` (Rule 17a-4 immutable write-once with SHA-256 hash chains), `compliance_supervision_queue` (supervision workflow), `compliance_calendar` (Form ADV/CRS/exam deadlines), `compliance_risk_scores`.
- **Compliance API** (`artifacts/api-server/src/routes/compliance.ts`): Full CRUD for suitability (with approve/reject review workflow), archival (hash-chained immutable entries), supervision queue (escalate/resolve/assign actions), compliance calendar, market-context, and intelligence-fusion endpoints. Mounted at `/compliance/*`.
- **CRM API** (`artifacts/api-server/src/routes/crm.ts`): Routes for `/salesforce/opportunities`, `/salesforce/accounts`, `/salesforce/leads`, `/hubspot/deals`, `/hubspot/contacts`, `/dynamics/opportunities`, and `/crm/sync/:type` (bidirectional sync trigger). All routes return realistic demo data when live CRM APIs are not configured.
- **Firestorm SEC/FINRA Compliance Page** (`artifacts/firestorm/src/pages/compliance/financial-compliance.tsx`): 5-tab command page — Compliance Posture (score gauges), Supervision Queue (action buttons), Compliance Calendar (regulatory deadlines), Rule 17a-4 Archival panel, Intelligence Fusion (market × CRM × compliance cross-domain insights). Accessible at `/cr/financial-compliance` with nav item added.
- **SZL Holdings CRM Intelligence Dashboard** (`artifacts/szl-holdings/src/pages/crm-intelligence.tsx`): Unified pipeline across Salesforce/HubSpot/Dynamics 365 (4 tabs: Pipeline, Accounts, Leads, Sync Status). Accessible at `/crm-intelligence`.
- **ServiceRegistry** updated with `secEdgar`, `fred`, `marketData` adapters in properties, constructor, and adapters health array.

## Ecosystem Audit Notes (Task #474)
- All 9 web app Vite configs have `process.env.GOMAXPROCS = "2"` (limits esbuild threads per process) and `optimizeDeps.holdUntilCrawlEnd: true` to prevent OS thread exhaustion when 18+ dev servers run simultaneously.
- `artifacts/alloy-mobile/` (ghost directory — only node_modules, no source) removed.
- `artifacts/forge/` and `artifacts/inca-lab/` (unregistered dev experiments) removed.
- All 7 Expo mobile apps standardized to `expo-notifications ~0.32.16` and `expo-device ~8.0.10`.
- `artifacts/api-server/src/lib/startup-validation.ts` hardened: replaced `require("crypto")` with ESM `import { randomBytes }`, production now errors on missing/short `ALLOY_INTERNAL_TOKEN`.
- `artifacts/api-server/src/lib/distribution-os-migrations.ts` created to apply `next_follow_up` column to `dos_leads` table (schema-to-DB drift fix).
- `.npmrc` updated to use `${NODE_AUTH_TOKEN:-}` (empty fallback) to suppress NODE_AUTH_TOKEN warning when not set.

## Ecosystem Gap Closure (Task #502)
- Orphaned directories physically deleted: `artifacts/alloy-mobile/`, `artifacts/forge/`, `artifacts/inca-lab/` (all had no package.json or source code; content was previously merged into existing apps).
- Orphaned `artifacts/forge: web` workflow removed — only 16 workflows remain (none auto-started, all on-demand).
- `.npmrc` simplified: removed `@szl-holdings:registry=https://npm.pkg.github.com` — all `@szl-holdings/*` packages are workspace-local; registry line was triggering NODE_AUTH_TOKEN auth warnings.
- Sentry DSN missing fallback changed from `console.warn` to `console.debug` in `lib/observability/src/react/sentry.ts` to reduce noise (Sentry without DSN is expected in dev).
- Database schema dead table audit: 88 schema files, 577 total table definitions, 462 with direct api-server references, 115 with no direct references documented in `docs/schema-audit-2025-04.md`.
- Post-merge integration verified: A2A (`/a2a`), RAG Knowledge (`/rag`), Connector Hub (`/connector-hub`), and Nuro Mesh (`/nuro-mesh`) routes are all registered in routes/index.ts with source files present.
- PRISM Counsel (`artifacts/prism-counsel`) verified working: full source tree with `prism-counsel-app.tsx`, pages, components, hooks, lib directories — no App.tsx needed, uses direct main.tsx entry.
- All 7 mobile apps already had correct package versions: expo-notifications ~0.32.16, @types/react ~19.1.10, @types/react-dom ~19.1.7.
- SZL Holdings web app confirmed loading cleanly with no unexpected browser console errors.

## Knowledge Graph & Vector Embedding Infrastructure (Task #559)
- **pgvector extension** used for vector similarity search — `rag_knowledge_chunks` table has `vector(1536)` column with IVFFlat index (100 lists)
- **4 new DB tables**: `kg_entities`, `kg_relationships`, `kg_cross_domain_links`, `embedding_tasks` with IVFFlat vector index on entities
- **1 new DB table**: `embedding_model_registry` — pre-seeded with BGE-M3, all-MiniLM-L6-v2, text-embedding-3-small/large
- **Migration**: `lib/db/drizzle/0019_knowledge_graph_vector_embeddings.sql`
- **`lib/ai-engine/src/embedding-pipeline.ts`** — multi-provider embedding (HuggingFace, OpenAI), batch processing, async task queue, `toVectorLiteral()`, `cosineSimilarity()`
- **`lib/ai-engine/src/knowledge-graph.ts`** — entity/relationship CRUD, multi-hop traversal (BFS), recursive CTE path finding, label-propagation community detection, centrality scoring, semantic entity search, cross-domain link detection
- **`lib/ai-engine/src/semantic-search.ts`** — unified hybrid search (vector + full-text + RRF scoring), `buildVectorRAGContext()` with citation tracking
- **`lib/ai-engine/src/rag/knowledge-store.ts`** — upgraded from keyword-only to vector-first retrieval with full-text fallback; auto-ingest now also embeds into `rag_knowledge_chunks`
- **`artifacts/api-server/src/routes/knowledge-graph.ts`** — 14 REST endpoints under `/api/knowledge/*`: search, rag-context, graph/:id, graph/:id/paths/:id, entities, relationships, communities, centrality, entities/search, cross-domain, stats, embedding-models, embed/generate, embed/schedule, embed/batch
- **`lib/shared-ui/src/knowledge-graph-viz.tsx`** — `KnowledgeGraphViz` (force-directed SVG with pan/zoom/drag), `GraphLegend`, `NodeDetailPanel`, `GraphStatsCard`
- Package exports added: `@szl-holdings/ai-engine/embedding-pipeline`, `@szl-holdings/ai-engine/knowledge-graph`, `@szl-holdings/ai-engine/semantic-search`

## ML Pipeline Infrastructure (Task #561)
- **Feature Store** (`lib/ai-engine/src/ml-pipeline/feature-store.ts`): Centralized feature registry with 42 domain-specific features across 6 domains (vessels, terra, prism, aegis, szl, lyte). In-memory feature caching with TTL-based expiry, staleness tracking, freshness reports, and feature vector assembly.
- **Domain Templates** (`lib/ai-engine/src/ml-pipeline/domain-templates.ts`): Pre-configured model architectures per domain — 3 Vessels (fuel forecast, ETA regression, maintenance failure), 3 Terra (AVM valuation, rent prediction, distress classifier), 2 PRISM (outcome classifier, settlement probability), 2 Aegis (isolation forest anomaly, threat severity scorer), 3 SZL (deal quality, LP re-up, portfolio health), 3 Lyte (incident forecast, SLA breach, capacity demand). 16 total model templates.
- **Training Pipeline** (`lib/ai-engine/src/ml-pipeline/training-pipeline.ts`): End-to-end pipeline with 5 stages (data extraction → feature engineering → model training → evaluation → registration). Simulated sklearn-style training with domain-appropriate metrics (accuracy/F1/AUC for classifiers, R²/RMSE/MAPE for regression, MAPE for forecasting). Auto-registers completed runs to model registry.
- **ML Model Registry** (`lib/ai-engine/src/ml-pipeline/ml-model-registry.ts`): Version-controlled model storage with full lineage tracking. Lifecycle promotion workflow (experimental → staging → production → deprecated). Auto-demotes previous production models when a new one is promoted. Full model card metadata including hyperparameters, feature importance, and evaluation metrics.
- **Inference Service** (`lib/ai-engine/src/ml-pipeline/inference-service.ts`): Low-latency prediction API with domain-specific output shapes per model type. 5-minute prediction cache keyed by model version + entity. Batch prediction with per-entity error isolation. SHAP explanations on-demand. Confidence scores per prediction.
- **Model Monitor** (`lib/ai-engine/src/ml-pipeline/model-monitor.ts`): KS-test and PSI-based data drift detection per feature. Performance degradation detection against training baseline. Automatic retraining trigger when drift or degradation is detected. Prediction distribution statistics (mean/std/P50/P95).
- **A/B Testing** (`lib/ai-engine/src/ml-pipeline/ab-testing.ts`): Traffic splitting with configurable split %, z-test statistical comparison with Cohen's d effect size, automatic winner selection at configurable p-value threshold, auto-promotes treatment model to production on win conclusion.
- **Explainability** (`lib/ai-engine/src/ml-pipeline/explainability.ts`): SHAP-style feature contribution computation with signed contributions, directionality, and magnitude classification. Domain-specific narrative explanations for all 6 domains and 16 model types. Legal disclaimer included for PRISM predictions.
- **Dataset Manager** (`lib/ai-engine/src/ml-pipeline/dataset-manager.ts`): Dataset versioning with temporal/random/stratified splits. Data quality validation (missing values, duplicates, outlier detection, correlation analysis). Bias metrics (demographic parity, equalized odds, calibration by group). Pre-seeded domain datasets via `bootstrapDomainDatasets()`.
- **ML Pipeline Service** (`artifacts/api-server/src/lib/ml-pipeline-service.ts`): Service façade connecting all 9 modules. Exposes `getMlPipelineStatus()` for system-wide snapshot.
- **REST API** (`artifacts/api-server/src/routes/ml-pipeline.ts`): 40+ endpoints mounted at `/api/ml/*` covering: feature store CRUD, domain templates, dataset management, training runs, model registry with promotion, inference (single + batch), monitoring cycles, A/B test lifecycle, and SHAP explainability. All routes behind `authMiddleware`.
- **DB Schema** (`lib/db/src/schema/ml_pipeline.ts`): 8 new tables — `ml_feature_definitions`, `ml_feature_values`, `ml_datasets`, `ml_training_runs`, `ml_model_versions`, `ml_predictions`, `ml_model_monitoring_snapshots`, `ml_ab_tests`. Full Drizzle schema with indexes, Zod insert schemas, and TypeScript types.

## Monte Carlo Simulation & Scenario Analysis Engine (Task #560)
- **`lib/monte-carlo/`** — new standalone workspace package `@szl-holdings/monte-carlo` with zero external dependencies:
  - `distributions.ts` — 8 probability distributions: normal, log-normal, uniform, triangular, beta, Poisson, constant, custom. Stats: mean/median/stdDev/variance/P5–P99/skewness/kurtosis/CI95. Histogram (50 buckets) and CDF generation.
  - `engine.ts` — configurable simulation runner (1,000–100,000 iterations), async batch execution with timeout, progress callbacks, valid-iteration tracking, constraint violation counting, Pearson correlation matrix across all inputs × outputs. `compareScenarios()` for side-by-side multi-scenario analysis.
  - `sensitivity.ts` — tornado diagram engine: P10/P90 range analysis per input variable, impact percentage ranking, directionality classification, critical assumption identification, narrative generator ("Your outcome is 73% driven by X").
  - `calibration.ts` — historical calibration: MAE/calibration score per output, parameter suggestion engine, backtesting framework (P10-P90 coverage rate, RMSE, hit rate).
  - `scenarios.ts` — 7 domain-specific scenario templates (Vessels voyage cost, Terra IRR model, SZL fund exit MOIC, PRISM litigation outcome, Aegis cyber risk ALE, Nexus geopolitical cascade, Lyte capacity planning TCO). Variant library for base/bull/bear/black swan.
  - `schema.ts` — `ScenarioDefinition` type with inputs, distributions, calculation logic, outputs, constraints, and metadata.
- **`artifacts/api-server/src/lib/monte-carlo-service.ts`** — server-side job manager: in-memory job store, async simulation execution, per-output sensitivity post-processing, job lifecycle (pending → running → complete/error).
- **`artifacts/api-server/src/routes/monte-carlo.ts`** — 9 REST endpoints under `/api/monte-carlo/`:
  - `GET /scenarios` — list all domain scenarios with metadata
  - `GET /scenarios/:id` — full scenario definition with input distributions and variant library
  - `POST /simulate` — start async simulation job (returns jobId for polling)
  - `GET /jobs` — list recent jobs with status/progress
  - `GET /jobs/:id` — full job result including percentile stats, histograms, CDFs, and sensitivity reports
  - `GET /jobs/:id/stream` — SSE endpoint streaming progress and final results in real-time
  - `POST /compare` — side-by-side multi-scenario/multi-variant comparison for a given output metric
  - `POST /calibrate` — run historical calibration check against a completed simulation job
  - `POST /backtest` — P10-P90 coverage backtest against historical data
- **`lib/shared-ui/src/monte-carlo-viz.tsx`** — 7 shared React visualization components (exported from shared-ui index):
  - `ProbabilityDensityPlot` — SVG histogram with mean/median lines and 95% CI shading
  - `CumulativeDistributionCurve` — S-curve with P10/P50/P90 callout points
  - `TornadoDiagram` — horizontal bar chart ranked by impact %, colored by correlation direction
  - `ScenarioComparisonMatrix` — tabular comparison across mean/P10/P50/P90/stdDev with best-case badge
  - `ConfidenceBandChart` — layered CI bands (90% and 50%) with mean/median overlay
  - `SimulationResultCard` — composite card combining headline stats + all three charts + tornado
  - `SimulationProgressTracker` — animated progress bar with iteration count and ETA

## Fund Intelligence Command (Task #526)
A new `/fund` route section adds the industry's first agentic fund operations platform with 11 new pages under `artifacts/szl-holdings/src/pages/fund/`:

- **`/fund`** (`fund/index.tsx`) — Hub page with fund-level metrics (AUM, IRR, TVPI, DPI), all 10 module cards, recent agent activity feed, and action-required alerts.
- **`/fund/deal-scoring`** — AI Deal Flow Scoring Engine: 5 simulated deals with conviction scores (0–100), radar chart analysis across 6 dimensions (team/market/product/traction/competitive/financials), strengths/risks breakdown, and one-click memo generation.
- **`/fund/lp-reports`** — Autonomous LP Report Generation: ILPA-compliant quarterly reports for 23 LPs with IRR/TVPI/DPI/MOIC metrics, AI narrative commentary, PDF export, and one-click delivery.
- **`/fund/portfolio-intelligence`** — Portfolio Financial Intelligence: health scoring for 6 portfolio companies, real-time ARR/burn/runway/NRR monitoring, signal detection (positive/warning/critical), and cohort benchmarking vs. stage medians.
- **`/fund/cap-table`** — Cap Table & Waterfall Engine: full FDSO tracking across 5 share classes and 9 holders, pie chart visualization, waterfall distribution at configurable exit valuations ($10M–$250M), and pro-forma round modeling with dilution analysis.
- **`/fund/exit-modeling`** — Monte Carlo Exit Modeling: 2,000-scenario simulation per company, P10/P50/P90 distribution histograms, portfolio-level bear/base/bull comparison, and optimal exit window recommendations.
- **`/fund/treasury`** — Treasury & Cash Management: real-time cash position tracking, capital call history and scheduling, AI cash flow forecasting for 6 months, and distribution tracking.
- **`/fund/compliance`** — SEC & Regulatory Compliance: Form D, Form PF, Form ADV preparation with AI draft status, 8 compliance tests (ASC 820, AML/KYC, leverage, co-investment policy), and a regulatory calendar.
- **`/fund/lp-crm`** — LP Communication Intelligence: investor CRM with sentiment scores, re-up probability, interaction history, AI-generated meeting prep talking points.
- **`/fund/benchmarking`** — Fund Benchmarking Engine: Cambridge Associates peer comparison across Net IRR/TVPI/DPI, performance radar, vintage year IRR comparison, attribution by portfolio company, and PME (Public Market Equivalent) vs. S&P 500/Nasdaq.
- **`/fund/co-invest`** — Co-Investment & SPV Management: 4 active SPVs with entity details, co-investor tracking (11 co-investors), waterfall structures, document status tracking, and SPV formation doc generation.

All pages are auth-gated via `<RequireAuth>`. A "Fund Intel" dropdown menu was added to the main site navigation.

## Mobile Fleet Stabilization (Task #529)
- **lib/mobile-shared** (`@szl-holdings/mobile-shared`) — shared infrastructure for all 7 Expo mobile apps:
  - **BiometricProvider** + **BiometricLockScreen** — parameterized FaceID/TouchID with auto-lock after configurable timeout, SecureStore-backed preferences
  - **usePushNotificationsBase** — shared push notification registration with token callback, notification listeners
  - **useDeepLinking** — URL scheme handler with pattern matching and param extraction
  - **useBackgroundRefresh** — foreground-aware interval-based data refresh with automatic re-run on app resume
  - **useAppReady** — app lifecycle tracking (foreground/background transitions, session duration)
  - **OfflineBanner**, **useOfflineQueue**, **useOfflineSync** — offline-first data sync
  - **ErrorBoundary**, **NotificationProvider**, **ThemeProvider**, **CopilotFab** — shared UI infrastructure
- All 7 apps have: EAS Build configs (dev/preview/production), App Store metadata, deep linking schemes, notification channels, privacy manifests
- Biometric auth now available in all 7 apps (previously only aegis, carlota-jo, szl-holdings, terra)
- Push notification infrastructure standardized across all 7 apps via shared hooks
- Query persistence (AsyncStorage) added to stephen-mobile (previously missing)
- vessels-mobile crash fixed (EXPO_NO_TELEMETRY=1 + --clear flags)

## Nuro Mesh Graph Intelligence (Task #541)

Production-grade graph capabilities and OSINT feed integration extending the Nuro Mesh AI engine:

### `lib/intelligence-feeds` — OSINT Feed Package (`@szl-holdings/intelligence-feeds`)
- **`src/feed-adapter.ts`** — `BaseFeedAdapter` base class: rate limiting (token bucket), deduplication (SHA-256 content hash, 24h TTL), retry with exponential backoff, health tracking. `NormalizedFeedPayload` — standard output type for all adapters.
- **`src/adapters/ais.ts`** — `AISFeedAdapter`: polls MarineTraffic REST API (v8/exportvessel) or AISHub public feed. Normalizes to Vessel + Port entities with `located_at` relationships. Computes per-vessel risk score from IMO presence, flag state, destination anomalies.
- **`src/adapters/stix-taxii.ts`** — `STIXTAXIIFeedAdapter`: TAXII 2.1 server + AlienVault OTX + public MISP OSINT fallback. Ingests indicators, threat-actors, campaigns, malware, attack-patterns. Maps STIX relationships to ontology types.
- **`src/adapters/sanctions.ts`** — `SanctionsFeedAdapter`: parallel polling of OFAC SDN JSON, EU Consolidated List, UN Security Council XML. Normalizes to Person/Organization/Vessel entities tagged `sanctioned` with `sanctioned_by` relationships. Risk score 0.95 for all designated entities.
- **`src/adapters/legal-records.ts`** — `LegalRecordsFeedAdapter`: CourtListener REST API v3, configurable search queries via `LEGAL_FEED_SEARCH_QUERIES` env. Ingests federal dockets + parties + courts. Case severity scoring by nature of suit.
- **`src/fusion-engine.ts`** — `FusionEngine`: 6 convergence detectors (`sanction_plus_maritime`, `sanction_plus_legal`, `threat_actor_plus_target`, `vessel_dark_shipping_plus_sanction`, `multi_domain_convergence`, `ownership_chain_risk`). Emits `FusionAlert` objects to registered callbacks. Singleton exported as `fusionEngine`.
- **`src/feed-scheduler.ts`** — `FeedScheduler`: per-feed polling with backpressure detection, configurable concurrency, health logging. `setEntityIngestionFn()` wires payloads to ontology engine upsert pipeline. Singleton exported as `feedScheduler`.

### Enhanced Ontology Engine (`lib/ai-engine/src/ontology/ontology-engine.ts`)
New graph algorithms added:
- **`shortestPath(from, to, maxHops)`** — Recursive CTE-based BFS over `entity_relationships` (PostgreSQL `WITH RECURSIVE`), falls back to in-memory BFS. Returns path entities + edges + total weight.
- **`communityDetection(maxIter, domain?, limit?)`** — Label propagation algorithm over entity adjacency matrix. Returns community map with member entities.
- **`computeInfluenceScores(entityIds?, limit?)`** — Weighted in/out-degree centrality (in-edges weighted 1.5×, strength-weighted). Returns ranked influence scores.
- **`temporalGraphAnalysis(entityId, maxHops, minWeight)`** — Recency-weighted edge scoring (1h → 1.0, 1y → 0.3 decay). Returns temporal edge list + monthly cluster analysis.
- **`extractSubgraph(centerId, maxDepth, maxNodes, minRiskScore, minConfidence)`** — Neighborhood extraction for GraphRAG context injection. Returns SubgraphExtraction with weighted, temporally-scored edges.

### Enhanced GraphRAG (`lib/ai-engine/src/ontology/graph-rag.ts`)
- Weighted multi-hop traversal: `combinedScore = vectorScore × 0.5 + graphRelevance × 0.35 + temporalWeight × 0.15`
- `computeGraphRelevance()`: hop decay (0.65^hop) × strength multiplier × significance multiplier × temporal decay × confidence × risk boost
- `serializeSubgraphForPrompt()`: serializes subgraph to structured prompt-injectable text (entities ranked by risk, top-10 weighted relationships)
- Subgraph extraction integration: extracts and includes in `GraphRAGResult.subgraph`
- Risk-score filtered traversal (`riskFilterEnabled` flag)

### Graph Context Injection in Nuro Mesh (`lib/ai-engine/src/nuro-mesh.ts`)
In `callAgent()`, before prompt assembly: queries ontology for entities matching the query, extracts 2-hop subgraph, serializes via `serializeSubgraphForPrompt()`, injects as `### Graph Context` section. Best-effort (fully wrapped in try/catch).

### API Server Wiring (`artifacts/api-server/src/lib/intelligence-feeds-init.ts`)
- `startIntelligenceFeeds()`: registers all 4 feed adapters, sets entity ingestion function (upsertEntity + createRelationship with externalId → UUID resolution), starts feed scheduler.
- Called non-fatally at API server startup; `stopIntelligenceFeeds()` called on SIGTERM/SIGINT.

### Environment Variables (new)
- `MARINETRAFFIC_API_KEY` / `AIS_API_KEY` / `AISHUB_USERNAME` — AIS feed authentication
- `TAXII_SERVER_URL` / `TAXII_API_KEY` / `TAXII_COLLECTION` — Private TAXII server
- `MISP_URL` / `OTX_API_KEY` — MISP/OTX threat intel feeds
- `COURTLISTENER_API_TOKEN` — CourtListener API token (optional, increases rate limits)
- `LEGAL_FEED_SEARCH_QUERIES` — JSON array of search terms for legal records feed
- `AIS_FEED_ENABLED` / `STIX_FEED_ENABLED` / `SANCTIONS_FEED_ENABLED` / `LEGAL_FEED_ENABLED` — Feed on/off toggles (default: all enabled)

## Strategic Ecosystem Gap Fill (Task #578)

Seven new capabilities wired end-to-end with real backend services (not UI mockups):

### 1. CORTEX Voice (`lib/shared-ui/src/cortex-voice.tsx`)
- `defaultQueryHandler` now calls real `/api/cortex/query` endpoint (Nuro Mesh AI orchestrator)
- Falls back gracefully to client-side response if API returns non-OK

### 2. Morning Briefing Engine (`artifacts/api-server/src/routes/briefing.ts`)
- `GET /api/briefing/today` — aggregates live domain signals (vessels AIS, terra distress properties, lyte health scores, portfolio NAV) into executive briefing; persists to `daily_briefings` table
- `GET /api/briefing/history` — returns last 30 briefings from DB
- DB table: `daily_briefings` (id, org_id, briefing_date, headline, executive_summary, signals JSONB, domain_scores JSONB, total_alerts, critical_count, high_count, overall_health, generated_at, is_published)

### 3. Revenue Intelligence Fusion (`artifacts/api-server/src/routes/revenue-intelligence.ts`)
- `GET /api/revenue-intelligence/summary` — aggregates live revenue streams: Stripe MRR, vessel voyage revenue (AIS + simulationEngine day-rate calculation), real estate portfolio value (Terra distress properties), SZL Holdings investment portfolio NAV
- Returns real-time `portfolioNav`, `totalRevenue90d`, `totalMrr` per stream
- DB table: `revenue_events` (id, org_id, stream_id, domain, amount, currency, event_type, event_date, metadata JSONB)

### 4. What-If Simulation Engine (`artifacts/api-server/src/routes/simulation.ts`)
- `POST /api/simulation/what-if` — accepts `variables` map (oil-price, interest-rate, threat-level, market-conditions, fx-usd deltas) and runs impact through `simulationEngine.run()` across all domains
- Returns delta impacts per domain, overall health score, top risks

### 5. Compliance & Audit Provenance Chain (`artifacts/api-server/src/routes/audit-chain.ts`)
- `GET /api/audit-chain/events` — returns paginated audit events with SHA-256 hash chain from `audit_chain_events` table
- `POST /api/audit-chain/verify` — verifies hash chain integrity across a range of events
- DB table: `audit_chain_events` (id, org_id, event_type, actor_id, actor_display_name, resource_type, resource_id, action, payload JSONB, prev_hash, event_hash, created_at)

### 6. White-Label Client Portals (`artifacts/api-server/src/routes/partner.ts`)
- `GET /api/partner/portals` — returns partner portal configurations for the authenticated org
- `POST /api/partner/portals` — creates new white-label portal entry
- Frontend `portal-admin.tsx` calls real API with `DEMO_PORTALS` fallback for unauthenticated state

### 7. Multiplayer Command Sessions (`artifacts/api-server/src/routes/multiplayer-sessions.ts`)
- `GET /api/sessions/command` — lists active command sessions
- `GET /api/sessions/command/:sessionId` — returns session details + participants + comments
- `POST /api/sessions/command` — creates new session; broadcasts via WebSocket `publish()`
- `POST /api/sessions/command/:sessionId/join` — join session
- `POST /api/sessions/command/:sessionId/comment` — post comment to session
- `MultiplayerSessionBanner` polls `/api/sessions/command/:sessionId` every 15 seconds
- DB tables: `command_sessions`, `command_session_comments`

## Platform Hardening (Task #530)
- **CI/CD Pipelines**: Full GitHub Actions suite — ci.yml (lint, typecheck, test, build), deploy.yml (Replit), e2e.yml (Playwright matrix), lighthouse.yml, release.yml (auto-versioning), security.yml (SBOM + audit), codeql.yml, dependency-review.yml, container-publish.yml, npm-publish.yml, prism-counsel-ci.yml (Azure)
- **Dependabot**: `.github/dependabot.yml` configured for all package ecosystems
- **Unit Tests**: `tests/unit/config/` (17 tests for @szl-holdings/config), `tests/unit/observability/` (7 tests for telemetry collectors)
- **APM**: `lib/observability/` (ServerTelemetryCollector, ClientTelemetryCollector, GenAI telemetry, OpenTelemetry, Sentry, Living Mesh), `artifacts/api-server/src/routes/apm.ts` (latency/spans/snapshot endpoints), `artifacts/api-server/src/lib/self-monitor.ts` (auto-alerting)
- **Disaster Recovery**: `artifacts/api-server/src/lib/backup-service.ts` (pg_dump, manifest, retention), `artifacts/api-server/src/routes/backup.ts` (status/run/export-tenant)
- **Feature Flags**: `artifacts/api-server/src/lib/platform-flags.ts` (18 platform flags, per-user/org/role overrides, percentage rollouts, evaluation context), `artifacts/api-server/src/routes/feature-flags.ts` (full CRUD + evaluate API), `artifacts/api-server/src/middlewares/feature-flag.ts` (route gating)
- **API Versioning**: `artifacts/api-server/src/middlewares/api-version.ts` — X-Api-Version header, deprecation/sunset headers, requireMinVersion middleware, supported versions: 2025-01-01 (deprecated), 2026-04-15 (current)
- **Rate Limiting**: `artifacts/api-server/src/middlewares/rate-limiters.ts` (express-rate-limit: global/read/write/public/GDPR), `artifacts/api-server/src/middlewares/sliding-window-limiter.ts` (PostgreSQL-backed atomic per-user/per-endpoint limits)
- **Multi-Environment**: `artifacts/api-server/src/lib/env-config.ts` (dev/staging/prod detection, per-env feature toggles)

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