# Public Surface Truth Proof Packet — 2026-08-01

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

## Route observation method

Each registry entry was measured with an unauthenticated `GET`, redirects enabled, and a 25-second
timeout. The registry stores the observed status and final URL. `LIVE` and `MIXED` remain evidence
modes; neither is inferred merely from HTTP 200.

## Patch, tests, and final verification

The patch adds a source registry, deterministic generated manifest, schema/freshness/source-owner
validation, live status and redirect verification, and a measured truth summary. It extends the
existing `truth-drift` job and status context; no ruleset or required-context mutation is part of
this workcell.

Verification completed from the clean worktree:

- `tools/truth/generate-public-surfaces.ts --check --verify-live`: **PASS** for all 29 declared
  records, including 12 routed customer-facing web surfaces, 11 explicit unavailable records,
  and 2 reachable machine-metadata records that remain excluded from the customer-facing count.
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
