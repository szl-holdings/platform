# FORGE — GENIUS-LEVEL EVOLUTION ORDER (compose the frontier, don't add noise)

Date: 2026-06-16 ET · Founder: Stephen Lutar (full-access green light, "genius level evolve") · Doctrine v11

## WHERE WE ARE (verified live)
The estate is now FULLY WIRED — every surface has a real backing API:
- Immune (Hukulla): /api/a11oy/v1/immune/{verdict,...} — real fail-closed NP gate + signed Khipu receipts. Codenames PURGED.
- Materials (Q'allariy): /api/a11oy/v1/materials/{novelty,certify,screen,status} — crystal novelty cert + PAC-Bayes bound + immune-gated screen.
- 14 swept surfaces LIVE: sda, mbse, factory, quant, qbio, holographic, nemo, qhawaq, waqay, yupay, willay, autoreview, fabric, tawantin.
- Frontier manifest: /api/a11oy/v1/frontier/manifest — 8 honest tiles, all_sources_live:true, 258 signed receipts.
- Mesh: rtx+chaski computing, MEASURED joules climbing. CI green. Doctrine intact (locked=8 @ c7c0ba17).

## THE GENIUS MOVE — THE COMPOSITE INFERENCE-PROVENANCE RECEIPT (turn the ROADMAP tile REAL)
The frontier manifest already NAMES the #1 play and honestly labels it ROADMAP: a single **composite inference-provenance receipt** that binds, in ONE signed Khipu envelope, every guarantee the estate produces for a single governed action. NOBODY in the AI-for-science field has this. Build it for real — this is the capstone that makes the whole estate one verifiable instrument.

### Build: POST /api/a11oy/v1/provenance/receipt  (new module szl_provenance_receipt.py)
Given a governed action {action, optional model, optional crystal/material}, produce ONE signed Khipu receipt (SZL.Provenance.Composite.v1) that COMPOSES — by CALLING the already-live surfaces in-process, never re-implementing, never fabricating:
  1. IMMUNE verdict (call szl_immune) — allow/deny + signals (the fail-closed NP gate).
  2. PAC-BAYES bound (call szl_materials.certify path) when a model/family is named — the population-risk certificate.
  3. MEASURED energy (call the energy operator joule-truth) — joules for the inference, labeled MEASURED only on a real NVML delta else MODELED/SAMPLE.
  4. MODEL provenance — the governed model hash/label from szl_llm_registry (nemo = Qwen3-32B Apache) when inference ran.
  5. LEAN backing pointers — Λ=Conjecture 1, immune NP proven-backing, novelty=ROADMAP — the exact Lean refs.
  6. KHIPU chain head — the composite receipt's own digest + prev, chain_verified.
The response is the single envelope a judge can verify end-to-end: "this action was immune-screened (verdict X), its model carries PAC-Bayes risk ≤ ε, it cost J MEASURED joules on sovereign metal, and all of it is in one tamper-evident signed receipt." HONESTY: every sub-guarantee keeps its own label; if a sub-source is down, that field says UNAVAILABLE — the composite NEVER upgrades a label or mints a guarantee that didn't happen. The composite is REAL only because each part is real; if a part is absent, say so.
Add GET /api/a11oy/v1/provenance/receipt/{digest} to re-fetch+verify a prior composite from the chain. Then FLIP the frontier manifest's "Composite inference-provenance receipt" tile from ROADMAP to MEASURED/LIVE — but ONLY once the endpoint genuinely returns a real composed+signed receipt (prove with a live curl first; never flip the label on a stub).

## ALSO (additive, genius polish — only if real)
- A /provenance page (or a panel on the frontier manifest page) that runs one action through the composite receipt and shows the single envelope with each guarantee + its label + the verify pointer. No runtime CDN.
- DSSE: if the founder cosign key is NOT available, the composite signature stays honest DSSE_PLACEHOLDER — do NOT fake a signature. (Real cosign signing = founder-gated, leave the hook.)

## DOCTRINE HARD GATES (never weaken)
locked = EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17 (add NOTHING); Λ=Conjecture 1; Khipu=Conjecture 2; PAC-Bayes Lean = SORRY/ROADMAP; novelty injectivity = ROADMAP; trust never 100%; SLSA L1/L2/L3-roadmap; effectors SIMULATED; 0 runtime CDN; NO user-visible codenames; never commit a key; never fabricate a joule/receipt/guarantee; a label is NEVER upgraded; honest BLOCKED/UNAVAILABLE beats fake green. The half-state — claiming more than is real — is the only unacceptable outcome.

## MECHANICS + PROVE
New module szl_provenance_receipt.py, register() pattern (mirror szl_kverify/szl_immune/szl_materials), registered EARLY before SPA catch-all + per-file Dockerfile COPY + add to copy-sync-lockstep image_only if a new web page. ast.parse before push. Verify LIVE (retry 8-12x): POST /provenance/receipt with {action:{cmd:"synthesize Al2O3"},family:"oxides"} → one envelope containing immune verdict + PAC-Bayes bound + energy label + model label + Lean refs + chained Khipu digest. Then GET it back by digest and confirm chain_verified. Keep box auto-deploying + rebuild Space.

## REPORT
Write to AUTO_STATE (key: composite_provenance) + a forge-report with the LIVE composed-receipt curl. NOTIFY the founder only on the real milestone: "composite inference-provenance receipt LIVE" with the digest + the curl proof, or an honest BLOCKED.
