# Platform #963 Zod 4 compatibility and dependency proof

- **workcell_id:** PLATFORM-963-ZOD4-20261023
- **agent / recorded_by:** Codex, platform_lyte_remaining_oct23
- **recorded_at:** 2026-10-23T23:12:00Z
- **objective:** repair demonstrated Zod 4 migration failures and remove vulnerable Zod/body-parser resolutions through the normal PR path.
- **proof_level:** 2, local source verification only.
- **evidence class:** MEASURED for the local commands below. Hosted exact-head CI, merge, deployment, and runtime qualification remain BLOCKED pending their own gates.

## Context and plan

Prepared in an isolated worktree at PR #963 head `592b8dff9e4cbed1675a90abaef4945527016485`, based on main `55a404f12c81b79e673a95e074154dfd5e3c1361`. Before editing and again before committing, GitHub reported the same head/base, Dependabot ownership, zero comments and zero reviews. No active local writer for the branch was observed. No remote branch, runtime, provider, configuration, or credential was changed during preparation.

The initial AST inventory identified 165 direct one-argument `z.record` calls in 70 files. TypeScript 6.0.3 on 25 pure contract roots produced 21 errors with installed Zod 4.4.3 and zero with Zod 3.25.76. Three Atelier defaults additionally relied on the former input-parsing behavior of `.default({})`.

## Patch summary

- Give every inventoried record an explicit string key schema; preserve each existing value schema and validation chain.
- Expand three Atelier object defaults to their existing child defaults, including denied capability values and the existing finite budget values.
- Add schema-default, metadata-filter, and Lutar invalid-evidence regressions. Lutar's enum-key record remains unchanged: its evaluator already requires all six dimensions. A sparse-record hypothesis failed both old/new baselines and was discarded; failed receipts were retained.
- Pin both direct `@openai/agents` dependencies to 0.2.1. This is the earliest inspected revision admitting Zod 4 and OpenAI 6; 0.2.0 still depends on OpenAI 5, whose peer contract requires Zod 3. Preserve the SDK adapter API and update its version comment.
- Resolve Zod exclusively to 4.6.6, body-parser to 2.4.0, and qs to 6.16.1. Regenerate the lockfile with pinned pnpm 10.26.1, with scripts disabled and no package installation.
- Regenerate the source-bound CycloneDX SBOM and preserve its content-addressed history. The final graph has 1806 components and one verified local patch; SHA-256 `dcf563dc95c9349768f32a1312905ff8a64a3e580548dbf270ef8389b51d076a`.

## Dependency authority and peer admission

The [reviewed Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) identifies 4.6.6 as the patched floor. The [reviewed body-parser advisory](https://github.com/advisories/GHSA-27r3-jxmh-p828) identifies 2.4.0 as the patched v2 floor. The [official Zod migration guide](https://zod.dev/v4/changelog) documents the changed record arity and default-output semantics.

Original npm registry metadata was checked separately because pnpm's override rewrites peer ranges inside its lockfile. All ten Zod consumers admit 4.6.6:

| Original consumer | Original published Zod range |
| --- | --- |
| @anthropic-ai/sdk 0.98.1 | ^3.25.0 or ^4.0.0 |
| @modelcontextprotocol/ext-apps 1.7.4 | ^3.25.0 or ^4.0.0 |
| @modelcontextprotocol/sdk 1.32.0 | ^3.25 or ^4.0 |
| @openai/agents, agents-core, agents-openai, agents-realtime 0.2.1 | ^3.25.40 or ^4.0 |
| drizzle-zod 0.8.3 | ^3.25.0 or ^4.0.0 |
| openai 6.42.0 | ^3.25 or ^4.0 |
| zod-to-json-schema 3.25.2 | ^3.25.28 or ^4 |

Express 5.2.1 is the sole body-parser parent and declares `^2.2.1`; 2.4.0 is admitted. body-parser 2.4.0 requires qs `^6.16.1`, so the former 6.16.0 override was advanced. The graph removes Agents 0.0.15, OpenAI 5.23.2, Zod 3.25.67/4.4.3, body-parser 2.3.0, and qs 6.16.0. New content-type 2.1.0 and iconv-lite 0.7.3 resolutions are body-parser dependencies, not unrelated upgrades.

## Actual commands and results

Receipt directory: `work/estate-recovery-20261023/platform-lyte` in the operating workspace. Custom configs and raw command outputs are retained there; they do not replace repository CI.

| Command actually run | Exit | Result |
| --- | --- | --- |
| `node ../check-contract-types.cjs 3.25.76` before patch | 0 | 25 roots, zero diagnostics |
| `node ../check-contract-types.cjs 4.4.3` before patch | 1 | 21 actual migration diagnostics after resolving the harness's node types |
| Same focused type command after patch, versions 3.25.76, 4.4.3, 4.6.6 | 0 each | 25 roots, zero diagnostics each |
| `node node_modules/vitest/vitest.mjs run --config ../zod-focused.config.mjs` with each explicit version | 0 each | 51/51 across three existing/new test files for each version |
| `node node_modules/vitest/vitest.mjs run --config ../sdk-native.config.mjs` | 0 | 35/35 across four existing bridge test files, using real Agents 0.2.1 and Zod 4.6.6 for tool/evidence-steward paths; existing agent/guardrail mocks retained |
| `node <pinned-pnpm-10.26.1>/bin/pnpm.cjs install --lockfile-only --ignore-scripts --no-frozen-lockfile` | 0 | 204 workspace projects; downloaded 0, added 0; unrelated existing peer warnings retained |
| Original published peer/dependency semver check | 0 | 12 checked dependency contracts admitted the selected versions |
| `node <pinned-pnpm-10.26.1>/bin/pnpm.cjs audit --json` | 1 | high 0, critical 0, moderate 11, low/info 0; full raw output retained |
| `node scripts/qa/generate-sbom.js` | 0 | Final lockfile-derived SBOM generated and validated |
| `node --test scripts/qa/generate-sbom.test.mjs` | 0 | 15 pass, one existing Windows symbolic-link skip |
| `node <pinned-pnpm-10.26.1>/bin/pnpm.cjs typecheck` | 1 | BLOCKED: turbo is unavailable in this sparse, uninstalled checkout |
| `git diff --check` | 0 | No whitespace errors |

The exact 4.6.6 archive SHA-256 is `312553620ac82cbb25d505100fbb41c1e219b3cd6979cf93c3a1b4dd5b79e039`; its published SHA-512 integrity was verified before extraction. The four exact SDK archives, MCP 1.32.0 and OpenAI 6.42.0 were likewise integrity-verified for bounded local checks. Existing external dependencies were reused through read-only junctions/resolution; this is not a full frozen-lockfile installation. No install scripts were run. The local harness's initial missing-type/module/alias failures were retained before corrected runs, as were the disproved Lutar hypothesis failures.

## Review and limits

The first independent compatibility review reported no actionable findings for tracked diff SHA-256 `dd4a659b3d263316e8e55f10d0c2605983ee10a63044b4468f561a7305bc062d` and the accompanying new schema-default test. That snapshot predates dependency, SDK comment and final SBOM changes; it is not approval of the final diff.

The subsequent independent dependency review reported no actionable finding for its five-file diff SHA-256 `117f4bd2309705e50aec0b11173b64c120984db65be2c360bd12870dd2ad931c` and lockfile SHA-256 `5c9bfb40d7d62d5b722085636ce58e46dbf3f115cf4a91e8de5477c5c2e3b0b9`. It checked the ten original Zod consumer contracts, SDK/MCP handling and 35 adapter tests. Hosted CI remains a separate gate.

Full workspace typecheck, full native tests/build, exact-head hosted CI, protected merge, and runtime checks remain required. Eleven moderate audit findings remain in Hono, Vitest mocker, nodemailer, and ip-address. The raw audit's nonzero exit is preserved. Body-parser 2.4.0 was verified through source metadata, graph/peer admission and audit; its complete native suite was NOT RUN locally. Existing route tests use the available Express toolchain and are not a full dependency qualification.

- **screenshot_refs:** NOT RUN; no UI surface changed.
- **public_claim_check:** No new runtime, production, model, certification, or autonomous capability claim.
- **security_check:** No secrets, tokens, `.env` values, provider settings, or live stores changed. No scanner, policy threshold or required test was weakened.
- **known_gaps_update:** Appended PLATFORM-963-ZOD4-20261023 source qualification entry.
- **signing/hooks:** SSH commit signing is configured. No active hook or configured hooksPath was present in the shared Git hooks directory at pre-commit inspection; hook execution is NOT RUN. No bypass flag or hook override is used.
