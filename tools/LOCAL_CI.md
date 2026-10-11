# Local Preflight — szl-holdings/platform

`tools/local-ci-runner.sh` is a partial developer preflight. It runs selected
repository checks before a push, but it does not reproduce GitHub-hosted runner
isolation, event permissions, matrix execution, service containers, browser
infrastructure, security uploads, or deployment environments.

A local pass is never a required-check result, branch-protection proof, or merge
authorization. Required hosted checks must pass on the exact pushed commit.

---

## Quickstart

```bash
./tools/local-ci-runner.sh
```

The script writes local logs to `.local-ci-logs/` and returns nonzero when a
selected check fails or required local tooling is unavailable. It never posts
GitHub statuses.

---

## What the preflight runs

The helper installs from the frozen lockfile and invokes the repository's root
commands instead of maintaining alternate command bodies:

| Area | Command or tool | Local policy |
|---|---|---|
| Clean-clone guards | `pnpm run verify:clean-clone` | Failure blocks the local preflight |
| Lint | `pnpm run lint:ci` | Failure blocks the local preflight |
| Typecheck | `pnpm run typecheck` | Failure blocks the local preflight |
| Tests | `pnpm run test` | Failure blocks the local preflight |
| Build | `pnpm run build` | Failure blocks the local preflight |
| Secrets | Gitleaks 8.21.2 and `scripts/qa/scan-secrets.js` | Missing or wrong Gitleaks is `UNAVAILABLE` and exits nonzero |
| Claim hygiene | `pnpm run brand:strings`, strict environment coverage, and token drift | Failure blocks the local preflight |
| Documentation | Root docs and README validation commands | Failure blocks the local preflight |
| Security reports | `pnpm run security:audit` | Failure blocks the local preflight |

This set overlaps parts of several workflows; it is not a workflow emulator.
Hosted-only behavior and every required status context remain unexecuted locally.

---

## Prerequisites

```
node      >= 24
pnpm      10.26.1 exactly (activated by the repository helper)
gitleaks  8.21.2 exactly
```

The runner sources `scripts/activate-pnpm.sh` and verifies the resolved pnpm
version before installing. Set `PNPM_HOME` to a writable directory when the
default user data directory is read-only. The activation helper may require
registry access when the exact pnpm release is not already cached.

Gitleaks absence or version drift is recorded as `UNAVAILABLE` and makes the
preflight exit nonzero; it is not silently skipped.

---

## Usage reference

Run the selected preflight checks from any directory inside the checkout:

```bash
./tools/local-ci-runner.sh
```

Exit code 0 means only that the selected checks completed locally. Logs are in
`.local-ci-logs/`. The result does not change a pull request or create a status.

To run a root command directly, activate the exact package manager first:

```bash
source scripts/activate-pnpm.sh
pnpm run lint:ci
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run security:audit
```

Use GitHub's pull-request Checks view or API to inspect required hosted checks
for the exact pushed SHA. Do not create local substitute statuses or alter
repository access, branch protection, or workflow policy to obtain a green
result.

Hosted checks are allowed to remain pending or failed until their actual cause
is fixed. A local pass cannot clear that state.

---

## Logs

All run logs are written to `.local-ci-logs/` (gitignored). Each check gets
its own file (`lint-ci.log`, `typecheck.log`, etc.). `summary.txt` contains the
pipe-delimited local result record for every selected check. These files are
diagnostic output, not release evidence from a hosted run.
