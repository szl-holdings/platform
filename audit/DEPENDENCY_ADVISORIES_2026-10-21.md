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
| `node --test scripts/qa/generate-vuln-report.test.js scripts/qa/dependency-patches.test.mjs scripts/qa/third-party-licenses.test.mjs scripts/qa/security-overrides-compat.test.mjs` | 1 | 47 passed, 1 failed: existing symlink-rejection test cannot create its fixture (`EPERM`) on this Windows host. No test skipped or changed. Linux hosted execution remains required. |
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
