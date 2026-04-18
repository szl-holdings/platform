# SZL Holdings Platform

## Overview
The SZL Holdings Platform is a governed decision infrastructure designed to enforce governance, attribution, and outcome tracking for critical decisions. It integrates signal detection with action execution through a canonical nine-step loop: Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning. The platform is a pnpm monorepo consisting of web and mobile applications, an API, a design system, and a development sandbox. Its core capabilities are built around six platform primitives: Outcome Graph, Proof Chain, Covenant Policy, Decision Simulation, Workflow Engine, and Event Fabric. The project aims to provide comprehensive decision-making support with robust governance and observability, driving towards a vision of "governed intelligence" and "traceable autonomy."

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
The platform is a pnpm monorepo using TypeScript 5.9, React 19, Vite, and Node.js. It employs a micro-frontend architecture for web applications, routed via a shared gateway proxy on port 9090. A premium, SZL-branded, dark-first governed-intelligence design system (`@szl-holdings/design-system`) provides UI/UX consistency, including proof-envelope and cockpit primitives. All web apps and mobile share a unified "Operating System" layer (`lib/shared-ui/src/`) for core decision-making components.

**Core Platform Primitives:**
-   **Outcome Graph:** Manages the decision lifecycle and outcomes.
-   **Proof Chain:** Ensures an immutable audit trail with provenance.
-   **Covenant Policy:** Handles permissions and human approval gates.
-   **Monte Carlo (Decision Simulation):** Provides probabilistic risk assessment.
-   **Workflow Engine (Alloy Execution Fabric):** Orchestrates durable business processes.
-   **Event Fabric (PRISM Bus):** A cross-domain event bus for signal routing.

**Monorepo Structure:** Consists of active and archived artifact directories, numerous shared library packages for infrastructure and primitives, and dedicated packages for business observability, AI Control Plane, and NVIDIA-Ready Modules. The database schema consists of 569 tables managed by Drizzle ORM.

**Key Architectural Components & Implementations:**
-   **Business Observability Fabric (ATLAS):** OpenTelemetry-based setup for event emission and semantic conventions.
-   **Canonical Artifacts:** 13 active applications including `szl-holdings` (corporate dashboard), `api-server` (backend), `command` (unified operations), `vessels` (maritime intelligence), `lyte-command-center` (Decision Intelligence), `sentra` (Cyber Resilience Command), and `counsel` (Legal Matter Command).
-   **Vite Sub-Path App Config:** All sub-path applications share a `PORT=9090` shared proxy, with individual Vite dev servers on unique `VITE_PORT`s.
-   **AI Control Plane & NVIDIA-Ready Packages:** Provider-agnostic AI infrastructure for model routing, prompt/tool management, NVIDIA integration, and OpenUSD digital twin export.
-   **OS Layer (Decision Center):** Shared UI components for ranked recommendation cards, cognitive run traces, source health indicators, autonomy mode selectors, and policy verdict badges.
-   **API Layers:** REST API, GraphQL API using Apollo Server, and an MCP Gateway (Model Context Protocol).
-   **Forge — AI Runtime:** Manages the governed lifecycle of AI agents, including registry, runtime capture, drift evaluation, and promotion pipeline.
-   **Replay, Eval & Trust Infrastructure:** Enables incident capture, scenario replay, comprehensive evaluation of agent behavior, and regression detection with UI surfaces.
-   **SZL Foundation — Trace Graph:** Canonical trace layer linking all agent runs, model calls, and workflow steps into a queryable graph.
-   **ATLAS Enterprise State Model:** Defines a shared entity vocabulary and standardized event taxonomy.
-   **Living Signal Mesh & Evidence Graph:** Unifies event/signal handling into a typed, pipeline-driven mesh for signal processing, recommendation generation, and evidence querying.
-   **Memory Fabric & Alloy Runtime:** A tiered memory layer tracking provenance and an execution control plane orchestrating workflows and integrating with policy engines.
-   **Reflection Engine:** Structured self-improvement system scoring agent run quality, classifying failure modes, and identifying best-performing model/tool/prompt routes.
-   **Cognitive Consoles:** Read-only inspection surfaces in the Command app for live runtime state (`Cognitive Command Center`), the system's self-model (`Self Model Console`), and a visualization of the world model (`World Model Graph Explorer`).
-   **NEXUS — Unified Agentic AI Layer:** An orchestration layer (`/nexus/`) supporting parallel research swarms, persistent memory and skills libraries, a universal protocol bridge, and cross-app orchestration.

**Technology Stack:**
-   **Frontend:** React 19, Vite, TanStack React Query, Wouter, Tailwind CSS v4, Framer Motion.
-   **Backend:** Express 5, Drizzle ORM, Zod, pino.
-   **Database:** PostgreSQL 16.
-   **Authentication:** OIDC/PKCE, session-based, 11-role RBAC.
-   **Mobile:** Expo / React Native, NativeWind.
-   **AI:** Multi-provider (OpenAI, Anthropic, Gemini) with schema-validated decision types and AI evaluation infrastructure.
-   **Real-time:** WebSocket, Server-Sent Events (SSE), push notifications.

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