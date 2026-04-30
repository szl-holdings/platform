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

## Canonical Identity & Source of Truth
The single source of truth for canonical metrics, vertical names, and slugs is `SOURCE_OF_TRUTH.md` at the repo root, backed by the machine-readable `audit/source-of-truth.json`. Any document, slide, or README that cites a count (artifacts, DB tables, API endpoints, verticals, packages, etc.) must draw the number from `SOURCE_OF_TRUTH.md` and re-run the verification command listed there before publishing. Naming conventions: display names use the canonical name (TENAX, SEXTANT, DOMAINE, Counsel, LUMINA, PARAGON, KORA, Carlota Jo, Continuum, Amaru, APEX, PRAXIS); slugs and API paths are stable and do not change on rebrand. The eight production verticals are TENAX (Sentra), SEXTANT (Vessels), DOMAINE (Terra), Counsel, LUMINA (Pulse), PARAGON (Aegis), KORA (Lyte), and Carlota Jo. Counsel is the canonical legal vertical; the older "PRISM Counsel" name is archived. "Alloy" is retained as the name of the AI execution plane (Alloy Model Gateway, Alloy Endpoint Plane, Alloy Embedding Fabric); the broader Business Observability Fabric is now called Continuum.

## Technology Preferences
- TypeScript 5.9 / Node 20+ / pnpm workspaces
- React 19 + Vite for web artifacts; Expo for mobile
- Drizzle ORM on PostgreSQL (Neon-compatible)
- Hugging Face Inference Endpoints for governed LLM serving (Qwen 3.6-27B as the primary reasoning model)
- Shared design system (`@szl-holdings/design-system`) — pure dark theme, single warm accent
- Cloudflare for edge / DNS / WAF; Vercel and Replit for app hosting
- GitHub for VCS; CI via GitHub Actions

## AI Governance Rules
1. Every AI call must produce a `ProvenanceEnvelope` (model, prompt hash, tokens, cost, latency, governance verdict).
2. Every AI call must emit at minimum the `alloy.model_request_sent` and `alloy.model_response_received` audit events; blocks, retries, redactions, and budget events emit additional events listed in `ecosystem-plugin-registry.json` → `required_audit_events`.
3. PII (SSN, credit card, email, private key, AWS secret, etc.) must be redacted before any input leaves the platform — the gateway enforces this and is the only sanctioned path to the Qwen endpoint.
4. Hidden reasoning ("thinking" content) must be stripped from any output returned to callers and from any log line. Only a boolean `thinkingPresent` flag may be persisted in evidence metadata.
5. High-risk actions (`purge_data`, `external_transfer`, `modify_policy`, `force_approve`, `delete_tenant`, `export_all`) require a human-in-the-loop approval token before the gateway will dispatch the request.
6. Per-request and daily budget caps are enforced with hard cutoff — new requests are rejected, never queued silently.
7. No model weights are hosted in this repo. All inference is remote and routes through the Alloy Endpoint Plane.
8. No secrets are committed. All credentials flow through environment variables documented in the relevant profile.

## Model & Endpoint Policy
- **Primary governed model:** Qwen 3.6-27B Reasoning (`Qwen/Qwen3-27B`). Profile: `model-profiles/qwen3_6_27b_szl_profile.json`. License: Qwen Research License (commercial use requires written approval from Alibaba Cloud).
- **Endpoint plane:** Hugging Face Inference Endpoint, OpenAI-compatible transport. Profile: `endpoint-profiles/alloy_endpoint_plane.json`. Autoscale 0–4 replicas; 15-min idle scale-down; expected cold start ~120s.
- **Gateway adapter:** `lib/ai-engine/src/alloy-model-gateway.ts` (`AlloyModelGateway`). The single sanctioned path from any vertical to the Qwen endpoint. Validates vertical + task, redacts PII, strips thinking content, attaches evidence, emits audit events, enforces approval gates, retries 503 cold-starts (3× with 2s/5s/10s backoff), and enforces budgets.
- **Vertical contract:** `AlloyVertical`, `AlloyModelTask`, `AlloyModelRequest` are the canonical types; vertical apps use the gateway via `getDefaultAlloyModelGateway()`.
- **Required env vars (documented, never hard-coded):** `QWEN36_BASE_URL`, `QWEN36_API_KEY`, `QWEN36_MODEL`, `HF_TOKEN`, `HF_ENDPOINT_NAMESPACE`. The gateway returns `outcome: 'error'` when these are missing — there is no silent fallback to a different model.
- **Plugin registry:** `ecosystem-plugin-registry.json` enumerates the eight verticals, their allowed tasks, approval gates, shared plugins (GitHub, HuggingFace, Vercel, Neon, Cloudflare), and domain-specific plugins.

## External Research Policy
- All external research, threat intel, and market data flow through the per-vertical plugins listed in `ecosystem-plugin-registry.json`. Direct fetches that bypass the registry are prohibited.
- Public-source citations (CISA KEV, NVD, MITRE ATT&CK, SEC EDGAR, CourtListener, OFAC SDN, etc.) are recorded as `SourceCitation` entries on the evidence envelope.
- Provider rate limits and cost meters are honored by the adapter framework; circuit breaker opens on repeated failures.

## Verification Checklist (run before publishing claims)
1. Re-run the verification commands in `SOURCE_OF_TRUTH.md` and confirm every quoted number matches.
2. Confirm `model-profiles/qwen3_6_27b_szl_profile.json` and `endpoint-profiles/alloy_endpoint_plane.json` reference only env vars (no inline secrets).
3. Confirm `ecosystem-plugin-registry.json` lists all 8 verticals and the 5 shared plugins.
4. Confirm any new vertical wiring uses `AlloyModelGateway` and not direct provider SDK calls.
5. Confirm no thinking content, secrets, or customer data appear in committed JSON, MD, or TS files.

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
## 2026-04-29 — Portfolio consolidation pass

Live SZL surface narrowed to 7 products + shared backend + canvas tool:
- conduit (Amaru), a11oy, sentra, counsel, terra, carlota-jo, vessels
- api-server (kept; live frontends depend on /api/)
- mockup-sandbox (kept; canvas workspace tool)

Archived to `.archived/artifacts/`:
- szl-holdings, szl-holdings-mobile, command, pulse, lyte-command-center,
  szl-demo-video, pluginmesh, aegis, helios

Consolidated into a11oy: 0 (by deliberate restraint — each archive candidate
was already covered by a canonical kernel-bound surface in the live trio).
The consolidation registry is exposed in-app at A11oy → Portfolio Archive
(`/a11oy/portfolio-archive`) and documented in `.archived/README.md`.

Workflows for archived slugs cannot be deleted directly (PROHIBITED_ACTION,
artifact-owned); they are dead since their directories no longer exist.

## 2026-04-30 — Ouroboros runtime contract: v3 + v4 ingestion

`@workspace/ouroboros` now operationalizes the full v4 ecosystem layer
(`docs/research/ouroboros-runtime-contract.v4.json`,
"replit_innovate_full_payload"). Layer added on top of the v3 structural
runtime (PRF_OPERATIONAL_ACTION, PRF_SECURITY_ACTION, PRF_DATA_CONVERGENCE,
domain-pack router, operator-approval, evidence-pack, operational-modes,
review_cycle):

- `validator-registry.ts` — frozen registry of all 9 validator IDs
  (VAL_BUDGET_ENFORCER, VAL_NO_SILENT_MUTATION, VAL_PROOF_REQUIRED,
  VAL_RISK_ESCALATION, VAL_APPROVAL_FOR_CRITICAL_ACTION,
  VAL_SECURITY_PROOF_REQUIRED, VAL_SOURCE_PRIORITY_REQUIRED,
  VAL_MERGE_SAFETY, VAL_CONSISTENCY_BEFORE_COMMIT) with severity + rule
  text and `summarizeValidators()` for halt-or-continue decisions.
- `ingestion-contract.ts` — Sentra (`security_recursive_review`) and
  Amaru (`convergent_data_runtime`) ingestion contracts powered by
  A11oy_core, with `validateIngestion()` enforcing required validators
  and required output artifacts.
- `innovation-engine.ts` — six feedback loops (runtime_feedback,
  golden_run_regression, receipt_quality, security_review_improvement,
  data_convergence_improvement, economic_efficiency) with declared
  source artifact + output deliverable per loop.
- `output-paths.ts` — canonical `output/` paths for trace.jsonl,
  decision_receipt, proof_ledger, final_state, run_summary,
  golden_run_report, sentra_risk_summary, amaru_consistency_report.
- `almanac.ts` — `V4_CYCLES` + `CYCLE_ID_V4_ALIASES` accept
  `paris_cadence_cycle` as alias for `paris_long_cycle` (v4 rename;
  cycle interval unchanged).

All modules are pure (no I/O, frozen Object.freeze data) and exported
from `@workspace/ouroboros`. 59/59 tests pass (was 41 in v3). v4 contract
JSON published to `szl-holdings/ouroboros-thesis`; code pushed to
`szl-holdings/ouroboros`.

## 2026-04-30 — Ouroboros v6 ecosystem layer (a11oy_ultimate_replit_payload)

`@workspace/ouroboros` now operationalizes `a11oy_ultimate_replit_payload`
v6.0.0 (`docs/research/a11oy-ultimate-replit-payload.v6.json`). Layer adds
on top of v4:

- **Shared runtime services**: `SHARED_RUNTIME_SERVICES_V6` — 16 capabilities
  (adds `retrieval_runtime`, `citation_runtime`, `primary_source_runtime`,
  `permission_runtime`, `sandbox_runtime`, `secrets_broker`,
  `evaluation_runtime`, `agent_registry`).
- **Halt vocabulary**: `V6_HALT_CONDITIONS` (10) with `V6_NEW_HALT_CONDITIONS`
  (`primary_source_required_but_unavailable`, `permission_denied`,
  `sandbox_policy_violation`).
- **Routing**: `TASK_TO_PACK_V6` extends v4 with `regulated_monitoring →
  Sentra_pack`, `record_reconciliation → Amaru_pack`, `filings → finance_ops`,
  `regulatory → legal_ops`, `government_data → government_workflows`.
- **Tool permission matrix**: `TOOL_PERMISSION_MATRIX` (deny-by-default,
  per-pack allow-lists for A11oy_core, Sentra_pack, Amaru_pack, research_ops)
  + `checkToolPermission(packId, tool, riskTier, mutating, approved)` with
  R3-mutating-needs-approval and R4-read-only-until-approved overrides.
- **Secrets broker**: `SECRETS_BROKER_SPEC` (runtime injection + scoped
  brokerage; managed list: KATZILLA_API_KEY, OPENAI_API_KEY, DATABASE_URL,
  NEON_DATABASE_URL).
- **Sandbox policy**: `SANDBOX_POLICY` with three execution classes
  (`trusted_internal`, `bounded_code_exec`, `external_network_access`);
  `violationsHaltRun = true`.
- **Agent registry**: `AGENT_REGISTRY_REQUIRED_FIELDS` (8 fields) +
  `validateAgentRegistryEntry(entry)` returning missing-fields list.

## 2026-04-30 — SZL Government Procurement Readiness (NYSTEC pre-briefing)

`@workspace/ouroboros` now operationalizes the April 30, 2026 NYSTEC
pre-briefing audit (Empire APEX Accelerator, Mercy McInnis) covering
A11oy, Sentra, and Amaru against federal and NY State AI procurement
requirements. Source of truth:
`docs/audit/szl-government-readiness.md`. Canonical platform scorecards
(A11oy 72/100, Sentra 68/100, Amaru 65/100), NIST AI RMF alignment matrix
(4 functions × 3 platforms), DoD Responsible AI Tenets (5 tenets,
Equitable flagged as the only gap), GSAR 552.239-7001 readiness (10
requirements: 5 covered, 5 gaps), recommended NAICS codes (5), SAM.gov
registration steps (5), NY State registration notes, pre-meeting action
items (5 critical + 5 for-meeting + 6 thirty-day), and the competitive
positioning statement are exported from `@workspace/ouroboros` as
deeply-frozen, replay-safe data plus pure helpers
(`getPlatformReadiness`, `listGapsAcrossPlatforms`,
`actionItemsByGroup`).

Live, auth-gated endpoints on the api-server:
`/api/ouroboros/gov-readiness/{manifest,platforms,platforms/:id,gaps,nist,
dod,gsar,sam-registration,action-items,positioning}`. Ouroboros tests:
**133/133 passing** (added 28 new pinning tests). Module + canonical
markdown pushed to `szl-holdings/ouroboros`.

## 2026-04-30 — Ouroboros v6 ecosystem layer continued

v6 surfaces are exposed live on the api-server (auth-gated) at
`/api/ouroboros/v6/{manifest,services,halts,routing,permissions,sandbox,
agent-registry/schema}`, plus pure POST decision endpoints
`/v6/permissions/check` and `/v6/agent-registry/check`. Ouroboros tests:
**104/104 passing** (was 70 at v4). v6 module + canonical JSON pushed to
`szl-holdings/ouroboros`.

### GitHub org status (audit pass)

11 public repos under `szl-holdings`. Open PRs on
`szl-holdings-platform`: **#39 react-ecosystem dependabot — merged**;
**#40 vite-build** + **#59 ui-components** dependabot rebase requested
(both conflicted after #39 lockfile move); **#38 Governed Python
efficiency migration** is a draft with conflicts (2599/-833 across 34
files), needs author rebase before review — status comment posted.

## 2026-04-30 — GitHub org alignment + first major releases

Series-A polish pass across all 11 public org repos and the user's
personal profile. **0 open Dependabot alerts** across the entire
organization at completion.

### READMEs upgraded (11 of 11)
Investor-grade rewrites with NYSTEC scorecards, NIST AI RMF / DoD /
GSAR alignment matrices, and a shared footer linking back to the
runtime + thesis + audit doc:
- `szl-holdings/.github` (org profile, was 71B → 6.1KB)
- `szl-holdings/ouroboros` (v6 ecosystem layer + gov-readiness module,
  was 2.1KB → 5.3KB, 133/133 tests called out)
- `szl-holdings/ouroboros-thesis` (cross-link v6 contract JSON, was
  1.6KB → 3.1KB)
- `szl-holdings/{a11oy, sentra, amaru}` — three-platform stack with
  per-platform readiness scorecards (72/68/65)
- `szl-holdings/{counsel, terra, vessels, carlota-jo}` — domain
  product surfaces with platform-inherited governance posture
- `stephenlutar2-hash/stephenlutar2-hash` — personal profile aligned
  with public brand (TENAX→Sentra, SEXTANT→Vessels, DOMAINE→Terra,
  Amaru added)

### Releases cut
- **`szl-holdings/ouroboros` v6.0.0** — first major release, replaces
  the implicit v1.0.0 status with formal v6 ecosystem layer + gov
  readiness module manifest. URL:
  `https://github.com/szl-holdings/ouroboros/releases/tag/v6.0.0`
- **`szl-holdings/ouroboros-thesis` v2.0.0** — first formal release of
  the public thesis repo, ships v2 + v6 contract JSON together. URL:
  `https://github.com/szl-holdings/ouroboros-thesis/releases/tag/v2.0.0`

### Open PRs
- **#60** (ui-components dependabot, supersedes #59) — `@dependabot
  rebase` comment posted; awaiting next dependabot cycle to clear the
  `dirty` mergeable state.
- **#38** (Governed Python efficiency migration, codex draft) —
  unchanged; rebase request comment from prior pass still standing.

### Branch hygiene
`main` branch on `szl-holdings-platform` is divergent from default
`master` (ahead 2, behind 2423) — left as-is, not the default branch,
not safe to force-update without losing the two unique commits
(security workflows PR #27 and a docs README refresh).
