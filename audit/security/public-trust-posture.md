# Public Trust Posture — Honest Minimal Statement

**Date:** 2026-04-26  
**Purpose:** Audit and reconcile the platform's public trust claims. Replace or trim any inflated assertions in `docs/trust/trust-center.md` and related documents with claims that are verifiably true at the current development stage.  
**Method:** Each claim in the trust center and `SECURITY.md` was mapped to a verifiable code path or CI artefact. Claims with no current backing are flagged.

---

## 1. Trust Center Claims — Verdict by Category

### Authentication

| Claim | Source | Verdict | Evidence |
|-------|--------|---------|---------|
| "OIDC/PKCE — no password storage" | `SECURITY.md` | ✅ True | `routes/auth.ts` uses OIDC as the canonical mechanism. Password hashing (PBKDF2) exists for admin/legacy paths only, not user-facing. |
| "Session tokens are short-lived" | `trust-center.md` | ⚠️ Partially true | Default TTL is 7 days with a sliding window — not strictly "short-lived" by enterprise standards. Accurate to say: "session tokens have a bounded lifetime with server-side invalidation." |
| "Privileged sessions require explicit re-authentication" | `trust-center.md` | ⚠️ Aspirational | No current step-up authentication is implemented for privileged operations. Admin users have persistent sessions at the same TTL as regular users. This claim should be removed or qualified as "planned." |
| "MFA supported" | Implicit in trust surface | ✅ True (partial) | TOTP MFA is implemented for in-app registration paths. Platform-native MFA for OIDC SSO paths is not implemented (KG026). Current control: IdP-level MFA. |

### Authorization

| Claim | Source | Verdict | Evidence |
|-------|--------|---------|---------|
| "11-role RBAC hierarchy" | `trust-center.md`, `SECURITY.md` | ✅ True | `lib/db/src/schema/auth.ts` defines 12 enum values: 11 grantable user roles + `anonymous_visitor`. Role hierarchy enforced via `requireRole()` middleware. |
| "Every route and API endpoint is access-controlled" | `SECURITY.md` | ⚠️ Overstated | The global auth enforcer covers most routes. However, GraphQL directives are not runtime-enforced (AF-015), GraphQL WS subscriptions are unauthenticated (AF-016), and several P1 gaps exist in NEXUS, MCP, and billing. The accurate claim: "Most API routes are access-controlled via a deny-by-default enforcer with an explicit public allowlist; residual gaps are tracked and under active remediation." |
| "Destructive or irreversible actions require multi-step confirmation" | `trust-center.md` | ✅ True | Covenant Policy enforcement at workflow level (not just UI). AI agents cannot execute consequential actions without human approval. |
| "Access is granted by explicit role assignment, not by default" | `trust-center.md` | ✅ True | Deny-by-default `globalAuthEnforcer`. New users must be assigned a role before accessing protected surfaces. |

### Auditability

| Claim | Source | Verdict | Evidence |
|-------|--------|---------|---------|
| "Every significant action generates an immutable audit event" | `trust-center.md`, `SECURITY.md` | ✅ True | Audit event system implemented in `routes/audit.ts` + Drizzle ORM audit tables. Events are append-only. |
| "Audit log rows cannot be deleted by application roles" | Implicit | ✅ True | No DELETE route exists for audit log records in the route inventory. |
| "AI trace records include model identity and version" | `trust-center.md` | ✅ True | Agent trace records include model provider, model ID, and version in the proof chain. |
| "Full chain preserved: signal → recommendation → execution → proof" | `trust-center.md` | ✅ True | Alloy Proof Chain is the platform's governance artefact. Chain is append-only. |

### Data Protection

| Claim | Source | Verdict | Evidence |
|-------|--------|---------|---------|
| "TLS 1.3 for all connections" | `SECURITY.md` | ✅ True | Platform-managed TLS. Replit and Azure manage certificate lifecycle. |
| "PostgreSQL encryption at rest" | `SECURITY.md` | ✅ True | Managed deployment (Azure) provides encryption at rest. |
| "No secrets committed to source control" | `SECURITY.md` | ✅ True | Confirmed by Gitleaks full-history scan. Zero true positives. |
| "SCIM 2.0 supported" | `SECURITY.md`, `trust-center.md` | ✅ True | SCIM routes implemented and bearer-token authenticated. |
| "WebSocket connections use HMAC-signed tickets with 5-minute TTL" | `SECURITY.md` | ✅ True (partial) | Vessel BoL chain uses HMAC signing. Main app WebSocket (GraphQL WS) does NOT use HMAC tickets and accepts anonymous clients (AF-016). Claim should specify which WebSocket connections. |
| "Connector credentials stored encrypted" | `SECURITY.md` | ✅ True | `CONNECTOR_ENCRYPTION_KEY` (AES-256) encrypts stored OAuth tokens. API responses return masked values. |
| "IP addresses hashed before storage" | `threat_model.md` | ✅ True | `hashIp()` in `lib/audit/src/ip-hash.ts`. Raw IPs not persisted. |
| "No virus scanning on uploaded files" | Historical claim | ✅ Resolved | KG020c resolved Apr-2026. Virus scanning is now gated. |

### AI Governance

| Claim | Source | Verdict | Evidence |
|-------|--------|---------|---------|
| "Advisory agents cannot execute consequential actions without human confirmation" | `SECURITY.md` | ✅ True | Enforced at workflow level (Alloy), not just UI. Mutating endpoints in the A11oy Phase 1 fabric return 501. |
| "NEXUS shared control-plane is governed" | Implicit | ❌ Overstated | NEXUS shared memory, skills, tools, and orchestrations have no tenant or ownership scoping (AF-020). The control plane is effectively shared across all authenticated users. This claim cannot currently be made. |
| "Multi-provider AI with no-training-on-customer-data terms" | `threat_model.md` | ✅ True | OpenAI, Anthropic, Gemini, HuggingFace operate under no-training terms as contracted. |

### Dependency & Supply Chain

| Claim | Source | Verdict | Evidence |
|-------|--------|---------|---------|
| "Automated vulnerability scanning in CI" | `SECURITY.md` | ✅ True | `security.yml` runs `pnpm audit` + SBOM generation. `dependency-review.yml` blocks on high-severity. |
| "SBOM generated" | `security.yml` | ✅ True | `scripts/qa/generate-sbom.js` → `security/sbom-latest.json`. Uploaded as CI artefact. |
| "CodeQL static analysis" | `codeql.yml` | ✅ True | Weekly + PR-triggered CodeQL with JavaScript/TypeScript language pack. |

---

## 2. Claims to Trim or Qualify

The following statements appear in the current trust documentation but should be revised for accuracy:

| Location | Current Claim | Revised Claim | Reason |
|----------|--------------|---------------|--------|
| `trust-center.md` | "Privileged sessions require explicit re-authentication" | Remove or mark as **Planned** | No step-up auth implemented |
| `SECURITY.md` | "Every route and API endpoint is access-controlled" | "Most API routes are access-controlled via a deny-by-default enforcer with an explicit public allowlist. Known exceptions are tracked in the residual risk register." | AF-015, AF-016, AF-020 remain open |
| `SECURITY.md` | "WebSocket connections use HMAC-signed tickets with 5-minute TTL" | "Selected WebSocket connections (BoL chain) use HMAC-signed tickets. GraphQL subscription WebSocket auth is under active hardening." | AF-016 is open |
| `trust-center.md` | (implied) NEXUS is governed | Remove or qualify as **Alpha** | AF-020/AF-021 open |

---

## 3. Honest Minimal Trust Statement

The following is the honest, accurate version of the platform's public trust posture for use in investor materials and trust surfaces:

---

### SZL Holdings Platform — Security Posture Summary (April 2026)

**Stage:** Pre-commercial, Series A. Security is treated as a structural concern.

**Authentication:** OIDC/PKCE via a trusted identity provider. No passwords stored in our systems. Session tokens have a bounded lifetime with server-side invalidation on role change.

**Authorization:** Deny-by-default API access control with an explicit public allowlist. Role-based access control (11 assignable roles) from anonymous visitor to founder admin. Admin operations require elevated role assignment. Several authorization gaps in GraphQL subscriptions, NEXUS shared state, and MCP governance are tracked and under active remediation.

**Data in transit:** TLS for all connections. Platform-managed certificate lifecycle.

**Data at rest:** PostgreSQL encryption at rest on managed deployments. Connector OAuth tokens encrypted with AES-256 before storage. IP addresses hashed before audit logging. No raw PII in application logs.

**AI governance:** Advisory agents cannot execute consequential actions without explicit human confirmation. This is enforced at the workflow level, not only in the UI. Proof Chain entries are append-only.

**Secrets:** No credentials are committed to source control (confirmed by continuous Gitleaks scanning). All credentials use environment variable injection.

**CI security gates:** Secret scan (PR + daily full-history), dependency vulnerability audit, dependency review on PRs, SBOM generation, CodeQL static analysis, lockfile integrity. All are blocking required checks.

**Audit trail:** Immutable append-only audit events for all significant actions, including AI agent recommendations and human confirmations.

**Known gaps:** Active P1 gaps exist in GraphQL WebSocket auth, NEXUS shared state scoping, MCP governance authorization, and webhook signature enforcement. These are documented in the residual risk register and under active remediation planning.

**Responsible disclosure:** security@szlholdings.com — 48-hour acknowledgement SLA.

---

## 4. Features That Should Be Labeled Alpha / Internal / Preview

The following features are in-use in the codebase but are not production-safe. They should carry explicit labels in any public documentation, investor materials, or demo surfaces:

| Feature | Current State | Recommended Label |
|---------|--------------|------------------|
| NEXUS shared control plane (memory, skills, orchestrations) | No tenant scoping — platform-global shared state | **Alpha — not production-isolated** |
| MCP governance plane (substrate MCP gateway, sidecar) | Insufficient RBAC on governance routes; GET bypass on discovery | **Alpha — access controls under development** |
| GraphQL subscriptions | Anonymous clients accepted | **Alpha — authentication hardening in progress** |
| Alloy Chat persistence (`/api/alloy-chat/*`) | Tenantless — no org_id scoping | **Internal — single-tenant only** |
| A11oy Execution Fabric (`/api/a11oy/*`) | Phase 1: all data in-memory demo; mutating endpoints return 501 | **Preview — Phase 1 demo surface** |
| Alloy Policy Compiler Studio | Public read-only state endpoint; mutating paths auth-gated | **Beta** |
| Self-healing policies (`/api/self-healing/*`) | Public read-only; mutating paths auth-gated | **Beta** |

---

*Reviewed: 2026-04-26. Claims should be re-evaluated before each investor update or before any public trust center page is published.*
