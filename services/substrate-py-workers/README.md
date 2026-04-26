# Substrate Python Workers

This service is the Python execution layer for A11oy/SZL governed workflows.
It exists for workloads where Python is materially better than the TypeScript
application runtime: retrieval, OCR, geospatial analysis, eval grading,
embeddings/rerank, model scoring, and vertical-pack analysis.

The TypeScript substrate remains the system of record for orchestration,
policy gates, approval, Proof Chain evidence, and delivery. Python workers only
execute explicitly tagged stages and return typed result envelopes.

## Runtime Boundary

Keep these in TypeScript:

- React/UI surfaces and operator workflows
- policy compilation and approval routing
- Proof Chain, journal, and audit persistence
- API contracts that already serve product surfaces
- side-effecting execution controls

Move these to Python workers:

- CPU-heavy document extraction and OCR
- large-context retrieval and rerank
- geospatial joins and anomaly checks
- eval grading and benchmark sweeps
- embeddings/model scoring with license metadata
- vertical-pack signal, evidence, forecast, and recommendation generation

## Live-Mode Safety

Live mode fails closed. If a Python stage needs a real worker, retriever,
model, or provider and it is not configured, the stage must return an explicit
error instead of silently fabricating evidence.

Development-only deterministic models are allowed in `dry-run`, `replay`, and
`counterfactual` modes. Live use requires an explicit env gate, for example:

```bash
SUBSTRATE_EMBEDDINGS_ALLOW_DEV_MODEL=1
SUBSTRATE_RETRIEVAL_ALLOW_SYNTHETIC=1
```

Do not set those gates for production evidence chains.

## Model and Provider Policy

External providers, including Hugging Face models or datasets, must not be
activated by default. Before adding one:

- add a registry record with provider, model id, capability, and license
- document required environment variables
- fail closed in live mode unless the provider is configured
- add replay, dry-run, and failure-path tests
- preserve human approval and policy gates for consequential actions

## Local Checks

```bash
python -m pytest services/substrate-py-workers/tests
pnpm run verticals:validate
```
