# AEF Local Development Guide

This guide covers running the Alloy Embedding Fabric in a local development environment without GPU acceleration or external model services.

## Prerequisites

- Node.js 20+ (managed by the workspace)
- pnpm 9+ (workspace package manager)
- The monorepo installed: `pnpm install` from the workspace root

## Package Installation

All AEF packages are part of the `@workspace/*` scope and are declared as workspace dependencies. They install automatically when you run `pnpm install`.

```bash
pnpm install
```

## Running Tests

Each AEF package has its own test suite. You can run them individually or all at once.

```bash
# Run all AEF package tests
pnpm --filter @workspace/aef-contracts test
pnpm --filter @workspace/aef-retrieval-core test
pnpm --filter @workspace/aef-evidence-ledger test
pnpm --filter @workspace/aef-policy-guard test
pnpm --filter @workspace/aef-domain-profiles test
pnpm --filter @workspace/aef-evals test

# Run all tests across the full workspace
pnpm -w test
```

## Running the Benchmark Script

The benchmark script exercises embed + hybrid search + rerank against the mock corpus without requiring a GPU or external embedding service.

```bash
pnpm tsx scripts/aef-bench.ts
```

Optional arguments:

```bash
# Increase iteration count and warmup
pnpm tsx scripts/aef-bench.ts --iterations 500 --warmup 50
```

The script prints a summary table of p50/p95/p99 latency, average latency, throughput (QPS), and per-domain recall@k, nDCG@k, and MRR.

## Running the Smoke Tests

Smoke tests run as part of the `@workspace/aef-evals` test suite. They use the golden fixture corpora as a mock retrieval backend, so they complete in seconds without external dependencies.

```bash
pnpm --filter @workspace/aef-evals test
```

## Local API Server

The API server includes the `POST /v1/evals/run` endpoint for AEF retrieval evals. To run it locally:

```bash
pnpm --filter @workspace/api-server dev
```

Then call the endpoint:

```bash
curl -X POST http://localhost:3000/v1/evals/run \
  -H "Content-Type: application/json" \
  -d '{
    "evalId": "local-smoke",
    "profileId": "vessels_maritime_risk",
    "domain": "vessels_maritime_risk",
    "useGoldenFixtures": true
  }'
```

## Working with Profiles

Profiles are defined in `packages/aef-domain-profiles/src/profiles/`. Each profile is a plain TypeScript object conforming to the `DomainProfile` Zod schema. To add a new profile version:

1. Create a new file (e.g., `vessels-maritime-risk-v2.ts`) that exports a `DomainProfile` object with `version: "1.0.1"`.
2. Register it with the `DomainProfileRegistry` using `registerProfile`.
3. Rotate the active pointer via `registry.rotate_profile_version(...)`.
4. Add corresponding golden queries to `packages/aef-evals/src/fixtures/vessels.ts`.

## Environment Variables

The local dev environment does not require any AEF-specific environment variables. The mock corpus adapter runs in-process without external calls.

For live embedding, set these variables:

| Variable | Purpose |
|---|---|
| `AEF_EMBED_ENDPOINT` | URL of the embedding service |
| `AEF_RERANK_ENDPOINT` | URL of the reranker service |
| `AEF_INDEX_ENDPOINT` | URL of the vector index (e.g., Qdrant, Weaviate) |

These are documented in `EXTERNAL_GPU_DEPLOYMENT.md`.

## Type Checking

```bash
pnpm --filter @workspace/aef-domain-profiles typecheck
pnpm --filter @workspace/aef-evals typecheck
```

## Linting

The AEF packages use Biome for linting. Run from the workspace root:

```bash
pnpm biome lint packages/aef-domain-profiles/src
pnpm biome lint packages/aef-evals/src
```
