# AEF Deployment Runbook

_SZL Holdings — Alloy Embedding Fabric (AEF) — April 2026_

---

## Overview

This runbook covers three deployment paths for the AEF control plane and workers:

1. **Replit Reserved VM** — the primary path for the API gateway, ingest-control service, and CPU-based embedding for development and moderate production loads.
2. **Replit Autoscale** — optional path for stateless, light embed workers when bursty ingest demand outpaces a single Reserved VM.
3. **External container (GPU)** — the path for production-scale embedding and reranking at >1,000 documents per minute.

---

## Prerequisites

Before running any AEF service, the following Replit secrets must be set. Navigate to the Secrets panel in your Replit workspace and create each one with the appropriate value. **Do not commit values to source control.**

| Secret Name | Required | Description |
|-------------|----------|-------------|
| `AEF_API_KEY` | Yes | Bearer token for external callers to the AEF API gateway. Generate with `openssl rand -hex 32`. |
| `AEF_S2S_SECRET` | Yes | Service-to-service bearer token used between internal AEF services. Generate with `openssl rand -hex 32`. |
| `AEF_GATEWAY_URL` | Yes (SDK consumers) | The public URL of the AEF API gateway. In Replit, this is your Reserved VM's permanent domain, e.g. `https://aef-api.yourname.repl.co`. |
| `VITE_AEF_GATEWAY_URL` | Yes (browser apps) | Same URL as `AEF_GATEWAY_URL`, prefixed for Vite. Consumer apps read this at runtime via `import.meta.env`. |
| `VITE_AEF_API_KEY` | Yes (browser apps) | Same as `AEF_API_KEY`. Required for browser-side `useAefSearch` hook. |
| `AEF_TENANT_ID` | No | Tenant slug. Defaults to `szl-holdings`. |
| `VITE_AEF_TENANT_ID` | No | Browser-side tenant slug. Defaults to `szl-holdings`. |
| `AEF_EMBED_ENDPOINT` | Conditional | Required only when `AEF_EMBED_BACKEND=external-http`. |
| `AEF_EMBED_API_KEY` | Conditional | API key for the external embed endpoint. |

---

## Path 1: Replit Reserved VM (Recommended for API + Control Plane)

The AEF API gateway and ingest-control service run as long-lived Node.js/Python processes on a Replit Reserved VM. This is the recommended path because Reserved VMs provide a stable permanent domain, persistent filesystem for the `local-fs` and `sqlite` storage adapters, and predictable network throughput.

### Step 1: Provision the Reserved VM

1. Open your Replit workspace.
2. Go to **Deployments → Reserved VM**.
3. Select the `hacker` or higher plan (minimum 2 vCPU, 4 GB RAM recommended).
4. Set the **Primary domain** to `aef-api` (or your preferred subdomain).
5. Click **Deploy**. Replit will provision the VM and provide a permanent HTTPS URL.

### Step 2: Set Secrets

Set all secrets listed in the Prerequisites table above. The most critical are `AEF_API_KEY` and `AEF_S2S_SECRET`.

### Step 3: Start the AEF API Service

The AEF API gateway is configured as a workflow in the Replit workspace. Start it from the Workflows panel:

```
Workflow name: aef-api
Command: node --experimental-vm-modules dist/server.js
Environment: PORT=4200, AEF_API_PORT=4200
```

If no dedicated AEF API workflow exists yet, create one via the Workflows configuration skill. The entry point is `packages/alloy/src/api/server.ts` (or the built output at `dist/server.js`).

### Step 4: Verify the Gateway

```bash
curl -H "Authorization: Bearer $AEF_API_KEY" \
     -H "x-tenant-id: szl-holdings" \
     https://your-aef-gateway.repl.co/health
```

Expected response:
```json
{ "status": "ok", "version": "1.0.0", "uptime": 12.4 }
```

### Step 5: Configure Consumer Apps

Set `VITE_AEF_GATEWAY_URL` and `VITE_AEF_API_KEY` as Replit secrets in each consumer app workspace (or in the shared workspace if they share a workspace). Restart each app's workflow after setting the secrets.

After restart, navigate to the AEF Knowledge Search page in each app (e.g. `/lyte/aef-search`) to confirm the search surface is reachable. Until documents are indexed, searches will return empty result sets — this is the correct behaviour.

### Step 6: Ingest Documents

Use the `ingest_document` workflow in `@workspace/aef-workflow-runtime` to push documents into each domain index. Example:

```typescript
import { AefClient } from "@workspace/aef-sdk";

const client = new AefClient({
  gatewayUrl: process.env.AEF_GATEWAY_URL,
  apiKey: process.env.AEF_API_KEY,
  tenantId: "szl-holdings",
});

await client.ingest({
  documents: [
    {
      sourceId: "lyte-opp-2024-001",
      title: "Q4 Pipeline Review — Opportunity OP-2024-001",
      content: "...",
      contentType: "text/markdown",
      profileId: "lyte_governance_ops",
    },
  ],
});
```

---

## Path 2: Replit Autoscale (Light Stateless Embed Workloads)

For bursty ingest demand that exceeds a single Reserved VM's CPU throughput, the AEF vector embedding worker can be deployed as a stateless Autoscale service. The Autoscale service handles only embedding requests — it does not hold state and does not write to the evidence ledger.

### Configuration

1. Deploy the vector worker as a separate Replit Autoscale deployment:
   - **Entry point:** `workers/aef-vector-worker/src/server.ts` (or its built output).
   - **Port:** `AEF_VECTOR_WORKER_PORT=4202`.
   - **Scaling:** Set minimum instances to 1, maximum to 4 (adjust based on ingest rate).

2. Point the ingest-control service at the Autoscale worker by setting:
   ```
   AEF_VECTOR_WORKER_URL=https://your-vector-worker.repl.co
   ```

3. The API gateway remains on the Reserved VM and continues to handle search requests. Only ingest-time embedding is offloaded to Autoscale.

### When to Use Autoscale

Autoscale is appropriate when you observe consistent CPU saturation on the Reserved VM during ingest bursts. A practical threshold: if the embedding queue depth (`aef.embed.queue_depth` metric) exceeds 100 during normal operating hours, consider moving to Autoscale.

---

## Path 3: External Container (GPU Scale)

For production-scale embedding at >1,000 documents per minute, or when sub-100ms embedding latency is required for real-time search, the AEF embedding backend should be moved to an external GPU-equipped container.

### Recommended GPU Configuration

| Workload | GPU | VRAM | Expected throughput |
|----------|-----|------|---------------------|
| Development | None (CPU) | N/A | 8–12 embed/sec |
| Staging / light prod | A10G | 24 GB | 400–600 embed/sec |
| Full production | A100 (80 GB) | 80 GB | 1,200–1,800 embed/sec |

### Step 1: Provision External GPU Container

Use any GPU cloud provider (Lambda Labs, CoreWeave, AWS P4, GCP A100, Azure NC-series). The container image should run an OpenAI-compatible embedding server. Recommended options:

- **NVIDIA NIM** (`nvcr.io/nim/nvidia/nv-embed-v2:latest`) — zero configuration, API compatible, GPU-optimised.
- **Hugging Face Text Embeddings Inference** (`ghcr.io/huggingface/text-embeddings-inference`) — open-source, supports any model.

Expose the server on HTTPS (port 443 or 8080 behind a load balancer). Note the public HTTPS endpoint.

### Step 2: Configure AEF

Set the following secrets on the Replit Reserved VM hosting the AEF control plane:

```bash
AEF_EMBED_BACKEND=external-http
AEF_EMBED_ENDPOINT=https://your-gpu-server.example.com/v1/embeddings
AEF_EMBED_API_KEY=your-gpu-server-api-key
```

### Step 3: Restart the AEF Vector Worker

Restart the vector worker workflow in Replit. On startup, it will detect `AEF_EMBED_BACKEND=external-http` and route all embedding requests to the external endpoint. No code changes are required.

### Step 4: Verify

```bash
curl -X POST https://your-aef-gateway.repl.co/v1/embed \
  -H "Authorization: Bearer $AEF_API_KEY" \
  -H "x-tenant-id: szl-holdings" \
  -H "Content-Type: application/json" \
  -d '{"requestId":"test-001","texts":["governance risk signal Q4"]}'
```

Verify that `processingMs` is under 100ms and that the response `model` field reflects the external model name.

### Step 5: Rollback Procedure

To roll back to CPU embedding:

1. Remove the `AEF_EMBED_BACKEND` secret (or set it to `local-cpu`).
2. Remove `AEF_EMBED_ENDPOINT` and `AEF_EMBED_API_KEY`.
3. Restart the vector worker workflow.

Rollback takes effect within 30 seconds. Inflight requests that were routed to the external endpoint before the restart may fail; they will be retried automatically by the SDK (up to 3 times with exponential backoff).

---

## Health and Monitoring

The AEF API gateway exposes the following endpoints for observability:

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Liveness probe — returns `{"status":"ok"}`. |
| `GET /metrics` | Prometheus-compatible metrics: embedding queue depth, latency percentiles, error rates by tenant. |
| `GET /v1/profiles` | List all registered domain profiles and their active version. |

Recommended alert thresholds:

| Metric | Warning | Critical |
|--------|---------|----------|
| `aef.embed.queue_depth` | > 50 | > 200 |
| `aef.search.p99_latency_ms` | > 500ms | > 2000ms |
| `aef.embed.error_rate` | > 1% | > 5% |
| `aef.ledger.write_failures` | > 0 | > 10 |

---

## Troubleshooting

**Search returns 0 results but no error:**  
The index for the domain profile is empty. Run an ingest job to populate it. Check that the `profileId` passed to `hybridSearch()` matches a registered profile (use `GET /v1/profiles` to list them).

**`AefUnavailableError` in tool-mesh or consumer app:**  
The AEF gateway is unreachable. Verify that `AEF_GATEWAY_URL` is set and correct, that the Reserved VM is running, and that the Replit workflow for the AEF API service is active.

**`AefAuthError` (401):**  
The bearer token is wrong or missing. Check that `AEF_API_KEY` (server-side) or `VITE_AEF_API_KEY` (browser-side) matches the value set on the AEF gateway.

**`AefPolicyError` (403):**  
The AEF policy guard rejected the request. This may indicate a tenant isolation violation (wrong `tenantId`), a profile that prohibits cross-boundary access (e.g. `carlota_private_advisory`), or an expired policy rule. Review the policy engine logs on the Reserved VM.

**High embedding latency (>500ms p99) on Reserved VM:**  
CPU saturation is likely. Check the `aef.embed.queue_depth` metric. If consistently above 50, move the vector worker to Replit Autoscale (Path 2) or an external GPU (Path 3).

**Consumer app shows "AEF Not Configured" banner:**  
The `VITE_AEF_GATEWAY_URL` or `VITE_AEF_API_KEY` environment variable is missing or not prefixed correctly for Vite. Set both secrets in the Replit Secrets panel and restart the app workflow. Note that Vite reads `import.meta.env.VITE_*` variables at build time in production — a full rebuild is required after setting them for deployed (non-dev) environments.
