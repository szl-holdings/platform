# Ovis evaluation hardening proof packet — 2026-10-11

`workcell_id`: `OVIS-EVAL-HARDENING-20261011`

`agent`: CodexSmith (`/root/ovis_eval_hardening`)

`objective`: Restore the canonical Ovis dependency identity, make drift and
mutable evaluation images fail closed, isolate the hold-only deployment lane,
and produce reproducible CPU-side evidence without representing the candidate
as GPU-tested or model-qualified.

`plan_summary`:

1. Bind the candidate manifest, Python optional dependencies, uv resolution,
   runtime constants, verified artifact inventory, and runtime version checks.
2. Keep the general worker lane Ovis-disabled and introduce isolated Compose
   and Kubernetes templates rendered only with an exact OCI digest.
3. Harden runtime admission, authentication, snapshot/CAS handling,
   concurrency, container privileges, storage, identity, and egress.
4. Add CPU-only contract coverage and a path-scoped hosted workflow. Exercise
   the locked runtime/test closure in both the project environment and a clean
   external cloud virtual environment.
5. Preserve `EVALUATION_HOLD` and record every GPU, image, model, receipt, and
   vulnerability-audit boundary that cannot be proved in this environment.

`patch_summary`: 19 paths changed; 4,876 additions and 39 deletions in the
staged patch that includes this proof.
The patch:

- restores Transformers `5.3.0`, pins the four model-critical Ovis
  distributions exactly, adds a 131-package service-local `uv.lock`, and binds
  its SHA-256 into the manifest;
- binds manifest identity, artifact path/digest/size records, pyproject
  requirements, lock versions, and runtime constants with static contracts;
- fails health/load on dependency drift, reads one bounded regular secret
  file without following symlinks, rejects unsafe snapshot/CAS trees, requires
  a flattened explicit snapshot, maps admission failures to stable HTTP
  responses, and admits one in-flight request per process;
- disables Ovis in general worker examples and adds digest-rendered isolated
  Compose and Kubernetes templates with non-root execution, read-only inputs,
  dropped capabilities, denied pod egress, bounded temporary storage, one GPU,
  and literal `EVALUATION_HOLD`;
- adds path-scoped CPU contract CI with Python 3.12 and uv 0.12.19; and
- documents cold-readiness semantics, single-process and UID/GID requirements,
  incomplete model inventory, and missing image/GPU/qualification evidence.

`test_results`:

| Command or check | Exit | Result |
| --- | ---: | --- |
| `corepack pnpm install --frozen-lockfile --ignore-scripts` | 0 | Baseline dependency install passed for 204 workspace projects with pnpm 10.26.1. |
| `CI=1 PATH=/tmp/ovis-pnpm-bin:$PATH pnpm exec turbo run typecheck --concurrency=1` | 0 | 185/185 tasks passed; 106 were cached; bounded run completed in 18m41s. |
| `uv lock --check --project services/substrate-py-workers` | 0 | The 131-package lock is current. |
| lock SHA comparison script | 0 | `uv.lock` and manifest both resolve to `d29d5034e93b223a3c62a63ce324ae74fcfa7bb828300be45b6bbf5a9f3a1b14`. |
| `uv sync --project services/substrate-py-workers --locked --extra dev` | 0 | Locked CPU runtime and test closure installed. |
| `uv sync --project services/substrate-py-workers --locked --no-dev --extra ovis --dry-run` | 0 | Exact Accelerate 1.15.0, Transformers 5.3.0, Torch 2.14.0, and Qwen Omni Utils 0.0.9 resolved without installing GPU packages. |
| `OTEL_SDK_DISABLED=true uv run --project services/substrate-py-workers --locked --extra dev pytest services/substrate-py-workers/tests/test_ovis_contract.py services/substrate-py-workers/tests/test_ovis_omni.py -q` | 0 | 23/23 focused Ovis tests passed; two existing deprecation warnings. |
| `OTEL_SDK_DISABLED=true uv run --project services/substrate-py-workers --locked --extra dev pytest services/substrate-py-workers/tests -q` | 0 | 77/77 worker tests passed; two existing deprecation warnings. |
| `UV_PROJECT_ENVIRONMENT=/tmp/ovis-cloud-venv uv sync --project /workspace/platform-ovis-hardening/services/substrate-py-workers --locked --extra dev` followed by that environment's pytest | 0 | Clean external-target install succeeded and 77/77 worker tests passed. |
| digest renderer + `docker compose ... config --quiet` | 0 | Registry-with-port image rendered and Compose validated; Kubernetes parsed as exactly Service, Deployment, and NetworkPolicy with the exact image digest. |
| `python -m py_compile` over changed Python files plus workflow YAML assertions | 0 | Source compiled and the workflow structure parsed successfully. |
| `pnpm docs:check` | 0 | Documentation catalogue check passed. |
| `pnpm audit:source-of-truth` | 0 | All 66 source-of-truth checks passed. |
| `pnpm qa:routes` | 1 | Environment baseline blocker: all 86 configured HTTP routes refused connection because no application servers were running. This patch has no UI route and its changed Ovis HTTP behavior is covered by the passing FastAPI tests. |
| `git diff --cached --check` | 0 | No whitespace errors. |
| high-confidence credential-pattern scan over staged added lines | 0 | 4,876 added lines scanned; zero private-key, AWS, GitHub-token, or OpenAI-key patterns found. |
| `uv audit --locked --project services/substrate-py-workers` | 2 | Audit could not reach `api.osv.dev` through the current restricted tunnel. No vulnerability-free claim is made. |

Initial repository typecheck attempts were also recorded: the unpinned nested
pnpm invocation stopped before source checking on a non-interactive modules
replacement; a Corepack-pinned attempt could not resolve `registry.npmjs.org`;
and the first correctly pinned parallel run reached 106 successful tasks before
two unrelated TypeScript processes were killed with exit 137. The final
single-task run above supersedes those resource and bootstrap failures.

`screenshot_refs`: Not applicable. No browser or other UI surface changed, so
there is no route or screenshot-catalog entry to capture.

`verification_notes`: Contract tests compare the full admitted artifact map,
dependency versions, lock digest, promotion state, renderer rejection cases,
general-lane disablement, and deployment hardening. Runtime tests cover gate
error mapping, invalid health state, dependency drift, secret file rejection,
flat snapshot enforcement, CAS integrity, process serialization, and HTTP 429
concurrency admission. The clean external environment confirms the onboarding
install shape independently of the service-local virtual environment. The
independent patch reviewer reran the effective focused/full suites and found no
remaining critical patch-level defect.

`public_claim_check`: Passed. The candidate remains explicitly
`EVALUATION_HOLD`; the patch introduces no claim of GPU execution, live model
readiness, qualification, deployment, customer use, or production serving.

`security_check`: Passed within available tooling. No secret, token, `.env`
value, or qualification receipt was added. A high-confidence scan of every
staged added line found zero matches and `git diff --cached --check` passed.
`gitleaks` is not installed in this environment, so no local gitleaks result is
claimed; hosted repository security checks remain authoritative.

`known_gaps_update`: `docs/operations/known-gaps.md` records the blocked OSV
audit, incomplete processor/config hash inventory, unpublished image and
entrypoint, unproved UID/GID input access, process-local concurrency scope,
cold Kubernetes readiness, absent GPU execution, receipt ownership/content
gap, and missing image/lock digests in runtime receipts.

`proof_level`: 4 — Full Proof. HTTP behavior and deployment contracts changed;
the public-claim, security, and known-gap checks are recorded above. No UI
surface exists for screenshot evidence.

`recorded_at`: `2026-10-11T06:19:22Z`

`recorded_by`: CodexSmith (`/root/ovis_eval_hardening`)

## Evidence boundary

The lock was resolved and CPU-side contracts ran without model secrets or a
GPU. The GPU extra was not installed, no checkpoint was downloaded, and no
embedding was produced. Registry access did not yield an owned immutable base
or evaluation image. There is no admitted image digest, image-entrypoint
receipt, hardware execution receipt, complete snapshot inventory, Forge-owned
qualification receipt, deployment witness, or basis for moving this candidate
beyond `EVALUATION_HOLD`.
