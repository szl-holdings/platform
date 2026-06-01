from pathlib import Path
from huggingface_hub import HfApi

api = HfApi(token=Path(
    "/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token"
).read_text().strip())
who = api.whoami()
print("WHOAMI name:", who.get("name"))
orgs = [o.get("name") for o in who.get("orgs", [])]
print("ORGS:", orgs)
try:
    files = api.list_repo_files("SZLHOLDINGS/a11oy", repo_type="space")
    print("N_FILES:", len(files))
    for f in sorted(files):
        print(" ", f)
except Exception as e:
    print("LIST ERR:", repr(e))
