# Platform full-history secret scan: public revision receipt

- `workcell_id`: platform-gitleaks-public-revision-20261008 / PR #907
- `proof_level`: 2, source and scanner evidence
- `evidence_class`: MEASURED for the commands and provider readback below

## Observation and plan

After [PR #905](https://github.com/szl-holdings/platform/pull/905) merged as
`4001a5ef0bfa01844d082ccb2c0156803792feb4`, the [main push security run
37728417920](https://github.com/szl-holdings/platform/actions/runs/37728417920)
failed its Gitleaks full-history scan. The sole reported finding was the
`generic-api-key` rule at historical commit `bff95314865f57ad07c8c1dce797cef4bd141865`,
`workers/alloy-vector-worker/src/tokenizer.ts:21`. The PR-head scan had passed
because it scanned only the PR commit range.

The matched value is a 40-character hexadecimal model revision in
`DEFAULT_TOKENIZER_REVISION`, not an API credential. A live Hugging Face API
readback for `Xenova/all-MiniLM-L6-v2` returned the exact revision as its model
SHA. Keep Gitleaks enabled and use a rule-level `AND` allowlist requiring the
historical commit, exact file path, and immutable-revision assignment shape
together. Do not allowlist the whole file, rule, or model. Both active
conditions that the truth gate tracks have explicit entries in
`security/ALLOWLIST-JUSTIFICATIONS.md`.

## Verification

- The repository-pinned Gitleaks version is `8.21.2`. Its official release
  archive matched its published checksum before local execution.
- `gitleaks detect --log-opts bff9531^..bff9531` against the old config:
  exit 1, one finding. Against the candidate config: exit 0, no findings.
- In an isolated two-commit fixture at the same repository path, the exact
  public revision: exit 1; a one-character changed hexadecimal revision: exit
  1. Each scan read exactly one commit. The exception cannot suppress another
  commit even when it repeats the public revision.
- `corepack pnpm truth:allowlists:check`: exit 0, all 135 active scanner
  suppressions have a current justification, including the two new conditions.
- `git diff --check`: exit 0. No secret value, credential, runtime code, UI,
  route, or deployment setting changed.

The local checkout is shallow. The hosted `workflow_dispatch` security run on
the pushed exact head is required to validate the full history. A passing
secret scan does not prove a deployed or qualified runtime.
