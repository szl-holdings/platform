#!/usr/bin/env python3
"""Bundle the last-7-days digests into one JSON the a11oy /wayra-digest tab ships."""
import json
from pathlib import Path
OUT = Path("/home/user/workspace/szl_wayra/data/digests")
idx = json.loads((OUT / "index.json").read_text())
bundle = {"organ": "WAYRA", "tab": "/wayra-digest", "author": "Yachay",
          "generated_at": idx["generated_at"], "window_days": 7,
          "today_events": idx["today_events"], "baseline_events": idx["baseline_events"],
          "note": idx["note"], "days": []}
for d in idx["digests"]:
    dj = json.loads((OUT / d["file"]).read_text())
    bundle["days"].append({
        "date": d["date"], "events": d["events"], "backfilled": d["backfilled"],
        "selected": dj.get("selected"),
        "chain_verified": dj.get("totals", {}).get("chain_verified"),
        "transcript": dj.get("transcript"),
        "top": [{"title": t.get("title"), "source": t.get("source"),
                 "wayra_factor": t.get("wayra_factor"),
                 "organ_routing": t.get("organ_routing"),
                 "yuyay_score": t.get("yuyay_score"),
                 "novelty_score": t.get("novelty_score")} for t in dj.get("top", [])],
    })
dst = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/round2/a11oy_replit_coder/wayra_digests_7d.json")
dst.write_text(json.dumps(bundle, indent=2))
print("wrote", dst, "days=", [x["date"] for x in bundle["days"]])
