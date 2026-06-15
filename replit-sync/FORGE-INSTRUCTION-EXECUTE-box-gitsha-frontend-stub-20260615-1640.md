# SZL Forge — EXECUTE ORDER (2026-06-15 ~16:40 EDT): DRIVE THE 3 BOX ITEMS TO DONE-AND-VERIFIED

**Dispatch is ON** (`AUTO_STATE.json`: `dispatch_mode=dispatch-cmd`, `dispatch_ok=true`). This is an
EXECUTE order, not a report request. Run the box ops yourself on the Hetzner host (a11oy.net,
167.233.50.75). Founder Stephen Lutar has granted full admin. **Stop returning "RECOMMENDED" — either
EXECUTE with pasted proof, or report BLOCKED with the EXACT shell error.** Warhacker demo June 16–19.

## GROUND TRUTH (CTO audit, live this minute — retrying flapping egress)
- a11oy GitHub `main` HEAD = **`eb972068a6f65d4213546ab0c37575f636beacf8`**
  (its tip commit literally *adds* `git_sha` to the LIVE `/honest` handler in `szl_be_hardening.py`).
- platform `main` HEAD at time of writing = `77cc0104feead63693b13fcd9d5feb451b6a9ff9`.

| # | Item | Live box state right now | Verdict |
|---|------|--------------------------|---------|
| 1 | Energy meter + no-bandaid stub | `running:true` (cycles idle↔computing between sweeps), `stub_mode:false`, `joules_measured_total` CLIMBING (465,615 → 466,685 J across reads), `power_w_sample` real (10–41 W), `by_node` = **only `rtx-betterwithage`** (NO `local-stub`), `chaski` correctly **DEGRADED**. Code `szl_energy_operator.py` defaults `A11OY_ENERGY_ALLOW_STUB="0"` ⇒ `allow_stub=False`, and `by_node` filters out `*-stub`. | **HEALTHY — keep it that way.** Confirm the LIVE process env has `A11OY_ENERGY_ALLOW_STUB=0` so a GPU dropout → DEGRADED, never a silent stub. |
| 2 | `git_sha` in `/honest` | `GET /api/a11oy/v1/honest` returns doctrine v11 footer but the **`git_sha` key is ABSENT** (not even `"unknown"`). The hook IS in `main` (`szl_be_hardening.py` line ~553: `"git_sha": os.getenv("SZL_GIT_SHA","unknown")`). ⇒ **the box is serving a build OLDER than `eb97206`.** | **BLOCKED until rebuild.** Box can't prove its build. |
| 3 | Stale front-end | `/energy-ops` IS current (40 KB, contains `energy/operator/status` wiring 3×, NOT the 272 KB blank shell). The 6 nav tabs `/willay /waqay /yupay /qhawaq /sapa /mbse` ALL render real pages (200, 10–12 KB, real titles). BUT **`/energy` serves a STALE 9,065-byte `energy.html` with ZERO `energy/operator/status` wiring**, while GitHub `web/energy.html` is **27,443 bytes WITH the live-joules wiring**. ⇒ box image's `web/energy.html` is old. | **PARTIALLY STALE — rebuild lands the current `energy.html`.** |

**Root cause of items 2 & 3 is identical: the box is running a Docker image built from a commit
older than a11oy `main` HEAD `eb97206`.** One clean git-pull + rebuild + redeploy fixes BOTH.

## DO (exact box ops — run them, paste the output)
All commands run AS ROOT (or the deploy user) ON the Hetzner box `167.233.50.75`. Adjust the a11oy
checkout path / container name to whatever this host actually uses (the same place `HF_TOKEN` /
`A11OY_*` env is set today). The Dockerfile already wires everything below — you only pass the args.

1. **Pull a11oy to current `main` and rebuild with the git_sha build-arg** (this lands the current
   `web/energy.html` AND the `git_sha` hook in one shot):
   ```bash
   cd /opt/szl/a11oy          # or wherever the a11oy repo is cloned on this box
   git fetch origin && git checkout main && git pull --ff-only origin main
   GIT_SHA=$(git rev-parse HEAD)            # must print eb972068a6f65d4213546ab0c37575f636beacf8 (or newer)
   docker build \
     --build-arg SZL_GIT_SHA=$GIT_SHA \
     --build-arg SZL_BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
     -t a11oy:current .
   ```
   (Dockerfile line 1027 `ARG SZL_GIT_SHA` → `ENV SZL_GIT_SHA`; `CMD ["python","serve.py"]`. The
   `/honest` handler in `szl_be_hardening.py` reads `os.getenv("SZL_GIT_SHA")`. `web/energy.html` is
   COPY'd at Dockerfile line 1021. No code change — build-arg + redeploy only.)

2. **Redeploy the new image with the no-bandaid stub flag set on the LIVE process:**
   ```bash
   docker rm -f a11oy 2>/dev/null || true
   docker run -d --restart=always --name a11oy \
     -e A11OY_ENERGY_ALLOW_STUB=0 \
     --env-file /opt/szl/a11oy/.env  \   # keep existing HF_TOKEN / A11OY_* env exactly as today
     -p 443:8080 -p 80:8080  \           # match the existing published-port mapping for this host
     a11oy:current
   ```
   (If a11oy runs under k8s/compose here instead: set `--build-arg SZL_GIT_SHA` in the build step and
   add `A11OY_ENERGY_ALLOW_STUB=0` to the same env block where `HF_TOKEN` lives, then
   `kubectl rollout restart deploy/a11oy` / `docker compose up -d --build`.)

3. **Re-arm the energy operator** so `running:true` and joules keep climbing (NEVER reset totals):
   ```bash
   curl -s -X POST https://a11oy.net/api/a11oy/v1/energy/operator/start | head -c 400
   ```
   `allow_stub=False` is now in effect ⇒ if no GPU is reachable it goes DEGRADED + mints NO job
   (never a `local-stub`). `rtx-betterwithage` is reachable, so normal MEASURED operation continues.

4. **Confirm no phantom `local-stub`** in the live node map. With the current code (`by_node` already
   filters `*-stub`, line ~389) and `allow_stub=False`, a fresh process will not list `local-stub`.
   Do **NOT** touch the persisted state's billable totals/receipts — only ensure the LIVE status
   payload shows only `rtx-betterwithage` (+ `chaski` DEGRADED/standby).

## PROVE (paste verbatim in your forge-agent-exec report — content matters, not just HTTP 200)
```bash
# Item 2 — git_sha now present AND equals GitHub a11oy main HEAD:
curl -s https://a11oy.net/api/a11oy/v1/honest | python3 -c 'import sys,json;d=json.load(sys.stdin);print("git_sha:",d.get("git_sha","<MISSING>"))'
#   MUST print eb972068a6f65d4213546ab0c37575f636beacf8 (or whatever `git rev-parse HEAD` was), NOT <MISSING>/unknown.

# Item 3 — /energy is the CURRENT 27KB page with live-joules wiring (not the stale 9KB one):
curl -s https://a11oy.net/energy | wc -c                              # MUST be ~27443, NOT 9065
curl -s https://a11oy.net/energy | grep -c 'energy/operator/status'   # MUST be >= 1, NOT 0
curl -s https://a11oy.net/energy-ops | grep -c 'energy/operator/status'  # stays >= 1 (already current)

# Item 1 — meter still live + honest after redeploy:
curl -s https://a11oy.net/api/a11oy/v1/energy/operator/status | python3 -c 'import sys,json;d=json.load(sys.stdin);print("running",d["running"],"stub_mode",d["stub_mode"],"joules",d["joules_measured_total"],"by_node",list(d["by_node"].keys()),"node_status",d["node_status"])'
#   MUST show stub_mode:false, by_node has NO local-stub, joules >= 466685 and climbing, chaski DEGRADED/standby.
```

## DOCTRINE (hard gates)
Never fabricate a joule or receipt. **Never reset `joules_measured_total`/receipts.** GPU-gone ⇒
DEGRADED + loud, never a silent stub. Byte-identical GitHub↔HF↔box on shared source modules.
locked=8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17, Λ=Conjecture 1, trust never 100%, 0 runtime CDN.
**Never commit a key.** Honest BLOCKED (with the exact shell error) beats a fake green. The half-state
is the ONLY unacceptable outcome.

## IF YOU GENUINELY CANNOT RUN THE BOX SHELL
If you can only PLAN (no shell on 167.233.50.75), say so EXPLICITLY in your exec report with the line
`NO BOX SHELL — founder SSH required` and the exact command you would have run. The CTO has written the
founder SSH runbook at `team/AUDIT/remediation/BOX_SSH_RUNBOOK.md`. Do not return a vague "RECOMMENDED".
