"""szl_logging — tiny structured JSON logger for SZL flagships.

Emits one JSON object per line with the required SZL observability keys:
ts, level, organ, endpoint, trace_id, span_id, caller_id, khipu_seq.

Doctrine v11 LOCKED · 749/14/163 · locked_at c7c0ba17
"""
from __future__ import annotations
import json, sys, time
from typing import Any, Optional

REQUIRED_KEYS = ("ts", "level", "organ", "endpoint",
                 "trace_id", "span_id", "caller_id", "khipu_seq")


class SZLLogger:
    def __init__(self, organ: str, stream=None):
        self.organ = organ
        self.stream = stream or sys.stdout

    def log(self, level: str, endpoint: str, *,
            trace_id: str = "", span_id: str = "",
            caller_id: str = "", khipu_seq: Optional[int] = None,
            **extra: Any) -> dict:
        record = {
            "ts": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()) + "Z",
            "level": level.upper(),
            "organ": self.organ,
            "endpoint": endpoint,
            "trace_id": trace_id,
            "span_id": span_id,
            "caller_id": caller_id,
            "khipu_seq": khipu_seq,
        }
        # required keys always present; extra is merged but never overrides required
        for k, v in extra.items():
            if k not in REQUIRED_KEYS:
                record[k] = v
        line = json.dumps(record, separators=(",", ":"), sort_keys=False)
        self.stream.write(line + "\n")
        self.stream.flush()
        return record

    def info(self, endpoint, **kw):  return self.log("info", endpoint, **kw)
    def warn(self, endpoint, **kw):  return self.log("warn", endpoint, **kw)
    def error(self, endpoint, **kw): return self.log("error", endpoint, **kw)
    def debug(self, endpoint, **kw): return self.log("debug", endpoint, **kw)


def get_logger(organ: str) -> SZLLogger:
    return SZLLogger(organ)
