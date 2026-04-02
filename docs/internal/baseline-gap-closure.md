# Alloy Gap Closure — Baseline Report

**Generated**: 2026-04-02
**Author**: Automated baseline capture

---

## 1. Current Route Map

### API Server (Express, port 8080)

| Domain | Route Prefix | Status |
|--------|-------------|--------|
| Auth & Identity | `/api/auth`, `/api/oidc-auth`, `/api/scim` | Active |
| Lyte (Flagship) | `/api/lyte`, `/api/lyte/platform`, `/api/lyte-live` | Active |
| Alloy (Execution) | `/api/alloy`, `/api/dreamscape` | Active |
| AI Engine | `/api/ai/*` (14 endpoints) | Active |
| Aegis SOC | `/api/firestorm`, `/api/inca`, `/api/msp` | Active |
| Terra RE | `/api/terra`, `/api/terra-distress`, `/api/terra-broker`, `/api/terra-live`, `/api/terra-crm` | Active |
| Vessels | `/api/vessels`, `/api/vessels-platform`, `/api/vessels-live` | Active |
| Carlota Jo | `/api/carlota-jo`, `/api/holdings` | Active |
| Admin | `/api/admin`, `/api/audit`, `/api/jobs`, `/api/backup` | Active |
| Intelligence | `/api/intelligence`, `/api/dataverse`, `/api/gov` | Active |
| Health | `/api/health`, `/api/healthz`, `/api/health/detailed` | Active |
| Config | `/api/config`, `/api/csrf-token` | Active |

### AI Engine Endpoints (14 total)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/ai/health` | Public | Engine status, model registry, config |
| GET | `/api/ai/models` | Public | Model slots + routing config |
| GET | `/api/ai/tools` | Public | Tool definitions + policy status |
| GET | `/api/ai/audit` | Public | Audit trail entries |
| GET | `/api/ai/evals/golden-set` | Public | Golden test set summary |
| POST | `/api/ai/respond` | Public | General AI inference |
| POST | `/api/ai/triage` | Public | Triage decision generation |
| POST | `/api/ai/extract` | Public | Entity extraction |
| POST | `/api/ai/plan` | Public | Action planning |
| POST | `/api/ai/retrieve` | Public | Hybrid retrieval |
| POST | `/api/ai/tools/preview` | Public | Dry-run tool preview |
| POST | `/api/ai/tools/execute` | **Auth Required** | Tool execution |
| POST | `/api/ai/evals/run` | **Auth Required** | Run eval harness |
| POST | `/api/ai/retrieval/ingest` | **Auth Required** | Ingest content |

---

## 2. Current AI Engine Architecture

### Model Registry
| Role | Model | Provider |
|------|-------|----------|
| Primary LLM | Qwen/Qwen3-8B | HuggingFace |
| Secondary LLM | Qwen/Qwen3-8B | HuggingFace |
| Fallback LLM | Qwen/Qwen3-0.6B | HuggingFace |
| Vision | Qwen/Qwen2.5-VL-7B-Instruct | HuggingFace |
| Embeddings | BAAI/bge-m3 | HuggingFace |
| Reranker | BAAI/bge-reranker-v2-m3 | HuggingFace |

### Route Classes (9)
classification, triage, reasoning, planning, tool_calling, vision_understanding, background_batch, extraction, summarization

### Decision Schemas
- ActionDecision (action-decision.ts)
- RiskDecision (risk-decision.ts)
- TriageDecision (triage-decision.ts)
- ExtractedEntities (extract-entity.ts)

### Tools (9)
lookup_workflow, lookup_signal, lookup_owner, create_action_item, route_for_approval, request_human_review, append_audit_note, fetch_connector_context, close_action

### Execution Mode
Default: `propose_only` — high-risk tools blocked until mode changes.

### Retrieval Engine
- Hybrid retrieval (keyword + semantic)
- Cosine similarity scoring
- Evidence-to-decision linking
- 10K chunk memory cap

### Eval Harness
- 25 golden test cases
- 9 categories: risk_extraction, owner_assignment, escalation_proposal, approval_gating, evidence_citation, retrieval_relevance, schema_validity, hallucination_rejection, safe_fallback

---

## 3. Current Audit Schema

### Database Tables
| Table | Purpose | Tenant-Scoped |
|-------|---------|---------------|
| `activity_log` | User actions (login, create, read) | Yes (userId) |
| `audit_events` | State changes (old/new values) | Yes (userId) |
| `platform_audit_log` | Alloy execution engine trail | Yes (orgId) |

### Audit Middleware
- `createAuditMiddleware`: Auto-logs all mutations (POST/PUT/PATCH/DELETE)
- Sensitive-key redaction (passwords, tokens)
- `writeAudit` in AI engine routes for decision audit

### Audit API
- `GET /api/audit/activity` — Latest 100 activity logs (ops/analyst roles)
- `GET /api/audit/events` — Latest 100 state changes (ops/analyst roles)
- Feature-flag gated: `internal_audit_console_enabled`

---

## 4. Current Auth & RBAC Model

### Authentication
- OIDC with PKCE (Replit + Azure AD)
- Multi-tenant SSO via Azure AD
- Session-based (DB-backed) with Bearer token support
- Mobile PKCE token exchange
- SCIM 2.0 provisioning server

### Role Hierarchy
`super_admin` > `admin` > `ops` > `analyst` > `viewer` > `executive_viewer`

### Tenant Isolation
- `organizations` table as primary tenancy unit
- `azure_tenants` linking external IdP to internal orgs
- `requireOrgMembership` middleware
- `enforceOrgScope` cross-tenant access blocking
- `x-org-slug` header-based org context
- SCIM requests scoped by tenant Bearer token

### Key Middleware
| Middleware | Purpose |
|-----------|---------|
| `authMiddleware` (global) | Session hydration (not enforcer) |
| `authMiddleware({ required: true })` | Route-level auth enforcement |
| `requireRole(role)` | Minimum role check |
| `requirePlatformRole(role)` | Platform-level role check |
| `denyIfReadOnly` | Block writes for viewer roles |
| `requireOrgMembership` | Org membership verification |
| `enforceOrgScope` | Cross-tenant access prevention |
| `platformAuth` | Org-scoped header extraction |

---

## 5. Current Readiness Labels

| Product | Current Label |
|---------|--------------|
| Lyte | Functional Alpha |
| Alloy | Functional Alpha |
| Aegis | Functional Alpha |
| Terra | Functional Alpha |
| Vessels | Functional Alpha |
| Carlota Jo | Public Beta Candidate |

---

## 6. Gap Assessment Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 0: Baseline | **This document** | Complete |
| Phase 1: Truth Alignment | Partial | Readiness labels exist but not standardized across all surfaces |
| Phase 2: Decision Objects | **Complete** | 4 schemas, validation, safe fallbacks |
| Phase 3: Evidence Retrieval | **Complete** | Hybrid retrieval, evidence items, chunk management |
| Phase 4: Policy-Gated Execution | **Complete** | 9 tools, propose_only default, policy checks |
| Phase 5: Eval Harness | **Complete** | 25 golden tests, pass/fail reporting |
| Phase 6: Enterprise Access | **Mature** | SSO, SCIM, RBAC, tenant isolation all implemented |
| Phase 7: Canonical Demo | Not started | Needs scripted walkthrough |
| Phase 8: Trust Posture | Partial | Trust pages exist, need tightening |
| Phase 9: UI Improvements | Partial | Intelligence page exists, needs shared components |
| Phase 10: Commercial Surfaces | Partial | Needs messaging alignment |
