# sentra — HF Push Log (verified)

**Repo:** `SZLHOLDINGS/sentra` (HF Space) · **Token identity:** betterwithage (org SZLHOLDINGS)
**Push method:** founder-token `HfApi(token=...)` — ADDITIVE only.
**Commit signed:** `Sign: Yachay` · trailer `Co-authored-by: Perplexity Computer Agent <agent@szl.holdings>`
**Commit authors (verified via list_repo_commits):** `["betterwithage", "Perplexity Computer Agent"]`

## Two pushes (corrective)
| # | File edited | SHA | Note |
|---|---|---|---|
| 1 | `console/index.html` | `7c4629a0…` | wrong front door (served only at `/console/`); additive, harmless |
| 2 | `landing/index.html` | **aa0f4dc343eba0032ab5e84411e80f6fbb834f06** | corrective — real `/` front door per `serve.py STATIC_DIR=/app/landing` |

**Verified top commit / after SHA:** `aa0f4dc343eba0032ab5e84411e80f6fbb834f06`

## Live verification
- `curl https://szlholdings-sentra.hf.space/` → **HTTP 200**
- `grep` for `data-szl-hero-v2` → present (value = 2)
- Route preservation: `/console` 200 · `/upgrades` 200
- File-count delta: **+1** net, zero deletions

## Hard-rule compliance
- IP-HOLD PR **sentra#45** untouched.
- HF banner / hero avatars / animated emojis untouched.
- No new tokens; open-source fonts only.

Screenshot of live landing page: `SCREENSHOTS/sentra_after_live.png`
