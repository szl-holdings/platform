# Trust Center Launch Pass

**Last updated:** April 2026  
**Purpose:** Checklist and content spec for the public-facing Trust Center. Ensures all content is accurate, specific, and does not overstate controls.

---

## Trust Center Purpose

The Trust Center is the self-serve answer to the security reviewer and executive buyer question: "Is this safe to evaluate seriously?"

It must be accurate, specific, and honest about current state. Overstating controls destroys trust more surely than disclosing known gaps with mitigation plans.

---

## Trust Center Content Checklist

### Section 1: Security Architecture

**Must include:**

- [ ] Transport security: TLS 1.3 for all connections between browser/mobile and server
- [ ] Internal transport: mTLS for Replit proxy preview connections
- [ ] Session security: HttpOnly + Secure + SameSite=Lax cookies, 24-hour expiry with sliding refresh
- [ ] Authentication: Bearer token (mobile/API) and session cookie (web), same RBAC enforcement for both
- [ ] API rate limiting: Global 200 req/15min, auth endpoints 5 req/1min, write operations 60/min — per authenticated user, fail-closed
- [ ] Body size limit: 10MB to prevent large payload DoS
- [ ] Tenant isolation: Org-scoped queries enforced at data layer via `callerOrgIds()` — architectural, not just query-level

**Must not include:**
- SOC 2 claim (not yet certified)
- Penetration test claim (not yet conducted)
- "Certified" or "compliant" language for any framework not yet audited

---

### Section 2: Data Handling

**Must include:**

- [ ] Data encryption at rest: AES-256-GCM with authentication tags for sensitive fields
- [ ] Data encryption in transit: TLS 1.3
- [ ] Field-level encryption: Applied to sensitive fields via `FIELD_ENCRYPTION_KEY` (managed in Replit Secrets, not source code)
- [ ] Database: PostgreSQL 16, hosted on managed infrastructure (Replit)
- [ ] Audit trail: Immutable Proof Chain — append-only, SHA-256 integrity, activity logger on all consequential actions
- [ ] Data residency: United States (Replit-managed infrastructure)
- [ ] Retention policy: Defined in privacy policy; enterprise contracts can specify custom terms

**Must not include:**
- "GDPR-compliant" without specifying which controls and jurisdiction scope
- "HIPAA-ready" without BAA and formal assessment

---

### Section 3: AI Governance

**Must include:**

- [ ] Advisory-only model: AI agents surface recommendations; consequential actions require explicit human approval
- [ ] Proof Chain anchoring: Every AI output creates an immutable audit trail entry
- [ ] Source grounding: Every AI recommendation includes the data points it drew from and a confidence score
- [ ] Covenant Policy: Approval gates enforced at the platform layer — AI cannot route around them
- [ ] Multi-provider: OpenAI, Anthropic, Gemini with fallback logic — no single AI provider dependency
- [ ] No autonomous execution: AI cannot execute consequential actions without human confirmation

**Must not include:**
- "Our AI is unbiased" — no AI is unbiased; do not claim this
- "AI-certified" or "audited AI" — no third-party AI audit has been conducted
- Hallucination guarantees — we mitigate through source grounding, not elimination

---

### Section 4: Access Controls

**Must include:**

- [ ] Role hierarchy: super_admin → ops → manager → analyst → viewer → guest (6 roles, inheriting downward)
- [ ] SCIM 2.0: Available for enterprise identity management
- [ ] Azure AD SSO: Available for enterprise single sign-on
- [ ] Internal token controls: ALLOY_INTERNAL_TOKEN restricted to server-side; not in client bundles
- [ ] Cross-org protection: Cross-org requests return 404 (not 403) to prevent information leakage
- [ ] Feature flags: Experimental features controlled by server-side flags, not client-accessible toggles

---

### Section 5: Incident Response

**Must include:**

- [ ] Response contacts: security@szlholdings.com for security disclosures
- [ ] Disclosure policy: Responsible disclosure — acknowledge within 24 hours, patch within 48–72 hours for critical
- [ ] Rollback capability: Previous deployment versions accessible via Replit for rapid rollback
- [ ] Incident logging: All incidents generate structured Pino logs with correlation IDs

**Must not include:**
- SLA commitments not yet formally contractualized
- "24/7 monitoring" without the infrastructure to support it

---

### Section 6: Compliance Roadmap

**Must disclose current status honestly:**

| Framework | Current Status | Target |
|---|---|---|
| SOC 2 Type II | Not yet. Targeted for Phase 3 (post-funding). | 6–9 months post-funding close |
| Penetration test | Not yet conducted. | Pre-production launch |
| GDPR assessment | Not yet formally assessed. | Pre-EU customer acquisition |
| HIPAA | Not targeted currently. | Only if healthcare vertical pursued |
| StateRAMP | Not targeted currently. | Only if federal vertical pursued |

Disclosing "not yet" with a roadmap date is more credible than silence on these items.

---

### Section 7: Known Gaps (Proactive Disclosure)

Document these openly in the Trust Center or in diligence materials:

| Gap | Current Mitigation | Roadmap |
|---|---|---|
| Immutable log sink | Pino structured logs with request IDs, no external tamper-proof sink | External logging service (post-funding) |
| ALLOY_INTERNAL_TOKEN rotation | Static token managed in Replit Secrets | Implement rotation policy post-funding |
| Database query timeout enforcement | Not yet enforced | Engineering backlog |
| AI provider circuit breakers | Multi-provider fallback exists | Circuit breaker pattern on engineering backlog |

---

## Trust Center Page Structure

Recommended page hierarchy under /trust:

```
/trust
  Overview (security posture summary + contact)
  /trust/security (architecture, transport, session controls)
  /trust/data (encryption, residency, retention)
  /trust/ai-governance (advisory model, proof chain, covenant policy)
  /trust/access (RBAC, SSO, tenant isolation)
  /trust/compliance (current certifications, roadmap)
  /trust/incident-response (disclosure policy, contacts)
```

---

## Review and Update Cadence

Trust Center content must be reviewed:
- After every significant security change
- After every new compliance milestone
- Before every significant enterprise diligence engagement
- Quarterly at minimum

Owner: Founder (currently). Delegate when security/compliance hire is made.

---

*See also: `diligence-fast-path-final.md` (persona routing), ops/security/threat-model-summary.md, ops/security/secret-inventory.md*
