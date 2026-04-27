# SZL Holdings Platform

## Overview
SZL Holdings offers FORGE, a governed operational intelligence platform for regulated enterprises. The platform provides a governed execution fabric where enterprise signals, agents, tools, people, policies, and proof operate as one controlled system. It's a comprehensive solution for decision intelligence and operational oversight, targeting highly regulated sectors requiring stringent compliance and auditable AI applications. The platform supports web and mobile applications, an API, and a design system, focusing on Governed Workflow Orchestration and Maritime Intelligence. Key capabilities include the Sovereign Execution Lab (A11oy Phase 3), the A11oy Agentic Layer (Phase 4), the A11oy Mythos Doctrine for governance, the A11oy Compliance Fabric (Layer 9), the A11oy DARPA Resilience Layer, and OMNIA, a Unified Portfolio Intelligence Layer.

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

**Monorepo Structure:** Organizes active/archived artifacts, shared infrastructure, and packages for business observability, AI Control Plane, NVIDIA-Ready Modules, and Substrate Edge Inference, utilizing Drizzle ORM for PostgreSQL schemas. Includes key AI packages for routing, fallback, cost management, NVIDIA NIM endpoints, oLLM local GPU inference. The Substrate inference service uses Python/FastAPI.

**UI/UX and Design System:** The Governed-Intelligence Design Language v2 (`@szl-holdings/design-system`) is the single visual source of truth, defining the enterprise accent palette, typography, spacing, and UI components. All authenticated product surfaces are evidence-first, utilizing a pure dark theme with a single warm accent. The platform uses a One-of-One Platform Shell to unify user interfaces across applications.

**API Layers:** Includes REST API, GraphQL API (Apollo Server), and an MCP Gateway.

**AI Infrastructure:** Features a multi-provider AI backend, AI evaluation infrastructure, AI Ops Dashboard, NVIDIA-Ready Packages, and Substrate Edge Inference (oLLM).
- **Forge – AI Runtime, Agent Factory & Promotion Pipeline:** Manages the governed lifecycle of AI agents.
- **Precision Evolution Runtime (PER):** A governed, evidence-gated system for continuously evolving agent policies.
- **PRAXIS – Unified Agentic AI Layer:** An internal tooling sandbox for AI agent research, memory management, skill registry, and AI Control Plane features.
- **A11oy Agent Runtime:** A governed, agentic execution fabric ensuring controlled execution through governance invariants, evolved into a Proof-Carrying Agentic Execution Platform with capabilities such as Agent Gateway, A2A Interop, Reasoning Proof Engine, Governed Memory Vault, Agent Identity Registry, MirrorEval + Reasoning Verification, Self-Optimization Engine, Signal Mesh + Knowledge Graph, and Governed Security Agents.
- **a1.1oy — Conversational AI Interface:** Provides Claude-style governed AI chat, MCP Hub, and Agentic RAG with multi-step retrieval pipeline and knowledge collections.
- **AI Provenance & Explainability Contract:** Every AI-generated output carries a `ProvenanceEnvelope` with essential metadata.
- **Karpathy-Distilled Agent Evolution:** Implements six Karpathy-inspired engine primitives for advanced agent intelligence.

**Other Technical Implementations:**
- **Red-Team Game Day Engine:** Live competitive crisis simulation.
- **Cross-Domain Signal Bus (Alert Bus):** "When/then" automation engine routing signals.
- **Outbound Gateway:** Unified omni-channel notification layer with pluggable adapters.
- **Conduit — Reverse ETL:** Visual no-code tool for mapping internal data to third-party SaaS destinations.
- **SIEM Export Adapters:** Outbound export of Sentra findings to external SIEMs.
- **Document Lifecycle Engine:** DB-backed configurable state machine for documents.
- **E-Signature Integration (Counsel):** Document routing for e-signature.
- **Multi-Fund Tenancy (Aegis):** Fund-scoped dashboards with GP/LP access control.
- **Pixel-Perfect PDF Export (Aegis):** Immutable metric snapshot freezing at export time.
- **AEEP Core Packages:** Includes contracts, agent core, workflow runtime, retrieval core, memory core, memory fabric, evidence ledger, policy guard, domain profiles, and platform metrics registry, featuring a two-stage retrieval pipeline, multimodal retrieval, and scoped memory management.
- **Multi-Agent Crew System:** Specialized agent roles with plan decomposition and trust-aware execution.
- **Trust Score Engine:** Graduated autonomy system with rolling accuracy tracking and approval routing.
- **Fine-Tuned Model Router:** Domain-aware model routing with fine-tuned model resolution and cascading fallback chains.
- **Multi-Language Voice Pipeline:** 5-language support for auto-detection, transcription, TTS, and voice chat.
- **Offline-First Sync (Mobile):** Mobile offline sync with local cache, background sync queue, and conflict resolution.
- **Mobile Biometric Sign-In:** Real server-side authentication factor.
- **Unified Auth Mesh:** Backend-only authentication unification layer using custom HS256 JWT.
- **Forecast & Anomaly Fabric:** Unified forecasting service and streaming/batch anomaly detection service.
- **Premium Data Fabric:** Adapter framework with schema mapping, refresh scheduling, cost metering, entity caching, health tracking, and provenance.
- **Voyage Economics Calculator:** Full voyage P&L calculator for Vessels.
- **Causal Scenario Backtesting:** Historical event replay validating the Causal Scenario Engine's predictions.
- **Monte Carlo Simulation Fabric:** Configurable stochastic simulation engine.
- **OpenAI Agents SDK Bridge:** Wires `@openai/agents@0.0.15` into the SZL observability stack.
- **A11oy ARGO — Field Intelligence Forge:** Distillation surface for open-source primitives and frontier methods, enforcing doctrine pillars.
- **A11oy Aerial Twin:** Doctrine hub distilling NVIDIA Aerial Digital Twin overview into the SZL ecosystem for site-specific wireless digital-twin applications.
- **A11oy Mythos Layer:** Codifies the A11oy×Sentra orchestration architecture.
- **A11oy × Sentra Glasswing Command Layer:** Executive command surface synthesizing a 10-agent constellation and research-anchored "Risk-as-Reward" novelty thesis.
- **A11oy Command Fabric — Universal Intelligence Layer:** Cross-vertical command layer spanning all SZL verticals with interactive data views.
- **Shared Reverse Proxy:** `packages/shared-proxy` provides a single reverse-proxy Vite plugin for all artifacts.

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