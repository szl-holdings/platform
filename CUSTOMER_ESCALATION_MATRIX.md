# Customer Escalation Matrix — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Support team, engineering, customer success, Incident Commanders
**Companion docs:** [SUPPORT_OPERATIONS.md](SUPPORT_OPERATIONS.md) · [SEVERITY_MODEL.md](SEVERITY_MODEL.md) · [INCIDENT_COMMAND_PLAYBOOK.md](INCIDENT_COMMAND_PLAYBOOK.md)

---

## Purpose

This document defines when and how customer-reported issues escalate, who owns each stage, and how communication is handled. A clear escalation matrix prevents issues from stalling at any tier and ensures the right person is engaged at the right time.

---

## Escalation Principles

1. **Escalate early, not late.** When in doubt about whether to escalate, escalate.
2. **Severity drives urgency.** Time-to-escalate is a hard commitment, not a guideline.
3. **One owner per issue.** There is always exactly one person who owns the resolution. Escalation transfers ownership; it does not split it.
4. **Customer always hears back within SLA.** Even if the answer is "we're still investigating," the customer gets an update within the committed time.
5. **Log everything.** Every escalation step is recorded in the incident or support record.

---

## Escalation Matrix by Issue Type

### Category 1: Platform Outage or Systemic Failure

*Customer reports: site is down, authentication broken, all requests failing*

| Step | Action | Owner | Timeframe |
|------|--------|-------|-----------|
| 1 | Receive report | Support intake | Immediate |
| 2 | Verify issue is systemic (not customer-specific) | First responder | < 15 min |
| 3 | Classify as P0/P1 per [SEVERITY_MODEL.md](SEVERITY_MODEL.md) | First responder | < 15 min |
| 4 | Declare incident; assign IC | IC (Stephen or senior eng) | < 15 min from classification |
| 5 | Post initial status page update | IC | < 30 min from declaration |
| 6 | Notify affected customers directly (P0 > 30 min) | IC | < 1 hour from declaration |
| 7 | Resolve per [INCIDENT_COMMAND_PLAYBOOK.md](INCIDENT_COMMAND_PLAYBOOK.md) | IC + engineering | Per severity targets |
| 8 | Post resolution notice to customer | IC | Within 1 hour of resolution |
| 9 | Schedule post-mortem | IC | Per severity targets |

**Notify Stephen:** Immediately for P0; within 1 hour for P1.

---

### Category 2: Data Security Incident (Suspected Breach)

*Customer reports: unauthorized access to their data, suspicious activity, data they didn't expect to see*

| Step | Action | Owner | Timeframe |
|------|--------|-------|-----------|
| 1 | Receive report | Support intake | Immediate |
| 2 | Escalate immediately to security@szlholdings.com | Support intake | Immediate (< 15 min) |
| 3 | Notify Stephen | Security contact | Immediate |
| 4 | Engage legal counsel | Stephen | < 24 hours |
| 5 | Investigate and contain | IC + engineering | < 2 hours for P0 |
| 6 | Preserve all logs | Engineering | Before any changes |
| 7 | Confirm or rule out breach | IC + Stephen | As fast as possible |
| 8 | If confirmed: begin GDPR 72-hour notification clock | Stephen + legal | From confirmation |
| 9 | Notify affected customer | Stephen + legal | Per GDPR/CCPA requirements |
| 10 | Post-incident review | IC | Within 24 hours |

**Do not** attempt to resolve or patch without legal review for confirmed breaches.

---

### Category 3: Customer-Specific Access or Configuration Issue

*Customer reports: can't log in, wrong permissions, wrong data showing, feature not available*

| Step | Action | Owner | Timeframe |
|------|--------|-------|-----------|
| 1 | Receive report via support@szlholdings.com or Slack | Support | Immediate |
| 2 | Acknowledge to customer | Support | < 4 hours (business hours) |
| 3 | Reproduce issue in that customer's org context | Engineering | < 4 hours |
| 4 | Is this a code bug or a configuration issue? | Engineering | After investigation |
| 4a | Configuration issue → guide customer to fix | Support | Same day |
| 4b | Code bug → log in issue tracker, estimate fix time | Engineering | Same day |
| 5 | Communicate resolution or timeline to customer | Support | End of business day |
| 6 | If Critical (customer cannot work): escalate to High | Support → Engineering | Immediately |

**Escalate to P1** if the customer-specific issue is blocking production use for an enterprise customer.

---

### Category 4: Feature Request or Product Feedback

*Customer reports: missing feature, request for enhancement, UI suggestion*

| Step | Action | Owner | Timeframe |
|------|--------|-------|-----------|
| 1 | Receive via support or Slack | Support | Business hours |
| 2 | Acknowledge and thank the customer | Support | < 2 business days |
| 3 | Log in product backlog with customer attribution | Product/Stephen | Within 1 week |
| 4 | Determine: roadmap priority, not planned, or out of scope | Stephen | Within 2 weeks |
| 5 | Respond to customer with position | Support | Within 2 weeks |

No firm commitment to build any specific feature unless explicitly confirmed in a design partner agreement.

---

### Category 5: Billing or Commercial Issue

*Customer reports: charge dispute, invoice question, plan upgrade request*

| Step | Action | Owner | Timeframe |
|------|--------|-------|-----------|
| 1 | Receive via support@szlholdings.com | Support | Business hours |
| 2 | Acknowledge | Support | < 1 business day |
| 3 | Route to Stephen for commercial resolution | Support → Stephen | < 1 business day |
| 4 | Resolve with customer | Stephen | < 5 business days |

---

## Escalation Contacts

| Role | Contact | Used When |
|------|---------|-----------|
| Founder / CEO | stephen@szlholdings.com | All P0 incidents; security incidents; commercial escalations; P1 within 1 hour |
| Security contact | security@szlholdings.com | All security incidents or suspected breaches |
| Support intake | support@szlholdings.com | All customer support requests |
| Azure Support | Azure portal | Infrastructure failures requiring cloud provider intervention |
| Legal counsel | [designate before GA] | Confirmed breaches; GDPR/CCPA notifications; regulatory risk |

---

## SLA Reference

| Customer Type | Severity | Acknowledge | Resolution |
|--------------|----------|-------------|------------|
| Design partner | Critical (blocker) | 2 hours | Next business day or sooner |
| Design partner | High | 4 hours | 1–2 business days |
| Design partner | Medium/Low | 1 business day | 5 business days |
| Enterprise [GA] | Critical (platform) | 1 hour | 4 hours (per contract) |
| Enterprise [GA] | High | 4 hours | 8 hours (per contract) |
| General inquiry | Any | 1 business day | 3–5 business days |
| Security disclosure | Any | 48 hours | Per severity (see SECURITY.md) |

---

## Escalation Failure Modes to Avoid

| Anti-Pattern | Why It Fails |
|-------------|-------------|
| "I'll just fix it before escalating" | Creates delays and removes visibility |
| Two people both thinking the other owns it | Issue stalls; customer hears nothing |
| Escalating without context | The next person starts from scratch |
| Contacting the customer without IC approval (during incident) | Inconsistent messaging creates confusion |
| Not logging the escalation | Loss of timeline for post-mortem |

---

## Customer Communication Ownership

| Phase | Who Communicates |
|-------|-----------------|
| Initial acknowledgment | Support team member who received the issue |
| Investigation updates | IC (for incidents); Support (for support tickets) |
| Resolution notice | IC (for incidents); Support (for support tickets) |
| Post-mortem summary (if applicable) | Stephen or IC |
| Commercial follow-up | Stephen |

---

*Customer Escalation Matrix last reviewed: **2026-04-16** · Next review: **2026-07-01***
