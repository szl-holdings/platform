---
name: Replit workflow port-readiness probe
description: How the workflow controller decides a service is "ready" and the FastAPI/uvicorn-specific gotchas.
---

The platform marks a workflow `FAILED` if it doesn't observe the declared port opening within the ready window (~180s). Two failure modes are common even when the process is healthy:

1. **Bind address**: a server bound to `127.0.0.1` is invisible to the probe even though `curl localhost:<port>` from the same shell works. Bind to `0.0.0.0` (or `::`) for the probe to register the open port. Set this via the artifact's env (e.g. `SENTRA_SIDECAR_HOST=0.0.0.0`); do not hardcode in source.
2. **Probe path**: the probe issues an HTTP GET against an unspecified path that can be `/`, `/health`, or `/healthz` depending on platform version. A FastAPI app that only defines `/api/...` returns 404 to the probe and is marked not-ready. Always declare a cheap `GET /`, `GET /health`, and `GET /healthz` returning JSON 200.

**Why:** Workflow status feeds the user-facing artifact health UI and downstream readiness gating. A substantively-working service that fails the probe still cascades — sentra-sidecar registered detectors fine over HTTP 201 for 6+ minutes but kept being marked FAILED because of bind address (127.0.0.1) and missing path aliases.

**How to apply:** For any FastAPI/Express/Fastify service mounted as a workflow, (a) confirm bind is `0.0.0.0`, (b) define `@app.get("/")`, `@app.get("/health")`, `@app.get("/healthz")` all returning a small ack. Probe failures with logs showing successful application startup are almost always one of these two causes — do not chase phantom port-collision or process-crash explanations first.
