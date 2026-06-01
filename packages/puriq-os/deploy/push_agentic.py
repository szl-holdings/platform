# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · Perplexity Computer Agent
"""
push_agentic.py — instill the PURIQ-OS /agentic layer into each flagship Space via
HfApi DIRECT (NEVER GitHub Actions). Truly ADDITIVE:
  1. upload szl_agentic.py (self-contained router)
  2. upload static agentic/index.html fallback
  3. patch the entrypoint (serve.py / app.py) to call szl_agentic.register(...) ONCE,
     guarded so re-runs are idempotent and existing routes are preserved.

Run:  python push_agentic.py            # push all 5 flagships
      python push_agentic.py sentra     # push one
Emits a per-flagship commit SHA log to stdout (captured into HF_PUSH_LOG.md).
"""
from __future__ import annotations

import sys
from pathlib import Path

from huggingface_hub import HfApi, CommitOperationAdd, hf_hub_download

ROOT = Path("/home/user/workspace")
SECRET = ROOT / "szl/audit_2026-05-30_cursor_offline/.secret/hf_token"
DEPLOY = ROOT / "szl_puriq_os/deploy"
TOKEN = SECRET.read_text().strip()
API = HfApi(token=TOKEN)
ORG = "SZLHOLDINGS"
COMMIT_TRAILER = "\n\nCo-authored-by: Perplexity Computer Agent <agent@perplexity.ai>"

# entrypoint per flagship: FastAPI serve.py, except rosie (Gradio app.py)
FLAGSHIPS = {
    "amaru": "serve.py", "a11oy": "serve.py", "sentra": "serve.py",
    "killinchu": "serve.py", "rosie": "app.py",
}

WIRE_MARKER = "# --- PURIQ-OS agentic layer (Doctrine v14, additive) ---"

WIRE_FASTAPI = '''
# --- PURIQ-OS agentic layer (Doctrine v14, additive) ---
try:
    import szl_agentic as _agentic
    _agentic.register(app, "{ns}")
    print("[{ns}] PURIQ-OS /agentic registered (16 organs looping)", file=sys.stderr)
except Exception as _e:
    print(f"[{ns}] PURIQ-OS /agentic not registered: {{_e}}", file=sys.stderr)
# --- end PURIQ-OS agentic layer ---
'''

WIRE_GRADIO = '''
# --- PURIQ-OS agentic layer (Doctrine v14, additive) ---
try:
    import szl_agentic as _agentic
    # mount the agentic router onto Gradio's underlying FastAPI app
    _target = getattr(demo, "app", None) or app
    _agentic.register(_target, "{ns}")
    print("[{ns}] PURIQ-OS /agentic registered (16 organs looping)", file=sys.stderr)
except Exception as _e:
    print(f"[{ns}] PURIQ-OS /agentic not registered: {{_e}}", file=sys.stderr)
# --- end PURIQ-OS agentic layer ---
'''


def _ensure_sys_import(src: str) -> str:
    if "import sys" not in src:
        return "import sys\n" + src
    return src


def patch_entrypoint(ns: str, entry: str) -> tuple[str, bool]:
    """Download the entrypoint, append the additive register() wiring if absent."""
    local = hf_hub_download(repo_id=f"{ORG}/{ns}", repo_type="space",
                            filename=entry, token=TOKEN)
    src = Path(local).read_text()
    if WIRE_MARKER in src:
        return (src, False)  # already wired, idempotent
    src = _ensure_sys_import(src)
    wire = (WIRE_GRADIO if entry == "app.py" else WIRE_FASTAPI).format(ns=ns)
    return (src + "\n" + wire, True)


def push_one(ns: str) -> dict:
    entry = FLAGSHIPS[ns]
    router = (DEPLOY / "szl_agentic.py").read_text()
    html = (DEPLOY / "agentic_index.html").read_text()
    new_entry, changed = patch_entrypoint(ns, entry)

    ops = [
        CommitOperationAdd("szl_agentic.py", router.encode()),
        CommitOperationAdd("agentic/index.html", html.encode()),
    ]
    if changed:
        ops.append(CommitOperationAdd(entry, new_entry.encode()))

    info = API.create_commit(
        repo_id=f"{ORG}/{ns}", repo_type="space", operations=ops,
        commit_message=f"feat(puriq-os): instill /agentic loop layer (Doctrine v14, additive)"
                       + COMMIT_TRAILER,
    )
    sha = getattr(info, "oid", None) or str(info)
    return {"ns": ns, "entry": entry, "entry_patched": changed,
            "files": [o.path_in_repo for o in ops], "commit_sha": sha}


def main(argv):
    targets = argv[1:] if len(argv) > 1 else list(FLAGSHIPS)
    results = []
    for ns in targets:
        try:
            r = push_one(ns)
            print(f"PUSHED {ns}: sha={r['commit_sha']} files={r['files']} patched={r['entry_patched']}")
            results.append(r)
        except Exception as e:
            print(f"FAILED {ns}: {e!r}")
            results.append({"ns": ns, "error": repr(e)})
    return results


if __name__ == "__main__":
    main(sys.argv)
