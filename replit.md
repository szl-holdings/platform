# SZL Holdings Platform

## Overview
SZL Holdings offers FORGE, a governed operational intelligence platform for regulated enterprises. The platform includes A11oy, a governed execution fabric where enterprise signals, agents, tools, people, policies, and proof operate as one controlled system. A11oy is a fully-rendered web application with 19 product surfaces, including the Sovereign Execution Lab.

The platform provides a comprehensive solution for decision intelligence and operational oversight in highly regulated environments, with strong market potential in sectors requiring stringent compliance and auditable AI applications. It is a pnpm monorepo supporting web and mobile applications, an API, and a design system, focusing on Governed Workflow Orchestration and Maritime Intelligence, with specialized extensions built upon its governed foundation.

Key capabilities include:
- **A11oy Phase 3 (Sovereign Execution Lab):** Model Router, MirrorEval 2.0, Workcell Replay, Connector Firewall, Twin Foundry, Skill Library, Boardroom Mode, Trust Center, Investor Demo, and Sovereign landing.
- **A11oy Agentic Layer (Phase 4):** Agent Orchestration (multi-agent registry, handoff protocol, guardrail registry, realtime voice), Agent Mesh (universal agentic harness — Codex, Cursor, Claude Code, Devin, Copilot, Windsurf, Replit Agent, v0, Perplexity, LangGraph, CrewAI, MCP — 17 external agents governed by proof chain), Agent Visualization (execution trace waterfall, live topology graph, run monitoring), a11oy SDK (developer platform with 25 primitives, 8 tool types, evals framework [4 grader types, 8 eval suites, 12314 tests], fine-tuning pipeline [9 models incl. DPO/RFT/Vision], skills registry [20 skills], MCP server registry [20 servers, 132 tools], 80 guides, 50 API endpoints, **102 cookbook recipes** [absorbing entire OpenAI Cookbook + HuggingFace Hub — Agents SDK, Responses API, Evals, Fine-Tuning, Realtime/Voice, Multimodal, RAG/Search, Embeddings, Vector DBs (Pinecone/Qdrant/Weaviate/Redis/Elasticsearch/MongoDB/Supabase), Codex, MCP, Deep Research, Structured Output, Guardrails, Prompt Engineering, Optimization, Open Models (DeepSeek-V4-Pro, Gemma-4-31B, Qwen3.6-35B, KIMI-K2.5, LLaMA), Function Calling, HuggingFace Hub — all rebranded as a11oy-governed Python code]), and a11oy Code (terminal-native governed coding agent). Navigation section: AGENTIC (5 pages).
- **A11oy Substrate Engine:** Python CLI for generating vertical artifact JSON files.
- **Publication Palette (2026 rebrand):** Pure dark theme with a single warm accent.
- **Multimodal Experience & Trust Proof (Task #3561):** Includes multilingual voice, wake-word detection, offline-first sync banner for mobile, CRDT live collaboration, digital twin simulator, NEXUS graph hop traversal, chaos engineering drills, federated learning config, multi-fund tenancy views, and PDF export for Aegis.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
The platform is a pnpm monorepo built with TypeScript 5.9, React 19, Vite, and Node.js, employing a micro-frontend architecture for web applications. It has evolved into the FORGE Execution and Evidence Platform (AEEP).

**Core Architectural Primitives:**
- **FORGE Execution Fabric:** Human-in-the-loop governance, Outcome Graph, Proof Chain, and Covenant Policy.
- **Sovereign Execution Substrate:** Durable, governed, and replayable runtime for orchestration and policy enforcement.
- **Workflow Engine:** Orchestrates durable business processes.
- **Event Fabric (PRISM Bus):** Cross-domain event bus.
- **Monte Carlo:** Decision simulation for probabilistic risk assessment.
- **SZL Foundation – Trace Graph:** Canonical trace layer for agent runs and workflow steps.
- **ATLAS Enterprise State Model:** Shared entity vocabulary and event taxonomy.
- **Living Signal Mesh & Evidence Graph:** Unifies event/signal handling with a 9-stage pipeline and `EvidenceStore`.
- **Memory Fabric & FORGE Runtime:** Tiered memory layer with provenance, freshness, retention, and sensitivity tracking.

**Monorepo Structure:** Organizes active/archived artifacts, shared infrastructure, and packages for business observability, AI Control Plane, and NVIDIA-Ready Modules. Drizzle ORM manages PostgreSQL schemas.

**UI/UX and Design System (v2):** Governed-Intelligence Design Language v2 (`@szl-holdings/design-system`) provides the single visual source of truth, defining an enterprise accent palette, typography, spacing, and UI components. All authenticated product surfaces are evidence-first.

**One-of-One Platform Shell:** Unifies user interfaces across applications with shared modules.

**API Layers:** Includes REST API, GraphQL API (Apollo Server), and an MCP Gateway.

**AI Infrastructure:** Multi-provider AI backend, AI evaluation infrastructure, AI Ops Dashboard, and NVIDIA-Ready Packages.

**Forge – AI Runtime, Agent Factory & Promotion Pipeline:** Manages the governed lifecycle of AI agents.

**Precision Evolution Runtime (PER):** Governed, evidence-gated system for continuously evolving agent policies.

**PRAXIS – Unified Agentic AI Layer:** Internal tooling sandbox for AI agent research, memory management, skill registry, and AI Control Plane features.

**Lyte – Decision Intelligence:** Flagship application for executive narratives, signal feeds, and decision centers, using the publication palette.

**AI Provenance & Explainability Contract:** Every AI-generated output carries a `ProvenanceEnvelope` with essential metadata.

**Cross-Domain Signal Bus (Alert Bus):** "When/then" automation engine routing signals across product domains.

**AEEP Core Packages:** Includes contracts, agent core, workflow runtime, retrieval core, memory core, memory fabric, evidence ledger, policy guard, domain profiles, and platform metrics registry, featuring a two-stage retrieval pipeline, multimodal retrieval, and scoped memory management.

**A11oy Agent Runtime:** Governed, agentic execution fabric with modules for Types, Tracing, Memory, Model Router, MirrorEval, Deep Context, Tool Registry, Approved Runner, PCE Gate, Operators, and Workcells. Governance invariants ensure controlled execution.

**Email Deliverability:** All outbound transactional email uses a centralized library with suppression lists and admin routes.

**Mobile Biometric Sign-In:** Real server-side authentication factor with cryptographic proof-of-possession.

**Unified Auth Mesh:** Backend-only authentication unification layer with specific priority order, new database tables, and routes for OAuth and API keys. Custom HS256 JWT is used, and a `meshCallLogger` middleware records request details.

**Forecast & Anomaly Fabric:** Unified forecasting service with calibrated interval outputs, and a unified streaming and batch anomaly detection service. Drift detection for performance against baselines and champion-challenger evaluations.

**OpenAI Agents SDK Bridge:** Wires `@openai/agents@0.0.15` into the SZL observability stack, implementing `TracingProcessor`, `GuardrailAdapter`, `ToolAdapter`, and `AgentAdapter` for governed agent execution.

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