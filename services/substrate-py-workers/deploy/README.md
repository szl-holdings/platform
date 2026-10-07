# Substrate Python Worker — Load-Balancer Configs

This directory contains deployment sketches for load balancers that can sit in
front of a Python worker pool. They are not a production-readiness receipt. The
TypeScript engine points
`SUBSTRATE_PYTHON_WORKER_URL` at the load-balancer rather than at any
single worker so, when paired with the named deployment mechanism:

- Traffic is round-robined across the fleet automatically.
- Workers can be replaced (rolling deploy, scale-in, crash) without the
  TS engine changing config.
- Caddy/Kubernetes readiness probes can take draining or at-capacity workers
  out of rotation; the bundled open-source nginx sketch does not actively poll.

## Files

| File | Use when |
|---|---|
| `nginx.conf` | You already run nginx as your reverse proxy. It contains passive transport-failure settings but no active readiness controller; add and prove one in deployment or use another option below. |
| `Caddyfile` | You want active health checks against `/ready` without third-party nginx modules. Recommended for new deployments. |
| `k8s-service.yaml` | You run on Kubernetes. The `Service` + `readinessProbe` give you the same behavior natively — no separate LB process needed. |

## Pointing the engine at the LB

Set the env var on the TypeScript engine process:

```bash
SUBSTRATE_PYTHON_WORKER_URL=http://substrate-py-lb:8080
```

In Kubernetes use the in-cluster Service DNS:

```bash
SUBSTRATE_PYTHON_WORKER_URL=http://substrate-py-workers.default.svc.cluster.local:8080
```

The engine will `POST /claim` to that URL; the LB picks an available worker.
See `docs/substrate/python-workers.md` for the full startup, failover, and
drain runbook.

## Production execution HOLD

These sketches are usable only for development and evaluation exercises. If
any of `SUBSTRATE_PYTHON_WORKER_ENV`, `APP_ENV`, `NODE_ENV`, or `SZL_ENV` is
`prod` or `production`, `/ready` returns `503` and `/claim` returns the same
result-free HOLD before acquiring a claim slot or resolving a stage handler.
Transport authentication alone cannot qualify execution.

Production admission remains unavailable until the service verifies
stage-specific qualification receipts and uses both a shared durable
tenant/run/stage claim-and-result store and a durable transactional evidence
ledger. None of those three capabilities exists in this source.

## Mutating claim retry boundary

`POST /claim` is not durably idempotent across worker processes. Its in-memory
active-claim guard cannot prove whether another worker completed a request after
the caller lost the response. For that reason, both bundled proxy sketches
disable automatic retries of `/claim`, and the TypeScript caller performs one
POST, rejects redirects, and fails closed on every ambiguous transport outcome.
An operator must investigate before any manual replay. Duplicate-safe retry and
transparent failover remain a release HOLD until a shared durable reservation
and completed-result record exists for `(tenantId, runId, stageId)`.

## Required claim authentication

`POST /claim` is an internal protected boundary. Inject the same
`SUBSTRATE_PYTHON_WORKER_API_KEY` secret into the TypeScript Substrate authority
and every worker. Set `SUBSTRATE_PYTHON_WORKER_TENANT_ID` on both sides to the
single governed tenant authorized for that credential. The authority sends the
key as `Authorization: Bearer ...`, derives `X-Tenant-ID` from the authenticated
run context, and mirrors that value in the claim payload. The worker compares
both tenant values to its server-side credential binding and rejects
missing/wrong credentials or cross-tenant claims before stage execution. Use a
separate deployment and credential for each tenant; this configuration does not
provide a shared multi-tenant bearer.

There is no default credential. For local development or tests only, set both
`SUBSTRATE_PYTHON_WORKER_ENV=development` (or `test`) and
`SUBSTRATE_PYTHON_WORKER_AUTH_BYPASS=1`. Production startup rejects the bypass.
Generate and store a production credential in the deployment secret manager;
do not put it in this repository or a committed environment file.
The Python process binds to `127.0.0.1` by default. Container deployments must
opt into `HOST=0.0.0.0` alongside the production auth/tenant configuration.

The bundled proxies preserve `Authorization` and `X-Tenant-ID`. Kubernetes
expects an existing Secret named `substrate-py-workers` with key `api-key` and
an existing ConfigMap named `substrate-py-workers` with key `tenant-id`; the
manifest creates neither and contains no credential.

`/workers` and `/metrics` expose run/stage and capacity state, so they use this
same bearer/tenant boundary. Only the minimal `/health` liveness response and
fail-closed `/ready` remain public.

The `/aef/embed` and `/aef/rerank` helpers are deterministic development
heuristics, not production model backends. They accept only the server-owned
identities `aef-dev-hash` and `lexical-overlap-v1`, respectively, and return `503`
in production. They also require the shared worker bearer/tenant boundary (or
the explicit dev/test bypass plus `X-Tenant-ID`). A caller cannot relabel their
output as another model.

The optional `/aef/ovis/*` route is also production-HOLD. Its canonical
manifest is `EVALUATION_HOLD` with production serving forbidden, and the worker
does not implement a signed receipt parser/verifier. A caller cannot promote it
by setting `OVIS_PROMOTION_STATE=QUALIFIED` or by supplying an arbitrary 64-hex
receipt digest. After authentication and tenant binding, production embed
requests return `503` before the runtime is acquired or invoked.

## Release packaging hold

This service currently declares version ranges in `pyproject.toml` and
`requirements.txt` without a committed, hashed Python lock, and this directory
does not contain a reproducible image build. The Kubernetes image reference is
therefore illustrative only: do not promote it as a reproducible production
artifact until CI installs from an exact locked dependency graph, builds the
image from tracked instructions, and proves a clean rebuild digest/SBOM.

The repository also contains an `AutoscalingPolicy` recommendation helper and
capacity telemetry. No checked-in coordinator invokes that evaluator or changes
replica counts, so autoscaling is not an active runtime capability.
