---
name: Replit workflow port prober
description: Why a workflow can be marked FAILED ("didn't open port N") even when the service started cleanly.
---

Replit's workflow runner probes the configured port by dialing the container's external network interface, NOT loopback. A service that binds only `127.0.0.1` (uvicorn's default, Node `app.listen(port, "127.0.0.1")`, etc.) will accept loopback traffic fine and serve every internal client, but the port prober's connect will time out and the workflow flips to FAILED with `DIDNT_OPEN_A_PORT`.

**Why:** uvicorn's banner is misleading — `Uvicorn running on http://127.0.0.1:8765` looks healthy in logs, but it means the prober (which connects via the container interface) cannot see the port at all.

**How to apply:** for any new sidecar / dev workflow, bind `::` (dual-stack) or `0.0.0.0` from the start. Export the host env var in the dev script rather than relying on the code default — code defaults get overridden by stray env vars in unexpected ways.

Related: restarting a workflow does not always reap the old process holding the port. After a restart that yields `Port N is already in use`, free it with `lsof -ti :N | xargs -r kill -9` (or kill the named process) before restarting again. `fuser` is not available in the Replit Nix env.
