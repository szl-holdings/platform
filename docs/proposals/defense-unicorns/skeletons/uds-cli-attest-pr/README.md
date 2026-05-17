# Staged draft PR — `defenseunicorns/uds-cli`: in-bundle attestation manifest

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Tracks:** `docs/proposals/defense-unicorns/05_two_fixes.md` Fix A
**Target repo:** [`defenseunicorns/uds-cli`](https://github.com/defenseunicorns/uds-cli)
**Target branch:** `main`
**Proposed source branch:** `szl-holdings/feat/in-bundle-attest`
**License:** dual Apache-2.0 / AGPL-3.0 on SZL's contribution (see `LICENSE-CONTRIBUTION`)

This directory is the **staged draft PR**: every net-new file (the
`attest` package, docs page, fixtures, CI workflow) lives at the path
it would live at in the upstream `uds-cli` checkout. The edits to
*existing* upstream files (`src/cmd/bundle.go`, `src/pkg/bundle/*.go`,
the bundle option-structs, `go.mod`) are described in
[`overlays/`](./overlays/) as **insertion specs**, not git-applyable
`.patch` hunks — upstream line numbers drift between uds-cli releases,
so the cut-on-the-day helper (#5117) re-derives real `git format-patch`
diffs against the current upstream HEAD when the go-ahead arrives.

To cut the PR (manual path):

1. `git clone https://github.com/defenseunicorns/uds-cli && cd uds-cli`
2. `git checkout -b szl-holdings/feat/in-bundle-attest`
3. Apply the overlays under `overlays/` **in numeric order** (0005
   first — it adds the struct fields the others depend on — then
   0001 → 0006). Each overlay names its target file, insertion
   location, and exact snippet to insert.
4. Copy the new files from `src/`, `docs/`, `fixtures/`, `ci/`,
   `.github/` into the matching upstream paths.
5. `go mod tidy && go test ./src/pkg/attest/... ./src/cmd/...`
6. `bash ci/roundtrip.sh` against the freshly built `./build/uds`.
7. `gh pr create --draft --title "$(cat PR_TITLE)" --body-file PR_BODY.md`

## Contents

| Path                                          | Status | Notes                                                                 |
| --------------------------------------------- | ------ | --------------------------------------------------------------------- |
| `PR_TITLE`                                    | new    | Single line, used as `gh pr create --title`.                           |
| `PR_BODY.md`                                  | new    | Cover letter, acceptance-criteria checklist, license note.             |
| `LICENSE-CONTRIBUTION`                        | new    | Dual Apache-2.0 / AGPL-3.0 grant for the SZL-authored portion.         |
| `src/pkg/attest/manifest.go`                  | new    | Hash-chained ledger ported from `tools/a11oy-code/src/proof.mjs`.      |
| `src/pkg/attest/signer.go`                    | new    | Hybrid Ed25519 + ML-DSA-65 sign / verify (uses `cloudflare/circl`).    |
| `src/pkg/attest/manifest_test.go`             | new    | Golden-file tests: chain linkage, tamper detection, bad signature.     |
| `src/cmd/bundle.go`                           | patch  | Register `--attest` on `create` and `--offline` on `verify`.           |
| `src/pkg/bundle/create.go`                    | patch  | Call `attest.BuildManifest` after component emit.                      |
| `src/pkg/bundle/verify.go`                    | patch  | New offline-walk path delegating to `attest.VerifyOffline`.            |
| `docs/reference/attestations.mdx`             | new    | Reference docs page (flag, payload schema, verification, threat model).|
| `fixtures/roundtrip/`                         | new    | Two-component bundle + tampered variant used by CI.                    |
| `ci/roundtrip.sh`                             | new    | `create → tamper → verify` round-trip, exits non-zero if tamper missed.|
| `.github/workflows/attest-roundtrip.yaml`     | new    | Wires `ci/roundtrip.sh` into the existing CI matrix.                   |
| `overlays/0001-cmd-bundle-attest-flag.md`     | new    | Insertion spec for `--attest` / `--offline` flag registration in `src/cmd/bundle.go`. |
| `overlays/0002-pkg-bundle-create-attest.md`   | new    | Insertion spec + new method for `src/pkg/bundle/create.go`; `go.mod` add. |
| `overlays/0003-pkg-bundle-verify-offline.md`  | new    | Insertion spec + new method for `src/pkg/bundle/verify.go`.            |
| `overlays/0004-cmd-bundle-verify-exit-codes.md` | new  | Maps `attest.VerifyError.Code` to process exit codes 2–7; locked by test. |
| `overlays/0005-bundle-types.md`               | new    | Apply first — adds the `CreateOpts` / `VerifyOpts` fields the others reference. |
| `overlays/0006-collect-artifacts.md`          | new    | New file `src/pkg/bundle/attest_helpers.go` (`collectEmittedArtifacts`, `extractPaths`). |

## Acceptance criteria mapping (from §05 Fix A)

| # | Criterion                                                | Where it lives                                          |
| - | -------------------------------------------------------- | ------------------------------------------------------- |
| 1 | `create --attest` writes `attestations.jsonl`            | `src/pkg/bundle/create.go` patch + `manifest.go`        |
| 2 | `verify --offline` exits non-zero on tamper / bad sig    | `src/pkg/bundle/verify.go` patch + `manifest_test.go`   |
| 3 | ≤ 2s overhead on a 10-component bundle                   | Benchmarks in `manifest_test.go` (`BenchmarkBuild10`)   |
| 4 | CI fixture round-trips create → tamper → verify          | `ci/roundtrip.sh` + `.github/workflows/...`             |
| 5 | Zero new deps outside stdlib + `cloudflare/circl`        | `go.mod` delta in `patches/0002-...`                    |

## Days to PR

≤ 7 days from Andrew Greene's go-ahead, per §05.

## Why this is staged, not opened

The operational deliverable (an actual draft PR open on
`defenseunicorns/uds-cli`) is intentionally held back until Andrew
Greene's go-ahead lands. The §05 commitment is "≤ 7 days **from
Andrew's go-ahead**" — cutting the PR before the go-ahead would put a
publicly-visible draft into the upstream maintainers' queue without an
invitation. Stage now, cut on the day. See follow-up task #5117 for the
one-command helper that fully assembles the upstream branch and opens
the draft PR via `gh pr create --draft` when the go-ahead arrives.
