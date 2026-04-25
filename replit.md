# SZL Holdings Platform

## Overview
SZL Holdings offers FORGE, a governed operational intelligence platform for regulated enterprises. The platform includes **A11oy**, a Live Enterprise Execution Fabric that senses business signals, explains their causes, recommends governed actions, executes them in Workcells, and records cryptographic proof of every step. A11oy is a fully-rendered web artifact with 19 product surfaces ensuring human-in-the-loop governance, immutable record-keeping, and attributable outcomes for AI recommendations. The platform is a pnpm monorepo supporting web and mobile applications, an API, and a design system. Its core purpose is Governed Workflow Orchestration (FORGE + Command + KORA) and Maritime Intelligence (SEXTANT), with specialized extensions like PARAGON, DOMAINE, Counsel, and Carlota Jo. The business vision is to provide a comprehensive solution for decision intelligence and operational oversight in highly regulated environments, with strong market potential in sectors requiring stringent compliance and auditable AI applications.

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