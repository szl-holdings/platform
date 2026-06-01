# Security Policy

→ [Platform Repo](https://github.com/szl-holdings/platform) | [Architecture](./docs/architecture/architecture.md) | [Trust Center](./docs/trust/trust-center.md) | [Contact](https://szlholdings.com)


## Trust Tier

**Trust Tier 1** — SZL Holdings is committed to coordinated, responsible disclosure for all SZL Holdings repositories.


## Supported Versions

The SZL Holdings platform is currently in active pre-commercial development. Security issues are taken seriously regardless of commercial status.

| Version | Supported |
|---------|-----------|
| Latest (`main`) | ✅ Active |
| Previous releases | Reviewed case by case |

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

A machine-readable disclosure policy is published at:  
**[`/.well-known/security.txt`](https://szlholdings.com/.well-known/security.txt)** (RFC 9116)

### Responsible Disclosure Process

1. **Email:** Send a detailed report to [security@szlholdings.com](mailto:security@szlholdings.com)
2. **Subject line:** `[SECURITY] Brief description of the vulnerability`
3. **Include in your report:**
   - Platform / component affected (KORA, FORGE, TENAX, Counsel, SEXTANT, DOMAINE, LUMINA, Carlota Jo, API server, etc.)
   - Description of the vulnerability and potential impact
   - Steps to reproduce
   - Any proof-of-concept code (please do not exploit further than necessary to demonstrate)
   - Your preferred contact method for follow-up

### What to Expect

| Milestone | Target Timeline |
|-----------|----------------|
| Initial acknowledgement | Within 48 hours |
| Severity classification | Within 5 business days |
| Resolution or mitigation plan | Depends on severity (see below) |
| Public disclosure | Coordinated — we will notify you before any public statement |

**Severity guidelines:**

| Severity | Description | Target Response |
|----------|-------------|----------------|
| Critical | Data exposure, auth bypass, remote code execution | Within 24 hours of acknowledgement |
| High | Privilege escalation, significant data leak | Within 5 business days |
| Medium | Limited impact vulnerabilities | Within 30 days |
| Low | Informational, minimal impact | Next release cycle |

---

## Scope

### In Scope

- All active platform web applications (SZL Holdings Dashboard, FORGE Command Portal, TENAX, Counsel, DOMAINE, SEXTANT, Carlota Jo, LUMINA, PARAGON/Aegis)
- APEX unified mobile command application (iOS/Android) (Expo / React Native)
- The centralized API server
- Authentication and session management (OIDC/PKCE, RBAC, SCIM 2.0)
- WebSocket and SSE connection security
- AI agent execution boundaries and human-in-the-loop enforcement
- Data access control (role-based RBAC implementation)
- Multi-tenant isolation (org_id scoping)
- All exposed API endpoints

### Out of Scope

- Third-party services and their infrastructure (Azure, Stripe, OpenAI, etc.)
- Social engineering attacks
- Physical security
- Denial of service attacks

---

## Security Architecture Summary

The SZL Holdings platform is built with security as a structural concern, not a compliance add-on.

**Authentication:** OpenID Connect (PKCE) — no password storage in our systems.

**Authorization:** Role-based access control with organization scoping. A deny-by-default API gate (`global-auth-enforcer`) protects all `/api/*` routes with an explicit, documented public allowlist. 11-role hierarchy: `anonymous_visitor`, `founder_admin`, `platform_admin`, `operator`, `analyst`, `executive_viewer`, `ops_manager`, `sales_delivery_user`, `maritime_ops_user`, `service_coordinator`, `pilot_customer_user`. See [access-control-matrix.md](docs/security/access-control-matrix.md) for the full role-permission mapping. Known residual authorization gaps are tracked in `threat_model.md` and under active remediation.

**Continuum Fabric (Phase 1):** The Continuum Business Observability Fabric (`/api/continuum/*`) is fully public in Phase 1. All data is in-memory demo data; no real business signals or customer data is served. Mutating endpoints (`/approve`, `/execute`, `/run`) return 501 Not Implemented — they cannot be triggered. Phase 2 will introduce authenticated write paths with covenant policy gates and proof-carrying execution contracts. The Continuum public surface follows the same defense-in-depth patterns as other public SZL demo surfaces.

**Data in Transit:** TLS 1.3 for all connections. Selected WebSocket connections (e.g. BoL chain signing) use HMAC-signed tickets with 5-minute TTL. GraphQL subscription WebSocket authentication is under active hardening.

**Data at Rest:** PostgreSQL encryption at rest on all managed deployments.

**AI Governance:** Advisory agents cannot execute consequential actions without explicit human confirmation. This is enforced at the workflow level (Continuum), not just the UI level.

**Audit Trail:** Every significant action generates an immutable audit event with actor attribution, role context, and timestamp.

**Secrets Management:** All credentials are managed via environment variable injection. No secrets are committed to source control. `.env` files are gitignored.

**Dependency Scanning:** Automated vulnerability scanning is configured in the CI pipeline.

---

## Security CI Gates

The following automated security checks run on every commit and pull request:

| Gate | Tool | Policy |
|------|------|--------|
| Dependency audit | `pnpm audit` | Block on high/critical severity |
| Secret scan | Pattern-based grep | Block on any detected credentials in source |
| Lint | ESLint | Block on errors |
| TypeScript typecheck | `tsc --noEmit` | Block on type errors |
| Build validation | `pnpm -r build` | Block on build failures |

---

## Acknowledgements

We appreciate responsible security research. Researchers who report valid vulnerabilities through our responsible disclosure process will be acknowledged in this document (with their permission).

---

## Security Contact

**Email:** security@szlholdings.com  
**PGP:** Not yet configured — plain email is acceptable  
**Response SLA:** 48 hours for initial acknowledgement

---

*SZL Holdings does not currently offer a paid bug bounty program. We appreciate responsible disclosure as a commitment to the security of users and the broader ecosystem.*
