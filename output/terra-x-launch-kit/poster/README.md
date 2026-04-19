# Terra (@terra_re) — X poster

Posts the 5-item Terra launch sequence from `post_plan.json` to X. Same runner
pattern as the parent `@szlholdings` kit.

## 1 — Get X API credentials for `@terra_re`

1. **developer.x.com** → sign in as `@terra_re`.
2. Create a **Project** + **App**, set **App permissions = Read and Write**.
3. Regenerate **API Key/Secret** and **Access Token/Secret** *after* the
   permission flip.

## 2 — Add to Replit Secrets

- `X_API_KEY`
- `X_API_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_TOKEN_SECRET`

## 3 — Dry run

```bash
cd output/terra-x-launch-kit/poster
python3 post_to_x.py
```

## 4 — Live post

```bash
python3 post_to_x.py --live --only 1   # Tue announcement
python3 post_to_x.py --live --only 2   # Thu distress sourcing
python3 post_to_x.py --live --only 5   # Wed CTA
```

## 5 — Pinning

API tier doesn't allow programmatic pinning. After post #1 fires, open the
direct URL the script prints and pin manually.

## 6 — Cross-promote with `@szlholdings`

See `../cross-promote-plan.md` — quote-repost from the parent account within
60 minutes of post #1 to establish the affiliate badge.
