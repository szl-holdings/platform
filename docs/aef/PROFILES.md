# AEF Domain Profile Catalog

This document catalogues the six domain profiles shipped with AEF Phase 5. Each profile is versioned, tenant-scoped, and registered in the `DomainProfileRegistry` at `packages/aef-domain-profiles`.

---

## lyte_governance_ops v1.0.0

**Platform**: Lyte — Decision Intelligence  
**Privacy Level**: internal  
**Reranking**: enabled  
**Top-K**: 12  
**Max Candidates**: 80

### Purpose

The Lyte governance operations profile retrieves documents describing approval chains, operational risk signals, ownership gaps, stalled workflows, and stakeholder engagement records. It is the retrieval foundation for Lyte's five core surfaces: Pulse (risk briefings), Risk (signal detection), Intelligence (pattern analysis), Signals (real-time feeds), and Motion (action routing).

### Chunking Strategy

Hybrid chunking with a 480-token target, 80-token overlap, heading-aware splitting, and a 96-token minimum. Hybrid mode combines sentence-level splitting with semantic coherence checks to avoid splitting mid-sentence in approval records and risk narratives.

### Exact-Match Boost Terms

Approval chain IDs, opportunity codes, project references, deliverable IDs, escalation records, stakeholder mentions, risk signal references, and governance review citations.

### Prompt Templates

Query template (`lyte_gov_query_v1`): Instructs the encoder to treat the query as a governance and operations knowledge retrieval request, preserving structured identifiers verbatim.

Document template (`lyte_gov_doc_v1`): Instructs the encoder to represent the document as operational governance content indexed for risk signal and approval chain queries.

### Score Thresholds

| Threshold | Value |
|---|---|
| Minimum relevance | 0.35 |
| Rerank drop-below | 0.40 |
| Exact-match boost floor | 0.25 |
| High confidence | 0.78 |

### Retention Rules

| Rule | Value |
|---|---|
| Default retention | 365 days |
| Request log retention | 90 days |
| Evidence retention | 730 days |
| Audit trail retention | 1825 days |
| Deletion required | No |

---

## vessels_maritime_risk v1.0.0

**Platform**: Vessels — Maritime Intelligence  
**Privacy Level**: confidential  
**Reranking**: enabled  
**Top-K**: 10  
**Max Candidates**: 100

### Purpose

The Vessels maritime risk profile retrieves vessel incident reports, voyage risk assessments, AIS anomaly logs, dark-vessel detection advisories, sanctions screening records, and port-state control findings. IMO numbers receive a 2× score boost; MMSI codes receive a 1.8× boost.

### Chunking Strategy

Paragraph-level chunking with a 512-token target and 64-token overlap. Heading-aware splitting preserves the structure of multi-section maritime reports and voyage records.

### Exact-Match Boost Terms

IMO numbers, MMSI codes, AIS references, dark vessel mentions, flag state codes, vessel names matched against sanctions lists, port-state control references, and cargo manifest identifiers.

### Score Thresholds

| Threshold | Value |
|---|---|
| Minimum relevance | 0.40 |
| Rerank drop-below | 0.45 |
| Exact-match boost floor | 0.30 |
| High confidence | 0.80 |

### Retention Rules

| Rule | Value |
|---|---|
| Default retention | 730 days |
| Request log retention | 180 days |
| Evidence retention | 1095 days |
| Audit trail retention | 2555 days |
| Deletion required | No |

---

## terra_real_estate_intel v1.0.0

**Platform**: Terra — NYC Real Estate Intelligence  
**Privacy Level**: internal  
**Reranking**: enabled  
**Top-K**: 12  
**Max Candidates**: 100

### Purpose

The Terra real estate intelligence profile retrieves NYC property ownership records, tax lien filings, distress signal reports, deal pipeline entries, market comparables, and borough-level analysis. NYC parcel IDs (BBL format) receive a 1.9× exact-match boost.

### Chunking Strategy

Semantic chunking with a 448-token target and 72-token overlap. Semantic mode is preferred here because NYC property documents often contain structured data tables, address blocks, and ownership trees that benefit from coherence-aware segmentation.

### Exact-Match Boost Terms

NYC parcel IDs (BBL), property addresses, tax lien references, lis pendens filings, deed-in-lieu mentions, foreclosure references, owner-of-record names, co-op and condo board designations.

### Score Thresholds

| Threshold | Value |
|---|---|
| Minimum relevance | 0.38 |
| Rerank drop-below | 0.42 |
| Exact-match boost floor | 0.28 |
| High confidence | 0.77 |

### Retention Rules

| Rule | Value |
|---|---|
| Default retention | 365 days |
| Request log retention | 90 days |
| Evidence retention | 730 days |
| Audit trail retention | 1825 days |
| Deletion required | No |

---

## aegis_security_incident v1.0.0

**Platform**: Aegis — Unified Defense & Intelligence Command  
**Privacy Level**: restricted  
**Reranking**: enabled  
**Top-K**: 10  
**Max Candidates**: 120

### Purpose

The Aegis security incident profile retrieves incident investigation timelines, threat indicator records, CVE advisories, MITRE ATT&CK technique mappings, MSP operational alerts, and cyber-asset exposure reports. CVE identifiers and incident IDs receive a 2× exact-match boost. Control IDs and compliance regulation codes receive a 1.8× boost.

### Chunking Strategy

Paragraph-level chunking with a compact 384-token target and 48-token overlap. Shorter chunks improve precision for security intelligence queries, which typically seek specific indicator details rather than narrative context.

### Exact-Match Boost Terms

CVE IDs, incident IDs, MITRE ATT&CK technique IDs (e.g., T1078), control IDs, CMMC references, FedRAMP references, critical severity flags, attack vector terms, lateral movement references, ransomware family names.

### Score Thresholds

| Threshold | Value |
|---|---|
| Minimum relevance | 0.42 |
| Rerank drop-below | 0.48 |
| Exact-match boost floor | 0.32 |
| High confidence | 0.82 |

### Retention Rules

| Rule | Value |
|---|---|
| Default retention | 730 days |
| Request log retention | 365 days |
| Evidence retention | 1825 days |
| Audit trail retention | 2555 days |
| Deletion required | No |

---

## prism_legal_matter v1.0.0

**Platform**: Counsel — Legal Matter Command  
**Privacy Level**: privileged  
**Reranking**: enabled  
**Top-K**: 10  
**Max Candidates**: 80

### Purpose

The Counsel legal matter profile retrieves matter briefs, filing obligation timelines, discovery logs, contract clauses, regulatory compliance filings, and court docket entries. Docket IDs and case numbers receive a 1.9× boost. Citation codes and regulation references receive a 1.7× boost.

All retrieval operations under this profile are subject to attorney-client privilege handling. The policy guard enforces strict matter-boundary isolation: queries may only retrieve chunks tagged to the requesting tenant's own matters.

### Chunking Strategy

Hybrid chunking with a generous 512-token target and 96-token overlap. Legal documents require larger chunks to preserve the context of numbered paragraphs, exhibit references, and clause structures that span multiple sentences.

### Exact-Match Boost Terms

Docket IDs, case numbers, citation codes, court names, regulation identifiers (e.g., GDPR Art. 33), filing deadline references, discovery obligation types, summons references, complaint references, deposition schedules.

### Score Thresholds

| Threshold | Value |
|---|---|
| Minimum relevance | 0.45 |
| Rerank drop-below | 0.50 |
| Exact-match boost floor | 0.35 |
| High confidence | 0.85 |

### Retention Rules

| Rule | Value |
|---|---|
| Default retention | 2555 days (7 years) |
| Request log retention | 365 days |
| Evidence retention | 3650 days (10 years) |
| Audit trail retention | 3650 days (10 years) |
| Deletion required | Yes |

---

## carlota_private_advisory v1.0.0

**Platform**: Carlota Jo — Private Advisory  
**Privacy Level**: privileged  
**Reranking**: disabled  
**Top-K**: 8  
**Max Candidates**: 40

### Purpose

The Carlota Jo private advisory profile retrieves client engagement records, strategy briefs, brand positioning documents, operational planning notes, and invoice histories. Privacy level is set to `privileged` — the highest tier — and cross-region replication is explicitly prohibited.

Reranking is disabled because the corpus is small per client and high-precision exact-match retrieval is preferred over reranking reordering that could surface unexpected results for sensitive advisory content.

### Chunking Strategy

Semantic chunking with a 400-token target and 64-token overlap. Heading splitting is disabled to preserve the continuity of advisory briefs and engagement summaries.

### Exact-Match Boost Terms

Engagement IDs, client reference codes, advisory brief titles, project milestone references, retainer terms, invoice references, strategy document names, brand positioning deliverable references.

### Score Thresholds

| Threshold | Value |
|---|---|
| Minimum relevance | 0.50 |
| Rerank drop-below | 0.55 |
| Exact-match boost floor | 0.40 |
| High confidence | 0.88 |

### Retention Rules

| Rule | Value |
|---|---|
| Default retention | 1095 days (3 years) |
| Request log retention | 180 days |
| Evidence retention | 2190 days (6 years) |
| Audit trail retention | 2555 days (7 years) |
| Deletion required | Yes |

---

## Profile Version History

| Profile | Version | Status | Released |
|---|---|---|---|
| lyte_governance_ops | 1.0.0 | active | 2026-04-20 |
| vessels_maritime_risk | 1.0.0 | active | 2026-04-20 |
| terra_real_estate_intel | 1.0.0 | active | 2026-04-20 |
| aegis_security_incident | 1.0.0 | active | 2026-04-20 |
| prism_legal_matter | 1.0.0 | active | 2026-04-20 |
| carlota_private_advisory | 1.0.0 | active | 2026-04-20 |

## Profile Rotation Procedure

To rotate a profile version for a tenant:

1. Register the new profile version with `registry.registerProfile(newProfile)`.
2. Call `registry.rotate_profile_version({ tenantId, domain, targetProfileId, targetVersion, activatedBy, rotationReason })`.
3. Verify the active pointer with `registry.getActiveProfileForTenant(tenantId, domain)`.
4. Run the eval harness against the new version: `POST /v1/evals/run` with `profileId` set to the new version.
5. If the new version shows regression, call `registry.rollback(tenantId, domain, rolledBackBy)`.
