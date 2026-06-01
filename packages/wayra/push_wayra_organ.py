#!/usr/bin/env python3
"""
Push the WAYRA organ surfaces to the a11oy Space.
HfApi.create_commit DIRECT — NEVER GitHub Actions.

Organ: WAYRA (4th organ, additive) · Author: Yachay · Zero Bandaid
Pushes: serve.py (router wired), wayra_serve.py (FastAPI router + HTML),
        wayra_snapshot.json (real Khipu-verified data), and the React surfaces
        (src/pages/Wayra.tsx + src/App.tsx route).
"""
import sys
from pathlib import Path

TOKEN_PATH = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token")
HF_TOKEN = TOKEN_PATH.read_text().strip()

from huggingface_hub import HfApi, CommitOperationAdd

api = HfApi(token=HF_TOKEN)

A11OY = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/round2/a11oy_replit_coder")

files = [
    (A11OY / "wayra_serve.py",            "wayra_serve.py"),
    (A11OY / "wayra_snapshot.json",       "wayra_snapshot.json"),
    (A11OY / "serve.py",                  "serve.py"),
    (A11OY / "build/src/pages/Wayra.tsx", "src/pages/Wayra.tsx"),
    (A11OY / "build/src/App.tsx",         "src/App.tsx"),
]

print("=== Pushing WAYRA organ to SZLHOLDINGS/a11oy ===")
ops = []
for local, repo in files:
    if not local.exists():
        print(f"  MISSING: {local}")
        sys.exit(1)
    print(f"  + {repo} ({local.stat().st_size} bytes)")
    ops.append(CommitOperationAdd(path_in_repo=repo, path_or_fileobj=str(local)))

commit = api.create_commit(
    repo_id="SZLHOLDINGS/a11oy",
    repo_type="space",
    operations=ops,
    commit_message=(
        "feat: WAYRA organ — always-learning firehose (4th organ, ADDITIVE)\n\n"
        "WAYRA (Quechua 'wind/breath/air'; Wiktionary) — the empire's lungs.\n"
        "- Add /wayra route (wayra_serve.py): live HTML tab, server-rendered, 200 OK\n"
        "- Add GET /api/a11oy/v1/wayra/{summary,feed,search,sources,digest}\n"
        "- Add POST /api/a11oy/v1/wayra/take-it (draft PR/Doctrine stub; no auto-merge)\n"
        "- Add src/pages/Wayra.tsx + /wayra route in App.tsx (mirrors Evidence pattern)\n"
        "- Ship wayra_snapshot.json: 86 Khipu-receipted IngestEvents, chain verified\n"
        "  5 live streams (arxiv/hf_hub/github_releases/drone_osint/standards)\n"
        "- Yuyay-13 gate: 47 accept / 33 review / 6 drop; daily digest cap=50\n"
        "- RECEIVE-ONLY from public sources (APIs/RSS/robots-respecting)\n"
        "- ADDITIVE: all existing routes preserved; router mount is fail-safe\n"
        "- Doctrine v13 LOCKED numbers untouched (749/14/163)\n"
        "- HF auth via HfApi.create_commit DIRECT — never GitHub Actions\n"
        "- Author: Yachay"
    ),
)
sha = commit.oid
print(f"\nWAYRA commit SHA: {sha}")
print(f"WAYRA commit URL: {commit.commit_url}")

sha_out = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/round2/full_reaudit_2026-05-31/wayra/WAYRA_SHIP_SHAS.txt")
sha_out.write_text(
    f"a11oy_wayra_sha={sha}\n"
    f"a11oy_wayra_url={commit.commit_url}\n"
    f"repo=SZLHOLDINGS/a11oy (space)\n"
    f"files={[r for _, r in files]}\n"
)
print(f"\nSHA written to {sha_out}")
print("=== DONE ===")
