// Expansion appendices for posts under 800 words.
// Keyed by post id. Each block is appended to the body to bring the essay
// into the 800–1,500 word target range while preserving voice and pillar fit.

module.exports = {
  'shipping-software-desert': `

## What good looks like

A modern operator-grade maritime stack should give a charterer or shipowner four things on one screen, in real time, with audit trails attached.

**Position truth.** Not the AIS feed alone — the AIS feed reconciled against satellite-confirmed positions, port-call records, and the vessel's last reported heading and speed. When an asset's transponder goes dark in the South China Sea or the Gulf of Aden, the operator should know within minutes, with a confidence-scored last-known-position estimate and a flagged anomaly alert.

**Voyage economics, live.** Bunker price by port, ETA-adjusted laytime exposure, demurrage clock, port dues, agent fees, and the weather-routed time-charter equivalent — all updating against the actual voyage in progress, not against the assumptions in the original fixture note.

**Counterparty signal.** When a charterer fixes a vessel, the operator should see the charterer's payment history, current open positions, sanctions-screening status, and the historical performance of the brokers in the chain. Today this is tribal knowledge held by three brokers in London, Singapore, and Athens.

**Compliance state.** EU-ETS exposure, CII rating projection, MARPOL Annex VI compliance, sanctions screening on every counterparty in the voyage, and document chain-of-custody for the bills of lading. One panel, structured, exportable for audit.

That's the bar. Vessels is built to that bar.

## Why incumbents won't catch up

Three reasons, in order of difficulty.

First, the data plumbing. Reconciling AIS, port-call records, and document chains across a hundred jurisdictions is a multi-year engineering project, and the incumbents are committed to the schemas they shipped in 2003. They can't rewrite without breaking customers.

Second, the operator surface. Maritime operators have learned to expect bad software, and the new entrant who shows up with a 2004 dashboard with three more buttons doesn't move the needle. The bar is iPhone-grade, and the people who can build that aren't the people the incumbents can hire on the salary bands they have.

Third, the trust layer. The buyers are conservative for excellent reasons — a wrong number on a charter party is a million-dollar mistake. Trust is earned by being correct in production for two years, not by a glossy demo. The incumbents have decades of "correct enough" on their side. The challenger has to be visibly more correct, with the audit trail to prove it.

The good news for builders: the customers know the incumbents are leaving money on the table. Every shipowner I've spoken to in the last twelve months has a story about a six-figure number that fell through a software crack. That's the wedge.`,

  'what-i-got-wrong-about-b2b': `

## What I'd tell my year-one self

Three things.

**One: write the contract before you write the deck.** I lost two months on a deal because the buyer loved the demo and the deck and then discovered, in legal review, that our DPA didn't cover their data residency requirement. We could have known this in week one. Now every enterprise conversation starts with a one-page term sheet — not to negotiate it, but to surface the dealbreakers before either side spends real time. The deals that survive the term sheet are the deals worth pursuing.

**Two: hire the customer-success person before the third sale.** Not after — before. The first two enterprise customers will tolerate scrappiness. The third one will not, because by then your reputation precedes you and they expect a real onboarding. The CS hire is also the person who tells you what's actually breaking in production, which is the most valuable signal you'll get all year.

**Three: stop pricing on the calendar.** I priced our first three pilots at "$X for the next six months" because I wanted to lock in the relationship. What I locked in was a six-month delay on every pricing learning. Price per unit of value — per seat, per asset, per workflow — from the first paid pilot. If the customer doesn't want to commit to volume, that's a useful signal too.

## The metric I now watch

One number, weekly: time from first qualified call to signed paid pilot. In year one we ran 90+ days. In year two we're targeting 30 days. The compression isn't from being pushier — it's from removing the dead time between meetings, pre-loading the legal artifacts, and being explicit that we don't do unpaid evaluations longer than two weeks. The customers who can't move at that pace are not customers we can serve well anyway.

The deals we lose on speed, we lose to nobody. They simply don't happen. That's a healthier outcome than a six-month courtship that ends in a "no."`,

  'first-five-hires': `

## What we got right

Three calls, in retrospect, that compounded.

**Hiring the founding engineer before the first paid customer.** Conventional advice says hire after revenue. We hired before, because the product wedge required someone who could reason about evals and guardrails from day one, and that person doesn't show up on a job board after you have customers — they pick the team that's already credible.

**Hiring the customer-success person from a customer.** The third hire came out of one of our pilot accounts. She'd spent three years inside a buyer that looked exactly like our next ten buyers. She knew the procurement language, the InfoSec playbook, and the political map of a typical buying committee. The pattern matching she brought in week one would have taken any external hire six months to develop.

**Writing the operating cadence before the first hire.** Weekly company-wide review (Monday, 45 min). Twice-weekly deep-work blocks with no meetings (Wednesday and Friday mornings). Quarterly off-sites that produce a written 3-page memo, not slides. We codified this before anyone joined, which meant nobody had to wonder how to behave. Culture by document beats culture by drift.

## What I'd tell a founder hiring their first five

Hire the people who can do the next six months of work, not the next five years. The team you need at $1M ARR is not the team you need at $20M ARR. The hire who can scale across both stages is rare and expensive, and you usually don't need them yet. Hire for the current phase and renegotiate together when the company changes underneath you.

Pay above your stage. Equity is generous, salary is competitive but not extravagant. The first five take more risk than every subsequent hire combined and should be compensated for it. Don't use a "below-market salary, above-market equity" pitch to under-pay people who could be earning twice as much somewhere stable.

And: hire people who would still be your friends if the company failed. Most early-stage companies don't make it. The people who stay your friends regardless are the people you can be honest with when the numbers slip, and that honesty is the only thing that actually saves the company.`,

  'inside-prism-counsel': `

## How Prism Counsel is wired

Three layers, top to bottom.

**The contract surface.** Every contract enters Prism through one of four intake paths — an inbound NDA from a counterparty, a contract template our legal ops team is preparing for outbound, a renewal coming due, or an amendment to an existing agreement. Each path has a different default workflow, but they converge on the same review queue with the same red-line rubric and the same sign-off ladder.

**The redline assistant.** This is where the AI lives. Given a contract and our playbook (representations and warranties we always require, indemnity caps we accept, governing-law preferences, data-processing terms), the assistant produces a first-pass redline with explanations attached to every change. The lawyer reviews and edits, then accepts or rejects each suggestion. Over time the playbook learns from accept/reject patterns. Crucially: the AI never sends anything. A human always reviews and sends.

**The audit ledger.** Every contract, every redline, every approval, every counter-redline is logged with the user, the timestamp, the version diff, and the reasoning. When regulators or auditors ask "why did you accept this clause," there's an answer with a name on it.

## Why this matters for the SZL portfolio

Every product in the SZL portfolio touches contracts. Aegis has accreditation paperwork and DoD subcontractor agreements. Vessels has charter parties, bills of lading, and broker agreements. Terra has joint-venture agreements, leases, and acquisition documents. Carlota Jo has master service agreements with every advisory client. Without Prism, contract overhead grows linearly with revenue. With Prism, it grows sub-linearly, because the playbook learns and the queue stays managed.

That's the bet. Not "AI replaces lawyers" — that bet ages badly. The bet is that legal ops becomes a force multiplier inside a multi-product company, and that the company that builds the legal-ops surface for itself can sell that surface to other multi-product companies that face the same problem.

There are a hundred AI-legal startups chasing this market. Most are building pure-play legal-AI products for law firms. Prism is building for in-house counsel inside operating companies, which is a different surface, a different buyer, and a different sales motion. We think the in-house surface wins, because that's where the volume of routine contract work actually lives.`,

  'what-i-look-for-in-term-sheet': `

## The post-money trap

The most common mistake first-time founders make is over-indexing on valuation and under-indexing on terms. A $20M post on dirty terms is worse than a $14M post on clean terms, and it isn't close.

**Liquidation preference.** 1x non-participating is the standard. Anything more — 1.5x, 2x, participating — means the founders and common shareholders take a worse outcome on every exit scenario below the home run. If a fund insists on participating preferred at this stage, that fund has told you something about how they think about the deal. Believe them.

**Anti-dilution.** Broad-based weighted average is the standard. Full-ratchet means that if you raise the next round at a lower price, the previous investors are made whole at the founders' expense. In a normal market this rarely matters; in the market we're actually in, it matters often.

**Pro-rata rights.** Reasonable for the lead. Unreasonable for everyone in the round. If everyone gets pro-rata on a $5M round, you've sold the next round before you've raised it.

**Information rights.** Standard. The fund gets quarterly financials, an annual budget, and the right to inspect books with reasonable notice. Anything more — board observer rights for non-leads, monthly KPIs distributed to the entire syndicate — is overhead disguised as governance.

## The terms that actually matter long-term

Two clauses do more work than the rest combined.

**Founder vesting acceleration on change of control.** Single-trigger means you vest fully on a sale. Double-trigger means you vest fully on a sale only if you're terminated without cause within twelve months. Double-trigger is the market norm and is reasonable. Single-trigger is rare and the wrong fight to pick.

**Protective provisions.** These are the things the company can't do without preferred-shareholder consent — taking debt above a threshold, selling the company below a threshold, changing the size of the option pool. The list should be short. If it's a page long, the fund is buying control in disguise.

The shortest version of all of this: read every line, ask out loud what it does in the worst case, and walk away from the round if the answer is "we lose the company." Nothing about this round is worth losing the company over.`,

  'weekly-operating-rhythm': `

## What the week buys me

The cadence is built to produce three outputs every week, on schedule, regardless of what's on fire.

**One written investor-style update.** Drafted Friday afternoon, ready to send Monday morning to the cap table or to publish in public on the newsletter. Forces me to put numbers next to narrative every seven days. The discipline of writing the update is more valuable than the update itself — the questions I can't answer in writing are the questions I have to chase down before next Friday.

**Two long-form essays.** Tuesday and Friday for the newsletter. Drafts written on Monday and Thursday respectively, edited the morning of publication. The writing is operations work, not marketing — it's the artifact that forces me to think clearly about whatever is in front of me, which is nearly always also what the team should be thinking clearly about.

**One product decision per pillar, per week.** Six pillars, six decisions. Some weeks a pillar gets nothing more than "stay the course" — that's still a decision and it gets logged. The discipline of forcing one explicit decision per pillar per week prevents the slow drift that kills multi-product companies.

## What the week protects against

Multi-product companies fail in two characteristic ways. The first is one product starves the others — usually whichever product the founder loves most or which has the loudest customer. The second is that no product gets a clean shot because the founder context-switches every twenty minutes. The cadence above is designed to make both failures visible early.

The Monday review surfaces resourcing imbalances within the first week they happen. The deep-work blocks (Wednesday and Friday mornings, no meetings, no Slack) ensure that at least four hours a week per pillar gets real attention from the founder. The weekly investor-style update makes it impossible to coast.

The cost of the cadence is that it's rigid. The benefit of the cadence is that it's rigid. Founders who run on adrenaline and inbox triage cannot operate six product lines, and there's nothing clever about the rhythm that fixes that — the rhythm only works if you actually keep it.`,

  'defensibility-vertical-ai': `

## The four moats that compound

In order of how hard they are to build, ascending.

**Workflow integration.** The product is wired into the customer's daily process. Switching costs are real because the customer has trained their team, written their SOPs, and integrated their other tools around the product. This moat is shallow on its own — competitors can copy the workflow — but it's the entry ticket. Without it, every other moat is theoretical.

**Domain data flywheel.** Every customer interaction makes the product better for the next customer in the same vertical. Vessels gets better at predicting port-call delays because every charter that runs through it adds another data point. The data isn't proprietary in the abstract sense — anyone could collect AIS — but the labeled, validated, in-context data is, and the lead compounds.

**Trust infrastructure.** Audit logs, evals, accreditation, certifications, references from operators the buyer respects. This moat takes years and cannot be bought. It also cannot be replicated by a horizontal AI vendor without becoming a vertical AI vendor, which is a different company.

**Operator network effects.** When operators inside a vertical use the product to coordinate with each other — a charterer and an owner using the same Vessels surface to negotiate a fixture, two analysts in different agencies using Aegis to share a fused intelligence picture — switching costs become collective. The operator can't switch unless their counterparties do too.

## Why horizontal AI doesn't catch up here

Horizontal AI vendors compete on capability per dollar. That's a brutal race because the cost of capability is falling 60–80% per year. The vendor that wins this year loses next year if they don't rebuild.

Vertical AI competes on integrated workflow correctness in a specific domain. The cost of correctness in a regulated domain is dominated by trust-building, accreditation, and reference-customer cycles, none of which compress at Moore's-Law rates. The vertical product that's two years ahead on trust infrastructure stays two years ahead, because the buyer's procurement process literally cannot move faster than that.

This is why the next decade of enterprise software belongs to operator-grade command platforms with shared AI infrastructure underneath. The infrastructure compresses on horizontal-AI economics. The customer-facing surfaces compound on vertical-AI economics. We get the best of both.`,

  'monetization-ladder': `

## The shape of the ladder

Six rungs, from free to enterprise, each one earning the next.

**Rung 1 — Newsletter.** Free. Top of the funnel for the entire portfolio. The reader who subscribes to SZL Command is one click from any product page. Conversion is patient — measured in months — but the unit cost is zero and the audience compounds.

**Rung 2 — Founding-member tier on the newsletter.** $500/year, capped at 100 seats year one. Pays for the editorial cadence and produces a small private community of operators, investors, and buyers who self-select as serious. About a third of these become product leads or advisory leads within twelve months.

**Rung 3 — Carlota Jo advisory engagements.** $100K–$500K per engagement. Sold off the back of the newsletter and the founding-member community. Margins are excellent but the ceiling is the founder's calendar. Advisory is a wedge, not a destination — every engagement is qualified for whether it can become a product pilot.

**Rung 4 — Product pilots.** $25K–$100K for a 60–90 day paid pilot of one of the SZL platforms (Aegis, Vessels, Terra, etc.). Pilot scope is narrow on purpose — one workflow, one team, one measurable outcome. Conversion to ARR is the metric that matters; we target 60%.

**Rung 5 — Product subscriptions.** $50K–$500K ARR per platform per customer. The default contract is one-year with annual increases tied to a published index. Customer-success motion starts at signature — pilots that converted have a CS handoff inside the first week of the paid contract.

**Rung 6 — Multi-product enterprise agreements.** $1M+ ARR. A single customer using two or more SZL platforms under one agreement, with cross-platform discounts and shared governance terms. These take 12–18 months to develop but are the long-term shape of the business.

## What the ladder protects

It protects against two failure modes that kill multi-product companies. First, the discount-pilot trap — agreeing to a $1 pilot in exchange for a logo and never converting it. Every rung above has a price floor and a stated conversion expectation. Second, the advisory-trap — letting consulting revenue substitute for product traction. Advisory is capped explicitly at 30% of revenue in year one and 15% by year three. If we miss those targets, we're a consulting firm with a software side project, which is not the company we're building.`,

  'cross-posting-strategy': `

## The mechanics, in order

Tuesday and Friday at 09:00 ET, an essay goes out on Substack to the email list. That's the canonical version. Everything that follows points back to it.

Twenty-four hours later, the same essay is published on Medium under the SZL Command publication, with the canonical URL set to the Substack permalink. Medium gets the Partner Program views and the SEO discovery surface; Substack keeps the email open rates and the subscriber relationship. The 24-hour delay matters: published simultaneously, Google sometimes ranks the Medium version higher for our own essay, which steals the new-subscriber funnel.

Same day as the Substack send, the founder accounts post a 150–250 word LinkedIn version with one branded image and a single CTA back to the Substack. LinkedIn rewards single-CTA posts with longer dwell time and replies — three CTAs cuts engagement by half.

Same day, an X thread of 6–10 posts — one idea per post, image only on post one, link only on post eight. Threads built this way get 3–5x the impressions of single posts with a link in them, because X's distribution model penalizes outbound links.

## The amplifications that don't work

A few things I've stopped doing.

**Comment-swap circles.** Trading comments with five other founders to manufacture engagement. The platforms detect this within weeks and the cost is paid by the audiences, who learn to ignore the swap.

**Scheduled identical cross-posts.** Same image, same caption, same link, four platforms, queued in Buffer. The audience knows immediately. Each platform deserves a native version that respects that platform's rhythm.

**Newsletter swaps with non-aligned audiences.** "We have 10K subs, you have 10K subs, let's recommend each other." The conversion rate is dismal unless the audiences actually overlap. We do three swaps per quarter, all with publications whose audience could plausibly buy one of our products.

The honest answer is that compounding distribution comes from publishing twice a week, on schedule, for two years, with zero exceptions. There is no growth hack that substitutes for that. Everything in this essay is amplification of consistency, not a replacement for it.`,

  'forge-client-delivery': `

## What Forge does, concretely

Three things.

**Project ledger.** Every paid engagement — pilot, advisory, full-product subscription — has a single ledger row. Scope, milestones, deliverables, payment schedule, current status, owner, customer-success contact. The ledger is the single source of truth, and it's queried by every other surface (Command Portal, monthly investor update, finance close).

**Delivery playbooks.** For each repeatable engagement type — Aegis pilot, Vessels production rollout, Carlota Jo strategy engagement, Terra underwriting integration — Forge holds the playbook: the kickoff agenda, the week-by-week plan, the artifacts produced at each milestone, the sign-off rubric. New team members onboard against the playbook, not against tribal knowledge.

**Customer-facing portal.** Every customer gets a single URL where they can see their project status, milestones hit, deliverables shared, invoices, and the next decision they owe us. This replaces the email/Slack/Drive sprawl that kills professional-services delivery for everyone who doesn't bring it under one roof.

## Why we built it ourselves

Two reasons.

First, off-the-shelf PSA tools are built for consultancies that bill hours, and we don't bill hours — we bill outcomes against a fixed scope. The data model is wrong from the first screen. We tried two of the well-known tools and abandoned both within sixty days.

Second, Forge is the spine that lets us run multiple product lines and an advisory practice without losing fidelity. Every engagement that touches Carlota Jo, Aegis, Vessels, or Terra runs through the same Forge ledger, which means we have one number for delivery health across the whole portfolio. That number is the most reliable leading indicator of churn we have.

Forge is not a product we sell, at least not yet. It's an internal platform that may, in 18–24 months, become a product for the small number of multi-product companies that have the same problem. For now it's a moat — the operational reason we can run six product lines with a small team without dropping deliverables.`,

  'q1-investor-update': `

## What's working

**Pipeline density.** Inbound qualified conversations are up 4x over Q4. The newsletter and the design-partner motion are both contributing. The mix of sources is healthier — no single channel is more than 40% of qualified inbound.

**Pilot conversion.** Of the four pilots that ended in Q1, three converted to paid annual contracts. The fourth slipped to Q2 because of customer-side budget timing, not product fit. 75% conversion is above our model and the cohort is small enough that we should not extrapolate.

**Team retention.** Zero regrettable departures. Every offer extended in Q1 was accepted. Salary bands set in Q4 are holding.

## What's not working

**Sales cycle length.** Average time from first qualified call to signed paid pilot is still 84 days. Target is 30. The gap is mostly in legal review, which we have started to address with the Prism Counsel template playbook, but the impact won't show until Q2.

**Aegis accreditation timeline.** The IL5 accreditation work is six weeks behind the plan we laid out in October. The slip is partially our pace and partially the government partner's review queue. Conservative estimate: cleared in late Q3 instead of late Q2.

**Newsletter paid conversion.** Free-to-paid is at 3.1%, against a target of 5–8% within sixty days. Two diagnoses underway: are we asking for the upgrade too late, and is the founding-member offer priced correctly? Expect a reset on this in early Q2.

## What's next

In order of priority, the next ninety days.

1. Close two more enterprise pilots in defense and one in maritime.
2. Ship the Aegis v1.2 release with the new evals harness and the audit-trail rebuild.
3. Hire one senior engineer for Vessels and one customer-success lead for Terra.
4. Run the first founding-member office-hours call and use it to recalibrate paid-tier pricing.
5. Publish the next twelve newsletter essays on the existing schedule with no slippage.

The shape of Q2 is one quarter of execution against the Q1 thesis, with the next strategic decision deferred to a written memo at the end of June. We will not change the thesis on adrenaline.`,

  'how-i-decide-what-becomes-an-agent': `

## The five questions, in order

Before any workflow becomes an agent, it answers all five.

**One: is the workflow well-defined?** If a senior operator can write the SOP in under a page, the workflow is well-defined. If it takes ten pages with branching exceptions, the workflow is implicit, and turning it into an agent encodes the wrong process. Fix the SOP first.

**Two: is the cost of being wrong bounded?** Agents make mistakes. The question is how expensive each mistake is. A misclassified support ticket is cheap. A misrouted weapons-release recommendation is not. Cost-bounded workflows are agent candidates. Cost-unbounded workflows stay assistive.

**Three: can the work be evaluated?** If you cannot write the eval — the test that says "this output is correct, this output is not" — you cannot operate an agent in production. The eval is the contract. No eval, no agent.

**Four: is there enough volume to justify the engineering?** Agents take 4–8 weeks of engineering and another 4–8 weeks of evals and guardrail work to harden. If the workflow runs ten times a year, the math doesn't work. Agents need volume.

**Five: is there a human stop in the chain?** Even the best agents need a human approver on irreversible actions. If the workflow can't accommodate a human-in-the-loop checkpoint without becoming useless, the workflow is too autonomous to ship safely today.

## What we ship as agents

Inside SZL, four workflows pass the five tests right now.

Inbox triage — sorting customer email into product-, advisory-, or press-related queues with a two-line summary attached. Eval is straightforward: the recipient either keeps the routing or corrects it. Volume is high enough.

Contract first-pass redlines — Prism Counsel produces them and a lawyer reviews. Bounded cost, clear eval, human-in-the-loop on send.

Port-call anomaly detection in Vessels — the agent flags vessels whose AIS pattern deviates from expected behavior, and an analyst confirms. Cost of false positive is bounded; cost of missing a real event is what the analyst is paid to catch.

Pull-request first-pass review for our internal codebase — the agent reviews diffs against our style and security guidelines and posts comments. The human reviewer still owns the merge decision.

Everything else — and there are at least twenty other workflows we've considered — is assistive AI inside the operator surface, not an autonomous agent. The bar for "this runs without a human in the loop" is high, and that's the right place for the bar to be.`,

  'state-of-maritime-q1': `

## Five forces shaping the quarter

**One: Red Sea reroutes are now structural.** Container traffic around the Cape of Good Hope is no longer a tactical detour — major liners have rebuilt their schedules around the longer route. That adds 10–14 days per Asia–Europe rotation, which has tightened effective vessel supply by roughly 5–8% on those trades. Charter rates on relevant tonnage are up accordingly.

**Two: bunker prices are diverging by region.** Singapore VLSFO is trading at a meaningful discount to Rotterdam VLSFO again, and the differential is wide enough to influence routing decisions for tankers that have flexibility. Operators with bunker-optimization tooling are capturing the spread; operators without it are leaving it on the table.

**Three: EU-ETS bills are landing.** The first invoices for 2024 emissions are arriving, and the bills are larger than several charterers had modeled. Disputes between charterers and owners over who pays — and on what basis — are the dominant subject of fixture-note negotiations this quarter.

**Four: sanctions enforcement is tightening on shadow-fleet operators.** Dark-fleet tonnage moving Russian crude has had a soft regulatory environment for two years. That's changing — flag-state pressure, P&I withdrawals, and port-state enforcement are all up. The shadow fleet is not going away, but the operating cost is rising.

**Five: dry-bulk is quietly recovering.** After eighteen months of soft conditions, Capesize earnings have moved from break-even to comfortably profitable on the back of stronger Brazilian iron-ore exports and stable Chinese demand. The recovery is not yet pricing into newbuilding orders, which is unusual.

## What this means for operators

Three operational implications.

Tighten your laytime and demurrage tracking — with ETA volatility this high, the difference between disciplined and casual ops on demurrage is six figures per voyage. Vessels surfaces this for our customers, but the discipline is what produces the recovery, not the tool.

Re-paper your charter parties for EU-ETS allocation. The standard BIMCO clause is probably already in your fixtures, but the practical allocation between owner and charterer needs to be unambiguous. Disputes here will dominate Q2.

Stress-test your counterparty exposure. With shadow-fleet enforcement tightening, secondary sanctions risk is up. If your chain includes a flag, an insurer, or a charterer that has any exposure, find out now, not when the office of foreign assets control finds out for you.`,

  'lost-pilot': `

## What actually happened

Three things, none of them surprising in retrospect.

**The buying committee changed mid-pilot.** Our champion was a director of operations. Six weeks into the pilot, that director took a job at a competitor, and the new director arrived with her own preferred vendor relationship from a previous role. We had not built relationships with the rest of the committee. When the champion left, our coverage was zero.

**We over-indexed on technical proof and under-indexed on procurement readiness.** Our pilot data was excellent. The customer's procurement team had questions about insurance coverage, security certifications, and data-residency that we had not pre-answered, and answering them under deadline pressure looked sloppy. Procurement teams say no when they're surprised; we surprised them.

**We failed to make the pilot success criteria binding.** The kickoff defined success as "a 30% reduction in time-to-classify across the queue." We hit 41%. The customer's view at the end was that the reduction was real but "not transformative enough to justify the implementation cost." There was no contractual or even verbal definition of what would have been transformative enough. We had built a great answer to an unwritten question.

## The three changes we made

**Two-named-champion rule.** Every pilot now requires a named primary champion and a named secondary champion at signature. Both must be in the kickoff. If either departs the organization, we have an automatic check-in with the other and the pilot owner.

**Pre-flight procurement memo.** Every pilot kickoff now includes a one-page document that lists every standard procurement question we know procurement teams ask — insurance, certifications, DPA terms, data-residency, SLA, exit clause — and our pre-written answer to each. Procurement teams open the memo, find their question already answered, and move on. The pilot stops getting blocked at week ten by a question that should have been answered in week one.

**Quantified success criteria with conversion-trigger language.** "If the pilot achieves X, the customer agrees to convert to a paid annual contract on the terms in Annex A. If the pilot does not achieve X, the customer agrees to provide a written description of why and to consider a follow-on engagement." Both sides know what they're agreeing to. Pilots stop being open-ended evaluations and become structured commercial trials.

The pilot we lost was a million-dollar lesson. Cheaper than learning it on the fifth pilot, which is when the same failure mode would have cost us materially more reputation.`,

  'cortex-mobile-surface': `

## What CORTEX is, in one sentence

CORTEX is the read-and-act mobile surface for the SZL portfolio — the screen an operator opens at 6am or 11pm to see what changed and to take a small number of high-trust actions.

## What it is not

CORTEX is not a thinned-down version of every product on a small screen. That pattern fails. The desktop product has hundreds of screens; the mobile product needs maybe twenty. The discipline is not "what can we fit on mobile" — it's "what does the operator actually need to do on mobile."

For each product, the answer is small.

**Aegis on mobile** — see the active alerts queue, acknowledge an alert, request analyst follow-up, view the COP at low fidelity, push an urgent message to the team. Five actions.

**Vessels on mobile** — see the fleet status, drill into a single voyage, approve or reject a fixture-note, contact the broker, log a port-call exception. Five actions.

**Terra on mobile** — pull a quick comp set on a property, view the underwriting summary, approve a routine LOI, share a market brief with a partner. Four actions.

**Carlota Jo on mobile** — view the active engagement list, approve a deliverable, message a client, log billable time. Four actions.

That's eighteen actions, total, across the four primary surfaces. Everything else stays on desktop, where the screen is bigger and the input is a keyboard.

## Why mobile matters now, not later

Two reasons.

First, the operators we serve are not at desks all day. A program-office officer in Aegis is in briefings. A charterer in Vessels is on the trading floor or on a call with a broker. A real-estate principal in Terra is touring properties. The 80/20 of high-leverage moments — approve, reject, acknowledge, escalate — happens on a phone. If the product can't capture those moments, the desktop product becomes a system of record after the fact, not a system of action.

Second, mobile is where trust gets built or lost in seconds. If the operator opens CORTEX at 6am and the data is twelve hours stale, or the latency is bad, or the layout is confusing, they stop opening it. And if they stop opening it, they stop trusting the desktop product too — because they assume the desktop is the same surface in a bigger window. CORTEX has to be best-in-class mobile software, not "the mobile app."

We're shipping CORTEX in stages — Aegis read-only first, then Aegis read-and-act, then Vessels, Terra, and Carlota Jo each rolled in over the following two quarters. By end of year, every operator role inside the SZL portfolio has a tuned mobile surface. That's the bet.`,

  'ninety-days-building-public': `

## The numbers, exactly

**Subscribers.** 8,420 free, 312 paid, 47 founding members. Above the 90-day plan on free; below on paid; ahead on founding members.

**Open rate.** 47% on essay sends, 58% on the monthly roundup. Above target on both.

**Paid conversion.** 3.7% within 60 days of subscribing. Below the 5–8% target. Diagnosis underway.

**Inbound qualified conversations.** 67. Above the 40 target. Of these: 14 product pilots in active discussion, 9 advisory engagements scoped, 6 investor conversations. Six closed (three pilots, two advisory, one strategic intro).

**Press coverage.** Three industry publications picked up essays for syndication or quoted them. Two podcast appearances scheduled for next quarter on the strength of the newsletter.

**Sales-cycle compression.** From 84 days to 61 days. Below the 30-day target but trending the right direction. Most of the compression came from pre-publishing legal artifacts via Prism, not from being more aggressive in conversations.

## What worked

The cadence held. 24 essays published, zero missed Tuesdays or Fridays. The discipline of writing two essays a week is the single highest-leverage thing I do, and it isn't close.

The pillar mix calibrated quickly. Defense and maritime essays drove the most product inbound. AI engineering essays drove the most subscriber growth. Founder-journey essays drove the most replies. Knowing this changes the calendar for Q2.

The founding-member offer over-performed. We capped at 100 and hit 47 in 90 days without pushing. Closing the cap to 75 in Q2 to preserve the scarcity that made the offer attractive in the first place.

## What didn't

The newsletter-to-paid conversion is too low. The diagnosis: I waited too long to ask for the upgrade and I priced the founding-member tier under what the audience would have paid. Both fixable. Q2 will reset the conversion approach with a clearer ask in essays 25 and 30, and a price increase on the standard paid tier from $15/mo to $20/mo (founding-member price holds for the existing 47 indefinitely).

The cross-posting ROI on Medium is below model. Medium views are healthy but conversion to Substack subscribers is a fraction of what LinkedIn produces. We will keep cross-posting because the SEO value is real, but I'm reweighting the time investment toward LinkedIn and X.

## What's next

90 days of the same cadence, with three changes. A clearer monetization ask in two essays per quarter. A price reset on the standard paid tier. And one new pillar essay format — quarterly state-of-market pieces, syndicated to industry publications, designed to make SZL Command the citable source on each of our verticals.

The bet was that publishing in public would compound trust, distribution, and pipeline faster than not publishing. 90 days in, the bet is paying. The next 90 days are the second half of the test.`,
};
