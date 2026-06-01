from pathlib import Path
from huggingface_hub import HfApi

tok = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token").read_text().strip()
api = HfApi(token=tok)
who = api.whoami()
print("USER:", who.get("name"))
orgs = [o.get("name") for o in who.get("orgs", [])]
print("ORGS:", orgs)
for s in ["a11oy", "amaru", "sentra", "killinchu", "rosie", "vessels"]:
    try:
        info = api.space_info(f"SZLHOLDINGS/{s}")
        print(f"SPACE {s}: sha={info.sha[:10]} sdk={info.sdk} stage={getattr(info.runtime,'stage',None)}")
    except Exception as e:
        print(f"SPACE {s}: ERROR {type(e).__name__}: {str(e)[:120]}")
