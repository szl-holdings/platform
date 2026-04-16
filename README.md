# SZL Holdings

> The governed operational intelligence layer — connecting what is observable to what is executable, under governance, with full attribution.

[Architecture](./SYSTEM-OVERVIEW.md) · [Platform Primitives](./PLATFORM_PRIMITIVES.md) · [Trust Center](./docs/trust/trust-center.md) · [Security](./SECURITY.md) · [Category Positioning](./CATEGORY_POSITIONING.md) · [Investor Docs](./docs/investor/platform-thesis.md)

---

## What This Is

Enterprise operations have an accountability gap. Dashboards show what happened. Alerts show what's wrong. Neither tells operators *what to do next*, *who is responsible*, or *whether the recommended action is safe to execute*.

AI tools compound the problem. They add recommendation volume without governance. Operators end up with more data, more noise, and more untracked decisions running in parallel.

SZL Holdings builds the governed decision layer that sits between signal detection and action execution:

```
Signal → Context → Recommendation → Simulation → Policy → Approval → Execution → Proof → Outcome
```

Every step is instrumented. Every decision is attributed. Every AI recommendation carries source citations and confidence scores. Every consequential action requires human confirmation.

---

## Platform Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  COMMAND SURFACES                                                    │
│                                                                      │
│  Lyte              Command Portal        CORTEX                     │
│  Operator command   Ecosystem overview    Unified mobile command    │
│  PRISM framework    8-domain dashboard    All domains, one app      │
├─────────────────────────────────────────────────────────────────────┤
│  DOMAIN PACKS                                                        │
│                                                                      │
│  Aegis         Vessels       Terra        Carlota Jo               │
│  Security &    Maritime      Real Estate  Premium                  │
│  Defense       Intelligence  Intelligence Advisory                 │
├─────────────────────────────────────────────────────────────────────┤
│  GOVERNANCE INFRASTRUCTURE                                           │
│                                                                      │
│  Outcome Graph  ·  Proof Chain  ·  Covenant Policy  ·  Monte Carlo  │
│  Workflow Engine  ·  PRISM Bus  ·  AI Engine  ·  RBAC + Auth        │
├─────────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                          │
│                                                                      │
│  PostgreSQL 16 (Drizzle ORM)  ·  561 tables  ·  112 schema files   │
│  External feeds: AIS, STIX/TAXII, sanctions, court records          │
└─────────────────────────────────────────────────────────────────────┘
```

**Lyte** is the command surface — where operators observe signals, review recommendations, and make decisions.

**Alloy** is the execution fabric — where workflows are orchestrated, approvals are enforced, and audit trails are generated.

**Domain packs** extend the same governance infrastructure into domain-specific intelligence: security (Aegis), maritime (Vessels), real estate (Terra), and advisory (Carlota Jo).

**CORTEX** provides unified mobile command across all domains in a single native app.

---

## Five Platform Primitives

What makes this structurally different from dashboards, copilots, and workflow tools:

| Primitive | What It Does | Why It Matters |
|-----------|-------------|----------------|
| **Outcome Graph** | Tracks the full lifecycle: recommendation → decision → outcome | Closed-loop learning — the platform knows which recommendations led to which results |
| **Proof Chain** | Immutable, verifiable audit trail for every significant action | Compliance teams can reconstruct any decision chain. AI outputs carry provenance. |
| **Covenant Policy** | Defines what agents and users can do, with what approval requirements | Human-in-the-loop is enforced at the policy layer — AI cannot bypass it |
| **Monte Carlo** | Probabilistic simulation before action — confidence intervals and sensitivity analysis | Operators see not just "what should we do" but "what could happen if we do it" |
| **Workflow Engine** | Durable multi-step process orchestration with agent coordination | Complex decisions are tracked, governed, and recoverable — not opaque one-shots |

See [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) for the full specification of each primitive.

---

## Products

| Product | Domain | Purpose | Status |
|---------|--------|---------|--------|
| **Lyte** | Governed command | Command surface — PRISM framework, signal timeline, action queue, approval chains | Functional alpha |
| **Alloy** | Execution fabric | Workflow orchestration, approval gates, immutable audit trail | Functional alpha |
| **Aegis** | Security & defense | SOC command, MITRE ATT&CK, SOAR playbooks, threat intelligence | Functional alpha |
| **Vessels** | Maritime intelligence | AIS fleet tracking, sanctions screening, voyage economics, dark vessel detection | Functional alpha |
| **Terra** | Real estate intelligence | NYC distress pipeline, ownership graph, deal workflow, market signals | Functional alpha |
| **Carlota Jo** | Premium advisory | UHNW advisory operations — client portal, service catalog, booking | Live |
| **IMPERIUM** | Cloud sovereignty | Infrastructure control and infrastructure mode — merged into Command Portal | Merged |
| **CORTEX** | Unified mobile | All domain workspaces in one app — biometric auth, cross-domain signals | Functional alpha |
| **Command Portal** | Ecosystem hub | Real-time 8-domain dashboard, executive briefing, global search | Functional alpha |

---

## Trust

An AI-assisted operations platform carries a distinct trust burden. SZL Holdings addresses it structurally:

| Concern | How It Is Addressed |
|---------|---------------------|
| AI without oversight | Covenant Policy enforces approval gates — AI cannot execute consequential actions without human confirmation |
| Opaque AI outputs | All recommendations include source citations, confidence scores, and retrieval provenance via Proof Chain |
| Audit accountability | Every action generates an immutable audit event with actor attribution via Proof Chain |
| Access control | 11-role RBAC with org-scoped tenant isolation. Deny-by-default global auth enforcer |
| Multi-tenancy | All queries scoped by `org_id`. Cross-org access returns 404 to prevent information leakage |
| AI governance | Advisory agents only — governance enforced at the Alloy layer, not the UI layer |
| Decision traceability | Outcome Graph tracks the full chain: signal → recommendation → decision → outcome |

See [Trust Center](docs/trust/trust-center.md) · [Security](SECURITY.md) · [Proof and Policy Model](PROOF_AND_POLICY_MODEL.md)

---

## Technology

| Layer | Stack |
|-------|-------|
| Language | TypeScript (full stack) |
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion, Recharts |
| Mobile | Expo / React Native, NativeWind |
| Backend | Express 5, Node.js |
| Database | PostgreSQL 16, Drizzle ORM (561 tables, 112 schema files) |
| AI | OpenAI, Anthropic, Gemini — multi-provider with fallback. 9 schema-validated decision types |
| Auth | OIDC/PKCE, 11-role RBAC, SCIM 2.0, Azure AD multi-tenant SSO |
| Real-time | WebSocket (signed tickets), SSE, push notifications |
| Event system | PRISM Bus (cross-domain), Forge Runtime (agent execution) |
| Monorepo | pnpm workspaces — 51 packages |

---

## Local Development

```bash
git clone https://github.com/szl-holdings/szl-holdings-platform.git
cd szl-holdings-platform
pnpm install
pnpm dev
```

See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for staging and production deployment.

---

## Deployment

| Environment | Purpose | Trigger |
|-------------|---------|---------|
| **Replit Workspace** | Active development, internal preview | Always on |
| **Staging** | Integration validation before production | Auto on push to `main` via `deploy-staging.yml` |
| **Production** | Customer-facing deployment | On published release via `deploy-production.yml` |

See [Deployment Model](docs/trust/deployment-model.md) · [Branch Protection & CI/CD Settings](.github/BRANCH_PROTECTION.md)

---

## Documentation

### Canonical Diligence Documents

These top-level documents are the canonical reference for Series A diligence, enterprise evaluation, and technical review. They consolidate and cross-link content from the full `/docs/` suite.

| Document | Purpose |
|----------|---------|
| [SYSTEM-OVERVIEW.md](SYSTEM-OVERVIEW.md) | High-level platform overview for non-technical stakeholders |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture: topology, stack, monorepo structure, design principles |
| [PRODUCT-SURFACES.md](PRODUCT-SURFACES.md) | All product surfaces with status, audience, tech stack |
| [DATA-MODEL.md](DATA-MODEL.md) | Entity-relationship overview of the core database schema |
| [API-SPEC.md](API-SPEC.md) | API surface: route inventory, auth model, rate limiting |
| [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) | Role-permission matrix mapped to implementation |
| [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md) | Security controls checklist mapped to actual implementation |
| [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) | Deployment procedures for Replit and Azure |
| [OPERATIONS-RUNBOOK.md](OPERATIONS-RUNBOOK.md) | Operational procedures, failure modes, incident response |
| [ANALYTICS-EVENTS.md](ANALYTICS-EVENTS.md) | Analytics event taxonomy, funnel definitions, privacy rules |
| [KNOWN-GAPS.md](KNOWN-GAPS.md) | Honest assessment of tech debt, gaps, and planned improvements |

### Full Documentation Suite (`/docs/`)

### Platform Narrative
| Document | Purpose |
|----------|---------|
| [CATEGORY_POSITIONING.md](CATEGORY_POSITIONING.md) | What "governed operational intelligence" means and why it matters |
| [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) | The five core abstractions that define the platform |
| [PROOF_AND_POLICY_MODEL.md](PROOF_AND_POLICY_MODEL.md) | How trust is recorded and enforced |
| [DECISION_SIMULATION.md](DECISION_SIMULATION.md) | Monte Carlo simulation across domains |

### Technical Reference
| Document | Purpose |
|----------|---------|
| [SYSTEM-OVERVIEW.md](SYSTEM-OVERVIEW.md) | Architecture organized around the governed decision loop |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Service topology, shared libraries, data flow |
| [API-SPEC.md](API-SPEC.md) | Full REST/GraphQL/MCP API catalogue |
| [DATA-MODEL.md](DATA-MODEL.md) | Database schema overview |
| [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) | Role/route/permission mappings |

### Product
| Document | Purpose |
|----------|---------|
| [PRODUCT-SURFACES.md](PRODUCT-SURFACES.md) | Every user-facing artifact with purpose and audience |
| [PRODUCT_SURFACE_MAP.md](PRODUCT_SURFACE_MAP.md) | Which primitives power which surfaces |
| [NAVIGATION_STRATEGY.md](NAVIGATION_STRATEGY.md) | Information architecture and navigation model |
| [DEMO_GUIDE.md](DEMO_GUIDE.md) | How to run demos for different audiences |
| [ROUTE_INVENTORY.md](ROUTE_INVENTORY.md) | Complete route inventory with classification |

### Operations
| Document | Purpose |
|----------|---------|
| [OPERATIONS-RUNBOOK.md](OPERATIONS-RUNBOOK.md) | Monitoring, incident triage, failure modes |
| [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) | Staging and production deployment |
| [SECURITY.md](SECURITY.md) | Security policy and responsible disclosure |
| [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) | Incident handling procedures |

### Brand & Company
| Document | Purpose |
|----------|---------|
| [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md) | Visual identity, voice, and standards |
| [COMPANY_FACT_SHEET.md](COMPANY_FACT_SHEET.md) | One-page company summary |
| [PRESS_KIT.md](PRESS_KIT.md) | Media-ready overview and boilerplate |
| [TRUST_CENTER_INDEX.md](TRUST_CENTER_INDEX.md) | Index for all trust documentation |

### Investor
| Document | Purpose |
|----------|---------|
| [docs/investor/platform-thesis.md](docs/investor/platform-thesis.md) | Category thesis and investment case |
| [docs/investor/investor-overview.md](docs/investor/investor-overview.md) | Company overview for investors |
| [docs/investor/product-readiness.md](docs/investor/product-readiness.md) | Honest product status assessment |
| [docs/investor/go-to-market.md](docs/investor/go-to-market.md) | GTM strategy and sequencing |

### Trust & Security
| Area | Document |
|------|----------|
| Trust center | [docs/trust/trust-center.md](docs/trust/trust-center.md) |
| Security posture | [docs/trust/security-posture.md](docs/trust/security-posture.md) |
| Access control policy | [docs/ACCESS_CONTROL.md](docs/ACCESS_CONTROL.md) |
| Secrets policy | [docs/SECRETS_POLICY.md](docs/SECRETS_POLICY.md) |
| Deployment model | [docs/trust/deployment-model.md](docs/trust/deployment-model.md) |

### Operations & Development
| Area | Document |
|------|----------|
| Ops runbook (source) | [docs/ops-runbook.md](docs/ops-runbook.md) |
| Replit operations | [REPLIT_OPERATIONS.md](REPLIT_OPERATIONS.md) |
| Environment variable matrix | [ENV_MATRIX.md](ENV_MATRIX.md) |
| Deployment readiness checklist | [DEPLOYMENT_READINESS.md](DEPLOYMENT_READINESS.md) |
| Route inventory | [ROUTE_INVENTORY.md](ROUTE_INVENTORY.md) |
| Analytics plan | [ANALYTICS_PLAN.md](ANALYTICS_PLAN.md) |
| Disaster recovery | [docs/disaster-recovery.md](docs/disaster-recovery.md) |
| Backup & recovery | [BACKUP_AND_RECOVERY.md](BACKUP_AND_RECOVERY.md) |

### Process & Governance
| Area | Document |
|------|----------|
| Release process | [RELEASE_PROCESS.md](RELEASE_PROCESS.md) |
| Release checklist | [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) |
| Release notes | [docs/releases/v0.1.0.md](docs/releases/v0.1.0.md) |
| Changelog | [CHANGELOG.md](CHANGELOG.md) |
| Incident response | [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) |
| Security disclosure | [SECURITY.md](SECURITY.md) |
| Contributing | [CONTRIBUTING.md](CONTRIBUTING.md) |

---

**Stephen Lutar** — Founder & CEO, SZL Holdings
