"""ADDITIVE fix (Yachay): make the 3DWPP SSE generator non-blocking.

On a11oy (gate/orchestrator) the FastAPI event loop is busy (Node-proxy startup +
many routes). The original `_stream_gen()` is an `async def` generator that calls the
BLOCKING `time.sleep(0.5)`, which starves a11oy's loop so the StreamingResponse never
flushes (heartbeat/pulses stuck). amaru/sentra/killinchu/rosie tolerated it on quieter
loops, but the correct fix is `await asyncio.sleep(0.5)`. Pure additive, no behavior
change beyond making the stream actually flush. Push to a11oy.
"""
from pathlib import Path
from huggingface_hub import HfApi, CommitOperationAdd, hf_hub_download

TOK = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token").read_text().strip()
api = HfApi(token=TOK)
repo = "SZLHOLDINGS/a11oy"
d = "/home/user/workspace/szl_live_wires/push/a11oy_sse_nonblock"
local = hf_hub_download(repo, "szl_live_wires.py", repo_type="space", token=TOK, local_dir=d)
text = Path(local).read_text()
orig = text

# 1) ensure asyncio imported (idempotent)
if "import asyncio" not in text:
    # insert after the first 'import time' or at top of imports
    if "import time" in text:
        text = text.replace("import time", "import time\nimport asyncio", 1)
    else:
        text = "import asyncio\n" + text

# 2) replace the blocking sleep inside the async generator with await asyncio.sleep
#    Only the one in _stream_gen (the file has a single 'time.sleep(0.5)').
if "time.sleep(0.5)" in text:
    text = text.replace("time.sleep(0.5)", "await asyncio.sleep(0.5)")

if text != orig:
    info = api.create_commit(repo_id=repo, repo_type="space",
        operations=[CommitOperationAdd("szl_live_wires.py", text.encode())],
        commit_message="ADDITIVE fix: non-blocking SSE generator (await asyncio.sleep) so /api/a11oy/v1/wires/stream flushes on busy loop\n\nWas blocking the event loop via time.sleep() inside async gen; a11oy's Node-proxy loop starved -> no flush.\nNo data/behavior change otherwise. Real wires, real data.\n\nSigned: Yachay\nPerplexity Computer Agent")
    print("a11oy szl_live_wires.py PUSHED oid=", info.oid[:10])
else:
    print("a11oy szl_live_wires.py NOCHANGE")
