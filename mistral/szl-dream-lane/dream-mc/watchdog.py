"""
watchdog.py - laptop-side alert-only watchdog W1-W6, adjudicated round mc-20261120.

Trio verdict (Kimi + Mistral + Astra, 2026-11-20): BUILD, with amendments:
  - alert-only and read-only against live systems: GET requests only, never mutates
    campaign code, claims, receipts, deployments or sibling configuration
  - owns only its own namespace: alert log (jsonl) plus in-memory dedup state
  - poll interval 30s; at most one alert per key per 600s, with recovery notices
  - beacon = stage-transition receipt only, never per-poll commits (respects the
    ~320 HF commits per hour ceiling)
  - W5 alerts only when active progress is expected
  - W6 is critical severity
  - no auto-remediation of any kind

Conditions:
  W1a instance stuck in creating longer than 180s
  W1b instance running then gone with zero beacons
  W1c running instance with no stage beacon for 60s (2 polls)
  W2 per-model stage pipeline stuck longer than 600s
  W3 quota breach: replicas over 30, memory over limit, unexpected gpu class
  W4 HF commit rate over 320 per hour or any failed commit
  W5 verified receipts not monotonic, or zero new verified receipts for 1800s
     while active progress is expected
  W6 a dead job has receipt_local without receipt_hf (unflushed receipt, critical)

Modes:
  --selftest FIXTURE_DIR : evaluate fixture snapshots through the same evaluate()
      used live; assert expected alerts; exit 1 on any miss
  --config CONFIG.json   : live loop; config gives snapshot sources (http GET with
      browser UA, or local snapshot file). Secrets are read from files into
      memory for headers only and are never logged or echoed.

Snapshot shape (see evaluate docstring in code): a dict captured once per poll.
All timing fields are unix seconds.
"""
import argparse
import json
import os
import sys
import time
import urllib.request

POLL_S = 30
DEDUP_S = 600
CRITICAL_KEYS = {"W5_RECEIPT_NON_MONOTONIC", "W6_UNFLUSHED_RECEIPT"}
BROWSER_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")


def evaluate(snap, prev):
    """Return a list of alert dicts from one snapshot plus the previous snapshot."""
    alerts = []
    now = int(snap["now_s"])
    instances = {i["id"]: i for i in snap.get("instances", [])}
    # W1a stuck creating
    for iid, inst in instances.items():
        if inst.get("state") == "creating" and now - int(inst.get("state_change_s", now)) > 180:
            alerts.append({"key": "W1a_INSTANCE_STUCK_CREATING", "target": iid})
    # W1b running then gone
    if prev:
        prev_running = {i["id"] for i in prev.get("instances", []) if i.get("state") == "running"}
        for iid in prev_running - set(instances):
            alerts.append({"key": "W1b_INSTANCE_LOST", "target": iid})
    # W1c no stage beacon in 60s while running
    for iid, inst in instances.items():
        if inst.get("state") == "running" and now - int(inst.get("last_stage_beacon_s", now)) > 60:
            alerts.append({"key": "W1c_NO_STAGE_BEACON", "target": iid})
    # W2 stage stuck over 600s
    for st in snap.get("stages", []):
        if st.get("state") == "active" and now - int(st.get("entered_s", now)) > 600:
            alerts.append({"key": "W2_STAGE_STALLED", "target": st.get("key", "?")})
    # W3 quota
    q = snap.get("quota", {})
    if int(q.get("replicas", 0)) > 30:
        alerts.append({"key": "W3_REPLICA_CAP", "target": str(q.get("replicas"))})
    if float(q.get("mem_used_gb", 0)) > float(q.get("mem_limit_gb", 1e12)):
        alerts.append({"key": "W3_MEMORY", "target": str(q.get("mem_used_gb"))})
    if q.get("gpu_classes") and q.get("gpu_classes_expected"):
        if set(q["gpu_classes"]) - set(q["gpu_classes_expected"]):
            alerts.append({"key": "W3_GPU_CLASS", "target": ",".join(sorted(q["gpu_classes"]))})
    # W4 HF commits
    h = snap.get("hf", {})
    if int(h.get("commits_last_hour", 0)) > 320:
        alerts.append({"key": "W4_COMMIT_RATE", "target": str(h.get("commits_last_hour"))})
    if int(h.get("failed_commits", 0)) > 0:
        alerts.append({"key": "W4_FAILED_COMMITS", "target": str(h.get("failed_commits"))})
    # W5 receipts
    r = snap.get("receipts", {})
    if r.get("non_monotonic"):
        alerts.append({"key": "W5_RECEIPT_NON_MONOTONIC", "target": str(r.get("last_verified_s", "?"))})
    if r.get("active_progress_expected") and now - int(r.get("last_verified_s", now)) > 1800:
        alerts.append({"key": "W5_RECEIPT_STALLED", "target": str(r.get("last_verified_s"))})
    # W6 unflushed receipt at death
    for j in snap.get("dead_jobs", []):
        if j.get("receipt_local") and not j.get("receipt_hf"):
            alerts.append({"key": "W6_UNFLUSHED_RECEIPT", "target": j.get("id", "?")})
    return alerts


class AlertLog:
    def __init__(self, path, dedup_s=DEDUP_S):
        self.path = path
        self.dedup_s = dedup_s
        self.last_fired = {}
        self.load()

    def load(self):
        if os.path.exists(self.path):
            with open(self.path, "r", encoding="utf-8") as f:
                for line in f:
                    try:
                        rec = json.loads(line)
                    except ValueError:
                        continue
                    if rec.get("kind") == "alert":
                        self.last_fired[rec["dedup_key"]]= rec.get("t", 0)

    def write(self, rec):
        with open(self.path, "a", encoding="utf-8") as f:
            f.write(json.dumps(rec, sort_keys=True) + "\n")

    def handle(self, alerts, now):
        """Dedup at most one alert per key per window; emit recovery notices."""
        fired = []
        seen = set()
        for a in alerts:
            dk = a["key"] + "|" + str(a["target"])
            if dk in seen:
                continue
            seen.add(dk)
            was = self.last_fired.get(dk)
            if was is not None and now - was < self.dedup_s:
                continue
            rec = {"kind": "alert", "t": now, "key": a["key"], "target": a["target"],
                   "dedup_key": dk, "severity": "critical" if a["key"] in CRITICAL_KEYS else "warning",
                   "mutated": False, "get_only": True}
            self.write(rec)
            self.last_fired[dk] = now
            fired.append(rec)
        for dk, t in list(self.last_fired.items()):
            if now - t >= self.dedup_s and dk not in seen and t > 0:
                key = dk.split("|")[0]
                if key.startswith(("W1", "W2", "W3", "W4", "W5", "W6")):
                    self.write({"kind": "recovered", "t": now, "dedup_key": dk,
                                "key": key, "get_only": True})
                del self.last_fired[dk]
        return fired


def fetch_snapshot_http(cfg):
    """GET sources with a browser UA. Secrets stay in memory for headers only."""
    req = urllib.request.Request(cfg["url"], headers={"User-Agent": BROWSER_UA})
    key = None
    if cfg.get("key_file") and os.path.exists(cfg["key_file"]):
        with open(cfg["key_file"], "r", encoding="utf-8") as f:
            key = f.read().strip()
    if key and cfg.get("auth_header"):
        req.add_header(cfg["auth_header"], "Bearer " + key)
    with urllib.request.urlopen(req, timeout=cfg.get("timeout_s", 20)) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_snapshot_file(cfg):
    with open(cfg["path"], "r", encoding="utf-8") as f:
        return json.load(f)


def build_snapshot(sources):
    snap = {"now_s": int(time.time())}
    for name, cfg in sources.items():
        data = fetch_snapshot_http(cfg) if cfg["type"] == "http" else fetch_snapshot_file(cfg)
        if isinstance(data, dict):
            snap.update(data)
    return snap


def run_live(config_path):
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = json.load(f)
    log = AlertLog(cfg.get("alert_log", "watchdog_alerts.jsonl"))
    prev = None
    print(json.dumps({"kind": "started", "t": int(time.time()), "poll_s": POLL_S,
                      "get_only": True, "mutates": False}, sort_keys=True))
    while True:
        try:
            snap = build_snapshot(cfg["sources"])
            alerts = evaluate(snap, prev)
            fired = log.handle(alerts, int(snap["now_s"]))
            for rec in fired:
                print(json.dumps(rec, sort_keys=True), flush=True)
            prev = snap
        except Exception as e:
            print(json.dumps({"kind": "source_error", "t": int(time.time()),
                              "error": str(e)[:200], "get_only": True}, sort_keys=True), flush=True)
        time.sleep(POLL_S)


def selftest(fixture_dir):
    """Each fixture: {"snap": {...}, "prev": {...}|null, "expect": ["W1a_INSTANCE_STUCK_CREATING", ...]}"""
    ok = True
    total = 0
    for name in sorted(os.listdir(fixture_dir)):
        if not name.endswith(".json"):
            continue
        with open(os.path.join(fixture_dir, name), "r", encoding="utf-8") as f:
            fx = json.load(f)
        total += 1
        got = evaluate(fx["snap"], fx.get("prev"))
        got_keys = sorted(set(a["key"] for a in got))
        want = sorted(fx["expect"])
        extra = [k for k in got_keys if k not in want]
        missing = [k for k in want if k not in got_keys]
        passed = not extra and not missing
        ok = ok and passed
        print(json.dumps({"kind": "selftest", "case": fx.get("case", name), "pass": passed,
                          "got": got_keys, "missing": missing, "extra": extra,
                          "get_only": True}, sort_keys=True))
    print(json.dumps({"kind": "selftest_summary", "verdict": "PASS" if ok else "FAIL",
                      "cases": total}, sort_keys=True))
    return 0 if ok else 1


def main():
    ap = argparse.ArgumentParser(description="stack400 / MC alert-only watchdog W1-W6")
    ap.add_argument("--selftest", metavar="FIXTURE_DIR", default=None)
    ap.add_argument("--config", default=None)
    args = ap.parse_args()
    if args.selftest:
        return selftest(args.selftest)
    if args.config:
        return run_live(args.config)
    print("use --selftest FIXTURE_DIR or --config CONFIG.json")
    return 3


if __name__ == "__main__":
    sys.exit(main())
