# Substrate Python Worker — Load-Balancer Configs

This directory contains production-ready load-balancer configurations that
sit in front of the Python worker fleet. The TypeScript engine points
`SUBSTRATE_PYTHON_WORKER_URL` at the load-balancer rather than at any
single worker so:

- Traffic is round-robined across the fleet automatically.
- Workers can be replaced (rolling deploy, scale-in, crash) without the
  TS engine changing config.
- The `/ready` probe takes draining or at-capacity workers out of rotation.

## Files

| File | Use when |
|---|---|
| `nginx.conf` | You already run nginx as your reverse proxy. Uses passive health checks (`max_fails`/`fail_timeout`) on the OSS build; pair with `health-check.sh` for active probing. |
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

## Ovis evaluation lane

The deployment above is the general Python worker fleet and has
`OVIS_OMNI_ENABLED=0`. Do not enable Ovis in that mutable, mixed-purpose
deployment.

For the governed Ovis candidate, render
`k8s-ovis-evaluation.yaml.template` with `render_ovis_deployment.py`. The
renderer accepts only `repository@sha256:<64 lowercase hex>` and rejects tags.
The rendered Deployment retains `EVALUATION_HOLD`, uses one GPU, mounts the
flattened model snapshot and asset CAS read-only, denies pod egress when the
cluster CNI enforces NetworkPolicy, serializes Ovis inference, and reads the
internal API key from the `ovis-evaluation-runtime` Secret. Operators must
provision these names before applying the rendered file:

- Secret `ovis-evaluation-runtime`, key `internal-api-key`
- PVC `ovis-model-snapshot`, containing a flattened regular-file snapshot
- PVC `ovis-asset-cas`, containing admitted `cas://sha256/*` assets

The Secret key is mounted as a single `subPath` file so the runtime can reject
symlink traversal. Kubernetes does not update `subPath` Secret mounts in place;
restart the evaluation pod after rotating `internal-api-key`.

The authenticated readiness probe checks configuration gates and the four
exact-pinned runtime distribution versions. A successful `cold` response does
not load the model, hash the snapshot, execute a GPU operation, or prove model
readiness. The current manifest authenticates four admitted LFS artifacts;
full processor/config inventory remains a release blocker.

Kubernetes currently treats that authenticated `cold` response as Ready. The
hold-only lane therefore warms on its first admitted embed request. A future
qualified lane must separate configuration admission from model readiness or
complete a controlled prewarm and require `loaded: true` before receiving
traffic.

The Compose template mirrors the pod's non-root, read-only, dropped-capability
contract and provides only a bounded writable `/tmp`. The eventual image must
run as UID/GID `1001` under those constraints. Before launch, the host paths
for the secret, flattened snapshot, and CAS must grant UID/GID `1001` the
minimum read and directory-traverse permissions they need; the eventual image
receipt must verify those permissions without making the inputs writable.
The request limiter and model lock are process-local, so the admitted image
must also run exactly one application server process with one worker. The image
receipt must verify that entrypoint before the lane can be exercised.

The source tree does not currently publish an admitted evaluation image
digest. A rendered manifest is deployment configuration, not evidence of a
build, a running GPU workload, or model qualification.
