# Replication origin-index proof packet

- Workcell: `replication-origin-index-20261017`
- Agent / recorded by: Codex, replication implementation lane
- Recorded date: 2026-10-17 (America/New_York)
- Base source: `cc573d15c4843f0d8e6aa6cc7aafdb0fbe1edd63`
- Evidence class: **MEASURED** for the local commands and results below only.
- Scope: upstream receiver storage API; no consumer deployment or sender activation.

## Plan recorded before implementation

Add `KhipuLMDB.append_replicated(origin)` in the canonical Python package. Keep
the existing append bytes unchanged. Validate finite foreign payload/envelope
digests; atomically backfill a bounded local prefix, resolve an origin index,
append a wrapper only if new, and commit the index/counter/cursor together.
Retain historical duplicates and reject conflicts or invalid history without
writes. Exercise actual multi-process writers, process reopen, and process exit
before transaction commit. Add the package suite to hosted CI without expanding
workflow authority. Preserve the separately publishing A11oy/Killinchu integrity
repair branches.

## Patch and contract

The upstream core adds `origin:<foreign digest>` and `meta:origin-indexed-count`
keys to the existing unnamed LMDB database. `append_replicated` returns the
original local wrapper and `duplicate: true` for an exact replay. Full canonical
origin bytes, including unauthenticated auxiliary metadata, must match; different
bytes sharing a digest fail closed. This is an integrity/idempotency policy,
not authentication or a proof that a foreign receipt's metadata is true.

Backfill runs only in an explicit write transaction and validates the local
chain plus foreign payload/envelope integrity. It scans at most 1,000 local
records and 16 MiB per write. Origins are limited to 1 MiB canonical JSON.
Oversized history requires offline reconciliation; no automatic repair or
deletion is implemented. Read methods perform no migration.

The existing `append` implementation uses an extracted transaction helper with
unchanged canonical encoding and receipt fields. A byte-level fixture verifies
the existing persisted receipt representation. The new CI job uses Python 3.12,
`pytest==9.1.1`, `lmdb==2.3.0`, the repository's pinned Actions, read-only contents
permission, disabled persisted checkout credentials, and a five-minute timeout.

## Commands and results

The Python runs used `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1`,
`PYTHONDONTWRITEBYTECODE=1`, and `PYTHONPATH=<checkout>/packages/khipu-lmdb`.
Each run used a fresh checkout-local `--basetemp` path to avoid a pre-existing
host ACL denial on the shared pytest temporary directory.

| Command | Exit | Result |
|---|---:|---|
| `python -m pytest -q -p no:cacheprovider --basetemp=<fresh-path> packages/khipu-lmdb/tests` before patch | 0 | 2 passed |
| `pnpm typecheck` before patch | 1 | **BLOCKED** before TypeScript execution: repository expects pnpm 10.26.1, installed wrapper runs 11.25.0 |
| `python -m pytest -q -p no:cacheprovider --basetemp=<fresh-path> packages/khipu-lmdb/tests` after first implementation | 0 | 23 passed |
| Same package pytest command after cursor, chain, and size-bound regressions | 0 | 31 passed |
| Same package pytest command after independent review key-stability correction | 0 | 37 passed |
| `pnpm typecheck` after patch | 1 | Same unsupported-engine blocker; no TypeScript pass claimed |
| `python -c "import yaml; from pathlib import Path; d=yaml.safe_load(Path('.github/workflows/tests.yml').read_text()); assert d['jobs']['khipu-lmdb']['permissions']=={'contents':'read'}"` | 0 | YAML parsed and new job permission verified |
| `git diff --check` | 0 | No whitespace errors |

The suite launches six separate Python processes against the same actual LMDB
directory. Exactly one creates the wrapper; the others return its existing
digest. Another independent process reopens the store and returns a duplicate.
A second subprocess exits with code 23 after all append/backfill/index writes
but before the real LMDB transaction commits. Reopening shows the exact
pre-transaction key/value map; the next legitimate write succeeds once.
Malformed history, conflicts, invalid pointers/cursors, broken local links,
limits, and read-only behavior have separate assertions.

Independent review found that Python dictionaries with numeric keys could pass
legacy producer hashing but change canonical ordering when frozen through JSON.
The new replication path now recursively requires string object keys before
opening its transaction. Six regressions cover numeric/boolean payload keys,
nested dictionaries and tuples, top-level/nested metadata keys, complete
database nonmutation on rejection, and stable replay with string numeric keys.
Legacy `append()` encoding is unchanged. The reviewer independently ran the
earlier 31-case package suite; the 37-case corrected result above is from this
implementation lane, pending independent replay.

Final independent incremental review: **PASS**, with exact source/test hashes
matching the candidate. The reviewer replayed all 37 tests in 1.69 seconds.
Both original numeric-key payload and metadata reproducers were rejected twice
with the full database unchanged; valid string-key replay remained accepted.
This closes the reported canonical-freeze defect within the local test scope.
It is not hosted deployment, sender recovery, or an external security audit.

## Verification and boundaries

- **MEASURED:** local package behavior on Windows/Python 3.12 and installed LMDB
  2.3.0; no assertion about provider filesystem durability.
- **DECLARED:** hosted Linux job configuration. Hosted execution is **NOT RUN**
  for this candidate at packet creation.
- **BLOCKED:** broad workspace TypeScript validation due to the unchanged local
  pnpm version mismatch. No dependency overrides or global package-manager
  changes were made.
- **NOT RUN:** `actionlint`, full monorepo test/build, provider publication, and
  runtime restart qualification. YAML parsing is not an Actionlint pass.
- Screenshots and route smoke are not applicable: no UI or route was changed.
- Public claim review: no production, sender recovery, or deployment claim added.
- Security review: no secrets, credentials, or environment values added. Native
  hosted security scanning remains a separate required release check.
- Known gaps: appended the bounded receiver capability and open consumer/sender
  recovery work to `docs/operations/known-gaps.md`.
- `docs/APP_STATUS.md` remains historical/superseded as that document instructs;
  this patch does not change product readiness.

## Consumer handoff

At reviewed A11oy source `9d50645d92d43a427859978396bd620bb4b566b6`,
`a11oy_state_store.STORES` already includes `khipu_repl`; its LMDB snapshot and
logical digest include every key/value, so the new index uses that existing
storage owner. Consumers must sync the canonical package through their vendor
manifest process and replace the route's separate foreign-digest lookup and
wrapper append with `append_replicated`. No new database directory or bucket
write path is required.

The index assumes trusted local database bytes; it does not authenticate
arbitrary on-disk edits. Existing duplicate wrappers are not erased. Large
history migration, durable outbound cursor/pause state, peer authentication,
hosted crash/restart, and cross-host recovery remain unqualified. Outbound
replication remains blocked pending those independent gates.
