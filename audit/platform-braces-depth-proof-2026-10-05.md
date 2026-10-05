# Private braces depth-limit backport — local proof

Evidence class: **MEASURED**, local source and harness results only.
Release/security/deployment status: **BLOCKED** pending exact-head hosted gates.

## Context and plan

- Task: V9 Platform dependency repair, narrowed to the braces source repair.
- Protected-main base inspected: `f2f8df6f89056e9104587674ccec0855dd5b177a`.
- Base tree: `1c07dc9f7c0d3be1b3d4408c2edc19fe584fd2b9`.
- Isolated branch: `codex/v9-platform-dependency-repair-20261005-cf2c`.
- Preserve the prepared original checkout and import only the reviewed braces
  derivative. Preserve Expo/mobile runtime dependencies and configuration.
- Retain MIT attribution and exact upstream provenance; test the complete
  upstream suite plus depth/cycle boundaries and an actual installed consumer.
- Rebuild the lock with repository-pinned pnpm, preserve vulnerability gates,
  and synchronize measured canonical counts after staging the new package.

## Patch and provenance

`packages/braces-safe` is a private derivative of `braces@3.0.3`, versioned
`3.0.3-szl.1`, with its original package name retained for consumer
compatibility. It is not an upstream release.

Imported source: `micromatch/braces@28d440b5dd449dbf1fe6f3506cf94ecca4d02660`,
tree `0ffbc33a63a6f2365865e69b4217683268067847`, associated with upstream
proposal [micromatch/braces#72](https://github.com/micromatch/braces/pull/72)
and [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
The source bounds parsing and recursive AST walkers and rejects cyclic parent
chains in expansion. The full upstream test suite is included.

The seven imported JavaScript source files and fourteen upstream test files
were mechanically formatted by repository Biome 2.4.12. Each was compared with
the output of formatting its exact upstream Git blob with that configuration;
all matched. The MIT license Git blob is unchanged. This is a formatted
derivative, not a byte-identical upstream checkout. No lint, security, or
pre-commit exclusions were introduced.

`pnpm-workspace.yaml` overrides braces with the local source; the pnpm lock
records that edge. `turbo.json` hashes all fork source and test inputs for its
test task, including implementation files outside `src/`. The staged
source inventory changed from 162 to 163 package directories and from 215 to
216 package-plus-library directories. Exactly the three canonical
representations were synchronized; unrelated metrics were not refreshed.

## Commands and outcomes

Runtime: Node `v24.19.0`; package manager: repository-pinned pnpm `10.26.1`.
The local global fallback is pnpm `11.19.0` and is not a valid substitute.
On Windows the upstream Bash comparisons use Git for Windows Bash on PATH.

| Command / harness | Exit | Measured result |
|---|---:|---|
| Original prepared `node --test packages/braces-safe/test/security.test.cjs` | 1 | Could not load `fill-range`; original checkout initially lacked installed dependencies |
| Initial `pnpm typecheck` baseline attempt | 1 | Global fallback started automatic installation; own process was interrupted, before typechecking |
| Pinned pnpm `--filter braces install --ignore-scripts --no-frozen-lockfile` | 0 | Scoped test dependencies installed |
| Pinned pnpm `install --lockfile-only --ignore-scripts` after restoring mobile files | 0 | Lock rebuilt; Expo retained |
| Pinned pnpm `--filter braces install --frozen-lockfile --ignore-scripts` | 0 | Frozen lock accepted |
| Pinned pnpm `--filter braces run test` | 0 | Before adding consumer control: 8 security cases and 904 upstream cases passed |
| `node --test packages/braces-safe/test/*.test.cjs` after repository formatting | 0 | 9/9 passed, including actual installed micromatch resolution |
| `node packages/braces-safe/node_modules/mocha/bin/mocha.js --reporter dot --require packages/braces-safe/test/mocha-initialization.js "packages/braces-safe/test/*.js"` after formatting | 0 | 904/904 upstream tests passed |
| Pristine published braces 3.0.3 negative-control harness | 0 | Depth 101 accepted in parse/compile/expand/stringify; parent cycle exceeded the 250 ms VM deadline |
| Pinned pnpm `run typecheck` after changes | 1 | Turbo selected global fallback for subprocesses, aborted with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`; 0/68 tasks completed |
| `node --experimental-vm-modules scripts/docs/check-docs-claims.js` | 0 | 26 claims passed |
| `node --test scripts/qa/generate-sbom.test.mjs scripts/qa/check-fflate-resolution.test.mjs scripts/qa/scan-secrets.test.js` | 0 | 21/21 passed |
| `node scripts/qa/check-fflate-resolution.mjs` | 0 | Three dependency edges converge on unchanged fflate 0.8.3 |
| `node scripts/qa/scan-secrets.js packages/braces-safe` | 0 | Focused source scan clean |
| Native `parseLockfile()` SBOM inventory assertion | 0 | Includes private braces 3.0.3-szl.1 and unchanged node-forge 1.4.0 |
| Direct repository Biome staged-file formatter and lint | 0 | Formatted 26 files; 21 changed mechanically; no lint errors |
| Direct repository Oxlint focused on fork | 0 | No errors; inherited no-console warning in upstream compile helper on non-quiet run |
| `node node_modules/turbo/bin/turbo run test --filter=braces --dry=json` plus input assertions | 0 | 27 inputs, including implementation, license, notice, and both added tests |
| `node scripts/audit/validate-source-of-truth.js` after staging fork, before count repair | 1 | Reproduced exactly two count mismatches |
| Same native truth validator after count repair and formatting | 0 | 66/66 checks passed on staged inventory |
| `git diff --exit-code HEAD -- lib/mobile-shared/package.json lib/mobile-shared/tsconfig.json` | 0 | Mobile/Expo source configuration unchanged |
| `git diff --cached --check` | 0 | Clean after removing inherited upstream EOF blank lines |

## Limits and residual blockers

Full-workspace typecheck success or baseline equivalence is **UNKNOWN**:
both attempts stopped before executing the full check. Initial fallback
installation created ignored dependency/cache files in the preserved original
checkout; original prepared source hashes remained unchanged. No broad install
or deletion was used to force a result. Full root tests, Grype, CodeQL,
repository-wide vulnerability scan, reproducibility, browser/runtime probes,
and deployment verification are **NOT RUN** on this local candidate.

The local package test controls establish neither complete ecosystem safety
nor scanner clearance. Upstream code is explicitly attributed, not claimed as
original SZL research. A package-version suffix is not evidence that an advisory
is resolved; normal exact-head hosted vulnerability gates still decide.

Node-forge remains at 1.4.0 through the preserved Expo dependency graph.
Authoritative npm metadata reported 1.4.0 as latest during this audit, while
[GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)
reported affected versions through 1.4.0 and no first patched version.
This candidate makes no node-forge remediation claim, removes no Expo runtime,
and changes no security threshold, workflow, allowlist, or branch protection.

No UI or route is changed; screenshots and `qa:routes` are not applicable.
No existing operational gap or artifact readiness state is claimed closed.
No commit, push, PR, merge, deploy, Hugging Face, or A11oy repository mutation
was issued by the preparing subagent. The coordinating parent must bind the
eventual signed head to fresh ownership and exact-head hosted checks before
any protected merge.
