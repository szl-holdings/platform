# Track F-01 — Empire APEX Pilot Pitch (Email + Sequence)

**Document ID:** PILOT-F-01
**Audience:** Empire APEX engagement contact, NYS ITS partner contacts, candidate state agencies (DOH, DFS, OGS, DTF, DCJS, ITS internal)
**Goal:** Land a paid pilot in the $25k–$75k range that gives SZL Holdings a defensible reference customer.
**Cadence:** 5-touch sequence over 21 days. No more, no less.

---

## 1. Position

The pilot is **not** "use our AI for free." It is a paid, scoped, time-boxed engagement that produces:

- A signed customer logo SZL can name in subsequent procurements
- A working production deployment that can be shown to other agencies
- A documented public-replay attestation referencing the pilot's data flow
- A reusable trust-package update derived from the pilot's specifics

The first agency that says yes is the foundation. We are not optimizing for revenue — we are optimizing for the moment we can publicly say "and now [Agency] has procured A11oy."

## 2. Pricing structure

| SKU | Scope | Price |
|---|---|---|
| **Pilot — Compliance Watcher** | A11oy public agent monitoring Federal Register / NYS Register filings + classified delta routing into agency warehouse + replay-attestation surface | $25,000 fixed, 90 days |
| **Pilot — Sentra Lite** | Sentra deployed to one critical asset class (e.g., one cloud account) with 4 playbooks + monthly trust report | $50,000 fixed, 90 days |
| **Pilot — Amaru ERP Sync** | Amaru sync between agency's ERP (Banner / Munis / Workday) and one downstream system, classified, audited | $75,000 fixed, 120 days |

All pilots include the trust documentation package, the demo video, and the public-replay surface for the run output.

## 3. Email 1 — Cold open (T+0)

> Subject: [Agency name] · 90-second Empire APEX walkthrough + a paid pilot offer
>
> [First name],
>
> The April Empire APEX pre-briefing flagged thirteen documentation gaps across our portfolio (A11oy, Sentra, Amaru). All thirteen are now closed in writing, dated, and published at szlholdings.com/governance.
>
> We also stood up a public replay-attestation endpoint at szlholdings.com/replay-attestation. It lets anyone replay any production public agent run back to its primary federal source and get a signed hash. To my knowledge, no other AI vendor in your evaluation pipeline has this surface today.
>
> I've packaged a 90-day pilot specifically scoped to [Agency]'s [data category — e.g., HR sync / Federal Register monitoring / cyber resilience]. Fixed price $[25k / 50k / 75k]. Production deployment, signed attestations, public reference.
>
> Three options for next step:
>
> 1. 30-minute walkthrough of governance.szlholdings.com — your team's choice of agenda
> 2. Scoped pilot SOW — I can send a draft within 24 hours
> 3. Decline politely so I stop emailing — a one-line "no" is welcome
>
> Whichever you prefer, I'll respect.
>
> Stephen P. Lutar Jr.
> Founder, SZL Holdings
> inquiries@szlholdings.com · [phone]

## 4. Email 2 — Resource follow-up (T+5 days, if no response)

> Subject: Two quick things, [first name] — pilot SOW draft + the trust documents
>
> [First name],
>
> Following up — wanted to drop two artifacts in your inbox without expecting a response:
>
> 1. **Empire APEX alignment summary** (one page, attached): the 13 gaps, the 13 documents, status on each. It's the easiest way for [Agency]'s privacy / security / procurement leads to see whether we're worth a deeper look.
>
> 2. **Pilot SOW draft** (also attached): 90 days, fixed price $[X], scoped to [data category]. Fully written so your contracts team can mark it up rather than start from scratch.
>
> Public proof while you're deciding:
> - Demo: szlholdings.com/demo
> - Replay endpoint: szlholdings.com/replay-attestation
> - Governance: szlholdings.com/governance
>
> Stephen
> SZL Holdings

Attachments: `nystec-alignment-onepager.pdf`, `pilot-sow-draft-[agency].pdf`

## 5. Email 3 — Honest reframe (T+12 days)

> Subject: Last note before I stop, [first name]
>
> [First name],
>
> I won't keep poking; this is the last note. I'd like to be honest with you, because I respect your time:
>
> The reason I'm pursuing this with [Agency] specifically is that you're the cleanest fit for what we built. [One specific sentence about why — e.g., "Banner sync is exactly the case Amaru is engineered for." or "DFS Part 500 is exactly the audit posture A11oy is engineered for."]
>
> If now isn't right, that's fine. If there's someone else at [Agency] who should hear this, I'd appreciate the introduction. If the answer is no, "no" is the most useful answer you can give me — better than silence — and I'll take it gracefully.
>
> Stephen
> SZL Holdings

## 6. Email 4 — Trust transfer (T+21 days, if at least one prior email opened)

> Subject: One reference + one quiet pause
>
> [First name],
>
> I'll give you breathing room. Before I do, one item that may unlock the conversation later — I've published an independent attestation letter for our most recent penetration test, our SOC 2 Type II plan, and our 72-hour incident-response procedure. They're at szlholdings.com/governance.
>
> When the moment for [Agency] is right, I'm here. inquiries@szlholdings.com.
>
> Stephen

## 7. Email 5 — 60-day re-open (if all four prior unanswered)

> Subject: Quick re-open, [first name] — three things changed since April
>
> [First name],
>
> Three updates from the last 60 days:
>
> 1. [Specific milestone — e.g., "We published the v3 thesis on arXiv at [link]; cited by [N]."]
> 2. [Specific milestone — e.g., "First reference customer announced — [name redacted by request], same data category as [Agency]."]
> 3. [Specific milestone — e.g., "Pilot price held flat for [Agency] through [date]."]
>
> If any of those reopen the conversation, I'm a 30-minute call away.
>
> Stephen
> SZL Holdings

## 8. Reply playbook

| Reply | Response |
|---|---|
| "Send me the SOW" | Same-day with `pilot-sow-template-[scoped].docx`. Calendar link for kickoff in the same email. |
| "We don't have budget" | "Understood. Two questions: when does your fiscal-year planning start, and would you sponsor the introduction to your peer at [adjacent agency] who might?" |
| "We need a SOC 2 Type II" | "Understood. Our Type II is on the 2027-Q4 calendar. In the meantime here are the compensating controls: [link to SENTRA-01 §8]. If those satisfy your auditor on a time-bound basis, we can pilot now and the Type II becomes contractually committed at SOW signing." |
| "We can't pilot a non-FedRAMP product" | "Understood. The disclosure is at A11OY-01. If FedRAMP is hard-required, we'll pause and revisit at FedRAMP Ready milestone (target Q1 2027). Would it help if I introduced you to a peer agency that doesn't have the FedRAMP requirement?" |
| "Send me to your CISO / your customer success / your support" | (Founder is all of these today.) "I am the technical and security lead at SZL. I'll personally own the engagement. Here's [calendar link]." |
| "We'd want a partner / prime to lead this" | "Happy to. Here's the prime list we're already in conversation with: [redacted]. Would you like to introduce me to [Agency]'s preferred prime?" |
| "Are you a one-person company?" | (Be direct.) "Yes today. Hire #1 and #2 are scheduled for [Q3 2026]. I am hyper-aware of the bus-factor and we have the IR procedure that names the outside advisors and counsel on retainer. The honest disclosure is in `A11OY-05` §10. If a single-founder company is a deal-breaker for [Agency], I'd rather know now than waste your team's evaluation cycles." |

## 9. Target list (priority)

| Tier | Org | Why | Door |
|---|---|---|---|
| 1 | NYS Office of Information Technology Services (ITS) | Substrate for all NYS agencies; if Empire APEX blesses one engagement, ITS is the procurement vehicle | Direct via Empire APEX contact |
| 1 | NYS Department of Financial Services | DFS Part 500 is exactly Sentra's posture; NY DFS is the most-respected state regulator | Industry contacts; LinkedIn |
| 2 | NYS Department of Health | Amaru COTS-ERP scenario lives here; HIPAA + state privacy law overlap | Empire APEX introduction |
| 2 | NYS Department of Taxation and Finance | Federal Register / NYS Register monitoring is high-value for them | Empire APEX introduction |
| 2 | NYS Office of General Services | Procurement vehicle; sets the precedent for other agencies | Empire APEX introduction |
| 3 | Cuomo-era cyber-resilience initiatives at NYC | Sentra fit; civic-tech network | LinkedIn / NYC CTO office |
| 3 | CT / NJ / MA peer-state ITS | Halo effect from a NYS reference | After NYS lands |
| 3 | Federal — small agency for a CUI-bearing pilot | A11oy-US (GovCloud) deployment proof | After NYS lands; via prime |

## 10. Calendar discipline

- 1 outbound *new-target* email per business day, max.
- All in-flight conversations get same-day responses.
- Friday afternoon = no new outbound (low response rate; high noise).
- Monday morning = re-open day for pause-targets at the right cadence.
- Every reply triggers the right response template from §8.

## 11. The win condition

A signed pilot SOW from one Tier-1 agency at any of the three price points by **2026-07-31**. That signature pays for the next two quarters of compliance work and unlocks the rest of the procurement pipeline. Everything else in the 30/60/90 plan exists in service of this win condition.

## 12. Honest disclosure

We are a single-founder company. No procurement officer is going to procure us casually. The trust posture in Track A, the demo in Track B, the proof surface in Track C, and the copy rewrite in Track D are the *minimum* SZL has to ship before this pilot pitch is credible — not optional adjuncts.
