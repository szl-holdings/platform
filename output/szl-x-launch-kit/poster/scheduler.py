#!/usr/bin/env python3
"""Lightweight launch scheduler for the @szlholdings X launch.

Runs continuously, watches the clock against schedule.json (America/New_York),
and at each slot fires `post_to_x.py --live --only N` exactly once. State is
persisted in posted_state.json so the scheduler is safe to restart.

Usage:
    python3 scheduler.py                 # run with whatever's in env
    python3 scheduler.py --dry-run       # log decisions, don't actually post
    python3 scheduler.py --force-now N   # immediately fire post N (testing)

Env vars required for live posting (set as Replit Secrets):
    X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET

The scheduler exits cleanly once every slot has been processed.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent
SCHEDULE_PATH = ROOT / "schedule.json"
STATE_PATH = ROOT / "posted_state.json"
POSTER = ROOT / "post_to_x.py"


def load_schedule() -> dict:
    with open(SCHEDULE_PATH) as f:
        return json.load(f)


def load_state() -> dict:
    if STATE_PATH.exists():
        with open(STATE_PATH) as f:
            return json.load(f)
    return {"posted": {}}


def save_state(state: dict) -> None:
    with open(STATE_PATH, "w") as f:
        json.dump(state, f, indent=2)


def slot_datetimes(schedule: dict) -> list[tuple[int, str, datetime]]:
    tz = ZoneInfo(schedule["timezone"])
    base = datetime.strptime(schedule["launch_thursday"], "%Y-%m-%d").replace(tzinfo=tz)
    out = []
    for slot in schedule["slots"]:
        h, m = [int(x) for x in slot["time"].split(":")]
        when = (base + timedelta(days=slot["day_offset"])).replace(hour=h, minute=m, second=0, microsecond=0)
        out.append((slot["post"], slot["label"], when))
    return out


def fire_post(n: int, dry_run: bool) -> bool:
    cmd = [sys.executable, str(POSTER), "--only", str(n)]
    if not dry_run:
        cmd.insert(2, "--live")
    print(f"[scheduler] firing: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=ROOT)
    return result.returncode == 0


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true", help="don't actually post")
    p.add_argument("--force-now", type=int, help="immediately fire post N and exit")
    p.add_argument("--poll-seconds", type=int, default=30, help="how often to check the clock")
    args = p.parse_args()

    schedule = load_schedule()
    state = load_state()
    slots = slot_datetimes(schedule)
    tz = ZoneInfo(schedule["timezone"])

    print(f"[scheduler] launch week starts {schedule['launch_thursday']} ({schedule['timezone']})")
    for n, label, when in slots:
        marker = " ✅" if str(n) in state["posted"] else ""
        print(f"  - post {n}: {when.isoformat()}  {label}{marker}")

    if args.force_now is not None:
        ok = fire_post(args.force_now, args.dry_run)
        if ok and not args.dry_run:
            state["posted"][str(args.force_now)] = datetime.now(tz).isoformat()
            save_state(state)
        return

    while True:
        now = datetime.now(tz)
        pending = [(n, label, when) for (n, label, when) in slots if str(n) not in state["posted"]]
        if not pending:
            print("[scheduler] all 9 posts processed. exiting.")
            return

        next_due = [(n, label, when) for (n, label, when) in pending if when <= now]
        if next_due:
            n, label, when = next_due[0]
            print(f"[scheduler] {now.isoformat()} — firing post {n} ({label})")
            ok = fire_post(n, args.dry_run)
            if ok:
                state["posted"][str(n)] = now.isoformat()
                save_state(state)
                if n == 1:
                    print("[scheduler] reminder: pin post #1 manually from x.com/szlholdings → ⋯ → Pin to your profile")
            else:
                print(f"[scheduler] post {n} failed. will retry in {args.poll_seconds}s.")
        else:
            n, label, when = pending[0]
            wait = (when - now).total_seconds()
            print(f"[scheduler] {now.strftime('%a %H:%M %Z')} — next is post {n} at {when.strftime('%a %H:%M %Z')} (in {int(wait)}s)")

        time.sleep(args.poll_seconds)


if __name__ == "__main__":
    main()
