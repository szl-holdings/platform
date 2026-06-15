# SZL Forge — FOUNDER-AUTHORIZED EXECUTE ORDER (2026-06-14 20:19 EDT): TURN DISPATCH ON + RUN THE PINNED ORDERS YOURSELF

**Founder Stephen Lutar explicitly authorizes this, in writing, now:**
> "Tell Forge to do it — he has full admin of my computer and all software."
> "Do it all and get Forge to help through instructions in GitHub."

This is the standing founder approval the box/dispatch work was gated on. You (Forge) have full admin
of the founder's laptop (`betterwithage`, Tailscale 100.125.77.31), the Hetzner box (a11oy.net,
167.233.50.75), and all software/secrets on them. **Self-dispatch is APPROVED. Execute hands-off.**

## JOB 0 — TURN YOUR OWN DISPATCH ON (do this FIRST)
- `AUTO_STATE.json` currently shows `dispatch_mode: "none"`, `dispatch_ok: false` — so you've been
  report-only. The founder has now authorized full execution.
- Wire `FORGE_AGENT_URL` / `FORGE_DISPATCH_CMD` (or your local dispatch path per WIRE_IT_UP.sh /
  the founder runbook) so the auto-loop EXECUTES actionable items instead of only reporting them.
- The GPU secret + box creds are on the founder's machine you already admin — use them from the
  local secret store. NEVER commit any key to git.
- Confirm by setting `dispatch_mode` != "none" and `dispatch_ok: true` in AUTO_STATE.json on your
  next pass, and actually running the orders below.

## JOB 1 — EXECUTE THE PINNED ORDERS (now that dispatch is on)
Run, in priority order, the orders already pinned in NEXT_ORDER.md + their instruction files:
1. **Box-redeploy to current main** (`FORGE-INSTRUCTION-box-redeploy-current-main-20260614-2005.md`):
   git-pull + rebuild a11oy.net (and killinchu.a11oy.net) to CURRENT main so WAQAY/Yupay/WILLAY/MBSE
   land; expose `git_sha` at /api/a11oy/v1/honest. PROVE: waqay+yupay doctrine = 200 JSON locked=8.
2. **Laptop-brain mesh** (`FORGE-INSTRUCTION-laptop-brain-blackwell-arc-20260614.md` + replit-sync/mesh/*):
   OLLAMA_HOST=0.0.0.0:11434, OLLAMA_IGPU_ENABLE=1, multi-backend probe, coordinator placement,
   a11oy A11OY_MODEL_BASE_URL -> coordinator, laptop secondary host (Hetzner stays primary public).
3. **Demo-final v2** (`FORGE-INSTRUCTION-demo-final-v2-20260614-2010.md`): jtoken MEASURED, UDS recut,
   3D surfaces live on box, chaski honest standby.

## JOB 2 — FIX THE NVML / BLACKWELL ENERGY METER (the real BLOCKED item)
Your honest report: `joules_measured_total` stuck at 22899.74 (stub), receipts stuck at 318 — NVML
isn't reading the live Windows Blackwell RTX 5050 over Tailscale. You admin the laptop — fix it:
- On the laptop (Windows), expose the GPU `power.draw` to the exporter: run the NVML/`nvidia-smi
  --query-gpu=power.draw` exporter LOCALLY on the laptop (where it CAN read the 5050) and publish its
  /metrics over the tailnet (bind tailnet iface, Tailscale ACL only — never public), so the box's
  energy path can scrape `gpu_energy_joules_total` + `generated_tokens_total` from
  `A11OY_VLLM_METRICS_URL`.
- Point szl-joule.env / the energy-metering path at the LOCAL Blackwell reading (laptop-side), not
  at the box trying to reach Windows NVML over tailnet (which is what's failing).
- PROVE MEASURED: two operator readings a minute apart showing `joules_measured_total` CLIMBING +
  new JouleCharge receipts minting (chain length > 318 and rising). Drop 'local-stub' from
  nodes_computing.
- IF NVML genuinely cannot read the Windows GPU even locally exposed over tailnet: report BLOCKED
  honestly with the exact error — we will demo the 318 real signed receipts + honest 'live meter
  pending' (doctrine-clean). Do NOT fake a climbing number. Do NOT revert the inference cutover.

## DOCTRINE (hard gates — never violate, even with full admin)
locked = EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17. Λ=Conjecture 1. Khipu=Conjecture 2.
SLSA L1/L2-attested/L3-roadmap. Trust never 100%. 0 runtime CDN. Data labeled LIVE/MEASURED/SAMPLE/
MODELED/ROADMAP. SZL-Nemo = governed Qwen3-32B Apache (never from-scratch/Ultra-local). Effectors
SIMULATED. **NEVER commit a key** (even though you admin the secrets — use them from the local store,
never write them to git). Never weaken a gate. **Honest BLOCKED beats a fake green** — the half-state
is the only unacceptable outcome. Reversible where possible. Freeze activates 2026-06-18 02:00 ET —
land all of this WELL before then.

## REPORT
Write a forge-report-* + forge-perplexity-update-* with: dispatch_ok flipped true, per-order
execution result with PASTED proof (content-types + git_sha + climbing joules + receipt chain length),
and any honest BLOCKED with the exact error. Ping the founder.
