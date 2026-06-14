# FORGE-INSTRUCTION — Wire-Up + SDA Make-Operational — 2026-06-13

**To:** Forge (Hetzner box agent) + Replit (Chaski).
**From:** CTO agent (GitHub admin). **Authority:** Founder Stephen P. Lutar Jr. — full green light.
**Read order:** this file → `replit-sync/NEXT_ORDER.md` (R-SDA-OPERATIONAL-REPOST is pinned TOP) → `replit-sync/FOUNDER_WIREUP_AND_SDA_OPERATIONAL.md` (founder runbook).

---

## STATUS (honest)
- Forge is HEALTHY but **report-only**: `AUTO_STATE.json` shows `dispatch_mode: none, dispatch_ok: false`. It parses orders + reports, but executes nothing until dispatch is wired.
- Everything downstream is GREEN + queued: `szl-holdings/khipu-sda-core` repo is LIVE, 6 PRs merged (killinchu #118, a11oy #356, uds-mesh #87, uds-bundles #37, szl-uds-deployment #85, platform #380), SDA static surface built, master order pinned to inbox top.

## THE BLOCKER (one founder/box action)
Dispatch is OFF. Fix = ONE paste on the box (`replit-sync/WIRE_IT_UP.sh` as root, or the 3 commands in the founder runbook), which sets `FORGE_DISPATCH_CMD` + restarts `forge-perplexity-poll.timer`. After that `dispatch_mode != none, dispatch_ok: true` and Forge executes hands-off. Founder runbook has the exact paste: `replit-sync/FOUNDER_WIREUP_AND_SDA_OPERATIONAL.md`.

## FORGE — EXECUTE ON DISPATCH (full detail in NEXT_ORDER R-SDA-OPERATIONAL)
1. Build + cosign-sign + SLSA-attest `ghcr.io/szl-holdings/khipu-sda-core:uds-v0.4.0` (FA-001 = founder cosign key; if absent → STOP at sign, report `needs: cosign key`, leave digest BLANK, never fake).
2. Rebuild **a11oy** + **killinchu** images FROM MAIN (ships `/api/.../mosaic/*` + Governed-Anomalies tab + Mosaic/Domain-Superiority COP view); redeploy both HF Spaces; confirm 200.
3. Push the SDA static space → `SZLHOLDINGS/sda` (source: `replit-sync/hf_spaces/hf_sda_space/`).
4. Train the SDA engine on real data on the GPU fabric; capture MEASURED precision/recall + walltime + a REAL signed DSSE receipt.

## REPLIT (Chaski) — FOUNDER-ONLY BOOT (Forge lacks the Replit credential)
- Start the **replit-chaski** Repl; run: `export OLLAMA_HOST=0.0.0.0:11434; ollama serve` then `ollama pull qwen2.5-coder:7b` + `ollama pull bge-m3`; set **Always-On**.
- This brings chaski (100.76.58.50) `reachable=true` as the 2nd SAMAY lung for the SDA real-GPU runs.

## FOUNDER-ONLY GATES (report as honest `needs:` lines, never fake)
- `WIRE_IT_UP.sh` on the box (turns dispatch ON — the master unblock).
- Chaski Repl boot (above).
- FA-001 cosign signing key → Forge secret store (signs the image + szl-sda UDS bundle).
- `VAST_API_KEY` → Forge secret store (verified-compute marketplace earning).

## DOCTRINE v11 (never violate)
Λ = Conjecture 1 (advisory) · locked-proven = 8 · Khipu BFT = Conjecture 2 · orbital-SDA = ROADMAP (air/maritime live) · SLSA L1 honest (L2 roadmap until signed) · sovereign own-metal only · open-weight models only · NEVER commit a key · NEVER keystone self-merge · NEVER fabricate signatures/digests/numbers · cite-not-plagiarize (inspired by True Anomaly Mosaic, NOT affiliated; clean-room) · no banned codenames user-visible · szl-router PRIVATE.

## REPORT
Into `AUTO_STATE.json`: dispatch wired? · image built+signed? (or `needs: cosign key`) · a11oy+killinchu rebuilt + routes live? · SDA space pushed? · MEASURED metrics (or `needs: chaski`) · bundle airgap-tested? · marketplace (`needs: VAST_API_KEY`).
