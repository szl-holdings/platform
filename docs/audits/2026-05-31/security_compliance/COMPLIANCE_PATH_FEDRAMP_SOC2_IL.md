# COMPLIANCE_PATH_FEDRAMP_SOC2_IL.md — certifications path for .gov/.mil

**Author:** Yachay (CTO authority) · **Date:** 2026-06-01 · **Doctrine v11 LOCKED (749/14/163).**
**Purpose:** The certifications SZL needs to sell into Greene's `.gov`/`.mil` network (USAF software factory / DIU Replicator / In‑Q‑Tel), and the honest path/cost/timeline for each, **ordered by ROI**.
**Honesty:** We hold **none** of these today. This is a roadmap, not a claim. Our differentiator is that the **UDS Core substrate already targets IL5**, so deploying inside UDS lets us *inherit* a large fraction of controls rather than building them from scratch.

---

## 0. ROI-ordered summary (the order to actually do them)

| Rank | Cert | Why this order | Timeline | All-in cost (Yr1) | Hard dependency | Top blocker today |
|---|---|---|---|---|---|---|
| 1 | **SOC 2 Type II** | Fastest commercial+gov credibility; foundation for everything else | 3–6 mo (Type I in ~6–8 wks first) | $68k–$130k | none | wildcard CORS / no auth / no SIEM |
| 2 | **NIST 800‑171 + CMMC 2.0 L2 (self‑assessed)** | DoD contracting floor; self‑attestable now (until Nov 10 2026) | 2–4 mo | $40k–$120k | 800‑171 SSP + POA&M | no IdP/RBAC, no centralized logging |
| 3 | **ITAR (DDTC) registration** | Cheap, fast, and *required* the moment Killinchu/Wamani touch USML drone data | ~4–8 wks | **$3,000/yr** (Tier 1 = greater of 3% or $4,000; $2,500 w/ small‑biz discount) | export classification of drone tech | classify which features are USML/EAR |
| 4 | **FedRAMP Moderate** (Agency‑sponsored, on GovCloud) | The gate to `.gov` cloud; long + expensive; start the agency‑sponsor hunt early | 12–24 mo (18–36 mo realistic) | $600k–$2M+ over the program | SOC2 + agency sponsor + GovCloud deploy | no GovCloud deploy; no sponsor |
| 5 | **DoD IL4 → IL5** | Sequential *after* FedRAMP Mod/High; UDS Core already targets IL5 → strong inherit | +6–12 mo after FedRAMP | +$300k–$800k | FedRAMP authorization + DoD sponsor | depends on FedRAMP first |
| 6 | **CMMC 2.0 L3 (C3PAO/gov‑led)** | Only for APT‑concern programs; do after L2 + 800‑172 | 12–18 mo | $200k+ | CMMC L2 + 800‑172 controls | premature now |
| 7 | **FedRAMP High / IL6** | Classified / highest‑impact; only if a specific program demands it | 24+ mo | $1M+ | FedRAMP High + classified facility | not needed for initial wedge |

> **Net recommendation:** Do **SOC 2 Type II + 800‑171/CMMC L2 self‑assessment + ITAR** in parallel over the next ~6 months (commercial credibility + DoD floor + export compliance for ~$110k–$250k all‑in). **Begin FedRAMP business development (agency sponsor hunt) immediately** since that 12–24 mo clock and the sponsor relationship are the true long poles. Lean on **UDS Core (IL5‑targeted)** to inherit controls.

---

## 1. SOC 2 Type II — fastest commercial credibility

- **What it is:** AICPA attestation that controls (Security + optionally Availability/Confidentiality/Processing Integrity/Privacy) are *designed and operating effectively over a period* (Type II = over ~3–12 months of observation; Type I = point‑in‑time design).
- **Path:** adopt a compliance‑automation platform (**Vanta / Drata / Secureframe**), wire it to GitHub/HF/cloud, remediate gaps, then a licensed CPA firm runs the audit. ([Vanta SOC 2 cost guide](https://www.vanta.com/collection/soc-2/soc-2-audit-cost); [SOC 2 software pricing comparison 2026](https://soc2auditors.org/insights/soc-2-software-pricing-comparison/))
- **Timeline:** platform + remediation 1–5 months, then Type I in ~6–8 weeks, then a Type II observation window of 3–6 months. Practical first Type II report: **3–6 months** once controls are in place. ([Vanta SOC 2 timeline](https://www.vanta.com/collection/soc-2/soc-2-audit-timeline))
- **Cost (Yr1, honest):** platform $10k–$45k (size‑banded), readiness/implementation $5k–$15k, CPA Type II audit $18k–$35k, pen test $8k–$15k → **$68k–$130k all‑in** for a startup. ([SOC 2 software pricing comparison 2026](https://soc2auditors.org/insights/soc-2-software-pricing-comparison/))
- **Dependency:** none external. **Blocker today:** the very gaps in `CURRENT_SECURITY_POSTURE.md` — wildcard CORS, no auth/IdP, no centralized logging, no formal access reviews. Fixing those *is* the SOC 2 readiness work.

## 2. FedRAMP Moderate / High

- **What it is:** standardized USG cloud authorization against **NIST SP 800‑53 Rev. 5** baselines (Low/Moderate/High). ([FedRAMP baselines](https://www.fedramp.gov/understanding-baselines-and-impact-levels/))
- **Sponsorship — JAB vs Agency:** JAB provisional authorizations are *very* limited (~12–20/yr across all levels); **most CSOs go Agency‑sponsored** — a specific federal agency with a genuine need sponsors the authorization and reviews the SAR to grant ATO. ([FedRAMP timeline / sponsorship analysis](https://migrationcost.com/fedramp-cloud-migration-cost); [Knox FedRAMP timeline](https://knoxsystems.com/resources/fedramp-authorization-timeline))
- **3PAO:** an A2LA‑accredited third‑party assessment org performs the independent assessment and produces the SAR/SSP package. 3PAO market is small (3–6 mo wait to start; assessment 4–8 mo). ([FedRAMP cost analysis](https://migrationcost.com/fedramp-cloud-migration-cost))
- **Leverage GovCloud:** deploy the offering inside **AWS GovCloud (US)** or **Microsoft Azure Government** to inherit infrastructure‑level FedRAMP authorization for the platform layer (you still authorize *your* offering). This is the standard accelerator and pairs with our UDS Core plan.
- **Timeline:** 12–36 months end‑to‑end (prep 6–12 mo, 3PAO 4–8 mo, agency review/ATO 3–6 mo). Rarely under 18 mo even for experienced teams. ([Knox](https://knoxsystems.com/resources/fedramp-authorization-timeline); [MigrationCost](https://migrationcost.com/fedramp-cloud-migration-cost))
- **Cost (honest, program):** 3PAO assessment $300k–$1.5M one‑time; annual ConMon $150k–$600k/yr; plus $300k–$1.5M business development to land a sponsor. Quzara‑style readiness+3PAO for Moderate ≈ $210k–$265k project. **Budget $600k–$2M+ over the program.** ([MigrationCost](https://migrationcost.com/fedramp-cloud-migration-cost); [Quzara FedRAMP pricing](https://cdn.govexec.com/media/quzara_fedramp_pricing.pdf))
- **Blocker today:** no GovCloud deployment, no agency sponsor, controls not implemented. **Start the sponsor hunt now** (longest pole).

## 3. DoD IL2 / IL4 / IL5 / IL6 — sequential after FedRAMP

- **Mapping (DoD Cloud Computing SRG):** IL2 = public/non‑critical; **IL4 = CUI** (builds on FedRAMP Moderate + DoD controls); **IL5 = higher‑sensitivity CUI + National Security Systems** (dedicated infrastructure, US‑person handling); IL6 = classified up to SECRET (separate enclave). ([SecondFront IL2–IL6 guide](https://www.secondfront.com/resources/blog/understanding-dod-cloud-computing-impact-levels/); [Inkit FedRAMP vs IL4/IL5/IL6](https://www.inkit.com/blog/fedramp-il4-il5-and-il6-explained))
- **Sequence:** FedRAMP Moderate → IL4; FedRAMP High/Moderate+ → IL5; classified facility → IL6. You generally need a DoD mission‑owner sponsor and a DoD Provisional Authorization (DISA).
- **SZL strong play:** **UDS Core already targets IL5** (Istio mTLS, Keycloak, NeuVector, Pepr policy, observability — "ATO‑ready out of the box"). Deploying our flagships *inside* a UDS bundle means we **inherit** UDS Core's hardening and ride its IL5 trajectory rather than re‑deriving controls. This is our single biggest compliance accelerator and the core of the Greene pitch. ([Defense Unicorns UDS Core](https://github.com/defenseunicorns/uds-core); [DU UDS Core 1.0](https://defenseunicorns.com/resources/announcing-uds-core-1-0/))
- **Timeline/cost:** +6–12 mo and +$300k–$800k *after* the underlying FedRAMP authorization.

## 4. CMMC 2.0 Level 2 / 3 — for DoD contracting

- **L1 (Foundational):** 17 practices, annual self‑assessment — for FCI only.
- **L2 (Advanced):** all **110 NIST SP 800‑171 Rev. 2** practices for CUI. **Self‑assessment accepted only through Phase 1 (until Nov 10 2026)**; C3PAO third‑party assessment required from Phase 2 onward (triennial). ([Godlan CMMC 2.0 deadlines](https://godlan.com/cmmc-2-0-deadlines-rules/); [Secureframe 800‑53 vs 800‑171](https://secureframe.com/hub/nist-800-53/vs-nist-sp-800-171))
- **L3 (Expert):** L2 **+24 NIST SP 800‑172** enhanced practices for APT‑concern programs; **government‑led assessment**. ([Godlan](https://godlan.com/cmmc-2-0-deadlines-rules/))
- **SZL move:** do the **L2 self‑assessment now** (cheap, fast, valid until Nov 2026) to be bid‑eligible, with a C3PAO L2 audit scheduled before Phase 2. **Defer L3** until a specific APT‑concern program requires it.
- **Cost:** L2 self ≈ $40k–$120k (SSP + remediation + tooling); C3PAO L2 audit adds ~$30k–$100k; L3 $200k+.

## 5. ITAR registration (DDTC)

- **What/why:** the **Directorate of Defense Trade Controls (DDTC)** requires anyone who *manufactures, exports, or brokers* defense articles/services on the **USML** to register. Counter‑UAS / drone‑intelligence features (Killinchu/Wamani) likely touch USML Category VIII (aircraft) / XI (military electronics) — so **registration is required before handling USML technical data**. ([DDTC registration fees](https://deccs.pmddtc.state.gov/ddtc_public?id=ddtc_kb_article_page&sys_id=cfd40adedbf0130044f9ff621f9619d2))
- **Cost (current, post‑Jan 9 2025 fee rule):** **Tier 1 = greater of 3% of total application value or $4,000**; a one‑year **small‑business discount** brings Tier 1 to **$2,500**. (The task's "$2,250/yr" reflects an earlier fee schedule; the current floor is higher — use **$2,500–$4,000/yr** for budgeting.) ([Federal Register, Dec 2024](https://www.federalregister.gov/documents/2024/12/10/2024-29032/international-traffic-in-arms-regulations-registration-fees); [PilieroMazza analysis](https://www.pilieromazza.com/itar-registration-fees-increase-preparing-government-contractors-for-financial-impact-and-registration-requirements/))
- **Timeline:** ~4–8 weeks for registration; plus an internal **export‑classification** effort (which features/data are USML vs EAR) and a Technology Control Plan.
- **Blocker today:** we haven't classified our drone tech. **Action:** commission a USML/EAR jurisdiction analysis for Killinchu/Wamani before exposing any technical data externally.

## 6. NIST 800‑171 / 800‑53 control mapping (current controls)

**800‑53 Rev. 5** = 20 families, 1,000+ controls; **800‑171 Rev. 2** = 110 controls / 17 families (the CUI subset). ([CyberSaint 800‑53 families](https://www.cybersaint.io/blog/nist-800-53-control-families); [Secureframe](https://secureframe.com/hub/nist-800-53/vs-nist-sp-800-171)) Honest mapping of what SZL *already* satisfies vs gaps:

| 800‑171 family | SZL current control | State |
|---|---|---|
| **AU — Audit & Accountability** | Khipu Merkle DAG + DSSE receipts (tamper‑evident, Lean‑proved TH11) | 🟢 strong substrate; needs off‑box WORM store + SIEM |
| **CM — Configuration Management** | SBOM (CycloneDX/SPDX), Scorecard, pinned figures | 🟡 partial; sign+attach SBOMs |
| **SA/SR — System & Services Acq. / Supply Chain** | cosign keyless (vessels), Scorecard, DCO | 🟡 1/6 signed; finish signing |
| **SI — System & Information Integrity** | CodeQL, Trivy, Λ‑gate + HUKLLA tripwires | 🟡 add Grype + central triage |
| **AC — Access Control** | none (no IdP/RBAC); Λ is action‑authz not user‑authz | 🔴 gap — UDS Core Keycloak |
| **IA — Identification & Authentication** | none on public Spaces | 🔴 gap — Keycloak SSO |
| **SC — System & Comms Protection** | TLS inherited from HF edge; wildcard CORS | 🔴 own the crypto boundary (Istio mTLS in UDS) |
| **IR — Incident Response** | VDP/PSIRT (this session, see policy doc) | 🟡 policy drafted, not operationalized |
| **RA — Risk Assessment** | STRIDE threat models (this session) | 🟡 drafted |
| **CA — Assessment & Monitoring** | OpenSSF Scorecard | 🟡 partial; needs ConMon |

**Strength to lead with:** our **AU/SI/SA‑SR supply‑chain + audit story is unusually strong** (formally verified). Our **AC/IA/SC web‑identity story is weak** and is exactly what UDS Core deployment fixes by inheritance.

## 7. CFR Part 800 / 810 export controls (drone relevance)

- **EAR (15 CFR Parts 730–774)** governs dual‑use items via the **Commerce Control List**; many commercial drone components/software fall under EAR rather than ITAR. **ITAR (22 CFR Parts 120–130)** governs USML defense articles. The **jurisdiction question** (USML vs CCL) is the first thing to resolve for Killinchu/Wamani. ([DDTC](https://deccs.pmddtc.state.gov/ddtc_public?id=ddtc_kb_article_page&sys_id=cfd40adedbf0130044f9ff621f9619d2))
- **10 CFR Part 810** (DOE assistance to foreign atomic energy activities) and **NRC 10 CFR Part 110** are **not applicable** to SZL's drone/software domain — flagged here only to confirm scope: *we are an EAR/ITAR question, not a nuclear‑export question.* Do not over‑claim a control regime we aren't in.
- **Action:** treat all counter‑UAS technical data as potentially export‑controlled until a jurisdiction analysis says otherwise; implement a Technology Control Plan, deemed‑export controls (no foreign‑person access to controlled data), and segregate controlled repos.

---

## 8. 18‑month sequenced roadmap

| Quarter | Milestone |
|---|---|
| **Q0 (now → 90 days)** | Fix CORS/headers/auth gaps; stand up Vanta/Drata; begin SOC 2 Type I; do 800‑171 SSP + CMMC L2 self‑assessment; commission USML/EAR jurisdiction analysis; **begin FedRAMP agency‑sponsor business development** |
| **Q1** | ITAR registration filed; SOC 2 Type II observation window opens; UDS Core deploy of flagships (Keycloak/Istio/Loki) → closes AC/IA/SC gaps |
| **Q2** | SOC 2 Type II report issued; GovCloud landing zone built; FedRAMP control implementation begins |
| **Q3–Q4** | 3PAO engaged; FedRAMP Moderate SAR; agency review |
| **Q5–Q6** | FedRAMP Moderate ATO → pursue **IL4/IL5** (inherit from UDS Core); CMMC L2 C3PAO audit before Phase 2 (Nov 2026) |

---

## Sources
- FedRAMP baselines & impact levels: <https://www.fedramp.gov/understanding-baselines-and-impact-levels/>
- FedRAMP marketplace (authorized offerings): <https://marketplace.fedramp.gov/>
- FedRAMP timeline/cost: <https://migrationcost.com/fedramp-cloud-migration-cost> · <https://knoxsystems.com/resources/fedramp-authorization-timeline> · <https://cdn.govexec.com/media/quzara_fedramp_pricing.pdf>
- DoD impact levels: <https://www.secondfront.com/resources/blog/understanding-dod-cloud-computing-impact-levels/> · <https://www.inkit.com/blog/fedramp-il4-il5-and-il6-explained>
- SOC 2 cost/timeline: <https://www.vanta.com/collection/soc-2/soc-2-audit-cost> · <https://soc2auditors.org/insights/soc-2-software-pricing-comparison/>
- CMMC 2.0: <https://godlan.com/cmmc-2-0-deadlines-rules/> · <https://www.huntress.com/cmmc-compliance-guide/cmmc-certification-timeline>
- NIST SP 800‑171: <https://csrc.nist.gov/pubs/sp/800/171/r3/final> · NIST SP 800‑53 Rev.5: <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>
- ITAR/DDTC fees: <https://www.federalregister.gov/documents/2024/12/10/2024-29032/international-traffic-in-arms-regulations-registration-fees> · <https://deccs.pmddtc.state.gov/ddtc_public?id=ddtc_kb_article_page&sys_id=cfd40adedbf0130044f9ff621f9619d2>
- DCSA (industrial security / facility clearance): <https://www.dcsa.mil/> · DoD CIO Cloud SRG: <https://dl.dod.cyber.mil/wp-content/uploads/cloud/pdf/Cloud_Computing_SRG_v1r4.pdf>
- UDS Core (IL5 trajectory): <https://github.com/defenseunicorns/uds-core> · <https://defenseunicorns.com/resources/announcing-uds-core-1-0/>

*— Yachay, 2026-06-01. We hold none of these yet. This is the honest path, not a claim.*
