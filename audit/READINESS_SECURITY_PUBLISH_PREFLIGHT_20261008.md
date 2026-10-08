# READINESS-SECURITY publishing preflight proof

- Workcell: `readiness-security-publish-20261008`
- Recorded: 2026-10-08 UTC
- Recorded by: ChatGPT, implementing the founder-maintainer's requested repair
- Base: `szl-holdings/platform@0dbf3de71e6ef317d9382ea0e4c3b6c188e3e767`
- Base tree: `36681b27d3b2897b0b230f2dcd0c8ea2669d2124`
- Evidence level: local source and offline contract tests; no successful publication claimed

## Objective and plan recorded before edits

Investigate the failed security receipt publication, verify the existing
destination and authentication contract, and implement a justified repair
through a scoped PR. Preserve failed publication as failure and distinguish
preflight success, receipt publication, and trusted signing.

The recorded plan was to add an explicit-token identity/dataset/write-access
preflight and stdlib regressions; insert a blocking, bounded step before the
security collector; document credential provisioning and fresh-run readback;
and record the proof without changing files owned by existing signing, OIDC,
or collector repairs.

## Measured incident evidence

The [original run](https://github.com/szl-holdings/platform/actions/runs/37810128542)
at this base passed checkout, its 68 offline tests and dependency installation.
[Original job 113424515008](https://github.com/szl-holdings/platform/actions/runs/37810128542/job/113424515008)
then failed with `RepositoryNotFoundError: 401` at
`https://huggingface.co/api/datasets/SZLHOLDINGS/readiness-runs/preupload/main`.
The job received a masked `HF_TOKEN`; its signing-key input was empty.

A supported diagnostic rerun executed the **original source**, not this patch:

- Run `37810128542`, attempt `2`, job `113490370653`.
- [Fresh job log](https://github.com/szl-holdings/platform/actions/runs/37810128542/job/113490370653).
- Tests: 68, successful offline step. Installed `huggingface_hub==2.0.0`.
- At `2026-10-08T19:09:52Z`, publication again returned HTTP 401 with
  `Invalid username or password`; final job conclusion was failure, exit 1.
- Result: `published:false`, `signed:false`.
- Attempted path (not a published receipt):
  `receipts/readiness-security/2026-10-08/2026-10-08T19-09-45Z.json`.

The [existing dataset](https://huggingface.co/datasets/SZLHOLDINGS/readiness-runs)
was independently resolved through the Hugging Face connector and public page;
its README binds the dataset to the platform readiness fleet. The publisher's
repository ID and `repo_type="dataset"` are correct. No repository creation or
destination change is justified by the error.

The supplied CI credential was rejected at publication. Its precise defect
(revocation, expiry, scope, or policy/access) has not been established. The
separate connected Hugging Face session does not validate the Actions secret.

## Patch

1. `_lib/hf_publish_preflight.py` requires the actual `HF_TOKEN`, rejects
   whitespace/nonprinting values and a mismatched `HF_ENDPOINT`, then checks
   identity, dataset access and content-write authorization. It reports only
   static stage-specific diagnostics and a bounded integer HTTP status.
2. `_lib/test_hf_publish_preflight.py` adds 14 offline tests with status/token
   subcases, including secret/error-text isolation, no fallback, no writes,
   workflow gating and a failed upload after successful preflight.
3. `readiness-security.yml` adds the preflight after dependencies and before
   collection, using the same secret and a two-minute timeout.
4. `readiness-security/PUBLISHING.md` records the credential contract, secret
   precedence, diagnostics, and exact-source publication/readback procedure.
5. This proof records the observed evidence and remaining prerequisites.

The pinned [SDK 2.0.0 API](https://huggingface.co/docs/huggingface_hub/v2.0.0/en/package_reference/hf_api)
supports `whoami`, `repo_info(..., timeout=15)`, and
`auth_check(..., repo_type="dataset", write=True)`. The last call is a GET
authorization check, not a write. No SDK upgrade is required.

## Local validation

Validation used Python 3.12.14 and an API-retrieved, limited source snapshot.
All 49 retrieved files matched their upstream Git blob hashes before editing.
This snapshot is sufficient for the readiness Python suite; it is not a full
materialized JavaScript workspace.

| Check | Exit | Result |
| --- | --- | --- |
| Upstream Git blob hash comparison | 0 | 49 of 49 files matched the exact base. |
| `python -B -S -m unittest discover -s platform/agents/readiness/_lib -p 'test_*.py'` before patch | 0 | 68 run: 63 passed, 5 existing optional crypto skips. |
| Same command with the final candidate implementation/tests | 0 | 82 run: 77 passed, the same 5 crypto skips. All 14 new tests passed. |
| `python -B -S platform/agents/readiness/_lib/hf_publish_preflight.py` without a token | 1 | Expected `credential/missing_token`; no SDK import, network call or receipt. |
| AST parsing and YAML structural validation | 0 | Valid Python and workflow; same secret, required ordering and bounded blocking step. |
| `pnpm typecheck` before and after patch | 1 both times | Unavailable in the limited snapshot: `ERR_PNPM_CATALOG_ENTRY_NOT_FOUND_FOR_SPEC` for `@types/react`. No typecheck pass claimed. |

One initial test-harness case used NUL in an environment variable. The OS
rejected that input before the helper could read it; the impossible case was
removed. C0, DEL, C1 and zero-width/nonprinting cases remain covered. No
implementation failure was hidden by that harness correction.

The independent review found an origin-consistency issue between a fixed
preflight endpoint and the publisher's SDK environment default. The explicit
`HF_ENDPOINT` guard corrects it and has regression coverage. Review confirmed
the exact SDK signatures, lazy import, explicit-token use, safe diagnostics,
and normal fail-closed workflow gating.

## Evidence and admission boundaries

- This preflight emits no receipt, creates no repository and uploads nothing.
  `ready:true` establishes prerequisites only; the actual publisher must still
  succeed. Existing `khipu.require_published` remains enforced.
- The original and diagnostic runs had no signing key and emitted
  `signed:false`. A valid publishing token alone cannot establish signed or
  trusted evidence. No signing key was created, copied, or fabricated.
- [PR #879](https://github.com/szl-holdings/platform/pull/879) owns shared
  signing/publication and dashboard changes; [PR #904](https://github.com/szl-holdings/platform/pull/904)
  stacks observability OIDC on it; [PR #882](https://github.com/szl-holdings/platform/pull/882)
  owns security-collector corrections. Their held paths were not edited.
- Known-gaps update: no existing gap is declared closed; the publishing
  credential and signing/evidence gaps remain open. No unrelated registry or
  application-readiness status is changed.
- Screenshots/routes: not applicable; no UI or product route changed.
- Public claims: no production, compliance, signed-success or publication
  claim is introduced. Synthetic test values are labeled; real provider
  credentials and raw credential-bearing responses are absent from changes.
- Source will be proposed by a feature branch and draft PR. Protected-main
  checks, current-base admission, signed squash, and review-thread requirements
  remain in force. No force push, bypass, or automatic promotion is requested.

## Remaining prerequisite and fresh validation

An authorized operator must provision the effective GitHub Actions `HF_TOKEN`
with an active credential accepted by Hugging Face and content-write access to
`SZLHOLDINGS/readiness-runs`, including any applicable organization approval.
Check scope precedence: a repository secret overrides a same-named organization
secret. The available connections do not expose GitHub secret administration
or a dataset-write credential for provisioning this input.

The existing PR-triggered verifier will test the candidate source. Its hosted
results and the candidate commit identity will be recorded in the PR. A rerun
of the old run cannot validate the patch. The available GitHub mutations
support job reruns but not workflow dispatch; use a supported exact-ref manual
dispatch or the normal schedule after protected admission for live validation.

Restored publication requires a fresh run at the intended source, successful
preflight and upload, and matching receipt readback at a recorded Hugging Face
revision. Verify payload digest and actual signing/trust state separately.
Until then, publication is BLOCKED and the repair is a reviewed source
candidate, not verified operational recovery.
