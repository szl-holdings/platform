# SZL Holdings Platform

## Overview
SZL Holdings provides FORGE, a governed operational intelligence platform for regulated enterprises. Its core product, Alloy (A11oy), functions as a unified enterprise AI hub, integrating all products, agents, models, datasets, and governance records within the SZL ecosystem. The platform offers a controlled, auditable environment for AI applications, focusing on decision intelligence and operational oversight in highly regulated sectors. Key capabilities include Governed Workflow Orchestration, Maritime Intelligence, a Sovereign Execution Lab, the Continuum Business Observability Fabric, and OMNIA for Unified Portfolio Intelligence. The project aims to achieve market leadership in AI-driven operational intelligence for regulated industries.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.

## System Architecture
The platform is a pnpm monorepo using TypeScript 5.9, React 19, Vite, and Node.js, structured with a micro-frontend architecture called the Continuum Business Observability Fabric.

**Core Architectural Principles:**
- **FORGE Execution Fabric:** Incorporates Human-in-the-loop governance, Outcome Graph, Proof Chain, and Covenant Policy.
- **Sovereign Execution Substrate:** Ensures durable, governed, and replayable runtime for orchestration and policy enforcement.
- **Event Fabric (PRISM Bus):** A cross-domain event bus for seamless communication.
- **SZL Foundation – Trace Graph:** Canonical trace layer for agent runs and workflow steps.
- **ATLAS Enterprise State Model:** Defines a shared entity vocabulary and event taxonomy.
- **Living Signal Mesh & Evidence Graph:** Unifies event/signal handling with an `EvidenceStore`.
- **Memory Fabric & FORGE Runtime:** Tiered memory layer with provenance, freshness, retention, and sensitivity tracking.
- **Cognitive Reflexivity Engine:** A self-observing, self-improving governed cognition layer that integrates dialectical reasoning and strategy application to enhance AI decision-making.
- **Ouroboros Loop Kernel:** Shared TS package for bounded loops with measurable convergence and replay-grade governed execution, using hash-chained state and an append-only proof ledger.
- **Continuum Business Observability Fabric:** A governed, agentic execution fabric ensuring controlled execution through governance invariants, evolving into a Proof-Carrying Agentic Execution Platform.
- **SIGIL (SZL Integrated Governance & Invariant Layer):** A runtime trust framework composing four independent runtime axes (Provenance, Containment, Coherence, Convergence) through a closed-form weighted geometric mean for verifiable and monotonic trust scores.

**UI/UX and Design System:** The Governed-Intelligence Design Language v3 provides a single source of truth for visual design. All product surfaces use a unified dark theme (#0a0a0a background, gold #c9b787 primary accent, #0e0e0e/#121212/#141414 surface layers, #f5f5f5 primary text, #8a8a8a subtle text, #5a8a6e success, #b85450 error, #d4a853 warning). Typography: Space Grotesk display, Inter body, JetBrains Mono system text.

**API Layers:** The platform offers REST API, GraphQL API (Apollo Server), and an MCP Gateway. An OS-Layer API (`/api/v1/os/*`) provides live data for Decision Center.

**Zero-Trust Authentication:** Implements passwordless magic-link authentication, device fingerprinting, adaptive risk scoring, progressive brute-force protection, session management API, and security event audit logging.

**AI Infrastructure:** Features a multi-provider AI backend, AI evaluation infrastructure, AI Ops Dashboard, NVIDIA-Ready Packages, and Substrate Edge Inference.
- **Forge – AI Runtime, Agent Factory & Promotion Pipeline:** Manages the governed lifecycle of AI agents.
- **Precision Evolution Runtime (PER):** A governed, evidence-gated system for continuously evolving agent policies.
- **NEXUS – Unified Agentic AI Layer (in A11oy):** Consolidated into A11oy under `/nexus/*` routes for Research, Memory, Skills, Orchestrator, and Home.
- **Continuum — Business Observability Fabric:** A governed, agentic execution fabric with Agent Gateway, A2A Interop, Reasoning Proof Engine, Governed Memory Vault, Agent Identity Registry, MirrorEval + Reasoning Verification, Self-Optimization Engine, Signal Mesh + Knowledge Graph, Governed Security Agents, and Zero-Trust Agent Identity + Model Provenance Graph.
- **Continuum Conversational AI Interface:** Claude-style governed AI chat at `/nexus`, MCP Hub at `/mcp-hub`, and Agentic RAG at `/agentic-rag`.
- **Zero-Trust Agent Identity & Model Provenance:** Ed25519 cryptographic identity for every agent (public key, fingerprint, capability certificates, attestation status). Identity-aware HuggingFace client with access audit logging. Model Provenance Graph (`/a11oy/model-provenance`) visualizes full lineage. Agent reputation scoring based on deployment success, governance compliance, and cost efficiency.
- **Alloy Hub (`/a11oy/hub`):** Flagship enterprise AI hub with fleet exploration, model foundry, governance evidence stream, and three-tier pricing.
- **Alloy Agentic RAG Platform (`@szl/alloy-agentic-rag`):** Unified agentic retrieval-augmented generation layer across all SZL products.
- **Hugging Face Unified Ecosystem:** First-class Hugging Face integration for model/dataset/space search, inference, and token management.
- **HF Hub Bridge — Governed Agent-Native Hub Operations:** PCE-gated HuggingFace Hub operations with risk classification, cost metering, and provenance tracking.
- **AI Provenance & Explainability Contract:** Every AI-generated output carries a `ProvenanceEnvelope` with metadata.
- **Ouroboros Guardrails:** A NeMo Guardrails replacement emitting a formal 9-axis Lambda-9 Lutar Invariant score and a tamper-evident hash-chained receipt for every decision.
- **Sovereign AI Hub:** A HuggingFace-inspired AI Operations Console within Conduit (Amaru).

**Key Technical Implementations:**
- **Amaru — Convergent Reverse-ETL:** A production-grade Reverse-ETL system with a real sync engine and connector framework.
- **Continuum Core Packages:** Includes contracts, agent core, workflow runtime, retrieval core, memory fabric, evidence ledger, and policy guard.
- **Trust Score Engine:** A graduated autonomy system.
- **Fine-Tuned Model Router:** Domain-aware model routing with fallback chains.
- **Unified Auth Mesh:** Backend-only authentication unification layer.
- **Forecast & Anomaly Fabric:** Unified forecasting and anomaly detection services.
- **Premium Data Fabric:** Adapter framework for data integration.
- **CPS (Cyber Payload Standard):** A signed, versioned automation package format with five execution sections: detect/decide/act/approve/recover, featuring maturity modes, tiered approval gates, governance enforcement, and cryptographic proof bundle generation.
- **Sentra Domain CRUD API (`/api/sentra/*`):** Provides in-memory map-based stores for various security and compliance domains.
- **Advanced Cybersecurity Modules:** Including DARPA MTO Innovation Hub, Post-Quantum Cryptography Readiness, Hardware Root of Trust, and Adversarial ML Defense Console.
- **Continuum ARGO — Field Intelligence Forge:** Fuses external signals with defensive doctrines.
- **Continuum Observability AI Layer:** Advanced ML-driven observability pages for forecasting, causal root-cause analysis, and self-healing.
- **Alloy WorkGraph — Governed Workspace Intelligence Layer (`/alloy/workgraph`):** A full semantic workspace intelligence layer with Explorer & Answer Engine, Skills Studio, and Project Memory.
- **OS-Layer API (`/api/v1/os/*`):** Live API endpoints for Decision Center data backed by PostgreSQL tables.
- **A11oy Orchestrator:** The unified control plane for guard decisions, Lambda Engine execution, and model routing.
- **Sovereign Agent Mesh:** Governed micro-agent swarms with trust-scored field agents, crew composition, MCP-based agent discovery, and proof-carrying inter-agent communication.
- **Governance-Injecting MCP Gateway:** External agent access with PCE Gate enforcement and proof packets.
- **Post-Quantum Identity & Governance Gateway (`lib/pqc-identity/`):** Hybrid signing (Ed25519 + ML-DSA-65), DID-based identity, self-rooted PKI/CA with certificate transparency Merkle log, cryptographic identity for MCP gateway responses, and public verification API at `/api/pqc/*`.
- **Machine/Agent Identity + Hybrid-Signed Audit Chain:** A `did:plat:*` DID registry with a Software-Encrypted Key Custody service. Every new `audit_chain_events` row carries a hybrid Ed25519 + ML-DSA-65 signature bound to the signing DID.

**Canonical Identity & Source of Truth:**
The single source of truth for canonical metrics, vertical names, and slugs is `SOURCE_OF_TRUTH.md` at the repo root, backed by the machine-readable `audit/source-of-truth.json`.

**AI Governance Rules:**
1. Every AI call must produce a `ProvenanceEnvelope`.
2. Every AI call must emit minimum `alloy.model_request_sent` and `alloy.model_request_received` audit events.
3. PII must be redacted before any input leaves the platform.
4. Hidden reasoning ("thinking" content) must be stripped from any output returned to callers and from any log line.
5. High-risk actions require human-in-the-loop approval.
6. Per-request and daily budget caps are enforced with hard cutoff.
7. No model weights are hosted in this repo; all inference is remote.
8. No secrets are committed; all credentials flow through environment variables.

**Claude Code Doctrine:**
- **Skills v2:** All skills declare `scope`, `trust_tier_required`, `input_schema`, `output_schema`, `hooks_emitted`, `memory_tier` fields.
- **Hook System:** Lifecycle events with JSON decision contracts (`allow | block | modify | route`).
- **SubagentContract:** Every spawned subagent must declare `model`, `allowed_tools`, `blocked_tools`, `permission_mode`, `trust_tier`, `parent_proof_id`, `session_id`.
- **Trust Tier Ladder:** 0=Read-only, 1=Plan-only, 2=Auto-approve-low-risk, 3=HITL-required, 4=Sovereign-air-gapped.
- **Tiered Memory:** Working (ephemeral), Episodic (session-scoped), Semantic (long-term vector).
- **Plan Lock:** Plans must be signed and locked (`planLocked = true`) before side-effecting tools may execute.
- **OTel GenAI:** OpenTelemetry GenAI semantic conventions.
- **OPA/Rego:** Policy bundles per hook.
- **Reward-Hacking Watchdog:** Detects goal substitution, eval gaming, sycophancy, scope creep.

**Model & Endpoint Policy:**
- **Primary governed model:** Qwen 3.6-27B Reasoning (`Qwen/Qwen3-27B`).
- **Endpoint plane:** Hugging Face Inference Endpoint, OpenAI-compatible transport.
- **Gateway adapter:** `lib/ai-engine/src/alloy-model-gateway.ts` (`AlloyModelGateway`) as the single sanctioned path to the Qwen endpoint.

**Python Substrate Engine:** `lib/a11oy-fabric-py/` — A11oy Fabric Python substrate engine with Proof-Carrying Pack Runs.

**Technology Preferences:**
- TypeScript 5.9 / Node 20+ / pnpm workspaces
- React 19 + Vite for web; Expo for mobile
- Drizzle ORM on PostgreSQL (Neon-compatible)
- Hugging Face Inference Endpoints for governed LLM serving (Qwen 3.6-27B primary)
- Shared design system (`@szl-holdings/design-system`)
- Cloudflare for edge / DNS / WAF; Vercel and Replit for app hosting
- GitHub for VCS; CI via GitHub Actions

## External Dependencies
- **Database:** PostgreSQL
- **Authentication:** Replit Auth
- **Payment Processing:** Stripe
- **AI Providers:** OpenAI, Anthropic, Gemini, HuggingFace Inference API, Elevenlabs, Substrate/oLLM
- **Governed Compute:** HuggingFace Jobs
- **Communication:** Slack, Twilio, Resend, SendGrid
- **Maritime Data:** MarineTraffic, AISHub, Digitraffic AIS, BarentsWatch AIS, Open-Meteo Marine Weather
- **Threat Intelligence:** STIX/TAXII, AlienVault OTX, MISP OSINT, OFAC SDN, Shodan, GreyNoise, MalwareBazaar, NVD CVE, MITRE ATT&CK, CISA KEV
- **Government Data:** Census/BLS, FEMA NRI, NYC Open Data, SEC EDGAR
- **Legal Data:** CourtListener REST API
- **Other APIs/Services:** GitHub API, Figma, Google APIs, HubSpot
- **Government Readiness:** NIST AI RMF, DoD Responsible AI, GSAR 552.239-7001