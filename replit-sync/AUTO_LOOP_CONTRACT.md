# Forge ⇄ Perplexity full-auto loop — handshake contract

This is the machine contract for the autonomous order loop between **Perplexity**
(parent / CTO+PM, "your side") and **Forge** (the box-side hourly executor on
167.233.50.75, systemd timer `forge-perplexity-poll.timer`).

## The two files (both live in `replit-sync/`)

| File | Direction | Meaning |
|------|-----------|---------|
| `NEXT_ORDER.md`   | Perplexity → Forge | The single inbox. Overwrite its body to send the next order. |
| `AUTO_STATE.json` | Forge → Perplexity | Machine status. Poll it to know when Forge is done. |

A dated `forge-perplexity-update-<YYYYMMDD>.md` is also written as a human-readable mirror.

## The loop (full auto)

1. **You (Perplexity) send an order:** commit a new body to `replit-sync/NEXT_ORDER.md`
   (markdown — use `-` bullets or `1.` numbered lines for each task; headings are
   treated as structure, not tasks). Note the commit SHA you just made.
2. **Forge picks it up (within ≤1h):** the hourly timer detects that
   `NEXT_ORDER.md`'s latest commit SHA changed, classifies each task as
   *actionable* vs *founder-gated*, runs the safe work / hands reasoning-heavy
   work to the Forge agent, and **auto-skips every founder-gated item**
   (anything mentioning keys, secrets, PATs, cosign, private key/PEM, HSM/KMS,
   major dep bumps, relicense, or cosign warn→enforce).
3. **Forge reports done:** writes `AUTO_STATE.json` with `state: "done"` and the
   `order_sha` it processed, plus `actionable`, `delegated_to_agent`,
   `gated_skipped`, `report`, and `probes`.
4. **You send the next order** when you observe, in `AUTO_STATE.json`:
   `state == "done"` **AND** `order_sha == <the commit SHA from step 1>`.
   Then overwrite `NEXT_ORDER.md` again → loop repeats.

### `AUTO_STATE.json` shape
```json
{
  "order_sha": "<sha of the NEXT_ORDER.md commit being processed>",
  "state": "processing | done",
  "seen_at": "<UTC ISO8601>",
  "updated_at": "<UTC ISO8601>",
  "idle": false,
  "actionable": ["..."],
  "delegated_to_agent": ["..."],
  "dispatch_mode": "agent-url | dispatch-cmd | none",
  "dispatch_ok": true,
  "gated_skipped": ["..."],
  "report": "replit-sync/forge-perplexity-update-YYYYMMDD.md",
  "probes": {"https://a-11-oy.com/healthz": 200},
  "doctrine": "v11: locked=8, Lambda=Conjecture 1, never commit a key"
}
```


## `[AUTH-OK]` founder-authorization override (added 2026-06-15)

The per-line keyword auto-skip (keys/secrets/cosign/sign/PEM/...) has ONE override:
when `NEXT_ORDER.md` declares `FOUNDER_SIGNING_AUTHORIZED = TRUE` at the top AND a
task line/heading is tagged `[AUTH-OK]`, that task is **ACTIONABLE** even if it names
attestation/signing tooling — the founder has explicitly authorized it. Lines WITHOUT
`[AUTH-OK]` keep normal gating. The credential is still read ONLY from the box secret
store and is NEVER printed or committed. The Forge agent (dispatch-cmd) executes
`[AUTH-OK]` signing tasks; if the box parser cannot yet honor the tag, the agent MUST
still run any `gated_skipped` item whose source heading carries `[AUTH-OK]` + the
TRUE flag. Honest BLOCKED only if the credential is genuinely absent from the box.

## Guarantees / boundaries
- **Idempotent:** an unchanged order SHA is a no-op; missing `NEXT_ORDER.md` is a no-op.
- **Founder-gated items are never auto-run** — they are listed in `gated_skipped`
  and surfaced for the founder. Doctrine v11 is honored (never commit a key, never
  weaken a gate, no Lean self-merge).
- **Reasoning-heavy execution** is handed to the Forge agent when an endpoint is
  wired (`FORGE_AGENT_URL` / `FORGE_AGENT_TOKEN` or `FORGE_DISPATCH_CMD` in
  `/etc/forge-perplexity.env` on the box). Until then, actionable items are
  detected, reported, and the founder is pinged (`dispatch_mode: "none"`).
- An "idle" `NEXT_ORDER.md` (contains *idle / no pending order / no action /
  standby*) is acknowledged as a handshake heartbeat with no execution.

— maintained by the box timer `forge-perplexity-poll` (see `/usr/local/sbin/forge-perplexity-poll`)