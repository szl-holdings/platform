#!/usr/bin/env python3
# Additive fix: each flagship Dockerfile omits COPY of the live-wires files,
# so `import szl_live_wires` throws in-container and /live-wires falls through
# to the SPA (the "ugly 2D" the founder sees). We add the missing COPY lines
# ONLY (idempotent), then commit via founder HfApi. ADDITIVE — no other change.
# Sign: Yachay.  git trailer: Perplexity Computer Agent.
import sys
from pathlib import Path
from huggingface_hub import HfApi, CommitOperationAdd

TOK = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token").read_text().strip()
api = HfApi(token=TOK)

# (dest_prefix used by that Dockerfile's COPY style, files already present in repo)
FLAGSHIPS = {
    "a11oy":     {"dest": "./",      "anchor": "ENV PORT=7860"},
    "amaru":     {"dest": "/app/",   "anchor": "ENV PORT=7860"},
    "sentra":    {"dest": "./",      "anchor": "ENV PORT=7860"},
    "killinchu": {"dest": "./",      "anchor": "ENV PORT=7860"},
}

# core files required for /live-wires; only add a COPY if not already present.
CORE = ["szl_live_wires.py", "live_wires.html", "live_wires_3d.js",
        "szl_wire.py", "szl_jack.py", "szl_khipu.py"]

results = []
for ns, cfg in FLAGSHIPS.items():
    repo = f"SZLHOLDINGS/{ns}"
    try:
        # fetch latest Dockerfile
        from huggingface_hub import hf_hub_download
        local = hf_hub_download(repo, "Dockerfile", repo_type="space", token=TOK,
                                local_dir=f"/home/user/workspace/szl_live_wires/push/{ns}")
        text = Path(local).read_text()
        # which files exist in the repo
        repo_files = set(api.list_repo_files(repo, repo_type="space"))
        dest = cfg["dest"]
        to_add = []
        for f in CORE:
            if f not in repo_files:
                continue  # not in repo -> skip (degrades honestly)
            # already COPY'd? (match the bare filename appearing in a COPY line)
            already = any(line.strip().startswith("COPY") and f in line for line in text.splitlines())
            if not already:
                to_add.append(f)
        if not to_add:
            results.append((ns, "SKIP", "all live-wires files already COPY'd", None))
            continue
        block_lines = ["",
            "# ADDITIVE (Yachay / Live 3D Wires, PURIQ Doctrine v12): COPY the live-wires",
            "# module + host page + scene core so `import szl_live_wires` resolves in-container.",
            "# Without these the register() call in the server silently fails and /live-wires",
            "# falls through to the SPA shell. ADDITIVE ONLY. Sign: Yachay."]
        for f in to_add:
            block_lines.append(f"COPY {f} {dest}{f}")
        block = "\n".join(block_lines) + "\n\n"
        anchor = cfg["anchor"]
        if anchor in text:
            new_text = text.replace(anchor, block + anchor, 1)
        else:
            # fall back: insert before final CMD
            idx = text.rfind("CMD")
            new_text = text[:idx] + block + text[idx:]
        if new_text == text:
            results.append((ns, "NOCHANGE", "anchor not found / no edit", None))
            continue
        op = CommitOperationAdd(path_in_repo="Dockerfile",
                                path_or_fileobj=new_text.encode())
        info = api.create_commit(
            repo_id=repo, repo_type="space", operations=[op],
            commit_message=f"ADDITIVE: COPY live-wires files into image so /live-wires serves real 3D ({','.join(to_add)})\n\nSigned: Yachay\nPerplexity Computer Agent",
        )
        results.append((ns, "PUSHED", ",".join(to_add), info.oid[:10]))
    except Exception as e:
        import traceback
        results.append((ns, "ERROR", f"{type(e).__name__}: {str(e)[:200]}", None))
        traceback.print_exc()

print("\n==== PUSH RESULTS ====")
for ns, status, detail, oid in results:
    print(f"{ns:10s} {status:9s} oid={oid} :: {detail}")
