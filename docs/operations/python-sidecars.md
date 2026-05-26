# Python Sidecars — deploy survival inventory

Background: task #5191 surfaced a class of bug where Python sidecars assumed a
dev-only `.pythonlibs/` directory or a `start.sh` invocation that never runs
in production, so a clean deploy left them silently broken. Task #5260 sweeps
the rest of the fleet and codifies the contract every sidecar must satisfy.

The contract — every Python sidecar that participates in a Replit deploy MUST
have:

1. **An idempotent bootstrap script** that (a) creates a `.venv`, (b) installs
   the runtime dependencies into that venv (never the system / user-site), and
   (c) verifies importability before declaring ready. Verification by file
   presence inside the venv's own `site-packages`, NOT by bare `python -c
   "import X"` — the bare import can succeed against PEP 370 user-site or
   system packages even when the venv is empty.
2. **A deploy hook** that invokes the bootstrap. For the api-server production
   path this is `artifacts/api-server/package.json` `start` (which runs before
   the Node process exec). For dev-only sidecars co-launched from
   `artifacts/api-server/start.sh`, the hook lives in that script.
3. **A `/health` (or `/healthz`) endpoint** that returns 200 once the service
   is ready to accept work.

The CI check `scripts/check-python-sidecar-bootstraps.sh` (registered as the
`python-sidecar-audit` validation workflow) fails when any entry below is
missing its bootstrap, its deploy hook, or its idempotency guard. It also
fails when a new `pyproject.toml` lands under `services/` or `apps/` without
being registered or allowlisted — so the inventory cannot silently drift.

## Inventory

| Sidecar | Bootstrap | Deploy hook | Port | Health |
|---|---|---|---|---|
| `services/sentra-core` | `services/sentra-core/scripts/bootstrap.sh` | `artifacts/api-server/package.json` (`pnpm start`) **and** `start.sh` | n/a (subprocess via `sentra-core-bridge.ts`) | `python -m sentra_core.cli` round-trip probe in bootstrap |
| `services/amaru` | `services/amaru/scripts/bootstrap_venv.sh` | `artifacts/api-server/start.sh` (dev co-launch) + artifact `[services.development]` `amaru` | 6810 | `GET /healthz` (alias `/health`) |
| `services/sentra-detector-sidecar` | `scripts/sentra-sidecar-dev.sh` (stamp-gated) | `artifacts/api-server/start.sh` (dev co-launch) + artifact `[services.development]` `sentra-sidecar` | 8765 | `GET /health` |
| `apps/eval-runner` | `apps/eval-runner/scripts/bootstrap.sh` | `artifacts/api-server/start.sh` (dev co-launch) | 8001 | `GET /health` |

## Allowlisted (NOT part of the Replit deploy surface)

These ship via Docker / external orchestration and are intentionally excluded
from the bootstrap audit. If any of them are ever wired into the api-server
deploy, they must be moved into the inventory above.

| Path | Reason |
|---|---|
| `services/substrate-py-workers` | Ships as Docker image; deployed via k8s (`services/substrate-py-workers/deploy/k8s-service.yaml`). |
| `apps/substrate-inference` | Ships as Docker image; runs on a GPU pod outside Replit. |
| `services/lyte-metrics-store` | Not currently wired into any Replit deploy hook. |
| `services/meridian_control_plane` | Python CLI/library invoked by `pnpm run meridian:*` scripts; not a long-running service. |
| `services/meridian_forecast_lab` | Python CLI/library; same as above. |
| `services/verticals` | Library — vertical pack registry imported by the meridian CLIs. |

## Production gap (knowingly deferred)

The api-server production entry point (`pnpm --filter @workspace/api-server
start`) currently only bootstraps `sentra-core`, because it is the only sidecar
invoked in-process via subprocess (`sentra-core-bridge.ts`). The network
sidecars (`amaru`, `sentra-detector-sidecar`, `eval-runner`) are bootstrapped
and launched from `artifacts/api-server/start.sh`, which runs under the
`dev:fast` script — i.e. development only.

Reaching the network sidecars in production requires either (a) bringing them
into the `pnpm start` chain (and accepting their cold-start cost on every
autoscale boot) or (b) deploying them as separate Replit services with their
own autoscale targets. That decision is intentionally NOT made by this audit
— the audit only guarantees that every bootstrap script exists, is idempotent,
and is referenced from at least one deploy hook so that whenever a sidecar
*is* started in any environment, it will not crash on missing dependencies.

## When adding a new Python sidecar

1. Create `<sidecar>/scripts/bootstrap.sh` (copy from
   `services/sentra-core/scripts/bootstrap.sh` and adapt the dependency check).
2. Wire it into the appropriate deploy hook (`pnpm start` for in-process
   subprocess sidecars, `start.sh` for co-launched network sidecars).
3. Add the sidecar to the inventory table above AND to the `SIDECARS` array
   in `scripts/check-python-sidecar-bootstraps.sh`.
4. Run `bash scripts/check-python-sidecar-bootstraps.sh` locally; CI will
   fail your PR until the audit passes.
