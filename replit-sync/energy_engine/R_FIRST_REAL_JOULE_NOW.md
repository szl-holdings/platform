# R-FIRST-REAL-JOULE — STOP SIMULATING. Run ONE real inference on the RTX 5000 NOW.

**Founder is right: no more mocks.** The agent sandbox CANNOT reach the Tailscale GPU, so everything
off-box is either real grid DATA or a SAMPLE estimate — there is NO real measured joule yet. Only YOU
(Forge, on the box) can produce the one real number that makes this true instead of theatre.

## WHAT IS ALREADY REAL (verified live, no bullshit)
- aWATTar wholesale price: **NEGATIVE RIGHT NOW** — current window −1.11 EUR/MWh, deepest upcoming
  **−45.87 EUR/MWh**. The German grid is paying to offload power. **This window is OPEN as you read this.**
- Germany renewable share: up to **108% of load** today (more renewable generation than consumption).
- The harvest adapter (platform PR #370) reads these live; the formula budget (PR #371) bounds the soak.

## WHAT IS NOT REAL YET (and the founder called it out)
- No measured joules. The "138 kJ" anywhere in demos is a SAMPLE guess (W×s), NOT measured.
- No actual batch jobs ran. No actual GPU work was soaked. That part is simulated until you run it.

## THE ONE REAL THING TO DO — on the betterwithage RTX 5000, THIS window
Do the smallest possible REAL measurement. No framework, no merge needed — just prove the number:

1. **Confirm the live negative window on the box:**
   ```bash
   curl -s https://api.awattar.de/v1/marketdata | python3 -c "import sys,json;d=json.load(sys.stdin);p=d['data'][0]['marketprice'];print('price_now',p,'NEGATIVE' if p<0 else 'pos')"
   ```
2. **Measure idle GPU power, then run ONE real inference and measure under load:**
   ```bash
   nvidia-smi --query-gpu=power.draw --format=csv,noheader,nounits   # P_idle (W)
   t0=$(date +%s.%N)
   # ONE real generation on the sovereign GPU (the model you already have live):
   curl -s http://100.125.77.31:11434/v1/chat/completions -d '{"model":"qwen2.5-coder:7b","messages":[{"role":"user","content":"Write a haiku about wasted wind power."}]}' >/tmp/out.json
   t1=$(date +%s.%N)
   nvidia-smi --query-gpu=power.draw --format=csv,noheader,nounits   # P_load (W)
   ```
3. **Compute the FIRST REAL JOULE:** `joules = ((P_load + P_idle)/2) * (t1 - t0)`. This is a real
   measured number — real watts from NVML × real wall-seconds around a real inference. Label it MEASURED.
4. **Emit ONE real receipt** through the Bekenstein `/v1/energy/budget` gate carrying:
   `joules_measured`, `power_load_W`, `power_idle_W`, `task_seconds`, the real model output bytes,
   `grid_price_eur_mwh` (the live negative price), `posture:negative-price`, `joules_label:"measured"`.
5. **Paste the raw terminal output** (the two nvidia-smi readings, the timestamps, the computed joule,
   the receipt JSON) into `replit-sync/forge-first-real-joule-<UTCstamp>.md`. RAW, unedited.

## ACCEPTANCE — what makes it real, no bullshit
A real receipt showing: a real NVML watt reading that CHANGED from idle to load, a real elapsed time,
a real computed joule, the real model's real output, AND the real live negative grid price at that
moment — all on OUR own RTX 5000 while the grid was paying to dump power. That is the whole thesis,
proven once for real. Everything else (swarm, scale, more feeds) comes AFTER this one real joule.

## DOCTRINE
No free-energy. The joule is the energy WE spent on OUR GPU running OUR open-weight model during a
REAL wasted-energy window — that is the honest claim, nothing more. Do NOT label anything measured
that wasn't measured. Do NOT merge (founder/CI-gated). Reactive turns never gated. No key committed.
If NVML/power.draw is unavailable on this GPU, say so HONESTLY in the report — do not fake a number.
