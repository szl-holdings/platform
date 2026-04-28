# SZL Holdings Platform

## Overview
SZL Holdings offers FORGE, a governed operational intelligence platform for regulated enterprises. The platform provides a governed execution fabric where enterprise signals, agents, tools, people, policies, and proof operate as one controlled system. It's a comprehensive solution for decision intelligence and operational oversight, targeting highly regulated sectors requiring stringent compliance and auditable AI applications. The platform supports web and mobile applications, an API, and a design system, focusing on Governed Workflow Orchestration and Maritime Intelligence. Key capabilities include the Sovereign Execution Lab, the A11oy Agentic Layer, the A11oy Mythos Doctrine for governance, the A11oy Compliance Fabric, the A11oy DARPA Resilience Layer, and OMNIA, a Unified Portfolio Intelligence Layer.

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
- **Living Signal Mesh & Evidence Graph:** Unifies event/signal handling with an `EvidenceStore`.
- **Memory Fabric & FORGE Runtime:** A tiered memory layer with provenance, freshness, retention, and sensitivity tracking.

**Monorepo Structure:** Organizes active/archived artifacts, shared infrastructure, and packages for business observability, AI Control Plane, NVIDIA-Ready Modules, and Substrate Edge Inference, utilizing Drizzle ORM for PostgreSQL schemas. Key AI packages include routing, fallback, cost management, NVIDIA NIM endpoints, oLLM local GPU inference, and specialized modules. The Substrate inference service uses Python/FastAPI.

**UI/UX and Design System:** The Governed-Intelligence Design Language v2 (`@szl-holdings/design-system`) is the single visual source of truth, defining the enterprise accent palette, typography, spacing, and UI components. All authenticated product surfaces are evidence-first, utilizing a pure dark theme with a single warm accent. The platform uses a One-of-One Platform Shell to unify user interfaces across applications.

**API Layers:** Includes REST API, GraphQL API (Apollo Server), and an MCP Gateway.

**Zero-Trust Auth Hardening (Task #3339):** Implemented on the API server:
- **Passwordless magic-link auth** — `POST /api/auth/magic-link/request` + `GET /api/auth/magic-link/verify`. Single-use, 15-min TTL tokens.
- **Device fingerprinting** — `POST /api/auth/device-fingerprint`, `GET /api/auth/devices`, `DELETE /api/auth/devices/:id`. New-device email alerts via `buildNewDeviceAlertEmail`.
- **Adaptive risk scoring** — `POST /api/auth/risk-assessment` (score 0-100, levels: low/medium/high/critical). Factors: IP velocity, account failure rate, UA anomaly, time-of-day, known device.
- **Progressive brute-force protection** — exponential backoff + lockout via `loginAttemptsTable` + Redis; `GET /api/auth/lockout-status` exposes current state; CAPTCHA flag at 5+ failures.
- **Session management API** — `GET /api/auth/sessions` (list active sessions), `DELETE /api/auth/sessions/all` (revoke all + bump session version).
- **Security event audit log** — `GET /api/auth/security-events` (admin/ops only): filterable by action/userId/date, supports CSV export.
- **DB schema additions** — `magicLinksTable`, `userDevicesTable`, `loginAttemptsTable` in `lib/db/src/schema/auth.ts`; migration `0146_zero_trust_auth_hardening.sql`.

**Documentation Validation:** `pnpm docs:claims-check` (run by the pre-commit hook) validates that `ACCESS-CONTROL-MATRIX.md`, `API-SPEC.md`, and `SECURITY-CHECKLIST.md` remain consistent with the live codebase. The validator script is at `scripts/docs/check-docs-claims.js`.

**AI Infrastructure:** Features a multi-provider AI backend, AI evaluation infrastructure, AI Ops Dashboard, NVIDIA-Ready Packages, and Substrate Edge Inference (oLLM).
- **Forge – AI Runtime, Agent Factory & Promotion Pipeline:** Manages the governed lifecycle of AI agents.
- **Precision Evolution Runtime (PER):** A governed, evidence-gated system for continuously evolving agent policies.
- **PRAXIS – Unified Agentic AI Layer:** An internal tooling sandbox for AI agent research, memory management, skill registry, and AI Control Plane features.
- **A11oy Agent Runtime:** A governed, agentic execution fabric ensuring controlled execution through governance invariants, evolved into a Proof-Carrying Agentic Execution Platform with capabilities such as Agent Gateway, A2A Interop, Reasoning Proof Engine, Governed Memory Vault, Agent Identity Registry, MirrorEval + Reasoning Verification, Self-Optimization Engine, Signal Mesh + Knowledge Graph, and Governed Security Agents.
- **a1.1oy — Conversational AI Interface (inside A11oy):** Claude-style governed AI chat at `/nexus`, MCP Hub at `/mcp-hub`, and Agentic RAG at `/agentic-rag` with multi-step retrieval pipeline and knowledge collections.
- **AI Provenance & Explainability Contract:** Every AI-generated output carries a `ProvenanceEnvelope` with essential metadata.
- **Karpathy-Distilled Agent Evolution:** Implements six Karpathy-inspired engine primitives for advanced agent intelligence.

**Other Technical Implementations:**
- **Red-Team Game Day Engine:** Live competitive crisis simulation for resilience scoring.
- **Cross-Domain Signal Bus (Alert Bus):** "When/then" automation engine routing signals across product domains.
- **Outbound Gateway:** Unified omni-channel notification layer with pluggable adapters.
- **Conduit — Reverse ETL:** Visual no-code tool for operators to map SZL internal data to third-party SaaS destinations.
- **AEEP Core Packages:** Includes contracts, agent core, workflow runtime, retrieval core, memory core, memory fabric, evidence ledger, policy guard, domain profiles, and platform metrics registry, featuring a two-stage retrieval pipeline, multimodal retrieval, and scoped memory management.
- **Multi-Agent Crew System:** Specialized agent roles with plan decomposition and trust-aware execution.
- **Trust Score Engine:** Graduated autonomy system with rolling accuracy tracking and approval routing.
- **Fine-Tuned Model Router:** Domain-aware model routing with fine-tuned model resolution and cascading fallback chains.
- **Multi-Language Voice Pipeline:** 5-language support for auto-detection, transcription, TTS, and voice chat.
- **Offline-First Sync (Mobile):** Mobile offline sync with local cache, background sync queue, and conflict resolution.
- **Wake-Word Detection (Mobile):** On-device "Hey Command" wake-word detection supporting 5 languages.
- **Mobile Web Parity:** Global search, agent trust dashboard, and offline sync status screens in mobile app.
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
- **A11oy ARGO — Field Intelligence Forge (`/a11oy/argo`, v0.2.0-seed):** Distillation surface that fuses external signals with defensive doctrines and public research for cybersecurity insights.
- **A11oy Aerial Twin (Site-Specific Wireless Digital-Twin Doctrine):** Doctrine hub distilling public NVIDIA Aerial Digital Twin overview into the SZL ecosystem with operational milestone surfaces.
- **A11oy Mythos Layer (Defensive Architecture Doctrine):** Static doctrine surface codifying the A11oy×Sentra orchestration architecture.
- **A11oy × Sentra Glasswing Command Layer (Risk-as-Reward):** Premium executive command surface synthesizing agent constellations and a "Risk-as-Reward" novelty thesis.
- **A11oy Command Fabric — Universal Intelligence Layer:** Cross-vertical command layer spanning all SZL verticals with interactive data views.
- **A11oy Trust & Policies:** Three new operational policy pages covering Constitution, Security & Compliance, and Right to Audit.
- **Shared Reverse Proxy:** `packages/shared-proxy` — all artifacts share a single reverse-proxy Vite plugin on port 9090 with `SO_REUSEPORT`. The `PROXY_ROUTES` array must contain an entry for every artifact's path prefix. When adding a new artifact, add its route to `PROXY_ROUTES` and restart ALL running workflows so every `reusePort` listener picks up the updated route table. Port constants: A11OY=4110, AEGIS=3002, API=8080, CARLOTA_JO=8098, COMMAND=5000, CONDUIT=5300, COUNSEL=4199, LYTE=7099, PRAXIS=8008, SENTRA=4099, TERRA=6000, VESSELS=8099, PULSE=5201, SZL_DEMO_VIDEO=8765, PLUGINMESH=8190.
- **Shared Security Headers:** `packages/security-headers` (`@szl-holdings/security-headers`) exports `securityHeadersVitePlugin()` (wired into every web artifact's vite.config.ts) and `buildHelmetOptions()` (used by the API server). Enforces HSTS, CSP, X-Content-Type-Options, Referrer-Policy, X-Frame-Options, and Permissions-Policy consistently across the platform. CI smoke check: `scripts/check-security-headers.mjs`. Runbook: `docs/csp-allowlist.md`.

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

## API Server Service Layer (Refactor — April 2026)

Route files were refactored to extract shared logic into a service/library layer under `artifacts/api-server/src/services/` and `artifacts/api-server/src/lib/`. No breaking API changes were made. All extractions were pure lifts with re-exports — behaviour is identical.

**New service files created:**

| File | Contents | Lines |
|------|----------|-------|
| `src/services/vessels/vessels-carbon.ts` | AIS engine (haversineNm, safeJson, deriveAisTrack), fuel factors, computeEmissions, ciiRating | 168 |
| `src/services/vessels/vessels-emissions.ts` | VOYAGE_EMISSIONS seed data, VoyageEmissionRecord type, EU ETS constants, refreshInProgressFromAis | 238 |
| `src/services/terra/screening-provider.ts` | ScreeningProvider interface, MockScreeningProvider, EquifaxScreeningProvider, getScreeningProvider factory | 181 |
| `src/lib/lease-extractor.ts` | extractLeaseFromText — regex-based lease document parser | 183 |
| `src/services/command/domain-aggregators.ts` | All domain getter functions (getAegisData, getVesselsData, getLyteData, getPrismData, getCarlotaJoData, getStephenData, getSzlData, getTerraData), clamp/relTime/tenantKey utilities, buildTimeline | 473 |
| `src/services/nexus/nexus-types.ts` | TypeScript interfaces: ResearchRun, AgentLane, Citation, MemoryItem, Skill, PatternFamily, ProtocolTool, OrchestrationPlan, OrchestrationStep, IngestJob | 128 |
| `src/services/nexus/nexus-seed-data.ts` | Static seed data arrays: SEED_SKILLS_DATA, PATTERNS_DATA, TOOLS_DATA, SEED_MEMORY_DATA | 647 |
| `src/services/nuro-mesh/agent-registry.ts` | AgentDefinition interface, AGENT_REGISTRY (12 agents), DOMAIN_ROUTING_RULES, DOMAIN_SEMANTIC_INTENTS, CROSS_DOMAIN_AFFINITY, routeToAgents | 481 |
| `src/services/guardian/guardian-mappers.ts` | policyRowToApi, policyRowToRule, toolRowToManifest, assignmentRowToApi, versionRowToApi, permissionRowToApi, resolveActorMap, actorOrUndefined, approvalRowToApi, redactPayload, isAdminUser, userOrgId | 237 |
| `src/lib/crud-factory.ts` | Reusable CRUD patterns: handleList, handleGetOne, handleCreate, handleUpdate, handleDelete | 124 |

**Route files reduced:**

| Route file | Before | After | Saved |
|------------|--------|-------|-------|
| `nexus.ts` | 3,688 | 2,946 | -742 |
| `guardian.ts` | 3,997 | 3,792 | -205 |
| `command.ts` | 3,950 | 3,503 | -447 |
| `vessels-modules.ts` | 1,948 | 1,552 | -396 |
| `terra-modules.ts` | 2,077 | 1,692 | -385 |
| `nuro-mesh.ts` | 2,038 | 1,589 | -449 |

Total: **2,624 lines removed** from route files into 10 reusable service/lib files.

**Other files updated for re-export compatibility:**
- `src/routes/agent-federation.ts` — imports AgentDefinition/AGENT_REGISTRY from service
- `src/routes/ai-safety.ts` — imports AGENT_REGISTRY from service