# Forge report — SZL agentic wave (order 9100ef29): 1 honesty fix LIVE, rest founder-gated

- Timestamp: 20260614T090421Z
- Order: replit-sync/NEXT_ORDER.md @ 9100ef29 (Agentic Evolution wave — SZL-Nemo + integration)
- Founder directive: "NO BANDAIDS — GET IT FULLY OPERATIONAL."
- Title: SZL agentic wave: staged, awaiting founder hardware/secret/approval (1 honesty fix landed live)

## Ground truth (live probes — box 167.233.50.75 + a-11-oy.com)
- ONE GPU reachable: betterwithage 100.125.77.31 -> qwen2.5-coder:7b, bge-large, llama3.1:8b. NO Qwen3-32B, NO Nemotron, NO vLLM.
- chaski 100.76.58.50 ASLEEP; no 2nd RTX 4000 Ada reachable.
- Sovereign brain genuinely LIVE + honest: /api/szl/v1/inference-posture sovereign:true gpu_reachable:true model=qwen2.5-coder:7b (live /models probe this request).
- NVIDIA_NIM_API_KEY IS set in box env.
- Wave endpoints up: /nemo /quant /autoreview /factory /constitution /grc /agent-loop /governance = 200; /energy 302 (auth).

## EXECUTED (live, no bandaid) — a11oy commit 02b41d9, deployed 09:02 UTC (healthz=200 sovereign=200)
Removed a half-state in /api/a11oy/v1/nemo/tiers. The sovereign-local (Qwen3-32B / 2-GPU) tier reported label:MEASURED,
sovereign:true, gpu_reachable:true — derived from a GENERIC "any self-hosted GPU model answers" probe (today the 7B brain),
NOT from the named 32B actually being served. No 32B is served anywhere, so MEASURED/sovereign:true overclaimed a tier that
does not exist. Now model-aware:
- sovereign-local: label:ROADMAP, sovereign:false, gpu_reachable:true (node honest), node_serving_now:"qwen2.5-coder:7b",
  honest note naming the founder-gated hardware blockers. Auto-flips to MEASURED the instant a 32B base is genuinely served.
- cloud-NIM-frontier: unchanged (already honest: ROADMAP, sovereign:false, cloud).
Verified live: public a-11-oy.com/api/a11oy/v1/nemo/tiers = 200; labels confirmed honest.

## STAGED — blocked on founder hardware / secret / approval (no approval changes physics)
1. SZL-Nemo 32B QLoRA + vLLM MTP (FORGE_SZL_NEMO.md): needs a GPU that can host Qwen3-32B (~24GB+ for 4-bit inference;
   QLoRA train needs more). Reachable card is a single 7B-class GPU. -> provide/expose a >=24GB GPU.
2. 2-GPU TP=2 (FORGE_2GPU_ENERGY.md): only ONE GPU reachable; chaski asleep, no 2nd RTX 4000 Ada answering.
   -> wake + expose the 2nd card on the tailnet.
4. Energy exporter (FORGE_BOX_ENERGY.md): nvidia-smi power.draw must run ON the GPU rig; this process reaches it only via
   the Ollama API, not a shell. -> run the exporter on betterwithage so joules SAMPLE->MEASURED.
3. NIM cloud tier: key present. Wiring the routed cloud tier + running our tau-bench / J-token harness emits SIGNED receipts
   = HARD LIMIT. -> approve and Forge runs it (sovereign:false, honest cloud; OUR measured numbers, never the datasheet).
5. OSCAL/Trestle CI: convenience-only alignment; wire on request.

## Doctrine honesty held
sovereign:true ONLY via live probe; never faked; no gate weakened; no key committed; no half-state. FREEZE 2026-06-16 +
dispatch_mode:none respected for the box-gated items. The 7B sovereign brain is real and serving; the 32B/2-GPU/NIM tiers
are honestly ROADMAP until the founder provides the hardware/secret above.
