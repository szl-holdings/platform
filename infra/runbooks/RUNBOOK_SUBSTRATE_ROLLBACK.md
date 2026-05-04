# Runbook: Substrate Fleet Rollback

> Use when a substrate fleet deployment causes regressions or errors.

## Decision Tree

```
Is the API server functional (non-substrate routes working)?
  YES → Rollback only the substrate fleet (steps below)
  NO  → Full platform rollback (see RUNBOOK_ROLLBACK.md)
```

## Option A — Roll back to a previous Container App revision

This is the fastest rollback path and requires no image rebuild.

```bash
# List recent revisions
az containerapp revision list \
  --name szlholdings-substrate-inference \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --query '[].{Name:name, Active:properties.active, Created:properties.createdTime}' \
  -o table

az containerapp revision list \
  --name szlholdings-substrate-workers \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --query '[].{Name:name, Active:properties.active, Created:properties.createdTime}' \
  -o table

# Activate the previous revision (replace PREVIOUS_REVISION_NAME)
az containerapp revision activate \
  --name szlholdings-substrate-inference \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --revision PREVIOUS_REVISION_NAME

az containerapp revision activate \
  --name szlholdings-substrate-workers \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --revision PREVIOUS_REVISION_NAME
```

## Option B — Re-deploy a known-good image tag

```bash
# Find the last known-good git SHA from CI/CD history or ACR tags
GOOD_SHA="abc1234"

GIT_SHA="$GOOD_SHA" ./scripts/deploy-substrate.sh --skip-push
```

This skips the Docker build/push and re-deploys the existing ACR image with
the specified tag.

## Option C — Disable the substrate fleet entirely

If the fleet is causing widespread issues, disable it via the `deploySubstrateFleet`
flag. Existing Container Apps remain but traffic stops being routed to them.

```bash
# Remove SUBSTRATE_PYTHON_WORKER_URL from the API server
az containerapp update \
  --name szlholdings-api \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --remove-env-vars SUBSTRATE_PYTHON_WORKER_URL

# The bridge will fall back to deterministic stubs for non-live calls
# and will fail-closed for live mode calls (this is the governed fallback)
```

## Option D — Emergency: stop all substrate container apps

```bash
az containerapp stop \
  --name szlholdings-substrate-inference \
  --resource-group "$AZURE_RESOURCE_GROUP"

az containerapp stop \
  --name szlholdings-substrate-workers \
  --resource-group "$AZURE_RESOURCE_GROUP"
```

Restart when ready:
```bash
az containerapp start --name szlholdings-substrate-inference --resource-group "$AZURE_RESOURCE_GROUP"
az containerapp start --name szlholdings-substrate-workers --resource-group "$AZURE_RESOURCE_GROUP"
```

## Verify Rollback

After any rollback action, verify:

```bash
# Check inference health
curl "https://$INFERENCE_FQDN/health" | python3 -m json.tool

# Check worker health + readiness
curl "https://$WORKER_FQDN/health" | python3 -m json.tool
curl "https://$WORKER_FQDN/ready" | python3 -m json.tool

# Verify bridge status from API server
curl "https://$API_FQDN/api/v1/control-tower/substrate-status" | python3 -m json.tool
# Expect: configured, healthy, ready (or unconfigured if Option C/D was taken)
```

## Impact on Governed Modes

| Rollback Option | Live mode | Dry-run / Replay / Counterfactual |
|---|---|---|
| A (previous revision) | Served by previous image | Served by previous image |
| B (good SHA re-deploy) | Served by good image | Served by good image |
| C (unset worker URL) | **fail-closed** (explicit error) | Deterministic fallback |
| D (stop container apps) | **fail-closed** (explicit error) | Deterministic fallback |

Options C and D preserve governance: live mode fails closed rather than
fabricating evidence. Non-live modes fall back to the deterministic stubs
(governed by `SUBSTRATE_RETRIEVAL_ALLOW_SYNTHETIC` and `SUBSTRATE_EMBEDDINGS_ALLOW_DEV_MODEL`).

## Post-Incident

After rolling back:
1. File an incident report in `docs/operations/incident-response.md`
2. Identify root cause in logs: `az containerapp logs show --name szlholdings-substrate-workers ...`
3. Fix in a feature branch and re-run `./scripts/deploy-substrate.sh` after validation
