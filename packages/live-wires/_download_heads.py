import os, traceback
from pathlib import Path
from huggingface_hub import HfApi, hf_hub_download

tok = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token").read_text().strip()
api = HfApi(token=tok)
base = "/home/user/workspace/szl_live_wires/heads"
flags = ["a11oy", "amaru", "sentra", "killinchu", "rosie"]

for s in flags:
    repo = f"SZLHOLDINGS/{s}"
    outdir = os.path.join(base, s)
    os.makedirs(outdir, exist_ok=True)
    try:
        files = api.list_repo_files(repo, repo_type="space")
        Path(os.path.join(outdir, "_filelist.txt")).write_text("\n".join(files))
        # download key files only to stay light
        want = [f for f in files if f in ("app.py", "Dockerfile", "requirements.txt", "README.md")]
        for w in want:
            try:
                p = hf_hub_download(repo, w, repo_type="space", local_dir=outdir, token=tok)
            except Exception as e:
                Path(os.path.join(outdir, w + ".ERR")).write_text(str(e)[:300])
        print(f"{s}: {len(files)} files; downloaded {want}")
    except Exception as e:
        print(f"{s}: ERROR {type(e).__name__}: {str(e)[:200]}")
        traceback.print_exc()
print("DONE")
