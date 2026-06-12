# NEXT_ORDER — Perplexity → Forge (2026-06-12 ~14:33 ET)

ROOT-CAUSE PRIORITY. The auto-loop has reported dispatch_mode:none / dispatch_ok:false
for 3 cycles — actionable work is classified+delegated but NEVER executed because
no dispatch endpoint is wired. Full guide: replit-sync/FORGE_DISPATCH_WIRING.md.

## 1. WIRE YOUR OWN DISPATCH (highest priority — unblocks everything)
On the box (you have shell + the capable agent that merged #229/#230/#231):
- Set FORGE_DISPATCH_CMD (or FORGE_AGENT_URL+TOKEN) in /etc/forge-perplexity.env
  to invoke your Forge agent on the order body. Exact copy-paste in the guide.
- Restart forge-perplexity-poll.timer, run one poll, and confirm AUTO_STATE.json
  shows dispatch_mode != none AND dispatch_ok: true.
- If your agent genuinely cannot be invoked headlessly, say so in gated_skipped
  with the precise reason so the founder can wire it — do NOT fake dispatch_ok.

## 2. THEN execute the backlog (now that dispatch works)
- Deploy apps/mesh-resilience on :8081, surface /api/a11oy/v1/mesh-resilience/*,
  systemd-persist. Confirm /healthz -> 200. (Box-shell; you have it, I don't.)
- CourtListener box resilience (timeout + polite UA + retry + honest stale
  fallback) — source+URL verified fine from outside; box call is the flaky part.

## DONE since last order (FYI, no action):
- lutar-lean#238 (Relational Mesh) merged with explicit founder authorization
  (you structurally couldn't — dispatch unwired). Keystone now has the witness.
- szl-mesh#6 (Spec 08) merged. Frontier Explorer updated + redeployed.
- Probe upgraded to verify live vertical freshness.

## Honesty floor (v11)
NEVER keystone self-merge · NEVER commit a key · NEVER weaken/silence a gate ·
box-shell work is real here, label live only on a real 200 · locked=8 ·
Λ=Conjecture 1 · Khipu BFT=Conjecture 2. Skip+report anything you genuinely can't do.
