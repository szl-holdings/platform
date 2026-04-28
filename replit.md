# SZL Holdings Platform

## Overview
SZL Holdings offers FORGE, a governed operational intelligence platform designed for regulated enterprises. Its purpose is to provide a governed execution fabric where enterprise signals, agents, tools, people, policies, and proof operate as one controlled system. The platform aims to be a comprehensive solution for decision intelligence and operational oversight, particularly for sectors requiring stringent compliance and auditable AI applications. It supports web and mobile applications, an API, and a design system, with a focus on Governed Workflow Orchestration and Maritime Intelligence. Key capabilities include the Sovereign Execution Lab, the A11oy Agentic Layer, the A11oy Mythos Doctrine for governance, the A11oy Compliance Fabric, the A11oy DARPA Resilience Layer, and OMNIA, a Unified Portfolio Intelligence Layer.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.

## System Architecture
The platform is a pnpm monorepo, known as the FORGE Execution and Evidence Platform (AEEP), built with TypeScript, React, Vite, and Node.js, employing a micro-frontend architecture.

**Core Architectural Primitives:**
- **FORGE Execution Fabric:** Incorporates Human-in-the-loop governance, Outcome Graph, Proof Chain, and Covenant Policy.
- **Sovereign Execution Substrate:** Provides a durable, governed, and replayable runtime for orchestration and policy enforcement.
- **Workflow Engine:** Orchestrates durable business processes.
- **Event Fabric (PRISM Bus):** A cross-domain event bus.
- **SZL Foundation – Trace Graph:** The canonical trace layer for agent runs and workflow steps.
- **ATLAS Enterprise State Model:** A shared entity vocabulary and event taxonomy.
- **Living Signal Mesh & Evidence Graph:** Unifies event/signal handling with an `EvidenceStore`.
- **Memory Fabric & FORGE Runtime:** A tiered memory layer with provenance, freshness, retention, and sensitivity tracking.

**Monorepo Structure:** Organizes active/archived artifacts, shared infrastructure, and packages for business observability, AI Control Plane, NVIDIA-Ready Modules, and Substrate Edge Inference, utilizing Drizzle ORM for PostgreSQL schemas.

**UI/UX and Design System:** The Governed-Intelligence Design Language v2 (`@szl-holdings/design-system`) is the single visual source of truth, defining the enterprise accent palette, typography, spacing, and UI components. All authenticated product surfaces are evidence-first, utilizing a pure dark theme with a single warm accent. The platform uses a One-of-One Platform Shell to unify user interfaces across applications.

**API Layers:** Includes REST API, GraphQL API (Apollo Server), and an MCP Gateway.

**Zero-Trust Auth Hardening:** Implemented on the API server with passwordless magic-link authentication, device fingerprinting, adaptive risk scoring, progressive brute-force protection, session management API, and security event audit logging.

**AI Infrastructure:** Features a multi-provider AI backend, AI evaluation infrastructure, AI Ops Dashboard, NVIDIA-Ready Packages, and Substrate Edge Inference (oLLM).
- **Forge – AI Runtime, Agent Factory & Promotion Pipeline:** Manages the governed lifecycle of AI agents.
- **Precision Evolution Runtime (PER):** A governed, evidence-gated system for continuously evolving agent policies.
- **PRAXIS – Unified Agentic AI Layer:** An internal tooling sandbox for AI agent research, memory management, skill registry, and AI Control Plane features.
- **A11oy Agent Runtime:** A governed, agentic execution fabric ensuring controlled execution through governance invariants, evolved into a Proof-Carrying Agentic Execution Platform with capabilities such as Agent Gateway, A2A Interop, Reasoning Proof Engine, Governed Memory Vault, Agent Identity Registry, MirrorEval + Reasoning Verification, Self-Optimization Engine, Signal Mesh + Knowledge Graph, and Governed Security Agents.
- **a1.1oy — Conversational AI Interface:** Claude-style governed AI chat at `/nexus`, MCP Hub at `/mcp-hub`, and Agentic RAG at `/agentic-rag` with multi-step retrieval pipeline and knowledge collections.
- **AI Provenance & Explainability Contract:** Every AI-generated output carries a `ProvenanceEnvelope` with essential metadata.

**Other Technical Implementations:**
- **Red-Team Game Day Engine:** Live competitive crisis simulation for resilience scoring.
- **Cross-Domain Signal Bus (Alert Bus):** "When/then" automation engine routing signals across product domains.
- **Outbound Gateway:** Unified omni-channel notification layer with pluggable adapters.
- **Conduit — Reverse ETL:** Visual no-code tool for operators to map SZL internal data to third-party SaaS destinations.
- **AEEP Core Packages:** Includes contracts, agent core, workflow runtime, retrieval core, memory core, memory fabric, evidence ledger, policy guard, domain profiles, and platform metrics registry.
- **Multi-Agent Crew System:** Specialized agent roles with plan decomposition and trust-aware execution.
- **Trust Score Engine:** Graduated autonomy system with rolling accuracy tracking and approval routing.
- **Fine-Tuned Model Router:** Domain-aware model routing with fine-tuned model resolution and cascading fallback chains.
- **Multi-Language Voice Pipeline:** 5-language support for auto-detection, transcription, TTS, and voice chat.
- **Offline-First Sync (Mobile):** Mobile offline sync with local cache, background sync queue, and conflict resolution.
- **Mobile Biometric Sign-In:** Real server-side authentication factor with cryptographic proof-of-possession.
- **Unified Auth Mesh:** Backend-only authentication unification layer using custom HS256 JWT.
- **Forecast & Anomaly Fabric:** Unified forecasting service and streaming/batch anomaly detection service.
- **Premium Data Fabric:** Adapter framework with schema mapping, refresh scheduling, cost metering, entity caching, health tracking, and provenance.
- **Predictive Cap Rate Model:** ML-driven cap rate forecasting for Terra.
- **Voyage Economics Calculator:** Full voyage P&L calculator for Vessels.
- **Causal Scenario Backtesting:** Historical event replay validating the Causal Scenario Engine's predictions.
- **Monte Carlo Simulation Fabric:** Configurable stochastic simulation engine.
- **OpenAI Agents SDK Bridge:** Wires `@openai/agents@0.0.15` into the SZL observability stack.
- **DARPA MTO Innovation Hub, Post-Quantum Cryptography Readiness, Hardware Root of Trust, Adversarial ML Defense Console, Cyber Innovation Roadmap, Photonic Inference Tier:** Integrated modules for advanced cybersecurity and resilience.
- **A11oy ARGO — Field Intelligence Forge:** Distillation surface that fuses external signals with defensive doctrines and public research for cybersecurity insights.
- **A11oy Aerial Twin (Site-Specific Wireless Digital-Twin Doctrine):** Doctrine hub distilling public NVIDIA Aerial Digital Twin overview into the SZL ecosystem with operational milestone surfaces.
- **A11oy Mythos Layer (Defensive Architecture Doctrine):** Static doctrine surface codifying the A11oy×Sentra orchestration architecture.
- **A11oy × Sentra Glasswing Command Layer (Risk-as-Reward):** Premium executive command surface synthesizing agent constellations and a "Risk-as-Reward" novelty thesis.
- **A11oy Command Fabric — Universal Intelligence Layer:** Cross-vertical command layer spanning all SZL verticals with interactive data views.
- **A11oy Observability AI Layer:** Seven new advanced ML-driven observability pages under the OBSERVABILITY AI nav group:
  - **Toto Foundation Forecaster** (`/toto-forecaster`): Zero-shot time-series forecasting adapted from Datadog's open-source Toto architecture (151M param decoder-only transformer, Student-T mixture model). 12 metric streams with CRPS scoring, 80/95% confidence intervals, and anomaly detection.
  - **Causal Root-Cause Analysis** (`/causal-rca`): Structural causal models for incident diagnosis inspired by Causely's causal reasoning platform. DAG-based anomaly propagation tracing, counterfactual "what-if" analysis.
  - **Synthetic Metrics Engine** (`/synthetic-metrics`): On-the-fly metric computation from raw logs/traces/events inspired by Dash0. 8 synthetic metrics with full lineage tracing, SLO automation, and cost savings tracking.
  - **Self-Healing Engine** (`/self-healing`): Closed-loop remediation inspired by Elastic's Sense-Think-Act architecture. 6 healing workflows with automated triggers, multi-step action sequences, live event feed.
  - **AI Alert Triage** (`/alert-triage`): ML-powered alert prioritization with noise suppression, correlation grouping, causal context, and LLM-generated explanations.
  - **Cost-Aware Monitoring** (`/cost-monitoring`): Full observability cost visibility — ingestion, storage, compute, AI inference. Budget tracking, cost-per-alert attribution, usage tier comparison, optimization recommendations.
  - **Observability as Code** (`/observability-as-code`): Declarative monitors, dashboards, SLOs, healing workflows via Terraform/YAML/API. Version control, drift detection, CI/CD integration, audit trails.
- **A11oy Trust & Policies:** Three new operational policy pages covering Constitution, Security & Compliance, and Right to Audit.
- **Shared Reverse Proxy:** `packages/shared-proxy` — all artifacts share a single reverse-proxy Vite plugin on port 9090 with `SO_REUSEPORT`. The `PROXY_ROUTES` array must contain an entry for every artifact's path prefix. When adding a new artifact, add its route to `PROXY_ROUTES` and restart ALL running workflows so every `reusePort` listener picks up the updated route table. Port constants: A11OY=4110, AEGIS=3002, API=8080, CARLOTA_JO=8098, COMMAND=5000, CONDUIT=5300, COUNSEL=4199, LYTE=7099, PRAXIS=8008, SENTRA=4099, TERRA=6000, VESSELS=8099, PULSE=5201, SZL_DEMO_VIDEO=8765, PLUGINMESH=8190.
- **Shared Security Headers:** `packages/security-headers` (`@szl-holdings/security-headers`) exports `securityHeadersVitePlugin()` (wired into every web artifact's vite.config.ts) and `buildHelmetOptions()` (used by the API server). Enforces HSTS, CSP, X-Content-Type-Options, Referrer-Policy, X-Frame-Options, and Permissions-Policy consistently across the platform. CI smoke check: `scripts/check-security-headers.mjs`. Runbook: `docs/csp-allowlist.md`.
- **Scheduled Job Run History Persistence:** The `scheduled_job_runs` table (`lib/db/src/schema/scheduled_job_runs.ts`) stores per-execution records (job type, timestamp, status, duration, JSON result) for all scheduled jobs. The `recordRunHistory` function in `artifacts/api-server/src/lib/scheduled-jobs.ts` writes a DB row on each run. The `/jobs/registry` endpoint (`getJobRegistry`) reads from the DB so dashboard sparklines and 7-day totals survive server restarts. The synchronous `getJobRegistrySync()` is available for callers that only need in-memory state.

## External Dependencies
- **Database:** PostgreSQL
- **Authentication:** Replit Auth
- **Payment Processing:** Stripe
- **AI Providers:** OpenAI, Anthropic, Gemini, HuggingFace Inference API, HuggingFace MCP, Elevenlabs, Substrate/oLLM
- **Communication:** Slack, Twilio, Resend, SendGrid
- **Maritime Data:** MarineTraffic, AISHub, Digitraffic AIS, BarentsWatch AIS, Open-Meteo Marine Weather
- **Threat Intelligence:** STIX/TAXII, AlienVault OTX, MISP OSINT, OFAC SDN, EU Consolidated List, Shodan, GreyNoise, MalwareBazaar
- **Government Data:** CISA KEV, NVD CVE, MITRE ATT&CK, Census/BLS, FEMA NRI, NYC Open Data, SEC EDGAR
- **Legal Data:** CourtListener REST API
- **Other APIs/Services:** GitHub API, Figma, Google APIs, HubSpot