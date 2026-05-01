# Amaru — COTS-ERP Integration Posture

**Document ID:** AMARU-COMP-ERP-001
**Version:** 1.0
**Owner:** Stephen P. Lutar Jr., SZL Holdings
**Last reviewed:** 2026-04-30
**Audience:** NYSTEC, government finance/HR/procurement modernization buyers, prime integrators
**Classification:** Public

---

## 1. Purpose

NYSTEC and most state-level modernization programs ask "how does your tool integrate with our COTS ERP" because most agency back offices run on a commercial-off-the-shelf ERP (Oracle, SAP, Workday, Infor, Tyler, Microsoft Dynamics). A vendor's answer to this question is often vague. This document is Amaru's specific answer.

## 2. Position

Amaru is **not** an ERP. Amaru is a sync layer that sits **alongside** the ERP. Its job is to keep the ERP's data and downstream systems coherent without forcing the ERP to be the system of record for everything, and without requiring agencies to rip and replace.

Three integration patterns are supported, each with documented strengths and trade-offs:

| Pattern | Integration depth | When to use |
|---|---|---|
| **Read-mirror** | Read-only outbound from ERP via vendor APIs / change-data-capture | Reporting, analytics, secondary-system population |
| **Bi-directional sync** | Read + write through vendor-supported integration surfaces | Two systems share a record, ERP is system-of-record, Amaru maintains downstream coherence |
| **System-of-record-shifted** | Writes to ERP via supported APIs after upstream truth elsewhere | Modernization scenarios where ERP is downstream of a newer system |

## 3. Supported COTS ERPs (v1)

| ERP | Versions | Integration type | Mechanism |
|---|---|---|---|
| **Oracle E-Business Suite (EBS)** | 12.2.x | Read-mirror, Bi-dir | Oracle Integration Cloud + REST/SOAP via supported APIs; CDC via Oracle GoldenGate where licensed |
| **Oracle Fusion / ERP Cloud** | Current | Read-mirror, Bi-dir | OIC + REST APIs; BI Publisher exports for bulk |
| **SAP S/4HANA** | On-prem + RISE | Read-mirror, Bi-dir | OData APIs, CPI, BAPI/RFC where exposed |
| **SAP ECC** | 6.0 EHP6+ | Read-mirror | OData where available; PI/PO via approved channels |
| **Workday** | Current | Read-mirror, Bi-dir | Workday RaaS, REST API, Connect / Studio integrations |
| **Microsoft Dynamics 365** | F&O, BC | Read-mirror, Bi-dir | Dataverse / OData + Logic Apps |
| **Infor (CloudSuite, M3, Lawson)** | Current cloud | Read-mirror, Bi-dir | Infor ION |
| **Tyler Munis** | Current | Read-mirror | Tyler-supported APIs (where licensed) |
| **Tyler Eden** | Current | Read-mirror | Tyler-supported APIs |
| **Banner (Ellucian)** | 9.x | Read-mirror | Banner Integration Suite + Ethos |
| **NetSuite** | Current | Read-mirror, Bi-dir | SuiteTalk REST/SOAP |

For ERPs not listed, Amaru's connector framework supports any system with a documented API; integration is a custom engagement.

## 4. Specific concerns the COTS-ERP-shaped buyer always asks

### 4.1 Will you break my support contract?

**No.** Amaru integrates only through vendor-supported integration surfaces (APIs, integration-layer products like OIC/CPI/ION, certified change-data-capture). Amaru does **not** inject DLLs, hook into proprietary kernels, or rely on screen-scraping where an API exists. SZL will execute a written attestation to this effect per engagement.

### 4.2 Will you exceed our API quotas?

Amaru's connectors are quota-aware:

- They observe the ERP's published per-tenant rate limits.
- They use change-data-capture or delta queries instead of full pulls wherever the ERP supports it.
- They back off and retry with jitter on 429s.
- Integration metrics are reported per customer per ERP per month.

### 4.3 Will you write to my ERP without my approval?

**Only if you explicitly enable bi-dir for a record class.** Default posture is read-only. Bi-dir requires:

- A signed customer policy declaring the record class and direction
- A scoped service principal in the ERP with least-privilege
- Approval of every non-reversible write via `aef-policy-guard`

### 4.4 What if my ERP support vendor objects?

SZL Holdings is willing to be present on calls with the ERP support vendor and to provide written documentation of the integration surfaces used. We have not encountered a support vendor objecting to API-only integration through their supported surfaces; if one did, we would re-scope to remove the objected surface.

### 4.5 What about license compliance?

Some ERP licenses limit access by named user, indirect user, or document throughput. Amaru:

- Is documented as an integration system, not a user-replacement system.
- Provides a quarterly access-review report scoped to the ERP service principal so the customer's license-compliance team can audit.
- For SAP indirect-use considerations, treats Amaru-driven traffic per the customer's existing indirect-use license posture, which the customer must declare.

### 4.6 Schema drift and version upgrades

When the ERP undergoes a major version upgrade or schema migration:

- Amaru's connectors are versioned per ERP major version.
- A customer's connector pinned to vN continues to operate until the customer chooses to migrate to vN+1.
- A side-by-side-running mode is available during a migration window.

## 5. Government-specific patterns

For state and local governments running ERPs in modernization programs:

- **Banner / Ellucian (higher-ed)** — Amaru can read student/finance/HR data via Ethos and route to downstream learning analytics or reporting layers without touching Banner directly.
- **Tyler Munis / Eden** — Amaru can mirror financial transactions to data warehouses or legislative-reporting layers.
- **Workday Public Sector** — Amaru can supplement Workday Adaptive or Prism with cross-domain data the agency needs but Workday is not ingesting natively.

## 6. Security and residency

When integrating with a COTS ERP, Amaru:

- Holds ERP credentials in AWS Secrets Manager (or customer-managed vault).
- Uses short-lived tokens where the ERP supports OAuth 2.0 client-credentials.
- Does not retain ERP payload data beyond the configured window in `AMARU-02-retention-deletion.md` unless the customer has elected durable persistence.
- Tags ingested data per `AMARU-01-data-classification.md` before any onward routing.
- Honors the customer's residency posture per `A11OY-04-us-data-residency.md`.

## 7. Implementation pattern

A typical engagement runs in four phases:

1. **Source mapping** (week 1) — list every record class the customer needs in scope, determine ERP integration surface for each, compute classification posture.
2. **Connector configuration** (weeks 2-3) — configure the relevant connector, test in non-production, run a delta against the customer's known truth.
3. **Pilot run** (weeks 3-6) — run in shadow mode (no writes) and reconcile against the ERP's own outputs daily.
4. **Cutover** (week 6+) — flip to active sync with documented rollback.

## 8. Honest disclosures

- **Not every ERP edition is supported equally.** Older on-premise editions of major ERPs may have limited integration surfaces. SZL is direct about which integration patterns are realistic per edition during the discovery phase.
- **Customer license posture is the customer's responsibility.** SZL does not opine on whether the customer's existing ERP licenses cover Amaru-driven access. We provide the data the license-compliance team needs to make that determination.
- **Bi-directional is conservative by default.** We will not enable destructive writes to an ERP without a signed change-management approval per record class. This is non-negotiable.

## 9. Change log

| Date | Change |
|---|---|
| 2026-04-30 | Initial publication. |

## 10. Contact

Stephen P. Lutar Jr. · inquiries@szlholdings.com
