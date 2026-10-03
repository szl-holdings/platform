# node-forge RSA validation backport proof

## Plan recorded before the patch

- Workcell: `cyber-pr-882-node-forge-backport-20261003`.
- Agent: Codex, source writer for the existing cybersecurity PR.
- Objective: backport the minimal nested DigestAlgorithm element-count repair
  from digitalbazaar/forge PR #1152 at
  `ceba34402e329f0365134f23fe19898756527d65` to the installed `node-forge@1.4.0`.
- Scope: a pnpm patch and lockfile binding, a provenance receipt, an executable
  installed-byte guard and independent RSA/certificate/CSR regressions, and the
  known gaps register. Preserve the package name/version and all security gates.
- Success criteria: exact patch and installed RSA bytes match declared hashes;
  locally generated positive signatures work; malformed nested algorithm
  structures are rejected; Expo certificate and CSR operations remain usable.
- Release status: **BLOCKED**. A local backport does not change the published
  advisory range or establish a successful strict audit/Grype run, mobile device
  integration, deployment, authorization, or independent replay.
- Source before editing: `d887bacbf34ce6a58bd6c16c211bebc79cb20075`.
- Prior art: [upstream fix PR #1152](https://github.com/digitalbazaar/forge/pull/1152),
  [advisory GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv).
- Preservation: the two existing tracked `.pyc` deletions are outside this patch.
  No route or UI changes are planned; new screenshot and route checks are not
  applicable to this dependency repair.

## Baseline

**MEASURED:** `node --version` returned `v24.19.0`; `corepack pnpm --version`
returned `10.26.1` with `COREPACK_ENABLE_NETWORK=0`.

**MEASURED:** `corepack pnpm typecheck` reached Turbo but the typecheck task
failed with exit 1: `Unable to find package manager binary: cannot find binary
path`. The compound inspection command later returned exit 0; the typecheck's
own `ELIFECYCLE` result was exit 1. A passing baseline is not claimed.

## Execution results

**MEASURED**, recorded at `2026-10-03T06:03:03Z` (October 3, 2:03 AM ET).

| Command or action actually run | Result and scope |
|---|---|
| `corepack enable pnpm --install-directory <local utility>/node-tool-shims`, followed by `pnpm typecheck` with that directory on PATH and `COREPACK_ENABLE_NETWORK=0` | Shim preparation exit 0; real baseline typecheck exit 2, `@szl-holdings/offline-engine` reports `TS2688` missing Node type definitions. No baseline pass. |
| `pnpm install --lockfile-only --offline --ignore-scripts` | Exit 1, unrelated `@types/cors` offline registry metadata unavailable. No full installation attempted. |
| Exact registry tarballs retrieved, SHA-512 SRI checked against the existing lockfile, safe member names checked, then extracted into an isolated local utility fixture | Exit 0. `node-forge@1.4.0`: 435,334 bytes; Expo code-signing `0.0.6`: 12,033 bytes. No package scripts executed. |
| `git apply --check <patch>` then `git apply <patch>` in the isolated package copy | Exit 0. Only the seven-added/two-removed-line RSA hunk is applied. Manual Git application preserves CRLF; this copy is not the installed pnpm byte proof. |
| `pnpm --dir <two-package fixture> install --lockfile-only --ignore-scripts` then `install --frozen-lockfile --ignore-scripts` | Exit 0. Exactly two isolated dependencies installed. pnpm normalizes the repaired RSA file to LF; its bytes match the immutable upstream PR postimage exactly. |
| `pnpm install --lockfile-only --offline --frozen-lockfile --ignore-scripts` in the Platform worktree | Exit 0, all 203 workspace manifests accepted. No workspace dependencies installed. |
| `node --test scripts/qa/check-node-forge-backport.test.mjs` with the explicit two-package fixture and pristine control paths | Final exit 0, **13/13** tests passed, **0 skipped**. The first run was 12/13 because the custom extension lookup used the wrong Forge accessor form; it was corrected to `getExtension({id: ...})` and rerun. |
| `node scripts/qa/prepare-node-forge-pristine.mjs --archive <already verified original tarball>` | Exit 0. No further download. SHA-512 SRI and SHA-256 are checked before extraction; extracted package identity and pristine RSA hash are checked. The final 13/13 replay used this helper's extracted control. |
| Preparation helper given the repository patch file as an invalid `--archive` input | Child exit 1, `Pristine registry integrity mismatch`, before any extraction. A first output-truncated probe did not retain a reliable child exit; the complete captured retry established exit 1. |
| `node node_modules/@biomejs/biome/bin/biome check --write <three new scripts and provenance JSON>`; final `check` | Exit 0. Formatting/import fixes applied to the new scripts; final checked scripts have no lint errors. |
| `node node_modules/oxlint/bin/oxlint scripts/qa/check-node-forge-backport.mjs scripts/qa/check-node-forge-backport.test.mjs scripts/qa/prepare-node-forge-pristine.mjs` | Exit 0. This direct local lint result is not represented as a Git hook execution. |
| `pnpm --filter @szl-holdings/mobile-shared typecheck` | Exit 2; native/Expo/TanStack modules and `expo/tsconfig.base` are unavailable in this local partial installation. No mobile typecheck pass. |
| `pnpm typecheck --concurrency=1` after the patch, with a fresh free-space guard | Exit 2; `@workspace/ontology` reports `TS2688` missing Node type definitions. A concurrency of one avoids the full parallel fanout. No entire-workspace typecheck pass. |
| `git diff --check` | Exit 0. |

The RSA regressions construct small DER structures with an independent Buffer
encoder and freshly generated, owned test keys; no private keys are recorded.
The same three malformed nested structures are accepted by the hash-pinned
original package and rejected by the installed backport. Native Node crypto
rejects those malformed signatures. Positive native-to-Forge and Forge-to-native
signatures, wrong-message rejection, SHA-256/SHA-1 optional-NULL compatibility,
Expo self-signed certificates, binary-message signatures, CSR signatures,
development certificates, mismatched private keys and tampered CSR rejection
are exercised. This is local dependency behavior, not exploit activity against
an external system.

## Source and byte bindings

The machine-readable provenance is
[`node-forge-backport-20261003.json`](node-forge-backport-20261003.json).

- Patch SHA-256:
  `533aae294734f889198054869a95df727a279a8162aa9341ab0b1ef4de494f42`.
- Original tarball SHA-256:
  `bf9d7ca0d774235354697bd4b5e642af6505e7ce2066762c3b855138cf870820`.
- Original RSA SHA-256:
  `fd4740238145ec26470eb3f06a627c72039538ce1307dbdce40521f94dfd0a50`.
- pnpm-installed repaired RSA and immutable upstream postimage SHA-256:
  `acc22e5d36e27832c34e02dd3933aad7977d45b047eead5016520735efedc9c5`.
- Installed-byte guard SHA-256:
  `787f0610218122174c7cb433f99077be95ff4877ff403601ff09bb83b74919ba`.
- Regression harness SHA-256:
  `de94fffa8df5351b0badb5f19a90db3267cdda3c536c0af3c605e4d67aa333a3`.
- Pristine preparation helper SHA-256:
  `adb14542175404aabdec105b3bee58653e2889dbdea4bd1fd8b3f58f2e7d848e`.

The package retains `node-forge`, version `1.4.0`, its original registry
integrity and `(BSD-3-Clause OR GPL-2.0)` license. Copyright and license files
are unchanged. Expo's separate package retains its MIT license. The vendor
repair is attributed prior art, not an original SZL crypto invention.

## Verification and limits

**DECLARED:** the existing Security Audit dependency-scan job now prepares a
hash-verified pristine control and runs the installed-byte and behavior guard
after installation. Its default path resolves Forge through the actual Expo CLI
and separately through Expo's certificate library and checks both copies.
GitHub CI cannot use the isolated patched-fixture override, and a missing
pristine control fails closed in CI.

**UNKNOWN:** new-head hosted CI and the actual complete workspace CLI dependency
graph have not run locally or been read back for this uncommitted patch.
The successful isolated pnpm fixture is not represented as that full graph.

**MEASURED:** a separate internal Codex reviewer replayed the local RSA and Expo
cases. This is another local implementation; it is not an independent external
release witness.

**BLOCKED:** the published affected version range is unchanged. pnpm audit and
Grype are not suppressed, their thresholds are unchanged, and this work does
not establish a security-gate pass, protected merge, native mobile integration,
deployment, certification, authorization, or outside witness. Full security
scans and broad builds were **NOT RUN** locally; fresh hosted checks are required.

Public-claim check: no product copy, metrics, runtime labels, or model/formal
claims changed. Security check: no credentials, private keys or `.env` values
were introduced. Known-gap update: the register links this backport and retains
the published-package release blocker. Proof level: **DECLARED 2**, local code
and package behavior only. No UI surface changed and no screenshot is claimed.

## Final root replay before commit

**MEASURED:** the staged whitespace check caught a space-only context line in
the unified patch. Three leading context lines were removed; the RSA code hunk
is unchanged. The final patch SHA-256 is the value recorded above.
`git apply --check` against the verified original package exited 0. The updated
workspace frozen offline lockfile check exited 0 for all 203 manifests.

An initial root invocation from outside the fixture selected pnpm 12 and failed
its version gate. Running from the fixture selected the declared pnpm 10.26.1.
Its offline lock regeneration exited 0; offline installation exited 1 because
the new patch key required a missing pristine tarball. The subsequent two-package
`pnpm install --frozen-lockfile --ignore-scripts` exited 0. The installed RSA
hash remained `acc22e5d36e27832c34e02dd3933aad7977d45b047eead5016520735efedc9c5`.
The root reran `node --test scripts/qa/check-node-forge-backport.test.mjs` against
that installation and the hash-verified pristine control: exit 0, 13 passed,
0 failed, 0 skipped. No severity threshold or other security gate was changed.
