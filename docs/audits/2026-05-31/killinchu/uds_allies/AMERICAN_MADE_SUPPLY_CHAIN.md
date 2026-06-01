# AMERICAN_MADE_SUPPLY_CHAIN.md — delivering "fully American-made" honestly

> An honest country-of-origin map of our software supply chain, and what "American-made" can defensibly mean to a DFARS standard. No bandaid: software "American-made" requires careful definition. — *Yachay*

---

## 1. The honest framing first

"American-made software" is **not** a clean claim the way "American-made steel" is. Modern software is assembled from thousands of transitive open-source dependencies authored by a globally distributed community. The defensible positions are:

1. **American-authored / American-maintained** (the prime artifact + first-party code).
2. **American-controlled supply chain** (build, sign, attest, distribute all under US control — *this is the UDS/Zarf/Sigstore story*).
3. **NDAA-clean** (free of prohibited Chinese telecom/surveillance components — Section 889).
4. **Country-of-origin disclosed** (an SBOM + provenance that names every dependency's origin so the government can make its own determination).

Of these, **#2 and #3 and #4 are honestly achievable and DFARS-defensible**; a blanket "every line of code is American" is **not** and should never be claimed.

## 2. What "American-made" formally means in contracts — DFARS 252.225

- **DFARS 252.225-7001, "Buy American and Balance of Payments Program,"** governs "domestic end products" vs. "qualifying country" end products for DoD. It uses a **component test** (cost of components mined/produced/manufactured in the US or qualifying countries) and exempts **commercial off-the-shelf (COTS)** items from the component test ([DFARS 252.225-7001 (acquisition.gov)](https://www.acquisition.gov/dfars/252.225-7001-buy-american-and-balance-payments-program.); [48 CFR 252.225-7001 (Cornell LII)](https://www.law.cornell.edu/cfr/text/48/252.225-7001); [DFARS 252.225-7000 (OSD)](https://www.acq.osd.mil/dpap/dars/dfars/html/r20171228/252225.htm)).
- **Key implication for us:** Buy-American was written for *hardware end products*; software is typically procured as a **service or COTS commercial item**, where the strict component-origin test is relaxed. So the honest, contract-relevant claim is **"US-developed, US-maintained commercial software with a US-controlled, attested supply chain"** — not a Buy-American component certification.
- **"Qualifying countries"** (NATO + allies under reciprocal defense procurement MOUs) are treated *like* domestic for many purposes — relevant because some of our deps are allied-European (see §4), which is a far weaker concern than non-allied origin.

## 3. NDAA Section 889 (and 848/805 family) — the real compliance teeth

- **Section 889 (FY2019 NDAA)** prohibits the government from buying — **or contracting with entities that *use*** — covered telecom/video-surveillance equipment/services from **Huawei, ZTE, Hytera, Hikvision, Dahua** (and affiliates). Part A (sale) live Aug 2019; Part B (use) live Aug 2020. Compliance is a **representation in SAM** after a "reasonable inquiry"; the obligation sits at the **prime/offeror** level ([Wiley Rein — Section 889 interim rule](https://www.wiley.law/alert-Long-Awaited-Controversial-NDAA-Section-889-Rule-on-Huawei-ZTE-and-Video-Companies-Emerges-from-FAR-Council); [Feldesman — Section 889 scope](https://www.feldesman.com/section-889-the-huawei-ban-in-federal-contracts-general-scope-and-considerations/); [Coalition for Govt Procurement memo](https://thecgp.org/images/Coalition-889-Blog.pdf)).
- **Software relevance:** 889 targets *telecom + surveillance hardware/services*, not OSS libraries per se. Our exposure is via **CI/build infra, container registries, and any bundled networking/video components** — keep those clean (no Huawei/ZTE/Hikvision/Dahua anywhere in build or runtime).
- **Companion authorities to track:** **NDAA §848** (beneficial-ownership / foreign-control disclosure for certain awards) and **§805** (acquisition-pathway / modular software pathway authorities) — relevant to *how* a software capability is bought, and to disclosing any foreign ownership/control/influence (FOCI). SZL must be clean on FOCI to ride DU's SBIR Phase III IDIQ.

## 4. Country-of-origin map of our likely dependency stack

UDS Core's named components (from [UDS Core Features docs](https://docs.defenseunicorns.com/core/concepts/core-features/overview/)) plus our own stack:

| Dependency | Role | Origin (honest) | US-origin alternative |
|---|---|---|---|
| **Zarf / Pepr / UDS Core** | delivery + policy + runtime | **US** (Defense Unicorns) | already US |
| **Sigstore (Cosign/Fulcio/Rekor)** | signing | **US** (Google/Red Hat/Purdue/Chainguard) | already US |
| **in-toto** | attestation | **US** (NYU/Purdue) | already US |
| **SLSA** | provenance levels | **US** (OpenSSF/Google) | already US |
| **Syft / Grype (Anchore)** | SBOM/scan | **US** (Santa Barbara) | already US |
| **Chainguard Images** | base images | **US** | already US |
| **Istio** | service mesh | **US-led** (Google/IBM/Lyft origin) | already US-led |
| **Prometheus / OpenTelemetry / Flux / Falco** | observability/GitOps/runtime | **US-led CNCF** (mixed global contributors) | CNCF-governed |
| **Grafana / Loki / Tempo** | dashboards/logs/traces | **Grafana Labs — Sweden/NY HQ (mixed)** | US-led alts (e.g., Prometheus+Thanos) |
| **Keycloak** | identity | **Red Hat (US-owned, originally European-led)** | US-owned (Red Hat/IBM) |
| **MariaDB** (common Keycloak DB) | database | **Founder in Finland; largely developed in Europe** | **PostgreSQL (US-heavy, BSD)** or US-managed RDS |
| **OpenSSL** | crypto | **Mixed international** (OpenSSL Foundation/Corp, US + intl) | **BoringSSL (Google/US)** or FIPS-validated US module |
| **Vector** | log shipping | **US (Datadog)** | already US |
| **Velero** | backup | **US (VMware/Broadcom origin)** | already US |

Sources for the two flagged foreign-origin deps: [MariaDB.org — "Our Founder lives in Finland… largely developed in Europe"](https://mariadb.org/mariadb-an-open-source-alternative/); [Red Hat build of Keycloak docs](https://docs.redhat.com/en/documentation/red_hat_build_of_keycloak/26.0/pdf/server_configuration_guide/Red_Hat_build_of_Keycloak-26.0-Server_Configuration_Guide-en-US.pdf).

## 5. Honest "American-made" position for Killinchu

**Defensible claim (use this):**
> "Killinchu is US-developed and US-maintained, runs on the American-controlled UDS/Zarf delivery rail, is signed with American-origin Sigstore, attested with American-academic in-toto to a published SLSA level, scanned with American Syft/Grype, built on American Chainguard images, certified Section-889-clean, and ships a full SBOM disclosing every dependency's country of origin."

**Do NOT claim:** "every dependency is American." Two transitive deps are flagged foreign-allied (MariaDB → Finland/Europe; OpenSSL → mixed-intl). Mitigations:
- Swap **MariaDB → PostgreSQL** (US-heavy, permissive BSD) for the Keycloak/state store where feasible.
- Pin crypto to a **FIPS 140-validated US module** (or BoringSSL) and document it.
- Where a CNCF dep is "mixed global," lean on the fact that **US-led CNCF/OpenSSF governance + US-controlled build/sign/attest** satisfies #2 (American-controlled supply chain) even when individual contributors are international.

## 6. The one-line audit posture

The "American-made" promise is honored not by pretending zero foreign code, but by **owning the supply chain end to end under US control, certifying NDAA-889-clean, and disclosing origin via SBOM + SLSA provenance** — which is exactly what the UDS ecosystem is engineered to produce. That is defensible to DFARS 252.225 and to a contracting officer.

---
*Compiled by Yachay — SZL Holdings. 2026-06-01. No bandaid — origins disclosed, not hidden.*
