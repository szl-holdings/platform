# Readiness receipt retention — local source evidence

- Workcell: `READINESS-RETENTION-20261102`.
- Actor and recorder: OpenAI Codex, implementing the owner's operational repair request.
- Recorded at: `2026-11-02T00:43:53Z`.
- Base: `81edb21eb93caafa4c674391b39800c4a6c72ea7`.
- Base tree: `6e2b32f965095b8cb96402b7ee7bc985f7afa7c0`.
- Proof level: scoped source evidence; no release or deployed-runtime proof.

## Objective and recorded plan

Make an explicitly requested readiness receipt-copy failure fail GitHub Actions
after the existing publication gate. Preserve optional copy configuration,
local warning behavior, bounded diagnostics and publication failure ordering.
The plan named only the shared readiness helper and its contract coverage;
this packet and a dated known-gaps entry record the result. No UI or route is
changed, so screenshot and route checks are inapplicable.

## Trigger and behavior

Previously, `_write_receipt_copy` caught an OS error without reporting status
to `emit`. If signing and Hub publication succeeded but the configured copy
destination was unwritable, Actions could exit successfully without that
requested receipt file. The existing write-error case also omitted a signing
key, so its independent publication failure did not detect this path.

The writer now returns whether the required copy was retained. `emit` runs
the unchanged publication gate first, then exits unsuccessfully in Actions
when requested retention failed. The receipt JSON and successful Hub result
remain truthful even when the overall process fails. A missing path requires
no local copy; an OS error outside Actions still emits its existing warning.
Exception text and destination paths remain excluded from diagnostics.

The regression cases exercise a missing parent directory after synthetic
successful publication, a simulated close failure and unchanged local behavior.
They use the existing in-memory signer and publisher doubles. They do not
generate a fleet key, contact a provider or establish real Ed25519 verification.

## Source identity and overlap

Initial discovery used main `a465a0aa182f5eb88bdf3131372ca7a9b8199e87`.
The newer base above contains the subsequent Khipu OS merge. Its readiness
helper, contract files, workflow configuration and root operating instructions
have identical Git blobs. The two modified Python originals were also fetched
at the newer exact base and compared byte for byte before publication preparation:

| Original path | Git blob |
|---|---|
| `platform/agents/readiness/_lib/khipu.py` | `171ba728435dab164a9d473af28219365f075372` |
| `platform/agents/readiness/_lib/test_khipu_publish.py` | `353d71db57048f214c37321c7a3bc838a7970238` |

The known-gaps register was refreshed from the newer base before the additive
entry. Existing Khipu OS, warm-controller, canonicalization and security-document
work addresses different source paths; this repair does not replace those changes.

## Local commands and results

All Python commands ran in the bounded source snapshot. No provider or network
operation was performed. Counts below describe only the named readiness
subsystems; canonical platform-wide results remain UNAVAILABLE.

| Command / subsystem | Exit | Result |
|---|---|---|
| `python -m unittest test_khipu_publish.EmitFailsClosedTest -v`, original emission class | 0 | 26 passed |
| The two added Actions write/close regression methods against the unchanged original helper | 1 | Both failed as expected: original returned success |
| `python -m unittest test_khipu_publish.EmitFailsClosedTest -v`, candidate emission class | 0 | 29 passed |
| `python -B -S -m unittest discover -s platform/agents/readiness/_lib -p 'test_*.py' -v`, original fleet | 0 | 143 run; 130 passed; 13 skipped |
| Same stdlib discovery, candidate fleet | 0 | 146 run; 133 passed; 13 skipped |
| Same candidate discovery without `-S` | 0 | 146 run; 133 passed; 13 skipped |
| `python -m py_compile` on the changed Python files | 0 | Compilation passed |
| `git apply --check` for the helper/contract patch against original bytes | 0 | Applied cleanly in check mode |
| Exact-base `scan-secrets.js` against the publication files | 0 | CLEAN; scoped source scan |
| Exact-base claims-drift parser on this proof and the additive gap entry | 0 | Passed with actual base metrics and no allowlist |
| `pnpm typecheck`, before and after | 1 | No importer manifest in bounded snapshot; full monorepo validation unavailable |

The skipped cases require absent PyNaCl or the pinned Hugging Face SDK. Local
typecheck did not reach TypeScript execution; matching environment failures do
not establish a no-regression result. Hosted exact-head validation, including
the pinned crypto/SDK checks, remains required.

## Verification and limits

The two original-source negative controls establish the demonstrated gap;
candidate regressions preserve successful receipt/publication behavior and
existing fail-closed publication diagnostics. The scoped change adds no
credential, dependency, permission, external call, route or provider setting.
Its known-gaps entry is `READINESS-RETENTION-20261102`; APP_STATUS is unchanged
because no deployed artifact readiness changed. Public wording is limited to
source behavior and measured local outcomes.

The local candidate does not establish signed publication, successful artifact
upload/readback, current fleet health or staging readiness. It neither changes
nor retries the owner-controlled signing, deployment and training operations.
No independent human review, DCO certification or verified commit signature is
claimed. The existing repository admission and signature rules remain in force.

Rollback is a protected revert of this scoped source repair; no migration is
required. A merge would trigger the existing readiness verification and staging
workflows; publication preparation alone performs neither action.
