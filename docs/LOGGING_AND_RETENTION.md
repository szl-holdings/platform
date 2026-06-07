# Logging and Retention — SZL Holdings Platform

> What the SZL Holdings platform logs, how long logs are retained, and how they are protected.

---

## Log Categories

### Application Logs

**What is logged:**
- HTTP request logs (method, path, status code, response time) — no request body
- API errors and exceptions (stack traces, error codes)
- Authentication events (login, logout, failed attempts)
- Workflow execution events (start, complete, fail, approval actions)
- Database migration events

**What is NOT logged:**
- Request bodies containing user data
- Passwords, tokens, or secrets
- Full database query results containing PII
- Session tokens or cookie values

---

### Audit Trail

The audit trail is a separate, immutable append-only log stored in the database (`audit_events` table).

**What is audited:**
- All state-changing actions (create, update, delete)
- All approval and rejection decisions in Alloy
- All AI agent recommendations and human responses
- Admin panel actions
- User provisioning and role changes
- Access to the investor data room
- Any action involving financial or sensitive data

**Format:** JSON with mandatory fields: `event_id`, `timestamp`, `actor_user_id`, `actor_org_id`, `action_type`, `resource_type`, `resource_id`, `metadata`, `ip_address_hash`

**Immutability:** Audit events cannot be modified or deleted through the application. Database-level triggers prevent updates to the audit table.

---

### Security Logs

**What is logged:**
- Failed authentication attempts (with attempt count, user agent)
- CSRF validation failures
- Rate limit violations
- Unauthorized access attempts (403 responses)
- Admin PIN failures
- Any detected injection or attack patterns

**Retention:** Security logs are retained for 1 year.

---

## Log Retention Schedule

| Log Type | Retention Period | Storage |
|----------|-----------------|---------|
| Application logs (HTTP, errors) | 90 days | Azure Monitor / Application Insights |
| Audit trail | Permanent | PostgreSQL (`audit_events` table) |
| Security logs | 1 year | Azure Monitor |
| Database query logs | 30 days (dev), 90 days (prod) | Azure PostgreSQL |
| Session logs | Until session expiry + 7 days | Redis / PostgreSQL |
| Deployment logs | 90 days | Azure DevOps / deployment service |

---

## Log Access Control

| Role | Application Logs | Audit Trail | Security Logs |
|------|-----------------|-------------|---------------|
| `super_admin` | Full access | Full access | Full access |
| `compliance_officer` | Read-only | Full access | Read-only |
| `auditor` | No access | Read-only | No access |
| `operator` | No access | Own actions only | No access |
| All others | No access | Own actions only | No access |

Production log access requires:
1. Azure RBAC permission on the Log Analytics Workspace
2. Authentication via Azure AD
3. All log access is itself logged

---

## Data Privacy in Logs

The platform applies the following privacy protections to logs:

1. **IP Address Hashing:** Raw IP addresses are hashed before storage in the audit trail. The hash is deterministic (for correlation) but not reversible.
2. **User ID Only:** Users are identified by internal ID, never by name or email in logs.
3. **Content Redaction:** Any log field containing user-provided content is either excluded or redacted.
4. **PII Scanning:** Log pipelines include PII detection; any inadvertent PII triggers an alert for review.

---

## Log Format

Application logs use structured JSON:
```json
{
  "timestamp": "2026-04-03T12:00:00Z",
  "level": "info",
  "service": "api-server",
  "method": "POST",
  "path": "/api/cms/articles",
  "status": 201,
  "duration_ms": 45,
  "org_id": "org_xxx",
  "user_id": "usr_xxx",
  "request_id": "req_xxx"
}
```

---

## Monitoring and Alerting

Azure Application Insights alerts are configured for:
- Error rate > 1% of requests (over 5-minute window)
- P95 response time > 2000ms
- Failed health checks
- Unusual authentication failure spike (> 10 per minute)
- Database connection failures

---

## Compliance

This logging and retention policy supports:
- SOC 2 Type II (CC7.2: Monitoring of system components)
- GDPR (Article 30: Records of processing activities)
- ISO 27001 (A.12.4: Logging and monitoring)

---

*Last updated: 2026-04-03*
