# Apply Scripts — Execution Order

All scripts are **idempotent-safe** but **require explicit human approval** before each run. The recommended execution order matches the rollup report.

| # | Script | Tier | What it does |
|---|---|---|---|
| 01 | `01_close_doctrine_violation_prs.sh` | 2 | Closes 18 PRs that contain forbidden patterns |
| 02 | `02_merge_dependabot_prs.sh` | 1 | Merges 12 Dependabot bumps |
| 03 | `03_open_hygiene_prs.sh` | 1 | Opens 2 hygiene PRs (vsp-otel, agi-forecast) |
| 04 | `04_open_citation_prs.sh` | 1 | Opens 13 CITATION.cff PRs |
| 05 | `05_apply_branch_protection.sh` | 3 | Applies 6 BP PUTs (interactive per-repo confirm) |
| 06 | `06_patch_github_display_name.sh` | 3 | Patches GitHub display name |

## Before running scripts 01 and 02

Fill in the actual PR numbers from `02_specialists/pr_triage/all_prs_final.json`. The scripts include placeholders for documentation; uncomment and edit before running.

## Required gh CLI scopes

`repo`, `workflow`, `read:org`, `user`. For BP edits also `admin:org` (currently missing — script 05 may need `gh auth refresh -s admin:org` first).

## Standing safety rule

Each tier 3 action is a one-way door. Run interactively. Never batch.
