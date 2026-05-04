# Changelog

All notable changes to the SZL Holdings platform ecosystem are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).  
See `/docs/releases/versioning-policy.md` for the full versioning policy.

> **This file is updated automatically** by the release workflow on every tagged release.  
> Entries are generated from [conventional commits](https://www.conventionalcommits.org/) and categorised into Breaking Changes, Features, Bug Fixes, and Other Changes with links to individual commits.  
> Do not edit versioned entries manually — edit the `## [Unreleased]` section only.

---

## Rehaul 9/9 — CI Cleanup, Scope Rationalization & Investor Readiness Closeout — 2026-04-27

### Fixed

- **`uptime-monitor.yml`**: Changed cron schedule from `* * * * *` (every 1 minute = 1,440 GitHub Actions runs/day) to `*/5 * * * *` (every 5 minutes = 288 runs/day). The every-minute schedule was burning ~5× the necessary Actions minutes with no SLA benefit — 12 health checks per hour is well above any reasonable uptime detection requirement.

### Added

**CI Audit**
- `audit/ci/workflow-audit.md` — Per-workflow classification for all 25 `.github/workflows/` files: purpose, trigger, signal quality, required-status status, and action taken. All 24 workflows retained; 1 fixed.
- `audit/ci/workflow-status-matrix.md` — Current pass/fail status matrix with last-known result per workflow. Branch protection assumptions documented.

**Release Readiness**
- `audit/release/alpha-release-readiness.md` — Documents the `pnpm release:alpha` gate (`scripts/release/alpha.sh`), current v1.0.0-alpha release state, release checklist status, known gaps at alpha, and v1.1.0 criteria.

**Strategy Matrices**
- `audit/strategy/active-vs-defer-matrix.md` — Artifact-by-artifact classification: Flagship, Supporting, Internal Only, Deferred, Archived, Concept. Defines public claim surface.
- `audit/strategy/public-focus-recommendation.md` — Investor messaging hierarchy: Tier 1 (lead with), Tier 2 (domain-specific), Tier 3 (explicit disclosure), Tier 4 (do not demo). Core messaging discipline.
- `audit/strategy/non-core-scope-reduction-plan.md` — Concrete scope reduction actions: immediate (hours), medium-term (30 days), and deferred (post-growth capital).

**Final Readiness Scorecards**
- `audit/final/executive-rehaul-summary.md` — Single executive summary of all Rehaul phases 1–9: what was verified, what was fixed, what remains open. Platform verdict: **Operational Alpha**.
- `audit/final/top-25-risks-and-gaps.md` — Brutally honest enumeration of the 25 highest-risk items ranked by severity × diligence likelihood. Each item has severity, status, and mitigation plan.
- `audit/final/what-was-fixed.md` — Complete record of every fix applied across the Rehaul program (visual, CI, bugs, architecture, CI phase 9).
- `audit/final/what-remains-unverified.md` — Honest accounting of claims and features that have NOT been independently verified in this cycle. Includes action required before growth capital diligence.
- `audit/final/series-a-surface-scorecard.md` — Per-artifact 1–5 scoring across three lenses (Enterprise Buyer, Technical Diligence, Investor Signal). Overall platform score: **4.1/5 — Fundable at growth capital with honest alpha positioning.**

---

## [Unreleased]

### Changed
- **Alloy → Continuum rebrand (Task #3196):** The governed agentic execution layer previously known as "Alloy" / "Alloy Execution Fabric" / "AEEP" is now **Continuum — Business Observability Fabric**. The rename is brand-deep and behavior-preserving — architecture, governance primitives, Outcome Graph, Proof Chain, and Covenant Policy are unchanged. Code identifiers updated: `@workspace/alloy` → `@workspace/continuum`, `aef-*` → `cf-*`, `useAlloyWebSocket` → `useContinuumWebSocket`, `ALLOY_INTERNAL_TOKEN` → `CONTINUUM_INTERNAL_TOKEN`, GraphQL domain `alloy.ts` → `continuum.ts`, mobile routes `portfolio/alloy` → `portfolio/continuum`. DB table renames applied via new migration.

### Fixed
- **`artifacts/api-server`**: path-scoped the top-level `authMiddleware` / `tenantScope` guards in 13 sub-router files (`agent-autonomy`, `ontology`, `briefings`, `booking`, `drift`, `domains`, `imperium`, `graph`, `forge`, `nuro-mesh-advanced`, `connectors`, `alloy-skills`, `alloy-governance`) so the guards only run for the path each file owns. Previously the unprefixed `router.use(authMiddleware())` / `router.use(tenantScope({ required: true }))` at the top of each file executed for **every** request that reached the parent router under the shared `lazyMatch` prefix, silently 401/403'ing unrelated public sibling routes (the same footgun that produced the original Carlota Jo `/booking/time-entries` outage and tasks #718, #1329). New `artifacts/api-server/src/routes/__tests__/sub-router-middleware-path-scope.test.ts` and a "Sub-router middleware path-scoping" rule in the api-server README lock this in for future contributors.
- **`artifacts/command`**: workflow flap on cold-start (`DIDNT_OPEN_A_PORT 5000`). Root cause: `localPort` matched `VITE_PORT` (5000) so the shared proxy plugin and Vite raced for the same port. Aligned to the standard pattern (`localPort = 9090`, `VITE_PORT = 5000`).

### Added
- **Approvals**: high- and critical-priority approvals created via `POST /approvals` now trigger a best-effort mobile push to all org approvers (`super_admin`, `admin`, `ops`, `compliance`) with active mobile push tokens. Notification deep-links to the Quick Actions screen (`/(shell)/quick-actions`). Honors per-user `alerts_approvals_enabled` and quiet-hours preferences (critical bypasses quiet hours). The push fans out across the entire CORTEX mobile app-id family (`cortex-mobile`, `cortex-advisory`, `aegis-mobile`, `lyte-mobile`, `terra-mobile`, `stephen-mobile`) so an approver is reached on whichever workspace they last registered a token from. Implemented via new `sendPushToOrgApprovers` helper + `CORTEX_MOBILE_APP_IDS` constant in `artifacts/api-server/src/lib/expo-push.ts`. Mobile deep-link routing added to `defense/usePushNotifications.ts` (the default consumed by `szl-holdings-mobile`). Covered by 13 vitest cases across `approvals-org-approver-push.test.ts` (helper-level: fan-out, app-id family default, preference suppression, empty roster, severity passthrough, per-user error isolation, custom app-id override) and `approvals-route-push-wiring.test.ts` (route-level: HIGH and CRITICAL fire, LOW/MEDIUM skip, no-org skip, push-error best-effort isolation).

### In Progress
- Revenue activation (Stripe billing live for Vessels, Lyte, Terra, Carlota Jo)
- Enterprise SSO / SCIM 2.0 provisioning
- OpenAPI developer portal
- Redis session store for production deployments
- Sentry error tracking integration

---

## Track 6 — Zero-Gap: Screenshots, README, Release & Executive Summary — 2026-04-21

### Added

**Screenshots — Approved Set**
- `screenshots/approved/` — 10 verified post-redesign screenshots captured live from running artifact dev servers (2026-04-21)
- Surfaces: SZL Holdings (home, ecosystem, trust), Sentra, Vessels, Counsel, Terra, Carlota Jo, Pulse (auth gate), Aegis
- All shots from live surfaces, post Governed-Intelligence Design System v2 redesign
- `audit/screenshot-catalog.md` — full metadata catalog: filename, surface, URL, environment, data status, notes; disposition decisions for the 100+ legacy screenshots in `screenshots/`

**Audit Deliverables**
- `audit/final-executive-summary.md` — comprehensive Track 1–6 executive summary; four mandatory sections (verified working, what was fixed, not verified, production blockers); every claim labeled VERIFIED / CODE-CONFIRMED / OPEN
- `audit/deployment-proof.md` — explicit deployment state (not deployed; 8 artifact dev servers running, 1 failed (command — startup timeout), 5 not started); exact secrets required for production deployment; health evidence table

### Fixed

- **README** — Removed misleading `![Aegis Command]` screenshot reference (pointed to archived Firestorm/defense surface; Aegis is now the investor pitch deck). Added screenshot context note linking to `audit/screenshot-catalog.md` and `audit/deployment-proof.md`.
- **`artifacts/szl-holdings/public/opengraph.jpg`** — Refreshed to reflect Design System v2 branding (2026-04-21). Social card now matches the current SZL Holdings home surface.

---

## [1.0.0-alpha] — 2026-04-20

First public alpha release. Tagged on the public `szl-holdings/szl-holdings-platform` repo and published to the [Releases page](https://github.com/szl-holdings/szl-holdings-platform/releases/tag/v1.0.0-alpha) as the first shipping-cadence signal for outside reviewers.

### Active Artifact Count
- **14 registered artifacts** in the monorepo across web, mobile, video, and design surfaces: SZL Holdings dashboard, Aegis (investor pitch deck), Vessels (maritime intelligence), Terra (real estate intelligence), Pulse (executive briefing), Sentra (cyber resilience), Counsel (legal matter command), Carlota Jo Consulting, Unified Command, Lyte Decision Intelligence, NEXUS sandbox, SZL Holdings mobile command, the governed-autonomy demo video, and the API server.

### Platform Primitives
The six structural primitives that differentiate this platform from dashboards, copilots, and workflow tools:

1. **Outcome Graph** — closed-loop tracking from recommendation to decision to outcome
2. **Proof Chain** — immutable, verifiable audit trail with provenance on every AI output
3. **Covenant Policy** — human-in-the-loop enforced at the policy layer; AI cannot bypass it
4. **Decision Simulation** — probabilistic simulation with confidence intervals before action
5. **Workflow Engine** — durable multi-step orchestration with agent coordination
6. **Event Fabric** — cross-domain signal backbone normalizing and correlating events across domain packs

### Key Milestones
- **Sovereign Execution Substrate Phase 1** (`@szl/substrate`) landed: policy-shaped graph compiler, retry/timeout engine, hash-stable evidence-chained Journal, confidence-budget routing, OpenTelemetry layer, and a Python worker channel
- **Trust posture** in place on the public repo: pinned-SHA CodeQL, Dependabot (weekly, grouped), Gitleaks scheduled scan, secret-scanning + push protection, branch protection on `main`/`master`, signed `SECURITY.md` and `CONTRIBUTING.md`
- **Phase D public-readiness audit** shipped (`audit/investor/public-readiness-scorecard.md`) covering thesis, architecture, trust, screenshots, setup, hygiene, releases, leak/clutter, org-profile coherence, and cross-document claim consistency
- **Cross-document fact base** under `docs/platform-facts.md` (machine-generated; do not hand-edit)

### Known Limitations
- Stripe revenue activation live for a subset of domain packs only — full rollout in progress
- Enterprise SSO / SCIM 2.0 provisioning, OpenAPI developer portal, Redis session store, and Sentry error tracking are listed under `## [Unreleased]` and not yet GA
- Some README screenshots reflect design state and should be re-captured against the live UI once all workflows are running
- Investor carousel under `demo-assets/` is flagged for migration to a private channel

### Reference
- Architecture: `docs/architecture/architecture.md`
- Platform Primitives: `docs/architecture/platform-primitives.md`
- Trust Center: `docs/trust/trust-center.md`
- Versioning policy: `docs/releases/versioning-policy.md`
- Release workflow: `.github/workflows/release.yml`

_This is an alpha prerelease. APIs, schemas, and policy contracts may change before `v1.0.0`._

---

## Task #2390 — Sovereign Execution Substrate Phase 1 — 2026-04-19

### Added

**`@szl/substrate` — New Core Package**

- `packages/substrate/` — Sovereign Execution Substrate: the single, opinionated execution runtime that all SZL product surfaces call the same way (`defineWorkflow` + `runtime.start`)
- Five stage primitives: `Reason()`, `Retrieve()`, `ToolCall()`, `Verify()`, `Decide()` + `ApprovalGate()` for policy-shaped graph topology
- Four execution modes: `live`, `dry-run`, `replay`, `counterfactual`
- `defineWorkflow()` / `definePolicy()` / `defineBudget()` builder API

**Compiler — Policy-Shaped Graph Enforcement**

- `compiler.ts` — Policy-shaped graph compiler that rejects at build time any workflow where a high-risk side effect (`financial`, `deletion`, `write-external`, `infrastructure`) is reachable without a matching `ApprovalGate` ancestor
- Topological sort (Kahn's algorithm) with cycle detection and unknown-dependency rejection
- Compiler warnings for missing `Verify` and `Decide` stages

**Engine — Execution Engine**

- `engine.ts` — Full execution engine with timeouts, exponential-backoff retries, full hook set (15 hooks), OTel telemetry, and approval gate pause/resume
- Hook set: `before/after_pipeline`, `before/after_stage`, `on_validation_error`, `on_policy_violation`, `on_low_confidence`, `before/after_tool_call`, `before/after_side_effect`, `before/after_finalize`

**Journal — Evidence-Chained Audit Log**

- `journal.ts` — Hash-stable evidence bundles (SHA-256 canonical JSON) linked into proof-chain; the journal IS the audit log
- `SubstrateJournal.verifyReplayStability()` for hash-identity verification across replays

**Budget Router — Confidence-Budget Routing**

- `budget-router.ts` — Declarative confidence-budget routing: `accept` / `escalate-model` (stronger adapter) / `escalate-human` (approvals inbox)
- Weighted harmonic mean pipeline confidence aggregation (Decide: 3×, Verify: 2.5×, Reason: 2×)

**Adapters — MCP-Shaped Registries**

- `adapters.ts` — Typed registries for Model, Retriever, Tool, Resource, and Policy adapters with MCP-shaped capability specs
- No-op defaults for dry-run and testing; `wireToolMeshAdapter()` / `wirePolicyEngineAdapter()` for production wiring

**Telemetry — OpenTelemetry Layer**

- `telemetry.ts` — OTel spans, metrics, and structured logs for every stage and pipeline lifecycle event; bridges to `@workspace/cognitive-observability`

**Python Worker Channel**

- `python-worker.ts` — Typed wire protocol (v1.0) for Python worker federation: `stage.claim`, `stage.heartbeat`, `stage.result`, `stage.error`
- In-process simulation for Phase 1; real FastAPI worker deferred to Phase 2
- `workers/substrate-python/` — Phase 1 reference Python worker (FastAPI + Pydantic v2) implementing the full protocol

**Reference Workflow**

- `workflows/opportunity-audit.ts` — Opportunity Audit as the Phase 1 reference workflow: `Retrieve(python-tagged)` → `Reason` → `Verify` → `ApprovalGate` → `Decide`, wired to Lyte domain

**Replay + Counterfactual CLI**

- `cli/replay.ts` — `replay()` + `handleReplayRequest()` typed API endpoint; `formatDiff()` text formatter for CLI output
- `CounterfactualDiff` builder with per-stage decision diff and final confidence delta

**API Server Integration**

- `artifacts/api-server/src/routes/control-tower/substrate-replay.ts` — Three new endpoints:
  - `POST /control-tower/substrate/replay` — trigger replay or counterfactual run
  - `GET /control-tower/substrate/run/:runId` — poll run status
  - `GET /control-tower/substrate/metrics` — aggregate telemetry metrics

**Documentation**

- `docs/substrate/architecture.md` — Architecture overview with Mermaid sequence diagrams
- `docs/substrate/policy-model.md` — Policy model, compiler enforcement, approval tier ladder
- `docs/substrate/evidence-chain.md` — Evidence chain hash stability and proof-chain integration
- `docs/substrate/replay-counterfactual.md` — Replay modes, counterfactual diff format, Eval Console integration
- `docs/substrate/python-worker.md` — Python worker protocol, message types, startup guide

**Tests**

- `src/compiler.test.ts` — 9 compiler tests (rejection cases, cycle/unknown-dep/duplicate detection, execution ordering, warnings)
- `src/engine.test.ts` — 6 engine integration tests (dry-run, live, journal hash stability, compiler rejection, hook firing, Opportunity Audit)

---

## [0.1.1] — 2026-04-03

### Workspace Professionalization & Ops Discipline

### Added

**Workspace Documentation**
- `WORKSPACE_GUIDE.md` — complete guide to all artifacts, public/private classification, how to run, deploy, demo
- `REPLIT_OPERATIONS.md` — operational guide for the Replit development environment
- `DEPLOYMENT_READINESS.md` — pre-deployment checklists for public, private, and production deployments
- `DEMO_GUIDE.md` — demo scripts, audience-specific flows, live vs. staged data guide
- `ROUTE_INVENTORY.md` — complete route inventory with PUBLIC/PRIVATE/INTERNAL/STAGING flags
- `ENV_MATRIX.md` — complete environment variable reference for all services and environments
- `TRUST_CENTER_INDEX.md` — navigational index for all trust and security documentation
- `ANALYTICS_PLAN.md` — event taxonomy, measurement objectives, funnel tracking
- `SEO_MAP.md` — all public routes with title, description, and OG tag specifications
- `EVENT_TAXONOMY.md` — CTA event naming conventions and property reference
- `QA_SUMMARY.md` — QA scripts overview, quality gates by release type, coverage matrix

**Release & Change Discipline**
- `RELEASE_PROCESS.md` — release workflow with gate criteria and rollout sequence
- `RELEASE_CHECKLIST.md` — pre-release sign-off checklist
- `INCIDENT_RESPONSE.md` — full incident handling workflow with post-mortem template
- `SUPPORT_MODEL.md` — support tiers, routing matrix, and escalation path
- `INCIDENT_SEVERITY_MATRIX.md` — SEV1–SEV4 definitions, response times, escalation
- `BACKUP_AND_RECOVERY.md` — backup strategy, disaster recovery scenarios, RTO/RPO

**Runbooks**
- `infra/runbooks/RUNBOOK_DEPLOYMENT.md` — step-by-step production deployment
- `infra/runbooks/RUNBOOK_ROLLBACK.md` — emergency rollback procedures
- `infra/runbooks/RUNBOOK_SECRETS.md` — secrets rotation and recovery
- `infra/runbooks/RUNBOOK_DEMO_ENV.md` — demo environment setup and management

**Security & Trust Documentation**
- `docs/SECRETS_POLICY.md` — secrets handling, classification, rotation policy
- `docs/ACCESS_CONTROL.md` — RBAC model, multi-tenancy isolation, session management
- `docs/LOGGING_AND_RETENTION.md` — what is logged, retention schedule, privacy protections
- `docs/DEPENDENCY_POLICY.md` — dependency vetting, licensing, security audit requirements
- `docs/ENVIRONMENT_SEPARATION.md` — dev/staging/production isolation documentation
- `docs/DATA_CLASSIFICATION.md` — Tier 1–4 data classification with handling requirements
- `docs/THIRD_PARTY_REGISTER.md` — complete register of all third-party services and data access

**Company Reference Documents**
- `COMPANY_FACT_SHEET.md` — company overview, products, technology stack, differentiation
- `PRESS_KIT.md` — key messages, boilerplate, founder bio, media assets reference
- `BRAND_GUIDELINES.md` — color palette, typography, voice, naming conventions, logo usage

**QA Scripts** (`scripts/qa/`)
- `smoke-routes.js` — HTTP smoke test for all public routes
- `check-links.js` — broken link detection across public pages
- `check-metadata.js` — SEO and OG metadata validation
- `check-a11y.js` — accessibility baseline checks (alt text, labels, ARIA)
- `check-trust.js` — trust and legal page existence and content checks
- `check-demo-seed.js` — demo environment seed integrity validation

**Operational Scripts** (`package.json`)
- `dev` — start all artifact development servers
- `seed:demo` — reseed demo environment
- `capture:screens` — regenerate documentation screenshots
- `qa:routes`, `qa:links`, `qa:a11y`, `qa:trust`, `qa:meta`, `qa:demo` — individual QA checks
- `qa:site` — full QA suite (routes + links + trust + metadata)
- `release:prep`, `release:notes` — release preparation helpers

**Internal Ops Surface**
- `/ops` route scaffolded in SZL Holdings app with sidebar navigation
- 11 ops sections: overview, releases, qa, content, screenshots, trust, demo-state, env-check, integrations, incidents, checklists
- Clearly marked as internal, requires authentication, not linked in public navigation

---

## [0.1.0] — 2026-04-01

### Platform Release — Initial Public Mirror

This is the first formal public release of the SZL Holdings platform ecosystem.

### Added

**Platform Architecture**
- pnpm monorepo with 16 artifacts (7 web apps, 7 mobile apps, 1 API server, 1 design system)
- Shared TypeScript library stack: `@workspace/shared-ui`, `@workspace/db`, `@workspace/auth`, `@workspace/services`, `@workspace/workflow-engine`, `@workspace/ai-engine`, `@workspace/audit`, `@workspace/observability`
- Centralized Express API server serving all platform backends
- PostgreSQL with Drizzle ORM — shared schema with domain isolation
- WebSocket real-time layer with HMAC-signed tickets and per-channel ACL
- OpenID Connect (PKCE) authentication with organization-scoped RBAC

**Lyte — Business Observability**
- PRISM framework: Pulse, Risk, Intelligence, Signals, Motion
- Command Inbox with signal lifecycle management
- Action Queue with priority routing
- Approvals Center and Ownership Map
- Escalation Center with consequence modeling
- Readiness Module with organizational health scoring
- 40+ connector integration stubs
- Role-aware dashboards (exec, ops, compliance, maintenance)

**Alloy — Execution Fabric**
- Workflow engine with structured action routing
- Human-in-the-loop approval gates
- Immutable audit trail with full attribution
- Agent coordination network (Helmsman, Sentinel, Compass)
- Governed execution: advisory agents cannot execute without explicit approval

**Aegis — Unified Defense & Intelligence**
- Defense workspace: SOC command, MITRE ATT&CK v14 coverage, SOAR playbook engine
- Command workspace: MSP operations, client SLA management
- Intelligence workspace: AI research (INCA), model registry, experiment tracking
- STIX/TAXII protocol layer
- StateRAMP readiness track (Aegis — Phase 2 roadmap)

**Terra — Real Estate Intelligence**
- NYC distress property data pipeline (multiple public data sources)
- Ownership structure tracking and entity graph
- Deal pipeline management via Alloy
- Interactive property map (Mapbox GL JS)
- Market signal intelligence and broker workflow

**Vessels — Maritime Intelligence**
- AIS telemetry integration and fleet command
- Voyage economics modeling
- Dark vessel detection
- Sanctions screening
- Route intelligence and weather analysis
- Exception Center with consequence modeling
- Helmsman AI agent for maritime intelligence

**Carlota Jo — Private Advisory**
- Web platform: service catalog, inquiry workflow, brand positioning
- Native mobile client: Expo/React Native for iOS and Android
- Discreet inquiry management and client engagement flow

**SZL Holdings — Corporate Platform**
- Ecosystem overview, investor relations, trust center
- Admin control plane with authenticated access
- KPI dashboard with role-gated access

**Stephen Lutar — Founder Site**
- Personal portfolio, work showcase, technical frameworks
- Career command and founder narrative

**Infrastructure**
- Azure Bicep IaC templates (App Service, PostgreSQL, Key Vault, Redis, CDN)
- Stripe billing infrastructure (Checkout, Subscriptions, Invoicing, Customer Portal)
- Multi-provider email (Resend → SendGrid → SMTP failover)
- Branded PDF generation (pdfkit, 8 templates)
- Salesforce AppExchange package stub
- Jira Marketplace (Atlassian Connect) app stub
- Marketplace mobile apps: all major platforms

**Documentation**
- Architecture documentation (system overview, data flow, entity model)
- Trust Center (AI governance, RBAC, audit trail, security posture)
- Investor documentation suite (thesis, readiness, go-to-market, team)
- Buyer documentation suite (executive overview, solution brief, use cases)
- Design system audit and token documentation
- Public mirror policy and governance
- Release discipline (strategy, versioning, checklist)

---

## Release Archive

Older releases are documented here as they are published.

| Version | Date | Summary |
|---------|------|---------|
| 0.1.0 | 2026-04-01 | Initial public platform release |

---

*For security disclosures, see [SECURITY.md](SECURITY.md).*  
*For the full release strategy, see [docs/releases/release-strategy.md](docs/releases/release-strategy.md).*  
*For the product roadmap, see [ROADMAP.md](ROADMAP.md).*
