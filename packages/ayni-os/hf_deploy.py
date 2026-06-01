from pathlib import Path
from huggingface_hub import HfApi, CommitOperationAdd

TOK = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token").read_text().strip()
api = HfApi(token=TOK)
REPO = "SZLHOLDINGS/a11oy"
BASE = Path("/home/user/workspace/szl_ayni_os")

who = api.whoami()
assert "SZLHOLDINGS" in [o.get("name") for o in who.get("orgs", [])], "SZLHOLDINGS not in orgs"
print("WHOAMI ok:", who.get("name"), "-> SZLHOLDINGS write")

ops = [
    CommitOperationAdd("serve.py", str(BASE / "a11oy_serve.py")),
    CommitOperationAdd("Dockerfile", str(BASE / "Dockerfile.a11oy")),
    CommitOperationAdd("ayni_os_serve.py", str(BASE / "ayni_os_serve.py")),
    CommitOperationAdd("pages/ayni.html", str(BASE / "ayni.html")),
]
for f in sorted((BASE / "ayni_os").glob("*.py")):
    ops.append(CommitOperationAdd(f"ayni_os/{f.name}", str(f)))

info = api.create_commit(
    repo_id=REPO, repo_type="space", operations=ops,
    commit_message="ADDITIVE: AYNI-OS reciprocity organism + event-sourced replay + Tinkuy (Kuramoto) flow; /v1/ayni,/v1/replay,/v1/tinkuy + /ayni tab. yuyay_v3 hash untouched. Signed Yachay.",
)
print("COMMIT_OID:", getattr(info, "oid", info))

# verify
files = set(api.list_repo_files(REPO, repo_type="space"))
for f in ["ayni_os_serve.py", "pages/ayni.html", "ayni_os/replay_api.py",
          "ayni_os/ledger.py", "ayni_os/tinkuy.py"]:
    print("PRESENT" if f in files else "MISSING", f)
si = api.space_info(REPO)
print("SPACE sha:", si.sha)
print("SPACE runtime:", getattr(si, "runtime", None))
