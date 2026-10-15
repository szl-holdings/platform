# Killinchu release binding — 2026-10-15 UTC

Workcell: `platform-killinchu-binding-4a434f8-20261015`

Agent and recorded by: Codex

Recorded at: 2026-10-15T01:03:00Z

Proof level: 2 (source and evidence correction; no UI or runtime change)

Evidence: **MEASURED**, scoped to the commands and observations below.

## Plan and change

The plan recorded before editing was to verify the newer immutable Killinchu
release, update the three exact expected identifiers and matching fixtures,
and replace only the corresponding registry note and generated manifest note.
All response predicates, source-of-truth data, registry-wide observation times,
route classifications, and required release checks remain unchanged.

The full main-branch witness
[38662934564](https://github.com/szl-holdings/platform/actions/runs/38662934564)
ran on `32f50018e3444ba78d774155cc427161f1017ce0` with both freshness inputs
enabled and `refresh_truth=false`. It failed the live Killinchu source-binding
check because the service had published a newer release after PR #931. The
failure remains retained; the subsequent checks were skipped, not passed.

## Verified release

At `2026-10-15T01:01:32Z`, a bounded anonymous GET of the approved build-info
endpoint reported source `4a434f8d07feb7badc5a274c89549452f49ff0d1`, manifest
SHA-256 `38c7d69a6a374afe157f23ab2760bab4b58146efa1beee00bc30519b990216d5`,
and deployment-release attestation reference `55856266`.

The manifest was downloaded from the immutable `killinchu-release-receipt`
artifact of successful
[publisher run 38573192794](https://github.com/szl-holdings/killinchu/actions/runs/38573192794).
Its local SHA-256 matched the response. This command completed with exit 0:

```text
gh attestation verify hf-deploy-manifest.json --repo szl-holdings/killinchu --signer-workflow szl-holdings/killinchu/.github/workflows/hf-sync.yml --source-ref refs/heads/main --source-digest 4a434f8d07feb7badc5a274c89549452f49ff0d1 --format json
```

## Validation and limits

- `node node_modules/tsx/dist/cli.mjs --test tools/truth/public-surfaces.test.ts`
  passed 42/42 before and after the patch. The existing isolated `parse5`
  dependency was provided through `NODE_PATH`; no repository dependency changed.
- `node node_modules/tsx/dist/cli.mjs tools/truth/generate-public-surfaces.ts`
  exited 0 and changed only the one generated note.
- `node node_modules/tsx/dist/cli.mjs tools/truth/generate-public-surfaces.ts --check --verify-live --require-fresh-observation`
  exited 0. The unchanged live contracts and freshness predicate passed.
- `pnpm typecheck` exited 1 before editing because the host fallback was pnpm
  11.25.0 instead of required 10.26.1. Running the isolated pinned 10.26.1 CLI
  before and after editing also exited 1 when Turbo children selected that
  incompatible fallback. Whole-workspace typecheck is **UNAVAILABLE locally**;
  exact-head hosted checks remain required. No local pass is claimed.
- `git diff --check` exited 0.
- Screenshot and route UI tests: **NOT RUN**; no UI or route changed.
- No known runtime gap is closed, no product readiness classification changes,
  and the historical application status register is not refreshed.
- No secret, private data, or runtime write was added. The GET minted no new
  receipt. Killinchu effectors remain `SIMULATED`; publisher provenance does
  not establish execution authorization or aggregate readiness.

Protected merge and a new complete main-branch live witness with both freshness
inputs enabled are required before claiming this correction is released.
