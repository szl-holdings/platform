# SZL Holdings -- Empire APEX Meeting Script
## Tuesday, May 6, 2026 | 10:00 AM ET | Microsoft Teams
## Mercy McInnis, Procurement Counselor

---

## Pre-Meeting Checklist

- [ ] Teams link tested and working
- [ ] Screen share ready (platform loaded at szl-holdings dev URL)
- [ ] This script open on second monitor or printed
- [ ] Capability Statement PDF ready to send via Teams chat
- [ ] Briefing document ready to send via Teams chat
- [ ] SAM.gov tab open (to show registration status)
- [ ] GitHub org open: github.com/szl-holdings

---

## MEETING FLOW: 30 minutes total

| Block | Duration | Content |
|---|---|---|
| 1. Introduction | 2 min | Who you are, why you are here |
| 2. What SZL Holdings builds | 4 min | The governed command layer |
| 3. Live platform walkthrough | 6 min | Screen share of 7 products |
| 4. Public proof artifacts | 3 min | GitHub repos + Zenodo DOI |
| 5. Government alignment | 3 min | NIST AI RMF, DoD RAI, GSA |
| 6. Registration status | 2 min | SAM.gov, NAICS, set-asides |
| 7. Five questions for Mercy | 5 min | Where you need her guidance |
| 8. Her questions | 5 min | Open floor |

---

## BLOCK 1: INTRODUCTION (2 minutes)

### What to say:

"Mercy, thank you for the time today. My name is Stephen Lutar. I am the founder and sole operator of SZL Holdings, based in New York State.

I build governed operational intelligence platforms -- software that bridges data ingestion, risk analysis, AI-supported decision-making, execution, and auditability into a single continuous workflow.

I am here today because I believe the work I have built aligns with current federal and state procurement directions around AI governance and operational transparency. I am not here to pitch you -- I am here to learn. I need your guidance on how to become a vendor the government can buy from.

I have a working platform, an open-source runtime, a published peer-style paper with a Zenodo DOI, and no signed contracts. I want to fix that last part responsibly."

### Key tone:

- Calm, prepared, respectful of her expertise
- Do not oversell. State facts.
- She is the expert on procurement. You are the expert on your platform.

---

## BLOCK 2: WHAT SZL HOLDINGS BUILDS (4 minutes)

### What to say:

"The core of what I have built is what I call a governed command layer. It runs in five continuous stages:

First, signals are ingested and normalized across systems -- operational, security, financial, document, sensor, third-party.

Second, risks and opportunities are scored in real time against policy.

Third, decisions are generated with AI support, but they require human approval where the policy says they must. This is enforced at the runtime level -- not as a feature you turn on, but as a property of how the system works.

Fourth, actions are executed with full traceability. Every call is recorded, every input is hashed, every approver is named.

Fifth, outcomes are verified against the original intent and recorded into an auditable history that can be replayed.

The convergence properties of this loop -- when it terminates, what its proof chain looks like -- are formalized in a published thesis paper I will show you in a moment."

### If she asks 'what does that mean in practice?':

"It means every AI-assisted decision the platform makes carries a cryptographic receipt back to the inputs, the policy that authorized it, and the human who approved it. When an auditor asks 'show your work,' the platform can answer that question by construction -- not because someone remembered to log it."

---

## BLOCK 3: LIVE PLATFORM WALKTHROUGH (6 minutes)

### Instructions:
Share your screen. Walk through each product surface. Spend no more than 45 seconds on each.

### A11oy -- Orchestration + Decision Intelligence
*Navigate to: /a11oy/*

"This is A11oy, the orchestration control plane. It is the layer everything else runs on. It registers agents, applies validator policy, gates approvals, and is where operators monitor governed workflow runs across every vertical. The Decision Intelligence surface you see here aggregates entity intelligence, finance-grade data, and portfolio metrics across the entire SZL Holdings ecosystem."

### Sentra -- Cyber Resilience Command
*Navigate to: /sentra/*

"Sentra is the cybersecurity surface. Continuous threat-posture monitoring, evidence packs, and risk-tier escalation gates. SOC operations, threat intelligence, compliance, and incident response -- all wired into the same governed runtime. 80+ modules, all orchestrated by A11oy."

### Terra -- Real Estate Intelligence
*Navigate to: /terra/*

"Terra is the real estate intelligence platform. Distressed-property discovery, ownership analysis, pipeline management, and deal execution. Live NYC and NYS data. This is relevant to New York State agencies that manage significant real property portfolios."

### Vessels -- Maritime Intelligence
*Navigate to: /vessels/*

"Vessels is the maritime intelligence surface. Fleet positions, voyage economics, compliance, exception management. Sanctions screening, dark-vessel detection. This aligns with DHS and Coast Guard maritime domain awareness requirements."

### Counsel -- Legal Matter Command
*Navigate to: /counsel/*

"Counsel is the legal surface. Matters, obligations, and legal exposure surfaced as a command surface. Policy-gated human review, evidence-bound recommendation. Relevant to any agency legal ops that needs traceable, governed legal operations."

### Amaru (Conduit) -- Convergent Reverse-ETL
*Navigate to: /conduit/*

"Amaru is the data convergence engine. Append-only delta log, hash-verified ingest, and the three-witness reconciliation primitive from the Ouroboros Thesis. This is the data-lineage surface -- relevant to any agency that needs a defensible answer to 'how do we get a single trusted view of state across N systems.'"

### Carlota Jo -- Concierge Advisory Operations
*Navigate to: /carlota-jo/*

"Carlota Jo is the private advisory brand. Premium service for individuals who require precision and discretion. Same proof-chain decision receipts bound to the runtime."

---

## BLOCK 4: PUBLIC PROOF ARTIFACTS (3 minutes)

### What to say:

"I want to show you two things that are public on GitHub today, both under the szl-holdings organization, both with verifiable history.

First is the Ouroboros Runtime. This is open-source code -- the bounded-loop runtime the platform is built on. Current release is v6.2.0. It has tests, dependabot, CodeQL, and a SECURITY.md. It is not a marketing repo -- it is the actual code."

*Open: github.com/szl-holdings/ouroboros*

"Second is the Ouroboros Thesis. This is a peer-style paper published on Zenodo with a DOI. It formalizes the convergence properties of the bounded loop the runtime implements. The current version is paper-v3-2.0.0, released May 2, 2026."

*Open: github.com/szl-holdings/ouroboros-thesis*

"I want to note something about the publishing history. The May 2 release was an audit-supported rewrite that explicitly retracted a prior version after a self-audit identified residual fabrications in announcement materials. That retraction is itself in the public record. I am telling you this because it is how the platform's governance discipline shows up in its own publishing record: when something is wrong, it is publicly retracted and replaced."

### Key references:

- Ouroboros Runtime: github.com/szl-holdings/ouroboros (v6.2.0)
- Ouroboros Thesis: github.com/szl-holdings/ouroboros-thesis (paper-v3-2.0.0)
- DOI: 10.5281/zenodo.19944926
- ORCID: 0009-0001-0110-4173
- License: CC-BY-4.0

---

## BLOCK 5: GOVERNMENT ALIGNMENT (3 minutes)

### What to say:

"The work appears to align with four areas of increasing federal and state demand. I want to state clearly that these are alignment statements, not claims of past performance.

First: operational transparency and auditability. The Outcome Graph and Proof Chain primitives answer the question every IG and every audit committee eventually asks -- 'show your work.' Every action carries its provenance. Every decision carries the policy that authorized it.

Second: cybersecurity and risk management. The runtime treats every action as a security event by default. It is logged, signed, and replayable. This aligns with the OMB and CISA Zero Trust directions.

Third: AI governance and responsible automation. The Covenant Policy primitive gates AI outputs. Decisions that require human approval cannot be auto-executed. This is relevant to OMB M-24-10 and the NIST AI Risk Management Framework.

Fourth: cross-system interoperability and data lineage. The three-witness reconciliation primitive gives a defensible answer to data-trust questions for environments where regulators ask for it."

### NIST AI RMF mapping (if she asks):

| Function | SZL Coverage |
|---|---|
| GOVERN | Validator registry, loop policy, operator modes |
| MAP | Domain pack router, task-type routing |
| MEASURE | Delta, consistency, uncertainty scores per step |
| MANAGE | Human approval gate, halt conditions, replay |

### DoD Responsible AI Tenets (if she asks):

| Tenet | Status |
|---|---|
| Responsible | Covered -- human approval at risk tier 3/4 |
| Equitable | Gap -- bias testing plan needed |
| Traceable | Covered -- full trace runtime, append-only logs |
| Reliable | Covered -- golden runs, replay verification |
| Governable | Covered -- approval gate, halt conditions |

---

## BLOCK 6: REGISTRATION STATUS (2 minutes)

### What to say:

"Here is where SZL Holdings stands on the registration side. I want to be direct about what is done and what is not:

The legal entity -- SZL Holdings -- is in good standing, single-member, US-domiciled. EIN is on file.

SAM.gov registration is pending -- I need your guidance on UEI activation timeline and common rejection reasons.

I have identified primary NAICS code 541512, Computer Systems Design Services, with secondaries at 541511, 541519, 541611, and 541690. I would like your confirmation on those.

I am a single-founder small business. I need your guidance on set-aside eligibility -- which programs, if any, I qualify for.

CMMC Level 1 self-assessment is in progress. FedRAMP is not yet in scope -- the deployment model is on-prem or customer-cloud first."

### What NOT to claim:

- No current federal contracts
- No FedRAMP authorization
- No ATO or DoD impact-level designation
- No external audit
- No signed platform customers
- Single-founder operation

---

## BLOCK 7: FIVE QUESTIONS FOR MERCY (5 minutes)

### What to say:

"Mercy, I came to Empire APEX with five specific questions. I would like your guidance on each, in whatever order makes sense to you.

One: given the public-proof posture and the absence of a current contract, what is the most credible NYS pathway? OGS centralized contract? On-call advisory pool? Subcontract or mentor-protege under a NYS prime?

Two: same question for the federal side. SBIR Phase I as the fastest credible entry? GSA MAS via a sponsoring contract holder? Direct response to a sources-sought notice in the AI governance space?

Three: SAM.gov UEI, CAGE, NAICS selection, small-business size standard, set-aside eligibility review. What order, what is realistic on what timeline?

Four: capability statement format. I have a draft -- counsel on what NYS and federal procurement officers actually want to see on the page would be welcome.

Five: which agencies -- NYS or federal -- actually buy this kind of work, and which buy it from sole-founder firms?"

### Instructions:
Take notes on her answers. Do not argue. If she says something is not realistic, believe her. If she offers a different path, pursue it.

---

## BLOCK 8: HER QUESTIONS (5 minutes)

### Instructions:

- Answer directly and honestly
- If you do not know, say "I do not know"
- If she asks about revenue: "There is no platform revenue at this time. The strength of the position is the public proof -- the open-source runtime and the DOI-pinned paper."
- If she asks about team: "I am a single-founder operation. There is no team to misrepresent."
- If she asks about timeline: "I am ready to move at whatever pace your guidance supports. I will hit the dates I quote."

---

## POST-MEETING ACTIONS

Within 24 hours of the meeting:

- [ ] Send thank-you email to Mercy with the Capability Statement PDF attached
- [ ] Send the Operational Briefing PDF
- [ ] Note every action item she gave you
- [ ] Begin SAM.gov registration if she confirmed the process
- [ ] Begin NAICS confirmation per her guidance
- [ ] Schedule follow-up meeting if she offered one
- [ ] Update this script with notes from the conversation

---

## DOCUMENTS TO HAVE READY

| Document | File | Status |
|---|---|---|
| Operational Briefing | dossier/SZL_Holdings_Empire_APEX_Briefing.md | Ready |
| Capability Statement | dossier/SZL_Holdings_Capability_Statement.md | Ready |
| Government Readiness Audit | docs/audit/szl-government-readiness.md | Ready |
| Product Screenshots | screenshots/ (9 images) | Ready |
| Ouroboros Thesis PDF | Zenodo DOI 10.5281/zenodo.19944926 | Published |

---

## VERIFIED PLATFORM NUMBERS (use these, not estimates)

| Metric | Value |
|---|---|
| Customer-facing product surfaces | 7 + A11oy orchestration layer |
| Platform primitives | 6 |
| Database tables (provisioned) | 848 |
| API endpoint declarations | 5,524 |
| Industry verticals | 7 |
| Monorepo packages | 126 |
| Original innovations (sovereign engine) | 44 |
| Ouroboros runtime tests | 133 |
| Security tests passing | 126 |
| CI workflows | 23 |

---

## FORBIDDEN LANGUAGE

Do not say any of the following during the meeting:

- Any dollar amount not verified by SOURCE_OF_TRUTH.md
- "Series A" (this is not an investor pitch)
- Any claim of past government performance
- Any claim of FedRAMP, ATO, or security certification
- Any team members who do not exist
- Any revenue numbers
- Any customer names

---

End of script.
