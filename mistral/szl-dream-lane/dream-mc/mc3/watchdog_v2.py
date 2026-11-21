"""
watchdog.py - alert-only, read-only W1-W6 watchdog.

Live operation performs only configured snapshot GETs or local file reads. It
writes exclusively to its alert log and optional --once state file. Secrets are
read into memory for request headers and are never logged or echoed.

CLI and JSON contracts remain:
  --selftest FIXTURE_DIR
  --config CONFIG.json
  --once SNAPSHOT_JSON [--state STATE_JSON]

Thresholds and deduplication remain 30s polling, 600s alert deduplication, and
one recovery notice after a condition has been absent for the dedup window.
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

POLL_S = 30
DEDUP_S = 600
CRITICAL_KEYS = frozenset({"W5_RECEIPT_NON_MONOTONIC", "W6_UNFLUSHED_RECEIPT"})
WATCH_PREFIXES = ("W1", "W2", "W3", "W4", "W5", "W6")
BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

class SnapshotError(ValueError):
    """An error whose message is static and safe to publish."""

def _safe_error(exc):
    if isinstance(exc, SnapshotError):
        return str(exc)
    if isinstance(exc, urllib.error.HTTPError):
        return f"HTTP {exc.code}"
    if isinstance(exc, urllib.error.URLError):
        return "URL error" if isinstance(exc.reason, str) else f"URL error: {type(exc.reason).__name__}"
    if isinstance(exc, TimeoutError):
        return "timeout"
    if isinstance(exc, json.JSONDecodeError):
        return f"invalid JSON at line {exc.lineno} column {exc.colno}"
    return type(exc).__name__

def evaluate(snap, prev):
    if not isinstance(snap, dict):
        raise SnapshotError("snapshot must be an object")
    
    try:
        now = int(snap["now_s"])
    except (KeyError, TypeError, ValueError):
        raise SnapshotError("snapshot requires integer now_s")

    alerts = []
    instances = snap.get("instances")
    if isinstance(instances, list):
        inst_map = {str(i.get("id", "?")): i for i in instances if isinstance(i, dict)}
        
        for iid, inst in inst_map.items():
            state = inst.get("state")
            if state == "creating":
                try:
                    if now - int(inst.get("state_change_s", now)) > 180:
                        alerts.append({"key": "W1a_INSTANCE_STUCK_CREATING", "target": iid})
                except (TypeError, ValueError): pass
            elif state == "running":
                try:
                    if now - int(inst.get("last_stage_beacon_s", now)) > 60:
                        alerts.append({"key": "W1c_NO_STAGE_BEACON", "target": iid})
                except (TypeError, ValueError): pass

        if isinstance(prev, dict):
            prev_instances = prev.get("instances")
            if isinstance(prev_instances, list):
                prev_running = {str(i.get("id", "?")) for i in prev_instances if isinstance(i, dict) and i.get("state") == "running"}
                for iid in sorted(prev_running - set(inst_map)):
                    alerts.append({"key": "W1b_INSTANCE_LOST", "target": iid})

    for stage in (snap.get("stages") if isinstance(snap.get("stages"), list) else []):
        if isinstance(stage, dict) and stage.get("state") == "active":
            try:
                if now - int(stage.get("entered_s", now)) > 600:
                    alerts.append({"key": "W2_STAGE_STALLED", "target": str(stage.get("key", "?"))})
            except (TypeError, ValueError): pass

    quota = snap.get("quota")
    if isinstance(quota, dict):
        try:
            reps = int(quota.get("replicas", 0))
            if reps > 30:
                alerts.append({"key": "W3_REPLICA_CAP", "target": str(reps)})
            
            used = float(quota.get("mem_used_gb", 0))
            limit = float(quota.get("mem_limit_gb", 1e12))
            if used > limit:
                alerts.append({"key": "W3_MEMORY", "target": str(used)})
            
            gpu = quota.get("gpu_classes")
            exp = quota.get("gpu_classes_expected")
            if gpu and exp:
                g_set, e_set = (set(gpu) if isinstance(gpu, (list, set)) else {gpu}, 
                                set(exp) if isinstance(exp, (list, set)) else {exp})
                if g_set - e_set:
                    alerts.append({"key": "W3_GPU_CLASS", "target": ",".join(sorted(map(str, g_set)))})
        except (TypeError, ValueError): pass

    hf = snap.get("hf")
    if isinstance(hf, dict):
        try:
            commits = int(hf.get("commits_last_hour", 0))
            if commits > 320:
                alerts.append({"key": "W4_COMMIT_RATE", "target": str(commits)})
            if int(hf.get("failed_commits", 0)) > 0:
                alerts.append({"key": "W4_FAILED_COMMITS", "target": str(hf.get("failed_commits"))})
        except (TypeError, ValueError): pass

    receipts = snap.get("receipts")
    if isinstance(receipts, dict):
        if receipts.get("non_monotonic"):
            alerts.append({"key": "W5_RECEIPT_NON_MONOTONIC", "target": str(receipts.get("last_verified_s", "?"))})
        if receipts.get("active_progress_expected"):
            try:
                last_v = int(receipts.get("last_verified_s", now))
                if now - last_v > 1800:
                    alerts.append({"key": "W5_RECEIPT_STALLED", "target": str(last_v)})
            except (TypeError, ValueError): pass

    for job in (snap.get("dead_jobs") if isinstance(snap.get("dead_jobs"), list) else []):
        if isinstance(job, dict) and job.get("receipt_local") and not job.get("receipt_hf"):
            alerts.append({"key": "W6_UNFLUSHED_RECEIPT", "target": str(job.get("id", "?"))})
            
    return alerts

class AlertLog:
    def __init__(self, path, dedup_s=DEDUP_S):
        self.path = path
        self.dedup_s = dedup_s
        self.last_fired = {}
        self.load()

    def load(self):
        try:
            with open(self.path, "r", encoding="utf-8") as stream:
                for line in stream:
                    try:
                        rec = json.loads(line)
                        if rec.get("kind") == "alert":
                            dk = rec.get("dedup_key")
                            t = int(rec.get("t", 0))
                            if dk and (dk not in self.last_fired or t >= self.last_fired[dk]):
                                self.last_fired[dk] = t
                    except (ValueError, TypeError, KeyError): continue
        except FileNotFoundError: pass

    def handle(self, alerts, now):
        fired, records = [], []
        seen = set()
        for alert in alerts:
            key, target = str(alert["key"]), str(alert["target"])
            dk = f"{key}|{target}"
            if dk in seen: continue
            seen.add(dk)
            prev_t = self.last_fired.get(dk)
            if prev_t is not None and now - prev_t < self.dedup_s: continue
            rec = {"kind": "alert", "t": now, "key": key, "target": target, "dedup_key": dk,
                   "severity": "critical" if key in CRITICAL_KEYS else "warning",
                   "mutated": False, "get_only": True}
            records.append(rec)
            fired.append(rec)
            self.last_fired[dk] = now

        recovered = []
        for dk, t in list(self.last_fired.items()):
            if dk not in seen and now - t >= self.dedup_s:
                key = dk.split("|", 1)[0]
                if key.startswith(WATCH_PREFIXES):
                    recovered.append({"kind": "recovered", "t": now, "dedup_key": dk, "key": key, "get_only": True})
                del self.last_fired[dk]
        
        if records or recovered:
            with open(self.path, "a", encoding="utf-8") as stream:
                for r in records + recovered:
                    stream.write(json.dumps(r, sort_keys=True) + "\n")
        return fired

def fetch_snapshot_http(cfg):
    req = urllib.request.Request(cfg["url"], headers={"User-Agent": BROWSER_UA}, method="GET")
    key_file = cfg.get("key_file")
    if key_file:
        try:
            with open(key_file, "r", encoding="utf-8") as stream:
                key = stream.read().strip()
                if key and cfg.get("auth_header"):
                    req.add_header(cfg["auth_header"], f"Bearer {key}")
        except OSError: pass
    with urllib.request.urlopen(req, timeout=int(cfg.get("timeout_s", 20))) as response:
        return json.loads(response.read().decode("utf-8"))

def fetch_snapshot_file(cfg):
    with open(cfg["path"], "r", encoding="utf-8") as stream:
        return json.load(stream)

def build_snapshot(sources):
    if not isinstance(sources, dict): raise SnapshotError("config sources must be an object")
    snap = {"now_s": int(time.time())}
    for cfg in sources.values():
        if not isinstance(cfg, dict): raise SnapshotError("snapshot source config must be an object")
        data = fetch_snapshot_http(cfg) if cfg.get("type") == "http" else fetch_snapshot_file(cfg)
        if isinstance(data, dict): snap.update(data)
    return snap

def run_live(config_path):
    with open(config_path, "r", encoding="utf-8") as stream:
        cfg = json.load(stream)
    sources = cfg.get("sources")
    if not isinstance(sources, dict): raise SnapshotError("config sources must be an object")
    log = AlertLog(cfg.get("alert_log", "watchdog_alerts.jsonl"))
    previous = None
    print(json.dumps({"kind": "started", "t": int(time.time()), "poll_s": POLL_S, "get_only": True, "mutates": False}, sort_keys=True), flush=True)
    while True:
        try:
            snap = build_snapshot(sources)
            alerts = evaluate(snap, previous)
            now = int(snap.get("now_s", time.time()))
            for rec in log.handle(alerts, now):
                print(json.dumps(rec, sort_keys=True), flush=True)
            previous = snap
        except Exception as exc:
            print(json.dumps({"kind": "source_error", "t": int(time.time()), "error": _safe_error(exc)[:200], "get_only": True}, sort_keys=True), flush=True)
        time.sleep(POLL_S)

def selftest(fixture_dir):
    ok, total = True, 0
    for name in sorted(os.listdir(fixture_dir)):
        if not name.endswith(".json"): continue
        with open(os.path.join(fixture_dir, name), "r", encoding="utf-8") as stream:
            fx = json.load(stream)
        total += 1
        got = evaluate(fx["snap"], fx.get("prev"))
        got_keys = sorted({a["key"] for a in got})
        want = sorted(fx["expect"])
        extra = [k for k in got_keys if k not in want]
        missing = [k for k in want if k not in got_keys]
        passed = not extra and not missing
        ok = ok and passed
        print(json.dumps({"kind": "selftest", "case": fx.get("case", name), "pass": passed, "got": got_keys, "missing": missing, "extra": extra, "get_only": True}, sort_keys=True))
    print(json.dumps({"kind": "selftest_summary", "verdict": "PASS" if ok else "FAIL", "cases": total}, sort_keys=True))
    return 0 if ok else 1

def run_once(snapshot_path, state_path=None):
    with open(snapshot_path, "r", encoding="utf-8") as stream:
        snap = json.load(stream)
    prev = None
    if state_path:
        try:
            with open(state_path, "r", encoding="utf-8") as stream:
                prev = json.load(stream)
        except (OSError, ValueError): pass
    alerts = evaluate(snap, prev)
    for a in alerts:
        print(json.dumps({"kind": "alert", "severity": "critical" if a["key"] in CRITICAL_KEYS else "warning", "key": a["key"], "target": str(a["target"]), "get_only": True}, sort_keys=True))
    print(json.dumps({"kind": "once_summary", "snapshot": os.path.basename(snapshot_path), "alerts": len(alerts), "keys": sorted({a["key"] for a in alerts}), "verdict": "CLEAN" if not alerts else "ALERTS_PRESENT"}, sort_keys=True))
    if state_path:
        with open(state_path, "w", encoding="utf-8") as stream:
            json.dump(snap, stream, sort_keys=True, separators=(",", ":"))
    return 0

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--selftest")
    parser.add_argument("--config")
    parser.add_argument("--once")
    parser.add_argument("--state")
    args = parser.parse_args()
    if args.selftest: return selftest(args.selftest)
    if args.config: return run_live(args.config)
    if args.once: return run_once(args.once, args.state)
    return 3

if __name__ == "__main__":
    sys.exit(main())
