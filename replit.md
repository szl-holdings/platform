# SZL Holdings Platform

## Overview
SZL Holdings provides a governed operational intelligence platform for regulated enterprises. The platform, known as Alloy, enforces human-in-the-loop governance, immutable record-keeping, and attributable outcomes for all AI recommendations and actions. It is a pnpm monorepo supporting web and mobile applications, an API, and a design system. Key offerings include Governed Workflow Orchestration (Alloy + Command + Lyte) and Maritime Intelligence (Vessels), with other domain-specific extensions like Aegis, Terra, PRISM Counsel, and Carlota Jo built on the same governed platform.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
The platform is a pnpm monorepo built with TypeScript 5.9, React 19, Vite, and Node.js. It features a micro-frontend architecture for web applications, managed via a shared gateway proxy.

**Core Architectural Primitives:**
- **Alloy Execution Fabric:** Provides human-in-the-loop governance, including an Outcome Graph for decision lifecycle, a Proof Chain for immutable audit trails, and Covenant Policy for permissions and approval gates.
- **Sovereign Execution Substrate (`@szl/substrate`):** A durable, governed, and replayable runtime unifying orchestration, planning, governance, policy enforcement, and evidence chaining, featuring policy-shaped graphs, evidence-chained transitions, confidence-budget routing, and counterfactual replay.
- **Workflow Engine:** Orchestrates durable business processes.
- **Event Fabric (PRISM Bus):** A cross-domain event bus for signal routing.
- **Monte Carlo (Decision Simulation):** Provides probabilistic risk assessment.

**Monorepo Structure:** Organizes active and archived artifacts, shared infrastructure packages, and dedicated packages for business observability (ATLAS), AI Control Plane, and NVIDIA-Ready Modules. Drizzle ORM manages the PostgreSQL database schema.

**Business Observability Fabric (ATLAS):** Utilizes OpenTelemetry for event emission and telemetry standards.

**Canonical Artifacts:** The platform comprises 14 primary applications, including a corporate dashboard (`szl-holdings`), backend API (`api-server`), unified operations (`command`), maritime intelligence (`vessels`), and decision intelligence (`lyte-command-center`).

**NEXUS – Unified Agentic AI Layer:** An internal tooling sandbox for AI agent research, memory management, skill registry, protocol bridging, and AI Control Plane features.

**Lyte – Decision Intelligence:** A flagship application offering nine surfaces for executive narratives, signal feeds, entity graphs, and decision centers, characterized by a dark amber design language.

**UI/UX and Design System (v2):** The Governed-Intelligence Design Language v2 (`@szl-holdings/design-system`) serves as the single visual source of truth, establishing an enterprise accent palette, typography, spacing, elevation, density modes, and a comprehensive set of UI components. Authenticated product surfaces eschew neon/glow palettes.

**One-of-One Platform Shell:** Unifies the user interface across all applications with shared modules like an intelligence rail, agent run card, incident management, and scenario comparison, presented via a DashboardShell, EcosystemNav, and CommandPalette.

**API Layers:** Includes REST API, GraphQL API (Apollo Server), and an MCP Gateway for tool integration.

**AI Infrastructure:** Features a multi-provider AI backend (OpenAI, Anthropic, Gemini), AI evaluation infrastructure, an AI Ops Dashboard, and NVIDIA-Ready Packages for provider-agnostic AI infrastructure and OpenUSD digital twin export.

**Forge – AI Runtime, Agent Factory & Promotion Pipeline:** Manages the governed lifecycle of AI agents, including registry, runtime capture, drift evaluation, and auditing.

**Replay, Eval & Trust Infrastructure:** Provides capabilities for incident capture, scenario replay, and comprehensive evaluation of agent behavior.

**SZL Foundation – Trace Graph:** A canonical trace layer linking all agent runs, model calls, and workflow steps into a queryable graph.

**ATLAS Enterprise State Model:** Defines a shared entity vocabulary and standardized event taxonomy.

**Living Signal Mesh & Evidence Graph:** Unifies event/signal handling into a typed, pipeline-driven mesh, including `Signal` and `EvidenceItem` definitions, a 9-stage signal pipeline, and an `EvidenceStore`.

**Memory Fabric & Alloy Runtime:** Provides a tiered memory layer with provenance, freshness, retention, and sensitivity tracking, acting as the cognitive runtime and execution control plane for workflows.

**Alloy Embedding Fabric (AEF):** A REST API gateway and TypeScript worker layer for semantic embedding, reranking, and hybrid search.

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

## Platform Hardening Audit (2026-04-22)

**Critical fix:** API server bootstrap deadlock resolved — `bootstrapChainState()` was blocking the live HTTP handler flip. Moved `onMigrationsReady()` to fire immediately after migrations. Chain state hydration now runs fire-and-forget with 10s timeout and merge-only semantics (no counter reset race).

**Files changed:** `artifacts/api-server/src/index.ts` (bootstrap order), `artifacts/api-server/src/routes/signal-chains.ts` (merge-only hydration)

**Audit deliverables created (docs/):**
- `AUDIT_INVENTORY.md` — full workspace inventory (17 artifacts, 41 libs, 82 packages, 2,781 routes, 732 tables)
- `OPERABILITY_MATRIX.md` — per-artifact build/start/health grades
- `PUBLIC_SURFACE_MATRIX.md` — public claims verified against code reality
- `FIX_LOG.md` — fixes applied this session
- `BUILD_AND_QA_SCORECARD.md` — pipeline stage results
- `GITHUB_ASCENSION_REPORT.md` — CI pipeline and public surface assessment
- `REPLIT_RUNBOOK.md` — operator runbook for Replit workspace
- `REPLIT_BOOT_MATRIX.md` — startup sequence and timing
- `CORE_PLATFORM_PRIMITIVES.md` — implementation register for all 8 primitives
- `DECISION_LIFECYCLE.md` — canonical nine-step governed decision loop
- `INNOVATION_LANES.md` — per-domain current state + differentiation roadmap
- `API_TRUTH_MATRIX.md` — route group inventory and auth model
- `DATABASE_TRUTH_MATRIX.md` — table distribution, pool config, migration health
- `REDUNDANCY_CLEANUP.md` — dead artifacts, stale references, cleanup actions
- `BUYER_READINESS.md` — enterprise evaluation summary
- `INVESTOR_PLATFORM_BRIEF.md` — investor-facing platform brief with code-derived metrics
- `SECURITY_AND_GOVERNANCE_FAQ.md` — security/governance FAQ for procurement
- `RELEASE_NOTES_TEMPLATE.md` — structured release notes template

**README fixes:** Removed dead `firestorm/` reference, updated archived artifacts table, corrected PARAGON status

**Removed:** `uv.lock` (no Python artifacts)

---

## Zero-Gap Track 6 — Screenshots, README, Release & Executive Summary (2026-04-21)

**Deliverables:**
- `screenshots/approved/` — 10 verified post-redesign screenshots from live artifact dev servers; all surfaces reflect Governed-Intelligence Design System v2
- `audit/screenshot-catalog.md` — full metadata for every approved screenshot; disposition decisions for legacy `screenshots/` pool
- `audit/final-executive-summary.md` — comprehensive Track 1–6 four-section executive summary (verified working / what was fixed / not verified / production blockers); every claim labeled VERIFIED, CODE-CONFIRMED, or OPEN
- `audit/deployment-proof.md` — exact deployment state: 8 artifact dev servers running, API server not started (no DATABASE_URL), Command failed (startup timeout), no production push

**Fixes:**
- `README.md` — Removed misleading `aegis-command.jpg` screenshot reference (pointed to archived Firestorm surface); added screenshot context note
- `CHANGELOG.md` — Added Track 6 entry under dated section
- `CONTRIBUTING.md` — Fixed "five platform primitives" → "six platform primitives" (Event Fabric was missing)
- `profile-readme/README.md` — Updated domain packs table to include Sentra, Counsel, Pulse; corrected Aegis description (investor pitch deck, not defense); added Status column

---

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

**AEEP – Alloy Execution and Evidence Platform:** The evolved platform spine, incorporating core packages for contracts, agent runtime, workflow execution, retrieval, memory, evidence ledger, and policy enforcement. The AEEP Design System adheres to strict aesthetic and functional constraints, emphasizing evidence-first displays and an enterprise accent palette.

## CI & Quality Gates

### Security Tests (Required Before Deploying)
A named validation step called **`security-tests`** is registered and must pass before any merge or deployment.

- **Command:** `pnpm --filter @workspace/api-server test`
- **Coverage:** Runs the full Vitest suite for the API server, including:
  - `src/__tests__/security-middleware.test.ts` — helmet headers, CORS, rate-limiting, body-size, and sanitisation middleware checks
  - `src/__tests__/security-routes.test.ts` — authentication, authorization, and injection-guard route tests
- **Enforcement:** This step is a required check. Failing tests block merges and must be resolved before any production push.

Run the check manually at any time via the Replit validation panel or:
```
pnpm --filter @workspace/api-server test
```

---

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