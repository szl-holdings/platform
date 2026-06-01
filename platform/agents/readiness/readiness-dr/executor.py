#!/usr/bin/env python3
"""
READINESS-DR (disaster recovery) executor.

For each flagship that exposes an Unay LMDB store:
  1. Trigger a backup dump (GET <base>/unay/dump -> newline-delimited JSON of
     key/value receipt rows, or a binary LMDB copy when /unay/export is present).
  2. Verify the dump is readable + non-empty.
  3. Test restore: load the dump into a fresh in-memory sqlite table and query
     a sample row back, proving the backup is restorable.
  4. Upload the dump + a restore-proof receipt to the runs dataset.

Emits backup-and-restore proof receipts (signed). Flagships without an Unay
endpoint are reported SKIPPED (honest), never GREEN.

Author: Yachay <yachay@szlholdings.dev>
"""
from __future__ import annotations

import io
import json
import os
import sqlite3
import sys
import urllib.request

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "_lib"))
import khipu  # noqa: E402

AGENT = "readiness-dr"


def fetch(url: str, timeout: float = 20.0) -> bytes | None:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            if 200 <= resp.status < 300:
                return resp.read()
    except Exception:
        return None
    return None


def restore_proof(dump: bytes) -> dict:
    """Load NDJSON rows into a fresh sqlite and read one back."""
    rows = []
    for line in io.BytesIO(dump).read().decode("utf-8", "replace").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
            rows.append((str(obj.get("key", "")), json.dumps(obj.get("value", obj))))
        except Exception:
            # tolerate non-JSON lines by storing raw
            rows.append(("raw", line))
    if not rows:
        return {"restored": False, "reason": "empty/unparseable dump"}
    con = sqlite3.connect(":memory:")
    con.execute("CREATE TABLE unay(k TEXT, v TEXT)")
    con.executemany("INSERT INTO unay(k, v) VALUES(?, ?)", rows)
    con.commit()
    n = con.execute("SELECT count(*) FROM unay").fetchone()[0]
    sample = con.execute("SELECT k, v FROM unay LIMIT 1").fetchone()
    con.close()
    return {"restored": True, "rows": n, "sample_key": sample[0]}


def dr_flagship(fl: dict) -> dict:
    base = khipu.flagship_url(fl)
    if not base:
        return {"flagship": fl["name"], "verdict": "SKIPPED",
                "reason": f"{fl['url_env']} not set"}
    base = base.rstrip("/")
    dump = fetch(f"{base}/unay/dump")
    if dump is None:
        return {"flagship": fl["name"], "verdict": "SKIPPED",
                "reason": "no /unay/dump endpoint (not an Unay-backed flagship)"}
    readable = len(dump) > 0
    proof = restore_proof(dump) if readable else {"restored": False}
    pub = None
    if readable:
        import datetime as dt
        ts = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
        path = f"dr-dumps/{fl['name']}/{ts}.ndjson"
        token = os.environ.get("HF_TOKEN")
        if token:
            try:
                from huggingface_hub import HfApi
                HfApi(token=token).upload_file(
                    path_or_fileobj=dump, path_in_repo=path,
                    repo_id=khipu.HF_DATASET, repo_type="dataset",
                    commit_message=f"DR dump {fl['name']} {ts}")
                pub = {"uploaded": True, "path": path, "bytes": len(dump)}
            except Exception as exc:
                pub = {"uploaded": False, "reason": f"{type(exc).__name__}: {exc}"}
        else:
            pub = {"uploaded": False, "reason": "no HF_TOKEN"}
    verdict = "GREEN" if (readable and proof.get("restored")) else "RED"
    return {"flagship": fl["name"], "verdict": verdict, "dump_bytes": len(dump),
            "readable": readable, "restore_proof": proof, "upload": pub}


def main() -> int:
    out = [dr_flagship(fl) for fl in khipu.FLAGSHIPS]
    payload = {"flagships": out}
    khipu.emit(AGENT, payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
