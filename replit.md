# SZL Holdings Platform

## Overview
SZL Holdings offers FORGE, a governed operational intelligence platform for regulated enterprises. The platform, including A11oy, provides a governed execution fabric where enterprise signals, agents, tools, people, policies, and proof operate as one controlled system. It's a comprehensive solution for decision intelligence and operational oversight, targeting highly regulated sectors requiring stringent compliance and auditable AI applications.

The platform is a pnpm monorepo supporting web and mobile applications, an API, and a design system. Its core focus is Governed Workflow Orchestration and Maritime Intelligence, with key capabilities like the Sovereign Execution Lab (A11oy Phase 3), the A11oy Agentic Layer (Phase 4) with robust agent orchestration and an SDK, the A11oy Mythos Doctrine for governance, the A11oy Compliance Fabric (Layer 9) for regulatory alignment, the A11oy DARPA Resilience Layer for robustness and explainability, and OMNIA, a Unified Portfolio Intelligence Layer.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.

## System Architecture
The platform is a pnpm monorepo, known as the FORGE Execution and Evidence Platform (AEEP), built with TypeScript 5.9, React 19, Vite, and Node.js, employing a micro-frontend architecture.

**Core Architectural Primitives:**
- **FORGE Execution Fabric:** Incorporates Human-in-the-loop governance, Outcome Graph, Proof Chain, and Covenant Policy.
- **Sovereign Execution Substrate:** Provides a durable, governed, and replayable runtime for orchestration and policy enforcement.
- **Workflow Engine:** Orchestrates durable business processes.
- **Event Fabric (PRISM Bus):** A cross-domain event bus.
- **SZL Foundation – Trace Graph:** The canonical trace layer for agent runs and workflow steps.
- **ATLAS Enterprise State Model:** A shared entity vocabulary and event taxonomy.
- **Living Signal Mesh & Evidence Graph:** Unifies event/signal handling with a 9-stage pipeline and an `EvidenceStore`.
- **Memory Fabric & FORGE Runtime:** A tiered memory layer with provenance, freshness, retention, and sensitivity tracking.

**Monorepo Structure:** Organizes active/archived artifacts, shared infrastructure, and packages for business observability, AI Control Plane, NVIDIA-Ready Modules, and Substrate Edge Inference, utilizing Drizzle ORM for PostgreSQL schemas. Key AI packages: `packages/ai-control-plane` (routing, fallback, cost), `packages/nvidia-adapters` (NIM endpoints), `packages/substrate-adapters` (oLLM local GPU inference), `lib/ai-engine` (model router, telemetry). The Substrate inference service lives at `apps/substrate-inference/` (Python/FastAPI).

**UI/UX and Design System:** The Governed-Intelligence Design Language v2 (`@szl-holdings/design-system`) is the single visual source of truth, defining the enterprise accent palette, typography, spacing, and UI components. All authenticated product surfaces are evidence-first, utilizing a pure dark theme with a single warm accent. The platform uses a One-of-One Platform Shell to unify user interfaces across applications.

**API Layers:** Includes REST API, GraphQL API (Apollo Server), and an MCP Gateway.

**AI Infrastructure:** Features a multi-provider AI backend, AI evaluation infrastructure, AI Ops Dashboard, NVIDIA-Ready Packages, and Substrate Edge Inference (oLLM).
- **Forge – AI Runtime, Agent Factory & Promotion Pipeline:** Manages the governed lifecycle of AI agents.
- **Precision Evolution Runtime (PER):** A governed, evidence-gated system for continuously evolving agent policies.
- **PRAXIS – Unified Agentic AI Layer:** An internal tooling sandbox for AI agent research, memory management, skill registry, and AI Control Plane features.
- **A11oy Agent Runtime:** A governed, agentic execution fabric ensuring controlled execution through governance invariants. Evolved into a Proof-Carrying Agentic Execution Platform with 9 capabilities:
  1. **Agent Gateway** (`/connectors`): ConnectorFirewall evolved with mTLS, SPIFFE, Model Armor, Air Traffic Control.
  2. **A2A Interop** (`/a2a-interop`): Agent-to-Agent protocol layer with Agent Cards, Task Lifecycle, Network Topology.
  3. **Reasoning Proof Engine** (`/proof`): ProofLedger evolved with full reasoning traces (premises→inference→conclusion), Reasoning Replay, Proof Diff.
  4. **Governed Memory Vault** (`/memory`): Memory evolved with two-layer architecture (Session Memory + Memory Bank), consolidation proof chain, retrieval traces.
  5. **Agent Identity Registry** (`/agent-identity`): Cryptographic agent identity with SPIFFE URIs, X.509 certs, behavioral trust scores, drift detection.
  6. **MirrorEval + Reasoning Verification** (`/evals`): 14-dimension eval harness with formal reasoning verification (PROVEN/UNPROVEN/VIOLATED verdicts), covenant compliance.
  7. **Self-Optimization Engine** (`/self-optimization`): RL-based optimization with targets, reward signals, policy gradients, human-lockable params.
  8. **Signal Mesh + Knowledge Graph** (`/signals`): SignalMesh evolved with entity registry, semantic search, cross-domain relationship discovery.
  9. **Governed Security Agents** (`/security-agents`): Alert Triage, Detection Engineering, Threat Analysis agents modeled on Google's Unified Security Agents.
- **AI Provenance & Explainability Contract:** Every AI-generated output carries a `ProvenanceEnvelope` with essential metadata.

**Other Technical Implementations:**
- **Red-Team Game Day Engine:** Live competitive crisis simulation with synthetic traffic injection, 4-dimension resilience scoring (TTD, TTR, Runbook Adherence, Business Impact Containment), per-participant scoring, leaderboard with opt-in privacy, resilience score trending on executive dashboard, 5 starter scenarios, and branded PDF debrief export. Accessible at `/strategy/game-day` in Command.
- **Cross-Domain Signal Bus (Alert Bus):** A "When/then" automation engine routing signals across product domains. Includes `notify_channel` action type for routing signals through the Outbound Gateway to any configured channel.
- **Outbound Gateway:** Unified omni-channel notification layer (`outbound-gateway.ts` service + route) with pluggable adapters for webhook, email, SMS, Slack, Teams, Discord. Features delivery tracking, retry with exponential backoff, audit logging, and stats. DB tables: `outbound_deliveries`, `outbound_channel_configs`, `outbound_audit_log`.
- **Conduit — Reverse ETL:** Visual no-code tool for operators to map SZL internal data to 13 third-party SaaS destinations (Salesforce, HubSpot, Slack, Google Sheets, Notion, Airtable, Zendesk, Marketo, Intercom, Pipedrive, Mailchimp, Segment, Webhook). Features a drag-and-drop field mapping editor, sync scheduling, run history with row-level audit, and 4 built-in templates. Artifact at `/conduit/`. API at `/api/conduit/` (public). DB tables: `conduit_connections`, `conduit_syncs`, `conduit_sync_mappings`, `conduit_sync_runs`, `conduit_sync_run_rows`, `conduit_templates`. Schema at `lib/db/src/schema/conduit.ts`. Migration at `lib/db/migrations/0042_conduit_reverse_etl.sql`. Routes at `artifacts/api-server/src/routes/conduit.ts`. Shared proxy route: `CONDUIT_PORT = 5300` in `packages/shared-proxy/src/index.ts`.
- **SIEM Export Adapters:** Outbound export of Sentra findings to external SIEMs in CEF (Splunk HEC), ASIM (Microsoft Sentinel), and UDM (Google Chronicle) formats. Located in `api-server/src/siem/adapters/` with registry at `siem/export-registry.ts`. Route at `/api/sentra/siem-export/`. DB tables: `siem_export_connections`, `siem_export_events`. UI at Sentra → EDR & SIEM → SIEM Export.
- **Carlota Jo Drip Email Engine:** Lead nurturing drip sequences for consulting engagement. Supports multi-step email sequences with configurable delays, enrollment, engagement tracking (opens/clicks/bounces), unsubscribe with HTML page, and batch processing. Route at `/api/booking/drip/`. DB tables: `carlota_drip_sequences`, `carlota_drip_steps`, `carlota_drip_enrollments`, `carlota_drip_engagement_events`. UI at Carlota Jo → `/drip-campaigns`.
- **Document Lifecycle Engine:** DB-backed configurable state machine (draft→review→sign→file→archive) with `document_lifecycle`, `document_audit_trail`, and `lifecycle_workflow_config` Drizzle tables. Role-based transitions via server-side `req.user.roles` + `ROLE_HIERARCHY`, org-scoped access via `getUserOrgIds`. Entity type registered in ontology (`document` + `fund`), API routes at `/document-lifecycle`.
- **Court Filing Package Generation (Counsel):** Jurisdiction-aware filing packages with PACER/NYSCEF/CA/TX/IL cover sheet templates, exhibit index tables, certificates of service, and filing status tracking.
- **E-Signature Integration (Counsel):** Document routing for e-signature with per-signatory tracking, lifecycle state indicators, event timeline, and provider-agnostic status visualization. Webhook HMAC-SHA256 verification via `ESIGNATURE_WEBHOOK_SECRET`. Lifecycle binding: send transitions document to `sign`, completion webhook transitions to `file`, decline reverts to `review`.
- **Multi-Fund Tenancy (Aegis):** Fund-scoped dashboards with GP/LP access control, per-fund LP management tables (commitment/called/distributed/NAV/call%), cross-fund LP rollup aggregation, and `/fund-management` backend API routes with financials/KPIs/investor/rollup endpoints. Access gated by RBAC + org membership validation.
- **Pixel-Perfect PDF Export (Aegis):** Immutable metric snapshot freezing at export time, export history panel with frozen snapshots, section-configurable report preview, and `/aegis-export` backend API with freeze/snapshots/render-pdf endpoints. Frontend calls backend to persist frozen metrics.
- **Historical Event Backfill (Signal Bus):** POST `/signal-bus/backfill` endpoint replaying historical signals from `meshSignalsTable` through the rule engine. Requires admin/ops role, org-scoped rules and signals via `getUserOrgIds`, dry-run support with match details, auditable actor context, 90-day max range guardrail. Propagates `tenantId` through `createSignal` for tenant-aware derived signals.
- **AEEP Core Packages:** Includes contracts, agent core, workflow runtime, retrieval core, memory core, memory fabric, evidence ledger, policy guard, domain profiles, and platform metrics registry, featuring a two-stage retrieval pipeline, multimodal retrieval, and scoped memory management.
- **Email Deliverability:** All outbound transactional email uses a centralized library with suppression lists.
- **Multi-Agent Crew System:** Specialized agent roles (analyst, drafter, hunter, sourcer, coordinator) with plan decomposition and trust-aware execution in `packages/alloy/src/multi-agent-crew.ts`.
- **Trust Score Engine:** Graduated autonomy system with rolling accuracy tracking, trust levels (untrusted→supervised→trusted→autonomous), auto-promotion/demotion, and approval routing in `packages/alloy/src/trust-score.ts`.
- **Fine-Tuned Model Router:** Domain-aware model routing with fine-tuned model resolution and cascading fallback chains in `lib/ai-engine/src/fine-tuned-router.ts`.
- **Multi-Language Voice Pipeline:** 5-language support (en/es/zh/ar/fr) with auto-detection, multilingual transcription, TTS, and voice chat in `lib/ai-engine/src/providers/openai/audio/multilingual.ts`.
- **Offline-First Sync:** Mobile offline sync with local cache, background sync queue, conflict resolution in `artifacts/szl-holdings-mobile/lib/offline-sync.ts` and `hooks/useOfflineSync.ts`.
- **Wake-Word Detection:** On-device "Hey Command" wake-word detection supporting 5 languages in `artifacts/szl-holdings-mobile/hooks/useWakeWord.ts`.
- **Mobile Web Parity:** Global search, agent trust dashboard, and offline sync status screens in mobile app.
- **Mobile Biometric Sign-In:** Real server-side authentication factor with cryptographic proof-of-possession.
- **Unified Auth Mesh:** A backend-only authentication unification layer using custom HS256 JWT, with specific priority order, new database tables, and routes for OAuth and API keys.
- **Forecast & Anomaly Fabric:** Unified forecasting service with calibrated interval outputs, and a unified streaming and batch anomaly detection service. Includes drift detection and champion-challenger evaluations.
- **Premium Data Fabric:** Adapter framework (`lib/ai-engine/src/data-fabric/`) with schema mapping, refresh scheduling, cost metering, entity caching, health tracking, and provenance. Four premium adapters: Property Market (Terra), Satellite AIS+RF (Vessels), Macro Indicators (Lyte), Sanctions/PEP (Vessels+Counsel). Barrel export at `@szl-holdings/ai-engine/data-fabric`.
- **Predictive Cap Rate Model:** ML-driven cap rate forecasting for Terra with feature importance, directional probability, Monte Carlo simulation, and historical series. API at `/api/terra/cap-rate/predict`. Frontend at Terra `/cap-rate-model`.
- **Voyage Economics Calculator:** Full voyage P&L calculator for Vessels with vessel classes, routes, bunker prices, canal fees, charter rates, carbon emissions. API at `/api/vessels/voyage-calc/*`. Frontend at Vessels `/voyage-calculator`.
- **Causal Scenario Backtesting:** Historical event replay validating the Causal Scenario Engine's predictions with accuracy metrics, directional accuracy, and per-shock-type analysis. API at `/api/scenarios/backtest/*`. Frontend at Lyte `/backtesting`.
- **Monte Carlo Simulation Fabric:** Configurable stochastic simulation engine with 1,000–100,000 path generation, 7 distribution types (normal, log-normal, uniform, triangular, beta, Poisson, constant), probability-weighted outcome bands (P5–P95), sensitivity tornado charts, correlation matrix, CDF curves, and histogram visualization. Three preset scenarios: Terra cap-rate forecast, Vessels voyage P&L, Lyte revenue forecast. API at `/api/monte-carlo-fabric/*`. Frontend at Lyte `/monte-carlo`.
- **OpenAI Agents SDK Bridge:** Wires `@openai/agents@0.0.15` into the SZL observability stack, implementing `TracingProcessor`, `GuardrailAdapter`, `ToolAdapter`, and `AgentAdapter` for governed agent execution.
- **DARPA MTO Innovation Hub, Post-Quantum Cryptography Readiness, Hardware Root of Trust, Adversarial ML Defense Console, Cyber Innovation Roadmap:** Integrated modules for advanced cybersecurity and resilience.
- **Sentra Offensive/Defensive Cyber Command Expansion:** New and upgraded pages for cybersecurity command and defense.
- **Karpathy-Distilled Agent Evolution:** Six Karpathy-inspired engine primitives in `lib/ai-engine/src/karpathy/`: (1) **Residual Intelligence Stream** — cross-agent accumulated intelligence with audit trail, (2) **Autonomy Depth Dial** — single 1-10 complexity knob auto-deriving agent count, governance strictness, gate thresholds, and all capability toggles, (3) **Four Karpathy Gates** (ThinkGate, SimplicityGate, SurgicalScopeGate, GoalVerificationGate) — composable quality gates with verdict/audit log, (4) **Agent Distillation Engine** — observes chain executions, detects convergence, proposes compressed single-agent replacements, (5) **Ephemeral Reasoning Chains** — explore/branch/backtrack/synthesize with garbage collection, (6) **Self-Distilling Knowledge Base** — Jaccard-similarity merging, confidence pruning, consolidation passes. All wired into `NuroMeshOrchestrator.orchestrate()` in nuro-mesh.ts. Exported from `@szl-holdings/ai-engine` via `karpathy/index.js`. A11oy dashboard at `/a11oy/karpathy-evolution`.

## External Dependencies
-   **Database:** PostgreSQL 16
-   **Authentication:** Replit Auth
-   **Payment Processing:** Stripe
-   **AI Providers:** OpenAI, Anthropic, Gemini, HuggingFace Inference API, HuggingFace MCP, Elevenlabs, Substrate/oLLM (local GPU)
-   **Communication:** Slack, Twilio, Resend, SendGrid
-   **Maritime Data:** MarineTraffic, AISHub, Digitraffic AIS, BarentsWatch AIS, Open-Meteo Marine Weather
-   **Threat Intelligence:** STIX/TAXII, AlienVault OTX, MISP OSINT, OFAC SDN, EU Consolidated List, Shodan, GreyNoise, MalwareBazaar
-   **Government Data:** CISA KEV, NVD CVE, MITRE ATT&CK, Census/BLS, FEMA NRI, NYC Open Data, SEC EDGAR
-   **Legal Data:** CourtListener REST API
-   **Other APIs/Services:** GitHub API, Figma, Google APIs, HubSpot