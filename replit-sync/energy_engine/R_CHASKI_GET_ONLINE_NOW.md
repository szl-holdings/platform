# R-CHASKI-GET-ONLINE-NOW — Forge: bring chaski's Ollama up and route it as the 2nd lung. DEPLOY, do NOT merge.

Founder: "get chaski online, get Forge to do all of it." Verified now via /compute-pool: chaski node =
{name:chaski, kind:tailnet-gpu, endpoint:http://100.76.58.50:11434, reachable:false, detail:"URLError",
source:"self-hosted Ollama on founder tailnet", offline ~22h}. The node is a REPLIT machine (replit-chaski) on the
founder tailnet — Forge operates the box, so this is FORGE's to do (not a founder-only machine). URLError = the
Ollama process is simply not running / not bound. Bring it up.

## FORGE — DO ALL OF IT (the box steps)
1. On the chaski Replit machine (tailnet 100.76.58.50):
   - Ensure Ollama is installed; if not: curl -fsSL https://ollama.com/install.sh | sh
   - Bind it tailnet-reachable:  export OLLAMA_HOST=0.0.0.0:11434  then start it:  ollama serve  (run it as a
     persistent/background service or systemd unit so it survives — it died after ~22h, so make it durable,
     not a one-shot).
   - Pull at least one open-weight model so capabilities are real:  ollama pull qwen2.5-coder:7b  (or a
     deepseek-distill / llama that fits). Confirm:  ollama list  shows the model.
2. VERIFY reachability from the app box / fabric:  curl http://100.76.58.50:11434/v1/models  -> expect 200 with
   the model list. Only when this returns 200 does chaski count as up (no fabrication — reachable is probe-driven).
3. ROUTE IT (the moment it answers): /compute-pool flips chaski reachable=true + gpu_nodes_reachable 1->2.
   Register chaski as the SECOND SAMAY intake lung in szl_anatomy_loop (the ONE unified loop already on main):
   betterwithage = primary lung, chaski = second lung. Route inference/soak: prefer betterwithage, parallelize/
   spill to chaski when up + a cheap/negative-price window is open; energy-gate both. If chaski runs a real
   exporter (nvidia-smi push), its joules accrue to the SAME meter/ledger (measured); else SAMPLE for that node.
4. DURABILITY: make Ollama auto-restart on the chaski box (systemd / supervisor / Replit always-on) so it does not
   silently die again. Add chaski to the heartbeat so a future drop is caught and reported, not silent.
5. SURFACE honestly: chaski lights up (reachable=true) in /compute-pool, /anatomy/loop (2nd lung), and the HF
   energy Space ONLY on a real 200 probe. Report the raw curl 200 + ollama list + the gpu_nodes 1->2 flip to
   replit-sync. If the Replit box genuinely cannot keep a GPU/Ollama process (e.g. plan/tier limit), say so plainly
   with the exact blocker so the founder can decide — do NOT leave it silently offline or fake it up.

## DOCTRINE v11 (hard): chaski reachable ONLY on a real probe 200 (never a flag); ONE loop / one ledger / one Ayni
(chaski is a 2nd lung of the SAME loop, not a new loop); joules MEASURED only via a real per-node exporter, SAMPLE
otherwise; sovereign:true only on own metal; reactive never starves (loop keeps breathing on betterwithage if
chaski drops); no free-energy (#239/#240, Ayni-balanced); open-weight models only; no key committed; do NOT merge.
Get chaski's Ollama up + durable, route it as the 2nd lung, verify with a real 200, report it. Do all of it.
