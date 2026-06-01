from pathlib import Path
from huggingface_hub import HfApi, CommitOperationAdd, hf_hub_download

TOK = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token").read_text().strip()
api = HfApi(token=TOK)
repo = "SZLHOLDINGS/rosie"
d = "/home/user/workspace/szl_live_wires/push/rosie_app_retry"
local = hf_hub_download(repo, "app.py", repo_type="space", token=TOK, local_dir=d)
text = Path(local).read_text()
orig = text

anchor = "# \u2500\u2500 Deferred namespaced contract mounts (Doctrine v11 mount-order fix) \u2500\u2500\u2500\u2500\u2500\u2500\u2500"
lw_block = (
    "# \u2500\u2500 Live 3D Wires (PURIQ / Doctrine v12) \u2014 ADDITIVE on ROOT app before mounts.\n"
    "# Sign: Yachay. Perplexity Computer Agent.\n"
    "try:\n"
    "    import szl_live_wires as _live_wires\n"
    "    _live_wires.register(_rosie_api, ns=\"rosie\")\n"
    "    import sys as _syslw\n"
    "    print(\"[rosie] Live 3D Wires registered: /live-wires + /api/rosie/v1/wires/{stream,boe,inject}\", file=_syslw.stderr)\n"
    "except Exception as _lwe:\n"
    "    import sys as _syslw\n"
    "    print(f\"[rosie] Live 3D Wires NOT registered: {_lwe}\", file=_syslw.stderr)\n\n"
)
if "_live_wires.register(_rosie_api" in text:
    print("ROSIE app.py already has live-wires registration; NOCHANGE")
elif anchor in text:
    text = text.replace(anchor, lw_block + anchor, 1)
else:
    # fallback: insert right before the gradio mount line
    gl = 'app = gr.mount_gradio_app(_rosie_api, demo, path="/")'
    if gl in text:
        text = text.replace(gl, lw_block + gl, 1)

if text != orig:
    info = api.create_commit(repo_id=repo, repo_type="space",
        operations=[CommitOperationAdd("app.py", text.encode())],
        commit_message="ADDITIVE (re-apply): register Live 3D Wires on rosie _rosie_api before mounts (was reverted by concurrent commit)\n\nSigned: Yachay\nPerplexity Computer Agent")
    print("ROSIE app.py PUSHED oid=", info.oid[:10])
else:
    print("ROSIE app.py NOCHANGE (no edit applied)")
