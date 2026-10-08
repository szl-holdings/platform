# Provider completion source repair — 2026-10-07

## Workcell plan recorded before implementation

- Workcell: `provider-completion-20261007`; actor: Codex provider-completion repair agent.
- Base: `szl-holdings/platform@f2f8df6f89056e9104587674ccec0855dd5b177a`.
- Objective: reject unbound/nonfinal xAI Responses successes before returning a
  provider result; retain every supported Anthropic text block and system message.
- Source references: payload findings GROK-F01 and CLAUDE-005 are untrusted audit
  context, not authority. Source inspection confirmed both gaps on the base.
- Planned source files: `packages/a11oy-atelier/src/provider.ts`, existing provider
  success fixtures, and `lib/ai-engine/src/providers/anthropic/chat-with-tools.ts`.
- Planned tests: shared JSON response vectors; injected/mock-only positive and
  negative tests; pinned Python `_final_output` source replay; focused package
  checks and existing continuity-route regression checks when dependencies permit.
- No route/auth/tenant/governance changes, model/tool execution, provider calls,
  credentials, dependency install, workflow/security gate changes, or remote writes.
- PR #887 changes only provider evidence labels in the overlapping provider file.
  This repair preserves those lines; integration/admission remains a separate step.

## Baseline observations

- `node --version`: exit 0, `v24.19.0`.
- `gh api repos/szl-holdings/platform/branches/main --jq .commit.sha`: exit 0,
  the base above. Open-PR files were checked for an existing completion repair.
- Native Node mocked invocation of `XaiResponsesProvider.generate`: exit 0,
  accepted HTTP 200 with `status=incomplete`, exact model, and nonempty
  `output_text`. This is MEASURED local mock behavior, not a live provider result.
- `pnpm typecheck`: exit 1 before typecheck. The installed wrapper attempted
  dependency verification/install, then the sparse workspace lacked
  `@szl-holdings/workflow-runtime`. No package download was observed. Subsequent
  checks will invoke existing tools directly and will not run installation.
- Screenshots: N/A, no UI is changed.
- Artifact status: Partial remains unchanged. No release, runtime qualification,
  publication, paid inference, or independent witness is established here.

## Supported xAI source contract

The pinned SZL Python reference is
`szl-holdings/a11oy@00f52f2e31c9aed93e83e3814410ec1dde08b03c`,
`routers/atelier_grok.py::_final_output`. The TypeScript Responses adapter will
require exact returned model, root `completed` status and an output array;
ignore non-assistant/non-message items, admit only string `output_text` content,
reject explicitly non-completed assistant messages, reject blank or more than
32,768 Unicode-code-point output, and sanitize provider IDs. A missing assistant
item status defaults to `completed`, matching that pinned Python compatibility
rule. A root `output_text` shortcut alone and nested `{value: ...}` text are not
the Responses contract. The local CLI parser remains a separate unchanged adapter.

Provider documentation consulted: [xAI Responses API reference](https://docs.x.ai/developers/rest-api-reference/inference/responses).
Its schema identifies returned `model`, root response `status`, and typed output
items. This does not establish a successful provider-version/live canary.

## Verification and remaining boundaries

Implementation and post-patch results: NOT RUN at plan time.
Remote commit/push/PR/merge/deploy/publication: NOT RUN by this agent.
Existing ambiguous-reservation retention must remain fail-closed; a provider
response error must not become a releasable pre-inference rejection.

## Post-patch local qualification — MEASURED, 2026-10-07

The runtime source repair is complete locally and remains uncommitted. The xAI
Responses path rejects partial, unbound, shortcut-only, non-assistant-only,
malformed, blank and oversized responses. It preserves admitted text bytes and
uses the pinned Python whitespace set rather than JavaScript `trim()`: NEL and
C0 separators are blank, but BOM is not. Assistant status omitted entirely is
accepted as the Python compatibility contract specifies; explicit null or a
non-completed status is rejected. The root status is always required.

Safe `x-request-id` header fallback is additional existing TypeScript adapter
compatibility, now sanitized; it is **not** a claim of full Python tuple parity.
The shared vectors compare response admission, final text and body-derived ID.
Usage normalization, header fallback and CLI compatibility are separate adapters.
No reasoning or tool block becomes executable authority.

Anthropic's plain completion combines all text blocks in order, preserves all
system messages, and rejects absent/nonfinal stop reasons or blank/nontext-only
answers. The tool-capable path retains proposal/tool metadata; stream output
remains partial delta delivery, not a new stream-finality gate. The singleton
client is loaded only when an uninjected real request is made; local tests inject
clients and never initialize that credential-dependent module.

### Actual commands and results

All commands below ran from the exclusive `platform-provider-completion-20261007`
clone. Every command returned exit 0 unless explicitly noted. Node is
`v24.19.0`; reused tools are Vitest `4.1.11`, TypeScript `6.0.3` and the existing
Biome executable from `C:/Users/steph/szl-work/cyber-evidence-20261002/node_modules`.
No broad install, container/model pull, paid API call or SDK inference ran.

1. `node --experimental-transform-types --test tests/contracts/provider-completion.offline.test.mts`
   — 38/38 native Node tests passed. Node reports its type transformation as
   experimental. The fixtures are local mocked responses, not provider evidence.
2. `python tests/contracts/replay-xai-python-reference.py --source .local-szl-python-reference.source.py`
   — 28/28 Python cases passed, including the 32,768/32,769 code-point boundary.
   Only the AST-selected `_final_output` function and `_SAFE_PROVIDER_ID` constant
   execute, not router initialization, imports, tools or network. Full-source
   Git-blob binding and equality with the checked-in excerpt's selected AST pass.
3. `node node_modules/vitest/vitest.mjs run --config .local-provider-vitest.config.mts`
   — Local provider workcell outcome: 115/115 focused cases passed in five files:
   Atelier provider/state, Anthropic,
   existing Atelier route and new provider-completion route fixtures. Local-only
   aliases resolve policy-engine, Atelier and evidence-ledger to this checkout's
   source, not to another checkout's built package. No CI threshold was changed.
   This is a harness-local count, not the estate-wide `platform_tests` metric,
   which remains UNAVAILABLE.
   Twenty-one invalid route vectors return 502, retain ambiguous reservation,
   write no ledger/staged/committed turn, and replay with 425 without a second
   mocked provider call. One completed vector commits once and replays once.
4. `node node_modules/typescript/bin/tsc -p packages/a11oy-atelier/tsconfig.json --noEmit --typeRoots 'C:\Users\steph\szl-work\cyber-evidence-20261002\packages\a11oy-atelier\node_modules\@types'`
   — scoped strict Atelier package typecheck passed. This package-specific
   `@types` directory is required; the reused root `@types` lacks `node`.
5. `node node_modules/@biomejs/biome/bin/biome format --write packages/a11oy-atelier/src/provider.ts apps/alloy-runtime-api/src/routes/v1/atelier-provider-completion.test.ts`
   — no additional fixes after final edits. All other candidate TypeScript/JSON
   files had been explicitly formatted before the final rerun.
6. `node node_modules/@biomejs/biome/bin/biome lint packages/a11oy-atelier/src/provider.ts packages/a11oy-atelier/src/atelier.test.ts lib/ai-engine/src/providers/anthropic/chat-with-tools.ts tests/contracts/anthropic-completion.test.ts tests/contracts/provider-completion.offline.test.mts apps/alloy-runtime-api/src/routes/v1/atelier-provider-completion.test.ts`
   — exit 0; five pre-existing Anthropic non-null assertion warnings remain in
   the unchanged message conversion logic. No lint suppression was added.
7. `git diff --check` — exit 0.

### Immutable reference and dataset bytes

- Canonical Python source:
  `szl-holdings/a11oy@00f52f2e31c9aed93e83e3814410ec1dde08b03c:routers/atelier_grok.py`.
  Authenticated read-only connector readback supplied all 53,063 bytes. The local
  full-source bytes match Git blob `d272dda277fd5db89dbade47d635551c1354336e` and
  SHA256 `95b3cf2b4c8f90a271a91efe4bd8def1bcc3eff45eb98c7ea4675698005b6bb6`.
- Shared 26-vector fixture SHA256:
  `3d9a779d58e96798c12499d2f552b22c36197088573e5358656803ddaf5661df`.
- Checked-in parser excerpt SHA256:
  `12a35f728f5083aa90eadc0b857c4b6d5bb780658e5522204a8306b84bc5227f`.
- Production TypeScript provider SHA256:
  `ce3afa7bc172dc32a54260b1239200ca7e26a9124921dfa27ae1802292eae7f3`.
- Production Anthropic adapter SHA256:
  `eb8910d18b9e5979c7aa8e27b270f5cfaef5e124aa3b6eb033a8784787194dd5`.

These hashes bind this local candidate and harness dataset. They are not signed
weights, production receipts, independent runtime proof or provider efficacy.
Training/evaluation, hardware energy and model publication: NOT RUN/UNAVAILABLE.

### Retained failures and limited qualification

The initial `pnpm typecheck` did not run its compiler and failed on the sparse
workspace dependency graph. Initial Vitest attempts failed on missing local
package resolution, excluded files, missing canonical tsconfig references and
app-specific dependencies. Those were corrected by materializing unmodified
canonical configuration/source and reusing existing bounded dependencies through
local junctions; no lockfile, package manifest, compiler gate or workflow changed.
An initial new route fixture had an incorrect fixture path and counted a
committed conversation as one record rather than its user/assistant pair; only
the new test was corrected. Initial Biome failed without the sparse checkout's
canonical `.gitignore`, then rejected control characters in the intentional
Python-whitespace regex. Materializing the unchanged ignore file and replacing
that regex with an equivalent numeric code-point predicate fixed those failures
without suppressions. A new test's non-null assertion was replaced by a guard.
The initial Python replay's ordinary `gh` readback failed when that authentication
became unavailable; the final read-only connector source readback and Git-blob/AST
binding succeeded instead. No credential-cache transplant or alternate write
authority was attempted.

During the initial local qualification, full workspace typecheck and full
Anthropic SDK typecheck were UNAVAILABLE, NOT QUALIFIED. The reused local runtime
has no Anthropic SDK installation. Native Node type transformation and Vitest
execution do not establish SDK type compatibility. The later hosted compiler
result below supersedes that local limitation only for its exact published head.
The source reference and test runtime reused here are bounded local checks, not
an assertion of current remote-main parity or an external independent witness.

No production route/auth/tenant/governance/security gate was edited. Existing
PR #887's evidence-label lines remain unchanged in this candidate; their separate
writer/integration must be reconciled before release. UI was not edited and
screenshots are N/A. The `.local-*` harness configuration and full-source readback
are retained local qualification inputs, not release source. Root owns the final
independent review, current-main/overlap refresh and release authority.

Remote merge/deploy/provider publication by this repair lane: NOT RUN. The initial
GitHub authentication blocker was historical; normal intended-account authority
later recovered and root published the reviewed signed candidate in platform
PR #903. Artifact status remains Partial. Live provider completion, durable
evidence, independently pinned signer identity and independent runtime witness
remain unestablished; no provider/capacity gap is relabeled as closed.

### Hosted compiler readback and package-local contract discovery

MEASURED at exact published head
`ab7611c4f2f998359317776557acdcd8d13c8ba7`, on base
`f2f8df6f89056e9104587674ccec0855dd5b177a`:

- Tests run `37646589363` succeeded, including the Atelier provider and API-route
  suites. Its package-recursive log did not establish direct execution of the
  root Anthropic contract fixture.
- Truth-drift run `37646589451` succeeded with the unchanged scanner, metric and
  allowlist after a minimal harness-count wording correction.
- CI run `37646589531` succeeded. Actual Typecheck job `112881026177` executed
  ai-engine `tsc -b tsconfig.json` on cache miss at 15:59:12 UTC. The final workspace
  task result was 185 successful out of 185. This establishes SDK compile
  compatibility for that head, not live provider compatibility or release.

The approved coverage follow-up moves the identical Anthropic fixture into
`lib/ai-engine/tests/anthropic-completion.test.ts`. Root's exact prior-blob
comparison found only its two relative import paths changed, with every case
and the default-client initialization trap preserved. The owning package adds
ordinary Node Vitest discovery and a `test` script. Existing Turbo inputs already
include `tests/**` and `vitest.config.*`, so fixture/config changes bind the
package test cache. No dependency, lockfile, Turbo or workflow gate was changed.
The production provider and Anthropic byte hashes above remain unchanged.

Actual root coverage replay commands:

```powershell
# From lib/ai-engine; only local worker concurrency is bounded.
node ..\..\node_modules\vitest\vitest.mjs run --config vitest.config.ts --maxWorkers 1
# From repository root; aliases still resolve only this checkout's source.
node node_modules/vitest/vitest.mjs run --config .local-provider-vitest.config.mts --maxWorkers 1
```

MEASURED local package-discovery result: 10/10 focused cases in one fixture.
MEASURED local provider-workcell result: 115/115 focused cases in five fixtures.
These are local harness counts, not the estate-wide `platform_tests` metric,
which remains UNAVAILABLE. Local tool version was Vitest 4.1.11. Historical
commands above refer to the fixture's prior root path; the local-only include was
updated to its new owning-package path for this replay.

This follow-up requires its own signed head and actual exact-head hosted checks.
The prior head's green results are not new-head admission. PR #903 remains on
release HOLD: all effective security, severity, runtime-audit, E2E and lockfile
checks must pass, and PR #887 overlap must be reconciled. Real HIGH/CRITICAL
dependency findings are not waived by unchanged dependencies or source-local
success. No merge, paid provider request or live runtime qualification occurred.
