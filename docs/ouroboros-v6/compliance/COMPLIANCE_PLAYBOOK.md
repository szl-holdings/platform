# SZL Holdings — Federal & Enterprise Compliance Playbook
**Entity:** SZL Holdings LLC (single-member, New York) | **Founder:** Stephen P. Lutar | **Product:** AI-runtime / AI governance SaaS  
**Revision Date:** 2026 | **Status:** Pre-revenue, no employees

---

## Executive Summary

This playbook maps every material federal and enterprise certification pathway for SZL Holdings — from a $0 SAM.gov registration executable today to a $1.5M+ StateRAMP Moderate authorization reserved for later. The sequence is deliberate: each step creates a prerequisite artifact for the next. The 24-month roadmap at the end names the exact decision gates.

---

## 1. SAM.gov Registration — UEI, CAGE Code

### Eligibility Today
**Fully eligible.** Any legal US business entity may register. Cost: $0. No employees or revenue required.

### Step-by-Step Process

1. **Create a Login.gov account** at [login.gov](https://login.gov) with a government email or personal address.
2. **Navigate to SAM.gov** → "Register Entity" → select purpose: **All Awards** (required to bid on federal contracts).
3. **Obtain Unique Entity Identifier (UEI):** Enter legal business name (SZL Holdings LLC), physical address (not a PO box), state of incorporation (New York), date of incorporation. SAM.gov automatically generates a 12-character alphanumeric UEI — this replaces the legacy Dun & Bradstreet DUNS number. [SAM.gov Entity Registration Checklist](https://sam.gov/sites/default/files/2024-11/entity-checklist.pdf)
4. **Core Data:** Enter EIN/TIN (must match IRS records exactly to pass TIN validation), fiscal year end, MPIN (you create this), banking/EFT information for payments, and congressional district.
5. **CAGE Code:** The CAGE (Commercial and Government Entity) code is automatically assigned by the Defense Logistics Agency within 3–5 business days after TIN validation. You do not apply for it separately. [SAM.gov registration guidance](https://sam.gov/opp/cfd0c7c51c29423cbda2a97db8135823/view)
6. **Assertions (NAICS & PSC Codes):** Select primary NAICS and PSC codes (see below).
7. **Representations & Certifications:** Self-certify small business size standards, and answer the SBA supplemental page questions.
8. **Submit.** Allow **10 business days** for processing. Total fill time: ~1–2 hours. [SBA Basic Requirements](https://www.sba.gov/federal-contracting/contracting-guide/basic-requirements)

### NAICS Recommendations for AI/Governance Software

| NAICS | Description | Size Standard | Recommendation |
|-------|-------------|---------------|----------------|
| **541512** | Computer Systems Design Services | $34M revenue | **Primary — best fit for AI-runtime SaaS** |
| **541511** | Custom Computer Programming Services | $34M revenue | Secondary — if bespoke integrations are a deliverable |
| **541715** | Research and Development in Computer Science | 1,000 employees | Secondary — if R&D contracts are targeted |
| **541690** | Other Scientific & Technical Consulting Services | $19.5M revenue | Tertiary — governance/advisory services |

> **SZL Holdings qualifies as a small business under all four codes.** Single-member LLC with zero revenue and zero employees is well within every threshold. Self-certify confidently.

### PSC Code Recommendations (April 2024 Restructure)

The April 2024 PSC Manual restructured all IT codes, retiring 68 legacy D3xx codes. [USFCR PSC Code Guide](https://blogs.usfcr.com/it-psc-codes-federal-contracting)

| PSC | Full Name | When to Use |
|-----|-----------|-------------|
| **DA10** | Application Capability as a Service | AI-runtime SaaS subscription delivery — **primary** |
| **DA01** | Application IT Services (Labor) | If billing for development hours |
| **DJ10** | Security and Compliance as a Service | For governance/compliance monitoring modules |

> DA10 is explicitly defined as "Business Application/Application Development Software as a Service" and maps from legacy D302/D305. [SAM.gov contract example](https://sam.gov/workspace/contract/opp/44a0abbe876e4f1e8af124ab128aae96/view) DJ10 covers security and compliance capability as a service. [DoD PSC Manual](https://www.acq.osd.mil/dpap/policy/policyvault/XaaS_Product_and_Service_Codes_Rev_1.pdf)

### Optional Set-Aside Designations

| Designation | Eligibility for SZL Holdings (Single-Member NY LLC) | Verdict |
|-------------|-----------------------------------------------------|---------|
| **Small Business** | ✅ Self-certified — automatic during SAM registration | **Do it now** |
| **8(a) Business Development** | Requires: 51% owned by socially/economically disadvantaged US citizen; personal net worth ≤ $850K; AGI ≤ $400K; assets ≤ $6.5M; 2+ years in business; good character. [SBA 8(a) Program](https://www.sba.gov/federal-contracting/contracting-assistance-programs/8a-business-development-program) | **Assess at Month 6** — Stephen must meet the social/economic disadvantage criteria; the 2-year business age requirement is the gating factor for newer entities |
| **HUBZone** | Requires: principal office in a designated HUBZone; 35% of employees must reside in a HUBZone (90-day residency). [SBA HUBZone Program](https://www.sba.gov/federal-contracting/contracting-assistance-programs/hubzone-program) | **Not currently eligible** — single-member LLC with no employees fails the 35% employee HUBZone residency requirement |
| **SDB (Small Disadvantaged Business)** | Self-certification in SAM.gov during Reps & Certs if owner is socially disadvantaged | **Assess with 8(a)** |

### Timeline Summary
- **SAM fill time:** 1–2 hours
- **Processing/activation:** 10 business days (per [SAM.gov checklist](https://sam.gov/sites/default/files/2024-11/entity-checklist.pdf))
- **CAGE code assignment:** 3–5 days (concurrent with processing)
- **Annual renewal required** to keep registration active

### What It Unlocks Commercially
Active SAM registration is the **mandatory prerequisite** for every federal contract, GSA Schedule listing, SBIR/STTR grant application, and Cloud Marketplace GovCloud listing. Without it, nothing else in this playbook is accessible federally.

**Priority Rating: MUST-HAVE — Execute in Month 1.**

---

## 2. SOC 2 Type 1 and Type 2

### Overview
SOC 2 is a CPA-firm audit against the AICPA Trust Services Criteria (TSC). **Type 1** tests control *design* at a point in time. **Type 2** tests control *operation* over a 3–12 month observation window.

### Eligibility Today
**Fully eligible.** No minimum employee count, revenue threshold, or prior certification required.

### Auditor Cost Ranges (2026)

| Audit Type | Low | Mid | High | Notes |
|------------|-----|-----|------|-------|
| SOC 2 Type 1 | $5,000 | $12,000–$15,000 | $20,000 | Boutique startup-focused CPA firms at the low end; Big 4 at high end. [Comp AI cost breakdown](https://trycomp.ai/soc-2-cost-breakdown) |
| SOC 2 Type 2 | $7,000 | $15,000–$25,000 | $50,000+ | Most SMBs: $15K–$25K. [Polimity 2026 guide](https://polimity.com/blog/how-much-does-a-soc-2-audit-cost/) |
| Annual renewal (Type 2) | $10,000 | $15,000 | $25,000 | [Workstreet guide](https://www.workstreet.com/blog/soc-2-audit-cost) |

**All-in first-year cost for a one-person SaaS shop:** $20,000–$40,000 (platform + auditor + tooling). [SOC2 Auditors analysis](https://soc2auditors.org/insights/soc-2-type-1-vs-type-2/)

### Compliance Automation Platforms (2026 Pricing)

| Platform | Pricing (2026) | Best For | Notes |
|----------|---------------|----------|-------|
| **Vanta** | Core: ~$10,000/yr; Plus: $15,000–$30,000/yr | Startups, AWS-heavy stacks | Most integrations; market leader. [SecureLeap comparison](https://www.secureleap.tech/blog/soc-2-tools-vanta-drata-secureframe-guide-2025) |
| **Drata** | Foundation: $7,500–$15,000/yr; Advanced: $15,000–$25,000/yr | Real-time control tracking | Strong automation depth. [SecureLeap comparison](https://www.secureleap.tech/blog/soc-2-tools-vanta-drata-secureframe-guide-2025) |
| **Secureframe** | Fundamentals: $7,500–$20,000/yr | Budget-conscious startups | Most affordable entry tier. [SOC2 Certification comparison](https://www.soc2certification.com/blog/secureframe-vs-vanta-vs-drata-comparison) |

> **For SZL Holdings (single-member, one-product):** Secureframe or Drata Foundation tier at ~$7,500–$10,000/yr is the right starting point. Vanta is worth evaluating if AWS infrastructure is central.

### Trust Services Criteria

The five TSC pillars — select which apply:

| Criterion | Required | Recommended for AI SaaS |
|-----------|----------|------------------------|
| **Security (CC)** | ✅ Always required | Yes |
| **Availability** | Optional | Yes — uptime SLAs matter |
| **Confidentiality** | Optional | Yes — for proprietary AI outputs |
| **Processing Integrity** | Optional | **Yes — critical for AI governance product** |
| **Privacy** | Optional | If handling PII |

> For an AI governance product, include **Security + Availability + Processing Integrity** in scope from the start.

### Timeline for a One-Person Shop

| Phase | Duration | Notes |
|-------|----------|-------|
| Gap assessment & policy writing | 4–8 weeks | Use platform templates |
| Control implementation | 4–8 weeks | MDM, logging, access controls, encryption |
| Type 1 audit (observation window: none) | 2–4 weeks | Fastest path to a report |
| Type 2 observation window | 3–6 months minimum | Evidence collection automated by platform |
| Type 2 audit | 4–8 weeks | |

**Realistic Type 1 timeline: 3–4 months from decision to report.** Type 2: 9–14 months total. [ISMS.online SOC 2 guide](https://www.isms.online/soc-2/)

### What Type 1 Buys in Federal/Enterprise Sales

- **Mid-market buyers (500–5,000 employees):** 85% require Type 2; 60% of SMBs will accept Type 1 temporarily. [SOC2 Auditors analysis](https://soc2auditors.org/insights/soc-2-type-1-vs-type-2/)
- **Federal civilian agencies:** Type 1 accelerates trust conversations but does not substitute for StateRAMP. It signals control maturity during RFI/RFP evaluation.
- **Fortune 500:** 98% require Type 2. Type 1 buys you 6–12 months of goodwill while Type 2 observation runs.
- **Commercially:** SOC 2 Type 1 removes the "do you have a security report?" blocker in enterprise procurement, cutting sales cycle friction. [A-LIGN SOC 2 guide](https://www.a-lign.com/articles/what-is-soc-2-complete-guide)

**Priority Rating: MUST-HAVE — Type 1 by Month 6, Type 2 by Month 12.**

---

## 3. ISO 27001

### Overview
ISO 27001 is an internationally recognized ISMS (Information Security Management System) standard. It is broader and more process-oriented than SOC 2, requiring a full management system including risk treatment, internal audits, and management review.

### Cost (2026)

| Organization Size | Low | Mid | High |
|-------------------|-----|-----|------|
| 1–10 employees | $6,000 | $10,000–$15,000 | $20,000 | 
| 11–25 employees | $10,000 | $15,000–$25,000 | $35,000 |

> Rhymetec estimates $10,000–$50,000 total for most SMBs. [Rhymetec ISO 27001 breakdown](https://rhymetec.com/iso-27001-certification-cost-breakdown-2025/) Small single-employee entities: $6,000–$15,000 audit fee (US). [Controllo.ai cost guide](https://controllo.ai/blog/iso-27001-certification-cost-usa/) Annual surveillance: $1,000–$4,000/yr; recertification every 3 years. [StrongDM ISO cost guide](https://www.strongdm.com/blog/iso-27001-certification-cost)

### Timeline
- **Gap analysis + ISMS build:** 3–6 months
- **Internal audit + management review:** 1–2 months
- **Stage 1 (document review) + Stage 2 (on-site audit):** 2–4 months
- **Total to certificate:** 6–12 months

### Comparison with SOC 2

| Dimension | SOC 2 | ISO 27001 |
|-----------|-------|-----------|
| Audience | US enterprise / federal | Global / EU enterprise |
| Output | Audit report (CPA firm) | Certificate (accredited body) |
| Scope | Flexible TSC selection | Mandatory ISMS + Annex A controls |
| Recognized by StateRAMP? | Informally helpful | No |
| EU/UK preferred | No | Yes |
| Renewal | Annual audit | Annual surveillance + 3-yr recert |
| Cost overlap | 60–70% of controls shared | Yes |

### When to Pursue ISO 27001 Alongside SOC 2

ISO 27001 is worth pursuing when:
1. **EU customers become a material revenue segment** (especially post-EU AI Act enforcement)
2. **UK/EMEA government contracts** are targeted (ISO 27001 is often required)
3. **The SOC 2 Type 2 is already complete** — overlapping controls mean marginal incremental effort

**For SZL Holdings today:** SOC 2 first. ISO 27001 at Month 18+ if EU pipeline develops.

**Priority Rating: NICE-TO-HAVE — Pursue after SOC 2 Type 2 if EU revenue materializes.**

---

## 4. StateRAMP

### Impact Levels and Costs

| Level | Controls | Initial Cost | Annual Maintenance | 3PAO Assessment | Best For |
|-------|----------|-------------|-------------------|----------------|----------|
| **LI-SaaS (Tailored)** | 37–60 | $150,000–$300,000 | $50,000–$100,000 | $30,000–$45,000 | Low-PII SaaS (email, collaboration) |
| **Low** | 125 | $250,000–$500,000 | $100,000–$200,000 | $75,000–$125,000 | Non-sensitive public data |
| **Moderate** | 325 | $500,000–$1,500,000 | $200,000–$500,000 | $125,000–$195,000 | PII, CUI — most common |
| **High** | 421 | $1,000,000–$3,000,000+ | $500,000–$1,000,000 | $150,000–$250,000 | Healthcare, law enforcement |

[Paramify StateRAMP cost guide 2026](https://www.paramify.com/blog/fedramp-cost) | [Vanta StateRAMP cost guide](https://www.vanta.com/collection/fedramp/fedramp-cost)

### StateRAMP 20x — What Changed (2025 Reform)

StateRAMP 20x was announced in March 2025 and is currently in **Phase 2** (November 2025+). Key changes: [StateRAMP 20x Overview](https://www.fedramp.gov/20x/)

- **Old model:** JAB (Joint Authorization Board) or agency-sponsor path; 12–24 month backlog; manual document-heavy process; under 350 authorizations in 10 years.
- **New 20x model:** Automation-driven; machine-readable evidence; StateRAMP authorized **144 cloud services in FY25 alone** and eliminated the authorization backlog. [StateRAMP 20x Four Months In](https://www.fedramp.gov/2025-07-30-fedramp-20x-four-months-in-and-authorizing/)
- **Phase 1 results:** 12 StateRAMP 20x Low pilot authorizations from 26 submissions; average agency review queue under 15 services; typical review time under 5 weeks.
- **Phase 2 (current):** Extending 20x automation to Moderate and above; building machine-readable control evidence standards.
- **StateRAMP 20x Low pilot:** Open for participation — cost structure is materially lower because 3PAO labor is partially replaced by automated evidence validation. [Workstreet StateRAMP cost](https://www.workstreet.com/blog/fedramp-cost)

### StateRAMP Tailored (LI-SaaS) — Most Realistic First Step

LI-SaaS (Low-Impact SaaS) is designed for SaaS products that:
- Do not store PII beyond login credentials (name, email, password)
- Have negligible impact level on federal operations if compromised

**Applicability for SZL Holdings:** Depends on whether the AI runtime product processes any federal-sourced data. If the product is a governance tool that *analyzes* but does not *store* agency data, LI-SaaS is plausible. If the product ingests and retains CUI or agency data, StateRAMP Low is the minimum. [Vanta LI-SaaS guide](https://www.vanta.com/collection/fedramp/fedramp-li-saas) | [Secureframe LI-SaaS guide](https://secureframe.com/hub/fedramp/low)

### Sponsor-Required Model

- **Agency Sponsor path (recommended):** A federal agency that wants to procure your product sponsors your authorization. The agency's CISO/AO accepts risk and issues an ATO (Authority to Operate). This is the fastest and most practical path for new market entrants.
- **StateRAMP 20x pilot path:** Participate directly — suitable for Low impact without needing a pre-existing agency relationship.
- **JAB (Joint Authorization Board):** Now largely replaced by agency sponsorship under the 20x reform. Still available but de-prioritized.

### Named 3PAO Assessors (StateRAMP Marketplace)

| 3PAO | Accreditation Date | Highest Level Assessed | Notable |
|------|--------------------|----------------------|---------|
| **Schellman Compliance, LLC** | July 27, 2012 | StateRAMP High | #1 by volume; 200+ assessments. [StateRAMP Marketplace](https://www.fedramp.gov/marketplace/assessors/136571/) |
| **A-LIGN** | 2009 | StateRAMP High | Top 3 globally; 100% authorization success rate; only top-3 3PAO with its own StateRAMP 20x Low authorized audit tool (A-SCEND). [A-LIGN StateRAMP](https://www.a-lign.com/service/fedramp) |
| **Coalfire** | Active | StateRAMP Moderate/High | Deep DoD IL4–IL6 experience. [Coalfire StateRAMP](https://coalfire.com/services/assessment) |
| **Tevora Business Solutions** | August 27, 2020 | StateRAMP Moderate | [StateRAMP Marketplace](https://www.fedramp.gov/marketplace/assessors/200492/) |
| **Lazarus Alliance** | Active | StateRAMP Moderate | Competitive pricing. [Lazarus Alliance](https://lazarusalliance.com/services/audit-compliance/fedramp/) |

> Full accredited assessor list at: [fedramp.gov/marketplace/assessors](https://www.fedramp.gov/marketplace/assessors/)

### Authority to Operate (ATO)

An ATO is the formal authorization issued by a federal agency's Authorizing Official (AO) permitting use of a cloud service. It is the commercial unlock for federal contracts — contracting officers cannot award SaaS contracts without it (or a temporary Authority to Test, ATT).

**Priority Rating: PREMATURE now — Target LI-SaaS/20x Low pilot by Month 18 if a federal agency prospect emerges. Budget $150,000–$300,000.**

---

## 5. CMMC 2.0 (DoD Contracts Only)

### Overview
The Cybersecurity Maturity Model Certification final rule took effect **November 10, 2025**. DoD is now including CMMC requirements in new solicitations. [Mayer Brown CMMC analysis](https://www.mayerbrown.com/en/insights/publications/2025/09/department-of-defense-releases-long-anticipated-final-rule-implementing-the-cybersecurity-maturity-model-certification-program)

### Levels

| Level | Applies To | Assessment Type | Cost Range |
|-------|-----------|----------------|-----------|
| **Level 1 (Foundational)** | FCI (Federal Contract Information) only | Self-assessment | $5,000–$15,000 [Paramify CMMC cost](https://www.paramify.com/blog/cmmc-cost) |
| **Level 2 (Advanced)** | CUI (Controlled Unclassified Information) | Self-assessment OR C3PAO third-party | $37,000–$200,000+ [CMMC.com cost guide](https://www.cmmc.com/newsroom/cost-of-cmmc) |
| **Level 3 (Expert)** | Highest-priority programs, classified-adjacent CUI | Government-led (DCSA) | $300,000+ |

### When CMMC Is Required

CMMC is **only required if SZL Holdings holds a DoD contract that involves CUI or FCI.** No DoD contract = no CMMC obligation. [Egnyte CMMC guide](https://www.egnyte.com/guides/cmmc/cmmc-deadline)

**Should SZL Holdings pursue CMMC now?** **No.** The correct trigger is receiving a DoD solicitation that specifies a CMMC level. Investing $37,000–$200,000 pre-contract is capital misallocation. The DFARS clause in any solicitation will specify the required level.

> **Decision point:** When the first DoD RFP lands that specifies CMMC, immediately engage a C3PAO assessor. Level 1 self-assessment can complete in 30–60 days. Level 2 C3PAO: 3–6 months.

**Priority Rating: PREMATURE — Wait for a DoD contract. Do not pursue speculatively.**

---

## 6. cloud marketplace

### Private vs. Public Listing
- **Public listing:** Visible to all cloud marketplace buyers; requires completed product review, security documentation, and live API integration.
- **Private offer:** Negotiated terms (custom pricing, custom EULA) delivered to a specific named buyer's AWS account. Can be created after going public. Zero incremental cost to create. [AWS Private Offers Docs](https://docs.aws.amazon.com/marketplace/latest/userguide/creating-private-offer.html)

### Step-by-Step: SaaS Listing

1. **Register as an cloud marketplace Seller** at [aws.amazon.com/partners/marketplace](https://aws.amazon.com/partners/marketplace) → "Register Now." Provide company information, banking details (for payment disbursements), and tax documentation (W-9 for US entities). Approval: 3–5 business days. [AWS Seller Registration](https://docs.aws.amazon.com/marketplace/latest/userguide/seller-account-registering.html)
2. **Define product configuration** in the cloud marketplace Management Portal (AMMP): product title, categories, usage dimensions, pricing model, regional availability, support contacts.
3. **Integrate AWS SaaS APIs:** Implement `ResolveCustomer`, `BatchMeterUsage`, and `MeterUsage` calls. Your service must communicate entitlements and usage back to AWS in real time. [Labra cloud marketplace guide](https://labra.io/how-to-list-your-saas-on-aws-marketplace-step-by-step-guide-for-2025/)
4. **Choose pricing model** (see below).
5. **Submit for AWS review:** AWS reviews documentation, data flow diagrams, and API integration. Review: days to several weeks depending on complexity.
6. **Go live** → monitor entitlement callbacks, reconcile metering with AWS reports.
7. **Enable private offers and co-sell** via AWS ACE Pipeline.

**Typical timeline: 4–8 weeks** from registration to live listing with manual integration; 2 weeks with automation platforms.

### Pricing Models

| Model | How It Works | Best For |
|-------|-------------|----------|
| **SaaS Contract** | Fixed-term upfront contract (e.g., annual subscription); customer pays at contract start | Predictable ARR; enterprise sales |
| **SaaS Subscription** | Metered or recurring usage-based billing; customer pays as-they-go | Usage-variable products; AI inference costs |

> For an AI-runtime product, **SaaS Contract + overage SaaS Subscription** is the common hybrid. Negotiate a base annual contract with usage-based overage.

### GovCloud Listing (Separate Workflow)

To list in AWS GovCloud:
1. Register a separate **AWS GovCloud (US) account** at the GovCloud sign-up page (requires US-person verification — ITAR requirement).
2. Request **account verification** from the cloud marketplace Ops team from your standard seller account.
3. In the AMMP, under the Regions tab, select `us-gov-east-1` and `us-gov-west-1` radio buttons.
4. Alternatively, if using the Excel product load form, enter `TRUE` in the `us-gov-west-1 Availability` and `us-gov-east-1 Availability` columns. [AWS GovCloud Marketplace guide](https://aws.amazon.com/blogs/awsmarketplace/make-software-available-aws-govcloud-us-aws-marketplace/)

> **Note:** As of May 1, 2025, SaaS products hosted on any cloud infrastructure may list on cloud marketplace — AWS hosting is no longer required for commercial listings. Only fully AWS-hosted solutions count toward customer EDP (Enterprise Discount Program) spend commitments. [Clazar AWS SaaS Policy Update](https://clazar.io/blog/aws-new-saas-policy)

**AWS transaction fee:** AWS takes 3–20% of revenue depending on product type and annual volume. No listing fee.

**Priority Rating: MUST-HAVE — Private listing within 2 weeks of product readiness; public listing by Month 3.**

---

## 7. Azure Marketplace and Google Cloud Marketplace

### Azure Marketplace

**Requirements:** Must have a Microsoft Partner Center account; SaaS offers must be hosted on Microsoft Azure and use the SaaS Fulfillment and Metered Billing APIs. [Azure listing requirements](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/marketplace-criteria-content-validation) | [Create a SaaS offer in Azure](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/create-new-saas-offer)

**Steps:**
1. Register in Microsoft Partner Center → enroll in the Commercial Marketplace program.
2. Create a SaaS offer with Offer ID, listing details, technical configuration (landing page URL, connection webhook, Azure AD tenant ID).
3. Configure pricing (flat rate, per-user, or metered).
4. Submit for Microsoft review (~3–5 business days for standard offers).

**Note:** Azure requires Azure hosting for the SaaS backend to qualify for co-sell motions and Microsoft for Startups benefits.

### Google Cloud Marketplace

**Requirements:** Must join [Google Cloud Partner Advantage Program](https://docs.cloud.google.com/marketplace/docs/partners/get-started), achieve Build Partner status, sign the Marketplace Vendor Agreement, and integrate the Procurement API for entitlement lifecycle management. [GCP Marketplace requirements](https://docs.cloud.google.com/marketplace/docs/partners/get-started)

**Steps:**
1. Enroll in Partner Advantage → access Partner Hub → sign Marketplace agreement.
2. Set up Cloud Commerce Consumer Procurement API integration.
3. Configure product (SaaS or VM), pricing, regions.
4. Submit for Google review (1–4 weeks).

### Which to Prioritize

| Marketplace | Priority | Rationale |
|-------------|----------|-----------|
| **AWS** | 1st | Largest cloud marketplace; deepest GovCloud pathway; strongest federal co-sell infrastructure |
| **Azure** | 2nd | Strong enterprise and government (Azure Government) presence; required if Microsoft 365 ecosystem is a distribution channel |
| **GCP** | 3rd | Smaller enterprise market share; pursue only after AWS and Azure generate traction |

**Priority Rating: AWS = MUST-HAVE. Azure = NICE-TO-HAVE (Month 6+). GCP = PREMATURE until Azure is live.**

---

## 8. StateRAMP

### What It Is
StateRAMP is a consortium framework modeled on NIST SP 800-53, specifically governing cloud security authorization for state and local government entities. It is separate from StateRAMP — StateRAMP covers federal agencies only; StateRAMP covers the 50 states, territories, and municipalities. [RISCPoint StateRAMP vs StateRAMP guide](https://www.riscpoint.com/post/fedramp-vs-stateramp-a-guide)

### Reciprocity with StateRAMP
If SZL Holdings obtains a **StateRAMP Ready, P-ATO, or ATO** designation, StateRAMP automatically accepts it under its reciprocity program — no additional security assessment required. SZL Holdings must become a **StateRAMP member** to claim reciprocity. [Carahsoft StateRAMP harmonization](https://www.carahsoft.com/wordpress/carahsoft-stateramp-the-importance-of-framework-harmonization-blog-2025/)

### When StateRAMP Matters
StateRAMP is relevant when state and local government contracts are material to the revenue strategy — e.g., state CIO offices, county health departments, municipal planning agencies. If federal civilian is the primary target, StateRAMP is a downstream benefit of StateRAMP.

**Priority Rating: NICE-TO-HAVE — Pursue as a zero-incremental-cost extension of StateRAMP authorization, not as a standalone effort.**

---

## 9. HIPAA Business Associate Agreement (BAA) Readiness

### When It Applies
A BAA is required if SZL Holdings creates, receives, maintains, or transmits **Protected Health Information (PHI)** on behalf of a covered entity (hospital, health plan, healthcare clearinghouse). An AI-runtime product that processes patient data, clinical notes, or insurance records in healthcare contexts is a business associate. [Linford & Co. BAA guide](https://linfordco.com/blog/importance-hipaa-business-associate-agreements/)

### What a HIPAA-Track Buyer Expects Before Signing

| Requirement | What It Means for SZL Holdings |
|-------------|-------------------------------|
| **Signed BAA** | Written agreement defining permitted PHI uses, safeguards, breach notification obligations. [HIPAA Journal BAA guide](https://www.hipaajournal.com/hipaa-business-associate-agreement/) |
| **Administrative Safeguards** | Assigned Security Officer (Stephen Lutar can self-designate); policies for workforce training, access management, incident response. |
| **Technical Safeguards** | Encryption at rest and in transit; access controls; audit logging; automatic logoff. |
| **Physical Safeguards** | Physical access controls to servers (cloud data center certifications count). |
| **Breach Notification** | Must notify covered entity within 60 days of discovering a breach. [Accountable HQ BAA requirements](https://www.accountablehq.com/post/hipaa-compliance-for-business-associate-agreements-baas-requirements-and-checklist) |
| **Subcontractor BAAs** | Must flow down PHI obligations to all vendors who touch PHI (AWS, Azure, etc. — all have published BAAs). |
| **2025 HIPAA Security Rule Update** | HHS proposed rule (January 2025) adds requirements for encryption, MFA, and network segmentation — finalization expected in 2026. |

> **Practical path:** SOC 2 Type 2 (Security + Availability + Processing Integrity) combined with a legally reviewed BAA template is sufficient for most healthcare enterprise sales. No separate HIPAA certification exists — compliance is self-attested and audited by covered entities.

**Priority Rating: NICE-TO-HAVE — Develop BAA template and internal safeguard documentation at Month 6 if healthcare pipeline develops. Zero cash cost; ~20 attorney hours.**

---

## 10. EU AI Act Conformity

### Risk Classification
The EU AI Act uses a four-tier risk model. [HyphenX EU AI Act guide](https://hyphenxsolutions.com/Blog/eu-ai-act-enforcement-cycle-what-us-global-companies-should-do-in-2026/)

| Risk Tier | Examples | SZL Holdings Applicability |
|-----------|----------|---------------------------|
| **Prohibited** | Social scoring, real-time biometric surveillance | Not applicable |
| **High-Risk (Annex III)** | Employment decisions, credit scoring, law enforcement tools, critical infrastructure safety | **Potentially applicable** if AI runtime is used in employment screening, credit assessment, or public benefit allocation |
| **Limited-Risk** | Chatbots, deepfake tools | Likely applicable — transparency obligations |
| **Minimal-Risk** | Spam filters, AI-enabled video games | Baseline |

### Enforcement Timeline

| Date | What's Enforceable |
|------|-------------------|
| **February 2025** | AI literacy obligations (Article 4) |
| **August 2025** | GPAI model rules (transparency, systemic risk) |
| **August 2, 2026** | High-risk AI system obligations (Articles 9–17): risk management, data governance, technical documentation, human oversight, accuracy/security monitoring. Article 50 transparency. [CSA Research Note](https://labs.cloudsecurityalliance.org/research/csa-research-note-eu-ai-act-high-risk-compliance-deadline-20/) |
| **2027** | Remaining provisions; full AI Act application |

### High-Risk System Requirements (Enforceable August 2, 2026)

If classified as high-risk (Annex III), SZL Holdings must: [McKenna Consultants EU AI Act guide](https://www.mckennaconsultants.com/eu-ai-act-high-risk-compliance-a-technical-readiness-guide-for-august-2026/)

1. **Technical documentation** (Annex IV): System description, development methods, data governance, risk management — completed before market placement.
2. **Risk management system** covering design through deployment lifecycle.
3. **Data governance controls** for training/validation/testing data.
4. **Human oversight mechanisms** — ability to override or stop the system.
5. **Accuracy, robustness, and cybersecurity requirements.**
6. **EU Authorized Representative:** Non-EU providers must appoint an EU-based representative.
7. **Registration in EU database** before deployment.

**Penalties:** Up to €35M or 7% of global annual turnover for prohibited practice violations; up to €15M or 3% for other compliance failures.

### What's Enforceable in 2026 vs. 2027

| Enforceable August 2026 | Full Application 2027 |
|------------------------|----------------------|
| High-risk system provider obligations (Articles 9–17) | Remaining Annex I product-embedded AI systems |
| Article 26 deployer obligations | All remaining provisions fully in force |
| Article 50 transparency obligations | |
| Sandbox protections | |

### SZL Holdings Position

- **If the AI runtime product is used for governance/oversight of AI systems (not employment, credit, or safety-critical decisions):** Likely **Limited-Risk** — transparency obligations only (disclose AI interaction, label synthetic content).
- **If any module performs employment screening, benefit eligibility, or law enforcement analytics:** **High-Risk** — full Annex III compliance by August 2, 2026.
- **For EU market entry:** Conduct AI system risk classification immediately. Appoint EU representative if high-risk path is confirmed.

**Priority Rating: NICE-TO-HAVE for US-only sales. MUST-HAVE if EU customers are in pipeline — assess at Month 6.**

---

## 11. Prioritized 24-Month Roadmap

### Visual Timeline

```
Month 1        Month 3        Month 6        Month 12       Month 18       Month 24
   |              |              |              |              |              |
[SAM.gov]    [AWS Mktpl]    [SOC 2 T1]    [SOC 2 T2]    [StateRAMP]     [ISO/StateRAMP]
[UEI/CAGE]   [Public List]  [Azure Mktpl] [AWS GovCld]  [LI-SaaS or]  [8(a) cert if]
[NAICS/PSC]  [Private Offer][HIPAA BAA?]  [CMMC? ←DoD]  [20x Low]     [eligible]
             [SOC 2 start]  [EU AI Act    [ISO 27001?]  [Pilot]       [EU Rep if]
                            [classify]                               [needed]
```

### Month-by-Month Milestones

#### Month 1 — Federal Foundation
- [ ] **Register on SAM.gov** (free, ~2 hours): Obtain UEI + CAGE code
- [ ] **NAICS primary:** 541512; secondary: 541511, 541715
- [ ] **PSC codes:** DA10 (primary), DJ10 (secondary)
- [ ] **Self-certify:** Small Business (mandatory)
- [ ] **Set calendar reminder** for 365-day renewal
- **Cost:** $0 | **Output:** Active SAM registration, UEI, CAGE

#### Month 2–3 — Market Distribution
- [ ] **Register as cloud marketplace seller** (free, 3–5 days approval)
- [ ] **Build SaaS Contract API integration** (metering + entitlement)
- [ ] **Submit private listing** (free, ~2 weeks review)
- [ ] **Create first private offer** for any LOI prospect
- **Cost:** $0–$5,000 (developer time) | **Output:** cloud marketplace listing, private offer capability

#### Month 3–4 — SOC 2 Initiation
- [ ] **Select compliance platform:** Drata Foundation or Secureframe Fundamentals (~$7,500–$10,000/yr)
- [ ] **Engage boutique SOC 2 CPA firm** for Type 1 audit (target: $8,000–$12,000 auditor fee)
- [ ] **Write and publish security policies** (use platform templates)
- [ ] **Implement technical controls:** MDM, SSO, encryption, logging, access reviews
- **Cost:** $15,000–$25,000 | **Output:** Policies live, controls implemented

#### Month 5–6 — SOC 2 Type 1 + Azure Entry
- [ ] **Complete SOC 2 Type 1 audit** → receive report
- [ ] **Register on Azure Marketplace** (Partner Center account)
- [ ] **EU AI Act classification exercise** — document whether product is high-risk, limited-risk, or minimal-risk
- [ ] **Evaluate 8(a) eligibility** — if Stephen meets social disadvantage criteria, initiate application (12–18 months to certify)
- [ ] **Draft HIPAA BAA template** if healthcare prospects exist (~$3,000–$5,000 legal review)
- [ ] **Begin SOC 2 Type 2 observation window** (controls must run cleanly for 3–6 months)
- **Cost:** $5,000–$10,000 (Azure onboarding, legal) | **Output:** SOC 2 Type 1 report, Azure listing started

**Decision Point A (Month 6):** Do any federal civilian prospects require StateRAMP? If yes → begin agency sponsor outreach. If no → defer to Month 18.

#### Month 8–12 — SOC 2 Type 2 Completion
- [ ] **Complete SOC 2 Type 2 audit** (3–6 month observation + 4–8 week audit)
- [ ] **List on AWS GovCloud** if first federal agency prospect is identified
- [ ] **Evaluate ISO 27001** — pursue only if EU revenue pipeline is confirmed
- [ ] **CMMC assessment** — only if DoD solicitation with CMMC clause arrives; else skip

**Decision Point B (Month 12):** Has a DoD RFP arrived with CMMC? If yes → engage C3PAO within 30 days. If no → skip.

- **Cost:** $12,000–$25,000 (Type 2 audit) | **Output:** SOC 2 Type 2 report — unlocks Fortune 500 and most enterprise buyers

#### Month 14–18 — Federal Market Entry
- [ ] **Identify agency sponsor** for StateRAMP LI-SaaS or 20x Low pilot
- [ ] **Engage 3PAO** (A-LIGN, Schellman, or Coalfire for first meeting; Lazarus Alliance or Tevora for smaller scopes)
- [ ] **Begin StateRAMP readiness assessment** ($20,000–$50,000)
- [ ] **Submit to StateRAMP 20x Low pilot** if product fits (minimal PII, no CUI storage)
- [ ] **StateRAMP membership** — join if state government contracts emerge (leverages StateRAMP investment at zero incremental assessment cost)

**Decision Point C (Month 18):** Is there a committed agency sponsor or 20x pilot acceptance? If yes → authorize $150,000–$300,000 StateRAMP budget. If no → defer and focus on enterprise commercial.

- **Cost:** $20,000–$50,000 (readiness); $150,000–$300,000 (full LI-SaaS/Low authorization) | **Output:** StateRAMP Ready designation (commercial credibility); ATO (commercial unlock)

#### Month 20–24 — Maturity and Expansion
- [ ] **StateRAMP authorization complete** (ATO) → list on StateRAMP Marketplace → eligible for federal contracts without per-agency review
- [ ] **ISO 27001 certification** if EU revenue is material (6–12 months from initiation → start Month 12 if EU pipeline confirmed)
- [ ] **8(a) certification** if application was filed at Month 6 (18-month approval timeline)
- [ ] **GCP Marketplace listing** once AWS + Azure are generating pipeline
- [ ] **EU AI Act compliance** — if high-risk classification confirmed, complete technical documentation, appoint EU representative, register in EU database before deploying to EU customers

**Decision Point D (Month 24):** Review StateRAMP ROI. Is federal revenue covering authorization maintenance costs ($50,000–$200,000/yr)? If not, evaluate whether to continue or sunset ATO.

---

### Summary Prioritization Matrix

| Certification | Priority | When | Cost (Low–High) | Commercial Unlock |
|---------------|----------|------|-----------------|-------------------|
| SAM.gov | **MUST-HAVE** | Month 1 | $0 | Federal eligibility; all downstream |
| cloud marketplace | **MUST-HAVE** | Month 2–3 | $0 (+ dev time) | All enterprise + federal cloud buyers |
| SOC 2 Type 1 | **MUST-HAVE** | Month 6 | $15,000–$25,000 | Mid-market enterprise sales |
| SOC 2 Type 2 | **MUST-HAVE** | Month 12 | $25,000–$50,000 | Fortune 500, federal civilian RFPs |
| Azure Marketplace | **NICE-TO-HAVE** | Month 6 | $0 (+ dev time) | Microsoft-ecosystem enterprise |
| HIPAA BAA readiness | **NICE-TO-HAVE** | Month 6 | $3,000–$5,000 | Healthcare buyers |
| EU AI Act (if high-risk) | **CONDITIONAL** | Month 6 assess | $10,000–$50,000 | EU market access |
| ISO 27001 | **NICE-TO-HAVE** | Month 18 | $10,000–$35,000 | EU/UK enterprise/government |
| StateRAMP LI-SaaS / 20x Low | **CONDITIONAL** | Month 18 | $150,000–$300,000 | Federal agency contracts |
| StateRAMP | **NICE-TO-HAVE** | Post-StateRAMP | ~$0 incremental | State/local government contracts |
| GCP Marketplace | **PREMATURE** | Month 18+ | $0 (+ dev time) | GCP-ecosystem enterprise |
| CMMC 2.0 | **PREMATURE** | On DoD contract | $5,000–$200,000 | DoD contracts only |
| StateRAMP Moderate | **PREMATURE** | Month 24+ | $500,000–$1,500,000 | Sensitive federal agency data |
| 8(a) Certification | **ASSESS** | Month 6 | $0 (SBA cost) | Set-aside contract access |

---

## Decision Gates Summary

| Gate | Trigger | Action |
|------|---------|--------|
| **A — Month 6** | Federal civilian prospect asks "are you StateRAMP?" | Start agency sponsor outreach; budget $20K for readiness |
| **B — Month 12** | DoD RFP arrives with CMMC clause | Engage C3PAO within 30 days; do not invest before RFP |
| **C — Month 18** | Agency sponsor committed OR 20x pilot accepted | Authorize full StateRAMP budget ($150K–$300K LI-SaaS) |
| **D — Month 24** | StateRAMP ATO in hand | Review federal revenue vs. $50K–$200K annual maintenance; decide to sustain or sunset |
| **E — Month 6** | EU customers in pipeline | Complete EU AI Act risk classification; if high-risk, start compliance by Month 9 |
| **F — Month 6** | Healthcare buyers signing | Execute HIPAA BAA template; implement technical safeguards inventory |

---

*Sources: [SAM.gov](https://sam.gov/sites/default/files/2024-11/entity-checklist.pdf) | [SBA.gov](https://www.sba.gov/federal-contracting/contracting-guide/basic-requirements) | [StateRAMP.gov](https://www.fedramp.gov/20x/) | [StateRAMP 20x Update](https://www.fedramp.gov/2025-07-30-fedramp-20x-four-months-in-and-authorizing/) | [Paramify StateRAMP cost](https://www.paramify.com/blog/fedramp-cost) | [Vanta StateRAMP cost](https://www.vanta.com/collection/fedramp/fedramp-cost) | [Comp AI SOC 2 cost](https://trycomp.ai/soc-2-cost-breakdown) | [SecureLeap platform comparison](https://www.secureleap.tech/blog/soc-2-tools-vanta-drata-secureframe-guide-2025) | [Polimity SOC 2 2026](https://polimity.com/blog/how-much-does-a-soc-2-audit-cost/) | [SOC2Auditors.org](https://soc2auditors.org/insights/soc-2-type-1-vs-type-2/) | [Rhymetec ISO 27001](https://rhymetec.com/iso-27001-certification-cost-breakdown-2025/) | [StrongDM ISO cost](https://www.strongdm.com/blog/iso-27001-certification-cost) | [CMMC.com cost guide](https://www.cmmc.com/newsroom/cost-of-cmmc) | [Paramify CMMC cost](https://www.paramify.com/blog/cmmc-cost) | [Mayer Brown CMMC](https://www.mayerbrown.com/en/insights/publications/2025/09/department-of-defense-releases-long-anticipated-final-rule-implementing-the-cybersecurity-maturity-model-certification-program) | [Labra AWS guide](https://labra.io/how-to-list-your-saas-on-aws-marketplace-step-by-step-guide-for-2025/) | [AWS Seller Docs](https://docs.aws.amazon.com/marketplace/latest/userguide/seller-account-registering.html) | [AWS GovCloud listing](https://aws.amazon.com/blogs/awsmarketplace/make-software-available-aws-govcloud-us-aws-marketplace/) | [Clazar AWS policy 2025](https://clazar.io/blog/aws-new-saas-policy) | [Azure listing requirements](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/marketplace-criteria-content-validation) | [GCP Marketplace requirements](https://docs.cloud.google.com/marketplace/docs/partners/get-started) | [RISCPoint StateRAMP](https://www.riscpoint.com/post/fedramp-vs-stateramp-a-guide) | [Linford BAA guide](https://linfordco.com/blog/importance-hipaa-business-associate-agreements/) | [HIPAA Journal](https://www.hipaajournal.com/hipaa-business-associate-agreement/) | [Accountable HQ BAA](https://www.accountablehq.com/post/hipaa-compliance-for-business-associate-agreements-baas-requirements-and-checklist) | [HyphenX EU AI Act](https://hyphenxsolutions.com/Blog/eu-ai-act-enforcement-cycle-what-us-global-companies-should-do-in-2026/) | [CSA EU AI Act research](https://labs.cloudsecurityalliance.org/research/csa-research-note-eu-ai-act-high-risk-compliance-deadline-20/) | [McKenna EU AI Act guide](https://www.mckennaconsultants.com/eu-ai-act-high-risk-compliance-a-technical-readiness-guide-for-august-2026/) | [USFCR PSC codes](https://blogs.usfcr.com/it-psc-codes-federal-contracting) | [DoD PSC Manual](https://www.acq.osd.mil/dpap/policy/policyvault/XaaS_Product_and_Service_Codes_Rev_1.pdf) | [Schellman 3PAO](https://www.fedramp.gov/marketplace/assessors/136571/) | [A-LIGN StateRAMP](https://www.a-lign.com/service/fedramp) | [Coalfire StateRAMP](https://coalfire.com/services/assessment) | [Vanta LI-SaaS](https://www.vanta.com/collection/fedramp/fedramp-li-saas) | [Secureframe LI-SaaS](https://secureframe.com/hub/fedramp/low) | [SBA 8(a) Program](https://www.sba.gov/federal-contracting/contracting-assistance-programs/8a-business-development-program) | [SBA HUBZone](https://www.sba.gov/federal-contracting/contracting-assistance-programs/hubzone-program)*
