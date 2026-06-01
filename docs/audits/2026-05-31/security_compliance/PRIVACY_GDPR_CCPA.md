# PRIVACY_GDPR_CCPA.md — privacy posture + DPA template

**Author:** Yachay (CTO authority) · **Date:** 2026-06-01 · **Doctrine v11 LOCKED (749/14/163).**
**Honesty:** SZL's live Spaces are **open, unauthenticated demos** with **no user accounts**. We do not knowingly collect personal data through a sign‑up flow today. But several real privacy exposures exist (logs, IPs, Mapbox token, third‑party processors), and Greene's enterprise/gov customers will demand a Data Processing Agreement. This doc states the honest current posture and provides the template.

---

## 1. Current PII handling — honest inventory

| Data category | Collected today? | Where | Notes |
|---|---|---|---|
| Account PII (name/email) | **No** | — | No auth, no sign‑up on any Space |
| IP addresses / request metadata | **Yes (implicitly)** | HF Spaces edge access logs; any app logging | HF as platform logs requests; IPs are personal data under GDPR |
| Free‑text prompts to a11oy/amaru | **Yes** | in‑process; may transit LLM providers | Users could paste PII into prompts → becomes a processor question |
| Geospatial queries (vessels) | **Yes** | Mapbox tile requests | Mapbox token is leaked via `/api/config/mapbox-token` (see posture doc) → token + usage exposure |
| Khipu receipts | **Yes (hashes)** | Merkle DAG | Receipts are hashes/metadata, not raw PII by design — good |
| Cookies / trackers | **None known** | — | Verify no analytics beacons on static Spaces |

**Honest gaps:**
1. **No privacy policy published** on the Spaces.
2. **No data‑retention policy** — we don't define how long logs/prompts are kept.
3. **No DPA** with sub‑processors (Hugging Face, Mapbox, LLM API providers) and none offered to customers.
4. **Prompt data may transit third‑party LLM providers** with no documented data‑handling agreement → a GDPR Art. 28 processor chain we haven't papered.
5. **Mapbox token leak** is both a security and a privacy issue (enables usage attribution).

---

## 2. GDPR posture (EU)

- **Roles:** for demo traffic SZL is a **controller** of request logs; for customer deployments SZL would be a **processor** acting on the customer's instructions → triggers Art. 28 DPA obligations.
- **Lawful basis:** legitimate interest for security logging; **consent** required before any analytics/marketing cookies.
- **Data‑subject rights:** access, rectification, erasure ("right to delete"), portability, objection. **Today we cannot honor these** because we don't index data by subject. *Fix:* once auth exists, key all stored data by principal so a delete request is executable.
- **Transfers:** if EU personal data is processed in US (HF/LLM providers), need **SCCs** (Standard Contractual Clauses) / adequacy basis.
- **Records of processing (Art. 30)** and **DPIA** for the counter‑UAS/drone (Killinchu) high‑risk processing.

## 3. CCPA/CPRA posture (California)

- **Consumer rights:** know, delete, correct, opt‑out of sale/sharing, limit use of sensitive PI.
- **"Do Not Sell/Share":** we do not sell data; publish a statement to that effect.
- **Notice at collection:** required if we ever collect via a form.
- **Service‑provider terms:** the DPA below doubles as the CCPA service‑provider addendum.

## 4. Data‑retention policy (proposed)

| Data | Retention | Disposal |
|---|---|---|
| Edge/access logs (IP, UA) | 30 days rolling | auto‑purge |
| Application logs (no raw PII) | 90 days | auto‑purge |
| Prompts/inputs | not persisted beyond request unless customer opts in; if persisted, 30 days | crypto‑erase |
| Khipu receipts (hashes/metadata) | retained for audit (no raw PII) | retained; PII never stored in receipts by design |
| Security incident records | per VDP/PSIRT policy (Khipu‑receipted), min 1 yr | per policy |
| Customer data (enterprise) | per DPA / contract; default delete within 30 days of termination | crypto‑erase + certificate of deletion |

## 5. Right‑to‑delete workflow (target, once auth exists)

1. Request via `privacy@szlholdings.com` or in‑product control → identity verified via IdP.
2. Look up all stores keyed by principal (prompts, logs, profile).
3. Crypto‑erase / delete within **30 days** (CCPA 45 days w/ extension; GDPR "without undue delay").
4. Confirm to subject; emit a **Khipu receipt** of the deletion (proof of erasure without storing the deleted PII).
5. Propagate to sub‑processors (HF/LLM/Mapbox) per their deletion APIs/SLAs.

## 6. Immediate privacy fixes (ordered)

| # | Fix | Effort |
|---|---|---|
| 1 | Stop leaking Mapbox token; proxy tiles server‑side | 0.5 day |
| 2 | Publish Privacy Policy + "we don't sell data" + cookie statement on all Spaces (HfApi push) | 0.5 day |
| 3 | Define + enforce retention (log rotation 30/90 days) | 1 day |
| 4 | Paper sub‑processor DPAs (HF, Mapbox, LLM providers) | legal |
| 5 | Offer the customer DPA (§7) to enterprise prospects | legal |
| 6 | Key data by principal once Keycloak SSO lands → makes right‑to‑delete executable | with UDS deploy |

---

## 7. DPA template for enterprise customers (skeleton)

> Provide via counsel; this is a working skeleton, not legal advice.

```
DATA PROCESSING AGREEMENT (DPA)
between [Customer] ("Controller") and SZL Holdings ("Processor")

1. Subject matter & duration — processing for the term of the Service Agreement.
2. Nature & purpose — providing the SZL governance/agentic substrate and flagships.
3. Categories of data subjects & personal data — [defined by Controller].
4. Processor obligations (GDPR Art. 28):
   a. Process only on documented Controller instructions.
   b. Ensure personnel confidentiality.
   c. Implement Art. 32 security measures (see Annex II: encryption in transit (TLS)
      and at rest, access control via SSO/RBAC, tamper-evident audit via Khipu DAG,
      signed supply chain (cosign/SBOM), vulnerability management, incident response).
   d. Engage sub-processors only with authorization (Annex III list) + flow-down terms.
   e. Assist Controller with data-subject requests (access, erasure, portability).
   f. Assist with Art. 32–36 (security, breach notice, DPIA, prior consultation).
   g. Delete or return personal data at end of provision (default: crypto-erase within
      30 days + certificate of deletion + Khipu receipt of erasure).
   h. Make available info to demonstrate compliance; allow audits.
5. Breach notification — notify Controller without undue delay (target <72h).
6. International transfers — EU SCCs (Module 2/3) incorporated by reference.
7. Liability, term, governing law — per Service Agreement.

Annex I  — Details of processing (subjects, categories, purpose, duration).
Annex II — Technical & organizational measures (TOMs): TLS, SSO/RBAC, Khipu audit,
           cosign-signed artifacts, CycloneDX SBOM, Trivy/Grype scanning, 30/90-day
           retention, fail-closed immune filter, STRIDE-reviewed flagships.
Annex III — Approved sub-processors: Hugging Face (hosting), [LLM provider(s)],
            Mapbox (geospatial), [cloud: AWS GovCloud / Azure Gov].
```

**CCPA service‑provider addendum:** SZL processes personal information solely to perform the services, does **not** sell or share it, and will not retain/use/disclose it outside the direct business relationship.

---

## Sources
- GDPR Art. 28 (processor) & Art. 32 (security): <https://gdpr-info.eu/art-28-gdpr/> · <https://gdpr-info.eu/art-32-gdpr/>
- EU SCCs: <https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/standard-contractual-clauses-scc_en>
- CCPA/CPRA: <https://oag.ca.gov/privacy/ccpa>
- Internal: `raw/vessels_main.py` (Mapbox token endpoint), `CURRENT_SECURITY_POSTURE.md`.

*— Yachay, 2026-06-01. No PII collection flow today; exposures and the DPA path stated honestly.*
