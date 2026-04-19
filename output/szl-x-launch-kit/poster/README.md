# X poster — how to actually send the 9 posts

This folder adds *real* X-API posting on top of the static launch kit. It reads
`post_plan.json` (which mirrors `content-calendar.md` 1:1) and publishes each
post, including the Thursday 6-tweet doctrine thread, with the correct image
attached.

## 1 — Get X API credentials

1. Go to **developer.x.com** → sign in as `@szlholdings`.
2. Create a **Project** (not just an App) → create an **App** inside it.
3. Under **User authentication settings**, set **App permissions = Read and Write**
   (Read-only won't let you post). Save.
4. In **Keys and tokens**, generate:
   - **API Key** and **API Key Secret**  *(a.k.a. consumer key/secret)*
   - **Access Token** and **Access Token Secret**  *(make sure they were
     generated **after** you switched to Read+Write — otherwise regenerate)*

If the access token was created before flipping to Read+Write, the v2 tweets
endpoint returns `403 / Your client app is not configured with the appropriate
oauth1 app permissions for this endpoint.` — regenerate.

## 2 — Add them to Replit Secrets

In the workspace, open **Secrets** (padlock icon) and add four secrets with
these exact names:

- `X_API_KEY`
- `X_API_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_TOKEN_SECRET`

## 3 — Install dependencies

```bash
pip install requests requests_oauthlib
```

(Both are already commonly available in this workspace.)

## 4 — Dry run (prints what would be posted)

```bash
cd output/szl-x-launch-kit/poster
python3 post_to_x.py
```

You'll see every post's full text, character count and the image file that
will be attached. Nothing is sent.

## 5 — Live post

All 9 items at once:

```bash
python3 post_to_x.py --live
```

Or one item at a time, so you can use X's native scheduling later in the week:

```bash
python3 post_to_x.py --live --only 1   # Thursday announcement
python3 post_to_x.py --live --only 3   # Thursday thread (posts all 6 as a reply chain)
python3 post_to_x.py --live --only 9   # Monday CTA close
```

## 6 — Pinning

The free/basic API tier generally doesn't allow pinning via API. After the
Thursday announcement (post #1) posts successfully, the script prints a direct
URL — open it in the browser and pick **Pin to your profile** from the ⋯ menu.

## 7 — Rate-limit notes

- Free tier: 500 posts/month, 17 posts per 24h window. The full launch uses 9
  standalone posts + 6 thread tweets = **15 posts** — fits comfortably.
- Media uploads use the v1.1 endpoint (still free-tier accessible). Keep images
  < 5 MB; the kit's PNGs are within that.

## 8 — Editing copy before posting

Edit `post_plan.json` — it's the single source of truth that the script reads.
Keep each tweet ≤ 280 characters (links auto-shorten to 23). The dry-run prints
the character count for every item, so you can re-run it after edits to verify.

## 9 — Scheduled, hands-off launch

For the full launch week you don't have to babysit the terminal. A long-running
scheduler is wired up as a workflow:

- **Workflow name:** `x-launch-scheduler`
- **Schedule source:** `schedule.json` (America/New_York)
- **State file:** `posted_state.json` (auto-created; safe to delete to re-run)

Default launch week is **Thu 2026-04-23 → Mon 2026-04-27**. To roll the whole
sequence to a different week, edit `schedule.json` → `launch_thursday`.

Start it once the four X secrets are configured:

```bash
# from the workspace root
python3 output/szl-x-launch-kit/poster/scheduler.py
```

…or just start the `x-launch-scheduler` workflow from the workflows panel — it
will print every slot, sleep until each scheduled minute, then call the poster
with `--live --only N`. Restart-safe: anything already posted is skipped.

Useful flags:

```bash
python3 scheduler.py --dry-run              # rehearse, don't actually post
python3 scheduler.py --force-now 1 --dry-run # rehearse a single post
python3 scheduler.py --force-now 1           # post a single one immediately
```

After post #1 fires, the scheduler prints a reminder to pin it manually from
`x.com/szlholdings → ⋯ → Pin to your profile` (the API tier doesn't allow
pinning programmatically).
