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

The sidecar is a production-ready managed service:

- **Container image** — `services/sentra-detector-sidecar/Dockerfile`
  builds a slim Python 3.11 image with the canonical detectors and
  their ML dependencies (numpy, scikit-learn). The image runs as a
  non-root user and exposes port `8765`.
- **Managed deployment** — `artifacts/api-server/.replit-artifact/artifact.toml`
  declares a `sentra-sidecar` service entry alongside `api` so the
  platform knows the port and run command. In addition,
  `artifacts/api-server/start.sh` co-launches the sidecar inline so a
  single api-server boot brings up the full detector framework
  end-to-end. If the standalone workflow has already bound port 8765
  the inline launcher detects that and skips, mirroring the `amaru`
  pattern.
- **Registration retry policy** — the sidecar registers with the
  api-server on boot and then **heartbeats every
  `SENTRA_SIDECAR_HEARTBEAT_SECONDS` (default 30s)** so the
  api-server's `lastSeenAt` stays fresh and a restarted api-server
  rediscovers us within one interval. The initial handshake retries
  indefinitely with exponential backoff capped at
  `SENTRA_SIDECAR_REGISTER_MAX_BACKOFF_SECONDS` (default 60s), so the
  sidecar tolerates being booted before the api-server is ready.
- **Observability** — `GET /api/sentra/sidecars` on the api-server
  surfaces the last-known set of sidecar-backed detectors with
  `lastSeenAt` / `chainReceiptId`, and the sidecar's own `GET /health`
  returns the live registration state (`attempts`, `successes`,
  `lastSuccessAt`, `lastError`).
- **Failover & double-fire** — every detector run gets a fresh
  server-side UUID (`runId`), and findings are persisted with
  `onConflictDoNothing` keyed by finding `id`. If two sidecars
  register the same detector (e.g. during a rolling restart) the
  most-recent registration wins via the `sentraDetectorsTable`
  upsert, so subsequent `/run` calls only fan out to one sidecar.

### Required env vars in production

| Var | Purpose |
| --- | --- |
| `SENTRA_API_SERVER_URL` | Where the sidecar POSTs `sidecar-register`. |
| `SENTRA_SIDECAR_BASE_URL` | URL the api-server uses to call back into us. Must be reachable from the api-server. |
| `SENTRA_SIDECAR_SHARED_SECRET` | Validates the `sidecar-register` handshake. |
| `SENTRA_SIDECAR_INTERNAL_TOKEN` | Required when the sidecar is NOT on loopback so `/api/sentra/*` accepts the call. |
| `SENTRA_SIDECAR_ALLOWED_HOSTS` | api-server side: comma-separated allowlist of non-loopback sidecar hosts (SSRF guard). |

## Tests

```bash
pip install -e ".[dev]"
pytest
```
