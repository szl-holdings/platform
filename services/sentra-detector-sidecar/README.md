# sentra-detector-sidecar

FastAPI host for Python-authored Sentra detectors. Speaks the same
`Detector` / `Finding` / `DetectorRun` contract as the TS in-process
runtime — see `packages/sentra-detector-sdk` for the canonical types and
`./src/sidecar/contracts.py` for the pydantic mirror.

## Why a sidecar?

The Sentra detector framework intentionally supports two host runtimes:

1. **TypeScript, in-process** — for detectors that fit naturally into
   the api-server (heuristics, signature rules, correlation passes).
2. **Python, sidecar** — for detectors that rely on the ML/IR ecosystem
   (sklearn, numpy, transformers). Forcing those into TypeScript would
   either lose fidelity or pull a heavy native bridge into the
   api-server hot path.

The contract is the same in both cases, so investors see one consistent
detection story across every Sentra surface.

## Run locally

```bash
pnpm sentra:sidecar:dev
```

That script bootstraps the venv on first run and starts uvicorn on
`http://127.0.0.1:8765`. On startup the sidecar fires a registration
call to the api-server at `$SENTRA_API_SERVER_URL` (default
`http://127.0.0.1:5000`) so the api-server can route
`POST /api/sentra/detectors/:id/run` back to us.

## Endpoints

| Method | Path                            | Purpose                                |
| ------ | ------------------------------- | -------------------------------------- |
| GET    | `/health`                       | Liveness + hosted detector ids         |
| GET    | `/detectors`                    | List manifests hosted by this sidecar  |
| POST   | `/detectors/{id}/run`           | Run a detector with inline inputs      |

## Canonical detectors shipped here

- `py-example/embedding-drift` — drift score against a baseline using
  the canonical `driftScore` formula from `@szl-holdings/formulas`.
- `py-example/log-anomaly-isolationforest` — `sklearn.IsolationForest`
  over a windowed log stream.

## Deployment

This sidecar is **local-runnable only** for the framework drop. Production
hosting (containerisation, autoscaling, registration retry policy) is
tracked as a follow-up task.

## Tests

```bash
pip install -e ".[dev]"
pytest
```
