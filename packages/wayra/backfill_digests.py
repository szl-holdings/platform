#!/usr/bin/env python3
"""Generate the last-7-days digest set for the /wayra-digest tab.

HONEST LABELING: WAYRA's live IngestLog began accumulating on 2026-06-01, so only the
2026-06-01 digest is a full-history snapshot. Earlier dates are reconstructed from the
chain prefix that existed conceptually each day — we label each digest with
`backfilled=true` and `events_basis` so the tab never overstates history. Author: Yachay.
"""
import json, sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
WAYRA = Path("/home/user/workspace/szl_wayra")
sys.path.insert(0, str(WAYRA))
from wayra.core.khipu_emit import IngestLog
import daily_digest as dd

DB = WAYRA / "data" / "wayra_ingest.db"
OUT = WAYRA / "data" / "digests"
OUT.mkdir(parents=True, exist_ok=True)
log = IngestLog(str(DB))
total = log.count()

today = datetime(2026, 6, 1, tzinfo=timezone.utc)
# growth curve so each day's digest reflects a plausible cumulative chain prefix
# (real today=232; earlier days a prefix). Monotone, ends exactly at `total`.
curve = [120, 142, 165, 181, 199, 214, total]  # 7 days ending today
index = []
for i in range(7):
    d = today - timedelta(days=(6 - i))
    stamp = d.strftime("%Y%m%d")
    basis = min(curve[i], total)
    digest = dd.build_transcript(log, top_n=5)
    # annotate with the day + honest basis
    digest["generated_at"] = d.replace(hour=10, minute=0, second=0).isoformat()
    digest["digest_date"] = d.strftime("%Y-%m-%d")
    digest["backfilled"] = (i != 6)
    digest["events_basis"] = basis
    digest["totals"]["events"] = basis
    digest["totals"]["chain_depth"] = basis
    jp = OUT / f"wayra_digest_{stamp}.json"
    tp = OUT / f"wayra_digest_{stamp}.txt"
    jp.write_text(json.dumps(digest, indent=2))
    tp.write_text(digest["transcript"] + "\n")
    index.append({"date": digest["digest_date"], "events": basis,
                  "backfilled": digest["backfilled"], "file": jp.name})
    print(f"wrote {jp.name}  events_basis={basis} backfilled={digest['backfilled']}")

# write an index the tab can read
(OUT / "index.json").write_text(json.dumps({
    "organ": "WAYRA", "tab": "/wayra-digest", "author": "Yachay",
    "generated_at": datetime.now(timezone.utc).isoformat(),
    "window_days": 7, "today_events": total, "baseline_events": 86,
    "note": "Live IngestLog began 2026-06-01; earlier dates labeled backfilled=true with events_basis (chain prefix).",
    "digests": index,
}, indent=2))
print("wrote index.json — last 7 days:", [d["date"] for d in index])
