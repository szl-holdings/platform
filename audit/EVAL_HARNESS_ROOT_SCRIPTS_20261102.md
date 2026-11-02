# Eval Harness Root Script Repair Proof Packet

- `workcell_id`: `EVAL-HARNESS-ROOT-SCRIPTS-20261102`
- `agent`: OpenAI Codex
- `objective`: Repair the two root eval-harness scripts so they invoke the current checked-in harness and fail visibly if their targets drift.
- `recorded_at`: `2026-11-02T04:48:04Z`
- `reconciled_at`: `2026-11-02T06:08:00Z`
- `recorded_by`: OpenAI Codex
- `proof_level`: 2 (Standard Proof)

## Plan summary

1. Trace the aliases through repository history and current manifests.
2. Replace the missing `@workspace/eval-harness` filter with the authoritative current harness entry points.
3. Add a dependency-free manifest contract test and run the focused offline checks available in this environment.
4. Keep the patch disjoint from platform PR #1002 and avoid dependency installation, downloads, deployment, and publication.

## Source authority

- Commit `b5f99976ad1c9f703ad2f85678ca9da73cafb92c` / PR #138 introduced `apps/eval-runner` as the Series-A reproducibility harness.
- Commit `4040e16200ac036bed5041e70c4757f674f22a57` / PR #140 added the two root aliases while explicitly citing PR #138. It pointed them at `@workspace/eval-harness`, but that package was not present in that tree.
- Organization code search on 2026-11-02 found `@workspace/eval-harness` only in the two broken root aliases. The current `apps/eval-runner` contains `STANDARD_SUITE`, `test_app_eval.py`, and `test_suite_reproducibility.py`.
- `@workspace/aef-evals` predates the aliases and is explicitly the Alloy Embedding Fabric retrieval evaluator, so it is not the generic standard-suite harness introduced by PR #138.
- GitHub main was `21d4ee44d4eb9b3a8fcb30530b02f9de6ff52537` when this work began. The local blobs for `package.json`, the two target tests, and the existing clean-clone regression suite exactly matched that main revision before editing.
- The published candidate was first based on `590e0c9f279d7ec2083c31581499825416a647a7`, after merged PR #1002. It was then reconciled without rewriting history using prior reviewed head `26d2da8be6ca5a641c80eec0ad2c0ce2982b7a88` and exact current main `a41f03e9fa52231f3b2a6b32cea7af57989c0c6d` as parents.
- The main advance changed only `scripts/qa/capture-cyber-build-witness.mjs` and its focused test. Neither overlaps this patch, whose current-base diff remains the same five paths.
- Main then advanced through PR #1005 to `9b72438f25faa3474a0933a4a775aff46594ed1b`, sharing `package.json`. The second non-force reconciliation uses prior head `e5028603c4c7fe874fd93ec8d94aaa5cf8a9bf77` and that exact main as parents, applies only the four intended script hunks to the new manifest, and preserves the Vitest `4.1.12` floors plus the lockfile, workspace overrides, security contract, and SBOM state from #1005.
- Main then advanced through PR #1010 to `0bf3657ecc7aa15ac8372beddfc9421209168fec`. That merge changes eight AEF benchmark workflow, report, documentation, implementation, and governance paths, all disjoint from this patch. The third non-force reconciliation uses prior head `737ebe34ece8de1b70cc6e3114a91d143724cd01` and that exact main as parents, preserving every #1010 blob while retaining the #1005 dependency, lockfile, security-contract, and SBOM state.
- Main then advanced through PR #1008 to `e25305761b2c2ff71aa2d142dec3b404369078b5`. That merge changes six AEF offline-opt-in source, test, documentation, known-gap, and proof paths, all disjoint from this patch. The latest non-force reconciliation uses prior head `d35b27e2f1ed4bb12dd7e8118490856894715003` and that exact main as parents, preserving every #1008 and #1010 blob plus the #1005 dependency and evidence state.

## Patch summary

- `package.json`: point `eval-harness:run-standard` at the offline standard-suite behavioral tests and `eval-harness:reproduce` at the cross-process content-hash tests through the repository Python launcher. Register the manifest contract in clean-clone and root test gates.
- `scripts/ci/eval-harness-scripts.test.mjs`: assert both aliases have their canonical commands, their checked-in targets exist, and the nonexistent package name cannot return silently.
- `apps/eval-runner/conftest.py`: resolve the eval-runner root to `apps/eval-runner/`, as its comment and `src` imports require.
- `apps/eval-runner/test_suite_reproducibility.py`: use the same correct root in fresh subprocesses. The previous extra parent traversal inserted `apps/` and failed with `ModuleNotFoundError: src`.

No route, UI, database, workflow, dependency, credential, model, or data changes are included. The changed paths do not overlap the nine files in platform PR #1002, the two files in platform PR #1001, the eight files in platform PR #1010, or the six files in platform PR #1008. PR #1005 shares `package.json`; only the two test-list insertions and two eval-alias replacements belong to this patch.

## Test results

| Command | Exit | Result |
| --- | ---: | --- |
| `pnpm typecheck` before and after the patch | 1 | Blocked before TypeScript execution both times: repository requires pnpm `10.26.1`; the runner provides `11.19.0`. No package-manager or dependency installation was performed. |
| `node --test scripts/ci/eval-harness-scripts.test.mjs` | 0 | Both manifest and target assertions passed. |
| `node scripts/check-clean-clone.mjs && node --test ... scripts/ci/eval-harness-scripts.test.mjs ...` | 0 | Every selected clean-clone and governance check passed. |
| Inline stdlib runner over every `Test*::test_*` method in `test_suite_reproducibility.py` before the root fix | 1 | Negative control reproduced `ModuleNotFoundError: No module named 'src'` in the fresh subprocess. |
| The same inline stdlib reproducibility runner after the root fix | 0 | Every existing reproducibility assertion passed, including independent Python subprocess comparisons. |
| Inline offline `STANDARD_SUITE` scoring and hash assertions | 0 | Every standard case scored correctly; suite hash matched a fresh canonical hash. |
| `node ops/python/run-python.mjs -m py_compile ...` for the eval-runner configuration, tests, and source modules | 0 | Python syntax and launcher path handling passed. |
| `node ops/python/run-python.mjs -m pytest -q apps/eval-runner/test_suite_reproducibility.py` | 1 | The selected runner has no `pytest` module. The task forbids installing dependencies; the harness README documents pytest as a test prerequisite. The underlying assertions were executed with the stdlib runner above. |
| `git diff --check` | 0 | No whitespace errors. |

## Verification notes

The root aliases now name concrete tracked tests in the harness introduced by PR #138. The Node contract is dependency-free and is part of both clean-clone verification and the root test gate, so a future rename, deletion, or return to the nonexistent workspace filter fails CI instead of producing an empty pnpm filter success. The cross-process negative control demonstrated that the target itself was broken before the two path corrections; all of its assertions passed afterward.

## Screenshot references

Not applicable. No UI surface changed.

## Public claim check

No public product or compliance claim changed.

## Security check

No secrets, tokens, credentials, environment files, network calls, model downloads, or production data were added or used.

## Known-gaps update

No matching entry existed in `docs/operations/known-gaps.md`, and this patch introduces no new operational gap. The environment-only pnpm/pytest limitations above remain explicitly bounded validation limits, not source changes.
