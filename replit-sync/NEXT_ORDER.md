# SZL Forge — ORDER: killinchu "JACK IN" Mission Console (build + the 5-modality/DroneID layer)

PRIORITY: high. Read `replit-sync/FREEZE.json` FIRST and obey it (see FREEZE RULE below).

## CONTEXT
Founder mission: at the demo, someone brings a drone — operator connects (USB/Serial, Bluetooth,
network, ADS-B/AIS, or SITL sample), and killinchu shows the full capability live: connect → live
telemetry → fuse/track → classify → governed decide → SIMULATED engage (human-on-the-loop) →
cryptographic receipts you can re-hash yourself. A 5-Opus-dev build is already done + integrated in
the workspace at /home/user/workspace/jackin-console/ (shell+CONNECT, LIVE FEED+TRACKS,
CLASSIFY+DECIDE, ENGAGE-sim+RECEIPTS), wired to REAL killinchu endpoints. Specs:
team/HARDENING/JACKIN_CONSOLE_SPEC.md + JACKIN_GAP_ADDENDUM.md.

## WHAT TO BUILD / FINISH (Replit/Forge)
1. Mount the jackin-console as the "JACK IN" surface on killinchu (route /jackin and/or folded into
   /elite). Serve it from killinchu's serve.py; static assets vendored (0 runtime CDN).
2. Wire it to the REAL existing endpoints (same-origin): /api/killinchu/v1/cuas/{plausibility,wta,
   consensus,fusion,pqbus}, /v1/drones/database, /v1/adsb, /v1/ais/live, /khipu/sign,
   /api/a11oy/v2/command-log, /api/a11oy/v1/ledger. No fabricated data — LIVE vs SAMPLE labeled.
3. ADD the 5-modality FUSION + DroneID layer (JACKIN_GAP_ADDENDUM.md): per-track modality row
   [RF][RADAR][EO/IR][ACOUSTIC][REMOTE-ID] with contributing/blind + the cross-verify narrative;
   a Remote ID / DJI-DroneID (ASTM F3411 / OpenDroneID, OcuSync2/3/4 hash-without-decode) decode
   panel in CLASSIFY; an honest blind-spot table per modality. SAMPLE-label any modality we don't
   physically have at the demo; never claim live hardware we don't have.
4. CONNECT transports must work in-browser over HTTPS (Web Serial + Web Bluetooth = Chrome/Edge +
   user gesture; show honest note on Firefox/Safari). SITL sample path must work with NO hardware so
   the demo never depends on a device. Vendor mavlink-browser (no CDN).

## DOCTRINE HARD GATE (never violate)
effector SIMULATED, human-on-the-loop, prominent — NO takeover/jam/spoof/real-command claims.
locked=8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17 · Λ=Conjecture 1 · Khipu=Conjecture 2 ·
trust never 100% · 0 runtime CDN · WCAG-AA · real receipts (DSSE via /khipu/sign), never fake a MATCH ·
GitHub↔HF byte-identical on shared modules · ast.parse/node --check before push · never commit a key.

## FREEZE RULE (critical)
FREEZE.json activates 2026-06-16. BEFORE then: you MAY build + push this to killinchu (GitHub + HF
byte-identical) and factory-restart — it's new, additive, behind its own route, and verified by QA.
FROM 06-16 to 06-19 (frozen): do NOT push/deploy/restart-for-change; if the console needs a fix in
that window it is a HOTFIX requiring explicit founder approval. So: finish + ship this BEFORE 06-16,
or hold it as a staged branch for after the demo. Do not half-ship across the freeze boundary.

## VERIFY
After push: /jackin (or /elite JACK IN) loads on the Space; SITL connect→…→receipt works end-to-end;
/khipu/sign signs + client re-hash MATCH + tamper fails; doctrine v11 footer correct; drift guards green.
Report shas + live URL to AUTO_STATE.

POST-FREEZE QUEUE (unchanged, do not start until unfreeze): air-gap proof run, bundle SLSA attest,
org/doctrine v11 reconciliation, progressive-delivery pipeline (see team/HARDENING/PROPOSALS.md).
