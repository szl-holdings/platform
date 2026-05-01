# Runbook — ${{ values.domainName }} API

**Service**: `${{ values.domainSlug }}-api`  
**Domain**: `${{ values.domainSlug }}`  
**Owner**: `${{ values.ownerGroup }}`  
**Oncall**: [PagerDuty rotation link]  
**Slack**: #${{ values.domainSlug }}-alerts  

---

## Health Checks

| Endpoint | Expected | Probe type |
|----------|---------|------------|
| `GET /health` | `{"status":"ok"}` | Liveness |
| `GET /ready` | `{"ready":true}` | Readiness |

```bash
curl https://<env>-api.szl.io/${{ values.domainSlug }}/health
curl https://<env>-api.szl.io/${{ values.domainSlug }}/ready
```

---

## Common Alerts

### HIGH CPU / Memory
1. Check recent deployments: `az containerapp revision list -n ${{ values.domainSlug }}-api`
2. Scale out: `az containerapp update -n ${{ values.domainSlug }}-api --max-replicas 10`

### 5xx Errors Elevated
1. Tail logs: `az containerapp logs show -n ${{ values.domainSlug }}-api --follow`
2. Check downstream dependencies (databases, external APIs)
3. If error rate > 20%: roll back last revision

### Database Connection Failures
1. Verify secret binding: `humctl get resource ${{ values.domainSlug }}-postgres`
2. Check connection pool exhaustion in OTel metrics: `db.client.connections.usage`

---

## Rollback Procedure

```bash
# List revisions
az containerapp revision list -n ${{ values.domainSlug }}-api -g szl-platform-rg

# Activate a specific previous revision
az containerapp revision activate --revision <revision-name> \
  -n ${{ values.domainSlug }}-api -g szl-platform-rg
```

---

## Runbook Contacts

| Role | Contact |
|------|---------|
| Primary oncall | [PagerDuty] |
| Domain owner | ${{ values.ownerGroup }} |
| Platform | #platform-engineering |
