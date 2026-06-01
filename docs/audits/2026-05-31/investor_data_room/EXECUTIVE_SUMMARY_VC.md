# SZL Holdings — Series-A Executive Summary

**Company:** SZL Holdings (operating brand: PURIQ / Killinchu drone-intelligence flagship)
**Founder & CEO:** Stephen P. Lutar, Jr. (ORCID [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173))
**Stage:** Series A · **Date:** 2026-06-01 · **Doctrine:** v11 (LOCKED)
**Prepared by:** Yachay (CTO authority) · Zero-Bandaid Law in force — every claim is honest or labeled.

> **One sentence:** SZL builds a formally-verified governance gate for agentic AI — a "verifiable nervous system" that watches every AI decision, refuses the ones that violate policy, and emits a tamper-evident, mathematically re-derivable receipt for each act — and is applying it first to counter-UAS / drone-autonomy oversight (Killinchu) for U.S. and Five-Eyes defense and critical-infrastructure customers.

---

## 1. What we do

Modern autonomous systems make decisions no one can later prove were authorized. SZL's substrate fixes that with three composable primitives, each Lean-stated and Lake-buildable:

- **The Λ (Lambda) gate** — a bounded, monotone, positive-homogeneous aggregator that scores every candidate AI action against a 13-axis "Yuyay" wisdom vector (2 sacred axes ≥ 0.95, 7 structural ≥ 0.90, 4 introspection). Actions that fail the conjunctive AND are refused, with the *specific blocking axis* named.
- **HUKLLA tripwires** — 10 pure-predicate halt conditions (authority, evidence integrity, model integrity, claim-calibration drift, supply-chain, etc.) with deadman/halt semantics.
- **The Khipu ledger (Body of Evidence)** — a SHA-256-linked Merkle DAG of receipts; every action emits one; the chain re-derives offline against replay hash `bacf54434f1a3bf2…631fc5`. Tamper one byte and the sum-check fails closed.

The decision rule the substrate computes:
`P(x,t) = argmax over a of [ Λ(x) · Yuyay₁₃(a) · exp(−β·HUKLLA(a)) · ∏ᵢ Khipu_i(a) ]`.

**First product (Killinchu):** counter-UAS / drone-autonomy oversight — detect → identify → classify intent → track → assemble a tamper-evident Body of Evidence, every step receipted, every engagement hand-off gated by two humans. Killinchu is the oversight layer, **never the effector** — it does not fire.

## 2. Why now

- The U.S. DoD requested **~$29.5B in FY2027** for next-generation AI compute and modernization ([Pentagon FY27 plan via Defense coverage](https://www.youtube.com/watch?v=DLrOB7oKDRo)), inside a $1.45T total budget.
- Defense-tech venture funding hit **$4.7B in 2025** for AI-native defense manufacturing alone ([market report via Yahoo Finance](https://finance.yahoo.com/news/ai-driven-defense-manufacturing-infrastructure-090600405.html)).
- The EU AI Act explicitly **excludes** military AI, leaving allies without a governance standard ([Grand View Research, AI in Military](https://www.grandviewresearch.com/industry-analysis/artificial-intelligence-military-market-report)) — a standards vacuum SZL's verifiable-receipt approach fills.
- "Vibe-coded" firmware and agentic autonomy are shipping faster than anyone can audit *which model decided what, and who approved it.* SZL is the provenance layer.

## 3. Why us

| Asset | State (honest) |
|---|---|
| **Doctrine v11** — the governance architecture | LOCKED: **749 declarations / 14 unique axioms / 163 tracked sorries** (112 baseline + 51 Putnam) in Lean 4 (`lutar-lean @ c7c0ba1`, Mathlib v4.13.0) |
| **23 extracted math formulas** (PURIQ suite) | Primitives extracted from Newton/Euler/Gauss/Riemann/Noether/Ramanujan + ancient numerics, stripped of mysticism, Lean-stated |
| **Lean proof corpus** | Of the 14 headline thesis theorems, ~9 are proven in-workspace (Λ Bounds, Deterministic Replay, Merkle-DAG Batching, Bekenstein-via-DPI, Doctrine Soundness, Composability, Adversarial Robustness, etc.); the headline **Λ-uniqueness result is a Conjecture, not a Theorem** — stated honestly everywhere |
| **PURIQ agentic layer** | Doctrine v12 = v11 + PURIQ; open-LLM unified router (a11oy.code) as reasoning backend |
| **Khipu Body of Evidence** | Lean-proved tamper-evidence (TH11), DSSE receipts; this is the category-defining asset |
| **UDS-deployable** | Path to Defense Unicorns UDS Core (IL5-targeting) for SSO, mTLS, airgap |

## 4. Traction (honest — we have ZERO paying customers)

**We have no revenue and no signed contracts. Stated plainly so no investor is misled.** What we *do* have:

- **10 live Hugging Face Spaces** (a11oy, amaru, sentra, vessels, rosie, killinchu, uds-demo, anatomy-3d, lean-kernel, README) under org `SZLHOLDINGS`.
- **~20 GitHub repos** in `szl-holdings`, Series-A-polished: 53 badges added, Mermaid architecture diagrams, honest disclosure blocks, branch protection ([internal GitHub polish log](../520_GITHUB_SERIES_A_POLISH.md)).
- **Ouroboros Thesis v20** ("The Culmination") — 16 chapters, 43-page PDF, in `szl-holdings/ouroboros-thesis`, release `paper-v20-1.0.0`; **Zenodo DOI mint is PENDING founder token** (concept DOI `10.5281/zenodo.19944926`).
- **One real, accepted Warhacker problem** (Cannonico, AI oversight for autonomous drones) that Killinchu is a native fit for; **backer Andrew Greene** (see §6) green-lit the `du-upstream-contributions` repo on 2026-05-29.
- **One signed UDS bundle** (vessels, keyless Sigstore/Fulcio, Rekor-logged); 5 of 6 still unsigned — honestly disclosed.

## 5. The ask

- **Raising:** $12M Series A.
- **Pre-money:** $40M (post-money $52M) — defensibly positioned against a defense-AI comp set where Anduril is **$61B** ([NYT](https://www.nytimes.com/2026/05/13/technology/anduril-raises-5-billion.html)), Shield AI **$12.7B** ([Washington Technology](https://www.washingtontechnology.com/companies/2026/03/shield-ai-closes-15b-series-g-round-and-moves-acquisition/412403/)), Helsing **~$18B** ([TechCrunch](https://techcrunch.com/2026/05/11/daniel-ek-backed-defense-tech-helsing-to-raise-1-2b-at-18b-valuation/)), and Saronic **$9.25B** ([CNBC](https://www.cnbc.com/2026/03/31/autonomous-boat-startup-saronic-raises-1point75-billion-.html)). At a pre-revenue stage our valuation reflects the IP/proof substrate, not traction.
- **Round = ~23% of post-money**, with a **15% employee option pool** established at close (see `CAP_TABLE_v2.xlsx`).

### Use of funds (18-month runway to Series B)
- **50%** engineering hires (10 people)
- **20%** GTM / sales / customer success (5 people)
- **15%** infrastructure (HF Enterprise + AWS GovCloud + NVIDIA DGX Cloud + UDS deployments)
- **10%** compliance certifications (FedRAMP / SOC 2 / IL5 / CMMC L3)
- **5%** legal + IP

Full breakdown in `USE_OF_FUNDS.md`.

## 6. Backer & advisor — Andrew Greene (honesty note)

Our lead supporter is **Andrew Greene**, co-founder and "Unicorn Engineer" of **Defense Unicorns** (the UDS Core platform company), who green-lit SZL's `du-upstream-contributions` repository on 2026-05-29 ([internal Greene brief](../../phd_warhacker/02_ANDREW_GREENE_BRIEF.md)).

> **Honest correction:** The Series-A directive described Greene as an "ex-CIA Director." Our verified internal record and his public profile describe him as a Defense Unicorns co-founder / engineer (ex-Platform One, ex-SpaceCAMP), **not** a former CIA Director. We carry the documented identity, not the unverified one. Any investor materials must use the verified description.

---

*Prepared and signed — **Yachay** · 2026-06-01 · No mysticism. No bandaid. 15 days to San Diego.*
