# Runbook: Incident Response — SZL Holdings Platform

> This runbook covers detection, severity classification, containment, recovery, and post-mortem procedures for security and operational incidents.

**Last Updated:** 2026-04-03  
**Owner:** Stephen Lutar — stephen@szlholdings.com  
**Security Contact:** security@stephenl.dev

---

## 1. Incident Lifecycle

```
Detection → Triage → Containment → Eradication → Recovery → Post-Mortem
```

---

## 2. Severity Classification

| Severity | Definition | Target Containment | Examples |
|----------|------------|-------------------|---------|
| **P0 — Critical** | Active breach, data exposure, service fully down | < 1 hour | Auth bypass, DB dump, RCE, production outage |
| **P1 — High** | Significant data risk, major feature broken | < 4 hours | Privilege escalation, partial data leak, payment failure |
| **P2 — Medium** | Limited impact, no confirmed data exposure | < 24 hours | Rate limit bypass, DoS on non-critical path, XSS in admin UI |
| **P3 — Low** | Informational or cosmetic | Next sprint | Best-practice deviations, low-severity dependency CVE |

---

## 3. Detection Triggers

### Automated Alerts (configure these in your monitoring stack)

- **Auth anomaly:** > 50 failed login attempts from a single IP in 10 minutes
- **Data volume spike:** DB query returning > 10× baseline row count
- **Error rate spike:** 5xx error rate > 5% over 5-minute window
- **Dependency CVE:** `pnpm audit` reports critical/high severity finding
- **Credential pattern match:** Secret-scan fires on any git push
- **Unexpected outbound connection:** API server connects to unknown external host
- **Audit gap:** Audit log ingestion drops to zero (possible tampering)

### Manual Reports

- User reports via security@stephenl.dev
- Responsible disclosure via `/legal/security-disclosure`
- Internal team observation

---

## 4. Incident Response Procedures

### Step 1: Acknowledge (all severities)

1. Create an incident record (GitHub Issue, private repo, labeled `[INCIDENT]`)
2. Assign incident commander (stephen@szlholdings.com for P0/P1)
3. Acknowledge to reporter within **48 hours** (P0/P1: within 2 hours)
4. Set severity level
5. Start the incident timeline document

### Step 2: Triage (first 30 minutes for P0/P1)

**For P0/P1:**
- [ ] Identify affected systems and data categories
- [ ] Determine whether breach is ongoing or historical
- [ ] Check audit logs: `SELECT * FROM audit_logs WHERE created_at > NOW() - INTERVAL '24 hours' ORDER BY created_at DESC`
- [ ] Review recent deployments and config changes
- [ ] Assess whether customer data was accessed

**Questions to answer:**
1. What is the attack vector?
2. Is the attack ongoing or historical?
3. Which tenants / users are affected?
4. Was any PII or credentials exposed?
5. Is there an immediate containment action available?

### Step 3: Containment

#### Containment Playbooks by Type

**Auth Bypass / Credential Compromise:**
```bash
# Block the affected IP(s) immediately
# Then rotate affected credentials — see RUNBOOK_SECRETS.md
# Revoke all active sessions if session token was compromised
DELETE FROM sessions WHERE created_at < NOW();
```

**Active Data Exfiltration:**
1. Restrict database network access (Azure NSG rules)
2. Rotate DATABASE_URL immediately
3. Enable enhanced audit logging
4. Snapshot the database for forensics

**Compromised API Key:**
1. Revoke the key at source (Stripe, HuggingFace, Mapbox, etc.)
2. Generate new key and update Replit Secrets + Azure Key Vault
3. Review API usage logs for the compromised key
4. Follow RUNBOOK_SECRETS.md rotation procedure

**Production Outage:**
1. Check health endpoint: `GET /api/health`
2. Check application logs in Azure portal
3. If deployment-related: follow RUNBOOK_ROLLBACK.md
4. If database-related: check connection pool, run health check query

**XSS / Injection Discovered:**
1. If actively exploited: temporarily disable the affected endpoint
2. Deploy a WAF rule to block the pattern
3. Fix and redeploy within SLA window
4. Audit similar patterns across codebase

### Step 4: Eradication

- Remove the root cause (patch, rotate credential, revert deployment)
- Verify no persistence mechanisms were installed
- Audit all changes made by the attacker in audit logs
- Run dependency scan: `pnpm audit --audit-level=high`

### Step 5: Recovery

- Restore from backup if data was corrupted (see RUNBOOK_ROLLBACK.md)
- Redeploy with the fix applied
- Verify health checks pass
- Re-enable any disabled endpoints
- Monitor for recurrence for 24 hours after recovery

### Step 6: Communication

**Internal (all P0/P1):**  
- Notify stephen@szlholdings.com immediately  
- Document all actions taken with timestamps

**Customer Notification (if PII/data was exposed):**  
Subject: `[SZL Holdings] Security Notification — Action Required`

```
Dear [Customer Name],

We are writing to notify you of a security incident that may have affected 
your account on the SZL Holdings platform.

What happened: [brief, factual description]
Data affected: [specific categories — be precise, not vague]
What we did: [containment and remediation steps taken]
What you should do: [specific action items for the customer]
Timeline: [incident detected, contained, resolved — with dates]

We take the security of your data seriously. If you have questions, 
contact security@stephenl.dev.

Stephen Lutar
SZL Holdings
```

**Regulatory Notification (if required — GDPR Art. 33):**  
GDPR breach notification to supervisory authority required within **72 hours** of becoming aware of a breach involving personal data of EU residents.

---

## 5. Post-Mortem Template

**File location:** `infra/post-mortems/YYYY-MM-DD-<slug>.md`

```markdown
# Post-Mortem: [Incident Title]

**Date:** YYYY-MM-DD  
**Severity:** P0 / P1 / P2  
**Duration:** From [detected] to [resolved]  
**Author:** [name]  
**Status:** Draft / Final

## Summary

One paragraph: what happened, why it mattered, how it was resolved.

## Timeline

| Time (UTC) | Event |
|------------|-------|
| HH:MM | Incident detected (how?) |
| HH:MM | Incident commander assigned |
| HH:MM | Root cause identified |
| HH:MM | Containment applied |
| HH:MM | Recovery verified |

## Root Cause

Precise technical root cause. Avoid "human error" as a root cause — 
identify the system or process that allowed human error to have this impact.

## Impact

- Systems affected:
- Data categories potentially exposed:
- Tenants / users affected:
- Duration of impact:
- Customer-visible impact:

## What Went Well

- 
- 

## What Went Poorly

- 
- 

## Action Items

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| | | | |

## Lessons Learned

Free-form narrative of systemic improvements to prevent recurrence.
```

---

## 6. Escalation Chain

| Role | Contact | Available |
|------|---------|-----------|
| Incident Commander | stephen@szlholdings.com | 24/7 for P0 |
| Security Contact | security@stephenl.dev | Business hours + P0 |
| Azure Support | Azure portal | As needed |
| Legal / Privacy counsel | [To be designated] | Business hours |

---

## 7. Evidence Preservation

For P0/P1 incidents, preserve evidence before taking remediation actions:

```bash
# Export recent audit logs
SELECT * FROM audit_logs 
WHERE created_at > NOW() - INTERVAL '7 days' 
ORDER BY created_at ASC;

# Capture application logs
# Azure portal → App Service → Logs → Download

# Database snapshot (Azure)
az postgres flexible-server backup create \
  --resource-group $AZURE_RESOURCE_GROUP \
  --name <server-name> \
  --backup-name "incident-$(date +%Y%m%d-%H%M%S)"
```

---

*This runbook should be reviewed quarterly and updated after each P0/P1 incident.*
