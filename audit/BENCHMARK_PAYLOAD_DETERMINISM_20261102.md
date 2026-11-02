# Benchmark Payload Determinism Proof Packet

- `workcell_id`: `BENCHMARK-PAYLOAD-DETERMINISM-20261102`
- `agent`: CodexSmith
- `objective`: Replace Python process-randomized benchmark route seeding with
  an explicit stable digest derivation while preserving the `--seed` contract
  and result schema.
- `recorded_at`: `2026-11-02T04:46:05Z`
- `recorded_by`: OpenAI Codex
- `proof_level`: 2 (Standard Proof; non-UI benchmark harness source)

## Source boundary

GitHub `szl-holdings/platform@main` was observed at
`21d4ee44d4eb9b3a8fcb30530b02f9de6ff52537`. Its
`benchmarks/run_benchmarks.py` blob was
`0e6628f5c99f56507017518d4a8873d6be579138`, exactly matching the file in
the isolated local worktree before editing. The local worktree branch is
`codex/benchmark-determinism-20261102`; its starting commit is
`3e0cbc07a4b4e5f604b982e49443ce247b571fa4`. The final remote candidate
branch is `codex/benchmark-determinism-clean-20261102`.

Open pull requests were reviewed before publication. This candidate does not
touch any of PR #1002's embedding files. Its hosted wiring shares the Tests
workflow and workflow-governance contract with draft PR #1010, but uses a
separate Python-matrix job and assertion. Both additions must be retained when
either candidate reconciles after the other; the two owners exchanged the exact
step names, commands, and assertion names before editing.

Before final publication, `main` advanced to signed commit
`590e0c9f279d7ec2083c31581499825416a647a7` by merging PR #1002. The
benchmark source remained blob `0e6628f5c99f56507017518d4a8873d6be579138`,
and the two new candidate paths remained absent. The clean successor branch is
rooted directly at that exact `main` revision.

Before exact-head qualification completed, `main` advanced again to signed
commit `a41f03e9fa52231f3b2a6b32cea7af57989c0c6d` by merging PR #1001. Its
benchmark source remained the same `0e6628f5c99f56507017518d4a8873d6be579138`
blob and the two candidate paths remained absent. The candidate incorporated
that revision through a normal two-parent merge with a conventional commit
subject and an expected-head, non-force lease. No history rewrite occurred and
none of PR #1001's or PR #1002's files is changed by this workcell.

Before the reconciled Runtime Audit completed, `main` advanced to signed
commit `9b72438f25faa3474a0933a4a775aff46594ed1b` by merging PR #1005. The
benchmark source was still the same blob and the two candidate paths were
still absent. The candidate incorporated the dependency, lockfile, and SBOM
tree through another conventional two-parent merge with an expected-head,
non-force lease. Before hosted qualification, independent review established
that the new regression was not called by any hosted test entry point. The
workcell therefore expands to five paths with a fail-closed Tests workflow step
and dependency-free workflow-governance assertion. The benchmark behavior and
result schema remain unchanged, and all dependency, lockfile, and SBOM changes
from PR #1005 remain intact. Only PR #1010 shares the separately coordinated
workflow/governance paths.

## Plan summary

1. Reproduce route and paired-stream seed drift under two explicit
   `PYTHONHASHSEED` values.
2. Derive a bounded per-route offset from a versioned SHA-256 domain, route ID,
   and stream name, then add the CLI seed exactly as before.
3. Exercise the real `main()` seed wiring in separate Python processes and
   compare generated payloads across interpreter hash seeds.
4. Lock the existing metadata schema, CLI seed metadata, additive seed
   behavior, and one digest vector.
5. Invoke the dependency-free regression from the hosted Python matrix and
   protect that fail-closed step with a dependency-free governance contract.

Success requires identical route seeds and generated payloads across process
hash seeds, a changed payload stream when `--seed` changes, unchanged result
schema keys, focused tests passing locally and in hosted Tests, and no live
server or provider call.

## Negative control

The original built-in `hash()` derivation was evaluated with CLI seed 42:

| `PYTHONHASHSEED` | route seed | paired seed |
| --- | ---: | ---: |
| `1` | 6202 | 9033 |
| `777` | 6146 | 8432 |

The route was `a11oy.reconcile-handoff`. Both RNG inputs changed solely because
the interpreter hash seed changed, contradicting the harness's reproducibility
contract.

## Patch summary

- `benchmarks/run_benchmarks.py` now derives route and paired RNG seeds from a
  versioned SHA-256 domain, explicit stream label, and full route ID.
- The digest supplies the same bounded 0–9999 offset shape as the prior code;
  `--seed` remains the additive base and remains the value written to
  `meta.json`.
- The harness description now scopes reproducibility to generated request
  payloads under the same seed, harness source, and Python runtime. Live
  latencies, timestamps, host metadata, and server observations remain live
  measurements and are not claimed as reproducible bytes.
- `benchmarks/test_run_benchmarks.py` runs `main()` in subprocesses with
  `PYTHONHASHSEED=1` and `PYTHONHASHSEED=8675309`. Offline doubles capture all
  16 route streams and eight production paired streams, including their first
  measured payloads. The test also locks metadata keys and verifies that a
  changed CLI seed changes the projected non-GET payloads and metadata.
- `.github/workflows/tests.yml` invokes the regression in the existing offline
  Python 3.11/3.12 readiness matrix without installing another dependency.
- `scripts/ci/governance-workflows.test.mjs` requires the exact named command
  and rejects conditional or `continue-on-error` execution.

The candidate produces route seed 3210 and paired seed 6052 for the same route
and CLI seed under both observed interpreter hash seeds.

## Test results

| Command | Exit | Result |
| --- | ---: | --- |
| `python benchmarks/test_run_benchmarks.py -v` | 0 | Focused benchmark contract suite passed |
| `python -m unittest discover -s benchmarks -p 'test_*.py' -v` | 0 | The same suite passed through discovery |
| `python -m py_compile benchmarks/run_benchmarks.py benchmarks/test_run_benchmarks.py` | 0 | Both changed Python files compiled |
| `node --test scripts/ci/governance-workflows.test.mjs` | 0 | Dependency-free workflow contracts passed |
| `git diff --check` | 0 | No whitespace errors |
| `node scripts/qa/scan-secrets.js .` | 0 | CLEAN; no secrets found |
| `pnpm typecheck` (before patch) | 1 | Blocked before package execution: repository requires pnpm 10.26.1; runner has 11.19.0 |
| `pnpm typecheck` (after patch) | 1 | Same pre-execution pnpm engine mismatch; no worse than baseline |

No dependency was installed or downloaded to bypass the pinned package-manager
boundary.

## Verification notes

- The subprocess regression executes the harness's actual `main()` routing
  loop with HTTP and benchmark calls replaced by offline doubles. It verifies
  24 seed/payload streams rather than testing the digest helper in isolation.
- The regression locks the current top-level `meta.json`, route, and paired
  entry key sets. It confirms the base CLI seed remains in `meta.seed`.
- A known vector locks the derivation version:
  `(42, "a11oy.reconcile-handoff", "route") -> 3210`.
- The Tests workflow gains one offline, dependency-free Python command. No API
  route, UI surface, dependency, credential, database, deployment, permission,
  or publication configuration changed.
- No live server was started and no benchmark HTTP request was sent. A real
  exact-head benchmark run remains unobserved and is outside this bounded
  source correction.
- Exact-head hosted checks and independent review remain required before merge.

## Screenshot refs

None. No UI surface changed.

## Public claim check

No public product claim was added or changed.

## Security check

No secret, token, credential, environment file, or external implementation was
added. The derivation uses SHA-256 only as a stable namespace digest for RNG
seed selection, not as a security claim or trust boundary.

## Known gaps update

No pre-existing benchmark-seed entry was present in
`docs/operations/known-gaps.md`, and this change does not alter an operational
readiness status. The defect, correction, validation boundary, and remaining
exact-head/live-run requirements are recorded in this scoped proof packet.
The shared register remains unchanged while several open pull requests carry
independent additive updates to it.
