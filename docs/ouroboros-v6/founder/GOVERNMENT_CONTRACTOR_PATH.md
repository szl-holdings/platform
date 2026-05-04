# Ouroboros v4 — Government Contractor Path
### How to push runtime trust into DARPA, NIST, DoD, NSA, IC, and the primes

**Author:** Stephen P. Lutar
**Date:** May 1, 2026
**Posture:** Solo founder with a working open-source runtime, a published proof, and zero past-performance government contracts. This is the realistic 24-month path from "no clearance, no past performance" to "named on a delivered task order."

---

## The honest baseline

You are a sole-founder small business with no past performance, no security clearance, no SAM.gov registration, and no facility clearance. That is fine. **Most successful gov-tech companies entered the market with exactly this profile.** Palantir, Anduril, Shield AI, and Rebellion Defense all started here. The path is well-trodden.

What you have:
- A working open-source runtime (`@szl-holdings/ouroboros` v6.1.0).
- 233/233 test coverage on a deployable payload.
- A novel published mathematical contribution (the Lutar Invariant).
- A thesis at DOI 10.5281/zenodo.19944926.
- A fourteen-primitive trust envelope mappable directly to NIST AI RMF and MITRE ATLAS.

What you don't have yet:
- SAM.gov / Unique Entity Identifier (UEI). **Free, ~30 minutes, do this week.**
- DUNS number (now obsolete; UEI replaced it).
- Past performance. Earned by doing work, not by buying.
- Security clearance. Earned by being sponsored on a contract that requires it.
- FCL (facility clearance). Earned by being awarded a classified contract.
- CMMC certification. Earned at award time, not before.

The standard sequence is: **register → respond → win unclassified → grow into clearance**. You are step 1.

## Phase 1 — Get registered (Week 1, $0)

### SAM.gov registration
- Go to [sam.gov](https://sam.gov), register your entity (SZL Holdings).
- Get your UEI (Unique Entity Identifier).
- Set NAICS codes: **541512** (Computer Systems Design), **541511** (Custom Computer Programming), **541715** (R&D in Physical, Engineering, Life Sciences), **541690** (Other Scientific and Technical Consulting). These cover everything you do.
- Set PSC codes: **DA01** (IT and telecom services), **DJ10** (Cybersecurity).

**Cost: $0. Time: 1 hour to fill out, 5–10 days to process.**

### CAGE code
Auto-issued with SAM registration. Five-character identifier required for all federal awards.

### Small business size standards
At your size (sole founder), you qualify for:
- **Small business** under all relevant NAICS.
- **8(a)** (if you self-identify as a socially and economically disadvantaged individual — verify eligibility at sba.gov).
- **HUBZone** (if your business is in a Historically Underutilized Business Zone — geographically dependent).
- **Small Disadvantaged Business** designation.
- **VOSB / SDVOSB** if you are a veteran (you are not based on prior context — skip).

**Recommendation:** Apply for at least the small business designation. If you qualify for 8(a), apply for that — it unlocks set-aside contracts that small businesses cannot bid on.

## Phase 2 — Identify the right vehicles (Week 2)

The DoD / IC contract landscape is fragmented. Here are the vehicles that actually match Ouroboros.

### Tier A — Direct unclassified entry points (target these first)

**1. SBIR / STTR Phase I — DARPA, NSF, AFRL, ARL, ONR**
- SBIR was reauthorized through September 2031 (signed April 13, 2026).
- Phase I awards: $50K–$314K, 6 months. Phase II: up to $2M, 24 months.
- Topics relevant to Ouroboros: AI assurance, AI testing, formal methods, trustworthy AI, software supply-chain integrity.
- **Target solicitation:** DARPA's CLARA program, current cycle deadline April 10, 2026 (passed). Watch for next cycle. Eligibility requires open-source delivery — Ouroboros is already open source.
- Other agencies: NSF SBIR (rolling), AFRL (annual cycles), ARL (semi-annual).
- **First action:** [sbir.gov](https://www.sbir.gov) — search "AI assurance," "AI testing," "AI safety," "trustworthy AI." File an Innovation 9-1-1 disclosure to get on agency radar.

**2. CDAO AI T&E BPA**
- The Chief Digital and AI Office Test & Evaluation Blanket Purchase Agreement.
- Awarded to a pool of contractors (primarily medium-large primes); subcontracting opportunities for small businesses with specific capabilities.
- **Realistic posture:** Approach the awarded primes (MetroStar, Xcelerate Solutions, Booz Allen, Leidos) as a subcontractor. They need novel tools to deliver against task orders.
- **First action:** Check [cdao.mil](https://www.cdao.mil/) for the prime list. Email each prime's small-business liaison with a one-page Ouroboros capability sheet.

**3. CDAO AI Talent 2.0 BOA**
- Basic Ordering Agreement for AI talent + management. Different from T&E but adjacent.
- Smaller subcontracting role, but a credible reference target.

**4. NIST collaborations (Cooperative R&D Agreements / CRADAs)**
- NIST released a concept note for the AI RMF Critical Infrastructure Profile on April 7, 2026.
- Public comment cycles + CRADA partnerships are a no-cost path to a cited contribution.
- **First action:** Submit named comments to the NIST AI RMF Critical Infrastructure Profile. Reference the Lutar Invariant. Get on NIST's contributor list.

### Tier B — Indirect entry via primes (the realistic 12-month path)

You do not win a major DoD contract directly. You **become a sub on a prime's win**. The primes who matter for AI assurance:

| Prime | Why they care | Entry point |
|---|---|---|
| **Booz Allen Hamilton** | Largest IC AI contractor | [bah.com/small-business](https://www.bah.com/small-business) |
| **Leidos** | DoD / IC AI integrator | leidos.com/small-business |
| **MetroStar** | CDAO BPA prime | metrostar.com |
| **Xcelerate Solutions** | CDAO AI T&E prime | xceleratesolutions.com |
| **MITRE** | FFRDC, federally funded | Engagement via MITRE ATLAS contributions |
| **CACI** | Mid-tier IC integrator | caci.com/small-business |
| **SAIC** | Defense IT and AI | saic.com/business-with-saic |
| **Raytheon (RTX) Intelligence & Space** | Major AI safety play | rtx.com/suppliers |
| **Northrop Grumman Mission Systems** | C5ISR, AI assurance | northropgrumman.com/suppliers |
| **Lockheed Martin Skunk Works** | Advanced AI work | lockheedmartin.com/suppliers |

**Approach pattern for each prime:**
1. Identify the small-business liaison or innovation-team contact via LinkedIn.
2. Send a 1-page capability statement (you have the press kit; adapt it).
3. Reference Ouroboros' open-source repo, the test count, the Zenodo DOI.
4. Ask for a 30-minute capability briefing.
5. Goal: get on their "approved capability list" so you can be cited in their next bid.

**Realistic outcome:** 1–2 primes will engage. One will eventually carry you on a bid in 6–12 months.

### Tier C — Specialized AI-assurance and IC vehicles

**OTA (Other Transaction Authority) consortiums**
- Faster, less-restrictive than FAR-based contracts.
- For AI: **Tradewinds** (CDAO's AI marketplace), **DIU** (Defense Innovation Unit).
- DIU Commercial Solutions Openings (CSO) are designed for non-traditional defense contractors. Ouroboros qualifies.
- **First action:** Browse [diu.mil/work-with-us](https://www.diu.mil/work-with-us) for open CSOs in AI safety / assurance.

**In-Q-Tel (IQT)**
- The CIA's strategic-investment arm.
- Invests in dual-use companies whose tech is relevant to the IC.
- Ouroboros — AI runtime trust with cryptographic anchoring — is exactly their thesis.
- **First action:** [iqt.org/portfolio](https://www.iqt.org/portfolio) and a warm intro via your VC network.

**NSA's NCAE Cyber Operations program**
- For specialized cybersecurity tools.
- More relevant if you grow Ouroboros into the supply-chain / formal-verification niche.

**NIST NCCoE (National Cybersecurity Center of Excellence)**
- Builds reference implementations of cybersecurity tools.
- Often partners with vendors via CRADAs.
- **First action:** [nccoe.nist.gov](https://www.nccoe.nist.gov/) — check active projects on AI / supply-chain integrity.

## Phase 3 — Build past performance (Months 1–12)

Past performance is the gating factor for almost every gov contract. You build it three ways:

1. **Win one SBIR Phase I.** A $50K–$314K award is past-performance gold. It is the entry stamp. Apply to 3–5 in the first quarter, expect 1 win.
2. **Sub on a prime's win.** Negotiate to be named in the prime's proposal, even if your share is $50K of a $5M task order. Named subcontractor work counts.
3. **Deliver one CRADA / unfunded collaboration with a federally funded research center.** MITRE, NIST, MIT Lincoln Labs, JHU/APL all run unfunded research collaborations. They produce co-authored white papers that count as past performance signals.

**Realistic timeline:** 2–4 SBIR applications submitted in Months 1–3. 1 win in Months 4–9. 1 subcontracted task order in Months 6–12. By Month 12, you have $300K–$1M in cumulative past performance and a credible bid posture.

## Phase 4 — Clearance path (Months 6–24)

You cannot get a security clearance on your own. You must be **sponsored** by a contract that requires one.

The path:
1. Win an unclassified gov contract first (Phase 3).
2. Bid on a follow-on or sister contract that requires a clearance.
3. The contracting officer / sponsor initiates the clearance request.
4. Fill out SF-86 (eApp). Background investigation runs 4–18 months depending on level.
5. Interim Secret often granted in 30–90 days; full Secret in 6–12 months; TS/SCI in 12–24 months.

**For Ouroboros specifically:** The Lutar Invariant and the runtime envelope are unclassified. You can deliver the entire product on unclassified contracts indefinitely. Pursue clearance only when a specific contract requires it. **Do not chase clearance speculatively.**

## Phase 5 — Standards engagement (parallel track, ongoing)

Government adoption follows standards. Standards engagement is free, slow, and disproportionately high-leverage.

**Targets and actions:**

| Standards body | Engagement path | First action |
|---|---|---|
| **NIST AI RMF** | Public comment cycles | Submit named comments on Critical Infrastructure Profile |
| **NIST NCCoE** | CRADA / project participation | Browse active AI projects |
| **OpenSSF / Sigstore** | GitHub contributions | PR to sigstore-go for the Rekor real-client integration |
| **OTel SIG** (OpenTelemetry semantic conventions) | Specification proposals | Draft a "AI runtime trust" semantic convention |
| **MITRE ATLAS** | Threat-matrix contributions | Submit attack patterns mitigated by Ouroboros primitives |
| **IETF SCITT** (Supply Chain Integrity, Transparency, Trust) | Working group participation | Join the WG mailing list; submit an ID |
| **ISO/IEC JTC 1 SC 42** (Artificial Intelligence) | National body engagement (ANSI rep) | Apply to the US TAG via ANSI |

**A single named contribution to NIST AI RMF is worth a year of business development.** Government program officers read NIST drafts. Your name appears = your software gets evaluated.

## Phase 6 — Capability statement (Week 1, the deliverable that opens doors)

Every government conversation starts with a 1-page capability statement. Yours should look like this:

```
SZL Holdings — Ouroboros Runtime Trust Envelope
UEI: [your UEI]    CAGE: [your CAGE]
NAICS: 541512, 541511, 541715, 541690
Small business / 8(a) [if applicable]

WHAT WE DO
A runtime-trust envelope for AI systems with fourteen primitives across
four axes (Cleanliness, Horizon, Resonance, Reconciliation) compounded
by the Lutar Invariant Λ — the unique closed-form scalar law for runtime
trust aggregation, with a published uniqueness theorem.

CORE COMPETENCIES
- AI assurance and runtime governance
- Cryptographic witness anchoring (Sigstore Rekor, HSM)
- Supply-chain integrity for AI artifacts
- NIST AI RMF–compatible trust scoring

DIFFERENTIATORS
- Open-source runtime: 233/233 tests across 8 workspaces
- Published thesis: DOI 10.5281/zenodo.19944926
- Novel mathematics: Lutar Invariant (uniqueness + bound theorem)
- Egyptian-inspectability axiom for bit-exact cross-runtime auditability

PAST PERFORMANCE
[Empty for now. Fill in as you win.]

POINTS OF CONTACT
Stephen P. Lutar, Founder
stephenlutar2@gmail.com
ORCID: 0009-0001-0110-4173
GitHub: github.com/szl-holdings/ouroboros
```

Print 50 copies. Take them to every defense / AI conference for the next 12 months.

## Phase 7 — Realistic 24-month roadmap

| Month | Action | Outcome |
|---|---|---|
| 1 | SAM.gov registration, UEI, capability statement, arXiv preprint | Registered, public priority |
| 1 | Trademark filings (Phase 1 of IP_ROADMAP) | Defensive IP secured |
| 2 | Submit 3–5 SBIR Phase I applications | Pipeline started |
| 2 | Submit named NIST AI RMF Critical Infrastructure Profile comment | Standards footprint started |
| 3 | Email 8–12 prime small-business liaisons with capability statement | First conversations |
| 4 | Provisional patent on Lutar Invariant filed | Patent pending |
| 6 | First SBIR Phase I notification (typical cycle) | Win or learn |
| 6–9 | Win 1 SBIR + sub on 1 prime task order | First past performance |
| 9 | Apply to DIU CSO if a relevant one is open | DIU pipeline |
| 12 | Submit Phase II proposal if Phase I succeeds | $1–2M follow-on |
| 12 | Engage In-Q-Tel via warm intro | Strategic conversation |
| 18 | First clearance sponsorship if required by a contract | Interim Secret |
| 24 | Cumulative past performance: $1M–$3M; 2–3 government customers | Tier 3 valuation triggered |

## What it costs

| Item | Cost |
|---|---|
| SAM.gov + UEI | $0 |
| Capability statement printing | $20 |
| 5 SBIR Phase I applications (you write them; ~80 hours each) | $0 cash, your time |
| Conference travel (3 events / year: AFCEA, AUSA, RSA Federal) | $5K–$10K |
| Optional: gov-tech BD consultant for 6 months | $30K–$60K |
| Optional: 8(a) certification consulting | $5K–$15K |

**Realistic year-1 spend: $5K–$25K cash. Year-1 time investment: 25–40% of your week if you take this seriously.**

## What I would do this week

1. **Tomorrow morning:** Register on SAM.gov. Get your UEI. (1 hour.)
2. **Tomorrow afternoon:** Print 30 capability statements. (30 minutes.)
3. **This week:** Submit named comments to the NIST AI RMF Critical Infrastructure Profile. Reference the Lutar Invariant. (4 hours.)
4. **This week:** Email 5 prime small-business liaisons with your capability statement. (3 hours.)
5. **This week:** Set up a [SBIR.gov](https://www.sbir.gov) account and watch the next 3 weeks of solicitations.
6. **By end of month:** Submit your first SBIR Phase I application. (60 hours.)
7. **By end of month:** File arXiv preprint of the v4 thesis. (4 hours.)

## What this strategy explicitly is not

- A guarantee of a contract. SBIR win rates are 10–20%. Prime sub-contracts depend on relationships.
- A path to a fast exit. Government revenue grows slowly: 2–4 years from registration to $1M ARR is typical, not exceptional.
- A substitute for commercial customers. Government revenue is a credibility multiplier on commercial revenue, not a replacement for it.
- A safe career bet. It is high-effort, high-friction, and rewards patience. The companies that succeed here treat it as a 5-year horizon.

## Why this still matters

Government adoption of an AI assurance tool is the single highest-leverage credibility signal in the field. One named NIST citation or one CDAO task-order win is worth more than ten commercial pilots in the eyes of subsequent customers. The Lutar Invariant is exactly the kind of thing that government auditors will eventually need a name for. Get it adopted before someone else's variant does.
