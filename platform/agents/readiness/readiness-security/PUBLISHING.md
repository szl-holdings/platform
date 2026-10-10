# READINESS-SECURITY receipt publishing

Workcell: `readiness-security-publish-20261008`.

**Verified branch recovery, 2026-10-08:** [run 37835611657](https://github.com/szl-holdings/platform/actions/runs/37835611657)
passed the publishing preflight and published a real receipt from source
`339e107e3dad5622c20da8972583670669055930`. Immutable Hugging Face readback
matched the exact uploaded envelope and its canonical payload hash. The
receipt remains honestly unsigned. This recovery checkpoint preceded protected
`main` adoption. Consult [PR #914](https://github.com/szl-holdings/platform/pull/914)
for final admission and fresh default-branch validation.
Passing offline tests or the preflight alone does not establish publication;
the [Workcell proof packet](../../../../audit/READINESS_SECURITY_PUBLISH_PREFLIGHT_20261008.md)
records the actual run, receipt, hashes and remaining boundaries.

## Incident and confirmed destination

[Run 37810128542](https://github.com/szl-holdings/platform/actions/runs/37810128542)
completed checkout, dependency installation and offline publishing-contract
tests before receipt publication failed with `RepositoryNotFoundError: 401`
at the dataset's `preupload/main` endpoint. The log shows a masked `HF_TOKEN`
value was supplied. That establishes presence, not validity or write access;
the original error does not identify an expired token, insufficient scope,
organization policy, or repository access as the specific cause.

The existing destination was independently resolved through the Hugging Face
connector and its public [dataset page](https://huggingface.co/datasets/SZLHOLDINGS/readiness-runs).
Its README names this agent and this repository as its source. Keep the
following contract:

| Setting | Required value |
| --- | --- |
| Hub origin | `https://huggingface.co` |
| `HF_ENDPOINT` | Unset or exactly `https://huggingface.co` |
| Repository ID | `SZLHOLDINGS/readiness-runs` |
| Repository type | `dataset` |
| Receipt path | `receipts/readiness-security/<UTC-date>/<UTC-timestamp>.json` |
| Workflow | `.github/workflows/readiness-security.yml` |
| Python / Hub SDK | Python 3.12 / `huggingface_hub==2.0.0` |
| Credential | `HF_TOKEN` from `${{ secrets.HF_TOKEN }}` |

The publisher already uses `repo_type="dataset"`. Do not create a replacement
repository, change the sink, or infer repository deletion from this error.
[Hugging Face's error reference](https://huggingface.co/docs/huggingface_hub/package_reference/utilities#huggingface_hub.errors.RepositoryNotFoundError)
documents that missing and inaccessible repositories can share this exception.

## Verified recovery record

The effective repository `HF_TOKEN` was restored using an existing personal
write credential from the standard CLI authentication store, after identity,
dataset access and dataset write authorization were validated. The credential
was supplied to GitHub secret administration through standard input; secret
metadata records an update at `2026-10-08T19:54:58Z`. No new credential or
broader permission grant was created. A dedicated fine-grained token or an
approved OIDC configuration remains a later improvement, not a completed
part of this repair.

Run `37835611657`, attempt `1`, job `113511746837` completed successfully on
`fix/readiness/security-publish-preflight-20261008`. The receipt emitted at
`2026-10-08T19:59:49Z` was retrieved at
`receipts/readiness-security/2026-10-08/2026-10-08T19-59-49Z.json` from immutable
dataset revision `dd18e12051fbf1e6885c13eb1ea92b20940d2bd2`. Its 128 repository
findings contain 6 `GREEN`, 121 `RED` and 1 `AMBER` verdicts. Publication success
does not turn those findings green or establish release-signature verification.
The envelope has `signed:false`, an empty signature list, no public key and
no signing error. Signing and collector changes remain separately owned by
[PR #879](https://github.com/szl-holdings/platform/pull/879) and
[PR #882](https://github.com/szl-holdings/platform/pull/882).

## Blocking preflight

Run from the repository root, with the credential supplied securely through
the environment:

```bash
python platform/agents/readiness/_lib/hf_publish_preflight.py
```

The workflow runs this helper after installing dependencies and before
READINESS-SECURITY collection. Before constructing the SDK client, it rejects
a noncanonical `HF_ENDPOINT` with `destination/endpoint_mismatch`. Leave this
variable unset or set it to `https://huggingface.co`, so the unchanged
publisher's SDK default origin agrees with the preflight. Do not introduce a
fallback origin. The helper establishes these prerequisites:

| Stage | Check | Meaning of success |
| --- | --- | --- |
| Credential | Explicit, nonempty `HF_TOKEN` | This job has a supplied credential. |
| Identity | `HfApi.whoami` with that token | Hugging Face accepted the credential. |
| Destination | `HfApi.repo_info` for the fixed dataset with that token | The configured dataset resolves and is accessible. |
| Write | `HfApi.auth_check(..., repo_type="dataset", write=True)` | The credential has content-write permission on that dataset. |

The pinned SDK supports all of these calls, including `write=True`; see the
[version 2.0.0 API reference](https://huggingface.co/docs/huggingface_hub/v2.0.0/en/package_reference/hf_api#huggingface_hub.HfApi.auth_check)
and [version 2.0.0 implementation](https://github.com/huggingface/huggingface_hub/blob/v2.0.0/src/huggingface_hub/hf_api.py).
The write check is a GET to the dataset's `/auth-check/write` endpoint.
Every request uses the explicitly supplied token and the fixed Hub origin.

The helper fails nonzero when a prerequisite cannot be established. It emits
bounded diagnostics identifying the stage and, when available, HTTP status.
It does not print credentials, identity responses, raw exception text, or
server response bodies. It creates no repository, emits no receipt and uploads
no evidence. Its success permits the real collector and publisher to run;
it does not guarantee that the later upload will succeed.

Interpret failures by stage:

| Failure | Operator action |
| --- | --- |
| Missing/empty credential | Correct secret availability for this job. |
| `destination/endpoint_mismatch` | Remove the unintended `HF_ENDPOINT` override or set the canonical Hub origin. Do not redirect evidence to another server. |
| Identity HTTP 401 | Replace or repair the rejected credential through the approved secret-management path. Presence alone does not make it valid. |
| Destination HTTP 401/403/404 | Check exact dataset identity, account access, token scope and organization policy. Do not label the dataset deleted. |
| Write HTTP 401/403/404 | Establish content-write authorization on the existing dataset. Read access is insufficient. |
| HTTP 429, 5xx, transport or unexpected failure | Record that verification was unavailable and retain failure. Do not diagnose an invalid token from a service or network failure. |

Do not add `continue-on-error`, suppress a failing exit, inject a dummy token,
or replace the check with a public dataset read. The existing
[`khipu.require_published`](../_lib/khipu.py) remains the final fail-closed
publication enforcement inside GitHub Actions.

## Provision the required credential

Use a dedicated, active Hugging Face token with **content-write permission on
`SZLHOLDINGS/readiness-runs`**. Prefer a fine-grained token scoped to this
dataset. Its issuing account must also have the underlying repository access;
organization membership alone does not increase a token's permissions. Apply
any required organization administrator approval and verify that the token is
not denied or revoked. See [Hugging Face token roles and organization policies](https://huggingface.co/docs/hub/security-tokens).

Do not decide authorization by requiring a token metadata role literally named
`write`: a valid fine-grained token can have different metadata. The dataset
write check tests the effective authorization. The connected ChatGPT Hugging
Face session is a separate credential and does not validate the Actions secret.

An authorized operator should enter the credential through the approved secret
manager or [GitHub Actions secret settings](https://github.com/szl-holdings/platform/settings/secrets/actions).
Never request or paste its value into chat, a PR, an issue, command-line
arguments, a committed file, or workflow logs. Do not print environment dumps
or token-bearing HTTP debug output.

Check where `HF_TOKEN` is defined before updating it:

| Secret scope | Effective behavior |
| --- | --- |
| Organization | Must permit access by `szl-holdings/platform`. |
| Repository | Overrides an organization secret with the same name. A stale repository value can mask an updated organization value. |
| Environment | Overrides both when the job references that GitHub Environment. The current READINESS-SECURITY job does not declare an environment. |

GitHub reads organization and repository secrets when a run is queued, and
environment secrets when the corresponding job starts. Queue a new run after
provisioning. See [GitHub secret precedence and read timing](https://docs.github.com/en/actions/reference/security/secrets).
At the SDK level, [HF_TOKEN overrides a saved local login](https://huggingface.co/docs/huggingface_hub/package_reference/environment_variables#hf_token).

Signing and OIDC work is tracked separately in
[PR #879](https://github.com/szl-holdings/platform/pull/879) and
[PR #904](https://github.com/szl-holdings/platform/pull/904). This repair retains
the explicit `HF_TOKEN` contract and signing behavior while restoring the
effective publishing credential. It does not configure an OIDC trust
relationship or replace that work.

## Validate the candidate and actual publication

1. Record the exact 40-character Git commit containing the candidate. Run the
   offline contract suite on that source and record its command, exit status
   and result:

   ```bash
   python -m unittest discover -s platform/agents/readiness/_lib -p "test_*.py"
   ```

2. Use a supported manual dispatch of READINESS-SECURITY on the intended ref,
   or the scheduled run after that exact candidate is adopted on the default
   branch. The workflow schedules security at `20 * * * *` UTC and shares the
   dataset concurrency lock with the fleet. Record the run URL, attempt,
   event, and actual `head_sha`; verify that it is the chosen commit before
   attributing results to this candidate. A rerun of the original failing
   commit is a separate diagnostic and does not test new code.

3. Confirm the offline tests and all preflight stages pass, then inspect the
   real READINESS-SECURITY execution. Its emitted result must have
   `publish.published: true`, the expected dataset and a concrete receipt path.
   A preflight pass, printed envelope, skipped step, or mocked upload is not
   publication evidence. A successful job also does not make every security
   verdict in the report green.

4. Retrieve that exact receipt path from the dataset and record the Hugging
   Face commit or immutable revision used for readback. Confirm it is the
   envelope from this run, rather than a previous receipt. Decode `payload`
   from base64, calculate SHA-256 over the decoded bytes and compare it with
   `payloadSha256`. Inspect the decoded `agent`, schema, UTC emission time and
   actual collected findings. Preserve the run-to-path-to-digest mapping in
   the proof packet; the receipt schema itself does not include the workflow
   commit SHA or run ID.

5. Record the actual signing state separately. `KHIPU_SIGNING_KEY_B64` was
   absent in the original run; an unsigned envelope must remain honestly
   `signed:false`. This repair does not provision that key or establish signed
   success. If a later receipt reports `signed:true`, inspect and verify its
   signature using the intended trusted public key before claiming verified
   signing. An embedded public key alone does not establish signer trust.

Only a successful actual upload and matching receipt readback establish
restored publication for the recorded run. If the preflight or upload still
fails, retain that failure and report the precise unestablished prerequisite
without exposing credentials or claiming the candidate is operational.
