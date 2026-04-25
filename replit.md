# SZL Holdings Platform

## Overview
SZL Holdings offers FORGE, a governed operational intelligence platform for regulated enterprises. It ensures human-in-the-loop governance, immutable record-keeping, and attributable outcomes for all AI recommendations and actions. The platform is a pnpm monorepo supporting web and mobile applications, an API, and a design system. Its core purpose is Governed Workflow Orchestration (FORGE + Command + KORA) and Maritime Intelligence (SEXTANT), with specialized extensions like PARAGON, DOMAINE, Counsel, and Carlota Jo built upon its governed foundation. The business vision is to provide a comprehensive solution for decision intelligence and operational oversight in highly regulated environments, with strong market potential in sectors requiring stringent compliance and auditable AI applications.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
The platform is a pnpm monorepo using TypeScript 5.9, React 19, Vite, and Node.js. It employs a micro-frontend architecture for web applications, managed through a shared gateway proxy. The system has evolved into the FORGE Execution and Evidence Platform (AEEP).

**Core Architectural Primitives:**
- **FORGE Execution Fabric:** Provides human-in-the-loop governance, an Outcome Graph, Proof Chain for audit, and Covenant Policy for permissions.
- **Sovereign Execution Substrate (`@szl/substrate`):** A durable, governed, and replayable runtime for orchestration, planning, governance, and policy enforcement.
- **Workflow Engine:** Orchestrates durable business processes.
- **Event Fabric (PRISM Bus):** A cross-domain event bus.
- **Monte Carlo (Decision Simulation):** For probabilistic risk assessment.
- **SZL Foundation – Trace Graph:** Canonical trace layer for agent runs and workflow steps.
- **ATLAS Enterprise State Model:** Defines a shared entity vocabulary and event taxonomy.
- **Living Signal Mesh & Evidence Graph:** Unifies event/signal handling with a 9-stage pipeline and `EvidenceStore`.
- **Memory Fabric & FORGE Runtime:** Tiered memory layer with provenance, freshness, retention, and sensitivity tracking.

**Monorepo Structure:** Organized into active/archived artifacts, shared infrastructure, and packages for business observability (ATLAS), AI Control Plane, and NVIDIA-Ready Modules. Drizzle ORM manages PostgreSQL schemas.

**UI/UX and Design System (v2):** The Governed-Intelligence Design Language v2 (`@szl-holdings/design-system`) is the single visual source of truth, defining an enterprise accent palette, typography, spacing, and UI components. It adheres to strict design constraints: no neon/glow, max heading size 24px, max motion duration 200ms, and all color values referencing tokens. Authenticated product surfaces are evidence-first.

**One-of-One Platform Shell:** Unifies user interfaces across applications with shared modules, including an intelligence rail, agent run card, and command palette.

**API Layers:** Includes REST API, GraphQL API (Apollo Server), and an MCP Gateway.

**AI Infrastructure:** Features a multi-provider AI backend (OpenAI, Anthropic, Gemini), AI evaluation infrastructure, an AI Ops Dashboard, and NVIDIA-Ready Packages.

**Forge – AI Runtime, Agent Factory & Promotion Pipeline:** Manages the governed lifecycle of AI agents.

**PRAXIS – Unified Agentic AI Layer:** An internal tooling sandbox for AI agent research, memory management, skill registry, protocol bridging, and AI Control Plane features, accessible at `/nexus/`.

**KORA – Decision Intelligence:** A flagship application for executive narratives, signal feeds, and decision centers, characterized by a dark amber design language.

**AI Provenance & Explainability Contract:**
Every AI-generated output carries a `ProvenanceEnvelope` (`packages/shared-contracts/src/evidence-types.ts`) with: `runId`, `model`, `provider`, `promptHash`, `tokens`, `costEstimateUsd`, `confidence`, `sources[]`, `toolCalls[]`, `governanceVerdict`. The `buildEnvelope()` + `storeProvenance()` helpers in `lib/ai-engine/src/provenance.ts` construct and persist envelopes at each AI call site (nuro-mesh orchestrate, cross-domain-query). API endpoints: `GET /api/provenance/:runId`, `/recent`, `/stats` (authenticated). UI: `AIProvenanceBadge` + `AIProvenanceDrawer` in `lib/shared-ui`. CI check: `scripts/check-provenance-contract.ts`.

**Cross-Domain Signal Bus (Alert Bus):**
The signal bus is a when/then automation engine that routes signals across product domains. DB tables: `signal_bus_rules` (routing rules with source domain/type filters, severity gates, conditions, and action configs), `signal_bus_routed_events` (audit trail of fired rules), `signal_bus_dead_letters` (failed action executions for replay). Schema: `lib/db/src/schema/signal_mesh.ts`. API: `GET/POST /api/signal-bus/rules`, `PUT/DELETE /api/signal-bus/rules/:ruleId`, `GET /api/signal-bus/events`, `GET /api/signal-bus/dead-letters`, `GET /api/signal-bus/stats`, `POST /api/signal-bus/publish`, `POST /api/signal-bus/test-fire` (scenarios: sanctions-hit, threat-detected, lease-renewal), `POST /api/signal-bus/seed-demo-rules`. Rule engine auto-subscribes to `defaultSignalBus` on startup (`initSignalBusRuleEngine()`), evaluating all rules against every signal published through the existing signal-mesh-bridge. Action types: `open_matter`, `create_briefing_line`, `portfolio_alert`, `raise_threat`, `publish_signal`. UI: Rules Studio page in Command (`/operations/rules-studio`).

**AEEP Core Packages:**
- `shared-contracts/`: Agent roles, starter workflows, evidence/policy/retrieval/memory/provenance types.
- `agent-core/`: RunContext factory, capability resolver.
- `workflow-runtime/`: Run engine, step executor, approval gate state machine.
- `retrieval-core/`: Query planner, RRF reranker.
- `memory-core/`: In-memory store (with Redis adapter for production).
- `evidence-ledger/`: Immutable append-only ledger, ProofEnvelope assembly.
- `policy-guard/`: Rule evaluation engine, baseline rules.
- `domain-profiles/`: Definitions for KORA, SEXTANT, DOMAINE, PARAGON, Counsel, Carlota.
- `platform-metrics-registry/`: Typed metric schema, registry.

**AEEP Design System (`packages/design-system/src/`):** Includes tokens, providers (density + screen mode), hooks, shell components (AppShell, SideNav, TopBar, GlobalCommandPalette), layout components (SplitPane, SideInspector), data display (MetricStat, DataGrid), detail views, timeline components, EvidencePanel, form elements, and feedback components.

**Cognitive Consoles:** Read-only inspection surfaces within the Command app: Cognitive Command Center, Self Model Console, and World Model Graph Explorer.

**Substrate Command Center:** A cross-vertical operator UI for the governed decision substrate, integrated into the `command` artifact at `/command/substrate/`.

## Production Readiness & Audit Status

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