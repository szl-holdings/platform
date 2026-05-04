# SZL Holdings — Technical Due Diligence Packet

**Purpose:** Structured technical due diligence document for growth capital investors and institutional evaluators.

**Prepared:** April 2026
**Contact:** inquiries@szlholdings.com

---

## Executive Summary

SZL Holdings is a technology holding company building a unified governed decision infrastructure platform. The technical architecture reflects a deliberate, compounding design: one execution fabric (Alloy), one design system, one authentication model, and one data layer — shared across five domain-specific platforms.

The platform is production-grade in architecture. It is pre-revenue by choice (billing infrastructure is built; activation is awaiting commercial milestone). The growth capital proceeds will fund: live data feed integration at enterprise tier, team growth (3–5 engineers), and the first revenue-generating customer deployments.

---

## Section 1: Architecture

### Platform Topology

```
SZL Holdings (corporate surface)
│
├── API Server (Express / Node.js)
│   ├── Authentication (Replit OIDC / PKCE)
│   ├── RBAC Middleware
│   ├── Domain Routes (/api/lyte/, /api/vessels/, /api/aegis/, /api/terra/)
│   ├── Alloy Workflow Engine
│   ├── Alloy Governance (audit trail, proof chain, policy engine)
│   ├── Job Queue
│   └── WebSocket Server
│
├── Shared Database (PostgreSQL)
│   ├── Shared schema (auth, audit, proof chain, signals, entities)
│   └── Domain schemas (vessels, aegis, terra, lyte, prism-counsel)
│
├── Frontend Applications (React + Vite + TypeScript)
│   ├── SZL Holdings Corporate (/)
│   ├── Aegis (/aegis/)
│   ├── Vessels (/vessels/)
│   ├── Terra (/terra/)
│   ├── Carlota Jo (/carlota-jo/)
│   ├── Counsel (/prism-counsel/)
│   └── Command Portal (/command/)
│
├── Mobile Application (Expo / React Native)
│   └── APEX — Mobile Command (iOS + Android)
│
└── Shared Libraries
    ├── @workspace/shared-ui (design system)
    ├── @workspace/db (Drizzle ORM + schema)
    ├── lib/workflow-engine (Alloy core)
    ├── lib/observability (signal processing)
    ├── lib/audit (audit trail)
    ├── lib/proof-chain (immutable attribution)
    ├── lib/covenant-policy (policy engine)
    ├── lib/pulse-evals (AI eval framework)
    └── lib/ai-engine (agent coordination)
```

### Technology Choices and Rationale

| Choice | Rationale |
|---|---|
| **TypeScript throughout** | Type safety across a monorepo with 15+ packages requires strict typing. No JS/TS mixing. |
| **pnpm monorepo** | Single dependency graph across all packages. Shared code is a first-class citizen, not copy-paste. |
| **PostgreSQL + Drizzle ORM** | Relational model is the right choice for the entity graph and audit trail. Drizzle provides type-safe queries without the runtime overhead of an ORM. |
| **Express (not Next.js API routes)** | A dedicated API server is essential for multi-artifact architecture. Next.js API routes would create per-artifact API isolation that defeats the shared backbone. |
| **React + Vite (not Next.js)** | Five separate Vite apps sharing components via workspace packages. SSR not required at this stage — the platform is authenticated-first, not public-web-first. |
| **Expo / React Native** | Cross-platform mobile with web asset sharing. The design system (`@workspace/shared-ui`) is referenced across web and mobile. |
| **Replit OIDC (PKCE)** | Enterprise-grade authentication without password storage. PKCE is the correct flow for SPAs. |

---

## Section 2: Security Architecture

### Authentication

- **Protocol:** OpenID Connect with PKCE flow
- **Provider:** Replit Auth (enterprise-grade identity; no password storage in SZL systems)
- **Session:** Server-side session with HMAC-signed tokens; TTL configurable per environment
- **WebSocket auth:** HMAC-signed ticket with TTL and per-channel ACL

### Authorization

- **Model:** Role-based access control (RBAC) with organization scoping
- **Roles:** `admin`, `operator`, `analyst`, `viewer`, `external`
- **Enforcement:** Middleware on every API route; no client-side-only gating
- **Multi-tenancy:** All data queries include `WHERE workspace_id = ?` — no cross-tenant data access possible without privilege escalation

### Data Protection

- **At rest:** PostgreSQL with platform-managed encryption
- **In transit:** TLS via Replit deployment (automatic)
- **Secrets:** All secrets in Replit Secrets (not in code or .env files)
- **SQL injection:** Prevented by Drizzle ORM parameterized queries
- **XSS:** Prevented by React's DOM escaping + Helmet.js CSP headers
- **CSRF:** CSRF middleware on all state-mutating routes

### Audit and Governance

- **Audit trail:** Immutable event log for all significant platform actions
- **Proof chain:** Cryptographically linked action attribution records
- **Decision Ledger:** Full provenance chain from signal to outcome (see `docs/DECISION_LEDGER.md`)
- **Agent attribution:** Every AI-assisted action carries the agent ID and model version

### Known Security Limitations (Pre-GA)

| Limitation | Plan |
|---|---|
| CORS_ORIGINS not configured for production | Set before first enterprise deploy |
| Penetration testing not completed | Scheduled post-growth capital |
| SOC 2 Type II not in progress | Planned for Series B preparation |
| Sentry error monitoring not configured | Configure at production deploy |

---

## Section 3: Data Architecture

### Database Schema

**Shared tables (all platforms):**
- `users` — platform users with role and organization
- `organizations` — tenant organizations
- `workspaces` — tenant workspace contexts
- `sessions` — active auth sessions
- `audit_events` — immutable audit log
- `proof_chain_entries` — immutable action attribution
- `signals` — canonical business and technical signals
- `inferences` — AI agent inference records
- `actions` — proposed and executed actions
- `approvals` — human approval records
- `workflows` — Alloy workflow runs
- `workflow_steps` — individual workflow step records
- `policies` — governance policy definitions

**Domain tables (per platform):**
- `vessels.*` — fleet, voyages, positions, compliance records
- `aegis.*` — incidents, threats, assets, compliance frameworks
- `terra.*` — properties, deals, ownership records
- `lyte.*` — PRISM signals, business metrics, connector integrations
- `prism_counsel.*` — matters, clients, billing records

### Data Integrity

- All writes go through the API server — no direct database access from frontend
- Foreign key constraints enforced at the database level
- `onConflictDoNothing()` for idempotent seed operations
- Drizzle push migrations tracked in version control
- Audit events are INSERT-only (no UPDATE or DELETE)

---

## Section 4: AI Architecture

### Model Integration

- **Providers:** OpenAI (GPT-4o), Anthropic (Claude 3.5), Google Gemini (Gemini 1.5) — via Replit AI proxy (no vendor key required in dev; direct keys for production)
- **Routing:** Model routing is configurable per agent and per domain — the platform is not locked to one provider
- **Governance:** Every model call is recorded with model ID, version, and token usage

### Agent Framework

- Agents are registered in the Agent Registry with: `agent_id`, `domain`, `model_id`, `policy_scope`, `action_scope`
- Agents operate advisory-only — they propose; humans confirm
- Every inference carries: confidence score, reasoning chain, evidence references, policy references
- Agent eval framework defined in `docs/AGENT_EVAL_AND_REPLAY.md`

### AI Governance

- Human-in-the-loop gates are enforced at the Alloy workflow engine level — not just in the UI
- `ALLOY_REQUIRE_APPROVAL_CRITICAL=true` is a backend configuration, not a frontend flag
- Agent model versions are tracked and tied to eval run records
- Promotion gate: aggregate eval score ≥ 0.85, zero safety violations, human reviewer approval

---

## Section 5: Operational Readiness

### Platform Stability

| Signal | Status |
|---|---|
| TypeScript compilation | Zero errors across all packages |
| Quality audit scripts | All passing (routes, mocks, copy, design system, broken links) |
| API health endpoint | Comprehensive — database, job queue, storage, auth, AI all checked |
| Seed data | Idempotent; runs on startup without fatal errors |

### Monitoring (Current State)

- **Logging:** Pino structured logging throughout API server
- **Log level:** Configurable via `LOG_LEVEL` environment variable
- **Health endpoint:** `/api/health` with sub-service status
- **Gap:** Distributed tracing (OTel) not yet instrumented — spec complete in `docs/OBSERVABILITY_SPEC.md`

### Deployment

- **Platform:** Replit (current); Azure Bicep IaC prepared for enterprise/cloud migration
- **Deployment model:** Per-artifact workflow; independent deployment per platform
- **Rollback:** Replit checkpoint system + git history
- **Database migrations:** Drizzle push (forward-only)

---

## Section 6: What Is Real vs. Requires External Setup

### Currently Real

| Capability | Evidence |
|---|---|
| OIDC authentication | Real sessions; PKCE verified |
| PostgreSQL database | Real queries; real data; real schema |
| Alloy workflow engine | Real durable execution; real audit trail |
| Proof chain | Real immutable records |
| CISA KEV integration | Live API; updated daily |
| NVD CVE integration | Live API |
| MITRE ATT&CK v14 | Live data |
| NYC distress pipeline (Terra) | Live NYC Open Data APIs |
| AI inference | Real calls via Replit AI proxy |
| Job queue | Real background execution |

### Requires External Setup

| Capability | Status | Effort |
|---|---|---|
| Live AIS feed (Vessels) | Not connected | Commercial agreement + 2 weeks integration |
| Stripe live mode | Keys not configured | Hours — infrastructure built |
| SCIM provisioning | Endpoint built; needs IdP config per tenant | Per-tenant hours |
| Azure AD SSO | Code built; needs tenant admin consent | Per-tenant hours |
| Email delivery | Graceful fallback; no RESEND_API_KEY | Hours — configure key |
| Error monitoring (Sentry) | Not configured | Hours |
| Production DNS/domains | Not configured | Hours per domain |

---

## Section 7: Engineering Capacity and Roadmap

### Current Engineering

- 1 founding engineer (systems architect and full-stack developer)
- No technical debt from outside contractors or acquired code
- All code written and owned by the founding team

### growth capital Engineering Plan

| Hire | Role | Priority |
|---|---|---|
| Senior full-stack engineer | Product velocity | P0 |
| Data/integration engineer | Live feed integrations (AIS, SIEM connectors) | P0 |
| DevOps / platform engineer | CI/CD, OTel, SLO monitoring | P1 |
| Domain specialist (security or maritime) | Domain expertise for Aegis or Vessels | P1 |
| QA / integration testing | Test coverage, smoke testing | P2 |

### 12-Month Technical Roadmap

**Months 1–3:**
- Live AIS data integration (Vessels enterprise tier)
- Stripe billing activation (all platforms)
- OTel instrumentation (API + Alloy)
- Agent eval infrastructure implementation
- First enterprise tenant onboarding

**Months 4–6:**
- SCIM provisioning at scale
- SOC 2 Type II readiness track
- Cross-domain intelligence (signal correlation across domain packs)
- APEX mobile feature parity with web

**Months 7–12:**
- Terra national coverage expansion
- Aegis StateRAMP readiness track
- Lyte enterprise connector integrations (Salesforce, Jira, ServiceNow)
- Platform generalisation for next vertical

---

## Section 8: Intellectual Property

- All code is original, written by the founding team
- No open-source license conflicts (all dependencies are permissive)
- No third-party code incorporated via acquisition
- Domain architecture, state model, decision ledger, and governance model are proprietary

---

*Additional materials available upon request: code repository access, architecture walkthrough session, reference customer introductions (post-LOI).*
