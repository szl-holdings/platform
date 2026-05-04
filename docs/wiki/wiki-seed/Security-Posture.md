# Security Posture

Security in the SZL Holdings platform is a structural concern — built into authentication, authorization, AI governance, and audit trail design. It is not a compliance layer applied after the fact.

---

## Authentication

**Protocol:** OpenID Connect (PKCE). No password storage in SZL systems. Identity providers authenticate users; the platform establishes session context.

**Sessions:** Secure, httpOnly, SameSite=Strict cookies. Session tokens are rotated on privilege change.

**SSO:** Azure AD multi-tenant SSO supported via OIDC federation. SCIM 2.0 for automated user provisioning and deprovisioning.

---

## Authorization

**Model:** Role-based access control (RBAC) with organization-scoped tenant isolation.

**Roles (11):**

| Role | Scope |
|------|-------|
| `founder_admin` | Full platform access |
| `admin` | Org-scoped administration |
| `operator` | Workflow execution |
| `analyst` | Read + analysis operations |
| `viewer` | Read-only access |
| `client` | Client portal only |
| + 5 domain-specific roles | Domain-isolated operational access |

Every API route and WebSocket channel is access-controlled. No unauthenticated routes except explicitly designated public endpoints.

**Multi-tenancy:** All database queries include `org_id` scoping. Cross-tenant data access is architecturally prevented at the query layer.

---

## Data in Transit

- TLS 1.3 for all HTTPS connections
- WebSocket connections use HMAC-signed tickets with 5-minute TTL and per-channel ACL

---

## Data at Rest

- PostgreSQL encryption at rest on all managed deployments (Azure Database for PostgreSQL with transparent data encryption)
- Secrets managed via Azure Key Vault — never committed to source control
- `.env` files are gitignored at the repository level

---

## AI Governance

The AI layer is the most consequential trust surface in an AI-assisted operations platform. SZL Holdings enforces governance at the execution layer, not just the UI:

- **Advisory agents cannot execute consequential actions** without explicit human confirmation
- This enforcement is at the **Alloy workflow level** — the AI engine does not have direct access to action execution primitives
- Every AI recommendation includes source citations, confidence scores, and retrieval provenance
- Policy-gated tool execution: agent capabilities are scoped per context and role

---

## Audit Trail

Every significant action generates an immutable audit event:
- Actor identity (user ID, role, org)
- Action type and target
- Timestamp (server-side, tamper-evident)
- Outcome and any affected records

Audit tables are append-only. No delete or update operations on audit records.

---

## Dependency Security

| Gate | Tool | Policy |
|------|------|--------|
| Dependency audit | `pnpm audit` | Block on high/critical severity |
| Secret scan | Pattern-based scanning | Block on detected credentials |
| Lint | ESLint | Block on errors |
| TypeScript | `tsc --noEmit` | Block on type errors |

---

## Responsible Disclosure

Security issues are handled via coordinated disclosure. Do not open public GitHub issues for vulnerabilities.

**Contact:** [security@szlholdings.com](mailto:security@szlholdings.com)  
**Response SLA:** Initial acknowledgement within 48 hours

See [SECURITY.md](../../SECURITY.md) for the full disclosure policy and severity guidelines.

---

## Compliance Tracks

| Framework | Status |
|-----------|--------|
| SOC 2 Type II | Roadmap — Phase 3 |
| HIPAA | Architecture-ready; formal track in Phase 3 |
| StateRAMP (Aegis) | Readiness track in Phase 2 roadmap |
| Financial services | Compliance templates available in Alloy |

---

## Further Reference

- [[Trust-Center]]
- [Security Posture doc](../../docs/trust/security-posture.md)
- [SECURITY.md](../../SECURITY.md)
- [[Deployment-Model]]
