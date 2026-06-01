#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · Perplexity Computer Agent
"""
run_self_driving_demo.py — drive the agentic Khipu DAG in a real `while True` loop and
emit one verifiable receipt-line per tick to stdout AND to a log file.

This is the honest self-driving service: each tick runs self-prune / self-checkpoint /
self-verify / self-publish and signs an aggregate tick receipt. We accelerate cadences
(checkpoint + verify intervals = 0) so every tick exercises every sub-loop, and stop
after MAX_TICKS so the demo terminates (production runs unbounded under systemd/Space).
"""
from __future__ import annotations

import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from khipu_os import KhipuDAG  # noqa: E402

MAX_TICKS = int(os.environ.get("KHIPU_MAX_TICKS", "12"))
LOG_PATH = os.environ.get("KHIPU_LOG", "/tmp/khipu_self_driving.log")
TICK_SLEEP = float(os.environ.get("KHIPU_TICK_SLEEP", "0.05"))


def main() -> int:
    persist = os.environ.get("KHIPU_PERSIST", "/tmp/khipu_demo_store")
    dag = KhipuDAG(space="demo", cadence_s=0.05,
                   checkpoint_interval_s=0, verify_interval_s=0,  # force every sub-loop
                   stale_days=0.0, retain_last=5,                 # let pruning fire
                   persist_path=persist)

    # seed a small chain so prune/verify have material to act on
    g = dag.add_receipt("genesis", "init", {"n": 0})
    for i in range(40):
        dag.add_receipt("seed", "fill", {"i": i, "v": 0.5},
                        parents=[g.receipt_id], yuyay=0.5,
                        ts=time.time() - 86400 * 365)  # old + low-value => prunable

    logf = open(LOG_PATH, "w")
    ticks = 0
    while True:                                   # the real self-driving loop
        s = dag.tick()
        line = json.dumps({
            "tick": s["tick"],
            "root": s["root"][:16] + "…",
            "hot": s["hot_count"],
            "archived": s["archived_count"],
            "pruned": s["pruned"]["archived_count"],
            "checkpoint_root": (s.get("checkpoint", {}) or {}).get("root", "")[:16],
            "verify_ok": (s.get("verify", {}) or {}).get("ok"),
            "verify_sampled": (s.get("verify", {}) or {}).get("sampled"),
            "tick_receipt": s["tick_receipt"],
            "backend": dag.store.backend,
        }, separators=(",", ":"))
        print(line, flush=True)
        logf.write(line + "\n"); logf.flush()
        ticks += 1
        if ticks >= MAX_TICKS:
            break
        time.sleep(TICK_SLEEP)

    logf.close()
    print(f"# stopped after {ticks} ticks; log at {LOG_PATH}; "
          f"final root {dag.current_root()}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
