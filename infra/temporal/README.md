# Local Temporal dev server

The `temporal-worker` and `temporal-approval-worker` services in
`artifacts/api-server` need a Temporal Frontend reachable at
`localhost:7233` to register and drain workflows. In production this is a
managed Temporal cluster; in dev / Replit workspaces we ship an embedded
dev server based on Temporal CLI (downloaded and cached on first run by
the `@temporalio/testing` package — no extra system install needed).

## One-command bring-up

```bash
pnpm --filter @szl-holdings/temporal-tests run dev:server
```

This boots the Temporal Frontend on `127.0.0.1:7233`, pre-creates the
`default` namespace, and exposes a tiny HTTP health endpoint on `:7234`
(`/healthz`). Data is in-memory and is reset every time the server
restarts.

To persist between restarts, set `TEMPORAL_DEV_DB=/path/to/temporal.db`
before running. To enable the Temporal Web UI, set
`TEMPORAL_DEV_UI_PORT=8233`.

Leave the process running and bring up the workers in another shell:

```bash
# main worker (szl-platform task queue)
pnpm --filter @szl-holdings/temporal-tests run worker:start

# agent-gateway approval worker (approval-task-queue)
pnpm --filter @szl-holdings/temporal-tests run worker:approval:start
```

Both workers point at `localhost:7233` by default (override via
`TEMPORAL_ENDPOINT`). They will print `[temporal-readiness] reachable …`
followed by `running` once they have registered with the dev server.

## What if I don't bring it up?

The two worker scripts (`scripts/start-worker.ts` and
`scripts/start-approval-worker.ts`) short-circuit cleanly when the
Temporal Frontend is unreachable: they probe for ~5 seconds and then
`exit(0)` with a clear `Temporal Frontend unreachable — no
TEMPORAL_ENDPOINT configured; exiting cleanly` log line. The workflow
shows as "finished" rather than "failed" on a fresh clone, and approval
flows that touch Temporal are no-ops until you bring the dev server up.

## End-to-end smoke tests

Two smoke tests verify the full approval round-trip without needing the
shared dev server (they spin up their own ephemeral Temporal):

```bash
# verifies generic workflow registration + execution
pnpm --filter @szl-holdings/temporal-tests run worker:smoke

# verifies the agent-gateway production approval code path end-to-end
pnpm --filter @szl-holdings/temporal-tests run worker:approval:smoke
```

Both exit `0` on success and print `[smoke] OK — …`.

## Files

- `platform/temporal/scripts/dev-server.ts` — embedded dev server entry
- `platform/temporal/scripts/start-worker.ts` — main worker entry
- `platform/temporal/scripts/start-approval-worker.ts` — approval worker
- `platform/temporal/scripts/wait-for-temporal.ts` — TCP readiness probe
- `platform/temporal/scripts/smoke-test.ts` — generic E2E smoke
- `platform/temporal/scripts/smoke-approval-worker.ts` — approval E2E smoke
