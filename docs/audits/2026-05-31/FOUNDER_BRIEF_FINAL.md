# FOUNDER BRIEF — FINAL (Verified Close-Out)

**Author:** Yachay (Perplexity Computer Agent), under CTO authority
**Date:** 2026-06-01 ~05:10 EDT
**Rule of this brief:** Nothing is marked GREEN unless I personally re-derived it this session with a command + output shown. Two columns: **REAL (verified now)** vs **STAGED (pending founder/maintainer action)**.

---

## 1-PAGE SUMMARY

**Bottom line:** The Doctrine v11 LOCKED numbers are **verified and correct** (749 / 14 / 163 @ `c7c0ba17`). Six of seven KEEP-LIVE Spaces report `RUNNING`; **rosie is DOWN (RUNTIME_ERROR / HTTP 503)** and **anatomy-3d serves 404 at `/`** despite a RUNNING runtime — both need attention. The two real staged patches (PURIQ-OS, Killinchu bridge) are now **pushed as additive PRs** using the founder token. I could **not** independently re-derive the per-Space route counts (73/149, 47, 43, 31/21, 162) from public endpoints — those Spaces serve HTML for every probed path, so a `200` does not by itself prove a working JSON API. I am flagging those counts as **builder-asserted, not independently verified**.

### Top 5 founder actions
1. **Fix rosie** — Space is `RUNTIME_ERROR` (HTTP 503 on `/` and `/healthz`). Check build logs / restart. Until then rosie is RED.
2. **Fix anatomy-3d serving** — runtime `RUNNING` but `/`, `/index.html`, `/healthz` all 404. Static entry point not wired. (rosie-3d also 404 on `/healthz` but verify its viewer path.)
3. **Set `HF_TOKEN` secret on a11oy** — required for a11oy's own outbound HF calls / PURIQ-OS replay-hash + any self-push; currently the patch lands but activation needs this.
4. **Merge the two open PRs** after review: a11oy **PR #2** (PURIQ-OS, additive) and killinchu **PR #1** (bridge module, additive). Both are reviewable, neither touches `main` until you merge.
5. **Founder housekeeping:** Zenodo DOI toggle (publish), customer-portal → public, hardware order, Greene call — these remain founder-only actions (not technically verifiable by me; carried forward from prior briefs as STAGED).

### Pre-Warhacker readiness score: **6.5 / 10 — CONDITIONAL GO**
Doctrine math locked + 6/7 Spaces running + patches landed as PRs. Held below 8 by: rosie down, anatomy-3d not serving, unverifiable public API surface (route counts), and DSSE still at `PLACEHOLDER-HMAC` / SLSA L1 (honest, not yet hardened). See `PRE_WARHACKER_READINESS_VERDICT.md`.

---

## REAL (verified this session) vs STAGED (pending action)

| Item | REAL — verified now (with evidence) | STAGED — pending |
|---|---|---|
| **Doctrine v11 LOCKED** | **749 decl / 14 unique axioms (15 raw, 1 dup) / 163 sorries @ `c7c0ba17c2eaec60ad38ea9172b4a0d9ca0b582f`** — from `lean_numbers_c7c0ba1.json` + `PHASE1_NUMBER_RECONCILIATION.md`. HF dataset `lutar-lean-source` main shows older 626/14/189; canonical c7c0ba17 lives in GitHub `szl-holdings/lutar-lean`. | Sync HF dataset README to canonical c7c0ba17 numbers (it currently shows stale 626/189). |
| **a11oy** | Space `RUNNING`, sha `a44b38bd2a72b24d844e26c3fa5722b31947a7b7`. Responds 200; PURIQ-OS PR #2 created. | Route count "73 + 149 SPA" not publicly verifiable; merge PR #2; set HF_TOKEN secret. |
| **amaru** | Space `RUNNING`, sha `5c57d846f6507f64d219d249ef8b70683f778090`. Root 200. | "47/47" not re-derived (serves HTML for all paths incl. bogus). |
| **sentra** | Space `RUNNING`, sha `ed91f0347b6a9d754636c32171ab717990a8c896`. | "43/43" not re-derived. |
| **killinchu** | Space `RUNNING`, sha `d0da31527695a9507b1eac56866605ce99fc5a69`. Bridge PR #1 created. | "31 backend + 21 SPA" not re-derived; merge PR #1. |
| **rosie** | **DOWN** — runtime `RUNTIME_ERROR`, HTTP 503 on `/` and `/healthz`. sha `2045b12b8cc452096bf9bb846a6479d52946fac8`. | "162/162" cannot be tested while down. **Fix required.** |
| **anatomy-3d** | runtime `RUNNING`, sha `fb6b9142c9ad56aa3d238e5ef5c78b7fd9731f5c`, but `/`, `/index.html`, `/healthz` = **404**. | Entry point not serving — fix. |
| **rosie-3d** | runtime `RUNNING`, sha `b2d27bf63baf17d1fc173837097b4a909cfb2109`. `/healthz` 404 (expected for static). | Confirm viewer path serves. |
| **README (org card)** | runtime `RUNNING`, sha `f57d85c6be033d6b94bd9edabf5a75288fdef771`. | — |
| **PURIQ-OS patch** | **Pushed** as a11oy PR #2, commit `0a29f923e57961387bc4cd97e7942612e95ae86a`. | Maintainer merge + apply Dockerfile.patch/requirements + `mount_puriq(app)`. |
| **Killinchu bridge patch** | **Pushed** as killinchu PR #1, commit `932adeed5718dce127792bba94ab392b8098b12e`. | Maintainer merge + add register call in serve.py. |
| Zenodo / customer-portal / hardware / Greene | — | Founder-only actions (not agent-verifiable). |

---

## Honest flags (overclaim watch)
- **Route-count claims (73/149, 47, 43, 31/21, 162) are NOT independently verified.** Public probing shows these Spaces return `text/html` (the app shell) for `/healthz`, `/v1/*`, and even nonsense paths — so an HTTP `200` is **not** proof of a working JSON API at that path. The counts may be correct in source, but I could not re-derive them from outside.
- **rosie is presented as live "162/162" elsewhere — it is currently DOWN.** Do not ship rosie as GREEN.
- **anatomy-3d is RUNNING but not serving** — do not present as live until `/` returns content.
- **DSSE/Khipu signatures are `PLACEHOLDER-HMAC`, SLSA L1** (per staged patch READMEs) — honest, not yet production-hardened.

— Yachay
