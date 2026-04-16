# Shared Responsibility Model — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Enterprise buyers, procurement teams, security evaluators, compliance officers
**Companion docs:** [TENANCY-MODEL.md](TENANCY-MODEL.md) · [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) · [DATA-RETENTION.md](DATA-RETENTION.md)

---

## Purpose

Enterprise security is a partnership. This document defines, with precision, what SZL Holdings is responsible for versus what the customer organization is responsible for. Ambiguity in this model leads to gaps; this document eliminates ambiguity.

---

## Summary Table

| Domain | SZL Holdings | Customer |
|--------|-------------|----------|
| Platform infrastructure | ✅ Full | — |
| Application security | ✅ Full | — |
| Authentication (platform layer) | ✅ Full | — |
| Identity provider (SSO/SCIM) | Configuration | ✅ Full |
| User provisioning and deprovisioning | Platform enforcement | ✅ Full |
| Role assignment | Platform enforcement | ✅ Assignment decisions |
| Data entered by users | Storage and protection | ✅ What is entered |
| Data residency selection | Options and enforcement | ✅ Selection |
| Export and external sharing | Guard rails | ✅ Decisions |
| AI output review | Platform gates | ✅ Human approval |
| Endpoint device security | — | ✅ Full |
| Network access controls | — | ✅ Full |
| Compliance certifications (customer-side) | Evidence support | ✅ Full |

---

## Section 1: Infrastructure and Platform

### SZL Holdings Is Responsible For

- **Compute and runtime:** Application servers, container orchestration, health monitoring, automatic failover.
- **Database hosting:** PostgreSQL deployment, automated backups (per [BACKUP-RESTORE.md](BACKUP-RESTORE.md)), encryption at rest, access controls.
- **Network security:** TLS 1.3 on all connections. No plaintext communication.
- **Platform secrets:** All platform credentials managed via environment variable injection and Azure Key Vault. No secrets in source code.
- **Dependency management:** Dependency vulnerability scanning; blocking CI gates on high/critical severity findings.
- **Availability:** Best-effort uptime targeting 99.5% at GA. Incident response per [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md).
- **Platform updates and patches:** Applying security patches to the platform stack without requiring customer action.

### Customer Is Responsible For

- Physical security of customer endpoints, devices, and local networks.
- VPN or network-level controls before accessing the platform (if required by policy).
- Ensuring customer-controlled integration systems (e.g., Azure AD tenant, SSO identity provider) are properly secured.

---

## Section 2: Authentication and Identity

### SZL Holdings Is Responsible For

- **OIDC/PKCE implementation:** Secure authentication flow without storing passwords in platform systems.
- **Session security:** HttpOnly, Secure, SameSite cookies; CSRF protection; session expiry enforcement.
- **Password fallback:** PBKDF2/SHA-512 hashing with 100,000 iterations for any credential-based fallback login.
- **WebSocket security:** HMAC-signed connection tickets with 5-minute TTL.
- **MFA option:** Platform-level MFA enforcement (where enabled by plan).
- **SCIM 2.0 gateway:** Providing the SCIM endpoint for automated provisioning; enforcing platform-side effects.

### Customer Is Responsible For

- **Identity provider (IdP) security:** The Azure AD tenant or OIDC identity provider is the customer's system. Its configuration, security, and availability are the customer's responsibility.
- **SSO configuration:** Correct configuration of the OIDC/SAML integration with the platform.
- **MFA enforcement at IdP:** If MFA is required, it must be enforced at the identity provider. Platform MFA is an additional option, not a substitute.
- **User deprovisioning:** Customers must deprovision users promptly on offboarding. SCIM 2.0 automates this when configured; without SCIM, manual deprovisioning is the customer's responsibility.
- **Shared credentials:** Customer is responsible for not sharing platform credentials across users.

---

## Section 3: Access Control and Role Management

### SZL Holdings Is Responsible For

- **Deny-by-default enforcement:** All `/api/*` routes require authentication unless explicitly allowlisted.
- **RBAC engine:** The 11-role hierarchy and per-route enforcement are platform controls.
- **Org-scope isolation:** Database-level `org_id` scoping prevents cross-tenant access — this is a platform guarantee.
- **Privileged access controls:** `super_admin` access cannot be granted via UI; requires database write. All super-admin actions are logged.
- **Audit trail:** Immutable, org-scoped Proof Chain records all access events.

### Customer Is Responsible For

- **Role assignment decisions:** Which users get which roles. The platform enforces the rules; the customer defines the roster.
- **Least privilege practice:** Assigning users the minimum necessary role for their function.
- **Access reviews:** Periodically reviewing user roles and removing access for users who no longer need it. (Platform provides the audit trail; review is the customer's process.)
- **Org admin access:** Protecting org admin credentials. An org admin can modify roles within their org; the customer must protect that account appropriately.

---

## Section 4: Data

### SZL Holdings Is Responsible For

- **Tenant isolation:** All tenant data is scoped by `org_id`. Cross-tenant access is architecturally prevented at four layers.
- **Encryption at rest:** PostgreSQL data encrypted at rest on all managed deployments.
- **Encryption in transit:** TLS 1.3 on all connections.
- **Backup integrity:** Regular automated backups with tested restore procedures per [BACKUP-RESTORE.md](BACKUP-RESTORE.md).
- **Retention enforcement:** Enforcing retention periods per [DATA-RETENTION.md](DATA-RETENTION.md) for platform-generated data.
- **GDPR/CCPA rights requests:** Processing verified data subject requests within required timeframes.

### Customer Is Responsible For

- **Data entry quality:** Accuracy and appropriateness of data entered into the platform.
- **Data classification:** Determining which of their data is sensitive and applying appropriate internal controls.
- **Export and downstream handling:** Data exported from the platform is the customer's responsibility once it leaves the platform boundary.
- **Retention decisions:** Customers may request extended or shorter retention periods under Enterprise contracts. Standard retention schedules apply otherwise.
- **Legal holds:** Customers must notify SZL Holdings before retention periods expire if legal holds apply.

---

## Section 5: AI and Governed Decisions

### SZL Holdings Is Responsible For

- **Advisory-only enforcement:** AI agents cannot execute consequential actions without human approval. Enforced at the Alloy workflow layer, not just the UI.
- **Proof Chain provenance:** Every AI recommendation is tagged with model identity, source citations, confidence score, and review status.
- **Export guard:** The `assertExportSafe()` guard blocks AI outputs not cleared by human review from reaching document generation.
- **Tenant-scoped AI retrieval:** RAG retrieval is tenant-isolated; an AI agent cannot surface data from another tenant's knowledge base.
- **No training on customer data:** AI provider contracts enforce no-training-on-customer-data posture.

### Customer Is Responsible For

- **Human review:** Approving or rejecting AI recommendations before consequential actions proceed. The platform provides the queue and the gate; the human reviewer is the customer's employee.
- **BYO model security:** If the customer provides a custom model endpoint (Enterprise plan), the security of that endpoint is the customer's responsibility.
- **Prompt hygiene:** Avoiding entry of unnecessary sensitive data in AI prompts.
- **AI output validation:** Final validation of AI recommendations against business context the platform may not have visibility into.

---

## Section 6: Security Monitoring and Incident Response

### SZL Holdings Is Responsible For

- **Platform-level monitoring:** API error rates, latency, infrastructure health.
- **Security event detection:** Audit trail anomaly monitoring, failed auth alerts.
- **Incident response:** Responding to platform incidents per [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) and [SEVERITY_MODEL.md](SEVERITY_MODEL.md).
- **Breach notification:** Notifying customers within committed timeframes if a breach affects customer data.

### Customer Is Responsible For

- **Endpoint security:** Detecting and responding to compromised user devices.
- **Suspicious activity review:** Reviewing their own audit trail for anomalous user behavior within their org.
- **Incident reporting:** Reporting suspected platform security issues to security@szlholdings.com promptly.
- **Their own incident response:** Responding to incidents in their own organization that may have originated from or propagated to the platform.

---

## Section 7: Compliance

### SZL Holdings Is Responsible For

- Maintaining the platform's security and governance posture as described in this and related documents.
- Providing evidence and documentation to support customer compliance audits (SOC 2, ISO 27001, etc.) on reasonable request.
- Honest disclosure of platform gaps and limitations (see [KNOWN-GAPS.md](KNOWN-GAPS.md)).

### Customer Is Responsible For

- Their own regulatory compliance obligations (industry-specific regulations, local law, contractual obligations).
- Ensuring the platform is used in a manner consistent with their compliance requirements.
- Obtaining legal advice on the applicability of regulations to their use of the platform.
- Their own SOC 2, ISO 27001, HIPAA, or other certifications. SZL Holdings can provide evidence; we cannot certify the customer.

---

## What This Model Does Not Cover

This model describes the responsibility split for the SaaS platform offering. Custom deployments, professional services engagements, or white-label arrangements may have different responsibility allocations defined in the governing contract. The contract governs in case of conflict with this document.

---

*Shared Responsibility Model last reviewed: **2026-04-16** · Next review: **2026-07-01***
