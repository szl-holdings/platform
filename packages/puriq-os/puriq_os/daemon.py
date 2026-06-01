# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — Yachay (Perplexity Computer Agent)
"""
daemon.py — the REAL autonomous loop. A plain `while` event loop that ticks each organ
on its own cadence, forever, until SIGINT/SIGTERM. This is the file the founder can read
to see an actual running loop (not a mock).

Two run modes:
  - APScheduler mode (default): scheduler.start() fires one interval job per organ.
  - bare while-loop mode (--bare): a single while True that checks each organ's
    next_tick and fires it when due. Explicit, readable, no framework magic.

Halt-safe: a HALTED organ is skipped. SIGTERM/SIGINT stops the loop cleanly.
"""
from __future__ import annotations

import argparse
import signal
import time

from .khipu_emit import KhipuLedger
from .organs import build_all
from .loop import LoopStatus

_RUNNING = True


def _stop(*_):
    global _RUNNING
    _RUNNING = False


def run_bare(db_path: str, max_seconds: float | None = None) -> None:
    """Explicit while-loop scheduler. Readable, no framework."""
    ledger = KhipuLedger(db_path=db_path)
    organs = build_all(ledger)
    now = time.time()
    next_due = {name: now + a.cadence_seconds for name, a in organs.items()}
    start = now
    signal.signal(signal.SIGINT, _stop)
    signal.signal(signal.SIGTERM, _stop)
    print(f"[puriq-os] bare loop started; {len(organs)} organs; db={db_path}")
    while _RUNNING:
        now = time.time()
        for name, agent in organs.items():
            if agent.status == LoopStatus.HALTED:
                continue  # halt-safe
            if now >= next_due[name]:
                res = agent.tick()
                next_due[name] = now + agent.cadence_seconds
                print(f"[tick] {name:18s} #{res.tick} status={res.status.value} "
                      f"action={res.chosen} U={res.decision_value:.4f}")
        if max_seconds is not None and (now - start) >= max_seconds:
            break
        time.sleep(0.5)  # poll granularity; well under the smallest 7s cadence (Nyquist)
    print(f"[puriq-os] stopped; total receipts={ledger.count()} "
          f"chain_verified={ledger.verify_chain()}")


def run_scheduler(db_path: str, max_seconds: float | None = None) -> None:
    """APScheduler mode."""
    from .scheduler import PuriqScheduler
    ledger = KhipuLedger(db_path=db_path)
    organs = build_all(ledger)
    sched = PuriqScheduler()
    for a in organs.values():
        sched.register(a)
    signal.signal(signal.SIGINT, _stop)
    signal.signal(signal.SIGTERM, _stop)
    sched.start()
    print(f"[puriq-os] APScheduler started; {len(organs)} organs; db={db_path}")
    start = time.time()
    while _RUNNING:
        time.sleep(0.5)
        if max_seconds is not None and (time.time() - start) >= max_seconds:
            break
    sched.shutdown()
    print(f"[puriq-os] stopped; total receipts={ledger.count()} "
          f"chain_verified={ledger.verify_chain()}")


def main():
    ap = argparse.ArgumentParser(description="PURIQ-OS autonomous loop daemon")
    ap.add_argument("--db", default="puriq_os_ledger.sqlite")
    ap.add_argument("--bare", action="store_true", help="use the bare while-loop scheduler")
    ap.add_argument("--max-seconds", type=float, default=None)
    args = ap.parse_args()
    if args.bare:
        run_bare(args.db, args.max_seconds)
    else:
        run_scheduler(args.db, args.max_seconds)


if __name__ == "__main__":
    main()
