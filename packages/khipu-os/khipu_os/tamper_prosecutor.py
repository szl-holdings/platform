# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Perplexity Computer Agent — KHIPU-OS HUKLLA T22 tamper prosecutor
"""
tamper_prosecutor.py — self-prosecute (STRIDE Tampering response, made ours).

On a verifier mismatch, autonomously:
  1. FIRE HUKLLA T22 (additive DAG-tamper tripwire — never renumbers the LOCKED T01–T10 core;
     HUKLLA remains the sole halt-authority),
  2. WRITE a signed tamper-receipt (the DAG signs its own alarm — recursive, intentional),
  3. NOTIFY all subscribers via Wire B.

HUKLLA tripwires are mandatory on every loop (HARD RULE); T22 is the DAG loop's tripwire.
"""
from __future__ import annotations

import time
from typing import Any, Dict


class TamperProsecutor:
    def __init__(self, dag):
        self.dag = dag

    def run(self, verify_result: Dict[str, Any]) -> Dict[str, Any]:
        bad = verify_result.get("bad", [])
        # 1) fire HUKLLA T22 (sole halt-authority; additive tripwire)
        event = self.dag.hukulla.fire(
            "T22",
            reason="DAG tamper — receipt hash/signature mismatch on self-verify",
            context={"space": self.dag.space, "bad": bad, "count": len(bad)},
        )
        # 2) write a signed tamper-receipt (recursive self-receipt)
        rec = self.dag.add_receipt(
            organ=self.dag.name, action="tamper_prosecute_T22",
            payload={"tripwire": "T22", "bad": bad, "count": len(bad),
                     "halt_authority": "HUKLLA"},
            yuyay=1.0,
        )
        # 3) notify Wire-B subscribers
        notice = {"type": "khipu-tamper-alarm", "tripwire": "T22", "space": self.dag.space,
                  "receipt": rec.receipt_id, "bad_ids": [b.get("id") for b in bad],
                  "ts": time.time()}
        notified = 0
        for sub in list(self.dag.subscribers):
            try:
                sub(notice)   # Wire-B subscriber callable
                notified += 1
            except Exception:
                pass
        self.dag.tamper_events.append(notice)
        return {"tripwire": "T22", "fired": True, "receipt": rec.receipt_id,
                "subscribers_notified": notified, "bad_count": len(bad),
                "event_ts": event["ts"]}
