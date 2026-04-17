# PRISM Counsel — Operations Runbook

> **DEPRECATED:** PRISM Counsel (`artifacts/prism-counsel`) has been retired. Legal capabilities are now consolidated into the **Aegis legal workspace** (`/aegis/`). This runbook is preserved for historical reference only. No active service exists.

## Service Overview

PRISM Counsel is a legal matter observability and governed execution platform for plaintiff-side NY insurance litigation teams.

### Architecture Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| API Server | Express/Node.js | REST API, job orchestration |
| Database | PostgreSQL | 37+ tables, matter data, audit trail |
| Job Queue | DB-backed (pc_background_jobs) | Async processing with DLQ |
| Document Pipeline | Azure Document Intelligence | Extraction, classification, dedup |
| Blob Storage | Azure Blob (5 containers) | Raw ingest, normalized, exports |
| Service Bus | Azure Service Bus | Event-driven queue processing |

### Key Tables

| Table | Purpose |
|-------|---------|
| `pc_matters` | Core legal matters |
| `pc_background_jobs` | Job queue state |
| `pc_dead_letter_events` | Failed jobs for replay |
| `pc_documents` | Document registry with SHA-256 dedup |
| `pc_extraction_jobs` | Document Intelligence jobs |
| `pc_notifications` | User notifications |
| `pc_audit_events` | Immutable audit trail |
| `pc_connector_accounts` | External system connections |
| `pc_graph_subscription_state` | Microsoft Graph webhook state |

---

## Health Checks

### API Health
```bash
curl https://<domain>/api/prism-counsel/health
```
Expected: `{"service":"prism-counsel","status":"operational"}`

### Database Readiness
```bash
curl https://<domain>/api/prism-counsel/readiness
```
Expected: `{"ready":true,"database":"connected"}`

### NY Module Health
```bash
curl https://<domain>/api/prism-counsel/ny/health
```

---

## Incident Response

### 1. Job Queue Backup

**Symptoms**: Jobs stuck in `pending`, `pc_background_jobs` count growing

**Diagnosis**:
```sql
SELECT status, job_type, COUNT(*) 
FROM pc_background_jobs 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY status, job_type 
ORDER BY count DESC;
```

**Resolution**:
1. Check if the API server is running (`/api/prism-counsel/health`)
2. Check the PRISM job poller is active (look for `[prism-queue] Starting job poller` in logs)
3. If poller is dead, restart the API server
4. For stuck `running` jobs older than 30 minutes:
```sql
UPDATE pc_background_jobs 
SET status = 'pending', retry_count = retry_count + 1, updated_at = NOW()
WHERE status = 'running' AND started_at < NOW() - INTERVAL '30 minutes';
```

### 2. Dead Letter Queue Growing

**Symptoms**: DLQ events accumulating, `pc_dead_letter_events` unresolved

**Diagnosis**:
```sql
SELECT job_type, error, COUNT(*) 
FROM pc_dead_letter_events 
WHERE resolved_at IS NULL 
GROUP BY job_type, error 
ORDER BY count DESC;
```

**Resolution**:
1. Review errors — most common: missing handler, external API timeout, bad payload
2. For transient failures, replay via API: `POST /api/prism-counsel/jobs/dead-letter/:eventId/replay`
3. For permanent failures, mark as discarded:
```sql
UPDATE pc_dead_letter_events 
SET resolved_at = NOW(), resolution = 'discarded', notes = 'Manual triage'
WHERE id = <event_id>;
```

### 3. Document Pipeline Stalled

**Symptoms**: Extraction jobs stuck in `pending` or `processing`

**Diagnosis**:
```sql
SELECT status, COUNT(*), AVG(processing_time_ms)::int as avg_ms
FROM pc_extraction_jobs 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

**Resolution**:
1. Check `AZURE_DOC_INTEL_ENDPOINT` and `AZURE_DOC_INTEL_KEY` env vars are set
2. If not configured, extractions store placeholder text (expected behavior in dev)
3. For stuck jobs, reset:
```sql
UPDATE pc_extraction_jobs 
SET status = 'pending', started_at = NULL 
WHERE status = 'processing' AND created_at < NOW() - INTERVAL '1 hour';
```

### 4. Connector Sync Failure

**Symptoms**: Connector accounts showing `error` status

**Diagnosis**:
```sql
SELECT ca.id, ca.connector_type, ca.display_name, ca.status, 
       sr.status as sync_status, sr.error_details
FROM pc_connector_accounts ca
LEFT JOIN pc_connector_sync_runs sr ON sr.connector_account_id = ca.id
WHERE ca.status = 'error'
ORDER BY sr.started_at DESC;
```

**Resolution**:
1. Check OAuth token validity for the connector
2. Verify Graph API permissions if Microsoft 365
3. Reset connector status and retry:
```sql
UPDATE pc_connector_accounts SET status = 'active' WHERE id = <account_id>;
```
Then trigger sync via API: `POST /api/prism-counsel/connectors/:accountId/sync`

### 5. Graph Subscription Expiry

**Symptoms**: Webhook notifications stop arriving

**Diagnosis**:
```sql
SELECT subscription_id, resource_path, status, expiration_date_time, renewal_failure_count
FROM pc_graph_subscription_state 
WHERE status = 'active' AND expiration_date_time < NOW() + INTERVAL '24 hours';
```

**Resolution**: Graph subscriptions expire after 3 days max. The system should auto-renew. If renewals are failing:
1. Check connector account OAuth token
2. Re-register subscription via connector sync
3. Monitor `renewal_failure_count` — if > 3, investigate Graph API changes

---

## Monitoring Queries

### Active Matter Health
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status NOT IN ('closed','archived')) as active,
  COUNT(*) FILTER (WHERE health_score < 50) as unhealthy,
  AVG(health_score) as avg_health
FROM pc_matters;
```

### Deadline Compliance
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'overdue') as overdue,
  COUNT(*) FILTER (WHERE status = 'pending' AND due_date < NOW() + INTERVAL '7 days') as due_7d,
  COUNT(*) FILTER (WHERE status = 'pending') as total_pending
FROM pc_deadlines;
```

### Approval Queue Depth
```sql
SELECT request_type, COUNT(*) 
FROM pc_approval_requests 
WHERE status = 'pending' 
GROUP BY request_type;
```

### Job Queue Metrics
```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))::numeric(10,2) as avg_duration_sec
FROM pc_background_jobs 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

### Document Pipeline Throughput
```sql
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as docs_ingested,
  COUNT(*) FILTER (WHERE review_state = 'reviewed') as reviewed
FROM pc_documents 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour ORDER BY hour;
```

---

## Escalation Path

| Severity | Response Time | Contact |
|----------|-------------|---------|
| P1 (Data Loss / Full Outage) | 15 min | ops@szlholdings.com, Stephen Lutar |
| P2 (Degraded / DLQ Overflow) | 1 hour | ops@szlholdings.com |
| P3 (Single Job Failure) | 4 hours | On-call engineer |
| P4 (Feature Flag / Config) | Next business day | Dev team |

---

## Deployment Checklist

1. Merge PR → GitHub Actions runs CI
2. Bicep validates → Infrastructure deploys
3. Container image builds → pushes to ACR
4. Container App updates → new revision
5. DB migration runs → schema syncs
6. Smoke tests verify health endpoints
7. Monitor DLQ and job queue for 30 minutes post-deploy
