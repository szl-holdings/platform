# Platform proof JSON read repair — 2026-10-04

## Fixture-only follow-up after native verification

Published successor `b941de4239f41828bf10e51c0fdf8a2a28ba0b93`, tree
`530519af25bbbf099ff0992473e068d25d818b30`, completed the native
[reproducibility workflow](https://github.com/szl-holdings/platform/actions/runs/37231876533):
both fresh builds ran 46 uncached tasks and captured 3,455 matching files, with
archive SHA-256 `77c9a1eef2a245cc5b8f5c2fc42103bf5fce2e3cca1e7380eb9f0219c53c3608`.
Typecheck and RuntimeAudit also passed. The original production-reader finding
was no longer the reported location; CodeQL identified a separate test-fixture
check/read sequence in alert 4658, comment 4179202463.

The fixture now retains the serialized receipt returned by its own native
`captureBuild` call. Replacement files use those owned bytes directly, so fixture
initialization no longer checks and then rereads the proof pathname. Production
reader, comparison, archive, workflow and dependency bytes are unchanged. All
native scheduling hooks, inode-read accounting and mutation controls remain.
Fresh successor CodeQL is required; no query suppression or alert dismissal is
introduced. The two dependency High findings remain unwaived.

## Workcell and recorded plan

- Workcell: `platform-repro-read-race-20261004`, follow-up to platform PR #882.
- Published input: `07a55f869fdfcdf85e99cc90327982323afc9fd5`.
- Published input tree: `9b6f05a5cc9e6f1124f696eb7917e98b4b66a969`.
- Observed main: `f2f8df6f89056e9104587674ccec0855dd5b177a`.
- Review and measurement date: 2026-10-04.
- Scope: proof JSON reader, its regression tests, this audit note and the known-gap supplement.
- Proof level: local source behavior; fresh published-source CI remains required.

The plan was recorded before editing: reproduce the reported check/use race with
temporary native files; bind validation and bounded reading to one descriptor;
reject a changed file or pathname; test failures and descriptor closure; preserve
the existing comparison and its prior native evidence. The repository doctrine,
non-negotiables, existing proof contract and known gaps were reviewed. No UI,
application route, dependency, workflow, scanner policy or release status changes
are part of this follow-up. Screenshots and route checks do not apply.

## Actual finding and native negative control

The [CodeQL review comment](https://github.com/szl-holdings/platform/pull/882#discussion_r4179055200)
on the exact published input reports
[alert 4657](https://github.com/szl-holdings/platform/security/code-scanning/4657),
a High-severity potential filesystem race at
`scripts/ci/repro-artifacts.mjs:23`. The old `readJson` checked a pathname with
`lstatSync` and then read the pathname separately with `readFileSync`. Replacing
that path between calls could redirect the read to a different inode and bypass
the checked regular-file and size boundary. This is a source defect; the
measurement does not claim that a real build was attacked.

The new regression ran first against the unchanged reader. After its native
metadata check, the test renamed a valid temporary capture and replaced its name
with a real symlink to another temporary JSON file. It observed one read of the
replacement and failed the zero-replacement-read assertion with exit 1. The same
test passes after the repair: no replacement bytes are read, pathname drift is
rejected, and no comparison receipt is emitted. The hooks only select the
scheduling boundary; native filesystem calls supply the descriptors, metadata,
renames, symlinks and bytes.

## Reader contract

The reader opens with `O_RDONLY | O_NOFOLLOW | O_NONBLOCK`, then validates the
opened descriptor with `fstatSync`. The final-component symlink cannot redirect
the open. Nonblocking mode lets a FIFO be rejected as nonregular without waiting
for a writer. Only regular files up to the existing 16 MiB limit are admitted.

All reads use that descriptor. Allocation is bounded to the admitted length plus
one byte, and individual reads are at most 64 KiB. Short reads continue until EOF
or the fixed bound. Growth, truncation and incomplete reads cannot expand the
limit or produce accepted JSON.

Before parsing, the reader compares native descriptor and final pathname
metadata with the original descriptor. Device, inode, mode, link count,
ownership, size and nanosecond modification/change times must remain identical.
The final pathname must still be a regular file. Access time is excluded because
reading a file can legitimately advance it. The descriptor closes in a
`finally` block on success, parse failure and filesystem errors.

The existing source identity, task coverage, reviewed output roots, cleanup,
archive generation and exact comparison fields are unchanged. This follow-up
repairs the JSON read boundary identified by the alert; it does not establish a
general filesystem snapshot or change the build-artifact contract.

## MEASURED local controls

Node 24.19.0 and the existing repository-pinned Biome installation were used.
No dependency install, full build or new local audit was needed for this
built-in-only reader change.

| Check | Exit | Observation |
|---|---:|---|
| New pathname-replacement test against the old reader | 1, expected | Native replacement bytes were read once; the regression caught the defect. |
| Same test after the descriptor repair | 0 | Zero replacement reads; changed pathname rejected. |
| `node --test scripts/ci/repro-artifacts.test.mjs` | 0 | 37 passed: all 24 existing controls plus 13 new controls; zero skipped. |
| `node --check` for the reader and test | 0 | Both source files parse. |
| Changed-file `biome check` after applying its formatting | 0 | Reader and tests conform to existing format/lint rules. |
| `git diff --check` | 0 | No whitespace errors. |

The 13 additions cover a symlink replacement during the check/read window;
growth, truncation, same-size writes with restored modification time, regular
replacement and removal after descriptor admission; existing symlink and
oversized inputs; a real FIFO with a bounded child-process timeout; short native
reads with a measured read-driven access-time update; and descriptor closure
after success, invalid JSON, metadata failure and read failure. The native growth
control expands a sparse file by 32 MiB but the reader consumes at most the
original admitted length plus one byte.

The initial expanded test run exposed two test-hook accounting errors: it counted
the fixture's own copy read and unrelated archive/receipt opens. Restricting those
measurements to the admitted proof file corrected the test harness; the repaired
production reader did not need another behavior change.

The earlier local full typecheck attempts remain recorded in
[`PLATFORM_REPRO_REPAIR_20261004.md`](PLATFORM_REPRO_REPAIR_20261004.md): nested
Corepack could not resolve its registry request. The
[native Typecheck on the exact input](https://github.com/szl-holdings/platform/actions/runs/37229161376/job/111515056064)
subsequently passed. This local reader-only follow-up does not relabel that
prior-source result as a new-source typecheck; fresh native checks remain due.

## Preserved native reproducibility proof for the input source

The actual
[native reproducibility job](https://github.com/szl-holdings/platform/actions/runs/37229161274/job/111514975834)
passed both complete fresh-checkout/frozen-install builds and strict comparison.
Its event source was synthetic merge
`301a0c438a6206ca97bbda52745786fee8ea89d8`, whose verified parents are observed
main `f2f8df6f89056e9104587674ccec0855dd5b177a` and the published input
`07a55f869fdfcdf85e99cc90327982323afc9fd5`. Its tree equals the published input
tree exactly.

Both builds executed 46 tasks with zero cache hits and captured 3,455 files.
Both deterministic archive hashes are
`77c9a1eef2a245cc5b8f5c2fc42103bf5fce2e3cca1e7380eb9f0219c53c3608`.
The comparison reports PASS at 2026-10-04T19:48:27.674Z. Both preparation records
include removal of the tracked generated clients and estate manifest, so this
run did exercise regeneration. Its CPU checks, installs and builds all passed.

Artifact `11312553563`, named `reproducibility-37229161274-1`, is a
756,796-byte ZIP with SHA-256
`3eb3fd854462dbd2d179c3e34f45c11f7aabef61146d1e45f973fc5fc052a813`.
The downloaded ZIP hash and seven member names were verified before extraction.
Independent parsing confirmed equal task lists, all file records, source
identities and archive hashes across the two captures. These immutable receipts
and the full native log remain prior-source evidence. They have not been edited
or substituted for fresh evidence at the reader successor.

This resolves the earlier full-hosted-proof gap for the input tree only.
Earlier local/hosted failures remain historical failures. The claim is
same-run declared-output equality, not cross-day hermetic reproducibility,
release qualification or a successful CodeQL result for the new reader.

## Remaining security and publication gates

The input's
[native dependency scan](https://github.com/szl-holdings/platform/actions/runs/37229161323/job/111514975873)
still reports two High findings: node-forge `GHSA-86w9-cpqp-85rv` and braces
`GHSA-vfj7-8cjw-p6xm`. Its dependency, Grype and Security Gate jobs remain
failed. DOMPurify is already resolved to 3.4.16 in the input and is untouched.
All four existing node-forge patch bindings are unchanged. The CodeQL alert
remains a failed input-source check until the provider analyzes the successor;
there is no alert dismissal, query suppression, threshold change or bypass.

An earlier separate local `pnpm audit --json` request was rejected by automatic
approval review because it might transmit dependency metadata. That rejection
was retained; no retry, proxy or new audit dispatch was used for this follow-up.
Reading the existing native PR results does not manufacture a replacement
local audit result.

The local successor must be published as a normal child of the freshly verified
remote head. Its exact content packet requires independent tree reconstruction
and review. Fresh CodeQL, full native reproducibility and all existing required
checks remain necessary at the eventual published identity. Protected merge,
release and runtime publication are separate gates. No remote mutation or
provider operation was performed while preparing this source repair.
