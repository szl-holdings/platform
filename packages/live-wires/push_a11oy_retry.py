from pathlib import Path
from huggingface_hub import HfApi, CommitOperationAdd, hf_hub_download

TOK = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token").read_text().strip()
api = HfApi(token=TOK)
repo = "SZLHOLDINGS/a11oy"
d = "/home/user/workspace/szl_live_wires/push/a11oy_retry"
local = hf_hub_download(repo, "Dockerfile", repo_type="space", token=TOK, local_dir=d)
text = Path(local).read_text()
orig = text
repo_files = set(api.list_repo_files(repo, repo_type="space"))
CORE = ["szl_live_wires.py", "live_wires.html", "live_wires_3d.js", "szl_wire.py", "szl_jack.py", "szl_khipu.py"]
to_add = [f for f in CORE if f in repo_files and not any(l.strip().startswith("COPY") and f in l for l in text.splitlines())]
print("to_add:", to_add)
if to_add:
    block = ("\n# ADDITIVE (Yachay / Live 3D Wires PURIQ v12): COPY live-wires module+page+core\n"
             "# so `import szl_live_wires` resolves; otherwise /live-wires falls through to SPA.\n"
             "# ADDITIVE ONLY. Sign: Yachay.\n")
    block += "".join(f"COPY {f} ./{f}\n" for f in to_add) + "\n"
    if "ENV PORT=7860" in text:
        text = text.replace("ENV PORT=7860", block + "ENV PORT=7860", 1)
    else:
        idx = text.rfind("CMD"); text = text[:idx] + block + text[idx:]
if text != orig:
    info = api.create_commit(repo_id=repo, repo_type="space",
        operations=[CommitOperationAdd("Dockerfile", text.encode())],
        commit_message="ADDITIVE (re-apply): COPY live-wires files into a11oy image so /live-wires serves real 3D (was reverted by concurrent commit)\n\nSigned: Yachay\nPerplexity Computer Agent")
    print("A11OY PUSHED oid=", info.oid[:10])
else:
    print("A11OY NOCHANGE")
