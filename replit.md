# SZL Holdings Platform

## Overview
SZL Holdings offers FORGE, a governed operational intelligence platform for regulated enterprises. The platform now includes **A11oy** — the Live Enterprise Execution Fabric — a governed agentic layer that senses business signals, explains their causes, recommends governed actions, executes them in Workcells, and records cryptographic proof of every step. It ensures human-in-the-loop governance, immutable record-keeping, and attributable outcomes for all AI recommendations and actions. The platform is a pnpm monorepo supporting web and mobile applications, an API, and a design system. Its core purpose is Governed Workflow Orchestration (FORGE + Command + KORA) and Maritime Intelligence (SEXTANT), with specialized extensions like PARAGON, DOMAINE, Counsel, and Carlota Jo built upon its governed foundation. The business vision is to provide a comprehensive solution for decision intelligence and operational oversight in highly regulated environments, with strong market potential in sectors requiring stringent compliance and auditable AI applications.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
The platform is a pnpm monorepo built with TypeScript 5.9, React 19, Vite, and Node.js. It employs a micro-frontend architecture for web applications managed through a shared gateway proxy and has evolved into the FORGE Execution and Evidence Platform (AEEP).

**Core Architectural Primitives:**
- **FORGE Execution Fabric:** Provides human-in-the-loop governance, an Outcome Graph, Proof Chain, and Covenant Policy.
- **Sovereign Execution Substrate (`@szl/substrate`):** A durable, governed, and replayable runtime for orchestration, planning, governance, and policy enforcement.
- **Workflow Engine:** Orchestrates durable business processes.
- **Event Fabric (PRISM Bus):** A cross-domain event bus.
- **Monte Carlo (Decision Simulation):** For probabilistic risk assessment.
- **SZL Foundation – Trace Graph:** Canonical trace layer for agent runs and workflow steps.
- **ATLAS Enterprise State Model:** Defines a shared entity vocabulary and event taxonomy.
- **Living Signal Mesh & Evidence Graph:** Unifies event/signal handling with a 9-stage pipeline and `EvidenceStore`.
- **Memory Fabric & FORGE Runtime:** Tiered memory layer with provenance, freshness, retention, and sensitivity tracking.

**Monorepo Structure:** Organizes active/archived artifacts, shared infrastructure, and packages for business observability (ATLAS), AI Control Plane, and NVIDIA-Ready Modules. Drizzle ORM manages PostgreSQL schemas.

**UI/UX and Design System (v2):** The Governed-Intelligence Design Language v2 (`@szl-holdings/design-system`) is the single visual source of truth, defining an enterprise accent palette, typography, spacing, and UI components. It adheres to strict design constraints (e.g., no neon/glow, max heading size 24px, max motion duration 200ms) and ensures all authenticated product surfaces are evidence-first.

**One-of-One Platform Shell:** Unifies user interfaces across applications with shared modules like an intelligence rail, agent run card, and command palette.

**API Layers:** Includes REST API, GraphQL API (Apollo Server), and an MCP Gateway.

**AI Infrastructure:** Features a multi-provider AI backend, AI evaluation infrastructure, an AI Ops Dashboard, and NVIDIA-Ready Packages.

**Forge – AI Runtime, Agent Factory & Promotion Pipeline:** Manages the governed lifecycle of AI agents.

**Precision Evolution Runtime (PER):** A governed, evidence-gated system for continuously evolving agent policies. Full lifecycle: candidate registration → calibration → evaluation → drift-checked promotion → canary rollout → immutable audit. Defaults to simulation mode (`EVOLUTION_MODE=simulation`). Package: `@szl-holdings/evolution-core`. API: 14 endpoints at `/api/evolution/*`. UI: 4 pages in Command at `/evolution/*`. DB: 10 tables in `lib/db/src/schema/precision_evolution.ts`. Docs: `docs/PRECISION_EVOLUTION_ARCHITECTURE.md` and associated files. Tests: 55 unit tests in `packages/evolution-core/src/__tests__/`.

**PRAXIS – Unified Agentic AI Layer:** An internal tooling sandbox for AI agent research, memory management, skill registry, protocol bridging, and AI Control Plane features, accessible at `/nexus/`.

**KORA – Decision Intelligence:** A flagship application for executive narratives, signal feeds, and decision centers, characterized by a dark amber design language.

**AI Provenance & Explainability Contract:** Every AI-generated output carries a `ProvenanceEnvelope` with essential metadata (`runId`, `model`, `provider`, `promptHash`, `tokens`, `costEstimateUsd`, `confidence`, `sources[]`, `toolCalls[]`, `governanceVerdict`). This is constructed and persisted at each AI call site, with dedicated API endpoints for retrieval and UI components for display.

**Cross-Domain Signal Bus (Alert Bus):** A "when/then" automation engine routing signals across product domains. It uses `signal_bus_rules` for routing, `signal_bus_routed_events` for audit, and `signal_bus_dead_letters` for failed actions. An `initSignalBusRuleEngine()` evaluates rules against published signals, triggering actions like `open_matter`, `create_briefing_line`, etc. A Rules Studio in the Command app (`/operations/rules-studio`) provides a UI.

**AEEP Core Packages:**
- `shared-contracts/`: Agent roles, starter workflows, evidence/policy/retrieval/memory/provenance types.
- `agent-core/`: RunContext factory, capability resolver.
- `workflow-runtime/`: Run engine, step executor, approval gate state machine.
- `retrieval-core/`: Query planner, RRF reranker, **RetrievalSpecialist** (Phase 4: two-stage embedding + reranker pipeline with provider-adapter slots).
- `aef-retrieval-core/`: AEF retrieval adapters, fusion, boost, citations, normalize, rerank, **multimodal** (Phase 4: per-modality meta builders, score weights, text extraction for screenshots/diagrams/audio).
- `memory-core/`: In-memory store (with Redis adapter for production).
- `memory-fabric/`: Tiered memory with provenance/freshness/retention. **ScopedMemoryManager** (Phase 4: four governed scopes — session, domain, executive, compliance — with explicit read/write contracts and retention semantics).
- `evidence-ledger/`: Immutable append-only ledger, ProofEnvelope assembly.
- `policy-guard/`: Rule evaluation engine, baseline rules.
- `domain-profiles/`: Definitions for KORA, SEXTANT, DOMAINE, PARAGON, Counsel, Carlota.
- `platform-metrics-registry/`: Typed metric schema, registry.

**Phase 4 — Retrieval & Memory:**
- **Two-stage retrieval pipeline:** `packages/retrieval-core/src/retrieval-specialist.ts` — `RetrievalSpecialist` class with Stage 1 (embedding + optional keyword, RRF fusion) and Stage 2 (cross-encoder adapter slot with CPU term-overlap fallback). Emits a `RetrievalProofChain` capturing all provenance.
- **Multimodal retrieval:** `packages/aef-retrieval-core/src/multimodal.ts` — text, screenshot, diagram, audio_transcript modalities with metadata builders (`buildScreenshotMeta`, `buildDiagramMeta`, `buildAudioTranscriptMeta`), per-modality rerank weights, and `extractEmbeddingText` for embedding-input extraction.
- **Scoped memory:** `packages/memory-fabric/src/scoped-memory.ts` — `ScopedMemoryManager` with `SessionScopedStore` (ephemeral, clears on session end), `DomainScopedStore` (domain-tagged, 90-day TTL), `ExecutiveScopedStore` (consolidated domain, 90-day TTL), `ComplianceScopedStore` (append-only, 7-year retention, immutable).
- **Shared contracts extensions:** `packages/shared-contracts/src/retrieval-types.ts` — added `RetrievalModality`, `ModalityMeta` union, modality-specific meta interfaces, `RankedEvidenceItem`, `RetrievalProofChain`; `packages/shared-contracts/src/memory-types.ts` — added `GoverningMemoryScope`, `GOVERNED_SCOPE_RETENTION`, `GOVERNED_SCOPE_READ_ROLES`, `GOVERNED_SCOPE_WRITE_ROLES`.
- **Proof-chain viewer:** `packages/design-system/src/proof/ProofChainViewer.tsx` — functional component showing query, strategy, modality badges, model provenance pills, ranked evidence rows with embedding/reranker score bars and confidence deltas. Exported from `@szl-holdings/design-system/proof`.
- **Operator surface:** `artifacts/command/src/pages/retrieval-proof-chain.tsx` — live retrieval explorer at `/command/operations/retrieval/proof-chain`. Registered in Command's nav under Counsel group.

**AEEP Design System (`packages/design-system/src/`):** Includes tokens, providers (density + screen mode), hooks, shell components (AppShell, SideNav, TopBar, GlobalCommandPalette), layout components (SplitPane, SideInspector), data display (MetricStat, DataGrid), detail views, timeline components, EvidencePanel, form elements, and feedback components.

**Cognitive Consoles:** Read-only inspection surfaces within the Command app: Cognitive Command Center, Self Model Console, and World Model Graph Explorer.

**Forecast & Anomaly Fabric (Phase 5):**
- `packages/forecast-fabric` — Unified forecasting service with 27 named heads across 7 lanes (lyte, aegis, vessels, terra, counsel, carlota-jo, imperium). Provides calibrated interval outputs (point + lower/upper + confidence), provider-adapter slots (swap-ready; ships with SafeDefaultAdapter), head registry, and per-lane batch invocation. Entry point: `createForecastService()`.
- `packages/anomaly-fabric` — Unified streaming and batch anomaly detection service with a single shared contract. Streaming uses rolling-window z-score analysis; batch uses per-metric outlier + KL-divergence distribution-shift detection. Entry point: `globalAnomalyService`.
- `packages/drift-eval` — Drift detection (performance drift against baseline snapshots) and champion-vs-challenger evaluation jobs. Persists results to `InMemoryEvalRegistry` (swap-ready for DB-backed registry). Includes `startDriftEvalScheduler()` for scheduled execution. Entry point: `globalEvalRegistry`, `detectDrift()`, `runChampionChallenger()`.
- Each lane surface (lyte-command-center, sentra, vessels, terra, counsel, carlota-jo) has a `ForecastPanel` component wired to a `/forecast` route showing calibrated interval bars with confidence, threshold indicators, anomaly flags, and full provenance metadata. Phase 6 will handle the visual overhaul.

**Substrate Command Center:** A cross-vertical operator UI for the governed decision substrate, integrated into the `command` artifact at `/command/substrate/`.

**Email Deliverability:** All outbound transactional email uses `artifacts/api-server/src/lib/email.ts`. Features include a suppression list in `email_suppressions` table, automatic suppression via bounce/complaint webhooks (SendGrid, Resend), unsubscribe links, and admin routes for management.

**Last audited:** April 22, 2026  
**Status:** Demo-ready. Pre-commercial. No critical gaps; 5 HIGH gaps block first paying tenant.

**Key audit documents:**
- `docs/audit/inventory.md` — Per-artifact route inventory (route → data source → status → disposition)
- `docs/audit/report.md` — Consolidated audit report (what's real, fixed, removed, behind DEMO_MODE)
- `docs/audit/GAP_MATRIX.md` — Open gap register with severity and acceptance tests
- `docs/ops/gap-register.md` — P0–P2 gap register with per-gap details
- `docs/demos/` — Per-artifact demo scripts (one per artifact, includes avoidance guide)

**HIGH gaps — full list in `docs/audit/report.md` and `docs/audit/GAP_MATRIX.md`:**

*Credential-only (feature-flagged OFF; zero code change needed to activate):*
1. `STRIPE_SECRET_KEY` (sk_live_) — live billing
2. `RESEND_API_KEY` — email delivery
3. `OTEL_EXPORTER_OTLP_ENDPOINT` + `SENTRY_DSN` — production observability
4. `MAPBOX_ACCESS_TOKEN` / `VITE_MAPBOX_TOKEN` — map tile rendering
5. `AIS_API_KEY` — live vessel positions

*Code/infrastructure changes required:*
6. MFA on investor data room (P1-007)
7. Firebase credential rotation in mobile build (P0-001)
8. `ALLOY_INTERNAL_TOKEN` scope restriction (GAP-016)
9. Persistent message queue for background jobs (GAP-017)

**Already closed:** Tenant scoping (all Vessels routes), SSRF protection (webhooks), seed-overwrite protection, session store in PostgreSQL, Zod validation at 84%, route auth CI enforcement.

## Email Deliverability

All outbound transactional email goes through `artifacts/api-server/src/lib/email.ts`. Key features added:

- **Suppression list:** `email_suppressions` table in PostgreSQL. `sendEmail` checks this before every delivery and skips suppressed addresses.
- **Bounce/complaint webhooks:** `POST /api/email-webhooks/sendgrid` and `POST /api/email-webhooks/resend` auto-add bounced/complained addresses to the suppression list. Both routes are public and exempt from CSRF + auth.
- **Unsubscribe:** `GET /api/email/unsubscribe?e=<email>&t=<hmac>` validates a per-recipient HMAC token and adds the address to the suppression list.
- **Admin routes** (require `admin` role): `POST /admin/email/test-send`, `GET/POST/DELETE /admin/email/suppressions`, `GET /admin/email/suppressed/:email`.
- **DB:** Uses a dedicated `pg.Pool` instance (`PgPool` from `@szl-holdings/db`) for suppression queries — separate from the main instrumented pool to avoid the async observability import hang on the monkey-patched `pool.query`.
- **DKIM/SPF/DMARC:** DNS setup instructions documented in `docs/email-deliverability.md`.
- **Migration:** `lib/db/drizzle/0101_email_suppressions.sql` creates the table idempotently.

## Mobile Biometric Sign-In (SZL Holdings Mobile)

Biometric sign-in is implemented as a real server-side authentication factor with cryptographic proof-of-possession (not just an app lock).

**Architecture:**
- `lib/db/src/schema/auth.ts` — `deviceBiometricBindingsTable` (device registrations with 90-day TTL), `stepUpAssertionsTable` (step-up claims with `bindingId` FK, 5-min TTL), `biometricChallengesTable` (one-time server nonces, 60s TTL)
- `artifacts/api-server/src/routes/mobile-biometric.ts` — REST endpoints: `POST /mobile-biometric/challenge` (issues nonce), `POST /mobile-biometric/enroll` (requires auth), `POST /mobile-biometric/authenticate` (PoP flow), `GET /mobile-biometric/status`, `DELETE /mobile-biometric/binding`, `POST /mobile-biometric/step-up` (requires auth + fresh biometric), `DELETE /mobile-biometric/bindings/all`; exports `requireStepUp` middleware
- `artifacts/szl-holdings-mobile/context/BiometricSignInContext.tsx` — React context with `enroll`, `signIn`, `revoke`, `revokeLocal`, `performStepUp`, `checkEnrollment`; binding token stored in SecureStore; biometric proof computed via `expo-crypto` SHA-256
- `BiometricSignInProvider` is mounted in `_layout.tsx` inside `AuthProvider`

**Proof-of-possession formula (client + server must match exactly):** `SHA-256(bindingToken + ":" + nonce)` — lowercase hex. The binding token NEVER travels over the wire after enrollment; only the proof is sent. Server verifies using `crypto.timingSafeEqual`.

**Auth flow:** OIDC login → enroll device (server issues `bindingToken`, stored in SecureStore) → subsequent logins: `POST /challenge` for nonce → local biometric prompt → `computeProof(bindingToken, nonce)` → `POST /authenticate` with `{challengeId, deviceId, proof}` → server returns full session token pair. If binding invalid/revoked, client clears all biometric SecureStore keys (`ALL_BIOMETRIC_SIGNIN_KEYS`) and falls back to OIDC.

**Sign-out clears biometric keys:** `AuthContext.wipeAuth()` calls `SecureStore.deleteItemAsync` for all `ALL_BIOMETRIC_SIGNIN_KEYS` on sign-out and session revocation (native only; web no-op).

**`AuthContext` additions:** `loginWithTokens(StoredTokens)` (used by biometric sign-in to hydrate session after authenticate), `getAccessToken()` (exposes current token for enrollment calls).

**UI:**
- `app/auth.tsx` — shows "Sign In with Face ID / Touch ID" button above OIDC login when device is enrolled and biometric hardware is available; graceful fallback to OIDC if biometric fails
- `app/(shell)/settings/security.tsx` — biometric sign-in toggle (enroll / revoke), shows enrollment date, plus existing app-lock and screenshot protection settings

**Step-up enforcement:**
- `requireStepUp` middleware exported from `mobile-biometric.ts`; checks `X-Step-Up-Token` header against `stepUpAssertionsTable`, validates session binding, consumes (marks `usedAt`) on success
- Applied to `POST /approvals/:id/escalate` (high-risk mutation) as a reference protected route

**Tests:** `artifacts/api-server/src/__tests__/mobile-biometric.test.ts` — 22 tests covering challenge issuance (400 validation), enrollment (400 for bad inputs), authenticate (proof mismatch → 401, replay → 401, valid proof → 200), step-up (no binding → 403, correct proof → 200), `requireStepUp` middleware (missing header → 403 STEP_UP_REQUIRED, invalid token → 403 STEP_UP_INVALID, valid token → 200 + usedAt set), binding revocation, and status listing.

## A11oy — Live Enterprise Execution Fabric

**Artifact:** `artifacts/a11oy` — web app at `/a11oy/`, port 9090

A11oy is a new governed agentic platform layer that sits between enterprise data and enterprise decisions. Phase 1 delivers the full foundation: TypeScript schema, seven-layer in-memory fabric, 32-signal demo seed, and read-side REST API.

**Seven Fabric Layers (in-memory, Phase 1):**
1. Coverage Graph — domain completeness tracking
2. Signal Mesh — ingestion and routing (currently degraded: P95 latency 340ms)
3. State Engine — authoritative enterprise state
4. Causal Core — causal reasoning and explanation
5. Action Rail — governed action recommendation
6. Covenant Layer — policy evaluation and enforcement
7. Proof Ledger — cryptographic proof recording

**Demo Seed:** 32 business signals across 7 verticals (lyte-revenue: 6, vessels-maritime: 6, terra-real-estate: 5, aegis-defense: 4, prism-counsel: 4, carlota-jo: 4, alloy-core: 3); 5 outcomes, 5 policies, 5 proof packets, 5 workcells.

**API Endpoints (all public, read-only in Phase 1):**
- `GET /api/a11oy/now` — current summary
- `GET /api/a11oy/signals` — signals (filter by vertical, severity, status)
- `GET /api/a11oy/signals/:id` — signal by ID
- `GET /api/a11oy/outcomes` — active outcomes
- `GET /api/a11oy/actions` — recommended actions
- `GET /api/a11oy/proof` — proof packets
- `GET /api/a11oy/proof/:entityId` — proof for entity
- `GET /api/a11oy/governance` — covenant policies
- `GET /api/a11oy/verticals` — verticals
- `GET /api/a11oy/fabric` — fabric layer health
- `GET /api/a11oy/workcells` — workcells
- Mutating routes (approve, execute, run) return 501 in Phase 1

**Source files:**
- `artifacts/a11oy/src/a11oy/core/` — types.ts, constants.ts, terminology.ts, demoMode.ts
- `artifacts/a11oy/src/a11oy/schema/index.ts` — all TypeScript interfaces + Zod validators
- `artifacts/a11oy/src/a11oy/fabric/` — seven layer implementations
- `artifacts/a11oy/src/a11oy/demo/` — seed data
- `artifacts/api-server/src/routes/a11oy-fabric-api.ts` — REST route handlers

**Root docs:** `AGENTS.md`, `CONTEXT.md`, `llms.txt` (all at project root)

## Onboarding Stall Alerts
Automated proactive alerts when organizations get stuck mid-onboarding. A daily scheduled job (`daily_onboarding_stall_check`) scans `onboarding_wizard_state` for orgs where `completed_at IS NULL`, `completed_steps` is non-empty, and `updated_at` is older than a configurable threshold. Threshold defaults to 3 days, configurable via `ONBOARDING_STALL_THRESHOLD_DAYS` env var or job payload override. Sends in-app notifications (with WebSocket push) and external alerts (Slack/email/SMS via `queueExternalAlert`) to all super_admin and admin users.

**Files:**
- `artifacts/api-server/src/jobs/onboarding-stall-check.ts` — core stall-check logic
- `artifacts/api-server/src/lib/scheduled-jobs.ts` — `DAILY_ONBOARDING_STALL_CHECK` job type and handler
- `artifacts/api-server/src/lib/durable-init.ts` — cron schedule (`0 9 * * *`)
- `artifacts/api-server/src/routes/admin/onboarding.ts` — admin endpoints

**Admin API Endpoints:**
- `GET /api/admin/onboarding-stalled` — list stalled orgs (query param: `thresholdDays`)
- `POST /api/admin/onboarding-stall-check` — manually trigger stall check and notify admins (body: `{ thresholdDays?: number }`)

## Known Platform Issues
- **Command workflow port detection:** Replit workflow system intermittently fails to detect port 5000 opening within timeout. Vite starts correctly (confirmed by logs). The telemetry initialization was fixed to gracefully handle invalid OTEL endpoint placeholders (see `artifacts/command/src/telemetry.ts`).
- **Expo CORS:** szl-holdings-mobile has "Unauthorized request" errors from Expo CLI CORS middleware in Replit's proxy environment. Not a code bug.
- **Vite WebSocket HMR:** All artifacts show WS connection refused to `ws://localhost:443`. Expected behavior in Replit iframe proxy environment; does not affect functionality.

## External Dependencies
-   **Database:** PostgreSQL 16
-   **Authentication:** Replit Auth
-   **Payment Processing:** Stripe
-   **AI Providers:** OpenAI, Anthropic, Gemini, HuggingFace Inference API, Elevenlabs
-   **Communication:** Slack, Twilio, Resend, SendGrid
-   **Maritime Data:** MarineTraffic, AISHub, Digitraffic AIS, BarentsWatch AIS, Open-Meteo Marine Weather
-   **Threat Intelligence:** STIX/TAXII, AlienVault OTX, MISP OSINT, OFAC SDN, EU Consolidated List, UN Security Council, Shodan, GreyNoise, MalwareBazaar
-   **Government Data:** CISA KEV, NVD CVE, MITRE ATT&CK, Census/BLS, FEMA NRI, NYC Open Data, SEC EDGAR
-   **Legal Data:** CourtListener REST API
-   **Other APIs/Services:** GitHub API, Figma, Google APIs, HubSpot