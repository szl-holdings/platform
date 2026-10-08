# Pristine node-forge control hardening — 2026-10-04

## Workcell and source

- Workcell: `platform-pristine-control-20261004`.
- Actor: ChatGPT; source repair and local verification.
- Input: PR #882 at `75bf9ed724e141969ba00ad2a1182d07f24ff6bd`.
- Recorded: 2026-10-04T17:02:39Z.
- Proof level: 2, internal CI helper. No route or UI surface changed.

The context review covered AGENTS.md, the non-negotiables and proof doctrine,
documentation index, application status, current known gaps, and the existing
backport source/proof. The plan was recorded before editing: bind retrieval to
reviewed constants, bound and validate archives, reject unsafe members, test
the failure cases, and retain the current vulnerability gates.

## Problem and patch

The old helper selected its request URL from the provenance JSON and followed
redirects. Although it verified archive hashes before writing, it materialized
an unnecessary temporary archive, checked only member names, and lacked an
unpacked-size bound. CodeQL reported file data entering an outbound request
and network data entering a file write in that helper.

`scripts/qa/prepare-node-forge-pristine.mjs` now:

- Uses a literal canonical npm URL and independent, reviewed SHA-512/SHA-256
  pins. Receipt drift fails, redirects are forbidden, and no credentials,
  request body, or file-derived headers are sent.
- Bounds streamed/local archives to 1 MiB, decompression and declared member
  sizes to 4 MiB, the inventory to 128 members, and tar execution to five seconds.
- Inventories the entire archive with the same GNU tar parser used to extract
  it, including resolved PAX/GNU names. It rejects traversal, ambiguous names,
  duplicate entries, links, directories and special files. Inherited
  `TAR_OPTIONS` cannot hide members or alter extraction.
- Passes verified bytes to tar through stdin, creates a private temporary
  directory, disables owner/permission restoration and overwriting, checks the
  installed manifest/RSA bytes, and removes partial output on failure.
- Retains the existing environment export only after successful verification.

The existing security workflow runs the new helper regressions before its
pristine-control preparation step. Scanner configurations, exception lists,
thresholds, package versions, patch bytes and lockfile are unchanged.

## MEASURED local verification

Node `24.19.0`; root package manager pinned to `pnpm 10.26.1` through a scoped
Corepack shim. Every command below was run in the isolated source worktree.

| Check | Exit | Result |
|---|---:|---|
| `node --test scripts/qa/prepare-node-forge-pristine.test.mjs` | 0 | 25 passed, zero skipped. Covers receipt drift, credential-free request policy, HTTP/redirect failure, binary streaming, limits, cancellation, hash mismatch, safe regular files, path attacks, PAX/GNU names, inherited tar options, member types/counts, invalid gzip and decompression bounds. |
| Helper CLI with the hash-verified registry archive via `--archive` | 0 | 435,334 compressed bytes; 59 regular files; private parent mode `0700`; no intermediate archive; exact environment export. |
| Helper CLI with an intentionally invalid environment output path | 1, expected | Fails after extraction and removes the partial control directory. |
| `node --test scripts/qa/check-node-forge-backport.test.mjs` with the prepared control | 0 | 13 passed, zero skipped. Uses the installed workspace Expo CLI and certificate dependencies, native crypto comparisons, and the pristine control. |
| Node syntax checks, Biome format/lint and Oxlint for the two helper files | 0 | Passed after formatting. |
| `git diff --check` | 0 | Passed. |
| Root `pnpm typecheck`, before | 1 | Nested evidence-doctrine package-manager download of pnpm 11.9.0 fails with registry `EAI_AGAIN`, before a TypeScript diagnostic. |
| Root `pnpm typecheck`, after | 1 | Same nested download/DNS failure, after 27 successful tasks. Full workspace verification remains incomplete. |
| Direct filtered evidence-doctrine typecheck using root-pinned pnpm | 0 | Passed; this does not replace full workspace verification. |

The environment's first unpinned pnpm invocation selected pnpm 11.25.0 and
attempted an automatic installation, failing on ignored dependency builds.
Its generated workspace-configuration drift was restored before this patch;
it is not part of the change. No external branch was modified during these
local checks.

## Remaining limits and release status

The official [node-forge advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv)
and [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), reread on
2026-10-04, list no patched releases. Live npm metadata still selects
node-forge 1.4.0 and braces 3.0.3. The dependency audit, Grype and required
security gate remain blocked by the published affected ranges. This helper
repair is not advisory remediation or release approval. New hosted CodeQL and
CI results are required for the published source.

An additional owned-key local probe reproduced the malformed nonempty ASN.1
NULL acceptance described by [upstream PR #1157](https://github.com/digitalbazaar/forge/pull/1157):
the currently installed #1152 backport accepts a one-byte NULL parameter and
native Node crypto rejects it. This is a format-validation residual; the
probe does not demonstrate forgery without a private key. A separate patch
is needed, and the existing backport's demonstrated scope remains limited.

No credentials, private-key material, environment values, public deployment,
mobile readiness change, or unqualified product claim is included. Test keys
are generated in memory. `docs/operations/known-gaps.md` records the local
hardening and remaining verification limits; application readiness is unchanged.
