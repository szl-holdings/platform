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

**Monorepo Structure:** Organizes active/archived artifacts, shared infrastructure, and packages for business observability, AI Control Plane, NVIDIA-Ready Modules, and Substrate Edge Inference, utilizing Drizzle ORM for PostgreSQL schemas. Key AI packages: `packages/ai-control-plane`, `packages/nvidia-adapters`, `packages/substrate-adapters`, `lib/ai-engine`. The Substrate inference service lives at `apps/substrate-inference/`.

**UI/UX and Design System:** The Governed-Intelligence Design Language v2 (`@szl-holdings/design-system`) is the single visual source of truth, defining the enterprise accent palette, typography, spacing, and UI components. All authenticated product surfaces are evidence-first, utilizing a pure dark theme with a single warm accent. The platform uses a One-of-One Platform Shell to unify user interfaces across applications.

**API Layers:** Includes REST API, GraphQL API (Apollo Server), and an MCP Gateway.

**AI Infrastructure:** Features a multi-provider AI backend, AI evaluation infrastructure, AI Ops Dashboard, NVIDIA-Ready Packages, and Substrate Edge Inference (oLLM).
- **Forge – AI Runtime, Agent Factory & Promotion Pipeline:** Manages the governed lifecycle of AI agents.
- **Precision Evolution Runtime (PER):** A governed, evidence-gated system for continuously evolving agent policies.
- **PRAXIS – Unified Agentic AI Layer:** An internal tooling sandbox for AI agent research, memory management, skill registry, and AI Control Plane features.
- **A11oy Agent Runtime:** A governed, agentic execution fabric ensuring controlled execution through governance invariants, including an Agent Gateway, A2A Interop, Reasoning Proof Engine, Governed Memory Vault, Agent Identity Registry, MirrorEval + Reasoning Verification, Self-Optimization Engine, Signal Mesh + Knowledge Graph, and Governed Security Agents.
- **AI Provenance & Explainability Contract:** Every AI-generated output carries a `ProvenanceEnvelope` with essential metadata.
- **Karpathy-Distilled Agent Evolution:** Implements Karpathy-inspired engine primitives for advanced agent intelligence, including a Residual Intelligence Stream, Autonomy Depth Dial, Four Karpathy Gates, Agent Distillation Engine, Ephemeral Reasoning Chains, and Self-Distilling Knowledge Base.

**Other Technical Implementations:**
- **Red-Team Game Day Engine:** Live competitive crisis simulation for resilience scoring.
- **Cross-Domain Signal Bus (Alert Bus):** A "When/then" automation engine for routing signals.
- **Outbound Gateway:** Unified omni-channel notification layer with pluggable adapters.
- **Conduit — Reverse ETL:** Visual no-code tool for mapping SZL internal data to third-party SaaS destinations.
- **SIEM Export Adapters:** Outbound export of Sentra findings to external SIEMs in various formats.
- **Carlota Jo Drip Email Engine:** Lead nurturing drip sequences with engagement tracking.
- **Document Lifecycle Engine:** DB-backed configurable state machine for documents.
- **Court Filing Package Generation (Counsel):** Jurisdiction-aware filing packages.
- **E-Signature Integration (Counsel):** Document routing for e-signature with tracking.
- **Multi-Fund Tenancy (Aegis):** Fund-scoped dashboards with access control and LP management.
- **Pixel-Perfect PDF Export (Aegis):** Immutable metric snapshot freezing at export time.
- **Historical Event Backfill (Signal Bus):** Endpoint for replaying historical signals through the rule engine.
- **AEEP Core Packages:** Includes contracts, agent core, workflow runtime, retrieval core, memory core, memory fabric, evidence ledger, policy guard, domain profiles, and platform metrics registry.
- **Email Deliverability:** Centralized library with suppression lists for transactional emails.
- **Multi-Agent Crew System:** Specialized agent roles with plan decomposition and trust-aware execution.
- **Trust Score Engine:** Graduated autonomy system with rolling accuracy tracking and approval routing.
- **Fine-Tuned Model Router:** Domain-aware model routing with fine-tuned model resolution and fallback chains.
- **Multi-Language Voice Pipeline:** 5-language support for transcription, TTS, and voice chat.
- **Offline-First Sync:** Mobile offline sync with local cache, background sync queue, and conflict resolution.
- **Wake-Word Detection:** On-device "Hey Command" wake-word detection supporting 5 languages.
- **Mobile Web Parity:** Global search, agent trust dashboard, and offline sync status screens in mobile app.
- **Mobile Biometric Sign-In:** Real server-side authentication factor.
- **Unified Auth Mesh:** Backend-only authentication unification layer using custom HS256 JWT.
- **Forecast & Anomaly Fabric:** Unified forecasting and anomaly detection services.
- **Premium Data Fabric:** Adapter framework with schema mapping, refresh scheduling, and cost metering for various data sources.
- **Predictive Cap Rate Model:** ML-driven cap rate forecasting for Terra.
- **Voyage Economics Calculator:** Full voyage P&L calculator for Vessels.
- **Causal Scenario Backtesting:** Historical event replay for validating Causal Scenario Engine's predictions.
- **Monte Carlo Simulation Fabric:** Configurable stochastic simulation engine with various distribution types and visualization.
- **OpenAI Agents SDK Bridge:** Integration with OpenAI Agents for governed agent execution.
- **DARPA MTO Innovation Hub, Post-Quantum Cryptography Readiness, Hardware Root of Trust, Adversarial ML Defense Console, Cyber Innovation Roadmap, Photonic Inference Tier:** Integrated modules for advanced cybersecurity and resilience.
- **Sentra Offensive/Defensive Cyber Command Expansion:** New and upgraded pages for cybersecurity command and defense.
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