#!/usr/bin/env python3
# rosie is in RUNTIME_ERROR (concurrent agent added a szl_provenance import block
# whose module was never COPY'd, and whose except-handler references `sys` which
# isn't imported in that scope -> NameError crashes import). rosie also never
# registers szl_live_wires. ALL FIXES ADDITIVE:
#   (1) Dockerfile: COPY szl_provenance.py + szl_live_wires.py/html/js
#   (2) app.py: make the provenance except-block self-import sys (defensive)
#   (3) app.py: register szl_live_wires on _rosie_api BEFORE the deferred mounts
# Sign: Yachay.  git trailer: Perplexity Computer Agent.
from pathlib import Path
from huggingface_hub import HfApi, CommitOperationAdd, hf_hub_download

TOK = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token").read_text().strip()
api = HfApi(token=TOK)
repo = "SZLHOLDINGS/rosie"
d = "/home/user/workspace/szl_live_wires/push/rosie"

app_local = hf_hub_download(repo, "app.py", repo_type="space", token=TOK, local_dir=d)
dock_local = hf_hub_download(repo, "Dockerfile", repo_type="space", token=TOK, local_dir=d)
app_txt = Path(app_local).read_text()
dock_txt = Path(dock_local).read_text()
orig_app, orig_dock = app_txt, dock_txt
ops = []

# (2) fix the broken provenance except block (sys NameError + f-string double-brace).
broken_ok = 'print(f"[rosie] szl_provenance registered (Wire D LIVE, SLSA L2): {{_prov_status}}", file=sys.stderr)'
fixed_ok  = 'import sys as _sysp; print(f"[rosie] szl_provenance registered (Wire D LIVE, SLSA L2): {_prov_status}", file=_sysp.stderr)'
if broken_ok in app_txt:
    app_txt = app_txt.replace(broken_ok, fixed_ok, 1)
broken_err = 'print(f"[rosie] szl_provenance NOT registered ({{_pe!r}}); existing app unaffected", file=sys.stderr)'
fixed_err  = 'import sys as _sysp; print(f"[rosie] szl_provenance NOT registered ({_pe!r}); existing app unaffected", file=_sysp.stderr)'
if broken_err in app_txt:
    app_txt = app_txt.replace(broken_err, fixed_err, 1)

# (3) register live-wires on _rosie_api before the deferred namespaced mounts.
anchor = "# \u2500\u2500 Deferred namespaced contract mounts (Doctrine v11 mount-order fix) \u2500\u2500\u2500\u2500\u2500\u2500\u2500"
lw_block = (
    "# \u2500\u2500 Live 3D Wires (PURIQ / Doctrine v12) \u2014 ADDITIVE, registered on the ROOT\n"
    "# FastAPI app BEFORE the deferred /api/* prefix mounts + Gradio catch-all so the\n"
    "# explicit /live-wires + /api/rosie/v1/wires/{stream,boe,inject} routes win.\n"
    "# Real in-process wire data (szl_wire/szl_jack); empty buffers render IDLE\n"
    "# (never faked). Signatures honestly PLACEHOLDER until Sigstore CI wired.\n"
    "# Sign: Yachay.  Perplexity Computer Agent.\n"
    "try:\n"
    "    import szl_live_wires as _live_wires\n"
    "    _live_wires.register(_rosie_api, ns=\"rosie\")\n"
    "    import sys as _syslw\n"
    "    print(\"[rosie] Live 3D Wires registered: /live-wires + /api/rosie/v1/wires/{stream,boe,inject}\", file=_syslw.stderr)\n"
    "except Exception as _lwe:\n"
    "    import sys as _syslw\n"
    "    print(f\"[rosie] Live 3D Wires NOT registered: {_lwe}\", file=_syslw.stderr)\n\n"
)
if "_live_wires.register(_rosie_api" not in app_txt and anchor in app_txt:
    app_txt = app_txt.replace(anchor, lw_block + anchor, 1)

if app_txt != orig_app:
    ops.append(CommitOperationAdd("app.py", app_txt.encode()))

# (1) Dockerfile COPYs. rosie style: COPY --chown=user <files> ./
need = []
for f in ["szl_provenance.py", "szl_live_wires.py", "live_wires.html", "live_wires_3d.js"]:
    already = any(line.strip().startswith("COPY") and f in line for line in dock_txt.splitlines())
    if not already:
        need.append(f)
if need:
    block = ("\n# ADDITIVE (Yachay): COPY provenance + live-wires files so imports resolve\n"
             "# in-container (fixes szl_provenance ModuleNotFoundError RUNTIME_ERROR and\n"
             "# enables /live-wires real 3D). ADDITIVE ONLY. Sign: Yachay.\n")
    block += "".join(f"COPY --chown=user {f} ./\n" for f in need)
    if 'CMD ["python", "app.py"]' in dock_txt:
        dock_txt = dock_txt.replace('CMD ["python", "app.py"]', block + '\nCMD ["python", "app.py"]', 1)
    else:
        dock_txt = dock_txt.rstrip() + "\n" + block
if dock_txt != orig_dock:
    ops.append(CommitOperationAdd("Dockerfile", dock_txt.encode()))

print("app.py changed:", app_txt != orig_app, "| Dockerfile changed:", dock_txt != orig_dock, "| dock COPYs added:", need)
if ops:
    info = api.create_commit(
        repo_id=repo, repo_type="space", operations=ops,
        commit_message="ADDITIVE: fix rosie RUNTIME_ERROR (szl_provenance COPY + sys-guard) and register Live 3D Wires\n\nSigned: Yachay\nPerplexity Computer Agent",
    )
    print("ROSIE PUSHED oid=", info.oid[:10])
else:
    print("ROSIE NOCHANGE")
