"""
mc_snapshot.py - GET-only Massed Compute snapshot for watchdog --once.
"""
import argparse
import json
import os
import sys
import time
import urllib.request
import hashlib

BASE = "https://vm.massedcompute.com/api/v1"
BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
KEY_PATHS = (
    "C:/SZL/edge-debug/massed_key.txt",
    "C:/SZL/edge-debug/.secrets/mc_secret_key.txt",
)
FINGERPRINT_FIELDS = ("id", "name", "state", "raw_state", "gpu", "region", "price_hr")

def load_key():
    for path in KEY_PATHS:
        try:
            with open(path, "r", encoding="utf-8") as stream:
                key = stream.read().strip()
                if key: return key, path
        except OSError: continue
    return None, None

def get(path, key):
    req = urllib.request.Request(BASE + path, headers={
        "User-Agent": BROWSER_UA, "Accept": "application/json",
        "Referer": "https://vm.massedcompute.com/", "Authorization": f"Bearer {key}",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8", errors="replace"))

def map_state(raw):
    s = str(raw or "").strip().lower()
    if any(m in s for m in ("creat", "provision", "deploy", "pending", "start")):
        return "creating"
    if any(m in s for m in ("run", "active", "ready", "started", "up")):
        return "running"
    return "other"

def instances_from(data):
    if isinstance(data, list): return data
    if isinstance(data, dict):
        for k in ("runningInstances", "instances", "data", "results", "items"):
            v = data.get(k)
            if isinstance(v, list): return v
            if isinstance(v, dict):
                res = instances_from(v)
                if res: return res
    return []

def _previous_states(path):
    try:
        with open(path, "r", encoding="utf-8") as stream:
            data = json.load(stream)
            if not isinstance(data, dict): return {}
            return {str(i["id"]): (i.get("state"), int(i["state_change_s"])) 
                    for i in data.get("instances", []) if isinstance(i, dict) and "id" in i and "state_change_s" in i}
    except (OSError, ValueError, TypeError): return {}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True)
    parser.add_argument("--fingerprint", action="store_true")
    args = parser.parse_args()

    key, keyfile = load_key()
    if not key:
        print(json.dumps({"kind": "error", "error": "NO_KEY_ON_DEVICE", "get_only": True}, sort_keys=True))
        return 2

    now = int(time.time())
    try:
        data = get("/instance", key)
    except Exception as e:
        print(json.dumps({"kind": "error", "error": f"GET_FAILED: {type(e).__name__}", "get_only": True}, sort_keys=True))
        return 3

    previous = _previous_states(args.out)
    instances = []
    by_state = {}
    
    for raw in instances_from(data):
        if not isinstance(raw, dict): continue
        iid = str(raw.get("uuid") or raw.get("id") or raw.get("instance_id") or "?")
        status = raw.get("status") or raw.get("state") or raw.get("instance_status")
        state = map_state(status)
        
        state_change = now
        prior = previous.get(iid)
        if prior and prior[0] == state and 0 < prior[1] <= now:
            state_change = prior[1]

        prod = raw.get("product") if isinstance(raw.get("product"), dict) else {}
        reg = raw.get("region") if isinstance(raw.get("region"), dict) else {}
        
        inst = {
            "id": iid, "name": str(raw.get("name") or "")[:40], "state": state,
            "state_change_s": state_change, "last_stage_beacon_s": now,
            "raw_state": str(status or "")[:40], "gpu": str(prod.get("name") or "")[:40],
            "region": str(reg.get("name") or "")[:20], "price_hr": str(prod.get("final_price_hr") or "")[:10],
        }
        instances.append(inst)
        by_state[state] = by_state.get(state, 0) + 1

    snap = {"now_s": now, "source": "massed GET /instance", "instances": instances,
            "instance_count": len(instances), "instance_count_by_state": by_state}
    
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as stream:
        json.dump(snap, stream, sort_keys=True, indent=1)

    summary = {"kind": "snapshot_written", "out": args.out, "now_s": now,
               "instance_count": len(instances), "by_state": by_state,
               "key_file_used": os.path.basename(keyfile) if keyfile else None,
               "key_printed": False, "get_only": True}
    if args.fingerprint:
        rows = sorted([json.dumps({f: i.get(f, "") for f in FINGERPRINT_FIELDS}, sort_keys=True, separators=(",", ":")) for i in instances])
        summary["fingerprint_sha256"] = hashlib.sha256(f"[{','.join(rows)}]".encode("utf-8")).hexdigest()
    
    print(json.dumps(summary, sort_keys=True))
    return 0

if __name__ == "__main__":
    sys.exit(main())
