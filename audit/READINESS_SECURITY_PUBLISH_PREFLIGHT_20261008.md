# READINESS-SECURITY publishing preflight proof

- Workcell: `readiness-security-publish-20261008`
- Recorded: 2026-10-08 UTC
- Recovery checkpoint: `2026-10-08T20:02:14Z`
- Recorded by: ChatGPT, implementing the founder-maintainer's requested repair
- Base: `szl-holdings/platform@0dbf3de71e6ef317d9382ea0e4c3b6c188e3e767`
- Base tree: `36681b27d3b2897b0b230f2dcd0c8ea2669d2124`
- Evidence level: local and hosted contract tests plus verified branch publication and immutable receipt readback; protected-main adoption and trusted signing remain separate
- Repair PR: [#914](https://github.com/szl-holdings/platform/pull/914)

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

The original CI credential was rejected at publication. Its precise defect
(revocation, expiry, scope, or policy/access) has not been established. The
separate connected Hugging Face session does not validate the Actions secret.
The recovery recorded below establishes that the effective replacement input
works; it does not retroactively diagnose the original credential's defect.

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

## Hosted validation and verified branch recovery

The candidate was proposed in [PR #914](https://github.com/szl-holdings/platform/pull/914)
on branch `fix/readiness/security-publish-preflight-20261008`. Its verified
source is `339e107e3dad5622c20da8972583670669055930`.

[Native verifier run 37834664007](https://github.com/szl-holdings/platform/actions/runs/37834664007)
passed for both Python 3.11 and Python 3.12. Each interpreter ran 82 tests with
real PyNaCl and no skips; the separate stdlib-only step ran 82 tests with 77
passes and the 5 expected crypto skips. GitHub's synthetic merge source
`a672b59a285faa3eceb4cdf5a36b5080c7f3d1f4` and the candidate shared tree
`fd15dd9943ffc577393084ce02288a3bf4c23778`. These measured verifier results do
not assert that all final PR checks or protected-main admission are complete.

### Credential restoration

An existing personal write credential in the standard CLI authentication
store passed identity, dataset-access and dataset-write checks. It was
provisioned as the effective repository `HF_TOKEN` using GitHub secret
administration through standard input. The secret's update metadata is
`2026-10-08T19:54:58Z`. No new credential or broader authorization grant was
created, and no token value, credential name, account identity or local
authentication-store path is recorded in this proof.

This restores the existing explicit-token contract. A later dedicated
fine-grained credential or approved OIDC migration remains separate work;
neither is claimed as implemented here.

### Actual workflow and immutable receipt

[Run 37835611657](https://github.com/szl-holdings/platform/actions/runs/37835611657)
completed successfully at candidate source
`339e107e3dad5622c20da8972583670669055930`. Its preflight passed and its real
collector published the receipt. The following records bind the observation:

| Evidence | Measured value |
| --- | --- |
| Run / attempt | `37835611657` / `1` |
| Job | [113511746837](https://github.com/szl-holdings/platform/actions/runs/37835611657/job/113511746837) |
| Collector interval | `2026-10-08T19:56:12Z` through `2026-10-08T19:59:55Z` |
| Receipt emission | `2026-10-08T19:59:49Z` |
| Dataset | `SZLHOLDINGS/readiness-runs` |
| Receipt path | `receipts/readiness-security/2026-10-08/2026-10-08T19-59-49Z.json` |
| Immutable Hub revision | `dd18e12051fbf1e6885c13eb1ea92b20940d2bd2` |
| Downloaded bytes | `62480` |
| File SHA-256 | `6734dc4a38413a8232198d2e8f22da788e2eaae22a791a2e410478b98485523f` |
| Canonical payload SHA-256 | `f1a792b99d51609e2e6aed478695c6841785eceb61dde668664ccab56f8f364a` |

The [immutable receipt](https://huggingface.co/datasets/SZLHOLDINGS/readiness-runs/resolve/dd18e12051fbf1e6885c13eb1ea92b20940d2bd2/receipts/readiness-security/2026-10-08/2026-10-08T19-59-49Z.json)
matched the logged envelope. The SHA-256 of the publisher's exact serialization,
`json.dumps(logged_envelope, indent=2).encode()`, matched the downloaded bytes.
Envelope fields, decoded payload canonicalization, payload hash, schema,
agent and emission time were validated. The receipt schema has no workflow
run ID or source SHA; the recorded run, log, path and immutable readback provide
that external association rather than an embedded cryptographic source claim.

The envelope reports `signed:false`, `signatures:[]`, no public key and no
`signError`. The report contains 128 repositories: 6 `GREEN`, 121 `RED` and
1 `AMBER`. No row reports `cosign.verified:true`. This is verified publication
of an authentic unsigned report with its actual findings; it does not establish
trusted signing, all-green security findings or cryptographically verified
release signatures.

## Evidence and admission boundaries

- This preflight emits no receipt, creates no repository and uploads nothing.
  `ready:true` establishes prerequisites only; the actual publisher must still
  succeed. Existing `khipu.require_published` remains enforced.
- The original, diagnostic and successful recovery receipts report
  `signed:false`. A valid publishing token alone cannot establish signed or
  trusted evidence. No signing key was created, copied, or fabricated.
- [PR #879](https://github.com/szl-holdings/platform/pull/879) owns shared
  signing/publication and dashboard changes; [PR #904](https://github.com/szl-holdings/platform/pull/904)
  stacks observability OIDC on it; [PR #882](https://github.com/szl-holdings/platform/pull/882)
  owns security-collector corrections. Their held paths were not edited.
- The observed authentication/publication failure is resolved for the recorded
  candidate execution. Protected-main adoption, trusted signing and collector
  corrections remain separate. No unrelated gap registry or application
  readiness status is changed.
- Screenshots/routes: not applicable; no UI or product route changed.
- Public claims: the scoped branch-publication claim is backed by the run and
  immutable readback above. No production, compliance or signed-success claim
  is introduced. Synthetic test values are labeled; real provider
  credentials and raw credential-bearing responses are absent from changes.
- Source is proposed through PR #914. Protected-main
  checks, current-base admission, signed squash, and review-thread requirements
  remain in force. Promotion must satisfy normal protected admission; no force
  push or bypass is requested.

## Historical access limits and current follow-up

At the initial proof checkpoint, the available connector operations did not
expose GitHub secret administration, a dataset-write credential for provisioning,
or workflow dispatch. Only reruns of the original source were available through
those operations. Publication was recorded as BLOCKED at that checkpoint,
pending an effective `HF_TOKEN` and a fresh candidate execution. Those access
statements are historical: the supported CLI authentication, secret-input and
dispatch paths subsequently enabled the verified recovery above.

At the recovery checkpoint above, branch publication was verified for source
`339e107e3dad5622c20da8972583670669055930`; protected-main admission and a fresh
run at the admitted source had not yet completed. Consult
[PR #914](https://github.com/szl-holdings/platform/pull/914) for the final
admitted source, default-branch run and receipt readback. Current-base checks,
required review threads and normal signed-merge requirements remain in force.
This checkpoint does not claim all final CI was green or that the candidate
had already been deployed to `main`. Signing and collector improvements remain
with their existing PRs.
