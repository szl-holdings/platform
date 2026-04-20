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
