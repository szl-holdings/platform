# Boardroom Demo Script — SZL Holdings Platform

**Runtime:** 5–7 minutes  
**Audience:** Investors, enterprise evaluators, board members  
**Route:** A11oy Investor Demo (`/a11oy/demo`)  
**Format:** Narrated live walkthrough — presenter drives, investors observe

---

## Pre-Demo Setup (2 minutes before)

1. Open `[your-deployed-url]/a11oy/demo` in a full-screen browser (1440px width recommended)
2. Have the Command Center (`/command`) open in a second tab
3. Confirm demo seed data is loaded (platform status indicators should show green)
4. Dim room lights if possible — the dark-mode interface presents better

---

## Opening (30 seconds)

> "What you're looking at is A11oy — the Brand Orchestration Layer that sits at the center of the SZL Holdings platform. Before I show you the specifics, let me give you the one-sentence thesis: enterprise AI has a trust problem. Models generate outputs. Nobody can prove the model followed the rules, respected the policy, or got the right human to sign off before something consequential happened. A11oy is the infrastructure that fixes that."

---

## Act 1: The Now Board — Live Operational State (1 minute)

*Navigate to: `/a11oy` (Now Board)*

> "This is the Now Board. Every workcell — a coordinated sequence of AI agents — is visible here in real time. The system knows which workcells are running, which are pending human approval, which have flagged a policy conflict, and which have completed with a verified proof packet."

**Point to:** Active workcell count, approval queue, MirrorEval verdict indicators

> "Notice the MirrorEval column. That's our counterfactual audit — before any AI output is acted on, a second model evaluates whether it would have reached the same conclusion under different conditions. If the verdict diverges, the workcell is flagged before it can proceed. This is determinism-first governance."

---

## Act 2: Signal Mesh — The Intelligence Layer (45 seconds)

*Navigate to: `/a11oy/signals`*

> "A11oy ingests signals from any source — market data, internal metrics, compliance events, external feeds. Each signal has a severity, a classification, and a routing policy. High-severity signals automatically trigger workcell creation with the appropriate human approval threshold."

**Point to:** Signal severity distribution, active/escalated signals, routing chain

> "The key insight: the signal doesn't get acted on because a model decided to act. It gets acted on because a policy said it should, a human confirmed it, and the proof packet was signed. Every step is recorded in the Evidence Ledger."

---

## Act 3: A Workcell in Detail (1 minute)

*Navigate to: `/a11oy/workcells` → click into a running workcell*

> "Let's look at a workcell in execution. You can see the agent sequence — each agent in the chain, what it did, what it returned, and what the next agent received. The MirrorEval verdict for this step was 'pass'. The covenant policy gate — the human-in-the-loop requirement — was satisfied by [approval at timestamp]. The proof packet is signed."

**Point to:** Agent sequence, covenant policy status, proof packet hash, MirrorEval verdict

> "This is what 'governed autonomy' means in practice. The AI acts, but it acts within a covenant — a set of conditions that must be satisfied, recorded, and verifiable. An auditor, a regulator, or an investor can look at this proof packet two years from now and reconstruct exactly what happened, who approved it, and whether the model followed the policy."

---

## Act 4: PCE Contracts — The Policy Layer (45 seconds)

*Navigate to: `/a11oy/pce`*

> "PCE stands for Policy-Carrying Execution. Every workcell is bound to a contract that specifies what the agents can do, what they cannot do, and what requires human confirmation. These contracts are versioned, auditable, and can be updated by authorized operators — not by the models themselves."

**Point to:** Contract list, approval thresholds, workcell binding

> "This is the answer to 'how do we know the AI followed the rules?' — you check the PCE contract, you check the evidence ledger, and you check the signed proof packet. The answer isn't 'trust us', it's 'here's the cryptographic receipt'."

---

## Act 5: The Outcomes View — Business Value (45 seconds)

*Navigate to: `/a11oy/outcomes`*

> "At the end of the chain, outcomes. Not just 'the model ran' — but what business objective was achieved, what the confidence score was, and whether the outcome was validated by a human reviewer. This is the loop: signal → workcell → covenant policy gate → human approval → proof-carrying execution → outcome."

**Point to:** Outcome status distribution, confidence scores, human validation indicators

---

## Closing (30 seconds)

> "What we've shown you in the last five minutes is a fully running system — demo data, but production architecture. The same infrastructure that powers this demo is what enterprise operators get: 9 domain-specific command surfaces, all connected through A11oy, all with the same proof-carrying execution model."

> "For due diligence: the source code is on GitHub, the CI suite is fully green for all non-database-dependent packages, and the security audit shows zero credentials in source. We can walk through any of that in detail."

---

## Q&A Prep

**Q: Is this live data?**  
A: The demo runs on seed data. Live data integration is operational for customers with API credentials configured. The architecture is production-ready; the data layer just needs to be connected to your systems.

**Q: How is this different from LangChain / LangGraph / CrewAI?**  
A: Those are agent orchestration frameworks. A11oy is governance infrastructure. You can run any agent framework inside an A11oy workcell. What A11oy adds is the covenant policy layer, the MirrorEval counterfactual audit, the Proof Chain evidence ledger, and the human-in-the-loop enforcement — none of which are in those frameworks.

**Q: What does enterprise deployment look like?**  
A: Single-tenant PostgreSQL, Replit Reserved VM or Azure cloud deployment (Bicep IaC templates included), OIDC/PKCE authentication connecting to your identity provider, SCIM provisioning (roadmap), and a dedicated `@szl-holdings.com` support channel.

---

*Script prepared by SZL Holdings — Task #3474 — 2026-04-25*
