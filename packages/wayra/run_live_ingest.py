#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
"""Live WAYRA ingest run — polls real public sources and fills the SQLite log.

LEGAL: HF Hub official client + GitHub releases.atom + arXiv RSS + USASpending API +
vendor press RSS + IETF/W3C feeds — all official APIs / RSS / public feeds. Read-only.
"""
import os
import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from wayra.core.khipu_emit import IngestLog
from wayra.sources import (HFHubWatcher, GitHubReleases, ArxivFirehose,
                           DroneOSINT, StandardsWatcher)

# Load HF token (read-only Hub access).
tok_path = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token")
if tok_path.exists():
    os.environ.setdefault("HF_TOKEN", tok_path.read_text().strip())

DB = Path(__file__).resolve().parent / "data" / "wayra_ingest.db"
log = IngestLog(db_path=DB)

DAILY_CAP = 50  # HARD RULE: cost-bound the daily breath at 50 items before Yuyay drop.

runs = []
# 1) HF Hub Watcher — top orgs, a few each (LIVE).
print("[wayra] HF Hub Watcher ...", flush=True)
hf = HFHubWatcher(log=log, orgs=["Qwen", "deepseek-ai", "meta-llama", "mistralai",
                                 "google", "microsoft", "nvidia", "allenai",
                                 "01-ai", "stabilityai", "ibm-granite", "BAAI"],
                  per_org_limit=2)
runs.append(hf.run_once(log, max_items=DAILY_CAP))

# 2) GitHub Releases — leader repos (LIVE).
print("[wayra] GitHub Releases ...", flush=True)
gh = GitHubReleases(log=log, repos=[
    ("zarf-dev", "zarf"), ("defenseunicorns", "uds-core"), ("defenseunicorns", "pepr"),
    ("ArduPilot", "ardupilot"), ("PX4", "PX4-Autopilot"), ("sigstore", "cosign"),
    ("in-toto", "in-toto"), ("slsa-framework", "slsa"), ("vllm-project", "vllm"),
    ("ggml-org", "llama.cpp"),
], per_repo_limit=2)
runs.append(gh.run_once(log, max_items=DAILY_CAP))

# 3) arXiv firehose — formal methods + AI + robotics (LIVE).
print("[wayra] arXiv firehose ...", flush=True)
ar = ArxivFirehose(log=log, categories=["cs.AI", "cs.LO", "cs.CR", "cs.RO"],
                   per_cat_limit=6)
runs.append(ar.run_once(log, max_items=DAILY_CAP))

# 4) Standards watcher (LIVE — best-effort, some feeds may 404).
print("[wayra] Standards watcher ...", flush=True)
try:
    st = StandardsWatcher(log=log, per_feed_limit=3)
    runs.append(st.run_once(log, max_items=DAILY_CAP))
except Exception as e:
    print(f"  standards skipped: {e}")

# 5) Drone OSINT (LIVE — press RSS + USASpending; best-effort).
print("[wayra] Drone OSINT ...", flush=True)
try:
    do = DroneOSINT(log=log, per_feed_limit=2, award_limit=3)
    runs.append(do.run_once(log, max_items=DAILY_CAP))
except Exception as e:
    print(f"  drone_osint partial: {e}")

print("\n=== PER-SOURCE RUN SUMMARY ===")
for r in runs:
    print(f"  {r['source']:18} fetched={r['fetched']:3}  accept={r['accepted']:3} "
          f"review={r['review']:3}  drop={r['dropped']:3}  dup={r['duplicates']:3}")

print("\n=== INGEST LOG STATE ===")
print(f"  total events:    {log.count()}")
print(f"  receipt depth:   {log.receipt_depth()}")
chain = log.verify_chain()
print(f"  chain verified:  {chain['ok']}  (depth={chain['depth']})")
print("\n=== SOURCE STATS ===")
for s in log.source_stats():
    print(f"  {s['source']:16} total={s['total']:3} accept={s['accepted']} "
          f"review={s['review']} drop={s['dropped']} last={s['last_fetch']}")

print("\n=== TOP 5 BY WAYRA FACTOR (accepted) ===")
for t in log.top_n(5):
    print(f"  wf={t['wayra_factor']:.3f} y={t['yuyay_score']:.2f} n={t['novelty_score']:.2f} "
          f"[{t['source']}] {t['title'][:70]}")

log.close()
print("\n[wayra] live ingest complete.")
