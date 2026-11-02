# AEF Benchmark Output Proof Packet

- Workcell: `AEF-BENCHMARK-OUTPUT-20261102`
- Date: 2026-11-02
- Owner: Codex
- Protected base: `szl-holdings/platform@590e0c9f279d7ec2083c31581499825416a647a7`
- Local test base: `3e0cbc07a4b4e5f604b982e49443ce247b571fa4`

## Context

The target blobs for `scripts/aef-bench.ts`, `scripts/aef/benchmark.ts`,
`docs/aef/LOCAL_DEV.md`, `docs/aef/README.md`, and `package.json` are byte-for-byte
identical on the protected base and local test base. The local worktree is therefore
safe for focused verification without incorporating unrelated older changes. The
publication commit must use the protected base as its parent.

Protected `main` advanced through merged PR #1002 while this workcell was in
progress. Its target-file Git blobs remain unchanged: `scripts/aef-bench.ts`
`1091ee0c8b370161a5cfd32e14f00170f036af3d`, `scripts/aef/benchmark.ts`
`73ee1361d67bab2f10ee6c94330fa810abb58e36`, and `docs/aef/LOCAL_DEV.md`
`4564af7a03565712623d9622db7990efa4742ad2`. This patch does not touch any
file changed by PR #1002.

Both benchmark entry points calculate rows and summary statistics but discard them.
`scripts/aef-bench.ts` emits only transient progress text and
`scripts/aef/benchmark.ts` emits no report. This contradicts the local-development
guide, which promises a summary table, and leaves no stable stdout stream that can be
redirected to a durable record.

Baseline `pnpm typecheck` did not start TypeScript because the runner has pnpm
11.19.0 while the repository requires pnpm 10.26.1. No dependencies or toolchains
will be downloaded for this workcell.

## Plan

1. Add one dependency-free report renderer with fixed table headings and numeric
   formatting.
2. Make both benchmark entry points emit exactly one report after measurements finish.
3. Keep secrets and request/response content outside the report data model, and emit
   only a fixed failure message on stderr.
4. Add Node built-in tests for exact output shape, empty-success handling, and the
   redaction boundary.
5. Document stdout-only output and explicit shell redirection for durable results.

## Success Criteria

- Fixture and live retrieval runs emit ordered domain rows plus an overall row.
- API runs emit embed, hybrid-search, and rerank rows with success/failure counts.
- Empty-success suites render `n/a` statistics rather than throwing while formatting.
- Reports contain no endpoint, credential, tenant, query, or response data.
- Dependency-free focused tests and syntax checks pass.
- Full typecheck is attempted and any toolchain blocker is recorded exactly.

## Validation

- `node --test scripts/aef/benchmark-report.test.ts` — PASS (3 tests).
  Exact retrieval and API tables, zero-success `n/a` handling, renderer redaction,
  and entry-point wiring are covered.
- `node --check` for both entry points, the renderer, and its test — PASS.
- Mocked entry-point run for `scripts/aef-bench.ts --iterations 2 --warmup 0` —
  PASS. It emitted two ordered domain rows and `OVERALL`.
- Mocked entry-point run for `scripts/aef/benchmark.ts` with two rounds — PASS.
  It emitted embed, hybrid-search, and rerank rows.
- API run with sentinel endpoint, key, and tenant values — PASS. None appeared in
  stdout.
- API health-failure run with a sentinel response body — PASS. Stdout was empty,
  stderr was exactly `AEF API benchmark failed`, the process exited 1, and no
  sentinel value appeared.
- `node scripts/qa/scan-secrets.js .` — PASS (`CLEAN — no secrets found`).
- `git diff --check` — PASS.
- Post-change `pnpm typecheck` — BLOCKED before TypeScript execution. The runner
  has pnpm 11.19.0 and the repository requires 10.26.1. The pinned toolchain and
  workspace dependencies were not downloaded because this workcell prohibits
  external artifact downloads.

The real fixture corpus run was not available without installed workspace
dependencies. The dependency-free renderer tests and stubbed entry-point runs cover
the output contract; protected-branch CI remains responsible for the repository-wide
typecheck. Screenshot verification is not applicable because this change has no UI.
