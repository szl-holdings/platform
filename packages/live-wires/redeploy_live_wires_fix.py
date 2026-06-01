#!/usr/bin/env python3
"""Phase-3 FIX redeploy: re-inject the Live-Wires register() block at the EARLIEST
safe point (immediately after the root app is constructed) so it takes precedence
over every pre-existing SPA/proxy catch-all. FastAPI matches routes in registration
order, so our additive routes MUST be registered before any /{path:path} catch-all.

Root-cause of the first deploy:
  - amaru/sentra : register() ran AFTER the /{path:path} catch-all → shadowed.
  - killinchu    : block absent from deployed file (anchor drift / overwrite).
  - rosie        : registered then sub-app mounted at /api/rosie shadowed the routes;
                   /live-wires lost behind Gradio root mount.
  - a11oy        : block present but its /api/a11oy Node-proxy catch-all + ordering
                   left the routes unreachable → re-pin at top.

This is ADDITIVE + idempotent: it strips any prior Live-Wires block, then inserts a
single fresh block right after the app constructor. HfApi DIRECT push (NO GitHub
Actions). Signs as Yachay; Perplexity Computer Agent in trailers.
"""
from pathlib import Path
import ast, sys, re
from huggingface_hub import HfApi, hf_hub_download, CommitOperationAdd

TOK = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token").read_text().strip()
SRC = Path("/home/user/workspace/szl_live_wires")
api = HfApi(token=TOK)

BLOCK_TMPL = '''
# ── Live 3D Wires (PURIQ / Doctrine v12) — ADDITIVE, re-pinned FIRST ─────────
# Registered immediately after the app is constructed so FastAPI's ordered route
# matching gives /live-wires + the 3DWPP SSE stream + court-admissible BoE
# precedence over every pre-existing SPA/proxy catch-all. Real in-process wire
# data (szl_wire / szl_jack); empty buffers render IDLE (never faked). Sigs are
# honestly PLACEHOLDER until Sigstore CI is wired. Sign: Yachay. Perplexity Computer Agent.
try:
    import szl_live_wires as _live_wires
    _live_wires.register({APP}, ns="{NS}")
    import sys as _sys_lw
    print("[{NS}] Live 3D Wires registered FIRST: /live-wires + /api/{NS}/v1/wires/{{stream,boe,inject}}", file=_sys_lw.stderr)
except Exception as _lw_e:
    import sys as _sys_lw, traceback as _tb_lw
    print(f"[{NS}] Live 3D Wires NOT registered: {{_lw_e}}", file=_sys_lw.stderr)
    _tb_lw.print_exc()
# ── end Live 3D Wires ────────────────────────────────────────────────────────
'''

# entry file, app handle, regex that matches the FULL app-constructor statement.
PLAN = {
    "a11oy":     dict(entry="serve.py", app="app",        appdef=r'app\s*=\s*FastAPI\('),
    "amaru":     dict(entry="serve.py", app="app",        appdef=r'app\s*=\s*FastAPI\('),
    "sentra":    dict(entry="serve.py", app="app",        appdef=r'app\s*=\s*FastAPI\('),
    "killinchu": dict(entry="serve.py", app="app",        appdef=r'app\s*=\s*FastAPI\('),
    "rosie":     dict(entry="app.py",   app="_rosie_api", appdef=r'_rosie_api\s*=\s*_r2\.build_rosie_api\('),
}
ASSETS = ["szl_live_wires.py", "live_wires_3d.js", "live_wires.html"]

# strip any previously-injected Live-Wires block (between our markers, or the older
# variant) so re-injection is clean and idempotent.
STRIP_RE = re.compile(
    r"\n# ── Live 3D Wires \(PURIQ.*?(?:# ── end Live 3D Wires ─+\n|"
    r'print\(f?"\[\w+\] Live 3D Wires NOT registered.*?\n)',
    re.DOTALL)


def _strip_old(code: str) -> str:
    out = STRIP_RE.sub("\n", code)
    return out


def _find_appdef_end(lines, appdef_re):
    pat = re.compile(appdef_re)
    for i, ln in enumerate(lines):
        if pat.search(ln):
            # walk to balanced parens
            depth = ln.count("(") - ln.count(")")
            j = i
            while depth > 0 and j + 1 < len(lines):
                j += 1
                depth += lines[j].count("(") - lines[j].count(")")
            return j + 1
    return None


def patch(sp, cfg):
    rid = f"SZLHOLDINGS/{sp}"
    entry = cfg["entry"]
    local = hf_hub_download(rid, entry, repo_type="space", token=TOK, local_dir=f"/tmp/fixdep/{sp}")
    code = Path(local).read_text(encoding="utf-8")
    code2 = _strip_old(code)
    stripped = (code2 != code)
    lines = code2.splitlines(keepends=True)
    insert_at = _find_appdef_end(lines, cfg["appdef"])
    if insert_at is None:
        return dict(space=sp, status="APPDEF_NOT_FOUND")
    block = BLOCK_TMPL.format(APP=cfg["app"], NS=sp)
    patched = "".join(lines[:insert_at]) + block + "".join(lines[insert_at:])
    try:
        ast.parse(patched)
    except SyntaxError as e:
        return dict(space=sp, status="SYNTAX_ERROR", err=str(e))
    ops = [CommitOperationAdd(path_in_repo=a, path_or_fileobj=str(SRC / a)) for a in ASSETS]
    ops.append(CommitOperationAdd(path_in_repo=entry, path_or_fileobj=patched.encode()))
    info = api.create_commit(
        repo_id=rid, repo_type="space", operations=ops,
        commit_message=(f"fix({sp}): re-pin Live 3D Wires register() FIRST so /live-wires + 3DWPP SSE + "
                        f"court-admissible BoE win route precedence over SPA/proxy catch-all "
                        f"(ADDITIVE, Doctrine v11 LOCKED)\n\nSigned-off-by: Yachay\n"
                        f"Co-authored-by: Perplexity Computer Agent <agent@perplexity.ai>"))
    return dict(space=sp, status="OK", sha=info.oid, stripped_old=stripped, insert_line=insert_at, n_files=len(ops))


if __name__ == "__main__":
    only = sys.argv[1:] or list(PLAN)
    results = []
    for sp in only:
        try:
            r = patch(sp, PLAN[sp])
        except Exception as e:
            r = dict(space=sp, status="ERROR", err=f"{type(e).__name__}: {e}")
        results.append(r)
        print(r)
    print("\n=== SUMMARY ===")
    for r in results:
        print(f"{r['space']:10s} {r['status']:14s} {str(r.get('sha',''))[:12]} "
              f"stripped={r.get('stripped_old')} line={r.get('insert_line')}")
