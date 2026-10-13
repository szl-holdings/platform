# Ovis evaluation hardening integration supplement — 2026-10-11

`workcell_id`: `OVIS-EVAL-HARDENING-20261011`

`purpose`: Preserve the original proof packet as an immutable record of the
first topic commit while recording the candidate after its normal-history
merge with canonical `main`. This supplement supersedes the original packet's
integration-specific file counts, lock digest, and test totals. It does not
rewrite or invalidate evidence that was correct at the original commit.

## Exact history and scope

- Original signed topic commit:
  `46eb6215a486be59af66fbe4910e2779fac42a09`.
- Canonical signed `main` commit:
  `690959d29c6d26f0f3f4a42ef91fd442067c186e`.
- Signed normal merge commit:
  `5c235cad7a1efc366522291d494e8aa8366712d8`.
- Merge parents, in order: `46eb6215a486be59af66fbe4910e2779fac42a09`
  and `690959d29c6d26f0f3f4a42ef91fd442067c186e`.
- Functional delta at the merge commit relative to canonical `main`: 28 paths,
  5,405 additions, and 72 deletions. This supplement itself is excluded from
  those functional-delta counts.
- Service lock SHA-256:
  `8ea6299600ee02b636dfe6daf955273fdd9c9170df5454c4afcdb7058c4b9f7a`.

The prior packet's 19-path/4,876-addition figures, lock digest, 77-test suite,
and 185-task typecheck are historical facts at the original topic commit, not
claims about this integrated tree.

## Integrated controls

- The candidate manifest, optional dependencies, lock, and runtime source bind
  Accelerate `1.15.0`, Transformers `5.3.0`, Torch `2.14.0`, and Qwen Omni
  Utils `0.0.9`.
- Contract tests bind manifest identity, the complete admitted artifact map,
  pyproject requirements, locked versions, runtime constants, and the lock
  digest.
- Ovis deployment rendering accepts only a lowercase 64-hex SHA-256 OCI
  digest. Both isolated templates retain `EVALUATION_HOLD`, disable general
  worker claims and development AEF endpoints, bind one tenant and one
  file-mounted key, limit Ovis to one request, and require local read-only
  inputs. The Kubernetes deployment uses `Recreate` and denied egress.
- The shared worker credential reader fails closed for symlinks, non-regular
  files, oversized or invalid UTF-8 values, empty values, and ambiguous direct
  plus file credentials.
- Ovis authentication runs before JSON parsing. The boundary caps declared and
  streamed request bodies at 10 MiB, and request models bound text, media,
  metadata, list, and profile fields.
- Development AEF routes require the explicit opt-in value
  `AEF_DEVELOPMENT_ENDPOINTS_ENABLED=1`; the isolated Ovis lane sets it to
  `0`.

## Verification on the integrated tree

| Check | Result |
| --- | --- |
| Merge topology and DCO trailers | Exact canonical main is the merge's second parent; both topic and merge commits carry `Signed-off-by` trailers. |
| Focused auth, model-identity, Ovis contract, and Ovis runtime suite | 74 passed; two dependency/runtime deprecation warnings. |
| Full service-local worker suite | 133 passed; two dependency/runtime deprecation warnings. |
| Clean external locked environment at `/tmp/ovis-cloud-venv` | Locked sync completed and the full suite passed 133/133. |
| Bounded workspace typecheck | 232/232 tasks succeeded at the exact merge commit. |
| Lock validation | `uv lock --check` passed and the lock digest matched the manifest. |
| GPU-extra resolution | Locked dry run resolved the four exact Ovis versions without downloading a checkpoint or installing the GPU closure. |
| Documentation and source-of-truth gates | `pnpm docs:check` passed; all 66 source-of-truth checks passed. |
| Deployment render checks | Digest rendering, Compose validation, Kubernetes YAML parsing, `Recreate`, capacity zero, development-endpoint disablement, and the literal HOLD passed. |
| Static hygiene | Changed Python compiled, JSON parsed, and `git diff --check` passed. |

The recommended reusable cloud install for the CPU runtime and test closure is:

```bash
UV_PROJECT_ENVIRONMENT=/workspace/.venvs/substrate-py-workers \
  uv sync --project /workspace/platform/services/substrate-py-workers \
  --locked --extra dev
```

The separate GPU evaluation image must use the locked Ovis extra when an image
build is eventually admitted:

```bash
uv sync --project services/substrate-py-workers --locked --no-dev --extra ovis
```

## Evidence boundary

The canonical manifest remains `EVALUATION_HOLD` with
`productionServingAllowed=false`, and no signed qualification-receipt parser or
verifier exists. No GPU execution, checkpoint download, owned image build,
published image digest, image SBOM, entrypoint/process-topology witness,
hardware receipt, or model qualification occurred. The supporting
processor/config inventory is not completely hash-bound. Kubernetes currently
accepts authenticated `cold` health for readiness; a qualified lane still
needs loaded-readiness or controlled prewarming. The template denies egress but
cannot choose a cluster-specific ingress allowlist, and input UID/GID access is
not proved here.

The OSV audit could not reach `api.osv.dev` through the current restricted
tunnel, so no vulnerability-free claim is made. `api.osv.dev` is the only
missing non-secret audit egress domain identified by this work.

`public_claim_check`: The integrated candidate is a CPU-side contract and
deployment-template hardening result. It is not evidence that Ovis is live,
qualified, deployed, or production-ready.

`recorded_at`: `2026-10-11T06:54:49Z`

`recorded_by`: CodexSmith (`/root/ovis_eval_hardening`)
