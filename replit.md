# SZL Holdings Platform

## Overview
The SZL Holdings Platform is a governed decision infrastructure designed to enforce governance, attribution, and outcome tracking for critical decisions. It integrates signal detection with action execution through a canonical nine-step loop: Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning. The platform is a pnpm monorepo consisting of web and mobile applications, an API, a design system, and a development sandbox. Its core capabilities are built around six platform primitives: Outcome Graph, Proof Chain, Covenant Policy, Decision Simulation, Workflow Engine, and Event Fabric. The project aims to provide comprehensive decision-making support with robust governance and observability.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
The platform is a pnpm monorepo utilizing TypeScript 5.9, React 19, Vite, and Node.js. It employs a micro-frontend architecture for web applications, routed via a shared gateway proxy on port 9090.

**Core Platform Primitives:**
-   **Outcome Graph:** Manages the decision lifecycle and outcomes.
-   **Proof Chain:** Ensures an immutable audit trail with provenance.
-   **Covenant Policy:** Handles permissions and human approval gates.
-   **Monte Carlo (Decision Simulation):** Provides probabilistic risk assessment.
-   **Workflow Engine:** Orchestrates durable business processes.
-   **Event Fabric (PRISM Bus):** A cross-domain event bus for signal routing.

**Monorepo Structure:** It comprises active and archived artifact directories, numerous shared library packages for infrastructure and primitives, and dedicated packages for business observability, AI Control Plane, and NVIDIA-Ready Modules. The database schema consists of 569 tables managed by Drizzle ORM.

**Business Observability Fabric (ATLAS):** Implemented via three packages (`@szl-holdings/observability-core`, `@szl-holdings/business-events`, `@szl-holdings/telemetry-standards`) for OpenTelemetry setup, event emission, and semantic conventions.

**Canonical Artifacts (Active Applications):** Key applications include `szl-holdings` (corporate), `api-server` (backend), `command` (unified operations), `aegis` (defense intelligence), `vessels` (maritime command), `terra` (real estate intelligence), `carlota-jo` (advisory), `pulse` (AI executive briefing), and `szl-holdings-mobile` (mobile command).

**Vite Sub-Path App Config Notes:**
- All sub-path apps (aegis, terra, vessels, carlota-jo, command, pulse) share `PORT=9090` via `reusePort: true` shared proxy
- Each app has its own Vite dev server on a dedicated `VITE_PORT` (3000, 5201, 6099, etc.)
- All sub-path vite configs MUST use `fs.strict: false` to allow Vite to serve workspace library files from `lib/`
- SZL Holdings (root app) uses `PORT` directly; sub-apps use the shared proxy architecture
**Technology Stack:**
-   **Frontend:** React 19, Vite, TanStack React Query, Wouter, Tailwind CSS v4, Framer Motion.
-   **Backend:** Express 5, Drizzle ORM, Zod, pino.
-   **Database:** PostgreSQL 16.
-   **Authentication:** OIDC/PKCE, session-based, 11-role RBAC.
-   **Mobile:** Expo / React Native, NativeWind.
-   **AI:** Multi-provider (OpenAI, Anthropic, Gemini) with schema-validated decision types and AI evaluation infrastructure including trace capture, evaluator hooks, and a review queue. An AI Ops Dashboard is available via API endpoints.
-   **Real-time:** WebSocket, Server-Sent Events (SSE), push notifications.

**AI Control Plane & NVIDIA-Ready Packages:** Five packages (`@szl-holdings/ai-control-plane`, `@szl-holdings/prompt-registry`, `@szl-holdings/tool-registry`, `@szl-holdings/nvidia-adapters`, `@szl-holdings/openusd-export`) provide provider-agnostic AI infrastructure for model routing, prompt/tool management, NVIDIA integration, and OpenUSD digital twin export for simulations.

**UI/UX and Design System:** A premium, SZL-branded, dark-first design system is used, incorporating typography like Space Grotesk, Inter, and JetBrains Mono.

**API Layers:** Features a REST API, a GraphQL API using Apollo Server, and an MCP Gateway (Model Context Protocol) for tool integration.

**Key Features:** Reporting & Analytics Engine, robust Authentication & RBAC, Alloy Execution Fabric for workflow orchestration, 12 specialized AI Agents, PRISM Bus, Monte Carlo Engine for simulations, Multi-Tenant Provisioning, and GCS-backed Object Storage.

**Forge — AI Runtime, Agent Factory & Promotion Pipeline:** This system manages the governed lifecycle of AI agents, including registry, runtime capture, drift evaluation, promotion validation, rollback orchestration, and auditing, supported by dedicated DB tables, API services, and UI.

**Replay, Eval & Trust Infrastructure:** Three packages (`@szl-holdings/replay-core`, `@szl-holdings/evals-core`, `@workspace/eval-os`) enable incident capture, scenario replay, comprehensive evaluation of agent behavior (precision, recall, policy compliance), and regression detection, with UI surfaces for Replay Lab, Eval Lab, and Trust Console.

**SZL Foundation — Trace Graph:** The `@workspace/trace-graph` package provides a canonical trace layer that links all agent runs, model calls, tool invocations, retrievals, memory operations, and workflow steps into a queryable graph, backed by four Drizzle tables and exposed via API routes. Middleware automatically emits request-level traces.

**ATLAS Enterprise State Model:** Three packages (`@szl-holdings/atlas-core`, `@szl-holdings/atlas-types`, `@szl-holdings/atlas-events`) define a shared entity vocabulary with 14 primitive and 6 domain-specific types, along with a standardized event taxonomy for cross-domain communication.

**Memory Fabric & Alloy Runtime (Foundation 06):**
-   **Memory Fabric:** A tiered memory layer (`@workspace/memory-fabric`) with 8 scopes, tracking provenance, freshness, retention, and sensitivity for each record.
-   **Alloy Runtime:** The `@workspace/alloy` package acts as the cognitive runtime and execution control plane, orchestrating workflows, integrating with policy engines, managing action ledgers, and handling checkpoints. It leverages extensive DB schema additions for its operations, and exposes its functionalities via new API endpoints for memory, workflows, agents, models, prompts, signals, and actions.

**Reflection Engine (`@workspace/reflection-engine`):** A structured self-improvement package that runs after every agent trace. It scores run quality, classifies failure modes (tool_failure, guardrail_block, retrieval_miss, timeout, policy_violation, high_cost), writes reusable lessons, identifies the best-performing model/tool/prompt route, and drafts candidate skills for high-quality runs. Lessons are persisted into memory-fabric (long-term episodic + domain skill tiers) and candidate skills are surfaced for governance review. API endpoints `/reflections` (GET list, GET by ID, POST trigger) and `/reflections/by-trace/:traceId` are available. 23 tests cover all subsystems.

**Cognitive Consoles (Command App — Foundation Wave 1):** Three read-only inspection surfaces under `/cognitive/` in the Command app, accessible from the Strategy sidebar under "Cognitive Consoles":
- **`/cognitive` — Cognitive Command Center:** Live runtime state dashboard showing autonomy tier in force (TIER-2 Supervised Autonomy), active agent runs (agent name, objective, status, confidence, step count), current objectives with priority/status/confidence, recent verifier decisions with policy refs and verdicts (approved/rejected/escalated/modified), and system reflections (belief revision, self-critique, trust adjustment, objective update). Evidence-first and trace-first UX.
- **`/cognitive/self-model` — Self Model Console:** Read-only inspection of ATLAS-Core's self-model including identity/purpose/operating context, boundary constraints, acknowledged uncertainty, 6 registered capabilities with confidence scores and trend indicators, calibration accuracy by domain (overconfidence/underconfidence rates), and a snapshot timeline showing trust score drift over time.
- **`/cognitive/world-model` — World Model Graph Explorer:** CONSTELLATION graph visualization of the system's world model with domain/entity/concept/agent node types (circle/square/triangle/filled-circle shapes), causal/associative/hierarchical/temporal/dependency edge types, filters by domain/type/freshness, entity provenance drill-down, confidence and freshness bars per node, stale domain warnings (e.g., Carlota at 22%). Interactive pan/zoom/filter. Right panel shows domain freshness summary, node type legend, world model stats. Clicking a node reveals its provenance, confidence, freshness, and connected edges.
- All three pages use a shared `CognitiveLayout` with breadcrumb navigation back to Strategy. API calls hit `/api/cognitive/runtime`, `/api/self-model`, `/api/self-model/history`, `/api/graph/entities` — gracefully falling back to rich demo data when endpoints are not yet implemented.

## External Dependencies
-   **Database:** PostgreSQL 16
-   **Authentication:** Replit Auth
-   **Payment Processing:** Stripe
-   **AI Providers:** OpenAI, Anthropic, Gemini, HuggingFace Inference API, Elevenlabs
-   **Communication:** Slack, Twilio, Resend, SendGrid
-   **Maritime Data:** MarineTraffic, AISHub, Digitraffic AIS, BarentsWatch AIS, Open-Meteo Marine Weather
-   **Threat Intelligence:** STIX/TAXII, AlienVault OTX, MISP OSINT, OFAC SDN, EU Consolidated List, UN Security Council, Shodan, GreyNoise, MalwareBazaar
-   **Government Data:** CISA KEV, NVD CVE, MITRE ATT&CK, Census/BLS, FEMA NRI, NYC Open Data, SEC EDGAR
-   **Legal Data:** CourtListener REST API
-   **Other APIs/Services:** GitHub API, Figma, Google APIs, HubSpot

## NEXUS — Unified Agentic AI Layer

NEXUS is the unified agentic AI orchestration layer for the SZL portfolio, accessible at `/nexus/`. It is served as a static build from the API server (port 8080) and its backend routes live at `/api/nexus/*`.

**Four Pillars:**
1. **Parallel Research Swarm** — Gatherer/Peer-Reviewer/Drafter/Verifier agents with SSE streaming at `/api/nexus/research`
2. **Persistent Memory + Skills Library** — Cross-session memory fabric with 12 seeded skills, ingest from 20+ public repos at `/api/nexus/memory`, `/api/nexus/skills`
3. **Universal Protocol Bridge** — MCP/A2A/ACP/ANP routing with 12 registered tools at `/api/nexus/bridge`
4. **Cross-App Orchestrator** — Routes tasks across all 10 SZL artifacts at `/api/nexus/orchestrate`

**Frontend:** `artifacts/mockup-sandbox/` — 8 pages (Home, Research, Memory, Skills, PatternAtlas, Bridge, Orchestrator, Ingest). Built to `dist/public/`, served statically by the API server.

**Backend:** `artifacts/api-server/src/routes/nexus.ts` — all NEXUS API endpoints registered at `/api/nexus/*` via `nexusRouter`.

**Serving:** Static NEXUS dist is served by Express in `app.ts` via `express.static` at `/nexus/` with SPA fallback. The `kind=design` mockup-sandbox workflow has port detection incompatibility on this platform — the static build approach bypasses this entirely.

**Rebuild pipeline (NEXUS UI changes):** The api-server `start.sh` automatically rebuilds the NEXUS Vite bundle whenever any file under `artifacts/mockup-sandbox/src/`, `index.html`, `vite.config.ts`, or `package.json` is newer than the built `dist/public/index.html`. So the standard workflow for shipping NEXUS UI changes is simply:

1. Edit files in `artifacts/mockup-sandbox/src/`.
2. Restart the `artifacts/api-server: api` workflow.

The startup script will detect the stale build, run `vite build` for the mockup-sandbox, then start the API server — no manual build step required. Helper scripts:
- `pnpm --filter @workspace/api-server build:nexus` — build the NEXUS bundle only.
- `pnpm --filter @workspace/api-server rebuild:nexus` — force a NEXUS rebuild and start the API server (sets `FORCE_NEXUS_BUILD=1`).
- Set `SKIP_NEXUS_BUILD=1` to bypass the auto-rebuild check (useful for hot iterating on backend-only changes).