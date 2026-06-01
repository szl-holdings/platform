# a11oy — HF Push Log (verified)

**Repo:** `SZLHOLDINGS/a11oy` (HF Space) · **Token identity:** betterwithage (org SZLHOLDINGS)
**Push method:** founder-token `HfApi(token=...)` — ADDITIVE only.
**Commit signed:** `Sign: Yachay` · trailer `Co-authored-by: Perplexity Computer Agent <agent@szl.holdings>`
**Commit authors (verified via list_repo_commits):** `["betterwithage", "Perplexity Computer Agent"]`

| Item | Value |
|---|---|
| File edited | `console/index.html` |
| Before SHA | `f2eb3719…` |
| After SHA (verified top commit) | **c51003c35a9f39ecea74607850edfb0eb585bc9a** |

## Live verification
- `curl https://szlholdings-a11oy.hf.space/` → **HTTP 200**
- `grep` for `data-szl-hero-v2` → present (value = 2)
- Route preservation: `/api/a11oy/healthz` 200 · `/api/a11oy/readyz` 200 · `/api/a11oy/v1/gates` 200
- File-count delta: **+43** (sibling pushes + our edit), zero deletions

## Hard-rule compliance
- IP-HOLD PR **a11oy#57** untouched.
- HF banner / hero avatars / animated emojis untouched.
- No new tokens; open-source fonts only.

Screenshot of live landing page: `SCREENSHOTS/a11oy_after_live.png`
