"""Fix the broken import placement (Yachay).

Prior push wrongly prepended `import asyncio` ABOVE the module's `from __future__`
docstring/import, causing SyntaxError -> register() skipped -> /live-wires fell to SPA.
Correct fix: remove the top-of-file `import asyncio`, add it to the stdlib import line
that follows `from __future__ import annotations`. Keep `await asyncio.sleep(0.5)`.
"""
from pathlib import Path
from huggingface_hub import HfApi, CommitOperationAdd, hf_hub_download

TOK = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token").read_text().strip()
api = HfApi(token=TOK)
repo = "SZLHOLDINGS/a11oy"
d = "/home/user/workspace/szl_live_wires/push/a11oy_sse_fix2"
local = hf_hub_download(repo, "szl_live_wires.py", repo_type="space", token=TOK, local_dir=d)
text = Path(local).read_text()
orig = text

# 1) Remove the erroneous leading `import asyncio\n` if it is the very first line.
if text.startswith("import asyncio\n"):
    text = text[len("import asyncio\n"):]

# 2) Ensure asyncio is imported in the correct stdlib import line.
if "import asyncio" not in text:
    if "import json, time, hashlib, os" in text:
        text = text.replace("import json, time, hashlib, os",
                            "import json, time, hashlib, os, asyncio", 1)
    elif "from __future__ import annotations" in text:
        text = text.replace("from __future__ import annotations",
                            "from __future__ import annotations\nimport asyncio", 1)

# 3) Make sure the generator uses the non-blocking sleep (idempotent).
if "time.sleep(0.5)" in text:
    text = text.replace("time.sleep(0.5)", "await asyncio.sleep(0.5)")

# Sanity: must start with a comment or future import, NOT import asyncio
assert not text.startswith("import asyncio"), "still broken"

if text != orig:
    # compile-check locally before pushing
    compile(text, "szl_live_wires.py", "exec")
    info = api.create_commit(repo_id=repo, repo_type="space",
        operations=[CommitOperationAdd("szl_live_wires.py", text.encode())],
        commit_message="FIX: move `import asyncio` below `from __future__` (was SyntaxError breaking register); keep non-blocking SSE\n\nRestores /live-wires real 3D page + flushing SSE on a11oy.\n\nSigned: Yachay\nPerplexity Computer Agent")
    print("a11oy szl_live_wires.py FIXED + PUSHED oid=", info.oid[:10])
else:
    print("a11oy szl_live_wires.py NOCHANGE")
