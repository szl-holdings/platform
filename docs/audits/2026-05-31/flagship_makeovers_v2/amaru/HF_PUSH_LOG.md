# amaru — HF Push Log (verified)

**Repo:** `SZLHOLDINGS/amaru` (HF Space) · **Token identity:** betterwithage (org SZLHOLDINGS)
**Push method:** founder-token `HfApi(token=...)` — ADDITIVE only.
**Commit signed:** `Sign: Yachay` · trailer `Co-authored-by: Perplexity Computer Agent <agent@szl.holdings>`
**Commit authors (verified via list_repo_commits):** `["betterwithage", "Perplexity Computer Agent"]`

| Item | Value |
|---|---|
| File edited | `static/index.html` |
| Before SHA | `912dad28…` |
| After SHA (verified top commit) | **abf88676af3ee47ba6c358430cde401ad9108f31** |

## Live verification
- `curl https://szlholdings-amaru.hf.space/` → **HTTP 200**
- `grep` for `data-szl-hero-v2` → present (value = 2)
- Route preservation: `/api/amaru/healthz` 200. (`/api/amaru/readyz` 404 — never existed,
  not a regression.)
- File-count delta: **+1**, zero deletions

## Hard-rule compliance
- IP-HOLD PR **amaru#46** untouched.
- HF banner / hero avatars / animated emojis untouched.
- No new tokens; open-source fonts only.

Screenshot of live landing page: `SCREENSHOTS/amaru_after_live.png`
