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

**Forecast & Anomaly Fabric:** Unified forecasting service (`packages/forecast-fabric`) with calibrated interval outputs, and a unified streaming and batch anomaly detection service (`packages/anomaly-fabric`). Drift detection (`packages/drift-eval`) for performance drift against baseline snapshots and champion-vs-challenger evaluations.

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