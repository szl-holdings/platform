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

**Monorepo Structure:** Organizes active/archived artifacts, shared infrastructure, and packages for business observability, AI Control Plane, NVIDIA-Ready Modules, and Substrate Edge Inference, utilizing Drizzle ORM for PostgreSQL schemas. Key AI packages include routing, fallback, cost management, NVIDIA NIM endpoints, oLLM local GPU inference, and specialized modules like `packages/ai-control-plane`, `packages/nvidia-adapters`, `packages/substrate-adapters`, and `lib/ai-engine`. The Substrate inference service uses Python/FastAPI and lives at `apps/substrate-inference/`.

**UI/UX and Design System:** The Governed-Intelligence Design Language v2 (`@szl-holdings/design-system`) is the single visual source of truth, defining the enterprise accent palette, typography, spacing, and UI components. All authenticated product surfaces are evidence-first, utilizing a pure dark theme with a single warm accent. The platform uses a One-of-One Platform Shell to unify user interfaces across applications.

**API Layers:** Includes REST API, GraphQL API (Apollo Server), and an MCP Gateway.

**AI Infrastructure:** Features a multi-provider AI backend, AI evaluation infrastructure, AI Ops Dashboard, NVIDIA-Ready Packages, and Substrate Edge Inference (oLLM).
- **Forge – AI Runtime, Agent Factory & Promotion Pipeline:** Manages the governed lifecycle of AI agents.
- **Precision Evolution Runtime (PER):** A governed, evidence-gated system for continuously evolving agent policies.
- **PRAXIS – Unified Agentic AI Layer:** An internal tooling sandbox for AI agent research, memory management, skill registry, and AI Control Plane features.
- **A11oy Agent Runtime:** A governed, agentic execution fabric ensuring controlled execution through governance invariants, evolved into a Proof-Carrying Agentic Execution Platform with capabilities such as Agent Gateway, A2A Interop, Reasoning Proof Engine, Governed Memory Vault, Agent Identity Registry, MirrorEval + Reasoning Verification, Self-Optimization Engine, Signal Mesh + Knowledge Graph, and Governed Security Agents.
- **a1.1oy — Conversational AI Interface (inside A11oy):** Claude-style governed AI chat at `/nexus` (component: Praxis.tsx), MCP Hub at `/mcp-hub` (6 servers, 27 tools, protocol architecture), and Agentic RAG at `/agentic-rag` (multi-step retrieval pipeline, knowledge collections, memory fabric tiers). Sidebar section "a1.1oy" groups all three pages. Model picker supports a1.1oy Sovereign/Code/Reason/Fast. SafeMarkdown renders message content without XSS risk.
- **AI Provenance & Explainability Contract:** Every AI-generated output carries a `ProvenanceEnvelope` with essential metadata.
- **Karpathy-Distilled Agent Evolution:** Implements six Karpathy-inspired engine primitives for advanced agent intelligence: Residual Intelligence Stream, Autonomy Depth Dial, Four Karpathy Gates, Agent Distillation Engine, Ephemeral Reasoning Chains, and Self-Distilling Knowledge Base.

**Other Technical Implementations:**
- **Red-Team Game Day Engine:** Live competitive crisis simulation for resilience scoring and debriefing.
- **Cross-Domain Signal Bus (Alert Bus):** A "When/then" automation engine routing signals across product domains.
- **Outbound Gateway:** Unified omni-channel notification layer with pluggable adapters for various communication channels, delivery tracking, and auditing.
- **Conduit — Reverse ETL:** Visual no-code tool for operators to map SZL internal data to 13 third-party SaaS destinations with drag-and-drop field mapping, sync scheduling, and audit history.
- **SIEM Export Adapters:** Outbound export of Sentra findings to external SIEMs in CEF, ASIM, and UDM formats.
- **Carlota Jo Drip Email Engine:** Lead nurturing drip sequences with multi-step emails, configurable delays, and engagement tracking.
- **Document Lifecycle Engine:** DB-backed configurable state machine for documents (draft→review→sign→file→archive) with role-based transitions.
- **Court Filing Package Generation (Counsel):** Jurisdiction-aware filing packages with cover sheets, exhibit indexes, and certificates of service.
- **E-Signature Integration (Counsel):** Document routing for e-signature with per-signatory tracking and status visualization.
- **Multi-Fund Tenancy (Aegis):** Fund-scoped dashboards with GP/LP access control, LP management, and cross-fund rollup aggregation.
- **Pixel-Perfect PDF Export (Aegis):** Immutable metric snapshot freezing at export time with export history and configurable report preview.
- **Historical Event Backfill (Signal Bus):** Endpoint for replaying historical signals through the rule engine with dry-run support and auditing.
- **AEEP Core Packages:** Includes contracts, agent core, workflow runtime, retrieval core, memory core, memory fabric, evidence ledger, policy guard, domain profiles, and platform metrics registry, featuring a two-stage retrieval pipeline, multimodal retrieval, and scoped memory management.
- **Email Deliverability:** Centralized library for all outbound transactional email with suppression lists.
- **Multi-Agent Crew System:** Specialized agent roles with plan decomposition and trust-aware execution.
- **Trust Score Engine:** Graduated autonomy system with rolling accuracy tracking and approval routing.
- **Fine-Tuned Model Router:** Domain-aware model routing with fine-tuned model resolution and cascading fallback chains.
- **Multi-Language Voice Pipeline:** 5-language support for auto-detection, transcription, TTS, and voice chat.
- **Offline-First Sync (Mobile):** Mobile offline sync with local cache, background sync queue, and conflict resolution.
- **Wake-Word Detection (Mobile):** On-device "Hey Command" wake-word detection supporting 5 languages.
- **Mobile Web Parity:** Global search, agent trust dashboard, and offline sync status screens in mobile app.
- **Mobile Biometric Sign-In:** Real server-side authentication factor with cryptographic proof-of-possession.
- **Unified Auth Mesh:** Backend-only authentication unification layer using custom HS256 JWT, with specific priority order.
- **Forecast & Anomaly Fabric:** Unified forecasting service with calibrated interval outputs, and a unified streaming and batch anomaly detection service.
- **Premium Data Fabric:** Adapter framework with schema mapping, refresh scheduling, cost metering, entity caching, health tracking, and provenance. Includes Property Market (Terra), Satellite AIS+RF (Vessels), Macro Indicators (Lyte), and Sanctions/PEP (Vessels+Counsel) adapters.
- **Predictive Cap Rate Model:** ML-driven cap rate forecasting for Terra with feature importance and Monte Carlo simulation.
- **Voyage Economics Calculator:** Full voyage P&L calculator for Vessels with vessel classes, routes, bunker prices, canal fees, charter rates, and carbon emissions.
- **Causal Scenario Backtesting:** Historical event replay validating the Causal Scenario Engine's predictions with accuracy metrics.
- **Monte Carlo Simulation Fabric:** Configurable stochastic simulation engine with path generation, distribution types, probability-weighted outcome bands, and visualization.
- **OpenAI Agents SDK Bridge:** Wires `@openai/agents@0.0.15` into the SZL observability stack for governed agent execution.
- **DARPA MTO Innovation Hub, Post-Quantum Cryptography Readiness, Hardware Root of Trust, Adversarial ML Defense Console, Cyber Innovation Roadmap, Photonic Inference Tier:** Integrated modules for advanced cybersecurity and resilience, including a Photonic Inference Tier showing compute tier routing decisions.
- **Sentra Offensive/Defensive Cyber Command Expansion:** New and upgraded pages for cybersecurity command and defense.
- **A11oy × Sentra Glasswing Command Layer (Risk-as-Reward):** Premium executive command surface at `/a11oy/glasswing` synthesizing the 10-agent constellation (Daedalus/Argus/Ariadne/Hephaestus/Pallas/Hermes/Cerberus/Silver/Sentinel/Oracle), a research-anchored "Risk-as-Reward" novelty thesis (cited to Silver & Sutton's Era of Experience 2025, MITRE ATLAS, arxiv 2401.07031, Microsoft Agent Governance Toolkit, OpenAI Aardvark), the Sentra Control Plane (PolicyEngine, SecretsVault, ApprovalGate, AuditLedger), Silver's RL planner with calibrated reward table, the patch command center, the Engineering Loop, bidirectional compliance mapping, and Cerberus hard offensive-boundary list. Backed by `artifacts/a11oy/src/lib/glasswing-schemas.ts` (Zod schemas for Finding, PatchCandidate, Approval, AuditEvent, RLState, RLAction, RLReward) and `artifacts/a11oy/src/data/glasswingDoctrine.ts` (research citations, agent registry, seed data).
- **A11oy Trust & Policies:** Three new operational policy pages covering Constitution, Security & Compliance, and Right to Audit.
- **Shared Reverse Proxy:** `packages/shared-proxy` — all artifacts share a single reverse-proxy Vite plugin on port 9090 with `SO_REUSEPORT`. The `PROXY_ROUTES` array must contain an entry for every artifact's path prefix. When adding a new artifact, add its route to `PROXY_ROUTES` and restart ALL running workflows so every `reusePort` listener picks up the updated route table. Port constants: A11OY=4110, AEGIS=3002, API=8080, CARLOTA_JO=8098, COMMAND=5000, CONDUIT=5300, COUNSEL=4199, LYTE=7099, PRAXIS=8008, SENTRA=4099, TERRA=6000, VESSELS=8099, PULSE=5201, SZL_DEMO_VIDEO=8765, PLUGINMESH=8190.

## External Dependencies
- **Database:** PostgreSQL 16
- **Authentication:** Replit Auth
- **Payment Processing:** Stripe
- **AI Providers:** OpenAI, Anthropic, Gemini, HuggingFace Inference API, HuggingFace MCP, Elevenlabs, Substrate/oLLM
- **Communication:** Slack, Twilio, Resend, SendGrid
- **Maritime Data:** MarineTraffic, AISHub, Digitraffic AIS, BarentsWatch AIS, Open-Meteo Marine Weather
- **Threat Intelligence:** STIX/TAXII, AlienVault OTX, MISP OSINT, OFAC SDN, EU Consolidated List, Shodan, GreyNoise, MalwareBazaar
- **Government Data:** CISA KEV, NVD CVE, MITRE ATT&CK, Census/BLS, FEMA NRI, NYC Open Data, SEC EDGAR
- **Legal Data:** CourtListener REST API
- **Other APIs/Services:** GitHub API, Figma, Google APIs, HubSpot