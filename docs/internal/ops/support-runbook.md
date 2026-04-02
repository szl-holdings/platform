# Support Routing & On-Call Runbook

**Owner:** Operations (Founder)  
**Last updated:** April 2026  
**Version:** 1.0

---

## Support Channels and Routing

### Inbound Channels

| Channel | Audience | Routing |
|---------|----------|---------|
| inquiries@szlholdings.com | Investor, buyer, and partner inquiries | Founder (Stephen Lutar) |
| security@szlholdings.com | Vulnerability disclosures | Security response process (see SECURITY.md) |
| engineering@szlholdings.com | Technical integration questions | Engineering team |
| Lyte in-app feedback | Lyte users | Admin panel → Feedback queue |
| Demo request forms | Prospects | Founder review within 24 hours |
| Carlota Jo client portal | Carlota Jo clients | Dedicated client manager |

---

## Support Tiers

### Tier 1 — Self-Service

Users are directed to self-service resources before human escalation:
- API documentation at `/api/docs`
- Platform documentation in `docs/`
- Admin diagnostics page (`/admin/diagnostics`)
- FAQ and in-app help content

### Tier 2 — Operational Support

Operational issues raised by internal users or demo operators:
- Handled by the founder or designated operator
- Target response: same business day
- Resolution: within 2 business days for non-critical issues

### Tier 3 — Enterprise/Client Support

Issues from contracted clients (Carlota Jo engagements, enterprise pilots):
- Handled with priority: acknowledged within 4 hours business hours
- Escalated to founder if not resolved within 1 business day
- SLA defined per engagement contract

---

## Support Request Classification

| Type | Priority | Assignee | SLA |
|------|----------|----------|-----|
| Platform outage (user-reported) | P1 — Critical | Founder | 30-min response |
| Cannot log in | P1 — Critical | Founder | 30-min response |
| Data appears incorrect | P2 — High | Founder/Engineering | Same business day |
| Feature not working as expected | P2 — High | Engineering | 1 business day |
| UI/UX confusion or bug | P3 — Medium | Engineering | 3 business days |
| Feature request | P4 — Low | Backlog | Next planning cycle |
| General inquiry | P4 — Low | Founder | 2 business days |
| Billing question | P2 — High | Founder | Same business day |

---

## Escalation Path

```
User / Client
     │
     ▼
Self-service resources (docs, in-app help)
     │ (unresolved)
     ▼
Tier 2: Operational support (email / in-app feedback)
     │ (P1 or unresolved P2)
     ▼
Founder (direct contact)
     │ (technical / security incident)
     ▼
Incident Response Runbook (see incident-response-runbook.md)
```

---

## On-Call Procedures

### Current Setup

- On-call responsibility: Stephen Lutar (founder-led)
- Primary channel: Slack `#alerts` (connected to self-monitor webhook)
- SMS escalation: Configured for SEV-1 alerts via notification service
- On-call schedule: 7 days/week for critical alerts; business hours for lower-severity support

### On-Call Responsibilities

1. Monitor `#alerts` Slack channel during business hours
2. Acknowledge SEV-1 alerts within 15 minutes (24/7)
3. Acknowledge SEV-2 alerts within 30 minutes during business hours; 2 hours overnight
4. Review and triage support inbox daily
5. Ensure demo environments remain healthy before customer calls

### Handoff Checklist (when on-call changes)

- [ ] Review any open incidents or pending investigations
- [ ] Confirm alert routing is working (test Slack webhook)
- [ ] Confirm access to `/api/health/detailed` endpoint
- [ ] Confirm DB admin access
- [ ] Review any recent deployments with known risk

---

## Common Support Scenarios

### User cannot log in

1. Check OIDC provider status (Replit Auth)
2. Verify user exists in `users` table via admin panel
3. Check `sessions` table for stale or conflicting sessions
4. If role issue: verify `user_roles` assignments
5. Resolution: clear session, reassign role, or contact OIDC provider

### Data appears stale or missing

1. Check job queue status (`/api/health/detailed`)
2. Review last successful ingestion job for affected domain
3. Check domain-specific seed or ingestion logs
4. If database issue: verify DB connection and query health

### Demo environment not responding

1. Check Replit workflow status for affected artifact
2. Restart affected workflow
3. Verify API server is healthy: `/api/health/live`
4. If persistent: check for build errors in workflow logs

### Client reporting incorrect billing

1. Review Stripe dashboard for subscription and invoice status
2. Check `subscriptions` and `invoices` tables via admin panel
3. Manually reconcile if needed, escalate to founder for resolution
4. Document resolution in audit log

---

## Communication Templates

### Initial acknowledgement (Tier 2/3)

> Thank you for reaching out. We've received your message and are reviewing it. We'll follow up within [SLA timeframe].

### Status update during active issue

> We're aware of the issue with [feature/platform]. Our team is actively working on a resolution. Current status: [investigating / mitigation in progress / resolved]. We'll provide another update by [time].

### Resolution confirmation

> The issue with [feature/platform] has been resolved as of [timestamp]. Root cause: [brief description]. We've implemented [mitigation/fix]. Please let us know if you continue to experience any issues.

---

*See also: [Incident Response Runbook](incident-response-runbook.md) · [SECURITY.md](../../../SECURITY.md)*
