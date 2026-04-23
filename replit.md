# SZL Holdings Platform

## Overview
SZL Holdings offers Alloy, a governed operational intelligence platform for regulated enterprises. It ensures human-in-the-loop governance, immutable record-keeping, and attributable outcomes for all AI recommendations and actions. The platform is a pnpm monorepo supporting web and mobile applications, an API, and a design system. Its core purpose is Governed Workflow Orchestration (Alloy + Command + Lyte) and Maritime Intelligence (Vessels), with specialized extensions like Aegis, Terra, PRISM Counsel, and Carlota Jo built upon its governed foundation. The business vision is to provide a comprehensive solution for decision intelligence and operational oversight in highly regulated environments, with strong market potential in sectors requiring stringent compliance and auditable AI applications.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
The platform is a pnpm monorepo using TypeScript 5.9, React 19, Vite, and Node.js. It employs a micro-frontend architecture for web applications, managed through a shared gateway proxy. The system has evolved into the Alloy Execution and Evidence Platform (AEEP).

**Core Architectural Primitives:**
- **Alloy Execution Fabric:** Provides human-in-the-loop governance, an Outcome Graph, Proof Chain for audit, and Covenant Policy for permissions.
- **Sovereign Execution Substrate (`@szl/substrate`):** A durable, governed, and replayable runtime for orchestration, planning, governance, and policy enforcement.
- **Workflow Engine:** Orchestrates durable business processes.
- **Event Fabric (PRISM Bus):** A cross-domain event bus.
- **Monte Carlo (Decision Simulation):** For probabilistic risk assessment.
- **SZL Foundation – Trace Graph:** Canonical trace layer for agent runs and workflow steps.
- **ATLAS Enterprise State Model:** Defines a shared entity vocabulary and event taxonomy.
- **Living Signal Mesh & Evidence Graph:** Unifies event/signal handling with a 9-stage pipeline and `EvidenceStore`.
- **Memory Fabric & Alloy Runtime:** Tiered memory layer with provenance, freshness, retention, and sensitivity tracking.

**Monorepo Structure:** Organized into active/archived artifacts, shared infrastructure, and packages for business observability (ATLAS), AI Control Plane, and NVIDIA-Ready Modules. Drizzle ORM manages PostgreSQL schemas.

**UI/UX and Design System (v2):** The Governed-Intelligence Design Language v2 (`@szl-holdings/design-system`) is the single visual source of truth, defining an enterprise accent palette, typography, spacing, and UI components. It adheres to strict design constraints: no neon/glow, max heading size 24px, max motion duration 200ms, and all color values referencing tokens. Authenticated product surfaces are evidence-first.

**One-of-One Platform Shell:** Unifies user interfaces across applications with shared modules, including an intelligence rail, agent run card, and command palette.

**API Layers:** Includes REST API, GraphQL API (Apollo Server), and an MCP Gateway.

**AI Infrastructure:** Features a multi-provider AI backend (OpenAI, Anthropic, Gemini), AI evaluation infrastructure, an AI Ops Dashboard, and NVIDIA-Ready Packages.

**Forge – AI Runtime, Agent Factory & Promotion Pipeline:** Manages the governed lifecycle of AI agents.

**NEXUS – Unified Agentic AI Layer:** An internal tooling sandbox for AI agent research, memory management, skill registry, protocol bridging, and AI Control Plane features, accessible at `/nexus/`.

**Lyte – Decision Intelligence:** A flagship application for executive narratives, signal feeds, and decision centers, characterized by a dark amber design language.

**AEEP Core Packages:**
- `shared-contracts/`: Agent roles, starter workflows, evidence/policy/retrieval/memory types.
- `agent-core/`: RunContext factory, capability resolver.
- `workflow-runtime/`: Run engine, step executor, approval gate state machine.
- `retrieval-core/`: Query planner, RRF reranker.
- `memory-core/`: In-memory store (with Redis adapter for production).
- `evidence-ledger/`: Immutable append-only ledger, ProofEnvelope assembly.
- `policy-guard/`: Rule evaluation engine, baseline rules.
- `domain-profiles/`: Definitions for Lyte, Vessels, Terra, Aegis, PRISM, Carlota.
- `platform-metrics-registry/`: Typed metric schema, registry.

**AEEP Design System (`packages/design-system/src/`):** Includes tokens, providers (density + screen mode), hooks, shell components (AppShell, SideNav, TopBar, GlobalCommandPalette), layout components (SplitPane, SideInspector), data display (MetricStat, DataGrid), detail views, timeline components, EvidencePanel, form elements, and feedback components.

**Cognitive Consoles:** Read-only inspection surfaces within the Command app: Cognitive Command Center, Self Model Console, and World Model Graph Explorer.

**Substrate Command Center:** A cross-vertical operator UI for the governed decision substrate, integrated into the `command` artifact at `/command/substrate/`.

## Production Readiness & Audit Status

**Last audited:** April 22, 2026  
**Status:** Demo-ready. Pre-commercial. No critical gaps; 5 HIGH gaps block first paying tenant.

**Key audit documents:**
- `docs/audit/inventory.md` — Per-artifact route inventory (route → data source → status → disposition)
- `docs/audit/report.md` — Consolidated audit report (what's real, fixed, removed, behind DEMO_MODE)
- `docs/audit/GAP_MATRIX.md` — Open gap register with severity and acceptance tests
- `docs/ops/gap-register.md` — P0–P2 gap register with per-gap details
- `docs/demos/` — Per-artifact demo scripts (one per artifact, includes avoidance guide)

**HIGH gaps — full list in `docs/audit/report.md` and `docs/audit/GAP_MATRIX.md`:**

*Credential-only (feature-flagged OFF; zero code change needed to activate):*
1. `STRIPE_SECRET_KEY` (sk_live_) — live billing
2. `RESEND_API_KEY` — email delivery
3. `OTEL_EXPORTER_OTLP_ENDPOINT` + `SENTRY_DSN` — production observability
4. `MAPBOX_ACCESS_TOKEN` / `VITE_MAPBOX_TOKEN` — map tile rendering
5. `AIS_API_KEY` — live vessel positions

*Code/infrastructure changes required:*
6. MFA on investor data room (P1-007)
7. Firebase credential rotation in mobile build (P0-001)
8. `ALLOY_INTERNAL_TOKEN` scope restriction (GAP-016)
9. Persistent message queue for background jobs (GAP-017)

**Already closed:** Tenant scoping (all Vessels routes), SSRF protection (webhooks), seed-overwrite protection, session store in PostgreSQL, Zod validation at 84%, route auth CI enforcement.

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