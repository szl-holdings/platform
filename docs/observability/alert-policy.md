# Alert Policy — SZL Holdings Platform

**Version:** 1.0
**Date:** April 16, 2026

This document defines when alerts fire, who gets paged, and what to do. Alert thresholds derive from the `golden-signals.md` SLOs. Severity maps to the `FAILURE_SEVERITY_POLICY.md` levels.

---

## Alert Design Principles

1. **Alerts page for symptoms, not causes** — alert on user impact (error rate, latency), not internal signals (CPU) alone
2. **Alert on SLO burn rate** — detect fast and slow burns separately
3. **No alert without a runbook** — every alert references a documented response procedure
4. **Silence is not health** — absence of metrics is itself alertable
5. **Sev 0 alerts are never silenced** — even during maintenance windows

---

## 1. Sev 0 Alerts (Page Immediately)

These alerts require immediate response regardless of time of day.

### CRIT-001: Auth System Failure

**Condition:** Auth failure rate > 10% over 5 minutes OR login endpoint returns 5xx
**Signal:** `http_requests_total{route="/api/auth/*", status_code=~"5.."}` rate > 10%
**Impact:** Users cannot log in; potential security breach
**Response:**
1. Check `/api/health/ready` — confirm auth service status
2. Check `SESSION_SECRET` env var is present
3. Review auth middleware logs for exceptions
4. Roll back if recent deployment
5. Escalate to CTO if not resolved within 30 minutes

---

### CRIT-002: API Server Down

**Condition:** `/api/health` returns non-200 OR no successful requests for 3 minutes
**Signal:** `http_requests_total{status_code="200", route="/api/health"}` = 0 for 3 min
**Impact:** All platform surfaces unavailable
**Response:**
1. Check workflow/process status
2. Review startup logs for exceptions
3. Verify database connectivity
4. Restart API server if healthy — no uncaught exceptions
5. Page on-call engineer immediately

---

### CRIT-003: Database Connection Lost

**Condition:** DB error rate > 5% for 2 minutes
**Signal:** `db_errors_total` rate > 5% of `db_queries_total`
**Impact:** All data operations fail; auth may fail
**Response:**
1. Check database service status
2. Verify `DATABASE_URL` is correct
3. Check connection pool saturation (`db_connections_active` gauge)
4. Check for long-running queries blocking pool
5. Consider connection pool restart

---

### CRIT-004: Tenant Data Cross-Contamination

**Condition:** Any log entry or metric containing `tenant_isolation_violation`
**Signal:** Log alert on `level=error AND message=*tenant_isolation*`
**Impact:** Data leak between organizations — critical privacy/security violation
**Response:**
1. Immediately suspend affected tenant sessions
2. Engage CTO and legal counsel
3. Preserve all logs for forensic analysis
4. Do not restart or modify system until forensics complete

---

## 2. Sev 1 Alerts (Respond Within 2 Hours)

### WARN-001: High 5xx Error Rate

**Condition:** 5xx rate > 1% over 5 minutes
**Signal:** `http_requests_total{status_code=~"5.."}` / `http_requests_total` > 0.01
**Response:** Identify failing routes, check logs, assess impact scope

---

### WARN-002: API Latency Degradation

**Condition:** p95 latency > 1 second over 5 minutes for authenticated routes
**Signal:** `http_request_duration_seconds{quantile="0.95"}` > 1.0
**Response:** Profile slow routes, check DB query latency, check AI inference queue

---

### WARN-003: AI Inference Failure Spike

**Condition:** AI inference error rate > 10% over 5 minutes
**Signal:** `ai_errors_total` / `ai_inference_total` > 0.10
**Response:** Check provider API status, verify API key, check rate limit headers

---

### WARN-004: DB Connection Pool Near Saturation

**Condition:** Active DB connections > 80% of pool max for 5 minutes
**Signal:** `db_connections_active` / `db_pool_max` > 0.80
**Response:** Identify long-running queries, check for missing query timeouts

---

### WARN-005: Health Endpoint Optimism Mismatch

**Condition:** `/api/health/ready` returns `ok` but DB check shows degraded state
**Signal:** Custom composite check (monitored by smoke-product-mode)
**Response:** This is a Sev 1 by policy — health endpoints must reflect real state

---

### WARN-006: Backup Age Exceeded

**Condition:** Last database backup older than 25 hours
**Signal:** `backup_age_hours` > 25 (reported by `/api/healthz` backup field)
**Response:** Trigger manual backup, investigate scheduled backup failure

---

## 3. Sev 2 Alerts (Fix This Sprint)

### INFO-001: AI Token Budget Warning

**Condition:** Monthly AI token consumption > 70% of budget
**Signal:** `ai_tokens_total` sum > 70% of configured budget
**Response:** Review high-consumption workflows, optimize prompts

---

### INFO-002: Disk Usage Warning

**Condition:** Disk utilization > 70%
**Signal:** OS-level disk metric
**Response:** Archive old logs, clear build artifacts, plan capacity upgrade

---

### INFO-003: Web Vitals Degradation

**Condition:** LCP > 4s or CLS > 0.25 for > 10% of page loads
**Signal:** `web_vitals_lcp_seconds{quantile="0.75"}` > 4.0
**Response:** Profile bundle size, check CDN caching, optimize critical render path

---

## 4. Alert Routing

| Severity | Channel | Escalation |
|----------|---------|-----------|
| Sev 0 | PagerDuty → On-call engineer → CTO | Auto-escalate if unack'd 15 min |
| Sev 1 | Slack `#incidents` + PagerDuty (low urgency) | Escalate if unresolved 2 hours |
| Sev 2 | Slack `#eng-alerts` | Sprint planning review |
| Sev 3 | Slack `#eng-alerts` (weekly digest) | Backlog only |

---

## 5. Maintenance Window Policy

During planned maintenance windows:
- **Sev 0 alerts are never silenced**
- Sev 1 alerts may be silenced for specific affected components only — require approval from engineering lead
- Sev 2/3 alerts are automatically silenced during maintenance windows
- Maximum maintenance window: 4 hours (platform-wide), 30 minutes (rolling restarts)

---

## 6. Alert Fatigue Prevention

- No alert fires more than 3 times in 30 minutes without an automatic escalation
- Alerts that fire without action for > 7 days are reviewed for removal or threshold adjustment
- `pnpm audit:series-a` output is reviewed in weekly engineering standup to catch Sev 2 drift
- All Sev 0/1 alerts include a direct link to the relevant runbook in `docs/ops-runbook.md`

---

## 7. Smoke Test Failure Alerts

If `pnpm smoke:product-mode` fails in CI or scheduled runs:

| Check | Failure Severity | Action |
|-------|----------------|--------|
| App fails to boot | Sev 0 | Block deploy immediately |
| `/api/health` returns non-200 | Sev 0 | Block deploy |
| Auth endpoint unavailable | Sev 0 | Block deploy |
| Required env var missing | Sev 0 | Block deploy |
| Demo data detected in non-demo org | Sev 1 | Block release |
| Non-critical route returns 500 | Sev 1 | Block release |
| Slow health check (> 5s) | Sev 2 | Flag in PR, do not block |
