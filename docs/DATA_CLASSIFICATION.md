# Data Classification — SZL Holdings Platform

> Classification tiers for all data processed by the SZL Holdings platform, with handling requirements per tier.

---

## Classification Tiers

### Tier 1 — Public

**Definition:** Information intentionally made publicly available. No access controls required.

**Examples:**
- Marketing content (product descriptions, pricing)
- Public documentation
- Published blog posts and case studies
- Status page information
- Legal and trust documents

**Handling:** No special requirements. May be cached, indexed, shared freely.

---

### Tier 2 — Internal

**Definition:** Information intended for internal use only. Not sensitive, but not intended for public distribution.

**Examples:**
- Internal operational documentation (runbooks, guides)
- Non-sensitive configuration
- Development and staging environment details
- Internal analytics and KPI data
- Demo environment configuration

**Handling:**
- Access restricted to authenticated internal users
- Not indexed or cached in ways accessible externally
- May be shared among the SZL Holdings team

---

### Tier 3 — Confidential

**Definition:** Sensitive business information. Unauthorized access would cause material harm.

**Examples:**
- Customer contracts and pricing
- Investor data room contents
- Financial projections and business plans
- Contact form submissions (prospect information)
- Design partner details and agreements
- Internal security findings and assessments

**Handling:**
- Access restricted to role-authorized users only
- Transmitted over TLS only
- Logged in audit trail on access
- Not transmitted to third-party services without explicit authorization
- Deleted per data retention policy

---

### Tier 4 — Restricted

**Definition:** Highly sensitive data. Unauthorized access would cause severe harm.

**Examples:**
- Production database credentials
- OAuth client secrets and API keys
- Session signing secrets
- Encryption keys
- Customer PII (names, emails, addresses)
- Legal privileged communications (Counsel)
- Maritime vessel positions with commercial sensitivity (Vessels)
- Real estate deal details with NDA requirements (Terra)

**Handling:**
- Never stored in plaintext
- Access limited to minimum necessary personnel/services
- Encrypted at rest and in transit
- All access logged and audited
- Subject to data residency requirements
- Deleted per data retention schedule and on customer request
- Breach notification required if exposed

---

## Data by Product

| Product | Data Collected | Classification |
|---------|---------------|----------------|
| SZL Holdings (marketing) | Contact form submissions, analytics | Tier 3 (contacts), Tier 2 (analytics) |
| Lyte | Business signals, KPI data, action history | Tier 3–4 (depends on customer data) |
| Alloy | Workflow execution history, approval records | Tier 3–4 |
| Aegis | Threat intelligence, security alerts, SOAR playbooks | Tier 4 |
| Vessels | Fleet positions, voyage data, sanctions flags | Tier 3–4 |
| Terra | Property ownership data, deal pipeline | Tier 3–4 |
| Counsel | Legal matter details, client communications | Tier 4 (legal privilege) |
| Carlota Jo | UHNW client intake, advisory communications | Tier 4 |

---

## Handling Requirements Summary

| Requirement | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|------------|--------|--------|--------|--------|
| Encryption at rest | No | No | Yes | Yes |
| Encryption in transit | Preferred | Yes | Yes | Yes |
| Access control | No | Yes | Yes | Yes (role-restricted) |
| Audit logging | No | No | Yes | Yes |
| Data residency | No | No | Preferred | Yes |
| Retention policy | No | 2 years | 5 years | Per contract / legal |
| Breach notification | No | No | Case-by-case | Yes |
| Third-party sharing | Allowed | Allowed (internal tools) | Restricted | Prohibited without consent |

---

## Customer Data Rights

Customers have the right to:
- **Access** — Request a copy of their data
- **Correction** — Request corrections to inaccurate data
- **Deletion** — Request deletion (subject to legal retention requirements)
- **Portability** — Receive data in a portable format

To exercise these rights: [privacy@szlholdings.com](mailto:privacy@szlholdings.com)

---

*Last updated: 2026-04-03*
