# Workcell security-advisories-20261021

- Evidence class: **MEASURED** for the commands below; hosted CI and deployment remain **UNKNOWN** at this checkpoint.
- Recorded at: `2026-10-21T07:14:00Z`.
- Actor / recorded by: Codex, scoped Platform dependency-repair lane.
- Proof level: 2, bounded local source and consumer verification.
- Base: `01e646f294f75b3c82aaa5792c03ffcd7029aa0d`.
- Objective: remove the newly disclosed High findings in the unchanged main-branch dependency graph that blocked replication PR #957, while preserving the security gate.

## Plan and patch

Before editing, inspect current source, ownership, open PRs, package graph, the
previous successful main security run and failing PR run, then verify official
advisory fixed versions and Node compatibility. Update only the three affected
dependency families and their direct minimum versions, regenerate the lockfile
with repository-pinned pnpm 10.26.1, and verify affected consumers.

The patch changes `pnpm-workspace.yaml`, `lib/mcp-client/package.json`,
`packages/storybook/package.json`, `scripts/package.json`, and `pnpm-lock.yaml`:

| Package | Previous resolved version | Patched version | High advisories |
|---|---|---|---|
| `@modelcontextprotocol/sdk` | 1.31.0 | 1.32.0 | [GHSA-22jm-h49p-29qw](https://github.com/advisories/GHSA-22jm-h49p-29qw), [GHSA-46jr-4wx8-v453](https://github.com/advisories/GHSA-46jr-4wx8-v453) |
| `vite` | 8.0.16 | 8.1.6 | [GHSA-587h-7wmj-h5pm](https://github.com/advisories/GHSA-587h-7wmj-h5pm) |
| `markdown-it` | 14.3.2 | 14.3.3 | [GHSA-gfr2-rv44-r23c](https://github.com/advisories/GHSA-gfr2-rv44-r23c) |

Official GitHub advisory records and npm registry package metadata were read.
Node 24.19.0 meets the SDK and Vite engine requirements. The SDK and Markdown
patches were published more than 24 hours before this observation; no release-age
exception is added. Lock changes include Vite's Rolldown/native dependency
closure and peer identities; unrelated package versions are retained. The
existing three OpenTelemetry deprecation annotations are registry metadata.

The audit parser, mitigation manifest, workflows, security thresholds, deployment
settings, and generated checked-in security reports are unchanged.

## Observations and commands

Commands below used Node 24.19.0 and pnpm 10.26.1. On this Windows host,
`pnpm` was invoked through the exact installed `pnpm.cjs`, and its binary
directory was placed first on PATH for nested package tasks.

| Command / check | Exit | Result |
|---|---:|---|
| Before-edit `pnpm typecheck` | 1 | BLOCKED: fresh checkout had no installed Turbo. |
| Baseline `pnpm install --frozen-lockfile --ignore-scripts --reporter=append-only` | 1 | BLOCKED: shared pnpm store was missing a `caniuse-lite` file (`ERR_PNPM_ENOENT`). Shared cache was preserved. |
| `pnpm install --lockfile-only --ignore-scripts --reporter=append-only` | 0 | Lock regenerated from the scoped manifest edits. |
| `pnpm install --frozen-lockfile --ignore-scripts --store-dir <owned-store> --reporter=append-only` | 0 | Candidate installed into an isolated store. Existing unbuilt `substrate` bin warning retained. |
| Baseline `pnpm audit --json --audit-level=high` | 1 | At `07:02:27Z`: Critical 0, High 7, Moderate 13, Low 1. |
| Candidate `pnpm audit --json --audit-level=high` | 1 | At `07:09:29Z`: Critical 0, High 0, Moderate 3, Low 0. This pnpm version exits 1 for the remaining Moderate findings. |
| Unchanged `normalizeAuditJson`, `auditExecutionFailure`, `verifyMitigationManifest`, and `auditBlockingVerdict` applied to the saved real candidate audit | 0 | Parsed `legacy-advisories`, no execution inconsistency, no mitigation entries, High/Critical policy passed. This is a function-level check, not a complete report-generator run. |
| `node scripts/qa/generate-vuln-report.js` | 1 | BLOCKED on Windows: `spawnSync pnpm ENOENT`. Failed current-run report preserved outside the checkout; tracked report restored byte-for-byte. |
| `node --test scripts/qa/generate-vuln-report.test.js scripts/qa/dependency-patches.test.mjs scripts/qa/third-party-licenses.test.mjs scripts/qa/security-overrides-compat.test.mjs` | 1 | This four-file security suite failed because its existing symlink-rejection case cannot create the fixture (`EPERM`) on this Windows host. Exact scoped totals are recorded in [the command-bound JSON receipt](DEPENDENCY_ADVISORIES_2026-10-21.json), under `scoped_check_counts`. No case skipped or changed. Linux hosted execution remains required. |
| `pnpm --filter @szl-holdings/mcp-client typecheck` | 0 | MCP consumer typecheck passed. |
| Local loopback MCP and Markdown consumer smoke | 0 | Actual repository adapter initialized, listed tools, pinged, called a fixture tool, and closed against patched SDK. Markdown heading/link rendering and default raw-HTML escaping passed. No external effect. First fixture attempt incorrectly reused stateless transport and failed; corrected stateful-session fixture passed. |
| `pnpm --filter @workspace/a11oy build` | 0 | Vite 8.1.6 built 31 modules; 4-file public candidate bundle contract passed. |
| `pnpm --filter @workspace/a11oy test` | 0 | 51 Node tests and 5 Vitest tests passed. Vitest emitted a 10-second shutdown warning; command still exited 0. |
| Candidate `pnpm typecheck` | UNKNOWN | Running at this checkpoint; scoped MCP check above passed. Final result must be read from the local receipt or hosted exact-head CI before merge. |
| `git diff --check` | 0 | No whitespace errors. |
| `pnpm docs:claims-check` | 0 | All 26 checked documentation claims verified. |

Local receipts and full logs are under the task's `outputs/platform-security-*`
directories. The committed companion JSON records the source-file and raw-audit
SHA-256 values, observed counts, and exact check-receipt references. The loopback
fixture is `outputs/platform-security-consumer-smoke-20261021.mjs`; its hash is
included. These local results do not establish deployed runtime behavior.

## Remaining gaps and verification boundary

The candidate still reports three Moderate findings: Hono 4.13.9
([GHSA-5r4p-p66f-jhc7](https://github.com/advisories/GHSA-5r4p-p66f-jhc7)) and
two installed `sprintf-js` versions
([GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)).
They remain visible under the unchanged policy. This is not a claim that all
dependency vulnerabilities are closed.

The baseline parser rejected High summary count 7 against four advisory records
because Vite appears in four finding entries. That fail-closed behavior is not
suppressed: after patching the actual dependencies, High is zero and the
unchanged normalizer accepts the real response. No parser repair is part of
this workcell.

`docs/operations/known-gaps.md` records this bounded candidate and residual
findings. No UI source or route was changed, so screenshots and route smoke are
NOT RUN / not applicable. Full root `pnpm test` is NOT RUN; the affected consumer
and security suites are listed above. Public-claim check: no production,
certification, AGI, inference, or runtime-readiness claim is introduced. Security
check: no secret, token, key, or `.env` value is part of the patch.

Source publication, normal protected merge, provider acceptance, deployment,
runtime identity, durable replication, and independent witness remain separate.
This workcell does not perform a deployment or merge. The inherited staging
provider rejection remains open.

## Append-only hosted-check correction - 2026-10-21T07:17:34Z

MEASURED: hosted security run
[39560791762](https://github.com/szl-holdings/platform/actions/runs/39560791762)
at source `bdb51d188204fb21a105a3c4494d868f9e4b0654` passed secret scanning,
license compliance and lockfile integrity, but the dependency scan failed before
its final conclusion. The retired-signing-graph contract still admitted only
SDK 1.31.0 and rejected patched 1.32.0. All 206 hosted contract tests passed;
the subsequent actual-graph check exposed the stale exact pin.

The follow-up advances `SECURE_OVERRIDES['@modelcontextprotocol/sdk']` in
`scripts/qa/check-retired-signing-graph.mjs` to the same exact patched 1.32.0.
It adds a regression rejecting formerly admitted 1.31.0 package nodes,
snapshot nodes, importer resolutions and snapshot edges. The exact-version
requirement is retained; this does not admit a wider version range or bypass
the scanner. The audit parser and mitigation policy remain unchanged.

- `node scripts/qa/check-retired-signing-graph.mjs`: exit 0, 207 manifests
  checked; source/lock contract only, vulnerability scan and installed
  compatibility explicitly NOT_RUN by this command.
- `node --test scripts/qa/check-retired-signing-graph.test.mjs`: exit 1;
  206 passed, including the new old-SDK rejection test; one existing symlink
  fixture failed with Windows `EPERM`. No test skipped or relaxed.
- The dependency inputs and their recorded hashes in the companion JSON did
  not change in this follow-up.

Fresh exact-head hosted security execution remains required. No merge or
deployment is performed by this correction.

## Append-only SBOM refresh - 2026-10-21T07:20:13Z

MEASURED: hosted security run
[39561049941](https://github.com/szl-holdings/platform/actions/runs/39561049941)
at source `a4773e4bee3219a5b4d65cacd237007e9ab62cf8` passed the repaired
actual-graph contract and the real vulnerability report, but the tracked SBOM
freshness assertion rejected the old inventory. Secret, license and lockfile
jobs passed. The security gate correctly remained blocked.

`node scripts/qa/generate-sbom.js` exited 0 and regenerated
`security/sbom-latest.json` plus its immutable content-addressed history file
from the unchanged dependency inputs recorded in the companion JSON. Inventory:
1,810 package components, one verified local patch, official vendored
CycloneDX 1.4 schema validation. Both files have SHA-256
`4bf3c4111ecc8588b1fb3f548b3b12bd49c3fc33b31553d7df66b8c61ec2e11a`.
The new history filename is `sbom-4bf3c4111ecc8588b1fb3f548b3b12bd49c3fc33b31553d7df66b8c61ec2e11a.json`.
Existing history is preserved. This inventory does not replace the separate
vulnerability scan.

`node --test scripts/qa/generate-sbom.test.mjs` exited 0: 15 passed, one
pre-existing Windows symbolic-link test skipped by the unchanged suite. The
current-lock/patch equality assertion and content-addressed-history checks
passed. No assertion, schema, generator or workflow is changed. A fresh
exact-head hosted security gate remains required.

## Append-only scope clarification - 2026-10-21T07:22:01Z

The local four-file security-suite row above is clarified to distinguish its
own command result from the unavailable canonical `platform_tests` aggregate.
The exact command, totals, exit status and source-log SHA-256 are retained in
`scoped_check_counts` in the companion JSON. The original row remains in
immutable commit `bdb51d188204fb21a105a3c4494d868f9e4b0654`; the failed local
log is retained. No truth metric, allowlist or scanner rule changes.

MEASURED hosted security run
[39561355998](https://github.com/szl-holdings/platform/actions/runs/39561355998)
at `6556f13364894f8bb706e54c50a6b0f9b04f38df` completed successfully: dependency
scan, blocking Security Gate, secret scanning, lock integrity and license
compliance. This observation covers that exact head, prior to this documentation
clarification; it does not constitute a protected merge or deployment.

## Append-only local completion boundary

MEASURED at 2026-10-21T07:23:40.845125+00:00: the full workspace typecheck exceeded
the local 600-second harness bound. Its result is UNAVAILABLE, not passed.
The log was retained. After verifying its exact command-line identity, only
the owned Turbo PID 51412 and descendants were terminated; the subsequent
owned compiler inventory was empty. The companion JSON records the timeout
and output hash. Hosted exact-head Typecheck remains the required complete
verdict. The scoped MCP typecheck pass remains independently valid.

pnpm claims:drift exited 0 after the local result was explicitly scoped
in the documentation and JSON. No truth metric or scanner rule changed.
