# Technical Diligence Packet — SZL Holdings Platform

**Version:** 1.0 · **Date:** April 2026  
**Audience:** Series A technical advisors, enterprise architects, engineering leaders, CISOs  
**Classification:** Confidential — NDA required

> This document is the primary technical reference for diligence review. It consolidates architecture, tenancy model, trust/governance controls, deployment approach, operational procedures, AI oversight, observability, and known gaps into a single evaluable record. Supporting documentation is cross-referenced throughout.

---

## Executive Summary

SZL Holdings has built a production-grade, enterprise-ready governed decision infrastructure platform. As of April 2026:

- **Full-stack TypeScript monorepo** — 40+ packages, single API server, unified design system
- **2,331 API endpoints** across 172 route files with deny-by-default global auth enforcement
- **700+ database tables** in PostgreSQL 16 with org-scoped tenant isolation on every query
- **11-role RBAC** with OIDC/PKCE authentication, SCIM 2.0, and Azure AD SSO
- **Six governance primitives** (Proof Chain, Covenant Policy, Outcome Graph, Monte Carlo, Workflow Engine, Event Fabric) shared across all domain packs
- **All P0 security gaps resolved** in the April 2026 hardening sprint; Phase 2–3 audit found 3 new P1 and 7 new P2 gaps, all tracked with Sprint 3 remediation owners
- **Functional Alpha** across all platforms with seeded/demo data — not yet commercially deployed

---

## 1. Architecture

### 1.1 Architectural Thesis

The platform is organized around one principle: **every consequential decision follows the same governed loop, regardless of domain**.

```
Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning
```

This loop is not replicated per domain — it is implemented once in shared infrastructure and inherited by every domain pack.

![SZL Holdings platform map — command surfaces, execution fabric, domain packs, and shared governance primitives](assets/readme/architecture/platform-map.svg)

### 1.2 Platform Layer Model

```
┌──────────────────────────────────────────────────────────────────┐
│  PLATFORM: SZL Holdings — Governed Decision Infrastructure     │
├──────────────────────────────────────────────────────────────────┤
│  COMMAND SURFACES                                                │
│  Lyte (flagship)    CORTEX (mobile)    Command Portal (hub)      │
│  PRISM framework    iOS + Android      8-domain SSE dashboard    │
├──────────────────────────────────────────────────────────────────┤
│  EXECUTION FABRIC                                                │
│  Alloy — Workflow orchestration · Approval gates · Audit trail   │
├──────────────────────────────────────────────────────────────────┤
│  DOMAIN PACKS                                                    │
│  Aegis (Security)  Vessels (Maritime)  Terra (Real Estate)       │
│  PRISM Counsel (Legal)  Carlota Jo (Advisory)  IMPERIUM (Cloud)  │
├──────────────────────────────────────────────────────────────────┤
│  GOVERNANCE PRIMITIVES (shared by every surface)                 │
│  Outcome Graph · Proof Chain · Covenant Policy                   │
│  Decision Simulation · Workflow Engine · Event Fabric            │
├──────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                      │
│  PostgreSQL 16 (Drizzle ORM) · 700+ tables · 116 schema files   │
│  External: AIS, STIX/TAXII, sanctions, court records             │
└──────────────────────────────────────────────────────────────────┘
```

### 1.3 Service Topology

Single API server pattern. All web and mobile clients call one Express 5 API server:

```
Web Clients (React + Vite)  →  artifacts/api-server (Express 5, Node 20, TypeScript)
Mobile Clients (Expo/RN)    →  artifacts/api-server
                                     │
                         ┌───────────┴───────────┐
                         ▼                       ▼
               PostgreSQL 16             External Services
               (Drizzle ORM)            OpenAI / Anthropic / Gemini
               700+ tables              Stripe · Resend · Mapbox
               org-scoped               AIS · STIX · CourtListener
```

### 1.4 Monorepo Structure

```
/
├── artifacts/          # 14 deployable applications (web + mobile)
│   ├── api-server/     # Single Express backend for all surfaces
│   ├── szl-holdings/   # Corporate + investor portal
│   ├── command/        # Unified ops command (absorbs Lyte + IMPERIUM)
│   ├── aegis/          # Aegis — Security & Defense Intelligence
│   ├── vessels/        # Vessels — Maritime Intelligence
│   ├── terra/          # Terra — Real Estate Intelligence
│   ├── carlota-jo/     # Carlota Jo — Premium Advisory
│   └── szl-holdings-mobile/  # CORTEX — Unified Mobile Command
│
├── lib/                # 37 shared TypeScript packages
│   ├── db/             # Drizzle schema + migrations (700+ tables)
│   ├── shared-ui/      # Cross-app React component library
│   ├── auth/           # OIDC auth + session management
│   ├── workflow-engine/# Alloy execution fabric
│   ├── ai-engine/      # AI inference + orchestration (Nuro Mesh)
│   ├── audit/          # Immutable audit trail
│   ├── prism-bus/      # Cross-domain event bus
│   ├── proof-chain/    # Cryptographic audit trail
│   ├── monte-carlo/    # Probabilistic simulation
│   ├── covenant-policy/# Policy enforcement engine
│   ├── outcome-graph/  # Decision lifecycle tracking
│   ├── forge-runtime/  # Durable job queue + agent execution
│   └── intelligence-feeds/ # AIS, STIX/TAXII, legal data adapters
│
└── infra/              # Azure Bicep IaC templates
```

### 1.5 Technology Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (full stack, strict mode) |
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion, Recharts |
| Mobile | Expo / React Native, NativeWind |
| Backend | Express 5, Node.js 20 |
| Database | PostgreSQL 16, Drizzle ORM |
| AI | OpenAI, Anthropic, Gemini — multi-provider with fallback |
| Auth | OIDC/PKCE, 11-role RBAC, SCIM 2.0, Azure AD SSO |
| Real-time | WebSocket (HMAC-signed tickets), SSE, Expo Push |
| Event system | PRISM Bus (cross-domain), Forge Runtime (agent execution) |
| Monorepo | pnpm workspaces, TypeScript project references |
| IaC | Azure Bicep (App Service, PostgreSQL, Key Vault, Redis, CDN) |
| API format | OpenAPI 3.1, GraphQL (Apollo), MCP |

See [architecture.md](../architecture/architecture.md) for the full architecture reference.

### 1.6 Representative Product Surfaces

The following screenshots show representative live surfaces drawn from across the platform — the unified command portal that aggregates all domain packs, the Aegis security command, and the Terra real estate intelligence command. Each surface is built on the same six governance primitives described in §3.3.

![Unified Command Portal — cross-domain ops command surface](assets/readme/products/command-portal.jpg)

![Aegis — unified Security & Defense command surface](assets/readme/products/aegis-command.jpg)

![Terra — Real Estate Intelligence command surface with NYC distress pipeline and ownership graph](assets/readme/products/terra-real-estate.jpg)

![SZL Holdings ecosystem map — how command surfaces, execution fabric, domain packs, and external signal sources interconnect](assets/readme/architecture/ecosystem-map.svg)

---

## 2. Tenancy and Isolation Model

### 2.1 Multi-Tenancy Architecture

The platform uses **organization-scoped tenant isolation**. Every user belongs to one or more organizations (`orgs`). All data access is scoped by `org_id` at four independent enforcement layers:

| Layer | Mechanism |
|-------|-----------|
| Database query | Every query includes `WHERE org_id = ?` via shared query builders |
| ORM | Drizzle ORM queries always include org scope — no raw SQL bypasses |
| API middleware | `tenantScope` middleware verifies org membership on applicable routes |
| WebSocket | Channel names include `org_id` prefix; HMAC tickets enforce isolation |

Cross-org access returns `404` (not `403`) to prevent information leakage about org existence.

### 2.2 AI/RAG Tenant Isolation

The AI retrieval layer (`alloyRetrieval`) was a P0 gap resolved in April 2026. All fixes are confirmed:

- `tenant_id` column added to `rag_knowledge_chunks` table with indexed enforcement
- `tenantId` field added to `RetrievalChunk` type; all retrieval methods enforce tenant scope
- `graph-rag.ts` propagates tenant ID through the full retrieval chain
- `totalIndexed` in retrieval responses no longer leaks cross-tenant corpus size

See [KNOWN-GAPS.md](../operations/known-gaps.md) for the full remediation record.

### 2.3 Enterprise Provisioning

SCIM 2.0 is implemented for enterprise user lifecycle management:
- Azure AD integration for SSO + automated user provisioning
- Role mapping from Azure AD groups to platform roles
- Automated deprovisioning on user offboarding
- Audit log entry for every provisioning action

---

## 3. Trust and Governance Model

### 3.1 Authentication

| Mechanism | Details |
|-----------|---------|
| Primary | OIDC/PKCE — no password storage in platform systems |
| Fallback | Email/password with PBKDF2 (SHA-512, 100K iterations, 64-byte key) |
| Sessions | Server-side, PostgreSQL-backed. `sid` cookie is opaque random token |
| Cookie | HttpOnly, Secure (unconditional), SameSite=Lax |
| TTL | OIDC sessions: 7 days. Credential sessions: 30 days |
| WebSocket | HMAC-signed tickets, 5-minute TTL, per-channel role ACL |
| CSRF | Double-submit cookie on all mutating requests |

### 3.2 Authorization

**11-role platform hierarchy:**

| Role | Description |
|------|-------------|
| `founder_admin` | Full platform access — founder only |
| `platform_admin` | Platform-level administration |
| `operator` | Standard platform operator |
| `ops_manager` | Operations management |
| `analyst` | Read-only analytical access |
| `executive_viewer` | Executive read-only |
| `sales_delivery_user` | Sales and delivery |
| `maritime_ops_user` | Maritime-specific operations |
| `service_coordinator` | Service coordination |
| `pilot_customer_user` | Pilot / early-access |
| `anonymous_visitor` | No platform access |

**Global auth enforcer:** Deny-by-default on all `/api/*` routes. Explicit public allowlist limited to: health, auth, webhooks, SCIM, docs, and a small set of exact-path exceptions. Defined in `global-auth-enforcer.ts`.

**Admin access:** `super_admin` role cannot be granted through the UI — requires direct database write. All `super_admin` actions are logged in the immutable audit trail.

### 3.3 The Six Governance Primitives

These are the structural abstractions that enforce governance at the platform layer — not the UI layer:

| Primitive | Library | What It Enforces |
|-----------|---------|-----------------|
| **Proof Chain** | `@szl-holdings/proof-chain` | Immutable, cryptographically verifiable audit trail for every significant action. AI outputs carry model identity, source citations, and confidence scores. |
| **Covenant Policy** | `@szl-holdings/covenant-policy` | Permission and approval gates. Human-in-the-loop is an enforced policy constraint — AI cannot bypass it. |
| **Outcome Graph** | `@szl-holdings/outcome-graph` | Tracks recommendation → decision → outcome. Enables closed-loop AI calibration. |
| **Decision Simulation** | `@szl-holdings/monte-carlo` | Monte Carlo probabilistic simulation before action. Confidence intervals, sensitivity analysis, scenario comparison. |
| **Workflow Engine** | `@szl-holdings/workflow-engine` | Durable multi-step process orchestration with state persistence, approval gates, and checkpoint recovery. |
| **Event Fabric** | `@szl-holdings/prism-bus` | Cross-domain signal backbone — normalizes, routes, and correlates events across all domain packs. |

See [PLATFORM_PRIMITIVES.md](../architecture/platform-primitives.md) and [PROOF_AND_POLICY_MODEL.md](../architecture/proof-and-policy-model.md).

---

## 4. Deployment Architecture

### 4.1 Environment Model

| Environment | Purpose | Trigger |
|-------------|---------|---------|
| Replit Workspace | Active development, internal preview | Always on |
| Staging | Integration validation | Auto on push to `main` |
| Production | Customer-facing | On published release |

### 4.2 Infrastructure (Production Target)

Azure-hosted. IaC via Bicep templates in `/infra/`:

| Component | Azure Service |
|-----------|-------------|
| API Server | Azure App Service (Node 20) |
| Database | Azure Database for PostgreSQL Flexible Server 16 |
| Secrets | Azure Key Vault |
| Cache | Azure Cache for Redis |
| CDN | Azure Front Door |
| Storage | Azure Blob Storage |
| AI (backup) | Azure OpenAI Service |

### 4.3 Data Residency

- Primary deployment: US region (Azure East US 2)
- EU deployment available via Bicep template parameterization
- No cross-region data replication by default; configurable per enterprise contract

See [DEPLOYMENT-GUIDE.md](../operations/deployment-guide.md) and [docs/trust/deployment-model.md](../trust/deployment-model.md).

---

## 5. Operational Controls

### 5.1 Middleware Chain

Every API request passes through this ordered middleware chain before reaching a route handler:

```
correlationId → apiVersion → helmet → CORS → compression →
globalLimiter → telemetry → pino HTTP logging → cookieParser →
JSON body → CSRF → authMiddleware (session hydrator) →
sessionRefreshPolicy → globalAuthEnforcer → tenantScope
```

### 5.2 Rate Limiting

- Global rate limiter applied to all API routes
- Domain-specific limits on AI inference routes
- Stripe webhook routes exempted from global limiter (use Stripe signature verification instead)

### 5.3 Secrets Management

- All credentials managed via environment variable injection
- No secrets committed to source control
- `.env` files are gitignored across all artifacts
- Azure Key Vault used in production for secret injection at runtime
- See [docs/SECRETS_POLICY.md](../SECRETS_POLICY.md)

### 5.4 Backup and Recovery

| Metric | Target |
|--------|--------|
| Recovery Time Objective (RTO) | 4 hours |
| Recovery Point Objective (RPO) | 1 hour |
| Backup frequency | Continuous WAL + daily snapshots |
| Retention | 30 days |

See [BACKUP-RESTORE.md](../operations/backup-restore.md) and [ops/infra/recovery-and-backup-model.md](../../ops/infra/recovery-and-backup-model.md).

### 5.5 Incident Response

Severity classification and response targets:

| Severity | Description | Response Target |
|----------|-------------|----------------|
| P0 — Critical | Production down, data exposure | < 1 hour |
| P1 — High | Major feature broken, security issue | < 4 hours |
| P2 — Medium | Degraded performance, minor security | < 24 hours |
| P3 — Low | Non-critical issues | Next sprint |

See [INCIDENT_RESPONSE.md](../operations/incident-response.md) and [OPERATIONS-RUNBOOK.md](../operations/operations-runbook.md).

---

## 6. AI Oversight and Governance

### 6.1 Agent Architecture

All AI agents are **advisory only**. No agent can execute a consequential action without explicit human confirmation. This is enforced at the Alloy workflow layer — not at the UI layer and not by convention.

| Component | Detail |
|-----------|--------|
| Model routing | `@szl-holdings/ai-engine` — multi-provider with failover: OpenAI → Anthropic → Gemini |
| Decision types | 9 schema-validated output types (risk assessment, recommendation, forecast, etc.) |
| Evidence | All recommendations include source citations, model identity, and confidence scores |
| MCP server | 23 tools, 4 resources, 5 prompt templates via `/api/mcp` |
| Agent names | Nuro Mesh (platform), Helmsman (maritime), Sentinel (security), INCA (evaluation) |

### 6.2 Human-in-the-Loop Enforcement

The `covenant-policy` engine evaluates every agent recommendation against:
1. User role and organizational context
2. Required approval tier (and from whom)
3. Domain-specific regulatory constraints
4. Auto-execution eligibility (only for explicitly whitelisted low-risk action classes)

If approval is required, the action enters a queue. The agent cannot proceed without an explicit `approved` status from an authorized human reviewer.

### 6.3 AI Output Provenance

Every AI-generated output is tagged with:
- Model identity and version
- Source classification (`llm_generated`, `human_authored`, `system_computed`, `external_ingested`, `hybrid`)
- Source citations with retrieval provenance
- Confidence score (calibrated from historical Outcome Graph data)
- Export safety status (`safe`, `restricted`, `pending_review`, `blocked`)

The `assertExportSafe()` guard in `proof-chain` blocks export of any AI output that has not been human-reviewed. This prevents unreviewed AI content from reaching client-facing outputs.

### 6.4 AI Evaluation (INCA Labs)

The INCA (Intelligence, Normalization, Confidence, Accuracy) framework provides:
- Confidence calibration using historical outcome data from the Outcome Graph
- Agent performance benchmarking by domain and action type
- Adversarial prompt resistance testing
- Output drift detection for long-running agent processes

See [AI_EVALUATION_STRATEGY.md](../architecture/ai-evaluation-strategy.md).

---

## 7. Observability

### 7.1 Logging

- Structured logging via **Pino** (high-performance JSON logger)
- HTTP request logging via `pino-http` in the middleware chain
- Correlation IDs attached to all log lines via `correlationMiddleware`
- Log level configurable per environment via `LOG_LEVEL` env var

### 7.2 Metrics and APM

- Application Performance Monitoring via `@szl-holdings/observability`
- Health endpoints: `/api/health` (public), domain-specific health checks
- Telemetry middleware captures request latency, error rates, and throughput

### 7.3 Known Observability Gap

**KG009 (P1 — Open):** OpenTelemetry exporter is implemented but not connected to a production APM backend. Pino logging is active. This must be resolved before first commercial deployment. OTEL exporter wiring is a pre-deploy requirement in the launch readiness scorecard.

### 7.4 Audit Trail

The `@szl-holdings/audit` library generates immutable audit events for:
- All authentication events (login, logout, failed attempts)
- All role and membership changes
- All state-changing API actions
- All AI-assisted decisions
- All admin panel access

Audit entries include: timestamp, actor (user ID + org), action, affected resource, IP (hashed for privacy).

---

## 8. Agent Tooling

### 8.1 MCP Gateway

The Model Context Protocol (MCP) gateway at `/api/mcp` provides structured tool access for AI agents:

| Tool Class | Examples | Minimum Role |
|------------|----------|-------------|
| Public read | `platform_schema_query` | None |
| Tenant read | `vessels_fleet_status`, `terra_property_search` | `analyst` |
| Analysis | `firestorm_triage_incident`, `lyte_run_analysis` | `analyst` |
| Workflow trigger | `alloy_launch_workflow` | `operator` |
| Approval action | `platform_request_approval` | `operator` |
| Admin-only | `alloy_skill_invoke` (admin class) | `admin` / `super_admin` |

No separate "agent identity" bypass exists — agents present a valid session token on behalf of a human user or service account and are subject to the same role enforcement.

### 8.2 Forge Runtime

`@szl-holdings/forge-runtime` provides the durable job queue and agent execution runtime:
- Persisted job state survives service restarts
- Per-step checkpoint/resume for multi-step agent processes
- Worker scheduling with configurable concurrency
- All agent invocations audit-logged

### 8.3 Domain-Specific Agents

| Agent | Domain | Capability |
|-------|--------|-----------|
| **Nuro Mesh** | Platform | General-purpose orchestration and routing |
| **Helmsman** | Maritime (Vessels) | Voyage risk, sanctions, route optimization |
| **Sentinel** | Security (Aegis) | Threat triage, playbook recommendation |
| **INCA** | Evaluation | Model confidence calibration, output scoring |

---

## 9. Known Gaps and Remediation Status

The following table summarizes all open gaps from the April 2026 security and architecture audits. Full detail in [KNOWN-GAPS.md](../operations/known-gaps.md) and [AUDIT_FINDINGS_REGISTER.md](../operations/audit-findings-register.md).

### P0 — Critical (All Resolved)

| ID | Gap | Status |
|----|-----|--------|
| KG001 | Cross-tenant vector/RAG retrieval isolation | ✅ Resolved Apr-2026 |
| KG002 | Timing-unsafe internal token comparison (auth.ts) | ✅ Resolved Apr-2026 |
| KG014 | `graph-rag.ts` not propagating tenant ID | ✅ Resolved Apr-2026 |
| KG015 | No `tenant_id` column in `rag_knowledge_chunks` | ✅ Resolved Apr-2026 |
| KG003–KG008 | Unvalidated write routes / missing structured logging | ✅ Resolved Apr-2026 |

### P1 — High (Open, Tracked) — Phase 2–3 Audit Additions

Three new P1 gaps were discovered in the Phase 2–3 architecture and tenancy hardening audit:

| ID | Gap | Sprint Target |
|----|-----|--------------|
| AF-001 | `adminGuard` middleware uses non-timing-safe `Buffer.equals()` for internal token | Sprint 3 |
| AF-003 | `GET /vessels/fleets` routes return all tenants' fleet data (missing tenant scope) | Sprint 3 |
| AF-007 | `vessels.*` DB tables (`vessels_fleets`, `vessels`, positions) missing `org_id` column | Sprint 3 |

### P1 — High (Open, Tracked) — Previously Identified

| ID | Gap | Sprint Target |
|----|-----|--------------|
| KG009 | OTEL exporter not connected to production APM | Pre-deploy |
| KG010 | No automated E2E / integration test suite | Sprint 3–4 |
| KG011 | No CodeQL SAST in CI pipeline | Sprint 3 |
| KG012 | No automated dependency vulnerability review in CI | Sprint 3 |
| KG013 | No `CODEOWNERS` file | Sprint 3 |
| KG026 | MFA not implemented for super_admin sessions | Enterprise tier |

### P2 — Medium (Open, Roadmapped)

| ID | Gap | Sprint Target |
|----|-----|--------------|
| AF-004 | Backup export endpoint lacks orgId authority validation | Sprint 3 |
| AF-008 | `conversations` table missing `org_id` (AI chat history not tenant-scoped) | Sprint 3 |
| AF-010 | Sessions not invalidated on role change | Sprint 3 |
| AF-012 | Sessions not invalidated on `SESSION_SECRET` rotation | Sprint 3 |
| AF-013 | Internal token verification duplicated with divergent patterns | Sprint 3 |
| AF-014 | No ORM-layer cross-tenant query guard | Sprint 4 |
| KG018 | 80+ env vars with no formal schema documentation | Sprint 4 |
| KG019 | No Lighthouse CI performance regression guard | Sprint 4 |
| KG020b | Webhook delivery URL has no SSRF host validation | Sprint 3 |
| KG020c | No virus/malware scanning on object storage uploads | Sprint 4 |
| KG020d | No field-level encryption for PII columns | Roadmap |
| KG023 | SLI/SLO definitions absent | Sprint 4 |
| KG024 | Large vendor bundle sizes (1–1.7 MB) | Sprint 4 |
| KG025 | WCAG accessibility not systematically audited | Sprint 4 |

**Diligence assessment:** All original P0 security gaps are resolved. The Phase 2–3 audit added 3 new P1 gaps and 7 new P2 gaps — all tracked with remediation owners and Sprint 3 targets. The five highest-priority items for pre-commercial deployment are: KG009 (OTEL), AF-001 (adminGuard token), AF-003/AF-007 (vessels tenancy), KG011 (SAST), and KG026 (MFA for super_admin). Full findings in [AUDIT_FINDINGS_REGISTER.md](../operations/audit-findings-register.md).

---

## 10. Certifications and Compliance Roadmap

| Standard | Current Status | Target |
|----------|---------------|--------|
| SOC 2 Type II | Not yet initiated | Phase 3 (post-funding) |
| ISO 27001 | Not yet initiated | Phase 3 |
| GDPR | Privacy framework in place | Ongoing |
| CCPA | Privacy framework in place | Ongoing |
| HIPAA (BAA) | Evaluated per contract | As customer need arises |

---

## 11. Scale Reference

| Metric | Value |
|--------|-------|
| API Endpoints | 2,331 |
| Route Files | 172 |
| Database Tables | 700+ |
| Schema Files | 116 |
| Shared Libraries | 37 packages |
| Source Files | 1,620 TypeScript files |
| Lines of Code | 450,000+ |
| UI Components | 252 web + 116 mobile screens |
| Web Applications | 10 active |
| Mobile Apps | CORTEX (unified) |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [architecture.md](../architecture/architecture.md) | Full architecture reference |
| [SYSTEM-OVERVIEW.md](../architecture/system-overview-executive.md) | Platform overview for non-technical stakeholders |
| [ACCESS-CONTROL-MATRIX.md](../security/access-control-matrix.md) | Full role/route/permission mappings |
| [TENANCY-MODEL.md](../architecture/tenancy-model.md) | Multi-tenant isolation model and assumptions |
| [CONTROL_PLANE_ARCHITECTURE.md](../architecture/control-plane.md) | Admin tooling and privileged access paths |
| [DEPENDENCY_MAP.md](../architecture/dependency-map.md) | Package dependency graph and ownership |
| [AUDIT_FINDINGS_REGISTER.md](../operations/audit-findings-register.md) | Phase 2–3 auth and tenancy audit findings |
| [SECURITY-CHECKLIST.md](../security/security-checklist.md) | Security controls mapped to implementation |
| [KNOWN-GAPS.md](../operations/known-gaps.md) | Full gap registry with remediation status |
| [PLATFORM_PRIMITIVES.md](../architecture/platform-primitives.md) | Six governance primitives in detail |
| [PROOF_AND_POLICY_MODEL.md](../architecture/proof-and-policy-model.md) | Trust recording and enforcement model |
| [DEPLOYMENT-GUIDE.md](../operations/deployment-guide.md) | Deployment procedures |
| [OPERATIONS-RUNBOOK.md](../operations/operations-runbook.md) | Operational procedures and incident response |
| [DATA-MODEL.md](../architecture/data-model.md) | Database schema overview |
| [API-SPEC.md](../architecture/api-spec.md) | API surface: routes, auth, rate limiting |

---

*Last verified against source code: 2026-04-17. Full 13-phase audit complete (Phases 0–13). All P0 security gaps resolved. 3 new P1 gaps (AF-001, AF-003, AF-007) and multiple P2 gaps tracked in AUDIT_FINDINGS_REGISTER.md. Phase 10–11 Category Leadership & Diligence review completed. Seven stakeholder lens audit conducted — findings documented in KNOWN-GAPS.md §Phase 10–11 audit note. TD-004 (TRUST_CENTER_INDEX.md model transparency) resolved. Category updated to Governed Decision Infrastructure. INVESTOR_NARRATIVE.md v3.0, MOAT_MAP.md v2.0, CATEGORY_POSITIONING.md v2.1 all current.*
