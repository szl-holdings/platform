import sys
sys.path.insert(0, "/home/user/workspace/szl_puriq_os/deploy")
from fastapi import FastAPI
from fastapi.testclient import TestClient
import szl_agentic

app = FastAPI()
@app.get("/api/sentra/v1/existing")  # pre-existing route must survive
async def existing():
    return {"ok": True}

paths = szl_agentic.register(app, "sentra")
print("registered paths:", paths)

c = TestClient(app)
# existing route preserved
assert c.get("/api/sentra/v1/existing").json()["ok"] is True
# liveness contract
r = c.get("/api/sentra/v1/agentic/status").json()
assert r["status"] == "alive", r
assert r["organ_count"] == 16, r
print("status alive, organs:", r["organ_count"], "receipts_total:", r["receipts_total"])
# organ detail
od = c.get("/api/sentra/v1/agentic/organs/HUKULLA").json()
assert od["organ"] == "HUKULLA"
# pause without gate -> 403
p = c.post("/api/sentra/v1/agentic/pause/AMARU", json={})
assert p.status_code == 403, p.status_code
# pause WITH 2-person gate -> 200
good = {"reviewers": [{"sacred": 0.99, "structural": 0.95}, {"sacred": 0.97, "structural": 0.93}]}
p2 = c.post("/api/sentra/v1/agentic/pause/AMARU", json=good)
assert p2.status_code == 200 and p2.json()["paused"] is True, p2.json()
# resume
r2 = c.post("/api/sentra/v1/agentic/resume/AMARU", json=good)
assert r2.json()["resumed"] is True
# /agentic page renders
html = c.get("/agentic").text
assert "/agentic" in html and "PURIQ-OS" in html and "Yachay" in html
print("ALL DEPLOY SMOKE CHECKS PASSED")
