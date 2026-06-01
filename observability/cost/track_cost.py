#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Doctrine v11 — 749/14/163 — replay hash c7c0ba17 — signed Yachay
"""track_cost.py — daily HF-credits + GitHub-Actions-minutes cost snapshot.

Polls:
  * HuggingFace billing/usage (best-effort; HF does not expose a stable public
    compute-cost API for free-tier orgs, so this is honest-by-default and reports
    `available: false` when the endpoint is absent — NO FABRICATED NUMBERS).
  * GitHub Actions usage for the org via the REST billing API.

Emits a daily JSON snapshot and pushes it to SZLHOLDINGS/status (HF Space).

Env:
  HF_TOKEN              write token for SZLHOLDINGS/status (founder/betterwithage)
  GITHUB_TOKEN          token with `read:org` + billing scope (for Actions minutes)
  SZL_GH_ORG            default "szl-holdings"
  SZL_STATUS_REPO       default "SZLHOLDINGS/status"
  SZL_COST_THRESHOLD    daily USD alert threshold (default 20)

Usage:
  python track_cost.py            # poll, write snapshot, push to status Space
  python track_cost.py --dry-run  # poll + print, do not push
"""
from __future__ import annotations

import argparse
import base64
import datetime as dt
import json
import os
import subprocess
import sys
import urllib.request

GH_ORG = os.environ.get("SZL_GH_ORG", "szl-holdings")
STATUS_REPO = os.environ.get("SZL_STATUS_REPO", "SZLHOLDINGS/status")
THRESHOLD = float(os.environ.get("SZL_COST_THRESHOLD", "20"))

# Rough public unit costs (documented, not invoiced — see README "founder action").
GH_ACTIONS_LINUX_USD_PER_MIN = 0.008  # GitHub-hosted Linux minute list price
HF_FREE_TIER = True  # SZLHOLDINGS Spaces are free-tier CPU basic as of 2026-06-01


def _http_json(url: str, token: str | None = None) -> dict | None:
    req = urllib.request.Request(url)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Accept", "application/vnd.github+json")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read().decode())
    except Exception as e:  # honest: record the failure, don't invent data
        return {"_error": str(e)}


def poll_github_actions() -> dict:
    """GitHub Actions minutes for the org. Requires a billing-scoped token."""
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        return {"available": False, "reason": "GITHUB_TOKEN not set"}
    url = f"https://api.github.com/orgs/{GH_ORG}/settings/billing/actions"
    data = _http_json(url, token)
    if not data or "_error" in data or "total_minutes_used" not in data:
        return {"available": False, "reason": (data or {}).get("_error", "no billing data / insufficient scope")}
    minutes = data.get("total_minutes_used", 0)
    paid = data.get("total_paid_minutes_used", 0)
    return {
        "available": True,
        "total_minutes_used": minutes,
        "total_paid_minutes_used": paid,
        "included_minutes": data.get("included_minutes"),
        "est_paid_usd": round(paid * GH_ACTIONS_LINUX_USD_PER_MIN, 2),
    }


def poll_hf_usage() -> dict:
    """HF compute usage. Free-tier orgs have no public cost API; report honestly."""
    token = os.environ.get("HF_TOKEN")
    if not token:
        return {"available": False, "reason": "HF_TOKEN not set", "tier": "unknown"}
    # whoami confirms the account + billing mode but does not return $ usage.
    data = _http_json("https://huggingface.co/api/whoami-v2", token)
    billing_mode = (data or {}).get("billingMode")
    return {
        "available": False,
        "reason": "HF does not expose a stable per-Space compute-cost API for this org tier",
        "tier": "free CPU basic" if HF_FREE_TIER else "paid",
        "billing_mode": billing_mode,
        "founder_action": "read HF credits at https://huggingface.co/settings/billing",
    }


def build_snapshot() -> dict:
    today = dt.date.today().isoformat()
    gh = poll_github_actions()
    hf = poll_hf_usage()
    gh_cost = gh.get("est_paid_usd", 0.0) if gh.get("available") else 0.0
    daily_cost = round(gh_cost, 2)  # HF free-tier contributes $0 today; honest
    return {
        "date": today,
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "daily_cost_usd": daily_cost,
        "threshold_usd": THRESHOLD,
        "alert": daily_cost > THRESHOLD,
        "github_actions": gh,
        "huggingface": hf,
        "doctrine": "v11 749/14/163 c7c0ba17",
        "signed": "Yachay",
        "note": "Costs are estimates from public unit prices, NOT invoiced amounts. "
                "HF free-tier compute = $0; GitHub Actions estimated from paid minutes.",
    }


def push_to_status(snapshot: dict) -> dict:
    """Commit cost/<date>.json + cost/latest.json to the status Space."""
    token = os.environ.get("HF_TOKEN")
    if not token:
        return {"pushed": False, "reason": "HF_TOKEN not set"}
    date = snapshot["date"]
    body = json.dumps(snapshot, indent=2)
    b64 = base64.b64encode(body.encode()).decode()
    lines = [
        json.dumps({"key": "header", "value": {"summary": f"chore(cost): daily snapshot {date} — Yachay", "description": ""}}),
        json.dumps({"key": "file", "value": {"path": f"cost/{date}.json", "encoding": "base64", "content": b64}}),
        json.dumps({"key": "file", "value": {"path": "cost/latest.json", "encoding": "base64", "content": b64}}),
    ]
    payload = "\n".join(lines) + "\n"
    url = f"https://huggingface.co/api/spaces/{STATUS_REPO}/commit/main"
    p = subprocess.run(
        ["curl", "-s", "-X", "POST", url,
         "-H", f"Authorization: Bearer {token}",
         "-H", "Content-Type: application/x-ndjson",
         "--data-binary", "@-"],
        input=payload, capture_output=True, text=True,
    )
    return {"pushed": p.returncode == 0, "response": p.stdout[:300]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    snap = build_snapshot()
    print(json.dumps(snap, indent=2))
    if snap["alert"]:
        print(f"::ALERT:: daily_cost ${snap['daily_cost_usd']} > threshold ${snap['threshold_usd']}", file=sys.stderr)
    if not args.dry_run:
        print(json.dumps(push_to_status(snap), indent=2), file=sys.stderr)


if __name__ == "__main__":
    main()
