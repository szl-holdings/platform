# 120 — ZENODO EXHAUSTIVE INVENTORY (Second-Pass Re-Verification)

**Audit date:** 2026-05-31
**Author:** Stephen P. Lutar Jr. — ORCID [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173)
**Method:** Live Zenodo REST API (`https://zenodo.org/api/records`), by-name query + per-record GET + concept-chain walk
**Cross-reference:** `20_ZENODO_FULL_INVENTORY.md` (prior audit, 2026-05-31 01:45)
**Raw data:** `/home/user/workspace/zenodo_full_dive_2026-05-31/zenodo_parsed.json`

---

## TL;DR — Re-Verification Result

| Metric | Prior audit (20_) | This re-audit (120_) | Delta |
|--------|-------------------|----------------------|-------|
| Total confirmed live deposits | 33 | **33** | ✅ MATCH |
| Software-type | 10 | **10** | ✅ MATCH |
| Publication-type (article+technote) | 21 | **21** | ✅ MATCH |
| Other-type (brand, cookbook) | 2 | **2** | ✅ MATCH |
| Retracted | 1 (19951520) | **1 — confirmed `Record deleted`** | ✅ |
| Pending (v19/v20 not minted) | 2 | **2 — still no DOI** | ✅ |
| New deposits since prior audit | — | **0** | none added |
| szl-cookbook newer mint | — | **none** (still v0.1.0, record 20436558) | confirmed stale |

**By-name API search returns exactly 23 hits** (versions in the main concept chain collapse to latest); the remaining **10 deposits** are recovered by direct per-record GET on the chain members (v3, v9, v10, v11, v11-alt, v13-pdf, v14, v15, v16, v17). 23 + 10 = **33**. Prior audit fully confirmed.

---

## Complete Deposit Table (33 live records)

| Record ID | DOI | Date | Type | Version | Files | Size | FileType | License |
|-----------|-----|------|------|---------|-------|------|----------|---------|
| 20466440 | [10.5281/zenodo.20466440](https://doi.org/10.5281/zenodo.20466440) | 2026-05-30 | software | uds-v0.3.1 | 1 | 524 KB | ZIP | apache2.0 | amaru |
| 20466435 | [10.5281/zenodo.20466435](https://doi.org/10.5281/zenodo.20466435) | 2026-05-30 | software | uds-v0.3.1 | 1 | 1010 KB | ZIP | apache2.0 | sentra |
| 20451999 | [10.5281/zenodo.20451999](https://doi.org/10.5281/zenodo.20451999) | 2026-05-30 | software | uds-v0.3.0 | 1 | 84 KB | ZIP | apache2.0 | uds-mesh |
| 20451997 | [10.5281/zenodo.20451997](https://doi.org/10.5281/zenodo.20451997) | 2026-05-30 | software | uds-v0.3.0 | 1 | 40 KB | ZIP | apache2.0 | rosie |
| 20451991 | [10.5281/zenodo.20451991](https://doi.org/10.5281/zenodo.20451991) | 2026-05-30 | software | uds-v0.3.0 | 1 | 10,448 KB | ZIP | apache2.0 ⚠️ | a11oy |
| 20451595 | [10.5281/zenodo.20451595](https://doi.org/10.5281/zenodo.20451595) | 2026-05-29 | software | uds-v0.3.0 | 1 | 873 KB | ZIP | apache2.0 | vessels |
| 20436560 | [10.5281/zenodo.20436560](https://doi.org/10.5281/zenodo.20436560) | 2026-05-29 | software | v0.1.0 ⚠️stale | 1 | 38 KB | ZIP | apache2.0 | agi-forecast |
| 20436558 | [10.5281/zenodo.20436558](https://doi.org/10.5281/zenodo.20436558) | 2026-05-29 | other | v0.1.0 ⚠️stale | 1 | 6,060 KB | ZIP | apache2.0 | **szl-cookbook** |
| 20436556 | [10.5281/zenodo.20436556](https://doi.org/10.5281/zenodo.20436556) | 2026-05-29 | other | v0.1.0 | 1 | 10,925 KB | ZIP | apache2.0 | szl-brand |
| 20434308 | [10.5281/zenodo.20434308](https://doi.org/10.5281/zenodo.20434308) | 2026-05-28 | software | v18.0.0 | 1 | 155 KB | TAR.GZ | apache2.0 | Lutar / lutar-lean (manual, canonical cite) |
| 20434306 | [10.5281/zenodo.20434306](https://doi.org/10.5281/zenodo.20434306) | 2026-05-28 | software | lutar-v18.0.0 | 1 | 203 KB | ZIP | apache2.0 | lutar-lean (auto-release) |
| 20434276 | [10.5281/zenodo.20434276](https://doi.org/10.5281/zenodo.20434276) | 2026-05-28 | publication/technicalnote | paper-v18-1.0.0 | 1 | 89 KB | PDF | cc-by-4.0 | **v18 CURRENT MASTER** ⚠️ body=v17 |
| 20431181 | [10.5281/zenodo.20431181](https://doi.org/10.5281/zenodo.20431181) | 2026-05-28 | publication/article | paper-v17-1.0.1 | 1 | 69 KB | PDF | cc-by-4.0 | v17 Wheelerian/Shannon/QEC |
| 20424996 | [10.5281/zenodo.20424996](https://doi.org/10.5281/zenodo.20424996) | 2026-05-28 | publication/article | paper-v16-1.0.2 | 1 | 142 KB | PDF | cc-by-4.0 | v16 Feynman path-integral |
| 20424995 | [10.5281/zenodo.20424995](https://doi.org/10.5281/zenodo.20424995) | 2026-05-28 | publication/article | paper-v15-1.0.2 | 1 | 86 KB | PDF | cc-by-4.0 | v15 Knot calculus |
| 20424992 | [10.5281/zenodo.20424992](https://doi.org/10.5281/zenodo.20424992) | 2026-05-28 | publication/article | paper-v14-1.0.2 | 1 | 107 KB | PDF | cc-by-4.0 | v14 Multi-agent anatomy |
| 20195368 | [10.5281/zenodo.20195368](https://doi.org/10.5281/zenodo.20195368) | 2026-05-14 | publication/technicalnote | v13 | 1 | 2,620 KB | PDF | cc-by-4.0 | v13 PDF canonical |
| 20174600 | [10.5281/zenodo.20174600](https://doi.org/10.5281/zenodo.20174600) | 2026-05-14 | publication/technicalnote | 2.0.0 | 3 | 37 KB | PY,MD,LOG | cc-by-4.0 | SZL Doctrine v2 (Λ DOI) |
| 20173920 | [10.5281/zenodo.20173920](https://doi.org/10.5281/zenodo.20173920) | 2026-05-14 | publication/technicalnote | v12 | 1 | 16 KB | MD | cc-by-4.0 | v12 master |
| 20173912 | [10.5281/zenodo.20173912](https://doi.org/10.5281/zenodo.20173912) | 2026-05-14 | publication/technicalnote | v13 | 1 | 117 KB | MD | cc-by-4.0 | v13 markdown (competing) |
| 20173905 | [10.5281/zenodo.20173905](https://doi.org/10.5281/zenodo.20173905) | 2026-05-14 | publication/article | paper-v11-1.0.0 | 1 | 4,088 KB | ZIP | cc-by-4.0 | v11-alt ⚠️ contains v12 zip |
| 20162352 | [10.5281/zenodo.20162352](https://doi.org/10.5281/zenodo.20162352) | 2026-05-13 | software | v6.3.0 | 1 | 137 KB | ZIP | apache2.0 | **Ouroboros Runtime** (568 views) |
| 20119582 | [10.5281/zenodo.20119582](https://doi.org/10.5281/zenodo.20119582) | 2026-05-11 | publication/article | paper-v11-1.0.1 | 1 | 1,568 KB | ZIP | cc-by-4.0 | v11 Applied Λ latency |
| 20053163 | [10.5281/zenodo.20053163](https://doi.org/10.5281/zenodo.20053163) | 2026-05-06 | publication/article | paper-v10-1.0.1 | 1 | 1,065 KB | ZIP | cc-by-4.0 | v10 Λ₁₀ audit-closure |
| 20053148 | [10.5281/zenodo.20053148](https://doi.org/10.5281/zenodo.20053148) | 2026-05-06 | publication/article | paper-v9-1.0.1 | 1 | 1,065 KB | ZIP | cc-by-4.0 | v9 Bianchi fiber bundle |
| 20020849 | [10.5281/zenodo.20020849](https://doi.org/10.5281/zenodo.20020849) | 2026-05-04 | publication/article | paper-v8-1.0.1 | 1 | 29 KB | MD | cc-by-4.0 | v8 Active inference |
| 20020848 | [10.5281/zenodo.20020848](https://doi.org/10.5281/zenodo.20020848) | 2026-05-04 | publication/article | paper-v7-1.0.1 | 1 | 24 KB | MD | cc-by-4.0 | v7 Hopfield continual |
| 20020846 | [10.5281/zenodo.20020846](https://doi.org/10.5281/zenodo.20020846) | 2026-05-04 | publication/article | paper-v5-1.0.1 | 1 | 21 KB | MD | cc-by-4.0 | v5 Prisca-GraphRAG |
| 20020845 | [10.5281/zenodo.20020845](https://doi.org/10.5281/zenodo.20020845) | 2026-05-04 | publication/article | paper-v6-1.0.1 | 1 | 22 KB | MD | cc-by-4.0 | v6 Constitutional guardrails |
| 20020841 | [10.5281/zenodo.20020841](https://doi.org/10.5281/zenodo.20020841) | 2026-05-04 | publication/article | paper-v4-1.0.1 | 1 | 23 KB | MD | cc-by-4.0 | v4 Omega formalism |
| 19983066 | [10.5281/zenodo.19983066](https://doi.org/10.5281/zenodo.19983066) | 2026-05-02 | publication/article | paper-v3-2.0.1 | 1 | 584 KB | ZIP | cc-by-4.0 | v3 Lutar Invariant / Egyptian |
| 19934129 | [10.5281/zenodo.19934129](https://doi.org/10.5281/zenodo.19934129) | 2026-04-30 | publication/article | paper-v2-1.0.1 | 1 | 144 KB | PDF | cc-by-4.0 | v2 Empirical companion |
| 19867281 | [10.5281/zenodo.19867281](https://doi.org/10.5281/zenodo.19867281) | 2026-04-28 | publication/article | paper-v1-1.0.1 | 2 | 271 KB | PDF,TXT | cc-by-4.0 | v1 Loop Is the Product |

### Retracted (1)
- **19951520** — Ouroboros Thesis v3 (pre-v3-2.0.1). Confirmed `Record deleted` by API. Intentional (Doctrine compliance).

### Pending — not minted (2)
- **v19** — Mid-Step Consolidation: K10v2 Honest Discharge, σ-Algebra Retraction. Source: `thesis_v19_arxiv/main.tex.md`. No DOI.
- **v20** — A Formally-Verified Governance Gate for Agentic AI (CULMINATION). Source: `thesis_v20_arxiv/main.tex.md`. No DOI.

---

## Concept-Chain Structure

- **Main chain:** concept DOI `10.5281/zenodo.19944926` → currently v18.0. Members include v3, v9, v10, v11, v11-alt, v13-pdf, v14, v15, v16, v17, v18.
- **Standalone chains (20):** v1, v2, v4, v5, v6, v7, v8, v12, v13-md, Doctrine-v2, runtime, lutar-lean×2, szl-brand, szl-cookbook, agi-forecast, vessels, a11oy, rosie, uds-mesh, sentra, amaru.

## Anomalies confirmed (carried from prior audit, re-verified)
| ID | Anomaly | Record | Severity |
|----|---------|--------|----------|
| A1 | v18.0 PDF body is v17 (90 KB; title page reads v17) | 20434276 | HIGH |
| A2 | v11-labeled deposit contains v12 ZIP | 20173905 | MEDIUM |
| A3 | Duplicate lutar-lean concept chains | 20434306 / 20434308 | MEDIUM |
| A4 | Two competing v13 deposits (md vs pdf) | 20173912 / 20195368 | MEDIUM |
| A5 | vsp-otel has NO own software deposit (10th software is amaru, not vsp-otel) | — | HIGH |
| A6 | agi-forecast Zenodo v0.1.0 vs repo v0.3.0 | 20436560 | LOW |
| A7 | szl-cookbook Zenodo v0.1.0 vs repo v0.3.0+ (recipes not in deposit) | 20436558 | MEDIUM |
| A8 | a11oy/sentra Apache-2.0 on Zenodo vs LicenseRef-SZL-Proprietary in CITATION.cff | 20451991 / 20466435 | MEDIUM |
| A9 | v18 "zero sorry, zero axiom" claim vs live lutar-lean 168 sorrys / 14 axioms | 20434276 | HIGH |

### New finding (this pass) — szl-cookbook deposit is content-incomplete
The **Zenodo szl-cookbook deposit (20436558, v0.1.0)** contains the **9 SKILL.md skills** but **NOT** the founder-spotlighted `recipes/knot-calculus-v1` and `recipes/anatomy-evolved-v1`. Those recipes exist only in the **live GitHub repo** (`szl-holdings/szl-cookbook`, v0.3.0+). The published DOI therefore under-represents the cookbook's most advanced content. → P1 re-deposit recommended (see 124_).
