# SZL Capability Leaders Benchmarking Research

**Purpose:** Identify current market and technical leaders for each capability area that SZL apps cover. This is benchmarking input — not a claim that SZL matches these leaders. All citations include source URLs.

**Generated:** 2026-06-12  
**Status:** Current (sources dated 2025–2026)

---

## Executive Summary (5 bullets)

1. **Threat-intel & vuln management:** Recorded Future leads commercial TIP by data volume (900B data points/day); MISP and OpenCTI lead open-source. For SBOM/vuln lifecycle, OWASP Dependency-Track + Anchore Syft/Grype is the community consensus stack, used by 20 000+ organizations.
2. **Market data:** Polygon.io is the dominant developer-grade real-time API (Robinhood is built on it); Bloomberg/Refinitiv own institutional; Yahoo Finance via `yfinance` is the prototype/free tier. SZL should add Polygon's WebSocket feeds for live ticks.
3. **Real estate & legal:** ATTOM (155 M+ U.S. parcels) is the authoritative enterprise property API; CourtListener (Free Law Project) is the gold standard open court-data API (9 M+ opinions, PACER RECAP). SZL's current sources (NYC HPD/DOB, Federal Register, CourtListener) are already best-in-class for open data.
4. **Supply-chain provenance:** Sigstore/cosign + in-toto (both CNCF Graduated) are the de-facto signing and attestation standard; the SLSA GitHub Generator produces Build L3 provenance out-of-the-box. SZL should wire `slsa-github-generator` into its Actions pipelines to reach SLSA L2/L3 automatically.
5. **Policy-as-code & formal verification:** Kyverno (CNCF Graduated March 2026) and OPA/Gatekeeper dominate Kubernetes admission control; SZL's choice of Pepr (TypeScript operator from Defense Unicorns) is a legitimate niche leader for DoD-adjacent stacks. In formal verification, Lean 4 + Mathlib is the fastest-growing proof ecosystem globally (210 000+ theorems, AI prover DeepSeek-Prover-V2 achieves 88.9 % on miniF2F), placing SZL's keystone in the most active community.

---

## 1. DEFENSE / Vulnerability Intelligence

**Context:** SZL pulls CISA KEV + NVD CVE feeds.

### Leaders

| # | Product / Project | Type | URL |
|---|-------------------|------|-----|
| 1 | **Recorded Future Intelligence Cloud** | Commercial TIP | https://www.recordedfuture.com |
| 2 | **MISP (Malware Information Sharing Platform)** | Open-source TIP | https://www.misp-project.org |
| 3 | **OpenCTI** | Open-source TIP | https://www.opencti.io |
| 4 | **CISA KEV + AIS** | Government feed (free) | https://www.cisa.gov/known-exploited-vulnerabilities-catalog |

**Recorded Future** is the commercial heavyweight, processing ~900 billion data points per day from open web, dark web, technical feeds, and human intelligence; its Intelligence Graph correlates threat actors, malware, and infrastructure in near-real-time. ([Stellar Cyber, 2026](https://stellarcyber.ai/learn/top-cyber-threat-intelligence-cti-platforms/))

**MISP** is the dominant open-source IOC-sharing platform with STIX/TAXII support and a large community; it is the preferred hub for CERTs and ISACs globally. **OpenCTI** (STIX 2.1 native, knowledge-graph visualization) is the modern complement to MISP, used by teams that need graph-based analyst workflows without licensing costs. ([SeqOps, 2026](https://seqops.io/en/knowledge-hub/security-monitoring-threat-intelligence/threat-intelligence-tools-comparison))

**CISA's KEV catalog + Automated Indicator Sharing (AIS)** remains the authoritative government-backed free feed — SZL correctly sources it already.

**What SZL should adopt:**  
Enrich the existing KEV/NVD feed with **EPSS scores** (Exploit Prediction Scoring System, published alongside NVD) and cross-reference against the **MISP threat-intel community feeds** to add context (threat-actor attribution, TTP mapping to ATT&CK) without commercial licensing. This moves SZL from raw CVE enumeration toward prioritized, actor-contextualized risk scoring — the differentiating feature of Recorded Future, available for free via MISP.

---

## 2. CYBER — Vuln Management / SBOM / Supply-Chain Security

**Context:** SZL ingests KEV/NVD/GitHub Security Advisories.

### Leaders

| # | Product / Project | Type | URL |
|---|-------------------|------|-----|
| 1 | **OWASP Dependency-Track** | Open-source SBOM manager | https://dependencytrack.org |
| 2 | **Anchore Syft + Grype** | Open-source SBOM gen + scanner | https://github.com/anchore/syft · https://github.com/anchore/grype |
| 3 | **Aqua Security Trivy** | Open-source all-in-one scanner | https://github.com/aquasecurity/trivy |
| 4 | **Snyk** | Commercial SCA / SBOM | https://snyk.io |

**Dependency-Track** is used by 20 000+ organizations to continuously monitor SBOMs against NVD, GitHub Advisories, Sonatype OSS Index, and OSV — it is the OWASP-backed open-source gold standard for long-term SBOM lifecycle management. ([dependencytrack.org](https://dependencytrack.org))

**Syft** (SBOM generator, 32 k+ GitHub stars) paired with **Grype** (vulnerability matcher) provides the recommended free CI/CD stack: generate a CycloneDX/SPDX SBOM once, scan it against multiple feeds, fail builds on critical findings. ([AppSec Santa, 2026](https://appsecsanta.com/supply-chain/sbom-tools-comparison))

**Trivy** (Aqua Security, 32 k+ stars) is the preferred all-in-one scanner for container images, filesystems, and IaC, producing both CycloneDX and SPDX output. It is ideal when a single binary covers scanning + SBOM generation. ([OX Security, 2025](https://www.ox.security/blog/sbom-tools/))

**Snyk** leads the commercial tier for developer experience, reachability analysis (eliminates false positives by tracing call paths), and license intelligence.

**What SZL should adopt:**  
Integrate **Syft + Grype in CI/CD** (or Trivy for container images) to auto-generate and sign SBOMs on every build, then ingest them into **Dependency-Track** for continuous monitoring. This satisfies EO 14028 and EU CRA SBOM obligations, closes the gap between SZL's current advisory-pull model and continuous component-level risk tracking, and is directly wirable to the Sigstore/cosign attestation stack (Capability 6). ([ENISA SBOM Analysis, 2025](https://www.enisa.europa.eu/sites/default/files/2025-12/SBOM%20Analysis%20-%20Towards%20an%20Implementation%20Guide_v1.20-Published.pdf))

---

## 3. FINANCE — Market Data

**Context:** SZL integrates Yahoo Finance, Coinbase, and FX rates.

### Leaders

| # | Product / Project | Type | URL |
|---|-------------------|------|-----|
| 1 | **Polygon.io** | Developer-grade real-time API | https://polygon.io |
| 2 | **Bloomberg Terminal / BLPAPI** | Institutional gold standard | https://www.bloomberg.com/professional/products/bloomberg-terminal/ |
| 3 | **Refinitiv (LSEG) Eikon / Data API** | Institutional tier 2 | https://developers.lseg.com |
| 4 | **Alpaca Markets** | Free real-time + paper trading | https://alpaca.markets |

**Polygon.io** is the developer-grade leader for real-time and historical US equities, options, and crypto data. Robinhood's real-time data infrastructure is built on it; paid plans start at $29/month and provide WebSocket tick feeds, full Level 1 data, and 15+ years of intraday history. It consistently ranks #1 for production trading apps among independent comparisons. ([APIScout, 2026](https://apiscout.dev/guides/best-stock-market-financial-apis-2026))

**Bloomberg Terminal** (~$2 400/month/seat) and **Refinitiv Eikon** (~$1 800/month) are the institutional benchmarks for breadth, depth, news integration, and coverage of every asset class globally. They define what "complete" market data looks like. ([Wayland Z Quant Book](https://waylandz.com/quant-book-en/Data-Sources-and-API-Comparison/))

**Alpaca Markets** provides free real-time US equity and crypto data (200 calls/min, 10 years of 1-min bars) with a paper-trading account — the best free option for a production developer workflow.

**Yahoo Finance via `yfinance`** (SZL's current source) is community-maintained, not officially supported by Yahoo, rate-limited, and not recommended for commercial production; it is best treated as a fallback/prototype tool. ([APIScout, 2026](https://apiscout.dev/guides/best-stock-market-financial-apis-2026))

**What SZL should adopt:**  
Replace `yfinance` in production paths with **Polygon.io's free tier** (5 calls/min, delayed data) for US equities and add **Polygon WebSocket streams** for live ticks in the market dashboard. For FX, supplement Coinbase with **Frankfurter API** (free, ECB-backed) or **Alpha Vantage FX** (free tier, 25 req/day). This hardens the data lineage from unofficial wrapper to an official API contract with documented SLAs.

---

## 4. REAL ESTATE — Property / Regulatory Data

**Context:** SZL uses NYC HPD/DOB open data and Treasury rates.

### Leaders

| # | Product / Project | Type | URL |
|---|-------------------|------|-----|
| 1 | **ATTOM Data Solutions** | Enterprise property API | https://www.attomdata.com |
| 2 | **CoreLogic** | Enterprise mortgage / risk data | https://www.corelogic.com |
| 3 | **NYC Open Data (HPD/DOB/PLUTO)** | Government open data | https://opendata.cityofnewyork.us |
| 4 | **U.S. Census Bureau ACS API** | Demographic + housing data | https://www.census.gov/data/developers/data-sets.html |

**ATTOM Data Solutions** covers 155–158 million U.S. properties with ownership history, deed/mortgage records, tax assessments, AVMs, foreclosure data, and neighborhood/climate data via a normalized API. It is the go-to for lenders, insurers, and large PropTech platforms; enterprise contracts typically run $850–$2 000/month. ([ATTOM, 2026](https://www.attomdata.com/news/attom-insights/best-apis-real-estate/))

**CoreLogic** is the complementary institutional leader, dominant in mortgage risk analytics, MLS aggregation, and financial-industry data; it is widely used by Fannie Mae, Freddie Mac, and major bank underwriting systems. ([apiscrapy, 2025](https://apiscrapy.com/top-property-data-providers/))

**NYC Open Data** (HPD, DOB, MapPLUTO, ACRIS) is the best-in-class open government real-estate data source in the U.S. — SZL already correctly uses it. HPD's Open Data page is at [nyc.gov/site/hpd/about/open-data.page](https://www.nyc.gov/site/hpd/about/open-data.page).

The **U.S. Census Bureau ACS API** (American Community Survey) provides the authoritative demographic, household income, and housing-unit data used by every major PropTech and insurer for market-area analytics. It is free and well-documented.

**What SZL should adopt:**  
Add the **FHFA House Price Index API** (free, monthly, national/metro/ZIP) and the **HUD Fair Market Rents API** (free) as authoritative rate benchmarks alongside Treasury yields — these are the data sources that regulate Section 8 vouchers and underpin institutional AVM models. Both are already aggregated in platforms like PropData ($49/mo) but available free at source. ([HUD FMR API](https://www.huduser.gov/portal/dataset/fmr-api.html))

---

## 5. LEGAL — Court Filing APIs & Legal-Tech

**Context:** SZL integrates Federal Register and CourtListener.

### Leaders

| # | Product / Project | Type | URL |
|---|-------------------|------|-----|
| 1 | **CourtListener / Free Law Project** | Open court data (nonprofit) | https://www.courtlistener.com |
| 2 | **Thomson Reuters Westlaw Developer Portal** | Enterprise legal research API | https://developers.thomsonreuters.com |
| 3 | **LexisNexis Developer Portal** | Enterprise legal API | https://developer.lexisnexis.com |
| 4 | **GovInfo API (GPO)** | Federal government documents | https://api.govinfo.gov |

**CourtListener** (Free Law Project nonprofit) is the authoritative open court-data platform: 9 million+ U.S. court opinions, the full RECAP/PACER federal docket archive, 3.4 million minutes of oral argument audio, citation graph, and judge biographies. The REST API v4 is free (5 000 req/day after token sign-up), self-serve as of May 2026, and implements semantic search (vector embeddings, introduced Nov 2025). SZL already integrates it — a correct choice. ([Free Law Project, 2026](https://free.law/2026/05/07/api-included-in-memberships/))

**Westlaw** (Thomson Reuters Developer Portal, launched April 2024) exposes 137+ APIs covering case law, statutes, litigation analytics, dockets, and SEC filings. **LexisNexis Developer Portal** (launched 2022) is broadly equivalent. Both are enterprise-only, sales-gated, and priced accordingly — not practically accessible without a contract. ([Vaquill AI, 2026](https://www.vaquill.ai/blog/court-data-apis-compared-2026))

**GovInfo API** (U.S. Government Publishing Office) provides programmatic access to the Federal Register, Congressional Record, Code of Federal Regulations, and all U.S. GPO publications as structured JSON/XML — free with an api.data.gov key. SZL's Federal Register feed should be wired here for canonical, GPO-signed document access. ([GovInfo API](https://www.govinfo.gov/features/api))

**What SZL should adopt:**  
Upgrade the Federal Register integration to use the **GovInfo API** (`https://api.govinfo.gov`) for canonical GPO-signed XML, enabling full CFR and U.S. Code cross-referencing — not just Federal Register daily issues. Additionally, enable CourtListener's **citation-lookup endpoint** (`/api/rest/v4/citation-lookup/`) as a hallucination-guard rail for any AI-generated legal text in SZL outputs: it verifies Bluebook citations against the live database.

---

## 6. Supply-Chain Provenance / Attestation

**Context:** SZL claims SLSA L1, roadmap L2/L3; uses GitHub Actions CI/CD.

### Leaders

| # | Product / Project | Type | URL |
|---|-------------------|------|-----|
| 1 | **Sigstore (cosign + Rekor + Fulcio)** | Keyless signing & transparency log | https://sigstore.dev |
| 2 | **in-toto** | Attestation framework | https://in-toto.io |
| 3 | **SLSA GitHub Generator** | SLSA L3 provenance for GitHub Actions | https://github.com/slsa-framework/slsa-github-generator |
| 4 | **Tekton Chains** | SLSA provenance for Tekton pipelines | https://tekton.dev/docs/chains/ |

**Sigstore** (CNCF Graduated) is the de-facto industry standard for keyless artifact signing. `cosign` signs and verifies OCI images and attestations using short-lived OIDC certificates (no long-lived keys to manage); `Rekor` is the public transparency log; `Fulcio` is the certificate authority. The Sigstore Rekor v2 GA shipped alongside in-toto's CNCF graduation in 2025. Nearly every major open-source project now ships Sigstore-signed releases. ([Chainguard, 2022](https://www.chainguard.dev/unchained/a-toolbox-for-a-secure-software-supply-chain))

**in-toto** (CNCF Graduated 2025) is the attestation framework underneath SLSA, Sigstore cosign attestations, and GitHub Artifact Attestations. It defines the structure and semantics of provenance claims; Sigstore provides the trust anchor and signing transparency. The two projects are complementary and interoperate on the in-toto bundle format. ([Safeguard.sh, 2025](https://safeguard.sh/resources/blog/in-toto-cncf-graduation-attestation-bundle-2025))

**SLSA GitHub Generator** is the reference toolset for achieving SLSA Build L3 (non-forgeable, isolated build provenance) on GitHub Actions for any language, with zero custom code required — just add the workflow. ([GitHub slsa-framework/slsa-github-generator](https://github.com/slsa-framework/slsa-github-generator))

**Tekton Chains** auto-generates signed in-toto attestations for every TaskRun/PipelineRun, supports SLSA v1.0 provenance, and integrates with Sigstore keyless signing — the Kubernetes-native path to SLSA L3. ([Tekton SLSA docs](https://tekton.dev/docs/chains/slsa-provenance/))

**What SZL should adopt:**  
Wire **`slsa-github-generator`** into SZL's existing GitHub Actions pipelines (2–3 workflow lines) to auto-generate SLSA Build L3 provenance attestations and upload them to Rekor — this directly closes the roadmap gap from L1 to L3 without architectural changes. Pair with **`cosign sign` + `cosign verify`** gates in the CD pipeline so no unsigned image can be deployed to the cluster. The Pepr receipt-gate (Capability 7) can then enforce `cosign verify` as the cluster-admission policy.

---

## 7. Policy-as-Code Admission Control

**Context:** SZL uses **Pepr** (Defense Unicorns) for Kubernetes receipt-gate admission control.

### Leaders

| # | Product / Project | Type | URL |
|---|-------------------|------|-----|
| 1 | **Kyverno** | CNCF Graduated K8s-native engine | https://kyverno.io |
| 2 | **OPA / Gatekeeper** | CNCF Graduated general-purpose | https://open-policy-agent.github.io/gatekeeper |
| 3 | **Pepr** (Defense Unicorns) | TypeScript K8s operator/middleware | https://pepr.dev |
| 4 | **ValidatingAdmissionPolicy (CEL)** | K8s built-in (1.30+, beta 1.28) | https://kubernetes.io/docs/reference/access-authn-authz/validating-admission-policy/ |

**Kyverno** (CNCF Graduated March 2026) is the community consensus leader for Kubernetes-native policy: YAML-based policies (no new language to learn), native validate/mutate/generate/verifyImages in a single CRD, built-in Cosign/Notary image verification, and the most active community in the space. It graduated from CNCF in March 2026. ([jorijn.com, 2026](https://jorijn.com/en/knowledge-base/kubernetes/security/admission-controllers-kyverno-opa-gatekeeper-cel/))

**OPA / Gatekeeper** (CNCF Graduated Feb 2021) remains the leader for organizations that need a single policy language (Rego) across Kubernetes, service meshes, CI/CD, and API gateways — a cross-stack policy engine, not just a K8s tool. Styra DAS provides enterprise management. ([policyascode.dev, 2024](https://policyascode.dev/blog/opa-gatekeeper-vs-kyverno/))

**Pepr** (Defense Unicorns, open-source) is a TypeScript K8s middleware/operator that uses admission webhooks under the hood, is purpose-built for DoD/government environments, and uniquely includes a built-in `etcd`-backed store and scheduler (cron-like) alongside the policy engine — making it a hybrid operator + policy tool. It is not CNCF-graduated but is the reference framework for NinjaFabric / UDS stacks. ([Pepr docs](https://docs.pepr.dev))

**ValidatingAdmissionPolicy (CEL)** is built into Kubernetes 1.30+ with zero operational overhead, suitable for simple field validation without deploying a sidecar controller.

**What SZL should adopt:**  
Continue using **Pepr** for the receipt-gate as designed (it is the right choice for a TypeScript/DoD-aligned stack). Add a **Kyverno `verifyImages` policy** as a second admission layer specifically for OCI image-signature verification (it natively calls `cosign` and validates Sigstore attestations) — this is one feature where Kyverno's built-in support is significantly more ergonomic than Pepr's current implementation. The combination delivers defense-in-depth: Pepr for business-logic gates, Kyverno for supply-chain provenance enforcement.

---

## 8. Formal Verification / Proof Platforms

**Context:** SZL's keystone is **Lean 4** with Mathlib for machine-checked mathematical proofs.

### Leaders

| # | Product / Project | Type | URL |
|---|-------------------|------|-----|
| 1 | **Lean 4 + Mathlib** | Fastest-growing proof ecosystem | https://lean-lang.org · https://leanprover-community.github.io |
| 2 | **Rocq (formerly Coq)** | Established, software verification leader | https://rocq-prover.org |
| 3 | **Isabelle/HOL** | Strongest automation, industrial use | https://isabelle.in.tum.de |
| 4 | **DeepSeek-Prover-V2** | State-of-the-art AI Lean 4 prover | https://github.com/deepseek-ai/DeepSeek-Prover-V2 |

**Lean 4 + Mathlib** is the fastest-growing proof ecosystem globally. Mathlib had formalized 210 000+ theorems and 100 000+ definitions as of May 2025, with 340+ contributors. Major in-progress milestones include Fermat's Last Theorem (Buzzard/Taylor, projected 2026) and the Carleson Theorem formalization. Google DeepMind's AlphaProof proved IMO problems in Lean (2024); **DeepSeek-Prover-V2-671B** achieves 88.9% on the miniF2F benchmark (April 2025). ([Wikipedia — Lean theorem prover](https://en.wikipedia.org/wiki/Lean_theorem_prover); [DeepSeek-Prover-V2 arXiv](https://arxiv.org/pdf/2504.21801.pdf))

**Rocq (formerly Coq)**, developed at INRIA, is the reference for software verification (CompCert verified C compiler, seL4 kernel proofs via CertiKOS) and is used in the Mathematical Components library. It is better established in formal software correctness than Lean but has a smaller mathematical library. ([Lean FAQ](https://lean-lang.org/faq/))

**Isabelle/HOL** (TU Munich) has the strongest automated proof tactics and is used in large industrial deployments (Airbus DO-178C software certification, the seL4 formal verification). Its HOL foundation (Higher-Order Logic, not dependent type theory) trades off expressive power for powerful automation. ([VeriSoftBench arXiv, 2026](https://www.arxiv.org/pdf/2602.18307.pdf))

**DeepSeek-Prover-V2** (April 2025, open-source, 671B parameters) is the current AI SOTA for Lean 4 theorem proving, achieving 88.9% on miniF2F-test and 37.1% on ProofNet-test (college-level problems). It uses recursive theorem decomposition + reinforcement learning. ([DeepSeek-Prover-V2 arXiv](https://arxiv.org/pdf/2504.21801.pdf))

**What SZL should adopt:**  
Integrate **`mathlib4`'s `omega` and `decide` tactics** for all finite-domain arithmetic proofs in SZL's verification layer — these are fully automated and eliminate manual proof steps. Additionally, evaluate **LeanDojo** (https://leandojo.org) as a programmatic interface for extracting proof states and theorem databases from Mathlib, enabling SZL to expose its verified theorems as machine-queryable artifacts rather than static `.lean` files. This directly parallels how DeepSeek-Prover-V2 trains on Mathlib-derived data.

---

## Source Index

| Area | Primary Sources |
|------|----------------|
| Threat-intel | [SeqOps 2026](https://seqops.io/en/knowledge-hub/security-monitoring-threat-intelligence/threat-intelligence-tools-comparison) · [Parse.gl rankings](https://parse.gl/rankings/cloud-security/cyber-threat-intelligence-platforms) · [Stellar Cyber 2026](https://stellarcyber.ai/learn/top-cyber-threat-intelligence-cti-platforms/) |
| SBOM/Vuln | [AppSec Santa 2026](https://appsecsanta.com/supply-chain/sbom-tools-comparison) · [OWASP Dependency-Track](https://dependencytrack.org) · [ENISA 2025](https://www.enisa.europa.eu/sites/default/files/2025-12/SBOM%20Analysis%20-%20Towards%20an%20Implementation%20Guide_v1.20-Published.pdf) |
| Finance | [APIScout 2026](https://apiscout.dev/guides/best-stock-market-financial-apis-2026) · [Waylandz Quant](https://waylandz.com/quant-book-en/Data-Sources-and-API-Comparison/) |
| Real estate | [ATTOM 2026](https://www.attomdata.com/news/attom-insights/best-apis-real-estate/) · [NYC HPD Open Data](https://www.nyc.gov/site/hpd/about/open-data.page) |
| Legal | [Free Law Project 2026](https://free.law/2026/05/07/api-included-in-memberships/) · [Vaquill AI 2026](https://www.vaquill.ai/blog/court-data-apis-compared-2026) · [GovInfo API](https://www.govinfo.gov/features/api) |
| Provenance | [Safeguard.sh 2025](https://safeguard.sh/resources/blog/in-toto-cncf-graduation-attestation-bundle-2025) · [slsa-github-generator](https://github.com/slsa-framework/slsa-github-generator) · [Chainguard](https://www.chainguard.dev/unchained/a-toolbox-for-a-secure-software-supply-chain) |
| Policy-as-code | [jorijn.com 2026](https://jorijn.com/en/knowledge-base/kubernetes/security/admission-controllers-kyverno-opa-gatekeeper-cel/) · [Pepr docs](https://docs.pepr.dev) · [policyascode.dev](https://policyascode.dev/blog/opa-gatekeeper-vs-kyverno/) |
| Formal verification | [Wikipedia Lean](https://en.wikipedia.org/wiki/Lean_theorem_prover) · [DeepSeek-Prover-V2](https://arxiv.org/pdf/2504.21801.pdf) · [VeriSoftBench 2026](https://www.arxiv.org/pdf/2602.18307.pdf) · [Lean FAQ](https://lean-lang.org/faq/) |
