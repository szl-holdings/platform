# Incident Response — SZL Holdings Platform

> Structured procedures for detecting, responding to, and resolving incidents affecting the SZL Holdings platform.

---

## Incident Definition

An **incident** is any unplanned event that causes or risks:
- Customer-facing service degradation or outage
- Data integrity or confidentiality breach
- Security vulnerability or unauthorized access
- Significant performance degradation (>50% slower than baseline)
- Failed deployment causing rollback

---

## Severity Levels

See [INCIDENT_SEVERITY_MATRIX.md](incident-severity.md) for full definitions.

| Severity | Description | Response Time | Example |
|----------|-------------|---------------|---------|
| SEV1 | Complete outage, data breach | Immediate (< 15 min) | Site down, auth broken |
| SEV2 | Major feature broken, significant degradation | < 1 hour | Key routes 500-ing |
| SEV3 | Minor feature broken, partial degradation | < 4 hours | Non-critical page broken |
| SEV4 | Cosmetic, low-impact issue | Next business day | Layout bug on one page |

---

## Incident Response Workflow

### Phase 1: Detection & Triage (0–15 min)

1. **Detect** — Via monitoring alert, user report, or manual observation
2. **Confirm** — Reproduce the issue. Determine: is this an incident?
3. **Classify** — Assign initial severity (SEV1–SEV4)
4. **Declare** — For SEV1/SEV2: notify the team immediately
5. **Assign** — Designate an Incident Commander (IC) who owns the response

**Detection sources:**
- Azure Application Insights alerts
- Uptime monitor alerts
- User contact form submissions
- Direct Slack/email reports
- Manual discovery during routine checks

---

### Phase 2: Containment (15 min – 2 hours)

For SEV1/SEV2:

1. **Stop the bleeding** — Is rollback the fastest path to stability?
   - If yes: execute [RUNBOOK_ROLLBACK.md](rollback-playbook.md) immediately
   - If no: proceed with targeted fix
2. **Communicate** — Update status page if user-facing impact
3. **Isolate scope** — Is this all users, a specific org, or a specific route?
4. **Preserve evidence** — Capture logs, error states before making changes

**Rollback decision criteria:**
- If a deployment happened in the last 2 hours → rollback first, investigate second
- If data integrity is at risk → rollback immediately
- If fix would take > 1 hour → rollback and fix on next release cycle

---

### Phase 3: Resolution

1. Apply the fix (hotfix or rollback)
2. Verify the fix resolves the issue
3. Deploy to production using [RUNBOOK_DEPLOYMENT.md](../../infra/runbooks/RUNBOOK_DEPLOYMENT.md)
4. Monitor for 30 minutes after resolution
5. Confirm no regression in affected areas

---

### Phase 4: Communication

**During incident (SEV1/SEV2):**
- Update status page every 30 minutes
- Notify affected users/customers as appropriate
- Keep internal team informed via Slack

**After resolution:**
- Update status page to "Resolved"
- Send resolution notification to affected parties (if applicable)
- Record incident end time

---

### Phase 5: Post-Mortem

For all SEV1 and SEV2 incidents:

1. **Schedule** — Post-mortem within 48 hours of resolution
2. **Document** — Use the post-mortem template below
3. **Root cause** — Identify the root cause, not just the symptom
4. **Action items** — Define concrete, assigned, time-bound improvements
5. **Share** — File in `docs/internal/` and share with relevant team members

**Post-mortem template:**
```
## Incident Summary
- Date/Time: 
- Duration: 
- Severity: 
- Affected services: 
- Impact: (users affected, data affected, revenue impact)

## Timeline
- HH:MM — Event description
- HH:MM — Detection
- HH:MM — Response began
- HH:MM — Resolved

## Root Cause
Description of root cause.

## Contributing Factors
- Factor 1
- Factor 2

## What Went Well
- 

## What Could Be Improved
- 

## Action Items
| Action | Owner | Due Date |
|--------|-------|----------|
| | | |
```

---

## Communication Templates

### Status Page Update (Active Incident)

```
[YYYY-MM-DD HH:MM UTC] Investigating reports of [issue description]. Our team is actively investigating. Updates will follow every 30 minutes.
```

### Status Page Update (Resolution)

```
[YYYY-MM-DD HH:MM UTC] This incident has been resolved. [Brief description of fix]. All services are operating normally. A post-mortem will be published within 48 hours.
```

### User-Facing Email (If Applicable)

```
Subject: Service Disruption on [Date] — [Brief Description]

We experienced a disruption to [service name] on [date] from [start time] to [end time] UTC.

Impact: [what was affected]

Resolution: [what we did to fix it]

We apologize for any inconvenience. If you have questions, please contact support@szlholdings.com.

Stephen Lutar
Founder & CEO, SZL Holdings
```

---

## Security Incidents

If the incident involves a potential security breach, unauthorized access, or data exposure:

1. **Immediately notify** stephen@szlholdings.com
2. **Preserve all logs** — do not delete or overwrite anything
3. **Do not patch without legal review** — contact counsel first
4. **Follow** [docs/ACCESS_CONTROL.md](../ACCESS_CONTROL.md) and [docs/SECRETS_POLICY.md](../SECRETS_POLICY.md)
5. **Rotate credentials** if any exposure is confirmed — see [RUNBOOK_SECRETS.md](../../infra/runbooks/RUNBOOK_SECRETS.md)
6. **Notify affected parties** per applicable privacy regulations (GDPR, CCPA)

Security disclosures: [security@szlholdings.com](mailto:security@szlholdings.com)

---

## Contacts

| Role | Contact | When to Engage |
|------|---------|---------------|
| Founder / CEO | stephen@szlholdings.com | All SEV1, critical security |
| Engineering Lead | (designate) | All SEV1/SEV2 |
| Security Contact | security@szlholdings.com | All security incidents |
| Azure Support | Azure portal support ticket | Infrastructure failures |

---

## Related Documents

- [INCIDENT_SEVERITY_MATRIX.md](incident-severity.md)
- [RUNBOOK_DEPLOYMENT.md](../../infra/runbooks/RUNBOOK_DEPLOYMENT.md)
- [RUNBOOK_ROLLBACK.md](rollback-playbook.md)
- [RUNBOOK_SECRETS.md](../../infra/runbooks/RUNBOOK_SECRETS.md)
- [SUPPORT_OPERATIONS.md](../sales/support-operations.md)
- [BACKUP-RESTORE.md](backup-restore.md)
