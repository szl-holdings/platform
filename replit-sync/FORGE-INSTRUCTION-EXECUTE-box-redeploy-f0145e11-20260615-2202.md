# FORGE INSTRUCTION — EXECUTE NOW: redeploy a11oy.net box to f0145e11 (3-GPU mesh)

**Founder green light (2026-06-15 18:00 ET): "do what you can, get Forge to do it — Forge has full access to everything."** This is an EXECUTE order, not a RECOMMEND. You have done this exact box redeploy before (see `forge-report-20260615T003000Z-box-redeploy-public-proof.md`: "Box /opt/szl/a11oy reset --hard origin/main, image rebuilt, container recreated, VERIFY all PASS"). Do it again to current main.

Doctrine v11 — never weaken: locked = EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17; Λ=Conjecture 1; Khipu=Conjecture 2; trust never 100%; reachable=REAL-PROBE-ONLY; sovereign=owned-hardware passthrough; never commit a key; NEVER claim combined/fused VRAM (horizontal scale only); honest BLOCKED beats fake green.

## WHY NOW (race concern is GONE)
- The earlier reason box self-dispatch was held OFF ("racing the live a11oy commit wave") **no longer applies**: the a11oy commit wave has SETTLED — last commit `f0145e11` at 21:06Z, ~55 min quiet since (prior commits were ~13-min apart, now idle).
- The earlier `git_sha` blocker is RESOLVED: `/api/a11oy/v1/honest` on the HF Space already serves `git_sha` (f0145e112dd1). serve.py is stable.
- **HF Space = f0145e11 (current). a11oy.net BOX = cfefcc32 (STALE ~3h).** The box is the ONLY lagging surface and it serves /compute-pool-hardened — so the new OMEN node + dynamic tailscale resolver are not visible until the box redeploys.

## EXECUTE — box redeploy (the proven path, Replit-side hands-on OR flip box self-dispatch now that the wave settled)
On the Hetzner box (a11oy.net, 167.233.50.75), in the a11oy checkout (`/opt/szl/a11oy`):
```bash
cd /opt/szl/a11oy
git fetch origin && git reset --hard origin/main
GIT_SHA=$(git rev-parse HEAD)        # MUST be f0145e112dd1... (or newer)
docker build --build-arg SZL_GIT_SHA="$GIT_SHA" \
  --build-arg SZL_BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)" -t a11oy:latest .
# recreate the container with the SAME env it runs today (reuse A11OY_* + HF_TOKEN + energy flags):
#   A11OY_ENERGY_ALLOW_STUB=0  (keep meter honest, no stub)
#   A11OY_MODEL_BASE_URL=http://100.125.77.31:11434/v1  (laptop coordinator; resolver now also finds OMEN+chaski)
# restart container/compose/k8s unit as today; then re-press the energy operator (it does not auto-resume after rebuild).
```
ALSO INSTALL/REPAIR the autodeploy timer so this never lags 3h again:
```bash
curl -fsSL https://raw.githubusercontent.com/szl-holdings/a11oy/main/ops/install-a11oy-autodeploy.sh | sudo bash
sudo systemctl enable --now a11oy-autodeploy.timer
systemctl status a11oy-autodeploy.timer   # confirm active (polls origin/main every 3 min)
```

## THEN the 3-GPU mesh lights up automatically (the resolver in f0145e11 does the work)
Once the box runs f0145e11, `szl_backend_hardening.py` reads the box's own `tailscale status --json` and probes each GPU node at its CURRENT 100.x:
- **rtx-betterwithage** (Blackwell laptop) — already reachable; stays.
- **omen-betterwithage** (OMEN RTX 4060 Ti 8GB, 100.70.130.45) — founder VERIFIED it's serving: `ollama ps` shows `llama3.1:8b 100% GPU UNTIL Forever`, listening on `[::]:11434`, `/api/tags`=200. It will flip reachable:true, sovereign:true on first box probe.
- **chaski** (Replit) — confirmed UP at LIVE IP **100.102.173.88:11434 (8 models)**; resolver finds it dynamically (stale 100.76.58.50 is fallback only). Also execute `replit-sync/energy_engine/R_CHASKI_BOOT_AND_KEEP_ALIVE_20260615.md` to make its Ollama durable (died after ~22h) + wire 2nd energy lung (A11OY_ENERGY_CHASKI_ENABLED=1, URL=http://100.102.173.88:11434), honest joules (MEASURED only on real per-job reading).

## PROVE-IT (paste real public curls in your forge-report — code + content-type + bytes)
- [ ] `GET https://a11oy.net/api/a11oy/v1/honest` → git_sha == **f0145e112dd1** (or newer), doctrine v11, locked 8, c7c0ba17, Λ=Conjecture 1.
- [ ] `GET https://a11oy.net/api/a11oy/v1/compute-pool-hardened` → node `omen-betterwithage` PRESENT and `reachable:true, sovereign:true`; resolver `detail` contains `via tailscale-*`; `gpu_nodes_reachable` >= 2 (3 if chaski durable). REAL probe only — never fabricate.
- [ ] `GET https://a11oy.net/api/a11oy/v1/energy/operator/status` → nodes_computing includes omen-betterwithage (+ chaski if wired); joules MEASURED + climbing; stub_mode:false.
- [ ] a11oy CI green on f0145e11; GitHub↔HF shared modules in sync.
- [ ] autodeploy timer `active`.

## HARD GATES (approval, never auto)
- cosign-signed artifact / Rekor / UDS re-sign / FA-001 key → founder only.
- NEVER claim fused/combined VRAM ("16GB"). Nodes scale horizontally (placement + load-balance). Stating combined VRAM = the forbidden half-state.

NOTIFY founder (stephenlutar2@gmail.com) when box == f0145e11 AND >=2 sovereign GPUs reachable by real probe: title 'SZL mesh: box redeployed, N sovereign GPUs LIVE'. If genuinely blocked on box shell access, say so honestly with the exact failing command — do NOT return a vague "RECOMMENDED".
