# SZL → Replit/Forge Sync Payload — 2026-06-08

This folder is the Perplexity-Computer → Replit/Forge handoff. Forge: read this manifest first, then the files below, to stay fully aligned with what Perplexity built/researched. Both sides share GitHub as source of truth; HF mirrors GitHub byte-identical.

## CURRENT LIVE STATE (as of 2026-06-08, verified)
- a11oy: https://szlholdings-a11oy.hf.space/console — ~38+ unique views. Built this cycle: Core 5 + 4 WOW adds + 5 organs (Lean/Lake/Mathlib instilled) + 5 verticals (RealEstate, Finance, Legal/Counsel, Enterprise/Sentra, RealEstate/Terra) + Chat + KAMAY coding + upgraded Warhacker. Amaru ("Provenance & Trust Anchor") 5-tab vertical: IN PROGRESS at payload time.
- killinchu: https://szlholdings-killinchu.hf.space/elite — drones/vessels + UDS + Warhacker; organs instilled; ~18 consolidated surfaces; FRONTIER pins at top.
- anatomy: https://szlholdings-anatomy.static.hf.space — 5 organs incl Operator (Rosie ingested).
- a-11-oy.com = live landing page (Λ 0.919, P1–P6, honest kernel count).
- GitHub szl-holdings ↔ HF SZLHOLDINGS: byte-identical on core files (verified md5). UDS mesh 4/4, theorem registry (5), Apache-2.0 + non-affiliation note.

## MODULE MESH (5) — honest roles (NEVER show codenames to users)
- amaru → "Provenance & Trust Anchor": public-ledger anchoring + post-quantum hardening. (5 tabs being built in a11oy.)
- rosie → "Operator" organ: receipt orchestration / fleet-wide proof mgmt. (Ingested into a11oy + anatomy.)
- sentra → "Policy" / the Cyber product brand. amaru/sentra/rosie/jarvis = banned user-visible codenames.
- a11oy = governed mesh (horizontal, verticals). killinchu = drones/vessels + UDS (vertical, Warhacker).

## HONESTY DOCTRINE (hard gate — Forge must hold this too)
- locked-proven = EXACTLY 5 {F1,F11,F12,F18,F19} @ kernel c7c0ba17. ~190 total proven/CI-green (Waves 11–22).
- Λ = Conjecture 1 (unconditional uniqueness machine-checked FALSE; conditional uniqueness proven axiom-free). NEVER call Λ a theorem.
- Khipu BFT = Conjecture 2 (OPEN). SLSA = "L1 honest; L2 build-attestation present; L2-verified/L3/FedRAMP/Iron Bank/CMMC = roadmap." Never bare "Level 2".
- 0 runtime CDN (vendor libs in-image; live DATA fetches OK). No fabricated data; SAMPLE labeled; premium feeds = connect-ready, not fake. killinchu Fleet C2 = "command demonstration, effector simulated." Keep UDS non-affiliation notice.

## FILES IN THIS PAYLOAD
- PROVEN_STATE_CANONICAL.md — single source of truth for formulas/proof tiers.
- UNIFICATION_INDEX.md (+ FORMULA_ORGAN_MAP, CAPABILITY_TAB_MAP, RESEARCH_CITATIONS) — every formula→organ, every org-repo capability→tab, every external citation (real URLs).
- A11OY_MASTER_SPEC_V2.md — definitive a11oy build (5 verticals×5 + Chat + KAMAY + UI/graph patterns from Datadog/Palantir/New Relic/NVIDIA).
- RESTRUCTURE_SPEC_2026-06-08.md — killinchu ~18 + consolidation map.
- AMARU_VERTICAL_SPEC.md — the Provenance & Trust Anchor 5-tab spec.
- LIVE_SOURCES_VERIFIED.md — all verified live data feeds + URLs (CISA KEV, NVD, Federal Register, CourtListener, Polymarket, Coinbase, NYC Open Data, Treasury, GitHub, etc.).
- HF_ASSET_MANIFEST.json — all HF models/datasets/collections mapped to app+tab+resolve URL.
- CLEANUP_PROPOSAL.md — Spaces/datasets proposed for deletion (awaiting founder approval).
- MINING_TARGETS_2026-06-08.md + MAP_{amaru,rosie,sentra}.md — research mining targets + module maps.
- A11OY_DEV{A,B,1}_REPORT.md, KILLINCHU_UNIFY_REPORT.md, ROSIE_INGEST_HF_INSTILL_REPORT.md — build reports w/ commit SHAs + browser proof.
- PLATFORM_REPLIT_GAP_AUDIT.md, REPLIT_VISION_MAP.md — the Replit↔platform gap + vision alignment.

## HOW TO STAY ALIGNED
1. GitHub is the source of truth. After any change, keep HF byte-identical (push both).
2. New backend modules: per-file COPY in Dockerfile (no `COPY . .`), then factory rebuild on HF.
3. Route registration: front-move routes ahead of the SPA catch-all (see a11oy_deva_feeds.py / a11oy_vertical_feeds.py template).
4. Forge: pull this folder, reconcile against your modules (amaru anchoring + PQC, rosie receipt-orchestration), and push any deltas back to GitHub so Perplexity sees them.
