---
name: Artifact direct-bind port pattern is broken
description: Artifacts whose `artifact.toml` sets `localPort == services.env.PORT` (vite/expo binds the same port the workflow prober probes) consistently fail with DIDNT_OPEN_A_PORT — even when the dev server reports ready and TCP connects succeed. Only the shared-proxy:9090 pattern is reliable.
---

When an artifact's `localPort` equals the port the dev server itself binds
(rosie 25263, vessels-pitch 24631, rosie-mobile 24050), the workflow prober
reports `DIDNT_OPEN_A_PORT N` even though:
- vite's banner shows `ready in <300ms>` with `Local: http://localhost:N/<base>/`
- Manual TCP connect to `127.0.0.1:N` and the container interface (e.g.
  `172.24.0.2:N`) returns instantly with a valid HTTP response.
- Expo prints `Waiting on http://localhost:N` (Metro bundler is up).

Switching `--host 0.0.0.0` ↔ `--host ::`, swapping `pnpm --filter` for
`bash -c exec node_modules/.bin/vite`, and adding `scripts/kill-stale-vite-ports.sh`
as a pre-hook do NOT fix it. The prober is doing something more than a TCP
connect, and the direct-bind pattern triggers it.

The known-good pattern is the one all sibling artifacts use:
`localPort = 9090` (with `reusePort: true` via `sharedProxyPlugin()` in
vite.config) + `VITE_PORT = <distinct>` for the actual dev server. The
shared-proxy listens on 9090 and proxies prefix-routed traffic to the vite
port. Prober probes 9090 → shared-proxy answers → success.

**Why:** documented in `CHANGELOG.md` under the original `artifacts/command`
cold-start flap fix — separating localPort from the dev server port broke a
race that the prober is sensitive to. The race is not on the local container
but in the artifact-router's view of the port.

**How to apply:** when creating a new react-vite / slides / expo artifact,
default to the shared-proxy pattern from day one (localPort=9090,
VITE_PORT=<unique>, `sharedProxyPlugin()` in vite plugins, add the
artifact's prefix → vite port to `PROXY_ROUTES` in
`packages/shared-proxy/src/index.ts`). Do NOT use `localPort = PORT` even
though `verifyAndReplaceArtifactToml` accepts it — it will silently fail at
runtime with DIDNT_OPEN_A_PORT.

For existing failed artifacts (currently rosie, vessels-pitch, rosie-mobile)
the migration is non-trivial because shared-proxy's `PROXY_ROUTES` is a
hard-coded list that doesn't yet include `/vessels-pitch/`, and rosie's
existing `/rosie/` route still points at the legacy API_PORT redirect from
when rosie was folded into Sentra. Both need refactoring before the pattern
swap will route correctly.
