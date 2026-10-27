# Platform PR 963 generated Zod and manifest repair

Workcell: PLATFORM-963-GENERATED-ZOD-20261025.
Evidence class: **MEASURED** for the commands below; source candidate only.
Baseline: `60966e4b28a7f9202c8352ac5478fa1927adad46`.

## Native evidence and source plan

At the baseline, native Build, repro, browser E2E, A11y and Lighthouse succeed.
CI run `40169924638` and Runtime Audit run `40169924677` fail on the generated
issuer's `zod.coerce.string().url()` call (TS2339). Units run `40169924683` fails
because the checked estate contract manifest predates the PR's source changes.
Those failed receipts are retained; prior successful jobs do not qualify a
later revision.

The browser callback issuer remains optional and accepts the earlier coerced
URL inputs. Its generated expression becomes
`zod.coerce.string().pipe(zod.url()).optional()`. The canonical Orval config
explicitly selects Zod 4, and a narrowly scoped normalizer preserves coercion
after direct generation, wrapper generation and the cached-output path.
Unknown, absent or duplicate generated structures fail closed.

Independent review reproduced Orval's raw output before formatting, including
quoted keys and no terminating semicolon. The normalizer covers that actual
shape and LF/CRLF. Its hook retains a nonzero process exit code if Orval catches
and logs an exception. No broad generated client refresh is claimed.

The canonical estate manifest builder adds the new helper to the API spec's
source closure, and a mutation regression proves the helper changes component
and release identity. Rebuild refreshes the earlier changed shared contracts
and generated schemas. Generated lineage remains `STRUCTURE_ONLY`.

## Commands and receipts

- `node lib/api-spec/scripts/normalize-zod-coercion.mjs`: exit zero; only the
  reviewed issuer expression changes in the generated file.
- `node --test lib/api-spec/scripts/codegen.test.mjs`: exit zero; command
  receipt `pass=9, fail=0`, using the existing local Zod 4.4.3 junction.
- `node ../check-generated-zod-oct25.cjs`: exit zero. The retained exact
  Zod 4.6.6 declarations and TypeScript 6.0.3 typecheck the actual API Zod public
  entry with no diagnostics. In-memory transpilation of the actual generated
  module, importing that exact Zod package, verifies ten valid/invalid issuer
  cases. No repository module or toolchain junction is replaced by the harness.
- `node packages/estate-contract-release/src/build.mjs --check`: before the
  intentional refresh, exit one (stale checked manifest).
- `node packages/estate-contract-release/src/build.mjs`: exit zero.
  Final release identity is
  `sha256:d432ea30e3287839ac2c3886b99b137f674cc49c7eebf70604fe7bf45e4a03aa`.
- `node packages/estate-contract-release/src/build.mjs --check`: after the
  refresh, exit zero with the same identity.
- `node --test packages/estate-contract-release/src/build.test.mjs`: exit
  zero; command receipt `pass=14, fail=0`, including helper mutation coverage.
- `git diff --check`: exit zero.

A bounded TypeScript AST inventory of materialized source found no remaining
incomplete locally resolvable object defaults. This is not a substitute for
the full native typecheck. Source review is independent of the writer; it is
not an independent production runtime attestation.

Full native checks on the final pushed head remain required. No provider,
model, database or VM action is part of this candidate. Deployment and runtime
qualification are **NOT RUN** here. No UI or route changes require screenshots.
