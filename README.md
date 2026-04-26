# SZL Holdings

[![CI](https://github.com/stephenlutar2-hash/szl-holdings-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/stephenlutar2-hash/szl-holdings-platform/actions/workflows/ci.yml) [![CodeQL](https://github.com/stephenlutar2-hash/szl-holdings-platform/actions/workflows/codeql.yml/badge.svg)](https://github.com/stephenlutar2-hash/szl-holdings-platform/actions/workflows/codeql.yml) [![Security](https://github.com/stephenlutar2-hash/szl-holdings-platform/actions/workflows/security.yml/badge.svg)](https://github.com/stephenlutar2-hash/szl-holdings-platform/actions/workflows/security.yml) [![License](https://img.shields.io/badge/license-Proprietary-red)](./LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/) [![pnpm](https://img.shields.io/badge/pnpm-monorepo-orange)](https://pnpm.io/) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://www.postgresql.org/)

**The governed infrastructure for high-consequence decisions.**

> Signal detection, AI-governed recommendations, human approval gates, cryptographic proof of every outcome — across eight enterprise verticals from a single platform.

---

## The Problem

Enterprise operations have an accountability gap. Dashboards show what happened. Alerts surface what is wrong. Neither tells operators *what to do next*, *who authorized it*, or *whether a recommended action is safe to execute*.

AI tools compound the problem: they add recommendation volume without governance. Operators accumulate more data, more noise, and more untracked decisions.

**The problem is not insight — it is accountability.**

---

## What SZL Holdings Builds

**A11oy** is the governed agentic execution layer that sits between enterprise data and enterprise decisions. It senses, structures, correlates, explains, recommends, approves, executes, verifies, and preserves cryptographic proof — in real time, across all SZL verticals.

Every step in the pipeline has a traceable owner, a policy constraint, and an immutable record.

### Core Capabilities

- **Signal Intelligence** — correlated business signals across all connected systems
- **Governed AI Recommendations** — every recommendation carries source citations, confidence scores, and policy constraints
- **Human-Gated Autonomy** — no consequential action executes without human confirmation, enforced structurally
- **Cryptographic Proof** — append-only audit trail linking every decision to actor, policy, and outcome
- **Digital Twin Simulation** — probabilistic modeling before any high-stakes action
- **Multi-Provider AI** — policy-governed routing across leading AI providers
- **Executive Briefing** — board-ready decision surfaces with full attribution chain

---

## Platform Screenshots

All screenshots are verified, unmodified captures from the live platform. No mockups or AI-generated imagery.

### SZL Holdings — Governed Decision Operating System

![SZL Holdings — Platform Dashboard](brand/screenshots/szl-holdings-dashboard.jpg)

*Parent company dashboard — governed infrastructure for high-consequence decisions across eight enterprise verticals.*

### A11oy — Live Enterprise Execution Fabric

![A11oy — Execution Fabric](brand/screenshots/a11oy-execution-fabric.jpg)

*A11oy — seven-layer governed agentic fabric, live signal mesh, and cryptographic proof ledger.*

### FORGE — Unified Command Surface

![FORGE Command Portal](brand/screenshots/forge-command-portal.jpg)

*Cross-domain operator surface with governed decision loop, spatial runtime, and cross-platform intelligence.*

### Domain Pack Verticals

| TENAX — Cyber Resilience | Counsel — Legal Matter Command |
|---|---|
| ![TENAX](brand/screenshots/tenax-cyber-resilience.jpg) | ![Counsel](brand/screenshots/counsel-legal-command.jpg) |
| Cyber posture, recovery readiness, and live incident command | Matter tracking, obligation mapping, and legal exposure management |

| DOMAINE — Real Estate Intelligence | SEXTANT — Maritime Intelligence |
|---|---|
| ![DOMAINE](brand/screenshots/domaine-real-estate.jpg) | ![SEXTANT](brand/screenshots/sextant-maritime.jpg) |
| Deal pipeline, portfolio analytics, and market intelligence | Fleet command, route optimization, and maritime operations |

| PARAGON — Defense & Intelligence |
|---|
| ![PARAGON](brand/screenshots/paragon-defense.jpg) |
| Threat intelligence, defense operations command, and spatial analytics |

> All screenshots captured 2026-04-25 from the live platform. Unmodified captures — no mockups or AI-generated imagery.

---

## Product Portfolio

| Product | Domain | What It Does |
|---------|--------|--------------|
| **A11oy** | Execution Fabric | Governed agentic layer — signal mesh, proof ledger, covenant policies, operator surfaces |
| **TENAX** | Cybersecurity | Cyber posture management, recovery readiness, incident command |
| **DOMAINE** | Real Estate | Deal pipeline intelligence, portfolio analytics, market signals |
| **SEXTANT** | Maritime | Fleet command, route optimization, compliance tracking |
| **PARAGON** | Defense & Intel | Threat intelligence, spatial analytics, operations command |
| **Counsel** | Legal | Matter tracking, obligation dependency mapping, exposure management |
| **KORA** | Decision Intelligence | Cross-domain metrics, outcome tracking, decision quality scoring |
| **LUMINA** | Executive Briefing | Board-ready decision briefings with attribution and proof chains |

**Additional surfaces:** FORGE (unified command), Carlota Jo (consulting), APEX (mobile command — iOS/Android)

---

## Platform Scale

| Metric | Count |
|--------|-------|
| Deployable artifacts | 14 |
| Packages | 100 |
| Shared libraries | 51 |
| Operator products | 8 |

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| **Language** | TypeScript (full stack, strict mode) |
| **Frontend** | React, Vite, Tailwind CSS, Framer Motion |
| **Mobile** | Expo / React Native |
| **Backend** | Express, Node.js |
| **Database** | PostgreSQL, Drizzle ORM |
| **AI** | Multi-provider (governed routing with policy constraints) |
| **Auth** | OIDC/PKCE, multi-role RBAC, deny-by-default enforcement |
| **Infra** | pnpm monorepo, GitHub Actions CI/CD |

---

## Security Posture

- **Access control:** Multi-role RBAC with deny-by-default enforcement. All routes require authentication. All queries are org-scoped.
- **AI governance:** Advisory agents only. Covenant Policy enforces approval gates at the fabric layer. AI cannot bypass human confirmation.
- **Audit trail:** Every consequential action writes an immutable proof entry with actor attribution, timestamp, and decision context.
- **Multi-tenancy:** Cross-tenant access is architecturally prevented, not only policy-controlled.
- **Vulnerability disclosure:** Responsible disclosure only. See [SECURITY.md](SECURITY.md).

---

## Roadmap

| Item | Status |
|------|--------|
| A11oy Phase 1 — Foundation (type system, fabric primitives, demo seed, read API) | ✅ Complete |
| A11oy Phase 2 — Workcell engine with live AI reasoning | 🔜 In Progress |
| A11oy Phase 3 — Full proof-carrying execution with live connectors | 🔜 Planned |
| APEX mobile (unified iOS + Android command) | 🔜 Planned |
| SOC 2 Type 1 audit readiness | 🔜 Roadmap |
| Production customer onboarding | 🔜 Roadmap |

---

## Current Status

**Alpha — runtime verified 2026-04-26. All 13 web surfaces load. No artifacts are broken.**

| Classification | Artifacts |
|---|---|
| `alpha working` | SZL Holdings, A11oy, API Server, Carlota Jo, Counsel, Pulse, Aegis (7) |
| `alpha partial` | Vessels, Terra, Command, Sentra, Lyte, Mobile (6) |
| `demo-only` | SZL Demo Video (1) |
| `internal only` | Mockup Sandbox (1) |

- A11oy Phase 1: fully implemented; Phase 2 workcell engine in progress
- Seven domain pack verticals: all routes functional with demo/seeded data; see matrix for live data gaps
- AI recommendations: multi-provider routing with governed policy constraints — live
- Authentication: OIDC/PKCE with multi-role RBAC — all auth gates verified correct
- Known gaps: `/api/sentra/risks` unregistered (API route); Terra maps require Mapbox token; AIS telemetry simulated
- Full evidence: [`audit/runtime/app-status-classification.md`](audit/runtime/app-status-classification.md)

---

## Access & Collaboration

This repository is proprietary. Source code, architecture, and implementation details are confidential.

**For investors:** We welcome due diligence conversations and guided platform walkthroughs. Contact us to schedule a demo or request access to detailed technical documentation.

**For enterprise evaluation:** Design partner conversations and pilot programs are available for qualified organizations.

**For all other inquiries:** Please reach out via the contact information below.

## Directory Structure

| Path | Contents |
|------|----------|
| `artifacts/` | All deployable web and mobile applications |
| `artifacts/a11oy/` | A11oy — Live Enterprise Execution Fabric |
| `lib/` | Shared libraries: database client, auth, AI, event bus, UI components |
| `apps/` | Background applications: embedding API, ingestion orchestrator, runtime API |
| `services/` | Platform services: FORGE fabric, KORA metrics, Substrate MCP gateway |
| `workers/` | Background workers: embedding, ranking, reranking, vector, Python substrate |
| `packages/` | Domain packages: design system, substrate, agent core, evidence ledger, policy guard |
| `scripts/` | Seed scripts, QA scripts, screenshot capture, deployment utilities |
| `docs/` | Architecture, trust, investor, and operational documentation |
| `docs/assets/screenshots/current/` | Verified current screenshots — only source for README images |
| `audit/` | Audit reports, QA reports, asset reports |
| `ops/` | Infrastructure configuration, environment matrix, runbooks |
| `.github/workflows/` | CI, CodeQL, security, deploy, and README QA pipelines |

**Artifact inventory:**

> Status labels reflect runtime verification as of 2026-04-26. See [`audit/runtime/app-status-classification.md`](audit/runtime/app-status-classification.md) for full evidence and upgrade paths.

| Artifact | Kind | Preview | Runtime Status |
|----------|------|---------|----------------|
| SZL Holdings Dashboard | web | `/` | `alpha working` — all routes live, KPIs seeded |
| A11oy — Live Enterprise Execution Fabric | web | `/a11oy/` | `alpha working` — Phase 1 complete, Phase 2 in progress |
| API Server | web | `/api/` | `alpha working` — demo mode; auth-gated routes correct |
| FORGE Command Portal | web | `/command/` | `alpha partial` — CORTEX badge counts not wired to live API |
| TENAX — Cyber Resilience Command | web | `/sentra/` | `alpha partial` — UI complete; `/api/sentra/risks` route missing |
| Counsel — Legal Matter Command | web | `/counsel/` | `alpha working` — matter tracking functional; CourtListener token pending |
| DOMAINE — Real Estate Intelligence | web | `/terra/` | `alpha partial` — maps blank (Mapbox token not configured) |
| SEXTANT Maritime Intelligence | web | `/vessels/` | `alpha partial` — AIS simulated; 3 commercial modules not wired |
| Carlota Jo Consulting | web | `/carlota-jo/` | `alpha working` — most complete artifact; live integrations active |
| KORA — Decision Intelligence | web | `/lyte/` | `alpha partial` — routes functional; legacy path alias missing |
| LUMINA — AI Executive Briefing | web | `/pulse/` | `alpha working` — AI multi-provider routing active |
| PARAGON — Defense & Intelligence | web | `/aegis/` | `alpha working` — CISA KEV, NVD CVE, MITRE ATT&CK v14 active |
| SZL Holdings — Governed Autonomy Demo | video | `/szl-demo-video/` | `demo-only` — promotional video artifact |
| SZL Holdings — Mobile Command (APEX) | mobile | `/szl-holdings-mobile/` | `alpha partial` — scaffold complete; splash/icon and push linking pending |

---

## Contact

**Stephen Lutar** — Founder and CEO, SZL Holdings

**Email:** inquiries@szlholdings.com
**Website:** [szlholdings.com](https://szlholdings.com)
**LinkedIn:** [linkedin.com/in/stephen-l-279315240](https://linkedin.com/in/stephen-l-279315240)

---

## Legal

Copyright (c) 2024-2026 SZL Holdings. All rights reserved.

This repository and all contents — including source code, architecture, documentation, and brand assets — are the sole and exclusive property of SZL Holdings. No license, right, or interest is granted by virtue of access. See [LICENSE](./LICENSE).

SZL Holdings, A11oy, TENAX, DOMAINE, SEXTANT, PARAGON, KORA, LUMINA, Counsel, Carlota Jo, FORGE, APEX, and IMPERIUM are trademarks of SZL Holdings. Certain methods and architectures may be the subject of pending or future patent applications.
