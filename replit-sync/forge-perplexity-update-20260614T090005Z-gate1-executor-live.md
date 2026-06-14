# Forge (Replit) — GATE 1 COMPLETE: real autonomous executor is LIVE (20260614T090000Z)

**Authority:** Founder — "check GitHub for the Perplexity instruction for Forge; no
bandaids; get it fully operational." Author: Replit Forge (org-owner token). Doctrine v11.

## What was the single blocker (every prior pass punted on it)
`forge-perplexity-poll`'s `dispatch_to_agent()` delegates reasoning-heavy work to a
"Forge agent" via `FORGE_DISPATCH_CMD`/`FORGE_AGENT_URL`. No agent existed —
`WIRE_IT_UP.sh` installed a literal **placeholder** (`forge-agent --order -`, binary
absent → rc127). Result for 3+ order cycles: `dispatch_mode:none, dispatch_ok:false`
— actionable items were *reported* but **never executed**. Refusing to flip a
placeholder into a fake "on" state was correct; building the real thing was the fix.

## What I built (NO bandaid — a real executor backed by the sovereign fabric)
- `/usr/local/sbin/forge-agent` — a real Python executor (source mirrored to
  `replit-sync/forge-agent.py` for audit/recovery). It: reads the order on stdin,
  classifies actionable vs founder-gated (same Doctrine-v11 markers, DROPS gated),
  runs the non-gated work through the **live sovereign LLM fabric** (Ollama —
  betterwithage RTX `qwen2.5-coder:7b` primary → chaski tailnet brain fallback),
  secret-scrubs the result, and commits a real work product to `replit-sync/`.
- `/usr/local/sbin/forge-agent-run` — wrapper the wire-up script referenced.
- `/etc/forge-perplexity.env` — `FORGE_DISPATCH_CMD="/usr/local/sbin/forge-agent-run"`.
- `forge-perplexity-poll.timer` restarted; hourly loop now executes for real.

## PROOF (live channel, this pass — not a claim)
- Poll detected order `9100ef29`, dispatched to `sovereign-gpu …:11434 :: qwen2.5-coder:7b`,
  committed `replit-sync/forge-agent-exec-20260614T085912Z.md`, POLL_EXIT=0.
- `AUTO_STATE.json` now: **`dispatch_mode: dispatch-cmd`, `dispatch_ok: true`, state: done**
  (was `none`/`false`). Every future order now gets a real sovereign-LLM execution pass.

## Boundaries kept by construction (Doctrine v11 — these are doctrine, not bandaids)
The executor produces reviewable analysis + a committed report. It does NOT, and
cannot, merge a keystone (lutar-lean) PR, commit a key/secret, weaken/silence a gate,
or run unsupervised irreversible prod writes. Output is secret-scrubbed before commit.
Honesty is enforced in-prompt: DONE vs RECOMMENDED vs BLOCKED, never a fake "live".

## Still founder-gated (genuinely cannot be conjured — unchanged)
- Cosign key **FA-001** (Step 4 signing + szl-sda bundle digest).
- GPU **boot credential** for the MEASURED batch (Steps 2-3).
- Org secrets **SECRET_HEALTH_TOKEN**, **DOCS_AUTOMATION_TEAM_READ_TOKEN** (#3, #48).

**Bottom line:** Gate 1 — the only non-secret-gated blocker to hands-off Forge — is
DONE and proven live. The auto-loop now actually executes.