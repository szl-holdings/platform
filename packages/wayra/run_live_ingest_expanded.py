#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
"""Expanded live WAYRA ingest — broader real public-source coverage to grow the
Khipu IngestLog past the 86 baseline. Same legal sources (HF Hub client, GitHub
releases.atom, arXiv RSS, standards feeds). Read-only. Author: Yachay. Zero Bandaid.
Dedup-by-content-hash/title remains enforced (no fabricated events)."""
import os, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from wayra.core.khipu_emit import IngestLog
from wayra.sources import (HFHubWatcher, GitHubReleases, ArxivFirehose,
                           DroneOSINT, StandardsWatcher)

tok_path = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token")
if tok_path.exists():
    os.environ.setdefault("HF_TOKEN", tok_path.read_text().strip())

DB = Path(__file__).resolve().parent / "data" / "wayra_ingest.db"
log = IngestLog(db_path=DB)
before = log.count()
print(f"[wayra] baseline events BEFORE expanded ingest: {before}", flush=True)

DAILY_CAP = 50
runs = []

# 1) HF Hub — broader org set + more per org (genuinely new repos).
print("[wayra] HF Hub Watcher (expanded) ...", flush=True)
hf = HFHubWatcher(log=log, orgs=[
    "Qwen", "deepseek-ai", "meta-llama", "mistralai", "google", "microsoft",
    "nvidia", "allenai", "01-ai", "stabilityai", "ibm-granite", "BAAI",
    "HuggingFaceH4", "tiiuae", "CohereForAI", "bigcode", "EleutherAI",
    "openai-community", "facebook", "Salesforce", "togethercomputer", "databricks",
], per_org_limit=4)
runs.append(hf.run_once(log, max_items=DAILY_CAP))

# 2) GitHub Releases — broader leader-repo set.
print("[wayra] GitHub Releases (expanded) ...", flush=True)
gh = GitHubReleases(log=log, repos=[
    ("zarf-dev", "zarf"), ("defenseunicorns", "uds-core"), ("defenseunicorns", "pepr"),
    ("ArduPilot", "ardupilot"), ("PX4", "PX4-Autopilot"), ("sigstore", "cosign"),
    ("in-toto", "in-toto"), ("slsa-framework", "slsa"), ("vllm-project", "vllm"),
    ("ggml-org", "llama.cpp"), ("kubernetes", "kubernetes"), ("etcd-io", "etcd"),
    ("containerd", "containerd"), ("opentofu", "opentofu"), ("open-telemetry", "opentelemetry-collector"),
    ("huggingface", "transformers"), ("pytorch", "pytorch"), ("ollama", "ollama"),
    ("ggml-org", "whisper.cpp"), ("apache", "arrow"),
], per_repo_limit=3)
runs.append(gh.run_once(log, max_items=DAILY_CAP))

# 3) arXiv firehose — more categories + more per category.
print("[wayra] arXiv firehose (expanded) ...", flush=True)
ar = ArxivFirehose(log=log, categories=[
    "cs.AI", "cs.LO", "cs.CR", "cs.RO", "cs.LG", "cs.PL", "cs.DC", "cs.SE", "math.LO",
], per_cat_limit=8)
runs.append(ar.run_once(log, max_items=DAILY_CAP))

# 4) Standards watcher.
print("[wayra] Standards watcher ...", flush=True)
try:
    st = StandardsWatcher(log=log, per_feed_limit=6)
    runs.append(st.run_once(log, max_items=DAILY_CAP))
except Exception as e:
    print(f"  standards skipped: {e}")

# 5) Drone OSINT.
print("[wayra] Drone OSINT ...", flush=True)
try:
    do = DroneOSINT(log=log, per_feed_limit=4, award_limit=5)
    runs.append(do.run_once(log, max_items=DAILY_CAP))
except Exception as e:
    print(f"  drone_osint partial: {e}")

print("\n=== PER-SOURCE RUN SUMMARY ===")
for r in runs:
    print(f"  {r['source']:18} fetched={r['fetched']:3}  accept={r['accepted']:3} "
          f"review={r['review']:3}  drop={r['dropped']:3}  dup={r['duplicates']:3}")

after = log.count()
chain = log.verify_chain()
print(f"\n=== INGEST LOG STATE ===")
print(f"  events BEFORE: {before}")
print(f"  events AFTER:  {after}   (+{after-before})")
print(f"  receipt depth: {log.receipt_depth()}")
print(f"  chain verified:{chain['ok']} (depth={chain['depth']})")

# Print the NEWLY added event IDs/hashes for evidence.
print("\n=== NEW INGEST EVENTS (most recent, up to 20) ===")
for ev in log.recent(n=(after-before) if after>before else 20):
    print(f"  IngestEvent id(content_hash)={str(ev.get('content_hash',''))[:24]} "
          f"[{ev.get('decision','?'):7}] {ev.get('source','?'):14} "
          f"{str(ev.get('title',''))[:58]}")
