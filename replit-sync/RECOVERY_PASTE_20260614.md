# SZL RECOVERY — run this file top to bottom on the box (167.233.50.75)

**Why:** Forge's poll timer is STALLED (no pass since 05:09Z / 1:09 AM EDT) and dispatch is
`none` — so merged work is reported, never executed. Code is all on `main` and LIVE on the HF
Space (`szlholdings-a11oy.hf.space/api/a11oy/v1/pinn/*` = 200). Gaps: (1) box nginx serving a
stale build, (2) energy cert is SAMPLE (no real GPU run yet). These steps fix all of it.
Run as the user that owns the Forge timer. Doctrine v11 — never fabricate, never over-unity.

GPU target: **rtx-betterwithage** (http://100.125.77.31:11434, sovereign, reachable). chaski
(100.76.58.50) is OFF — do NOT block on it.

---

## STEP 0 — Revive the poller + wire dispatch (root cause)
```bash
which forge-agent     # if this prints NOTHING, that's why dispatch=none

sudo tee -a /etc/forge-perplexity.env >/dev/null <<'ENV'
FORGE_DISPATCH_CMD="/usr/local/sbin/forge-agent-run"
ENV

sudo tee /usr/local/sbin/forge-agent-run >/dev/null <<'SH'
#!/usr/bin/env bash
set -euo pipefail
cat | forge-agent --order - --doctrine v11   # <-- swap for your REAL agent invocation
SH
sudo chmod 755 /usr/local/sbin/forge-agent-run

sudo systemctl restart forge-perplexity-poll.timer
systemctl status forge-perplexity-poll.timer --no-pager   # must be active/waiting, not dead/failed
sudo /usr/local/sbin/forge-perplexity-poll                 # force one poll now

gh api repos/szl-holdings/platform/contents/replit-sync/AUTO_STATE.json --jq '.content' \
 | base64 -d | python3 -c 'import sys,json;d=json.load(sys.stdin);print("dispatch_mode:",d["dispatch_mode"],"ok:",d["dispatch_ok"])'
# want: dispatch-cmd / ok:true
```

## STEP 1 — Un-stale the box (a11oy.net -> matches HF)
```bash
cd /opt/a11oy            # <-- adjust to the box's real a11oy repo path
git fetch --all && git reset --hard origin/main
docker compose up -d --build a11oy  ||  sudo systemctl restart a11oy.service
sleep 6
curl -s -o /dev/null -w 'box /pinn: %{http_code}\n' http://127.0.0.1:8081/api/a11oy/v1/pinn/certificate  # want 200
```

## STEP 2 — Run agentic PINN on the live GPU (flips SAMPLE -> MEASURED)
```bash
cd /opt/a11oy
export PYTHONPATH="$PWD/services/verticals/szl_pinn/_vendor:$PYTHONPATH"
python3 - <<'PY'
import json
from dataclasses import asdict
import nvml_hook as nh, physics_bounds as pb, agentic_pinn as ap
job = nh.read_nvml_job(duration_s=10.0, bit_operations=1e16, bits_erased=1e14,
                       info_content_bits=1e12, device_mass_kg=2.0, device_radius_m=0.15,
                       device_index=0)   # REAL power x time on rtx-betterwithage; refuses to fabricate
cert = pb.certify(job)
res  = ap.AgenticPINN(cfg=ap.AgenticConfig(seed=0)).run(verbose=False)
open("physical_bounds_certificate.json","w").write(json.dumps(asdict(cert), indent=2, default=str))
open("agentic_decision_trail.json","w").write(json.dumps(asdict(res), indent=2, default=str))
print("MEASURED cert | bounded:", cert.physically_bounded, "| verdict:", res.final_verdict)
PY
# if it errors "no GPU": you're not on rtx-betterwithage. That error is the honest guard, not a bug.
```

## STEP 3 — Serve the MEASURED artifacts + restart
```bash
cp physical_bounds_certificate.json agentic_decision_trail.json /opt/a11oy/
docker compose up -d a11oy || sudo systemctl restart a11oy.service
sleep 6
curl -s http://127.0.0.1:8081/api/a11oy/v1/pinn/certificate \
 | python3 -c 'import sys,json;print("label:",json.load(sys.stdin)["certificate"]["measured"]["label"])'  # want MEASURED
```

## STEP 4 — Sign + confirm from anywhere
```bash
curl -s http://127.0.0.1:8081/api/a11oy/v1/verify | python3 -m json.tool | head   # real signed verify (needs FA-001 key)
gh workflow run hf-sync.yml -R szl-holdings/a11oy                                  # re-mirror to HF if needed
```
**Win check (no box needed):**
`curl -s https://a11oy.net/api/a11oy/v1/pinn/certificate | grep -o '"label":"[A-Z]*"'`  -> MEASURED

## HARD RULES (Doctrine v11)
Energy = MEASURED power x time only; label MEASURED only on a real NVML reading. Honest inverse of
free-energy, never over-unity. Keep the deny-by-default Lambda-gate + signed receipt. NEVER merge a
lutar-lean keystone PR. Never commit a key. Run on rtx-betterwithage; don't block on chaski.

— Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
