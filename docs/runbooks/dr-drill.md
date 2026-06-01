<!-- SPDX-License-Identifier: Apache-2.0 -->
# RUNBOOK — Disaster Recovery Drill

**Doctrine v11 — 749 / 14 / 163 — replay hash c7c0ba17**
**Maintained by:** Yachay (yachay@szlholdings.dev)
**Last updated:** 2026-06-01

---

## Purpose

Prove that SZL's durable state (rosie **Unay** memory + a11oy **Khipu** DAG) can be
**backed up, the Spaces rebuilt, and the state restored with verified integrity**.
Script: [`platform/scripts/dr_drill.sh`](../../scripts/dr_drill.sh).

## Endpoint reality check (verified 2026-06-01)

The original DR spec referenced `/api/rosie/v2/unay/export` and
`/api/a11oy/khipu-os/export` + matching `/import` routes. **These return 404 on the
live Spaces.** The drill therefore targets the **actual live durable-state routes**:

| Step    | rosie / a11oy live route |
|---------|--------------------------|
| backup  | `GET /api/<ns>/v2/khipu/lmdb/tail?n=…` + `GET /api/<ns>/v2/unay/stats` + `GET /api/<ns>/khipu/ledger` |
| verify  | `GET /api/<ns>/v2/khipu/lmdb/verify` + `GET /api/<ns>/v2/unay/verify` |
| restore | `POST /api/<ns>/v2/khipu/lmdb/append` (replay) + `POST /api/<ns>/v2/unay/remember` |

> **Follow-up:** if the founder wants the exact `/export` + `/import` contract, add
> those as thin wrappers over `tail`/`append` in each flagship's serve.py on the
> next deploy cycle. Until then this runbook is authoritative.

## Run the drill (backup + verify, safe default)

```bash
# No flagship writes happen unless you pass --rebuild. Safe to run anytime.
bash platform/scripts/dr_drill.sh
# Backups + PRE_HASHES.txt land in ./dr-backups/<UTC-timestamp>/
```

Last verified run (2026-06-01): backed up both flagships, restored entries via
`append`, and post-restore `lmdb/verify` returned `{"ok": true, "broken_at": null}`
— **chain integrity confirmed**.

## Full drill with rebuild (FOUNDER-GATED, race-aware)

```bash
export HF_TOKEN=...        # founder/betterwithage write
bash platform/scripts/dr_drill.sh --rebuild
```

`--rebuild` commits a no-op `.dr_drill` marker to the rosie + a11oy Spaces to force
a rebuild, waits 120s, then restores. **Do NOT run during a sibling-agent commit
window** — the script prints a 5-second abort warning before committing.

## Integrity check

1. `PRE_HASHES.txt` records `sha256` of every pre-rebuild dump.
2. After restore, re-run the backup and diff the new hashes against `PRE_HASHES.txt`.
3. The apps' own `lmdb/verify` must return `ok: true` with `broken_at: null` both
   before and after — the hash-chain head should match the restored content.

## Schedule — monthly

Add to `.github/workflows/` (runs backup+verify only; rebuild stays manual):

```yaml
name: dr-drill
on:
  schedule:
    - cron: "0 9 1 * *"   # 09:00 UTC on the 1st of each month
  workflow_dispatch:
jobs:
  drill:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: bash platform/scripts/dr_drill.sh
      - uses: actions/upload-artifact@v4
        with: { name: dr-backups, path: dr-backups/ }
```

---

*Co-Authored-By: Perplexity Computer Agent*
*Doctrine v11 — 749/14/163 — c7c0ba17 — signed Yachay*
