# Aegis (@aegis_soc) — X poster

Posts the 5-item Aegis launch sequence from `post_plan.json` to X. Reuses the
same `post_to_x.py` runner pattern as the parent `@szlholdings` kit — the only
difference is which post plan and screenshots are attached.

## 1 — Get X API credentials for `@aegis_soc`

1. **developer.x.com** → sign in as `@aegis_soc` (the subaccount, not the parent).
2. Create a **Project** + **App**, set **App permissions = Read and Write**.
3. Generate **API Key/Secret** and **Access Token/Secret** *after* permissions
   are flipped to read+write.

## 2 — Add to Replit Secrets

Use these names (so the runner picks them up automatically):

- `X_API_KEY`
- `X_API_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_TOKEN_SECRET`

> If you're posting from the same workspace as the parent kit, switch tokens
> per run via your shell (`export X_ACCESS_TOKEN=...`) — the runner reads from
> the active environment.

## 3 — Dry run

```bash
cd output/aegis-x-launch-kit/poster
python3 post_to_x.py
```

## 4 — Live post (one at a time recommended)

```bash
python3 post_to_x.py --live --only 1   # Tue announcement
python3 post_to_x.py --live --only 2   # Thu SOC console
python3 post_to_x.py --live --only 5   # Wed CTA
```

## 5 — Pinning

API tier doesn't allow programmatic pinning. After post #1 fires, open the
direct URL the script prints and pin manually.

## 6 — Cross-promote with `@szlholdings`

See `../cross-promote-plan.md` — within 60 minutes of post #1, quote-repost it
from the parent account to publicly establish the affiliate badge.
