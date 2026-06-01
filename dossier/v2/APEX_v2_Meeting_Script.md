# SZL Holdings — Empire APEX Meeting Script (v2)
## Tuesday, May 6, 2026 · 10:00 AM ET · Microsoft Teams
## Mercy McInnis, Procurement Counselor

> **Refresh:** May 5, 2026. This script supersedes `dossier/APEX_Meeting_Script.md` (May 4). Only the deltas worth surfacing in conversation are flagged below; the structure of the meeting is unchanged.

---

## Pre-Meeting Checklist

- [ ] Teams link tested
- [ ] Screen share ready (platform loaded)
- [ ] This script open on second monitor or printed
- [ ] Capability Statement v2 PDF ready to send via Teams chat
- [ ] Operational Briefing v2 PDF ready to send via Teams chat
- [ ] Pitch Deck v2 PDF on standby (only share if she asks for "the deck")
- [ ] SAM.gov tab open
- [ ] GitHub org tab open: `github.com/szl-holdings`
- [ ] Investor Demo Path open: `docs/audits/INVESTOR_DEMO_PATH.md` (for self-reference, not screen share)

---

## MEETING FLOW: 30 minutes total

| Block | Duration | Content |
|---|---|---|
| 1. Introduction | 2 min | Who you are, why you are here |
| 2. What SZL Holdings builds | 4 min | The governed command layer + CPS |
| 3. Live platform walkthrough | 6 min | Screen share — Trust Center → 7 surfaces → Decision Fabric proof bench |
| 4. Public proof artifacts | 3 min | GitHub repos + Zenodo DOIs (v3 + v9 + v10) |
| 5. Government alignment | 3 min | NIST AI RMF, DoD RAI, GSA, NY S.B. 7599 |
| 6. Registration status | 2 min | SAM.gov, NAICS, set-asides |
| 7. Five questions for Mercy | 5 min | Where you need her guidance |
| 8. Her questions | 5 min | Open floor |

---

## BLOCK 1: INTRODUCTION (2 minutes)

> *(unchanged from v1)*

"Mercy, thank you for the time today. My name is Stephen Lutar. I am the founder and sole operator of SZL Holdings, based in New York State.

I build governed operational intelligence platforms — software that bridges data ingestion, risk analysis, AI-supported decision-making, execution, and auditability into a single continuous workflow.

I am here today because I believe the work I have built aligns with current federal and state procurement directions around AI governance and operational transparency. I am not here to pitch you — I am here to learn. I need your guidance on how to become a vendor the government can buy from.

I have a working platform, an open-source runtime, three published peer-style papers with Zenodo DOIs, and no signed contracts. I want to fix that last part responsibly."

> **Tone:** Calm, prepared, respectful of her expertise.
> **Delta to flag (only if she asks 'what changed since we set up this meeting?'):** "Two more papers landed yesterday — v9 and v10 of the Ouroboros Thesis. v10 is an audit closure paper that certifies, layer by layer, that every formula in v9 actually executes against the shipping repo."

---

## BLOCK 2: WHAT SZL HOLDINGS BUILDS (4 minutes)

"The core of what I have built is a governed command layer. It runs in five continuous stages.

First, signals are ingested and normalized across operational, security, financial, document, sensor, and third-party systems.

Second, risks and opportunities are scored in real time against policy.

Third, decisions are generated with AI support, but they require human approval where the policy says they must. This is enforced at the runtime level — not as a feature you turn on, but as a property of how the system works.

Fourth, actions are executed with full traceability. Every call is recorded, every input is hashed, every approver is named.

Fifth, outcomes are verified against the original intent and recorded into an auditable history that can be replayed.

The convergence properties of this loop — when it terminates, what its proof chain looks like — are formalized in three peer-style papers I will show you in a moment.

There is one new thing worth pointing out. Over the last week we shipped a standard called the Covenant Proof Standard, or CPS. It is a payload-and-receipt protocol that turns any governed cross-vertical workflow into something that can be executed, approved at the right tier, rolled back to a verified state, and audited end-to-end. It is exposed as a first-class API. Three flagship payloads are live today, and per-vertical payloads are rolling out."

### If she asks 'what does CPS mean in practice?':

"It means a procurement officer can ask 'show me the run that approved this expenditure' and get back a JSON object with the policy that authorized it, the approver who released it, the inputs that produced it, the hashes that bind them, and a button that rolls it back to the prior verified state. CPS is what makes governed AI procurable — not a marketing claim, an API contract."

---

## BLOCK 3: LIVE PLATFORM WALKTHROUGH (6 minutes)

> **Refresh:** Walk the documented investor demo path (`docs/audits/INVESTOR_DEMO_PATH.md`). This is the same path the audit pass certified is safe to walk live.

### Stop 1 — A11oy Trust Center (45s)
*Navigate to: `/trust-center`*

"This is the Trust Center. It is the constitutional surface — proof, covenants, attestation in one place. Every other surface inherits this design language. The point is that this is one company, not seven brands stitched together."

### Stop 2 — A11oy Command Surface (45s)
*Navigate to: `/command`*

"This is the cross-vertical command pane. One operator, every domain. The orchestration layer is called A11oy. This is where governed runs are monitored end-to-end."

### Stop 3 — Amaru Dashboard (45s)
*Navigate to: `/conduit/`*

"Amaru is the data convergence engine. Append-only delta log, hash-verified ingest, the three-witness reconciliation primitive from the thesis. The throughput chart you see is on a live `Date.now()` window — it never freezes, that was a bug we fixed yesterday."

### Stop 4 — Sentra Governed Adversary Loop (45s)
*Navigate to: `/sentra/governed-adversary-loop`*

"This is the proof spine in motion. Six steps, end-to-end, Sentra to A11oy and back. Each step emits a proof packet. This is the cybersecurity surface, but the pattern is the same in every vertical."

### Stop 5 — Counsel Matter Overview (30s)
*Navigate to: `/counsel/matter-overview`*

"Counsel is the legal matter command surface. Same proof spine, applied to matters and obligations."

### Stop 6 — Terra Distress Engine (30s)
*Navigate to: `/terra/distress-engine`*

"Terra is the real estate intelligence platform. Distressed-property discovery on live NYC and NYS data. Same proof spine."

### Stop 7 — Vessels Maritime Intelligence (45s)
*Navigate to: `/vessels/maritime-intelligence`*

"Vessels is the maritime surface. Live AIS feed, fleet positions, sanctions screening, dark-vessel detection. Same proof spine."

### Stop 8 — Decision Fabric Proof Bench (45s, NEW)
*Navigate to: `/a11oy/#/decision-fabric/proof`*

"This is the Decision Fabric proof bench, the cross-primitive query layer that joins signal, recommendation, policy, simulation, execution, proof, and outcome under a single correlation ID. It is the operator surface for CPS payloads — this is where you actually run a payload, watch the proof packets emit, and approve or roll back. This is what 'governed AI' looks like as a workflow, not as a slide."

> **Note for Mercy:** She is a procurement counselor, not a buyer. The point of the demo is not to sell — it is to give her enough operational confidence to send introductions. Keep it factual.

---

## BLOCK 4: PUBLIC PROOF ARTIFACTS (3 minutes)

"Three things are public on GitHub today, all under the `szl-holdings` organization, all with verifiable history.

First is the Ouroboros Runtime. Open-source code — the bounded-loop runtime the platform is built on. Current release is v6.2.0. Tests, dependabot, CodeQL, SECURITY.md. Not a marketing repo — the actual code."

*Open: `github.com/szl-holdings/ouroboros`*

"Second is the Ouroboros Thesis. The canonical, latest paper is v11 — *Applied Λ: Measured Per-Request Overhead of the Audit-Closure Operator* — under per-version DOI `10.5281/zenodo.20119582`, concept DOI `10.5281/zenodo.19944926`. v3 in the same series is *The Lutar Invariant* (DOI `10.5281/zenodo.19983066`), the axiomatic trust aggregator. All papers are CC-BY-4.0. Together they are the formal proof spine for the bounded loop the runtime implements."

*Open: `github.com/szl-holdings/ouroboros-thesis`*

"Third — and this is what changed since we set up this meeting — two more papers landed yesterday. v9 is *The Lutar Invariant Family v1 through v7 to Omega: From Three-Term Foundation to Bianchi-Closed Fiber Bundle*. Seventeen pages. v10 is *The Audit Closure Operator Lambda-10*, eleven pages, plus an appendix essay and a one-pager. v10 is an audit paper. Its only job is to certify, layer by layer, that every formula in v9 actually executes against the live shipping repo. It introduces no new physical term. The platform audits its own thesis.

I want to note one thing about the publishing record. The May 2 release was an audit-supported rewrite that explicitly retracted a prior version after a self-audit identified residual fabrications in announcement materials. That retraction is in the public record. The v9 → v10 sequence continues the same discipline — when something needs to be checked, we publish the check."

### Key references:

- Ouroboros Runtime: `github.com/szl-holdings/ouroboros` (v6.2.0)
- Ouroboros Thesis: `github.com/szl-holdings/ouroboros-thesis` (paper-v3-2.0.0, paper-v9-1.0.0, paper-v10-1.0.0)
- DOI v3: `10.5281/zenodo.19944926`
- ORCID: `0009-0001-0110-4173`
- License: CC-BY-4.0

---

## BLOCK 5: GOVERNMENT ALIGNMENT (3 minutes)

"The work appears to align with five areas of increasing federal and state demand. Alignment statements, not claims of past performance.

First: operational transparency and auditability. The Outcome Graph and Proof Chain primitives answer the 'show your work' question every IG eventually asks. CPS makes that answer interoperable across systems.

Second: cybersecurity and risk management. The runtime treats every action as a security event. Logged, signed, replayable. The new governed adversary loop demonstrates this end-to-end in a six-step proof chain.

Third: AI governance and responsible automation. Covenant Policy gates AI outputs. The new live agent gateway enforces OPA policy at the runtime boundary. This aligns with OMB M-24-10 and the NIST AI Risk Management Framework.

Fourth: cross-system interoperability and data lineage. The three-witness reconciliation primitive gives a defensible answer to 'single trusted view of state across N systems.'

Fifth — and this is new — proof distribution to regulators. The Trust Center, Trust Exchange, and Public Trust Portal are the externally-facing surfaces for handing proof packets to regulators, auditors, and partner systems on demand. This is the surface that closes the loop on a procurement officer's evidence request."

### NIST AI RMF mapping (if she asks):

| Function | SZL Coverage |
|---|---|
| GOVERN | Validator registry, loop policy, operator modes, CPS approval tiers |
| MAP | Domain pack router, task-type routing, payload registry |
| MEASURE | Delta, consistency, uncertainty scores per step; mirror-eval; reward-hacking guardrails |
| MANAGE | Human approval gate, halt conditions, replay verification, CPS rollback |

### DoD Responsible AI Tenets (if she asks):

| Tenet | Status |
|---|---|
| Responsible | Covered — human approval at risk tier 3/4, CPS tier check |
| Equitable | Gap — bias testing plan in development |
| Traceable | Covered — full trace runtime, append-only logs, CPS receipts |
| Reliable | Covered — golden runs, replay verification, Lutar v10 audit closure |
| Governable | Covered — approval gate, halt conditions, agent gateway OPA enforcement |

---

## BLOCK 6: REGISTRATION STATUS (2 minutes)

> *(unchanged from v1)*

"The legal entity — SZL Holdings — is in good standing, single-member, US-domiciled. EIN is on file.

SAM.gov registration is pending — I need your guidance on UEI activation timeline and common rejection reasons.

Primary NAICS code 541512, Computer Systems Design Services, with secondaries at 541511, 541519, 541611, and 541690. I would like your confirmation.

I am a single-founder small business. I need your guidance on set-aside eligibility — which programs, if any, I qualify for.

CMMC Level 1 self-assessment is in progress. Cloud authorization is not yet in scope — the deployment model is on-prem or customer-cloud first."

### What NOT to claim:

- No current federal contracts
- No cloud authorization or ATO
- No DoD impact-level designation
- No external audit
- No signed platform customers
- Single-founder operation

---

## BLOCK 7: FIVE QUESTIONS FOR MERCY (5 minutes)

> *(unchanged from v1)*

1. Most credible NYS pathway? OGS centralized contract? On-call advisory pool? Subcontract / mentor-protégé under a NYS prime?
2. Same question for the federal side. SBIR Phase I as the fastest credible entry? GSA MAS via a sponsoring contract holder? Direct response to a sources-sought notice in AI governance?
3. SAM.gov UEI, CAGE, NAICS selection, small-business size standard, set-aside eligibility review. What order, what is realistic on what timeline?
4. Capability statement format — what NYS and federal procurement officers actually want to see.
5. Which agencies — NYS or federal — actually buy this kind of work, and which buy it from sole-founder firms?

> **Take notes.** Do not argue. If she says something is not realistic, believe her. If she offers a different path, pursue it.

---

## BLOCK 8: HER QUESTIONS (5 minutes)

> *(unchanged from v1)*

- Answer directly and honestly.
- If you don't know, say "I do not know."
- If she asks about revenue: "There is no platform revenue at this time. The strength of the position is the public proof — the open-source runtime and the DOI-pinned papers."
- If she asks about team: "I am a single-founder operation. There is no team to misrepresent."
- If she asks about timeline: "I am ready to move at whatever pace your guidance supports. I will hit the dates I quote."

---

## POST-MEETING ACTIONS

- [ ] Send thank-you email with the Capability Statement v2 PDF + Operational Briefing v2 PDF.
- [ ] Note every action item she gave.
- [ ] Begin SAM.gov registration if she confirmed the process.
- [ ] Begin NAICS confirmation per her guidance.
- [ ] Schedule follow-up if offered.
- [ ] Update this script with notes.

---

## VERIFIED PLATFORM NUMBERS (use these, not estimates)

| Metric | Value |
|---|---|
| Customer-facing product surfaces | **8** + A11oy orchestration layer |
| Platform primitives | 6 |
| Database tables (provisioned) | 848 |
| API endpoint declarations | 5,524 |
| Monorepo packages | 126 |
| Ouroboros packages | 28 |
| Ouroboros runtime tests | 133 |
| Ouroboros guardrails tests | 62 |
| Codex v11 nodes / typed edges | 76 / 95 |
| Security tests passing | 126 |
| CI workflows | 23 |

---

## FORBIDDEN LANGUAGE

Do not say any of the following:

- Any dollar amount not verified by `SOURCE_OF_TRUTH.md`
- Any fundraising-round language (this is not an investor pitch)
- Any claim of past government performance
- Any claim of cloud authorization, ATO, or security certification
- Any team members who do not exist
- Any revenue numbers
- Any customer names

---

End of script.
