# Security Policy

→ [Platform Repo](https://github.com/szl-holdings/szl-holdings-platform) | [Architecture](./docs/architecture/system-overview.md) | [Trust Center](./docs/trust/trust-center.md) | [Contact](https://szlholdings.com)

## Supported Versions

The SZL Holdings platform is currently in active pre-commercial development. Security issues are taken seriously regardless of commercial status.

| Version | Supported |
|---------|-----------|
| Latest (main/master) | ✅ Active |
| Previous releases | Reviewed case by case |

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

### Responsible Disclosure Process

1. **Email:** Send a detailed report to [security@szlholdings.com](mailto:security@szlholdings.com)
2. **Subject line:** `[SECURITY] Brief description of the vulnerability`
3. **Include in your report:**
   - Platform / component affected (Lyte, Aegis, Vessels, Terra, API server, etc.)
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

- All platform web applications (Lyte, Aegis, Terra, Vessels, Carlota Jo, PRISM Counsel, IMPERIUM, Command Portal, SZL Holdings, Stephen Site)
- All platform web applications (Lyte, Aegis, Terra, Vessels, Carlota Jo, SZL Holdings, Command Portal)
- CORTEX unified mobile application (iOS/Android) (Expo / React Native)
- The centralized API server
- Authentication and session management (OIDC/PKCE, RBAC, SCIM 2.0)
- WebSocket and SSE connection security
- AI agent execution boundaries and human-in-the-loop enforcement
- Data access control (11-role RBAC implementation)
- Multi-tenant isolation (org_id scoping)
- Exposed API endpoints (2,331 routes)

### Out of Scope

- Third-party services and their infrastructure (Azure, Stripe, OpenAI, etc.)
- Social engineering attacks
- Physical security
- Denial of service attacks

---

## Security Architecture Summary

The SZL Holdings platform is built with security as a structural concern, not a compliance add-on.

**Authentication:** OpenID Connect (PKCE) — no password storage in our systems.

**Authorization:** Role-based access control with organization scoping. Every route and API endpoint is access-controlled. Roles: `founder_admin`, `admin`, `operator`, `analyst`, `viewer`, `client`.

**Data in Transit:** TLS 1.3 for all connections. WebSocket connections use HMAC-signed tickets with 5-minute TTL.

**Data at Rest:** PostgreSQL encryption at rest on all managed deployments.

**AI Governance:** Advisory agents cannot execute consequential actions without explicit human confirmation. This is enforced at the workflow level (Alloy), not just the UI level.

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
