# Support Operations — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Internal team, design partners, enterprise buyers evaluating operational readiness
**Supersedes:** [SUPPORT_MODEL.md](SUPPORT_MODEL.md)
**Companion docs:** [SEVERITY_MODEL.md](SEVERITY_MODEL.md) · [INCIDENT_COMMAND_PLAYBOOK.md](INCIDENT_COMMAND_PLAYBOOK.md) · [CUSTOMER_ESCALATION_MATRIX.md](CUSTOMER_ESCALATION_MATRIX.md)

---

## Current Phase

SZL Holdings is in **design partner / alpha phase** as of April 2026. Support is handled directly by the founding team. This document defines both current-state operations and the target model for GA production customers. Sections marked **[GA]** describe the target state.

---

## Support Channels

| Channel | Purpose | Audience | Hours |
|---------|---------|----------|-------|
| `support@szlholdings.com` | General product support, access issues, billing, privacy rights requests (GDPR/CCPA) | All customers | Business hours (9am–6pm ET) |
| `security@szlholdings.com` | Security disclosures, suspected breaches | All | 24/7 monitored |
| `/contact` web form | Sales inquiries, demo requests, partnership | Prospects | Business hours |
| Dedicated Slack channel | Design partner operational support | Design partners only | Business hours (dedicated) |
| Client portal | Carlota Jo client support | CJ clients only | Business hours |

---

## Support Tiers

### Tier 0 — Self-Service

Users resolve issues independently using:
- Product documentation at `/docs/*`
- Trust Center at `/trust-center`
- Status page: `/status` [Planned — pre-GA]
- In-app FAQ and tooltips

No response time commitment. No ticket generated.

---

### Tier 1 — General Inquiries

**Intake:** `/contact` web form → `inquiries@szlholdings.com`

**Scope:**
- General product questions
- Demo and pilot requests
- Partnership and press inquiries
- Pricing and packaging questions

**Response time commitment:**
| Metric | Target |
|--------|--------|
| Acknowledgment | 1 business day |
| Full response | 2–3 business days |

**Handler:** Founding team (current phase)  
**Ownership:** Whoever receives the email; escalate to Stephen for sales/investor inquiries

---

### Tier 2 — Design Partner & Pilot Support

**Intake:** Dedicated Slack channel or direct email per design partner agreement

**Scope:**
- Platform configuration questions
- Workflow and demo data setup
- Bug reports and unexpected behavior
- Feature feedback and roadmap input
- Integration guidance

**Response time commitment:**
| Metric | Target |
|--------|--------|
| Acknowledgment | Same business day |
| First response | 4 business hours |
| Resolution or workaround | Next business day |
| Critical blocker | 2 business hours |

**Handler:** Stephen Lutar during alpha phase  
**Escalation path:** See [CUSTOMER_ESCALATION_MATRIX.md](CUSTOMER_ESCALATION_MATRIX.md)

---

### Tier 3 — Carlota Jo Client Support

**Intake:** Client portal contact form or direct email

**Scope:**
- Account access issues
- Service delivery questions
- Document requests
- Intake process questions

**Response time commitment:**
| Metric | Target |
|--------|--------|
| Acknowledgment | 4 business hours |
| Resolution | Next business day |

**Handler:** Carlota Jo advisory team; escalate access issues to platform engineering

---

### Tier 4 — Security and Trust

**Intake:** `security@szlholdings.com` only (not the general contact form)

**Scope:**
- Security vulnerability disclosures
- Suspected data breaches or unauthorized access
- Trust Center documentation questions
- Compliance audit support

**Response time commitment:**
| Metric | Target |
|--------|--------|
| Acknowledgment | 48 hours (24 hours for critical) |
| Severity classification | 5 business days |

**Handler:** Stephen Lutar + designated security contact  
**Escalation:** See [INCIDENT_COMMAND_PLAYBOOK.md](INCIDENT_COMMAND_PLAYBOOK.md) for breach response

> **Privacy rights requests (GDPR/CCPA):** Data subject rights requests (access, deletion, portability, rectification) are routed to **support@szlholdings.com** with subject line `[PRIVACY] Request Type`. If a privacy request involves a suspected breach, also copy security@szlholdings.com. See [PRIVACY_OVERVIEW.md](PRIVACY_OVERVIEW.md) for full rights and response times.

---

## Triage Workflow

All inbound support requests follow this triage path:

```
Inbound Request
       │
       ▼
Is this a security incident or breach?
  Yes → Route to security@szlholdings.com → Tier 4 → INCIDENT_COMMAND_PLAYBOOK.md
       │ No
       ▼
Is this a Carlota Jo client?
  Yes → Client portal / CJ team → Tier 3
       │ No
       ▼
Is this a design partner / pilot customer?
  Yes → Dedicated Slack / direct email → Tier 2
       │ No
       ▼
Is this a product question, sales inquiry, or general contact?
  Yes → /contact form or email → Tier 1
       │ No
       ▼
Unclear → Route to support@szlholdings.com for manual classification
```

---

## Severity Classification for Support Issues

Support issues are classified on receipt. Severity drives priority and escalation.

| Severity | Description | Examples | Response Target |
|----------|-------------|----------|----------------|
| **Critical** | Production blocker; customer cannot access platform | Auth broken, all routes 500-ing, data loss suspected | 2 business hours |
| **High** | Major feature broken; significant workflow impact | Key dashboard failing, document generation broken | 4 business hours |
| **Medium** | Partial functionality issue; workaround exists | Non-critical page broken, minor data discrepancy | Next business day |
| **Low** | Cosmetic, informational, or non-urgent | Copy error, UI misalignment, documentation question | 3–5 business days |

For platform incidents (not customer-specific issues), see [SEVERITY_MODEL.md](SEVERITY_MODEL.md) and [INCIDENT_COMMAND_PLAYBOOK.md](INCIDENT_COMMAND_PLAYBOOK.md).

---

## Escalation Path

```
Customer reports issue (any channel)
       │
       ▼
Support team triage (classify severity)
       │
Critical/High ──────────────────────────────────────────┐
       │                                                  │
       ▼                                                  ▼
Engineering review                              Is it a platform incident?
       │                                          Yes → INCIDENT_COMMAND_PLAYBOOK.md
       │                                                  │
       ▼                                                  ▼
Customer-specific issue?                        Incident Commander declared
  Yes → Assign engineer, set resolution target            │
       │                                                  ▼
       ▼                                        Resolve per incident playbook
Platform-wide issue? → Declare incident                   │
                       INCIDENT_COMMAND_PLAYBOOK.md       ▼
                                               Customer update within SLA
```

---

## Support Handoff Procedure

When the primary support contact is unavailable or a request requires a different owner:

1. Log the issue in the internal tracking system with: customer name, severity, summary, current status, next action needed
2. Notify the handoff recipient with all context before going offline
3. For Critical/High issues: verbal (Slack/call) handoff required, not just email
4. For active incidents: see [SUPPORT_HANDOFF_GUIDE.md](SUPPORT_HANDOFF_GUIDE.md)

---

## Response Templates

### Acknowledgment (within SLA)

```
Subject: Re: [Your Subject] — SZL Holdings Support

Hi [Name],

Thank you for reaching out. We have received your request and are reviewing it now.

[If critical/high:] A member of our team will follow up within [X hours].
[If medium/low:] We will respond with a full resolution or update by [date].

Reference: [internal ticket ID if available]

Best,
[Name]
SZL Holdings Support
```

### Resolution Notice

```
Subject: Re: [Original Subject] — Resolved

Hi [Name],

We have resolved the issue you reported. Here is a summary:

Issue: [Brief description]
Resolution: [What was fixed or how to proceed]
Effective: [Date/time]

If you experience any further issues, please reply to this email or contact support@szlholdings.com.

Best,
[Name]
SZL Holdings Support
```

---

## Out of Scope (Current Phase)

The following are not currently offered and will be added in Phase 2+:

- 24/7 on-call support (requires on-call rotation)
- Phone support
- Contractual SLA guarantees (negotiated per enterprise contract)
- Automated ticketing system integration
- Self-service password reset portal

---

## GA Target Model [GA]

When the platform reaches paid production customers:

1. **Ticketing system:** Linear or Zendesk integration for tracking and reporting
2. **SLA tiers:** Defined per contract (Starter, Professional, Enterprise)
3. **Customer success:** Dedicated CSM for Enterprise accounts
4. **Status page:** Public incident history and real-time status
5. **Help center:** Self-service knowledge base
6. **On-call rotation:** PagerDuty or equivalent for SEV1 coverage

---

*Support Operations last reviewed: **2026-04-16** · Next review: **2026-07-01***
