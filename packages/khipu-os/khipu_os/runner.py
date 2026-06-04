# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Perplexity Computer Agent — KHIPU-OS background-thread runner
"""
runner.py — runs the agentic Khipu DAG as a background thread per Space.

The DAG ticks on its own 60 s cadence (the checkpointer / verifier sub-loops self-gate to
12 h / 5 min). The runner is daemonised so it never blocks Space shutdown, and exposes
start()/stop()/status() so a FastAPI Space can mount it on startup. Pure stdlib threading;
no external scheduler required (APScheduler-compatible if PURIQ-OS provides one).
"""
from __future__ import annotations

import threading
import time
from typing import Any, Dict, Optional

from .dag import KhipuDAG


class KhipuDAGRunner:
    def __init__(self, dag: Optional[KhipuDAG] = None, space: str = "local",
                 tick_s: float = 60.0):
        self.dag = dag or KhipuDAG(space=space, cadence_s=tick_s)
        self.tick_s = tick_s
        self._thread: Optional[threading.Thread] = None
        self._stop = threading.Event()
        self.last_summary: Dict[str, Any] = {}
        self.ticks_run = 0

    def _loop(self):
        while not self._stop.is_set():
            try:
                self.last_summary = self.dag.tick()
                self.ticks_run += 1
            except Exception as e:  # a loop failure must not kill the thread silently
                # fire is best-effort; record and continue (HUKLLA owns real halts)
                self.last_summary = {"error": str(e), "ts": time.time()}
            self._stop.wait(self.tick_s)

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = threading.Thread(target=self._loop, name=f"khipu-dag-{self.dag.space}",
                                        daemon=True)
        self._thread.start()

    def stop(self, timeout: float = 5.0) -> None:
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=timeout)

    def status(self) -> Dict[str, Any]:
        return {
            "space": self.dag.space,
            "running": bool(self._thread and self._thread.is_alive()),
            "ticks_run": self.ticks_run,
            "hot_count": self.dag.hot_count(),
            "archived_count": len(self.dag.archived_ids),
            "checkpoints": len(self.dag.checkpoints),
            "merkle_root": self.dag.current_root(),
            "tamper_events": len(self.dag.tamper_events),
            "last_summary_keys": list(self.last_summary.keys()),
            "using_real_puriq_os": _runner_using_real(),
        }


def _runner_using_real() -> bool:
    from ._puriq_compat import _USING_REAL_PURIQ_OS
    return _USING_REAL_PURIQ_OS
