# Readiness publication identity — bounded source proof

- `workcell_id`: READINESS-PUBLICATION-IDENTITY-20261102
- `agent` / `recorded_by`: OpenAI Codex, implementing the owner's platform repair request
- `recorded_at`: 2026-11-02T02:10:47Z
- `proof_level`: 2, source and offline test evidence; no release proof
- `source_base`: `dca2db629a2d10ecfe27343f1e24843e4f25acd3`
- `source_tree`: `a191f189250c295ca9fc5244257f7a68c393f93e`
- `objective`: preserve distinct same-agent receipt envelopes published in one
  second instead of selecting one remote filename for both.

## Context and plan

The scoped Pathfinder scan read the current root AGENTS contract, non-negotiables,
proof/claims/done doctrine, documentation index, historical application-status
register, relevant known-gaps entries, fleet README, all readiness Python tests,
dashboard test, workflows and executors. The historical application-status
register remains unchanged; this source patch does not qualify any application.
Fresh main's shared publisher is Git blob
`e8748ab745c7c4a4120005a6008f18187945148f`, including merged #996 retention handling.

The plan recorded before this qualification was to reproduce the filename
collision, bind filenames to the exact upload bytes, review existing consumers,
run all available fleet suites, and add bounded documentation and proof. No
signer, credential, deployment, workflow or authorization change was planned.
Merged PR #996 changes requested local receipt retention in `emit` and
`_write_receipt_copy`. The candidate was refreshed onto its merged base and
preserves its source, tests and known-gaps entry. Only the filename identity
change is added to those shared files. The refreshed baseline has 146 fleet
tests; the candidate adds nine and passes all 155.

## Patch summary

`publish_to_hf` serializes the envelope once, hashes those exact bytes with
SHA-256, and uploads the same byte string under
`receipts/<agent>/<signed-emission-date>/<publication-timestamp>-<sha256>.json`.
Existing directory and timestamp sources, signature admission, token/OIDC
selection, target binding, provider-error redaction and publication gates remain.

The new nine-case Python module exercises overwrite prevention, exact-byte
binding, same-second retry identity, envelope metadata, existing path/dataset
conventions, the unsigned gate, absent credentials, provider failure and the
actual audit-rift reader. The existing filename contract now requires the
digest suffix. The dashboard test adds mixed-name reader coverage without
changing dashboard source. README and known-gaps additions describe the bounded
contract and link this proof packet.

## Verification and test results

Checks ran in a scoped, exact-source snapshot on Python 3.12. The crypto and SDK
checks used PyNaCl 1.6.2 and huggingface_hub 2.0.0. Provider operations are mocked;
no receipt publisher or readiness workflow was dispatched.

| Command / check | Exit | Result |
| --- | --- | --- |
| Original source: `python -B -m unittest discover -s platform/agents/readiness/_lib -p 'test_*.py'` | 0 | 146 tests, zero skips, with pinned crypto/SDK dependencies |
| Negative control: original `khipu.py` with new `test_publication_identity.py` | 1 | 9 tests; 3 expected failures reproduce collisions and missing byte binding |
| Candidate: `python -B -m unittest discover -s platform/agents/readiness/_lib -p 'test_*.py'` | 0 | 155 tests, zero skips, with pinned crypto/SDK dependencies |
| Candidate: `python -B -S -m unittest discover -s platform/agents/readiness/_lib -p 'test_*.py'` with no dependency PYTHONPATH | 0 | 155 tests; 13 expected crypto/SDK dependency skips |
| Before and after: `python -B -m unittest discover -s platform/agents/readiness/readiness-security -p 'test_*.py'` | 0 | 30 tests each |
| Before and after: `node --test platform/agents/readiness/_lib/test_dashboard.mjs` | 0 | 3 baseline tests; 4 candidate tests |
| Before and after: pinned pnpm 10.26.1 `typecheck` | 1 | Identical blocker: Turbo/workspace dependencies absent; TypeScript did not execute |
| Before and after: `node --experimental-vm-modules scripts/docs/check-docs-claims.js` | 1 | Identical 17 missing-source checks in the scoped snapshot; no full monorepo claims-check pass |
| Python compilation, final patch whitespace/applicability, default-rule Gitleaks 8.21.2 scan of changed files | 0 | Passed locally |

The ambient pnpm 11.25.0 command initially failed the repository's required
10.26.1 engine check. The pinned command above resolves that tool mismatch but
does not supply the absent monorepo dependency graph. Hosted exact-head checks
and a complete workspace validation remain required. The full monorepo test,
build and route suites are not claimed; no routes changed.

## Downstream compatibility and limits

Repository code search for the dataset name found the Python publisher/tests,
audit-rift reader, browser dashboard and its test; there were no TypeScript
matches. The two runtime readers list `.json` files, sort full paths and select
the greatest path; neither parses a timestamp-only basename. Added offline cases
call both existing readers with legacy-only and mixed legacy/suffixed listings,
including a later legacy filename. Their chronology across different timestamp
seconds is preserved. Dashboard receipt claims remain UNVERIFIED.

Within one timestamp, filenames supply a deterministic tie-break rather than
causal ordering. The suffix prevents the demonstrated distinct-byte filename
collision, subject to SHA-256 collision resistance. It does not establish global
deduplication, remote concurrent-commit behavior, conditional writes, storage
immutability, a readback guarantee or exactly-once publication. Identical bytes
published in another second can still produce another filename. External
consumers outside this repository were not inventoried.

- `screenshot_refs`: N/A; no UI implementation or route was changed. The browser
  reader was tested offline; no live UI capture is claimed.
- `public_claim_check`: new prose qualifies local source evidence and remaining
  gates; no customer, certification, revenue or production-readiness claim added.
- `security_check`: changed-file secret scan passed; new fixtures use inert data
  and mocked provider calls. No private signer or credential was read or changed.
- `known_gaps_update`: dated candidate entry links this proof; provider/signing,
  protected admission and deployment holds remain separate.

## Review, admission and rollback

This packet supports a source-review candidate, not operational acceptance.
Independent review, hosted exact-head CI, current protected admission and
authorized provider/signing qualification remain outstanding. No remote
publication, deployment or staging success is established. The refreshed candidate
preserves the merged #996 retention changes. Rollback is a protected
revert; legacy files remain readable and no data migration is required.

Origin: first-party implementation under the repository's existing license.
No external implementation was copied. This packet records local pre-commit
qualification and does not constitute independent human approval. Commit
identity and signature verification belong to the subsequent GitHub publication
record.
