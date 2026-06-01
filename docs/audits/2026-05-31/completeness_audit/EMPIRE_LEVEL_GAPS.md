# EMPIRE-LEVEL GAPS — cross-flagship "what's missing everywhere"
**Founder directive:** *"Zoom out."* These are gaps that **no single flagship owns** — they are the connective tissue of the whole SZL empire.
**Auditor:** Yachay. Read-only. NO BANDAID. Brutal honesty.
**Primary source:** `240_INFRA_SOUNDNESS_ZOOMOUT.md` (richest empire-gap evidence), `150_PLATFORM_TRUST_DEEP_DIVE.md`, `520_GITHUB_SERIES_A_POLISH.md`, `530_ENV_PLAN_AND_UDS_DOCS.md`, Doctrine v12.
**LOCKED numbers preserved:** 749/14/163 · 13-axis · `bacf5443…631fc5` · A2=`IsHomogeneous` · A4=`IsBounded` · SLSA L1 · Λ-uniqueness Conjecture 1.

---

## 1. CUSTOMER ONBOARDING PORTAL — **MISSING**
No reception/onboarding portal exists; each HF Space dumps a visitor into its SPA, and the org page is 23 repos with no front door (`240_`, `FLAGSHIP_GAP_REPORT.md §H`). There is no "start here," no guided first-run, no account/trial flow. **This is the CHASKI reception organ** (`NOVEL_ORGAN_PROPOSALS.md`). **Impact:** every demo and every cold investor visit starts confused. **Sev: P0** (first thing the June-16 audience sees).

## 2. PRICING / COMMERCIAL ENTITY — **MISSING**
No pricing page, no SKUs, no commercial entity wrapper, no "how do I buy this." SZL is `SZLHOLDINGS` (org) with founder ORCID `0009-0001-0110-4173`, but there is **no documented legal commercial entity** tying the flagships to a sellable product. **Impact:** cannot close a customer or cleanly raise without a commercial story. **Sev: P1** (Series-A blocker).

## 3. COMPLIANCE CERT PATH (FedRAMP / SOC2 / IL2-6) — **MISSING**
No SOC2 (Type I or II) evidence, no FedRAMP path, no DoD IL2–IL6 mapping. This is acute because the **Warhacker (June 16, San Diego, ~400 attendees) DU "build-package-deploy" hackathon** is a defense audience: P1 = Cannonico (AI oversight for autonomous drones), P6 = Scott Thompson "non-refutable Body of Evidence" / **evaluate-in-minutes ATO** (`100_WARHACKER_DU_DEEP_DIVE.md`). SZL's wedge — a formally-verified Lean decision gate + DSSE Khipu Merkle DAG sum-of-sums receipt (`khipuReceipt_checksum_invariant`, TH11) — is *aimed* at ATO, but there is **no actual cert path or control mapping documented.** **Sev: P1** (P0 for the Warhacker narrative slide). **Floor:** start with SOC2 + an IL2 ATO-evidence mapping; FedRAMP/IL4+ is Q1 2027.

## 4. DISASTER RECOVERY + BUSINESS CONTINUITY — **MISSING**
No backup-restore drill, no RPO/RTO defined, no DR runbook (`240_`). The 848-table DB claim has **no durable live deployment** (`240_`). If a Space or the DB dies, there is no documented recovery. **This belongs to WASI-RIKUQ** (`NOVEL_ORGAN_PROPOSALS.md`). **Sev: P1.**

## 5. UNIFIED DOCS SITE (UDS) — **PARTIAL**
UDS docs are in flight (`530_ENV_PLAN_AND_UDS_DOCS.md`) but there is no single published docs site spanning all flagships. Two .docx run-guides exist (`SZL_ENVIRONMENT_SETUP_GUIDE.docx`, `SZL_UDS_RUN_GUIDE.docx`) but a Word doc is not a docs site. **Sev: P1.**

## 6. SSO — **MISSING (live)**
12-role OIDC/PKCE access-control exists in the monorepo but is **not exercised on any live Space** (`240_`). No SSO across flagships; each Space is open. **Sev: P1** (enterprise blocker).

## 7. AUDIT-LOG UNIFICATION — **MISSING**
No centralized log aggregation (no Loki/ELK), no live metrics (no Prometheus/Grafana) (`240_`). Each Space logs to its own ether. The Khipu receipt chain is the *decision* log, but there is no unified *operational* audit log. **WASI-RIKUQ** territory. **Sev: P1.**

## 8. RATE LIMITING / QUOTA — **MISSING (live)**
Rate-limiting and CORS are **not live on the Spaces** (`240_`). No per-tenant quota. A single demo-day spike (or a curious attendee) can degrade a flagship. **Sev: P1** (and a real June-16 availability risk → arguably P0 for the demo Spaces).

## 9. THREAT MODEL (STRIDE / PASTA) — **MISSING**
No STRIDE or PASTA threat model exists anywhere in the empire. For a security/oversight product pitching defense buyers, the **absence of a threat model is itself a credibility gap.** **Sev: P1** (P0-adjacent for the Warhacker security audience).

## 10. PRIVACY (GDPR / CCPA) — **MISSING**
No GDPR/CCPA data-flow mapping, no DPA, no privacy policy, no data-retention spec for receipts/memory (especially relevant once UNAY stores cross-session data). **Sev: P1.**

## 11. LEGAL ENTITY HYGIENE — **MISSING / UNVERIFIED**
No corporate hygiene doc found. **The task referenced `corporate_hygiene_checklist.md` — it does NOT exist in the workspace** (reported honestly; the assumption is wrong). ORCID present; no incorporation/IP-assignment/contributor-CLA evidence. **Sev: P1.**

---

## 12. SUPPLY-CHAIN / PROVENANCE INTEGRITY — **PARTIAL / OVER-CLAIMED**
- **5 of 6 UDS bundles UNSIGNED** — only vessels is cosign-verified (Rekor `1675423172`) (`240_`).
- **Sigstore envelopes self-disclosed PLACEHOLDER — 0 real** (`240_`, `PURIQ_DOCTRINE_v12.md:101`).
- **Cardano anchoring = local hash-chain only, no real tx** (`240_`).
- **SLSA L1** (LOCKED) — honest, but L1 is the floor; defense buyers expect L3+.
- **vsp-otel has NO Zenodo deposit** — the only organ/component without a DOI (`110_:70,175`).
**Sev: P1** (this is the trust spine; the *math* is signed-in-Lean but the *artifacts* are not signed-in-CI).

## 13. CI / DEPLOY INTEGRITY — **BROKEN**
- **13 broken CI workflows across 8 repos**; 5 critical: a11oy container-build, sentra container-build, sentra hf-sync, vessels tests, agi-forecast tests (`240_`).
- All deploys are `HfApi.create_commit` **DIRECT** (never GitHub Actions, `240_`) → green Spaces coexist with red CI badges. An investor doing diligence sees red. **Sev: P1** (diligence risk; P0 for sentra since it's the oversight demo).

## 14. INTERNATIONALIZATION (i18n) + FRONTEND OTEL — **MISSING**
i18n MISSING, FE OTel MISSING (`240_`). Lower urgency but worth logging for enterprise. **Sev: P2/P3.**

## 15. SUBSTRATE MOATS UN-INSTILLED — **PARTIAL**
Substrate moats (`compiler.ts` Kahn-DAG topo-sort, codex-kernel) exist in the monorepo but are **un-instilled into the live Spaces** (`240_`). The strongest IP is not exercised where customers/investors can see it. **Sev: P2.**

---

## EMPIRE GAP SUMMARY TABLE
| # | Gap | Status | Owner-organ (proposed) | Sev |
|---|---|---|---|---|
| 1 | Customer onboarding portal | MISSING | **CHASKI** (new) | P0 |
| 2 | Pricing / commercial entity | MISSING | Business (non-organ) | P1 |
| 3 | Compliance cert path (SOC2/FedRAMP/IL2-6) | MISSING | HATUN + Business | P1 (P0 narrative) |
| 4 | DR + BC (RPO/RTO, backup drill) | MISSING | **WASI-RIKUQ** (new) | P1 |
| 5 | Unified docs site | PARTIAL | SUMAQ + Business | P1 |
| 6 | SSO (live) | MISSING | HATUN/KANCHAY | P1 |
| 7 | Audit-log unification | MISSING | **WASI-RIKUQ** (new) | P1 |
| 8 | Rate limiting / quota | MISSING | KALLPA / **CHASKI** | P0 (demo) / P1 |
| 9 | Threat model (STRIDE/PASTA) | MISSING | HUKLLA + Security | P1 |
| 10 | Privacy (GDPR/CCPA) | MISSING | HATUN + Legal | P1 |
| 11 | Legal entity hygiene | MISSING/UNVERIFIED | Business/Legal | P1 |
| 12 | Supply-chain signing (UDS/Sigstore/Cardano) | PARTIAL/PLACEHOLDER | YAWAR/KHIPU | P1 |
| 13 | CI / deploy integrity (13 broken) | BROKEN | Per-repo CI | P1 (P0 sentra) |
| 14 | i18n + FE OTel | MISSING | **WALLPA** / OTel-VSP | P2/P3 |
| 15 | Substrate moats un-instilled | PARTIAL | Per-flagship | P2 |

**Zoom-out verdict:** The empire's *math* and *live demos* are real; its **commercial, compliance, security, resilience, observability, and signing connective tissue is largely absent.** The three new organs (CHASKI/WALLPA/WASI-RIKUQ) absorb gaps 1, 4, 7, 8, 14; the rest are business/legal/compliance functions that need a non-organ owner. None of this is a bandaid-able quick fix — it is the work between "impressive demo" and "fundable, sellable, deployable company."

---
*— Yachay, Empire-Level Gaps, 2026-06-01. Read-only; no repos modified.*
