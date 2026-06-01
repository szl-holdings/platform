# Privacy Overview — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Enterprise buyers, procurement teams, compliance officers, legal counsel
**Companion docs:** [DATA-RETENTION.md](data-retention.md) · [TENANCY-MODEL.md](../architecture/tenancy-model.md) · [AI_GOVERNANCE.md](../architecture/ai-governance.md)

> **Important:** This document describes the platform's privacy framework and commitments. It is not a complete legal privacy policy. Full legal terms require review by counsel. Nothing here constitutes legal advice.

---

## Summary

SZL Holdings is designed with privacy as an architectural property, not a compliance checkbox. Tenant data is isolated at the query layer. Customer data is never used to train AI models. Privacy rights requests are processed within required timeframes.

---

## Applicable Frameworks

| Framework | Status | Notes |
|-----------|--------|-------|
| GDPR (EU/UK) | Privacy framework in place | DPA-ready; full legal review required before EU commercial launch |
| CCPA / CPRA (California) | Privacy framework in place | Consumer rights honored within 45 days |
| PIPEDA (Canada) | Committed posture | Not yet formally assessed |
| HIPAA | Not currently in scope | Evaluated case by case under BAA |
| COPPA | Platform is B2B only | No known end-user data from minors |

---

## What Data We Collect

### User Account Data
- Name, email address, role, organization membership
- Authentication events (login, logout, failed attempts)
- Session metadata (IP address, user agent — hashed/anonymized in audit logs)

### Platform Usage Data
- API call logs (endpoint, timestamp, response code — no request body)
- Feature interaction events (page views, workflow triggers)
- AI query prompts and outputs (stored in Proof Chain, tenant-scoped)

### Customer-Uploaded Data
- Files, documents, and attachments uploaded by users
- Stored in tenant-scoped object storage paths
- Not accessed by SZL Holdings staff except under explicit support ticket with customer authorization

### Billing Data
- Processed via Stripe — SZL Holdings does not store raw card data
- Stripe is the PCI-DSS compliant processor

---

## What Data We Do Not Collect

- Payment card numbers (handled entirely by Stripe)
- Government IDs or national identifiers (not requested)
- Precise geolocation (city-level only for session analytics)
- Third-party cookies for cross-site tracking
- Data from users under 18

---

## How Data Is Used

| Purpose | Data Used | Legal Basis |
|---------|-----------|-------------|
| Authentication and session management | Email, session token | Contract |
| Platform service delivery | All tenant data | Contract |
| Security monitoring and incident response | Logs, audit trail | Legitimate interest |
| Platform analytics (aggregated) | Usage events (anonymized) | Legitimate interest |
| Billing | Plan, usage | Contract |
| Legal compliance | Data required by law | Legal obligation |

SZL Holdings does **not** use customer data for:
- Advertising or marketing to third parties
- Profiling or automated decision-making that produces legal/significant effects on individuals
- Training AI/ML models (confirmed in all provider agreements)

---

## Data Subject Rights

### GDPR Rights (EU/UK Residents)

| Right | How to Exercise | Response Time |
|-------|----------------|---------------|
| Access (Subject Access Request) | Email support@szlholdings.com | 30 days |
| Rectification | Email support@szlholdings.com | 30 days |
| Erasure ("right to be forgotten") | Email support@szlholdings.com | 30 days |
| Data portability | Email support@szlholdings.com | 30 days |
| Restriction of processing | Email support@szlholdings.com | 30 days |
| Object to processing | Email support@szlholdings.com | 30 days |
| Withdraw consent | Email support@szlholdings.com | Immediate |

### CCPA Rights (California Residents)

| Right | How to Exercise | Response Time |
|-------|----------------|---------------|
| Know what personal information is collected | Email support@szlholdings.com | 45 days |
| Know whether PI is sold or disclosed | Email support@szlholdings.com | 45 days |
| Opt out of sale of PI | Not applicable — SZL Holdings does not sell PI | N/A |
| Delete personal information | Email support@szlholdings.com | 45 days |
| Non-discrimination | Automatic — exercising rights does not affect service | N/A |

**Privacy requests:** support@szlholdings.com (subject line: `[PRIVACY] Request Type`)

---

## Data Sharing and Third Parties

SZL Holdings shares data with third parties only as required to deliver the service. All sub-processors are bound by data processing agreements.

### Sub-Processor Register (Summary)

| Sub-processor | Purpose | Data Shared | Region |
|---------------|---------|-------------|--------|
| Replit (development) | Infrastructure, database | All tenant data (dev) | US |
| Azure (production) | Infrastructure, database, blob storage | All tenant data (prod) | US (primary) / EU (optional) |
| Stripe | Payment processing | Billing data | US |
| OpenAI | AI inference | Prompts and context | US |
| Anthropic | AI inference (fallback) | Prompts and context | US |
| HuggingFace | AI inference (primary) | Prompts and context | US |
| SendGrid / email provider | Transactional email | Email address | US |

> Full third-party register: [docs/THIRD_PARTY_REGISTER.md](../THIRD_PARTY_REGISTER.md)

**No customer data is sold to third parties. Ever.**

---

## AI and Privacy

- **No training on customer data:** All AI providers are configured to not use customer inputs for model training. This is enforced in provider agreements.
- **Prompt handling:** AI prompts are processed in-memory and stored in the tenant-scoped Proof Chain for auditability. They are not retained by providers beyond their stated session policies.
- **Minimization:** AI queries are constructed with the minimum context necessary to serve the user's request.
- **Automated decision-making:** AI outputs are advisory only. No AI output produces a legal or similarly significant effect on any individual without human review. The Covenant Policy engine enforces this at the platform layer.

See [AI_GOVERNANCE.md](../architecture/ai-governance.md) for the full AI governance posture.

---

## Data Residency

| Edition | Default Region | EU Option |
|---------|---------------|-----------|
| Development / Replit | US | No |
| Production (Azure) | US East 2 | Yes — available by contract |
| Enterprise | Configurable | Yes — EU-only deployment available |

EU data residency requires an Enterprise contract. Contact inquiries@szlholdings.com.

---

## Breach Notification

In the event of a confirmed or suspected data breach:

1. Internal detection and containment per [INCIDENT_RESPONSE.md](../operations/incident-response.md)
2. Legal counsel engaged within 24 hours of confirmation
3. **GDPR:** Supervisory authority notified within 72 hours (where required)
4. **Affected individuals:** Notified without undue delay where high risk to rights and freedoms
5. **Enterprise customers:** Notified promptly to support their own notification obligations

---

## Data Protection Officer

SZL Holdings does not currently have a designated DPO. Privacy responsibilities are held by the founder (Stephen Lutar) with external legal counsel engaged for EU compliance review.

**Privacy contact:** support@szlholdings.com  
**Security contact:** security@szlholdings.com

---

## Changes to This Document

This document is reviewed annually and on material platform changes. Enterprise customers will be notified of material changes to data handling practices.

---

*Privacy Overview last reviewed: **2026-04-16** · Next scheduled review: **2027-04-01***
