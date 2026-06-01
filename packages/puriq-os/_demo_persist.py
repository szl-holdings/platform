"""Prove Khipu receipts persist to disk and survive a process 'restart' (reopen)."""
import os, json
from puriq_os.khipu_emit import KhipuLedger
from puriq_os.organs import build_all

DB = "/tmp/puriq_persist_demo.sqlite"
if os.path.exists(DB):
    os.remove(DB)

# --- "process 1": tick all 12 organs 3 rounds, then drop the ledger handle ---
led1 = KhipuLedger(db_path=DB)
organs = build_all(led1)
for _ in range(3):
    for a in organs.values():
        a.tick()
n1 = led1.count()
head1 = led1.head_hash()
verified1 = led1.verify_chain()
del organs, led1  # simulate process exit

# --- "process 2": reopen the SAME on-disk db fresh ---
led2 = KhipuLedger(db_path=DB)
n2 = led2.count()
head2 = led2.head_hash()
verified2 = led2.verify_chain()
sample = led2.recent(limit=2)

print(json.dumps({
    "db_path": DB,
    "process1_receipts": n1,
    "process1_head": head1[:16] + "...",
    "process1_chain_verified": verified1,
    "process2_receipts_after_reopen": n2,
    "process2_head": head2[:16] + "...",
    "process2_chain_verified": verified2,
    "persisted_ok": (n1 == n2 == 36 and head1 == head2 and verified2),
    "sample_receipt_keys": sorted(sample[0].keys()) if sample else [],
}, indent=2))
