# SZL Holdings — Product Readiness Standard

**Version**: 1.1
**Effective**: 2026-04-02
**Owner**: Stephen Lutar, Founder & CEO

---

## Purpose

This document defines the canonical readiness labels used across all SZL Holdings products, documentation, investor materials, and public surfaces. Every product and feature must use exactly one label from this standard. No ad-hoc status terms are permitted.

---

## Readiness Labels

| Level | Label | Definition | External Visibility |
|-------|-------|-----------|-------------------|
| 0 | **Concept** | Idea documented; no code written. May appear in roadmap only. | Internal only |
| 1 | **Prototype** | Proof of concept exists. Not suitable for any external use. Core architecture may change. | Internal only |
| 2 | **Functional Alpha** | Core workflows operate end-to-end. Suitable for internal testing and controlled demonstrations. Not production-hardened. | Demo audiences, investors with context |
| 3 | **Pilot Ready** | Feature-complete for a defined use case. Enterprise controls active (auth, audit, tenant isolation). Suitable for design-partner pilots with known limitations documented. | Design partners, pilot customers |
| 4 | **Production** | Fully hardened. SLA-backed. Monitoring, incident response, and support processes in place. | General availability |

---

## Current Product Readiness

| Product | Label | Notes |
|---------|-------|-------|
| **Lyte** (Business Observability) | Functional Alpha | Primary commercial wedge. Approaching Pilot Ready. |
| **Alloy** (Execution Fabric) | Functional Alpha | Decision objects, evidence retrieval, policy-gated execution, eval harness complete. |
| **Aegis** (Defense & Intelligence) | Functional Alpha | Staged expansion lane. SOC, Intel, and Ops modules functional. |
| **Terra** (Real Estate Intelligence) | Functional Alpha | Staged expansion lane. NYC data integrations active. |
| **Vessels** (Maritime Intelligence) | Functional Alpha | Staged expansion lane. AIS tracking, compliance modules functional. |
| **Carlota Jo** (Private Advisory) | Functional Alpha | Client engagement and advisory workflows. |

---

## Rules

1. Every product page, README section, investor deck, and demo must display the product's current readiness label.
2. Labels may only be upgraded by the product owner after meeting the defined criteria.
3. Mixed labels within a single product (e.g., some features at one level, others at another) should use the lowest applicable label for the product as a whole, with feature-level annotations where helpful.
4. Readiness labels are never aspirational. They describe current state only.
5. The label "Production" requires documented SLAs, incident response procedures, and monitoring.

---

## Label Display Guidelines

- Use the exact label text (e.g., "Functional Alpha", not "Alpha" or "Early Access")
- Display labels in a visible, non-dismissible chip or badge in product UI headers
- Include the label in API response headers where applicable: `X-Product-Readiness: Functional Alpha`
- Include the label in the footer of all generated reports and documents
