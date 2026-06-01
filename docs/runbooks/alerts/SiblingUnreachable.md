# Runbook — SiblingUnreachable

**Severity:** `warning`  
**Alert expression:** `szl_sibling_health{state="up"} < 4`

## What does this alert mean?

Fewer than 4 of the 5 sibling flagships are reachable from the mesh.

## What to check

- Cross-reference with FlagshipDown to see which sibling(s) are out.
- Check mesh connectivity / DNS for szlholdings-*.hf.space.

## How to recover

- Recover the down sibling(s) per FlagshipDown.
- If network partition, the mesh degrades gracefully — confirm no cascading failures.

---

Doctrine v11 — LOCKED, verbatim: **749 / 14 / 163** · locked_at `c7c0ba17`.

Signed: Yachay `<yachay@szlholdings.dev>`
Co-Authored-By: Perplexity Computer Agent
