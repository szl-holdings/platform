<!-- SPDX-License-Identifier: Apache-2.0 -->
# SZL Cost Dashboard

**Doctrine v11 — 749 / 14 / 163 — replay hash c7c0ba17** · Maintained by Yachay

A simple **HF-credits + GitHub-Actions-minutes** cost tracker. Runs daily, emits an
honest JSON snapshot to the [SZLHOLDINGS/status](https://huggingface.co/spaces/SZLHOLDINGS/status)
Space, and fires a Prometheus alert when the daily burn rate exceeds budget.

## What it does

- `track_cost.py` polls:
  - **GitHub Actions** org billing (`/orgs/<org>/settings/billing/actions`) →
    minutes used + estimated paid USD.
  - **HuggingFace** account/usage. HF does **not** expose a stable per-Space
    compute-cost API for this org's tier, so the tracker reports
    `available: false` and **never fabricates a number** — free-tier compute = $0.
- Writes `cost/<date>.json` + `cost/latest.json` to `SZLHOLDINGS/status`.
- `cost_alerts.yml` adds Prometheus rules:
  - `CostBurnRateHigh` — `szl_daily_cost_usd > 20` (warning; start conservative).
  - `CostBurnRateCritical` — `> 50` (critical hard ceiling).
  - `CostSnapshotStale` — snapshot older than 36h.

## Run

```bash
export GITHUB_TOKEN=...   # needs read:org + billing scope for Actions minutes
export HF_TOKEN=...       # founder/betterwithage write (to push to status Space)
export SZL_COST_THRESHOLD=20

python observability/cost/track_cost.py            # poll + push snapshot
python observability/cost/track_cost.py --dry-run  # poll + print only
```

### Schedule (daily)

Add a GitHub Actions cron (or reuse the status-snapshot workflow):

```yaml
on:
  schedule:
    - cron: "17 6 * * *"   # 06:17 UTC daily
jobs:
  cost:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: python observability/cost/track_cost.py
        env:
          HF_TOKEN: ${{ secrets.HF_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Founder action — where to read the real numbers

The tracker gives an **estimate** from public unit prices, not invoiced amounts. To
see the authoritative figures:

- **HF credits / billing:** <https://huggingface.co/settings/billing> (org:
  <https://huggingface.co/organizations/SZLHOLDINGS/settings/billing>). Confirms
  whether any Space has been upgraded off free CPU-basic.
- **GitHub Actions usage:** Org → Settings → Billing and plans → "Usage this month"
  → Actions. <https://github.com/organizations/szl-holdings/settings/billing>

> **Honesty note:** as of 2026-06-01 all SZLHOLDINGS Spaces run free-tier CPU basic
> ($0 compute) and the org is on GitHub free Actions minutes, so the modeled daily
> cost is **$0**. The alert exists so the first paid dollar is visible immediately.

---
*Doctrine v11 — 749/14/163 — c7c0ba17 — signed Yachay · Co-Authored-By: Perplexity Computer Agent*
