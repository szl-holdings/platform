# SZL Holdings Platform

## Overview
SZL Holdings offers FORGE, a governed operational intelligence platform for regulated enterprises. The platform includes A11oy, a governed execution fabric where enterprise signals, agents, tools, people, policies, and proof operate as one controlled system. A11oy is a fully-rendered web application with 33 product surfaces, including the Sovereign Execution Lab and the Mythos Doctrine governance layer.

The platform provides a comprehensive solution for decision intelligence and operational oversight in highly regulated environments, with strong market potential in sectors requiring stringent compliance and auditable AI applications. It is a pnpm monorepo supporting web and mobile applications, an API, and a design system, focusing on Governed Workflow Orchestration and Maritime Intelligence, with specialized extensions built upon its governed foundation.

Key capabilities include:
- **A11oy Phase 3 (Sovereign Execution Lab):** Features like Model Router, MirrorEval 2.0, Workcell Replay, Connector Firewall, Twin Foundry, Skill Library, Boardroom Mode, Trust Center, Investor Demo, and Sovereign landing.
- **A11oy Agentic Layer (Phase 4):** Agent Orchestration, Agent Mesh (17 external agents governed by proof chain), Agent Visualization, and a comprehensive a11oy SDK. The SDK includes **59 primitives**, multi-agent orchestration capabilities, and alignment/welfare governance features. It supports **10 language Client SDKs**, **4 cloud platforms**, and provides an **Administration API** with robust **Security & Trust Architecture** and **Alignment & Risk Governance**.
- **A11oy Mythos Doctrine:** 14 governance pages covering risk reports, behavioral audits, covenant lifts, reward hacking, and alignment reviews.
- **A11oy DARPA Resilience Layer:** 8 pages integrating innovations from 8 DARPA programs (GARD, XAI, Assured Autonomy, SSITH/CHERI, SocialCyber, AIxCC, BORDEAUX, TIAMAT) focusing on robustness, formal verification, supply chain security, and explainability.
- **OMNIA — Unified Portfolio Intelligence Layer:** Provides shared shell primitives, world model API routes, command surface pages, and an A11oy Adoption Dashboard. It integrates a unified shell across all web artifacts and offers mobile screens for notifications and voice queries.

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

**Monorepo Structure:** Organizes active/archived artifacts, shared infrastructure, and packages for business observability, AI Control Plane, and NVIDIA-Ready Modules, utilizing Drizzle ORM for PostgreSQL schemas.

**UI/UX and Design System (v2):** The Governed-Intelligence Design Language v2 (`@szl-holdings/design-system`) provides the single visual source of truth, defining an enterprise accent palette, typography, spacing, and UI components. All authenticated product surfaces are evidence-first. The platform utilizes a pure dark theme with a single warm accent (Publication Palette).

**One-of-One Platform Shell:** Unifies user interfaces across applications with shared modules like `OmniaShellProvider`, `OmniaTopBar`, `OmniaCommandPalette`, and `OmniaNotificationInbox`.

**API Layers:** Includes REST API, GraphQL API (Apollo Server), and an MCP Gateway. The A11oy frontend is wired to the API server's `/api/graphql` endpoint via `urql`.

**AI Infrastructure:** Features a multi-provider AI backend, AI evaluation infrastructure, AI Ops Dashboard, and NVIDIA-Ready Packages.

**Forge – AI Runtime, Agent Factory & Promotion Pipeline:** Manages the governed lifecycle of AI agents.

**Precision Evolution Runtime (PER):** Governed, evidence-gated system for continuously evolving agent policies.

**PRAXIS – Unified Agentic AI Layer:** Internal tooling sandbox for AI agent research, memory management, skill registry, and AI Control Plane features.

**KORA – Decision Intelligence:** Flagship application for executive narratives, signal feeds, and decision centers.

**Brand Mapping:** Legacy codenames for artifact directories are mapped to canonical brand names (e.g., `aegis` → **PARAGON** (now merged into Sentra), `sentra` → **TENAX**, `terra` → **DOMAINE**, `lyte-command-center` → **KORA**, `vessels` → **SEXTANT**, `mockup-sandbox` / `nexus` → **PRAXIS**, `pulse` → **LUMINA**).

**Aegis → Sentra Full Merge (Completed):** All 118 Aegis pages, 9 components, 3 data files, 8 lib files, and the investor slide deck have been fully merged into Sentra, creating a mega cybersecurity platform with 231 total page files. Sentra now contains: SOC Operations (13 modules), Threat Intelligence (14 modules), Response & Automation (6), War Room & Exercises (6), Digital Twin & ATLAS (4), Agent Mesh (5), EDR & SIEM (2), Compliance & Risk (13), Research Intelligence (8 — including DARPA MTO Innovation Hub and PQC Readiness), Governance (10), Adversarial Simulation (3), plus Core pages and the investor deck. The landing page has been redesigned to a minimalistic OpenAI/Anthropic-inspired style with a11oy orchestration branding throughout. Aegis artifact is now archived/superseded by Sentra.

**DARPA MTO Innovation Hub (`/intel/darpa-mto`):** Maps 13 DARPA Microsystems Technology Office research domains (4 active programs, 9 under incubation) to a11oy cybersecurity applications. Covers photonic inference, post-quantum cryptography, skyrmion memory, circuits-on-demand, nanofluidic computing, optical comms, 3D heterogeneous integration, flexoelectric sensors, molecular machines, directed energy, bio-hybrid sensing, physical intelligence in materials, and lunar supply chain security. Each domain includes TRL rating, key breakthroughs, a11oy integration strategy, top GitHub repos, and publications. Data layer in `darpa-mto-research.ts`.

**Post-Quantum Cryptography Readiness (`/intel/pqc-readiness`):** Tracks quantum-resistant cryptography migration across the a11oy governance ecosystem. Covers NIST FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), and draft FIPS 206 (FN-DSA). Displays ecosystem migration status for 8 subsystems (Agent Mesh TLS, Proof Chain, Evidence Ledger, Covenant Attestation, Agent Identity, Archival Signing, Hash Commitments, Session Tokens), 4-phase migration roadmap, and harvest-now-decrypt-later risk assessment.

**AI Provenance & Explainability Contract:** Every AI-generated output carries a `ProvenanceEnvelope` with essential metadata.

**Cross-Domain Signal Bus (Alert Bus):** "When/then" automation engine routing signals across product domains.

**AEEP Core Packages:** Includes contracts, agent core, workflow runtime, retrieval core, memory core, memory fabric, evidence ledger, policy guard, domain profiles, and platform metrics registry, featuring a two-stage retrieval pipeline, multimodal retrieval, and scoped memory management.

**A11oy Agent Runtime:** Governed, agentic execution fabric with modules for Types, Tracing, Memory, Model Router, MirrorEval, Deep Context, Tool Registry, Approved Runner, PCE Gate, Operators, and Workcells, ensuring controlled execution through governance invariants.

**Email Deliverability:** All outbound transactional email uses a centralized library with suppression lists and admin routes.

**Mobile Biometric Sign-In:** Real server-side authentication factor with cryptographic proof-of-possession.

**Unified Auth Mesh:** Backend-only authentication unification layer with specific priority order, new database tables, and routes for OAuth and API keys, using custom HS256 JWT.

**Forecast & Anomaly Fabric:** Unified forecasting service with calibrated interval outputs, and a unified streaming and batch anomaly detection service. Includes drift detection and champion-challenger evaluations.

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