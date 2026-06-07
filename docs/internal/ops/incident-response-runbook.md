# Incident Response Runbook

**Owner:** Engineering (Founder)  
**Last updated:** April 2026  
**Version:** 1.0

---

## Purpose

This runbook defines how the SZL Holdings team detects, classifies, responds to, and learns from operational incidents. It applies to all production systems: API server, Lyte, Aegis, Terra, Vessels, Carlota Jo, and associated mobile apps.

---

## Severity Model

### SEV-1 — Critical (Platform-wide impact)

**Definition:** Full platform outage, data exposure, active security breach, or complete loss of primary revenue path.

**Examples:**
- API server unresponsive for >5 minutes
- Database unreachable (all reads/writes failing)
- Authentication provider down (no users can log in)
- Evidence of unauthorized data access or credential exposure
- Payment processing completely broken

**Response SLA:**
- Acknowledge: within 15 minutes
- Mitigation in progress: within 30 minutes
- External communication (if customers affected): within 1 hour
- Resolution or rollback: within 4 hours

**Escalation:** Immediate founder notification via primary contact (SMS + phone). All hands.

---

### SEV-2 — High (Significant degradation)

**Definition:** Critical feature broken for a subset of users, significant latency degradation (p95 >3s), a major integration failing, or elevated error rates (>5% over 10 minutes).

**Examples:**
- AI provider (OpenAI/Anthropic) returning errors for >15 minutes
- WebSocket connections failing to reconnect
- Payment webhook processing delayed >30 minutes
- Background job queue backing up significantly (>100 pending)
- Specific vertical (Aegis, Terra, Vessels) fully degraded while others operate

**Response SLA:**
- Acknowledge: within 30 minutes
- Mitigation in progress: within 2 hours
- Resolution: within 8 hours business hours

**Escalation:** Founder notified via Slack and email within 30 minutes if not self-resolved.

---

### SEV-3 — Medium (Minor degradation)

**Definition:** Non-critical feature unavailable, minor performance degradation, or non-urgent integration issues.

**Examples:**
- Export PDF generation failing
- Non-critical scheduled job missing a run
- Specific dashboard chart error for a subset of users
- Low error rate spike (1–5% over short window)

**Response SLA:**
- Acknowledge: same business day
- Resolution: within 2 business days

**Escalation:** Tracked in internal backlog. Founder informed at next daily standup.

---

### SEV-4 — Low (Cosmetic / informational)

**Definition:** Minor UI bugs, performance observations without user impact, non-urgent warnings.

**Response SLA:**
- Tracked in backlog
- Addressed in next maintenance cycle

**Escalation:** None required. Tracked as a backlog item.

---

## Detection Sources

| Source | What it monitors | Alert destination |
|--------|-----------------|-------------------|
| `/api/health/detailed` | Database, job queue, telemetry | Internal monitoring |
| Self-monitor (`lib/self-monitor.ts`) | API health poll, memory, error rate | Slack webhook (if configured) |
| Provider health probes (`lib/provider-health.ts`) | OpenAI, Anthropic, Stripe reachability | Slack + internal logs |
| Structured logs (Pino) | All API errors, auth failures, 5xx responses | Log aggregator / console |
| WebSocket stale-session cleanup | Dead WS connections | Internal log |
| Job queue stats | Backpressure, failed jobs | `/api/health/detailed` |
| OpenTelemetry | Traces, latency p95, error spans | OTLP endpoint (if configured) |

---

## Response Procedure

### 1. Detect & Declare

1. Review alert or anomaly from detection source
2. Classify severity using the model above
3. Open an incident channel (Slack `#incidents` or direct thread)
4. Assign an Incident Commander (IC) — default: founder

### 2. Investigate

1. Check `/api/health/detailed` with internal token
2. Review Pino structured logs for error context
3. Check provider health: OpenAI, Anthropic, Stripe, database
4. Review recent deployments — was anything released in the last 4 hours?
5. Correlate with job queue stats

### 3. Contain

1. If database: verify connection pool, restart if needed
2. If AI provider: check provider status page, enable fallback models if configured
3. If auth: verify OIDC provider reachability, check session store
4. If job queue backpressure: throttle ingestion, drain queue
5. If security event: rotate credentials immediately, revoke affected sessions

### 4. Mitigate or Rollback

- **Rollback:** Revert to previous deployment via Replit deployment dashboard
- **Feature flag disable:** Use `/api/admin/feature-flags` to disable a broken feature
- **Emergency restart:** Restart affected workflow via Replit Workflows

### 5. Communicate

**Internal (all SEV-1 and SEV-2):**
- Update Slack `#incidents` with status every 30 minutes during active incident
- Founder receives direct notification

**External (SEV-1 affecting customers):**
- Template: "We are aware of an issue affecting [feature]. Our team is actively working on a resolution. We will update you by [time]."

### 6. Post-Incident Review

Required for all SEV-1 and SEV-2 incidents. Due within 5 business days of resolution.

**PIR must include:**
- Timeline of detection, response, and resolution
- Root cause (5 Whys)
- What went well
- What could be improved
- Action items with owners and due dates

---

## Escalation Contacts

| Role | Contact Method | Availability |
|------|---------------|-------------|
| Founder (Stephen Lutar) | SMS + phone (primary) | 24/7 for SEV-1 |
| Founder | Slack DM | Business hours + on-call |
| Engineering support | Email: engineering@szlholdings.com | Business hours |
| Security issues | Email: security@szlholdings.com | 48-hour SLA |

---

## On-Call Procedures

- Current on-call: Stephen Lutar (founder-led operations)
- On-call rotation will be established when the engineering team scales beyond 3 engineers
- Weekend coverage: Founder monitors Slack alerts; SEV-1 alerts via SMS
- On-call engineer is expected to acknowledge within 15 minutes for SEV-1 and within 30 minutes for SEV-2

---

## Known Alert Categories and Response

| Alert | Category | Response |
|-------|----------|----------|
| `high_error_rate` (>5%) | SEV-1 or SEV-2 | Check logs, recent deploy, rollback if needed |
| `high_latency` (p95 >2s) | SEV-2 | Check DB pool, slow query log, AI provider latency |
| `ai_provider_failure` | SEV-2 | Check provider status page, switch model if possible |
| `payment_webhook_failure` | SEV-2 | Check Stripe dashboard, replay webhook |
| `websocket_unhealthy` | SEV-2 or SEV-3 | Restart WS server, check client reconnect logic |
| `job_queue_backpressure` | SEV-2 or SEV-3 | Throttle producers, monitor drain rate |
| `auth_failure_spike` | SEV-2 | Check OIDC provider, review logs for credential stuffing |
| `db_unreachable` | SEV-1 | Check DB connection, credentials, restart pool |

---

*See also: [Support Runbook](support-runbook.md) · [Deployment Matrix](../../releases/deployment-matrix.md) · [Security Posture](../../trust/security-posture.md)*
