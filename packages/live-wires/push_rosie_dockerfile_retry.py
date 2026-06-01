from pathlib import Path
from huggingface_hub import HfApi, CommitOperationAdd, hf_hub_download

TOK = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token").read_text().strip()
api = HfApi(token=TOK)
repo = "SZLHOLDINGS/rosie"
d = "/home/user/workspace/szl_live_wires/push/rosie_dockerfile_retry"
local = hf_hub_download(repo, "Dockerfile", repo_type="space", token=TOK, local_dir=d)
text = Path(local).read_text()
orig = text

COPY_BLOCK = (
    "# ADDITIVE (Live 3D Wires / PURIQ Doctrine v12, Yachay): explicit per-file COPY.\n"
    "# rosie Dockerfile never uses `COPY . .`; without these the `import szl_live_wires`\n"
    "# in app.py raises ModuleNotFoundError and /live-wires 404s under the Gradio mount.\n"
    "COPY --chown=user szl_live_wires.py live_wires.html live_wires_3d.js ./\n"
)

if "szl_live_wires.py" in text:
    print("rosie Dockerfile ALREADY has live-wires COPY; NOCHANGE")
else:
    cmd = 'CMD ["python", "app.py"]'
    if cmd in text:
        text = text.replace(cmd, COPY_BLOCK + cmd, 1)
    else:
        text = text.rstrip() + "\n" + COPY_BLOCK

if text != orig:
    info = api.create_commit(repo_id=repo, repo_type="space",
        operations=[CommitOperationAdd("Dockerfile", text.encode())],
        commit_message="ADDITIVE (re-apply): COPY szl_live_wires.py + live_wires.html + live_wires_3d.js into rosie image\n\nFixes ModuleNotFoundError: No module named 'szl_live_wires' (per-file COPY Dockerfile).\nPairs with app.py registration on _rosie_api.\n\nSigned: Yachay\nPerplexity Computer Agent")
    print("rosie Dockerfile PUSHED oid=", info.oid[:10])
else:
    print("rosie Dockerfile NOCHANGE")
