# @workspace/agi-forecast

MVP slice of the [`szl-holdings/agi-forecast`](https://github.com/szl-holdings/agi-forecast)
proposal: registry + 3 live ingestors + daily-summary receipt + Brier ledger.
Dashboard, derived metrics (horizon-velocity, alignment-debt, lutar-readiness),
ouroboros replay-root wiring, and the remaining 9 ingestors are follow-ups.

- License: Apache-2.0
- Byline: Lutar, Stephen P. (ORCID 0009-0001-0110-4173)

## What's in this slice

- **Gauge registry** — 12 typed variables (`GAUGE_VARIABLES`) as a
  discriminated union. Three are `PUBLIC_ONLY` with live ingestors; the
  remaining nine are `MANUAL` stubs with `lastUpdated: null`.
- **Three live ingestors** (public, no-auth, 15s `AbortController` timeout):
  - `METR` → `https://api.github.com/repos/METR/public-tasks` (stargazer count
    proxy for METR autonomy-eval reach).
  - `EPOCH` → `https://epoch.ai/data/notable_ai_models.csv` (row count of
    Epoch's notable-models corpus; CC-BY-4.0).
  - `ARC` → `https://api.github.com/repos/fchollet/ARC-AGI` (stargazer count
    on the canonical ARC-AGI reference repo; Apache-2.0).
- **`buildDailySummary(date, snapshot)`** — emits a
  `forecast.summary@YYYY-MM-DD` receipt whose `receiptHash` is sha256 over a
  canonicalized (JCS-style sorted-keys) JSON body. Carries
  `ingestionPolicy: 'PUBLIC_ONLY'`.
- **`createBrierLedger()`** — in-memory ring (capacity 365) with
  `record(...)` / `score()`. The module-level default ledger is exposed as
  `recordPrediction({date, variable, predicted, actual})` and `score()`
  (the spec-named API).

License-allowlist (`Apache-2.0 | MIT | BSD-3-Clause | CC-BY-4.0`) is enforced
at registry build time and again inside `buildDailySummary`.

## Out of scope (follow-ups)

- Static dashboard.
- Derived metrics: horizon-velocity, alignment-debt, lutar-readiness.
- Wiring receipts into the ouroboros replay-root chain.
- The remaining 9 of 12 ingestors.
- Mirroring code to the standalone `szl-holdings/agi-forecast` GitHub repo.
