# SZL Holdings Platform

## Overview
The SZL Holdings Platform is a governed decision infrastructure designed to enforce governance, attribution, and outcome tracking for critical decisions. It integrates signal detection with action execution through a canonical nine-step loop: Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning. The platform is a pnpm monorepo consisting of web and mobile applications, an API, a design system, and a development sandbox. Its core capabilities are built around six platform primitives: Outcome Graph, Proof Chain, Covenant Policy, Decision Simulation, Workflow Engine, and Event Fabric. The project aims to provide comprehensive decision-making support with robust governance and observability, driving a vision of evidence-backed and traceable autonomy.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
The platform is a pnpm monorepo using TypeScript 5.9, React 19, Vite, and Node.js. It employs a micro-frontend architecture for web applications, routed via a shared gateway proxy on port 9090.

**Core Platform Primitives:**
-   **Outcome Graph:** Manages the decision lifecycle and outcomes.
-   **Proof Chain:** Ensures an immutable audit trail with provenance.
-   **Covenant Policy:** Handles permissions and human approval gates.
-   **Monte Carlo (Decision Simulation):** Provides probabilistic risk assessment.
-   **Workflow Engine:** Orchestrates durable business processes.
-   **Event Fabric (PRISM Bus):** A cross-domain event bus for signal routing.

**Monorepo Structure:** The monorepo includes active and archived artifact directories, shared library packages for infrastructure and primitives, and dedicated packages for business observability, AI Control Plane, and NVIDIA-Ready Modules. The database schema consists of 569 tables managed by Drizzle ORM.

**Business Observability Fabric (ATLAS):** Implemented via `@szl-holdings/observability-core`, `@szl-holdings/business-events`, and `@szl-holdings/telemetry-standards` for OpenTelemetry setup, event emission, and semantic conventions.

**Canonical Artifacts (Active Applications):** The platform supports 15 active applications including `szl-holdings` (corporate dashboard), `api-server` (backend), `command` (unified operations with Demo Launchpad at `/command/demo`), `vessels` (maritime intelligence), `terra` (real estate), `carlota-jo` (advisory), `pulse` (AI executive briefing), `szl-holdings-mobile` (mobile command), `szl-demo-video`, `mockup-sandbox`/NEXUS (agentic AI layer), `lyte-command-center` (Decision Intelligence — Decision Twin, Policy Center with Policy Compiler link), `sentra` (Cyber Resilience), `counsel` (Legal Matter Command), `prism-counsel` (PRISM Legal Command), and `aegis` (Cyber Resilience Command / Investor Pitch Deck). All 15 artifact workflows are confirmed running.

**Demo Launchpad (`/command/demo`):** A single presenter control surface for investor demos. Features: 10/20/45-minute scripted tracks, audience persona switcher (Investor/CEO/COO/CISO/Analyst), one-click reset, six-stop sequence with progress tracking, platform status panel (all six domain packs), and quick-access to all six signature innovations. Central demo narrative: Vantex Acquisition ($4.2M / 47-day stalled approval) — LYTE-SEED-v2. Located at `artifacts/command/src/pages/demo-launchpad.tsx`.

**Six Signature Innovations (One-of-One):** Decision Twin (761 lines, `/lyte/decision-twin`), Policy Compiler (1252 lines, `/command/operations/alloy/policy-compiler`), Why This Property Now (912 lines, `/terra/why-this-property-now`), Adversary Narrative Engine (1806 lines, `/aegis/adversary-narrative-engine`), Voyage Risk Twin (1063 lines, `/vessels/voyage-risk-twin`), White-Glove Command (`/carlota-jo/concierge`). All six verified working.

**Internal Audit (`artifacts/internal-audit/`):** 18 documents created by the Singularity Program (Task #2239) covering capability manifest (89 capabilities, 81% working), workflow health, live vs demo data classification, commercial activation checklist, gap register, investor readiness scorecard (7.8/10), demo script (10/20/45 min), founder review summary, and full changelog.

**Media Kit (`media/`):** Production media assets committed at a known path. `media/screenshots/<artifact>/` — hero and secondary-view PNG screenshots at 1920×1080 (deviceScaleFactor 2) for all 10 artifact surfaces (szl-holdings, pulse, sentra, lyte, vessels, terra, prism-counsel, counsel, aegis, command, szl-demo-video). `media/brand-kit/tokens.md` — authoritative visual brand tokens (colors, typography, intro/outro card specs, lower-thirds, caption style, screenshot standards). `media/README.md` — top-level media kit docs. Screenshot regeneration: `bash scripts/capture-screenshots.sh [artifact-id?]`. All artifact READMEs now contain screenshot tables and regeneration commands.

**Lyte — Decision Intelligence (`artifacts/lyte-command-center`, shared proxy port 9090 / Vite port 7099, preview path `/lyte/`):** Nine flagship surfaces — Overview (executive narrative, KPIs, critical signals), Signals Console (47-signal live feed), Entity Graph (SVG relationship map), Decision Center (recommendation backlog + Monte Carlo simulation panel), Workflow Health (per-workflow bottleneck tracking), Run Console (agent trace log), Evidence Explorer (proof chain browser), Policy Center (covenant policy registry), and Eval Studio (radar chart + eval logs). All surfaces use the Vantex Acquisition $4.2M / 47-day stalled approval chain as the central demo narrative. Dark amber design language (#f59e0b accent), `cockpit-panel` CSS, `proof-badge` chips. Seed data in `artifacts/lyte-command-center/src/data/seed.ts`. Navigation groups: Command / Operations / Governance / Legacy (board, ownership-drift, pressure-map, action-debt, decision-replay).

**Vite Sub-Path App Configuration:** Sub-path applications (e.g., aegis, terra) share `PORT=9090` via a shared gateway proxy (`reusePort: true`), while each app has its own Vite dev server on a dedicated `VITE_PORT`. Vite configurations for sub-path apps require `fs.strict: false` for workspace library file access.

**Technology Stack:**
-   **Frontend:** React 19, Vite, TanStack React Query, Wouter, Tailwind CSS v4, Framer Motion.
-   **Backend:** Express 5, Drizzle ORM, Zod, pino.
-   **Database:** PostgreSQL 16.
-   **Authentication:** OIDC/PKCE, session-based, 11-role RBAC.
-   **Mobile:** Expo / React Native, NativeWind.
-   **AI:** Multi-provider (OpenAI, Anthropic, Gemini) with schema-validated decision types, AI evaluation infrastructure, and an AI Ops Dashboard.
-   **Real-time:** WebSocket, Server-Sent Events (SSE), push notifications.

**AI Control Plane & NVIDIA-Ready Packages:** Packages like `@szl-holdings/ai-control-plane`, `@szl-holdings/prompt-registry`, `@szl-holdings/tool-registry`, `@szl-holdings/nvidia-adapters`, and `@szl-holdings/openusd-export` provide provider-agnostic AI infrastructure, prompt/tool management, NVIDIA integration, and OpenUSD digital twin export.

**UI/UX and Design System:** A premium, dark-first governed-intelligence design language is provided by `@szl-holdings/design-system` (`packages/design-system`), offering proof-envelope and cockpit primitives. A Storybook-style preview is available at `/nexus/#design-system`. A forbidden-copy linter enforces specific terminology. `@szl-holdings/ui-command` provides higher-level business components.

**OS Layer (Decision Center):** A unified "Operating System" layer in `lib/shared-ui/src/` provides shared primitives like `Recommendation`, `Evidence`, `PolicyVerdict`, `Run` types, and UI components such as `DecisionCenter.tsx` for ranked recommendations, `RunConsole.tsx` for trace viewing, and `AutonomyDial.tsx`.

**API Layers:** The platform includes a REST API, a GraphQL API using Apollo Server, and an MCP Gateway for tool integration.

**Key Features:** Reporting & Analytics Engine, Authentication & RBAC, Alloy Execution Fabric for workflow orchestration, 12 specialized AI Agents, PRISM Bus, Monte Carlo Engine, Multi-Tenant Provisioning, and GCS-backed Object Storage.

**Forge — AI Runtime, Agent Factory & Promotion Pipeline:** This system manages the governed lifecycle of AI agents, including registry, runtime capture, drift evaluation, promotion validation, rollback orchestration, and auditing.

**Replay, Eval & Trust Infrastructure:** Packages like `@szl-holdings/replay-core`, `@szl-holdings/evals-core`, and `@workspace/eval-os` enable incident capture, scenario replay, comprehensive evaluation of agent behavior, and regression detection, with dedicated UI surfaces.

**SZL Foundation — Trace Graph:** The `@workspace/trace-graph` package provides a canonical trace layer linking all agent runs, model calls, tool invocations, retrievals, memory operations, and workflow steps into a queryable graph.

**ATLAS Enterprise State Model:** `@szl-holdings/atlas-core`, `@szl-holdings/atlas-types`, and `@szl-holdings/atlas-events` define a shared entity vocabulary and standardized event taxonomy.

**Living Signal Mesh & Evidence Graph:** New packages (`@workspace/ontology`, `@szl-holdings/signal-mesh`, `@szl-holdings/evidence-graph`, `@szl-holdings/connectors`) unify event/signal handling into a typed, pipeline-driven mesh, providing `Signal` and `EvidenceItem` definitions, a 9-stage signal pipeline, an `EvidenceStore`, and various `ConnectorAdapter` implementations for external data sources.

**Memory Fabric & Alloy Runtime:** `@workspace/memory-fabric` provides a tiered memory layer with provenance, freshness, retention, and sensitivity tracking. `@workspace/alloy` acts as the cognitive runtime and execution control plane for workflows, policy integration, and action management.

**Reflection Engine (`@workspace/reflection-engine`):** A structured self-improvement package that scores run quality, classifies failure modes, identifies best-performing routes, and drafts candidate skills, persisting lessons to memory fabric and surfacing skills for governance review.

**Cognitive Consoles (Command App):** Three read-only inspection surfaces under `/cognitive/` in the Command app provide insights into the system's runtime state:
- **Cognitive Command Center:** Live dashboard for agent runs, objectives, verifier decisions, and system reflections.
- **Self Model Console:** Read-only inspection of ATLAS-Core's self-model, including identity, capabilities, calibration accuracy, and trust score.
- **World Model Graph Explorer:** CONSTELLATION graph visualization of the system's world model, with entity provenance drill-down and freshness indicators.

**NEXUS — Unified Agentic AI Layer:** NEXUS is the unified agentic AI orchestration layer, accessible at `/nexus/`, serving as a static build from the API server. Its four pillars include a Parallel Research Swarm, Persistent Memory + Skills Library, Universal Protocol Bridge, and Cross-App Orchestrator. The frontend is built from `artifacts/mockup-sandbox/` and the backend endpoints are in `artifacts/api-server/src/routes/nexus.ts`.

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