# Pilot Statement of Work — Template

**Document ID:** PILOT-F-02
**Version:** 1.0
**Audience:** Customer contracts officer, customer technical lead, SZL Holdings
**Use:** Strip placeholders, customize per agency, send as Word + PDF.

---

## Statement of Work

**Between:** SZL Holdings ("Provider"), a U.S. company headquartered in [state], represented by Stephen P. Lutar Jr., founder.
**And:** [Agency Legal Name] ("Customer"), located at [address].
**Effective:** [Date].
**Term:** 90 days from kick-off ("Pilot Term"), with optional renewal under §10.

---

### 1. Pilot SKU

[ ] **Compliance Watcher** — A11oy public agent monitoring [Federal Register / NYS Register / specified primary source] with classified delta routing into the Customer's designated warehouse and a public replay-attestation surface for each agent run. **Fee:** US $25,000 fixed.

[ ] **Sentra Lite** — Sentra deployed to one Customer asset class (one cloud account or one workload boundary), four named playbooks tuned to the Customer's environment, monthly trust report, and incident response per `A11OY-05`. **Fee:** US $50,000 fixed.

[ ] **Amaru ERP Sync** — Amaru sync between the Customer's [ERP — Banner / Munis / Workday / SAP / Oracle / Dynamics / NetSuite] and one downstream system, with classification per `AMARU-01`, retention per `AMARU-02`, and a Privacy Impact Assessment delivered per `AMARU-04`. **Fee:** US $75,000 fixed; **Term:** 120 days.

(Customer selects one. Multiple SKUs require an addendum.)

### 2. Scope of Provider responsibilities

Provider will, during the Pilot Term:

(a) Provision the Pilot environment in AWS GovCloud (US) under the "A11oy US" posture per `A11OY-04`.
(b) Configure connectors to the Customer's source(s) and destination(s) listed in Annex A.
(c) Operate the Pilot in production-quality mode, including:
   - Monitoring and incident response per `A11OY-05`.
   - Anchoring every agent action to the evidence ledger per `aef-evidence-ledger`.
   - Providing replay attestations on demand for any in-Pilot run.
(d) Deliver a written Pilot Status Report at days 30, 60, and 90, anchored in the evidence ledger.
(e) Deliver, at Pilot completion, a Pilot Outcome Report containing:
   - The metrics achieved against §3.
   - The trust documentation specifically referenced by the Pilot.
   - A reference-customer authorization request (Customer's choice to grant) per §11.

### 3. Acceptance criteria

The Pilot is "accepted" if and only if all of the following are true at Day 90 (or Day 120 for the Amaru SKU):

(a) Production deployment is live in the Customer's GovCloud environment.
(b) At least 95% of agent runs complete within the agreed SLA listed in Annex B.
(c) At least one replay attestation is publicly verifiable at szlholdings.com/replay-attestation referencing this Pilot's data flow.
(d) Zero unresolved Severity 1 incidents per `A11OY-05`.
(e) The Customer's privacy officer has signed the Privacy Impact Assessment per `AMARU-04` (Amaru SKU only).
(f) The Customer's authorizing official has issued a written acceptance, or specified the rework required for acceptance.

### 4. Customer responsibilities

The Customer will:

(a) Designate a single technical lead and a single contracting lead.
(b) Provision a GovCloud account or authorize Provider's GovCloud account, per Annex C.
(c) Provide read access to the source system(s) and write access (where in scope) to the destination system(s) listed in Annex A.
(d) Designate a Privacy Officer for the PIA workflow (Amaru SKU only).
(e) Designate a Security Officer for the IR workflow.
(f) Make a good-faith effort to respond to Provider blocking requests within two (2) business days.

### 5. Fees and payment

(a) Total Pilot Fee: US $[amount] fixed.
(b) Payment schedule:
   - 50% on contract execution
   - 25% on Day 45 milestone (mid-Pilot Status Report accepted)
   - 25% on acceptance per §3
(c) Net 30 from invoice date.
(d) Travel and out-of-pocket expenses are included in the fixed fee.

### 6. Data handling

(a) Provider is a Processor; Customer is the Controller.
(b) Data classification follows `AMARU-01-data-classification.md`.
(c) Retention and deletion follow `AMARU-02-retention-deletion.md`.
(d) Residency follows `A11OY-04-us-data-residency.md` (US-only).
(e) Sub-processors are listed in Annex D and notified per the customer-notification commitment.

### 7. Security and incident response

(a) Provider's incident response follows `A11OY-05-incident-response-72hr.md`.
(b) Customer notification commitment: T+24h initial; T+72h substantive.
(c) Penetration testing posture per `SENTRA-04-penetration-testing-plan.md`.
(d) Bias testing methodology per `A11OY-03-bias-testing-methodology.md` (where in scope).

### 8. IP

(a) Customer Data is Customer's property.
(b) Provider Software (A11oy, Sentra, Amaru, AEF packages, codex-kernel) is Provider's property and is licensed to Customer for the Pilot Term under the terms of this SOW.
(c) Customer-specific configurations, fine-tunes, and connectors created during the Pilot are jointly owned. Provider may use the *non-customer-identifying* learning to improve product; the *customer-specific* artifacts remain with Customer.
(d) Provider does not train models on Customer Data.

### 9. Warranties and limitations

(a) Provider warrants the Software performs materially per the documentation provided.
(b) Provider warrants the trust documentation cited in this SOW is accurate as of the Effective Date and will be updated per the document change-log discipline.
(c) AS-IS for everything not expressly warranted. Customer's exclusive remedy is rework or refund of unearned fees; aggregate liability capped at the Pilot Fee paid.
(d) Neither party liable for indirect or consequential damages.

### 10. Renewal

Upon acceptance per §3, Customer may, at its option, convert to a subscription engagement at the rate published in the then-current commercial schedule, with credit for fees paid under this Pilot.

### 11. Reference and publicity

(a) On acceptance, Provider may publicly state that Customer is a Pilot customer ("Reference"). The exact language is subject to Customer's written approval, not to be unreasonably withheld.
(b) Customer may, at its option, participate in (i) a written case study, (ii) a logo placement on Provider's website, (iii) a quote in Provider's pitch materials. Each is optional and separately approved.
(c) If Customer prefers anonymity, Provider will refer to Customer as "[Tier-1 NYS state agency]" or similar non-identifying description.

### 12. Termination

(a) Either party may terminate for material breach with 30 days written notice and cure period.
(b) Customer may terminate for convenience at any time; Provider refunds the unearned portion of fees paid less actual costs incurred to date.
(c) Provider may terminate only for non-payment after the cure period.

### 13. Governing law and disputes

(a) Governing law: [State chosen by Customer, default New York].
(b) Disputes go through good-faith negotiation, then mediation, then state-court litigation.

### 14. Annexes

- **Annex A** — Source systems, destinations, in-scope record classes
- **Annex B** — SLAs, metrics, and dashboards
- **Annex C** — Cloud-account responsibility split
- **Annex D** — Sub-processor list
- **Annex E** — Trust documentation versions cited by this SOW

### Signatures

For SZL Holdings: Stephen P. Lutar Jr., Founder · Date: __________
For [Agency]: ____________________________ · Title: ___________ · Date: __________
