# Public Surface Truth Proof Packet — 2026-08-01

| Proof field | Recorded value |
|---|---|
| `workcell_id` | `platform-pr-560-public-surface-truth` |
| `agent` | CodexSmith |
| `objective` | Establish fail-closed, generated public-surface truth without changing public routes or protections. |
| `plan_summary` | See **Workcell plan**. |
| `patch_summary` | See **Patch, tests, and final verification** and the exact-head follow-up sections. |
| `test_results` | See **Baseline verification**, **Post-edit typecheck comparison**, and both verification sections. |
| `screenshot_refs` | Not applicable: no rendered UI surface or route was modified. |
| `verification_notes` | See **Route observation method** and both verification sections. |
| `public_claim_check` | No unqualified quantitative public claim is introduced; canonical counts remain governed by generated platform facts. |
| `security_check` | No secret, token, credential, environment value, or protection setting is introduced or changed. |
| `known_gaps_update` | No new gap is introduced; existing route gaps remain explicit in the generated registry. |
| `proof_level` | `4 — Full Proof`; the public-truth verifier and claims boundary are covered, with no modified UI surface requiring a screenshot. |
| `recorded_at` | `2026-08-01T21:14:13Z` |
| `recorded_by` | CodexSmith |

## Workcell plan

- **Context:** the canonical generated truth reports zero customer-facing product surfaces because
  it only scans absent `apps/*/product.manifest.json` records, while historical product documents list
  unrouted preview paths.
- **Scope:** establish one generated public-surface registry in `platform`, bind each route to an
  evidence mode, HTTP availability observation, and source owner, and extend the existing
  `truth-drift` job without changing rulesets or required context names.
- **Excluded:** no A11oy, Killinchu, Bridge, DNS, Hugging Face, deployment, secret, or organization
  protection mutation; no UI source or route change.
- **Success criteria:** deterministic generation, schema and freshness validation, fail-closed live
  HTTP drift, focused negative tests, local truth parity, signed DCO commit, and draft PR only.

## Exact source baseline

- Repository: `szl-holdings/platform`
- Base: `a20e45ee87dfd783cb5ead9beebf69531bc3ed80`
- Base signature: GitHub verified
- Open pull requests at start: `0`

## Baseline verification

`pnpm typecheck` was attempted before source edits. It completed 131 tasks, then exited `2` because
the clean worktree reused a shared dependency junction and package-local `node_modules` links for
`@types/node` were absent in `@szl/mcp-governor`, `@workspace/run-ledger`, and
`@workspace/codex-kernel`. This is recorded as an environment baseline, not presented as green.

## Post-edit typecheck comparison

The exact post-edit command
`.\node_modules\.bin\turbo.cmd run typecheck` (the command behind the root `pnpm typecheck` script)
completed 153 of 169 tasks and exited `1`. The remaining task failed because the isolated successor
worktree reuses a dependency junction whose package-level `pnpm` process refused a non-interactive
modules-directory purge (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`). It emitted no TypeScript
diagnostic in the changed truth files. Compared with the baseline, the check completed 22 additional
tasks and reduced the process exit from `2` to `1`; it is therefore no worse, but it is not presented
as green. The exact-head hosted Typecheck remains the merge authority.

## Route observation method

Each registry entry is verified with an unauthenticated `GET` to its exact compile-time-approved
target, manual redirect handling, and a 15-second timeout. The verifier follows only the one exact
approved redirect encoded for that surface. The registry stores the observed status and final URL.
`LIVE` and `MIXED` remain evidence modes; neither is inferred merely from HTTP 200.

## Patch, tests, and final verification

The patch adds a source registry, deterministic generated manifest, schema/freshness/source-owner
validation, live status and redirect verification, and a measured truth summary. It extends the
existing `truth-drift` job and status context; no ruleset or required-context mutation is part of
this workcell.

Verification completed from the clean worktree:

- `tools/truth/generate-public-surfaces.ts --check --verify-live`: **PASS** for every declared
  record. Quantitative summaries remain in the generated machine evidence and are not duplicated as
  a competing public route claim.
- Live probes use exact compile-time ID-to-URL targets and manual redirect handling. Unknown IDs,
  URL credentials, IP literals, nonstandard ports, mutated final destinations, and redirect escapes
  fail before any unapproved destination is requested.
- Focused and canonical truth suites: **PASS** with zero failures.
- `tools/truth/generate-truth.ts --verify-local`: **PASS** using the repository's locked pnpm
  10.26.1 runtime; measured package parity remained 201.
- `tools/truth/validate-truth.ts`: **PASS**.
- `tools/truth/generate-allowlist-justifications.ts --check`: **PASS** with 133 active
  suppressions unchanged.
- `tools/truth/claims-drift.ts`: **PASS** with no new suppression.
- `scripts/audit/validate-source-of-truth.js`: **PASS**, 66 checks.
- `biome check` on all changed TypeScript and JSON truth files: **PASS**.
- Workflow YAML parse and `git diff --check`: **PASS**.

No screenshot is required because this workcell changes no UI surface; it records existing public
routes and their evidence boundaries. No deployment, DNS, Hugging Face, A11oy, Killinchu, Bridge,
secret, or protection mutation was performed.

## Exact-head review follow-up plan

- Remove the remaining public route-count prose so all quantitative public claims continue to flow
  through the canonical metrics registry and generated platform facts.
- Replace status-only metadata probing with a bounded UTF-8 body read and exact fail-closed
  validators for the approved `robots.txt` and sitemap records.
- Add regressions for a valid chunked robots body, an HTML soft 404, truncated sitemap XML, the
  canonical sitemap entry, and a body over the byte limit.

## Exact-head review follow-up proof

- **Baseline typecheck:** `turbo run typecheck` completed 153 of 165 tasks and exited `1` before the
  follow-up edit because reused package dependency links caused pnpm's non-interactive
  `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` guard. No public-surface TypeScript diagnostic was
  emitted.
- **Post-edit typecheck:** the same command completed 153 of 169 tasks and exited `1` at the same
  dependency-link/pnpm guard. No changed-file TypeScript diagnostic was emitted, so the local result
  is no worse than the follow-up baseline. The previous exact-head hosted Typecheck was green; the
  new exact-head hosted Typecheck remains merge authority.
- **Live verification:** `node node_modules/tsx/dist/cli.mjs
  tools/truth/generate-public-surfaces.ts --check --verify-live` exited `0`, including the bounded
  body and exact content checks against the approved live `robots.txt` and sitemap targets.
- **Focused tests:** `node node_modules/tsx/dist/cli.mjs --test
  tools/truth/public-surfaces.test.ts` exited `0`; every executed public-surface test passed.
  Coverage includes chunked reads, HTML soft 404, malformed and truncated XML, DTD/entity
  rejection, the canonical sitemap entry, and the configured bounded-body ceiling.
- **Complete truth suite:** `node node_modules/tsx/dist/cli.mjs --test
  tools/truth/validate-truth.test.ts tools/truth/generate-truth.test.ts
  tools/truth/claims-drift.test.ts tools/truth/generate-allowlist-justifications.test.ts
  tools/truth/public-surfaces.test.ts` exited `0`; every executed truth test passed.
- **Package-script disclosure:** `pnpm surfaces:test` exited `1` before test execution because the
  reused dependency junction triggered pnpm's non-interactive modules-directory purge guard. The
  direct repository `tsx` entrypoint above is the executed local test authority; hosted package
  scripts remain merge authority.
- **Truth and claims:** local truth verification, truth validation, 133 allowlist entries,
  claims-drift, 26 documentation claims, and 66 source-of-truth checks passed. Generated truth
  artifacts remained byte-for-byte unchanged.
- **Formatting and diff:** Biome checks on both changed TypeScript files and `git diff --check`
  passed.
- **Claim and security review:** the residual public route count was removed rather than creating a
  competing quantitative truth path. No secret, credential, route, deployment, UI, or protection
  change was introduced.
- **Screenshot:** not applicable; this follow-up changes a verifier, tests, and evidence prose, not a
  rendered UI surface.
- **Recorded at:** `2026-08-01T21:14:13Z` by CodexSmith for Platform PR #560.
