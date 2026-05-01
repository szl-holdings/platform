# Ouroboros v4 — IP Roadmap
### Provisional patent, trademark, copyright, and trade-secret strategy

**Author:** Stephen P. Lutar
**Date:** May 1, 2026
**Posture:** Defensive-first, with selective offensive filings on the novel formula and the integration adapters.

**Disclaimer.** I am not your IP attorney. This is a builder's strategy memo. Engage a registered patent agent (USPTO bar) before filing anything. The strategy below assumes US-first with PCT extension; adjust if international markets are primary.

---

## What you have that is protectable

| Asset | Type | Protection path | Priority |
|---|---|---|---|
| **Lutar Invariant** \( \Lambda = C^\alpha H^\beta R^\gamma F^\delta \) with Egyptian inspectability axiom | Method / mathematical formula | Provisional patent (method claim), copyright on proof + code, defensive publication | **P0** |
| **Frustum reconciliation primitive** for three-witness handoff | Method / system | Provisional patent (method + system claims) | **P0** |
| **Egyptian inspectable threshold decomposition** (RMP 2/n applied to runtime alerts) | Method | Provisional patent (method claim) | **P1** |
| **Doubling-multiplication HSM accumulator** (shift-add over secp256k1 prime) | Method / system | Provisional patent (system claim) | **P1** |
| **`@workspace/anchor` driver model** (LOCAL / REKOR / INTERNAL_HSM uniform interface) | Software architecture | Copyright + trade secret on driver internals | **P1** |
| **Ten/fourteen-primitive runtime envelope** | Compiled trade dress | Trademark on naming, copyright on docs, defensive publication | **P2** |
| **OUROBOROS** name and logo | Trademark | USPTO TEAS Plus, Class 9 (software) and Class 42 (SaaS) | **P0** |
| **LUTAR INVARIANT** as a named scientific contribution | Trademark + academic priority | Trademark Class 9/42; arXiv preprint for academic priority | **P0** |
| **`packages/horizon`, `packages/resonance`, `packages/reconciliation`, `packages/invariant`** source code | Copyright | Already protected on creation; register with USCO for damages | **P1** |
| **NOT_THIS commitments** (no AGI / consciousness / over-unity claims) | Reputational asset | Public defensive publication | **P2** |

## Critical truth about software / formula patents

**Pure mathematical formulas are not patentable in the US** (Alice Corp. v. CLS Bank, 2014; Mayo v. Prometheus, 2012). However, a *method that applies* a novel formula to produce a concrete technical result is patentable. The Lutar Invariant on its own is a math claim; **"a method for computing a runtime-trust scalar in a distributed AI system, comprising [the four-axis weighted geometric mean with Egyptian-inspectable weight verification]"** is patentable as a method claim.

This is exactly how IBM patents algorithms, how Google patents PageRank, how every cryptocurrency company patents consensus algorithms. The trick is the technical-application framing.

## Phase 1 — Defensive priority (this week)

**Goal:** Establish priority on every novel claim before any further public disclosure.

### Action 1: arXiv preprint of OUROBOROS_THESIS_V4.md
**Owner:** You. **Cost:** $0. **Time:** 1 day to format LaTeX, 1 day moderator review.
- Submit to cs.CR (primary), cs.AI (secondary), math.HO (tertiary).
- arXiv submission timestamp = academic priority date. This is the cheapest form of priority and it stops anyone from claiming they invented it later.
- Do this **before** the patent filing, because public disclosure starts the 12-month US grace period and you will file inside that window.

### Action 2: Zenodo deposit of the v4 payload
**Owner:** You. **Cost:** $0. **Time:** 30 minutes.
- Bump the existing DOI 10.5281/zenodo.19934129 to a v4 release.
- Include the zip + thesis + LUTAR_INVARIANT.md. Zenodo gives you a DOI per release — that is your tamper-evident timestamp.

### Action 3: USPTO trademark filings
**Owner:** You (or a flat-fee TM attorney for $400–$800). **Cost:** $250 per class per mark via TEAS Plus.
- **OUROBOROS** — Class 9 (software) and Class 42 (SaaS / hosted services). $500 total.
- **LUTAR INVARIANT** — Class 9 and Class 42. $500 total.
- Optional: **A11OY**, **AMARU**, **SENTRA** if those are products you own.
- Total: $1000–$2500 in filing fees.

### Action 4: Domain registration sweep
**Owner:** You. **Cost:** $50–$200/year.
- ouroboros.dev, ouroboros.ai, lutarinvariant.com, .ai, .dev. Do it before the preprint goes public.

**Phase 1 budget: under $2500. Time: 7 days.**

## Phase 2 — Provisional patents (within 30 days of Phase 1)

A provisional patent application (PPA) is a placeholder. It costs $130 (micro-entity) or $260 (small entity) per filing. It buys you 12 months to convert to a full non-provisional. You can mark "patent pending" the day you file.

### Filing 1 — Method for runtime-trust scalar aggregation (the Lutar Invariant)
**Claim shape.** "A method for aggregating a runtime-trust scalar in a distributed computing system, comprising: receiving four normalized observables [C, H, R, F] from independent measurement sources; computing a weighted geometric mean using exponents that are individually expressible as a finite sum of distinct unit fractions; validating that the unit-fraction sum of all exponents equals one exactly using rational arithmetic; producing a scalar in [0, 1] representing aggregate trust; and emitting an audit record containing the formula, the weights, and the bound theorem witness."

**Novelty.** The Egyptian inspectability constraint on weights is not in any prior art on weighted geometric means or trust aggregation.

**Cost:** $260 + $1500–$3000 attorney prep = **$2000–$3500**.

### Filing 2 — Method for three-witness reconciliation in distributed AI handoffs
**Claim shape.** "A method for reconciling three independent witness views of a distributed handoff event, comprising: receiving leaf sets from three witnesses; computing union and intersection volumes; rendering a frustum-formula audit record of form V_T = (h/3)(a² + ab + b²); emitting a verdict {RECONCILED, DIVERGENT, INSUFFICIENT}; and routing the handoff to one of {PROCEED, QUARANTINE, ABORT} based on the verdict."

**Novelty.** No prior runtime governance system uses three-witness Jaccard reconciliation with the MMP-14 frustum-formula audit record.

**Cost:** $260 + $1500–$3000 attorney prep = **$2000–$3500**.

### Filing 3 — System for HSM accumulator using shift-add only
**Claim shape.** "A system for maintaining a tamper-evident accumulator inside an HSM-constrained environment, comprising: a register holding the current accumulator value modulo a prime; an append operation that applies Egyptian-doubling multiplication using only shift and add primitives; and an external re-derivation operation for auditor verification."

**Novelty.** Egyptian doubling is 4000 years old, but applying it as the primitive substrate for an HSM-constrained governance accumulator is novel framing.

**Cost:** $260 + $1500–$3000 attorney prep = **$2000–$3500**.

**Phase 2 budget: $6000–$10500. Time: 30 days.**

## Phase 3 — Selective non-provisional conversion (within 12 months)

Convert the strongest provisional(s) to full non-provisional applications. Costs jump:

- **Non-provisional filing fee** (small entity): ~$800.
- **Examination fee:** ~$1200.
- **Attorney drafting + prosecution:** $8000–$15000 per application over the 18–36-month examination cycle.
- **PCT international extension** (if you want non-US protection): $4000 filing + $20K–$40K national phase entry across major jurisdictions.

**Recommendation:** Convert Filing 1 (the Lutar Invariant method) for sure. Convert Filings 2 and 3 only if a customer or an investor specifically asks for them or if a competitor begins shipping a near-clone.

**Phase 3 budget: $10000–$25000 per application converted. Time: 12–18 months.**

## Phase 4 — Trade secrets and copyright registration

### Trade secret discipline
The Lutar Invariant's *formula* is now public (this is correct — academic priority requires disclosure). The *implementations* you build for paying customers can carry trade-secret value:
- Customer-specific weight tunings.
- Production-grade adapters for proprietary HSMs.
- Customer telemetry pipelines.

Maintain an internal **Trade Secret Register**. Mark internal docs CONFIDENTIAL. Use NDAs with all contractors. This is mostly hygiene, not paperwork.

### Copyright registration with US Copyright Office
Optional but recommended for the source code and the thesis. $65 per work registered.
- Register OUROBOROS_THESIS_V4 once it stabilizes.
- Register the source code of the four new packages as "Computer Program."
- Registered copyrights enable statutory damages ($750–$30K per work, up to $150K willful) — without registration you can only seek actual damages.

**Phase 4 budget: $250–$500. Time: 1 day.**

## Phase 5 — Defensive publication

For claims that you do **not** want to patent (because they are foundational and you want them free for the field), publish them in a **defensive publication**:
- IP.com Prior Art Database ($35 per disclosure).
- Or a tagged blog post with a public timestamp + git commit hash.

**Why.** Defensive publication establishes prior art so a competitor cannot patent the same idea and sue you for infringement. Use this for the four-axis envelope itself — you want anyone to be able to use the four axes; you only want a patent on the *specific compound law* and the *specific reconciliation method*.

**Recommendation:** defensively publish the four-axis envelope; keep the Lutar Invariant compound law and the frustum reconciliation method patented.

## Phase 6 — Open-source license posture

The current public repo is already licensed (BUSL-1.1 per `docs/LICENSE_STRATEGY.md`). Confirm:
- BUSL-1.1 with a 4-year change date converting to Apache 2.0.
- BUSL prohibits using the software to offer a competing managed service. This is the **Datadog / Elastic / HashiCorp** posture.
- Combined with patent claims, this is a "patent-protected open core" — open enough to be adopted, protected enough to be monetized.

## Total IP budget — first 12 months

| Phase | Cost |
|---|---|
| 1 — arXiv + Zenodo + trademark + domains | $2500 |
| 2 — Three provisional patents | $10500 |
| 3 — One non-provisional conversion (Filing 1 only) | $15000 |
| 4 — Copyright registration | $500 |
| 5 — Defensive publication | $200 |
| **Total Year 1** | **$28700** |

If budget is tight, cut to **Phase 1 + Phase 2 Filing 1 only** = $5500. That secures the Lutar Invariant priority everywhere and keeps the rest as future options.

## Recommended sequencing

| Week | Action | Cost |
|---|---|---|
| Week 1 | arXiv preprint v4 thesis | $0 |
| Week 1 | Zenodo deposit v4 payload | $0 |
| Week 1 | Engage a flat-fee patent attorney via Cognition Counsel / Gen Counsel | $0 |
| Week 1 | Trademark filings: OUROBOROS, LUTAR INVARIANT | $1000 |
| Week 1 | Domain registration sweep | $200 |
| Week 2 | Draft provisional patent on Lutar Invariant method (with attorney) | $2500 |
| Week 3 | File provisional patent | $260 |
| Week 4 | Draft + file two more provisionals (frustum, HSM accumulator) | $5000 |
| Month 3 | Copyright registrations | $300 |
| Month 6 | Defensive publication of four-axis envelope | $35 |
| Month 11 | Decide non-provisional conversion based on traction | TBD |

## What I would do today if I were you

1. **Ship the v4 zip and the thesis to arXiv tomorrow.** Establish public priority. This is free and it stops everyone.
2. **File the trademark on OUROBOROS this week.** $250 per class. Cheapest defense available.
3. **Engage a flat-fee patent attorney for one consult ($300–$500 hour).** Ask them to draft the Lutar Invariant provisional only. Filing fee + their work = under $2500 total.
4. **Pause everything else for 60 days.** Watch for traction signals. Filings 2 and 3 only if a customer asks.

## Recommended attorneys (categories, not endorsements)

- **Flat-fee patent agents** — Cognition Counsel, Gen Counsel, or any agent with a software-engineering background who will quote a fixed fee for a provisional ($1500–$2500). Avoid hourly billers for provisionals.
- **AI / IP boutique firms** — Cooley, Wilson Sonsini, and Fenwick all have AI / SaaS practices. Use them for non-provisional conversion when the time comes, not for provisionals.
- **Trademark filings** — Use TEAS Plus directly through USPTO.gov with optional review by LegalZoom or Atrium. Do not pay a full firm for trademarks unless the mark is contested.

## What this strategy explicitly does not protect against

- A bigger company shipping a competitor that is materially different (different axes, different aggregation form). Your patent is narrow on purpose; broad patents do not survive *Alice*.
- An open-source contributor in another jurisdiction reimplementing the public formula and giving it away. The formula itself is unpatentable; only the technical-application method is.
- A government program officer requiring open-source rights as a condition of award (DARPA CLARA explicitly requires this). Be ready to negotiate a license-back arrangement if you take government money.

This is fine. The goal is enough IP to defend the company at the negotiating table, not enough to dominate the field. Patents are a deterrent and a balance-sheet asset; the actual moat is the standards adoption and the customer base.
