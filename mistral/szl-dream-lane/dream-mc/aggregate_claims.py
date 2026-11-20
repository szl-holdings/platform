"""
aggregate_claims.py - stack400 claim aggregation, adjudicated design round mc-20261120.

Trio adjudication (Kimi handler + Mistral parallel + Astra watcher seat, 2026-11-20):
  D1 UNANIMOUS: strictly additive claim files claims/<run_id>/<model_index>.<worker_id>.attempt<N>.json
    - no read-modify-write anywhere, no CAS assumption on host or HF
    - an index is taken iff any claim file exists for it
    - heartbeat / TTL is diagnostic only: expiry never silently steals a claim;
      a re-attempt after expiry writes a NEW file with attempt N+1
    - dedupe rule: group claim files by model_index, select max integer attempt N,
      tie across worker_ids resolved by lexicographically greatest worker_id,
      DUPLICATE_CLAIM alert fired (never silent)
    - conflicting payload/receipt fingerprints within the selected attempt
      mean QUARANTINE_INDEX: no winner chosen, human decides
  Exit codes: 0 clean, 1 alerts only (duplicates / expired heartbeats), 2 quarantine, 3 usage.
  --selftest runs the two-worker race plus killed-worker TTL rehearsal on synthetic
  fixtures and fails on any missed expectation (falsifier rehearsal). Determinism
  is checked by running the aggregation twice and comparing digests.
"""
import argparse
import hashlib
import json
import os
import sys
import tempfile

ALERT_DUP = "DUPLICATE_CLAIM"
ALERT_EXPIRED = "HEARTBEAT_EXPIRED_DIAGNOSTIC"
QUARANTINE = "QUARANTINE_INDEX"


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def digest(obj):
    return hashlib.sha256(canonical(obj).encode("utf-8")).hexdigest()


def load_claims(claim_dir):
    claims = []
    for name in sorted(os.listdir(claim_dir)):
        if not name.endswith(".json"):
            continue
        path = os.path.join(claim_dir, name)
        with open(path, "r", encoding="utf-8") as f:
            c = json.load(f)
        c["_file"] = name
        claims.append(c)
    return claims


def aggregate(claim_dir):
    claims = load_claims(claim_dir)
    groups = {}
    for c in claims:
        groups.setdefault(int(c["model_index"]), []).append(c)
    winners = {}
    alerts = []
    quarantined = []
    for idx in sorted(groups):
        members = groups[idx]
        max_n = max(int(m["attempt"]) for m in members)
        top = [m for m in members if int(m["attempt"]) == max_n]
        if len(top) > 1:
            alerts.append({
                "alert": ALERT_DUP,
                "model_index": idx,
                "detail": ",".join(sorted(m["_file"] for m in top)),
            })
        # conflicting fingerprints within the selected attempt: quarantine, never choose content
        fps = set()
        for m in top:
            fps.add((m.get("payload_sha256"), m.get("receipt_sha256")))
        if len(fps) > 1:
            quarantined.append(idx)
            alerts.append({"alert": QUARANTINE, "model_index": idx})
            continue
        top.sort(key=lambda m: str(m["worker_id"]))
        winner = top[-1]
        if winner.get("heartbeat_expired"):
            alerts.append({
                "alert": ALERT_EXPIRED,
                "model_index": idx,
                "detail": "winner attempt %d has an expired heartbeat but still owns the index; takeover refused by design" % max_n,
            })
        winners[str(idx)] = {
            "file": winner["_file"],
            "worker_id": winner["worker_id"],
            "attempt": max_n,
            "payload_sha256": winner.get("payload_sha256"),
            "receipt_sha256": winner.get("receipt_sha256"),
        }
    return {
        "winners": winners,
        "alerts": alerts,
        "quarantined": sorted(quarantined),
        "claim_digest": digest(sorted((c["model_index"], c["worker_id"], c["attempt"]) for c in claims)),
    }


def _claim(idx, wid, att, payload="pA", receipt="rA", expired=False):
    return {
        "model_index": idx,
        "worker_id": wid,
        "attempt": att,
        "payload_sha256": "sha256-claim-" + payload,
        "receipt_sha256": "sha256-receipt-" + receipt,
        "heartbeat_expired": expired,
    }


def selftest():
    tmp = tempfile.mkdtemp(prefix="claims_rehearsal_")
    d = os.path.join(tmp, "claims")
    os.makedirs(d)

    def put(c):
        fn = "%d.%s.attempt%d.json" % (c["model_index"], c["worker_id"], c["attempt"])
        with open(os.path.join(d, fn), "w", encoding="utf-8") as f:
            json.dump(c, f, sort_keys=True)

    # F1 two-worker race: max attempt wins regardless of write order
    put(_claim(101, "wA", 1))
    put(_claim(101, "wB", 2))
    # F2 same-attempt tie: lexicographically greatest worker id wins, duplicate alert
    put(_claim(102, "wA", 2))
    put(_claim(102, "wB", 2))
    # F3 conflicting payloads in selected attempt: quarantine, no winner content chosen
    put(_claim(103, "wA", 2, payload="pX", receipt="rX"))
    put(_claim(103, "wB", 2, payload="pY", receipt="rY"))
    # F4 killed worker, healthy path: expired attempt 2 plus live re-attempt 3;
    #    re-attempt after expiry is the NORMAL additive path: attempt 3 wins, no alert noise
    put(_claim(104, "wA", 2, expired=True))
    put(_claim(104, "wB", 3))
    # F4b stuck index: selected winner has an expired heartbeat and no live re-attempt;
    #    diagnostic alert fires, no takeover ever happens (alert-only, human decides)
    put(_claim(106, "wC", 2, expired=True))
    # F5 expired lower attempt behind a live higher one: no alert noise about the dead one
    put(_claim(105, "wZ", 3))
    put(_claim(105, "wA", 2, expired=True))

    res = aggregate(d)
    res2 = aggregate(d)
    receipts = []

    def check(case, ok, detail=""):
        receipts.append({"case": case, "pass": bool(ok), "detail": detail})
        print("PASS" if ok else "FAIL", case, detail)

    w = res["winners"]
    check("F1_max_attempt_wins", w["101"]["worker_id"] == "wB" and w["101"]["attempt"] == 2)
    check("F2_tiebreak_greatest_worker", w["102"]["worker_id"] == "wB")
    check("F2_duplicate_alert_fired", any(a["alert"] == ALERT_DUP and a["model_index"] == 102 for a in res["alerts"]))
    check("F3_quarantine_no_winner", "103" not in w and 103 in res["quarantined"])
    check("F4_reattempt_after_expiry_wins_silently_by_design",
          w["104"]["worker_id"] == "wB" and w["104"]["attempt"] == 3
          and not any(a.get("model_index") == 104 and a["alert"] == ALERT_EXPIRED for a in res["alerts"]))
    check("F4b_stuck_index_winner_expired_alerts_not_steals",
          w["106"]["worker_id"] == "wC"
          and any(a["alert"] == ALERT_EXPIRED and a["model_index"] == 106 for a in res["alerts"]))
    check("F5_live_higher_attempt_wins", w["105"]["worker_id"] == "wZ" and w["105"]["attempt"] == 3)
    check("F5_no_false_expired_alert_on_live_winner",
          not any(a.get("model_index") == 105 and a["alert"] == ALERT_EXPIRED for a in res["alerts"]))
    check("DETERMINISM_same_digest", digest(res) == digest(res2))

    for r in receipts:
        print(json.dumps({"rehearsal": "claim-dedupe-v1", "run": "mc-20261120", **r}, sort_keys=True))
    failed = [r for r in receipts if not r["pass"]]
    print(json.dumps({"rehearsal": "claim-dedupe-v1",
                      "verdict": "PASS" if not failed else "FAIL",
                      "cases": len(receipts), "failed": len(failed)}, sort_keys=True))
    return 0 if not failed else 1


def main():
    ap = argparse.ArgumentParser(description="stack400 additive-claims aggregation")
    ap.add_argument("claim_dir", nargs="?", default=None)
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        return selftest()
    if not args.claim_dir:
        print("claim_dir required, or use --selftest")
        return 3
    if not os.path.isdir(args.claim_dir):
        print("claim_dir not found: " + args.claim_dir)
        return 3
    res = aggregate(args.claim_dir)
    print(json.dumps(res, indent=2, sort_keys=True))
    if res["quarantined"]:
        return 2
    if res["alerts"]:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
