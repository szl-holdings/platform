# State-native canonical own-key integrity

- `workcell_id`: `CANONICAL-20261101`
- `agent` / `recorded_by`: OpenAI Codex, implementing the owner's platform repair request
- `recorded_at`: `2026-11-01T23:45:21Z`
- `base_commit`: `a465a0aa182f5eb88bdf3131372ca7a9b8199e87`
- `proof_level`: 3, scoped source evidence; no UI surface changed
- Status: candidate for protected review; no merge or deployment performed

## Objective and plan

Preserve own enumerable JSON keys in state-native canonicalization so request
digests and signed receipts bind their values. Before editing, the session
recorded a plan to change only the normalization accumulator, extend the existing
receipt-integrity test file, and document the bounded finding and evidence.

The context scan inspected the pinned tree, root `AGENTS.md`, non-negotiables,
proof/security/claims doctrine, documentation index, historical `APP_STATUS.md`,
known-gaps matches, runtime scripts/source/tests, and CI/test/staging triggers.
There is no nested applicable `AGENTS.md` or runtime package README. Open PRs
#991, #992 and #993 did not modify these runtime files at inspection time.

## Finding and patch

`normalize()` accumulated sorted keys in an ordinary `{}`. Assigning an own
`__proto__` key from a JSON-parsed input invokes that object's inherited setter
instead of creating a JSON member. Different values therefore disappeared from
the canonical bytes and shared the same digest. This is canonicalization data
loss, not a SHA-256 collision or evidence of global prototype pollution.

The patch changes the accumulator to `Object.create(null)`. Input enumeration,
sorting, recursive normalization and unsupported-value rejection stay in place.
The new tests cover root/nested/array own-key preservation, all JSON value kinds,
inherited-key exclusion, ordinary ordering and negative-zero behavior, kernel
request parameter binding, and receipt rejection after an own key is added at
the envelope or nested budget level. The test file is already listed in the
package's `test` script; no workflow or package-script change is needed.

Changed paths:

- `packages/a11oy-runtime/src/state-native/canonical.ts`
- `packages/a11oy-runtime/test/state-native-receipt-integrity.test.mjs`
- `docs/operations/known-gaps.md`
- `CHANGELOG.md` (Unreleased compatibility note, added after contribution review)
- `audit/STATE_NATIVE_CANONICAL_KEYS_20261101.results.json` (scoped runner record)
- This proof packet

## Measured local validation

The runtime package and relevant source/configuration files were materialized
from the exact base through GitHub. This is a scoped checkout, not an installed
monorepo. Tools: Node `24.22.1`, pnpm `10.26.1`, TypeScript `6.0.3`,
`@types/node` `25.3.5`, Biome `2.4.12`, oxlint `1.60.0`.

| Command / stage | Exit | Result |
| --- | ---: | --- |
| Initial global `pnpm typecheck` | 1 | Global pnpm 11.25.0 rejected by required 10.26.1 engine |
| `node toolchain/node_modules/pnpm/bin/pnpm.cjs typecheck`, before and after | 1 | `turbo: not found`; workspace dependencies absent; unchanged environment blocker |
| `node toolchain/node_modules/typescript/bin/tsc -p evidence/tsconfig.state-native.json`, original and patched source | 0 | Strict compilation of all state-native source files passed |
| `node --test packages/a11oy-runtime/test/state-native-*.test.mjs`, original tests/source | 0 | 47 / 47 state-native cases passed; zero failures or skips |
| `node --test packages/a11oy-runtime/test/state-native-receipt-integrity.test.mjs`, new tests against original compiled source | 1 | 1 / 5 state-native cases passed; four expected regression failures reproduced the defect |
| `node --test packages/a11oy-runtime/test/state-native-*.test.mjs`, patched source | 0 | 50 / 50 state-native cases passed; zero failures or skips; repeated after test formatting |
| Biome format on changed test file, using repository configuration | 0 | Formatted one file |
| Biome lint on the two changed code files, using repository configuration | 0 | No diagnostics |
| oxlint on the two changed code files, using repository configuration | 0 | 0 warnings, 0 errors |
| `git diff --check` against the base file index | 0 | Five-path candidate has no whitespace errors |
| `node scripts/qa/scan-secrets.js evidence/secret-scan` | 0 | Clean five-file staging copy; `.mjs` test copied as `.js` because the scanner's extension allowlist omits `.mjs` |

The temporary scoped TypeScript config extends the unchanged runtime
`tsconfig.json`, includes `src/state-native/**/*.ts`, and locates installed Node
types in the isolated toolchain. It does not weaken compiler options. The
remaining workspace-dependent runtime source, Vitest suite, and full monorepo
build/test/typecheck were not executed. Hosted candidate checks remain required.

The [structured scoped results](STATE_NATIVE_CANONICAL_KEYS_20261101.results.json)
retain exact counts, commands, runtime versions, source identities and runner
output digests. These are subsystem results. The canonical `platform_tests`
metric remains `UNAVAILABLE` with null passed/total values; this repair does
not update that metric or claim a full platform test pass.

## Verification and boundaries

- `screenshot_refs`: none; no UI or route was modified, so route smoke and UI
  screenshot checks do not apply.
- `public_claim_check`: no product, deployment or production-readiness claim is
  introduced. `APP_STATUS.md` is historical and unchanged.
- `security_check`: changed content uses generated ephemeral test keys and
  synthetic data; no credentials, private keys, tokens or environment values
  were added. No production data or external service was used by the tests.
- `known_gaps_update`: added `CANONICAL-KEYS-20261101` as a source candidate,
  retaining review/deployment boundaries.
- Compatibility: objects without an own `__proto__` key keep the same intended
  representation. Previously issued digests/receipts that omitted such a key
  will fail verification under the corrected representation. There is no
  compatibility fallback to the lossy form; affected artifacts must be
  reassessed and reissued through their normal governed path.
- The tests establish local serialization and cryptographic binding only.
  They do not establish deployed exploitability, complete JSON canonicalization
  standard conformance, execution completion, or platform operational readiness.

## Protected admission and merge effects

Read-only inspection found active ruleset `22286649`: pull request and squash
merge required; signatures required; strict required status checks; resolved
review threads; zero blanket required approving reviews; conditional extra
approval for unattributed changes. No bypass actors are configured. Required
checks are `Runtime Audit (audit:full)`, `Security Gate (blocking)`, `E2E Gate`,
`severity-gate`, and `lockfiles / No lockfile references a Replit-internal registry host`.
Organization ruleset `24288321` prohibits deletion and non-fast-forward updates.
`CONTRIBUTING.md` requires current-base tested-head admission and explicitly
does not require an unavailable second human for founder-maintainer changes;
external collaborator changes require maintainer review. No DCO sign-off is
required. This first-party implementation was prepared for the owner's task.

Creating this draft starts normal PR checks. A later merge to main triggers
the existing main CI/build checks and `Deploy — Staging` workflow. This candidate
does not dispatch, merge, configure or authorize a deployment, change rulesets,
or claim a verified commit signature. Protected admission and deployment
authorization remain separate requirements. No human review is claimed.

## Proof-format followup

The original [truth-drift run](https://github.com/szl-holdings/platform/actions/runs/41363904352)
rejected the unqualified count wording in this table as canonical platform
test claims. The followup qualifies each result as state-native runner cases
and supplies the structured command/source/runtime record linked above. The
unchanged claims guard reports no failures for the changed Markdown when run
with the actual canonical metrics and original baseline claim identities.
This is a scoped local guard check; the full hosted workflow must rerun.
No scanner, allowlist, metric, registry or result classification was changed.
The known-gap entry was relocated below the current backend-topology boundary
to avoid conflicting with another candidate's append at the end of the register.
