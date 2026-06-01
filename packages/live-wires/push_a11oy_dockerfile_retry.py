from pathlib import Path
from huggingface_hub import HfApi, CommitOperationAdd, hf_hub_download

TOK = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token").read_text().strip()
api = HfApi(token=TOK)
repo = "SZLHOLDINGS/a11oy"
d = "/home/user/workspace/szl_live_wires/push/a11oy_dockerfile_retry"
local = hf_hub_download(repo, "Dockerfile", repo_type="space", token=TOK, local_dir=d)
text = Path(local).read_text()
orig = text

COPY_BLOCK = (
    "# ADDITIVE (Live 3D Wires / PURIQ Doctrine v12, Yachay): explicit per-file COPY.\n"
    "# This Dockerfile uses per-file COPY (no `COPY . .`), so the live-wires module +\n"
    "# its static assets must be copied explicitly or `import szl_live_wires` 404s and\n"
    "# /live-wires falls through to the SPA shell. serve.py registers these FIRST.\n"
    "COPY szl_live_wires.py ./szl_live_wires.py\n"
    "COPY live_wires.html ./live_wires.html\n"
    "COPY live_wires_3d.js ./live_wires_3d.js\n"
)

if "COPY szl_live_wires.py" in text:
    print("a11oy Dockerfile ALREADY has live-wires COPY; NOCHANGE")
else:
    # Insert right before the ENV PORT / EXPOSE / CMD tail.
    anchor = "ENV PORT=7860"
    if anchor in text:
        text = text.replace(anchor, COPY_BLOCK + "\n" + anchor, 1)
    else:
        # fallback: append before CMD
        cmd = 'CMD ["python", "serve.py"]'
        text = text.replace(cmd, COPY_BLOCK + "\n" + cmd, 1)

if text != orig:
    info = api.create_commit(repo_id=repo, repo_type="space",
        operations=[CommitOperationAdd("Dockerfile", text.encode())],
        commit_message="ADDITIVE (re-apply): COPY szl_live_wires.py + live_wires.html + live_wires_3d.js into a11oy image\n\nFixes ModuleNotFoundError: No module named 'szl_live_wires' that made /live-wires fall to SPA shell.\nWas reverted by concurrent commit. Per-file COPY Dockerfile (no COPY . .).\n\nSigned: Yachay\nPerplexity Computer Agent")
    print("a11oy Dockerfile PUSHED oid=", info.oid[:10])
else:
    print("a11oy Dockerfile NOCHANGE")
