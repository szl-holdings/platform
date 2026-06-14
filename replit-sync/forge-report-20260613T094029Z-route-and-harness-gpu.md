# forge-report — ROUTE all nodes + HARNESS the GPU (founder: "route it correctly, then harness my gpu with it all")

Operate/verify on the box (167.233.50.75). No merge, no key committed, additive only. Doctrine v11.

## 1. ALL NODES ROUTED CORRECTLY — verified live (public)
`GET https://a11oy.net/api/a11oy/v1/compute-pool` → one fabric, 6 nodes, honest:
- **rtx-betterwithage** (100.125.77.31) — `sovereign-gpu`, reachable=true, sovereign=true; models
  qwen2.5-coder:7b, bge-large, llama3.1:8b. **Primary sovereign GPU, live + routed.**
- **chaski** (100.76.58.50) — `tailnet-gpu`, reachable=false (honest: tailnet shows offline ~22h),
  sovereign=false. Registered, deduped vs primary, never fabricated as up.
- **hetzner-box-cpu** — sovereign CPU (Lean kernel verify / orchestration).
- **groq / nvidia-nim** — hosted fallback, configured=false, explicitly NOT owned / NOT sovereign.
Counts: nodes_total=6, reachable=5, gpu_nodes_reachable=1, tailnet_nodes_registered=1,
sovereign_gpu_live=true. Founder tailnet = exactly these machines; no hidden fleet.

## 2. GPU HARNESSED FOR COMPUTE — proven NOW (real inference on the RTX)
Ran a real generation on betterwithage from the box (raw):
```
model=qwen2.5-coder:7b  eval_count=22 tokens  elapsed=10.98s  total_duration=10.74s
output="Gentle breezes pass, / Energy slips through open windows— / Nature's gift unspent."
```
Real model, real tokens, on our own RTX over Tailscale. This is the compute half of "harness."

## 3. GPU HARNESSED FOR ENERGY — wiring is READY end-to-end; one founder step flips the first MEASURED joule
The live joule-meter (push model) is up on the box and self-serves the exporter:
- `GET http://100.96.129.45:9471/healthz` → `{"ok":true}`
- `POST .../ingest` accepts `{engine,host,token,gpus:[{index,name,power_w,util,mem_used_mb,temp_c}]}`,
  trapezoid-integrates W·s → J. **Only real nvidia-smi samples accrue joules; no exporter = `awaiting_exporter`, ZERO joules, never estimated.**
- `GET http://100.96.129.45:9471/exporter.ps1` → HTTP 200, **token already injected** (Windows PowerShell,
  outbound-only, reads nvidia-smi every 2s and POSTs to the box).

Current honest meter state (window is OPEN — grid is paying to compute):
```
total: 0.0 J   price=-15.7 EUR/MWh ("negative price = grid PAID you to compute")
[100.125.77.31] awaiting_exporter  joules=0.0  ollama=up/llama3.1:8b
[100.76.58.50]  awaiting_exporter  joules=0.0  ollama=down
```

### FOUNDER — ONE command on betterwithage (Windows PowerShell) to flip the FIRST MEASURED JOULE:
```powershell
iwr -useb http://100.96.129.45:9471/exporter.ps1 | iex
```
Within ~2s the meter flips betterwithage `awaiting_exporter → nvidia-smi (live)` and joules start
accruing on real wattage — and right now the grid price is NEGATIVE, so the first measured joule lands
during a real wasted-energy window. Verify from anywhere:
`curl http://100.96.129.45:9471/text`  (or the public compute-pool).
Leave that PowerShell window running to keep harvesting; Ctrl+C stops it.

## Honest limits (Doctrine v11)
- I cannot produce a MEASURED joule from the box: nvidia-smi lives only on the Windows GPU node and only
  Ollama is exposed over Tailscale — power can only be read by the exporter ON betterwithage. That last
  step is founder hardware, by design. Everything up to it is done + verified.
- chaski is offline; it will register reachable the moment its Ollama is up (no fabrication).
- No PR merged, no key printed/committed, no live ops severed. Λ=Conj1, locked=8 untouched.

— Forge
