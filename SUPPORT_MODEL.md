# Support Model — SZL Holdings Platform

> How support is routed, who handles what, and what response times to expect.

---

## Current Support Phase

SZL Holdings is in **design partner / alpha phase**. Support is handled directly by the founding team. Formal tier-based support will be established as the platform scales to production customers.

---

## Support Tiers

### Tier 0 — Self-Service

Users resolve issues through available resources:
- Product documentation: `/docs/*`
- Trust Center: `/trust-center`
- Status page: `/status`
- FAQ (on product pages)

**No response time commitment.** Users resolve independently.

---

### Tier 1 — General Inquiries

**Channel:** Contact form at `/contact` → `inquiries@szlholdings.com`

**Scope:**
- General product questions
- Demo requests
- Partnership inquiries
- Press / media inquiries
- Pricing questions

**Response time:** 1–2 business days

**Handler:** Stephen Lutar / founding team

---

### Tier 2 — Design Partner & Pilot Support

**Channel:** Direct email / dedicated Slack channel (per design partner)

**Scope:**
- Platform configuration questions
- Workflow and demo data setup
- Feature feedback
- Integration guidance

**Response time:** Same day (business hours)

**Handler:** Stephen Lutar directly during alpha phase

---

### Tier 3 — Carlota Jo Client Support

**Channel:** Direct email / client portal contact

**Scope:**
- Account access issues
- Service delivery questions
- Document requests
- Intake process questions

**Response time:** Within 4 hours (business hours)

**Handler:** Carlota Jo advisory team

---

### Tier 4 — Security & Trust

**Channel:** `security@szlholdings.com`

**Scope:**
- Security vulnerability disclosures
- Suspected data breaches
- Privacy requests (data access, deletion)
- Trust Center questions

**Response time:** Within 24 hours for acknowledgment; severity-based thereafter

**Handler:** Stephen Lutar + designated security contact

See [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) for security incident procedures.

---

## Contact Routing Matrix

| Inquiry Type | Route To | Channel |
|-------------|----------|---------|
| Enterprise inquiry, demo request | inquiries@szlholdings.com | Email |
| Investment conversations | stephen@szlholdings.com | Email |
| Security disclosures | security@szlholdings.com | Email |
| Design partner issues | Direct Slack or email | Per partner |
| Carlota Jo clients | Via client portal | Portal |
| Press / media | inquiries@szlholdings.com | Email |
| General contact | /contact form | Web form |

---

## Out-of-Scope (Current Phase)

The following are not currently offered:
- 24/7 on-call support (not offered until enterprise contracts active)
- Phone support
- SLA guarantees (covered under design partner agreements individually)
- Automated ticketing system (planned for Phase 2)

---

## Future Support Architecture (Phase 2+)

When the platform reaches paid production customers:
1. **Helpdesk ticketing** (Linear or Zendesk integration)
2. **SLA tiers** defined per contract
3. **Dedicated customer success** for enterprise accounts
4. **Status page with incident history** for transparency
5. **Self-service onboarding** documentation

---

## Escalation Path

```
User Reports Issue
       │
       ▼
Tier 0 (Self-service) ──► Resolved? Yes ──► Done
       │ No
       ▼
Tier 1 (Email inquiry)
       │
       ▼
Is it a pilot/design partner? ──► Yes ──► Tier 2 (Direct)
       │ No
       ▼
Is it security-related? ──► Yes ──► Tier 4 (Security)
       │ No
       ▼
Resolve at Tier 1 or escalate to Stephen
```

---

## Response Time Commitments

| Severity | Channel | Acknowledgment | Resolution Target |
|----------|---------|----------------|------------------|
| Security incident (SEV1) | security@szlholdings.com | < 2 hours | See INCIDENT_SEVERITY_MATRIX |
| Design partner issue | Direct | Same day | 24 hours |
| General inquiry | Contact form | 1–2 business days | 3–5 business days |
| Feature request | Contact form | 1 week | Roadmap review |
