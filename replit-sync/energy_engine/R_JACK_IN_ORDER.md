# R-JACK-IN — PROBE FIRST, then wire. Forge runs ALL GPU-side tests on the box.

**Discipline (founder directive): TEST THE JACK BEFORE THE WIRING.** For every jack, first PROBE
the source live and confirm it responds with the expected shape. Only wire an adapter against a jack
that PASSED its probe. Never build against an unverified source.

**Split of work:** the Perplexity agent's sandbox CANNOT reach the Tailscale GPU (confirmed
`http://100.125.77.31:11434/v1/models` unreachable off-box), so **all GPU-box jacks (NVML, vLLM,
Chaski, systemd) are Forge's to probe + wire + test on the box.** The off-box data jacks were
probed from the agent sandbox just now — results below.

**Milestone acknowledged:** GPU LIVE + sovereign — laptop NVIDIA serves 4 models (`llama3.1:8b`,
`qwen2.5-coder:7b`, `meta-llama/Llama-3.1-8B`, `bge-large`) over Tailscale; 3 sovereign routes
verified live from the box, `sovereign=True`, real replies. Brain wired. Now wire ENERGY + DATA.

**Doctrine:** no free-energy; joules SAMPLE until a real meter; sovereign only when local serves
(half-state forbidden); consent-only swarm; open-weight only; NEVER commit a key; Λ=Conj1;
Khipu BFT=Conj2; locked-8 untouched.

---

## PHASE A — PROBE EVERY JACK (do this FIRST, before any wiring)

### Agent-sandbox probe results (already done — 2026-06-13, off-box jacks):
| Jack | Probe | Result |
|---|---|---|
| **J2a aWATTar** (DE wholesale, no key) | GET `api.awattar.de/v1/marketdata` | **PASS — LIVE, and showing NEGATIVE PRICES NOW: `-1.11` and `-4.92 Eur/MWh`.** This is real stranded/curtailed power: the grid is paying to offload. The harvest signal is REAL. |
| **J2b CAISO OASIS** (US public) | GET `oasis.caiso.com/oasisapi/SingleZip?queryname=PRC_LMP&version=1` | **PASS — HTTP 200.** Reachable. |
| **J5 WattTime v3** (carbon) | GET `api.watttime.org/v3/signal-index?region=CAISO_NORTH` | **PROBE = HTTP 401** — reachable but needs a token. Stays SAMPLE until keyed (env, never committed). |

### Forge must PROBE these on the box BEFORE wiring (GPU-only — agent can't):
1. **J1 NVML probe:** `nvidia-smi --query-gpu=power.draw,power.limit,temperature.gpu --format=csv,noheader,nounits`
   → confirm a real watt number prints. If NVML/pynvml available: `nvmlDeviceGetPowerUsage`. PASS = a live watt reading.
2. **J3 vLLM probe:** can the box run `vllm --version`? Does a 32b fit VRAM (RTX 5000 may not — be ready to drop to 14b/7b)? PASS = vLLM importable + a model size that fits.
3. **J4 Chaski/daemon probe:** confirm `systemd` is available (`systemctl --version`) and the #357 daemon `run_forever()` imports cleanly on the box. PASS = unit can be installed.

**Report the PHASE-A probe table FIRST.** Only proceed to wire a jack that PASSED.

---

## PHASE B — WIRE + TEST (only jacks that passed Phase A)

### JACK 1 — NVML → FIRST MEASURED JOULE (top priority; gated on J1 probe PASS)
Wire `joules = power_draw_W × task_wall_seconds` around one served inference; feed `joules_est` and
flip its label SAMPLE→MEASURED for the on-box NVML path only. **TEST:** serve one `qwen2.5-coder:7b`
turn, capture power.draw before/after, emit ONE receipt through the Bekenstein `/v1/energy/budget`
gate with `joules_label:"measured"`. Paste the receipt + watt sample + seconds + budget verdict.

### JACK 2 — grid price → energy posture (J2a/J2b already PASSED Phase A)
Map aWATTar current price → posture `cheap|normal|negative-price|curtailed`; add CAISO as US signal.
Wire posture into the scheduler energy gate (gate batch + model pulls to cheap/negative windows; log
the window). **TEST:** print current aWATTar price + posture (it is NEGATIVE right now → expect
`negative-price`); show the scheduler ADMITTING a batch job in the negative-price window and
DEFERRING it in a simulated expensive window. Paste both.

### JACK 3 — vLLM + /metrics slack (gated on J3 probe PASS)
Bring up vLLM (size that fits per J3); flip daemon endpoint, keep Ollama fallback; wire `/metrics`
slack into admission. **TEST:** `:8000/v1/models` serves; one turn `sovereign=True`; a `/metrics`
slack reading driving admit/defer. Paste the model list + one decision.

### JACK 4 — resident daemon via systemd (gated on J4 probe PASS)
Install the systemd unit (Restart=always); wire Chaski reactive ingress so user turns PREEMPT the
proactive agenda. **TEST:** `systemctl status` active; preempt a batch mid-run with a reactive turn,
show resume. Paste status + preempt/resume log.

### JACK 5 — carbon (WattTime) — only if a token is set (probe was 401)
If token set via env: fetch v3 MOER → `carbon_moer` (SAMPLE until keyed). **TEST:** field present +
honestly labeled. If no token: leave it, report "unkeyed → SAMPLE, no carbon claim."

---

## REPORT BACK
Save `replit-sync/forge-jackin-report-<UTCstamp>.md` with: the PHASE-A probe table, then per-jack
WIRED y/n + TEST command + raw output + honest label (MEASURED vs SAMPLE). Lead with JACK 1 (first
measured joule). Blocked jack (e.g. 32b won't fit) → document honestly, drop to a fitting size, never
fake green. Set the AUTO_STATE headline. You do NOT merge (founder/CI-gated; never --admin lutar-lean).
The single demo slice = JACK 1 producing one MEASURED joule through the Bekenstein gate on the box.
