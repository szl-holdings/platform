<p align="center">
  <img src="https://raw.githubusercontent.com/szl-holdings/.github/master/profile/assets/szl-holdings-logo.svg" alt="SZL Holdings" width="480" />
</p>

<p align="center">
  <em>Governed decision infrastructure for enterprises that cannot afford silent failures, invisible risk, or unaccountable AI.</em>
</p>

<p align="center">
  <a href="https://szlholdings.com">Website</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://github.com/szl-holdings/szl-holdings-platform">Platform Repository</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://github.com/szl-holdings/szl-holdings-platform/blob/main/docs/investor/platform-thesis.md">Investor Thesis</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://szlholdings.com/stephen/investor">Investor Dashboard</a>
</p>

<p align="center">
  <a href="https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml"><img src="https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI" /></a>
  <a href="https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/codeql.yml"><img src="https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/codeql.yml/badge.svg?branch=main" alt="CodeQL" /></a>
  <a href="https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/security.yml"><img src="https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/security.yml/badge.svg?branch=main" alt="Security Audit" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Expo-SDK_53-000020?style=flat-square&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=flat-square" alt="Proprietary" />
</p>

---

## What We Build

SZL Holdings builds the **governed decision infrastructure layer** — the platform that connects what's observable to what's executable, under governance, with full attribution.

**KORA** is the command surface. **FORGE** is the execution fabric. **APEX** is the unified mobile command center. Domain intelligence packs extend the same system into cybersecurity, maritime, real estate, executive briefing, and private advisory.

---

## Products

| Product | What it does | Live |
|---------|--------------|------|
| **[LUMINA](https://szlholdings.com/pulse)** | AI executive briefing — daily intelligence digest across every domain, source-cited and decision-ready | [lumina →](https://szlholdings.com/pulse) |
| **[DOMAINE](https://szlholdings.com/terra)** | Real estate intelligence — distress signals, ownership graph, covenant monitoring, deal pipeline | [domaine →](https://szlholdings.com/terra) |
| **[SEXTANT](https://szlholdings.com/vessels)** | Maritime fleet command — AIS tracking, sanctions screening, voyage economics | [sextant →](https://szlholdings.com/vessels) |
| **[TENAX](https://szlholdings.com/sentra)** | Cyber resilience command — exposure mapping, recovery readiness, incident command | [tenax →](https://szlholdings.com/sentra) |
| **[Counsel](https://szlholdings.com/counsel)** | Legal matter command — diligence, evidence, and AI-assisted contract risk | [counsel →](https://szlholdings.com/counsel) |
| **[Carlota Jo](https://szlholdings.com/carlota-jo)** | Premium advisory operations for UHNW clients | [carlota-jo →](https://szlholdings.com/carlota-jo) |
| **APEX** | Unified mobile command — all domain workspaces in one Expo/React Native app | iOS / Android |

---

## Platform Overview

```
SZL Holdings Platform
├── KORA         Flagship command surface — PRAXIS framework surfaces risk, drift, and friction before they compound
├── FORGE        Execution fabric — signal normalization, workflow orchestration, human-in-the-loop gates
│
├── LUMINA       AI executive briefing — daily cross-domain intelligence digest
├── TENAX        Cyber resilience command (exposure mapping, recovery readiness, incident command)
├── SEXTANT      Maritime fleet command, AIS tracking, sanctions screening, voyage economics
├── DOMAINE      Real estate intelligence — distress signals, ownership graph, deal pipeline
├── Counsel      Legal matter command — diligence and evidence under governance
├── Carlota Jo   Premium advisory operations for UHNW clients
│
├── APEX         Unified mobile command — all domain workspaces in one native app
└── FORGE Command Portal  Cross-domain ecosystem hub — real-time SSE, executive briefing, global search
```

**KORA + FORGE** form the core platform. The active vertical products (LUMINA, TENAX, SEXTANT, DOMAINE, Counsel, Carlota Jo) run on this shared foundation and share intelligence through the Event Fabric — a cross-domain signal backbone that makes every new vertical make the whole platform smarter.

---

## What Sets Us Apart

Most enterprise platforms observe. SZL Holdings **acts** — under governance, with full attribution.

### The PRISM Framework
A unified signal classification layer — **P**eople, **R**evenue, **I**nfrastructure, **S**ecurity, **M**arket — that normalizes signals from any vertical into a single traceable decision flow. Not a dashboard. An operating system for business observability.

### Human-in-the-Loop AI Governance
Advisory agents cannot execute consequential actions without explicit human confirmation — enforced at the Alloy workflow layer, not as an option. Every AI recommendation includes source citations, confidence scores, and retrieval provenance. The governance is structural, not policy-based.

### Immutable Audit Trail
Every action, approval, and AI recommendation generates an append-only audit event via `proof-chain`, cryptographically attributed to an actor with full decision provenance. Built for regulated industries from day one.

### Signal-to-Outcome Traceability
From the raw signal that triggered an alert, through the routing logic that assigned it, through the human approval that authorized action, to the executed outcome — every step is logged, linked, and replayable. Zero black-box decisions.

### Unified Mobile Command (APEX)
All active domain workspaces in a single Expo/React Native app. Biometric auth, cross-domain badge counts, workspace-adaptive AI copilot, and a unified command feed. Operators in the field have full platform coverage from one authenticated session on iOS or Android.

---

## Architecture

```
                External Signals (integrations, telemetry, intelligence feeds)
                                      |
                                      v
                          Signal Normalization (Alloy)
                                      |
                                      v
                     Context Engine (correlation, attribution, scoring)
                                      |
                                      v
                       Routing (priority, role assignment, domain)
                                 /              \
                                v                v
                    Auto-Execute             Human Review Gate
                   (policy-approved)              |
                                \                /
                                 v              v
                           Action Execution
                                      |
                                      v
                      Immutable Audit Trail (proof-chain)
```

### Technology

| Layer | Stack |
|-------|-------|
| **Language** | TypeScript (full stack, strict mode) |
| **Frontend** | React 19, Vite, Tailwind CSS 4, Framer Motion, Recharts |
| **Mobile** | Expo SDK 53 / React Native, NativeWind |
| **Backend** | Express 5, Node.js 22 |
| **Database** | PostgreSQL 16, Drizzle ORM |
| **AI** | Multi-provider (Anthropic, OpenAI, Gemini), evidence-backed retrieval |
| **Auth** | OIDC/PKCE, role-based RBAC, SCIM 2.0 |
| **Infra** | pnpm monorepo, Azure (App Service, PostgreSQL Flexible, Key Vault) |
| **CI/CD** | GitHub Actions — lint, typecheck, test, build, CodeQL, dependency review |

---

## Trust & Governance

| Concern | Approach |
|---------|----------|
| AI without oversight | Advisory agents require explicit human confirmation — enforced at the workflow layer |
| Opaque AI outputs | All recommendations include source citations, confidence scores, and retrieval provenance |
| Audit accountability | Every action generates an immutable audit event with actor attribution via proof-chain |
| Access control | Role-based RBAC with org-scoped tenant isolation, every route access-controlled |
| Multi-tenancy | All queries include org_id scoping — cross-tenant access architecturally prevented |
| Data security | TLS 1.3, HMAC-signed WebSocket tickets (5-min TTL), encryption at rest |

---

## Flagship Repository

→ **[szl-holdings/szl-holdings-platform](https://github.com/szl-holdings/szl-holdings-platform)**

The canonical platform monorepo. TypeScript throughout. See the repository README for the full artifact inventory, architecture overview, and documentation index.

---

## For Investors & Evaluators

| Resource | Link |
|----------|------|
| Investor Dashboard | [Live Dashboard](https://szlholdings.com/stephen/investor) |
| Platform Thesis | [platform-thesis.md](https://github.com/szl-holdings/szl-holdings-platform/blob/main/docs/investor/platform-thesis.md) |
| Product Readiness | [product-readiness.md](https://github.com/szl-holdings/szl-holdings-platform/blob/main/docs/investor/product-readiness.md) |
| Go-to-Market | [go-to-market.md](https://github.com/szl-holdings/szl-holdings-platform/blob/main/docs/investor/go-to-market.md) |
| Architecture | [architecture.md](https://github.com/szl-holdings/szl-holdings-platform/blob/main/docs/architecture/architecture.md) |
| Trust & Security | [trust-center.md](https://github.com/szl-holdings/szl-holdings-platform/blob/main/docs/trust/trust-center.md) |
| Security Policy | [SECURITY.md](https://github.com/szl-holdings/szl-holdings-platform/blob/main/SECURITY.md) |
| Code of Conduct | [CODE_OF_CONDUCT.md](https://github.com/szl-holdings/szl-holdings-platform/blob/main/CODE_OF_CONDUCT.md) |

---

**Stephen Lutar** — Founder & CEO

**Website:** [szlholdings.com](https://szlholdings.com)
**LinkedIn:** [linkedin.com/in/stephen-l-279315240](https://linkedin.com/in/stephen-l-279315240)
**Enterprise & Design Partner:** [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)
**Investment Conversations:** [stephen@szlholdings.com](mailto:stephen@szlholdings.com)

Open to design partner conversations, enterprise evaluation, and investment introductions.
