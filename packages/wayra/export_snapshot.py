#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Export the WAYRA ingest log to a static JSON snapshot for the a11oy /wayra tab."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from wayra.core.khipu_emit import IngestLog

DB = Path(__file__).resolve().parent / "data" / "wayra_ingest.db"
OUT = Path(__file__).resolve().parent / "data" / "wayra_snapshot.json"

log = IngestLog(db_path=DB)
chain = log.verify_chain()
snapshot = {
    "organ": "wayra",
    "doctrine": "v13 (4th edge organ)",
    "etymology": "Quechua wayra = wind, air (Wiktionary)",
    "totals": {
        "events": log.count(),
        "receipts": log.receipt_depth(),
        "chain_verified": chain["ok"],
        "chain_depth": chain["depth"],
    },
    "thresholds": {"drop": 0.30, "accept": 0.70, "daily_cap": 50},
    "source_stats": log.source_stats(),
    "recent": log.recent(100),
    "top5": log.top_n(5),
}
OUT.write_text(json.dumps(snapshot, indent=2, default=str))
print(f"wrote {OUT} — {snapshot['totals']['events']} events, chain_ok={chain['ok']}")
log.close()
