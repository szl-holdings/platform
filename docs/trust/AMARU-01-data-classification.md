# Amaru — Data Classification Policy (CUI / PII / Public)

**Document ID:** AMARU-COMP-DC-001
**Version:** 1.0
**Owner:** Stephen P. Lutar Jr., SZL Holdings
**Last reviewed:** 2026-04-30
**Audience:** Empire APEX, government data owners, regulated buyers
**Classification:** Public

---

## 1. Purpose

Amaru is the convergent multi-source data sync product. It ingests, normalizes, hash-verifies, and routes data from heterogeneous sources to heterogeneous destinations, with an append-only delta log. Because Amaru handles data at the boundary between systems, classification is operationally critical: a single mis-classification can trigger downstream legal and contractual consequences.

This policy defines the classification scheme Amaru uses internally, how customer data is tagged, how each tag affects routing and retention, and how classification is verified.

## 2. Classification scheme

Amaru uses a four-level classification aligned to federal practice and translated to commercial readability:

| Tier | Federal anchor | Examples | Default routing posture |
|---|---|---|---|
| **A — Public** | "Public" | Press releases, public datasets (Census, FRED, BLS), product documentation | Any allowed destination; no encryption-in-transit override required (still TLS 1.2+) |
| **B — Internal / Business Confidential** | "Sensitive but Unclassified — non-CUI" | Internal pricing, organizational metrics, anonymized analytics | TLS 1.3 in transit; AES-256 at rest; role-restricted destinations |
| **C — Sensitive PII / PHI** | PII per OMB M-17-12; PHI per HIPAA | Employee SSN, customer SSN, medical records, financial account numbers, biometric identifiers | TLS 1.3 in transit; AES-256 at rest with customer-managed keys (CMK); destination must be on the customer's PII allowlist; field-level tokenization where the destination supports it |
| **D — Controlled Unclassified Information (CUI)** | NARA CUI Registry categories | CUI Specified and CUI Basic per the NARA registry; e.g., Privacy/SSN, Tax, Procurement, Critical Infrastructure | Routed only to StateRAMP-authorized or otherwise accreditation-approved destinations; SZL deployment must be the "A11oy US" (GovCloud) posture per `A11OY-04-us-data-residency.md`; CUI marking preserved through the entire pipeline |

The scheme is intentionally one-to-one with NIST SP 800-171 and the NARA CUI Registry to avoid the common vendor mistake of inventing parallel terminology that confuses procurement officers.

## 3. Detection and tagging

### 3.1 Auto-detection

On ingest, Amaru runs a multi-stage detector:

1. **Schema-based** — when a source declares a schema (database column types, declared API field names, well-known patterns), schema fields map to default tiers.
2. **Pattern-based** — regex + checksum (Luhn for PAN, ABA for routing numbers, US SSN structure, NPI for medical providers) flags suspected sensitive fields.
3. **ML-assisted** — a lightweight detector identifies free-text PII (names, addresses, MRNs in unstructured fields).
4. **Customer policy override** — customer-supplied rules win if they declare a more restrictive tier than auto-detection.

### 3.2 Most-restrictive-wins

When evidence supports multiple tiers, Amaru chooses the **most restrictive** tier. Down-classification requires explicit human approval.

### 3.3 Provenance

Every record carries a tag set in its metadata frame:

```
classification:
  tier: C
  basis: ["pattern:us_ssn_field", "schema:hipaa_npi"]
  detected_by: ["pattern", "schema"]
  promoted_by: null
  demoted_by: null
  customer_override: false
  evidence_ledger_anchor: "blake3:..."
```

The classification metadata is itself anchored in the evidence ledger so a downstream auditor can verify what tier a record carried at the moment Amaru handled it.

## 4. Routing rules

| Tier | Allowed destinations |
|---|---|
| A | Customer-defined allowlist |
| B | Customer-defined allowlist; non-A11oy-US deployments allowed |
| C | Customer-defined allowlist + must declare PII-handling capability + must be in customer's residency boundary |
| D | Must be StateRAMP-authorized (or accreditation-approved by the customer's authorizing official) **and** in A11oy-US posture **and** declared CUI-capable |

Attempts to route to a non-conforming destination are blocked at `aef-policy-guard`, logged as `policy_violation`, and surface to the operator.

## 5. Field-level handling

Where the customer's destination supports it, Amaru can:

- **Tokenize** — replace the sensitive value with a deterministic token; the original is held in a customer-controlled vault (default: AWS KMS-encrypted; HSM-backed on request).
- **Redact** — replace with a fixed mask while preserving the field shape.
- **Hash** — replace with a salted hash for downstream join-without-revealing.
- **Pass through** — only when the destination is explicitly approved for the tier.

Defaults:

- Tier C → tokenize on egress unless destination is CMK-encrypted and access-restricted.
- Tier D → field-level handling per the customer's CUI handling policy; CUI markings preserved.

## 6. CUI Specified handling

For CUI Specified categories (e.g., `SP-TAX`, `SP-EXPT`), Amaru honors the marking, retention, and handling rules in the NARA-published handling document for that category. Where two categories conflict, the more restrictive applies.

A per-category handling matrix is maintained at `docs/compliance/cui-handling-matrix.md` and shared under NDA.

## 7. Re-classification events

A record's classification is recomputed when:

- The source's schema changes
- The customer adjusts policy
- The destination changes capabilities (e.g., moves from PII-capable to not)
- A regulatory list expands (e.g., a new CUI category)

Re-classification events are themselves logged to the evidence ledger.

## 8. Honest disclosures

- **Classification is best-effort, not guaranteed.** Detection is excellent but not perfect; SZL does not warrant zero false-negatives. The most-restrictive-wins default is the operational mitigation.
- **CUI handling depth is a contract decision.** SZL handles CUI metadata and routing constraints today. CUI processing inside the destination system is the destination's responsibility, not Amaru's.
- **No classification is permanent.** Records may be re-classified by future events. The evidence ledger preserves the classification at the time of each handling.

## 9. Change log

| Date | Change |
|---|---|
| 2026-04-30 | Initial publication. |

## 10. Contact

Stephen P. Lutar Jr. · inquiries@szlholdings.com
