import json, os
from fastapi.testclient import TestClient
from puriq_os.app import app
c = TestClient(app)

def show(path):
    r = c.get(path)
    print(f"\n### GET {path}  ->  HTTP {r.status_code}")
    try:
        print(json.dumps(r.json(), indent=2)[:1400])
    except Exception:
        print(r.text[:500])

show("/v1/puriq/health")
show("/v1/puriq/replay")
show("/v1/puriq/Amaru/loop")
show("/v1/puriq/Killinchu-bridge/loop")
show("/v1/puriq/Amaru/receipts")
r = c.get("/v1/puriq/status")
print("\n### GET /v1/puriq/status -> HTTP", r.status_code,
      "| organs:", len(r.json()["organs"]), "| receipts:", r.json()["receipts"],
      "| chain_verified:", r.json()["chain_verified"])
r = c.get("/agentic")
print("### GET /agentic -> HTTP", r.status_code, "| PURIQ-OS in html:", "PURIQ-OS" in r.text)
r = c.get("/v1/puriq/NotAnOrgan/loop")
print("### GET /v1/puriq/NotAnOrgan/loop -> HTTP", r.status_code, "(expected 404)")
