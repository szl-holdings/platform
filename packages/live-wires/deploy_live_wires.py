#!/usr/bin/env python3
"""Deploy Live 3D Wires into each flagship Space — HfApi.create_commit DIRECT (NO GitHub Actions).
ADDITIVE only: adds 3 files + one registration block. Idempotent. Signs as Yachay."""
from pathlib import Path
import ast, sys
from huggingface_hub import HfApi, hf_hub_download, CommitOperationAdd

TOK = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token").read_text().strip()
SRC = Path("/home/user/workspace/szl_live_wires")
api = HfApi(token=TOK)

BLOCK = '''
# ── Live 3D Wires (PURIQ / Doctrine v12) — ADDITIVE, ZERO BANDAID ────────────
# Bakes the "Live Wires" 3D panel into THIS flagship's cortex: /live-wires + the
# 3DWPP SSE stream + court-admissible BoE drill-down. Real in-process wire data
# (szl_wire / szl_jack); empty buffers render IDLE (never faked). Sigs honestly
# PLACEHOLDER until Sigstore CI wired. Sign: Yachay. Perplexity Computer Agent.
try:
    import szl_live_wires as _live_wires
    _live_wires.register({APP}, ns="{NS}")
    import sys as _sys_lw
    print("[{NS}] Live 3D Wires registered: /live-wires + /api/{NS}/v1/wires/{{stream,boe}}", file=_sys_lw.stderr)
except Exception as _lw_e:
    import sys as _sys_lw
    print(f"[{NS}] Live 3D Wires NOT registered: {{_lw_e}}", file=_sys_lw.stderr)
'''

# per-flagship: entry file, app handle var, anchor (insert AFTER this line's block)
PLAN = {
    "a11oy":     dict(entry="serve.py", app="app", anchor_re='app = FastAPI(', mode="after_appdef"),
    "amaru":     dict(entry="serve.py", app="app", anchor_re='if __name__ == "__main__":', mode="before"),
    "sentra":    dict(entry="serve.py", app="app", anchor_re='if __name__ == "__main__":', mode="before"),
    "killinchu": dict(entry="serve.py", app="app", anchor_re='if __name__ == "__main__":', mode="before"),
    "rosie":     dict(entry="app.py",   app="_rosie_api", anchor_re='# ── Deferred namespaced contract mounts', mode="before"),
}

ASSETS = ["szl_live_wires.py", "live_wires_3d.js", "live_wires.html"]
results = []

def patch(sp, cfg):
    rid = f"SZLHOLDINGS/{sp}"
    files = set(api.list_repo_files(rid, repo_type="space"))
    entry = cfg["entry"]
    local = hf_hub_download(rid, entry, repo_type="space", token=TOK,
                            local_dir=f"/tmp/dep/{sp}")
    code = Path(local).read_text(encoding="utf-8")
    ops = []
    # 1) add the 3 asset files (always overwrite assets — they ARE this agent's additive surface)
    for a in ASSETS:
        ops.append(CommitOperationAdd(path_in_repo=a, path_or_fileobj=str(SRC / a)))
    # 2) inject registration block (idempotent)
    if "import szl_live_wires as _live_wires" in code:
        patched = code  # already wired; just refresh assets
        injected = False
    else:
        block = BLOCK.format(APP=cfg["app"], NS=sp)
        lines = code.splitlines(keepends=True)
        idx = None
        for i, ln in enumerate(lines):
            if cfg["anchor_re"] in ln:
                idx = i; break
        if idx is None:
            return dict(space=sp, status="ANCHOR_NOT_FOUND", anchor=cfg["anchor_re"])
        if cfg["mode"] == "after_appdef":
            # insert right after the app = FastAPI(...) statement (handle multi-line)
            j = idx
            depth = lines[idx].count("(") - lines[idx].count(")")
            while depth > 0 and j + 1 < len(lines):
                j += 1; depth += lines[j].count("(") - lines[j].count(")")
            insert_at = j + 1
        else:  # before anchor
            insert_at = idx
        patched = "".join(lines[:insert_at]) + block + "".join(lines[insert_at:])
        injected = True
    # validate
    try:
        ast.parse(patched)
    except SyntaxError as e:
        return dict(space=sp, status="SYNTAX_ERROR", err=str(e))
    if injected:
        ops.append(CommitOperationAdd(path_in_repo=entry, path_or_fileobj=patched.encode()))
    info = api.create_commit(
        repo_id=rid, repo_type="space", operations=ops,
        commit_message=f"feat({sp}): bake Live 3D Wires into cortex — /live-wires + 3DWPP SSE + court-admissible BoE (ADDITIVE, Doctrine v11 LOCKED)\n\nSigned-off-by: Yachay\nCo-authored-by: Perplexity Computer Agent <agent@perplexity.ai>",
    )
    return dict(space=sp, status="OK", sha=info.oid, injected=injected, n_files=len(ops))

if __name__ == "__main__":
    only = sys.argv[1:] or list(PLAN)
    for sp in only:
        try:
            r = patch(sp, PLAN[sp])
        except Exception as e:
            r = dict(space=sp, status="ERROR", err=f"{type(e).__name__}: {e}")
        results.append(r)
        print(r)
    print("\\n=== SUMMARY ===")
    for r in results:
        print(f"{r['space']:10s} {r['status']:16s} {r.get('sha','')[:12]} inj={r.get('injected')}")
