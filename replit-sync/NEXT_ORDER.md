# SZL Forge — NEXT ORDER

## ORDER: FREEZE HOLD (demo window)

A demo freeze is armed. **Read `replit-sync/FREEZE.json` first and obey it.**

- From `activates_at` (2026-06-16 00:00 ET) through `lifts_at` (2026-06-19): go **READ-ONLY**.
  - DO: monitor (healthz, drift, doctrine grep, CI status), report status to AUTO_STATE.
  - DO NOT: commit, deploy, NDJSON-commit to HF, factory-restart for changes, auto-merge
    dep PRs, auto-sync drift, edit doctrine, touch signed artifacts, or touch the box.
  - Recovery-only: a Space that is SLEEPING/errored may be restarted to its last-good build
    (healing, not a change). No code change.
- Before `activates_at`: you may continue normal queued software-side work, but the estate is
  already verified-GO — prefer monitoring + small safe items over large refactors this close in.
- HOTFIX during freeze: only for a demo-blocking defect WITH explicit founder approval, minimal,
  byte-identical GitHub↔HF, ast.parse/node-check first, re-verified live, logged. Never touch
  signed artifacts/box/doctrine gates without founder.

## DOCTRINE (frozen state — never alter)
locked = 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ kernel c7c0ba17 · Λ = Conjecture 1 ·
Khipu = Conjecture 2 · trust never 100% · SLSA "L1 honest · L2 attested · L3 roadmap" ·
no user-visible codenames · effector SIMULATED · 0 runtime CDN · never commit a key.

## POST-FREEZE QUEUE (do NOT start until founder unfreezes — see PROPOSALS.md)
1. Air-gap UDS deploy proof (Raven proof). 2. Bundle-level SLSA L2 attestation.
3. Doctrine v11 reconciliation in org .github + szl-doctrine. 4. Progressive-delivery pipeline.
