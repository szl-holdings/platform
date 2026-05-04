# SZL Holdings Platform

## Overview
SZL Holdings provides FORGE, a governed operational intelligence platform for regulated enterprises. Its core product, Alloy, functions as a unified enterprise AI hub, integrating all products, agents, models, datasets, and governance records within the SZL ecosystem. The platform offers a controlled, auditable environment for AI applications, focusing on decision intelligence and operational oversight in highly regulated sectors. Key capabilities include Governed Workflow Orchestration, Maritime Intelligence, a Sovereign Execution Lab, the Continuum Business Observability Fabric, and OMNIA for Unified Portfolio Intelligence. The project aims to achieve market leadership in AI-driven operational intelligence for regulated industries.

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

**UI/UX and Design System:** The Governed-Intelligence Design Language v3 provides a single source of truth for visual design. All product surfaces now use a unified dark theme aligned to A11oy's design language: #0a0a0a background, gold #c9b787 primary accent, #0e0e0e/#121212/#141414 surface layers, #f5f5f5 primary text, #8a8a8a subtle text, #5a8a6e success, #b85450 error, #d4a853 warning. Typography: Space Grotesk display, Inter body, JetBrains Mono system text. Design inspired by Lambda.ai (bold monospace labels, minimal hero), Anthropic (editorial density), and OpenAI (product card grids).

**API Layers:** The platform offers REST API, GraphQL API (Apollo Server), and an MCP Gateway. An OS-Layer API (`/api/v1/os/*`) provides live data for Decision Center.

**Zero-Trust Authentication:** Implements passwordless magic-link authentication, device fingerprinting, adaptive risk scoring, progressive brute-force protection, session management API, and security event audit logging.

**AI Infrastructure:** Features a multi-provider AI backend, AI evaluation infrastructure, AI Ops Dashboard, NVIDIA-Ready Packages, and Substrate Edge Inference.
- **Forge – AI Runtime, Agent Factory & Promotion Pipeline:** Manages the governed lifecycle of AI agents.
- **Precision Evolution Runtime (PER):** A governed, evidence-gated system for continuously evolving agent policies.
- **PRAXIS – Unified Agentic AI Layer:** An internal tooling sandbox for AI agent research, memory management, skill registry, and AI Control Plane features.
- **Continuum — Business Observability Fabric (formerly Alloy):** A governed, agentic execution fabric ensuring controlled execution through governance invariants, evolved into a Proof-Carrying Agentic Execution Platform with capabilities such as Agent Gateway, A2A Interop, Reasoning Proof Engine, Governed Memory Vault, Agent Identity Registry, MirrorEval + Reasoning Verification, Self-Optimization Engine, Signal Mesh + Knowledge Graph, and Governed Security Agents. Fully operational integration layer includes: Substrate Worker Bridge (`substrate-worker-bridge.ts`) for TS→Python worker dispatch with fail-closed live-mode safety; Model Registry (`model-registry.ts`) with 10 seed models and HF live routing gates (5-condition check); Control Tower wired to live APIs for fabric layers, verticals, worker bridge status, and model router state; Fabric API write stubs replaced with runtime delegates for action approve/execute and workcell run.
- **Continuum Conversational AI Interface:** Claude-style governed AI chat at `/nexus`, MCP Hub at `/mcp-hub`, and Agentic RAG at `/agentic-rag` with multi-step retrieval pipeline and knowledge collections.
- **Alloy Hub (`/a11oy/hub`):** Flagship enterprise AI hub with fleet exploration, model foundry, governance evidence stream, and three-tier pricing.
- **Alloy Agentic RAG Platform (`@szl/alloy-agentic-rag`):** Unified agentic retrieval-augmented generation layer across all SZL products. Key capabilities include dual planner modes (ReAct, CoT-decompose), three MCP server classes, specialist agents, two-tier memory, evidence merging, and AggregatorTrace instrumentation.
- **Hugging Face Unified Ecosystem:** First-class Hugging Face integration for model/dataset/space search, inference, and token management.
- **AI Provenance & Explainability Contract:** Every AI-generated output carries a `ProvenanceEnvelope` with metadata.
- **Ouroboros Guardrails:** A NeMo Guardrails replacement emitting a formal 9-axis Lambda-9 Lutar Invariant score and a tamper-evident hash-chained receipt for every decision.
- **Sovereign AI Hub:** A HuggingFace-inspired AI Operations Console within Conduit (Amaru).

**Key Technical Implementations:**
- **Amaru — Convergent Reverse-ETL:** A production-grade Reverse-ETL system with a real sync engine and connector framework supporting various sources and destinations.
- **Continuum Core Packages:** Includes contracts, agent core, workflow runtime, retrieval core, memory fabric, evidence ledger, and policy guard.
- **Trust Score Engine:** A graduated autonomy system.
- **Fine-Tuned Model Router:** Domain-aware model routing with fallback chains.
- **Advanced Cybersecurity Modules:** Including DARPA MTO Innovation Hub, Post-Quantum Cryptography Readiness, and Adversarial ML Defense Console.
- **Sentra Domain CRUD API (`/api/sentra/*`):** Provides in-memory map-based stores for various security and compliance domains.
- **Continuum ARGO — Field Intelligence Forge:** Fuses external signals with defensive doctrines.
- **Continuum Observability AI Layer:** Advanced ML-driven observability pages for forecasting, causal root-cause analysis, and self-healing.
- **Alloy WorkGraph — Governed Workspace Intelligence Layer (`/alloy/workgraph`):** A full semantic workspace intelligence layer with Explorer & Answer Engine, Skills Studio, and Project Memory.
- **OS-Layer API (`/api/v1/os/*`):** Live API endpoints for Decision Center data backed by PostgreSQL tables.
- **Cognitive Reflexivity Engine:** A self-observing, self-improving governed cognition layer for strategy adaptation and self-model updates.
- **Ouroboros Integrations & Lambda Engine:** Unified 9-axis Lutar Invariant pipeline orchestrated by A11oy.
- **A11oy Orchestrator:** The unified control plane for guard decisions, Lambda Engine execution, and model routing.
- **Convergence Pulse:** Real-time Lambda-9 trust heartbeat.
- **Sovereign Engine v22-44 (XI-COMPLETE):** All 44 SZL original innovations fully operational in TypeScript.
- **Ouroboros 9-Axis Invariant:** Formal Lutar Invariant with 9 axes.
- **SIGIL — SZL Integrated Governance & Invariant Layer:** A runtime trust framework composing four independent runtime axes.
- **Sovereign AI Hub:** A HuggingFace-inspired AI Operations Console within Conduit (Amaru).
- **Sentra — Live Threat Intel & ML Scoring:** New API route groups for threat feeds, ML inference heads, and A11oy tool registry.
- **Sentra Mobile Command Views (`/sentra/mobile/*`):** Dedicated mobile-optimized command views within the Sentra web artifact (`artifacts/sentra/src/pages/mobile/`). Bottom tab navigation for SOC overview, incident triage, agent mesh health, PQC readiness, and threat hunt feed. All views integrate the real Ouroboros formulas via `ouroboros-compute.ts`: Lutar Invariant Λ = C^(1/4)·H^(1/4)·R^(1/4)·F^(1/4) with zero-pinning axiom, Kuramoto coherence r = |1/N Σ e^(iθ_k)| for fleet phase-lock, impedance Z = √(b²/max(1,s)) per runtime, Q-factor = W_useful/W_lost, Egyptian Frustum V = h/3(a²+ab+b²) for blast radius, and SIGIL Σ composition via POST /api/sigil/compose. Each view derives its 4 Lutar axes from domain-specific data and shows ADR routing tier (workhorse ≥0.85, mid ≥0.65, frontier <0.65). Routes: `/mobile` (SOC), `/mobile/triage`, `/mobile/mesh`, `/mobile/intel` (PQC), `/mobile/hunt`.
- **Sovereign Agent Mesh:** Governed micro-agent swarms with trust-scored field agents, crew composition, MCP-based agent discovery, and proof-carrying inter-agent communication. Types in `@szl/a11oy-runtime/types/sovereign-mesh`, seed data in `@szl/a11oy-runtime/data`, API at `/api/sovereign-mesh/*` (GET public, POST/PATCH auth-gated), UI in A11oy Agent Mesh page sovereign tab.
- **Governance-Injecting MCP Gateway:** External agent access (Claude Desktop, Cursor, VS Code Copilot, Codex) with PCE Gate enforcement and proof packets. API at `/api/mcp-governed-gateway/*` (GET public, POST mutations auth-gated). Features: API key management, per-key rate limiting (sliding window), risk classification via PCE Gate, approval routing (high/critical risk → operator/board tier), sha256 hash-chained proof packets per interaction, connection tracking, connect instructions for external MCP clients. Route file: `artifacts/api-server/src/routes/mcp-governed-gateway.ts`. UI: Gateway Monitor tab in A11oy MCP Hub (`artifacts/a11oy/src/pages/McpHub.tsx`) with sub-tabs for Connections, Tool Calls, Approvals, Proof Chain, API Keys, and Connect instructions.

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
- **Governed Compute:** HuggingFace Jobs (GPU/CPU compute backend for agent workloads)
- **Communication:** Slack, Twilio, Resend, SendGrid
- **Maritime Data:** MarineTraffic, AISHub, Digitraffic AIS, BarentsWatch AIS, Open-Meteo Marine Weather
- **Threat Intelligence:** STIX/TAXII, AlienVault OTX, MISP OSINT, OFAC SDN, Shodan, GreyNoise, MalwareBazaar, NVD CVE, MITRE ATT&CK, CISA KEV
- **Government Data:** Census/BLS, FEMA NRI, NYC Open Data, SEC EDGAR
- **Legal Data:** CourtListener REST API
- **Other APIs/Services:** GitHub API, Figma, Google APIs, HubSpot
- **Government Data:** Empire APEX Accelerator, NIST AI RMF, DoD Responsible AI, GSAR 552.239-7001

## Platform Status (as of May 2026)

**Active Artifacts (all rendering, themed, operational):**
| Artifact | Path | Status |
|----------|------|--------|
| A11oy — Brand Orchestration Layer | `/a11oy` | Live — flagship landing + governed OS |
| Amaru (Conduit) — Convergent Reverse-ETL | `/conduit` | Live — dashboard + sovereign AI hub |
| Sentra — Cyber Resilience Command | `/sentra` | Live — SOC ops + 80+ modules |
| Counsel — Legal Matter Command | `/counsel` | Live — matter management |
| Terra — Real Estate Intelligence | `/terra` | Live — distressed property engine |
| Vessels — Maritime Intelligence | `/vessels` | Live — fleet tracking (214 vessels) |
| Carlota Jo — Private Advisory | `/carlota-jo` | Live — premium service brand |
| API Server | `/api` | Healthy — all 6 services OK |

**Backend Services:** Database (PostgreSQL), Job Queue, Auth, AI, Storage — all operational.
**Design System:** Unified dark theme (#0a0a0a bg, #c9b787 gold) across all surfaces.
**Deployment:** Ready for publish via Replit Deployments.