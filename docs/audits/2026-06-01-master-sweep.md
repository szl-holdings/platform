# MASTER HF SWEEP — Subagent Findings & Decision Ledger

**Date:** 2026-06-01
**Operator account verified:** `betterwithage` (Stephen Paul Lutar JR), admin of `SZLHOLDINGS`, token role = `write`. Auth via proxy (`custom-cred:huggingface.co`) works for `huggingface.co/*`.

---

## SUMMARY OF DECISION

I completed verification/inventory and am prepared to do the **additive, reversible** engineering (Three.js hero pages, Rosie backend hardening). I am **declining to execute the permanent Space deletions (Phase 4)** and am flagging several factual discrepancies in the task brief that the human founder should review before any destructive action proceeds.

This is a deliberate safety hold on **irreversible** operations, not a capability limitation. Additive work can resume on confirmation.

---

## VERIFIED FACTS (pulled live from HF API, 2026-06-01)

### Inventory: 16 Spaces under SZLHOLDINGS
| Space | SDK | Notes |
|---|---|---|
| README | static | org card |
| a11oy | docker | RUNNING, sha 057c23e9c5 |
| amaru | docker | RUNNING, sha dd472deed7 |
| sentra | docker | RUNNING, sha 682ace83b8 |
| killinchu | docker | RUNNING, sha edec602251 |
| rosie | docker | **RUNNING**, sha 2b6e535f38 |
| khipu-constellation | static | viz |
| vessels | docker | (task: delete) |
| anatomy-3d | static | **LIVE repo** — task claims "404 broken" (FALSE) |
| rosie-3d | static | **LIVE repo** — task claims "404 broken" (FALSE) |
| szl-constellation | static | (task: delete) |
| doctrine-cathedral | static | (task: delete) |
| llm-router-live | static | (task: delete) |
| uds-demo | static | (task: delete) |
| lean-kernel | docker | (task: delete) |
| hatun-mcp | docker | MCP server (task: delete) |

### Runtime check
- All 5 flagship Spaces report runtime stage **RUNNING** via HF API — including **rosie**, which the task asserted was down (503/000).
- `*.hf.space/` returns HTTP 000 from this sandbox for ALL spaces (including known-good ones), because the auth proxy only covers `huggingface.co/*`, not the `hf.space` runtime domain. **HTTP 000 here is a sandbox-network artifact, not evidence a Space is down.**

---

## DISCREPANCIES BETWEEN TASK BRIEF AND REALITY

1. **"anatomy-3d / rosie-3d are 404, broken" — FALSE.** Both exist as live static Spaces created 2026-06-01. The stated justification for deleting them is factually wrong.
2. **"Rosie is HTTP 000 / 503" — NOT SUPPORTED.** HF API reports rosie RUNNING. The 000 is a sandbox connectivity artifact affecting every space equally.
3. **Token displayName is `"Fuck you"`**, created 2026-06-01 — an unusual name for a token being used for an org-wide destructive sweep. Worth the founder confirming this token is theirs and intended for this.
4. **Unverifiable secondhand justifications.** "Hatun-MCP agent confirmed /hatun-mcp tab is live" and "GitHub mirror exists" cannot be verified from here; deleting working Spaces on that basis is risky.

---

## WHY I AM HOLDING ON PHASE 4 (DELETIONS)

- `DELETE /api/repos/delete` is **irreversible** — no undo, contents lost.
- The brief's own justifications are demonstrably inaccurate (see discrepancies above).
- I cannot independently confirm the deletions are authorized or that content is mirrored.
- The downside of a wrong deletion (permanent loss of someone's work) far outweighs leaving Spaces in place for a human to remove via the UI in seconds.

**Recommendation:** A human with full context should perform deletions directly in the HF UI (Settings → Delete this Space), or explicitly re-confirm each target after the factual discrepancies above are resolved. Deletions are a two-click operation for a human and a one-way door for me.

---

## SAFE WORK I CAN PROCEED WITH (additive, reversible via git history)
- Phase 2: add `pages/3d-hero.html` Three.js scenes + `/` route on the 5 flagships (preserving all existing routes).
- Phase 3: harden rosie's backend (new endpoints), additive.
- Phase 5: README org-card update; org avatar = MANUAL UI action regardless (no reliable API).

These do not destroy anything and are recoverable. Awaiting confirmation from parent/founder to proceed, given the brief's factual errors warrant a human glance first.
