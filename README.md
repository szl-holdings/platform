# SZL Holdings

[![CI](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml) [![CodeQL](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/codeql.yml/badge.svg)](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/codeql.yml) [![Security](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/security.yml/badge.svg)](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/security.yml) [![License](https://img.shields.io/badge/license-UNLICENSED-lightgrey)](./LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/) [![pnpm](https://img.shields.io/badge/pnpm-monorepo-orange)](https://pnpm.io/) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://www.postgresql.org/)

**Governed decision infrastructure — connecting what is observable to what is executable, with full attribution.**

[Architecture](./docs/architecture/architecture.md) · [Platform Primitives](./docs/architecture/platform-primitives.md) · [Trust Center](./docs/trust/trust-center.md) · [Security](./SECURITY.md) · [Investor Docs](./docs/investor/platform-thesis.md)

---

## Canonical Entry Points

New to the codebase? Start here.

| Document | Purpose |
|---|---|
| **[docs/INDEX.md](./docs/INDEX.md)** | Master index of all documentation, audit reports, and doctrine |
| **[docs/audit/2026-04/README.md](./docs/audit/2026-04/README.md)** | April 2026 operational audit — executive summary and findings |
| **[docs/doctrine/szl-doctrine.md](./docs/doctrine/szl-doctrine.md)** | The SZL point of view: four pillars, voice rules, anti-patterns |
| **[packages/config/](./packages/config/)** | Single source of truth: platform registry, claims, feature flags, env contract |
| **[docs/APP_STATUS.md](./docs/APP_STATUS.md)** | Authoritative artifact readiness register (GA / Beta / Partial / Archived) |
| **[docs/operations/known-gaps.md](./docs/operations/known-gaps.md)** | Honest inventory of technical debt and remediation paths |
| **[docs/platform-facts.md](./docs/platform-facts.md)** | Authoritative platform statistics — generated from `packages/platform-metrics-registry` |

> **Platform facts are auto-generated.** Run `pnpm metrics:generate` to regenerate [`docs/platform-facts.md`](./docs/platform-facts.md) and the registry from the current filesystem state. Run `pnpm metrics:validate` to verify no drift. Never edit `docs/platform-facts.md` directly.

---

## Trust

An AI-assisted operations platform carries a distinct trust burden. The platform addresses it structurally, not through policy documents alone.

| Concern | Structural Response |
|---------|---------------------|
| AI without oversight | Covenant Policy enforces approval gates — AI cannot execute consequential actions without human confirmation |
| Opaque AI outputs | All recommendations include source citations, confidence scores, and retrieval provenance |
| Audit accountability | Every action generates an immutable audit event with actor attribution via Proof Chain |
| Access control | 11-role RBAC with org-scoped tenant isolation. Deny-by-default global auth enforcer |
| Multi-tenancy | All queries scoped by org identifier. Cross-org access returns 404 to prevent information leakage |
| Decision traceability | Outcome Graph tracks the full chain: signal to recommendation to decision to outcome |

[Trust Center](docs/trust/trust-center.md) · [Security Policy](SECURITY.md) · [Proof and Policy Model](docs/architecture/proof-and-policy-model.md)

---

## What We Build

Enterprise operations have an accountability gap. Dashboards show what happened. Alerts surface what is wrong. Neither tells operators what to do next, who is responsible, or whether a recommended action is safe to execute.

AI tools compound the problem: they add recommendation volume without governance. Operators accumulate more data, more noise, and more untracked decisions.

SZL Holdings builds the governed decision layer that sits between signal detection and action execution:

```
Signal -> Context -> Recommendation -> Simulation -> Policy -> Approval -> Execution -> Proof -> Outcome
```

Every step is instrumented. Every decision is attributed. Every AI recommendation carries source citations and confidence scores. Every consequential action requires human confirmation.

---

## Product Portfolio

### Platform Core

**Lyte** is the flagship command surface where operators observe signals, review AI recommendations, run simulations, and make governed decisions. It runs the PRISM framework (People, Revenue, Infrastructure, Security, Market) across all connected domains.

**Alloy** is the execution fabric: signal normalization, workflow orchestration, approval controls, human-in-the-loop gates, and immutable audit trail. It is the shared infrastructure layer that makes AI-assisted operations durable and accountable.

**CORTEX** is the unified mobile command app (iOS and Android) that surfaces all domain workspaces with biometric authentication and offline-capable sync.

### Domain Packs

Domain packs extend the same governance infrastructure into domain-specific intelligence. Each pack is a structured application built on Lyte, Alloy, and the six platform primitives.

<!-- BEGIN: portfolio-table (generated by scripts/generate-readme-product-table.js) -->

| Product | Domain | Status |
|---------|--------|--------|
| **Sentra** | Cyber resilience command — exposure mapping, recovery readiness, incident command, control drift detection | Active |
| **Counsel** | Legal matter command — agentic matter management, obligation tracking, exposure quantification, court filing integration | Active |
| **Aegis** | Security and defense intelligence — SOC command, advanced security modules, SOAR playbooks, threat intelligence | Domain backend active; web UI archived (Task #920) — see `artifacts/firestorm/` |
| **Vessels** | Maritime fleet intelligence — AIS tracking, S&P workflow, demurrage, freight, voyage P&L | Active |
| **Terra** | Real estate intelligence — distress pipeline, ownership graph, deal workflow, AI analysis | Active |
| **Carlota Jo** | Premium advisory operations — UHNW client portal, service catalog, engagement management | Active |
| **Pulse** | AI executive briefing — narrative intelligence reports synthesized from live platform signals | Active |
| **PRISM Counsel** | Legal matter command — agentic matter management, court filings, recovery operations | Superseded by Counsel (Active); legacy domain API routes retained |
| **IMPERIUM** | Cloud sovereignty — multi-cloud governance, policy enforcement, cloud estate visibility | Archived (Task #920) |

<!-- END: portfolio-table -->

### Command Portal

The Command Portal is the cross-domain real-time dashboard aggregating signals from all domain packs into a unified executive view with eight-domain SSE feeds and executive briefing.

### Screens

![SZL Holdings Dashboard](assets/readme/products/szl-holdings-dashboard.jpg)

![Sentra — Cyber Resilience Command](assets/readme/products/sentra-cyber-resilience.jpg)

![Counsel — Legal Matter Command](assets/readme/products/counsel-legal-command.jpg)

![Aegis Command](assets/readme/products/aegis-command.jpg)

![Vessels Maritime Intelligence](assets/readme/products/vessels-maritime.jpg)

![Terra Real Estate Intelligence](assets/readme/products/terra-real-estate.jpg)

![Command Portal](assets/readme/products/command-portal.jpg)

![CORTEX — Unified Mobile Command](assets/readme/products/cortex-mobile.jpg)

---

## Architecture

The six platform primitives define what is structurally different from dashboards, copilots, and workflow tools:

| Primitive | Function |
|-----------|----------|
| **Outcome Graph** | Tracks the full lifecycle: recommendation to decision to outcome. Closed-loop learning — the platform knows which recommendations led to which results. |
| **Proof Chain** | Immutable, verifiable audit trail for every significant action. Compliance teams can reconstruct any decision chain. AI outputs carry provenance. |
| **Covenant Policy** | Defines what agents and users can do, with what approval requirements. Human-in-the-loop is enforced at the policy layer — AI cannot bypass it. |
| **Decision Simulation** | Probabilistic simulation before action — confidence intervals and sensitivity analysis. Operators see not just what should be done but what could happen. |
| **Workflow Engine** | Durable multi-step process orchestration with agent coordination. Complex decisions are tracked, governed, and recoverable. |
| **Event Fabric** | Cross-domain signal backbone — normalizes, routes, and correlates events. A sanctions hit in Vessels can surface a legal risk flag in PRISM Counsel automatically. |

**Platform hierarchy:**

```
+-----------------------------------------------------------------------+
|  SZL HOLDINGS                                                         |
|  Governed decision infrastructure layer                              |
+-----------------------------------------------------------------------+
|  Lyte                  — Flagship command surface (PRISM framework)   |
|  Alloy                 — Execution fabric (workflows, approvals, audit)|
|  CORTEX                — Unified mobile command (iOS + Android)       |
+-----------------------------------------------------------------------+
|  DOMAIN PACKS                                                         |
|                                                                       |
|  Sentra   Counsel   Aegis    Vessels    Terra                        |
|  Carlota Jo         Pulse                                            |
+-----------------------------------------------------------------------+
|  GOVERNANCE INFRASTRUCTURE                                            |
|                                                                       |
|  Outcome Graph  .  Proof Chain  .  Covenant Policy                   |
|  Decision Simulation  .  Workflow Engine  .  Event Fabric            |
+-----------------------------------------------------------------------+
|  DATA LAYER                                                           |
|                                                                       |
|  PostgreSQL 16 (Drizzle ORM)  .  External feeds: AIS, STIX/TAXII    |
+-----------------------------------------------------------------------+
```

See [docs/architecture/platform-primitives.md](docs/architecture/platform-primitives.md) for the full specification of each primitive and [docs/architecture/architecture.md](docs/architecture/architecture.md) for the service topology.

---

## Repository Map

This is a pnpm monorepo. Key locations:

| Path | Contents |
|------|----------|
| `artifacts/` | All deployable web and mobile applications |
| `lib/` | Shared libraries: database client, auth, AI, event bus, UI components |
| `apps/` | Background applications: embedding API, ingestion orchestrator, runtime API |
| `services/` | Platform services: Alloy fabric, Lyte metrics, Substrate MCP gateway |
| `workers/` | Background workers: embedding, ranking, reranking, vector, Python substrate |
| `packages/` | Domain packages: design system, substrate, agent core, evidence ledger, policy guard |
| `scripts/` | Seed scripts, QA scripts, deployment utilities |
| `docs/` | Architecture, trust, investor, and operational documentation |
| `ops/` | Infrastructure configuration, environment matrix, runbooks |
| `.github/workflows/` | CI, CodeQL, security, deploy, and README QA pipelines |
| `assets/readme/` | All README-facing visual assets (products, architecture, brand) |

Artifact inventory:

| Artifact | Kind | Preview | Status | README |
|----------|------|---------|--------|--------|
| SZL Holdings Dashboard | web | `/` | **Active** — primary public web app | [README](artifacts/szl-holdings/README.md) |
| API Server | web | `/api/` | **Active** — backend API, powers all surfaces | [README](artifacts/api-server/README.md) |
| Unified Command | web | `/command/` | **Active** — ops command surface (merged Lyte + Imperium) | [README](artifacts/command/README.md) |
| Sentra — Cyber Resilience Command | web | `/sentra/` | **Active** — domain pack: cyber posture, recovery readiness, incident command | [README](artifacts/sentra/README.md) |
| Counsel — Legal Matter Command | web | `/counsel/` | **Active** — domain pack: legal matter management, obligation tracking, exposure quantification | [README](artifacts/counsel/README.md) |
| Terra — Real Estate Intelligence | web | `/terra/` | **Active** — domain pack | [README](artifacts/terra/README.md) |
| Vessels Maritime Intelligence | web | `/vessels/` | **Active** — domain pack | [README](artifacts/vessels/README.md) |
| Carlota Jo Consulting | web | `/carlota-jo/` | **Active** — domain pack | [README](artifacts/carlota-jo/README.md) |
| Pulse — AI Executive Briefing | web | `/pulse/` | **Active** — executive intelligence briefing | [README](artifacts/pulse/README.md) |
| SZL Holdings — Investor Pitch Deck | web | `/aegis/` | **Active** — investor slides and ATLAS runtime | [README](artifacts/aegis/README.md) |
| SZL Holdings — Governed Autonomy Demo | video | `/szl-demo-video/` | **Active** — demo video artifact | [README](artifacts/szl-demo-video/README.md) |
| SZL Holdings — Mobile Command | mobile | `/szl-holdings-mobile/` | **Deferred** — after CORTEX ships | [README](artifacts/szl-holdings-mobile/README.md) |
| NEXUS — Unified Agentic AI Layer | design | `/nexus/` | **Internal** — UI prototyping only | — |

**Archived artifacts** (source on disk, no registered workflow, not part of the build):

| Artifact | Disposition | Notes |
|----------|-------------|-------|
| `artifacts/firestorm/` | Archived (Task #920) | Aegis defense UI; source retained on disk; `/firestorm/*` API routes still live |
| `artifacts/imperium/` | Archived (Task #920) | Cloud sovereignty UI merged into Command; source retained on disk |
| `artifacts/lyte-command-center/` | Archived (Task #920) | Merged into Command; source retained on disk |

**Removed artifacts** (directory deleted, no remaining code on disk):

| Artifact | Disposition | Notes |
|----------|-------------|-------|
| `prism-counsel/` | Removed (Task #634) | `/prism-counsel/*` API routes still live on the API server |
| `stephen-site/` | Removed (Task #634) | Content moved to `/founder` route in SZL Holdings |

If a future product decision brings any archived surface back, treat it as a fresh build — do not restore from old `dist/` output.

---

## Build, Run, and Contribute

**Requirements:** Node.js 22+, pnpm 10+

```bash
git clone https://github.com/szl-holdings/szl-holdings-platform.git
cd szl-holdings-platform
pnpm install
pnpm dev
```

**Common tasks:**

```bash
pnpm typecheck          # TypeScript type checking across all packages
pnpm test               # Unit and component tests
pnpm test:integration   # Integration tests
pnpm readme:check       # Validate README images and badge workflows
pnpm qa:routes          # Smoke-test all routes
pnpm audit:all          # Run full audit suite (mocks, routes, deps, copy, design)
pnpm seed               # Seed the local database with demo data
```

See [docs/operations/deployment-guide.md](docs/operations/deployment-guide.md) for staging and production deployment.

**Contributing:** See [CONTRIBUTING.md](CONTRIBUTING.md) for the branch workflow, code style, commit format, and PR process. All contributions require a passing CI run and a passing `pnpm readme:check` before merge.

**Environments:**

| Environment | Purpose | Trigger |
|-------------|---------|---------|
| Development | Active development and internal preview | Always on (Replit workspace) |
| Staging | Integration validation before production | Push to `main` via `deploy-staging.yml` |
| Production | Customer-facing deployment | Published release via `deploy-production.yml` |

---

## Governance, Security, and Contact

**Access control:** 11-role RBAC with deny-by-default enforcement. All routes require authentication. All queries are org-scoped.

**AI governance:** Advisory agents only. Covenant Policy enforces approval gates at the workflow layer. AI cannot bypass human confirmation requirements.

**Audit trail:** Every consequential action writes an immutable Proof Chain event with actor attribution, timestamp, source, and decision context.

**Vulnerability disclosure:** See [SECURITY.md](SECURITY.md). Responsible disclosure only.

**Known gaps and tech debt:** Documented honestly in [docs/operations/known-gaps.md](docs/operations/known-gaps.md).

### Documentation Index

All documentation has been consolidated into `docs/`. See [docs/INDEX.md](docs/INDEX.md) for the complete index.

| Document | Purpose |
|----------|---------|
| [docs/architecture/architecture.md](docs/architecture/architecture.md) | System architecture: topology, stack, design principles (v4.0, canonical) |
| [docs/architecture/platform-primitives.md](docs/architecture/platform-primitives.md) | The six core abstractions |
| [docs/architecture/data-model.md](docs/architecture/data-model.md) | Entity-relationship overview of the core database schema |
| [docs/architecture/api-spec.md](docs/architecture/api-spec.md) | API surface: route inventory, auth model, rate limiting |
| [docs/security/access-control-matrix.md](docs/security/access-control-matrix.md) | Role-permission matrix mapped to implementation |
| [docs/security/security-checklist.md](docs/security/security-checklist.md) | Security controls checklist |
| [docs/operations/deployment-guide.md](docs/operations/deployment-guide.md) | Deployment procedures |
| [docs/operations/operations-runbook.md](docs/operations/operations-runbook.md) | Operational procedures and incident response |
| [docs/operations/known-gaps.md](docs/operations/known-gaps.md) | Honest assessment of tech debt and planned improvements |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |
| [docs/readme-standards.md](docs/readme-standards.md) | README asset and badge standards |

**Canonical ops documentation** (authoritative sources — these win over root-level equivalents):

| Document | Purpose |
|----------|---------|
| [ops/infra/target-production-architecture.md](ops/infra/target-production-architecture.md) | Production architecture and deployment topology |
| [ops/infra/environment-matrix.md](ops/infra/environment-matrix.md) | Environment separation (dev / staging / prod) |
| [ops/infra/recovery-and-backup-model.md](ops/infra/recovery-and-backup-model.md) | Backup and disaster recovery |
| [ops/mobile/flagship-release-readiness.md](ops/mobile/flagship-release-readiness.md) | CORTEX mobile release status and readiness criteria |
| [ops/mobile/eas-and-store-secrets-matrix.md](ops/mobile/eas-and-store-secrets-matrix.md) | EAS build profiles and App Store secrets |
| [ops/mobile/testflight-play-internal-runbook.md](ops/mobile/testflight-play-internal-runbook.md) | TestFlight / Play Internal Testing distribution runbook |
| [ops/frontier/final-frontier-report.md](ops/frontier/final-frontier-report.md) | Final platform readiness report |
| [ops/frontier/launch-readiness-scorecard.md](ops/frontier/launch-readiness-scorecard.md) | Go/no-go launch scorecard |
| [ops/frontier/disposition-matrix.md](ops/frontier/disposition-matrix.md) | App disposition decisions (archive / defer / active) |
| [ops/cleanup/canonical-source-map.md](ops/cleanup/canonical-source-map.md) | Single reference for canonical document locations |

---

**Stephen Lutar** — Founder and CEO, SZL Holdings

**Email:** inquiries@szlholdings.com
**Website:** [szlholdings.com](https://szlholdings.com)
**LinkedIn:** [linkedin.com/in/stephen-l-279315240](https://linkedin.com/in/stephen-l-279315240)

Open to design partner conversations, enterprise evaluation, and investment introductions.
