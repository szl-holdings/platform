# SZL Holdings Platform

## Overview
SZL Holdings offers FORGE, a governed operational intelligence platform for regulated enterprises. The platform includes A11oy, a governed execution fabric where enterprise signals, agents, tools, people, policies, and proof operate as one controlled system. A11oy is a fully-rendered web application with 33 product surfaces, including the Sovereign Execution Lab and the Mythos Doctrine governance layer (14 pages).

The platform provides a comprehensive solution for decision intelligence and operational oversight in highly regulated environments, with strong market potential in sectors requiring stringent compliance and auditable AI applications. It is a pnpm monorepo supporting web and mobile applications, an API, and a design system, focusing on Governed Workflow Orchestration and Maritime Intelligence, with specialized extensions built upon its governed foundation.

Key capabilities include:
- **A11oy Phase 3 (Sovereign Execution Lab):** Model Router, MirrorEval 2.0, Workcell Replay, Connector Firewall, Twin Foundry, Skill Library, Boardroom Mode, Trust Center, Investor Demo, and Sovereign landing.
- **A11oy Agentic Layer (Phase 4):** Agent Orchestration, Agent Mesh (17 external agents governed by proof chain), Agent Visualization, a11oy SDK (developer platform with **59 primitives** including Anthropic SDK integration, multiagent orchestration [ManagedAgent, MultiAgentSession, SwarmProtocol, AgentGenome, DecisionMarket, TemporalReplay, CausalGraph], and alignment/welfare governance [ResponsibleScalingPolicy, AgentWelfareAssessment, AlignmentVerifier, ConstitutionalEnforcer, EmotionProbe, InterpretabilityEngine, SchemingDetector, SandbagMonitor, FrontierComplianceGate, WelfareInterview], **16 tabs** [Primitives, SDKs, Multi-Agent, Alignment, Tools, Evals, Fine-Tune, Skills, MCP, Cloud, Admin, Security, Observe, Guides, Cookbook, API], **10 language Client SDKs** [Python, TypeScript, Java, Go, Ruby, C#, PHP, Rust, Swift, Kotlin], **4 cloud platforms** [Azure AI Foundry, Amazon Bedrock, Google Vertex AI, Sovereign Cloud], **Administration API** [roles, workspaces, API keys, data residency], **Security & Trust Architecture** [Glasswing-inspired, 12 certifications, zero-trust, AI red team, Agent Welfare Monitor, Alignment Verification Engine, Constitutional Runtime Enforcement, Responsible Scaling Engine], **Alignment & Risk Governance** [6 risk pathways from Claude Mythos Alignment Risk Update, 8 alignment capabilities, 4 code samples, misalignment taxonomy, monitoring architecture, ASL-1 through ASL-5 levels], **Observability** [traces, metrics, alerts, OTLP export], 8 tool types, evals framework, fine-tuning pipeline, 20 skills, 20 MCP servers, 80 guides, **133 API endpoints**, 102 cookbook recipes). Navigation section: AGENTIC (5 pages).
- **A11oy Mythos Doctrine (Task #3993):** 14 governance pages rooted at `/doctrine`: DoctrineOverview, RiskReports, BehavioralAudit, CovenantLift, CodeBehaviors, RewardHacking, AlignmentReview, SnapshotProvenance, AIUserTurn, RedTeam, Glasswing, SystemCard (parameterized `:id`), CapabilityTrajectory. Data layer in `artifacts/a11oy/src/data/mythosDoctrine.ts`. Navigation section: DOCTRINE (14 pages).
- **A11oy Substrate Engine:** Python CLI for generating vertical artifact JSON files.
- **Publication Palette (2026 rebrand):** Pure dark theme with a single warm accent.
- **Multimodal Experience & Trust Proof (Task #3561):** Includes multilingual voice, wake-word detection, offline-first sync banner for mobile, CRDT live collaboration, digital twin simulator, PRAXIS graph hop traversal, chaos engineering drills, federated learning config, multi-fund tenancy views, and PDF export for PARAGON.

## Config Package Fix
`readEnvFeatureFlags` and `EnvFeatureFlagSnapshot` are duplicated in both `packages/config` (`@szl-holdings/platform-registry`) and `lib/config` (`@szl-holdings/config`) so that aegis/vessels (which depend on `@szl-holdings/config`) resolve the symbol correctly. The canonical definition is in `packages/config/src/feature-flags.ts`.

## A11oy Launch Content Package (Task #3939)
- **Screenshots:** 12 high-quality JPG captures of a11oy surfaces in `a11oy-launch-content/screenshots/` — landing page, SDK primitives, trust center, orchestration, proof chain, governance, solutions, now board, command surface, fabric architecture, agents, mirror eval.
- **Posts:** Three thought-leadership articles in `a11oy-launch-content/`:
  - `substack.md` — "The Missing Layer" founder narrative (~1,500 words)
  - `medium.md` — Technical alignment risk analysis (~2,000 words)
  - `linkedin.md` — Metrics-first executive positioning (~700 words)
- **Demo Video:** 78-second animated walkthrough in `artifacts/szl-demo-video/` — 8 scenes from landing page through SDK, Now Board, Command Surface, Agent Registry, Fabric Architecture, Governance & Proof, to end card. Includes social cut variants (60s, 30s, 15s).
- **Zip:** `a11oy-launch-content.zip` — all screenshots and posts packaged for distribution.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## OMNIA — Unified Portfolio Intelligence Layer (added)
- **Package:** `packages/omnia-shell` (`@szl-holdings/omnia-shell`) — shared shell primitives: `OmniaShellProvider`, `OmniaTopBar`, `OmniaCommandPalette`, `Provenance`, `OmniaBreadcrumb`, `OmniaNotificationInbox`, hooks, and types.
- **API:** `artifacts/api-server/src/routes/omnia.ts` — world model routes at `/api/omnia/*`: `/graph`, `/entities`, `/narrative`, `/search`, `/notifications`, `/ripple/:entityId`, `/story`, `/adoption`, `/adoption/beacon`.
- **Command Surface pages:** `artifacts/command/src/pages/omnia/` — hub (`index.tsx`), world model graph (`world-model.tsx`), synthesis narrative (`narrative.tsx`), ripple impact view (`ripple.tsx`), public story mode (`story.tsx`). All accessible via `/omnia/*` routes and listed under the `OMNIA` group in Command nav.
- **A11oy Adoption Dashboard:** `artifacts/a11oy/src/pages/OmniaAdoption.tsx` at `/a11oy/omnia-adoption` — tracks shell version, ⌘K coverage, beacon freshness, and adoption rate across all 12 artifacts.
- **Shell adoption:** `OmniaShellProvider` is now wired into `main.tsx` for all 11 web artifacts: command, holdings, aegis, sentra, terra, vessels, counsel, a11oy, pulse, carlota-jo, lyte-command-center. Each fires an adoption beacon to `/api/omnia/adoption/beacon` on first mount.
- **Mobile:** Two new screens in `szl-holdings-mobile/app/(shell)/`: `omnia-notifications.tsx` (cross-portfolio inbox with filter, mark-read, refresh) and `omnia-voice.tsx` (voice/text query surface with TTS read-back via expo-speech).

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

**KORA – Decision Intelligence:** Flagship application for executive narratives, signal feeds, and decision centers, using the publication palette.

**Brand Mapping (Task #3842 — legacy codenames → canonical brand names):**
- `aegis` artifact dir → **PARAGON** (Defense & Intelligence Command)
- `sentra` artifact dir → **TENAX** (Cyber Resilience Command)
- `terra` artifact dir → **DOMAINE** (Real Estate Intelligence)
- `lyte-command-center` artifact dir → **KORA** (Decision Intelligence)
- `vessels` artifact dir → **SEXTANT** (Maritime Intelligence)
- `mockup-sandbox` / `nexus` (legacy) → **PRAXIS** (Unified Agentic AI Layer)
- `pulse` artifact dir → **LUMINA** (AI Executive Briefing)

_Intentionally unchanged (out of scope):_ artifact root directory names (`artifacts/aegis/`, `artifacts/terra/`, etc.), API URL path segments (`/api/lyte/`, `/api/nexus/`, `/aegis/`), database table identifiers (`firestormIncidentsTable`, `lyte_signals`, `terra_distress_properties`, etc.), the `seed-aegis.ts` shim (which re-exports from `seed-paragon.ts`), and historical changelog/archive entries.

**AI Provenance & Explainability Contract:** Every AI-generated output carries a `ProvenanceEnvelope` with essential metadata.

**Cross-Domain Signal Bus (Alert Bus):** "When/then" automation engine routing signals across product domains.

**AEEP Core Packages:** Includes contracts, agent core, workflow runtime, retrieval core, memory core, memory fabric, evidence ledger, policy guard, domain profiles, and platform metrics registry, featuring a two-stage retrieval pipeline, multimodal retrieval, and scoped memory management.

**A11oy Agent Runtime:** Governed, agentic execution fabric with modules for Types, Tracing, Memory, Model Router, MirrorEval, Deep Context, Tool Registry, Approved Runner, PCE Gate, Operators, and Workcells. Governance invariants ensure controlled execution.

**A11oy GraphQL Client (Task #3898):** The A11oy frontend is wired to the API server's `/api/graphql` endpoint via `urql` (with `@urql/exchange-graphcache` and `graphql-ws` for subscriptions). The GraphQL module lives at `artifacts/a11oy/src/graphql/` with `provider.tsx` (urql client + WebSocket subscription exchange), `operations.ts` (queries, mutations, subscriptions), `hooks.ts` (typed React hooks), and `index.ts` (barrel exports). The `<GraphQLProvider>` wraps the app in `App.tsx`. Pages (`CommandSurface`, `Agents`, `NowBoard`, `Governance`, `HomePage`) use GraphQL hooks with graceful fallback to `SEED_SIGNALS`/`SEED_WORKCELLS` from `@workspace/a11oy-fabric` when the API is unreachable. The `StatusPill` and `PageHeader` components accept a `'CONNECTING'` status variant.

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