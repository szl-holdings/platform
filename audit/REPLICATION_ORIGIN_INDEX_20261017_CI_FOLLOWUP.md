# Replication origin-index CI follow-up

Workcell: `replication-origin-index-20261017`. This append-only correction
supplements the original proof packet without changing its dated results.

The initial draft PR #944 head `ca83b44773ddb47a7de2bcdb30f8db824fbccc18`
passed the hosted `Khipu LMDB replication transaction contracts` job
(`39081690932`, job `117539772964`). CodeQL reported alert 4766,
`py/side-effect-in-assert`, on a test that invoked `append()` inside an assertion.

The correction moves all seven `append`/`append_replicated` calls out of test
assertions into preceding statements, then asserts their returned values. This
keeps writes present if Python assertions are disabled. No runtime, migration,
API, or workflow source changed, and no scanner suppression was added.

Local validation: the isolated `packages/khipu-lmdb/tests` pytest invocation
returned `37 passed` (exit 0); `git diff --check` passed. This is a focused
package result, not a platform-wide test count. Fresh hosted CodeQL and whole-PR checks are pending
on the follow-up commit; the initial failure is not relabeled as a pass.
Provider publication, consumer route integration, and outbound activation remain
outside this draft. The prior pnpm typecheck environment blocker is unchanged.
