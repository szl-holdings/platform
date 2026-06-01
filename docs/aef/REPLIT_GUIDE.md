# AEF Replit Guide

This guide covers developing and running the Alloy Embedding Fabric on Replit's Reserved VM and Autoscale infrastructure.

## Replit Environment Overview

Replit provides two deployment targets relevant to AEF:

- **Reserved VM** — a dedicated virtual machine with guaranteed compute allocation. Suitable for the API server, orchestrator, and policy guard components. Persistent storage is available.
- **Autoscale** — serverless execution that scales to zero between requests. Suitable for stateless retrieval endpoints and eval runs that do not require warm embedding workers.

The AEF mock corpus adapter and benchmark script run comfortably on Replit CPU within the Reserved VM plan. Live embedding with transformer models requires the external GPU deployment path described in `EXTERNAL_GPU_DEPLOYMENT.md`.

## Running Tests on Replit

All AEF tests run on Replit CPU without modification. From the workspace root:

```bash
pnpm --filter @workspace/aef-domain-profiles test
pnpm --filter @workspace/aef-evals test
```

The eval and smoke tests complete in under 10 seconds on a Replit Reserved VM instance because they use the in-memory mock corpus adapter.

## Running the Benchmark on Replit

```bash
pnpm tsx scripts/aef-bench.ts
```

Expected runtime on Replit CPU: under 5 seconds for the default 100 iterations per domain. Throughput numbers reflect in-memory retrieval — they will be lower for live embedding services.

## API Server on Replit

The `artifacts/api-server` workflow exposes the AEF endpoints, including `POST /v1/evals/run`. When running on Replit, the workflow binds to the `PORT` environment variable (typically 3000 for the api workflow).

To call the eval endpoint from the Replit shell:

```bash
curl -X POST "http://localhost:$PORT/v1/evals/run" \
  -H "Content-Type: application/json" \
  -d '{"evalId":"replit-smoke","profileId":"lyte_governance_ops","domain":"lyte_governance_ops","useGoldenFixtures":true}'
```

## Reserved VM — Storage Considerations

The evidence ledger's filesystem JSONL adapter writes to `./data/aef-evidence/`. On Replit Reserved VMs, this path persists across restarts. On Autoscale deployments, it does not — use the in-memory adapter or connect to an external store.

Configure the adapter in the API server environment:

```bash
AEF_LEDGER_ADAPTER=fs        # use filesystem JSONL (Reserved VM)
AEF_LEDGER_ADAPTER=memory    # use in-memory (Autoscale / dev)
AEF_LEDGER_PATH=./data/aef-evidence/
```

## Replit Secrets for AEF

If wiring live embedding services, configure these secrets through the Replit Secrets panel (not as plain environment variables):

| Secret Name | Description |
|---|---|
| `AEF_EMBED_API_KEY` | API key for the embedding service |
| `AEF_RERANK_API_KEY` | API key for the reranker service (if separate) |
| `AEF_INDEX_API_KEY` | API key for the vector index |

Do not put these values in `.env` files or code — use the Replit Secrets panel exclusively.

## Port Configuration

The API server reads from the `PORT` environment variable. Do not hard-code a port in any AEF configuration file. The Replit proxy will route requests to the correct port automatically.

## Workflow Configuration

The `artifacts/api-server: api` workflow handles all AEF API traffic. Restart it after package changes:

```
artifacts/api-server: api → restart
```

## Performance Notes

| Operation | Replit CPU (Reserved VM) | Expected p50 |
|---|---|---|
| Mock retrieval per query | CPU-bound in-memory scan | < 1 ms |
| Profile resolution | Hash map lookup | < 0.1 ms |
| Policy guard evaluation | Rule evaluation | < 0.5 ms |
| Evidence ledger append (memory) | In-memory push | < 0.1 ms |
| Full benchmark (100 iter × 6 domains) | Sequential | < 5 s |

Live embedding latencies depend on the external model service. See `EXTERNAL_GPU_DEPLOYMENT.md` for expected GPU-side numbers.
