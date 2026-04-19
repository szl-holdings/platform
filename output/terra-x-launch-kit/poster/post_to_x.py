#!/usr/bin/env python3
"""Post the 5 Terra (@terra_re) launch posts to X.

Reads the post plan from post_plan.json (co-located, 5 standalone posts — no
threads), uploads the matching image attachment from ../screenshots/, and
creates each tweet via the X API v2 with OAuth 1.0a user-context auth.

Usage:
    python3 post_to_x.py                 # dry-run: prints what would be posted
    python3 post_to_x.py --live          # actually post (starts immediately)
    python3 post_to_x.py --live --only 1 # post only post #1 (1-indexed, 1..5)

Required env vars / secrets (set them in Replit Secrets):
    X_API_KEY              (a.k.a. consumer key)
    X_API_SECRET           (a.k.a. consumer secret)
    X_ACCESS_TOKEN
    X_ACCESS_TOKEN_SECRET

The access token must belong to an app with READ+WRITE permission and be
granted from the @terra_re subaccount (NOT the @szlholdings parent — the
parent has its own kit at ../../szl-x-launch-kit/). Generate them at
developer.x.com → your @terra_re Project → App → "Keys and tokens".
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

try:
    from requests_oauthlib import OAuth1Session
    _HAS_OAUTH = True
except ImportError:  # dry-run still works without the dep
    OAuth1Session = None  # type: ignore
    _HAS_OAUTH = False

ROOT = Path(__file__).resolve().parent
KIT = ROOT.parent
PLAN_PATH = ROOT / "post_plan.json"
SHOTS = KIT / "screenshots"

MEDIA_UPLOAD_URL = "https://upload.twitter.com/1.1/media/upload.json"
TWEETS_URL = "https://api.twitter.com/2/tweets"


def auth_session():
    if not _HAS_OAUTH:
        print("ERROR: requests_oauthlib is not installed.")
        print("Install it first:  pip install requests requests_oauthlib")
        sys.exit(1)
    required = ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"]
    missing = [k for k in required if not os.environ.get(k)]
    if missing:
        print(f"ERROR: missing env var(s): {', '.join(missing)}")
        print("Set them in Replit Secrets and re-run.")
        sys.exit(2)
    return OAuth1Session(
        client_key=os.environ["X_API_KEY"],
        client_secret=os.environ["X_API_SECRET"],
        resource_owner_key=os.environ["X_ACCESS_TOKEN"],
        resource_owner_secret=os.environ["X_ACCESS_TOKEN_SECRET"],
    )


def upload_media(oauth, path: Path) -> str:
    """Simple media upload (fine for images < 5MB)."""
    with open(path, "rb") as f:
        files = {"media": f}
        r = oauth.post(MEDIA_UPLOAD_URL, files=files, timeout=60)
    if r.status_code != 200:
        raise RuntimeError(f"Media upload failed: {r.status_code} {r.text}")
    return r.json()["media_id_string"]


def create_tweet(oauth, text: str, media_ids: list[str] | None = None,
                 reply_to: str | None = None) -> str:
    payload: dict = {"text": text}
    if media_ids:
        payload["media"] = {"media_ids": media_ids}
    if reply_to:
        payload["reply"] = {"in_reply_to_tweet_id": reply_to}
    r = oauth.post(TWEETS_URL, json=payload, timeout=60)
    if r.status_code not in (200, 201):
        raise RuntimeError(f"Tweet failed: {r.status_code} {r.text}")
    return r.json()["data"]["id"]


def pin_tweet_hint(tweet_id: str) -> None:
    # Pinning a tweet uses the v1.1 account_pin endpoint which requires elevated
    # access on many app tiers. Rather than fail the flow, print a manual hint.
    print(f"  → To pin this tweet manually: open https://x.com/i/web/status/{tweet_id} "
          "and choose 'Pin to your profile' from the ⋯ menu.")


def load_plan() -> list[dict]:
    with open(PLAN_PATH) as f:
        return json.load(f)


def run(live: bool = False, only: int | None = None) -> None:
    plan = load_plan()
    oauth = auth_session() if live else None

    for i, post in enumerate(plan, start=1):
        if only is not None and only != i:
            continue
        print(f"\n━━━━━ Post {i}: {post['label']} ━━━━━")
        if post.get("thread"):
            prev_id: str | None = None
            for j, t in enumerate(post["thread"], start=1):
                print(f"\n[{i}.{j}] ({len(t['text'])} chars)")
                print(t["text"])
                media_files = t.get("media", [])
                print(f"  media: {media_files or '—'}")
                if live:
                    media_ids = [upload_media(oauth, SHOTS / m) for m in media_files]
                    tid = create_tweet(oauth, t["text"], media_ids, reply_to=prev_id)
                    print(f"  posted id={tid}")
                    prev_id = tid
                    time.sleep(2)
        else:
            print(f"({len(post['text'])} chars)")
            print(post["text"])
            media_files = post.get("media", [])
            print(f"  media: {media_files or '—'}")
            if live:
                media_ids = [upload_media(oauth, SHOTS / m) for m in media_files]
                tid = create_tweet(oauth, post["text"], media_ids)
                print(f"  posted id={tid}")
                if post.get("pin"):
                    pin_tweet_hint(tid)
                time.sleep(2)

    if not live:
        print("\n(DRY-RUN — re-run with --live to actually post.)")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--live", action="store_true", help="actually post to X")
    p.add_argument("--only", type=int, help="post only post #N (1-indexed)")
    args = p.parse_args()
    run(live=args.live, only=args.only)
