# artifacts/api-server — stub package

This directory is a historical stub. Per the 2026-05-30 architecture audit, it does NOT host the production Express HTTP transport despite the prior package.json description's claim of "5,500+ endpoints".

What's actually here:
- `src/routes/ouroboros.ts` — one route file, exported for backward-compatibility with any direct import-path consumers
- `src/middlewares/` — placeholder
- No Express dependency
- No `dev`/`start`/`build` scripts (only `typecheck`)
- No Dockerfile

## Where the real API servers live

| Server | Path | Purpose |
|---|---|---|
| Runtime API | `apps/alloy-runtime-api` | Unified v1 surface for tasks, memory, workflow execution |
| Embedding API | `apps/alloy-embedding-api` | REST API gateway for embed, rerank, hybrid-search, ingest |
| Ingestion Orchestrator | `apps/alloy-ingestion-orchestrator` | Deterministic workflow control plane |
| Substrate MCP Gateway | `services/substrate-mcp-gateway` | MCP transport |
| Fabric API | `services/alloy-fabric-api` | Fabric-tier API |
| Fabric Ingest Control | `services/alloy-fabric-ingest-control` | Ingest control plane |
| Vector Worker | `workers/alloy-vector-worker` | Vector indexing worker |
| Rank Worker | `workers/alloy-rank-worker` | Rerank worker |
| Eval Runner | `apps/eval-runner` | Benchmark runner |
| Substrate Inference | `apps/substrate-inference` | Inference substrate (the only currently-Dockerized server) |

For new HTTP transport work, contribute to the appropriate `apps/*` server. This stub may be removed in a future cleanup pass once no consumer imports `@workspace/api-server`.

Signed-off-by: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
