<p align="center">
  <strong>SZL Holdings</strong><br>
  <em>Governed Operational Intelligence</em>
</p>

<p align="center">
  <a href="https://szlholdings.com">Live Platform</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="./SECURITY.md">Security</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="./docs/architecture/system-overview.md">Architecture</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="./docs/investor/platform-thesis.md">Investor Thesis</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="./docs/trust/trust-center.md">Trust Center</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Expo-React%20Native-000020?logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/status-active-brightgreen" alt="Status" />
  <img src="https://img.shields.io/badge/license-proprietary-red" alt="License" />
</p>

---

## At a Glance

| Metric | Value |
|--------|-------|
| **Production Applications** | 16 (9 web + 7 mobile) |
| **Database Tables** | 415+ |
| **Database Columns** | 5,300+ |
| **Database Indexes** | 940+ |
| **API Routes** | 58,000+ lines across route files |
| **Industries Served** | 5 (Cybersecurity, Maritime, Real Estate, Legal, Wealth Management) |
| **Shared Libraries** | 6 (ai-engine, db, shared-ui, workflow-engine, design-tokens, api-spec) |
| **Architecture** | pnpm monorepo, strict TypeScript, full-stack |

Built by a single founder. Every line ships to production.

---

## Platform Thesis

Enterprise operations have an accountability gap. Dashboards show what happened. Alerts show what's wrong. Neither tells operators what to do next, who is responsible, or whether the recommended action is safe to execute.

AI tools compound the problem: they add recommendation volume without adding governance. Operators end up with more data, more noise, and more untracked decisions running in parallel.

SZL Holdings builds the **governed operational intelligence layer** — the platform that connects what's observable to what's executable, under governance, with full attribution.

**Stephen Lutar** — Founder & CEO

---

## Ecosystem

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          SZL Holdings Platform                               │
│                                                                              │
│   ┌──────────────────┐     ┌──────────────────────────────────────────────┐  │
│   │      Lyte        │     │                  Alloy                       │  │
│   │  Business        │◄───►│  Signal Routing · Workflow Orchestration     │  │
│   │  Observability   │     │  Approval Gates · Human-in-the-Loop         │  │
│   │  PRISM Framework │     │  Immutable Audit Trail                      │  │
│   └──────────────────┘     └──────────────────────────────────────────────┘  │
│                                        │                                     │
│            ┌───────────────────────────┼────────────────────────┐            │
│            ▼                           ▼                        ▼            │
│   ┌────────────────┐     ┌──────────────────┐     ┌──────────────────┐      │
│   │     Aegis      │     │     Vessels      │     │      Terra       │      │
│   │  Cybersecurity │     │  Maritime Fleet  │     │  Real Estate     │      │
│   │  & Defense     │     │  Command         │     │  Intelligence    │      │
│   └────────────────┘     └──────────────────┘     └──────────────────┘      │
│                                                                              │
│   ┌────────────────┐     ┌──────────────────┐     ┌──────────────────┐      │
│   │ PRISM Counsel  │     │   Carlota Jo     │     │  Stephen Lutar   │      │
│   │  Litigation    │     │  Private         │     │  Founder         │      │
│   │  Intelligence  │     │  Advisory        │     │  Portfolio       │      │
│   └────────────────┘     └──────────────────┘     └──────────────────┘      │
│                                                                              │
│               ┌──────────────────────────────────┐                          │
│               │     7 Companion Mobile Apps      │                          │
│               │     (Expo / React Native)        │                          │
│               └──────────────────────────────────┘                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Products

### Core Platform

| Product | Domain | Key Capabilities |
|---------|--------|------------------|
| **Lyte** | Business Observability | PRISM framework, signal timeline, action queue, autonomous remediation, chaos prediction, operational narratives |
| **Alloy** | Execution Fabric | Signal routing, approval gates, workflow engine, audit trail, enterprise compliance |

### Domain Intelligence

| Product | Domain | Key Capabilities |
|---------|--------|------------------|
| **Aegis** | Cybersecurity & Defense | SOC command, MITRE ATT&CK, SOAR playbooks, adversary persona engine, attack replay theater, blast radius simulation, threat hunt workbench |
| **Vessels** | Maritime Intelligence | AIS fleet tracking, voyage digital twin, maritime knowledge graph, congestion prediction, compliance autopilot, AI morning briefs |
| **Terra** | Real Estate Intelligence | Property genome analysis, predictive distress scoring, deal war rooms, street-level market pulse, owner network graphs |
| **PRISM Counsel** | Legal Intelligence | Case outcome prediction, judge intelligence profiles, litigation war maps, smart discovery autopilot, recovery velocity tracking |
| **Carlota Jo** | Private Advisory | AI concierge, lifestyle intelligence graph, engagement timelines, discretion mode, UHNW client operations |

### Executive & Investor Surfaces

| Product | Domain | Key Capabilities |
|---------|--------|------------------|
| **SZL Holdings** | Corporate Platform | Portfolio command, investor intelligence engine, interactive pitch mode, platform flywheel visualization, revenue metrics |
| **Stephen Lutar** | Founder Portfolio | Interactive founder journey, live platform proof, thesis engine, investor due diligence dashboard |

### Mobile Applications (7)

Each web platform has a companion mobile app built with Expo/React Native, featuring voice commands, haptic feedback, biometric authentication, offline-first architecture, and cross-app command palette.

---

## Architecture

```
External Signals (integrations, telemetry, data feeds)
        │
        ▼
  Signal Normalization (Alloy)
        │
        ▼
  Context Engine (correlation, attribution, severity scoring)
        │
        ▼
  Routing Logic (priority classification, role assignment)
        │
   ┌────┴────────────────────────────────┐
   ▼                                     ▼
Auto-Execute (policy-approved)    Human Review Gate
   │                                     │
   └────────────────┬────────────────────┘
                    ▼
             Action Execution
                    │
                    ▼
          Immutable Audit Trail (append-only, actor-attributed)
```

### Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Languages** | TypeScript 5.9, SQL, HTML/CSS |
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, Framer Motion, Recharts, TanStack Query |
| **Mobile** | Expo SDK 53, React Native, expo-haptics, expo-speech, expo-local-authentication |
| **Backend** | Express 5, Drizzle ORM, Zod validation, Pino structured logging |
| **Database** | PostgreSQL 16, pgvector (AI embeddings), 415+ tables, 940+ indexes |
| **AI** | Multi-provider gateway (Anthropic, OpenAI, Gemini, Groq), evidence-backed hybrid retrieval |
| **Auth** | OIDC/PKCE, session-based, RBAC, SCIM 2.0 provisioning |
| **Build** | pnpm workspaces, esbuild, Vite, TypeScript project references |

---

## Trust & Governance

An AI-assisted operations platform carries a distinct trust burden. SZL Holdings addresses it structurally:

| Concern | Approach |
|---------|----------|
| **AI without oversight** | Advisory agents cannot execute consequential actions without explicit human confirmation — enforced at the Alloy workflow layer |
| **Opaque AI outputs** | All recommendations include source citations, confidence scores, and retrieval provenance |
| **Audit accountability** | Every action, approval, and decision generates an immutable audit event with actor attribution |
| **Access control** | Role-based access control with org-scoped tenant isolation. Every route and WebSocket channel is access-controlled |
| **Multi-tenancy** | All database queries include org_id scoping — cross-tenant access is architecturally prevented |
| **Data in transit** | TLS 1.3 for all connections. HMAC-signed WebSocket tickets with 5-minute TTL |

See [Trust Center](docs/trust/trust-center.md) · [Security Posture](docs/trust/security-posture.md)

---

## Repository Structure

```
szl-holdings-platform/
├── artifacts/                    # 16 deployable applications
│   ├── szl-holdings/             #   Corporate platform (React + Vite)
│   ├── firestorm/                #   Aegis cybersecurity command
│   ├── vessels/                  #   Maritime intelligence
│   ├── terra/                    #   Real estate intelligence
│   ├── lyte-command-center/      #   Business observability
│   ├── prism-counsel/            #   Litigation intelligence
│   ├── carlota-jo/               #   Private advisory
│   ├── stephen-site/             #   Founder portfolio
│   ├── api-server/               #   Unified API server (Express 5)
│   ├── *-mobile/                 #   7 companion mobile apps (Expo)
│   └── mockup-sandbox/           #   Component design sandbox
├── lib/                          # 6 shared libraries
│   ├── db/                       #   Drizzle ORM schemas (415+ tables)
│   ├── ai-engine/                #   Multi-provider AI gateway
│   ├── shared-ui/                #   Design system components
│   ├── workflow-engine/          #   Alloy execution fabric
│   ├── design-tokens/            #   Cross-platform design tokens
│   └── api-spec/                 #   OpenAPI specification
├── docs/                         # Architecture, investor, trust docs
├── ops/                          # Operational runbooks
└── scripts/                      # Build, deploy, maintenance
```

---

## Documentation

| Audience | Start Here |
|----------|------------|
| **Investor** | [Platform Thesis](docs/investor/platform-thesis.md) → [Product Readiness](docs/investor/product-readiness.md) → [Investor Overview](docs/investor/investor-overview.md) |
| **Technical Reviewer** | [Architecture](docs/architecture/system-overview.md) → [Data Flow](docs/architecture/data-flow.md) → [Platform Map](docs/architecture/platform-map.md) |
| **Enterprise Buyer** | [Trust Center](docs/trust/trust-center.md) → [Use Cases](docs/buyer/use-cases.md) → [Solution Brief](docs/buyer/solution-brief.md) |
| **Security** | [SECURITY.md](SECURITY.md) → [Security Posture](docs/trust/security-posture.md) → [Deployment Model](docs/trust/deployment-model.md) |

---

## Investor Due Diligence

The platform includes a live [Investor Dashboard](https://szlholdings.com/stephen/investor) with real-time database metrics, defensibility analysis, acquisition readiness scoring, and TAM analysis across 5 industries.

Key materials:

| Document | Description |
|----------|-------------|
| [Platform Thesis](docs/investor/platform-thesis.md) | Why this exists and where it's going |
| [Product Readiness](docs/investor/product-readiness.md) | What's built, what's validated |
| [Go-to-Market](docs/investor/go-to-market.md) | Revenue strategy and market approach |
| [Portfolio Overview](docs/investor/platform-portfolio.md) | All 16 applications with positioning |
| [Data Room Index](docs/investor/data-room-index.md) | Complete diligence document inventory |

---

## Release Status

**Current:** v0.1.0 — Initial Platform Release

**Active development:** Deep intelligence features across all verticals, mobile cross-platform capabilities, investor-grade surfaces.

See [CHANGELOG.md](CHANGELOG.md) · [ROADMAP.md](ROADMAP.md)

---

## Public Mirror Notice

This repository is a curated public mirror of the SZL Holdings platform workspace. The live development environment is the active source of truth. Proprietary modules, internal tooling, and sensitive configuration are intentionally excluded.

See [Public Mirror Policy](docs/public/public-mirror-policy.md) for details.

---

## License

Proprietary. All rights reserved. See [LICENSE.md](LICENSE.md).

---

## Contact

**Stephen Lutar** — Founder & CEO, SZL Holdings

| | |
|---|---|
| Enterprise & Partnerships | [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com) |
| Investment | [stephen@szlholdings.com](mailto:stephen@szlholdings.com) |
| Security Disclosures | [security@szlholdings.com](mailto:security@szlholdings.com) |
| Website | [szlholdings.com](https://szlholdings.com) |
| LinkedIn | [linkedin.com/in/stephen-l-279315240](https://linkedin.com/in/stephen-l-279315240) |
| X | [x.com/szlholdings](https://x.com/szlholdings) |
