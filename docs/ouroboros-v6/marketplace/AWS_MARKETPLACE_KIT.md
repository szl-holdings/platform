# AWS Marketplace Kit — Ouroboros Guardrails
**SZL Holdings | Stephen P. Lutar | ORCID 0009-0001-0110-4173**
**Product:** `@szl-holdings/ouroboros` v6.1.0 + `@szl-holdings/guardrails` SKU
**DOIs:** [10.5281/zenodo.19867281](https://doi.org/10.5281/zenodo.19867281) · [10.5281/zenodo.19934129](https://doi.org/10.5281/zenodo.19934129)

---

## 1. Listing Strategy

The listing strategy proceeds in three phases, each building on the commercial proof established by the previous one.

Phase 1 opens with private offers to three named target accounts — one federal systems integrator, one regional bank, and one health system. Private offers allow SZL Holdings to negotiate custom pricing and custom EULAs without the overhead of a public listing review. They are created at zero incremental cost inside the AWS Marketplace Management Portal after seller registration is complete and are the fastest path to generating Marketplace revenue. The primary goal of Phase 1 is to close at least one annual SaaS Contract and produce a referenceable customer before the public listing goes live.

Phase 2 converts the listing to public, making Ouroboros visible to all AWS Marketplace buyers. The public listing requires the full artifact checklist to be complete: product description, architecture diagram, EULA, support documentation, and a live SaaS API integration (entitlement service + `AWS::Marketplace::SaaS` metering template). The AWS review window for a SaaS product is typically days to several weeks depending on documentation completeness. Phase 2 targets Month 3 from seller registration.

Phase 3 extends the listing to AWS GovCloud (US). GovCloud requires a separate GovCloud account registration, US-person ITAR verification, and selection of `us-gov-east-1` and `us-gov-west-1` regions in the AMMP Regions tab. GovCloud listing is the prerequisite for any federal agency procurement that routes through AWS. Phase 3 is gated on SAM.gov registration being active, which is a separate parallel workstream handled with the assistance of the Empire APEX Accelerator.

---

## 2. Listing Type Decision

SZL Holdings selects the SaaS Contract model over SaaS Subscription.

The SaaS Contract model charges a fixed annual fee at contract start. The customer pays upfront and the revenue is recognized by AWS on day one of the contract term. This creates predictable annual recurring revenue (ARR) that can be modeled for cash-flow planning, which is especially important for a single-member entity without external financing. Enterprise buyers — federal systems integrators, regional banks, health systems — prefer annual contracts because their procurement and budget cycles operate on a fiscal-year basis. A contract aligns the vendor billing cadence to the buyer's budget cadence, reducing friction.

The SaaS Subscription model is metered and billed as-you-go. It is appropriate for products where usage is highly variable month to month, such as per-token inference costs. Ouroboros is a guardrails runtime, not an inference provider. Its value is in governance attestation, not in compute throughput. The per-receipt cost structure of usage-based billing is difficult to forecast for compliance buyers and creates budget uncertainty that slows procurement. A SaaS Contract removes that uncertainty.

The selected configuration is an annual SaaS Contract as the base tier, with an optional SaaS Subscription overage dimension for receipts beyond the contracted volume. This hybrid is the standard approach for AWS Marketplace AI governance SaaS products and is documented in the COMPLIANCE_PLAYBOOK.md.

---

## 3. Required Artifacts Checklist

| Artifact | Description | Status |
|---|---|---|
| AWS account (Marketplace Seller registration) | Register at aws.amazon.com/partners/marketplace; provide company info, banking, W-9; 3–5 day approval | **in-progress** |
| Tax / banking info | W-9 (US entity), EFT banking details for AWS payment disbursements | **in-progress** |
| Product description | Short description (up to 255 chars) + long description for listing page | **complete** |
| Hero / thumbnail image | 1200×630 PNG, brand-safe, no text overlays per AWS guidelines | **in-progress** |
| End-user license agreement (EULA) | Custom EULA uploaded to AMMP or reference to Standard Contract for AWS Marketplace (SCMP) | **in-progress** |
| Architecture diagram | Data flow from customer VPC → Ouroboros entitlement service → SaaS metering API; must show AWS boundary | **in-progress** |
| Free trial config (or skip) | Decision: skip free trial in Phase 1; offer 30-day pilot via private offer instead | **complete** |
| Support docs | Support policy, SLA, contact email, escalation path | **in-progress** |
| Security questionnaire (Vendor Security Questionnaire, AWS-internal) | AWS-internal VSQ; requires SOC 2 Type 1 or equivalent evidence; blocked on audit completion | **blocked** |
| SaaS integration (entitlement service, AWS::Marketplace::SaaS template) | Implement ResolveCustomer, BatchMeterUsage, MeterUsage API calls; CloudFormation template | **in-progress** |
| Listing copy | Title, tagline, long description, highlights, use cases, pricing tiers | **complete** |

---

## 4. Listing Page Draft Copy

### Title
Ouroboros — Closed-Form Λ Guardrails for Generative AI

### Tagline
Tamper-proof 9-axis trust receipts for every AI decision.

### Long Description

Ouroboros is a production guardrails runtime for generative AI workflows. Version 6.1.0 ships 91 primitives across 9 trust axes (Λ): provenance, drift, fidelity, latency, scope-creep, toxicity, hallucination risk, consent alignment, and cost. Every AI decision emits a hash-chained, closed-form Λ scalar receipt that is verifiable, auditable, and immutable. The runtime passes 1,372 tests and carries two peer-reviewed Zenodo DOIs formalizing the mathematical model.

The `@szl-holdings/guardrails` SKU is a drop-in replacement for NVIDIA NeMo Guardrails. It requires no model fine-tuning, no vector database, and no external API calls to compute a Λ receipt. The closed-form computation means latency overhead is deterministic and bounded — typically under 2 ms per receipt at p99 on standard EC2 instance families. The 54-test suite ships in the package and runs in CI without additional infrastructure. Hash-chained receipts create a tamper-evident audit log that satisfies governance requirements in financial services, healthcare, and federal programs.

Ouroboros integrates natively with LangChain (via `LambdaCallbackHandler`), LangSmith, Arize Phoenix (as a composite OpenInference evaluator), OpenTelemetry (OTLP export), and Datadog LLM Observability. The AWS Marketplace listing includes a CloudFormation template for the entitlement service and an S3-compatible receipt sink. SaaS Contract customers receive a named Slack channel for support and a quarterly Λ-trace readout. Enterprise accounts receive on-site integration reviews and a pre-publication case study option.

### Highlights

- Closed-form Λ scalar: deterministic, <2 ms per receipt, no LLM call required to compute governance attestation.
- 91 primitives across 9 trust axes covering every material AI governance dimension from provenance to cost.
- Hash-chained receipt log: tamper-evident audit trail satisfying SOC 2, HIPAA, and federal governance frameworks.
- Drop-in NeMo Guardrails replacement: `@szl-holdings/guardrails` installs in one command; 54 tests pass in CI out of the box.
- Peer-reviewed mathematical model: two Zenodo DOIs (10.5281/zenodo.19867281, 10.5281/zenodo.19934129) underpin every Λ axis definition.

### Use Cases

- Federal AI governance: Wrap agency AI workflows with a Λ-trace for ATO evidence packages and responsible AI readouts to program officers.
- Financial services model risk management: Attach Λ receipts to every LLM output in credit, fraud, and compliance decisioning systems to satisfy SR 11-7 model risk governance requirements.
- Healthcare AI oversight: Log Λ receipts per clinical AI recommendation to support HIPAA audit trails, PHI handling attestation, and FDA AI/ML SaMD documentation.
- Enterprise LLM red-teaming: Run Ouroboros in shadow mode against existing LLM pipelines to surface drift, scope-creep, and hallucination risk distributions before production deployment.

### Pricing Tiers

| Tier | Annual Price | Included Volume | Notes |
|---|---|---|---|
| Starter | $12,000 / yr [CONFIRM] | Up to 5M Λ receipts / yr | Single environment; community Slack support; standard EULA |
| Pro | $48,000 / yr [CONFIRM] | Up to 50M Λ receipts / yr | Up to 3 environments; named support channel; quarterly readout |
| Enterprise | $120,000 / yr [CONFIRM] | Unlimited receipts | Custom EULA; GovCloud option; on-site integration review; case study option; SLA negotiable |

> All amounts are placeholders. Mark [CONFIRM] before public listing goes live. AWS takes 3–20% of revenue as transaction fee depending on annual volume.

---

## 5. Three Target Private Offers

| Account name | Industry | Estimated ACV | Champion contact | Status |
|---|---|---|---|---|
| Booz Allen Hamilton | Federal Systems Integrator (Defense / Civilian AI) | $120,000 [CONFIRM] | AI/ML Capability Lead, Strategic Innovation Group — identify via LinkedIn | Target identified; outreach not sent |
| Truist Financial | Regional Bank (Southeastern US) | $48,000 [CONFIRM] | Chief AI Officer or Model Risk Officer — identify via LinkedIn / bank governance filings | Target identified; outreach not sent |
| Northwell Health | Health System (New York) | $48,000 [CONFIRM] | VP of Clinical Informatics or Chief AI Officer — identify via Northwell leadership page | Target identified; outreach not sent |

> Private offers are created at zero cost in the AWS Marketplace Management Portal after seller registration. Each offer is scoped to the named AWS account ID of the buyer. Custom EULA and payment terms are set per offer. No public listing required to transact.

---

## 6. Six-Month Roadmap

| Milestone | Target Date | Owner | Artifact |
|---|---|---|---|
| M1: AWS Marketplace Seller registration submitted | Week 1 | Stephen Lutar | Seller account ID confirmed; W-9 uploaded |
| M2: SaaS Contract API integration complete | Week 3 | Stephen Lutar | ResolveCustomer + MeterUsage endpoints live; integration test passing |
| M3: Listing copy and artifact checklist finalized | Week 4 | Stephen Lutar | All non-blocked checklist items marked complete; EULA draft signed off |
| M4: Private listing submitted to AWS review | Week 5 | Stephen Lutar | AWS review ticket open; estimated 5–10 business day turnaround |
| M5: First private offer delivered to Booz Allen Hamilton | Month 2 | Stephen Lutar | Private offer link sent to champion contact; 30-day acceptance window |
| M6: Public listing live | Month 3 | Stephen Lutar | Ouroboros appears in AWS Marketplace search; ACE co-sell pipeline opened |
| M7: SOC 2 Type 1 evidence package submitted to auditor | Month 4 | Stephen Lutar | Drata/Secureframe evidence export; auditor engaged |
| M8: Security questionnaire (VSQ) complete | Month 4–5 | Stephen Lutar | AWS-internal VSQ submitted; SOC 2 Type 1 report attached |
| M9: Private offers delivered to Truist and Northwell | Month 4–5 | Stephen Lutar | Two additional private offer links; negotiations open |
| M10: GovCloud listing submitted | Month 5–6 | Stephen Lutar | us-gov-east-1 and us-gov-west-1 regions enabled in AMMP |
| M11: First closed SaaS Contract | Month 6 | Stephen Lutar | Executed contract; first AWS Marketplace disbursement |
| M12: SAM.gov registration active (parallel workstream) | Month 1 (APEX) | Mercy McInnis / Stephen Lutar | UEI + CAGE code issued; NAICS 541512 primary |

---

## Sources

- [AWS Marketplace Seller Registration Docs](https://docs.aws.amazon.com/marketplace/latest/userguide/seller-account-registering.html)
- [AWS Private Offers Docs](https://docs.aws.amazon.com/marketplace/latest/userguide/creating-private-offer.html)
- [AWS GovCloud Marketplace Listing Guide](https://aws.amazon.com/blogs/awsmarketplace/make-software-available-aws-govcloud-us-aws-marketplace/)
- [Labra SaaS Listing Step-by-Step Guide 2025](https://labra.io/how-to-list-your-saas-on-aws-marketplace-step-by-step-guide-for-2025/)
- [Clazar AWS SaaS Policy Update (May 2025)](https://clazar.io/blog/aws-new-saas-policy)
- [Paramify FedRAMP Cost Guide 2026](https://www.paramify.com/blog/fedramp-cost)
