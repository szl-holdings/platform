# Runbook — ${{ values.agentSlug }} Agent Worker

**Service**: `${{ values.agentSlug }}-worker`  
**Domain**: `${{ values.domainSlug }}`  
**Owner**: `${{ values.ownerGroup }}`  
**Oncall**: [PagerDuty rotation link]  
**Slack**: #${{ values.domainSlug }}-alerts  

---

## Health Probes

| Endpoint | Port | Expected | Probe type |
|----------|------|---------|------------|
| `GET /health` | 9090 | `{"status":"ok"}` | Liveness |
| `GET /ready` | 9090 | `{"ready":true}` | Readiness |

```bash
curl http://<pod-ip>:9090/health
curl http://<pod-ip>:9090/ready
```

---

## Common Alerts

### Worker Stalled / No Heartbeat
1. Check Temporal workflow list: `temporal workflow list -n default -q 'WorkflowType="${{ values.agentSlug }}"'`
2. Restart the worker pod/revision
3. If stall persists: inspect stuck workflow: `temporal workflow show -w <workflow-id>`

### Agent Errors / LLM Failures
1. Check structured logs for `level: error` with `agent.error` field
2. Verify model env var: `AGENT_MODEL` is set and the model is reachable
3. Check rate limits on model provider

### Proof Chain Not Emitting
1. Look for `proof-chain.emit` span in OTel trace
2. Verify `@szl-holdings/proof-chain` package is at correct version
3. Check policy guard: `aef-policy-guard` may be blocking emission

---

## Rollback Procedure

```bash
# Scale to 0, then back up with previous image
az containerapp update -n ${{ values.agentSlug }}-worker --image <previous-sha>
```

---

## Runbook Contacts

| Role | Contact |
|------|---------|
| Primary oncall | [PagerDuty] |
| Domain owner | ${{ values.ownerGroup }} |
| Platform | #platform-engineering |
