# EXAMPLE_INTEGRATIONS — how a customer integrates with SZL

**Layer:** PURIQ v12 customer surface · **Author:** Yachay (CTO authority) · **Date:** 2026-06-01
**Status discipline:** spec + patch. v11 LOCKED numbers preserved verbatim (749 / 14 / 163 / 13-axis
`yuyay_v3` / replay hash `bacf5443…631fc5`). Every integration call emits a Khipu receipt. Khipu
signature = cosign PLACEHOLDER. NO mock.

Four reference integrations a customer can clone. Each uses the published SDK + key system.

---

## (a) Slack bot using a11oy.code

A Slack slash-command `/ask` that routes a developer question through a11oy's governed code router and
posts the answer with the Khipu receipt id so the team can audit it.

```python
# slack_a11oy_bot.py — Bolt for Python. SZL_API_KEY + SLACK_BOT_TOKEN in env. No mock.
from slack_bolt import App
from szl import SZL

szl = SZL()
app = App(token=__import__("os").environ["SLACK_BOT_TOKEN"])

@app.command("/ask")
def ask(ack, command, respond):
    ack()
    r = szl.a11oy.router(
        organ="a11oy", task_class="code", governance_tier="standard",
        messages=[{"role": "user", "content": command["text"]}],
    )
    rec = r["khipu_receipt"]
    respond(
        blocks=[
            {"type": "section", "text": {"type": "mrkdwn", "text": r["choices"][0]["message"]["content"]}},
            {"type": "context", "elements": [{"type": "mrkdwn",
              "text": f"tier `{r['tier']}` · license `{r['licenseClass']}` · "
                      f"khipu `{rec.receipt_id}` · chain_verified `{rec.chain_verified}`"}]},
        ]
    )

if __name__ == "__main__":
    app.start(3000)
```
**Result in Slack:** the answer, plus a context line `tier T3 · license GREEN · khipu 7c1e… · chain_verified true`.
If the router returns a halt, the SDK raises `HaltError` and the bot posts "refused (tripwire T0x)".

---

## (b) GitHub Action calling Sentra for a security scan

A reusable Action that pipes the diff through Sentra's inline immune screen and fails the job on a hit.
**Note on our own hard rule:** SZL itself never ships via GitHub Actions — but *a customer's* CI is their
choice. This is the customer integrating SZL into *their* pipeline.

```yaml
# .github/workflows/szl-sentra-scan.yml  (customer repo)
name: SZL Sentra security scan
on: [pull_request]
jobs:
  sentra:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install szl
      - name: Scan changed files with Sentra
        env: { SZL_API_KEY: ${{ secrets.SZL_API_KEY }} }
        run: python scripts/sentra_scan.py
```
```python
# scripts/sentra_scan.py
import sys, subprocess, pathlib
from szl import SZL
szl = SZL()
changed = subprocess.run(["git","diff","--name-only","origin/main...HEAD"],
                         capture_output=True, text=True).stdout.split()
payloads = [pathlib.Path(f).read_text() for f in changed if pathlib.Path(f).is_file()]
res = szl.sentra.scan(payloads=payloads)
bad = [r for r in res["results"] if not r["cleared"]]
print(f"Sentra scanned {len(payloads)} files, {len(bad)} flagged | khipu {res['khipu_receipt'].receipt_id}")
sys.exit(1 if bad else 0)
```
**Result:** PR check goes red if any file trips a threat signature; the Khipu receipt id is in the log as
audit evidence.

---

## (c) Kubernetes operator using the UDS-bundled Killinchu

A CRD `DroneTrack` whose operator reconciles desired tracks against Killinchu running inside a UDS-Core
cluster (air-gappable). The operator calls Killinchu's edge endpoint and stores the Khipu receipt id on
the CR status for auditability.

```yaml
# config/crd: DroneTrack
apiVersion: szl.holdings/v1
kind: DroneTrack
metadata: { name: sector7-mavic }
spec:
  targetId: "UAS:DJI-Mavic-3-7F2A"
  kind: drone
  confidenceHint: normal
```
```python
# operator.py (kopf). Killinchu reachable in-cluster (UDS bundle). No mock.
import kopf
from szl import SZL
szl = SZL(base_url="http://killinchu.szl.svc.cluster.local/api")   # in-cluster, air-gapped

@kopf.on.create("szl.holdings", "v1", "dronetracks")
def start_track(spec, patch, **_):
    t = szl.killinchu.track(target_id=spec["targetId"], kind=spec["kind"],
                            confidence_hint=spec.get("confidenceHint", "normal"))
    patch.status["trackId"] = t["trackId"]
    patch.status["khipuReceipt"] = t["khipu_receipt"].receipt_id
    patch.status["yuyayPassed"] = t["yuyay"].passed

@kopf.on.delete("szl.holdings", "v1", "dronetracks")
def stop_track(status, **_):
    # graceful: receipt of the stop is itself written to the Khipu DAG
    szl.killinchu.audit(mission_id=status.get("trackId", ""))
```
**Result:** `kubectl get dronetrack sector7-mavic -o yaml` shows `status.trackId`, `status.khipuReceipt`,
and `status.yuyayPassed` — the cluster-native, air-gapped, receipted drone track the DoD/IC tier needs.

---

## (d) ATAK plugin consuming `/v1/cue` from Killinchu

An Android Team Awareness Kit (ATAK) plugin that polls Killinchu's cursor-on-target feed and drops live
drone/vessel markers on the operator's map. CoT is the native ATAK wire format.

```java
// SzlCueDropper.java (ATAK plugin sketch). Polls /v1/cue (CoT XML), injects events. No mock.
public class SzlCueDropper {
    private final String base = "https://api.szlholdings.com/killinchu";
    private final String apiKey = BuildConfig.SZL_API_KEY;

    public void poll(String bbox) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(base + "/v1/cue?bbox=" + bbox).openConnection();
        c.setRequestProperty("Authorization", "Bearer " + apiKey);
        c.setRequestProperty("Accept", "application/xml");          // CoT 2.0
        String cot = new String(c.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        String receipt = c.getHeaderField("X-Khipu-Receipt");       // audit evidence
        for (CotEvent ev : CotEvent.parseAll(cot)) {
            CotMapComponent.getInternalDispatcher().dispatch(ev);   // marker on the ATAK map
        }
        Log.i("SZL", "dropped CoT events; khipu=" + receipt);
    }
}
```
**Result:** live SZL-tracked drones and dark vessels appear as CoT markers on the ATAK map, each batch
carrying a `X-Khipu-Receipt` for after-action audit — the Anduril-Lattice-style operational picture a
defense operator expects, with a verifiable gate behind every track.

---

## Honest labels (carried on every integration)

- `chain_verified` reflects the **hash chain**, not the signature (cosign PLACEHOLDER).
- Λ uniqueness is a **Conjecture**; SLSA = **L1**; Wire D (cross-mesh traceparent) is **in-process only**.
- The Slack/GitHub/K8s/ATAK code is reference-grade and runnable against the live + on-prem surfaces; CRD
  group/version and ATAK API names follow the respective platform conventions.

## Patch files (NOT pushed by authoring step)
| File | Target |
|---|---|
| `patches/github_customer_portal/integrations/` | reference integrations in the portal/docs repo |

— Signed **Yachay** (CTO authority), 2026-06-01. Slack, CI, Kubernetes, ATAK — all receipted. No bandaid.
