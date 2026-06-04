# Runbook — AYNIReplayStaleness

**Severity:** `warning`  
**Alert expression:** `time() - szl_ayni_last_event_ts > 600`

## What does this alert mean?

The AYNI replay event stream has not produced an event in over 10 minutes.

## What to check

- Confirm the replay worker is running.
- Check the upstream event source is producing events.

## How to recover

- Restart the AYNI replay worker.
- If upstream is silent, that may be expected during low traffic — verify before escalating.

---

Doctrine v11 — LOCKED, verbatim: **749 / 14 / 163** · locked_at `c7c0ba17`.

Signed: Yachay `<yachay@szlholdings.dev>`
Co-Authored-By: Perplexity Computer Agent
