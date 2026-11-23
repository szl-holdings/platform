"""
mc_snapshot.py - GET-only Massed Compute instance snapshot for the W1 watchdog.

Sibling-lap measured facts (receipted): API base https://vm.massedcompute.com/api/v1,
Bearer auth, browser User-Agent plus portal Referer required (Cloudflare 1010
blocks python UA), GET /instance lists instances (NOT /instances).
Doctrine: GET-only, never launches/terminates/writes anything at the provider,
key read from device file into memory for the Authorization header only, never
printed/logged/echoed. Output is a watchdog-schema snapshot json for --once.

Mapping, honestly scoped:
  - instance id and state are mapped to watchdog fields
  - creating-like states map to "creating"; running maps to "running";
    everything else maps to "other" (no false W1a/W1c)
  - state_change_s is not exposed by the provider list view, so it is set to
    now (W1a can only fire if a state stays creating WITH a measured change ts,
    which this first wiring does not yet have)
  - last_stage_beacon_s = now (stage beacons come from campaign receipts, not
    from the provider, so W1c cannot fire false on this wiring; W1b running-
    then-gone DOES work across invocations via the --once state file)
"""
import argparse
import json
import os
import sys
import time
import urllib.request

BASE = "https://vm.massedcompute.com/api/v1"
BROWSER_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
KEY_PATHS = [
    "C:/SZL/edge-debug/massed_key.txt",
    "C:/SZL/edge-debug/.secrets/mc_secret_key.txt",
]


def load_key():
    for p in KEY_PATHS:
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                key = f.read().strip()
            if key:
                return key, p
    return None, None


def get(path, key):
    req = urllib.request.Request(BASE + path, headers={
        "User-Agent": BROWSER_UA,
        "Accept": "application/json",
        "Referer": "https://vm.massedcompute.com/",
        "Authorization": "Bearer " + key,
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8", errors="replace"))


def map_state(raw):
    s = str(raw or "").lower()
    if "creat" in s or "provision" in s or "deploy" in s or "pending" in s or "start" in s:
        return "creating"
    if "run" in s or "active" in s or "ready" in s:
        return "running"
    return "other"


def instances_from(data):
    """Accept dict-with-list, list, or nested keys; fail-closed on garbage."""
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for k in ("runningInstances", "instances", "data", "results", "items"):
            if isinstance(data.get(k), list):
                return data[k]
            if isinstance(data.get(k), dict):
                inner = instances_from(data[k])
                if inner:
                    return inner
    return []


def main():
    ap = argparse.ArgumentParser(description="GET-only MC snapshot for watchdog --once")
    ap.add_argument("--out", required=True)
    ap.add_argument("--fingerprint", action="store_true")
    args = ap.parse_args()
    key, keyfile = load_key()
    if not key:
        print(json.dumps({"kind": "error", "error": "NO_KEY_ON_DEVICE", "get_only": True}))
        return 2
    now = int(time.time())
    snap = {"now_s": now, "source": "massed GET /instance", "instances": []}
    try:
        data = get("/instance", key)
    except Exception as e:
        print(json.dumps({"kind": "error", "error": "GET_FAILED: " + str(e)[:200],
                          "get_only": True}))
        return 3
    raws = instances_from(data)
    for raw in raws:
        if not isinstance(raw, dict):
            continue
        iid = raw.get("uuid") or raw.get("id") or raw.get("instance_id") or "?"
        state = map_state(raw.get("status") or raw.get("state") or raw.get("instance_status"))
        product = raw.get("product") if isinstance(raw.get("product"), dict) else {}
        region = raw.get("region") if isinstance(raw.get("region"), dict) else {}
        snap["instances"].append({
            "id": str(iid),
            "name": str(raw.get("name") or "")[:40],
            "state": state,
            "state_change_s": now,
            "last_stage_beacon_s": now,
            "raw_state": str(raw.get("status") or "")[:40],
            "gpu": str(product.get("name") or "")[:40],
            "region": str(region.get("name") or "")[:20],
            "price_hr": str(product.get("final_price_hr") or "")[:10],
        })
    snap["instance_count"] = len(snap["instances"])
    snap["instance_count_by_state"] = {}
    for i in snap["instances"]:
        snap["instance_count_by_state"][i["state"]] = snap["instance_count_by_state"].get(i["state"], 0) + 1
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(snap, f, sort_keys=True, indent=1)
    print(json.dumps({"kind": "snapshot_written", "out": args.out,
                      "now_s": now, "instance_count": snap["instance_count"],
                      "by_state": snap["instance_count_by_state"],
                      "key_file_used": os.path.basename(keyfile) if keyfile else None,
                      "key_printed": False, "get_only": True}, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
