# SZL Holdings Platform

## Overview
SZL Holdings offers FORGE, a governed operational intelligence platform for regulated enterprises. The platform includes **A11oy Phase 3 — Sovereign Execution Lab** — the governed execution fabric where enterprise signals, agents, tools, people, policies, and proof operate as one controlled system. A11oy is a fully-rendered web artifact at `artifacts/a11oy` (path `/a11oy/`) with 19 product surfaces: Hero, NowBoard, CommandSurface, SignalMesh, ActionRail, ProofLedger, Governance, Agents, Workcells, MirrorEval, ConnectorFirewall, TwinFoundry, TrustCenter, ModelRouter, SkillsLibrary, WorkcellReplay, Sovereign, BoardroomMode, and InvestorDemo.

**Phase 3 additions (Sovereign Execution Lab):**
- Model Router (5 provider profiles, routing policy, health monitoring)
- MirrorEval 2.0 (14-dimension eval suite, 5 dispositions, regression suite)
- Workcell Replay (flight recorder index → detail with step timeline)
- Connector Firewall (default-deny registry, trust scores, prompt injection blocking)
- Twin Foundry (30+ business twins, drift scoring, no-action vs. approved-action simulation)
- Skill Library (15 named skills, demo execution, tool allowlist policy)
- Boardroom Mode (board packet generation, KPIs, exec summary, proof references)
- Trust Center (governance controls accordion, security claims, what-is-built vs. roadmap)
- Investor Demo (12-step guided product narrative with live approval gate demo)
- Sovereign landing (telemetry rollup, regenerate, sovereign self-test)

**Phase 3 backend:** `artifacts/api-server/src/routes/a11oy-sovereign-api.ts` — 18 endpoints mounted at `/api/a11oy` covering all Phase 3 surfaces with rich seed data (6 tenants, 5 model profiles, 40+ evals, 15 replays, 12 connectors, 30+ twins, 15 skills, 5 board packets, 50+ telemetry spans).

**A11oy Substrate Engine:** `reports/a11oy-substrate/cli.py` — Python CLI that generates 7 vertical artifact JSON files (pulse, finance_fincept, lyte_kora, terra, vessels, prism_counsel, marketing_growth) under `reports/a11oy-substrate/artifacts/`. Run with `python3 reports/a11oy-substrate/cli.py --all`. Security: output restricted to artifacts dir, atomic writes, 0600 file mode, absolute path redaction. Strategy bundle export: `python3 reports/a11oy-substrate/website/export_strategy_bundle.py`.

**A11oy Networking:** A11oy uses the shared proxy on port 9090 (`@szl-holdings/shared-proxy`) with `VITE_PORT=4110` for its Vite dev server. Route `/a11oy/` → port 4110 is registered in `packages/shared-proxy/src/index.ts`.

**Phase 3 docs:** `docs/A11OY_PHASE3_ARCHITECTURE.md`, `docs/HUMAN_GATED_AUTONOMY.md`, `docs/CONNECTOR_FIREWALL.md`, `docs/MIRROREVAL.md`, `docs/INVESTOR_DEMO_SCRIPT.md`, `docs/A11OY_PHASE3_SECURITY_POSTURE.md`.

The platform is a pnpm monorepo supporting web and mobile applications, an API, and a design system. Its core purpose is Governed Workflow Orchestration (FORGE + Command + KORA) and Maritime Intelligence (SEXTANT), with specialized extensions like PARAGON, DOMAINE, Counsel, and Carlota Jo built upon its governed foundation. The business vision is to provide a comprehensive solution for decision intelligence and operational oversight in highly regulated environments, with strong market potential in sectors requiring stringent compliance and auditable AI applications.

## Task #3561 — One-of-One Multimodal Experience & Trust Proof (10 features)

### Mobile (szl-holdings-mobile)
- **T001: Multilingual voice** — `hooks/useVoiceCommand.ts` extended with en/es/zh language adapters, domain keyword routing per locale, and locale-specific TTS responses. `VoiceCommandModal.tsx` accepts `language`+`onLanguageChange` props and renders an inline language picker.
- **T002: Wake-word detection** — `hooks/useWakeWord.ts` — on-device keyword-spotting pattern with per-language wake phrases, cooldown management, and `startMonitoring`/`stopMonitoring` controls.
- **T003: Offline-first sync banner** — `components/OfflineBanner.tsx` with animated spring entry/exit. Wired into `app/(shell)/_layout.tsx` via `@react-native-community/netinfo` + new `hooks/useOfflineQueue.ts` for queue-count display.

### Web — CRDT (lib/crdt-sync)
- **T004: CRDT live collaboration** — `lib/crdt-sync/src/collaboration.ts` — `CollaborationRoom` class with BroadcastChannel sync, Presence tracking, cursor sharing, heartbeat, and stale-presence pruning. All symbols re-exported from `index.ts`.

### Web — szl-holdings
- **T005: Digital twin simulator** — `src/pages/digital-twin-simulator.tsx` — in-browser simulation mesh for 3 domains: vessel route replay (storm diversion/chokepoint/emergency), property portfolio stress testing (vacancy/cap rate/rate shock), and security posture rehearsal (threat simulation/tabletop/breach). SVG canvas renders for each domain. Route: `/digital-twin`.
- **T007: NEXUS graph hop traversal** — `src/components/NexusHopQuery.tsx` — entity search + max-hop selector + BFS traversal over `NEXUS_EDGES` + natural-language answer generation. Integrated as "Hop Traversal" tab in `src/pages/nexus-explorer.tsx`.

### Web — Aegis (PARAGON)
- **T006: Chaos engineering drills** — `src/pages/chaos-engineering-drills.tsx` — 5 fault scenarios, animated progress pipeline, recovery scoring (0-100), generated playbooks (8 steps per scenario), drill history. Nav entry: War Room & Exercises → Chaos Engineering Drills (`/chaos-drills`).
- **T008: Federated learning config** — `src/pages/federated-learning.tsx` — privacy-preserving gradient aggregation, per-tenant privacy budget tracking, round history, architecture diagram, model config (ε, δ, clipping). Nav entry: Research Intelligence → Federated Learning (`/intel/federated-learning`).
- **T009: Multi-fund tenancy views** — `src/pages/multi-fund-view.tsx` — GP roll-up with consolidated KPIs, per-fund IRR/TVPI/DPI metrics, portfolio position drill-down, LP vs GP access badges. Nav entry: Governance → Multi-Fund View (`/multi-fund`).
- **T010: PDF export for Aegis** — `src/pages/aegis-pdf-export.tsx` — section selector, print-preview (scaled 85%), full print stylesheet via `@media print`, format picker (Full Board Report / Executive Brief). Nav entry: Governance → PDF Export (`/pdf-export`).

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
The platform is a pnpm monorepo built with TypeScript 5.9, React 19, Vite, and Node.js, employing a micro-frontend architecture for web applications. It has evolved into the FORGE Execution and Evidence Platform (AEEP).

**Core Architectural Primitives:**
- **FORGE Execution Fabric:** Provides human-in-the-loop governance, an Outcome Graph, Proof Chain, and Covenant Policy.
- **Sovereign Execution Substrate:** A durable, governed, and replayable runtime for orchestration, planning, governance, and policy enforcement.
- **Workflow Engine:** Orchestrates durable business processes.
- **Event Fabric (PRISM Bus):** A cross-domain event bus.
- **Monte Carlo (Decision Simulation):** For probabilistic risk assessment.
- **SZL Foundation – Trace Graph:** Canonical trace layer for agent runs and workflow steps.
- **ATLAS Enterprise State Model:** Defines a shared entity vocabulary and event taxonomy.
- **Living Signal Mesh & Evidence Graph:** Unifies event/signal handling with a 9-stage pipeline and `EvidenceStore`.
- **Memory Fabric & FORGE Runtime:** Tiered memory layer with provenance, freshness, retention, and sensitivity tracking.

**Monorepo Structure:** Organizes active/archived artifacts, shared infrastructure, and packages for business observability (ATLAS), AI Control Plane, and NVIDIA-Ready Modules. Drizzle ORM manages PostgreSQL schemas.

**UI/UX and Design System (v2):** The Governed-Intelligence Design Language v2 (`@szl-holdings/design-system`) is the single visual source of truth, defining an enterprise accent palette, typography, spacing, and UI components. All authenticated product surfaces are evidence-first.

**One-of-One Platform Shell:** Unifies user interfaces across applications with shared modules.

**API Layers:** Includes REST API, GraphQL API (Apollo Server), and an MCP Gateway.

**AI Infrastructure:** Features a multi-provider AI backend, AI evaluation infrastructure, an AI Ops Dashboard, and NVIDIA-Ready Packages.

**Forge – AI Runtime, Agent Factory & Promotion Pipeline:** Manages the governed lifecycle of AI agents.

**Precision Evolution Runtime (PER):** A governed, evidence-gated system for continuously evolving agent policies, including candidate registration, calibration, evaluation, drift-checked promotion, canary rollout, and immutable audit.

**PRAXIS – Unified Agentic AI Layer:** An internal tooling sandbox for AI agent research, memory management, skill registry, protocol bridging, and AI Control Plane features.

**KORA – Decision Intelligence:** A flagship application for executive narratives, signal feeds, and decision centers, characterized by a dark amber design language.

**AI Provenance & Explainability Contract:** Every AI-generated output carries a `ProvenanceEnvelope` with essential metadata (`runId`, `model`, `provider`, `promptHash`, `tokens`, `costEstimateUsd`, `confidence`, `sources[]`, `toolCalls[]`, `governanceVerdict`).

**Cross-Domain Signal Bus (Alert Bus):** A "when/then" automation engine routing signals across product domains using `signal_bus_rules`.

**AEEP Core Packages:** Includes contracts, agent core, workflow runtime, retrieval core, memory core, memory fabric, evidence ledger, policy guard, domain profiles, and platform metrics registry. Key features include a two-stage retrieval pipeline, multimodal retrieval, and scoped memory management (session, domain, executive, compliance).

**A11oy Agent Runtime:** Layers a fully governed, agentic execution fabric. Key runtime modules include Types, Tracing, Memory, Model Router, MirrorEval (11 score dimensions), Deep Context, Tool Registry (23 tools), Approved Runner, PCE Gate (Proof-Carrying Execution), 10 Operators, and Workcells (14-phase state machine). Governance invariants ensure no execution without PCE gate approval, demo mode blocks destructive tools, MirrorEval gates action briefs, proof packets are generated, and sensitive memory fields are redacted.

**Email Deliverability:** All outbound transactional email uses `artifacts/api-server/src/lib/email.ts`, featuring a suppression list, automatic suppression via bounce/complaint webhooks, unsubscribe links, and admin routes.

**Mobile Biometric Sign-In:** Implemented as a real server-side authentication factor with cryptographic proof-of-possession, managing device registrations, step-up assertions, and biometric challenges.

**Unified Auth Mesh (Task #3578):** Backend-only authentication unification layer. Auth priority order: internal `x-internal-token` → OAuth JWT bearer → API key bearer → session cookie. New DB tables: `oauth_clients` (machine client registry) and `mesh_call_log` (call-level observability). New routes: `POST /api/oauth/token` (OAuth 2.0 client_credentials), `GET/POST /api/oauth/clients`, `GET/POST/DELETE /api/api-keys`, `GET /api/mesh/topology`, `GET /api/mesh/principals`. Custom HS256 JWT in `mesh-jwt.ts` (no external library). Fire-and-forget `meshCallLogger` middleware records who calls whom, latency, and status for every authenticated request.

**Forecast & Anomaly Fabric:** Unified forecasting service (`packages/forecast-fabric`) with calibrated interval outputs, and a unified streaming and batch anomaly detection service (`packages/anomaly-fabric`). Drift detection (`packages/drift-eval`) for performance drift against baseline snapshots and champion-vs-challenger evaluations.

**OpenAI Agents SDK Bridge (`packages/agents-sdk-bridge`):** Wires `@openai/agents@0.0.15` into the SZL observability stack. `SzlTracingProcessor` implements `TracingProcessor` and dual-exports SDK traces to Trace Graph + Cognitive Observability, routing `agent`, `generation`, `function`, `guardrail`, and `handoff` span types to the appropriate SZL sinks. `SzlGuardrailAdapter` wraps `evaluateFull()` from the Policy Engine as SDK-compatible input/output guardrail functions. `SzlToolAdapter` converts Tool Mesh `ToolManifest` objects into SDK `FunctionTool` instances. `SzlAgentAdapter` wraps Nuro Mesh agent configs into SDK `Agent` instances. `SdkRunner` provides a governed `run()` loop with behavioral tracing and approvals. The API server (`artifacts/api-server`) uses `useAgentsSdk` flag in agent configs to opt in to the SDK path. 35 unit/integration tests across 5 test files.

## External Dependencies
-   **Database:** PostgreSQL 16
-   **Authentication:** Replit Auth
-   **Payment Processing:** Stripe
-   **AI Providers:** OpenAI, Anthropic, Gemini, HuggingFace Inference API, HuggingFace MCP, Elevenlabs
-   **Communication:** Slack, Twilio, Resend, SendGrid
-   **Maritime Data:** MarineTraffic, AISHub, Digitraffic AIS, BarentsWatch AIS, Open-Meteo Marine Weather
-   **Threat Intelligence:** STIX/TAXII, AlienVault OTX, MISP OSINT, OFAC SDN, EU Consolidated List, Shodan, GreyNoise, MalwareBazaar
-   **Government Data:** CISA KEV, NVD CVE, MITRE ATT&CK, Census/BLS, FEMA NRI, NYC Open Data, SEC EDGAR
-   **Legal Data:** CourtListener REST API
-   **Other APIs/Services:** GitHub API, Figma, Google APIs, HubSpot