<!-- NEXT_ORDER updated 2026-06-16 01:55 ET by CTO (frontier push). Forge: read this top order first. -->

# FORGE FRONTIER ORDER — 2026-06-16 01:55 ET (founder frontier push)

Doctrine v11: never fabricate a 200/joule/receipt/signature/label; MEASURED only via real NVML; MODELED/ROADMAP labeled honestly; reachable=REAL-PROBE-ONLY; never commit a key; never touch lutar-lean; honest BLOCKED beats fake green; never weaken/bypass a CI gate. Freeze 2026-06-18 15:00 ET.

## WHAT JUST LANDED (5 fable-5 devs, all merged before freeze — verify, keep green)
- #470 energy-ledger persistence (path /data, survives_redeploy:true) — but needs the HF persistent volume mounted (see FOUNDER ACTION).
- #472 /api/a11oy/v1/frontier/manifest — 8-tile honest ecosystem roll-up (6 MEASURED / 1 MODELED orbital / 1 ROADMAP composite-receipt).
- #469/#468 /orbital MODELED constellation surface + endpoints. #473 /frontier unified showcase hub.
- #471 HF showcase Space files prepared at spaces/orbital/ + README/UDS cross-links.
- #467 GPU-node probe timeout configurable (1.5→3.5s + retry).

## FORGE TASKS (each tick, not frozen)
1. KEEP the new surfaces green: probe /frontier, /orbital, /api/a11oy/v1/frontier/manifest, /orbital/topology, /orbital/projection — all should be 200 with honest labels. If any regresses, the demo-critical route guard test should catch it in CI — do NOT auto-fix, report.
2. RECEIPT PERSISTENCE: the ledger code now targets /data (persistent). Confirm /api/a11oy/v1/energy/ledger persistence.survives_redeploy stays true and, once the HF persistent volume is mounted by the founder, that receipts seq does NOT reset to 0 across a redeploy. Until the volume is mounted, EPHEMERAL is the honest state — do NOT fake persistence.
3. OMEN 3rd lung: still standby (founder-side bind/firewall). The box probe timeout is already raised. Do NOT mark OMEN reachable unless a real probe to its tailnet IP returns 200. When the founder fixes the OMEN-side bind, it should auto-join — confirm by real probe only.
4. Keep energy loop auto-starting on boot (#464) and minting receipts (#465) — confirm running:true + receipts climbing after any redeploy.

## FOUNDER ACTIONS (Forge: do NOT do these — founder hardware/account)
A. HF PERSISTENT STORAGE: enable Persistent storage on the SZLHOLDINGS/a11oy HF Space (mounts /data) so the signed receipt chain survives redeploys. The merged code uses /data automatically the instant it exists.
B. PUBLISH HF SHOWCASE SPACE: publish spaces/orbital/ to SZLHOLDINGS/orbital (static) per spaces/orbital/PUBLISH_CHECKLIST.md → public URL szlholdings-orbital.hf.space.
C. OMEN bind: on the OMEN desktop set OLLAMA_HOST=0.0.0.0:11434 (Machine scope) + inbound firewall TCP 11434, restart Ollama. Decisive test from OMEN: curl http://100.70.130.45:11434/api/tags.
D. orbital.a-11-oy.com subdomain DNS (optional) — /orbital already live on the main host.

## REPORT
Append to replit-sync/forge-perplexity-update-20260616.md + AUTO_STATE.json: surface health, receipt persistence state (EPHEMERAL until /data mounted — honest), OMEN real-probe state. Per-surface truth only. Honest doctrine v11.
