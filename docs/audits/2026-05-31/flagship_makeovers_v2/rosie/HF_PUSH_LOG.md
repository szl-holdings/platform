# rosie — HF Push Log (verified)

**Repo:** `SZLHOLDINGS/rosie` (HF Space) · **Token identity:** betterwithage (org SZLHOLDINGS)
**Push method:** founder-token `HfApi(token=...)` — ADDITIVE only.
**Commit signed:** `Sign: Yachay` · trailer `Co-authored-by: Perplexity Computer Agent <agent@szl.holdings>`
**Commit authors (verified via list_repo_commits):** `["betterwithage", "Perplexity Computer Agent"]`

## Two pushes (backend fix, then hero)
| # | Purpose | File(s) edited | Before SHA | After SHA (verified) |
|---|---|---|---|---|
| 1 | Root-cause backend fix (RUNTIME_ERROR) | `app.py` + `Dockerfile` | `656d439d…` | **94457930e9aef0a4cf4e72e1741a6c3f163cf9cc** |
| 2 | Dense hero above the fold | `app.py` | `8a7c6d3f…` | **2fb7cfac3d1363946700b23d2e901eb72c5ed237** |

**Final verified top commit:** `2fb7cfac3d1363946700b23d2e901eb72c5ed237`

## Live verification
- `curl https://szlholdings-rosie.hf.space/` → **HTTP 200** (Space now RUNNING after the fix)
- `grep` for `data-szl-hero-v2` → present (value = 1)
- Route preservation: `/api/rosie/healthz` 200 · `/api/a11oy/healthz` 200.
  (`/v1/gates` 404 — never existed on rosie, not a regression.)
- File-count delta: **0** net for the hero push; fix push net additive (modules now in image),
  zero deletions overall.

## Hard-rule compliance
- HF banner / hero avatars / animated emojis untouched.
- No new tokens; open-source fonts only; rosie remains deterministic policy (not an LLM).

Screenshot of live landing page: `SCREENSHOTS/rosie_after_live.png`
