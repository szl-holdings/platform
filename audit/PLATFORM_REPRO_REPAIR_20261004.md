# Platform reproducibility repair — 2026-10-04

## Workcell and plan

- Workcell: `platform-repro-20261004`, follow-up to platform PR #882.
- Actor: ChatGPT; internal build-proof repair.
- Published input: `24d206e26a56928cda93ac3326eaf0fe3601bf91`.
- Full native builds measured at `1c0950d3a9d101a6669c007aae27e8a33572f7b3`.
- Storybook correction measured at `d5d9325f406d46e15fc9f069a396a75f332fcb30`.
- Proof level: 2. Application readiness remains unchanged.
- Recorded: 2026-10-04T19:12:42.693291+00:00.

The scoped plan was recorded before editing. AGENTS.md, non-negotiables, proof
doctrine, current known gaps, the native Turbo graph and existing RuntimeAudit
install settings were reviewed. The work preserves frozen dependency installation,
approved lifecycle scripts and existing security gates, verifies the bundled CPU
runtime, and replaces the old fallback archive with measured output coverage.
No UI or application route changes require screenshots.

## Failure and source repair

The exact published [repro job](https://github.com/szl-holdings/platform/actions/runs/37221895699/job/111493742794)
failed while the ONNX postinstall script attempted an external optional binary
download. The build-proof steps were never reached. Its historical result remains
a failure. Source review also found that the old proof ignored build failures,
archived a nonexistent root `dist` directory, and could compare empty fallback
archives. Those paths could not establish reproducibility.

The workflow now installs from the unchanged lockfile with the same
`ONNXRUNTIME_NODE_INSTALL=skip` setting already used by RuntimeAudit and Lighthouse.
The [official ONNX Runtime 1.24.3 installer](https://github.com/microsoft/onnxruntime/blob/3a728b75062256951b6e19ce718907cf1a1d4cf0/js/node/script/install.js)
honors that setting before its package download phase. Its
[Linux/x64 metadata](https://github.com/microsoft/onnxruntime/blob/3a728b75062256951b6e19ce718907cf1a1d4cf0/js/node/script/install-metadata.js)
selects CUDA/TensorRT provider libraries for that extra download; the CPU runtime
and Node binding are already in the locked npm package. The new smoke helper
resolves ONNX through the actual workspace Transformers.js consumer and runs an
owned ONNX Identity model on CPU. It fetches no model or provider asset.

The unchanged Node 24 and pnpm 10.26.1 versions and existing action pins remain
in use. The 6 GiB Node heap matches RuntimeAudit and native build/typecheck jobs.
The workflow retains only `contents: read`, has a 40-minute job bound and cancels
superseded runs. It does not change dependency overrides, action trust,
vulnerability classification, scanner thresholds or merge policy.

## What the proof now requires

1. Two fresh exact-source checkouts at the same workspace path, with separate
   frozen installs and install side-effect cache reuse disabled. Approved scripts
   still run. The first build's proof is kept outside the checkout.
2. A real Turbo dry-run plan matching the checkout, package names and native
   task commands. Local and remote Turbo caches are disabled for both builds.
3. Removal of reviewed generated output roots and package compiler state before
   each build. Validation of the entire removal set precedes any deletion;
   unknown roots, symlinks, Git/dependency internals and nonregular files fail.
   This also removes tracked generated clients and the estate manifest. A fresh
   checkout alone would retain those files, and the existing codegen command
   explicitly skips generation while they exist.
4. Successful native build/codegen execution and nonempty output for every real
   task in the plan. The existing estate manifest is the only reviewed special
   task with an empty Turbo output declaration. Unsupported output patterns,
   empty plans, missing output, tar errors and upstream failures remain fatal.
5. Equality of source, task coverage, relative file paths, modes, sizes, SHA-256
   hashes and deterministic archive hashes. Tar ownership and mtimes are fixed;
   generated file bytes are not normalized. JSON receipts are uploaded even
   after failure for diagnosis. No empty archive or success fallback remains.

True regeneration exposed a missing build-graph edge: estate-contract-release
started before api-spec codegen and failed on the missing generated clients.
The exact `@szl-holdings/api-spec#codegen` task is now an explicit dependency of
the estate manifest build. Native Turbo dry-run output confirms the dependency,
and the real clean build subsequently regenerated clients before the manifest.
No generated-source changes from local qualification are part of this patch.

## MEASURED local verification

| Check | Exit | Observation |
|---|---:|---|
| `node --test scripts/ci/repro-artifacts.test.mjs` | 0 | 24 passed, zero skipped. |
| `node scripts/ci/verify-onnx-cpu.mjs` | 0 | Actual ONNX 1.24.3 CPU inference returned the expected tensor. |
| Native Turbo dry run | 0 | 46 executable tasks; estate waits for api-spec codegen. |
| First native build with default Node heap | 134 | API-client compilation exhausted the local 2 GiB default; no proof was emitted. |
| Native build with the existing CI heap, before generated cleanup | 0 | 46 tasks passed, zero cached; retained generated inputs mean this is not clean-generation proof. |
| First actual cleanup/build, before task-edge repair | 1 | Estate manifest correctly failed on missing generated clients. |
| Clean generation A after task-edge repair | 0 | 46/46 tasks, zero cached, 3m43s; Orval and estate manifest actually ran. |
| Clean generation B before metadata correction | 0 | 46/46 tasks, zero cached, 3m08s. |
| Exact A/B byte comparison before metadata correction | 1, expected | Failed on one file: Storybook project metadata `generatedAt`; the other 3,455 files matched. |
| Two corrected Storybook dependency-graph builds | 0 | 10/10 tasks and 310 files each, zero cached; exact bytes/modes/archives match. |
| Before/after full `pnpm typecheck` | 1 | Same nested Corepack pnpm 11.9.0 request fails with registry `EAI_AGAIN`; full typecheck remains incomplete. |
| Actionlint, changed-file Biome, and `git diff --check` | 0 | Workflow and changed source passed. |

The 24 contracts cover output coverage, empty/no-op tasks, stale tracked outputs,
incremental state, source mismatch, path escapes, symlinks, unsafe cleanup roots,
tar failure, file metadata/byte changes, tampered receipts and actual workflow
install/plan/build failure propagation. Independent source review found no
blocking cleanup, root-validation or workflow-ordering defect; the reviewer did
not rerun the native builds.

The failed complete comparison is retained: archive A SHA-256
`a4be7b02aef1a8b1025ae4ba9c30191a2088ef969b51182748a1245639cf651c`
and archive B
`3592c18d694bb7866257920d390ff0b95050ffa1abd8594b871b33a84112023a`.
The only differing member was `packages/storybook/dist/project.json`, whose
`generatedAt` field records wall-clock telemetry collection time.

The focused correction sets Storybook's documented
[`core.disableProjectJson`](https://storybook.js.org/docs/8/api/main-config/main-config-core#disableprojectjson)
to true. The pinned 8.6.18 implementation guards optional project-metadata
extraction separately from story-index and preview generation. This intentionally
removes the optional metadata file/endpoint; every emitted artifact still enters
the unmodified comparison. It does not disable rendering, stories, docs,
accessibility addons, sourcemaps or tests. The workflow also watches this config.

Two native Storybook dependency-graph regenerations at the corrected source
passed 10 tasks each in 19.91s and 19.33s, with zero Turbo cache hits. Their
310-file archives both have SHA-256
`1447508f4105d725ede3bec87346b8910871ca05f9dad1fcd14b6cc26d5d6d10`.
All 110 retained Storybook output files are byte-, size-, path- and mode-identical
to the prior build; the only removed file is optional `project.json`. This is a
scoped local follow-up, not a claim that the full revised workflow has passed.

Native commands used the repository's pnpm 10.26.1 with the existing 6 GiB heap
and telemetry opt-out. The full graph commands were:

```sh
node --test scripts/ci/repro-artifacts.test.mjs
node scripts/ci/verify-onnx-cpu.mjs
pnpm exec turbo run build --cache=local:,remote: --dry=json > "$PLAN"
node scripts/ci/repro-artifacts.mjs prepare "$PLAN"
pnpm exec turbo run build --cache=local:,remote: --concurrency=2
node scripts/ci/repro-artifacts.mjs capture "$LABEL" "$PLAN" "$PROOF_DIRECTORY"
```

The focused Storybook builds added `--filter=@workspace/storybook` to their
native plan/build invocations; the hosted full-graph workflow has no filter.
The local comparison independently rehashed both stored tar archives and
compared all captured task and file metadata. Its receipt explicitly states
that the local dependency installation was reused; it does not emit the hosted
workflow's two-fresh-checkout success claim.

## Evidence limits and remaining gates

These are local measurements. Dependencies were already installed in the local
qualification worktree; the two native rebuilds do not establish the hosted
two-fresh-checkout/two-install contract. That workflow must pass at the eventual
published head. Local source commits will have different identities from any
provider-signed publication commit; the publication packet binds the reviewed
tree and preserves its actual parent.

The claim is same-run declared-output equality, not cross-day hermetic
reproducibility, release qualification or SLSA attestation. Existing Orval code
stamps the UTC date and appends a type export to `lib/api-zod/src/index.ts` during
generation. That existing behavior was observed and its local side effects were
restored before creating this source packet. A date change or any output drift
must fail comparison; this patch adds no byte normalization to conceal it.

The exact published dependency audit and Grype reports still contain High
`braces@3.0.3` and `node-forge@1.4.0` findings. Their native security gate remains
failed. This work does not waive either advisory or characterize the earlier
backport as an official patched release. The existing DOMPurify candidate #889
was reviewed separately and is not included here; combined dependency and
security qualification is required if that candidate is later integrated.

No secrets, credentials, production data or environment values are added. There
are no provider writes or deployments in this workcell. The known-gap supplement
records the local repair and incomplete hosted proof; the application remains
an active prototype with unchanged readiness status.
