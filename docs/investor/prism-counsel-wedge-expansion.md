# Prism Counsel — Wedge and Expansion

**Audience:** Investors, Strategic Partners  
**Date:** April 2026

---

## The Wedge: NY No-Fault + Auto Injury Litigation

The initial wedge is narrow and deliberate.

**Why NY no-fault and auto injury:**

1. **High volume, structured matter type.** NY no-fault litigation is a defined, repeatable matter class with predictable claim structures, defined carrier behaviors, and established deadline frameworks. The matter data model is tractable.

2. **Carrier behavior is pattern-rich.** NY carriers managing high-volume auto claims exhibit measurable patterns — response latency, reserve behavior, adjuster assignment changes, silence windows. These patterns are the pressure signal that Prism Counsel quantifies.

3. **Worldline is immediately useful.** NY has rich public data: NYC crash records, NWS weather, NY DFS insurance complaints, NY Courts eCourts. Worldline enrichment is valuable from day one, before any proprietary data advantage builds.

4. **Deadline pressure is high and universal.** SOL in NY, discovery cutoffs, expert disclosure, trial dates — every firm has the same deadline anxiety. A system that makes deadline compliance visible and proactive has immediate, obvious value.

5. **Mid-market firms are under-served.** Large firms have custom technology. Solo practitioners don't need infrastructure. The 20-100 attorney firm handling 200-2000 active matters is the right segment — complex enough to need infrastructure, not large enough to build it internally.

The wedge creates a foothold in the segment where Prism Counsel's pressure model is immediately useful. It also establishes the proof of concept for the expansion plays.

---

## Expansion Play 1: Other NY Matter Types

Once a firm is running Prism Counsel for no-fault and auto injury, adding matter types is low-friction — same UI, same infrastructure, new pressure model configuration.

**Adjacent NY matter types:**
- Premises liability (slip and fall, construction accidents)
- Medical malpractice
- Workers' compensation
- Uninsured/underinsured motorist claims
- Products liability

Each adds a new pressure model configuration and new worldline source classes. The core infrastructure — Matter Twin, Proof Chain, Copilot, Forecast Engine, M365 connector — carries forward unchanged.

---

## Expansion Play 2: Other High-Volume States

The NY wedge creates a replicable playbook for other states with high-volume plaintiff-side insurance litigation markets.

**Next-priority states:** Florida, Texas, California, New Jersey

Each state requires:
- Jurisdiction-specific deadline frameworks
- State-specific worldline source classes (crash data, court records, weather, insurance complaints)
- Carrier behavior baseline adjustment for state-specific patterns
- SOL and discovery rule configuration

The platform layer is identical. State expansion is a configuration and data problem, not an architecture problem.

**Florida specifics:** PIP reform and assignment-of-benefits litigation creates a high-volume structured matter class similar to NY no-fault. Strong wedge candidate.

**Texas specifics:** High-volume auto injury market, significant carrier presence. Venue velocity is highly variable across counties — strong data product fit.

---

## Expansion Play 3: Defense Side

Defense-side insurance litigation firms and in-house insurance carrier legal departments face a mirror version of the problem:

- Managing inbound claims across hundreds of defense matters
- Monitoring plaintiff's counsel behavior patterns
- Tracking reserve adequacy relative to matter trajectory
- Governing AI usage in claims adjudication for regulatory compliance

The matter intelligence model inverts — what Prism Counsel reads as plaintiff pressure, the defense side reads as their own readiness and exposure signal. The infrastructure is the same. The lens is different.

Defense expansion requires:
- Defense-side matter type configurations
- Defense-specific pressure dimensions (reserve adequacy, coverage coverage defense readiness)
- Carrier claim management connector (replacing M365 sync with claim management system sync)

**Revenue potential:** Defense-side matters typically have higher average value and longer duration than plaintiff matters — higher revenue per matter.

---

## Expansion Play 4: Enterprise Legal Operations

Large law firms, in-house legal departments, and legal operations teams at insurers face an additional problem: governance at scale. With 10+ attorneys using AI tools, how do you demonstrate that every AI output was reviewed, approved, and traceable?

Prism Counsel's Proof Chain, review workflow, and audit trail are exactly the infrastructure enterprise legal ops needs for AI governance compliance. The platform can be positioned as an AI governance layer that sits above any existing legal AI usage.

This is a greenfield category with no dominant player. It is adjacent to what Prism Counsel already builds and natural for enterprise expansion.

---

## The Data Advantage

As Prism Counsel processes more matters across more firms, a proprietary data advantage builds:

- Carrier behavior patterns (aggregated, anonymized) → better baseline models for response latency and posture forecasting
- Venue velocity patterns across NY courts → better venue pressure models
- Outcome correlation data (which pressure patterns correlate with which settlement outcomes) → better forecast accuracy
- Review and approval patterns → better prioritization of review items

This data advantage is structural — it grows with usage and is not replicable by a new entrant without the matter volume.

---

## The M365 Distribution Flywheel

Each M365 deployment creates a flywheel effect:

1. Firm deploys M365 connector for document sync
2. Documents flow into Prism Counsel automatically
3. Intelligence quality improves as more matter context is available
4. Attorneys get more value → more usage → more matter coverage
5. Full Copilot deployment in Teams → attorney habit formation
6. Habit formation → switching cost → retention

The M365 distribution path creates a low-friction onboarding and a high-friction exit. Once a firm has their document library, communication sync, and attorney workflows running through Prism Counsel, migration to a competitor requires rebuilding all of that — not just switching a tool.

---

*See also:*
- *[Why Now](prism-counsel-why-now.md)*
- *[Platform Story](prism-counsel-platform-story.md)*
- *[Executive Overview](../buyer/prism-counsel-executive-overview.md)*
