from pathlib import Path
from huggingface_hub import HfApi, CommitOperationAdd

TOK = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token").read_text().strip()
api = HfApi(token=TOK)
REPO = "SZLHOLDINGS/a11oy"
BASE = Path("/home/user/workspace/szl_ayni_os")

# Re-fetch serve.py/Dockerfile one more time to minimize clobber window, re-apply edits
import re
srv = (BASE / "a11oy_serve_fresh.py").read_text()
dock = (BASE / "Dockerfile.a11oy_fresh").read_text()
assert "from ayni_os_serve import router" in srv, "serve patch missing"
assert 'PAGES_DIR / "ayni.html"' in srv, "ayni route missing"
assert "COPY ayni_os_serve.py" in dock, "dockerfile patch missing"

ops = [
    CommitOperationAdd("serve.py", str(BASE / "a11oy_serve_fresh.py")),
    CommitOperationAdd("Dockerfile", str(BASE / "Dockerfile.a11oy_fresh")),
    CommitOperationAdd("ayni_os_serve.py", str(BASE / "ayni_os_serve.py")),
    CommitOperationAdd("pages/ayni.html", str(BASE / "ayni.html")),
]
for f in sorted((BASE / "ayni_os").glob("*.py")):
    ops.append(CommitOperationAdd(f"ayni_os/{f.name}", str(f)))

info = api.create_commit(
    repo_id=REPO, repo_type="space", operations=ops,
    commit_message="ADDITIVE re-apply: AYNI-OS router (/v1/ayni,/v1/replay,/v1/tinkuy) + /ayni tab re-wired into current serve.py + Dockerfile COPY. Event-sourcing replay (NOT time-travel); Ayni=Axelrod-Hamilton 1981; Tinkuy=Kuramoto 1975. yuyay_v3 hash untouched. Signed Yachay.",
)
print("COMMIT_OID:", getattr(info, "oid", info))
si = api.space_info(REPO)
print("SPACE sha:", si.sha, "stage:", si.runtime.stage)
