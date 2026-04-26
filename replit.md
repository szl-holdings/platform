# SZL Holdings Platform

## Overview
SZL Holdings offers FORGE, a governed operational intelligence platform for regulated enterprises. The platform includes A11oy, a governed execution fabric where enterprise signals, agents, tools, people, policies, and proof operate as one controlled system. It's a comprehensive solution for decision intelligence and operational oversight, with strong market potential in highly regulated sectors requiring stringent compliance and auditable AI applications.

The platform is a pnpm monorepo supporting web and mobile applications, an API, and a design system, focusing on Governed Workflow Orchestration and Maritime Intelligence. Key capabilities include the Sovereign Execution Lab (A11oy Phase 3), the A11oy Agentic Layer (Phase 4) with robust agent orchestration and an SDK, the A11oy Mythos Doctrine for governance, the A11oy Compliance Fabric (Layer 9) for regulatory alignment, and the A11oy DARPA Resilience Layer for robustness and explainability. It also features OMNIA, a Unified Portfolio Intelligence Layer, providing shared shell primitives and an A11oy Adoption Dashboard.

Key capabilities include:
- **A11oy Phase 3 (Sovereign Execution Lab):** Features like Model Router, MirrorEval 2.0, Workcell Replay, Connector Firewall, Twin Foundry, Skill Library, Boardroom Mode, Trust Center, Investor Demo, and Sovereign landing.
- **A11oy Agentic Layer (Phase 4):** Agent Orchestration, Agent Mesh (17 external agents governed by proof chain), Agent Visualization, and a comprehensive a11oy SDK. The SDK includes **59 primitives**, multi-agent orchestration capabilities, and alignment/welfare governance features. It supports **10 language Client SDKs**, **4 cloud platforms**, and provides an **Administration API** with robust **Security & Trust Architecture** and **Alignment & Risk Governance**.
- **A11oy Mythos Doctrine:** 14 governance pages covering risk reports, behavioral audits, covenant lifts, reward hacking, and alignment reviews.
- **A11oy Compliance Fabric (Layer 9):** Compliance-as-Runtime — maps every A11oy governance primitive to EU AI Act (Articles 9-72, Annex IV), NIST AI RMF 1.0 (GOVERN/MAP/MEASURE/MANAGE + CSA Agentic Overlay), ISO/IEC 42001:2023 (Annex A), and CSA Agentic Profile controls. Five pillar pages: **Compass** (regulatory posture dashboard with heat map, control drill-down, one-click audit package export), **Agent-BOM** (per-agent CycloneDX ML-BOM v1.7 with model fingerprints, tool manifest hashes, eval history), **Delegation Chain** (multi-agent governance with scope narrowing and privilege boundaries), **Federated Trust Exchange** (cross-org compliance attestation via posture brackets), **CARE Engine** (evidence freshness monitoring, Article 12 log retention, FRIA generator). Data layer in `complianceFabric.ts` with 46 control mappings, 6 agent BOMs, 3 delegation chains, 4 trust attestations. Fabric upgraded from 8-layer to 9-layer. Operator surfaces count updated from 19 to 24.
- **A11oy DARPA Resilience Layer:** 8 pages integrating innovations from 8 DARPA programs (GARD, XAI, Assured Autonomy, SSITH/CHERI, SocialCyber, AIxCC, BORDEAUX, TIAMAT) focusing on robustness, formal verification, supply chain security, and explainability.
- **OMNIA — Unified Portfolio Intelligence Layer:** Provides shared shell primitives, world model API routes, command surface pages, and an A11oy Adoption Dashboard. It integrates a unified shell across all web artifacts and offers mobile screens for notifications and voice queries.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.

## System Architecture
The platform is a pnpm monorepo built with TypeScript 5.9, React 19, Vite, and Node.js, employing a micro-frontend architecture. It is known as the FORGE Execution and Evidence Platform (AEEP).

**Core Architectural Primitives:**
- **FORGE Execution Fabric:** Incorporates Human-in-the-loop governance, Outcome Graph, Proof Chain, and Covenant Policy.
- **Sovereign Execution Substrate:** Provides a durable, governed, and replayable runtime for orchestration and policy enforcement.
- **Workflow Engine:** Orchestrates durable business processes.
- **Event Fabric (PRISM Bus):** A cross-domain event bus.
- **SZL Foundation – Trace Graph:** The canonical trace layer for agent runs and workflow steps.
- **ATLAS Enterprise State Model:** A shared entity vocabulary and event taxonomy.
- **Living Signal Mesh & Evidence Graph:** Unifies event/signal handling with a 9-stage pipeline and an `EvidenceStore`.
- **Memory Fabric & FORGE Runtime:** A tiered memory layer with provenance, freshness, retention, and sensitivity tracking.

**Monorepo Structure:** Organizes active/archived artifacts, shared infrastructure, and packages for business observability, AI Control Plane, and NVIDIA-Ready Modules, utilizing Drizzle ORM for PostgreSQL schemas.

**UI/UX and Design System:** The Governed-Intelligence Design Language v2 (`@szl-holdings/design-system`) is the single visual source of truth, defining the enterprise accent palette, typography, spacing, and UI components. All authenticated product surfaces are evidence-first, utilizing a pure dark theme with a single warm accent. The platform uses a One-of-One Platform Shell to unify user interfaces across applications.

**API Layers:** Includes REST API, GraphQL API (Apollo Server), and an MCP Gateway. The A11oy frontend connects to the API server's `/api/graphql` endpoint via `urql`.

**AI Infrastructure:** Features a multi-provider AI backend, AI evaluation infrastructure, AI Ops Dashboard, and NVIDIA-Ready Packages.
- **Forge – AI Runtime, Agent Factory & Promotion Pipeline:** Manages the governed lifecycle of AI agents.
- **Precision Evolution Runtime (PER):** A governed, evidence-gated system for continuously evolving agent policies.
- **PRAXIS – Unified Agentic AI Layer:** An internal tooling sandbox for AI agent research, memory management, skill registry, and AI Control Plane features.
- **A11oy Agent Runtime:** A governed, agentic execution fabric with modules for Types, Tracing, Memory, Model Router, MirrorEval, Deep Context, Tool Registry, Approved Runner, PCE Gate, Operators, and Workcells, ensuring controlled execution through governance invariants.
- **AI Provenance & Explainability Contract:** Every AI-generated output carries a `ProvenanceEnvelope` with essential metadata.

**Other Technical Implementations:**
- **Red-Team Game Day Engine:** Live competitive crisis simulation with synthetic traffic injection, 4-dimension resilience scoring (TTD, TTR, Runbook Adherence, Business Impact Containment), per-participant scoring, leaderboard with opt-in privacy, resilience score trending on executive dashboard, 5 starter scenarios, and branded PDF debrief export. Accessible at `/strategy/game-day` in Command.
- **Cross-Domain Signal Bus (Alert Bus):** A "When/then" automation engine routing signals across product domains.
- **AEEP Core Packages:** Includes contracts, agent core, workflow runtime, retrieval core, memory core, memory fabric, evidence ledger, policy guard, domain profiles, and platform metrics registry, featuring a two-stage retrieval pipeline, multimodal retrieval, and scoped memory management.
- **Email Deliverability:** All outbound transactional email uses a centralized library with suppression lists.
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

## Terra — Real Estate Intelligence Platform
Terra has been transformed from a gated marketing page into a fully operational, investor-ready real estate intelligence platform:
- **Auth gate removed**: All routes render without login; sandbox/demo mode enabled by default
- **Glasswing-inspired hero**: Full-screen editorial landing at `/` with serif typography (Georgia), generative mesh canvas animation, gold (#b8943c) / obsidian (#080b0d) palette, "Enter Platform" CTA navigating to dashboard
- **Landing renders outside TerraLayout**: The `/` route in `AppContent` bypasses `PrivateApp` (no sidebar), while `/dashboard` and all operational routes render inside `TerraLayout` with sidebar navigation
- **A11oy Signal Mesh**: Cross-vertical intelligence widget (`a11oy-signal-mesh.tsx`) showing 5 signals from Vessels, Counsel, Sentra — integrated into Dashboard and Pipeline pages
- **Pipeline enhanced**: CoStar-grade velocity metrics, avg days-in-stage, probability-weighted value, stage velocity breakdown, cap rate and velocity indicators on deal cards
- **Distress Engine enhanced**: PropertyShark-level parcel detail (block, lot, zoning, tax class, FAR, BBL), First Street-style climate risk badge, Cherre-verified data provenance section
- **Ownership Graph enhanced**: Reonomy-style UBO resolution depth indicators showing entity layers traversed for each beneficial owner
- **Key files**: `App.tsx`, `marketing-landing.tsx`, `a11oy-signal-mesh.tsx`, `dashboard.tsx`, `pipeline.tsx`, `distress-engine.tsx`, `ownership-graph.tsx`