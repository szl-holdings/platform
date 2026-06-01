# EXAMPLES_GALLERY — 16 runnable example apps using the SZL SDKs

**Layer:** PURIQ v12 customer surface · **Author:** Yachay (CTO authority) · **Date:** 2026-06-01
**Status discipline:** spec + patch. v11 LOCKED numbers preserved verbatim (749 / 14 / 163 / 13-axis
`yuyay_v3` / replay hash `bacf5443…631fc5` / `lutar-v18.0.0` @ `c7c0ba17`). Khipu signature = cosign
PLACEHOLDER; `chain_verified` reflects hash-chain only. Every example emits a Khipu receipt. NO mock.

> All examples assume `pip install szl` (or `npm i @szlholdings/szl`) and `export SZL_API_KEY=szl_live_…`.
> Each ≤ ~30 lines. "Expected output" shows the shape — receipt ids/hashes are illustrative.

---

## 1 — Track this drone with Killinchu
```python
from szl import SZL
c = SZL()                                   # reads SZL_API_KEY
t = c.killinchu.track(target_id="UAS:DJI-Mavic-3-7F2A", kind="drone", confidence_hint="normal")
print("track:", t["trackId"], "| yuyay passed:", t["yuyay"].passed)
state = c.killinchu.get_track(t["trackId"])
for p in state["positions"][-3:]:
    print(f"  {p['ts']}  lat={p['lat']:.4f} lon={p['lon']:.4f} alt={p['alt']}m")
print("receipt:", state["khipu_receipt"].receipt_id, "chain_verified:", state["khipu_receipt"].chain_verified)
```
**Expected output**
```
track: trk_9f3a | yuyay passed: True
  2026-06-01T14:02:01Z  lat=32.7157 lon=-117.1611 alt=120m
  2026-06-01T14:02:03Z  lat=32.7159 lon=-117.1608 alt=122m
  2026-06-01T14:02:05Z  lat=32.7162 lon=-117.1604 alt=125m
receipt: 7c1e…-a44b chain_verified: True
```

## 2 — Evolve a Rosie mission
```python
from szl import SZL
c = SZL()
m = c.rosie.mission_evolve(goal="surveil sector 7 with 2 drones, minimize battery", generations=3)
print("mission:", m["missionId"], "| best fitness:", m["best"]["fitness"])
for step in m["best"]["plan"]:
    print(" -", step)
print("receipt:", m["khipu_receipt"].receipt_id)
```
**Expected output**
```
mission: msn_22b1 | best fitness: 0.91
 - drone A: lawnmower NE quadrant, 18 min
 - drone B: orbit POI-3, handoff at 12 min
 - rendezvous + RTB at 30 min
receipt: a90c…-1d77
```

## 3 — Ask Amaru to summarize an incident
```python
from szl import SZL
c = SZL()
c.amaru.ingest(source="sensor-log-441", payload={"events": 1284, "window": "14:00-14:30Z"})
s = c.amaru.summarize(incident_id="441")
print(s["summary"])
print("sources fused:", s["sourceCount"], "| receipt:", s["khipu_receipt"].receipt_id)
```
**Expected output**
```
Incident 441: 3 dark-vessel candidates correlated with 1 UAS overflight between 14:08-14:21Z; AIS gap on MMSI 477123456.
sources fused: 4 | receipt: 3f7d…-9c02
```

## 4 — Score wisdom with Yuyay-13
```python
from szl import SZL
c = SZL()
r = c.a11oy.router(organ="a11oy", task_class="reasoning",
                   messages=[{"role":"user","content":"Claim: the vessel is hostile. Evidence: one blurry photo."}])
y = r["yuyay"]                              # 13-axis vector
print("axes:", [round(a,2) for a in y.axes])
print("passed:", y.passed, "| replay hash matches:", y.replayHash == SZL.REPLAY_HASH)
```
**Expected output**
```
axes: [0.96, 0.97, 0.42, 0.91, 0.9, 0.93, 0.9, 0.92, 0.55, 0.9, 0.9, 0.91, 0.9]
passed: False        # axis 3 (empiricalGrounding=0.42) and axis 9 (claimCalibration=0.55) below floor
replay hash matches: True
```

## 5 — Verify a Khipu receipt chain
```python
from szl import SZL
from szl.killinchu import verify_receipt_chain
c = SZL()
f = c.killinchu.fleet()
rec = f["khipu_receipt"]
print("server says chain_verified:", rec.chain_verified)
print("locally recomputed continuum_hash matches:", verify_receipt_chain(rec))  # audit it yourself
```
**Expected output**
```
server says chain_verified: True
locally recomputed continuum_hash matches: True
```

## 6 — Chat with a11oy.code about my codebase
```python
from szl import SZL
c = SZL()
for chunk in c.a11oy.router_stream(organ="a11oy", task_class="code",
        messages=[{"role":"user","content":"Why does my retry loop never terminate? <paste>"}]):
    print(chunk.delta, end="", flush=True)
```
**Expected output**
```
Your loop retries on every exception including KeyboardInterrupt and has no max-attempts bound...
(streamed; final chunk carries chunk.khipu_receipt)
```

## 7 — Screen a payload with Sentra (fails closed)
```python
from szl import SZL
from szl.errors import HaltError
c = SZL()
try:
    c.sentra.screen(payload="'; DROP TABLE users; --")
except HaltError as e:
    print("BLOCKED at the door:", e.tripwire, "| receipt:", e.receipt_id)
ok = c.sentra.screen(payload="SELECT name FROM products WHERE id = ?")
print("clean payload cleared:", ok["cleared"])
```
**Expected output**
```
BLOCKED at the door: T05 | receipt: 5b2a…-77ef
clean payload cleared: True
```

## 8 — Export a Body-of-Evidence (BoE) for a mission
```python
from szl import SZL
c = SZL()
boe = c.killinchu.audit(mission_id="msn_22b1", fmt="boe")
print("receipts in chain:", len(boe["dag"]))
print("BoE bundle url:", boe["boeUrl"])
```
**Expected output**
```
receipts in chain: 47
BoE bundle url: https://api.szlholdings.com/killinchu/v1/audit/msn_22b1/boe.tar.zst
```

## 9 — ATAK cursor-on-target feed (XML)
```python
from szl import SZL
c = SZL()
xml = c.killinchu.cue(bbox="-117.3,32.5,-117.0,32.8", fmt="xml")
print(xml.splitlines()[0])
print("events:", xml.count("<event"))
```
**Expected output**
```
<?xml version="1.0"?><events>
events: 6
```

## 10 — Sovereign-tier governed reasoning (TypeScript)
```ts
import { SZL } from "@szlholdings/szl";
const c = new SZL({ apiKey: process.env.SZL_API_KEY! });
const r = await c.a11oy.router({ organ: "a11oy", taskClass: "reasoning",
  governanceTier: "sovereign",        // GREEN-only models + shadow-council second pass
  messages: [{ role: "user", content: "Recommend a course of action for incident 441." }] });
console.log("tier:", r.tier, "license:", r.licenseClass, "verified:", r.khipuReceipt.chainVerified);
```
**Expected output**
```
tier: T2 license: GREEN verified: true
```

## 11 — Ingest two sources into Amaru and verify the delta chain
```python
from szl import SZL
c = SZL()
c.amaru.ingest(source="ais-feed", payload={"mmsi": "477123456", "lat": 32.71})
c.amaru.ingest(source="sat-eo", payload={"track": "T-19", "lat": 32.71})
chain = c.amaru.chain(root="incident-441")
print("links:", len(chain["links"]), "| root reachable:", chain["rootVerified"])
```
**Expected output**
```
links: 2 | root reachable: True
```

## 12 — Async fan-out across flagships
```python
import asyncio
from szl import AsyncSZL
async def main():
    async with AsyncSZL() as c:
        fleet, sigs = await asyncio.gather(c.killinchu.fleet(), c.sentra.signatures())
        print("vessels:", len(fleet["vessels"]), "| signatures:", len(sigs["signatures"]))
asyncio.run(main())
```
**Expected output**
```
vessels: 12 | signatures: 6
```

## 13 — Watch the 13-axis gate block an over-claim (Rosie jack)
```python
from szl import SZL
c = SZL()
j = c.rosie.jack(decision={"action": "fire", "evidence": "single unverified report"})
blocked = [i+1 for i,a in enumerate(j["yuyay"].axes) if a < 0.90]
print("blocked axes:", blocked, "| decision allowed:", j["yuyay"].passed)
```
**Expected output**
```
blocked axes: [3, 9] | decision allowed: False
```

## 14 — GitHub Action: Sentra batch scan (Python step)
```python
from szl import SZL
import sys, pathlib
c = SZL()
findings = c.sentra.scan(payloads=[p.read_text() for p in pathlib.Path("src").rglob("*.py")])
bad = [f for f in findings["results"] if not f["cleared"]]
print(f"scanned {len(findings['results'])} files, {len(bad)} flagged")
sys.exit(1 if bad else 0)               # fail the CI job on a hit
```
**Expected output**
```
scanned 38 files, 1 flagged
(exit code 1)
```

## 15 — Quota awareness (catch the soft advisory)
```python
from szl import SZL
from szl.errors import QuotaAdvisory
c = SZL()
try:
    c.killinchu.fleet()
except QuotaAdvisory as e:
    print("over soft quota but still served; calls this period:", e.calls_this_period)
```
**Expected output**
```
over soft quota but still served; calls this period: 1043
```

## 16 — Verify the LOCKED Lean numbers from the SDK (honesty check)
```python
from szl import SZL
c = SZL()
h = c.a11oy.honest()                     # GET /v1/honest
print("declarations:", h["declarations"], "axioms:", h["axioms"], "sorries:", h["sorries"])
print("lambda_uniqueness:", h["lambda_uniqueness"])   # 'Conjecture ...'
assert h["declarations"] == 749 and h["sorries"] in (163, 168, 169)   # tag vs later-main
```
**Expected output**
```
declarations: 749 axioms: 14 sorries: 163
lambda_uniqueness: Conjecture (CAUCHY_ND sorry + missing symmetry axiom)
```

---

**Honest labels carried on every example:** Λ uniqueness is a **Conjecture**; the Khipu signature is a
**cosign PLACEHOLDER**; `chain_verified` verifies the **hash chain**, not the signature; SLSA = **L1**.
The 13-axis `yuyay_v3` is runnable; end-to-end wiring across the mesh (Wire D / traceparent) is in
progress. Receipt ids and hashes shown are illustrative.

— Signed **Yachay** (CTO authority), 2026-06-01. Sixteen runnable apps, every call receipted. No bandaid.
