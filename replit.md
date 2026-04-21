# SZL Holdings Platform

## Overview
The SZL Holdings Platform is a governed decision infrastructure designed to enforce governance, attribution, and outcome tracking for critical decisions. It integrates signal detection with action execution through a canonical nine-step loop. The platform is a pnpm monorepo encompassing web and mobile applications, an API, a design system, and a development sandbox. Its core capabilities are built around six platform primitives: Outcome Graph, Proof Chain, Covenant Policy, Decision Simulation, Workflow Engine, and Event Fabric. The project aims to provide comprehensive decision-making support with robust governance and observability, driving a vision of evidence-backed and traceable autonomy.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
The platform is a pnpm monorepo utilizing TypeScript 5.9, React 19, Vite, and Node.js. It employs a micro-frontend architecture for web applications, routed via a shared gateway proxy.

**Core Platform Primitives:**
-   **Outcome Graph:** Manages decision lifecycle and outcomes.
-   **Proof Chain:** Ensures an immutable audit trail with provenance.
-   **Covenant Policy:** Handles permissions and human approval gates.
-   **Monte Carlo (Decision Simulation):** Provides probabilistic risk assessment.
-   **Workflow Engine:** Orchestrates durable business processes.
-   **Event Fabric (PRISM Bus):** A cross-domain event bus for signal routing.
-   **Sovereign Execution Substrate (`@szl/substrate`):** Unifies orchestration, planning, governance, policy enforcement, and evidence chaining into a durable, governed, and replayable runtime. It features policy-shaped graphs, evidence-chained transitions, confidence-budget routing, and counterfactual replay.

**Monorepo Structure:** Includes active and archived artifact directories, shared library packages for infrastructure and primitives, and dedicated packages for business observability, AI Control Plane, and NVIDIA-Ready Modules. The database schema is managed by Drizzle ORM.

**Business Observability Fabric (ATLAS):** Implemented via `@szl-holdings/observability-core`, `@szl-holdings/business-events`, and `@szl-holdings/telemetry-standards` for OpenTelemetry setup, event emission, and semantic conventions.

**Canonical Artifacts (Active Applications):** The platform has 14 registered artifacts: `szl-holdings` (corporate dashboard), `api-server` (backend), `command` (unified operations), `vessels` (maritime intelligence), `terra` (real estate), `pulse` (AI executive briefing), `lyte-command-center` (Decision Intelligence), `aegis` (investor pitch deck), `sentra` (cyber resilience), `counsel` (legal matter), `carlota-jo` (private advisory), `szl-demo-video` (demo video), `szl-holdings-mobile` (mobile), and `mockup-sandbox` (NEXUS internal tooling). Verified count: 14 (see `audit/source-of-truth.json` — method: `find artifacts -name artifact.toml | wc -l`).

**NEXUS — Unified Agentic AI Layer (`artifacts/mockup-sandbox`):** Internal tooling sandbox for AI agent research, memory management, skill registry, protocol bridging, cross-app orchestration, and the AI Control Plane (prompts, evals, quality). Secured with an auth guard (`authMiddleware({ required: true })` on all `/api/nexus/*` routes); frontend shows a login wall on 401 via `InternalAuthGate`. Pattern Atlas (`src/pages/PatternAtlas.tsx`) enumerates all real `lib/shared-ui` exports via a build-time Vite virtual module plugin (`sharedUiManifestPlugin.ts` → `virtual:shared-ui-manifest`), merges them with a rich metadata registry, and renders live interactive previews for `AnimatedCounter`, `AlertCard`, and `LoadingSkeleton` using actual `@szl-holdings/shared-ui` imports. Memory and Skills pages carry "Internal Tooling — Not Production" banners. E2E smoke tests in `tests/e2e/nexus-smoke.spec.ts` cover auth-gate, atlas browse, eval run, and prompt-save/version flows.

**Demo Launchpad (`/command/demo`):** A single presenter control surface for investor demos, featuring scripted tracks, audience persona switching, and one-click reset.

**Six Signature Innovations:** Includes Decision Twin, Policy Compiler, Why This Property Now, Adversary Narrative Engine, Voyage Risk Twin, and White-Glove Command.

**Lyte — Decision Intelligence:** A flagship application providing nine surfaces for executive narrative, signal feeds, entity graphs, decision centers, workflow health, agent trace logs, evidence explorers, policy centers, and evaluation studios. It features a dark amber design language and uses the Vantex Acquisition scenario as its central demo narrative.

**Vite Sub-Path App Configuration:** Sub-path applications share `PORT=9090` via a shared gateway proxy, each having its own Vite dev server on a dedicated `VITE_PORT`.

**Technology Stack:**
-   **Frontend:** React 19, Vite, TanStack React Query, Wouter, Tailwind CSS v4, Framer Motion.
-   **Backend:** Express 5, Drizzle ORM, Zod, pino.
-   **Database:** PostgreSQL 16.
-   **Authentication:** OIDC/PKCE, session-based, 11-role RBAC.
-   **Mobile:** Expo / React Native, NativeWind.
-   **AI:** Multi-provider (OpenAI, Anthropic, Gemini) with schema-validated decision types, AI evaluation infrastructure, and an AI Ops Dashboard.
-   **Real-time:** WebSocket, Server-Sent Events (SSE), push notifications.

**AI Control Plane & NVIDIA-Ready Packages:** Provide provider-agnostic AI infrastructure, prompt/tool management, NVIDIA integration, and OpenUSD digital twin export.

**UI/UX and Design System:** A premium, dark-first governed-intelligence design language is provided by `@szl-holdings/design-system`, offering proof-envelope and cockpit primitives. `@szl-holdings/ui-command` provides higher-level business components.

**OS Layer (Decision Center):** Provides shared primitives and UI components for recommendations, evidence, policy verdicts, and agent run tracing.

**One-of-One Platform Shell:** Introduced four canonical shared modules for an intelligence rail, agent run card, incident management, and scenario comparison, unifying the user interface across all surfaces with a DashboardShell, EcosystemNav, and CommandPalette.

**API Layers:** Includes a REST API, a GraphQL API using Apollo Server, and an MCP Gateway for tool integration.

**Key Features:** Reporting & Analytics Engine, Authentication & RBAC, Alloy Execution Fabric, 12 specialized AI Agents, PRISM Bus, Monte Carlo Engine, Multi-Tenant Provisioning, and GCS-backed Object Storage.

**Forge — AI Runtime, Agent Factory & Promotion Pipeline:** Manages the governed lifecycle of AI agents, including registry, runtime capture, drift evaluation, promotion validation, rollback orchestration, and auditing.

**Replay, Eval & Trust Infrastructure:** Enables incident capture, scenario replay, comprehensive evaluation of agent behavior, and regression detection with dedicated UI surfaces.

**SZL Foundation — Trace Graph:** Provides a canonical trace layer linking all agent runs, model calls, tool invocations, retrievals, memory operations, and workflow steps into a queryable graph.

**ATLAS Enterprise State Model:** Defines a shared entity vocabulary and standardized event taxonomy.

**Living Signal Mesh & Evidence Graph:** Unifies event/signal handling into a typed, pipeline-driven mesh, providing `Signal` and `EvidenceItem` definitions, a 9-stage signal pipeline, an `EvidenceStore`, and various `ConnectorAdapter` implementations.

**Memory Fabric & Alloy Runtime:** Provides a tiered memory layer with provenance, freshness, retention, and sensitivity tracking, and acts as the cognitive runtime and execution control plane for workflows.

**Alloy Embedding Fabric (AEF) — Phase 3 Runtime:** REST API gateway and TypeScript worker layer for semantic embedding, reranking, and hybrid search. Mounted at `/alloy-embedding-api/` via the api-server.
- `apps/alloy-embedding-api/`: Express 5 gateway — /v1/embed, /v1/rerank, /v1/hybrid-search, /v1/ingest, /v1/index/rebuild, /v1/index/verify, /v1/evals/run, /v1/openai/embeddings, /health, /metrics, /docs. Bearer-token auth, per-tenant rate limiting, Prometheus metrics, OTel tracing, evidence-ledger writes.
- `workers/alloy-embed-worker/`: MicroBatchQueue, 5 backends (cpu-local, external-http, gpu-stub, azure-stub, dev-hash), pooling (cls/mean/last_token), truncation, WarmPool.
- `workers/alloy-rerank-worker/`: Cross-encoder HTTP backend + deterministic TF fallback.
- `services/substrate-py-workers`: Extended with /aef/embed and /aef/rerank (deterministic hash-based; no model download required in dev).
- `scripts/aef-smoke.ts`: End-to-end smoke test — run with `AEF_API_URL=http://localhost:8080/alloy-embedding-api AEF_API_KEY=<token> tsx scripts/aef-smoke.ts`.

**Reflection Engine:** A structured self-improvement package that scores run quality, classifies failure modes, identifies best-performing routes, and drafts candidate skills.

---

## AEEP — Alloy Execution and Evidence Platform

The monorepo has been evolved into AEEP. The following new packages form the AEEP platform spine:

**Core Packages:**
- `packages/shared-contracts/` — All typed contracts: 8 agent roles, 10 starter workflows, evidence/policy/retrieval/memory types
- `packages/agent-core/` — RunContext factory (traceId generation), capability resolver (role × tool permission matrix)
- `packages/workflow-runtime/` — Run engine, step executor, approval gate state machine
- `packages/retrieval-core/` — Query planner (strategy inference), RRF reranker, score threshold filter
- `packages/memory-core/` — InMemoryStore reference implementation (production: swap with Redis adapter)
- `packages/evidence-ledger/` — Immutable append-only ledger, ProofEnvelope assembly, EvidencePackage compilation
- `packages/policy-guard/` — Rule evaluation engine, baseline rules (POL-001 through POL-005)
- `packages/domain-profiles/` — 6 domain profile definitions: Lyte, Vessels, Terra, Aegis, PRISM, Carlota
- `packages/platform-metrics-registry/` — Typed metric schema, registry, validation

**Design System (AEEP Edition) — `packages/design-system/src/`:**
- `tokens/` — AEEP enterprise accent palette (no neon), densityConfig, chartPalette, semanticColors
- `providers/` — DesignSystemProvider (density + screen mode)
- `hooks/` — useDensity(), useScreenMode()
- `shell/` — AppShell, SideNav, TopBar, PageHeader, SectionPanel, GlobalCommandPalette, TenantIndicator
- `layout/` — SplitPane, SideInspector, InspectorTabs
- `data/` — MetricStat, MetricStatGrid, StatusBadge, FilterBar, DataGrid, TableToolbar
- `detail/` — DetailDrawer
- `timeline/` — Timeline, ActivityFeed, AuditTrailList
- `evidence/` — EvidencePanel
- `form/` — SearchInput, FormField, Select, SegmentedControl, Stepper
- `feedback/` — EmptyState, ErrorState, LoadingState

**AEEP Design Constraints:**
- No neon/glow/oversaturated palette in authenticated product UX
- Max heading size: 24px (text-2xl) in authenticated surfaces
- Max motion duration: 200ms
- All color values must reference tokens (no raw hex in components)
- Screen modes: executive (KPI-first) | operator (density-first, trace-visible)
- Evidence-first: all material AI results must surface EvidencePanel

**AEEP Documentation (`docs/`):**
- `evolve-style-principles.md` — Design constraints and token rules
- `evolve-component-inventory.md` — Full component catalog
- `evolve-screen-mapping.md` — 8-nav route → screen pattern mapping
- `evolve-runtime-architecture.md` — Package topology, request flow, role wiring
- `evolve-evidence-model.md` — ProofEnvelope, LedgerEntry, EvidencePackage schemas
- `evolve-policy-model.md` — Policy verdict types, tiers, approval lifecycle
- `evolve-domain-profiles.md` — Profile structure, namespace config
- `evolve-integration-summary.md` — All 8 phases summary

**Cognitive Consoles (Command App):** Three read-only inspection surfaces in the Command app provide insights into the system's runtime state: Cognitive Command Center, Self Model Console, and World Model Graph Explorer.

**NEXUS — Unified Agentic AI Layer:** The unified agentic AI orchestration layer, accessible at `/nexus/`, featuring a Parallel Research Swarm, Persistent Memory + Skills Library, Universal Protocol Bridge, and Cross-App Orchestrator.

**Substrate Command Center:** A cross-vertical operator UI for the governed decision substrate, integrated into the `command` artifact at `/command/substrate/`. It offers four operator perspectives, a live trajectory map of in-flight runs, detailed run views, a counterfactual diff viewer, and a unified approval queue.

## Series-A Reset Pass (2026-04-20)

The following changes were applied as part of the Series-A one-pass foundation, inventory, and sanitation reset:

**Fixes Applied:**
- Biome auto-fix applied across 4,397 files (consistent formatting, single quotes enforced)
- `scripts/shared-proxy.mjs` regex fixed to handle both `'` and `"` quote styles in proxy-routes.ts
- `artifacts/szl-holdings-mobile/scripts/health-proxy.js` same regex fix
- Root `tsconfig.json` updated with 7 missing package references (`env`, `auth-shared`, `brand-registry`, `design-system`, `db`, `contracts`, `shared-contracts`)
- `packages/env/tsconfig.json` — added `composite: true`
- `lib/db/tsconfig.json` — added `references` array
- `artifacts/szl-holdings/vite.config.ts` — `buildWorkspaceAliases()` refactored to also scan `packages/` directory
- `artifacts/pulse/vite.config.ts` — same `buildWorkspaceAliases()` fix
- Manual symlinks created: `@szl-holdings/contracts`, `@szl-holdings/auth-shared`, `@szl-holdings/env` in all 16 artifact node_modules
- `artifacts/api-server/src/routes/__tests__/group-protected-attestation.test.ts` — regex updated to match single-quoted strings (biome reformatted the source file)
- `artifacts/api-server/src/middlewares/tenant-scope.ts` — wrapped `serverTelemetry.recordTenantIsolationViolation()` in try/catch to prevent telemetry errors from converting 403 → 500

**Audit Reports Created:**
- `audit/inventory/` — 7 JSON files (ci.json, deployments.json, env-usage.json, files.json, media.json, packages.json, routes.json) + stack.md
- `audit/code/` — dead-code-report.md, redundancy-report.md, dependency-cleanup.md, refactor-map.md
- `audit/tests/` — build-results.md, debug-fixes-applied.md, static-verification.md

**Test Results:**
- api-server unit tests: 180 failures → ~6 failures (all remaining are pre-existing DB migration issues)

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