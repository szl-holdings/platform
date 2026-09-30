# READINESS-DR

Checks flagship NDJSON dumps with a local SQLite round-trip.

| | |
|---|---|
| **Schedule** | `10 5 * * *` - daily (UTC) |
| **Entry point** | `executor.py` |
| **Inputs** | Flagships. |
| **Emits** | Backup-and-restore proof receipts. |
| **Pass criteria** | Nonempty valid key/value NDJSON; every supplied record matches after an in-memory SQLite round-trip. |
| **Receipt sink** | `SZLHOLDINGS/readiness-runs` → `receipts/readiness-dr/<date>/<ts>.json` |

## What it does
Fetches each configured flagship's `/unay/dump` response and validates UTF-8
NDJSON. Each nonblank line must contain a JSON object with a nonempty string
`key` and a `value` field. Null values are allowed. Malformed JSON, duplicate
record keys, duplicate JSON fields, and non-finite numbers fail the check.
One invalid line rejects the whole response.

The check loads valid key/value records into fresh in-memory SQLite and reads
back every row, comparing the keys and canonical JSON values with the supplied
records. The proof includes `restore_target: "in-memory SQLite"` and
`verified_rows`. Additional record metadata is outside this integrity check.

The existing upload path attempts to archive each fetched nonempty response
and emits a receipt with its verdict. A malformed archived response remains
`RED`; it is diagnostic evidence, not a verified backup. Failed publication
still fails the workflow in GitHub Actions.

## How it runs
- **Daily** via `.github/workflows/readiness-dr.yml` (cron `10 5 * * *`).
- **Manually**: `python platform/agents/readiness/readiness-dr/executor.py`
  (set the relevant `*_URL`, `OTEL_COLLECTOR_URL`, `HF_TOKEN`, and
  `KHIPU_SIGNING_KEY_B64` env vars first).

## Output contract
Every run emits a single Khipu receipt (DSSE envelope) to stdout and, when
`HF_TOKEN` is set, uploads it to the runs dataset. The receipt carries a
`payload` with the per-target verdicts and the Doctrine v11 stamp
(`749/14/163`).

## Honesty
`GREEN` establishes only a successful local SQLite round-trip for all supplied
key/value records. It does not establish source completeness, authenticity,
freshness, LMDB recovery, or a production disaster recovery exercise. Binary
LMDB exports are not supported. Missing inputs remain `SKIPPED`; invalid or
empty dumps and restore failures are `RED`.

Run the offline regression suite with:

```bash
python -B -S -m unittest discover -s platform/agents/readiness/_lib -p test_dr.py -v
```

---
Doctrine v11 (LOCKED) · 749/14/163 · Author: Yachay <yachay@szlholdings.dev>
