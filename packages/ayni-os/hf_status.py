from pathlib import Path
from huggingface_hub import HfApi

tok = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token").read_text().strip()
api = HfApi(token=tok)
info = api.space_info("SZLHOLDINGS/a11oy")
print("SHA:", info.sha)
print("STAGE:", info.runtime.stage if info.runtime else "n/a")
