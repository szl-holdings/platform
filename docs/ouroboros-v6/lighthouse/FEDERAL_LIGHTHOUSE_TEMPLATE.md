# Federal Lighthouse Pilot Template — Ouroboros Guardrails
**SZL Holdings | Stephen P. Lutar | ORCID 0009-0001-0110-4173**
**Product:** `@szl-holdings/ouroboros` v6.1.0 | No-cost 90-day pilot
**DOIs:** [10.5281/zenodo.19867281](https://doi.org/10.5281/zenodo.19867281) · [10.5281/zenodo.19934129](https://doi.org/10.5281/zenodo.19934129)
**Post-Meeting Reference:** Mercy McInnis, Procurement Counselor, Empire APEX Accelerator (NYSTEC/DoD) — Teams meeting May 6, 2026

---

## 1. Pilot Premise

The Ouroboros Federal Lighthouse Pilot is a no-cost, 90-day engagement in which a federal program office deploys the Ouroboros guardrails runtime as a wrapper around one existing AI-assisted workflow. No new AI model is procured, trained, or fine-tuned. The runtime wraps the existing inference call and emits a hash-chained Λ scalar receipt per AI decision, covering nine trust axes: provenance, drift, fidelity, latency, scope-creep, toxicity, hallucination risk, consent alignment, and cost.

The program operates under NAICS codes 541512 (Computer Systems Design Services), 541511 (Custom Computer Programming Services), 541715 (Research and Development in Computer Science), and 541690 (Other Scientific and Technical Consulting Services). The pilot is offered at no cost to the federal partner because SZL Holdings is a pre-revenue single-member entity whose primary goal in this phase is the production of a citable, public-domain Λ-trace dataset and an executive readout that constitutes the company's first federal reference.

The three outcomes required of every Lighthouse Pilot are: (1) a public or releasable Λ-trace artifact documenting the distribution of trust scores across the AI workflow's production decisions during the observation period; (2) an executive readout delivered to the program owner in plain language, stating which Λ axes drove the highest variance and what operational actions are recommended; and (3) a pre-publication case study, co-authored with the program team and cleared for public release under applicable agency public affairs review, to be submitted to a conference or journal within six months of pilot completion.

---

## 2. Pilot Scope Checklist

- 1 AI workflow named: the specific production workflow to be wrapped (e.g., "document classification pipeline," "benefits eligibility chatbot") is identified and agreed in writing before kickoff.
- 1 program owner named: a government employee with authority to sign the Data Use Agreement and serve as the technical and programmatic point of contact throughout the 90-day period.
- 1 mission objective stated in plain English: a one-sentence statement of what the AI workflow is supposed to accomplish, agreed by the program owner before instrumentation begins.
- Λ axis priority order stated: the program office ranks the 9 Λ axes by operational importance; the ranking drives dashboard configuration and the executive readout emphasis.
- Data classification verified: the workflow operates on unclassified data, or CUI handling procedures are agreed in writing, including whether receipts containing CUI derivatives must be stored in a GovCloud S3 bucket.
- Receipt sink defined: the S3 bucket, CloudWatch log group, or equivalent sink where Λ receipts are written is provisioned before Day 1; access credentials are shared with the SZL Holdings integration engineer.
- SLA targets agreed: maximum acceptable latency overhead from Ouroboros instrumentation (target: <5 ms per receipt at p99) and availability expectations for the receipt sink are stated in the Data Use Agreement.
- Success criteria signed: the definition of a successful pilot — minimum receipt volume, Λ axis coverage, and readout quality threshold — is signed by both the program owner and Stephen Lutar before kickoff.
- Authority to Operate (ATO) path stated: the program office identifies whether the pilot qualifies for LI-SaaS tailored authorization, an agency-sponsored FedRAMP Low path, or an internal authority-to-test (ATT) memo issued by the program's ISSO.
- Privacy assessment completed: the agency's Privacy Officer or ISSO confirms that the AI workflow does not process PII beyond what is already covered by an existing Privacy Impact Assessment (PIA); if new PII exposure is introduced, a new PIA is completed before instrumentation.
- Counterparty NDA in place: a mutual NDA covering Ouroboros source code, the program's workflow architecture, and any non-public training data is executed before any technical access is granted.
- Data Use Agreement signed: a formal DUA specifying permitted uses of Λ receipt data, retention limits, and destruction procedures is executed before the receipt sink is provisioned.
- Read-out cadence agreed: weekly 30-minute check-in calls between Stephen Lutar and the program owner are scheduled for the full 90-day period before kickoff.
- Public-release approval path agreed: the agency's public affairs review process for the case study is documented, including the expected timeline and the name of the approving official, before the pilot begins.
- Termination conditions stated: conditions under which either party may terminate the pilot with 5 business days' notice — including security incidents, data classification violations, or material SLA failure — are stated in the Data Use Agreement.

---

## 3. Day-by-Day 90-Day Timeline

| Week | Activity | Owner | Artifact |
|---|---|---|---|
| Week 1 | Kickoff call; NDA and DUA executed; receipt sink provisioned; workflow architecture reviewed | Stephen Lutar + Program Owner | Signed NDA, signed DUA, provisioned S3 bucket ARN |
| Week 2 | Ouroboros runtime integration: wrap target workflow's inference calls with `LambdaCallbackHandler` or equivalent adapter; staging environment test | Stephen Lutar | Integration branch PR; staging test report |
| Week 3 | Staging validation: run 500+ test receipts; confirm all 9 Λ axes are emitting; verify receipt hash chain integrity | Stephen Lutar + Agency ISSO | Staging validation report; ISSO sign-off memo |
| Week 4 | Production deployment: Ouroboros wrapper goes live in shadow mode (read-only, no blocking); first receipts land in sink | Stephen Lutar + Program Owner | Production deployment confirmation; first receipt batch |
| Week 5 | Data collection: shadow mode active; weekly read-out #1: Λ distribution summary for first 7 days of production traffic | Stephen Lutar | Read-out deck #1 (Λ axis distribution, outlier events) |
| Week 6 | Data collection continues; weekly read-out #2; identify top-3 Λ axis variance drivers | Stephen Lutar | Read-out deck #2; variance driver memo |
| Week 7 | Optional: enable soft blocking on high-risk receipts (scope-creep axis 5 > threshold) — subject to program owner approval | Program Owner (decision) + Stephen Lutar (implementation) | Blocking policy config file; approval memo |
| Week 8 | Weekly read-out #3; mid-point executive summary prepared for program owner's leadership | Stephen Lutar | Mid-point executive summary (2-page) |
| Week 9 | Data collection; weekly read-out #4; begin drafting case study outline | Stephen Lutar + Program Owner | Case study outline v0.1 |
| Week 10 | Weekly read-out #5; receipts milestone: target 10,000+ receipts in sink by end of Week 10 | Stephen Lutar | Receipt volume report; milestone confirmation |
| Week 11 | Case study draft v1.0 shared with program owner for factual review; public affairs review initiated | Stephen Lutar + Program Owner + PA Officer | Case study draft v1.0 |
| Week 12 | Weekly read-out #6; final 30-day Λ distribution analysis; identify statistical anomalies for executive readout | Stephen Lutar | Statistical analysis report |
| Week 13 | Executive readout preparation: synthesize 90-day Λ trace into plain-language narrative with operational recommendations | Stephen Lutar | Executive readout deck v1.0 |
| Week 14 (final week of Month 3) | Executive readout delivered to program office; case study revision based on feedback; public Λ-trace dataset prepared for release | Stephen Lutar + Program Owner | Final executive readout; case study v2.0; Λ-trace dataset |
| Post-pilot | Case study cleared by PA office and submitted to conference or journal; Λ-trace dataset published (Zenodo DOI); FedRAMP LI-SaaS or 20x Low pilot application filed if agency sponsor agrees | Stephen Lutar | Published case study; Zenodo dataset DOI; FedRAMP application (conditional) |

---

## 4. Deliverable List

1. **Λ-Trace Dataset** — A complete export of all hash-chained Λ scalar receipts generated during the 90-day pilot period, de-identified per DUA terms, packaged as a Parquet file and deposited to Zenodo with a DOI. Sample path: `/home/user/workspace/ouroboros-unified-payload/lighthouse/artifacts/lambda_trace_pilot_001.parquet`

2. **Executive Readout** — A slide deck (10–15 slides, plain language) summarizing the 9-axis Λ distribution across the pilot period, identifying the top-3 variance drivers, and providing three operational recommendations. Sample path: `/home/user/workspace/ouroboros-unified-payload/lighthouse/artifacts/executive_readout_pilot_001.pptx`

3. **Pre-Publication Case Study** — A 2,000–3,000 word co-authored case study describing the AI workflow, the Λ instrumentation approach, the trust score findings, and the program's operational takeaways. Cleared by agency public affairs before submission. Sample path: `/home/user/workspace/ouroboros-unified-payload/lighthouse/artifacts/case_study_pilot_001_draft.docx`

4. **Integration Specification** — A technical document describing the Ouroboros wrapper configuration, the Λ axis priority order agreed by the program, the receipt sink architecture, and the hash-chain validation procedure, suitable for inclusion in an ATO evidence package. Sample path: `/home/user/workspace/ouroboros-unified-payload/lighthouse/artifacts/integration_spec_pilot_001.md`

5. **Receipt Hash-Chain Validation Report** — A machine-readable JSON report confirming that every receipt in the Λ-trace dataset is hash-chain valid, with timestamps, receipt counts by axis, and anomaly flags for any receipts where the hash chain was broken or interrupted. Sample path: `/home/user/workspace/ouroboros-unified-payload/lighthouse/artifacts/hashchain_validation_report_pilot_001.json`

---

## 5. Mercy McInnis Follow-Up Script

**Ready to paste into Microsoft Teams chat after the May 6, 2026 10am ET meeting.**

---

Mercy, thank you for the time today. The meeting was exactly what we needed to get the federal registration process moving. I want to follow up on three concrete next steps and ask for your guidance on each.

First, on SAM.gov registration. We reviewed the step-by-step process in our own compliance work and understand the sequence: Login.gov account, entity registration with UEI generation, TIN validation for the CAGE code, NAICS and PSC code selections, and the Representations and Certifications page. Where I would benefit from your walk-through is the Assertions section — specifically confirming that NAICS 541512 (Computer Systems Design Services) is the correct primary code for an AI-runtime SaaS product, and that PSC code DA10 (Application Capability as a Service) is the right primary product service code. If you are available for a 45-minute screenshare session in the two weeks after May 6, I would like to complete the SAM.gov registration live with you present to catch any errors before submission. Can we schedule that?

Second, on NAICS codes more broadly. SZL Holdings sits at the intersection of software, AI research, and governance consulting. The COMPLIANCE_PLAYBOOK.md we have built internally recommends 541512 as primary, with 541511, 541715, and 541690 as secondaries. I want to confirm with you that this combination is defensible for the program types we are targeting — specifically AI governance contracts under DoD and civilian agency AI programs. If there is a better primary code for our actual work, now is the time to correct it before the registration is submitted.

Third, on introductions. We are building toward a federal lighthouse pilot — a no-cost 90-day deployment of the Ouroboros guardrails runtime inside a federal AI workflow. The ideal first pilot partner is either a DoD program officer working on responsible AI implementation, or a prime contractor who has a Responsible AI (RAI) lead and is actively building AI solutions for federal clients. If you know of one program officer or one prime RAI lead who would be open to a 30-minute introductory conversation, that introduction would be the single highest-value outcome of this engagement for us at this stage.

We are not looking for a contracting vehicle, a set-aside, or a grant at this point. We need a technical partner inside a federal program who can run a pilot, produce a public Λ-trace readout, and co-author a case study. The engagement costs the agency nothing.

Please let me know your availability for the SAM.gov screenshare. I can work around your calendar for any weekday in May or June 2026.

Thank you again for everything the Empire APEX Accelerator is doing for early-stage federal market entrants.

Stephen Lutar
SZL Holdings
rosalutar@gmail.com
ORCID: 0009-0001-0110-4173

---

## 6. Backup Target Programs

### AFWERX (Air Force Research Lab)

AFWERX is the Air Force's innovation arm, operating under AFRL. It runs three primary pathways: SBIR/STTR (research contracts), the Tactical Funding Increase (TacFI), and the Commercialization Readiness Program (CRP). AFWERX has a documented interest in AI governance and responsible AI tooling for Air Force AI-enabled systems.

Contact pattern: `afwerx@us.af.mil` (general contact); technical submissions via the AFWERX portal at [afwerx.com](https://www.afwerx.com); SBIR/STTR submissions through [dodsbirsttr.mil](https://www.dodsbirsttr.mil). For a non-SBIR introduction, identify the AFWERX Mission Accelerator program manager through the AFWERX SparkCell network or through a LinkedIn search for "AFWERX program manager AI governance." AFWERX hosts quarterly open calls — the Ouroboros lighthouse pitch maps directly to their challenge-based acquisition model.

### CDAO Responsible AI Working Group (Chief Digital and Artificial Intelligence Office)

The CDAO is the senior DoD official responsible for AI governance, data strategy, and responsible AI implementation across the department. The CDAO RAI Working Group coordinates the DoD RAI Strategy and the DoD AI Ethics Principles across all services and defense agencies.

Contact pattern: `osd.pentagon.ousd-r-e.mbx.cdao-general@mail.mil` (CDAO general mailbox); public engagement via [ai.mil](https://www.ai.mil); RAI Working Group public-facing outputs are published at [ai.mil/docs](https://www.ai.mil/docs/). For a direct introduction, request a referral through Mercy McInnis (NYSTEC/DoD) to a CDAO RAI staff member, or engage through the CDAO's published responsible AI self-assessment guide feedback channels. The Ouroboros Λ-trace methodology is directly aligned with the CDAO's Test and Evaluation framework for AI systems and should be framed as a validation-layer contribution, not a product pitch.

---

## Sources

- [SAM.gov Entity Registration Checklist](https://sam.gov/sites/default/files/2024-11/entity-checklist.pdf)
- [SBA Basic Requirements for Federal Contracting](https://www.sba.gov/federal-contracting/contracting-guide/basic-requirements)
- [FedRAMP 20x Overview](https://www.fedramp.gov/20x/)
- [Vanta FedRAMP LI-SaaS Guide](https://www.vanta.com/collection/fedramp/fedramp-li-saas)
- [Paramify FedRAMP Cost Guide 2026](https://www.paramify.com/blog/fedramp-cost)
- [USFCR PSC Code Guide](https://blogs.usfcr.com/it-psc-codes-federal-contracting)
