# SZL Holdings Platform

## Overview
SZL Holdings offers FORGE, a governed operational intelligence platform designed for regulated enterprises. Its primary purpose is to provide a controlled environment where enterprise signals, agents, tools, people, policies, and proof operate as a unified system. The platform focuses on decision intelligence and operational oversight, particularly for highly regulated sectors requiring strict compliance and auditable AI applications. Key capabilities include Governed Workflow Orchestration, Maritime Intelligence, a Sovereign Execution Lab, the Continuum Business Observability Fabric, the Continuum Mythos Doctrine for governance, the Continuum Compliance Fabric, the Continuum DARPA Resilience Layer, and OMNIA for Unified Portfolio Intelligence. The platform is designed to support web and mobile applications, an API, and a cohesive design system.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.

## System Architecture
The platform is built as a pnpm monorepo, known as the Continuum Business Observability Fabric, leveraging TypeScript 5.9, React 19, Vite, and Node.js within a micro-frontend architecture.

**Core Architectural Principles:**
- **FORGE Execution Fabric:** Incorporates Human-in-the-loop governance, Outcome Graph, Proof Chain, and Covenant Policy for controlled execution.
- **Sovereign Execution Substrate:** Ensures durable, governed, and replayable runtime for orchestration and policy enforcement.
- **Workflow Engine:** Orchestrates durable business processes.
- **Event Fabric (PRISM Bus):** A cross-domain event bus for seamless communication.
- **SZL Foundation – Trace Graph:** The canonical trace layer for all agent runs and workflow steps.
- **ATLAS Enterprise State Model:** Defines a shared entity vocabulary and event taxonomy.
- **Living Signal Mesh & Evidence Graph:** Unifies event/signal handling with an `EvidenceStore`.
- **Memory Fabric & FORGE Runtime:** A tiered memory layer with provenance, freshness, retention, and sensitivity tracking.

**Monorepo Structure:** The monorepo organizes active/archived artifacts, shared infrastructure, and packages for business observability, AI Control Plane, NVIDIA-Ready Modules, and Substrate Edge Inference, utilizing Drizzle ORM for PostgreSQL schemas.

**UI/UX and Design System:** The Governed-Intelligence Design Language v2 (`@szl-holdings/design-system`) serves as the single source of truth for visual design, encompassing accent palette, typography, spacing, and UI components. All authenticated product surfaces are evidence-first, employing a pure dark theme with a single warm accent. A One-of-One Platform Shell unifies user interfaces across applications.

**API Layers:** The platform provides REST API, GraphQL API (Apollo Server), and an MCP Gateway.

**Zero-Trust Authentication:** The API server implements robust security with passwordless magic-link authentication, device fingerprinting, adaptive risk scoring, progressive brute-force protection, session management API, and security event audit logging. Architectural guardrail tests enforce comprehensive authentication coverage.

**AI Infrastructure:** Features a multi-provider AI backend, AI evaluation infrastructure, AI Ops Dashboard, NVIDIA-Ready Packages, and Substrate Edge Inference (oLLM).
- **Forge – AI Runtime, Agent Factory & Promotion Pipeline:** Manages the governed lifecycle of AI agents.
- **Precision Evolution Runtime (PER):** A governed, evidence-gated system for continuous agent policy evolution.
- **PRAXIS – Unified Agentic AI Layer:** An internal sandbox for AI agent research, memory management, and skill registry.
- **Continuum – Business Observability Fabric:** A governed, agentic execution fabric ensuring controlled execution through governance invariants, evolving into a Proof-Carrying Agentic Execution Platform with an Agent Gateway, A2A Interop, Reasoning Proof Engine, Governed Memory Vault, and Self-Optimization Engine.
- **Continuum Conversational AI Interface:** Provides Claude-style governed AI chat, an MCP Hub, and Agentic RAG with a multi-step retrieval pipeline.
- **AI Provenance & Explainability Contract:** Ensures every AI-generated output includes a `ProvenanceEnvelope` with essential metadata.

**Key Technical Implementations:**
- **Red-Team Game Day Engine:** For live competitive crisis simulations.
- **Cross-Domain Signal Bus (Alert Bus):** A "When/then" automation engine.
- **Outbound Gateway:** Unified omni-channel notification layer.
- **Amaru — Convergent Reverse-ETL:** A visual no-code Reverse-ETL system.
- **@workspace/ouroboros — Ouroboros Loop Kernel:** A shared TS package for bounded loops with measurable convergence.
- **@workspace/codex-kernel — Replay-Grade Governed Loop Kernel:** Implements hash-chained state, decision receipts, and an append-only proof ledger with tamper-evident digests, crucial for replay verification and auditability. Ships a payload-driven CLI (`pnpm --filter @workspace/codex-kernel codex:run` / `codex:replay`) backed by `runner/payload.json` (the E4 unified loop spec). Writes six deterministic deliverables to `./output/` (trace.jsonl, proof_ledger.jsonl, final_state.json, run_summary.json, decision_receipt.json, final_table_preview.json). Determinism + replay-attestation are enforced by `src/cli/run.test.ts`.
- **Continuum Core Packages:** Includes contracts, agent core, workflow runtime, retrieval core, memory fabric, evidence ledger, and policy guard.
- **Multi-Agent Crew System:** Supports specialized agent roles with plan decomposition.
- **Trust Score Engine:** A graduated autonomy system.
- **Fine-Tuned Model Router:** Domain-aware model routing with fallback chains.
- **Multi-Language Voice Pipeline:** Provides 5-language support for voice interactions.
- **Offline-First Sync (Mobile):** For mobile applications with local cache and conflict resolution.
- **Mobile Biometric Sign-In:** A secure server-side authentication factor.
- **Unified Auth Mesh:** Backend-only authentication unification layer.
- **Forecast & Anomaly Fabric:** Unified forecasting and anomaly detection services.
- **Premium Data Fabric:** Adapter framework for data integration.
- **Predictive Cap Rate Model:** ML-driven cap rate forecasting.
- **Voyage Economics Calculator:** For maritime P&L calculations.
- **Causal Scenario Backtesting & Monte Carlo Simulation Fabric:** For validating predictions and stochastic simulations.
- **OpenAI Agents SDK Bridge:** Integration with OpenAI agents.
- **Advanced Cybersecurity Modules:** Including DARPA MTO Innovation Hub, Post-Quantum Cryptography Readiness, Hardware Root of Trust, and Adversarial ML Defense Console.
- **Continuum ARGO — Field Intelligence Forge:** Fuses external signals with defensive doctrines.
- **Continuum Aerial Twin & Mythos Layer:** Doctrine hubs for digital-twin and defensive architecture.
- **Continuum Observability AI Layer:** Advanced ML-driven observability pages for forecasting, causal root-cause analysis, synthetic metrics, self-healing, AI alert triage, cost-aware monitoring, and observability as code.
- **Shared Reverse Proxy (`packages/shared-proxy`) & Security Headers (`@szl-holdings/security-headers`):** Ensures consistent platform routing and security policies.
- **Scheduled Job Run History Persistence:** Stores per-execution records for all scheduled jobs in a dedicated database table.

## External Dependencies
- **Database:** PostgreSQL
- **Authentication:** Replit Auth
- **Payment Processing:** Stripe
- **AI Providers:** OpenAI, Anthropic, Gemini, HuggingFace Inference API, Elevenlabs, Substrate/oLLM
- **Communication:** Slack, Twilio, Resend, SendGrid
- **Maritime Data:** MarineTraffic, AISHub, Digitraffic AIS, BarentsWatch AIS, Open-Meteo Marine Weather
- **Threat Intelligence:** STIX/TAXII, AlienVault OTX, MISP OSINT, OFAC SDN, EU Consolidated List, Shodan, GreyNoise, MalwareBazaar
- **Government Data:** CISA KEV, NVD CVE, MITRE ATT&CK, Census/BLS, FEMA NRI, NYC Open Data, SEC EDGAR
- **Legal Data:** CourtListener REST API
- **Other APIs/Services:** GitHub API, Figma, Google APIs, HubSpot