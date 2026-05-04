# Runbook: Scale-Out Drill

> Validates that the autoscaling policy fires correctly under simulated load.

## Local simulation (no cloud, no GPU)

Run the in-process autoscaling simulation:

```bash
cd services/substrate-py-workers
python -m worker.autoscaling_sim
```

Expected output:
```
  PASS  scale-out fires at queue depth threshold
  PASS  scale-in fires after idle timeout
  PASS  hold when fleet is healthy

Autoscaling simulation: all scenarios PASSED
```

Or via pytest:
```bash
pytest services/substrate-py-workers/tests/test_autoscaling_sim.py -v
```

## Live scale-out drill (against deployed fleet)

This drill sends enough concurrent claims to trigger the KEDA scaler.

### Prerequisites
- `SUBSTRATE_PYTHON_WORKER_URL` set to the worker FQDN
- Worker is healthy (`GET /ready` returns `ready=true`)
- `SCALE_OUT_QUEUE_DEPTH` is known (default: 3)

### Generate load

```bash
WORKER_URL="${SUBSTRATE_PYTHON_WORKER_URL}"
SCALE_THRESHOLD="${SCALE_OUT_QUEUE_DEPTH:-3}"

# Submit SCALE_THRESHOLD+1 concurrent claims (use GNU parallel or xargs)
for i in $(seq 1 $((SCALE_THRESHOLD + 2))); do
  curl -s -X POST "$WORKER_URL/claim" \
    -H "Content-Type: application/json" \
    -d "{
      \"protocolVersion\": \"1.0\",
      \"messageId\": \"drill-$i-$(date +%s)\",
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
      \"type\": \"stage.claim\",
      \"workerId\": \"scale-drill\",
      \"runId\": \"drill-run-$(date +%s)\",
      \"workflowId\": \"drill-workflow\",
      \"stageId\": \"drill-stage-$i\",
      \"stageType\": \"retrieval\",
      \"stageConfig\": {\"stageKind\": \"retrieval\"},
      \"input\": {\"query\": \"scale-out drill\", \"topK\": 3},
      \"budgetConfig\": {\"escalateAt\": 0.7, \"requireHumanBelow\": 0.4},
      \"traceId\": \"drill-trace-$i\",
      \"mode\": \"dry-run\"
    }" &
done
wait
```

### Observe metrics

```bash
# Poll /metrics to see available_slots drop
watch -n 5 "curl -s $WORKER_URL/metrics | python3 -m json.tool"
```

When `availableSlots` drops below `SCALE_OUT_QUEUE_DEPTH`, KEDA should trigger
a new Container App revision. Monitor in Azure Portal:

```
Container Apps → szlholdings-substrate-workers → Scale
```

Or via CLI:
```bash
az containerapp revision list \
  --name szlholdings-substrate-workers \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --query '[].{Name:name, Replicas:properties.replicas, Active:properties.active}' \
  -o table
```

### Expected outcome

- `availableSlots` drops to 0 during the load burst
- KEDA fires a scale-out within 30–60 seconds
- New revision starts with additional replicas
- `availableSlots` recovers once additional workers come online
- After 2 × `SCALE_IN_IDLE_SECONDS` of idleness, replicas scale back to `MIN_WORKERS`

## Thresholds to verify

| Check | Expected |
|---|---|
| Scale-out fires | Within 60 seconds of `availableSlots < SCALE_OUT_QUEUE_DEPTH` |
| Max replicas respected | `replicas <= MAX_WORKERS` always |
| Scale-in fires | Within `SCALE_IN_IDLE_SECONDS + KEDA cooldown` after load drops |
| Min replicas respected | `replicas >= MIN_WORKERS` always |
