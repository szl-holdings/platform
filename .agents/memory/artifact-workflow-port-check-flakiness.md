---
name: Artifact workflow port-check flakiness
description: A workflow can fail repeatedly with DIDNT_OPEN_A_PORT even when vite prints "ready" and binds the port, due to stale router/registration state — retrying or re-restarting eventually succeeds without further code change.
---

When an artifact workflow times out with `DIDNT_OPEN_A_PORT N` but vite's log shows `ready in NNN ms` with `Local: http://localhost:N/...`, the bind succeeded inside the artifact namespace; the failure is the artifact-router not registering the port from outside. This can persist across many `restart_workflow` calls and look like a code bug.

**Why:** The two known healthy port patterns (`localPort=9090 + VITE_PORT=X` → router proxies to vite; `localPort=PORT=N` → vite binds directly) both work in production, but switching between them via `verifyAndReplaceArtifactToml` can leave the router in a stuck state where it keeps probing an old port. The state eventually clears.

**How to apply:** Before doing more code/config changes, (1) confirm vite is actually binding via `/proc/<pid>/net/tcp6` or a manual foreground run, (2) pick ONE pattern and stop switching, (3) retry `restart_workflow` a few times spaced over a minute or two, (4) if still stuck, escalate to checkpoint rollback rather than further toml edits — additional edits compound the stuck-state risk. Do not assume vite or vite.config is broken when its own log proves the bind succeeded.
