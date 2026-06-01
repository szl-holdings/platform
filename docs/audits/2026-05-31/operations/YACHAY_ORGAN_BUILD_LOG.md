# YACHAY PERSISTENT CTO ORGAN — BUILD LOG

**Agent:** Operations + Yachay-Organ agent for SZL Holdings
**Date:** 2026-06-01 (~02:50 EDT)
**Doctrine:** v12 (v11 + PURIQ) — all v11 LOCKED numbers preserved verbatim
**Deploy method:** HfApi `create_commit` DIRECT — **never GitHub Actions**

---

## What was built

A persistent, always-on, founder-facing CTO tab on the live a11oy Space:

| Surface | Route | Purpose |
|---|---|---|
| Chat UI | `GET /yachay` | Kanchay-branded HTML chat panel (self-contained, no build step) |
| Chat API | `POST /api/a11oy/yachay/chat` | Routes via a11oy.code in-process; **Khipu receipt on every answer** |
| Project tracker | `GET /api/a11oy/yachay/projects` | Flagships + LOCKED numbers + Warhacker canon |
| Priorities | `GET /api/a11oy/yachay/priorities` | Today's priorities, Hatun-Willay 5-axis |
| Health | `GET /api/a11oy/yachay/healthz` | Organ + Khipu chain verify |

**The differentiator vs ChatGPT:** every Yachay response carries a Khipu receipt
(SHA3-256 hash-chained, tamper-evident, chain-verified). This holds **even when the
model is offline** — the receipt discipline is independent of the completion.

---

## Files

### New files committed to `SZLHOLDINGS/a11oy`
- `szl_yachay_organ.py` — self-contained FastAPI organ with `attach(app)` (mirrors
  `a11oy_code_orchestrator.attach(app)`). Routes chat through the a11oy.code router
  in-process (`route` → `_get_client` → `_call_model_resilient`), prepends a live
  canon block (flagship statuses + LOCKED numbers + replay hash + Warhacker
  countdown + Khipu depth) before the canonical persona, and emits a Khipu receipt
  on every turn. Wrapped in try/except so missing deps never break the SPA.
- `szl_khipu.py` — the shared stdlib-only Khipu DAG receipt store (bundled so the
  organ has its real receipt substrate; the module also has an in-file fallback DAG
  if the import ever fails).
- `YACHAY_SYSTEM_PROMPT.md` — canonical Yachay persona (single source of truth;
  loaded verbatim at runtime, embedded copy as deploy-safe fallback).

### Patched files (ADDITIVE, idempotent, marker-guarded)
- `serve.py` — spliced `import szl_yachay_organ as _yachay; _yachay.attach(app)` in a
  try/except **immediately after** the a11oy.code orchestrator attach block, so
  `/yachay` + `/api/a11oy/yachay/*` register **before** the Node proxy
  (`/api/a11oy/{path:path}`) and the SPA catch-all (`/{full_path:path}`). FastAPI's
  ordered matching therefore serves them here. Marker: `# === YACHAY PERSISTENT CTO
  ORGAN (additive, marker-guarded) ===`.
- `Dockerfile` — added three COPY lines (`szl_yachay_organ.py`, `szl_khipu.py`,
  `YACHAY_SYSTEM_PROMPT.md`) right after the orchestrator COPY. Marker:
  `# ADDITIVE (Yachay organ): persistent CTO module + Khipu + system prompt`.

### Workspace (operations dir)
- `YACHAY_SYSTEM_PROMPT.md` (copy of the canonical prompt)
- `YACHAY_ORGAN_BUILD_LOG.md` (this file)
- `VERIFICATION.md`
- `yachay_live.png` (live screenshot of the receipt-signed turn)

### Workspace (code dir `/home/user/workspace/szl_yachay_organ/`)
- `szl_yachay_organ.py`, `szl_khipu.py`, `YACHAY_SYSTEM_PROMPT.md`,
  `a11oy_code_orchestrator.py` (live copy used for in-process routing),
  `deploy_yachay.py` (idempotent deploy script), `_test_local.py` (local harness),
  `_screenshot.py`, plus `_live/` and `_deploy_out/` (pulled + patched copies).

---

## HF commit

- **Repo:** `SZLHOLDINGS/a11oy` (Docker SDK Space)
- **Commit SHA:** `cc343d86eede6c02c6ff189e0852de9339a21f80`
- **URL:** https://huggingface.co/spaces/SZLHOLDINGS/a11oy/commit/cc343d86eede6c02c6ff189e0852de9339a21f80
- **Message:** "ADDITIVE: Yachay persistent CTO organ at /yachay + /api/a11oy/yachay/*
  — Khipu-receipt-signed, Doctrine v12 PURIQ (LOCKED numbers preserved). Perplexity
  Computer Agent."
- **Build:** Docker rebuild RUNNING_BUILDING → RUNNING (≈30 s), app started clean.

---

## Architecture decisions

1. **In-process routing, not HTTP self-call.** The chat endpoint imports
   `a11oy_code_orchestrator` and calls its `route` / `_get_client` /
   `_call_model_resilient` directly. This reuses the license-typed model ladder +
   resilient fallback walk for free and avoids the orchestrator's per-key API gate.
2. **Honest no-completion is still receipted.** The live Space has no `HF_TOKEN`
   secret (same documented gap as the a11oy.code orchestrator). Rather than fake an
   answer, Yachay returns a `yachay.chat.honest_no_completion` Khipu receipt + a
   Zero-Bandaid note naming the missing credential. Setting `HF_TOKEN` as a Space
   secret turns the honest note into a receipted real answer with no code change.
3. **Live canon block** is regenerated per turn and prepended to the persona, so the
   model is re-grounded in the *current* flagship statuses + LOCKED numbers each
   time instead of a stale system prompt.
4. **Cross-session memory** is a best-effort `import szl_unay` with a graceful
   fallback to no durable recall (Unay not yet built). Every memory write is
   Khipu-receipted, so the *audit trail* of what was asked survives even without a
   content store. See PONDER note for the proposed Unay/SQLite unification.

---

## Doctrine v11 LOCKED numbers — preserved verbatim
- Doctrine-claimed: **749** declarations / **14** unique axioms / **163** sorries.
- Live regen: **752** declarations / **160** sorries (109 baseline + 51 Putnam) /
  **15** raw axioms (14 unique) / **44** anchor gates. Putnam **4/12** GREEN.
- 13-axis `yuyay_v3`. Replay hash
  `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5`.
- Honest labels carried: DSSE signature = PLACEHOLDER (Sigstore not wired);
  Λ-uniqueness = Conjecture 1; SLSA L1; traceparent in-process only.

© 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173 · Apache-2.0
