# Staging deployment request failure handling

- Workcell: `STAGING-FAIL-CLOSED-20261018`
- Actor / recorded by: Codex (`outbox_finish`), SZL Holdings authorized source work
- Recorded at: 2026-10-18 UTC
- Base: `fa7cbd0c0cc8b00a1dbf3272530eba45e4da0730`
- Evidence class: MEASURED local mock harness; provider readiness BLOCKED
- Proof level: 2, source/workflow only; no UI surface changed

## Context and plan recorded before patch

Pathfinder: inspected repository instructions, current workflows, CI/test
conventions, documentation index, historical APP_STATUS register, known gaps,
and the Pathfinder context pack. The authoritative GitHub source is
`szl-holdings/platform`; this isolated branch starts from current protected main.
Canonical estate doctrine sources were read; no model or mathematics changes.

The exact-main [staging run 39090828464](https://github.com/szl-holdings/platform/actions/runs/39090828464)
reported success although job `117567028677` received HTTP 403 at
2026-10-18T02:39:00.5492654Z. Its script deliberately exited zero after this
rejection. The cause of the rejection and the deployment API authorization
contract remain UNKNOWN; do not infer an expired token.

Plan: change only `.github/workflows/deploy-staging.yml`, add a stdlib Python
test of the actual Bash step in `scripts/ci/test_staging_deployment.py`, wire
that offline test into the existing `.github/workflows/ci.yml` contract job,
and record this proof plus the remaining gap. Missing configuration must be
BLOCKED before any request; transport failures, malformed status and non-2xx
responses must fail. HTTP 2xx establishes request acceptance only. Move secret
values into step environment bindings. Preserve target, secret names, trigger,
permissions and concurrency. Send at most one bounded request. Do not retry a
provider rejection, change credentials, merge, or claim deployment readiness.

Baseline `pnpm typecheck`: exit 1 before TypeScript runs;
`ERR_PNPM_UNSUPPORTED_ENGINE`, required pnpm 10.26.1, installed 11.25.0.

## Patch, checks and verification

The two deployment steps now read the existing secrets through environment
bindings. Missing inputs stop before curl. One request disables curl config and
URL glob expansion, discards the response body, and has connection/total limits
of 10/60 seconds. Transport failure, malformed status, redirects and rejection
return nonzero; only an exact three-digit 2xx status means request acceptance.
The always-running summary records configuration and request outcomes and keeps
deployment readiness UNKNOWN. No endpoint, secret, permission or trigger changed.

MEASURED: the final local harness executed ten regression methods with 42
parameterized subcases, exit 0. It runs the actual workflow Bash, using a curl
function and a nonexistent command-search path with absolute Bash resolution.
An explicit negative control confirms real curl cannot be resolved without the
double. Cases cover 200/201/202/204/299, redirects, 401/403/429/500/503, malformed
or injected output, DNS/connect/TLS/timeout failures (including misleading 200),
missing inputs, literal URL globs, secret quoting and a failed/skipped summary.
The existing Python contract CI job now executes this same offline suite.

```text
wsl -d Ubuntu -- bash -lc 'cd /mnt/c/Users/steph/szl-work/platform-staging-fail-closed-20261018 && python3 -B -m unittest discover -s scripts/ci -p test_staging_deployment.py -v'
```

Before the two additional negative controls, two narrower local runs completed
eight methods successfully. The final isolated harness removes real curl lookup
as a possible fallback. No provider request was made for this repair.

Post-patch `pnpm typecheck`: exit 1 with the identical baseline engine mismatch,
before TypeScript runs. No typecheck pass is claimed. `git diff --check`: exit 0.
`node tools/truth/claims-drift.ts`: exit 0, `claims drift: PASS`; canonical
metrics, claim guards and allowlists are unchanged.
Repository-wide tests, route checks, browser checks and screenshots: NOT RUN;
no UI, product route or TypeScript changed. APP_STATUS is historical and unchanged.

Public claim check: no deployment, runtime, production or AGI capability claimed.
Security check: fixture-only test token; no real credentials, response bodies or
secrets committed. Existing provider authority is not altered or retried.
The known-gaps register records the rejection and unresolved API/authority
contract. Protected review, exact-head hosted CI and merge remain separate gates.

REPORTED: a separate review agent inspected all five candidate files and ran
the frozen workflow/test/CI copies on Linux: ten methods and 42 subcases passed,
with no actionable findings. This is agent review, not an independent-party
attestation, provider acceptance, or authorization to merge and deploy.

Additional structural validation: Python yaml.safe_load parsed both changed workflow files and found their jobs mappings, exit 0. This is YAML parsing, not a substitute for hosted Actions validation. Local actionlint and shellcheck were unavailable; those checks are NOT RUN.
