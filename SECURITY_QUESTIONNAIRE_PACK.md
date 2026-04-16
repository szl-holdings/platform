# Security Questionnaire Pack — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Enterprise procurement, vendor risk teams, security reviewers
**Companion docs:** [SECURITY.md](SECURITY.md) · [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) · [TENANCY-MODEL.md](TENANCY-MODEL.md) · [AI_GOVERNANCE.md](AI_GOVERNANCE.md)

> This document provides pre-answered responses to common enterprise security questionnaire topics. It is intended to accelerate vendor security reviews. For topics not covered, contact security@szlholdings.com.
>
> **Note:** Some answers describe current state; some describe roadmap. Where applicable, status is labeled: **[Current]** or **[Planned — date]**.

---

## 1. Company and Product Information

**Q: What is the product and who is the vendor?**  
SZL Holdings operates a governed operational intelligence platform covering maritime, defense/intelligence, real estate, legal matter management, and advisory domains. The platform is a multi-tenant SaaS built on a TypeScript/Node.js monorepo with PostgreSQL.

**Q: What is the current commercial status?**  
Design partner / alpha phase as of April 2026. Not yet commercially deployed at scale. First production customers targeted for GA.

**Q: Is this product hosted or self-hosted?**  
Hosted SaaS (Replit for development, Azure for production). Enterprise on-premise deployment is on the roadmap but not currently available.

---

## 2. Authentication and Authorization

**Q: Does the product support Single Sign-On (SSO)?**  
Yes — OpenID Connect (OIDC) with PKCE flow. Azure AD integration available. [Current]

**Q: Does the product support SAML?**  
OIDC only. SAML support is on the roadmap. [Planned — Phase 3]

**Q: Does the product support multi-factor authentication (MFA)?**  
MFA is enforced at the identity provider level. If the customer's Azure AD enforces MFA, platform sessions require it. Platform-native MFA (TOTP) is on the roadmap. [Planned — Phase 3]

**Q: Does the product support SCIM for automated user provisioning?**  
Yes. SCIM 2.0 is implemented at `/api/scim/v2/`. Supports user create, update, deactivate, and group-to-role mapping. [Current]

**Q: How are sessions managed?**  
Server-side sessions stored in PostgreSQL. Session cookies: HttpOnly, Secure (unconditional), SameSite=Lax. Session lifetime: 7 days for OIDC, 30 days for credential fallback. Sessions invalidated on explicit logout.

**Q: Does the product support role-based access control?**  
Yes. 11-role RBAC hierarchy with organization-scoped tenant isolation. Deny-by-default: all API routes require authentication unless explicitly allowlisted. See [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) for the full matrix.

**Q: Can administrators restrict access to specific features or data?**  
Yes. Role assignment controls access at the route and feature level. Org admins manage roles within their org. Super-admin cannot be granted via UI.

---

## 3. Data Security

**Q: Is data encrypted in transit?**  
Yes. TLS 1.3 on all connections. WebSocket uses HMAC-signed tickets with 5-minute TTL. No plaintext communication. [Current]

**Q: Is data encrypted at rest?**  
Yes. PostgreSQL encryption at rest on all managed deployments (Replit-managed in development, Azure-managed in production). [Current]

**Q: Is there field-level encryption for sensitive fields?**  
Connector credentials (OAuth tokens, API keys) are encrypted at the field level using `CONNECTOR_ENCRYPTION_KEY`. PII fields (contact email, user profiles) rely on database-level encryption only. Field-level encryption for PII columns is tracked as a known gap (KG020d). [Partial — gap tracked]

**Q: How are secrets managed?**  
All credentials injected via environment variables. No secrets in source control. Azure Key Vault used in production for credential management. [Current]

**Q: Is there a data classification policy?**  
Yes. See [docs/DATA_CLASSIFICATION.md](docs/DATA_CLASSIFICATION.md) for data sensitivity tiers. [Current]

---

## 4. Multi-Tenancy and Data Isolation

**Q: Is this a multi-tenant system?**  
Yes. Shared infrastructure, logically isolated multi-tenant architecture.

**Q: How is tenant data isolated?**  
Four-layer enforcement: (1) all DB queries include `WHERE org_id = ?`, (2) Drizzle ORM query builders enforce org scope by default, (3) `tenantScope` middleware verifies org membership at the route level, (4) WebSocket channels are prefixed with `org_id`. Cross-tenant access is architecturally prevented — there is no code path that returns one tenant's data to another tenant. See [TENANCY-MODEL.md](TENANCY-MODEL.md).

**Q: Can SZL Holdings staff access customer data?**  
SZL Holdings staff access is limited to platform administration (`super_admin` role). All super-admin actions are logged in the immutable audit trail. Customer data (uploaded files, entered data) is not accessed by staff except under explicit, customer-authorized support tickets.

**Q: Is physical (database-level) isolation available?**  
Not currently. Logical isolation via `org_id` scoping on all queries. Physical database-per-tenant isolation is available on the Azure Enterprise roadmap. [Planned — Enterprise tier]

---

## 5. Network Security

**Q: Does the product use a web application firewall (WAF)?**  
Replit proxy provides mTLS for the development environment. Azure WAF is configured for production deployments. [Production — Current]

**Q: Is there rate limiting?**  
Yes. `express-rate-limit` applied to write-heavy and AI endpoints. [Current]

**Q: Are security headers configured?**  
Yes. Helmet.js applied to all responses: HSTS, X-Frame-Options, X-Content-Type-Options, CSP (configured), Referrer-Policy. [Current]

**Q: Is there a vulnerability disclosure / bug bounty program?**  
Responsible disclosure program is active (see [SECURITY.md](SECURITY.md)). No paid bug bounty currently. Disclosure email: security@szlholdings.com.

---

## 6. Vulnerability Management

**Q: Is there a vulnerability management process?**  
Yes. Known gaps are tracked in [KNOWN-GAPS.md](KNOWN-GAPS.md) with severity, status, and remediation owners. All P0 items are resolved as of April 2026.

**Q: Is there automated dependency scanning?**  
`pnpm audit` runs in CI. CodeQL static analysis and GitHub dependency review action are planned (KG011, KG012). [Partial]

**Q: How quickly are critical vulnerabilities patched?**  
Critical: within 24 hours of confirmation. High: within 5 business days. Medium: within 30 days. See [SECURITY.md](SECURITY.md).

**Q: Is there a security CI pipeline?**  
TypeScript typecheck (`tsc --noEmit`), ESLint, and build validation block on any failure. `pnpm audit` is run in CI. See [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md) for the full gate list.

---

## 7. AI and Machine Learning

**Q: Does the product use AI?**  
Yes. AI is used for analysis, recommendations, document generation, and workflow automation across all domain packs.

**Q: Is customer data used to train AI models?**  
No. All AI provider contracts include no-training-on-customer-data terms. Customer data is not used for model training or fine-tuning.

**Q: Can AI agents take autonomous actions?**  
No. AI agents are advisory only. Consequential actions require explicit human approval. This is enforced at the Alloy workflow layer (not just the UI). The Covenant Policy engine evaluates every agent recommendation before it can proceed.

**Q: What AI providers are used?**  
Primary: HuggingFace Inference (Qwen3-8B). Fallback: OpenAI → Anthropic → Gemini. Model selection is always disclosed in the Proof Chain entry.

**Q: Can customers use their own AI models?**  
Yes — at Enterprise tier, customers may supply a model from the platform allow-list. [Current — Enterprise]

**Q: Are AI outputs auditable?**  
Yes. Every AI recommendation is recorded in the Proof Chain with model identity, version, source citations, confidence score, and review status. The Proof Chain is cryptographically verifiable. [Current]

See [AI_GOVERNANCE.md](AI_GOVERNANCE.md) for the complete AI governance posture.

---

## 8. Compliance and Certifications

**Q: Is the product SOC 2 Type II certified?**  
Not yet. SOC 2 Type II audit is roadmapped for Phase 3 (post-funding). [Planned — Phase 3]

**Q: Is the product ISO 27001 certified?**  
Not yet. ISO 27001 is on the roadmap for Phase 3. [Planned — Phase 3]

**Q: Is the product GDPR compliant?**  
A GDPR privacy framework is in place (see [PRIVACY_OVERVIEW.md](PRIVACY_OVERVIEW.md)). Full legal compliance review with external counsel is required before EU commercial launch. [Framework in place]

**Q: Is the product HIPAA compliant?**  
Not currently. HIPAA compliance is evaluated case by case under a Business Associate Agreement for applicable customers. [Evaluated per contract]

**Q: Is the product PCI-DSS compliant?**  
Payment processing is handled by Stripe. SZL Holdings does not store, transmit, or process raw card data. PCI-DSS compliance is Stripe's responsibility for payment processing.

**Q: Can the product support our compliance audit?**  
Yes. We can provide documentation, audit trail exports, architecture diagrams, and access to this trust center documentation. Contact security@szlholdings.com.

---

## 9. Incident Response and Business Continuity

**Q: Is there a documented incident response process?**  
Yes. See [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) and [SEVERITY_MODEL.md](SEVERITY_MODEL.md).

**Q: What are the RTO and RPO targets?**  
RTO: 4 hours. RPO: 1 hour. See [BACKUP-RESTORE.md](BACKUP-RESTORE.md) for tier-specific targets.

**Q: How quickly will we be notified of a breach?**  
Enterprise customers are notified promptly upon confirmed breach. GDPR breach notification is within 72 hours to supervisory authority. [Current commitment]

**Q: Is there a status page?**  
Planned. See [STATUSPAGE_PLAN.md](STATUSPAGE_PLAN.md). [Planned — pre-GA]

---

## 10. Third-Party and Supply Chain

**Q: What third-party services does the product use?**  
See [docs/THIRD_PARTY_REGISTER.md](docs/THIRD_PARTY_REGISTER.md) for the full register. Key providers: Azure (infrastructure), Stripe (payments), OpenAI/Anthropic/HuggingFace (AI inference).

**Q: Are third-party providers vetted?**  
Yes. Major providers are evaluated for their security posture, certifications, and data processing terms before integration. See [docs/DEPENDENCY_POLICY.md](docs/DEPENDENCY_POLICY.md).

**Q: Do you have data processing agreements with sub-processors?**  
Yes. All sub-processors handling customer data operate under data processing agreements.

---

## 11. Physical Security

**Q: What are your physical security controls?**  
The platform is hosted on Replit (development) and Azure (production). Physical security is the responsibility of those cloud providers, both of which hold relevant certifications. SZL Holdings does not operate physical data centers.

---

## 12. Penetration Testing

**Q: Has the platform been penetration tested?**  
Not yet by an independent third party. Internal security review and gap assessment was conducted in April 2026. Third-party penetration testing is planned for Phase 3 (pre-GA). [Planned — Phase 3]

---

## Contact

For additional questions not covered by this questionnaire:

**Security contact:** security@szlholdings.com  
**Subject line:** `[SECURITY REVIEW] Company Name — Question`  
**Response:** Acknowledgment within 2 business days

---

*Security Questionnaire Pack last reviewed: **2026-04-16** · Next review: **2026-07-01***
