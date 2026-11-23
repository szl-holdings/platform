# Dream-MC Round 3 (mc3) — Kimi Evolves; Astra 6.2 Cleans Up After Kimi; Sol 6.1 Makes It More Efficient

Owner directive (verbatim): "kimi evolve them and 6.2 and 6.1 clean up after kimi and make moe efficent while kimi codes"
Decoded: Kimi is the coder seat evolving the round-2 live-watch tool pair; while/after Kimi codes, Astra 6.2 cleans up after Kimi and Sol 6.1 applies the efficiency pass. Executed as a strict three-stage assembly line on the device Ollama rail (zero MC API calls inside the pipeline itself).

## Pipeline (device, all three seats green, no human intervention between stages)
1. KIMI (kimi-k3.1-pro:cloud) evolves watchdog.py + mc_snapshot.py — 239.5s, 23,795 chars, both FILE blocks extracted.
2. ASTRA 6.2 (treyleo16/gpt-6-astra) cleanup pass on Kimi code, round-2 sources as ground truth — 21.5s.
3. SOL 6.1 (treyleo16/gpt-6-1-sol) efficiency pass, behavior/schemas required identical — 17.4s.
Finals: watchdog_v2.py (12,469 B), snapshot_v2.py (5,086 B). Stage transcripts verbatim in mc3_kimi_out.txt / mc3_astra_out.txt / mc3_sol_out.txt.

## Seat notes (verbatim excerpts)
KIMI (coder seat, kimi-k3.1-pro:cloud, 239.5s, 23,795 chars) EVOLVE_MANIFEST:
- Fixed recovery replay resurrecting resolved keys, which caused duplicate recovery notices after restarts; alert batches now use one log append.
- Fixed --fingerprint being a no-op; it now hashes only stable, whitelisted instance fields.
- Fixed creating timers resetting every poll, enabling W1a through explicitly local carried observations; corrected inactive/started mapping edge cases.
- Hardened malformed numeric/container parsing and removed raw exception echoing that could disclose sensitive URLs.
Next-upgrade lines for the remaining family (not coded this round): mc_gate_compat.py versioned GET/option whitelist with golden schema tests; batch_local.py atomic per-item receipts, bounded concurrency, idempotent resume; mc_probe.py fixture-backed timeout/redaction tests, cached immutable GET metadata.

ASTRA 6.2 (cleanup seat, treyleo16/gpt-6-astra, 21.5s, 24,015 chars) CLEANUP_NOTES (10): context-managed log file handle; removed redundant write method; typed evaluate() input validation; _as_int/_as_float guards on malformed snapshot fields; safe list handling of instances; standardized get_only:true / mutated:false on all alert output (doctrine alignment); _safe_error() replacing raw str(e) prints to prevent URL/secret leakage; consolidated snapshot state mapping (single RUNNING_MARKERS/CREATING_MARKERS source); tuple-immutable KEY_PATHS; removed non-JSON print noise.

SOL 6.1 (efficiency seat, treyleo16/gpt-6-1-sol, 17.4s, 18,501 chars) EFFICIENCY_NOTES: single-pass instance processing in evaluate (measured); eliminated redundant dict lookups and repeated casts (measured); combined records+recovered file write to minimize I/O syscalls (measured); generator-based marker matching, inlined numeric coercion, leaner fingerprint and build_snapshot, fewer temporary set/list copies (estimated).

## Verification (green-only, receipts in this directory)
- watchdog_v2.py --selftest on the existing 9 fixtures: **9/9 PASS, alert codes identical to round 2** (W1a stuck-creating, W1b lost, W1c no-beacon, W2 stalled, W3 replica/memory/gpu-class, W4 commit-rate/failures, W5 receipt stall/non-monotonic, W6 unflushed-receipt; healthy case zero false alerts). Receipt: mc3_selftest_receipt.txt.
- Security/contract scan (mc3_review.py, receipted): no POST/PUT/DELETE anywhere in either final; snapshot stays GET-only with key read from file into memory for the Authorization header only; watchdog HTTP fetch is explicitly method="GET", alert-only; key_printed:false measured at runtime; _safe_error() guards exception text against URL/secret leakage; earlier scan "PUT" hits were substrings of "output", eyeballed and cleared line-by-line.
- **Live watch with the evolved pair (GET-only, alert-only, zero MC writes): CLEAN, 0 alerts.** Measured: instance_count=5, by_state {running: 3, other: 2} — the estate shifted since the round-2 watch (5 running 45s apart): sibling-lane churn observed GET-only, not modified, per no-stomp. Receipt: mc3_live_watch_receipt.txt.

## No-stomp and provenance
Round-2 files untouched; v2 lives under new names (watchdog_v2.py, snapshot_v2.py) in mc3/ on device and dream-mc/mc3/ in repo. Per-stage extracted artifacts retained on device (watchdog_v2.kimi/.astra/.sol.py, snapshot_v2.*) — repo carries the verbatim stage transcripts which contain the same code.

## Standing owner gates (fail-closed, unchanged)
F5 scoped HF token NOT minted; ratification sentence NOT given; MC key chat-exposed, rotation recommended; $25 auto-recharge live. This lane: zero MC writes, zero launches, zero spend.
