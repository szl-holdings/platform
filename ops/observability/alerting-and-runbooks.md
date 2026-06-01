# Alerting Recommendations & Runbooks

Last updated: 2026-04-16

## Alert Severity Tiers

| Tier | Name | Response SLA | Channels |
|------|------|-------------|---------|
| P0 | Critical | Page immediately | Slack #szl-alerts + SMS (PagerDuty) |
| P1 | High | < 1 hour | Slack #szl-alerts |
| P2 | Medium | Next business day | Slack #szl-alerts (low-priority) |
| P3 | Low | Weekly review | Dashboard only |

---

## Alert Matrix

### P0 — Critical (Page Immediately)

| Alert Name | Condition | Runbook |
|-----------|-----------|---------|
| `api.down` | `/api/health/live` non-200 for > 2m | [RB-001](#rb-001-api-down) |
| `db.unreachable` | `/api/health/ready` non-200 for > 1m | [RB-002](#rb-002-database-unreachable) |
| `error_rate.critical` | 5xx rate > 5% for > 3m | [RB-003](#rb-003-error-rate-spike) |
| `memory.exhaustion` | Process heap > 90% of limit for > 2m | [RB-004](#rb-004-memory-pressure) |
| `deployment.regression` | Error rate jumps > 3% within 10m of deploy | [RB-005](#rb-005-deployment-regression) |

### P1 — High (Respond Within 1 Hour)

| Alert Name | Condition | Runbook |
|-----------|-----------|---------|
| `latency.high` | p95 > 1000ms for > 5m | [RB-006](#rb-006-high-latency) |
| `auth.brute_force` | > 50 failed auth in 5m from single IP | [RB-007](#rb-007-auth-brute-force) |
| `ai.provider_down` | All AI requests failing for > 5m | [RB-008](#rb-008-ai-provider-down) |
| `db.connections.high` | Connection pool > 90% of max | [RB-009](#rb-009-connection-pool) |
| `disk.usage.high` | Disk > 80% utilization | [RB-010](#rb-010-disk-usage) |

### P2 — Medium (Next Business Day)

| Alert Name | Condition | Channel |
|-----------|-----------|---------|
| `error_rate.elevated` | 5xx rate > 1% for > 15m | Slack |
| `db.slow_queries` | Avg query time > 500ms for > 10m | Email |
| `tls.expiry_soon` | TLS cert expires within 14 days | Email |
| `dependency.vuln.critical` | Critical CVE in `pnpm audit` | Email |

### P3 — Low (Weekly Review)

| Alert Name | Condition |
|-----------|-----------|
| `rate_limit.hits.high` | > 100 429s in 1h |
| `unused_endpoints` | Routes with 0 traffic for 30d |
| `ci.test_failure` | CI test suite fails |

---

## Notification Channel Setup

| Channel | Configuration |
|---------|--------------|
| Slack `#szl-alerts` | Create channel, add incoming webhook; set P0/P1 alerts |
| Email `alerts@szlholdings.com` | Distribution list for on-call rotation |
| SMS / PagerDuty | P0 escalation path; configure PagerDuty escalation policy |
| Grafana Dashboard | All P3 alerts surface here only |

---

## Runbooks

### RB-001: API Down

**Symptoms**: `/api/health/live` returning non-200 or timing out.

**Triage steps**:
1. Check Replit deployment status dashboard — is the service running?
2. Check recent deployments — was there a deploy in the last 15 minutes?
3. Pull workflow logs: look for startup errors or crash loops.
4. Check database connectivity: does `/api/health/ready` return?
5. Check memory: is the process OOMing?

**Resolution**:
- If post-deploy regression: rollback to previous deployment version.
- If OOM: increase memory allocation or identify memory leak.
- If DB issue: follow RB-002.

**Rollback procedure**:
```bash
# Revert to last known good Replit deployment
# Then verify:
curl -sf https://$DOMAIN/api/health/live
curl -sf https://$DOMAIN/api/health/ready
```

---

### RB-002: Database Unreachable

**Symptoms**: `/api/health/ready` returns non-200; DB connection errors in logs.

**Triage steps**:
1. Check PostgreSQL service status.
2. Check connection pool exhaustion: `db.connections.high` alert also firing?
3. Check for migration failure: did a migration run recently and fail?
4. Check Replit database addon status.

**Resolution**:
- Connection pool exhaustion: see RB-009.
- Migration failure: roll back migration, redeploy known good version.
- External DB issue: contact Replit support.

---

### RB-003: Error Rate Spike

**Symptoms**: 5xx rate > 5% for > 3 minutes.

**Triage steps**:
1. Identify which routes are failing (check top-errors dashboard).
2. Check if this correlates with a recent deployment.
3. Look for pattern: all routes or specific ones?
4. Check database health (RB-002 if DB errors).
5. Check AI provider status (RB-008 if AI routes).

**Resolution**:
- If post-deploy: rollback.
- If specific route: hotfix or disable route temporarily.
- If DB: RB-002.

---

### RB-004: Memory Pressure

**Symptoms**: Node.js heap > 90% for > 2 minutes; `self-monitor.ts` triggered.

**Triage steps**:
1. Check current heap usage via `/api/health/detailed`.
2. Identify memory-intensive operations (AI inference, large query results).
3. Check for memory leaks in recent code changes.

**Resolution**:
- Short-term: Restart the API process.
- Medium-term: Identify and fix memory leak.
- Long-term: Increase memory limits or implement streaming for large payloads.

---

### RB-005: Deployment Regression

**Symptoms**: Error rate spike within 10 minutes of a deployment.

**Triage steps**:
1. Immediately compare error rate before/after deploy.
2. Identify which routes are failing.
3. Pull deploy diff — what changed?

**Resolution**:
- If confirmed regression: **rollback immediately** before investigating root cause.
- After rollback: run smoke test suite to confirm recovery.
- Root cause analysis: write incident report within 24h.

---

### RB-006: High Latency

**Symptoms**: API p95 latency > 1000ms sustained.

**Triage steps**:
1. Identify which routes are slow (top-slowest-routes dashboard).
2. Check DB query latency (`withDbSpan` metrics).
3. Check AI provider latency (`withExternalSpan` metrics).
4. Check server resource utilization (CPU, memory).

**Resolution**:
- DB slow: optimize query, add index, check EXPLAIN ANALYZE.
- AI provider slow: check provider status page; add timeout/circuit breaker.
- High CPU: check for runaway background jobs.

---

### RB-007: Auth Brute Force

**Symptoms**: > 50 failed auth attempts in 5 minutes from single IP.

**Triage steps**:
1. Identify source IP from auth failure logs.
2. Verify rate limiting is active (should block after 10/15m).
3. Check if rate limiter is functioning correctly.

**Resolution**:
- Add IP to blocklist at the Replit/CDN level.
- Verify rate limiter is enforcing correctly.
- If credentials were compromised: force session invalidation for affected users.

---

### RB-008: AI Provider Down

**Symptoms**: All AI inference requests failing for > 5 minutes.

**Triage steps**:
1. Check Anthropic/OpenAI status pages.
2. Check API key validity.
3. Check for timeout errors vs. auth errors.

**Resolution**:
- Provider outage: fall back to cached/default responses where available.
- API key issue: rotate key via environment secrets.
- Add circuit breaker to prevent cascading failures.

---

### RB-009: Connection Pool Exhaustion

**Symptoms**: DB connections > 90% of max; new connections being rejected.

**Triage steps**:
1. Check for connection leaks (queries that never release connections).
2. Check for long-running queries holding connections.
3. Check active connection count vs. pool size.

**Resolution**:
- Short-term: restart API to release connections.
- Medium-term: identify and fix connection leak.
- Long-term: tune pool size or implement connection multiplexing (PgBouncer).

---

### RB-010: Disk Usage High

**Symptoms**: Disk utilization > 80%.

**Triage steps**:
1. Identify what's consuming disk (logs, uploads, build artifacts).
2. Check log rotation configuration.

**Resolution**:
- Rotate/archive old logs.
- Clean up stale build artifacts.
- Request disk increase if sustained growth.

---

## Post-Incident Review Template

After any P0 or P1 incident, complete this within 24 hours:

```
## Incident Report — [DATE] [ALERT NAME]

### Summary
[One sentence: what broke, for how long, impact]

### Timeline
- [TIME] Alert fired
- [TIME] First responder acknowledged
- [TIME] Root cause identified
- [TIME] Mitigation applied
- [TIME] Service restored

### Root Cause
[Detailed technical explanation]

### Impact
- Duration: X minutes
- Estimated requests affected: N
- Error budget consumed: X minutes

### Resolution
[What was done to fix it]

### Follow-Up Actions
- [ ] Action item 1 (owner, due date)
- [ ] Action item 2 (owner, due date)
```
