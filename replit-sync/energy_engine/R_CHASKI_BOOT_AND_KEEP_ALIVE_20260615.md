# R-CHASKI-BOOT-AND-KEEP-ALIVE — 2026-06-15 15:31 ET — Forge: boot + keep chaski alive, route as 2nd lung. DEPLOY, do NOT merge.

Founder: "Send forge the commands to boot chaski — Forge has full command of my stuff." Forge has full command — do ALL the box/tailnet steps yourself; only fall back to the founder if a step genuinely needs the Replit web console (always-on toggle), and if so give the EXACT click-path.

### GROUND TRUTH (CTO verified live 2026-06-15 15:30 ET — read before acting)
chaski is ALREADY UP right now: /compute-pool shows
  {name:chaski, kind:tailnet-gpu, endpoint:http://100.102.173.88:11434, reachable:TRUE, models:8, detail:"live model list returned"}.
NOTE THE IP CHANGED: live tailnet IP is **100.102.173.88** (NOT the old 100.76.58.50 in the stale runbooks). Use the LIVE IP. Resolve it dynamically (see step 0) — never hard-code a stale IP.
So "boot chaski" now = (1) confirm it's up on the CURRENT IP, (2) make Ollama DURABLE so it stops dying after ~22h, (3) wire it as the 2nd ENERGY lung (= ORDER A in NEXT_ORDER 93f9456). Do NOT report it offline — it is serving 8 models.

### STEP 0 — resolve chaski's live tailnet IP (don't trust a stale hard-code)
```bash
# On the box (has tailscale):
CHASKI_IP=$(tailscale status --json 2>/dev/null | python3 -c "import sys,json;d=json.load(sys.stdin);
peers=d.get('Peer',{});
print(next((p['TailscaleIPs'][0] for p in peers.values() if 'chaski' in (p.get('HostName','')+p.get('DNSName','')).lower()), ''))")
# Fallback to the currently-live IP if tailscale lookup is empty:
[ -z "$CHASKI_IP" ] && CHASKI_IP=100.102.173.88
echo "chaski IP = $CHASKI_IP"
```

### STEP 1 — confirm Ollama is answering on chaski (probe-driven, never a flag)
```bash
curl -fsS --max-time 5 "http://$CHASKI_IP:11434/api/tags" | python3 -c "import sys,json;d=json.load(sys.stdin);print('models:',[m['name'] for m in d.get('models',[])])"
# Expect 200 + the 8-model list. If this fails, chaski's Ollama really is down -> go to STEP 2 to (re)start it.
```

### STEP 2 — (re)start Ollama on chaski ONLY if STEP 1 failed
Forge can reach the chaski Repl shell over tailnet. On the chaski machine (replit-chaski):
```bash
# install if missing:
command -v ollama >/dev/null || curl -fsSL https://ollama.com/install.sh | sh
export OLLAMA_HOST=0.0.0.0:11434
nohup ollama serve >/tmp/ollama.log 2>&1 &
sleep 3
ollama list                # confirm models present
ollama pull qwen2.5-coder:7b   # ensure at least one open-weight model if list is empty
```

### STEP 3 — MAKE IT DURABLE (the real fix — it died after ~22h last time)
On the chaski Repl, install a keep-alive so Ollama auto-restarts and survives. Pick whichever the Repl supports:
**Option A — systemd (if the Repl has it):**
```bash
sudo tee /etc/systemd/system/ollama.service >/dev/null <<'UNIT'
[Unit]
Description=Ollama (chaski 2nd lung)
After=network-online.target
[Service]
Environment=OLLAMA_HOST=0.0.0.0:11434
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=3
[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload && sudo systemctl enable --now ollama
```
**Option B — supervisor loop (no systemd — typical on Replit):** add to the Repl's start command / .replit run, or a nohup watchdog:
```bash
nohup bash -c 'export OLLAMA_HOST=0.0.0.0:11434; while true; do ollama serve >>/tmp/ollama.log 2>&1; echo "ollama exited $(date) — restarting" >>/tmp/ollama.log; sleep 3; done' >/dev/null 2>&1 &
```
**Option C — Replit Always-On (FOUNDER-ONLY if A/B can't persist):** if the Repl sleeps when the tab closes and neither A nor B survives a Replit recycle, that is the ONE founder step. Report it with the exact click-path: Replit → open the `replit-chaski` Repl → Tools/Settings → toggle **Always On** (Core/Hacker plan). Do NOT claim durability you can't prove.

### STEP 4 — WIRE IT AS THE 2ND ENERGY LUNG (this is ORDER A of NEXT_ORDER 93f9456)
The moment STEP 1 returns 200: the energy operator must dispatch MEASURED jobs to chaski as the second lung (env A11OY_ENERGY_CHASKI_ENABLED=1, A11OY_ENERGY_CHASKI_URL=http://$CHASKI_IP:11434, persisted). Receipts node=chaski into the SAME ledger. Honest joules label per ORDER A (MEASURED only with a real per-job reading, else MODELED-from-fabric-coefficient). If chaski drops, operator shows clean `offline`, rtx keeps breathing — never starve, never alarm.

### STEP 5 — HEARTBEAT so a future drop is caught, not silent
Add chaski to the box heartbeat: if /api/tags stops answering, log it + flip operator node->offline (clean). Never fabricate it as up.

### PROVE (paste REAL output to replit-sync — no fabrication)
- STEP 1 curl 200 + the model list.
- `ollama list` on chaski (if you touched it).
- Which durability option you installed (A/B/C) + proof it restarts (kill ollama, show it comes back).
- operator/status showing chaski in nodes_computing once wired.
- If Always-On is the blocker, say so plainly with the click-path. Honest BLOCKED beats fake durable.

## DOCTRINE v11 (hard): chaski reachable ONLY on a real probe 200 (never a flag); ONE loop / one ledger / one Ayni (chaski = 2nd lung of the SAME loop); joules MEASURED only via a real per-node exporter, else MODELED/SAMPLE honestly; sovereign:true only on own metal; reactive never starves (loop keeps breathing on betterwithage if chaski drops); open-weight models only; no key committed; do NOT merge.
