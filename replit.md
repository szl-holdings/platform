# SZL Holdings Platform

## Overview
SZL Holdings offers FORGE, a governed operational intelligence platform for regulated enterprises. The platform, including A11oy, provides a governed execution fabric where enterprise signals, agents, tools, people, policies, and proof operate as one controlled system. It's a comprehensive solution for decision intelligence and operational oversight, targeting highly regulated sectors requiring stringent compliance and auditable AI applications.

The platform is a pnpm monorepo supporting web and mobile applications, an API, and a design system. Its core focus is Governed Workflow Orchestration and Maritime Intelligence, with key capabilities like the Sovereign Execution Lab (A11oy Phase 3), the A11oy Agentic Layer (Phase 4) with robust agent orchestration and an SDK, the A11oy Mythos Doctrine for governance, the A11oy Compliance Fabric (Layer 9) for regulatory alignment, the A11oy DARPA Resilience Layer for robustness and explainability, and OMNIA, a Unified Portfolio Intelligence Layer.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.

## System Architecture
The platform is a pnpm monorepo, known as the FORGE Execution and Evidence Platform (AEEP), built with TypeScript 5.9, React 19, Vite, and Node.js, employing a micro-frontend architecture.

**Core Architectural Primitives:**
- **FORGE Execution Fabric:** Incorporates Human-in-the-loop governance, Outcome Graph, Proof Chain, and Covenant Policy.
- **Sovereign Execution Substrate:** Provides a durable, governed, and replayable runtime for orchestration and policy enforcement.
- **Workflow Engine:** Orchestrates durable business processes.
- **Event Fabric (PRISM Bus):** A cross-domain event bus.
- **SZL Foundation – Trace Graph:** The canonical trace layer for agent runs and workflow steps.
- **ATLAS Enterprise State Model:** A shared entity vocabulary and event taxonomy.
- **Living Signal Mesh & Evidence Graph:** Unifies event/signal handling with a 9-stage pipeline and an `EvidenceStore`.
- **Memory Fabric & FORGE Runtime:** A tiered memory layer with provenance, freshness, retention, and sensitivity tracking.

**Monorepo Structure:** Organizes active/archived artifacts, shared infrastructure, and packages for business observability, AI Control Plane, NVIDIA-Ready Modules, and Substrate Edge Inference, utilizing Drizzle ORM for PostgreSQL schemas. Key AI packages: `packages/ai-control-plane` (routing, fallback, cost), `packages/nvidia-adapters` (NIM endpoints), `packages/substrate-adapters` (oLLM local GPU inference), `lib/ai-engine` (model router, telemetry). The Substrate inference service lives at `apps/substrate-inference/` (Python/FastAPI).

**UI/UX and Design System:** The Governed-Intelligence Design Language v2 (`@szl-holdings/design-system`) is the single visual source of truth, defining the enterprise accent palette, typography, spacing, and UI components. All authenticated product surfaces are evidence-first, utilizing a pure dark theme with a single warm accent. The platform uses a One-of-One Platform Shell to unify user interfaces across applications.

**API Layers:** Includes REST API, GraphQL API (Apollo Server), and an MCP Gateway.

**AI Infrastructure:** Features a multi-provider AI backend, AI evaluation infrastructure, AI Ops Dashboard, NVIDIA-Ready Packages, and Substrate Edge Inference (oLLM).
- **Forge – AI Runtime, Agent Factory & Promotion Pipeline:** Manages the governed lifecycle of AI agents.
- **Precision Evolution Runtime (PER):** A governed, evidence-gated system for continuously evolving agent policies.
- **PRAXIS – Unified Agentic AI Layer:** An internal tooling sandbox for AI agent research, memory management, skill registry, and AI Control Plane features.
- **A11oy Agent Runtime:** A governed, agentic execution fabric ensuring controlled execution through governance invariants. Evolved into a Proof-Carrying Agentic Execution Platform with 9 capabilities:
  1. **Agent Gateway** (`/connectors`): ConnectorFirewall evolved with mTLS, SPIFFE, Model Armor, Air Traffic Control.
  2. **A2A Interop** (`/a2a-interop`): Agent-to-Agent protocol layer with Agent Cards, Task Lifecycle, Network Topology.
  3. **Reasoning Proof Engine** (`/proof`): ProofLedger evolved with full reasoning traces (premises→inference→conclusion), Reasoning Replay, Proof Diff.
  4. **Governed Memory Vault** (`/memory`): Memory evolved with two-layer architecture (Session Memory + Memory Bank), consolidation proof chain, retrieval traces.
  5. **Agent Identity Registry** (`/agent-identity`): Cryptographic agent identity with SPIFFE URIs, X.509 certs, behavioral trust scores, drift detection.
  6. **MirrorEval + Reasoning Verification** (`/evals`): 14-dimension eval harness with formal reasoning verification (PROVEN/UNPROVEN/VIOLATED verdicts), covenant compliance.
  7. **Self-Optimization Engine** (`/self-optimization`): RL-based optimization with targets, reward signals, policy gradients, human-lockable params.
  8. **Signal Mesh + Knowledge Graph** (`/signals`): SignalMesh evolved with entity registry, semantic search, cross-domain relationship discovery.
  9. **Governed Security Agents** (`/security-agents`): Alert Triage, Detection Engineering, Threat Analysis agents modeled on Google's Unified Security Agents.
- **AI Provenance & Explainability Contract:** Every AI-generated output carries a `ProvenanceEnvelope` with essential metadata.

**Other Technical Implementations:**
- **Red-Team Game Day Engine:** Live competitive crisis simulation with 4-dimension resilience scoring and leaderboards.
- **Cross-Domain Signal Bus (Alert Bus):** A "When/then" automation engine routing signals across product domains.
- **Outbound Gateway:** Unified omni-channel notification layer with pluggable adapters and delivery tracking.
- **SIEM Export Adapters:** Outbound export of Sentra findings to external SIEMs in CEF, ASIM, and UDM formats.
- **Carlota Jo Drip Email Engine:** Lead nurturing drip sequences with configurable delays and engagement tracking.
- **Document Lifecycle Engine:** DB-backed configurable state machine with role-based transitions and org-scoped access.
- **Counsel Features:** Jurisdiction-aware court filing package generation and e-signature integration with per-signatory tracking.
- **Aegis Multi-Fund Tenancy:** Fund-scoped dashboards with GP/LP access control, LP management, and cross-fund rollup aggregation.
- **Aegis Pixel-Perfect PDF Export:** Immutable metric snapshot freezing at export time with export history.
- **Historical Event Backfill (Signal Bus):** Endpoint for replaying historical signals through the rule engine.
- **AEEP Core Packages:** Includes contracts, agent core, workflow runtime, retrieval core, memory core, memory fabric, evidence ledger, policy guard, domain profiles, and platform metrics registry.
- **Email Deliverability:** Centralized library for all outbound transactional email with suppression lists.
- **Multi-Agent Crew System:** Specialized agent roles with plan decomposition and trust-aware execution.
- **Trust Score Engine:** Graduated autonomy system with rolling accuracy tracking and approval routing.
- **Fine-Tuned Model Router:** Domain-aware model routing with fine-tuned model resolution and cascading fallback chains.
- **Multi-Language Voice Pipeline:** 5-language support with auto-detection, transcription, TTS, and voice chat.
- **Offline-First Sync:** Mobile offline sync with local cache, background sync queue, and conflict resolution.
- **Wake-Word Detection:** On-device "Hey Command" wake-word detection supporting 5 languages.
- **Mobile Web Parity & Biometric Sign-In:** Global search, agent trust dashboard, offline sync status, and server-side biometric authentication.
- **Unified Auth Mesh:** Backend-only authentication unification layer using custom HS256 JWT.
- **Forecast & Anomaly Fabric:** Unified forecasting and anomaly detection service with drift detection and champion-challenger evaluations.
- **Premium Data Fabric:** Adapter framework with schema mapping, refresh scheduling, cost metering, and provenance.
- **Predictive Cap Rate Model:** ML-driven cap rate forecasting for Terra.
- **Voyage Economics Calculator:** Full voyage P&L calculator for Vessels.
- **Causal Scenario Backtesting:** Historical event replay validating the Causal Scenario Engine's predictions.
- **Monte Carlo Simulation Fabric:** Configurable stochastic simulation engine with path generation and visualization.
- **OpenAI Agents SDK Bridge:** Integration of OpenAI agents into the SZL observability stack.
- **DARPA MTO Innovation Hub, Post-Quantum Cryptography Readiness, Hardware Root of Trust, Adversarial ML Defense Console, Cyber Innovation Roadmap:** Integrated modules for advanced cybersecurity and resilience.
- **Sentra Offensive/Defensive Cyber Command Expansion:** New and upgraded pages for cybersecurity command and defense.
- **Karpathy-Distilled Agent Evolution:** Six Karpathy-inspired engine primitives in `lib/ai-engine/src/karpathy/`: (1) **Residual Intelligence Stream** — cross-agent accumulated intelligence with audit trail, (2) **Autonomy Depth Dial** — single 1-10 complexity knob auto-deriving agent count, governance strictness, gate thresholds, and all capability toggles, (3) **Four Karpathy Gates** (ThinkGate, SimplicityGate, SurgicalScopeGate, GoalVerificationGate) — composable quality gates with verdict/audit log, (4) **Agent Distillation Engine** — observes chain executions, detects convergence, proposes compressed single-agent replacements, (5) **Ephemeral Reasoning Chains** — explore/branch/backtrack/synthesize with garbage collection, (6) **Self-Distilling Knowledge Base** — Jaccard-similarity merging, confidence pruning, consolidation passes. All wired into `NuroMeshOrchestrator.orchestrate()` in nuro-mesh.ts. Exported from `@szl-holdings/ai-engine` via `karpathy/index.js`. A11oy dashboard at `/a11oy/karpathy-evolution`.

## External Dependencies
-   **Database:** PostgreSQL 16
-   **Authentication:** Replit Auth
-   **Payment Processing:** Stripe
-   **AI Providers:** OpenAI, Anthropic, Gemini, HuggingFace Inference API, HuggingFace MCP, Elevenlabs, Substrate/oLLM (local GPU)
-   **Communication:** Slack, Twilio, Resend, SendGrid
-   **Maritime Data:** MarineTraffic, AISHub, Digitraffic AIS, BarentsWatch AIS, Open-Meteo Marine Weather
-   **Threat Intelligence:** STIX/TAXII, AlienVault OTX, MISP OSINT, OFAC SDN, EU Consolidated List, Shodan, GreyNoise, MalwareBazaar
-   **Government Data:** CISA KEV, NVD CVE, MITRE ATT&CK, Census/BLS, FEMA NRI, NYC Open Data, SEC EDGAR
-   **Legal Data:** CourtListener REST API
-   **Other APIs/Services:** GitHub API, Figma, Google APIs, HubSpot