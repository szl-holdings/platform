"""
mc_probe.py - structure-only GET probe of the MC API for the snapshot adapter.
Prints keys, types, and lengths ONLY. Never prints values (responses may carry
secret-bearing blobs per the lap-8 embedded HF_TOKEN catch). GET-only, key
in-memory, never logged.
"""
import json
import os
import sys
import urllib.request

BASE = "https://vm.massedcompute.com/api/v1"
BROWSER_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
KEY_PATHS = ["C:/SZL/edge-debug/massed_key.txt",
             "C:/SZL/edge-debug/.secrets/mc_secret_key.txt"]


def load_key():
    for p in KEY_PATHS:
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                k = f.read().strip()
            if k:
                return k
    return None


def shape(x, depth=0):
    if depth > 6:
        return "DEPTH_LIMIT"
    if isinstance(x, dict):
        return {str(k): shape(v, depth + 1) for k, v in list(x.items())[:40]}
    if isinstance(x, list):
        return {"_list_len": len(x), "_first": shape(x[0], depth + 1) if x else None}
    if isinstance(x, str):
        return "str(%d chars)" % len(x)
    return type(x).__name__


def get(path, key):
    req = urllib.request.Request(BASE + path, headers={
        "User-Agent": BROWSER_UA,
        "Accept": "application/json",
        "Referer": "https://vm.massedcompute.com/",
        "Authorization": "Bearer " + key,
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        code = resp.getcode()
        body = resp.read().decode("utf-8", errors="replace")
    try:
        data = json.loads(body)
    except ValueError:
        data = {"_non_json": "len=%d" % len(body)}
    return code, data


def main():
    key = load_key()
    if not key:
        print(json.dumps({"kind": "error", "error": "NO_KEY_ON_DEVICE"}))
        return 2
    for path in ("/instance", "/gpu-inventory"):
        try:
            code, data = get(path, key)
            print(json.dumps({"kind": "probe", "path": path, "http": code,
                              "shape": shape(data)}, sort_keys=True))
        except Exception as e:
            print(json.dumps({"kind": "probe_error", "path": path,
                              "error": str(e)[:160]}, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
