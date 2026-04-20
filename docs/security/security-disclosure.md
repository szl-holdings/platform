# Vulnerability Disclosure Policy — SZL Holdings Platform

> **Security contact:** security@stephenl.dev  
> **Response SLA:** 48 hours acknowledgement, 5 business days severity classification  
> **Disclosure format:** Responsible coordinated disclosure

---

## Summary

SZL Holdings operates a responsible vulnerability disclosure program. We welcome reports from security researchers, customers, and the broader security community. Researchers who report vulnerabilities in good faith are treated with respect and kept informed throughout the process.

---

## How to Report

**Primary channel:** Email [security@stephenl.dev](mailto:security@stephenl.dev)

**Subject line format:** `[SECURITY] <brief description>`

**Include in your report:**

1. **Component affected** — Platform, API server, mobile app, specific endpoint
2. **Vulnerability type** — e.g., XSS, IDOR, auth bypass, injection
3. **Description** — Clear explanation of the vulnerability and its potential impact
4. **Reproduction steps** — Step-by-step instructions (or proof-of-concept code)
5. **Severity estimate** — Your assessment of business impact
6. **Preferred contact method** — How you'd like us to follow up

**Do not:**
- Open a public GitHub issue for security vulnerabilities
- Exploit the vulnerability beyond what is necessary to demonstrate it
- Access or modify data belonging to other users
- Perform denial-of-service testing

---

## What to Expect

| Milestone | Target Timeline |
|-----------|----------------|
| Initial acknowledgement | Within 48 hours |
| Severity classification | Within 5 business days |
| Status updates | Every 7 business days during investigation |
| Critical remediation | Within 24 hours of confirmation |
| High severity remediation | Within 5 business days |
| Medium severity remediation | Within 30 days |
| Coordinated public disclosure | After fix deployed; coordinated with reporter |

---

## Scope

### In Scope

| Component | Notes |
|-----------|-------|
| All web applications | szlholdings.com, lyte.szlholdings.com, aegis, vessels, terra, carlota-jo, stephen-site |
| API server | All endpoints at `api.szlholdings.com` |
| Mobile applications | Expo/React Native apps for all platforms |
| Authentication & session management | OIDC, PKCE, session tokens |
| WebSocket connections | HMAC ticket validation |
| AI agent execution boundaries | Human-in-the-loop enforcement |
| RBAC implementation | Role escalation, tenant isolation bypass |
| Data access controls | Cross-tenant data access |

### Out of Scope

| Excluded | Reason |
|----------|--------|
| Third-party services (Azure, Stripe, OpenAI, etc.) | We do not control their infrastructure |
| Social engineering attacks | Outside technical vulnerability scope |
| Physical security | Not applicable |
| Denial of service | Network-level DoS testing not accepted |
| Vulnerabilities in software we don't maintain | Report directly to the vendor |
| Issues with no practical security impact | e.g., banner version disclosure alone |

---

## Safe Harbor

Security research conducted in accordance with this policy will not lead to legal action. We will not pursue action against researchers who:

- Act in good faith to identify and report vulnerabilities
- Avoid accessing, modifying, or deleting data beyond what is necessary to demonstrate the vulnerability
- Do not perform social engineering, phishing, or physical attacks
- Do not disrupt the service for other users
- Report findings privately before public disclosure

We reserve the right to take action if a researcher acts outside these boundaries.

---

## Coordinated Disclosure

After a vulnerability is fixed, we support coordinated disclosure:

- Researchers are notified of the remediation timeline
- Researchers may request credit in our acknowledgements (see below)
- We will not disclose details that could endanger researchers
- Mutually agreed disclosure timing is respected

---

## Recognition

We do not currently offer a paid bug bounty program. Researchers who report valid vulnerabilities through this program will be:

- Acknowledged in `SECURITY.md` (with permission)
- Thanked publicly in our release notes (with permission)

---

## Security Architecture Reference

For context when reviewing the platform:

| Area | Control |
|------|---------|
| Authentication | OpenID Connect (PKCE) — no passwords stored |
| Authorization | Six-tier RBAC, org-scoped, server-side enforced |
| Data in transit | TLS 1.3, HSTS with preload |
| Data at rest | PostgreSQL encryption at rest (Azure managed) |
| AI governance | Advisory only — human approval required for all consequential actions |
| Audit trail | Immutable — actor, role, timestamp, entity on all significant actions |
| Input validation | Zod schemas on all user-facing endpoints |
| Secrets | Environment variable injection; Azure Key Vault in production |

---

## Contact

**Security email:** security@stephenl.dev  
**Trust Center:** https://szlholdings.com/trust  
**Security page:** https://szlholdings.com/security  
**`security.txt`:** https://szlholdings.com/.well-known/security.txt

---

*SZL Holdings does not currently offer a paid bug bounty program. We appreciate responsible disclosure as a shared commitment to security.*
