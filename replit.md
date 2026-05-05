# SZL Holdings Platform

## Overview
SZL Holdings provides FORGE, a governed operational intelligence platform for regulated enterprises. Its flagship product, Alloy, serves as a unified enterprise AI hub, integrating all products, agents, models, datasets, and governance records within the SZL ecosystem. The platform offers a controlled, auditable environment for AI applications, focusing on decision intelligence and operational oversight in highly regulated sectors. Key capabilities include Governed Workflow Orchestration, Maritime Intelligence, a Sovereign Execution Lab, the Continuum Business Observability Fabric, and OMNIA for Unified Portfolio Intelligence. The project aims to achieve market leadership in AI-driven operational intelligence for regulated industries.

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

**UI/UX and Design System:** The Governed-Intelligence Design Language v3 provides a single source of truth for visual design. All product surfaces use a unified dark theme: #0a0a0a background, gold #c9b787 primary accent, #0e0e0e/#121212/#141414 surface layers, #f5f5f5 primary text, #8a8a8a subtle text, #5a8a6e success, #b85450 error, #d4a853 warning. Typography: Space Grotesk display, Inter body, JetBrains Mono system text.

**API Layers:** The platform offers REST API, GraphQL API (Apollo Server), and an MCP Gateway. An OS-Layer API (`/api/v1/os/*`) provides live data for Decision Center.

**Zero-Trust Authentication:** Implements passwordless magic-link authentication, device fingerprinting, adaptive risk scoring, progressive brute-force protection, session management API, and security event audit logging.

**AI Infrastructure:** Features a multi-provider AI backend, AI evaluation infrastructure, AI Ops Dashboard, NVIDIA-Ready Packages, and Substrate Edge Inference.
- **Forge – AI Runtime, Agent Factory & Promotion Pipeline:** Manages the governed lifecycle of AI agents.
- **Precision Evolution Runtime (PER):** A governed, evidence-gated system for continuously evolving agent policies.
- **NEXUS – Unified Agentic AI Layer:** Consolidated into A11oy under `/nexus/*` routes.
- **Continuum Conversational AI Interface:** Claude-style governed AI chat at `/nexus`, MCP Hub at `/mcp-hub`, and Agentic RAG at `/agentic-rag`.
- **Zero-Trust Agent Identity & Model Provenance:** Ed25519 cryptographic identity for every agent and model provenance graph visualizing full lineage.
- **Alloy Hub (`/a11oy/hub`):** Flagship enterprise AI hub with fleet exploration, model foundry, and governance evidence stream.
- **Alloy Agentic RAG Platform (`@szl/alloy-agentic-rag`):** Unified agentic retrieval-augmented generation layer across all SZL products.
- **Hugging Face Unified Ecosystem:** First-class Hugging Face integration for model/dataset/space search, inference, and token management.
- **Ouroboros Guardrails:** A NeMo Guardrails replacement emitting a formal 9-axis Lambda-9 Lutar Invariant score and a tamper-evident hash-chained receipt for every decision.
- **Sovereign AI Hub:** A HuggingFace-inspired AI Operations Console within Conduit (Amaru).

**Key Technical Implementations:**
- **Amaru — Convergent Reverse-ETL:** A production-grade Reverse-ETL system with a real sync engine and connector framework.
- **Trust Score Engine:** A graduated autonomy system.
- **Fine-Tuned Model Router:** Domain-aware model routing with fallback chains.
- **Zero-Trust Agent Identity & Model Provenance:** DID registry with software-encrypted key custody and hybrid Ed25519 + ML-DSA-65 signatures for audit chain events.
- **Cyber Payload Standard (CPS):** A signed, versioned automation package format with five execution sections: detect/decide/act/approve/recover, featuring maturity modes, tiered approval gates, and cryptographic proof bundle generation.
- **Advanced Cybersecurity Modules:** Including DARPA MTO Innovation Hub, Post-Quantum Cryptography Readiness, Hardware Root of Trust, and Adversarial ML Defense Console.
- **Continuum ARGO — Field Intelligence Forge:** Fuses external signals with defensive doctrines.
- **Continuum Observability AI Layer:** Advanced ML-driven observability pages for forecasting, causal root-cause analysis, and self-healing.
- **Alloy WorkGraph — Governed Workspace Intelligence Layer (`/alloy/workgraph`):** A full semantic workspace intelligence layer with Explorer & Answer Engine, Skills Studio, and Project Memory.
- **Sovereign Agent Mesh:** Governed micro-agent swarms with trust-scored field agents, crew composition, MCP-based agent discovery, and proof-carrying inter-agent communication.
- **Governance-Injecting MCP Gateway:** External agent access with PCE Gate enforcement and proof packets.
- **Post-Quantum Identity & Governance Gateway (`lib/pqc-identity/`):** Hybrid signing (Ed25519 + ML-DSA-65), DID-based identity, self-rooted PKI/CA with certificate transparency Merkle log, and cryptographic identity for MCP gateway responses.

**AI Governance Rules:** Every AI call must produce a `ProvenanceEnvelope`, emit audit events, redact PII, strip hidden reasoning, enforce human-in-the-loop for high-risk actions, apply budget caps, and use remote inference with environment variable-based credentials.

**Claude Code Doctrine:** Defines AI agent behavior with typed skills, a hook system for lifecycle events, subagent contracts, trust tiers, tiered memory, plan locks for side-effecting tools, OpenTelemetry GenAI semantics, OPA/Rego for policy enforcement, and a reward-hacking watchdog.

**Model & Endpoint Policy:** The primary governed model is Qwen 3.6-27B Reasoning (`Qwen/Qwen3-27B`) on a Hugging Face Inference Endpoint with an OpenAI-compatible transport, accessed via `AlloyModelGateway`.

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
- **Government Data:** NYSTEC Pre-briefing, Empire APEX Accelerator, NIST AI RMF, DoD Responsible AI, GSAR 552.239-7001