# SZL Holdings Platform

## Overview
SZL Holdings offers FORGE, a governed operational intelligence platform for regulated enterprises. It provides a controlled, auditable environment for enterprise signals, agents, tools, people, policies, and proof to operate as a unified system, focusing on decision intelligence and operational oversight. The platform is designed for highly regulated sectors requiring strict compliance and auditable AI applications, supporting web and mobile applications, an API, and a cohesive design system, aiming for market leadership in regulated AI applications. Key capabilities include Governed Workflow Orchestration, Maritime Intelligence, a Sovereign Execution Lab, the Continuum Business Observability Fabric, and OMNIA for Unified Portfolio Intelligence.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.

## System Architecture
The platform is built as a pnpm monorepo using TypeScript 5.9, React 19, Vite, and Node.js within a micro-frontend architecture, known as the Continuum Business Observability Fabric.

**Core Architectural Principles:**
- **FORGE Execution Fabric:** Incorporates Human-in-the-loop governance, Outcome Graph, Proof Chain, and Covenant Policy.
- **Sovereign Execution Substrate:** Ensures durable, governed, and replayable runtime for orchestration and policy enforcement.
- **Event Fabric (PRISM Bus):** A cross-domain event bus for seamless communication.
- **SZL Foundation – Trace Graph:** Canonical trace layer for agent runs and workflow steps.
- **ATLAS Enterprise State Model:** Defines a shared entity vocabulary and event taxonomy.
- **Living Signal Mesh & Evidence Graph:** Unifies event/signal handling with an `EvidenceStore`.
- **Memory Fabric & FORGE Runtime:** Tiered memory layer with provenance, freshness, retention, and sensitivity tracking.

**Monorepo Structure:** Organizes active/archived artifacts, shared infrastructure, and packages for business observability, AI Control Plane, NVIDIA-Ready Modules, and Substrate Edge Inference, utilizing Drizzle ORM for PostgreSQL schemas.

**UI/UX and Design System:** The Governed-Intelligence Design Language v2 (`@szl-holdings/design-system`) provides a single source of truth for visual design, including typography, spacing, and UI components. All authenticated product surfaces are evidence-first, employing a pure dark theme with a single warm accent. A One-of-One Platform Shell unifies user interfaces.

**API Layers:** The platform provides REST API, GraphQL API (Apollo Server), and an MCP Gateway (protocol version 2025-11-25 with Roots, Sampling, and Elicitation capabilities).

**Zero-Trust Authentication:** Implements robust security with passwordless magic-link authentication, device fingerprinting, adaptive risk scoring, progressive brute-force protection, session management API, and security event audit logging.

**AI Infrastructure:** Features a multi-provider AI backend, AI evaluation infrastructure, AI Ops Dashboard, NVIDIA-Ready Packages, and Substrate Edge Inference.
- **Forge – AI Runtime, Agent Factory & Promotion Pipeline:** Manages the governed lifecycle of AI agents.
- **Precision Evolution Runtime (PER):** A governed, evidence-gated system for continuously evolving agent policies.
- **PRAXIS – Unified Agentic AI Layer:** An internal tooling sandbox for AI agent research, memory management, skill registry, and AI Control Plane features.
- **Continuum — Business Observability Fabric (formerly Alloy):** A governed, agentic execution fabric ensuring controlled execution through governance invariants, evolved into a Proof-Carrying Agentic Execution Platform with capabilities such as Agent Gateway, A2A Interop, Reasoning Proof Engine, Governed Memory Vault, Agent Identity Registry, MirrorEval + Reasoning Verification, Self-Optimization Engine, Signal Mesh + Knowledge Graph, and Governed Security Agents.
- **Continuum Conversational AI Interface:** Claude-style governed AI chat at `/nexus`, MCP Hub at `/mcp-hub`, and Agentic RAG at `/agentic-rag`.
- **Alloy Agentic RAG Platform (`@szl/alloy-agentic-rag`):** Unified agentic retrieval-augmented generation layer wired across all SZL products.
- **Hugging Face Unified Ecosystem:** First-class Hugging Face integration for model/dataset/space search, inference, and token management.
- **AI Provenance & Explainability Contract:** Every AI-generated output carries a `ProvenanceEnvelope` with metadata.

**Key Technical Implementations:**
- **Red-Team Game Day Engine:** For live competitive crisis simulations.
- **Cross-Domain Signal Bus (Alert Bus):** "When/then" automation engine.
- **Outbound Gateway:** Unified omni-channel notification layer.
- **Amaru — Convergent Reverse-ETL:** A visual no-code Reverse-ETL system.
- **@workspace/codex-kernel — Replay-Grade Governed Loop Kernel:** Implements hash-chained state, decision receipts, and an append-only proof ledger with tamper-evident digests.
- **Continuum Core Packages:** Includes contracts, agent core, workflow runtime, retrieval core, memory fabric, evidence ledger, and policy guard.
- **Multi-Agent Crew System:** Supports specialized agent roles with plan decomposition.
- **Trust Score Engine:** A graduated autonomy system.
- **Fine-Tuned Model Router:** Domain-aware model routing with fallback chains.
- **Offline-First Sync (Mobile):** For mobile applications with local cache and conflict resolution.
- **Unified Auth Mesh:** Backend-only authentication unification layer.
- **Forecast & Anomaly Fabric:** Unified forecasting and anomaly detection services.
- **Advanced Cybersecurity Modules:** Including DARPA MTO Innovation Hub, Post-Quantum Cryptography Readiness, and Adversarial ML Defense Console.
- **Continuum ARGO — Field Intelligence Forge:** Fuses external signals with defensive doctrines.
- **Continuum Aerial Twin & Mythos Layer:** Doctrine hubs for digital-twin and defensive architecture.
- **Mythos Doctrine Governance (DB-backed):** Doctrine governance pages wired to PostgreSQL tables.
- **Continuum Observability AI Layer:** Advanced ML-driven observability pages for forecasting, causal root-cause analysis, and self-healing.
- **Alloy WorkGraph — Governed Workspace Intelligence Layer (`/alloy/workgraph`, `/alloy/workspace/*`):** A full semantic workspace intelligence layer with Explorer & Answer Engine, Skills Studio, Project Memory, and Admin Control Center.
- **OS-Layer API (`/api/v1/os/*`):** Live API endpoints for Decision Center data backed by PostgreSQL tables.
- **Shared Reverse Proxy & Security Headers:** Ensures consistent platform routing and security policies.
- **Scheduled Job Run History Persistence:** Stores per-execution records for all scheduled jobs.
- **Cognitive Reflexivity Engine:** A self-observing, self-improving governed cognition layer that closes the loop from telemetry to self-model adaptation.
- **Ouroboros Integrations & Lambda Engine:** Unified 9-axis Lutar Invariant pipeline orchestrated by A11oy. Includes Adaptive Depth Routing.
- **A11oy Orchestrator:** The unified control plane for guard decisions, Lambda Engine, and model routing.
- **Convergence Pulse:** Real-time Lambda-9 trust heartbeat.
- **Sovereign Engine v22-44 (XI-COMPLETE):** All 44 SZL original innovations fully operational in TypeScript, including A11oy Propeller Drive (APD), SOTA Agentic Router (SAR), Language Arbitrage Engine (LAE, A_lang formula), PagedAttention KV Cache (PKC), Ultra Router with Speculative Decoding (URS), and Xi Unification Invariant with Multi-Agent Council (XUC -- Xi = L_Omega * P_Lambda * sigmoid(A_lang) * 1/(1+H_dialog), 7-agent handoff roster, council deliberation).
- **Ouroboros Thesis Papers:** Eleven Zenodo-archived papers (v1–v11) covering the Ouroboros Thesis, the v2 empirical companion, the Lutar Invariant (v3), the Lutar Omega Formalism with EPR-Bell diagnostics (v4), Prisca-GraphRAG with Tawa SAE (v5), Hermetic Constitutional Guardrails with Chinchilla-Lutar scaling (v6), Sefirot Continual Learning with Hopfield-Amaru retrieval (v7), Free-Energy Active Inference (v8), the unified-operational paper (v9), the exhaustive-audit paper (v10), and Applied Λ — Measured Per-Request Overhead of the Audit-Closure Operator (v11). Concept DOI 10.5281/zenodo.19944926. The runtime innovations A11oy Propeller Drive (APD, innovation 39) and Ultra Router with Speculative Decoding (URS, innovation 43) are code subsystems in `packages/ouroboros-integrations`, not separate papers.
- **Ouroboros 9-Axis Invariant:** Formal Lutar Invariant with 9 axes: Cleanliness, Horizon, Resonance, Frustum, Gauss closure, Invariance, Moral, Being, Non-measurability.
- **SIGIL — SZL Integrated Governance & Invariant Layer:** A runtime trust framework composing four independent runtime axes (Provenance, Containment, Coherence, Convergence) through a closed-form weighted geometric mean.
- **Ouroboros Guardrails:** A drop-in NeMo Guardrails replacement with Colang-compatible config, emitting a formal 9-axis Lambda-9 Lutar Invariant score and a tamper-evident hash-chained receipt.

**Canonical Identity & Source of Truth:**
The single source of truth for canonical metrics, vertical names, and slugs is `SOURCE_OF_TRUTH.md` at the repo root, backed by the machine-readable `audit/source-of-truth.json`.

**AI Governance Rules:**
1. Every AI call must produce a `ProvenanceEnvelope`.
2. Every AI call must emit minimum `alloy.model_request_sent` and `alloy.model_response_received` audit events.
3. PII must be redacted before any input leaves the platform.
4. Hidden reasoning ("thinking" content) must be stripped from any output returned to callers and from any log line.
5. High-risk actions require human-in-the-loop approval.
6. Per-request and daily budget caps are enforced with hard cutoff.
7. No model weights are hosted in this repo; all inference is remote.
8. No secrets are committed; all credentials flow through environment variables.

**Model & Endpoint Policy:**
- **Primary governed model:** Qwen 3.6-27B Reasoning (`Qwen/Qwen3-27B`).
- **Endpoint plane:** Hugging Face Inference Endpoint, OpenAI-compatible transport.
- **Gateway adapter:** `lib/ai-engine/src/alloy-model-gateway.ts` (`AlloyModelGateway`) as the single sanctioned path to the Qwen endpoint.

**Python Substrate Engine:**
- **Package:** `lib/a11oy-fabric-py/` — A11oy Fabric Python substrate engine.
- **PCPR:** Proof-Carrying Pack Runs — sha256 hash-chained proof artifacts alongside every report.

## External Dependencies
- **Database:** PostgreSQL
- **Authentication:** Replit Auth
- **Payment Processing:** Stripe
- **AI Providers:** OpenAI, Anthropic, Gemini, HuggingFace Inference API, Elevenlabs, Substrate/oLLM
- **Governed Compute:** HuggingFace Jobs (GPU/CPU compute backend for agent workloads).
- **Communication:** Slack, Twilio, Resend, SendGrid
- **Maritime Data:** MarineTraffic, AISHub, Digitraffic AIS, BarentsWatch AIS, Open-Meteo Marine Weather
- **Threat Intelligence:** STIX/TAXII, AlienVault OTX, MISP OSINT, OFAC SDN, Shodan, GreyNoise, MalwareBazaar
- **Government Data:** CISA KEV, NVD CVE, MITRE ATT&CK, Census/BLS, FEMA NRI, NYC Open Data, SEC EDGAR
- **Legal Data:** CourtListener REST API
- **Other APIs/Services:** GitHub API, Figma, Google APIs, HubSpot