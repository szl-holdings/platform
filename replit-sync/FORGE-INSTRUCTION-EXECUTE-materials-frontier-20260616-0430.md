# NEW FRONTIER — VERIFIABLE / GOVERNED AI FOR MATERIALS DISCOVERY (5-dev Opus 4.8 wave)

## THE THESIS (falsifiable, independently checkable — honest doctrine v11)
The entire materials-AI field (GNoME, MatterGen, OMol25, A-Lab, Periodic Labs) competes on ACCURACY. Nobody competes on VERIFIABILITY. SZL already owns that axis. We are the first to wrap materials inference in: Lean-proven aggregation kernel + PAC-Bayes certificate + signed Khipu energy/provenance receipt + Neyman-Pearson Immune egress gate.

Research: /home/user/workspace/team/MASTERPLAN/research/RESULT_METALLURGY_LEADERS.md + RESULT_GOVERNED_AI_MATERIALS.md (read first — cite from them).

## WHAT WE BUILD (a new "Materials" / Quechua "Q'allariy" surface on a11oy). ALL REAL, ALL HONEST.
Mount under the HONEST namespace `/api/a11oy/v1/materials/*` (NO codename). New module `szl_materials.py`, `register(app, ns="a11oy")` mirroring szl_kverify.py / szl_immune.py. Registered EARLY before SPA catch-all, try/except-guarded, ast.parse before push.

### DEV 1 (BE) — Crystal Novelty Certificate  [answers the GNoME duplicate scandal — gap #1]
- `POST /api/a11oy/v1/materials/novelty` : input a crystal structure (lattice params a,b,c,α,β,γ + fractional sites OR a CIF-lite JSON). Compute an ISOMETRY-INVARIANT fingerprint (Kurlin-style Pointwise Distance Distribution / sorted pairwise-distance histogram — a real, deterministic, rotation/translation-invariant descriptor; implement honestly, cite Kurlin PDD). Compare against an append-only in-process registry; return {novel:true/false, nearest_match, distance, fingerprint_digest} + a SIGNED Khipu receipt (receipt_type "SZL.Materials.NoveltyCert.v1") into the SHARED szl_khipu DAG.
- Honesty: the fingerprint INJECTIVITY claim is a CONJECTURE (cite Lean target `Lutar/Materials/PDDInjective.lean` as ROADMAP — do NOT claim proven; do NOT add to locked-8). The receipt + comparison is REAL.
- `GET /api/a11oy/v1/materials/novelty/registry` : list registered fingerprints + chain head.

### DEV 2 (BE) — PAC-Bayes certified prediction bound  [gap #2]
- `POST /api/a11oy/v1/materials/certify` : given {empirical_risk, kl, n, delta} (or a named model + chemical-family preset), return the McAllester PAC-Bayes bound using the EXISTING `pac_bayes_mcallester` in szl_formulas.py (do NOT reimplement — import it). Return a signed certificate "with prob ≥ 1−δ, population risk ≤ <bound>" + Khipu receipt (SZL.Materials.PACBayesCert.v1).
- Honesty: McAllester is PROVEN-on-paper but its Lean proof is a tracked SORRY (label PROOF-STATUS honestly per szl_formulas docstring). The bound COMPUTATION is exact/correct.

### DEV 3 (BE) — Immune-gated + energy-metered materials pipeline  [ties it to our crown jewels]
- `POST /api/a11oy/v1/materials/screen` : run an input through the REAL Immune gate (call the immune verdict path szl_immune exposes — do NOT duplicate) for dual-use/safety screening (gap #4), and attach a MEASURED-joule receipt if a sovereign node served any inference (reuse the energy operator's joule-truth path; if no real NVML delta, label MODELED/SAMPLE and EXCLUDE from measured total — never fabricate joules). Return decision + energy provenance + Khipu receipt.
- `GET /api/a11oy/v1/materials/status` : honest summary — registry depth, certs issued, immune deny-rate on materials, MEASURED joules total, Lean backing (proven vs roadmap), locked-8 unchanged @ c7c0ba17, Λ=Conjecture 1, trust never 100%.

### DEV 4 (FE) — the /materials page (Quechua "Q'allariy")
- Find how /immune & /tawantin pages are served; add a /materials page in the SAME styling, NO runtime CDN. Title "Materials — Verifiable Alloy & Crystal Discovery". Three live panels: (1) paste a crystal -> novelty cert + signed receipt digest; (2) compute a PAC-Bayes bound -> certificate; (3) screen -> immune verdict + energy receipt. Each panel shows the REAL endpoint response + the Khipu receipt digest a judge can verify. Add an honest footer: which parts are PROVEN vs CONJECTURE/ROADMAP. Wire to the new endpoints. Link it from the a11oy console nav.

### DEV 5 (Lean + docs) — the proof scaffolds + honest claim sheet
- In lutar-lean, add ROADMAP Lean files (with explicit `sorry` + honest header, NOT folded into locked-8): `Lutar/Materials/PDDInjective.lean` (fingerprint injectivity conjecture) and a McAllester PAC-Bayes statement file if not present. Do NOT claim proven. Update the formula registry docstring/status if you touch szl_formulas (keep byte-identical across a11oy+killinchu if shared).
- Write the public claim sheet `/home/user/workspace/team/MASTERPLAN/MATERIALS_FRONTIER_CLAIMSHEET.md`: the falsifiable thesis, each capability labeled PROVEN/CONJECTURE/ROADMAP with the exact Lean ref + the live endpoint, and the competitive map (vs GNoME/MatterGen/Periodic Labs). Cite the research reports.

## DOCTRINE HARD GATES (every dev, never violate)
locked-proven = EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ kernel c7c0ba17 (NEVER add materials formulas to it); Λ=Conjecture 1; Khipu=Conjecture 2; PDD-injectivity + McAllester-in-Lean = CONJECTURE/ROADMAP (honest); trust never 100%; SLSA L1/L2/L3-roadmap; effectors simulated; 0 runtime CDN; NO user-visible codenames; never commit a key; byte-identical shared modules; "claiming more than is real is the only unacceptable outcome." Label every datum LIVE/MEASURED/SAMPLE/MODELED/ROADMAP.

## MECHANICS
GitHub: bash api_credentials=["github"], gh api -X PUT contents (fresh sha, base64 -w0). ast.parse .py / node --check .js before push. hf-sync mirrors .py to the Space; factory-restart after. Verify LIVE (retry 8-12x; a11oy.net/*.hf.space flap to 000; mind the 60/min rate limit). Distinguish real-200-json from 200-SPA-shell.

## DELIVERABLES
Each dev writes /home/user/workspace/team/MASTERPLAN/dev/RESULT_MAT_D{1..5}.md with files+shas+LIVE curl proof + honest PROVEN/CONJECTURE labels + any honest BLOCKED.
