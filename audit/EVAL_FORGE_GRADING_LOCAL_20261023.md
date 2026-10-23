# Eval Forge local grading evidence — 2026-10-23

Work unit: EVAL-FORGE-GRADING-20261023.
Base: platform 55a404f12c81b79e673a95e074154dfd5e3c1361.
This records the historical local validation checkpoint, with separate
contract and candidate review. The owner approved the isolated local repair
and tests, then separately requested publication as a pull request. Merge,
deployment and policy classification remain separate gates. The public PR
must supply its own exact-head hosted checks; local results do not replace them.

The plan was recorded before edits. The implementation requires requested
refusal independently of matching quality fields, rejects invalid supplied
normalized scores, and preserves selected fallback provenance through case
results. Validation covers coherence, relevance, citationAccuracy,
reflectionScore and humanScore. Missing or undefined values retain the prior
fallback/pending semantics. Thresholds and policy classification are unchanged.

Runtime provenance is namespaced inside graderDetails. Only defined executor
source values and fallback reasons are retained; unknown sources remain
unknown. Raw snippets and provider error metadata are not copied. The same
selected provenance reaches case callbacks and the report sink, including
grading failures. A local in-memory sink is used in tests.

All results below use SIMULATED inputs and injected fake/null inference.

| Check actually run | Result |
|---|---|
| Original package Vitest suite, four files | 47 collected, 47 passed, exit 0 |
| Original source plus the unchanged @workspace/eval-forge acceptance module | 161 collected, 54 passed, 107 failed, exit 1 |
| Repaired source plus the same acceptance tests, five files | 161 collected, 161 passed, exit 0 |
| Scoped original-source TypeScript check | exit 0 |
| Scoped candidate TypeScript check | exit 0 |

All three collected test runs had zero pending/todo/skipped cases and zero
network-tripwire events. The 107 original-source failures are failed test
assertions, including new provenance requirements, not 107 distinct defects.
The 114 added cases cover malformed/nonfinite/out-of-range scores, finite
controls and exact verdicts, absent fallbacks, refusal dilution and types,
executor fallback/error/parse paths, overflowing JSON numeric input, metadata
filtering and propagation. They are not model-quality measurements.

Commands were direct installed Node invocations. Full arguments, working
directories, stdout/stderr and exit codes are retained in the private local
evidence packet. These are command shapes, not literal reproduction commands:

```text
node <owned-vitest>/vitest.mjs run --config vitest.config.ts --maxWorkers=1 --no-file-parallelism --cache=false --reporter=verbose --reporter=json --outputFile.json=<run-result>
node <owned-typescript>/bin/tsc -p <source-or-candidate-check.json> --noEmit
```

The Vitest working directory was each snapshot's packages/eval-forge. Scoped
TypeScript configs inherit the repository's strict base and include changed
production modules, their imported graph, and all package test files. They
exclude unmodified CLI/nightly entrypoints and do not replace whole-monorepo
typechecking. No route or UI was changed; screenshots and route tests do not
apply to this scope.

Node 24.19.0, Vitest 4.1.11, Vite 8.0.16, TypeScript 6.0.3, @types/node 25.9.3
and zod 3.25.76 were used from a copied owned dependency closure. Vitest 4.1.11
fits the package's declared ^4.1.7 range; exact lockfile reproduction was not
established. No installation completed. The root pnpm typecheck attempt stopped
at an engine mismatch (11.25.0 available, 10.26.1 required) before typechecking;
its automatic dependency-install attempt also stopped at that engine gate.
The initial Vitest startup failed before collection on a missing copied peer
link; the link was repaired locally and the retry results are listed above.
An initial log-print encoding exception was fixed without altering raw logs.

Selected source coverage is 38 exact Git blobs, including the complete
28-file eval-forge package. The untouched original files and historical failed
eight-case baseline remain preserved. No source/runtime/authorization claim
is inferred from a file hash or test result.

Remaining gaps: mandatory/advisory policy meaning, raw confidence/citation
aggregate metrics, complete dependency-lock qualification, full monorepo
checks, actual inference, deployed consumers, persistent storage and runtime
readiness. At the local validation checkpoint, no push, commit, merge,
signing, deployment, training, provider operation or credential/configuration
change had occurred. Later PR publication does not establish those other
states. Withdrawing the PR leaves the protected default branch unchanged;
any later merged change requires its own reviewed rollback.

This is an unsigned local evidence packet, not a release certificate or a
cryptographic proof. Public claims and historical application readiness labels
remain unchanged. No secret or .env content is included in the patch.
