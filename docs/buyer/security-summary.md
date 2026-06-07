# SZL Holdings — Security Summary for Buyers

**Date:** Q1 2026  
**Audience:** Enterprise security teams, procurement, and compliance officers

---

## Security Architecture Overview

SZL Holdings platforms are built with security as a structural concern embedded in the architecture — not layered on after the fact.

---

## Authentication & Identity

**Protocol:** OpenID Connect (PKCE flow)  
No passwords are stored in SZL systems. Identity is delegated to your OIDC provider. Enterprise deployments can connect your existing identity provider (Azure AD, Okta, etc.) for single sign-on.

**Session security:**
- Short-lived session tokens with configurable TTL
- `HttpOnly`, `SameSite=Strict`, `Secure` cookie flags on all sessions
- WebSocket connections authenticated with HMAC-signed tickets (5-minute TTL)

---

## Access Control

**Model:** Role-based access control (RBAC) with organization scoping

Every API endpoint is access-controlled. Users cannot access data outside their organizational scope.

| Role | Access Scope |
|------|-------------|
| `founder_admin` | Full platform access, configuration, user management |
| `admin` | Organization-level administration |
| `operator` | Full operational read/write within role scope |
| `analyst` | Read-only operational data and audit logs |
| `viewer` | Dashboard and summary views only |
| `client` | External client access (Carlota Jo context) |

Role changes are logged. Destructive operations require multi-step confirmation.

---

## Data Protection

**In Transit:** TLS 1.3 enforced on all connections. No unencrypted WebSocket connections in production.

**At Rest:** PostgreSQL encryption at rest on all managed deployments. Azure Key Vault for production secret management.

**Secret management:** All credentials are injected via environment variables at deployment time. No secrets are committed to source control. `.env` files are gitignored absolutely.

---

## AI Security Boundaries

SZL platforms use AI to surface recommendations — not to execute consequential actions:

1. AI agents cannot execute actions that affect live systems without explicit human approval
2. This gate is enforced at the Alloy workflow engine level — not just in the UI
3. All AI inference calls log the model version, input context, and output
4. User-supplied text is sanitized before use in AI prompts
5. AI agents have no direct access to secrets, credentials, or raw database queries

---

## Audit Trail

Every significant action generates an immutable audit event:
- Who performed the action (user ID, role, session)
- What happened (structured action type)
- When (UTC timestamp, immutable)
- What changed (before/after state for mutations)
- Triggering context (user action, agent recommendation, scheduled trigger)

Audit logs are append-only. They cannot be modified or deleted by any platform user, including platform administrators.

---

## Dependency Security

- Automated dependency vulnerability scanning via GitHub Dependabot
- All dependencies pinned to exact versions with lockfile committed
- Critical vulnerabilities: immediate review and patch

---

## Current Compliance Status

| Certification | Status | Notes |
|--------------|--------|-------|
| SOC 2 Type I | Not yet | On roadmap — post-funding milestone |
| SOC 2 Type II | Not yet | 12–18 months post-revenue |
| FedRAMP | Not yet | Aegis-specific — 18–24 months |
| ISO 27001 | Not yet | Planned after SOC 2 |
| GDPR | Practices aligned | Not formally certified |

SZL Holdings does not currently hold any formal compliance certifications. This is an honest disclosure. Our engineering practices are designed to support future certifications, and the audit trail infrastructure is built to produce the evidence compliance audits require.

---

## Incident Response

**Security disclosures:** security@szlholdings.com  
See [SECURITY.md](../../SECURITY.md) for the full responsible disclosure process and response timeline commitments.

---

## For Procurement Teams

Enterprise buyers requiring:
- Security questionnaire completion — available on request
- Penetration testing evidence — planned pre-first commercial deployment
- Data processing agreements (DPA) — available for enterprise contracts
- Compliance documentation — available for enterprise contracts under NDA
- Custom security review — available by arrangement for qualified enterprise prospects

Contact: [stephen@szlholdings.com](mailto:stephen@szlholdings.com)
