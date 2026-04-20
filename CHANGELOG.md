# Changelog

All notable changes to the SZL Holdings platform ecosystem are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).  
See `/docs/releases/versioning-policy.md` for the full versioning policy.

> **This file is updated automatically** by the release workflow on every tagged release.  
> Entries are generated from [conventional commits](https://www.conventionalcommits.org/) and categorised into Breaking Changes, Features, Bug Fixes, and Other Changes with links to individual commits.  
> Do not edit versioned entries manually — edit the `## [Unreleased]` section only.

---

## [Unreleased]

### In Progress
- Revenue activation (Stripe billing live for Vessels, Lyte, Terra, Carlota Jo)
- Enterprise SSO / SCIM 2.0 provisioning
- OpenAPI developer portal
- Redis session store for production deployments
- Sentry error tracking integration

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
- FedRAMP readiness track (Aegis — Phase 2 roadmap)

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
